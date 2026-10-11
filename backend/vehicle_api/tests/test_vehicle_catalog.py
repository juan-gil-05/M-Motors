from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vehicle_api.models import ContractType, Fuel, Gearbox, Maker, Model, Status, Vehicle


class VehicleCatalogAPITestCase(APITestCase):
    """Test vehicle catalog and filtering search"""
    
    def setUp(self):
        self.url = reverse('vehicle-catalog-list')
        self.sale = ContractType.objects.create(name='vente')
        self.lease = ContractType.objects.create(name='location')
        self.available = Status.objects.create(name='Disponible')
        self.sold = Status.objects.create(name='Vendue')
        self.fuel = Fuel.objects.create(name='Essence')
        self.diesel = Fuel.objects.create(name='Diesel')
        self.manual = Gearbox.objects.create(name='Manuelle')
        self.automatic = Gearbox.objects.create(name='Automatique')
        self.porsche = Maker.objects.create(name='Porsche')
        self.audi = Maker.objects.create(name='Audi')
        self.porsche_model = Model.objects.create(name='911 Carrera', year=2024, maker=self.porsche)
        self.audi_model = Model.objects.create(name='A4', year=2022, maker=self.audi)
        self.car = self.make_vehicle(
            model=self.porsche_model,
            price='85000.00',
            kilometres=12000,
            contract_type=self.sale,
            fuel=self.fuel,
            gearbox=self.manual,
            vehicle_status=self.available,
        )
        self.lease_car = self.make_vehicle(
            model=self.audi_model,
            price='1200.00',
            kilometres=30000,
            contract_type=self.lease,
            fuel=self.diesel,
            gearbox=self.automatic,
            vehicle_status=self.available,
        )
        self.make_vehicle(
            model=self.audi_model,
            price='50000.00',
            kilometres=1000,
            contract_type=self.sale,
            fuel=self.fuel,
            gearbox=self.manual,
            vehicle_status=self.sold,
        )

    def make_vehicle(self, *, model, price, kilometres, contract_type, fuel, gearbox, vehicle_status):
        return Vehicle.objects.create(
            model=model,
            price=price,
            kilometres=kilometres,
            contract_type=contract_type,
            fuel=fuel,
            gearbox=gearbox,
            status=vehicle_status,
        )

    def test_catalog_lists_only_available_unowned_vehicles(self):
        User = get_user_model()
        owner = User.objects.create_user(username='owner@example.com', password='Password123!')
        self.car.owner = owner
        self.car.save(update_fields=['owner'])

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.lease_car.id)

    def test_catalog_filters_by_maker_budget_mileage_year_fuel_gearbox_and_contract(self):
        response = self.client.get(self.url, {
            'maker': self.porsche.id,
            'min_price': 80000,
            'max_price': 90000,
            'max_kilometres': 15000,
            'year': 2024,
            'fuel': self.fuel.id,
            'gearbox': self.manual.id,
            'contract_type': self.sale.id,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.car.id)

    def test_catalog_sorts_price_ascending_or_descending(self):
        ascending = self.client.get(self.url, {'ordering': 'price'})
        descending = self.client.get(self.url, {'ordering': '-price'})

        self.assertEqual(ascending.status_code, status.HTTP_200_OK)
        self.assertEqual(descending.status_code, status.HTTP_200_OK)
        self.assertEqual(ascending.data['results'][0]['id'], self.lease_car.id)
        self.assertEqual(descending.data['results'][0]['id'], self.car.id)

    def test_catalog_can_include_sale_and_lease_contracts_together(self):
        response = self.client.get(self.url, {
            'contract_type': f'{self.sale.id},{self.lease.id}',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_catalog_returns_empty_results_for_no_matches(self):
        response = self.client.get(self.url, {'maker': 99999})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])
