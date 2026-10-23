# T84 — Bài học: Concurrency

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-concurrency.js`, `node scripts/validate.js lessons-concurrency.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **5 bài học** cho track `concurrency`, `order` từ 1, ID `lesson-concurrency-001` trở đi:
1. Java Memory Model: visibility, volatile, happens-before — bài tập: sửa cờ dừng thread không bao giờ dừng (dùng volatile), test có timeout
2. synchronized vs ReentrantLock vs Atomic — bài tập: tài khoản chuyển tiền đồng thời không mất tiền và không deadlock (khoá theo thứ tự id)
3. ExecutorService và thread pool: sizing, bounded queue, rejection — bài tập: xử lý 1.000 job với pool cố định, thu kết quả bằng invokeAll, shutdown đúng cách
4. CompletableFuture: thenCompose/thenCombine/allOf, xử lý lỗi, timeout — bài tập: gọi 3 nguồn giá song song, lấy kết quả tốt nhất, fallback khi một nguồn lỗi
5. Virtual threads (Java 21): mount/unmount, pinning, khi nào có lợi — body dạy Java 21; **bài tập phải biên dịch với Java 17**: viết hàm nhận một `ExecutorService` bất kỳ (test truyền pool thường), chạy 10.000 tác vụ IO giả lập và gom kết quả đúng; `Executors.newVirtualThreadPerTaskExecutor()` chỉ xuất hiện trong body/explain

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes
- Hoàn thành bởi agent Claude: 5 bài, 16 bài tập (3 lần chạy đều pass; đã thử lời giải sai: test bắt được deadlock và race).
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
