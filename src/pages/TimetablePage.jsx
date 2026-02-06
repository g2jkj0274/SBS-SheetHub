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

function TimetablePage() {
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
    const startTimeStr = `${String(startTime).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
    const endTimeStr = `${String(endTime).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
    
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
      subroom_index: parseInt(subroom),
      created_at: new Date().toISOString(),
    }
    try {
      const { data, error } = await supabase.from('timetables').insert(payload).select()
      if (error) {
        console.error('Insert error', error)
        return
      }
      // append to local state
      setEntries((prev) => [...prev, ...(data || [])])
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
      setShowForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  // no-op: weekday selection handled by radio preset `weekdayPreset`

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
          <button type="button" onClick={() => setShowForm((s) => !s)} className="add-lecture-btn">
            {showForm ? '등록 닫기' : '강의 추가'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{month}월 강의 추가</h3>
            <form onSubmit={handleSubmit} className="lecture-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">과목명</label>
                  <input id="subject" placeholder="과목명" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="classroom">강의장</label>
                  <select id="classroom" value={classroom} onChange={(e) => {setClassroom(e.target.value); setSubroom('0')}} required>
                    {ROOMS.map((room) => (
                      <option key={room.name} value={room.name}>{room.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subroom">세부강의장</label>
                  <select id="subroom" value={subroom} onChange={(e) => setSubroom(e.target.value)} required>
                    {ROOMS.find(r => r.name === classroom)?.subs.map((s, idx) => (
                      <option key={idx} value={idx}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="instructor">강사명</label>
                  <input id="instructor" placeholder="강사명" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <fieldset className="form-group fieldset-weekday">
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
                  <input id="note" placeholder="비고" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>

              <div className="form-row form-actions">
                <button type="submit" className="btn-submit">등록</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">취소</button>
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
                            return (
                              <td key={ci} className="slot-cell" rowSpan={startMap.span} style={{ background: '#e6f4ff', fontWeight:700 }}>
                                <div>{startMap.entry.subject}</div>
                                <div style={{ fontSize: 12 }}>{startMap.entry.instructor}</div>
                                <div style={{ fontSize: 11, color: '#555' }}>{startMap.entry.classroom}</div>
                                <div style={{ fontSize: 11, color: '#555' }}>{weekdayStr}</div>
                                {startMap.entry.note && <div style={{ fontSize: 11, color: '#555' }}>{startMap.entry.note}</div>}
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
