# T2172 — Rà soát chất lượng 15 câu mới nhất trong q-remote.js

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu mới nhất (`node scripts/qtool.js list js/data/q-remote.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: thông tin về làm remote/freelance đúng thực tế (Upwork, thuế, hợp đồng) không bịa phí/quy định; lời khuyên cụ thể.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-remote.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| remote-054 | Trích dẫn nghiên cứu không chắc nguồn: "Who Is AI Replacing..." (Management Science, 2025; 61 nước; giảm 21% trong 8 tháng) — chi tiết bịa/LLM-produced | Bỏ trích dẫn cụ thể (tên báo, năm, số lượng, tỷ lệ), viết lại ở mức nguyên lý: "Nhiều nghiên cứu và dữ liệu nền tảng cho thấy..." |
| remote-055 | Sơ đồ ~~~seq có bước vượt 60 ký tự ("Lọc client (spent/hire rate/payment verified) + gửi proposal sớm" ≈ 68) và lỗi chính tả "by chứng" | Rút gọn bước thành "Lọc client (spent, hire rate) + gửi proposal sớm"; sửa "by chứng" → "bằng chứng", bước đầu giữ ≤ 60 ký tự |

15 câu mới nhất reviewed (remote-052 → remote-066): không còn lỗi schema, không ký tự cấm (`backtick`, `${`), tham chiếu `#/jobs` hợp lệ, các công cụ/tên thư viện trong ví dụ (gitleaks, trufflehog, Supabase RLS, Knex, pgvector, Spring AI/LangChain4j, pg_stat_statements, ECS Fargate, Prisma, Redis SETNX/Redlock…) đúng thực tế.
Reviewed-by: verify-only (review task)
