from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated
from .serializers import ApplicationSerializer
from .models import Application

class ApplicationViewset(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Only the admin can see all the applications
        if user.is_staff:
            return Application.objects.select_related('user', 'vehicle', 'status').prefetch_related('documents')
        return Application.objects.filter(user=user).select_related(
            'user', 'vehicle', 'status'
        ).prefetch_related('documents')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
