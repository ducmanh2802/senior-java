# T627 — 8 câu phỏng vấn testing (topic testing)

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`

Topic **testing** mới có 18 câu (trong q-soft.js, chung file với behavioral — đọc các câu testing có sẵn để không trùng). Thêm 8 câu testing-0NN tiếp theo, level 2 mid / 4 senior / 2 lead, gợi ý:
- Testcontainers vs H2 cho test repository: khi nào, chi phí CI, reuse container.
- Contract testing (Spring Cloud Contract / Pact) giữa các service: luồng consumer → provider (~~~seq).
- Test code có `@Transactional`, `@Async`, scheduler: bẫy rollback trong test, chờ async đúng cách (Awaitility).
- Flaky test: nguyên nhân hay gặp (thời gian, thứ tự, port, dữ liệu chung) và quy trình xử lý ở team lớn.
- Mutation testing (PIT): đo chất lượng test thay vì coverage %.
- Chiến lược test cho hệ thống legacy không test: characterization test, test ở biên (API), ưu tiên theo rủi ro.
- Test hiệu năng (Gatling/k6): viết kịch bản, đọc p95/p99, test trong CI hay không.
- Lead: xây dựng test strategy/test pyramid cho team 15 dev, quality gate trong pipeline.

> **CẢNH BÁO GHI ĐÈ:** file này đã có nội dung của task khác (chưa commit). **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau khi sửa (`grep -c "id: '"`), số sau phải = số trước + số mục bạn thêm. Hôm nay đã có 2 task làm mất dữ liệu vì ghi đè cả file.
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-soft.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-soft.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Đã THÊM 8 câu testing tiếp theo vào cuối mảng trong `js/data/q-soft.js` (chèn ngay trước `);` cuối file, không sửa object cũ):

| id | level | chủ đề |
|---|---|---|
| testing-025 | mid | Testcontainers vs H2 cho test repository: bảng quyết định, 4 con số chi phí CI, container static dùng chung, reuse, isolation khi chạy song song |
| testing-026 | senior | Cơ chế contract testing: pact file / provider state / verification result, matcher, pending pacts + can-i-deploy, sơ đồ `~~~seq` luồng consumer → broker → provider → deploy |
| testing-027 | senior | Test `@Async`, `@Scheduled`, bẫy rollback khi tác vụ chạy ở thread khác: CompletableFuture, SyncTaskExecutor, capture Runnable, Awaitility, CronExpression, ShedLock |
| testing-028 | senior | Flaky test: bảng phân loại nguyên nhân (thời gian, locale, thứ tự, port, dữ liệu, hạ tầng, race thật) + quy trình 6 bước và chính sách ở team 15 dev |
| testing-029 | mid | Mutation testing PIT: 5 bước bên trong, công thức score, ví dụ line coverage 100% / mutation ~58%, mutant tương đương, `withHistory` + gate trong CI |
| testing-030 | senior | Hệ thống legacy không test: characterization test, golden master/approval testing, 4 loại seam, test ở biên API, ưu tiên theo rủi ro (churn × tác động), lộ trình 90 ngày |
| testing-031 | lead | Đưa test hiệu năng vào CI: 3 tầng (smoke/benchmark/soak), baseline file + dashboard, 4 lỗi đọc percentile (average của p95, mẫu nhỏ, coordinated omission, so khác môi trường), Gatling Java DSL |
| testing-032 | lead | Test strategy cho team 15 dev: chẩn đoán từ bug/incident thật, chuẩn 1 trang, hạ tầng dùng chung, rollout 3 phase, quality gate tăng dần, số liệu DORA để báo cáo quản lý |

Kiểm chứng:
- Số `id:` trong file: trước 48 → sau 56 (đúng +8, không mất nội dung cũ).
- `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js`.
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo còn lại là của `path.js`, có từ trước: lesson-banking-005/006).
- Không commit, không sửa file khác ngoài `js/data/q-soft.js`, `js/data/index-light.js` (sinh tự động) và file task này.
- `node --check js/data/q-soft.js` bị chặn theo cấu hình quyền shell trong phiên này; thay vào đó `validate.js` nạp và chạy file bằng `vm.runInContext` — không phát sinh `lỗi cú pháp/chạy`, tương đương bằng chứng file parse đúng.
- Ghi chú thêm: không dùng `refs` cho 8 câu này (tránh link chưa được kiểm chứng bằng `check-links.mjs`).Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
Reviewed-by: kilo (T627R)
