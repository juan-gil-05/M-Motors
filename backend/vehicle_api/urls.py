from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet

# Create a router and register our ViewSet
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]