import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadMembers() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/members/');
      setMembers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/members/', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone })
      });
      setName('');
      setEmail('');
      setPhone('');
      loadMembers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Member Management</h2>
          <p className="text-sm text-slate-500">Register library patrons and review borrower records</p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">
          {members.length} {members.length === 1 ? 'Member' : 'Members'}
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
          Loading member directory...
        </div>
      )}

      {/* Add Member Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3">➕ Register New Member</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="sm:col-span-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Phone Number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Register
            </button>
          </div>
        </form>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No members registered yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">#{m.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 text-slate-600">{m.email}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{m.phone || '—'}</td>
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
