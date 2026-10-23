# T71 — View: Phỏng vấn AI bằng giọng nói (`#/interview`)

Status: DONE
Agent: opencode
Owns: `js/views/interview.js`, `css/views/interview.css`

> **Ghi theo lô nhỏ** (≤ 120 dòng mỗi edit). Đọc `AGENTS.md` mục 7, 9 và **11** trước. API server (`App.ai.interview`) đã có sẵn và có test; **không sửa `js/core/*` hay `api/*`**.

## Màn hình 1: Thiết lập (`#/interview`)
- `.page-head` "Phỏng vấn AI" + 1 dòng: hội thoại liên tục với interviewer AI bằng giọng nói, giống vòng phỏng vấn thật.
- Chọn: **Ngôn ngữ** (Tiếng Việt / English), **Level** (mid/senior/lead), **Thời lượng** (10/20/30/45 phút), **Phong cách** (Thân thiện / Khó tính).
- **Trọng tâm**: chips chọn nhiều chủ đề từ `App.topics()`; HOẶC chọn một công ty từ `window.COMPANIES` (nếu có; dùng tên + các topic mà công ty đó yêu cầu, xem cấu trúc trong `js/data/companies.js`).
- Nút "Bắt đầu phỏng vấn". Ghi chú nhỏ: "Mỗi buổi tốn 1 lượt AI trong hạn mức ngày". Nếu `App.auth.enabled && !App.auth.user` và chưa có passcode: hiện nút tới `#/account`.
- `seeds`: chọn ngẫu nhiên tối đa 12 câu (ưu tiên câu `App.store.isDue` hoặc `review`/`unknown`, rồi tới câu chưa học) trong các topic đã chọn; `ref` = phần sau `**Tóm tắt:**` tới hết đoạn đầu, cắt 600 ký tự.

## Màn hình 2: Đang phỏng vấn
- Thanh trên: đồng hồ đếm (mm:ss / thời lượng), số câu, nút "Kết thúc & xem đánh giá".
- Khung hội thoại kiểu chat: bong bóng interviewer (trái) và ứng viên (phải); interviewer có badge `intent` nhỏ (Câu hỏi / Đào sâu / Gợi ý…). Sau mỗi câu trả lời hiện điểm nhanh `last_answer` bằng `App.ui.scoreBadge` + `note` (có nút ẩn/hiện điểm, mặc định ẩn để giống phỏng vấn thật).
- Interviewer nói: đọc `say` bằng `speechSynthesis` (nút 🔊 đọc lại, nút tắt tiếng). Chọn voice khớp `lang` nếu có.
- Ứng viên trả lời: nút mic lớn `.btn.mic-btn` (`.recording` khi đang ghi) dùng `App.speech.start`; hiện chữ đang nhận dạng (interim) theo thời gian thực; nút **"Trả lời xong"** gửi lượt. Có công tắc **"Rảnh tay"**: tự bắt đầu nghe sau khi interviewer nói xong và tự gửi khi im lặng ≥ 2.5 giây. Luôn có ô **gõ phím** thay thế (Ctrl+Enter gửi).
- Trong lúc chờ AI: `<span class="ai-loading">Interviewer đang nghĩ…</span>`, khoá nút gửi. Lỗi: `App.ui.error(e)`; `bad_session` → mời xem tổng kết hoặc bắt đầu lại.
- Khi `done === true` hoặc hết giờ (+2 phút) hoặc bấm kết thúc: dừng mic/TTS, gọi `summary`.
- Lưu phiên đang làm vào `localStorage` key `sjp.interview.current` (config, transcript, session_token, startedAt) để reload không mất; có nút "Tiếp tục phiên trước" ở màn hình 1 nếu còn < 90 phút.

## Màn hình 3: Đánh giá
- Điểm tổng `App.ui.scoreBadge(overall_score)`, `hire_signal` hiển thị tiếng Việt có màu (strong_no/no = bad, lean_* = warn, yes/strong_yes = ok), `verdict`.
- Bảng `by_question`: câu hỏi, điểm, nhận xét, "Câu trả lời tốt hơn" (thu gọn/mở rộng).
- `strengths`, `improvements`, `study_next`, `communication`.
- Lưu kết quả bằng `App.store.addMockResult({kind: 'ai-interview', score: overall_score, hire_signal, minutes, lang, topics, summary})` (đồng bộ cloud tự động) và nút "Phỏng vấn lại" / "Ôn các chủ đề yếu" (link `#/bank/<topic>` cho topic đầu tiên đã chọn).
- Nút "Tải transcript" (file .txt).

## Nghiệm thu
`node --check`, `node scripts/validate.js` OK. Cleanup: dừng mic, `speechSynthesis.cancel()`, clearInterval khi rời view. Responsive 360px, dark mode chỉ dùng biến CSS, phím tắt có `<kbd>`.

## Notes
- Integrator viết lại toàn bộ (agent nemotron bị 504 giữa chừng). Test E2E với API giả lập: desktop + 360px, không lỗi console, kết quả lưu vào mockHistory (kind ai-interview).
Reviewed-by: codex (T71R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
