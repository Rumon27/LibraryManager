from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from books.models import Book
from members.models import Member
from loans.models import Loan

class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='librarian', password='password123')
        self.book = Book.objects.create(title="The Pragmatic Programmer", author="Hunt & Thomas", total_copies=2)
        self.member = Member.objects.create(name="Ada Lovelace", email="ada@analytical.org", phone="555-1234")

    def test_unauthenticated_request_returns_401(self):
        response = self.client.get('/api/books/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_returns_token(self):
        response = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        token = response.data['token']

        # Access authenticated endpoint with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        books_res = self.client.get('/api/books/')
        self.assertEqual(books_res.status_code, status.HTTP_200_OK)

    def test_login_with_invalid_credentials_returns_400(self):
        response = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'Invalid credentials.')

    def test_login_with_missing_fields_returns_400(self):
        response = self.client.post('/api/auth/login/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_book_crud_endpoints(self):
        # Authenticate
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # List & Search
        res = self.client.get('/api/books/?q=Pragmatic')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # Create
        create_res = self.client.post('/api/books/', {'title': 'Code Complete', 'author': 'Steve McConnell', 'total_copies': 3})
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        book_id = create_res.data['id']

        # Patch
        patch_res = self.client.patch(f'/api/books/{book_id}/', {'total_copies': 4})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['total_copies'], 4)

        # Delete
        delete_res = self.client.delete(f'/api/books/{book_id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

        # 404 for deleted book
        patch_res404 = self.client.patch(f'/api/books/{book_id}/', {'total_copies': 1})
        self.assertEqual(patch_res404.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_crud_endpoints(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # List
        res = self.client.get('/api/members/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # Create
        create_res = self.client.post('/api/members/', {'name': 'Linus Torvalds', 'email': 'linus@kernel.org', 'phone': '999'})
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['name'], 'Linus Torvalds')

        # Invalid create
        bad_res = self.client.post('/api/members/', {'name': ''})
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_loans_with_no_copies_returns_400(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # Exhaust copies of self.book
        self.book.total_copies = 0
        self.book.save()

        res = self.client.post('/api/loans/', {'book': self.book.id, 'member': self.member.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)
        self.assertIn('No copies available', res.data['error'])

    def test_post_loans_with_missing_entities_or_fields(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # Missing payload
        res = self.client.post('/api/loans/', {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Nonexistent IDs
        res_404 = self.client.post('/api/loans/', {'book': 99999, 'member': 99999})
        self.assertEqual(res_404.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_return_with_simulate_days_reflects_fine_in_response(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # Issue loan
        issue_res = self.client.post('/api/loans/', {'book': self.book.id, 'member': self.member.id})
        self.assertEqual(issue_res.status_code, status.HTTP_201_CREATED)
        loan_id = issue_res.data['id']

        # Return with simulate_days = 24 (14 days regular + 10 days late -> 10 * 5 = 50 fine)
        return_res = self.client.post(f'/api/loans/{loan_id}/return/', {'simulate_days': 24})
        self.assertEqual(return_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(return_res.data['fine']), Decimal('50.00'))
        self.assertFalse(return_res.data['is_active'])

        # Return already returned loan returns 400
        second_return = self.client.post(f'/api/loans/{loan_id}/return/', {'simulate_days': 0})
        self.assertEqual(second_return.status_code, status.HTTP_400_BAD_REQUEST)

        # Return nonexistent loan returns 404
        nonexistent_res = self.client.post('/api/loans/99999/return/', {'simulate_days': 0})
        self.assertEqual(nonexistent_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_loans_list_and_filter_active(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        # Issue 1 loan
        self.client.post('/api/loans/', {'book': self.book.id, 'member': self.member.id})

        res_all = self.client.get('/api/loans/')
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_all.data), 1)

        res_active = self.client.get('/api/loans/?active=true')
        self.assertEqual(res_active.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_active.data), 1)

    def test_reports_api_endpoint(self):
        login_res = self.client.post('/api/auth/login/', {'username': 'librarian', 'password': 'password123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_res.data['token']}")

        res = self.client.get('/api/reports/?type=monthly')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['report_type'], 'monthly')
        self.assertIn('total_loans', res.data)
        self.assertIn('total_fines', res.data)

        # Invalid type
        bad_res = self.client.get('/api/reports/?type=unknown_report')
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)
