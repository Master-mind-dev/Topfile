import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Trash2, Eye, LogOut, ShieldAlert, Shield, Database, Search,
  Mail, Calendar, Wifi, FileText, Image, Link, KeyRound,
  CheckCircle2, XCircle, Lock, Bell, Clock, Check, X,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalImages: number;
  totalLinks: number;
  liveConnections: number;
  liveUsers: number;
  pendingResets: number;
}

interface ResetRequest {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [filterType, setFilterType] = useState<string>('Users');

  // Reset requests
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [requestPasswords, setRequestPasswords] = useState<Record<string, string>>({});
  const [requestMsgs, setRequestMsgs] = useState<Record<string, { type: 'ok' | 'err'; text: string }>>({});
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});



  // Reset user password (from user detail card)
  const [resetPwEmail, setResetPwEmail] = useState('');
  const [resetPwNew, setResetPwNew] = useState('');
  const [resetPwMsg, setResetPwMsg] = useState('');
  const [resetPwErr, setResetPwErr] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const token = localStorage.getItem('ownly_admin_token');
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchResetRequests = async () => {
    try {
      const res = await fetch('/api/admin/reset-requests', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setResetRequests(data.requests);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch { /* silently ignore */ }
  };

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => { fetchStats(); fetchResetRequests(); }, 15_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  React.useEffect(() => {
    const init = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch('/api/admin/users', { headers: authHeaders });
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setUsers(data.users);
          await Promise.all([fetchStats(), fetchResetRequests()]);
        } else {
          setError(data.error || 'Invalid session.');
        }
      } catch { setError('Failed to connect to server.'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ownly_admin_token', data.token);
        window.location.reload();
      } else {
        setError(data.error);
      }
    } catch { setError('Failed to connect'); }
    finally { setLoginLoading(false); }
  };

  const fetchUserData = async (email: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data);
        setResetPwEmail(email);
        setResetPwNew(''); setResetPwMsg(''); setResetPwErr('');
      } else setError(data.error);
    } catch { setError('Failed to fetch user data'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (email: string) => {
    if (!token) return;
    if (!confirm(`Delete ${email} and ALL their data? This cannot be undone!`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setUsers(users.filter((u) => u.email !== email)); setSelectedUser(null); }
      else setError(data.error);
    } catch { setError('Failed to delete user'); }
    finally { setLoading(false); }
  };

  const toggleAdmin = async (email: string, current: boolean) => {
    if (!confirm(`${current ? 'Remove admin from' : 'Make admin'}: ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/user/${email}/role`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ isAdmin: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => u.email === email ? { ...u, is_admin: !current } : u));
        setSelectedUser((prev: any) => prev ? { ...prev, user: { ...prev.user, is_admin: !current } } : prev);
      } else setError(data.error);
    } catch { setError('Failed to update role'); }
  };

  const fulfilRequest = async (req: ResetRequest) => {
    const pw = requestPasswords[req.id] || '';
    if (pw.length < 6) {
      setRequestMsgs((m) => ({ ...m, [req.id]: { type: 'err', text: 'Minimum 6 characters' } }));
      return;
    }
    setRequestLoading((l) => ({ ...l, [req.id]: true }));
    try {
      const res = await fetch(`/api/admin/reset-requests/${req.id}/fulfil`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ newPassword: pw }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestMsgs((m) => ({ ...m, [req.id]: { type: 'ok', text: `Done! Password set for ${req.email}` } }));
        setTimeout(() => setResetRequests((r) => r.filter((x) => x.id !== req.id)), 1500);
      } else {
        setRequestMsgs((m) => ({ ...m, [req.id]: { type: 'err', text: data.error } }));
      }
    } catch {
      setRequestMsgs((m) => ({ ...m, [req.id]: { type: 'err', text: 'Failed' } }));
    } finally {
      setRequestLoading((l) => ({ ...l, [req.id]: false }));
    }
  };

  const dismissRequest = async (id: string) => {
    try {
      await fetch(`/api/admin/reset-requests/${id}`, { method: 'DELETE', headers: authHeaders });
      setResetRequests((r) => r.filter((x) => x.id !== id));
    } catch { /* silent */ }
  };

  const handleResetUserPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPwNew.length < 6) { setResetPwErr('Minimum 6 characters'); return; }
    setResetPwLoading(true); setResetPwErr(''); setResetPwMsg('');
    try {
      const res = await fetch(`/api/admin/user/${resetPwEmail}/password`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ newPassword: resetPwNew }),
      });
      const data = await res.json();
      if (data.success) { setResetPwMsg('Password reset successfully!'); setResetPwNew(''); }
      else setResetPwErr(data.error || 'Failed');
    } catch { setResetPwErr('Failed to reset password'); }
    finally { setResetPwLoading(false); }
  };



  const filteredUsers = users
    .filter(
      (u) => !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((u) => {
      if (filterType === 'Live Users' || filterType === 'Connections') return u.online_devices > 0;
      if (filterType === 'Notes') return (u.notes_count || 0) > 0;
      if (filterType === 'Images') return (u.images_count || 0) > 0;
      if (filterType === 'Links') return (u.links_count || 0) > 0;
      return true;
    })
    .sort((a, b) => {
      if (filterType === 'Notes') return (b.notes_count || 0) - (a.notes_count || 0);
      if (filterType === 'Images') return (b.images_count || 0) - (a.images_count || 0);
      if (filterType === 'Links') return (b.links_count || 0) - (a.links_count || 0);
      return 0; // Default: already sorted by joined_date DESC from backend
    });

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d9ad52]/10 to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950 p-8 rounded-[28px] border border-zinc-800/50 shadow-2xl w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-[#d9ad52]/10 rounded-2xl mb-4 text-[#d9ad52]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black">Admin Access</h1>
            <p className="text-zinc-500 text-sm mt-2">Log in with your administrator credentials</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input type="email" placeholder="Admin Email" required
                value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d9ad52]/50 text-white transition-colors"
              />
            </div>
            <div>
              <input type="password" placeholder="Admin Password" required
                value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d9ad52]/50 text-white transition-colors"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</p>}
            
            <button type="submit" disabled={loginLoading}
              className="w-full bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#20140b] font-black py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2"
            >
              {loginLoading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>
          
          <button onClick={() => window.location.href = '/'} className="w-full text-center text-sm text-zinc-500 hover:text-white mt-6 transition-colors">
            ← Back to App
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d9ad52]/10 rounded-xl">
              <Database className="w-6 h-6 text-[#d9ad52]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-white/40 mt-0.5">
                {users.length} users
                {stats && <span className="ml-2 text-green-400">· {stats.liveConnections} live</span>}
                {stats?.pendingResets! > 0 && <span className="ml-2 text-amber-400">· {stats?.pendingResets} reset request{stats?.pendingResets !== 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { localStorage.removeItem('ownly_admin_token'); window.location.href = '/'; }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-sm transition-all border border-zinc-800"
            >
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { icon: Users, label: 'Users', value: stats.totalUsers, color: '#d9ad52' },
              { icon: FileText, label: 'Notes', value: stats.totalNotes, color: '#a78bfa' },
              { icon: Image, label: 'Images', value: stats.totalImages, color: '#60a5fa' },
              { icon: Link, label: 'Links', value: stats.totalLinks, color: '#34d399' },
              { icon: Bell, label: 'Resets', value: stats.pendingResets, color: stats.pendingResets > 0 ? '#f59e0b' : '#555' },
              { icon: Wifi, label: 'Live Users', value: stats.liveUsers, color: '#4ade80' },
              { icon: Wifi, label: 'Connections', value: stats.liveConnections, color: '#4ade80' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <motion.div 
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  if (label === 'Resets') setActiveTab('requests');
                  else {
                    setActiveTab('users');
                    setFilterType(label);
                  }
                }}
                className={`relative group overflow-hidden bg-black border ${filterType === label ? 'ring-1 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:-translate-y-1'} rounded-2xl p-4 flex flex-col gap-1.5 transition-all cursor-pointer shadow-lg`}
                style={{ borderColor: filterType === label ? color : undefined, boxShadow: filterType === label ? `0 0 0 1px ${color}` : undefined }}
              >
                <div className="absolute inset-0 opacity-5 group-hover:opacity-15 transition-opacity duration-300" style={{ backgroundColor: color }} />
                {filterType === label && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }} />}
                <Icon className={`w-5 h-5 relative z-10 ${filterType === label ? 'animate-pulse' : ''}`} style={{ color }} />
                <p className="text-2xl font-black relative z-10 tracking-tight">{value}</p>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider relative z-10">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-[#d9ad52] text-[#20140b]' : 'bg-zinc-900 text-white/60 border border-white/10 hover:text-white'}`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-[#d9ad52] text-[#20140b]' : 'bg-zinc-900 text-white/60 border border-white/10 hover:text-white'}`}
          >
            <Bell className="w-4 h-4" /> Reset Requests
            {resetRequests.length > 0 && (
              <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">{resetRequests.length}</span>
            )}
          </button>
        </div>

        {/* ===== RESET REQUESTS TAB ===== */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {resetRequests.length === 0 ? (
              <div className="bg-zinc-950 rounded-[24px] border border-white/10 p-12 text-center text-zinc-500">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No pending password reset requests</p>
                <p className="text-xs mt-1">When users click "Forgot Password", their requests will appear here.</p>
              </div>
            ) : (
              resetRequests.map((req) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-950 rounded-[20px] border border-amber-500/20 p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        {req.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {req.email}
                      </p>
                      <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Requested {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="password"
                        placeholder="Set new password"
                        value={requestPasswords[req.id] || ''}
                        onChange={(e) => setRequestPasswords((p) => ({ ...p, [req.id]: e.target.value }))}
                        className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white w-44"
                      />
                      <button
                        onClick={() => fulfilRequest(req)}
                        disabled={requestLoading[req.id]}
                        className="p-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl transition-all"
                        title="Set password & fulfil"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => dismissRequest(req.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
                        title="Dismiss request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {requestMsgs[req.id] && (
                    <p className={`text-sm mt-2 flex items-center gap-1 ${requestMsgs[req.id].type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                      {requestMsgs[req.id].type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {requestMsgs[req.id].text}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email…"
                className="w-full bg-zinc-900 border border-white/10 rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#d9ad52]/50 transition-all text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* User List */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start bg-zinc-950 rounded-[24px] border border-white/10 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#d9ad52]" /> Registered Users
                  </h2>
                  <span className="text-xs bg-[#d9ad52]/20 text-[#d9ad52] px-3 py-1 rounded-full font-black border border-[#d9ad52]/30">{filteredUsers.length}</span>
                </div>
                <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
                  {filteredUsers.length === 0 ? (
                    <p className="p-8 text-center text-zinc-500 text-sm">No users found</p>
                  ) : (
                    filteredUsers.map((user: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={user.id} 
                        onClick={() => fetchUserData(user.email)}
                        className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 last:border-0 ${selectedUser?.user?.email === user.email ? 'bg-[#d9ad52]/10 border-l-2 border-l-[#d9ad52]' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-white truncate flex items-center gap-1.5">
                              {user.online_devices > 0 && <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />}
                              {user.is_admin && <span title="Admin"><Shield className="w-3 h-3 text-[#d9ad52] shrink-0" /></span>}
                              {user.name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">{user.plan}</span>
                              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {user.joined_date ? new Date(user.joined_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <Eye className={`w-4 h-4 shrink-0 ml-2 transition-all ${selectedUser?.user?.email === user.email ? 'text-[#d9ad52] scale-110' : 'text-zinc-600 group-hover:text-white'}`} />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="lg:col-span-8 min-w-0">
                {selectedUser ? (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    {/* Profile */}
                    <div className="bg-zinc-950 p-4 sm:p-6 rounded-[28px] border border-white/10 shadow-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-16 h-16 rounded-2xl bg-[#d9ad52]/10 border border-[#d9ad52]/30 overflow-hidden flex items-center justify-center shrink-0">
                            {selectedUser.user?.avatar_url
                              ? <img src={selectedUser.user.avatar_url} alt={selectedUser.user.name} className="w-full h-full object-cover" />
                              : <Users className="w-8 h-8 text-[#d9ad52]" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold truncate flex items-center gap-2">
                              {selectedUser.user?.name}
                              {selectedUser.user?.is_admin && <Shield className="w-5 h-5 text-[#d9ad52]" />}
                            </h2>
                            <p className="text-zinc-400 flex items-center gap-1 mt-1 text-sm truncate">
                              <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{selectedUser.user?.email}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs bg-[#d9ad52]/10 text-[#d9ad52] px-3 py-1 rounded-full font-semibold border border-[#d9ad52]/30">
                                {selectedUser.user?.plan || 'Personal Pro'}
                              </span>
                              <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
                                {selectedUser.user?.storage_used_mb || 0}MB / {selectedUser.user?.total_storage_mb || 1024}MB
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => toggleAdmin(selectedUser.user.email, selectedUser.user.is_admin)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${selectedUser.user?.is_admin ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-[#d9ad52]/10 border-[#d9ad52]/20 text-[#d9ad52] hover:bg-[#d9ad52]/20'}`}
                          >
                            <Shield className="w-4 h-4" />
                            {selectedUser.user?.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button onClick={() => deleteUser(selectedUser.user.email)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reset User Password */}
                    <div className="bg-zinc-950 p-5 rounded-[24px] border border-white/10">
                      <h3 className="font-bold flex items-center gap-2 text-white mb-4">
                        <KeyRound className="w-4 h-4 text-[#d9ad52]" /> Reset Password for {selectedUser.user?.name}
                      </h3>
                      <form onSubmit={handleResetUserPw} className="flex gap-3">
                        <input type="password" placeholder="Set new password (min 6 chars)" value={resetPwNew}
                          onChange={(e) => setResetPwNew(e.target.value)}
                          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white" required
                        />
                        <button type="submit" disabled={resetPwLoading}
                          className="px-5 py-2 bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#20140b] font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                          {resetPwLoading ? '...' : 'Reset'}
                        </button>
                      </form>
                      {resetPwMsg && <p className="text-green-400 text-sm mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{resetPwMsg}</p>}
                      {resetPwErr && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{resetPwErr}</p>}
                    </div>

                    {/* Data */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10 min-w-0">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">📝 Notes ({selectedUser.notes.length})</h3>
                        <div className="space-y-3">
                          {selectedUser.notes.length === 0 ? <p className="text-xs text-zinc-500">No notes</p> :
                            selectedUser.notes.map((note: any) => (
                              <div key={note.id} className="p-3 bg-black/50 rounded-xl border border-white/5">
                                <p className="text-xs font-bold truncate text-white">{note.title}</p>
                                <p className="text-[10px] text-zinc-500 truncate mt-1">{note.content}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">📸 Images ({selectedUser.images.length})</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedUser.images.length === 0 ? <p className="text-xs text-zinc-500 col-span-2">No images</p> :
                            selectedUser.images.map((img: any) => (
                              <div key={img.id} className="aspect-square bg-black rounded-xl overflow-hidden border border-white/5">
                                <img src={img.data_url} className="w-full h-full object-cover" alt={img.name} />
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10 min-w-0">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">🔗 Links ({selectedUser.links.length})</h3>
                        <div className="space-y-3">
                          {selectedUser.links.length === 0 ? <p className="text-xs text-zinc-500">No links</p> :
                            selectedUser.links.map((link: any) => (
                              <div key={link.id} className="p-3 bg-black/50 rounded-xl border border-white/5">
                                <p className="text-xs font-bold truncate text-white">{link.title}</p>
                                <p className="text-[10px] text-zinc-500 truncate mt-1">{link.url}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-12 bg-zinc-950 rounded-[28px] border border-white/10 min-h-[400px]">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a user from the list to view their data</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
