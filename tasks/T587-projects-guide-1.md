# T587 — Hướng dẫn từng bước cho pet project (1/3)

Status: DONE
Reviewed-by: claude (self-checked: validate)
Agent: qoder
Owns: `js/data/projects.js`

Mỗi milestone của pet project có thể có field tuỳ chọn `guide` (markup, ≥ 800 ký tự; view hiện ở mục "🧭 Hướng dẫn từng bước"). Hiện chưa dự án nào có. Người học là dev Java 4 năm, chưa từng tự dựng dự án từ đầu → cần hướng dẫn **cụ thể đến mức làm theo được**.

Thêm `guide` cho **mọi milestone** của các dự án: **proj-wallet, proj-shortlink, proj-flash-sale, proj-notifications** trong `js/data/projects.js`. Đọc kỹ `requirements`, `architecture`, `tasks`, `done` của từng dự án trước; guide phải khớp với chúng (tên module, bảng, endpoint).

Mỗi guide gồm:
- `### Các bước`: danh sách đánh số 5–10 bước thực hiện theo thứ tự, mỗi bước 1–3 câu (lệnh chạy, file cần tạo, cấu hình).
- `### Code khung`: 1–2 khối `~~~java` / `~~~yaml` / `~~~sql` ngắn (≤ 30 dòng) có comment: phần cốt lõi khó nhất của milestone.
- `### Kiểm tra`: cách tự kiểm chứng (lệnh curl, test, số liệu cần đạt).
- `### Bẫy hay gặp`: 2–4 lỗi thực tế và cách tránh.
- Kết bằng `> Interview tip:` một câu về cách kể milestone này khi phỏng vấn.
Đúng Java 21 / Spring Boot 3.x; không bịa API. Không backtick, không `${`. **Chỉ thêm field guide**, không sửa field khác.

## Nghiệm thu
`node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
- Đã thêm field `guide` (Các bước / Code khung / Kiểm tra / Bẫy hay gặp / Interview tip, mỗi guide ~3.2–4.4 nghìn ký tự) cho mọi milestone của: proj-wallet (5), proj-shortlink (5), proj-flash-sale (5), proj-notifications (5). Chỉ thêm field guide, không đổi field khác. node scripts/validate.js → OK.
