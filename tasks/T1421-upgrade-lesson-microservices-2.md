# T1421 — Nâng cấp bài học microservices: lesson-microservices-003, lesson-microservices-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T1409

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-microservices-003` "Saga orchestration: bù trừ khi quy trình nhiều service thất bại" — body 2929 ký tự, 2 câu check
- `lesson-microservices-004` "Retry và dead letter queue: phân loại lỗi thay vì lặp vô hạn" — body 2742 ký tự, 2 câu check

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

- `js/data/lessons-microservices.js` là file sở hữu; không thay đổi file khác.
- `lesson-microservices-003` body 6352 ký tự (≥4500), 3 câu check (≥3), đã có `### Cơ chế từng bước`, ví dụ `~~~java`, `### Lỗi hay gặp trên production` (3 lỗi), `### Liên hệ phỏng vấn` (3 câu hỏi + trả lời ngắn).
- `lesson-microservices-004` body 6978 ký tự (≥4500), 3 câu check (≥3), đã có `### Cơ chế từng bước`, ví dụ `~~~java`, `### Lỗi hay gặp trên production` (4 lỗi), `### Liên hệ phỏng vấn` (3 câu hỏi + trả lời ngắn).
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (189.8 KB).
- `node scripts/validate.js` → `OK — không có lỗi.` (197 bài học, 220 bài tập; chỉ còn cảnh báo path.js về lesson-design-006/007 — không thuộc task này).
- Không commit, không mở trình duyệt.
Reviewed-by: kilo (T1421R)
