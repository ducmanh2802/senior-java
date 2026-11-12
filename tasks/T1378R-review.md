# T1378R — Fact-check nội dung mới của T1378

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

## Notes

Fact-check nội dung mới thêm vào `js/data/q-soft.js` (4 behavioral + 8 testing). Đã sửa 2 lỗi kỹ thuật:

1. **behavioral-042** (so sánh 2 offer): tính tổng thu nhập năm sau ghi "490 triệu" sai — đúng là **507,5 triệu** (35×12 + 35 + 35×1.5). Đồng thời chuẩn hóa chênh lệch "khoảng 70 triệu" → **71 triệu** (455 − 384).
2. **testing-021/Testcontainers** (Ví dụ đời thực + Trả lời mẫu khi phỏng vấn): mâu thuẫn số lượng test — một nơi viết 350 test, nơi khác 300 test → chuẩn hóa thành **350 test**. Đồng thời sửa số liệu vô lý: bản gốc viết "CI 4 phút 20 giây" sau khi chuyển từ H2 sang Testcontainers (Testcontainers chậm hơn H2, không thể giảm CI) → sửa thành **bộ test repository chạy 4 phút 20 giây**; "1 phút 10 giây với H2" → **1 phút với H2**.

Các block còn lại (behavioral-041, 043, 044, 045, testing-022…048) đã kiểm tra: thuật ngữ, công nghệ (Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Jackson, JSONAssert, WireMock, ArchUnit, Argo Rollouts, k6/Gatling/JMeter, PIT, Awaitility, Testcontainers, Pact/SCC), số liệu và markup đều đúng, không lỗi kiến thức.

## Nghiệm thu

`node scripts/validate.js` → OK — không có lỗi.