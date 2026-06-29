import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminUser, LoginHistoryEntry, AdminRestriction, AdminStats } from '../types';
import {
  Users, Shield, Activity, Ban, Trash2, UserX, UserCheck,
  Globe, Clock, AlertTriangle, BarChart3, RefreshCw, Plus, X, Eye
} from 'lucide-react';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'logins' | 'restrictions'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [restrictions, setRestrictions] = useState<AdminRestriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddRestriction, setShowAddRestriction] = useState(false);
  const [newRestriction, setNewRestriction] = useState({ type: 'ip_ban', value: '', reason: '' });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/login-history?limit=100');
      if (res.ok) setLoginHistory(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchRestrictions = async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/restrictions');
      if (res.ok) setRestrictions(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchLoginHistory();
    fetchRestrictions();
  }, []);

  const toggleUserActive = async (userId: number) => {
    try {
      const res = await api(`/api/admin/users/${userId}/toggle-active`, { method: 'PUT' });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user and all their data?')) return;
    try {
      const res = await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const addRestriction = async () => {
    if (!newRestriction.value) return;
    try {
      const res = await api('/api/admin/restrictions', {
        method: 'POST',
        body: JSON.stringify(newRestriction),
      });
      if (res.ok) {
        fetchRestrictions();
        setShowAddRestriction(false);
        setNewRestriction({ type: 'ip_ban', value: '', reason: '' });
      }
    } catch (err) { console.error(err); }
  };

  const removeRestriction = async (id: number) => {
    try {
      const res = await api(`/api/admin/restrictions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRestrictions();
    } catch (err) { console.error(err); }
  };

  const viewUserDetails = async (userId: number) => {
    try {
      const res = await api(`/api/admin/users/${userId}`);
      if (res.ok) setSelectedUser(await res.json());
    } catch (err) { console.error(err); }
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'logins', label: 'Login History', icon: Activity },
    { id: 'restrictions', label: 'Restrictions', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users, monitor activity, and enforce restrictions</p>
        </div>
        <button onClick={() => { fetchStats(); fetchUsers(); fetchLoginHistory(); fetchRestrictions(); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === s.id ? 'bg-white text-[#7C5CFC] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
              { label: 'Active Users', value: stats.activeUsers, color: 'green' },
              { label: 'Total Campaigns', value: stats.totalCampaigns, color: 'purple' },
              { label: 'Emails Sent', value: stats.totalEmailsSent, color: 'orange' },
              { label: 'Total Contacts', value: stats.totalContacts, color: 'pink' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Recent Logins */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C5CFC]" />
              Recent Login Activity
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.recentLogins.map((login, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{login.user_email}</p>
                      <p className="text-xs text-gray-400">{login.user_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-500">{login.ip_address}</p>
                    <p className="text-xs text-gray-400">{new Date(login.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Last IP</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{user.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {user.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-500">
                      {user.last_login_ip || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewUserDetails(user.id)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleUserActive(user.id)} className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`} title={user.is_active ? 'Disable' : 'Enable'}>
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => deleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Name</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{selectedUser.name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Role</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{selectedUser.role}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Status</p>
                  <p className={`text-sm font-medium mt-0.5 ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.is_active ? 'Active' : 'Disabled'}
                  </p>
                </div>
              </div>
              {selectedUser.stats && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Usage Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{selectedUser.stats.accounts}</p>
                      <p className="text-xs text-purple-400">Gmail Accounts</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{selectedUser.stats.contacts}</p>
                      <p className="text-xs text-blue-400">Contacts</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{selectedUser.stats.campaigns}</p>
                      <p className="text-xs text-green-400">Campaigns</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">{selectedUser.stats.emailsSent}</p>
                      <p className="text-xs text-orange-400">Emails Sent</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">Last Login: {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : 'Never'}</p>
                <p className="text-xs text-gray-400">Last IP: {selectedUser.last_login_ip || '—'}</p>
                <p className="text-xs text-gray-400">Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login History Section */}
      {activeSection === 'logins' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loginHistory.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{entry.user_email}</p>
                      <p className="text-xs text-gray-400">{entry.user_name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{entry.ip_address}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        entry.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {entry.success ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                      {entry.user_agent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restrictions Section */}
      {activeSection === 'restrictions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Manage IP bans and user restrictions</p>
            <button
              onClick={() => setShowAddRestriction(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7C5CFC] text-white text-sm font-medium rounded-xl hover:bg-[#6B4AEB] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Restriction
            </button>
          </div>

          {/* Add Restriction Modal */}
          {showAddRestriction && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">New Restriction</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newRestriction.type}
                  onChange={e => setNewRestriction({ ...newRestriction, type: e.target.value })}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
                >
                  <option value="ip_ban">IP Ban</option>
                  <option value="user_ban">User Ban (by ID)</option>
                </select>
                <input
                  type="text"
                  placeholder={newRestriction.type === 'ip_ban' ? 'IP Address (e.g. 192.168.1.1)' : 'User ID'}
                  value={newRestriction.value}
                  onChange={e => setNewRestriction({ ...newRestriction, value: e.target.value })}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={newRestriction.reason}
                  onChange={e => setNewRestriction({ ...newRestriction, reason: e.target.value })}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={addRestriction} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors">
                  Apply Restriction
                </button>
                <button onClick={() => setShowAddRestriction(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Restrictions List */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {restrictions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active restrictions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {restrictions.map(r => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        r.type === 'ip_ban' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'
                      }`}>
                        {r.type === 'ip_ban' ? <Globe className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {r.type === 'ip_ban' ? 'IP Ban' : 'User Ban'}: <span className="font-mono">{r.value}</span>
                        </p>
                        <p className="text-xs text-gray-400">{r.reason || 'No reason specified'} • Added {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => removeRestriction(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
