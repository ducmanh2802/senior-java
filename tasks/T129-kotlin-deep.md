# T129 — Kotlin cho Java backend dev

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~8 câu** topic `kotlin` (id tiếp nối, ~2 mid / 4 senior / 2 lead, 2500–4000 ký tự, kết bằng `> Senior tip:`): null-safety và interop với Java (platform type, @Nullable), coroutines vs virtual threads (structured concurrency, Dispatchers.IO, suspend trong Spring WebFlux/MVC), data class vs record + JPA entity (bẫy equals/hashCode, plugin kotlin-jpa/all-open), sealed class cho domain/error, extension function lạm dụng, Flow vs Reactor, chuyển dần service Java sang Kotlin. Code ví dụ dùng ~~~kotlin nếu validator cho phép, không thì ~~~java/~~~text. `node scripts/validate.js` → OK, rồi `Status: DONE` + ghi chú.

## Notes

- Giữ nguyên 10 câu `kotlin-001..010` của T105 (không sửa/xoá); chỉ **thêm** 8 câu deep-dive `kotlin-011..018`.
- Phân bổ đúng yêu cầu: 2 mid (`011`, `016`), 4 senior (`012`, `014`, `015`, `017`), 2 lead (`013`, `018`). Độ dài đáp án mới 2866–3633 ký tự, đều kết bằng `> Senior tip:` và có 3 câu `follow`.
- Nội dung: Jackson + null-safety/validation ở biên; `suspend` trong Spring MVC/WebFlux (transaction, SecurityContext, MDC, cancellation); structured concurrency + `Dispatchers.IO`/bulkhead; JPA entity `equals`/`hashCode`/`toString` + `Persistable`; sealed error → `ProblemDetail`, serialization và tiến hoá contract; lạm dụng extension/DSL/operator; Flow vs Reactor (backpressure, context, interop); migration nhiều module (kapt/KSP, `javaParameters`, plugin Spring/JPA, biên API Java).
- Code Kotlin dùng fence `~~~kotlin`; validator và `App.md()` chấp nhận, hiển thị `data-lang="kotlin"`.
- Kiểm tra: `node --check js/data/q-kotlin.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (không có cảnh báo cho `q-kotlin.js`). Không sửa file nào khác.Reviewed-by: opencode (T129R)
