from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class LoginAPITestCase(APITestCase):
    """
    Tests for User Login API endpoint.
    """

    def setUp(self):
        # API endpoint URL 
        self.login_url = reverse('get_token') 
        self.user_password = 'Password123!'
        
        # test user in temporary database
        self.user = User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password=self.user_password,
            first_name='John',
            last_name='Doe'
        )

    def test_successful_login(self):
        """
        Verify that a user can authenticate with correct credentials.
        """
        payload = {
            'username': 'john.doe@example.com',
            'password': self.user_password,
        }

        response = self.client.post(self.login_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_fails_with_invalid_password(self):
        """
        Verify that login fails with incorrect password and returns generic error message.
        """
        payload = {
            'username': 'john.doe@example.com',
            'password': 'WrongPassword123!',
        }

        response = self.client.post(self.login_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Check that generic error is returned to prevent brute force attacks
        self.assertEqual(
            response.data['detail'],
            'No active account found with the given credentials'
        )

    def test_login_fails_with_non_existent_username(self):
        """
        Verify that login fails with unknown username and returns the correct generic error message.
        """
        payload = {
            'username': 'nonexistent@example.com',
            'password': self.user_password,
        }

        response = self.client.post(self.login_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Assert message is identical to invalid password response
        self.assertEqual(
            response.data['detail'],
            'No active account found with the given credentials'
        )

    def test_login_fails_missing_fields(self):
        """
        Verify that submitting empty fields returns 400 Bad Request.
        """
        response = self.client.post(self.login_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('password', response.data)