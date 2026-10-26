# T297 — Bài tập testing: verifyAll harness + gates NOT RUN (1 bài)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 12 + `lesson-collections-001`. Thêm **1 bài** vào `push(...)`, order tiếp số lớn nhất trong file.

**Bài A — Test harness tự viết với verifyAll + gate "NOT RUN" (exercise, ~45', track `testing`).**
- Bài học: dùng dev viết test thiếu assumption khi harness tự viết không báo; những test gate bị trap "chuyển trạng thái ok, chắc chắn im lặng bỏ pass không chạy". Học cách cân `verifyAll` (report từng case, không fail ngay) + bitmask `RESULT fail/total`.
- Bài tập: tự viết `TestGate` — data-case là 1 danh sách `Case { name, run(Check) }`, method `runAll()` ALWAYS out theo từng case:
  1. Không fail sớm: mỗi case đều được report kèm `passed` boolean;
  2. Gate `awaitBar()` mô phỏng qorlter [sic] — nếu runner abort trước thi các case chưa chạy phải ghi **"NOT RUN"** (không PRO pass);
  3. Thu囉 [sic] hầu hết test bỏ vào "skip" với variant `skipIf(date today)`; `RESULT passed/total/skipped/not_run`.
- Tests ≥ 6: report đủ info; 1 case bug phải chỉ ra đúng tên; git-fail monotonic; hard case intentional throw must be report, not hide; result format chính xác "RESULT 4/5 (1 not_run)".

`body` ≥ 2500 ký tự, cuối body `### Liên hệ phỏng vấn`; `related` trỏ câu `testing-*` có thật; hints ≥ 1; `node scripts/test-lessons.js` + `node scripts/validate.js` → OK; Status: DONE.

## Notes

- Đã thêm `lesson-testing-004` (track `testing`, order 4, senior, 45 phút) vào `js/data/lessons-testing.js`: lý thuyết verifyAll/fail-fast, bốn trạng thái PASS/FAIL/SKIP/NOT RUN, barrier abort, skipIf nhận ngày từ ngoài, quality gate CI; kết thúc bằng `### Liên hệ phỏng vấn`.
- Bài tập `TestGate` với 8 test: report đủ mọi case, chỉ đúng tên case lỗi, abort → NOT RUN (không PASS), exception bất ngờ vẫn được report, skipIf theo ngày, định dạng chính xác `RESULT 4/5 (1 not_run)`.
- Kiểm chứng Java 17 (tương đương `scripts/test-lessons.js`, do script chính đang bị chặn bởi file của task khác): reference 8/8 PASS, starter biên dịch được và 0/8 PASS.
- `node scripts/validate.js lessons-testing.js` → `OK — không có lỗi.` (testing hiển thị 4 bài).
- `node scripts/validate.js` toàn repo hiện vẫn đỏ vì các file ngoài quyền sở hữu đang được agent khác viết dở: `js/data/lessons-devops.js` lỗi cú pháp (`exercises: [ ... exercises ... ]`), `js/data/algo.js` có inline code lồng `{ }`, và `path.js` trỏ tới lesson devops chưa load. Không sửa các file này theo luật 3.
- Đề xuất integrator: thêm `lesson-testing-004` vào một chặng của `js/data/path.js` (hiện chỉ là cảnh báo "không nằm trong PATH", không phải lỗi).
