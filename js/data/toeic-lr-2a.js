// TOEIC L&R đề 2 — Part 1 (6 unit, câu 1–6) + Part 2 (25 unit, câu 7–31). Xem docs/TOEIC-LR.md.
// Nội dung tự viết, bám format ETS mới. Không chép từ sách ETS / đề thi thật.
// Khác đề 1 (toeic-lr-1a.js) về tình huống và từ vựng chính.
(window.TOEIC_LR = window.TOEIC_LR || []).push(
  // ===================== PART 1 — PHOTOGRAPHS (câu 1–6) =====================
  {
    id: 'lr2-p1-01', test: 2, part: 1, accent: 'us',
    picture: 'A busy distribution warehouse. A worker in a yellow safety vest stands beside a tall metal shelf, scanning a cardboard box with a handheld device. A forklift carries a wooden pallet down a wide aisle in the background, and many boxes are stacked near a loading dock on the right.',
    questions: [
      {
        n: 1, q: '', type: 'photo-person',
        options: ['A worker is scanning a box with a handheld device.', 'A man is driving a forklift toward the shelves.', 'The boxes are being loaded onto a delivery truck.', 'A woman is repairing a tall metal shelf.'],
        answer: 0,
        explain: 'Đáp án đúng (A): ảnh có "a worker ... scanning a cardboard box with a handheld device", nên mô tả quét mã bằng máy cầm tay là khớp. (B) sai vì người lái forklift ở phía sau, không phải người đang quét (bẫy hành động sai). (C) sai vì không có cảnh xếp hàng lên xe tải (bẫy suy diễn). (D) sai vì không ai sửa kệ (bẫy lặp từ "shelf" nhưng sai hành động).'
      }
    ],
    vi: 'Một kho phân phối nhộn nhịp. Một công nhân mặc áo bảo hộ vàng đứng cạnh kệ kim loại cao, quét một thùng carton bằng máy cầm tay. Phía sau, một chiếc xe nâng chở pallet gỗ đi dọc lối đi rộng, và nhiều thùng được xếp gần khu vực bốc dỡ bên phải.',
    vocab: ['warehouse – nhà kho', 'scan – quét (mã)', 'forklift – xe nâng', 'pallet – pallet (kệ gỗ chở hàng)']
  },
  {
    id: 'lr2-p1-02', test: 2, part: 1, accent: 'uk',
    picture: 'A professional restaurant kitchen during dinner service. A chef in a tall white hat carefully places a grilled fish onto a round plate with a spoon of sauce. Steam rises from a large pot on the stove behind him, and a waiter in a black vest waits near the stainless steel counter.',
    questions: [
      {
        n: 2, q: '', type: 'photo-object',
        options: ['The chef is washing a large pot in the sink.', 'A waiter is plating a grilled fish for a guest.', 'A large pot is steaming on the stove.', 'The fish is being kept inside a refrigerator.'],
        answer: 2,
        explain: 'Đáp án đúng (C): ảnh mô tả "steam rises from a large pot on the stove", tức nồi đang bốc hơi trên bếp. (A) sai vì đầu bếp đang bày món, không rửa nồi (bẫy hành động sai). (B) sai vì người bày cá là đầu bếp, không phải bồi bàn (bẫy sai người). (D) sai vì cá đang được bày ra đĩa chứ không cất trong tủ lạnh (bẫy lặp từ "fish" nhưng sai vị trí).'
      }
    ],
    vi: 'Một căn bếp nhà hàng chuyên nghiệp trong giờ phục vụ tối. Đầu bếp đội mũ trắng cao cẩn thận đặt một con cá nướng lên đĩa tròn cùng thìa nước sốt. Hơi nước bốc lên từ một nồi lớn trên bếp phía sau, và một bồi bàn mặc gi-lê đen chờ gần quầy thép không gỉ.',
    vocab: ['chef – đầu bếp', 'grill – nướng', 'sauce – nước sốt', 'counter – quầy (bếp)']
  },
  {
    id: 'lr2-p1-03', test: 2, part: 1, accent: 'us',
    picture: 'A construction site on a sunny afternoon. An architect wearing a hard hat and a bright safety jacket points at a large blueprint held by two engineers. A tall crane lifts a steel beam above the concrete structure, and workers in orange vests walk across the muddy ground near a stack of bricks.',
    questions: [
      {
        n: 3, q: '', type: 'photo-person',
        options: ['Two engineers are pouring concrete into a mold.', 'An architect is pointing at a large blueprint.', 'The workers are painting the concrete wall.', 'A man is repairing a wall made of bricks.'],
        answer: 1,
        explain: 'Đáp án đúng (B): ảnh có "an architect ... points at a large blueprint", nên đáp án B khớp. (A) sai vì không có cảnh đổ bê tông (bẫy suy diễn). (C) sai vì công nhân đang đi lại chứ không sơn tường (bẫy lặp từ "concrete"). (D) sai vì không ai sửa tường gạch (bẫy lặp từ "bricks" nhưng sai hành động).'
      }
    ],
    vi: 'Một công trường xây dựng vào buổi chiều nắng. Một kiến trúc sư đội mũ bảo hộ và mặc áo phản quang sáng chỉ tay vào bản vẽ lớn do hai kỹ sư cầm. Một cần cẩu cao nâng dầm thép phía trên kết cấu bê tông, và công nhân mặc áo cam đi trên nền đất lầy gần đống gạch.',
    vocab: ['construction site – công trường', 'architect – kiến trúc sư', 'blueprint – bản vẽ kỹ thuật', 'crane – cần cẩu']
  },
  {
    id: 'lr2-p1-04', test: 2, part: 1, accent: 'au',
    picture: 'A modern railway station in the morning. A silver train is stopped at the platform with its doors open. Commuters in business suits step on and off the train carrying briefcases and coffee cups, and a large digital clock hangs from the ceiling above a row of ticket machines.',
    questions: [
      {
        n: 4, q: '', type: 'photo-object',
        options: ['A train is being repaired inside a workshop.', 'Commuters are buying tickets from a machine.', 'A large clock is being fixed on the platform.', 'A silver train is stopped at the platform.'],
        answer: 3,
        explain: 'Đáp án đúng (D): ảnh có "a silver train is stopped at the platform with its doors open", nên D khớp. (A) sai vì tàu đang ở ga chứ không trong xưởng sửa (bẫy nhầm địa điểm). (B) sai vì khách đi qua máy bán vé chứ không mua (bẫy suy diễn). (C) sai vì đồng hồ chỉ treo trên trần, không ai sửa (bẫy lặp từ "clock" nhưng sai hành động).'
      }
    ],
    vi: 'Một ga tàu điện hiện đại vào buổi sáng. Một đoàn tàu màu bạc dừng ở sân ga với cửa mở. Những người đi làm mặc vest bước lên và xuống tàu, mang theo cặp và ly cà phê, và một chiếc đồng hồ điện tử lớn treo trên trần phía trên dãy máy bán vé.',
    vocab: ['railway station – ga tàu', 'platform – sân ga', 'commuter – người đi làm (đi tàu)', 'briefcase – cặp (tài liệu)']
  },
  {
    id: 'lr2-p1-05', test: 2, part: 1, accent: 'uk',
    picture: 'A bright hospital room. A nurse in blue scrubs stands beside a patient bed, checking a digital monitor that shows the heart rate. A doctor in a white coat reads a chart at the foot of the bed, and a vase of flowers sits on the windowsill with sunlight coming through the blinds.',
    questions: [
      {
        n: 5, q: '', type: 'photo-person',
        options: ['A nurse is checking a monitor beside a patient.', 'A doctor is arranging flowers on the windowsill.', 'The patient is walking down the hallway.', 'A nurse is cleaning the floor of the room.'],
        answer: 0,
        explain: 'Đáp án đúng (A): ảnh có "a nurse ... checking a digital monitor", nên A khớp. (B) sai vì người đọc biểu đồ là bác sĩ, còn hoa chỉ để trên bệ cửa (bẫy sai người). (C) sai vì bệnh nhân đang nằm trên giường (bẫy suy diễn). (D) sai vì không ai lau sàn (bẫy hành động sai).'
      }
    ],
    vi: 'Một phòng bệnh viện sáng sủa. Một y tá mặc đồ scrubs xanh đứng cạnh giường bệnh, kiểm tra màn hình điện tử hiển thị nhịp tim. Một bác sĩ áo blouse trắng đọc biểu đồ ở cuối giường, và một bình hoa đặt trên bệ cửa sổ với ánh nắng len qua rèm.',
    vocab: ['scrubs – đồ y tá (áo quần phẫu thuật)', 'monitor – màn hình theo dõi', 'heart rate – nhịp tim', 'windowsill – bệ cửa sổ']
  },
  {
    id: 'lr2-p1-06', test: 2, part: 1, accent: 'ca',
    picture: 'A small clothing boutique. A cashier stands behind the counter at the front, handing a paper shopping bag to a customer. A young woman near the center holds a red sweater against her body and looks in a full-length mirror, while jackets and dresses hang neatly on metal racks along the walls.',
    questions: [
      {
        n: 6, q: '', type: 'photo-person',
        options: ['A cashier is folding sweaters on a metal rack.', 'A woman is paying with a credit card at the counter.', 'A cashier is handing a shopping bag to a customer.', 'The customers are leaving the store in a hurry.'],
        answer: 2,
        explain: 'Đáp án đúng (C): ảnh có "a cashier ... handing a paper shopping bag to a customer", nên C khớp. (A) sai vì thu ngân đang đưa túi chứ không gấp áo (bẫy lặp từ "sweater" nhưng sai hành động). (B) sai vì không có cảnh quẹt thẻ (bẫy suy diễn). (D) sai vì khách vẫn đang trong cửa hàng (bẫy suy diễn).'
      }
    ],
    vi: 'Một cửa hàng quần áo nhỏ. Một thu ngân đứng sau quầy phía trước, đưa túi giấy mua hàng cho khách. Một phụ nữ trẻ ở giữa ướm chiếc áo len đỏ vào người và nhìn vào gương toàn thân, trong khi áo khoác và váy được treo gọn trên giá kim loại dọc tường.',
    vocab: ['boutique – cửa hàng (quần áo) nhỏ', 'cashier – thu ngân', 'sweater – áo len', 'full-length mirror – gương toàn thân']
  },

  // ===================== PART 2 — QUESTION-RESPONSE (câu 7–31) =====================
  {
    id: 'lr2-p2-01', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'When does the next express train to the airport leave?' }],
    questions: [
      {
        n: 7, q: '', type: 'wh-question',
        options: ['It leaves at a quarter past six.', 'The platform is number four.', 'Yes, I take the train every week.'],
        answer: 0,
        explain: 'Câu hỏi WH "When" hỏi thời gian, nên đáp án phải nêu giờ: "It leaves at a quarter past six" (6 giờ 15) là đúng. (B) trả lời địa điểm ("platform number four") — bẫy trả lời sai thông tin được hỏi. (C) mở đầu "Yes" — bẫy trả lời yes/no cho câu hỏi WH.'
      }
    ],
    vi: 'Khi nào chuyến tàu nhanh kế tiếp đến sân bay khởi hành? — Nó khởi hành lúc 6 giờ 15.',
    vocab: ['express train – tàu nhanh', 'platform – sân ga', 'a quarter past six – 6 giờ 15']
  },
  {
    id: 'lr2-p2-02', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'Has the vendor been paid for the last order yet?' }],
    questions: [
      {
        n: 8, q: '', type: 'yes-no',
        options: ['The vendor sells fresh flowers every day.', 'Yes, the payment went through this morning.', 'I will call the vendor tomorrow afternoon.'],
        answer: 1,
        explain: 'Câu hỏi Yes/No "Has the vendor been paid...?", đáp án "Yes, the payment went through this morning" vừa trả lời có vừa đúng thì. (A) nói nhà cung cấp bán hoa — bẫy lặp từ "vendor" nhưng lạc chủ đề. (C) nói sẽ gọi ngày mai — bẫy sai thì, không trả lời đã thanh toán hay chưa.'
      }
    ],
    vi: 'Nhà cung cấp đã được thanh toán cho đơn hàng vừa rồi chưa? — Rồi, khoản thanh toán đã được xử lý sáng nay.',
    vocab: ['vendor – nhà cung cấp', 'payment – khoản thanh toán', 'go through – (giao dịch) được xử lý thành công']
  },
  {
    id: 'lr2-p2-03', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Would you rather use the small meeting room on the first floor or the large one upstairs?' }],
    questions: [
      {
        n: 9, q: '', type: 'choice',
        options: ['The meeting room was cleaned yesterday.', 'Yes, I like the room upstairs very much.', 'The small one on the first floor is enough for us.'],
        answer: 2,
        explain: 'Câu hỏi lựa chọn "the small one ... or the large one" yêu cầu chọn một; đáp án "The small one on the first floor is enough" chọn rõ. (A) nói phòng đã lau — bẫy lặp từ "meeting room", không chọn. (B) "Yes" trả lời yes/no — bẫy trả lời yes/no cho câu hỏi lựa chọn.'
      }
    ],
    vi: 'Bạn muốn dùng phòng họp nhỏ ở tầng một hay phòng lớn trên lầu? — Phòng nhỏ ở tầng một là đủ cho chúng tôi.',
    vocab: ['meeting room – phòng họp', 'upstairs – (ở) trên lầu', 'floor – tầng (nhà)']
  },
  {
    id: 'lr2-p2-04', test: 2, part: 2, accent: 'au',
    script: [{ sp: 'W', text: 'Would you mind checking the stock levels before you leave today?' }],
    questions: [
      {
        n: 10, q: '', type: 'suggestion-request',
        options: ['Not at all, I will check them right now.', 'The stock is kept in the basement.', 'I left the office early yesterday.'],
        answer: 0,
        explain: 'Câu hỏi lịch sự "Would you mind checking...?" là yêu cầu; "Not at all, I will check them right now" nhận lời rõ (Not at all = không phiền gì). (A) trả lời đúng. (B) nói nơi trữ hàng — bẫy lặp từ "stock", không trả lời yêu cầu. (C) kể hôm qua về sớm — bẫy sai thì, lạc chủ đề.'
      }
    ],
    vi: 'Bạn kiểm tra mức tồn kho trước khi tan làm hôm nay được không? — Không phiền gì đâu, tôi sẽ kiểm tra ngay bây giờ.',
    vocab: ['stock level – mức tồn kho', 'Would you mind – bạn có phiền không (yêu cầu lịch sự)', 'basement – tầng hầm']
  },
  {
    id: 'lr2-p2-05', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'M', text: 'The new accounting software will be installed tonight after six.' }],
    questions: [
      {
        n: 11, q: '', type: 'statement',
        options: ['Where did you buy the accounting software?', 'Good, I will save my files before I leave.', 'The software was released late last year.'],
        answer: 1,
        explain: 'Câu trần thuật báo phần mềm kế toán sẽ được cài tối nay; đáp án "Good, I will save my files before I leave" phản hồi hành động hợp lý. (A) hỏi mua ở đâu — bẫy lặp từ "software", lạc chủ đề. (C) nói phần mềm ra mắt năm ngoái — bẫy lặp từ "software" và sai thì, không đáp lại thông báo.'
      }
    ],
    vi: 'Phần mềm kế toán mới sẽ được cài tối nay sau sáu giờ. — Tốt, tôi sẽ lưu tệp lại trước khi ra về.',
    vocab: ['accounting software – phần mềm kế toán', 'install – cài đặt', 'save – lưu (tệp)']
  },
  {
    id: 'lr2-p2-06', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: "Let me look up the client account and I will call you right back." }],
    questions: [
      {
        n: 12, q: '', type: 'indirect',
        options: ['I have never seen that account before.', 'The client called me early this morning.', 'Thanks, I will wait for your call.'],
        answer: 2,
        explain: 'Câu "Let me look up the client account and I will call you right back" là thông báo gián tiếp (sẽ tra tài khoản rồi gọi lại); đáp án "Thanks, I will wait for your call" phản hồi tự nhiên. (A) nói chưa từng thấy tài khoản — bẫy lặp từ "account", lạc ý. (B) kể khách đã gọi — bẫy lặp từ "client", không liên quan.'
      }
    ],
    vi: 'Để tôi tra tài khoản của khách rồi gọi lại cho bạn ngay. — Cảm ơn, tôi sẽ chờ cuộc gọi của bạn.',
    vocab: ['look up – tra (thông tin)', 'account – tài khoản', 'call back – gọi lại']
  },
  {
    id: 'lr2-p2-07', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Where can I find the safety goggles for the laboratory?' }],
    questions: [
      {
        n: 13, q: '', type: 'wh-question',
        options: ['The laboratory closes at five o clock.', 'They are in the top drawer next to the sink.', 'Yes, you need goggles inside the laboratory.'],
        answer: 1,
        explain: 'Câu hỏi "Where" hỏi nơi chốn, đáp án "They are in the top drawer next to the sink" nêu vị trí rõ. (A) nói giờ đóng cửa — bẫy lặp từ "laboratory", trả lời sai thông tin. (C) "Yes" trả lời yes/no — bẫy sai loại câu hỏi dù lặp từ "goggles".'
      }
    ],
    vi: 'Tôi có thể tìm kính bảo hộ ở đâu? — Chúng ở trong ngăn kéo trên cùng, cạnh bồn rửa.',
    vocab: ['safety goggles – kính bảo hộ', 'laboratory – phòng thí nghiệm', 'drawer – ngăn kéo']
  },
  {
    id: 'lr2-p2-08', test: 2, part: 2, accent: 'au',
    script: [{ sp: 'W', text: 'Is the staff cafeteria serving breakfast from seven o clock?' }],
    questions: [
      {
        n: 14, q: '', type: 'yes-no',
        options: ['Yes, breakfast starts at seven sharp.', 'The cafeteria seats about fifty people.', 'I usually eat breakfast at home.'],
        answer: 0,
        explain: 'Câu hỏi Yes/No, đáp án "Yes, breakfast starts at seven sharp" trả lời có và đúng giờ. (A) đúng. (B) nói sức chứa — bẫy lặp từ "cafeteria", không trả lời. (C) nói hay ăn sáng ở nhà — bẫy lặp từ "breakfast", lạc chủ đề.'
      }
    ],
    vi: 'Căng tin nhân viên có phục vụ bữa sáng từ bảy giờ không? — Có, bữa sáng bắt đầu đúng bảy giờ.',
    vocab: ['cafeteria – căng tin', 'serve – phục vụ (món ăn)', 'sharp – đúng giờ']
  },
  {
    id: 'lr2-p2-09', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'M', text: 'Should we send the fragile equipment by air or by sea freight?' }],
    questions: [
      {
        n: 15, q: '', type: 'choice',
        options: ['The equipment arrived safely last week.', 'Yes, we shipped it by air before.', 'By sea freight is cheaper, so let us do that.'],
        answer: 2,
        explain: 'Câu hỏi lựa chọn "by air or by sea freight" yêu cầu chọn một; đáp án "By sea freight is cheaper, so let us do that" chọn rõ. (A) nói hàng đã đến — bẫy lặp từ "equipment" và sai thì, không chọn. (B) "Yes" trả lời yes/no — bẫy sai loại câu hỏi cho câu hỏi lựa chọn.'
      }
    ],
    vi: 'Chúng ta nên gửi thiết bị dễ vỡ bằng đường hàng không hay đường biển? — Đường biển rẻ hơn, nên mình làm vậy đi.',
    vocab: ['fragile – dễ vỡ', 'equipment – thiết bị', 'sea freight – vận tải đường biển']
  },
  {
    id: 'lr2-p2-10', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Could you please proofread the marketing brochure before it goes to print?' }],
    questions: [
      {
        n: 16, q: '', type: 'suggestion-request',
        options: ['The brochure has about twenty pages.', 'Sure, I will review it this afternoon.', 'I printed the brochure late yesterday.'],
        answer: 1,
        explain: 'Câu hỏi lịch sự "Could you please proofread...?" là yêu cầu; "Sure, I will review it this afternoon" nhận lời rõ. (A) nói số trang — bẫy lặp từ "brochure", không trả lời. (C) kể đã in hôm qua — bẫy lặp từ "brochure/print" và sai thì, không nhận yêu cầu.'
      }
    ],
    vi: 'Bạn đọc soát lại tờ rơi quảng cáo trước khi đem in được không? — Được chứ, chiều nay tôi sẽ xem lại.',
    vocab: ['proofread – đọc soát (lỗi chính tả)', 'brochure – tờ rơi quảng cáo', 'go to print – đem in']
  },
  {
    id: 'lr2-p2-11', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'The elevator on the left side of the building is temporarily out of service.' }],
    questions: [
      {
        n: 17, q: '', type: 'statement',
        options: ['I will take the stairs, then.', 'The building has twelve floors in total.', 'The elevator was repaired late last month.'],
        answer: 0,
        explain: 'Câu trần thuật báo thang máy bên trái tạm ngừng; đáp án "I will take the stairs, then" phản hồi hành động hợp lý. (A) đúng. (B) nói số tầng — bẫy liên tưởng "building", lạc chủ đề. (C) nói thang máy đã sửa tháng trước — bẫy lặp từ "elevator" và mâu thuẫn "out of service".'
      }
    ],
    vi: 'Thang máy bên trái tòa nhà đang tạm ngừng hoạt động. — Vậy tôi sẽ đi cầu thang bộ.',
    vocab: ['elevator – thang máy', 'out of service – ngừng hoạt động', 'take the stairs – đi cầu thang bộ']
  },
  {
    id: 'lr2-p2-12', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'I will double-check the sales figures and email the spreadsheet to you shortly.' }],
    questions: [
      {
        n: 18, q: '', type: 'indirect',
        options: ['The figures look very high to me.', 'Where is the spreadsheet saved right now?', 'That sounds good, thank you.'],
        answer: 2,
        explain: 'Câu "I will double-check the sales figures and email the spreadsheet" là thông báo gián tiếp (sẽ kiểm tra lại rồi gửi); đáp án "That sounds good, thank you" phản hồi tự nhiên. (A) nói số liệu cao — bẫy lặp từ "figures", lạc ý. (B) hỏi nơi lưu bảng tính — bẫy lặp từ "spreadsheet", không đáp lại lời hứa.'
      }
    ],
    vi: 'Tôi sẽ kiểm tra lại số liệu bán hàng rồi gửi bảng tính cho bạn ngay. — Nghe hay đấy, cảm ơn bạn.',
    vocab: ['double-check – kiểm tra lại', 'figure – số liệu', 'spreadsheet – bảng tính']
  },
  {
    id: 'lr2-p2-13', test: 2, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'How much does the annual gym membership cost for new members?' }],
    questions: [
      {
        n: 19, q: '', type: 'wh-question',
        options: ['It costs two hundred dollars a year.', 'The gym opens at six in the morning.', 'Yes, I am a new member here.'],
        answer: 0,
        explain: 'Câu hỏi "How much" hỏi giá, đáp án "It costs two hundred dollars a year" nêu đúng số tiền. (A) đúng. (B) nói giờ mở cửa — bẫy lặp từ "gym", trả lời sai thông tin. (C) "Yes" trả lời yes/no — bẫy sai loại câu hỏi dù lặp từ "member".'
      }
    ],
    vi: 'Hội viên phòng gym hằng năm cho thành viên mới giá bao nhiêu? — Hai trăm đô một năm.',
    vocab: ['membership – thẻ hội viên', 'annual – hằng năm', 'How much – bao nhiêu (tiền)']
  },
  {
    id: 'lr2-p2-14', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Did you get my text message about the change of venue?' }],
    questions: [
      {
        n: 20, q: '', type: 'yes-no',
        options: ['The venue is close to the train station.', 'Yes, I saw it and updated my calendar.', 'I will send you a text later today.'],
        answer: 1,
        explain: 'Câu hỏi Yes/No "Did you get my text message...?", đáp án "Yes, I saw it and updated my calendar" vừa trả lời có vừa đúng thì quá khứ. (A) nói địa điểm — bẫy lặp từ "venue", không trả lời. (C) nói sẽ nhắn sau — bẫy sai thì, không trả lời đã nhận tin chưa.'
      }
    ],
    vi: 'Bạn có nhận được tin nhắn của tôi về việc đổi địa điểm không? — Có, tôi đã thấy và cập nhật lịch rồi.',
    vocab: ['venue – địa điểm (tổ chức sự kiện)', 'text message – tin nhắn', 'calendar – lịch (lịch làm việc)']
  },
  {
    id: 'lr2-p2-15', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Which of the two applicants has stronger skills in digital marketing?' }],
    questions: [
      {
        n: 21, q: '', type: 'choice',
        options: ['The interview lasted about forty minutes.', 'Yes, both of them applied online.', 'The one who managed three online campaigns.'],
        answer: 2,
        explain: 'Câu hỏi "Which of the two applicants" yêu cầu chọn ứng viên; đáp án "The one who managed three online campaigns" chọn rõ. (A) nói thời lượng phỏng vấn — bẫy lặp chủ đề, không trả lời. (B) "Yes" trả lời yes/no — bẫy sai loại câu hỏi dù nói "both".'
      }
    ],
    vi: 'Trong hai ứng viên, ai có kỹ năng tiếp thị số tốt hơn? — Người đã điều hành ba chiến dịch trực tuyến.',
    vocab: ['applicant – ứng viên', 'campaign – chiến dịch (quảng cáo)', 'digital marketing – tiếp thị số']
  },
  {
    id: 'lr2-p2-16', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'Would you like to join us for the client dinner at the Italian restaurant tonight?' }],
    questions: [
      {
        n: 22, q: '', type: 'suggestion-request',
        options: ['Yes, I would love to. What time should I come?', 'The restaurant mainly serves Italian food.', 'I went to that restaurant late last week.'],
        answer: 0,
        explain: 'Đây là lời mời "Would you like to join us...?"; đáp án "Yes, I would love to. What time should I come?" nhận lời rõ. (A) đúng. (B) nói phong cách món — bẫy lặp từ "restaurant/Italian", không trả lời. (C) kể đã đến đó — bẫy lặp từ "restaurant" và sai thì, không nhận lời.'
      }
    ],
    vi: 'Bạn có muốn cùng chúng tôi đi ăn tối với khách ở nhà hàng Ý tối nay không? — Vâng, tôi rất muốn. Mấy giờ tôi nên đến?',
    vocab: ['client dinner – bữa tối với khách hàng', 'join – tham gia', 'Would you like to – bạn có muốn không (lời mời)']
  },
  {
    id: 'lr2-p2-17', test: 2, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'The fire drill for our department is scheduled for two o clock this afternoon.' }],
    questions: [
      {
        n: 23, q: '', type: 'statement',
        options: ['Where is the nearest fire exit located?', 'The drill was already held late last month.', 'Thanks for the reminder, I will be ready.'],
        answer: 2,
        explain: 'Câu trần thuật báo diễn tập phòng cháy chữa cháy lúc hai giờ chiều; đáp án "Thanks for the reminder, I will be ready" phản hồi tự nhiên. (A) hỏi vị trí lối thoát — bẫy liên tưởng "fire", lạc chủ đề. (B) nói đã diễn tập tháng trước — bẫy lặp từ "drill" và mâu thuẫn thời gian.'
      }
    ],
    vi: 'Buổi diễn tập phòng cháy chữa cháy của phòng chúng ta được lên lịch lúc hai giờ chiều nay. — Cảm ơn nhắc nhở, tôi sẽ sẵn sàng.',
    vocab: ['fire drill – diễn tập phòng cháy', 'department – phòng ban', 'reminder – lời nhắc']
  },
  {
    id: 'lr2-p2-18', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Let me confirm the room reservation with the hotel before I promise anything.' }],
    questions: [
      {
        n: 24, q: '', type: 'indirect',
        options: ['The hotel has a very large lobby.', 'Please do, and let me know as soon as possible.', 'I stayed at that hotel late last summer.'],
        answer: 1,
        explain: 'Câu "Let me confirm the room reservation with the hotel" là thông báo gián tiếp (sẽ xác nhận với khách sạn rồi mới hứa); đáp án "Please do, and let me know as soon as possible" phản hồi phù hợp. (A) nói sảnh khách sạn — bẫy lặp từ "hotel", lạc ý. (B) đúng. (C) kể đã ở đó — bẫy lặp từ "hotel" và sai thì.'
      }
    ],
    vi: 'Để tôi xác nhận việc đặt phòng với khách sạn trước khi hứa gì nhé. — Bạn cứ làm, rồi cho tôi biết sớm nhất có thể.',
    vocab: ['reservation – việc đặt chỗ', 'confirm – xác nhận', 'as soon as possible – càng sớm càng tốt']
  },
  {
    id: 'lr2-p2-19', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Why was the product launch pushed back to next month?' }],
    questions: [
      {
        n: 25, q: '', type: 'wh-question',
        options: ['The supplier is still waiting for a new shipment.', 'The launch was extremely successful.', 'Yes, it is happening next month.'],
        answer: 0,
        explain: 'Câu hỏi "Why" hỏi lý do, đáp án "The supplier is still waiting for a new shipment" nêu lý do dời lịch. (A) đúng. (B) nói buổi ra mắt thành công — bẫy lặp từ "launch", không trả lời lý do. (C) "Yes" trả lời yes/no — bẫy sai loại câu hỏi dù lặp từ "next month".'
      }
    ],
    vi: 'Vì sao buổi ra mắt sản phẩm bị dời sang tháng sau? — Vì nhà cung cấp vẫn đang chờ một lô hàng mới.',
    vocab: ['product launch – buổi ra mắt sản phẩm', 'push back – dời (lịch) lại', 'shipment – lô hàng']
  },
  {
    id: 'lr2-p2-20', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'Are visitors allowed to park in the lot behind the main building?' }],
    questions: [
      {
        n: 26, q: '', type: 'yes-no',
        options: ['The lot has about thirty parking spaces.', 'Yes, guests may park there after five o clock.', 'I usually take the bus to work these days.'],
        answer: 1,
        explain: 'Câu hỏi Yes/No "Are visitors allowed to park...?", đáp án "Yes, guests may park there after five" trả lời có và nêu điều kiện. (A) nói số chỗ đỗ — bẫy lặp từ "lot/parking", không trả lời. (C) nói đi xe buýt — bẫy liên tưởng, lạc chủ đề.'
      }
    ],
    vi: 'Khách có được phép đỗ xe ở bãi phía sau tòa nhà chính không? — Có, khách có thể đỗ ở đó sau năm giờ.',
    vocab: ['visitor – khách', 'parking lot – bãi đỗ xe', 'be allowed to – được phép']
  },
  {
    id: 'lr2-p2-21', test: 2, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'Would you prefer a window seat or an aisle seat on the flight?' }],
    questions: [
      {
        n: 27, q: '', type: 'choice',
        options: ['The flight departs at noon tomorrow.', 'Yes, I have already booked a flight.', 'An aisle seat, please, so I can stretch my legs.'],
        answer: 2,
        explain: 'Câu hỏi lựa chọn "a window seat or an aisle seat" yêu cầu chọn một; đáp án "An aisle seat, please" chọn rõ. (A) nói giờ bay — bẫy lặp từ "flight", không chọn. (B) "Yes" trả lời yes/no — bẫy sai loại câu hỏi cho câu hỏi lựa chọn.'
      }
    ],
    vi: 'Bạn thích ghế cạnh cửa sổ hay ghế lối đi trên chuyến bay? — Ghế lối đi, làm ơn, để tôi duỗi chân được.',
    vocab: ['aisle seat – ghế lối đi', 'window seat – ghế cạnh cửa sổ', 'stretch – duỗi (chân)']
  },
  {
    id: 'lr2-p2-22', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Can you forward the updated agenda to the whole team before the call?' }],
    questions: [
      {
        n: 28, q: '', type: 'suggestion-request',
        options: ['I will send it to everyone right away.', 'The agenda has about five items.', 'I emailed the team late yesterday.'],
        answer: 0,
        explain: 'Câu hỏi "Can you forward the updated agenda...?" là yêu cầu; "I will send it to everyone right away" nhận lời rõ. (A) đúng. (B) nói số mục — bẫy lặp từ "agenda", không trả lời. (C) kể đã gửi hôm qua — bẫy lặp từ "email/team" và sai thì, không nhận yêu cầu.'
      }
    ],
    vi: 'Bạn chuyển lại chương trình họp đã cập nhật cho cả nhóm trước cuộc gọi được không? — Tôi sẽ gửi cho mọi người ngay.',
    vocab: ['agenda – chương trình họp', 'forward – chuyển tiếp', 'the whole team – cả nhóm']
  },
  {
    id: 'lr2-p2-23', test: 2, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'The quarterly earnings will be announced to the public tomorrow morning.' }],
    questions: [
      {
        n: 29, q: '', type: 'statement',
        options: ['Where are the earnings stored right now?', 'The stock price will probably go up.', 'The earnings were announced late last quarter.'],
        answer: 1,
        explain: 'Câu trần thuật báo kết quả kinh doanh quý sẽ công bố sáng mai; đáp án "The stock price will probably go up" phản hồi suy đoán hợp lý. (A) hỏi nơi lưu — bẫy lặp từ "earnings", lạc chủ đề. (B) đúng. (C) nói đã công bố quý trước — bẫy lặp từ "earnings/quarter" và sai thì.'
      }
    ],
    vi: 'Kết quả kinh doanh quý sẽ được công bố cho công chúng sáng mai. — Giá cổ phiếu có lẽ sẽ tăng.',
    vocab: ['quarterly earnings – kết quả kinh doanh quý', 'announce – công bố', 'stock price – giá cổ phiếu']
  },
  {
    id: 'lr2-p2-24', test: 2, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'I will check the stock with the supplier and get back to you by the end of the day.' }],
    questions: [
      {
        n: 30, q: '', type: 'indirect',
        options: ['The supplier is very reliable this year.', 'Where is the supplier located exactly?', 'That would be helpful, thank you.'],
        answer: 2,
        explain: 'Câu "I will check the stock with the supplier and get back to you" là thông báo gián tiếp (sẽ kiểm tra tồn kho rồi liên hệ lại); đáp án "That would be helpful, thank you" phản hồi tự nhiên. (A) nói nhà cung cấp uy tín — bẫy lặp từ "supplier", lạc ý. (B) hỏi vị trí — bẫy lặp từ "supplier", không đáp lại lời hứa.'
      }
    ],
    vi: 'Tôi sẽ kiểm tra hàng tồn với nhà cung cấp rồi liên hệ lại với bạn trước cuối ngày. — Như vậy thì tốt quá, cảm ơn bạn.',
    vocab: ['get back to – liên hệ lại', 'supplier – nhà cung cấp', 'the end of the day – cuối ngày']
  },
  {
    id: 'lr2-p2-25', test: 2, part: 2, accent: 'ca',
    script: [{ sp: 'M', text: 'What time should I arrive for the guided tour of the factory?' }],
    questions: [
      {
        n: 31, q: '', type: 'wh-question',
        options: ['Please arrive ten minutes before it starts.', 'The factory mainly makes car parts.', 'Yes, the tour lasts about two hours.'],
        answer: 0,
        explain: 'Câu hỏi "What time" hỏi giờ, đáp án "Please arrive ten minutes before it starts" nêu đúng giờ cần đến. (A) đúng. (B) nói sản phẩm nhà máy — bẫy lặp từ "factory", trả lời sai thông tin. (C) "Yes" trả lời yes/no — bẫy sai loại câu hỏi dù lặp từ "tour".'
      }
    ],
    vi: 'Tôi nên đến lúc mấy giờ cho chuyến tham quan nhà máy có hướng dẫn? — Xin hãy đến trước giờ bắt đầu mười phút.',
    vocab: ['guided tour – chuyến tham quan có hướng dẫn', 'factory – nhà máy', 'arrive – đến (nơi nào)']
  }
);