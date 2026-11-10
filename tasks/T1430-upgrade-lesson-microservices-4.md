# T1430 — Nâng cấp bài học microservices: lesson-microservices-011

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T1427

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 1 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-microservices-011` "Idempotent producer: sequence number, dedup và lỗi OUT_OF_ORDER" — body 3666 ký tự, 3 câu check

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
- `lesson-microservices-011`: body mở rộng 3666 → ~9160 ký tự. Giữ nguyên phần cũ, bổ sung giải thích thuật ngữ lần đầu (timeout, broker, idempotent producer, PID, partition, sequence number, batch, fencing, ACK/ISR); thêm `### Cơ chế từng bước` (6 bước + vì sao), ví dụ `~~~java` (≤ 30 dòng, có comment) minh hoạ quyết định APPENDED/DUPLICATE/OUT_OF_ORDER; thêm `### Lỗi hay gặp trên production` (4 lỗi: triệu chứng → nguyên nhân → cách sửa); mở rộng `### Liên hệ phỏng vấn` thành 3 Q&A ngắn. Thêm 1 câu `check` (tổng 4), explain nêu đúng/sai từng phương án, đáp án đúng rải vị trí (1,2,1,1). Không sửa `exercises`/bài khác. Không backtick/`${`.
- Kiểm tra: `node --check js/data/lessons-microservices.js` OK.
- `node scripts/validate.js` (trước rebuild index) → báo OK nội dung, chỉ cảnh báo index-light cũ (do sửa lesson). `node scripts/build-light-index.js` **không chạy được** vì `js/data/q-remote.js` đang có thay đổi ngoài phạm vi task (git: `M js/data/q-remote.js`) gây lỗi VM `ReferenceError: userId is not defined` tại `q-remote.js:5977` (template literal chứa `${userId}` chưa escape trong ngữ cảnh eval). Không sửa `q-remote.js`/`index-light.js` theo luật sở hữu file; cần integrator xử lý `q-remote.js` rồi chạy lại `node scripts/build-light-index.js && node scripts/validate.js`.
Reviewed-by: kilo (T1430R)
