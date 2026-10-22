# T41 — Nội dung: Debug lab — Thread dump (jstack)

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

> **Ghi theo lô nhỏ:** viết **1 lab mỗi lần edit** (artifact dài). Sau mỗi lab chạy `node --check js/data/labs-thread.js` và `node scripts/validate.js labs-thread.js`.

Đọc `AGENTS.md` mục 4–6 và **mục 10** (schema LABS) trước khi bắt đầu.

## Mục tiêu
Viết **5 lab** với `category: 'thread'`, ID từ `lab-thread-001`, mỗi lab một tình huống:
- Deadlock giữa 2 lock (ví dụ chuyển tiền giữa 2 ví khoá theo thứ tự ngược nhau)
- Connection pool cạn: nhiều thread chờ HikariPool.getConnection, thủ phạm giữ connection khi gọi HTTP ngoài
- Lock contention trên synchronized làm throughput thấp dù CPU rảnh
- Virtual thread bị pin (Java 21) do synchronized bao quanh IO; dump bằng jcmd Thread.dump_to_file
- CPU 100%: top -H ra TID, đổi sang hex khớp nid trong dump, thread kẹt vòng lặp (ví dụ HashMap dùng đồng thời hoặc regex backtracking)

## Yêu cầu chất lượng (quan trọng nhất)
- Artifact phải trông **như thật**: đúng định dạng output của công cụ thật (jstack / GC log unified JDK 17 / EXPLAIN (ANALYZE, BUFFERS) PostgreSQL 15 / log JSON của Spring Boot…), có cả nhiễu (thread, dòng log không liên quan) để người học phải tự lọc.
- **Nhất quán tuyệt đối**: id, địa chỉ lock, timestamp, số liệu trong artifact phải khớp nhau và khớp với `answer`. `answer` phải trích dẫn dòng cụ thể làm bằng chứng.
- `answer` giải thích chi tiết (≥ 1500 ký tự): nguyên nhân gốc, dẫn chứng, cách sửa ngắn hạn và dài hạn, cách phòng ngừa (monitoring/alert), và những ý một Senior sẽ nói thêm.
- Bối cảnh gần với hệ thống ngân hàng, fintech, e-commerce Việt Nam (thanh toán, ví, đối soát, flash sale…).

## Nghiệm thu
`node scripts/validate.js` → OK với 5 lab. Sau đó integrator sẽ review fact-check.

## Notes
