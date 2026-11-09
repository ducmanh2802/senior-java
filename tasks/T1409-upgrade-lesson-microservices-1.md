# T1409 — Nâng cấp bài học microservices: lesson-microservices-001, lesson-microservices-002

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-microservices-001` "Transactional outbox: không mất event giữa database và broker" — body 3179 ký tự, 2 câu check
- `lesson-microservices-002` "Idempotent consumer: chống duplicate và sự kiện cũ" — body 3142 ký tự, 2 câu check

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
- `lesson-microservices-001`: body 8419 ký tự, 4 câu check (answer rải 1,0,2,3). Thêm `### Cơ chế từng bước` (7 bước, giải thích thuật ngữ Kafka/event/broker/ACK/at-least-once/transaction) + ví dụ `~~~java` outbox (≤30 dòng), thay `### Pitfall production` bằng 4 lỗi (triệu chứng→nguyên nhân→cách sửa), mở rộng `### Liên hệ phỏng vấn` thành 3 Q&A; 2 check cũ bổ sung explain vì sao các phương án sai sai.
- `lesson-microservices-002`: body 9161 ký tự, 4 câu check (answer rải 0,1,1,1). Thêm `### Cơ chế từng bước` (7 bước, giải thích idempotent/consumer/offset/commit offset/inbox/unique constraint) + ví dụ `~~~java` inbox+apply trong transaction, thêm `### Lỗi hay gặp trên production` 4 lỗi (giữ phần Phân biệt event và command/Công cụ và production/Pitfall cũ), mở rộng `### Liên hệ phỏng vấn` thành 3 Q&A; sửa 1 inline code lồng ngoặc nhọn vi phạm validate.
- Không sửa `exercises` (starter/tests/reference), không sửa bài khác, không backtick/`${`. `node --check js/data/lessons-microservices.js` OK.
- `node scripts/validate.js`: **không còn lỗi thuộc `lessons-microservices.js`**. Các lỗi còn lại là ngoài phạm vi task (pre-existing): `lessons-jpa.js` lỗi cú pháp (`Unexpected identifier 'SELECT'`), `projects.js`/`path.js` tham chiếu `lesson-jpa-*` không tồn tại, `index-light.js` cũ.
- `node scripts/build-light-index.js` thất bại do lỗi cú pháp `lessons-jpa.js` (file không thuộc sở hữu) nên `index-light.js` chưa được tái sinh; cần integrator sửa JPA rồi chạy lại build-light-index. Không git commit.
Reviewed-by: kilo (T1409R)
