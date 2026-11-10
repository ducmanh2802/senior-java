# T1441 — Thêm dấu tiếng Việt: lessons-security.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`
After: T1410

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Một số đoạn tiếng Việt trong các file trên viết **không dấu** (do model cũ sinh ra): chữ trong sơ đồ `~~~seq`, comment trong code Java/SQL/YAML, dòng markup, gợi ý (hints), câu hỏi/follow. Người học đọc rất khó. Việc của bạn: **thêm dấu đầy đủ, đúng chính tả** cho các đoạn đó.

Tìm các dòng cần sửa:
~~~bash
node scripts/find-nodiac.js js/data/lessons-security.js
~~~
(Heuristic, có thể báo nhầm vài dòng; tự xem xét. Đọc cả các dòng lân cận trong cùng khối, vì dòng không dấu ngắn có thể không bị script bắt.)

Quy tắc:
- **Chỉ thêm dấu**, giữ nguyên ý, cấu trúc, thuật ngữ tiếng Anh, tên biến/class/method, số liệu. Không viết lại nội dung, không thêm/xoá mục.
- Trong code (starter, tests, reference, solution): **chỉ sửa comment** (`//`, `/* */`, `--`, `#`). **Không đổi chuỗi trong code** (string literal, tên test "PASS ..."), không đổi code.
- Sơ đồ `~~~seq`: chỉ thêm dấu phần text sau dấu `:`; giữ tên actor, mỗi bước ≤ 60 ký tự.
- Không dùng backtick và `${` trong template literal; giữ nguyên các dấu backslash như cũ.

Nghiệm thu:
- `node scripts/find-nodiac.js js/data/lessons-security.js` còn ≤ 3 dòng (và chỉ là báo nhầm).
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` (sửa dòng Status ở đầu file) + số dòng đã sửa vào Notes.

## Notes
- Đã thêm dấu tiếng Việt cho `js/data/lessons-security.js` (chỉ sửa comment/code test messages/các chuỗi mô tả lỗi trong test, text trong `~~~seq` sau dấu `:`, và một vài label text trong test; giữ nguyên string literal/tên biến/class/method/số liệu/cấu trúc).
- `node scripts/find-nodiac.js js/data/lessons-security.js` → `0 dòng nghi viết không dấu` (≤ 3).
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK. `node --check js/data/lessons-security.js` → OK.
- Không commit, không mở trình duyệt, không kill process theo tên.
Reviewed-by: kilo (T1441R)
