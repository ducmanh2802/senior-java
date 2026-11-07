# T824 — 15 câu trắc nghiệm Spring/JPA/DB/API mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T823

Đọc AGENTS.md mục 4 (schema quiz) và HẾT câu hiện có trong `js/data/quiz-spring.js` để không trùng. id tiếp nối số lớn nhất của từng topic. Khoảng 1/3 là câu nhiều đáp án (`multi: true`, "(Chọn 2)"). Đáp án đúng rải đều vị trí. `explain` giải thích vì sao đúng và vì sao từng phương án sai. Thêm 15 câu: 4 spring (proxy self-invocation, bean scope, auto-configuration, transactional event), 4 jpa (batch insert IDENTITY, bulk update, DTO projection, optimistic lock), 4 db (MVCC, isolation, index, deadlock), 3 api (idempotency, 429/Retry-After, versioning).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4 (phần trắc nghiệm) và 5. **Chỉ THÊM** vào cuối mảng trong `js/data/quiz-spring.js`; id `qz-<topic>-NNN` tiếp nối số lớn nhất hiện có của topic **trên mọi file quiz** (grep "qz-<topic>-" js/data/quiz*.js).
- Đọc các câu cùng topic đã có để không trùng. Câu hỏi theo tình huống thực tế (đoạn code, log, cấu hình), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` (Chọn 2/Chọn 3). Đáp án đúng rải đều vị trí 0–3. Phương án sai phải hợp lý (lỗi hiểu nhầm hay gặp).
- `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai, 400–1200 ký tự.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node --check js/data/quiz-spring.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + số câu mới vào Notes.

## Notes

Đã thêm 15 câu trắc nghiệm: 4 spring (qz-spring-021..024), 4 jpa (qz-jpa-021..024), 4 db (qz-db-021..024), 3 api (qz-api-023..025). Tổng quiz-spring.js: 56 → 71 câu. Validate OK.
Reviewed-by: kilo (T824R)
