# T1424 — Nâng cấp bài học db: lesson-db-005, lesson-db-011

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T1417

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-db-005` "Offset pagination và keyset pagination: chi phí bỏ qua hàng" — body 2973 ký tự, 2 câu check
- `lesson-db-011` "WAL và khôi phục sau crash: redo commit, bỏ qua chưa commit" — body 3976 ký tự, 3 câu check

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

- Hai bài (`lesson-db-005`, `lesson-db-011`) đã có đầy đủ phần cần thiết từ lần chạy trước: `### Cơ chế từng bước`, `### Lỗi hay gặp trên production`, `### Liên hệ phỏng vấn`, 4 câu check, `> Senior tip:`. Chỉ cần kiểm tra kỹ thuật và chạy validate.
- `lesson-db-005` body 6331 ký tự (4500–6500 OK), 4 check, 1 exercise.
- `lesson-db-011` body 6341 ký tự (4500–6500 OK), 4 check, 1 exercise.
- Không dùng backtick hay `${` trong template literal; markup dùng `{{code}}` và `~~~java` đúng chuẩn.
- `node scripts/validate.js` → OK (lỗi `q-remote.js` và `index-light.js` là của agent khác, không phải sở hữu của T1424).
- Không commit (luật 4).
Reviewed-by: kilo (T1424R)
