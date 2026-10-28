# T331 — JWT vs session (cửa sổ thu hồi), IDOR, và playbook OOM

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`, `js/data/q-concurrency-jvm.js`

Áp dụng đúng mục "Nguồn tham khảo và bản quyền" và "Bước 1: chống trùng" trong `tasks/T329-db-internals-zemit.md`. Các bài ZemIT về chủ đề này là bài trả phí: chỉ lấy tên chủ đề, tự viết nội dung, `refs` trỏ tới OWASP / docs Spring / docs Oracle JDK.

**`js/data/q-security.js`** (topic `security`), tối đa 3 câu:
- JWT hay session: tiêu chí chọn là **cửa sổ thu hồi** nghiệp vụ chấp nhận được. Gồm:
  - access token ngắn hạn + refresh token xoay vòng (rotation, phát hiện reuse);
  - denylist bằng jti trong Redis;
  - session có lưu trạng thái;
  - chi phí của mỗi cách;
  - đăng xuất mọi thiết bị.
- ID trên URL: IDOR / BOLA (OWASP API Security Top 10, API1), enumeration với ID tuần tự. Cách phòng:
  - kiểm tra quyền theo owner ở tầng service (không chỉ ẩn ID);
  - lớp dịch ID tại API boundary (public id / Hashids / UUID);
  - test tự động cho quyền.

**`js/data/q-concurrency-jvm.js`** (topic `jvm`), tối đa 2 câu:
- OOM từ code "tưởng vô hại":
  - Nguyên nhân hay gặp: regex catastrophic backtracking trên log lớn, đọc cả file/result set vào bộ nhớ, cache không giới hạn, ThreadLocal rò rỉ, direct buffer / metaspace.
  - Phân biệt các loại OutOfMemoryError theo thông điệp.
- Playbook cấp cứu OOM trên production:
  - Cờ JVM: `-XX:+HeapDumpOnOutOfMemoryError`, `-XX:HeapDumpPath`, `-XX:+ExitOnOutOfMemoryError`.
  - Đọc heap dump bằng Eclipse MAT (dominator tree, leak suspects).
  - Native Memory Tracking cho bộ nhớ ngoài heap.
  - Theo dõi container memory limit so với heap (MaxRAMPercentage).
  - Continuous profiling (JFR, async-profiler).
  - Metric và alert cần có trước khi sự cố xảy ra.

Chuẩn đáp án như AGENTS.md mục 6. Ghi file theo đợt, sau mỗi đợt chạy `node --check` + `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Thêm security-023 (lead: session vs JWT theo cửa sổ thu hồi, refresh rotation + reuse detection, logout mọi thiết bị, chi phí), security-024 (senior: BOLA/ID tuần tự, owner check, lớp dịch ID public_id/UUID/Hashids, test ma trận quyền).
- Thêm jvm-026 (senior: OOM do allocation spike từ code "vô hại", regex backtracking vs OOM, bảng thông điệp OOM), jvm-027 (lead: playbook OOM 4 pha: chuẩn bị/cấp cứu/thu thập/phân tích/phòng ngừa).
- Chống trùng: security-003/017 (thu hồi JWT, denylist jti), security-008 (ownership check), q-api session vs JWT, q-soft test IDOR, jvm-004/005 (loại OOM, leak), MAT/NMT/flags baseline đã có, nên câu mới đi theo góc khác (quyết định theo cửa sổ thu hồi, enumeration + lớp dịch ID, spike vs leak, quy trình sự cố) và chỉ dùng 2/3 câu security.
- Không dùng nội dung ZemIT (bài trả phí); refs chỉ trỏ OWASP, RFC 9700, docs Spring/Oracle, MAT, async-profiler. check-links: đã bỏ 1 link 404 (OWASP JWT for Java cheat sheet); cả hai file 0 link hỏng. validate OK.
Reviewed-by: claude (subagent; validate OK, check-links 0 broken; Boot/Micrometer names spot-checked)
