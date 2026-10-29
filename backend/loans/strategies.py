from abc import ABC, abstractmethod
from decimal import Decimal

class FineStrategy(ABC):
    @abstractmethod
    def calculate(self, days_late: int) -> Decimal:
        """Calculate fine based on late days."""
        pass

class DailyRateFine(FineStrategy):
    def __init__(self, rate: Decimal = Decimal('5.00'), cap: Decimal = Decimal('100.00')):
        self.rate = Decimal(str(rate))
        self.cap = Decimal(str(cap))

    def calculate(self, days_late: int) -> Decimal:
        if days_late <= 0:
            return Decimal('0.00')
        fine = Decimal(days_late) * self.rate
        return min(fine, self.cap)

class LostBookFine(FineStrategy):
    def __init__(self, flat_fee: Decimal = Decimal('500.00')):
        self.flat_fee = Decimal(str(flat_fee))

    def calculate(self, days_late: int) -> Decimal:
        return self.flat_fee
