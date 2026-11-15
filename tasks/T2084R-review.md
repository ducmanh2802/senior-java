# T2084R — Fact-check nội dung mới của T2084

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2084 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã rà soát nội dung mới của T2084 (diff HEAD) trong `js/data/q-system-design.js`: các mục thêm mới `design-049`, `design-050`, `design-051`, `design-052`.
- Lỗi đã sửa (chính tả/tiếng Việt lẫn không dấu + lỗi code/markup, không đổi ý kiến thức hay bố cục):
  - `design-049`: sửa toàn bộ phần câu trả lời bị viết không dấu/typo (`Tao ban ghi`→`Tạo bản ghi`, `trang thai`→`trạng thái`, `su kien`→`sự kiện`, `Outbox` text, bảng trade-off, pitfall, ví dụ, trả lời mẫu, tip); sửa code ví dụ `send` từ `void`+`return` (sai cú pháp ý nghĩa) thành `Result send` trả `Result`; chuẩn hóa comment và từ ngữ (dedupe, retry, backoff/jitter, merchant reference) giữ đúng kỹ thuật outbox+idempotency.
  - `design-050`: sửa text không dấu toàn phần trả lời (thuật toán fixed/sliding/token bucket, Lua script nguyên tử, 429+Retry-After, fail-open/fail-close, thundering herd, cardinality/TTL) và chuẩn hóa bảng so sánh/tiếng Việt; giữ nguyên cơ chế kỹ thuật.
  - `design-051`: sửa text không dấu và lỗi chữ (`conexion DB bi tac`→`kết nối DB bị tắc`); làm rõ điều kiện `UPDATE ... WHERE available >= quantity` nhất quán với tóm tắt/code; chuẩn hóa HOLD/TTL/reconciliation/idempotency; giữ đúng logic chống oversell.
  - `design-052`: sửa text không dấu (base62, collision/va chạm, cache hot key, Kafka batch click, local cache/shard); chuẩn hóa ví dụ và trade-off tạo mã ngắn, giữ đúng cơ chế redirect nhanh + đếm click bất đồng bộ.
- Kiểm tra: `node --check js/data/q-system-design.js` OK. `node scripts/validate.js` vẫn báo các LỖI có sẵn ở file ngoài phạm vi sở hữu (`new-questions.js`, `q-banking.js`, `bugs.js`, `lessons-banking.js`, `path.js`, `index-light.js`) — không thuộc `js/data/q-system-design.js`, không sửa theo luật task.
- Không chạy git commit/push, không mở trình duyệt, không kill tiến trình.
