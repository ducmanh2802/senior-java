# T723 — 8 câu tình huống kỹ thuật thật từ review phỏng vấn voz

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`

Nguồn: `docs/research/voz-interview-reviews.md`. Gom các câu **kỹ thuật backend/Java** được hỏi trong review (system design nhỏ: feature flag, rate limit, đặt vé…; DB: index, isolation; Kafka; cache). Với mỗi câu, grep ngân hàng (`js/data/q-*.js`) xem đã có câu tương đương chưa; chọn 8 câu CHƯA có, topic `scenario`, viết lại theo phong cách phỏng vấn ("Interviewer ở công ty X hỏi: …" — được nêu tên công ty, không nêu người đăng). Đáp án đầy đủ chuẩn AGENTS.md mục 6; `refs` gồm URL bài voz gốc (type 'article').

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-scenario.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-scenario.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Added: scenario-109..scenario-116 (8 câu).
Reviewed-by: kilo (T723R)
