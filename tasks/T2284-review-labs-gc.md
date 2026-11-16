# T2284 — Rà soát chất lượng các bài lab GC trong labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2225

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài lab GC (`node scripts/qtool.js list js/data/labs-gc.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: GC log đúng định dạng JDK 17+ unified logging (-Xlog:gc*), số liệu pause/heap khớp answer; flag JVM có thật; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-gc-001 | không | Kiểm tra kỹ: GC log analysis, humongous object mechanism, và To-space exhausted cause đều chính xác. |
| lab-gc-002 | không | Kiểm tra kỹ: Histogram analysis, phân tích leak do listener static reference là chính xác. |
| lab-gc-003 | không | Kiểm tra kỹ: Nguyên nhân OOM Metaspace do dynamic Groovy class generation không cached là chính xác. |

