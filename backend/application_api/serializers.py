from rest_framework import serializers
from .models import *
from vehicle_api.serializers import VehicleSerializer, StatusSerializer
from user_api.serializers import UserSerializer

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'document_path']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["vehicle"] = VehicleSerializer(instance.vehicle).data
        representation["status"] = StatusSerializer(instance.status).data
        representation["user"] = UserSerializer(instance.user).data
        return representation
