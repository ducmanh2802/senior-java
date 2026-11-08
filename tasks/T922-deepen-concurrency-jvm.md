# T922 — Đào sâu 9 câu trong q-concurrency-jvm.js

Status: DONE
Agent: claude
Owns: `js/data/q-concurrency-jvm.js`
After: T897

**Đào sâu** các câu dưới đây (đáp án hiện 2000–3000 ký tự, đúng nhưng chưa đủ sâu). **Giữ** phần đã đúng và cấu trúc tốt hiện có; **bổ sung** để người học tự hiểu tận gốc mà không cần ai giảng thêm:

**Id cần đào sâu:** `concurrency-034`, `concurrency-035`, `concurrency-036`, `concurrency-037`, `jvm-033`, `jvm-034`, `jvm-035`, `jvm-036`, `jvm-037`

Bổ sung cho mỗi câu (chèn vào đúng chỗ, không lặp ý cũ):
- Giải thích **cơ chế bên trong** sâu hơn một tầng (bước nào xảy ra, vì sao thiết kế như vậy, so với cách khác).
- `### Ví dụ đời thực`: một tình huống production cụ thể có số liệu (giả định hợp lý): triệu chứng → điều tra → xử lý → kết quả đo được.
- Nếu có luồng nhiều bên (≥ 3 hệ thống) mà chưa có sơ đồ: thêm `~~~seq`.
- `### Sai lầm hay gặp` (nếu chưa có): 2–4 lỗi thật của dev, hậu quả, cách tránh.
- `### Trả lời mẫu khi phỏng vấn`: đoạn nói tự nhiên 60–90 giây (150–220 từ) như ứng viên Senior.
- Giữ `> Senior tip:` ở cuối (làm sắc hơn nếu chung chung).
Độ dài sau khi đào sâu: **3200–5000 ký tự**. Đúng kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành), không bịa API/flag; sửa chỗ sai nếu thấy và ghi vào Notes. Không backtick, không `${`.

Chạy `node scripts/validate.js` → OK.

> **CHỈ SỬA ĐÚNG CÁC ID LIỆT KÊ:** với mỗi id, chỉ thay nội dung field `a` (và thêm `follow` nếu thiếu); giữ nguyên `id`, `topic`, `level`, `q`, `tags`, `refs`, `lang`. KHÔNG viết lại cả file, KHÔNG đụng object khác (file có thể đang chứa nội dung chưa commit của task khác). Sửa bằng thao tác thay thế đúng đoạn `a: ` của từng id. Trước khi đánh DONE: số id trong file (`grep -c "id: '"`) phải KHÔNG đổi.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Task này là NGOẠI LỆ:** chỉ sửa field `a` (và thêm `follow` nếu thiếu) của các id liệt kê ở trên trong `js/data/q-concurrency-jvm.js`; không thêm câu mới, không đụng câu khác.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id đã đào sâu vào Notes.

## Notes

Claude 2026-11-07: đào sâu 9 câu concurrency/JVM.
