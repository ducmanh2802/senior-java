# T580 — 6 câu code review round (PR Java có bug)

Status: TODO
Agent: qoder
Owns: `js/data/q-scenario.js`

Format phỏng vấn mới: interviewer đưa một đoạn Java (thường "do AI sinh") và hỏi "Review PR này". Thêm 6 câu topic scenario, mỗi câu:
- `q`: 1 câu dẫn + đoạn code 15–30 dòng trong `~~~java` chứa **2–3 lỗi thật**, nhìn qua thấy hợp lý.
- `a`: từng lỗi theo mức nghiêm trọng (vì sao sai, hậu quả production, cách sửa), code đã sửa, và "cách bạn nói khi review" (lịch sự, có ưu tiên). Kết thúc `> Senior tip:` về cách review code AI sinh ra.
Chủ đề 6 đoạn: (1) check-then-act trên ConcurrentHashMap + đếm bằng int không atomic; (2) @Transactional self-invocation + gọi HTTP bên trong transaction; (3) InputStream/Connection không try-with-resources + nuốt exception; (4) equals không kèm hashCode trong HashSet + key mutable; (5) retry không backoff/jitter + không idempotent khi gọi thanh toán; (6) static HashMap cache không giới hạn + SimpleDateFormat dùng chung giữa thread.
Code phải là Java hợp lệ (lỗi cố ý là lỗi logic/thiết kế). Level senior.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-scenario.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**. Trùng thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21 (có thể nhắc 25 LTS), Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-scenario.js`.

## Nghiệm thu
`node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
