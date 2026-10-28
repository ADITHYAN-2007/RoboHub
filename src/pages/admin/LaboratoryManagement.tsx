import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, DoorClosed, MapPin } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const LaboratoryManagement: React.FC = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Lab Modal
  const [showAddLab, setShowAddLab] = useState(false);
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState('');
  const [building, setBuilding] = useState('');
  const [description, setDescription] = useState('');

  // Add Room Modal
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomBuilding, setRoomBuilding] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [selectedLabId, setSelectedLabId] = useState('');

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/laboratories');
      if (res.data.success) {
        setLabs(res.data.data.laboratories || []);
        setRooms(res.data.data.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/laboratories', {
        name: labName,
        code: labCode,
        building,
        description,
      });
      if (res.data.success) {
        setShowAddLab(false);
        setLabName('');
        setLabCode('');
        setBuilding('');
        fetchFacilities();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create laboratory.');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/laboratories/rooms', {
        roomNumber,
        name: roomName,
        building: roomBuilding,
        capacity,
        laboratory: selectedLabId || undefined,
      });
      if (res.data.success) {
        setShowAddRoom(false);
        setRoomNumber('');
        setRoomName('');
        fetchFacilities();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create room.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Laboratories & Workcell Rooms</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical facilities, specialized flight arena zones, and robotic workcells.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddLab(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Laboratory</span>
          </button>
          <button
            onClick={() => {
              if (labs.length > 0) setSelectedLabId(labs[0]._id);
              setShowAddRoom(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room / Bay</span>
          </button>
        </div>
      </div>

      {/* Laboratories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {labs.map((lab) => {
          const labRooms = rooms.filter((r) => r.laboratory?._id === lab._id || r.laboratory === lab._id);
          return (
            <div key={lab._id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">{lab.code}</div>
                  <h3 className="text-base font-bold text-white">{lab.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lab.building}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                  {lab.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{lab.description}</p>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Allocated Workcells ({labRooms.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {labRooms.map((r) => (
                    <div key={r._id} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                      <div className="font-semibold text-white font-mono">{r.roomNumber}</div>
                      <div className="text-[11px] text-slate-400 truncate">{r.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Cap: {r.capacity} students
                      </div>
                    </div>
                  ))}
                  {labRooms.length === 0 && (
                    <div className="col-span-2 text-xs text-slate-500 py-2">
                      No designated workcell rooms registered yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lab Modal */}
      {showAddLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Add Laboratory Facility</h3>
            <form onSubmit={handleAddLab} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. Swarm Robotics Flight Bay"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Facility Code</label>
                  <input
                    type="text"
                    required
                    value={labCode}
                    onChange={(e) => setLabCode(e.target.value)}
                    placeholder="SRF-201"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="Robotics Complex"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Facility Scope</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Research focus, optical motion tracking systems..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLab(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Save Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Add Workcell / Room</h3>
            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="ENG-108"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Collaborative Robotics Cell B"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={roomBuilding}
                  onChange={(e) => setRoomBuilding(e.target.value)}
                  placeholder="North Engineering Science"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Associated Lab</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {labs.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Save Workcell Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
