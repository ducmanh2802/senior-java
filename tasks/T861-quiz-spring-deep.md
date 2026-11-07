# T861 — 15 câu trắc nghiệm Spring/JPA/DB internals

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T824

Đọc AGENTS.md mục 4 (schema quiz) và HẾT câu hiện có trong `js/data/quiz-spring.js` để không trùng. id tiếp nối số lớn nhất của từng topic. Khoảng 1/3 là câu nhiều đáp án (`multi: true`, "(Chọn 2)"). Đáp án đúng rải đều vị trí. `explain` giải thích vì sao đúng và vì sao từng phương án sai. Thêm 15 câu khó cấp senior: bean lifecycle/BPP, auto-config conditions, propagation REQUIRES_NEW, rollback-only, dirty checking, flush order, batch fetch, OSIV, B-tree/index-only scan, MVCC, gap lock, HikariCP sizing, join algorithms.

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
- Thêm 15 câu trắc nghiệm cấp senior vào js/data/quiz-spring.js (id tiếp nối max: spring-025..029, jpa-025..029, db-025..029; topic api giữ nguyên max 025).
- 5 câu multi (Chọn 2): spring-027 (REQUIRES_NEW), spring-029 (self-invocation), jpa-027 (@BatchSize), jpa-028 (OSIV), db-025 (composite B-tree). Đáp án đúng rải đều vị trí.
- Chủ đề: BeanPostProcessor/@Priority, auto-config @ConditionalOnProperty(matchIfMissing), REQUIRES_NEW, noRollbackFor, self-invocation/AopContext.currentProxy, flush order, detach, @BatchSize/default_batch_fetch_size, OSIV/open-in-view, second-level cache READ_ONLY, index cột bằng trước/cột khoảng sau, NULL trong B-tree PostgreSQL, hash/nested loop/merge join + work_mem, NULLS FIRST/LAST vs index, Index Cond vs Filter trong EXPLAIN.
- Đã chạy `node --check js/data/quiz-spring.js` và `node scripts/validate.js` → OK. Không commit.
Reviewed-by: kilo (T861R)
