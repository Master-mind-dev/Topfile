import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Trash2,
  Eye,
  LogOut,
  ShieldAlert,
  Database,
  Search,
  Mail,
  Calendar,
} from 'lucide-react';

export function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': adminPassword },
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setUsers(data.users);
      } else {
        setError(data.error || 'Invalid admin password');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, {
        headers: { 'x-admin-password': adminPassword },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (email: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${email}? This will remove all their notes, images, and links!`
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter((u) => u.email !== email));
        setSelectedUser(null);
        alert('User deleted successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 p-8 rounded-[28px] border border-zinc-800 w-full max-w-md shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-[#d9ad52]/10 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-[#d9ad52]" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-zinc-400 text-sm text-center mt-2">
              Enter your secret admin password to manage users
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#d9ad52] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#20140b] font-bold py-3 rounded-2xl transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>
          {error && (
            <p className="text-[#d9ad52] text-center mt-4 text-sm">{error}</p>
          )}
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
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-xs text-white/40 mt-0.5">
                {users.length} registered {users.length === 1 ? 'user' : 'users'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-sm transition-all border border-zinc-800"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Bar (Samsung One UI style) */}
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

        {/* Main content — grid on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* User List — Samsung One UI list style */}
          <div className="xl:col-span-4 bg-zinc-950 rounded-[24px] border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d9ad52]" />
                Registered Users
              </h2>
              <span className="text-xs bg-[#d9ad52]/10 text-[#d9ad52] px-2.5 py-1 rounded-full font-bold">
                {filteredUsers.length}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
              {filteredUsers.length === 0 ? (
                <p className="p-8 text-center text-zinc-500 text-sm">
                  No users found
                </p>
              ) : (
                filteredUsers.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => fetchUserData(user.email)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/3 last:border-0 ${
                      selectedUser?.user?.email === user.email
                        ? 'bg-[#d9ad52]/10 border-l-2 border-l-[#d9ad52]'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">
                            Plan: {user.plan}
                          </span>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {user.joined_date
                              ? new Date(user.joined_date).toLocaleDateString()
                              : 'N/A'}
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

          {/* User Details — Samsung One UI card style */}
          <div className="xl:col-span-8">
            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* User Profile Card */}
                <div className="bg-zinc-950 p-6 rounded-[28px] border border-white/10 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#d9ad52]/10 border border-[#d9ad52]/30 overflow-hidden flex items-center justify-center">
                        {selectedUser.user?.avatar_url ? (
                          <img
                            src={selectedUser.user.avatar_url}
                            alt={selectedUser.user.name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <Users className="w-8 h-8 text-[#d9ad52]" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          {selectedUser.user?.name}
                        </h2>
                        <p className="text-zinc-400 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {selectedUser.user?.email}
                        </p>
                        <div className="flex gap-3 mt-3">
                          <span className="text-xs bg-[#d9ad52]/10 text-[#d9ad52] px-3 py-1 rounded-full font-semibold border border-[#d9ad52]/30">
                            Plan: {selectedUser.user?.plan || 'N/A'}
                          </span>
                          <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
                            Storage: {selectedUser.user?.storage_used_mb || 0}MB /{' '}
                            {selectedUser.user?.total_storage_mb || 1024}MB
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteUser(selectedUser.user.email)}
                      className="p-3 bg-[#d9ad52]/10 hover:bg-[#d9ad52]/20 text-[#d9ad52] rounded-2xl transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Data Sections — Samsung One UI grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Notes */}
                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">
                      📝 Notes ({selectedUser.notes.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.notes.length === 0 ? (
                        <p className="text-xs text-zinc-500">No notes saved</p>
                      ) : (
                        selectedUser.notes.map((note: any) => (
                          <div
                            key={note.id}
                            className="p-3 bg-black/50 rounded-xl border border-white/5"
                          >
                            <p className="text-xs font-bold truncate text-white">
                              {note.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate mt-1">
                              {note.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">
                      📸 Images ({selectedUser.images.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedUser.images.length === 0 ? (
                        <p className="text-xs text-zinc-500 col-span-2">
                          No images saved
                        </p>
                      ) : (
                        selectedUser.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="aspect-square bg-black rounded-xl overflow-hidden border border-white/5"
                          >
                            <img
                              src={img.data_url}
                              className="w-full h-full object-cover"
                              alt={img.name}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="bg-zinc-950 p-4 rounded-[24px] border border-white/10">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-[#d9ad52]">
                      🔗 Links ({selectedUser.links.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.links.length === 0 ? (
                        <p className="text-xs text-zinc-500">No links saved</p>
                      ) : (
                        selectedUser.links.map((link: any) => (
                          <div
                            key={link.id}
                            className="p-3 bg-black/50 rounded-xl border border-white/5"
                          >
                            <p className="text-xs font-bold truncate text-white">
                              {link.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate mt-1">
                              {link.url}
                            </p>
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
