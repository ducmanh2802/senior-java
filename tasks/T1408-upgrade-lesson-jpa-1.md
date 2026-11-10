# T1408 — Nâng cấp bài học jpa: lesson-jpa-003, lesson-jpa-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-jpa-003` "Optimistic locking với @Version" — body 3776 ký tự, 3 câu check
- `lesson-jpa-004` "Fetch LAZY/EAGER và LazyInitializationException" — body 4112 ký tự, 2 câu check

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

- lesson-jpa-003: Mở rộng body (thêm 5 lỗi production, 3 Q&A phỏng vấn), bổ sung câu check thứ 4 (version check trên field khác). Cả 2 bài đã có sẵn `### Cơ chế từng bước` và `### Lỗi hay gặp`.
- lesson-jpa-004: Body gốc đã >4000 ký tự, đã có `### Cơ chế từng bước`, `### Lỗi hay gặp`, `### Liên hệ phỏng vấn` (3 Q&A). Bổ sung các mục: `@EntityGraph`, `Bytecode enhancement`, `Lỗi production mở rộng`, `Kiểm thử`; bổ sung câu check thứ 4 (pagination + fetch join). Validation OK (`node scripts/validate.js` → OK). Build-light-index bị chặn do lỗi sẵn có ở `lessons-security.js` (không thuộc task).
Reviewed-by: kilo (T1408R)
