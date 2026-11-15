# T2096R — Fact-check nội dung mới của T2096

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2096 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `node --check js/data/lessons-spring.js`: OK. `node scripts/test-lessons.js`: OK (286/286, 256 bài). `node scripts/validate.js` còn 3 lỗi không thuộc file sở hữu (new-questions.js chưa khai báo manifest, quiz.js syntax, index-light.js cũ) — không sửa theo luật sở hữu file.
- `lesson-spring-018`:
  - Sửa giải thích exercise `explain` (sai thứ tự tính toán ví dụ @Order): test "two advices" có outer order=10 (+1) bao quanh inner order=20 (*2), target (2+3)=5 nên kết quả đúng là (5*2)+1=11; mô tả cũ đảo ngược thành (5+1)*2=12 và nêu kết quả đảo order sai.
- `lesson-spring-019`:
  - Sửa typo "nạp theo đồ đồ thị động" → "nạp theo đồ thị động".
  - Sửa mô tả sai `EntityGraphType.LOAD/FETCH`: trước đây gán LOAD=JOIN FETCH, FETCH=subselect loading (sai). Sửa theo JPA spec: LOAD giữ fetch type mặc định cho attribute ngoài graph; FETCH coi attribute ngoài graph là LAZY. Cách Hibernate thực thi (JOIN/subselect/batch) phụ thuộc provider/cấu hình; subselect là `@Fetch(FetchMode.SUBSELECT)` riêng.
  - Cập nhật bảng trade-off: thay dòng "EntityGraph FETCH (subselect)" bằng "@Subselect (FetchMode.SUBSELECT)" để tránh nhầm lẫn EntityGraphType.FETCH với FetchMode.SUBSELECT.
  - Sửa mục "Pagination + fetch join": cách 2 nêu rõ `@Fetch(FetchMode.SUBSELECT)`/`@BatchSize` (không còn gọi là EntityGraph FETCH subselect).
  - Sửa câu hỏi check: thay câu hỏi "EntityGraph LOAD và FETCH khác nhau ở đâu?" (đáp án sai: LOAD=JOIN FETCH, FETCH=subselect) bằng câu hỏi đúng theo JPA spec về xử lý attribute ngoài graph.
  - Sửa câu hỏi phỏng vấn (body): tương tự, làm rõ khác biệt LOAD/FETCH theo spec và gợi ý `@BatchSize`/`@Fetch(FetchMode.SUBSELECT)` cho collection lớn/pagination.
  - Sửa test "lazy loading causes N+1": implementation cũ set items sẵn rồi override `getItems()` kiểm tra `super.getItems()==null` (luôn false) nên không mô phỏng lazy/N+1 đúng; đổi thành trả về proxy có `items=null` và lần `getItems()` đầu tăng query count rồi nạp items. Reference `N1Detector` dùng reflection đọc `q` vẫn tương thích.
