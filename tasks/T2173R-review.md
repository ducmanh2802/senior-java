# T2173R — Fact-check nội dung mới của T2173

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2173 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Diff mới (HEAD): `lesson-testing-004` prompt — thay câu liệt kê annotation bằng "Các annotation không phải ba cái trên (ví dụ {{@SomethingElse}}) được bỏ qua, không ảnh hưởng kết quả." Kiểm tra kỹ thuật: đúng với logic `infrastructureFor` (@SpringBootTest ưu tiên cao nhất, slice theo @WebMvcTest/@DataJpaTest, còn lại unitTest) và với tests/reference hiện có; `@ServiceConnection`/Testcontainers/`@Sql`/`@Transactional` dùng đúng cho Spring Boot 3.1+/3.x; không có backtick/`${`/lỗi markup. **Không phát hiện lỗi kiến thức trong phần mới, không sửa nội dung.**
- Đã chạy: `node --check js/data/lessons-testing.js` OK; `node scripts/test-lessons.js` → `Lesson exercises OK: 298/298 (266 bài học, 298 từ cache)`; `node scripts/build-light-index.js` FAIL do lỗi cú pháp có sẵn ngoài file sở hữu (`q-claude.js:2722 SyntaxError: Unexpected identifier 'claude'`); `node scripts/validate.js` FAIL do các lỗi pre-existing ngoài phạm vi sở hữu (`q-claude.js` parse, `lessons-claude.js`/`projects.js`/`path.js` tham chiếu `claude-*` không tồn tại, `index-light.js` cũ). Không thể sửa các file này theo luật 3; đề xuất integrator sửa `q-claude.js` rồi chạy `node scripts/build-light-index.js` và `node scripts/validate.js`.
