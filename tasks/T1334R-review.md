# T1334R — Fact-check nội dung mới của T1334

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1334 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `collections-036`: sửa lỗi markup `{{HashMap<String, Order>>> ordersByCustomer}}` → `{{HashMap<String, Order> ordersByCustomer}}` (thừa dấu `>`).
- `collections-038`: sửa lỗi markup `{{Map<String, PaymentMethod>>> methods}}` → `{{Map<String, PaymentMethod> methods}}`.
- `collections-041`: (1) sửa lỗi markup `{{static Map<String, Rate>>> RATES = new HashMap<>();}}` → `{{static Map<String, Rate> RATES = new HashMap<>();}}`; (2) thay Sonar rule ID sai/không khớp ngữ cảnh (`java:S1192` — duplicated string literal, `java:S2629` — logging preconditions) bằng mô tả rule custom phù hợp: phát hiện nối String trong vòng lặp và `List.contains`/remove trong vòng lặp.
- Kiểm tra kỹ thuật các section mới (collections-036/037/038/039/040/041): HashMap capacity/resize, `HashMap.newHashMap(n)` (Java 19), `Set.of/Map.of` salt ngẫu nhiên, subList view & retained heap, ArrayList/HashMap Big-O, Caffeine cache API, ví dụ số liệu và giải pháp — đều hợp lý/đúng theo Java 17/21. Không phát hiện lỗi kiến thức khác.
- `node scripts/validate.js` → OK.
