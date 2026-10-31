# T554 — Dịch lại (nội dung đã sửa): q-system-design-1 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-1.en.js` đã cũ: **design-001, design-002, design-003, design-004, design-005, design-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-1 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại 6 entry: design-001, design-002, design-003, design-004, design-005, design-007. Chỉ sửa `js/i18n/q-system-design-1.en.js`; design-006 giữ nguyên (không nằm trong diff).

Ghi nhận về nguồn gốc "stale": `scripts/stale-i18n.js` đánh dấu theo blame — 6 mục này bị đánh dấu vì dòng `refs` đổi ở commit 1b52b76 (2026-10-29), trong khi phần `q`/`a`/`follow` tiếng Việt không đổi so với lúc dịch T194. `refs` không thuộc content overlay (chỉ q/a/follow), nên bản dịch được làm mới trực tiếp từ bản tiếng Việt hiện tại, đồng thời bổ sung giải thích ngắn cho thuật ngữ ở lần xuất hiện đầu theo brief người đọc.

Nội dung bổ sung/chuẩn hoá (không đổi cấu trúc, code block, key, thứ tự field):
- design-001: giải thích DAU, peak factor, p99, các mốc availability 99.9/99.99 (8.7 giờ vs 52 phút/năm), eventual consistency, replication factor; glossary CDN/LB/stateless/Redis/Kafka/replica; hot key, write amplification, fan-out.
- design-002: base62, hash + salt/collision, TTL/jitter, cache penetration, cache stampede, INCRBY, consistent hashing, partition key, replica.
- design-003: rate limiter, API gateway, token bucket (ẩn dụ xô đồng xu), Lua atomic + HMGET/HSET/PEXPIRE, TTL, fail-open/fail-closed, NAT.
- design-004: flash sale, oversell, warm-up, reservation, Lua atomic, conditional UPDATE, idempotent, partition key, P1 incident, feature flag.
- design-005: double-entry (tổng nợ = tổng có), append-only/reversal, at-least-once vs exactly-once, Idempotency-Key + 409, nghĩa AUTHORIZED/CAPTURED/SETTLED, outbox vs dual-write, webhook, saga vs 2PC, row lock/deadlock, SERIALIZABLE, tokenization, 4-eyes.
- design-007: push vs pull, write amplification, ZSET/ZADD/ZREVRANGEBYSCORE, hydrate + N+1, cursor vs offset, candidate generation/scoring/re-ranking, L1 cache.

Không có backtick, không có `${`, không còn chữ tiếng Việt ngoài code block; toàn bộ code block (Lua/SQL/ASCII) giữ nguyên nội dung.

Kiểm tra: `node scripts/check-i18n.js q-system-design-1` → OK (7 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
