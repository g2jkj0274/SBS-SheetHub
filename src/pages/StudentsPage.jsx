import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import '../styles/students.css'

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // 폼 상태
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('') // 'M' 또는 'F'
  const [phone, setPhone] = useState('')
  const [mentor, setMentor] = useState('')

  // 학생 목록 로드
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Students fetch error:', error)
          return
        }

        setStudents(data || [])
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const resetForm = () => {
    setName('')
    setAge('')
    setGender('')
    setPhone('')
    setMentor('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      const payload = {
        name: name.trim(),
        age: age ? parseInt(age) : null,
        gender: gender || null,
        phone: phone.trim() || null,
        mentor: mentor.trim() || null,
      }

      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          alert('수정 실패: ' + error.message)
          return
        }

        setStudents((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
        )
        alert('학생 정보가 수정됐습니다.')
      } else {
        // 신규 추가
        const { data, error } = await supabase
          .from('students')
          .insert([payload])
          .select()

        if (error) {
          alert('추가 실패: ' + error.message)
          return
        }

        setStudents((prev) => [data[0], ...prev])
        alert('학생이 추가됐습니다.')
      }

      resetForm()
    } catch (err) {
      console.error('Error:', err)
      alert('오류가 발생했습니다: ' + err.message)
    }
  }

  const handleEdit = (student) => {
    setName(student.name || '')
    setAge(student.age ? String(student.age) : '')
    setGender(student.gender || '')
    setPhone(student.phone || '')
    setMentor(student.mentor || '')
    setEditingId(student.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) {
        alert('삭제 실패: ' + error.message)
        return
      }

      setStudents((prev) => prev.filter((s) => s.id !== id))
      alert('학생이 삭제됐습니다.')
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <main className="app-container students-page">
      <h2>학생 관리</h2>

      <div className="students-controls">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-add-student"
        >
          {showForm ? '등록 취소' : '+ 학생 추가'}
        </button>
      </div>

      {showForm && (
        <div className="student-form-container">
          <form onSubmit={handleSubmit} className="student-form">
            <h3>{editingId ? '학생 정보 수정' : '새 학생 추가'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">이름 *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="학생 이름"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">나이</label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="20"
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">성별</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">선택</option>
                  <option value="M">남</option>
                  <option value="F">여</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="phone">연락처</label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="mentor">담당멘토</label>
                <input
                  id="mentor"
                  type="text"
                  value={mentor}
                  onChange={(e) => setMentor(e.target.value)}
                  placeholder="멘토 이름"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? '수정' : '추가'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-cancel"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">로드 중...</div>
      ) : students.length === 0 ? (
        <div className="no-data">등록된 학생이 없습니다.</div>
      ) : (
        <div className="students-table-wrap">
          <table className="students-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>나이</th>
                <th>성별</th>
                <th>연락처</th>
                <th>멘토</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name || '-'}</td>
                  <td>{student.age || '-'}</td>
                  <td>{student.gender ? (student.gender === 'M' ? '남' : '여') : '-'}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.mentor || '-'}</td>
                  <td>
                    <button
                      className="btn-edit-small"
                      onClick={() => handleEdit(student)}
                    >
                      수정
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDelete(student.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default StudentsPage
