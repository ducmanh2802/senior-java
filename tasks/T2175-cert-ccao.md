# T2175 — 30 câu luyện thi CCAO-F (Associate): domain Responsible Use, Prompting Basics

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-1.js`
After: T2174

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate): người dùng Claude trong công việc (consultant, sales, delivery lead) — dùng Claude.ai/Projects/Cowork, viết prompt, đánh giá output, quản trị và dùng có trách nhiệm; KHÔNG cần code.
App có đề thi thử `ccao-f` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccao-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Responsible Use]`, `[Prompting Basics]`.
- id: `qz-ccao-NNN` nối tiếp số lớn nhất đã có trong file (file rỗng → bắt đầu 001). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh** (giống đề thật), dạng tình huống thực tế 2–4 câu ("A support team… Which approach…?"), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer là mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3, rải đều vị trí.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Nguồn kiến thức (chỉ dùng điều bạn CHẮC CHẮN đúng theo tài liệu chính thức của Anthropic: docs.claude.com / docs.anthropic.com, code.claude.com/docs, modelcontextprotocol.io, các khoá Anthropic Academy trên anthropic.skilljar.com). **Không bịa** tên tính năng, tham số API, giới hạn, giá, tên model. Chi tiết nào không chắc → hỏi ở mức nguyên lý/best practice thay vì chi tiết.
- Đọc 3–4 câu mẫu trong `js/data/quiz-cca-2.js` (cùng định dạng) trước khi viết; không trùng ý với câu đã có trong các file quiz-cca-*.js, quiz-claude.js.

## Luật
- AGENTS.md mục "Câu trắc nghiệm" và mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccao-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi số câu theo từng domain.

## Notes

- Đã thêm 30 câu `qz-ccao-031` … `qz-ccao-060` (file giờ có 60 câu, T2174 + T2175):
  - `[Responsible Use]`: 15 câu (031–045) — PII/dữ liệu khách, credentials, phân loại dữ liệu, shadow AI, bias khi auto-reject CV, automation bias, pháp lý & y tế, accountability, prompt injection, data minimisation, xử lý sự cố, minh bạch AI.
  - `[Prompting Basics]`: 15 câu (046–060) — brief rõ ràng, viết lại theo đối tượng, ràng buộc + few-shot, output format, chia bước, ngữ cảnh từng chat, negative constraint + role, grounding, làm rõ yêu cầu mơ hồ, chống lẫn ngữ cảnh, rubric + ví dụ, hiện từng bước, thử biến thể, dạy Claude hỏi lại, phản hồi sửa bài.
  - 8/30 câu `multi: true` ("(Choose 2)", 5 options, answer tăng dần); vị trí đáp án rải đều (0: 18, 1: 18, 2: 18, 3: 19 trên cả file).
- Nội dung lần chạy trước (031–060) bị viết thiếu dấu tiếng Việt, có 2 câu sai index đáp án (035, 050) và 2 câu quá đơn giản (059, 060) → đã viết lại toàn bộ 30 câu, giữ nguyên cách đánh số id để T2176/T2177 nối tiếp 061+.
- Kiểm tra: `node --check js/data/quiz-ccao-1.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → **OK — không có lỗi** (chỉ còn warning `path.js` về lessons ngoài PATH, không liên quan).
- Lưu ý cho integrator: trong lúc chạy, `js/data/q-claude.js` tạm thời lỗi cú pháp (backtick thô trong template literal, dòng ~2722) do một task khác đang sửa; đã chờ và file được sửa xong, validate cuối cùng OK. `index-light.js` đã được sinh lại (311 KB) sau khi dữ liệu ổn định.
- Không sửa file nào ngoài `js/data/quiz-ccao-1.js`; không commit.
Reviewed-by: kilo (T2175R)
