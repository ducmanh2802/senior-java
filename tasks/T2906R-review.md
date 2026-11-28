# T2906R — Fact-check nội dung mới của T2906

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2906 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Lỗi đã sửa trong js/data/quiz-ccap-2.js (nội dung mới qz-ccap-341..380):
- qz-ccap-341: xóa ký tự Trung "噪" ("làm噪 prompt" → "làm ồn prompt").
- qz-ccap-342: xóa backtick trong {{`rm -rf /`}} / {{`os.system('wget malware')`}} (vỡ template literal).
- qz-ccap-377: xóa ký tự Trung "平" ("công平" → "công bằng").
- qz-ccap-368: sửa answer [0,1] → [0,3] và căn chỉnh giải thích (bản gốc mâu thuẫn: giải thích đánh chỉ golden eval đúng, còn answer gộp cả dashboard request count đã được giải thích là sai; chỉ golden eval + họp tuần phát hiện sớm hơn 2 tuần).
- qz-ccap-351.q, qz-ccap-354.q: thay backtick bằng {{code}}.
- qz-ccap-355.explain: sửa số `{{`/`}}` không khớp (0/2) do ví dụ schema lồng nhau tạo ra `}}` dư.
- qz-ccap-373.explain: xóa ký tự Trung "混淆".

quiz-ccap-2.js: node --check pass; validate.js không còn báo lỗi nào thuộc file này.

Các lỗi còn lại trong validate.js nằm trong file KHÔNG sở hữu (quy tắc 3, không sửa): lessons-api.js (cú pháp), quiz-ops.js (cú pháp), lessons-modern.js (body < 2500 ký tự), path.js (lesson-api-00x không tồn tại), toeic-lr-2a.js (cú pháp). index-light.js cũ vì build-light-index.js bị chặn bởi lessons-api.js lỗi cú pháp (file không sở hữu) → validate.js không thể in "OK — không có lỗi" toàn repo do các file trên.
