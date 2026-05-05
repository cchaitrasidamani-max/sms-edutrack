import { useEffect, useState } from 'react'
import { attendanceAPI, studentAPI, courseAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SUBJECTS = ['Data Structures','Algorithms','DBMS','Operating Systems','Computer Networks','Software Engineering','Web Technologies','Mathematics']
const COURSE_SUBJECTS = {
  BTECH: {
    1: ['Mathematics','Programming in C','Engineering Physics','Basic Electrical Engineering'],
    2: ['Data Structures','Digital Logic','Engineering Chemistry','Discrete Mathematics'],
    3: ['Algorithms','DBMS','Computer Organization','Object Oriented Programming'],
    4: ['Operating Systems','Computer Networks','Software Engineering','Web Technologies'],
    5: ['Machine Learning','Compiler Design','Cloud Computing','Cyber Security'],
    6: ['Data Mining','Mobile Application Development','Distributed Systems','AI'],
    7: ['Big Data Analytics','Internet of Things','Project Work','Elective I'],
    8: ['Major Project','Internship','Seminar','Elective II'],
  },
  BCA: {
    1: ['Computer Fundamentals','Programming in C','Mathematics','Digital Electronics'],
    2: ['Data Structures','Database Management Systems','Computer Organization','Business Communication'],
    3: ['Object Oriented Programming','Operating Systems','Web Technologies','Software Engineering'],
    4: ['Java Programming','Computer Networks','Python Programming','Visual Programming'],
    5: ['Cloud Computing','Data Mining','Cyber Security','Mobile Application Development'],
    6: ['Project Work','E-Commerce','Machine Learning Basics','Seminar'],
  },
  MCA: {
    1: ['Advanced Java','Advanced DBMS','Data Structures','Computer Networks'],
    2: ['Data Mining','Cloud Computing','Machine Learning','Software Project Management'],
    3: ['Cyber Security','Mobile Application Development','Big Data Analytics','Internet of Things'],
    4: ['Project Work','Internship','Seminar','Elective'],
  },
}
const sortByAttendanceDate = (records = []) =>
  [...records].sort((a, b) => String(b.attendanceDate).localeCompare(String(a.attendanceDate)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
const subjectsForCourse = (course, semester) => {
  const key = `${course?.code || ''} ${course?.name || ''}`.toUpperCase()
  const sem = Number(semester)
  if (key.includes('BCA')) return COURSE_SUBJECTS.BCA[sem] || SUBJECTS
  if (key.includes('MCA')) return COURSE_SUBJECTS.MCA[sem] || SUBJECTS
  if (key.includes('BTECH') || key.includes('B.TECH')) return COURSE_SUBJECTS.BTECH[sem] || SUBJECTS
  return SUBJECTS
}

export default function AttendancePage() {
  const { user } = useAuth()
  const canMarkAttendance = user?.role === 'FACULTY'
  const [tab, setTab] = useState(canMarkAttendance ? 'mark' : 'view')

  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])

  // Mark attendance state
  const [selCourse, setSelCourse] = useState('')
  const [selSemester, setSelSemester] = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0])
  const [courseStudents, setCourseStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // studentId -> status
  const [existingRecords, setExistingRecords] = useState([])
  const [marking, setMarking] = useState(false)

  // View state
  const [selStudent, setSelStudent] = useState('')
  const [summary, setSummary] = useState(null)
  const [loadingSum, setLoadingSum] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const selectedCourse = courses.find(c => c.id === Number(selCourse))
  const availableSemesters = selectedCourse?.totalSemesters
    ? Array.from({ length: selectedCourse.totalSemesters }, (_, i) => i + 1)
    : []
  const availableSubjects = selCourse && selSemester ? subjectsForCourse(selectedCourse, selSemester) : []

  // Fetch all students and courses on mount
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      studentAPI.getProfile()
        .then(r => {
          const profile = r.data.data
          if (profile) {
            setStudents([profile])
            setSelStudent(profile.id)
          }
        })
        .catch(() => toast.error('Failed to load student profile'))
      return
    }

    studentAPI.getAll().then(r => setStudents(r.data.data || []))
    courseAPI.getAll().then(r => setCourses(r.data.data || []))
  }, [user?.role])

  // Filter students of selected course for attendance marking
  useEffect(() => {
    if (selCourse) {
      const filtered = students.filter(s =>
        s.courseId === Number(selCourse) &&
        (!selSemester || s.semester === Number(selSemester))
      )
      setCourseStudents(filtered)
      setSelSubject(subject => subjectsForCourse(courses.find(c => c.id === Number(selCourse)), selSemester).includes(subject) ? subject : '')
    } else {
      setCourseStudents([])
      setSelSemester('')
      setSelSubject('')
      setAttendance({})
      setExistingRecords([])
    }
  }, [selCourse, selSemester, students, courses])

  useEffect(() => {
    if (!selCourse || !selSemester || !selSubject || !selDate || courseStudents.length === 0) {
      const init = {}
      courseStudents.forEach(s => { init[s.id] = 'PRESENT' })
      setAttendance(init)
      setExistingRecords([])
      return
    }

    let cancelled = false
    setLoadingExisting(true)
    attendanceAPI.getByCourseDate(selCourse, selSubject, selDate)
      .then(res => {
        if (cancelled) return
        const existing = res.data.data || []
        setExistingRecords(sortByAttendanceDate(existing))
        const byStudent = Object.fromEntries(existing.map(a => [a.studentId, a.status]))
        const next = {}
        courseStudents.forEach(s => { next[s.id] = byStudent[s.id] || 'PRESENT' })
        setAttendance(next)
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load existing attendance')
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })

    return () => { cancelled = true }
  }, [selCourse, selSemester, selSubject, selDate, courseStudents])

  // For STUDENT role, set selected student to logged in user automatically
  useEffect(() => {
    if (user?.role === 'STUDENT' && students.length > 0) {
      const loggedStudent = students.find(s =>
        s.rollNumber === user.username || s.email === user.email || s.fullName === user.fullName
      )
      if (loggedStudent) setSelStudent(loggedStudent.id)
    }
  }, [user, students])

  useEffect(() => {
    if (user?.role !== 'STUDENT' || !selStudent || summary || loadingSum) return
    loadSummary()
  }, [user?.role, selStudent, summary, loadingSum])

  const markAll = (status) => {
    const next = {}
    courseStudents.forEach(s => { next[s.id] = status })
    setAttendance(next)
  }

  const handleSubmit = async () => {
    if (!selCourse || !selSemester || !selSubject || !selDate) return toast.error('Fill all fields')
    if (courseStudents.length === 0) return toast.error('No students in this course and semester')
    setMarking(true)
    try {
      const payload = courseStudents.map(s => ({
        studentId: s.id,
        subject: selSubject,
        attendanceDate: selDate,
        status: attendance[s.id] || 'ABSENT',
      }))
      const res = await attendanceAPI.markBulk(payload)
      setExistingRecords(sortByAttendanceDate(res.data.data || []))
      toast.success(`Attendance saved for ${payload.length} students!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setMarking(false)
    }
  }

  const loadSummary = async () => {
    if (!selStudent) return toast.error('Select a student')
    setLoadingSum(true)
    try {
      const res = await attendanceAPI.getSummary(selStudent)
      setSummary(res.data.data)
    } catch {
      toast.error('Failed to load summary')
    } finally {
      setLoadingSum(false)
    }
  }

  const statusBtn = (studentId, status) => {
    const active = attendance[studentId] === status
    const colors = { PRESENT:'#34d399', ABSENT:'#f87171' }
    return (
      <button
        onClick={() => setAttendance(p => ({ ...p, [studentId]: status }))}
        style={{
          padding:'4px 10px',
          borderRadius:6,
          fontSize:11,
          fontWeight:600,
          border: active ? `1px solid ${colors[status]}` : '1px solid var(--border)',
          background: active ? `${colors[status]}20` : 'transparent',
          color: active ? colors[status] : 'var(--text-muted)',
          cursor:'pointer',
          transition:'all 0.12s',
        }}
      >
        {status.charAt(0)}{status.slice(1).toLowerCase()}
      </button>
    )
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Attendance</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>
            Track and manage class attendance
          </p>
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--bg-elevated)', borderRadius:10, padding:4 }}>
          {canMarkAttendance && (
            <button
              onClick={() => setTab('mark')}
              style={{
                padding:'7px 16px',
                borderRadius:7,
                border:'none',
                cursor:'pointer',
                fontSize:13,
                fontWeight:500,
                background: tab === 'mark' ? 'var(--bg-card)' : 'transparent',
                color: tab === 'mark' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === 'mark' ? 'var(--shadow-sm)' : 'none',
                transition:'all 0.15s',
              }}
            >
              Mark Attendance
            </button>
          )}
          <button
            onClick={() => setTab('view')}
            style={{
              padding:'7px 16px',
              borderRadius:7,
              border:'none',
              cursor:'pointer',
              fontSize:13,
              fontWeight:500,
              background: tab === 'view' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'view' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === 'view' ? 'var(--shadow-sm)' : 'none',
              transition:'all 0.15s',
            }}
          >
            View Summary
          </button>
        </div>
      </div>

      {/* Mark Attendance tab */}
      {tab === 'mark' && canMarkAttendance && (
        <div>
          {/* Filters */}
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, alignItems:'end' }}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-input" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-input" value={selSemester} onChange={e => setSelSemester(e.target.value)} disabled={!selCourse}>
                  <option value="">{selCourse ? 'Select Semester' : 'Select course first'}</option>
                  {availableSemesters.map(n => <option key={n} value={n}>Semester {n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input" value={selSubject} onChange={e => setSelSubject(e.target.value)} disabled={!selCourse || !selSemester}>
                  <option value="">{selSemester ? 'Select Subject' : 'Select semester first'}</option>
                  {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={selDate} onChange={e => setSelDate(e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => markAll('PRESENT')}>All Present</button>
                <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => markAll('ABSENT')}>All Absent</button>
              </div>
            </div>
          </div>

          {/* Student list */}
          {courseStudents.length > 0 ? (
            <div className="card" style={{ padding:0, marginBottom:20 }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:600 }}>{courseStudents.length} students • Semester {selSemester || '-'} • {selSubject || 'No subject selected'}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{loadingExisting ? 'Loading saved details...' : selDate}</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStudents.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color:'var(--text-muted)', width:40 }}>{i + 1}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Avatar name={s.fullName} />
                            <span style={{ fontWeight:500 }}>{s.fullName}</span>
                          </div>
                        </td>
                        <td><span className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{s.rollNumber}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            {['PRESENT','ABSENT'].map(st => statusBtn(s.id, st))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={marking || loadingExisting}>
                  {marking ? 'Saving…' : `Save Attendance (${courseStudents.length} students)`}
                </button>
              </div>
            </div>
          ) : selCourse && selSemester ? (
            <div className="card"><div className="empty-state">No students enrolled in this course and semester</div></div>
          ) : selCourse ? (
            <div className="card"><div className="empty-state">Select a semester to load students</div></div>
          ) : (
            <div className="card"><div className="empty-state" style={{ padding:40 }}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Select a course to start marking attendance
            </div></div>
          )}

          {existingRecords.length > 0 && (
            <div className="card" style={{ padding:0 }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:600 }}>Saved Attendance Details</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selDate}</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingRecords.map(r => (
                      <tr key={r.id}>
                        <td>{r.attendanceDate}</td>
                        <td>{r.studentName}</td>
                        <td><span className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{r.rollNumber}</span></td>
                        <td>{r.subject}</td>
                        <td>
                          <span className={`badge ${r.status === 'PRESENT' ? 'badge-green' : 'badge-red'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.markedByName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Summary tab */}
      {tab === 'view' && (
        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1 }}>
                <label className="form-label">Select Student</label>
                <select
                  className="form-input"
                  value={selStudent}
                  onChange={e => setSelStudent(e.target.value)}
                  disabled={user?.role === 'STUDENT'} // disable dropdown if STUDENT user
                >
                  <option value="">Choose a student…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.username || s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={loadSummary} disabled={loadingSum}>
                {loadingSum ? 'Loading…' : 'View Report'}
              </button>
            </div>
          </div>

          {summary && (
            <div>
              <div className="grid-3" style={{ marginBottom:20 }}>
                <div className="stat-card" style={{ '--accent-color':'#4f8ef7','--accent-bg':'rgba(79,142,247,0.12)' }}>
                  <div className="stat-icon"><CalIcon /></div>
                  <div className="stat-value">{summary.totalClasses}</div>
                  <div className="stat-label">Total Classes</div>
                </div>
                <div className="stat-card" style={{ '--accent-color':'#34d399','--accent-bg':'rgba(52,211,153,0.12)' }}>
                  <div className="stat-icon"><CheckIcon /></div>
                  <div className="stat-value">{summary.totalPresent}</div>
                  <div className="stat-label">Classes Attended</div>
                </div>
                <div className="stat-card" style={{
                  '--accent-color': summary.overallPercentage >= 75 ? '#34d399' : summary.overallPercentage >= 60 ? '#f59e0b' : '#f87171',
                  '--accent-bg': summary.overallPercentage >= 75 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'
                }}>
                  <div className="stat-icon"><ChartIcon /></div>
                  <div className="stat-value">{summary.overallPercentage}%</div>
                  <div className="stat-label">Overall Attendance</div>
                </div>
              </div>

              {/* Subject-wise attendance */}
              {Object.keys(summary.subjectWise || {}).length > 0 && (
                <div className="card" style={{ marginBottom:20 }}>
                  <h3 style={{ fontWeight:700, marginBottom:16 }}>Subject-wise Attendance</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {Object.entries(summary.subjectWise).map(([subj, pct]) => (
                      <div key={subj}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:14, fontWeight:500 }}>{subj}</span>
                          <span style={{
                            fontWeight:700, fontSize:14,
                            color: pct >= 75 ? '#34d399' : pct >= 60 ? '#f59e0b' : '#f87171'
                          }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{
                            width:`${Math.min(pct,100)}%`,
                            background: pct >= 75 ? '#34d399' : pct >= 60 ? '#f59e0b' : '#f87171',
                          }} />
                        </div>
                        {pct < 75 && (
                          <div style={{ fontSize:11, color:'#f87171', marginTop:4 }}>
                            ⚠ Below 75% attendance threshold
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(summary.records || []).length > 0 && (
                <div className="card" style={{ padding:0 }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:600 }}>
                    Date-wise Attendance Details
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Subject</th>
                          <th>Status</th>
                          <th>Marked By</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortByAttendanceDate(summary.records).map(r => (
                          <tr key={r.id}>
                            <td>{r.attendanceDate}</td>
                            <td>{r.subject}</td>
                            <td>
                              <span className={`badge ${r.status === 'PRESENT' ? 'badge-green' : 'badge-red'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>{r.markedByName || '—'}</td>
                            <td>{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??'
  const colors = ['#4f8ef7','#34d399','#f59e0b','#a78bfa','#f87171']
  const color = colors[name?.charCodeAt(0) % colors.length] || '#4f8ef7'
  return (
    <div style={{
      width:30, height:30, borderRadius:'50%',
      background:`${color}28`, color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:11, fontWeight:700, flexShrink:0
    }}>
      {initials}
    </div>
  )
}

function CalIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}

function CheckIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
}

function ChartIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
