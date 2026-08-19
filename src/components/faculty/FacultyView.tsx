import React, { useState } from 'react';
import { Faculty, Subject, TimetableSlot, ClassLevel, StreamType, BatchShift, AdminUser } from '../../types';
import { CLASS_LEVELS, STREAMS_FOR_CLASS } from '../../utils/academicUtils';
import { evaluateSectionAuthorization } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  Phone,
  Award,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  GraduationCap,
  Lock,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface FacultyViewProps {
  faculty: Faculty[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  onAddFaculty: (fac: Faculty) => void;
  onUpdateFaculty: (fac: Faculty) => void;
  onDeleteFaculty: (facultyId: string) => void;
  onAddTimetableSlot: (slot: TimetableSlot) => void;
  onUpdateTimetableSlot: (slot: TimetableSlot) => void;
  onDeleteTimetableSlot: (slotId: string) => void;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

const PRESET_TIME_SLOTS = [
  '06:30 AM - 07:30 AM',
  '07:30 AM - 08:30 AM',
  '08:30 AM - 09:30 AM',
  '10:00 AM - 11:30 AM',
  '11:30 AM - 01:00 PM',
  '04:30 PM - 05:30 PM',
  '05:30 PM - 06:30 PM',
  '06:30 PM - 07:30 PM',
  '07:30 PM - 08:30 PM',
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
];

const BATCH_OPTIONS: BatchShift[] = [
  'Morning Batch (6:30 AM - 9:00 AM)',
  'Evening Batch (4:00 PM - 7:30 PM)',
  'Weekend Intensive (Sat-Sun)',
];

export const FacultyView: React.FC<FacultyViewProps> = ({
  faculty,
  subjects,
  timetable,
  onAddFaculty,
  onUpdateFaculty,
  onDeleteFaculty,
  onAddTimetableSlot,
  onUpdateTimetableSlot,
  onDeleteTimetableSlot,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'faculty');
  const [activeTab, setActiveTab] = useState<'directory' | 'timetable'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Timetable slot modal state
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetableSlot, setEditingTimetableSlot] = useState<TimetableSlot | null>(null);

  // Timetable day filter
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Faculty form data
  const [formData, setFormData] = useState<Partial<Faculty>>({
    name: '',
    designation: 'Senior Faculty',
    qualification: '',
    email: '',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    experienceYears: 5,
    assignedSubjectIds: [],
    maxWeeklyHours: 24,
    bio: '',
  });

  // Timetable slot form data
  const [slotFormData, setSlotFormData] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    timeSlot: '06:30 AM - 07:30 AM',
    classLevel: '10',
    stream: 'General',
    batch: 'Morning Batch (6:30 AM - 9:00 AM)',
    subjectId: '',
    facultyId: '',
    room: 'Room 101',
  });

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      designation: 'Senior Faculty',
      qualification: '',
      email: '',
      phone: '',
      joiningDate: new Date().toISOString().split('T')[0],
      experienceYears: 5,
      assignedSubjectIds: [],
      maxWeeklyHours: 24,
      bio: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFormData(f);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.qualification || !formData.phone) {
      alert('Please fill in faculty name, qualification, and phone number.');
      return;
    }

    if (editingFaculty) {
      const updated: Faculty = {
        ...editingFaculty,
        ...(formData as Faculty),
      };
      onUpdateFaculty(updated);
    } else {
      const newFaculty: Faculty = {
        id: `FAC-${String(faculty.length + 1).padStart(2, '0')}`,
        name: formData.name || '',
        designation: formData.designation as any || 'Senior Faculty',
        qualification: formData.qualification || '',
        email: formData.email || '',
        phone: formData.phone || '',
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        experienceYears: Number(formData.experienceYears) || 1,
        assignedSubjectIds: formData.assignedSubjectIds || [],
        maxWeeklyHours: Number(formData.maxWeeklyHours) || 24,
        bio: formData.bio,
      };
      onAddFaculty(newFaculty);
    }
    setIsAddModalOpen(false);
  };

  // Open Add Timetable Slot modal
  const handleOpenAddSlot = () => {
    setEditingTimetableSlot(null);
    const initialSubject = subjects.find((s) => s.classLevel === '10')?.id || subjects[0]?.id || '';
    const initialFaculty = faculty[0]?.id || '';
    setSlotFormData({
      day: (selectedDay as any) || 'Monday',
      timeSlot: '06:30 AM - 07:30 AM',
      classLevel: '10',
      stream: 'General',
      batch: 'Morning Batch (6:30 AM - 9:00 AM)',
      subjectId: initialSubject,
      facultyId: initialFaculty,
      room: 'Room 101',
    });
    setIsTimetableModalOpen(true);
  };

  // Open Edit Timetable Slot modal
  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingTimetableSlot(slot);
    setSlotFormData({
      day: slot.day,
      timeSlot: slot.timeSlot,
      classLevel: slot.classLevel,
      stream: slot.stream,
      batch: slot.batch,
      subjectId: slot.subjectId,
      facultyId: slot.facultyId,
      room: slot.room,
    });
    setIsTimetableModalOpen(true);
  };

  // Handle Timetable Slot Submit
  const handleSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotFormData.timeSlot?.trim()) {
      alert('Please enter or select a valid time slot.');
      return;
    }
    if (!slotFormData.subjectId) {
      alert('Please select a subject for this slot.');
      return;
    }
    if (!slotFormData.facultyId) {
      alert('Please select an allocated teacher.');
      return;
    }

    if (editingTimetableSlot) {
      const updated: TimetableSlot = {
        ...editingTimetableSlot,
        day: (slotFormData.day as any) || editingTimetableSlot.day,
        timeSlot: slotFormData.timeSlot.trim(),
        classLevel: (slotFormData.classLevel as ClassLevel) || editingTimetableSlot.classLevel,
        stream: (slotFormData.stream as StreamType) || editingTimetableSlot.stream,
        batch: (slotFormData.batch as BatchShift) || editingTimetableSlot.batch,
        subjectId: slotFormData.subjectId,
        facultyId: slotFormData.facultyId,
        room: slotFormData.room || 'Room 101',
      };
      onUpdateTimetableSlot(updated);
    } else {
      const newSlot: TimetableSlot = {
        id: `TS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        day: (slotFormData.day as any) || 'Monday',
        timeSlot: slotFormData.timeSlot.trim(),
        classLevel: (slotFormData.classLevel as ClassLevel) || '10',
        stream: (slotFormData.stream as StreamType) || 'General',
        batch: (slotFormData.batch as BatchShift) || 'Morning Batch (6:30 AM - 9:00 AM)',
        subjectId: slotFormData.subjectId,
        facultyId: slotFormData.facultyId,
        room: slotFormData.room || 'Room 101',
      };
      onAddTimetableSlot(newSlot);
    }
    setIsTimetableModalOpen(false);
  };

  const filteredFaculty = faculty.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.qualification.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q)
    );
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Subjects filtered for current selected classLevel and stream in slotFormData
  const filteredSubjectsForSlot = subjects.filter(
    (s) =>
      s.classLevel === (slotFormData.classLevel || '10') &&
      (s.stream === (slotFormData.stream || 'General') || s.stream === 'General')
  );

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="faculty"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Faculty Allocation & Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Teacher directory, subject mentorship assignments, weekly teaching workload, and batch schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Directory ({faculty.length})
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Schedule Grid
            </button>
          </div>

          {auth.canWrite ? (
            <button
              onClick={handleOpenAdd}
              id="add-faculty-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Faculty
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Staff Locked</span>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'directory' ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teacher by name, qualification or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Showing {filteredFaculty.length} Academic Mentors
            </span>
          </div>

          {/* Faculty Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculty.map((fac) => {
              // Find subjects assigned to this faculty
              const assignedSubs = subjects.filter((s) => s.facultyId === fac.id);
              const totalHours = assignedSubs.reduce((sum, s) => sum + s.weeklyHours, 0);
              const loadPercent = Math.min(100, Math.round((totalHours / fac.maxWeeklyHours) * 100));

              return (
                <div
                  key={fac.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-bold text-lg flex items-center justify-center shadow shrink-0">
                        {fac.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          {fac.designation}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1 truncate">{fac.name}</h3>
                        <p className="text-xs text-slate-600 truncate">{fac.qualification}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {fac.bio && (
                      <p className="text-xs text-slate-500 italic mb-4 line-clamp-2">
                        "{fac.bio}"
                      </p>
                    )}

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{fac.phone}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{fac.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fac.experienceYears} Years Teaching Experience</span>
                      </p>
                    </div>

                    {/* Assigned Subjects */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">Assigned Subjects ({assignedSubs.length})</span>
                        <span className="text-[11px] font-bold text-slate-900">
                          {totalHours} / {fac.maxWeeklyHours} hrs/wk ({loadPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loadPercent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {assignedSubs.length === 0 ? (
                          <span className="text-xs text-slate-400">No subjects assigned yet.</span>
                        ) : (
                          assignedSubs.map((sub) => (
                            <span
                              key={sub.id}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200"
                            >
                              Class {sub.classLevel} {sub.code} ({sub.weeklyHours}h)
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400">{fac.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(fac)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        title="Edit Faculty Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${fac.name} from faculty directory?`)) {
                            onDeleteFaculty(fac.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Weekly Timetable Schedule Matrix */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Weekly Class Timetable Slots</h3>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  Editable Schedule
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and customize lecture timings, teacher allocations, classrooms, and batches across days.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Day Selector */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedDay === day
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Add New Slot Button */}
              {auth.canWrite && (
                <button
                  id="add-timetable-slot-btn"
                  onClick={handleOpenAddSlot}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Schedule Time Slot</span>
                </button>
              )}
            </div>
          </div>

          {/* Slots Table for Selected Day */}
          {(() => {
            const daySlots = timetable.filter((slot) => slot.day === selectedDay);
            if (daySlots.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-3">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No classes scheduled for {selectedDay}. Click "+ Schedule Time Slot" to allocate lectures.</p>
                  {auth.canWrite && (
                    <button
                      onClick={handleOpenAddSlot}
                      className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800"
                    >
                      + Add First Slot for {selectedDay}
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Time Slot</th>
                      <th className="py-3 px-4">Class & Batch</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Allocated Teacher</th>
                      <th className="py-3 px-4">Room / Lab</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daySlots.map((slot) => {
                      const subject = subjects.find((s) => s.id === slot.subjectId);
                      const teacher = faculty.find((f) => f.id === slot.facultyId);

                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => auth.canWrite && handleOpenEditSlot(slot)}
                              className="font-mono font-bold text-slate-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                              title="Click to edit this time slot"
                            >
                              <Clock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span>{slot.timeSlot}</span>
                              <Edit2 className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Class {slot.classLevel} ({slot.stream})
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">{slot.batch.split('(')[0]}</span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {subject?.name || slot.subjectId}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {teacher?.name || 'Unassigned'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                              {slot.room}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditSlot(slot)}
                                id={`edit-slot-${slot.id}`}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                                title="Edit Timetable Slot"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove timetable slot "${slot.timeSlot}" for Class ${slot.classLevel}?`)) {
                                    onDeleteTimetableSlot(slot.id);
                                  }
                                }}
                                id={`delete-slot-${slot.id}`}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

        </div>
      )}

      {/* Add / Edit Timetable Slot Modal */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingTimetableSlot ? 'Edit Timetable Slot Timing & Allocation' : 'Schedule New Class Timetable Slot'}
                </h3>
              </div>
              <button
                onClick={() => setIsTimetableModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSlotSubmit} className="p-6 space-y-4 text-xs font-sans">
              
              {/* Day of Week */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Day of Week *</label>
                <select
                  value={slotFormData.day || 'Monday'}
                  onChange={(e) => setSlotFormData({ ...slotFormData, day: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Editable Field & Presets */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-purple-950 font-bold">
                    Class Time Slot (e.g. 06:30 AM - 07:30 AM) *
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold">Editable</span>
                </div>
                
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:30 AM - 07:30 AM"
                  value={slotFormData.timeSlot || ''}
                  onChange={(e) => setSlotFormData({ ...slotFormData, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white font-mono text-xs font-bold text-slate-900"
                />

                {/* Quick Presets Pills */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-purple-800 tracking-wider mb-1">
                    Quick Preset Timing Options:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {PRESET_TIME_SLOTS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setSlotFormData({ ...slotFormData, timeSlot: preset })}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                          slotFormData.timeSlot === preset
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Class Level & Stream */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Class Level *</label>
                  <select
                    value={slotFormData.classLevel || '10'}
                    onChange={(e) => {
                      const newCls = e.target.value as ClassLevel;
                      const validStreams = STREAMS_FOR_CLASS[newCls];
                      const newStream = validStreams[0] as StreamType;
                      // Find first subject matching new class
                      const newSub = subjects.find((s) => s.classLevel === newCls)?.id || '';
                      setSlotFormData({
                        ...slotFormData,
                        classLevel: newCls,
                        stream: newStream,
                        subjectId: newSub || slotFormData.subjectId,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stream</label>
                  <select
                    value={slotFormData.stream || 'General'}
                    onChange={(e) => setSlotFormData({ ...slotFormData, stream: e.target.value as StreamType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {STREAMS_FOR_CLASS[(slotFormData.classLevel as ClassLevel) || '10'].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Shift */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Batch / Shift</label>
                <select
                  value={slotFormData.batch || BATCH_OPTIONS[0]}
                  onChange={(e) => setSlotFormData({ ...slotFormData, batch: e.target.value as BatchShift })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {BATCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Subject *</label>
                <select
                  value={slotFormData.subjectId || ''}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const subObj = subjects.find((s) => s.id === subId);
                    // auto select faculty if assigned to subject
                    const autoFaculty = subObj?.facultyId || slotFormData.facultyId;
                    setSlotFormData({ ...slotFormData, subjectId: subId, facultyId: autoFaculty });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">-- Select Subject --</option>
                  {(filteredSubjectsForSlot.length > 0 ? filteredSubjectsForSlot : subjects).map((s) => (
                    <option key={s.id} value={s.id}>
                      Class {s.classLevel} - {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Allocated Faculty & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Allocated Teacher *</label>
                  <select
                    value={slotFormData.facultyId || ''}
                    onChange={(e) => setSlotFormData({ ...slotFormData, facultyId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="">-- Select Teacher --</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room / Lab No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 101, Physics Lab"
                    value={slotFormData.room || ''}
                    onChange={(e) => setSlotFormData({ ...slotFormData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTimetableModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  {editingTimetableSlot ? 'Save Time Slot' : 'Add Time Slot'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingFaculty ? 'Edit Faculty Record' : 'Register New Faculty Mentor'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Debabrata Roy"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <select
                    value={formData.designation || 'Senior Faculty'}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Subject Lead">Subject Lead</option>
                    <option value="Senior Faculty">Senior Faculty</option>
                    <option value="Assistant Faculty">Assistant Faculty</option>
                    <option value="Guest Lecturer">Guest Lecturer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experienceYears || 5}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Qualifications *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M.Sc. Physics (IIT), B.Ed"
                  value={formData.qualification || ''}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98301 XXXXX"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="faculty@bileyacademy.edu"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Weekly Teaching Hours</label>
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={formData.maxWeeklyHours || 24}
                    onChange={(e) => setFormData({ ...formData, maxWeeklyHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Short Faculty Bio & Specialization</label>
                <textarea
                  rows={2}
                  placeholder="Specialization topics, past results, research interests..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  {editingFaculty ? 'Save Changes' : 'Add Faculty'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
