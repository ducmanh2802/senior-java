# T1051 — Thêm dấu tiếng Việt: lessons-microservices.js, lessons-ai.js, lessons-concurrency.js, lessons-sql.js, lessons-testing.js, lessons-collections.js, lessons-claude.js, lessons-jpa.js, lessons-db.js, lessons-spring.js, lessons-jvm.js, q-java.js, q-security.js

Status: TODO
Agent: kilo
Owns: `js/data/lessons-microservices.js`, `js/data/lessons-ai.js`, `js/data/lessons-concurrency.js`, `js/data/lessons-sql.js`, `js/data/lessons-testing.js`, `js/data/lessons-collections.js`, `js/data/lessons-claude.js`, `js/data/lessons-jpa.js`, `js/data/lessons-db.js`, `js/data/lessons-spring.js`, `js/data/lessons-jvm.js`, `js/data/q-java.js`, `js/data/q-security.js`

Một số đoạn tiếng Việt trong các file trên viết **không dấu** (do model cũ sinh ra): chữ trong sơ đồ `~~~seq`, comment trong code Java/SQL/YAML, dòng markup, gợi ý (hints), câu hỏi/follow. Người học đọc rất khó. Việc của bạn: **thêm dấu đầy đủ, đúng chính tả** cho các đoạn đó.

Tìm các dòng cần sửa:
~~~bash
node scripts/find-nodiac.js js/data/lessons-microservices.js js/data/lessons-ai.js js/data/lessons-concurrency.js js/data/lessons-sql.js js/data/lessons-testing.js js/data/lessons-collections.js js/data/lessons-claude.js js/data/lessons-jpa.js js/data/lessons-db.js js/data/lessons-spring.js js/data/lessons-jvm.js js/data/q-java.js js/data/q-security.js
~~~
(Heuristic, có thể báo nhầm vài dòng; tự xem xét. Đọc cả các dòng lân cận trong cùng khối, vì dòng không dấu ngắn có thể không bị script bắt.)

Quy tắc:
- **Chỉ thêm dấu**, giữ nguyên ý, cấu trúc, thuật ngữ tiếng Anh, tên biến/class/method, số liệu. Không viết lại nội dung, không thêm/xoá mục.
- Trong code (starter, tests, reference, solution): **chỉ sửa comment** (`//`, `/* */`, `--`, `#`). **Không đổi chuỗi trong code** (string literal, tên test "PASS ..."), không đổi code.
- Sơ đồ `~~~seq`: chỉ thêm dấu phần text sau dấu `:`; giữ tên actor, mỗi bước ≤ 60 ký tự.
- Không dùng backtick và `${` trong template literal; giữ nguyên các dấu backslash như cũ.

Nghiệm thu:
- `node scripts/find-nodiac.js js/data/lessons-microservices.js js/data/lessons-ai.js js/data/lessons-concurrency.js js/data/lessons-sql.js js/data/lessons-testing.js js/data/lessons-collections.js js/data/lessons-claude.js js/data/lessons-jpa.js js/data/lessons-db.js js/data/lessons-spring.js js/data/lessons-jvm.js js/data/q-java.js js/data/q-security.js` còn ≤ 3 dòng (và chỉ là báo nhầm).
- `node scripts/test-lessons.js` (các bài học trong file bạn sửa) phải pass như trước
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` (sửa dòng Status ở đầu file) + số dòng đã sửa vào Notes.

## Notes
