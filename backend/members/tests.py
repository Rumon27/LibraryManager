from django.test import TestCase
from members.models import Member

class MemberModelTest(TestCase):
    def test_member_creation_and_str(self):
        member = Member.objects.create(name="Bob", email="bob@test.edu", phone="123456")
        self.assertEqual(str(member), "Bob (bob@test.edu)")
        self.assertEqual(member.name, "Bob")
