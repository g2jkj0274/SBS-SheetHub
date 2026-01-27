import { useEffect, useState } from 'react'
import { supabase } from '/supabaseClient'
import '../styles/auditlog.css'

function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [filterType, setFilterType] = useState('') // 필터: CREATE, READ, UPDATE, DELETE 또는 빈 값(전체)
  const [filterTable, setFilterTable] = useState('') // 필터: teachers, subject_details 또는 빈 값(전체)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setIsLoading(true)
    setLoadError(null)

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })

      if (filterType) {
        query = query.eq('action', filterType)
      }

      if (filterTable) {
        query = query.eq('table_name', filterTable)
      }

      const { data, error } = await query

      if (error) {
        setLoadError(error.message)
        setLogs([])
      } else {
        setLogs(data ?? [])
      }
    } catch (err) {
      setLoadError(err.message)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = () => {
    loadLogs()
  }

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE':
        return 'badge badge-create'
      case 'UPDATE':
        return 'badge badge-update'
      case 'DELETE':
        return 'badge badge-delete'
      case 'READ':
        return 'badge badge-read'
      default:
        return 'badge'
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatJson = (jsonObj) => {
    if (!jsonObj) return '-'
    if (typeof jsonObj === 'string') return jsonObj
    return JSON.stringify(jsonObj, null, 2)
  }

  return (
    <div className="audit-log-page">
      <h1>데이터 변경 이력</h1>

      <div className="filter-section">
        <div className="filter-group">
          <label>작업 유형:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">전체</option>
            <option value="CREATE">생성 (CREATE)</option>
            <option value="UPDATE">수정 (UPDATE)</option>
            <option value="DELETE">삭제 (DELETE)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>테이블:</label>
          <select value={filterTable} onChange={(e) => setFilterTable(e.target.value)}>
            <option value="">전체</option>
            <option value="teachers">강사 (teachers)</option>
            <option value="subject_details">과목 상세 (subject_details)</option>
          </select>
        </div>

        <button className="primary-btn" onClick={handleFilterChange}>
          검색
        </button>
      </div>

      {isLoading && <div className="loading">로딩 중...</div>}
      {loadError && <div className="error">오류: {loadError}</div>}

      {!isLoading && !loadError && (
        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>일시</th>
                <th>테이블</th>
                <th>레코드 ID</th>
                <th>작업</th>
                <th>변경 전</th>
                <th>변경 후</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    변경 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="datetime">{formatDateTime(log.changed_at)}</td>
                    <td className="table-name">{log.table_name}</td>
                    <td className="record-id">{log.record_id}</td>
                    <td>
                      <span className={getActionBadgeClass(log.action)}>{log.action}</span>
                    </td>
                    <td className="data-cell">
                      <pre>{formatJson(log.old_value)}</pre>
                    </td>
                    <td className="data-cell">
                      <pre>{formatJson(log.new_value)}</pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="log-info">
        총 {logs.length}개의 변경 이력
      </div>
    </div>
  )
}

export default AuditLogPage
