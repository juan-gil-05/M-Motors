from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from application_api.models import Application 


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().exclude(owner__isnull=False)
    serializer_class = VehicleSerializer

    def get_permissions(self):
        # List of permissions that this view accepts
        # If the action is a method (GET), anyone can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]
    
    def destroy(self, request, *args,  **kwargs):
        vehicle = self.get_object()
        # Param to confrim the delete
        force_delete = request.query_params.get('force', 'false').lower() == "true"
        has_application = Application.objects.filter(vehicle=vehicle)
        
        if has_application and not force_delete:
            return Response(
                {
                    "message": "Ce véhicule est lié à des dossiers en cours. Voulez-vous vraiment le supprimer ainsi que ses dossiers ?"
                },
                status=status.HTTP_409_CONFLICT
            )
        else:
            # if the 'force' param is set to true, the vehicle is deleted
            return super().destroy(request, *args,  **kwargs)