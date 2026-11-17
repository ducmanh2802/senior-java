# T2332R — Fact-check nội dung mới của T2332

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2332 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã fact-check 20 drill mới `drill-qa-182` … `drill-qa-201` (phần thêm mới so với HEAD, 120 dòng chỉ thêm, không sửa/xoá mục cũ).
- **Không có lỗi kiến thức** trong nội dung mới. Cụ thể đã kiểm tra:
  - `drill-qa-183`: "payment success rate dropped" → "downstream bank returning timeouts" → chuyển traffic sang backup provider bằng flag, khôi phục sau ~10 phút, "fifteen minute outage" — logic sự cố nhất quán (10 phút khôi phục + thời gian phát hiện ≈ 15 phút), không có API/flag bịa.
  - `drill-qa-190`: chọn `database table + worker polling` thay vì Kafka cho ~20 msg/phút, nói rõ trade-off "không scale lên hàng triệu message nếu không viết lại" và đặt ngưỡng revisit — đúng, không nói ngược.
  - `drill-qa-191`: cutover billing DB 50k account, shadow mode (ghi cả hai, so sánh kết quả), rollback plan, switch cuối tuần — đúng thực hành migration an toàn.
  - `drill-qa-192`: đo latency trước khi thêm cache, phát hiện thời gian nằm ở external call, dùng timeout + circuit breaker — đúng thứ tự ưu tiên (đo → timeout/circuit breaker → cache), không sai cơ chế.
  - `drill-qa-194`: legacy order service, thêm index cho query chậm, p95 giảm ~40%, "gradual improvement beats a risky rewrite" — hợp lý.
  - `drill-qa-200`: contract-first + mock server + integration test để làm song song với team inventory — đúng.
  - `drill-qa-201`: release thiếu full test suite → 5% user không login được 1 giờ → rollback, blameless postmortem, smoke test login — nhất quán.
- Kiểm tra schema/format (không sửa vì đã đúng): 20 id mới liên tục 182–201, không trùng id, không trùng `q` với 181 drill cũ, đủ field `id/kind/theme/level/seconds/q/sample/phrases`, `theme` ∈ behavioral/project/negotiation, `seconds` = 120, `sample` 110–130 từ (yêu cầu 80–200), `phrases` 4–5 mục (yêu cầu 3–6), không backtick, không `${`, không ký tự non-ASCII, không lẫn từ tiếng Việt.
- Không sửa nội dung nào ở HEAD; không thêm/xoá mục.
- Nghiệm thu: `node --check js/data/drills-qa.js` → OK; `node scripts/build-light-index.js` (index-light 339.6 KB, có đủ 201 drill-qa); `node scripts/validate.js` → `OK — không có lỗi.` (lỗi `index-light.js: đã cũ` xuất hiện ở lần chạy đầu đã được xử lý bằng build-light-index; các lỗi của file khác do agent khác sở hữu hiện đã hết).
