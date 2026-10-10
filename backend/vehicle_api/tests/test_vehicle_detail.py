from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vehicle_api.models import *


class VehicleDetailAPITestCase(APITestCase):

    """Test vehicle retrieving details."""

    def setUp(self):
        self.sale_type = ContractType.objects.create(name='vente')
        self.lease_type = ContractType.objects.create(name='location')
        self.available = Status.objects.create(name='Disponible')
        self.fuel = Fuel.objects.create(name='Essence')
        self.gearbox = Gearbox.objects.create(name='Manuelle')
        maker = Maker.objects.create(name='Porsche')
        self.model = Model.objects.create(name='911 Carrera S', year=2024, maker=maker)

    def create_vehicle(self, contract_type):
        return Vehicle.objects.create(
            model=self.model,
            kilometres=5240,
            price='890.00',
            contract_type=contract_type,
            gearbox=self.gearbox,
            fuel=self.fuel,
            status=self.available,
        )

    def test_public_detail_includes_vehicle_attributes_and_images(self):
        vehicle = self.create_vehicle(self.sale_type)
        Image.objects.create(vehicle=vehicle, image='vehicles/front.jpg', is_main=True)

        response = self.client.get(reverse('vehicle-detail', args=[vehicle.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['model']['maker']['name'], 'Porsche')
        self.assertEqual(response.data['model']['year'], 2024)
        self.assertEqual(response.data['kilometres'], 5240)
        self.assertEqual(response.data['fuel']['name'], 'Essence')
        self.assertEqual(response.data['gearbox']['name'], 'Manuelle')
        self.assertEqual(response.data['images'][0]['is_main'], True)
        self.assertIsNone(response.data['lease_details'])

    def test_public_lease_detail_includes_contract_terms(self):
        vehicle = self.create_vehicle(self.lease_type)
        LeaseDetail.objects.create(
            vehicle=vehicle,
            commitment_time=48,
            kilometres_per_year=10000,
            final_purchase_price='85000.00',
        )

        response = self.client.get(reverse('vehicle-detail', args=[vehicle.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['contract_type']['name'], 'location')
        self.assertEqual(response.data['lease_details']['commitment_time'], 48)
        self.assertEqual(response.data['lease_details']['kilometres_per_year'], 10000)
        self.assertEqual(response.data['lease_details']['final_purchase_price'], '85000.00')

    def test_detail_returns_not_found_for_unknown_vehicle(self):
        response = self.client.get(reverse('vehicle-detail', args=[9999]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
