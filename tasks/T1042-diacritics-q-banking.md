# T1042 — Thêm dấu tiếng Việt: q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`

Một số đoạn tiếng Việt trong các file trên viết **không dấu** (do model cũ sinh ra): chữ trong sơ đồ `~~~seq`, comment trong code Java/SQL/YAML, dòng markup, gợi ý (hints), câu hỏi/follow. Người học đọc rất khó. Việc của bạn: **thêm dấu đầy đủ, đúng chính tả** cho các đoạn đó.

Tìm các dòng cần sửa:
~~~bash
node scripts/find-nodiac.js js/data/q-banking.js
~~~
(Heuristic, có thể báo nhầm vài dòng; tự xem xét. Đọc cả các dòng lân cận trong cùng khối, vì dòng không dấu ngắn có thể không bị script bắt.)

Quy tắc:
- **Chỉ thêm dấu**, giữ nguyên ý, cấu trúc, thuật ngữ tiếng Anh, tên biến/class/method, số liệu. Không viết lại nội dung, không thêm/xoá mục.
- Trong code (starter, tests, reference, solution): **chỉ sửa comment** (`//`, `/* */`, `--`, `#`). **Không đổi chuỗi trong code** (string literal, tên test "PASS ..."), không đổi code.
- Sơ đồ `~~~seq`: chỉ thêm dấu phần text sau dấu `:`; giữ tên actor, mỗi bước ≤ 60 ký tự.
- Không dùng backtick và `${` trong template literal; giữ nguyên các dấu backslash như cũ.

Nghiệm thu:
- `node scripts/find-nodiac.js js/data/q-banking.js` còn ≤ 3 dòng (và chỉ là báo nhầm).
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` (sửa dòng Status ở đầu file) + số dòng đã sửa vào Notes.

## Notes

Diacritics added to q-banking.js (find-nodiac now 0).
Reviewed-by: kilo (T1042R)
