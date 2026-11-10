# T1404 — Nâng cấp bài học core: lesson-core-001, lesson-core-002

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-core-001` "Exception: ranh giới lỗi, tài nguyên và suppressed exception" — body 3745 ký tự, 2 câu check
- `lesson-core-002` "Generics và PECS: variance an toàn ở compile time" — body 3028 ký tự, 2 câu check

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
- `lesson-core-001` (Exception/try-with-resources): body ~6735 ký tự (≥4500). Đã có `### Cơ chế từng bước` (5 bước compiler, ví dụ `~~~java` FileInputStream/BufferedReader), `### Lỗi hay gặp trên production` (4 mục: retry sai loại lỗi, finally che lỗi gốc, nuốt `InterruptedException`, quy mọi lỗi thành 500), `### Liên hệ phỏng vấn` ở cuối body (3 câu hỏi). `check` 4 câu, đáp án rải vị trí 1,2,0,3; explain nêu vì sao đúng và từng phương án sai. Exercises không đổi.
- `lesson-core-002` (Generics/PECS): body ~6054 ký tự (≥4500). Đã có `### Cơ chế từng bước của wildcard (PECS)` (5 bước: capture/extends/super/PECS/erasure, ví dụ `~~~java` producer/consumer), `### Lỗi hay gặp trên production` (5 mục: `List<Object>`, raw type cast, `? extends T` để ghi, `new T[]`, comparator không nhất quán với equals), `### Liên hệ phỏng vấn` ở cuối body (3 câu hỏi). `check` 4 câu, đáp án rải vị trí 1,0,2,3. Exercises không đổi.
- Kiểm tra: `node --check js/data/lessons-core.js` OK; không có backtick/`${` trong nội dung (chỉ delimiter template). `node scripts/build-light-index.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` (chỉ cảnh báo sẵn có: `path.js` thiếu `lesson-design-006/007`). Không git commit. Chỉ sửa `js/data/lessons-core.js` và file task.
Reviewed-by: kilo (T1404R)
