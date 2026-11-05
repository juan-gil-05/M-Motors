import io
from PIL import Image as PILImage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.http import QueryDict
from django.test import TestCase, override_settings
from rest_framework.exceptions import ValidationError

from vehicle_api.models import ContractType, Fuel, Gearbox, Image, LeaseDetail, Maker, Model, Status, Vehicle
from vehicle_api.serializers import VehicleSerializer


@override_settings(STORAGES={
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
})
class VehicleSerializerHelperTests(TestCase):
    """Cover multipart normalization, nested payload parsing, and serializer mutations."""

    def setUp(self):
        self.sale = ContractType.objects.create(name="vente")
        self.lease = ContractType.objects.create(name="location")
        self.maker = Maker.objects.create(name="Audi")
        self.model = Model.objects.create(name="A4", year=2023, maker=self.maker)
        self.fuel = Fuel.objects.create(name="Hybride")
        self.gearbox = Gearbox.objects.create(name="Automatique")
        self.status = Status.objects.create(name="Disponible")

    def _vehicle(self, contract=None):
        return Vehicle.objects.create(
            model=self.model,
            kilometres=10000,
            gearbox=self.gearbox,
            fuel=self.fuel,
            contract_type=contract or self.sale,
            price="20000.00",
            status=self.status,
        )

    @staticmethod
    def _image(name):
        buffer = io.BytesIO()
        PILImage.new("RGB", (12, 12), color="red").save(buffer, format="JPEG")
        return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/jpeg")

    def test_normalizes_dict_and_preserves_all_multipart_uploads(self):
        uploads = [self._image("one.jpg"), self._image("two.jpg")]
        query = QueryDict(mutable=True)
        query.setlist("uploaded_photos", uploads)
        query.update({"price": "10000"})
        normalized = VehicleSerializer._normalize_input_data(query)
        self.assertEqual(normalized["uploaded_photos"], uploads)
        self.assertEqual(VehicleSerializer._normalize_input_data({"price": "100"})["price"], "100")

    def test_parses_lease_and_image_json_and_handles_invalid_payloads(self):
        payload = {"lease_details": '{"commitment_time":"36","final_purchase_price":""}', "images": '[{"id": 1}]'}
        VehicleSerializer._parse_lease_details(payload)
        VehicleSerializer._parse_images(payload)
        self.assertEqual(payload["lease_details"]["final_purchase_price"], None)
        self.assertEqual(payload["images"], [{"id": 1}])

        invalid_lease = {"lease_details": "{"}
        VehicleSerializer._parse_lease_details(invalid_lease)
        self.assertIsNone(invalid_lease["lease_details"])
        non_object_lease = {"lease_details": '["not", "an object"]'}
        VehicleSerializer._parse_lease_details(non_object_lease)
        self.assertEqual(non_object_lease["lease_details"], ["not", "an object"])
        with self.assertRaises(ValidationError):
            VehicleSerializer._parse_images({"images": "not-json"})
        VehicleSerializer._parse_images({"images": [{"id": 1}]})

    def test_create_rejects_missing_lease_details_and_creates_sale_with_uploaded_photos(self):
        serializer = VehicleSerializer()
        with self.assertRaises(ValidationError):
            serializer.create({
                "model": self.model, "kilometres": 10000, "gearbox": self.gearbox,
                "fuel": self.fuel, "contract_type": self.lease, "price": "500.00", "status": self.status,
            })

        first, second = self._image("first.jpg"), self._image("second.jpg")
        vehicle = serializer.create({
            "model": self.model, "kilometres": 10000, "gearbox": self.gearbox,
            "fuel": self.fuel, "contract_type": self.sale, "price": "20000.00", "status": self.status,
            "uploaded_photos": [first, second], "cover_photo_index": 1,
        })
        self.assertEqual(vehicle.images.count(), 2)
        self.assertEqual(vehicle.images.get(is_main=True).image.name.split("/")[-1], "second.jpg")

    def test_create_and_update_lease_data_and_reconcile_image_manifest(self):
        serializer = VehicleSerializer()
        vehicle = serializer.create({
            "model": self.model, "kilometres": 10000, "gearbox": self.gearbox,
            "fuel": self.fuel, "contract_type": self.lease, "price": "500.00", "status": self.status,
            "lease_details": {"commitment_time": 36, "kilometres_per_year": 15000, "final_purchase_price": "12000.00"},
            "uploaded_photos": [self._image("cover.jpg")], "cover_photo_index": 0,
        })
        old_cover = vehicle.images.get(is_main=True)
        new_upload = self._image("new.jpg")
        update_serializer = VehicleSerializer(vehicle, data={"lease_details": {}}, partial=True)
        update_serializer.initial_data = {"lease_details": {}}
        update_serializer.update(vehicle, {
            "lease_details": {"commitment_time": 48, "kilometres_per_year": 20000},
            "images": [{"id": old_cover.id}, {"uploaded_photo_index": 0}],
            "uploaded_photos": [new_upload], "cover_photo_index": 1,
        })
        vehicle.refresh_from_db()
        vehicle.lease_details.refresh_from_db()
        self.assertEqual(vehicle.lease_details.commitment_time, 48)
        self.assertEqual(vehicle.images.count(), 2)
        self.assertTrue(vehicle.images.get(image__endswith="new.jpg").is_main)

        clear_serializer = VehicleSerializer(vehicle, data={"lease_details": None}, partial=True)
        clear_serializer.initial_data = {"lease_details": None}
        clear_serializer._update_lease_details(vehicle, None)
        self.assertFalse(LeaseDetail.objects.filter(vehicle=vehicle).exists())

    def test_representation_includes_related_labels_and_nullable_lease_details(self):
        vehicle = self._vehicle()
        payload = VehicleSerializer(vehicle).data
        self.assertEqual(payload["model"]["maker"]["name"], "Audi")
        self.assertEqual(payload["contract_type"]["name"], "vente")
        self.assertEqual(payload["lease_details"], None)
