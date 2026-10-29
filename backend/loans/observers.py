import logging
from abc import ABC, abstractmethod
from notifications.services import EmailService

logger = logging.getLogger(__name__)

class LoanObserver(ABC):
    @abstractmethod
    def on_return(self, loan) -> None:
        """Invoked when a loan is returned."""
        pass

class EmailReminderObserver(LoanObserver):
    def __init__(self, email_service: EmailService):
        self.email_service = email_service

    def on_return(self, loan) -> None:
        if loan.fine > 0:
            subject = f"Fine notice for returned book: {loan.book.title}"
            body = (
                f"Dear {loan.member.name},\n"
                f"You have returned '{loan.book.title}' overdue. "
                f"Outstanding fine: ${loan.fine:.2f}."
            )
            self.email_service.send(loan.member.email, subject, body)

class AuditLogObserver(LoanObserver):
    def on_return(self, loan) -> None:
        message = f"AUDIT: loan {loan.id} returned, fine={loan.fine}"
        print(message)
        logger.info(message)
