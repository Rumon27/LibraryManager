from decimal import Decimal
from django.db import models
from books.models import Book
from members.models import Member

class Loan(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='loans')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='loans')
    issued_on = models.DateField()
    due_date = models.DateField()
    returned_on = models.DateField(null=True, blank=True)
    fine = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))

    @property
    def is_active(self) -> bool:
        return self.returned_on is None

    def __str__(self):
        return f"Loan #{self.id}: {self.book.title} -> {self.member.name}"
