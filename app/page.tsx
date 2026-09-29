'use client';
import { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function StudentCheckIn() {
  const [form, setForm] = useState({ fullName: '', membershipNo: '', phone: '' });
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if student details are already saved in their phone's browser
  useEffect(() => {
    const savedUser = localStorage.getItem('ppl_student_profile');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setForm(parsedUser);
      setIsReturningUser(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Save profile to local storage so they never have to type it again
    localStorage.setItem('ppl_student_profile', JSON.stringify(form));

    const { error } = await supabase.from('library_checkins').insert([
      {
        full_name: form.fullName,
        membership_number: form.membershipNo,
        phone_number: form.phone,
      },
    ]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
    } else {
      alert('Something went wrong. Please try again.');
    }
  };

  const handleResetUser = () => {
    localStorage.removeItem('ppl_student_profile');
    setForm({ fullName: '', membershipNo: '', phone: '' });
    setIsReturningUser(false);
    setSuccess(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Punjab Public Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isReturningUser ? 'Welcome Back! Quick Daily Check-In' : 'First-Time Registration'}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center space-y-3">
            <p className="font-semibold text-lg">Checked In Successfully!</p>
            <p className="text-sm text-green-700">Have a productive study session inside.</p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Done / Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                disabled={isReturningUser}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
                placeholder="e.g., Muhammad Ali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Library Card / Roll Number</label>
              <input
                type="text"
                required
                disabled={isReturningUser}
                value={form.membershipNo}
                onChange={(e) => setForm({ ...form, membershipNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
                placeholder="e.g., PPL-2026-104"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                disabled={isReturningUser}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
                placeholder="0300-1234567"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : isReturningUser ? `Check In as ${form.fullName}` : 'Register & Check In'}
            </button>

            {isReturningUser && (
              <button
                type="button"
                onClick={handleResetUser}
                className="w-full text-center text-sm text-red-600 hover:underline mt-2"
              >
                Not you? Switch account / Edit details
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}