# T44 — Nội dung: Debug lab — Sự cố production (log + metric + trace)

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

> **Ghi theo lô nhỏ:** viết **1 lab mỗi lần edit** (artifact dài). Sau mỗi lab chạy `node --check js/data/labs-incident.js` và `node scripts/validate.js labs-incident.js`.

Đọc `AGENTS.md` mục 4–6 và **mục 10** (schema LABS) trước khi bắt đầu.

## Mục tiêu
Viết **5 lab** với `category: 'incident'`, ID từ `lab-incident-001`, mỗi lab một tình huống:
- Timeout dây chuyền giữa 3 service (log có traceId, latency từng hop, timeout cấu hình sai thứ tự)
- Retry storm làm sập dịch vụ phụ thuộc (metric RPS tăng vọt + log retry không có backoff/jitter)
- Kafka consumer lag tăng do rebalance liên tục (max.poll.interval.ms bị vượt vì xử lý chậm)
- Cache stampede khi key hot hết hạn (metric hit rate tụt + DB QPS tăng đột biến)
- Cạn file descriptor / CLOSE_WAIT do không đóng HTTP response body (ss/netstat + log Too many open files)

## Yêu cầu chất lượng (quan trọng nhất)
- Artifact phải trông **như thật**: đúng định dạng output của công cụ thật (jstack / GC log unified JDK 17 / EXPLAIN (ANALYZE, BUFFERS) PostgreSQL 15 / log JSON của Spring Boot…), có cả nhiễu (thread, dòng log không liên quan) để người học phải tự lọc.
- **Nhất quán tuyệt đối**: id, địa chỉ lock, timestamp, số liệu trong artifact phải khớp nhau và khớp với `answer`. `answer` phải trích dẫn dòng cụ thể làm bằng chứng.
- `answer` giải thích chi tiết (≥ 1500 ký tự): nguyên nhân gốc, dẫn chứng, cách sửa ngắn hạn và dài hạn, cách phòng ngừa (monitoring/alert), và những ý một Senior sẽ nói thêm.
- Bối cảnh gần với hệ thống ngân hàng, fintech, e-commerce Việt Nam (thanh toán, ví, đối soát, flash sale…).

## Nghiệm thu
`node scripts/validate.js` → OK với 5 lab. Sau đó integrator sẽ review fact-check.

## Notes
