from django.urls import path
from books.views import book_list_create, book_detail

urlpatterns = [
    path('', book_list_create, name='book_list_create'),
    path('<int:pk>/', book_detail, name='book_detail'),
]
