import React, { useMemo, useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import '../styles/timetable.css'

const ROOMS = [
  { name: 'A강의장', subs: ['A-1', 'A-2', 'A-3'] },
  { name: 'B강의장', subs: ['B-1', 'B-2', 'B-3'] },
  { name: 'C강의장', subs: ['C-1', 'C-2', 'C-3'] },
  { name: 'D강의장', subs: ['D-1', 'D-2', 'D-3'] },
  { name: 'E강의장', subs: ['E-1', 'E-2', 'E-3'] },
  { name: 'F강의장', subs: ['F-1', 'F-2', 'F-3'] },
  { name: 'G강의장', subs: ['G-1', 'G-2', 'G-3'] },
  { name: 'H강의장', subs: ['H-1', 'H-2', 'H-3'] },
  { name: 'I강의장', subs: ['I-1', 'I-2', 'I-3'] },
  { name: 'GH강의장', subs: ['GH-1', 'GH-2', 'GH-3'] },
]

function formatTime(h, m) {
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${hh}:${mm}`
}

function generateTimes(startHour = 9, endHour = 22, stepMinutes = 30) {
  const times = []
  let hour = startHour
  let minute = 0
  while (hour < endHour || (hour === endHour && minute === 0)) {
    times.push(formatTime(hour, minute))
    minute += stepMinutes
    if (minute >= 60) {
      minute -= 60
      hour += 1
    }
  }
  return times
}

function getDaysInMonth(year, month) {
  const days = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function TimetablePage({ user }) {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [dayType, setDayType] = useState(null) // 'weekday' | 'weekend' | null

  const times = useMemo(() => generateTimes(9, 22, 30), [])

  const [entries, setEntries] = useState([])

  // form state
  const [subject, setSubject] = useState('')
  // weekday presets: monThu (월~목), monWed (월,수), tueThu (화,목), fri (금)
  const [weekdayPreset, setWeekdayPreset] = useState('monThu')
  const PRESETS = {
    monThu: [1, 2, 3, 4],
    monWed: [1, 3],
    tueThu: [2, 4],
    fri: [5],
    satSun: [6, 0],
  }
  const [instructor, setInstructor] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('09')
  const [startMinute, setStartMinute] = useState('00')
  const [endTime, setEndTime] = useState('10')
  const [endMinute, setEndMinute] = useState('30')
  const [note, setNote] = useState('')
  const [classroom, setClassroom] = useState('A강의장')
  const [subroom, setSubroom] = useState('0')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null) // 수정 중인 강의의 ID

  // load entries from Supabase
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data, error } = await supabase.from('timetables').select('*')
        if (error) {
          console.error('Supabase load error', error)
          return
        }
        if (mounted) setEntries(data || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const totalSubrooms = ROOMS.reduce((acc, r) => acc + r.subs.length, 0)

  // 강의장 이름으로 해당 강의장의 시작 subroom 인덱스 구하기
  function getRoomStartIndex(roomName) {
    let idx = 0
    for (const room of ROOMS) {
      if (room.name === roomName) return idx
      idx += room.subs.length
    }
    return 0 // 기본값
  }

  const allDays = useMemo(() => getDaysInMonth(year, month), [year, month])
  const filteredDays = useMemo(() => {
    if (!dayType) return []
    return allDays.filter((d) => {
      const dow = d.getDay() // 0 Sun .. 6 Sat
      if (dayType === 'weekday') return dow >= 1 && dow <= 5
      return dow === 0 || dow === 6
    })
  }, [allDays, dayType])

  const firstDayOfMonth = allDays[0]
  const lastDayOfMonth = allDays[allDays.length - 1]

  function entryAppliesToView(entry) {
    // entry.weekdays expected as array of numbers 0-6
    const wk = entry.weekdays || entry.week_day || []
    const days = Array.isArray(wk) ? wk : []
    // dayType filter
    const hasMatch = days.some((d) => (dayType === 'weekday' ? d >= 1 && d <= 5 : d === 0 || d === 6))
    if (!hasMatch) return false
    // date overlap
    const s = new Date(entry.start_date)
    const e = new Date(entry.end_date)
    if (isNaN(s) || isNaN(e)) return false
    return !(e < firstDayOfMonth || s > lastDayOfMonth)
  }

  const entriesForView = useMemo(() => entries.filter(entryAppliesToView), [entries, dayType, month])

  async function handleSubmit(e) {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!subject.trim()) {
      alert('과목명을 입력해주세요.')
      return
    }
    if (!classroom) {
      alert('강의장을 선택해주세요.')
      return
    }
    if (!subroom) {
      alert('세부강의장을 선택해주세요.')
      return
    }
    if (!startDate) {
      alert('개강일을 입력해주세요.')
      return
    }
    if (!endDate) {
      alert('종강일을 입력해주세요.')
      return
    }
    if (!startTime || startTime === '') {
      alert('시작 시간을 입력해주세요.')
      return
    }
    if (!endTime || endTime === '') {
      alert('종료 시간을 입력해주세요.')
      return
    }
    
    const startTimeStr = `${String(startTime).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
    const endTimeStr = `${String(endTime).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
    
    // 시간 충돌 검사 (요일과 시간 모두 고려)
    const subroomIdx = parseInt(subroom)
    const newWeekdays = PRESETS[weekdayPreset]
    const conflicts = entries.filter(e => {
      // 수정 중인 강의는 제외 (id 타입 변환하여 비교)
      if (editingId && (e.id === editingId || String(e.id) === String(editingId))) return false
      if (e.classroom !== classroom || e.subroom_index !== subroomIdx) return false
      
      // 요일이 겹치는지 확인
      const existingWeekdays = e.weekdays || []
      const weekdayOverlap = newWeekdays.some(d => existingWeekdays.includes(d))
      if (!weekdayOverlap) return false
      
      // 요일이 겹치면 시간도 확인
      return startTimeStr < e.end_time && endTimeStr > e.start_time
    })
    
    if (conflicts.length > 0) {
      const subName = ROOMS.find(r => r.name === classroom)?.subs[subroomIdx]
      alert(`${classroom} ${subName}에서 같은 요일의 겹치는 시간대에 강의가 이미 존재합니다.\n기존 강의: ${conflicts[0].subject} (${conflicts[0].start_time}~${conflicts[0].end_time})`)
      return
    }
    
    const payload = {
      subject,
      weekdays: PRESETS[weekdayPreset],
      instructor,
      start_date: startDate,
      end_date: endDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
      note,
      classroom,
      subroom_index: subroomIdx,
    }
    
    try {
      let data, error
      if (editingId) {
        // 수정 모드
        const result = await supabase.from('timetables').update(payload).eq('id', editingId).select()
        data = result.data
        error = result.error
        if (error) {
          console.error('Update error', error)
          alert('강의 수정에 실패했습니다: ' + error.message)
          return
        }
        // local state 업데이트
        setEntries((prev) => prev.map(e => e.id === editingId ? data[0] : e))
        alert('강의가 수정되었습니다.')
      } else {
        // 신규 등록 모드
        const result = await supabase.from('timetables').insert({ ...payload, created_at: new Date().toISOString() }).select()
        data = result.data
        error = result.error
        if (error) {
          console.error('Insert error', error)
          alert('강의 등록에 실패했습니다: ' + error.message)
          return
        }
        // append to local state
        setEntries((prev) => [...prev, ...(data || [])])
        alert('강의가 등록되었습니다.')
      }
      // clear form
      setSubject('')
      setInstructor('')
      setStartDate('')
      setEndDate('')
      setStartTime('09')
      setStartMinute('00')
      setEndTime('10')
      setEndMinute('30')
      setNote('')
      setClassroom('A강의장')
      setSubroom('0')
      setWeekdayPreset('monThu')
      setEditingId(null)
      setShowForm(false)
      alert('강의가 등록되었습니다.')
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다: ' + err.message)
    }
  }

  // no-op: weekday selection handled by radio preset `weekdayPreset`

  function handleCancel() {
    if (subject || instructor || startDate || endDate || note) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        setShowForm(false)
        setEditingId(null)
        // form state 초기화
        setSubject('')
        setInstructor('')
        setStartDate('')
        setEndDate('')
        setStartTime('09')
        setStartMinute('00')
        setEndTime('10')
        setEndMinute('30')
        setNote('')
        setClassroom('A강의장')
        setSubroom('0')
        setWeekdayPreset('monThu')
      }
    } else {
      setShowForm(false)
      setEditingId(null)
    }
  }

  function handleEdit(entry) {
    // 로그인하지 않은 사용자는 인증 필요
    if (!user) {
      alert('로그인이 필요합니다. Header에서 로그인해주세요.')
      return
    }
    
    if (!entry || !entry.id) {
      alert('강의 정보를 불러올 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.')
      return
    }
    setSubject(entry.subject)
    setInstructor(entry.instructor || '')
    setStartDate(entry.start_date)
    setEndDate(entry.end_date)
    const [startH, startM] = entry.start_time.split(':')
    setStartTime(startH)
    setStartMinute(startM)
    const [endH, endM] = entry.end_time.split(':')
    setEndTime(endH)
    setEndMinute(endM)
    setNote(entry.note || '')
    setClassroom(entry.classroom)
    setSubroom(String(entry.subroom_index || 0))
    // weekday preset 역계산
    const weekdays = entry.weekdays || []
    if (JSON.stringify(weekdays) === JSON.stringify([1,2,3,4])) setWeekdayPreset('monThu')
    else if (JSON.stringify(weekdays) === JSON.stringify([1,3])) setWeekdayPreset('monWed')
    else if (JSON.stringify(weekdays) === JSON.stringify([2,4])) setWeekdayPreset('tueThu')
    else if (JSON.stringify(weekdays) === JSON.stringify([5])) setWeekdayPreset('fri')
    else if (JSON.stringify(weekdays) === JSON.stringify([6,0]) || JSON.stringify(weekdays) === JSON.stringify([0,6])) setWeekdayPreset('satSun')
    // id를 명시적으로 설정
    const idToSet = entry.id
    setEditingId(idToSet)
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('이 강의를 삭제하시겠습니까?')) {
      return
    }
    try {
      const { error } = await supabase.from('timetables').delete().eq('id', id)
      if (error) {
        console.error('Delete error', error)
        alert('강의 삭제에 실패했습니다: ' + error.message)
        return
      }
      setEntries((prev) => prev.filter(e => e.id !== id))
      // 모달 닫기 및 폼 초기화
      setShowForm(false)
      setEditingId(null)
      setSubject('')
      setInstructor('')
      setStartDate('')
      setEndDate('')
      setStartTime('09')
      setStartMinute('00')
      setEndTime('10')
      setEndMinute('30')
      setNote('')
      setClassroom('A강의장')
      setSubroom('0')
      setWeekdayPreset('monThu')
      alert('강의가 삭제되었습니다.')
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다: ' + err.message)
    }
  }

  return (
    <main className="app-container timetable-page">
      <h2>Timetable</h2>

      <div className="timetable-controls">
        <div className="timetable-controls-left">
          <span style={{ marginRight: 8 }}>월:</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ marginLeft: 8 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>{i + 1}월</option>
            ))}
          </select>

          <span style={{ marginLeft: 16 }}>구분: </span>
          <button
            className={dayType === 'weekday' ? 'active' : ''}
            onClick={() => setDayType('weekday')}
          >
            평일
          </button>
          <button
            className={dayType === 'weekend' ? 'active' : ''}
            onClick={() => setDayType('weekend')}
          >
            주말
          </button>
        </div>

        <div className="timetable-controls-right">
          {user ? (
            <button type="button" onClick={() => setShowForm((s) => !s)} className="add-lecture-btn">
              {showForm ? '등록 닫기' : '강의 추가'}
            </button>
          ) : (
            <div className="login-required-msg">로그인 후 강의를 추가할 수 있습니다</div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editingId ? '강의 수정' : `${month}월 강의 추가`}</h3>
            <form onSubmit={handleSubmit} className="lecture-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="subject">과목명</label>
                  <input id="subject" placeholder="과목명" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="classroom">강의장</label>
                  <select id="classroom" value={classroom} onChange={(e) => {setClassroom(e.target.value); setSubroom('0')}}>
                    {ROOMS.map((room) => (
                      <option key={room.name} value={room.name}>{room.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="subroom">세부강의장</label>
                  <select id="subroom" value={subroom} onChange={(e) => setSubroom(e.target.value)}>
                    {ROOMS.find(r => r.name === classroom)?.subs.map((s, idx) => (
                      <option key={idx} value={idx}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="instructor">강사명</label>
                  <input id="instructor" placeholder="강사명" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <fieldset className="form-group fieldset-weekday full-width">
                  <legend>요일</legend>
                  <div className="radio-group">
                    <label><input type="radio" name="preset" checked={weekdayPreset === 'monThu'} onChange={() => setWeekdayPreset('monThu')} /> 월~목</label>
                    <label><input type="radio" name="preset" checked={weekdayPreset === 'monWed'} onChange={() => setWeekdayPreset('monWed')} /> 월,수</label>
                    <label><input type="radio" name="preset" checked={weekdayPreset === 'tueThu'} onChange={() => setWeekdayPreset('tueThu')} /> 화,목</label>
                    <label><input type="radio" name="preset" checked={weekdayPreset === 'fri'} onChange={() => setWeekdayPreset('fri')} /> 금</label>
                    <label><input type="radio" name="preset" checked={weekdayPreset === 'satSun'} onChange={() => setWeekdayPreset('satSun')} /> 토,일</label>
                  </div>
                </fieldset>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">개강일</label>
                  <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">종강일</label>
                  <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">시작 시간</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input id="startTime" type="number" min="0" max="23" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={{ width: '60px' }} />
                    <span>:</span>
                    <input type="number" min="0" max="59" value={startMinute} onChange={(e) => setStartMinute(e.target.value)} required style={{ width: '60px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">종료 시간</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input id="endTime" type="number" min="0" max="23" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={{ width: '60px' }} />
                    <span>:</span>
                    <input type="number" min="0" max="59" value={endMinute} onChange={(e) => setEndMinute(e.target.value)} required style={{ width: '60px' }} />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="note">비고</label>
                  <textarea id="note" placeholder="비고 (여러 줄 입력 가능)" value={note} onChange={(e) => setNote(e.target.value)} rows={4} style={{ fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>

              <div className="form-row form-actions">
                <button type="submit" className="btn-submit">{editingId ? '수정' : '등록'}</button>
                <button type="button" onClick={handleCancel} className="btn-cancel">취소</button>
                {editingId && (
                  <button type="button" onClick={() => handleDelete(editingId)} className="btn-delete">삭제</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {!dayType ? (
        <p className="muted">월과 구분(평일/주말)을 선택하면 해당 월의 시간표가 표시됩니다.</p>
      ) : (
        <div className="timetable-monthly">
          <h4 style={{ marginBottom: 8 }}>{year}년 {month}월 — {dayType === 'weekday' ? '평일' : '주말'} 시간표</h4>
          <div className="timetable-wrap">
            <table className="timetable-table">
              <thead>
                <tr>
                  <th className="time-col" rowSpan={2}>시간</th>
                  {ROOMS.map((room) => (
                    <th key={room.name} colSpan={room.subs.length} className="room-col">
                      {room.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {ROOMS.flatMap((room) => room.subs.map((s) => (
                    <th key={room.name + s} className="subroom-col">{s}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const occupied = new Set()
                  const mapped = entriesForView.map((en) => {
                    const si = times.indexOf(en.start_time)
                    const ei = times.indexOf(en.end_time)
                    const span = Math.max(1, (ei === -1 || si === -1) ? 1 : Math.max(1, ei - si))
                    const roomIndex = getRoomStartIndex(en.classroom)
                    const subroomOffset = en.subroom_index || 0
                    const columnIndex = roomIndex + subroomOffset
                    return { entry: en, si, span, columnIndex }
                  }).filter(m => m.si >= 0)

                  const rows = []
                  for (let ri = 0; ri < times.length; ri++) {
                    const time = times[ri]
                    // 이 시간에 시작하는 모든 강의들
                    const startsAtThisTime = mapped.filter(m => m.si === ri)
                    rows.push(
                      <tr key={time}>
                        <td className="time-cell">{time}</td>
                        {Array.from({ length: totalSubrooms }).map((_, ci) => {
                          // 이 시간과 이 강의실 위치에서 시작하는 강의 찾기
                          const startMap = startsAtThisTime.find(m => m.columnIndex === ci)
                          if (startMap) {
                            for (let k = 1; k < startMap.span; k++) {
                              occupied.add(`${startMap.columnIndex}-${ri + k}`)
                            }
                            const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
                            const weekdayStr = startMap.entry.weekdays?.map(d => weekdayLabels[d]).join(',') || ''
                            
                            // subroom_index에 따른 색상 결정
                            const subroomIndex = startMap.entry.subroom_index || 0
                            const subroomColors = ['#0085CD', '#F6AB00', '#10B981']
                            const bgColor = subroomColors[subroomIndex] || '#0085CD'
                            const bgGradient = `linear-gradient(135deg, ${bgColor}20 0%, ${bgColor}10 100%)`
                            const borderColor = bgColor
                            
                            return (
                              <td key={ci} className="slot-cell slot-cell-lecture" rowSpan={startMap.span} onClick={() => handleEdit(startMap.entry)} style={{ background: bgGradient, borderColor: borderColor, borderLeftColor: bgColor, cursor: 'pointer' }}>
                                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13, color: '#1f2937' }}>{startMap.entry.subject}</div>
                                <div style={{ fontSize: 11, marginBottom: 3 }}>
                                  <span style={{ fontWeight: 600, color: bgColor }}>
                                    {startMap.entry.start_time}~{startMap.entry.end_time}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, marginBottom: 2, color: '#374151' }}>{startMap.entry.instructor}</div>
                                <div style={{ fontSize: 11, color: bgColor, marginBottom: 2, fontWeight: 500 }}>{startMap.entry.classroom}</div>
                                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{weekdayStr}</div>
                                <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>
                                  {startMap.entry.start_date} ~ {startMap.entry.end_date}
                                </div>
                                {startMap.entry.note && <div style={{ fontSize: 11, color: '#dc2626', fontStyle: 'italic', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{startMap.entry.note}</div>}
                              </td>
                            )
                          }
                          if (occupied.has(`${ci}-${ri}`)) return null
                          return <td key={ci} className="slot-cell" />
                        })}
                      </tr>
                    )
                  }
                  return rows
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

export default TimetablePage
