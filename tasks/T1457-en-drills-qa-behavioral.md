# T1457 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (behavioral) drill-qa-066…073

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1456

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-066` … `drill-qa-073`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **tình huống hành vi, trả lời theo STAR (Situation, Task, Action, Result)**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. Tell me about a disagreement with a teammate about a design.
2. Describe a time you missed a deadline. What happened next?
3. Tell me about a bug you caused in production.
4. Have you ever disagreed with your manager or product owner?
5. How have you helped a junior developer grow?
6. Tell me about critical feedback you received and what you did with it.
7. How do you work when requirements keep changing under time pressure?
8. Describe a difficult stakeholder or client and how you handled them.

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1457.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1457.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
- Added 8 behavioral QA drills to `js/data/drills-qa.js`: `drill-qa-066`–`drill-qa-073` (all `theme: behavioral`, `level: senior`, `seconds: 120`).
- Topics covered (STAR-style samples, 80–200 words, 3–6 phrases each): design disagreement (outbox vs direct publish), missed deadline (reporting/data migration), production bug caused (refund currency/cents), disagreement with product owner (feature flag), mentoring a junior, critical feedback received, changing requirements under time pressure, difficult stakeholder/client.
- Verified no overlap with existing questions; each sample includes concrete situation/numbers and trade-offs; phrases are exact substrings from samples.
- Ran `node scripts/build-light-index.js` and `node scripts/validate.js` → `OK — không có lỗi.` Syntax checked with `node --check js/data/drills-qa.js`. No files outside ownership modified (temporary helper in `logs/` removed). No git commit/push.
Reviewed-by: check-i18n (translation, no LLM review)
