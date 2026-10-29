from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import Mock
from django.test import TestCase
from books.models import Book
from members.models import Member
from loans.models import Loan
from loans.strategies import DailyRateFine
from loans.observers import EmailReminderObserver, AuditLogObserver
from loans.services import LoanService, NoCopiesAvailableError, LoanLimitExceededError
from notifications.services import ConsoleEmailService

class LoanServiceTests(TestCase):
    def setUp(self):
        self.book = Book.objects.create(title="Domain Driven Design", author="Eric Evans", total_copies=2)
        self.member = Member.objects.create(name="Grace Hopper", email="grace@navy.mil")
        self.mock_email = Mock()
        self.email_observer = EmailReminderObserver(self.mock_email)
        self.audit_observer = AuditLogObserver()
        self.fixed_today = date(2026, 10, 1)

    def test_cannot_issue_when_available_copies_is_zero(self):
        # Exhaust copies
        self.book.total_copies = 1
        self.book.save()
        Loan.objects.create(book=self.book, member=self.member, issued_on=self.fixed_today, due_date=self.fixed_today)

        service = LoanService(today_fn=lambda: self.fixed_today)
        with self.assertRaises(NoCopiesAvailableError):
            service.issue(self.book, self.member)

    def test_cannot_issue_when_member_has_three_active_loans(self):
        # Create 3 active loans for grace
        for i in range(3):
            b = Book.objects.create(title=f"Book {i}", author="Author", total_copies=5)
            Loan.objects.create(book=b, member=self.member, issued_on=self.fixed_today, due_date=self.fixed_today)

        service = LoanService(today_fn=lambda: self.fixed_today)
        with self.assertRaises(LoanLimitExceededError):
            service.issue(self.book, self.member)

    def test_successful_issue_sets_due_date_to_issued_on_plus_fourteen_days(self):
        service = LoanService(today_fn=lambda: self.fixed_today)
        loan = service.issue(self.book, self.member)

        self.assertEqual(loan.issued_on, self.fixed_today)
        self.assertEqual(loan.due_date, self.fixed_today + timedelta(days=14))
        self.assertTrue(loan.is_active)
        self.assertEqual(loan.fine, Decimal('0.00'))

    def test_return_on_time_results_in_zero_fine_and_no_email_sent(self):
        service = LoanService(
            strategy=DailyRateFine(rate=Decimal('5.00')),
            observers=[self.email_observer, self.audit_observer],
            today_fn=lambda: self.fixed_today
        )
        loan = service.issue(self.book, self.member)

        # Return on due_date (no late days)
        on_time_date = loan.due_date
        return_service = LoanService(
            strategy=DailyRateFine(rate=Decimal('5.00')),
            observers=[self.email_observer, self.audit_observer],
            today_fn=lambda: on_time_date
        )
        returned_loan = return_service.return_book(loan)

        self.assertEqual(returned_loan.returned_on, on_time_date)
        self.assertEqual(returned_loan.fine, Decimal('0.00'))
        self.assertFalse(returned_loan.is_active)
        self.mock_email.send.assert_not_called()

    def test_return_ten_days_late_calculates_correct_fine_and_sends_email(self):
        service = LoanService(
            strategy=DailyRateFine(rate=Decimal('5.00')),
            observers=[self.email_observer, self.audit_observer],
            today_fn=lambda: self.fixed_today
        )
        loan = service.issue(self.book, self.member)

        # Return 10 days after due date (10 * 5 = 50.00 fine)
        late_date = loan.due_date + timedelta(days=10)
        return_service = LoanService(
            strategy=DailyRateFine(rate=Decimal('5.00')),
            observers=[self.email_observer, self.audit_observer],
            today_fn=lambda: late_date
        )
        returned_loan = return_service.return_book(loan)

        self.assertEqual(returned_loan.fine, Decimal('50.00'))
        self.mock_email.send.assert_called_once()
        args, kwargs = self.mock_email.send.call_args
        self.assertEqual(args[0], "grace@navy.mil")
        self.assertIn("Domain Driven Design", args[1])
        self.assertIn("50.00", args[2])

    def test_return_calls_every_observer_exactly_once(self):
        obs1 = Mock()
        obs2 = Mock()
        service = LoanService(
            observers=[obs1, obs2],
            today_fn=lambda: self.fixed_today
        )
        loan = service.issue(self.book, self.member)
        service.return_book(loan)

        obs1.on_return.assert_called_once_with(loan)
        obs2.on_return.assert_called_once_with(loan)

    def test_console_email_service_output(self):
        service = ConsoleEmailService()
        # Ensure it executes without exception
        service.send("test@example.com", "Subject", "Body content")
