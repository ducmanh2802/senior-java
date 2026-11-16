# T2275 — Rà soát chất lượng các câu trắc nghiệm (lượt 2) trong quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2203

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (lượt 2) (`node scripts/qtool.js list js/data/quiz-spring.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng; explain nói vì sao từng phương án sai; phương án nhiễu hợp lý, không sai lộ liễu; đáp án đúng rải đều vị trí 0–3; đúng Spring Boot 3.x / Spring 6; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát toàn bộ **137 câu** trong `js/data/quiz-spring.js` (vòng 2, gồm ~107 câu chưa được rà ở T2203). Đọc theo từng khối, không đọc cả file một lần. Số mục trước/sau: **137 → 137** (không xoá, không đổi id).

Kết quả: **122/137 câu đạt yêu cầu** (đáp án đúng, multi có "(Chọn N)" khớp, explain nêu được vì sao từng phương án sai, distractor hợp lý). **15 câu chất lượng thấp** (viết tắt, distractor sai lộ liễu, thiếu giải thích, có câu sai logic, có câu explain tiếng Anh) đã được viết lại. Trong đó 2 câu có lỗi logic thật (2 phương án cùng đúng), 1 câu explain tiếng Anh.

### Bảng sửa

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-spring-021 | Hỏi "Method có rollbackFor?" lủng củng, đáp án/explain 5 dòng; distractor "Compile lỗi" sai lộ liễu | Viết lại thành kịch bản self-invocation cụ thể: `handle()` có @Transactional (gọi qua proxy) gọi `this.audit()` cũng @Transactional. 4 phương án hợp lý, đáp án 1; explain giải thích proxy, vì sao handle() vẫn có transaction còn audit() thì không, 3 cách sửa (bean khác / AopContext / TransactionTemplate) |
| qz-spring-022 | **Sai logic**: 4/5 phương án là phát biểu ĐÚNG (singleton, prototype, session, application); chỉ dựa vào chữ "mỗi request" để loại; explain còn ghi "prototype... đúng" | Viết lại thành "phát biểu nào đúng về bean scope", đáp án [0,2] (singleton mặc định; prototype tạo mới mỗi lần getBean/inject, Spring không giữ tham chiếu). Distractor sai rõ: request vs session, application = 1 instance/ServletContext, singleton không tạo lại theo request. Thêm bảng 5 scope + bẫy inject prototype vào singleton |
| qz-spring-023 | Câu hỏi 1 dòng "auto-config bật khi nào?"; distractor "spring.boot.enable-autoconfig=true" là thuộc tính bịa | Viết lại theo kịch bản starter Redis, đáp án 2; explain @ConditionalOnClass + @ConditionalOnMissingBean (AND), cách loại trừ bằng exclude/`spring.autoconfigure.exclude`, xem Condition Evaluation Report bằng --debug |
| qz-spring-024 | "Phase nào chạy sau commit thành công?" nhập nhằng vì AFTER_COMPLETION cũng chạy sau commit → đáp án [0,2] dễ tranh cãi | Viết lại thành "phát biểu nào đúng về phase", đáp án [0,2] (AFTER_COMMIT, AFTER_ROLLBACK); distractor BEFORE_COMMIT, AFTER_COMPLETION chạy trước khi kết thúc, fallbackExecution=false. Ghi rõ AFTER_COMPLETION chạy sau khi kết thúc (cả commit/rollback) |
| qz-jpa-021 | Câu hỏi 4 dòng "IDENTITY có vấn đề gì?"; distractor "Không compile" sai lộ liễu | Viết lại thành kịch bản batch insert 5.000 dòng chậm dù đã bật batch_size, đáp án 2; explain IDENTITY buộc INSERT ngay, SEQUENCE + pooled optimizer, vai trò order_inserts, flush/clear; distractor batch_size chỉ hỗ trợ MySQL / order_inserts là nguyên nhân / parallelStream |
| qz-jpa-022 | Câu hỏi chung chung "bulk update có tác dụng gì"; thiếu giải thích vì sao từng phương án sai | Viết lại theo "cấu hình bulk update an toàn", đáp án [0,1] (flushAutomatically + clearAutomatically; hoặc tự clear sau bulk); explain cơ chế bỏ qua persistence context, nguy cơ stale/ghi đè, TransactionRequiredException; link qz-jpa-032 |
| qz-jpa-023 | Câu hỏi định nghĩa 1 dòng; distractor "Cache L2" vô lý | Viết lại theo "vì sao dùng projection cho màn hình danh sách", đáp án 3; explain projection chỉ SELECT cột cần, không tạo entity managed, interface projection + constructor expression (đưa code ra block ~~~java để tránh lỗi lồng ngoặc của validate); khi nào vẫn dùng entity |
| qz-jpa-024 | "Optimistic lock hoạt động thế nào" chung chung; distractor "Tự retry" sai lộ liễu | Viết lại thành "phát biểu nào đúng về @Version", đáp án [0,1]; explain câu UPDATE có `where version = ?`, 0 dòng → OptimisticLockException, retry NGOÀI transaction, kiểu dữ liệu hợp lệ (int/Integer/long/Short/Timestamp); khi nào optimistic vs pessimistic |
| qz-db-021 | Định nghĩa MVCC 1 dòng; distractor "Khoá bảng khi write" sai lộ liễu | Viết lại, đáp án 0; explain tuple versions + snapshot, readers không block writers, dead tuple + VACUUM (link qz-db-009), phân biệt mô hình lock-based |
| qz-db-022 | **Sai logic**: "READ COMMITTED với SELECT FOR UPDATE" thực ra ngăn được lost update nhưng bị loại; đáp án [1,3] | Viết lại thành "phát biểu nào đúng về lost update", đáp án [0,1] (RC đơn thuần KHÔNG ngăn; PostgreSQL RR báo 40001 buộc retry); distractor SERIALIZABLE dùng SSI không phải pessimistic lock, READ UNCOMMITTED, "chỉ MySQL mới gặp" |
| qz-db-023 | **Explain viết bằng tiếng Anh**; nội dung trùng gần như y hệt qz-db-007 | Việt hóa toàn bộ; đổi ví dụ sang `date_trunc('day', created_at)` để không trùng; đáp án 2; explain expression index phải khớp đúng biểu thức, ANALYZE/HASH/USE INDEX sai; thêm Senior tip + link qz-db-007 |
| qz-db-024 | Câu hỏi 3 dòng; distractor "Index thiếu" vô lý | Viết lại, đáp án [0,1]; explain wait cycle, thứ tự lấy lock khác nhau, cách PostgreSQL (deadlock_timeout, abort 1 txn) và MySQL (rollback 1213) xử lý, phải retry; link qz-db-013 về gap lock |
| qz-api-023 | Định nghĩa idempotency 1 dòng | Viết lại, đáp án 3; explain timeout → retry → duplicate, lưu key + fingerprint, cùng key khác payload → 409, claim nguyên tử; link qz-api-039 |
| qz-api-024 | Câu hỏi 3 dòng; distractor Set-Cookie/Location/ETag sai lộ liễu | Viết lại, đáp án [0,1]; explain Retry-After (RFC 9110) + RateLimit headers (draft IETF), ví dụ header cụ thể, vì sao 429 không phải 403/503; link qz-api-011 |
| qz-api-025 | "An toàn nhất" chủ quan; explain lại nói "phổ biến nhất" (mâu thuẫn) | Viết lại thành "phổ biến nhất + dễ cache/route", đáp án 0 (URL path); explain ưu/nhược của URL path, query param, custom header; expand/contract + Deprecation/Sunset; link qz-api-013/037 |

### Các câu không sửa (kiểm tra kỹ, ví dụ)
- **qz-spring-008** (REQUIRED + rollback-only + UnexpectedRollbackException): đáp án 1 đúng, explain nêu đủ vì sao 3 phương án còn lại sai.
- **qz-jpa-030** (N+1 select, @OneToMany mặc định LAZY): đáp án 3 đúng, giải thích 1+N và 3 cách sửa.
- **qz-db-013** (next-key lock / gap lock MySQL): đáp án 2 đúng, explain chính xác về locking read ở REPEATABLE READ.
- **qz-api-016** (308 Permanent Redirect giữ method + body): đáp án 2 đúng, bảng so sánh 301/302/303/307/308 chính xác.
- **qz-spring-042** (@ConditionalOnMissingBean): đáp án 0 đúng, giải thích NoUniqueBeanDefinitionException.

### Phân bố đáp án
Sau khi viết lại (đưa bớt đáp án đúng về vị trí 2–3), phân bố câu 1 đáp án: **0:25, 1:33, 2:22, 3:19** (trước khi sửa: 0:25, 1:38, 2:19, 3:17) — cân đối hơn.

### Nghiệm thu
- `node --check js/data/quiz-spring.js` → OK
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (315.9 KB)
- `node scripts/validate.js` → **OK — không có lỗi.**
- `node scripts/validate.js quiz-spring.js` → **OK — không có lỗi.** (xác nhận riêng file sở hữu)
- Không dùng backtick/`${` trong template literal; mọi câu multi có "(Chọn N)" khớp `answer.length`.

### Ghi chú vận hành
- Trong lúc chạy, `validate.js` báo lỗi tạm thời ở `js/data/quiz-java.js` (`qz-core-010.explain`: `{{static {}}}` lồng ngoặc) do một agent khác đang sửa dở file đó. Không sửa vì ngoài phạm vi sở hữu; sau đó agent kia hoàn tất, validate toàn repo OK.
- Không commit, không tạo branch.
