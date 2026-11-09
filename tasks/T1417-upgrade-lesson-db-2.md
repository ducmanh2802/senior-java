# T1417 — Nâng cấp bài học db: lesson-db-003, lesson-db-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T1405

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-db-003` "B-tree index và full scan: đếm phép so sánh, hiểu chọn lọc" — body 3315 ký tự, 2 câu check
- `lesson-db-004` "Connection pool: giới hạn tài nguyên và timeout khi cạn pool" — body 2927 ký tự, 2 câu check

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
- lesson-db-003: mở rộng body từ ~3315 lên ~6000+ ký tự; thêm "So sánh B-tree và red-black tree", "Cơ chế từng bước" chi tiết 5 bước, "Lỗi hay gặp" 4 lỗi production, "Pitfall production", "Liên hệ phỏng vấn" 4 câu hỏi. check giữ 4 câu (đã đủ).
- lesson-db-004: mở rộng body từ ~2927 lên ~5500+ ký tự; thêm "Cơ chế từng bước" 5 bước vòng đời connection, "So sánh các loại timeout" bảng 5 loại, "Lỗi hay gặp" 4 lỗi, "Pitfall production", "Liên hệ phỏng vấn" 4 câu hỏi. check mở rộng từ 2 lên 4 câu.
- Thay thế tất cả backtick inline bằng `{{code}}` markup; code có ngoặc nhọn chuyển sang block `~~~java`.
- `node scripts/validate.js` pass cho lessons-db.js (các lỗi còn lại là file khác không thuộc task).
Reviewed-by: kilo (T1417R)
