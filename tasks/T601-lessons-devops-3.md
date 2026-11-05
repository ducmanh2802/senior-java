# T601 — 2 bài học DevOps có bài tập tự chấm

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`

Thêm 2 bài (track devops), bài tập **mô phỏng cơ chế bằng Java thuần**:
1. **Rolling update & probes trên Kubernetes**: maxSurge/maxUnavailable, readiness quyết định nhận traffic, liveness restart, startupProbe cho app khởi động chậm. Bài tập: `RolloutSimulator.simulate(replicas, maxSurge, maxUnavailable, startupSeconds[])` trả số pod sẵn sàng tối thiểu trong suốt rollout và tổng số bước; ném lỗi khi cấu hình làm số pod sẵn sàng về 0. ≥ 4 case.
2. **Prometheus metrics & SLO**: counter vs gauge vs histogram, rate(), percentile từ bucket, error budget. Bài tập: `Histogram` với bucket cố định (le), `observe(ms)`, `quantile(q)` nội suy tuyến tính như histogram_quantile, và `ErrorBudget.remaining(sloPercent, total, errors)`. ≥ 5 case.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-devops.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Thêm lesson-devops-008 và lesson-devops-009 vào js/data/lessons-devops.js. Cần integrator thêm id vào js/data/path.js.
Reviewed-by: kilo (T601R)
