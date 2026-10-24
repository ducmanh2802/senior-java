# T125R — Fact-check nội dung mới của T125

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T125 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 8 câu mới (api-015..api-022), fact-check bằng nguồn: Adyen **có thực sự hỗ trợ `Idempotency-Key`** (docs.adyen.com/development-resources/api-idempotency) và RFC 9745 (Deprecation header, 2025) đều **đúng thực tế** — giữ nguyên. KHÔNG thấy API/flag bịa, cơ chế nói ngược, hay ký tự nước ngoài lạ (validate.js ổn).

Lỗi đã sửa trực tiếp (từng id):
- **api-016**: câu "404 khiến client tưởng lỗi tạm thời và retry" trên thực tế client không tự retry 404, nhưng hành xử khó đoán — viết lại: 404 làm client tưởng endpoint chưa từng tồn tại (URL sai) và không biết bước tiếp theo, 410 Gone là tín hiệu "đã bỏ vĩnh viễn" kèm Link migration guide.
- **api-017**: bảng cạm bẫy "Postgres lưu microsecond, JSON/JS chỉ milli → lệch" → "JS `Date` chỉ milli" (JSON có đủ micro nếu dùng string/epoch micro; lệch thực tế là do JS `Date` và thiếu tie-breaker).
- **api-018**: ví dụ HTTP ghi `422 Unprocessable Entity` → đổi thành `Unprocessable Content` (RFC 9110 đã đổi tên; nhất quán với api-002 HEAD đã dùng tên chuẩn).
- **api-019**: bảng cạm bẫy "O(request) mỗi key" vô nghĩa → "1 entry mỗi request trong cửa sổ".
- **api-021**: sửa "không streaming (trừ SSE)" thành "streaming phải bọc bằng SSE/WebSocket riêng chứ không native như gRPC" (HTTP vẫn stream được qua chunked, không đúng khi nói "không streaming"). Sửa "(đo được 30–60% với DTO lớn)" thành "(thường thấy 30–60%)" — con số ước lượng, không claim tuyệt đối.
Lỗi khác: không có (các claim RFC 8594, RFC 9110, draft IETF RateLimit headers, RFC 9457 đều khớp nguồn thật).

### Nghiệm thu
- `node scripts/validate.js` → "OK — không có lỗi." (trọn bộ, không có error; các warning chỉ là đáp án ngắn của q-english.js, KHÔNG thuộc phạm vi file này)
- `node --check js/data/q-api.js` → pass.
- Chỉ `js/data/q-api.js` thay đổi của agent này (các file còn lại modified là công việc của agent khác đang chạy song song).
