from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from reports.factories import ReportFactory

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_view(request):
    report_type = request.query_params.get('type', 'monthly')
    try:
        builder = ReportFactory.get_report_builder(report_type)
        data = builder.build()
        return Response(data)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
