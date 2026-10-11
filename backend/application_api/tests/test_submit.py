import uuid

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vehicle_api.models import ContractType, Fuel, Gearbox, Maker, Model, Status as VehicleStatus, Vehicle

from ..models import Application, Document, Status as ApplicationStatus


@override_settings(STORAGES={
    'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
})
class ApplicationSubmissionAPITestCase(APITestCase):
    """Test submit of application."""
    
    def setUp(self):
        self.url = reverse('application-list')
        self.user = get_user_model().objects.create_user(
            username='client@example.com',
            email='client@example.com',
            password='Password123!',
        )
        contract_type = ContractType.objects.create(name='vente')
        maker = Maker.objects.create(name='Porsche')
        model = Model.objects.create(name='911 Carrera S', year=2024, maker=maker)
        self.vehicle = Vehicle.objects.create(
            model=model,
            kilometres=12000,
            price='85000.00',
            contract_type=contract_type,
            gearbox=Gearbox.objects.create(name='Manuelle'),
            fuel=Fuel.objects.create(name='Essence'),
            status=VehicleStatus.objects.create(name='Disponible'),
        )
        self.client.force_authenticate(user=self.user)

    def valid_payload(self):
        return {
            'vehicle': str(self.vehicle.id),
            'identity_document': SimpleUploadedFile(
                'identity-card.pdf', b'%PDF-1.4 identity', content_type='application/pdf'
            ),
            'driving_license': SimpleUploadedFile(
                'driving-license.png', b'png license', content_type='image/png'
            ),
            'data_processing_consent': 'true',
        }

    def test_authenticated_user_can_submit_complete_application(self):
        response = self.client.post(self.url, self.valid_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        application = Application.objects.get()
        self.assertEqual(application.user, self.user)
        self.assertEqual(application.vehicle, self.vehicle)
        self.assertEqual(application.status.name, 'Déposé')
        self.assertTrue(application.data_processing_consent)
        self.assertEqual(application.documents.count(), 2)
        self.assertEqual(
            set(application.documents.values_list('document_type', flat=True)),
            {Document.DocumentType.IDENTITY, Document.DocumentType.DRIVING_LICENSE},
        )
        for document in application.documents.all():
            filename = document.document_path.rsplit('/', 1)[-1].rsplit('.', 1)[0]
            self.assertEqual(len(filename), 32)
            self.assertEqual(uuid.UUID(hex=filename).hex, filename)

    def test_submission_requires_both_documents(self):
        payload = self.valid_payload()
        payload.pop('driving_license')

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('driving_license', response.data)
        self.assertEqual(Application.objects.count(), 0)

    def test_submission_requires_data_processing_consent(self):
        payload = self.valid_payload()
        payload['data_processing_consent'] = 'false'

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_processing_consent', response.data)
        self.assertEqual(Application.objects.count(), 0)

    def test_submission_rejects_unsupported_document_extensions(self):
        payload = self.valid_payload()
        payload['identity_document'] = SimpleUploadedFile(
            'identity-card.exe', b'not a document', content_type='application/octet-stream'
        )

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('identity_document', response.data)
        self.assertEqual(Application.objects.count(), 0)

    def test_submission_rejects_vehicles_that_are_no_longer_available(self):
        self.vehicle.status = VehicleStatus.objects.create(name='Vendue')
        self.vehicle.save(update_fields=['status'])

        response = self.client.post(self.url, self.valid_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle', response.data)
        self.assertEqual(Application.objects.count(), 0)

    def test_anonymous_user_cannot_submit_application(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, self.valid_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Application.objects.count(), 0)
