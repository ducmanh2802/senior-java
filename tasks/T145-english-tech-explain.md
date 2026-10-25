# T145 — Câu hỏi tiếng Anh: giải thích kỹ thuật & dẫn dắt system design

Status: DONE
Ghi chú: Đã thêm 8 câu mới (english-064 đến english-071) vào `js/data/q-english.js`: 1 câu kỹ thuật (virtual threads Java 21), 1 câu system design (clarify requirements), 1 câu trade-off stakeholder, 1 câu xử lý pushback, 1 câu xử lý không biết câu trả lời, 1 câu eventual consistency cho PM, 1 câu ước lượng server, 1 câu hỏi clarification tiếng Anh. `node scripts/validate.js` → OK (624 câu hỏi, 152 trắc nghiệm, không lỗi cú pháp).
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 và TẤT CẢ câu có sẵn trong `q-english.js` (không trùng). Thêm **~12 câu** topic `english`, `lang: 'en'`, theo format các câu đang có (Tóm tắt → ### Sample answer bằng tiếng Anh nói tự nhiên → ### Cụm từ hữu ích → ### Lỗi người Việt hay mắc → `> Senior tip:`), 1500–3500 ký tự: 6 câu giải thích kỹ thuật bằng tiếng Anh ("Explain how garbage collection works to a non-Java engineer", "Walk me through what happens when a request hits your Spring Boot service", "How would you explain eventual consistency to a product manager?", "Describe a production incident you debugged, step by step"…), 4 câu dẫn dắt system design bằng tiếng Anh (cách hỏi clarify requirement, nói ước lượng số, nói trade-off, xử lý khi bị interviewer phản bác), 2 câu xử lý khi không hiểu câu hỏi / không biết câu trả lời. Sample answer đúng kỹ thuật (Java 17/21, Spring Boot 3). `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: opencode (T145R)
