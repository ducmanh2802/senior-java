# Kế hoạch v4: Java + English + DevOps chuyên sâu, pass phỏng vấn thời AI + layoff

Ngày lập: 2026-11-04. Trọng tâm do người dùng chọn: **Java, English, DevOps**.
Dựa trên `docs/market-jd-trends.md` (30 JD ITviec, 10/2026: Java 30/30, Spring 19/30, English 7/30, Docker/K8s 4/30, CI/CD 3/30) và `docs/market-layoffs-2026.md`.

## 1. Phỏng vấn đổi thế nào

| Thay đổi | Trong phòng phỏng vấn | Ứng viên cần |
|---|---|---|
| AI viết code nhanh, rẻ | Ít hỏi định nghĩa; hỏi **"vì sao"**, **"hỏng thế nào"**, đưa code có bug để review | Hiểu cơ chế bên trong JVM/concurrency, đọc code nhanh, bắt lỗi tinh vi |
| Layoff, tuyển chọn lọc | Senior phải tự vận hành được: hỏi deploy, incident, chi phí | Tự build → deploy → đo → debug service Java trên container |
| Tin lương cao thường kèm "English required" | Vòng tiếng Anh: kể dự án, giải thích kỹ thuật, kể incident, đàm phán | Nói trôi chảy về chính công việc của mình, có số liệu |
| Vòng mới | Code review round, debugging round, coding cho phép dùng AI | Luyện đúng format |

**Nguyên tắc 4 tầng** cho mỗi chủ đề: *dùng thế nào* → *bên trong chạy ra sao* → *hỏng thế nào trên production* → *đo và sửa ra sao (có số liệu)*. Tầng 3–4 là thứ AI và ứng viên trung bình không có.

## 2. Ba mảng chuyên sâu

### Java (nặng nhất)
1. **JVM trên container:** heap vs native memory (metaspace, thread stack, direct buffer, code cache), OOMKilled vs OutOfMemoryError, `MaxRAMPercentage`, NMT.
2. **GC & profiling:** G1 vs generational ZGC, đọc GC log, JFR + async-profiler, flame graph, allocation rate.
3. **Concurrency hiện đại:** virtual threads (pinning; JDK 24 JEP 491 bỏ pinning với `synchronized`), structured concurrency, scoped values, sizing pool, back-pressure.
4. **Core/modern Java ở mức thiết kế:** records/sealed/pattern matching để mô hình hoá domain, immutability, equals/hashCode trong collection, String/memory, exception design.
5. **Code review round:** đọc PR Java (thường do AI sinh) có bug concurrency, resource leak, transaction, equals/hashCode.

### English
1. Giới thiệu bản thân + dự án theo khung 2 phút, có số liệu impact.
2. Giải thích một quyết định kỹ thuật / trade-off; kể một incident (timeline, root cause, fix, prevention).
3. Câu hỏi thời layoff: "Why are you leaving?", giải thích bị layoff / khoảng trống CV, "Why should we hire you?", đàm phán lương.
4. Nói về cách làm việc với AI tools và review code AI viết.
5. Hỏi lại interviewer (questions to ask).

### DevOps (cho Java dev, không phải SRE thuần)
1. Supply chain: SBOM, image scanning, ký image, base image distroless/Jlink.
2. IaC: Terraform state/lock/drift, module, review plan.
3. Linux & network sâu: cgroups v2, file descriptor, TCP TIME_WAIT/conntrack, DNS trong K8s (ndots).
4. K8s vận hành: QoS & eviction, NetworkPolicy, GitOps (Argo CD) drift, secret management.
5. SLO/error budget, alert theo symptom, postmortem.

## 3. Lộ trình học 8 tuần

| Tuần | Trọng tâm | Thực hành trên app |
|---|---|---|
| 1 | JVM memory trên container | Debug lab gc, bài học JVM mới, câu jvm senior/lead |
| 2 | GC tuning + profiling | Debug lab gc/thread, trả lời miệng 5 câu jvm, AI chấm |
| 3 | Concurrency hiện đại | Bài học concurrency, câu concurrency mới, quiz |
| 4 | Core/modern Java + code review round | Câu scenario "review PR", algo 3 bài/tuần |
| 5 | DevOps: container, supply chain, Linux | Câu devops mới, debug lab incident |
| 6 | DevOps: K8s vận hành, IaC, SLO | Câu devops mới, bài học devops mới, quiz devops |
| 7 | English: kể dự án, incident, trade-off | Luyện nói tiếng Anh (#/speak) mỗi ngày, AI chấm phát âm/ngữ pháp |
| 8 | English thời layoff + mock tổng | 2 buổi phỏng vấn AI giọng nói bằng tiếng Anh, 1 mock tiếng Việt |

Mỗi ngày: 1 câu chuyên sâu trả lời **bằng miệng** rồi cho AI chấm, 1 bài algo hoặc lab, ôn SRS (15 phút), 10 phút nói tiếng Anh.

## 4. Nội dung cần thêm (agent free làm, Claude review)

| Task | File | Nội dung |
|---|---|---|
| T577 | `js/views/dashboard.js` + css | Trang chủ gọn (mục 5) |
| T578 | `q-concurrency-jvm.js` | 5 câu jvm + 4 câu concurrency chuyên sâu |
| T579 | `q-java.js` | 8 câu core/collections/modern ở mức thiết kế |
| T580 | `q-scenario.js` | 6 câu code review round (PR Java có bug) |
| T581 | `q-devops.js` | 8 câu devops vào đúng khoảng trống ở mục 2 |
| T582 | `q-english.js` | 8 câu tiếng Anh thời layoff / AI |
| T583 | `labs-incident.js` | 3 debug lab Java-trên-container |
| T584 | `lessons-jvm.js` | 2 bài học JVM có bài tập tự chấm |
| T585 | `lessons-devops.js` | 2 bài học devops mô phỏng bằng Java thuần |
| T586 | `quiz-ops.js` | 12 câu trắc nghiệm devops mới |
| T587–T589 | `projects.js` | Hướng dẫn từng bước (`guide`) cho mọi milestone của 13 pet project |
| T590 | `q-soft.js` | 10 câu "bí kíp" pass phỏng vấn Senior (behavioral) |
| T591–T592 | `sdlc.js` | Kịch bản SDLC 002 (e-commerce voucher), 003 (nâng cấp Java 8 → 21 lên K8s) |

### Mô phỏng SDLC (`#/sdlc`, đã làm 2026-11-04)
Đi trọn một tính năng: requirement → phân tích → thiết kế → code → review/CI → test → deploy → sự cố → kể lại trong phỏng vấn. Mỗi giai đoạn có artifact thật (ticket, số liệu tải, PR diff, log CI, k6, kubectl, log sự cố), ô viết câu trả lời (lưu nháp), đáp án mẫu, AI chấm. Kịch bản mẫu `sdlc-001`: hạn mức chuyển tiền theo ngày (ngân hàng số).

Claude tự làm phần khó: hạ tầng (lazy-load view, đã xong), review / fact-check trước khi lên production, sau đó thêm lộ trình "Java + DevOps + English chuyên sâu" vào `js/data/path.js` trỏ tới các câu mới.

## 5. Trang chủ

- **Đã làm (2026-11-04):** view JS/CSS nạp theo route (`App.loadView`, `DATA_MANIFEST.views`). Shell tải ngay giảm 888 KB → 162 KB; tổng `#/` ~1 MB → ~310 KB. `scripts/check-budget.js` chặn tái phát (eager ≤ 400 KB, `#/` ≤ 700 KB, index.html không được nạp file view).
- **T577:** bố cục gọn: kế hoạch hôm nay lên đầu, hero + thống kê gộp một dải, lưới chủ đề / lịch sử / kế hoạch phỏng vấn thu vào `<details>` và chỉ dựng HTML khi mở.
