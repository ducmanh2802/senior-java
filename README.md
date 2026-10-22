# ☕ Senior Java Prep

Web ôn luyện phỏng vấn **Senior Java Backend**, xây cho mục tiêu: **sau 6 tháng phỏng vấn đậu vị trí Senior ở ngân hàng hoặc big tech tại Việt Nam.**

Đây là site tĩnh, miễn phí, không cần đăng nhập và không cần build. Tiến độ học lưu ngay trong trình duyệt.

> 🚧 Dự án đang được xây dựng. Nội dung đang được bổ sung dần theo [kế hoạch](docs/PLAN.md).

## Tính năng

| Màn hình | Bạn làm được gì |
|---|---|
| **Tổng quan** | Kế hoạch hôm nay (câu đến hạn ôn, việc của tuần), streak 🔥, tiến độ theo chủ đề |
| **Lộ trình 6 tháng** | 26 tuần chia 7 giai đoạn, checklist từng tuần, nhật ký học hằng ngày (heatmap, ghi chú), dự án portfolio |
| **Câu hỏi** | Ngân hàng câu tự luận, mỗi câu có **đáp án giải thích chi tiết**, câu hỏi đào sâu, tìm kiếm, lọc, bookmark |
| **Flashcard** | Lật thẻ, tự chấm *Chưa biết / Cần ôn / Đã thuộc* bằng phím 1-2-3 |
| **Trắc nghiệm** | Câu 4 lựa chọn, chấm ngay, có giải thích vì sao đúng và vì sao sai |
| **Thuật toán** | Đề bài, gợi ý từng bước, editor có lưu nháp, bấm giờ, lời giải Java kèm độ phức tạp |
| **Phỏng vấn thử** | Preset theo vòng (Java, Microservices & System Design, Tình huống thực tế, Cloud & AI, **English**, **Coding round**, Full loop), bấm giờ từng câu, tự chấm 1–5, tổng kết chủ đề yếu |

**Lặp lại ngắt quãng (spaced repetition):** mỗi lần tự chấm, câu hỏi được tự lên lịch ôn lại.

| Bạn chấm | Câu quay lại sau |
|---|---|
| Chưa biết | ngày mai |
| Cần ôn | 2 ngày trở lên |
| Đã thuộc | giãn dần: 3 → 8 → 20+ ngày |

Nhờ vậy, câu nào chưa vững sẽ tiếp tục quay lại cho tới khi vững.

Ngoài ra còn có: tự đếm phút học mỗi ngày, giao diện sáng/tối, phím tắt, dùng tốt trên điện thoại, xuất/nhập tiến độ ra file JSON để chuyển máy.

## Nội dung

17 chủ đề, chia 5 nhóm:

- **Java:** Core Java, Collections, Java 8 → 21, Concurrency, JVM & GC
- **Framework:** Spring & Spring Boot, JPA/Hibernate, Database & SQL (gồm Oracle cho khối ngân hàng)
- **Architecture:** Microservices, System Design, Design Patterns & Clean Architecture, **Tình huống thực tế** (tối ưu query chậm, import CSV hàng triệu dòng, sự cố production, ledger / đối soát / bảo mật trong ngân hàng)
- **Cloud & AI:** AWS, AI/LLM cho Java dev (Spring AI, RAG, MCP…)
- **Soft skills:** Testing, Leadership & Behavioral (STAR), **Phỏng vấn tiếng Anh** (câu trả lời mẫu, cụm từ hữu ích, lỗi người Việt hay mắc)

Mục tiêu khoảng 230 câu tự luận, hơn 80 câu trắc nghiệm và hơn 40 bài thuật toán.

## Chạy trên máy

Không cần cài gì cả: mở thẳng file `index.html` bằng trình duyệt.

Hoặc chạy một server tĩnh bất kỳ:

```bash
npx serve .
```

## Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com), chọn **Add New → Project** và import repo này.
2. Framework Preset chọn **Other**, để trống Build Command, Output Directory là `./`.
3. Bấm **Deploy**. Từ đó mỗi lần `git push` lên `main` sẽ tự deploy lại.

### Bật tính năng AI (chấm điểm, hỏi đào sâu, chạy code)

Vào **Project → Settings → Environment Variables** trên Vercel, thêm các biến sau rồi **Redeploy**:

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `SUPABASE_URL` | ✅ cho tài khoản | URL project Supabase, ví dụ `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | ✅ cho tài khoản | **Secret key** (`sb_secret_…`) trong Supabase → Project Settings → API Keys. Chỉ đặt ở Vercel, không bao giờ đưa vào code. Người dùng đăng nhập sẽ được chấm AI theo hạn mức mỗi ngày (`profiles.ai_daily_limit`, mặc định 10) |
| `APP_PASSCODE` | tuỳ chọn | Mật mã của chủ app: nhập trong ⚙️ để dùng AI không bị giới hạn hạn mức |
| `ANTHROPIC_API_KEY` | ✅ cho AI chấm | Lấy tại [platform.claude.com](https://platform.claude.com). Mỗi lần chấm tốn khoảng $0.03–0.05 |
| `CLAUDE_MODEL` | | Mặc định `claude-opus-5-5` |
| `JUDGE0_KEY` | cho nút ▶ Chạy test | RapidAPI key của [Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce), gói free khoảng 50 lần/ngày. Chưa có key thì dùng "AI review code" |
| `JUDGE0_URL` / `JUDGE0_JAVA_ID` | | Dùng khi tự host Judge0 (mặc định CE qua RapidAPI, Java id 62) |

Luyện nói dùng Web Speech API của trình duyệt (Chrome hoặc Edge), miễn phí và không cần cấu hình.

## Cấu trúc

```
index.html            khung trang
css/base.css          design tokens (sáng/tối) + component dùng chung
css/views/*.css       style riêng của từng màn hình
js/core/app.js        store, spaced repetition, nhật ký học, router, renderer
js/data/*.js          dữ liệu: câu hỏi, trắc nghiệm, thuật toán, lộ trình
js/views/*.js         các màn hình
scripts/validate.js   kiểm tra schema + markup của dữ liệu
docs/PLAN.md          thiết kế & kế hoạch
AGENTS.md             quy ước cho người / AI agent đóng góp nội dung
```

Code thuần HTML, CSS và JavaScript, không dùng framework.

## Đóng góp nội dung

1. Đọc [AGENTS.md](AGENTS.md) để nắm schema và chuẩn chất lượng của đáp án.
2. Thêm câu hỏi vào đúng file trong `js/data/`.
3. Chạy `node scripts/validate.js` cho đến khi in ra `OK — không có lỗi.`

## Cách dự án được xây dựng

Nội dung và giao diện được viết song song bởi nhiều AI coding agent miễn phí (opencode, Cline), theo đặc tả trong [`tasks/`](tasks/).
Claude Code thiết kế kiến trúc, viết phần lõi, rồi review, sửa lỗi kỹ thuật và tích hợp.

Muốn xem tiến độ các agent dưới dạng đường đua hoặc văn phòng ảo thì chạy:

```bash
node scripts/monitor.js
```

rồi mở http://localhost:4321.
