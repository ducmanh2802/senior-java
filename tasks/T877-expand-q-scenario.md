# T877 — Mở rộng 8 đáp án ngắn trong q-scenario

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`

Validator báo các câu dưới đây có đáp án **quá ngắn (< 1500 ký tự)**, nên người học không tự ôn được. Viết lại field `a` của từng câu theo chuẩn AGENTS.md mục 6, giữ đúng ý câu hỏi `q` hiện có:

**Id cần mở rộng:** `scenario-109`, `scenario-110`, `scenario-111`, `scenario-112`, `scenario-113`, `scenario-114`, `scenario-115`, `scenario-116`

Mỗi đáp án mới:
- Mở đầu `**Tóm tắt:**` (1–2 câu trả lời miệng 30 giây).
- `###` cơ chế bên trong hoạt động thế nào và **vì sao** (từng bước, như dạy người mới), ví dụ cụ thể (code ≤ 30 dòng có comment, số liệu, `~~~seq` nếu luồng nhiều bên), bảng so sánh/trade-off, khi nào dùng / không dùng, pitfall production.
- Kết bằng `> Senior tip:` có số liệu/kinh nghiệm thật.
- **1800–4000 ký tự**. Giữ những gì đáp án cũ đã đúng; sửa chỗ sai (nếu thấy) và ghi vào Notes.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành; không bịa API. Không backtick, không `${`.
- Câu tình huống: trình bày như xử lý sự cố thật: triệu chứng → giả thuyết → lệnh/metric kiểm tra → nguyên nhân → sửa ngắn hạn/dài hạn → phòng ngừa.
Chạy `node scripts/validate.js`: các id trên **không còn** cảnh báo "đáp án ngắn". Ghi Notes: id nào sửa lỗi gì.

> **CHỈ SỬA ĐÚNG CÁC ID LIỆT KÊ:** với mỗi id dưới đây, chỉ thay nội dung field `a` (và thêm `follow` nếu thiếu); giữ nguyên `id`, `topic`, `level`, `q`, `tags`, `refs`. KHÔNG viết lại cả file, KHÔNG đụng object khác (file có thể đang chứa nội dung chưa commit của task khác). Sửa bằng thao tác thay thế đúng đoạn `a: ` của từng id. Trước khi đánh DONE: số id trong file (`grep -c "id: '"`) phải KHÔNG đổi.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Task này là NGOẠI LỆ:** chỉ sửa field `a` (và thêm `follow` nếu thiếu) của các id liệt kê ở trên trong `js/data/q-scenario.js`; không thêm câu mới, không đụng câu khác.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-scenario.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id đã mở rộng vào Notes.

## Notes
- Đã mở rộng `a` (1800–4000+ ký tự) cho: `scenario-109`, `scenario-110`, `scenario-111`, `scenario-112`, `scenario-113`, `scenario-114`, `scenario-115`, `scenario-116`. Giữ nguyên `id/topic/level/q/tags/refs/follow`.
- Nội dung: Tóm tắt → bối cảnh → cơ chế từng bước (vì sao) → ví dụ code/SQL/~~~seq → bảng trade-off → pitfall production → Senior tip (số liệu). Giải thích thuật ngữ lần đầu (feature flag, RPS, p99, A/B test, kill switch, Redis/Pub/Sub, eventual consistency, rate limit/token bucket/sliding window, idempotency key, race condition, FOR UPDATE, optimistic lock, TTL, deadlock, B-Tree/index/EXPLAIN, isolation/MVCC/gap lock, Kafka topic/partition/offset/consumer group/at-least-once, cache-aside/stampede/avalanche/penetration/Bloom filter, partition pruning/covering index/materialized view).
- Sửa kỹ thuật nhỏ (đúng ý, tránh bẫy renderer): `scenario-109` đổi "local cache" → "cache in-memory" (tránh validator coi `local` là localStorage); `scenario-115` viết key ví dụ `product:42`/`user:42:profile` và tách `DEL` khỏi key (tránh lỗi inline code lồng `{}`).
- Kiểm tra: `node --check js/data/q-scenario.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → **OK — không có lỗi**. `grep -c "id: '" js/data/q-scenario.js` = **124** (không đổi). Không commit.
Reviewed-by: kilo (T877R)
