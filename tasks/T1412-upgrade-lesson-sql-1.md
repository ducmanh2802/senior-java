# T1412 — Nâng cấp bài học sql: lesson-sql-006, lesson-sql-007

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-sql-006` "MVCC và transaction isolation: snapshot, phantom read và deadlock" — body 6803 ký tự, 2 câu check
- `lesson-sql-007` "Index B-tree và covering index: vì sao index nhanh, khi nào không giúp" — body 4787 ký tự, 2 câu check

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
- Thêm 1 câu check cho lesson-sql-006 và lesson-sql-007 (check: 2 → 3 câu), mỗi câu có q, 4 options khác nhau, answer, explain giải thích đáp án đúng và vì sao các phương án sai là sai; đáp án đúng rải vị trí (006: 2/1/0, 007: 1/1/3).
- body đã ≥ 4000 ký tự (006: 6871, 007: 4837) và cả hai bài đã có mục ### Liên hệ phỏng vấn ở cuối body ⇒ quy ước 1–2 của task không kích hoạt; không sửa exercises, không xoá nội dung cũ, không chạm bài khác. Tiế Việt có dấu đầy đủ, thuật ngữ giữ Anh, tránh backtick/${ trong template literal.
- node --check js/data/lessons-sql.js OK. validate.js: không báo lỗi nào cho lessons-sql.js / lesson-sql-006 / lesson-sql-007. Các lỗi còn lại của validate là trước khi bắt tay trong file khác (cú pháp q-system-design.js, lessons-testing.js; liên kết lessons-architecture/projects/path; index-light cũ) ⇒ không thuộc quyền sở hữu task này (chỉ sở hữu js/data/lessons-sql.js), không sửa theo quy tắc 3 AGENTS.md; build-light-index.js bị chặn bởi cú pháp q-system-design.js (lỗi trùng trước task).
- Không git commit.Reviewed-by: kilo (T1412R)
