# T2255 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jvm.js`
After: T1709

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-jvm.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; đúng Java 17/21; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js); GC/heap/metaspace đúng JDK 17/21, flag JVM có thật.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Rà soát 9 bài lesson-jvm-001..009. node --check, build-light-index, validate, test-lessons đều OK (304/304). Không phát hiện lỗi cú pháp markup/backtick/${}; JVM flags (UseG1GC, UseZGC, MaxRAMPercentage, MaxMetaspaceSize, -Xmx) và GC log JDK 17 đúng. Không sửa tests/reference.
Reviewed-by: verify-only (review task)
