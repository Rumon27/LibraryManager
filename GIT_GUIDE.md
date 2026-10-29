# Git Workflow Guide

This guide contains the exact step-by-step Git commands to initialize the repository, work on feature branches, make imperative commits, and merge pull requests so that the commit history reflects your own contributions.

---

## 1. Initial Repository Setup

Run these commands in the project root directory (`SW Lab6`):

```bash
# 1. Initialize git repository
git init

# 2. Add remote origin (replace <your-repo-url> with your GitHub repository URL)
git remote add origin <your-repo-url>

# 3. Create initial commit on main
git checkout -b main
git add .gitignore README.md NOTES.md .github/ GIT_GUIDE.md
git commit -m "initialize repository structure and documentation"
git push -u origin main
```

---

## 2. Feature Branches and Commits

Do **not** commit directly to `main`. Use small logical commits with imperative commit messages. Follow this feature-branch sequence:

### Branch 1: Feature Book Catalog & Member Management
```bash
git checkout -b feature/book-catalog

# Stage and commit models & migrations
git add backend/books/ backend/members/
git commit -m "add Book and Member models and migrations"

# Stage and commit API views & serializers
git add backend/books/views.py backend/books/serializers.py backend/members/views.py backend/members/serializers.py
git commit -m "implement Book CRUD and Member endpoints"

# Push branch to GitHub
git push -u origin feature/book-catalog
```
*Open a Pull Request on GitHub from `feature/book-catalog` into `main`, then merge it on GitHub (or locally via `git checkout main && git merge feature/book-catalog && git push origin main`).*

---
#tomorrow Start from here
### Branch 2: Feature Design Patterns (Strategy, Observer, Factory)
```bash
git checkout main
git pull origin main
git checkout -b feature/fine-strategy

# Stage notification service
git add backend/notifications/
git commit -m "add EmailService abstraction and console implementation"

# Stage Strategy pattern
git add backend/loans/strategies.py backend/loans/tests/test_strategies.py
git commit -m "implement FineStrategy with daily rate and lost book calculations"

# Stage Observer pattern
git add backend/loans/observers.py
git commit -m "implement LoanObserver with email reminder and audit logging"

# Stage Factory pattern
git add backend/reports/factories.py backend/reports/tests/test_factories.py
git commit -m "implement ReportFactory for monthly and overdue report builders"

# Push branch
git push -u origin feature/fine-strategy
```
*Open a PR from `feature/fine-strategy` into `main` and merge.*

---

### Branch 3: Feature Loans Service & Core Logic
```bash
git checkout main
git pull origin main
git checkout -b feature/loans-service

# Stage Loan model and migrations
git add backend/loans/models.py backend/loans/migrations/
git commit -m "add Loan model with active loan property"

# Stage LoanService and tests
git add backend/loans/services.py backend/loans/tests/test_services.py
git commit -m "implement LoanService with issue, return, and clock injection"

# Stage API views and integration tests
git add backend/loans/views.py backend/loans/serializers.py backend/library_system/
git commit -m "add loan issue, return endpoints and test coverage"

# Push branch
git push -u origin feature/loans-service
```
*Open a PR from `feature/loans-service` into `main` and merge.*

---

### Branch 4: Feature React Frontend
```bash
git checkout main
git pull origin main
git checkout -b feature/react-pages

# Stage Vite configuration and base styles
git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/src/style.css frontend/src/api.js
git commit -m "setup Vite React application, API client, and minimal styles"

# Stage pages and routing
git add frontend/src/App.jsx frontend/src/main.jsx frontend/src/pages/
git commit -m "implement Login, Books, Members, Loans, and Reports pages"

# Push branch
git push -u origin feature/react-pages
```
*Open a PR from `feature/react-pages` into `main` and merge.*

---

## 3. Useful Verification Commands

```bash
# Check current status
git status

# View commit tree
git log --oneline --graph --all

# Run backend tests before pushing
cd backend
python manage.py test
cd ..

# Build frontend before pushing
cd frontend
npm run build
cd ..
```
