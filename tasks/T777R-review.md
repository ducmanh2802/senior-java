# T777R — Fact-check nội dung mới của T777

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T777 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed nội dung mới của T777 trong `js/data/lessons-collections.js` (bài học lesson-collections-006 Iterator/modCount/fail-fast/PeekingIterator và lesson-collections-007 Comparable/Comparator/TimSort/sort; 2 mục mới, order 6-7, không trùng HEAD).
- Lỗi kỹ thuật: không có (API collections JDK 17 chính xác; modCount/expectedModCount, fail-fast/snapshot/weakly consistent, Comparator hợp đồng, TimSort, dual-pivot quicksort, Collator/Normalizer đều đúng; số liệu kiểm tra khớp).
- Lỗi markup: không có (không backtick, không ${ trong template literal; ~~java/~~~seq hợp lệ).
- Chữ nước ngoài lẫn vào: không có (thuật ngữ kỹ thuật giữ tiếng Anh, prose tiếng Việt).
- Không sửa nội dung đã ở HEAD; không thêm/xoá mục.
- node scripts/test-lessons.js lesson-collections-006 → 8/8, lesson-collections-007 → 7/7 (biên dịch thực JDK 17 --release 17; reference pass hết, starter không pass).
- Chạy node scripts/build-light-index.js (luật 6: thêm bài học) → index-light.js đã ghi lại.
- node scripts/validate.js → OK — không có lỗi. Cảnh báo path.js (bài học chưa nằm trong PATH) là tiền tồn; path.js là file integrator, không touche theo luật 3.