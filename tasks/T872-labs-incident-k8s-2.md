# T872 — 2 debug lab K8s: PVC Pending và Ingress 502

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T868

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab hiện có trong `js/data/labs-incident.js` (đang có 22 lab) để không trùng tình huống. Artifact phải giống THẬT và tự nhất quán (tên thread, lock id, timestamp, số liệu khớp nhau và khớp answer). id tiếp nối số lớn nhất.

**Dàn ý tham khảo**: playlist "Khoá học Kubernetes thực tế" (DEVOPSEDU VN, https://www.youtube.com/playlist?list=PLsvroIvFNP1KrW1x_W8nAi7095-R0lvaI) và "Deploying High Availability Tools" (https://www.youtube.com/playlist?list=PLsvroIvFNP1JefIw1YrPi0k2oQ4KBHQAE). Chỉ dùng làm danh sách chủ đề thực tế; **kiểm chứng mọi chi tiết với tài liệu chính thức** (kubernetes.io, helm.sh, velero.io, kubernetes.github.io/ingress-nginx, cert-manager.io, patroni.readthedocs.io, redis.io, kafka.apache.org, elastic.co, mariadb.com/kb). Không chép, viết lại bằng lời của mình. Góc nhìn: **dev Java backend tự deploy và vận hành service của mình trên K8s**.

Thêm 2 lab level mid/senior, artifact giống thật (kubectl output đúng định dạng):
1. **StatefulSet Redis/MariaDB kẹt Pending sau khi chuyển cluster**: kubectl get pods/pvc, describe pvc ("waiting for first consumer" / "no persistent volumes available for this claim and no storage class is set"), get storageclass (không có default), events; cách sửa và phòng ngừa.
2. **Ingress trả 502/503 sau khi deploy bản mới của app Spring Boot**: log ingress-nginx (upstream connect error / no endpoints), kubectl get endpoints rỗng do readinessProbe sai port/path hoặc Service targetPort lệch containerPort, describe pod; cách sửa, rollout undo, thêm kiểm tra vào pipeline.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/labs-incident.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. answer 2500–5000 ký tự.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/labs-incident.js`.

## Nghiệm thu
`node --check js/data/labs-incident.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id lab mới vào Notes.

## Notes
Đã thêm lab-incident-023, lab-incident-024 (PVC Pending, Ingress 502). Validate OK.
Reviewed-by: kilo (T872R)
