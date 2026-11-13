# T1525R — Fact-check nội dung mới của T1525

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1525 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Tất cả 6 câu hỏi mới (kotlin-030 → kotlin-035) đã được kiểm tra kỹ thuật:

- **kotlin-030** (variance / use-site projection / PECS): đúng về `out T`/`in T`, distinction declaration-site vs use-site, `@JvmWildcard`/`@JvmSuppressWildcards`, và so sánh PECS. Không lỗi kiến thức.
- **kotlin-031** (inline / reified / type erasure): đúng về giới hạn reified (chỉ trên inline function), không thể kiểm tra `List<String>` đầy đủ do erasure, `noinline`/`crossinline`, và ảnh hưởng đến Java API. Không lỗi.
- **kotlin-032** (property delegation / lazy / lateinit): đúng về `LazyThreadSafetyMode` (SYNCHRONIZED/PUBLICATION/NONE), `lateinit` không thread-safe, `isInitialized`, và khác biệt với constructor injection. Không lỗi.
- **kotlin-033** (default arguments / `@JvmOverloads`): đúng về quy tắc sinh overload (bỏ từ cuối), không sinh mọi tổ hợp, synthetic `$default`, và nguy cơ binary incompatibility. Không lỗi.
- **kotlin-034** (use-site targets `@field:`/`@get:`/`@param:`): đúng về nhiều JVM element từ một property, access strategy nhất quán, và quy trình điều tra bằng `javap`. Không lỗi.
- **kotlin-035** (Unit / Nothing / Nothing? / java.lang.Void): đúng về bottom type, subtype của mọi kiểu, `Nothing?` chỉ chứa null, và khác biệt với `Void`. Không lỗi.

**Không phát hiện lỗi kỹ thuật, markup hay chữ nước ngoài lẫn vào.** Nội dung mới đã được giữ nguyên, không chỉnh sửa văn phong hay bố cục.

`node scripts/validate.js` → OK — không có lỗi.
`node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js`.
