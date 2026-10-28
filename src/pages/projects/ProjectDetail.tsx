import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  MessageSquare,
  Shield,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { TeamMemberRole, ProjectStatus } from '../../types/index.js';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'milestones' | 'feedback'>('overview');

  // Add Member Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmailOrId, setMemberEmailOrId] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMemberRole>('HARDWARE');
  const [memberError, setMemberError] = useState<string | null>(null);

  // Add Milestone Modal
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');

  // Faculty Feedback
  const [feedbackText, setFeedbackText] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data.project);
        setMilestones(res.data.data.milestones || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleStatusChange = async (status: ProjectStatus) => {
    try {
      const res = await apiClient.patch(`/projects/${id}/status`, { status });
      if (res.data.success) {
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);
    try {
      const res = await apiClient.post(`/projects/${id}/members`, {
        userEmailOrId: memberEmailOrId,
        role: memberRole,
      });
      if (res.data.success) {
        setShowAddMember(false);
        setMemberEmailOrId('');
        fetchProject();
      }
    } catch (err: any) {
      setMemberError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this researcher from the project team?')) return;
    try {
      const res = await apiClient.delete(`/projects/${id}/members/${userId}`);
      if (res.data.success) {
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post(`/projects/${id}/milestones`, {
        title: milestoneTitle,
        description: milestoneDesc,
        dueDate: milestoneDueDate,
      });
      if (res.data.success) {
        setShowAddMilestone(false);
        setMilestoneTitle('');
        setMilestoneDesc('');
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add milestone.');
    }
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    try {
      const res = await apiClient.patch(`/projects/milestones/${milestoneId}`, {
        status: 'COMPLETED',
        progress: 100,
      });
      if (res.data.success) {
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete milestone.');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      const res = await apiClient.post(`/projects/${id}/feedback`, {
        text: feedbackText,
      });
      if (res.data.success) {
        setFeedbackText('');
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />;
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white">Project Not Found</h3>
        <Link to="/projects" className="text-xs text-cyan-400 mt-2 inline-block">
          ← Return to Projects List
        </Link>
      </div>
    );
  }

  const isMentorOrAdmin =
    hasRole('SUPER_ADMIN', 'LAB_ADMIN') ||
    (project.facultyMentor && project.facultyMentor._id === user?._id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Roster</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
              <span className="font-mono text-cyan-400 font-semibold">{project.projectCode}</span>
              <span>·</span>
              <span>{project.category}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {project.projectName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />

            {/* Faculty approval action */}
            {isMentorOrAdmin && project.status === 'PROPOSED' && (
              <button
                onClick={() => handleStatusChange('APPROVED')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm"
              >
                Approve Project
              </button>
            )}

            {isMentorOrAdmin && project.status === 'APPROVED' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
              >
                Start Engineering (In Progress)
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Overall Milestone Completion</span>
            <span className="font-mono text-cyan-400 font-semibold">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Meta summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Created By</span>
            <span className="text-slate-200 font-medium">{project.createdBy?.fullName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Faculty Mentor</span>
            <span className="text-slate-200 font-medium">
              {project.facultyMentor?.fullName || 'Self-Directed'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Budget</span>
            <span className="text-slate-200 font-mono">${project.budget}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Repository</span>
            {project.repositoryUrl ? (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline font-mono truncate block"
              >
                Code Repository ↗
              </a>
            ) : (
              <span className="text-slate-500 font-mono">Not linked</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
          {[
            { id: 'overview', label: 'Problem & Objectives' },
            { id: 'team', label: `Team Members (${project.teamMembers?.length || 0})` },
            { id: 'milestones', label: `Milestones (${milestones.length})` },
            { id: 'feedback', label: `Faculty Feedback (${project.feedback?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="mt-4 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Core Problem Statement
              </h3>
              <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {project.problemStatement}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Technical Architecture & Implementation Scope
              </h3>
              <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {project.description}
              </p>
            </div>

            {project.objectives && project.objectives.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Key Research Deliverables
                </h3>
                <ul className="space-y-1.5">
                  {project.objectives.map((obj: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab: Team */}
        {activeTab === 'team' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Project Engineering Team
              </h3>
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Researcher</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {project.teamMembers?.map((m: any) => (
                <div key={m.user?._id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                      {m.user?.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{m.user?.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {m.user?.collegeId} · {m.user?.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {m.role}
                    </span>
                    {m.role !== 'TEAM_LEAD' && (
                      <button
                        onClick={() => handleRemoveMember(m.user?._id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Milestones */}
        {activeTab === 'milestones' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Milestones & Sprints
              </h3>
              <button
                onClick={() => setShowAddMilestone(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {milestones.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No milestones added yet. Add project milestones to track completion progress.
                </div>
              ) : (
                milestones.map((ms) => (
                  <div
                    key={ms._id}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{ms.title}</span>
                        <StatusBadge status={ms.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ms.description}</p>
                      <div className="text-[11px] text-slate-500 font-mono mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {new Date(ms.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {ms.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleMilestoneComplete(ms._id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/60 rounded"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Feedback */}
        {activeTab === 'feedback' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Faculty Review & Mentorship Log
            </h3>

            {/* Feedback submit form */}
            {hasRole('FACULTY', 'SUPER_ADMIN', 'LAB_ADMIN') && (
              <form onSubmit={handleFeedbackSubmit} className="space-y-2 pb-4 border-b border-slate-800">
                <textarea
                  rows={2}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Leave mentorship feedback, trajectory guidance, or experiment comments..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                  >
                    Post Faculty Review
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {project.feedback?.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No feedback entries recorded.
                </div>
              ) : (
                project.feedback?.map((fb: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-purple-400">
                        {fb.faculty?.fullName || 'Faculty Mentor'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(fb.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300">{fb.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Add Team Member</h3>
            <p className="text-xs text-slate-400 mb-3">
              Enter user email address or College/Student ID.
            </p>

            {memberError && (
              <div className="p-2.5 mb-3 rounded bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300">
                {memberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email or Student ID</label>
                <input
                  type="text"
                  required
                  value={memberEmailOrId}
                  onChange={(e) => setMemberEmailOrId(e.target.value)}
                  placeholder="student@robolab.edu or STU-2026-..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Team Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="HARDWARE">HARDWARE (Electronics & Actuators)</option>
                  <option value="SOFTWARE">SOFTWARE (ROS2, Navigation, SLAM)</option>
                  <option value="MECHANICAL">MECHANICAL (CAD & 3D Fabrication)</option>
                  <option value="RESEARCH">RESEARCH (Kinematics & Control)</option>
                  <option value="DOCUMENTATION">DOCUMENTATION (Reports & Logs)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-3 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Add Milestone</h3>
            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. SLAM loop closure validation"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Due Date</label>
                <input
                  type="date"
                  required
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Deliverable criteria..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(false)}
                  className="px-3 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
