import { useEffect, useMemo, useRef, useState } from 'react'
import TeacherTable from '../components/Teacher/TeacherTable'
import TeacherForm from '../components/Teacher/TeacherForm'
import SubjectDetailTable from '../components/Subject/SubjectDetailTable'
import DetailForm from '../components/Subject/DetailForm'
import { supabase } from '/supabaseClient'
import { logAudit } from '../utils/auditUtils'
import '../styles/datatable.css'

function DataTablePage() {
  // ===== 강사 ID: "01", "02" 형식 =====
  const normalizeTeacherId = (value) => String(value).padStart(2, '0')

  // ===== 강사 데이터 (Supabase에서 로딩) =====
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // 다음 강사 ID 생성용(숫자 카운터) -> 저장은 "01" 형식으로
  const nextTeacherIdRef = useRef(1)

  // ===== 강사별/과목별 상세 테이블: subjectTables[teacherId][subject] =====
  const [subjectTables, setSubjectTables] = useState({})

  // 상세 row id 증가값: detailNextIdRef.current[teacherId][subject] = nextId
  const detailNextIdRef = useRef({})

  // ===== 선택 상태: 강사 + 과목 =====
  const [selectedTeacherId, setSelectedTeacherId] = useState(null) // "01"
  const [selectedSubject, setSelectedSubject] = useState(null) // "Java"

  // ===== Supabase에서 teachers / subject_details 로딩 =====
  useEffect(() => {
    let alive = true

    const computeNextTeacherId = (teachers) => {
      const maxId = (teachers ?? [])
        .map((t) => parseInt(t.id, 10))
        .filter((n) => Number.isFinite(n))
        .reduce((acc, cur) => Math.max(acc, cur), 0)

      nextTeacherIdRef.current = maxId + 1
    }

    const buildSubjectTables = (details) => {
      const tables = {}
      const nextIds = {}

      for (const row of details ?? []) {
        const teacherId = row.teacher_id
        const subject = row.subject

        if (!tables[teacherId]) tables[teacherId] = {}
        if (!tables[teacherId][subject]) tables[teacherId][subject] = []

        tables[teacherId][subject].push({
          id: row.id,
          day: row.day,
          detail: row.detail,
          content: row.content,
          link: row.link,
        })

        if (!nextIds[teacherId]) nextIds[teacherId] = {}
        const cur = nextIds[teacherId][subject] ?? 0
        const rowIdNum = Number(row.id) || 0
        nextIds[teacherId][subject] = Math.max(cur, rowIdNum)
      }

      for (const teacherId of Object.keys(nextIds)) {
        for (const subject of Object.keys(nextIds[teacherId])) {
          nextIds[teacherId][subject] = nextIds[teacherId][subject] + 1
        }
      }

      return { tables, nextIds }
    }

    async function loadAll() {
      setIsLoading(true)
      setLoadError(null)

      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .order('id', { ascending: true })

      if (!alive) return

      if (teachersError) {
        setRows([])
        setSubjectTables({})
        detailNextIdRef.current = {}
        setLoadError(teachersError)
        setIsLoading(false)
        return
      }

      // ★ subjects null 방지(TeacherTable에서 map 사용)
      const normalizedTeachers = (teachers ?? []).map((t) => ({
        ...t,
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
      }))

      setRows(normalizedTeachers)
      computeNextTeacherId(normalizedTeachers)

      const { data: details, error: detailsError } = await supabase
        .from('subject_details')
        .select('*')
        .order('teacher_id', { ascending: true })
        .order('subject', { ascending: true })
        .order('day', { ascending: true })

      if (!alive) return

      // subject_details가 없거나 정책이 없으면 여기서 실패할 수 있음
      // → teachers만이라도 유지
      if (detailsError) {
        setSubjectTables({})
        detailNextIdRef.current = {}
        setIsLoading(false)
        return
      }

      const { tables, nextIds } = buildSubjectTables(details)
      setSubjectTables(tables)
      detailNextIdRef.current = nextIds

      setIsLoading(false)
    }

    loadAll()

    return () => {
      alive = false
    }
  }, [])

  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null
    return rows.find((r) => r.id === selectedTeacherId) ?? null
  }, [rows, selectedTeacherId])

  // ✅ 111.txt와 동일한 선택 핸들러 이름/동작
  const handleSelectSubject = (teacherId, subject) => {
    const isSame = selectedTeacherId === teacherId && selectedSubject === subject

    if (isSame) {
      setSelectedTeacherId(null)
      setSelectedSubject(null)
      return
    }

    setSelectedTeacherId(teacherId)
    setSelectedSubject(subject)
  }

  // ===== 강사 CRUD =====
  const [formMode, setFormMode] = useState('none') // none | create | edit
  const [editingRow, setEditingRow] = useState(null)

  const openCreate = () => {
    setFormMode('create')
    setEditingRow(null)
  }

  const openEdit = (row) => {
    setFormMode('edit')
    setEditingRow(row)
  }

  const closeForm = () => {
    setFormMode('none')
    setEditingRow(null)
  }

  const createRow = async (payload) => {
    try {
      const rawId = nextTeacherIdRef.current++
      const teacherId = normalizeTeacherId(rawId)

      const newRow = {
        id: teacherId,
        ...payload,
        subjects: Array.isArray(payload.subjects) ? payload.subjects : [],
      }

      // Supabase에 저장
      const { error } = await supabase.from('teachers').insert([newRow])

      if (error) {
        window.alert(`저장 실패: ${error.message}`)
        nextTeacherIdRef.current-- // ID 롤백
        return
      }

      // 변경 이력 기록
      await logAudit('teachers', teacherId, 'CREATE', null, newRow)

      setRows((prev) => [...prev, newRow])
      setSubjectTables((prev) => ({ ...prev, [teacherId]: {} }))
      detailNextIdRef.current[teacherId] = {}

      closeForm()
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  const updateRow = async (id, payload) => {
    try {
      // 변경 전 데이터 저장
      const oldRow = rows.find((r) => r.id === id)

      // Supabase에서 업데이트
      const { error } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', id)

      if (error) {
        window.alert(`수정 실패: ${error.message}`)
        return
      }

      // 변경 이력 기록
      const newRow = { ...oldRow, ...payload, id, subjects: Array.isArray(payload.subjects) ? payload.subjects : (oldRow.subjects ?? []) }
      await logAudit('teachers', id, 'UPDATE', oldRow, newRow)

      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...payload, id, subjects: Array.isArray(payload.subjects) ? payload.subjects : (r.subjects ?? []) }
            : r
        )
      )
      closeForm()
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  const deleteRow = async (id) => {
    const ok = window.confirm(`삭제하시겠습니까?\n- Id: ${id}`)
    if (!ok) return

    try {
      // 삭제 전 데이터 저장
      const oldRow = rows.find((r) => r.id === id)

      // Supabase에서 삭제
      const { error } = await supabase.from('teachers').delete().eq('id', id)

      if (error) {
        window.alert(`삭제 실패: ${error.message}`)
        return
      }

      // 변경 이력 기록
      await logAudit('teachers', id, 'DELETE', oldRow, null)

      setRows((prev) => prev.filter((r) => r.id !== id))

      setSubjectTables((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })

      const nextMap = { ...detailNextIdRef.current }
      delete nextMap[id]
      detailNextIdRef.current = nextMap

      if (selectedTeacherId === id) {
        setSelectedTeacherId(null)
        setSelectedSubject(null)
      }
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  // ===== 상세 CRUD =====
  const [detailFormMode, setDetailFormMode] = useState('none') // none | create | edit
  const [editingDetail, setEditingDetail] = useState(null)

  const openDetailCreate = () => {
    if (!selectedTeacherId || !selectedSubject) return
    setDetailFormMode('create')
    setEditingDetail(null)
  }

  const openDetailEdit = (detailRow) => {
    setDetailFormMode('edit')
    setEditingDetail(detailRow)
  }

  const closeDetailForm = () => {
    setDetailFormMode('none')
    setEditingDetail(null)
  }

  const createDetailRow = async (payload) => {
    if (!selectedTeacherId || !selectedSubject) return

    try {
      const detailData = {
        teacher_id: selectedTeacherId,
        subject: selectedSubject,
        ...payload,
      }

      // Supabase에 저장 (id는 자동 생성)
      const { data, error } = await supabase
        .from('subject_details')
        .insert([detailData])
        .select() // 생성된 id를 받기 위해 select() 호출

      if (error) {
        window.alert(`저장 실패: ${error.message}`)
        return
      }

      // Supabase에서 반환한 생성된 id 사용
      const savedDetail = data && data[0] ? data[0] : { id: Date.now(), ...detailData }

      // 변경 이력 기록
      await logAudit('subject_details', savedDetail.id, 'CREATE', null, savedDetail)

      setSubjectTables((prev) => {
        const teacherTables = prev[selectedTeacherId] ?? {}
        const current = teacherTables[selectedSubject] ?? []
        return {
          ...prev,
          [selectedTeacherId]: {
            ...teacherTables,
            [selectedSubject]: [savedDetail, ...current],
          },
        }
      })

      closeDetailForm()
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  const updateDetailRow = async (id, payload) => {
    if (!selectedTeacherId || !selectedSubject) return

    try {
      // 변경 전 데이터 저장
      const teacherTables = subjectTables[selectedTeacherId] ?? {}
      const current = teacherTables[selectedSubject] ?? []
      const oldDetail = current.find((r) => r.id === id)

      // Supabase에서 업데이트
      const { error } = await supabase
        .from('subject_details')
        .update(payload)
        .eq('id', id)

      if (error) {
        window.alert(`수정 실패: ${error.message}`)
        return
      }

      // 변경 이력 기록
      const newDetail = { ...oldDetail, ...payload, id }
      await logAudit('subject_details', id, 'UPDATE', oldDetail, newDetail)

      setSubjectTables((prev) => {
        const teacherTables = prev[selectedTeacherId] ?? {}
        const current = teacherTables[selectedSubject] ?? []
        const updated = current.map((r) => (r.id === id ? { ...r, ...payload, id } : r))
        return {
          ...prev,
          [selectedTeacherId]: {
            ...teacherTables,
            [selectedSubject]: updated,
          },
        }
      })

      closeDetailForm()
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  const deleteDetailRow = async (id) => {
    if (!selectedTeacherId || !selectedSubject) return

    const ok = window.confirm(
      `상세 행을 삭제하시겠습니까?\n- 강사: ${selectedTeacher?.name ?? ''}\n- 과목: ${selectedSubject}\n- RowId: ${id}`
    )
    if (!ok) return

    try {
      // 삭제 전 데이터 저장
      const teacherTables = subjectTables[selectedTeacherId] ?? {}
      const current = teacherTables[selectedSubject] ?? []
      const oldDetail = current.find((r) => r.id === id)

      // Supabase에서 삭제
      const { error } = await supabase.from('subject_details').delete().eq('id', id)

      if (error) {
        window.alert(`삭제 실패: ${error.message}`)
        return
      }

      // 변경 이력 기록
      await logAudit('subject_details', id, 'DELETE', oldDetail, null)

      setSubjectTables((prev) => {
        const teacherTables = prev[selectedTeacherId] ?? {}
        const current = teacherTables[selectedSubject] ?? []
        return {
          ...prev,
          [selectedTeacherId]: {
            ...teacherTables,
            [selectedSubject]: current.filter((r) => r.id !== id),
          },
        }
      })
    } catch (err) {
      window.alert(`오류 발생: ${err.message}`)
    }
  }

  // ===== 검색(이름/과목) =====
  const [searchMode, setSearchMode] = useState('name') // name | subject
  const [searchText, setSearchText] = useState('')

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return rows

    return rows.filter((r) => {
      if (searchMode === 'name') {
        return String(r.name ?? '').toLowerCase().includes(q)
      }
      const subjects = Array.isArray(r.subjects) ? r.subjects : []
      return subjects.some((s) => String(s).toLowerCase().includes(q))
    })
  }, [rows, searchMode, searchText])

  const clearSearch = () => setSearchText('')

  // ===== 강사 id 기준 오름차순 정렬 =====
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
  }, [filteredRows])

  // ===== 선택된 상세 rows (day 오름차순 정렬) =====
  const selectedDetailRows = useMemo(() => {
    if (!selectedTeacherId || !selectedSubject) return []
    const teacherTables = subjectTables[selectedTeacherId] ?? {}
    const list = teacherTables[selectedSubject] ?? []
    return [...list].sort((a, b) => parseInt(a.day, 10) - parseInt(b.day, 10))
  }, [subjectTables, selectedTeacherId, selectedSubject])

  return (
    <section className="table-section">
      <div className="page-header">
        <h2 className="section-title">Lecture Sheet</h2>

        <div className="page-actions">
          <div className="search-box">
            <select className="search-select" value={searchMode} onChange={(e) => setSearchMode(e.target.value)}>
              <option value="name">이름</option>
              <option value="subject">과목</option>
            </select>

            <input
              className="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={searchMode === 'name' ? '이름 검색' : '과목 검색'}
            />

            {searchText.trim().length > 0 && (
              <button type="button" className="search-clear" onClick={clearSearch}>
                초기화
              </button>
            )}
          </div>

          <button type="button" className="primary-btn" onClick={openCreate}>
            + 강사 추가
          </button>
        </div>
      </div>

      {isLoading && <p style={{ opacity: 0.7, margin: '0 0 12px 0' }}>Supabase에서 데이터를 불러오는 중...</p>}
      {loadError && (
        <p style={{ color: '#b91c1c', margin: '0 0 12px 0' }}>
          Supabase 로딩 실패: {String(loadError.message ?? loadError)}
        </p>
      )}

      <TeacherTable
        rows={sortedRows}
        selectedTeacherId={selectedTeacherId}
        selectedSubject={selectedSubject}
        onSelectSubject={handleSelectSubject}
        onEdit={openEdit}
        onDelete={deleteRow}
      />

      {formMode !== 'none' && (
        <TeacherForm mode={formMode} initialValue={editingRow} onCancel={closeForm} onCreate={createRow} onUpdate={updateRow} />
      )}

      <SubjectDetailTable
        teacherName={selectedTeacher?.name ?? ''}
        selectedTeacherId={selectedTeacherId}
        selectedSubject={selectedSubject}
        rows={selectedDetailRows}
        onCreate={openDetailCreate}
        onEdit={openDetailEdit}
        onDelete={deleteDetailRow}
      />

      {detailFormMode !== 'none' && (
        <DetailForm
          mode={detailFormMode}
          teacherName={selectedTeacher?.name ?? ''}
          subject={selectedSubject}
          initialValue={editingDetail}
          onCancel={closeDetailForm}
          onCreate={createDetailRow}
          onUpdate={updateDetailRow}
        />
      )}
    </section>
  )
}

export default DataTablePage
