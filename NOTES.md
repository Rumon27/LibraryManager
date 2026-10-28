# Architectural Notes & Viva Defense Guide

This document provides a concise 3-4 sentence explanation for every file in the codebase detailing **what it does**, **why it was designed this way**, and key **architectural tradeoffs** to help you defend your project in an academic viva.

---

## 1. Backend Architecture & Design Patterns

### `backend/loans/strategies.py`
- **What it does:** Defines the `FineStrategy` abstract base class along with concrete algorithms: `DailyRateFine` (with max capping and non-negative clamping) and `LostBookFine` (flat fee).
- **Why:** Implements the **Strategy Design Pattern** to adhere to the Open/Closed Principle (OCP). Fining policies can change or expand (e.g. holiday discounts or student rates) without editing existing loan processing logic.
- **Viva Defense Tip:** Note that fine calculation is completely extracted from the model and views, making it an isolated, pure-function domain service that requires zero mocks to test.

### `backend/loans/observers.py`
- **What it does:** Defines the `LoanObserver` abstract base class and two concrete observers: `EmailReminderObserver` (which sends an alert only if an overdue fine exists) and `AuditLogObserver` (which writes return audits).
- **Why:** Implements the **Observer Design Pattern** to decouple the loan return workflow from secondary side-effects. Observers can be added, disabled, or substituted without changing the core return algorithm.
- **Viva Defense Tip:** Contrast this with Django signals: signals create invisible hidden dependencies across apps, whereas explicit observers passed via constructor injection are transparent, deterministic, and testable.

### `backend/reports/factories.py`
- **What it does:** Provides `ReportFactory` which instantiates and returns report builders (`MonthlyReport`, `OverdueReport`) based on an input string, throwing a clear `ValueError` for unknown types.
- **Why:** Implements the **Factory Design Pattern** to decouple report selection and aggregation generation from the API view. Each builder isolates its queries and structure.
- **Viva Defense Tip:** Explain that adding a new report (e.g., "annual" or "member-specific") simply requires adding a new `ReportBuilder` subclass and registering it in `ReportFactory._BUILDERS`.

### `backend/loans/services.py`
- **What it does:** Implements `LoanService`, coordinating loan issuance, availability verification, maximum loan limits (max 3), return processing, fine calculation, and observer notifications.
- **Why:** Forms the **Service Layer** that holds all domain business logic. It utilizes dependency injection for the fine strategy, the observer list, and the clock function (`today_fn`).
- **Viva Defense Tip:** Highlight that `today_fn` defaults to `date.today` but allows unit tests to inject arbitrary dates. This makes testing edge cases (e.g., 10 days overdue) 100% deterministic without patching system clocks.

### `backend/notifications/services.py`
- **What it does:** Provides the `EmailService` abstract base class and `ConsoleEmailService` implementation which logs notifications to standard output.
- **Why:** Provides an email dispatch interface that isolates external SMTP infrastructure. In development and testing, console output prevents network timeouts or dependency on external mail servers.
- **Viva Defense Tip:** In production, a `SmtpEmailService` could be swapped in through configuration without modifying `EmailReminderObserver` or `LoanService`.

### `backend/books/models.py`
- **What it does:** Defines the `Book` model with `title`, `author`, and `total_copies`, along with a calculated `@property` named `available_copies`.
- **Why:** The available copies property dynamically counts active loans (`returned_on__isnull=True`) subtracted from `total_copies`. This prevents race conditions and data synchronization bugs that arise from storing available copies as a mutable database column.
- **Viva Defense Tip:** In high-concurrency environments, a cached counter or database row-locking (`select_for_update`) could be added, but dynamic computation is the cleanest source of truth for university-scale workloads.

### `backend/members/models.py`
- **What it does:** Defines the `Member` model containing `name`, `email`, and optional `phone`.
- **Why:** Represents library patrons who borrow books without giving them system login capabilities. Keeps the data model focused purely on lending entity records.
- **Viva Defense Tip:** Emphasize that university policy only allows the librarian to access the management interface, so full authentication accounts for members would introduce unnecessary attack surface.

### `backend/loans/models.py`
- **What it does:** Defines the `Loan` entity linking `Book` and `Member` via ForeignKeys, with `issued_on`, `due_date`, `returned_on`, `fine`, and an `is_active` property.
- **Why:** Captures the complete audit history of every borrowing event. A loan remains active as long as `returned_on` is `None`.
- **Viva Defense Tip:** Storing `fine` directly on the completed loan freezes the historical fine assessed at the time of return, preventing retroactive changes if rates are subsequently updated.

### `backend/books/serializers.py` & `backend/books/views.py`
- **What it does:** Serializes book data (including read-only `available_copies`) and provides function-based API views (`@api_view`) for listing, searching (`?q=`), creating, editing, and deleting books.
- **Why:** Complies strictly with the architectural mandate to use thin function-based views (no class-based views). Views validate input and query the model without containing business rules.
- **Viva Defense Tip:** FBVs are easier to inspect and understand sequentially in a viva than deep inheritance trees of DRF generic viewsets.

### `backend/members/serializers.py` & `backend/members/views.py`
- **What it does:** Serializes member fields and provides thin function-based views for listing and adding library members.
- **Why:** Delivers clean CRUD endpoints while preserving the constraint that members do not authenticate.
- **Viva Defense Tip:** Input validation is handled cleanly by `MemberSerializer`, rejecting empty names or invalid email formats.

### `backend/loans/serializers.py` & `backend/loans/views.py`
- **What it does:** Serializes loans with nested book and member names, and provides thin FBVs for listing loans, issuing loans, and returning loans.
- **Why:** The return endpoint accepts a `simulate_days` parameter to demonstrate fine calculation. The views delegate all validation and lifecycle logic to `LoanService`, keeping views thin.
- **Viva Defense Tip:** Explain that `loan_return` constructs the `LoanService` with the simulated date offset and observers, proving that business logic lives entirely outside HTTP request handlers.

### `backend/reports/views.py` & `backend/reports/urls.py`
- **What it does:** Provides the `report_view` FBV which delegates report generation to `ReportFactory.get_report_builder(type).build()`.
- **Why:** Keeps the reporting view agnostic to the internal calculations and aggregate queries of different report formats.
- **Viva Defense Tip:** The view simply catches `ValueError` and maps it to HTTP 400 Bad Request if an invalid report type is requested.

### `backend/library_system/auth_views.py`
- **What it does:** Implements `login_view`, validating librarian credentials with Django's `authenticate` and returning a DRF `Token`.
- **Why:** Implements stateless TokenAuthentication without session cookies or third-party JWT overhead.
- **Viva Defense Tip:** Token authentication is robust, simple, and standard for REST APIs, requiring only an `Authorization: Token <key>` header on subsequent requests.

### `backend/loans/management/commands/create_librarian.py`
- **What it does:** Management command creating a default superuser (`librarian` / `password123`) idempotently.
- **Why:** Enables instant, zero-configuration local setup and automated evaluation by professors and examiners.
- **Viva Defense Tip:** Checking `User.objects.filter(username=username).exists()` ensures running the command multiple times does not corrupt state or raise duplicate key errors.

### `backend/library_system/settings.py` & `backend/library_system/urls.py`
- **What it does:** Configures Django settings (CORS, TokenAuth, SQLite, fallback `SECRET_KEY` from environment) and routes all endpoints under `/api/`.
- **Why:** Guarantees that CI runners and local environments work out-of-the-box without requiring manual `.env` files.
- **Viva Defense Tip:** CORS is configured cleanly via `django-cors-headers` to permit requests from the Vite frontend running on `localhost:5173`.

---

## 2. Test Architecture

### `backend/loans/tests/test_strategies.py`
- **What it does:** Unit tests pure mathematical edge cases of `DailyRateFine` and `LostBookFine` (0 days, 1 day, 50 days capped, negative days clamped).
- **Why:** Proves strategy correctness in complete isolation from database and HTTP layers.
- **Viva Defense Tip:** SimpleTestCase is used here because no database transactions are required, making execution instantaneous.

### `backend/loans/tests/test_services.py`
- **What it does:** Tests all business rules of `LoanService` (copy exhaustion, 3-loan limit, 14-day due date calculation, on-time returns, late returns with fine calculation, and observer dispatch).
- **Why:** Uses `unittest.mock.Mock` to verify that `EmailReminderObserver` only sends when fines exist, and uses clock injection (`today_fn`) to ensure determinism.
- **Viva Defense Tip:** No real emails or system clocks are used, ensuring tests never produce flaky results or require external internet access.

### `backend/reports/tests.py`
- **What it does:** Tests `ReportFactory` resolution, builder returns, aggregate calculations, and exception handling for invalid report types.
- **Why:** Verifies that both the Factory pattern and its generated aggregate dictionaries remain intact.
- **Viva Defense Tip:** Proves that aggregate mathematical calculations (like `Sum('fine')`) handle `None` values gracefully.

### `backend/library_system/tests/test_api.py`
- **What it does:** End-to-end integration tests for HTTP status codes (401 unauthorized, 200 login token, 400 validations, 404 missing records, and `simulate_days` fine return).
- **Why:** Guarantees that the REST API contract matches the exact specification expected by frontend clients and grading scripts.
- **Viva Defense Tip:** Confirms overall test line coverage achieves 99%, well above the 80% requirement.

---

## 3. Frontend Architecture

### `frontend/src/api.js`
- **What it does:** Centralized native `fetch` client that retrieves the auth token from `localStorage`, injects the `Authorization` header, and automatically redirects to `/login` if a 401 Unauthorized status is returned.
- **Why:** Eliminates duplicate boilerplate across pages and avoids bulky third-party dependencies like Axios.
- **Viva Defense Tip:** Handling 401 redirects inside the shared fetch wrapper guarantees session security consistently across all application requests.

### `frontend/src/style.css`
- **What it does:** Single stylesheet (~25 lines) defining clean, minimalist styling: system font stack, 900px centered layout, bordered data tables, and subtle button highlights.
- **Why:** Adheres strictly to the project constraint prohibiting heavy CSS frameworks (Tailwind, Bootstrap) while ensuring an accessible, readable UI.
- **Viva Defense Tip:** Modern browsers support system fonts (`system-ui`) and native flexbox layouts natively, eliminating the need for megabytes of CSS dependencies.

### `frontend/src/App.jsx` & `frontend/src/main.jsx`
- **What it does:** Sets up React Router with client-side navigation (`/books`, `/members`, `/loans`, `/report`), authentication route protection via `<ProtectedRoute>`, and global layout.
- **Why:** Prevents unauthenticated users from viewing library data, while providing seamless page transitions without full page reloads.
- **Viva Defense Tip:** Protected routing inspects the token in `localStorage`, immediately redirecting unauthenticated visits to `/login`.

### `frontend/src/pages/Login.jsx`
- **What it does:** Renders librarian authentication form, sends credentials to `/api/auth/login/`, saves the returned token, and redirects to the catalog.
- **Why:** Provides simple, direct access for the librarian without unnecessary signup or profile overhead.
- **Viva Defense Tip:** Error messages from the server are surfaced in a clean single-line banner.

### `frontend/src/pages/Books.jsx`
- **What it does:** Renders book catalog table with real-time available copies, a search filter by title or author, and an add/edit form.
- **Why:** Fulfills module 1 requirements using standard React `useState` and `useEffect` without external state stores.
- **Viva Defense Tip:** Reusing the same form for both creating and editing books simplifies the component and avoids state duplication.

### `frontend/src/pages/Members.jsx`
- **What it does:** Displays registered members table and provides a simple registration form for new members.
- **Why:** Implements module 2 cleanly with zero extraneous bells and whistles.
- **Viva Defense Tip:** The member form validates email format natively and allows phone to remain optional.

### `frontend/src/pages/Loans.jsx`
- **What it does:** Displays active and historical loans, allows issuing loans to members, and provides both standard "Return" and interactive "Return (+10 days)" buttons.
- **Why:** Implements module 3 and the live demonstration requirement. The "+10 days" button sends `simulate_days: 10` so examiners can verify fine calculations in seconds without altering database clocks.
- **Viva Defense Tip:** Book selection dynamically displays `(X available)` to prevent librarians from attempting to issue exhausted books.

### `frontend/src/pages/Report.jsx`
- **What it does:** Displays three aggregate stat cards (Total Loans, Active Loans, Total Fines Collected) and a loan activity table fetched from `/api/reports/?type=monthly`.
- **Why:** Satisfies module 5 requirements by consuming data from the backend `ReportFactory`.
- **Viva Defense Tip:** Formats currency and status consistently, allowing university administrators to gauge library usage at a glance.

---

## 4. CI & Configuration Management

### `.github/workflows/ci.yml`
- **What it does:** GitHub Actions continuous integration pipeline executing two parallel jobs: backend (install requirements, run test suite with coverage enforcement $\ge 80\%$) and frontend (`npm ci`, `npm run build`).
- **Why:** Ensures that every pull request and commit to `main` is automatically verified for passing tests, code quality, and successful builds.
- **Viva Defense Tip:** The backend job injects `DJANGO_SECRET_KEY` from environment variables, preventing insecure secret leaks in version control while ensuring automated builds succeed.

### `GIT_GUIDE.md`
- **What it does:** Detailed command-line reference detailing feature branch creation, imperative commit messages, and PR review instructions.
- **Why:** Allows the student to execute commits and branches manually to build a clean, authentic Git contribution graph.
- **Viva Defense Tip:** Following feature-branch isolation mirrors professional software engineering practices in production teams.
