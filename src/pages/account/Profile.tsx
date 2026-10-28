import React, { useState } from 'react';
import { User, Shield, KeyRound, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await updateProfile({ fullName, phone, department, year });
      setProfileMsg('Profile information updated successfully.');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!passwordRegex.test(newPassword)) {
      setPassMsg({
        text: 'New password must have at least 8 characters, uppercase, lowercase, number, and special symbol.',
        error: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', error: true });
      return;
    }

    setPassSaving(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        setPassMsg({ text: 'Password successfully updated. Other sessions have been revoked.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPassMsg({
        text: err.response?.data?.message || 'Failed to change password.',
        error: true,
      });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Researcher Profile & Security</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your personal institutional credentials, academic status, and authentication security.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center font-bold text-2xl text-cyan-400 shadow-inner">
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName}</h2>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{user?.email}</span>
              <span>·</span>
              <span className="font-mono text-cyan-400">{user?.collegeId}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {user?.department} · {user?.year}
            </div>
          </div>
        </div>

        <div>
          <span className="px-3 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <User className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Academic Details</h3>
          </div>

          {profileMsg && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Academic Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2 px-4 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Change Password</h3>
          </div>

          {passMsg && (
            <div
              className={`p-2.5 rounded text-xs ${
                passMsg.error
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars, uppercase, number, symbol"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passSaving}
                className="w-full py-2 px-4 font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                {passSaving ? 'Updating...' : 'Update Account Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
