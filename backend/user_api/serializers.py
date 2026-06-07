from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re

class UserSerializer(serializers.ModelSerializer):
    # The email must be unique in the database
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email is already registered.")]
    )

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "password"]
        extra_kwargs = {
            "password": {"write_only": True},
            "first_name": {"required": True, "allow_blank":False},
            "last_name": {"required": True, "allow_blank":False},
        }
        
    # password validation
    def validate_password(self, value):
        """
        Validates that the password is secure:
        - At least 8 characters
        - At least one uppercase letter
        - At least one digit
        - At least one special character
        """
        if len(value) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
            
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
            
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
            
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/`~]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un caractère spécial (ex: @, !, #, ...).")
            
        return value

    def create(self, validated_data):
        # I Copy the email value into the username field 
        # to satisfy Django's internal requirements.
        validated_data['username'] = validated_data['email']
        
        # Create the user with the hashed password
        user = User.objects.create_user(**validated_data)
        return user
    
    # PUT / PATCH
    def update(self, instance, validated_data):
        # If email modified, the username is also modified
        if 'email' in validated_data:
            validated_data['username'] = validated_data['email']

        # Get the password from the request
        password = validated_data.pop('password', None)
        
        # update of other data
        instance = super().update(instance, validated_data)

        # password hash
        if password:
            instance.set_password(password)
            instance.save()

        return instance
