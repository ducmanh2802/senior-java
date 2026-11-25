# T2737R — Fact-check nội dung mới của T2737

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2737 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới của T2737 trong `js/data/q-kotlin.js`: kotlin-042, kotlin-043, kotlin-044 (đã thêm ở cuộn file, chưa commit).
- Kiểm tra kỹ thuật: kotlin-042 (platform type, ranh giới null-safety, Intrinsics.checkNotNullExpressionValue, JSpecify @NullMarked, adapter), kotlin-043 (coroutine vs virtual thread, ThreadLocal/SecurityContext/MDC, Dispatchers.IO suy kiệt, virtual thread pinning), kotlin-044 (data class làm JPA entity, equals/hashCode identity, kotlin-jpa no-arg, kotlin-spring all-open) → đúng kiến thức, không bịa API/flag, không số liệu vô căn cứ.
- Markup: không có backtick `/ ${` bên trong template literal, `~~~` block đóng đúng, bảng đã có header + dòng phân cách. `node --check js/data/q-kotlin.js` OK.
- Không có lỗi trong `node scripts/validate.js` liên quan q-kotlin.js.
- Đã chạy `node scripts/build-light-index.js` sinh lại `js/data/index-light.js` (bị cũ do thêm 3 câu hỏi kotlin).
- Lỗi validate còn lại nằm ở `quiz-ops.js` (qz-ai-051…060) và `lessons-jpa.js` (lesson-jpa-020) — file không thuộc task này, để nguyên theo quy sở hữu AGENTS.md §3, không sửa.
- Không thêm/xoá mục, không chỉnh văn phong.
