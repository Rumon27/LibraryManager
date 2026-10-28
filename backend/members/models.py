from django.db import models

class Member(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.name} ({self.email})"
