# T2289 — 30 câu luyện thi CCAO-F (pool 2): Responsible Use, Prompting Basics

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-2.js`
After: T2288

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate – Foundations): người dùng Claude trong công việc (không cần code) — chọn sản phẩm (Claude.ai, Projects, Claude Code, Cowork…), viết prompt, cấu hình knowledge/Projects, đánh giá output, tích hợp vào workflow, dùng có trách nhiệm, xử lý sự cố. Câu tình huống thực tế, mức trung bình.
Pool 1 (`js/data/quiz-ccao-1.js`) đã có câu; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccao-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccao-f`).

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccao-2.js` (trước dòng `);` cuối file), chia đều: `[Responsible Use]`, `[Prompting Basics]`.
- id: `qz-ccao-NNN` — số nối tiếp **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccao-[0-9]+" js/data/*.js | sort -V | tail -1`; hiện ≥ 135). topic: `'claude'`.
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

Added qz-ccao-136..165 (30 questions). Responsible Use/Prompting Basics. validate OK.
Reviewed-by: kilo (T2289R)
