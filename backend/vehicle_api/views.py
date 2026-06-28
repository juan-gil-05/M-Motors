from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from .models import *
from .serializers import *


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
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
