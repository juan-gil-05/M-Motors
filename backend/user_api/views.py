from rest_framework import viewsets
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from django.conf import settings
from django.core import signing
from django.utils.crypto import salted_hmac
import requests

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # 1. Anyone can register (POST /users/)
        if self.action == "create":
            return [AllowAny()]
        
        # 2. Only Admins can see the entire list of users (GET /users/)
        if self.action == "list":
            return [IsAdminUser()]
            
        # 3. For retrieve, update or destroy: user must be authenticated
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Security check: Normal users can ONLY see and modify their own account.
        Admins (is_staff) can see and modify everyone.
        """
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        
        # Non-admin users are restricted to their own user instance
        return User.objects.filter(id=user.id)

# Class to custom response from TokenObtainPairView
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Extra responses
        data['username'] = self.user.username
        data['is_staff'] = self.user.is_staff
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    # Require one CAPTCHA for each group of five failed login attempts.
    captcha_attempts = 5
    # The signed cookie carries short-lived state.
    state_cookie = "login_captcha_state"
    state_salt = "user_api.login_captcha_state"
    state_max_age = 30 * 60 # cookie live time : 30 minutes
 
    def _identifier_hash(self, identifier):
        # Bind the counter to the submitted username without storing it in the cookie as plain text.
        return salted_hmac(
            "user_api.login_identifier", identifier, secret=settings.SECRET_KEY
        ).hexdigest()

    def _read_state(self, request, identifier_hash):
        try:
            # Django verifies the signature and expiration before trusting cookie contents.
            state = signing.loads(
                request.COOKIES.get(self.state_cookie, ""),
                salt=self.state_salt,
                max_age=self.state_max_age,
            )
            if state.get("identifier") == identifier_hash:
                return state
        except (signing.BadSignature, AttributeError, TypeError):
            pass
        # Missing, expired, invalid, or different-user cookies start a fresh counter.
        return {"identifier": identifier_hash, "failures": 0, "captcha_passed": False}

    def _save_state(self, request, response, state):
        host = request.get_host().split(":", 1)[0].lower()
        secure_cookie = host not in {"localhost", "127.0.0.1"}
        # HttpOnly prevents frontend JavaScript from reading the counter; HTTPS uses Secure cookies.
        response.set_cookie(
            self.state_cookie,
            signing.dumps(state, salt=self.state_salt),
            max_age=self.state_max_age,
            httponly=True,
            secure=secure_cookie,
            samesite="None" if secure_cookie else "Lax",
            path="/api/token/",
        )
        return response

    def _validate_captcha(self, token):
        """Verify a CAPTCHA token with Google before allowing a login attempt."""
        if not token:
            return Response(
                {"captcha_required": True},
                status=status.HTTP_428_PRECONDITION_REQUIRED,
            )

        secret = getattr(settings, "RECAPTCHA_SECRET_KEY", "")
        if not secret:
            return Response(
                {"detail": "La vérification de sécurité est indisponible."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            verification = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": secret, "response": token},
                timeout=5,
            )
            verification.raise_for_status()
            result = verification.json()
            valid = isinstance(result, dict) and result.get("success", False)
        except (requests.RequestException, ValueError):
            valid = False

        if not valid:
            return Response(
                {"detail": "La vérification de sécurité a échoué. Veuillez réessayer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def _authenticate(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except APIException as exc:
            # SimpleJWT raises AuthenticationFailed for bad credentials; turn it
            # into a response here so the failure counter can be signed and saved.
            return self.handle_exception(exc)

    def _handle_failed_login(self, response, state, request):
        state["failures"] += 1
        captcha_was_passed = state["captcha_passed"]
        if captcha_was_passed:
            response.data["captcha_passed"] = True
        state["captcha_passed"] = False
        # Persist the updated counter so the next request can decide when to require CAPTCHA.
        response.data["captcha_required"] = state["failures"] >= self.captcha_attempts
        return self._save_state(request, response, state)

    def post(self, request, *args, **kwargs):
        identifier = str(request.data.get("username", "")).strip().casefold()
        identifier_hash = self._identifier_hash(identifier)
        state = self._read_state(request, identifier_hash)
        if state.get("captcha_passed"):
            state["failures"] = 0
            state["captcha_passed"] = False
        # Ask for CAPTCHA only after the backend has recorded the configured number of failures.
        captcha_required = state["failures"] >= self.captcha_attempts
        token = request.data.get("captcha_token")

        if captcha_required and not state["captcha_passed"]:
            captcha_error = self._validate_captcha(token)
            if captcha_error:
                return captcha_error
            state["captcha_passed"] = True
            # The CAPTCHA allows one login attempt, then a new five-failure cycle begins.
            state["failures"] = 0

        response = self._authenticate(request, *args, **kwargs)
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            # Count each bad password, including the attempt immediately after a valid CAPTCHA.
            return self._handle_failed_login(response, state, request)

        if response.status_code == status.HTTP_200_OK:
            # Successful authentication no longer needs the temporary failure counter.
            response.delete_cookie(self.state_cookie, path="/api/token/")

        return response
