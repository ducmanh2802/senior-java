# T1400 — Nâng cấp đáp án q-devops: devops-121 … devops-126

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1398

## Notes

Đã bổ sung cho 6 câu devops-121..126 trong js/data/q-devops.js:
- Mỗi câu thêm mục `### Ví dụ đời thực` (tình huống production có số liệu, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ, trích dẫn, ngôi thứ nhất), chèn ngay trước dòng `> Senior tip:`.
- Không xoá/sửa nội dung đã có; field `follow` đã có sẵn ở mọi câu nên không thêm.
- Chỉ dùng `{{code}}` cho inline code, không backtick, không `${` (đã sửa 1 backtick nhầm ở devops-124).
- Chạy `node scripts/build-light-index.js` + `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: kilo (T1400R)
