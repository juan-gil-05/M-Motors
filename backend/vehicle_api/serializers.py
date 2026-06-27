from rest_framework import serializers
from .models import *


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ["id", "name"]


class FuelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fuel
        fields = ["id", "name"]


class GearboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gearbox
        fields = ["id", "name"]


class ContractTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractType
        fields = ["id", "name"]


class MakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Make
        fields = ["id", "name"]


class ModelSerializer(serializers.ModelSerializer):
    maker = MakeSerializer(read_only=True)

    class Meta:
        model = Model
        fields = ["id", "name", "year", "maker"]


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ["id", "image_path", "is_main"]


class LeaseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaseDetail
        fields = [
            "id",
            "commitment_time",
            "kilometres_per_year",
            "final_purchase_price",
        ]


class VehicleSerializer(serializers.ModelSerializer):
    # Owner is read_only because the user doesn't choose it from a dropdown during creation
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    images = ImageSerializer(many=True, read_only=True)
    lease_details = LeaseDetailSerializer(read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "kilometres",
            "price",
            "created_at",
            "updated_at",
            "owner",
            "contract_type",
            "model",
            "gearbox",
            "fuel",
            "status",
            "images",
            "lease_details",
        ]

    def to_representation(self, instance):
        """
        This method intercept the output JSON (GET) and replaces simple IDs
        with full detailed objects for the frontend.
        """
        representation = super().to_representation(instance)
        representation["model"] = ModelSerializer(instance.model).data
        representation["contract_type"] = ContractTypeSerializer(instance.contract_type).data
        representation["gearbox"] = GearboxSerializer(instance.gearbox).data
        representation["fuel"] = FuelSerializer(instance.fuel).data
        representation["status"] = StatusSerializer(instance.status).data
        return representation
