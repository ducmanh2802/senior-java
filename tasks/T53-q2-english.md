# T53 — Nội dung: Phỏng vấn tiếng Anh (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `english`: thêm 12 câu (đang có 19 → mục tiêu ≥ 31)
- Explain the CAP theorem / eventual consistency to the interviewer with a concrete example
- Walk me through how you would design a URL shortener (giao tiếp system design bằng tiếng Anh)
- Explain how Kafka guarantees ordering and what happens when a consumer crashes
- Explain transaction isolation levels and a bug you saw because of them
- Tell me about a difficult bug you fixed. How did you find the root cause?
- Give a daily stand-up update, including a blocker, in clear English
- How do you explain a delay to a foreign client or product owner?
- How do you write and respond to code review comments politely in English?
- How do you answer when you do not know the answer to a technical question?
- Explain how garbage collection works in the JVM to a junior developer
- Describe your role in Agile/Scrum ceremonies and how you improve the process
- Tell me about a time you led a technical initiative across teams

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Added 12 questions (english-020 through english-031). English topic now has 31 questions (was 19). All 6 validation batches passed. Level distribution: 4 mid, 7 senior, 1 lead added (total: 8 mid, 19 senior, 4 lead ≈ 26%/61%/13%).
