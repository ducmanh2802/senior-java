# T1046R — Fact-check nội dung mới của T1046

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1046 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã rà `git diff HEAD -- js/data/lessons-banking.js` (phần MỚI do T1046 thêm/sửa, chưa commit). `node --check js/data/lessons-banking.js` OK. `node scripts/test-lessons.js` → `Lesson exercises OK: 220/220 (197 bài học, 215 từ cache)`.
- `node scripts/validate.js` còn 3 LỖI thuộc **`q-banking.js`** (banking-005/010/014: sơ đồ `~~~seq` có 7–8 actors, vượt giới hạn 2–6; `q-banking.js` không thuộc ownership của task này) — không phải lỗi trong `lessons-banking.js`. `lessons-banking.js` không sinh lỗi/cảnh báo mới.
- Sửa lỗi markup/kỹ thuật trong phần MỚI (theo từng id/bài học trong diff):
  - **lesson-banking-006** (TransferStateMachine, ~tests 1021–1047 trong diff): khôi phục tên test về slug ASCII nhất quán với convention trong file (`PENDING_khong_duoc_nhan_CONFIRM_SUCCESS`, `PENDING_khong_duoc_nhan_CONFIRM_FAILURE`, `da_SUCCESS_khong_con_nhan_CONFIRM`, `FAILED_khong_nhan_CONFIRM`) — T1046 đã chèn tiếng Việt có dấu/khoảng trắng vào chuỗi định danh test (không phải chỉ message), gây mất đồng nhất và khó đọc log; logic/assert/ngoại lệ giữ nguyên, đúng với bảng chuyển trạng thái (no-op vs `IllegalStateException`).
  - **lesson-banking-007** (HoldLedger, ~tests 1357, 1368, 1369): khôi phục slug ASCII cho `capture_idempotent_khong_mo_lai_hold`, `release_khong_mo_lai_hold`, `mo_lai_holdId_da_dong_du_soi_tien_nho_cung_khong_duoc` (T1046 chèn dấu/khoảng trắng vào tên test). Logic giữ nguyên: retry `holdId` đã đóng là no-op `false`; số nhỏ `0.6` → làm tròn `HALF_UP` còn 1 đồng nhưng `holdId` đã đóng vẫn no-op (đúng bất biến idempotency/hold đóng một lần).
  - **lesson-banking-008** (DailyLimit, ~1805 comment): sửa comment tiếng Việt lẫn ký tự lạ `được-chan/lần` → `// Nhiều tài khoản song song: tài khoản này không được chan lan tai khoan kia` (comment Java ASCII, rõ nghĩa).
- Đã kiểm tra phần MỚI còn lại (comment/exception message Việt hóa trong Ledger/TransferStateMachine/HoldLedger/DailyLimit/EodJob): không có backtick thừa ngoài fence `~~~`, không có `${` chưa escape, cơ chế idempotency/append-only/reversal/HALF_UP/Asia/Ho_Chi_Minh/actual-365 (theo ngữ cảnh bài) nhất quán; không thấy API/flag bịa hay số liệu vô căn cứ trong các thay đổi T1046.
- **Không sửa nội dung đã có ở HEAD** (ví dụ `lesson-banking-001` body vẫn là nội dung HEAD; các cảnh báo/ lỗi ngoài file này giữ nguyên). Không thêm/xoá mục. Không git commit.
