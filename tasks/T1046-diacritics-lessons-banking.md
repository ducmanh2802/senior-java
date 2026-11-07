# T1046 — Thêm dấu tiếng Việt: lessons-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`

Một số đoạn tiếng Việt trong các file trên viết **không dấu** (do model cũ sinh ra): chữ trong sơ đồ `~~~seq`, comment trong code Java/SQL/YAML, dòng markup, gợi ý (hints), câu hỏi/follow. Người học đọc rất khó. Việc của bạn: **thêm dấu đầy đủ, đúng chính tả** cho các đoạn đó.

Tìm các dòng cần sửa:
~~~bash
node scripts/find-nodiac.js js/data/lessons-banking.js
~~~
(Heuristic, có thể báo nhầm vài dòng; tự xem xét. Đọc cả các dòng lân cận trong cùng khối, vì dòng không dấu ngắn có thể không bị script bắt.)

Quy tắc:
- **Chỉ thêm dấu**, giữ nguyên ý, cấu trúc, thuật ngữ tiếng Anh, tên biến/class/method, số liệu. Không viết lại nội dung, không thêm/xoá mục.
- Trong code (starter, tests, reference, solution): **chỉ sửa comment** (`//`, `/* */`, `--`, `#`). **Không đổi chuỗi trong code** (string literal, tên test "PASS ..."), không đổi code.
- Sơ đồ `~~~seq`: chỉ thêm dấu phần text sau dấu `:`; giữ tên actor, mỗi bước ≤ 60 ký tự.
- Không dùng backtick và `${` trong template literal; giữ nguyên các dấu backslash như cũ.

Nghiệm thu:
- `node scripts/find-nodiac.js js/data/lessons-banking.js` còn ≤ 3 dòng (và chỉ là báo nhầm).
- `node scripts/test-lessons.js` (các bài học trong file bạn sửa) phải pass như trước
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` (sửa dòng Status ở đầu file) + số dòng đã sửa vào Notes.

## Notes

Đã thêm dấu đầy đủ, đúng chính tả cho 31 dòng trong `js/data/lessons-banking.js`:
- 4 dòng trong sơ đồ `~~~seq` (actors/note text)
- 27 dòng comment trong code Java (reference, starter, tests) và markup
- 4 dòng còn lại là chuỗi string literal bên trong `tests` (ví dụ `"SYS/opening am thi van duoc ghi"`) — theo quy tắc task **không đổi string literal**, giữ nguyên.
Kết quả: `node scripts/find-nodiac.js js/data/lessons-banking.js` còn 4 dòng (chỉ là string literal trong test harness, không phải comment/markup).
`node scripts/test-lessons.js` → 220/220 OK.
`node scripts/build-light-index.js` → OK.
`node scripts/validate.js` → OK (không lỗi; 3 cảnh báo sơ đồ actors > 6 thuộc file `q-banking.js`, không phải file của task này).
Reviewed-by: kilo (T1046R)
