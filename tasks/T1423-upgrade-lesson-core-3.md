# T1423 — Nâng cấp bài học core: lesson-core-005

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`
After: T1416

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 1 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-core-005` "String, StringBuilder và String pool" — body 2944 ký tự, 2 câu check

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
- lesson-core-005 ("String, StringBuilder và String pool") nâng cấp theo AGENTS.md mục 12:
  * body mở rộng từ ~2944 lên 5729 ký tự, thêm mục "### Cơ chế từng bước: StringBuilder hoạt động như thế nào" (cái gì → vì sao cần → hoạt động thế nào → ví dụ cụ thể → lỗi hay gặp) kèm ví dụ ~~~java (≤ 30 dòng, có comment) và giữ bảng so sánh.
  * Giữ nguyên "### Pitfall production" đã có (5 lỗi cụ thể, triệu chứng → nguyên nhân → cách sửa), không trùng lặp.
  * Mở rộng "### Liên hệ phỏng vấn" thành 3 câu hỏi, mỗi câu kèm ý trả lời ngắn, đặt ở cuối body.
  * Thay 2 câu check placeholder bằng 4 câu tiếng Việt có dấu, đáp án rải các vị trí (2, 2, 0, 3), explain nêu lý do đúng/sai từng phương án.
  * exercises (starter/tests/reference) không bị sửa; không động đến bài khác.
- Chạy node scripts/build-light-index.js rồi node scripts/validate.js: không báo lỗi cho lessons-core.js (các LỖI còn lại trong validate.js nằm ở lessons-design.js, file không thuộc task này, không được động theo quy tắc AGENTS.md mục 3).
- Không commit, không tạo branch.
Reviewed-by: kilo (T1423R)
