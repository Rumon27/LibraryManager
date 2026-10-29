from datetime import date, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from books.models import Book
from members.models import Member
from loans.models import Loan
from loans.serializers import LoanSerializer
from loans.services import LoanService, LoanDomainError
from loans.strategies import DailyRateFine
from loans.observers import EmailReminderObserver, AuditLogObserver
from notifications.services import ConsoleEmailService

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def loan_list_create(request):
    if request.method == 'GET':
        active_filter = request.query_params.get('active')
        loans = Loan.objects.select_related('book', 'member').all()
        if active_filter == 'true':
            loans = loans.filter(returned_on__isnull=True)
        return Response(LoanSerializer(loans, many=True).data)

    book_id = request.data.get('book')
    member_id = request.data.get('member')
    if not book_id or not member_id:
        return Response({'error': 'book and member fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        book = Book.objects.get(pk=book_id)
        member = Member.objects.get(pk=member_id)
    except (Book.DoesNotExist, Member.DoesNotExist):
        return Response({'error': 'Book or Member not found.'}, status=status.HTTP_404_NOT_FOUND)

    service = LoanService()
    try:
        loan = service.issue(book, member)
    except LoanDomainError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def loan_return(request, pk):
    try:
        loan = Loan.objects.get(pk=pk)
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not loan.is_active:
        return Response({'error': 'This loan has already been returned.'}, status=status.HTTP_400_BAD_REQUEST)

    simulate_days = int(request.data.get('simulate_days', 0) or 0)
    today_date = date.today() + timedelta(days=simulate_days)

    observers = [EmailReminderObserver(ConsoleEmailService()), AuditLogObserver()]
    service = LoanService(
        strategy=DailyRateFine(),
        observers=observers,
        today_fn=lambda: today_date
    )
    loan = service.return_book(loan)
    return Response(LoanSerializer(loan).data, status=status.HTTP_200_OK)
