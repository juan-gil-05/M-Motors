from rest_framework import viewsets
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # 1. Anyone can register (POST /users/)
        if self.action == "create":
            return [AllowAny()]
        
        # 2. Only Admins can see the entire list of users (GET /users/)
        if self.action == "list":
            return [IsAdminUser()]
            
        # 3. For retrieve, update or destroy: user must be authenticated
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Security check: Normal users can ONLY see and modify their own account.
        Admins (is_staff) can see and modify everyone.
        """
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        
        # Non-admin users are restricted to their own user instance
        return User.objects.filter(id=user.id)
    
