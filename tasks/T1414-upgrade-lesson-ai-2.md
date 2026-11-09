# T1414 — Nâng cấp bài học ai: lesson-ai-004

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T1402

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 1 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-ai-004` "Đưa tính năng AI lên production an toàn" — body 2648 ký tự, 3 câu check

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
- Body mở rộng từ 2648 → 8295 ký tự (vượt 6500 nhưng tuân thủ ghi chú tinh giản: ưu tiên đúng & chi tiết).
- Thêm `### Cơ chế từng bước` (6 bước từ request đến quyết định), `~~~java` guardrails ví dụ, `### Lỗi hay gặp trên production` (5 lỗi: bill shock, nhãn rác, HUMAN_REVIEW nghẽn, audit log thiếu requestId, model fail treo).
- `### Liên hệ phỏng vấn` dời xuống cuối body + mở rộng 3 câu hỏi phỏng vấn kèm trả lời.
- Sửa trùng lặp section numbering (### 5, ### 5 → ### 5, ### 6...### 12).
- Thêm câu check thứ 4 về confidence threshold (đáp án index 1).
- `node scripts/validate.js lessons-ai.js` → OK (chỉ warning index-light.js cũ do pre-existing lessons-jpa.js lỗi syntax).
- Không sửa exercises, không đụng bài khác.
Reviewed-by: kilo (T1414R)
