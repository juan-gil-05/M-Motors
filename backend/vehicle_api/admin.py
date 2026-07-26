from django.contrib import admin
from .models import (
    Status,
    Fuel,
    Gearbox,
    ContractType,
    Make,
    Model,
    Vehicle,
    LeaseDetail,
    Image,
)

# Register your models here.
admin.site.register(Status)
admin.site.register(Fuel)
admin.site.register(Gearbox)
admin.site.register(ContractType)
admin.site.register(Make)
admin.site.register(Model)
admin.site.register(Vehicle)
admin.site.register(LeaseDetail)
admin.site.register(Image)
