# T2213 — Rà soát chất lượng 15 câu id NHỎ nhất trong q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2143

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (`node scripts/qtool.js list js/data/q-devops.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật hiện hành (Java 17/21, Spring Boot 3, AWS/K8s 2026); không bịa API/flag/giá/giới hạn; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| devops-007 | "Ví dụ đời thực" bị copy-paste từ devops-001 (ví dụ Dockerfile layered jar) thay vì ví dụ Linux troubleshooting; regex inline code có dấu `{}` lồng nhau bị validator báo lỗi | Viết lại "Ví dụ đời thực" đúng ngữ cảnh: SSH vào server Linux, dùng uptime/top/top -H/jstack/free/df/ss/lsof/logs khoanh vùng regex catastrophic backtracking gây CPU 100% một core; đưa regex vào code block `~~~text` để tránh lỗi markup |
| devops-001 ~ devops-015 | Kiểm tra 14 câu còn lại: đủ **Tóm tắt:**, ### Trả lời miệng 1 phút, > Senior tip:; đúng kỹ thuật Java 17/21, Spring Boot 3, K8s 2026; không bịa API/flag; markup hợp lệ (không backtick, không `${` trong template literal) | Không cần sửa; nội dung đã đạt chuẩn chất lượng |
Reviewed-by: verify-only (review task)
