import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Trash2, Eye, LogOut, ShieldAlert, Database } from 'lucide-react';

export function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': adminPassword }
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
        headers: { 'x-admin-password': adminPassword }
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
    if (!confirm(`Are you sure you want to delete ${email}? This will remove all their notes, images, and links!`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${email}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.email !== email));
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-red-500/10 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-zinc-400 text-sm text-center mt-2">Enter your secret admin password to manage users</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>
          {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Database className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User List */}
          <div className="lg:col-span-1 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4" /> Registered Users
              </h2>
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">{users.length}</span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {users.length === 0 ? (
                <p className="p-8 text-center text-zinc-500 text-sm">No users found</p>
              ) : (
                users.map((user: any) => (
                  <div 
                    key={user.id}
                    onClick={() => fetchUserData(user.email)}
                    className={`p-4 border-b border-zinc-800 cursor-pointer transition-all hover:bg-zinc-800 ${selectedUser?.email === user.email ? 'bg-zinc-800' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                      <Eye className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.user.name}</h2>
                    <p className="text-zinc-400">{selectedUser.user.email}</p>
                    <div className="flex gap-3 mt-4">
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">Plan: {selectedUser.user.plan}</span>
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">Storage: {selectedUser.user.storage_used_mb}MB / {selectedUser.user.total_storage_mb}MB</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteUser(selectedUser.user.email)}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                    title="Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Notes */}
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      📝 Notes ({selectedUser.notes.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.notes.length === 0 ? (
                        <p className="text-xs text-zinc-500">No notes saved</p>
                      ) : (
                        selectedUser.notes.map((note: any) => (
                          <div key={note.id} className="p-3 bg-black rounded-lg border border-zinc-800">
                            <p className="text-xs font-bold truncate">{note.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      📸 Images ({selectedUser.images.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedUser.images.length === 0 ? (
                        <p className="text-xs text-zinc-500">No images saved</p>
                      ) : (
                        selectedUser.images.map((img: any) => (
                          <div key={img.id} className="aspect-square bg-black rounded-lg overflow-hidden border border-zinc-800">
                            <img src={img.data_url} className="w-full h-full object-cover" alt={img.name} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      🔗 Links ({selectedUser.links.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.links.length === 0 ? (
                        <p className="text-xs text-zinc-500">No links saved</p>
                      ) : (
                        selectedUser.notes.length === 0 ? (
                          <p className="text-xs text-zinc-500">No links saved</p>
                        ) : (
                          selectedUser.links.map((link: any) => (
                            <div key={link.id} className="p-3 bg-black rounded-lg border border-zinc-800">
                              <p className="text-xs font-bold truncate">{link.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{link.url}</p>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-12 bg-zinc-900 rounded-2xl border border-zinc-800">
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
