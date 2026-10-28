from django.urls import path
from members.views import member_list_create

urlpatterns = [
    path('', member_list_create, name='member_list_create'),
]
