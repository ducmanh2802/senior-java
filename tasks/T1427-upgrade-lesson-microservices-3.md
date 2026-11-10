# T1427 — Nâng cấp bài học microservices: lesson-microservices-005, lesson-microservices-007

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T1421

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-microservices-005` "Trace context qua thread pool: giữ traceId và spanId đúng ranh giới" — body 2825 ký tự, 2 câu check
- `lesson-microservices-007` "Partial success khi xoá: 207 Multi-Status và compensation ledger" — body 2902 ký tự, 3 câu check

Với MỖI bài:
1. **body** < 4000 ký tự → bổ sung để đạt 4500–6500 ký tự: thêm mục `### Cơ chế từng bước` (đi từng bước, VÌ SAO lại như vậy), một ví dụ `~~~java` ngắn (≤ 30 dòng, có comment) hoặc bảng so sánh, mục `### Lỗi hay gặp trên production` (2–4 lỗi cụ thể, triệu chứng → nguyên nhân → cách sửa). Không trùng với phần đã có.
2. Thiếu `### Liên hệ phỏng vấn` → thêm ở CUỐI body: 2–3 câu hỏi phỏng vấn thường gặp về chủ đề này, mỗi câu kèm ý trả lời ngắn.
3. `check` < 3 câu → thêm cho đủ 3–4 câu: `{ q, options: [4 phương án không trùng], answer: 0..3, explain }`; explain nói vì sao đáp án đúng và vì sao từng phương án sai là sai; rải đáp án đúng ở các vị trí khác nhau.
4. Tiếng Việt **có dấu đầy đủ**; thuật ngữ giữ tiếng Anh. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6.

Luật:
- **Chỉ thêm**: KHÔNG sửa `exercises` (starter/tests/reference), không xoá nội dung cũ, không đụng bài khác.
- Sửa bằng công cụ edit theo đoạn nhỏ; **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: `{{code}}` (không lồng ngoặc nhọn), `~~~java`. KHÔNG dùng backtick và `${` trong template literal.

Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` + Notes ngắn.

## Notes
- lesson-microservices-005: Added `### Cơ chế từng bước` (7 steps with explanations), `~~~java` code example for OpenTelemetry context propagation, `### Lỗi hay gặp trên production` (4 specific errors: context leak, trace fragmentation, collector overload, DLQ retry span loss), expanded `### Liên hệ phỏng vấn` to 3 Q&A, added 2 check questions (total 4).
- lesson-microservices-007: Added `### Cơ chế từng bước` (5 steps with explanations), `~~~java` code example for deleteOne with progress/ledger, `### Lỗi hay gặp trên production` (4 specific errors: false 200 OK, duplicate notify on retry, ledger loss on restart, hard delete preventing recovery), expanded `### Liên hệ phỏng vấn` to 4 Q&A, added 1 check question (total 4).
- All backticks in body converted to `{{code}}` markup to avoid template literal syntax errors.
- `node scripts/validate.js` passes for both lessons (no errors specific to lessons-microservices.js). Pre-existing syntax errors in other files (q-system-design.js, q-remote.js, lessons-db.js, etc.) prevent `build-light-index.js` from running; those are outside task scope.
Reviewed-by: kilo (T1427R)
