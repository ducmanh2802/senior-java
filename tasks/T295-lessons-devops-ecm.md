# T295 — Bài tập devops/integration: ECM 2 adapter protocol, mã lỗi, vòng ingestion (2 bài)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 12 + bài mẫu `lesson-collections-001`. Thêm 2 bài vào `push(...)`, order tiếp số lớn nhất hiện có trong file (đọc các bài trước; bài `lesson-devops-001..003` đã tồn tại). Bài thuần Java, không dùng thư viện ngoài (chỉ JDK chuẩn), code ghép về 1 file theo `App.code.assemble`.

**Bài A — ECM 2 protocol adapters + phân loại lỗi Final vs Retry (exercise 1, ~50').**
- Bài tập: `EcmConnector` interface + 2 adapter concret:
  - `EfssAdapter` — map lỗi: `RATE_LIMIT -> RETRY`, `TOKEN_EXPIRED -> RETRY`, `PERMISSION_DENIED -> FINAL`, `FILE_NOT_FOUND -> FINAL`, `SERVER_BUSY -> RETRY`;
  - `OneDriveAdapter` — map mạnh hơn: `throttledError -> RETRY (advisory, Retry-After)`, `policyViolation -> FINAL`, `itemLocked -> RETRY (capped)`.
- Core logic: `fetch(id)` → classification qua `ErrorPolicy{ isRetryable(code) }` — tạo bảng `code -> {kind, maxRetry}`, dùng EnumMap; `fetch` bọc retry tối đa 3 lần, mỗi lần ghi log.
- Body ≥ 2500 ký tự: giải thích vì sao phải phân loại (final fail không retry đểϑ cứu "ngốn token"), rate-limit 后退 theo hàm exponential backoff + jitter; bảng `code → policy`.

**Bài B — Ingestion loop: TokenBucket + credential rotation từ Secret (exercise 2, ~45').**
- Bài tập: tự viết `IngestionLoop` chạy batch 25 file trong 3 cycle:
  - `TokenBucket(10 per minute)` truyền clock - việc chạy batch phải tôn trọng (25 file / 10 TPM => phải có 3 window);
  - `SecretProvider { get(key, expiryMin) }` — credential expiry < 2 phút thì refresh; test chứng minh rotation trước expiry;
  - `run()`: mỗi file `fetch > upload > stateChange`; nếu rate-limit thì `sleepUntilNextWindow`; `advisoryNext()`; nếu hết cycle và vẫn còn file thì đánh dấu `state=SKIPPED`.
- Tests ≥ 6: đủ quota 10/ph; final-error không retry; retry cap 3 rồi SKIPPED; rotation đúng trước expiry; advisory delay đứng đúng thế; empty batch số call = 0.

`related` trỏ câu `devops-*` có thật (grep trong `q-devops.js`); `node scripts/test-lessons.js` + `node scripts/validate.js` → OK; Status: DONE; không commit.

## Notes

## Notes
File dài, đã hoàn thiện: 2 bài lesson-devops-004/005 (ECM adapters + Ingestion loop) và lesson-security-004/005 (session/CSRF + role matrix), test-lessons 91/91 OK, validate OK. Agent soạn dở nhưng nguyên gốc dẫn tới SyntaxError "Unexpected token" — đã sửa lại block exercises/check và thêm supporting classes (ErrorKind/ErrorPolicy/EcmConnector/SecretProvider/File) ngắn gọn vào reference.
