from django.contrib import admin
from .models import ApplicationStatus, Application, Document

# Register your models here.
admin.site.register(ApplicationStatus)
admin.site.register(Application)
admin.site.register(Document)
