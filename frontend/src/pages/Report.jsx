import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Report() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/reports/?type=monthly');
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Summary Report</h2>
          <p className="text-sm text-slate-500">
            System aggregates generated dynamically via the Factory Pattern
          </p>
        </div>
        {report && (
          <span className="self-start sm:self-auto text-xs text-slate-400 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
            Generated: {report.generated_at}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
          Compiling monthly aggregates...
        </div>
      )}

      {report && (
        <>
          {/* Three Summary Numbers Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Total Loans
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900">{report.total_loans}</h3>
                <p className="text-xs text-slate-400 mt-1">All recorded borrowings</p>
              </div>
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl font-bold">
                📑
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Active Loans
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600">{report.active_loans}</h3>
                <p className="text-xs text-slate-400 mt-1">Currently with members</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ⏳
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Total Fines Collected
                </p>
                <h3 className="text-3xl font-extrabold text-amber-600">${report.total_fines}</h3>
                <p className="text-xs text-slate-400 mt-1">Overdue fines assessed</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">
                💰
              </div>
            </div>
          </div>

          {/* Activity Breakdown Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Recent Loan Transactions</h3>
              <span className="text-xs text-slate-500 font-medium">Last 10 records</span>
            </div>
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
                    <th className="py-3 px-4 text-right">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {report.items && report.items.length > 0 ? (
                    report.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">#{item.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.book_title}</td>
                        <td className="py-3 px-4 text-slate-600">{item.member_name}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-mono">{item.issued_on}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-mono">{item.due_date}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {Number(item.fine) > 0 ? (
                            <span className="text-rose-600 font-bold">${item.fine}</span>
                          ) : (
                            <span className="text-slate-400">$0.00</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No activity recorded for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
