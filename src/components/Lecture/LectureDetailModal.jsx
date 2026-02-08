import React, { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import '../../styles/lecture-detail.css'

function LectureDetailModal({ lecture, user, onClose, onEditClick }) {
  const [enrollments, setEnrollments] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [attendance, setAttendance] = useState([]) // attendance 데이터
  const [attendanceDates, setAttendanceDates] = useState([]) // 출석 날짜 목록
  const [activeTab, setActiveTab] = useState('info') // 'info' or 'attendance'
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState('')
  const [enrollMode, setEnrollMode] = useState('select') // 'select' or 'new'
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    mentor: ''
  })
  const [newDate, setNewDate] = useState('') // 새 출석 날짜
  const [savingAttendance, setSavingAttendance] = useState(false)

  useEffect(() => {
    if (!lecture) return
    
    const fetchEnrollments = async () => {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('*, students(*)')
          .eq('lecture_id', lecture.id)
        
        if (error) {
          console.error('Enrollment fetch error:', error)
          return
        }
        
        setEnrollments(data || [])
      } catch (err) {
        console.error('Error fetching enrollments:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchAllStudents = async () => {
      try {
        setLoadingStudents(true)
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true })
        
        if (error) {
          console.error('Students fetch error:', error)
          return
        }
        
        setAllStudents(data || [])
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoadingStudents(false)
      }
    }

    const fetchAttendance = async () => {
      try {
        // enrollments를 통해 lecture_id로 필터링
        const { data: enrollmentsData, error: enrollError } = await supabase
          .from('enrollments')
          .select('id')
          .eq('lecture_id', lecture.id)
        
        if (enrollError) {
          console.error('Enrollment fetch error:', enrollError)
          return
        }

        const enrollmentIds = enrollmentsData.map(e => e.id)

        if (enrollmentIds.length === 0) {
          setAttendance([])
          setAttendanceDates([])
          return
        }

        // enrollment_id로 attendance 데이터 조회
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .in('enrollment_id', enrollmentIds)
        
        if (attendanceError) {
          console.error('Attendance fetch error:', attendanceError)
          return
        }

        setAttendance(attendanceData || [])

        // 고유한 출석 날짜 추출 및 정렬
        const dates = [...new Set((attendanceData || []).map(a => a.attendance_date))]
        dates.sort()
        setAttendanceDates(dates)
      } catch (err) {
        console.error('Error fetching attendance:', err)
      }
    }

    fetchEnrollments()
    fetchAllStudents()
    fetchAttendance()
  }, [lecture])

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      setEnrollMessage('학생을 선택해주세요.')
      return
    }

    // 이미 등록된 학생인지 확인
    if (enrollments.some(e => String(e.student_id) === String(selectedStudentId))) {
      setEnrollMessage('이미 등록된 학생입니다.')
      return
    }

    try {
      setEnrolling(true)
      const { error } = await supabase
        .from('enrollments')
        .insert([
          {
            lecture_id: lecture.id,
            student_id: selectedStudentId
          }
        ])
      
      if (error) {
        console.error('Enrollment error:', error)
        setEnrollMessage('등록 실패: ' + error.message)
        return
      }

      // 등록 후 enrollments 다시 로드
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*, students(*)')
        .eq('lecture_id', lecture.id)
      
      if (!fetchError) {
        setEnrollments(data || [])
      }

      setSelectedStudentId('')
      setEnrollMessage('학생이 등록되었습니다!')
      setTimeout(() => setEnrollMessage(''), 3000)
    } catch (err) {
      console.error('Error enrolling student:', err)
      setEnrollMessage('등록 중 오류가 발생했습니다.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenrollStudent = async (enrollmentId) => {
    if (!window.confirm('정말 이 학생을 등록 취소하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)
      
      if (error) {
        console.error('Unenroll error:', error)
        alert('등록 취소 실패: ' + error.message)
        return
      }

      // 등록 취소 후 enrollments 다시 로드
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*, students(*)')
        .eq('lecture_id', lecture.id)
      
      if (!fetchError) {
        setEnrollments(data || [])
      }

      setEnrollMessage('학생이 제거되었습니다.')
      setTimeout(() => setEnrollMessage(''), 3000)
    } catch (err) {
      console.error('Error unenrolling student:', err)
      alert('등록 취소 중 오류가 발생했습니다.')
    }
  }

  const handleAddNewStudent = async () => {
    // 검증
    if (!newStudentForm.name.trim()) {
      setEnrollMessage('학생 이름을 입력해주세요.')
      return
    }

    try {
      setEnrolling(true)
      
      // 1. students 테이블에 새 학생 추가
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert([
          {
            name: newStudentForm.name.trim(),
            age: newStudentForm.age ? parseInt(newStudentForm.age) : null,
            gender: newStudentForm.gender || null,
            phone: newStudentForm.phone || null,
            mentor: newStudentForm.mentor || null
          }
        ])
        .select()
      
      if (insertError) {
        console.error('Student creation error:', insertError)
        setEnrollMessage('학생 생성 실패: ' + insertError.message)
        return
      }

      if (!newStudent || newStudent.length === 0) {
        setEnrollMessage('학생 생성 실패')
        return
      }

      const createdStudent = newStudent[0]

      // 2. enrollments 테이블에 등록
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([
          {
            lecture_id: lecture.id,
            student_id: createdStudent.id
          }
        ])
      
      if (enrollError) {
        console.error('Enrollment error:', enrollError)
        setEnrollMessage('등록 실패: ' + enrollError.message)
        return
      }

      // 3. enrollments 다시 로드
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*, students(*)')
        .eq('lecture_id', lecture.id)
      
      if (!fetchError) {
        setEnrollments(data || [])
      }

      // 4. students 목록 다시 로드
      const { data: students, error: fetchStudentsError } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchStudentsError) {
        setAllStudents(students || [])
      }

      // 폼 초기화
      setNewStudentForm({
        name: '',
        age: '',
        gender: '',
        phone: '',
        mentor: ''
      })
      setEnrollMode('select')
      setEnrollMessage('새 학생이 등록되었습니다!')
      setTimeout(() => setEnrollMessage(''), 3000)
    } catch (err) {
      console.error('Error adding new student:', err)
      setEnrollMessage('오류가 발생했습니다.')
    } finally {
      setEnrolling(false)
    }
  }

  const resetNewStudentForm = () => {
    setNewStudentForm({
      name: '',
      age: '',
      gender: '',
      phone: '',
      mentor: ''
    })
    setEnrollMode('select')
  }

  // 출석 날짜 추가
  const handleAddDate = async () => {
    if (!newDate) {
      alert('날짜를 선택해주세요.')
      return
    }

    // 이미 추가된 날짜인지 확인
    if (attendanceDates.includes(newDate)) {
      alert('이미 추가된 날짜입니다.')
      return
    }

    try {
      setSavingAttendance(true)

      // 각 enrollment에 대해 attendance 레코드 생성
      const attendanceRecords = enrollments.map(enrollment => ({
        enrollment_id: enrollment.id,
        attendance_date: newDate,
        status: null // 기본값은 null ('-'로 표시)
      }))

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
      
      if (error) {
        console.error('Date insert error:', error)
        alert('날짜 추가 실패: ' + error.message)
        return
      }

      // 로컬 상태 업데이트
      const updatedDates = [...attendanceDates, newDate]
      updatedDates.sort()
      setAttendanceDates(updatedDates)

      // 새로 추가한 레코드들을 attendance 상태에 추가
      const newRecords = attendanceRecords.map(record => ({
        ...record,
        id: undefined // Supabase에서 자동 생성됨
      }))
      setAttendance([...attendance, ...newRecords])

      setNewDate('')
      alert('날짜가 추가되었습니다.')
    } catch (err) {
      console.error('Error adding date:', err)
      alert('오류가 발생했습니다.')
    } finally {
      setSavingAttendance(false)
    }
  }

  // 출석 날짜 삭제
  const handleRemoveDate = (date) => {
    if (!window.confirm(`${date} 날짜를 삭제하시겠습니까?`)) {
      return
    }

    // 해당 날짜의 모든 attendance 데이터 삭제
    const newAttendance = attendance.filter(a => a.attendance_date !== date)
    setAttendance(newAttendance)
    setAttendanceDates(attendanceDates.filter(d => d !== date))

    // 비동기로 DB에서 삭제
    ;(async () => {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('attendance_date', date)
        .in('enrollment_id', enrollments.map(e => e.id))
      
      if (error) {
        console.error('Delete attendance error:', error)
        alert('삭제 실패: ' + error.message)
      }
    })()
  }

  // 출석 상태 변경
  const handleAttendanceChange = async (enrollmentId, date, newStatus) => {
    try {
      setSavingAttendance(true)

      // 빈 값은 null로 변환
      const statusToSave = newStatus === '' ? null : newStatus

      // 기존 레코드 확인
      const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('enrollment_id', enrollmentId)
        .eq('attendance_date', date)
      
      if (checkError) {
        console.error('Check attendance error:', checkError)
        alert('오류가 발생했습니다.')
        return
      }

      if (existing && existing.length > 0) {
        // 기존 레코드 업데이트
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ status: statusToSave })
          .eq('enrollment_id', enrollmentId)
          .eq('attendance_date', date)
        
        if (updateError) {
          console.error('Update attendance error:', updateError)
          alert('업데이트 실패: ' + updateError.message)
          return
        }
      } else {
        // 새 레코드 생성
        const { error: insertError } = await supabase
          .from('attendance')
          .insert([
            {
              enrollment_id: enrollmentId,
              attendance_date: date,
              status: statusToSave
            }
          ])
        
        if (insertError) {
          console.error('Insert attendance error:', insertError)
          alert('저장 실패: ' + insertError.message)
          return
        }
      }

      // 로컬 상태 업데이트
      const existingIndex = attendance.findIndex(
        a => a.enrollment_id === enrollmentId && a.attendance_date === date
      )

      if (existingIndex >= 0) {
        const newAttendance = [...attendance]
        newAttendance[existingIndex].status = statusToSave
        setAttendance(newAttendance)
      } else {
        setAttendance([...attendance, {
          enrollment_id: enrollmentId,
          attendance_date: date,
          status: statusToSave
        }])
      }
    } catch (err) {
      console.error('Error updating attendance:', err)
      alert('오류가 발생했습니다.')
    } finally {
      setSavingAttendance(false)
    }
  }

  // 특정 enrollment과 date에 대한 attendance 상태 조회
  const getAttendanceStatus = (enrollmentId, date) => {
    const record = attendance.find(
      a => a.enrollment_id === enrollmentId && a.attendance_date === date
    )
    // null이면 빈 문자열 반환 (select의 value와 맞추기 위함)
    return record?.status || ''
  }

  // 이미 등록된 학생 ID 목록
  const enrolledStudentIds = new Set(enrollments.map(e => String(e.student_id)))
  
  // 등록되지 않은 학생들만 필터링
  const availableStudents = allStudents.filter(s => !enrolledStudentIds.has(String(s.id)))

  if (!lecture) return null

  // 요일 번호를 한글로 변환
  const weekdayNames = {
    0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토'
  }
  
  const weekdaysDisplay = (lecture.weekdays || [])
    .map(d => weekdayNames[d])
    .join(', ')

  return (
    <div className="lecture-detail-overlay" onClick={onClose}>
      <div className="lecture-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lecture-detail-header">
          <h2>{lecture.subject}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="lecture-detail-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            강의 정보
          </button>
          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            수강 현황
          </button>
        </div>

        {/* Content */}
        <div className="lecture-detail-content">
          {activeTab === 'info' ? (
            <div className="info-tab">
              <div className="info-row">
                <label>강의실:</label>
                <span>{lecture.classroom}</span>
              </div>
              <div className="info-row">
                <label>강사:</label>
                <span>{lecture.instructor || '-'}</span>
              </div>
              <div className="info-row">
                <label>요일:</label>
                <span>{weekdaysDisplay || '-'}</span>
              </div>
              <div className="info-row">
                <label>시간:</label>
                <span>{lecture.start_time} ~ {lecture.end_time}</span>
              </div>
              <div className="info-row">
                <label>기간:</label>
                <span>{lecture.start_date} ~ {lecture.end_date}</span>
              </div>
              {lecture.note && (
                <div className="info-row">
                  <label>노트:</label>
                  <span className="note-text">{lecture.note}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="attendance-tab">
              {/* 학생 등록 폼 */}
              <div className="enroll-form">
                <h4>학생 등록</h4>
                
                {/* 모드 선택 탭 */}
                <div className="enroll-mode-tabs">
                  <button
                    className={`mode-tab ${enrollMode === 'select' ? 'active' : ''}`}
                    onClick={() => {
                      setEnrollMode('select')
                      setEnrollMessage('')
                    }}
                  >
                    기존 학생 선택
                  </button>
                  <button
                    className={`mode-tab ${enrollMode === 'new' ? 'active' : ''}`}
                    onClick={() => {
                      setEnrollMode('new')
                      setEnrollMessage('')
                    }}
                  >
                    새 학생 추가
                  </button>
                </div>

                {/* 기존 학생 선택 모드 */}
                {enrollMode === 'select' && (
                  <div className="enroll-mode-content">
                    <div className="enroll-form-row">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        disabled={enrolling || loadingStudents}
                        className="student-select"
                      >
                        <option value="">학생 선택...</option>
                        {availableStudents.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleEnrollStudent}
                        disabled={enrolling || loadingStudents}
                        className="btn-enroll"
                      >
                        {enrolling ? '등록 중...' : '등록'}
                      </button>
                    </div>
                    {availableStudents.length === 0 && allStudents.length > 0 && (
                      <div className="no-available">모든 학생이 이미 등록되었습니다.</div>
                    )}
                  </div>
                )}

                {/* 새 학생 추가 모드 */}
                {enrollMode === 'new' && (
                  <div className="enroll-mode-content">
                    <div className="new-student-form">
                      <input
                        type="text"
                        placeholder="이름 (필수)"
                        value={newStudentForm.name}
                        onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})}
                        disabled={enrolling}
                        className="form-input"
                      />
                      <input
                        type="number"
                        placeholder="나이"
                        value={newStudentForm.age}
                        onChange={(e) => setNewStudentForm({...newStudentForm, age: e.target.value})}
                        disabled={enrolling}
                        className="form-input"
                      />
                      <select
                        value={newStudentForm.gender}
                        onChange={(e) => setNewStudentForm({...newStudentForm, gender: e.target.value})}
                        disabled={enrolling}
                        className="form-input"
                      >
                        <option value="">성별 선택</option>
                        <option value="M">남</option>
                        <option value="F">여</option>
                      </select>
                      <input
                        type="text"
                        placeholder="연락처"
                        value={newStudentForm.phone}
                        onChange={(e) => setNewStudentForm({...newStudentForm, phone: e.target.value})}
                        disabled={enrolling}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="멘토"
                        value={newStudentForm.mentor}
                        onChange={(e) => setNewStudentForm({...newStudentForm, mentor: e.target.value})}
                        disabled={enrolling}
                        className="form-input"
                      />
                      <div className="new-student-buttons">
                        <button
                          onClick={handleAddNewStudent}
                          disabled={enrolling}
                          className="btn-enroll"
                        >
                          {enrolling ? '등록 중...' : '등록'}
                        </button>
                        <button
                          onClick={resetNewStudentForm}
                          disabled={enrolling}
                          className="btn-cancel"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {enrollMessage && (
                  <div className={`enroll-message ${enrollMessage.includes('실패') || enrollMessage.includes('오류') ? 'error' : 'success'}`}>
                    {enrollMessage}
                  </div>
                )}
              </div>

              {/* 등록된 학생 목록 */}
              <div className="students-list">
                <h4>학생 목록 ({enrollments.length})</h4>

                {/* 출석부 관리 */}
                <div className="attendance-section">
                  <h4 className="attendance-title">📋 출석부 관리</h4>
                  
                  {/* 출석 날짜 관리 */}
                  <div className="attendance-date-manager">
                    <p className="attendance-guidance">출석 날짜를 추가하면 학생별 출석 상태를 관리할 수 있습니다.</p>
                    <div className="date-input-row">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="date-input"
                    />
                    <button
                      onClick={handleAddDate}
                      className="btn-add-date"
                    >
                      + 날짜 추가
                    </button>
                  </div>
                  {attendanceDates.length > 0 && (
                    <div className="attendance-dates-display">
                      {attendanceDates.map(date => (
                        <div key={date} className="date-chip">
                          <span>{date}</span>
                          {user && (
                            <button
                              className="chip-remove"
                              onClick={() => handleRemoveDate(date)}
                              title="날짜 삭제"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>

                {/* 학생 목록 테이블 (출석 현황 포함) */}
                {loading ? (
                  <div className="loading">로드 중...</div>
                ) : enrollments.length === 0 ? (
                  <div className="no-data">등록된 수강생이 없습니다.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>이름</th>
                          <th>나이</th>
                          <th>성별</th>
                          <th>연락처</th>
                          <th>멘토</th>
                          {attendanceDates.map(date => (
                            <th key={date} className="attendance-date-header">{date}</th>
                          ))}
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((enrollment) => {
                          const student = enrollment.students
                          return (
                            <tr key={enrollment.id}>
                              <td>{student?.name || '-'}</td>
                              <td>{student?.age || '-'}</td>
                              <td>{student?.gender ? (student.gender === 'M' ? '남' : '여') : '-'}</td>
                              <td>{student?.phone || '-'}</td>
                              <td>{student?.mentor || '-'}</td>
                              {attendanceDates.map(date => (
                                <td key={`${enrollment.id}-${date}`} className="attendance-cell">
                                  <select
                                    value={getAttendanceStatus(enrollment.id, date)}
                                    onChange={(e) => handleAttendanceChange(enrollment.id, date, e.target.value || null)}
                                    disabled={savingAttendance}
                                    className="attendance-select"
                                  >
                                    <option value="">-</option>
                                    <option value="O">O</option>
                                    <option value="X">X</option>
                                  </select>
                                </td>
                              ))}
                              <td>
                                <button
                                  className="btn-delete-small"
                                  onClick={() => handleUnenrollStudent(enrollment.id)}
                                >
                                  제거
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="lecture-detail-footer">
          {user && (
            <button className="btn-edit" onClick={() => onEditClick(lecture)}>
              강의 수정
            </button>
          )}
          <button className="btn-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default LectureDetailModal
