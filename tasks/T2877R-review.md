# T2877R — Fact-check nội dung mới của T2877

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2877 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check nội dung mới của T2877 (2 mục `sd-043` BNPL và `sd-044` eKYC ở cuối file). Các lỗi đã sửa:

- **Trùng id (lỗi cấu trúc nghiêm trọng):** 2 mục mới dùng `id: 'sd-043'` và `id: 'sd-044'` đã tồn tại ở HEAD (mục BNPL/eKYC cũ tại dòng ~6061 và ~6258). Đổi id mục mới thành `sd-068` (BNPL) và `sd-069` (eKYC) — id kế tiếp sau `sd-067` cao nhất. Không sửa nội dung HEAD, không thêm/xoá mục.
- **Chữ nước ngoài lẫn vào:** `sd-043` followups có "không 중단 duyệt" (chữ Hàn `중단` = ngừng/dừng) → sửa thành "không ngừng duyệt".
- Nội dung kỹ thuật còn lại đúng: công thức amortization annuity chuẩn, luồng Kafka/Redis/Drools/SSE-KMS/presigned URL/S3 tiered/Glacier/NFC passive authentication (DG1/DG2/DG14/SOD) đều là API/cơ chế có thật; ước lượng số liệu nhất quán (50k×10MB=500GB/ngày, 500GB×365×5≈912TB). `related` trỏ tới banking-001/004, design-022, security-001, scenario-056/057 đều tồn tại.
- Lưu ý (không sửa vì ngoài phạm vi fact-check, thuộc văn phong/độ dài): nhiều chỗ dùng placeholder `{{code}}` rỗng (render ra chữ "code") — đây là lỗi soạn thảo của model free, cần task nội dung điền lại; không phải lỗi kiến thức.
- `node scripts/validate.js`: sd-problems.js không còn lỗi (các LỖI còn lại đều ở file khác: q-frontend, quiz-ops, lessons-*, toeic-lr — không thuộc task này). Đã chạy `node scripts/build-light-index.js` sinh lại index-light.js.
