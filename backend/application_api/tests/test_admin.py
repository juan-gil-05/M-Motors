from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
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
class AdminApplicationAPITestCase(APITestCase):
    """Test administrator access and application review endpoints."""

    def setUp(self):
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            username='admin@example.com', email='admin@example.com', password='Password123!', is_staff=True,
        )
        self.customer = user_model.objects.create_user(
            username='customer@example.com', email='customer@example.com', password='Password123!',
            first_name='Alex', last_name='Sterling',
        )
        self.other_customer = user_model.objects.create_user(
            username='other@example.com', email='other@example.com', password='Password123!',
        )
        maker = Maker.objects.create(name='BMW')
        model = Model.objects.create(name='M4 Competition', year=2025, maker=maker)
        self.vehicle = Vehicle.objects.create(
            model=model,
            kilometres=12000,
            price='85000.00',
            contract_type=ContractType.objects.create(name='vente'),
            gearbox=Gearbox.objects.create(name='Automatique'),
            fuel=Fuel.objects.create(name='Essence'),
            status=VehicleStatus.objects.create(name='Disponible'),
        )
        self.pending_status = ApplicationStatus.objects.get(name='Déposé')
        self.application = Application.objects.create(
            user=self.customer,
            vehicle=self.vehicle,
            status=self.pending_status,
            data_processing_consent=True,
        )
        self.other_application = Application.objects.create(
            user=self.other_customer,
            vehicle=self.vehicle,
            status=self.pending_status,
            data_processing_consent=True,
        )
        self.identity_path = default_storage.save(
            'applications/identity-test.pdf',
            SimpleUploadedFile('identity-test.pdf', b'%PDF-1.4 identity', content_type='application/pdf'),
        )
        Document.objects.create(
            application=self.application,
            document_type=Document.DocumentType.IDENTITY,
            document_path=self.identity_path,
            file_extension='.pdf',
        )
        self.list_url = reverse('application-list')
        self.detail_url = reverse('application-detail', args=[self.application.pk])

    def test_admin_can_list_and_filter_applications_by_status_and_contract_type(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.list_url, {'status': 'En attente', 'type': 'achat'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(
            {item['id'] for item in response.data['results']},
            {self.application.pk, self.other_application.pk},
        )

    def test_customer_only_sees_their_own_applications(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['user']['email'], self.customer.email)

    def test_admin_detail_includes_client_email_vehicle_and_documents(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], self.customer.email)
        self.assertEqual(response.data['vehicle']['model']['name'], 'M4 Competition')
        self.assertEqual(len(response.data['documents']), 1)

    def test_admin_can_approve_a_pending_application(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(reverse('application-approve', args=[self.application.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status.name, 'Validé')

    def test_admin_can_reject_with_an_optional_justification(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse('application-reject', args=[self.application.pk]),
            {'reject_justification': 'Document illisible'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status.name, 'Refusé')
        self.assertEqual(self.application.reject_justification, 'Document illisible')

    def test_non_admin_cannot_review_an_application(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(reverse('application-approve', args=[self.application.pk]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_review_an_application_twice(self):
        self.client.force_authenticate(user=self.admin)
        self.application.status = ApplicationStatus.objects.create(name='Validé')
        self.application.save(update_fields=['status'])

        response = self.client.post(reverse('application-reject', args=[self.application.pk]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_application_owner_and_admin_can_view_uploaded_documents(self):
        document = self.application.documents.get()
        url = reverse(
            'application-document-content',
            kwargs={'application_id': self.application.pk, 'document_id': document.pk},
        )

        self.client.force_authenticate(user=self.customer)
        owner_response = self.client.get(url)
        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(b''.join(owner_response.streaming_content), b'%PDF-1.4 identity')

        self.client.force_authenticate(user=self.other_customer)
        forbidden_response = self.client.get(url)
        self.assertEqual(forbidden_response.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('filename="piece-identite.pdf"', response['Content-Disposition'])
        self.assertEqual(b''.join(response.streaming_content), b'%PDF-1.4 identity')

    def test_application_detail_includes_last_updated_timestamp(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('updated_at', response.data)
        self.assertIsNotNone(response.data['updated_at'])

    def test_document_cannot_be_fetched_through_another_application_id(self):
        document = self.application.documents.get()
        self.client.force_authenticate(user=self.admin)
        url = reverse(
            'application-document-content',
            kwargs={'application_id': self.other_application.pk, 'document_id': document.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
