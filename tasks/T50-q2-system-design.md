# T50 — Nội dung: System Design & Architecture (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `design`: thêm 8 câu (đang có 13 → mục tiêu ≥ 21)
- Hệ thống chuyển tiền liên ngân hàng 24/7 (kiểu NAPAS): luồng, trạng thái, timeout, đối soát
- Distributed ID generator (Snowflake, ULID, DB sequence theo block): thứ tự, clock skew
- Đặt vé/chỗ ngồi không overbooking: giữ chỗ tạm có TTL, lock, thanh toán
- Order matching engine cho sàn chứng khoán: order book, độ trễ thấp, single-threaded sequencer
- Search autocomplete/typeahead: trie, top-K, cập nhật theo thời gian thực
- Hệ thống thu thập log/metrics quy mô lớn: ingest, lưu trữ time-series, retention, chi phí
- Phát hiện gian lận thời gian thực cho giao dịch thẻ/ví: streaming, rule engine, feature store, độ trễ
- OTP/2FA service: sinh, lưu, hết hạn, chống brute force, gửi SMS dự phòng nhiều nhà mạng

### topic `architecture`: thêm 6 câu (đang có 8 → mục tiêu ≥ 14)
- Event-driven architecture: event notification vs event-carried state transfer; khi nào gây khó debug
- Modular monolith với Spring Modulith: ranh giới module, kiểm tra phụ thuộc, khi nào tách thành service
- Anti-corruption layer khi tích hợp core banking legacy (T24, Flexcube…)
- Các pattern GoF thường dùng thật: Decorator, Template Method, Observer, Chain of Responsibility — ví dụ trong code nghiệp vụ
- Giữ kiến trúc không mục rữa: ArchUnit, quy tắc phụ thuộc, package cycle
- Multi-tenancy: database per tenant vs schema vs discriminator column; cách làm với Hibernate

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
- Hoàn thành bởi agent Claude: sửa design-014/015, thêm design-016..021.
