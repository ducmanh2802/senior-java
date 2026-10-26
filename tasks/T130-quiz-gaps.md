# T130 — Quiz: bù topic devops, kotlin, testing, aws

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4 (QUIZ) + 6. Thêm câu vào cuối `window.QUIZ` (id `qz-<topic>-NNN` tiếp nối): **6 devops, 6 kotlin, 2 testing, 2 aws, 2 ai** — tình huống thực tế, không hỏi định nghĩa suông. Đúng 4 options không trùng, `answer` rải đều 0..3, `explain` giải thích vì sao đúng VÀ vì sao từng phương án sai. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 18 câu vào cuối `window.QUIZ`, tiếp nối id hiện có:
  - devops: `qz-devops-003` … `qz-devops-008` (HPA thiếu request, Docker layer cache, expand-contract canary, flaky test, OOMKilled ngoài heap, secret trong image).
  - kotlin: `qz-kotlin-003` … `qz-kotlin-008` (Dispatchers.IO cho JDBC blocking, Sequence vs List, reified/type token, lateinit đa luồng, các chế độ `by lazy`, data class làm key mutable).
  - testing: `qz-testing-007`, `qz-testing-008` (Awaitility thay sleep; test slice + context cache).
  - aws: `qz-aws-007`, `qz-aws-008` (SQS visibility timeout/idempotency; DynamoDB hot partition).
  - ai: `qz-ai-007`, `qz-ai-008` (re-embed khi đổi embedding model; validate structured output).
- `answer` của 18 câu mới rải đều: index 0/1/2/3 = 4/5/4/5. Mỗi `explain` giải thích đáp án đúng, từng phương án sai và có `> Senior tip:`.
- Không sửa file nào khác. `node --check js/data/quiz.js` và `node scripts/validate.js` đều pass (`OK — không có lỗi.`); các cảnh báo còn lại thuộc `q-english.js`, ngoài phạm vi task.
