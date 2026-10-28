import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Cpu, Wrench, FolderGit2, User, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    equipment: any[];
    inventory: any[];
    projects: any[];
    users: any[];
  }>({
    equipment: [],
    inventory: [],
    projects: [],
    users: [],
  });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ equipment: [], inventory: [], projects: [], users: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ equipment: [], inventory: [], projects: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setResults(res.data.data);
        }
      } catch {
        // Ignore search errors
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.equipment.length +
    results.inventory.length +
    results.projects.length +
    results.users.length;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search robotics equipment, components, projects, team members..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-800/60">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500">
              Searching university robotics database...
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching records found for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type at least 2 characters to search across all laboratory modules.
            </div>
          )}

          {/* Equipment Results */}
          {results.equipment.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Equipment
              </div>
              {results.equipment.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect(`/equipment/${item._id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/70 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-mono">{item.equipmentCode}</span>
                      <span>·</span>
                      <span>{item.category}</span>
                      <span>·</span>
                      <span className="uppercase text-[10px]">{item.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          )}

          {/* Inventory Results */}
          {results.inventory.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Components & Parts
              </div>
              {results.inventory.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect('/inventory')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/70 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-amber-400 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-mono">{item.componentCode}</span>
                      <span>·</span>
                      <span>{item.storageLocation}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{item.quantity} {item.unit} available</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                Robotics Projects
              </div>
              {results.projects.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect(`/projects/${item._id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/70 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 truncate">
                      {item.projectName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-mono">{item.projectCode}</span>
                      <span>·</span>
                      <span>{item.category}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{item.progress}% progress</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                People & Researchers
              </div>
              {results.users.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect('/admin/users')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/70 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 truncate">
                      {item.fullName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{item.email}</span>
                      <span>·</span>
                      <span className="font-mono">{item.collegeId}</span>
                      <span>·</span>
                      <span>{item.role}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
