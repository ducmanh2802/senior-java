# T912 — Viết lại hay và chi tiết hơn: testing — 8 câu

Status: DONE
Agent: claude
Owns: `js/data/q-soft.js`

Các câu dưới đây có đáp án **quá mỏng (< 2000 ký tự)**. Viết lại field `a` cho **hay hơn và chi tiết hơn**, giữ đúng ý câu hỏi `q` hiện có, giữ những gì đáp án cũ đã đúng; sửa chỗ sai (nếu thấy) và ghi vào Notes.

**Id cần viết lại:** `testing-033`, `testing-034`, `testing-035`, `testing-036`, `testing-037`, `testing-038`, `testing-039`, `testing-040`

Mỗi đáp án mới (chuẩn "hay và chi tiết"):
- `**Tóm tắt:**` 1–2 câu trả lời miệng 30 giây.
- `###` cơ chế bên trong **vì sao** như vậy, giải thích từng bước như dạy người mới (người đọc: dev Java 4 năm, ít va chạm hệ thống lớn).
- `### Ví dụ đời thực`: một tình huống production cụ thể có số liệu (giả định nhưng hợp lý: QPS, latency, số dòng, chi phí), diễn biến → cách xử lý → kết quả.
- Code ngắn có comment (≤ 30 dòng) hoặc `~~~seq` khi có luồng nhiều bên (≥ 3 hệ thống), bảng so sánh / trade-off, khi nào dùng / không dùng, pitfall production.
- `### Trả lời mẫu khi phỏng vấn`: đoạn văn nói tự nhiên 60–90 giây (khoảng 150–220 từ), như ứng viên Senior trả lời thật.
- Kết bằng `> Senior tip:`. **2800–4500 ký tự**. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành; không bịa API/flag. Không backtick, không `${`.

Chạy `node scripts/validate.js` → OK.

> **CHỈ SỬA ĐÚNG CÁC ID LIỆT KÊ:** với mỗi id, chỉ thay nội dung field `a` (và thêm `follow` nếu thiếu); giữ nguyên `id`, `topic`, `level`, `q`, `tags`, `refs`, `lang`. KHÔNG viết lại cả file, KHÔNG đụng object khác (file có thể đang chứa nội dung chưa commit của task khác). Sửa bằng thao tác thay thế đúng đoạn `a: ` của từng id. Trước khi đánh DONE: số id trong file (`grep -c "id: '"`) phải KHÔNG đổi.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Task này là NGOẠI LỆ:** chỉ sửa field `a` (và thêm `follow` nếu thiếu) của các id liệt kê ở trên trong `js/data/q-soft.js`; không thêm câu mới, không đụng câu khác.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-soft.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id đã viết lại vào Notes.

## Notes

Claude 2026-11-07: viết lại 8 câu testing (4200–4900 ký tự).
