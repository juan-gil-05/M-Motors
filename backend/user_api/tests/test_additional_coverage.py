from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core import signing
from django.test import RequestFactory, TestCase, override_settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase

from user_api.serializers import UserSerializer
from user_api.views import MyTokenObtainPairView

User = get_user_model()


class UserSerializerUpdateTests(TestCase):
    """Test account updates with and without a password change."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="old@example.com",
            email="old@example.com",
            password="Starting123!",
            first_name="Old",
            last_name="Name",
        )

    def test_update_changes_email_and_hashes_a_new_password(self):
        serializer = UserSerializer(
            self.user,
            data={"email": "new@example.com", "password": "Updated123!"},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_user = serializer.save()
        self.assertEqual(updated_user.email, "new@example.com")
        self.assertEqual(updated_user.username, "new@example.com")
        self.assertTrue(updated_user.check_password("Updated123!"))

    def test_update_without_email_or_password_keeps_credentials(self):
        serializer = UserSerializer(self.user, data={"first_name": "New"}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_user = serializer.save()
        self.assertEqual(updated_user.first_name, "New")
        self.assertTrue(updated_user.check_password("Starting123!"))


class LoginCaptchaStateTests(TestCase):
    """Verify signed login state, cookie flags, and CAPTCHA service outcomes."""

    @override_settings(SECRET_KEY="captcha-test-secret", RECAPTCHA_SECRET_KEY="", ALLOWED_HOSTS=["testserver", "localhost", "m-motors.example"])
    def test_signed_state_is_bound_to_the_user_and_saved_with_host_cookie_flags(self):
        view = MyTokenObtainPairView()
        identifier = view._identifier_hash("driver@example.com")
        request = RequestFactory().get("/api/token/", HTTP_HOST="localhost")
        missing_state = view._read_state(request, identifier)
        self.assertEqual(missing_state["failures"], 0)

        request.COOKIES[view.state_cookie] = signing.dumps(
            {"identifier": identifier, "failures": 4, "captcha_passed": False},
            salt=view.state_salt,
        )
        self.assertEqual(view._read_state(request, identifier)["failures"], 4)
        self.assertEqual(view._read_state(request, "another-user")["failures"], 0)
        response = view._save_state(request, Response(), missing_state)
        cookie = response.cookies[view.state_cookie]
        self.assertTrue(cookie["httponly"])
        self.assertFalse(cookie["secure"])
        self.assertEqual(cookie["samesite"], "Lax")

        production_request = RequestFactory().get("/api/token/", HTTP_HOST="m-motors.example")
        production_response = view._save_state(production_request, Response(), missing_state)
        self.assertTrue(production_response.cookies[view.state_cookie]["secure"])
        self.assertEqual(production_response.cookies[view.state_cookie]["samesite"], "None")

    @override_settings(SECRET_KEY="captcha-test-secret", RECAPTCHA_SECRET_KEY="captcha-secret")
    def test_captcha_validation_handles_missing_invalid_and_valid_tokens(self):
        view = MyTokenObtainPairView()
        self.assertEqual(view._validate_captcha(None).status_code, status.HTTP_428_PRECONDITION_REQUIRED)

        verification = Mock()
        verification.json.return_value = {"success": True}
        with patch("user_api.views.requests.post", return_value=verification) as post:
            self.assertIsNone(view._validate_captcha("valid-token"))
        post.assert_called_once()

        verification.json.return_value = {"success": False}
        with patch("user_api.views.requests.post", return_value=verification):
            self.assertEqual(view._validate_captcha("bad-token").status_code, status.HTTP_400_BAD_REQUEST)
        with patch("user_api.views.requests.post", side_effect=ValueError("invalid response")):
            self.assertEqual(view._validate_captcha("bad-response").status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(SECRET_KEY="captcha-test-secret", RECAPTCHA_SECRET_KEY="")
    def test_captcha_validation_reports_unconfigured_service(self):
        response = MyTokenObtainPairView()._validate_captcha("any-token")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class LoginCaptchaEndpointTests(APITestCase):
    """Cover CAPTCHA activation after repeated failures and successful recovery."""

    def setUp(self):
        self.url = "/api/token/"
        self.password = "Correct123!"
        self.user = User.objects.create_user(
            username="driver@example.com",
            email="driver@example.com",
            password=self.password,
        )

    @override_settings(SECRET_KEY="captcha-test-secret", RECAPTCHA_SECRET_KEY="captcha-secret")
    def test_five_failures_require_captcha_then_allow_one_login_attempt(self):
        payload = {"username": "driver@example.com", "password": "wrong"}
        for _ in range(5):
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data["captcha_required"])

        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_428_PRECONDITION_REQUIRED)

        verification = Mock()
        verification.json.return_value = {"success": True}
        with patch("user_api.views.requests.post", return_value=verification):
            captcha_payload = {**payload, "captcha_token": "verified"}
            response = self.client.post(self.url, captcha_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data["captcha_passed"])
        self.assertFalse(response.data["captcha_required"])

        success_payload = {"username": "driver@example.com", "password": self.password}
        response = self.client.post(self.url, success_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.cookies["login_captcha_state"].value, "")
