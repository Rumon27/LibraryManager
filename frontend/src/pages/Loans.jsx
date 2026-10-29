import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const loansUrl = activeOnly ? '/api/loans/?active=true' : '/api/loans/';
      const [loansData, booksData, membersData] = await Promise.all([
        apiFetch(loansUrl),
        apiFetch('/api/books/'),
        apiFetch('/api/members/')
      ]);
      setLoans(loansData);
      setBooks(booksData);
      setMembers(membersData);
      if (booksData.length > 0 && !selectedBook) setSelectedBook(booksData[0].id);
      if (membersData.length > 0 && !selectedMember) setSelectedMember(membersData[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeOnly]);

  async function handleIssue(e) {
    e.preventDefault();
    if (!selectedBook || !selectedMember) {
      setError('Please select both a book and a member.');
      return;
    }
    setError('');
    try {
      await apiFetch('/api/loans/', {
        method: 'POST',
        body: JSON.stringify({ book: selectedBook, member: selectedMember })
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReturn(loanId, simulateDays = 0) {
    setError('');
    try {
      await apiFetch(`/api/loans/${loanId}/return/`, {
        method: 'POST',
        body: JSON.stringify({ simulate_days: simulateDays })
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Issue & Return Loans</h2>
          <p className="text-sm text-slate-500">
            Enforces 14-day borrowing duration, 3-loan member limit, and automated fine calculation
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">
          {loans.filter((l) => l.is_active).length} Active Loans
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
          Loading loan transactions...
        </div>
      )}

      {/* Issue Book Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span>📖 Issue Book to Member</span>
        </h3>
        <form onSubmit={handleIssue} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">Select Book</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">-- Choose Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                  {b.title} ({b.available_copies} available)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">Select Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">-- Choose Member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Issue Loan
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Table Header */}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <span className="font-medium">Show active loans only</span>
        </label>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Book</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Issued On</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Fine</th>
                <th className="py-3 px-4 text-right">Actions / Demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No loan records found.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">#{loan.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{loan.book_title}</td>
                    <td className="py-3 px-4 text-slate-600">{loan.member_name}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">{loan.issued_on}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">{loan.due_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          loan.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {loan.is_active ? 'Active' : `Returned`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {Number(loan.fine) > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold text-xs rounded border border-rose-200">
                          ${loan.fine}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {loan.is_active ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReturn(loan.id, 0)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
                          >
                            Return
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReturn(loan.id, 10)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                            title="Simulate return 10 days overdue for live fine demonstration"
                          >
                            ⚡ Return (+10 days)
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">
                          Closed ({loan.returned_on})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
