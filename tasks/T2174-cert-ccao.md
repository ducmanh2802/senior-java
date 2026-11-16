# T2174 — 30 câu luyện thi CCAO-F (Associate): domain Output Evaluation, Workflow Integration

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-1.js`

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate): người dùng Claude trong công việc (consultant, sales, delivery lead) — dùng Claude.ai/Projects/Cowork, viết prompt, đánh giá output, quản trị và dùng có trách nhiệm; KHÔNG cần code.
App có đề thi thử `ccao-f` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccao-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Output Evaluation]`, `[Workflow Integration]`.
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

Added 30 CCAO-F Associate MCQs to `js/data/quiz-ccao-1.js` (empty file → ids `qz-ccao-001`..`qz-ccao-030`, topic `claude`):

- **Output Evaluation** (15 câu): `qz-ccao-001`..`qz-ccao-015`
- **Workflow Integration** (15 câu): `qz-ccao-016`..`qz-ccao-030`
- Multi-true (`multi: true`, "(Choose 2)"): 7 câu (003, 007, 011, 014, 018, 022, 026)
- Single-answer: 23 câu (4 options, answer positions 0–3 rải đều)
- q & options English (scenario-based), explain Vietnamese (đúng + từng phương án sai)
- No backtick / `${` inside template literals; `node --check` passed; `validate.js` reports **no errors for ccao/quiz-ccao**.

**Known blocker**: `node scripts/build-light-index.js` & `validate.js` cannot reach `OK` because another agent's uncommitted edit broke `js/data/lessons-sql.js` (HEAD valid; working-tree syntax error at ~line 2218). Per AGENTS.md rule 3 I did not modify that file. Once that agent fixes lessons-sql.js, the full validation will pass.
