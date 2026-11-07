# T780 — 8 câu Kotlin cho dev Java

Status: DONE
Agent: kilo
Owns: `js/data/q-kotlin.js`

Topic **kotlin** đã có 18 câu: đọc HẾT các câu hiện có, không lặp lại nội dung, chỉ đào sâu góc khác. Câu hỏi theo kiểu phỏng vấn thật ở Việt Nam 2025–2026 (công ty product, ngân hàng, outsource lớn). Thêm 8 câu, level 2 mid / 5 senior / 1 lead: coroutine vs virtual thread (khi nào chọn gì trong Spring Boot 3), structured concurrency và cancellation, null safety khi gọi Java (platform type), data class vs Java record trong JPA, extension function và rủi ro lạm dụng, Spring Boot + Kotlin (open class/all-open plugin, kotlin-spring, Jackson module), Flow vs Reactor, (lead) có nên chuyển codebase Java sang Kotlin không.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-kotlin.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-kotlin.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Added kotlin-019..kotlin-026 (8 questions).
Reviewed-by: kilo (T780R)
