from django.urls import path, include
from library_system.auth_views import login_view

urlpatterns = [
    path('api/auth/login/', login_view, name='login'),
    path('api/books/', include('books.urls')),
    path('api/members/', include('members.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/reports/', include('reports.urls')),
]
