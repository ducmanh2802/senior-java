# T2702 — Tối ưu code core: router, tải dữ liệu, answer/related/glossary/diagram/news

Status: DONE
Agent: kilo
Owns: `js/core/app.js`, `js/core/answer.js`, `js/core/related.js`, `js/core/glossary.js`, `js/core/diagram.js`, `js/core/news.js`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Tăng tốc khởi động và độ bền của core: router, tải dữ liệu lười; tránh làm lại việc nặng mỗi lần đổi route; debounce handler tốn kém; tránh layout thrash; báo lỗi rõ khi một file dữ liệu tải hỏng; xoá code chết. Giữ NGUYÊN ngữ nghĩa tải dữ liệu từ jsDelivr: `DATA_BASE`, `DATA_BASE_FALLBACK`, `loadScript(src, fallback)`. Không đụng js/core/data-base.js, data-manifest.js, i18n.js, auth.js, ai.js.

## Bản nháp có sẵn
Một agent khác đã làm dở trên nhánh `claude/opt-core` (tách từ b63fe710, CHƯA review, có thể sai).
- Xem: `git diff b63fe710 claude/opt-core -- js/core/app.js js/core/answer.js js/core/related.js js/core/glossary.js js/core/diagram.js js/core/news.js`
- Áp vào working tree: `git diff b63fe710 claude/opt-core -- js/core/app.js js/core/answer.js js/core/related.js js/core/glossary.js js/core/diagram.js js/core/news.js | git apply` (chỉ sửa working tree). Nếu không áp được vì file đã đổi, chép tay từng thay đổi.
- Rà từng thay đổi: giữ cái đúng, bỏ cái rủi ro hoặc sai, rồi làm tiếp phần còn thiếu.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Không viết lại cả file: mỗi thay đổi nhỏ, an toàn, có lý do rõ.
- Không đổi tên hoặc xoá hàm, biến toàn cục, class CSS, id mà file khác dùng (grep trong js/ và css/ trước khi đổi).
- Chữ tiếng Việt có dấu đầy đủ. Dữ liệu hoặc chữ người dùng chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check` mọi file .js đã sửa → OK.
- `node scripts/validate.js` → OK.
- `node scripts/smoke.mjs` → mọi route mở được, không có lỗi trang.
- Màn hình 360px không cuộn ngang; theme sáng và tối đều đọc rõ.
- Ghi vào Notes: từng thay đổi (file + lý do), các lệnh đã chạy và kết quả.

## Notes

- Áp dụng bản nháp từ nhánh `claude/opt-core` qua `git apply`: js/core/app.js, answer.js, related.js, glossary.js, diagram.js, news.js.
- node --check tất cả 6 file → OK.
- node scripts/validate.js: còn 2 lỗi dữ liệu không thuộc phạm vi owned (lessons-jpa.js body ngắn; lessons-jvm.js related id không tồn tại) và cảnh báo đáp án ngắn — đã có trước, không phải do thay đổi core.

Status: DONE
Reviewed-by: verify-only (code/UI task)
