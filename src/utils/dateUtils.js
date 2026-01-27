/**
 * 시간을 24시간 형식의 HH:MM:SS 문자열로 포맷합니다.
 * @param {Date} date - 포맷할 날짜 객체
 * @returns {string} HH:MM:SS 형식의 시간 문자열
 */
export function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
