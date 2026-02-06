import React, { useMemo, useState } from 'react'
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

function TimetablePage() {
  const [mode, setMode] = useState(null) // 'weekday' | 'weekend' | null

  const times = useMemo(() => generateTimes(9, 22, 30), [])

  const totalSubrooms = ROOMS.reduce((acc, r) => acc + r.subs.length, 0)

  return (
    <main className="app-container timetable-page">
      <h2>Timetable</h2>

      <div className="timetable-controls">
        <span>표시 타입: </span>
        <button
          className={mode === 'weekday' ? 'active' : ''}
          onClick={() => setMode('weekday')}
        >
          평일
        </button>
        <button
          className={mode === 'weekend' ? 'active' : ''}
          onClick={() => setMode('weekend')}
        >
          주말
        </button>
      </div>

      {mode ? (
        <div className="timetable-wrap">
          <table className="timetable-table">
            <thead>
              <tr>
                <th className="time-col" rowSpan={2}>
                  시간
                </th>
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
              {times.map((t) => (
                <tr key={t}>
                  <td className="time-cell">{t}</td>
                  {Array.from({ length: totalSubrooms }).map((_, i) => (
                    <td key={i} className="slot-cell" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">평일 또는 주말을 선택하면 시간표가 표시됩니다.</p>
      )}
    </main>
  )
}

export default TimetablePage
