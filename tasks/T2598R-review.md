# T2598R — Fact-check nội dung mới của T2598

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2598 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
`node scripts/validate.js` → `OK — không có lỗi.` (sau khi chạy `node scripts/build-light-index.js` để sinh lại index-light.js). Chi tiết lỗi đã sửa ở trên.

## Notes

Đã fact-check và sửa các lỗi kỹ thuật trong `js/data/q-devops.js` (3 câu mới do T2598 thêm):

- **devops-195**: `(1.30+)` → `(alpha 1.29, beta 1.30, GA/stable 1.34)` — Sleep action cho PreStop hook chính thức GA từ v1.34, không phải 1.30.
- **devops-196**:
  - Xóa field không tồn tại `warmupDurationSecs` và `stepWeightIncrement` trong `canary:` block (không có field này trong Argo Rollouts CanaryStrategy/CanaryStep). Thay bằng `analysis:` (background, `startingStep`) + inline `analysis` step.
  - Sửa `scaleDownDelaySecondsOnScaleUp` → `scaleDownDelaySeconds` (field đúng; `scaleDownDelaySecondsOnScaleUp` không tồn tại).
  - Sửa `intervalSeconds: 60` → `interval: 60s` (field `interval` là DurationString, không có `intervalSeconds`).
  - Tách metric `successCondition: result[0] < 14.4 and result[1] > 100` thành 2 metric riêng: `error-budget-burn-rate` (`result[0] < 14.4`) và `min-sample-size` (`result[0] > 100`) — một metric chỉ được dùng 1 `result[i]`.
  - Sửa `template.engine: gotemplate` → `engineVersion: v2` (ESO template engine field).
  - Sửa `dataFrom` + `rewrite` → `dataFrom.extract` + `property` + `decodingStrategy: Base64` (ESO API đúng).
  - Thay `warmupDurationSecs` bằng metric `initialDelay` (field đúng trong AnalysisTemplate metric) ở Tóm tắt, Thuật ngữ, bảng bẫy, Trả lời mẫu, Ví dụ đời thực.
  - Sửa backtick `` ` `` thành markup `{{...}}` trong template literal (vỡ JS).
- **devops-197**: không có lỗi kiến thức; chỉ sửa backtick → markup.

Các câu devops-188..194 (đã có sẵn ở HEAD) không touched.

## Nghiệm thu
`node scripts/validate.js` → `OK — không có lỗi.` (sau khi chạy `node scripts/build-light-index.js` để sinh lại index-light.js).
