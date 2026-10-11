import os
from uuid import uuid4

from django.core.files.storage import default_storage
from django.db import transaction
from rest_framework import serializers

from user_api.serializers import UserSerializer
from vehicle_api.models import Vehicle
from vehicle_api.serializers import VehicleSerializer

from .models import Application, Document, Status


ALLOWED_DOCUMENT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'document_type', 'document_path']


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name']


class ApplicationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    status = serializers.PrimaryKeyRelatedField(queryset=Status.objects.all(), required=False)
    vehicle = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.filter(owner__isnull=True, status__name__iexact='Disponible')
    )
    identity_document = serializers.FileField(write_only=True, required=False)
    driving_license = serializers.FileField(write_only=True, required=False)
    data_processing_consent = serializers.BooleanField(write_only=True, required=False)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'user',
            'vehicle',
            'status',
            'created_at',
            'reject_justification',
            'data_processing_consent',
            'identity_document',
            'driving_license',
            'documents',
        ]
        read_only_fields = ['created_at', 'reject_justification']

    def validate_identity_document(self, uploaded_file):
        return self._validate_document(uploaded_file)

    def validate_driving_license(self, uploaded_file):
        return self._validate_document(uploaded_file)

    def _validate_document(self, uploaded_file):
        extension = os.path.splitext(uploaded_file.name)[1].lower()
        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise serializers.ValidationError('Le document doit être au format JPG, PNG ou PDF.')
        if uploaded_file.size > MAX_DOCUMENT_SIZE:
            raise serializers.ValidationError('La taille maximale autorisée est de 10 Mo.')
        return uploaded_file

    def validate(self, attrs):
        if self.instance is None:
            missing_documents = [
                field for field in ('identity_document', 'driving_license')
                if not attrs.get(field)
            ]
            if missing_documents:
                raise serializers.ValidationError({
                    field: 'Ce document est obligatoire.' for field in missing_documents
                })
            if not attrs.get('data_processing_consent'):
                raise serializers.ValidationError({
                    'data_processing_consent': 'Votre consentement au traitement des données est obligatoire.'
                })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        identity_document = validated_data.pop('identity_document')
        driving_license = validated_data.pop('driving_license')
        validated_data['data_processing_consent'] = validated_data.pop('data_processing_consent')
        # The initial status is always assigned by the server.
        validated_data['status'] = Status.objects.get(name='Déposé')
        application = Application.objects.create(**validated_data)

        # Store documents under UUID names instead of using user-provided filenames.
        for document_type, uploaded_file in (
            (Document.DocumentType.IDENTITY, identity_document),
            (Document.DocumentType.DRIVING_LICENSE, driving_license),
        ):
            extension = os.path.splitext(uploaded_file.name)[1].lower()
            requested_path = f'applications/{uuid4().hex}{extension}'
            stored_path = default_storage.save(requested_path, uploaded_file)
            Document.objects.create(
                application=application,
                document_type=document_type,
                document_path=stored_path,
            )

        return application

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['vehicle'] = VehicleSerializer(instance.vehicle).data
        representation['status'] = ApplicationStatusSerializer(instance.status).data
        representation['user'] = UserSerializer(instance.user).data
        representation['documents'] = DocumentSerializer(instance.documents.all(), many=True).data
        return representation
