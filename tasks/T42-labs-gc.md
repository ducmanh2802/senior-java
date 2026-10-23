# T42 — Nội dung: Debug lab — GC log / heap / OOM

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

> **Ghi theo lô nhỏ:** viết **1 lab mỗi lần edit** (artifact dài). Sau mỗi lab chạy `node --check js/data/labs-gc.js` và `node scripts/validate.js labs-gc.js`.

Đọc `AGENTS.md` mục 4–6 và **mục 10** (schema LABS) trước khi bắt đầu.

## Mục tiêu
Viết **5 lab** với `category: 'gc'`, ID từ `lab-gc-001`, mỗi lab một tình huống:
- G1 GC log JDK 17 có humongous allocation dẫn tới Full GC (export file lớn thành byte[])
- Memory leak thấy qua 2 lần jmap -histo tăng dần (cache static không giới hạn / listener không gỡ)
- Metaspace OOM do classloader leak (tạo dynamic proxy hoặc Groovy script mỗi request)
- Container bị OOMKilled dù heap chưa đầy: MaxRAMPercentage + direct memory (Netty) + thread stack
- Allocation rate quá cao làm young GC dày đặc, p99 tăng (GC log + tóm tắt JFR)

## Yêu cầu chất lượng (quan trọng nhất)
- Artifact phải trông **như thật**: đúng định dạng output của công cụ thật (jstack / GC log unified JDK 17 / EXPLAIN (ANALYZE, BUFFERS) PostgreSQL 15 / log JSON của Spring Boot…), có cả nhiễu (thread, dòng log không liên quan) để người học phải tự lọc.
- **Nhất quán tuyệt đối**: id, địa chỉ lock, timestamp, số liệu trong artifact phải khớp nhau và khớp với `answer`. `answer` phải trích dẫn dòng cụ thể làm bằng chứng.
- `answer` giải thích chi tiết (≥ 1500 ký tự): nguyên nhân gốc, dẫn chứng, cách sửa ngắn hạn và dài hạn, cách phòng ngừa (monitoring/alert), và những ý một Senior sẽ nói thêm.
- Bối cảnh gần với hệ thống ngân hàng, fintech, e-commerce Việt Nam (thanh toán, ví, đối soát, flash sale…).

## Nghiệm thu
`node scripts/validate.js` → OK với 5 lab. Sau đó integrator sẽ review fact-check.

## Notes
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
