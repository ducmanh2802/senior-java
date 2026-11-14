# T2069R — Fact-check nội dung mới của T2069

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2069 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lab-thread-015`: Sửa mô tả cơ chế deadlock PostgreSQL sai kỹ thuật: `SELECT ... WHERE id IN (?, ?) FOR UPDATE` không đảm bảo khóa theo thứ tự tham số (thứ tự khóa phụ thuộc kế hoạch thực thi/quét index và PostgreSQL có thể khóa từng hàng khi chạm tới). Điều chỉnh scenario/questions/hints/answer + artifact `TransferService.java` để khóa từng ví theo thứ tự `walletId` tăng dần bằng hai `SELECT ... FOR UPDATE` riêng, khớp với log PostgreSQL (mỗi process chờ khi UPDATE hàng còn lại); loại bỏ claim sai "tuân theo mảng tham số". Cập nhật artifact `jstack-transfer-deadlock.txt` cho nhất quán (thread chờ tại `executeQuery` của `lockWallet`). Giữ bối cảnh/ý chính bài lab.
- `lab-thread-016`: Sửa mâu thuẫn cơ chế rò rỉ ThreadLocal. Artifact cũ dùng `ThreadLocal` static final + `supplyAsync(..., asyncPool)` nhưng giải thích "120 entry/thread do key khác nhau / InheritableThreadLocal copy sang ForkJoinPool.commonPool" là sai (static key chỉ 3 entry, có truyền executor nên không chạy commonPool). Chỉnh `AsyncProcessingService.java` để tạo `new ThreadLocal<>()` cục bộ mỗi task và `set` trên `asyncPool` không `remove()` → sinh nhiều key/entry stale tích lũy trong `ThreadLocalMap` của 10 thread pool; cập nhật MAT/histogram (Entry trên `async-pool-*`), scenario, hints, answer, rubric cho nhất quán và đúng cơ chế GC ThreadLocal (weak key, value còn giữ mạnh tới khi expunge). Bỏ chữ Hàn lẫn ("쌓"). `node scripts/validate.js` → OK.
