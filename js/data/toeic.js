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
{
  id: "toeic-s5-001",
  part: "s5",
  prompt: "Some companies allow employees to work from home several days a week. Do you think this is a good policy? Give reasons and examples.",
  sample: `I believe working from home several days a week is a good policy for many employees. First, it saves commuting time. For example, a worker who spends an hour traveling each way can use that time to rest or prepare for the day. Second, people may focus better when they have a quiet place to work. At my previous company, our team completed reports more quickly on home-working days because there were fewer interruptions. Of course, remote work can make communication harder, so companies should set clear goals and arrange regular online meetings. Employees should also come to the office when a project needs close teamwork. Overall, a flexible schedule can improve both productivity and job satisfaction, as long as managers stay in touch with their teams.`,
  tips: [
    "Mở đầu bằng I believe… rồi nêu hai lý do riêng biệt; mỗi lý do nên có một ví dụ cụ thể thay vì chỉ lặp lại ý kiến.",
    "Dùng First và Second để người nghe theo kịp bố cục; phát âm rõ âm cuối trong saves, goals và teams.",
    "Đừng khẳng định làm ở nhà luôn tốt hơn; thêm một điều kiện như as long as để câu trả lời cân bằng và thực tế."
  ],
  tags: ["remote work", "workplace"]
},
{
  id: "toeic-s5-002",
  part: "s5",
  prompt: "Some people think companies should provide regular training for their employees. Do you agree or disagree? Explain your opinion with reasons and examples.",
  sample: `I agree that companies should provide regular training for their employees. To begin with, training helps people keep up with changes in their jobs. For instance, when our office introduced a new scheduling system, a short workshop helped everyone use it correctly and avoid mistakes. In addition, training can make employees feel more confident and motivated. They can learn a useful skill instead of having to solve every problem by trial and error. The sessions do not have to be expensive or take a whole day; a monthly online lesson or a short discussion with an experienced coworker can be enough. In conclusion, regular training benefits both the employee and the company because people work more effectively and are better prepared for new responsibilities.`,
  tips: [
    "Với câu hỏi agree/disagree, nói rõ lập trường ngay câu đầu để giám khảo không phải đoán ý.",
    "Học cụm To begin with và In addition để chuyển giữa hai lý do; sau mỗi lý do hãy đưa ví dụ có tình huống cụ thể.",
    "Không cần dùng từ vựng quá khó; dùng đúng động từ như introduce a system, attend a workshop và take responsibility sẽ tự nhiên hơn."
  ],
  tags: ["training", "career"]
},
{
  id: "toeic-s5-003",
  part: "s5",
  prompt: "Do you think using new technology at work usually makes employees more productive? Support your answer with reasons and examples.",
  sample: `In my opinion, new technology can make employees more productive when it solves a real problem. For example, my team started using a shared project board to track tasks. Before that, we exchanged many messages just to find out who was responsible for each step. Now everyone can see the owner and deadline in one place, so we spend less time checking progress. Technology can also automate repetitive work, giving employees more time to help customers or solve difficult issues. However, a new tool is not useful simply because it is modern. If it is confusing or does not work with existing systems, people may waste time learning it. Companies should provide basic training and ask employees for feedback. Overall, the right technology improves work, but good planning matters too.`,
  tips: [
    "Cụm when it solves a real problem giúp câu trả lời không tuyệt đối hoá công nghệ; hãy nêu một vấn đề trước và kết quả sau.",
    "Dùng before that/now để mô tả sự thay đổi rõ ràng, nhưng tránh phát âm lẫn productive và productivity.",
    "Kết bài bằng một điều kiện ngắn như good planning matters too để thể hiện cân nhắc cả mặt lợi và hạn chế."
  ],
  tags: ["technology", "productivity"]
},
{
  id: "toeic-s5-004",
  part: "s5",
  prompt: "Some people believe businesses should do more to reduce their impact on the environment, even if it increases costs. What is your opinion?",
  sample: `I believe businesses should take practical steps to reduce their impact on the environment, even if some costs increase at first. One reason is that reducing waste can save money over time. For example, an office that uses less paper and turns off unused equipment can lower its monthly expenses. Another reason is that customers increasingly care about how products are made. A company that explains its environmental efforts honestly may earn their trust and encourage them to return. However, businesses should choose changes that are measurable rather than making promises they cannot keep. They could start by tracking energy use and setting a realistic target for the next year. In short, protecting the environment is a responsibility, and sensible improvements can also support a company's long-term success.`,
  tips: [
    "Nêu cả lợi ích môi trường và một lợi ích thực tế cho doanh nghiệp để lập luận thuyết phục, không chỉ nói it is good.",
    "Dùng at first và over time để diễn tả chi phí ban đầu có thể khác với kết quả dài hạn.",
    "Phân biệt environment (môi trường) và environmental (thuộc về môi trường); chú ý âm tiết cuối khi nói environmental efforts."
  ],
  tags: ["environment", "business"]
},
{
  id: "toeic-s5-005",
  part: "s5",
  prompt: "Should schools spend more time teaching practical skills, such as communication and money management? Give reasons and examples.",
  sample: `I think schools should spend more time teaching practical skills alongside academic subjects. First, communication is important in almost every job. Students who practice explaining their ideas and listening to others may work better in a team later. For example, a class presentation can teach them how to organize information and answer questions politely. Second, basic money management helps young people make responsible choices. They should understand how to plan a budget and compare prices before they start earning their own income. These lessons do not need to replace subjects such as math or science; teachers can include practical examples in existing classes. To sum up, schools prepare students for adult life, and practical skills make that preparation more complete.`,
  tips: [
    "Dùng alongside để nói kỹ năng thực tế bổ sung chứ không thay thế môn học; điều này làm quan điểm cân bằng hơn.",
    "Nêu ví dụ học đường dễ hình dung như class presentation hoặc plan a budget, thay vì ví dụ quá dài.",
    "Ở câu kết, diễn đạt lại ý chính bằng từ khác; không cần lặp nguyên văn câu mở đầu."
  ],
  tags: ["education", "life skills"]
},
{
  id: "toeic-s5-006",
  part: "s5",
  prompt: "Do you think managers should ask employees for their opinions before making important decisions? Explain your view.",
  sample: `I think managers should ask employees for their opinions before making important decisions that affect their daily work. Employees often understand practical problems that may not be visible to senior leaders. For example, when my department changed its customer service process, the staff suggested moving one step to an earlier stage. This small change reduced repeated calls and made the process easier to follow. Asking for feedback can also help employees feel respected and more willing to support a decision. Still, managers cannot follow every suggestion, especially when there is a tight deadline. They should explain the final choice and the reasons behind it. In conclusion, listening to employees leads to better decisions, even though managers remain responsible for making the final call.`,
  tips: [
    "Dùng who may not be visible to… để giải thích vì sao nhân viên trực tiếp có thông tin hữu ích, thay vì chỉ nói they know more.",
    "Cụm Still và even though giúp thừa nhận giới hạn hợp lý mà không làm mất lập trường.",
    "Kể ví dụ theo thứ tự vấn đề → đề xuất → kết quả; dùng reduced repeated calls để nêu tác động cụ thể."
  ],
  tags: ["management", "teamwork"]
},
{
  id: "toeic-s5-007",
  part: "s5",
  prompt: "For work meetings, do you prefer meeting in person or meeting online? Give reasons and examples to support your preference.",
  sample: `I prefer meeting in person when a team needs to discuss a complicated issue. It is easier to notice whether people are confused, and team members can ask quick questions without waiting for someone to unmute. For example, my coworkers and I once planned a new service in a face-to-face workshop. We drew the steps on a whiteboard and agreed on the main tasks in about an hour. However, online meetings are more convenient when people only need to share a short update, especially if they work in different cities. Therefore, I do not think every meeting should be in person. My preference depends on the purpose: I choose a face-to-face discussion for planning, but an online call for a simple check-in.`,
  tips: [
    "Khi chọn một trong hai phương án, vẫn có thể thừa nhận phương án kia hữu ích trong trường hợp khác; nêu rõ điều kiện lựa chọn.",
    "Dùng for example để kể một trải nghiệm, và therefore để nối ví dụ với kết luận.",
    "Phân biệt meeting in person (gặp trực tiếp) với online meeting; đừng nói meet physically trong ngữ cảnh này."
  ],
  tags: ["meetings", "communication"]
},
{
  id: "toeic-s5-008",
  part: "s5",
  prompt: "Some employees spend their personal time learning skills for their careers. Do you think this is a good use of their free time?",
  sample: `I think learning a career-related skill in your free time can be worthwhile, as long as it does not leave you exhausted. Many fields change quickly, so learning a new tool can help employees take on different tasks. For example, a colleague of mine spent a few weekends studying spreadsheet skills and later used them to prepare reports more efficiently. This kind of learning can also build confidence because people see that they are able to improve. On the other hand, free time is important for rest and family, so employees should not feel that they must study every evening. A short, realistic plan is more sustainable than trying to learn everything at once. Overall, professional learning is valuable when people balance it with their well-being.`,
  tips: [
    "Dùng as long as để đưa điều kiện cân bằng; câu trả lời không nên biến việc học thêm thành nghĩa vụ phải làm mọi tối.",
    "Cụm take on different tasks và prepare reports more efficiently phù hợp tiếng Anh công sở và dễ tái sử dụng.",
    "Nêu ví dụ cá nhân ngắn, có kết quả cụ thể; tránh khẳng định một trải nghiệm chứng minh điều đó đúng với tất cả mọi người."
  ],
  tags: ["career", "learning"]
},
{
  id: "toeic-s5-009",
  part: "s5",
  prompt: "Would you prefer a flexible work schedule or fixed working hours? Explain your choice with reasons and examples.",
  sample: `I would prefer a flexible work schedule because it helps people plan their work around important responsibilities. For instance, an employee may start earlier to pick up a child in the afternoon, while still completing the same number of working hours. Flexibility can also help people avoid the busiest commuting times and arrive at work with more energy. However, a flexible schedule only works well when coworkers agree on times to communicate and attend important meetings. At my last job, our team had shared hours from ten to three, so everyone could arrange the rest of the day differently but still work together. In my view, clear expectations and fair results matter more than having every employee follow exactly the same timetable.`,
  tips: [
    "Nêu lựa chọn bằng I would prefer… và giải thích bằng ví dụ; dùng may để nói một tình huống có thể xảy ra.",
    "Dùng while still completing để cho thấy linh hoạt về giờ không đồng nghĩa giảm trách nhiệm.",
    "Học cụm shared hours (khung giờ cả nhóm cùng sẵn sàng) và commuting times; nói rõ điều kiện để lịch linh hoạt vận hành."
  ],
  tags: ["flexible schedule", "workplace"]
},
{
  id: "toeic-s5-010",
  part: "s5",
  prompt: "Do you think companies should use automated technology to answer simple customer questions? Why or why not?",
  sample: `I think companies can use automated technology to answer simple customer questions, but customers should be able to contact a person when they need more help. An automated system can quickly provide basic information, such as store hours or delivery status. This is convenient because customers do not have to wait for an employee to become available. It can also allow staff to spend more time solving unusual or complicated problems. However, an automated response may frustrate someone whose situation does not fit the standard choices. For example, a delayed order might need a personal explanation or a different solution. Companies should make the system easy to use and offer a clear way to speak with an employee. This balance can improve service without making it feel impersonal.`,
  tips: [
    "Mở đầu bằng quan điểm có điều kiện: automation hữu ích cho câu hỏi đơn giản, nhưng vẫn cần người xử lý tình huống đặc biệt.",
    "Dùng such as để đưa ví dụ ngắn; phân biệt basic information với complicated problems.",
    "Kết bài bằng hệ quả cho khách hàng, không chỉ nói công ty tiết kiệm thời gian; luyện nói rõ automated và impersonal."
  ],
  tags: ["technology", "customer service"]
},
{
  id: "toeic-w1-001",
  part: "w1",
  scene: `Trong kho hàng sáng sớm, một nhân viên đeo áo phao phản quang đang mang một chiếc hộp lớn đi theo lối đi giữa các kệ hàng hóa. Một tay cầm hộp, tay kia cuộn lại một cuộn băng keo dán trên kệ.`,
  words: ["carry", "box"],
  sample: "A warehouse worker is carrying a heavy box through the storage area.",
  tips: ["Carry nghĩa là mang hoặc vận chuyển; ở đây chia thành is carrying vì hành động đang diễn ra trong ảnh.", "Through (qua) dùng để chỉ di chuyển trong một khoảng không gian, chẳng hạn lối đi giữa các kệ hàng."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-002",
  part: "w1",
  scene: `Trong văn phòng sáng sủa, một phụ nữ đang ngồi trên ghế văn phòng ngay bên cạnh cửa sổ lớn, cuốn một cuốn sách trong tay. Trên bàn trước cô có máy tính xách tay và một cốc cà phê.`,
  words: ["next to", "window"],
  sample: "A woman is sitting next to the window and reading a book at her desk.",
  tips: ["Next to nghĩa là 'bên cạnh', dùng để chỉ vị trí của người hoặc vật so với một đối tượng khác.", "Is sitting + V-ing mô tả hai hành động kèm nhau đang xảy ra trong khoảnh khắc chụp ảnh."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-003",
  part: "w1",
  scene: `Một nhóm đồng nghiệp đang hội họp quanh bàn làm việc, thảo luận các bộ tài liệu đang sprawl trên bề mặt bàn. Một người đang chỉ vào bảng biểu in trên một tờ giấy lớn.`,
  words: ["discuss", "documents"],
  sample: "Several colleagues are discussing documents around a meeting table.",
  tips: ["Discuss (thảo luận) là động từ trực tiếp, không cần thêm about sau nó: nói discuss documents chứ không phải discuss about documents.", "Is discussing là thì hiện tại tiếp diễn, phù hợp cho ảnh đang diễn ra."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-004",
  part: "w1",
  scene: `Một công viên vào thứ bảy buổi sáng, nhưng trời đang mưa to nên rất ít người dạo bước. Một vài người đang ngồi dưới máng che mưa trên ghế công viên, cầm áo ô trong tay.`,
  words: ["because", "rain"],
  sample: "Few people are walking in the park because it is raining.",
  tips: ["Because (bởi vì) nối phần lí do vào sau kết quả chính của câu; trong ví dụ, mưa là lý do ít người đi dạo.", "It is raining là cách nói về thời tiết mưa, không cần có chủ ngữ cụ thể nào."],
  tags: ["daily life"]
},
{
  id: "toeic-w1-005",
  part: "w1",
  scene: `Bên trong ga tàu, các hành khách đang đứng và ngồi trên sân plataform chờ chuyến tàu. Một chiếc vali lớn đặt cạnh một phụ nữ đang nhìn lên bảng thông tin lịch trình treo trên tường.`,
  words: ["wait", "train"],
  sample: "Passengers are waiting for a train on the platform.",
  tips: ["Wait for (chờ đợi ai hay cái gì) luôn đi kèm giới từ for, không được bỏ for.", "Platform là sân đón trong ga tàu hoặc sân bay, nơi hành khách chờ phương tiện."],
  tags: ["travel"]
},
{
  id: "toeic-w1-006",
  part: "w1",
  scene: `Trong phòng hội nghị, nhân viên đang dịch chuyển các bàn ghế gần nhau hơn để mọi người đều có thể nhìn thấy màn hình chiếu đầu phòng. Một người đang điều chỉnh máy chiếu gắn trên trần nhà.`,
  words: ["so that", "see"],
  sample: "They moved the tables closer together so that everyone can see the presentation screen.",
  tips: ["So that (để) dùng để chỉ mục đích của một hành động, sau đó phải đi một mệnh đề đầy đủ có chủ ngữ và động từ.", "Can see (có thể thấy) thể hiện khả năng nhìn thấy nhờ bàn ghế được sắp xếp lại."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-007",
  part: "w1",
  scene: `Trong một cửa hàng quần áo, ba nhân viên bán hàng mặc đồng phục màu xanh đang hướng dẫn khách hàng chọn sản phẩm. Các kệ hàng được sắp xếp ngăn nắp ở hai bên lối đi rộng.`,
  words: ["wear", "uniform"],
  sample: "Store employees wearing blue uniforms are helping customers find items.",
  tips: ["Wearing blue uniforms là cụm định ngữ dùng V-ing để mô tả người đang mặc gì trong ảnh.", "Help customers find items — động từ help sau đó có thể dùng nguyên thể infinitive không cần to (find thay vì to find)."],
  tags: ["shopping"]
},
{
  id: "toeic-w1-008",
  part: "w1",
  scene: `Trong phòng hội nghị công ty, sáu đồng nghiệp đang nhìn lên một màn hình lớn treo trên tường, trên màn hình đang hiển thị bảng biểu doanh thu. Một người đang chỉ vào màn hình bằng bút chỉ điểm.`,
  words: ["look at", "screen"],
  sample: "The team is looking at a large screen mounted on the conference-room wall.",
  tips: ["Look at (nhìn vào) dùng khi người ta tập trung nhìn vào một đối tượng, khác với watch (xem sự kiện diễn biến theo thời gian).", "Mounted on (được gắn trên) là cụm hình容 quá khứ dùng như tính từ để mô tả màn hình được cố định trên tường."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-009",
  part: "w1",
  scene: `Trong một quán cà phê vào giờ cao điểm, hàng khách đang xếp hàng chờ thanh toán tại quầy. Một nhân viên đang pha đồ uống phía sau quầy, và các ly cà phê được sắp xếp trên kệ bên cạnh.`,
  words: ["stand", "line"],
  sample: "Customers are standing in line at the coffee shop counter.",
  tips: ["Stand in line (xếp hàng) là cụm cố định rất hay xuất hiện trong ngữ cảnh mua sắm và dịch vụ.", "Counter là quầy thanh toán hoặc phục vụ trong nhà hàng, quán cà phê và khách sạn."],
  tags: ["daily life"]
},
{
  id: "toeic-w1-010",
  part: "w1",
  scene: `Một nhân viên bảo vệ đang đứng ngay bên cổng vào tòa văn phòng, đang mở cửa cho các nhân viên đi vào làm việc vào sáng sớm. Một người đang đi vào cầm theo một chiếc túi xách.`,
  words: ["open", "door"],
  sample: "A security guard is opening the door for workers entering the office building.",
  tips: ["Open the door for somebody (mở cửa cho ai) thể hiện sự lịch sự và hỗ trợ người khác vào hoặc ra một không gian.", "Entering là dạng V-ing của enter, dùng sau giới từ for trong ví dụ này."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-011",
  part: "w1",
  scene: `Một tài xế giao hàng đang lái một chiếc xe tải lớn vào cửa vào của kho hàng vào thời điểm sớm sáng. Xe tải đang chở nhiều hàng hóa đóng kiện phía sau cabin.`,
  words: ["drive", "truck"],
  sample: "A delivery driver is driving a truck toward the warehouse entrance.",
  tips: ["Drive (lái xe) ở đây chia thành is driving vì hành động đang diễn ra trong ảnh; không được thay bằng từ đồng nghĩa như park.", "Truck là xe tải; delivery truck là xe giao hàng dùng trong thương mại và logistics."],
  tags: ["transportation"]
},
{
  id: "toeic-w1-012",
  part: "w1",
  scene: `Nhân viên văn phòng đang ăn trưa cùng nhau trên một bàn ngoài trời sau tòa nhà công ty. Trên bàn có các hộp thức ăn và chai nước uống, mọi người vui vẻ chuyện chuyện.`,
  words: ["eat", "lunch"],
  sample: "Coworkers are eating lunch together at an outdoor table near the office.",
  tips: ["Eat lunch (ăn trưa) là cụm động từ thường dùng trong ngữ cảnh làm việc; có thể dùng have lunch thay thế với nghĩa tương tự.", "Coworkers là đồng nghiệp làm cùng một công ty hoặc phòng ban."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-013",
  part: "w1",
  scene: `Một nhân viên kho đang xếp các hộp vừa đóng gói lên kệ trong kho hàng. Ít số kệ khác đã đầy hàng hóa, còn vài kệ còn trống chờ đặt hàng mới.`,
  words: ["put", "shelf"],
  sample: "A staff member is putting boxes on a shelf in the storage room.",
  tips: ["Put something on a shelf (đặt thứ gì đó lên kệ) — từ put cho sẵn chia thành putting sau động từ is trong thì hiện tại tiếp diễn.", "Storage room là phòng kho, nơi lưu giữ hàng hóa và vật dụng văn phòng của một công ty."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-014",
  part: "w1",
  scene: `Trong một xưởng sản xuất, một kỹ sư đang sửa chữa một chiếc máy in lớn. Bộ công cụ đang đeo trên eo anh ta, và một trợ lý đang quan sát từ một khoảng cách.`,
  words: ["repair", "machine"],
  sample: "A technician is repairing a large machine inside the factory.",
  tips: ["Repair (sửa chữa) dùng cho máy móc hoặc thiết bị hỏng hóc; dạng chia là repairing sau động từ is.", "Machine là máy móc, thiết bị; factory là nhà máy hoặc xưởng sản xuất."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-015",
  part: "w1",
  scene: `Công viên vào thứ bảy buổi nắng, nhiều người đang dắt chó đi dạo trên lối đi bên bờ hồ, còn trẻ con đang chơi bóng trên bãi cỏ gần đó.`,
  words: ["walk", "dog"],
  sample: "People are walking their dogs in the park on a sunny Saturday morning.",
  tips: ["Walk your dog (dắt chó đi dạo) là cụm cố định; walking sau People are là thì hiện tại tiếp diễn mô tả ảnh đang diễn ra.", "Park là công viên, nơi mọi người tập thể dục, dắt chó và giải trí ngoài trời."],
  tags: ["daily life"]
},
{
  id: "toeic-w1-016",
  part: "w1",
  scene: `Một người đàn ông đang đứng gần thang máy trong tòa văn phòng, đang đàm thoại qua điện thoại di động. Anh ta mặc vest và cầm một chiếc vali nhỏ trong tay bên cạnh.`,
  words: ["talk", "phone"],
  sample: "A man is talking on his phone while standing near the elevator.",
  tips: ["Talk on the phone (nói điện thoại) luôn dùng giới từ on trước phone, không dùng 'in the phone'.", "Elevator là thang máy, thường thấy trong tòa nhà văn phòng có nhiều tầng."],
  tags: ["workplace"]
},
{
  id: "toeic-w1-017",
  part: "w1",
  scene: `Một người doanh nhân mặc áo vest đang đứng bên đường, đang nhìn đồng hồ trên cổ tay trong khi chờ chiếc xe taxi. Một chiếc ô tô đang chạy đi gần đó trên đường.`,
  words: ["check", "watch"],
  sample: "A businessman is checking his watch while waiting for a taxi.",
  tips: ["Check his watch (nhìn đồng hồ) thường diễn tả việc kiểm tra thời gian vì đang chờ một người hoặc một phương tiện.", "Wait for a taxi (chờ taxi) dùng giới từ for; taxi là phương tiện du lịch và di chuyển ngắn hạn trong thành phố."],
  tags: ["daily life"]
},
{
  id: "toeic-w1-018",
  part: "w1",
  scene: `Trong thư viện, một học sinh đang ngồi trước bàn gỗ, đang viết chép vào cuốn sổ tay. Các kệ sách cao từ sàn đến trần nằm xung quanh và đầy cuốn sách tham khảo.`,
  words: ["write", "notebook"],
  sample: "A student is writing in a notebook at a library desk.",
  tips: ["Write in a notebook (viết vào sổ tay) dùng giới từ in trước notebook, không dùng 'on'.", "Library desk là bàn học trong thư viện; notebook là sổ tay ghi chép nhỏ, khác với cuốn sách in ấn."],
  tags: ["education"]
},
{
  id: "toeic-w1-019",
  part: "w1",
  scene: `Một nhân viên giao hàng đang đi xe đạp trên một đường phố đông đúc trong thành phố. Anh ta đeo mũ bảo hiểm và có một chiếc túi hàng treo trên xe đạp.`,
  words: ["ride", "bicycle"],
  sample: "A delivery worker is riding a bicycle down a busy city street.",
  tips: ["Ride a bicycle (đi xe đạp) dùng động từ ride cho xe đạp, máy xe và xe ngựa; driving chỉ dùng cho ô tô và xe máy có động cơ.", "Busy city street là đường phố trong thành phố đông người và xe cộ, thường có nhiều người đi bộ và phương tiện."],
  tags: ["transportation"]
},
{
  id: "toeic-w1-020",
  part: "w1",
  scene: `Một nhân viên phục vụ nhà hàng đang lau bàn sau khi khách hàng rời đi. Bàn đặt trong phòng ăn có cửa sổ lớn, và vài ghế đang được sắp xếp lại cho khách tiếp theo.`,
  words: ["clean", "table"],
  sample: "A waiter is cleaning a table after customers leave the restaurant.",
  tips: ["Clean a table (lau bàn) là công việc thường đối với nhân viên phục vụ sau mỗi lượt khách ăn xong.", "After customers leave (sau khi khách rời đi) — động từ leave chia thì quá khứ đơn trong mệnh đề thời gian sau after."],
  tags: ["daily life"]
},
{
  id: "toeic-w2-001",
  part: "w2",
  email: `From: Ms. Laura Chen, Office Manager
To: All Staff
Subject: Team Lunch Next Friday

Dear Team,

We are planning a team lunch next Friday to welcome our new marketing assistant. I would like to reserve a table at a nearby restaurant, but I need a few details before I make the booking.

Could you please reply by Wednesday afternoon?

Best regards,
Laura Chen
Office Manager`,
  task: "Respond to the email. In your response, give two pieces of information and ask one question.",
  sample: `Dear Ms. Chen,

Thank you for organizing the team lunch next Friday. I would be happy to join, and I prefer a restaurant within walking distance of our office so we can return to work easily. I am available from 12:00 p.m. to 1:30 p.m. on that day.

Could you please let me know whether the company will cover the cost of the meal? If so, I would also like to know if there is a price limit for each person.

Thank you for your help. I look forward to the event.

Best regards,
Minh Tran`,
  tips: [
    "Mở đầu bằng lời cảm ơn ngắn và trả lời đúng đủ yêu cầu trong task; nếu đề yêu cầu cho hai thông tin và hỏi một câu, hãy đánh dấu rõ từng ý để không bị trừ điểm.",
    "Dùng thì hiện tại đơn và can/would để trả lời lịch sự: I am available…, Could you please let me know…; tránh viết quá thân mật với cấp trên hoặc quản lý.",
    "Kết thư nên có câu chốt như I look forward to… và ký tên đầy đủ; người Việt hay quên lời chào cuối (Best regards/Sincerely) trong email công sở."
  ],
  tags: ["workplace", "event"]
},
{
  id: "toeic-w2-002",
  part: "w2",
  email: `From: Mr. David Park, Purchasing Department
To: Sales Representative, Bright Office Supplies
Subject: Question About Our Recent Order

Dear Sales Representative,

We received order #4582 yesterday, but there seems to be an issue with the delivery. We ordered 20 packs of printer paper and 10 black ink cartridges, but the shipment included only 15 packs of paper.

Please let me know how this can be resolved.

Sincerely,
David Park
Purchasing Department`,
  task: "Respond as the sales representative. In your response, apologize, explain what you will do, and ask one question.",
  sample: `Dear Mr. Park,

Thank you for informing us about the issue with order #4582. I sincerely apologize for the inconvenience caused by the missing five packs of printer paper.

I have checked our shipping records, and I will arrange to send the remaining five packs to your office tomorrow by express delivery at no extra cost. I will also send you a tracking number as soon as the package leaves our warehouse.

Could you please confirm that the delivery address on file is still correct? Once I receive your confirmation, I will make sure the shipment is processed immediately.

Sincerely,
Anna Lee
Sales Representative
Bright Office Supplies`,
  tips: [
    "Với email khiếu nại/thiếu hàng, hãy xin lỗi rõ ràng ngay đầu (I sincerely apologize for…) rồi nêu hành động khắc phục cụ thể và thời gian thực hiện.",
    "Task yêu cầu hỏi một câu: đặt câu hỏi có mục đích (xác nhận địa chỉ, thời gian nhận hàng) thay vì câu hỏi chung chung để thể hiện bạn đang xử lý vấn đề.",
    "Tránh đổ lỗi cho khách hàng; dùng giọng điệu chuyên nghiệp, tích cực: I will arrange…, at no extra cost…, as soon as…"
  ],
  tags: ["supplier", "order"]
},
{
  id: "toeic-w2-003",
  part: "w2",
  email: `From: Ms. Karen Smith, Customer Service Manager
To: Customer
Subject: Your Recent Stay at Riverside Hotel

Dear Guest,

Thank you for staying at Riverside Hotel last weekend. We noticed that you checked out earlier than planned, and we hope everything was satisfactory during your visit.

If you have a moment, we would appreciate your feedback about your stay.

Kind regards,
Karen Smith
Customer Service Manager`,
  task: "Respond to the email. In your response, describe one problem you experienced and make one request.",
  sample: `Dear Ms. Smith,

Thank you for contacting me about my recent stay at Riverside Hotel. I enjoyed the convenient location, but I experienced a problem with the air conditioner in my room. It made a loud noise during the night, which made it difficult for me to sleep, so I decided to check out early.

I would appreciate it if you could review this issue with your maintenance team to prevent it from affecting future guests. I would also like to request a partial refund for the night I could not rest comfortably.

Thank you for your attention to this matter. I look forward to your reply.

Sincerely,
James Carter`,
  tips: [
    "Khi phàn nàn lịch sự, hãy bắt đầu bằng điểm tích cực ngắn rồi mới mô tả vấn đề cụ thể (what happened, how it affected you) để giọng điệu vẫn chuyên nghiệp.",
    "Đề yêu cầu make one request: nêu yêu cầu rõ ràng, hợp lý (refund, repair, follow-up) và dùng cấu trúc lịch sự như I would appreciate it if… / I would like to request…",
    "Giữ email 80–150 từ: đủ chi tiết để người đọc hiểu tình huống nhưng tránh kể lể dài; mỗi câu nên mang một ý chính."
  ],
  tags: ["customer", "complaint"]
},
{
  id: "toeic-w2-004",
  part: "w2",
  email: `From: Mr. Thomas Nguyen, Project Coordinator
To: Team Members
Subject: Preparation for Client Meeting

Dear Team Members,

We will meet with the Greenfield Solutions client next Tuesday at 10:00 a.m. to discuss the new website project. I am preparing the agenda and would like your input before finalizing it.

Please reply to this email by Friday.

Best regards,
Thomas Nguyen
Project Coordinator`,
  task: "Respond to the email. In your response, suggest two topics to include in the agenda and ask one question.",
  sample: `Dear Mr. Nguyen,

Thank you for your message about the client meeting with Greenfield Solutions next Tuesday. I would like to suggest including the project timeline in the agenda so we can confirm key deadlines with the client. I also recommend discussing the website design requirements, including the main features and preferred layout.

Could you please let me know whether we should prepare a short presentation or only bring printed notes to the meeting? Knowing this will help me prepare the right materials in advance.

Thank you, and please let me know if you need any further support.

Best regards,
Linh Pham`,
  tips: [
    "Khi đề yêu cầu suggest two topics, hãy nêu mỗi gợi ý kèm lý do ngắn (so we can confirm…, including…) để email có chiều sâu và thuyết phục hơn.",
    "Câu hỏi nên liên quan trực tiếp đến việc chuẩn bị (tài liệu, thời lượng, người tham dự) thay vì hỏi thông tin đã có trong email gốc.",
    "Dùng cụm từ công sở phổ biến: discuss the timeline, confirm key deadlines, prepare materials in advance; chú ý viết hoa tên công ty và ngày đúng như trong email."
  ],
  tags: ["colleague", "meeting"]
},
{
  id: "toeic-w2-005",
  part: "w2",
  email: `From: Ms. Elena Rodriguez, HR Assistant
To: Job Applicant
Subject: Interview for Marketing Coordinator Position

Dear Applicant,

Thank you for applying for the Marketing Coordinator position at Horizon Media. We were impressed with your application and would like to invite you for an interview next week.

Please reply with your availability and any information you may need before the interview.

Sincerely,
Elena Rodriguez
HR Assistant`,
  task: "Respond to the email. In your response, give two pieces of information about your availability and ask one question.",
  sample: `Dear Ms. Rodriguez,

Thank you for inviting me to interview for the Marketing Coordinator position at Horizon Media. I am very interested in this opportunity.

I am available for an interview next Tuesday morning between 9:00 a.m. and 11:30 a.m. I am also available on Thursday afternoon after 2:00 p.m. If neither of these times is convenient, I can adjust my schedule with advance notice.

Could you please let me know whether the interview will be held in person or online? This information will help me prepare appropriately.

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely,
Hoa Nguyen`,
  tips: [
    "Email trả lời lời mời phỏng vấn cần thể hiện sự hào hứng nhưng trang trọng (I am very interested in this opportunity); tránh dùng từ quá suồng sã.",
    "Cung cấp hai mốc thời gian cụ thể (ngày + buổi/giờ) để HR dễ sắp xếp; nếu linh hoạt, nói rõ but I can adjust… để tăng cơ hội.",
    "Câu hỏi phổ biến và phù hợp: hình thức phỏng vấn (in person/online), địa điểm, người phỏng vấn, hoặc tài liệu cần mang theo."
  ],
  tags: ["recruitment", "interview"]
},
{
  id: "toeic-w2-006",
  part: "w2",
  email: `From: Mr. Brian Lee, Training Coordinator
To: Employees
Subject: Customer Service Training Session

Dear Employees,

Our company will hold a customer service training session next month to help staff improve communication with clients. We are currently finalizing the schedule and would like to know who is interested in attending.

Please reply to this email if you would like to participate.

Best regards,
Brian Lee
Training Coordinator`,
  task: "Respond to the email. In your response, express your interest, give one piece of information about your schedule, and ask one question.",
  sample: `Dear Mr. Lee,

Thank you for informing us about the upcoming customer service training session. I am very interested in participating because I would like to improve my communication skills when working with clients.

I am available to attend the training in the morning during the first two weeks of next month, as my afternoons are usually reserved for team meetings. If needed, I can also try to rearrange my schedule.

Could you please let me know the exact date and time of the session? I would like to confirm my availability as soon as possible.

Thank you for organizing this opportunity.

Best regards,
Tuan Nguyen`,
  tips: [
    "Khi bày tỏ quan tâm, nêu lý do ngắn gọn liên quan đến công việc (improve communication skills, work better with clients) để email có mục đích rõ.",
    "Cung cấp thông tin lịch trình cụ thể (buổi sáng, tuần nào, hạn chế buổi chiều) giúp người tổ chức sắp xếp; tránh trả lời mơ hồ như 'any time is fine' nếu thực tế có giới hạn.",
    "Chú ý lỗi hay gặp: interested in + V-ing (interested in participating/attending), không dùng interested to."
  ],
  tags: ["training", "colleague"]
},
{
  id: "toeic-w2-007",
  part: "w2",
  email: `From: Ms. Olivia Brown, Events Coordinator
To: Registered Participants
Subject: Annual Business Networking Event

Dear Participants,

Thank you for registering for our Annual Business Networking Event on May 20. We are finalizing the program and would like to share more details with you soon.

If you have any special requests or questions before the event, please let us know.

Sincerely,
Olivia Brown
Events Coordinator`,
  task: "Respond to the email. In your response, make one request and ask two questions.",
  sample: `Dear Ms. Brown,

Thank you for your email about the Annual Business Networking Event on May 20. I am looking forward to attending and meeting other professionals.

I would like to request a printed copy of the event program when I arrive, as it will help me plan which sessions to attend. I also have a dietary restriction and would appreciate a vegetarian meal option if refreshments are provided.

Could you please let me know what time the registration desk will open? In addition, will there be a name badge prepared for participants in advance?

Thank you for your assistance.

Sincerely,
Phuong Le`,
  tips: [
    "Đề yêu cầu một request và hai câu hỏi: hãy tách rõ từng phần (một đoạn cho request, một đoạn hoặc hai câu riêng cho questions) để người chấm dễ thấy bạn đáp ứng đủ yêu cầu.",
    "Yêu cầu đặc biệt (tài liệu in, chế độ ăn, hỗ trợ đi lại) nên được nêu lịch sự và kèm lý do ngắn; dùng would appreciate / would like to request.",
    "Khi hỏi hai câu, có thể dùng Could you please let me know…? và thêm In addition, …? để câu văn đa dạng nhưng vẫn rõ ràng."
  ],
  tags: ["event", "networking"]
},
{
  id: "toeic-w2-008",
  part: "w2",
  email: `From: Mr. Alan Wright, Finance Department
To: Vendor, GreenLine Printing
Subject: Invoice for March Printing Services

Dear GreenLine Printing Team,

We received your invoice for the March printing services, but we need additional information before we can process the payment. The invoice lists the total amount, but it does not include a breakdown of the charges.

Please reply at your earliest convenience.

Best regards,
Alan Wright
Finance Department`,
  task: "Respond as the vendor. In your response, give two pieces of information and explain one action you will take.",
  sample: `Dear Mr. Wright,

Thank you for your message regarding the invoice for our March printing services. I apologize for the missing details and would be happy to clarify the charges.

The total amount includes $450 for 3,000 color brochures and $120 for express delivery to your main office. These two items make up the full invoice amount of $570, and no additional fees were added.

I will send you an updated invoice with a clear breakdown of each charge by the end of today. Please review it and let me know if you need any further information to process the payment.

Best regards,
Sophie Turner
Accounts Manager
GreenLine Printing`,
  tips: [
    "Khi giải thích hóa đơn, nêu con số và hạng mục cụ thể (amount, quantity, service) để người nhận đối chiếu dễ dàng; tránh chỉ nói 'the charges are correct'.",
    "Đề yêu cầu explain one action you will take: dùng thì tương lai rõ ràng (I will send…, by the end of today) để thể hiện trách nhiệm và thời hạn xử lý.",
    "Giữ giọng điệu hợp tác ngay cả khi khách hàng yêu cầu thêm thông tin; cụm hữu ích: I apologize for the missing details, I would be happy to clarify, please review it."
  ],
  tags: ["vendor", "invoice"]
},
{
  id: "toeic-w3-001",
  part: "w3",
  prompt: "Some companies allow employees to choose their own work schedule. Do you think this is a good idea? Give reasons and examples to support your answer.",
  outline: ["Tiết kiệm thời gian đi lại, giảm căng thẳng", "Nhân viên tự quản lý thời gian hiệu quả hơn", "Cần có khung giờ chung để hợp tác nhóm", "Một số công việc không phù hợp với lịch linh hoạt", "Kết luận: tốt nếu có quy định rõ ràng"],
  sample: `I believe allowing employees to choose their own work schedule is a good idea for many reasons. A flexible schedule gives people more control over their day, but it works best when the company also sets clear expectations about availability and results.


First, it can save commuting time and reduce stress. Employees who travel during rush hour may spend a long time in traffic or on crowded trains before they even begin work. For example, a colleague who lives outside the city now starts at seven in the morning and finishes at four. She avoids the busiest traffic and has more time to pick up her child in the evening. She is also less tired when she arrives at the office.


Second, people do not all do their best work at the same hour. Some employees can concentrate early in the morning, while others are more focused later in the day. If they can arrange their schedules around their most productive hours, they may finish important tasks with fewer interruptions. A designer, for instance, might use a quiet early morning to complete detailed work and leave routine meetings for the afternoon.


However, flexibility should not mean that coworkers are impossible to reach. Teams need time to make decisions, share progress, and solve urgent problems together. A company could set core hours from ten to three, when everyone is expected to be available, and let employees choose their start and finish times outside that period. It should also agree on how quickly people need to respond to messages.


Some roles, such as customer service and factory work, require staff to cover specific hours. Managers should therefore offer flexibility where the job allows it, rather than applying one schedule to every position.


In conclusion, I support employee choice because it can improve well-being and help people organize their work. With shared hours, reliable communication, and schedules suited to each role, companies can give employees freedom without weakening teamwork.`,
  tips: [
    "Mở bài nêu rõ quan điểm ngay: I believe… is a good idea for many reasons; tránh dài dòng vào đề.",
    "Dùng First, Second, However, In addition, In conclusion để tạo cấu trúc rõ ràng; mỗi đoạn chỉ nêu một ý chính.",
    "Kết hợp ví dụ cá nhân (my colleague) và lập luận chung (some jobs) để bài luận đa dạng và thuyết phục.",
    "Tránh dùng I think nhiều lần; thay bằng I believe, In my opinion, Overall."
  ],
  tags: ["workplace", "flexible schedule"]
},
{
  id: "toeic-w3-002",
  part: "w3",
  prompt: "Some people think that companies should only hire candidates with formal education. Others believe that work experience is more important. Which view do you agree with?",
  outline: ["Học vấn chính quy cung cấp nền tảng lý thuyết vững", "Kinh nghiệm thực tế giúp làm việc hiệu quả ngay", "Kết hợp cả hai là lý tưởng nhất", "Một số ngành yêu cầu bằng cấp bắt buộc", "Kết luận: tùy vị trí nhưng kinh nghiệm có thể bù đắp"],
  sample: `I agree that work experience is more important than formal education when hiring for most positions. A degree can show that a person has studied a subject, but experience gives employers evidence of how that person uses knowledge to complete real tasks and work with other people.


To begin with, experienced employees can often contribute sooner. They may already understand common workplace tools, deadlines, and the need to communicate when a problem appears. For example, when our company hired a marketing specialist with five years of experience, she reviewed customer feedback, suggested a campaign plan, and coordinated with the sales team during her first week. A recent graduate could have the same potential, but might need more time and support to learn the company's process.


Experience can also help a candidate develop skills that are difficult to measure through grades alone. Working on a project teaches people how to divide responsibilities, explain an idea clearly, and adjust when a plan changes. These abilities matter in nearly every office role. In an interview, employers can ask candidates to describe a specific challenge they faced and what they learned from it, rather than relying only on the number of years they have worked.


However, education remains essential for some careers. Doctors need extensive medical training, and engineers may need formal study to understand safety standards and technical principles. Even in other jobs, a strong educational foundation can help a new employee learn unfamiliar tasks more quickly. Employers should not assume that every candidate without a degree lacks ability.


In conclusion, I would give more weight to relevant experience for most business positions because it shows practical judgment and the ability to work with a team. The best decision is to assess the actual skills required for each role. When education is legally or technically necessary, it should be a requirement; otherwise, demonstrated ability and results deserve greater attention.`,
  tips: [
    "Chọn một lập trường rõ ràng và bảo vệ bằng lý do cụ thể; tránh lưỡng lự giữa hai phương án.",
    "Dùng To begin with, Furthermore, Of course, However để chuyển ý và thể hiện sự cân bằng trong lập luận.",
    "Ví dụ nên từ bối cảnh công việc cụ thể (marketing campaign, team leadership) để bài luận gần gũi với TOEIC.",
    "Tránh dùng personal experience quá nhiều; nên nói for example, a candidate who… để tránh bị cho là thiên vị."
  ],
  tags: ["hiring", "career"]
},
{
  id: "toeic-w3-003",
  part: "w3",
  prompt: "Do you think businesses should prioritize making profits over protecting the environment? Give reasons with specific examples.",
  outline: ["Lợi nhuận quan trọng để duy trì hoạt động và tạo việc làm", "Bảo vệ môi trường là trách nhiệm xã hội của doanh nghiệp", "Chi phí môi trường ban đầu có thể tiết kiệm lâu dài", "Khách hàng ngày càng quan tâm đến sản phẩm xanh", "Kết luận: cần cân bằng, không phải chọn một bên"],
  sample: `I disagree with the idea that businesses should prioritize profits over environmental protection. A company needs to earn money to pay employees and remain open, but pursuing short-term savings while ignoring waste and pollution can create greater costs later.


First, customers notice how a business treats the environment. If a company makes large claims but continues to waste materials, people may lose trust and choose another brand. By contrast, clear and practical steps can strengthen a company's reputation. For example, a local clothing store could offer reusable bags and explain which products use recycled fabric. It should describe these efforts honestly instead of claiming that every product is completely harmless to the environment.


Second, some environmental improvements also reduce operating expenses. An office that replaces old lights with efficient ones and switches off unused equipment can use less electricity. At my workplace, the facilities team tracked monthly energy bills before and after changing the lighting in two busy areas. The lower bills helped pay back part of the initial cost, while employees still had well-lit work spaces. Measuring the result made it easier to decide whether to expand the program.


I recognize that not every company can afford expensive equipment immediately. A small business may need to protect its cash flow and continue serving customers. It can begin with affordable actions, such as reducing unnecessary printing, repairing equipment, or choosing suppliers that use less packaging. Managers should compare the cost, expected savings, and environmental benefit before making a larger investment.


In conclusion, businesses should protect the environment while maintaining a healthy financial position. Profit is important, but it should not be the only measure of success. Practical changes, supported by honest communication and measurable results, allow companies to serve customers responsibly and remain competitive over time. Regularly reviewing the results helps them keep improving.`,
  tips: [
    "Nêu quan điểm rõ ràng ngay từ đầu: I disagree; tránh viết mơ hồ khiến người chấm không biết bạn đứng về phía nào.",
    "Dùng First, Second, However, In conclusion cho cấu trúc 5 đoạn kinh điển; mỗi đoạn thân bài nên có một lý do và một ví dụ.",
    "Ví dụ cần có số liệu cụ thể (thirty percent) để tăng sự thuyết phục; tránh ví dụ chung chung như it helps the environment.",
    "Thừa nhận mặt khó khăn (initial investment, small businesses) để câu trả lời cân bằng và trưởng thành hơn."
  ],
  tags: ["environment", "business"]
},
{
  id: "toeic-w3-004",
  part: "w3",
  prompt: "Some people believe that success in life comes from hard work and determination. Others think success depends more on luck and opportunities. Which do you agree with?",
  outline: ["Nỗ lực và quyết tâm là nền tảng của thành công", "May mắn và cơ hội mở ra những khả năng mới", "Hai yếu tố bổ trợ lẫn nhau", "Ví dụ về người thành công nhờ nỗ lực", "Kết luận: nỗ lực quan trọng hơn nhưng cần nắm bắt cơ hội"],
  sample: `I believe success depends mainly on hard work and determination, although luck and opportunity also matter. People cannot control every condition around them, but steady effort helps them prepare for opportunities and continue when a first attempt does not work.


To begin with, hard work builds skills that a person can use again and again. Someone who practices regularly learns from mistakes and becomes more capable over time. For example, a student preparing for an important exam may not understand every topic at first. By reviewing a small amount each day, asking a teacher for help, and correcting practice answers, the student can make progress that a lucky guess cannot provide. Determination is especially important when results take weeks or months to appear.


In addition, consistent effort often produces more lasting success. A worker who takes responsibility for projects and learns from coworkers gradually earns their trust. That experience can lead to more challenging assignments in the future. If a person receives a promotion only because of a fortunate connection but does not develop the required skills, it may be difficult to perform well in the new role. Preparation gives people a better chance of keeping an opportunity once it arrives.


At the same time, I do not believe that effort alone guarantees success. A person's family, health, education, and local job market can affect what choices are available. For instance, two equally capable graduates may have different access to internships because one lives near a large business center. Companies and communities can help by offering fair hiring practices and affordable training. Individuals should also look for opportunities, such as applying for a role or asking to join a project, rather than waiting for perfect conditions.


In conclusion, luck and opportunity can influence the path, but hard work and determination are more dependable factors. They help people improve, respond to setbacks, and make good use of chances when they appear. We may not choose every starting point, but we can choose how consistently we learn and act.`,
  tips: [
    "Với câu hỏi so sánh hai quan điểm, hãy chọn một bên và bảo vệ bằng lý do mạnh; thừa nhận bên kia nhưng không để nó làm yếu lập luận chính.",
    "Dùng To begin with, Furthermore, Of course, In conclusion để tạo luồng rõ ràng; tránh nhảy lung tung giữa các ý.",
    "Ví dụ nên gần gũi với người học như học tập, thi cử, hoặc khởi nghiệp — tránh ví dụ quá xa lạ.",
    "Chú ý phân biệt luck (may mắn ngẫu nhiên) với opportunity (cơ hội có thể nắm bắt); dùng đúng ngữ cảnh."
  ],
  tags: ["success", "motivation"]
},
{
  id: "toeic-w3-005",
  part: "w3",
  prompt: "Should companies evaluate employee performance more frequently than once a year? Give your opinion with reasons and examples.",
  outline: ["Đánh giá thường xuyên giúp phát hiện vấn đề sớm", "Nhân viên biết rõ mình đang làm tốt hay chưa", "Có thể tốn thời gian và gây áp lực không cần thiết", "Nên kết hợp đánh giá thường xuyên với phản hồi chính thức", "Kết luận: tốt nếu được thực hiện đúng cách"],
  sample: `I believe companies should discuss employee performance more frequently than once a year. A single annual review may come too late to correct a problem or recognize good work, while regular conversations can help both employees and managers make practical improvements.


First, frequent feedback allows a manager to address difficulties before they become serious. If an employee is unsure how to use a new process, waiting many months to mention it may lead to repeated mistakes. A short monthly check-in gives the manager a chance to clarify expectations, answer questions, and agree on a next step. For example, a new customer service representative might benefit from reviewing a few difficult calls with a supervisor early in the job instead of hearing about them at the end of the year.


Second, employees can make better plans when they understand what they are doing well and what they should improve. At a previous company, monthly one-on-one meetings helped me learn that my reports were accurate but sometimes arrived later than the team needed. I began sharing an early draft and then completing the details. That small change made it easier for my colleagues to plan their work, and I did not have to wait for an annual meeting to hear the feedback.


However, frequent evaluation should not mean constant surveillance or a long formal review every week. Too many meetings can interrupt focused work and make employees feel that every small mistake will be recorded. Companies should keep routine conversations brief and supportive, and reserve a more detailed review for a few times each year. Managers should also use clear goals so that feedback is based on work rather than personal preference.


In conclusion, I support regular performance discussions because they encourage improvement and prevent surprises. The process should be consistent but not burdensome. Monthly check-ins combined with a formal review once or twice a year can give employees useful guidance while allowing them enough time to do their jobs.`,
  tips: [
    "Nêu quan điểm rõ ràng ngay đầu: I believe companies should…; tránh lối mở đầu mô tả chung.",
    "Dùng First, Second, However, In conclusion cho cấu trúc rõ ràng; mỗi đoạn thân bài có một ý chính và ví dụ hỗ trợ.",
    "Ví dụ từ trải nghiệm công việc cụ thể (monthly one-on-one meetings) làm bài luận chân thực hơn.",
    "Tránh tuyệt đối hóa: nói hỗ trợ đánh giá thường xuyên nhưng thừa nhận cần cân bằng với công việc chính."
  ],
  tags: ["management", "performance"]
},
{
  id: "toeic-w3-006",
  part: "w3",
  prompt: "Do you think it is important for children to learn a foreign language at a young age? Give reasons and examples to support your answer.",
  outline: ["Trẻ em học ngôn ngữ tự nhiên và nhanh hơn người lớn", "Biết nhiều ngôn ngữ mở ra cơ hội học tập và nghề nghiệp", "Có thể gây áp lực nếu học quá sớm hoặc không đúng cách", "Nên kết hợp với phương pháp vui vẻ, không gượng ép", "Kết luận: quan trọng nhưng cần cách tiếp cận phù hợp"],
  sample: `I believe children should have the chance to learn a foreign language at a young age. Early exposure gives them more time to become comfortable with another language, although the lessons should be enjoyable and appropriate for their age.


First, young learners can become familiar with sounds and common expressions through regular practice. They do not need to memorize long grammar rules at the beginning. A teacher can use songs, picture books, and simple conversations to help children understand words in context. For example, a child might learn the names of food while playing a pretend restaurant game. Because the activity feels like play, the child can practice speaking without worrying too much about making a mistake.


Second, starting early gives children more years to build their skills gradually. A student who studies a language for a short time each week can later read simple stories, follow classroom instructions, and communicate with visitors. This ability may be useful when the student travels or applies to a university. It can also help children learn about other cultures and understand that people may express ideas in different ways.


However, early lessons should not become an extra source of pressure. Children have many subjects to study, and expecting perfect pronunciation or quick progress may discourage them. In my neighborhood, one family found that their child enjoyed a weekly conversation club but disliked long vocabulary tests. The parents changed the routine to include games and short practice at home, and the child became more willing to speak. A supportive teacher and realistic goals are more valuable than forcing a child to study for hours.


In conclusion, learning a foreign language early can be beneficial because it creates time for steady practice and cultural learning. Parents and schools should focus on curiosity and communication rather than perfection. When lessons are positive and manageable, children can develop a useful skill without losing their interest in learning.`,
  tips: [
    "Mở đầu bằng quan điểm mạnh: I strongly believe, followed by the main reason; tránh dùng I think nhiều lần.",
    "Dùng First, Second, However, In conclusion cho cấu trúc rõ ràng; ví dụ nên so sánh trẻ em với người lớn để thấy sự khác biệt.",
    "Tránh nói trẻ em luôn học tốt hơn; thừa nhận yếu tố phương pháp (poor teaching methods, forced to study).",
    "Chú ý từ vựng: language acquisition, native-like accent, proficiency, bilingual employees — phù hợp bài luận TOEIC."
  ],
  tags: ["education", "language"]
},
);
