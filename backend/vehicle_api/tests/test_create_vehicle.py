import io
from PIL import Image as PILImage
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import override_settings
from ..models import *

User = get_user_model()

# Mock of media stockage, to avoid th requests into cloudinary
@override_settings(STORAGES={
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
})
class VehicleCreateAPITestCase(APITestCase):
    """
    Unit test suite verifying vehicle creation.
    """

    def setUp(self):
        self.url = reverse('vehicle-list')

        # Create standard and admin user instances
        self.admin_user = User.objects.create_superuser(
            username='admin@m-motors.fr',
            email='admin@m-motors.fr',
            password='Password123!'
        )
        self.regular_user = User.objects.create_user(
            username='client@m-motors.fr',
            email='client@m-motors.fr',
            password='Password123!'
        )
        # Crete standard objects instances
        self.contract_type_sale = ContractType.objects.create(name="vente")
        self.contract_type_lease = ContractType.objects.create(name="location")
        self.maker = Maker.objects.create(name="Ferrari")
        self.model = Model.objects.create(name="G-500", year=2000, maker=self.maker)
        self.fuel = Fuel.objects.create(name="Gasoil")
        self.gearbox = Gearbox.objects.create(name="Manuelle")
        self.status = Status.objects.create(name="Disponible")
        
        self.genericPayload = {
            'model': self.model.id,
            'kilometres': 15000,
            'gearbox': self.gearbox.id,
            'fuel': self.gearbox.id,
            'contract_type': self.contract_type_sale.id,
            'price': '18500.00',
            'status': self.status.id,
        }

    def _generate_test_image(self, name='test.jpg'):
        """
        Utility method to generate dummy image file in memory for test uploads.
        """
        file_obj = io.BytesIO()
        image = PILImage.new('RGB', (100, 100), color='blue')
        image.save(file_obj, 'jpeg')
        file_obj.seek(0)
        return SimpleUploadedFile(name, file_obj.read(), content_type='image/jpeg')

    def test_admin_can_create_sale_vehicle(self):
        """
        Verify successful vehicle creation for standard sale contract.
        """
        self.client.force_authenticate(user=self.admin_user)
        
        self.genericPayload.update({
            'uploaded_photos': [self._generate_test_image('p1.jpg'), self._generate_test_image('p2.jpg')],
            'cover_photo_index': 0,
        })

        response = self.client.post(self.url, self.genericPayload, format='multipart')        
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vehicle.objects.count(), 1)
        
        vehicle = Vehicle.objects.get()
        self.assertEqual(vehicle.images.count(), 2)
        self.assertTrue(vehicle.images.filter(is_main=True).exists())

    def test_admin_can_create_lease_vehicle_with_valid_details(self):
        """
        Verify successful vehicle creation for lease contract when all conditional fields are provided.
        """
        self.client.force_authenticate(user=self.admin_user)

        self.genericPayload.update({
            'contract_type': self.contract_type_lease.id,
            'lease_details': {
                "commitment_time": 36,
                "kilometres_per_year": 15000,
                "final_purchase_price": "12000.00"
            }
        })

        response = self.client.post(self.url, self.genericPayload, format='json')
        

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_lease_vehicle_fails_when_conditional_fields_missing(self):
        """
        Verify validation error occurs if lease fields are missing for 'location' contract type.
        """
        self.client.force_authenticate(user=self.admin_user)

        self.genericPayload.update({
            'contract_type': self.contract_type_lease.id,
            # 'lease_details': {
            #     "commitment_time": 36,
            #     "kilometres_per_year": 15000,
            #     "final_purchase_price": "12000.00"
            # }
        })

        response = self.client.post(self.url, self.genericPayload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lease_details_error', response.data)

    def test_non_admin_cannot_add_vehicle(self):
        """
        Verify unauthorized users cannot access vehicle creation endpoint.
        """
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.post(self.url, self.genericPayload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)