from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from members.models import Member
from members.serializers import MemberSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def member_list_create(request):
    if request.method == 'GET':
        members = Member.objects.all()
        return Response(MemberSerializer(members, many=True).data)

    serializer = MemberSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
