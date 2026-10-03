from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'makers', MakerViewSet, basename="maker")
router.register(r'models', ModelViewSet, basename="model")
router.register(r'gearboxes', GearboxViewSet, basename="gearbox")
router.register(r'fuels', FuelViewSet, basename="fuel")
router.register(r'contractType', ContractTypeViewSet, basename="contractType")

urlpatterns = [
    path('', include(router.urls)),
]