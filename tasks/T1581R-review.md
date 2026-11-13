# T1581R — Fact-check nội dung mới của T1581

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1581 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới T1581 trong `js/data/q-ai.js` (ai-095..ai-102).
- Lỗi kỹ thuật/markup: `ai-095` sơ đồ `~~~seq` có 7 actors (vượt 2–6) gây lỗi validate → rút gọn còn 6 actors, gộp bước Retrieval vào `Ứng dụng` (tự xử lý), sửa text actor bị gõ sai/không dấu trong diagram.
- Sửa chữ/nội dung không rõ hoặc sai nghĩa kỹ thuật do lẫn/typo (không bịa API): `ai-095` "lành nhân đợi call tại cửa công ty" → "lễ tân tiếp nhận tại cửa công ty", "alat bảo hộ trên máy xay" → "đồ bảo hộ trên máy chạy", chuẩn hóa phần "Kết quả đo được/Trả lời mẫu khi phỏng vấn/Senior tip/follow" sang tiếng Việt có dấu đúng; `ai-096` "tin nhhan" → "tin nhắn"; `ai-101` "ngans chi phí" → "ngân sách chi phí", "Cache ngue nghia" → "Cache ngữ nghĩa", bảng rủi ro "Khong ngap lut" → "Không gấp", "nguung do gong" → "ngưỡng độ giống"; `ai-100` "bon mu phan tram" (sai số) → "bốn mươi phần trăm" (khớp 40%); `ai-102` "trong vay 24 giay" → "trong vòng 24 giờ" và "duoi hai muoi bon giay" → "dưới hai mươi bốn giờ" (khớp ngữ cảnh xóa dữ liệu).
- Các ý kỹ thuật chính (gateway/rate limit, prompt versioning, RAG/retrieval, guardrail, eval/observability, sync vs async job/idempotency, multi-tenant tenant_id lọc + cache key, incremental update/versioning xóa chunk cũ, online feedback/sampling/eval, A/B test/canary/rollback, tối ưu chi phí routing/cache/batch/quota, retention/PII/redaction/right-to-erasure across log/vector/cache/backup) không phát hiện sai kỹ thuật theo chuẩn nêu.
- `node scripts/build-light-index.js` và `node scripts/validate.js` → OK. (Không chạy `node scripts/test-lessons.js` vì task chỉ sửa `js/data/q-ai.js`, không sửa bài học.)
