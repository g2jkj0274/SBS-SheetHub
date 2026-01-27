import { useClock } from '../../hooks/useClock'
import '../../styles/clock.css'

/**
 * 원형 시계 컴포넌트
 * 현재 시간을 원형으로 표시하며, Blue와 Orange 두 가지 색상으로 50%씩 분할합니다.
 */
function ClockRing() {
  const timeText = useClock()

  // SVG 원형(두 색상으로 원 둘레를 50%씩 분할)
  const size = 320
  const strokeWidth = 12
  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const half = circumference / 2

  return (
    <div className="clock-page">
      <div className="clock-ring" aria-label="현재 시간 표시 원형 시계">
        <svg
          className="clock-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-hidden="true"
        >
          {/* 배경 링 */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="clock-ring-bg"
            strokeWidth={strokeWidth}
          />

          {/* Sky Blue (원 둘레의 50%) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#0085CD"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${half} ${circumference}`}
            strokeDashoffset="0"
            className="clock-ring-seg"
          />

          {/* Orange (나머지 50%) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#F6AB00"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${half} ${circumference}`}
            strokeDashoffset={-half}
            className="clock-ring-seg"
          />
        </svg>

        <div className="clock-center">
          <div className="clock-time">{timeText}</div>
          <div className="clock-sub">현재 시간</div>
        </div>
      </div>
    </div>
  )
}

export default ClockRing
