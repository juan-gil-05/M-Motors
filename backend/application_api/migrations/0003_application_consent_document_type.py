from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('application_api', '0002_rename_applicationstatus_status_alter_status_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='data_processing_consent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='document',
            name='document_type',
            field=models.CharField(
                choices=[('identity', 'Identity document'), ('driving_license', 'Driving license')],
                default='identity',
                max_length=30,
            ),
            preserve_default=False,
        ),
    ]
