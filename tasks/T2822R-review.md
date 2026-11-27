# T2822R — Fact-check nội dung mới của T2822

Status: TODO
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2822 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 4 lab mới trong `js/data/labs-gc.js` (lab-gc-038, 039, 040, 041) và sửa trực tiếp các lỗi sau (chỉ trong phần mới, dòng ≥7184; nội dung HEAD giữ nguyên):

- lab-gc-038: `Cám {{FileChannel}}` → `Cấm`; rubric `situation đồi xấu hơn` → `tình huống đồi xấu hơn`.
- lab-gc-039: `Nên distingue với` (từ Pháp) → `Phân biệt ...`; `RMI DGC Dor� gọi` → `để gọi`; `code producción` (3 chỗ) → `code production`; `ẩn-dn` → `ẩn`; sửa lỗi cú pháp: template literal `answer` thiếu backtick đóng + thiếu `,` sau nó (dùng lại `heap.` + backtick + `,`); xóa ký tự lạ Cyrillic `обвин` → `đừng trách heap`.
- lab-gc-040: `Cám {{rs.getBytes()}}` → `Cấm`.
- lab-gc-041: `class metadata stays trong Metaspace` (2 chỗ answer) + `...plugin stays trong Metaspace` → `vẫn nằm trong Metaspace`; `Cám {{new URLClassLoader()}}` / `Cám static field` → `Cấm` (2 chỗ).
- Cấu hình file: xoá `)` dư cuối file (file bọc tất cả lab trong 1 `.push(...)` chỉ cần 1 `)`).

Kiểm tra: `node --check js/data/labs-gc.js` → SYNTAX_OK; `node scripts/validate.js` → không còn lỗi nào từ `labs-gc.js` (các LỖI còn lại của validate nằm trong file HEAD khác: quiz-ops.js, lessons-*.js, q-frontend.js, index-light cũ — ngoài quyền sở hữu task, không chạm theo AGENTS.md §2.3/§3).
Status: DONE