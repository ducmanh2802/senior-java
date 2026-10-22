# Kế hoạch v3: từ bộ câu hỏi thành nền tảng luyện phỏng vấn

Mục tiêu người học: **pass vòng phỏng vấn Senior Java ở ngân hàng hoặc big tech Việt Nam trong 6 tháng**.
Mọi tính năng đều phải trả lời được câu hỏi: tính năng này giúp người học trả lời tốt hơn trong phòng phỏng vấn thế nào?

## Cách vận hành

- **Agent** (opencode, model free) viết nội dung và view qua hàng đợi `scripts/run-queue.sh`:
  - tối đa 4 agent chạy song song;
  - không bao giờ có hai agent cùng ghi một file;
  - task có `After:` thì chờ task kia xong mới chạy.
- `scripts/watchdog.sh` dừng agent nào im lặng quá 15 phút và cho chạy lại, tối đa 2 lần.
- **Integrator** (Claude Code) giữ hạ tầng: `api/*`, `js/core/*`, `supabase/*`, `index.html`, `base.css`, schema và contract.
  Integrator review và fact-check mọi nội dung trước khi commit. Push lên `main` thì Vercel tự deploy.
- **Khi hàng đợi trống**, integrator làm theo thứ tự:
  1. chạy `npm run check` và smoke test, rồi sửa bug;
  2. fact-check nội dung mới;
  3. đọc log lỗi và phản hồi người dùng;
  4. lấy hạng mục tiếp theo trong plan này.

## Trạng thái

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| P0 | Ngân hàng câu hỏi, flashcard, quiz, thuật toán, mock, lộ trình, SRS | ✅ |
| P1 | Tài khoản, đồng bộ cloud, hạn mức AI theo người dùng, CI | ✅ (T30–T34) |
| P2 | Debug lab (thread dump, GC, SQL, sự cố) | 🟡 thread + SQL đã lên web (10 bài); GC, sự cố đang viết |
| C2–C3 | Đợt 2 + 3 câu hỏi: khoảng 460 câu, 4 chủ đề mới (API, Security, SQL, DevOps) | 🟡 ~345 câu đã fact-check và lên web; phần còn lại trong hàng đợi |
| **P3** | **Phỏng vấn AI bằng giọng nói, liên tục** | ✅ API (T70) + view (T71); quiz chủ đề mới T72 trong hàng đợi |
| P4 | Bài học + bài tập Java tự chấm | 🟡 nền tảng + bài mẫu xong (T80); T81–T87 trong hàng đợi |
| P5 | Luyện system design, code review, CV, nhật ký phỏng vấn | ⏳ |
| P6 | Chất lượng và vận hành: admin, PWA offline, quan sát lỗi | 🟡 PWA xong (T95) |

## P3: Phỏng vấn AI (giọng nói)

| Task | Việc | Ai |
|---|---|---|
| T70 | `/api/interview`: hội thoại nhiều lượt, vé phiên có chữ ký (1 phiên = 1 lượt hạn mức), tổng kết kèm `hire_signal` | Integrator ✅ |
| T71 | View `#/interview`: TTS + STT, chế độ rảnh tay, chat, đánh giá cuối phiên | Integrator ✅ (agent bị 504) |
| T72 | Thêm quiz cho 4 chủ đề mới (api, security, sql, devops), mỗi chủ đề 8 câu | Agent |
| T73 | Dashboard: "Điểm sẵn sàng phỏng vấn" kết hợp SRS, quiz, mock, AI interview, theo công ty mục tiêu | Agent |

## P4: Bài học + bài tập Java tự chấm

Nhiều người hổng nền tảng nên trả lời không vững khi bị hỏi đào sâu. Bài học lấp chỗ hổng đó, mỗi bài kèm bài tập chạy thật (harness + Judge0 hoặc AI review).

| Task | Việc | Ai |
|---|---|---|
| T80 ✅ | Schema `window.LESSONS` (`lesson-<topic>-NNN`: theory, examples, exercises[{starter, tests}], quiz ngắn) + validator + `test-lessons.js` (javac như `test-algos.js`) | Integrator |
| T81–T86 | Bài học theo track, mỗi task 4–5 bài: collections, core, modern, concurrency, spring, jpa (bài tập Java 17 thuần, Spring/JPA mô phỏng cơ chế) | Agent |
| T87 | View `#/learn`: mục lục, đọc bài, chạy bài tập, đánh dấu hoàn thành, gắn với lộ trình 26 tuần | Agent |

## P5: Luyện kỹ năng vòng sau

| Task | Việc | Ai |
|---|---|---|
| T90 | `/api/review-design`: chấm bản thiết kế system design (yêu cầu, ước lượng, sơ đồ dạng text, trade-off) | Integrator |
| T91 | View `#/design`: canvas đơn giản (khối + mũi tên, xuất ra text) + checklist 45 phút + AI chấm | Agent |
| T92 | Luyện **code review**: đoạn code Java có bug hoặc smell, người học comment, AI so với đáp án | Agent (nội dung) + integrator (API dùng lại `grade`) |
| T93 | **CV và câu chuyện STAR**: AI góp ý CV dạng text, tạo 6 câu chuyện STAR từ kinh nghiệm thật, luyện kể bằng giọng nói | Integrator API + agent view |
| T94 | **Nhật ký phỏng vấn thật**: ghi lại câu đã bị hỏi ở công ty nào; câu chưa có trong ngân hàng thì đề xuất thêm | Agent |

## P6: Chất lượng và vận hành

| Task | Việc | Ai |
|---|---|---|
| T35 | `/api/admin` + view admin: thống kê usage, chỉnh hạn mức người dùng | Integrator + agent |
| T36 | Gửi góp ý hoặc báo sai nội dung: tạo issue GitHub kèm id câu hỏi | Integrator |
| T95 ✅ | PWA: manifest + service worker, học offline (dữ liệu tĩnh), cài lên điện thoại | Integrator |
| T96 | Theo dõi lỗi phía client (`window.onerror` → `/api/log`, có lấy mẫu) + Vercel Speed Insights | Integrator |
| T97 | Kiểm tra a11y và hiệu năng (Lighthouse ≥ 90), lazy-load dữ liệu theo route nếu bundle quá lớn | Integrator |
| T98 | Fact-check định kỳ: mỗi đợt nội dung mới đều được review agent kiểm tra trước khi commit | Integrator |
