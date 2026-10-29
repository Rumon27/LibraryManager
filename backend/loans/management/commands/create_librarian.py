from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create a default librarian superuser for testing and evaluation'

    def handle(self, *args, **options):
        username = 'librarian'
        password = 'password123'
        email = 'librarian@university.edu'
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f"Successfully created librarian: '{username}' with password: '{password}'"))
        else:
            self.stdout.write(self.style.WARNING(f"Librarian '{username}' already exists"))
