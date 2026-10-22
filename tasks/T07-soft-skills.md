# T07 — Nội dung: Testing & Quality, Leadership & Behavioral

Status: TODO
Agent: opencode
Owns: `js/data/q-soft.js`

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `testing` (ID từ `testing-001`) và `behavioral` (ID từ `behavioral-001`) theo `AGENTS.md` mục 4–6.
Văn phong theo mẫu `core-001` trong `js/data/q-java.js`.

Với câu behavioral, đáp án cần có: **interviewer muốn đánh giá điều gì**, khung **STAR** (Situation, Task, Action, Result), **một câu trả lời mẫu cụ thể có số liệu**, và **những điều nên tránh**.

## Danh sách câu hỏi (bắt buộc bao phủ)
### testing (≥ 8 câu)
- Test pyramid / testing trophy cho Spring Boot service; unit vs slice test ({{@WebMvcTest}}, {{@DataJpaTest}}) vs {{@SpringBootTest}}
- Testcontainers: lợi ích, tăng tốc (reuse, singleton container)
- Mock vs stub vs fake; khi nào mock quá nhiều là code smell
- Contract testing (Spring Cloud Contract / Pact)
- Test code concurrency & code phụ thuộc thời gian ({{Clock}}, Awaitility)
- Code coverage: con số bao nhiêu là đủ, mutation testing (PIT)
- Performance / load testing (JMeter, Gatling, k6): thiết kế kịch bản, đọc p95/p99
- Code review: checklist của senior, cách review hiệu quả & tôn trọng
### behavioral (≥ 10 câu)
- Kể về sự cố production nghiêm trọng nhất bạn từng xử lý
- Bất đồng với tech lead / architect / PM: bạn xử lý thế nào
- Mentoring junior, nâng level team
- Quyết định kỹ thuật sai lầm & bài học rút ra
- Ước lượng (estimation) & deadline gấp: đàm phán scope
- Xử lý technical debt khi business chỉ muốn feature
- Dẫn dắt một dự án / migration lớn từ đầu đến cuối
- Làm việc với stakeholder không kỹ thuật
- Vì sao bạn muốn lên senior/lead; điểm yếu của bạn
- Bạn sẽ làm gì trong 90 ngày đầu ở công ty mới
- Câu hỏi bạn nên hỏi lại interviewer
- Đàm phán lương / offer (mẹo thực tế cho thị trường Việt Nam & remote)

## Notes
(agent ghi chú ở đây)
