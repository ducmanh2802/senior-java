# T101 — Câu hỏi bổ sung theo xu hướng JD (từ docs/market-jd-trends.md mục 4)

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`, `js/data/q-api.js`, `js/data/q-devops.js`, `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 và **mục 4 của `docs/market-jd-trends.md`** (8 câu đề xuất). Với từng đề xuất: tìm trong toàn bộ `js/data/q-*.js` xem đã có câu cùng ý chưa (ví dụ idempotency thanh toán, Java OOMKilled, contract test đã có) — **trùng thì bỏ qua**. Câu chưa có thì viết mới, đặt đúng topic/file, ID tiếp nối số lớn nhất của topic, đủ chuẩn chất lượng (≥ 1500 ký tự, Tóm tắt, ###, code ngắn, bảng, pitfall, Senior tip, follow 2–3).
Không backtick, không `${`, không chữ Trung/Nga. `node scripts/validate.js` → OK. Ghi vào Notes câu nào đã viết, câu nào bỏ vì trùng (kèm id câu đã có).

## Notes

- Không thêm câu mới: cả 8 đề xuất ở mục 4 đã có câu cùng ý trong ngân hàng.
- Bỏ đề xuất security về JWT/OAuth2 rotation và thu hồi token: `security-003` đã trình bày refresh-token rotation, phát hiện reuse, revoke và denylist; `security-004` bao phủ OAuth2 Client Credentials và lựa chọn xác thực service-to-service.
- Bỏ đề xuất security về service-to-service auth, tenant authorization và secret: `security-004` bao phủ Client Credentials, mTLS/private_key_jwt và credential; `security-010` giải thích TLS/mTLS. Phân quyền tenant áp dụng mô hình authorization theo object đã có ở `security-008`.
- Bỏ đề xuất API versioning/deprecation: `api-014` đã hỏi về API evolution và CI đảm bảo không breaking change; `api-013` so sánh REST/gRPC/GraphQL và evolution.
- Bỏ đề xuất idempotency endpoint thanh toán: `api-001` trực tiếp hỏi xử lý retry/time-out với Idempotency-Key; `api-011` cũng bao phủ idempotency trong webhook.
- Bỏ đề xuất CI/CD Kubernetes với scan, canary, rollback: `devops-010` bao phủ pipeline CI/CD, gates và rollout; `devops-009` bàn về blue-green/canary và `devops-010` đã đề cập scan image, tiêu chí rollout/rollback.
- Bỏ đề xuất điều tra Java OOMKilled: `devops-002` phân tích heap/native memory, container limit và JVM; `devops-005` hướng dẫn chẩn đoán OOMKilled cùng các trạng thái Pod.
- Bỏ đề xuất chọn Kafka/MSK, SQS hoặc EventBridge cho event thanh toán: `aws-008` so sánh SQS, EventBridge và MSK/Kafka, ordering, retry, DLQ và delivery semantics.
- Bỏ đề xuất contract test Kafka/API: `testing-004` bao phủ Pact/Spring Cloud Contract giữa producer/provider và consumer, CI và rủi ro compatibility. File `q-soft.js` không thuộc quyền sở hữu của T101 nên không chỉnh sửa.
- Chỉ sửa file task để ghi kết quả và trạng thái; các file dữ liệu thuộc task giữ nguyên vì không phát sinh nội dung chưa có.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
