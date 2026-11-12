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
...[],
{
  id: "toeic-s1-001",
  part: "s1",
  text: "Attention, visitors: the Riverside Public Library will close at six o'clock this Friday for scheduled maintenance. Please return books to the blue drop box near the main entrance. The children's reading room on the second floor will remain open until five thirty. Regular weekend hours resume Saturday at nine a.m. We apologize for the inconvenience and thank you for your cooperation.",
  stress: ["Attention, visitors", "Riverside Public Library", "six o'clock this Friday", "blue drop box", "second floor", "five thirty", "Saturday at nine a.m.", "cooperation"],
  tips: ["Ngắt nhẹ sau lời gọi Attention, visitors để người nghe nhận ra đây là thông báo công cộng.", "Đọc rõ các mốc giờ và địa điểm; không nuốt âm cuối trong six, books và box."]
},
{
  id: "toeic-s1-002",
  part: "s1",
  text: "Planning a team event? Harbor View Conference Center is offering weekday meeting packages for just forty-eight dollars per person through October 18. Each package includes a private room, a projector, morning coffee, and a hot lunch. Groups of twenty or more receive free parking. Call Ms. Elaine Foster at 555-0146 to reserve a date, or visit harborview dot com for details.",
  stress: ["Harbor View Conference Center", "forty-eight dollars per person", "through October 18", "private room", "morning coffee", "hot lunch", "twenty or more", "Elaine Foster"],
  tips: ["Nhấn các con số, thời hạn và quyền lợi vì đó là thông tin quảng cáo người nghe cần nhớ.", "Đọc danh sách theo nhịp song song, mỗi mục cách nhau một khoảng ngắn; đọc chữ số điện thoại theo từng cụm."]
},
{
  id: "toeic-s1-003",
  part: "s1",
  text: "Hello, this is Daniel from Northstar Office Supplies. I'm calling about order 7821, which was scheduled to arrive on Tuesday, May 14. The delivery truck was delayed, so your printer paper and two desk lamps will arrive Thursday morning instead. If that time doesn't work, please call me at 555-0182 before four today. Again, this is Daniel at Northstar. Thank you.",
  stress: ["Daniel from Northstar Office Supplies", "order 7821", "Tuesday, May 14", "printer paper", "two desk lamps", "Thursday morning", "555-0182", "before four today"],
  tips: ["Với voicemail, giữ giọng thân thiện và tự nhiên như đang nói trực tiếp với khách hàng.", "Phân biệt ngày cũ Tuesday, May 14 với ngày giao mới Thursday morning; đọc từng số điện thoại rõ ràng."]
},
{
  id: "toeic-s1-004",
  part: "s1",
  text: "The Lakeside Community Health Fair welcomed more than eight hundred visitors on Saturday, organizers reported. Local clinics provided free blood pressure checks, nutrition advice, and flu shot information. Event coordinator Maria Chen said that thirty volunteers helped serve lunch and guide guests. The annual fair raised six thousand dollars for the neighborhood clinic. Organizers plan to hold next year's event on September 12.",
  stress: ["Lakeside Community Health Fair", "more than eight hundred visitors", "free blood pressure checks", "thirty volunteers", "Maria Chen", "six thousand dollars", "neighborhood clinic", "September 12"],
  tips: ["Tin ngắn thường có nhiều tên riêng và số liệu; hãy đọc chính xác nhưng không tăng tốc ở giữa câu.", "Nhấn các cụm thông tin mới như eight hundred visitors và six thousand dollars, đồng thời hạ giọng ở cuối câu trần thuật."]
},
{
  id: "toeic-s1-005",
  part: "s1",
  text: "Good afternoon, everyone. It is my pleasure to introduce our guest speaker, Dr. Olivia Grant, director of product research at Beacon Technologies. Dr. Grant has spent fifteen years helping teams design accessible software. Her recent book, Better Products for Everyone, received the 2024 Innovation Award. After her presentation, please join us in Room 310 for questions and refreshments. Please welcome Dr. Grant.",
  stress: ["Good afternoon, everyone", "guest speaker", "Dr. Olivia Grant", "Beacon Technologies", "fifteen years", "Better Products for Everyone", "2024 Innovation Award", "Room 310"],
  tips: ["Lời giới thiệu diễn giả cần trang trọng, ấm áp; nhấn tên khách mời nhưng tránh đọc như liệt kê máy móc.", "Tập phát âm rõ cụm accessible software và Innovation Award; dành một nhịp nghỉ trước câu Please welcome."]
},
{
  id: "toeic-s1-006",
  part: "s1",
  text: "Passengers for train 604 to Brookfield, please proceed to platform three. The train is expected to depart at 7:25 p.m., approximately ten minutes later than scheduled. Customers traveling to Westport should remain on board until the train reaches Central Station. For assistance with connections, speak with an agent wearing a green badge near the ticket gates. Thank you for your patience.",
  stress: ["train 604 to Brookfield", "platform three", "7:25 p.m.", "ten minutes later", "Westport", "Central Station", "green badge", "ticket gates"],
  tips: ["Thông báo nhà ga thường cần rõ và bình tĩnh; ngắt giữa hướng dẫn đi platform và thông tin trễ chuyến.", "Đọc các số hiệu, giờ và tên ga đầy đủ; tránh lẫn three với tree khi phát âm."]
},
{
  id: "toeic-s1-007",
  part: "s1",
  text: "Make your next business trip easier with a stay at the Maple Street Hotel. Book two nights before November 30 and receive a complimentary breakfast for each guest. Our downtown location is a five-minute walk from the convention center and the number 12 bus stop. Call 555-0169 to ask about group rates. Mention code TEAM24 when you make your reservation.",
  stress: ["Maple Street Hotel", "two nights", "before November 30", "complimentary breakfast", "five-minute walk", "convention center", "number 12 bus stop", "code TEAM24"],
  tips: ["Quảng cáo có nhiều lợi ích nối tiếp; nhấn từng điểm bán hàng rồi giảm nhẹ ở phần giải thích.", "Phân biệt five-minute walk với số tuyến bus 12 và đọc mã TEAM24 như một mã đặt chỗ."]
},
{
  id: "toeic-s1-008",
  part: "s1",
  text: "The City Arts Center invites you to its autumn open house this Sunday, October 20, from one to four p.m. Visitors can tour the new gallery, watch a pottery demonstration, and sign up for beginner painting classes. Admission is free, but space in the workshops is limited to fifteen people. Register at the information desk or call coordinator James Lee at 555-0127.",
  stress: ["City Arts Center", "this Sunday, October 20", "one to four p.m.", "new gallery", "pottery demonstration", "beginner painting classes", "fifteen people", "James Lee"],
  tips: ["Khi đọc danh sách hoạt động, giữ nhịp và ngữ điệu tương tự cho từng động từ: tour, watch, sign up.", "Tách thông tin miễn phí khỏi giới hạn 15 chỗ; đây là hai ý khác nhau, không nên nối thành một cụm."]
},
{
  id: "toeic-s2-001",
  part: "s2",
  scene: `Một bức ảnh chụp văn phòng sáng sủa với bàn làm việc dài ở giữa. Bên trái, một phụ nữ đeo kính đang nhìn vào màn hình máy tính và ghi chú trên giấy. Ở giữa ảnh, một đồng nghiệp nam đứng cạnh bàn, chỉ vào một biểu đồ in ra. Hai người khác ngồi phía xa, một người đang gõ máy tính xách tay. Trên bàn có cốc nước, bút và vài tập hồ sơ; phía sau là cửa sổ lớn và một chậu cây.`,
  sample: "This picture shows several people working in a bright office. A woman on the left is looking at her computer and taking notes. A man is standing beside her desk and pointing to a chart, while two coworkers are seated farther back. There are folders and a laptop on the table. They appear to be discussing a project or reviewing some results together.",
  tips: ["Mở đầu bằng bối cảnh chung rồi mô tả từ tiền cảnh đến hậu cảnh; cách này giúp câu trả lời có trật tự.", "Dùng hiện tại tiếp diễn như is pointing và are working cho hành động đang diễn ra trong ảnh."]
},
{
  id: "toeic-s2-002",
  part: "s2",
  scene: `Ảnh chụp bên trong một nhà hàng vào giờ ăn trưa. Ở tiền cảnh, một nhân viên phục vụ mặc tạp dề đang cầm sổ nhỏ và trao đổi với một khách hàng ngồi cạnh bàn. Trên bàn có hai chiếc đĩa, dao nĩa, khăn ăn và một bình nước. Một khách khác đang xem thực đơn ở bàn phía sau. Gần cửa sổ có vài bàn trống, còn một nhân viên đang bê khay đi ngang qua.`,
  sample: "This photograph was taken in a restaurant during what looks like a busy lunch period. In the foreground, a server is speaking with a customer and writing something in a small notepad. There are plates, cutlery, and a jug of water on the table. Another diner is reading a menu in the background. The staff seem to be helping customers choose their meals.",
  tips: ["Học các từ chỉ đồ dùng thường gặp như cutlery (dao nĩa) và jug (bình có quai); chỉ cần vài chi tiết tiêu biểu.", "Không khẳng định chính xác món ăn hay cảm xúc nếu ảnh không cho thấy rõ; có thể dùng looks like hoặc seem."]
},
{
  id: "toeic-s2-003",
  part: "s2",
  scene: `Một góc phố đông người vào ban ngày. Một người đi xe đạp đang dừng ở vạch sang đường, cạnh một phụ nữ đẩy xe em bé. Phía đối diện, hai nhân viên mặc áo phản quang đặt một biển báo bên lề đường. Một chiếc xe buýt đang chạy chậm phía sau họ. Các tòa nhà cửa kính và một cửa hàng nhỏ nằm dọc con phố; một vài người đi bộ đang chờ đèn giao thông.`,
  sample: "This is a busy city street. A cyclist and a woman with a stroller are waiting at a crosswalk in the foreground. Across the road, two workers wearing reflective jackets are putting up a sign. A bus is moving slowly behind them, and several pedestrians are standing near the traffic light. The workers may be directing people because some road work is taking place nearby.",
  tips: ["Dùng at a crosswalk, across the road và behind để mô tả vị trí, thay vì lặp lại here và there.", "Khi suy đoán, thêm may hoặc might; không kết luận tuyến đường bị đóng nếu ảnh chỉ có một biển báo."]
},
{
  id: "toeic-s2-004",
  part: "s2",
  scene: `Bức ảnh tại một công trường ngoài trời. Hai công nhân đội mũ bảo hộ đứng cạnh một bản vẽ lớn trải trên chiếc bàn gấp. Một người dùng bút chỉ vào bản vẽ, người còn lại đang lắng nghe và cầm máy tính bảng. Ở phía sau có cần cẩu, khung thép và một xe tải chở vật liệu. Khu vực được ngăn bằng hàng rào tạm; một người thứ ba mặc áo phản quang đang kiểm tra lối đi.`,
  sample: "This picture shows a construction site. Two workers wearing hard hats are standing around a folding table and looking at a large plan. One of them is pointing to a section of the drawing, while the other is holding a tablet. A crane and a truck can be seen in the background. They are probably checking the next stage of the project before work continues.",
  tips: ["Hard hat là mũ bảo hộ; hãy luyện cụm wearing hard hats và construction site để đọc liền mạch.", "Mô tả người và hành động trước, sau đó thêm một câu suy đoán hợp lý về mục đích của họ."]
},
{
  id: "toeic-s2-005",
  part: "s2",
  scene: `Ảnh chụp trong một cửa hàng đồ gia dụng. Một khách hàng đang đứng cạnh kệ trưng bày đèn bàn và so sánh hai sản phẩm, mỗi tay cầm một hộp nhỏ. Nhân viên cửa hàng mặc đồng phục xanh đang chỉ vào nhãn giá trên kệ. Ở phía sau là các kệ có hộp đựng và một quầy thanh toán; một người khác đang đẩy giỏ hàng qua lối đi rộng.`,
  sample: "This photo was taken in a home goods store. A customer is comparing two small boxes near a display of table lamps. A store employee in a blue uniform is pointing to a price label and explaining something. In the background, there are shelves of products and a checkout counter. The customer seems to be deciding which item to buy, and the aisle is wide enough for a shopping cart.",
  tips: ["Dùng is comparing thay vì chỉ nói looks at để diễn tả hành động cụ thể đang xảy ra.", "Các từ display, price label và checkout counter rất hữu ích khi mô tả cửa hàng; chú ý phát âm âm cuối trong counter."]
},
{
  id: "toeic-s2-006",
  part: "s2",
  scene: `Bên trong sân bay, một nhóm hành khách đang chờ gần cửa khởi hành. Một người đàn ông kéo va-li nhỏ và nhìn lên bảng điện tử treo phía trên. Một phụ nữ ngồi trên ghế đang kiểm tra giấy tờ trong túi xách; cạnh cô là một chiếc vali có thẻ hành lý. Ở quầy gần đó, nhân viên mặc đồng phục đang trao đổi với một hành khách. Qua cửa kính có thể thấy một máy bay đỗ trên sân đỗ.`,
  sample: "This scene takes place at an airport gate. A man is pulling a small suitcase and looking up at an electronic board. A woman nearby is checking some documents in her bag, and her luggage has a tag attached to it. At a counter, an employee is talking with another passenger. An airplane is visible through the windows, so the travelers may be waiting to board.",
  tips: ["Nói at an airport gate, not in an airport gate; giới từ đúng làm câu tự nhiên hơn.", "Có thể kết thúc bằng suy đoán may be waiting to board, nhưng tránh đoán điểm đến hoặc giờ bay không nhìn thấy."]
},
{
  id: "toeic-s2-007",
  part: "s2",
  scene: `Một công viên vào buổi sáng. Trên lối đi lát gạch, một người đang chạy bộ với tai nghe và đồng hồ thể thao. Gần đó, một nhân viên làm vườn cúi xuống tưới hàng hoa ven đường. Ở hậu cảnh, hai người lớn tuổi ngồi trên ghế gỗ trò chuyện, còn một người khác dắt chó đi dọc bãi cỏ. Cây cao tạo bóng mát và vài chiếc ghế trống được đặt dọc lối đi.`,
  sample: "This photograph shows a peaceful park in the morning. A person is jogging along a paved path while wearing headphones. Nearby, a gardener is watering flowers beside the walkway. Two older adults are sitting on a bench in the background, and another visitor is walking a dog. The park looks well maintained, and people seem to be enjoying different outdoor activities.",
  tips: ["Từ paved path là lối đi lát cứng; dùng nearby và in the background để chuyển vị trí rõ ràng.", "Dùng well maintained để mô tả công viên được chăm sóc tốt; luyện âm cuối của maintained và activities."]
},
{
  id: "toeic-s2-008",
  part: "s2",
  scene: `Ảnh chụp trong phòng họp công ty. Một người thuyết trình đứng cạnh màn hình lớn, trên màn hình có biểu đồ cột và tiêu đề ngắn. Bốn đồng nghiệp ngồi quanh bàn dài, một người đang giơ tay phát biểu và người khác nhìn vào máy tính xách tay. Trên bàn có sổ ghi chép, cốc cà phê và dây kết nối máy chiếu. Cửa kính phía sau cho thấy một hành lang sáng.`,
  sample: "This picture shows a business meeting in progress. A presenter is standing next to a large screen with a bar chart on it. Four colleagues are seated around a long table; one person is raising a hand, and another is looking at a laptop. There are notebooks and coffee cups on the table. They are likely discussing the information shown in the presentation.",
  tips: ["Nói a meeting in progress để cho biết cuộc họp đang diễn ra; dùng raising a hand cho người đang giơ tay.", "Không đọc từng vật nhỏ; chọn người, hành động chính và một chi tiết nền để dành thời gian cho câu hoàn chỉnh."]
},
{
  id: "toeic-s3-001",
  part: "s3",
  context: "A marketing firm is doing research on weekend shopping habits, and you have agreed to answer a few questions about yourself.",
  questions: [
    "How often do you go shopping for clothes?",
    "What kind of shops do you usually visit?",
    "Some people enjoy shopping, while others see it as a chore. Which do you prefer, and why?"
  ],
  samples: [
    "About twice a month, usually on a Saturday afternoon. I buy most of my clothes at the end of each season, when the prices drop and the sales start, so I save quite a lot of money.",
    "I mostly go to a large shopping mall near my apartment. It has several department stores and a food court, so I can finish everything in one trip and save a lot of time.",
    "I prefer shopping, as long as I am not in a hurry. Walking around a mall helps me relax after a busy week, and I often find things I was not planning to buy. My brother, on the other hand, does all his shopping online in ten minutes, so we hardly ever go together, even at the weekend, unless the weather is really bad."
  ],
  tips: [
    "Câu hỏi 1–2 chỉ có 15 giây: trả lời thẳng vào ý rồi thêm một chi tiết ngắn, đừng mở đầu bằng Well, let me think… vì sẽ mất hết thời gian.",
    "Câu thứ ba là câu so sánh, hãy dùng cấu trúc Some people prefer …, but I … và nêu một lý do cụ thể; đó là cách nhanh nhất để có đủ 60–75 từ.",
    "Cụm hay dùng: go shopping, do the shopping, window shopping (ngắm đồ mà không mua), it depends on, as long as, on the other hand."
  ],
  tags: ["shopping"]
},
{
  id: "toeic-s3-002",
  part: "s3",
  context: "A travel agency is asking its customers about their holiday plans. You are answering as a customer who has just returned from a trip.",
  questions: [
    "Where did you go on your last holiday?",
    "How did you travel there?",
    "Many people now book their trips online instead of using a travel agent. Would you recommend booking online to a friend, and why?"
  ],
  samples: [
    "I went to Da Nang with two friends last April. We stayed there for four nights in a small hotel right next to the beach, and the weather was perfect for swimming.",
    "We flew there from Ho Chi Minh City. The flight took about an hour and a half, and then we took a taxi from the airport straight to the hotel, so we arrived before lunch.",
    "Yes, I would definitely recommend it to a friend, as long as the website is well known. Booking online is usually a lot cheaper, and I can compare prices in a few minutes instead of visiting several agencies. However, my advice is to read the reviews carefully, because a cheap room online is sometimes far from the city centre and difficult to reach."
  ],
  tips: [
    "Dùng thì quá khứ đơn cho hai câu đầu: went, stayed, flew, took — người Việt hay nhầm với hiện tại hoàn thành khi kể chuyện đã kết thúc.",
    "Câu thứ ba cần nêu quan điểm rõ ràng ngay từ đầu: Yes, I would recommend it, as long as …; sau đó thêm một nhượng bộ nhỏ bằng However để câu trả lời tự nhiên hơn.",
    "Chú ý giới từ: fly to, arrive in (thành phố), stay at a hotel, next to the beach."
  ],
  tags: ["travel"]
},
{
  id: "toeic-s3-003",
  part: "s3",
  context: "A sports centre is collecting opinions from its members about a new fitness programme. You are one of the members being interviewed.",
  questions: [
    "Which sport do you play most often?",
    "How much time each week do you spend exercising?",
    "Your sports centre is planning a new running club. What would you suggest to make the club successful?"
  ],
  samples: [
    "I play badminton most often, usually twice a week with some colleagues from my office. We book a court near the office and play for about two hours on Tuesday evenings.",
    "About five hours a week, I would say. I play badminton on Tuesdays and Thursdays, and I go swimming at the weekend, normally on Sunday morning when the pool is quite quiet.",
    "I would suggest three things. First, offer sessions early in the morning and after work, because most members are busy during the day. Second, organise a short group run every Saturday so beginners do not feel alone. Finally, keep the first month's fee low to attract new members and make the club popular. I think these ideas would help the club grow quickly."
  ],
  tips: [
    "Câu thứ ba cho bạn khoảng 30 giây, nên chia rõ ba ý bằng First, Second, Finally — người chấm nghe được cấu trúc ngay cả khi bạn nói hơi nhanh.",
    "Đừng dịch từng từ từ tiếng Việt sang; học sẵn cụm: go swimming, play badminton, work out, keep fit, take part in.",
    "Lỗi hay gặp: nói spend time to exercise. Đúng là spend time exercising hoặc spend time on exercise."
  ],
  tags: ["sports"]
},
{
  id: "toeic-s3-004",
  part: "s3",
  context: "A software company is studying how people use technology at work. You are talking to a researcher about your own experience.",
  questions: [
    "What device do you use most at work?",
    "How often do you check your work messages outside office hours?",
    "Some companies are allowing employees to bring their own devices to work. What is your opinion of this idea?"
  ],
  samples: [
    "I use my work laptop for most of the day. When I am away from my desk, I use my phone to read messages and check the calendar.",
    "Usually once in the evening, just to make sure there is nothing urgent. I try not to reply after nine o'clock, unless it is a real emergency that cannot wait until the next morning.",
    "In my opinion, it can work well if the company is careful. Staff are often faster with their own devices, but the company must protect its data. I would support the idea only with a clear security policy and a limit on what can be stored on a personal phone, so that nobody loses information. I would also ask for training on the new system."
  ],
  tips: [
    "Với câu hỏi opinion, mở đầu bằng In my opinion hoặc I think … để người nghe biết ngay lập trường của bạn.",
    "Câu trả lời tốt thường có hai mặt: nêu lợi ích trước, sau đó thêm một điều kiện bằng if hoặc only if — điều này thể hiện tư duy cân bằng mà giám khảo tìm kiếm.",
    "Cụm nên dùng: work remotely, bring your own device, security policy, keep in touch with the team."
  ],
  tags: ["technology", "work"]
},
{
  id: "toeic-s3-005",
  part: "s3",
  context: "A restaurant is asking its customers for feedback on a new lunch menu. You are answering a short phone survey after eating there.",
  questions: [
    "How often do you eat lunch at restaurants?",
    "What do you usually look at when you choose a restaurant?",
    "The restaurant is thinking of adding more vegetarian dishes. What would you recommend, and why?"
  ],
  samples: [
    "Two or three times a week, usually near my office. I do not have much time at lunchtime, so I normally choose a place within walking distance and eat quickly before going back.",
    "Price and location come first for me. After that I check the online reviews, especially the comments about the service and the waiting time, because I hate waiting for a table.",
    "I think that is a good idea. I would recommend adding two or three simple dishes, such as a vegetable curry or a mushroom pasta, rather than changing the whole menu. Many people today eat less meat, and a small choice of tasty vegetarian food would bring in new customers without costing the restaurant much money. They could also label the dishes clearly on the menu."
  ],
  tips: [
    "Câu ba dài 30 giây: hãy đưa ra một lời khuyên cụ thể (thêm vài món, không đổi cả menu) kèm lý do — giám khảo thích chi tiết hơn ý chung chung.",
    "Học cụm chỉ đồ ăn: main course, side dish, vegetarian, mild and spicy, set menu; tránh nói food is delicious cho mọi món.",
    "Nói về giá dùng reasonable và affordable, đừng dùng cheap vì cheap có thể mang nghĩa chê bai."
  ],
  tags: ["food"]
},
{
  id: "toeic-s3-006",
  part: "s3",
  context: "A manager is asking employees about working from home. You are talking to a colleague who is collecting opinions for the report.",
  questions: [
    "How many days a week do you work from home?",
    "What do you like most about working from home?",
    "Some managers believe that teams work better when everyone is in the office together. How would you respond to that view?"
  ],
  samples: [
    "Two days a week, usually Tuesday and Friday. My team comes to the office on the other three days, so we still meet face to face regularly and talk about our work.",
    "The time I save on travelling is the best part. I spend almost an hour and a half on the road every day, so working from home gives me time to exercise.",
    "I understand the point, but I do not fully agree. In my team, we keep a short online meeting every morning, so we still know what everyone is doing and we can ask questions immediately. In fact, our last report was finished on time, and nobody complained about the result. I think what matters is clear communication and trust, not where people sit."
  ],
  tips: [
    "Câu ba là câu phản biện: hãy công nhận ý người khác trước (I understand the point, but …) rồi mới đưa lý do — cách này lịch sự và chuyên nghiệp hơn nói thẳng I disagree.",
    "Dùng I do not fully agree thay vì I do not agree; sắc thái mềm hơn và tự nhiên hơn trong tiếng Anh công sở.",
    "Chuẩn bị sẵn từ vựng: commute (đi lại), flexible working hours, stay focused, fewer distractions."
  ],
  tags: ["remote work"]
},
{
  id: "toeic-s4-001",
  part: "s4",
  info: `Grandview Hotel — Spring Marketing Workshop
Date: Thursday, April 18
Registration: 8:30 a.m. | Workshop: 9:00 a.m. to 12:30 p.m.
Location: Conference Room B, second floor

Agenda
9:00  Opening remarks — Ms. Laura Kim, Marketing Director
9:20  Session 1: Understanding your customers
10:30  Coffee break
10:50  Session 2: Social media on a small budget
12:00  Questions and answers
12:30 Lunch is provided in the Garden Room

Please bring your name badge. Parking is free for participants.`,
  questions: [
    "What time does the workshop begin?",
    "Where will the lunch take place?",
    "Please tell me the time and the topic of each session, and the length of the coffee break."
  ],
  samples: [
    "The workshop begins at nine o'clock in the morning. Registration opens half an hour earlier, at half past eight, and it takes only a few minutes to finish.",
    "Lunch will be served in the Garden Room. It starts at half past twelve, right after the question and answer session ends at twelve thirty, so nobody has to wait for a table.",
    "There are two sessions. The first one is at twenty past nine and it is about understanding your customers. The second one is at ten to eleven, and it covers social media on a small budget. The coffee break is twenty minutes long, from half past ten to ten to eleven, which is enough for a quick cup of coffee as well."
  ],
  tips: [
    "Trước khi trả lời, gạch chân đúng ba thông tin giám khảo hỏi: giờ, địa điểm, tên topic — đừng đọc lại cả bảng.",
    "Câu ba phải gồm đủ các mục: giờ + chủ đề của từng session, và độ dài giờ nghỉ; nói theo thứ tự thời gian để người nghe dễ theo dõi.",
    "Luyện đọc số giờ kiểu Anh: 9:20 là twenty past nine, 10:50 là ten to eleven; và phân biệt half past eight với half past twelve."
  ],
  tags: ["conference"]
},
{
  id: "toeic-s4-002",
  part: "s4",
  info: `Northbridge Company — Job Interview Schedule
Candidate: Mr. Daniel Pham
Position: Backend Developer

10:00 a.m.  Welcome and company introduction (HR, Meeting Room 1)
10:20 a.m.  Technical interview (Mr. Robert Hayes, Technical Lead)
11:15 a.m.  Written test (45 minutes, Computer Lab 2)
12:00 p.m.  Lunch with the team (staff cafeteria)
1:00 p.m.   Meeting with the Engineering Manager

Please bring a passport or ID card and a copy of your CV.`,
  questions: [
    "Who will the candidate meet at ten twenty?",
    "Where will he take the written test?",
    "Please tell me what time each part of the interview starts and ends, and where each one takes place."
  ],
  samples: [
    "At twenty past ten he will meet Mr. Robert Hayes, the technical lead. They have a technical interview together, and it starts right after the short welcome session ends at ten o'clock.",
    "In Computer Lab 2. The test lasts forty-five minutes, and he should bring his passport or ID card with him, as well as a copy of his CV.",
    "The day starts at ten with a welcome session in Meeting Room 1. The technical interview begins at twenty past ten, also with the technical lead. At a quarter past eleven he moves to Computer Lab 2 for the written test, which finishes at noon. After that there is lunch in the staff cafeteria, and at one o'clock he meets the engineering manager."
  ],
  tips: [
    "Câu ba cần liên kết các mốc giờ bằng after that và at …; đây là cách nối tự nhiên thay vì chỉ liệt kê giờ rời rạc.",
    "Học cách nói 11:15: a quarter past eleven; 12:00: twelve o'clock hoặc noon; 1:00 p.m.: one o'clock in the afternoon.",
    "Khi được hỏi where, trả lời địa điểm cụ thể (phòng, tầng) chứ không chỉ nói in the building."
  ],
  tags: ["interview"]
},
{
  id: "toeic-s4-003",
  part: "s4",
  info: `Harbour City Walking Tour — Saturday Programme
Meeting point: City Hall main entrance, 8:45 a.m.
Tour starts: 9:00 a.m. sharp

9:00 – 10:00  Old Market and the riverside bridge
10:15 – 11:30  City Museum (guided visit, 75 minutes)
11:30 – 12:30  Free time for lunch (not included)
12:30 – 1:30  Central Park and the clock tower
1:30            Tour ends at the souvenir shop

Tour guide: Mr. Henry Cole | Group size: 10 to 15 people`,
  questions: [
    "When should we arrive at the meeting point?",
    "How long can we spend at the museum?",
    "Could you tell me the times and places of each stop, and what the tour includes?"
  ],
  samples: [
    "You should arrive at a quarter to nine, which is fifteen minutes before the tour starts. The tour leaves from the main entrance at nine o'clock sharp, so please do not be late.",
    "You can spend seventy-five minutes there, from a quarter past ten to half past eleven. The guide will show you the main rooms, so you should have enough time for the whole visit.",
    "The tour has four parts. It begins at the Old Market and the riverside bridge, and then we visit the City Museum for an hour and a quarter. After that you have an hour of free time for lunch, which is not included in the price. The last stop is Central Park and the clock tower, and the tour finishes at the souvenir shop at half past one."
  ],
  tips: [
    "Câu ba nên giới thiệu tổng số phần của chuyến đi trước (The tour has four parts) rồi mới kể từng cái — người nghe nắm bố cục ngay.",
    "Chú ý phân biệt included và not included; trong tình huống du lịch, nói rõ cái gì không bao gồm là điểm cộng lớn.",
    "Luyện cụm chỉ thời lượng: for an hour and a quarter, an hour and a half, forty-five minutes; và cụm meet at, leave at, end at."
  ],
  tags: ["tourism"]
},
{
  id: "toeic-s4-004",
  part: "s4",
  info: `Staff Training Programme — First Week
Monday, 3 June
9:00 – 10:30  New employee handbook (Room 105, trainer: Ms. Anne Lee)
11:00 – 12:00 IT systems and email setup (Computer Lab 1)

Tuesday, 4 June
9:00 – 12:00  Health and safety rules (Main Hall)
1:30 – 3:00 p.m.  Customer service standards (Room 210)

Wednesday, 5 June
9:00 – 11:00  Team meeting with your manager
11:15 – 12:00  Final quiz (20 questions, pass mark 80%)
Training ends at 12:00.`,
  questions: [
    "What time does the training start on the first day?",
    "Which room will the participants use for the customer service session?",
    "Please tell me the time and topic of each training session, and when the training ends."
  ],
  samples: [
    "On the first day it starts at nine o'clock in the morning, with the new employee handbook. The trainer is Ms. Anne Lee, and the room is Room 105.",
    "They will use Room 210 for that session. It is on Tuesday afternoon, from half past one to three o'clock, and it is about the customer service standards.",
    "The training begins on Monday at nine with the employee handbook, and at eleven the participants move to the computer lab to set up the IT systems. On Tuesday morning they learn the health and safety rules in the main hall, and in the afternoon they study customer service standards. On the last day there is a team meeting at nine and a final quiz at a quarter past eleven. The training ends at twelve."
  ],
  tips: [
    "Khi có nhiều ngày, hãy mở đầu bằng ngày (On Monday, On Tuesday, On the last day) rồi mới nói giờ và nội dung — đây là cách giữ mạch cho cả người nói và người nghe.",
    "Câu ba dài 30 giây nên chọn những ý chính; không cần đọc lại mọi chi tiết, chỉ cần giờ, chủ đề và thời điểm kết thúc.",
    "Từ vựng hay gặp: handbook, session, trainer, sign up for a course, pass mark, quiz."
  ],
  tags: ["training"]
},
{
  id: "toeic-s4-005",
  part: "s4",
  info: `Bright Print Shop — Price List (per 100 copies)
Black and white A4 pages        $8.00
Colour A4 pages                 $25.00
A3 posters                      $40.00
Binding (per copy)              $1.50

Delivery: free within the city, next working day
Large orders (over 500 copies): 10% discount
Rush service (same day): extra $15.00`,
  questions: [
    "How much do a hundred colour pages cost?",
    "When can we receive our order if we live in the city?",
    "Could you tell me the prices of the main services, and explain the delivery and discount options?"
  ],
  samples: [
    "A hundred colour A4 pages cost twenty-five dollars. If you order more than five hundred copies, you get a ten percent discount on that price, which is a good deal for us.",
    "You can receive it on the next working day, and delivery inside the city is free. If you need it on the same day, there is a rush service.",
    "Black and white A4 pages are eight dollars per hundred, and colour pages are twenty-five. Posters in A3 size cost forty dollars, and binding is one dollar fifty for each copy. Delivery is free in the city and arrives the next working day, while orders over five hundred copies get a ten percent discount, which is worth considering for a big order."
  ],
  tips: [
    "Câu ba nên dùng cấu trúc so sánh: cheaper than, twice as much as, per hundred — nhờ đó người nghe hiểu được chênh lệch giá mà không cần nhớ từng con số.",
    "Đọc số tiền rõ ràng: twenty-five dollars, one dollar fifty, ten percent; đừng đọc kiểu Việt hoá twenty-five đô.",
    "Cụm hữu ích: per copy, per hundred, price list, delivery charge, bulk order, discount on large orders."
  ],
  tags: ["price list", "shopping"]
},
{
  id: "toeic-s4-006",
  part: "s4",
  info: `Online Meeting Instructions — Project Update
Date: Monday, 20 May | Time: 2:00 to 3:00 p.m. (Vietnam time)

Who should attend: team leaders and project members
Platform: video call link sent by email one day before
Agenda: progress report, budget review, next steps

Before the meeting
- Send your weekly report to the project manager by Friday, 5:00 p.m.
- Test your camera and microphone 10 minutes early
During the meeting
- Mute your microphone when you are not speaking
- Use the chat for questions
The minutes will be sent by email on Wednesday.`,
  questions: [
    "When exactly will the meeting take place?",
    "What should participants send to the project manager, and by when?",
    "Please tell me what the participants must do before the meeting, and the rules they should follow during it."
  ],
  samples: [
    "The meeting is on Monday, the twentieth of May, from two to three in the afternoon, Vietnam time. The video call link will be sent to everyone by email one day before.",
    "They should send their weekly report to the project manager by five o'clock on Friday afternoon. After that, they have the weekend to prepare, so nobody should leave it until Monday morning.",
    "Before the meeting, each person must send the weekly report on Friday, and they should also test the camera and microphone ten minutes early. During the meeting, they must mute the microphone when they are not speaking, and use the chat to ask questions instead of interrupting. The minutes will be sent to everyone by email on Wednesday, so that the team can follow up."
  ],
  tips: [
    "Câu hỏi dạng tóm tắt nhiều mục: hãy nhóm theo thời gian — before the meeting, during the meeting — rồi mới thêm chi tiết; cách này giúp bạn không bỏ sót ý.",
    "Luyện các động từ chỉ yêu cầu: must, should, have to, be supposed to; đừng dùng must cho lời khuyên nhẹ.",
    "Từ vựng họp trực tuyến: mute, unmute, chat box, agenda, minutes (biên bản họp), attendee, host."
  ],
  tags: ["meeting", "remote work"]
},
);
