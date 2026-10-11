import mimetypes
import os

from django.core.files.storage import default_storage
from django.db import transaction
from django.http import FileResponse, Http404
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application, Document, Status
from .serializers import ApplicationSerializer


class ApplicationViewset(viewsets.ModelViewSet):
    """Expose user-owned applications and administrator review operations."""

    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Application.objects.select_related(
            'user', 'vehicle__model__maker', 'vehicle__contract_type',
            'vehicle__gearbox', 'vehicle__fuel', 'vehicle__status', 'status',
        ).prefetch_related('documents')
        if not self.request.user.is_staff:
            # users must never be able to inspect another user's applications.
            queryset = queryset.filter(user=self.request.user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            normalized_status = status_filter.strip().casefold()
            # Translate the label shown in the admin interface to the stored status.
            if normalized_status in {'pending', 'en attente'}:
                normalized_status = 'déposé'
            queryset = queryset.filter(status__name__iexact=normalized_status)

        contract_type = self.request.query_params.get('type')
        if contract_type:
            normalized_type = contract_type.strip().casefold()
            if normalized_type in {'achat', 'buy', 'sale'}:
                queryset = queryset.filter(
                    Q(vehicle__contract_type__name__iexact='achat')
                    | Q(vehicle__contract_type__name__iexact='vente')
                )
            else:
                queryset = queryset.filter(vehicle__contract_type__name__iexact=normalized_type)

        return queryset.order_by('-created_at', '-pk')

    def get_permissions(self):
        # Only administrators can make decisions or mutate applications records.
        if self.action in {'approve', 'reject', 'update', 'partial_update', 'destroy'}:
            return [IsAdminUser()]
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def _decide(self, application, target_name, justification=None):
        # Applications cannot be changed twice.
        if application.status.name.casefold() != 'déposé':
            return Response(
                {'message': 'Seuls les dossiers en attente peuvent être traités.'},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            target_status, _ = Status.objects.get_or_create(name=target_name)
            application.status = target_status
            application.reject_justification = justification if target_name == 'Refusé' else None
            application.save(update_fields=['status', 'reject_justification', 'updated_at'])

        return Response(self.get_serializer(application).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        return self._decide(self.get_object(), 'Validé')

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        justification = request.data.get('reject_justification', '')
        if justification is not None and not isinstance(justification, str):
            return Response(
                {'reject_justification': ['Le motif doit être une chaîne de caractères.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return self._decide(self.get_object(), 'Refusé', (justification or '').strip() or None)


class ApplicationDocumentContentView(APIView):
    """Stream a application attachment only to an authenticated administrator."""

    permission_classes = [IsAdminUser]

    @staticmethod
    def _detect_extension(file_handle):
        """Identify supported files whose storage key has no extension."""
        signature = file_handle.read(8)
        file_handle.seek(0)
        if signature.startswith(b'\xff\xd8\xff'):
            return '.jpg'
        if signature.startswith(b'\x89PNG\r\n\x1a\n'):
            return '.png'
        if signature.startswith(b'%PDF-'):
            return '.pdf'
        return ''

    def get(self, request, application_id, document_id):
        # Verify that the document belongs to this application.
        document = get_object_or_404(
            Document.objects.select_related('application'),
            pk=document_id,
            application_id=application_id,
        )
        try:
            file_handle = default_storage.open(document.document_path, 'rb')
        except (FileNotFoundError, OSError) as error:
            raise Http404('Le document demandé est introuvable.') from error

        extension = document.file_extension.lower()
        if extension not in {'.jpg', '.jpeg', '.png', '.pdf'}:
            extension = self._detect_extension(file_handle)
        safe_base_name = 'piece-identite' if document.document_type == Document.DocumentType.IDENTITY else 'permis-de-conduire'
        filename = f'{safe_base_name}{extension or ".bin"}'
        content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        response = FileResponse(
            file_handle,
            as_attachment=request.query_params.get('download', '').lower() == 'true',
            filename=filename,
            content_type=content_type,
        )
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
