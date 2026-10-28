import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { User, UserRole } from '../../types/index.js';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Change role modal
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (user: User) => {
    if (user._id === currentUser?._id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await apiClient.patch(`/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    try {
      const res = await apiClient.patch(`/users/${targetUser._id}/role`, {
        role: selectedRole,
      });
      if (res.data.success) {
        setTargetUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change role.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>University User & Account Security</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {users.length} enrolled
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based access permissions, laboratory clearance levels, and identity management.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, NetID, email or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="LAB_ADMIN">LAB_ADMIN</option>
            <option value="FACULTY">FACULTY</option>
            <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">DEACTIVATED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Researcher / Staff</th>
                <th className="py-3 px-4">College / Student ID</th>
                <th className="py-3 px-4">Department & Level</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-400">
                    {u.collegeId}
                  </td>
                  <td className="py-3 px-4">
                    <div>{u.department}</div>
                    <div className="text-[11px] text-slate-500">{u.year || 'Standard'}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded border font-semibold ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                          : u.role === 'LAB_ADMIN'
                          ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                          : u.role === 'FACULTY'
                          ? 'bg-purple-950/40 text-purple-300 border-purple-800'
                          : u.role === 'LAB_TECHNICIAN'
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase ${
                        u.isActive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                      />
                      <span>{u.isActive ? 'Active' : 'Deactivated'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Change Role Button */}
                      <button
                        onClick={() => {
                          setTargetUser(u);
                          setSelectedRole(u.role);
                        }}
                        disabled={u._id === currentUser?._id}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors disabled:opacity-40"
                      >
                        Assign Role
                      </button>

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u._id === currentUser?._id}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors disabled:opacity-40 ${
                          u.isActive
                            ? 'text-rose-400 hover:bg-rose-950/40 border border-rose-900/60'
                            : 'text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/60'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No users found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Modify Clearance Role
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update institutional permission tier for{' '}
              <span className="text-white font-medium">{targetUser.fullName}</span>.
            </p>

            <form onSubmit={handleRoleChange} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">System Role Tier</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Full Laboratory Control)</option>
                  )}
                  <option value="LAB_ADMIN">LAB_ADMIN (Lab Operations Manager)</option>
                  <option value="FACULTY">FACULTY (Research Mentor / Approver)</option>
                  <option value="LAB_TECHNICIAN">LAB_TECHNICIAN (Hardware & Maintenance Desk)</option>
                  <option value="STUDENT">STUDENT (Student Researcher / Borrower)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetUser(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
