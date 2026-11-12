/* TOEIC Speaking & Writing practice (#/toeic) → window.TOEIC. Format theo ETS/IIBC (kiểm tra 2026-11-12):
   SPEAKING (11 câu, ~20 phút)                                  chuẩn bị   trả lời    thang
     s1  Q1–2  Read a text aloud                                  45s        45s        0–3
     s2  Q3–4  Describe a picture                                 45s        30s        0–3
     s3  Q5–7  Respond to questions                               3s         15/15/30s  0–3
     s4  Q8–10 Respond to questions using information provided    45s đọc    15/15/30s  0–3
     s5  Q11   Express an opinion                                 45s        60s        0–5
   WRITING (8 câu, ~60 phút)
     w1  Q1–5  Write a sentence based on a picture (2 từ cho sẵn)  8 phút cho cả 5 câu    0–3
     w2  Q6–7  Respond to a written request (trả lời e-mail)       10 phút mỗi câu        0–4
     w3  Q8    Write an opinion essay (khuyến nghị ≥ 300 từ)        30 phút                0–5
   Mỗi mục là MỘT câu/bộ câu luyện được độc lập; view ghép thành đề thi thử.
   Trường chung: { id: 'toeic-<part>-NNN', part, tips?: ['mẹo tiếng Việt'], tags? }
     s1: text (tiếng Anh 45–80 từ: thông báo, quảng cáo, tin tức ngắn), stress: ['từ/cụm cần nhấn', …]
     s2: scene (mô tả CHI TIẾT bức ảnh bằng tiếng Việt: người, vật, vị trí, hành động — vì app không có ảnh thật),
         sample (tiếng Anh 50–90 từ, đúng thứ tự: tổng quan → chi tiết → suy đoán)
     s3: context (bối cảnh khảo sát, tiếng Anh 1 câu), questions: [3 câu], samples: [3 câu trả lời mẫu]
     s4: info (lịch trình/agenda/hoá đơn dạng text nhiều dòng, tiếng Anh), questions: [3], samples: [3]
     s5: prompt (câu hỏi quan điểm), sample (tiếng Anh 110–160 từ: ý kiến → 2 lý do + ví dụ → kết)
     w1: scene (mô tả ảnh tiếng Việt), words: ['từ 1', 'từ 2'], sample (1 câu tiếng Anh dùng đủ 2 từ, đúng ảnh)
     w2: email (e-mail nhận được, tiếng Anh), task (yêu cầu, ví dụ "ask two questions and make one request"), sample (e-mail trả lời 80–150 từ)
     w3: prompt, outline: ['ý 1', …], sample (bài luận tiếng Anh 300–380 từ)
   Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal (không backtick lồng, không ${). Nội dung tự viết, không chép đề thật. */
(window.TOEIC = window.TOEIC || []).push(
);
