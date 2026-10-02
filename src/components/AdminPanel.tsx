import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Trash2,
  Eye,
  LogOut,
  ShieldAlert,
  Shield,
  Database,
  Search,
  Mail,
  Calendar,
  Wifi,
  FileText,
  Image,
  Link,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalImages: number;
  totalLinks: number;
  liveConnections: number;
  liveUsers: number;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Admin own password change
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwData, setChangePwData] = useState({ current: '', newPw: '', confirm: '' });
  const [changePwMsg, setChangePwMsg] = useState('');
  const [changePwErr, setChangePwErr] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);

  // Reset user password
  const [resetPwEmail, setResetPwEmail] = useState('');
  const [resetPwNew, setResetPwNew] = useState('');
  const [resetPwMsg, setResetPwMsg] = useState('');
  const [resetPwErr, setResetPwErr] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);

  const token = localStorage.getItem('ownly_auth_token');

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch { /* silently ignore */ }
  };

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  React.useEffect(() => {
    const init = async () => {
      if (!token) {
        setError('You must be logged in to view this page.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setUsers(data.users);
          fetchStats();
        } else {
          setError(data.error || 'You are not authorised to view this page.');
        }
      } catch {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchUserData = async (email: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data);
        setResetPwEmail(email);
        setResetPwNew('');
        setResetPwMsg('');
        setResetPwErr('');
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
      if (data.success) {
        setUsers(users.filter((u) => u.email !== email));
        setSelectedUser(null);
      } else setError(data.error);
    } catch { setError('Failed to delete user'); }
    finally { setLoading(false); }
  };

  const toggleAdmin = async (email: string, current: boolean) => {
    if (!token) return;
    const action = current ? 'Remove admin' : 'Make admin';
    if (!confirm(`${action} for ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/user/${email}/role`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isAdmin: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => u.email === email ? { ...u, is_admin: !current } : u));
        setSelectedUser((prev: any) => prev ? { ...prev, user: { ...prev.user, is_admin: !current } } : prev);
      } else setError(data.error);
    } catch { setError('Failed to update role'); }
  };

  const handleResetUserPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPwNew.length < 6) { setResetPwErr('Minimum 6 characters'); return; }
    setResetPwLoading(true);
    setResetPwErr('');
    setResetPwMsg('');
    try {
      const res = await fetch(`/api/admin/user/${resetPwEmail}/password`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ newPassword: resetPwNew }),
      });
      const data = await res.json();
      if (data.success) { setResetPwMsg('Password reset successfully!'); setResetPwNew(''); }
      else setResetPwErr(data.error || 'Failed');
    } catch { setResetPwErr('Failed to reset password'); }
    finally { setResetPwLoading(false); }
  };

  const handleChangeOwnPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwData.newPw !== changePwData.confirm) { setChangePwErr('Passwords do not match'); return; }
    if (changePwData.newPw.length < 6) { setChangePwErr('Minimum 6 characters'); return; }
    setChangePwLoading(true);
    setChangePwErr('');
    setChangePwMsg('');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ currentPassword: changePwData.current, newPassword: changePwData.newPw }),
      });
      const data = await res.json();
      if (data.success) { setChangePwMsg('Password changed!'); setChangePwData({ current: '', newPw: '', confirm: '' }); }
      else setChangePwErr(data.error || 'Failed');
    } catch { setChangePwErr('Failed to change password'); }
    finally { setChangePwLoading(false); }
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 p-8 rounded-[28px] border border-zinc-800 w-full max-w-md shadow-2xl text-center"
        >
          <div className="p-3 bg-red-500/10 rounded-full mb-4 inline-block">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-zinc-400 text-sm">{error || 'You do not have permission to view this page.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
          >
            Go back Home
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
                {stats && <span className="ml-2 text-green-400">· {stats.liveConnections} device{stats.liveConnections !== 1 ? 's' : ''} live</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChangePw(!showChangePw)}
              className="flex items-center gap-2 px-4 py-2 bg-[#d9ad52]/10 hover:bg-[#d9ad52]/20 border border-[#d9ad52]/20 text-[#d9ad52] rounded-full text-sm transition-all"
            >
              <Lock className="w-4 h-4" /> Change Password
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-sm transition-all border border-zinc-800"
            >
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Change Own Password Panel */}
        {showChangePw && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-zinc-950 rounded-[24px] border border-[#d9ad52]/30 p-6"
          >
            <h2 className="font-bold text-[#d9ad52] flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4" /> Change Your Admin Password
            </h2>
            <form onSubmit={handleChangeOwnPw} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={changePwData.current}
                onChange={(e) => setChangePwData((p) => ({ ...p, current: e.target.value }))}
                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white"
                required
              />
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={changePwData.newPw}
                onChange={(e) => setChangePwData((p) => ({ ...p, newPw: e.target.value }))}
                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={changePwData.confirm}
                onChange={(e) => setChangePwData((p) => ({ ...p, confirm: e.target.value }))}
                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white"
                required
              />
              <button
                type="submit"
                disabled={changePwLoading}
                className="sm:col-span-3 bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#20140b] font-bold py-2 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {changePwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
            {changePwMsg && <p className="text-green-400 text-sm mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{changePwMsg}</p>}
            {changePwErr && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{changePwErr}</p>}
          </motion.div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { icon: Users, label: 'Users', value: stats.totalUsers, color: '#d9ad52' },
              { icon: FileText, label: 'Notes', value: stats.totalNotes, color: '#a78bfa' },
              { icon: Image, label: 'Images', value: stats.totalImages, color: '#60a5fa' },
              { icon: Link, label: 'Links', value: stats.totalLinks, color: '#34d399' },
              { icon: Wifi, label: 'Live Users', value: stats.liveUsers, color: '#4ade80' },
              { icon: Wifi, label: 'Connections', value: stats.liveConnections, color: '#4ade80' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="relative group overflow-hidden bg-black border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col gap-1.5 transition-all cursor-default shadow-lg">
                <div className="absolute inset-0 opacity-5 group-hover:opacity-15 transition-opacity" style={{ backgroundColor: color }} />
                <Icon className="w-5 h-5 relative z-10" style={{ color }} />
                <p className="text-2xl font-black relative z-10 tracking-tight">{value}</p>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider relative z-10">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <span className="text-xs bg-[#d9ad52]/20 text-[#d9ad52] px-3 py-1 rounded-full font-black border border-[#d9ad52]/30">
                {filteredUsers.length}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
              {filteredUsers.length === 0 ? (
                <p className="p-8 text-center text-zinc-500 text-sm">No users found</p>
              ) : (
                filteredUsers.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => fetchUserData(user.email)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 last:border-0 ${selectedUser?.user?.email === user.email ? 'bg-[#d9ad52]/10 border-l-2 border-l-[#d9ad52]' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-white truncate flex items-center gap-1.5">
                          {user.online_devices > 0 && (
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                          )}
                          {user.is_admin && <Shield className="w-3 h-3 text-[#d9ad52] shrink-0" title="Admin" />}
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
                      <Eye className="w-4 h-4 text-zinc-600 shrink-0 ml-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="lg:col-span-8 min-w-0">
            {selectedUser ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                {/* Profile card */}
                <div className="bg-zinc-950 p-4 sm:p-6 rounded-[28px] border border-white/10 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-16 h-16 rounded-2xl bg-[#d9ad52]/10 border border-[#d9ad52]/30 overflow-hidden flex items-center justify-center shrink-0">
                        {selectedUser.user?.avatar_url ? (
                          <img src={selectedUser.user.avatar_url} alt={selectedUser.user.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <Users className="w-8 h-8 text-[#d9ad52]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold truncate flex items-center gap-2">
                          {selectedUser.user?.name}
                          {selectedUser.user?.is_admin && <Shield className="w-5 h-5 text-[#d9ad52]" title="Admin" />}
                        </h2>
                        <p className="text-zinc-400 flex items-center gap-1 mt-1 truncate text-sm">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{selectedUser.user?.email}</span>
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
                      <button
                        onClick={() => toggleAdmin(selectedUser.user.email, selectedUser.user.is_admin)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${selectedUser.user?.is_admin ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-[#d9ad52]/10 border-[#d9ad52]/20 text-[#d9ad52] hover:bg-[#d9ad52]/20'}`}
                      >
                        <Shield className="w-4 h-4" />
                        {selectedUser.user?.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => deleteUser(selectedUser.user.email)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"
                        title="Delete User"
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
                    <input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={resetPwNew}
                      onChange={(e) => setResetPwNew(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d9ad52]/50 text-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resetPwLoading}
                      className="px-5 py-2 bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#20140b] font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                    >
                      {resetPwLoading ? '...' : 'Reset'}
                    </button>
                  </form>
                  {resetPwMsg && <p className="text-green-400 text-sm mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{resetPwMsg}</p>}
                  {resetPwErr && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{resetPwErr}</p>}
                </div>

                {/* Data Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10 min-w-0">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">📝 Notes ({selectedUser.notes.length})</h3>
                    <div className="space-y-3">
                      {selectedUser.notes.length === 0 ? (
                        <p className="text-xs text-zinc-500">No notes saved</p>
                      ) : (
                        selectedUser.notes.map((note: any) => (
                          <div key={note.id} className="p-3 bg-black/50 rounded-xl border border-white/5">
                            <p className="text-xs font-bold truncate text-white">{note.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-1">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">📸 Images ({selectedUser.images.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedUser.images.length === 0 ? (
                        <p className="text-xs text-zinc-500 col-span-2">No images saved</p>
                      ) : (
                        selectedUser.images.map((img: any) => (
                          <div key={img.id} className="aspect-square bg-black rounded-xl overflow-hidden border border-white/5">
                            <img src={img.data_url} className="w-full h-full object-cover" alt={img.name} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10 min-w-0">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">🔗 Links ({selectedUser.links.length})</h3>
                    <div className="space-y-3">
                      {selectedUser.links.length === 0 ? (
                        <p className="text-xs text-zinc-500">No links saved</p>
                      ) : (
                        selectedUser.links.map((link: any) => (
                          <div key={link.id} className="p-3 bg-black/50 rounded-xl border border-white/5">
                            <p className="text-xs font-bold truncate text-white">{link.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-1">{link.url}</p>
                          </div>
                        ))
                      )}
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
      </div>
    </div>
  );
}
