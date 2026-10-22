# T54 — Nội dung: Tình huống thực tế (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `scenario`: thêm 10 câu (đang có 31 → mục tiêu ≥ 41)
- Sau khi DB failover, app vẫn lỗi kết nối vài phút: DNS cache JVM ({{networkaddress.cache.ttl}}), pool giữ connection chết
- RSS của container tăng dù heap ổn định: glibc malloc arenas ({{MALLOC_ARENA_MAX}}), direct memory, thread
- Batch import tạo bản ghi trùng do 2 request chạy song song: race condition, unique constraint, upsert
- Bug lệch tiền do làm tròn khi chia phí/lãi cho nhiều kỳ: phân bổ phần dư, BigDecimal
- Chứng chỉ SSL của đối tác hết hạn / đổi CA làm sập tích hợp: truststore, giám sát hạn chứng chỉ
- JWT bị từ chối ngẫu nhiên do lệch đồng hồ giữa các server: clock skew, NTP, leeway
- Redis đầy bộ nhớ, eviction xoá mất session/lock: maxmemory-policy, tách cluster theo mục đích
- Dữ liệu Elasticsearch lệch so với DB: đồng bộ bằng CDC (Debezium), reindex không downtime
- Chi phí log tăng vọt sau một release: log level, sampling, structured logging, PII trong log
- Thread pool của Tomcat cạn vì gọi blocking tới service chậm: chẩn đoán và cách cô lập

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
