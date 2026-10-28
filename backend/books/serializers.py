from rest_framework import serializers
from books.models import Book

class BookSerializer(serializers.ModelSerializer):
    available_copies = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'total_copies', 'available_copies']
