# T99 — Phỏng vấn AI: chế độ "Theo JD"

Status: TODO
Agent: opencode
Owns: `js/views/interview.js`, `css/views/interview.css`

Đọc AGENTS.md mục 7, 9, 11 và **14**, rồi đọc kỹ `js/views/interview.js` hiện tại (màn hình setup có chips `mode`: topics / company). **Sửa nhỏ, không viết lại view.**

## Việc cần làm
1. Thêm lựa chọn thứ 3 cho `mode`: **"Theo JD"**. Khi chọn: `<textarea>` dán JD (lưu nháp `localStorage` key `sjp.interview.jd`), nút **"🔎 Phân tích JD"** → `App.ai.jd(text)` (khoá nút + `ai-loading` khi chờ; lỗi `App.ui.error`).
2. Hiển thị kết quả (lưu vào `localStorage` key `sjp.interview.jdResult` để không phải phân tích lại):
   - role · company · level · domain, `summary`.
   - Bảng **must_have** và **nice_to_have**: kỹ năng, mức nhấn mạnh (●●● theo weight), **mức sẵn sàng của bạn** = với `topic` khác "": `App.stats(topic)` → `known/total` thành % và nhãn 🟢 ≥ 60% / 🟡 30–60% / 🔴 < 30% kèm link `#/bank/<topic>`; topic "" → "chưa có trong ngân hàng".
   - `likely_questions` (q + why nhỏ), `prep_tips`, `questions_to_ask`.
3. Nút **"🎙️ Phỏng vấn theo JD này"** bắt đầu buổi như `startNew()` nhưng: `config.level = result.level`, `config.focus = (company ? company + ' — ' : '') + role + ' (' + domain + '): ' + must_have skills`, `seeds` = tối đa 6 `likely_questions` (ref "") + câu từ ngân hàng theo các topic của must_have (dùng lại `pickSeeds`, tổng ≤ 12), `topics` = các topic của must_have.
4. Giữ nguyên hành vi 2 mode cũ. Responsive 360px, chỉ dùng biến CSS, escape mọi dữ liệu bằng `App.esc`.

## Nghiệm thu
`node --check`, `node scripts/validate.js` OK.

## Notes
