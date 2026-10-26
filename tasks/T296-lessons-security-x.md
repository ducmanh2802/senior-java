# T296 — Bài tập security: session/CSRF/fixation + role OWNER/STEWARD/ADMIN (2 bài)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 12 + bài mẫu `lesson-collections-001`. Thêm 2 bài vào `push(...)`, order tiếp số lớn nhất hiện có trong file (bài `lesson-security-001..003` đã có). Thuần Java, không Spring.

**Bài A — Session store + NullSecurityContext + tenant biến mất (exercise 1, ~55').**
- `SessionStore`: map `sid -> {tenantId, userId, attributes, expiry, securityContext}`.
- `resolve(request)`: sid không tồn tại ⇒ `ANON`; tenant DISABLED ⇒ trả `STATUS 401` (không 500); CSRF token string check; `securityContext == null` phải trả ANON, không NPE.
- session fixation: `afterLogin` phải rotate sid mới, giữ userId, huỷ sid cũ (test chứng minh).
- expire TTL nhờ clock truyền vào.
- Tests ≥ 7.

**Bài B — Role matrix OWNER/STEWARD/ADMIN theo domain (exercise 2, ~45').**
- `AccessChecker{canWrite(role, domain), canRead(role, domain), canGrant(role, domain)}` với `domain ∈ {project, billing, vm}` và `role ∈ {OWNER, STEWARD, ADMIN, USER}`.
- OWNER đủ quyền trong domain; STEWARD: read+write (không delete/grant); ADMIN: delete + grant, read; USER: chỉ read.
- Bẫy "copy-paste im lặng": rule sai cho billing phải được test phát hiện (so rule mapping từng domain).
- Tests ≥ 8.

`related` trỏ câu `security-*` có thật. `node scripts/test-lessons.js` + `node scripts/validate.js` → OK; Status: DONE; không commit.

## Notes

## Notes
File dài, đã hoàn thiện: lesson-security-004 (Session store + NullSecurityContext + tenant DISABLED → 401, session fixation rotate, TTL theo clock) và lesson-security-005 (AccessChecker role matrix OWNER/STEWARD/ADMIN/USER theo domain project/billing/vm). test-lessons 91/91 OK, validate OK.
