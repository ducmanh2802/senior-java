# T08 — Nội dung: Phỏng vấn tiếng Anh

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

> **Quan trọng — ghi theo lô nhỏ:** model miễn phí sẽ timeout (lỗi 504) nếu sinh cả file trong một lần.
> Viết **3–4 câu mỗi lần edit**, nối vào cuối danh sách (trước dòng `);`), rồi chạy `node --check <file>` sau mỗi lô.
> Lặp lại cho đến đủ số lượng. Không cần web search dài dòng; chỉ tra cứu khi thực sự không chắc về API.

## Mục tiêu
Viết câu hỏi phỏng vấn **bằng tiếng Anh** cho topic `english` (ID từ `english-001`), theo schema ở `AGENTS.md` mục 4–5.
**Mỗi câu phải có `lang: 'en'`.** Mục tiêu là giúp dev Việt Nam trả lời trôi chảy khi phỏng vấn với công ty nước ngoài / remote.

### Format mỗi câu
- `q`: câu hỏi bằng tiếng Anh, đúng như interviewer sẽ hỏi.
- `a` gồm các phần sau, theo đúng thứ tự:
  1. `**Tóm tắt:**` bằng tiếng Việt: interviewer muốn nghe gì, cấu trúc câu trả lời.
  2. `### Sample answer`: câu trả lời mẫu **bằng tiếng Anh tự nhiên**, mức B2–C1, dài 120–250 từ, nói được thành lời trong 1–2 phút, có số liệu cụ thể. Đối với câu kỹ thuật thì giải thích rõ ràng như đang nói, không đọc tài liệu.
  3. `### Useful phrases`: 4–8 cụm từ / collocation hữu ích, mỗi dòng dạng `- **phrase**: nghĩa tiếng Việt`.
  4. `> Tip:` bằng tiếng Việt: lỗi người Việt hay mắc (phát âm, thì, từ dùng sai) hoặc mẹo trình bày.
- `follow`: 2–3 follow-up question bằng tiếng Anh.

## Danh sách câu hỏi (≥ 18 câu, bắt buộc bao phủ)
### Giới thiệu & động lực
- Tell me about yourself (phiên bản cho Senior Java backend)
- Walk me through your current project and its architecture
- Why are you leaving your current job? / Why do you want to join us?
- What are your strengths and weaknesses?
- Where do you see yourself in 5 years?
### Behavioral (STAR, tiếng Anh)
- Tell me about a time you handled a production incident
- Tell me about a disagreement with a teammate or manager
- Describe a time you mentored someone
- Tell me about a technical decision you regret
- How do you handle tight deadlines and changing requirements?
### Giải thích kỹ thuật bằng tiếng Anh
- Explain how HashMap works internally
- Explain the difference between optimistic and pessimistic locking
- How would you design a scalable REST API? / How do you ensure idempotency?
- Explain microservices vs monolith trade-offs to a non-technical stakeholder
- How do you troubleshoot a slow API in production?
- How do you use AI tools in your daily development work?
### Kỹ năng giao tiếp trong buổi phỏng vấn
- Cách xin nhắc lại / làm rõ câu hỏi, cách "think aloud" khi làm live coding (câu dạng meta: "How do I buy time and clarify questions politely?")
- Questions to ask the interviewer at the end
- Salary expectation & notice period conversation

## Notes
- Đã viết **19 câu** (`english-001` … `english-019`), đủ toàn bộ danh sách bắt buộc: giới thiệu/động lực (5), behavioral STAR (5), giải thích kỹ thuật (6), kỹ năng phỏng vấn (3).
- Mỗi câu có `lang: 'en'`, `follow` 3 câu tiếng Anh; `a` gồm `**Tóm tắt:**` (VI) → `### Sample answer` (EN, 183–241 từ) → `### Useful phrases` (6 cụm) → `> Tip:` (VI, lỗi phát âm/ngữ pháp thường gặp).
- Level: 5 mid / 11 senior / 3 lead (~26/58/16). Độ dài đáp án 2.033–2.643 ký tự.
- Không sửa file nào khác. `node --check js/data/q-english.js` → OK; `node scripts/validate.js q-english.js` → OK.
- `node scripts/validate.js` toàn repo cuối cùng → `OK — không có lỗi.` (trong lúc chạy có lỗi tạm thời từ file của agent khác đang ghi song song; đã chờ và kiểm tra lại sau khi họ hoàn tất).
Reviewed-by: codex (T08R)
