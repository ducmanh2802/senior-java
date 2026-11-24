# T2672R — Fact-check nội dung mới của T2672

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2672 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 3 câu mới của T2672 (architecture-078, 079, 080). Nội dung kỹ thuật ĐÚNG, không có API/flag bịa, mặc định sai hay cơ chế nói ngược:
- 078: Conway's law, cognitive load, on-call, bus factor, Spring Modulith `verify()`, ArchUnit, bounded context, SLO, PCI — đều đúng. Service budget 2–3 service/8 người là số gợi ý (đã ghi "ước tính"), hợp lý.
- 079: feature flag, Micrometer `MeterRegistry.counter(...).increment()`, `ThreadLocalRandom`, shadow diff, CDC sync lag, cutover gate — đúng. Code minh hoạ hợp lệ.
- 080: ADR, supersede (không sửa ADR cũ), sunk cost, disagree-and-commit, type 1/type 2 decision, review trigger định lượng — đúng.
- Tham chiếu chéo architecture-024 (modular monolith + ArchUnit) và architecture-025 (Strangler Fig routing facade) chính xác.

Lỗi đã sửa:
- architecture-078: bảng "Ngân sách service" — "trên 4 là **squat** quá đông" → "trên 4 là **squad** quá đông" (từ nước ngoài/lỗi gõ).

Không sửa văn phong/độ dài/bố cục, không thêm/xoá mục.

Về `node scripts/validate.js`: file sở hữu `q-system-design.js` KHÔNG có lỗi (không nằm trong danh sách LỖI). Các lỗi còn lại đều thuộc file của task khác đang chạy song song, KHÔNG thuộc quyền sở hữu của T2672R nên theo luật 3 (AGENTS.md) tôi không sửa:
- `lessons-design.js`: lỗi cú pháp (T2673).
- `lessons-aws.js`: body < 2500 ký tự (T2670).
- `path.js`: path-10 tham chiếu lesson-design-001..005 chưa tồn tại (hệ quả của lessons-design lỗi).
- `index-light.js`: cũ so với dữ liệu (file generated, integrator sở hữu; cần build lại sau khi các task nội dung khác xong).
Không chạy build-light-index vì file index-light.js do integrator sở hữu và đang bị sửa bởi task khác; việc rebuild sẽ kéo theo dữ liệu design/aws đang lỗi.
