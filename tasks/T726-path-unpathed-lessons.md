# T726 — Đưa các bài học chưa có trong lộ trình vào js/data/path.js

Status: DONE
Agent: kilo
Owns: `js/data/path.js`
After: T715

`node scripts/validate.js` cảnh báo "có N bài học không nằm trong PATH". Đọc `js/data/path.js` (cấu trúc chặng), đọc tiêu đề các bài bị cảnh báo, rồi **thêm** id mỗi bài vào mảng `lessons` của chặng phù hợp nhất (theo track/độ khó). Track **autotest** chưa có chặng: thêm **một chặng mới** cuối lộ trình "Automation Test với Playwright (tuỳ chọn)" theo đúng schema các chặng khác, gồm lesson-autotest-001..015 và 6–8 câu autotest tiêu biểu. Không xoá/sắp xếp lại mục cũ. Nghiệm thu: validate không còn cảnh báo PATH cho các bài đã tồn tại.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Nghiệm thu
`node --check js/data/path.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
- Đã thêm 37 bài học còn thiếu (đã tồn tại trong `js/data/lessons-*.js`) vào các chặng phù hợp trong `js/data/path.js` (chỉ chèn id, không xoá/sắp xếp lại mục cũ):
  - `path-01` (Java core): +`lesson-core-008`, `lesson-core-009`
  - `path-03` (SQL): +`lesson-sql-004`, `lesson-sql-005`
  - `path-05` (REST API): +`lesson-api-004`, `lesson-api-005`
  - `path-06` (Concurrency & Modern): +`lesson-concurrency-008`, `lesson-concurrency-009`
  - `path-07` (Spring & JPA): +`lesson-spring-008`, `lesson-spring-009`, `lesson-jpa-006`, `lesson-jpa-007`
  - `path-08` (DB/Testing/Security): +`lesson-db-006`, `lesson-db-007`, `lesson-security-006`, `lesson-security-007`
  - `path-09` (DevOps/Docker/CI/CD): +`lesson-devops-010`..`lesson-devops-013`
  - `path-14` (Banking/AI/maintain): +`lesson-banking-005`, `lesson-banking-006`
- Thêm chặng mới cuối lộ trình: `path-15` "Automation Test với Playwright (tuỳ chọn)" (order 15, phase Senior, weeks 33–34, requires `path-14`, `quizTopics: ['autotest']`) gồm `lesson-autotest-001`..`015` và 8 câu chốt chặng `autotest-001,002,004,016,026,032,040,045` (đều tồn tại trong `js/data/q-autotest.js`).
- Kiểm tra: `id: '` trong `path.js` trước 15 → sau 16 (delta +1, đúng 1 chặng mới). `node --check js/data/path.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` và **không còn cảnh báo PATH** cho các bài đã tồn tại.
- Ghi chú ngoài phạm vi (không sửa): `js/data/lessons-design.js` có một lesson id bị cắt ngắn `lesson-design-` (thiếu số) nên validator không liệt kê nó như bài hợp lệ; `path.js` không tham chiếu id hỏng này. Cần task riêng sửa `lessons-design.js` (không thuộc quyền sở hữu T726).
Reviewed-by: kilo (T726R)
