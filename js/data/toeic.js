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
);
