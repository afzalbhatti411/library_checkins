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

const monthsList = [
  { name: 'Jan', value: '0' },
  { name: 'Feb', value: '1' },
  { name: 'Mar', value: '2' },
  { name: 'Apr', value: '3' },
  { name: 'May', value: '4' },
  { name: 'Jun', value: '5' },
  { name: 'Jul', value: '6' },
  { name: 'Aug', value: '7' },
  { name: 'Sep', value: '8' },
  { name: 'Oct', value: '9' },
  { name: 'Nov', value: '10' },
  { name: 'Dec', value: '11' },
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('library_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchCheckins();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'punjablibrary123';
    
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('library_admin_auth', 'true');
      setLoginError(false);
      fetchCheckins();
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('library_admin_auth');
    setPasswordInput('');
  };

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

  const now = new Date();
  const todayStr = now.toDateString();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const todayCount = checkins.filter(item => new Date(item.check_in_time).toDateString() === todayStr).length;
  const weekCount = checkins.filter(item => new Date(item.check_in_time) >= startOfWeek).length;
  const monthCount = checkins.filter(item => new Date(item.check_in_time) >= startOfMonth).length;
  const yearCount = checkins.filter(item => new Date(item.check_in_time) >= startOfYear).length;

  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleString('default', { month: 'short' });
  const weekRangeStr = `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - Today`;
  const todayDateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const monthlyStats = monthsList.map(m => {
    const monthIndex = parseInt(m.value);
    const monthCheckins = checkins.filter(item => {
      const d = new Date(item.check_in_time);
      return d.getMonth() === monthIndex && d.getFullYear() === currentYear;
    });

    const daysMap: { [dateStr: string]: CheckIn[] } = {};
    monthCheckins.forEach(item => {
      const dStr = new Date(item.check_in_time).toDateString();
      if (!daysMap[dStr]) daysMap[dStr] = [];
      daysMap[dStr].push(item);
    });

    return {
      name: m.name,
      value: m.value,
      totalCount: monthCheckins.length,
      days: daysMap
    };
  });

  const filteredCheckins = checkins.filter((item) => {
    const matchesSearch =
      item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.membership_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const itemDate = new Date(item.check_in_time);

    if (selectedDate) {
      const targetDate = new Date(selectedDate);
      if (itemDate.toDateString() !== targetDate.toDateString()) return false;
    }

    if (selectedMonth !== 'all' && !selectedDate) {
      if (itemDate.getMonth().toString() !== selectedMonth) return false;
    }

    if (!selectedDate && selectedMonth === 'all') {
      if (timeFilter === 'today') return matchesSearch && itemDate.toDateString() === todayStr;
      if (timeFilter === 'week') return matchesSearch && itemDate >= startOfWeek;
      if (timeFilter === 'month') return matchesSearch && itemDate >= startOfMonth;
      if (timeFilter === 'year') return matchesSearch && itemDate >= startOfYear;
    }

    return matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Library Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Punjab Public Library Secure Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-gray-50 px-2 py-1 rounded"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-red-600 font-medium">Incorrect password. Please try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library Admin Dashboard</h1>
            <p className="text-gray-600">Punjab Public Library Attendance & Analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCheckins}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition text-sm font-medium"
            >
              Refresh Records
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading data: {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => { setTimeFilter('today'); setSelectedMonth('all'); setSelectedDate(''); setExpandedMonth(null); }} 
            className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition ${timeFilter === 'today' && !selectedDate && selectedMonth === 'all' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-300'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{todayCount}</p>
            <p className="text-xs text-gray-400 mt-1">{todayDateStr}</p>
          </div>
          <div 
            onClick={() => { setTimeFilter('week'); setSelectedMonth('all'); setSelectedDate(''); setExpandedMonth(null); }} 
            className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition ${timeFilter === 'week' && !selectedDate && selectedMonth === 'all' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-300'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Week</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{weekCount}</p>
            <p className="text-xs text-gray-400 mt-1">{weekRangeStr}</p>
          </div>
          <div 
            onClick={() => { setTimeFilter('month'); setSelectedMonth('all'); setSelectedDate(''); setExpandedMonth(null); }} 
            className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition ${timeFilter === 'month' && !selectedDate && selectedMonth === 'all' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-300'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Month</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{monthCount}</p>
            <p className="text-xs text-gray-400 mt-1">{currentMonthName} {currentYear}</p>
          </div>
          <div 
            onClick={() => { setTimeFilter('year'); setSelectedMonth('all'); setSelectedDate(''); setExpandedMonth(null); }} 
            className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition ${timeFilter === 'year' && !selectedDate && selectedMonth === 'all' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-300'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Year</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{yearCount}</p>
            <p className="text-xs text-gray-400 mt-1">Year {currentYear}</p>
          </div>
        </div>

        {/* MONTHLY & DAILY FIGURES SECTION */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Monthly & Daily Breakdown ({currentYear})
            </h2>
            {selectedMonth !== 'all' && (
              <button
                onClick={() => setSelectedMonth('all')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Clear Month Filter [Show All]
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {monthlyStats.map((m) => (
              <div 
                key={m.value} 
                className={`border rounded-lg p-3 transition flex flex-col justify-between ${selectedMonth === m.value ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-100' : 'border-gray-200 bg-gray-50'}`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span 
                      onClick={() => { setSelectedMonth(m.value); setSelectedDate(''); setTimeFilter('all'); }}
                      className="font-bold text-gray-800 text-sm cursor-pointer hover:text-indigo-600"
                      title="Click to filter table by this month"
                    >
                      {m.name}
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {m.totalCount}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedMonth(expandedMonth === m.value ? null : m.value)}
                  className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                >
                  {expandedMonth === m.value ? '▲ Hide Days' : '▼ Expand Days'}
                </button>
              </div>
            ))}
          </div>

          {/* EXPANDED DAILY DETAILS VIEW */}
          {expandedMonth && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-indigo-900">
                  Daily Breakdown for {monthsList.find(m => m.value === expandedMonth)?.name} {currentYear}
                </h3>
                <button 
                  onClick={() => setExpandedMonth(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Close [X]
                </button>
              </div>

              {Object.keys(monthlyStats.find(m => m.value === expandedMonth)?.days || {}).length === 0 ? (
                <p className="text-xs text-gray-500 italic">No check-in records for this month.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(monthlyStats.find(m => m.value === expandedMonth)?.days || {}).map(([dateStr, records]) => (
                    <div 
                      key={dateStr}
                      onClick={() => { setSelectedDate(dateStr); setExpandedMonth(null); setSelectedMonth('all'); }}
                      className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm cursor-pointer hover:border-indigo-500 transition flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{dateStr}</p>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">Click to view records</p>
                      </div>
                      <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                        {records.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SPECIFIC DATE PICKER BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex justify-end items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Specific Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setTimeFilter('all'); setSelectedMonth('all'); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-red-600 font-medium hover:underline whitespace-nowrap ml-1"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* STUDENT ATTENDANCE TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-center">
            <input
              type="text"
              placeholder="Search by name or membership number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 items-center text-sm">
              <span className="text-gray-500">Active View:</span>
              <span className="font-semibold text-indigo-600">
                {selectedDate ? `Date: ${selectedDate}` : selectedMonth !== 'all' ? `Month: ${monthsList.find(m => m.value === selectedMonth)?.name}` : timeFilter !== 'all' ? `Filter: ${timeFilter.toUpperCase()}` : 'All Records'}
              </span>
            </div>
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
                    <td colSpan={4} className="p-8 text-center text-gray-400">No check-in records found for this selection.</td>
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