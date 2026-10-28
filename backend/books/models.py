from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    total_copies = models.PositiveIntegerField(default=1)

    @property
    def available_copies(self) -> int:
        active_loans = self.loans.filter(returned_on__isnull=True).count()
        return max(0, self.total_copies - active_loans)

    def __str__(self):
        return f"{self.title} by {self.author}"
