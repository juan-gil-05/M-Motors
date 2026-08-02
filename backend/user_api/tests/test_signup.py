from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserRegistrationTestCase(APITestCase):
    """
    Tests for User Registration API endpoint.
    """

    def setUp(self):
        # API endpoint URL 
        self.register_url = reverse('user-list')

        # Valid payload 
        self.valid_payload = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com',
            'password': 'Azerty12345.',
        }

    def test_successful_registration(self):
        """
        Verify that a user can register with valid data and password gets hashed.
        """
        response = self.client.post(self.register_url, self.valid_payload, format='json')

        # 1. Assert HTTP response status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2. Assert user creation in database
        self.assertTrue(User.objects.filter(email='john.doe@example.com').exists())

        # 3. Assert password is NOT stored as plain text (Hashed using BCrypt)
        user = User.objects.get(email='john.doe@example.com')
        self.assertNotEqual(user.password, 'Azerty12345.')
        self.assertTrue(user.check_password('Azerty12345.'))

    def test_registration_fails_if_email_already_exists(self):
        """
        Verify that registration fails with a 400 error if the email is already registered.
        """
        # Create an existing user first
        User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='Password123!',
        )

        # Try to register with the same email
        response = self.client.post(self.register_url, self.valid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_fails_with_invalid_email_format(self):
        """
        Verify that invalid email formats are rejected.
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload['email'] = 'invalid-email-format'

        response = self.client.post(self.register_url, invalid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_fails_with_weak_password(self):
        """
        Verify that weak passwords failing security rules (min 8 chars, 1 uppercase, 1 digit, 1 special char) are rejected.
        """
        weak_passwords = [
            'short1!',  # Less than 8 characters
            'no_uppercase_1!',  # Missing uppercase
            'NO_DIGIT_HERE!',  # Missing digit
            'NoSpecialChar123',  # Missing special character
        ]

        for password in weak_passwords:
            payload = self.valid_payload.copy()
            payload['password'] = password

            response = self.client.post(self.register_url, payload, format='json')

            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                msg=f'Password "{password}" should have failed validation.',
            )

    def test_registration_fails_missing_required_fields(self):
        """
        Verify that all fields are mandatory.
        """
        empty_payload = {}

        response = self.client.post(self.register_url, empty_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('email', response.data)
        self.assertIn('password', response.data)