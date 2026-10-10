from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import ContractType, Fuel, Gearbox, Maker, Model, Status, Vehicle

User = get_user_model()


class VehicleListAPITestCase(APITestCase):
    """Test vehicle listing, filtering, search, ordering, and deletion."""

    def setUp(self):
        self.list_url = reverse('vehicle-list')

        self.contract_type_sale = ContractType.objects.create(name='vente')
        self.contract_type_lease = ContractType.objects.create(name='location')
        self.status_available = Status.objects.create(name='Disponible')
        self.status_leased = Status.objects.create(name='Loué')
        self.gearbox = Gearbox.objects.create(name='Manuelle')
        self.fuel = Fuel.objects.create(name='Essence')

        ferrari = Maker.objects.create(name='Ferrari')
        audi = Maker.objects.create(name='Audi')
        bmw = Maker.objects.create(name='BMW')
        ferrari_model = Model.objects.create(
            name='G-500',
            year=2023,
            maker=ferrari,
        )
        audi_model = Model.objects.create(
            name='RS6 Avant',
            year=2024,
            maker=audi,
        )
        bmw_model = Model.objects.create(
            name='M3',
            year=2022,
            maker=bmw,
        )

        self.v1 = self._create_vehicle(
            model=ferrari_model,
            price='82400.00',
            contract_type=self.contract_type_sale,
            vehicle_status=self.status_available,
        )
        self.v2 = self._create_vehicle(
            model=bmw_model,
            price='1200.00',
            contract_type=self.contract_type_lease,
            vehicle_status=self.status_leased,
        )
        self.v3 = self._create_vehicle(
            model=audi_model,
            price='125000.00',
            contract_type=self.contract_type_sale,
            vehicle_status=self.status_available,
        )

    def _create_vehicle(self, *, model, price, contract_type, vehicle_status):
        return Vehicle.objects.create(
            model=model,
            kilometres=5000,
            gearbox=self.gearbox,
            fuel=self.fuel,
            contract_type=contract_type,
            price=price,
            status=vehicle_status,
        )

    def test_list_all_vehicles(self):
        """Anyone can retrieve the paginated list of unowned vehicles."""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 3)

    def test_filter_by_contract_type_id(self):
        """Filter vehicles using the contract type's primary key."""
        response = self.client.get(
            self.list_url,
            {'contract_type': self.contract_type_lease.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['contract_type']['id'],
            self.contract_type_lease.id,
        )
        self.assertEqual(response.data['results'][0]['model']['name'], 'M3')

    def test_filter_by_status_id(self):
        """Filter vehicles using the status's primary key."""
        response = self.client.get(
            self.list_url,
            {'status': self.status_available.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(
            {vehicle['model']['name'] for vehicle in response.data['results']},
            {'G-500', 'RS6 Avant'},
        )

    def test_search_by_maker_name(self):
        """Search through the related maker name."""
        response = self.client.get(self.list_url, {'search': 'Audi'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['model']['maker']['name'],
            'Audi',
        )
        self.assertEqual(response.data['results'][0]['model']['name'], 'RS6 Avant')

    def test_search_by_model_name(self):
        """Search through the related model name."""
        response = self.client.get(self.list_url, {'search': 'RS6'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model']['name'], 'RS6 Avant')

    def test_ordering_by_price_ascending(self):
        """Order vehicles by their price from lowest to highest."""
        response = self.client.get(self.list_url, {'ordering': 'price'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(vehicle['price']) for vehicle in response.data['results']]
        self.assertEqual(prices, [1200.0, 82400.0, 125000.0])

    def test_delete_vehicle_as_admin(self):
        """An administrator can delete a vehicle."""
        admin_user = User.objects.create_superuser(
            username='admin@m-motors.fr',
            email='admin@m-motors.fr',
            password='Password123!',
        )
        self.client.force_authenticate(user=admin_user)

        delete_url = reverse('vehicle-detail', kwargs={'pk': self.v1.pk})
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Vehicle.objects.filter(pk=self.v1.pk).exists())
        self.assertEqual(Vehicle.objects.count(), 2)
