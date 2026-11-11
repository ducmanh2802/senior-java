# T1429 — Nâng cấp bài học devops: lesson-devops-018, lesson-devops-019

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T1426

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-devops-018` "Pipeline như code: đồ thị phụ thuộc (DAG), chạy song song và phát hiện vòng lặp" — body 3422 ký tự, 3 câu check
- `lesson-devops-019` "Quality gate: chặn merge theo ngưỡng coverage, lỗ hổng và ngoại lệ có hạn dùng" — body 2669 ký tự, 3 câu check

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
- Both lessons upgraded per spec: added "Cơ chế từng bước" with step-by-step explanation, Java code examples, "Lỗi hay gặp trên production" (4 errors each), "Liên hệ phỏng vấn" (3 questions each), and 4th check question each.
- Fixed markup issues: replaced backticks with `{{...}}`, escaped `${{` in code blocks as `\${{`.
- `node scripts/validate.js` passes for lessons-devops.js (no errors).
- `node scripts/build-light-index.js` fails due to pre-existing syntax errors in lessons-jpa.js, lessons-microservices.js, lessons-db.js, lessons-sql.js, lessons-testing.js, projects.js — not owned by this task.
Reviewed-by: kilo (T1429R)
