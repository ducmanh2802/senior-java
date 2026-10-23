# T07 — Nội dung: Testing & Quality, Leadership & Behavioral

Status: DONE
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

### Đã hoàn thành
Viết **22 câu hỏi** vào `js/data/q-soft.js` (duy nhất file task này sở hữu):

**testing (10 câu, `testing-001` → `testing-010`)** — phủ đủ 8 mục bắt buộc:
| ID | Level | Chủ đề |
|---|---|---|
| testing-001 | senior | Test pyramid vs testing trophy; unit vs slice ({{@WebMvcTest}}, {{@DataJpaTest}}) vs {{@SpringBootTest}} |
| testing-002 | senior | Testcontainers: H2 sai ở đâu, singleton container, `withReuse(true)`, Ryuk, CI không có Docker |
| testing-003 | mid | Mock / stub / spy / fake; dấu hiệu mock quá nhiều là code smell; fake thay mock |
| testing-004 | senior | Contract testing: Pact (consumer-driven) vs Spring Cloud Contract (provider-driven), Pact Broker |
| testing-005 | senior | Test phụ thuộc thời gian (inject `Clock`) & concurrency (`CyclicBarrier`, virtual thread, Awaitility) |
| testing-006 | mid | Coverage bao nhiêu là đủ; mutation testing (PIT), mutation score, mutation threshold |
| testing-007 | senior | Load/performance test: JMeter / Gatling / k6, thiết kế workload, đọc p95/p99, coordinated omission |
| testing-008 | senior | Code review: checklist 7 nhóm của senior, cách viết comment `must:`/`should:`/`nit:`, tôn trọng |
| testing-009 | lead | Quality gate trong CI/CD, xử lý flaky test (quarantine, SLA), DORA metrics |
| testing-010 | mid | Test data: fixture/factory, seed random, test độc lập, anti-pattern test |

**behavioral (12 câu, `behavioral-001` → `behavioral-012`)** — phủ đủ 12 mục bắt buộc
(sự cố production, bất đồng với lead/PM, mentoring, quyết định sai, estimation/deadline,
technical debt, dẫn dắt migration lớn, stakeholder phi kỹ thuật, vì sao lên senior + điểm yếu,
90 ngày đầu, câu hỏi hỏi lại interviewer, đàm phán lương/off theo bối cảnh Việt Nam & remote).

Mỗi câu behavioral có đủ 4 phần theo yêu cầu task:
1. **Interviewer muốn đánh giá gì** — 4–5 tiêu chí cụ thể.
2. **Khung STAR** — S/T/A/R ràng buộc với bối cảnh câu hỏi.
3. **Câu trả lời mẫu có số liệu** — ví dụ thật (MTTR 41 phút, 12.000 đơn, p99 4,2 s → 0,9 s,
   58% cuộc gọi CS giảm, offer 38 → 45 triệu…) để người học thấy cách diễn đạt số liệu.
4. **Những điều nên tránh** — 5–6 lỗi thường gặp (đổ lỗi, bịa sự cố, "tôi chưa từng sai",
   hỏi lương ở vòng đầu…).

### Kiểm tra
- `node scripts/validate.js` → **OK — không có lỗi.**
- `node --check js/data/q-soft.js` → OK.
- Tự audit: đáp án nằm trong khoảng 1500–4000 ký tự; cân bằng `{{`/`}}`; không có backtick,
  không `${`, không thẻ HTML thô, không code fence hở; mọi đáp án có `**Tóm tắt:**` và `> Senior tip:`.
  Render thử qua `App.md()` — không còn dòng `>` trần sinh ra `<p>&gt;</p>`; mỗi câu behavioral
  render đúng 2 blockquote (câu trả lời mẫu + Senior tip).
- Phân bố level: mid 6 (27%), senior 12 (55%), lead 4 (18%) — gần đúng tỉ lệ 25/55/20 trong AGENTS.md.

### Ghi chú cho người tích hợp
- Chỉ sửa `js/data/q-soft.js` và file task này, không đụng file của agent khác.
- Nội dung dùng markup trong AGENTS.md mục 5: `**đậm**`, `{{code}}`, `### `, `- `, `1. `, `| bảng |`,
  `~~~java|xml|javascript|bash|text`. Không dùng markdown đầy đủ, không HTML.
- Với câu behavioral, phần "Câu trả lời mẫu" là một blockquote dài nhiều đoạn — `App.md()` gộp các
  dòng `> ` liên tiếp thành **một** `<blockquote>` (đã kiểm tra).
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
