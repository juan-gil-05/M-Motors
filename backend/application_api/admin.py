from django.contrib import admin
from .models import Application, Document, Status

# Register your models here.
admin.site.register(Status)
admin.site.register(Application)
admin.site.register(Document)
