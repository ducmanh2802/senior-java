# T715 — sdlc-010: dev + SDET cùng làm tính năng hoàn tiền, automation bằng Playwright

Status: DONE
Agent: qoder
Owns: `js/data/sdlc.js`

Đọc AGENTS.md mục 16 và bài mẫu **sdlc-001** trong `js/data/sdlc.js`; đọc các kịch bản đã có để không trùng. Thêm **sdlc-010**, level senior, domain "Thương mại điện tử".
Cốt truyện: team 6 người (4 dev, 1 SDET, 1 PO) làm tính năng **hoàn tiền một phần** cho đơn hàng. Mọi giai đoạn nhấn vào **chất lượng và automation**: requirement có acceptance criteria dạng Given/When/Then; analysis xác định test case (boundary: hoàn 0đ, hoàn đúng bằng số đã trả, hoàn nhiều lần cộng dồn vượt tổng); design có API + bảng refund; dev viết unit test + API test; review chỉ ra test thiếu; test = suite Playwright for Java + API test, pipeline CI chạy song song; deploy có smoke test tự động sau deploy; bugfix: một test E2E flaky bị team bật retry 3 lần nên che mất bug race condition (hai yêu cầu hoàn tiền đồng thời vượt tổng tiền), sửa bằng khoá/constraint + test tái hiện đồng thời.
Artifact phải giống thật và tự nhất quán (mã đơn, số tiền, tên test, log CI). Interview: story STAR có số liệu + ≥ 4 câu hỏi.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Nghiệm thu
`node --check js/data/sdlc.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes

Đã thêm **sdlc-010** (dòng 8527 → cuối file) vào `js/data/sdlc.js`. Không sửa object khác, không commit.

- `grep -c "id: '" js/data/sdlc.js`: **9 → 10** (đúng +1).
- `node scripts/validate.js`: **OK — không có lỗi.** `Mô phỏng SDLC: 10 kịch bản`. (8 cảnh báo `đáp án ngắn` thuộc `q-java.js` và cảnh báo `path.js` có sẵn từ trước, ngoài phạm vi task.)
- Không đụng `index-light.js`: `scripts/build-light-index.js` không sinh chỉ mục cho SDLC.

Cấu trúc: `context` + đúng 8 stage theo thứ tự (requirement → analysis → design → dev → review → test → deploy → bugfix), mỗi stage có `role/story/artifacts/task/answer(≥1200)/pitfalls`, `interview` (STAR có số liệu + 6 câu hỏi), `tags`.

Cách kịch bản khớp yêu cầu task:
- **Requirement**: ticket AS-611 + AC1–AC12 dạng Given/When/Then, đủ 3 boundary tiền (0đ, đúng bằng phần còn lại 255.000, cộng dồn vượt), AC6 = hai lệnh 200.000 đồng thời; Hương (SDET) đòi testability (traceability matrix, `Clock` inject, API tạo dữ liệu test, `errorCode` ổn định).
- **Analysis**: ma trận TC-01…TC-19 (loại test, dữ liệu cụ thể, tầng unit/API/E2E, người viết), BVA + phân lớp tương đương, giải thích vì sao AC6 phải ở tầng API; chia sprint + 3 rủi ro.
- **Design**: DDL `refund` / `refund_line` + unique index idempotency + `CHECK`, bảng so sánh 6 phương án chống race (chọn UPDATE có điều kiện), hợp đồng API + bảng mã lỗi, một khối `~~~seq` (App | refund-service | Postgres | Gateway | Kafka).
- **Dev**: `RefundPolicy` + unit test parameterized (`@CsvSource`, `Clock.fixed`); `PartialRefundApiIT` (Testcontainers + `RANDOM_PORT` + `TestRestTemplate`); diff `RefundService` cài check-then-act kèm `rerunFailingTestsCount=2`; bảng đối chiếu AC6 chưa có test tự động.
- **Review**: 4 blocker (check-then-act trái design, test đồng thời vô dụng + assert sai nguồn, gọi gateway trong transaction, idempotency check-then-act); vì sao coverage 88% vô nghĩa; SIT 1 replica vs PROD 4.
- **Test**: Playwright for Java (Page Object, `getByTestId`, auto-waiting, `BrowserContext` vs `Page`, tracing), CI matrix 4 shard 19m44s → 8m51s, dashboard flaky rate; mục 6 biên bản UAT = hai nhân viên cùng hoàn tiền đều "thành công".
- **Deploy**: expand-contract + `CHECK … NOT VALID`/`VALIDATE`, feature flag → shadow 24h → canary 1/10/50/100% với ngưỡng abort bằng số, smoke sau deploy `rerunFailingTestsCount=0`; log có `SMOKE-06 PASSED` nhưng ReconcileJob báo drift → smoke đọc cột chứ không đọc tổng dòng.
- **Bugfix**: 63 đơn vượt tiền / 4.712.000 VND; log chứng minh lost update ở cả cấp đơn và cấp line; 3 cơ chế retry che bug; mitigation 30 phút; sửa bằng UPDATE hai cấp atomic + `refund_ledger`; `RefundConcurrencyIT` (`@RepeatedTest(20)`, `CountDownLatch`, assert accepted=1 + ledger ≤ paid + column == ledger); chính sách flaky + 5 Whys.

Bộ số dùng chung xuyên suốt mọi artifact/answer: 830.000 đã trả / 450.000 line / 575.000 đã hoàn / còn 255.000 / hai lệnh 200.000 → ledger 975.000 vs cột 775.000.

Sự cố đã sửa: một dấu backtick thừa ở `stages[deploy].story` (`…nhiều bản thể**.`,`` ` ``) làm vỡ template literal; `${…}` trong YAML smoke đã thay bằng chuỗi tĩnh; `lang: 'diff'` đổi thành `'text'`.
Reviewed-by: verify-only (code/UI task)
