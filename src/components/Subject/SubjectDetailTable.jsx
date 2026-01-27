function SubjectDetailTable({
  teacherName,
  selectedTeacherId,
  selectedSubject,
  rows,
  onCreate,
  onEdit,
  onDelete,
}) {
  const opened = !!selectedTeacherId && !!selectedSubject

  return (
    <>
      {/* 강사 테이블과 상세 영역 사이 구분선 */}
      <div className="detail-section-divider" />

      {opened && (
        <>
          {/* 상세 영역 헤더: 제목 + 내용 추가 버튼 */}
          <div className="detail-header">
            <h3 className="detail-title">
              Subject : {teacherName} - {selectedSubject}
            </h3>

            <button
              type="button"
              className="secondary-btn"
              onClick={onCreate}
            >
              + 내용 추가
            </button>
          </div>

          {/* 상세 테이블 */}
          <div className="table-card">
            <table className="data-table detail">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>day</th>
                  <th style={{ width: 140 }}>detail</th>
                  <th>content</th>
                  <th style={{ width: 120 }}>link</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      해당 강사의 해당 과목 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.day}</td>
                      <td>{row.detail}</td>
                      <td>{row.content}</td>
                      <td>
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          열기
                        </a>
                      </td>
                      <td>
                        <div className="action-group center">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => onEdit(row)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="action-btn danger"
                            onClick={() => onDelete(row.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

export default SubjectDetailTable
