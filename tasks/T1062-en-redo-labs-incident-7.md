# T1062 — Dịch lại (nội dung đã sửa): labs-incident-7 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-incident.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-incident-7.en.js` đã cũ: **lab-incident-018**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-incident.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-incident-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-incident-7 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lab-incident-018` (HPA scaling + p99 + 500m CPU limit / CFS throttling / JVM container-aware) in `js/i18n/labs-incident-7.en.js` to match the current Vietnamese source in `js/data/labs-incident.js` (lines 2442–2492).
- Kept the same key and fields (`title`, `scenario`, `questions`, `hints`, `answer`, `rubric`); preserved `{{...}}` inline code markers and artifact/metric names; avoided backticks and `${` in template literals.
- Wrote for ~4 years Java experience with little exposure to K8s/observability: explained Kubernetes, pod/container, CPU request/limit (millicores), HPA, p99, CFS scheduler/quota/period, cgroups, throttling, JVM container-awareness, `availableProcessors()`, GC/JIT bursts, QoS (Guaranteed), KEDA, and SLO in plain terms with step-by-step cause → effect → fix → interview answer.
- Verified: `node --check js/i18n/labs-incident-7.en.js` OK; `node scripts/check-i18n.js labs-incident-7` → `OK — 3 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (only pre-existing warnings remain). No git commit/push.
Reviewed-by: check-i18n (translation, no LLM review)
