# T58 — Nội dung: Docker, Kubernetes, Linux & Git

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
File đang rỗng: ID bắt đầu từ `devops-001`.
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `devops`: thêm 14 câu (đang có ~0 → mục tiêu ≥ 14)
- Dockerfile tối ưu cho Spring Boot: multi-stage, layered jar, base image JRE, chạy non-root, cache layer
- Docker vs VM, image layer, container dùng chung kernel; vì sao container Java cần chú ý giới hạn CPU/RAM
- Kubernetes cơ bản: Pod, Deployment, Service, Ingress, ConfigMap, Secret — một request đi qua những gì
- Rolling update: maxSurge/maxUnavailable, rollback, kết hợp readiness probe để không rơi request
- Pod lỗi: CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled — đọc {{kubectl describe}}/logs/events để chẩn đoán
- HPA: scale theo CPU vs custom metric (lag Kafka, RPS); vì sao app Java scale chậm và cách xử lý
- Lệnh Linux điều tra sự cố: top/htop, free, df/du, ss/netstat, lsof, grep/awk/tail log, journalctl
- Git: merge vs rebase vs squash, cherry-pick, revert vs reset — khi nào dùng, khi nào cấm
- Branching strategy: Git Flow vs trunk-based; quản lý release và hotfix trong ngân hàng
- Pipeline CI/CD cho service Java: build, test, quét bảo mật, artifact, deploy, promote qua các môi trường
- Quản lý cấu hình nhiều môi trường trên Kubernetes: Helm vs Kustomize, secret
- Log trong container: ghi stdout, log JSON có traceId, gom log bằng ELK/Loki
- Nginx làm reverse proxy/load balancer: upstream, timeout, sticky session, giới hạn body
- Triển khai on-premise trong ngân hàng: không có internet, Nexus/Harbor, change management và phê duyệt

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
