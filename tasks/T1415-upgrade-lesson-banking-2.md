# T1415 — Nâng cấp bài học banking: lesson-banking-003, lesson-banking-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T1403

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-banking-003` "Hạn mức và kiểm tra rủi ro cơ bản" — body 3380 ký tự, 2 câu check
- `lesson-banking-004` "Khoản vay trả góp: dư nợ, lãi giảm dần, trả đều hằng tháng" — body 3212 ký tự, 2 câu check

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
Nâng cấp lesson-banking-003 (body 3382→6036 ký tự) và lesson-banking-004 (body 3214→5680 ký tự): bổ sung `### Cơ chế từng bước`, ví dụ `~~~java` ≤ 30 dòng có comment, `### Lỗi hay gặp trên production` (4 lỗi: triệu chứng → nguyên nhân → cách sửa), giữ `### Liên hệ phỏng vấn` ở cuối body với 3 câu hỏi mỗi bài. `check` tăng từ 2 lên 4 câu mỗi bài (4 options, đáp án rải vị trí 0/1/3 và 0/1/3/2, explain giải thích đúng/sai từng phương án). Không sửa `exercises`, không đụng bài khác. `node scripts/build-light-index.js` + `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1415R)
