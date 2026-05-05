import { useEffect, useState } from 'react'
import { resultAPI } from '../services/api'
import toast from 'react-hot-toast'

const sortByResultDate = (results = []) =>
  [...results].sort((a, b) => String(b.resultDate || b.createdAt || '').localeCompare(String(a.resultDate || a.createdAt || '')))

export default function StudentResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resultAPI.getMy().then(r => setResults(r.data.data || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading results...</div>

  return (
    <div>
      <div className="topbar">
        <h1>My Results</h1>
      </div>

      {results.length === 0 ? (
        <div className="card"><div className="empty-state">No results available yet</div></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Semester</th>
                <th>Exam Type</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sortByResultDate(results).map(r => (
                <tr key={r.id}>
                  <td>{r.subject}</td>
                  <td>{r.resultDate || r.createdAt?.slice(0, 10) || '—'}</td>
                  <td>Semester {r.semester}</td>
                  <td>{r.examType}</td>
                  <td>{r.marksObtained}/{r.maxMarks}</td>
                  <td>
                    <span className={`badge ${
                      r.grade === 'O' ? 'badge-green' :
                      r.grade.startsWith('A') ? 'badge-blue' :
                      r.grade.startsWith('B') ? 'badge-yellow' :
                      r.grade === 'C' ? 'badge-orange' : 'badge-red'
                    }`}>{r.grade}</span>
                  </td>
                  <td>{r.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
