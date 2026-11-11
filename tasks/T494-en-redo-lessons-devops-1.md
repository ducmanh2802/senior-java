# T494 — Dịch lại (nội dung đã sửa): lessons-devops-1 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-devops-1.en.js` đã cũ: **lesson-devops-001, lesson-devops-002**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-devops-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-devops-1 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ `lesson-devops-001` và `lesson-devops-002` từ bản tiếng Việt hiện hành trong `js/data/lessons-devops.js`; giữ nguyên key, `title/goals/body`, `exercises` (title, prompt, hints, explain) và `check` (q, options, explain), thêm `answer` cho từng câu check cho đồng bộ với các file lesson `.en.js` khác.
- Bổ sung gloss ngắn cho vài thuật ngữ lần đầu xuất hiện (cgroup, kubelet, EndpointSlice, RSS, stop-the-world) nhưng không đổi nội dung kỹ thuật.
- Chỉ sửa `js/i18n/lessons-devops-1.en.js`.
- `node scripts/check-i18n.js lessons-devops-1` → OK; `node scripts/validate.js` → OK — không có lỗi.
