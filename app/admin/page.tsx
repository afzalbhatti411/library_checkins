'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CheckIn {
  id: string;
  full_name: string;
  membership_number: string;
  phone_number?: string;
  check_in_time: string;
}

export default function AdminDashboard() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCheckins();
  }, []);

  async function fetchCheckins() {
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('library_checkins')
      .select('*')
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      setErrorMsg(error.message);
    } else if (data) {
      setCheckins(data);
    }
    setLoading(false);
  }

  const filteredCheckins = checkins.filter(
    (item) =>
      item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.membership_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library Admin Dashboard</h1>
            <p className="text-gray-600">Punjab Public Library Attendance</p>
          </div>
          <button
            onClick={fetchCheckins}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition"
          >
            Refresh Records
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading data: {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Records Found</p>
            <p className="text-4xl font-bold text-indigo-600 mt-2">{checkins.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search by name or membership number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Time</th>
                  <th className="p-4 font-semibold">Full Name</th>
                  <th className="p-4 font-semibold">Membership Number</th>
                  <th className="p-4 font-semibold">Phone Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">Loading records...</td>
                  </tr>
                ) : filteredCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">No check-in records found.</td>
                  </tr>
                ) : (
                  filteredCheckins.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        {record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{record.full_name}</td>
                      <td className="p-4">{record.membership_number}</td>
                      <td className="p-4">{record.phone_number || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}