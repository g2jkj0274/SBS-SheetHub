import { useEffect, useState, useTransition } from 'react'

function DetailForm({
  mode,
  teacherName,
  subject,
  initialValue,
  onCancel,
  onCreate,
  onUpdate,
}) {
  const isEdit = mode === 'edit'
  const [, startTransition] = useTransition()

  const [day, setDay] = useState('')
  const [detail, setDetail] = useState('')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => {
    if (!isEdit || !initialValue) return
    startTransition(() => {
      setDay(initialValue.day ?? '')
      setDetail(initialValue.detail ?? '')
      setContent(initialValue.content ?? '')
      setLink(initialValue.link ?? '')
    })
  }, [isEdit, initialValue])

  const normalizeDay = (value) => {
    // "1" -> "01", "01" -> "01", "10" -> "10"
    const n = parseInt(value, 10)
    return String(n).padStart(2, '0')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const rawDay = day.trim()

    if (!rawDay) {
      window.alert('day(강의 일차)는 필수입니다. (예: 01)')
      return
    }

    if (!/^[0-9]{1,3}$/.test(rawDay)) {
      window.alert('day는 숫자만 입력하세요. (예: 01, 02)')
      return
    }

    const normalizedDay = normalizeDay(rawDay)

    if (!detail.trim()) {
      window.alert('detail은 필수입니다.')
      return
    }
    if (!content.trim()) {
      window.alert('content는 필수입니다.')
      return
    }
    if (!link.trim()) {
      window.alert('link는 필수입니다.')
      return
    }

    const payload = {
      day: normalizedDay, // ✅ 항상 2자리 저장
      detail: detail.trim(),
      content: content.trim(),
      link: link.trim(),
    }

    if (isEdit) onUpdate(initialValue.id, payload)
    else onCreate(payload)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit
              ? `내용 수정 (${teacherName} / ${subject})`
              : `내용 추가 (${teacherName} / ${subject})`}
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label">day (강의 일차)</label>
            <input
              className="input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="예: 01"
            />
            <div className="hint">숫자만 입력하세요.</div>
          </div>

          <div className="form-row">
            <label className="label">detail</label>
            <input
              className="input"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="label">content</label>
            <textarea
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-row">
            <label className="label">link</label>
            <input
              className="input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://"
            />
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

export default DetailForm
