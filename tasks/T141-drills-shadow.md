# T141 — Drills shadowing: câu mẫu nghe & nhắc lại

Status: TODO
Agent: opencode
After: T137
Owns: `js/data/drills-shadow.js`, `scripts/validate.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html) và AGENTS.md mục 2, 5. Người học: dev Java Việt Nam 4–8 năm, tiếng Anh đọc tốt nhưng nói chưa trôi, chuẩn bị phỏng vấn Senior với công ty nước ngoài/ngân hàng. Tiếng Anh tự nhiên kiểu người bản xứ nói trong phỏng vấn (American English), không văn viết cứng, không sai ngữ pháp. Dữ liệu là chuỗi thường (không markup), không dùng backtick và `${`. id tăng dần 3 chữ số, duy nhất.

1. Thêm **~120 câu** `kind: 'shadow'` vào `drills-shadow.js`, chia đều theme: intro (giới thiệu bản thân, kinh nghiệm), tech (giải thích khái niệm Java/Spring/DB/Kafka bằng 1 câu), design (dẫn dắt system design: clarify, estimate, trade-off, "Let me think out loud…"), project (kể dự án, vai trò, kết quả có số liệu), behavioral (conflict, failure, ownership), negotiation (lương, notice period, offer), smalltalk (mở đầu/kết thúc buổi phỏng vấn, xin nhắc lại câu hỏi, câu "câu giờ" để suy nghĩ). Câu 8–25 từ, có từ nối và collocation hay dùng; `vi` dịch tự nhiên.
2. Thêm vào `scripts/validate.js` phần kiểm tra `window.DRILLS` (chỉ THÊM, không sửa logic cũ): id `drill-<kind>-NNN` duy nhất, kind/theme/level hợp lệ, field bắt buộc theo kind (shadow: en, vi; qa: q, seconds ∈ {60,90,120}, sample 80–200 từ, phrases 3–6; term: term, say, wrong, example), không backtick.
3. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
