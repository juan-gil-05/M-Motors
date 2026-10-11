from django.db import models
from django.contrib.auth import get_user_model
from vehicle_api.models import Vehicle

User = get_user_model()


class Status(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Statuses"


class Application(models.Model):
    reject_justification = models.TextField(null=True, blank=True)
    data_processing_consent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="applications"
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="applications"
    )
    status = models.ForeignKey(
        Status, on_delete=models.RESTRICT, related_name="applications"
    )

    def __str__(self):
        return f"Le dossier {self.id}, du client : {self.user_id} et le vehicule {self.vehicle_id}, est {self.status.name}"


class Document(models.Model):
    class DocumentType(models.TextChoices):
        IDENTITY = "identity", "Identity document"
        DRIVING_LICENSE = "driving_license", "Driving license"

    document_path = models.CharField(max_length=500)
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file_extension = models.CharField(max_length=10, blank=True, default='')
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="documents"
    )

    def __str__(self):
        return f"Documents du dossier: {self.application_id}"
