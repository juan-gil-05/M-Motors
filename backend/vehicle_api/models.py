from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Status(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
        
    class Meta:
        verbose_name_plural = "Statuses"


class Fuel(models.Model): 
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Gearbox(models.Model): 
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Geraboxes"


class ContractType(models.Model): 
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Make(models.Model): 
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Model(models.Model):
    name = models.CharField(max_length=255)
    year = models.SmallIntegerField()
    maker = models.ForeignKey(Make, on_delete=models.CASCADE, related_name="models")

    def __str__(self):
        return f"{self.maker.name} {self.name} ({self.year})"


class Vehicle(models.Model):
    kilometres = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    # Relations
    owner = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="vehicles"
    )
    contract_type = models.ForeignKey(
        ContractType, on_delete=models.RESTRICT, related_name="vehicles"
    ) 
    model = models.ForeignKey(Model, on_delete=models.RESTRICT, related_name="vehicles")
    gearbox = models.ForeignKey(
        Gearbox, on_delete=models.RESTRICT, related_name="vehicles"
    )
    fuel = models.ForeignKey(Fuel, on_delete=models.RESTRICT, related_name="vehicles")
    status = models.ForeignKey(
        Status, on_delete=models.RESTRICT, related_name="vehicles"
    )

    def __str__(self):
        return f"{self.model} - {self.price}€"


class LeaseDetail(models.Model):
    commitment_time = models.SmallIntegerField() 
    kilometres_per_year = models.IntegerField()
    final_purchase_price = models.DecimalField(max_digits=10, decimal_places=2)

    vehicle = models.OneToOneField(
        Vehicle, on_delete=models.CASCADE, related_name="lease_details"
    )

    def __str__(self):
        return f"Lease details for Vehicle {self.vehicle_id}"


class Image(models.Model):
    image_path = models.CharField(max_length=500)
    is_main = models.BooleanField(default=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="images"
    )

    def __str__(self):
        return f"Image {'(Main)' if self.is_main else ''} for Vehicle {self.vehicle_id}"
