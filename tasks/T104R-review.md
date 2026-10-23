# T104R — Fact-check nội dung mới của T104

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`, `js/data/q-scenario.js`

## Notes
- `db-026`–`db-030`: rà soát Spring JDBC với Oracle REF CURSOR, BULK COLLECT/FORALL, sequence/identity, execution plan và migration Oracle–PostgreSQL; không thấy API hoặc cơ chế sai cần sửa.
- `scenario-042`–`scenario-043`: rà soát ACL, timeout, idempotency và reconciliation; bỏ các refs chung chung không liên quan.
- `scenario-044`: làm rõ JSON mapping tùy thuộc hợp đồng API/profile, không phải định dạng mặc định của ISO 20022.
- `scenario-045`: xác nhận outbox có thể phát lặp và consumer cần dedup/idempotency.
- `scenario-046`: sửa trạng thái `RESTARTABLE`; đây không phải `BatchStatus` của Spring Batch. Khả năng restart phụ thuộc trạng thái kết thúc, JobRepository và JobParameters.
- `scenario-047`–`scenario-048`: rà soát maker-checker, audit và masking/tokenization; bỏ refs chung chung không liên quan.

Nghiệm thu: `node --check` cho hai file dữ liệu và `node scripts/validate.js` đều thành công.
