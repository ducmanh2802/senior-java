# T855R — Fact-check nội dung mới của T855

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T855 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review và sửa nội dung mới `lesson-jvm-008` (GC thế hệ thu nhỏ: eden, survivor, tuổi object và premature promotion) trong `js/data/lessons-jvm.js` (phần diff so với HEAD). Không sửa nội dung cũ trước đó.

### Lỗi đã sửa (lesson-jvm-008)
- **Cấu trúc/body (thiếu chi tiết, khó hiểu cho người 4 năm chưa chạm GC sâu):** Viết lại `body` theo yêu cầu "giải thích từ đầu": thêm `**Tóm tắt:**`; giải thích thuật ngữ lần đầu (JVM, heap, object, GC, root/reachable, pause, fragmentation, TLAB, card table/remembered set, allocation rate, live set, memory leak, full/major GC); đi theo luồng cái gì → vì sao (weak generational hypothesis) → hoạt động thế nào (Eden/S0/S1, minor GC copy từng bước, sơ đồ ASCII `~~~text`) → promotion/age → premature promotion + ví dụ production → lỗi hay gặp → liên hệ phỏng vấn. Độ dài `body` tăng đáng kể (≥ 2500 ký tự), giữ đúng markup `{{code}}`, `~~~text`, `>`.
- **Chính xác kỹ thuật/wording:** Làm rõ promotion theo tuổi là `age > MaxTenuringThreshold` (khớp code reference/logic mô phỏng và cách HotSpot áp ngưỡng, với ghi chú adaptive tenuring). Nêu MaxTenuringThreshold tối đa 15 (4 bit header) và mặc định thường 15 — không bịa số. Bổ sung ghi chú old→young roots (card table/remembered set) để không hiểu sai minor GC. Không bịa API/flag.
- **Markup/lỗi nhỏ:** Sửa khoảng trắng thừa trong câu hỏi phỏng vấn (`" minor GC..."` → `"Minor GC..."`). Prompt exercise đổi `>= tenuringThreshold` thành `> tenuringThreshold` cho khớp hành vi/giải thích.
- **Câu kiểm tra (check):** Viết lại `explain` 3 câu theo dạng đúng/sai từng phương án, giải thích thuật ngữ (reachable, age, young/old gen, metaspace, root), tránh hiểu sai static/promotion, OOM.

### Kiểm tra
- `node --check js/data/lessons-jvm.js` → OK.
- `node scripts/test-lessons.js` → `Lesson exercises OK: 212/212 (189 bài học, 212 từ cache)` (không thay đổi `starter/tests/reference` của exercise; code vẫn pass).
- `node scripts/build-light-index.js` → đã cập nhật `js/data/index-light.js` (bắt buộc khi sửa bài học) để `validate` không báo cũ.
- `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo sẵn có ngoài phạm vi: `q-java.js: modern-033` đáp án ngắn).

### Lưu ý phạm vi
Repo có nhiều file modified/untracked từ trước (không thuộc T855R). Tôi **chỉ sửa** `js/data/lessons-jvm.js` và chạy `build-light-index.js` (tạo/cập nhật `js/data/index-light.js` theo yêu cầu AGENTS.md mục 6 khi sửa bài học). Không commit/push, không kill process, không mở browser.
