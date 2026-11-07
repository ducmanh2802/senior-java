# T848 — 2 bài senior: mô phỏng Kafka partition/consumer group và idempotent producer

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T814

Track **microservices**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **Partition log, offset và consumer group**: gán partition (range vs round-robin), rebalance khi thêm/bớt consumer, commit offset trước/sau xử lý → mất hoặc trùng message. Bài tập: `MiniKafka` với assign + poll + commit; test số message trùng/mất theo từng chiến lược commit.
2. **Idempotent producer**: producer id + sequence number, broker loại bản trùng khi retry, lỗi khi sequence nhảy cóc. Bài tập: `Broker.append(pid, seq, msg)` trả về APPENDED/DUPLICATE/OUT_OF_ORDER.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-microservices.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Trước khi thêm: 9 bài microservices (lesson-microservices-001..009, `grep -c "  id: 'lesson-microservices-"` = 9). Sau khi thêm: 11 (+2) — lesson-microservices-010, lesson-microservices-011.
- Thêm bằng cách chèn trước `);` cuối `js/data/lessons-microservices.js` (không sửa object cũ). `node --check` OK.
- `lesson-microservices-010` (order 10, senior, 45 phút): mô phỏng Kafka partition log + offset + commit strategy. Body giải thích cơ chế thật (topic/partition/offset, group, `enable.auto.commit`, `commitSync/commitAsync`, `auto.offset.reset`, rebalance Range/RoundRobin/CooperativeSticky, `ConsumerRebalanceListener`, giới hạn EOS Kafka), có `~~~seq`, bảng at-most/at-least/exactly-once, nêu rõ đơn giản hoá (không network/rebalance thật/auto-commit theo thời gian). Bài tập `MiniKafka.append/poll/commit/resetToCommitted`: 6 case (offset, poll advance, at-most-once mất khi crash, at-least-once trùng khi crash, group/partition độc lập, poll vượt cuối). `node scripts/test-lessons.js lesson-microservices-010` → PASS 6/6.
- `lesson-microservices-011` (order 11, senior, 40 phút): idempotent producer (PID + sequence per partition). Body giải thích cơ chế thật (`enable.idempotence`, PID, sequence, `(PID,partition)->lastSeq`, `acks=all`, `max.in.flight`, `transactional.id`, `OutOfOrderSequenceException`), có `~~~seq` và bảng APPENDED/DUPLICATE/OUT_OF_ORDER, nêu đơn giản hoá (1 partition logic, không epoch/batch/network). Bài tập `Broker.append(pid,seq,msg)`: 7 case (seq 0, in-order, duplicate retry, gap OUT_OF_ORDER, seq cũ OUT_OF_ORDER, producer độc lập, pid mới seq!=0 OUT_OF_ORDER). `node scripts/test-lessons.js lesson-microservices-011` → PASS 7/7.
- Nghiệm thu: `node scripts/build-light-index.js` (đã ghi `js/data/index-light.js`), `node scripts/validate.js` → `OK — không có lỗi.` (chỉ warning có sẵn, không thuộc file sở hữu).
- Đề xuất cho integrator: thêm `lesson-microservices-010`, `lesson-microservices-011` vào `js/data/path.js` (validate cảnh báo 33 bài học chưa nằm trong PATH, gồm 2 bài mới).
Reviewed-by: kilo (T848R)
