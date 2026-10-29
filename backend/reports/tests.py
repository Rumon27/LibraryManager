from django.test import TestCase
from books.models import Book
from members.models import Member
from loans.models import Loan
from reports.factories import ReportFactory, MonthlyReport, OverdueReport
from datetime import date, timedelta
from decimal import Decimal

class ReportFactoryTests(TestCase):
    def setUp(self):
        self.book = Book.objects.create(title="Refactoring", author="Martin Fowler", total_copies=3)
        self.member = Member.objects.create(name="Bob Martin", email="unclebob@clean.org")

    def test_factory_returns_monthly_builder(self):
        builder = ReportFactory.get_report_builder("monthly")
        self.assertIsInstance(builder, MonthlyReport)

    def test_factory_returns_overdue_builder(self):
        builder = ReportFactory.get_report_builder("overdue")
        self.assertIsInstance(builder, OverdueReport)

    def test_factory_raises_value_error_for_unknown_type(self):
        with self.assertRaises(ValueError) as ctx:
            ReportFactory.get_report_builder("nonexistent_report")
        self.assertIn("Unknown report type", str(ctx.exception))

    def test_monthly_report_builds_aggregates(self):
        # Create an active loan and a returned loan
        Loan.objects.create(
            book=self.book, member=self.member,
            issued_on=date.today(), due_date=date.today() + timedelta(days=14)
        )
        Loan.objects.create(
            book=self.book, member=self.member,
            issued_on=date.today() - timedelta(days=20),
            due_date=date.today() - timedelta(days=6),
            returned_on=date.today(),
            fine=Decimal('15.00')
        )
        builder = ReportFactory.get_report_builder("monthly")
        data = builder.build()

        self.assertEqual(data["report_type"], "monthly")
        self.assertEqual(data["total_loans"], 2)
        self.assertEqual(data["active_loans"], 1)
        self.assertEqual(Decimal(data["total_fines"]), Decimal('15.00'))
        self.assertEqual(data["total_books"], 1)
        self.assertEqual(data["total_members"], 1)
        self.assertGreaterEqual(len(data["items"]), 1)

    def test_overdue_report_builds_aggregates(self):
        # Create an overdue active loan
        Loan.objects.create(
            book=self.book, member=self.member,
            issued_on=date.today() - timedelta(days=20),
            due_date=date.today() - timedelta(days=6)
        )
        builder = ReportFactory.get_report_builder("overdue")
        data = builder.build()

        self.assertEqual(data["report_type"], "overdue")
        self.assertEqual(data["total_overdue"], 1)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["days_overdue"], 6)
