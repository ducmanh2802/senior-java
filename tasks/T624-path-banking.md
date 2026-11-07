# T624 — Thêm chặng "Nghiệp vụ ngân hàng & doanh nghiệp" vào lộ trình

Status: DONE
Agent: kilo
Owns: `js/data/path.js`
After: T620

Đọc comment schema đầu `js/data/path.js` và các chặng có sẵn. Thêm **một chặng mới cuối danh sách** (id path-14, order 14, phase 'Senior', requires ['path-13']): "Nghiệp vụ ngân hàng, AI doanh nghiệp & maintain hệ thống lớn". Gồm:
- lessons: lesson-banking-003, lesson-banking-004
- questions: banking-001..009, ai-001..015, scenario-093..108
- quizTopics: ['banking', 'ai'] (thêm 'ai' nếu hợp lý). weeks, goal viết bằng tiếng Việt, rõ ràng.
Không sửa chặng khác.

## Nghiệm thu
`node --check js/data/path.js`, `node scripts/validate.js` → OK (không còn cảnh báo bài học nằm ngoài PATH). KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
Đã thêm chặng path-14 cuối danh sách (phụ thuộc path-13). Gồm lessons: lesson-banking-003, lesson-banking-004. questions: banking-001..009, ai-001..015, scenario-093..108. quizTopics: ['banking', 'ai']. Cập nhật goals/weeks theo yêu cầu. Chạy node --check js/data/path.js, node scripts/validate.js → OK.
Reviewed-by: kilo (T624R)
