from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from books.models import Book
from books.serializers import BookSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def book_list_create(request):
    if request.method == 'GET':
        q = request.query_params.get('q', '').strip()
        books = Book.objects.filter(Q(title__icontains=q) | Q(author__icontains=q)) if q else Book.objects.all()
        return Response(BookSerializer(books, many=True).data)

    serializer = BookSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def book_detail(request, pk):
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = BookSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    book.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
