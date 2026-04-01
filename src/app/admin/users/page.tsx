"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, Shield, UserCircle, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<{oldUsername: string} | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "adminuser"
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) return;
    if (!editingUser && !formData.password) {
      toast.error("Password is required for new accounts");
      return;
    }
    
    setIsSaving(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const payload = editingUser 
        ? { ...formData, oldUsername: editingUser.oldUsername }
        : formData;

      const res = await fetch("/api/admin/users", {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(editingUser ? "User updated" : "User added successfully");
        setFormData({ username: "", password: "", role: "adminuser" });
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save user");
      }
    } catch (err) {
      toast.error("Error saving user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser({ oldUsername: user.username });
    setFormData({
      username: user.username,
      password: "", // password remains empty unless changing it
      role: user.role
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: "", password: "", role: "adminuser" });
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      toast.error("Cannot delete master admin");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${username}?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        toast.success("User deleted");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-yellow-400" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Team Management</h1>
        <p className="text-slate-400 mt-2 font-medium">Control levels of authority for your CMS</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* User Form */}
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className={`bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border transition-colors shadow-2xl sticky top-8 ${editingUser ? 'border-yellow-400/50' : 'border-slate-800'}`}>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {editingUser ? <Shield className="text-yellow-400" size={20} /> : <UserPlus className="text-yellow-400" size={20} />}
              {editingUser ? "Edit Member" : "Add Member"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                   {editingUser ? "New Password (Leave blank to keep)" : "Password"}
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="admin">Admin (All Access)</option>
                  <option value="approver">Approver Only</option>
                  <option value="adminuser">Adminuser (Editor)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingUser ? "Update Account" : "Create Account")}
                </button>
                
                {editingUser && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Users List */}
        <div className="md:col-span-2 space-y-4">
          {users.map((user) => (
            <div key={user.username} className={`border rounded-2xl p-4 flex items-center justify-between group transition-all ${editingUser?.oldUsername === user.username ? 'bg-yellow-400/5 border-yellow-400/30' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-yellow-400 shadow-inner">
                  {user.role === 'admin' ? <Shield size={22} /> : <UserCircle size={22} />}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{user.username}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEditClick(user)}
                  className="p-3 text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all"
                  title="Edit User"
                >
                  <Edit size={18} />
                </button>
                
                {user.username !== 'admin' && (
                  <button 
                    onClick={() => handleDeleteUser(user.username)}
                    className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
