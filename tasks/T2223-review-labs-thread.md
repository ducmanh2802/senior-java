# T2223 — Rà soát chất lượng 4 lab id NHỎ nhất trong labs-thread.js

Status: TODO
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2155

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab id NHỎ nhất (`node scripts/qtool.js list js/data/labs-thread.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact giống thật và tự nhất quán (định dạng jstack/GC log JDK 17+/EXPLAIN PostgreSQL đúng; timestamp, lock id, số liệu khớp nhau và khớp answer); answer trích đúng dòng; cách sửa đúng kỹ thuật; rubric ≥ 3 ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

Status: DONE

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-thread-001 | Không tìm thấy lỗi kỹ thuật; artifact, dẫn chứng, rubric 4 ý tự nhất quán. | Giữ nguyên. |
| lab-thread-002 | Không tìm thấy lỗi kỹ thuật; Little's law, stack dump, log leak detection khớp nhau. | Giữ nguyên. |
| lab-thread-003 | Không tìm thấy lỗi kỹ thuật; phân biệt contention/deadlock đúng, số liệu pidstat/throughput khớp. | Giữ nguyên. |
| lab-thread-004 | Gỡ chi tiết phiên bản không chắc; thay bằng nguyên lý: synchronized và native/JNI vẫn ghim virtual thread. | Đã sửa trong lần rà soát trước. |
| lab-thread-005 | Không tìm thấy lỗi kỹ thuật; quy trình top -H và khớp TID/nid chính xác, giải thích ReDoS và sửa bằng regex tuyến tính/RE2/J rõ ràng. | Giữ nguyên. |
| lab-thread-006 | Không tìm thấy lỗi kỹ thuật; phân tích starvation deadlock và các phương án sửa (thenCombine, timeout, bulkheads) chính xác. | Giữ nguyên. |
| lab-thread-007 | Không tìm thấy lỗi kỹ thuật; giải thích AsyncAppender blocking và NFS impact hợp lý. | Giữ nguyên. |
| lab-thread-008 | Không tìm thấy lỗi kỹ thuật; phân tích writer starvation trên non-fair RRWL và cách sửa bằng immutable snapshot/volatile chính xác. | Giữ nguyên. |
