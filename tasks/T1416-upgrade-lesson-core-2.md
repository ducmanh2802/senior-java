# T1416 — Nâng cấp bài học core: lesson-core-003, lesson-core-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`
After: T1404

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-core-003` "Immutable object và defensive copy" — body 2954 ký tự, 2 câu check
- `lesson-core-004` "BigDecimal cho tiền: scale, rounding và phân bổ chính xác" — body 2596 ký tự, 2 câu check

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

Nâng cấp lesson-core-003 (Immutable object & defensive copy) và lesson-core-004 (BigDecimal tiền) trong `js/data/lessons-core.js`:
- Thêm `### Cơ chế từng bước` kèm ví dụ `~~~java` ngắn (có comment), `### Lỗi hay gặp trên production` (2–4 lỗi, triệu chứng → nguyên nhân → cách sửa, không trùng phần cũ), mở rộng `### Liên hệ phỏng vấn` thành 2–3 câu hỏi + trả lời ở cuối body.
- Thay 2 câu check placeholder bằng 4 câu check bằng tiếng Việt (q, 4 options không trùng, answer, explain giải thích đúng/sai mỗi đáp án), đáp án rải các vị trí 0–3.
- Không sửa `exercises`, không xoá nội dung cũ, không đụch bài khác.
- body lesson-core-003 khoảng 6200 ký tự, lesson-core-004 khoảng 5600 ký tự (trong khoảng 4500–6500).
- Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T1416R)
