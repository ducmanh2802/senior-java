# T104 — Gói câu hỏi stack ngân hàng Việt Nam

Status: TODO
Agent: opencode
Owns: `js/data/q-spring-data.js`, `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6. Thêm **~12 câu** (đặt đúng topic: `db` trong q-spring-data.js, `scenario` trong q-scenario.js), không trùng câu có sẵn (đọc mọi `q:` trước):
- Oracle cho dev Java: PL/SQL package/procedure gọi từ Spring (SimpleJdbcCall), cursor/bulk collect, sequence vs identity, execution plan và hint, partition, khác biệt Oracle vs PostgreSQL khi migrate.
- Tích hợp core banking (T24/Flexcube…): ACL, idempotency, timeout không rõ kết quả, đối soát; ISO 8583 vs ISO 20022 ở mức dev cần biết; message queue (IBM MQ/Kafka) cho giao dịch.
- Batch cuối ngày (EOD): Spring Batch, cut-off time, chạy lại an toàn, khoá dữ liệu khi chạy batch.
- Bảo mật và tuân thủ: audit trail, phân quyền maker-checker, che dữ liệu nhạy cảm trong log.
Chuẩn chất lượng đầy đủ (≥ 1500 ký tự, Tóm tắt, ###, code ngắn, bảng, pitfall, Senior tip, follow 2–3). Không bịa API/quy định; quy định NHNN chỉ nêu chung nếu không chắc số hiệu. `node scripts/validate.js` → OK.

## Notes
