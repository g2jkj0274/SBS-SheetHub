function TeacherTable({
  rows,
  selectedTeacherId,
  selectedSubject,
  onSelectSubject,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Id</th>
            <th style={{ width: 140 }}>Name</th>
            <th style={{ width: 140 }}>Department</th>
            <th>Subject</th>
            <th style={{ width: 120 }}>Source</th>
            <th style={{ width: 100 }}>Share</th>
            <th style={{ width: 140 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>{r.department}</td>

              <td>
                <div className="subject-list">
                  {r.subjects.map((subject, index) => {
                    const active =
                      selectedTeacherId === r.id && selectedSubject === subject

                    return (
                      <button
                        key={`${subject}-${index}`}
                        type="button"
                        className={`subject-badge-btn ${active ? 'active' : ''}`}
                        onClick={() => onSelectSubject(r.id, subject)}
                        title={`${subject} 상세 보기`}
                      >
                        {subject}
                      </button>
                    )
                  })}
                </div>
              </td>

              <td>{r.source}</td>
              <td>{r.share}</td>

              <td>
                <div className="action-group">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => onEdit(r)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={() => onDelete(r.id)}
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-cell">
                강사 데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default TeacherTable
