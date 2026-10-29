import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Books from './pages/Books';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Report from './pages/Report';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  const navLinks = [
    { path: '/books', label: 'Books' },
    { path: '/members', label: 'Members' },
    { path: '/loans', label: 'Loans' },
    { path: '/report', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              📚
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Library Book Lending</h1>
              <p className="text-xs text-slate-500 font-medium">Software Engineering Sessional</p>
            </div>
          </div>

          {!isLoginPage && (
            <div className="flex items-center gap-1 sm:gap-2">
              <nav className="flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="h-5 w-px bg-slate-200 mx-2 hidden sm:block" />

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        RUET CSE 3206 — Software Engineering Sessional
      </footer>
    </div>
  );
}
