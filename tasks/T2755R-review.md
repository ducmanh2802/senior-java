# T2755R — Fact-check nội dung mới của T2755

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2755 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 3 câu mới của T2755 (jpa-093, jpa-094, jpa-095).

Lỗi kỹ thuật đã sửa:
- jpa-095 (mục "Rủi ro consistency"): câu "Query cache phụ thuộc vào update timestamp cache; nếu update không qua Hibernate (bulk update) → cache stale" nói SAI cơ chế. Bulk update JPQL (@Modifying) đi QUA Hibernate nên Hibernate vẫn ghi update timestamps và invalidate ĐÚNG query cache; thứ KHÔNG bị evict là entity cache region. Đã viết lại: bulk update invalidate query cache nhưng không evict entity cache (entity cache trả dữ liệu cũ); chỉ update bằng native SQL NGOÀI Hibernate (kết nối/dịch vụ khác) mới làm cả query cache lẫn entity cache stale.

Không có lỗi ở jpa-093 (IDENTITY tắt batch, SEQUENCE + pooled allocationSize khớp INCREMENT BY, flush/clear, logger BatchingBatch "Executing batch size: 1" đều đúng) và jpa-094 (interface projection closed/open, constructor/record projection, trade-off đều đúng).

Markup: {{...}} và ~~~java cân bằng, không có backtick/`${` lọt vào template literal. Không có chữ nước ngoài lẫn vào (thuật ngữ tiếng Anh giữ nguyên theo chuẩn dự án).

Nghiệm thu: `node --check js/data/q-spring-data.js` → OK. `node scripts/validate.js` → file của tôi KHÔNG có lỗi (chỉ còn cảnh báo cũ db-069, không thuộc diff T2755). Các LỖI còn lại trong validate đều thuộc file của task khác đang chạy song song (quiz-ops.js, lessons-modern.js, lessons-jpa.js, lessons-db.js) và index-light.js (file sinh, integrator sở hữu) — ngoài phạm vi sở hữu của task này nên không sửa (luật 3 AGENTS.md).
