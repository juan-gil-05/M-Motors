from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationDocumentContentView, ApplicationViewset

router = DefaultRouter()
router.register(r'application', ApplicationViewset, basename='application')

urlpatterns = [
    path(
        'application/<int:application_id>/documents/<int:document_id>/content/',
        ApplicationDocumentContentView.as_view(),
        name='application-document-content',
    ),
    path('', include(router.urls)),
]
