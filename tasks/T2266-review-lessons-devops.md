# T2266 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T2164

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-devops.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js). Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 điểm đã kiểm tra kỹ; Docker/K8s khái niệm đúng (probes, rolling update).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

- **Sửa 1 — lesson-devops-008 (Rolling update)**: dòng 2405 `~~~java` là một fence mở không có `~~~` đóng. Code block trước đó (ví dụ minh hoạ `int minReady = replicas - maxUnavailable;`) là `~~~text`/`~~~java` — do đó dòng `~~~java` này làm vỡ pair. Đã đổi thành `~~~` để đóng block. Sau khi sửa, `~~~` count chẵn (100 open / 100 close).
- **Sửa 2 — lesson-devops-009 (Prometheus metrics)**: dòng 2591 `~~~java` tương tự — là một fence mở lẻ, làm vỡ pair. Đã đổi thành `~~~` để đóng block.

**3 điểm đã kiểm tra kỹ (không cần sửa):**
1. **Markup correctness**: toàn bộ 21 bài đã kiểm tra lại `~~~lang`/`~~~` pair, không còn backtick `` ` `` hay `${` trong template literal (đặc biệt lesson-devops-012 về structured logging và lesson-devops-004 về retry có nhiều `${...}` — đã escape bằng `\${`).
2. **Docker/K8s khái niệm đúng**: probes (liveness/readiness/startup) — lesson-devops-002 đã tách health group, liveness chỉ include `livenessState`, readiness include readinessState/db/kafka; startupProbe với failureThreshold lớn cho app boot chậm; preStop + graceful shutdown. Rolling update — lesson-devops-008 đã giải thích maxSurge làm tròn lên, maxUnavailable làm tròn xuống, và `maxUnavailable: 0` giữ capacity.
3. **Tests/reference không bị thay đổi**: `node scripts/test-lessons.js` → `Lesson exercises OK: 304/304` (272 bài học, 304 bài tập). `node scripts/validate.js` → `OK — không có lỗi.` `node --check` → SYNTAX OK. `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (315.9 KB).
