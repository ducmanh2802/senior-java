# T1585 — Bài học: consistent hashing và quorum

Status: DONE
Agent: kilo
Owns: `js/data/lessons-design.js`

Thêm **2 bài học mới** (track `design`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: consistent hashing (bài tập: cài vòng hash có virtual node, đo phân bố key khi thêm/bớt node); bài 2: quorum đọc/ghi (bài tập: mô phỏng N replica, ghi W, đọc R, phát hiện đọc dữ liệu cũ khi R + W <= N).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-design.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-design.js logs/tmp-T1585.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài học vào `js/data/lessons-design.js` (track `design`, nối tiếp các bài hiện có):
  - `lesson-design-006` (order 6, level senior): "Consistent hashing: đo phân bố key và dịch chuyển khi thêm bớt node" — body giải thích hash/ring/vnode, successor + wrap-around, movement khi thêm/bớt node; bài tập `ConsistentRing` (TreeMap + vnode, dò trùng vị trí, owner/distribution/movedCount), 8 test deterministic; 3 câu check.
  - `lesson-design-008` (order 8, level lead): "Quorum đọc/ghi: khi nào đọc được dữ liệu cũ và vì sao R + W > N" — giải thích N/R/W, giao tập hợp (R+W>N), trade-off, stale read; bài tập `ReplicaStore` (ghi 0..W-1, đọc n-r..n-1, version, isStale/quorumOverlap), 6 test deterministic phát hiện stale khi R+W<=N; 4 câu check.
- Kiểm tra: `node --check js/data/lessons-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` → `Lesson exercises OK: 249/249 (224 bài học, 248 từ cache)`.
- Không sửa mục/bài đã có, không sửa file khác ngoài file sở hữu và `js/data/index-light.js` (sinh lại theo build-light-index). Không commit.
Reviewed-by: kilo (T1585R)
