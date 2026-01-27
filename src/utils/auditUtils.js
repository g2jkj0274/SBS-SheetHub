import { supabase } from '/supabaseClient'

/**
 * 변경 이력을 audit_logs 테이블에 기록합니다.
 * @param {string} tableName - 테이블명 (teachers, subject_details 등)
 * @param {string} recordId - 레코드 ID
 * @param {string} action - 작업 유형 (CREATE, UPDATE, DELETE, READ)
 * @param {object} oldValue - 변경 전 값 (UPDATE, DELETE일 때만)
 * @param {object} newValue - 변경 후 값 (CREATE, UPDATE일 때만)
 */
export async function logAudit(tableName, recordId, action, oldValue = null, newValue = null) {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        table_name: tableName,
        record_id: recordId,
        action: action,
        old_value: oldValue,
        new_value: newValue,
        changed_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Audit log error:', error)
    }
  } catch (err) {
    console.error('Failed to log audit:', err)
  }
}
