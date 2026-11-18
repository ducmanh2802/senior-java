# T2379 — 20 câu trắc nghiệm SQL/PostgreSQL nâng cao

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2281

Định dạng QUIZ; grep q: để không trùng. Thêm 20 câu (topic sql/db có trong topics.js): isolation level và anomaly, MVCC + VACUUM, index B-tree vs GIN vs BRIN, EXPLAIN đọc Seq Scan/Index Only Scan, partial index, FOR UPDATE SKIP LOCKED, deadlock, connection pool sizing. 1/4 multi (Chọn N khớp answer.length), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/quiz.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Id trước (lớn nhất trong repo): `qz-sql-034` (nằm ở `js/data/quiz-gaps.js`; trong `quiz.js` chỉ tới `qz-sql-032`). Id sau: `qz-sql-054`. Thêm đúng 20 câu `qz-sql-035`..`qz-sql-054` vào cuối `js/data/quiz.js` (tăng đúng +20, không dùng lại số cũ).
- Lưu ý: bản nháp đầu dùng 033/034 nhưng trùng `qz-sql-033`/`qz-sql-034` đã có trong `js/data/quiz-gaps.js` (validate báo "quiz id thiếu hoặc trùng"), nên đã đổi toàn bộ sang dải 035..054.
- Chủ đề (theo yêu cầu task): isolation level & anomaly (write skew, non-repeatable/phantom, READ UNCOMMITTED = READ COMMITTED, 40001 retry) — 035..038; MVCC + VACUUM (tuple version xmin/xmax, dead tuple/bloat, VACUUM vs VACUUM FULL, XID wraparound/freeze) — 039..042; index B-tree vs GIN vs BRIN — 043..045; EXPLAIN Index Only Scan vs Seq Scan, partial index — 044..048; FOR UPDATE SKIP LOCKED / NOWAIT — 049..050; deadlock (detector 40P01, Spring retry) — 051..052; connection pool sizing (HikariCP, 20×50 vs max_connections) — 053..054.
- Multi (Chọn 2) đúng 5/20: 036, 040, 043, 049, 053. explain nêu vì sao đáp án đúng và vì sao từng phương án sai; đáp án đúng rải đều (0/1/2/3). Không backtick, không `${`; markup {{ }} cân bằng; không dùng ~~~ nên không lệch fence.
- Kiểm tra: `node --check js/data/quiz.js` → OK. `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js` (chỉ cảnh báo 2 file của agent khác đang lỗi cú pháp: `q-microservices.js`, `q-system-design.js` — không thuộc file sở hữu). `node scripts/validate.js` → **không còn lỗi nào thuộc `quiz.js`** (lọc `quiz.js|qz-sql` = rỗng; 157 lỗi còn lại đều ở file khác: lessons-microservices/projects/lessons-architecture/drills-shadow/path/bugs/q-concurrency-jvm/lessons-devops/q-system-design/q-microservices — pre-existing, không sửa được theo luật 3/5). Không commit.
- Chỉ sửa 2 file: `js/data/quiz.js` (thêm) và `js/data/index-light.js` (sinh lại bởi build-light-index). Không đụng file khác.
