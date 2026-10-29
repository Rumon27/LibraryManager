from rest_framework import serializers
from loans.models import Loan

class LoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'book', 'member', 'book_title', 'member_name',
            'issued_on', 'due_date', 'returned_on', 'fine', 'is_active'
        ]
        read_only_fields = ['issued_on', 'due_date', 'returned_on', 'fine', 'is_active']
