'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Smartphone,
  UserCheck,
  ChevronRight,
  LogOut,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';

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
    records: { id: string; studentId: string }[];
  }[];
}

interface StudentProfile {
  id: string;
  name: string;
  profilePhoto: string;
}

// Sample quick-demo students (Matric No. & Reg No.)
const DEMO_STUDENTS = [
  { id: 'SWE/2022/014', name: 'John Doe (Matric No)' },
  { id: 'REG/2024/082', name: 'Chioma Eze (Reg No - Year 1)' },
  { id: 'SWE/2022/045', name: 'David Okafor (Matric No)' },
];

export default function StudentPortalPage() {
  // Navigation Tabs: 'mark' (Attendance) or 'register' (Just Register Profile)
  const [activeTab, setActiveTab] = useState<'mark' | 'register'>('mark');

  // Logged-in / Active Student Profile for Attendance
  const [currentUser, setCurrentUser] = useState<StudentProfile | null>(null);
  const [loginId, setLoginId] = useState('');

  // Registration Form State
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [registrationPhoto, setRegistrationPhoto] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<StudentProfile | null>(null);

  // Course & Session State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [fetching, setFetching] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<'profile' | 'attendance'>('attendance');
  const [cameraError, setCameraError] = useState('');
  const [attendanceSelfie, setAttendanceSelfie] = useState<string | null>(null);
  const [isFriendMode, setIsFriendMode] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ studentName: string; courseCode: string; time: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load Classes
  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          const activeClass = data.find((c: ClassItem) => c.sessions?.[0]?.status === 'active');
          if (activeClass) setSelectedClassId(activeClass.id);
          else setSelectedClassId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadClasses();
    const interval = setInterval(loadClasses, 5000);
    return () => clearInterval(interval);
  }, []);

  // Selected Class & Active Session
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const activeSession = currentClass?.sessions?.[0]?.status === 'active' ? currentClass.sessions[0] : null;

  // Countdown Timer
  useEffect(() => {
    if (!activeSession) {
      setTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start Live Webcam Stream
  const startCamera = async (mode: 'profile' | 'attendance' = 'attendance') => {
    setCameraMode(mode);
    setCameraError('');
    if (mode === 'attendance') setAttendanceSelfie(null);
    else setRegistrationPhoto(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setCameraError('Webcam access was denied or not available. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  // Connect video stream when camera becomes active and video element mounts
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.error('Video play error:', err));
    }
  }, [cameraActive]);

  // Stop Webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Snap Snapshot from Live Video Stream
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera initializing, please try again in a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 480;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror horizontally so it looks natural
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      if (cameraMode === 'profile') {
        setRegistrationPhoto(compressed);
      } else {
        setAttendanceSelfie(compressed);
      }
      stopCamera();
    }
  };

  // Student Sign-In / Lookup
  const handleCheckStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/students?id=${encodeURIComponent(loginId.trim().toUpperCase())}`);
      const student = await res.json();

      if (student && student.id) {
        // Already registered! Load profile
        setCurrentUser(student);
      } else {
        // Not found: Switch to registration tab with this ID prefilled
        setRegId(loginId.trim().toUpperCase());
        setActiveTab('register');
        setErrorMessage('Student profile not found. Please complete your one-time registration below.');
      }
    } catch (err) {
      setErrorMessage('Error checking student profile.');
    } finally {
      setLoading(false);
    }
  };

  // Register New Student Profile (Stand-alone or First-Time)
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId.trim() || !regName.trim() || !registrationPhoto) {
      setErrorMessage('Please enter your Matric/Reg No, Full Name, and snap your baseline photo.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: regId.trim().toUpperCase(),
          name: regName.trim(),
          profilePhoto: registrationPhoto,
        }),
      });

      const newStudent = await res.json();
      if (!res.ok) {
        setErrorMessage(newStudent.error || 'Registration failed');
      } else {
        setRegisteredSuccess(newStudent);
      }
    } catch (err) {
      setErrorMessage('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo select
  const handleQuickDemoSelect = async (demo: typeof DEMO_STUDENTS[0]) => {
    setLoginId(demo.id);
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/students?id=${encodeURIComponent(demo.id)}`);
      const found = await res.json();
      if (found && found.id) {
        setCurrentUser(found);
      } else {
        setRegId(demo.id);
        setRegName(demo.name.split(' (')[0]);
        setActiveTab('register');
        setErrorMessage('Quick demo student not registered yet. Complete registration below.');
      }
    } catch (err) {
      setErrorMessage('Error loading demo student.');
    } finally {
      setLoading(false);
    }
  };

  // Submit In-Class Attendance
  const handleSubmitAttendance = async () => {
    setErrorMessage('');
    if (!currentUser || !activeSession || !attendanceSelfie) {
      setErrorMessage('Please take your in-class selfie proof.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          studentId: currentUser.id,
          studentName: currentUser.name,
          selfieData: attendanceSelfie,
          deviceFingerprint: isFriendMode ? 'shared-friend-device' : 'student-phone',
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'Failed to submit attendance');
      } else {
        setSuccessData({
          studentName: currentUser.name,
          courseCode: currentClass?.courseCode || 'Course',
          time: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Friend Mode: Switch to classmate
  const handleSwitchToFriend = () => {
    setSuccessData(null);
    setAttendanceSelfie(null);
    setCurrentUser(null);
    setLoginId('');
    setIsFriendMode(true);
    setActiveTab('mark');
    stopCamera();
  };

  // Reset to initial state
  const handleGoHome = () => {
    setCurrentUser(null);
    setSuccessData(null);
    setAttendanceSelfie(null);
    setRegistrationPhoto(null);
    setRegisteredSuccess(null);
    setErrorMessage('');
    setActiveTab('mark');
    stopCamera();
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center p-3 sm:p-6">
      {/* Top Universal Navigation Bar */}
      <nav className="w-full max-w-md flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block leading-tight">SWE Attendance</span>
            <span className="text-[10px] text-blue-600 font-semibold">Software Engineering</span>
          </div>
        </div>

        {/* Navigation Link to Lecturer Admin */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl transition shadow-sm"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
          <span>Lecturer Portal</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </Link>
      </nav>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* ================= STAGE 3: ATTENDANCE CONFIRMED ================= */}
        {successData && currentUser ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Attendance Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-1">Classroom presence verified for today.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-left space-y-2">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <h4 className="font-bold text-slate-800">{currentUser.name}</h4>
                  <span className="text-blue-600 font-semibold">{currentUser.id}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course:</span>
                <span className="font-bold text-slate-800">{successData.courseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logged At:</span>
                <span className="font-semibold text-slate-700">{successData.time}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSwitchToFriend}
                type="button"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Let a classmate mark next on this phone
              </button>

              <button
                onClick={handleGoHome}
                type="button"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Main Menu
              </button>
            </div>
          </div>
        ) : currentUser ? (
          /* ================= STAGE 2: IN-CLASS ATTENDANCE SELFIE ================= */
          <div className="p-5 space-y-4">
            {/* Navigation Header / Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentUser(null);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Student</span>
              </button>

              <button
                onClick={() => {
                  stopCamera();
                  setCurrentUser(null);
                }}
                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>

            {/* Student Verified Profile Header */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 truncate">{currentUser.name}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Profile" />
                </div>
                <span className="text-xs text-blue-700 font-bold block">{currentUser.id}</span>
                <span className="text-[10px] text-slate-500">Official Profile Verified</span>
              </div>
            </div>

            {/* Select Today's Class */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Lecture
                </label>
                <button
                  type="button"
                  onClick={loadClasses}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No classes scheduled for today yet.
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((cls) => {
                    const isOpen = cls.sessions?.[0]?.status === 'active';
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.courseCode} — {cls.courseTitle} {isOpen ? '🟢 [OPEN]' : '🔒 [LOCKED]'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Active Session Countdown */}
            {activeSession ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Attendance Window Open</span>
                </div>
                {timeLeft !== null && (
                  <div className="flex items-center gap-1 text-xs font-bold font-mono text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                🔒 Attendance for this course is currently closed by the lecturer.
              </div>
            )}

            {/* In-Class Camera Snapshot Section */}
            {activeSession && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Take In-Class Selfie
                </label>

                {attendanceSelfie ? (
                  <div className="border border-emerald-300 bg-emerald-50 rounded-xl p-3 text-center">
                    <img
                      src={attendanceSelfie}
                      alt="Today Selfie"
                      className="w-32 h-32 object-cover rounded-xl mx-auto border-2 border-emerald-500 shadow-sm mb-2"
                    />
                    <span className="text-xs font-bold text-emerald-800 block">Selfie Proof Captured</span>
                    <button
                      type="button"
                      onClick={() => startCamera('attendance')}
                      className="text-xs text-blue-600 underline font-semibold mt-1"
                    >
                      Retake Selfie
                    </button>
                  </div>
                ) : cameraActive && cameraMode === 'attendance' ? (
                  <div className="relative border-2 border-blue-500 bg-slate-900 rounded-2xl overflow-hidden text-center shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover -scale-x-100 bg-slate-950"
                    />
                    <div className="p-3 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
                      >
                        <Camera className="w-4 h-4" />
                        Snap Selfie
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera('attendance')}
                    className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 rounded-xl p-5 text-center transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Open Camera to Snap Live Selfie</span>
                    <span className="text-[11px] text-slate-500">Verifies your real-time presence in class</span>
                  </button>
                )}

                {cameraError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {cameraError}
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={loading || !attendanceSelfie}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Attendance Proof
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ================= STAGE 1: TABS (MARK ATTENDANCE vs REGISTER PROFILE) ================= */
          <div>
            {/* Top Switcher Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mark');
                  setErrorMessage('');
                  setRegisteredSuccess(null);
                }}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'mark'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Profile</span>
              </button>
            </div>

            {/* TAB CONTENT: MARK ATTENDANCE */}
            {activeTab === 'mark' && (
              <div className="p-5 space-y-4">
                {isFriendMode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Friend Mode Active:</strong> Sign in with your ID on this device.</span>
                  </div>
                )}

                <div>
                  <h2 className="text-base font-bold text-slate-900">Sign In to Lecture</h2>
                  <p className="text-xs text-slate-500">Enter your Matric Number or Registration Number.</p>
                </div>

                <form onSubmit={handleCheckStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Matric No. or Reg No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SWE/2022/014 or REG/2024/041"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Freshmen awaiting matric numbers can use their official Registration number.
                    </span>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {/* Direct Register Action if first time */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-slate-500">First time marking attendance? </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (loginId.trim()) setRegId(loginId.trim().toUpperCase());
                      setActiveTab('register');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                  >
                    Register your profile & photo here
                  </button>
                </div>

                {/* Quick Demo Selector for presentation */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Demo: Try Sample Student
                  </span>
                  <div className="space-y-1.5">
                    {DEMO_STUDENTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickDemoSelect(s)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          <span className="text-slate-400 ml-2">({s.id})</span>
                        </div>
                        <span className="text-blue-600 font-medium text-[11px]">Select →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STANDALONE REGISTRATION */}
            {activeTab === 'register' && (
              <div className="p-5 space-y-4">
                {registeredSuccess ? (
                  /* Registration Successful Card */
                  <div className="text-center space-y-4 py-2">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">Profile Registered Successfully!</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your official identity has been added to the department registry.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-left">
                      <img
                        src={registeredSuccess.profilePhoto}
                        alt={registeredSuccess.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{registeredSuccess.name}</span>
                        <span className="text-xs font-semibold text-blue-600 block">{registeredSuccess.id}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">Ready for lecture attendance</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(registeredSuccess);
                          setRegisteredSuccess(null);
                          setActiveTab('mark');
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Mark Attendance in Class Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredSuccess(null);
                          setRegId('');
                          setRegName('');
                          setRegistrationPhoto(null);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition"
                      >
                        Register Another Student
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Registration Form */
                  <form onSubmit={handleRegisterProfile} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Student Profile Registration</h2>
                        <p className="text-[11px] text-slate-500">Record your baseline photo for identity verification.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setActiveTab('mark');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Matric No. or Reg No.
                      </label>
                      <input
                        type="text"
                        value={regId}
                        onChange={(e) => setRegId(e.target.value)}
                        placeholder="e.g. SWE/2022/014 or REG/2024/041"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Matric number for returning students, or Reg/JAMB number for freshmen.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Surname Firstname"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Official Baseline Photo Capture */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Official Baseline Photo
                      </label>

                      {registrationPhoto ? (
                        <div className="border border-emerald-300 bg-emerald-50 rounded-xl p-3 text-center">
                          <img
                            src={registrationPhoto}
                            alt="Profile Reference"
                            className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-emerald-500 shadow-sm mb-2"
                          />
                          <span className="text-[11px] font-bold text-emerald-800 block">Baseline Photo Captured</span>
                          <button
                            type="button"
                            onClick={() => startCamera('profile')}
                            className="text-xs text-blue-600 underline font-semibold mt-1"
                          >
                            Retake Photo
                          </button>
                        </div>
                      ) : cameraActive && cameraMode === 'profile' ? (
                        <div className="relative border-2 border-blue-500 bg-slate-900 rounded-2xl overflow-hidden text-center shadow-lg">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-56 object-cover -scale-x-100 bg-slate-950"
                          />
                          <div className="p-2.5 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={captureSnapshot}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
                            >
                              <Camera className="w-4 h-4" />
                              Snap Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startCamera('profile')}
                          className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5"
                        >
                          <Camera className="w-6 h-6 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">Take Official Profile Photo</span>
                          <span className="text-[11px] text-slate-400">Used by lecturers to verify your identity</span>
                        </button>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setActiveTab('mark');
                        }}
                        className="w-1/3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !registrationPhoto}
                        className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Profile'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-4 text-center">
        <span className="text-[11px] text-slate-400">
          Smart Attendance System • Department of Software Engineering (SWE)
        </span>
      </footer>
    </main>
  );
}
