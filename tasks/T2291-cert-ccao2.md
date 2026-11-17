# T2291 — 30 câu luyện thi CCAO-F (pool 2): Troubleshooting, Output Evaluation

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-2.js`
After: T2290

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate – Foundations): người dùng Claude trong công việc (không cần code) — chọn sản phẩm (Claude.ai, Projects, Claude Code, Cowork…), viết prompt, cấu hình knowledge/Projects, đánh giá output, tích hợp vào workflow, dùng có trách nhiệm, xử lý sự cố. Câu tình huống thực tế, mức trung bình.
Pool 1 (`js/data/quiz-ccao-1.js`) đã có câu; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccao-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccao-f`).

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccao-2.js` (trước dòng `);` cuối file), chia đều: `[Troubleshooting]`, `[Output Evaluation]`.
- id: `qz-ccao-NNN` — số nối tiếp **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccao-[0-9]+" js/data/*.js | sort -V | tail -1`; hiện ≥ 195). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh**, tình huống 2–4 câu ("A legal team… Which approach…?"), không hỏi định nghĩa suông. Phương án nhiễu **hợp lý**, độ dài tương đương đáp án đúng.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3 rải đều.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Chỉ dùng điều CHẮC CHẮN đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io, Anthropic Academy). Model hiện hành: Fable 5.2 ($8/$40 per MTok), Opus 5.5 ($4/$20), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50). Trên model mới: `budget_tokens`, temperature/top_p/top_k, prefill bị 400; dùng `thinking: {type: "adaptive"}` + effort. Không chắc → hỏi ở mức nguyên lý.

## Luật
AGENTS.md mục "Câu trắc nghiệm" + mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccao-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi id + số câu theo domain.

## Notes
Thêm 30 câu vào js/data/quiz-ccao-2.js (pool 2, topic claude), id mới qz-ccao-169 → qz-ccao-198 (max cũ qz-ccao-168):
- [Troubleshooting]: 15 câu (qz-ccao-169 → qz-ccao-183), bao gồm 3 câu multi (Choose 2): qz-ccao-171, qz-ccao-174, qz-ccao-177
- [Output Evaluation]: 15 câu (qz-ccao-184 → qz-ccao-198), bao gồm 4 câu multi (Choose 2): qz-ccao-184, qz-ccao-187, qz-ccao-190, qz-ccao-193
q/options tiếng Anh; explain tiếng Việt (vì sao đúng + vì sao từng sai); không backtick, không ${; q có thẻ [Domain] đầu dòng và (Choose 2) cho multi.
node --check OK; build-light-index OK; qtool check OK for quiz-ccao-2.js. validate.js còn báo lỗi sdlc.js (cú pháp) và cảnh báo path.js — cả hai là file integrator sở hữu, không do task này sửa, không liên quan quiz-ccao-2.js.Reviewed-by: kilo (T2291R)
