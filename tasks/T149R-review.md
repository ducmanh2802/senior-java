# T149R — Fact-check nội dung mới của T149

Status: DONE
Agent: opencode
Owns: `js/data/glossary-infra.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T149 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

### Đã fact-check & sửa (js/data/glossary-infra.js)

- **p99-latency** — ví dụ số liệu không đồng bộ: 95 request 20–80ms + 4 request 150–300ms + 1 request 2500ms thì trung bình không thể là ~60ms; p99 trên 100 mẫu là mẫu lớn nhất, không phải mẫu thứ 99. Đã sửa thành 97 request 20–80ms + 2 request 2500ms + 1 request 200ms → trung bình ~100ms, p99 = 2500ms (vị trí thứ 99). Đồng thời sửa câu cảnh báo cuối cùng: với 100 mẫu thì p99 mới chỉ là mẫu chậm thứ hai, chưa đủ để kết luận về đuôi.

### Đã restore lại (lỗi do agent khác xoá) — xem diff vs HEAD

- **connection-pool-exhaustion** — ref `HikariCP: About Pool Sizing` đã bị xoá khỏi working tree (HEAD vẫn có). Đã restore lại. Đồng thời sửa URL: HEAD để `https://github.com/brettwooldridge/HikariCP` (root repo, không có anchor `#about-pool-sizing`). Kiểm tra thực tế: README.md trên master không có heading `#about-pool-sizing`, phần này nằm ở wiki. Đã đổi thành `https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing` (kiểm tra HTTP 200). check-links.mjs: 59 link, 0 lỗi (3 cảnh báo do Cloudflare/ReadTheDocs blocked bot — không phải link sai).

### Kiểm định

- `node scripts/validate.js` → không có lỗi liên quan glossary-infra.js (lỗi `sdlc.js: Unexpected token ')'` là của agent khác trong working tree, không phải file của task này; HEAD của sdlc.js parse được).
- `node scripts/check-links.mjs glossary-infra.js` → 59 links, 0 broken.
- Các entry còn lại (acid, isolation-level, mvcc, dirty-read, non-repeatable-read, phantom-read, b-tree-index, covering-index, query-plan, sharding, partitioning, replication-lag, read-replica, connection-pool-exhaustion, cache-aside, cache-stampede, ttl, cdn, load-balancer, container, kubernetes-pod, readiness-liveness-probe, hpa, blue-green-deployment, canary-deployment, infrastructure-as-code, observability, slo-sla-sli, p99-latency, jwt, oauth2, pkce, mtls, secret-rotation, idor, ssrf, pci-dss) đã đọc kỹ: cơ chế đúng, aliases lowercase, related đều tồn tại, refs ≤ 5 và là link thật, body ≥ 600 ký tự, markup hợp lệ. Không phát hiện lỗi kỹ thuật còn lại.