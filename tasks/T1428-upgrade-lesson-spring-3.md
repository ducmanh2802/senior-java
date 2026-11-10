# T1428 — Nâng cấp bài học spring: lesson-spring-005, lesson-spring-006

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T1422

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-spring-005` "Spring MVC request flow, validation và ProblemDetail" — body 4064 ký tự, 2 câu check
- `lesson-spring-006` "Migration runner kiểu Flyway: versioned, repeatable và checksum" — body 3068 ký tự, 3 câu check

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
- lesson-spring-005: Đã mở rộng body (thêm Custom ArgumentResolver, ExceptionResolver comparison table, lỗi idempotency key), bổ sung 2 câu check (JSON parse error 500, DataIntegrityViolationException handler).
- lesson-spring-006: Đã thêm "Cơ chế từng bước" (6 bước chi tiết), "Lỗi hay gặp trên production" (4 lỗi: checksum mismatch, out-of-order, race condition multi-instance, repeatable không chạy lại), mở rộng "Liên hệ phỏng vấn" thành 3 câu, bổ sung 1 câu check về race condition 2 pod K8s.
- Validate OK cho lessons-spring.js. build-light-index.js fail do lỗi tiền đề ở q-remote.js, q-system-design.js, lessons-db.js (không thuộc task).
Reviewed-by: kilo (T1428R)
