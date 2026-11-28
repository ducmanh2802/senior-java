# T2857 — TOEIC tips & tricks: Speaking + Writing (8 bài)

Status: DONE
Agent: claude
Owns: `js/data/toeic-tips-sw.js`

Viết **8 bài tip** (chỉ THÊM, đọc bài đã có để không trùng):
- speaking (tip-s-01..05): Read aloud (nhấn âm, ngắt nghỉ, ngữ điệu danh sách, phát âm đuôi -s/-ed), Describe a picture (khung tổng quan → chi tiết → cảm nhận, từ chỉ vị trí), Respond to questions (trả lời đủ ý + 1 chi tiết trong 15/30 giây), Respond using information (đọc nhanh bảng, nói đúng số liệu, xử lý câu hỏi thông tin sai), Express an opinion (khung 60 giây: ý kiến → 2 lý do → ví dụ → kết).
- writing (tip-w-01..03): Write a sentence (dùng đúng dạng 2 từ, câu đơn đúng hơn câu dài sai), Respond to a written request (đọc đúng yêu cầu: 2 câu hỏi + 1 đề nghị…, mẫu mở/đóng e-mail), Opinion essay (dàn ý 5 đoạn, ≥ 300 từ, từ nối, lỗi hay gặp của người Việt).
Mỗi bài nêu thang điểm và tiêu chí chấm (ETS) ở mức chắc chắn, và `related` tới vài mục `toeic-s*/w*` có sẵn (kiểm id trong js/data/toeic.js).

Viết vào `js/data/toeic-tips-sw.js` (file riêng cho Speaking + Writing; thay dòng giữ chỗ bằng `(window.TOEIC_TIPS = window.TOEIC_TIPS || []).push(...)`, task sau thì chỉ THÊM). Schema ở cuối docs/TOEIC-LR.md. Mỗi bài: **Tóm tắt:** → chiến thuật từng bước VÌ SAO hiệu quả → ví dụ cụ thể (câu/đoạn mẫu tự viết, phân tích bẫy) → bảng lỗi hay gặp → lộ trình luyện theo mức điểm (450 → 650 → 800 → 900+) → `> Senior tip:`. Xu hướng đề mới chỉ nói ở mức quan sát chung, không bịa thống kê. `related` có thể trỏ `toeic-s1-001`… (S&W có sẵn) hoặc `lr1-p3-05`… (nếu đã có).

## Luật
- Tiếng Việt CÓ DẤU, ví dụ tiếng Anh tự nhiên. Không backtick, không `${`. Chỉ sửa file bạn sở hữu. KHÔNG commit.

## Nghiệm thu
`node --check js/data/toeic-tips.js`; `node scripts/check-toeic-lr.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. Xong: `Status: DONE` + Notes.

## Notes
- 8 bài: tip-s-01..05 (Read aloud, Describe a picture, Respond to questions, Respond using information, Express an opinion), tip-w-01..03 (Write a sentence, Respond to a written request, Opinion essay). Body 3.6k–4.6k ký tự, mỗi bài có bảng format/tiêu chí ETS, ví dụ tự viết, bảng lỗi, lộ trình, > Senior tip:.
- Lộ trình dùng mốc điểm S&W (thang 0–200: 100–120 / 130–150 / 160–170 / 180+) thay cho 450/650/800/900+ vì đó là thang L&R.
- videos chỉ dùng 1Ss1CXZsyfY, B8G_6bKBIrU, zh0E5Ky79RU, EwS5lxyQYXk (không gắn &t vì chưa kiểm mốc phút). Đề xuất: thêm vào videos-verified.js video chuyên đề Read aloud / Describe a picture / e-mail Writing nếu tìm được.
- related trỏ toeic-s1..s5 / w1..w3 -001..003 (có thật). check-toeic-lr OK; validate.js chỉ còn lỗi lr1-p4-* (toeic-lr, không thuộc task này).


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi tip phải có field `videos` (1–3 video). Đọc mục `videos` trong tài liệu schema. **Chỉ dùng ID trong `scripts/videos-verified.js`**; checker chặn ID ngoài danh sách. `note` nói rõ xem đoạn nào và vì sao.
