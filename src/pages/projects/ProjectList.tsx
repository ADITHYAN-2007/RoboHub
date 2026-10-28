import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { Project, User as UserType } from '../../types/index.js';

export const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [facultyList, setFacultyList] = useState<UserType[]>([]);

  // Create Project Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Autonomous Robotics');
  const [facultyMentor, setFacultyMentor] = useState('');
  const [budget, setBudget] = useState(1000);
  const [repositoryUrl, setRepositoryUrl] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/projects?${params.toString()}`);
      if (res.data.success) {
        setProjects(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  useEffect(() => {
    apiClient.get('/users/faculty').then((res) => {
      if (res.data.success) {
        setFacultyList(res.data.data || []);
      }
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/projects', {
        projectName,
        problemStatement,
        description,
        category,
        facultyMentor: facultyMentor || undefined,
        budget,
        repositoryUrl,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setProjectName('');
        setProblemStatement('');
        setDescription('');
        fetchProjects();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Robotics Research Projects</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {projects.length} active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student-faculty collaborative robotics endeavors, team milestone trackers, and lab requisitions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Propose New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'TESTING', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((prj) => (
          <div
            key={prj._id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono text-cyan-400 font-semibold">{prj.projectCode}</span>
                <StatusBadge status={prj.status} />
              </div>

              <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                {prj.projectName}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {prj.problemStatement || prj.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Milestone Progress</span>
                  <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                    {prj.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${prj.progress}%` }}
                  />
                </div>
              </div>

              {/* Team avatars and mentor */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{prj.teamMembers?.length || 1} researchers</span>
                </div>

                <div className="text-[11px] truncate max-w-[140px] text-slate-400">
                  {prj.facultyMentor ? `Mentor: ${prj.facultyMentor.fullName}` : 'Self-Directed'}
                </div>
              </div>

              <Link
                to={`/projects/${prj._id}`}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
              >
                <span>Project Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && projects.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No projects found matching the current filter. Propose a new research project to begin!
          </p>
        </div>
      )}

      {/* Propose Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Propose Robotics Research Project</h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit your engineering problem statement for faculty review and laboratory workcell authorization.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Quadruped Robot Autonomous Stair Climbing"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Core Problem Statement</label>
                <textarea
                  rows={2}
                  required
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="What specific autonomous robotics problem or engineering challenge does this project solve?"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Technical Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hardware stack, ROS2 nodes, sensors, actuators, and target performance metrics..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Autonomous Robotics">Autonomous Robotics</option>
                    <option value="Manipulation & Arms">Manipulation & Arms</option>
                    <option value="Computer Vision & AI">Computer Vision & AI</option>
                    <option value="Aerial & Drones">Aerial & Drones</option>
                    <option value="Bio-inspired Robotics">Bio-inspired Robotics</option>
                    <option value="Industrial Automation">Industrial Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Faculty Mentor</label>
                  <select
                    value={facultyMentor}
                    onChange={(e) => setFacultyMentor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">None / Self Directed</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.fullName} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Repository URL (Optional)</label>
                  <input
                    type="url"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
