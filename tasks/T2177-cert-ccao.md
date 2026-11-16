# T2177 — 15 câu luyện thi CCAO-F (Associate): domain Troubleshooting

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-1.js`
After: T2176

## Notes
Thêm 15 câu [Troubleshooting] (ID qz-ccao-091..105). Trong đó 4 câu multi-answer (102–105), 11 câu single-answer (091–101). Đáp án đúng phân bố: 0×3, 1×3, 2×4, 3×2. Tất cả q và options tiếng Anh, explain tiếng Việt. Chạy validate OK.

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate): người dùng Claude trong công việc (consultant, sales, delivery lead) — dùng Claude.ai/Projects/Cowork, viết prompt, đánh giá output, quản trị và dùng có trách nhiệm; KHÔNG cần code.
App có đề thi thử `ccao-f` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **15 câu** vào `js/data/quiz-ccao-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Troubleshooting]`.
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
Reviewed-by: kilo (T2177R)
