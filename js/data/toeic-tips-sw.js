/* TOEIC tips Speaking + Writing (docs/TOEIC-LR.md) — T2857: tip-s-01..05, tip-w-01..03.
   Format bám theo js/data/toeic.js (11 câu Speaking, 8 câu Writing, thang 0–200 mỗi kỹ năng).
   Không backtick, không dấu đô-la + ngoặc nhọn trong template literal. */
(window.TOEIC_TIPS = window.TOEIC_TIPS || []).push(
{
  id: 'tip-s-01',
  skill: 'speaking',
  order: 1,
  title: 'Read a text aloud (Q1–2): nhấn âm, ngắt nghỉ, ngữ điệu danh sách, đuôi -s/-ed',
  summary: 'Hai câu đọc to chỉ chấm phát âm, ngữ điệu và trọng âm. Dùng 45 giây chuẩn bị để đánh dấu chỗ ngắt, từ cần nhấn, danh sách và đuôi -s/-ed; đọc chậm, rõ, đều thay vì đọc nhanh.',
  body: `**Tóm tắt:** Câu 1–2 của TOEIC Speaking cho bạn 45 giây chuẩn bị và 45 giây đọc một đoạn thông báo/quảng cáo ngắn. Mỗi câu chấm thang 0–3 theo **phát âm (pronunciation)** và **ngữ điệu, trọng âm (intonation and stress)**. Không chấm nội dung, nên điểm đến từ việc đọc rõ, ngắt đúng cụm nghĩa và lên xuống giọng tự nhiên, không phải đọc nhanh.

### Format và cách chấm (mức chắc chắn)
| Mục | Chi tiết |
|---|---|
| Số câu | 2 (Q1, Q2) |
| Thời gian | 45 giây chuẩn bị, 45 giây đọc |
| Thang điểm câu | 0–3 |
| Tiêu chí | pronunciation; intonation and stress |
| Điểm kỹ năng | Toàn bài Speaking quy đổi ra thang 0–200 |

Vì tiêu chí chỉ có âm và nhạc điệu, người đọc lắp bắp nhưng đúng từ vẫn bị trừ, còn người đọc chậm hơn một chút nhưng rõ và đúng nhịp lại được điểm cao.

### Chiến thuật 45 giây chuẩn bị (VÌ SAO hiệu quả)
1. **Đọc thầm một lượt, mấp máy môi (10–15 giây).** Phát hiện từ lạ, tên riêng, số. Não đã "chạy thử" thì lúc đọc thật ít bị vấp.
2. **Đánh dấu ngắt nghỉ.** Ngắt ở dấu phẩy, dấu chấm, và trước giới từ/liên từ dài (before, because, which). Ngắt theo cụm nghĩa giúp người nghe hiểu, đó chính là thứ giám khảo gọi là ngữ điệu tự nhiên.
3. **Chọn từ nhấn.** Nhấn **content words** (danh từ, động từ chính, tính từ, số, tên riêng), lướt nhẹ function words (a, the, of, to). Tiếng Việt mỗi tiếng đều nặng như nhau; tiếng Anh thì không, nên đây là điểm người Việt hay mất.
4. **Tìm danh sách.** Câu kiểu "A, B, and C": lên giọng ở A, lên giọng ở B, xuống giọng ở C. Gần như đề nào cũng có một danh sách vì nó là phép thử ngữ điệu rõ nhất.
5. **Soi đuôi -s và -ed.** Đọc rõ phụ âm cuối; nuốt đuôi là lỗi phát âm và còn làm sai ngữ pháp trong tai người nghe.

### Quy tắc đuôi -s/-ed cần thuộc
| Đuôi | Phát âm | Khi nào | Ví dụ |
|---|---|---|---|
| -ed | /ɪd/ | sau âm /t/, /d/ | wanted, needed, updated |
| -ed | /t/ | sau âm vô thanh (p, k, f, s, sh, ch) | stopped, worked, finished |
| -ed | /d/ | sau âm hữu thanh còn lại | played, opened, delivered |
| -s | /ɪz/ | sau s, z, sh, ch, ge | buses, changes, offices |
| -s | /s/ | sau âm vô thanh | shops, tickets, maps |
| -s | /z/ | sau âm hữu thanh | rooms, stores, schedules |

### Ví dụ tự viết và cách đánh dấu
~~~text
Welcome to Greenfield Market. | This week, | we are offering FRESH fruit, (lên)
local CHEESE, (lên) | and HOMEMADE bread (xuống) | at special prices. |
Our store is OPEN from SEVEN a.m. | to TEN p.m. | every day. |
Customers who SPEND over FIFTY dollars | will receive a FREE reusable bag. |
Thank you for SHOPPING with us.
~~~
Phân tích bẫy:
- **Danh sách** fruit / cheese / bread: lên, lên, xuống. Đọc đều giọng cả ba là mất điểm ngữ điệu.
- **Số và giờ**: seven a.m., ten p.m., fifty dollars đọc tròn, nhấn vào số.
- **Đuôi**: offering, prices /ɪz/, customers /z/, receive. Cẩn thận "prices" đọc 2 âm tiết.
- **Mệnh đề quan hệ** "Customers who spend over fifty dollars" là một cụm chủ ngữ dài: không ngắt giữa "customers" và "who".

### Bảng lỗi hay gặp của người Việt
| Lỗi | Hậu quả | Cách sửa |
|---|---|---|
| Nuốt phụ âm cuối (work → "wơ") | Nghe như từ khác | Luyện chậm, phóng đại âm cuối |
| Đọc đều mọi từ như tiếng Việt | Ngữ điệu "robot" | Gạch chân content words, nhấn rõ |
| Ngắt sai giữa cụm (the / main entrance) | Mất nghĩa | Ngắt theo dấu câu và cụm giới từ |
| Đọc quá nhanh để "kịp" | Vấp, nuốt âm | 45 giây là dư cho 50–80 từ |
| Dừng lâu để sửa một từ sai | Gãy nhịp | Sửa nhanh một lần rồi đọc tiếp |
| Sai trọng âm từ dài (deVElop, apPOINTment) | Khó hiểu | Tra trọng âm từ mới mỗi ngày |

### Lộ trình luyện theo mức điểm
Thang S&W là 0–200 cho mỗi kỹ năng nên các mốc dưới đây dùng điểm Speaking, không phải thang 990 của L&R:
- **Mục tiêu 100–120:** đọc đúng mọi từ, không bỏ đuôi -s/-ed. Mỗi ngày đọc to một đoạn 60 từ, ghi âm, nghe lại.
- **Mục tiêu 130–150:** thêm ngắt nghỉ theo cụm và ngữ điệu danh sách. Luyện shadowing thông báo ngắn 10 phút mỗi ngày.
- **Mục tiêu 160–170:** sửa trọng âm từ đa âm tiết, nối âm tự nhiên (pick it up). So sánh bản ghi với giọng mẫu.
- **Mục tiêu 180+:** đọc như phát thanh viên: nhấn đúng từ mang thông tin mới, giọng xuống rõ ở cuối câu trần thuật, tốc độ đều.

> Senior tip: Ghi âm chính mình là cách rẻ và hiệu quả nhất. Tôi từng nghĩ mình đọc ổn, nghe lại mới thấy bỏ gần hết âm cuối. Mỗi tối đọc 2 đoạn, đánh dấu bằng bút chì đúng như trong phòng thi (dấu | cho ngắt, chữ in hoa cho từ nhấn) để đến ngày thi việc đánh dấu thành phản xạ trong 45 giây.`,
  checklist: [
    'Dùng 45 giây chuẩn bị để đọc thầm và đánh dấu ngắt nghỉ',
    'Nhấn content words, lướt function words',
    'Danh sách A, B, and C: lên, lên, xuống giọng',
    'Phát âm rõ đuôi -s (/s/, /z/, /ɪz/) và -ed (/t/, /d/, /ɪd/)',
    'Đọc tốc độ vừa phải, không vội vì 45 giây là đủ',
    'Ghi âm và nghe lại ít nhất một đoạn mỗi ngày',
  ],
  videos: [
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Tổng quan cấu trúc S&W bằng tiếng Việt, nắm thời gian từng phần trước khi luyện đọc to.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Khoá tổng quan; xem phần Speaking để nghe giọng đọc mẫu và nhịp ngắt nghỉ.' },
  ],
  related: ['toeic-s1-001', 'toeic-s1-002', 'toeic-s1-003'],
},
{
  id: 'tip-s-02',
  skill: 'speaking',
  order: 2,
  title: 'Describe a picture (Q3–4): tổng quan → chi tiết → cảm nhận, từ chỉ vị trí',
  summary: 'Có 45 giây chuẩn bị và 30 giây nói cho mỗi ảnh. Dùng khung 3 bước: câu tổng quan, 3–4 chi tiết theo vị trí, câu suy đoán/cảm nhận. Ngữ pháp hiện tại tiếp diễn và giới từ vị trí là chìa khoá.',
  body: `**Tóm tắt:** Câu 3–4 yêu cầu mô tả một bức ảnh trong 30 giây sau 45 giây chuẩn bị, thang 0–3 mỗi câu. Ngoài phát âm, ngữ điệu, trọng âm, giám khảo xét thêm **ngữ pháp, từ vựng và tính mạch lạc (cohesion)**. Khung an toàn: 1 câu tổng quan → 3–4 câu chi tiết đi theo vị trí → 1 câu suy đoán hoặc cảm nhận.

### Format và tiêu chí
| Mục | Chi tiết |
|---|---|
| Số câu | 2 (Q3, Q4) |
| Thời gian | 45 giây chuẩn bị, 30 giây nói |
| Thang | 0–3 |
| Tiêu chí | pronunciation, intonation and stress, grammar, vocabulary, cohesion |

30 giây chỉ đủ khoảng 5–6 câu nói tự nhiên. Người cố tả mọi thứ thường bị cắt giữa câu; người có khung rõ sẽ kết thúc gọn.

### Khung 3 bước và VÌ SAO
1. **Tổng quan (1 câu):** đâu, ai, đang làm gì. "This picture was taken in a busy office." Câu này cho người nghe bối cảnh, giúp phần sau mạch lạc.
2. **Chi tiết theo vị trí (3–4 câu):** đi một hướng cố định: trước → sau, hoặc trái → phải. Giữ một hướng giúp bạn không quên chi tiết và tự nhiên tạo cohesion.
3. **Suy đoán/cảm nhận (1 câu):** "It seems that they are preparing for a meeting." Câu này cho thấy bạn dùng được cấu trúc đa dạng và là "câu đệm" nếu còn thời gian.

Trong 45 giây chuẩn bị, **không viết câu đầy đủ**, chỉ chọn: địa điểm, 3 chủ thể chính (người/vật), hướng đi, một câu suy đoán.

### Ngữ pháp và từ vựng dùng đi dùng lại
- Người đang làm gì: hiện tại tiếp diễn ("A man **is holding** a cup").
- Vật ở đâu: there is/there are + giới từ ("There are some files **on** the desk").
- Trạng thái bị động: "The chairs **have been arranged** in a row" (dùng khi chắc chắn, sai thì quay về câu đơn).
- Từ vị trí: in the foreground, in the background, on the left/right, in the middle of, next to, behind, in front of, across from, along.
- Suy đoán: It looks like…, It seems that…, They might be…, Probably…

### Ví dụ tự viết
Ảnh (mô tả bằng lời): một quầy cà phê ngoài trời, hai người phụ nữ đứng chờ, nhân viên pha chế đứng sau quầy, có bảng menu phía trên, vài chiếc ô màu xanh phía sau.
~~~text
This picture was taken at an outdoor coffee stand.
In the foreground, two women are standing in line and one of them is looking at her phone.
Behind the counter, a barista is preparing a drink.
Above him, there is a large menu board with prices.
In the background, I can see several blue umbrellas along the street.
It looks like a sunny morning, and the stand seems quite popular.
~~~
Phân tích:
- Câu 1 tổng quan, câu 2–5 đi từ trước ra sau, câu 6 suy đoán.
- Mỗi câu một ý, ngữ pháp đơn giản nhưng đa dạng: is standing, is preparing, there is, I can see, it looks like.
- Không có từ đoán bừa: không biết đồ uống là gì thì nói "a drink", không nói "a cappuccino".

### Bảng lỗi hay gặp
| Lỗi | Vì sao mất điểm | Sửa |
|---|---|---|
| Nhảy lung tung giữa các góc ảnh | Thiếu cohesion | Đi một hướng cố định |
| "A man stand", "two woman" | Lỗi ngữ pháp cơ bản lặp lại | Luyện chủ ngữ + is/are + V-ing |
| Mở đầu bằng "Umm, in this picture, umm" kéo dài | Mất 5–7 giây | Thuộc sẵn câu mở |
| Dùng từ không chắc nghĩa | Sai từ vựng | Thay bằng từ chung (equipment, items) |
| Bị cắt giữa câu | Ấn tượng thiếu kiểm soát | Câu suy đoán để cuối, bỏ được |
| Im lặng dài vì không biết tên vật | Giảm fluency | Dùng "something like…", "a kind of…" |

### Lộ trình theo mức điểm Speaking (0–200)
- **100–120:** thuộc câu mở và 10 giới từ vị trí; mỗi ảnh nói được 3 câu đúng ngữ pháp.
- **130–150:** dùng khung 3 bước, đủ 5 câu trong 30 giây; luyện 2 ảnh mỗi ngày (ảnh báo, ảnh điện thoại).
- **160–170:** đa dạng cấu trúc (bị động, mệnh đề quan hệ ngắn), từ vựng nơi làm việc, nhà hàng, giao thông.
- **180+:** nói liền mạch, có từ nối (while, meanwhile, next to that), suy đoán hợp lý, kết thúc vừa lúc hết giờ.

> Senior tip: Chụp 5 ảnh quanh bạn mỗi ngày (văn phòng, quán cà phê, bến xe) và tả mỗi ảnh đúng 30 giây có bấm giờ. Sau 2–3 tuần, khung "tổng quan → trước → sau → suy đoán" thành phản xạ, phòng thi chỉ còn việc thay danh từ.`,
  checklist: [
    'Câu 1 luôn là tổng quan: địa điểm + ai + đang làm gì',
    'Đi chi tiết theo một hướng cố định (trước → sau hoặc trái → phải)',
    'Thuộc 10 cụm vị trí: in the foreground, in the background, next to…',
    'Dùng hiện tại tiếp diễn đúng: chủ ngữ + is/are + V-ing',
    'Kết bằng câu suy đoán It looks like / It seems that',
    'Bấm giờ 30 giây khi luyện để quen độ dài 5–6 câu',
  ],
  videos: [
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Giải thích bằng tiếng Việt cấu trúc đề S&W hiện hành, gồm phần mô tả ảnh.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Phần Speaking của khoá tổng quan: xem cách tả ảnh theo bố cục và câu mẫu.' },
  ],
  related: ['toeic-s2-001', 'toeic-s2-002', 'toeic-s2-003'],
},
{
  id: 'tip-s-03',
  skill: 'speaking',
  order: 3,
  title: 'Respond to questions (Q5–7): trả lời đủ ý + 1 chi tiết trong 15/15/30 giây',
  summary: 'Ba câu hỏi khảo sát về đời sống hằng ngày, chỉ 3 giây chuẩn bị. Công thức: trả lời thẳng câu hỏi bằng câu hoàn chỉnh, thêm 1 lý do hoặc chi tiết; câu 30 giây thêm ví dụ. Không cần thật, cần rõ và liên quan.',
  body: `**Tóm tắt:** Câu 5–7 giả lập một cuộc khảo sát qua điện thoại về chủ đề quen thuộc (mua sắm, đi lại, giải trí). Mỗi câu chỉ có 3 giây chuẩn bị, trả lời 15, 15 và 30 giây, thang 0–3. Ngoài âm và ngữ pháp, giám khảo xét **mức liên quan (relevance) và đầy đủ (completeness)** của nội dung. Công thức: **trả lời thẳng + 1 chi tiết** (câu 15 giây) và **trả lời thẳng + 2 lý do/ví dụ** (câu 30 giây).

### Format và tiêu chí
| Câu | Chuẩn bị | Trả lời | Thường hỏi |
|---|---|---|---|
| Q5 | 3 giây | 15 giây | tần suất, lần gần nhất, ở đâu |
| Q6 | 3 giây | 15 giây | với ai, bao lâu, thích gì |
| Q7 | 3 giây | 30 giây | ý kiến, lựa chọn, đề xuất |

Tiêu chí: pronunciation, intonation and stress, grammar, vocabulary, cohesion, relevance of content, completeness of content.

### Chiến thuật và VÌ SAO
1. **Lặp lại khung câu hỏi.** Hỏi "How often do you go to the cinema?" → "I go to the cinema about twice a month." Lặp khung cho bạn câu đầu ngay lập tức, đúng ngữ pháp và chắc chắn liên quan.
2. **Thêm đúng 1 chi tiết cho câu 15 giây.** "…usually on Friday evenings with my coworkers." 15 giây chỉ đủ 2 câu; cố nói 4 câu là bị cắt.
3. **Câu 30 giây dùng mini-khung:** ý chính → lý do 1 → lý do 2 hoặc ví dụ → câu chốt. Đây là bản rút gọn của câu 11.
4. **Không cần nói thật.** Bạn không phải khai báo thật; chọn câu trả lời dễ diễn đạt nhất. Không đi xem phim? Cứ nói có, vì nói "I never go" thì hết chuyện để nói.
5. **Nghe kỹ thì của câu hỏi.** "When was the last time…" cần quá khứ đơn; "Would you…" cần would/I'd.

### Ví dụ tự viết
Bối cảnh: một công ty du lịch khảo sát thói quen đi nghỉ cuối tuần.
~~~text
Q5: How often do you take a short trip on weekends?
A: I take a short weekend trip about once every two months, usually to the beach near my city.

Q6: Who do you usually travel with, and why?
A: I usually travel with my sister because we like the same activities and it is cheaper to share a room.

Q7: What would you consider most important when choosing a weekend destination?
A: For me, the most important thing is travel time. I only have two days, so I do not want to spend
five hours on a bus. Second, I look at the price of hotels, because a short trip should not be expensive.
For example, last month I chose a small town just two hours away, and it was relaxing and affordable.
So I think a close and reasonably priced place is the best choice.
~~~
Phân tích: Q5 lặp khung "take a short weekend trip" và thêm địa điểm; Q6 trả lời cả hai vế (who + why), bỏ một vế là mất completeness; Q7 có ý chính, 2 lý do, ví dụ, câu chốt.

### Bảng lỗi hay gặp
| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Trả lời một từ "Twice a month." | Thiếu completeness | Luôn nói câu hoàn chỉnh |
| Câu hỏi 2 vế, chỉ trả lời 1 vế | Mất điểm nội dung | Gạch nhẩm "who…and why" |
| Sai thì (When did you… → I go) | Lỗi ngữ pháp lộ rõ | Lặp đúng động từ trong câu hỏi |
| Lan man sang chuyện khác | Mất relevance | Mỗi câu phải trả lời được câu hỏi |
| Im lặng 5 giây để nghĩ | Lãng phí thời gian | Câu đệm: "Well, I would say…" |

### Lộ trình theo mức điểm Speaking (0–200)
- **100–120:** luyện phản xạ lặp khung câu hỏi; 20 câu hỏi How often/When/Where mỗi ngày.
- **130–150:** thêm 1 chi tiết (với ai, lúc nào, vì sao) trong 15 giây; bấm giờ nghiêm.
- **160–170:** câu 30 giây có cấu trúc rõ và từ nối (first, also, for example, so).
- **180+:** đa dạng từ vựng theo chủ đề, ngữ điệu tự nhiên, kết thúc đúng lúc hết giờ.

> Senior tip: Lập "kho chuyện dùng chung": một nơi bạn hay đi (công viên gần nhà), một người hay đi cùng (đồng nghiệp), một lý do vạn năng (tiết kiệm thời gian, giá hợp lý). Gần như mọi chủ đề khảo sát đều ghép được vào kho này, nên 3 giây chuẩn bị không còn là vấn đề.`,
  checklist: [
    'Lặp lại khung câu hỏi để có ngay câu đầu đúng ngữ pháp',
    'Câu 15 giây: trả lời thẳng + đúng 1 chi tiết',
    'Câu 30 giây: ý chính → 2 lý do/ví dụ → câu chốt',
    'Trả lời đủ mọi vế của câu hỏi 2 vế',
    'Khớp thì động từ với câu hỏi (did/would/do)',
    'Chuẩn bị kho câu chuyện và lý do dùng chung',
  ],
  videos: [
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Nghe giải thích tiếng Việt về các phần Speaking, gồm nhóm câu hỏi khảo sát 15/30 giây.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Phần Speaking: tham khảo cách trả lời ngắn gọn, đủ ý trong thời gian giới hạn.' },
  ],
  related: ['toeic-s3-001', 'toeic-s3-002', 'toeic-s3-003'],
},
{
  id: 'tip-s-04',
  skill: 'speaking',
  order: 4,
  title: 'Respond using information (Q8–10): đọc nhanh bảng, nói đúng số liệu, sửa thông tin sai',
  summary: 'Có 45 giây đọc lịch trình/hoá đơn trước khi nghe 3 câu hỏi. Đọc theo khung (tiêu đề, giờ, cột), trả lời bằng câu đầy đủ, đọc đúng số và giờ, lịch sự đính chính khi người hỏi nhớ sai, câu 30 giây liệt kê đủ mọi mục.',
  body: `**Tóm tắt:** Câu 8–10 đưa ra một tài liệu (lịch trình hội thảo, lịch phỏng vấn, hoá đơn, thực đơn sự kiện…) và 45 giây để đọc, rồi bạn nghe 3 câu hỏi của một người gọi đến, trả lời 15, 15 và 30 giây, thang 0–3 mỗi câu. Điểm nằm ở việc **tìm đúng thông tin nhanh, nói số liệu chính xác và trả lời bằng câu hoàn chỉnh lịch sự**. Câu 10 thường yêu cầu liệt kê nhiều mục (mọi phiên buổi chiều, mọi hoạt động do một người phụ trách).

### Format và tiêu chí
| Câu | Trả lời | Dạng hay gặp |
|---|---|---|
| Q8 | 15 giây | hỏi thông tin cơ bản: mấy giờ, ở đâu, giá bao nhiêu |
| Q9 | 15 giây | người hỏi nói một ý **sai**, bạn phải đính chính |
| Q10 | 30 giây | liệt kê, tóm tắt nhiều mục; câu hỏi thường được phát lại |

Tiêu chí giống Q5–7: âm, ngữ điệu, ngữ pháp, từ vựng, cohesion, relevance, completeness. Tài liệu vẫn hiển thị khi bạn trả lời, nên không cần học thuộc mà cần **biết chỗ cần nhìn**.

### Cách dùng 45 giây đọc (VÌ SAO hiệu quả)
1. **Tiêu đề, ngày, địa điểm (10 giây).** Q8 hay hỏi đúng các thông tin này.
2. **Quét cấu trúc cột:** giờ | nội dung | người phụ trách | phòng. Biết cột nào ở đâu thì khi nghe câu hỏi mắt nhảy thẳng tới đó.
3. **Soi chú thích nhỏ:** "cancelled", "moved to", "lunch not included", dấu sao. Q9 hay xoáy vào những điểm này để tạo thông tin sai.
4. **Nhẩm cách đọc số và giờ:** 9:30 a.m. = nine thirty a.m.; 12:15 = twelve fifteen; 45 dollars = forty-five dollars.

### Ví dụ tự viết
~~~text
Regional Sales Workshop — Harbor Hotel, Conference Room B
Thursday, May 14
 9:00 a.m.   Registration and coffee
 9:30 a.m.   Welcome speech: Daniel Price, Sales Director
10:00 a.m.   Workshop: Handling Customer Complaints — Mia Tran
12:00 p.m.   Lunch (Hotel restaurant, included)
 1:00 p.m.   Workshop: Closing Deals Online — Mia Tran
 2:30 p.m.   Panel: Market Trends (CANCELLED)
 3:00 p.m.   Q&A and closing remarks — Daniel Price
~~~
Câu hỏi và trả lời mẫu:
~~~text
Q8: Where is the workshop being held, and what time does it start?
A: The workshop will be held in Conference Room B at the Harbor Hotel. Registration starts at nine a.m.

Q9: I heard there is a panel on market trends at two thirty. I'm really looking forward to it.
A: I'm sorry, but that panel has been cancelled. After the online sales workshop,
   we will go directly to the Q&A session at three p.m.

Q10: Could you tell me about the sessions led by Mia Tran?
A: Sure. Mia Tran is leading two sessions. First, at ten a.m., she will run a workshop on handling
   customer complaints. Then, at one p.m., after lunch, she will lead another workshop
   called Closing Deals Online. So you can see her both in the morning and in the afternoon.
~~~
Phân tích: Q9 là bẫy kinh điển, người hỏi tin vào một thông tin đã bị huỷ. Đính chính lịch sự ("I'm sorry, but…", "Actually,…") rồi đưa thông tin đúng thay thế. Q10 dùng first/then để liệt kê đủ cả hai phiên, thiếu một phiên là mất completeness.

### Bảng lỗi hay gặp
| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Đọc nguyên dòng bảng "10:00 Workshop Handling…" | Không phải câu, mất ngữ pháp | Chuyển thành câu: "At ten, there is a workshop on…" |
| Đọc sai giờ/số | Sai nội dung | Nhẩm cách đọc số trong 45 giây |
| Đồng ý với thông tin sai ở Q9 | Mất relevance | Luôn đối chiếu với tài liệu |
| Q10 chỉ nêu 1 trong 2–3 mục | Thiếu completeness | Đếm số mục trước khi nói |
| Giọng cụt, thiếu lịch sự | Không tự nhiên | Mở "Sure", "Let me check", kết "Is there anything else?" |

### Lộ trình theo mức điểm Speaking (0–200)
- **100–120:** luyện đọc giờ, ngày, giá tiền thành tiếng thật trơn; chuyển 10 dòng bảng thành câu mỗi ngày.
- **130–150:** tập đính chính với "I'm afraid…", "Actually,…"; luyện Q10 có first/then/finally.
- **160–170:** bấm giờ đủ bộ 3 câu; câu 30 giây phải hết mọi mục trong khoảng 25 giây.
- **180+:** nói như lễ tân chuyên nghiệp: chủ động, đủ ý, có câu kết lịch sự.

> Senior tip: Lấy chính lịch họp, vé máy bay, hoá đơn điện của bạn để luyện: mỗi tài liệu tự đặt 3 câu (một câu hỏi thẳng, một câu có thông tin sai, một câu liệt kê). Tài liệu thật buộc bạn đọc nhiều định dạng khác nhau, giống cách đề thay đổi bối cảnh.`,
  checklist: [
    'Đọc tiêu đề, ngày, địa điểm đầu tiên trong 45 giây',
    'Soi chú thích cancelled/moved/not included để đón câu hỏi bẫy',
    'Chuyển dòng bảng thành câu hoàn chỉnh khi trả lời',
    'Đính chính lịch sự bằng I am sorry, but… / Actually…',
    'Câu 10: đếm đủ số mục và liệt kê bằng first/then/finally',
    'Luyện đọc giờ, ngày, giá tiền thành tiếng trơn tru',
  ],
  videos: [
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Giải thích tiếng Việt các phần Speaking, gồm phần trả lời dựa trên thông tin cho sẵn.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Phần Speaking: tham khảo cách đọc bảng lịch trình và trả lời bằng câu đầy đủ.' },
  ],
  related: ['toeic-s4-001', 'toeic-s4-002', 'toeic-s4-003'],
},
{
  id: 'tip-s-05',
  skill: 'speaking',
  order: 5,
  title: 'Express an opinion (Q11): khung 60 giây ý kiến → 2 lý do → ví dụ → kết',
  summary: 'Câu cuối Speaking có thang 0–5, 45 giây chuẩn bị và 60 giây nói. Chọn phe dễ nói nhất, nêu ý kiến rõ trong câu đầu, phát triển 2 lý do có ví dụ cá nhân, kết bằng câu nhắc lại. Khung cố định giúp không bị cắt giữa ý.',
  body: `**Tóm tắt:** Câu 11 yêu cầu nêu và bảo vệ quan điểm về một vấn đề (làm việc từ xa, học online, chọn công việc…). Bạn có 45 giây chuẩn bị, 60 giây nói, thang **0–5**, là câu có trọng số điểm cao nhất của phần Speaking. Giám khảo xét toàn bộ tiêu chí: âm, ngữ điệu, ngữ pháp, từ vựng, cohesion, relevance, completeness. Khung an toàn: **ý kiến (1 câu) → lý do 1 + ví dụ → lý do 2 + ví dụ → câu kết**.

### Phân bổ 60 giây
| Phần | Thời lượng | Nội dung |
|---|---|---|
| Mở | ~5–8 giây | nêu rõ phe: "I believe that…" |
| Lý do 1 | ~20 giây | lý do + giải thích + ví dụ |
| Lý do 2 | ~20 giây | lý do + giải thích + ví dụ |
| Kết | ~5–8 giây | "For these reasons, I think…" |

### Chiến thuật 45 giây chuẩn bị (VÌ SAO hiệu quả)
1. **Chọn phe trong 5 giây.** Không chấm bạn đúng hay sai, chấm việc bạn bảo vệ quan điểm. Chọn phe bạn có sẵn ví dụ, không phải phe bạn thật sự tin.
2. **Ghi 2 từ khoá lý do + 2 từ khoá ví dụ.** Ví dụ: "save time – 2h commute", "focus – quiet room". Từ khoá, không viết câu, vì viết câu tốn thời gian và khi nói bạn sẽ đọc như máy.
3. **Thuộc sẵn câu mở và câu kết.** Hai câu này giống nhau ở mọi đề nên không cần nghĩ.
4. **Đề dạng chọn một trong hai/ba phương án:** chọn một, có thể nói thêm vì sao không chọn cái kia nếu còn thời gian.

### Ví dụ tự viết
Đề: Some people think employees should be allowed to work from home two days a week. Do you agree or disagree? Give reasons and examples.
~~~text
I strongly agree that employees should be allowed to work from home two days a week.
First, it saves a lot of time. In my city, many people spend more than an hour in traffic
each way. If they work from home twice a week, they can use that time to rest or to start
work earlier, so they are more productive.
Second, people can focus better on certain tasks at home. For example, when I write reports,
the office is often noisy because of meetings and phone calls. At home, I can finish the same
report much faster because nobody interrupts me.
Of course, teams still need time together, which is why three days in the office is a good balance.
For these reasons, I believe a two-day work-from-home policy benefits both employees and companies.
~~~
Phân tích: câu đầu trả lời thẳng; "First/Second" tạo cohesion; mỗi lý do có ví dụ cụ thể (giao thông, viết báo cáo); câu "Of course…" thừa nhận phía bên kia, thể hiện tư duy cân bằng; câu kết nhắc lại quan điểm. Nếu hết giờ ở câu "Of course" thì bạn vẫn đã nói đủ ý chính.

### Từ nối và cụm nên có sẵn
- Nêu ý kiến: In my opinion, I strongly believe that, From my point of view.
- Lý do: The main reason is that, Another reason is, On top of that.
- Ví dụ: For example, For instance, In my experience, Last year, I…
- Kết: For these reasons, That is why I think, Overall.

### Bảng lỗi hay gặp
| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Lưỡng lự "It depends…" cả 60 giây | Ý kiến không rõ | Chọn một phe ngay câu đầu |
| Một lý do kéo dài, không có lý do 2 | Thiếu phát triển | Mỗi lý do khoảng 20 giây |
| Lý do chung chung, không ví dụ | Thiếu completeness | Thêm ví dụ cá nhân có chi tiết |
| Đọc thuộc lòng bài mẫu không khớp đề | Mất relevance | Học khung, không học thuộc nội dung |
| Nói xong ở giây 35 rồi im lặng | Phí thời gian | Thêm ví dụ hoặc câu nhượng bộ |
| Sai ngữ pháp do nói quá nhanh | Mất điểm grammar | Câu ngắn, đúng, tốc độ vừa |

### Lộ trình theo mức điểm Speaking (0–200)
- **100–120:** thuộc câu mở/kết, nói được 1 lý do + 1 ví dụ đúng ngữ pháp.
- **130–150:** đủ khung 2 lý do, dùng First/Second, bấm giờ 60 giây mỗi ngày với 1 đề.
- **160–170:** ví dụ cụ thể có số liệu cá nhân, câu nhượng bộ, từ vựng đa dạng hơn (beneficial, efficient, flexible).
- **180+:** nói trôi chảy, ngữ điệu nhấn từ khoá lập luận, chuyển ý mượt, kết thúc vừa đủ 60 giây.

> Senior tip: Chuẩn bị khoảng 6 "lý do vạn năng" (tiết kiệm thời gian, tiết kiệm tiền, sức khoẻ, phát triển kỹ năng, quan hệ con người, sự tiện lợi), mỗi lý do kèm một ví dụ cá nhân. Phần lớn đề opinion đều ghép được 2 trong 6 lý do này, nên 45 giây chuẩn bị chỉ còn là chọn phe và chọn lý do.`,
  checklist: [
    'Câu đầu tiên nêu rõ quan điểm, không dùng It depends',
    'Hai lý do, mỗi lý do có một ví dụ cụ thể',
    'Ghi từ khoá trong 45 giây, không viết câu đầy đủ',
    'Dùng First/Second/For example/For these reasons để nối ý',
    'Có câu kết nhắc lại quan điểm trước khi hết 60 giây',
    'Luyện mỗi ngày một đề có bấm giờ và ghi âm',
  ],
  videos: [
    { title: 'TOEIC Speaking: How to CORRECTLY Express Your Opinion', url: 'https://www.youtube.com/watch?v=B8G_6bKBIrU', note: 'Video chuyên đề câu Express an opinion: cách nêu quan điểm và phát triển lý do.' },
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Tổng quan tiếng Việt, giúp nắm vị trí và trọng số của câu 11 trong bài Speaking.' },
  ],
  related: ['toeic-s5-001', 'toeic-s5-002', 'toeic-s5-003'],
},
{
  id: 'tip-w-01',
  skill: 'writing',
  order: 1,
  title: 'Write a sentence (Q1–5): dùng đủ 2 từ, câu đơn đúng hơn câu dài sai',
  summary: 'Năm câu viết dựa trên ảnh trong 8 phút, thang 0–3. Mỗi câu phải dùng đủ 2 từ cho sẵn, đúng ngữ pháp và đúng nội dung ảnh. Câu đơn chính xác an toàn hơn câu phức có lỗi; dành 1 phút cuối để soát.',
  body: `**Tóm tắt:** Câu 1–5 của TOEIC Writing cho 5 bức ảnh, mỗi ảnh kèm 2 từ/cụm từ. Bạn viết **một câu** về ảnh có dùng cả 2 từ, tổng 8 phút cho 5 câu. Thang 0–3 mỗi câu, chấm **ngữ pháp** và **mức liên quan của câu với bức ảnh**. Một câu đơn đúng và khớp ảnh đã đủ điểm tối đa; câu dài có lỗi thì bị trừ.

### Format và tiêu chí
| Mục | Chi tiết |
|---|---|
| Số câu | 5 (Q1–Q5) |
| Thời gian | 8 phút cho cả 5 câu (có thể quay lại câu trước) |
| Thang | 0–3 mỗi câu |
| Tiêu chí | grammar; relevance of the sentence to the picture |

Hướng dẫn trên màn hình cho phép đổi dạng từ (ví dụ chia động từ, thêm số nhiều) và dùng hai từ theo thứ tự bất kỳ. Luôn đọc lại hướng dẫn của đề bạn đang làm vì đó là quy định có hiệu lực.

### Chiến thuật (VÌ SAO hiệu quả)
1. **Xác định loại từ của cặp từ.** Ví dụ "woman / carry": danh từ + động từ → "A woman is carrying…". "because / tired": liên từ → cần hai mệnh đề. "in front of / building": giới từ + danh từ → cụm vị trí. Biết loại từ là biết khung câu.
2. **Dùng khung câu an toàn:** chủ ngữ + is/are + V-ing + tân ngữ + cụm vị trí. Hầu hết ảnh là người đang làm gì ở đâu, khung này hợp gần như mọi lúc.
3. **Đúng ảnh trước, hay sau.** Câu đúng ngữ pháp nhưng sai ảnh (ảnh có 2 người, viết "a man is alone") vẫn bị trừ điểm relevance.
4. **Phân thời gian:** khoảng 1 phút mỗi câu, còn 2–3 phút soát lỗi: chia động từ, số nhiều, mạo từ, dấu chấm cuối câu.

### Ví dụ tự viết
| Ảnh | Hai từ | Câu yếu | Câu tốt |
|---|---|---|---|
| Hai đồng nghiệp xem màn hình laptop | look at / screen | They look screen. | Two coworkers are looking at a laptop screen. |
| Người đàn ông tưới cây trong vườn | water / plants | A man water plant in the garden. | A man is watering the plants in the garden. |
| Hành khách xếp hàng chờ lên xe buýt | wait / so that | People wait so that bus come. | Passengers are waiting in line so that they can get on the bus. |
| Hộp giấy chồng lên nhau trong kho | stack / next to | Box stack next to. | Some boxes are stacked next to the shelves. |
| Phụ nữ cầm ô vì trời mưa | because / umbrella | Because umbrella, she walk. | The woman is holding an umbrella because it is raining. |

Phân tích:
- Từ liên từ (so that, because, while, although) bắt buộc hai mệnh đề có chủ ngữ và động từ.
- "stack" ở dạng bị động "are stacked" vì hộp không tự xếp. Câu chủ động "Someone has stacked boxes…" đúng ngữ pháp nhưng nhắc tới người không có trong ảnh, nên câu bị động khớp ảnh hơn.
- Mọi câu có mạo từ (a, the) trước danh từ số ít đếm được và kết thúc bằng dấu chấm.

### Bảng lỗi hay gặp của người Việt
| Lỗi | Ví dụ sai | Sửa |
|---|---|---|
| Thiếu to be | A man carrying a box. | A man **is** carrying a box. |
| Thiếu số nhiều | two woman, many chair | two women, many chairs |
| Thiếu mạo từ | Man is reading book. | A man is reading a book. |
| Liên từ chỉ có 1 mệnh đề | Because rain. | because it is raining |
| Dùng sai giới từ | on the bus stop | at the bus stop |
| Bỏ một trong hai từ | quên "next to" | Gạch từng từ sau khi viết |

### Lộ trình theo mức điểm Writing (0–200)
- **100–120:** thuộc khung S + is/are + V-ing + O + nơi chốn; mỗi ngày 10 câu từ ảnh bất kỳ.
- **130–150:** luyện cặp từ khó: liên từ (while, after, so that), giới từ (across from, along), bị động đơn giản.
- **160–170:** câu đúng 100% trong thời gian 1 phút/câu, không bỏ sót mạo từ và số nhiều.
- **180+:** viết nhanh, đúng, còn thời gian soát; thỉnh thoảng dùng mệnh đề quan hệ ngắn khi chắc chắn.

> Senior tip: Đây là phần "ăn điểm" dễ nhất nên đừng làm màu. Tôi luôn viết câu ngắn nhất đúng ảnh, rồi dùng thời gian thừa để soát 4 lỗi: to be, số nhiều, mạo từ, dấu chấm. Câu dài để dành cho bài luận câu 8.`,
  checklist: [
    'Xác định loại từ của cặp từ trước khi viết',
    'Dùng khung chủ ngữ + is/are + V-ing + tân ngữ + nơi chốn',
    'Câu phải đúng với nội dung bức ảnh',
    'Dùng đủ cả hai từ, được đổi dạng và thứ tự',
    'Liên từ phải đi với mệnh đề có chủ ngữ và động từ',
    'Soát to be, số nhiều, mạo từ, dấu chấm cuối câu',
  ],
  videos: [
    { title: 'TOEIC Writing Test: Full Overview & Guide for Beginners', url: 'https://www.youtube.com/watch?v=zh0E5Ky79RU', note: 'Tổng quan bài Writing cho người mới, gồm phần viết câu dựa trên ảnh và cách dùng hai từ cho sẵn.' },
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Giải đáp tiếng Việt về cấu trúc và thời gian bài Writing.' },
  ],
  related: ['toeic-w1-001', 'toeic-w1-002', 'toeic-w1-003'],
},
{
  id: 'tip-w-02',
  skill: 'writing',
  order: 2,
  title: 'Respond to a written request (Q6–7): làm đúng yêu cầu, mẫu mở và đóng e-mail',
  summary: 'Hai e-mail, mỗi câu 10 phút, thang 0–4. Điểm phụ thuộc trước hết vào việc làm đủ đúng nhiệm vụ đề giao (ví dụ 2 câu hỏi + 1 yêu cầu). Dùng bố cục chào → mở → từng nhiệm vụ một đoạn → kết lịch sự.',
  body: `**Tóm tắt:** Câu 6–7 cho bạn đọc một e-mail và yêu cầu trả lời theo nhiệm vụ cụ thể, ví dụ "ask two questions and make one request" hoặc "give two pieces of information and ask one question". Mỗi câu có 10 phút, thang **0–4**, chấm **chất lượng và sự đa dạng của câu, từ vựng, cách tổ chức**, và trên hết là bạn có **hoàn thành đủ các nhiệm vụ** hay không. Bỏ sót một nhiệm vụ là lỗi đắt nhất.

### Format và tiêu chí
| Mục | Chi tiết |
|---|---|
| Số câu | 2 (Q6, Q7) |
| Thời gian | 10 phút mỗi câu |
| Thang | 0–4 |
| Tiêu chí | quality and variety of sentences, vocabulary, organization; hoàn thành nhiệm vụ |

Độ dài hợp lý khoảng 80–150 từ: đủ để làm trọn nhiệm vụ và thể hiện câu đa dạng, không quá dài để sinh lỗi.

### Quy trình 10 phút (VÌ SAO hiệu quả)
1. **Phút 0–2: đọc nhiệm vụ TRƯỚC, rồi đọc e-mail.** Biết nhiệm vụ thì đọc e-mail có mục đích: ai gửi, vai của bạn là gì, cần trả lời về việc gì.
2. **Ghi nhanh danh sách nhiệm vụ:** Q1, Q2, R1 (question 1, question 2, request 1). Đây là checklist để đối chiếu cuối bài.
3. **Phút 2–8: viết theo khung.** Mỗi nhiệm vụ một đoạn ngắn hoặc một câu rõ ràng, có từ báo hiệu (First, I would also like to know, Could you please…).
4. **Phút 8–10: soát.** Đếm đúng số câu hỏi, số yêu cầu; kiểm tra dấu chấm hỏi, chia động từ, tên người nhận.

### Phân biệt loại nhiệm vụ
| Nhiệm vụ | Câu mẫu đúng dạng |
|---|---|
| ask a question | Could you tell me whether parking is available? |
| make a request | Please send me the updated price list by Friday. |
| give information | Our team will arrive at around 10 a.m. |
| make a suggestion | I suggest that we hold the meeting online instead. |
| explain a problem | Unfortunately, the package arrived with a damaged lid. |

Request khác question: request là đề nghị người kia **làm** gì đó; question là **hỏi** thông tin. Viết "Could you tell me…?" vừa là câu hỏi lịch sự, còn "Could you send me…?" là request. Đặt mỗi cái vào câu riêng để giám khảo đếm dễ.

### Ví dụ tự viết
E-mail nhận được: quản lý toà nhà thông báo sẽ sơn lại văn phòng vào cuối tuần sau. Nhiệm vụ: ask two questions and make one request.
~~~text
Dear Mr. Lopez,

Thank you for letting us know about the painting work planned for next weekend.

I have two questions about the schedule. First, will the work be finished by Monday morning,
or should my team prepare to work from home that day? Second, do we need to move our
computers and files away from the walls before Friday evening?

I would also like to make one request. Could you please send us the name of the paint
being used? One of my colleagues has allergies, and she would like to check it in advance.

Thank you for your help. I look forward to hearing from you.

Best regards,
Linh Nguyen
Office Coordinator
~~~
Phân tích: câu mở cảm ơn và nhắc lại chủ đề; "I have two questions" báo trước cho giám khảo; câu hỏi 1 và 2 tách bằng First/Second; request có lý do đi kèm khiến bài tự nhiên hơn; câu kết và chữ ký đầy đủ.

### Mẫu mở và đóng nên thuộc
- Mở: Thank you for your e-mail about…, I am writing in response to…, I was glad to hear that…
- Chuyển ý: I have a few questions about…, In addition, I would like to ask…, I would also appreciate it if you could…
- Đóng: Thank you in advance for your help. / I look forward to your reply. / Please let me know if you need any further information.

### Bảng lỗi hay gặp
| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Thiếu 1 câu hỏi hoặc yêu cầu | Không hoàn thành nhiệm vụ, điểm thấp | Checklist Q1, Q2, R1 |
| Viết request thành question | Giám khảo không đếm được | Câu yêu cầu dùng Please/Could you please + động từ hành động |
| Câu hỏi gián tiếp sai trật tự | Could you tell me when does it start? | Could you tell me when it starts? |
| Giọng văn quá thân mật (Hey, gonna) | Không phù hợp e-mail công việc | Dùng giọng trang trọng vừa phải |
| Nhầm vai (trả lời như người gửi) | Nội dung lệch | Đọc kỹ ai gửi cho ai |
| Quên chữ ký | Bố cục thiếu | Luôn có Best regards + tên |

### Lộ trình theo mức điểm Writing (0–200)
- **100–120:** thuộc mẫu mở/đóng, viết đủ nhiệm vụ bằng câu đơn đúng.
- **130–150:** phân biệt question/request/suggestion, dùng câu hỏi gián tiếp lịch sự.
- **160–170:** đa dạng câu (mệnh đề if, because, so that), có lý do cho mỗi yêu cầu.
- **180+:** giọng văn tự nhiên như e-mail công việc thật, không lỗi, 120–150 từ trong 8 phút.

> Senior tip: Mở đề ra là tôi ghi ngay ba ký hiệu nhiệm vụ lên giấy nháp và gạch dần khi viết xong từng cái. Ở công việc thật, e-mail trả lời thiếu một câu hỏi của khách cũng gây thêm một vòng trao đổi; trong phòng thi nó làm mất điểm nhiệm vụ, nên thói quen này có lợi cả hai nơi.`,
  checklist: [
    'Đọc nhiệm vụ trước khi đọc e-mail',
    'Ghi checklist nhiệm vụ (ví dụ Q1, Q2, R1) và gạch khi xong',
    'Phân biệt câu hỏi, yêu cầu, gợi ý, cung cấp thông tin',
    'Có câu mở cảm ơn/nhắc chủ đề và câu đóng lịch sự kèm chữ ký',
    'Kiểm tra trật tự câu hỏi gián tiếp (when it starts)',
    'Dành 2 phút cuối để soát số nhiệm vụ và lỗi ngữ pháp',
  ],
  videos: [
    { title: 'TOEIC Writing Test: Full Overview & Guide for Beginners', url: 'https://www.youtube.com/watch?v=zh0E5Ky79RU', note: 'Tổng quan Writing, xem phần trả lời e-mail để nắm cách đáp ứng đủ nhiệm vụ đề giao.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Phần Writing của khoá tổng quan: tham khảo bố cục e-mail công việc.' },
  ],
  related: ['toeic-w2-001', 'toeic-w2-002', 'toeic-w2-003'],
},
{
  id: 'tip-w-03',
  skill: 'writing',
  order: 3,
  title: 'Opinion essay (Q8): dàn ý 5 đoạn, ≥ 300 từ, từ nối và lỗi hay gặp của người Việt',
  summary: 'Câu 8 có 30 phút, thang 0–5, đề khuyến nghị tối thiểu khoảng 300 từ. Dùng dàn ý 5 đoạn (mở, 2–3 thân, kết), mỗi đoạn thân một lý do có ví dụ cụ thể, từ nối rõ ràng, dành 5 phút cuối soát lỗi.',
  body: `**Tóm tắt:** Câu 8 yêu cầu viết bài luận nêu và bảo vệ quan điểm trong 30 phút, thang **0–5**. Giám khảo xét bạn có **nêu ý kiến rõ và hỗ trợ bằng lý do, ví dụ** không, cùng với **ngữ pháp, từ vựng và cách tổ chức**. Hướng dẫn của ETS khuyến nghị bài hiệu quả thường dài tối thiểu khoảng 300 từ. Dàn ý 5 đoạn giúp bạn đạt độ dài đó mà vẫn mạch lạc.

### Format và tiêu chí
| Mục | Chi tiết |
|---|---|
| Số câu | 1 (Q8) |
| Thời gian | 30 phút |
| Thang | 0–5 |
| Tiêu chí | ý kiến được hỗ trợ bằng lý do/ví dụ; grammar; vocabulary; organization |
| Độ dài khuyến nghị | khoảng 300 từ trở lên |

### Phân bổ 30 phút (VÌ SAO hiệu quả)
| Thời gian | Việc | Lý do |
|---|---|---|
| 0–4 phút | Chọn phe, ghi 2–3 lý do + ví dụ | Có dàn ý thì không viết lạc đề hay lặp ý |
| 4–25 phút | Viết 5 đoạn | Khoảng 6–7 phút cho mỗi đoạn thân |
| 25–30 phút | Soát lỗi | Lỗi ngữ pháp lặp lại kéo điểm xuống mạnh |

### Dàn ý 5 đoạn
1. **Mở bài (40–60 từ):** câu dẫn về chủ đề → câu nêu quan điểm rõ (thesis) → báo trước các lý do.
2. **Thân 1 (70–90 từ):** câu chủ đề (lý do 1) → giải thích → ví dụ cụ thể → câu nối về quan điểm.
3. **Thân 2 (70–90 từ):** cùng cấu trúc với lý do 2.
4. **Thân 3 hoặc đoạn nhượng bộ (50–70 từ):** lý do 3, hoặc thừa nhận phía bên kia rồi phản bác.
5. **Kết (40–50 từ):** nhắc lại quan điểm bằng câu khác, tóm hai lý do.

Cấu trúc này hiệu quả vì giám khảo đọc thấy ngay ý kiến, từng lý do, từng ví dụ; "organization" gần như được bảo đảm.

### Ví dụ tự viết (trích mở bài và một đoạn thân)
Đề: Do you agree or disagree that companies should pay for employees to take online courses?
~~~text
In today's fast-changing job market, skills can become outdated within a few years.
Because of this, I strongly agree that companies should pay for employees to take online
courses. This policy helps staff improve their performance, and it also makes them more
loyal to the company.

First of all, online courses allow employees to learn new skills that they can apply
immediately. For example, a friend of mine works in customer service, and her company paid
for a short course on data analysis. After finishing it, she created a simple report that
showed which complaints were most common, and her team reduced response times. In this way,
the cost of the course returned to the company as better results.
~~~
Phân tích: câu dẫn chung → thesis rõ ("I strongly agree") → báo trước hai lý do; đoạn thân có câu chủ đề, ví dụ cá nhân cụ thể và câu kết nối về lợi ích cho công ty. Ví dụ là câu chuyện tự đặt, không dùng số liệu bịa như "studies show 80%…".

### Từ nối theo chức năng
| Chức năng | Từ nối |
|---|---|
| Thêm ý | First of all, In addition, Moreover, Furthermore |
| Ví dụ | For example, For instance, To illustrate |
| Kết quả | As a result, Therefore, Consequently |
| Đối lập | However, On the other hand, Although |
| Kết luận | In conclusion, To sum up, For these reasons |

Dùng đa dạng nhưng đúng chức năng; lạm dụng "Moreover" ở mọi câu làm bài nặng nề.

### Lỗi hay gặp của người Việt
| Lỗi | Ví dụ sai | Sửa |
|---|---|---|
| Câu thiếu động từ | Online courses very useful. | Online courses **are** very useful. |
| Chủ ngữ số ít + động từ số nhiều | Every employee need training. | Every employee **needs** training. |
| Dịch từng chữ | It makes me can learn. | It **allows me to** learn. |
| Run-on sentence nối bằng dấu phẩy | I agree, it is cheap, it is useful. | I agree because it is cheap and useful. |
| Lạm dụng "you" và giọng nói chuyện | You know, you can learn a lot. | Employees can learn a great deal. |
| Thiếu ví dụ cụ thể | Nêu lý do chung chung | Thêm một tình huống có người, việc, kết quả |
| Kết bài lặp y nguyên mở bài | Copy câu thesis | Viết lại bằng từ khác |

### Lộ trình theo mức điểm Writing (0–200)
- **100–120:** viết đủ 5 đoạn dù câu đơn giản; đạt khoảng 250 từ đúng ngữ pháp cơ bản.
- **130–150:** đủ 300 từ trong 25 phút; mỗi đoạn thân có ví dụ; dùng từ nối đúng chức năng.
- **160–170:** câu phức đa dạng (mệnh đề quan hệ, câu điều kiện, bị động), từ vựng chủ đề công việc, ít lỗi lặp lại.
- **180+:** lập luận chặt, có đoạn nhượng bộ, chuyển ý mượt, gần như không lỗi trong khoảng 320–380 từ.

> Senior tip: Hãy tự lập "danh sách lỗi của tôi" sau mỗi bài luyện (thường là 3–5 lỗi lặp lại như thiếu -s ngôi thứ ba, mạo từ, run-on). 5 phút soát cuối giờ chỉ tìm đúng những lỗi đó. Soát có mục tiêu nhanh và hiệu quả hơn đọc lại cả bài một cách chung chung.`,
  checklist: [
    'Dành 4 phút đầu lập dàn ý: phe, 2–3 lý do, ví dụ',
    'Mở bài có câu nêu quan điểm rõ ràng',
    'Mỗi đoạn thân: câu chủ đề → giải thích → ví dụ cụ thể',
    'Viết tối thiểu khoảng 300 từ trong 25 phút',
    'Dùng từ nối đúng chức năng, không lặp một từ',
    'Không bịa số liệu nghiên cứu, dùng ví dụ cá nhân',
    'Dành 5 phút cuối soát theo danh sách lỗi của bản thân',
  ],
  videos: [
    { title: 'TOEIC Writing Test: Full Overview & Guide for Beginners', url: 'https://www.youtube.com/watch?v=zh0E5Ky79RU', note: 'Tổng quan Writing, xem phần opinion essay để nắm yêu cầu độ dài và bố cục bài luận.' },
    { title: 'TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', url: 'https://www.youtube.com/watch?v=1Ss1CXZsyfY', note: 'Giải thích tiếng Việt về thang điểm và thời gian bài Writing, gồm câu 8.' },
    { title: 'TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', url: 'https://www.youtube.com/watch?v=EwS5lxyQYXk', note: 'Phần Writing của khoá tổng quan: tham khảo cách triển khai lý do và ví dụ.' },
  ],
  related: ['toeic-w3-001', 'toeic-w3-002', 'toeic-w3-003'],
}
);
