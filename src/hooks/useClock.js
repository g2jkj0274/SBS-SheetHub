import { useEffect, useMemo, useState } from 'react'
import { formatTime } from '../utils/dateUtils'

/**
 * 현재 시간을 1초마다 업데이트하는 커스텀 훅
 * @returns {string} HH:MM:SS 형식의 현재 시간
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeText = useMemo(() => formatTime(now), [now])

  return timeText
}
