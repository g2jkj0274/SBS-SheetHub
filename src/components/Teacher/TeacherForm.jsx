import { useEffect, useState } from 'react'

function TeacherForm({ mode, initialValue, onCancel, onCreate, onUpdate }) {
  const isEdit = mode === 'edit'

  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [subjectsText, setSubjectsText] = useState('') // "Java, Spring"
  const [source, setSource] = useState('')
  const [share, setShare] = useState('Public')

  useEffect(() => {
    if (!isEdit || !initialValue) return

    setName(initialValue.name ?? '')
    setDepartment(initialValue.department ?? '')
    setSubjectsText(Array.isArray(initialValue.subjects) ? initialValue.subjects.join(', ') : '')
    setSource(initialValue.source ?? '')
    setShare(initialValue.share ?? 'Public')
  }, [isEdit, initialValue])

  const parseSubjects = (text) => {
    // 쉼표로 분리 후 trim, 빈 값 제거, 중복 제거
    const parts = text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const unique = []
    for (let i = 0; i < parts.length; i++) {
      if (!unique.includes(parts[i])) unique.push(parts[i])
    }
    return unique
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const subjects = parseSubjects(subjectsText)

    // 최소 검증(빈 값 방지)
    if (!name.trim()) {
      window.alert('Name은 필수입니다.')
      return
    }
    if (!department.trim()) {
      window.alert('Department는 필수입니다.')
      return
    }
    if (subjects.length === 0) {
      window.alert('Subject는 최소 1개 이상 필요합니다. (예: Java, Spring)')
      return
    }
    if (!source.trim()) {
      window.alert('Source는 필수입니다.')
      return
    }

    const payload = {
      name: name.trim(),
      department: department.trim(),
      subjects,
      source: source.trim(),
      share,
    }

    if (isEdit) {
      onUpdate(initialValue.id, payload)
    } else {
      onCreate(payload)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? '강사 수정' : '강사 추가'}</h3>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="닫기">
            ×
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label">Name</label>
            <input 
              className="input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 홍길동"
            />
          </div>

          <div className="form-row">
            <label className="label">Department</label>
            <input 
              className="input" 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="예) 디자인학과, IT학과"
            />
          </div>

          <div className="form-row">
            <label className="label">Subject</label>
            <input
              className="input"
              value={subjectsText}
              onChange={(e) => setSubjectsText(e.target.value)}
              placeholder="예) 포토샵, 일러스트, 디자인"
            />
            <div className="hint">쉼표(,)로 여러 과목을 입력합니다.</div>
          </div>

          <div className="form-row">
            <label className="label">Source</label>
            <input 
              className="input" 
              value={source} 
              onChange={(e) => setSource(e.target.value)}
              placeholder="예) 외부 사이트, 직접 제작, 교안 자료"
            />
            <div className="hint">교안 출처를 입력합니다.</div>
          </div>

          <div className="form-row">
            <label className="label">Share</label>
            <select className="select" value={share} onChange={(e) => setShare(e.target.value)}>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            <div className="hint">교안 공개 여부를 선택합니다.</div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onCancel}>
              취소
            </button>
            <button type="submit" className="primary-btn">
              {isEdit ? '수정 저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherForm
