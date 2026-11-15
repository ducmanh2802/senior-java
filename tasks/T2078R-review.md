# T2078R — Fact-check nội dung mới của T2078

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2078 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ file `js/data/labs-incident.js` (27 lab-incident từ 001 đến 027). Kết quả validation `node scripts/validate.js` in ra "OK — không có lỗi." (cảnh báo lessons không trong PATH và new-questions.js là vấn đề khác, không liên quan đến labs-incident).

Kiểm tra kỹ thuật từng lab:
- **001**: Timeout cascade, thread pool exhaustion, retry tạo paymentId mới gây double-charge — đúng.
- **002**: Retry storm amplification (mobile 3× checkout 5 = 15x max, observed ~11x), metastable failure, thundering herd tại mốc giây — đúng.
- **003**: Kafka consumer max.poll.interval.ms (500 record × 700ms = 350s > 300s), eager rebalance RangeAssignor, static membership, CooperativeStickyAssignor — đúng.
- **004**: Cache stampede hot key, TTL reset bởi SET (PX 300000), chu kỳ trôi 5min + stampede duration, 505 SET cho 1 key, @Cacheable thiếu sync=true — đúng.
- **005**: FD leak CLOSE_WAIT do HttpClient 5 không close response nhánh lỗi, pool tăng 50k che leak, Little's law 40/s × 25min ≈ 65k — đúng.
- **006–027**: Các lab còn lại (Hikari trong transaction, Kafka rebalance, ThreadLocal MDC, retry storm catalog, PostgreSQL max_connections, KEDA autoscale Kafka, Redis serializer cold cache, BFF cascade, OOMKilled native memory, rolling update 502, export job humongous allocation Full GC, CPU throttling HPA, REQUIRES_NEW nested transaction, disk full logrotate, TLS cert expired+missing intermediate, PVC Pending storageclass, Ingress 502 probe sai port, IDOR RLS off service role, LLM API key leak NEXT_PUBLIC, Agent tool loop) — đều đúng kỹ thuật, số liệu khớp artifact, giải thích cơ chế chuẩn.

Markup: dùng `{{code}}` inline, `###` header, `~~~java`/`~~~yaml`/`~~~text`/`~~~seq` code block, bảng `| |`, `> Senior tip:` — đúng chuẩn AGENTS.md §5. Không có backtick hay `${` trong template literal.

Không có lỗi kiến thức, không cần sửa nội dung.
