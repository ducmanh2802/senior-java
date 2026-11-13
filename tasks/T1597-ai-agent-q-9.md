# T1597 — AI agent: 6 câu hỏi về bảo mật và vận hành agent (9)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1581

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: threat model cho agent có quyền gọi API nội bộ, prompt injection gián tiếp qua tài liệu/email/web và cách giảm thiểu, secret không bao giờ đi vào prompt, sandbox chạy code do LLM sinh ra, rate limit và chống lạm dụng endpoint AI công khai, incident response khi agent làm sai hàng loạt (kill switch, rollback).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1597.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu hỏi mới vào `js/data/q-ai.js`:
- `ai-103`: Threat model cho agent có quyền truy cập API nội bộ (database, thanh toán, email) — defense in depth 5 lớp, least privilege, server-side authZ, audit log, kill switch.
- `ai-104`: Indirect prompt injection qua tài liệu/email/web — 5 vector phổ biến, 6 biện pháp giảm thiểu (untrusted input, tách data/control plane, guardrail, human-in-the-loop, sanitize KB).
- `ai-105`: Secret không bao giờ vào prompt — kiến trúc trust boundary, Vault/KMS, server-side executor, short-lived scoped token, audit log, rotation.
- `ai-106`: Sandbox chạy code untrusted — gVisor/Firecracker/Wasm, K8s runtimeClass, non-root, read-only rootfs, drop caps, cgroup limits, network policy deny egress, static analysis cấm API nguy hiểm.
- `ai-107`: Rate limit & abuse prevention cho endpoint AI công khai — layered enforcement (Edge/Gateway/App), token quota, anomaly detection (burst, similarity, token ratio), PoW challenge, kill switch feature flag.
- `ai-108`: Incident response cho agent AI — quy trình 6 bước, kill switch tiered (tool/agent/model/prompt/all), rollback prompt/model tức thì, trace replay, eval canary, postmortem template.

Validation: `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: kilo (T1597R)
