import { useMemo, useState } from "react";
import { supabase } from "/supabaseClient";
import "../styles/feedback.css";

const MAX_MESSAGE_LEN = 2000;

function isValidEmail(email) {
  // 기본적인 형식 검사(최종 검증은 서버에서 권장)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function FeedbackPage() {
  const [form, setForm] = useState({
    category: "bug", // bug | feature | ux | performance | other
    rating: 4, // 1~5
    allowReply: true,
    email: "",
    title: "",
    message: "",
    attachContext: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type: "success" | "error", message: string }
  const [fieldErrors, setFieldErrors] = useState({});

  const categoryLabel = useMemo(
    () => ({
      bug: "버그 제보",
      feature: "기능 제안",
      ux: "UI/UX 의견",
      performance: "성능 이슈",
      other: "기타",
    }),
    []
  );

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validate(payload) {
    const errors = {};

    if (!payload.title.trim()) errors.title = "제목을 입력해 주세요.";
    if (!payload.message.trim()) errors.message = "내용을 입력해 주세요.";
    if (payload.message.length > MAX_MESSAGE_LEN) {
      errors.message = `내용은 최대 ${MAX_MESSAGE_LEN}자까지 가능합니다.`;
    }

    const ratingNum = Number(payload.rating);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.rating = "만족도는 1~5 사이여야 합니다.";
    }

    if (payload.allowReply) {
      if (!payload.email.trim()) errors.email = "답변을 원하시면 이메일을 입력해 주세요.";
      else if (!isValidEmail(payload.email.trim())) errors.email = "이메일 형식이 올바르지 않습니다.";
    }

    return errors;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setResult(null);

    const payload = {
      category: form.category,
      rating: Number(form.rating),
      allow_reply: Boolean(form.allowReply),
      email: form.email.trim(),
      title: form.title.trim(),
      message: form.message.trim(),
      page_url: form.attachContext ? window.location.href : "",
      user_agent: form.attachContext ? navigator.userAgent : "",
      submitted_at: new Date().toISOString(),
    };

    const errors = validate(payload);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from('feedback').insert([payload])

      if (error) {
        throw new Error(error.message || '피드백 저장에 실패했습니다.')
      }

      setResult({ type: "success", message: "피드백이 정상적으로 접수되었습니다. 감사합니다." });
      setFieldErrors({});
      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
      }));
    } catch (err) {
      setResult({ type: "error", message: err?.message || "알 수 없는 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-container">
      <section className="feedback-card" aria-labelledby="feedback-title">
        <header className="feedback-header">
          <h1 id="feedback-title" className="feedback-title">Feedback</h1>
          <p className="feedback-desc">
            서비스 개선을 위해 의견을 남겨 주세요. 버그/기능 제안/UI·UX/성능 이슈 모두 가능합니다.
          </p>
        </header>

        {result && (
          <div
            role="status"
            aria-live="polite"
            className={`feedback-banner ${result.type === "success" ? "is-success" : "is-error"}`}
          >
            {result.message}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="feedback-form">
          {/* 분류 */}
          <div className="feedback-row">
            <label className="feedback-label" htmlFor="category">분류</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={onChange}
              className="feedback-select"
            >
              <option value="bug">{categoryLabel.bug}</option>
              <option value="feature">{categoryLabel.feature}</option>
              <option value="ux">{categoryLabel.ux}</option>
              <option value="performance">{categoryLabel.performance}</option>
              <option value="other">{categoryLabel.other}</option>
            </select>
          </div>

          {/* 만족도 */}
          <div className="feedback-row">
            <label className="feedback-label" htmlFor="rating">만족도</label>
            <div className="feedback-stack">
              <div className="feedback-inline">
                <input
                  id="rating"
                  name="rating"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={form.rating}
                  onChange={onChange}
                  className="feedback-range"
                />
                <span className="feedback-badge">{form.rating}/5</span>
              </div>
              {fieldErrors.rating && <p className="feedback-error">{fieldErrors.rating}</p>}
              <p className="feedback-help">1(불만족) ~ 5(매우 만족)</p>
            </div>
          </div>

          {/* 답변 허용 + 이메일 */}
          <div className="feedback-row">
            <label className="feedback-label">답변</label>
            <div className="feedback-stack">
              <label className="feedback-checkline">
                <input
                  type="checkbox"
                  name="allowReply"
                  checked={form.allowReply}
                  onChange={onChange}
                />
                <span>답변을 받고 싶습니다</span>
              </label>

              <div className="feedback-stack">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="답변 받을 이메일 (선택)"
                  className="feedback-input"
                  disabled={!form.allowReply}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && <p className="feedback-error">{fieldErrors.email}</p>}
              </div>
            </div>
          </div>

          {/* 제목 */}
          <div className="feedback-row">
            <label className="feedback-label" htmlFor="title">제목</label>
            <div className="feedback-stack">
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="예: 로그인 버튼이 동작하지 않아요"
                className="feedback-input"
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title && <p className="feedback-error">{fieldErrors.title}</p>}
            </div>
          </div>

          {/* 내용 */}
          <div className="feedback-row">
            <label className="feedback-label" htmlFor="message">내용</label>
            <div className="feedback-stack">
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={onChange}
                className="feedback-textarea"
                placeholder={
                  "가능하면 아래 정보를 포함해 주세요.\n" +
                  "- 어떤 화면/기능에서 발생했나요?\n" +
                  "- 재현 방법(단계)\n" +
                  "- 기대한 결과 vs 실제 결과\n"
                }
                aria-invalid={Boolean(fieldErrors.message)}
              />
              <div className="feedback-counter">
                <span className="feedback-help">최대 {MAX_MESSAGE_LEN}자</span>
                <span className="feedback-help">{form.message.length}/{MAX_MESSAGE_LEN}</span>
              </div>
              {fieldErrors.message && <p className="feedback-error">{fieldErrors.message}</p>}
            </div>
          </div>

          {/* 진단 정보 첨부 */}
          <div className="feedback-row">
            <label className="feedback-label">진단 정보</label>
            <div className="feedback-stack">
              <label className="feedback-checkline">
                <input
                  type="checkbox"
                  name="attachContext"
                  checked={form.attachContext}
                  onChange={onChange}
                />
                <span>현재 페이지 URL / 브라우저 정보(User-Agent) 자동 첨부</span>
              </label>
              <p className="feedback-help">
                자동 첨부는 이슈 재현과 분석에 도움이 됩니다. 원치 않으면 해제할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="feedback-actions">
            <button type="submit" disabled={submitting} className="feedback-button">
              {submitting ? "전송 중..." : "피드백 보내기"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
