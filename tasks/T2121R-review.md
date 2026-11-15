# T2121R — Fact-check nội dung mới của T2121

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2121 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

**Không có lỗi kiến thức trong nội dung mới.**

Nội dung mới của T2121 trong `js/data/q-system-design.js` (so với HEAD) **chỉ gồm 32 dòng `tags`**: thêm `'core'` vào mảng `tags` của 32 câu lõi (design-002, design-003, design-004, design-005, design-006, design-007, design-008, design-009, design-010, design-011, design-012, design-013, design-014, design-015, design-016, design-021, design-029, architecture-001, architecture-003, architecture-004, architecture-009, architecture-010, architecture-011, architecture-012, architecture-014, architecture-015, architecture-020, architecture-023, architecture-027, architecture-040, architecture-044, architecture-052).

Đã kiểm:
- Nạp cả HEAD và working tree rồi so sánh từng câu: **116 câu trước/sau bằng nhau**, không câu nào bị thêm/xoá; `q`, `a`, `follow` của mọi câu **không đổi**; 32 thay đổi `tags` đều đúng dạng thêm đúng `'core'`, không mất tag cũ.
- Không có tag trùng lặp, không có tag rỗng; `'core'` khớp với cách dùng ở `js/views/bank.js` (isCore) và `scripts/build-light-index.js` (danh sách core cho dashboard).
- `node --check js/data/q-system-design.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`
- `js/data/index-light.js` đang khớp dữ liệu (`current() === nội dung file`) nên không cần build lại.

Ghi chú thêm: Notes của T2121 ghi 30 câu `'core'`, thực tế file có 32 câu — chênh 2 câu so với "khoảng 30" mà task cho phép, vẫn hợp lệ và không có câu trùng ý nghiêm trọng (design-013 job scheduler và design-029 background job là hai câu gần nhau nhất nhưng khác trọng tâm: lịch chạy phân tán vs hàng đợi job nền). Không sửa gì thêm theo yêu cầu "không thêm/xoá mục".
