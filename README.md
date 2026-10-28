# Library Book Lending System

A lightweight, robust Library Book Lending System built for a university Software Engineering project. The application follows clean architectural boundaries, separating core domain logic and design patterns into dedicated service layers while keeping views thin.

---

## 1. Project Overview

The system allows university librarians to catalog books, manage registered members, issue and return book loans with loan limits (max 3 per member) and availability checks, calculate overdue fines via extensible strategies, notify observers on return events, and generate administrative summary reports.

### Five Functional Modules
1. **Book Catalog:** Full CRUD operations and search by title or author. Displays total copies and live available copies.
2. **Member Management:** Member registration (name, email, phone) and member listing (no member login/signup).
3. **Issue and Return:** Loan lifecycle management enforcing copy availability and 3-active-loan limits. Includes interactive fine simulation.
4. **Fine Calculation:** Extensible overdue fine calculation using pluggable strategies (daily rate with caps, lost book flat rate).
5. **Reports:** Aggregate metrics and breakdown activity generated via builder factories.

---

## 2. Design Patterns

The core domain logic cleanly isolates design patterns using Python Abstract Base Classes (`abc.ABC`):

| Design Pattern | Class / Abstraction | File Location | Rationale & Responsibility |
| :--- | :--- | :--- | :--- |
| **Strategy** | `FineStrategy`, `DailyRateFine`, `LostBookFine` | [`backend/loans/strategies.py`](file:///backend/loans/strategies.py) | Encapsulates fine computation algorithms. Allows swapping calculation rules (e.g. daily rate vs. flat lost book fee) without modifying the loan return service. |
| **Observer** | `LoanObserver`, `EmailReminderObserver`, `AuditLogObserver` | [`backend/loans/observers.py`](file:///backend/loans/observers.py) | Decouples loan lifecycle events from side-effects. Observers are notified exactly once on return to send fine reminder emails and write audit records. |
| **Factory** | `ReportFactory`, `ReportBuilder`, `MonthlyReport`, `OverdueReport` | [`backend/reports/factories.py`](file:///backend/reports/factories.py) | Encapsulates the instantiation of reporting builders based on request parameters (`type="monthly"`, `type="overdue"`), shielding client views from builder construction details. |

### Supporting Architecture
- **Injected Clock (`today_fn`):** [`backend/loans/services.py`](file:///backend/loans/services.py) accepts a `today_fn` parameter defaulting to `date.today`. This makes fine calculations and loan durations 100% deterministic during unit testing.
- **Email Service Abstraction:** [`backend/notifications/services.py`](file:///backend/notifications/services.py) defines `EmailService` and `ConsoleEmailService` to prevent hitting real SMTP servers in development or testing.

---

## 3. Tech Stack

- **Backend:** Python 3.12, Django 5.x, Django REST Framework, SQLite, `rest_framework.authtoken`, `django-cors-headers`, `coverage.py`.
- **Frontend:** React 18, Vite, plain JavaScript/JSX, `react-router-dom`, native `fetch`, single ~25-line CSS file.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`).

---

## 4. Setup and Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv ../venv
# On Windows PowerShell:
..\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source ../venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. Create default librarian user
python manage.py create_librarian
# Default credentials: username 'librarian', password 'password123'
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install
```

---

## 5. How to Run Tests

Run the full Django test suite with coverage report:

```bash
cd backend
coverage run manage.py test
coverage report -m
```
*Current test suite achieves **99% line coverage** across 30 unit and integration tests.*

---

## 6. How to Run the Application

Run the application with two terminal windows:

### Terminal 1: Backend API
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```
Backend API will be running at `http://127.0.0.1:8000/api/`.

### Terminal 2: Frontend Web App
```bash
cd frontend
npm run dev
```
Open your browser to `http://127.0.0.1:5173/`.

### Live Fine Demo in Under 60 Seconds
1. Navigate to `http://127.0.0.1:5173/login` and log in with `librarian` / `password123`.
2. Go to **Loans** (`/loans`).
3. Select a book and a member, then click **Issue Loan**.
4. On the loans table, click **Return (+10 days)**.
5. Notice the fine instantly computes to **$50.00** (10 days overdue at $5.00/day) and the loan status updates to Returned.
6. Open **Report** (`/report`) to see the $50.00 reflected under Total Fines Collected!

---

## 7. Git Workflow

Refer to [`GIT_GUIDE.md`](file:///GIT_GUIDE.md) for step-by-step instructions on feature branches (`feature/book-catalog`, `feature/fine-strategy`, `feature/loans-service`, `feature/react-pages`), imperative commit messages, and pull request procedures.
