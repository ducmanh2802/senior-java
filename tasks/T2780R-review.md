# T2780R — Fact-check nội dung mới của T2780

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2780 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check 3 câu mới của T2780 (testing-082/083/084). Sửa 1 lỗi kỹ thuật:
- testing-082 (chiến lược test chuyển tiền): Pact contract test bị nói ngược. Đã sửa "provider publish pact file, consumer verify" → "consumer publish pact file, provider verify" (đúng consumer-driven contract: consumer publish pact, provider verify).

Các phần còn lại đúng kỹ thuật (Testcontainers + @ServiceConnection, PostgreSQL 15/Kafka 3.x, kim tự tháp test, idempotency key + unique constraint + TTL, exponential backoff + jitter, partial failure, WireMock inScenario/whenScenarioStateIs/withFixedDelay, PIT mutant/killed/survived/mutationThreshold/equivalent mutant). Không có lỗi markup, không lẫn chữ nước ngoài.

`node --check js/data/q-soft.js` OK. `node scripts/validate.js`: q-soft.js KHÔNG có lỗi (chỉ 3 cảnh báo độ dài testing-082/083/084 — ngoài phạm vi review, task cấm sửa độ dài). Các LỖI còn lại đều thuộc file khác đang được agent khác làm dở (q-security.js, quiz-ops.js, lessons-*, projects/path, index-light.js cũ) — không sở hữu, không sửa.
