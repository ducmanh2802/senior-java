// TOEIC L&R đề 3 — Part 1 (6 unit, câu 1–6) + Part 2 (25 unit, câu 7–31). Xem docs/TOEIC-LR.md.
// Nội dung tự viết, bám format ETS mới (2024–2026). Không chép từ sách ETS / đề thi thật.
// Khác đề 1 (toeic-lr-1a.js) và đề 2 (toeic-lr-2a.js) về tình huống và từ vựng chính.
(window.TOEIC_LR = window.TOEIC_LR || []).push(
  // ===================== PART 1 — PHOTOGRAPHS (câu 1–6) =====================
  {
    id: 'lr3-p1-01', test: 3, part: 1, accent: 'us',
    picture: 'A bright flower shop in the morning. A florist in a green apron stands behind the counter arranging a bouquet of pink and white roses. Buckets of fresh tulips and sunflowers line the wooden shelves on the left, and a customer near the door holds a small potted plant while reading a greeting card.',
    questions: [
      {
        n: 1, q: '', type: 'photo-person',
        options: ['A customer is paying for a bouquet at the register.', 'A florist is arranging roses behind the counter.', 'A man is watering the tulips on the shelf.', 'A woman is reading a book near the door.'],
        answer: 1,
        explain: 'Đáp án đúng (B): ảnh có "a florist ... arranging a bouquet of pink and white roses", nên mô tả hành động "arranging roses behind the counter" là chính xác nhất. (A) là bẫy suy diễn (Inference trap) — dù có khách hàng nhưng không có bằng chứng họ đang trả tiền tại quầy thu ngân. (C) là bẫy lặp từ (Repeated word trap) — dùng lại từ "tulips" nhưng gán sai hành động (không ai đang tưới hoa). (D) là bẫy nhầm lẫn vật thể (Object trap) — khách đang đọc thiệp chúc mừng (greeting card) chứ không phải đọc sách (book).'
      }
    ],
    vi: 'Một cửa hàng hoa sáng sủa vào buổi sáng. Một người bán hoa đeo tạp dề xanh đứng sau quầy đang cắm bó hồng hồng và trắng. Những xô hoa tulip và hoa hướng dương tươi xếp dọc kệ gỗ bên trái, và một khách hàng gần cửa cầm chậu cây nhỏ trong khi đọc thiếp chúc mừng.',
    vocab: ['florist – người bán hoa', 'bouquet – bó hoa', 'tulip – hoa tulip', 'potted plant – chậu cây']
  },
  {
    id: 'lr3-p1-02', test: 3, part: 1, accent: 'uk',
    picture: 'A busy airport security checkpoint. A traveler in a grey jacket places a laptop and a clear plastic bag into a grey tray on the conveyor belt. A security officer in a navy uniform stands beside the scanner monitor, and a large sign above the metal detector reads Please Remove All Metal Items. More passengers wait in line behind a blue rope barrier.',
    questions: [
      {
        n: 2, q: '', type: 'photo-object',
        options: ['A security officer is checking a scanner monitor.', 'A traveler is putting items into a tray.', 'The metal detector is being repaired by a technician.', 'Passengers are boarding a plane at the gate.'],
        answer: 1,
        explain: 'Đáp án đúng (B): ảnh mô tả "a traveler ... places a laptop ... into a grey tray", nên "putting items into a tray" là khớp. (A) là bẫy nhầm trọng tâm (Focus trap) — nhân viên an ninh chỉ đứng cạnh màn hình chứ không nói rõ đang kiểm tra nó, hành động chính là của du khách. (C) là bẫy lặp từ (Repeated word) — có máy dò kim loại nhưng không có thợ sửa chữa nào. (D) là bẫy địa điểm (Location trap) — đây là khu kiểm tra an ninh, không phải cửa lên máy bay.'
      }
    ],
    vi: 'Một khu vực kiểm tra an ninh sân bay nhộn nhịp. Một du khách mặc áo khoác xám đặt laptop và túi nhựa trong suốt vào khay xám trên băng chuyền. Một nhân viên an ninh mặc đồng phục xanh navy đứng cạnh màn hình máy quét, và một biển lớn phía trên máy dò kim loại ghi Hãy tháo bỏ tất cả vật dụng kim loại. Thêm hành khách xếp hàng phía sau rào dây xanh.',
    vocab: ['security checkpoint – khu kiểm tra an ninh', 'conveyor belt – băng chuyền', 'tray – khay', 'metal detector – máy dò kim loại']
  },
  {
    id: 'lr3-p1-03', test: 3, part: 1, accent: 'au',
    picture: 'A modern coffee shop interior on a rainy afternoon. A barista in a black apron operates a shiny espresso machine behind the counter. A young man at a corner table types on a laptop beside a white ceramic mug, and a woman near the window reads a newspaper. Raindrops streak down the large glass window, and a chalkboard menu hangs on the brick wall.',
    questions: [
      {
        n: 3, q: '', type: 'photo-person',
        options: ['A barista is operating an espresso machine.', 'A man is washing a ceramic mug in the sink.', 'A woman is wiping the glass window.', 'The customers are leaving the coffee shop.'],
        answer: 0,
        explain: 'Đáp án đúng (A): ảnh có "a barista ... operates a shiny espresso machine", nên mô tả này hoàn toàn chính xác. (B) là bẫy lặp từ và hành động sai — có chiếc cốc sứ (ceramic mug) nhưng người đàn ông đang gõ máy tính chứ không rửa cốc. (C) là bẫy vật thể — có cửa kính (glass window) nhưng người phụ nữ đang đọc báo chứ không lau kính. (D) là bẫy suy diễn — khách vẫn đang ngồi ổn định, không có dấu hiệu sắp rời đi.'
      }
    ],
    vi: 'Một quán cà phê hiện đại vào buổi chiều mưa. Một nhân viên pha chế đeo tạp dề đen vận hành máy espresso bóng loáng sau quầy. Một chàng trai ở bàn góc gõ laptop cạnh chiếc cốc sứ trắng, và một phụ nữ gần cửa sổ đọc báo. Những giọt mưa chảy dài trên ô kính lớn, và một bảng menu phấn treo trên tường gạch.',
    vocab: ['barista – nhân viên pha chế', 'espresso machine – máy pha cà phê espresso', 'ceramic mug – cốc sứ', 'chalkboard menu – bảng menu phấn']
  },
  {
    id: 'lr3-p1-04', test: 3, part: 1, accent: 'ca',
    picture: 'A car dealership showroom with polished floors. A salesperson in a blue suit stands beside a silver sedan, gesturing toward the open trunk. A couple examines the interior of a red SUV parked nearby, and a large window at the back looks out onto a row of parked cars. Bright ceiling lights reflect on the shiny car hoods.',
    questions: [
      {
        n: 4, q: '', type: 'photo-person',
        options: ['A couple is test-driving a red SUV.', 'A mechanic is repairing a silver car.', 'The cars are being washed outside the showroom.', 'A salesperson is pointing at the open trunk of a sedan.'],
        answer: 3,
        explain: 'Đáp án đúng (D): ảnh mô tả "a salesperson ... gesturing toward the open trunk", nên "pointing at the open trunk" là cách diễn đạt tương đương. (A) là bẫy suy diễn — cặp đôi chỉ đang xem nội thất, chưa có cảnh lái thử. (B) là bẫy nhầm nhân vật (Subject trap) — người mặc vest là nhân viên bán hàng, không phải thợ máy (mechanic). (C) là bẫy liên tưởng — có xe hơi thì thường được rửa nhưng ảnh không thể hiện điều này.'
      }
    ],
    vi: 'Một phòng trưng bày đại lý xe hơi với sàn bóng loáng. Một nhân viên bán hàng mặc vest xanh đứng cạnh chiếc sedan màu bạc, chỉ tay về phía cốp xe đang mở. Một cặp đôi xem nội thất chiếc SUV đỏ đỗ gần đó, và một ô cửa sổ lớn phía sau nhìn ra dãy xe đang đỗ. Đèn trần sáng rực phản chiếu trên nắp ca-pô bóng loáng.',
    vocab: ['dealership – đại lý (bán xe)', 'showroom – phòng trưng bày', 'sedan – xe sedan', 'SUV – xe thể thao đa dụng']
  },
  {
    id: 'lr3-p1-05', test: 3, part: 1, accent: 'us',
    picture: 'A corporate boardroom on the top floor. Five people in business attire sit around a long oval table. A woman at the head of the table stands and points to a bar chart projected on a large screen. Open laptops, water glasses and a plate of pastries sit on the table, and a city skyline is visible through the floor-to-ceiling windows behind her.',
    questions: [
      {
        n: 5, q: '', type: 'photo-person',
        options: ['A woman is presenting a chart to the group.', 'The employees are eating pastries around the table.', 'A man is cleaning the large screen.', 'The group is looking at the city skyline.'],
        answer: 0,
        explain: 'Đáp án đúng (A): ảnh có "a woman ... points to a bar chart projected on a large screen", hành động thuyết trình (presenting) là mô tả bao quát đúng. (B) là bẫy lặp từ — có đĩa bánh ngọt (pastries) trên bàn nhưng không ai đang ăn. (C) là bẫy hành động sai — không có ai lau màn hình. (D) là bẫy nhầm hướng nhìn — mọi người đang tập trung vào biểu đồ chứ không nhìn ra ngoài cửa sổ ngắm đường chân trời.'
      }
    ],
    vi: 'Một phòng họp hội đồng quản trị ở tầng cao nhất. Năm người mặc đồ công sở ngồi quanh bàn oval dài. Một phụ nữ ở đầu bàn đứng lên chỉ vào biểu đồ cột được chiếu trên màn hình lớn. Laptop mở, ly nước và đĩa bánh ngọt đặt trên bàn, và đường chân trời thành phố hiện qua cửa sổ cao từ sàn đến trần phía sau cô.',
    vocab: ['boardroom – phòng họp hội đồng', 'bar chart – biểu đồ cột', 'project – chiếu (hình)', 'skyline – đường chân trời (thành phố)']
  },
  {
    id: 'lr3-p1-06', test: 3, part: 1, accent: 'uk',
    picture: 'A hotel banquet hall being set up for a wedding reception. Two staff members in white shirts arrange round tables with white tablecloths. A woman in a dark dress places name cards on a long table near the stage, and a stack of folded napkins sits on a cart. Round lights hang from the ceiling, and a large window with curtains covers the back wall.',
    questions: [
      {
        n: 6, q: '', type: 'photo-object',
        options: ['The staff are arranging tables with white tablecloths.', 'The napkins are being folded on a cart.', 'A woman is placing name cards near the stage.', 'The curtains are being taken down from the window.'],
        answer: 2,
        explain: 'Đáp án đúng (C): ảnh có "a woman ... places name cards on a long table near the stage", nên đáp án này khớp hoàn toàn. (A) là bẫy nhầm chủ thể — đúng là nhân viên đang sắp bàn nhưng câu hỏi thường tập trung vào một hành động đặc thù hơn, và (C) mô tả chi tiết hơn. (B) là bẫy sai trạng thái — khăn ăn đã được gấp sẵn (folded) chứ không phải đang được gấp (being folded). (D) là bẫy hành động ngược — rèm đang che cửa sổ chứ không phải đang bị tháo xuống.'
      }
    ],
    vi: 'Một phòng tiệc khách sạn đang được chuẩn bị cho tiệc cưới. Hai nhân viên mặc áo trắng đang sắp các bàn tròn phủ khăn trải bàn trắng. Một phụ nữ mặc váy tối đặt thẻ tên lên bàn dài gần sân khấu, và một chồng khăn ăn gấp sẵn đặt trên xe đẩy. Đèn tròn treo trên trần, và một ô cửa sổ lớn có rèm che phủ bức tường phía sau.',
    vocab: ['banquet hall – phòng tiệc', 'tablecloth – khăn trải bàn', 'name card – thẻ tên', 'folded napkins – khăn ăn gấp']
  },

  // ===================== PART 2 — QUESTION-RESPONSE (câu 7–31) =====================
  {
    id: 'lr3-p2-01', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'W', text: 'When will the new product catalog be available in the lobby?' }],
    questions: [
      {
        n: 7, q: '', type: 'wh-question',
        options: ['The catalog has about sixty pages.', 'It will be there starting next Monday.', 'Yes, I picked one up yesterday.'],
        answer: 1,
        explain: 'Câu hỏi WH "When" yêu cầu thông tin về thời gian. Đáp án (B) nêu mốc thời gian "starting next Monday" là chính xác. (A) là bẫy lặp từ (Repeated word) — dùng lại từ "catalog" nhưng trả lời về số trang, không khớp yêu cầu hỏi "khi nào". (C) là bẫy sai loại câu hỏi (Wrong question type) — bắt đầu bằng "Yes" là cách trả lời cho câu hỏi Yes/No, không dùng cho câu hỏi WH.'
      }
    ],
    vi: 'Khi nào danh mục sản phẩm mới sẽ có ở sảnh? — Nó sẽ có ở đó bắt đầu từ thứ Hai tới.',
    vocab: ['catalog – danh mục (sản phẩm)', 'lobby – sảnh', 'available – có sẵn']
  },
  {
    id: 'lr3-p2-02', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'M', text: 'Did the catering company confirm the menu for the gala?' }],
    questions: [
      {
        n: 8, q: '', type: 'yes-no',
        options: ['The gala starts at seven in the evening.', 'Yes, they emailed the final menu this morning.', 'I will book the catering next week.'],
        answer: 1,
        explain: 'Câu hỏi Yes/No bắt đầu bằng trợ động từ "Did" để xác nhận một việc đã xảy ra. Đáp án (B) xác nhận bằng "Yes" và cung cấp thêm chi tiết bổ trợ "emailed ... this morning". (A) là bẫy lặp từ "gala" nhưng lại trả lời về thời gian bắt đầu tiệc. (C) là bẫy sai thì (Wrong tense) — câu hỏi hỏi về việc đã làm (quá khứ), đáp án lại nói về dự định tương lai.'
      }
    ],
    vi: 'Công ty cung cấp suất ăn đã xác nhận thực đơn cho buổi gala chưa? — Rồi, họ đã gửi email thực đơn cuối sáng nay.',
    vocab: ['catering company – công ty cung cấp suất ăn', 'gala – buổi gala (tiệc lớn)', 'confirm – xác nhận']
  },
  {
    id: 'lr3-p2-03', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Would you rather hold the seminar in the morning or in the afternoon?' }],
    questions: [
      {
        n: 9, q: '', type: 'choice',
        options: ['The morning slot works better for most attendees.', 'The seminar room is on the second floor.', 'Yes, I attended the last seminar.'],
        answer: 0,
        explain: 'Câu hỏi lựa chọn (Choice question) cung cấp hai phương án "morning" và "afternoon". Đáp án (A) chọn phương án sáng (morning slot) và giải thích lý do. (B) là bẫy lặp từ "seminar" nhưng trả lời về vị trí phòng họp. (C) là bẫy trả lời Yes/No — câu hỏi lựa chọn không bao giờ trả lời bằng Yes hoặc No.'
      }
    ],
    vi: 'Bạn muốn tổ chức hội thảo vào buổi sáng hay buổi chiều? — Khung giờ sáng phù hợp hơn với đa số người tham dự.',
    vocab: ['seminar – hội thảo', 'slot – khung giờ', 'attendee – người tham dự']
  },
  {
    id: 'lr3-p2-04', test: 3, part: 2, accent: 'au',
    script: [{ sp: 'W', text: 'Would you mind watering the plants in the reception area while I am away?' }],
    questions: [
      {
        n: 10, q: '', type: 'suggestion-request',
        options: ['The plants are kept near the window.', 'I watered them early this morning.', 'No problem, I will take care of them.'],
        answer: 2,
        explain: 'Cấu trúc "Would you mind...?" là một lời yêu cầu lịch sự. Đáp án (C) "No problem" là cách đồng ý giúp đỡ phổ biến. (A) là bẫy lặp từ "plants" nhưng nói về vị trí thay vì nhận lời giúp. (B) là bẫy sai thì và sai logic — người hỏi nhờ tưới cây trong tương lai khi họ đi vắng, đáp án lại nói đã tưới rồi.'
      }
    ],
    vi: 'Bạn tưới cây ở khu vực lễ tân giúp tôi khi tôi đi vắng được không? — Không vấn đề gì, tôi sẽ lo chúng.',
    vocab: ['water – tưới (cây)', 'reception area – khu lễ tân', 'take care of – chăm sóc, lo']
  },
  {
    id: 'lr3-p2-05', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'M', text: 'The fire alarm system will be tested tomorrow at ten o clock.' }],
    questions: [
      {
        n: 11, q: '', type: 'statement',
        options: ['Where was the alarm system purchased?', 'Thank you, I will make a note of it.', 'The system was installed late last year.'],
        answer: 1,
        explain: 'Câu trần thuật (Statement) đưa ra một thông báo. Đáp án (B) là lời phản hồi tự nhiên, xác nhận đã nhận được thông tin ("make a note of it"). (A) là bẫy lặp từ "alarm system" nhưng lại đặt một câu hỏi không liên quan. (C) là bẫy liên tưởng (Association trap) — nhắc đến việc lắp đặt hệ thống nhưng không phản hồi ý nghĩa của thông báo kiểm tra.'
      }
    ],
    vi: 'Hệ thống báo cháy sẽ được kiểm tra ngày mai lúc mười giờ. — Cảm ơn, tôi sẽ ghi chú lại.',
    vocab: ['fire alarm – báo cháy', 'test – kiểm tra, thử', 'make a note – ghi chú']
  },
  {
    id: 'lr3-p2-06', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Let me check the delivery status with the warehouse and I will update you shortly.' }],
    questions: [
      {
        n: 12, q: '', type: 'indirect',
        options: ['The warehouse is quite far from here.', 'Where is the warehouse manager right now?', 'Thanks, I will wait for your update.'],
        answer: 2,
        explain: 'Câu nói bắt đầu bằng "Let me..." là một lời hứa hoặc đề nghị thực hiện hành động. Đáp án (C) phản hồi bằng cách cảm ơn và chấp nhận lời đề nghị đó. (A) và (B) đều là bẫy lặp từ "warehouse" nhưng đi sâu vào chi tiết vị trí hoặc nhân sự, không đáp lại nội dung cốt lõi là việc cập nhật thông tin.'
      }
    ],
    vi: 'Để tôi kiểm tra tình trạng giao hàng với kho rồi cập nhật cho bạn ngay. — Cảm ơn, tôi sẽ chờ cập nhật của bạn.',
    vocab: ['delivery status – tình trạng giao hàng', 'warehouse – nhà kho', 'update – cập nhật (thông tin)']
  },
  {
    id: 'lr3-p2-07', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Where can I find the first aid kit in this building?' }],
    questions: [
      {
        n: 13, q: '', type: 'wh-question',
        options: ['The building has eight floors.', 'It is in the cabinet beside the elevator.', 'Yes, every floor has a first aid kit.'],
        answer: 1,
        explain: 'Câu hỏi "Where" yêu cầu chỉ nơi chốn. Đáp án (B) chỉ rõ vị trí "in the cabinet beside the elevator". (A) là bẫy lặp từ "building" nhưng trả lời về số tầng. (C) là bẫy sai loại câu hỏi — trả lời "Yes" cho câu hỏi WH là sai cấu trúc giao tiếp TOEIC.'
      }
    ],
    vi: 'Tôi có thể tìm hộp cứu thương ở đâu trong tòa nhà này? — Nó ở trong tủ cạnh thang máy.',
    vocab: ['first aid kit – hộp cứu thương', 'cabinet – tủ', 'elevator – thang máy']
  },
  {
    id: 'lr3-p2-08', test: 3, part: 2, accent: 'au',
    script: [{ sp: 'W', text: 'Is the shuttle bus to the airport running every thirty minutes today?' }],
    questions: [
      {
        n: 14, q: '', type: 'yes-no',
        options: ['Yes, it runs every thirty minutes as usual.', 'The shuttle seats about twenty people.', 'I usually drive to the airport myself.'],
        answer: 0,
        explain: 'Câu hỏi xác nhận tần suất hoạt động của xe buýt. Đáp án (A) xác nhận đúng tần suất được hỏi. (B) là bẫy lặp từ "shuttle" nhưng nói về sức chứa thay vì tần suất. (C) là bẫy liên tưởng chủ đề sân bay (airport) nhưng là một ý kiến cá nhân không trả lời trực tiếp câu hỏi.'
      }
    ],
    vi: 'Hôm nay xe đưa rước ra sân bay có chạy mỗi ba mươi phút một chuyến không? — Có, nó chạy mỗi ba mươi phút như thường lệ.',
    vocab: ['shuttle bus – xe đưa rước', 'run – (xe) chạy, hoạt động', 'as usual – như thường lệ']
  },
  {
    id: 'lr3-p2-09', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'M', text: 'Should we renew the software license for another year or switch to a cheaper plan?' }],
    questions: [
      {
        n: 15, q: '', type: 'choice',
        options: ['Switching to the cheaper plan saves us money.', 'The license expires at the end of the month.', 'Yes, we renewed it last year.'],
        answer: 0,
        explain: 'Câu hỏi lựa chọn giữa "renew" và "switch". Đáp án (A) chọn phương án chuyển đổi và nêu lợi ích tài chính. (B) là bẫy lặp từ "license" nhưng chỉ thông báo ngày hết hạn. (C) là bẫy trả lời Yes/No — lỗi kinh điển khi gặp câu hỏi lựa chọn.'
      }
    ],
    vi: 'Chúng ta nên gia hạn giấy phép phần mềm thêm một năm hay chuyển sang gói rẻ hơn? — Chuyển sang gói rẻ hơn giúp chúng ta tiết kiệm tiền.',
    vocab: ['license – giấy phép', 'renew – gia hạn', 'switch – chuyển (sang)']
  },
  {
    id: 'lr3-p2-10', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Could you please reserve a window table for the client lunch on Friday?' }],
    questions: [
      {
        n: 16, q: '', type: 'suggestion-request',
        options: ['The restaurant is near the train station.', 'I reserved a table there last week.', 'Of course, I will call the restaurant right now.'],
        answer: 2,
        explain: 'Lời yêu cầu "Could you please...?" cần một câu trả lời xác nhận hành động. Đáp án (C) nhận lời và hứa thực hiện ngay. (A) là bẫy liên tưởng nhà hàng nhưng nói về vị trí. (B) là bẫy sai thì — việc đặt bàn trong quá khứ không giúp ích cho yêu cầu vào thứ Sáu tới.'
      }
    ],
    vi: 'Bạn đặt bàn cạnh cửa sổ cho bữa trưa với khách vào thứ Sáu được không? — Được chứ, tôi sẽ gọi nhà hàng ngay bây giờ.',
    vocab: ['reserve – đặt (bàn)', 'window table – bàn cạnh cửa sổ', 'client lunch – bữa trưa với khách']
  },
  {
    id: 'lr3-p2-11', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'The parking lot on the east side is closed for resurfacing this weekend.' }],
    questions: [
      {
        n: 17, q: '', type: 'statement',
        options: ['How many spaces does the east lot have?', 'I will use the lot on the west side instead.', 'The lot was resurfaced late last summer.'],
        answer: 1,
        explain: 'Thông báo về việc đóng cửa bãi đỗ xe. Đáp án (B) đưa ra phương án giải quyết thay thế ("use the lot on the west side"). (A) là bẫy lặp từ "east lot" nhưng đặt câu hỏi về sức chứa. (C) là bẫy sai logic — thông báo nói bãi đỗ đang đóng để trải nhựa, đáp án lại nói việc đó đã làm xong từ năm ngoái.'
      }
    ],
    vi: 'Bãi đỗ xe phía đông đóng cửa để trải nhựa lại vào cuối tuần này. — Vậy tôi sẽ dùng bãi phía tây thay vào đó.',
    vocab: ['parking lot – bãi đỗ xe', 'resurface – trải nhựa lại', 'instead – thay vào đó']
  },
  {
    id: 'lr3-p2-12', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'I will review the contract and send you my comments by the end of the day.' }],
    questions: [
      {
        n: 18, q: '', type: 'indirect',
        options: ['The contract has about fifteen pages.', 'Where is the contract stored now?', 'That sounds good, thank you.'],
        answer: 2,
        explain: 'Lời hứa thực hiện hành động ("I will review..."). Đáp án (C) phản hồi bằng cách ghi nhận và cảm ơn. (A) và (B) là bẫy lặp từ "contract" nhưng cung cấp hoặc hỏi những thông tin không liên quan đến việc xem xét và gửi góp ý.'
      }
    ],
    vi: 'Tôi sẽ xem hợp đồng và gửi bạn góp ý trước cuối ngày. — Nghe hay đấy, cảm ơn bạn.',
    vocab: ['review – xem xét', 'contract – hợp đồng', 'comment – góp ý, bình luận']
  },
  {
    id: 'lr3-p2-13', test: 3, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'How much does it cost to ship a large package overseas?' }],
    questions: [
      {
        n: 19, q: '', type: 'wh-question',
        options: ['It costs about eighty dollars by air.', 'The package weighs around five kilograms.', 'Yes, we ship overseas every week.'],
        answer: 0,
        explain: 'Câu hỏi "How much" hỏi về chi phí. Đáp án (A) nêu con số cụ thể "eighty dollars". (B) là bẫy lặp từ "package" nhưng trả lời về trọng lượng. (C) là bẫy trả lời Yes/No cho câu hỏi WH.'
      }
    ],
    vi: 'Gửi một gói hàng lớn ra nước ngoài tốn bao nhiêu? — Khoảng tám mươi đô nếu gửi đường hàng không.',
    vocab: ['ship – gửi (hàng)', 'package – gói hàng', 'overseas – ra nước ngoài']
  },
  {
    id: 'lr3-p2-14', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Did you receive the revised floor plan from the architect?' }],
    questions: [
      {
        n: 20, q: '', type: 'yes-no',
        options: ['The architect is on a business trip.', 'Yes, it arrived in my inbox this morning.', 'I will send the plan to the builder tomorrow.'],
        answer: 1,
        explain: 'Câu hỏi xác nhận việc nhận tài liệu. Đáp án (B) xác nhận "Yes" và nói rõ phương thức/thời điểm nhận. (A) là bẫy lặp từ "architect" nhưng nói về tình trạng đi công tác của họ. (C) là bẫy sai thì — trả lời về việc sẽ làm trong tương lai thay vì xác nhận việc đã xảy ra.'
      }
    ],
    vi: 'Bạn đã nhận bản vẽ mặt bằng đã sửa từ kiến trúc sư chưa? — Rồi, nó đến hộp thư của tôi sáng nay.',
    vocab: ['floor plan – bản vẽ mặt bằng', 'architect – kiến trúc sư', 'inbox – hộp thư đến']
  },
  {
    id: 'lr3-p2-15', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Which of the three suppliers offers the fastest delivery?' }],
    questions: [
      {
        n: 21, q: '', type: 'choice',
        options: ['The one that delivers within two business days.', 'The suppliers are based in different cities.', 'Yes, we work with three suppliers.'],
        answer: 0,
        explain: 'Câu hỏi lựa chọn (Which) yêu cầu xác định một đối tượng trong nhóm. Đáp án (A) xác định nhà cung cấp thông qua tiêu chí thời gian giao hàng. (B) là bẫy lặp từ "suppliers" nhưng nói về vị trí địa lý. (C) là bẫy trả lời Yes/No — lỗi thường gặp khi người nghe chỉ bắt được từ khóa "three suppliers".'
      }
    ],
    vi: 'Trong ba nhà cung cấp, nhà nào giao hàng nhanh nhất? — Nhà giao trong vòng hai ngày làm việc.',
    vocab: ['supplier – nhà cung cấp', 'delivery – việc giao hàng', 'business day – ngày làm việc']
  },
  {
    id: 'lr3-p2-16', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'Would you like to join the team for a farewell dinner for our retiring manager?' }],
    questions: [
      {
        n: 22, q: '', type: 'suggestion-request',
        options: ['The manager is retiring at the end of the month.', 'I organized the last farewell dinner.', 'Yes, I would love to. Where is it being held?'],
        answer: 2,
        explain: 'Lời mời (Invitation) "Would you like to join...?". Đáp án (C) chấp nhận lời mời và hỏi thêm thông tin địa điểm. (A) là bẫy lặp từ nhưng chỉ thông báo thời gian nghỉ hưu. (B) là bẫy sai thì và lạc đề — kể về việc đã làm thay vì phản hồi lời mời hiện tại.'
      }
    ],
    vi: 'Bạn có muốn cùng nhóm đi ăn tối chia tay vị quản lý nghỉ hưu không? — Vâng, tôi rất muốn. Nó được tổ chức ở đâu?',
    vocab: ['farewell dinner – bữa tối chia tay', 'retire – nghỉ hưu', 'be held – được tổ chức']
  },
  {
    id: 'lr3-p2-17', test: 3, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'The annual shareholders meeting has been moved to the main auditorium.' }],
    questions: [
      {
        n: 23, q: '', type: 'statement',
        options: ['Thanks for letting me know, I will update the calendar.', 'How many shareholders attended last year?', 'The meeting was held in the same room last year.'],
        answer: 0,
        explain: 'Thông báo về sự thay đổi địa điểm. Đáp án (A) cảm ơn và hứa cập nhật lịch trình là phản hồi cực kỳ tự nhiên trong môi trường công sở. (B) là bẫy liên tưởng "shareholders" nhưng hỏi về số lượng người dự năm ngoái. (C) là bẫy lặp từ "meeting" nhưng nói về quá khứ, không quan tâm đến sự thay đổi hiện tại.'
      }
    ],
    vi: 'Đại hội cổ đông thường niên đã được chuyển sang hội trường chính. — Cảm ơn đã báo, tôi sẽ cập nhật lịch.',
    vocab: ['shareholders meeting – đại hội cổ đông', 'auditorium – hội trường', 'update the calendar – cập nhật lịch']
  },
  {
    id: 'lr3-p2-18', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Let me contact the travel agency and I will send you the itinerary this afternoon.' }],
    questions: [
      {
        n: 24, q: '', type: 'indirect',
        options: ['The travel agency is on the fifth floor.', 'Great, I will look forward to it.', 'Where did you book the hotel?'],
        answer: 1,
        explain: 'Lời hứa cung cấp thông tin. Đáp án (B) thể hiện sự mong chờ thông tin đó là cách phản hồi tích cực. (A) là bẫy lặp từ "travel agency" nhưng nói về vị trí. (C) là bẫy liên tưởng du lịch (hotel) nhưng là một câu hỏi không liên quan đến việc gửi lịch trình.'
      }
    ],
    vi: 'Để tôi liên hệ đại lý du lịch rồi gửi bạn lịch trình chiều nay. — Tuyệt, tôi sẽ mong chờ.',
    vocab: ['travel agency – đại lý du lịch', 'itinerary – lịch trình (chuyến đi)', 'look forward to – mong chờ']
  },
  {
    id: 'lr3-p2-19', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'Why was the training workshop rescheduled to next Thursday?' }],
    questions: [
      {
        n: 25, q: '', type: 'wh-question',
        options: ['The workshop will last about three hours.', 'Yes, I will attend on Thursday.', 'The main speaker is flying in from abroad that day.'],
        answer: 2,
        explain: 'Câu hỏi "Why" yêu cầu một lý do. Đáp án (C) nêu lý do cụ thể là diễn giả bay từ nước ngoài về. (A) là bẫy lặp từ "workshop" nhưng trả lời về thời lượng. (B) là bẫy trả lời Yes/No cho câu hỏi WH — lỗi sai cơ bản cần tránh.'
      }
    ],
    vi: 'Vì sao buổi tập huấn bị dời sang thứ Năm tới? — Vì diễn giả chính bay từ nước ngoài về vào ngày đó.',
    vocab: ['workshop – buổi tập huấn', 'reschedule – dời lịch', 'fly in – bay đến']
  },
  {
    id: 'lr3-p2-20', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'Are employees allowed to use the gym after seven in the evening?' }],
    questions: [
      {
        n: 26, q: '', type: 'yes-no',
        options: ['The gym has new equipment this year.', 'Yes, they can use it until nine on weekdays.', 'I usually go to the gym before work.'],
        answer: 1,
        explain: 'Câu hỏi xác nhận quy định. Đáp án (B) xác nhận "Yes" và bổ sung khung giờ cho phép. (A) là bẫy lặp từ "gym" nhưng nói về thiết bị. (C) là bẫy liên tưởng thói quen cá nhân, không trả lời được quy định chung cho nhân viên.'
      }
    ],
    vi: 'Nhân viên có được dùng phòng gym sau bảy giờ tối không? — Có, họ có thể dùng đến chín giờ vào các ngày trong tuần.',
    vocab: ['employee – nhân viên', 'be allowed to – được phép', 'weekday – ngày trong tuần']
  },
  {
    id: 'lr3-p2-21', test: 3, part: 2, accent: 'au',
    script: [{ sp: 'M', text: 'Would you prefer the corner office or the one facing the park?' }],
    questions: [
      {
        n: 27, q: '', type: 'choice',
        options: ['I would prefer the one facing the park, please.', 'The corner office is larger than the others.', 'Yes, I have visited both offices.'],
        answer: 0,
        explain: 'Câu hỏi lựa chọn giữa hai vị trí văn phòng. Đáp án (A) chọn một phương án cụ thể. (B) là bẫy lặp từ và cung cấp thông tin so sánh không được yêu cầu. (C) là bẫy trả lời Yes/No cho câu hỏi lựa chọn.'
      }
    ],
    vi: 'Bạn thích phòng góc hay phòng nhìn ra công viên? — Tôi thích phòng nhìn ra công viên, làm ơn.',
    vocab: ['corner office – phòng góc', 'face – nhìn ra, hướng ra', 'prefer – thích hơn']
  },
  {
    id: 'lr3-p2-22', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'W', text: 'Can you send the revised budget to the finance team before the meeting?' }],
    questions: [
      {
        n: 28, q: '', type: 'suggestion-request',
        options: ['The budget has about eight sections.', 'I will email it to them right away.', 'I sent the old budget to them last week.'],
        answer: 1,
        explain: 'Lời yêu cầu thực hiện hành động gửi tài liệu. Đáp án (B) nhận lời và khẳng định sẽ gửi ngay (email it right away). (A) là bẫy lặp từ "budget" nhưng mô tả cấu trúc tài liệu. (C) là bẫy sai thì — việc gửi bản cũ không đáp ứng yêu cầu gửi bản đã sửa hiện tại.'
      }
    ],
    vi: 'Bạn gửi ngân sách đã sửa cho nhóm tài chính trước cuộc họp được không? — Tôi sẽ gửi email cho họ ngay.',
    vocab: ['revised – đã sửa, đã điều chỉnh', 'budget – ngân sách', 'finance team – nhóm tài chính']
  },
  {
    id: 'lr3-p2-23', test: 3, part: 2, accent: 'us',
    script: [{ sp: 'M', text: 'The new security policy requires all visitors to sign in at the front desk.' }],
    questions: [
      {
        n: 29, q: '', type: 'statement',
        options: ['Where is the front desk located?', 'The policy was introduced late last year.', 'I will make sure our guests know about it.'],
        answer: 2,
        explain: 'Thông báo về chính sách mới. Đáp án (C) phản hồi bằng một hành động trách nhiệm phù hợp với thông báo. (A) là bẫy lặp từ "front desk" nhưng lại hỏi vị trí. (B) là bẫy mâu thuẫn — thông báo nói chính sách mới (new), đáp án lại nói nó đã có từ năm ngoái.'
      }
    ],
    vi: 'Chính sách an ninh mới yêu cầu tất cả khách đăng nhập ở quầy lễ tân. — Tôi sẽ đảm bảo khách của chúng ta biết điều đó.',
    vocab: ['security policy – chính sách an ninh', 'sign in – đăng nhập, ghi tên', 'front desk – quầy lễ tân']
  },
  {
    id: 'lr3-p2-24', test: 3, part: 2, accent: 'uk',
    script: [{ sp: 'W', text: 'I will look into the billing error and call you back within the hour.' }],
    questions: [
      {
        n: 30, q: '', type: 'indirect',
        options: ['Thank you, I appreciate your help.', 'The billing system was updated last month.', 'How much was the bill for?'],
        answer: 0,
        explain: 'Lời hứa giải quyết vấn đề. Đáp án (A) phản hồi bằng lời cảm ơn và đánh giá cao sự giúp đỡ. (B) là bẫy lặp từ "billing" nhưng nói về hệ thống thay vì phản hồi lời hứa. (C) là bẫy liên tưởng hỏi về số tiền, không đáp lại ý định giúp đỡ của người nói.'
      }
    ],
    vi: 'Tôi sẽ xem lỗi hoá đơn rồi gọi lại cho bạn trong vòng một giờ. — Cảm ơn, tôi rất cảm kích sự giúp đỡ của bạn.',
    vocab: ['billing error – lỗi hoá đơn', 'look into – xem xét, điều tra', 'appreciate – đánh giá cao, cảm kích']
  },
  {
    id: 'lr3-p2-25', test: 3, part: 2, accent: 'ca',
    script: [{ sp: 'M', text: 'What time does the guided tour of the museum start on Sundays?' }],
    questions: [
      {
        n: 31, q: '', type: 'wh-question',
        options: ['The museum has three floors.', 'Yes, the tour is free on Sundays.', 'It starts at two in the afternoon.'],
        answer: 2,
        explain: 'Câu hỏi "What time" yêu cầu mốc giờ cụ thể. Đáp án (C) nêu rõ "two in the afternoon". (A) là bẫy lặp từ "museum" nhưng nói về số tầng. (B) là bẫy trả lời Yes/No cho câu hỏi WH, dù có lặp lại từ khóa "tour/Sundays".'
      }
    ],
    vi: 'Chuyến tham quan có hướng dẫn của bảo tàng bắt đầu lúc mấy giờ vào Chủ nhật? — Nó bắt đầu lúc hai giờ chiều.',
    vocab: ['guided tour – chuyến tham quan có hướng dẫn', 'museum – bảo tàng', 'start – bắt đầu']
  }
);
