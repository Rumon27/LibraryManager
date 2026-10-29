from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal
from django.db.models import Sum
from books.models import Book
from members.models import Member
from loans.models import Loan

class ReportBuilder(ABC):
    @abstractmethod
    def build(self) -> dict:
        """Build and return aggregate report dictionary."""
        pass

class MonthlyReport(ReportBuilder):
    def build(self) -> dict:
        total_loans = Loan.objects.count()
        active_loans = Loan.objects.filter(returned_on__isnull=True).count()
        fines_sum = Loan.objects.aggregate(total=Sum('fine'))['total'] or Decimal('0.00')
        total_books = Book.objects.count()
        total_members = Member.objects.count()

        recent_loans = Loan.objects.select_related('book', 'member').order_by('-issued_on')[:10]
        items = [
            {
                "id": loan.id,
                "book_title": loan.book.title,
                "member_name": loan.member.name,
                "issued_on": str(loan.issued_on),
                "due_date": str(loan.due_date),
                "returned_on": str(loan.returned_on) if loan.returned_on else None,
                "fine": str(loan.fine),
                "status": "Active" if loan.is_active else "Returned"
            }
            for loan in recent_loans
        ]

        return {
            "report_type": "monthly",
            "generated_at": str(date.today()),
            "total_loans": total_loans,
            "active_loans": active_loans,
            "total_fines": str(fines_sum),
            "total_books": total_books,
            "total_members": total_members,
            "items": items,
        }

class OverdueReport(ReportBuilder):
    def build(self) -> dict:
        today = date.today()
        overdue_qs = Loan.objects.filter(returned_on__isnull=True, due_date__lt=today).select_related('book', 'member')
        fines_sum = Loan.objects.aggregate(total=Sum('fine'))['total'] or Decimal('0.00')

        items = [
            {
                "id": loan.id,
                "book_title": loan.book.title,
                "member_name": loan.member.name,
                "issued_on": str(loan.issued_on),
                "due_date": str(loan.due_date),
                "days_overdue": (today - loan.due_date).days,
                "fine": str(loan.fine),
            }
            for loan in overdue_qs
        ]

        return {
            "report_type": "overdue",
            "generated_at": str(today),
            "total_overdue": overdue_qs.count(),
            "total_fines": str(fines_sum),
            "items": items,
        }

class ReportFactory:
    _BUILDERS = {
        "monthly": MonthlyReport,
        "overdue": OverdueReport,
    }

    @classmethod
    def get_report_builder(cls, report_type: str) -> ReportBuilder:
        normalized_type = report_type.strip().lower() if report_type else ""
        builder_cls = cls._BUILDERS.get(normalized_type)
        if not builder_cls:
            valid_types = ", ".join(cls._BUILDERS.keys())
            raise ValueError(f"Unknown report type '{report_type}'. Valid types are: {valid_types}.")
        return builder_cls()
