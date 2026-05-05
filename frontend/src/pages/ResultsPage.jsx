import { useEffect, useState } from 'react'
import { resultAPI, studentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const SUBJECTS = ['Data Structures','Algorithms','DBMS','Operating Systems','Computer Networks','Software Engineering','Web Technologies','Mathematics']
const EXAM_TYPES = ['INTERNAL','MIDTERM','FINAL','ASSIGNMENT','PRACTICAL']
const todayInputValue = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const emptyForm = () => ({ studentId:'', subject:'', semester:1, examType:'INTERNAL', marksObtained:'', maxMarks:100, resultDate:todayInputValue(), remarks:'' })
const sortByResultDate = (results = []) =>
  [...results].sort((a, b) => String(b.resultDate || b.createdAt || '').localeCompare(String(a.resultDate || a.createdAt || '')))

export default function ResultsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('enter')
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Report
  const [selStudent, setSelStudent] = useState('')
  const [report, setReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const canEdit = ['ADMIN','FACULTY'].includes(user?.role)
  const maxResultDate = todayInputValue()

  useEffect(() => {
    studentAPI.getAll().then(r => setStudents(r.data.data || []))
  }, [])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.studentId || !form.subject || !form.examType || !form.marksObtained) {
      return toast.error('Fill all required fields')
    }
    if (Number(form.marksObtained) > Number(form.maxMarks)) {
      return toast.error('Marks obtained cannot exceed max marks')
    }
    if (!form.resultDate) return toast.error('Select result date')
    if (form.resultDate > maxResultDate) return toast.error('Result date cannot be in the future')
    setSaving(true)
    try {
      const payload = {
        ...form,
        studentId: Number(form.studentId),
        semester: Number(form.semester),
        marksObtained: Number(form.marksObtained),
        maxMarks: Number(form.maxMarks),
      }
      await resultAPI.add(payload)
      toast.success('Result added successfully!')
      setForm(emptyForm())
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const loadReport = async () => {
    if (!selStudent) return toast.error('Select a student')
    setLoadingReport(true)
    try {
      const res = await resultAPI.getReport(selStudent)
      setReport(res.data.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoadingReport(false) }
  }

  const gradeColor = (g) => {
    const map = { O:'#34d399', 'A+':'#4f8ef7', A:'#60a5fa', 'B+':'#f59e0b', B:'#fbbf24', C:'#fb923c', F:'#f87171' }
    return map[g] || '#9ca3af'
  }

  const chartData = report?.results ? Object.values(
    report.results.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = { subject: r.subject.split(' ').slice(0,2).join(' '), marks: 0, count: 0 }
      acc[r.subject].marks += (r.marksObtained / r.maxMarks) * 100
      acc[r.subject].count++
      return acc
    }, {})
  ).map(d => ({ ...d, avg: Math.round(d.marks / d.count) })) : []

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Results & Marks</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>Academic performance management</p>
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--bg-elevated)', borderRadius:10, padding:4 }}>
          {[['enter','Enter Results'],['report','Performance Report']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} style={{
              padding:'7px 16px', borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background: tab === val ? 'var(--bg-card)' : 'transparent',
              color: tab === val ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === val ? 'var(--shadow-sm)' : 'none',
              transition:'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'enter' && canEdit && (
        <div style={{ maxWidth:640 }}>
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Enter Student Marks</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-input" value={form.studentId} onChange={f('studentId')}>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} — {s.rollNumber}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select className="form-input" value={form.subject} onChange={f('subject')}>
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type *</label>
                  <select className="form-input" value={form.examType} onChange={f('examType')}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-input" value={form.semester} onChange={f('semester')}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input className="form-input" type="number" value={form.maxMarks} onChange={f('maxMarks')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Result Date *</label>
                  <input className="form-input" type="date" max={maxResultDate} value={form.resultDate} onChange={f('resultDate')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Marks Obtained *</label>
                <input className="form-input" type="number" value={form.marksObtained} onChange={f('marksObtained')}
                  placeholder={`Out of ${form.maxMarks}`} />
                {form.marksObtained && (
                  <div style={{ marginTop:6, fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ color:'var(--text-muted)' }}>
                      {((form.marksObtained/form.maxMarks)*100).toFixed(1)}%
                    </span>
                    <GradePill pct={(form.marksObtained/form.maxMarks)*100} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input className="form-input" value={form.remarks} onChange={f('remarks')} placeholder="Optional notes..." />
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}
                style={{ alignSelf:'flex-start', padding:'10px 24px' }}>
                {saving ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1 }}>
                <label className="form-label">Select Student</label>
                <select className="form-input" value={selStudent} onChange={e => setSelStudent(e.target.value)}>
                  <option value="">Choose a student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={loadReport} disabled={loadingReport}>
                {loadingReport ? 'Loading…' : 'Generate Report'}
              </button>
            </div>
          </div>

          {report && (
            <div>
              {/* Summary cards */}
              <div className="grid-3" style={{ marginBottom:20 }}>
                <div className="stat-card" style={{ '--accent-color':'#4f8ef7','--accent-bg':'rgba(79,142,247,0.12)' }}>
                  <div className="stat-icon"><ExamIcon /></div>
                  <div className="stat-value">{report.totalExams ?? 0}</div>
                  <div className="stat-label">Total Exams</div>
                </div>
                <div className="stat-card" style={{ '--accent-color':'#34d399','--accent-bg':'rgba(52,211,153,0.12)' }}>
                  <div className="stat-icon"><PctIcon /></div>
                  <div className="stat-value">{report.averagePercentage ?? 0}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card" style={{ '--accent-color': gradeColor(report.overallGrade), '--accent-bg': `${gradeColor(report.overallGrade)}20` }}>
                  <div className="stat-icon"><GradeIcon /></div>
                  <div className="stat-value" style={{ color: gradeColor(report.overallGrade) }}>{report.overallGrade}</div>
                  <div className="stat-label">Overall Grade</div>
                </div>
              </div>

              {/* Bar chart */}
              {chartData.length > 0 && (
                <div className="card" style={{ marginBottom:20 }}>
                  <h3 style={{ fontWeight:700, marginBottom:16 }}>Subject Performance (%)</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top:5, right:20, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="subject" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8 }}
                        formatter={(v) => [`${v}%`, 'Avg Score']}
                      />
                      <Bar dataKey="avg" fill="#4f8ef7" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Results table */}
              <div className="card" style={{ padding:0 }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:600 }}>
                  Detailed Results
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Exam Type</th>
                        <th>Semester</th>
                        <th>Marks</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortByResultDate(report.results || []).map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight:500 }}>{r.subject}</td>
                          <td>{r.resultDate || r.createdAt?.slice(0, 10) || '—'}</td>
                          <td><span className="badge badge-blue" style={{ fontSize:10 }}>{r.examType}</span></td>
                          <td>Sem {r.semester}</td>
                          <td>{r.marksObtained} / {r.maxMarks}</td>
                          <td>{r.percentage?.toFixed(1)}%</td>
                          <td>
                            <span style={{
                              fontWeight:700, fontSize:14,
                              color: gradeColor(r.grade),
                            }}>{r.grade}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GradePill({ pct }) {
  const grade = pct >= 90 ? 'O' : pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B+' : pct >= 50 ? 'B' : pct >= 40 ? 'C' : 'F'
  const colors = { O:'#34d399', 'A+':'#4f8ef7', A:'#60a5fa', 'B+':'#f59e0b', B:'#fbbf24', C:'#fb923c', F:'#f87171' }
  return <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, background:`${colors[grade]}20`, color:colors[grade] }}>{grade}</span>
}

function ExamIcon()  { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function PctIcon()   { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> }
function GradeIcon() { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
