# T1267R — Fact-check nội dung mới của T1267

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1267 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đối chiếu `git diff HEAD -- js/data/q-claude.js` (18 dòng thêm, 6 hunk): nội dung mới chỉ là thêm mục `### Ví dụ đời thực` cho `claude-007`…`claude-012`. Không phát hiện nội dung mới khác; không sửa phần đã có ở HEAD.
- `node --check js/data/q-claude.js`: OK (cú pháp).
- Kiểm tra markup/luật template literal: không có backtick (`` ` ``) và không có `${` trong file (`grep -nP '`|\$\{'` chỉ thấy `{{...}}` và giá tiền `$...`).
- Fact-check kỹ thuật nội dung mới (không sửa vì không thấy lỗi kỹ thuật/cơ chế ngược/số liệu vô căn cứ so với tài liệu Claude API hiện hành và nhất quán với phần còn lại của file):
  - `claude-007` (prompt caching): cache khớp prefix từng byte; timestamp (`LocalDateTime.now()`) trong system prompt làm vỡ cache; khắc phục chuyển thời gian vào user message + CI assert SHA-256 prefix; `cache_read_input_tokens`/tỉ lệ chiếm input đúng hướng.
  - `claude-008` (Batch API): bất đồng bộ, phần lớn trong ~1h (tối đa 24h), giá ~50%, 100.000 request / 256 MB mỗi batch, `custom_id` để ghép (không đảm bảo thứ tự), poll `processing_status=ended`, request errored/expired xử lý lại, kết quả giữ 29 ngày, idempotent theo `custom_id` — đúng.
  - `claude-009` (structured outputs): schema đảm bảo hình dạng, không đảm bảo giá trị hợp lý; ví dụ `total` âm qua validation nghiệp vụ (Bean Validation `@Positive`), audit bản JSON gốc + phiên bản prompt/model — đúng.
  - `claude-010` (ước lượng chi phí): dùng mẫu thật + `count_tokens`; công thức tính MTok và ví dụ Haiku/Sonnet/Opus 5.5 nhất quán với bảng giá trong chính file (`claude-010` bảng, `claude-011` mô tả: Haiku 0.10/0.50, Sonnet 2/10, Opus 4/20) và file đã ghi chú "giá theo bảng hiện hành; kiểm tra trang Pricing"; đòn bẩy Batch/caching/eval đúng.
  - `claude-011` (chọn model): routing Haiku/Sonnet/Opus theo eval + chi phí/tác vụ/p95 nhất quán với phần so sánh model trong file; không bịa API.
  - `claude-012` (thinking/effort): adaptive thinking + `output_config.effort`; không tắt thinking trên Opus 5.5 (trả 400), hạ effort thay vì tắt — nhất quán với `claude-012` gốc (dòng vùng 721/727/730 trong file) và claim hiện có.
- Không thêm/xoá mục; không sửa nội dung đã có ở HEAD.
- `node scripts/build-light-index.js`: không chạy được do lỗi cú pháp có sẵn ở file khác (`js/data/lessons-jpa.js` / ngữ cảnh load) — ngoài phạm vi sở hữu task (chỉ `q-claude.js`).
- `node scripts/validate.js`: CHƯA đạt `OK — không có lỗi.` vì lỗi có sẵn ngoài phạm vi sở hữu: `lessons-jpa.js`/`lessons-security.js` lỗi cú pháp/chạy, `projects.js`/`path.js` tham chiếu lesson không tồn tại, `index-light.js` đã cũ. Không có lỗi nào trỏ vào `js/data/q-claude.js`. Cần agent/integrator sở hữu các file đó sửa rồi chạy lại validate + rebuild index-light.
- `node scripts/test-lessons.js`: không chạy (task là fact-check câu hỏi `q-claude.js`, không phải bài học; lỗi lessons ngoài phạm vi).
