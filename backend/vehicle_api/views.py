from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from application_api.models import Application 
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.pagination import PageNumberPagination


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().exclude(owner__isnull=False)
    serializer_class = VehicleSerializer
    authentication_classes = [JWTAuthentication] # Force the usage of JWT
    
    # Configure DRF filters for searching, filtering and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Traverse foreign keys: model -> maker -> name
    search_fields = ['model__name', 'model__maker__name']
    
    # Exact filtering on type and status
    filterset_fields = ['contract_type', 'status']
    
    # Orderable fields
    ordering_fields = ['price', 'created_at']

    def get_permissions(self):
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
        
        
class MakerPagination(PageNumberPagination):
    page_size = 100

class MakerViewSet(viewsets.ModelViewSet):
    serializer_class = MakerSerializer
    pagination_class = MakerPagination
    
    def get_permissions(self):
        # If the action is a method (GET), anyone authenticated can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        return Maker.objects.all()
    
    
class ModelViewSet(viewsets.ModelViewSet):
    serializer_class = ModelSerializer
    
    def get_permissions(self):
        # If the action is a method (GET), anyone authenticated can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        res = Model.objects.all()
        # Filter the models by maker ID
        makerId = self.request.query_params.get("maker_id")
        if makerId is not None:
            res = res.filter(maker_id=makerId)
        return res
    
    
class GearboxViewSet(viewsets.ModelViewSet):
    serializer_class = GearboxSerializer
    
    def get_permissions(self):
        # If the action is a method (GET), anyone authenticated can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        return Gearbox.objects.all()
    
      
class FuelViewSet(viewsets.ModelViewSet):
    serializer_class = FuelSerializer
    
    def get_permissions(self):
        # If the action is a method (GET), anyone authenticated can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        return Fuel.objects.all()
    
    
class ContractTypeViewSet(viewsets.ModelViewSet):
    serializer_class = ContractTypeSerializer

    def get_permissions(self):
        # If the action is a method (GET), anyone authenticated can access it
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # If it's a modification (POST, PUT, PATCH, DELETE), it MUST be an Admin (is_staff=True)
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        return ContractType.objects.all()