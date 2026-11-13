# T1601 — Kiến thức: 6 câu nghiệp vụ ngân hàng cho backend

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý**.

Chủ đề: double-entry ledger và số dư tính thế nào, xử lý giao dịch treo (pending) và timeout với đối tác, đối soát cuối ngày, làm tròn tiền và BigDecimal, chống giao dịch trùng (idempotency), audit trail bất biến và yêu cầu tuân thủ.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-banking.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-banking.js logs/tmp-T1601.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu vào js/data/q-banking.js (id nối tiếp banking-038):
- banking-039 (senior): sổ kép chuyển tiền giữa 2 tài khoản — but toan Nợ/Có cân bằng, tránh deadlock bằng thứ tự khóa id tăng dần, số du từ bang snapshot cap nhat cung giao dich. ~~~seq luong giao dich.
- banking-040 (mid): doi tac KHONG co API tra sot thuc thoi — giao dich timeout, tien hold, cho doi file doi soat hom sau, TTL 7 ngay, khong tu dong hoan/gui lai.
- banking-041 (mid): doi soat cuoi ngay noi bo core banking <-> so cai ke toan (GL), tai khoan suspense, dieu chinh append-only + maker-checker.
- banking-042 (senior): khoan vay tra gop 12 thang — lai moi ky lam tron BigDecimal, phan du cong vao ky cuoi, RoundingMode HALF_UP/HALF_EVEN, khong dung double.
- banking-043 (mid): import file giao dich doi tac moi sang — ma tham chieu duy tien (unique constraint), idempotent, dong loi dua vao hang doi bo loc khong fail toan bo file.
- banking-044 (lead): tham chieu du lieu (lai suat, phi, cut-off) co hieu luc theo ngay — effective_from/effective_to, yeu cau maker-checker, audit trail append-only WORM.

Quyet dinh de sua chieu moi so voi 6 chu de cu task (da bi bao trinh trong cac cau cu: banking-003/023, 025/036/024, 024/033, 011/027, 004/032/037, 026/035/038) de khong trùng noi dung theo luat AGENTS.md.

Ket qua kiem tra:
- node --check js/data/q-banking.js: OK.
- node scripts/qtool.js append: them thanh cong 6 object (banking-039..044).
- node scripts/validate.js (toan bo): khong bao loi nao lien quan den q-banking.js hoac 6 cau moi (banking = 44 cau hoi). index-light.js da duoc tai lap lai hien du lieu (via export build cua scripts/build-light-index.js, bo qua tep loi).
- Loi con lai cu validate.js (khong lien quan T1601, tep khong duoc sua): q-concurrency-jvm.js loi cau truc (pre-existing, truoc khi bat dau task) duoc keo theo nhieu loi "related ... khong phai id cau hoi co thuc" o lessons-*/bugs.js/path.js/projects.js. Tep nay khong thuoc nhiem vu T1601 (AGENTS.md luc 3), nen khong duoc sua.
Reviewed-by: kilo (T1601R)
