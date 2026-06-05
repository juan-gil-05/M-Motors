from django.db import models
from django.contrib.auth import get_user_model
from vehicle_api.models import Vehicle

User = get_user_model()


class ApplicationStatus(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Application(models.Model):
    reject_justification = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="applications"
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="applications"
    )
    status = models.ForeignKey(
        ApplicationStatus, on_delete=models.RESTRICT, related_name="applications"
    )

    def __str__(self):
        return f"Application {self.id}, from user : {self.user_id} and vehicle {self.vehicle_id}, is {self.status.name}"


class Document(models.Model):
    document_path = models.CharField(max_length=500)
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="documents"
    )

    def __str__(self):
        return f"Documents for the application: {self.application_id}"
