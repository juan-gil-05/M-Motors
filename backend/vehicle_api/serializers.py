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
    # Require to false in order to update the images, see update function in vehicleSerialaizer
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Image
        fields = ["id", "image_path", "is_main"]
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

    # Function to create a vehicle with the images and the lease details, in the request POST
    def create(self, validated_data):
        # Take images and lease details over the principal request
        images_data = validated_data.pop('images', [])
        lease_details_data = validated_data.pop('lease_details', None)
        
        # Create the vehicle
        vehicle = Vehicle.objects.create(**validated_data)
        
        # If there is the lease details, create with the vehicle we just create 
        if lease_details_data :
            LeaseDetail.objects.create(vehicle=vehicle, **lease_details_data)
            
        # Create the images for the vehicle we just create 
        for image_data in images_data:
            Image.objects.create(vehicle=vehicle, **image_data)
            
        return vehicle


    # Function to update a vehicle with the images and the lease details, in the request POST
    def update(self, instance, validated_data):
        # Take images and lease details over the principal request
        images_data = validated_data.pop('images', [])
        lease_details_data = validated_data.pop('lease_details', None)
        
        # Update the vehicle data
        instance = super().update(instance, validated_data)
        
                        
        # Intelligent update of lease details
        if lease_details_data is not None:
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
