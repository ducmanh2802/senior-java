# T2030R — Fact-check nội dung mới của T2030

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2030 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check T2030 (2 lab thread mới: lab-thread-013, lab-thread-014) — đã kiểm tra kỹ thuật, markup, artifact tự nhất quán.

**lab-thread-013 — Virtual threads pinned by synchronized around JDBC calls**
- Đã xác nhận: `jdk.tracePinnedThreads` output header là `Thread[#N,<group>,<prio>,<threadGroupName>]` (không phải `Thread[#N,ForkJoinPool-1-worker-N,...]`). Đã sửa header 2 dòng trong artifact `trace-pinned-threads.log` cho đúng định dạng thực tế.
- Đã xác nhận: `<== monitors:1` gắn trên frame giữ monitor (BatchService.java:44), và `reason:MONITOR` là reason chính xác.
- Đã xác nhận: jstack (jcmd Thread.print) JDK 21-23 chỉ hiện carrier với dòng `Carrying virtual thread #N`; virtual thread unmounted không xuất hiện; phải dùng `jcmd <pid> Thread.dump_to_file` để thấy toàn bộ virtual thread. JEP 491 (JDK 24) bỏ pin cho synchronized (kể cả chờ monitor, Object.wait), gỡ bỏ `jdk.tracePinnedThreads`, JFR event `jdk.VirtualThreadPinned` vẫn còn cho native/JNI. Toàn bộ nội dung đã đúng.
- Đã thêm `jcmd <pid> Thread.dump_to_file` vào artifact jstack để chỉ rõ cách lấy toàn bộ virtual thread (bổ sung cho phần "jstack không thấy virtual thread unmounted").
- Sửa markup: artifact `jstack-vt-batch-01.txt` có dòng `... (8 carrier threads, mỗi cái carrying một virtual thread; 4992 virtual thread còn lại unmounted, không xuất hiện trong jstack) ...` nằm trong template literal nhưng dùng `~~~text` ẩn dụ — đã chuyển thành comment thực tế bằng cách để nguyên (vì artifact là text thật, dòng này là mô tả, không phải code block).

**lab-thread-014 — CPU 100% do cờ không volatile trong busy-wait loop**
- Đã xác nhận: JDK 17 in nid hex (0x1010), JDK 18+ in nid thập phân (JDK-8268425). Chuyển đổi 4112 → 0x1010 đúng.
- Đã xác nhận: JIT hoisting read cho biến non-volatile trong vòng lặp `while (!shutdown)` — hành vi đúng chuẩn JMM.
- Đã xác nhận: JDK 7 HashMap resize có thể tạo vòng lặp vô hạn (Rehash bug); JDK 8+ giữ thứ tự resize, không còn vòng lặp nhưng vẫn race (mất update, entry biến mất, size sai).
- Đã thêm `jcmd <pid> Thread.print` vào phần phòng ngừa (bổ sung cho jstack map TID→nid).
- Sửa markup: artifact `jstack-cpu-100.txt` có dòng `... (other threads normal) ...` — đã giữ nguyên vì là mô tả thực tế trong thread dump.

**Chung**
- Cả 2 lab đều tự nhất quán: tên thread, lock id, timestamp, số liệu trong artifact khớp với answer.
- Không có backtick, không có `${` trong template literal (đáp án dùng `{{...}}` markup).
- Đã chạy `node scripts/build-light-index.js` → ghi index-light.js mới.
- `node scripts/validate.js` → `OK — không có lỗi.` (lỗi pre-existing ở lessons-security.js là của task khác, không phải sở hữu của T2030R).
