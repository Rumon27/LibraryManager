from decimal import Decimal
from django.test import SimpleTestCase
from loans.strategies import DailyRateFine, LostBookFine

class FineStrategyTests(SimpleTestCase):
    def setUp(self):
        self.strategy = DailyRateFine(rate=Decimal('5.00'), cap=Decimal('100.00'))
        self.lost_strategy = LostBookFine(flat_fee=Decimal('500.00'))

    def test_zero_days_late_is_zero(self):
        self.assertEqual(self.strategy.calculate(0), Decimal('0.00'))

    def test_one_day_late_is_one_daily_rate(self):
        self.assertEqual(self.strategy.calculate(1), Decimal('5.00'))

    def test_fifty_days_late_capped_at_maximum(self):
        # 50 * 5 = 250, capped at 100
        self.assertEqual(self.strategy.calculate(50), Decimal('100.00'))

    def test_negative_days_is_zero(self):
        self.assertEqual(self.strategy.calculate(-5), Decimal('0.00'))

    def test_lost_book_fine_returns_flat_amount(self):
        self.assertEqual(self.lost_strategy.calculate(0), Decimal('500.00'))
        self.assertEqual(self.lost_strategy.calculate(30), Decimal('500.00'))
