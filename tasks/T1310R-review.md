# T1310R — Fact-check nội dung mới của T1310

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đã review 6 mục "Ví dụ đời thực" mới của T1310 trong `js/data/q-system-design.js`: design-017 (matching engine/group commit), design-018 (autocomplete/trie+debounce), design-019 (Prometheus cardinality OOM), design-020 (fraud velocity hot key), design-021 (OTP SMS DLR failover), architecture-009 (Singleton GoF vs Spring bean).

Kết quả: không tìm thấy lỗi kỹ thuật, markup, hay chữ nước ngoài cần sửa.
- Cơ chế, API, flag, số liệu đều ổn (Java 17/21, Spring Boot 3.x, Kafka, Prometheus, Redis, fsync/group commit, trie, DLR…).
- Markup `{{...}}` đúng: 68 mở / 68 đóng, không có backtick, không có `${` trong nội dung (đã kiểm tra qua `node --check` và git diff).
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.

## Notes
`node scripts/validate.js` OK cho nội dung `q-system-design.js` của task này.
Tuy nhiên `validate.js` tổng thể bị lỗi do `js/data/q-remote.js:2706` có backtick trong template literal (`Unexpected identifier 'log'`) — file này **không thuộc task này** và **không do tôi sửa** (đã có trong working tree trước khi bắt đầu, không nằm trên HEAD). Do đó `build-light-index.js` không chạy được và `index-light.js` bị cũ. Cần integrator sửa `q-remote.js` trước khi `validate.js` tổng thể có thể OK.
