# T1406 — Nâng cấp bài học design: lesson-design-001, lesson-design-002

Status: DONE
Agent: kilo
Owns: `js/data/lessons-design.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-design-001` "Rate limiter: token bucket và sliding window log" — body 3827 ký tự, 2 câu check
- `lesson-design-002` "Cache eviction: LRU và LFU" — body 3400 ký tự, 2 câu check

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
- Lesson 001: Body mở rộng từ ~3827 → ~7855 ký tự. Thêm: `### Cơ chế từng bước` (token bucket & sliding log), ví dụ `~~~java` TokenBucket skeleton, `### Lỗi hay gặp trên production` (5 lỗi: wall clock, quên clamp, key IP sau proxy, replica local, token cost không phân biệt). `### Liên hệ phỏng vấn` giữ nguyên + thêm 3 câu hỏi. Check từ 2 → 4 câu (thêm: clock monotonic, sliding log memory).
- Lesson 002: Body mở rộng từ ~3400 → ~8972 ký tự. Thêm: `### Cơ chế từng bước` (LRU LinkedHashMap & LFU chi tiết), ví dụ `~~~java` Mini LRU skeleton, `### Lỗi hay gặp trên production` (6 lỗi: quên synchronized, LFU không aging, stampede, capacity theo entry, invalidation mất message, null ambiguity). `### Liên hệ phỏng vấn` giữ nguyên + thêm 3 câu hỏi. Check từ 2 → 4 câu (thêm: LFU aging, cache stampede).
- `node scripts/build-light-index.js` → OK. `node scripts/validate.js` → OK (chỉ cảnh báo lesson-design-006,007 không trong PATH, không liên quan).
- Chỉ sửa file `js/data/lessons-design.js`, không đụng exercises, không sửa file khác.
Reviewed-by: kilo (T1406R)
