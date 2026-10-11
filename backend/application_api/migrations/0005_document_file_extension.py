import os

from django.db import migrations, models


def copy_extension_from_existing_path(apps, schema_editor):
    Document = apps.get_model('application_api', 'Document')
    database = schema_editor.connection.alias
    for document in Document.objects.using(database).only('pk', 'document_path').iterator():
        extension = os.path.splitext(document.document_path)[1].lower()
        if extension:
            Document.objects.using(database).filter(pk=document.pk).update(file_extension=extension)


class Migration(migrations.Migration):
    dependencies = [
        ('application_api', '0004_seed_submitted_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='file_extension',
            field=models.CharField(blank=True, default='', max_length=10),
        ),
        migrations.RunPython(copy_extension_from_existing_path, migrations.RunPython.noop),
    ]
