from rest_framework import serializers
from .models import *
import json


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
    # Require to false in order to update the images, see update function in vehicleSerialaizer
    id = serializers.IntegerField(required=False)
    """
    Serializer exposing Cloudinary image URL.
    """
    # Cloudinary image URL will automatically be serialized as a string
    image_url = serializers.ImageField(source='image', read_only=True)
    class Meta:
        model = Image
        fields = ["id", "image_url", "is_main"]
        extra_kwargs = {"id" : {"read_only" : False}}
        

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

    
    def to_internal_value(self, data):
        # 1. copy of data in Request/QueryDict
        if hasattr(data, 'dict'):
            # transform the QueryDict in python dict
            data_dict = data.dict()
            # if images are sent, they are stocked in dictionary
            if hasattr(data, 'getlist') and 'uploaded_photos' in data:
                data_dict['uploaded_photos'] = data.getlist('uploaded_photos')
        else:
            data_dict = dict(data)

        # 2. transform lease_details into JSON format
        lease_details = data_dict.get('lease_details')
        if isinstance(lease_details, str) and lease_details.strip():
            try:
                parsed_lease = json.loads(lease_details)
                
                # Clean the data if lease details is empty
                if isinstance(parsed_lease, dict):
                    cleaned_lease = {}
                    for k, v in parsed_lease.items():
                        cleaned_lease[k] = None if v == "" else v
                    data_dict['lease_details'] = cleaned_lease
                else:
                    data_dict['lease_details'] = parsed_lease

            except (ValueError, TypeError):
                data_dict['lease_details'] = None

        return super().to_internal_value(data_dict)

    # Function to create a vehicle with the images and the lease details, in the request POST
    def create(self, validated_data):
        # Take images, lease details and cover index over the principal request
        uploaded_photos = validated_data.pop('uploaded_photos', [])
        cover_index = validated_data.pop('cover_photo_index', 0)
        lease_details_data = validated_data.pop('lease_details', None)
        
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


    # Function to update a vehicle with the images and the lease details, in the request POST
    def update(self, instance, validated_data):
        # Take images and lease details over the principal request
        images_data = validated_data.pop('images', [])
        lease_details_data = validated_data.pop('lease_details', None)
        
        # Update the vehicle data
        instance = super().update(instance, validated_data)
        
                        
        # Intelligent update of lease details
        if lease_details_data is not None and any(lease_details_data.values()):
            # step A : The vehicle has already some leasing details
            if hasattr(instance, 'lease_details') and instance.lease_details:
                lease_detail = instance.lease_details
                for attr, value in lease_details_data.items():
                    setattr(lease_detail, attr, value)
                lease_detail.save()
            # step B : The vehicle was to sold, but now it has some lease details
            else:
                LeaseDetail.objects.create(vehicle=instance, **lease_details_data)
        # step C : The vehicle was to lease, but now it is to sold, so i delete the lease details
        elif 'lease_details' != self.initial_data:
            if hasattr(instance, 'lease_details') and instance.lease_details:
                instance.lease_details.delete()
            
            
        # Intelligent update of images
        if images_data is not None:
            # Take all the images IDs sent in the request 
            # if the image doesn't have un id it's because it's a new one, that hasn't been created yet
            keep_image_ids = [img.get('id') for img in images_data if img.get('id') is not None]

            # step A : Delete all the images that are not int he ids sent  
            instance.images.exclude(id__in=keep_image_ids).delete()

            # step B : images list sent in the request
            for image_item in images_data:
                image_id = image_item.get('id')

                if image_id:
                    # If image ID exists, the image does already exist in the bdd, so update the changes
                    Image.objects.filter(id=image_id, vehicle=instance).update(**image_item)
                else:
                    # If the image doesn't have an ID, it's a new one and we have to created 
                    Image.objects.create(vehicle=instance, **image_item)
        
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
