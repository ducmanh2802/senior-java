# T2466 — Viết lại tiếng Việt CÓ DẤU: aws-066, aws-067, aws-068, aws-069

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2384

Các mục sau trong `js/data/q-aws.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **aws-066, aws-067, aws-068, aws-069**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-aws.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-aws.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes

Đã chuyển sang tiếng Việt có dấu chuẩn cho 4 mục sở hữu trong js/data/q-aws.js:
- aws-066 (Secrets Manager / Parameter Store / xoay mật khẩu RDS)
- aws-067 (IRSA / EKS Pod Identity / OIDC / STS)
- aws-068 (CodeDeploy blue/green ECS Fargate / rollback 5xx)
- aws-069 (Kinesis Data Streams vs Amazon MSK trade-off)

Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh. Không thêm/bỏ mục, không đổi code/test.
Kiểm tra: `node --check js/data/q-aws.js` OK; `grep -c "Tom tat" js/data/q-aws.js` = 0 trong aws-066..069 (còn 4 ở aws-070..073, ngoài phạm vi task này).
`node scripts/validate.js` không báo lỗi nào về q-aws.js / aws-066..069 (các LỖI còn lại là lessons-spring.js, file không thuộc task này, không được sửa).
Reviewed-by: kilo (T2466R)
