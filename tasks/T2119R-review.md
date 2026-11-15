# T2119R — Fact-check nội dung mới của T2119

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2119 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Task T2119R owns `js/data/q-api.js`. The only change is adding `'core'` tag to 25 questions as specified: api-001 through api-011, api-014 through api-020, api-025, api-028, api-033, api-039, api-041, api-047, api-049. Tag `'core'` placed at end of each tags array, no duplicate elements, no missing tags. No changes to `q`, `a`, `follow`, `id`, or `level` fields. No knowledge errors, markup errors, or technical issues in this file.

`node scripts/validate.js` → q-api.js has no errors (`validate.js | grep q-api` rỗng). Global validate failures are from other files (q-microservices.js, bugs.js, lessons-*, projects.js, path.js, index-light.js) which are out of scope per luật 3 (not owned by this task).

Status: DONE
