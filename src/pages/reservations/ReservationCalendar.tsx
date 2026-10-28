import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Clock, User, Cpu } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const ReservationCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await apiClient.get(`/reservations/calendar?start=${start}&end=${end}`);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <Link
            to="/reservations"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Table Roster</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Workcell Allocation Calendar</span>
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={prevMonth}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-white min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-950/70 border-b border-slate-800 text-center py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-[110px] divide-x divide-y divide-slate-800/60 text-xs">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-950/30 p-2 text-slate-600" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.date === dateStr);

            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={`day-${dayNum}`}
                className={`p-1.5 flex flex-col justify-between transition-colors overflow-hidden ${
                  isToday ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      isToday ? 'bg-cyan-500 font-bold text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {dayEvents.length} slots
                    </span>
                  )}
                </div>

                {/* Event previews in cell */}
                <div className="space-y-1 overflow-y-auto max-h-[75px] mt-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev._id}
                      onClick={() => setSelectedEvent(ev)}
                      className="px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 cursor-pointer text-[10px] truncate transition-colors text-slate-200"
                    >
                      <span className="text-cyan-400 font-mono mr-1">{ev.startTime}</span>
                      <span>{ev.equipment?.name || 'Unit'}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-slate-500 px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Booking Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Hardware</span>
                <span className="font-semibold text-white text-sm">{selectedEvent.equipment?.name}</span>
                <div className="font-mono text-cyan-400 text-[11px]">{selectedEvent.equipment?.equipmentCode}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Reserved By</span>
                <span className="text-slate-200 font-medium">{selectedEvent.user?.fullName}</span>
                <div className="font-mono text-slate-500 text-[11px]">{selectedEvent.user?.collegeId}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Scheduled Window</span>
                <div className="font-mono text-slate-200">
                  {selectedEvent.date} ({selectedEvent.startTime} - {selectedEvent.endTime})
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Stated Purpose</span>
                <p className="text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  {selectedEvent.purpose}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-800 text-emerald-400">
                  {selectedEvent.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
