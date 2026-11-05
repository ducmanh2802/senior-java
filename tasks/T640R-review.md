# T640R — Fact-check nội dung mới của T640

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T640 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới T640 trong `js/data/q-devops.js`: `devops-049`, `devops-051`, `devops-052`, `devops-053`, `devops-054`, `devops-055`, `devops-056` (không có `devops-050` trong diff).
- `devops-049`: sửa phát biểu dễ gây hiểu sai "Terraform 1.8+ hỗ trợ `moved` cho module" → làm rõ `moved` block map địa chỉ resource/module (chỉ cần mapping địa chỉ cũ → mới chính xác), tránh gán mốc phiên bản không chắc.
- `devops-051`: thay tên metric nội bộ OTel Collector hard-code `otelcol_processor_tail_sampling_sampling_trace_dropped_too_early` (dễ khác theo phiên bản/distribution) bằng hướng dẫn chung "giám sát metric dropped-too-early/early decisions của `tail_sampling` processor, bật telemetry nội bộ để xem tên chính xác".
- `devops-056`: làm rõ bảng burn-rate multi-window (1h+5m=14.4x đốt ~2% budget/1h, 6h+30m=6x, 3 ngày=1x) để tránh cách diễn đạt dễ hiểu nhầm "budget còn > 2%..."; số liệu khớp Google SRE Workbook multi-window multi-burn-rate.
- Kiểm tra kỹ thuật/markup: không thấy backtick thô, không thấy `${` trong template literal, `~~~seq` đủ actors (2-6), API/flags chính (Terraform moved/state mv/rm/import, OTel Collector receivers/processors/exporters/tail_sampling/memory_limiter/batch, Sealed Secrets/ESO/SOPS, HPA autoscaling/v2 behavior/stabilizationWindowSeconds, Argo Rollouts AnalysisTemplate/AnalysisRun, Prometheus rate/histogram_quantile burn-rate patterns) phù hợp thực tế; không thấy chữ CJK/Nga lẫn vào.
- Đã chạy `node scripts/build-light-index.js` (cập nhật `js/data/index-light.js`), `node --check js/data/q-devops.js`, `node scripts/validate.js`.
- `node scripts/validate.js` hiện **không còn lỗi từ `js/data/q-devops.js`**; validator còn báo lỗi ở `js/data/sdlc.js` (`sdlc-009`) — file ngoài quyền sở hữu T640R, không sửa. Do đó chưa đạt “toàn repo OK” cho đến khi task sở hữu `sdlc.js` sửa. `node scripts/test-lessons.js` không áp dụng (q-devops không phải lessons).
