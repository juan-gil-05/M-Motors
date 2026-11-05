from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from application_api.models import Application, Status as ApplicationStatus
from vehicle_api.models import ContractType, Fuel, Gearbox, Maker, Model, Status as VehicleStatus, Vehicle


class CatalogPermissionsAndDeletionTests(APITestCase):
    """Test catalog filters, viewset permission branches, and protected deletion."""

    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(
            username="admin@example.com", email="admin@example.com", password="Admin123!"
        )
        self.customer = get_user_model().objects.create_user(
            username="customer@example.com", email="customer@example.com", password="Customer123!"
        )
        self.maker = Maker.objects.create(name="Volvo")
        self.model = Model.objects.create(name="XC60", year=2024, maker=self.maker)
        self.contract = ContractType.objects.create(name="vente")
        self.vehicle = Vehicle.objects.create(
            model=self.model,
            kilometres=10000,
            price="25000.00",
            contract_type=self.contract,
            gearbox=Gearbox.objects.create(name="Automatique"),
            fuel=Fuel.objects.create(name="Hybride"),
            status=VehicleStatus.objects.create(name="Disponible"),
        )

    def test_public_option_lists_and_model_filter_return_related_options(self):
        self.assertEqual(self.client.get(reverse("maker-list")).status_code, status.HTTP_200_OK)
        filtered_models = self.client.get(reverse("model-list"), {"maker_id": self.maker.id})
        self.assertEqual(filtered_models.status_code, status.HTTP_200_OK)
        self.assertEqual(filtered_models.data["results"][0]["maker"]["name"], "Volvo")
        self.assertEqual(self.client.get(reverse("gearbox-list")).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse("fuel-list")).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse("contractType-list")).status_code, status.HTTP_200_OK)

    def test_option_mutations_require_admin_permissions(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(reverse("maker-list"), {"name": "Saab"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse("maker-list"), {"name": "Saab"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_invalid_contract_filter_has_no_results_and_force_delete_removes_linked_records(self):
        catalog = self.client.get(reverse("vehicle-catalog-list"), {"contract_type": "invalid"})
        self.assertEqual(catalog.status_code, status.HTTP_200_OK)
        self.assertEqual(catalog.data["count"], 0)

        application = Application.objects.create(
            user=self.customer,
            vehicle=self.vehicle,
            status=ApplicationStatus.objects.create(name="Déposé"),
        )
        self.client.force_authenticate(user=self.admin)
        delete_url = reverse("vehicle-detail", args=[self.vehicle.id])
        blocked = self.client.delete(delete_url)
        self.assertEqual(blocked.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(blocked.data["message"], "Ce véhicule est lié à des dossiers en cours. Voulez-vous vraiment le supprimer ainsi que ses dossiers ?")

        deleted = self.client.delete(delete_url + "?force=true")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Application.objects.filter(id=application.id).exists())
        self.assertFalse(Vehicle.objects.filter(id=self.vehicle.id).exists())
