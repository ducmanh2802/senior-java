# T1420 — Nâng cấp bài học jpa: lesson-jpa-008, lesson-jpa-009

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T1408

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-jpa-008` "Dirty checking: snapshot, @DynamicUpdate và chi phí" — body 3288 ký tự, 2 câu check
- `lesson-jpa-009` "Thứ tự flush và ActionQueue" — body 2793 ký tự, 2 câu check

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

- Đã bổ sung `### Cơ chế từng bước` (5 bước từ load đến flush UPDATE), ví dụ `~~~java`, bảng so sánh 默认/@DynamicUpdate/bytecode enhancement, `### Lỗi hay gặp trên production` (4 lỗi) và 3 câu hỏi phỏng vấn kèm ý trả lời vào `### Liên hệ phỏng vấn` cho lesson-jpa-008.
-lesson-jpa-009: thêm `### Cơ chế từng bước` (4 bước ActionQueue), ví dụ `~~~java`, bảng thứ tự insert/update/delete, `### Lỗi hay gặp trên production` (5 lỗi) và 3 câu hỏi phỏng vấn cho phần liên hệ.
- Cả hai bài đều mở rộng `check` từ 2 lên 4 câu, rải đáp án đúng ở các vị trí khác nhau, explain nói rõ vì sao đúng và vì sao từng phương án sai.
- Dùng `{{code}}` thay vì backtick trong template literal; đã kiểm tra backtick chẵn (174) và không có `${`.
- `node scripts/build-light-index.js` → ghi index-light.js OK. `node scripts/validate.js` → `OK — không có lỗi.` (sau khi sửa ký tự CJK `旧` → `cũ`).
- Chỉ sửa `js/data/lessons-jpa.js`; không commit, không kill tiến trình khác.
Reviewed-by: kilo (T1420R)
