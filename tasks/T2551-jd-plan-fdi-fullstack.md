# T2551 — Lộ trình JD v2: thêm Frontend, AI hands-on, nghiệp vụ nhà máy (MES/ERP), MyBatis

Status: DONE
Notes: JD_PLAN đã có 20 tuần j01–j20, targets 4 mục, project MES mini. node --check OK, topics hợp lệ. Lỗi validate còn lại thuộc bugs.js (bug-047/048) không thuộc file sở hữu.
Agent: kilo
Owns: `js/data/roadmap.js`

## Bối cảnh
Người học (dev Java ~4 năm, từng làm IT nhà máy Samsung) đổi ưu tiên: **(1) IT nhà máy / FDI / outsource Hàn–Nhật** (MES, ERP, MyBatis, Oracle/MSSQL), **(2) Senior Fullstack Java + Vue** (kiểu LG CNS), **(3) vẫn giữ VPBankS / VinSmart** làm mục tiêu phụ. JD_PLAN hiện (j01–j20) chỉ nhắm VPBankS + VinSmart, thiếu topic `frontend` và `ai`.

## Làm
Đọc `js/data/roadmap.js` (JD_PLAN), `js/views/roadmap.js` (cách render week: `id, title, topics, algo, tasks`), `js/data/topics.js` (id topic hợp lệ), và `js/data/companies.js` (công ty FDI/nhà máy nếu có).
1. Sửa `targets`: thêm 2 mục — "IT nhà máy / FDI (Samsung vendor, LG, Nhật/Hàn outsource)" và "Senior Fullstack Java + Vue (LG CNS…)" — mỗi mục có `examples` và `focus` 3–5 ý; giữ VPBankS/VinSmart nhưng rút gọn.
2. Sắp lại **đúng 20 tuần, giữ id `j01`…`j20`** (tiến độ lưu theo `<weekId>-<i>`), 5 giai đoạn. Bắt buộc có:
   - ≥ 2 tuần **Frontend** (`topics: ['frontend', 'api']`): JS/TypeScript cơ bản, Vue 3 Composition API, axios + interceptor JWT, CORS, deploy SPA cùng Spring Boot.
   - ≥ 1 tuần **MyBatis + SQL enterprise** (`topics: ['db', 'sql', 'jpa']`): mapper XML, dynamic SQL, resultMap, so sánh JPA, Oracle/MSSQL, báo cáo/export lớn.
   - ≥ 2 tuần **nghiệp vụ nhà máy** (`topics: ['scenario', 'design', 'microservices']`): MES (lệnh sản xuất, traceability serial/lot, máy quét offline, in tem), tích hợp ERP (SAP) qua interface/batch, chạy 24/7 (deploy không dừng xưởng), giao tiếp outsource Hàn/Nhật.
   - ≥ 1 tuần **AI hands-on** (`topics: ['ai']`): RAG, tool calling, Spring AI, eval — gắn bài học lessons-ai.
   - Giữ các tuần lõi: Core/Collections, Concurrency/JVM, Spring/@Transactional, Security/JPA, DB index/lock, Kafka/outbox, system design, DevOps, STAR + tiếng Anh, mock interview, tuần phỏng vấn thật (cuối).
3. Mỗi tuần: `title` rõ, `topics` là id có thật, `algo` (1 dòng), `tasks` 3–5 việc **làm được, đo được** (ví dụ "Viết mapper MyBatis có dynamic SQL cho màn hình tra cứu lot, có test"), dự án portfolio xuyên suốt đổi thành **"MES mini: Production Order & Traceability"** (Spring Boot 3 + MyBatis/JPA + PostgreSQL + Kafka + Vue 3) — cập nhật `project`.
4. Đổi `goal` cho khớp (ví dụ "Phỏng vấn IT nhà máy / FDI & Senior Fullstack — 20 tuần").

## Luật
- Đọc AGENTS.md. Chỉ sửa JD_PLAN. Tiếng Việt CÓ DẤU đầy đủ. Không backtick, không `${` trong chuỗi.
- Không đổi schema (field mới nào thì view phải hỗ trợ — không có thì đừng thêm).

## Nghiệm thu
`node --check js/data/roadmap.js`; `node -e "global.window={};require('./js/data/roadmap.js');const w=window.JD_PLAN.phases.flatMap(p=>p.weeks);console.log(w.length, w.map(x=>x.id).join(','))"` → `20 j01,…,j20`; mọi topic có trong topics.js; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: `Status: DONE`, Notes ghi danh sách 20 tuần mới (id: title).

## Notes
Reviewed-by: verify-only (code/UI task)
