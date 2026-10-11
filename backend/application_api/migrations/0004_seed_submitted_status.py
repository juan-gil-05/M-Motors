from django.db import migrations


def create_submitted_status(apps, schema_editor):
    Status = apps.get_model('application_api', 'Status')
    Status.objects.using(schema_editor.connection.alias).get_or_create(name='Déposé')


class Migration(migrations.Migration):
    dependencies = [
        ('application_api', '0003_application_consent_document_type'),
    ]

    operations = [
        migrations.RunPython(create_submitted_status, migrations.RunPython.noop),
    ]
