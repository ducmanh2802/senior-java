# T2541R — Fact-check nội dung mới của T2541

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2541 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-ai-019 (RAG hands-on BM25 + RRF): bo tu "slightly" (trung tieng Anh khong ky thuat) o Senior tip -> "khac mot chut". Con lai kiem tra ki thuc: cong thuc BM25/IDF, vi du tinh tay 3 tai lieu (D1=D2=0.984, D3=0), cong thuc RRF 1/(60+rank), vi du [B,A,D,C] — deu dung. Bai tap Bm25Index/Rrf va 3 cau check dung ki thuc, chay OK tren test-lessons.js.
- lesson-ai-020 (RAG hands-on MMR): cong thuc MMR, vi du [A,C,B] voi lambda=0.7, bai tap Mmr.select tie-break chi so thap hon, 3 cau check — deu dung ki thuc, chay OK tren test-lessons.js.
- Khong sua noi dung da co o HEAD; khong them/xoa muc. validate.js khong bao loi trong lessons-ai.js; loi con lai (bugs.js bug-047/048, lessons-api.js lesson-api-013, lesson-api-014/lesson-sql-018 o test-lessons) thuoc file khac, khong sua duoc theo quy 3.
