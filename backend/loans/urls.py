from django.urls import path
from loans.views import loan_list_create, loan_return

urlpatterns = [
    path('', loan_list_create, name='loan_list_create'),
    path('<int:pk>/return/', loan_return, name='loan_return'),
]
