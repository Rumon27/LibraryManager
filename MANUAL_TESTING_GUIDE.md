# Step-by-Step Manual Testing Guide & Test Runner FAQ
**Project:** University Library Book Lending System  
**Course:** CSE 3206 — Software Engineering Sessional  

---
## to test paste in the terminal
### cd "e:\SW Lab6\backend"
### ..\venv\Scripts\coverage run manage.py test; ..\venv\Scripts\coverage report -m

## Part 1: FAQ — Why Django's Default Test Runner Instead of PyTest?

### Question: *"We did not use pytest here, just the default Django tester?"*

### Answer:
**Yes, by design.** Here is why:

1. **Strict Assignment Specification:**
   - The project requirements explicitly stated:  
     `Testing: Django TestCase + unittest.mock, coverage.py`
   - It also mandated the CI pipeline to run:  
     `coverage run manage.py test && coverage report`

2. **How Django's Default Test Runner Works (`manage.py test`):**
   - It is built directly on Python’s standard `unittest` library.
   - **Automatic Isolated Test Database:** Every time you run `python manage.py test`, Django automatically creates an isolated temporary SQLite database (`test_db.sqlite3`), runs all migrations, executes the tests, and destroys the database when done. Your actual development database (`db.sqlite3`) is never touched or corrupted!
   - **Transaction Rollback:** Each `TestCase` wraps each test method in an atomic database transaction that rolls back at the end of the test.
   - **Zero Extra Dependencies:** Unlike `pytest`, which requires `pytest-django` and configuration files (`pytest.ini`), Django's built-in test runner works universally in any Python environment and GitHub Actions without third-party plugins.

> **Viva Tip:** If an examiner asks *"Why didn't you use PyTest?"*, you can answer:  
> *"Django's built-in `TestCase` runner natively integrates with Django ORM transactions, provides `APIClient` for REST endpoints, and manages test database lifecycles without requiring third-party wrappers like `pytest-django`. We used `unittest.mock` for dependency isolation and `coverage.py` for coverage tracking."*

---

## Part 2: How to Run the Automated Tests Manually in the Terminal

Open PowerShell or Command Prompt in `e:\SW Lab6\backend`:

### 1. Run the Entire Test Suite
```powershell
cd "e:\SW Lab6\backend"
..\venv\Scripts\python manage.py test
```
*Expected Output:*
```text
Creating test database for alias 'default'...
..............................
----------------------------------------------------------------------
Ran 30 tests in 0.050s

OK
Destroying test database for alias 'default'...
```

---

### 2. Run Tests with Line Coverage Report
```powershell
# 1. Run tests with coverage collection
..\venv\Scripts\coverage run manage.py test

# 2. Display the coverage report table in terminal
..\venv\Scripts\coverage report -m
```
*Expected Output:* Shows 99% line coverage across all models, serializers, views, strategies, and services.

---

### 3. Run Specific Test Modules or Classes

If you want to test one specific module without running everything:

* **Test only Fine Strategies (Strategy Pattern):**
  ```powershell
  ..\venv\Scripts\python manage.py test loans.tests.test_strategies
  ```

* **Test only LoanService & Observers (Observer Pattern + Clock Injection):**
  ```powershell
  ..\venv\Scripts\python manage.py test loans.tests.test_services
  ```

* **Test only Report Factory (Factory Pattern):**
  ```powershell
  ..\venv\Scripts\python manage.py test reports
  ```

* **Test only REST API Endpoints:**
  ```powershell
  ..\venv\Scripts\python manage.py test library_system.tests.test_api
  ```

* **Run a single test method:**
  ```powershell
  ..\venv\Scripts\python manage.py test loans.tests.test_services.LoanServiceTests.test_return_ten_days_late_calculates_correct_fine_and_sends_email
  ```

---

## Part 3: Step-by-Step Manual End-to-End Testing (Through the UI)

To perform manual testing as an end-user or for your live demonstration, start both servers:

```powershell
# Terminal 1: Backend
cd "e:\SW Lab6\backend"
..\venv\Scripts\python manage.py runserver 127.0.0.1:8000

# Terminal 2: Frontend
cd "e:\SW Lab6\frontend"
npm run dev
```
Open your browser to: **`http://127.0.0.1:5173/`**

---

### Test Case 1: Authentication & Protected Routes
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1.1 | Open `http://127.0.0.1:5173/books` directly without logging in | Automatically redirects to `/login`. |
| 1.2 | Enter wrong password (e.g. `wrongpass`) and click **Sign In** | Red error banner appears: *"Invalid credentials."* |
| 1.3 | Enter `librarian` and `password123`, then click **Sign In** | Login succeeds; redirected to `/books` catalog with navigation bar visible. |
| 1.4 | Click **Logout** in the top navigation bar | Token is cleared from `localStorage`; redirected back to `/login`. |

---

### Test Case 2: Book Catalog & Available Copies Calculation
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 2.1 | Log in as `librarian`, navigate to **Books** | Table displays all existing books with total copies and available copies pills. |
| 2.2 | In the **Add New Book** form, enter: Title: *"Operating Systems"*, Author: *"Silberschatz"*, Copies: `2`. Click **Add**. | Book appears in table with `Total Copies: 2` and a green pill `2 available`. |
| 2.3 | In the search bar, type `Operating` and click **Search** | Only *"Operating Systems"* is displayed. |
| 2.4 | Click **Clear** | All books re-appear. |
| 2.5 | Click **Edit** on *"Operating Systems"*, change copies to `3`, click **Update** | Table updates to show `Total Copies: 3` and `3 available`. |

---

### Test Case 3: Member Registration
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 3.1 | Navigate to **Members** | Directory table lists registered patrons. |
| 3.2 | In **Register New Member** form, enter: Name: *"Rahim Ahmed"*, Email: *"rahim@ruet.ac.bd"*, Phone: *"01700000000"*. Click **Register**. | *"Rahim Ahmed"* immediately appears in the directory table with an ID badge. |
| 3.3 | Try registering with empty Name or invalid email | Browser / Form validation prompts to fill required valid fields. |

---

### Test Case 4: Loan Issuance & Availability Domain Rules
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 4.1 | Navigate to **Loans** | Shows **Issue Book** card and existing loans table. |
| 4.2 | In **Issue Book**, select *"Operating Systems (3 available)"* and Member *"Rahim Ahmed"*. Click **Issue Loan**. | Loan is created! Status shows green pill `Active`, Due Date is exactly $+14\text{ days}$, Fine is `$0.00`. |
| 4.3 | Go to **Books** tab | *"Operating Systems"* now shows `2 available` (decreased by 1)! |
| 4.4 | **Test 3-Loan Limit:** Issue 2 more loans to *"Rahim Ahmed"* (reaching 3 active loans). | Successfully issues loans #2 and #3. |
| 4.5 | Try issuing a 4th loan to *"Rahim Ahmed"* | System blocks it! Red error banner: *"Member 'Rahim Ahmed' has reached the limit of 3 active loans."* |
| 4.6 | **Test 0 Copies Available:** Try to issue a book whose available copies are `0`. | System blocks it! Red error: *"No copies available for '...'."* |

---

### Test Case 5: Overdue Fine Calculation (Live Demo & Strategy Pattern)
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 5.1 | On the **Loans** page, find an active loan. | The row has two buttons: **Return** and **⚡ Return (+10 days)**. |
| 5.2 | Click **Return** on a loan returned on time. | Loan status changes to `Returned`, Fine is `$0.00`. Action buttons disappear. |
| 5.3 | On another active loan, click **⚡ Return (+10 days)**. | **Strategy Pattern executes!** With $10\text{ days late} \times \$5/\text{day}$, the fine immediately displays **`$50.00`** in a red badge. Status shows `Returned`. |
| 5.4 | Look at the terminal running the Django server | Observer output is printed:  <br>`AUDIT: loan <id> returned, fine=50.00`<br>`[CONSOLE EMAIL] To: rahim@ruet.ac.bd | Fine notice... Outstanding fine: $50.00.` |
| 5.5 | Go back to **Books** tab | Available copies count has increased back by 1. |

---

### Test Case 6: Administrative Reports (Factory Pattern)
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 6.1 | Navigate to **Reports** | Page requests `/api/reports/?type=monthly`. |
| 6.2 | Check the 3 summary metric cards | - **Total Loans:** Total number of all loans issued.<br>- **Active Loans:** Count of currently borrowed books.<br>- **Total Fines Collected:** Dynamically sums up all fines (e.g. `$50.00`). |
| 6.3 | Check the **Recent Loan Transactions** table | Lists the latest 10 borrowing transactions with exact dates, active/returned statuses, and fines. |

---

## Part 4: Manual API Testing (Using cURL or Postman)

If you prefer testing raw HTTP requests without a browser:

```powershell
# 1. Login to get token
$login = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -ContentType "application/json" -Body '{"username":"librarian","password":"password123"}'
$token = $login.token
$headers = @{ "Authorization" = "Token $token"; "Content-Type" = "application/json" }

# 2. Get Book list
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/books/" -Method GET -Headers $headers

# 3. Return loan with 10 days overdue simulation
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/loans/1/return/" -Method POST -Headers $headers -Body '{"simulate_days":10}'

# 4. Get Monthly Report
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/reports/?type=monthly" -Method GET -Headers $headers
```
