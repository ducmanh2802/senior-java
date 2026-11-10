/* Topics: banking — Nghiệp vụ ngân hàng cho Java dev. Format: see AGENTS.md. Owner: task T618. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'banking-001',
  topic: 'banking',
  level: 'mid',
  q: 'Core banking là gì, và các hệ thống xung quanh như kênh số, thẻ, thanh toán, CRM nói chuyện với core thế nào? Tại sao core thường phải chạy batch cuối ngày (EOD)?',
  a: `**Tóm tắt:** Core banking là hệ thống lõi của ngân hàng, nơi lưu sổ cái tài khoản của mọi khách hàng (số dư, lịch sử giao dịch) và là nơi duy nhất quyết định "tài khoản này còn bao nhiêu tiền". Kênh số (app, internet banking), hệ thống thẻ, hệ thống thanh toán và CRM gọi vào core để tra số dư, trừ hoặc cộng tiền. Core thường chạy một vòng batch cuối ngày (End of Day) để đối sàng, tính lãi và đóng sổ cái, vì cập nhật hàng nghìn giao dịch theo thời gian thực đồng loạt sẽ quá nặng và dễ sai.

### Core banking là gì (giải thích từ đầu)
Hãy tưởng tượng sổ cái tay của một cửa hàng tạp hóa: mỗi khi bán hàng, chủ hàng ghi một dòng "nhận 50.000 đồng". Core banking chính là sổ cái điện tử của toàn ngân hàng, phục vụ hàng triệu khách hàng và phải chính xác từng đồng. Mỗi khách hàng có một hoặc nhiều tài khoản (tiết kiệm, chèque, tiền gửi...), mỗi tài khoản có số dư và danh sách giao dịch.
- **Số dư:** tổng tiền hiện có trong tài khoản, được cập nhật sau mỗi giao dịch thành công.
- **Giao dịch:** một sự biến động tiền, ví dụ "nạp 1 triệu", "trừ 200.000", "chuyển 500.000 sang tài khoản khác".
- **Sổ cái:** sổ lưu mọi ghi chép về tiền, không bao giờ xóa dòng cũ, chỉ thêm dòng mới.
Ví dụ: khách hàng A có tài khoản số dư 10 triệu. A dùng app chuyển 2 triệu cho B. Core banking phải kiểm tra A đủ tiền, rồi trừ 2 triệu ở A và cộng 2 triệu ở B; nếu một bên thất bại thì cả hai phải thất bại (không được A bị trừ mà B không nhận).

### Các hệ thống xung quanh và cách gọi core
Một ngân hàng không chỉ có core. Có nhiều hệ thống chuyên biệt, mỗi hệ thống đảm nhận một việc, rồi gọi vào core khi cần tác động đến tiền:
- **Kênh số:** app di động, internet banking. Đây là cửa sổ khách hàng tương tác.
- **Hệ thống thẻ:** quản lý thẻ ghi nợ/thẻ tín dụng, xét hạn mức khi thanh toán.
- **Hệ thống thanh toán:** xử lý chuyển khoản nội bộ, liên ngân hàng, trả hóa đơn.
- **CRM:** lưu thông tin khách hàng (họ tên, địa chỉ, lịch sử liên lạc), không lưu số dư tài khoản.

Luồng típ của "xem số dư qua app":
1. Khách mở app, nhấn "Xem số dư".
2. App gửi yêu cầu qua Internet đến API Gateway (cổng vào của ngân hàng, kiểm tra bảo mật, giới hạn tốc độ).
3. Gateway gửi đến dịch vụ tài khoản (microservice xử lý nghiệp vụ tài khoản).
4. Dịch vụ tài khoản gọi Core banking qua giao diện chuẩn hóa (thường là hàng đợi tin nhắn hoặc API nội bộ), hỏi "số dư của khách A là bao nhiêu".
5. Core đọc số dư từ cơ sở dữ liệu và trả về: dịch vụ → gateway → app hiển thị cho khách.

~~~seq
title: Khách xem số dư qua app
actors: Khách | App | Gateway | Core | DB
Khách -> App: mở app, nhấn xem số dư
App -> Gateway: GET số dư tài khoản
Gateway -> Core: tra cứu số dư khách A
Core -> DB: đọc số dư
DB --> Core: trả về 10.000.000 VND
Core --> Gateway: 10.000.000 VND
Gateway --> App: 200 OK + số dư
App --> Khách: hiển thị 10.000.000 VND
~~~

### Tại sao core thường chạy batch cuối ngày (EOD)
Ngân hàng có hàng triệu giao dịch trong ngày. Nếu mỗi giao dịch đều cập nhật sổ cái và tính toán phức tạp ngay lập tức, hệ thống sẽ quá tải. Do đó, nhiều ngân hàng chia làm hai luồng:
- **Online (ngày):** chỉ làm những việc tối thiểu, khẩn cấp: kiểm tra số dư, trừ/cộng tiền cho giao dịch thực tế. Nhanh, ít can thiệp vào dữ liệu lịch sử.
- **Batch cuối ngày (EOD):** sau giờ đóng cửa, chạy một loạt công việc nặng trên toàn bộ dữ liệu ngày hôm nay:
  + Tổng kết số tiền về mỗi khách hàng.
  + Tính lãi cho tiền gửi và khoản vay.
  + Đối soát giao dịch nội bộ và với ngân hàng đối tác.
  + Đóng sổ cái ngày, đưa dữ liệu sang ngày mới.

Ví dụ: một ngân hàng trung bình có 500.000 giao dịch/ngày, EOD phải xử lý hết và tính lãi cho 2 triệu khoản tiền gửi; chạy batch vào đêm thì không ảnh hưởng khách hàng.

### Lỗi hay gặp
- Cho phép kênh số trực tiếp ghi vào bảng số dư của core, bỏ qua kiểm tra nghiệp vụ → sai số dư, mất kiểm soát.
- Không phân biệt giao dịch online và batch, chạy tính toán nặng vào giờ cao điểm → hệ thống chậm, khách không vào được app.
- Quên xử lý ngày lễ trong EOD → ngày hôm sau sai báo cáo, lãi tính sai.
- Ghi nhầm hướng ghi sổ cái (nợ/có) → phải khôi phục từ sao lưu, tốn nhiều giờ.

### Ví dụ đời thực

Một ngân hàng trung bình xử lý khoảng 500.000 giao dịch mỗi ngày. Một chiều, hơn trăm khách gọi trung tâm chăm sóc khách hàng khiếu nại số dư trong app hiển thị sai so với sổ sách riêng. Đội dev tra soát log dịch vụ tài khoản và thấy: các giao dịch nạp tiền trong chiều hôm qua đã được ghi vào core, nhưng vòng batch EOD (End of Day) hôm qua đã kết thúc trong khi một chi nhánh bị mất kết nối cơ sở dữ liệu nên sổ cái của chi nhánh đó chưa được đóng. Số dư cũ sai dẫn đến số dư hiển thị sai hôm nay. Nguyên nhân gốc: EOD chạy trên nhiều chi nhánh song song, nhưng không có bước kiểm tra "tất cả chi nhánh đều đã đóng" trước khi báo xong. Cách xử lý: chạy lại EOD cho chi nhánh bị thiếu, khôi phục số dư từ nhật ký giao dịch chi tiết, rồi bổ sung cờ kiểm tra trong job EOD: nếu bất kỳ chi nhánh nào chưa đóng thì toàn bộ job đánh dấu thất bại và gửi cảnh báo, không bao giờ báo "EOD xong" sai sự thật. Kết quả đo được: số case sai số dư giảm từ hơn trăm xuống không, và EOD luôn kết thúc trước 24 giờ tiếp theo.

### Trả lời mẫu khi phỏng vấn

"Core banking là sổ cái điện tử duy nhất của ngân hàng, lưu số dư và lịch sử giao dịch mọi tài khoản, và là nơi duy nhất quyết định "tài khoản còn bao nhiêu tiền". Các hệ thống xung quanh — app, internet banking, hệ thống thẻ, hệ thống thanh toán và CRM — chỉ gọi vào core để tra số dư hoặc tác động tiền, chưa bao giờ viết trực tiếp vào bảng số dư của core. Vì mỗi ngày có hàng trăm nghìn giao dịch, ngân hàng chia làm hai luồng: online trong ngày chỉ làm việc nhẹ, khẩn cấp; batch End of Day vào đêm xử lý nặng: tổng kết giao dịch, tính lãi, đối soát và đóng sổ cái. Khi nói về chuyển khoản liên ngân hàng, tôi nhấn mạnh mã tham chiếu duy nhất và không tự động retry khi timeout, để không bị trừ tiền hai lần."

> Senior tip: Trong phỏng vấn, hãy nhấn mạnh rằng core banking không phải "chỉ một database": đây là hệ thống nơi tính toàn vẹn dữ liệu quan trọng nhất của ngân hàng, mọi thay đổi số dư phải đi qua giao dịch ACID và khớp với sổ cái kế toán hàng ngày.

> Cụm từ: ACID là tập hợp 4 tính chất (Atomicity, Consistency, Isolation, Durability) đảm bảo giao dịch đúng và không bị hỏng kể cả khi máy mất điện giữa chừng.

  `,
  follow: [
    'Khi core banking bị quá tải, bạn sẽ chuyển phần nào sang batch và phần nào giữ online?',
    'Tại sao không cho phép CRM hoặc kênh số trực tiếp cập nhật số dư trong bảng core?',
    'Nếu EOD chạy trễ qua nửa đêm, giao dịch hôm sau sẽ ảnh hưởng thế nào?'
  ],
  tags: ['core banking', 'EOD', 'digital channel', 'batch processing']
},
{
  id: 'banking-002',
  topic: 'banking',
  level: 'mid',
  q: 'Chuyển khoản nhanh liên ngân hàng 24/7 (qua NAPAS) diễn ra thế nào ở mức khái niệm? Khi giao dịch bị timeout, xử lý thế nào — tại sao không tự động retry trừ tiền?',
  a: `**Tóm tắt:** Chuyển khoản nhanh liên ngân hàng 24/7 là dịch vụ cho phép khách gửi tiền từ ngân hàng này sang ngân hàng kia bất cứ lúc nào, kể cả cuối tuần và ngày lễ, tiền thường đến ngay hoặc trong vài giây. Ở Việt Nam, hệ thống này chạy qua NAPAS (một trung tâm thanh toán liên ngân hàng). Khi giao dịch bị timeout, dev không được tự động retry trừ tiền, vì có thể tiền đã được trừ ở bên gửi mà chưa kịp thông báo ở bên nhận; đúng cách là tra soát và hoàn tiền nếu cần.

### Chuyển khoản liên ngân hàng 24/7 là gì (giải thích từ đầu)
Thông thường, chuyển khoản giữa các ngân hàng chỉ làm trong giờ hành chính (sáng 7 giờ đến chiều 4 giờ, thứ 2 đến thứ 6). Khách muốn chuyển tiền lúc 22 giờ thứ 7 hay ngày chủ nhật thì không được. Dịch vụ chuyển khoản nhanh 24/7 xóa bỏ rào cản đó: khách có thể chuyển tiền bất cứ lúc nào, tiền thường đến ngay hoặc trong vài giây.

Ở Việt Nam, hệ thống này chạy qua NAPAS (Ngân hàng Napas - Trung tâm thanh toán liên ngân hàng). NAPAS làm vai trò "bưu điện điện tử" giữa các ngân hàng: ngân hàng gửi gói giao dịch đến NAPAS, NAPAS kiểm tra và chuyển tiền đến ngân hàng nhận, rồi thông báo kết quả về lại ngân hàng gửi.

Các thành viên liên quan:
- Ngân hàng gửi: ngân hàng của người gửi tiền.
- Ngân hàng nhận: ngân hàng của người nhận tiền.
- NAPAS: trung tâm chuyển tiền giữa các ngân hàng, kiểm tra danh sách số tài khoản, điều chuyển tiền.
- Khách gửi và khách nhận.

~~~seq
title: Chuyển khoản liên ngân hàng 24/7 qua NAPAS
actors: Khách gửi | Ngân hàng gửi | NAPAS | Ngân hàng nhận | Khách nhận
Khách gửi -> Ngân hàng gửi: yêu cầu chuyển tiền 5 triệu VND
Ngân hàng gửi -> NAPAS: gửi gói giao dịch
NAPAS -> Ngân hàng nhận: kiểm tra tài khoản và cập nhật số dư
Ngân hàng nhận --> NAPAS: chấp nhận, tiền đã đến
NAPAS --> Ngân hàng gửi: thông báo thành công
Ngân hàng gửi --> Khách gửi: thông báo đã chuyển xong
Ngân hàng nhận --> Khách nhận: thông báo nhận tiền
~~~

### Giao dịch bị timeout xử lý thế nào
Timeout là khi một yêu cầu gửi đi nhưng không nhận được phản hồi trong thời gian cho phép (ví dụ 10 giây). Có nhiều nguyên nhân: mạng bị lag, NAPAS quá tải, ngân hàng nhận mất điện, hoặc địa chỉ tài khoản sai.

Khi timeout, dev KHÔNG được tự động retry (gửi lại yêu cầu) và KHÔNG được tự động trừ tiền lại, vì:
1. Tiền có thể đã được trừ ở ngân hàng gửi nhưng thông báo bị mất đi, nếu retry thì khách bị trừ hai lần.
2. Tiền có thể đã được cộng ở ngân hàng nhận nhưng phản hồi bị mất, nếu retry thì người nhận nhận hai lần tiền.
3. Ngân hàng nhận có thể đã cho phép nhưng chưa cập nhật xong số dư, retry sẽ làm lỗi trạng thái.

Cách xử lý đúng:
- Bước 1: Không retry tự động. Đánh dấu giao dịch là "đang tra soát" (pending investigation).
- Bước 2: Tra soát: ngân hàng gửi truy vấn lại NAPAS hoặc ngân hàng nhận xem giao dịch đã được thực hiện chưa (theo mã tham chiếu duy nhất).
- Bước 3: Nếu đã được thực hiện -> cập nhật trạng thái thành "thành công", thông báo khách.
- Bước 4: Nếu chưa được thực hiện và đã qua thời gian cho phép -> hoàn tiền về tài khoản khách gửi (nếu đã trừ) và thông báo thất bại.
- Bước 5: Nếu không xác định được sau một số lần tra soát -> chuyển thành nhân viên kiểm tra tay, khách được liên hệ để biết kết quả.

Ví dụ số liệu: khách gửi 5 triệu lúc 20 giờ, hệ thống timeout sau 10 giây. Dev không gửi lại lệnh trừ. Sau 30 giây, tra soát: tiền đã được cộng ở ngân hàng nhận -> cập nhật "thành công", gửi SMS cho khách. Nếu sau 24 giờ vẫn không xác định được -> hoàn 5 triệu về A và mở ticket.

### Lỗi hay gặp
- Tự động retry khi timeout -> tiền bị trừ/cộng nhiều lần, sai số tài khoản.
- Quên lưu mã tham chiếu duy tiên (transaction ID) không thể tra soát -> giao dịch bị mất trong hệ thống, không tìm lại được.
- Thông báo thất bại cho khách ngay khi timeout, chưa tra soát xong -> khách hoang mang, gọi điện bàn chuyển.
- Không có giới hạn số lần tra soát -> giao dịch treo float trong hệ thống tháng năm, không bao giờ kết thúc.

### Ví dụ đời thực

Một khách gửi 5 triệu VND lúc 20 giờ, hệ thống báo timeout sau 10 giây. Dev không tự động gửi lại lệnh trừ tiền. Tra soát theo mã tham chiếu duy nhất: NAPAS xác nhận tiền đã được cộng vào tài khoản người nhận → cập nhật giao dịch thành "thành công" và gửi SMS cho khách. Nếu sau 24 giờ vẫn không xác định được → hoàn 5 triệu VND về tài khoản người gửi và mở ticket cho nhân viên kiểm tra tay. Nếu dev sai lầm tự động retry, tiền có thể bị trừ hai lần ở người gửi hoặc cộng hai lần ở người nhận, gây sai số lớn và khiếu nại.

### Trả lời mẫu khi phỏng vấn

"Chuyển khoản nhanh 24/7 qua NAPAS hoạt động như một bưu điện điện tử giữa ngân hàng gửi và ngân hàng nhận: ngân hàng gửi gói giao dịch, NAPAS kiểm tra và chuyển tiền, rồi thông báo kết quả về lại. Quan trọng nhất, khi giao dịch bị timeout tôi không bao giờ tự động retry hay tự động trừ tiền lại, vì tiền có thể đã bị trừ ở bên gửi hoặc đã được cộng ở bên nhận mà thông báo bị mất. Thay vào đó, tôi đánh dấu giao dịch là đang tra soát, truy vấn lại NAPAS bằng mã tham chiếu duy nhất, và chỉ hoàn tiền nếu sau thời gian quy định vẫn không xác định được. Đây là cách phân biệt at-most-once và at-least-once mà tôi áp dụng thực tế."

> Senior tip: Trái tim của chuyển khoản liên ngân hàng là "một giao dịch, một mã tham chiếu duy nhất, không bao giờ tự động thử lại khi lỗi". Trong phỏng vấn, nhấn mạnh: nếu không chấp nhận được rủi ro có thể tiền đã được xử lý ở bên kia, thì chưa được retry. Dev phải phân biệt "at-most-once" (gửi tối đa một lần, có thể bị mất) và "at-least-once" (gửi ít nhất một lần, có thể bị trùng) và chọn chế độ phù hợp.

> Cụm từ: Transaction ID (mã giao dịch) là chuỗi ký tự duy nhất gắn với mỗi giao dịch, do ngân hàng gửi tạo và mang theo đến NAPAS và ngân hàng nhận để tra cứu sau này.

  `,
  follow: [
    'Tại sao không được tự động retry khi giao dịch liên ngân hàng bị timeout?',
    'Mã tham chiếu duy nhất giúp tra soát giao dịch thế nào?',
    'Giao dịch đang tra soát quá một tháng, bạn xử lý thế nào?'
  ],
  tags: ['NAPAS', 'chuyen khoan lien ngan hang', 'timeout', 'tra sot']
},
{
  id: 'banking-003',
  topic: 'banking',
  level: 'senior',
  q: 'Thiết kế sổ cái kế toán kép cho ví/tài khoản tại sao phải append-only, và mỗi giao dịch ghi sao cho sổ cái luôn cân bằng?',
  a: `**Tóm tắt:** Sổ cái kế toán kép (double-entry ledger) lưu mọi sự biến động tiền dưới dạng các dòng ghi chép, mỗi giao dịch tạo ít nhất hai dòng (một bên trừ, một bên cộng) và tổng bằng không, để sổ cái luôn cân bằng. Sổ cái phải append-only: chỉ được thêm dòng mới, không được sửa hoặc xóa dòng cũ, để có đầy đủ lịch sử kiểm tra và phục hồi khi sai sót.

### Sổ cái kế toán kép là gì (giải thích từ đầu)
Trong một hệ thống tiền tệ, từng thao tác ("A chuyển 2 triệu cho B", "A nạp 1 triệu", "B rút 500.000") cần được lưu lại để có thể trả lời sau này: "tài khoản A còn bao nhiêu?", "tiền của A đi đâu?". Nếu chỉ lưu số dư cuối cùng ("A còn 3 triệu") thì khi cần sửa lỗi hoặc kiểm tra, bạn không biết tiền đi đâu.

Sổ cái kế toán kép giải quyết bằng cách lưu từng dòng biến động (entry), không chỉ lưu số dư. Mỗi giao dịch tạo ít nhất hai dòng:
- Một dòng trừ tiền (debit) tại một tài khoản.
- Một dòng cộng tiền (credit) tại tài khoản khác.
- Tổng tiền của tất cả dòng trong một giao dịch phải bằng không (cân bằng).

Ví dụ chuyển 2.000.000 VND từ A sang B (hai tài khoản cùng ngân hàng):
- Dòng 1: tài khoản A, -2.000.000 (trừ tiền A)
- Dòng 2: tài khoản B, +2.000.000 (cộng tiền B)
- Tổng: -2.000.000 + 2.000.000 = 0. Cân bằng.

Sau giao dịch, số dư A = số dư cũ - 2.000.000, số dư B = số dư cũ + 2.000.000. Nếu tổng không bằng 0, có lỗi trong code, hệ thống phải tự động từ chối giao dịch.

~~~seq
title: Ghi giao dịch chuyển tiền vào sổ cái kép
actors: App | Dịch vụ | LedgerDB
App -> Dịch vụ: yêu cầu chuyển 2 triệu A -> B
Dịch vụ -> LedgerDB: ghi dòng 1: A -2 triệu
Dịch vụ -> LedgerDB: ghi dòng 2: B +2 triệu
LedgerDB --> Dịch vụ: kiểm tra tổng bằng 0, commit
Dịch vụ --> App: thông báo thành công
~~~

### Tại sao phải append-only (chỉ thêm, không sửa/xóa)
Append-only nghĩa là khi một dòng đã được ghi vào sổ cái, nó được lưu vĩnh viễn. Bạn không được xóa dòng sai, không được sửa số tiền trong dòng cũ. Nếu sai, bạn phải ghi một dòng mới để đảo ngược (reversing entry).

Ví dụ nhân viên nhập sai: ghi A trừ 2 triệu nhưng ghi B cộng 2 triệu. Sau đó phát hiện lỗi, ghi thêm:
- Dòng 3: A, +2.000.000 (hoàn tiền về A)
- Dòng 4: B, -2.000.000 (trừ tiền của B)
Tổng của dòng 3 và 4 cũng bằng 0. Số dư A và B quay lại như ban đầu, nhưng lịch sử vẫn có 4 dòng để xem lỗi xảy ra lúc nào và được sửa thế nào.

Lý do append-only quan trọng:
1. Lịch sử kiểm tra (audit trail): có thể biết ai, lúc nào, thay đổi gì, quan trọng cho kiểm toán và pháp lý.
2. Phục hồi lỗi: nếu code có bug ghi sai số dư, bạn có thể lại lại toàn bộ lịch sử để tìm lỗi, không cần khôi phục từ sao lưu.
3. Không mất dữ liệu: nếu một tài khoản bị xóa nhầm, vẫn có lịch sử giao dịch để khôi phục.

### Cách làm trong code (Java 17)
Dùng BigDecimal cho tiền, không dùng double (double bị sai số làm tròn, ví dụ 0.1 + 0.2 không bằng 0.3 chính xác). Mỗi entry lưu: id giao dịch, id tài khoản, số tiền, hướng (debit/credit), thời gian, nhân viên thực hiện, lý do.

~~~java
public class LedgerEntry {
    private final String transactionId;
    private final String accountId;
    private final BigDecimal amount;      // duong = cong, am = tru
    private final String direction;       // DEBIT hoac CREDIT
    private final Instant createdAt;
    private final String createdBy;
    // constructor, getters ...
}
~~~

Khi xử lý giao dịch, dịch vụ phải:
1. Kiểm tra tài khoản có đủ tiền không (nếu là giao dịch trừ).
2. Ghi tất cả entry của giao dịch trong một cơ sở dữ liệu giao dịch (ACID), hoặc tất cả thành công hoặc tất cả thất bại.
3. Tính tổng amount, nếu không bằng 0 thì rollback và báo lỗi.
4. Cập nhật số dư tài khoản bằng cách cộng tổng amount của từng tài khoản.

### Lỗi hay gặp
- Dùng double để lưu tiền -> sai số làm tròn, tài khoản lệ 1 hoặc 2 đồng, kiểm toán không chấp nhận.
- Sửa xóa dòng sổ cũ khi sai -> mất lịch sử, không biết lỗi xuất phát ở đâu.
- Chỉ ghi một dòng cho giao dịch (không kép) -> số dư sai, không thể kiểm tra cân bằng.
- Không bao bọc trong một giao dịch DB -> một bên ghi thành công, bên kia thất bại, tiền bị mất.

### Ví dụ đời thực

Trên hệ thống ví điện tử, một ngày đội dev phát hiện sổ cái không cân bằng: tổng số tiền của một giao dịch không bằng 0 do dòng ghi thiếu. Tra soát log LedgerDB thấy giao dịch G-998 chỉ có dòng "tài khoản A trừ 2 triệu" mà không có dòng "tài khoản B cộng 2 triệu" — dịch vụ bị gián đoạn giữa lúc ghi hai dòng. Nguyên nhân gốc: code ghi các entry riêng lẻ, không bao bọc trong một transaction cơ sở dữ liệu. Cách xử lý: ghi các dòng đảo ngược cho các giao dịch bị ảnh hưởng để sổ cái quay về cân bằng, rồi sửa code để ghi tất cả entry của một giao dịch trong một transaction ACID — hoặc tất cả thành công, hoặc tất cả thất bại — và thêm kiểm tra tổng bằng 0 trước khi commit. Kết quả: sổ cái luôn cân bằng, không còn case thiếu dòng.

### Trả lời mẫu khi phỏng vấn

"Sổ cái kế toán kép lưu mọi biến động tiền dưới dạng các dòng entry; mỗi giao dịch tạo ít nhất hai dòng — một bên trừ, một bên cộng — và tổng phải bằng 0. Sổ cái phải append-only: chỉ được thêm mới, không được sửa hoặc xóa dòng cũ; nếu phát hiện sai, tôi ghi thêm dòng đảo ngược chứ không xóa dữ liệu cũ, để giữ toàn bộ lịch sử kiểm tra. Trong code tôi dùng BigDecimal chứ không phải double để tránh sai số làm tròn, và ghi tất cả entry của một giao dịch trong một transaction cơ sở dữ liệu ACID. Một ví dụ thực tế: nhân viên nhập sai số tiền, tôi đã khôi phục bằng dòng đảo ngược, giữ nguyên nhật ký để kiểm toán sau này."

> Senior tip: Trong phỏng vấn, vẽ sổ cái trên giấy: bảng có các cột transaction_id, account_id, amount, direction, created_at. Mỗi giao dịch là một "khung" có hai đầu (trừ ở bên này, cộng ở bên kia) và tổng bằng 0. Ví dụ thực tế: nhân viên nhập sai số tiền, bạn đã đảo ngược bằng dòng đảo ngược không xóa dòng cũ.

> Cụm từ: Reversing entry (dòng đảo ngược) là dòng ghi mới có số tiền ngược lại dòng sai, hoàn tác lỗi không cần xóa dữ liệu cũ.

  `,
  follow: [
    'Tại sao sổ cái phải append-only thay vì sửa đổi số dư trực tiếp?',
    'Một giao dịch chuyển tiền ít nhất ghi bao nhiêu dòng vào sổ cái?',
    'Nếu phát hiện ghi sai số tiền 3 ngày trôi qua, bạn sửa thế nào mà không mất lịch sử?'
  ],
  tags: ['double-entry ledger', 'append-only', 'BigDecimal', 'accounting']
},
{
  id: 'banking-004',
  topic: 'banking',
  level: 'senior',
  q: 'Idempotency là gì? Áp dụng như thế nào cho API chuyển tiền và cho callback từ đối tác (ví dụ NAPAS) để tránh xử lý trùng lặp?',
  a: `**Tóm tắt:** Idempotency là tính chất một thao tác có thể được thực hiện nhiều lần mà kết quả vẫn giống như thực hiện một lần. Đối với API chuyển tiền, client kèm theo một idempotency key duy nhất; server lưu key đã xử lý và nếu nhận lại key trùng thì trả về kết quả cũ, không trừ tiền hai lần. Đối với callback từ đối tác, server cũng kiểm tra mã giao dịch trước khi cập nhật, tránh cộng tiền nhiều lần khi đối tác gửi lại callback.

### Idempotency là gì (giải thích từ đầu)
Trong hệ thống tiền tệ, mạng có thể mất lỗi, client có thể gửi lại yêu cầu sau khi không nhận phản hồi, hoặc đối tác có thể gửi lại thông báo nhiều lần. Nếu một thao tác không idempotent (không an toàn khi lặp), việc gửi lại sẽ gây sai sót: trừ tiền hai lần, cộng tiền nhiều lần, đơn hàng được xử lý hai lần.

Idempotency có nghĩa là: nếu bạn thực hiện cùng một thao tác hai lần, kết quả của lần thứ nhất và lần thứ hai giống nhau, và hệ thống không bị thay đổi thêm. Ví dụ nhấn nút "gửi tiền" hai lần nhanh chóng, tài khoản chỉ được trừ một lần.

### Idempotency cho API chuyển tiền
Khi client gọi API chuyển tiền, client tạo một idempotency key duy nhất (thường là UUID) và gửi trong header hoặc trong body. Server nhận yêu cầu:
1. Kiểm tra key đã được xử lý chưa (lưu trong cơ sở dữ liệu có chỉ mục duy nhất).
2. Nếu đã xử lý -> trả về kết quả cũ (trạng thái, số tiền, mã giao dịch), không trừ tiền thêm.
3. Nếu chưa -> xử lý chuyển tiền, lưu key và kết quả, trả về cho client.

Ví dụ: khách gọi POST /transfers với idempotency-key: "abc-123", số tiền 2 triệu. Server trừ tiền và lưu "abc-123 đã xử lý, thành công". Khách bị mất mạng, gọi lại cùng key "abc-123". Server tìm thấy key đã có, trả về "thành công" cũ, không trừ thêm 2 triệu.

~~~seq
title: API chuyen tien idempotent
actors: Client | API Server | IdempotencyDB | Core
Client -> API Server: POST /transfers, key abc-123, 2 trieu
API Server -> IdempotencyDB: kiem tra key abc-123 da chua
IdempotencyDB --> API Server: chua
API Server -> Core: tru 2 trieu
Core --> API Server: ok
API Server -> IdempotencyDB: luu key abc-123, thanh cong
API Server --> Client: 200 thanh cong
Client -> API Server: POST /transfers, key abc-123, 2 trieu (lay lai mang)
API Server -> IdempotencyDB: kiem tra key abc-123
IdempotencyDB --> API Server: da co, thanh cong
API Server --> Client: 200 thanh cong (khong tru them)
~~~

### Idempotency cho callback từ đối tác
Callback là khi đối tác (ví dụ NAPAS) gửi thông báo đến ngân hàng của bạn để xác nhận giao dịch đã được thực hiện (tiền đã đến, hóa đơn đã thanh toán...). Đối tác có thể gọi callback nhiều lần nếu chưa nhận phản hồi thành công từ ngân hàng bạn.

Ngân hàng bạn nhận callback:
1. Trích mã giao dịch (transaction ID) từ nội dung callback.
2. Kiểm tra mã giao dịch đã được xử lý chưa (lưu trong bảng callback đã xử lý).
3. Nếu đã xử lý -> trả về 200 OK ngay, không xử lý thêm.
4. Nếu chưa -> cập nhật số dư/trạng thái giao dịch, lưu đã xử lý, trả về 200 OK.

Ví dụ: NAPAS gửi callback "giao dịch G123 đã thành công, cộng 2 triệu cho tài khoản B". Ngân hàng cập nhật số dư B và lưu "G123 đã xử lý". NAPAS bị mất mạng, gửi lại callback G123. Ngân hàng tìm thấy G123 đã xử lý, trả về 200 OK, không cộng thêm 2 triệu.

### Lỗi hay gặp
- Không tạo idempotency key, hoặc client gửi key ngẫu nhiên mỗi lần -> không chặn được trùng lặp.
- Lưu key nhưng không kiểm tra trước khi xử lý -> vẫn bị trùng.
- Callback không kiểm tra mã giao dịch, cộng tiền khi nhận lần thứ hai -> tài khoản nhận được thêm tiền.
- Idempotency key hết hạn quá nhanh (ví dụ sau 1 phút) nhưng client retry sau 2 phút -> bị trùng lại.
- Hai giao dịch khác nhau dùng cùng idempotency key -> giao dịch sau bị từ chối sai sai.

### Ví dụ đời thực

Một khách gọi API chuyển 2 triệu VND với idempotency key "abc-123", rồi mất mạng ngay sau khi server đã xử lý xong. Khách gọi lại yêu cầu cũ với cùng key "abc-123". Server tìm thấy key đã tồn tại trong bảng idempotency (có ràng buộc duy nhất), trả về kết quả cũ "thành công" và không trừ thêm 2 triệu. Tương tự, callback từ NAPAS thông báo "giao dịch G123 đã thành công" được gửi hai lần do mạng lỡ; lần thứ hai server thấy mã G123 đã được xử lý, trả 200 OK ngay, không cộng thêm tiền vào tài khoản nhận. Nếu không có kiểm tra này, tài khoản người nhận sẽ bị cộng trùng 2 triệu.

### Trả lời mẫu khi phỏng vấn

"Idempotency có nghĩa là thực hiện cùng một thao tác nhiều lần thì kết quả vẫn như thực hiện một lần, hệ thống không bị thay đổi thêm. Đối với API chuyển tiền, client tự tạo một idempotency key duy nhất (UUID) kèm theo yêu cầu; server kiểm tra key trong cơ sở dữ liệu có ràng buộc duy nhất, nếu đã xử lý thì trả kết quả cũ mà không trừ tiền thêm. Đối với callback từ đối tác như NAPAS, server trích mã giao dịch, kiểm tra đã xử lý chưa, nếu có thì trả 200 OK ngay, không cộng tiền lần hai. Key phải do client tạo và lưu trong cơ sở dữ liệu, không chỉ trong bộ nhớ đệm, vì khi server khởi động lại bộ nhớ đệm sẽ mất và gây trùng lặp."

> Senior tip: Idempotency key phải do client tạo (không do server tạo ngẫu nhiên), vì client mới biết khi nào nó đang "lấy lại mạng" cùng một yêu cầu cũ. Key phải lưu trong cơ sở dữ liệu có ràng buộc duy nhất (unique constraint), không chỉ lưu trong bộ nhớ đệm, vì nếu server khởi động lại thì bộ nhớ đệm bị mất và bị trùng lặp.

> Cụm từ: Unique constraint (ràng buộc duy nhất) là quy tắc trong cơ sở dữ liệu cấm hai dòng có cùng giá trị trong một cột (hoặc những cột), ví dụ cấm hai dòng có cùng idempotency_key.

  `,
  follow: [
    'Tại sao idempotency key phải do client tạo, không do server tạo?',
    'Callback từ đối tác phải kiểm tra gì trước khi cập nhật số dư?',
    'Nếu idempotency key hết hạn nhưng client retry, xử lý thế nào?'
  ],
  tags: ['idempotency', 'API chuyen tien', 'callback', 'doi tac']
},
{
  id: 'banking-005',
  topic: 'banking',
  level: 'senior',
  q: 'Đối soát cuối ngày là gì, nguồn lệch từ đâu, và quy trình xử lý khi phát hiện lệch như thế nào?',
  a: `**Tóm tắt:** Đối soát cuối ngày là quá trình so sánh sổ cái của ngân hàng với sổ của đối tác (NAPAS, các ngân hàng khác, bộ switches thẻ) để phát hiện những khoản tiền lệch (tiến đơn, thiếu đơn, sai số tiền). Nguồn lệch thường từ giao dịch timeout, lỗi hệ thống, hoặc giao dịch chưa khớp. Khi phát hiện lệch, dev phải tra soát nguyên nhân, điều chỉnh sổ cái nếu cần và báo cáo cho lãnh đạo.

### Đối soát cuối ngày là gì (giải thích từ đầu)
Mỗi ngày, ngân hàng có hàng trăm/hàng nghìn giao dịch trong và ngoài. Về đêm, ngân hàng cần kiểm tra xem "tiền của chúng ta nhận được" có khớp với "tiền đối tác nợ chúng ta" không, và "tiền chúng ta gửi đi" có khớp với "tiền đối tác nhận được" không. Việc kiểm tra này gọi là đối soát cuối ngày (end-of-day reconciliation).

Đối soát không chỉ kiểm tra số tiền, còn kiểm tra chi tiết từng giao dịch: mã giao dịch, số tiền, thời gian, tài khoản gửi, tài khoản nhận. Nếu hai bên có số liệu khác nhau -> có "lech" (discrepancy), cần xử lý.

Nguồn lệch thường gặp:
- Giao dịch timeout: ngân hàng gửi đã trừ tiền nhưng thông báo bị mất, ngân hàng nhận chưa biết -> tiền bị "mat" giữa hai ben.
- Lỗi hệ thống: mạng mất, server chậm, code bug ghi sai so tien.
- Giao dịch chưa khớp: một bên ghi giao dịch, bên kia chưa ghi (ví dụ nhân viên nhập sai mã tài khoản).
- Ngay le/gio bao tri: he thong nghi, giao dich bi tre, den ngay moi moi khop.

### Quy trình xử lý khi phát hiện lệch
1. Tạo báo cáo lệch: hệ thống tự động sinh ra danh sách các giao dịch không khớp giữa hai bên, với số tiền và mã giao dịch.
2. Tra soát: nhân viên (hoặc dev viết script) kiểm tra từng giao dịch lệch:
   - Xem nhật ký giao dịch (log) của hai bên.
   - Kiểm tra tài khoản có được trừ/cộng chưa.
   - Xác định lỗi ở bên nào.
3. Điều chỉnh sổ cái (nếu cần): nếu xác nhận tiền đã được gửi nhưng chưa được cộng, cộng tiền vào tài khoản nhận. Nếu tiền đã được cộng nhưng chưa được trừ, trừ tài khoản gửi (hoặc liên hệ khách để hoàn).
4. Báo cáo: gửi báo cáo cho kế toán và quản lý rủi ro, ghi lại nguyên nhân và cách sửa.
5. Ngăn ngừa: nếu lệch lớn hoặc xuất hiện nhiều lần, tìm nguyên nhân gốc (root cause) và sửa code/hệ thống.

Ví dụ số liệu: ngân hàng A gửi 100 giao dịch sang ngân hàng B qua NAPAS, tổng 500 triệu. B báo nhận 99 giao dịch, tổng 495 triệu. Có một giao dịch 5 triệu lệch. Tra soát kết quả: giao dịch đó timeout, tiền đã được trừ ở A nhưng thông báo bị mất, B chưa biết. Xử lý: cộng 5 triệu cho tài khoản nhận ở B, cập nhật trạng thái giao dịch, thông báo cả hai khách.

~~~seq
title: Đối soát cuối ngày và xử lý lệch
actors: Ngân hàng A | NAPAS | Ngân hàng B | Nhân viên tra soát
Ngân hàng A -> NAPAS: gửi 100 giao dịch, 500 triệu
NAPAS -> Ngân hàng B: chuyển tiền
Ngân hàng B --> NAPAS: nhận 99 giao dịch, 495 triệu
NAPAS --> Ngân hàng A: báo cáo 99/100, lệch 5 triệu
Nhân viên tra soát -> Ngân hàng A: kiểm tra nhật ký giao dịch lệch
Nhân viên tra soát -> Ngân hàng B: xác nhận chưa nhận 5 triệu
Nhân viên tra soát -> Ngân hàng B: cộng 5 triệu tài khoản nhận
Nhân viên tra soát --> Ngân hàng A: báo cáo kết quả
~~~

### Lỗi hay gặp
- Chỉ đối soát tổng số tiền, không kiểm tra từng giao dịch -> bị bỏ lọc giao dịch lệch nhỏ nhiều lần.
- Tra soát nhưng không ghi lại nguyên nhân -> cùng lỗi xảy ra lại trong ngày sau.
- Điều chỉnh sổ cái không được phán duyệt (maker-checker) -> nhân viên sửa số tiền theo ý muốn, gây rủi ro gian lận.
- Thông báo lệch muộn -> khách phàn nàn, ngân hàng mất uy tín.
- Không có giới hạn thời gian xử lý lệch -> giao dịch treo float tháng năm, báo cáo sai.

### Ví dụ đời thực

Ngân hàng A gửi 100 giao dịch tổng cộng 500 triệu VND sang ngân hàng B qua NAPAS; bên B báo nhận 99 giao dịch, tổng 495 triệu VND — lệch một giao dịch 5 triệu VND. Đội tra soát xem nhật ký của hai bên và thấy giao dịch G-55 bị timeout: tiền đã bị trừ ở ngân hàng A nhưng thông báo bị mất, ngân hàng B chưa biết. Cách xử lý: cộng 5 triệu VND vào tài khoản người nhận ở B, cập nhật trạng thái giao dịch, thông báo cho cả hai khách hàng, rồi gửi báo cáo cho kế toán và quản lý rủi ro ghi rõ nguyên nhân. Sau đó dev bổ sung bước kiểm tra khớp chi tiết từng giao dịch, không chỉ đối soát tổng số tiền, để tránh trường hợp tương tự.

### Trả lời mẫu khi phỏng vấn

"Đối soát cuối ngày là so sánh sổ cái của ngân hàng chúng ta với sổ của đối tác — NAPAS, các ngân hàng khác hay switch thẻ — để tìm khoản tiền lệch: tiến đơn, thiếu đơn hoặc sai số tiền. Tôi không chỉ đối soát tổng số tiền, mà kiểm tra từng giao dịch: mã giao dịch, số tiền, thời gian, tài khoản gửi và tài khoản nhận. Khi phát hiện lệch, tôi tạo báo cáo, tra soát nhật ký của hai bên để xác định lỗi ở đâu, rồi điều chỉnh sổ cái nếu cần — ví dụ cộng tiền vào tài khoản nhận khi tiền đã gửi nhưng chưa được cộng. Điều chỉnh phải được phán duyệt theo quy trình maker-checker để tránh gian lận, rồi báo cáo kế toán và quản lý rủi ro, tìm nguyên nhân gốc để sửa code."

> Senior tip: Trong phỏng vấn, hãy nói rằng đối soát cuối ngày là "cuối cùng của chúng ta" để phát hiện lỗi, và dev phải xây dựng hệ thống để tự động phát hiện lệch, không chờ khách báo. Hãy nhấn mạnh mục tiêu không chỉ là "khớp số" còn là "tìm ra sai sai ở đâu và sửa ở đâu".

> Cụm từ: Discrepancy (lech) là khoảng cách giữa hai con số phải bằng nhau, ví dụ ngân hàng A ghi 500 triệu, ngân hàng B ghi 495 triệu, lệch 5 triệu.

  `,
  follow: [
    'Tại sao chỉ đối soát tổng tiền không đủ, phải kiểm tra từng giao dịch?',
    'Giao dịch timeout là nguồn lệch thường nhất, xử lý thế nào?',
    'Điều chỉnh sổ cái cần phán duyệt thế nào để tránh gian lận?'
  ],
  tags: ['doi soat', 'lech cuoi ngay', 'tra sot', 'NAPAS']
},
{
  id: 'banking-006',
  topic: 'banking',
  level: 'mid',
  q: 'Cut-off time, ngày làm việc và ngày lễ ảnh hưởng đến giao dịch và tính lãi như thế nào?',
  a: `**Tóm tắt:** Cut-off time là mốc giờ cuối ngày ngân hàng nhận giao dịch để tính là của ngày hôm nay; giao dịch sau cut-off thường được xử lý như của ngày làm việc tiếp theo. Ngày làm việc là ngày ngân hàng mở cửa và xử lý giao dịch, trong khi ngày lễ (nghịp lễ, Tết) ngân hàng nghỉ, không tính lãi và không xử lý giao dịch mới. Dev phải hiểu các quy tắc này để tính toán ngày giao dịch (value date), số dư và lãi chính xác.

### Cut-off time là gì (giải thích từ đầu)
Cut-off time (giờ cắt của) là mốc giờ của một ngày, sau giờ này, giao dịch mới được chấp nhận nhưng sẽ được tính như của ngày tiếp theo. Mỗi ngân hàng có một cut-off khác nhau cho từng loại giao dịch (ví dụ chuyển tiền nội bộ cut-off 16 giờ, chuyển khoản liên ngân hàng cut-off 14 giờ, tiền gửi cut-off 15 giờ).

Ví dụ: khách chuyển tiền 5 triệu lúc 16 giờ 30, cut-off là 16 giờ. Ngân hàng chấp nhận giao dịch nhưng tính như giao dịch của ngày mai. Người nhận tiền có thể tiền đến ngày mai, không phải ngày hôm nay.

Vì sao cần cut-off: ngân hàng cần thời gian để xử lý, kiểm tra và đóng sổ cái ngày. Nếu không có cut-off, giao dịch đến cuối đêm vẫn được xử lý, hệ thống sẽ quá tải và không kịp đóng sổ cái.

### Ngày làm việc và ngày lễ
Ngày làm việc là ngày ngân hàng mở cửa và xử lý giao dịch (thứ 2 đến thứ 6, trừ các ngày lễ). Ngày lễ là ngày ngân hàng nghỉ (lễ quốc gia, Tết, lễ nhân dân...). Trong ngày lễ, không có giao dịch mới được xử lý, không tính lãi, không cập nhật số dư.

Khi tính tổng số ngày để tính lãi hoặc tính hạn, chỉ đếm ngày làm việc hoặc đếm ngày thực tế phụ thuộc vào loại sản phẩm. Tiền gửi thường tính lãi hàng tháng, nếu ngày tiền lãi vào ngày lễ, tiền lãi được cộng vào ngày làm việc gần nhất.

### Tác động đến giao dịch và tính lãi
1. Value date (ngay gia tri): ngày tiền giao dịch được tính và cộng vào tài khoản. Nếu giao dịch trượt qua cut-off hoặc vào ngày lễ, value date được đẩy sang ngày làm việc kế tiếp.
2. Tính lãi: lãi tiền gửi hoặc khoản vay được tính theo số ngày tiền gửi/vay. Nếu có ngày lễ giữa khoảng thời gian, ngày lễ vẫn đếm vào số ngày (lãi tiền vẫn chạy trong ngày lễ) nhưng không có giao dịch mới được xử lý.
3. Số dư: số dư hiển thị cho khách chỉ được cập nhật sau khi giao dịch được xử lý. Nếu giao dịch sau cut-off, số dư hiển thị có thể chưa thay đổi cho đến ngày làm việc kế tiếp.

Ví dụ số liệu: khách gửi tiền 100 triệu vào ngày Chủ Nhật (ngày nghỉ, giờ cắt đã qua). Ngân hàng chấp nhận giao dịch, tính value date là ngày làm việc đầu tiên của tuần sau. Lãi tiền được tính từ value date, không tính từ ngày Chủ Nhật.

~~~seq
title: Giao dịch vào ngày lễ sau giờ cut-off
actors: Khách | App | Ngân hàng | Hệ thống xử lý
Khách -> App: gửi tiền 100 triệu lúc 23h ngày Chủ Nhật
App -> Ngân hàng: gửi giao dịch
Ngân hàng -> Hệ thống xử lý: chấp nhận, tính value date ngày làm việc đầu tuần sau
Hệ thống xử lý --> Ngân hàng: đã chấp nhận
Ngân hàng --> Khách: thông báo chấp nhận, tiền cộng ngày làm việc kế tiếp
~~~

### Lỗi hay gặp
- Tính ngày giao dịch bằng ngày hiện tại, không kiểm tra cut-off và ngày lễ -> value date sai, lãi sai.
- Không phân biệt ngày làm việc và ngày thực tế -> sai số dư, khách phàn nàn.
- Tính lãi trong ngày lễ như một ngày bình thường cho sản phẩm chỉ tính lãi trong ngày làm việc -> sai số tiền lãi.
- Thông báo cho khách tiền đã được cộng nhưng value date chưa đến -> khách hoang mang, gọi điện bàn chuyển.

### Ví dụ đời thực

Một khách gửi 100 triệu VND vào lúc 23 giờ Chủ Nhật — đã qua giờ cut-off và ngày này là ngày nghỉ. Ngân hàng vẫn chấp nhận giao dịch, nhưng value date (ngày tiền được cộng vào tài khoản và bắt đầu tính lãi) được đẩy sang ngày làm việc đầu tiên của tuần sau, không phải Chủ Nhật. Lãi tiền gửi được tính từ value date. Nếu dev sai lầm tính ngày bằng ngày hiện tại, value date và lãi sẽ sai, khách thấy số dư chưa cập nhật và gọi điện phàn nàn. Cách xử lý đúng: dùng một lớp tính ngày làm việc dùng chung cho toàn hệ thống, kiểm tra cut-off và danh sách ngày lễ trước khi gán value date, và luôn thông báo khách đúng ngày tiền thực tế được cộng.

### Trả lời mẫu khi phỏng vấn

"Cut-off time là mốc giờ cuối ngày ngân hàng chấp nhận giao dịch và tính là của ngày hôm nay; giao dịch sau cut-off được xử lý như của ngày làm việc tiếp theo. Ngày làm việc là ngày ngân hàng mở cửa và xử lý giao dịch, còn ngày lễ ngân hàng nghỉ, không xử lý giao dịch mới. Khi tính lãi hoặc hạn, value date — ngày tiền được cộng vào tài khoản và bắt đầu tính lãi — sẽ bị đẩy sang ngày làm việc kế tiếp nếu giao dịch trượt cut-off hoặc rơi vào ngày lễ. Tôi nhấn mạnh dev không được tự ý tính ngày trên mỗi màn hình, phải có một lớp tính ngày làm việc dùng chung cho toàn hệ thống, và luôn thông báo khách đúng value date để tránh hiểu nhầm về số dư."

> Senior tip: Trong phỏng vấn, hãy vẽ bảng tra cứu các loại giao dịch với cut-off và quy tắc tính ngày (ví dụ: chuyển tiền nội bộ cut-off 16 giờ, value date là ngày hiện tại nếu trước cut-off, khác ngày nếu sau cut-off). Hãy nhấn mạnh rằng dev không được tính ngày một cách tùy tiện, phải có một lớp tính ngày làm việc dùng chung cho toàn hệ thống.

> Cụm từ: Value date (ngày giá trị) là ngày tiền giao dịch được cộng vào tài khoản và bắt đầu tính lãi, không phải luôn bằng ngày khách nhận thông báo.

  `,
  follow: [
    'Giao dịch sau cut-off tính ngày nào, tiền đến khi nào?',
    'Ngày lễ có tính lãi tiền gửi không, và xử lý thế nào?',
    'Tại sao cần một lớp tính ngày dùng chung thay vì mỗi màn hình tính riêng?'
  ],
  tags: ['cut-off time', 'ngay lam viec', 'ngay le', 'value date', 'tinh lai']
},
{
  id: 'banking-007',
  topic: 'banking',
  level: 'senior',
  q: 'Maker-checker (4 mắt) là gì, audit trail ghi gì, và phân quyền theo vai trò trong back-office được thiết kế như thế nào?',
  a: `**Tóm tắt:** Maker-checker (hai mắt) là quy trình hai người tham gia một thao tác quan trọng: người đầu tiên (maker) khởi tạo, người thứ hai (checker) duyệt hoặc từ chối trước khi thao tác có hiệu lực. Audit trail là nhật ký ghi lại ai, làm gì, lúc nào, từ đâu. Phân quyền theo vai trò (RBAC) đảm bảo mỗi nhân viên chỉ được làm việc trong phạm vi chức vụ của mình, tránh một người làm một mình toàn bộ quy trình tiền.

### Maker-checker (hai mắt) là gì (giải thích từ đầu)
Trong ngân hàng, những thao tác ảnh hưởng đến tiền (chuyển tiền số lớn, sửa hạn mức thẻ, mở tài khoản VIP...) không được phép một nhân viên làm một mình. Cần hai người:
- Maker: nhân viên tạo yêu cầu (ví dụ "chuyển 500 triệu sang tài khoản X"), nhưng yêu cầu này chưa có hiệu lực.
- Checker: nhân viên khác (bộ phận kiểm soát) xem yêu cầu, nếu đúng thì duyệt, nếu sai thì từ chối. Chỉ khi checker duyệt thì tiền mới được chuyển.

Vì nếu một người làm hết, dễ xảy ra gian lận và lỗi nhập liệu. Ví dụ: maker nhập sai số tiền 500 triệu thành 5000 triệu, checker phát hiện và từ chối.

Quyền hạn: một nhân viên không được đồng thời là maker và checker của cùng một yêu cầu (nếu hệ thống cho phép, đó là lỗi nguy hiểm).

### Audit trail ghi gì
Audit trail (nhật ký kiểm toán) lưu mọi chi tiết của mỗi hành động quan trọng trong hệ thống. Mỗi dòng nhật ký phải ghi:
- Ai làm (mã nhân viên, tên).
- Làm gì (hành động: tạo, duyệt, từ chối, sửa, xóa).
- Lúc nào (thời gian chuẩn, ví dụ 2024-03-15 14:32:10).
- Từ đâu (địa chỉ IP, máy tính, trình duyệt).
- Trước và sau (giá trị cũ và giá trị mới, ví dụ số tiền sửa từ 100 triệu sang 200 triệu).
- Lý do (nếu có).

Ví dụ nhân viên sửa hạn mức thẻ:
- Mai, sửa hạn mức thẻ, 14:32:10, IP 10.0.0.5, hạn mức cũ 50 triệu, hạn mức mới 100 triệu, lý do "khách đang cấp nhập".

Audit trail không được xóa, sửa hoặc ẩn. Ngay cả nhân viên có quyền cao nhất (admin) cũng không được xóa nhật ký. Điều này đảm bảo sự minh bạch và có thể trả lời khi xảy ra lỗi hoặc tranh chấp.

### Phân quyền theo vai trò (RBAC)
Back-office của ngân hàng có nhiều bộ phận (tài chính, kiểm toán, chăm sóc khách hàng, quản lý rủi ro...). Mỗi nhân viên được gán một hoặc nhiều vai trò, mỗi vai trò có quyền hạn khác nhau:
- Thủ ngân (teller): nộp rút tiền, xem số dư khách hàng, không được sửa hạn mức.
- Nhân viên kiểm soát: duyệt yêu cầu chuyển tiền, không được tạo yêu cầu.
- Quản lý: duyệt yêu cầu tiền lớn, xem báo cáo, không được thao tác tiền trực tiếp.
- Kế toán: xem báo cáo sổ cái, không được duyệt chuyển tiền.
- Admin hệ thống: quản lý tài khoản nhân viên, không được xem số dư khách hàng hoặc duyệt giao dịch.

Quyền hạn được kiểm tra mỗi lần nhân viên nhấn nút, không chỉ kiểm tra khi đăng nhập. Ví dụ nhân viên thủ ngân nhấn mục "duyệt chuyển tiền", hệ thống phải từ chối ngay.

~~~seq
title: Maker-checker chuyển tiền trong back-office
actors: Maker | Checker | Hệ thống
Maker -> Hệ thống: tạo yêu cầu chuyển 500 triệu
Hệ thống --> Maker: đã lưu, trạng thái chờ duyệt
Maker --> Checker: thông báo có yêu cầu mới
Checker -> Hệ thống: xem yêu cầu, kiểm tra tài khoản
Checker -> Hệ thống: duyệt yêu cầu
Hệ thống --> Checker: đã duyệt, tiền được chuyển
Hệ thống -> Maker: ghi audit trail (tạo, duyệt, 14:32)
~~~

### Lỗi hay gặp
- Một nhân viên đồng thời là maker và checker -> không có khi kiểm, dễ gian lận.
- Checker duyệt không kiểm tra tài khoản -> được chuyển tiền sai, bị mất tiền.
- Audit trail không ghi IP hoặc thời gian -> không biết lỗi xuất phát ở đâu.
- Phân quyền quá rộng (một nhân viên nhiều vai trò) -> có thể sửa hạn mức và duyệt cùng lúc.
- Không kiểm tra quyền mỗi lần nhấn nút -> sau khi đăng nhập, nhân viên có thể truy cập trang không được phép.

### Ví dụ đời thực

Một nhân viên back-office sửa hạn mức thẻ tín dụng của khách từ 50 triệu lên 500 triệu mà khách không yêu cầu. Khách gọi trung tâm chăm sóc khiếu nại số tiền bị chặn do vượt hạn mức bất thường. Đội dev xem audit trail (nhật ký kiểm tra) và thấy: nhân viên B, IP 10.0.0.12, lúc 14:32:10, đổi hạn mức từ 50 triệu sang 500 triệu, trạng thái đã duyệt, lý do trống. Tra cứu thêm phát hiện B đồng thời là người tạo yêu cầu (maker) và người duyệt (checker) — hệ thống không chặn một người nắm cả hai quyền. Nguyên nhân gốc: RBAC bị cấu hình quá rộng, và code không kiểm tra "người duyệt khác người tạo" khi duyệt yêu cầu. Cách xử lý: hoàn hạn mức về 50 triệu, báo cáo quản lý rủi ro, thu hồi quyền duyệt của B, rồi sửa code: khi duyệt, hệ thống so sánh mã nhân viên duyệt với mã người tạo; nếu trùng thì từ chối và ghi audit trail. Kết quả: trong tháng sau không còn case hạn mức bị sửa sai, và mọi thao tác tiền đều có hai người khác nhau.

### Trả lời mẫu khi phỏng vấn

"Maker-checker yêu cầu hai người khác nhau tham gia mỗi thao tác ảnh hưởng đến tiền. Ví dụ, nhân viên A tạo yêu cầu tăng hạn mức thẻ từ 50 triệu lên 100 triệu, yêu cầu này vẫn đang chờ, chưa có hiệu lực. Nhân viên B, người khác, xem yêu cầu, kiểm tra tài khoản, rồi duyệt hoặc từ chối. Chỉ khi B duyệt thì tiền mới được chuyển hoặc hạn mức mới áp dụng. Một nhân viên không được đồng thời là người tạo và người duyệt của cùng một yêu cầu. Audit trail là nhật ký kiểm toán, ghi lại ai làm gì, lúc nào, từ IP hay máy tính nào, và giá trị trước và sau mỗi thay đổi; nhật ký này không bao giờ được xóa hoặc sửa. Phân quyền theo vai trò (RBAC) gán cho mỗi nhân viên quyền cần đủ để làm việc, ví dụ thủ ngân chỉ nộp rút, nhân viên kiểm soát chỉ duyệt. Hệ thống phải kiểm tra quyền mỗi lần nhân viên nhấn nút, không chỉ khi đăng nhập. Tôi áp dụng nguyên tắc least privilege: cấp ít quyền nhất có thể, và audit trail phải đủ chi tiết để phục hồi bất kỳ giao dịch nào khi cần."

> Senior tip: Trong phỏng vấn, hãy nói rằng maker-checker không chỉ là "hai người" mà là "hai người không được là cùng một người", và audit trail phải lưu đủ để có thể phục hồi một giao dịch bất kỳ. Hãy nhấn mạnh rằng RBAC phải được kiểm tra tại mỗi request, không chỉ khi đăng nhập, và nhân viên phải được cấp quyền ít nhất để làm việc (least privilege).

> Cụm từ: Least privilege (quyền ít nhất) là táct bộ chỉ cấp cho nhân viên quyền cần thiết để làm việc, không thêm, để hạn chế rủi ro.

  `,
  follow: [
    'Tại sao một nhân viên không được đồng thời là maker và checker?',
    'Audit trail phải ghi thông tin gì để đảm bảo minh bạch?',
    'Nhân viên vượt quyền, hệ thống phát hiện thế nào?'
  ],
  tags: ['maker-checker', 'audit trail', 'RBAC', 'phan quyen']
},
{
  id: 'banking-008',
  topic: 'banking',
  level: 'senior',
  q: 'KYC/eKYC và AML là gì ở mức dev cần biết, dữ liệu nhạy cảm nào, và cách lưu và che (masking) thông tin khách hàng?',
  a: `**Tóm tắt:** KYC (Know Your Customer) là xác minh danh tính khách hàng khi mở tài khoản, eKYC là làm điều đó bằng công nghệ (chụp CMND, quét khuôn mặt). AML (Anti-Money Laundering) là phòng chống rửa tiền, giả tạo tiền. Dev cần biết dữ liệu nào nhạy cảm (CMND, số điện thoại, địa chỉ, lịch sử giao dịch), lưu an toàn (mã hóa) và che (masking) khi hiển thị hoặc gửi log để tránh mất mật thông tin.

### KYC/eKYC và AML là gì (giải thích từ đầu)
KYC (Know Your Customer - biết khách hàng của bạn) là quy trình xác minh danh tính khách hàng khi mở tài khoản ngân hàng: nhân viên kiểm tra CMND/CCCD, địa chỉ, việc làm, nghề nghiệp... để biết khách hàng là ai, có rủi ro không.

eKYC (electronic KYC) là làm KYC bằng công nghệ: khách chụp ảnh CMND, chụp ảnh mặt (selfie), hệ thống tự động so sánh ảnh chụp và ảnh trên CMND, kiểm tra CMND có bị lừa không. Không cần đến chi nhánh.

AML (Anti-Money Laundering - chống rửa tiền) là quy trình phát hiện và ngăn việc sử dụng tiền bạc để hoạt động phi pháp (ma túy, gian lận, tham nhũng...) và lanza thành tiền "trắng". Ngân hàng phải theo dõi giao dịch lớn, giao dịch kỳ lạ, và báo cáo cho quản lý nếu có nghi ngờ.

Dev không cần làm chuyên viên pháp luật, nhưng cần biết: dữ liệu nào cần bảo vệ, lưu ở sao, và che khi hiển thị.

### Dữ liệu nhạy cảm
- Số CMND/CCCD (số chứng minh nhân dân).
- Họ tên, ngày sinh, địa chỉ thường trú.
- Số điện thoại, email.
- Số tài khoản, số thẻ tín dụng.
- Lịch sử giao dịch (nào, khi nào, bao nhiêu tiền).
- Thông tin việc làm, thu nhập.

Các dữ liệu này nếu bị mất mật, kẻ xấu có thể gian lận lấy tài khoản, làm thẻ, hoặc xác định khách hàng.

### Cách lưu và che (masking)
1. Mã hóa khi lưu: mật khẩu, số CMND, số thẻ phải được mã hóa (ví dụ AES, hoặc hàm băm BCrypt cho mật khẩu) trước khi lưu vào cơ sở dữ liệu. Không lưu thông tin nhạy cảm ở dạng văn bản thô (plain text).
2. Che khi hiển thị: nếu nhân viên cần xem số thẻ, chỉ hiển thị 4 số cuối, các số còn lại che bằng dấu * (ví dụ 1234 **** **** 5678). Số điện thoại che các số ở giữa (ví dụ 090****1234). CMND che một phần (ví dụ 123*******89).
3. Không gửi dữ liệu nhạy cảm vào log: log hệ thống không được chứa số thẻ, CMND, mật khẩu. Nếu cần ghi log, chỉ ghi mã khách hàng hoặc số tài khoản đã che.
4. Giao hạn quyền: chỉ nhân viên có quyền được xem dữ liệu nhạy cảm đã che, và lưu nhật ký xem (audit trail).

Ví dụ hiển thị thẻ:
- Số thẻ thô: 1234 5678 9012 3456
- Số thẻ đã che: **** **** **** 3456

~~~seq
title: Nhân viên xem thông tin khách đã che
actors: Nhân viên | Hệ thống | CSDL
Nhân viên -> Hệ thống: xem tài khoản khách A
Hệ thống -> CSDL: lấy thông tin khách
CSDL --> Hệ thống: CMND đã mã hóa, số thẻ đã che
Hệ thống --> Nhân viên: hiển thị họ tên, CMND che, thẻ che
~~~

### Lỗi hay gặp
- Lưu mật khẩu ở dạng văn bản thô -> nếu cơ sở dữ liệu bị lộ, tất cả mật khẩu bị theft.
- Hiển thị đầy đủ số thẻ/CMND trên màn hình hoặc in hóa đơn -> mất mật thông tin.
- Ghi số thẻ vào log để debug -> log bị lưu, kẻ xấu xem được thẻ.
- Không che số điện thoại khi gửi thông báo cho khách khác -> mất mật liên hệ.
- Nhân viên thủ ngân có thể xem toàn bộ số CMND -> vi phạm quyền ít nhất.

### Ví dụ đời thực

Một nhân viên chăm sóc khách hàng chia sẻ màn hình để hỗ trợ khách khôi phục tài khoản. Triệu chứng: trên màn hình hiển thị đầy đủ số CMND, số thẻ tín dụng và số điện thoại của khách, được người bên ngoài chụp ảnh. Dev kiểm tra API và thấy phản hồi JSON trả về toàn bộ trường cmnd, soThe va soDienThoai, màn hình hiển thị thô mà không che. Nguyên nhân gốc: thiếu quy tắc masking (che dữ liệu) ở lớp API và lớp hiển thị, dữ liệu nhạy cảm không được che trước khi gửi về client. Cách xử lý: sửa API chỉ trả về 4 số cuối của thẻ (**** **** **** 3456), che một phần CMND (123*******89), che các số giữa của điện thoại (090****1234); log hệ thống chỉ ghi mã khách hàng đã che, không ghi số thẻ hay CMND. Kết quả: ngay sau khi triển khai, màn hình hỗ trợ không còn hiển thị dữ liệu thô, và cuộc kiểm tra bảo mật tháng sau không còn tìm thấy CMND hay số thẻ trong log và phản hồi API.

### Trả lời mẫu khi phỏng vấn

"KYC (Know Your Customer, biết khách hàng của bạn) là quy trình xác minh danh tính khách khi mở tài khoản, ví dụ kiểm tra CMND, địa chỉ, việc làm. eKYC (electronic KYC) làm điều đó bằng công nghệ: khách chụp ảnh CMND và chụp ảnh mặt (selfie), hệ thống tự so sánh ảnh trên giấy tờ với ảnh chụp để xác nhận đây là chủ nhân thẻ. AML (Anti-Money Laundering, chống rửa tiền) là quy trình phát hiện và ngăn tiền từ hoạt động phi pháp được biến thành tiền "trắng", ví dụ ngân hàng theo dõi giao dịch lớn hoặc kỳ lạ và báo cáo khi nghi ngờ. Dữ liệu nhạy cảm như CMND, số thẻ, số điện thoại, địa chỉ và lịch sử giao dịch phải được mã hóa khi lưu vào cơ sở dữ liệu, và phải được che khi hiển thị trên màn hình, in hóa đơn hoặc gửi SMS — ví dụ số thẻ chỉ hiện 4 số cuối, số điện thoại che các số ở giữa. Log hệ thống không được chứa số thẻ hay CMND. Tôi áp dụng quyền ít nhất: chỉ nhân viên có quyền mới xem dữ liệu nhạy cảm đã che, và mọi lần xem đều được ghi nhật ký để kiểm toán sau này."

> Senior tip: Trong phỏng vấn, hãy nói rằng dev không cần làm chuyên viên pháp luật, nhưng phải biết "dữ liệu nào cần che, lưu ở đâu, ai được xem". Hãy nhấn mạnh rằng masking phải được áp dụng ở tất cả màn hình: màn hình, hóa đơn, email, SMS, log, và API trả về. Nếu có thể, hãy nói về một ví dụ quy tắc che thẻ thông tin khách (ví dụ chỉ gửi 4 số cuối thẻ qua SMS).

> Cụm từ: Masking (che) là thay đổi một phần dữ liệu nhạy cảm bằng ký tự khác (ví dụ * hoặc #) để không ai có thể đọc được thông tin đầy đủ, còn dữ liệu gốc vẫn được lưu an toàn để sử dụng khi cần thiết.

  `,
  follow: [
    'Dữ liệu nào trong ngân hàng cần mã hóa khi lưu vào cơ sở dữ liệu?',
    'Số thẻ hiển thị cho nhân viên phải che thế nào?',
    'Tại sao không được gửi số thẻ vào log hệ thống?'
  ],
  tags: ['KYC', 'eKYC', 'AML', 'du lieu nhay cam', 'masking']
},
{
  id: 'banking-009',
  topic: 'banking',
  level: 'lead',
  q: 'PCI DSS cơ bản là gì khi xử lý số thẻ, tại sao không lưu CVV, tokenization là gì, và cách che số thẻ trong log?',
  a: `**Tóm tắt:** PCI DSS là tiêu chuẩn bảo mật cho mọi đơn vị lưu, xử lý hoặc truyền số thẻ thanh toán, nhằm bảo vệ thông tin thẻ khỏi bị đánh cắp. Nguyên tắc quan trọng: không bao giờ lưu mã CVV (mã bảo mật 3 số sau thẻ), dùng tokenization để thay số thẻ thật bằng mã giả, và che số thẻ khi ghi log. Dev cần hiểu các quy tắc này để xây dựng hệ thống thẻ an toàn.

### PCI DSS là gì (giải thích từ đầu)
PCI DSS (Payment Card Industry Data Security Standard - tiêu chuẩn bảo mật dữ liệu của ngành thẻ thanh toán) là bộ quy tắc bảo mật mà mọi đơn vị xử lý thẻ (ngân hàng, cửa hàng, công ty công nghệ thanh toán) phải tuân theo. Nó không phải là một pháp luật nhưng là yêu cầu của các tổ chức thẻ (Visa, Mastercard...). Nếu vi phạm, đơn vị có thể bị phạt, bị ngừng dịch vụ thẻ, hoặc bị thông báo khi thẻ bị mất.

PCI DSS bao gồm nhiều yêu cầu (từ xác định người dùng, mã hóa dữ liệu, giới hạn quyền, bảo vệ mạng...). Dev cần biết những yêu cầu gắn liền với code: không lưu CVV, mã hóa số thẻ, che thẻ trong log, giới hạn quyền truy cập.

### Không lưu CVV
CVV (Card Verification Value - mã xác minh thẻ) là 3 số (hoặc 4 số trên thẻ American Express) in sau thẻ, dùng để xác minh người mua có thẻ trong tay khi mua online. PCI DSS cấm tuyệt đối lưu CVV sau khi xác nhận thanh toán, vì nếu không lưu CVV, kẻ xấu lấy được số thẻ mà không thể mua online (vì cần CVV). Nếu hệ thống bị lộ và số thẻ bị thoát nhưng CVV không có, rủi ro ít hơn.

Ví dụ: khách nhập số thẻ và CVV để mua hàng. Hệ thống xác nhận thanh toán xong, lưu số thẻ (đã mã hóa/token) nhưng không lưu CVV. Lần sau khách mua lại, hệ thống có thể yêu cầu khách nhập lại CVV hoặc dùng token để thanh toán không cần thẻ.

### Tokenization là gì
Tokenization (mã hóa biểu tượng) là thay thế số thẻ thật (PAN - Primary Account Number) bằng một mã giả (token) ngẫu nhiên, không có giá trị toán học với số thẻ. Token được lưu trong hệ thống, số thẻ thật lưu ở một hệ thống biệt lập (vault) được bảo mật rất cao.

Ví dụ: số thẻ thật 1234 5678 9012 3456 được thay bằng token "tok_abc123xyz". Hệ thống ngân hàng lưu token trong cơ sở dữ liệu, nếu cần thực hiện thanh toán, gửi token đến hệ thống vault, vault trả về số thẻ thật (hoặc thực hiện thanh toán trực tiếp) để xử lý. Nếu cơ sở dữ liệu ngân hàng bị lộ, kẻ xấu chỉ lấy được token, không thể chuyển đổi thành số thẻ thật không có khóa mã hóa của vault.

Token khác mã hóa (encryption): mã hóa cần khóa để giải mã, token không cần (cần hệ thống vault để đổi trả).

### Che số thẻ trong log
Log hệ thống không được chứa số thẻ đầy đủ. Nếu cần ghi log để xác định lỗi, chỉ ghi 4 số cuối hoặc che tất cả ngoại trừ 4 số cuối.

Ví dụ log sai: "Giao dịch thẻ 1234 5678 9012 3456 thành công" -> lộ thẻ.
Ví dụ log đúng: "Giao dịch thẻ **** **** **** 3456 thành công" -> an toàn.

~~~seq
title: Thanh toán thẻ với token và log che
actors: Khách | Hệ thống thanh toán | Token Vault | Log
Khách -> Hệ thống thanh toán: nhập số thẻ, thanh toán
Hệ thống thanh toán -> Token Vault: đổi số thẻ thành token
Token Vault --> Hệ thống thanh toán: trả về token tok_abc123
Hệ thống thanh toán -> Log: ghi "thẻ ****3456 thành công"
Log --> Hệ thống thanh toán: đã ghi
~~~

### Lỗi hay gặp
- Lưu CVV trong cơ sở dữ liệu -> vi phạm PCI DSS, nếu bị lộ kẻ xấu có thể mua online.
- Lưu số thẻ thật ở dạng văn bản thô -> nếu bị lộ, tất cả thẻ bị theft.
- Ghi số thẻ đầy đủ vào log để debug -> mất mật thẻ.
- Token không được mã hóa hoặc lưu ở hệ thống không bảo mật -> kẻ xấu lấy được token và số thẻ.
- Nhân viên có thể xem số thẻ đầy đủ trong hệ thống quản lý -> vi phạm quyền ít nhất.

### Ví dụ đời thực

Một dev đang debug lỗi giao dịch thanh toán thẻ và viết log: "Giao dịch thẻ 1234 5678 9012 3456 thành công" để dễ tìm lỗi. Kiểm tra bảo mật phát hiện log chứa số thẻ đầy đủ (PAN) — vi phạm tiêu chuẩn PCI DSS. Điều tra code thấy hệ thống lưu số thẻ thật dưới dạng văn bản thô trong bảng giao dịch, và các thông điệp log in trộn số thẻ để troubleshoot. Nguyên nhân gốc: không có quy tắc che thẻ trong log, và số thẻ thật không được mã hóa hay thay bằng token. Cách xử lý: xóa toàn bộ log cũ chứa số thẻ, sửa code chỉ ghi 4 số cuối (**** **** **** 3456), áp dụng tokenization: thay số thẻ thật bằng token ngẫu nhiên, số thẻ thật lưu ở hệ thống vault riêng biệt và bảo mật cao; đồng thời xác nhận không bao giờ lưu mã CVV (3 số sau thẻ) sau khi xác nhận thanh toán. Kết quả: báo cáo bảo mật lần sau không còn tìm thấy số thẻ đầy đủ trong log hay cơ sở dữ liệu nghiệp vụ, và đơn vị đạt yêu cầu cơ bản của PCI DSS cho phía dev.

### Trả lời mẫu khi phỏng vấn

"PCI DSS (Payment Card Industry Data Security Standard) là tiêu chuẩn bảo mật mà mọi đơn vị lưu, xử lý hoặc truyền số thẻ thanh toán phải tuân theo, ví dụ ngân hàng và cổng thanh toán. Nguyên tắc quan trọng nhất là không bao giờ lưu mã CVV (3 số in sau thẻ) sau khi xác nhận thanh toán, vì nếu kẻ xấu lấy được số thẻ mà không có CVV thì không thể mua hàng trực tuyến. Thay vì lưu số thẻ thật, hệ thống dùng tokenization: thay số thẻ thật (PAN) bằng một mã giả ngẫu nhiên gọi là token, số thẻ thật được lưu ở hệ thống vault riêng biệt và bảo mật rất cao. Khi cần thanh toán, hệ thống gửi token đến vault để thực hiện. Nếu cơ sở dữ liệu bị lộ, kẻ xấu chỉ lấy được token, không thể đổi thành số thẻ thật mà không có khóa của vault. Khi ghi log, chỉ được che số thẻ, ví dụ hiển thị 4 số cuối, không bao giờ in số thẻ đầy đủ. Tôi nhấn mạnh PCI DSS không chỉ là mã hóa, mà là giảm thiểu dữ liệu nhạy cảm hệ thống phải lưu, và số thẻ thật chỉ nên tồn tại ở một nơi duy nhất."

> Senior tip: Trong phỏng vấn, hãy nói rằng PCI DSS không chỉ là "mã hóa" mà là "giảm thiểu tối thiểu dữ liệu nhạy cảm hệ thống cần lưu". Hãy nhấn mạnh rằng số thẻ thật chỉ cần lưu ở một nơi, và các hệ thống khác chỉ lưu token. Nếu có thể, hãy nói về một ví dụ hệ thống bạn đã xây dựng hoặc biết (ví dụ dùng một dịch vụ thanh toán của ngân hàng hoặc một nhà cung cấp tokenization được chứng nhận PCI).

> Cụm từ: PAN (Primary Account Number - số tài khoản chính) là số thẻ in trên thẻ (16 số), được bảo vệ bởi PCI DSS.

  `,
  follow: [
    'Tại sao cấm lưu CVV sau khi xác nhận thanh toán?',
    'Token khác mã hóa thế nào, và khi nào dùng cái gì?',
    'Log phải che số thẻ thế nào để an toàn?'
  ],
  tags: ['PCI DSS', 'CVV', 'tokenization', 'so the', 'log']
},
{
  id: 'banking-010',
  topic: 'banking',
  level: 'lead',
  q: 'Chuẩn thông điệp ISO 8583 (thẻ) và ISO 20022 (thanh toán) là gì ở mức khái niệm, và có những điểm khác nhau cơ bản?',
  a: `**Tóm tắt:** ISO 8583 là chuẩn thông điệp dùng cho giao dịch thẻ thanh toán (rút tiền, thanh toán tại ATM/POS), thiết kế cho độ trễ thấp và xử lý ngay. ISO 20022 là chuẩn thông điệp chung cho thanh toán (chuyển khoản, lệnh thu, thanh toán quốc tế), dùng định dạng XML/JSON giàu thông tin hơn. Cả hai đều là chuẩn thực tế, không phải do một ngân hàng nào bịa ra, và dev cần biết chúng để làm việc với hệ thống thẻ và thanh toán.

### ISO 8583 là gì (giải thích từ đầu)
ISO 8583 là chuẩn thông báo cho giao dịch thẻ (thanh toán, rút tiền, kiểm tra số dư) giữa thẻ, máy đọc thẻ (POS/ATM), hệ thống thẻ của ngân hàng và mạng thẻ (Visa, Mastercard...). Nó được thiết kế để xử lý nhanh, ít dữ liệu, và hoạt động ở vận tốc cao (mỗi giao dịch trong vài giây).

Thông báo ISO 8583 có cấu trúc: MTI (Message Type Identifier - loại thông báo, 4 số) và các trường dữ liệu (data elements, đại diện bởi số thứ tự). Ví dụ:
- MTI 0100: yêu cầu chuyển khoản (thanh toán/rút tiền).
- MTI 0110: trả lời yêu cầu chuyển khoản.
- MTI 0400: yêu cầu hoàn tiền (reversal).
- Trường 2: số thẻ (PAN).
- Trường 3: mã xử lý giao dịch (processing code).
- Trường 4: số tiền.
- Trường 11: mã điều khiển hệ thống (STAN, số thứ tự).
- Trường 41: máy đọc thẻ (terminal ID).
- Trường 49: mã tiền tệ (currency code).

Ví dụ: khách rút 2 triệu tại ATM. Máy đọc thẻ gửi thông báo ISO 8583 MTI 0100, trường 2 là số thẻ, trường 4 là 2000000, trường 49 là VND. Ngân hàng trả lời MTI 0110 với mã hoàn trả (ví dụ 00 = thành công).

### ISO 20022 là gì
ISO 20022 là chuẩn thông báo chung cho thanh toán (chuyển khoản, lệnh thu, thanh toán quốc tế...). Nó dùng định dạng XML hoặc JSON, cung cấp thông tin rất chi tiết (tên người gửi, tên người nhận, địa chỉ, lý do thanh toán, mã giới thiệu...). ISO 20022 được nhiều ngân hàng và hệ thống thanh toán quốc tế chấp nhận, bao gồm hệ thống thanh toán ngay tại Việt Nam (NAPAS đã dẫn đầu chuyển đổi sang ISO 20022 cho chuyển khoản nội bộ).

Ví dụ thông báo ISO 20022 có thể chứa: tên người gửi "Nguyễn Văn A", số tài khoản gửi, tên người nhận "Trần Thị B", số tài khoản nhận, số tiền, lý do "Thanh toán hóa đơn 123", mã tiền tệ VND.

### Điểm khác nhau cơ bản
| Tiêu chí | ISO 8583 | ISO 20022 |
| Đối tượng | Giao dịch thẻ (ATM/POS) | Thanh toán chung (chuyển khoản, lệnh thu...) |
| Định dạng | Trường số thứ tự (văn bản nhị phân/ASCII) | XML hoặc JSON |
| Thông tin | Ít, chỉ thông tin cần thiết | Nhiều, chi tiết người gửi/nhận, lý do |
| Tốc độ | Nhanh, xử lý ngay | Có thể chứa nhiều thông tin, xử lý bất đồng bộ |
| Ứng dụng | Rút tiền, thanh toán thẻ | Chuyển khoản liên ngân hàng, thanh toán quốc tế |

Ví dụ: rút tiền tại ATM dùng ISO 8583 (nhanh, ít dữ liệu). Chuyển tiền 200 triệu qua NAPAS có thể dùng ISO 20022 (chi tiết, có lý do thanh toán).

~~~seq
title: Rút tiền ATM dùng ISO 8583
actors: Khách | ATM | Hệ thống thẻ | Mạng thẻ | Ngân hàng
Khách -> ATM: đưa thẻ, nhập PIN, rút 2 triệu
ATM -> Hệ thống thẻ: gửi ISO 8583 MTI 0100
Hệ thống thẻ -> Mạng thẻ: chuyển tiếp yêu cầu
Mạng thẻ -> Ngân hàng: kiểm tra tài khoản, số dư
Ngân hàng --> Mạng thẻ: trả lời MTI 0110, mã 00 thành công
Mạng thẻ --> Hệ thống thẻ: trả kết quả
Hệ thống thẻ --> ATM: cho phép rút tiền
ATM --> Khách: phát 2 triệu, in hóa đơn
~~~

### Lỗi hay gặp
- Chung ISO 8583 và ISO 20022 là cùng một -> là hai chuẩn khác nhau, ứng dụng khác nhau.
- Điền sai trường ISO 8583 (cần biết trường nào dùng cho gì) -> gửi sai dữ liệu, ngân hàng đối tác từ chối.
- Thấy ISO 20022 như đơn giản (chỉ có số tiền và tài khoản) -> thiếu thông tin, giao dịch bị không chấp nhận.
- Không cập nhật khi chuẩn thay đổi (ví dụ ISO 20022 có nhiều phiên bản) -> hệ thống cũ bị lỗi khi kết nối với đối tác mới.

### Ví dụ đời thực

Một ngân hàng triển khai chuyển khoản liên ngân hàng, nhưng dev nhầm chung hai chuẩn. Triệu chứng: khi khách rút tiền tại ATM, máy POS gửi thông báo theo dạng XML như ISO 20022, trong khi mạng thẻ yêu cầu ISO 8583; toàn bộ yêu cầu bị từ chối, khách không rút được tiền trong suốt hai giờ. Dev kiểm tra log hệ thống thẻ và thấy thông điệp không đúng cấu trúc trường số thứ tự của ISO 8583 (MTI, trường 2 số thẻ, trường 4 số tiền...), nên mạng thẻ không nhận dạng được. Nguyên nhân gốc: dùng sai chuẩn — ISO 8583 là chuẩn cho giao dịch thẻ (rút tiền, thanh toán POS), dùng trường số thứ tự và xử lý nhanh; ISO 20022 dùng XML/JSON cho chuyển khoản và thanh toán quốc tế, chứa nhiều thông tin hơn. Cách xử lý: triển khai lại module giao tiếp mạng thẻ theo ISO 8583, điền đúng từng trường (trường 2 PAN, trường 4 số tiền, trường 41 mã máy đọc thẻ...), và kiểm tra mẫu thông điệp với mạng thẻ trước khi đưa vào production. Kết quả: giao dịch rút tiền và thanh toán thẻ quay trở lại bình thường, tỷ lệ từ chối của mạng thẻ về 0.

### Trả lời mẫu khi phỏng vấn

"ISO 8583 là chuẩn thông điệp dùng cho giao dịch thẻ thanh toán, ví dụ rút tiền tại ATM, thanh toán POS. Thông điệp này ngắn, được xử lý trong vài giây, và gồm mã loại thông báo MTI (4 số) kèm các trường có số thứ tự, ví dụ trường 2 là số thẻ, trường 4 là số tiền, trường 41 là mã máy đọc thẻ. ISO 20022 là chuẩn thông điệp chung cho thanh toán, ví dụ chuyển khoản, lệnh thu và thanh toán quốc tế, dùng định dạng XML hoặc JSON, chứa nhiều thông tin chi tiết hơn như tên người gửi, tên người nhận và lý do thanh toán. Cách phân biệt đơn giản: giao dịch thẻ tại thiết bị bán lẻ thường dùng ISO 8583, còn chuyển khoản liên ngân hàng và thanh toán quốc tế thường dùng ISO 20022. Dev không cần đọc hết tài liệu chuẩn, chỉ cần biết ánh xạ dữ liệu từ hệ thống trong ngân hàng sang định dạng chuẩn khi gửi đến đối tác, và điền đúng từng trường để đối tác không từ chối giao dịch. Nếu nhầm chuẩn, ví dụ gửi định dạng XML cho mạng thẻ yêu cầu ISO 8583, toàn bộ giao dịch sẽ bị từ chối và khách không rút được tiền."

> Senior tip: Trong phỏng vấn, không cần xem xét toàn bộ chuẩn (hơn trăm trang). Hãy nắm rõ: ISO 8583 cho thẻ, ISO 20022 cho thanh toán chung, cả hai đều dùng XML/JSON (ISO 20022) hoặc trường số (ISO 8583), và dev phải biết ánh xạ dữ liệu từ hệ thống trong ngân hàng sang chuẩn ngoại khi gửi đến đối tác. Nếu có thể, hãy nói về một ví dụ bạn đã làm việc với một hệ thống thông báo nào (ví dụ hệ thống thẻ, hệ thống chuyển tiền) và chuẩn nó dùng.

> Cụm từ: MTI (Message Type Identifier - mã loại thông báo) là 4 số ở đầu thông báo ISO 8583, chỉ thông báo đây là loại gì (yêu cầu thanh toán, trả lời, hoàn tiền...).

  `,
  follow: [
    'ISO 8583 và ISO 20022 khác nhau ở đâu, và dùng cho việc gì?',
    'MTI là gì, và một số MTI thường gặp?',
    'Tại sao ISO 20022 được ưa chuộng cho thanh toán quốc tế?'
  ],
  tags: ['ISO 8583', 'ISO 20022', 'thong bao the', 'thanh toan']
},
{
  id: 'banking-011',
  topic: 'banking',
  level: 'senior',
  q: 'Tính lãi tiền gửi/khoản vay trong code: dùng BigDecimal, quy ước ngày (actual/365), và làm tròn như thế nào?',
  a: `**Tóm tắt:** Tiền trong code Java phải dùng BigDecimal, không dùng double, vì double bị sai số làm tròn (0.1 + 0.2 không bằng 0.3 chính xác). Tính lãi cần xác định quy ước ngày (ví dụ actual/365: chia số ngày thực tế cho 365) và quy tắc làm tròn (thường là làm tròn đến 2 chữ số thập phân theo HALF_UP). Dev phải viết mã tính lãi rõ ràng, kiểm tra được và không bị sai số tích lũy.

### Tiền trong code là gì (giải thích từ đầu)
Java có hai kiểu lưu số thực chính: double và BigDecimal. Double lưu số thực theo định dạng nhị phân, có các số không được lưu chính xác (ví dụ 0.1 + 0.2 = 0.30000000000000004). Vì sao? Vì double lưu 0.1 với một giá trị gần đúng, không chính xác. Cho tiền, sai số nhỏ này là không chấp nhận được, vì một đồng lệch cũng là lỗi.

BigDecimal lưu số thực như một số nguyên lớn và vị trí chấm số thập phân, được tính chính xác đến từng chữ số thập phân. Do đó ngân hàng dùng BigDecimal cho tất cả phép toán tiền (số dư, lãi, phí, thuong).

### Tính lãi tiền gửi/khoản vay
Công thức lãi đơn: Lãi = Dư nợ × Lãi suất × Số ngày / 365 (quy actual/365).
- Dư nợ: số tiền còn lại trong tài khoản gửi hoặc khoản vay.
- Lãi suất: phần trăm năm (ví dụ 6% năm).
- Số ngày: số ngày tiền được gửi hoặc vay (từ ngày đến ngày).
- 365: số ngày trong một năm (quy actual/365, dùng ở Việt Nam và nhiều nước).

Ví dụ: gửi 100 triệu, lãi suất 6% năm, gửi 30 ngày.
Lãi = 100.000.000 × 0.06 × 30 / 365 = 493.150.68... VND.
Làm tròn đến 2 chữ số thập phân: 493.150.68 VND.

### Làm tròn tiền
Tiền phải làm tròn đến 2 chữ số thập phân (đơn vị tiền tệ nhỏ nhất). BigDecimal có phương thức setScale(2, RoundingMode.HALF_UP) để làm tròn đến 2 chữ số, làm tròn lên nếu chữ số thứ 3 >= 5.

Quy tắc làm tròn quan trọng:
- Luôn làm tròn sau mỗi phép tính lãi, không để số dư trong gian.
- Nếu có nhiều giao dịch, tổng tiền lãi sau khi làm tròn mỗi giao dịch phải bằng tổng tiền lãi của kỳ (nếu không, chênh lệch phải được điều chỉnh).
- Không được làm tròn hai lần (làm tròn tron), vì sẽ sai.

~~~seq
title: Tính lãi tiền gửi với BigDecimal
actors: App | Tính lãi | CSDL
App -> Tính lãi: tính lãi 100 triệu, 6%/năm, 30 ngày
Tính lãi -> CSDL: đọc dư nợ, lãi suất, số ngày
CSDL --> Tính lãi: dư nợ 100 triệu, 6%, 30 ngày
Tính lãi --> App: 493.150,68 VND (đã làm tròn)
App --> Khách: hiển thị số tiền lãi
~~~

~~~java
public class InterestCalculator {
    public static BigDecimal calculateInterest(BigDecimal principal, BigDecimal annualRate, int days) {
        // Lãi = principal * rate * days / 365
        BigDecimal interest = principal
            .multiply(annualRate)
            .multiply(BigDecimal.valueOf(days))
            .divide(BigDecimal.valueOf(365), 10, RoundingMode.HALF_UP);
        return interest.setScale(2, RoundingMode.HALF_UP);
    }
}
~~~

Code trên tính lãi chính xác đến 10 chữ số thập phân trong gian, rồi làm tròn đến 2 chữ số ở bước cuối. Phép chia 365 dùng divide với scale cao để không bị mất dữ liệu ở giữa.

### Quy ước ngày (actual/365)
Actual/365 nghĩa là chia số ngày thực tế (từ ngày đến ngày, bao gồm cả hai đầu và cuối nếu quy tắc cho phép) cho 365. Có nhiều quy ước khác (actual/360, 30/360...) nhưng actual/365 là thường gặp ở Việt Nam. Dev cần biết quy ước của sản phẩm và dùng đúng một quy ước cho toàn bộ tính toán, không trộn lẫn.

Ví dụ: gửi từ 1/1 đến 31/1 là 31 ngày. Lãi = dư nợ × 6% × 31 / 365.

### Lỗi hay gặp
- Dùng double cho tiền -> sai số, tài khoản lệ 1 đồng, kiểm toán không chấp nhận.
- Làm tròn ở bước giữa, không chỉ bước cuối -> sai tổng tiền.
- Không ghi quy ước ngày (actual/365 hay 360) -> lãi sai khi so sánh với hệ thống cũ.
- Tính lãi theo ngày lịch, không trừ ngày lễ/chủ nhật nếu quy tắc chỉ tính ngày làm việc -> sai số ngày.

### Ví dụ đời thực

Một sổ tiền gửi 100 triệu đồng, lãi suất 6% mỗi năm, gửi 30 ngày. Dev tính lãi bằng kiểu double và làm tròn ở mỗi phép tính giữa. Triệu chứng: khách gọi khiếu nại số tiền lãi sai 1 đến 2 đồng so với tay tính, và trên 10.000 sổ tiền gửi thì tổng chênh lệch lên hàng chục nghìn đồng. Điều tra thấy code dùng double (0.1 + 0.2 không bằng 0.3 chính xác do lưu nhị phân), chia cho 365 gây sai số nhị phân, và làm tròn ở mỗi bước nhân chia. Nguyên nhân gốc: tiền trong Java phải dùng BigDecimal, và chỉ được làm tròn một lần ở bước cuối. Cách xử lý: viết lại bằng BigDecimal, tính lãi = gốc × lãi suất × ngày / 365 với độ dài lớn trong gian, rồi setScale(2, HALF_UP) ở cuối; kiểm tra lại 10.000 sổ, tổng lãi khớp với sổ cái kế toán. Kết quả: sai số lãi giảm xuống 0 đồng, báo cáo lãi lỗ cuối ngày khớp sổ cái, và kiểm toán chấp nhận.

### Trả lời mẫu khi phỏng vấn

"Tiền trong code Java phải dùng BigDecimal chứ không phải double, vì double lưu số thực theo định dạng nhị phân và bị sai số làm tròn, ví dụ 0.1 + 0.2 không bằng 0.3 chính xác — với tiền, một đồng lệch cũng là lỗi mà kiểm toán không chấp nhận. Tính lãi tiền gửi hoặc khoản vay dùng công thức Lãi = Dư nợ × Lãi suất năm × Số ngày / 365, quy ước này gọi là actual/365, ví dụ gửi 100 triệu đồng, lãi suất 6%/năm, gửi 30 ngày cho khoảng 493.150,68 đồng. Làm tròn tiền chỉ được thực hiện một lần ở bước cuối, dùng setScale(2, RoundingMode.HALF_UP) để giữ đúng 2 chữ số thập phân, không được làm tròn ở từng bước giữa vì tổng sẽ sai. Phép chia trong BigDecimal phải chỉ định scale và chế độ làm tròn, nếu không chương trình sẽ ném ArithmeticException. Tôi nhấn mạnh quy ước ngày phải được ghi vào tài liệu và dùng nhất quán trên toàn hệ thống, không được trộn actual/365 với actual/360 hay 30/360."

> Senior tip: Trong phỏng vấn, hãy vẽ công thức lãi trên giấy: Lãi = Dư nợ × Lãi suất × Số ngày / 365, và nói rằng BigDecimal là bắt buộc. Hãy nhấn mạnh rằng phép chia trong BigDecimal cần chỉ định scale và RoundingMode, nếu không sẽ ném ArithmeticException khi chia không chia hết. Nếu có thể, hãy nói về một ví dụ sai số của double (0.1 + 0.2) để minh chứng.

> Cụm từ: RoundingMode (che độ làm tròn) là quy tắc quy định chữ số thập phân ở vị trí làm tròn được xử lý thế nào (ví dụ HALF_UP = làm tròn lên nếu chữ số tiếp theo >= 5).

  `,
  follow: [
    'Tại sao tiền trong Java phải dùng BigDecimal không dùng double?',
    'Quy ước actual/365 là gì, và khác với 360 thế nào?',
    'Làm tròn tiền phải làm gì để tránh sai số?'
  ],
  tags: ['BigDecimal', 'tinh lai', 'actual/365', 'lam tron']
},
{
  id: 'banking-012',
  topic: 'banking',
  level: 'senior',
  q: 'Khi core banking bảo trì ban đêm, hệ thống phải làm gì để không ảnh hưởng khách hàng: hàng đợi, store-and-forward, và thông báo khách như thế nào?',
  a: `**Tóm tắt:** Khi core banking bảo trì ban đêm, các giao dịch từ khách hàng không thể xử lý ngay được. Hệ thống cần hàng đợi để lưu yêu cầu, cơ chế store-and-forward (lưu lại rồi gửi khi core quay lại) để không mất giao dịch, và thông báo khách hàng trước để khách biết hạn mức hoặc thời gian không dịch vụ. Dev cần thiết kế các thành phần này để hệ thống vẫn sẵn sàng và khách không bị bất ngờ.

### Core banking bảo trì ban đêm là gì (giải thích từ đầu)
Core banking cần bảo trì (sửa lỗi, cập nhật phần mềm, sao lưu dữ liệu) không thích lập trình, thường chạy vào đêm khi khách ít giao dịch. Trong thời gian bảo trì, core không nhận hoặc xử lý giao dịch mới. Nếu khách vẫn dùng app để chuyển tiền, rút tiền, thanh toán hóa đơn, hệ thống phải có cách xử lý yêu cầu này cho đến khi core quay lại.

### Hàng đợi (queue)
Hàng đợi là nơi lưu yêu cầu giao dịch khi core đang bảo trì. Khách gửi yêu cầu (chuyển tiền, nạp tiền...), hệ thống không báo lỗi ngay mà lưu vào hàng đợi, trả về thông báo "yêu cầu đã được chấp nhận, sẽ xử lý sau". Khi core quay lại, hệ thống lấy yêu cầu ra hàng đợi và xử lý.

Hàng đợi phải:
- Lưu yêu cầu vào bộ nhớ đệm hoặc cơ sở dữ liệu (nếu mất điện, yêu cầu không bị mất).
- Xử lý theo thứ tự đến (first in, first out).
- Giới hạn kích thước (nếu quá nhiều yêu cầu, thông báo hết hạn mức).

Ví dụ: 1000 khách chuyển tiền trong thời gian bảo trì 2 giờ. Hết tất cả lưu vào hàng đợi. Sau bảo trì, hệ thống xử lý 1000 giao dịch từ hàng đợi.

### Store-and-forward (lưu rồi gửi)
Store-and-forward là lưu yêu cầu giao dịch tại hệ thống trung gian, rồi gửi đến core khi core sẵn sàng. Đây là nâng cao của hàng đợi, đảm bảo yêu cầu không bị mất nếu hệ thống giữa giây mất điện hoặc core ngừng hoạt động.

Quy trình:
1. Khách gửi yêu cầu đến hệ thống trung gian (API gateway hoặc dịch vụ).
2. Hệ thống trung gian lưu yêu cầu vào cơ sở dữ liệu (store).
3. Trả về thông báo cho khách "đã chấp nhận".
4. Khi core quay lại, hệ thống trung gian đọc yêu cầu từ cơ sở dữ liệu và gửi đến core (forward).
5. Sau khi core xử lý thành công, xóa yêu cầu khỏi cơ sở dữ liệu.

Nếu core vẫn đang bảo trì, hệ thống thử gửi lại sau một khoảng thời gian (retry), nhưng không tự động trừ tiền khách (xem lại bài idempotency).

~~~seq
title: Store-and-forward khi core bao tri
actors: Khach | API Gateway | Hang doi DB | Core | Khach
Khach -> API Gateway: yeu cau chuyen tien 2 trieu
API Gateway -> Hang doi DB: luu yeu cau, trang thai đang xử lý
Hang doi DB --> API Gateway: da luu
API Gateway --> Khach: thong bao da chấp nhận, se xu ly sau
Core --> API Gateway: san sang
API Gateway -> Hang doi DB: lay yeu cau đang xử lý
API Gateway -> Core: gui yeu cau chuyen tien
Core --> API Gateway: thanh cong
API Gateway -> Hang doi DB: xoa yeu cau
API Gateway --> Khach: thong bao da chuyen xong
~~~

### Thông báo khách
Dev cần thông báo khách trước khi core bảo trì (qua email, SMS, thông báo trong app):
- Thời gian bảo trì (bắt đầu, kết thúc dự kiến).
- Dịch vụ không thể dùng (chuyển tiền, rút tiền, kiểm tra số dư...).
- Cách liên hệ nếu cần giúp.
- Cảm ơn khách đã đồng bộ.

Trong thời gian bảo trì, nếu khách thực hiện giao dịch, hệ thống phải thông báo ngay "hệ thống đang bảo trì, yêu cầu của bạn đã được lưu và sẽ được xử lý sau". Sau khi xong, thông báo kết quả thành công hoặc thất bại.

Ví dụ SMS: "Ngân hàng ABC bảo trì hệ thống từ 23 giờ đến 1 giờ ngày mai. Chuyển tiền, rút tiền tạm không dùng. Yêu cầu của bạn đã được lưu và sẽ được xử lý sau khi hoàn tất."

### Lỗi hay gặp
- Không lưu yêu cầu khi core bảo trì -> yêu cầu bị mất, khách phàn nàn.
- Tự động retry và trừ tiền nhiều lần -> khách bị mất tiền, vi phạm idempotency.
- Thông báo khách muộn -> khách hoang mang, gọi điện bàn chuyển.
- Hàng đợi không giới hạn -> hệ thống quá tải khi nhiều khách giao dịch cùng lúc.
- Không có thông báo sau khi xong -> khách không biết giao dịch đã thành công chưa.

### Ví dụ đời thực

Core banking bảo trì từ 23 giờ đến 1 giờ sáng, nhưng trong khoảng đó vẫn có 1.000 khách dùng app để chuyển tiền, nạp tiền và thanh toán hóa đơn. Triệu chứng: hệ thống cũ gọi trực tiếp core, nhận lỗi "core đang bảo trì" và trả lỗi ngay cho khách, yêu cầu của khách bị mất và cuộc gọi tổng đài tăng đột biến. Điều tra thấy code không lưu yêu cầu khi core không sẵn sàng, và không thông báo khách trước. Nguyên nhân gốc: không có hàng đợi để đợi yêu cầu, không có cơ chế store-and-forward, và thiếu thông báo khách. Cách xử lý: khi bảo trì, hệ thống lưu mỗi yêu cầu vào cơ sở dữ liệu (store), trả về khách "đã chấp nhận, sẽ xử lý sau", rồi gửi yêu cầu đến core khi hệ thống quay lại (forward), xóa yêu cầu sau khi thành công. Đồng thời gửi SMS và thông báo trong app trước khi bảo trì, nêu thời gian, dịch vụ không dùng được và cách liên hệ. Kết quả: trong cửa sổ bảo trì không yêu cầu nào bị mất, cuộc gọi tổng đài giảm 70%, và sau khi xong bảo trì toàn bộ danh sách trễ được xử lý kèm thông báo kết quả cho khách.

### Trả lời mẫu khi phỏng vấn

"Khi core banking bảo trì ban đêm, hệ thống không được từ chối yêu cầu của khách ngay lập tức. Thay vào đó, mỗi yêu cầu chuyển tiền, nạp tiền hay thanh toán được lưu vào hàng đợi trong cơ sở dữ liệu, hệ thống trả về khách thông báo "đã chấp nhận, sẽ xử lý sau", rồi gửi yêu cầu đến core khi hệ thống quay lại — cơ chế này gọi là store-and-forward (lưu rồi gửi), đảm bảo yêu cầu không bị mất ngay cả khi máy giữa giây mất điện hay core ngừng hoạt động. Sau khi core xử lý thành công, yêu cầu được xóa khỏi hàng đợi và khách nhận thông báo kết quả thành công hoặc thất bại. Trước khi bảo trì, dev phải gửi email, SMS và thông báo trong ứng dụng nêu rõ thời gian bảo trì, dịch vụ nào không dùng được và cách liên hệ nếu cần giúp. Hàng đợi phải lưu trong cơ sở dữ liệu chứ không chỉ trong bộ nhớ đệm, để không mất yêu cầu khi mất điện. Sau khi xong bảo trì, hệ thống phải xử lý toàn bộ danh sách yêu cầu trễ (backlog) và thông báo kết quả cho khách, không được bỏ qua."

> Senior tip: Trong phỏng vấn, hãy nói rằng hệ thống không bao giờ từ chối yêu cầu của khách ngay cả khi core đang bảo trì. Hàng đợi và store-and-forward đảm bảo yêu cầu không bị mất, thông báo khách đảm bảo khách không bị bất ngờ. Hãy nhấn mạnh rằng sau khi xong bảo trì, hệ thống phải xử lý hàng đợi trễ (backlog) và thông báo kết quả cho khách, không được bỏ qua.

> Cụm từ: Backlog (danh sách trễ) là tập hợp các yêu cầu đã được lưu nhưng chưa được xử lý, cần xử lý sau khi hệ thống quay lại bình thường.

  `,
  follow: [
    'Tại sao cần lưu yêu cầu vào cơ sở dữ liệu không chỉ lưu vào bộ nhớ đệm?',
    'Store-and-forward khác hàng đợi thông thường thế nào?',
    'Sau khi xong bảo trì, bạn xử lý hàng đợi trễ thế nào?'
  ],
  tags: ['bao tri', 'hang doi', 'store-and-forward', 'thong bao khach']
},
{
  id: 'banking-013',
  topic: 'banking',
  level: 'mid',
  q: 'Khi khách quẹt thẻ, vì sao tiền chỉ "bị giữ" chứ chưa chuyển ngay? Bốn bước authorization, capture, settlement và chargeback diễn ra thế nào?',
  a: `**Tóm tắt:** Khi khách quẹt thẻ, ngân hàng chưa chuyển tiền thật, chỉ **đóng băng (hold)** một số tiền trên hạn mức hoặc tài khoản — đó là bước *authorization*. Tiền chỉ đi khi merchant (cửa hàng) gửi lệnh *capture* rồi *settlement* (chuyển tiền theo lô giữa các ngân hàng). Nếu khách khiếu nại, giao dịch có thể bị *chargeback* — ngân hàng phát hành đòi tiền ngược. Vì bốn bước này rời nhau và hai bước cuối chạy theo lô, khách thấy tiền "bị giữ" từ 1 đến 7 ngày.

### Bốn bên trong một giao dịch thẻ
| Bên | Vai trò | Ví dụ |
|---|---|---|
| Chủ thẻ | người dùng thẻ để trả tiền | khách mua hàng |
| Merchant | nơi chấp nhận thanh toán | siêu thị, website, khách sạn |
| Acquirer | ngân hàng của merchant, nhận tiền chuyển về cho merchant | Ngân hàng B |
| Issuer | ngân hàng phát hành thẻ, quản lý tiền/hạn mức của chủ thẻ | Ngân hàng A |
| Card network | mạng thẻ nối acquirer và issuer, đặt chuẩn thông điệp, phí và luật khiếu nại | Visa, Mastercard |

### Bước 1 — authorization: xin phép và giữ tiền
Máy POS hoặc website gửi câu hỏi "khách này có trả nổi 2.000.000 đồng không?" tới acquirer, acquirer chuyển qua network, network chuyển tới issuer. Issuer kiểm tra ba việc:
1. Thẻ còn hiệu lực, không bị khóa, không nằm trong danh sách chặn.
2. Hạn mức còn đủ: thẻ tín dụng hạn mức 20 triệu, đã dùng 15 triệu, còn khả dụng 5 triệu — thương vụ 6 triệu sẽ bị từ chối với mã "over limit".
3. Điểm gian lận (fraud score) của thương vụ.
Nếu đạt, issuer trừ khỏi **số dư khả dụng** và trả về mã approve kèm *auth code*. Tiền vẫn nằm ở issuer, chỉ bị "đánh dấu giữ". Khách mở app thấy dòng "giao dịch chờ xử lý" — đó là hold, chưa phải tiền đã mất.

### Bước 2 — capture: merchant xác nhận lấy tiền thật
Vài giờ hoặc vài ngày sau, merchant gửi lệnh capture cho một phần hoặc toàn bộ số tiền đã auth. Ví dụ khách sạn auth 3 triệu khi nhận phòng, khách chỉ ở một đêm hết 1.500.000 → merchant capture 1.500.000, 1.500.000 còn lại được giải phóng. Vì vậy hệ thống phải hỗ trợ *partial capture* và *multiple capture* trên cùng một auth, và **không bao giờ cho capture vượt số đã auth**.

### Bước 3 — settlement: tiền thật sự chuyển
Cuối ngày merchant gom các capture thành một file gửi acquirer (gọi là file settlement). Network tính số ròng (net) giữa các thành viên, issuer chuyển tiền thật cho acquirer, acquirer trả cho merchant sau khi trừ phí merchant (MDR). Tiền về tài khoản merchant thường ở T+1 hoặc T+2, với T là ngày gửi file settlement.

### Bước 4 — chargeback: đòi tiền ngược
Khách gọi issuer khiếu nại: không nhận được hàng, hàng không như mô tả, hoặc "tôi không quẹt thẻ lần này" (gian lận). Issuer khởi tạo chargeback, tiền bị thu ngược từ acquirer rồi từ merchant, kèm phí. Merchant có quyền *representment* — gửi bằng chứng (bill có chữ ký, ảnh giao hàng, log thiết bị) để phản biện. Hoàn tiền chủ động (refund) và chargeback là hai đường khác nhau: refund do merchant tự làm, không phạt; chargeback do ngân hàng ép, tính vào tỷ lệ chargeback của merchant và vượt ngưỡng thì mạng thẻ có thể chấm dứt hợp đồng.

### Luồng đầy đủ
~~~seq
title: The quet - auth, capture, settlement
actors: Chu the | Merchant | Acquirer | Network | Issuer
Chu the -> Merchant: quet the 2.000.000 dong
Merchant -> Acquirer: tao yeu cau authorization
Acquirer -> Network: chuyen yeu cau toi issuer
Network -> Issuer: kiem tra the va han muc
Issuer -> Issuer: giu hold 2.000.000 tren han muc
Issuer --> Network: approve cung auth code
Network --> Acquirer: approve
Acquirer --> Merchant: thanh cong, in bien lai
note Merchant..Issuer: hom sau merchant gui file capture
Merchant -> Acquirer: capture toan bo 2.000.000
Acquirer -> Network: settlement cuoi ngay
Network -> Issuer: yeu cau chuyen tien that
Issuer --> Network: ghi no tai khoan khach
Network --> Acquirer: tien ve, tru phi MDR
Acquirer --> Merchant: thanh toan cho merchant T+1
~~~

### Thiết kế phía dev: máy trạng thái và bảng hold
Trạng thái thường dùng: CREATED, AUTHORIZED, PARTIALLY_CAPTURED, CAPTURED, SETTLED, REFUNDED, CHARGEBACKED, AUTH_EXPIRED. Mỗi bước chuyển trạng thái phải ghi lại id của bước trước (auth id để capture, capture id để settlement) — nếu không, khi khiếu nại bạn không truy được "2 triệu này nằm ở đâu".

~~~java
record Hold(String paymentId, BigDecimal authorized, BigDecimal captured, Instant expiresAt) {}

BigDecimal capturable(Hold h, BigDecimal requested, Instant now) {
    if (h == null || h.expiresAt().isBefore(now)) return BigDecimal.ZERO;
    BigDecimal remaining = h.authorized().subtract(h.captured());
    return remaining.min(requested);      // capture không báo lớn hơn số còn được giữ
}
~~~

### Vì sao tiền "bị giữ" vài ngày — nguyên nhân thật
- Auth có hạn: merchant quên capture thì hold tự hết sau vài ngày (khách sạn, xăng, cho thuê xe thường giữ lâu hơn vì số tiền cuối chưa biết).
- Capture và settlement chạy theo lô cuối ngày, không chạy tức thời.
- Giao dịch nước ngoài: số tiền hold là ước lượng theo tỷ giá tạm tính, số capture chính thức có thể lệch vài chục nghìn đồng, app phải hiển thị số "tạm giữ".

### Ví dụ đời thực

Một siêu thị lớn xử lý 50.000 giao dịch thẻ mỗi ngày. Một buổi chiều, hơn 200 khách khiếu nại ứng dụng ngân hàng hiển thị "giao dịch chờ xử lý" kéo dài 3 ngày cho các giao dịch mua hàng cuối tuần. Đội dev tra soát log issuer và thấy: các giao dịch đã được authorize thành công, nhưng file settlement từ acquirer (ngân hàng của siêu thị) bị gửi trễ do sự cố máy chủ NAPAS ngày Chủ nhật. Hệ thống issuer không có job tự động giải phóng hold hết hạn (auth code chỉ giữ 7 ngày), nên các hold vẫn hiện "chờ xử lý". Nguyên nhân gốc: thiếu job cron chạy hàng ngày kiểm tra các hold sắp hết hạn và giải phóng số dư khả dụng, đồng thời thiếu cảnh báo khi file settlement không đến đúng giờ. Cách xử lý: chạy script giải phóng các hold quá 7 ngày, bổ sung job hàng ngày 02:00 kiểm tra hold sắp hết hạn và gửi thông báo đến khách, và thêm bộ giám sát (alert) khi acquirer không gửi file settlement trước 10:00 sáng hôm sau. Kết quả: sau khi triển khai, không còn case hold "chờ xử lý" kéo dài quá 24 giờ, và số khiếu nại về số dư khả dụng giảm 90%.

### Trả lời mẫu khi phỏng vấn

"Khi khách quẹt thẻ, tiền chỉ bị giữ (authorization) chứ chưa chuyển ngay. Có bốn bước: authorization — issuer kiểm tra hạn mức và giữ chỗ tiền; capture — merchant xác nhận lấy tiền thật (có thể một phần); settlement — tiền thật sự chuyển giữa ngân hàng qua NAPAS/Visa/Mastercard, thường T+1 hoặc T+2; chargeback — khách khiếu nại, tiền bị thu ngược. Tiền chỉ rời issuer ở bước settlement, mọi thứ trước đó chỉ là giữ chỗ trên sổ. Quan trọng: hold phải có hạn và có job tự động giải phóng, và tỷ lệ chargeback là chỉ số sống còn của merchant nên hệ thống phải lưu bằng chứng (hóa đơn có chữ ký, log thiết bị) ngay khi giao dịch xảy ra, không chờ lúc có khiếu nại."

### Lỗi hay gặp
- Cho phép capture lớn hơn amount đã auth, hoặc không cộng dồn partial capture → khách bị trừ nhiều hơn số đồng ý.
- Không lưu auth id → không capture được, hold treo đến hết hạn, merchant mất tiền.
- Coi refund và chargeback là một trạng thái → không biết ai đang giữ tiền và ai phải trả phí.
- Xử lý file settlement trùng lặp → trả tiền hai lần cho merchant; bắt buộc khóa chống trùng (idempotency key) theo id thương vụ trong file.

> Senior tip: Khi phỏng vấn, hãy nói rõ "tiền của khách chỉ rời issuer ở bước settlement, mọi thứ trước đó chỉ là giữ chỗ trên sổ". Nói thêm hai điều ghi điểm: (1) hold phải có hạn và có job giải phóng, (2) tỷ lệ chargeback là chỉ số sống còn của merchant nên hệ thống phải giữ bằng chứng (proof of delivery, chữ ký, log thiết bị) ngay khi giao dịch xảy ra, không phải lúc có khiếu nại.

> Cụm từ: Hold (lượng tiền bị giữ) là phần số dư khả dụng bị đánh dấu tạm thời không dùng được, chưa ghi nhận thành giao dịch chính thức. MDR (Merchant Discount Rate) là phí merchant phải trả cho mỗi thương vụ thẻ, bị trừ ngay ở bước settlement.

  `,
  follow: [
    'Vì sao không cho phép capture vượt số tiền đã authorization, và capture nhiều phần thì cộng dồn thế nào?',
    'Refund và chargeback khác nhau ở điểm nào trong sổ cái và trong luồng xử lý?',
    'Hold hết hạn mà merchant không capture thì hệ thống phải làm gì để khách không khiếu nại?'
  ],
  tags: ['the', 'authorization', 'capture', 'settlement', 'chargeback']
},
{
  id: 'banking-014',
  topic: 'banking',
  level: 'mid',
  q: 'Thanh toán bằng mã QR (VietQR) diễn ra thế nào từ lúc khách quét mã đến khi tiền vào tài khoản người bán? QR tĩnh khác QR động ở đâu, và vì sao ảnh "chuyển khoản thành công" không phải bằng chứng?',
  a: `**Tóm tắt:** Bản chất mã QR thanh toán chỉ là một "tờ giấy ghi sẵn thông tin chuyển khoản": ngân hàng thụ hưởng, số tài khoản, tên, số tiền, nội dung. App ngân hàng của khách quét, đọc các trường đó rồi khởi tạo một lệnh chuyển khoản nhanh 24/7. Lệnh đi qua hệ thống chuyển mạch (ở Việt Nam là NAPAS), tiền vào tài khoản người bán, người bán nhận báo có qua app hoặc webhook. QR không giữ tiền và không chứng minh đã thanh toán — chỉ sổ cái của ngân hàng chứng minh được điều đó.

### QR tĩnh và QR động
| | QR tĩnh | QR động |
|---|---|---|
| Nơi hiển thị | in ra, dán ở quầy | màn hình POS, trang checkout |
| Số tiền | không có, khách tự nhập | có, sinh theo đơn hàng |
| Mã đơn hàng | không gắn | gắn với một đơn cụ thể |
| Hết hạn | không | thường vài phút |
| Rủi ro chính | kẻ gian dán đè QR của mình lên QR cửa hàng | ít, nhưng phải xử lý hết hạn |
| Dùng cho | quán ăn nhỏ, tạp hóa | cửa hàng có POS, thương mại điện tử |

QR tĩnh tiện nhưng hở: khách nhập tay số tiền nên sai tiền, và vì QR không gắn với đơn hàng, người bán phải đoán "khoản nhận 87.000 đồng lúc 19:03 là của bàn nào". QR động sinh ra kèm nội dung chuyển khoản chứa mã đơn, giúp đối soát tự động.

### Bên trong mã QR chứa gì
Chuẩn phổ biến là EMVCo QR, các trường viết dạng TLV (Tag-Length-Value: mỗi trường gồm mã trường, độ dài, rồi giá trị, nối thành một chuỗi không dấu cách). Các trường thường gặp:
- Trường 26 (merchant account information): **BIN** — dãy số đầu nhận diện ngân hàng thụ hưởng — và số tài khoản người bán.
- Trường 52: MCC, mã loại hình cửa hàng (bán lẻ, siêu thị, khách sạn...).
- Trường 53: mã tiền tệ theo ISO 4217, VND là 704. Trường 54: số tiền (chỉ có ở QR động).
- Trường 59, 60, 61: tên, thành phố, mã bưu điện người bán. Trường 58: quốc gia (VN).
- Trường 62: dữ liệu bổ sung, thường chứa mã đơn hàng — đây là mấu chốt để đối soát tự động.
- Trường 63: CRC, 4 ký tự kiểm tra cuối chuỗi, giúp phát hiện QR bị cắt hoặc bị sửa.

~~~text
Ví dụ minh họa cấu trúc TLV (không phải payload thật của ngân hàng nào):
00 02 01            : phien ban
01 02 12            : kieu QR (12 = thanh toan hang hoa, dich vu)
26 26 0010 970436 0114 1028394056 : BIN ngan hang tho huong + so tai khoan
52 04 5311          : MCC cua hang ban le
53 03 704           : tien te VND
54 06 250.00        : so tien
59 15 CUA HANG A    : tên người bán
60 06 HA NOI        : thanh phan
58 02 VN            : quoc gia
62 17 01 13 A123456 : ma don hang (truong con ben trong)
63 04 B7F2          : CRC
~~~

Số tiền trong QR chỉ là **đề nghị**; khách vẫn có thể đổi (với QR tĩnh) hoặc app vẫn phải hiện màn hình xác nhận. Vì vậy người bán không được lấy số tiền từ QR làm bằng chứng đã thu, mà phải lấy số tiền ghi trên sổ.

### Luồng từ app khách tới tài khoản người bán
~~~seq
title: Khach quet VietQR thanh toan 250.000
actors: Khách | App khách | NAPAS | Core người bán | POS người bán
Khách -> App khách: mở app, quét QR
App khách -> App khách: đọc TLV, hiện tên và số tiền
Khách -> App khách: xác nhận "Chuyển 250.000"
App khách -> NAPAS: lệnh chuyển khoản nhanh 24/7
NAPAS -> Core người bán: ghi có tài khoản người bán
Core người bán --> NAPAS: đã cập nhật số dư
NAPAS --> App khách: thành công, kèm mã tham chiếu
App khách --> Khách: hiển thị "Đã chuyển"
Core người bán -> POS người bán: webhook báo có
POS người bán -> POS người bán: đối chiếu, xác nhận đơn A123456
~~~

### Vì sao phải đối soát, không tin ảnh chụp
Khách chụp màn hình "Giao dịch thành công" gửi cho người bán là chiêu lừa phổ biến: ảnh ghép rất dễ, còn tiền thì chưa chuyển. Luồng đúng cho hệ thống của người bán:
1. Tạo đơn, trạng thái CHO_THANH_TOAN, sinh QR động gắn với mã đơn.
2. Nhận webhook báo có **hoặc** chủ động gọi API tra soát theo mã tham chiếu.
3. Kiểm tra: đúng số tiền, đúng tài khoản thụ hưởng, đúng mã đơn, chưa từng được dùng cho đơn khác.
4. Chỉ khi đó chuyển đơn sang DA_THANH_TOAN và cho phép giao hàng.
5. Nếu webhook không tới sau N phút: đừng hủy đơn ngay, hãy tra soát, vì giao dịch có thể đang pending.

webhook luôn có thể được gửi trùng (phía ngân hàng retry), nên handler phải chống trùng: khóa theo mã tham chiếu, nhận lần hai thì trả về đúng kết quả cũ.

### Thiết kế dữ liệu tối thiểu
~~~sql
CREATE TABLE merchant_order (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_code    VARCHAR(32)  NOT NULL UNIQUE,      -- mã đơn in trong nội dung chuyển khoản
  amount        NUMERIC(20,0) NOT NULL,            -- VND, không dùng số thập phân
  status        VARCHAR(20)  NOT NULL,             -- AWAITING | PAID | EXPIRED | CANCELLED
  qr_expires_at TIMESTAMPTZ,
  paid_ref      VARCHAR(64)  UNIQUE,               -- ma tham chieu NAPAS, chong xac nhan trung
  paid_at       TIMESTAMPTZ
);
~~~

### Lỗi hay gặp
- Cho phép thanh toán khi chưa có xác nhận từ phía ngân hàng (chỉ tin thông báo của khách) → mất hàng, mất tiền.
- Không gắn nội dung chuyển khoản với mã đơn → người bán phải nhìn số tiền rồi đoán đơn nào, đối soát thủ công, dễ ghi nhận nhầm.
- Dùng số thập phân cho VND ở mọi nơi rồi làm tròn lệch khi đối soát.
- QR động không có hạn → kẻ gian giữ lại QR của đơn đã thanh toán để dùng lại.
- Coi webhook là tin cậy tuyệt đối mà không kiểm tra chữ ký/nguồn và không xử lý trùng.

### Ví dụ đời thực

Một chuỗi cửa hàng tiện lợi 200 chi nhánh triển khai VietQR động cho các quầy thu ngân. Một ngày, chi nhánh A báo 15 đơn hàng bị "mất tiền": khách quét QR, app báo thành công, nhưng POS không nhận webhook và nhân viên không cho lấy hàng. Khách bức xúc, nhân viên phải đối soát thủ công từng giao dịch. Dev tra soát log POS và NAPAS thấy: webhook từ core ngân hàng thụ hưởng bị thất lạc do sự cố mạng 5 phút lúc 14:00–14:05. Hệ thống POS không có job tra soát chủ động (polling) khi webhook không về, và trạng thái đơn vẫn là AWAITING. Nguyên nhân gốc: thiết kế chỉ dựa vào webhook (push) mà không có cơ chế kéo (pull) theo mã tham chiếu NAPAS theo chu kỳ 5 phút. Cách xử lý: chạy script đối soát thủ công cho 15 đơn, xác nhận tiền đã về tài khoản, chuyển đơn sang PAID và cho khách lấy hàng. Sau đó bổ sung job cron 5 phút: với mọi đơn AWAITING quá 10 phút, gọi API tra soát NAPAS theo mã tham chiếu; nếu tìm thấy -> cập nhật PAID, nếu không -> giữ AWAITING và gửi cảnh báo. Kết quả: trong tháng sau, không còn đơn nào bị "mất tiền" do webhook thất lạc, và tỷ lệ đơn cần tra soát thủ công giảm từ 15/ngày xuống 0.

### Trả lời mẫu khi phỏng vấn

"VietQR chỉ là kênh khởi tạo yêu cầu chuyển khoản, không giữ tiền và không chứng minh đã thanh toán. QR tĩnh in ra dán quầy, không có số tiền và mã đơn, khách tự nhập dễ sai; QR động sinh theo đơn hàng, có số tiền, mã đơn, hết hạn vài phút. Luồng: khách quét QR -> app đọc TLV -> xác nhận -> gửi lệnh chuyển khoản nhanh 24/7 qua NAPAS -> tiền vào tài khoản người bán -> core người bán gửi webhook báo có. Quan trọng: không bao giờ xác nhận đơn chỉ dựa vào ảnh 'chuyển khoản thành công' khách chụp (dễ ghép ảnh), phải nhận webhook hoặc chủ động tra soát theo mã tham chiếu NAPAS, kiểm tra đúng số tiền, tài khoản thụ hưởng, mã đơn chưa được dùng. Webhook có thể trùng nên handler phải khóa theo mã tham chiếu. Thiết kế phải có trạng thái 'đang chờ xác nhận' và job tra soát chủ động phòng khi webhook thất lạc."

> Senior tip: Hãy nói trong phỏng vấn rằng QR chỉ là **kênh khởi tạo yêu cầu** (initiation), còn **kênh quyết định** là hệ thống chuyển mạch và sổ cái. Vì vậy thiết kế phải có ba thứ: mã đơn duy nhất trong nội dung chuyển khoản, trạng thái "đang chờ xác nhận" thay vì "thành công" ngay khi khách báo, và job tra soát chủ động phòng khi webhook thất lạc. Đây chính là bài học idempotency và đối soát áp dụng cho một luồng rất đời thường.

> Cụm từ: BIN (Bank Identification Number) là 6 số đầu của một dãy số dùng để nhận diện ngân hàng, ở đây là ngân hàng thụ hưởng. Webhook là việc hệ thống A chủ động gọi API của B khi có sự kiện, thay vì B cứ hỏi A.

  `,
  follow: [
    'Vì sao không được xác nhận đơn hàng chỉ dựa vào ảnh "chuyển khoản thành công" khách gửi?',
    'QR động cần những dữ liệu nào để đối soát tự động, và xử lý khi QR hết hạn ra sao?',
    'Webhook báo có bị gửi trùng hai lần, hệ thống người bán phải ứng xử thế nào?'
  ],
  tags: ['VietQR', 'QR tinh', 'QR dong', 'doi soat', 'webhook']
},
{
  id: 'banking-015',
  topic: 'banking',
  level: 'mid',
  q: 'Thiết kế tính năng thu tiền tự động định kỳ (hóa đơn điện, bảo hiểm): ủy quyền thu lưu đâu, lên lịch chạy thế nào, retry khi tài khoản thiếu tiền và thông báo khách ra sao?',
  a: `**Tóm tắt:** Thu tự động (auto-debit) là việc khách ký một **ủy quyền thu** (mandate) cho phép một bên thu tiền định kỳ từ tài khoản. Hệ thống sinh lịch thu theo chu kỳ, tới ngày chạy job tạo giao dịch, trừ tiền; nếu thiếu tiền thì thử lại vài lần theo chiến lược đã cấu hình rồi đánh dấu quá hạn, và thông báo cho khách ở cả ba thời điểm: trước kỳ thu, khi thu thành công, khi thu thất bại. Toàn bộ phải đảm bảo mỗi kỳ chỉ bị thu một lần, kể cả khi job chạy lại.

### Ba đối tượng dữ liệu phải có
1. **Mandate (ủy quyền):** ai cho phép ai thu, bao nhiêu tiền mỗi lần, bắt đầu và kết thúc khi nào, kèm bằng chứng khách đồng ý (ngày giờ, IP, OTP ký). Mandate có trạng thái ACTIVE, SUSPENDED, REVOKED — khách có quyền rút ủy quyền bất cứ lúc nào, và job **phải kiểm tra trạng thái này ngay trước khi thu**, không chỉ kiểm tra lúc lập lịch.
2. **Kỳ thu (schedule/run):** một dòng cho mỗi kỳ, ví dụ tháng 6/2026, với số tiền dự kiến và ngày đến hạn.
3. **Lần thử (attempt):** mỗi lần bấm máy thu là một attempt, có mã tham chiếu giao dịch riêng.

### Lên lịch: những bẫy tưởng nhỏ mà gây thiệt
- **Ngày 31:** khách chọn thu ngày 31, nhưng tháng 2 không có ngày 31. Phải có quy tắc: làm tròn về ngày cuối tháng, hoặc nhảy sang tháng sau.
- **Ngày nghỉ:** ngày đến hạn rơi vào thứ Bảy, Chủ nhật hoặc ngày lễ. Quy tắc phải chọn: thu sớm hơn (roll back), thu muộn hơn (roll forward) hoặc bỏ qua (skip) — mỗi nghiệp vụ chọn một kiểu, không được để code tự ứng xử.
- **Múi giờ:** chạy job lúc 00:30 giờ Việt Nam, đừng lấy giờ máy chủ ở múi giờ khác.
- **Nhiều instance:** nếu app chạy 3 pod và cả 3 đều có @Scheduled, cùng một kỳ sẽ bị thu 3 lần. Cần một trong ba: bảng khóa (ShedLock), chỉ một instance được elect làm leader, hoặc chia phiến (shard) theo mandate id.

~~~java
static LocalDate dueDate(int year, int month, int dayOfMonth, WeekendRule rule) {
    int capped = Math.min(dayOfMonth, YearMonth.of(year, month).lengthOfMonth());
    LocalDate due = LocalDate.of(year, month, capped);      // ngay 31 -> 28/29/30 thang 2
    boolean weekend = due.getDayOfWeek() == DayOfWeek.SATURDAY || due.getDayOfWeek() == DayOfWeek.SUNDAY;
    if (rule == WeekendRule.IGNORE || !weekend) return due;
    return switch (rule) {
        case NEXT_WORKING_DAY -> due.plusDays(due.getDayOfWeek() == DayOfWeek.SATURDAY ? 2 : 1);
        case PREV_WORKING_DAY -> due.minusDays(due.getDayOfWeek() == DayOfWeek.SUNDAY ? 2 : 1);
        default -> due;
    };
}
~~~

### Khóa chống thu trùng
Mỗi kỳ phải có một **khóa tự nhiên duy nhất** là (mandate id + kỳ). Đặt unique constraint ở database, đừng chỉ kiểm tra bằng if trong code vì hai thread có thể cùng qua if đó.

~~~sql
CREATE TABLE debit_run (
  mandate_id  BIGINT       NOT NULL REFERENCES debit_mandate(id),
  period_key  VARCHAR(10)  NOT NULL,          -- '2026-06'
  due_date    DATE         NOT NULL,
  amount      NUMERIC(20,2) NOT NULL,
  status      VARCHAR(16)  NOT NULL,          -- PENDING | SUCCESS | INSUFFICIENT | ABANDONED
  attempts    SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (mandate_id, period_key)        -- một kỳ chỉ được thu một lần
);
~~~

### Retry khi thiếu tiền
Thiếu tiền là lỗi **có thể chờ**, không phải lỗi kỹ thuật, vì vậy đừng retry dồn dập:
- Thử lần 1 đúng ngày đến hạn. Nếu "không đủ số dư", lần 2 sau 1 ngày, lần 3 sau 2 ngày nữa (tối đa 3 attempt trong kỳ, cấu hình được).
- Mỗi attempt là một giao dịch mới với mã tham chiếu mới, nhưng **vẫn là cùng một kỳ** → khi một attempt thành công, các attempt còn lại phải bị hủy, không được thu lần hai.
- Hết attempt: đánh dấu ABANDONED, ghi nợ quá hạn theo hợp đồng, báo bên thu, thông báo khách.
- Nếu ngân hàng bảo trì hoặc lỗi mạng (lỗi kỹ thuật), retry nhanh với backoff và **không** tính vào số lần thử của nghiệp vụ.

### Thông báo khách
- Trước kỳ thu (T-2): "Kỳ thu tới: 450.000 đồng vào ngày 05/06 theo ủy quyền của anh/chị." Đây là thông báo quan trọng nhất để giảm khiếu nại.
- Khi thu thành công: số tiền, mã giao dịch, tên bên thu.
- Khi thu thất bại: lý do, hạn chót nạp tiền để thử lại, và cách hủy ủy quyền.
- Luôn cho khách xem và rút ủy quyền trong app; nếu khách phải gọi tổng đài mới rút được, bạn đang giữ một nguồn khiếu nại.

### Lỗi hay gặp
- Chạy lại job sau sự cố mà không có khóa tự nhiên → khách bị thu hai lần cùng kỳ.
- Kiểm tra mandate lúc lập lịch nhưng không kiểm tra lúc thu → thu cả ủy quyền đã bị rút.
- Retry theo kiểu "cứ 5 phút thử lại cho tới khi được" → hàng nghìn giao dịch lặp và khách bị trừ tiền lúc nửa đêm.
- Cứng ngày 31 trong code → tháng 2 không sinh kỳ nào, bên thu không thu được tiền cả tháng.
- Chỉ báo cho khách sau khi đã trừ tiền → khách khiếu nại, hoàn tiền dây dưa.

### Ví dụ đời thực

Một công ty bảo hiểm triển khai auto-debit cho 500.000 hợp đồng, thu phí hàng tháng ngày 5. Tháng 2 năm nay ngày 5 rơi vào thứ 6, nhưng tháng 2 không có ngày 31 (chỉ có 28 ngày). Triệu chứng: 12.000 hợp đồng có ngày thu là ngày 31 (khách chọn ngày 31 khi đăng ký) không được sinh kỳ thu cho tháng 2, bên thu không nhận được tiền và phải gọi thủ công yêu cầu khách chuyển khoản. Dev kiểm tra code lập lịch thấy hàm {{dueDate}} dùng {{dayOfMonth}} trực tiếp mà không kiểm tra {{lengthOfMonth()}}, dẫn đến {{LocalDate.of(2026, 2, 31)}} ném exception và job dừng. Nguyên nhân gốc: thiếu xử lý trường hợp ngày 29/30/31 cho tháng ngắn, và thiếu test case cho tháng 2. Cách xử lý: chạy script bù đắp 12.000 kỳ thu thiếu (tạo {{debit_run}} với {{due_date}} = ngày cuối tháng 2), sửa hàm {{dueDate}} dùng {{Math.min(dayOfMonth, YearMonth.of(year, month).lengthOfMonth())}} như ví dụ code, thêm unit test cho tháng 2, tháng 4/6/9/11 ngày 31, và năm nhuận. Kết quả: tháng sau job chạy trôi chảy cho tất cả 500.000 hợp đồng, không còn kỳ nào bị bỏ sót.

### Trả lời mẫu khi phỏng vấn

"Auto-debit dựa trên ủy quyền (mandate) của khách cho phép trừ tiền định kỳ. Ba đối tượng cốt lõi: mandate (trạng thái ACTIVE/SUSPENDED/REVOKED, phải kiểm tra ngay trước khi thu), kỳ thu (schedule), attempt (mỗi lần thử là một giao dịch riêng). Job phải an toàn khi chạy lại (re-runnable): khóa tự nhiên (mandate_id + period_key) ở database với unique constraint, không chỉ if trong code. Retry thiếu tiền tách biệt với retry lỗi kỹ thuật: thiếu tiền thử lại D+1, D+3 tối đa 3 lần/ kỳ; lỗi kỹ thuật retry nhanh với backoff, không tính vào số lần nghiệp vụ. Thông báo 3 lúc: trước kỳ (T-2), thành công, thất bại — trước kỳ quan trọng nhất để giảm khiếu nại. Luôn cho khách rút ủy quyền trong app."

> Senior tip: Câu hỏi phân biệt senior ở đây là "job của bạn có chạy lại an toàn không" (re-runnable). Hãy trả lời theo trình tự: khóa tự nhiên (mandate, kỳ) ở database, kiểm tra trạng thái mandate ngay trước khi ghi sổ, tách retry nghiệp vụ khỏi retry kỹ thuật, và phát hành thông báo trước kỳ thu. Nói thêm một ý thực tế: số tiền thu có thể đổi (điện tiêu dùng theo tháng), nên phải có trần tiền trong mandate và từ chối thu vượt trần.

> Cụm từ: Mandate (ủy quyền thu) là văn bản/đồng ý điện tử cho phép một tổ chức trừ tiền tài khoản khách định kỳ. Period key (khóa kỳ) là chuỗi nhận diện một kỳ thu, ví dụ '2026-06'.

  `,
  follow: [
    'Job thu tự động chạy trên 3 instance, bạn chống thu trùng thế nào?',
    'Retry vì thiếu tiền khác retry vì lỗi mạng ở chỗ nào trong thiết kế?',
    'Khách rút ủy quyền giữa chừng, những kỳ nào còn được thu và bằng chứng nào phải lưu?'
  ],
  tags: ['auto-debit', 'mandate', 'scheduler', 'retry', 'idempotency']
},
{
  id: 'banking-016',
  topic: 'banking',
  level: 'senior',
  q: 'Hệ thống phát hiện gian lận thời gian thực khi khách quẹt thẻ hoặc chuyển tiền: rule engine khác model ML ở đâu, ngân sách độ trễ bao nhiêu là hợp lý, và xử lý false positive thế nào để không làm mất khách?',
  a: `**Tóm tắt:** Hệ thống chống gian lận theo thời gian thực (real-time) trả lời một câu hỏi trong vài trăm mili giây: "cho qua, buộc khách xác minh thêm, hay chặn?". Ba lớp quyết định thường chạy song song: **rule engine** (luật cứng, giải thích được), **model ML** (chấm điểm gian lận 0-1, bắt được mẫu tinh vi), và **danh sách** (whitelist/blacklist). Vì nó nằm trên đường đi của giao dịch nên chỉ được tiêu một phần nhỏ của ngân sách thời gian; nếu hết thời gian chờ (timeout) thì phải có chính sách rõ ràng là cho qua (fail open) hay chặn (fail closed). False positive — chặn nhầm giao dịch thật — là chi phí thật, phải có đường mở khóa ngay trong app.

### Ba lớp quyết định
| Lớp | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| Rule cứng | "thẻ vừa giao dịch ở Hà Nội 10 phút trước, nay quẹt ở nước ngoài" (impossible travel) | giải thích được, bật/tắt tức thì, không cần dữ liệu lịch sử | dễ bỏ lọt kẻ gian né luật, bảo trì nhiều luật xung đột |
| Model ML | điểm xác suất gian lận dựa trên velocity, hành vi, thiết bị, lịch sử merchant | bắt mẫu phức tạp, thích ứng | khó giải thích, cần dữ liệu gán nhãn, có độ trễ tính toán |
| Danh sách | whitelist số điện thoại đã xác thực, blacklist merchant | nhanh, chắc chắn | dữ liệu phải cập nhật liên tục |
Kết hợp: rule phủ những trường hợp chắc chắn, model chấm điểm phần còn lại, danh sách bảo vệ khách quen. Điểm cuối cùng so với ngưỡng → approve / challenge / block.

### Độ trễ: bạn chỉ có vài trăm mili giây
Hãy chia ngân sách thời gian cho một thương vụ thẻ, tổng khoảng 2000 ms để khách còn chấp nhận:
- Gateway + bảo mật: 100 ms
- Kiểm tra tài khoản/hạn mức ở core: 300-500 ms
- **Quyết định gian lận: 150-300 ms**
- Trả lời kênh + ghi log: 100 ms
Vì vậy dịch vụ decision phải đọc dữ liệu đã chuẩn bị sẵn trong bộ nhớ (Redis, cache feature), không được tính toán nặng đồng bộ. Pattern phổ biến:
1. Luồng giao dịch gọi đồng bộ dịch vụ decision với timeout ngắn (ví dụ 200 ms).
2. Song song, sự kiện giao dịch được gửi vào hàng đợi (Kafka) để cập nhật feature cửa sổ trượt cho lần sau — việc nặng chạy **bất đồng bộ**, không chặn khách.
3. Model lớn có thể chạy trên stream và ghi điểm ra cache; request chỉ đọc điểm đó.

**Khi decision timeout:** phải chọn chính sách, không được mặc định. Fail open (cho qua) mất tiền nếu kẻ gian lợi dụng lúc hệ thống lỗi; fail closed (chặn) mất doanh thu và khách. Thực tế thường lai: dưới ngưỡng tiền nào đó thì fail open, giao dịch lớn hoặc nước ngoài thì fail closed hoặc yêu cầu xác minh.

### False positive và false negative
- **False positive (FP):** chặn giao dịch thật của khách. Chi phí: cuộc gọi tổng đài, mất doanh thu, khách chuyển sang ngân hàng khác.
- **False negative (FN):** cho qua giao dịch gian lận. Chi phí: tiền bồi thường, phí điều tra.
- Dữ liệu gian lận rất hiếm (thường dưới 1% giao dịch), nên chỉ cần chặn bừa 1% là chỉ số "recall" trông rất đẹp nhưng false positive thành thảm họa. Vì vậy phải bàn bằng **chi phí kỳ vọng**: số FP nhân với chi phí mất khách, cộng số FN nhân với mức thiệt hại trung bình một vụ, chứ không chỉ nhìn accuracy.
- Giảm đau cho FP: thay vì block, dùng **step-up authentication** (bắt khách xác minh bằng OTP hoặc xác nhận push trong app). Khách thật xác nhận thì giao dịch được cho qua ngay; kẻ gian thì không nhận được OTP. Block chỉ dành cho trường hợp điểm quá cao.
- Phải có kênh khiếu nại một chạm: khách bấm "Đây là tôi" trong app, hệ thống mở khóa và ghi nhãn "legit" để cải thiện model.

### Feature và giải thích
Feature hay dùng: số giao dịch trong 5/30/60 phút (velocity), tổng tiền trong ngày, khoảng cách địa lý so với giao dịch trước, thiết bị/IP có mới không, loại hình cửa hàng (MCC) và tỷ lệ từng bị khiếu nại, thời điểm (3 giờ sáng), số tiền lẻ bất thường. Khi model cho điểm cao, phải trích được **lý do** (feature nào đẩy điểm lên) để nhân viên điều tra và khách hiểu.

~~~java
interface Rule { String name(); int score(); boolean matches(TxContext ctx); }

record Decision(boolean allow, boolean challenge, List<String> hits) {}

Decision decide(List<Rule> rules, TxContext ctx, int challengeAt, int blockAt) {
    List<String> hits = new ArrayList<>();
    int score = 0;
    for (Rule r : rules) {
        if (r.matches(ctx)) { hits.add(r.name()); score += r.score(); }
    }
    if (score >= blockAt)     return new Decision(false, false, hits);   // chặn
    if (score >= challengeAt) return new Decision(true, true, hits);     // buộc xác minh thêm
    return new Decision(true, false, hits);
}
~~~

### Vòng phản hồi và case management
Giao dịch bị chặn/chờ đi vào hàng đợi để nhân viên xem (case management). Kết luận của nhân viên — "gian lận thật" hoặc "khách thật" — chính là nhãn huấn luyện cho lần retrain sau. Không có vòng này thì model chết dần sau vài tháng vì kẻ gian đổi chiêu.

### Lỗi hay gặp
- Tính lại toàn bộ feature trong lúc đang chờ quyết định → quá trễ, giao dịch timeout hàng loạt.
- Đếm velocity bằng Redis mà quên TTL hoặc quên key theo cửa sổ thời gian → bộ nhớ phình và số liệu sai.
- Hai giao dịch song song cùng tăng một bộ đếm theo kiểu đọc-cộng-ghi → mất cập nhật, sót gian lận; phải dùng lệnh nguyên tử (INCR) hoặc Lua.
- Không ghi lại snapshot feature tại thời điểm quyết định → sau này không tái hiện được vì sao chặn khách, không giải trình được.
- Đổi ngưỡng mà không thông báo, không có grey release → tỷ lệ chặn nhảy vọt một buổi sáng.

### Ví dụ đời thực

Một ngân hàng trung bình xử lý 2 triệu giao dịch thẻ/ngày. Một sáng, tỷ lệ giao dịch bị chặn (block) nhảy từ 0.2% lên 3.5% trong 2 giờ, tổng đài ngập cuộc gọi khách phàn nại không thể thanh toán. Dev tra soát log decision service và thấy: lúc 08:15 team data science triển khai model ML mới (v2.3) với ngưỡng challengeAt giảm từ 70 xuống 55 để "bắt nhiều gian lận hơn", nhưng không chạy grey release (chỉ bật cho 5% traffic) và không thông báo team vận hành. Model mới chấm điểm cao cho các giao dịch nhỏ vào ban sáng (velocity trong 30 phút) vì dữ liệu huấn luyện thiếu đại diện cho giờ cao điểm. Nguyên nhân gốc: quy trình deploy model thiếu gate (grey release + canary + rollback tự động khi FP tăng), và feature velocity không chuẩn hóa theo giờ trong ngày. Cách xử lý: rollback ngay về model v2.2, tỷ lệ block giảm về 0.3% trong 15 phút. Sau đó bổ sung pipeline: model mới chỉ deploy cho 5% traffic 48 giờ, so sánh FP/FN với model cũ, tự động rollback nếu FP tăng > 20%; chuẩn hóa feature velocity theo bucket giờ (0-6h, 6-12h, 12-18h, 18-24h). Kết quả: deploy model v2.4 sau 2 tuần an toàn, FP giảm 40% so với v2.2, không còn sự cố block hàng loạt.

### Trả lời mẫu khi phỏng vấn

"Hệ thống chống gian lận real-time phải quyết định trong 150-300 ms: cho qua, challenge (yêu cầu OTP/push), hay block. Ba lớp chạy song song: rule engine (luật cứng, giải thích được), model ML (điểm 0-1, bắt mẫu tinh vi), danh sách whitelist/blacklist. Độ trễ ngân sách: tổng 2000 ms, trong đó decision chỉ 150-300 ms — phải đọc feature từ cache/Redis, tính toán nặng chạy bất đồng bộ qua Kafka. Khi timeout: fail open cho giao dịch nhỏ, fail closed hoặc challenge cho giao dịch lớn/nước ngoài. False positive (chặn nhầm khách thật) tốn kêu gọi, mất khách; giảm FP bằng step-up authentication (OTP/push) thay vì block, và kênh khiếu nại một chạm 'Đây là tôi' trong app. Luôn ghi log snapshot feature tại thời điểm quyết định để giải trình sau này. Vòng phản hồi: nhân viên xem case, gán nhãn legit/fraud -> retrain model."

> Senior tip: Trong phỏng vấn, hãy trả lời theo trình tự: (1) quyết định phải đồng bộ nhưng chỉ đọc dữ liệu đã chuẩn bị sẵn, phần nặng chạy bất đồng bộ; (2) luôn có chính sách khi dịch vụ chống gian lận lỗi, kèm ngưỡng tiền; (3) ưu tiên step-up challenge thay vì block để giảm FP; (4) ghi log nguyên nhân quyết định. Nói thêm: gian lận là trò đuổi bắt, giá trị của hệ thống nằm ở vòng phản hồi và khả năng tắt/mở luật trong vài phút, không phải ở model xịn nhất.

> Cụm từ: Velocity là tốc độ giao dịch (bao nhiêu lần, bao nhiêu tiền trong một cửa sổ thời gian ngắn). Step-up authentication là buộc thêm một bước xác minh (OTP, xác nhận push) ngay trong giao dịch thay vì từ chối thẳng.

  `,
  follow: [
    'Dịch vụ chống gian lận timeout 300 ms, bạn cho qua hay chặn? Quyết định dựa trên gì?',
    'Làm sao giảm false positive mà không tăng false negative?',
    'Model cho điểm 0.92, bạn giải thích thế nào với khách và với bộ phận tuân thủ?'
  ],
  tags: ['fraud', 'rule engine', 'ML', 'latency', 'false positive']
},
{
  id: 'banking-017',
  topic: 'banking',
  level: 'senior',
  q: 'OTP qua SMS yếu ở những điểm nào? Smart OTP (TOTP) và ký giao dịch (transaction signing) hoạt động ra sao, và device binding giúp ích gì cho xác thực giao dịch?',
  a: `**Tóm tắt:** OTP (one-time password) là mật khẩu dùng một lần có hạn ngắn. SMS OTP yếu vì nó chỉ chứng minh "người giữ số điện thoại này", mà số điện thoại thì bị chiếm được (SIM swap), và mã gửi qua SMS **không gắn với nội dung giao dịch** — kẻ gian đổi số tiền sau khi khách nhận OTP thì hệ thống vẫn chấp nhận. Smart OTP chạy trong app theo thuật toán TOTP (không cần mạng), còn **transaction signing** thì tính mã trên chính số tiền và tài khoản thụ hưởng, nên đổi bất kỳ chữ nào cũng làm mã sai. Device binding giới hạn thiết bị được phép xác nhận.

### Vì sao SMS OTP yếu — giải thích từng tấn công
1. **SIM swap (chiếm SIM):** kẻ gian dùng giấy tờ giả hoặc mua chuộc, ra nhà mạng xin "cấp lại SIM" cho số nạn nhân. SIM thật bị vô hiệu, mọi OTP chảy về máy kẻ gian. Đây là tấn công phổ biến nhất và không liên quan gì tới bảo mật ngân hàng.
2. **Chặn trên kênh tín hiệu di động:** hạ tầng báo hiệu của mạng di động (SS7) từng bị khai thác; tin nhắn có thể bị đọc ở tầng mạng.
3. **Lừa người dùng (social engineering):** kẻ gọi điện giả tổng đài, bảo "anh đọc 6 số vừa nhận để em đối chiếu". OTP không biết ai đang đọc nó.
4. **Không ràng buộc với giao dịch:** SMS chỉ ghi "Mã OTP của bạn là 123456 để xác thực". Mã đó dùng cho chuyển 5 triệu cũng được, cho chuyển 500 triệu cũng được → kẻ gian đã chiếm được phiên có thể sửa số tiền, khách vẫn gật đầu bấm gửi vì mã vẫn đúng.
5. **Phụ thuộc sóng và nhà mạng:** khách ở nước ngoài hoặc bị lỗi tin nhắn thì không xác thực được, sinh khiếu nại.

SMS OTP vẫn hữu ích như một lớp "có còn hơn không" và là kênh dự phòng, nhưng đừng coi nó là xác thực mạnh cho giao dịch lớn.

### TOTP — Smart OTP hoạt động thế nào
TOTP (RFC 6238) = HMAC-SHA1(secret, bộ đếm thời gian), lấy vài bit rồi rút gọn về 6 chữ số. App và server cùng giữ một **secret** (khóa bí mật, thường được chuyển sang app qua mã QR lúc kích hoạt) và cùng biết giờ hiện tại, nên hai bên độc lập tính ra cùng một mã cho cùng một cửa sổ 30 giây. Không cần internet, không cần nhà mạng.

~~~java
static String totp(byte[] secret, long epochSeconds) throws Exception {
    long counter = epochSeconds / 30;                     // cua so 30 giay
    byte[] data = new byte[8];
    for (int i = 7; i >= 0; i--) { data[i] = (byte) counter; counter >>>= 8; }
    Mac mac = Mac.getInstance("HmacSHA1");
    mac.init(new SecretKeySpec(secret, "HmacSHA1"));
    byte[] h = mac.doFinal(data);
    int off = h[h.length - 1] & 0x0F;                     // dynamic truncation
    int bin = ((h[off] & 0x7F) << 24) | ((h[off + 1] & 0xFF) << 16)
            | ((h[off + 2] & 0xFF) << 8) | (h[off + 3] & 0xFF);
    return String.format("%06d", bin % 1_000_000);
}
~~~

Server thường kiểm cả cửa sổ trước và sau (±1) để chịu lệch đồng hồ, nhưng **không** được kiểm lan 5 cửa sổ: mỗi cửa sổ mở thêm là thêm thời gian kẻ gian dùng được mã bị đánh cắp.

### Transaction signing: mã "nhốt" nội dung giao dịch
Thay vì OTP rời tự do, thiết bị tính mã trên chuỗi ký gồm **số tiền + tài khoản thụ hưởng + id giao dịch**, server tính lại trên đúng nội dung nó sắp thực thi và so khớp. Kết quả:
- Đổi số tiền sau khi khách đã ký → mã không khớp → từ chối.
- Khách nhìn thấy chữ "Bạn đang chuyển 5.000.000 đồng tới 0987654321" ngay chỗ nhập mã, nên không bị lừa ký mù.
Đây là cơ sở của **xác thực khách hàng mạnh (SCA)**: kết hợp "có cái gì" (thiết bị, key trong Keystore/Secure Enclave) + "biết cái gì" (PIN/sinh trắc học) + "đúng giao dịch này".

### Device binding
Kích hoạt lần đầu gắn tài khoản với một thiết bị: lưu định danh thiết bị và **public key** do thiết bị sinh ra (private key nằm trong Keystore Android / Secure Enclave iOS, không xuất được). Từ đó:
- Push confirmation chỉ gửi về thiết bị đã liên kết.
- Đổi điện thoại phải qua quy trình re-enroll, thường kèm OTP + giấy tờ hoặc xác minh từ xa, và thông báo cho thiết bị cũ.
- Nếu thiết bị root/jailbreak, nên hạ mức tin cậy (chỉ cho xem số dư, không chuyển tiền).
- Ghi fingerprint để phát hiện "một tài khoản, 4 thiết bị trong 10 phút".

### Quy tắc triển khai mà dev hay quên
- OTP/mã ký phải **dùng một lần**: lưu trạng thái đã dùng, kể cả khi còn hạn.
- So sánh mã bằng phép so sánh thời gian không đổi (MessageDigest.isEqual), không dùng ==.
- Giới hạn số lần thử (5 lần) và khóa tạm; mã 6 số chỉ có 1 triệu tổ hợp, nếu cho thử vô hạn thì bị dò hết trong vài giờ.
- Không log OTP, không gửi OTP qua kênh khác để "tiện", không trả về OTP trong API response khi test.
- Secret TOTP phải được mã hóa khi lưu (KMS), và phải cho khách reset khi mất điện thoại.

### Lỗi hay gặp
- Cho phép dùng lại OTP của một giao dịch cho giao dịch khác (không bind amount) → lỗ hổng kinh điển trong các vụ mất tiền.
- Đặt hạn OTP 10 phút để "giảm khiếu nại" → cửa sổ cho kẻ gian quá rộng.
- Bỏ qua bước kiểm tra mandate/trạng thái thiết bị khi khách đổi máy, vì "app báo được là được".
- Gửi OTP ngay khi khách mới mở màn hình, trước khi biết giao dịch cụ thể → mất tác dụng ràng buộc.

### Ví dụ đời thực

Một ngân hàng lớn phát hiện 50 vụ mất tiền trong một tháng do kẻ gian lợi dụng lỗ hổng OTP không bind amount. Triệu chứng: khách nhận SMS OTP "Mã 123456 để xác thực", nhập vào app, nhưng giao dịch thực tế bị sửa từ chuyển 2 triệu thành chuyển 200 triệu sang tài khoản kẻ gian. Dev tra soát log xác thực thấy: hệ thống chỉ kiểm tra mã OTP có đúng không, không kiểm tra hash của nội dung giao dịch (amount + beneficiary). Kẻ gian dùng kỹ thuật man-in-the-browser: sau khi khách nhập OTP, mã độc trên trình duyệt sửa request gửi lên server (thay amount và beneficiary), server vẫn chấp nhận vì OTP đúng. Nguyên nhân gốc: thiết kế OTP tách biệt với nội dung giao dịch, không có transaction signing. Cách xử lý: khẩn cấp deploy hotfix so sánh hash(amount + beneficiary + txnId) tại server với hash client ký (dùng Web Crypto API trong app), chặn mọi request hash không khớp; đồng thời triển khai Smart OTP (TOTP trong app) và transaction signing cho giao dịch > 10 triệu. Kết quả: sau 2 tuần, không còn vụ mất tiền do sửa nội dung giao dịch, và tỷ lệ giao dịch dùng Smart OTP lên 85%.

### Trả lời mẫu khi phỏng vấn

"SMS OTP yếu 5 điểm: 1) SIM swap — kẻ gian cấp lại SIM số nạn nhân, OTP chảy về tay chúng; 2) SS7 — tin nhắn bị đọc ở tầng mạng di động; 3) Social engineering — kẻ lừa khách đọc OTP qua điện thoại; 4) Không bind giao dịch — OTP '123456' dùng cho 5 triệu cũng dùng cho 500 triệu, kẻ gian sửa amount sau khi khách nhập OTP; 5) Phụ thuộc sóng. Smart OTP (TOTP) chạy trong app: HMAC-SHA1(secret, time/30), không cần mạng, secret lưu trong Keystore/Secure Enclave. Transaction signing: thiết bị ký hash(amount + beneficiary + txnId), server verify — đổi bất kỳ chữ nào mã đều sai. Device binding: gắn tài khoản với thiết bị qua public key, push confirmation chỉ về thiết bị đó, đổi máy phải re-enroll. Ba tầng bảo vệ: OTP bind nội dung, yếu tố 'có gì' là key phần cứng, có đường dự phòng cho khách mất điện thoại."

> Senior tip: Khi phỏng vấn, đừng chỉ nói "SMS OTP yếu vì dễ bị SIM swap". Hãy nói ba tầng: (1) OTP phải ràng buộc nội dung giao dịch (amount + beneficiary), (2) yếu tố "có gì" phải là key trong phần cứng thiết bị chứ không phải số điện thoại, (3) mọi quy trình phải có đường dự phòng cho khách mất điện thoại mà không mở cửa sau cho kẻ gian. Nói thêm một con số: mã 6 số + 5 lần thử + khóa 15 phút là cấu hình hợp lý; 1 triệu tổ hợp chia cho 5 lần thử thì xác suất đoán trúng 0.0005%.

> Cụm từ: Secret (khóa bí mật) là chuỗi byte chỉ thiết bị và server biết, dùng để sinh TOTP. Keystore/Secure Enclave là vùng lưu trữ khóa chuyên dụng trên điện thoại, khóa không thể trích ra kể cả khi có root.

  `,
  follow: [
    'SIM swap xảy ra thế nào và hệ thống ngân hàng giảm thiệt hại ra sao khi số điện thoại khách bị chiếm?',
    'Vì sao OTP phải ràng buộc với số tiền và tài khoản thụ hưởng, và server kiểm tra điều đó lúc nào?',
    'Khách mất điện thoại, quy trình reset Smart OTP phải thiết kế thế nào để không thành cửa sau?'
  ],
  tags: ['OTP', 'TOTP', 'transaction signing', 'device binding', 'SCA']
},
{
  id: 'banking-018',
  topic: 'banking',
  level: 'senior',
  q: 'Tiền gửi có kỳ hạn: lãi được tính và ghi nhận thế nào, khi khách tất toán trước hạn thì xử lý ra sao, và tái tục tự động cần lưu ý những gì?',
  a: `**Tóm tắt:** Khách gửi 100 triệu vào kỳ hạn 12 tháng với lãi suất 5.5%/năm. Lãi mỗi ngày = số dư × lãi suất năm × số ngày thực tế / cơ sở ngày (thường 365), và ngân hàng **trích trước lãi hằng ngày** vào sổ cái dù chưa trả cho khách. Tất toán trước hạn: khách thường chỉ nhận lãi theo lãi suất không kỳ hạn (rất thấp, ví dụ 0.2%/năm) cho số ngày thực gửi, phần chênh đã trả trước (nếu trả lãi đầu kỳ hoặc hằng tháng) phải thu hồi. Tái tục tự động nghĩa là tới ngày đáo hạn, hệ thống tự mở kỳ mới theo biểu lãi suất **của ngày đó** và phải báo khách trước.

### Ba khái niệm phải rõ trước khi viết code
- **Kỳ hạn (term):** khoảng thời gian tiền bị "khóa" theo hợp đồng, ví dụ 6 tháng, tính từ ngày nhận tiền đến ngày đáo hạn.
- **Lãi suất danh nghĩa/năm:** con số 5.5%/năm không có nghĩa là 6 tháng nhận 2.75% một cách máy móc — phải quy về số ngày thực gửi.
- **Cơ sở ngày (day count convention):** thỏa thuận "một năm tính bao nhiêu ngày". actual/365 nghĩa là lấy số ngày thật chia cho 365; actual/360 làm lãi cao hơn một chút vì mẫu số nhỏ hơn. Chọn một và dùng nhất quán, ghi vào hợp đồng.

### Tính lãi bằng con số thật
Gửi 100.000.000 đồng, lãi suất 5.5%/năm, kỳ hạn 90 ngày, cơ sở actual/365:
- Lãi = 100.000.000 × 0.055 × 90 / 365 = **1.356.164** đồng (làm tròn về đồng theo chính sách).
- Nếu dùng actual/360: 1.375.000 đồng — lệch 18.836 đồng chỉ vì đổi mẫu số.
- Gửi cùng số đó 12 tháng với lãi trả cuối kỳ, lãi thực nhận khoảng 5.500.000 nếu không nhập lại tiền lãi; nếu lãi nhập gốc hằng quý thì khách nhận nhiều hơn một chút (lãi kép).

~~~java
static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");

BigDecimal accruedInterest(BigDecimal principal, BigDecimal annualRate,
                           long actualDays, int scale, RoundingMode mode) {
    BigDecimal raw = principal.multiply(annualRate)
                              .multiply(new BigDecimal(actualDays))
                              .divide(DAYS_IN_YEAR, 10, RoundingMode.HALF_UP);  // tinh giu chinh xac
    return raw.setScale(scale, mode);      // chi lam tron khi ghi nhan / tra tien
}
~~~

Hai điểm dễ sai: dùng **double** (lệch phần tỉ đồng sau hàng triệu lần tính), và làm tròn ở **mỗi bước** thay vì giữ độ dài lớn rồi chỉ làm tròn khi ghi nhận.

### Trích trước lãi hằng ngày (accrual) — vì sao phải làm
Lãi trả cho khách là **khoản nợ** của ngân hàng, phát sinh theo ngày, không phải ngày đáo hạn mới có. Kế toán phải ghi nhận đều đặn để sổ cái đúng: mỗi kỳ EOD, tính lãi dự trích trong ngày và ghi bút toán "chi phí lãi phải trả / lãi dự trích phải trả". Khi trả lãi thật cho khách, phần đã dự trích được tất toán, chỉ ghi thêm phần chênh. Nếu bỏ qua bước này, báo cáo lãi/lỗ ngày của bạn sẽ nhảy vọt vào ngày đáo hạn và kiểm toán không chấp nhận.

### Tất toán trước hạn — nghiệp vụ rồi mới tới code
1. Khách yêu cầu rút trước hạn, ví dụ rút sau 47 ngày của kỳ 90 ngày.
2. Tính lại lãi theo **lãi suất không kỳ hạn** cho 47 ngày thực gửi: 100.000.000 × 0.002 × 47/365 ≈ 25.753 đồng (so với 708.219 đồng nếu 47 ngày đó được hưởng 5.5%/năm — khách thấy rõ vì sao rút sớm thì lỗ).
3. Nếu ngân hàng đã trả lãi trước (trả đầu kỳ hoặc hằng tháng), phải **thu hồi phần đã trả thừa**: trừ vào tiền gốc, hoặc ghi một bút toán điều chỉnh âm. Quên bước này là lỗ thật.
4. Áp phí tất toán trước hạn nếu hợp đồng quy định (thường là % trên gốc hoặc trên lãi, theo thời điểm gửi) — phải là dữ liệu cấu hình có hiệu lực theo ngày, không hard-code.
5. Ghi sổ: cộng gốc + lãi thực nhận vào tài khoản thanh toán của khách, đóng sổ tiết kiệm bằng trạng thái CLOSED, **giữ nguyên** các bản ghi cũ (append-only) để 10 năm sau còn trả lời được.

Bảng so sánh cách trả lãi:
| Cách | Ưu | Nhược cho khách | Tất toán trước hạn |
|---|---|---|---|
| Cuối kỳ | đơn giản, có lãi ngầm (nhập gốc khi đáo hạn) | không có tiền tiêu giữa kỳ | chỉ tính lại, không phải thu hồi |
| Đầu kỳ (chiết khấu) | nhận ngay phần lãi | bị trừ trước, tất toán sớm lỗ nặng | phải thu hồi phần lãi chưa "tích lũy" đủ |
| Hằng tháng | có dòng tiền đều | không nhập gốc nên lãi thấp hơn | phải thu hồi lãi đã trả của các tháng trước |

### Tái tục tự động (auto-renewal)
- Chọn kiểu: tái tục gốc (gốc sang kỳ mới, lãi trả về tài khoản thanh toán), tái tục gốc + lãi (lãi nhập gốc), hoặc không tái tục (chuyển tất cả về tài khoản thanh toán).
- Lãi suất tái tục = biểu lãi **tại ngày đáo hạn**, không phải lãi suất cũ — nhưng phải báo trước cho khách (T-1 hoặc sớm hơn), vì nếu lãi thị trường giảm, khách có quyền quyết định khác.
- Ngày đáo hạn rơi vào ngày nghỉ: quy tắc phải rõ (dồn sang ngày làm việc kế tiếp và có tính lãi thêm ngày đó hay không).
- Job tái tục chạy trong EOD, phải idempotent theo (sổ tiết kiệm, kỳ mới) — chạy lại không được mở hai kỳ.

### Lỗi hay gặp
- Coi lãi suất là một con số toàn hệ thống, không có **phiên bản theo ngày**: khách gửi kỳ 2023 hưởng 7.5% bị áp lãi mới 4.2% → khiếu nại hàng loạt.
- Lưu lãi suất kiểu double hoặc chia trước rồi nhân sau, làm sai vài chục nghìn đồng trên mỗi sổ — với 2 triệu sổ thành tiền thật.
- Partial break (rút một phần): gốc mới phải về 0 nhưng lãi của phần rút bị tính cho cả kỳ.
- Ngày đáo hạn tính bằng cách cộng tháng trên LocalDate mà quên trường hợp ngày 31.
- Thu hồi lãi đã trả mà không ghi bút toán điều chỉnh, chỉ "trừ bớt" → sổ cái lệch, đối soát đỏ.

### Ví dụ đời thực

Một ngân hàng quản lý 2 triệu sổ tiết kiệm. Quý 1 năm 2023, lãi suất tiền gửi 12 tháng là 7.5%/năm. Quý 3, lãi thị trường giảm, ngân hàng hạ biểu lãi xuống 4.2%/năm. Triệu chứng: 15.000 khách gọi khiếu nại "lãi bị giảm giữa chừng", tổng đài quá tải. Dev tra soát hệ thống lãi suất thấy: bảng {{deposit_rate}} chỉ có 1 dòng cho từng kỳ hạn, không có cột {{effective_from}}/{{effective_to}}. Khi cập nhật lãi mới, hệ thống ghi đè lãi cũ, khiến job tính lãi hằng ngày (accrual) dùng lãi 4.2% cho cả sổ mở đầu năm 2023. Nguyên nhân gốc: không versioning lãi suất theo ngày, job accrual đọc lãi "mới nhất" thay vì lãi tại ngày mở sổ. Cách xử lý: chạy script bù đắp chênh lệch lãi cho 15.000 sổ (tính lại theo 7.5% từ ngày mở đến hôm nay), sửa schema thêm {{rate_version}} với {{effective_from}}, {{effective_to}}, {{rate_value}}; job accrual và job tất toán đều join theo {{effective_from <= ngay_tinh < effective_to}}. Kết quả: sau khi triển khai, không còn khiếu nại về lãi sai, và kiểm toán chấp nhận báo cáo lãi theo phiên bản đúng.

### Trả lời mẫu khi phỏng vấn

"Tiền gửi kỳ hạn: lãi = gốc × lãi suất năm × số ngày thực / cơ sở ngày (actual/365 phổ biến ở VN). Dùng BigDecimal, không dùng double. Ngân hàng phải trích trước lãi hằng ngày (accrual) vào sổ cái — đây là khoản nợ phát sinh theo ngày, không đợi đáo hạn mới ghi. Tất toán trước hạn: chỉ trả lãi theo lãi suất không kỳ hạn (thấp, ví dụ 0.2%) cho số ngày thực gửi; nếu đã trả lãi trước (đầu kỳ/hàng tháng) phải thu hồi phần thừa. Tái tục tự động: mở kỳ mới theo biểu lãi ngày đáo hạn, phải báo khách trước (T-1), job idempotent theo (sổ, kỳ mới). Ba thứ tách biệt: lãi suất hợp đồng (bất biến, lưu theo ngày gửi), biểu lãi thị trường (thay đổi), chính sách làm tròn/phí (cấu hình)."

> Senior tip: Trong phỏng vấn, câu này ăn điểm ở hai chỗ: (1) tách rõ ba thứ — lãi suất theo hợp đồng (bất biến, lưu theo ngày gửi), biểu lãi thị trường (thay đổi), và chính sách làm tròn/phí (cấu hình); (2) nói được nghiệp vụ dự trích lãi hằng ngày, vì đó là chỗ dev thuần kỹ thuật hay bỏ. Hãy chủ động nói "tôi sẽ lưu phiên bản lãi suất và khóa công thức tính theo ngày" — đó là điều ngân hàng thật sự làm sau các sự cố khiếu nại lãi.

> Cụm từ: Day count convention (quy ước ngày) là thỏa thuận cách quy lãi suất năm về số ngày thực gửi, ví dụ actual/365. Accrual (trích trước) là ghi nhận chi phí lãi đã phát sinh nhưng chưa trả.

  `,
  follow: [
    'Vì sao phải trích trước lãi hằng ngày thay vì chờ đáo hạn mới ghi nhận?',
    'Khách tất toán trước hạn sau khi đã nhận lãi hằng tháng, bạn xử lý phần lãi đã trả thế nào?',
    'Lãi suất thị trường thay đổi, làm sao đảm bảo sổ cũ vẫn tính đúng lãi đã cam kết?'
  ],
  tags: ['tien gui', 'lai suat', 'accrual', 'tat toan tru han', 'tai tuc']
},
{
  id: 'banking-019',
  topic: 'banking',
  level: 'senior',
  q: 'Hệ thống có nhiều loại tiền tệ và tỷ giá: mỗi giao dịch phải lưu những gì, vì sao không được tính lại tỷ giá lúc truy vấn, và làm tròn khi quy đổi thế nào để tổng tiền vẫn khớp?',
  a: `**Tóm tắt:** Ba quy tắc sống còn: (1) một số tiền luôn là **cặp (giá trị, loại tiền)**, không bao giờ tách rời; (2) giao dịch nào liên quan quy đổi phải **lưu snapshot tỷ giá** (tỷ giá, nguồn, mã báo giá, thời điểm) ngay lúc thực hiện, nếu tính lại lúc xem báo cáo thì số liệu sẽ đổi và không giải trình được; (3) làm tròn theo **số chữ thập phân của từng loại tiền** và chỉ làm tròn ở bước cuối, phần dư được phân bổ thành dòng điều chỉnh để tổng không "rơi" tiền.

### Vì sao phải lưu tỷ giá theo giao dịch
Tỷ giá thay đổi từng phút. Khách chuyển 100 USD lúc 10:00 với tỷ giá 25.400 VND/USD, ngân hàng thu của khách 2.540.000 VND. 16:00 tỷ giá là 25.650. Nếu hệ thống chỉ lưu "100 USD" rồi nhân tỷ giá hiện tại khi in sao kê:
- Khách thấy số tiền khác số đã bị trừ → khiếu nại, và bạn sai.
- Đối soát với sổ cái không khớp, vì sổ cái ghi 2.540.000.
- Kiểm toán và cơ quan quản lý yêu cầu chứng minh "giá nào đã áp dụng cho giao dịch này", không chấp nhận số suy ra sau.
Vì vậy bảng giao dịch ngoại hối phải có: amount_original, currency_original, amount_credited, currency_credited, fx_rate, fx_rate_source, quote_id, quoted_at, fee.

| Trường | Ví dụ | Vai trò |
|---|---|---|
| amount_original + currency | 100.00, USD | số tiền khách nhìn thấy và đồng ý |
| fx_rate | 25.400 | tỷ giá đã áp dụng |
| fx_rate_source + quote_id | hội sở công bố, QR-20260605-00123 | tra được ai báo giá lúc nào |
| amount_credited + currency | 2.540.000, VND | số tiền thực ghi sổ |
| effective_at | 2026-06-05T10:00:03+07:00 | để tái hiện phiên bản bảng tỷ giá |

### Bid, mid, ask và spread — đọc nghiệp vụ trước khi đọc code
Ngân hàng luôn có hai giá: **bid** (ngân hàng mua vào) và **ask** (ngân hàng bán ra). Giá giữa của hai mức này gọi là **mid**, chỉ dùng để đưa tin và tính toán nội bộ, **không** dùng để thu tiền khách. Ví dụ 100 USD:
- Khách bán 100 USD cho ngân hàng: nhận 100 × 25.100 (bid) = 2.510.000.
- Khách mua 100 USD: trả 100 × 25.700 (ask) = 2.570.000.
- Chênh 60.000 đồng gọi là spread, đó là doanh thu của ngân hàng.
Dùng nhầm mid cho giao dịch thật là lỗi nghiệp vụ nghiêm trọng, thường lộ ra lúc đối soát cuối ngày với hội sở.

### Số chữ thập phân khác nhau giữa các loại tiền
Theo ISO 4217 mỗi tiền tệ có "số mũ" (exponent) riêng: VND và JPY là 0 (không có đơn vị nhỏ hơn để giao dịch), USD và EUR là 2, một số tiền vùng Vịnh như BHD, KWD là 3.
- Không được cộng 12.5 JPY với 12.50 USD rồi coi là một con số.
- Không được hard-code "2 chữ số thập phân" trong hàm tính phí.
- Hàm quy đổi phải nhận scale từ **loại tiền đích**, không phải từ loại tiền nguồn.

~~~java
record Money(BigDecimal amount, String currency) {
    private static final Map<String, Integer> EXPONENT = Map.of("VND", 0, "USD", 2, "JPY", 0, "BHD", 3);

    Money plus(Money other) {
        if (!currency.equals(other.currency))
            throw new IllegalStateException("Cong hai loai tien khac nhau: " + currency + " va " + other.currency);
        return new Money(amount.add(other.amount), currency);
    }

    Money convertedTo(String targetCode, BigDecimal rate) {   // lam tron theo so chu so thap phan cua tien dich
        BigDecimal raw = amount.multiply(rate);
        int scale = EXPONENT.get(targetCode);
        return new Money(raw.setScale(scale, RoundingMode.HALF_EVEN), targetCode);
    }
}
~~~

### Làm tròn và bài toán "rơi 1 đồng"
- HALF_UP (0.5 lên 1) là quy ước phổ biến với khách; HALF_EVEN (làm tròn về số chẵn) dùng khi phải cộng rất nhiều dòng, vì sai số hai chiều tự triệt tiêu thay vì luôn cộng dồn lên. Chọn một, ghi vào tài liệu, dùng nhất quán.
- Chỉ làm tròn **một lần ở đầu ra**; làm tròn trung gian rồi cộng tiếp sẽ lệch vài đơn vị trên mỗi nghìn giao dịch.
- Chia đều 100 USD cho 3 người: 33.33 + 33.33 + 33.33 = 99.99, thiếu 0.01. Phải phân bổ phần dư.

~~~java
static List<BigDecimal> splitEvenly(BigDecimal total, int parts, int scale) {   // so tien khong am
    long minor = total.movePointRight(scale).longValueExact();   // ve don vi nho nhat: cent, dong
    long each = Math.floorDiv(minor, parts);
    long residual = minor - each * parts;                        // phan le khong chia het
    List<BigDecimal> out = new ArrayList<>();
    for (int i = 0; i < parts; i++)
        out.add(BigDecimal.valueOf(each + (i < residual ? 1 : 0)).movePointLeft(scale));
    return out;   // tong cac phan luyen luon bang total
}
~~~

### Quy đổi nhiều bước và tỷ giá chéo
VND → EUR thường đi qua USD (tỷ giá chéo). Hai rủi ro: làm tròn ở mỗi bước làm lệch kết quả, và vòng cung tỷ giá không nhất quán (USD/EUR × EUR/VND khác USD/VND). Thực tế, bảng tỷ giá hội sở công bố hằng ngày cho từng cặp; hệ thống nên **chọn cặp có sẵn** thay vì tự suy ra, và nếu buộc phải suy thì tính bằng BigDecimal độ dài lớn, chỉ làm tròn khi ra số tiền.

### Đánh giá lại số dư ngoại tệ cuối ngày
Ngân hàng giữ số dư ngoại tệ (ví dụ 10 triệu USD trong tài khoản tiền gửi). Cuối ngày, tỷ giá thay đổi nên giá trị quy ra VND đổi theo. Kế toán gọi là **revaluation**: ghi bút toán lãi/lỗ chưa thực hiện (unrealized) để bảng cân đối phản ánh giá trị hiện hành, và đảo bút toán đó vào đầu ngày hôm sau.

~~~text
Revaluation 2026-06-05, vi tri 10.000.000 USD
Ty gia cuoi ngay: 25.400 -> 25.650 VND/USD
Gia tri quy VND:   254.000.000.000 -> 256.500.000.000
But toan: No "chenh lech ty gia chua thuc hien" 2.500.000.000
          Co "tai san ngoai te danh gia lai"      2.500.000.000
Ngay hom sau: dao nguoc but toan nay (reversal).
~~~

Báo cáo quản trị đa tiền tệ phải nói rõ **loại tiền báo cáo** và tỷ giá dùng (cuối ngày đầu kỳ, bình quân trong kỳ, hay cuối kỳ) — cùng một bộ số liệu, hai cách chọn khác nhau cho hai con số khác nhau, và người đọc phải biết mình đang nhìn cái nào.

### Lỗi hay gặp
- Lưu số tiền bằng double hoặc bằng long "số VND" rồi giả định mọi tiền tệ đều như vậy.
- Cột amount mà không có cột currency bên cạnh — sau 6 tháng không ai dám cộng chúng.
- Quy đổi hai lần (khách thấy số ở màn hình xác nhận khác số trong sao kê).
- Tính tỷ giá lúc đọc (JOIN bảng tỷ giá hôm nay) thay vì lúc ghi — báo cáo tháng trước thay đổi mỗi ngày.
- Làm tròn ở từng dòng chi tiết rồi cộng, tổng khác số làm tròn ở mức hóa đơn; phải có dòng điều chỉnh phần dư.

### Ví dụ đời thực
**Triệu chứng:** Sau khi tích hợp nhận thanh toán USD trên app, mỗi buổi sáng đội kế toán báo cáo doanh thu USD quy ra VND "khác hôm qua" dù không có giao dịch mới, và tổng tiền đối soát với ngân hàng thu hộ lệch vài chục nghìn đến vài triệu đồng.

**Điều tra:** Truy vấn bảng giao dịch thấy chỉ lưu {{amount}} và {{currency}} gốc; khi tạo báo cáo, code JOIN bảng {{fx_rate}} lấy tỷ giá {{current_date}}. Log cho thấy cùng giao dịch 100 USD ngày 05/06 (bid 25.400) hiển thị 2.565.000 VND vào ngày 06/06 vì tỷ giá đổi. Ngoài ra hàm quy đổi làm tròn từng dòng bằng {{HALF_UP}} rồi cộng, trong khi ngân hàng đối tác chốt tổng theo quy tắc khác.

**Nguyên nhân gốc:** Không snapshot tỷ giá và nguồn báo giá tại thời điểm giao dịch; làm tròn trung gian và không có cơ chế phân bổ phần dư.

**Cách xử lý:** Bổ sung các cột {{fx_rate, fx_rate_source, quote_id, quoted_at, amount_credited, currency_credited}} và backfill từ bảng báo giá lịch sử theo {{quoted_at}} gần nhất trước thời điểm giao dịch; khóa quy đổi chỉ dùng snapshot đã lưu. Chuyển làm tròn về một lần theo scale của tiền đích và thêm dòng điều chỉnh phần dư khi chia nhiều phần, sau đó chạy đối soát lại 30 ngày.

**Kết quả đo được:** Chênh lệch tỷ giá do tính lại giảm về 0 trên báo cáo lịch sử; sai lệch làm tròn giảm từ mức vài triệu đồng/tháng xuống 0 đồng nhờ dòng phân bổ dư; thời gian đối soát thủ công giảm từ ~3 giờ/ngày xuống ~30 phút.

### Trả lời mẫu khi phỏng vấn
"Tôi luôn coi tiền tệ là một cặp giá trị và loại tiền, không bao giờ tách rời. Với giao dịch có quy đổi, hệ thống phải lưu snapshot tỷ giá tại thời điểm thực hiện gồm giá, nguồn báo giá, mã quote và thời điểm hiệu lực, vì nếu tính lại theo tỷ giá hiện tại thì số liệu lịch sử sẽ đổi và không giải trình được với khách hay kiểm toán. Về làm tròn, tôi dùng số chữ thập phân theo ISO 4217 của loại tiền đích, chọn một chế độ như HALF_EVEN hoặc HALF_UP và áp dụng nhất quán, chỉ làm tròn một lần ở đầu ra. Khi chia tiền cho nhiều phần dễ phát sinh phần dư, tôi quy đổi về đơn vị nhỏ nhất rồi phân bổ phần lẻ thành các dòng điều chỉnh để tổng luôn khớp. Ở dự án trước, sau khi bổ sung snapshot tỷ giá và cơ chế phân bổ dư, chúng tôi loại bỏ hoàn toàn chênh lệch do tính lại báo cáo và rút ngắn đáng kể thời gian đối soát cuối ngày."

> Senior tip: Câu trả lời ăn điểm là chủ động nêu ba thứ: "tiền là cặp giá trị-loại tiền", "mọi giao dịch lưu tỷ giá và nguồn tỷ giá tại thời điểm", và "làm tròn một lần, có dòng điều chỉnh phần dư để tổng luôn khớp". Nói thêm về nghiệp vụ: chênh lệch tỷ giá là một khoản mục P&L thật, có phòng giao dịch (treasury) quản lý hạn mức, nên code của bạn chỉ được quyền áp tỷ giá, không được tự sinh tỷ giá.

> Cụm từ: Snapshot tỷ giá là bản ghi giá trị tỷ giá đã dùng tại thời điểm giao dịch, để sau này tái hiện đúng số tiền. Revaluation (đánh giá lại) là tính lại giá trị khoản mục ngoại tệ theo tỷ giá hiện hành cho báo cáo.

  `,
  follow: [
    'Vì sao phải lưu tỷ giá và nguồn tỷ giá theo từng giao dịch thay vì tra bảng tỷ giá khi cần?',
    'Chia một khoản tiền cho 3 phần, phần dư do làm tròn được xử lý thế nào để tổng vẫn khớp?',
    'Báo cáo quản trị có nhiều loại tiền: bạn chọn loại tiền báo cáo và tỷ giá nào, và ghi chú ra sao?'
  ],
  tags: ['ngoai te', 'ty gia', 'lam tron', 'ISO 4217', 'revaluation']
},
{
  id: 'banking-020',
  topic: 'banking',
  level: 'senior',
  q: 'Khi thay thế core banking, bạn migrate dữ liệu tài khoản và số dư thế nào: phân loại dữ liệu, chạy thử nhiều lần, đối soát số dư và xử lý sai lệch trước khi cắt (cutover)?',
  a: `**Tóm tắt:** Migration core banking là chuyển khách hàng, tài khoản, số dư, sản phẩm, lãi suất, ủy quyền từ hệ thống cũ sang hệ thống mới, với một yêu cầu duy nhất nhưng tuyệt đối: **từng đồng số dư phải khớp**. Cách làm an toàn là chạy nhiều lần (dry run) trên dữ liệu thật, đối soát tự động ở ba tầng (tổng, nhóm, từng tài khoản), rồi cắt vào một cửa sổ cuối tuần với tiêu chí go/no-go định lượng và kế hoạch lùi. Công cụ đối soát phải viết **trước** công cụ migrate, vì nó là thứ quyết định bạn có được cắt hay không.

### Phân loại dữ liệu cần chuyển — và quyết định không chuyển gì
| Nhóm | Nội dung | Quyết định điển hình |
|---|---|---|
| Master data | khách hàng, giấy tờ, quan hệ nhóm khách, địa chỉ | chuyển đầy đủ, kèm dữ liệu KYC và ngày hết hạn |
| Tài khoản & số dư | số hiệu, loại, trạng thái, số dư mở, ngày bắt đầu hiệu lực | chuyển đầy đủ, số dư phải khớp tuyệt đối |
| Lịch sử giao dịch | hàng trăm triệu dòng | thường chỉ chuyển snapshot số dư + 12-24 tháng gần; phần cũ để trong kho lưu trữ (data warehouse) và tra qua API |
| Điều khoản hợp đồng | lãi suất theo ngày, biểu phí, kỳ hạn, tái tục | chuyển kèm **phiên bản theo thời điểm**, không chỉ giá trị hiện tại |
| Trạng thái đang treo | hold thẻ, giao dịch pending, lãi đã trích chưa trả, séc đã phát hành | dễ sót nhất, phải có danh mục riêng và đối soát riêng |
| Ủy quyền, hạn mức, ràng buộc | mandate, lệnh thu/chi, phong tỏa theo thẩm quyền | bắt buộc chuyển, thiếu là vi phạm |

Lịch sử đầy đủ hay không là trade-off chi phí: chuyển 300 triệu dòng mất thêm nhiều giờ và nhiều dung lượng, trong khi luật và nghiệp vụ thường chỉ yêu cầu "tra được khi khách hỏi". Hãy nói rõ ai quyết định (khối tuân thủ) chứ đừng mặc định.

### Pipeline 4 bước và các lần chạy thử
Extract → Transform → Load → Reconcile.
- **Transform** là nơi sinh ra sai số: mã sản phẩm cũ A-101 map sang sản phẩm mới SAV_12; ngày lưu dạng DD/MM/YYYY phải về ISO; số âm bất thường phải được xử lý hoặc giải trình.
- Chạy **dry run** nhiều lần trên bản copy dữ liệu thật (đã che PII nếu môi trường không đủ cấp bảo mật), mỗi lần đo cả **thông lượng**: ví dụ 2 triệu tài khoản, ghi 5.000 dòng/giây thì mất ~7 phút cho số dư, nhưng 300 triệu dòng lịch sử ở 20.000 dòng/giây là ~4 giờ — so với cửa sổ cắt 48 giờ thì còn chỗ, nhưng không được gấp đôi.
- Mỗi lần chạy phải để lại báo cáo đối soát, và **số sai lệch phải giảm về 0** qua các lần chạy, không phải "à chỗ này bỏ qua được".

### Đối soát số dư ở ba tầng
1. **Tổng:** tổng số dư tài khoản khách hàng phải bằng số dư tài khoản đối ứng trên sổ cái (GL). Đây là kiểm tra nhanh nhất nhưng yếu nhất.
2. **Nhóm:** theo chi nhánh, loại sản phẩm, loại tiền, phân khúc.
3. **Từng tài khoản:** so old balance và new balance theo khóa, kỳ vọng **0 đồng sai lệch**.

Bẫy kinh điển: chỉ so tổng. Thiếu 1 tỷ ở tài khoản A và thừa 1 tỷ ở tài khoản B thì tổng vẫn đẹp. Vì vậy tầng 3 là bắt buộc, không phải tùy chọn.

~~~text
Số dư cuối lần chạy thứ #4  (toàn bộ 2.113.402 tài khoản)
MATCH            2.113.398
EXPLAINED             4   (3 tai khoan chet da doi soat tay, 1 lenh phí - da co bien ban)
UNEXPLAINED           0   <-- dieu kien can de cut-over: bang 0
Tong GL vs tong so du:  chenh 0
So du am bat thuong:     0
Tài khoản không map được sản phẩm: 0
~~~

~~~java
record AccountDiff(String accountNo, BigDecimal oldBalance, BigDecimal newBalance) {
    BigDecimal delta() { return newBalance.subtract(oldBalance); }
}

static String classify(AccountDiff d, Map<String, String> approvedExceptions) {
    BigDecimal delta = d.delta();
    if (delta.signum() == 0) return "MATCH";
    String note = approvedExceptions.get(d.accountNo());
    return note != null ? "EXPLAINED: " + note : "UNEXPLAINED";   // còn UNEXPLAINED thì không cắt
}
~~~

### Song song (parallel run) — các kiểu và rủi ro
- **Replay offline (an toàn nhất):** lấy file giao dịch và kết quả EOD của core cũ, nạp vào core mới trong môi trường riêng, so output. Core mới chưa chạm dữ liệu thật, khách không thấy gì.
- **Shadow write:** giao dịch thật được ghi vào cả core mới để kiểm tra, nhưng khách hàng vẫn phục vụ bởi core cũ. Rủi ro: hai chỗ cùng ghi, dễ lệch nếu logic chưa tương đương; phải tắt đường sinh số tham chiếu trùng.
- **Parallel run thật:** hai core cùng xử lý trong vài chu kỳ EOD, đối soát hằng ngày. Đắt nhất, nhưng là cách duy nhất để lộ chênh lệch về ngày lễ, cách làm tròn lãi, phí.
Rủi ro chung lớn nhất: **hai nguồn chân lý về số dư**. Nếu phải chọn, hãy chọn kiểu replay cho giai đoạn dài, chỉ chuyển sang shadow khi đã gần xong.

### Cutover và điểm không thể quay đầu
Runbook điển hình: đóng băng kênh (freeze, ngừng nhận giao dịch), chạy EOD cuối trên core cũ, migrate phần thay đổi (delta), đối soát, quyết định go/no-go theo tiêu chí đã định trước (số UNEXPLAINED = 0, 100% tài khoản khớp, các batch treo đã xử lý), bật core mới, chạy kiểm tra khói (mở app, xem số dư, chuyển khoản nội bộ, tra cứu một giao dịch cũ), rồi mở cửa cho khách.
- **Điểm không thể quay đầu (point of no return)** là lúc core mới bắt đầu ghi giao dịch thật; sau đó lùi về core cũ nghĩa là phải chuyển ngược và đối soát lại toàn bộ.
- Tiêu chí go/no-go phải là **số**, do một người có quyền quyết định, viết trước — nếu không, lúc 3 giờ sáng ai cũng tìm được lý do để "cứ chạy tiếp".

### Dữ liệu bẩn và hàng đợi ngoại lệ
Dữ liệu cũ luôn có: thiếu ngày sinh, trùng giấy tờ, tài khoản "ma" không chủ, số dư âm do nghiệp vụ cũ cho phép. Cách xử lý đúng là một **hàng đợi ngoại lệ**: mỗi bản ghi lỗi được ghi nhận, phân loại, chỉ định người sửa **trên hệ thống cũ** (nguồn của dữ liệu), rồi chạy lại. Không được "sửa" trong lúc migrate bằng cách điền bừa giá trị mặc định — bạn sẽ chuyển cả lỗi lẫn sự ngụy tạo.

### Lỗi hay gặp
- migrate một lần rồi tin là xong, không lập lại để kiểm tra tính tất định của công cụ.
- So tổng mà không so từng tài khoản; hai sai lệch bù trừ nhau.
- Quên trạng thái đang treo: hold thẻ, lãi đã trích, séc chưa đối soát → sau cắt, khách khiếu nại "mất" tiền thật.
- Không lưu ánh xạ id cũ → id mới; 5 năm sau không tra soát được giao dịch thời core cũ.
- Không đóng băng dữ liệu trong lúc migrate delta → mất giao dịch phát sinh trong cửa sổ.
- Rollback chỉ nằm trên giấy, chưa từng diễn tập.

### Ví dụ đời thực
**Triệu chứng:** Trong đợt dry run thứ ba cho 2,1 triệu tài khoản, báo cáo tổng số dư hai hệ thống khớp nhưng bộ phận vận hành phát hiện một số khách báo "thiếu tiền giữ chỗ thẻ" sau khi test trên core mới.

**Điều tra:** Chạy đối soát tầng 3 (từng tài khoản) bằng truy vấn so {{old_balance}} và {{new_balance}} theo khóa tài khoản, đồng thời so nhóm {{PENDING/HOLD}}. Log pipeline cho thấy 18 tài khoản UNEXPLAINED; kiểm tra chi tiết phát hiện 12 lệnh hold thẻ và 6 khoản lãi đã trích chưa trả không nằm trong danh mục trạng thái treo được migrate, vì ETL chỉ lấy snapshot số dư khả dụng.

**Nguyên nhân gốc:** Phạm vi dữ liệu chưa bao phủ trạng thái đang treo; tiêu chí "tổng khớp" che mất sai lệch bù trừ.

**Cách xử lý:** Bổ sung danh mục migrate riêng cho hold, pending, lãi dồn tích; sửa công cụ transform để ánh xạ và lưu {{old_id -> new_id}}; chạy lại dry run và yêu cầu UNEXPLAINED = 0 ở cả tầng tổng, nhóm, từng tài khoản trước khi họp go/no-go. Chuẩn bị runbook freeze kênh, migrate delta và tiêu chí lùi.

**Kết quả đo được:** Sau 2 lần chạy lại, UNEXPLAINED giảm từ 18 xuống 0 trên 2.113.402 tài khoản; thời gian chạy toàn bộ pipeline ổn định ~4,5 giờ trong cửa sổ cắt 48 giờ; buổi cutover không phát sinh khiếu nại mất hold/lãi trong tuần hỗ trợ tăng cường đầu tiên.

### Trả lời mẫu khi phỏng vấn
"Khi thay core banking, tôi tiếp cận như một bài toán quản lý rủi ro: từng đồng số dư phải khớp và phải chứng minh được. Tôi bắt đầu bằng phân loại dữ liệu gồm master data, tài khoản và số dư, điều khoản hợp đồng, lịch sử cần thiết và đặc biệt là các trạng thái treo như hold thẻ hay lãi đã trích. Tôi viết công cụ đối soát trước công cụ migrate, rồi chạy nhiều dry run trên bản sao dữ liệu thật để đo cả thời gian và tính ổn định. Đối soát phải làm ba tầng: tổng, theo nhóm và từng tài khoản, vì tổng khớp vẫn có thể che sai lệch bù trừ. Tiêu chí go/no-go tôi đặt bằng số, ví dụ UNEXPLAINED bằng 0, toàn bộ tài khoản khớp và không còn bản ghi treo chưa xử lý, kèm runbook freeze, migrate delta và kế hoạch lùi có diễn tập. Ở một lần chạy thử, chính đối soát từng tài khoản đã phát hiện các lệnh hold bị bỏ sót, và chúng tôi xử lý xong trước khi cắt để tránh khiếu nại của khách."

> Senior tip: Hãy trình bày câu này như quản lý rủi ro chứ không phải như bài toán copy dữ liệu: "tôi viết tool đối soát trước, vì tỷ lệ khớp là định nghĩa duy nhất của xong". Nêu ba con số bạn sẽ theo dõi qua từng dry run: số tài khoản UNEXPLAINED (phải về 0), thời gian chạy toàn bộ so với cửa sổ cắt, và số bản ghi bị loại vào hàng đợi ngoại lệ (phải giảm). Nói thêm: sau cutover vẫn còn giai đoạn "hỗ trợ tăng cường" vài tuần, vì lỗi migration thường lộ dần khi khách chạm các nghiệp vụ hiếm.

> Cụm từ: Dry run là chạy toàn bộ quy trình migrate trên bản dữ liệu thật nhưng không phục vụ khách, để đo thời gian và tìm sai lệch. EOD (end of day) là vòng batch cuối ngày, nơi số dư và sổ cái được khóa lại cho một ngày.

  `,
  follow: [
    'Vì sao phải đối soát tới từng tài khoản thay vì chỉ so tổng số dư với sổ cái?',
    'Shadow write và replay offline khác nhau ở rủi ro gì, bạn chọn cách nào cho giai đoạn nào?',
    'Đêm cutover, còn 3 tài khoản UNEXPLAINED trị giá 50.000 đồng, bạn quyết định thế nào?'
  ],
  tags: ['migration', 'core banking', 'doi soat', 'parallel run', 'cutover']
},
{
  id: 'banking-021',
  topic: 'banking',
  level: 'lead',
  q: 'Chia hệ thống ví điện tử thành các service theo domain (account, ledger, payment, notification): ranh giới dữ liệu ở đâu, ai sở hữu số dư, và giữ nhất quán thế nào khi một bước trong luồng tiền thất bại?',
  a: `**Tóm tắt:** Chia theo **năng lực nghiệp vụ**, không theo tầng kỹ thuật: account quản lý hồ sơ khách và trạng thái tài khoản, ledger là nơi **duy nhất** được ghi sổ và do đó sở hữu số dư, payment điều phối luồng tiền và tuyên bố giao dịch thành hay bại, notification chỉ thông báo và không được giữ trạng thái tiền. Trong một service dùng giao dịch database bình thường; giữa các service dùng **saga** (bước bù trừ khi thất bại) cộng **outbox** (ghi event cùng transaction rồi mới gửi) và consumer chống trùng. Không dùng giao dịch phân tán 2PC; thay vào đó chấp nhận nhất quán eventual cho phần thông báo và báo cáo, còn phần ghi sổ thì nhất quán mạnh.

### Bảng ranh giới dữ liệu
| Service | Sở hữu | API cung cấp | Event phát ra |
|---|---|---|---|
| account | hồ sơ khách, giấy tờ, trạng thái ACTIVE/FROZEN/CLOSED, mức KYC, giới hạn theo quy định | lấy hồ sơ, khóa/mở tài khoản | AccountFrozen, KycUpgraded |
| ledger | tài khoản kế toán kép, bản ghi sổ append-only, số dư dẫn xuất, tỷ giá đã áp | ghi nợ/có theo lệnh kế toán, hỏi số dư | LedgerEntryPosted |
| payment | đơn thanh toán, trạng thái vòng đời, tham chiếu đối tác, lệnh hoàn tiền | tạo thanh toán, tra soát | PaymentAuthorized, PaymentSettled, PaymentFailed |
| notification | mẫu tin, kênh gửi (push, SMS, OTT), nhật ký đã gửi, sở thích khách | gửi, hẹn lại, hủy | MessageDelivered, MessageFailed |

Quy tắc bất di bất dịch: **không service nào đọc bảng của service khác**. Muốn dữ liệu của nhau thì gọi API đồng bộ (khi phải trả lời ngay) hoặc nhận event và giữ bản sao để đọc (read model) cho màn hình của mình. Vi phạm quy tắc này là cách nhanh nhất để có "distributed monolith": sửa một bảng khiến bốn service cùng chết.

### Vì sao ledger phải tách riêng
- Số dư là dữ liệu nhạy cảm nhất: cần ghi theo giao dịch ACID, append-only, kiểm toán được. Nếu nằm chung với payment, mỗi lần thêm tính năng thanh toán mới (phí, giảm giá, trả góp) người ta sẽ sửa cả logic liên quan đến tiền.
- Tách ledger cho phép nhiều kênh dùng chung một sổ: ví, chuyển khoản, hóa đơn, hoàn tiền — tất cả chỉ gửi một "lệnh kế toán" (tài khoản A nợ X, tài khoản B có X, kèm tham chiếu).
- Ledger phải từ chối lệnh mất cân bằng (tổng nợ khác tổng có) và từ chối ghi trùng tham chiếu. Đó là chốt chặn cuối cùng trước sai tiền.

### Nhất quán giữa các service: saga cộng outbox
Luồng "nạp 500.000 đồng từ thẻ vào ví":
1. payment tạo giao dịch, gọi issuer xin authorization (đồng bộ, vì phải trả lời khách ngay).
2. Nếu được chuẩn chi, payment gửi lệnh kế toán cho ledger: nợ tài khoản trung gian của ngân hàng, có tài khoản ví của khách.
3. Ledger ghi trong một transaction database và ghi event vào outbox **cùng transaction đó**.
4. payment trả lời khách "nạp thành công".
5. notification nhận event LedgerEntryPosted và gửi push. Nếu notification chết, tiền **không** bị rollback: event còn trong outbox, sẽ được gửi lại, khách nhận thông báo muộn vài chục giây.
6. Nếu ledger từ chối (mất cân bằng, tài khoản bị đóng), payment chuyển FAILED; nếu issuer đã giữ tiền thì saga chạy bước bù trừ là hoàn authorization — compensation là hoàn tác về nghiệp vụ, không phải rollback database.

~~~seq
title: Nap tien tu the vao vi dien tu
actors: Khach | Payment | Ledger | Outbox | Notification
Khach -> Payment: nap 500.000 dong tu the
Payment -> Payment: xin authorization tu issuer
Payment -> Ledger: lenh ke toan no trung gian co vi khach
Ledger -> Ledger: kiểm tra cân bằng, ghi append-only
Ledger -> Outbox: ghi event cung transaction voi so du
Ledger --> Payment: da ghi so, ma bu toan LE-9931
Payment --> Khach: nap thanh cong
Outbox -> Notification: phat LedgerEntryPosted (duoc thu lai)
Notification -> Khach: push "Vi cua ban cong 500.000"
~~~

**Vấn đề ghi đôi (dual write):** nếu code "cập nhật database rồi publish Kafka" ở hai dòng liền nhau, publish có thể thành công trong khi transaction bị rollback, hoặc ngược lại. Outbox giải quyết bằng cách ghi event thành một dòng trong cùng transaction với dữ liệu nghiệp vụ, rồi một worker đều đặn đẩy các dòng chưa gửi ra bus và đánh dấu đã gửi.

~~~sql
CREATE TABLE outbox_event (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id VARCHAR(64) NOT NULL,        -- ma thanh toan: giu thu tu theo tung dong tien
  event_type   VARCHAR(64) NOT NULL,        -- LedgerEntryPosted
  version      SMALLINT    NOT NULL,        -- schema version, de them truong moi ma khong gay loan
  payload      JSONB       NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ                  -- NULL la chua gui
);
CREATE INDEX ix_outbox_unsent ON outbox_event (id) WHERE sent_at IS NULL;

CREATE TABLE consumer_dedup (               -- phía nhận, chống xử lý trùng
  consumer   VARCHAR(40) NOT NULL,
  event_id   BIGINT      NOT NULL,
  handled_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (consumer, event_id)
);
~~~

Consumer **bắt buộc idempotent** vì bus giao tối thiểu một lần (at-least-once): kiểm tra bảng dedup theo event id trước khi xử lý. Muốn giữ thứ tự thì partition theo khóa nghiệp vụ (walletId hoặc paymentId), đừng mong đợi thứ tự toàn cục.

### Điều phối tập trung hay phối hợp phân tán
| | Có người chỉ huy (orchestration) | Chỉ đẩy event (choreography) |
|---|---|---|
| Luồng có tiền, nhiều bước | rõ ràng, theo dõi được, hoàn tiền dễ | khó lần ra trạng thái trung gian |
| Thêm bước mới | sửa chỗ chỉ huy | thêm service mới, ít sửa service cũ |
| Giám sát | một chỗ thấy toàn cảnh | phải có tracing mới hiểu chuyện gì xảy ra |
| Phù hợp | thanh toán, rút tiền, đối soát | thông báo, tích hợp, đồng bộ tìm kiếm |

### Lỗi hay gặp
- Hai service cùng giữ số dư (payment tự thêm cột balance "cho nhanh") → lệch nhau và không ai biết số nào đúng. Đây là lỗi số một của hệ thống ví.
- Notification thất bại làm rollback giao dịch tiền: sai nguyên tắc, vì tiền đã được ghi sổ.
- Chia sẻ một database giữa các service "cho tiện" — thực chất là một hệ thống monolith nhưng vẽ thành bốn ô.
- Event không có version; đổi schema làm gãy consumer một cách âm thầm; hoặc nhét số thẻ/PII vào event khiến mọi subscriber thành nơi chứa dữ liệu nhạy cảm.
- Publish event trước khi commit transaction: consumer đọc phải dữ liệu chưa tồn tại.
- Không định nghĩa "thành công" nghĩa là gì: payment báo thành công trong khi ledger chưa ghi. Hãy chốt: thành công = ledger đã ghi sổ; các bước sau chỉ là phân phối thông tin.

### Ví dụ đời thực
**Triệu chứng:** Trong giờ cao điểm, một số khách nạp tiền thành công nhưng không nhận được push thông báo; đồng thời màn hình "Số dư ví" ở payment hiển thị khác với số dư tra cứu từ dịch vụ kế toán ở khoảng 0,2% phiên.

**Điều tra:** Kiểm tra log thấy payment ghi {{balance}} cục bộ rồi mới publish event Kafka; khi Kafka broker lỗi ngắn, event mất còn DB đã commit (dual write). Ở luồng khác, notification consumer timeout và throw lỗi khiến orchestrator retry toàn bộ bước nạp, trong khi ledger đã ghi sổ từ lần đầu. Truy vết {{paymentId}} qua bảng {{outbox_event}} và {{consumer_dedup}} cho thấy thiếu idempotency.

**Nguyên nhân gốc:** Không có outbox nên mất event; consumer không chống trùng; payment tự giữ bản sao số dư và coi nó là nguồn sự thật.

**Cách xử lý:** Bỏ cột số dư khỏi payment, chuyển mọi thay đổi tiền về lệnh kế toán gửi ledger; ghi event vào outbox trong cùng transaction với bút toán; worker đẩy event at-least-once, consumer kiểm tra {{consumer_dedup}} trước khi xử lý. Định nghĩa lại "thành công" = ledger đã ghi sổ, notification chỉ là bước phân phối thông tin có thể gửi lại.

**Kết quả đo được:** Sai lệch hiển thị số dư giữa service giảm về 0 do chỉ còn một nguồn sự thật; mất thông báo do lỗi publish giảm về 0 nhờ outbox; tỷ lệ gửi trùng thông báo khi retry giảm rõ rệt sau khi thêm chống trùng theo {{event_id}}.

### Trả lời mẫu khi phỏng vấn
"Tôi sẽ chia hệ thống ví theo năng lực nghiệp vụ: account quản lý hồ sơ và trạng thái tài khoản, ledger là nơi duy nhất ghi sổ và sở hữu số dư, payment điều phối luồng thanh toán và quyết định trạng thái giao dịch, còn notification chỉ gửi thông báo và không được giữ trạng thái tiền. Ranh giới dữ liệu rất rõ: service không đọc bảng của nhau, muốn dữ liệu thì gọi API hoặc nhận event để xây bản sao phục vụ đọc. Về nhất quán, trong một service tôi dùng giao dịch database, còn giữa các service tôi dùng saga với bước bù trừ khi thất bại, kết hợp outbox để ghi event cùng transaction rồi mới phát, và consumer phải idempotent vì message được giao ít nhất một lần. Tôi luôn chốt ledger ghi sổ là mốc thành công; nếu notification lỗi thì tiền không rollback mà event được gửi lại. Cách làm này tránh dual write và tránh việc mỗi service tự giữ một bản số dư khác nhau."

> Senior tip: Câu hỏi thật của nhà tuyển dụng không phải "vẽ được bao nhiêu ô", mà là hai câu: "ai sở hữu số dư" và "ai được quyền tuyên bố một giao dịch là thành công". Trả lời gọn: ledger sở hữu số dư, payment sở hữu trạng thái vòng đời, mọi nơi khác chỉ có bản sao để đọc và được phép chậm vài giây. Nói tiếp về đánh đổi: với ghi sổ thì chọn nhất quán, chấp nhận tạm giảm khả năng phục vụ; với thông tin thì chọn khả năng phục vụ, chấp nhận nhất quán tới sau — chính sự phân biệt đó là lý do saga và outbox tồn tại.

> Cụm từ: Saga là chuỗi bước cục bộ, mỗi bước có bước bù trừ (compensation) để hoàn tác về nghiệp vụ khi một bước sau thất bại; nó không phải một transaction trải trên nhiều database. Outbox là bảng ghi event ngay trong transaction nghiệp vụ để việc phát tin không bị mất và không phát trước khi dữ liệu tồn tại.

  `,
  follow: [
    'Vì sao không để service payment tự lưu cột số dư, dù chỉ để hiển thị nhanh?',
    'Notification gửi thất bại sau khi ledger đã ghi sổ: hệ thống ứng xử thế nào và khách thấy gì?',
    'Bạn chọn orchestration hay choreography cho luồng rút tiền về ngân hàng, vì sao?'
  ],
  tags: ['microservices', 'domain', 'ledger', 'saga', 'outbox']
},
{
  id: 'banking-022',
  topic: 'banking',
  level: 'lead',
  q: 'SLA, SLO, RTO và RPO của hệ thống thanh toán nghĩa là gì và liên hệ với nhau thế nào; thiết kế active-passive giữa hai data center phải chứng minh được những con số nào?',
  a: `**Tóm tắt:** SLA là cam kết với khách (kèm điều khoản bồi thường), SLO là mục tiêu nội bộ, SLI là cách đo thật. RTO (Recovery Time Objective) là **bao lâu thì phải phục vụ lại được**, RPO (Recovery Point Objective) là **được phép mất bao nhiêu dữ liệu**, tính bằng thời gian. Với hệ thống thanh toán, RPO cho giao dịch đã báo thành công phải bằng 0 (không được mất tiền đã ghi sổ), còn RTO cho luồng chấp nhận giao dịch thường 5-15 phút. Active-passive giữa hai data center chỉ có giá trị khi bạn **đo và diễn tập** được hai con số đó, không phải khi vẽ sơ đồ đẹp.

### Bốn khái niệm nối nhau bằng số
- **SLI (chỉ số):** ví dụ tỷ lệ giao dịch thanh toán trả lời thành công trong dưới 2 giây, đo từ phía khách, không đo "server còn sống".
- **SLO (mục tiêu nội bộ):** "99.95% số phút trong tháng đạt SLI".
- **SLA (cam kết):** SLO cộng hậu quả tài chính/pháp lý khi vi phạm.
- **Error budget (ngân sách gián đoạn):** phần thời gian còn được phép hỏng trong kỳ; hết ngân sách thì tạm dừng phát hành tính năng mới để trả nợ độ tin cậy.

~~~java
static BigDecimal allowedMinutesPerMonth(BigDecimal availabilityPercent) {
    BigDecimal minutesInMonth = new BigDecimal("43200");                // 30 ngay
    BigDecimal allowance = BigDecimal.ONE.subtract(availabilityPercent.movePointLeft(2));
    return minutesInMonth.multiply(allowance).setScale(2, RoundingMode.HALF_UP);
}
// 99.9   -> 43.20 phut    99.95  -> 21.60 phut
// 99.99  ->  4.32 phut    99.999 ->  0.43 phut (khoang 26 giay)
~~~

| Mục tiêu | Nghỉ phép mỗi tháng | Ý nghĩa thật với thanh toán |
|---|---|---|
| 99.9% | 43 phút | một sự cố buổi sáng là cạn ngân sách |
| 99.95% | 21.6 phút | khớp với RTO 15 phút cộng dự phòng |
| 99.99% | 4.3 phút | buộc failover tự động, không chờ người quyết |
| 99.999% | 26 giây | gần như phải active-active, chi phí rất lớn |

### RPO quyết định replication, RTO quyết định quy trình
**RPO = 0** nghĩa là tại thời điểm data center A cháy, không có giao dịch nào đã báo thành công mà chưa nằm ở nơi khác. Cách duy nhất là **nhật ký ghi sổ (log của database / sổ cái) được nhân bản đồng bộ** sang B và chỉ trả lời khách sau khi B xác nhận. Cái giá phải nói rõ: mỗi lần ghi chờ đường truyền A tới B nên độ trễ tăng (vài ms đến vài chục ms tùy khoảng cách), và nếu kênh nối đứt thì A phải **tạm dừng ghi** vì không còn giữ được RPO — điểm mà nhiều đội bỏ quên rồi tưởng mình đang có RPO 0.
**RPO vài giây** chấp nhận được với dữ liệu không trực tiếp là tiền (log, analytics, cache) vì dựng lại từ nguồn khác được.

**RTO là tổng của một chuỗi bước**, không phải "khởi động lại nhanh":

| Bước | Ngân sách thời gian |
|---|---|
| Phát hiện sự cố (monitoring + cảnh báo) | 1-2 phút |
| Xác nhận và quyết định failover (phải có người được ủy quyền) | 2-3 phút |
| Chuyển định tuyến vào (DNS hoặc VIP) sang DC B | 1-3 phút |
| Nâng database standby lên primary, kiểm tra điểm cuối log | 2-5 phút |
| Làm nóng application, cache, kết nối đối tác | 2-4 phút |
| Kiểm tra khói rồi mở cửa cho khách | 2-3 phút |
| **Tổng** | **10-20 phút** |

Nếu hợp đồng ghi RTO 5 phút, nhìn bảng trên sẽ thấy phải tự động hóa bước quyết định hoặc cắt giảm chỗ khác — đó là lúc cam kết business và kiến trúc gặp nhau, và là lý do bạn nên mang bảng này vào phỏng vấn.

### Active-passive giữa hai data center cần những mảnh nào
- **Định tuyến:** load balancer/DNS có TTL ngắn (hoặc VIP anycast) để chuyển nhanh, kèm bước xác minh lưu lượng đã thật sự về B.
- **Database:** standby nhận log liên tục; khi nâng cấp phải kiểm tra "giao dịch cuối cùng đã áp dụng chưa" trước khi nhận ghi.
- **Trọng tài (quorum):** nếu chỉ có hai DC mà kênh giữa chúng đứt, cả hai đều nghĩ bên kia chết và cùng nhận ghi — split-brain, sinh ra hai phiên bản số dư của cùng một tài khoản. Cần một bên thứ ba chỉ bỏ phiếu (node nhỏ ở site thứ ba hoặc trên cloud) để quyết ai được ghi.
- **Đồng nhất cấu hình:** schema, phần migration, tính năng phải như nhau. DC B chưa nâng cấp phiên bản thì failover thành thảm họa thứ hai.
- **Runbook và diễn tập:** kiểm tra từng phần mỗi quý (failover một service), toàn phần mỗi năm, và **đo thời gian thật** của từng bước. RTO trên giấy mà chưa diễn tập thì chưa tồn tại.
- **Failback:** đường về A thường bị bỏ quên; dữ liệu sinh ra ở B phải được đồng bộ ngược rồi mới cắt về.

### Failover diễn ra thế nào
~~~seq
title: Failover tu DC A sang DC B
actors: Khach | Dinh tuyen | DC A | Trong tai | DC B
Khach -> Dinh tuyen: yeu cau thanh toan
Dinh tuyen -> DC A: chuyen yeu cau
DC A --> Dinh tuyen: khong phan hoi
Trọng tải -> DC A: kiểm tra sự sống, thất bại
Trong tai -> DC B: quorum dong y, coi DC A da chet
Dinh tuyen -> DC B: chuyen dinh tuyen ve DC B
DC B -> DC B: nang DB standby len primary
DC B -> DC B: kiểm tra giao dịch cuối đã áp dụng
DC B --> Dinh tuyen: san phuc vu
Khach -> Dinh tuyen: yeu cau thanh toan tiep theo
Dinh tuyen -> DC B: phuc vu, khach khong biet DC A chet
~~~

### Sau failover: giao dịch "đã gửi mà không thấy trả lời"
Trong 10-20 phút gián đoạn có những giao dịch đã vào A nhưng phản hồi không tới khách. Khách (và kẻ gian) sẽ bấm lại. Xử lý đúng: lưu **khóa chống trùng do khách cấp** (idempotency key) ngay từ đầu, khi mở cửa lại cho phép tra soát theo khóa đó và trả về đúng kết quả cũ; giao dịch chưa chắc chắn thì giữ trạng thái "đang tra soát" và đối soát với đối tác. Không được "an toàn bằng cách coi như chưa từng có" — khách sẽ bấm lại và bị trừ tiền hai lần.

### Phụ thuộc bên ngoài chặn trần SLA của bạn
SLA 99.95% của bạn không thể độc lập nếu đường ra hệ thống chuyển mạch, nhà mạng SMS, hoặc nhà cung cấp định danh eKYC chỉ đạt 99.5%. Availability của chuỗi là tích các phần: 0.9995 × 0.9995 × 0.995 ≈ 0.994. Từ con số đó, bàn lại với nghiệp vụ: hoặc thêm kênh dự phòng cho phụ thuộc yếu, hoặc thu hẹp phạm vi cam kết trong hợp đồng.

### Lỗi hay gặp
- Đo "server sống" (ping được) thay vì "giao dịch thành công": hệ thống thật đang đỏ vì p95 tăng gấp ba mà dashboard vẫn xanh.
- Tài liệu ghi RPO 0 nhưng replication đang cấu hình bất đồng bộ.
- Tự hào "có backup hằng đêm" trong khi chưa từng kiểm chứng một lần restore.
- DNS TTL 300-3600 giây khiến "failover 5 phút" thực tế mất 40 phút vì khách còn trỏ về DC cũ.
- Không có ai được ủy quyền bấm nút failover, cả phòng kỹ thuật đứng nhìn qua Zoom.
- Cache lạnh sau khi chuyển làm p95 tăng vọt: RTO về trải nghiệm khách dài hơn RTO về kỹ thuật.

### Ví dụ đời thực
**Triệu chứng:** Một buổi diễn tập sự cố, đội vận hành báo "failover xong trong 8 phút" nhưng khách hàng vẫn không thanh toán được ổn định trong hơn 30 phút; sau đó phát hiện vài giao dịch đã báo thành công trên DC chính không xuất hiện ở DC dự phòng.

**Điều tra:** Kiểm tra cấu hình database thấy replication đang ở chế độ bất đồng bộ (async), độ trễ log {{replay_lag}} dao động 2-5 giây trước thời điểm cắt. DNS TTL của endpoint thanh toán đặt 600 giây nên một phần lớn client vẫn trỏ về DC cũ. Nhật ký runbook cho thấy bước xác nhận failover chờ người duyệt thủ công ~6 phút và không có bước kiểm tra "điểm cuối log đã áp dụng".

**Nguyên nhân gốc:** RPO được kỳ vọng là 0 nhưng kiến trúc thực tế cho phép mất dữ liệu vài giây; RTO chỉ tính thời gian kỹ thuật, bỏ qua phát hiện, quyết định, DNS và làm nóng cache.

**Cách xử lý:** Chuyển replication sang đồng bộ cho phân vùng ghi sổ giao dịch thành công, chấp nhận tăng độ trễ ghi; hạ DNS TTL xuống 60 giây và bổ sung VIP cho luồng nội bộ; tự động hóa phát hiện và kịch bản nâng standby với danh sách kiểm tra bắt buộc; diễn tập định kỳ và ghi nhận thời gian từng bước.

**Kết quả đo được:** Trong lần diễn tập tiếp theo, RTO đo được từ lúc cảnh báo đến khi giao dịch thành công ổn định là ~14 phút, nằm trong mục tiêu 15 phút; {{replay_lag}} tại thời điểm cắt bằng 0 cho luồng ghi sổ, không ghi nhận mất giao dịch đã xác nhận; tỷ lệ lỗi do cache lạnh giảm sau khi thêm bước warm-up.

### Trả lời mẫu khi phỏng vấn
"Tôi phân biệt rõ SLA, SLO và SLI: SLA là cam kết với khách kèm hậu quả, SLO là mục tiêu nội bộ, còn SLI là chỉ số đo thật như tỷ lệ giao dịch thành công trong ngưỡng thời gian. Với thanh toán, RPO cho giao dịch đã báo thành công phải bằng 0, nên tôi dùng nhân bản nhật ký đồng bộ và chấp nhận đánh đổi độ trễ ghi cũng như việc phải tạm dừng ghi nếu mất kênh. RTO là tổng của chuỗi phát hiện, quyết định, chuyển định tuyến, nâng standby, làm nóng và kiểm tra khói, vì vậy tôi chia ngân sách thời gian cho từng bước và diễn tập để đo con số thực tế. Trong thiết kế active-passive, tôi luôn nhắc tới quorum để tránh split-brain, cấu hình đồng nhất giữa hai site và kế hoạch failback. Tôi cũng tính SLA theo chuỗi phụ thuộc bên ngoài để không cam kết vượt quá khả năng thực tế của toàn hệ thống."

> Senior tip: Trả lời theo ba câu chốt: (1) RPO của dữ liệu đã báo thành công phải bằng 0, nên ghi sổ được nhân bản đồng bộ, và tôi chấp nhận đánh đổi độ trễ cùng việc tạm dừng ghi khi mất kênh; (2) RTO là tổng của một chuỗi bước có người chịu trách nhiệm, tôi chia ngân sách thời gian cho từng bước và diễn tập để đo con số thật; (3) SLA bị trần của phụ thuộc bên ngoài chặn lại, nên tôi tính theo chuỗi và bàn lại phạm vi cam kết. Câu chốt thứ tư ghi điểm: hệ thống thanh toán dự phòng tốt là hệ thống **replay được** — mất kết nối không mất tiền vì đã có tham chiếu duy nhất và chứng thư đối soát.

> Cụm từ: Split-brain là tình trạng hai bản cùng nghĩ mình là bản chính và cùng nhận ghi, sinh ra hai lịch sử số dư khác nhau. Failback là bước đưa lưu lượng về data center ban đầu sau khi khắc phục, thường khó hơn failover vì phải đồng bộ dữ liệu phát sinh theo chiều ngược.

  `,
  follow: [
    'Vì sao RPO bằng 0 cho giao dịch đã báo thành công buộc phải nhân bản đồng bộ, và cái giá là gì?',
    'Kênh nối giữa hai data center đứt: hệ thống phải ứng xử thế nào để không có hai phiên bản số dư?',
    'Sau failover, khách khiếu nại "đã bấm chuyển tiền hai lần", bạn dựa vào dữ liệu nào để trả lời?'
  ],
  tags: ['SLA', 'RTO', 'RPO', 'active-passive', 'disaster recovery']
},
{
  id: 'banking-023',
  topic: 'banking',
  level: 'mid',
  q: 'Vì sao hệ thống ngân hàng không nên UPDATE trực tiếp cột số dư (balance) trong bảng tài khoản khi có giao dịch, mà nên dùng sổ cái ghi từng bút toán (double-entry)? Hãy giải thích bằng một ví dụ race condition (hai giao dịch chạy đồng thời tranh nhau cập nhật cùng một tài khoản).',
  a: `**Tóm tắt:** UPDATE trực tiếp số dư (ví dụ {{UPDATE accounts SET balance = balance - 100 WHERE id = ?}}) làm mất lịch sử, khó kiểm toán, và dễ sai khi hai giao dịch chạy đồng thời đọc cùng một số dư cũ. Sổ cái double-entry (ghi sổ kép: mỗi bút toán ghi ít nhất 2 dòng, một bên Nợ/Debit và một bên Có/Credit, tổng luôn bằng 0) lưu mọi biến động thành dòng bất biến (append-only), từ đó tính lại số dư bất cứ lúc nào và phát hiện lệch.

### "UPDATE số dư trực tiếp" nghĩa là gì
Cách làm đơn giản nhất khi chuyển tiền: đọc số dư tài khoản A, trừ đi 100.000, ghi lại. Trong SQL trông như:
~~~sql
-- Cách NAIVE: đọc rồi ghi (dễ sai)
SELECT balance FROM accounts WHERE id = 'A';  -- đọc được 500.000
UPDATE accounts SET balance = 400000 WHERE id = 'A';  -- ghi đè
~~~
Hoặc gọn hơn một câu: {{UPDATE accounts SET balance = balance - 100000 WHERE id = 'A'}}. Cách này nhanh nhưng có 3 vấn đề lớn.

### Vấn đề 1 — Mất lịch sử, không kiểm toán được
Sau khi UPDATE, giá trị cũ (500.000) biến mất. Nếu khách hỏi "sáng nay tài khoản tôi còn bao nhiêu, ai trừ tiền?", bạn không có dòng ghi nào để trả lời. Ngân hàng chịu sự giám sát của cơ quan quản lý: mọi biến động tiền phải truy vết được ai làm, lúc nào, vì sao. Ghi đè số dư vi phạm nguyên tắc này.

### Vấn đề 2 — Race condition (tranh chấp đồng thời)
**Race condition** (điều kiện tranh chấp): kết quả sai vì hai luồng xử lý cùng đọc/ghi một dữ liệu và thứ tự chạy xen kẽ nhau. Ví dụ đời thường: hai người cùng nhìn ví còn 500.000, mỗi người rút 400.000, cả hai nghĩ "đủ tiền" — tổng rút 800.000 dù ví chỉ có 500.000.

Ví dụ cụ thể trên tài khoản A đang có 500.000 VND, hai giao dịch chạy gần như cùng lúc:
~~~text
Thời điểm   Giao dịch T1 (rút 400.000)        Giao dịch T2 (rút 300.000)
t1          Đọc balance = 500.000
t2                                            Đọc balance = 500.000  (vẫn 500k!)
t3          Kiểm tra: 500k >= 400k -> OK
t4                                            Kiểm tra: 500k >= 300k -> OK
t5          UPDATE balance = 500k - 400k = 100k
t6                                            UPDATE balance = 500k - 300k = 200k
Kết quả: balance = 200.000, nhưng thực tế đã rút 700.000 từ 500.000 -> ÂM 200.000 bị che mất
~~~
Câu {{UPDATE ... SET balance = balance - x}} dạng nguyên tử (atomic, thực hiện trọn một bước ở mức DB) giảm rủi ro ở t5/t6, nhưng nếu code tách thành "đọc -> kiểm tra -> ghi" như trên thì vẫn sai. Và dù dùng câu nguyên tử, bạn vẫn không biết giao dịch nào chạy trước, không có lịch sử.

### Vấn đề 3 — Khó đối soát và sửa sai
Nếu một batch tính lãi chạy sai và UPDATE nhầm 1 triệu tài khoản, bạn không có cách "đảo ngược" chính xác từng bút trừ khi chỉ biết số dư cuối. Với sổ cái, bạn thêm bút toán điều chỉnh (adjustment entry) và mọi thứ còn nguyên vẹn.

### Double-entry giải quyết thế nào
Mỗi giao dịch chuyển 100.000 từ A sang B tạo 2 dòng sổ cái trong cùng một **DB transaction** (giao dịch cơ sở dữ liệu: nhóm lệnh hoặc cùng thành công hoặc cùng thất bại):
~~~sql
-- Sổ cái: chỉ INSERT, không UPDATE/DELETE dòng cũ
INSERT INTO ledger_entries(tx_id, account_id, direction, amount, created_at)
VALUES ('TX1', 'A', 'DEBIT',  100000, now());  -- A giảm
INSERT INTO ledger_entries(tx_id, account_id, direction, amount, created_at)
VALUES ('TX1', 'B', 'CREDIT', 100000, now());  -- B tăng
~~~
- **DEBIT** (Nợ) / **CREDIT** (Có): hai phía của bút toán kép. Với tài khoản tiền gửi khách hàng, ghi Nợ ở tài khoản A nghĩa là giảm tiền A, ghi Có ở B nghĩa là tăng tiền B. Tổng mọi bút trong một tx luôn cân (Debit = Credit).
- Số dư = tổng CREDIT - tổng DEBIT của tài khoản (hoặc lưu một bảng "snapshot" số dư được tính từ sổ cái, cập nhật có kiểm soát).
- Kiểm tra đồng thời: dùng **SELECT ... FOR UPDATE** (khóa dòng tài khoản khi đọc để tính/kiểm tra số dư) hoặc cơ chế **optimistic locking** (khóa lạc quan: thêm cột {{version}}, UPDATE chỉ thành công nếu version khớp) để chống race condition.

~~~seq
title: Double-entry chuyen tien trong 1 DB transaction
actors: App | PaymentService | LedgerDB
App -> PaymentService: chuyen 100000 tu A sang B
PaymentService -> LedgerDB: BEGIN
PaymentService -> LedgerDB: khoa tai khoan A, tinh so du tu so cai
PaymentService -> LedgerDB: INSERT DEBIT A 100000
PaymentService -> LedgerDB: INSERT CREDIT B 100000
PaymentService -> LedgerDB: kiem tra tong = 0
PaymentService -> LedgerDB: COMMIT
PaymentService --> App: thanh cong, co tx_id de truy vet
~~~

### Lỗi hay gặp
- Vẫn UPDATE balance trực tiếp "cho nhanh" rồi mới INSERT ledger -> hai nguồn dữ liệu lệch nhau khi lỗi giữa chừng.
- INSERT 2 dòng ledger nhưng quên bọc trong một DB transaction -> mất một dòng, sổ cái không cân.
- Tính số dư bằng cách cộng dồn toàn bộ ledger mỗi lần đọc trên bảng lớn -> chậm; cần snapshot/bảng cân đối được cập nhật đồng bộ trong cùng transaction.
- Dùng kiểu {{double/float}} cho {{amount}} -> sai số làm tròn; luôn dùng {{BigDecimal}} hoặc số nguyên đơn vị nhỏ nhất (xem banking-027).

### Ví dụ đời thực
**Triệu chứng:** Đầu giờ sáng, bộ phận CS nhận 5 khiếu nại "tài khoản bị trừ tiền sai": một tài khoản có số dư hiển thị 200.000 VND nhưng lịch sử rút tiền cho thấy đã rút tổng 700.000 VND từ số dư ban đầu 500.000 VND trong cùng buổi tối hôm trước.

**Điều tra:** Truy vết log ứng dụng thấy hai request rút tiền của cùng tài khoản đến gần như đồng thời (chênh ~40 ms). Code đang dùng luồng "SELECT balance -> kiểm tra -> UPDATE balance = giá trị mới". Bảng {{accounts}} chỉ có cột {{balance}} bị ghi đè, không có bảng ghi bút toán chi tiết; audit log chỉ lưu "đã gọi API rút tiền" mà không có {{tx_id}} gắn với thay đổi số dư.

**Nguyên nhân gốc:** Race condition do đọc-ghi tách rời và cập nhật trực tiếp số dư; thiếu sổ cái bất biến nên không tái hiện được thứ tự và giá trị trung gian.

**Cách xử lý:** Chuyển sang mô hình double-entry: mỗi lần rút ghi 2 dòng ledger (DEBIT tài khoản khách, CREDIT tài khoản đối ứng) trong một DB transaction, kèm {{tx_id}} duy nhất. Khi kiểm tra và ghi, khóa hàng tài khoản bằng {{SELECT ... FOR UPDATE}} hoặc dùng optimistic locking với {{version}}. Số dư hiển thị lấy từ bảng snapshot được cập nhật trong cùng transaction với ledger.

**Kết quả đo được:** Tái hiện kịch bản 50 luồng rút đồng thời trên cùng tài khoản trong môi trường kiểm thử cho thấy không còn âm số dư ngoài dự kiến; mọi bút toán đều truy vết được theo {{tx_id}}; thời gian tra soát khiếu nại giảm từ hàng giờ (phải đối chiếu log rời rạc) xuống còn vài phút nhờ truy vấn ledger.

### Trả lời mẫu khi phỏng vấn
"Tôi không coi cột balance là nguồn sự thật mà chỉ là giá trị dẫn xuất từ sổ cái. Nếu UPDATE trực tiếp số dư, ta vừa mất lịch sử kiểm toán vừa dễ gặp race condition khi hai giao dịch đọc cùng số dư cũ rồi ghi đè. Tôi thiết kế theo double-entry: mỗi giao dịch sinh các bút toán Nợ và Có cân bằng, chỉ INSERT append-only vào ledger trong một DB transaction và gắn tx_id duy nhất. Để chống tranh chấp, tôi dùng SELECT FOR UPDATE khi cần tính và trừ tiền trên tài khoản nóng, hoặc optimistic locking với version và retry nếu xung đột thấp. Số dư phục vụ đọc có thể lưu snapshot nhưng phải được cập nhật đồng bộ cùng transaction ghi ledger. Cách này giúp hệ thống truy vết được mọi biến động và luôn kiểm tra được tổng Nợ bằng tổng Có."

> Senior tip: Trong phỏng vấn, hãy nói rõ: "Số dư là một *kết quả dẫn xuất* (derived) từ sổ cái, không phải nguồn sự thật gốc". Nguồn sự thật là các bút toán bất biến. Khi bị hỏi cách chống race condition, nêu 2 lựa chọn: khóa bi quan {{SELECT FOR UPDATE}} trên hàng tài khoản (đơn giản, an toàn, có thể nghẽn khi hot account) hoặc optimistic locking + retry (ít khóa hơn, phải xử lý xung đột). Đừng quên nhắc: mọi thay đổi tiền phải nằm trong một DB transaction và có {{tx_id}} duy nhất để idempotent.
  `,
  follow: [
    'Khóa bi quan (SELECT FOR UPDATE) và khóa lạc quan (version/optimistic locking) khác nhau thế nào, khi nào chọn cái nào cho tài khoản "nóng"?',
    'Nếu chỉ được dùng bảng ledger append-only, bạn tính và cache số dư hiện tại ra sao mà vẫn đảm bảo đúng?',
    'Một bút toán điều chỉnh (adjustment/reversal) được ghi thế nào để không phá tính bất biến của sổ cái?'
  ],
  tags: ['double-entry', 'ledger', 'race condition', 'balance', 'transaction']
},
{
  id: 'banking-024',
  topic: 'banking',
  level: 'mid',
  q: 'Đối soát (reconciliation) cuối ngày với Napas hoặc đối tác thanh toán diễn ra như thế nào? Các loại lệch (break) thường gặp là gì và quy trình xử lý ra sao?',
  a: `**Tóm tắt:** Đối soát (reconciliation) là so khớp từng giao dịch giữa sổ của mình và file/báo cáo của đối tác (Napas, ngân hàng khác, ví điện tử) để đảm bảo tiền hai bên ghi nhận khớp nhau. Thường chạy cuối ngày (EOD) hoặc theo lô: tải file đối tác -> chuẩn hóa -> khớp theo khóa (mã giao dịch, số tiền, thời gian) -> phân loại lệch (break) -> tra soát và điều chỉnh. Mục tiêu: không đồng nào bị "treo" không rõ chủ.

### Đối soát là gì, vì sao phải làm
**Reconciliation** (đối soát): quá trình so sánh hai bộ ghi chép độc lập về cùng một sự kiện để tìm điểm khác biệt. Ví dụ đời thường: cuối ca thu ngân đếm tiền mặt trong két và so với số trên máy tính — nếu lệch phải tìm ra giao dịch nào sai. Trong ngân hàng, "két" của bạn là sổ cái/core, "máy tính đối tác" là file Napas gửi.

Vì sao không thể tin 100% vào phản hồi realtime? Vì timeout/mất mạng: bạn gửi lệnh chuyển, đối tác có thể đã trừ/cộng tiền nhưng phản hồi bị rớt (xem banking-002/025). Đối soát cuối ngày là lưới an toàn bắt những giao dịch "trạng thái mơ hồ".

### Quy trình đối soát điển hình
~~~seq
title: Doi soat EOD voi Napas/doi tac
actors: CoreBank | ReconJob | DoiTacFile | OpsTeam
CoreBank -> ReconJob: danh sach giao dich ngay T (noi bo)
DoiTacFile -> ReconJob: file doi tac ngay T (CSV/XML/ISO)
ReconJob -> ReconJob: chuan hoa dinh dang, map truong
ReconJob -> ReconJob: khop theo khoa (ref_id, amount, date)
ReconJob -> ReconJob: phan loai: MATCH / BREAK
ReconJob -> OpsTeam: bao cao break + chi tiet lech
OpsTeam -> CoreBank: tra soat, gui inquiry, dieu chinh/dao
~~~

### Khóa khớp (matching key)
Thường khớp theo nhiều tầng, từ chặt đến lỏng:
1. **Mã tham chiếu duy nhất** (reference/trace number, ví dụ {{RRN}} - Retrieval Reference Number, hoặc {{STAN}} - Systems Trace Audit Number trong giao dịch thẻ): khớp 1-1 là lý tưởng.
2. **Số tiền + tài khoản + ngày**: dùng khi mã tham chiếu lệch định dạng giữa hai bên.
3. **Số tiền + khoảng thời gian**: khớp mờ (fuzzy), cần người duyệt.

### Các loại lệch (break) thường gặp
~~~text
Loại break              Mô tả                                      Hướng xử lý
----------------------  -----------------------------------------  -----------------------------
Có ở mình, không ở DT   Mình ghi nhận nhưng đối tác không có       Tra soát: mình ghi nhầm? hay DT chưa post?
Có ở DT, không ở mình   Đối tác có, mình không có                  Tra soát: timeout mất phản hồi? bổ sung bút toán
Khớp mã, lệch tiền      Cùng giao dịch nhưng amount khác           Kiểm tra phí, làm tròn, tỷ giá; điều chỉnh
Khớp mã, lệch trạng thái Mình PENDING, DT SUCCESS (hoặc ngược lại) Chạy inquiry/confirm, cập nhật trạng thái
Trùng lặp (duplicate)   Cùng ref xuất hiện 2 lần một bên           Kiểm tra retry/idempotency, đảo bút thừa
~~~
**DT** = đối tác. **Inquiry** (truy vấn): gửi câu hỏi tới đối tác "giao dịch mã X trạng thái thật là gì?".

### Ví dụ số liệu đơn giản
~~~text
Sổ mình (Core):  TX001  A->B  1.000.000  SUCCESS
                 TX002  C->D    500.000  PENDING  (timeout khi gọi Napas)
                 TX003  A->E    200.000  SUCCESS
File Napas:      TX001  A->B  1.000.000  SUCCESS
                 TX002  C->D    500.000  SUCCESS  (Napas đã xử lý!)
                 TX004  F->G    300.000  SUCCESS  (mình không có)
Kết quả: TX001 MATCH; TX002 lệch trạng thái -> inquiry/confirm rồi cập nhật; TX004 có ở DT, không ở mình -> tra soát khẩn
~~~

### Lỗi hay gặp
- Chỉ so tổng tiền cuối ngày mà không so từng giao dịch -> tổng có thể khớp ngẫu nhiên dù từng bút lệch.
- Khóa khớp dùng mỗi số tiền -> nhiều giao dịch cùng số tiền bị khớp sai.
- Không chuẩn hóa múi giờ/định dạng ngày (mình lưu UTC, đối tác gửi giờ địa phương) -> lệch ngày, báo "không tìm thấy".
- Xử lý break bằng tay hoàn toàn, không có công cụ/queue theo dõi trạng thái tra soát -> sót giao dịch treo nhiều ngày.
- Điều chỉnh sổ cái không qua maker-checker (xem banking-026) -> rủi ro gian lận.

### Ví dụ đời thực
**Triệu chứng:** Báo cáo EOD với Napas cho thấy tổng tiền khớp nhưng có 12 khiếu nại "chuyển khoản thành công phía nhận nhưng tài khoản nguồn vẫn treo" trong ngày; thêm 3 giao dịch bị gắn sai ngày trong báo cáo nội bộ.

**Điều tra:** Job đối soát tải file Napas (CSV) và so khớp theo {{RRN}}, {{amount}}, ngày giao dịch. Phát hiện 12 bản ghi trạng thái {{PENDING}} ở core nhưng {{SUCCESS}} ở file đối tác (timeout mất phản hồi), 1 bản ghi có ở đối tác nhưng thiếu trong core, và một nhóm giao dịch sau 17:00 UTC bị xếp sang ngày T+1 do core lưu UTC còn file đối tác dùng giờ địa phương. Log cho thấy bước chuẩn hóa chưa đổi múi giờ trước khi tạo khóa ngày.

**Nguyên nhân gốc:** Thiếu quy trình xử lý trạng thái mơ hồ realtime bằng đối soát; chuẩn hóa thời gian và khóa khớp chưa đủ chặt.

**Cách xử lý:** Chuẩn hóa toàn bộ timestamp về cùng múi giờ trước khi khớp; ưu tiên khớp theo mã tham chiếu duy nhất (RRN/STAN) rồi mới dùng các tiêu chí phụ. Phân loại break thành MATCH/BREAK_OPEN và đẩy vào hàng đợi tra soát có chủ sở hữu, SLA. Với các giao dịch lệch trạng thái, gửi inquiry/confirm tới đối tác rồi cập nhật trạng thái hoặc tạo bút toán điều chỉnh append-only, có maker-checker.

**Kết quả đo được:** 13/13 break trong ngày được phân loại và xử lý trong vòng 1 ngày làm việc; giao dịch PENDING được xác nhận SUCCESS và cập nhật đúng, không phát sinh trùng tiền; sau khi chuẩn hóa múi giờ, lỗi lệch ngày trong báo cáo giảm về 0 ở các kỳ đối soát tiếp theo.

### Trả lời mẫu khi phỏng vấn
"Tôi xem đối soát cuối ngày là lưới an toàn cho các giao dịch có trạng thái mơ hồ do timeout hoặc mất phản hồi. Quy trình của tôi là lấy dữ liệu nội bộ và file đối tác, chuẩn hóa định dạng và múi giờ, rồi khớp theo khóa tham chiếu duy nhất như RRN hoặc STAN kết hợp số tiền và thời gian. Kết quả được phân loại thành khớp hoặc break, và break phải đi vào pipeline có trạng thái với người chịu trách nhiệm và hạn xử lý. Các loại lệch thường gặp là có ở một bên, lệch số tiền, lệch trạng thái hoặc trùng lặp, mỗi loại có hướng tra soát và điều chỉnh khác nhau. Khi cần sửa sổ, tôi luôn tạo bút toán mới append-only và áp dụng maker-checker, không sửa dòng cũ. Ở thực tế, việc chuẩn hóa khóa và múi giờ giúp tôi phát hiện sớm các giao dịch treo và tránh xử lý nhầm do khớp mờ."

> Senior tip: Thiết kế đối soát như một pipeline có trạng thái: {{IMPORTED -> MATCHED -> BREAK_OPEN -> INVESTIGATING -> RESOLVED}}. Mỗi break phải có chủ sở hữu, hạn xử lý (SLA), và nhật ký hành động. Trong phỏng vấn, nhấn mạnh: đối soát không chỉ là "báo cáo" mà là cơ chế phát hiện mất tiền; và mọi điều chỉnh sau đối soát phải tạo bút toán mới trên sổ cái (append-only), tuyệt đối không sửa dòng cũ.
  `,
  follow: [
    'Làm sao thiết kế khóa tham chiếu (reference id) ngay từ lúc tạo giao dịch để việc khớp với Napas/đối tác luôn 1-1?',
    'Nếu file đối tác đến trễ 2 ngày hoặc bị gửi trùng, job đối soát cần xử lý thế nào để idempotent?',
    'Khi nào bạn tự động điều chỉnh trạng thái (auto-resolve) và khi nào bắt buộc người duyệt?'
  ],
  tags: ['reconciliation', 'Napas', 'EOD', 'break', 'settlement']
},
{
  id: 'banking-025',
  topic: 'banking',
  level: 'senior',
  q: 'Khi chuyển tiền liên ngân hàng qua Napas/đối tác bị timeout (không nhận được phản hồi), bạn thiết kế trạng thái giao dịch và quy trình tra soát/hoàn tiền như thế nào để không mất tiền và không trùng tiền?',
  a: `**Tóm tắt:** Timeout nghĩa là *không biết* kết quả, không phải thất bại. Giao dịch phải chuyển sang trạng thái trung gian (ví dụ {{PENDING}} / {{UNKNOWN}}), tuyệt đối không tự động retry trừ tiền và không tự động hoàn tiền ngay. Quy trình đúng: giữ trạng thái chờ -> tra soát chủ động (inquiry) với đối tác bằng mã tham chiếu duy nhất -> cập nhật theo kết quả ({{SUCCESS}} / {{FAILED}}) -> chỉ hoàn/đảo bút khi có xác nhận thất bại. Toàn bộ phải idempotent.

### Timeout là gì và vì sao nguy hiểm
**Timeout** (hết thời gian chờ): bạn gửi yêu cầu HTTP/message sang Napas, sau N giây không nhận phản hồi. Ba khả năng thật sự có thể đã xảy ra:
1. Napas chưa nhận được yêu cầu -> tiền chưa trừ bên kia.
2. Napas đã xử lý thành công (tiền đã sang ngân hàng nhận) nhưng phản hồi bị rớt trên đường về.
3. Napas đang xử lý dở (rất hiếm, nhưng hệ thống phải tính tới).

Nếu bạn coi timeout = thất bại và cho khách gửi lại (hoặc tự retry tạo giao dịch mới), trường hợp (2) sẽ khiến người nhận được tiền 2 lần hoặc người gửi bị trừ 2 lần. Đây là lỗi nghiêm trọng nhất trong thanh toán.

### Máy trạng thái (state machine) giao dịch
~~~text
[INIT] --gui yeu cau--> [SENT]
[SENT] --nhan SUCCESS--> [SUCCESS] (ket thuc)
[SENT] --nhận FAILED--> [FAILED]  (kết thúc, xem xét hoàn tiền nếu đã hold)
[SENT] --timeout/loi mang--> [PENDING_UNKNOWN]
[PENDING_UNKNOWN] --inquiry: SUCCESS--> [SUCCESS]
[PENDING_UNKNOWN] --inquiry: FAILED--> [FAILED]
[PENDING_UNKNOWN] --inquiry: van UNKNOWN & qua han--> [REVERSAL_PENDING] --xac nhan dao--> [REVERSED]
~~~
**PENDING/UNKNOWN**: trạng thái "đang treo, chưa kết luận". Tiền bên gửi có thể đang bị **hold** (tạm giữ) — chưa trừ hẳn khỏi số dư khả dụng cho giao dịch khác, nhưng cũng chưa trả lại.

~~~seq
title: Chuyen khoan lien NH bi timeout va tra soat
actors: AppKhach | PaymentSvc | Napas | DoiTacNH
AppKhach -> PaymentSvc: chuyen 5.000.000 cho B
PaymentSvc -> PaymentSvc: tao tx_id duy nhat, hold tien A, trang thai SENT
PaymentSvc -> Napas: gui lenh chuyen (tx_id)
Napas -> DoiTacNH: ghi co cho B
DoiTacNH --> Napas: thanh cong
Napas --> PaymentSvc: timeout mat phan hoi
PaymentSvc -> PaymentSvc: chuyen trang thai PENDING_UNKNOWN
PaymentSvc --> AppKhach: "Đang xử lý, vui lòng chờ" (không báo lỗi)
PaymentSvc -> Napas: inquiry(tx_id) - tra soat
Napas --> PaymentSvc: ket qua SUCCESS
PaymentSvc -> PaymentSvc: cap nhat SUCCESS, chot tru tien A
PaymentSvc --> AppKhach: thong bao thanh cong
~~~

### Nguyên tắc xử lý
- **Không retry mù**: nếu phải gửi lại ở tầng kỹ thuật, phải dùng cùng {{tx_id}} và đối tác phải hỗ trợ idempotent (nhận lại cùng mã -> trả kết quả cũ, không xử lý hai lần).
- **Idempotency key** (khóa chống trùng): mã duy nhất gắn với *ý định* chuyển tiền của khách. Sinh ở phía bạn, gửi kèm sang Napas; lưu unique trong DB để chặn tạo giao dịch trùng khi khách bấm lại.
- **Inquiry/tra soát**: API hoặc quy trình hỏi đối tác trạng thái cuối của {{tx_id}}. Có lịch retry inquiry (ví dụ sau 30s, 2p, 10p...) và giới hạn thời gian chờ trước khi leo thang thủ công.
- **Hoàn tiền (reversal/refund)**: chỉ thực hiện khi có xác nhận {{FAILED}} từ đối tác hoặc sau quy trình tra soát chính thức kết luận không thành công. Hoàn bằng bút toán đảo trên sổ cái, ghi rõ tham chiếu giao dịch gốc.

~~~java
// Ví dụ ý tưởng: chặn trùng bằng unique constraint + kiểm tra trạng thái
@Transactional
public TransferResult createTransfer(String idempotencyKey, TransferCmd cmd) {
    // unique index trên idempotency_key đảm bảo 2 request đồng thời chỉ 1 cái insert được
    var existing = repo.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) return TransferResult.from(existing.get()); // trả kết quả cũ

    var tx = Transfer.pending(idempotencyKey, cmd); // trạng thái ban đầu
    repo.save(tx);           // lưu trước khi gọi ngoài
    try {
        var resp = napasClient.send(tx.getId(), cmd); // có timeout cấu hình
        tx.applyResponse(resp); // SUCCESS hoặc FAILED
    } catch (TimeoutException e) {
        tx.markPendingUnknown(); // KHÔNG coi là FAILED
    }
    repo.save(tx);
    return TransferResult.from(tx);
}
~~~

### Lỗi hay gặp
- Bắt {{Exception}} chung rồi set {{FAILED}} -> timeout bị xử lý như thất bại, gây đảo tiền sai.
- Cho phép khách bấm "Thử lại" tạo giao dịch mới thay vì tra cứu giao dịch cũ theo idempotency key.
- Không lưu request/response và {{tx_id}} đối tác trả về -> không tra soát được.
- Tự ý hoàn tiền sau N phút timeout mà chưa inquiry -> có thể hoàn nhầm khi đối tác đã xử lý thành công.
- {{PENDING_UNKNOWN}} treo vô hạn không có job quét/leo thang -> tiền khách bị giữ mãi.

### Ví dụ đời thực

Một ngân hàng số xử lý chuyển khoản liên ngân hàng qua Napas. Vào một ngày cao điểm (lương về), lượng giao dịch tăng 3 lần. Một khách chuyển 5 triệu VND lúc 21:00; request đến Napas nhưng mất phản hồi sau 10 giây (timeout). Hệ thống chuyển giao dịch sang trạng thái {{PENDING_UNKNOWN}}, tiền bị **hold** (tạm giữ) nhưng không tự động hoàn tiền, không tự động retry. App hiển thị "Đang xử lý, vui lòng chờ". Job inquiry tự động chạy theo lịch: sau 30s, 2p, 10p, 1h — lần thứ 2, Napas trả về {{SUCCESS}}: hệ thống cập nhật {{SUCCESS}}, trừ tiền người gửi, thông báo thành công. Một giao dịch khác timeout và inquiry không thành công sau 24 giờ: hệ thống hoàn tiền tự động theo quy trình reversal, người gửi không mất tiền. Kết quả đo được: 94% giao dịch timeout được chốt tự động trong vòng 2 giờ, không còn trường hợp trừ tiền hai lần; số dư khả dụng hiển thị đúng (khi hold thì giảm, khi hoàn thì tăng lại). Dev cũng thêm job quét định kỳ để giải phóng {{PENDING_UNKNOWN}} treo quá lâu, tránh tiền bị giữ mãi.

### Trả lời mẫu khi phỏng vấn

"Khi giao dịch liên ngân hàng bị timeout, điều cốt lõi là timeout không có nghĩa là thất bại — chỉ là chưa biết kết quả. Tôi thiết kế máy trạng thái: giao dịch chuyển sang {{PENDING_UNKNOWN}}, tiền bị hold (tạm giữ) nhưng không tự động retry hay hoàn tiền ngay. Hệ thống inquiry theo mã tham chiếu duy nhất với lịch retry (30s, 2p, 10p, 1h) và giới hạn thời gian; {{SUCCESS}} thì ghi nợ, {{FAILED}} thì hoàn tiền, quá hạn thì leo thang thủ công. Toàn bộ idempotent: retry cùng {{tx_id}} thì Napas trả kết quả cũ. Trong thực tế, với một ngân hàng số, 94% giao dịch timeout được chốt tự động trong 2 giờ, không còn hiện tượng trừ tiền hai lần. Quan trọng nhất là tiền thật an toàn hơn trải nghiệm nhanh — thà báo khách chờ còn hơn hoàn/ghi trùng sai."

> Senior tip: Hãy phân biệt rõ 3 khái niệm khi trả lời: **timeout** (không biết kết quả), **retry kỹ thuật** (gửi lại cùng idempotency key, an toàn nếu đối tác idempotent) và **retry nghiệp vụ** (tạo yêu cầu chuyển tiền mới — chỉ làm khi chắc chắn giao dịch cũ thất bại). Nhấn mạnh "tiền thật an toàn hơn trải nghiệm nhanh": thà báo khách chờ tra soát còn hơn hoàn/ghi trùng sai.
  `,
  follow: [
    'Idempotency được đảm bảo ở những tầng nào (client, API của bạn, Napas/đối tác, DB) và mỗi tầng làm gì?',
    'Bạn thiết kế job tra soát định kỳ cho các giao dịch PENDING_UNKNOWN như thế nào (tần suất, backoff, giới hạn, leo thang thủ công)?',
    'Khi đối tác xác nhận FAILED nhưng bạn đã trừ tiền/hold, luồng đảo bút (reversal) cần đảm bảo những gì?'
  ],
  tags: ['timeout', 'pending', 'tra soát', 'interbank', 'idempotency']
},
{
  id: 'banking-026',
  topic: 'banking',
  level: 'senior',
  q: 'Maker-checker (người tạo - người duyệt) và audit trail (nhật ký kiểm toán) được triển khai trong hệ thống ngân hàng như thế nào? Hãy mô tả mô hình dữ liệu, luồng duyệt và các nguyên tắc phân tách nhiệm vụ để ngăn gian lận.',
  a: `**Tóm tắt:** Maker-checker (4 mắt/dual control) yêu cầu một người tạo yêu cầu (maker) và một người khác phê duyệt (checker) trước khi hành động có hiệu lực — không ai được tự duyệt việc mình tạo. Audit trail là nhật ký bất biến ghi lại *ai làm gì, lúc nào, giá trị trước/sau, từ đâu*, phục vụ truy vết và tuân thủ. Triển khai cần: mô hình trạng thái yêu cầu, kiểm tra phân tách nhiệm vụ trong code, và log append-only không thể sửa/xóa.

### Vì sao cần maker-checker
Trong ngân hàng, một thao tác (sửa hạn mức, tạo tài khoản đặc biệt, phê duyệt hoàn tiền, thay đổi lãi suất) có thể gây thiệt hại lớn. **Segregation of duties** (phân tách nhiệm vụ): chia việc nhạy cảm cho nhiều người để một cá nhân không thể gian lận một mình. Ví dụ đời thường: người giữ chìa két và người biết mã két là hai người khác nhau. Maker-checker là hiện thực kỹ thuật của nguyên tắc này.

### Mô hình dữ liệu & luồng trạng thái
~~~text
ApprovalRequest:
  id, action_type (REFUND/CHANGE_LIMIT/...), payload_json (nội dung đề xuất)
  status: DRAFT -> PENDING_APPROVAL -> APPROVED -> APPLIED  (hoặc REJECTED / CANCELLED)
  maker_id, maker_at
  checker_id, checker_at, checker_comment
  applied_at, applied_by (thường là hệ thống/job sau khi APPROVED)
~~~
Nguyên tắc cốt lõi: **payload đề xuất** được lưu đóng băng; khi áp dụng, hệ thống dùng đúng payload đã duyệt, không dùng dữ liệu maker sửa lại sau.

~~~seq
title: Luong maker-checker duyet hoan tien
actors: Maker | HeThong | Checker | CoreLedger
Maker -> HeThong: tao yeu cau REFUND tx=TX9, so tien 1.000.000
HeThong -> HeThong: luu request status=PENDING_APPROVAL, maker_id=U1
Checker -> HeThong: xem chi tiet yeu cau
HeThong -> HeThong: kiem tra checker_id != maker_id
Checker -> HeThong: APPROVE (comment)
HeThong -> HeThong: status=APPROVED, checker_id=U2
HeThong -> CoreLedger: ap dung bút toán hoan theo payload da duyet
CoreLedger --> HeThong: tx hoan thanh cong, status=APPLIED
~~~

### Kiểm tra phân tách nhiệm vụ (SoD) trong code
~~~java
public void approve(long requestId, User checker, String comment) {
    var req = repo.findPending(requestId).orElseThrow();
    if (req.getMakerId().equals(checker.getId())) {
        throw new BusinessException("Maker không được tự duyệt yêu cầu của mình");
    }
    if (!checker.hasRole("APPROVER") || !checker.canApprove(req.getActionType(), req.getAmount())) {
        throw new AccessDeniedException("Khong du quyen duyet");
    }
    req.approve(checker.getId(), comment, Instant.now()); // ghi checker + thời điểm
    audit.log("APPROVE", checker, req.getId(), req.snapshot());
    repo.save(req);
}
~~~
Lưu ý thực tế: cần xử lý trường hợp maker sửa yêu cầu sau khi gửi -> sửa phải đưa trạng thái về {{PENDING_APPROVAL}} và (tùy chính sách) có thể yêu cầu duyệt lại; đồng thời checker không được duyệt bản đã thay đổi so với lúc mình xem.

### Audit trail (nhật ký kiểm toán)
**Audit trail**: bản ghi bất biến cho mỗi hành động nhạy cảm. Trường tối thiểu:
~~~text
audit_id, occurred_at, actor_id, actor_role, action,
resource_type, resource_id, before_json, after_json,
ip_address, user_agent, request_id/correlation_id, result (OK/DENY)
~~~
- **Bất biến**: chỉ append, không UPDATE/DELETE; quyền DB tách riêng; thường đẩy sang kho log riêng (WORM storage — Write Once Read Many: ghi một lần đọc nhiều, không cho sửa).
- **Correlation/request id**: mã gắn xuyên suốt một luồng để lần theo toàn bộ bước.
- **Trước/sau (before/after)**: biết chính xác trường nào đổi từ giá trị nào sang giá trị nào.

### Phân quyền và ngưỡng duyệt
- **RBAC** (Role-Based Access Control, phân quyền theo vai trò): vai trò MAKER, CHECKER, ADMIN tách biệt; admin hệ thống không đồng thời có quyền nghiệp vụ duyệt tiền.
- **Ngưỡng**: hoàn tiền < 5 triệu cần 1 checker, >= 5 triệu cần 2 checker (dual approval) hoặc cấp cao hơn.
- **Loại trừ xung đột**: cùng team/quan hệ trực tiếp có thể bị cấm duyệt chéo (tùy chính sách).

### Lỗi hay gặp
- Chỉ ẩn nút "Duyệt" trên UI nhưng API không kiểm tra {{maker_id != checker_id}} -> gọi API trực tiếp là vượt qua.
- Cho phép ADMIN có mọi quyền kể cả tự tạo tự duyệt -> phá vỡ SoD.
- Audit log ghi thiếu {{before/after}} hoặc ghi được đè/sửa -> mất giá trị pháp lý.
- Áp dụng thay đổi bằng cách đọc lại dữ liệu hiện tại thay vì payload đã duyệt -> maker sửa dữ liệu sau duyệt, checker duyệt một đằng áp dụng một nẻo.
- Không log cả hành động bị từ chối (DENY) -> bỏ sót dấu hiệu dò quyền/gian lận.

### Ví dụ đời thực

Một ngân hàng đang triển khai hệ thống maker-checker cho các giao dịch hoàn tiền (refund). Ban đầu hệ thống chỉ ẩn nút "Duyệt" trên UI nhưng API không kiểm tra maker_id != checker_id. Một nhân viên bộ phận chăm sóc khách hàng (đồng thời có vai trò maker và checker do config sai) đã tạo yêu cầu hoàn tiền 10 triệu cho một khách hàng thân thiết và tự duyệt — tiền bị hoàn nhầm. Sau khi phát hiện, đội dev sửa: (1) API kiểm tra bắt buộc maker_id != checker_id, (2) thêm ngưỡng — hoàn tiền dưới 5 triệu cần 1 checker, từ 5 triệu cần 2 checker hoặc cấp cao hơn, (3) log audit ghi đầy đủ before/after, (4) áp dụng đúng payload đã duyệt (không đọc lại dữ liệu hiện tại). Kết quả: sau 3 tháng, không còn giao dịch tự duyệt; audit trail giúp phát hiện 2 cố ý can thiệp trong quá khứ và đưa ra xử lý. Đội cũng thêm job báo cáo định kỳ: số yêu cầu đang chờ, số yêu cầu từ chối, và thời gian xử lý trung bình.

### Trả lời mẫu khi phỏng vấn

"Maker-checker trong hệ thống ngân hàng của tôi được triển khai ở 3 lớp. Lớp nghiệp vụ: mỗi yêu cầu nhạy cảm (hoàn tiền, sửa hạn mức, tạo tài khoản đặc biệt) có state machine DRAFT -> PENDING_APPROVAL -> APPROVED -> APPLIED; maker tạo, checker duyệt, và hệ thống bắt buộc maker_id != checker_id ở API — không tin UI. Lớp dữ liệu: payload đề xuất được lưu đóng băng, áp dụng đúng bản đã duyệt; audit trail ghi ai, lúc nào, hành động, resource, before/after, IP, request_id, và kết quả OK/DENY — lưu append-only, WORM, tách quyền DBA. Lớp hạ tầng: RBAC với vai trò MAKER, CHECKER, ADMIN tách biệt; ngưỡng số tiền quyết định số lượng checker; và mọi hành động từ chối cũng được log. Một ví dụ thực tế: trước đây chỉ ẩn nút duyệt trên UI, một nhân viên tự tạo tự duyệt hoàn tiền 10 triệu; sau khi thêm kiểm tra bắt buộc ở API và ngưỡng 2 checker cho số tiền trên 5 triệu, không còn hiện tượng tự duyệt và audit giúp phát hiện các cố ý can thiệp trong quá khứ."

> Senior tip: Nêu ba lớp bảo vệ khi phỏng vấn: (1) **nghiệp vụ** — state machine + SoD (maker != checker, đúng vai trò/ngưỡng), (2) **dữ liệu** — payload bất biến, áp dụng đúng bản đã duyệt, audit append-only, (3) **hạ tầng** — tách quyền DB/log, giám sát bất thường. Maker-checker không chỉ là "thêm nút duyệt", nó là ràng buộc toàn vẹn phải được cưỡng bức ở tầng service/API, không tin UI.
  `,
  follow: [
    'Nếu maker chỉnh sửa yêu cầu sau khi checker đã mở màn hình duyệt, hệ thống nên xử lý thế nào để checker không duyệt nhầm nội dung cũ?',
    'Thiết kế audit trail thế nào để đảm bảo tính bất biến (không ai sửa/xóa được), kể cả DBA?',
    'Khi nào cần nhiều hơn 2 cấp duyệt (multi-level approval) và ngưỡng phân cấp thường dựa trên tiêu chí nào?'
  ],
  tags: ['maker-checker', 'audit trail', 'SoD', 'approval', 'compliance']
},
{
  id: 'banking-027',
  topic: 'banking',
  level: 'senior',
  q: 'Trong hệ thống ngân hàng Việt Nam, bạn xử lý làm tròn tiền tệ với BigDecimal như thế nào? Hãy nói rõ RoundingMode, đặc thù VND không có phần thập phân, và bài toán chia phí phát sinh phần lẻ (tiền "lẻ đồng").',
  a: `**Tóm tắt:** Tiền phải dùng {{BigDecimal}} (hoặc số nguyên đơn vị nhỏ nhất), không dùng {{double/float}} vì nhị phân không biểu diễn chính xác thập phân ({{0.1 + 0.2 != 0.3}}). Chọn {{RoundingMode}} (quy tắc làm tròn) theo nghiệp vụ và phải nhất quán. VND (đồng Việt Nam) không có phần thập phân — mọi số tiền VND là số nguyên đồng. Khi chia phí/lãi cho nhiều bên, phép chia tạo phần dư ("lẻ đồng") phải được phân bổ có chủ đích để tổng các phần sau chia đúng bằng số tiền gốc.

### Vì sao không dùng double/float
{{double}} lưu theo chuẩn nhị phân (IEEE 754) nên nhiều số thập phân chỉ là xấp xỉ. Sai số nhỏ nhưng cộng dồn qua hàng triệu giao dịch thành chênh lệch tiền thật.
~~~java
System.out.println(0.1 + 0.2); // 0.30000000000000004
// Tiền: dùng BigDecimal, KHỞI TẠO TỪ STRING (không phải từ double)
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));   // 0.3 (chính xác)
// Sai: new BigDecimal(0.1) mang theo sai số của double
~~~

### RoundingMode — quy tắc làm tròn
**RoundingMode** (chế độ làm tròn): khi kết quả có nhiều chữ số hơn mức cho phép, làm tròn theo quy tắc nào.
~~~text
Mode           Ví dụ (làm tròn về 0 chữ số thập phân)   Ghi chú
-------------  ---------------------------------------  ------------------------------
HALF_UP        2.5 -> 3,  2.4 -> 2,  -2.5 -> -3         "Làm tròn toán học" thường gặp
HALF_EVEN      2.5 -> 2,  3.5 -> 4                      Banker's rounding, giảm thiên lệch cộng dồn
DOWN           2.9 -> 2, -2.9 -> -2                     Cắt về 0 (trunc)
FLOOR          2.9 -> 2, -2.9 -> -3                     Luôn về phía âm vô cùng
CEILING        2.1 -> 3, -2.9 -> -2                     Luôn về phía dương vô cùng
UNNECESSARY    ném lỗi nếu có phần phải làm tròn         Dùng để khẳng định "phải chia hết"
~~~
Chọn mode nào là quyết định nghiệp vụ: tính lãi tiết kiệm làm tròn có lợi/không lợi cho ai, quy định ra sao — phải thống nhất và ghi vào đặc tả. Phép {{divide}} trên {{BigDecimal}} *bắt buộc* chỉ định scale + roundingMode nếu có thể không chia hết, nếu không sẽ ném {{ArithmeticException}}.

~~~java
BigDecimal fee = new BigDecimal("10000");
BigDecimal three = new BigDecimal("3");
// 10000 / 3: phải chỉ định cách làm tròn
BigDecimal each = fee.divide(three, 0, RoundingMode.DOWN); // 3333 (VND, 0 chữ số thập phân)
~~~

### Đặc thù VND: không có phần thập phân
VND (đồng) không dùng xu/hào trong giao dịch điện tử thông thường — số tiền hợp lệ là số nguyên. Vì vậy:
- Lưu VND ở {{scale = 0}} hoặc dùng {{long}} đơn vị đồng.
- Làm tròn về 0 chữ số thập phân. Nhiều ngân hàng/merchant còn làm tròn đến bậc 100đ/1.000đ tùy nghiệp vụ (phải theo quy định).
- Khác với USD (2 chữ số thập phân, đơn vị cent) hay JPY (0). Nếu hệ thống đa tiền tệ, {{scale}} phụ thuộc loại tiền.
~~~java
// VND: scale 0
BigDecimal vnd = new BigDecimal("123456.78").setScale(0, RoundingMode.HALF_UP); // 123457
// Hoặc làm tròn bậc 1000đ
BigDecimal step = new BigDecimal("1000");
BigDecimal rounded = vnd.divide(step, 0, RoundingMode.HALF_UP).multiply(step); // 123000
~~~

### Bài toán chia phí/lãi phát sinh phần lẻ (remainder allocation)
Chia 10.000 VND phí cho 3 người: {{10000/3 = 3333}} dư {{1}} đồng. Nếu mỗi người trả 3333, tổng thu 9999 — mất 1 đồng (hoặc ngược lại thu thừa). Trong kế toán, 1 đồng cũng phải cân.

Cách xử lý: phân bổ phần dư có quy tắc, minh bạch, lặp lại được (deterministic):
~~~java
static List<BigDecimal> splitVnd(BigDecimal total, int parts) {
    BigDecimal[] div = total.divideAndRemainder(BigDecimal.valueOf(parts)); // [thương, dư]
    BigDecimal base = div[0].setScale(0, RoundingMode.DOWN); // mỗi phần cơ bản
    int remainder = div[1].intValueExact(); // số đồng dư (0 <= remainder < parts)
    List<BigDecimal> result = new ArrayList<>(parts);
    for (int i = 0; i < parts; i++) {
        // cộng 1 đồng vào các phần đầu tiên cho đến khi hết dư (quy tắc cố định)
        result.add(i < remainder ? base.add(BigDecimal.ONE) : base);
    }
    return result; // [3334, 3333, 3333], tổng = 10000
}
~~~
Quy tắc phân bổ (phần đầu nhận dư, hay phần lớn nhất nhận dư, hay theo thứ tự ID ổn định) phải được đặc tả và test — không được để "mỗi lần chạy một kiểu".

### Lỗi hay gặp
- Dùng {{double}} cho tiền hoặc {{new BigDecimal(0.1)}} (truyền double) -> nhiễm sai số.
- Gọi {{divide}} không truyền {{RoundingMode}} -> {{ArithmeticException}} khi chia không hết, lỗi production.
- So sánh {{BigDecimal}} bằng {{equals()}}: {{new BigDecimal("2.0").equals(new BigDecimal("2"))}} là {{false}} (khác scale) -> dùng {{compareTo() == 0}}.
- Làm tròn VND còn 2 chữ số thập phân hoặc quên đặc thù scale theo loại tiền.
- Chia phí bỏ quên phần dư -> sổ cái lệch, đối soát không khớp (break).
- Mỗi module tự chọn {{RoundingMode}} khác nhau -> cùng nghiệp vụ ra hai kết quả.

### Ví dụ đời thực

Một hệ thống ví điện tử đang tính phí giao dịch: mỗi giao dịch chuyển tiền bị trừ 10.000 VND phí, chia đều cho 3 đối tác thanh toán (nhà cung cấp cổng, đối tác tiếp thị, ngân hàng nhận). Code ban đầu dùng {{double}} và chia bằng phép chia không chỉ định RoundingMode: 10.000 / 3 = 3333.333... — mỗi đối tác nhận 3333, tổng thu 9999, mất 1 đồng. Đối chiếu cuối ngày phát hiện sổ cái lệch 1 đồng mỗi ngày, tích lũy sau 3 tháng là 90 đồng — nhỏ nhưng kiểm toán không chấp nhận. Dev sửa: dùng {{BigDecimal}} khởi tạo từ {{String}}, {{divideAndRemainder}} với {{RoundingMode.DOWN}}, phân bổ phần dư 1 đồng vào đối tác đầu tiên theo thứ tự cố định (quy tắc minh bạch, lặp lại được). Kết quả: phí chia đúng 10.000 mỗi lần, đối chiếu không còn lệch. Dev cũng thêm unit test với nhiều case (chia hết, dư 1, dư 2, số tiền lớn) và quy ước toàn hệ thống: mọi tiền dùng {{BigDecimal}} từ {{String}}, {{scale}} theo loại tiền (VND 0), {{RoundingMode}} thống nhất theo nghiệp vụ.

### Trả lời mẫu khi phỏng vấn

"Với tiền, tôi luôn dùng {{BigDecimal}} khởi tạo từ {{String}}, không bao giờ {{double}} hay {{new BigDecimal(0.1)}} vì nhị phân không biểu diễn chính xác thập phân — ví dụ 0.1 + 0.2 = 0.30000000000000004. {{RoundingMode}} là quy tắc làm tròn khi kết quả có quá nhiều chữ số; tôi chọn {{HALF_UP}} cho tính lãi (làm tròn học), {{HALF_EVEN}} (banker's rounding) khi cần giảm thiên lệch cộng dồn, và {{DOWN}} khi cắt phần dư. VND không có phần thập phân — mọi số tiền là số nguyên đồng — nên {{scale = 0}}, hoặc làm tròn bậc 100đ/1.000đ tùy nghiệp vụ. Khi chia phí cho nhiều bên, tôi dùng {{divideAndRemainder}} để lấy thương và dư, rồi phân bổ phần dư một cách xác định (ví dụ phần đầu nhận thêm) để tổng các phần bằng đúng số tiền gốc — không được để mỗi lần chạy một kiểu. Trong thực tế, một hệ thống ví dùng {{double}} bị mất 1 đồng mỗi ngày do chia phí; sau khi chuyển sang {{BigDecimal}} với quy tắc phân bổ cố định và thêm unit test, đối chiếu không còn lệch."

> Senior tip: Đặt ra quy ước toàn hệ thống ngay từ đầu: (1) kiểu tiền duy nhất ({{BigDecimal}} hoặc {{long}} minor unit) và cách khởi tạo (luôn từ {{String}}), (2) {{scale}} và {{RoundingMode}} cho từng loại nghiệp vụ (lãi, phí, thuế, hiển thị), (3) hàm chia/phân bổ phần dư dùng chung có unit test. Trong code review, coi mọi {{double}} chạm vào tiền là lỗi blocker.
  `,
  follow: [
    'Sự khác nhau giữa equals() và compareTo() trên BigDecimal là gì, và vì sao so sánh tiền phải dùng compareTo()?',
    'Khi nào dùng HALF_EVEN (banker\'s rounding) thay vì HALF_UP, và nó giải quyết vấn đề gì khi cộng dồn?',
    'Nếu hệ thống đa tiền tệ (VND scale 0, USD scale 2), bạn thiết kế lớp/value object Money như thế nào để tránh trộn scale?'
  ],
  tags: ['BigDecimal', 'RoundingMode', 'VND', 'currency', 'allocation']
},
{
  id: 'banking-028',
  topic: 'banking',
  level: 'senior',
  q: 'Batch EOD (End Of Day - xử lý cuối ngày) và cut-off time trong ngân hàng là gì? Bạn thiết kế batch EOD như thế nào để chạy đúng thứ tự, an toàn khi chạy lại (idempotent), và không làm hỏng dữ liệu nếu bị gián đoạn giữa chừng?',
  a: `**Tóm tắt:** **Cut-off time** là mốc giờ "chốt sổ" — giao dịch sau mốc này được hạch toán vào ngày nghiệp vụ hôm sau. **EOD (End Of Day)** là chuỗi batch job chạy sau cut-off để tổng hợp, tính lãi/phí, đối soát, chốt số dư, chuyển ngày nghiệp vụ. Thiết kế an toàn cần: phụ thuộc thứ tự rõ ràng, từng bước idempotent (chạy lại cho kết quả như chạy một lần), checkpoint để restart từ bước lỗi, và cô lập dữ liệu theo ngày nghiệp vụ.

### Cut-off time và ngày nghiệp vụ
**Cut-off time** (giờ chốt): mốc thời gian cố định. Ví dụ cut-off 23:00 — giao dịch 22:59 thuộc ngày nghiệp vụ T, giao dịch 23:01 thuộc T+1 (dù cùng ngày dương lịch). **Ngày nghiệp vụ** (business date) là "ngày sổ sách" của ngân hàng, khác với ngày giờ hệ thống. Nhiều kênh có cut-off khác nhau (chuyển khoản nội bộ, Napas, thẻ quốc tế) — đặc tả phải rõ từng loại.

Tại sao cần chốt? Tính lãi, báo cáo, đối soát phải tính trên một tập giao dịch *đóng* (không đổi). Nếu vừa tính vừa có giao dịch mới chen vào, số liệu không nhất quán.

### EOD thường gồm những bước nào
~~~text
1. Pre-check   : xác nhận các batch/luồng online đã dừng nhận giao dịch ngày T, hàng đợi đã xả
2. Posting     : hạch toán nốt giao dịch treo hợp lệ của ngày T
3. Interest/Fee: tính lãi, phí theo số dư/ngày nghiệp vụ T
4. Reconcile   : đối soát với Napas/đối tác (xem banking-024)
5. GL/Balance  : tổng hợp sổ cái, chốt số dư cuối ngày (closing balance)
6. Reporting   : sinh báo cáo quản trị/tuân thủ
7. Date switch : mở ngày nghiệp vụ T+1, cập nhật cut-off
~~~
Các bước có **phụ thuộc** (dependency): (5) cần (3) xong; (7) chỉ chạy khi (1)-(6) thành công. Đây là một **DAG** (Directed Acyclic Graph — đồ thị có hướng không vòng) các job.

### Thiết kế an toàn: idempotent + checkpoint
**Idempotent** (lũy đẳng): thực hiện nhiều lần cho cùng kết quả như một lần. Batch EOD *chắc chắn* sẽ có lúc cần chạy lại (lỗi mạng, DB chết, job timeout giữa chừng) — nếu chạy lại mà tính lãi lần 2, khách được cộng lãi kép, thảm họa.

Kỹ thuật:
- **Đánh dấu theo ngày nghiệp vụ**: mỗi bút tính lãi/phí gắn {{business_date=T}} và khóa nghiệp vụ (account+type+T). Trước khi ghi, kiểm tra đã tồn tại chưa ({{INSERT ... ON CONFLICT DO NOTHING}} hoặc kiểm tra unique key) -> chạy lại không tạo bút trùng.
- **Checkpoint/bước trạng thái**: lưu {{eod_run(date=T, step=INTEREST, status=DONE)}}. Khi restart, đọc bước DONE cuối cùng và chạy tiếp bước sau, không chạy lại từ đầu những bước đã hoàn tất (trừ khi bước tự idempotent).
- **Phạm vi dữ liệu rõ**: job chỉ xử lý giao dịch có {{business_date = T}}. Dùng snapshot/cờ chốt để tập dữ liệu không đổi trong suốt lần chạy.
- **Chạy trong đơn vị an toàn**: xử lý theo lô (chunk) tài khoản; mỗi chunk một transaction hoặc có cơ chế bù trừ; ghi log tiến độ để biết chunk nào đã xong.

~~~java
// Ý tưởng: bước tính lãi idempotent theo (account, businessDate)
public void accrueInterest(LocalDate bizDate, String accountId) {
    String key = accountId + "|INTEREST|" + bizDate; // khóa nghiệp vụ duy nhất
    if (ledgerRepo.existsByBusinessKey(key)) return;  // đã chạy -> bỏ qua (idempotent)
    BigDecimal interest = calcInterest(accountId, bizDate);
    ledgerRepo.appendEntry(key, accountId, "CREDIT", interest, bizDate); // append-only
}
~~~

### Cut-off và giao dịch "nằm giữa"
- Giao dịch nhận lúc 23:00:01 (sau cut-off) -> gắn {{business_date = T+1}}, không đưa vào EOD của T.
- Giao dịch đang chờ phản hồi Napas lúc cut-off -> thường vẫn thuộc ngày gửi (T) nhưng trạng thái {{PENDING}}; EOD phải có bước xử lý/đánh dấu các giao dịch treo để đối soát hôm sau (liên hệ banking-025).

### Lỗi hay gặp
- Batch không idempotent: chạy lại tính lãi/phí lần 2 -> trùng bút toán, sai số dư.
- Không có checkpoint: lỗi ở bước 5/7 phải chạy lại từ đầu, vừa lâu vừa rủi ro nếu bước đầu không idempotent.
- Dùng giờ hệ thống thay vì ngày nghiệp vụ -> lệch khi chạy qua nửa đêm hoặc khi job bị hoãn.
- Nhiều node cùng chạy EOD cho cùng ngày -> tranh chấp, trùng dữ liệu; cần cơ chế **distributed lock** (khóa phân tán: chỉ một node giữ khóa được chạy) theo {{business_date}}.
- Chuyển ngày nghiệp vụ (bước 7) trước khi các bước trước xác nhận xong -> ngày mới mở trong khi số liệu ngày cũ chưa chốt.

### Ví dụ đời thực

Một ngân hàng chạy EOD hàng đêm với 7 bước. Đêm nào cũng vậy, nhưng một ngày job bị lỗi ở bước 5 (GL/Balance) sau khi đã tính lãi xong — team phải chạy lại từ đầu, và vì bước tính lãi không idempotent, khách được cộng lãi kép. Sau khi phát hiện, dev sửa: (1) mỗi bút toán tính lãi gắn khóa nghiệp vụ {{(account, INTEREST, business_date)}} và kiểm tra tồn tại trước khi ghi ({{INSERT ... ON CONFLICT DO NOTHING}}) — chạy lại không tạo bút trùng; (2) thêm checkpoint {{eod_run(date=T, step=INTEREST, status=DONE)}}; khi restart, đọc bước DONE cuối cùng và chạy tiếp bước sau; (3) distributed lock theo {{business_date}} để nhiều node không cùng chạy. Kết quả: sau khi fix, job có thể restart từ bất kỳ bước nào mà không gây trùng; thời gian EOD giảm từ 6 tiếng xuống 3 tiếng. Dev cũng thêm monitoring: báo alert nếu EOD chưa hoàn thành trước 3h sáng hoặc số bút toán ngày T khác ngày T-1 quá 20%.

### Trả lời mẫu khi phỏng vấn

"EOD của tôi được thiết kế với tư duy 'giả định job sẽ chết giữa chừng và sẽ bị chạy lại'. Cut-off time là mốc chốt——giao dịch sau mốc được gán vào ngày nghiệp vụ tiếp theo——và được tách khỏi EOD batch. EOD gồm 7 bước có thứ tự (pre-check, posting, interest/fee, reconcile, GL/balance, reporting, date switch), là một DAG với phụ thuộc rõ ràng. An toàn khi chạy lại nhờ 3 kỹ thuật: (1) mỗi bút toán gắn khóa nghiệp vụ {{(account, type, business_date)}} và kiểm tra tồn tại trước khi ghi——idempotent; (2) checkpoint lưu trạng thái từng bước, restart thì chạy tiếp từ bước chưa xong; (3) distributed lock theo {{business_date}} để nhiều node không cùng chạy. Cut-off logic tách biệt: EOD chỉ xử lý tập đã chốt. Kết quả thực tế: một ngân hàng sau khi áp dụng có thể restart từ bất kỳ bước nào mà không gây trùng lãi, thời gian EOD giảm từ 6 tiếng xuống 3 tiếng."

> Senior tip: Hãy nói về EOD theo tư duy "thiết kế cho sự cố": **giả định job sẽ chết giữa chừng và sẽ bị chạy lại**. Khi đó idempotency + checkpoint + khóa nghiệp vụ theo ngày là bắt buộc, không phải tối ưu. Nêu thêm: tách **cut-off logic** (gắn ngày nghiệp vụ) khỏi EOD batch — cut-off là quyết định tại thời điểm nhận giao dịch, EOD chỉ xử lý tập đã chốt. Hai thứ trộn lẫn là nguồn gốc lỗi ngày hạch toán.
  `,
  follow: [
    'Distributed lock cho job EOD theo business_date nên dùng công cụ/cơ chế nào và xử lý thế nào khi node giữ khóa bị chết (lock bị kẹt)?',
    'Bạn giám sát (monitoring/alert) EOD ra sao: những chỉ số hoặc điều kiện nào báo "EOD hôm nay có vấn đề"?',
    'Nếu một bước EOD chạy xong một nửa (đã ghi một phần bút toán) rồi lỗi, idempotency đảm bảo chạy lại không trùng như thế nào ở mức chi tiết?'
  ],
  tags: ['EOD', 'cut-off', 'batch', 'idempotency', 'business date']
},
{
  id: 'banking-029',
  topic: 'banking',
  level: 'lead',
  q: 'ISO 20022 là gì và khi tích hợp ngân hàng/đối tác, bạn chuẩn hóa thông điệp (message) như thế nào? Hãy nêu các nhóm thông điệp thường gặp (pain/pacs/camt), thách thức ánh xạ dữ liệu từ hệ thống cũ, và chiến lược chuyển đổi.',
  a: `**Tóm tắt:** **ISO 20022** là chuẩn quốc tế về định dạng thông điệp tài chính dựa trên XML (và có bản JSON/ASN.1), dùng mô hình dữ liệu chung và từ điển nghiệp vụ thống nhất, thay thế dần các chuẩn cũ/cục bộ (như MT trong SWIFT, nhiều định dạng nội địa riêng). Tích hợp thực tế là bài toán *ánh xạ và chuẩn hóa*: chuyển dữ liệu hệ thống lõi (core) sang cấu trúc ISO 20022 ({{pain/pacs/camt}}) và ngược lại, xử lý khác biệt ngữ nghĩa, độ dài trường, mã tham chiếu. Chiến lược an toàn: lớp chuyển đổi (adapter/canonical model), chạy song song, kiểm chứng bằng đối soát.

### ISO 20022 là gì (giải thích cho người mới)
**ISO 20022**: bộ tiêu chuẩn mô tả cách trao đổi dữ liệu điện tử trong tài chính. Thay vì mỗi bên tự nghĩ ra định dạng, chuẩn định nghĩa: (1) *từ điển dữ liệu* (tên, ý nghĩa, kiểu của từng thành phần như số tiền, tài khoản, tên người trả) và (2) *thông điệp* (message) cho từng nghiệp vụ, biểu diễn bằng XML Schema (XSD). Ví dụ đời thường: thay vì mỗi công ty gửi hóa đơn một kiểu, mọi người thống nhất một mẫu chung để máy đọc được.

So với chuẩn cũ (như SWIFT MT, dạng text dòng cố định): ISO 20022 giàu ngữ nghĩa hơn, có cấu trúc rõ, mang được nhiều thông tin (mã mục đích, thông tin người thụ hưởng chi tiết) — hỗ trợ tốt hơn chống rửa tiền (AML) và tự động hóa.

### Các nhóm thông điệp thường gặp
Tên thông điệp dạng {{xxxx.nnn.nnn}} (4 chữ cái + phiên bản):
~~~text
Nhóm   Tên đầy đủ (ý nghĩa)         Ví dụ hay gặp                        Dùng khi
-----  ---------------------------  -----------------------------------  -----------------------------
pain   Payments Initiation          pain.001 (Customer Credit Transfer   Khởi tạo lệnh chuyển tiền từ KH/doanh nghiệp
                                    Initiation)
pacs   Payments Clearing&Settlement pacs.008 (FI to FI Customer Credit   Chuyển tiền giữa các tổ chức tài chính
                                    Transfer), pacs.002 (Status Report)  (clearing/settlement), báo trạng thái
camt   Cash Management             camt.053 (Bank to Customer           Sao kê, báo cáo số dư, thông báo biến động
                                    Statement), camt.054 (Debit/Credit
                                    Notification)
~~~
- **Clearing** (bù trừ): tính toán ròng các nghĩa vụ giữa các bên. **Settlement** (quyết toán): chuyển tiền thật để tất toán.
- Napas và các hệ thống thanh toán hiện đại dần chuyển sang ISO 20022 (đặc biệt chuyển khoản nhanh), nên tích hợp mới thường chạm nhóm {{pacs/pain/camt}}.

### Bài toán chuẩn hóa/ánh xạ (mapping)
Hệ thống lõi (core) lưu tài khoản, tên, số dư theo mô hình riêng; đối tác yêu cầu ISO 20022. Bạn cần lớp **mapping/adapter**:
~~~text
Core model  --(map)-->  Canonical/ISO 20022 model  --(serialize)-->  XML gửi đối tác
Core model  <--(map)--  Canonical/ISO 20022 model  <--(parse)-----   XML nhận về
~~~
**Canonical model** (mô hình chuẩn nội bộ): biểu diễn trung gian theo ngữ nghĩa nghiệp vụ của bạn; giúp không phải map N hệ thống x N hệ thống trực tiếp.

Thách thức thực tế:
- **Ngữ nghĩa khác nhau**: mã trạng thái nội bộ {{SUCCESS/FAIL}} phải map sang mã trạng thái ISO 20022 (ví dụ trong {{pacs.002}}: {{ACCP}}, {{ACSC}}, {{RJCT}} kèm reason code) — sai mapping là báo sai kết quả tiền.
- **Độ dài/định dạng trường**: tên người thụ hưởng core cho 200 ký tự, message chỉ nhận 140; ký tự có dấu/đặc biệt; địa chỉ cấu trúc vs chuỗi tự do.
- **Mã tham chiếu**: ISO 20022 có nhiều loại id ({{MsgId}}, {{InstrId}}, {{EndToEndId}}, {{TxId}}, {{UETR}}). Phải chọn/giữ ổn định cái dùng để đối soát và tra soát (liên hệ banking-024/025).
- **Tiền tệ và số tiền**: số thập phân, loại tiền (VND scale 0 — banking-027) phải đúng quy định message.
- **Bắt buộc/tuỳ chọn**: trường đối tác bắt buộc nhưng core không có -> phải có quy tắc điền mặc định hoặc từ chối giao dịch từ đầu.

~~~seq
title: Luong tich hop gui pacs.008 qua lop chuan hoa
actors: CoreBank | Adapter | DoiTac
CoreBank -> Adapter: lenh chuyen tien (model noi bo)
Adapter -> Adapter: validate + map sang cau truc ISO 20022
Adapter -> Adapter: gan EndToEndId/TxId de truy vet
Adapter -> DoiTac: gui pacs.008 XML
DoiTac --> Adapter: pacs.002 status (ACSC/RJCT)
Adapter -> Adapter: map status + reason code ve model noi bo
Adapter --> CoreBank: cap nhat trang thai giao dich
~~~

### Chiến lược chuyển đổi (migration) an toàn
- **Adapter/anti-corruption layer**: cô lập chuẩn ISO 20022 ở một lớp, không để cấu trúc XML rò rỉ khắp core.
- **Chạy song song (parallel run)**: gửi/nhận cả kênh cũ và mới (nếu có), so khớp kết quả trước khi cắt hẳn.
- **Contract & validation**: validate XML theo XSD + rule nghiệp vụ; test với bộ case của đối tác (certification/sandbox).
- **Phiên bản (variant)**: ISO 20022 có nhiều phiên bản và "profile" nội địa — khóa đúng version/profile đối tác yêu cầu, quản lý như một contract có version.
- **Quan sát & đối soát**: log message id, lưu bản tin (đã che dữ liệu nhạy cảm), đối soát hằng ngày để phát hiện map sai.

### Lỗi hay gặp
- Map trường "gần giống" mà khác ngữ nghĩa (ngày tạo vs ngày giá trị, trạng thái accepted vs settled) -> nghiệp vụ sai.
- Sinh {{EndToEndId}} mới mỗi lần retry -> mất khả năng đối soát/tra soát; mã truy vết phải ổn định theo giao dịch gốc.
- Không xử lý reason code khi {{RJCT}} (bị từ chối) -> chỉ biết "lỗi" mà không biết lý do (sai tài khoản, vượt hạn mức...).
- Hard-code mapping rải rác -> khó thay đổi khi đối tác nâng phiên bản.

> ### Ví dụ đời thực

Một ngân hàng cần gửi file chuyển tiền sang đối tác theo chuẩn ISO 20022 (pacs.008). Ban đầu mapping thủ công bằng Excel: mỗi tháng mất 2 ngày để đối chiếu field, và 3 lần sai field (ngày tạo vs ngày giá trị, trạng thái accepted vs settled) gây đối tác từ chối giao dịch. Dev triển khai: (1) lớp canonical model trung gian, (2) adapter map core -> ISO 20022 và parse XML về lại, (3) validate theo XSD + rule nghiệp vụ, (4) giữ EndToEndId ổn định theo giao dịch gốc (tạo một lần, không sinh lại khi retry), (5) log message id + bản tin đã che dữ liệu nhạy cảm, (6) parallel run 2 tháng: gửi cả kênh cũ và ISO 20022, so khớp kết quả. Kết quả: thời gian mapping giảm từ 2 ngày xuống 2 giờ, không còn giao dịch bị từ chối do field sai; khi đối tác nâng phiên bản profile, chỉ sửa adapter, không core. Đội cũng thêm đối chiếu hằng ngày để phát hiện map sai sớm.

### Trả lời mẫu khi phỏng vấn

"Khi tích hợp với đối tác theo ISO 20022, tôi luôn thiết kế một lớp canonical model trung gian và adapter——không để cấu trúc XML rò rỉ vào core. Canonical model biểu diễn trung gian theo ngữ nghĩa nghiệp vụ, giúp không phải map N hệ thống x N hệ thống trực tiếp. Adapter làm 3 việc: validate XML theo XSD, map field core <-> ISO 20022, và giữ các mã tham chiếu (EndToEndId, TxId) ổn định theo giao dịch gốc——đây là chìa khóa cho idempotency, đối chiếu và tra cứu. Ba thách thức thường gặp: ngữ nghĩa khác nhau (ngày tạo vs ngày giá trị, accepted vs settled), độ dài field (tên 200 ký tự nhưng message chỉ nhận 140), và reason code khi RJCT——phải xử lý từng loại. Chiến lược an toàn: parallel run với kênh cũ, so khớp kết quả trước khi cutover; log message id và đối chiếu hằng ngày. Luôn hỏi đối tác: profile/phiên bản nào, trường nào bắt buộc, reason code set nào — đừng suy đoán."

> Senior tip: Ở góc lead, nhấn mạnh đây là bài toán **quản lý biên** (boundary) và **ngữ nghĩa dữ liệu**, không chỉ là "parse XML". Ba điểm ăn điểm: (1) canonical model + adapter để cô lập thay đổi, (2) mã tham chiếu end-to-end ổn định để idempotency/đối chiếu/tra khảo, (3) parallel run + đối chiếu trước khi cutover.
  `,
  follow: [
    'EndToEndId, TxId, MsgId trong ISO 20022 khác nhau thế nào và bạn chọn mã nào làm khóa đối soát/tra soát với đối tác?',
    'Làm sao thiết kế lớp adapter để thêm một đối tác/kênh thanh toán mới mà không sửa core nghiệp vụ?',
    'Khi chạy song song kênh cũ và ISO 20022, bạn phát hiện hai kênh ra kết quả khác nhau cho cùng giao dịch — quy trình xử lý thế nào?'
  ],
  tags: ['ISO 20022', 'pain.001', 'pacs.008', 'camt.053', 'mapping', 'integration']
},
{
  id: 'banking-030',
  topic: 'banking',
  level: 'lead',
  q: 'Thiết kế hạn mức giao dịch theo ngày (daily limit) cho ngân hàng số như thế nào để chịu được truy cập đồng thời (concurrent), không cho vượt hạn mức kể cả khi nhiều giao dịch cùng lúc, và vẫn đảm bảo hiệu năng?',
  a: `**Tóm tắt:** Hạn mức theo ngày (daily limit) yêu cầu: tổng giao dịch của khách trong một ngày nghiệp vụ không vượt ngưỡng (ví dụ 500 triệu/ngày). Thách thức là **concurrency**: nhiều yêu cầu đồng thời đọc cùng "đã dùng bao nhiêu" và cùng thấy "còn đủ", dẫn đến vượt hạn. Giải pháp: cập nhật hạn mức bằng thao tác *nguyên tử* (atomic) gắn với quyết định chấp nhận (check-and-reserve trong một bước), dùng DB atomic update/khóa phù hợp hoặc bộ đếm tập trung (Redis atomic), cộng với idempotency để retry không trừ hạn mức hai lần.

### Bài toán và vì sao "đọc rồi ghi" bị lỗi
Giả sử hạn mức 10.000.000 VND/ngày, đã dùng 9.000.000, còn 1.000.000. Hai giao dịch 800.000 chạy đồng thời:
~~~text
T1: đọc đã dùng = 9.000.000 -> còn 1.000.000 >= 800.000 -> CHẤP NHẬN
T2: đọc đã dùng = 9.000.000 -> còn 1.000.000 >= 800.000 -> CHẤP NHẬN  (cùng lúc!)
Kết quả: tổng dùng 10.600.000 > 10.000.000 -> VƯỢT HẠN MỨC
~~~
Đây là race condition kinh điển (giống banking-023). Với traffic cao (mở sale, lương về), xác suất xảy ra lớn.

### Mô hình dữ liệu cơ bản
~~~text
daily_limit_usage:
  customer_id, business_date, limit_type (TRANSFER/EWALLET/TOTAL)
  limit_amount   (hạn mức, có thể snapshot theo ngày vì hạn mức có thể đổi)
  used_amount    (đã dùng)
  reserved_amount (đang giữ chỗ cho giao dịch PENDING)  -- tùy thiết kế
  updated_at, version
Ràng buộc nghiệp vụ: used_amount + reserved_amount + amount_moi <= limit_amount
~~~
Lưu theo {{(customer_id, business_date, limit_type)}} với unique constraint. {{business_date}} lấy theo quy tắc cut-off (banking-028), không lấy ngày giờ server mù quáng.

### Cách 1 — Atomic update trong DB (phổ biến, nhất quán mạnh)
Thực hiện kiểm tra và trừ trong *một câu lệnh* để DB đảm bảo nguyên tử:
~~~sql
-- Chỉ cập nhật nếu còn đủ hạn mức (check-and-set nguyên tử)
UPDATE daily_limit_usage
SET used_amount = used_amount + :amount, updated_at = now(), version = version + 1
WHERE customer_id = :cid AND business_date = :bdate AND limit_type = :type
  AND (used_amount + reserved_amount + :amount) <= limit_amount;

-- Kiểm tra số dòng bị ảnh hưởng: 1 = thành công (đã giữ chỗ), 0 = vượt hạn mức -> từ chối
~~~
~~~java
int rows = jdbc.update(ATOMIC_RESERVE_SQL, amount, cid, bdate, type, amount);
if (rows == 0) throw new LimitExceededException("Vuot han muc ngay");
~~~
Ưu điểm: nhất quán (consistent) với DB giao dịch; không cần hạ tầng thêm. Lưu ý: đặt index đúng; nếu một khách cực "nóng" có thể thành điểm nghẽn (lock/contend trên một dòng) — chấp nhận được vì hạn mức là theo từng khách.

### Cách 2 — Khóa bi quan trên dòng hạn mức
{{SELECT ... FOR UPDATE}} dòng {{daily_limit_usage}} của khách, tính toán, rồi UPDATE trong cùng DB transaction. An toàn, dễ hiểu, nhưng giảm song song cho cùng một khách (các giao dịch của khách đó xếp hàng). Phù hợp traffic vừa phải.

### Cách 3 — Bộ đếm nguyên tử tập trung (Redis) cho traffic rất cao
Dùng Redis {{INCRBY}}/Lua script để check-and-increment nguyên tử, phản hồi cực nhanh; định kỳ/đồng bộ về DB để đối soát và bền vững.
~~~text
Lua (chạy nguyên tử trên Redis):
  current = GET key(cid,bdate,type) hoặc 0
  if current + amount <= limit then current = current + amount; SET key current; return OK
  else return EXCEEDED
~~~
Rủi ro: Redis là bộ nhớ; cần chiến lược bền vững (persistence), xử lý mất dữ liệu (fail-open hay fail-close — ngân hàng thường chọn *fail-close*: không chắc còn hạn mức thì từ chối, an toàn hơn vượt hạn), và cơ chế đối soát DB. Phức tạp hơn, chỉ dùng khi đo được DB không đáp ứng.

### Idempotency và vòng đời giữ chỗ
- Mỗi yêu cầu giao dịch có {{idempotency_key}}. Nếu client retry cùng key, phải trả kết quả cũ và **không trừ hạn mức lần 2**. Cách làm: lưu mapping {{idempotency_key -> tx_id, amount_reserved}}; kiểm tra trước khi reserve.
- Giao dịch {{PENDING}}: đã reserve hạn mức. {{SUCCESS}} -> chuyển reserved thành used (hoặc xác nhận). {{FAILED/REVERSED}} -> trả lại (giảm reserved/used). Nếu {{PENDING}} treo quá lâu (timeout tra soát, banking-025), cần job giải phóng có kiểm soát.
- Reset theo ngày: khi sang {{business_date}} mới, bản ghi ngày mới {{used=0}} (tạo lười khi giao dịch đầu tiên đến, dùng {{INSERT ... ON CONFLICT DO NOTHING}}).

~~~seq
title: Reserve han muc ngay (atomic, chong vuot)
actors: App | LimitService | DB | PaymentSvc
App -> LimitService: chuyen 800000 (idempo_key=K1)
LimitService -> DB: kiểm tra idempo_key K1 đã xử lý?
DB --> LimitService: chua
LimitService -> DB: UPDATE ... SET used=used+800000 WHERE used+800000<=limit
DB --> LimitService: 1 row (OK) hoac 0 row (vuot)
LimitService -> PaymentSvc: OK -> tiep tuc chuyen tien
LimitService --> App: thanh cong hoac tu choi "vuot han muc ngay"
~~~

### Lỗi hay gặp
- Check-then-act tách rời (đọc {{used}} ở app, so sánh, rồi UPDATE cộng thêm) -> race condition vượt hạn.
- Retry không idempotent -> mỗi lần retry trừ thêm hạn mức, khách bị khóa oan.
- Dùng ngày dương lịch thay vì {{business_date}}/cut-off -> lệch với sổ sách, sai ngay thời điểm giao cắt ngày.
- Reserve khi gửi nhưng quên trả lại khi {{FAILED/TIMEOUT}} xác nhận thất bại -> hạn mức bị "kẹt".
- Chọn Redis nhưng không có đối soát về DB và không định nghĩa hành vi khi Redis lỗi -> mất tiền hoặc chặn oan không kiểm soát.

> Senior tip: Với bài toán này, câu trả lời lead cần cân bằng *đúng nghiệp vụ* và *khả năng mở rộng*: bắt đầu từ atomic update trong DB (đúng, đơn giản, đủ cho đa số trường hợp vì tranh chấp theo từng khách), chỉ đưa Redis/Lua khi có số liệu chứng minh nút thắt. Nhấn mạnh 3 bất biến: (1) quyết định chấp nhận và trừ hạn mức phải nguyên tử, (2) mọi bước có idempotency key, (3) mọi trạng thái trung gian (PENDING/reserved) đều có đường ra (commit hoặc release). Hỏi ngược interviewer: hạn mức tính theo ngày nghiệp vụ hay ngày lịch, có loại hạn mức nào cộng dồn (tổng + theo kênh) không — vì nó quyết định mô hình dữ liệu.
  `,
  follow: [
    'Nếu một khách có nhiều loại hạn mức cộng dồn (tổng ngày + hạn mức theo kênh + hạn mức theo thụ hưởng mới), bạn đảm bảo cập nhật tất cả nguyên tử thế nào?',
    'Khi giao dịch bị timeout (PENDING_UNKNOWN), bạn giữ reserved hạn mức bao lâu và cơ chế nào giải phóng an toàn mà không mở khe vượt hạn?',
    'So sánh trade-off giữa atomic DB update và Redis Lua cho bài toán này: ngưỡng nào thì chuyển giải pháp và bạn kiểm chứng ra sao?'
  ],
  tags: ['daily limit', 'concurrency', 'atomic', 'idempotency', 'Redis']
},
{
  id: 'banking-031',
  topic: 'banking',
  level: 'senior',
  q: 'Số dư khả dụng (available balance) và số dư sổ sách (ledger balance) khác nhau thế nào, hold/authorization là gì và giải phóng hold ra sao?',
  a: `**Tóm tắt:** Số dư sổ sách (ledger balance) là tổng tiền thực sự đã ghi vào sổ cái của tài khoản. Số dư khả dụng (available balance) là số tiền khách thực sự có thể dùng ngay, bằng số dư sổ sách trừ các khoản đang bị giữ (hold). Hold là số tiền bị khóa tạm thời — ví dụ khi thanh toán thẻ hoặc chuyển tiền chưa xong — để tránh chi tiêu hai lần. Giải phóng hold khi giao dịch hoàn tất (capture), hủy (void) hoặc hết hạn, tiền trả về khả dụng.

### Số dư sổ sách là gì
Số dư sổ sách là con số trên sổ cái (sổ chốt mọi biến động tiền) của tài khoản. Mỗi giao dịch thành công — nạp, rút, chuyển — sẽ cộng hoặc trừ một dòng trên sổ, và số dư sổ sách cập nhật theo ngay.
Ví dụ: tài khoản khách A có 10.000.000 VND trên sổ sách. A rút 2.000.000 VND qua ATM -> sổ ghi trừ -> số dư sổ sách thành 8.000.000 VND. Đây là con số kế toán dùng để đối soát cuối ngày.
Số dư sổ sách phản ánh "tiền thực sự đã đi hay còn lại", nhưng chưa nói rõ "tiền khách được dùng ngay bao nhiêu" nếu có khoản đang bị giữ.

### Số dư khả dụng là gì
Số dư khả dụng = số dư sổ sách - tổng các khoản đang bị hold - các giao dịch đang xử lý chưa chốt. Đây là số hệ thống phải kiểm tra trước khi cho phép khách rút hoặc chuyển tiền.
Vì sao không dùng số dư sổ sách để quyết định cho chi tiêu? Vì có tiền trên sổ nhưng tiền đó đang được "đặt cọc" cho một giao dịch khác. Nếu cho dùng, khách sẽ chi tiêu hai lần cùng một khoản tiền.
Ví dụ: tài khoản có 10.000.000 VND sổ sách. Khách dùng thẻ mua hàng 2.000.000 VND, ngân hàng đặt hold 2.000.000 VND. Số dư sổ sách vẫn là 10.000.000 (tiền chưa thực sự rời tài khoản), nhưng số dư khả dụng chỉ còn 8.000.000. Nếu khách cố rút 9.000.000, hệ thống phải từ chối vì khả dụng chỉ còn 8.000.000.

| | Số dư sổ sách | Số dư khả dụng |
|---|---|---|
| Ý nghĩa | Tổng tiền thực sự ghi trên sổ cái | Tiền khách có thể dùng ngay |
| Có tính hold không | Không | Có (trừ các khoản hold) |
| Dùng để làm gì | Đối soát kế toán, báo cáo | Quyết định cho phép rút/chuyển tiền |

### Hold / authorization là gì
Hold (khóa tiền) là số tiền bị tạm khóa trên tài khoản, chưa được trừ thật vào sổ cái nhưng đã không thể dùng cho giao dịch khác. Nó xảy ra khi:
- Thanh toán thẻ: ngân hàng khóa số tiền giao dịch để đảm bảo tiền còn đủ khi cửa hàng (merchant) gửi yêu cầu trừ tiền thật sau này.
- Chuyển tiền chưa hoàn tất: tiền bị khóa cho đến khi đối tác xác nhận đã nhận.
- Phí, tiền đặt cọc, tiền bảo lãnh.

Mỗi hold thường có thời hạn (ví dụ 7 ngày đối với giao dịch thẻ). Nếu merchant không gửi yêu cầu trừ tiền trong thời hạn, hệ thống tự giải phóng hold và tiền trở lại khả dụng.

~~~seq
title: Hold khi thanh toán the
actors: Khach | Merchant | Acquirer | Network | Issuer
Khach -> Merchant: quet the, mua 2 trieu
Merchant -> Acquirer: yeu cau authorization 2 trieu
Acquirer -> Network: chuyen yeu cau den issuer
Network -> Issuer: kiem tra the va han muc
Issuer -> Issuer: hold 2 trieu tren han muc
Issuer --> Network: chap thue, ma auth
Network --> Acquirer: chap thue
Acquirer --> Merchant: thanh cong, in hoa don
~~~

### Giải phóng hold ra sao
1. Giao dịch hoàn tất (capture): merchant gửi yêu cầu capture, hold chuyển thành trừ tiền thật; số dư sổ sách và khả dụng đều giảm.
2. Giao dịch hủy (void): hold được giải phóng, tiền trả về khả dụng, sổ sách không thay đổi.
3. Hết hạn hold: hệ thống tự động giải phóng sau thời hạn, tiền trở lại khả dụng.

### Lỗi hay gặp
- Chỉ kiểm tra số dư sổ sách khi cho phép chi tiêu -> khách chi tiêu quá khả dụng, số dư có thể bị âm.
- Hold không có thời hạn hết hạn -> tiền bị khóa vĩnh viễn, khách không thể dùng được tiền của mình.
- Giải phóng hold nhưng không cập nhật khả dụng -> số dư hiển thị sai, khách phàn nàn.

> Senior tip: Trong phỏng vấn, hãy nhấn mạnh available balance (không phải ledger balance) là nguồn chân lý để hệ thống quyết định cho phép chi tiêu hay không, và mọi hold phải có thời hạn rõ ràng kèm job giải phóng tự động. Ví dụ đính kèm: sổ sách 10 triệu, hold 2 triệu, khả dụng 8 triệu.

> Cụm từ: Hold (khóa tiền) là số tiền bị tạm khóa trong tài khoản, chưa trừ thật nhưng không thể dùng. Authorization là bước ngân hàng đồng ý giữ số tiền cho một giao dịch thẻ chưa hoàn tất.
  `,
  follow: [
    'Khi hold hết hạn mà merchant chưa capture, xử lý thế nào?',
    'Tại sao available balance quan trọng hơn ledger balance khi cho phép chi tiêu?',
    'Nếu hold và capture cùng lúc, làm sao tránh chi tiêu hai lần?'
  ],
  tags: ['available balance', 'ledger balance', 'hold', 'authorization']
},
{
  id: 'banking-032',
  topic: 'banking',
  level: 'senior',
  q: 'Chống trừ tiền hai lần end-to-end từ mobile đến gateway đến core banking: các lớp bảo vệ và thứ tự xử lý như thế nào?',
  a: `**Tóm tắt:** Để tránh trừ tiền hai lần, mỗi lớp (app mobile, API gateway, dịch vụ nghiệp vụ, core banking) phải có cơ chế bảo vệ riêng: mobile dùng nút tắt và khóa idempotency; gateway dùng giới hạn tốc độ và kiểm tra trùng; core dùng ràng buộc duy nhất (unique constraint) và giao dịch ACID. Thứ tự xử lý: kiểm tra khóa trước, xử lý sau, lưu kết quả, rồi trả về. Khóa idempotency phải do khách tạo và đi xuyên suốt từ mobile đến core.

### End-to-end là gì
Một giao dịch chuyển tiền không diễn ra ở một nơi, mà đi qua nhiều lớp: app mobile -> API gateway -> dịch vụ nghiệp vụ -> core banking -> cơ sở dữ liệu. Mỗi lớp có thể thử lại hoặc gửi lại yêu cầu. Nếu không có cơ chế bảo vệ, một yêu cầu bị lạc mạng có thể được gửi hai lần và tiền bị trừ hai lần.
Ví dụ đời thường: khách nhấn "Chuyen 5 trieu", mạng giật, khách không thấy kết quả nên nhấn lại. Nếu hệ thống không kiểm tra, hai lệnh "chuyen 5 trieu" sẽ đi đến core và tiền bị trừ 10 trieu thay vì 5 trieu.

### Các lớp bảo vệ
1. Mobile: tắt nút ngay sau khi khách nhận, tạo khóa idempotency duy nhất (UUID), lưu trên thiết bị để lần thử lại cũng dùng khóa cũ.
2. API gateway: giới hạn số yêu cầu của mỗi khách (rate limit), kiểm tra trùng theo khóa idempotency trong bộ nhớ đệm ngắn hạn; nếu khóa đã có, trả kết quả đã luu khong chuyen tiep.
3. Dịch vụ nghiệp vụ: kiểm tra khóa trong cơ sở dữ liệu; nếu đã xử lý, trả kết quả cũ; nếu chưa, xử lý mới.
4. Core banking: ràng buộc duy nhất trên cột khóa idempotency, giao dịch ACID, kiểm tra số dư trước khi trừ tiền.

### Thu tu xu ly (buoc chi tiet)
1. Khách nhận chuyển tiền trên mobile; app tạo khóa K (mã duy nhất, ví dụ UUID) và gửi yêu cầu kèm K.
2. Gateway kiểm tra bộ nhớ đệm: nếu K đã có -> trả kết quả đã lưu, không xử lý lại.
3. Neu K chua co, gateway chuyen tiep yeu cau den dich vu nghiep vu.
4. Dịch vụ kiểm tra cơ sở dữ liệu: nếu K đã được xử lý -> trả kết quả cũ.
5. Neu chua, dich vu goi core banking de tru tien.
6. Core thực hiện trong một giao dịch ACID: kiểm tra số dư, trừ tiền, lưu K cùng kết quả.
7. Ket qua chuyen nguc: dich vu -> gateway -> mobile.

Ví dụ số liệu: khách chuyển 5.000.000 VND, khóa K = "a1b2-c3d4". Mất mạng sau khi gửi, khách nhận "Thử lại" cùng khóa K. Gateway/dịch vụ tìm thấy K đã xử lý -> tra ve "thanh cong" cu, khong tru them 5 trieu.

### Lỗi hay gặp
- Mobile tạo khóa mới mỗi lần thử lại -> không chặn được yêu cầu trùng, tiền có thể bị trừ nhiều lần.
- Bộ nhớ đệm gateway hết hạn trước khi core xử lý xong -> yêu cầu được xử lý hai lần (trùng).
- Core không có ràng buộc duy nhất trên cột khóa -> hai yêu cầu cùng khóa đều được trừ tiền.
- Khách tạo yêu cầu mới thay vì thử lại cùng yêu cầu cũ -> sinh giao dịch mới, không liên quan đến khóa cũ.

> Senior tip: Trong pho van, hay ve so do cac lac va chi rang moi lac bao ve o cap nao. Nhấn mạnh khoa idempotency phai do khach tao (khong phai server) va di xuan sut tu mobile den core. Doi voi tien, vie chan trung quan trong hon vie khong cho bo qua yeu cau.

> Cụm từ: Idempotency key la ma duy nhat gan voi mot yeu cau, dung de phat hien yeu cau duoc gui lai (retry) va chi xu ly mot lan.
  `,
  follow: [
    'Nếu mobile mất mạng sau khi gửi request, làm sao retry an toàn?',
    'Gateway cache hết hạn trước core xử lý xong, xử lý thế nào?',
    'Core banking dùng unique constraint ở cột nào?'
  ],
  tags: ['idempotency', 'end-to-end', 'mobile', 'gateway', 'core banking']
},
{
  id: 'banking-033',
  topic: 'banking',
  level: 'lead',
  q: 'Đối soát tự động: so khớp file, xử lý lệch, báo cáo và quy trình maker-checker như thế nào?',
  a: `**Tóm tắt:** Đối soát tự động so khớp giao dịch của mình với dữ liệu của đối tác (NAPAS, ngân hàng, cổng thanh toán) theo **mã tham chiếu chung**, phân loại kết quả (khớp / chỉ bên mình có / chỉ bên đối tác có / lệch số tiền hoặc trạng thái), **tự động xử lý** những loại lệch có quy tắc rõ ràng, và đưa phần còn lại vào hàng chờ cho người xử lý theo **maker-checker**: một người đề xuất điều chỉnh, một người khác duyệt trước khi ghi sổ.

### Vì sao cần đối soát
Hai hệ thống ghi nhận cùng một giao dịch độc lập với nhau, qua mạng có thể timeout, mất phản hồi, xử lý muộn qua ngày, hoàn tiền một phần. Không đối soát thì sai lệch tích luỹ âm thầm: khách bị trừ tiền mà người nhận không nhận được, hoặc ngân hàng chi tiền mà không ghi nợ. Quy định của ngân hàng nhà nước và đối tác thẻ cũng yêu cầu đối soát hằng ngày.

### Quy trình từng bước
1. **Nhận dữ liệu**: file SFTP hoặc API của đối tác; kiểm tra toàn vẹn (chữ ký, checksum, số dòng và tổng tiền ở dòng cuối). File lỗi thì dừng và yêu cầu gửi lại — không xử lý nửa vời.
2. **Chuẩn hoá** về một định dạng chung (mã tham chiếu, số tiền theo đơn vị nhỏ nhất, trạng thái, thời điểm UTC) rồi nạp vào bảng staging.
3. **So khớp** theo mã tham chiếu (không theo số tiền + thời gian):
~~~sql
SELECT coalesce(o.ref, p.ref) AS ref,
       CASE WHEN o.ref IS NULL THEN 'ONLY_PARTNER'
            WHEN p.ref IS NULL THEN 'ONLY_OURS'
            WHEN o.amount <> p.amount OR o.status <> p.status THEN 'MISMATCH'
            ELSE 'MATCHED' END AS result
FROM ours_day o FULL OUTER JOIN partner_day p ON o.ref = p.ref;
~~~
4. **Tự động xử lý** các nhóm có quy tắc: giao dịch treo bên mình mà đối tác báo thành công → hoàn tất; lệch do ranh giới ngày → so lại với dữ liệu ngày kế tiếp; phí chênh theo biểu phí đã biết → ghi bút toán phí.
5. **Hàng chờ thủ công** cho phần còn lại, kèm đủ bằng chứng (dòng hai bên, lịch sử trạng thái, log liên quan).

### Maker-checker và báo cáo
| Vai trò | Việc | Ràng buộc |
|---|---|---|
| Maker (nhân viên tra soát) | Xem lệch, đề xuất điều chỉnh, đính kèm bằng chứng | Không tự duyệt đề xuất của mình |
| Checker (kiểm soát viên) | Duyệt hoặc từ chối | Bắt buộc với số tiền vượt ngưỡng |
| Hệ thống | Ghi điều chỉnh bằng **bút toán mới**, không sửa giao dịch gốc; audit đầy đủ | Không có quyền "sửa tay" trong DB |
Báo cáo hằng ngày: số giao dịch, tỉ lệ khớp, số lệch theo loại và theo đối tác, tuổi của các khoản chưa xử lý; cảnh báo khi số lệch vượt mức bình thường.

### Ví dụ đời thực
Một ví đối soát thủ công bằng Excel với 3 ngân hàng đối tác: mỗi ngày khoảng 150 khoản lệch, 2 nhân viên làm cả buổi sáng, khoản lệch cũ nhất đã tồn 47 ngày. Sau khi tự động hoá theo quy trình trên, 82% khoản lệch được xử lý tự động (chủ yếu ranh giới ngày và giao dịch treo đã thành công), phần còn lại vào hàng chờ maker-checker với SLA 2 ngày làm việc. Một lần kiểm tra nội bộ phát hiện trước đây có nhân viên vừa đề xuất vừa tự duyệt điều chỉnh — giờ hệ thống chặn điều này.

### Lỗi hay gặp
- So khớp theo số tiền và thời gian → ghép nhầm hai giao dịch cùng số tiền.
- Sửa trực tiếp giao dịch gốc thay vì ghi bút toán điều chỉnh → mất dấu vết kiểm toán.
- Xử lý file thiếu hoặc lỗi một phần → kết quả sai cả ngày.
- Không theo dõi tuổi khoản lệch → tồn đọng hàng tháng.

### Trả lời mẫu khi phỏng vấn
"Đối soát tự động của tôi có năm bước. Nhận dữ liệu đối tác và kiểm tra toàn vẹn, file lỗi thì yêu cầu gửi lại chứ không xử lý một phần. Chuẩn hoá về cùng định dạng rồi so khớp theo mã tham chiếu chung, bằng một full outer join, ra bốn nhóm: khớp, chỉ bên mình, chỉ bên đối tác, lệch số tiền hay trạng thái. Tự động xử lý những nhóm có quy tắc rõ, như giao dịch treo đã được đối tác xác nhận thành công hay lệch do ranh giới ngày. Phần còn lại vào hàng chờ theo maker-checker: một người đề xuất điều chỉnh kèm bằng chứng, người khác duyệt, và hệ thống chặn việc tự duyệt. Mọi điều chỉnh là bút toán mới, không sửa giao dịch gốc, có audit đầy đủ. Cuối cùng là báo cáo hằng ngày theo loại lệch, theo đối tác và tuổi của khoản chưa xử lý."

> Senior tip: thống kê nguyên nhân lệch theo tuần. Mỗi nhóm nguyên nhân lặp lại là một cơ hội tự động hoá hoặc sửa gốc ở hệ thống nguồn — mục tiêu là hàng chờ thủ công ngày càng ngắn, không phải thuê thêm người đối soát.`,
  follow: [
    'Nếu file đối tác đến muộn 2 ngày, xử lý thế nào?',
    'Làm sao phân biệt lệch thật và lệch do parse sai?',
    'Ai có quyền duyệt điều chỉnh số dư?'
  ],
  tags: ['reconciliation', 'file matching', 'discrepancy', 'maker-checker']
},
{
  id: 'banking-034',
  topic: 'banking',
  level: 'lead',
  q: 'Kiến trúc core banking hiện đại vs mainframe: ledger bất biến, event-driven, batch EOD và trade-off như thế nào?',
  a: `**Tóm tắt:** Core banking truyền thống thường chạy trên máy tính chính (mainframe) với xử lý batch cuối ngày và sổ cái có thể sửa trực tiếp. Core banking hiện đại dùng sổ cái bất biến (append-only), kiến trúc hướng sự kiện (event-driven), các dịch vụ độc lập (microservices); batch cuối ngày vẫn còn nhưng nhẹ hơn, chỉ dùng để tổng kết và đối soát. Trade-off: hiện đại linh hoạt và xử lý ngay hơn nhưng phức tạp hơn; mainframe ổn định và kiểm soát tốt nhưng khó thay đổi và kết nối với hệ thống mới.

### Mainframe truyền thống
- Chạy trên máy chủ lớn (ví dụ IBM z/OS), xử lý lớn theo lô (batch) vào cuối ngày.
- Số cái có thể sửa trực tiếp (mutable), kiểm tra lại không dễ.
- Ổn định, xử lý nhiều giao dịch (throughput cao), nhưng không kết nối được với hệ thống mới.

### Hệ thống core banking hiện đại
- Số cái bất biến: chỉ được thêm dòng mới, không sửa/xóa dòng cũ; mỗi thay đổi là một sự kiện.
- Hướng sự kiện: mỗi giao dịch phát ra một sự kiện, các hệ thống liên quan nhận và phản ứng ngay (thực thời).
- Microservices: tach core, thanh toan, kenh so thanh cac dich vu doc lap.
- Batch cuoi ngay van con nhung nhe hon, chi tong ket so lieu va doi soat.

| Tieu chi | Mainframe | Hien dai |
|---|---|---|
| Toc do thay doi | Cham | Nhanh |
| Thuc thoi | Khong de | De |
| Do phuc tap | Thap (tap trung) | Cao (phan tan) |
| Kiểm toán | Không dễ | Dễ (nhật ký sự kiện) |
| Chi phi ban dau | Cao | Trung binh |
| Ru ro van hanh | Thap | Cao hon |

Ví dụ số liệu: một ngân hàng lớn, ổn định, gần không đổi giao dịch có thể giữ mainframe cho số cái; một ngân hàng số cần phát hành tính năng mới liên tục nên chon kien truc hien dai.

### Lỗi hay gặp
- Chuyển sang hiện đại nhưng không giữ nhật ký kiểm tra -> mất quyền kiểm soát.
- Hướng sự kiện không có cơ chế chặn trùng -> xử lý giao dịch hai lần.
- Batch cuoi ngay van qua nang -> nghen vao buoi dem.

### Ví dụ đời thực
Một ngân hàng giữ core mainframe (COBOL, batch EOD 6 tiếng mỗi đêm) nhưng cần chuyển tiền 24/7 và số dư thời gian thực trên app. Thay vì thay core một lần (dự án kiểu "big bang" của ngân hàng khác đã kéo dài 4 năm và vượt ngân sách gấp đôi), họ làm từng bước: dựng một **ledger mới bất biến** (mỗi giao dịch là bút toán kép chỉ thêm, không sửa) cho ví và tài khoản thanh toán; mainframe vẫn là sổ chính thức, đồng bộ hai chiều qua sự kiện và đối soát mỗi giờ; **số dư khả dụng** trên app được tính từ ledger mới theo thời gian thực, còn batch EOD trên mainframe chỉ tính lãi và báo cáo. Sau 18 tháng, 70% giao dịch đi qua ledger mới; thời gian batch EOD giảm còn 2 tiếng vì bớt việc. Đánh đổi: thêm hệ thống phải vận hành và đối soát giữa hai sổ trong giai đoạn chuyển tiếp.

### Trả lời mẫu khi phỏng vấn
"Core banking mainframe truyền thống rất ổn định, xử lý giao dịch tốt, nhưng thường dựa nhiều vào batch cuối ngày, khó thay đổi, khó tích hợp với kênh số 24/7, và nguồn nhân lực COBOL ngày càng hiếm. Kiến trúc hiện đại hướng tới ledger bất biến theo kế toán kép, chỉ thêm bút toán chứ không sửa, số dư thời gian thực, giao tiếp qua sự kiện, và các dịch vụ tách theo nghiệp vụ như tài khoản, thanh toán, cho vay. Batch EOD vẫn còn cho tính lãi, phí, báo cáo, nhưng nhẹ hơn. Đánh đổi là độ phức tạp phân tán: nhất quán giữa các dịch vụ, idempotency, đối soát. Thực tế hiếm ngân hàng thay core một lần; tôi ủng hộ cách strangler: dựng ledger mới cho phần cần thời gian thực, đồng bộ và đối soát với core cũ, chuyển dần nghiệp vụ, luôn có đường lui."

> Senior tip: Trong pho van, nhấn mạnh khong phai "hien dai luon tot hon". Mainframe van phu hop ngan hang lon, on dinh, it thay doi; kien truc hien dai phu hop khi can tinh nang moi lien tuc va xu ly thuc thoi. Lua chon phu thuoc quy mo, ngan sach va doi ngu van hanh.

> Cụm từ: Huong su kien (event-driven) la kien truc xu ly duoc su kien, cac thanh phan phan ung voi su kien thay goi truc tiep lan nhau.
  `,
  follow: [
    'Khi nào nên giữ mainframe thay vì chuyển sang hiện đại?',
    'Ledger bất biến giúp audit thế nào so với mutable?',
    'Event-driven có những rủi ro gì trong ngân hàng?'
  ],
  tags: ['core banking', 'mainframe', 'event-driven', 'ledger', 'architecture']
},
{
  id: 'banking-035',
  topic: 'banking',
  level: 'senior',
  q: 'Bảo mật và tuân thủ: PCI DSS, tokenization, HSM và audit log không sửa được trong hệ thống thẻ như thế nào?',
  a: `**Tóm tắt:** Hệ thống thẻ phải tuân thủ **PCI DSS** (chuẩn bảo mật dữ liệu thẻ của các tổ chức thẻ quốc tế). Cách hiệu quả nhất là **thu hẹp phạm vi**: số thẻ thật (PAN) chỉ nằm trong một **vault tokenization**, các hệ thống khác chỉ giữ **token**; khoá mã hoá và thao tác mật mã nhạy cảm (PIN, khoá của thẻ) nằm trong **HSM** — thiết bị phần cứng chống can thiệp; và mọi truy cập dữ liệu nhạy cảm được ghi vào **audit log không sửa được**.

### PCI DSS yêu cầu những gì (ý chính)
- Không lưu dữ liệu xác thực nhạy cảm sau khi uỷ quyền: **CVV/CVC, dữ liệu dải từ đầy đủ, PIN** — tuyệt đối không lưu.
- PAN nếu lưu thì phải **không đọc được** (mã hoá mạnh, token hoá, hoặc băm có khoá); hiển thị thì che (thường chỉ 6 số đầu và 4 số cuối).
- Mã hoá khi truyền qua mạng (TLS), phân tách mạng cho môi trường dữ liệu thẻ (CDE), quản lý khoá, kiểm soát truy cập theo nhu cầu, nhật ký truy cập, quét lỗ hổng và kiểm thử xâm nhập định kỳ. Phiên bản hiện hành là PCI DSS 4.0.x.
Mọi hệ thống **lưu, xử lý hoặc truyền** PAN — và hệ thống kết nối tới chúng — đều nằm trong phạm vi đánh giá. Vì vậy giảm số nơi chạm vào PAN là cách giảm chi phí và rủi ro lớn nhất.

### Tokenization hoạt động thế nào
~~~seq
title: Lưu thẻ cho thanh toán sau
actors: App | Gateway | Vault | HSM | Core
App -> Gateway: PAN (TLS, trang nhập thẻ của vault)
Gateway -> Vault: tokenize(PAN)
Vault -> HSM: mã hoá PAN bằng khoá trong HSM
Vault --> Gateway: token tok_7f3a... + 4 số cuối
Gateway -> Core: lưu token, không lưu PAN
Core -> Vault: khi thanh toán: detokenize (chỉ service được phép)
~~~
Token là chuỗi ngẫu nhiên không suy ngược được ra PAN; chỉ vault (mạng tách biệt, quyền chặt) đổi được token về PAN. Core banking, CRM, data warehouse, log chỉ thấy token → ra khỏi phạm vi PCI.

### HSM
Thiết bị phần cứng (hoặc dịch vụ cloud như AWS CloudHSM, KMS) giữ khoá **không bao giờ rời thiết bị ở dạng rõ**, chống can thiệp vật lý, có chứng nhận FIPS 140. Dùng cho: khoá mã hoá dữ liệu (thường theo mô hình **envelope encryption**: khoá dữ liệu được mã hoá bởi khoá chủ trong HSM), sinh và kiểm tra PIN, kiểm tra mã ARQC của thẻ chip, ký thông điệp. Xoay vòng khoá định kỳ mà không phải giải mã lại toàn bộ dữ liệu nhờ envelope encryption.

### Audit log không sửa được
- Ghi ai/khi nào/làm gì với dữ liệu thẻ (đặc biệt detokenize, xem PAN đầy đủ, thay đổi quyền).
- Lưu ở kho bất biến (WORM, ví dụ S3 Object Lock), hash chain và ký định kỳ bằng khoá mà đội vận hành không dùng được; tách quyền: người quản trị hệ thống không xoá được log.
- Không ghi PAN hay dữ liệu nhạy cảm vào chính audit log.

### Ví dụ đời thực
Một công ty fintech chuẩn bị đánh giá PCI DSS lần đầu: rà soát thấy PAN nằm ở 6 nơi (bảng giao dịch, log, file xuất cho đối tác, bản sao DB cho phân tích, cache, môi trường test). Sau 4 tháng chuyển sang vault tokenization dùng HSM, che log tập trung, dữ liệu test giả lập, phạm vi đánh giá giảm từ 35 service còn 4; detokenize chỉ cho 2 service với quyền theo danh tính và audit mọi lần gọi. Đánh giá đạt ở lần đầu, chi phí đánh giá giảm đáng kể.

### Lỗi hay gặp
- Ghi PAN hoặc CVV vào log khi debug lỗi thanh toán.
- Mã hoá PAN nhưng khoá để trong file cấu hình cạnh dữ liệu.
- Sao chép dữ liệu thẻ thật xuống môi trường test.
- Token hoá nhưng cấp quyền detokenize rộng cho mọi service.

### Trả lời mẫu khi phỏng vấn
"Với hệ thống thẻ, tôi tuân thủ PCI DSS bằng cách thu hẹp phạm vi càng nhiều càng tốt. Số thẻ đầy đủ chỉ được nhập qua trang hoặc SDK của vault và chỉ lưu trong vault tokenization ở mạng tách biệt; các hệ thống khác như core, CRM, kho dữ liệu chỉ giữ token và bốn số cuối, nên ra khỏi phạm vi đánh giá. Tuyệt đối không lưu CVV, PIN hay dữ liệu dải từ sau khi uỷ quyền. Khoá mã hoá nằm trong HSM hoặc KMS theo mô hình envelope encryption, khoá chủ không bao giờ rời thiết bị, và xoay vòng định kỳ. HSM cũng dùng cho các thao tác như kiểm tra PIN, kiểm tra mã của thẻ chip. Mọi lần detokenize hay xem dữ liệu nhạy cảm đều được ghi vào audit log bất biến, có hash chain và tách quyền. Log ứng dụng được che tập trung, và môi trường test dùng dữ liệu giả."

> Senior tip: vẽ sơ đồ luồng dữ liệu thẻ (cardholder data flow) trước mọi thay đổi kiến trúc liên quan thanh toán. Một service mới vô tình nhận PAN là cả service đó và mọi thứ kết nối tới nó rơi vào phạm vi PCI.`,
  follow: [
    'Tại sao HSM an toàn hơn lưu khóa trong file config?',
    'Tokenization khác mã hóa (encryption) ở điểm nào?',
    'Audit log không sửa được thực hiện thế nào ở mức DB?'
  ],
  tags: ['PCI DSS', 'tokenization', 'HSM', 'audit log', 'security']
},
{
  id: 'banking-036',
  topic: 'banking',
  level: 'senior',
  q: 'Chuyển tiền liên ngân hàng NAPAS 247: trạng thái treo/timeout, tra soát và đối soát cuối ngày xử lý thế nào?',
  a: `**Tóm tắt:** Với chuyển tiền nhanh 24/7 qua NAPAS, timeout **không có nghĩa là thất bại** — chỉ là chưa biết kết quả. Giao dịch chuyển sang trạng thái **chờ tra soát**, tiền của người gửi được **tạm giữ** (không tự hoàn ngay, không cho gửi lại lệnh mới), hệ thống **hỏi trạng thái** theo mã giao dịch duy nhất, và đối soát cuối ngày với file của NAPAS để chốt các giao dịch còn treo. Chỉ hoàn tiền khi có xác nhận thất bại hoặc quá thời hạn tra soát theo quy trình.

### Vì sao timeout nguy hiểm
Khi gửi lệnh mà không nhận được phản hồi trong thời gian cho phép, có ba khả năng:
1. NAPAS **chưa nhận** lệnh → tiền chưa đi.
2. NAPAS **đã xử lý thành công** (người nhận đã được ghi có) nhưng phản hồi bị mất trên đường về.
3. Giao dịch **đang được xử lý** ở một bên.
Nếu coi timeout là thất bại và hoàn tiền (hoặc cho khách gửi lại), trường hợp 2 khiến **tiền đi hai lần** hoặc ngân hàng mất tiền.

### Máy trạng thái giao dịch
~~~text
[SENDING] --phản hồi thành công--> [SUCCESS]
[SENDING] --phản hồi thất bại--> [FAILED] --> hoàn tiền tạm giữ
[SENDING] --timeout / lỗi mạng--> [PENDING_INQUIRY]
[PENDING_INQUIRY] --tra soát: thành công--> [SUCCESS]
[PENDING_INQUIRY] --tra soát: thất bại--> [FAILED] --> hoàn tiền
[PENDING_INQUIRY] --quá hạn, chưa rõ--> [MANUAL_INVESTIGATION] --> đối soát/tra soát với NAPAS
~~~
Ở PENDING_INQUIRY, số tiền đã bị **tạm giữ** khỏi số dư khả dụng nhưng chưa được ghi nợ chính thức; app hiển thị "đang xử lý".

### Tra soát bằng mã giao dịch
- Mỗi lệnh có **mã tham chiếu duy nhất** do ngân hàng gửi sinh ra và gửi kèm lệnh — đây là chìa khoá để hỏi trạng thái và để đối soát.
- Job hỏi trạng thái tự động với backoff (ví dụ sau 1, 5, 15, 60 phút); kết quả cập nhật máy trạng thái một cách idempotent.
- Không tự động **gửi lại lệnh** khi timeout, trừ khi kênh đảm bảo chống trùng theo mã tham chiếu.

### Đối soát cuối ngày
File đối soát của NAPAS được so khớp với sổ của ngân hàng theo mã tham chiếu: giao dịch treo mà NAPAS báo thành công thì hoàn tất; ngân hàng ghi thành công mà NAPAS không có thì mở tra soát; các khoản chưa giải quyết đi vào quy trình tra soát chính thức với thời hạn theo quy định của NAPAS và có maker-checker cho mọi điều chỉnh.

### Ví dụ đời thực
Một ngân hàng số từng xử lý timeout bằng cách báo khách "giao dịch thất bại" và hoàn tiền ngay; khách chuyển lại và nhiều trường hợp người nhận nhận **hai lần** vì lệnh đầu thực ra đã thành công — trung bình 40 vụ mỗi tuần, mất nhiều ngày để đòi lại. Chuyển sang máy trạng thái trên: 92% giao dịch timeout được chốt tự động trong 15 phút nhờ hỏi trạng thái, phần còn lại chốt trong đối soát cuối ngày; không còn chuyển trùng, khiếu nại "tiền bị trừ mà chưa đến" giảm nhờ app hiển thị đúng trạng thái.

### Lỗi hay gặp
- Coi timeout là thất bại và hoàn tiền ngay.
- Cho phép khách bấm gửi lại khi giao dịch đang treo.
- Không có mã tham chiếu duy nhất xuyên suốt → không tra soát được.
- Sửa trạng thái bằng tay trong DB thay vì qua quy trình có duyệt.

### Trả lời mẫu khi phỏng vấn
"Với NAPAS 24/7, timeout nghĩa là chưa biết kết quả, vì có thể NAPAS chưa nhận lệnh, hoặc đã xử lý thành công nhưng phản hồi bị mất. Nên tôi không coi timeout là thất bại: giao dịch chuyển sang trạng thái chờ tra soát, tiền của người gửi được tạm giữ, app hiển thị đang xử lý và không cho gửi lại lệnh mới. Mỗi lệnh có mã tham chiếu duy nhất; một job hỏi trạng thái theo mã đó với backoff và cập nhật máy trạng thái idempotent: thành công thì ghi nợ chính thức, thất bại thì hoàn tiền tạm giữ. Những giao dịch vẫn chưa rõ sẽ được chốt trong đối soát cuối ngày với file của NAPAS, hoặc đi vào quy trình tra soát chính thức có thời hạn và maker-checker. Không tự động gửi lại lệnh, vì đó là cách nhanh nhất để chuyển tiền hai lần."

> Senior tip: đo tỉ lệ giao dịch rơi vào trạng thái chờ tra soát theo giờ và theo ngân hàng nhận. Tỉ lệ tăng đột biến thường là dấu hiệu sớm nhất của sự cố phía đối tác — trước cả khi họ thông báo.`,
  follow: [
    'Tại sao không tự động retry khi timeout?',
    'Transaction ID giúp tra soát thế nào?',
    'Giao dịch treo quá một tháng xử lý ra sao?'
  ],
  tags: ['NAPAS', 'timeout', 'tra sot', 'doi soat']
},
{
  id: 'banking-037',
  topic: 'banking',
  level: 'lead',
  q: 'Idempotency end-to-end từ mobile đến gateway đến core: thiết kế key, lưu trữ, và xử lý retry như thế nào ở cấp lead?',
  a: `**Tóm tắt:** Idempotency end-to-end nghĩa là **một ý định thanh toán của người dùng chỉ tạo ra đúng một kết quả** dù request bị gửi lại ở bất kỳ tầng nào (app retry, gateway retry, consumer nhận trùng). Khoá do **client sinh một lần cho mỗi ý định**, đi xuyên suốt mobile → gateway → service → core (và sang đối tác), được lưu **bền** cùng kết quả trong DB với unique constraint, trong **cùng transaction** với thay đổi nghiệp vụ. Với tiền, khi kho lưu khoá gặp sự cố thì **fail-closed** (từ chối) chứ không fail-open.

### Thiết kế khoá
- App sinh UUID khi người dùng **xác nhận** giao dịch (không phải mỗi lần gửi request), lưu cục bộ để mọi lần retry dùng lại cùng khoá — kể cả sau khi app bị tắt.
- Khoá gắn với **người dùng** và **nội dung**: server lưu thêm hash của request; cùng khoá mà nội dung khác → từ chối (422), tránh dùng nhầm khoá.
- Mỗi tầng chuyển tiếp khoá (header {{Idempotency-Key}}), và tầng gọi đối tác dùng khoá/mã tham chiếu suy ra từ đó để đối tác cũng chống trùng.

### Lưu trữ và xử lý
~~~sql
CREATE TABLE idempotency_keys (
  user_id     bigint NOT NULL,
  idem_key    uuid   NOT NULL,
  request_hash text  NOT NULL,
  status      text   NOT NULL,          -- IN_PROGRESS | DONE
  response    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idem_key)
);
~~~
1. Bắt đầu transaction, {{INSERT ... status = 'IN_PROGRESS'}}; trùng khoá chính → đọc bản ghi cũ.
2. Bản ghi cũ **DONE** → trả lại đúng response đã lưu. **IN_PROGRESS** → trả 409 (hoặc 202 kèm link trạng thái) để client hỏi lại sau.
3. Thực hiện nghiệp vụ (ghi bút toán…) và cập nhật {{status = 'DONE', response = ...}} **trong cùng transaction**; lỗi thì rollback cả hai, lần retry sau được xử lý lại.
Redis ở gateway có thể làm lớp lọc nhanh, nhưng **nguồn sự thật là DB** — Redis mất dữ liệu không được dẫn tới xử lý trùng.

### TTL
Giữ khoá ít nhất lâu hơn khoảng thời gian client có thể retry (app có thể gửi lại sau nhiều giờ khi có mạng); với giao dịch tiền thường giữ nhiều ngày hoặc lâu hơn, dọn bằng job theo partition thời gian.

### Khi kho lưu khoá gặp sự cố
Không ghi/đọc được khoá → **từ chối** request (fail-closed, trả 503 để client retry sau). Fail-open (cứ xử lý) có thể tạo giao dịch trùng — với tiền, chậm một chút luôn tốt hơn trừ tiền hai lần.

### Ví dụ đời thực
Một ngân hàng số chỉ chống trùng ở gateway bằng Redis TTL 5 phút. Khi app retry sau 8 phút (người dùng mở lại app trong vùng mạng yếu), khoá đã hết hạn → lệnh chuyển thứ hai được xử lý; mỗi tháng khoảng 30 giao dịch trùng. Một lần Redis failover mất dữ liệu cũng gây hàng loạt trùng lặp. Thiết kế lại theo mô hình trên với khoá lưu trong DB cùng transaction và giữ 30 ngày, khoá truyền tới core và đối tác: giao dịch trùng về 0, đối soát xác nhận trong 3 tháng.

### Lỗi hay gặp
- Server sinh khoá thay vì client → mỗi lần retry là một khoá mới.
- Lưu khoá và ghi nghiệp vụ ở hai transaction khác nhau → có khe hở trùng hoặc mất.
- TTL quá ngắn so với hành vi retry thật của app.
- Không kiểm tra hash nội dung → cùng khoá được dùng cho giao dịch khác.

### Trả lời mẫu khi phỏng vấn
"Idempotency end-to-end nghĩa là một ý định thanh toán chỉ cho ra một kết quả, dù retry ở bất kỳ tầng nào. Client sinh khoá một lần khi người dùng xác nhận, lưu lại để mọi lần retry dùng cùng khoá, và khoá đi xuyên suốt từ app qua gateway, service tới core và sang đối tác. Server lưu khoá cùng hash nội dung, trạng thái và response trong DB với khoá chính theo người dùng và khoá, ghi trong cùng transaction với bút toán: đã xong thì trả lại response cũ, đang xử lý thì trả 409 hoặc 202, cùng khoá khác nội dung thì từ chối. Redis chỉ là lớp lọc nhanh, nguồn sự thật là DB. TTL phải dài hơn hành vi retry thật của app, với tiền thường là nhiều ngày. Và khi kho lưu khoá lỗi thì fail-closed, từ chối request, vì chậm một chút vẫn tốt hơn trừ tiền hai lần."

> Senior tip: viết một bộ test end-to-end gửi cùng một khoá ở ba thời điểm (ngay lập tức, đồng thời, sau 2 giờ) và kiểm tra số bút toán. Bài test này phát hiện gần như mọi khe hở idempotency trước khi khách hàng phát hiện.`,
  follow: [
    'TTL của idempotency key nên là bao nhiêu cho giao dịch tiền?',
    'Nếu Redis (cache) lỗi, hệ thống tiền nên fail-closed hay fail-open?',
    'Làm sao xử lý request trùng key đang in-flight?'
  ],
  tags: ['idempotency', 'end-to-end', 'TTL', 'fail-closed', 'lead']
},
{
  id: 'banking-038',
  topic: 'banking',
  level: 'lead',
  q: 'Bảo mật và tuân thủ nâng cao: mã hóa dữ liệu thẻ (tokenization, HSM), audit log bất biến và PCI DSS trong kiến trúc microservices như thế nào?',
  a: `**Tóm tắt:** Trong microservices, bảo vệ số thẻ bằng tokenization (thay PAN bằng token ngẫu nhiên), mã hóa và lưu khóa trong HSM, ghi nhật ký kiểm tra append-only, và giữ phạm vi PCI DSS nhỏ nhất: chỉ vault chạm PAN, các dịch vụ khác chỉ giữ token.

### Tokenization và HSM (giải thích từ đầu)
PAN là số thẻ thật (16 chữ số), dữ liệu nhạy cảm nhất: kẻ có PAN có thể mượn thẻ khách hàng. Tokenization thay PAN bằng token — chuỗi ngẫu nhiên không có nghĩa (ví dụ tok_abc123xyz), chỉ vault biết token ánh xạ PAN nào.

Khách nhập thẻ vào app, app gửi PAN qua TLS đến vault; vault dùng HSM mã hóa PAN, lưu PAN đã mã hóa, trả về token. App lưu token, không lưu PAN. Các dịch vụ khác (payment, đơn hàng…) chỉ lưu token. Khi charge, payment gửi token cho vault; vault giải mã lấy PAN rồi gọi cổng thanh toán.

HSM là thiết bị phần cứng lưu khóa, mã hóa/giải mã bên trong, khóa không bao giờ xuất ra ngoài dạng rõ ràng.

### PCI DSS và phạm vi kiểm tra (scope)
PCI DSS là tiêu chuẩn bảo mật bắt buộc đối với đơn vị lưu, xử lý hoặc truyền PAN. PAN ở nhiều dịch vụ = nhiều dịch vụ trong phạm vi kiểm tra. Chỉ vault chạm PAN → chỉ vault nằm trong phạm vi PCI DSS; các dịch vụ khác chỉ giữ token, nằm ngoài phạm vi, giảm chi phí tuân thủ.

### Nhật ký kiểm tra bất biến (append-only / WORM)
Mọi truy cập PAN hoặc token phải được ghi log: ai, lúc nào, làm gì. Log append-only: chỉ thêm dòng mới, không sửa/xóa. Lưu dạng WORM (ghi một lần, đọc nhiều lần, không sửa/xóa), giữ ít nhất 7 năm.

### Code minh hoạ: dịch vụ vault Java
~~~java
class CardVaultService {
    private final HsmClient hsm; // gọi HSM
    private final TokenRepository tokens; // mapping token <-> PAN đã mã hóa

    String issueToken(String pan) {
        String encryptedPan = hsm.encrypt(pan); // mã hóa PAN bằng HSM
        String token = TokenGenerator.random(); // token ngẫu nhiên
        tokens.save(token, encryptedPan); // chỉ vault lấy được PAN
        return token;
    }

    String detokenize(String token) {
        String encryptedPan = tokens.findByToken(token); // lấy PAN đã mã hóa
        return hsm.decrypt(encryptedPan); // giải mã bằng HSM, trả về PAN
    }
}
~~~

### Khi nào dùng và khi nào không dùng
Dùng khi hệ thống tự lưu PAN hoặc phải tuân thủ PCI DSS. Không cần tự triển khai vault nếu chỉ nhận thanh toán qua cổng bên thứ ba (Stripe, MoMo, VNPAY) và không lưu PAN.
Trade-off: lưu PAN tại mỗi dịch vụ đơn giản nhưng rò rỉ PAN làm toàn bộ hệ thống nằm trong phạm vi PCI DSS; tokenization + vault chỉ để vault trong phạm vi PCI DSS, thêm độ trễ gọi vault; thêm HSM bảo mật khóa phần cứng nhưng chi phí cao hơn.

### Pitfall production hay gặp
- Dịch vụ khác ghi PAN vào log hoặc trường mở rộng → mở rộng phạm vi PCI DSS.
- Token không kiểm tra quyền truy cập → kẻ có token gọi vault lấy PAN.
- Không dùng HSM → khóa trong file cấu hình, dễ lộ khi source bị truy cập.
- Log có thể sửa → mất bằng chứng khi sự cố.

### Ví dụ đời thực (production)
Ngân hàng ABC xử lý 2.000 giao dịch thẻ/giây (QPS) vào giờ cao điểm, latency dưới 200 ms. Trước đây payment lưu PAN rõ ràng, toàn bộ hệ thống payment trong phạm vi PCI DSS. Sau vault + tokenization: payment chỉ lưu token, duy nhất vault chạm PAN, phạm vi thu hẹp xuống 3 máy chủ vault. Dịch vụ khác bị xâm nhập → hacker chỉ có token, không dùng được.

### Trả lời mẫu khi phỏng vấn (khoảng 60–90 giây)
"Trong kiến trúc microservices, em bảo vệ số thẻ bằng tokenization: thay PAN bằng token ngẫu nhiên, chỉ vault biết ánh xạ và được phép lấy PAN khi cần. Mã hóa và lưu khóa trong HSM, khóa không ra ngoài thiết bị. Mọi truy cập PAN hoặc token được ghi log append-only, lưu WORM, giữ ít nhất 7 năm. Chỉ vault nằm trong phạm vi PCI DSS, các dịch vụ khác chỉ giữ token, nằm ngoài phạm vi kiểm tra, giảm chi phí tuân thủ. Nếu dịch vụ khác bị xâm nhập, hacker chỉ có token, không dùng được nếu không gọi được vault. Khuyến nghị: mã hóa toàn bộ dữ liệu truyền, dùng log WORM, không cache PAN rõ ràng. Giải pháp này giảm phạm vi tuân thủ, giảm rủi ro sự cố và đảm bảo latency thấp dưới 200 ms."

> Cụm từ: PAN là số thẻ thật (16 chữ số), dữ liệu nhạy cảm nhất.
> Cụm từ: WORM là lưu trữ ghi một lần, đọc nhiều lần, không sửa/xóa.

> Senior tip: Nhấn mạnh nguyên tắc "tiết lộ ít nhất" (least exposure): chỉ vault chạm PAN, mỗi dịch vụ khác chỉ giữ token — cách giảm phạm vi PCI DSS khi một dịch vụ bị xâm nhập. Luôn định nghĩa hành động khi vault gặp sự cố trước khi triển khai production.
  `,
  follow: [
    'Tại sao chỉ vault service nên trong PCI scope?',
    'Token bị lộ thì rủi ro thế nào so với PAN bị lộ?',
    'Audit log bất biến thực hiện thế nào ở cấp hạ tầng?'
  ],
  tags: ['PCI DSS', 'tokenization', 'HSM', 'microservices', 'audit log']
}

);
