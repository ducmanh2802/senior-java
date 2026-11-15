# T2117R — Fact-check nội dung mới của T2117

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2117 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Phạm vi nội dung MỚI của T2117 (`git diff HEAD -- js/data/q-spring-data.js`): **chỉ là mảng `tags`** — thêm `'core'` vào 78/79 câu, không có field `q`/`a`/`follow`/`refs` nào bị sửa (đã so sánh bằng script: 209 câu, cùng thứ tự id, 0 field khác đổi ngoài `tags`). Vì task chỉ đổi tag, không có câu chữ kiến thức mới → **không có lỗi kiến thức**.

Lỗi đã sửa (theo id):
- `jpa-064`: `tags` bị lặp `'core'` hai lần (`['core', 'core', 'N+1', …]`) → bỏ phần `'core'` dư.
- `spring-094`: **thiếu hẳn field `tags`** (script T2117 không chèn được vì object này kết thúc bằng `}` rồi `,` ở dòng riêng, khác mọi object khác) → thêm `tags: ['core'],` (thêm dấu phẩy cuối dòng `a`), đúng như danh sách 79 id trong T2117.

Kiểm tra sau khi sửa:
- 209 câu trước/sau (không thêm/xoá câu); 79 câu có tag `core`, khớp **đúng** danh sách 79 id trong T2117 (không thiếu, không dư); 0 câu còn thiếu `tags`; không id/tag trùng.
- `node --check js/data/q-spring-data.js` → SYNTAX_OK.
- Chạy `node scripts/build-light-index.js` (index-light.js đang cũ) rồi `node scripts/validate.js` → **OK — không có lỗi.** Lưu ý: index-light.js rebuild còn lấy luôn thay đổi đang dở của task khác chạy song song (`lessons-ai-015/016`, tag `core` của q-sql/q-microservices…), không phải nội dung của T2117.

Quan sát (KHÔNG sửa — thuộc quyết định chọn câu của T2117, không phải lỗi kiến thức): `jpa-005`, `jpa-025`, `jpa-030` gần như trùng ý (batching + `GenerationType.IDENTITY`), trong khi T2117 yêu cầu "không chọn 2 câu trùng ý"; nếu muốn 1 câu/ý thì nên bỏ `'core'` ở 1–2 câu trong nhóm này.
