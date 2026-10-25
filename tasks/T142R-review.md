# T142R — Fact-check nội dung mới của T142

Status: DONE
Agent: opencode
Owns: `js/data/drills-qa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T142 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Fact-check toàn bộ 45 câu `kind: 'qa'` mới của T142 (`git diff HEAD -- js/data/drills-qa.js`, 270 dòng thêm mới, không sửa nội dung ở HEAD).
- Cấu trúc đạt chuẩn: id `drill-qa-001`…`045` tăng dần, không trùng; phân bổ intro 6 + project 4 + tech 15 + design 8 + behavioral 8 + negotiation 4; level 10 mid / 27 senior / 8 lead; mọi `sample` 111–150 từ (80–200), `phrases` 4–5 cụm và đều là chuỗi con thực sự của `sample`; không backtick/`${`/markup/chữ nước ngoài; không trùng `q` với `q-english.js`.
- Lỗi kỹ thuật đã sửa (2 chỗ):
  - `drill-qa-021`: "common ForkJoinPool … sized to the number of cores" → "sized to roughly the number of cores" (mặc định common pool là `parallelism = availableProcessors - 1`, không phải đúng bằng số core).
  - `drill-qa-025`: "G1 … a mark and compact over old regions" → "across the whole heap" (G1 full GC mark-compact cả heap, không chỉ old regions; pause tăng theo live set là đúng).
- Không phát hiện lỗi API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ hay chữ nước ngoài lẫn vào ở 43 câu còn lại; các claim còn lại (HashMap treeify @8/load factor 0.75, Spring rollback unchecked-only, self-invocation, FlushMode AUTO, N+1, ThreadPoolExecutor rule, optimistic/pessimistic locking, idempotency key, token bucket + Lua, `FOR UPDATE SKIP LOCKED`, `search_after`, RLS, strangler + CDC/outbox) đã đối chiếu đúng Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x.
- `node --check js/data/drills-qa.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` → `Lesson exercises OK: 72/72`.
- Chỉ sửa `js/data/drills-qa.js` và file task này. Không commit.
