# T580R — Fact-check nội dung mới của T580

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

## Notes
- scenario-088: bỏ "self-invocation /" trong tóm tắt (mẫu code không có self-invocation, chỉ gọi HTTP trong @Transactional).
- scenario-089: `UTF_8` chưa định nghĩa trong code sửa → `StandardCharsets.UTF_8`.
- scenario-092: `MINUTES` chưa định nghĩa trong code sửa → `java.util.concurrent.TimeUnit.MINUTES`.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js js/data/q-scenario.js` → OK — không có lỗi.
