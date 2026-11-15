'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Clock, Download, Lock, Unlock, RefreshCw, Eye, ArrowLeft, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  selfieData: string;
  deviceFingerprint: string;
  submittedAt: string;
  student?: {
    id: string;
    name: string;
    profilePhoto: string;
  };
}

interface ClassItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturer: string;
  sessions: {
    id: string;
    status: string;
    durationMinutes: number;
    openedAt: string;
    expiresAt: string;
    records: AttendanceRecord[];
  }[];
}

interface RegisteredStudent {
  id: string;
  name: string;
  profilePhoto: string;
  registeredAt: string;
}

export default function AdminDashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Tabs: 'attendance' or 'students'
  const [activeTab, setActiveTab] = useState<'attendance' | 'students'>('attendance');
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);

  // New Class Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [lecturerName, setLecturerName] = useState('');

  // Duration for opening session
  const [durationMinutes, setDurationMinutes] = useState(10);

  // Side-by-Side Comparison Modal
  const [comparisonRecord, setComparisonRecord] = useState<AttendanceRecord | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (selectedClass) {
          const updated = data.find((c: ClassItem) => c.id === selectedClass.id);
          if (updated) setSelectedClass(updated);
        } else if (data.length > 0) {
          setSelectedClass(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setRegisteredStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
    const interval = setInterval(() => {
      fetchClasses();
      if (activeTab === 'students') fetchStudents();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedClass?.id, activeTab]);

  // Create New Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode,
          courseTitle,
          lecturer: lecturerName || 'Department Lecturer',
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setShowAddModal(false);
        setCourseCode('');
        setCourseTitle('');
        setLecturerName('');
        // Fetch full classes list and auto-select new class
        const listRes = await fetch('/api/classes');
        if (listRes.ok) {
          const list = await listRes.json();
          setClasses(list);
          const found = list.find((c: ClassItem) => c.id === created.id);
          setSelectedClass(found || list[0]);
        }
      }
    } catch (err) {
      alert('Failed to add class');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Attendance Session
  const handleOpenAttendance = async (classId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, durationMinutes }),
      });
      if (res.ok) {
        await fetchClasses();
      }
    } catch (err) {
      alert('Error opening attendance');
    } finally {
      setActionLoading(false);
    }
  };

  // Close Attendance Early
  const handleCloseAttendance = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close attendance now?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: 'closed' }),
      });
      if (res.ok) {
        await fetchClasses();
      }
    } catch (err) {
      alert('Error closing attendance');
    } finally {
      setActionLoading(false);
    }
  };

  const latestSession = selectedClass?.sessions?.[0];
  const isSessionActive =
    latestSession?.status === 'active' && new Date(latestSession.expiresAt).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
            A
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Software Engineering Attendance Dashboard</h1>
            <p className="text-xs text-blue-400 font-semibold">Department of Software Engineering</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="bg-slate-800 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today's Lectures
            </button>
            <button
              onClick={() => {
                setActiveTab('students');
                fetchStudents();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'students' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registered Students ({registeredStudents.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
          <Link
            href="/"
            className="text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Student Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'students' ? (
          /* ================= TAB 2: REGISTERED STUDENTS DIRECTORY ================= */
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Official Student Directory</h2>
                <p className="text-xs text-slate-500">
                  Baseline reference photos recorded during first-time student registration.
                </p>
              </div>
              <button
                onClick={fetchStudents}
                className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {registeredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students registered in the database yet. When students first sign in on the portal, their baseline photos will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {registeredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-col items-center text-center shadow-xs"
                  >
                    <img
                      src={student.profilePhoto}
                      alt={student.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm mb-3"
                    />
                    <h4 className="font-bold text-sm text-slate-900">{student.name}</h4>
                    <span className="text-xs text-blue-600 font-bold uppercase">{student.id}</span>
                    <span className="text-[10px] text-slate-400 mt-2">
                      Registered: {new Date(student.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= TAB 1: LECTURES & ATTENDANCE AUDIT ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Classes List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-[calc(100vh-160px)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Today's Classes ({classes.length})
                </h2>
                <button
                  onClick={fetchClasses}
                  className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {classes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No classes added yet. Click &quot;Add Class&quot; to begin.
                  </div>
                ) : (
                  classes.map((cls) => {
                    const session = cls.sessions?.[0];
                    const active = session?.status === 'active' && new Date(session.expiresAt).getTime() > Date.now();
                    const count = session?.records?.length || 0;
                    const isSelected = selectedClass?.id === cls.id;

                    return (
                      <div
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-900">{cls.courseCode}</span>
                          {active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              OPEN
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 truncate mb-2">{cls.courseTitle}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100/80 pt-2">
                          <span>{cls.lecturer}</span>
                          <span className="font-semibold text-slate-700">{count} present</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 2 Columns: Session Controller & Side-by-Side Photo Audit */}
            <div className="lg:col-span-2 space-y-6">
              {selectedClass ? (
                <>
                  {/* Class Header & Controls */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-slate-900">{selectedClass.courseCode}</h2>
                          <span className="text-sm text-slate-500 font-medium">— {selectedClass.courseTitle}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Lecturer: {selectedClass.lecturer}</p>
                      </div>

                      {/* Actions: Open / Close Attendance */}
                      <div className="flex items-center gap-2">
                        {isSessionActive ? (
                          <button
                            onClick={() => latestSession && handleCloseAttendance(latestSession.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
                          >
                            <Lock className="w-4 h-4" />
                            Close Window Now
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(Number(e.target.value))}
                              className="bg-slate-100 border border-slate-300 text-xs font-medium rounded-xl p-2.5 text-slate-700 focus:outline-none"
                            >
                              <option value={5}>5 mins</option>
                              <option value={10}>10 mins</option>
                              <option value={15}>15 mins</option>
                              <option value={20}>20 mins</option>
                            </select>
                            <button
                              onClick={() => handleOpenAttendance(selectedClass.id)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
                            >
                              <Unlock className="w-4 h-4" />
                              Open Attendance Window
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Session Status Banner */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-500">Status:</span>
                        {isSessionActive ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Active (Closes at {new Date(latestSession!.expiresAt).toLocaleTimeString()})
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                            Closed / Not Started
                          </span>
                        )}
                      </div>

                      {latestSession && latestSession.records?.length > 0 && (
                        <a
                          href={`/api/export?sessionId=${latestSession.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export to Excel (CSV)
                        </a>
                      )}
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE VERIFICATION AUDIT GRID */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-sm">
                          Present Students & Identity Verification ({latestSession?.records?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">Comparing Registered ID vs Live Capture</span>
                    </div>

                    {!latestSession || !latestSession.records || latestSession.records.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs">
                        No attendance marked yet. Open attendance when students are ready.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {(latestSession.records || []).map((rec) => {
                          const profilePhoto = rec.student?.profilePhoto || rec.selfieData;

                          return (
                            <div
                              key={rec.id}
                              onClick={() => setComparisonRecord(rec)}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition cursor-pointer flex flex-col justify-between shadow-xs"
                            >
                              {/* SIDE-BY-SIDE PHOTO COMPARISON */}
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                {/* 1. Official Registered Profile Photo */}
                                <div className="text-center flex-1">
                                  <div className="relative w-16 h-16 mx-auto rounded-xl overflow-hidden border border-blue-400 bg-slate-200 shadow-xs">
                                    <img
                                      src={profilePhoto}
                                      alt="Official Profile"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mt-1 block">
                                    Official Record
                                  </span>
                                </div>

                                <div className="text-slate-300 font-bold text-xs">vs</div>

                                {/* 2. Today's Live In-Class Selfie */}
                                <div className="text-center flex-1">
                                  <div className="relative w-16 h-16 mx-auto rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-200 shadow-xs">
                                    <img
                                      src={rec.selfieData}
                                      alt="In-Class Selfie"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-1 block">
                                    Today's Selfie
                                  </span>
                                </div>
                              </div>

                              {/* Student Details */}
                              <div className="pt-2 flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold text-xs text-slate-900">{rec.studentName}</h4>
                                  <span className="text-[11px] text-blue-600 font-bold uppercase">{rec.studentId}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">
                                    {new Date(rec.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {rec.deviceFingerprint === 'shared-friend-device' ? (
                                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-semibold">
                                      Friend Device
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                      Own Device
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm shadow-sm">
                  Select or add a class to view details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Class for Today</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SWE 301"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Architecture & Design"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Lecturer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Adebayo"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
                >
                  {actionLoading ? 'Saving...' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SIDE-BY-SIDE VERIFICATION MODAL */}
      {comparisonRecord && (
        <div
          onClick={() => setComparisonRecord(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-5 rounded-2xl max-w-lg w-full text-center shadow-2xl space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{comparisonRecord.studentName}</h3>
              <p className="text-xs text-blue-600 font-bold uppercase">{comparisonRecord.studentId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Left: Baseline Photo */}
              <div className="space-y-1.5">
                <div className="w-full h-52 rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-100 shadow-sm">
                  <img
                    src={comparisonRecord.student?.profilePhoto || comparisonRecord.selfieData}
                    alt="Official Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-blue-700 block uppercase">
                  1. Official Registered Photo
                </span>
                <span className="text-[11px] text-slate-400 block">Baseline identity profile</span>
              </div>

              {/* Right: Today's Selfie */}
              <div className="space-y-1.5">
                <div className="w-full h-52 rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-100 shadow-sm">
                  <img
                    src={comparisonRecord.selfieData}
                    alt="In-Class Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-emerald-700 block uppercase">
                  2. Today's In-Class Selfie
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Captured at {new Date(comparisonRecord.submittedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>Device Used:</span>
              <span className="font-bold text-slate-800">
                {comparisonRecord.deviceFingerprint === 'shared-friend-device'
                  ? '⚠️ Shared Classmate Phone (Friend Mode)'
                  : '📱 Student Personal Phone'}
              </span>
            </div>

            <button
              onClick={() => setComparisonRecord(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition"
            >
              Close Verification View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
