from django.urls import path
from reports.views import report_view

urlpatterns = [
    path('', report_view, name='report_view'),
]
