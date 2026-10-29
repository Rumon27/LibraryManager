from datetime import date, timedelta
from typing import Callable, List, Optional
from books.models import Book
from members.models import Member
from loans.models import Loan
from loans.strategies import FineStrategy, DailyRateFine
from loans.observers import LoanObserver

class LoanDomainError(Exception):
    """Base domain exception for loan operations."""
    pass

class NoCopiesAvailableError(LoanDomainError):
    """Raised when trying to borrow a book with 0 available copies."""
    pass

class LoanLimitExceededError(LoanDomainError):
    """Raised when a member already has 3 or more active loans."""
    pass

class LoanService:
    def __init__(
        self,
        strategy: Optional[FineStrategy] = None,
        observers: Optional[List[LoanObserver]] = None,
        today_fn: Callable[[], date] = date.today
    ):
        self.strategy = strategy if strategy is not None else DailyRateFine()
        self.observers = observers if observers is not None else []
        self.today_fn = today_fn

    def issue(self, book: Book, member: Member) -> Loan:
        if book.available_copies <= 0:
            raise NoCopiesAvailableError(f"No copies available for '{book.title}'.")

        active_loans_count = member.loans.filter(returned_on__isnull=True).count()
        if active_loans_count >= 3:
            raise LoanLimitExceededError(f"Member '{member.name}' has reached the limit of 3 active loans.")

        today = self.today_fn()
        loan = Loan.objects.create(
            book=book,
            member=member,
            issued_on=today,
            due_date=today + timedelta(days=14)
        )
        return loan

    def return_book(self, loan: Loan) -> Loan:
        today = self.today_fn()
        loan.returned_on = today
        days_late = (today - loan.due_date).days
        loan.fine = self.strategy.calculate(days_late)
        loan.save()

        for observer in self.observers:
            observer.on_return(loan)

        return loan
