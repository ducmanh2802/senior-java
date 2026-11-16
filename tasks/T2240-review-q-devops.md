# T2240 — Rà soát chất lượng các câu về CI/CD, Kubernetes rollout, probes trong q-devops.js

Status: TODO
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2213

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về CI/CD, Kubernetes rollout, probes (`node scripts/qtool.js list js/data/q-devops.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: khái niệm K8s đúng (readiness vs liveness vs startup probe, rolling update maxSurge/maxUnavailable); luồng deploy chưa có sơ đồ thì thêm ~~~seq (tối đa 4).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

Status: DONE

## Notes

Đã rà soát toàn bộ 169 câu trong `js/data/q-devops.js` (tập trung vào CI/CD, K8s rollout, probes). Số mục trước = sau = 169 (không thêm/xoá câu). Đã sửa:

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| devops-004 | Thiếu sơ đồ luồng deploy zero-downtime | Thêm `~~~seq` "Rolling update: Pod mới vào, Pod cũ ra" (5 actors, 7 bước) |
| devops-010 | Thiếu sơ đồ CI/CD stages | Thêm `~~~seq` "Luồng pipeline CI/CD: commit → DEV → SIT → UAT → PROD" (7 actors, 8 bước) |
| devops-016 | Thiếu sơ đồ chu kỳ probe | Thêm `~~~seq` "Startup → readiness → liveness: ba câu hỏi khác nhau" (4 actors, 6 bước) |
| devops-072 | Thiếu sơ đồ deploy đa repo | Thêm `~~~seq` "CI/CD đa repo: build → deploy qua registry" (5 actors, 7 bước) |

- Đã kiểm tra khái niệm K8s đúng (readiness vs liveness vs startup probe; rolling update maxSurge/maxUnavailable; graceful shutdown; expand-contract; PDB; QoS; HPA/KEDA; IRSA; GitOps) — các câu về probes/rollout (devops-004, 016, 020, 044, 072, 124, 147, 151, 167, 168, 169) đã có nội dung chính xác, không cần sửa.
- Không có backtick, không có `${` trong template literal; mọi seq đã qua `Diagram.parseSeq` (21 sơ đồ, OK).
- `node --check js/data/q-devops.js` → OK; `node scripts/build-light-index.js` → đã ghi index-light.js; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: verify-only (review task)
