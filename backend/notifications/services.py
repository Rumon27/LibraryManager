from abc import ABC, abstractmethod

class EmailService(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> None:
        """Send an email notification."""
        pass

class ConsoleEmailService(EmailService):
    def send(self, to: str, subject: str, body: str) -> None:
        print(f"[CONSOLE EMAIL] To: {to} | Subject: {subject} | Body: {body}")
