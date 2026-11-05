from rest_framework import serializers
import json
from .models import (
    ContractType,
    Fuel,
    Gearbox,
    Image,
    LeaseDetail,
    Maker,
    Model,
    Status,
    Vehicle,
)


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


class MakerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maker
        fields = ["id", "name"]


class ModelSerializer(serializers.ModelSerializer):
    maker = MakerSerializer(read_only=True)

    class Meta:
        model = Model
        fields = ["id", "name", "year", "maker"]


class ImageSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    uploaded_photo_index = serializers.IntegerField(
        min_value=0,
        required=False,
        write_only=True,
    )
    """
    Serializer exposing Cloudinary image URL.
    """
    # Cloudinary image URL will automatically be serialized as a string
    image_url = serializers.ImageField(source='image', read_only=True)

    class Meta:
        model = Image
        fields = ["id", "image_url", "is_main", "uploaded_photo_index"]
        extra_kwargs = {"id": {"read_only": False}}


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
    images = ImageSerializer(many=True, required=False)
    lease_details = LeaseDetailSerializer(required=False, allow_null=True)
    
    # Only to receive the files and the index in (POST/PUT)
    uploaded_photos = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    cover_photo_index = serializers.IntegerField(write_only=True, default=0)

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
            "uploaded_photos",
            "cover_photo_index",
        ]

    
    @staticmethod
    def _normalize_input_data(data):
        if hasattr(data, 'dict'):
            data_dict = data.dict()
            # QueryDict.dict() keeps only one value per key, so retain every uploaded file.
            if hasattr(data, 'getlist') and 'uploaded_photos' in data:
                data_dict['uploaded_photos'] = data.getlist('uploaded_photos')
        else:
            data_dict = dict(data)
        return data_dict

    @staticmethod
    def _parse_lease_details(data_dict):
        lease_details = data_dict.get('lease_details')
        if isinstance(lease_details, str) and lease_details.strip():
            try:
                parsed_lease = json.loads(lease_details)
                if isinstance(parsed_lease, dict):
                    # Treat empty form fields as omitted values for optional lease fields.
                    parsed_lease = {
                        key: None if value == "" else value
                        for key, value in parsed_lease.items()
                    }
                data_dict['lease_details'] = parsed_lease
            except (ValueError, TypeError):
                data_dict['lease_details'] = None

    @staticmethod
    def _parse_images(data_dict):
        images = data_dict.get('images')
        if isinstance(images, str):
            try:
                data_dict['images'] = json.loads(images)
            except (ValueError, TypeError) as exc:
                raise serializers.ValidationError(
                    {"images": "Must be a valid JSON list."}
                ) from exc

    def to_internal_value(self, data):
        data_dict = self._normalize_input_data(data)
        self._parse_lease_details(data_dict)
        self._parse_images(data_dict)
        return super().to_internal_value(data_dict)

    # Function to create a vehicle with the images and the lease details, in the request POST
    def create(self, validated_data):
        # Take images, lease details and cover index over the principal request
        uploaded_photos = validated_data.pop('uploaded_photos', [])
        cover_index = validated_data.pop('cover_photo_index', 0)
        lease_details_data = validated_data.pop('lease_details', None)
        
        # If the contract type is "location", the lease details musn't be empty
        if(validated_data['contract_type'].name == "location" and not lease_details_data):
            raise serializers.ValidationError(
                {"lease_details_error": "vous debez indiquer les conditions de location."}
        )
        
        # Create the vehicle
        vehicle = Vehicle.objects.create(**validated_data)
        
        # If there are the lease details, create with the vehicle we just created
        if lease_details_data and any(lease_details_data.values()):
            LeaseDetail.objects.create(vehicle=vehicle, **lease_details_data)
            
        # 2. Upload automaticaly to Cloudinary
        for index, photo_file in enumerate(uploaded_photos):
            is_main = (index == cover_index)
            # Stock the models.ImageField, and django-cloudinary-storage sends the image to Cloudinary
            Image.objects.create(
                vehicle=vehicle,
                image=photo_file,
                is_main=is_main
            )
            
        return vehicle


    def _update_lease_details(self, instance, lease_details_data):
        if lease_details_data is not None and any(lease_details_data.values()):
            lease_detail = getattr(instance, 'lease_details', None)
            if lease_detail:
                for attr, value in lease_details_data.items():
                    setattr(lease_detail, attr, value)
                lease_detail.save()
            else:
                LeaseDetail.objects.create(vehicle=instance, **lease_details_data)
        elif 'lease_details' in self.initial_data or instance.contract_type.name != "location":
            # Remove lease data only when explicitly cleared or no longer relevant to the contract.
            lease_detail = getattr(instance, 'lease_details', None)
            if lease_detail:
                lease_detail.delete()

    def _update_image_list(self, instance, images_data, uploaded_photos, cover_index):
        # The submitted image list is authoritative: omitted existing images are removed.
        keep_image_ids = [
            image_data['id'] for image_data in images_data if 'id' in image_data
        ]
        instance.images.exclude(id__in=keep_image_ids).delete()

        for index, image_data in enumerate(images_data):
            is_main = index == cover_index
            if 'id' in image_data:
                image = instance.images.get(id=image_data['id'])
                if image.is_main != is_main:
                    image.is_main = is_main
                    image.save(update_fields=['is_main'])
            else:
                # New entries refer to files by their position in uploaded_photos.
                photo_index = image_data['uploaded_photo_index']
                Image.objects.create(
                    vehicle=instance,
                    image=uploaded_photos[photo_index],
                    is_main=is_main,
                )

    def _append_uploaded_images(self, instance, uploaded_photos, cover_index):
        has_main_image = instance.images.filter(is_main=True).exists()
        for index, photo_file in enumerate(uploaded_photos):
            # Preserve the current cover; choose a new one only if the vehicle has none.
            Image.objects.create(
                vehicle=instance,
                image=photo_file,
                is_main=not has_main_image and index == cover_index,
            )

    def _update_images(self, instance, images_data, uploaded_photos, cover_index):
        if images_data is not None:
            self._update_image_list(instance, images_data, uploaded_photos, cover_index)
        elif uploaded_photos:
            self._append_uploaded_images(instance, uploaded_photos, cover_index)

    # Function to update a vehicle with the images and the lease details, in the request PUT
    def update(self, instance, validated_data):
        uploaded_photos = validated_data.pop('uploaded_photos', [])
        cover_index = validated_data.pop('cover_photo_index', 0)
        images_data = validated_data.pop('images', None)
        lease_details_data = validated_data.pop('lease_details', None)

        instance = super().update(instance, validated_data)
        self._update_lease_details(instance, lease_details_data)
        self._update_images(instance, images_data, uploaded_photos, cover_index)
        return instance
    
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
        representation["images"] = ImageSerializer(instance.images.all(), many=True).data
        representation["lease_details"] = LeaseDetailSerializer(instance.lease_details).data if hasattr(instance, 'lease_details') and instance.lease_details else None
        return representation
