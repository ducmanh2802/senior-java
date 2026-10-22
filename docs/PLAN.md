# Senior Java Prep — Thiết kế & kế hoạch build

## 1. Mục tiêu sản phẩm
Một web tĩnh, miễn phí, chạy offline (mở thẳng `index.html` hoặc host trên GitHub Pages), giúp dev Java ôn phỏng vấn
Senior / Lead theo vòng lặp **học → tự kiểm tra → phỏng vấn thử → biết chỗ yếu → ôn lại**.

Phạm vi nội dung gồm 16 chủ đề trong 5 nhóm:

| Nhóm | Chủ đề |
|---|---|
| Java | Core Java, Collections, Java 8 → 21, Concurrency, JVM & GC |
| Framework | Spring & Spring Boot, JPA/Hibernate, Database & SQL |
| Architecture | Microservices, System Design, Design Patterns & Clean Architecture, **Tình huống thực tế** (tối ưu query, import CSV lớn, sự cố production…) |
| Cloud & AI | AWS & Cloud, AI/LLM cho Java dev |
| Soft skills | Testing & Quality, Leadership & Behavioral, **Phỏng vấn tiếng Anh** |

Mục tiêu khoảng **230 câu tự luận** có đáp án **giải thích chi tiết** và câu hỏi đào sâu, **≥ 80 câu trắc nghiệm** và **≥ 40 bài thuật toán** có lời giải Java.

## 2. Tính năng

**Mục tiêu người học:** sau 6 tháng phỏng vấn đậu Senior Java ở ngân hàng hoặc big tech Việt Nam. Toàn bộ nội dung và lộ trình được thiết kế quanh mục tiêu này.


| Màn hình | Chức năng chính |
|---|---|
| Tổng quan | **Kế hoạch hôm nay** (câu đến hạn ôn, việc của tuần, streak), tiến độ theo topic, lịch sử |
| Lộ trình | 26 tuần / 7 giai đoạn, checklist từng tuần, **nhật ký học hằng ngày** (heatmap, ghi chú), dự án portfolio |
| Câu hỏi | Tìm kiếm, lọc theo topic / level / trạng thái, accordion đáp án, tự đánh giá, bookmark |
| Flashcard | Bộ bài thông minh (ưu tiên câu yếu), lật thẻ, chấm 1/2/3 bằng phím |
| Trắc nghiệm | Chọn topic + số câu, chấm ngay kèm giải thích, kết quả theo topic, làm lại câu sai |
| Thuật toán | Lọc theo độ khó/pattern, đề + gợi ý từng bước, editor (lưu nháp), timer, lời giải Java + độ phức tạp |
| Phỏng vấn thử | Preset (Java / Microservices & SD / Tình huống / Cloud & AI / **English** / **Coding round** / Full loop), bấm giờ từng câu, ghi chú, tự chấm 1–5, tổng kết chủ đề yếu |

Tính năng chung: **lặp lại ngắt quãng (spaced repetition)**, tức là mọi lần tự chấm đều lên lịch ôn lại (Chưa biết → ngày mai, Cần ôn → 2+ ngày, Đã thuộc → 3 → 8 → 20+ ngày), nên câu chưa vững sẽ quay lại cho tới khi vững. Ngoài ra: tự đếm phút học mỗi ngày, dark/light mode, lưu tiến độ trong localStorage, xuất/nhập file JSON, phím tắt, responsive.

## 3. Kiến trúc

```
                 index.html  (thứ tự nạp script)
                      │
  js/data/*.js ───────┼──► window.TOPICS / QUESTIONS / QUIZ   (dữ liệu thuần)
                      │
  js/core/app.js ─────┼──► window.App: store · router · md() · helpers
                      │
  js/views/*.js ──────┴──► App.registerView(name, {render(root, params) → cleanup})
  css/base.css + css/views/*.css (scope .view-<name>)
```

Quyết định thiết kế:
- **Vanilla JS, classic script, không build**: chạy trên `file://`, không bị lock-in, agent miễn phí dễ làm đúng.
- **Dữ liệu là file JS thay vì JSON**: tránh `fetch()` bị chặn CORS trên `file://`, và viết nhiều dòng được bằng template literal.
- **Markup tự định nghĩa (`{{code}}`, `~~~`)**: tránh xung đột backtick với template literal; renderer nhỏ, an toàn (escape trước).
- **Mỗi task sở hữu file riêng**: các agent chạy song song mà không conflict. `scripts/validate.js` là cổng nghiệm thu tự động.

## 4. Phân công

| Task | Nội dung | Agent | Model | File sở hữu |
|---|---|---|---|---|
| T00 | Nền móng: core, base.css, schema, validator, AGENTS.md | Claude Code | — | core, base.css, index.html, scripts |
| T01 | Core Java, Collections, Java 8→21 (≥26 câu) | opencode | deepseek-v4.1-flash-free | `q-java.js` |
| T02 | Concurrency, JVM & GC (≥22 câu) | opencode | glm-5.3-flash-free | `q-concurrency-jvm.js` |
| T03 | Spring, JPA, Database (≥30 câu) | opencode | minimax-m3.1-flash-free | `q-spring-data.js` |
| T04 | Microservices (≥16 câu) | opencode | mimo-v2.6-flash-free | `q-microservices.js` |
| T05 | System Design, Patterns & Clean Arch (≥20 câu) | opencode | deepseek-v4.1-flash-free | `q-system-design.js` |
| T06 | AWS (≥14) + AI/LLM (≥12) | opencode | glm-5.3-flash-free | `q-aws.js`, `q-ai.js` |
| T07 | Testing + Behavioral (≥18 câu) | opencode | minimax-m3.1-flash-free | `q-soft.js` |
| T08 | Phỏng vấn tiếng Anh (≥18 câu) | opencode | nemotron-3-ultra-free | `q-english.js` |
| T12 | Ngân hàng trắc nghiệm (≥80 câu) | opencode | mimo-v2.6-flash-free | `quiz.js` |
| T14 | Bài thuật toán (≥40 bài, lời giải Java) | opencode | deepseek-v4.1-flash-free | `algo.js` |
| T16 | Tình huống thực tế (≥24 câu) | opencode | glm-5.3-flash-free | `q-scenario.js` |
| T09 | View Tổng quan + Câu hỏi | cline | (model mặc định của Cline) | `views/dashboard*`, `views/bank*` |
| T10 | View Flashcard + Trắc nghiệm | cline | (model mặc định của Cline) | `views/flash*`, `views/quiz*` |
| T11 | View Phỏng vấn thử (+ vòng coding) | cline | (model mặc định của Cline) | `views/mock*` |
| T15 | View Luyện thuật toán | cline | (model mặc định của Cline) | `views/algo*` |
| T17 | View Lộ trình 6 tháng + nhật ký học | cline | (model mặc định của Cline) | `views/roadmap*` |
| T13 | Tích hợp: review, sửa lỗi, kiểm tra trình duyệt, commit/push, deploy Vercel | Claude Code | — | toàn repo |

Đặc tả chi tiết từng task nằm trong `tasks/Txx-*.md`.

## 5. Quy trình

1. **Phase 0** (xong): nền móng + contract (`AGENTS.md`).
2. **Phase 1** (song song): `scripts/run-agents.sh` khởi chạy T01–T12, log ghi vào `logs/`.
3. **Phase 2** (tích hợp): chạy `node scripts/validate.js`, review chất lượng nội dung (soát ngẫu nhiên độ đúng kỹ thuật),
   kiểm tra UI bằng trình duyệt headless, sửa lỗi, rồi commit theo từng task và push.
4. **Phase 3** (tuỳ chọn): Claude Design để đánh bóng UI, thêm nội dung, spaced repetition (SM-2), chế độ luyện nói (speech).

## 6. Chạy lại một task

```bash
scripts/run-agents.sh T04          # chạy lại một task
scripts/run-agents.sh              # chạy tất cả task có Status: TODO
```

## 7. Deploy lên Vercel

Đây là site tĩnh, không cần build.
1. Vào vercel.com → **Add New… → Project** → import repo `ducmanh2802/senior-java`.
2. Framework Preset: **Other**, để trống Build Command, Output Directory là `./` (thư mục gốc).
3. Bấm Deploy. Từ đó mỗi lần `git push` lên `main` sẽ tự deploy lại.

Tiến độ học lưu trong localStorage của trình duyệt. Muốn chuyển máy thì dùng nút "Xuất / Nhập tiến độ" ở footer.
