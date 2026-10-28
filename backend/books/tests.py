from django.test import TestCase
from books.models import Book
from members.models import Member
from loans.models import Loan
from datetime import date

class BookModelTest(TestCase):
    def test_book_creation_and_available_copies(self):
        book = Book.objects.create(title="Clean Code", author="Robert C. Martin", total_copies=2)
        member = Member.objects.create(name="Alice", email="alice@test.edu")
        self.assertEqual(book.available_copies, 2)
        self.assertEqual(str(book), "Clean Code by Robert C. Martin")

        # Active loan reduces available_copies
        loan = Loan.objects.create(
            book=book, member=member,
            issued_on=date.today(), due_date=date.today()
        )
        self.assertEqual(book.available_copies, 1)

        # Returned loan restores available_copies
        loan.returned_on = date.today()
        loan.save()
        self.assertEqual(book.available_copies, 2)
