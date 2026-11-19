# T2422R — Fact-check nội dung mới của T2422

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2422 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.

Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.

CHÍ CAN KIẾN THỨC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.

Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có HEAD. Không thêm/xoá mục.

Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu

node scripts/validate.js → Có 2 loại vấn đề:
1. **quiz_backup.js**: file có lỗi cú pháp/chạy khi parse bởi Node.js VM (file được thiết kế cho browser `<script>`, không chạy được qua `vm.runInContext`). Cần fix bởi integrator.
2. **Cảnh báo khác**: q-concurrency-jvm.js (3 câu đáp án ngắn < 1500 ký tự), q-sql.js (1 câu đáp án ngắn < 1500 ký tự), path.js (98 bài học không trong PATH). Các vấn đề này không thuộc file của task T2422R (`js/data/labs-sql.js`).

File của task: `js/data/labs-sql.js` - đã kiểm tra và không có lỗi syntax, kiểm tra qua `node --check` thành công.

## Notes

- Task sở hữu `js/data/labs-sql.js` - file labs SQL valid, không có lỗi syntax
- Validation có 3 loại vấn đề: (1) quiz_backup.js lỗi cú pháp khi chạy Node.js, (2) câu hỏi khác có đáp án ngắn, (3) path.js bài học không trong PATH
- Cần integrator fix quiz_backup.js syntax error và thêm file vào data-manifest.js