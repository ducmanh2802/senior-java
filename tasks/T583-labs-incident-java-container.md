# T583 — 3 debug lab: Java trên container

Status: TODO
Agent: qoder
Owns: `js/data/labs-incident.js`

Thêm 3 lab category incident (đọc AGENTS.md mục 10 và 2–3 lab cũ để giữ chuẩn; id tiếp nối). Artifact **giống thật, tự nhất quán** (tên pod, timestamp, số liệu khớp nhau và khớp answer):
1. **OOMKilled lặp lại sau khi tăng traffic**: `kubectl describe pod` (Last State OOMKilled, exit 137, limits), `jcmd <pid> VM.native_memory summary` cho thấy Thread/Other (direct buffer) tăng, JVM flags. Root cause: native memory ngoài heap, MaxRAMPercentage quá cao.
2. **Deploy mới gây 5xx khoảng 3 phút rồi tự hết**: `kubectl rollout`/events, log Spring Boot (startup 70s), cấu hình probe (không có startupProbe, initialDelay ngắn, thiếu preStop), log ingress 502/503.
3. **p99 tăng vọt mỗi 10 phút**: GC log JDK 21 G1 (unified logging: humongous allocation, to-space exhausted, Full GC), allocation rate, job export chạy chung pod. Sửa: streaming + tách workload.
Mỗi lab: questions 2–3, hints ≥ 2, rubric ≥ 4; level senior (lab 3 lead).

## Nghiệm thu
(chạy `node scripts/build-light-index.js` nếu validate yêu cầu) `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
