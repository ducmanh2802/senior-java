# T1045 — Thêm dấu tiếng Việt: algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`

Một số đoạn tiếng Việt trong các file trên viết **không dấu** (do model cũ sinh ra): chữ trong sơ đồ `~~~seq`, comment trong code Java/SQL/YAML, dòng markup, gợi ý (hints), câu hỏi/follow. Người học đọc rất khó. Việc của bạn: **thêm dấu đầy đủ, đúng chính tả** cho các đoạn đó.

Tìm các dòng cần sửa:
~~~bash
node scripts/find-nodiac.js js/data/algo.js
~~~
(Heuristic, có thể báo nhầm vài dòng; tự xem xét. Đọc cả các dòng lân cận trong cùng khối, vì dòng không dấu ngắn có thể không bị script bắt.)

Quy tắc:
- **Chỉ thêm dấu**, giữ nguyên ý, cấu trúc, thuật ngữ tiếng Anh, tên biến/class/method, số liệu. Không viết lại nội dung, không thêm/xoá mục.
- Trong code (starter, tests, reference, solution): **chỉ sửa comment** (`//`, `/* */`, `--`, `#`). **Không đổi chuỗi trong code** (string literal, tên test "PASS ..."), không đổi code.
- Sơ đồ `~~~seq`: chỉ thêm dấu phần text sau dấu `:`; giữ tên actor, mỗi bước ≤ 60 ký tự.
- Không dùng backtick và `${` trong template literal; giữ nguyên các dấu backslash như cũ.

Nghiệm thu:
- `node scripts/find-nodiac.js js/data/algo.js` còn ≤ 3 dòng (và chỉ là báo nhầm).
- `node scripts/test-algos.js` phải pass như trước
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` (sửa dòng Status ở đầu file) + số dòng đã sửa vào Notes.

## Notes
- Đã thêm dấu cho **37 dòng** comment không dấu trong `js/data/algo.js` (phạm vi algo-093 → algo-137, bao gồm các comment trong `solution`, `tests`, và helper).
- `node scripts/find-nodiac.js js/data/algo.js` → **0 dòng** nghi không dấu.
- `node scripts/test-algos.js` → **Harness OK: 134 · lỗi: 0**.
- `node scripts/build-light-index.js` → OK (189.3 KB).
- `node scripts/validate.js` → vẫn còn **3 lỗi sẵn có** (pre-existing, ngoài phạm vi task) ở `js/data/q-banking.js`: `banking-005.a`, `banking-010.a`, `banking-014.a` (sơ đồ `~~~seq` có 7/8 actors > giới hạn 6). Không thuộc file sở hữu (`js/data/algo.js`), không sửa.
Reviewed-by: verify-only (code/UI task)
