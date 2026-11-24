/* Topics: banking — Nghiệp vụ ngân hàng cho Java dev. Format: see AGENTS.md. Owner: task T618. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'banking-001',
  topic: 'banking',
  level: 'mid',
  q: 'Core banking là gì, và các hệ thống xung quanh như kênh số, thẻ, thanh toán, CRM nói chuyện với core thế nào? Tại sao core thường phải chạy batch cuối ngày (EOD)?',
  a: `**Tóm tắt:** Core banking là hệ thống lõi của ngân hàng, nơi lưu sổ cái tài khoản của mọi khách hàng (số dư, lịch sử giao dịch) và là nơi duy nhất quyết định "tài khoản này còn bao nhiêu tiền". Kênh số (app, internet banking), hệ thống thẻ, hệ thống thanh toán và CRM gọi vào core để tra số dư, trừ hoặc cộng tiền. Core thường chạy một vòng batch cuối ngày (End of Day) để đối soát, tính lãi và đóng sổ cái, vì cập nhật hàng nghìn giao dịch theo thời gian thực đồng loạt sẽ quá nặng và dễ sai.
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
- Quên lưu mã tham chiếu duy nhất (transaction ID) không thể tra soát -> giao dịch bị mất trong hệ thống, không tìm lại được.
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
2. Phục hồi lỗi: nếu code có bug ghi sai số dư, bạn có thể dò lại toàn bộ lịch sử để tìm lỗi, không cần khôi phục từ sao lưu.
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
  tags: ['core', 'double-entry ledger', 'append-only', 'BigDecimal', 'accounting']
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
- Hai giao dịch khác nhau dùng cùng idempotency key -> giao dịch sau bị từ chối sai.
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
  tags: ['core', 'idempotency', 'API chuyen tien', 'callback', 'doi tac']
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
- Giao dịch timeout: ngân hàng gửi đã trừ tiền nhưng thông báo bị mất, ngân hàng nhận chưa biết -> tiền bị "mất" giữa hai bên.
- Lỗi hệ thống: mạng mất, server chậm, code bug ghi sai số tiền.
- Giao dịch chưa khớp: một bên ghi giao dịch, bên kia chưa ghi (ví dụ nhân viên nhập sai mã tài khoản).
- Ngày lễ/giờ bảo trì: hệ thống ngừng, giao dịch bị trễ, đến ngày mới thì khớp.
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
  tags: ['core', 'doi soat', 'lech cuoi ngay', 'tra sot', 'NAPAS']
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
title: Thẻ quẹt - auth, capture, settlement
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
  tags: ['core', 'double-entry', 'ledger', 'race condition', 'balance', 'transaction']
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
  tags: ['core', 'reconciliation', 'Napas', 'EOD', 'break', 'settlement']
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
  tags: ['core', 'timeout', 'pending', 'tra soát', 'interbank', 'idempotency']
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
title: Hold khi thanh toán thẻ
actors: Khách | Merchant | Acquirer | Network | Issuer
Khách -> Merchant: quét thẻ, mua 2 triệu
Merchant -> Acquirer: yêu cầu authorization 2 triệu
Acquirer -> Network: chuyển yêu cầu đến issuer
Network -> Issuer: kiểm tra thẻ và hạn mức
Issuer -> Issuer: hold 2 triệu trên hạn mức
Issuer --> Network: chấp nhận, mã auth
Network --> Acquirer: chấp nhận
Acquirer --> Merchant: thành công, in hóa đơn
~~~
### Giải phóng hold ra sao
1. Giao dịch hoàn tất (capture): merchant gửi yêu cầu capture, hold chuyển thành trừ tiền thật; số dư sổ sách và khả dụng đều giảm.
2. Giao dịch hủy (void): hold được giải phóng, tiền trả về khả dụng, sổ sách không thay đổi.
3. Hết hạn hold: hệ thống tự động giải phóng sau thời hạn, tiền trở lại khả dụng.
### Lỗi hay gặp
- Chỉ kiểm tra số dư sổ sách khi cho phép chi tiêu -> khách chi tiêu quá khả dụng, số dư có thể bị âm.
- Hold không có thời hạn hết hạn -> tiền bị khóa vĩnh viễn, khách không thể dùng được tiền của mình.
- Giải phóng hold nhưng không cập nhật khả dụng -> số dư hiển thị sai, khách phàn nàn.
### Ví dụ đời thực
**Triệu chứng:** Một ngân hàng số ghi nhận khoảng 120 khiếu nại trong một buổi sáng: khách thấy "số dư khả dụng" trên app bị trừ 500.000 VND cho một giao dịch mua vé xem phim nhưng vé không được cấp, trong khi số dư sổ sách (ledger balance) vẫn đủ. Tổng tiền bị khóa tạm thời (hold) của các khách này khoảng 60 triệu VND, kéo dài hơn 5 ngày.

**Điều tra:** Đội vận hành tra bảng hold theo trạng thái {{PENDING}} và thời gian tạo: ~8.000 hold thẻ đã quá 72 giờ nhưng chưa có bản ghi capture hay void từ hệ thống của nhà cung cấp dịch vụ thanh toán (payment gateway). Log cho thấy sự kiện {{auth.approved}} được ghi nhận, nhưng sự kiện {{capture}} hoặc {{void}} không bao giờ đến do lỗi tích hợp phía merchant (hệ thống bán vé trả mã lỗi nhưng không gửi void). Job quét hold hết hạn đang cấu hình {{hold_ttl_days = 30}} cho loại giao dịch này, nên hold chưa được tự giải phóng.

**Nguyên nhân gốc:** Thiếu cơ chế tự động void/release khi merchant không capture trong thời gian cam kết (ví dụ 24-48 giờ) và TTL (thời gian sống) của hold đặt quá dài; đồng thời không có cảnh báo khi tỷ lệ hold quá hạn tăng đột biến.

**Cách xử lý:** (1) Chạy batch đối soát các hold {{PENDING}} quá 48 giờ không có capture, gọi API void về issuer/network và cập nhật trạng thái hold thành {{RELEASED}}, trả tiền về khả dụng. (2) Giảm {{hold_ttl_days}} xuống 7 ngày cho giao dịch mua hàng thông thường và thêm job định kỳ mỗi 15 phút quét hold quá hạn SLA (cam kết mức dịch vụ). (3) Thêm metric {{hold_expired_unreleased_count}} và cảnh báo khi vượt ngưỡng.

**Kết quả đo được:** Sau 2 giờ xử lý, 100% hold bị kẹt được giải phóng, khiếu nại giảm về 0 trong ngày. Tuần tiếp theo, số hold quá hạn trung bình giảm từ 8.000 xuống dưới 20/ngày nhờ TTL và cảnh báo mới.
### Trả lời mẫu khi phỏng vấn
"Em phân biệt hai khái niệm: số dư sổ sách (ledger balance) là tiền đã ghi thực tế trên sổ cái dùng để đối soát kế toán, còn số dư khả dụng (available balance) là số khách có thể dùng ngay, bằng sổ sách trừ các khoản đang bị hold. Hold là việc tạm khóa một khoản tiền khi giao dịch thẻ được ủy quyền (authorization) nhưng chưa chốt, để tránh khách chi tiêu hai lần cùng một số tiền; khi merchant capture thì hold chuyển thành bút toán trừ thật, còn nếu void hoặc hết hạn thì hold được giải phóng và tiền trả về khả dụng. Khi thiết kế, em luôn dùng available balance làm nguồn quyết định cho phép chi tiêu, đảm bảo mọi hold đều có TTL và job tự động release, đồng thời có giám sát hold quá hạn. Ở dự án trước, em từng xử lý sự cố hàng nghìn hold bị kẹt do không nhận được void từ merchant, bằng cách chạy batch đối soát, siết TTL và thêm cảnh báo, giúp tiền của khách được trả lại kịp thời."

> Senior tip: Trong phỏng vấn, hãy nhấn mạnh available balance (không phải ledger balance) là nguồn chân lý để hệ thống quyết định cho phép chi tiêu hay không, và mọi hold phải có thời hạn rõ ràng kèm job giải phóng tự động. Ví dụ đính kèm: sổ sách 10 triệu, hold 2 triệu, khả dụng 8 triệu.

> Cụm từ: Hold (khóa tiền) là số tiền bị tạm khóa trong tài khoản, chưa trừ thật nhưng không thể dùng. Authorization là bước ngân hàng đồng ý giữ số tiền cho một giao dịch thẻ chưa hoàn tất.
  `,
  follow: [
    'Khi hold hết hạn mà merchant chưa capture, xử lý thế nào?',
    'Tại sao available balance quan trọng hơn ledger balance khi cho phép chi tiêu?',
    'Nếu hold và capture cùng lúc, làm sao tránh chi tiêu hai lần?'
  ],
  tags: ['core', 'available balance', 'ledger balance', 'hold', 'authorization']
},
{
  id: 'banking-032',
  topic: 'banking',
  level: 'senior',
  q: 'Chống trừ tiền hai lần end-to-end từ mobile đến gateway đến core banking: các lớp bảo vệ và thứ tự xử lý như thế nào?',
  a: `**Tóm tắt:** Để tránh trừ tiền hai lần, mỗi lớp (app mobile, API gateway, dịch vụ nghiệp vụ, core banking) phải có cơ chế bảo vệ riêng: mobile dùng nút tắt và khóa idempotency; gateway dùng giới hạn tốc độ và kiểm tra trùng; core dùng ràng buộc duy nhất (unique constraint) và giao dịch ACID. Thứ tự xử lý: kiểm tra khóa trước, xử lý sau, lưu kết quả, rồi trả về. Khóa idempotency phải do khách tạo và đi xuyên suốt từ mobile đến core.
### End-to-end là gì
Một giao dịch chuyển tiền không diễn ra ở một nơi, mà đi qua nhiều lớp: app mobile -> API gateway -> dịch vụ nghiệp vụ -> core banking -> cơ sở dữ liệu. Mỗi lớp có thể thử lại hoặc gửi lại yêu cầu. Nếu không có cơ chế bảo vệ, một yêu cầu bị lạc mạng có thể được gửi hai lần và tiền bị trừ hai lần.
Ví dụ đời thường: khách nhấn "Chuyển 5 triệu", mạng giật, khách không thấy kết quả nên nhấn lại. Nếu hệ thống không kiểm tra, hai lệnh "chuyển 5 triệu" sẽ đi đến core và tiền bị trừ 10 triệu thay vì 5 triệu.
### Các lớp bảo vệ
1. Mobile: tắt nút ngay sau khi khách nhấn, tạo khóa idempotency duy nhất (UUID), lưu trên thiết bị để lần thử lại cũng dùng khóa cũ.
2. API gateway: giới hạn số yêu cầu của mỗi khách (rate limit), kiểm tra trùng theo khóa idempotency trong bộ nhớ đệm ngắn hạn; nếu khóa đã có, trả kết quả đã lưu không chuyển tiếp.
3. Dịch vụ nghiệp vụ: kiểm tra khóa trong cơ sở dữ liệu; nếu đã xử lý, trả kết quả cũ; nếu chưa, xử lý mới.
4. Core banking: ràng buộc duy nhất trên cột khóa idempotency, giao dịch ACID, kiểm tra số dư trước khi trừ tiền.
### Thứ tự xử lý (bước chi tiết)
1. Khách nhấn chuyển tiền trên mobile; app tạo khóa K (mã duy nhất, ví dụ UUID) và gửi yêu cầu kèm K.
2. Gateway kiểm tra bộ nhớ đệm: nếu K đã có -> trả kết quả đã lưu, không xử lý lại.
3. Nếu K chưa có, gateway chuyển tiếp yêu cầu đến dịch vụ nghiệp vụ.
4. Dịch vụ kiểm tra cơ sở dữ liệu: nếu K đã được xử lý -> trả kết quả cũ.
5. Nếu chưa, dịch vụ gọi core banking để trừ tiền.
6. Core thực hiện trong một giao dịch ACID: kiểm tra số dư, trừ tiền, lưu K cùng kết quả.
7. Kết quả chuyển ngược: dịch vụ -> gateway -> mobile.

Ví dụ số liệu: khách chuyển 5.000.000 VND, khóa K = "a1b2-c3d4". Mất mạng sau khi gửi, khách nhấn "Thử lại" cùng khóa K. Gateway/dịch vụ tìm thấy K đã xử lý -> trả về "thành công" cũ, không trừ thêm 5 triệu.
### Lỗi hay gặp
- Mobile tạo khóa mới mỗi lần thử lại -> không chặn được yêu cầu trùng, tiền có thể bị trừ nhiều lần.
- Bộ nhớ đệm gateway hết hạn trước khi core xử lý xong -> yêu cầu được xử lý hai lần (trùng).
- Core không có ràng buộc duy nhất trên cột khóa -> hai yêu cầu cùng khóa đều được trừ tiền.
- Khách tạo yêu cầu mới thay vì thử lại cùng yêu cầu cũ -> sinh giao dịch mới, không liên quan đến khóa cũ.
### Ví dụ đời thực
**Triệu chứng:** Sau một đợt nâng cấp mạng, tỷ lệ timeout giữa app mobile và API gateway tăng lên ~3% trong 20 phút. Bộ phận chăm sóc khách hàng ghi nhận 47 trường hợp khách bị trừ tiền 2 lần cho cùng một lệnh chuyển khoản (mỗi lệnh 1-10 triệu VND), tổng thiệt hại tạm tính ~180 triệu VND phải hoàn trả thủ công.

**Điều tra:** Đối chiếu log theo {{customer_id}} và số tiền cho thấy mỗi giao dịch bị nhân đôi có 2 request khác {{request_id}} nhưng cùng nội dung, gửi cách nhau 5-15 giây. Ở phía mobile, mã cũ tạo idempotency key mới mỗi lần người dùng bấm "Thử lại" (thay vì tái sử dụng key của lần gửi đầu). Ở gateway, cache kiểm tra trùng chỉ lưu 30 giây và không được chia sẻ khi scale-out, nên request thứ hai đi qua node khác không bị chặn. Core banking chưa có ràng buộc duy nhất (unique constraint) trên cột idempotency key của bảng giao dịch.

**Nguyên nhân gốc:** Thiết kế idempotency bị đứt đoạn: key không do client sinh và giữ cố định xuyên suốt vòng đời yêu cầu, các lớp không cùng một nguồn sự thật, và lớp cuối (core/DB) thiếu "chốt an toàn" là unique constraint.

**Cách xử lý:** (1) Sửa mobile: sinh {{idempotencyKey}} (UUID) ngay khi tạo lệnh, lưu kèm trạng thái lệnh và gửi lại cùng key cho mọi retry. (2) Gateway kiểm tra key trong Redis dùng chung với TTL hợp lý (ví dụ 24 giờ) và trả kết quả đã lưu nếu trùng. (3) Dịch vụ và core thêm cột {{idempotency_key}} có unique constraint; khi vi phạm ràng buộc thì đọc và trả lại kết quả giao dịch đã commit. (4) Viết job rà soát giao dịch trùng trong khoảng thời gian sự cố để hoàn tiền.

**Kết quả đo được:** Sau khi triển khai, theo dõi 30 ngày không ghi nhận thêm trường hợp trừ tiền trùng; 47 giao dịch bị ảnh hưởng được hoàn trả trong 4 giờ và đối soát khớp 100% với core.
### Trả lời mẫu khi phỏng vấn
"Khi trả lời câu hỏi chống trừ tiền hai lần, em trình bày theo tư duy end-to-end: mỗi lớp đều phải có chốt bảo vệ riêng và lớp cuối cùng phải là nguồn sự thật. Ở mobile, app tạo idempotency key (mã định danh duy nhất cho một yêu cầu) ngay khi người dùng xác nhận lệnh và giữ nguyên key đó cho mọi lần retry, đồng thời disable nút để tránh bấm lặp. Ở API gateway, em dùng rate limit và cache dùng chung để chặn request trùng sớm. Ở dịch vụ nghiệp vụ, em kiểm tra key trong cơ sở dữ liệu và trả kết quả cũ nếu đã xử lý. Quan trọng nhất, ở core banking em đặt unique constraint trên cột idempotency key và thực hiện trừ tiền trong một giao dịch ACID, nên dù có race condition thì DB vẫn chỉ cho commit một lần. Em cũng nhấn mạnh thứ tự: kiểm tra khóa trước, xử lý sau, lưu kết quả rồi mới trả về. Trong thực tế, em từng xử lý sự cố trừ tiền trùng do key bị tạo mới mỗi lần retry và thiếu unique constraint, sau khi bổ sung các lớp bảo vệ này thì sự cố không tái diễn."

> Senior tip: Trong phỏng vấn, hãy vẽ sơ đồ các lớp và chỉ ra mỗi lớp bảo vệ ở cấp nào. Nhấn mạnh khóa idempotency phải do khách tạo (không phải server) và đi xuyên suốt từ mobile đến core. Đối với tiền, việc chặn trùng quan trọng hơn việc không cho bỏ qua yêu cầu.

> Cụm từ: Idempotency key là mã duy nhất gắn với một yêu cầu, dùng để phát hiện yêu cầu được gửi lại (retry) và chỉ xử lý một lần.
  `,
  follow: [
    'Nếu mobile mất mạng sau khi gửi request, làm sao retry an toàn?',
    'Gateway cache hết hạn trước core xử lý xong, xử lý thế nào?',
    'Core banking dùng unique constraint ở cột nào?'
  ],
  tags: ['core', 'idempotency', 'end-to-end', 'mobile', 'gateway', 'core banking']
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

> Senior tip: thống kê nguyên nhân lệch theo tuần. Mỗi nhóm nguyên nhân lặp lại là một cơ hội tự động hoá hoặc sửa gốc ở hệ thống nguồn — mục tiêu là hàng chờ thủ công ngày càng ngắn, không phải thuê thêm người đối soát.
  `,
  follow: [
    'Nếu file đối tác đến muộn 2 ngày, xử lý thế nào?',
    'Làm sao phân biệt lệch thật và lệch do parse sai?',
    'Ai có quyền duyệt điều chỉnh số dư?'
  ],
  tags: ['core', 'reconciliation', 'file matching', 'discrepancy', 'maker-checker']
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

| Tiêu chí | Mainframe | Hiện đại |
|---|---|---|
| Tốc độ thay đổi | Chậm | Nhanh |
| Thực thời | Không dễ | Dễ |
| Độ phức tạp | Thấp (tập trung) | Cao (phân tán) |
| Kiểm toán | Không dễ | Dễ (nhật ký sự kiện) |
| Chi phí ban đầu | Cao | Trung bình |
| Rủi ro vận hành | Thấp | Cao hơn |

Ví dụ số liệu: một ngân hàng lớn, ổn định, gần không đổi giao dịch có thể giữ mainframe cho sổ cái; một ngân hàng số cần phát hành tính năng mới liên tục nên chọn kiến trúc hiện đại.
### Lỗi hay gặp
- Chuyển sang hiện đại nhưng không giữ nhật ký kiểm tra -> mất quyền kiểm soát.
- Hướng sự kiện không có cơ chế chặn trùng -> xử lý giao dịch hai lần.
- Batch cuối ngày vẫn quá nặng -> nghẽn vào buổi đêm.
### Ví dụ đời thực
Một ngân hàng giữ core mainframe (COBOL, batch EOD 6 tiếng mỗi đêm) nhưng cần chuyển tiền 24/7 và số dư thời gian thực trên app. Thay vì thay core một lần (dự án kiểu "big bang" của ngân hàng khác đã kéo dài 4 năm và vượt ngân sách gấp đôi), họ làm từng bước: dựng một **ledger mới bất biến** (mỗi giao dịch là bút toán kép chỉ thêm, không sửa) cho ví và tài khoản thanh toán; mainframe vẫn là sổ chính thức, đồng bộ hai chiều qua sự kiện và đối soát mỗi giờ; **số dư khả dụng** trên app được tính từ ledger mới theo thời gian thực, còn batch EOD trên mainframe chỉ tính lãi và báo cáo. Sau 18 tháng, 70% giao dịch đi qua ledger mới; thời gian batch EOD giảm còn 2 tiếng vì bớt việc. Đánh đổi: thêm hệ thống phải vận hành và đối soát giữa hai sổ trong giai đoạn chuyển tiếp.
### Trả lời mẫu khi phỏng vấn
"Core banking mainframe truyền thống rất ổn định, xử lý giao dịch tốt, nhưng thường dựa nhiều vào batch cuối ngày, khó thay đổi, khó tích hợp với kênh số 24/7, và nguồn nhân lực COBOL ngày càng hiếm. Kiến trúc hiện đại hướng tới ledger bất biến theo kế toán kép, chỉ thêm bút toán chứ không sửa, số dư thời gian thực, giao tiếp qua sự kiện, và các dịch vụ tách theo nghiệp vụ như tài khoản, thanh toán, cho vay. Batch EOD vẫn còn cho tính lãi, phí, báo cáo, nhưng nhẹ hơn. Đánh đổi là độ phức tạp phân tán: nhất quán giữa các dịch vụ, idempotency, đối soát. Thực tế hiếm ngân hàng thay core một lần; tôi ủng hộ cách strangler: dựng ledger mới cho phần cần thời gian thực, đồng bộ và đối soát với core cũ, chuyển dần nghiệp vụ, luôn có đường lui."

> Senior tip: Trong phỏng vấn, nhấn mạnh không phải "hiện đại luôn tốt hơn". Mainframe vẫn phù hợp ngân hàng lớn, ổn định, ít thay đổi; kiến trúc hiện đại phù hợp khi cần tính năng mới liên tục và xử lý thực thời. Lựa chọn phụ thuộc quy mô, ngân sách và đội ngũ vận hành.

> Cụm từ: Hướng sự kiện (event-driven) là kiến trúc xử lý theo sự kiện, các thành phần phản ứng với sự kiện thay vì gọi trực tiếp lẫn nhau.
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

> Senior tip: vẽ sơ đồ luồng dữ liệu thẻ (cardholder data flow) trước mọi thay đổi kiến trúc liên quan thanh toán. Một service mới vô tình nhận PAN là cả service đó và mọi thứ kết nối tới nó rơi vào phạm vi PCI.
  `,
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

> Senior tip: đo tỉ lệ giao dịch rơi vào trạng thái chờ tra soát theo giờ và theo ngân hàng nhận. Tỉ lệ tăng đột biến thường là dấu hiệu sớm nhất của sự cố phía đối tác — trước cả khi họ thông báo.
  `,
  follow: [
    'Tại sao không tự động retry khi timeout?',
    'Transaction ID giúp tra soát thế nào?',
    'Giao dịch treo quá một tháng xử lý ra sao?'
  ],
  tags: ['core', 'NAPAS', 'timeout', 'tra sot', 'doi soat']
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

> Senior tip: viết một bộ test end-to-end gửi cùng một khoá ở ba thời điểm (ngay lập tức, đồng thời, sau 2 giờ) và kiểm tra số bút toán. Bài test này phát hiện gần như mọi khe hở idempotency trước khi khách hàng phát hiện.
  `,
  follow: [
    'TTL của idempotency key nên là bao nhiêu cho giao dịch tiền?',
    'Nếu Redis (cache) lỗi, hệ thống tiền nên fail-closed hay fail-open?',
    'Làm sao xử lý request trùng key đang in-flight?'
  ],
  tags: ['core', 'idempotency', 'end-to-end', 'TTL', 'fail-closed', 'lead']
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
},
{
  id: 'banking-039',
  topic: 'banking',
  level: 'senior',
  q: 'Chuyển tiền giữa hai tài khoản trong sổ cái kép: làm sao ghi bút toán Nợ/Có sao cho sổ luôn cân bằng, tránh deadlock khi nhiều giao dịch đụng cùng hai tài khoản, và tính số dư hiện tại mà không quét toàn bộ bảng ledger?',
  a: `**Tóm tắt:** Một giao dịch chuyển tiền trong sổ cái kép phải ghi ít nhất hai bút toán (Nợ tài khoản người gửi, Có tài khoản người nhận) trong một giao dịch cơ sở dữ liệu, và tổng Nợ bằng tổng Có. Khi nhiều giao dịch cùng chạy, phải khóa hai tài khoản theo thứ tự cố định (theo mã tài khoản tăng dần) để tránh deadlock (vòng chờ khóa). Số dư hiện tại không nên tính bằng quét toàn bộ ledger mỗi lần; nên lưu bảng số dư snapshot và cập nhật nó trong cùng giao dịch với bút toán ledger.
### Sổ cái kế toán kép là gì (giải thích từ đầu)
Sổ cái kế toán kép (double-entry ledger) là sổ ghi mọi biến động tiền dưới dạng bút toán. Mỗi bút toán có hướng: Nợ (Debit) hoặc Có (Credit). Đối với tiền gửi của khách hàng, ghi Nợ ở tài khoản A nghĩa là tiền A bị giảm, ghi Có ở B nghĩa là tiền B tăng. Mỗi giao dịch chuyển 2.000.000 VND từ A sang B tạo hai dòng:
- Dòng 1: tài khoản A, Nợ 2.000.000 (A bị trừ)
- Dòng 2: tài khoản B, Có 2.000.000 (B được cộng)
Tổng Nợ và Tổng Có của giao dịch phải bằng nhau (2.000.000 = 2.000.000). Nếu không bằng, giao dịch bị từ chối. Chỉ được INSERT dòng mới, không UPDATE hay DELETE dòng cũ (append-only), để luôn có lịch sử kiểm toán.
### Giao dịch cơ sở dữ liệu là gì
Giao dịch DB (transaction) là gói nhiều lệnh SQL thành một đơn vị: hoặc tất cả thành công (COMMIT) hoặc tất cả thất bại (ROLLBACK). Nếu hệ thống gián đoạn giữa lúc ghi hai dòng ledger, toàn bộ bị hủy, không để lại một dòng đơn lẻ gây mất tiền.

~~~seq
title: Chuyen tien 2 tai khoan trong 1 transaction
actors: App | Dich vu | LedgerDB
App -> Dich vu: chuyen 2 trieu tu A sang B
Dich vu -> LedgerDB: BEGIN
Dich vu -> LedgerDB: khoa tai khoan co id nho hon truoc
Dich vu -> LedgerDB: INSERT DEBIT A 2 trieu
Dich vu -> LedgerDB: INSERT CREDIT B 2 trieu
Dich vu -> LedgerDB: kiem tra tong No = tong Co
Dich vu -> LedgerDB: COMMIT
Dich vu --> App: thanh cong, co ma giao dich
~~~
### Deadlock la gi va tranh nhu the nao
Deadlock (vong cho khoa) xay ra khi giao dich G1 khoa tai khoan A roi cho khoa B, cung luc G2 khoa B roi cho A. Hai giao dich cho nhau ma, he thong phai huy mot ben.
Vi du chuyen hai chieu dong thoi: G1 chuyen A-sang-B (khoa A truoc), G2 chuyen B-sang-A (khoa B truoc) -> deadlock.

Cach sua: luon khoa hai tai khoan theo thu tu ma tai khoan tang dan (id nho truoc, id lon sau). Ca G1 va G2 deu khoa A truoc roi B, nen khong bao gi cho vong tron. Neu co so du lieu phat hien deadlock, no huy mot giao dich va ung dung co the retry sau khoang thoi gian ngan.
### Tinh so du tu ledger: bang snapshot
Ledger ghi tung but toan, bang co the tram trieu dong. Tinh so du bang SUM tat ca dong cua tai khoan moi lan doc la cham. Gia phap: bang so du snapshot (moi tai khoan mot dong: account_id, balance, version). Khi ghi ledger, cap nhat so du snapshot trong cung giao dich:
- So du moi = so du cu - 2.000.000 (tai khoan A)
- So du moi = so du cu + 2.000.000 (tai khoan B)
Doc so du cho khach tu bang snapshot (nhanh), va hang ngay doc soat tong bang snapshot voi tong ledger de phat hien lech.
### Code Java (yeu tuong)
~~~java
public void transfer(String from, String to, BigDecimal amount) {
    // luon khoa hai tai khoan theo thu tu id tang dan de tranh deadlock
    String first = from.compareTo(to) < 0 ? from : to;
    String second = from.compareTo(to) < 0 ? to : from;
    db.update("BEGIN");
    db.update("SELECT * FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE", first, second);
    String txId = java.util.UUID.randomUUID().toString();
    db.update("INSERT INTO ledger_entries (tx_id, account_id, direction, amount) VALUES (?, ?, 'DEBIT', ?)", txId, from, amount);
    db.update("INSERT INTO ledger_entries (tx_id, account_id, direction, amount) VALUES (?, ?, 'CREDIT', ?)", txId, to, amount);
    db.update("UPDATE accounts SET balance = balance - ? WHERE id = ?", amount, from);
    db.update("UPDATE accounts SET balance = balance + ? WHERE id = ?", amount, to);
    db.update("COMMIT");
}
~~~
### Loi hay gap
- Khoa hai tai khoan theo thu tu ngau nhien (G1 khoa A truoc, G2 khoa B truoc) -> deadlock vao gio cao diem.
- Ghi hai but ledger khong dong mot giao dich DB -> he thong bi giua chuan luot mot dong, so sai, khong phuc hoi duoc.
- Tinh so du bang SUM toan bo ledger moi lan doc -> cham khi bang lon, khong thoa man thuc thoi.
- Dung double cho tien -> sai so lam tron, so du le mot dong.
### Ví dụ đời thực
Mot ngan hang xu ly 300.000 chuyen tien/ngay. Buoi chieu, he thong tre nhien nhieu giao dich loi deadlock. Dieu tra thay hai luong chuyen tien nguoc chieu (A->B va B->A) khong sap xep thu tu khoa tai khoan: G1 khoa A xong cho B, G2 khoa B xong cho A. Postgres huy mot giao dich, luong loi deadlock tang len 40 ca/ngay. Cach xu ly: sua code de luon khoa tai khoan co id nho hon truoc, them monitoring lock_wait. Ket qua: deadlock giam ve duoi 5 ca/ngay, giao dich chay lien lap trong gio cao diem.
### Trả lời mẫu khi phỏng vấn
"Em thiet ke chuyen tien theo so cai kep: moi giao dich ghi hai but toan, No o tai khoan gui va Co o tai khoan nhan, tong No bang tong Co, chi INSERT chu khong sua dong cu. De tranh deadlock khi nhieu giao dich dung cung hai tai khoan, em luon khoa hai hang tai khoan theo thu tu ma tang dan (id nho truoc) trong mot giao dich DB, nen hai giao dich chuyen nguoc chieu khong bao gi cho vong tron. So du hien thi cho khach em lay tu bang so du snapshot, duoc cap nhat trong cung giao dich voi but toan ledger; hang ngay em doc soat tong bang snapshot voi tong ledger de phat hien sai som. Tat ca tien tien dung BigDecimal chu khong phai double."

> Senior tip: Trong pham van, hinh dung so du la mot con so duoc phep (derived) tu so cai, khong nguyen nguyen. Nguyen nguyen la cac but toan khong bao nhi sua. Khi khoa nhieu tai khoan, luot dat quy tuc khoa theo thu tu id tang dan cho he thong toan bo, khong de moi nguoi tu quy et.

  `,
  follow: [
    'Neu hai giao dich chuyen A-sang-B va B-sang-A cung luc, tai sao khoa theo thu tu id tang dan vua phong deadlock vua khong giam nhieu hieu nang?',
    'So du snapshot bi lech so voi ledger thi xu ly ra sao khong dung dung he thong?',
    'Mot but toan dieu chinh (reversal) khi ghi sai so tien duoc viet nhu the nao tren so cai append-only?'
  ],
  tags: ['core', 'double-entry', 'ledger', 'deadlock', 'balance snapshot', 'transaction']
},
{
  id: 'banking-040',
  topic: 'banking',
  level: 'mid',
  q: 'Khi doi tac thanh toan khong co API hoi trang thai, giao dich chuyen tien bi timeout lam gi, tien nguoi gui duoc giu bao lau, va khi nao hoan tien?',
  a: `**Tóm tắt:** Timeout khi đối tác không phản hồi có nghĩa là "chưa biết kết quả", chứ không phải "thất bại". Khi đối tác chỉ gửi file đối soát hằng ngày (không có API hỏi trạng thái realtime), hệ thống phải chuyển giao dịch sang trạng thái chờ, giữ tạm tiền người gửi, không tự động hoàn tiền hay gửi lại lệnh, và chờ file đối soát hôm sau để chốt thành công hay thất bại. Giao dịch vẫn treo quá lâu phải được leo thang cho nhân viên tra soát ngoài hệ thống.
### Thuat ngu: timeout, hold, file doi soat
- Timeout (het thoi gian cho): gui lenh sang doi tac nhung khong nhan phan hop trong thoi gian cho phep (vi 10 giay).
- Hold (tam giu tien): tien cua nguoi gui duoc da danh dau khong duoc dung, chua tru het khoi so du (xem chi tiet tai banking-031).
- File doi soat: file CSV/XML cua doi tac gui hang ngay, chua danh sach giao dich va trang thai cua tung giao dich do dai xu ly.
### May trang thai giao dich khi khong co API tra sot
~~~text
[SENT] --nhan SUCCESS--> [THANH_CONG]
[SENT] --nhan FAILED--> [THAT_BAI] -> hoan tien tam giu
[SENT] --timeout/mang loi--> [CHO_DOI_FILE] -> tien duoc hold
[CHO_DOI_FILE] --file doi soat co giao dich, thanh cong--> [THANH_CONG] -> ghi no chinh thuc
[CHO_DOI_FILE] --file doi soat co giao dich, that bai/khong co--> [CAN_THUC_SOAT] -> nhan vien lien he doi tac
~~~

Khi timeout, he thong khong bao loi ngay cho khach, ma thong bao "dang xu ly, vui long cho". Tien duoc hold (tam giu) de khach khong chi tieu nhieu lai.
### Khong tu dong hoan ngay va khong tu dong gui lai
Neu coi timeout = that bai va hoan tien ngay, truong hop doi tac da xu ly thanh cong nhung phan hoi bi mat se tien duoc hoan hai lan. Neu tu dong gui lai lenh moi, cung co nguy trac tien nhan duoc hai lan. Dung: dung lai, cho doi tac co thoi gian xu ly, chu ki file doi soat hinh thuc chot ket qua.
### Giu hold bao lau
Dat thoi gian toan cuc (TTL) cho hold, vi du 7 ngay. Mot job chay moi 4 gio quet cac giao dich CHO_DOI_FILE qua 48 gio chua co file doi soat: gui canh bao nhan vien, nhan vien lien he doi tac qua email/dien thoai de xac dinh trang thai. Chua co ket qua chinh thuc thi khong tu y hoan, vi tien van co the dang o doi tac.
### Vi du so lieu
Mot he thong xu ly 5.000 chuyen tien/ngay, khoang 0,5% bi timeout. File doi tac gui den luc 10:00 hom sau. Trong ca nghi, 25 giao dich bi timeout va file cua doi tac bi gui tre mot ngay vi ngay le. He thong hold tien cho 25 giao dich, khach thong bao dang xu ly. File den hom sau: 22 giao dich thanh cong (ghi no), 3 giao dich khong co trong file (lien he doi tac, xac nhan that bai, hoan tien). Ket qua: 0 truong hop tru tien hai lam, 0 tien duoc hold qua 7 ngay.
### Code/SQL (yeu tuong)
~~~sql
CREATE TABLE transfer_tx (
  id            BIGINT PRIMARY KEY,
  partner_ref   VARCHAR(64) NOT NULL UNIQUE, -- ma tham chieu duy tien gui doi tac
  status        VARCHAR(20) NOT NULL,        -- SENT / CHO_DOI_FILE / THANH_CONG / THAT_BAI
  amount        NUMERIC(20,0) NOT NULL,
  hold_amount   NUMERIC(20,0) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL
);
-- job quet hold qua han
SELECT id FROM transfer_tx
WHERE status = 'CHO_DOI_FILE' AND created_at < now() - interval '48 hours';
~~~
### Loi hay gap
- Timeout xem that bai va hoan tien ngay -> tien co da o doi tac, hoan hai lan.
- Cho khach bam gui lai khi giao dich dang treo -> tao giao dich moi, tien nhan duoc hai lan.
- Khong luu ma tham chieu duy tien -> khong the tra sot khi file den.
- Hold khong co thoi gian het han -> tien khach bi khoa vinh vien.
- Tu y hoan tien sau N phut timeout chua xac dinh -> co the hoan nham khi doi tac da xu ly thanh cong.
### Ví dụ đời thực
Mot van phong giao dich xu ly tien cho doanh nghiep. Mot ngay, 200 giao dich bi timeout vi he thong doi tac bi tre. Dev sai lam tu dong hoan tien cho het sau 30 phut, ket qua 15 giao dich thuc da thanh cong o doi tac, tien duoc hoan ve nguoi gui nhung nguoi nhan van du tien -> ngan hang mat 450 trieu, phai goi dien loi moi khach. Cach xu ly: dung hoan tu dong, chuyen sang trang thai cho, kiem file doi soat hom sau, chi hoan khi co xac nhan that bai hoac qua 7 ngay voi phe duyet nhan vien. Ket qua: thang sau khong con tru tien hai lam, khieu nai giam 90%.
### Trả lời mẫu khi phỏng vấn
"Khi giao dich sang doi tac bi timeout, em khong coi do la that bai — chi la chua biet ket qua. Giao dich chuyen sang trang thai cho, tien nguoi gui duoc giu tam (hold), ung dung thong bao khach "dang xu ly" va khong cho gui lai lenh moi. Vi doi tac chi gui file doi soat hang ngay, khong co API hoi trang thai, he thong cho file hom sau: giao dich trong file va thanh cong thi ghi no chinh thuc, trong file va that bai thi hoan tien tam giu, khong co trong file thi chuyen cho nhan vien lien he doi tac. Moi giao dich chi hoan tien khi co xac nhan that bai hoac sau thoi gian TTL (vi du 7 ngay) ke phe duyet nhan vien. Ma tham chieu duy tien duoc luu de doc soat chinh xac khi file den."

> Senior tip: Tham lam hoan tien ngay khi timeout la sai nghia trong thanh toan. Tien an toan hon trinh tu nhanh: thà ba khach cho it nhat co het hon hoan/ghi trung sai. Luon co mot gioi han thoi gian cho hold va mot nguoi chi tra khi hold qua han.

  `,
  follow: [
    'Tai sao khong tu dong hoan tien ngay khi giao dich voi doi tac bi timeout?',
    'File doi tac gui tre 2 ngay, he thong xu ly giao dich cho nhu the nao?',
    'Nhan vien duoc phep hoan tien giao dich cho khi nao, can phan duyen khong?'
  ],
  tags: ['core', 'timeout', 'hold', 'doi tac', 'file doi soat', 'tra sot']
},
{
  id: 'banking-041',
  topic: 'banking',
  level: 'mid',
  q: 'Doi soat cuoi ngay giua he thong core banking va so cai ke toan (GL): tien chua khop nam o tai khoan suspense ra sao, va xu ly khoan chua khop nhu the nao?',
  a: `**Tóm tắt:** Core banking là sổ giao dịch của khách hàng, còn sổ cái kế toán (GL) là sổ tổng hợp của toàn ngân hàng. Cuối ngày, tổng số tiền trong core phải bằng tổng các bản ghi kế toán tương ứng trong GL. Khoản tiền đã ghi trong core nhưng chưa rõ sổ kế toán nào được đặt vào tài khoản suspense (tài khoản chờ đối soát). Mọi khoản chưa khớp phải được tra soát và điều chỉnh bằng bút toán mới (append-only), có người duyệt (maker-checker), không được sửa trực tiếp số liệu cũ.
### Core banking va GL (giai thich tu dau)
Core banking luu so du va lich su cua tung tai khoan khach hang. GL (General Ledger - so cai tong hop) luu cac tai khoan ke toan tong hop: tien gui khach hang, tien vay, phi, lai... Moi giao dich trong core (vi du khach A chuyen 2 trieu cho B) tao ra but toan ke toan: ghi co tai khoan tong hop "Tien gui khach hang" tai chi nhanh A, ghi no tai khoan tong hop tai chi nhanh B...
So du cua khach trong core tong lai phai bang so du tai khoan tong hop trong GL. Neu khac -> co lech can xet xet.
### Tai khoan suspense (tai khoan cho doi soat) la gi
Suspense la tai khoan tam dung de "chan" tien khi chua biet ghi vao tai khoan chinh thuc dau. Vi du: giao dich chuyen tien giua hai chi nhanh ma chi nhanh nhan ma sai so tai khoan, he thong khong biet ghi tien cho ai -> dua tien vao tai khoan suspense de so du khong bi sai, sau khi tim chu so huu thi chuyen tien ra tai khoan chinh.
### Quy trinh doi soat cuoi ngay noi bo
1. Lay tong so du tat ca tai khoan khach tu core va tong so du cac tai khoan tong hop tu GL.
2. Neu hai tong khac nhau -> tien con lai la lech, can tim tung giao dich.
3. Xet tung giao dich: so sanh ma giao dich, so tien, thoi gian giua core va GL.
4. Phan loai: khop (MATCH) hoac lech (BREAK).
5. Xu ly break: tim nguyen nhan (ma tai khoan sai, giao dich tre, tien duoc dua vao suspense...), tao but toan dieu chinh moi, co nguoi duyet (maker-checker), cap nhat trang thai.
### Vi du so lieu
Core tong 500.000.000.000 VND (500 ty), GL tong 499.800.000.000 VND. Lech 200.000.000 VND (200 trieu). Dieu tra thay 3 giao dich: (1) chuyen 50 trieu giua chi nhanh ma code sai tai khoan -> tien o tai khoan suspense; (2) giao dich 100 trieu bi timeout, core chua ghi nhung GL da ghi (hoac nguoc lai); (3) phi dich vu 50 trieu chua duoc ghi vao GL. Xu ly: chuyen 50 trieu tu suspense ve tai khoan chinh, bo sung but toan phi vao GL, cap nhat giao dich timeout. Sau do tong hai he thong bang nhau.
### Code/SQL (yeu tuong)
~~~sql
SELECT 'CORE' AS NGUON, SUM(balance) FROM accounts
UNION ALL
SELECT 'GL', SUM(balance) FROM gl_accounts WHERE account_type = 'CUSTOMER_DEPOSIT';
-- bang suspense
CREATE TABLE suspense (
  id            BIGINT PRIMARY KEY,
  amount        NUMERIC(20,0) NOT NULL,
  reason        VARCHAR(200),
  created_at    TIMESTAMPTZ NOT NULL,
  resolved_at   TIMESTAMPTZ,
  resolved_by   VARCHAR(50)
);
~~~
### Loi hay gap
- Chi so sanh tong tien -> 2 sai lech xuong voi nhau se bo qua duoc (50 trieu thieu tai A va thua 50 trieu tai B, tong van bang).
- Dieu chinh so lieu cu thang (UPDATE xoa du lieu cu) -> mat lich su kiem tra, khong biet loi xua dau o dau.
- Khong quan ly thoi gian cua tien trong suspense -> tien o tai khoan suspense thang nam khong ai xu ly.
- Dieu chinh khong qua nguoi duyet -> nhan vien co the sua so tien theo muon, nguy ro gian lan.
### Ví dụ đời thực
Mot ngan hang co 200 chi nhanh. Cuoi ngay, bo kiem toan thong bao so core va so GL lech 120.000.000 VND. Dieu tra thay mot giao dich chuyen 120 trieu giua hai chi nhanh ma nhan vien nhap sai ma tai khoan nhan, tien duoc dua vao tai khoan suspense ma khong ai kiem tra trong 3 ngay. Cach xu ly: sua ma tai khoan, tao but toan chuyen tien tu suspense ve tai khoan chinh, nhan vien kiem toan duyet, ghi lich su. Bo sung bo canh bao khi tien trong suspense qua 24 gio chua duoc giai quyet. Ket qua: lech cuoi ngay giam ve 0, tien trong suspense xu ly duoi 24 gio.
### Trả lời mẫu khi phỏng vấn
"Core banking luu so du tung khach hang, con so cai ke toan (GL) luu tong hop theo tai khoan ke toan. Cuoi ngay em doc soat tong core voi tong GL; neu khac, em xem xet tung giao dich de tim khoan chua khop. Tien chua ro so ke toan nao duoc dat vao tai khoan suspense (tai khoan cho doi soat) thay de de so sai lorspr. Moi khoan chua khop duoc dieu chinh bang but toan moi (append-only), khong sua dong cu, va phai co nguoi khac duyet (maker-checker) truoc khi ghi so. Em cung theo doi tai khoan suspense de tien khong bi treo ma."

> Senior tip: Trong pham van, hinh thanh toan "so cua chung ta phai bang so cua ke toan" la cau chot. Nhat dinh phai xem xet tung giao dich khong chi so tong, vi tong khop van co the che duoc sai lech buo tro nhau. Co loi hay gap la chua quan ly thoi gian cua tien trong tai khoan suspense.

  `,
  follow: [
    'Tai sao chi doc soat tong tien khong du, phai kiem tra tung giao dich?',
    'Tai khoan suspense dung cho truong hop nao, va tien trong suspense qua han xu ly ra sao?',
    'Dieu chinh so cai sau doi soat phai co nguoi duyet khong, tai sao?'
  ],
  tags: ['core', 'doi soat', 'core banking', 'GL', 'suspense', 'maker-checker']
},
{
  id: 'banking-042',
  topic: 'banking',
  level: 'senior',
  q: 'Khoan vay tra gop hang thang: lai moi ky lam tron the nao, phan du khi chia cho 12 thang duoc cong vao ky nao, va dung BigDecimal nhu the nao cho dung?',
  a: `**Tóm tắt:** Khoản vay trả góp (installment loan - khách vay một khoản tiền và trả dần theo nhiều kỳ, ví dụ 12 tháng) đòi hỏi tính lãi chính xác từng kỳ và làm tròn về đồng VND (tiền Việt Nam, không có xu/cent). Tiền phải tính bằng {{BigDecimal}} (kiểu số thập phân chính xác của Java, không bị lỗi làm tròn như {{double}}). Mỗi kỳ làm tròn về số nguyên đồng; phần dư do chia không hết (ví dụ 10.000 chia 3) phải được cộng vào một kỳ cố định (thường kỳ cuối) để tổng tiền sau 12 kỳ khớp đúng hợp đồng, không lệch dù chỉ 1 đồng.
### Thuật ngữ cơ bản
- **Dư nợ (outstanding balance)**: số tiền gốc khách còn nợ tại đầu kỳ.
- **Lãi suất năm (annual rate)**: tỷ lệ lãi tính trên một năm (ví dụ 6%/năm = 0.06).
- **Actual/365**: quy ước đếm ngày lãi lấy số ngày thực tế chia cho 365 (phổ biến cho VND); có thể gặp actual/360 tùy sản phẩm.
- **Làm tròn (rounding)**: biến số có phần thập phân thành số nguyên theo quy tắc; {{RoundingMode.HALF_UP}} làm tròn 0.5 lên 1, {{RoundingMode.HALF_EVEN}} (banker rounding - làm tròn về số chẵn gần nhất) giảm thiên lệch khi cộng nhiều số.
- **Phần dư (remainder)**: số tiền lẻ còn lại sau khi chia đều (ví dụ 10.000 / 3 = 3.333 dư 1).
### Cơ chế tính từng bước
1. **Không dùng {{double}}/{{float}}**: các kiểu này lưu số theo chuẩn nhị phân IEEE 754 nên 0.1 + 0.2 có thể ra 0.30000000000000004. Với tiền, sai số cộng dồn qua 12 kỳ và hàng chục nghìn hợp đồng sẽ thành chênh lệch thật. Luôn khởi tạo {{BigDecimal}} từ chuỗi: {{new BigDecimal(\"120000000\")}}, không phải từ {{double}}.
2. **Tính lãi mỗi kỳ**: lãi kỳ = dư nợ nhân lãi suất năm nhân số ngày kỳ chia 365. Tính trung gian giữ nhiều chữ số thập phân (ví dụ scale 10), chỉ {{setScale(0, RoundingMode.HALF_UP)}} ở bước ra kết quả tiền VND.
3. **Làm tròn và bù phần dư**: nếu tổng lãi phải khớp một con số hợp đồng đã định trước, chia bằng {{divideAndRemainder}} để lấy phần nguyên và phần dư, gán phần dư vào kỳ cuối (hoặc theo quy ước nghiệp vụ đã thống nhất với kế toán). Nếu tính lãi từng kỳ độc lập rồi cộng, tổng sau làm tròn có thể lệch 1-2 đồng; khi đó điều chỉnh kỳ cuối sao cho tổng các kỳ bằng tổng lãi hợp đồng.
4. **Nhất quán**: toàn hệ thống phải dùng cùng {{RoundingMode}}, cùng quy ước đếm ngày, cùng quy tắc bù phần dư.

~~~java
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

class LoanInterest {
  // Phân bổ tổng lãi hợp đồng thành từng tháng, bù phần dư vào kỳ cuối
  static List<BigDecimal> splitTotalInterest(BigDecimal totalInterest, int months) {
    BigDecimal[] div = totalInterest.divideAndRemainder(BigDecimal.valueOf(months));
    BigDecimal base = div[0].setScale(0, RoundingMode.DOWN); // phần nguyên mỗi kỳ
    BigDecimal remainder = div[1].setScale(0, RoundingMode.DOWN); // phần lẻ còn lại
    List<BigDecimal> result = new ArrayList<>();
    for (int i = 0; i < months; i++) {
      BigDecimal part = base;
      if (i == months - 1) part = part.add(remainder); // kỳ cuối nhận phần dư
      result.add(part);
    }
    return result;
  }

  // Tính lãi một kỳ trên dư nợ giảm dần (declining balance)
  static BigDecimal interestForPeriod(BigDecimal outstanding, BigDecimal annualRate, int days) {
    BigDecimal dailyRate = annualRate.divide(BigDecimal.valueOf(365), 10, RoundingMode.HALF_UP);
    BigDecimal interest = outstanding.multiply(dailyRate).multiply(BigDecimal.valueOf(days));
    return interest.setScale(0, RoundingMode.HALF_UP); // VND không có phần thập phân
  }
}
~~~
### Lỗi hay gặp
- Dùng {{double}} hoặc khởi tạo {{BigDecimal}} từ {{double}} -> sai số nhị phân, tổng 12 kỳ không khớp hợp đồng.
- Gọi {{divide}} không chỉ định {{scale}} và {{RoundingMode}} -> {{ArithmeticException}} khi chia không hết (ví dụ 10/3).
- Làm tròn mỗi kỳ nhưng không bù phần dư -> lệch 1-3 đồng/hợp đồng, kiểm toán từ chối.
- Mỗi module tự chọn {{RoundingMode}} hoặc quy ước ngày khác nhau -> hai hệ thống tính ra hai số khác nhau cho cùng khoản vay.
### Ví dụ đời thực
Một công ty tài chính có 50.000 hợp đồng vay trả góp 12 tháng. Tháng đầu go-live, bộ phận kế toán đối soát thấy tổng lãi 12 tháng trên sổ cái không khớp tổng lãi chi tiết từng hợp đồng: mỗi hợp đồng lệch 1-3 đồng, cộng dồn cả tháng lệch vài chục nghìn đồng, báo cáo lãi/lỗ không cân. Điều tra cho thấy code dùng {{double}} và làm tròn mỗi kỳ nhưng không bù phần dư. Cách xử lý: đổi toàn bộ tính tiền sang {{BigDecimal}} khởi tạo từ chuỗi, tách hàm chia {{divideAndRemainder}} để bù phần dư vào kỳ cuối, viết unit test cho các biên (chia hết, dư 1, dư 11, khoản lớn). Sau vá, 100% hợp đồng khớp tổng đến từng đồng và báo cáo được kiểm toán chấp nhận.
### Trả lời mẫu khi phỏng vấn
"Với khoản vay trả góp 12 tháng, em tính toàn bộ tiền bằng {{BigDecimal}} khởi tạo từ chuỗi, không dùng {{double}} vì {{double}} có sai số nhị phân. Lãi mỗi kỳ tính trên dư nợ: dư nợ nhân lãi suất năm nhân số ngày thực tế chia 365, giữ scale trung gian lớn rồi mới {{setScale(0, RoundingMode.HALF_UP)}} vì VND không có phần thập phân. Nếu hợp đồng quy định tổng lãi cố định, em dùng {{divideAndRemainder}} để chia đều và cộng phần dư vào kỳ cuối theo quy ước đã thống nhất với kế toán, đảm bảo tổng 12 kỳ khớp hợp đồng đến từng đồng. Toàn hệ thống phải thống nhất một {{RoundingMode}} và một quy ước đếm ngày; em sẽ viết unit test cho các trường hợp chia hết và có dư để chặn hồi quy."

> Senior tip: Lệch 1 đồng là lỗi nghiêm trọng trong kiểm toán ngân hàng. Luôn chốt quy ước "phần dư cộng vào kỳ nào, {{RoundingMode}} nào, actual/365 hay actual/360" bằng văn bản với nghiệp vụ/kế toán trước khi code, và khóa bằng test tự động.
`,
  follow: [
    'Tai sao VND khong co phan thap phan va dieu do anh huong the nao den code?',
    'Phan du do lam tro duoc cong vao ky tra cuoi hay phan bo deu, chon cai nao va tai sao?',
    'Hai lap trien vien tinh cung mot khoan vay ra hai con so khac nhau, nguyen nhan thuong la gi?'
  ],
  tags: ['tra gop', 'lai', 'BigDecimal', 'lam tron', 'phan du']
},
{
  id: 'banking-043',
  topic: 'banking',
  level: 'mid',
  q: 'Import file giao dịch từ đối tác mới sang: file có thể được gửi lại khi lỗi mạng, làm sao import không tạo giao dịch trùng và không làm fail toàn bộ file vì một dòng sai?',
  a: `**Tóm tắt:** Hàng sáng, hệ thống nhận file giao dịch từ đối tác (CSV/XML/ISO). File có thể được gửi lại nhiều lần (re-send) khi mạng lỗi. Mỗi dòng trong file có mã tham chiếu duy nhất của đối tác. Import phải idempotent: mã tham chiếu đã xử lý thì bỏ qua, không tạo giao dịch mới. Một dòng sai (số tiền sai định dạng, mã tài khoản không tồn tại) không được làm fail toàn bộ file — đưa vào hàng đợi lỗi để nhân viên xử lý, các dòng còn lại vẫn nhập bình thường.
### File giao dịch là gì và tại sao gửi lại
File giao dịch là danh sách các giao dịch của đối tác trong một ngày (ví dụ Napas gửi file dịch vụ, file the...). Mạng lỗi -> đối tác gửi lại cùng một file hoặc file mới chứa những giao dịch cũ. Nếu hệ thống không kiểm tra trùng, những giao dịch cũ được nhập hai lần -> tiền được cộng hai lần.
### Mã tham chiếu duy nhất trên mỗi dòng
Mỗi dòng trong file có mã tham chiếu duy nhất (ví dụ RRN - Retrieval Reference Number trong giao dịch the, hoặc STAN). Hệ thống lưu mã đã xử lý trong bảng với ràng buộc duy nhất (unique constraint). Trước khi nhập dòng, kiểm tra mã đã có chưa:
- Đã có -> bỏ qua dòng, trả kết quả cũ (idempotent).
- Chưa có -> nhập giao dịch, lưu mã.

~~~sql
CREATE TABLE imported_tx (
  partner_ref   VARCHAR(64) NOT NULL,
  import_date   DATE NOT NULL,
  amount        NUMERIC(20,0) NOT NULL,
  status        VARCHAR(20) NOT NULL,
  PRIMARY KEY (partner_ref, import_date) -- cùng một mã chỉ được nhập một lần mỗi ngày
);
~~~
### Không fail toàn bộ file vì một dòng sai
Chỉ định nhập theo batch: đọc từng dòng, kiểm tra, nếu dòng sai (số tiền sai, tài khoản không tồn tại, mã bị trùng trong cùng file) -> ghi vào bảng lỗi với lý do, tiếp tục dòng tiếp theo. Cuối cùng báo cáo: tổng số dòng, số dòng thành công, số dòng lỗi, danh sách lý do. Nhân viên sửa dòng lỗi, chạy lại chỉ những dòng lỗi (vì mã tham chiếu đã lưu, chạy lại không tạo trùng).
### Xử lý file bị gửi trung
Hai file giao nhau hoặc cùng file gửi hai lần: mã tham chiếu trung ở bảng imported_tx -> tất cả dòng trung bị bỏ qua, chỉ nhập dòng mới. Tính kết quả của file lần hai giống lần đầu (không tạo giao dịch thêm).
### Code ý tưởng (Java)
~~~java
void importFile(List<TransactionRow> rows, LocalDate date) {
    for (TransactionRow row : rows) {
        try {
            // insertIfNew và ledgerService.post phải trong CÙNG một transaction
            txTemplate.execute(status -> {
                boolean inserted = txRepo.insertIfNew(row.partnerRef(), date, row.amount(), row.status());
                if (!inserted) return false; // đã xử lý, bỏ qua
                ledgerService.post(row); // ghi sổ cái
                return true;
            });
        } catch (Exception e) {
            errorQueue.add(row, e.getMessage()); // dòng lỗi, không dùng toàn bộ file
        }
    }
}
~~~
### Lỗi hay gặp
- Kiểm tra trung trong bộ nhớ đệm (cache) thay DB -> máy khởi động lại mất cache, nhập trùng.
- Một dòng sai dùng toàn bộ file -> nhiều giao dịch hợp lệ không được nhập.
- Không có mã tham chiếu duy nhất -> không biết dòng nào đã xử lý, chỉ được so sánh số tiền + thời gian (bị gặp nhiều giao dịch cùng số tiền).
- Nhập dòng lỗi nhưng không ghi lý do -> nhân viên không biết sửa sao.
### Ví dụ đời thực
Một ngân hàng nhận file Napas khoảng 100.000 dòng/ngày. Một ngày, lỗi mạng dịch vụ gửi lại file cũ kèm file mới. Dev cũ nhập thuần túy không kiểm tra trung -> 2.300 giao dịch được nhập hai lần, tổng tiền dup 12 tỷ VND, phải hoàn về thủ công. Dev sửa: thêm bảng imported_tx với mã tham chiếu duy nhất, kiểm tra trước khi nhập, dòng lỗi đưa vào hàng đợi lỗi, bỏ qua, chạy lại chỉ dòng lỗi. Kết quả: ngày sau không còn giao dịch nhập trung, nhập file xử lý được 100.000 dòng ít nhất 99.5% thành công, lỗi được xử lý cùng ngày.
### Trả lời mẫu khi phỏng vấn
"File giao dịch từ đối tác mới sang có thể bị gửi lại khi mạng lỗi, nên import phải chặn trung. Em dùng mã tham chiếu duy nhất của đối tác (RRN/STAN) làm khóa chính cùng ngày import, kiểm tra trước khi nhập: mã đã có thì bỏ qua, chưa có thì mới ghi sổ. Import theo dòng, không dùng một transaction cho toàn bộ file: dòng sai (sai định dạng, tài khoản không tồn tại) đưa vào hàng đợi lỗi với lý do chi tiết, các dòng hợp lệ vẫn nhập bình thường. Sau khi xong, báo cáo tổng dòng, dòng thành công, dòng lỗi. Nhân viên chỉ cần sửa và nhập lại hàng đợi lỗi — vì mã đã lưu, nhập lại không tạo giao dịch trung."

> Senior tip: Nhập file đối tác là nơi xảy ra lỗi "nhập trung" quan trọng nhất bởi vì file đến tháng năm và người gửi tự động gửi lại khi lỗi. Ràng buộc duy nhất ở DB, không chỉ trong bộ nhớ đệm, và một transaction cho mỗi dòng (không fail toàn bộ file) là hai chốt.

  
  `,
  follow: [
    'Nếu cùng một file được gửi lại hai lần cùng lúc (hai luồng), hệ thống xử lý như thế nào?',
    'Một dòng trong file bị lỗi, các dòng sau vẫn được nhập hay dừng toàn bộ file? Tại sao?',
    'Mã tham chiếu duy nhất được tạo ở đâu, và nếu đối tác không có mã nào thì làm gì?'
  ],
  tags: ['import file', 'idempotency', 'doi tac', 'batch', 'hang doi loi']
},
{
  id: 'banking-044',
  topic: 'banking',
  level: 'lead',
  q: 'Tham chieu du lieu (lai suat, phi, cut-off) co hieu luc theo ngay: lam sao luu phien ban, ai duoc thay doi, va audit trail khong sua duoc?',
  a: `**Tóm tắt:** Lãi suất tiền gửi, phí dịch vụ, giờ cut-off thay đổi theo thời gian. Không được lưu một giá trị duy nhất và ghi đè khi thay đổi, vì sổ cũ phải tính theo lãi suất ngày mở sổ. Cần lưu phiên bản (version) kèm ngày bắt đầu và ngày hết hiệu lực (effective_from, effective_to). Mọi thay đổi phải ghi ai, khi nào, từ giá trị gì sang giá trị gì vào audit trail append-only, không được sửa hoặc xóa. Chỉ người có quyền (ví dụ quản lý sản phẩm) mới được thay đổi, và mỗi bản ghi mới phải được duyệt trước khi có hiệu lực.
### Tham chieu du lieu la gi
Tham chieu du lieu la du lieu quy tuc duoc nhieu giao dich su dung: bang lai suat theo tung ky han, bang phi, ngay gio cut-off, danh sach ngay nghi. Khac voi giao dich (moi khach mot dong), tham chieu du lieu it dong nhanh anh huong den tram trieu giao dich.
### Luu phien ban theo ngay
~~~text
bang deposit_rate:
rate_id, product_code, term_months, rate_value, effective_from, effective_to, created_by, created_at, approved_by, approved_at, status
Vi du: KY12M, 12 thang, 7.5%, tu 01/01/2024 den 30/09/2024, approved
Vi du: KY12M, 12 thang, 4.2%, tu 01/10/2024 den null (co luc), approved
~~~

Job tinh lai hang ngay (accrual) join theo dieu kieu effective_from <= ngay_tinh < effective_to. Nhu va so mo nam 2023 van duoc tinh theo 7.5% neu bang co phien ban cu, khong bi ghi de boi lai suat moi.
### Ai duoc thay doi va duyet truoc
- Nhan vien san pham tao yeu thay doi lai suat/phi (trang thai PENDING).
- Nhan vien khac (checker) duyet hoac tu choi (maker-checker, xem banking-026).
- Sau duyet, ban ghi moi co effective_from tu ngay xac dinh, ban ghi cu co effective_to = ngay truoc ngay effect moi. Khong bao nhi sua ban ghi cu (append-only).
### Audit trail khong sua duoc
Moi thay doi luu: nguoi thuc hien, thoi gian, hanh dong (TAO/THAY_DOI/DUYET), loai tai nguyen (bang lai suat), id ban ghi, gia tri truoc (before_json), gia tri sau (after_json), dia chi IP, ket luat (OK/DENY). Luu o kho an toan (WORM, ghi mot lan doc nhieu), nguoi quan tri he thong cung khong xoa duoc.
### Loi hay gap
- Luu mot gia tri duy tinh, ghi de khi thay doi -> so cu tinh sai lai, khieu nai hang tram khach.
- Cho bo phan vien IT sua truc tiep du lieu trong DB, khong qua duyet -> khong co nguoi tra chiu, nguy ro gian lan.
- Audit log thieu truoc/sau -> khong biet xem chinh sua gi.
- Ghi de ban ghi cu thay vi tao ban ghi moi -> so duoc nhap thanh thang cu khong phuc hoi duoc.
### Vi du doi thuc
Mot ngan hang quan ly 2 trieu so tiet kiem. Quy 1/2023 lai ky 12 thang 7.5%/nam. Quy 3, thi truong giam, ngan hang giam bieu lau xuong 4.2%. 15.000 khach goi khieu nai "lai bi giam giua chuan". Dieu tra thay bang deposit_rate chi co mot dong cho moi ki han, khong co cot effective_from/effective_to. Cap nhat lai moi ghi de lai cu, job tinh lai hang ngay dung lai 4.2% cho ca so mo dau nam 2023. Nguyen nhan khong phien ban lai suat theo ngay. Cach xu ly: chay script bo dam chenh lech lai cho 15.000 so (tinh lai theo 7.5% tu ngay mo den hom nay), them cot rate_version voi effective_from/effective_to, job accrual va tat toan join theo dieu kieu ngay. Ket qua: khong con khieu nai lai sai, kiem toan chap nhan bao cao lai theo phien ban dung.
### Tra loi muon khi pham van
"Em luu tham chieu du lieu (lai suat, phi, cut-off) theo phien ban: moi ban ghi co effective_from va effective_to, va trang thai duyet. Job tinh lai hang ngay chi ap dung ban ghi co ngay tinh nam trong khoang [effective_from, effective_to), nen so cu van duoc tinh theo lai suat ky luc mo so, khong bi anh huong bieu lau moi. Moi thay doi phai qua yeu cau maker-checker, luu audit trail append-only (ai, luc nao, truoc/sau, IP, ket qua), khong sua/xoa ban ghi cu. Thuc te: mot ngan hang giam lai suat thang 9 nhung bi ghi de, 15.000 khach khieu nai; sau khi bo dam va them phien ban, khong con khieu nai nao."

> Senior tip: Cau tro cho lead la tach ba luc: lai suat theo hop dich (khong doi, luu theo ngay mo), bieu lau thi truong (thay doi), chinh sach lam tro/phi (cau hinh). Khoi dong pham van bang cau "toi se luu phien ban va khoa cong thuc theo ngay" — trong ngan hang thuc su, nhung dieu nay duoc xay dung sau cac su co khieu nai lai.

  `,
  follow: [
    'Hai ban ghi lai suat co khoang thoi gian dung nhau (overlap) he thong xu ly the nao?',
    'Job tinh lai can biet bang phien ban nao de ap dung, va kiem tra duoc tai cau lenh SQL nhat the nao?',
    'Nhan vien IT sua truc tiep bang lai suat trong DB, he thong phat hien duoc khong?'
  ],
  tags: ['tham chieu du lieu', 'phien ban', 'lai suat', 'audit trail', 'effective-dated']
},
{
  id: 'banking-045',
  topic: 'banking',
  level: 'senior',
  q: 'Tích hợp core banking (T24, Temenos) qua API/ESB diễn ra thế nào: pattern adapter, canonical model, idempotency, và cách xử lý giao dịch phân tán khi core không hỗ trợ transaction 2PC?',
  a: `**Tóm tắt:** Core banking hiện đại (T24 Transact, Temenos T24) thường không cho phép transaction phân tán 2PC (two-phase commit) từ bên ngoài. Tích hợp an toàn dùng **adapter/anti-corruption layer** với **canonical model** trung gian: hệ thống chuyển đổi lệnh nghiệp vụ sang định dạng core (API REST/JSON hoặc message queue), đảm bảo idempotency bằng khóa duy nhất, và dùng **saga** (bước bù trừ) thay vì 2PC khi luồng đi qua nhiều hệ thống. ESB (Enterprise Service Bus - bus dịch vụ doanh nghiệp, thành phần trung gian điều phối và chuyển đổi thông điệp giữa các hệ thống) đóng vai trò điều phối, biến đổi định dạng, và đảm bảo gửi nhận tin cậy (guaranteed delivery - không mất message khi truyền).
### Tích hợp core banking là gì (giải thích từ đầu)
 Core banking là "trái tim" lưu sổ cái, số dư, sản phẩm. Các hệ thống xung quanh (internet banking, mobile, CRM, thanh toán, cho vay) cần gọi core để: tra số dư, trừ/cộng tiền, mở tài khoản, thay hạn mức... Core thườngExpose API (REST, SOAP) hoặc nhận message qua message queue (IBM MQ, Kafka). Vì core là hệ thống cũ, ổn định, không dễ thay đổi, nên **không được phép** các hệ thống ngoài gọi thẳng vào bảng dữ liệu của core — mọi thứ phải đi qua giao diện chuẩn.
### Adapter / Anti-corruption layer (ACL)
 ACL là lớp trung gian bảo vệ core khỏi sự thay đổi của hệ thống ngoài, và ngược lại. Hệ thống ngoài nói "ngôn ngữ nghiệp vụ của mình" (ví dụ JSON field camelCase), ACL dịch sang "ngôn ngữ của core" (ví dụ XML ISO 20022, hoặc T24 jBASE record format). Lợi ích:
 - Core thay đổi phiên bản -> chỉ sửa ACL, không sửa 20 hệ thống gọi.
 - Hệ thống ngoài đổi field -> chỉ sửa ACL, core không biết.
 - ACL validate, enrich dữ liệu trước khi gửi core (ví dụ thêm ngày nghiệp vụ, mã chi nhánh).
### Canonical model (mô hình chuẩn nội bộ)
 Thay vì map N hệ thống x M hệ thống trực tiếp, dùng một mô hình trung gian (canonical) biểu diễn nghiệp vụ theo ngữ nghĩa chung:
 ~~~text
 Hệ thống A --map--> Canonical Model <--map-- Hệ thống B
 Hệ thống C --map--> Canonical Model <--map-- Core Banking (T24)
 ~~~
 Canonical model định nghĩa: Money(amount, currency), Account(id, type, status), Transaction(id, type, amount, accounts[], referenceId, businessDate...). Mỗi adapter chỉ map 1 chiều: hệ thống <-> canonical.
### Idempotency xuyên suốt
 Core banking thường **không** tự nhiên idempotent cho mọi API. Adapter phải tự đảm bảo:
 1. Client gửi {{idempotency-key}} (UUID) kèm yêu cầu.
 2. Adapter lưu key + hash request + trạng thái trong DB (unique constraint trên key).
 3. Gọi core: nếu core thành công -> lưu kết quả, trả về. Nếu core timeout -> giữ trạng thái {{IN_PROGRESS}}, job retry dùng **cùng key** gọi lại core (core phải hỗ trợ idempotent key hoặc adapter tự xử lý duplicate detection).
 4. Nếu core trả lỗi {{DUPLICATE}} -> coi như thành công, trả kết quả cũ.
### Xử lý giao dịch phân tán không có 2PC: Saga
 Khi một luồng nghiệp vụ chạm nhiều hệ thống (ví dụ: khách nạp tiền từ thẻ -> ví: payment gateway -> core banking -> ledger), không thể dùng 2PC vì core không tham gia. Dùng **Saga** (choreography hoặc orchestration):
 - Mỗi bước là một transaction cục bộ, có **bước bù trừ (compensation)**.
 - Ví dụ nạp tiền: (1) Payment gateway hold thẻ, (2) Gọi core cộng tiền ví, (3) Ghi ledger. Nếu bước (3) thất bại -> compensation: gọi core trừ tiền ví (reversal), payment gateway release hold.
 - Orchestrator (trong ESB hoặc service điều phối) theo dõi trạng thái, thực hiện compensation tự động khi có lỗi.
 
 ~~~seq
 title: Saga nap tien tu the vao vi (khong 2PC)
 actors: Khach | Orchestrator | PaymentGW | CoreBank | Ledger
 Khach -> Orchestrator: nap 500k tu the
 Orchestrator -> PaymentGW: authorize 500k (hold)
 PaymentGW --> Orchestrator: auth_code, hold_ok
 Orchestrator -> CoreBank: cong tien vi (idem_key=K1)
 CoreBank --> Orchestrator: success, tx_id=C1
 Orchestrator -> Ledger: ghi but toan (idem_key=K2)
 Ledger --> Orchestrator: success
 Orchestrator -> PaymentGW: capture (hoan tat)
 PaymentGW --> Orchestrator: captured
 Orchestrator --> Khach: thanh cong
 note Orchestrator..Ledger: neu Ledger fail -> CoreBank reversal, PaymentGW release
 ~~~
### ESB (Enterprise Service Bus) làm gì
 ESB không phải "message queue đơn giản". Nó cung cấp:
 - **Routing**: gửi message đến đúng service/core theo nội dung.
 - **Transformation**: XML <-> JSON, ISO 20022 <-> T24 format, field mapping.
 - **Protocol bridging**: HTTP/REST <-> JMS/MQ <-> SOAP.
 - **Guaranteed delivery**: persistent queue, retry với backoff, dead letter queue.
 - **Monitoring**: theo dõi message flow, latency, error rate.
### Lỗi hay gặp
 - Gọi thẳng API core từ frontend/mobile -> core bị quá tải, coupling cứng.
 - Không có ACL -> core nâng cấp phiên bản làm gãy 15 hệ thống ngoài.
 - Gửi request không idempotent -> network retry gây trùng giao dịch.
 - Dùng 2PC giả định core hỗ trợ -> transaction treo, deadlock core.
 - Không có compensation -> lỗi giữa chừng để dữ liệu không nhất quán.
 - Mapping field thủ công trong code rải rác -> thay đổi một field mất tuần.
### Ví dụ đời thực
 
 Một ngân hàng tích hợp T24 với 12 hệ thống xung quanh (mobile, internet banking, CRM, loan origination, card, payment...). Ban đầu mỗi hệ thống gọi REST T24 trực tiếp, mapping field trong code của riêng họ. Khi T24 nâng cấp từ R18 lên R20, 30+ API thay đổi signature, tất cả hệ thống cùng gãy, triển khai mất 3 tháng. Dev dựng **Integration Layer** (Spring Boot + Kafka + Camel): mọi hệ thống gửi command/event đến Kafka theo canonical model (JSON schema Avro), Integration Layer consume, transform sang T24 format (jBASE/TAFC), gọi T24 qua middleware (TAFJ), xử lý response, publish event kết quả ngược lại Kafka. Idempotency key do client sinh, lưu trong bảng {{integration_idem}} với unique constraint. Saga orchestrator quản lý luồng nạp/rút/chuyển tiền: mỗi bước ghi state machine vào DB, compensation tự động khi lỗi. Kết quả: T24 upgrade R22 chỉ mất 2 tuần sửa Integration Layer, 0 hệ thống ngoài bị ảnh hưởng; throughput tăng 3x nhờ async processing; 0 giao dịch trùng nhờ idempotency end-to-end.
### Trả lời mẫu khi phỏng vấn
 
 "Tích hợp core banking (T24/Temenos) tôi luôn dùng adapter/anti-corruption layer với canonical model. Hệ thống ngoài nói JSON/canonical, adapter dịch sang T24 format (TAFC/ISO 20022) và ngược lại — core không bao giờ bị gọi thẳng từ ngoài. Vì core không hỗ trợ 2PC, các luồng đa hệ thống dùng Saga: mỗi bước có compensation, orchestrator theo dõi state machine. Idempotency key do client sinh, đi xuyên suốt từ mobile qua ESB đến core, lưu trong DB với unique constraint. ESB lo routing, transformation, guaranteed delivery, dead letter queue. Thực tế: một ngân hàng 12 hệ thống gọi T24 trực tiếp, upgrade T24 làm gãy hết; sau khi dựng Integration Layer canonical + Kafka + Saga, upgrade sau chỉ sửa adapter, 0 hệ thống ngoài ảnh hưởng, throughput x3."
 
 > Senior tip: Trong phỏng vấn, hãy nhấn mạnh **ba chốt**: (1) Adapter canonical model cô lập core, (2) Saga thay 2PC với compensation rõ ràng, (3) Idempotency key do client sinh đi xuyên suốt. Đừng nói "dùng ESB" chung chung — hãy nói ESB làm gì cụ thể: transform, route, retry, DLQ.
 
 > Cụm từ: Anti-corruption layer (ACL) là lớp dịch thuật bảo vệ domain model của một hệ thống không bị ô nhiễm bởi model của hệ thống khác. Saga là chuỗi transaction cục bộ có bước bù trừ, không phải distributed transaction 2PC.
 
  `,
  follow: [
    'Tại sao core banking thường không hỗ trợ 2PC, và Saga giải quyết vấn đề nhất quán như thế nào?',
    'Canonical model khác DTO thông thường ở đâu, và versioning schema như thế nào?',
    'Khi core banking timeout giữa chừng một Saga, orchestrator quyết định compensation hay retry dựa trên tiêu chí gì?'
  ],
  tags: ['T24', 'Temenos', 'core banking', 'ESB', 'adapter', 'canonical model', 'saga', 'idempotency']
},
{
  id: 'banking-046',
  topic: 'banking',
  level: 'lead',
  q: 'RTGS (Real-Time Gross Settlement) so với Deferred Net Settlement (DNS): khác nhau cơ bản, hệ thống ngân hàng trung ương xử lý như thế nào, và dev cần lưu ý gì khi tích hợp?',
  a: `**Tóm tắt:** **RTGS** (thanh toán thực thời grosso) xử lý từng giao dịch riêng lẻ, ngay lập tức, không bù trừ — tiền chuyển ngay, kết thúc ngay. **DNS** (thanh toán bù trừ hoãn lại) gom nhiều giao dịch, chờ đến cuối chu kỳ (ví dụ cuối ngày), tính số dư ròng (net) giữa các ngân hàng, rồi chuyển một lần. RTGS dùng cho giao dịch giá trị lớn, khẩn cấp (thường > 500 triệu VND tại Việt Nam); DNS dùng cho thanh toán số lượng lớn, giá trị nhỏ (chuyển khoản nhanh 24/7, thẻ, QR). Dev tích hợp phải hiểu: RTGS = tiền đến ngay, không thể hủy, phí cao; DNS = tiền đến theo lô, có thể pending/reversal trong chu kỳ, phí thấp.
### RTGS là gì (giải thích từ đầu)
 **RTGS** (Real-Time Gross Settlement - thanh toán thực thời grosso): mỗi lệnh chuyển tiền được xử lý **ngay lập tức**, **riêng lẻ** (gross), **không bù trừ** với giao dịch khác. Ngân hàng trung ương (State Bank) giữ tài khoản của từng ngân hàng thương mại (tài khoản ngân hàng tại NHNN). Khi ngân hàng A chuyển 1 tỷ cho ngân hàng B qua RTGS: NHNN trừ 1 tỷ từ tài khoản A, cộng 1 tỷ vào tài khoản B, **trong vài giây**. Giao dịch xong là xong, **không thể hủy** (irrevocable). Đặc điểm: giá trị lớn, ưu tiên cao, phí cao, giờ hoạt động hạn chế (thường giờ hành chính).
### DNS là gì
 **DNS** (Deferred Net Settlement - thanh toán bù trừ hoãn lại): các giao dịch được gom lại, **không xử lý ngay**, chờ đến một **chu kỳ cut-off** (ví dụ 11:00, 14:00, 16:00, 23:00). Tại cut-off, hệ thống tính **số dư ròng (net position)** của mỗi ngân hàng: tổng tiền nhận được - tổng tiền phải gửi đi. Chỉ chuyển **một lần** số dư ròng này giữa các tài khoản tại NHNN. Ví dụ: trong chu kỳ, ngân hàng A gửi cho B 500 triệu, B gửi cho A 300 triệu -> ròng A nợ B 200 triệu -> chỉ chuyển 200 triệu từ A sang B. Giao dịch riêng lẻ trong chu kỳ vẫn ở trạng thái {{PENDING}} cho đến khi settlement xong.
### So sánh cốt lõi
 | Tiêu chí | RTGS | DNS |
 |---|---|---|
 | Xử lý | Từng giao dịch, ngay lập tức | Gom lô, chu kỳ cut-off |
 | Bù trừ | Không (gross) | Có (net position) |
 | Thời gian hoàn tất | Giây (thực thời) | Tùy chu kỳ (có thể giờ sau, ngày sau) |
 | Khả năng hủy | Không thể (irrevocable) | Có thể reversal trong chu kỳ |
 | Phí | Cao (nghìn đồng/giao dịch) | Thấp (đồng/giao dịch) |
 | Giờ hoạt động | Giờ hành chính NHNN | 24/7 hoặc nhiều chu kỳ/ngày |
 | Dùng cho | Giá trị lớn (>500tr VND), khẩn | Số lượng lớn, giá trị nhỏ |
 | Ví dụ VN | Hệ thống RTGS của NHNN | NAPAS 24/7 (chuyển khoản nhanh), Visa/MC settlement |
### Hệ thống RTGS tại Việt Nam
 Ngân hàng Nhà nước vận hành hệ thống RTGS (thường gọi là **HVPS - High Value Payment System**). Ngân hàng thương mại kết nối qua **ESB/Adapter** gửi message ISO 20022 ({{pacs.008}} cho customer credit transfer, {{pacs.009}} cho FI-to-FI). Message phải có {{UETR}} (Unique End-to-End Transaction Reference) để truy vết. NHNN xử lý, trả {{pacs.002}} (status report) với mã {{ACSC}} (accepted settlement completed) hoặc {{RJCT}} (rejected). Tiền chuyển ngay trên tài khoản dự trữ của ngân hàng tại NHNN.
### Hệ thống DNS tại Việt Nam (NAPAS 24/7)
 NAPAS vận hành hệ thống thanh toán nhanh 24/7 (FPS - Fast Payment System) theo mô hình DNS. Các ngân hàng gửi file/batch giao dịch liên tục, NAPAS xử lý theo chu kỳ (ví dụ mỗi 15 phút hoặc 30 phút). Tại cut-off, tính net position, chuyển tiền trên tài khoản ngân hàng tại NHNN (hoặc tài khoản điều tiết). Giao dịch riêng lẻ cập nhật trạng thái sau settlement. Khách hàng thấy tiền "đến ngay" nhưng thực tế là sau chu kỳ settlement gần nhất.
### Những gì dev cần lưu ý khi tích hợp
 1. **Không nhầm lẫn API**: RTGS thường dùng message ISO 20022 qua message queue (IBM MQ, Kafka) với chứng chỉ số; DNS (NAPAS) có thể dùng API REST hoặc file SFTP.
 2. **Idempotency**: RTGS {{UETR}} là khóa duy nhất xuyên suốt; DNS dùng {{RRN}}/{{STAN}} của NAPAS. Luôn lưu khóa này để tra soát.
 3. **Trạng thái**: RTGS trả về thành công/thất bại ngay -> cập nhật core ngay. DNS trả {{PENDING}} -> phải có job tra soát/chờ settlement -> cập nhật sau.
 4. **Reversal**: RTGS không hủy được; DNS có thể reversal trong chu kỳ (trước cut-off). Code phải xử lý hai luồng khác nhau.
 5. **Cut-off & ngày nghiệp vụ**: RTGS thường chỉ giờ hành chính; DNS 24/7 nhưng settlement cuối ngày vẫn đóng ngày nghiệp vụ. Xem banking-006, banking-028.
 6. **Phí**: RTGS phí cao, thường trừ riêng (không gộp trong amount); DNS phí thấp, có thể gộp hoặc trừ riêng.
 7. **SLA & monitoring**: RTGS SLA tính bằng giây; DNS tính bằng phút/chu kỳ. Alert RTGS phải real-time.
 
 ~~~seq
 title: RTGS vs DNS luong xu ly
 actors: NganHangA | RTGS | NganHangB | NganHangA | DNS/NAPAS | NganHangB
 note right of NganHangA: RTGS: chuyen 1 ty
 NganHangA -> RTGS: pacs.008 (UETR=abc, 1 ty)
 RTGS -> RTGS: tru tai khoan A, cong tai khoan B
 RTGS --> NganHangA: pacs.002 ACSC
 RTGS --> NganHangB: pacs.002 ACSC (thong bao nhan)
 note right of NganHangA: DNS: chuyen 50 trieu
 NganHangA -> DNS: gui giao dich 50 trieu (RRN=xyz)
 DNS -> DNS: gom vao chu ky, tinh net position
 DNS -> NHNN: chuyen net position
 DNS --> NganHangA: settlement completed
 DNS --> NganHangB: settlement completed + credit
 ~~~
### Lỗi hay gặp
 - Gửi giao dịch nhỏ qua RTGS -> tốn phí, nghẽn hệ thống giá trị lớn.
 - Gửi giao dịch lớn, khẩn qua DNS -> tiền đến chậm, khách khiếu nại.
 - Không lưu {{UETR}}/{{RRN}} -> không tra soát được khi đối soát cuối ngày.
 - Xử lý DNS như RTGS (cập nhật core ngay khi nhận {{PENDING}}) -> sai số dư khi settlement thất bại.
 - Quên xử lý reversal DNS trong chu kỳ -> tiền bị khóa sai.
### Ví dụ đời thực
 
 Một ngân hàng tích hợp cả RTGS (HVPS) và NAPAS 24/7. Một doanh nghiệp chuyển 2 tỷ VND cho đối tác khẩn (trả tiền nhập khẩu). Dev nhầm gửi qua NAPAS 24/7 thay vì RTGS. Giao dịch vào chu kỳ 14:00, nhưng settlement chỉ xong 14:30, đối tác không nhận tiền kịp để thông quan hàng hóa, gây phạt hợp đồng. Nguyên nhân: dev không phân biệt được "giao dịch giá trị lớn, khẩn cấp -> RTGS" và "giao dịch thông thường -> DNS". Cách xử lý: bổ sung quy tắc routing trong adapter: amount >= 500 triệu VND hoặc flag {{urgent=true}} -> route sang RTGS; còn lại -> NAPAS. Thêm validation UI: nhập >= 500 triệu tự chọn RTGS, hiển thị phí và giờ cut-off. Kết quả: 0 case nhầm luồng, doanh nghiệp hài lòng.
### Trả lời mẫu khi phỏng vấn
 
 "RTGS xử lý từng giao dịch grosso, thực thời, không bù trừ, không hủy được — dùng cho tiền lớn, khẩn. DNS gom lô, bù trừ net, có chu kỳ cut-off, có thể reversal — dùng cho tiền nhỏ, số lượng lớn. Tại Việt Nam: RTGS của NHNN (HVPS) cho >500 triệu, ISO 20022 pacs.008/009, UETR truy vết; NAPAS 24/7 cho chuyển khoản nhanh, RRN/STAN tra soát. Dev tích hợp phải: route đúng luồng theo amount/urgency, lưu khóa tra soát (UETR/RRN), xử lý trạng thái khác nhau (RTGS update ngay, DNS chờ settlement), hiểu reversal chỉ có DNS. Phí RTGS cao, DNS thấp. Sai luồng là sai nghiệp vụ: tiền lớn qua DNS đến chậm, tiền nhỏ qua RTGS tốn phí nghẽn hệ thống."
 
 > Senior tip: Hãy nói rõ **routing rule** trong adapter: {{if (amount >= 500_000_000 || urgent) route RTGS else route DNS}}. Nhấn mạnh UETR (RTGS) và RRN (DNS) là hai khóa tra soát hoàn toàn khác nhau, không thể nhầm. Đối soát cuối ngày phải tách hai luồng này.
 
 > Cụm từ: Net position (vị thế ròng) = tổng tiền nhận - tổng tiền gửi của một ngân hàng trong một chu kỳ DNS. UETR (Unique End-to-End Transaction Reference) là mã duy nhất 36 ký tự (UUID) gắn với một giao dịch RTGS xuyên suốt từ người gửi đến người nhận.
 
  `,
  follow: [
    'Tại sao RTGS không cho phép reversal mà DNS cho phép, và rủi ro vận hành là gì?',
    'Khi tích hợp cả hai, bạn thiết kế bảng trạng thái giao dịch như thế nào để tách rõ hai luồng?',
    'NAPAS 24/7 dùng DNS nhưng khách thấy "tiền đến ngay" — thực tế luồng settlement diễn ra thế nào?'
  ],
  tags: ['RTGS', 'DNS', 'NAPAS', 'HVPS', 'settlement', 'ISO 20022', 'UETR', 'RRN']
},
{
  id: 'banking-047',
  topic: 'banking',
  level: 'senior',
  q: 'Nostro và Vostro account trong correspondent banking: là gì, ghi sổ cái thế nào, đối soát như thế nào, và dev xử lý tiền tệ/tỷ giá ra sao?',
  a: `**Tóm tắt:** **Nostro** = "tài khoản của chúng ta ở ngân hàng bạn" (our account with you). **Vostro** = "tài khoản của bạn ở ngân hàng chúng ta" (your account with us). Correspondent banking là ngân hàng này giữ tài khoản cho ngân hàng kia để thanh toán-cross-border. Dev phải xử lý: sổ cái hai bên (mirror ledger), tỷ giá FX tại thời điểm ghi, phí correspondent, cut-off giờ khác múi giờ, và đối soát định kỳ để phát hiện lệch.
### Nostro/Vostro là gì (giải thích từ đầu)
 Khi ngân hàng A (Việt Nam) muốn chuyển USD cho ngân hàng B (Mỹ) nhưng không có chi nhánh tại Mỹ, A nhờ **ngân hàng đại lý (correspondent bank)** C tại Mỹ. C mở tài khoản cho A: ở góc nhìn A, đó là **Nostro account** ("tài khoản của tôi ở bạn"); ở góc nhìn C, đó là **Vostro account** ("tài khoản của bạn ở tôi").
 - **Nostro (Our account with you)**: tài khoản ngân hàng mình mở tại ngân hàng đại lý nước ngoài. Dùng để nhận/gửi ngoại tệ (USD, EUR...). Số dư Nostro là **tài sản** của ngân hàng mình.
 - **Vostro (Your account with us)**: tài khoản ngân hàng đại lý mở tại ngân hàng mình. Dùng khi ngân hàng nước ngoài cần tài khoản VND. Số dư Vostro là **nợ** của ngân hàng mình.
 
 Ví dụ: Vietcombank (VCB) mở tài khoản USD tại JPMorgan (NY). VCB gọi đây là **Nostro USD tại JPM**. JPM gọi đây là **Vostro VCB**. Khi khách VCB gửi 10.000 USD cho người nhận tại Mỹ qua JPM: VCB trừ 10.000 USD từ Nostro JPM, JPM chuyển cho ngân hàng người nhận.
### Ghi sổ cái (Mirror Ledger)
 Mỗi bên giữ một bản sao sổ cái (mirror ledger) của tài khoản đối phương:
 - VCB ghi sổ Nostro JPM: mọi giao dịch (nhận, gửi, phí, lãi) ghi vào ledger nội bộ {{nostro_jpm_usd}}.
 - JPM ghi sổ Vostro VCB: cùng những giao dịch đó, nhưng hướng ngược (credit/debit đảo).
 
 **Quy tắc ghi**:
 | Sự kiện | VCB (Nostro) | JPM (Vostro) |
 |---|---|---|
 | Nhận 10k USD từ khách VCB chuyển ra | CREDIT Nostro +10k | DEBIT Vostro +10k |
 | VCB trả phí JPM 50 USD | DEBIT Nostro -50 | CREDIT Vostro +50 |
 | JPM trả lãi Nostro 100 USD | CREDIT Nostro +100 | DEBIT Vostro -100 |
 
 Tổng Nostro của VCB phải bằng tổng Vostro của JPM (dù hướng ghi ngược). Sai lệch -> đối soát.
### Tỷ giá FX và ngày giá trị (value date)
 - Giao dịch cross-border thường qua 2 ngày: **trade date** (ngày ký hợp đồng) và **value date** (ngày tiền thực sự chuyển).
 - Value date thường là **T+2** cho USD (T+1 cho EUR trong SEPA). Ngày nghỉ tại một trong hai quốc gia đẩy value date.
 - **Tỷ giá áp dụng**: tỷ giá tại **value date** (không phải trade date). Dev phải lưu snapshot tỷ giá (fx_rate, source, quote_id, timestamp) cho mỗi giao dịch.
 - **Spread**: ngân hàng đại lý thường chênh tỷ giá (bid/ask) hoặc thu phí cố định. Phí này phải tách riêng trong sổ cái, không gộp vào amount chính.
### Cut-off và múi giờ
 Nostro/Vostro hoạt động theo giờ của **ngân hàng đại lý** (ví dụ New York time EST/EDT). Cut-off gửi lệnh SWIFT/ISO 20022 thường là 15:00-16:00 giờ địa phương. Dev phải chuyển đổi múi giờ chính xác: lệnh gửi sau cut-off NY hôm nay sẽ có value date ngày mai (hoặc thứ 2 nếu hôm nay là thứ 6). Hệ thống phải có **business calendar** cho từng cặp Nostro (lịch nghỉ US, VN, múi giờ DST).
### Đối soát Nostro/Vostro
 Đối soát hàng ngày (hoặc nhiều lần/ngày) giữa mirror ledger hai bên:
 1. Lấy statement từ ngân hàng đại lý (MT940/MT950 SWIFT hoặc camt.053 ISO 20022).
 2. Parse, chuẩn hóa về canonical model.
 3. So khớp từng giao dịch theo {{transaction reference}} + {{value date}} + {{amount}}.
 4. Phân loại: MATCH, ONLY_OURS (chúng ta có, họ không), ONLY_THEIRS (họ có, chúng ta không), AMOUNT_MISMATCH, DATE_MISMATCH.
 5. Tự động xử lý: date mismatch do múi giờ -> điều chỉnh value date; fee/interest đã biết -> ghi bút toán điều chỉnh.
 6. Lệch chưa giải thích -> đẩy queue tra soát, liên hệ correspondent.
### Code/Java: Nostro entry
 ~~~java
 record NostroEntry(String nostroId, String txnRef, LocalDate valueDate,
                    BigDecimal amount, String currency, String direction, // CREDIT/DEBIT
                    BigDecimal fxRate, String fxSource, String feeCcy, BigDecimal feeAmt) {}
 
 // Khi nhận MT940 từ correspondent
 List<NostroEntry> parseMt940(String mt940Content) { ... }
 
 // Đối soát
 enum MatchResult { MATCH, ONLY_OURS, ONLY_THEIRS, AMOUNT_MISMATCH, DATE_MISMATCH }
 MatchResult match(NostroEntry ours, NostroEntry theirs) {
     if (theirs == null) return ONLY_OURS;
     if (ours == null) return ONLY_THEIRS;
     if (ours.amount().compareTo(theirs.amount()) != 0) return AMOUNT_MISMATCH;
     if (!ours.valueDate().equals(theirs.valueDate())) return DATE_MISMATCH;
     return MATCH;
 }
 ~~~
### Lỗi hay gặp
 - Ghi Nostro/Vostro nhầm hướng (credit/debit đảo) -> số dư sai dấu, đối soát không bao giờ khớp.
 - Dùng tỷ giá hôm nay thay vì tỷ giá value date -> lệch tiền lớn khi FX biến động.
 - Không tách phí correspondent -> phí lẫn vào amount, sai P&L.
 - Không có business calendar cho từng correspondent -> gửi lệnh sai ngày, value date sai.
 - Đối soát chỉ so tổng số dư -> bỏ sót lệch chi tiết bù trừ nhau.
### Ví dụ đời thực
 
 Một ngân hàng VN có Nostro USD tại 3 correspondent (JPM, Citi, BofA). Cuối tháng, đối soát Nostro JPM thấy lệch 15.000 USD. Điều tra: 3 giao dịch phí correspondent (monthly maintenance fee 500 USD, wire fee 25 USD, FX spread 200 USD) JPM đã trừ vào ngày 28 nhưng ngân hàng VN chỉ ghi khi nhận statement ngày 30. Business calendar thiếu ngày nghỉ Thanksgiving (thứ 5 tuần 4 tháng 11) khiến value date của 2 giao dịch wire bị đẩy sai. Nguyên nhân: không tách phí riêng trong ledger, calendar không cập nhật ngày nghỉ US. Cách xử lý: bổ sung {{fee_amount}}, {{fee_currency}} trong NostroEntry; cập nhật calendar US (import từ thư viện hoặc feed SWIFT); chạy script backfill 3 giao dịch phí, điều chỉnh value date 2 giao dịch wire. Kết quả: đối soát tháng sau khớp 100%, không còn lệch Nostro.
### Trả lời mẫu khi phỏng vấn
 
 "Nostro là tài khoản của chúng ta ở ngân hàng bạn (tài sản), Vostro là tài khoản của bạn ở chúng ta (nợ). Mỗi bên giữ mirror ledger ghi ngược hướng: VCB credit Nostro khi nhận USD, JPM debit Vostro. Tỷ giá áp dụng theo value date (thường T+2 USD), phải lưu snapshot fx_rate, source, quote_id. Cut-off theo giờ correspondent (NY time), cần business calendar từng cặp. Đối soát dùng statement MT940/camt.053, khớp theo txnRef + valueDate + amount, tách phí/interest ra xử lý riêng. Lỗi hay gặp: ghi nhầm hướng, dùng tỷ giá sai ngày, không tách phí, calendar thiếu ngày nghỉ. Thực tế: em từng fix lệch 15k USD do thiếu calendar ngày nghỉ US và không tách phí — sau khi bổ sung, đối soát khớp 100%."
 
 > Senior tip: Nostro/Vostro là **hai góc nhìn của cùng một tiền**. Luôn vẽ bảng hướng ghi (credit/debit) cho từng sự kiện. Value date quyết định tỷ giá — không bao giờ dùng trade date. Business calendar per correspondent là bắt buộc, không dùng chung một calendar.
 
 > Cụm từ: Mirror ledger là bản sao sổ cái mà mỗi bên giữ cho tài khoản của bên kia. Value date là ngày tiền thực sự có hiệu lực (tiền rời tài khoản này, vào tài khoản kia). MT940/MT950 là định dạng statement SWIFT; camt.053 là tương đương ISO 20022.
 
  `,
  follow: [
    'Tại sao value date thường là T+2 cho USD, và ngày nghỉ ở một bên ảnh hưởng như thế nào?',
    'Khi correspondent gửi statement MT940, bạn parse và chuẩn hóa ra canonical model như thế nào?',
    'Nostro bị âm (overdraft) thì xử lý ra sao, và correspondent thường cho phép không?'
  ],
  tags: ['Nostro', 'Vostro', 'correspondent banking', 'cross-border', 'FX', 'MT940', 'camt.053', 'mirror ledger']
},
{
  id: 'banking-048',
  topic: 'banking',
  level: 'lead',
  q: 'IFRS 9 Expected Credit Loss (ECL): staging (Stage 1/2/3), PD/LGD/EAD, tính dự phòng giảm giá cho vay trong code, và điều kiện để chuyển stage.',
  a: `**Tóm tắt:** **IFRS 9** yêu cầu ngân hàng tính **Expected Credit Loss (ECL)** — dự phòng giảm giá cho vay dựa trên **mất mát kỳ vọng** chứ không phải mất mát đã xảy ra (incurred loss như IAS 39). Ba giai đoạn (Stage): **Stage 1** (rủi ro tín dụng không tăng đáng kể) -> ECL 12 tháng; **Stage 2** (rủi ro tăng đáng kể - SICR) -> ECL cả vòng đời (lifetime); **Stage 3** (giảm giá khách quan - credit-impaired) -> ECL lifetime + xử lý riêng. Công thức: **ECL = PD × LGD × EAD** (điều chỉnh theo thời gian, chiết khấu). Dev phải triển khai: mô hình dữ liệu staging, tính PD/LGD/EAD từ mô hình thống kê, chạy batch hàng tháng, và audit trail đầy đủ.
### Ba Stage (Giai đoạn) — cái bẫy lớn nhất
 | Stage | Điều kiện | ECL horizon | Ví dụ |
 |---|---|---|---|
 | **Stage 1** | Khách trả nợ đúng hạn, không dấu hiệu rủi ro tăng | **12-month ECL** (chỉ dự phòng 12 tháng tới) | Vay mới, trả đều, điểm tín dụng tốt |
 | **Stage 2** | **SICR** (Significant Increase in Credit Risk): rủi ro tăng đáng kể kể từ khi cho vay | **Lifetime ECL** (dự phòng cả vòng đời còn lại) | Trễ nợ 30+ ngày, restructure, điểm tín dụng giảm mạnh, ngành nghề suy thoái |
 | **Stage 3** | **Credit-impaired**: có bằng chứng khách quan đã giảm giá (default) | **Lifetime ECL** + xử lý riêng (thường PD=100%) | Trễ nợ 90+ ngày, vỡ nợ, phá sản, tòa án, bán nợ cho AMC |
 
 **Quan trọng**: Chuyển stage **không đối xứng**. Stage 1 -> 2 khi SICR; Stage 2 -> 1 khi rủi ro quay về mức ban đầu (curing); Stage 2/3 -> 3 khi default; Stage 3 -> 2 khi cure (thường cần 3-12 tháng trả đều). Không được chuyển Stage 1 -> 3 trực tiếp.
### PD, LGD, EAD — ba khối xây dựng ECL
 - **PD (Probability of Default - xác suất vỡ nợ)**: % khả năng khách vỡ nợ trong một khoảng thời gian. Có PD 12-month (dùng Stage 1) và PD lifetime (dùng Stage 2/3). Mô hình: logistic regression, scorecard, hoặc machine learning trên lịch sử vỡ nợ.
 - **LGD (Loss Given Default - tổn thất khi vỡ nợ)**: % tiền mất **khi đã vỡ nợ**, sau khi thu hồi tài sản đảm bảo, bán nợ, xử lý pháp lý. LGD = 1 - Recovery Rate. Phụ thuộc loại đảm bảo (bất động sản LGD thấp, không đảm bảo LGD cao).
 - **EAD (Exposure at Default - mức độ rủi ro tại thời điểm vỡ nợ)**: số tiền đang nợ **khi vỡ nợ xảy ra**. Với vay trả góp: EAD = dư nợ hiện tại + lãi chưa thu + phí. Với hạn mức thẻ/overdraft: EAD = dư nợ hiện tại + CCF (Credit Conversion Factor) × phần chưa dùng.
 
 Công thức ECL cơ bản (mô hình điểm):
 ~~~text
 ECL = Σ (PD_t × LGD_t × EAD_t) / (1 + r)^t      cho t = 1..T
 T = 12 tháng (Stage 1) hoặc vòng đời còn lại (Stage 2/3)
 r = effective interest rate (chiết khấu)
 ~~~
### Triển khai trong code (Java)
 Dev không xây dựng mô hình PD/LGD (do team Risk/Data Science làm), nhưng phải **tiếp nhận, lưu, version, và tính toán** đúng.
 
 ~~~java
 record EclInput(String loanId, LocalDate asOfDate, int stage,
                 BigDecimal pd, BigDecimal lgd, BigDecimal ead,
                 BigDecimal eir, LocalDate maturityDate) {}
 
 record EclResult(String loanId, BigDecimal ecl12m, BigDecimal eclLifetime,
                  BigDecimal stage1Prov, BigDecimal stage2Prov, BigDecimal stage3Prov) {}
 
 BigDecimal calculateEcl(EclInput in) {
     int months = (in.stage() == 1) ? 12 : monthsBetween(in.asOfDate(), in.maturityDate());
     BigDecimal sum = BigDecimal.ZERO;
     BigDecimal onePlusR = BigDecimal.ONE.add(in.eir().divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP));
     BigDecimal discount = BigDecimal.ONE;
     for (int m = 1; m <= months; m++) {
         discount = discount.multiply(onePlusR); // (1+r)^m
         BigDecimal pdMonth = in.pd(); // giả định PD đều mỗi tháng, thực tế có term structure
         BigDecimal lgdMonth = in.lgd();
         BigDecimal eadMonth = in.ead(); // có thể giảm dần theo lịch trả
         BigDecimal monthLoss = pdMonth.multiply(lgdMonth).multiply(eadMonth);
         sum = sum.add(monthLoss.divide(discount, 10, RoundingMode.HALF_UP));
     }
     return sum.setScale(0, RoundingMode.HALF_UP); // VND
 }
 ~~~
### Dữ liệu phải lưu (versioning & audit)
 Mỗi lần chạy batch ECL (hàng tháng) phải lưu snapshot:
 - {{ecl_run(run_id, as_of_date, model_version_pd, model_version_lgd, model_version_ead, status, created_at)}}
 - {{ecl_detail(run_id, loan_id, stage, pd, lgd, ead, ecl_amount, stage_before, stage_after, reasons_json)}}
 - {{loan_staging_history(loan_id, stage, changed_at, changed_by, trigger_reason, sicr_indicators_json)}}
 
 **SICR indicators** (chỉ báo rủi ro tăng) phải ghi rõ: days_past_due, rating_downgrade_notches, sector_deterioration, forbearance_flag, macro_overlay...
### Macro-economic overlay (điều chỉnh vĩ mô)
 Mô hình PD/LGD thường train trên dữ liệu quá khứ. IFRS 9 yêu cầu **forward-looking**: điều chỉnh PD theo kịch bản kinh tế (base, upside, downside) với trọng số xác suất. Ví dụ: GDP tăng trưởng giảm -> PD tăng 10% cho Stage 1, 20% cho Stage 2. Dev phải lưu: scenario_id, weight, pd_adjustment_factor, applied_date.
### Batch ECL hàng tháng — quy trình
 1. Lấy portfolio vay tại ngày báo cáo (as-of date).
 2. Xác định stage cho từng khoản (dùng staging engine: rule-based + model score).
 3. Lấy PD/LGD/EAD từ model registry (version cố định cho run này).
 4. Áp dụng macro overlay (nếu có).
 5. Tính ECL cho từng khoản (song song, chunk).
 6. Tổng hợp, đối soát với tổng provision trên GL.
 7. Lưu snapshot, xuất báo cáo cho Risk/CFO/Audit.
 8. Maker-checker duyệt trước khi ghi sổ cái.
### Lỗi hay gặp
 - Dùng **incurred loss** (IAS 39) thay vì **expected loss** (IFRS 9) -> thiếu provision Stage 1/2.
 - Stage 1/2/3 logic sai: không kiểm tra SICR, hoặc không cho cure (Stage 2->1).
 - PD/LGD/EAD không versioning -> chạy lại tháng trước ra số khác, audit không chấp nhận.
 - Không chiết khấu (discount) về EIR -> provision bị phồng.
 - Macro overlay hard-code trong code -> thay đổi kịch bản phải deploy.
 - Không lưu {{reasons_json}} cho việc chuyển stage -> không giải trình được cho audit.
 - Chạy batch không idempotent -> chạy lại tháng trùng provision.
### Ví dụ đời thực
 
 Một ngân hàng triển khai IFRS 9 năm 2018. Ban đầu chỉ có Stage 1/3 (nhị phân: tốt/xấu), thiếu Stage 2 -> provision thiếu lớn, kiểm toán nhượng quyền nhưng yêu cầu bổ sung. Dev thêm: (1) SICR rule engine: DPD>=30, rating downgrade>=2 notch, restructure flag -> Stage 2; (2) Cure rule: Stage 2 trả đều 6 tháng liên tiếp, DPD=0, rating ổn định -> quay về Stage 1; (3) Model registry versioning PD/LGD/EAD; (4) Macro overlay table (scenario, weight, adjustment); (5) Batch idempotent theo (loan_id, as_of_date). Kết quả: provision tăng 18% (phổ biến khi thêm Stage 2), báo cáo IFRS 9 được kiểm toán chấp nhận, audit trail đầy đủ cho phép truy vết mọi khoản chuyển stage.
### Trả lời mẫu khi phỏng vấn
 
 "IFRS 9 ECL dựa trên expected loss, không phải incurred loss. Ba stage: Stage 1 (rủi ro bình thường) -> 12-month ECL; Stage 2 (SICR: DPD>=30, rating downgrade, restructure) -> Lifetime ECL; Stage 3 (default: DPD>=90, vỡ nợ) -> Lifetime ECL + PD=100%. Công thức ECL = PD × LGD × EAD chiết khấu theo EIR. PD=probability of default, LGD=loss given default, EAD=exposure at default. Dev triển khai: model registry versioning PD/LGD/EAD, staging engine rule-based (SICR indicators), macro overlay table, batch idempotent theo (loan_id, as_of_date), lưu snapshot ecl_detail + staging_history với reasons_json. Cure: Stage 2->1 cần 6 tháng trả đều. Maker-checker duyệt provision trước khi ghi GL. Thực tế: em từng bổ sung Stage 2 cho ngân hàng chỉ có 1/3, provision tăng 18%, audit chấp nhận nhờ versioning và audit trail đầy đủ."
 
 > Senior tip: Ba chốt ăn điểm: (1) **Stage 2 là chìa khóa** — SICR indicators phải cụ thể, có cure rule, không hard-code. (2) **Versioning** — PD/LGD/EAD/model_version phải gắn với từng run, chạy lại tháng trước ra đúng số cũ. (3) **Forward-looking** — macro overlay không hard-code, lưu scenario/weight/adjustment. Audit sẽ hỏi "khoản này chuyển Stage 1->2 vì đâu, ở đâu có bằng chứng?" — bạn phải trả lời bằng {{reasons_json}}.
 
 > Cụm từ: SICR (Significant Increase in Credit Risk) là rủi ro tín dụng tăng đáng kể. CCF (Credit Conversion Factor) là hệ số chuyển đổi phần hạn mức chưa dùng thành EAD (ví dụ 20-50% cho cam kết cho vay). EIR (Effective Interest Rate) là lãi suất thực tế dùng để chiết khấu dòng tiền.
 
  `,
  follow: [
    'SICR (Significant Increase in Credit Risk) dùng những chỉ báo nào, và làm sao tránh chuyển stage nhạy cảm (flip-flop)?',
    'LGD ước lượng như thế nào cho vay có đảm bảo bất động sản vs vay không đảm bảo?',
    'Khi mô hình PD mới deploy, bạn backtest và chạy song song như thế nào trước khi cutover?'
  ],
  tags: ['IFRS 9', 'ECL', 'provision', 'Stage 1', 'Stage 2', 'Stage 3', 'PD', 'LGD', 'EAD', 'SICR']
},
{
  id: 'banking-049',
  topic: 'banking',
  level: 'senior',
  q: 'Treasury management: Funds Transfer Pricing (FTP), quản trị thanh khoản (liquidity), cash positioning — dev cần biết gì để xây dựng hệ thống hỗ trợ?',
  a: `**Tóm tắt:** **Treasury** (quản trị kho bạc) là phòng đảm bảo ngân hàng luôn có tiền trả nợ khi đến hạn, và dùng tiền hiệu quả nhất. Ba trụ cột dev cần hỗ trợ: **FTP** (tính giá chuyển nội bộ cho từng sản phẩm), **Liquidity management** (LCR, NSFR, cash flow forecasting), **Cash positioning** (số dư real-time tại các tài khoản Nostro, Vostro, central bank). Hệ thống dev cung cấp: dữ liệu chính xác, đúng thời điểm, granularity đủ, và API cho mô hình treasury tiêu thụ.
### FTP (Funds Transfer Pricing) là gì
 **FTP** là cơ chế gán **giá tiền nội bộ** cho từng khoản vay và tiền gửi, để đo lường lợi nhuận thực của từng sản phẩm/chi nhánh/khách hàng, loại bỏ rủi ro lãi suất và thanh khoản khỏi nghiệp vụ.
 - Tiền gửi (liability) **nhận** FTP rate (được trả lãi nội bộ).
 - Khoản vay (asset) **trả** FTP rate (phải trả lãi nội bộ).
 - FTP rate = **base rate** (thường là swap curve hoặc yield curve chính phủ) + **liquidity premium** + **option cost** (nếu có embedded option như trả trước).
 
 Ví dụ: tiền gửi 12 tháng lãi 5%/năm. Swap curve 12M = 3.5%. Liquidity premium = 0.5%. FTP rate = 4.0%. Margin của sản phẩm = 5% - 4% = 1% (contribution margin). Nếu không có FTP, nhìn vào 5% tưởng lợi nhuận cao nhưng thực tế rủi ro lãi suất chưa trừ.
### FTP data flow — dev cung cấp gì
 Mô hình FTP (do team Treasury/ALM xây dựng) cần dữ liệu thô chính xác:
 1. **Contract data**: từng hợp đồng vay/gửi: principal, rate, maturity, payment frequency, amortization type, embedded option (trả trước, gia hạn), currency.
 2. **Behavioral data**: lịch sử trả trước, gia hạn, rút trước hạn tiền gửi — để điều chỉnh expected cash flow.
 3. **Market data**: yield curve, swap curve, basis spread, FX forward points — snapshot hàng ngày (EOD).
 4. **Run result**: FTP rateassigned cho từng hợp đồng, FTP income/expense phân bổ theo tháng.
 
 Dev thiết kế: bảng {{ftp_contract_snapshot(run_date, contract_id, ftp_rate, liquidity_premium, option_cost, assigned_by_model_version)}}, batch EOD tính toán, idempotent theo (run_date, contract_id).
### Quản trị thanh khoản: LCR & NSFR
 Basle III yêu cầu hai chỉ số:
 - **LCR (Liquidity Coverage Ratio)** = **HQLA** (High Quality Liquid Assets) / **Net Cash Outflow 30 ngày** ≥ 100%. HQLA: tiền mặt, dự trữ trung ương, trái phiếu chính phủ Level 1/2. Cash outflow: rút tiền gửi, trả nợ, cam kết tín dụng, derivative margin.
 - **NSFR (Net Stable Funding Ratio)** = **Available Stable Funding (ASF)** / **Required Stable Funding (RSF)** ≥ 100%. ASF: vốn, tiền gửi ổn định, nợ dài hạn. RSF: cho vay, tài sản ít thanh khoản.
 
 Dev hỗ trợ: **data pipeline** gom dữ liệu từ core, GL, risk, market -> tính HQLA, outflow, inflow theo mapping quy định (Basel template). Chạy hàng ngày (LCR) và hàng tháng (NSFR). Kết quả phải **drill-down** được tới từng hợp đồng/tài khoản.
### Cash Positioning (Định vị tiền mặt real-time)
 Treasury cần biết **ngay lúc này** số dư tại:
 - Tài khoản trung ương (central bank reserve account).
 - Tài khoản Nostro/Vostro (USD, EUR, JPY...).
 - Tài khoản điều tiết (interbank placement).
 - Tiền mặt tại kho (vault cash).
 
 Hệ thống dev phải:
 - Pull real-time (hoặc near real-time 15-30 phút) từ core banking, SWIFT/ISO 20022 (camt.052/053), Nostro statement.
 - Chuẩn hóa về **single currency view** (VND equivalent theo tỷ giá EOD hoặc intraday).
 - Hiển thị dashboard: tổng thanh khoản khả dụng, broken down by currency/entity/counterparty.
 - Alert khi: central bank balance < ngưỡng, Nostro balance < minimum, large outflow sắp đến.
### Cash Flow Forecasting (Dự báo dòng tiền)
 Treasury dự báo dòng tiền 1-30 ngày tới để quyết định: vay mượn interbank, đầu tư ngắn hạn, điều chỉnh FTP.
 Input: lịch trả nợ vay, lịch đáo hạn tiền gửi, lịch trả lãi, cam kết tín dụng chưa rút, derivative cash flow, lớn/nay dự kiến.
 Dev xây dựng: **cash flow engine** sinh projection theo kịch án (base, stress). Lưu {{cash_flow_projection(as_of_date, horizon_date, currency, inflow, outflow, net, scenario_id)}}.
### Lỗi hay gặp
 - FTP rate dùng **yield curve cũ** (không update hàng ngày) -> margin sai, quyết định sai.
 - Không tách **liquidity premium** và **option cost** -> không biết đâu là margin thực, đâu là bù rủi ro.
 - LCR/NSFR dữ liệu từ GL không khớp core -> chỉ số sai, báo cáo Basel sai.
 - Cash positioning chỉ cập nhật EOD -> treasury không biết intraday large payment.
 - Không có **drill-down** từ chỉ số LCR/NSFR xuống hợp đồng -> không giải trình được khi audit.
 - FTP run không idempotent -> chạy lại tháng trùng dữ liệu.
### Ví dụ đời thực
 
 Một ngân hàng có FTP model nhưng chỉ chạy hàng tháng, dùng yield curve đầu tháng. Tháng 6, lãi suất tăng vọt 1.5% trong 2 tuần. Khoản vay 12 tháng lãi cố định 8% được gán FTP rate cũ 4% -> margin báo cáo 4% nhưng thực tế cơ hội đầu tư tiền đó hiện nay là 5.5% -> ngân hàng lỗ cơ hội. Treasury không biết vì cash positioning chỉ cập nhật EOD, hôm đó có 500 tỷ VND large payment ra Nostro vào 14:00 mà dashboard vẫn hiện số dư sáng. Dev fix: (1) FTP batch chạy hàng ngày, pull yield curve real-time từ market data vendor; (2) Tách liquidity premium/option cost ra cột riêng; (3) Cash positioning pull Nostro/central bank qua API real-time (camt.052 intraday), update dashboard 15 phút/lần; (4) Thêm drill-down LCR/NSFR xuống contract_id. Kết quả: FTP margin phản ánh đúng thị trường, treasury phản ứng kịp thời large payment, báo cáo Basel drill-down được audit chấp nhận.
### Trả lời mẫu khi phỏng vấn
 
 "Treasury cần ba thứ dev cung cấp: (1) **FTP** — gán giá tiền nội bộ cho từng hợp đồng vay/gửi: FTP rate = base curve + liquidity premium + option cost. Dev chạy batch hàng ngày, lưu snapshot versioned, tách ra ba thành phần. (2) **Liquidity** — LCR hàng ngày, NSFR hàng tháng: pipeline gom dữ liệu core/GL/market, mapping Basel template, có drill-down xuống contract_id. (3) **Cash positioning** — real-time/near real-time số dư central bank, Nostro, interbank, vault cash; pull camt.052 intraday, update dashboard 15 phút, alert ngưỡng. Cash flow forecasting 1-30 ngày cho vay mượn interbank. Lỗi hay gặp: yield curve cũ, không tách premium/option, dữ liệu LCR từ GL không khớp core, cash positioning chỉ EOD. Thực tế: em từng chuyển FTP từ monthly sang daily, tách liquidity premium, thêm real-time Nostro feed — treasury không còn bị bất ngờ large payment, báo cáo Basel drill-down full."
 
 > Senior tip: FTP **không phải** là lãi suất khách hàng thấy — đó là giá nội bộ. Dev phải tách ra: {{customer_rate = FTP_rate + business_margin}}. LCR/NSFR dev không tự tính công thức (do Risk làm), dev chỉ lo **data pipeline đúng, đầy đủ, drill-down**. Cash positioning: intraday > EOD, camt.052 > camt.053.
 
 > Cụm từ: HQLA (High Quality Liquid Assets) là tài sản thanh khoản cao (tiền mặt, dự trữ trung ương, trái phiếu chính phủ). ASF/RSF (Available/Required Stable Funding) là nguồn vốn ổn định và nhu cầu vốn ổn định cho NSFR. Swap curve là đường cong lãi suất hoán đổi, dùng làm base rate cho FTP.
 
  `,
  follow: [
    'FTP liquidity premium tính như thế nào cho tiền gửi không kỳ hạn (có thể rút bất kỳ lúc)?',
    'LCR denominator (net cash outflow 30 ngày) mapping từ dữ liệu core như thế nào?',
    'Nostro balance real-time và EOD khác nhau, treasury dùng cái nào để ra quyết định?'
  ],
  tags: ['Treasury', 'FTP', 'LCR', 'NSFR', 'cash positioning', 'liquidity', 'Basel III', 'ALM']
},
{
  id: 'banking-050',
  topic: 'banking',
  level: 'senior',
  q: 'Standing order / Recurring payment: thiết kế xử lý ngày nghỉ, thay đổi lãi suất/phí, retry khi thiếu tiền, pause/resume, và đối soát với core banking.',
  a: `**Tóm tắt:** **Standing order** (lệnh thường trực) là lệnh chuyển tiền định kỳ do khách thiết lập một lần (ví dụ: chuyển 5 triệu sang tài khoản tiết kiệm hàng tháng ngày 5). Khác với **Direct Debit** (ủy quyền thu — bên thụ hưởng chủ động thu), standing order do **người gửi chủ động đẩy**. Thiết kế phải xử lý: business date & holiday calendar, rate/fee versioning, retry strategy khi thiếu tiền, pause/resume/cancel, idempotency, và đối soát cuối ngày với core.
### Standing order vs Direct Debit
 | | Standing Order (Lệnh thường trực) | Direct Debit (Ủy quyền thu) |
 |---|---|---|
 | Người khởi tạo | Người gửi (payer) | Người nhận (payee/merchant) |
 | Kiểm soát | Người gửi quyết định số tiền, ngày | Người nhận quyết định (trong hạn mức ủy quyền) |
 | Linh hoạt | Cố định (số tiền, ngày) | Có thể thay đổi số tiền mỗi kỳ |
 | Ví dụ | Chuyển tiết kiệm, trả góp tự thiết lập | Hóa đơn điện, bảo hiểm, thuê bao |
### Mô hình dữ liệu cốt lõi
 ~~~text
 standing_order:
   id, customer_id, debit_account, credit_account, amount, currency
   frequency: DAILY | WEEKLY | MONTHLY | QUARTERLY | YEARLY
   day_of_month (1-28, hoặc LAST_DAY), day_of_week (MON-SUN)
   start_date, end_date (NULL = vô hạn)
   status: ACTIVE | PAUSED | CANCELLED | EXPIRED
   fee_plan_id, rate_plan_id (tham chiếu versioned plan)
   retry_policy: MAX_ATTEMPTS, INTERVAL_DAYS[], FAIL_ACTION (PAUSE/CANCEL)
   created_at, updated_at, version
 
 standing_order_run:
   order_id, business_date, attempt_no, status (PENDING/SUCCESS/FAILED/SKIPPED)
   amount, fee_amount, rate_snapshot_json, idempotency_key
   error_code, error_message, created_at
   PRIMARY KEY (order_id, business_date) -- idempotent theo kỳ
 ~~~
### Xử lý ngày nghỉ & Business Date
 - **Business date** ≠ calendar date. Xem banking-006, banking-028.
 - Quy tắc {{day_of_month = 31}} mà tháng chỉ có 30 ngày -> **LAST_DAY** của tháng đó.
 - Ngày chạy rơi vào **nghỉ (weekend, holiday)**: ba chiến lược cấu hình được:
   1. **PREVIOUS_WORKING_DAY** (chạy sớm hơn) — phổ biến cho standing order gửi tiết kiệm.
   2. **NEXT_WORKING_DAY** (chạy muộn hơn) — phổ biến cho trả nợ (tránh trễ hạn).
   3. **SKIP** (bỏ qua kỳ này, đợi kỳ sau) — ít dùng, phải có sự đồng ý khách.
 - Calendar phải **per currency/country** (USD holiday khác VND holiday).
### Versioning lãi suất/phí (Rate/Fee Plan)
 Số tiền/phí có thể thay đổi theo thời gian (ví dụ phí chuyển khoản tăng từ 1/1). Standing order phải **snapshot** plan tại kỳ chạy:
 - {{rate_plan_id}} trỏ đến {{rate_plan(plan_id, version, effective_from, effective_to, fee_structure_json)}}.
 - Khi chạy kỳ, lấy plan có {{effective_from <= business_date < effective_to}}.
 - Lưu {{rate_snapshot_json}} trong {{standing_order_run}} để đối soát sau này.
### Retry khi thiếu tiền
 Thiếu tiền là lỗi **nghiệp vụ có thể chờ**, khác lỗi kỹ thuật.
 ~~~text
 Attempt 1: ngay ngày chạy (business_date). Thiếu tiền -> PENDING_RETRY.
 Attempt 2: sau 1 ngày (D+1). Vẫn thiếu -> PENDING_RETRY.
 Attempt 3: sau 2 ngày nữa (D+3). Vẫn thiếu -> FAILED.
 Hết attempt: cập nhật order status = PAUSED (hoặc CANCELLED theo config), ghi log, thông báo khách.
 ~~~
 **Quan trọng**: Mỗi attempt là một giao dịch riêng (idempotency key riêng), nhưng **cùng một kỳ** ({{business_date}}). Khi attempt nào thành công -> các attempt sau bị SKIPPED, kỳ đó coi là SUCCESS.
### Pause / Resume / Cancel
 - **Pause**: khách tạm dừng (ví dụ đi xa). Order status = PAUSED. Job bỏ qua. Resume -> ACTIVE, tiếp tục từ kỳ tới (không chạy lùi kỳ đã bỏ).
 - **Cancel**: khách hủy vĩnh viễn. Status = CANCELLED. Không thể resume (phải tạo mới).
 - **Expire**: {{end_date}} đến. Status = EXPIRED.
 - Mọi thay đổi status phải **maker-checker** (xem banking-026) và ghi audit trail.
### Idempotency & Đối soát với Core
 - Mỗi kỳ ({{order_id}} + {{business_date}}) chỉ được chạy **một lần** -> PRIMARY KEY trên {{standing_order_run}}.
 - Job chạy: {{INSERT ... ON CONFLICT DO NOTHING}} -> nếu đã có row -> bỏ qua (idempotent).
 - Giao dịch thành công -> ghi ledger/core banking trong **cùng transaction** với insert {{standing_order_run}}.
 - Đối soát EOD: so khớp {{standing_order_run}} (status=SUCCESS) với ledger/core entries theo {{idempotency_key}}. Lệch -> queue tra soát.
### Code/Java: Job chạy standing order
 ~~~java
 @Scheduled(cron = "0 0 2 * * ?") // chạy 2h sáng hàng ngày
 void runDailyStandingOrders(LocalDate bizDate) {
     List<StandingOrder> dueOrders = repo.findDue(bizDate); // đã áp dụng holiday rule
     for (StandingOrder so : dueOrders) {
         txTemplate.execute(status -> {
             // Idempotent: insert run record
             boolean inserted = runRepo.insertIfNew(so.id(), bizDate, generateIdemKey(so, bizDate));
             if (!inserted) return; // đã chạy kỳ này
             
             // Kiểm tra số dư available balance
             if (!accountService.hasAvailableBalance(so.debitAccount(), so.amount())) {
                 runRepo.markPendingRetry(so.id(), bizDate, 1);
                 return;
             }
             
             // Thực hiện chuyển tiền (core banking)
             TransferResult tr = transferService.execute(so.debitAccount(), so.creditAccount(),
                                                         so.amount(), so.currency(),
                                                         so.idempotencyKey());
             if (tr.success()) {
                 runRepo.markSuccess(so.id(), bizDate, tr.txId());
             } else {
                 runRepo.markFailed(so.id(), bizDate, tr.errorCode());
                 scheduleRetry(so, bizDate, 1);
             }
         });
     }
 }
 ~~~
### Lỗi hay gặp
 - Chạy theo **calendar date** không phải business date -> sai ngày tháng 2, ngày nghỉ.
 - Không snapshot fee/rate -> phí thay đổi giữa chừng, đối soát không khớp.
 - Retry không giới hạn -> hàng nghìn attempt, hệ thống nghẽn, khách bị spam thông báo.
 - Pause/Resume không audit -> không biết ai pause khi nào,égi.
 - Không khóa (order_id, business_date) -> job chạy lại tạo giao dịch trùng.
 - Đối soát chỉ so tổng tiền -> bỏ sót lệch chi tiết.
### Ví dụ đời thực
 
 Một ngân hàng có 500.000 standing order chuyển tiết kiệm hàng tháng. Tháng 2, ngày 5 rơi vào thứ 6, nhưng nhiều khách chọn {{day_of_month=31}} -> quy tắc LAST_DAY nên chạy ngày 28/2. Code cũ dùng {{LocalDate.of(year, month, dayOfMonth)}} -> ném exception DateTimeException tháng 2 không có ngày 31, job dừng, 12.000 lệnh không chạy. Khách khiếu nại không thấy tiền chuyển. Dev fix: áp dụng {{YearMonth.lengthOfMonth()}} và holiday calendar {{PREVIOUS_WORKING_DAY}}. Thêm: phí chuyển khoản tăng từ 1/7 nhưng standing order không snapshot -> tháng 7 khách bị trừ phí cũ, ngân hàng lỗ phí. Bổ sung {{rate_plan_id}} versioned, lưu snapshot trong run record. Kết quả: 0 lỗi ngày 31/28/30, phí đúng 100%, đối soát EOD khớp.
### Trả lời mẫu khi phỏng vấn
 
 "Standing order do người gửi chủ động đẩy tiền định kỳ, khác Direct Debit (người nhận thu). Thiết kế cốt lõi: (1) **Business date + holiday calendar** — ngày 31 thành LAST_DAY, ngày nghĩ PREV/NEXT/SKIP configurable per currency. (2) **Rate/Fee plan versioning** — snapshot plan tại kỳ chạy, lưu trong run record. (3) **Retry** — D+0, D+1, D+3 tối đa 3 attempt/ kỳ, mỗi attempt idempotency key riêng, thành công thì dừng retry. (4) **Pause/Resume/Cancel** — status machine, maker-checker, audit trail, resume chỉ từ kỳ tới. (5) **Idempotent** — PK (order_id, business_date), insert ON CONFLICT DO NOTHING, cùng transaction với core transfer. Đối soát EOD khớp run record vs ledger theo idempotency key. Thực tế: em từng fix bug tháng 2 ngày 31 ném exception, và phí không snapshot gây lỗ — sau khi bổ sung calendar + versioned plan, 500k lệnh chạy trôi."
 
 > Senior tip: Ba chốt: (1) **Business date ≠ calendar date** — luôn có calendar per currency, rule PREV/NEXT/SKIP. (2) **Snapshot mọi thứ** — amount, fee, rate, FX rate tại kỳ chạy. (3) **Retry có giới hạn & idempotent** — không để attempt tràn, không để retry tạo giao dịch trùng. Hỏi interviewer: "standing order của anh có cho phép thay đổi amount giữa chừng không? Nếu có thì versioning phức tạp hơn."
 
 > Cụm từ: Business date (ngày nghiệp vụ) là ngày sổ sách của ngân hàng, khác ngày dương lịch. LAST_DAY là ngày cuối cùng của tháng (28/29/30/31 tùy tháng). Idempotency key là mã duy nhất cho một lần thử thực hiện một kỳ standing order.
 
  `,
  follow: [
    'Standing order và Direct Debit khác nhau ở quyền kiểm soát số tiền/ngày, và rủi ro nào cao hơn?',
    'Khi rate plan thay đổi giữa kỳ (ví dụ phí tăng 1/7 mà kỳ chạy 28/6), bạn áp dụng rate cũ hay mới?',
    'Nếu khách pause standing order 3 tháng rồi resume, các kỳ pause có được chạy bù (backfill) không?'
  ],
  tags: ['standing order', 'recurring payment', 'direct debit', 'business date', 'holiday calendar', 'retry', 'idempotency']
},
{
  id: 'banking-051',
  topic: 'banking',
  level: 'senior',
  q: 'Thiết kế hệ thống tài khoản kế toán (chart of accounts) cho ngân hàng số: cấu trúc 5 bậc, cách map giao dịch vào tài khoản Nợ/Có, và vì sao phải có sub-ledger riêng cho từng loại sản phẩm (tiền gửi, vay, thẻ...) trước khi tổng hợp lên general ledger?',
  a: `**Tóm tắt:** Chart of accounts (bảng hệ thống tài khoản kế toán) là danh sách có cấu trúc phân cấp các tài khoản mà ngân hàng dùng để ghi nhận mọi giao dịch. Ngân hàng thường dùng hệ thống 5 bậc: 1xxx = tài sản (tiền mặt, cho vay, đầu tư), 2xxx = nợ phải trả (tiền gửi khách hàng, nợ vay), 3xxx = vốn chủ sở hữu, 4xxx = doanh thu, 5xxx = chi phí. Mỗi giao dịch phải map ít nhất 2 tài khoản: một tài khoản Nợ (debit) và một tài khoản Có (credit), đảm bảo tổng Nợ = tổng Có.
### Cấu trúc 5 bậc

Hệ thống tài khoản kế toán (chart of accounts - bảng hệ thống tài khoản) giống như một cái cây phân cấp, mỗi nhánh là một loại tài khoản:

~~~text
1xxx - Tài sản (Assets)
  1010 - Tiền mặt tại quỹ
  1020 - Tiền gửi tại ngân hàng nhà nước
  1030 - Tiền gửi tại ngân hàng khác
  1100 - Cho vay khách hàng
  1200 - Đầu tư chứng khoán
  
2xxx - Nợ phải trả (Liabilities)
  2010 - Tiền gửi không kỳ hạn
  2020 - Tiền gửi có kỳ hạn
  2030 - Tiền gửi tiết kiệm
  2100 - Nợ vay ngân hàng khác
  
3xxx - Vốn chủ sở hữu (Equity)
  3010 - Vốn điều lệ
  3020 - Lợi nhuận giữ lại
  
4xxx - Doanh thu (Revenue)
  4010 - Lãi từ cho vay
  4020 - Lãi từ đầu tư
  4030 - Phí dịch vụ
  
5xxx - Chi phí (Expenses)
  5010 - Chi phí nhân sự
  5020 - Chi phí hoạt động
  5030 - Chi phí dự phòng
~~~
### Sub-ledger vs General ledger

**Sub-ledger** (sổ cái chi tiết) là sổ ghi chi tiết từng giao dịch của từng khách hàng/sản phẩm. **General ledger** (sổ cái tổng hợp) là sổ tổng hợp, chỉ ghi tổng số tiền của từng tài khoản.

Ví dụ: khi khách A gửi 1 triệu vào tài khoản tiết kiệm:
- Sub-ledger tiết kiệm: ghi chi tiết "khách A +1.000.000"
- General ledger: ghi "tài khoản 2030 (tiền gửi tiết kiệm) +1.000.000" (tổng của tất cả khách)

**Vì sao phải có sub-ledger riêng?**
- **Hiệu năng**: General ledger chỉ lưu tổng, không lưu từng giao dịch. Nếu query "số dư khách A" trên GL sẽ rất chậm. Sub-ledger cho phép query nhanh theo khách hàng.
- **Audit**: Cần biết chính xác khách nào gửi bao nhiêu vào lúc nào.
- **Đối soát**: So khớp sub-ledger với GL để phát hiện lỗi (tổng sub-ledger phải = tổng GL).
### Map giao dịch vào Nợ/Có

Ví dụ khách A rút 500.000 từ tài khoản tiết kiệm:
~~~text
Ghi Nợ (Debit):  2030 - Tiền gửi tiết kiệm  +500.000 (giảm nợ phải trả)
Ghi Có (Credit): 1010 - Tiền mặt tại quỹ    +500.000 (tăng tài sản)
~~~

**Quy tắc**: Tài sản tăng = Nợ, giảm = Có. Nợ phải trả tăng = Có, giảm = Nợ.
### Code/Java: Ghi bút toán kép

~~~java
@Entity
@Table(name = "gl_entries")
class GlEntry {
    @Id @GeneratedValue
    Long id;
    String accountCode;      // ví dụ "2030"
    BigDecimal amount;
    String type;             // "DEBIT" hoặc "CREDIT"
    String txId;             // id giao dịch
    LocalDateTime createdAt;
}

@Service
class LedgerService {
    @Transactional
    public void recordTransfer(String fromAccount, String toAccount, BigDecimal amount, String txId) {
        // Ghi Nợ tài khoản nguồn (giảm số dư)
        glEntryRepo.save(new GlEntry(fromAccount, amount, "DEBIT", txId));
        // Ghi Có tài khoản đích (tăng số dư)
        glEntryRepo.save(new GlEntry(toAccount, amount, "CREDIT", txId));
        
        // Cập nhật số dư (trong cùng transaction)
        accountRepo.decreaseBalance(fromAccount, amount);
        accountRepo.increaseBalance(toAccount, amount);
    }
}
~~~
### Bảng trade-off: Sub-ledger riêng vs Dùng chung GL

| Tiêu chí | Sub-ledger riêng | Dùng chung GL |
|---|---|---|
| Query theo khách hàng | Nhanh (index theo customer_id) | Chậm (phải filter toàn bộ) |
| Audit chi tiết | Có | Không (chỉ có tổng) |
| Hiệu năng ghi | Chậm hơn (2 bảng) | Nhanh hơn (1 bảng) |
| Đối soát | Dễ (so 2 bảng) | Khó (phải tính lại từ đầu) |
| Chi phí lưu trữ | Cao hơn | Thấp hơn |
### Lỗi hay gặp trên production

- **Không map đủ tài khoản**: Ghi Nợ nhưng quên ghi Có → mất cân bằng. Phải có validation: tổng Nợ = tổng Có.
- **Dùng số nguyên thay BigDecimal**: Làm tròn sai, mất tiền.
- **Không có transaction**: Ghi Nợ thành công nhưng ghi Có thất bại → mất tiền.
- **Sub-ledger và GL không khớp**: Do bug hoặc race condition. Phải có job đối soát định kỳ.
### Ví dụ đời thực

Một ngân hàng số có 2 triệu tài khoản tiết kiệm. Hệ thống cũ dùng chung GL, mỗi lần query "số dư khách A" phải quét toàn bộ bảng → 3-5 giây. Khách phàn nàn app chậm. Dev fix: tách sub-ledger riêng cho tiết kiệm, index theo customer_id. Query giảm còn 50ms. Thêm: đối soát EOD so sub-ledger vs GL, phát hiện 1.2 tỷ lệch do bug ghi thiếu Nợ. Sau fix: 0 lệch, query nhanh 100x.
### Trả lời mẫu khi phỏng vấn

"Chart of accounts là xương sống của hệ thống kế toán ngân hàng. Thiết kế cốt lõi: (1) **Cấu trúc 5 bậc** — 1xxx tài sản, 2xxx nợ phải trả, 3xxx vốn, 4xxx doanh thu, 5xxx chi phí. Mỗi giao dịch map ít nhất 2 tài khoản Nợ/Có, tổng Nợ phải = tổng Có. (2) **Sub-ledger riêng cho từng sản phẩm** — tiết kiệm, vay, thẻ... cho phép query nhanh theo khách hàng, audit chi tiết, đối soát dễ. (3) **General ledger tổng hợp** — chỉ lưu tổng, không lưu chi tiết. (4) **Transaction bắt buộc** — ghi Nợ và Có trong cùng transaction, nếu một cái fail thì rollback cả hai. (5) **Đối soát định kỳ** — so sub-ledger vs GL, phát hiện lệch sớm. Thực tế: em từng fix bug query chậm 5s do dùng chung GL, sau khi tách sub-ledger còn 50ms, và phát hiện 1.2 tỷ lệch do thiếu Nợ — sau fix thì 0 lệch."

> Senior tip: Ba chốt: (1) **Sub-ledger ≠ GL** — sub-ledger cho chi tiết, GL cho tổng hợp. (2) **Nợ/Có phải cân bằng** — validation trước khi commit. (3) **Đối soát định kỳ** — so sub-ledger vs GL hàng ngày, phát hiện lệch sớm. Hỏi interviewer: "Hệ thống của anh dùng chung GL hay sub-ledger riêng? Nếu chung thì query theo khách hàng có chậm không?"

> Cụm từ: Chart of accounts (bảng hệ thống tài khoản kế toán) là danh sách phân cấp các tài khoản. Sub-ledger (sổ cái chi tiết) là sổ ghi chi tiết từng giao dịch. General ledger (sổ cái tổng hợp) là sổ tổng hợp. Debit (Nợ) là ghi tăng tài sản/giảm nợ phải trả. Credit (Có) là ghi giảm tài sản/tăng nợ phải trả.

  `,
  follow: [
    'Khi khách có nhiều loại tài khoản (tiết kiệm, vay, thẻ), sub-ledger được thiết kế thế nào để query nhanh?',
    'Nếu sub-ledger và GL lệch nhau (ví dụ 1 tỷ), bạn điều tra thế nào và fix ra sao?',
    'Chart of accounts có nên thay đổi theo thời gian không (ví dụ thêm tài khoản mới)? Nếu có thì ảnh hưởng đến báo cáo tài chính thế nào?'
  ],
  tags: ['chart of accounts', 'general ledger', 'sub-ledger', 'double-entry', 'accounting', 'banking']
},
{
  id: 'banking-052',
  topic: 'banking',
  level: 'senior',
  q: 'Đối soát trong ngày (intraday reconciliation) khác gì so với đối soát cuối ngày (EOD)? Khi nào cần chạy intraday, kiến trúc thế nào, và các chỉ số quan trọng cần theo dõi (alert, dashboard)?',
  a: `**Tóm tắt:** Đối soát trong ngày (intraday reconciliation) là quy trình kiểm tra số dư và giao dịch theo thời gian thực hoặc gần thời gian thực, khác với đối soát cuối ngày (EOD) chạy batch một lần. Mục đích: phát hiện lỗi sớm (trước khi tích lũy thành lỗi lớn), giảm thời gian phát hiện (MTTD - Mean Time To Detect), và cho phép can thiệp ngay lập tức thay vì đợi đến cuối ngày.
### EOD vs Intraday

**EOD (End of Day)**: Chạy 1 lần vào cuối ngày (ví dụ 23h hoặc 0h sáng hôm sau), so toàn bộ giao dịch trong ngày với file đối tác, xử lý lệch. Phát hiện lỗi sau 24 giờ.

**Intraday**: Chạy liên tục hoặc theo chu kỳ ngắn (5 phút, 15 phút, 1 giờ). So số dư real-time với expected balance, alert nếu lệch. Phát hiện lỗi trong vài phút.
### Khi nào cần Intraday?

- **Giao dịch lớn, giá trị cao**: Chuyển khoản liên ngân hàng hàng tỷ đồng → cần phát hiện lỗi ngay.
- **Hệ thống có SLA cao**: Payment gateway, ví điện tử → không thể đợi EOD.
- **Nhiều đối tác**: NAPAS, ngân hàng khác, tổ chức thẻ → mỗi đối tác có file riêng, cần so liên tục.
- **Fraud detection**: Phát hiện giao dịch bất thường real-time.
### Kiến trúc Intraday Reconciliation

~~~text
[Transaction Stream] → [Kafka/Event Bus] → [Reconciliation Engine] → [Alert/ Dashboard]
                                              ↓
                                    [Expected Balance Cache]
                                    (Redis, tính real-time)
~~~

**Thành phần**:
1. **Transaction Stream**: Mọi giao dịch (transfer, payment, withdrawal) đều publish event lên Kafka.
2. **Reconciliation Engine**: Consumer đọc event, so với expected balance (tính từ initial balance + các giao dịch đã xử lý).
3. **Alert**: Nếu lệch > threshold (ví dụ 1 triệu), gửi alert qua Slack/Email/PagerDuty.
4. **Dashboard**: Hiển thị real-time số dư, giao dịch, lệch.
### Code/Java: Intraday Reconciliation Service

~~~java
@Service
class IntradayReconciliationService {
    
    @Autowired
    private AccountBalanceCache balanceCache; // Redis cache
    
    @Autowired
    private ReconciliationAlertService alertService;
    
    @KafkaListener(topics = "transactions")
    public void reconcileTransaction(TransactionEvent event) {
        // Lấy số dư expected từ cache (tính real-time)
        BigDecimal expected = balanceCache.getExpectedBalance(event.accountId());
        BigDecimal actual = accountRepo.getBalance(event.accountId());
        
        // So sánh với tolerance (ví dụ 1.000 VND)
        BigDecimal diff = actual.subtract(expected).abs();
        if (diff.compareTo(new BigDecimal("1000")) > 0) {
            // Lệch quá lớn → alert ngay
            alertService.sendAlert(Alert.builder()
                .accountId(event.accountId())
                .expected(expected)
                .actual(actual)
                .diff(diff)
                .severity(AlertSeverity.HIGH)
                .build());
        }
        
        // Cập nhật expected balance
        balanceCache.updateExpectedBalance(event.accountId(), actual);
    }
}
~~~
### Bảng trade-off: EOD vs Intraday

| Tiêu chí | EOD | Intraday |
|---|---|---|
| Thời gian phát hiện lỗi | 24h | Vài phút |
| Chi phí compute | Thấp (batch 1 lần) | Cao (real-time) |
| Độ phức tạp | Thấp | Cao (streaming, cache) |
| Khả năng mở rộng | Dễ (batch job) | Khó hơn (stateful) |
| Phù hợp | Giao dịch nhỏ, batch | Giao dịch lớn, real-time |
### Các chỉ số quan trọng cần theo dõi

- **MTTD (Mean Time To Detect)**: Thời gian trung bình phát hiện lỗi. Mục tiêu: < 5 phút.
- **MTTR (Mean Time To Recovery)**: Thời gian trung bình khắc phục. Mục tiêu: < 30 phút.
- **Lệch tích lũy**: Tổng số tiền lệch trong ngày. Nếu > threshold → dừng giao dịch.
- **Số lượng alert**: Quá nhiều alert → alert fatigue. Cần tune threshold.
- **False positive rate**: Tỷ lệ alert sai (không phải lỗi thật). Mục tiêu: < 5%.
### Lỗi hay gặp trên production

- **Cache không đồng bộ**: Redis cache và DB không khớp → alert sai.
- **Event mất**: Kafka consumer lag → không xử lý kịp → lỗi không phát hiện.
- **Threshold quá thấp**: Alert quá nhiều → bỏ qua alert thật.
- **Không có dashboard**: Chỉ có alert, không có dashboard → không biết xu hướng.
### Ví dụ đời thực

Một ví điện tử có 5 triệu giao dịch/ngày. Hệ thống cũ chỉ EOD, phát hiện lỗi sau 24h → khách khiếu nại, tiền mất. Dev fix: thêm intraday reconciliation với Kafka + Redis cache. Alert nếu lệch > 10.000 VND. Kết quả: MTTD giảm từ 24h xuống 3 phút, phát hiện 99.9% lỗi trước khi khách khiếu nại. Thêm: dashboard hiển thị real-time 50 chỉ số (số dư, giao dịch, lệch, alert...). Giám đốc điều hành xem dashboard hàng ngày.
### Trả lời mẫu khi phỏng vấn

"Đối soát trong ngày khác EOD ở chỗ chạy real-time thay vì batch. Thiết kế cốt lõi: (1) **Transaction stream qua Kafka** — mọi giao dịch publish event, consumer xử lý real-time. (2) **Expected balance cache (Redis)** — tính số dư expected từ initial balance + các giao dịch đã xử lý, so với actual balance từ DB. (3) **Alert thông minh** — chỉ alert khi lệch > threshold (ví dụ 10.000 VND), tránh alert fatigue. (4) **Dashboard real-time** — hiển thị MTTD, MTTR, số lượng alert, false positive rate. (5) **Tích lũy lệch** — nếu tổng lệch trong ngày > threshold → dừng giao dịch, điều tra. Thực tế: em từng fix MTTD 24h xuống 3 phút với 5 triệu giao dịch/ngày, phát hiện 99.9% lỗi trước khi khách khiếu nại."

> Senior tip: Ba chốt: (1) **MTTD < 5 phút** — nếu > 5 phút thì không còn là intraday. (2) **Alert có threshold** — không alert tất cả, chỉ alert khi lệch > threshold. (3) **Dashboard real-time** — giám đốc điều hành cần xem real-time, không đợi EOD. Hỏi interviewer: "Hệ thống của anh có intraday reconciliation không? Nếu có thì MTTD là bao nhiêu?"

> Cụm từ: Intraday reconciliation (đối soát trong ngày) là quy trình kiểm tra real-time. EOD (End of Day) là đối soát cuối ngày. MTTD (Mean Time To Detect) là thời gian trung bình phát hiện lỗi. MTTR (Mean Time To Recovery) là thời gian trung bình khắc phục. False positive (dương tính giả) là alert sai (không phải lỗi thật).

  `,
  follow: [
    'Khi có quá nhiều alert (alert fatigue), bạn tune threshold thế nào để không bỏ lỡ alert thật?',
    'Intraday reconciliation và EOD reconciliation có thể chạy song song không? Nếu có thì xử lý xung đột thế nào?',
    'Nếu Kafka consumer lag quá cao (ví dụ 10 phút), bạn xử lý thế nào để không mất giao dịch?'
  ],
  tags: ['core', 'intraday reconciliation', 'real-time', 'kafka', 'redis', 'monitoring', 'alert']
},
{
  id: 'banking-053',
  topic: 'banking',
  level: 'lead',
  q: 'SWIFT MT103 và MT202 là gì, khác nhau thế nào, và khi nào dùng message nào trong chuyển tiền quốc tế? Flow xử lý từ ngân hàng gửi đến ngân hàng nhận diễn ra thế nào?',
  a: `**Tóm tắt:** SWIFT (Society for Worldwide Interbank Financial Telecommunication) là mạng lưới liên ngân hàng quốc tế. MT103 là message chuyển tiền khách hàng (customer credit transfer), MT202 là message chuyển tiền giữa các ngân hàng (bank-to-bank). Khác biệt chính: MT103 dùng cho chuyển tiền của khách hàng (có thông tin người gửi/nhận), MT202 dùng cho thanh toán nội bộ ngân hàng (không cần thông tin khách hàng). MT202 COV là phiên bản mở rộng của MT202, có thêm thông tin khách hàng.
### SWIFT là gì?

SWIFT là tổ chức hợp tác của các ngân hàng trên toàn thế giới, cung cấp mạng lưới nhắn tin tài chính an toàn. Mỗi ngân hàng có một mã SWIFT/BIC (ví dụ: CITIUS33 cho Citibank New York). SWIFT không chuyển tiền, chỉ truyền thông điệp giữa các ngân hàng.
### MT103 vs MT202

**MT103 (Customer Credit Transfer)**: Chuyển tiền của khách hàng. Có thông tin người gửi (ordering customer) và người nhận (beneficiary customer). Dùng cho:
- Chuyển tiền cá nhân/doanh nghiệp ra nước ngoài
- Thanh toán hóa đơn quốc tế
- Chuyển tiền kiều hối

**MT202 (Bank-to-Bank Transfer)**: Chuyển tiền giữa các ngân hàng. Không cần thông tin khách hàng. Dùng cho:
- Thanh toán nội bộ ngân hàng (ví dụ: chi nhánh A gửi tiền cho chi nhánh B)
- Thanh toán liên ngân hàng (correspondent banking)
- Thanh toán bù trừ (clearing)

**MT202 COV**: Phiên bản mở rộng của MT202, có thêm thông tin khách hàng (từ MT103). Dùng khi cần gửi cả thông tin ngân hàng và khách hàng trong một message.
### Flow xử lý MT103

~~~text
[Ngân hàng A] → MT103 → [Ngân hàng B (correspondent)] → MT202 → [Ngân hàng C (beneficiary)]
     ↓                                    ↓                                    ↓
  Ghi Nợ tài khoản VNostro            Ghi Nợ VNostro A                Ghi Có tài khoản khách
  Ghi Có VNostro A                    Ghi Có VNostro C                Thông báo khách nhận
~~~

**Bước 1**: Ngân hàng A gửi MT103 đến ngân hàng trung gian (correspondent bank).
**Bước 2**: Ngân hàng trung gian gửi MT202 đến ngân hàng nhận.
**Bước 3**: Ngân hàng nhận ghi Có tài khoản khách hàng, thông báo khách nhận.
### Các trường quan trọng trong MT103

- **F32A**: Ngày giá trị (value date), tiền tệ, số tiền
- **F50**: Thông tin người gửi (ordering customer)
- **F59**: Thông tin người nhận (beneficiary customer)
- **F70**: Thông tin bổ sung (remittance information)
- **F71A**: Loại phí (OUR/SHA/BEN)
### Code/Java: Xử lý MT103

~~~java
@Service
class SwiftMessageService {
    
    @Autowired
    private SwiftRepository swiftRepo;
    
    @Autowired
    private LedgerService ledgerService;
    
    public void processMT103(String message) {
        // Parse message
        MT103 mt103 = swiftParser.parseMT103(message);
        
        // Validate
        if (!validator.isValid(mt103)) {
            throw new InvalidSwiftMessageException("Invalid MT103");
        }
        
        // Ghi Nợ tài khoản Nostro của ngân hàng gửi
        ledgerService.debit(mt103.getOrderingBank(), mt103.getAmount());
        
        // Ghi Có tài khoản Nostro của ngân hàng nhận
        ledgerService.credit(mt103.getBeneficiaryBank(), mt103.getAmount());
        
        // Lưu message
        swiftRepo.save(mt103);
        
        // Gửi MT202 đến ngân hàng nhận
        String mt202 = swiftParser.createMT202(mt103);
        swiftGateway.send(mt202);
    }
}
~~~
### Bảng trade-off: MT103 vs MT202 vs MT202 COV

| Tiêu chí | MT103 | MT202 | MT202 COV |
|---|---|---|---|
| Thông tin khách hàng | Có | Không | Có |
| Chi phí | Cao hơn | Thấp hơn | Trung bình |
| Tốc độ xử lý | Chậm hơn (nhiều bước) | Nhanh hơn | Trung bình |
| Phù hợp | Chuyển tiền khách hàng | Thanh toán nội bộ ngân hàng | Cần cả hai |
### Lỗi hay gặp trên production

- **Sai value date**: Tính lãi sai → khiếu nại khách hàng.
- **Thiếu thông tin beneficiary**: Ngân hàng nhận không biết ghi Có cho ai → treo tiền.
- **Không đối soát với Nostro/Vostro**: Lệch số dư → mất tiền.
- **Không xử lý reject/cancel**: Message bị từ chối nhưng không rollback.
### Ví dụ đời thực

Một ngân hàng Việt Nam chuyển 1 triệu USD cho khách hàng ở Mỹ qua Citibank. Flow: Vietcombank gửi MT103 → Citibank (correspondent) → Bank of America (beneficiary). Citibank tính phí 15 USD (SHA), Bank of America tính phí 10 USD (SHA). Khách nhận 999.975 USD. Nếu sai value date → tính lãi sai 2 ngày → khiếu nại. Dev fix: validate value date, đối soát Nostro/Vostro hàng ngày. Kết quả: 0 sai value date, đối soát khớp 100%.
### Trả lời mẫu khi phỏng vấn

"SWIFT là mạng lưới liên ngân hàng quốc tế. MT103 dùng cho chuyển tiền khách hàng (có thông tin người gửi/nhận), MT202 dùng cho thanh toán nội bộ ngân hàng (không cần thông tin khách hàng), MT202 COV là phiên bản mở rộng của MT202 có thêm thông tin khách hàng. Flow MT103: ngân hàng gửi gửi MT103 đến correspondent bank, correspondent bank gửi MT202 đến beneficiary bank, beneficiary bank ghi Có tài khoản khách và thông báo khách nhận. Thiết kế cốt lõi: (1) **Validate message** — kiểm tra value date, amount, thông tin bắt buộc. (2) **Ghi Nostro/Vostro** — ghi Nợ tài khoản Nostro ngân hàng gửi, ghi Có Nostro ngân hàng nhận. (3) **Đối soát hàng ngày** — so Nostro/Vostro với SWIFT statement. (4) **Xử lý reject/cancel** — rollback giao dịch nếu message bị từ chối. Thực tế: em từng fix sai value date gây khiếu nại, sau khi validate thì 0 sai."

> Senior tip: Ba chốt: (1) **MT103 ≠ MT202** — MT103 có thông tin khách hàng, MT202 không. (2) **Value date quan trọng** — sai value date = sai lãi. (3) **Đối soát Nostro/Vostro** — so hàng ngày, phát hiện lệch sớm. Hỏi interviewer: "Ngân hàng anh có dùng SWIFT không? Nếu có thì xử lý reject/cancel thế nào?"

> Cụm từ: SWIFT (Society for Worldwide Interbank Financial Telecommunication) là mạng lưới liên ngân hàng quốc tế. MT103 là message chuyển tiền khách hàng. MT202 là message chuyển tiền giữa các ngân hàng. MT202 COV là phiên bản mở rộng của MT202 có thông tin khách hàng. Nostro account (tài khoản Nostro) là tài khoản của ngân hàng A mở tại ngân hàng B ở nước ngoài. Vostro account (tài khoản Vostro) là tài khoản của ngân hàng nước ngoài mở tại ngân hàng A.

  `,
  follow: [
    'Khi MT103 bị reject (ví dụ sai thông tin beneficiary), bạn xử lý thế nào để không mất tiền?',
    'Nostro/Vostro account được ghi sổ thế nào trong hệ thống ledger? Ví dụ cụ thể.',
    'Nếu ngân hàng trung gian (correspondent bank) bị lỗi hệ thống, bạn có backup route không?'
  ],
  tags: ['swift', 'mt103', 'mt202', 'international transfer', 'nostro', 'vostro']
},
{
  id: 'banking-054',
  topic: 'banking',
  level: 'senior',
  q: 'Distributed lock là gì và vì sao cần trong hệ thống banking? So sánh Redlock (Redis) vs ZooKeeper vs Database lock: khi nào dùng cái nào, và các lỗi thường gặp (split-brain, lock timeout, thundering herd)?',
  a: `**Tóm tắt:** Distributed lock là cơ chế đồng bộ trên nhiều node/process để đảm bảo chỉ một process thực hiện một hành động tại một thời điểm. Trong banking, dùng để chống race condition khi nhiều service cùng xử lý một giao dịch (ví dụ: cùng lúc trừ tiền, cùng lúc cập nhật số dư). Redlock dùng Redis (nhanh, dễ setup), ZooKeeper dùng ZAB protocol (mạnh mẽ, đắt hơn), Database lock dùng SELECT FOR UPDATE (đơn giản, chậm hơn).
### Vì sao cần Distributed Lock?

Ví dụ: khách A có 1 triệu, cùng lúc 2 request rút 1 triệu:
- Request 1: đọc số dư 1 triệu → trừ 1 triệu → ghi 0
- Request 2: đọc số dư 1 triệu (trước khi request 1 ghi) → trừ 1 triệu → ghi 0

Kết quả: khách rút 2 triệu nhưng chỉ có 1 triệu → mất tiền. Distributed lock giải quyết: chỉ một request được xử lý tại một thời điểm.
### Redlock (Redis)

**Cách hoạt động**:
1. Client gửi SET key value NX PX timeout đến N Redis node (thường 5 node).
2. Nếu majority (> N/2) node trả về OK → lock acquired.
3. Client giữ lock trong timeout, làm việc.
4. Khi xong, gửi DEL key đến tất cả node.

**Ưu điểm**: Nhanh (sub-millisecond), dễ setup, phù hợp với high-throughput.
**Nhược điểm**: Không mạnh mẽ bằng ZooKeeper, có thể có split-brain nếu network partition.
### ZooKeeper

**Cách hoạt động**:
1. Client tạo ephemeral node (tự động xóa khi session mất).
2. Node có thứ tự (sequential), client watch node trước đó.
3. Nếu node trước bị xóa → client acquire lock.

**Ưu điểm**: Mạnh mẽ (ZAB protocol), đảm bảo linearizability, phù hợp với critical operations.
**Nhược điểm**: Chậm hơn Redis, đắt hơn (phải deploy cluster).
### Database Lock (SELECT FOR UPDATE)

**Cách hoạt động**:
1. BEGIN TRANSACTION.
2. SELECT * FROM account WHERE id = ? FOR UPDATE (khóa row).
3. Cập nhật số dư.
4. COMMIT (giải phóng lock).

**Ưu điểm**: Đơn giản, không cần thêm hạ tầng, đảm bảo ACID.
**Nhược điểm**: Chậm hơn (phải lock row), có thể gây deadlock.
### Code/Java: Redlock Implementation

~~~java
@Service
class DistributedLockService {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    public boolean tryLock(String key, Duration timeout) {
        String value = UUID.randomUUID().toString();
        // SET key value NX PX timeout
        Boolean success = redisTemplate.opsForValue()
            .setIfAbsent(key, value, timeout);
        return Boolean.TRUE.equals(success);
    }
    
    public void unlock(String key) {
        // Chỉ xóa nếu value khớp (tránh xóa lock của process khác)
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                       "return redis.call('del', KEYS[1]) else return 0 end";
        redisTemplate.execute(new DefaultRedisScript<>(script, Long.class),
                            Collections.singletonList(key), value);
    }
}
~~~
### Bảng trade-off: Redlock vs ZooKeeper vs DB Lock

| Tiêu chí | Redlock (Redis) | ZooKeeper | DB Lock |
|---|---|---|---|
| Tốc độ | Rất nhanh (sub-ms) | Nhanh (ms) | Chậm (10-100ms) |
| Chi phí | Thấp (Redis cluster) | Cao (ZooKeeper cluster) | Thấp (dùng DB hiện có) |
| Độ tin cậy | Trung bình | Cao | Cao |
| Độ phức tạp | Thấp | Cao | Thấp |
| Phù hợp | High-throughput, caching | Critical operations | Đơn giản, ít lock |
### Lỗi hay gặp trên production

- **Split-brain**: Network partition → 2 process cùng acquire lock → race condition.
- **Lock timeout quá ngắn**: Work chưa xong nhưng lock hết hạn → process khác acquire → xung đột.
- **Thundering herd**: Nhiều process cùng chờ lock → khi lock release, tất cả cùng acquire → quá tải.
- **Lock leak**: Process crash nhưng không release lock → lock treo vĩnh viễn.
### Ví dụ đời thực

Một ngân hàng số có 10 triệu giao dịch/ngày. Hệ thống cũ dùng DB lock (SELECT FOR UPDATE) → 50ms/giao dịch → throughput chỉ 20k TPS. Dev fix: dùng Redlock → 2ms/giao dịch → throughput 500k TPS. Thêm: lock timeout 30s, auto-renew (watchdog) để tránh lock leak. Kết quả: throughput tăng 25x, 0 race condition.
### Trả lời mẫu khi phỏng vấn

"Distributed lock là cơ chế đồng bộ trên nhiều node để chống race condition. Redlock dùng Redis (nhanh, dễ setup, phù hợp high-throughput), ZooKeeper dùng ZAB protocol (mạnh mẽ, đắt hơn, phù hợp critical operations), DB lock dùng SELECT FOR UPDATE (đơn giản, chậm hơn). Thiết kế cốt lõi: (1) **Chọn lock phù hợp** — Redlock cho high-throughput, ZooKeeper cho critical, DB lock cho đơn giản. (2) **Lock timeout** — đặt timeout đủ dài để work xong nhưng không quá dài để tránh lock leak. (3) **Auto-renew (watchdog)** — tự động gia hạn lock nếu work chưa xong. (4) **Unlock đúng cách** — chỉ xóa lock nếu value khớp (trាន xóa lock của process khác). (5) **Xử lý split-brain** — majority quorum để tránh 2 process cùng acquire. Thực tế: em từng fix throughput 20k → 500k TPS với Redlock, và thêm watchdog để tránh lock leak."

> Senior tip: Ba chốt: (1) **Lock timeout** — đặt đủ dài để work xong, đủ ngắn để tránh lock leak. (2) **Watchdog** — auto-renew lock nếu work chưa xong. (3) **Majority quorum** — tránh split-brain. Hỏi interviewer: "Hệ thống của anh dùng distributed lock không? Nếu có thì dùng Redis hay ZooKeeper?"

> Cụm từ: Distributed lock (khóa phân tán) là cơ chế đồng bộ trên nhiều node. Redlock là thuật toán distributed lock dùng Redis. ZooKeeper là hệ thống điều phối phân tán dùng ZAB protocol. Split-brain (não phân đôi) là tình trạng 2 process cùng acquire lock do network partition. Thundering herd (đàn ngựa phi nước đại) là tình trạng nhiều process cùng chờ lock và cùng acquire khi lock release.

  `,
  follow: [
    'Khi lock timeout quá ngắn và work chưa xong, bạn xử lý thế nào để tránh xung đột?',
    'Redlock có thực sự an toàn trong mọi trường hợp không? Khi nào nên dùng ZooKeeper thay thế?',
    'Nếu Redis cluster bị network partition, lock bị mất, bạn phát hiện và xử lý thế nào?'
  ],
  tags: ['distributed lock', 'redlock', 'zookeeper', 'concurrency', 'race condition']
},
{
  id: 'banking-055',
  topic: 'banking',
  level: 'senior',
  q: 'Transaction date và value date khác nhau thế nào trong banking? Khi nào tiền bắt đầu tính lãi, và ảnh hưởng đến báo cáo tài chính ra sao? Ví dụ cụ thể với cut-off time.',
  a: `**Tóm tắt:** Transaction date (ngày giao dịch) là ngày thực hiện giao dịch (ngày khách bấm nút "chuyển tiền"). Value date (ngày giá trị) là ngày mà số dư thực sự thay đổi và bắt đầu tính lãi. Khác biệt quan trọng: giao dịch có thể thực hiện hôm nay nhưng value date là ngày mai (ví dụ: chuyển tiền sau cut-off time). Value date ảnh hưởng đến: tính lãi, báo cáo tài chính, đối soát.
### Transaction Date vs Value Date

**Transaction Date (Ngày giao dịch)**: Ngày khách hàng thực hiện giao dịch. Ví dụ: khách bấm "chuyển tiền" vào 15h ngày 15/11.

**Value Date (Ngày giá trị)**: Ngày mà số dư thực sự thay đổi và bắt đầu tính lãi. Ví dụ: chuyển tiền trước cut-off time (16h) → value date = 15/11. Chuyển tiền sau cut-off time → value date = 16/11.
### Cut-off Time ảnh hưởng Value Date

**Cut-off time** là thời điểm cuối cùng trong ngày mà giao dịch được xử lý ngay. Sau cut-off time, giao dịch sẽ được xử lý vào ngày làm việc tiếp theo.

Ví dụ (cut-off time = 16h):
- Chuyển tiền lúc 15h ngày 15/11 (thứ 2) → value date = 15/11
- Chuyển tiền lúc 17h ngày 15/11 (thứ 2) → value date = 16/11 (thứ 3)
- Chuyển tiền lúc 17h ngày 15/11 (thứ 6) → value date = 18/11 (thứ 2, vì thứ 7 và chủ nhật là ngày nghỉ)
### Tính lãi theo Value Date

Lãi tiền gửi = Số dư × Lãi suất × Số ngày / 365

**Ví dụ**: Khách gửi 100 triệu, lãi suất 6%/năm, value date = 15/11, rút ngày 20/11.
- Số ngày = 20 - 15 = 5 ngày
- Lãi = 100.000.000 × 6% × 5 / 365 = 82.191 VND

Nếu value date sai (ví dụ 16/11 thay vì 15/11):
- Số ngày = 4 ngày
- Lãi = 65.753 VND
- Khách mất 16.438 VND → khiếu nại.
### Ảnh hưởng đến Báo cáo Tài chính

Báo cáo tài chính (financial statement) ghi nhận theo value date, không phải transaction date. Ví dụ:
- Ngày 31/12: khách chuyển 1 tỷ vào lúc 23h 31/12, value date = 1/1 năm sau.
- Báo cáo 31/12: không ghi nhận 1 tỷ này (vì value date = 1/1).
- Báo cáo 1/1: ghi nhận 1 tỷ này.

Nếu ghi nhận theo transaction date → sai báo cáo → kiểm toán không chấp nhận.
### Code/Java: Xử lý Value Date

~~~java
@Service
class ValueDateService {
    
    @Autowired
    private CutOffTimeConfig cutOffConfig;
    
    @Autowired
    private HolidayCalendar holidayCalendar;
    
    public LocalDate calculateValueDate(LocalDateTime transactionTime) {
        // Kiểm tra cut-off time
        LocalTime cutOff = cutOffConfig.getCutOffTime(); // ví dụ 16:00
        if (transactionTime.toLocalTime().isAfter(cutOff)) {
            // Sau cut-off → value date = ngày làm việc tiếp theo
            return getNextWorkingDay(transactionTime.toLocalDate().plusDays(1));
        } else {
            // Trước cut-off → value date = ngày giao dịch
            return transactionTime.toLocalDate();
        }
    }
    
    private LocalDate getNextWorkingDay(LocalDate date) {
        while (holidayCalendar.isHoliday(date)) {
            date = date.plusDays(1);
        }
        return date;
    }
}
~~~
### Bảng trade-off: Transaction Date vs Value Date

| Tiêu chí | Transaction Date | Value Date |
|---|---|---|
| Ý nghĩa | Ngày thực hiện giao dịch | Ngày số dư thay đổi |
| Ảnh hưởng lãi | Không | Có |
| Ảnh hưởng báo cáo | Không | Có |
| Cut-off time | Không ảnh hưởng | Ảnh hưởng trực tiếp |
| Phù hợp | Audit trail | Tính lãi, báo cáo |
### Lỗi hay gặp trên production

- **Nhầm transaction date với value date**: Tính lãi sai → khiếu nại.
- **Không xử lý holiday calendar**: Thứ 7, chủ nhật, ngày lễ → value date sai.
- **Không xử lý cut-off time**: Giao dịch sau cut-off nhưng value date = ngày giao dịch → sai.
- **Báo cáo theo transaction date**: Sai báo cáo tài chính → kiểm toán không chấp nhận.
### Ví dụ đời thực

Một ngân hàng có 10 triệu tài khoản tiết kiệm. Hệ thống cũ dùng transaction date để tính lãi → sai 1-2 ngày cho 30% giao dịch (sau cut-off). Khách khiếu nại: "tôi gửi 100 triệu, lãi chỉ 65k thay vì 82k". Dev fix: thêm value date calculation với cut-off time và holiday calendar. Kết quả: 0 khiếu nại lãi, báo cáo tài chính khớp 100%.
### Trả lời mẫu khi phỏng vấn

"Transaction date là ngày thực hiện giao dịch, value date là ngày số dư thực sự thay đổi và bắt đầu tính lãi. Khác biệt: giao dịch trước cut-off time (ví dụ 16h) → value date = transaction date; sau cut-off → value date = ngày làm việc tiếp theo. Value date ảnh hưởng đến: (1) **Tính lãi** — lãi = số dư × lãi suất × số ngày / 365, số ngày tính từ value date. (2) **Báo cáo tài chính** — ghi nhận theo value date, không phải transaction date. (3) **Đối soát** — so theo value date. Thiết kế cốt lõi: (1) **Cut-off time config** — per currency/country. (2) **Holiday calendar** — per currency/country. (3) **Value date calculation** — trước cut-off = ngày giao dịch, sau cut-off = ngày làm việc tiếp theo. (4) **Lưu cả hai** — transaction date và value date trong DB. Thực tế: em từng fix sai lãi 30% giao dịch do nhầm transaction date, sau khi thêm value date thì 0 khiếu nại."

> Senior tip: Ba chốt: (1) **Value date ≠ transaction date** — value date là ngày số dư thay đổi. (2) **Cut-off time** — trước cut-off = value date hôm nay, sau cut-off = ngày làm việc tiếp theo. (3) **Lưu cả hai** — transaction date và value date trong DB. Hỏi interviewer: "Ngân hàng anh có cut-off time không? Nếu có thì value date được tính thế nào?"

> Cụm từ: Transaction date (ngày giao dịch) là ngày thực hiện giao dịch. Value date (ngày giá trị) là ngày số dư thực sự thay đổi và bắt đầu tính lãi. Cut-off time (thời điểm cắt) là thời điểm cuối cùng trong ngày mà giao dịch được xử lý ngay. Holiday calendar (lịch ngày lễ) là lịch các ngày nghỉ lễ theo quốc gia/khu vực.

  `,
  follow: [
    'Khi khách chuyển tiền vào thứ 7, value date được tính thế nào nếu thứ 2 là ngày lễ?',
    'Nếu cut-off time thay đổi (ví dụ từ 16h xuống 15h), bạn xử lý các giao dịch đang pending thế nào?',
    'Báo cáo tài chính ghi nhận theo value date hay transaction date? Nếu có sự khác biệt giữa hai ngày thì sao?'
  ],
  tags: ['value date', 'transaction date', 'cut-off time', 'interest calculation', 'financial reporting']
},
{
  id: 'banking-056',
  topic: 'banking',
  level: 'lead',
  q: 'ISO 8583 message flow diễn ra thế nào trong giao dịch thẻ? Giải thích các message type chính (0100, 0110, 0200, 0210) và các trường quan trọng (F2, F3, F4, F39) trong mỗi bước.',
  a: `**Tóm tắt:** ISO 8583 là chuẩn thông điệp cho giao dịch thẻ (credit/debit card). Flow cơ bản: 0100 (authorization request) → 0110 (authorization response) → 0200 (financial transaction request) → 0210 (financial transaction response). Mỗi message có các trường quan trọng: F2 (PAN - Primary Account Number), F3 (Processing Code), F4 (Amount), F39 (Response Code). Hiểu flow giúp debug lỗi, thiết kế hệ thống xử lý thẻ.
### ISO 8583 là gì?

ISO 8583 là chuẩn quốc tế định nghĩa cấu trúc thông điệp cho giao dịch tài chính (chủ yếu là thẻ). Message gồm: Message Type Indicator (MTI) + Bitmap + Data Fields.
### Các Message Type chính

**0100 - Authorization Request**: Ngân hàng phát hành thẻ (issuer) kiểm tra số dư, hạn mức, thẻ có bị khóa không. Dùng cho giao dịch offline (không cần tiền ngay).

**0110 - Authorization Response**: Issuer trả lời approve/decline. Approve = cấp authorization code (ví dụ A1B2C3).

**0200 - Financial Transaction Request**: Thực hiện giao dịch thật (rút tiền, thanh toán). Dùng cho giao dịch online (cần tiền ngay).

**0210 - Financial Transaction Response**: Issuer trả lời approve/decline, cập nhật số dư.
### Flow chi tiết

~~~text
[Cardholder] → [POS/ATM] → [Acquirer] → [Card Network] → [Issuer]
     ↓              ↓            ↓              ↓              ↓
   Quẹt thẻ      0100         Forward 0100     Route 0100      Kiểm tra
   Nhập PIN      0110         Nhận 0110        Forward 0110    Approve/Decline
   Rút tiền      0200         Forward 0200     Route 0200      Trừ tiền
                 0210         Nhận 0210        Forward 0210    Ghi Nợ
~~~
### Các trường quan trọng

**F2 (PAN - Primary Account Number)**: Số thẻ (ví dụ 4111111111111111 cho Visa test).

**F3 (Processing Code)**: Loại giao dịch. Ví dụ:
- 000000: Mua hàng
- 010000: Rút tiền ATM
- 300000: Nạp tiền

**F4 (Amount)**: Số tiền (12 chữ số, không có dấu phẩy). Ví dụ: 100.000 VND = 000000100000.

**F39 (Response Code)**: Kết quả giao dịch. Ví dụ:
- 00: Approved
- 05: Do not honor (decline)
- 51: Insufficient funds
- 54: Expired card
- 57: Transaction not permitted
### Code/Java: Parse ISO 8583 Message

~~~java
@Service
class Iso8583Service {
    
    public Iso8583Message parseMessage(byte[] rawMessage) {
        // Parse MTI (4 bytes đầu)
        String mti = new String(rawMessage, 0, 4);
        
        // Parse Bitmap (8 bytes tiếp theo)
        byte[] bitmapBytes = Arrays.copyOfRange(rawMessage, 4, 12);
        BitSet bitmap = parseBitmap(bitmapBytes);
        
        // Parse các field theo bitmap
        Map<Integer, String> fields = new HashMap<>();
        for (int i = 0; i < bitmap.length(); i++) {
            if (bitmap.get(i)) {
                fields.put(i + 1, parseField(rawMessage, i + 1));
            }
        }
        
        return new Iso8583Message(mti, fields);
    }
    
    private BitSet parseBitmap(byte[] bytes) {
        BitSet bitmap = new BitSet(64);
        for (int i = 0; i < bytes.length; i++) {
            for (int j = 0; j < 8; j++) {
                if ((bytes[i] & (1 << (7 - j))) != 0) {
                    bitmap.set(i * 8 + j);
                }
            }
        }
        return bitmap;
    }
    
    private String parseField(byte[] message, int fieldNumber) {
        // Tùy field mà parse khác nhau
        // F2: 16 bytes (PAN)
        // F3: 6 bytes (Processing Code)
        // F4: 12 bytes (Amount)
        // F39: 2 bytes (Response Code)
        // ...
    }
}
~~~
### Bảng trade-off: ISO 8583 vs ISO 20022

| Tiêu chí | ISO 8583 | ISO 20022 |
|---|---|---|
| Loại giao dịch | Thẻ (card) | Thanh toán (payment) |
| Cấu trúc | Binary (bitmap + fields) | XML (human-readable) |
| Hiệu năng | Nhanh (binary) | Chậm hơn (XML parsing) |
| Mở rộng | Khó (phải thêm field) | Dễ (thêm tag) |
| Phù hợp | Giao dịch thẻ real-time | Thanh toán batch, quốc tế |
### Lỗi hay gặp trên production

- **Sai bitmap**: Không parse đúng field → mất thông tin.
- **Sai amount format**: 100.000 = 000000100000 (không có dấu phẩy) → sai số tiền.
- **Không xử lý response code**: 05 (decline) nhưng vẫn approve → mất tiền.
- **Không log message**: Không debug được khi lỗi.
### Ví dụ đời thực

Một ngân hàng phát hành thẻ Visa. Khách rút 1 triệu tại ATM. Flow: ATM gửi 0100 (authorization) → issuer kiểm tra số dư → 0110 approve → ATM gửi 0200 (financial) → issuer trừ tiền → 0210 response. Nếu sai bitmap → không parse được amount → decline sai. Dev fix: thêm validation bitmap, log mọi message. Kết quả: 0 decline sai, debug nhanh hơn 10x.
### Trả lời mẫu khi phỏng vấn

"ISO 8583 là chuẩn thông điệp cho giao dịch thẻ. Flow: 0100 (authorization request) → 0110 (authorization response) → 0200 (financial transaction request) → 0210 (financial transaction response). Mỗi message có MTI + bitmap + data fields. Các trường quan trọng: F2 (PAN), F3 (processing code), F4 (amount), F39 (response code). Thiết kế cốt lõi: (1) **Parse bitmap** — xác định field nào có trong message. (2) **Parse field theo thứ tự** — F2 (16 bytes), F3 (6 bytes), F4 (12 bytes), F39 (2 bytes). (3) **Validate amount** — 12 chữ số, không có dấu phẩy. (4) **Xử lý response code** — 00 = approve, 05 = decline, 51 = insufficient funds. (5) **Log mọi message** — debug khi lỗi. Thực tế: em từng fix decline sai do sai bitmap, sau khi validation thì 0 decline sai."

> Senior tip: Ba chốt: (1) **Bitmap quyết định field** — parse bitmap trước, sau đó parse field theo thứ tự. (2) **Amount không có dấu phẩy** — 100.000 = 000000100000. (3) **Response code phải xử lý đúng** — 00 = approve, 05 = decline. Hỏi interviewer: "Hệ thống thẻ của anh dùng ISO 8583 không? Nếu có thì xử lý decline thế nào?"

> Cụm từ: ISO 8583 là chuẩn thông điệp cho giao dịch thẻ. MTI (Message Type Indicator) là mã loại message (0100, 0110, 0200, 0210). Bitmap là chuỗi bit xác định field nào có trong message. PAN (Primary Account Number) là số thẻ. Response code là mã kết quả giao dịch (00 = approve, 05 = decline).

  `,
follow: [
        'Khi issuer decline giao dịch (response code 05), acquirer xử lý thế nào để không mất tiền?',
        'ISO 8583 và ISO 20022 khác nhau thế nào về cấu trúc và hiệu năng? Khi nào dùng cái nào?',
        'Nếu bitmap bị corrupt (ví dụ do network error), bạn phát hiện và xử lý thế nào?'
    ],
    tags: ['iso 8583', 'card transaction', 'authorization', 'message flow', 'bitmap', 'payment']
},
{
  id: 'banking-057',
  topic: 'banking',
  level: 'lead',
  q: 'Thiết kế sổ cái kế toán kép (double-entry ledger) chịu tải cao như thế nào: hot account (tài khoản nóng) gây nghẽn thế nào, giải pháp sharding số dư, và cách đảm bảo ACID khi ghi phân tán?',
  a: `**Tóm tắt:** Sổ cái kế toán kép (double-entry ledger) ghi mỗi giao dịch thành ít nhất hai bút toán (Debit và Credit) cân bằng nhau. Dưới tải cao, tài khoản "nóng" (hot account) như tài khoản trung gian thanh toán, tài khoản phí, tài khoản ngân hàng đối tác bị nghẽn do nhiều giao dịch cùng muốn khóa và cập nhật cùng lúc. Giải pháp: tách sổ cái thành nhiều shard theo account_id, dùng sharding deterministic (hash account_id), hot account dùng kỹ thuật "reservation counter" hoặc "striping" để phân tán áp lực ghi, và đảm bảo ACID bằng saga hoặc two-phase commit tùy độ phức tạp.
### Sổ cái kép và bài toán hot account (giải thích từ đầu)
Trong hệ thống ngân hàng, sổ cái (ledger) là nơi lưu mọi biến động tiền. Mỗi giao dịch tạo ít nhất hai dòng: một dòng Debit (trừ) và một dòng Credit (cộng), tổng Debit = tổng Credit. Số dư tài khoản = tổng Credit - tổng Debit.
 
**Hot account** là tài khoản bị truy cập cực nhiều, ví dụ:
- Tài khoản trung gian thanh toán (settlement account): mọi giao dịch chuyển tiền qua ngân hàng đều đụng tài khoản này
- Tài khoản phí dịch vụ: mọi giao dịch đều trừ phí vào đây
- Tài khoản ngân hàng đối tác (Nostro/Vostro): hàng nghìn giao dịch cross-border mỗi phút
 
Khi 10.000 giao dịch/giây cùng muốn khóa tài khoản trung gian để ghi Debit/Credit, cơ sở dữ liệu bị tranh chấp khóa (lock contention), throughput sụt giảm, latency tăng vọt.
### Sharding số dư (Balance Sharding) - chia nhỏ áp lực ghi
Thay vì một tài khoản lớn, tách thành nhiều "sub-account" (còn gọi là stripe hoặc partition):
 
~~~text
Tài khoản trung gian gốc: SETTLEMENT_VND
Tách thành 100 stripe: SETTLEMENT_VND_00 ... SETTLEMENT_VND_99
Mỗi giao dịch chọn stripe = hash(transaction_id) % 100
Số dư thực = SUM(balance của 100 stripe)
~~~
 
Khi đọc số dư (hiển thị cho khách, báo cáo): cộng tổng 100 stripe (có thể cache, refresh định kỳ).
Khi ghi: chỉ khóa 1 stripe thay vì khóa toàn bộ tài khoản, giảm contention 100 lần.
 
~~~java
// Ý tưởng: chọn stripe cho một giao dịch
int chooseStripe(String txId, int stripeCount) {
    return Math.abs(txId.hashCode()) % stripeCount;
}
 
// Ghi Debit vào stripe đã chọn
@Transactional
void debitStripe(String baseAccountId, int stripe, BigDecimal amount) {
    String stripeAccount = baseAccountId + "_" + String.format("%02d", stripe);
    ledgerRepo.insertEntry(stripeAccount, "DEBIT", amount);
    balanceRepo.addBalance(stripeAccount, amount.negate());
}
~~~
 
**Lưu ý quan trọng**: stripe count phải cố định (không tự động scale) để đọc số dư đúng. Nếu cần tăng stripe, phải chạy migration: đọc toàn bộ stripe cũ, ghi lại theo stripe mới, trong cửa sổ bảo trì.
### Reservation Counter - dành cho tài khoản cực nóng (chỉ 1-2 tài khoản)
Nếu chỉ có 1-2 tài khoản cực nóng (ví dụ tài khoản phí của ngân hàng), sharding 100 stripe vẫn có thể nghẽn nếu traffic cực lớn. Dùng **reservation counter**:
 
1. Giao dịch không ghi trực tiếp vào ledger, mà gửi yêu cầu "đặt chỗ" (reserve) vào hàng đợi (Kafka) kèm idempotency key
2. Một worker đơn luồng (single-threaded consumer) đọc hàng đợi, ghi lần lượt vào ledger, trả kết quả về qua callback hoặc poll
3. Vì worker chạy đơn luồng, không có tranh chấp khóa, throughput chỉ phụ thuộc tốc độ ghi DB (~50k-100k TPS trên PostgreSQL/MySQL tuned)
 
~~~seq
title: Reservation counter cho hot account
actors: Client | Kafka | ReservationWorker | LedgerDB
Client -> Kafka: gửi ReserveRequest{txId, account, amount, callback}
Kafka -> ReservationWorker: consume (đơn luồng)
ReservationWorker -> LedgerDB: BEGIN; INSERT ledger; UPDATE balance; COMMIT
ReservationWorker -> Kafka: gửi Result{txId, success/fail}
Kafka -> Client: nhận kết quả qua callback topic
~~~
### Đảm bảo ACID khi ghi phân tán (Distributed ACID)
Khi một giao dịch đụng nhiều shard (ví dụ chuyển từ stripe A sang stripe B) hoặc nhiều tài khoản trên nhiều shard:
 
**Cách 1: Saga (khuyên dùng cho high-throughput)**
- Mỗi bước là local transaction trên một shard
- Có compensation (bước bù trừ) nếu bước sau thất bại
- Orchestrator theo dõi state machine: STARTED -> STEP1_DONE -> STEP2_DONE -> COMPLETED / COMPENSATING -> COMPENSATED
 
**Cách 2: Two-Phase Commit (2PC) - chỉ dùng khi bắt buộc nhất quán mạnh**
- Phase 1 (Prepare): tất cả shard khóa tài khoản, kiểm tra điều kiện, vote YES/NO
- Phase 2 (Commit): nếu tất cả YES -> commit; có bất kỳ NO -> rollback tất cả
- Nhược điểm: khóa tài khoản lâu, throughput thấp, phức tạp recovery khi coordinator chết
 
**Cách 3: Deterministic routing - tránh giao dịch cross-shard**
- Thiết kế sao cho một giao dịch chỉ đụng **một shard**: routing theo account_id của tài khoản nguồn hoặc đích
- Ví dụ: tài khoản A stripe 5, tài khoản B stripe 5 -> cùng shard, 1 local transaction
- Nếu A stripe 5, B stripe 7 -> tách thành 2 giao dịch nội bộ: A -> settlement_stripe5, settlement_stripe7 -> B, dùng saga
### Lỗi hay gặp
- Sharding nhưng đọc số dư không cộng đủ stripe -> hiển thị sai số dư cho khách/báo cáo
- Tự động scale stripe count mà không migration -> dữ liệu vỡ
- Dùng 2PC cho mọi giao dịch -> throughput sụt 10x, deadlock thường xuyên
- Reservation counter không idempotent -> xử lý trùng khi retry
- Hot account không tách stripe mà chỉ tăng DB size -> contention không giảm
### Ví dụ đời thực
 
Một ngân hàng số xử lý 500.000 giao dịch/ngày, peak 20.000 TPS. Tài khoản trung gian thanh toán (SETTLEMENT_VND) bị hot: 80% giao dịch đụng tài khoản này. PostgreSQL lock wait time trung bình 200ms, p99 2 giây, nhiều giao dịch timeout.
 
**Điều tra:** EXPLAIN ANALYZE thấy contention trên row SETTLEMENT_VND. Mọi transaction đều SELECT FOR UPDATE row này.
 
**Giải pháp:** Tách SETTLEMENT_VND thành 256 stripe (SETTLEMENT_VND_00.._FF). Giao dịch chọn stripe = hash(txId) % 256. Worker đọc số dư tổng hợp từ 256 stripe mỗi 10 giây, cache vào Redis. Đọc số dư thực từ cache (sub-ms), ghi chỉ khóa 1 stripe.
 
**Kết quả:** Lock wait time giảm từ 200ms xuống 2ms, throughput tăng từ 5.000 TPS lên 50.000 TPS. Chi phí: logic đọc số dư phức tạp hơn (phải cộng 256 stripe), nhưng chấp nhận được vì đọc nhiều hơn ghi 100 lần.
### Trả lời mẫu khi phỏng vấn
 
"Sổ cái kép ghi mỗi giao dịch thành cặp Debit/Credit cân bằng. Hot account là tài khoản bị nhiều giao dịch truy cập cùng lúc (trung gian thanh toán, phí, Nostro), gây lock contention. Giải pháp tôi dùng: (1) **Balance sharding** - tách tài khoản nóng thành N stripe (ví dụ 256), mỗi giao dịch hash txId chọn 1 stripe ghi, đọc số dư cộng tổng stripe (cache định kỳ). (2) **Reservation counter** - cho tài khoản cực nóng, đẩy yêu cầu vào Kafka, worker đơn luồng xử lý tuần tự, tránh hoàn toàn lock contention. (3) **ACID phân tán** - ưu tiên deterministic routing (1 giao dịch = 1 shard), nếu cross-shard bắt buộc thì dùng Saga với compensation, chỉ dùng 2PC khi bắt buộc nhất quán mạnh. Thực tế: một ngân hàng tách 256 stripe cho tài khoản trung gian, lock wait giảm 100x, throughput từ 5k lên 50k TPS."
 
> Senior tip: Ba chốt: (1) **Đọc nhiều, ghi ít** - cache tổng số dư, chỉ sharding khi ghi. (2) **Deterministic routing** - thiết kế sao 1 giao dịch chỉ đụng 1 shard, tránh distributed transaction. (3) **Reservation counter** - cho cực nóng, dùng queue + single-thread worker, chấp nhận latency vài chục ms đổi throughput lớn. Hỏi interviewer: "Hệ thống của anh có tài khoản nào > 10k TPS không? Nếu có thì dùng sharding hay reservation?"
 
> Cụm từ: Hot account (tài khoản nóng) là tài khoản bị truy cập ghi cực nhiều, gây lock contention. Stripe/shard là phân chia một tài khoản logic thành nhiều tài khoản vật lý. Saga là chuỗi local transaction có compensation, thay thế 2PC.
 
`,
  follow: [
    'Khi đọc số dư từ 256 stripe, bạn cache như thế nào và invalidation ra sao?',
    'Reservation counter worker chết giữa chừng, giao dịch đang xử lý bị mất không?',
    'Nếu stripe count cần tăng từ 256 lên 512, bạn migration dữ liệu thế nào không downtime?'
  ],
  tags: ['ledger', 'double-entry', 'hot account', 'sharding', 'saga', 'reservation counter', 'ACID']
},
{
  id: 'banking-058',
  topic: 'banking',
  level: 'senior',
  q: 'Đối soát hàng ngày (daily reconciliation) với ngân hàng đối tác: quy trình tự động so khớp file, phân loại lệch (break), xử lý tự động vs thủ công, và maker-checker cho điều chỉnh sổ cái.',
  a: `**Tóm tắt:** Đối soát hàng ngày là quy trình so sánh sổ cái của ngân hàng mình với file giao dịch từ ngân hàng đối tác (NAPAS, ngân hàng liên kết, correspondent bank) để phát hiện lệch (break). Mục tiêu: không đồng nào bị "treo" không rõ chủ. Quy trình: nhận file -> chuẩn hóa -> so khớp theo mã tham chiếu duy nhất -> phân loại break -> tự động xử lý loại có quy tắc -> đẩy phần còn lại vào hàng đợi maker-checker -> ghi bút toán điều chỉnh append-only.
### Vì sao cần đối soát hàng ngày
Hai ngân hàng ghi nhận cùng một giao dịch độc lập. Do timeout, mất mạng, lỗi xử lý, sai định dạng, sai múi giờ... một bên có thể ghi thành công, bên kia thất bại, hoặc cả hai ghi nhưng số tiền/trạng thái khác nhau. Nếu không đối soát, lệch tích lũy thành tiền thật bị mất hoặc ghi nhầm.
### Quy trình từng bước
 
**1. Nhận và kiểm tra file**
- File từ đối tác: CSV, XML (ISO 20022 camt.053), MT940 (SWIFT), hoặc API pull
- Kiểm tra toàn vẹn: checksum (MD5/SHA256), số dòng, tổng tiền ở dòng footer, chữ ký số (nếu có)
- File sai -> từ chối, yêu cầu gửi lại, **không xử lý một phần**
 
**2. Chuẩn hóa (Normalize)**
- Parse về canonical model: partner_ref (mã tham chiếu duy nhất), amount (minor unit, VND = đồng), currency, status, value_date, fee, description
- Chuyển múi giờ về UTC, chuẩn hóa ngày nghiệp vụ (business date)
- Mapping trạng thái đối tác -> trạng thái nội bộ (SUCCESS, FAILED, PENDING, REVERSED)
 
**3. So khớp (Matching) - khóa là partner_ref**
 
~~~sql
-- Full outer join giữa sổ mình (ours) và file đối tác (theirs)
SELECT 
    COALESCE(o.partner_ref, t.partner_ref) AS partner_ref,
    o.amount AS our_amount, t.amount AS their_amount,
    o.status AS our_status, t.status AS their_status,
    o.value_date AS our_date, t.value_date AS their_date,
    CASE 
        WHEN o.partner_ref IS NULL THEN 'ONLY_THEIRS'
        WHEN t.partner_ref IS NULL THEN 'ONLY_OURS'
        WHEN o.amount <> t.amount THEN 'AMOUNT_MISMATCH'
        WHEN o.status <> t.status THEN 'STATUS_MISMATCH'
        WHEN o.value_date <> t.value_date THEN 'DATE_MISMATCH'
        ELSE 'MATCHED'
    END AS match_result
FROM ours_day o
FULL OUTER JOIN theirs_day t ON o.partner_ref = t.partner_ref;
~~~
 
**4. Phân loại break (loại lệch)**
 
| Loại break | Mô tả | Xử lý tự động? |
|---|---|---|
| ONLY_OURS | Chúng ta có, đối tác không có | Có: nếu timeout chờ phản hồi -> inquiry; nếu quá hạn -> reversal |
| ONLY_THEIRS | Đối tác có, chúng ta không có | Có: nếu là phí/lãi đã biết -> ghi bút toán; còn lại -> inquiry |
| AMOUNT_MISMATCH | Cùng ref, lệch số tiền | Có: nếu chênh lệch = phí đã biết -> ghi phí; còn lại -> maker-checker |
| STATUS_MISMATCH | Cùng ref, lệch trạng thái | Có: nếu chúng ta PENDING, đối tác SUCCESS -> cập nhật SUCCESS |
| DATE_MISMATCH | Cùng ref, lệch ngày giá trị | Có: điều chỉnh theo business date rule |
| DUPLICATE | Cùng ref xuất hiện 2 lần một bên | Có: giữ bản ghi đầu, đảo bản ghi trùng |
 
**5. Xử lý tự động (Auto-resolution)**
- Chỉ xử lý tự động khi có **quy tắc rõ ràng, được duyệt trước** (rule engine)
- Mỗi rule: điều kiện (match_result, amount_diff, fee_schedule...) -> hành động (ghi bút toán, cập nhật trạng thái, gửi inquiry)
- Kết quả auto-resolution ghi log đầy đủ: rule_id, before/after, timestamp
 
**6. Hàng đợi maker-checker (Manual queue)**
- Các break không khớp rule -> đẩy vào queue có trạng thái: NEW -> INVESTIGATING -> PROPOSED -> APPROVED -> APPLIED / REJECTED
- Maker (nhân viên tra soát): xem bằng chứng (log, file đối tác, inquiry response), đề xuất điều chỉnh (bút toán mới)
- Checker (kiểm soát viên): duyệt hoặc từ chối, **bắt buộc khác người maker**
- Hệ thống ghi bút toán điều chỉnh **append-only**, không sửa dòng gốc, có audit trail
### Code: Matching engine & Auto-resolution
 
~~~java
enum MatchResult { MATCHED, ONLY_OURS, ONLY_THEIRS, AMOUNT_MISMATCH, STATUS_MISMATCH, DATE_MISMATCH, DUPLICATE }
 
record BreakCase(String partnerRef, MatchResult type, BigDecimal ourAmt, BigDecimal theirAmt,
                 String ourStatus, String theirStatus, LocalDate ourDate, LocalDate theirDate) {}
 
interface ResolutionRule {
    boolean matches(BreakCase bc);
    ResolutionAction apply(BreakCase bc); // trả về action: ADJUST_LEDGER, UPDATE_STATUS, SEND_INQUIRY, ESCALATE
}
 
// Ví dụ rule: STATUS_MISMATCH, chúng ta PENDING, đối tác SUCCESS -> auto cập nhật
class PendingToSuccessRule implements ResolutionRule {
    public boolean matches(BreakCase bc) {
        return bc.type() == STATUS_MISMATCH 
            && "PENDING".equals(bc.ourStatus()) 
            && "SUCCESS".equals(bc.theirStatus());
    }
    public ResolutionAction apply(BreakCase bc) {
        return ResolutionAction.updateStatus(bc.partnerRef(), "SUCCESS", "auto: partner confirmed SUCCESS");
    }
}
 
// Engine chạy
void resolveDaily(List<BreakCase> breaks) {
    for (BreakCase bc : breaks) {
        if (bc.type() == MATCHED) continue;
        for (ResolutionRule rule : rules) {
            if (rule.matches(bc)) {
                rule.apply(bc).execute();
                audit.log("AUTO_RESOLVE", bc.partnerRef(), rule.getClass().getSimpleName());
                break;
            }
        }
        // Không rule nào khớp -> đẩy queue manual
        if (!resolved) manualQueue.enqueue(bc);
    }
}
~~~
### Đối soát số dư (Balance Reconciliation) - lớp thứ 2
Ngoài so khớp từng giao dịch, phải so khớp **tổng số dư** cuối ngày:
- Tổng số dư tài khoản Nostro/Vostro trong ledger mình
- So với số dư trong statement đối tác (MT940/camt.053 closing balance)
- Nếu tổng khớp nhưng từng giao dịch lệch -> vẫn phải xử lý từng break (tổng khớp có thể che lệch bù trừ)
### Lỗi hay gặp
- So khớp theo **số tiền + thời gian** thay vì partner_ref -> ghép nhầm giao dịch cùng số tiền
- File đối tác đến trễ/mất -> không chạy đối soát, lệch tích lũy
- Tự động điều chỉnh sổ cái **không qua maker-checker** -> rủi ro gian lận
- Sửa trực tiếp giao dịch gốc (UPDATE) thay vì ghi bút toán mới (INSERT) -> mất audit trail
- Không theo dõi **tuổi break** (số ngày chưa xử lý) -> break tồn đọng hàng tháng
### Ví dụ đời thực
 
Một ngân hàng đối soát hàng ngày với 5 ngân hàng đối tác qua NAPAS. Mỗi ngày ~150 break. Trước khi tự động: 3 nhân viên làm cả buổi sáng, break cũ nhất tồn 47 ngày.
 
**Tự động hóa:** Triển khai matching engine + 12 resolution rule ( phí, lãi, timeout pending, date mismatch, duplicate...). 82% break được auto-resolve (chủ yếu timeout pending đã thành công ở đối tác, lệch ngày do múi giờ, phí correspondent đã biết). 18% còn lại vào queue maker-checker với SLA 2 ngày.
 
**Kết quả:** Thời gian xử lý giảm từ 4h/ngày xuống 30 phút. Break trung bình/ngày giảm từ 150 xuống 27 (do auto-resolve kịp thời). Break tồn > 5 ngày giảm từ 12 xuống 0. Audit trail đầy đủ cho phép truy vết mọi điều chỉnh.
### Trả lời mẫu khi phỏng vấn
 
"Đối soát hàng ngày của tôi có 6 bước: (1) Nhận file, kiểm tra checksum/tổng tiền, file sai thì yêu cầu gửi lại. (2) Chuẩn hóa về canonical model (partner_ref, amount minor unit, UTC, business date). (3) So khớp full outer join theo partner_ref, ra 6 loại break. (4) Auto-resolution bằng rule engine: 12 rule cho phí, lãi, timeout pending, date mismatch, duplicate... (5) Phần không khớp rule vào queue maker-checker: maker đề xuất bút toán mới, checker duyệt, hệ thống chặn tự duyệt. (6) Ghi bút toán điều chỉnh append-only, audit trail đầy đủ. Còn so khớp tổng số dư Nostro/Vostro hàng ngày. Thực tế: auto-resolve 82% break, queue thủ công giảm từ 150 xuống 27/ngày, break > 5 ngày bằng 0."
 
> Senior tip: Ba chốt: (1) **Partner_ref là chìa khóa** - bắt đối tác phải có mã duy nhất, không dùng amount+date. (2) **Auto-resolution có rule rõ, có audit** - không "auto" mù mịt. (3) **Maker-checker bắt buộc cho điều chỉnh sổ** - bút toán mới append-only, không sửa dòng cũ. Thống kê nguyên nhân break theo tuần: mỗi nhóm lặp lại là cơ hội thêm rule hoặc fix gốc ở hệ thống nguồn.
 
> Cụm từ: Break (lệch) là giao dịch không khớp giữa hai bên. Auto-resolution là xử lý tự động theo rule. Maker-checker là một người đề xuất, người khác duyệt. Append-only là chỉ thêm dòng mới, không sửa/xóa.
 
`,
  follow: [
    'Nếu file đối tác đến muộn 2 ngày, bạn xử lý thế nào để không làm sai số dư hôm nay?',
    'Làm sao phân biệt lệch thật (bug) và lệch do parse sai file?',
    'Ai có quyền duyệt điều chỉnh số dư, và ngưỡng tiền nào thì bắt buộc 2 checker?'
  ],
  tags: ['reconciliation', 'daily reconciliation', 'break', 'matching', 'maker-checker', 'auto-resolution', 'NAPAS']
},
{
  id: 'banking-059',
  topic: 'banking',
  level: 'senior',
  q: 'Chuyển tiền liên ngân hàng có trạng thái treo (pending/timeout): thiết kế máy trạng thái, tra soát chủ động (inquiry), quy trình hoàn tiền (reversal) và bù đắp (compensation) khi đối tác xác nhận thất bại.',
  a: `**Tóm tắt:** Timeout khi chuyển tiền liên ngân hàng (NAPAS, SWIFT, correspondent) **không có nghĩa là thất bại** — chỉ là "chưa biết kết quả". Ba khả năng: đối tác chưa nhận lệnh, đối tác đã xử lý thành công nhưng phản hồi bị mất, hoặc đối tác đang xử lý. Thiết kế đúng: chuyển sang trạng thái PENDING_INQUIRY, tạm giữ tiền (hold), không tự động retry lệnh mới, không tự động hoàn tiền. Tra soát chủ động bằng mã tham chiếu duy nhất (inquiry), cập nhật trạng thái theo kết quả, chỉ hoàn tiền khi có xác nhận thất bại hoặc quá hạn tra soát.
### Tại sao timeout nguy hiểm
Khi gửi lệnh chuyển tiền và không nhận phản hồi trong timeout (ví dụ 10 giây), nếu coi là thất bại và hoàn tiền (hoặc cho khách gửi lại), trường hợp "đối tác đã thành công nhưng phản hồi mất" sẽ khiến: người nhận nhận tiền 2 lần, hoặc người gửi bị trừ 2 lần. Đây là lỗi nghiêm trọng nhất thanh toán.
### Máy trạng thái (State Machine) giao dịch
 
~~~text
[INIT] --gửi lệnh--> [SENT]
[SENT] --nhận SUCCESS--> [SUCCESS] (kết thúc)
[SENT] --nhận FAILED--> [FAILED] -> hoàn tiền hold
[SENT] --timeout/lỗi mạng--> [PENDING_INQUIRY] --tiền bị HOLD--
[PENDING_INQUIRY] --inquiry: SUCCESS--> [SUCCESS] -> chốt trừ tiền
[PENDING_INQUIRY] --inquiry: FAILED--> [FAILED] -> hoàn tiền hold
[PENDING_INQUIRY] --inquiry: UNKNOWN & quá hạn--> [MANUAL_INVESTIGATION] -> đối soát/tra soát thủ công
[MANUAL_INVESTIGATION] --xác nhận FAILED--> [REVERSAL_PENDING] -> reversal -> [REVERSED]
[MANUAL_INVESTIGATION] --xác nhận SUCCESS--> [SUCCESS]
~~~
 
**PENDING_INQUIRY**: trạng thái "đang treo, chưa kết luận". Tiền người gửi bị **hold** (tạm giữ khỏi available balance, chưa trừ ledger balance) để không cho chi tiêu trùng.
### Mã tham chiếu duy nhất (Partner Reference) - chìa khóa tra soát
- Mỗi lệnh sinh **idempotency key** (UUID) do ngân hàng gửi tạo, gắn suốt vòng đời
- Gửi kèm sang đối tác (NAPAS RRN, SWIFT UETR, STAN)
- Lưu trong DB với unique constraint: {{(partner_ref, business_date)}}
- Dùng để: inquiry, đối soát, idempotency (retry cùng key -> trả kết quả cũ)
### Tra soát chủ động (Inquiry) - không chờ đợi
 
~~~text
Lịch retry inquiry (exponential backoff):
Lần 1: sau 30 giây
Lần 2: sau 2 phút
Lần 3: sau 10 phút
Lần 4: sau 1 giờ
Lần 5: sau 4 giờ
Lần 6: sau 12 giờ
Quá 24 giờ chưa rõ -> leo thang MANUAL_INVESTIGATION
~~~
 
Mỗi lần inquiry dùng **cùng partner_ref**. Đối tác phải hỗ trợ idempotent: nhận lại cùng ref -> trả kết quả cũ, không xử lý trùng.
 
~~~seq
title: Chuyen khoan lien NH timeout va tra soat
actors: AppKhach | PaymentSvc | Napas | DoiTacNH
AppKhach -> PaymentSvc: chuyen 5.000.000 cho B (idem_key=K1)
PaymentSvc -> PaymentSvc: tao tx_id, hold tien A, trang thai SENT
PaymentSvc -> Napas: gui lenh chuyen (partner_ref=K1)
Napas -> DoiTacNH: ghi co cho B
DoiTacNH --> Napas: thanh cong
Napas --> PaymentSvc: timeout mat phan hoi
PaymentSvc -> PaymentSvc: chuyen trang thai PENDING_INQUIRY
PaymentSvc --> AppKhach: thong bao "Dang xu ly, vui long cho"
PaymentSvc -> Napas: inquiry(K1) - tra soat
Napas --> PaymentSvc: ket qua SUCCESS
PaymentSvc -> PaymentSvc: cap nhat SUCCESS, chot tru tien A
PaymentSvc --> AppKhach: thong bao thanh cong
~~~
### Hoàn tiền (Reversal) và Bù đắp (Compensation)
 
**Chỉ hoàn tiền khi có xác nhận FAILED** từ đối tác, hoặc sau quy trình MANUAL_INVESTIGATION kết luận thất bại.
 
Quy trình reversal:
1. Tạo bút toán đảo ngược (reversal entry) trên ledger: Credit tài khoản nguồn, Debit tài khoản trung gian
2. Ghi rõ tham chiếu giao dịch gốc (original_tx_id) để audit trail
3. Giải phóng hold (nếu còn), cập nhật available balance
4. Thông báo khách: "Giao dịch thất bại, tiền đã hoàn về tài khoản"
 
**Compensation cho giao dịch đã SUCCESS nhưng sau đó bị cancel** (hiếm, ví dụ đối tác báo sai):
- Nếu tiền đã chuyển đến người nhận: phải phối hợp với đối tác thu hồi (recall) - quy trình thủ công, có SLA
- Nếu tiền chưa đến người nhận: reversal nội bộ
- Luôn ghi log compensation với original_tx_id, lý do, người phê duyệt
### Xử lý PENDING_INQUIRY treo quá lâu
- Job chạy mỗi 15 phút: quét PENDING_INQUIRY > 48h chưa có inquiry thành công
- Gửi cảnh báo Slack/Email cho team vận hành
- Vận hành liên hệ đối tác qua email/điện thoại (out-of-band)
- Nếu đối tác xác nhận FAILED -> chạy reversal tự động
- Nếu đối tác không phản hồi sau 7 ngày -> leo thang cấp quản lý, có thể reversal theo chính sách rủi ro
### Code: State machine & Inquiry scheduler
 
~~~java
enum TxStatus { INIT, SENT, PENDING_INQUIRY, SUCCESS, FAILED, MANUAL_INVESTIGATION, REVERSAL_PENDING, REVERSED }
 
@Transactional
void handleTimeout(String partnerRef) {
    var tx = repo.findByPartnerRef(partnerRef).orElseThrow();
    if (tx.status() == SENT) {
        tx.transitionTo(PENDING_INQUIRY);
        repo.save(tx);
        inquiryScheduler.scheduleFirstInquiry(partnerRef); // 30s sau
    }
}
 
@Scheduled(fixedDelay = 60_000) // mỗi phút
void processInquiryQueue() {
    var due = repo.findDueInquiry(Instant.now()); // next_inquiry_at <= now
    for (var tx : due) {
        try {
            var resp = napasClient.inquiry(tx.partnerRef());
            if (resp.isSuccess()) {
                tx.transitionTo(SUCCESS);
                ledgerService.postDebit(tx.sourceAccount(), tx.amount()); // chốt trừ
            } else if (resp.isFailed()) {
                tx.transitionTo(FAILED);
                ledgerService.releaseHold(tx.sourceAccount(), tx.amount()); // hoàn hold
            } else { // UNKNOWN
                tx.scheduleNextInquiry(); // backoff
            }
            repo.save(tx);
        } catch (Exception e) {
            log.error("Inquiry failed for {}", tx.partnerRef(), e);
            tx.scheduleNextInquiry(); // retry inquiry sau backoff
            repo.save(tx);
        }
    }
}
~~~
### Lỗi hay gặp
- Coi timeout = FAILED -> hoàn tiền ngay -> tiền đi 2 lần nếu đối tác đã thành công
- Cho khách bấm "Thử lại" tạo giao dịch mới khi đang PENDING_INQUIRY -> trùng tiền
- Không lưu partner_ref -> không inquiry được, không đối soát được
- Tự động reversal sau N phút timeout mà chưa inquiry -> hoàn nhầm
- PENDING_INQUIRY không có TTL/giới hạn -> tiền bị hold vĩnh viễn
- Inquiry không idempotent -> đối tác xử lý trùng khi retry
### Ví dụ đời thực
 
Một ngân hàng số xử lý chuyển khoản NAPAS. Ngày cao điểm lương, traffic tăng 3x. Khách chuyển 5 triệu lúc 21:00, timeout sau 10s. Hệ thống chuyển PENDING_INQUIRY, hold tiền, app hiện "Đang xử lý". Job inquiry chạy: lần 2 (sau 2 phút) NAPAS trả SUCCESS -> cập nhật SUCCESS, trừ tiền, thông báo khách. Giao dịch khác inquiry FAILED sau 24h -> reversal tự động, tiền hoàn về. 94% timeout chốt tự động trong 2h, 0 trường hợp trừ 2 lần.
### Trả lời mẫu khi phỏng vấn
 
"Timeout không phải thất bại, chỉ là chưa biết kết quả. Tôi thiết kế máy trạng thái: SENT -> PENDING_INQUIRY (hold tiền) khi timeout. Không tự động retry lệnh mới, không tự động hoàn tiền. Tra soát chủ động bằng partner_ref (idempotency key) với backoff 30s, 2p, 10p, 1h... Inquiry SUCCESS -> chốt trừ tiền, FAILED -> hoàn hold. Quá 24h không rõ -> MANUAL_INVESTIGATION, vận hành liên hệ đối tác. Reversal chỉ khi có xác nhận FAILED, ghi bút toán đảo có original_tx_id. Thực tế: 94% timeout chốt tự động 2h, không còn trừ tiền 2 lần. Nguyên tắc: tiền thật an toàn hơn trải nghiệm nhanh."
 
> Senior tip: Ba chốt: (1) **Timeout ≠ Failed** - không bao giờ tự động hoàn/retry khi timeout. (2) **Partner_ref xuyên suốt** - idempotency key = inquiry key = reconciliation key. (3) **Hold tiền, không trừ ledger** - chỉ chốt khi có xác nhận. Hỏi interviewer: "Hệ thống của anh xử lý timeout như thế nào? Có bao giờ tự động hoàn tiền khi timeout không?"
 
> Cụm từ: Hold (tạm giữ) là khóa available balance, chưa trừ ledger. Inquiry (tra soát) là hỏi đối tác trạng thái giao dịch bằng partner_ref. Reversal (đảo ngược) là bút toán hoàn tiền append-only.
 
`,
  follow: [
    'Idempotency được đảm bảo ở tầng nào: client, gateway, service, core, đối tác?',
    'Khi đối tác xác nhận FAILED nhưng bạn đã chốt SUCCESS (do inquiry trước báo SUCCESS sai), xử lý thế nào?',
    'PENDING_INQUIRY treo 7 ngày, bạn reversal tự động hay cần phê duyệt?'
  ],
  tags: ['interbank', 'timeout', 'pending', 'inquiry', 'reversal', 'hold', 'NAPAS', 'idempotency']
},
{
  id: 'banking-060',
  topic: 'banking',
  level: 'lead',
  q: 'Hệ thống chống gian lận real-time (fraud detection): rule engine vs ML scoring, ngân sách độ trễ (latency budget), xử lý false positive (chặn nhầm khách thật) bằng step-up authentication, và vòng phản hồi retrain model.',
  a: `**Tóm tắt:** Hệ thống chống gian lận real-time phải quyết định trong 150-300ms: CHO QUA, CHALLENGE (yêu cầu OTP/push), hay BLOCK. Ba lớp chạy song song: Rule Engine (luật cứng, giải thích được), ML Model (điểm 0-1, bắt mẫu tinh vi), Whitelist/Blacklist (danh sách). Độ trễ ngân sách: tổng 2000ms, trong đó decision chỉ 150-300ms — phải đọc feature từ cache/Redis, tính toán nặng chạy bất đồng bộ qua Kafka. False positive (chặn nhầm khách thật) tốn kêu gọi, mất khách; giảm FP bằng step-up authentication thay vì block, và kênh khiếu nại một chạm "Đây là tôi" trong app.
### Ba lớp quyết định (Decision Layers)
 
| Lớp | Ví dụ | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Rule Engine** | "Thẻ vừa giao dịch Hà Nội 10 phút trước, nay quẹt nước ngoài" (impossible travel) | Giải thích được, bật/tắt tức thì, không cần dữ liệu lịch sử | Dễ bỏ lọt kẻ gian né luật, bảo trì nhiều luật xung đột |
| **ML Model** | Điểm xác suất gian lận dựa trên velocity, hành vi, thiết bị, lịch sử merchant | Bắt mẫu phức tạp, thích ứng | Khó giải thích, cần dữ liệu gán nhãn, có độ trễ tính toán |
| **Danh sách** | Whitelist số điện thoại đã xác thực, Blacklist merchant | Nhanh, chắc chắn | Dữ liệu phải cập nhật liên tục |
 
**Kết hợp**: Rule phủ trường hợp chắc chắn, Model chấm điểm phần còn lại, danh sách bảo vệ khách quen. Tổng điểm so với ngưỡng -> APPROVE / CHALLENGE / BLOCK.
### Ngân sách độ trễ (Latency Budget) - bạn chỉ có vài trăm ms
 
~~~text
Tổng ngân sách một giao dịch thẻ: ~2000ms
- Gateway + bảo mật: 100ms
- Kiểm tra tài khoản/hạn mức core: 300-500ms
- **Fraud Decision: 150-300ms**  <-- CHỈ CÓ KHOẢNG NÀY
- Trả lời kênh + ghi log: 100ms
~~~
 
Vì vậy dịch vụ decision **phải đọc feature đã tính sẵn trong cache/Redis**, không được tính toán nặng đồng bộ.
 
**Pattern phổ biến:**
1. Luồng giao dịch gọi đồng bộ Fraud Decision Service với timeout 200ms
2. Song song, sự kiện giao dịch đẩy vào Kafka -> cập nhật feature cửa sổ trượt (velocity, amount sum...) cho lần sau — việc nặng chạy **bất đồng bộ**, không chặn khách
3. Model lớn chạy trên Flink/Spark Streaming, ghi điểm vào Redis; request chỉ đọc điểm đó (sub-ms)
### Xử lý khi Decision Service timeout
Phải có chính sách rõ ràng, không được "mặc định":
- **Fail-open** (cho qua): rủi ro mất tiền nếu kẻ gian lợi dụng lúc hệ thống lỗi
- **Fail-closed** (chặn): mất doanh thu, khách phàn nại
- **Thực tế lai**: giao dịch nhỏ (< 5tr) fail-open, giao dịch lớn hoặc nước ngoài fail-closed hoặc CHALLENGE
### False Positive (FP) và False Negative (FN)
 
- **FP (chặn nhầm giao dịch thật)**: chi phí = cuộc gọi tổng đài + mất doanh thu + khách chuyển ngân hàng
- **FN (cho qua giao dịch gian lận)**: chi phí = tiền bồi thường + phí điều tra
- Dữ liệu gian lận rất hiếm (< 1%), chỉ chặn bừa 1% là recall trông đẹp nhưng FP thành thảm họa
- **Bàn bằng chi phí kỳ vọng**: FP × chi phí mất khách + FN × thiệt hại trung bình
 
**Giảm FP bằng Step-up Authentication:**
- Thay vì BLOCK, dùng **CHALLENGE**: bắt khách xác minh OTP/push trong app
- Khách thật xác nhận -> giao dịch cho qua ngay
- Kẻ gian không nhận được OTP -> giao dịch dừng
- BLOCK chỉ dành cho điểm cực cao (ví dụ > 95)
 
**Kênh khiếu nại một chạm:** Khách bấm "Đây là tôi" trong app -> hệ thống mở khóa, ghi nhãn "legit" để retrain model.
### Feature & Giải thích (Explainability)
Feature hay dùng: velocity (số giao dịch/tiền trong 5/30/60p), khoảng cách địa lý so với giao dịch trước, thiết bị/IP mới, MCC và tỷ lệ khiếu nại, giờ (3h sáng), số tiền lẻ bất thường.
Khi model cho điểm cao, phải trích được **lý do** (feature nào đẩy điểm) để nhân viên điều tra và khách hiểu.
 
~~~java
interface Rule { String name(); int score(); boolean matches(TxContext ctx); }
 
record Decision(boolean allow, boolean challenge, List<String> hitRules, List<String> hitFeatures) {}
 
Decision decide(List<Rule> rules, TxContext ctx, ModelScore mlScore,
                int challengeAt, int blockAt) {
    List<String> hits = new ArrayList<>();
    int score = 0;
    for (Rule r : rules) {
        if (r.matches(ctx)) { hits.add(r.name()); score += r.score(); }
    }
    // ML score: 0-100, quy đổi sang thang điểm rule
    score += mlScore.score();
    hits.addAll(mlScore.topFeatures()); // top 3 feature đẩy điểm
    
    if (score >= blockAt)     return new Decision(false, false, hits, mlScore.topFeatures());
    if (score >= challengeAt) return new Decision(true, true, hits, mlScore.topFeatures());
    return new Decision(true, false, hits, mlScore.topFeatures());
}
~~~
### Vòng phản hồi (Feedback Loop) & Case Management
Giao dịch bị CHALLENGE/BLOCK -> vào queue Case Management. Nhân viên xem, kết luận: "GIAN_LẬN_THẬT" hoặc "KHÁCH_THẬT". Kết luận này chính là **nhãn (label)** để retrain model tháng sau. Không có vòng này -> model chết dần vì kẻ gian đổi chiêu.
 
**Retrain pipeline:** Thu thập (label + feature snapshot tại thời điểm quyết định) -> Train offline -> Validate (offline metrics + shadow mode) -> Canary deploy (5% traffic 48h) -> Full rollout. Tự động rollback nếu FP tăng > 20% so với model cũ.
### Lưu snapshot feature tại quyết định - bắt buộc
Khi decision, phải ghi log feature snapshot (ví dụ dưới đây), để sau này giải trình được tại sao chặn khách và retrain chính xác:

~~~json
{
  "velocity_5m": 12,
  "amount_1h": 5000000,
  "device_new": true,
  "geo_distance_km": 1200
}
~~~
### Lỗi hay gặp
- Tính lại toàn bộ feature trong lúc chờ quyết định -> quá trễ, timeout hàng loạt
- Velocity dùng Redis quên TTL hoặc quên key theo cửa sổ thời gian -> bộ nhớ phình, số liệu sai
- Hai giao dịch song song cùng tăng velocity (read-increment-write) -> mất cập nhật; phải dùng INCR atomic hoặc Lua script
- Không ghi feature snapshot -> không tái hiện được, không retrain được
- Đổi ngưỡng không grey release -> tỷ lệ block nhảy vọt một buổi sáng
### Ví dụ đời thực
 
Ngân hàng 2 triệu giao dịch thẻ/ngày. Sáng nay tỷ lệ BLOCK nhảy từ 0.2% lên 3.5% trong 2h, tổng đài ngập. Dev tra soát: 08:15 team DS deploy model v2.3, giảm challengeAt 70->55 để "bắt nhiều gian lận hơn", không grey release, không thông báo. Model chấm điểm cao cho giao dịch nhỏ buổi sáng (velocity 30p) do dữ liệu train thiếu đại diện giờ cao điểm.
 
**Fix:** Rollback v2.2 (15p), bổ sung pipeline: canary 5% 48h, auto rollback nếu FP tăng > 20%, chuẩn hóa velocity theo bucket giờ (0-6h, 6-12h...). Kết quả: v2.4 deploy an toàn, FP giảm 40%.
### Trả lời mẫu khi phỏng vấn
 
"Fraud real-time quyết định 150-300ms: APPROVE / CHALLENGE / BLOCK. Ba lớp song song: Rule Engine (luật cứng), ML Model (điểm 0-1), Whitelist/Blacklist. Độ trễ: tổng 2000ms, decision 150-300ms -> đọc feature từ Redis cache, tính nặng async qua Kafka. Timeout: fail-open cho tiền nhỏ, fail-closed/challenge cho tiền lớn/nước ngoài. FP (chặn nhầm khách thật) giảm bằng step-up OTP/push thay vì block, kênh 'Đây là tôi' 1 chạm. Luôn ghi feature snapshot tại quyết định. Vòng phản hồi: nhân viên gán nhãn legit/fraud -> retrain monthly với canary + auto rollback. Thực tế: rollback model sai config trong 15p, sau đó pipeline an toàn, FP giảm 40%."
 
> Senior tip: Ba chốt: (1) **Decision chỉ đọc cache** - phần nặng async. (2) **Luôn có policy timeout** - fail-open/fail-closed theo ngưỡng tiền. (3) **Ưu tiên CHALLENGE > BLOCK** - step-up authentication giảm FP. (4) **Ghi feature snapshot** - không thì không debug được, không retrain được. Hỏi interviewer: "Hệ thống của anh có step-up authentication không? FP rate hiện tại bao nhiêu?"
 
> Cụm từ: Velocity = tốc độ giao dịch (số lần/tiền trong cửa sổ thời gian). Step-up authentication = buộc thêm OTP/push ngay trong giao dịch thay vì từ chối. Canary deploy = triển khai cho % nhỏ traffic trước khi full.
 
`,
  follow: [
    'Decision service timeout 300ms, bạn fail-open hay fail-closed? Quyết định dựa trên gì?',
    'Làm sao giảm FP mà không tăng FN? Step-up authentication thiết kế ra sao?',
    'Model cho điểm 0.92, bạn giải thích thế nào cho khách và bộ phận tuân thủ?'
  ],
  tags: ['fraud', 'real-time', 'rule engine', 'ML', 'latency', 'false positive', 'step-up', 'feedback loop']
},
{
  id: 'banking-061',
  topic: 'banking',
  level: 'lead',
  q: 'Audit trail không thể sửa (append-only, hash chain): thiết kế lưu trữ bất biến, hash chaining để phát hiện sửa xóa, WORM storage, và cách truy vết khi phát hiện lệch sổ cái.',
  a: `**Tóm tắt:** Audit trail (nhật ký kiểm toán) là bản ghi bất biến của mọi hành động nhạy cảm: ai, làm gì, lúc nào, giá trị trước/sau, từ IP nào. Bắt buộc **append-only** (chỉ thêm, không sửa/xóa), **hash chain** (mỗi bản ghi hash của bản ghi trước để phát hiện can thiệp), lưu trên **WORM storage** (Write Once Read Many - ghi một lần đọc nhiều, không cho sửa/xóa kể cả admin). Khi phát hiện lệch sổ cái, dùng audit trail để truy vết: tìm transaction_id, xem ai tạo, ai duyệt, giá trị trước/sau, IP, timestamp -> xác định gốc lỗi hoặc gian lận.
### Vì sao audit trail phải bất biến
Trong ngân hàng, nếu nhân viên có thể sửa log, không ai tin được dữ liệu. Kiểm toán, cơ quan quản lý, tòa án yêu cầu log không thể sửa. Nếu một nhân viên gian lận (sửa hạn mức, chuyển tiền, xóa giao dịch) và xóa log -> không bằng chứng xử phạt.
### Thiết kế bản ghi Audit (Audit Entry)
 
~~~text
audit_entry:
  id (BIGSERIAL)                    -- thứ tự tự tăng, dùng làm chuỗi hash
  correlation_id (UUID)             -- gắn xuyên suốt một luồng nghiệp vụ
  occurred_at (TIMESTAMPTZ)         -- thời điểm chính xác
  actor_id (BIGINT)                 -- mã nhân viên/hệ thống
  actor_role (VARCHAR)              -- vai trò: MAKER, CHECKER, SYSTEM, ADMIN
  action (VARCHAR)                  -- CREATE, APPROVE, REJECT, TRANSFER, ADJUST_LIMIT...
  resource_type (VARCHAR)           -- ACCOUNT, TRANSACTION, LIMIT, RATE, MANDATE...
  resource_id (VARCHAR)             -- id đối tượng bị tác động
  before_json (JSONB)               -- giá trị TRƯỚC (null nếu tạo mới)
  after_json (JSONB)                -- giá trị SAU (null nếu xóa)
  ip_address (INET)                 -- IP người thực hiện
  user_agent (TEXT)                 -- trình duyệt/app
  result (VARCHAR)                  -- SUCCESS, DENIED, FAILED
  hash_chain (CHAR(64))             -- SHA-256(prev_hash || current_data)
~~~
 
**Hash chain:** Mỗi bản ghi tính {{hash = SHA256(prev_hash || current_data_serialized)}}. Bản ghi đầu tiên dùng {{prev_hash = "GENESIS"}}. Nếu ai sửa bản ghi giữa -> hash của bản ghi đó và tất cả bản ghi sau đều sai -> phát hiện ngay.
### Append-only enforcement tại tầng Database
 
**Cách 1: REVOKE UPDATE, DELETE trên bảng audit (PostgreSQL)**
~~~sql
REVOKE UPDATE, DELETE ON audit_entry FROM application_role;
-- Chỉ cho INSERT, SELECT
~~~
 
**Cách 2: Trigger chặn UPDATE/DELETE**
~~~sql
CREATE FUNCTION prevent_audit_modification() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is immutable. UPDATE/DELETE not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER audit_immutable
BEFORE UPDATE OR DELETE ON audit_entry
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
~~~
 
**Cách 3: Partition theo tháng + quyền READ ONLY cho partition cũ**
- Partition audit_entry theo tháng (audit_entry_2026_01, audit_entry_2026_02...)
- Sau khi kết thúc tháng, {{ALTER TABLE ... SET (autovacuum_enabled = false)}} và revoke INSERT/UPDATE/DELETE, chỉ giữ SELECT
### WORM Storage (Write Once Read Many) - cấp hạ tầng
- **Object Storage với Object Lock** (AWS S3 Object Lock, Azure Immutable Blob, GCS Object Versioning + Retention Policy)
- Chế độ **Compliance Mode**: không ai (kể cả root/admin) xóa/sửa được trước khi retention hết hạn (ví dụ 7 năm)
- Chế độ **Governance Mode**: user có quyền đặc biệt có thể ghi đè (dùng cho test, không dùng production)
- Audit entry sau khi ghi vào DB, đồng bộ (async) sang WORM bucket mỗi 5 phút
### Truy vết (Traceability) khi phát hiện lệch sổ cái
Khi đối soát phát hiện lệch (ví dụ tài khoản A thiếu 500 triệu):
 
**1. Tìm transaction_id liên quan**
~~~sql
SELECT * FROM ledger_entries 
WHERE account_id = 'A' AND amount = 500000000 
ORDER BY created_at DESC LIMIT 20;
~~~
 
**2. Tra audit trail theo transaction_id (correlation_id)**
~~~sql
SELECT * FROM audit_entry 
WHERE correlation_id = 'TXN-12345' 
ORDER BY id;
~~~
 
**Kết quả truy vết ví dụ:**
| id | occurred_at | actor | action | resource | before | after | ip | hash |
|---|---|---|---|---|---|---|---|---|
| 1001 | 10:00:00 | U1 (MAKER) | CREATE | TRANSFER | null | {from:A, to:B, amt:500M} | 10.0.0.5 | h1 |
| 1002 | 10:00:05 | U2 (CHECKER) | APPROVE | TRANSFER | {status:PENDING} | {status:APPROVED} | 10.0.0.8 | h2 |
| 1003 | 10:00:10 | SYSTEM | POST_LEDGER | TRANSFER | {status:APPROVED} | {status:POSTED, ledger_id:LE-999} | - | h3 |
| 1004 | 10:05:00 | U3 (ADMIN) | ADJUST_LIMIT | ACCOUNT_A | {limit:100M} | {limit:500M} | 10.0.0.12 | h4 |  <-- ĐỎ: ADMIN tự tạo tự duyệt, sửa hạn mức
 
**3. Phân tích:** U3 (ADMIN) sửa hạn mức tài khoản A từ 100M lên 500M, sau đó tạo giao dịch chuyển 500M ra ngoài. Maker-checker bị bypass vì ADMIN có cả hai quyền. Hash chain vẫn đúng (không ai sửa log), nhưng log cho thấy vi phạm phân quyền.
### Phát hiện can thiệp log (Tamper Detection)
- Job hàng ngày: đọc toàn bộ audit_entry, tính toán lại hash chain, so với hash_chain cột lưu
- Nếu bất kỳ bản ghi nào {{recomputed_hash != stored_hash}} -> ALERT ngay: "Audit trail tampered at id=X"
- Kiểm tra: ai có quyền truy cập DB trực tiếp, ai có quyền SSH vào server, progress nào ghi audit
### Code: Hash chain & Tamper check
 
~~~java
@Service
class AuditService {
    private static final String GENESIS = "GENESIS";
    private final MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
    private final AuditRepo repo;
    private String lastHash = GENESIS;
    
    @PostConstruct
    void init() {
        lastHash = repo.findLastHash().orElse(GENESIS);
    }
    
    @Transactional
    public void log(AuditEntry entry) {
        String data = serialize(entry); // JSON canonical, không whitespace
        String input = lastHash + data;
        String hash = bytesToHex(sha256.digest(input.getBytes(StandardCharsets.UTF_8)));
        entry.setHashChain(hash);
        repo.save(entry);
        lastHash = hash;
    }
    
    // Job hàng ngày kiểm tra
    @Scheduled(cron = "0 0 2 * * ?")
    public void verifyHashChain() {
        String computed = GENESIS;
        for (AuditEntry e : repo.findAllOrderById()) {
            String data = serialize(e);
            computed = bytesToHex(sha256.digest((computed + data).getBytes(StandardCharsets.UTF_8)));
            if (!computed.equals(e.getHashChain())) {
                alertService.send("AUDIT_TAMPERED", "Hash mismatch at id=" + e.getId() 
                    + ", expected=" + computed + ", stored=" + e.getHashChain());
                break;
            }
        }
    }
}
~~~
### Lỗi hay gặp
- Ghi audit **sau** khi commit transaction -> nếu crash giữa chừng, audit thiếu, không khớp ledger
- **Không ghi before/after** -> không biết trường nào đổi từ giá trị nào sang giá trị nào
- Cho phép ADMIN/DB admin sửa log (không revoke quyền, không WORM) -> mất giá trị pháp lý
- Hash chain tính sai (không canonical JSON, có whitespace random) -> false positive tamper alert
- Correlation_id không gắn xuyên suốt luồng -> không truy vết được end-to-end
- Ghi PII (số thẻ, CMND) vào audit -> vi phạm PCI DSS / bảo vệ dữ liệu cá nhân
### Ví dụ đời thực
 
Ngân hàng phát hiện nhân viên back-office B sửa hạn mức thẻ khách từ 50M lên 500M, tự duyệt, chuyển 400M ra tài khoản đồng mưu. Khách khiếu nại. Đội dev tra audit trail: thấy bản ghi 10:05 U3(ADMIN) ADJUST_LIMIT limit 50M->500M, 10:06 U3 CREATE TRANSFER 400M, 10:06 U3 APPROVE TRANSFER (tự duyệt). Hash chain intact (không bị sửa log), nhưng log chứng minh vi phạm SoD (Segregation of Duties): ADMIN có cả maker/checker. 
 
**Xử lý:** Hoàn tiền, xử lý kỷ luật B, thu quyền duyệt ADMIN, sửa code: API kiểm tra {{maker_id != checker_id}}, ngưỡng tiền lớn cần 2 checker. Thêm job verify hash chain hàng ngày.
 
**Kết quả:** Audit trail giúp phát hiện gian lận trong 30 phút, có bằng chứng pháp lý. Sau 6 tháng không còn vi phạm SoD.
### Trả lời mẫu khi phỏng vấn
 
"Audit trail của tôi: append-only (chỉ INSERT, REVOKE UPDATE/DELETE), hash chain SHA-256 liên kết bản ghi trước (phát hiện can thiệp), WORM storage (S3 Object Lock Compliance Mode 7 năm). Bản ghi: correlation_id xuyên suốt luồng, before/after JSON, actor/role/action/ip/result. Khi lệch sổ cái: tra ledger tìm tx_id -> tra audit theo correlation_id -> xem ai làm gì, trước/sau giá trị nào, IP nào. Phát hiện can thiệp: job hàng ngày recompute hash chain, mismatch -> alert ngay. Thực tế: audit trail giúp bắt nhân viên ADMIN tự tạo tự duyệt chỉnh hạn mức chuyển tiền gian lận trong 30 phút, hash chain intact làm bằng chứng pháp lý."
 
> Senior tip: Ba chốt: (1) **Append-only thực sự** - REVOKE UPDATE/DELETE ở DB, không tin trigger. (2) **Hash chain + WORM** - phát hiện can thiệp kỹ thuật, WORM chống can thiệp hạ tầng. (3) **Before/After + Correlation_id** - không có hai thứ này thì log chỉ là "ai đó làm gì đó", không truy vết được giá trị cụ thể. Hỏi interviewer: "Audit log của anh có before/after không? Có hash chain không? Lưu đâu?"
 
> Cụm từ: Append-only = chỉ thêm mới, không sửa/xóa. Hash chain = mỗi bản ghi hash của bản ghi trước, sửa một chỗ -> tất cả sai. WORM = Write Once Read Many, lưu trữ ghi một lần đọc nhiều, không sửa/xóa. Correlation_id = mã gắn xuyên suốt một luồng nghiệp vụ.
 
`,
  follow: [
    'Khi hệ thống crash giữa chừng, audit entry có thể mất không? Làm sao đảm bảo audit và ledger cùng commit hoặc cùng rollback?',
    'Hash chain dùng SHA-256, collision resistance đủ không? Khi nào cần thuật toán mạnh hơn?',
    'WORM storage trên cloud (S3 Object Lock) có chi phí cao không? Có thay thế on-premise không?'
  ],
  tags: ['audit trail', 'append-only', 'hash chain', 'WORM', 'immutable log', 'tamper detection', 'forensics']
},
  {
    id: 'banking-062',
    topic: 'banking',
    level: 'senior',
    q: 'PO nói: "Làm tính năng chuyển tiền nội bộ giữa các tài khoản người dùng." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
    a: `**Tóm tắt:** Chuyển tiền nội bộ không đơn giản là update số dư, mà là một giao dịch nguyên tử cần đảm bảo tính nhất quán giữa hai tài khoản, chống đua tranh (race condition) và tuân thủ các quy định về đối soát.\n\n### Các câu nên hỏi lại\n\n1. **Phạm vi tài khoản:** Chuyển tiền nội bộ là giữa các tài khoản của cùng một khách hàng (Self-transfer) hay giữa các khách hàng khác nhau (Peer-to-peer)? Điều này ảnh hưởng đến việc kiểm tra quyền sở hữu và quy trình xác thực (ví dụ: chuyển giữa tài khoản của mình có thể cần ít xác thực hơn).\n2. **Loại tài khoản:** Có hỗ trợ chuyển từ/sang các loại tài khoản khác nhau không (ví dụ: Ví sang Tài khoản tiết kiệm, Tài khoản thanh toán sang Tài khoản vay)? Mỗi loại có quy tắc business khác nhau.\n3. **Hạn mức & Phí:** Có hạn mức tối thiểu/tối đa mỗi giao dịch/ngày không? Phí giao dịch tính như thế nào (ai chịu, phí theo % hay fixed)?\n4. **Quy trình duyệt (Workflow):** Giao dịch có cần qua bước duyệt (Maker-Checker) nếu vượt quá ngưỡng tiền nhất định không?\n5. **Xử lý lỗi (Failure Scenarios):** Nếu tài khoản nguồn đã trừ tiền nhưng hệ thống sập trước khi cộng tiền đích, quy trình rollback hoặc recon (đối soát) tự động sẽ hoạt động ra sao?\n6. **Độ trễ & Khối lượng:** Hệ thống kỳ vọng hỗ trợ bao nhiêu TPS (Transaction Per Second)? Có cần xử lý bất đồng bộ (Async) thông qua Message Queue (Kafka) để đảm bảo throughput không?\n7. **Audit & Tranh chấp:** Các thông tin bắt buộc phải ghi log để phục vụ thanh tra là gì? Khách hàng có thể tra cứu lịch sử giao dịch trong bao lâu?\n\n### Nếu không hỏi thì chuyện gì xảy ra\nGiả sử PO không nói về việc chuyển tiền giữa các loại tài khoản khác nhau. Bạn thiết kế chỉ cho Tài khoản thanh toán (Checking Account). Khi GO LIVE, khách hàng muốn chuyển từ Tiết kiệm sang Thanh toán để chi tiêu thì hệ thống báo lỗi không hỗ trợ. Điều này dẫn đến trải nghiệm khách hàng tệ và phải rewrite lại logic validation và transaction.\n\n### Từ câu trả lời tới thiết kế\n| Câu hỏi | Thiết kế A (Đơn giản) | Thiết kế B (Đầy đủ) |\n|---|---|---| \n| Phạm vi | Chỉ cùng 1 khách | Liên khách hàng |\n| Transaction | Single DB transaction | Distributed Transaction (Saga/2PC) |\n| Thông báo | Đồng bộ (Sync) | Bất đồng bộ (Async) |\n\n### Trả lời mẫu khi phỏng vấn\n"Khi nhận yêu cầu chuyển tiền nội bộ, tôi không bao giờ assume là chuyển tiền đơn giản giữa 2 tài khoản thanh toán. Senior level đòi hỏi tôi phải làm rõ 3 nhóm vấn đề: (1) Nghiệp vụ: phạm vi (cùng vs khác khách hàng), loại tài khoản (ví vs tiết kiệm), fee & limit. (2) Kỹ thuật: đảm bảo tính nguyên tử (Atomicity) của giao dịch, chống race condition khi cập nhật số dư, và chiến lược xử lý khi hệ thống timeout (commit/rollback). (3) Vận hành: yêu cầu về audit log, quy trình maker-checker cho giao dịch lớn. Việc làm rõ sớm giúp tôi chọn đúng pattern, ví dụ dùng DB lock cho giao dịch đơn giản, hoặc Saga pattern cho giao dịch cần tính nhất quán cuối cùng trên microservices. Can you clarify if we support cross-account types transfer? What is the expected transaction volume in peak hours?"\n\n> Senior tip: Đừng bao giờ tin câu "chuyển tiền đơn giản thôi". Trong banking, chuyển tiền = tiền di chuyển + trạng thái (pending/success/fail) + audit trail + đối soát. Luôn hỏi: "Điều gì xảy ra nếu tiền trừ mà không cộng?".`,
    follow: ['Làm sao để chống race condition khi hai luồng cùng cập nhật số dư tài khoản?', 'Tại sao trong hệ thống banking lớn lại ưu tiên Saga pattern thay vì 2PC?'],
    tags: ['internal transfer', 'banking', 'clarification', 'senior']
  },
  {
    id: 'banking-063',
    topic: 'banking',
    level: 'senior',
    q: 'PO nói: "Thêm tính năng thanh toán bằng QR cho merchant." Những câu hỏi làm rõ quan trọng nhất là gì?',
    a: `**Tóm tắt:** Thanh toán QR bao gồm luồng tương tác phức tạp giữa khách hàng, ứng dụng, hệ thống backend và merchant, cần đặc biệt lưu ý đến bảo mật, tính sẵn sàng và đối soát.\n\n### Các câu nên hỏi lại\n\n1. **Loại QR:** QR cố định (Static - Merchant đặt biển hiệu) hay QR động (Dynamic - Tạo ra mỗi lần thanh toán với số tiền cụ thể)? Loại Dynamic an toàn hơn vì tránh sai sót số tiền.\n2. **Xác thực:** Giao dịch cần xác thực qua mã PIN/Biometric trên app không? Nếu là QR cố định, khách hàng nhập số tiền, làm sao backend chắc chắn khách nhập đúng số tiền?\n3. **Cơ chế Merchant:** Merchant nhận thông báo thanh toán thế nào (Webhook, Push notification)? Khi nào thì tiền thực tế vào tài khoản merchant (Realtime hay Batch T+1)?\n4. **Xử lý lỗi:** Nếu merchant không nhận được webhook thanh toán thành công (timeout), merchant làm sao kiểm tra giao dịch có thực sự được ghi nhận không?\n5. **Hoàn tiền (Refund):** Tính năng hoàn tiền có nằm trong phạm vi này không? Ai là người được quyền hoàn tiền (chủ merchant hay admin hệ thống)?\n6. **Bảo mật:** QR có chứa dữ liệu nhạy cảm không? Có cần mã hóa QR không? QR có thời hạn sử dụng không (đặc biệt quan trọng với QR động)?\n\n### Nếu không hỏi thì chuyện gì xảy ra\nBạn thiết kế QR tĩnh. Khách hàng nhập số tiền sai (ví dụ 100k thành 10k), tiền trừ thiếu. Merchant không nhận được thông báo (webhook bị fail) nên từ chối giao dịch. Khách hàng khiếu nại. Không có cách nào để merchant đối soát tự động, dẫn đến tốn nhân lực support.\n\n### Từ câu trả lời tới thiết kế\n| Câu hỏi | Thiết kế A (QR Tĩnh) | Thiết kế B (QR Động) |\n|---|---|---| \n| Độ an toàn | Thấp (Rủi ro nhập sai) | Cao (Backend tạo số tiền) |\n| Backend | Cần validation mạnh | Backend control transaction |\n| Trải nghiệm | Nhanh | Cần tạo code mỗi lần |\n\n### Trả lời mẫu khi phỏng vấn\n"Thanh toán QR không chỉ là đọc mã, mà là quản lý trạng thái giao dịch liên bên. Tôi cần làm rõ: (1) Loại QR (động hay tĩnh) để quyết định kiến trúc backend validate. (2) Quy trình thông báo cho merchant (webhook có retry mechanism không?). (3) Cơ chế đối soát (Reconciliation) giữa hệ thống của chúng ta và merchant/thanh toán trung gian. Với QR tĩnh, tôi tập trung vào validate dữ liệu nhập và notify. Với QR động, tôi tập trung vào tính bảo mật của QR (tokenized) và khả năng tạo QR nhanh. Quan trọng nhất, tôi luôn hỏi: "Điều gì xảy ra nếu merchant không nhận được webhook?" để thiết kế tính năng tra cứu giao dịch cho merchant. Can you clarify if we need real-time settlement for merchants? How do we handle static QR payment amount validation?"\n\n> Senior tip: QR code chỉ là kênh truyền dữ liệu. Vấn đề thực sự nằm ở **giao thức xác nhận** giữa Merchant và chúng ta. Luôn giả định Webhook sẽ mất hoặc timeout, luôn có API để Merchant tự check status giao dịch.`,
    follow: ['Làm sao để chống tấn công "tráo QR" của kẻ xấu?', 'Nếu lượng QR thanh toán tăng đột biến, hệ thống xử lý Webhook có thể bị nghẽn không?'],
    tags: ['qr payment', 'banking', 'clarification', 'senior']
  },
  {
    id: 'banking-064',
    topic: 'banking',
    level: 'senior',
    q: 'PO nói: "Tụi mình cần làm tính năng hoàn tiền cho giao dịch." Những câu hỏi làm rõ quan trọng nhất là gì?',
    a: `**Tóm tắt:** Hoàn tiền là thao tác đảo ngược giao dịch, cực kỳ nhạy cảm về tài chính, cần kiểm tra kỹ quyền hạn, số dư tài khoản và trạng thái của giao dịch gốc.\n\n### Các câu nên hỏi lại\n\n1. **Phạm vi hoàn tiền:** Hoàn toàn bộ (Full Refund) hay hoàn một phần (Partial Refund)? Một giao dịch gốc có thể hoàn tiền nhiều lần không?\n2. **Quyền hạn:** Ai có quyền hoàn tiền (khách hàng, merchant, hay admin hệ thống)? Cần quy trình duyệt nào (workflow) cho các giao dịch hoàn tiền giá trị lớn?\n3. **Trạng thái giao dịch:** Chỉ giao dịch thành công mới được hoàn tiền hay cả giao dịch đang xử lý? Làm sao ngăn chặn hoàn tiền hai lần (Double Refund)?\n4. **Phí giao dịch:** Khi hoàn tiền, phí giao dịch gốc có được hoàn trả không? Ai chịu chi phí hoàn tiền?\n5. **Thời gian:** Hoàn tiền có hạn chế trong bao nhiêu ngày sau giao dịch gốc?\n6. **Hạch toán (Accounting):** Tiền hoàn tiền lấy từ nguồn nào (tài khoản merchant hay tài khoản hệ thống trung gian)? Giao dịch hoàn tiền này có được coi là một giao dịch độc lập không?\n\n### Nếu không hỏi thì chuyện gì xảy ra\nBạn không xử lý partial refund. Merchant muốn hoàn 1 phần nhưng hệ thống bắt hoàn tất cả. Merchant phải chuyển tiền ngoài hệ thống cho khách, dẫn đến khó đối soát, mất uy tín merchant, khách hàng kiện cáo, audit trail không phản ánh đúng thực tế.\n\n### Từ câu trả lời tới thiết kế\n| Câu hỏi | Thiết kế A (Hoàn tiền đơn giản) | Thiết kế B (Partial/Workflow) |\n|---|---|---| \n| Phạm vi | Chỉ full refund | Partial + Full |\n| Workflow | Tự động hoàn toàn | Cần maker-checker |\n\n### Trả lời mẫu khi phỏng vấn\n"Hoàn tiền là giao dịch đảo ngược (reverse transaction). Với tôi, tính năng hoàn tiền Senior level phải đảm bảo: (1) Kiểm soát trạng thái: giao dịch gốc phải ở trạng thái hợp lệ (e.g., đã settle). (2) Idempotency: đảm bảo không bao giờ có thể hoàn tiền quá số tiền gốc hoặc quá 1 lần đối với full refund. (3) Quyền hạn & Workflow: tách biệt người tạo lệnh hoàn tiền và người duyệt (Maker-Checker) để chống gian lận nội bộ. Tôi cũng cần làm rõ phí giao dịch gốc sẽ xử lý thế nào để đảm bảo số liệu accounting không bị lệch. Can you clarify if we allow partial refunds? Is there a time limit for refunds since the original transaction date?"\n\n> Senior tip: Hoàn tiền là cơ hội để gian lận. Luôn dùng idempotency key cho mọi lệnh hoàn tiền để tránh hoàn 2 lần khi mạng chập chờn. Luôn liên kết giao dịch hoàn tiền với transaction_id gốc trong audit trail.`,
    follow: ['Làm sao để đảm bảo số tiền hoàn tiền không vượt quá số tiền của giao dịch gốc?', 'Nếu giao dịch gốc là thanh toán bằng voucher, hoàn tiền xử lý thế nào?'],
    tags: ['refund', 'banking', 'clarification', 'senior']
  },
  {
    id: 'banking-065',
    topic: 'banking',
    level: 'senior',
    q: 'PO nói: "Thêm tính năng nạp tiền vào ví từ thẻ ngân hàng." Những câu hỏi làm rõ quan trọng nhất là gì?',
    a: `**Tóm tắt:** Nạp tiền là giao dịch tiền vào, cần kết nối với hệ thống thanh toán trung gian, đảm bảo an toàn, hạn mức và xác thực thẻ.\n\n### Các câu nên hỏi lại\n\n1. **Kết nối:** Chúng ta kết nối trực tiếp với từng ngân hàng hay qua trung gian thanh toán (Payment Gateway)? Điều này ảnh hưởng đến API integration và cơ chế bảo mật.\n2. **Xác thực:** Cần 3D Secure (OTP từ ngân hàng) không? Đây là yêu cầu bắt buộc để đảm bảo thẻ là của chính chủ.\n3. **Hạn mức & Phí:** Hạn mức nạp tiền tối đa là bao nhiêu để chống rửa tiền? Phí nạp tiền ai chịu?\n4. **Định danh (Tokenization):** Có lưu lại thông tin thẻ (tokenized) để lần sau nạp tiền nhanh không? Nếu có, cần tuân thủ PCI DSS.\n5. **Xử lý sự cố:** Nếu tiền từ thẻ đã trừ nhưng chưa vào ví, cơ chế recon (đối soát) và thông báo thế nào?\n6. **Hoàn tiền:** Nếu muốn hoàn tiền lại thẻ, có hỗ trợ không hay chỉ hoàn vào ví?\n\n### Nếu không hỏi thì chuyện gì xảy ra\nBạn không yêu cầu 3D Secure (OTP). Kẻ gian dùng thẻ cắp được nạp vào ví, sau đó rút tiền đi. Merchant bị ngân hàng phạt, tài khoản bị khóa do nghi ngờ gian lận (fraud), công ty chịu trách nhiệm bồi thường.\n\n### Từ câu trả lời tới thiết kế\n| Câu hỏi | Thiết kế A (Trực tiếp) | Thiết kế B (Qua Payment Gateway) |\n|---|---|---| \n| Tích hợp | Từng ngân hàng (Phức tạp) | Qua trung gian (Đơn giản hơn) |\n| Bảo mật | Cần tự quản lý PCI DSS | PG lo PCI DSS |\n\n### Trả lời mẫu khi phỏng vấn\n"Nạp tiền từ thẻ là giao dịch rủi ro cao (fraud-prone). Tôi tập trung vào: (1) Bảo mật & Xác thực: bắt buộc dùng 3D Secure, kiểm tra fraud score (ví dụ IP lạ, thẻ mới). (2) Tích hợp: dùng Payment Gateway để hạn chế việc trực tiếp lưu thông tin thẻ (tuân thủ PCI DSS). (3) Đối soát: hệ thống phải tự động recon hàng ngày với PG để tránh lệch số liệu. Với các giao dịch nạp tiền, tôi luôn ưu tiên tính an toàn lên trên tính tiện lợi. Can you clarify if we use a Payment Gateway or direct integration? Do we need to store card tokens for future top-ups?"\n\n> Senior tip: Đừng bao giờ lưu mã CVV. Luôn kiểm tra fraud scoring (IP, device fingerprint, hành vi nạp tiền bất thường). Đối với nạp tiền, tính an toàn là số 1.`,
    follow: ['Làm sao để chống các hành vi nạp tiền bằng thẻ cắp (Chargeback Fraud)?', 'Tại sao không nên tự lưu thông tin thẻ ngân hàng?'],
    tags: ['topup', 'banking', 'clarification', 'senior']
  },
  {
    id: 'banking-066',
    topic: 'banking',
    level: 'senior',
    q: 'PO nói: "Cần cập nhật lại tính năng hạn mức giao dịch cho người dùng." Những câu hỏi làm rõ quan trọng nhất là gì?',
    a: `**Tóm tắt:** Hạn mức giao dịch (transaction limit) là chốt chặn quan trọng để quản lý rủi ro, cần linh hoạt theo từng loại người dùng, loại giao dịch và thời gian.\n\n### Các câu nên hỏi lại\n\n1. **Phân loại hạn mức:** Có bao nhiêu loại hạn mức (ví dụ: tối đa mỗi giao dịch, tối đa mỗi ngày, tối đa mỗi tháng)?\n2. **Đối tượng áp dụng:** Hạn mức áp dụng cho ai (toàn bộ user, hay phân nhóm: eKYC xong, chưa eKYC, tài khoản doanh nghiệp)?\n3. **Cơ chế cập nhật:** Người dùng có tự nâng hạn mức được không? Nếu có, quy trình xác thực ra sao (ví dụ: up ảnh CMND, chờ duyệt)?\n4. **Độ ưu tiên:** Khi có nhiều hạn mức chồng chéo (ví dụ hạn mức theo ngày và theo loại dịch vụ), quy tắc nào được ưu tiên?\n5. **Thông báo:** Khi khách hàng gần đạt hạn mức, có cần thông báo không? Khi bị từ chối giao dịch do vượt hạn mức, thông báo ra sao?\n6. **Quản trị (Admin):** Admin có quyền chỉnh sửa hạn mức cho từng cá nhân cụ thể không (ví dụ: khách VIP)?\n\n### Nếu không hỏi thì chuyện gì xảy ra\nBạn thiết kế hạn mức cứng cho mọi user. Khách hàng doanh nghiệp chuyển tiền lớn bị từ chối liên tục, họ rời bỏ dịch vụ. Admin muốn nâng hạn mức cho khách VIP cũng không được, phải sửa code.\n\n### Từ câu trả lời tới thiết kế\n| Câu hỏi | Thiết kế A (Hạn mức cứng) | Thiết kế B (Hạn mức linh hoạt/RBAC) |\n|---|---|---| \n| Cấu hình | Hardcode | Configurable qua DB/Admin Panel |\n| Phân loại | User | Nhóm/Role/Loại giao dịch |\n\n### Trả lời mẫu khi phỏng vấn\n"Hạn mức là công cụ quản lý rủi ro tài chính cơ bản. Tôi tiếp cận: (1) Thiết kế hệ thống linh hoạt: dùng quy tắc (Rules Engine) để check hạn mức thay vì hardcode. Hạn mức nên được định nghĩa theo nhóm người dùng (RBAC) và loại giao dịch (ví dụ: chuyển tiền > thanh toán). (2) Khả năng quản trị: cần có Admin Panel để chỉnh sửa hạn mức nhanh cho các trường hợp đặc biệt. (3) Trải nghiệm người dùng: cần thông báo rõ khi sắp đạt hạn mức và lý do tại sao giao dịch bị từ chối. Can you clarify if the limit is per transaction, per day, or per month? Do we need to support individual limit exceptions?"\n\n> Senior tip: Hạn mức luôn cần được cập nhật theo thời gian thực (real-time). Sử dụng Redis để lưu giá trị đã tiêu dùng trong ngày để tính toán nhanh, tránh truy vấn DB nặng gây chậm giao dịch.`,
    follow: ['Làm sao để xử lý hạn mức trong môi trường microservices (consistency issue)?', 'Nếu khách hàng đạt hạn mức ngay lúc đang xử lý giao dịch, làm sao tránh để họ tiêu vượt?'],
  },
  {
  id: 'banking-067',
  topic: 'banking',
  level: 'senior',
  q: 'PO nói: "Chúng ta cần đối soát giao dịch cuối ngày với đối tác thanh toán (ví dụ NAPAS hoặc ngân hàng liên kết) để không bị thiếu tiền." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
  a: `**Tóm tắt:** Đối soát cuối ngày là so sánh sổ của ngân hàng chúng ta với sổ của đối tác thanh toán (ví dụ NAPAS — trung tâm chuyển tiền liên ngân hàng, hoặc ngân hàng liên kết) để tìm khoản tiền lệch: tiền có ở một bên nhưng không ở bên kia, hoặc cùng giao dịch nhưng số tiền khác. Trước khi thiết kế, dev cần làm rõ 11 câu dưới đây, nhóm theo 5 nhóm: phạm vi & người dùng, tiền & số liệu, trạng thái & lỗi, quy định & audit, phi chức năng. Mỗi câu đi kèm lý do hỏi và rủi ro nếu không hỏi.
### Các câu nên hỏi lại

**Nhóm 1: Phạm vi & người dùng**
1. Đối tác là hệ thống nào (NAPAS, ngân hàng liên kết, correspondent bank — ngân hàng đại lý ở nước ngoài), và giao dịch giữa hai bên được xác định bằng mã gì (mã tham chiếu duy nhất/ref ID)?
   - **Vì sao hỏi:** nếu không có ref ID duy nhất, ta không thể khớp từng giao dịch, chỉ dán tổng số tiền. Hai giao dịch cùng số tiền sẽ bị ghép nhầm, tiền bị cộng vào tài khoản sai khách hàng.
   - **Rủi ro nếu không hỏi:** giao dịch 5 triệu của khách A bị ghép nhầm với giao dịch 5 triệu của khách B, số dư hai khách sai, khách khiếu nại liên tiếp.
2. Ai gửi file đối soát, ai nhận, và file đến theo quy định nào (hàng ngày, qua SFTP, hay qua API)?
   - **Vì sao hỏi:** xác định runbook và SLA (thời gian cam kết hoàn thành). Nếu file đến muộn hai ngày mà team không biết, số dư báo cáo sai mà không ai phát hiện kịp.

**Nhóm 2: Tiền & số liệu**
3. Số tiền lưu ở đơn vị nhỏ nhất (VND = đồng, không có phần thập phân, vì Việt Nam không dùng xu/hào) hay có phần thập phân?
   - **Vì sao hỏi:** lưu sai scale (ví dụ lưu 1.5 đồng) sẽ làm tròn lệch 1 đồng mỗi giao dịch, tích lũy thành sai số lớn trên hàng nghìn giao dịch.
   - **Rủi ro nếu không hỏi:** sổ cái lệch, kiểm toán không chấp nhận báo cáo cuối ngày.
4. Phí dịch vụ có được trừ riêng hay gộp vào số tiền chính?
   - **Vì sao hỏi:** nếu gộp, đối soát theo số tiền sẽ sai vì đối tác không trừ cùng khoản phí.
   - **Rủi ro:** sai P&L (báo cáo lãi lỗ), kế toán không đối được sổ, phải xử lý thủ công hàng ngày.

**Nhóm 3: Trạng thái & lỗi**
5. Giao dịch bị timeout (không nhận phản hồi trong thời gian cho phép) coi là thành công hay thất bại?
   - **Vì sao hỏi:** timeout không có nghĩa là thất bại, chỉ là chưa biết kết quả. Coi là thất bại và hoàn tiền ngay sẽ gây trừ tiền hai lần nếu đối tác đã xử lý thành công.
   - **Rủi ro:** khách nhận tiền hai lần, hoặc ngân hàng mất tiền mà không biết.
6. Nếu hai bên có số liệu khác nhau (break — khoản lệch trong đối soát), điều chỉnh sổ cái ai thực hiện, và cần người duyệt không?
   - **Vì sao hỏi:** điều chỉnh sổ cần quy trình maker-checker (một người tạo yêu cầu, một người khác duyệt) để ngăn một nhân viên tự sửa số tiền và gây gian lận.

**Nhóm 4: Quy định & audit**
7. Có yêu cầu lưu log truy vết (ai sửa số dư, lúc nào, giá trị trước/sau) không, và lưu bao lâu?
   - **Vì sao hỏi:** cơ quan quản lý và kiểm toán yêu cầu bằng chứng pháp lý cho mọi thay đổi số dư.
   - **Rủi ro:** không có log → không biết ai gây sai số, không thể xử lý vi phạm, có thể bị phạt theo quy định ngân hàng nhà nước.

**Nhóm 5: Phi chức năng**
8. Hệ thống cần xử lý bao nhiêu giao dịch mỗi ngày (khối lượng), và độ trễ chấp nhận được là bao nhiêu?
   - **Vì sao hỏi:** 100.000 giao dịch/ngày và 10 triệu giao dịch/ngày thiết kế khác nhau hoàn toàn. Khối lượng lớn cần xử lý song song, khối lượng nhỏ chỉ cần job đơn giản.
9. Cần đối soát real-time (trong ngày) hay chỉ cuối ngày (batch — chạy một lần vào cuối ngày)?
   - **Vì sao hỏi:** real-time cần Kafka/streaming và cảnh báo ngay, cuối ngày chỉ cần job batch chạy một lần. Nhầm lẫn sẽ chi phí quá cao hoặc phát hiện lỗi chậm 24 giờ.
10. File đối tác bị gửi trùng hai lần hoặc đến muộn, hệ thống xử lý thế nào (không tạo giao dịch trùng)?
    - **Vì sao hỏi:** đối tác gửi lại file khi mạng lỗi. Nếu không kiểm tra mã tham chiếu đã xử lý, giao dịch cũ được nhập lại, tiền bị cộng hai lần.
11. Hạn mức điều chỉnh sổ cái mỗi lần là bao nhiêu, quá ngưỡng cần mức duyệt cao hơn không?
    - **Vì sao hỏi:** điều chỉnh lớn (trên 5 tỷ) cần duyệt cấp cao, điều chỉnh nhỏ chỉ cần một người. Quy tắc này phải ghi vào thiết kế, không tự ý code.
### Nếu không hỏi thì chuyện gì xảy ra
Ngân hàng A gửi 10.000 giao dịch sang Ngân hàng B qua NAPAS trong một ngày, tổng 5 tỷ đồng. Bên B báo nhận 9.998 giao dịch, tổng 4 tỷ 990 triệu đồng — thiếu hai giao dịch, 10 triệu đồng. Nếu không có mã tham chiếu duy nhất và quy trình tra soát, hai giao dịch này bị "trôi nổi": khách gọi khiếu nại tiền mất, tổng đài quá tải, đội dev phải đối soát theo tay hàng nghìn dòng log. Sau một tuần mới tìm ra hai giao dịch bị mất do lỗi định dạng file của bên B, trong đó một giao dịch khách đã nhận tiền nhưng sổ chúng ta chưa ghi.
### Từ câu trả lời tới thiết kế
Bảng dưới cho thấy câu trả lời khác nhau dẫn tới thiết kế khác nhau:

| Câu trả lời PO | Thiết kế A (đơn giản) | Thiết kế B (doanh nghiệp) |
|---|---|---|
| Có mã ref ID duy nhất | Khớp theo ref ID, 1-1 | Khớp theo ref ID, kèm số tiền và ngày |
| Không có ref ID, chỉ số tiền+ngày | Khớp mờ, dễ ghép nhầm | Không chấp nhận, yêu cầu đối tác bổ sung mã |
| File đến hàng đêm | Job batch chạy sau 23 giờ | Cần job intra-day, cảnh báo nếu file không đến |
| Điều chỉnh sổ cần duyệt | Một nhân viên tự sửa | Maker-checker, hai người khác nhau |
### Trả lời mẫu khi phỏng vấn
"Khi PO yêu cầu đối soát cuối ngày với đối tác, tôi sẽ làm rõ 11 câu nhóm theo năm nhóm: đối tác là ai và dùng mã ref ID gì để khớp giao dịch (phạm vi & người dùng); tiền lưu đơn vị nhỏ nhất hay có phần thập phân, phí trừ riêng hay gộp (tiền & số liệu); timeout coi thành công hay thất bại, break điều chỉnh ai và có duyệt không (trạng thái & lỗi); lưu log truy vết bao lâu (quy định & audit); khối lượng giao dịch mỗi ngày và đối soát real-time hay batch, file gửi trùng xử lý thế nào (phi chức năng). Tôi khuyên không coi timeout là thất bại, vì tiền có thể đã được xử lý ở bên kia. Can you clarify: does the partner provide a unique reference ID for every transaction? What is the expected daily volume and acceptable reconciliation latency? Is reconciliation batch end-of-day or intraday?"

> Senior tip: Luôn bắt đối tác cung cấp mã tham chiếu duy nhất cho mỗi giao dịch, không dùng số tiền + thời gian để khớp (hai giao dịch cùng số tiền sẽ bị ghép nhầm). Mọi điều chỉnh sổ sau đối soát phải ghi bút toán mới (append-only), có người duyệt khác người tạo, và lưu log truy vết đủ để kiểm toán sau này.

  `,
},
{
  id: 'banking-068',
  topic: 'banking',
  level: 'senior',
  q: 'PO nói: "Ngân hàng cần tính lãi tiền gửi cho khách hàng theo kỳ hạn (1, 3, 6, 12 tháng) và không kỳ hạn (tiết kiệm)." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
  a: `**Tóm tắt:** Tính lãi tiền gửi là quy trình ngân hàng tính số tiền lãi trả cho khách hàng dựa trên số tiền gửi, lãi suất và số ngày gửi. Ví dụ khách gửi 100 triệu đồng, lãi suất 6% mỗi năm, gửi 30 ngày thì lãi khoảng 493.150 đồng. Trước khi thiết kế, dev cần làm rõ 10 câu dưới đây, nhóm theo 5 nhóm: phạm vi & người dùng, tiền & số liệu, trạng thái & lỗi, quy định & audit, phi chức năng. Mỗi câu đi kèm lý do hỏi và rủi ro nếu không hỏi.
### Các câu nên hỏi lại

**Nhóm 1: Phạm vi & người dùng**
1. Sản phẩm tiền gửi là không kỳ hạn (tiết kiệm, rút bất cứ lúc) hay có kỳ hạn (1, 3, 6, 12 tháng, khóa tiền)?
   - **Vì sao hỏi:** không kỳ hạn tính lãi mỗi ngày và rút bất cứ lúc; có kỳ hạn tính theo ngày cam kết, rút sớm thường bị phạt hoặc tính lãi suất thấp hơn.
   - **Rủi ro nếu không hỏi:** thiết kế chỉ hỗ trợ tiết kiệm, sau đó khách muốn gửi có kỳ hạn thì hệ thống không tính đúng lãi và phải viết lại.
2. Lãi suất năm là bao nhiêu, áp dụng cho tất cả khách hay phân loại (khách VIP, số tiền lớn)?
   - **Vì sao hỏi:** nếu có nhiều bảng lãi suất, cần lưu phiên bản theo ngày (effective_from/effective_to) để sổ cũ vẫn tính theo lãi cũ, không bị ghi đè.
   - **Rủi ro:** 15.000 khách khiếu nại "lãi bị giảm giữa chừng" khi bảng lãi suất được cập nhật và áp dụng sai cho sổ cũ.

**Nhóm 2: Tiền & số liệu**
3. Quy ước đếm ngày là actual/365 (số ngày thực chia 365) hay actual/360, và tính lãi bao nhiêu lần một ngày?
   - **Vì sao hỏi:** actual/365 phổ biến ở Việt Nam. actual/360 làm lãi cao hơn một chút vì mẫu số nhỏ hơn. Sai quy ước → lãi sai từng đồng.
   - **Rủi ro:** báo cáo lãi lỗ cuối ngày không khớp sổ cái kế toán.
4. Lãi trả vào tài khoản khách hàng hay nhập gốc (lãi kép — lãi vừa cộng lại sinh thêm lãi)?
   - **Vì sao hỏi:** lãi nhập gốc tăng số dư gốc, lãi kỳ sau tính trên số lớn hơn. Khách cần biết để so sánh sản phẩm.
5. Tất toán trước hạn tính lãi suất không kỳ hạn (rất thấp, ví dụ 0.2% mỗi năm) hay lãi suất cam kết?
   - **Vì sao hỏi:** rút sớm tính lãi thấp làm khách hiểu rõ rủi ro, tránh khiếu nại "tại sao rút sớm nhận ít lãi".
6. Làm tròn đến đồng hay đến xu, chế độ HALF_UP (làm tròn toán học, 0.5 lên 1) hay HALF_EVEN (làm tròn về số chẵn gần nhất)?
   - **Vì sao hỏi:** VND không có phần thập phân, làm tròn về đồng. Chọn chế độ và áp dụng nhất quán, không được làm tròn ở từng bước giữa.

**Nhóm 3: Trạng thái & lỗi**
7. Tính lãi mỗi ngày (sinh khối/accrual — ghi nhận lãi đã phát sinh nhưng chưa trả cho khách) hay chỉ tính khi đáo hạn?
   - **Vì sao hỏi:** sinh khối mỗi ngày giúp báo cáo lãi lỗ ổn định, không nhảy vọt vào ngày đáo hạn. Kế toán yêu cầu ghi nhận đều đặn.
   - **Rủi ro:** nếu bỏ qua, báo cáo lãi/lỗ ngày nhảy vọt vào ngày đáo hạn, kiểm toán không chấp nhận.
8. Dùng BigDecimal hay double trong code Java?
   - **Vì sao hỏi:** double lưu số thực theo nhị phân, bị sai số (0.1 + 0.2 không bằng 0.3 chính xác). Với tiền, một đồng lệch cũng là lỗi. BigDecimal chính xác từng chữ số thập phân.
   - **Rủi ro:** 10.000 sổ tiền gửi, mỗi sổ sai 1-2 đồng, tổng chênh lệch hàng chục nghìn đồng, kiểm toán từ chối.

**Nhóm 4: Quy định & audit**
9. Ngày đáo hạn rơi vào ngày nghỉ (cuối tuần, ngày lễ), xử lý thế nào (chuyển sớm hay muộn)?
   - **Vì sao hỏi:** cần quy tắc rõ (roll forward sang ngày làm việc tiếp theo, hoặc roll backward) để số dư và lãi tính đúng.
10. Có phần dư khi chia lãi cho nhiều phần, bổ sung vào kỳ nào (thường kỳ cuối)?
    - **Vì sao hỏi:** chia 10.000 đồng cho 3 kỳ: 3333 + 3333 + 3333 = 9999, thiếu 1 đồng. Phần dư phải được bổ sung có chủ đích để tổng khớp hợp đồng.
### Nếu không hỏi thì chuyện gì xảy ra
Một sổ tiền gửi 100 triệu đồng, lãi suất 6% mỗi năm, gửi 30 ngày. Dev dùng kiểu double và làm tròn ở mỗi bước tính toán giữa. Khách gọi khiếu nại số tiền lãi sai 1-2 đồng so với tay tính, và trên 10.000 sổ tiền gửi thì tổng chênh lệch lên hàng chục nghìn đồng. Điều tra thấy code dùng double (sai số nhị phân), chia cho 365 gây sai số, và làm tròn ở mỗi bước nhân chia. Nguyên nhân gốc: tiền trong Java phải dùng BigDecimal, chỉ làm tròn một lần ở bước cuối. Sau khi viết lại bằng BigDecimal và chỉ setScale(2, HALF_UP) ở cuối, sai số lãi giảm xuống 0 đồng, báo cáo lãi lỗ cuối ngày khớp sổ cái, kiểm toán chấp nhận.
### Từ câu trả lời tới thiết kế
Bảng dưới cho thấy câu trả lời khác nhau dẫn tới thiết kế khác nhau:

| Câu trả lời PO | Thiết kế A (đơn giản) | Thiết kế B (doanh nghiệp) |
|---|---|---|
| Không kỳ hạn, tính lãi mỗi ngày | Job EOD tính lãi toàn bộ sổ | Sinh khối accrual hằng ngày, báo cáo ổn định |
| Có kỳ hạn, nhiều bảng lãi suất | Lưu 1 giá trị lãi suất, ghi đè khi đổi | Lưu phiên bản theo ngày, sổ cũ tính lãi cũ |
| Lãi trả vào tài khoản | Cộng lãi vào tài khoản thanh toán | Lãi nhập gốc, số dư gốc tăng |
### Trả lời mẫu khi phỏng vấn
"Khi PO yêu cầu tính lãi tiền gửi theo kỳ hạn và không kỳ hạn, tôi sẽ làm rõ 10 câu nhóm theo năm nhóm: sản phẩm không kỳ hạn hay có kỳ hạn, lãi suất áp dụng cho tất cả hay phân loại (phạm vi & người dùng); quy ước đếm ngày actual/365 hay 360, lãi trả vào tài khoản hay nhập gốc, tất toán trước hạn tính lãi như thế nào, làm tròn như thế nào (tiền & số liệu); tính lãi mỗi ngày hay chỉ khi đáo hạn, dùng BigDecimal hay double (trạng thái & lỗi); ngày đáo hạn rơi ngày nghỉ xử lý ra sao, phần dư chia lãi bổ sung vào kỳ nào (quy định & audit); khối lượng sổ và tần suất tính lãi (phi chức năng). Tôi khuyên dùng BigDecimal, chỉ làm tròn một lần ở bước cuối, và lưu phiên bản lãi suất theo ngày để sổ cũ không bị ảnh hưởng. Can you clarify: what day count convention (actual/365 or actual/360) should interest use? Is interest paid out or compounded into principal? How is early termination interest calculated?"

> Senior tip: Lệch 1 đồng là lỗi nghiêm trọng trong kiểm toán ngân hàng. Luôn chốt quy ước "phần dư cộng vào kỳ nào, RoundingMode nào, actual/365 hay actual/360" bằng văn bản với nghiệp vụ/kế toán trước khi code, và khóa bằng test tự động.

  `,
},
{
  id: 'banking-069',
  topic: 'banking',
  level: 'senior',
  q: 'PO nói: "Chúng ta cần mở tài khoản ngân hàng online qua eKYC (xác thực khách hàng điện tử) thay vì khách hàng phải đến chi nhánh." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
  a: `**Tóm tắt:** Mở tài khoản online qua eKYC là quy trình xác thực danh tính khách hàng từ xa bằng giấy tờ tờ nhận (CMND/CCCD) và ảnh khuôn mặt, thay vì phải đến trực tiếp chi nhánh. Trước khi thiết kế, dev cần làm rõ 10 câu dưới đây, nhóm theo 5 nhóm: phạm vi & người dùng, tiền & số liệu, trạng thái & lỗi, quy định & audit, phi chức năng. Mỗi câu đi kèm lý do hỏi và rủi ro nếu không hỏi.
### Các câu nên hỏi lại

**Nhóm 1: Phạm vi & người dùng**
1. Quy trình eKYC có bao nhiêu bước (chụp ảnh CMND, chụp ảnh mặt, xác thực số điện thoại, hội nghị video với nhân viên, ký điện tử)?
   - **Vì sao hỏi:** mỗi bước cần một giao diện, một servizio xử lý, và có thể thất bại riêng lẻ. Thiết kế phải khớp với số bước thực tế.
   - **Rủi ro nếu không hỏi:** thiết kế chỉ hỗ trợ 2 bước, sau đó compliance yêu cầu bước video, hệ thống không đủ và phải viết lại phần lớn.
2. Ai là đối tượng (cá nhân, doanh nghiệp, người nước ngoài sống ở Việt Nam)?
   - **Vì sao hỏi:** người nước ngoài cần hộ chiếu + visa, doanh nghiệp cần giấy phép kinh doanh, quy trình khác hoàn toàn.

**Nhóm 2: Tiền & số liệu**
3. Số tiền nạp tối đa ban đầu cho tài khoản eKYC là bao nhiêu (ví dụ 100 triệu/ngày)?
   - **Vì sao hỏi:** tài khoản chưa xác thực đầy đủ thường có hạn mức thấp để giảm rủi ro gian lận.
4. Phí mở tài khoản, phí duy trì hàng tháng có thu không, và tính từ khi nào?
   - **Vì sao hỏi:** ảnh hưởng trực tiếp đến số dư thực tế của khách và báo cáo doanh thu.

**Nhóm 3: Trạng thái & lỗi**
5. Mỗi bước eKYC có trạng thái gì (pending, verified, rejected, expired), và khi nào hết hạn?
   - **Vì sao hỏi:** khách có thể chụp ảnh nhưng không hoàn thành trong 24 giờ, cần hết hạn và cho phép bắt đầu lại.
   - **Rủi ro:** hồ sơ bị "kẹt" mãi trong trạng thái pending, khách không biết lý do, tổng đài quá tải.
6. Nếu chụp ảnh CMND mờ, hệ thống từ chối ngay hay cho phép chụp lại tối đa N lần?
   - **Vì sao hỏi:** cần quy tắc rõ để tránh khách chụp lại vô tận hoặc bị khóa hồ sơ sau một lần sai.

**Nhóm 4: Quy định & audit**
7. Dữ liệu eKYC (ảnh CMND, ảnh mặt) được lưu bao lâu, và ai được xem (chỉ compliance team hay toàn bộ dev)?
   - **Vì sao hỏi:** pháp luật yêu cầu lưu dữ liệu xác thực đủ thời gian (ví dụ 5 năm) và chỉ cho người được ủy quyền xem để ngăn rò rỉ thông tin cá nhân.
8. Có lưu nhật ký ai duyệt hồ sơ, lúc nào, lý do gì không?
   - **Vì sao hỏi:** kiểm toán yêu cầu bằng chứng ai đã duyệt mở tài khoản cho khách, tránh nhân viên đứng sau mở tài khoản ảo.

**Nhóm 5: Phi chức năng**
9. Khách hàng mở tài khoản đồng thời bao nhiêu người mỗi giờ, và thời gian duyệt chấp nhận được là bao nhiêu?
   - **Vì sao hỏi:** 100 người/giờ và 10.000 người/giờ thiết kế khác nhau hoàn toàn. Khối lượng lớn cần xử lý song song và hàng đợi.
10. Nếu dịch vụ xác thực khuôn mặt của bên thứ ba lỗi, hệ thống làm thế nào (chuyển sang quay lại chi nhánh hay thử lại sau)?
    - **Vì sao hỏi:** cần kế hoạch dự phòng (fallback) khi bên thứ ba gián đoạn, không để toàn bộ quy trình dừng hẳn.
### Nếu không hỏi thì chuyện gì xảy ra
Ngân hàng triển khai mở tài khoản online chỉ hỗ trợ chụp ảnh CMND và ảnh mặt. Sau hai tuần, cơ quan quản lý yêu cầu thêm bước xác thực video trực tiếp và lưu dữ liệu 5 năm, chỉ compliance team được xem. Hệ thống hiện không có bước video, không phân quyền xem, và không lưu nhật ký duyệt. Đội dev phải viết lại giao diện, thêm microservice gọi video, chỉnh sửa cơ sở dữ liệu để lưu nhật ký, và loại bỏ quyền truy cập của dev — mất hơn một tháng, trong lúc đó không thể mở tài khoản online mới.
### Từ câu trả lời tới thiết kế
Bảng dưới cho thấy câu trả lời khác nhau dẫn tới thiết kế khác nhau:

| Câu trả lời PO | Thiết kế A (đơn giản) | Thiết kế B (doanh nghiệp) |
|---|---|---|
| Chỉ cá nhân, 2 bước | 1 microservice, không phân quyền | Nhiều bước, phân quyền compliance, lưu 5 năm |
| Nhiều loại khách (cá nhân, doanh nghiệp) | 1 quy trình chung | Quy trình riêng theo loại khách |
### Trả lời mẫu khi phỏng vấn
"Khi PO yêu cầu mở tài khoản online qua eKYC, tôi sẽ làm rõ 10 câu nhóm theo năm nhóm: quy trình eKYC có bao nhiêu bước và đối tượng là ai (phạm vi & người dùng); hạn mức nạp ban đầu và phí mở tài khoản (tiền & số liệu); trạng thái mỗi bước và xử lý khi ảnh mờ (trạng thái & lỗi); lưu dữ liệu ảnh bao lâu, ai được xem, và lưu nhật ký duyệt (quy định & audit); khối lượng khách mở mỗi giờ và kế hoạch dự phòng khi dịch vụ bên thứ ba lỗi (phi chức năng). Tôi khuyên có bước hết hạn cho hồ sơ chưa hoàn thành, phân quyền xem ảnh chỉ cho compliance, và lưu nhật ký ai duyệt để kiểm toán. Can you clarify: how many eKYC steps are required, and who is authorized to view the ID images? What is the daily volume target and acceptable approval time?"

> Senior tip: Ảnh CMND và ảnh mặt là dữ liệu nhạy cảm, không bao giờ lưu vào log hoặc hiển thị lại cho dev. Chỉ compliance team được xem, và phải có nhật ký truy cập đầy đủ để kiểm toán sau này.

  `,
},
{
  id: 'banking-070',
  topic: 'banking',
  level: 'senior',
  q: 'PO nói: "Ngân hàng cần hệ thống cảnh báo gian lận (fraud warning) khi phát hiện giao dịch lạ trên tài khoản khách hàng." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
  a: `**Tóm tắt:** Hệ thống cảnh báo gian lận phát hiện các giao dịch bất thường (ví dụ số tiền lớn đột ngột, giao dịch từ quốc gia lạ, nhiều giao dịch liên tiếp trong thời gian ngắn) và thông báo cho khách hàng hoặc từ chối giao dịch. Trước khi thiết kế, dev cần làm rõ 10 câu dưới đây, nhóm theo 5 nhóm: phạm vi & người dùng, tiền & số liệu, trạng thái & lỗi, quy định & audit, phi chức năng. Mỗi câu đi kèm lý do hỏi và rủi ro nếu không hỏi.
### Các câu nên hỏi lại

**Nhóm 1: Phạm vi & người dùng**
1. Cảnh báo gửi đến ai (khách hàng qua SMS/email, đội rủi ro ngân hàng, hoặc cả hai)?
   - **Vì sao hỏi:** nếu chỉ gửi khách hàng, ngân hàng không biết có gian lận lớn nào đang xảy ra. Nếu chỉ gửi team, khách hàng không kịp can thiệp.
2. Áp dụng cho loại giao dịch nào (chuyển tiền, rút tiền, thanh toán thẻ, mua sắm online)?
   - **Vì sao hỏi:** mỗi loại giao dịch có quy tắc phát hiện khác nhau. Chuyển tiền lớn và mua sắm online không dùng cùng một ngưỡng.

**Nhóm 2: Tiền & số liệu**
3. Ngưỡng cảnh báo là bao nhiêu (ví dụ giao dịch trên 50 triệu, hoặc trên 50% số dư)?
   - **Vì sao hỏi:** ngưỡng quá thấp gây cảnh báo giả (false positive), khách phiền và bỏ qua. Ngưỡng quá cao bỏ lỡ gian lận thật.
4. Khung thời gian tính số giao dịch (ví dụ 5 giao dịch trong 10 phút) là bao nhiêu?
   - **Vì sao hỏi:** cần cửa sổ thời gian cố định để đếm số lần giao dịch và phát hiện tấn công kiểu "rút tiền nhiều lần liên tiếp".

**Nhóm 3: Trạng thái & lỗi**
5. Mỗi cảnh báo có trạng thái gì (new, under_review, confirmed_fraud, false_positive, dismissed), và ai thay đổi trạng thái?
   - **Vì sao hỏi:** cần theo dõi vòng đời cảnh báo từ khi sinh đến khi xử lý xong, tránh cảnh báo bị quên lãng.
6. Nếu hệ thống phát hiện gian lận, từ chối giao dịch ngay hay chỉ cảnh báo và để khách quyết định?
   - **Vì sao hỏi:** từ chối ngay gây phiền khách nếu là giao dịch hợp pháp (false positive). Chỉ cảnh báo có thể để gian lận xảy ra trước khi can thiệp.

**Nhóm 4: Quy định & audit**
7. Có lưu toàn bộ dữ liệu dùng để đưa ra quyết định cảnh báo (địa chỉ IP, thiết bị, thời gian, vị trí) không, và lưu bao lâu?
   - **Vì sao hỏi:** cần bằng chứng khi khách khiếu nại "tại sao giao dịch của tôi bị từ chối" hoặc khi cơ quan quản lý kiểm tra hệ thống phòng chống gian lận.
8. Khách hàng có quyền kháng cáo quyết định từ chối giao dịch không, và quy trình ra sao?
   - **Vì sao hỏi:** khách bị từ chối sai cần cách mở khóa tài khoản, không để bị khóa vĩnh viễn mà không có đường khai thác.

**Nhóm 5: Phi chức năng**
9. Cảnh báo cần xử lý trong thời gian bao nhiêu sau khi giao dịch xảy ra (ví dụ dưới 5 giây)?
   - **Vì sao hỏi:** nếu chậm hơn thời gian giao dịch hoàn thành, gian lận đã thành công trước khi hệ thống kịp can thiệp.
10. Hệ thống cần xử lý bao nhiêu giao dịch mỗi giây (TPS), và dùng rule-based hay machine learning?
    - **Vì sao hỏi:** rule-based dễ triển khai và giải thích, machine learning phát hiện được mẫu lạ mới nhưng khó giải thích và cần dữ liệu lịch sử.
### Nếu không hỏi thì chuyện gì xảy ra
Ngân hàng triển khai hệ thống cảnh báo gian lận chỉ dựa trên ngưỡng số tiền lớn (trên 100 triệu). Sau một tháng, nhóm tấn công chia giao dịch lớn thành nhiều giao dịch nhỏ (mỗi giao dịch 90 triệu, dưới ngưỡng) gửi đến nhiều tài khoản khác nhau. Hệ thống không phát hiện vì mỗi giao dịch nhỏ dưới ngưỡng, và không đếm số giao dịch trong khung thời gian ngắn. Thiệt gesam lên hàng tỷ đồng trước khi team rủi ro phát hiện qua báo cáo của khách hàng. Nguyên nhân gốc: không có quy tắc đếm tần suất giao dịch trong cửa sổ thời gian, và không có quy tắc phát hiện mẫu chia nhỏ giao dịch.
### Từ câu trả lời tới thiết kế
Bảng dưới cho thấy câu trả lời khác nhau dẫn tới thiết kế khác nhau:

| Câu trả lời PO | Thiết kế A (đơn giản) | Thiết kế B (doanh nghiệp) |
|---|---|---|
| Chỉ cảnh báo khách qua SMS | Gửi SMS, không từ chối giao dịch | Gửi SMS + từ chối giao dịch + thông báo team rủi ro |
| Rule-based ngưỡng cố định | 1 ngưỡng số tiền | Nhiều quy tắc: số tiền, tần suất, thiết bị, vị trí |
### Trả lời mẫu khi phỏng vấn
"Khi PO yêu cầu hệ thống cảnh báo gian lận, tôi sẽ làm rõ 10 câu nhóm theo năm nhóm: cảnh báo gửi đến ai và áp dụng cho loại giao dịch nào (phạm vi & người dùng); ngưỡng cảnh báo số tiền và khung thời gian đếm giao dịch (tiền & số liệu); trạng thái vòng đời cảnh báo và từ chối giao dịch ngay hay chỉ cảnh báo (trạng thái & lỗi); lưu dữ liệu ra quyết định và quy trình kháng cáo của khách (quy định & audit); thời gian xử lý dưới bao nhiêu giây và quy tắc cố định hay machine learning (phi chức năng). Tôi khuyên kết hợp nhiều quy tắc (số tiền, tần suất, thiết bị, vị trí) và lưu bằng chứng quyết định để kiểm toán. Can you clarify: who receives the fraud alert — customer, risk team, or both? What is the required detection latency in seconds? Is transaction blocking automatic or manual?"

> Senior tip: Cảnh báo quá nhiều khiến khách bỏ qua (alert fatigue). Hãy bắt đầu với ít quy tắc rõ ràng, đo false positive rate, rồi mới mở rộng. Luôn lưu đủ bằng chứng (IP, thiết bị, thời gian) để giải thích với khách và cơ quan quản lý khi cần.

  `,
},
{
  id: 'banking-071',
  topic: 'banking',
  level: 'senior',
  q: 'PO nói: "Ngân hàng cần xuất sao kê và báo cáo gửi cho cơ quan quản lý (ví dụ Ngân hàng Nhà nước) định kỳ." Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?',
  a: `**Tóm tắt:** Xuất sao kê và báo cáo quản lý là quá trình tổng hợp dữ liệu giao dịch, số dư, và các chỉ số rủi ro thành file/pdf gửi cho khách hàng hoặc cơ quan quản lý định kỳ (hàng ngày, hàng tháng, hàng quý). Trước khi thiết kế, dev cần làm rõ 10 câu dưới đây, nhóm theo 5 nhóm: phạm vi & người dùng, tiền & số liệu, trạng thái & lỗi, quy định & audit, phi chức năng. Mỗi câu đi kèm lý do hỏi và rủi ro nếu không hỏi.
### Các câu nên hỏi lại

**Nhóm 1: Phạm vi & người dùng**
1. Báo cáo gửi cho ai (khách hàng qua email/app, hay cơ quan quản lý qua cổng thông tin)?
   - **Vì sao hỏi:** sao kê khách hàng cần định dạng thân thiện, báo cáo cơ quan quản lý cần định dạng kỹ thuậtStrict (XML, CSV theo mẫu quy định).
2. Báo cáo là định kỳ (hàng ngày, tháng, quý) hay theo yêu cầu (ad-hoc)?
   - **Vì sao hỏi:** định kỳ có thể tự động hóa bằng job cron, ad-hoc cần giao diện cho người dùng chọn khoảng thời gian và xuất ngay.

**Nhóm 2: Tiền & số liệu**
3. Số tiền trong báo cáo làm tròn đến đồng hay có phần thập phân?
   - **Vì sao hỏi:** VND không có xu/hào, làm tròn về đồng. Báo cáo sai 1 đồng có thể bị cơ quan quản lý từ chối.
4. Khoảng thời gian báo cáo tính theo ngày giao dịch hay ngày ghi sổ (value date), và múi giờ nào?
   - **Vì sao hỏi:** giao dịch vào 23:59 ngày 30 có thể ghi sổ ngày 1 tháng sau. Sai múi giờ hoặc ngày tính sẽ làm báo cáo thiếu hoặc trùng giao dịch.

**Nhóm 3: Trạng thái & lỗi**
5. Mỗi lần xuất báo cáo có trạng thái gì (pending, generated, sent, failed), và xử lý lại khi thất bại như thế nào?
   - **Vì sao hỏi:** nếu xuất báo cáo thất bại (mạng lỗi, cổng thông tin bảo trì), cần retry tự động và thông báo người quản trị, không để báo cáo bị bỏ lỡ.
6. Nếu dữ liệu sau khi xuất bị sửa (ví dụ điều chỉnh sai sót), cần xuất lại báo cáo hay xuất báo cáo bổ sung (supplementary)?
   - **Vì sao hỏi:** cơ quan quản lý thường không chấp nhận sửa báo cáo đã gửi, cần xuất bản bổ sung kèm lý do.

**Nhóm 4: Quy định & audit**
7. Định dạng báo cáo theo mẫu nào của cơ quan quản lý (CSV, XML, PDF có chữ ký số), và có chữ ký số không?
   - **Vì sao hỏi:** mỗi cơ quan quản lý có mẫu báo cáo bắt buộc. Sai định dạng → báo cáo bị từ chối, ngân hàng bị phạt.
8. Lưu báo cáo đã gửi bao lâu, và ai được tải về xem lại?
   - **Vì sao hỏi:** pháp luật yêu cầu lưu báo cáo gửi cơ quan quản lý đủ thời gian (ví dụ 5–10 năm) để tra cứu sau này.

**Nhóm 5: Phi chức năng**
9. Báo cáo có bao nhiêu hàng giao dịch (ví dụ 10.000 hàng cho một khách hàng cao cấp), và thời gian xuất chấp nhận được là bao nhiêu?
   - **Vì sao hỏi:** báo cáo lớn cần xử lý nền (background job), không thể xuất trực tiếp trên giao diện làm người dùng chờ hàng phút.
10. Nếu cổng thông tin của cơ quan quản lý bảo trì, hệ thống làm thế nào (lưu lại và gửi sau, hay báo lỗi ngay)?
    - **Vì sao hỏi:** cần kế hoạch dự phòng để báo cáo định kỳ không bị bỏ lỡ khi bên kia đang bảo trì.
### Nếu không hỏi thì chuyện gì xảy ra
Ngân hàng xuất báo cáo hàng tháng cho Ngân hàng Nhà nước bằng file CSV tự định dạng. Sau khi gửi, cơ quan quản lý trả lời báo cáo bị từ chối vì sai mẫu định dạng bắt buộc (thiếu cột mã giao dịch, sai định dạng ngày tháng). Đội dev phải viết lại mẫu xuất, lấy lại dữ liệu tháng trước, và gửi lại — trong lúc đó ngân hàng bị cảnh báo vi phạm quy định báo cáo. Nguyên nhân gốc: không xác định rõ định dạng và mẫu báo cáo của cơ quan quản lý trước khi thiết kế, và không kiểm tra thử với dữ liệu thật trước khi đưa vào sản xuất.
### Từ câu trả lời tới thiết kế
Bảng dưới cho thấy câu trả lời khác nhau dẫn tới thiết kế khác nhau:

| Câu trả lời PO | Thiết kế A (đơn giản) | Thiết kế B (doanh nghiệp) |
|---|---|---|
| Báo cáo cho khách hàng, PDF | Xuất PDF trực tiếp trên giao diện | Job nền xuất PDF, gửi email, lưu lịch sử |
| Báo cáo cho cơ quan quản lý, CSV mẫu cố định | CSV tự định dạng | CSV theo mẫu bắt buộc, chữ ký số, lưu 10 năm |
### Trả lời mẫu khi phỏng vấn
"Khi PO yêu cầu xuất sao kê và báo cáo gửi cơ quan quản lý, tôi sẽ làm rõ 10 câu nhóm theo năm nhóm: báo cáo gửi cho ai và định kỳ hay theo yêu cầu (phạm vi & người dùng); làm tròn tiền như thế nào và tính theo ngày giao dịch hay ghi sổ, múi giờ nào (tiền & số liệu); trạng thái xuất báo cáo và xử lý lại khi thất bại, xuất lại hay bổ sung khi dữ liệu thay đổi (trạng thái & lỗi); định dạng theo mẫu cơ quan quản lý có chữ ký số không, lưu báo cáo bao lâu (quy định & audit); số hàng giao dịch và thời gian xuất chấp nhận được, kế hoạch dự phòng khi cổng thông tin bảo trì (phi chức năng). Tôi khuyên dùng job nền cho báo cáo lớn, lưu đủ thời gian theo pháp luật, và kiểm tra mẫu định dạng trước khi gửi. Can you clarify: what format does the regulator require (CSV, XML, PDF), and is a digital signature needed? What is the retention period for submitted reports? Is reporting periodic or ad-hoc?"

> Senior tip: Báo cáo gửi cơ quan quản lý là tài liệu pháp lý. Không bao giờ sửa báo cáo đã gửi — nếu sai, phải xuất bản bổ sung kèm lý do và lưu giữ cả hai bản để kiểm toán sau này.

  `,
},
{
  id: 'banking-072',
  topic: 'banking',
  level: 'mid',
  q: 'App mobile hiển thị số dư: đọc thẳng core banking mỗi lần hay dùng cache/CQRS? Độ trễ, tải lên core, độ tươi dữ liệu, và khi nào bắt buộc đọc core?',
  a: `**Tóm tắt:** App mobile có hai cách hiển thị số dư: (1) **đọc thẳng core** — gọi API tra cứu số dư real-time, độ trễ ~100–300 ms, tải lên core cao, dữ liệu tươi nhất; (2) **cache/CQRS** — đọc từ bản sao (read model) đã đồng bộ, độ trễ ~10–50 ms, giảm tải core 90%, dữ liệu có thể chậm vài giây. Chiến lược tốt là **kết hợp**: màn hình chính dùng cache để nhanh, màn hình chi tiết/giao dịch quan trọng đọc core để chính xác.
### Hai kiến trúc so sánh

 | Tiêu chí | Đọc thẳng Core (Synchronous) | Cache / CQRS (Read Model) |
 |---|---|---|
 | Độ trễ (p99) | 100–300 ms | 10–50 ms |
 | Tải lên Core | Cao (mỗi lần mở app) | Thấp (chỉ đồng bộ khi có thay đổi) |
 | Độ tươi dữ liệu | Thực sự real-time | Eventual consistency (chậm vài giây–phút) |
 | Độ phức tạp | Đơn giản | Cần xây dựng projection, xử lý sự kiện |
 | Phù hợp | Tra cứu trước giao dịch, KYC | Dashboard, danh sách tài khoản, lịch sử |

 ~~~seq
 title: Hien thi so du bang Cache/CQRS
 actors: Khach | App | Cache/ReadModel | Core | EventBus
 Khach -> App: mo man hinh chu
 App -> Cache/ReadModel: GET /balance (cached)
 Cache/ReadModel --> App: so du 50.000.000 VND (cap nhat 2s truoc)
 App --> Khach: hien thi 50.000.000 VND
 note Core..EventBus: giao dich moi -> phat event BalanceChanged
 EventBus -> Cache/ReadModel: cap nhat so du moi
 ~~~
### Khi nào BẮT BUỘC đọc Core
 1. **Trước khi trừ tiền**: xác thực số dư khả dụng (available balance) trước khi cho phép chuyển tiền, rút tiền, thanh toán.
 2. **KYC / Mở tài khoản / Tăng hạn mức**: cần số dư chính xác nhất để quyết định nghiệp vụ.
 3. **Đối soát / Báo cáo**: số liệu phải khớp với sổ cái core.
 4. **Giao dịch giá trị lớn**: vượt ngưỡng rủi ro (ví dụ > 100 triệu) cần xác thực chặt chẽ.
### Lỗi hay gặp
 - Dùng cache cho mọi nơi, kể cả trước khi trừ tiền → race condition: cache báo đủ tiền nhưng core thực tế đã hết do giao dịch khác mới xử lý xong.
 - Không có TTL hoặc invalidation strategy → cache "bám" dữ liệu cũ hàng giờ, khách khiếu nại số dư sai.
 - Đồng bộ cache thiếu event (ví dụ phí tự động, lãi tính đêm) → số dư lệch không báo động.
### Ví dụ đời thực

 Một ngân hàng số 2 triệu user. App dùng cache cho màn hình chính (độ trễ 20 ms), nhưng màn hình "Chuyển tiền" đọc core (độ trễ 150 ms). Vào giờ cao điểm (12h trưa), 50.000 user mở app cùng lúc. Nếu đọc thẳng core: 50k request/s → core quá tải, p99 lên 2 giây, 5% request timeout. Với cache: chỉ 500 request/s ra core (đồng bộ event), p99 ổn định 30 ms. Tuy nhiên một lần event bus lỗi 5 phút, cache không cập nhật, 120 khách khiếu nại "số dư hiển thị 50 triệu nhưng thực tế chỉ 45 triệu vì vừa chuyển tiền 5 phút trước". Cách xử lý: thêm health check event bus, nếu lag > 30s tự động chuyển sang đọc core cho màn hình chính, và cảnh báo ops. Kết quả: sau khi fix, 0 khiếu nại do cache lag, core p99 ổn định < 100 ms ở giờ cao điểm.
### Trả lời mẫu khi phỏng vấn

 "App mobile của tôi dùng chiến lược lai: màn hình chính (dashboard) đọc từ read model (CQRS cache) để độ trễ < 50 ms, giảm tải core 90%; màn hình thực hiện giao dịch (chuyển tiền, rút tiền) đọc thẳng core để lấy số dư khả dụng chính xác nhất, tránh race condition. Read model được cập nhật qua event-driven (Kafka) từ core, p99 lag < 2 giây. Khi event bus có sự cố (lag > 30s), health check tự động fallback đọc core cho cả dashboard. Bắt buộc đọc core khi: trước khi trừ tiền, KYC, giao dịch lớn, đối soát. Thực tế: một ngân hàng 2 triệu user, giờ cao điểm core p99 từ 2 giây xuống 30 ms nhờ cache, và 0 khiếu nại số dư sai sau khi thêm fallback."

 > Senior tip: Đừng chọn "hoặc cache hoặc core" — hãy dùng **cả hai theo ngữ cảnh**. Cache cho đọc nhiều, ít thay đổi; core cho ghi và đọc quan trọng. Luôn có health check và fallback tự động khi cache lag.

 > Cụm từ: CQRS (Command Query Responsibility Segregation) là tách mô hình ghi (command) và mô hình đọc (query). Read model là bản sao dữ liệu tối ưu cho truy vấn. Eventual consistency là dữ liệu sẽ nhất quán sau một khoảng thời gian chứ không ngay lập tức.

   `,
  follow: [
    'Làm sao đảm bảo read model cập nhật đúng khi core có nhiều loại event (giao dịch, phí, lãi, điều chỉnh)?',
    'Nếu read model lag 10 giây, khách vừa chuyển tiền xong mà màn hình dashboard vẫn thấy số dư cũ, xử lý UX thế nào?',
    'Có nên dùng Redis làm cache layer trước read model không, và khi nào?'
  ],
  tags: ['core banking', 'cache', 'CQRS', 'read model', 'mobile app', 'balance']
},
{
  id: 'banking-073',
  topic: 'banking',
  level: 'senior',
  q: 'Gọi core chuyển tiền bị timeout 30s: bạn xử lý thế nào để không trừ tiền 2 lần và khách biết trạng thái?',
  a: `**Tóm tắt:** Timeout 30s khi gọi core **không có nghĩa là thất bại** — chỉ là "chưa biết kết quả". Ba khả năng: core chưa nhận lệnh, core đã xử lý thành công nhưng phản hồi bị mất, hoặc core đang xử lý. Thiết kế đúng: chuyển sang trạng thái **PENDING_INQUIRY**, **tạm giữ tiền (hold)**, **không tự động retry lệnh mới**, **không tự động hoàn tiền**. Tra soát chủ động bằng mã tham chiếu duy nhất (inquiry), cập nhật trạng thái theo kết quả, chỉ hoàn tiền khi có xác nhận thất bại hoặc quá hạn tra soát.
### Tại sao timeout nguy hiểm
 Khi gửi lệnh chuyển tiền và không nhận phản hồi trong 30s, nếu coi là thất bại và hoàn tiền (hoặc cho khách gửi lại), trường hợp "core đã thành công nhưng phản hồi mất" sẽ khiến: người nhận nhận tiền 2 lần, hoặc người gửi bị trừ 2 lần. Đây là lỗi nghiêm trọng nhất thanh toán.
### Máy trạng thái (State Machine) giao dịch

 ~~~text
 [INIT] --gui lenh--> [SENT]
 [SENT] --nhan SUCCESS--> [SUCCESS] (ket thuc)
 [SENT] --nhan FAILED--> [FAILED] -> hoan tien hold
 [SENT] --timeout/loi mang--> [PENDING_INQUIRY] --tien bi HOLD--
 [PENDING_INQUIRY] --inquiry: SUCCESS--> [SUCCESS] -> chot tru tien
 [PENDING_INQUIRY] --inquiry: FAILED--> [FAILED] -> hoan tien hold
 [PENDING_INQUIRY] --inquiry: UNKNOWN & qua han--> [MANUAL_INVESTIGATION] -> doi soat/tra soat thu cong
 ~~~

 **PENDING_INQUIRY**: trạng thái "đang treo, chưa kết luận". Tiền người gửi bị **hold** (tạm giữ khỏi available balance, chưa trừ ledger balance) để không cho chi tiêu trùng.
### Mã tham chiếu duy nhất (Partner Reference) - chìa khóa tra soát
 - Mỗi lệnh sinh **idempotency key** (UUID) do ngân hàng gửi tạo, gắn suốt vòng đời
 - Gửi kèm sang core (trong payload API)
 - Lưu trong DB với unique constraint: {{(idempotency_key, business_date)}}
 - Dùng để: inquiry, đối soát, idempotency (retry cùng key -> trả kết quả cũ)
### Tra soát chủ động (Inquiry) - không chờ đợi

 ~~~text
 Lich retry inquiry (exponential backoff):
 Lan 1: sau 30 giay
 Lan 2: sau 2 phut
 Lan 3: sau 10 phut
 Lan 4: sau 1 gio
 Lan 5: sau 4 gio
 Lan 6: sau 12 gio
 Qua 24 gio chua ro -> leo thang MANUAL_INVESTIGATION
 ~~~

 Mỗi lần inquiry dùng **cùng idempotency key**. Core phải hỗ trợ idempotent: nhận lại cùng key -> trả kết quả cũ, không xử lý trùng.

 ~~~seq
 title: Chuyen tien timeout va tra soat
 actors: AppKhach | PaymentSvc | CoreBank
 AppKhach -> PaymentSvc: chuyen 5.000.000 cho B (idem_key=K1)
 PaymentSvc -> PaymentSvc: tao tx_id, hold tien A, trang thai SENT
 PaymentSvc -> CoreBank: gui lenh chuyen (idem_key=K1)
 CoreBank --> PaymentSvc: timeout mat phan hoi (30s)
 PaymentSvc -> PaymentSvc: chuyen trang thai PENDING_INQUIRY
 PaymentSvc --> AppKhach: thong bao "Dang xu ly, vui long cho"
 PaymentSvc -> CoreBank: inquiry(K1) - tra soat
 CoreBank --> PaymentSvc: ket qua SUCCESS
 PaymentSvc -> PaymentSvc: cap nhat SUCCESS, chot tru tien A
 PaymentSvc --> AppKhach: thong bao thanh cong
 ~~~
### Hoàn tiền (Reversal) và Bù đắp (Compensation)
 **Chỉ hoàn tiền khi có xác nhận FAILED** từ core, hoặc sau quy trình MANUAL_INVESTIGATION kết luận thất bại.

 Quy trình reversal:
 1. Tạo bút toán đảo ngược (reversal entry) trên ledger: Credit tài khoản nguồn, Debit tài khoản trung gian
 2. Ghi rõ tham chiếu giao dịch gốc (original_tx_id) để audit trail
 3. Giải phóng hold (nếu còn), cập nhật available balance
 4. Thông báo khách: "Giao dịch thất bại, tiền đã hoàn về tài khoản"
### Xử lý PENDING_INQUIRY treo quá lâu
 - Job chạy mỗi 15 phút: quét PENDING_INQUIRY > 48h chưa có inquiry thành công
 - Gửi cảnh báo Slack/Email cho team vận hành
 - Vận hành liên hệ core banking qua out-of-band (email/điện thoại)
 - Nếu core xác nhận FAILED -> chạy reversal tự động
 - Nếu core không phản hồi sau 7 ngày -> leo thang cấp quản lý, reversal theo chính sách rủi ro
### Code: State machine & Inquiry scheduler

 ~~~java
 enum TxStatus { INIT, SENT, PENDING_INQUIRY, SUCCESS, FAILED, MANUAL_INVESTIGATION, REVERSAL_PENDING, REVERSED }

 @Transactional
 void handleTimeout(String idempotencyKey) {
     var tx = repo.findByIdempotencyKey(idempotencyKey).orElseThrow();
     if (tx.status() == SENT) {
         tx.transitionTo(PENDING_INQUIRY);
         repo.save(tx);
         inquiryScheduler.scheduleFirstInquiry(idempotencyKey); // 30s sau
     }
 }

 @Scheduled(fixedDelay = 60_000) // moi phut
 void processInquiryQueue() {
     var due = repo.findDueInquiry(Instant.now()); // next_inquiry_at <= now
     for (var tx : due) {
         try {
             var resp = coreClient.inquiry(tx.idempotencyKey());
             if (resp.isSuccess()) {
                 tx.transitionTo(SUCCESS);
                 ledgerService.postDebit(tx.sourceAccount(), tx.amount()); // chot tru
             } else if (resp.isFailed()) {
                 tx.transitionTo(FAILED);
                 ledgerService.releaseHold(tx.sourceAccount(), tx.amount()); // hoan hold
             } else { // UNKNOWN
                 tx.scheduleNextInquiry(); // backoff
             }
             repo.save(tx);
         } catch (Exception e) {
             log.error("Inquiry failed for {}", tx.idempotencyKey(), e);
             tx.scheduleNextInquiry(); // retry inquiry sau backoff
             repo.save(tx);
         }
     }
 }
 ~~~
### Lỗi hay gặp
 - Coi timeout = FAILED -> hoàn tiền ngay -> tiền đi 2 lần nếu core đã thành công
 - Cho khách bấm "Thử lại" tạo giao dịch mới khi đang PENDING_INQUIRY -> trùng tiền
 - Không lưu idempotency key -> không inquiry được, không đối soát được
 - Tự động reversal sau N phút timeout mà chưa inquiry -> hoàn nhầm
 - PENDING_INQUIRY không có TTL/giới hạn -> tiền bị hold vĩnh viễn
 - Inquiry không idempotent -> core xử lý trùng khi retry
### Ví dụ đời thực

 Một ngân hàng số xử lý chuyển khoản nội bộ qua core. Ngày cao điểm lương, traffic tăng 3x. Khách chuyển 5 triệu lúc 21:00, timeout sau 30s. Hệ thống chuyển PENDING_INQUIRY, hold tiền, app hiện "Đang xử lý". Job inquiry chạy: lần 2 (sau 2 phút) core trả SUCCESS -> cập nhật SUCCESS, trừ tiền, thông báo khách. Giao dịch khác inquiry FAILED sau 24h -> reversal tự động, tiền hoàn về. 94% timeout chốt tự động trong 2h, 0 trường hợp trừ 2 lần.
### Trả lời mẫu khi phỏng vấn

 "Timeout không phải thất bại, chỉ là chưa biết kết quả. Tôi thiết kế máy trạng thái: SENT -> PENDING_INQUIRY (hold tiền) khi timeout. Không tự động retry lệnh mới, không tự động hoàn tiền. Tra soát chủ động bằng idempotency key với backoff 30s, 2p, 10p, 1h... Inquiry SUCCESS -> chốt trừ tiền, FAILED -> hoàn hold. Quá 24h không rõ -> MANUAL_INVESTIGATION, vận hành liên hệ core. Reversal chỉ khi có xác nhận FAILED, ghi bút toán đảo có original_tx_id. Thực tế: 94% timeout chốt tự động 2h, không còn trừ tiền 2 lần. Nguyên tắc: tiền thật an toàn hơn trải nghiệm nhanh."

 > Senior tip: Ba chốt: (1) **Timeout ≠ Failed** - không bao giờ tự động hoàn/retry khi timeout. (2) **Idempotency key xuyên suốt** - idempotency key = inquiry key = reconciliation key. (3) **Hold tiền, không trừ ledger** - chỉ chốt khi có xác nhận. Hỏi interviewer: "Hệ thống của anh xử lý timeout như thế nào? Có bao giờ tự động hoàn tiền khi timeout không?"

 > Cụm từ: Hold (tạm giữ) là khóa available balance, chưa trừ ledger. Inquiry (tra soát) là hỏi core trạng thái giao dịch bằng idempotency key. Reversal (đảo ngược) là bút toán hoàn tiền append-only.

   `,
  follow: [
    'Idempotency được đảm bảo ở tầng nào: client, gateway, service, core?',
    'Khi core xác nhận FAILED nhưng bạn đã chốt SUCCESS (do inquiry trước báo SUCCESS sai), xử lý thế nào?',
    'PENDING_INQUIRY treo 7 ngày, bạn reversal tự động hay cần phê duyệt?'
  ],
  tags: ['core banking', 'timeout', 'pending', 'inquiry', 'reversal', 'hold', 'idempotency']
},
{
  id: 'banking-074',
  topic: 'banking',
  level: 'senior',
  q: 'Trong lúc core chạy COB (khoá sổ cuối ngày), kênh digital vẫn phải nhận giao dịch: thiết kế store-and-forward, value date, thông báo khách.',
  a: `**Tóm tắt:** COB (Cut-Over Batch / End-of-Day batch) là lúc core khoá sổ, chạy batch tính lãi, phí, đối soát, chuyển ngày nghiệp vụ — thường kéo dài 2–6 tiếng vào ban đêm. Trong cửa sổ này core **không nhận lệnh mới**. Kênh digital (app, internet banking) phải vẫn cho khách tạo giao dịch: dùng **store-and-forward** (lưu yêu cầu, chuyển khi core lên), gán **value date = ngày nghiệp vụ tiếp theo**, và **thông báo khách** rõ "giao dịch sẽ được xử lý ngày mai".
### Vấn đề: Core down, kênh digital up

 | Thời điểm | Trạng thái Core | Yêu cầu kênh Digital |
 |---|---|---|
 | Trước COB (16h–23h) | Bình thường | Gửi thẳng core, real-time |
 | **Trong COB (23h–04h)** | **Khoá, không nhận lệnh** | **Store-and-forward, hold tiền, value date = T+1** |
 | Sau COB (04h+) | Mở cửa, ngày mới | Gửi thẳng core, real-time |
### Store-and-Forward là gì
 Thay vì báo lỗi "core đang bảo trì", hệ thống:
 1. **Store**: nhận yêu cầu từ app, validate nghiệp vụ (hạn mục, số dư available), lưu vào hàng đợi DB (outbox table) kèm idempotency key, trạng thái PENDING_COB.
 2. **Hold**: tạm khóa available balance (không trừ ledger), khách thấy số dư khả dụng giảm, giao dịch hiển thị "Đang chờ xử lý".
 3. **Forward**: khi core báo sẵn sàng (health check pass), worker đợi đọc hàng đợi, gửi lần lượt đến core theo FIFO, mỗi giao dịch một transaction.
 4. **Complete**: core trả SUCCESS/FAILED -> cập nhật trạng thái, giải phóng hold hoặc chốt trừ ledger, push thông báo cho khách.

 ~~~seq
 title: Store-and-forward khi Core COB
 actors: Khach | App | DigitalGateway | OutboxDB | Core
 Khach -> App: chuyen 10 trieu (23:30, Core dang COB)
 App -> DigitalGateway: POST /transfer (idem=K1)
 DigitalGateway -> DigitalGateway: validate, hold tien, tao OutboxRecord
 DigitalGateway -> OutboxDB: INSERT (idem=K1, status=PENDING_COB, payload=...)
 DigitalGateway --> App: 202 Accepted "Da nhan, se xu ly sau COB"
 App --> Khach: "Giao dich da duoc chap nhan, se xu ly vao ngay mai"
 note DigitalGateway..Core: 04:00 Core bao san sang
 DigitalGateway -> OutboxDB: SELECT ... WHERE status=PENDING_COB ORDER BY created_at
 DigitalGateway -> CoreBank: gui tung lenh theo thu tu
 CoreBank --> DigitalGateway: SUCCESS/FAILED
 DigitalGateway -> OutboxDB: UPDATE status=COMPLETED/FAILED
 DigitalGateway -> App: push thong bao ket qua
 ~~~
### Value Date (Ngày giá trị) khi COB
 - Giao dịch trong COB: **value date = ngày nghiệp vụ tiếp theo (T+1)**.
 - Ví dụ: COB đêm 30/11 (chuyển sang ngày 1/12). Giao dịch 23:30 ngày 30 -> value date = 1/12.
 - Lãi bắt đầu tính từ value date. Số dư ledger chỉ thay đổi từ value date.
 - App hiển thị: "Ngày giá trị: 01/12/2024" để khách không nhầm lẫn.
### Thông báo khách
 1. **Trước COB** (T-1): SMS/Email/Push "Core banking sẽ bảo trì từ 23:00–04:00. Giao dịch trong lúc này sẽ được xử lý ngày mai. Số dư khả dụng tạm khóa."
 2. **Trong COB**: App banner "Hệ thống đang bảo trì cuối ngày. Giao dịch của bạn đã được lưu và sẽ xử lý sáng mai."
 3. **Kết quả**: Push/SMS "Giao dịch 10 triệu đã thành công / thất bại. Xem chi tiết."
 4. **Không bao giờ** để khách đoán: có giao dịch đang chờ hay không.
### Lỗi hay gặp
 - Không hold tiền -> khách thấy số dư đủ, tạo nhiều giao dịch vượt hạn mức thực tế.
 - Tự động retry khi core chưa sẵn sàng -> race condition, duplicate khi core lên.
 - Không có idempotency key trong outbox -> gửi trùng khi worker crash giữa chừng.
 - Value date sai (gán hôm nay thay vì ngày mai) -> lãi sai, đối soát lỗi.
 - Không thông báo khách -> khiếu nại "tiền mất", tổng đài quá tải.
### Ví dụ đời thực

 Một ngân hàng số COB từ 23:00–03:00. Trước đây: app báo lỗi "Hệ thống bảo trì" -> khách không tạo được giao dịch, tổng đài nhận 500 cuộc gọi/đêm. Triển khai store-and-forward: outbox table 50k record/đêm, worker gửi 1k TPS khi core lên. Hold available balance, value date = T+1. Thông báo trước qua SMS + banner app. Kết quả: 0 cuộc gọi tổng đài về bảo trì, 99.8% giao dịch COB thành công, 0.2% failed do hết hạn mức (được phát hiện khi forward). Khách hài lòng vì "tiền đã được lưu an toàn".
### Trả lời mẫu khi phỏng vấn

 "Khi core chạy COB (khoá sổ 23h–04h), kênh digital không được từ chối khách. Tôi dùng store-and-forward: nhận yêu cầu, validate, hold available balance, lưu outbox record (idempotency key, status PENDING_COB), trả 202 Accepted. App hiện 'Đã nhận, xử lý sau COB'. Khi core health check pass, worker forward FIFO, chốt ledger, push kết quả. Value date = ngày nghiệp vụ tiếp theo (T+1), lãi tính từ ngày đó. Thông báo 3 lúc: trước COB (SMS/banner), trong COB (trạng thái chờ), sau COB (kết quả). Thực tế: một ngân hàng số áp dụng, tổng đài 0 cuộc gọi về bảo trì, 99.8% giao dịch COB thành công."

 > Senior tip: Store-and-forward **không phải queue đơn giản** — cần hold tiền, idempotency, value date logic, health check core, và forward có retry/backoff. Luôn test kịch bản: core lên chậm hơn dự kiến, worker crash giữa chừng, giao dịch failed khi forward.

 > Cụm từ: COB (Cut-Over Batch / End-of-Day) là batch cuối ngày khoá sổ, tính lãi, phí, chuyển ngày nghiệp vụ. Store-and-forward = lưu yêu cầu, chuyển khi hệ thống đích sẵn sàng. Value date = ngày số dư thực sự thay đổi và bắt đầu tính lãi. Outbox pattern = ghi event cùng transaction với dữ liệu nghiệp vụ.

   `,
  follow: [
    'Nếu core COB kéo dài hơn dự kiến (ví dụ 06h sáng mới xong), outbox worker xử lý thế nào?',
    'Khi forward, giao dịch failed do hết hạn mức (hold đã hết hạn), làm sao hoàn tiền cho khách?',
    'Có nên cho khách hủy giao dịch đang PENDING_COB không, và quy trình thế nào?'
  ],
  tags: ['COB', 'store-and-forward', 'core banking', 'outbox', 'value date', 'digital channel']
},
{
  id: 'banking-075',
  topic: 'banking',
  level: 'senior',
  q: 'Đối soát giữa hệ thống kênh (internet banking/ví) và core cuối ngày: lệch thì xử lý ra sao, ai sửa, audit.',
  a: `**Tóm tắt:** Hệ thống kênh (internet banking, ví điện tử) và core banking là hai hệ thống riêng, mỗi nơi giữ một bản sao số dư. Cuối ngày (EOD) phải **đối soát (reconciliation)**: so sánh từng tài khoản, tìm **lệch (break)**, phân loại, và xử lý. Quy tắc vàng: **chỉ điều chỉnh bằng bút toán mới (append-only), người sửa khác người tạo (maker-checker), audit trail đầy đủ**.
### Tại sao cần đối soát kênh – Core
 Kênh digital nhận giao dịch từ khách, gọi core trừ/cộng tiền, nhưng có thể:
 - Core timeout -> kênh đã trừ tiền khách (hold) nhưng core chưa chốt.
 - Kênh crash sau khi core thành công -> core đã trừ nhưng kênh không cập nhật trạng thái.
 - Phí, lãi, điều chỉnh chỉ ghi ở core -> kênh không biết.
 - Race condition: hai kênh cùng trừ một tài khoản -> core chốt một, kênh ghi hai.
 Nếu không đối soát, lệch tích lũy thành tiền thật mất hoặc sai số dư lớn.
### Quy trình đối soát EOD (End-of-Day)

 **1. Thu thập dữ liệu**
 - Kênh: export danh sách tài khoản + available_balance + ledger_balance (theo business_date T)
 - Core: export danh sách tài khoản + available_balance + ledger_balance (theo business_date T)
 - Cả hai cùng format: {{account_id, currency, available_balance, ledger_balance, updated_at}}

 **2. So khớp (Matching) — khóa là account_id + currency**

 ~~~sql
 SELECT 
     COALESCE(c.account_id, b.account_id) AS account_id,
     COALESCE(c.currency, b.currency) AS currency,
     c.available_balance AS channel_avail,
     b.available_balance AS core_avail,
     c.ledger_balance AS channel_ledger,
     b.ledger_balance AS core_ledger,
     (c.available_balance - b.available_balance) AS diff_avail,
     (c.ledger_balance - b.ledger_balance) AS diff_ledger
 FROM channel_balances c
 FULL OUTER JOIN core_balances b 
   ON c.account_id = b.account_id AND c.currency = b.currency;
 ~~~

 **3. Phân loại lệch (Break classification)**

 | Loại break | Mô tả | Mức độ | Xử lý |
 |---|---|---|---|
 | CHANNEL_ONLY | Kênh có, Core không có | Nghiêm trọng | Tra soát log kênh, xem core có bị timeout không |
 | CORE_ONLY | Core có, Kênh không có | Trung bình | Kênh bổ sung bản ghi, hoặc core reversal nếu là lỗi |
 | AVAIL_MISMATCH | Cùng tài khoản, available_balance khác nhau | Phổ biến | Thường do hold/pending chưa đồng bộ |
 | LEDGER_MISMATCH | Cùng tài khoản, ledger_balance khác nhau | **Rất nghiêm trọng** | Tiền thực sự mất/ghi nhầm, tra soát ngay |

 **4. Xử lý tự động (Auto-resolution) — chỉ khi có quy tắc rõ**
 - AVAIL_MISMATCH do hold pending: core đã chốt, kênh vẫn hold -> giải phóng hold kênh, đồng bộ available.
 - CHANNEL_ONLY do kênh tạo tài khoản mới chưa push core -> push ngay, core tạo mirror.
 - Các break khác -> đẩy queue manual.

 **5. Hàng đợi thủ công (Manual queue) — Maker-Checker bắt buộc**

 ~~~text
 Trạng thái queue: NEW -> INVESTIGATING -> PROPOSED -> APPROVED -> APPLIED / REJECTED

 Maker (nhân viên tra soát):
   - Xem bằng chứng: log kênh, log core, timestamp, idempotency key
   - Đề xuất: bút toán điều chỉnh (append-only), lý do, tham chiếu

 Checker (kiểm soát viên, KHÁC người Maker):
   - Duyệt hoặc từ chối
   - Bắt buộc cho LEDGER_MISMATCH và break > 100 triệu

 Hệ thống:
   - Thực hiện bút toán điều chỉnh (INSERT ledger entry mới, KHÔNG UPDATE dòng cũ)
   - Ghi audit trail: ai, lúc nào, giá trị trước/sau, correlation_id, IP
 ~~~
### Audit trail yêu cầu
 Mọi điều chỉnh sau đối soát phải có:
 - **Correlation_id** gắn với break case
 - **Before/After JSON**: số dư trước, sau, tài khoản, loại bút toán
 - **Actor + Role**: MAKER / CHECKER / SYSTEM
 - **Timestamp** chính xác đến mili-giây
 - **IP address** của người thao tác
 - **Append-only**: lưu WORM, không sửa/xóa
### Lỗi hay gặp
 - Chỉ so **tổng số dư toàn hệ thống** -> tổng khớp nhưng từng tài khoản lệch bù trừ nhau (500tr thiếu A, 500tr thừa B).
 - So khớp theo **số tiền + thời gian** thay vì account_id -> ghép nhầm tài khoản cùng số dư.
 - Sửa trực tiếp số dư (UPDATE balance) thay vì ghi bút toán điều chỉnh -> mất audit trail.
 - Maker = Checker (một người tự duyệt) -> rủi ro gian lận.
 - Không theo dõi **tuổi break** (số ngày chưa xử lý) -> break tồn đọng hàng tháng.
### Ví dụ đời thực

 Một ngân hàng số 500k tài khoản. EOD phát hiện 23 break: 15 AVAIL_MISMATCH (hold pending), 5 CHANNEL_ONLY (tài khoản mới), 3 LEDGER_MISMATCH (core reversal fee không sync kênh). Auto-resolution xử lý 20 break theo rule. 3 LEDGER_MISMARCH vào queue: maker tra soát thấy core đã trừ phí 50k nhưng kênh không ghi -> đề xuất ghi phí vào kênh. Checker duyệt, hệ thống INSERT ledger entryFee (CREDIT fee_income, DEBIT account), audit trail đầy đủ. Kết quả: EOD khớp 100%, 0 break tồn đọng > 1 ngày.
### Trả lời mẫu khi phỏng vấn

 "Đối soát kênh–core EOD của tôi: export balance cả hai theo account_id+currency, FULL OUTER JOIN so khớp, phân loại break (CHANNEL_ONLY, CORE_ONLY, AVAIL_MISMATCH, LEDGER_MISMATCH). Auto-resolution cho hold pending và tài khoản mới. Phần còn lại vào queue maker-checker: maker đề xuất bút toán điều chỉnh append-only, checker (người khác) duyệt, hệ thống INSERT ledger entry mới, audit trail đầy đủ (correlation_id, before/after, actor, IP). Không bao giờ UPDATE balance trực tiếp. Thực tế: 500k tài khoản, 23 break/ngày, auto-resolve 87%, 0 break tồn > 1 ngày, audit trail giúp phát hiện 1 case nhân viên cố ý sửa sai số dư."

 > Senior tip: Ba chốt: (1) **So khớp theo account_id, không phải tổng** — tổng khớp che được lệch bù trừ. (2) **Chỉ điều chỉnh append-only, maker-checker bắt buộc** — không ai được tự sửa số dư. (3) **Audit trail gắn correlation_id với break case** — truy vết được từ lệch đến bút toán điều chỉnh đến người phê duyệt.

 > Cụm từ: Break (lệch) là sự khác biệt giữa hai bản ghi cùng một thực thể. Maker-checker = một người đề xuất, người khác duyệt. Append-only = chỉ thêm bút toán mới, không sửa/xóa dòng cũ. Ledger balance = số dư sổ cái (tiền thực), Available balance = số dư khả dụng (trừ hold).

   `,
  follow: [
    'Nếu core và kênh dùng business_date khác nhau (core đã sang ngày mới, kênh vẫn ngày cũ), đối soát thế nào?',
    'Break do race condition (hai kênh cùng trừ một tài khoản) phát hiện và xử lý ra sao?',
    'Ai có quyền duyệt điều chỉnh số dư > 1 tỷ, và cần mấy cấp duyệt?'
  ],
  tags: ['reconciliation', 'EOD', 'core banking', 'channel', 'maker-checker', 'audit trail', 'break']
},
{
  id: 'banking-076',
  topic: 'banking',
  level: 'lead',
  q: 'Ngân hàng thay core (migrate sang core mới hoặc nâng cấp lớn): chiến lược chạy song song, đối soát số dư, cắt chuyển (cutover), rollback, rủi ro cho các hệ thống tích hợp.',
  a: `**Tóm tắt:** Migration core banking là dự án rủi ro cao nhất: chuyển toàn bộ khách hàng, tài khoản, số dư, sản phẩm, lịch sử từ core cũ sang core mới. Chiến lược an toàn: **Parallel Run (chạy song song) → Đối soát số dư từng tài khoản → Cutover có tiêu chí Go/No-Go định lượng → Rollback plan đã diễn tập**. Rủi ro lớn nhất cho hệ thống tích hợp: thay đổi API, thay đổi định dạng dữ liệu, thay đổi ngày nghiệp vụ, lost transaction trong cửa sổ cutover.
### Chiến lược Migration: 4 giai đoạn

 | Giai đoạn | Hoạt động | Tiêu chí hoàn thành |
 |---|---|---|
 | **1. Prepare** | Xây dựng adapter, mapping dữ liệu, test case, dựng môi trường | 100% test case pass, performance đạt SLA |
 | **2. Parallel Run** | Chạy core mới song song core cũ (shadow mode), so khớp kết quả | Đối soát 100% tài khoản khớp, 0 UNEXPLAINED break |
 | **3. Cutover** | Freeze kênh, migrate delta, Go/No-Go, bật core mới | UNEXPLAINED = 0, delta migrated, smoke test pass |
 | **4. Hypercare** | Hỗ trợ tăng cường 2–4 tuần, monitor chặt | 0 critical incident, đối soát daily khớp |
### Parallel Run — Chạy song song an toàn nhất
 **Shadow Mode (khuyên dùng)**: Giao dịch thật đi vào core cũ (phục vụ khách), **bản sao** đi vào core mới (chỉ đọc, không ghi sổ cái chính thức). Core mới tính toán, trả kết quả -> so khớp với core cũ.

 ~~~seq
 title: Parallel Run (Shadow Mode)
 actors: Khach | Gateway | CoreCu | CoreMoi | ReconJob
 Khach -> Gateway: chuyen tien
 Gateway -> CoreCu: xu ly that (ghi so cai chinh)
 CoreCu --> Gateway: SUCCESS, tx_id
 Gateway -> CoreMoi: gui ban sao (read-only mode)
 CoreMoi --> Gateway: ket qua tinh toan
 ReconJob -> CoreCu: lay so du ngay T
 ReconJob -> CoreMoi: lay so du ngay T
 ReconJob -> ReconJob: so sanh tung tai khoan
 ReconJob --> OpsTeam: bao cao break (neu co)
 ~~~

 **Tiêu chí đối soát Parallel Run**:
 1. **Tổng số dư**: tổng available + ledger phải khớp (tolerance 0 VND).
 2. **Từng tài khoản**: available_balance và ledger_balance khớp tuyệt đối (0 VND chênh).
 3. **Trạng thái giao dịch**: PENDING/COMPLETED/FAILED khớp nhau.
 4. **Lịch sử giao dịch**: số lượng, số tiền, timestamp khớp (tolerance ±1s do độ trễ mạng).

 **Báo cáo Parallel Run hàng ngày**:
 ~~~text
 Ngay T: 2.150.000 tai khoan
 MATCH:                    2.149.995
 EXPLAINED (fee timing):       3
 UNEXPLAINED:                  2  <-- PHAI = 0 MOI DUOC CUTOVER
 ~~~
### Đối soát số dư — Chìa khóa thành công
 **Không chỉ so tổng** — phải so **từng tài khoản** (account-level). Tổng khớp có thể che lệch bù trừ (A thiếu 1 tỷ, B thừa 1 tỷ).

 Công cụ đối soát phải viết **TRƯỚC** công cụ migrate, vì nó quyết định có được cutover hay không.

 ~~~java
 record AccountDiff(String accountId, BigDecimal oldAvail, BigDecimal newAvail,
                    BigDecimal oldLedger, BigDecimal newLedger) {
     boolean isMatch() {
         return oldAvail.compareTo(newAvail) == 0 
             && oldLedger.compareTo(newLedger) == 0;
     }
 }

 enum DiffClass { MATCH, EXPLAINED, UNEXPLAINED }

 DiffClass classify(AccountDiff d, Map<String, String> approvedExceptions) {
     if (d.isMatch()) return MATCH;
     String note = approvedExceptions.get(d.accountId());
     return note != null ? EXPLAINED : UNEXPLAINED;
 }
 ~~~
### Cutover — Cắt chuyển có kiểm soát
 **Runbook Cutover (ví dụ cuối tuần)**:

 | Thứ tự | Hoạt động | Thời gian | Người chịu trách nhiệm |
 |---|---|---|---|
 | 1 | Freeze kênh (ngừng nhận giao dịch mới) | 23:00 Thứ 7 | Platform Lead |
 | 2 | Chạy EOD cuối trên Core Cũ | 23:15–01:00 | Core Ops |
 | 3 | Migrate delta (giao dịch sau snapshot cuối) | 01:00–03:00 | Migration Team |
 | 4 | Đối soát delta + full reconcile | 03:00–05:00 | Recon Team |
 | 5 | **Go/No-Go Meeting** (UNEXPLAINED = 0?) | 05:00 | CTO + CRO |
 | 6 | Bật Core Mới, cập nhật DNS/Adapter | 05:15 | Platform |
 | 7 | Smoke test (mở app, xem số dư, chuyển 1 lần) | 05:30 | QA + Biz |
 | 8 | Mở kênh cho khách | 06:00 | Platform Lead |

 **Điểm không thể quay đầu (Point of No Return)**: lúc Core Mới bắt đầu ghi giao dịch thật. Sau đó rollback = migrate ngược + đối soát lại toàn bộ.

 **Tiêu chí Go/No-Go (viết trước, không được sửa lúc 5h sáng)**:
 - UNEXPLAINED breaks = 0
 - 100% tài khoản khớp số dư
 - Tất cả batch pending (fee, interest, reversal) đã xử lý xong
 - Adapter/Core Mới health check pass
 - Rollback plan đã review và sẵn sàng
### Rollback Plan — Phải đã diễn tập
 1. **Trigger**: Core Mới lỗi critical (sai số dư, crash, performance < 50% SLA) trong 2h sau cutover.
 2. **Action**: Freeze Core Mới, revert DNS/Adapter về Core Cũ, migrate delta ngược (Core Mới -> Core Cũ), đối soát, mở kênh.
 3. **RTO (Recovery Time Objective)**: 4 giờ (từ phát hiện đến phục hồi hoàn toàn).
 4. **Diễn tập**: 1 lần/tháng trước cutover, 1 lần chính thức 1 tuần trước.
### Rủi ro cho Hệ thống Tích Hợp (Internet Banking, Ví, CRM, Payment Gateway...)

 | Rủi ro | Mô tả | Mitigation |
 |---|---|---|
 | **API thay đổi** | Core mới REST/JSON khác core cũ SOAP/XML | Adapter pattern, canonical model, versioning API |
 | **Định dạng dữ liệu thay đổi** | account_id format, currency code, date format | Mapping table, integration test toàn bộ |
 | **Ngày nghiệp vụ lệch** | Core mới cut-off 23h, core cũ 22h | Đồng bộ business calendar, test EOD song song |
 | **Lost transaction cửa sổ cutover** | Giao dịch 23:00–06:00 rơi vào khe | Freeze kênh, outbox pattern, idempotency key |
 | **Số tham chiếu (ref ID) thay đổi** | Core mới sinh tx_id format mới | Giữ old_tx_id mapping, dual-write ref ID |
 | **Performance degradation** | Core mới chậm hơn ở peak | Load test 2x peak, auto-scaling, circuit breaker |
### Lỗi hay gặp
 - Migrate một lần (big bang) không parallel run -> phát hiện lỗi sau cutover, rollback 3 ngày.
 - Chỉ so tổng số dư, không so từng tài khoản -> 2 tỷ lệch bù trừ không bị phát hiện.
 - Không có rollback plan hoặc chưa diễn tập -> cutover thất bại, downtime 2 ngày.
 - Adapter không versioning API -> core mới deploy patch làm gãy 15 hệ thống ngoài.
 - Không freeze kênh khi migrate delta -> giao dịch mới mất giữa chừng.
 - Không giữ mapping old_id <-> new_id -> 5 năm sau không tra soát được giao dịch thời core cũ.
### Ví dụ đời thực

 Một ngân hàng lớn migrate T24 R18 -> R20. Parallel run 8 tuần: tuần 1–2 shadow 10% traffic, tuần 3–6 100% shadow, tuần 7–8 full parallel (hai core cùng ghi, đối soát daily). Phát hiện 3 UNEXPLAINED breaks: 2 do fee calculation rounding khác biệt, 1 do pending transaction handling. Fix adapter, chạy lại tuần 8 -> 0 UNEXPLAINED. Cutover thứ 7 đêm: freeze 23h, EOD core cũ 01h, migrate delta 03h, reconcile 05h, Go/No-Go 05:30 (UNEXPLAINED=0), bật core mới 06h, smoke test 06:30, mở cửa 07h. Hypercare 4 tuần: 0 critical incident. Hệ thống tích hợp 12 hệ thống: 0 lỗi do adapter versioning + canonical model.
### Trả lời mẫu khi phỏng vấn

 "Migration core tôi áp dụng 4 giai đoạn: Prepare (adapter, mapping, test) -> Parallel Run 8 tuần (shadow -> full, đối soát daily tài khoản-level, UNEXPLAINED phải = 0) -> Cutover có runbook freeze/EOD/delta/Go-No-Go/rollback -> Hypercare 4 tuần. Đối soát viết trước migrate, so từng tài khoản (không chỉ tổng), classify MATCH/EXPLAINED/UNEXPLAINED. Cutover tiêu chí Go/No-Go định lượng, point of no return khi core mới ghi thật. Rollback plan RTO 4h, đã diễn tập. Rủi ro tích hợp: API versioning, canonical model, business calendar sync, freeze kênh cửa sổ cutover, giữ mapping old/new ID. Thực tế: migrate T24 R18->R20, parallel 8 tuần, cutover 0 critical, 12 hệ thống tích hợp 0 lỗi."

 > Senior tip: Hãy trình bày như **quản lý rủi ro**, không phải "copy dữ liệu": "Tôi viết tool đối soát trước, vì tỷ lệ khớp là định nghĩa duy nhất của xong". Ba con số theo dõi qua parallel run: (1) UNEXPLAINED count (phải về 0), (2) thời gian chạy full pipeline so với cửa sổ cutover, (3) số record vào exception queue (phải giảm). Nhắc thêm: sau cutover vẫn có giai đoạn hypercare — lỗi migration thường lộ dần khi khách chạm nghiệp vụ hiếm.

 > Cụm từ: Parallel run = chạy hai hệ thống song song, so khớp kết quả. Cutover = cắt chuyển từ hệ thống cũ sang mới. Delta migration = chỉ migrate phần thay đổi sau snapshot cuối. Point of no return = thời điểm không thể rollback dễ dàng. Hypercare = hỗ trợ tăng cường sau go-live. Shadow mode = core mới chỉ đọc, không ghi sổ cái chính thức.

   `,
  follow: [
    'Khi parallel run phát hiện UNEXPLAINED breaks, quy trình triage và fix như thế nào trước khi chạy lại?',
    'Nếu cutover ngày Thứ 7 nhưng core mới gặp lỗi critical Chủ Nhật chiều, rollback hay fix forward?',
    'Hệ thống tích hợp 20+ hệ thống, làm sao đảm bảo adapter không thành bottleneck khi core mới thay đổi?'
  ],
  tags: ['migration', 'core banking', 'parallel run', 'cutover', 'rollback', 'reconciliation', 'hypercare', 'adapter']
},
{
  id: 'banking-077',
  topic: 'banking',
  level: 'senior',
  q: 'Luồng chuyển tiền nhanh 24/7 liên ngân hàng (NAPAS) diễn ra thế nào ở mức nguyên lý, và khi giao dịch bị timeout thì xử lý thế nào để không mất tiền?',
  a: `**Tóm tắt:** Chuyển tiền nhanh 24/7 liên ngân hàng cho phép khách gửi tiền giữa các ngân hàng bất cứ lúc nào. Ở Việt Nam chạy qua NAPAS. Khi timeout, không tự động retry hay hoàn tiền ngay; đánh dấu giao dịch đang tra soát, truy vấn lại theo mã tham chiếu duy nhất, chỉ hoàn tiền nếu sau thời hạn vẫn không xác định được.

### Luồng nguyên lý
Khách gửi yêu cầu tại ngân hàng gửi -> ngân hàng gửi đóng gói giao dịch gửi đến NAPAS -> NAPAS kiểm tra và chuyển tiền đến ngân hàng nhận -> ngân hàng nhận ghi có tài khoản người nhận -> NAPAS thông báo kết quả về ngân hàng gửi -> ngân hàng gửi thông báo khách.

### Khi timeout
Timeout nghĩa là chưa biết kết quả, không phải thất bại. Tiền có thể đã được trừ ở bên gửi hoặc đã được cộng ở bên nhận mà thông báo bị mất. Vì vậy:
- Không tự động retry và không tự động trừ tiền lại.
- Đánh dấu giao dịch là đang tra soát (PENDING_UNKNOWN), tiền bị tạm giữ.
- App hiển thị "đang xử lý", không báo lỗi ngay.
- Tra soát theo mã tham chiếu duy nhất: hỏi NAPAS hoặc ngân hàng nhận xem giao dịch đã được thực hiện chưa.
- Nếu đã thực hiện -> cập nhật thành công, thông báo khách.
- Nếu chưa thực hiện và qua thời hạn -> hoàn tiền về tài khoản người gửi, mở ticket.
- Nếu không xác định được sau thời hạn -> leo thang cho nhân viên kiểm tra tay.

### Lỗi hay gặp
- Tự động retry khi timeout -> tiền bị trừ/cộng nhiều lần.
- Quên lưu mã tham chiếu duy nhất -> không tra soát được.
- Thông báo thất bại ngay khi timeout, chưa tra soát xong -> khách hoang mang.
- Không có giới hạn số lần tra soát -> giao dịch treo vĩnh viễn.

### Ví dụ đời thực
Một khách gửi 5 triệu VND lúc 20 giờ, hệ thống báo timeout sau 10 giây. Dev không tự động gửi lại lệnh trừ tiền. Tra soát theo mã tham chiếu duy nhất: NAPAS xác nhận tiền đã được cộng vào tài khoản người nhận -> cập nhật giao dịch thành "thành công" và gửi SMS cho khách. Nếu sau 24 giờ vẫn không xác định được -> hoàn 5 triệu VND về tài khoản người gửi và mở ticket cho nhân viên kiểm tra tay.

### Trả lời mẫu khi phỏng vấn
"Chuyển tiền nhanh 24/7 qua NAPAS hoạt động như bưu điện điện tử giữa ngân hàng gửi và ngân hàng nhận. Khi timeout, tôi không bao giờ tự động retry hay tự động trừ tiền lại, vì tiền có thể đã bị trừ ở bên gửi hoặc đã được cộng ở bên nhận mà thông báo bị mất. Tôi đánh dấu giao dịch đang tra soát, truy vấn lại NAPAS bằng mã tham chiếu duy nhất, và chỉ hoàn tiền nếu sau thời gian quy định vẫn không xác định được."

> Senior tip: Trái tim của chuyển khoản liên ngân hàng là "một giao dịch, một mã tham chiếu duy nhất, không bao giờ tự động thử lại khi lỗi".

> Cụm từ: Transaction ID (mã giao dịch) là chuỗi ký tự duy nhất gắn với mỗi giao dịch.
`,
  follow: [
    'Tại sao không được tự động retry khi giao dịch liên ngân hàng bị timeout?',
    'Mã tham chiếu duy nhất giúp tra soát giao dịch thế nào?',
    'Giao dịch đang tra soát quá một tháng, bạn xử lý thế nào?'
  ],
  tags: ['NAPAS', 'chuyen khoan lien ngan hang', 'timeout', 'tra sot']
},
{
  id: 'banking-078',
  topic: 'banking',
  level: 'mid',
  q: 'QR thanh toán chuẩn chung (VietQR) hoạt động thế nào từ lúc khách quét mã đến khi tiền vào tài khoản người bán, và vì sao ảnh "chuyển khoản thành công" không phải bằng chứng?',
  a: `**Tóm tắt:** Mã QR thanh toán chỉ là "tờ giấy ghi sẵn thông tin chuyển khoản". App ngân hàng của khách quét, đọc các trường đó rồi khởi tạo lệnh chuyển khoản nhanh 24/7. Lệnh đi qua hệ thống chuyển mạch (NAPAS), tiền vào tài khoản người bán, người bán nhận báo có qua app hoặc webhook. QR không giữ tiền và không chứng minh đã thanh toán.

### QR tĩnh và QR động
QR tĩnh in ra dán quầy, không có số tiền, khách tự nhập; QR động sinh theo đơn hàng, có số tiền, mã đơn, hết hạn vài phút.

### Luồng
Khách quét QR -> app đọc TLV -> xác nhận -> gửi lệnh chuyển khoản nhanh 24/7 qua NAPAS -> tiền vào tài khoản người bán -> core người bán gửi webhook báo có -> POS người bán đối chiếu, xác nhận đơn.

### Vì sao không tin ảnh chụp
Khách chụp màn hình "Giao dịch thành công" gửi cho người bán là chiêu lừa phổ biến: ảnh ghép rất dễ, còn tiền thì chưa chuyển. Luồng đúng: tạo đơn trạng thái CHO_THANH_TOAN, sinh QR động gắn mã đơn; nhận webhook báo có hoặc chủ động gọi API tra soát theo mã tham chiếu; kiểm tra đúng số tiền, đúng tài khoản thụ hưởng, đúng mã đơn, chưa từng được dùng cho đơn khác; chỉ khi đó chuyển đơn sang DA_THANH_TOAN và cho phép giao hàng.

### Lỗi hay gặp
- Cho phép thanh toán khi chưa có xác nhận từ phía ngân hàng (chỉ tin thông báo của khách).
- Không gắn nội dung chuyển khoản với mã đơn.
- Dùng số thập phân cho VND ở mọi nơi rồi làm tròn lệch khi đối soát.
- QR động không có hạn.
- Coi webhook là tin cậy tuyệt đối mà không kiểm tra chữ ký/nguồn và không xử lý trùng.

### Ví dụ đời thực
Một chuỗi cửa hàng tiện lợi 200 chi nhánh triển khai VietQR động. Một ngày, chi nhánh A báo 15 đơn hàng bị "mất tiền": khách quét QR, app báo thành công, nhưng POS không nhận webhook. Dev tra soát log POS và NAPAS thấy: webhook bị thất lạc do sự cố mạng 5 phút. Hệ thống POS không có job tra soát chủ động, trạng thái đơn vẫn là AWAITING. Cách xử lý: chạy script đối soát thủ công cho 15 đơn, xác nhận tiền đã về tài khoản, chuyển đơn sang PAID. Sau đó bổ sung job cron 5 phút tra soát theo mã tham chiếu NAPAS.

### Trả lời mẫu khi phỏng vấn
"VietQR chỉ là kênh khởi tạo yêu cầu chuyển khoản, không giữ tiền và không chứng minh đã thanh toán. QR tĩnh in ra dán quầy, không có số tiền và mã đơn; QR động sinh theo đơn hàng, có số tiền, mã đơn, hết hạn vài phút. Luồng: khách quét QR -> app đọc TLV -> xác nhận -> gửi lệnh chuyển khoản nhanh 24/7 qua NAPAS -> tiền vào tài khoản người bán -> core người bán gửi webhook báo có. Quan trọng: không bao giờ xác nhận đơn chỉ dựa vào ảnh 'chuyển khoản thành công' khách chụp, phải nhận webhook hoặc chủ động tra soát theo mã tham chiếu NAPAS."

> Senior tip: QR chỉ là kênh khởi tạo yêu cầu (initiation), còn kênh quyết định là hệ thống chuyển mạch và sổ cái. Thiết kế phải có mã đơn duy nhất, trạng thái "đang chờ xác nhận", và job tra soát chủ động.

> Cụm từ: Webhook là việc hệ thống A chủ động gọi API của B khi có sự kiện.
`,
  follow: [
    'Vì sao không được xác nhận đơn hàng chỉ dựa vào ảnh "chuyển khoản thành công" khách gửi?',
    'QR động cần những dữ liệu nào để đối soát tự động, và xử lý khi QR hết hạn ra sao?',
    'Webhook báo có bị gửi trùng hai lần, hệ thống người bán phải ứng xử thế nào?'
  ],
  tags: ['VietQR', 'QR tinh', 'QR dong', 'doi soat', 'webhook']
},
{
  id: 'banking-079',
  topic: 'banking',
  level: 'lead',
  q: 'Tokenization thẻ và PCI-DSS là gì ở mức nguyên lý, và vì sao không lưu CVV trong hệ thống?',
  a: `**Tóm tắt:** PCI-DSS là tiêu chuẩn bảo mật cho mọi đơn vị lưu, xử lý hoặc truyền số thẻ thanh toán. Nguyên tắc quan trọng: không bao giờ lưu mã CVV sau khi xác nhận thanh toán; dùng tokenization để thay số thẻ thật bằng mã giả; và che số thẻ khi ghi log.

### PCI-DSS là gì
PCI-DSS (Payment Card Industry Data Security Standard) là bộ quy tắc bảo mật mà mọi đơn vị xử lý thẻ phải tuân theo. Nó không phải pháp luật nhưng là yêu cầu của các tổ chức thẻ (Visa, Mastercard...). Nếu vi phạm, đơn vị có thể bị phạt, bị ngừng dịch vụ thẻ.

### Không lưu CVV
CVV (Card Verification Value) là 3 số in sau thẻ, dùng để xác minh người mua có thẻ trong tay khi mua online. PCI-DSS cấm tuyệt đối lưu CVV sau khi xác nhận thanh toán, vì nếu không lưu CVV, kẻ xấu lấy được số thẻ mà không thể mua online (vì cần CVV).

### Tokenization là gì
Tokenization thay thế số thẻ thật (PAN - Primary Account Number) bằng một mã giả (token) ngẫu nhiên, không có giá trị toán học với số thẻ. Token được lưu trong hệ thống, số thẻ thật lưu ở một hệ thống biệt lập (vault) được bảo mật rất cao. Nếu cơ sở dữ liệu ngân hàng bị lộ, kẻ xấu chỉ lấy được token, không thể chuyển đổi thành số thẻ thật không có khóa mã hóa của vault. Token khác mã hóa (encryption): mã hóa cần khóa để giải mã, token không cần (cần hệ thống vault để đổi trả).

### Che số thẻ trong log
Log hệ thống không được chứa số thẻ đầy đủ. Nếu cần ghi log để xác định lỗi, chỉ ghi 4 số cuối hoặc che tất cả ngoại trừ 4 số cuối.

### Lỗi hay gặp
- Lưu CVV trong cơ sở dữ liệu -> vi phạm PCI-DSS.
- Lưu số thẻ thật ở dạng văn bản thô.
- Ghi số thẻ đầy đủ vào log để debug.
- Token không được mã hóa hoặc lưu ở hệ thống không bảo mật.
- Nhân viên có thể xem số thẻ đầy đủ trong hệ thống quản lý.

### Ví dụ đời thực
Một dev đang debug lỗi giao dịch thanh toán thẻ và viết log: "Giao dịch thẻ 1234 5678 9012 3456 thành công". Kiểm tra bảo mật phát hiện log chứa số thẻ đầy đủ (PAN) — vi phạm tiêu chuẩn PCI-DSS. Điều tra code thấy hệ thống lưu số thẻ thật dưới dạng văn bản thô trong bảng giao dịch. Nguyên nhân gốc: không có quy tắc che thẻ trong log, và số thẻ thật không được mã hóa hay thay bằng token. Cách xử lý: xóa toàn bộ log cũ chứa số thẻ, sửa code chỉ ghi 4 số cuối (**** **** **** 3456), áp dụng tokenization: thay số thẻ thật bằng token ngẫu nhiên, số thẻ thật lưu ở hệ thống vault riêng biệt và bảo mật cao; đồng thời xác nhận không bao giờ lưu mã CVV sau khi xác nhận thanh toán.

### Trả lời mẫu khi phỏng vấn
"PCI-DSS là tiêu chuẩn bảo mật mà mọi đơn vị lưu, xử lý hoặc truyền số thẻ thanh toán phải tuân theo. Nguyên tắc quan trọng nhất là không bao giờ lưu mã CVV sau khi xác nhận thanh toán. Thay vì lưu số thẻ thật, hệ thống dùng tokenization: thay số thẻ thật (PAN) bằng một mã giả ngẫu nhiên gọi là token, số thẻ thật được lưu ở hệ thống vault riêng biệt và bảo mật rất cao. Khi cần thanh toán, hệ thống gửi token đến vault để thực hiện. Nếu cơ sở dữ liệu bị lộ, kẻ xấu chỉ lấy được token, không thể đổi thành số thẻ thật mà không có khóa của vault. Khi ghi log, chỉ được che số thẻ, ví dụ hiển thị 4 số cuối, không bao giờ in số thẻ đầy đủ."

> Senior tip: PCI-DSS không chỉ là "mã hóa" mà là "giảm thiểu tối thiểu dữ liệu nhạy cảm hệ thống cần lưu". Số thẻ thật chỉ cần lưu ở một nơi, và các hệ thống khác chỉ lưu token.

> Cụm từ: PAN (Primary Account Number - số tài khoản chính) là số thẻ in trên thẻ (16 số), được bảo vệ bởi PCI-DSS.
`,
  follow: [
    'Tại sao cấm lưu CVV sau khi xác nhận thanh toán?',
    'Token khác mã hóa thế nào, và khi nào dùng cái gì?',
    'Log phải che số thẻ thế nào để an toàn?'
  ],
  tags: ['PCI DSS', 'CVV', 'tokenization', 'so the', 'log']
},
{
  id: 'banking-080',
  topic: 'banking',
  level: 'senior',
  q: 'Chuyển tiền quốc tế và tỷ giá: cut-off, value date là gì, và xử lý thế nào để không sai số tiền?',
  a: `**Tóm tắt:** Chuyển tiền quốc tế liên quan đến tỷ giá hối đoái, thời gian cut-off và value date (ngày tiền được cộng vào tài khoản). Cut-off time là mốc giờ cuối ngày ngân hàng nhận giao dịch; giao dịch sau cut-off được xử lý như của ngày làm việc tiếp theo. Value date là ngày tiền giao dịch được cộng vào tài khoản và bắt đầu tính lãi. Dev phải hiểu các quy tắc này để tính toán ngày giao dịch, số dư và lãi chính xác.

### Cut-off time là gì
Cut-off time (giờ cắt của) là mốc giờ của một ngày, sau giờ này, giao dịch mới được chấp nhận nhưng sẽ được tính như của ngày tiếp theo. Mỗi ngân hàng có một cut-off khác nhau cho từng loại giao dịch (ví dụ chuyển tiền nội bộ cut-off 16 giờ, chuyển khoản liên ngân hàng cut-off 14 giờ, tiền gửi cut-off 15 giờ).

Ví dụ: khách chuyển tiền 5 triệu lúc 16 giờ 30, cut-off là 16 giờ. Ngân hàng chấp nhận giao dịch nhưng tính như giao dịch của ngày mai. Người nhận tiền có thể tiền đến ngày mai, không phải ngày hôm nay.

Vì sao cần cut-off: ngân hàng cần thời gian để xử lý, kiểm tra và đóng sổ cái ngày. Nếu không có cut-off, giao dịch đến cuối đêm vẫn được xử lý, hệ thống sẽ quá tải và không kịp đóng sổ cái.

### Ngày làm việc và ngày lễ
Ngày làm việc là ngày ngân hàng mở cửa và xử lý giao dịch (thứ 2 đến thứ 6, trừ các ngày lễ). Ngày lễ là ngày ngân hàng nghỉ. Trong ngày lễ, không có giao dịch mới được xử lý, không tính lãi, không cập nhật số dư.

### Tác động đến giao dịch và tính lãi
1. Value date (ngày giá trị): ngày tiền giao dịch được tính và cộng vào tài khoản. Nếu giao dịch trượt qua cut-off hoặc vào ngày lễ, value date được đẩy sang ngày làm việc kế tiếp.
2. Tính lãi: lãi tiền gửi hoặc khoản vay được tính theo số ngày tiền gửi/vay.
3. Số dư: số dư hiển thị cho khách chỉ được cập nhật sau khi giao dịch được xử lý. Nếu giao dịch sau cut-off, số dư hiển thị có thể chưa thay đổi cho đến ngày làm việc kế tiếp.

Ví dụ số liệu: khách gửi tiền 100 triệu vào ngày Chủ Nhật (ngày nghỉ, giờ cắt đã qua). Ngân hàng chấp nhận giao dịch, tính value date là ngày làm việc đầu tiên của tuần sau. Lãi tiền được tính từ value date, không tính từ ngày Chủ Nhật.

### Tỷ giá và làm tròn
- Một số tiền luôn là cặp (giá trị, loại tiền), không bao giờ tách rời.
- Giao dịch có quy đổi phải lưu snapshot tỷ giá (tỷ giá, nguồn, mã báo giá, thời điểm) ngay lúc thực hiện.
- Làm tròn theo số chữ thập phân của từng loại tiền (VND scale 0, USD scale 2) và chỉ làm tròn ở bước cuối.
- Phần dư khi chia tiền cho nhiều bên phải được phân bổ thành dòng điều chỉnh để tổng không "rơi" tiền.

### Lỗi hay gặp
- Tính ngày giao dịch bằng ngày hiện tại, không kiểm tra cut-off và ngày lễ -> value date sai, lãi sai.
- Không phân biệt ngày làm việc và ngày thực tế -> sai số dư, khách phàn nàn.
- Tính lãi trong ngày lễ như một ngày bình thường cho sản phẩm chỉ tính lãi trong ngày làm việc -> sai số tiền lãi.
- Thông báo cho khách tiền đã được cộng nhưng value date chưa đến -> khách hoang mang.
- Lưu số tiền bằng double hoặc bằng long "số VND" rồi giả định mọi tiền tệ đều như vậy.
- Quy đổi hai lần (khách thấy số ở màn hình xác nhận khác số trong sao kê).

### Ví dụ đời thực
Một khách gửi 100 triệu VND vào lúc 23 giờ Chủ Nhật — đã qua giờ cut-off và ngày này là ngày nghỉ. Ngân hàng vẫn chấp nhận giao dịch, nhưng value date được đẩy sang ngày làm việc đầu tiên của tuần sau, không phải Chủ Nhật. Lãi tiền gửi được tính từ value date. Nếu dev sai lầm tính ngày bằng ngày hiện tại, value date và lãi sẽ sai, khách thấy số dư chưa cập nhật và gọi điện phàn nàn. Cách xử lý đúng: dùng một lớp tính ngày làm việc dùng chung cho toàn hệ thống, kiểm tra cut-off và danh sách ngày lễ trước khi gán value date, và luôn thông báo khách đúng ngày tiền thực tế được cộng.

### Trả lời mẫu khi phỏng vấn
"Cut-off time là mốc giờ cuối ngày ngân hàng chấp nhận giao dịch và tính là của ngày hôm nay; giao dịch sau cut-off được xử lý như của ngày làm việc tiếp theo. Ngày làm việc là ngày ngân hàng mở cửa và xử lý giao dịch, còn ngày lễ ngân hàng nghỉ, không xử lý giao dịch mới. Khi tính lãi hoặc hạn, value date sẽ bị đẩy sang ngày làm việc kế tiếp nếu giao dịch trượt cut-off hoặc rơi vào ngày lễ. Tôi nhấn mạnh dev không được tự ý tính ngày trên mỗi màn hình, phải có một lớp tính ngày làm việc dùng chung cho toàn hệ thống, và luôn thông báo khách đúng value date để tránh hiểu nhầm về số dư. Với chuyển tiền quốc tế, phải lưu snapshot tỷ giá tại thời điểm giao dịch và làm tròn theo scale của loại tiền đích."

> Senior tip: Hãy vẽ bảng tra cứu các loại giao dịch với cut-off và quy tắc tính ngày. Nhấn mạnh rằng dev không được tính ngày một cách tùy tiện, phải có một lớp tính ngày làm việc dùng chung cho toàn hệ thống. Với tiền tệ, tiền là cặp giá trị-loại tiền, mọi giao dịch lưu tỷ giá và nguồn tỷ giá tại thời điểm, và làm tròn một lần có dòng điều chỉnh phần dư để tổng luôn khớp.

> Cụm từ: Value date (ngày giá trị) là ngày tiền giao dịch được cộng vào tài khoản và bắt đầu tính lãi, không phải luôn bằng ngày khách nhận thông báo. Snapshot tỷ giá là bản ghi giá trị tỷ giá đã dùng tại thời điểm giao dịch, để sau này tái hiện đúng số tiền.
`,
  follow: [
    'Giao dịch sau cut-off tính ngày nào, tiền đến khi nào?',
    'Ngày lễ có tính lãi tiền gửi không, và xử lý thế nào?',
    'Tại sao cần một lớp tính ngày dùng chung thay vì mỗi màn hình tính riêng?'
  ],
  tags: ['cut-off time', 'ngay lam viec', 'ngay le', 'value date', 'tinh lai', 'ngoai te', 'ty gia']
},
{
  id: 'banking-081',
  topic: 'banking',
  level: 'senior',
  q: 'Xử lý giao dịch treo cuối ngày (EOD): trạng thái PENDING_UNKNOWN, tra soát và đối soát ra sao để không mất tiền?',
  a: `**Tóm tắt:** Giao dịch treo cuối ngày là giao dịch chưa biết kết quả (timeout, mất phản hồi) khi EOD chạy. Hệ thống chuyển sang trạng thái PENDING_UNKNOWN, tiền bị tạm giữ, không tự động hoàn hay retry. Tra soát theo mã tham chiếu duy nhất với backoff, và đối soát cuối ngày với file của đối tác để chốt các giao dịch còn treo. Chỉ hoàn tiền khi có xác nhận thất bại hoặc quá thời hạn tra soát theo quy trình.

### Vì sao timeout nguy hiểm
Khi gửi lệnh mà không nhận được phản hồi trong thời gian cho phép, có ba khả năng:
1. Đối tác chưa nhận lệnh -> tiền chưa đi.
2. Đối tác đã xử lý thành công (người nhận đã được ghi có) nhưng phản hồi bị mất trên đường về.
3. Giao dịch đang được xử lý ở một bên.

Nếu coi timeout = thất bại và hoàn tiền (hoặc cho khách gửi lại), trường hợp 2 khiến tiền đi hai lần hoặc ngân hàng mất tiền.

### Máy trạng thái giao dịch
~~~text
[SENDING] --phản hồi thành công--> [SUCCESS]
[SENDING] --phản hồi thất bại--> [FAILED] --> hoàn tiền tạm giữ
[SENDING] --timeout / lỗi mạng--> [PENDING_UNKNOWN]
[PENDING_UNKNOWN] --tra soát: thành công--> [SUCCESS]
[PENDING_UNKNOWN] --tra soát: thất bại--> [FAILED] --> hoàn tiền
[PENDING_UNKNOWN] --quá hạn, chưa rõ--> [MANUAL_INVESTIGATION] --> đối soát/tra soát với đối tác
~~~

Ở PENDING_UNKNOWN, số tiền đã bị tạm giữ khỏi số dư khả dụng nhưng chưa được ghi nợ chính thức; app hiển thị "đang xử lý".

### Tra soát bằng mã giao dịch
- Mỗi lệnh có mã tham chiếu duy nhất do ngân hàng gửi sinh ra và gửi kèm lệnh — đây là chìa khóa để hỏi trạng thái và để đối soát.
- Job hỏi trạng thái tự động với backoff (ví dụ sau 1, 5, 15, 60 phút); kết quả cập nhật máy trạng thái một cách idempotent.
- Không tự động gửi lại lệnh khi timeout, trừ khi kênh đảm bảo chống trùng theo mã tham chiếu.

### Đối soát cuối ngày
File đối soát của đối tác được so khớp với sổ của ngân hàng theo mã tham chiếu: giao dịch treo mà đối tác báo thành công thì hoàn tất; ngân hàng ghi thành công mà đối tác không có thì mở tra soát; các khoản chưa giải quyết đi vào quy trình tra soát chính thức với thời hạn theo quy định của đối tác và có maker-checker cho mọi điều chỉnh.

### Lỗi hay gặp
- Coi timeout là thất bại và hoàn tiền ngay.
- Cho phép khách bấm gửi lại khi giao dịch đang treo.
- Không có mã tham chiếu duy nhất xuyên suốt -> không tra soát được.
- Sửa trạng thái bằng tay trong DB thay vì qua quy trình có duyệt.
- PENDING_UNKNOWN treo vô hạn không có job quét/leo thang -> tiền khách bị giữ mãi.

### Ví dụ đời thực
Một ngân hàng số từng xử lý timeout bằng cách báo khách "giao dịch thất bại" và hoàn tiền ngay; khách chuyển lại và nhiều trường hợp người nhận nhận hai lần vì lệnh đầu thực ra đã thành công — trung bình 40 vụ mỗi tuần, mất nhiều ngày để đòi lại. Chuyển sang máy trạng thái trên: 92% giao dịch timeout được chốt tự động trong 15 phút nhờ hỏi trạng thái, phần còn lại chốt trong đối soát cuối ngày; không còn chuyển trùng, khiếu nại "tiền bị trừ mà chưa đến" giảm nhờ app hiển thị đúng trạng thái.

### Trả lời mẫu khi phỏng vấn
"Với giao dịch treo cuối ngày, timeout không có nghĩa là thất bại — chỉ là chưa biết kết quả. Tôi chuyển giao dịch sang trạng thái PENDING_UNKNOWN, tiền bị tạm giữ, app hiển thị đang xử lý và không cho gửi lại lệnh mới. Mỗi lệnh có mã tham chiếu duy nhất; job hỏi trạng thái theo mã đó với backoff và cập nhật máy trạng thái idempotent: thành công thì ghi nợ chính thức, thất bại thì hoàn tiền tạm giữ. Những giao dịch vẫn chưa rõ sẽ được chốt trong đối soát cuối ngày với file của đối tác, hoặc đi vào quy trình tra soát chính thức có thời hạn và maker-checker. Không tự động gửi lại lệnh, vì đó là cách nhanh nhất để chuyển tiền hai lần."

> Senior tip: đo tỉ lệ giao dịch rơi vào trạng thái chờ tra soát theo giờ và theo đối tác. Tỉ lệ tăng đột biến thường là dấu hiệu sớm nhất của sự cố phía đối tác — trước cả khi họ thông báo. Luôn có job quét PENDING_UNKNOWN quá hạn và leo thang cho nhân viên.

> Cụm từ: PENDING_UNKNOWN là trạng thái "đang treo, chưa kết luận" của giao dịch. Maker-checker là quy trình hai người tham gia một thao tác quan trọng: người đầu tiên (maker) khởi tạo, người thứ hai (checker) duyệt hoặc từ chối.
`,
  follow: [
    'Idempotency được đảm bảo ở những tầng nào (client, API của bạn, đối tác, DB) và mỗi tầng làm gì?',
    'Bạn thiết kế job tra soát định kỳ cho các giao dịch PENDING_UNKNOWN như thế nào (tần suất, backoff, giới hạn, leo thang thủ công)?',
    'Khi đối tác xác nhận FAILED nhưng bạn đã trừ tiền/hold, luồng đảo bút (reversal) cần đảm bảo những gì?'
  ],
  tags: ['core', 'timeout', 'pending', 'tra soát', 'doi soat', 'EOD']
},
{
  id: 'banking-082',
  topic: 'banking',
  level: 'senior',
  q: 'Thiết kế OMS (Order Management System) cho chứng khoán: nhận lệnh đặt/huỷ/sửa lệnh thế nào, máy trạng thái lệnh ra sao, và làm sao chống ghi nhận trùng khi app gửi lại?',
  a: `**Tóm tắt:** OMS là hệ thống trung gian giữa app của khách và sàn giao dịch: nhận yêu cầu mua/bán, kiểm tra hợp lệ và sức mua, giữ (hold) tiền hoặc chứng khoán, gửi lệnh tới sàn, rồi theo dõi từng phần khớp cho tới khi lệnh khớp hết, bị huỷ hoặc bị từ chối. Lệnh không bao giờ được UPDATE mù mà đi qua máy trạng thái có kiểm soát, huỷ/sửa là một yêu cầu mới tham chiếu lệnh gốc, và mọi lệnh mang một mã do client sinh (clientOrderId) để gửi lại bao nhiêu lần cũng chỉ tạo đúng một lệnh.

### Các thuật ngữ cần biết trước
- **OMS (Order Management System)**: hệ thống quản lý vòng đời lệnh — nhận, kiểm tra, gửi sàn, nhận kết quả khớp, huỷ, sửa. Ví dụ đời thường: OMS giống "người thư ký" ghi sổ mọi yêu cầu mua bán và theo dõi từng yêu cầu đến khi xong.
- **Sàn giao dịch (exchange)**: nơi tập trung lệnh của mọi công ty chứng khoán, ví dụ HOSE (TP.HCM), HNX (Hà Nội). Sàn vận hành **matching engine** — bộ máy ghép lệnh mua với lệnh bán.
- **Công ty chứng khoán (broker)**: bên có ghế thành viên trên sàn; bạn viết phần mềm cho họ, không nói chuyện trực tiếp với khách.
- **FIX (Financial Information eXchange)**: giao thức nhắn tin dạng chuỗi key=value chuẩn ngành để gửi lệnh/nhận báo cáo với sàn hoặc đối tác.
- **Fill (khớp)**: một phần hoặc toàn bộ khối lượng lệnh được khớp. Một lệnh 1.000 cổ phiếu có thể khớp 300, rồi 700 — gọi là khớp một phần (partial fill).
- **Hold (phong toả)**: tạm giữ tiền hoặc cổ phiếu để chắc chắn khách đủ khả năng thanh toán khi lệnh khớp. Ví dụ: khách có 100 triệu, đặt mua 50 triệu thì 50 triệu đó bị hold, số dư khả dụng còn 50 triệu.
- **Idempotency key (khoá chống trùng)**: một mã duy nhất cho một thao tác, để gửi lại cùng mã thì hệ thống trả lại kết quả cũ thay vì làm lại.

### Vì sao không được UPDATE trạng thái lệnh một cách tuỳ tiện
Lệnh chứng khoán có hai nguồn cập nhật chạy song song: lệnh của khách (đặt, huỷ, sửa) và báo cáo từ sàn (ack, khớp một phần, khớp hết, từ chối). Nếu code cứ đọc trạng thái rồi ghi đè, hai luồng có thể giẫm lên nhau:

1. Khách bấm huỷ, OMS đọc lệnh đang là ACKNOWLEDGED, chuẩn bị ghi CANCELLED.
2. Cùng lúc sàn báo khớp 100% khối lượng.
3. Luồng huỷ ghi CANCELLED sau đó, đè mất thông tin đã khớp. Sổ vị thế và sổ tiền của khách lệch với sàn, cuối ngày đối soát mới phát hiện.

Vì vậy mỗi lần chuyển trạng thái phải là một **so sánh-và-đổi có điều kiện** (compare-and-set) trong DB hoặc một sự kiện bất biến (event) có số thứ tự, để chỉ chuyển được từ trạng thái nguồn hợp lệ sang trạng thái đích hợp lệ.

### Máy trạng thái của một lệnh
~~~text
[NEW] --gửi sàn OK--> [PENDING_NEW] --sàn nhận--> [ACKNOWLEDGED]
[ACKNOWLEDGED] --báo khớp 1 phần--> [PARTIALLY_FILLED]
[ACKNOWLEDGED|PARTIALLY_FILLED] --báo khớp hết--> [FILLED]
[ACKNOWLEDGED|PARTIALLY_FILLED] --huỷ thành công--> [CANCELLED]
[NEW|PENDING_NEW] --sàn từ chối--> [REJECTED]
[NEW] --kiểm tra nội bộ thất bại--> [REJECTED]
~~~

Chú ý: **FILLED và CANCELLED là trạng thái cuối**, không có đường quay lại. Một lệnh đã khớp một phần rồi bị huỷ vẫn ghi được cả hai sự kiện: khối lượng đã khớp nằm trong các bản ghi fill riêng, không nhét vào một cột "trạng thái".

### Đi từng bước khi khách bấm Mua 1.000 cổ phiếu
1. **Chống trùng:** app sinh clientOrderId dạng UUID, gửi kèm. OMS có unique index trên cặp (accountId, clientOrderId). Nếu insert bị trùng khoá, trả về lệnh đã có — thao tác lặp lại an toàn.
2. **Kiểm tra hợp lệ:** mã có giao dịch không, khối lượng là bội số lô (ví dụ lô 100 trên HOSE), giá nằm trong biên độ trần/sàn, bước giá đúng quy định, tài khoản đang mở.
3. **Kiểm tra sức mua và hold:** tính tiền cần = giá × khối lượng × (1 + phí dự kiến), trừ số dư khả dụng, tạo bản ghi hold trong cùng transaction với lệnh.
4. **Ghi lệnh rồi mới gửi:** commit lệnh ở trạng thái NEW, sau đó gửi sang sàn. Nếu gửi lỗi mạng, lệnh vẫn còn trong DB để job tra soát xử lý tiếp — không có chuyện "đã gửi sàn nhưng mất dấu".
5. **Nhận báo cáo:** mỗi báo cáo từ sàn được xử lý idempotent theo mã báo cáo (execId); khớp một phần thì cộng dồn khối lượng đã khớp và giảm hold phần còn lại.
6. **Kết thúc:** FILLED thì chuyển hold thành ghi nợ thật; CANCELLED thì nhả hold phần chưa khớp.

### Code minh hoạ: chống trùng và chuyển trạng thái có điều kiện
~~~java
// Ghi lệnh: unique(account_id, client_order_id) biến việc gửi lặp thành no-op an toàn
public Order place(long accountId, String clientOrderId, OrderRequest req) {
    return orderRepo.findByClientOrderId(accountId, clientOrderId)
        .orElseGet(() -> {
            Order o = Order.newPending(accountId, clientOrderId, req);
            riskService.assertTradable(o);       // mã, lô, biên độ giá, phiên
            holdService.holdFor(o);              // giữ tiền/CP, cùng transaction
            return orderRepo.insert(o);          // có thể ném DuplicateKey -> bắt và đọc lại
        });
}

// Chỉ cho phép chuyển trạng thái theo bảng hợp lệ, dùng CAS để tránh ghi đè báo cáo khớp
private static final Map<Status, Set<Status>> ALLOWED = Map.of(
    Status.NEW, Set.of(Status.PENDING_NEW, Status.REJECTED),
    Status.PENDING_NEW, Set.of(Status.ACKNOWLEDGED, Status.REJECTED),
    Status.ACKNOWLEDGED, Set.of(Status.PARTIALLY_FILLED, Status.FILLED, Status.CANCELLED),
    Status.PARTIALLY_FILLED, Set.of(Status.FILLED, Status.CANCELLED));

public boolean move(long orderId, Status from, Status to) {
    if (!ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
        throw new IllegalStateException("Chuyển trạng thái không hợp lệ " + from + " -> " + to);
    }
    return orderRepo.updateStatusIfCurrent(orderId, from, to) == 1;  // UPDATE ... WHERE status = ?
}
~~~

### Huỷ và sửa lệnh: cuộc đua với lúc khớp
Sửa lệnh về bản chất là **huỷ lệnh cũ + đặt lệnh mới** (cancel-replace), và có một khoảng thời gian lệnh cũ vẫn có thể khớp tiếp. Vì thế:
- Không bao giờ "trả lại" hold cũ trước khi nhận xác nhận huỷ từ sàn; nếu không, khách có thể dùng tiền đó đặt lệnh khác và bị âm khi lệnh cũ khớp nốt.
- Trạng thái trung gian CANCEL_PENDING hữu ích: khoá thao tác sửa/huỷ thứ hai trong lúc chờ sàn trả lời.
- Nếu lệnh đã khớp hết trước khi yêu cầu huỷ tới sàn, yêu cầu huỷ bị từ chối — phải trả về đúng lý do cho khách, không im lặng.

### So sánh hai cách giữ tiền khi đặt lệnh
| Cách | Ưu điểm | Nhược điểm |
|---|---|---|
| Hold ngay khi đặt lệnh (mặc định) | Không bao giờ âm tiền khi khớp; khách thấy đúng sức mua còn lại | Giữ tiền cả khi lệnh không khớp; cần job nhả hold chính xác |
| Chỉ kiểm tra lúc khớp (check-then-act muộn) | Không giữ tiền sớm, khách linh hoạt | Có thể oversell/âm tiền nếu khách đặt nhiều lệnh cùng lúc; phải xử lý vi phạm sau khi đã khớp — rất xấu về pháp lý |

Nguyên tắc thực tế: **hold là bắt buộc**; câu hỏi chỉ là hold theo giá nào (giá đặt hay giá trần) và nhả hold theo sự kiện nào.

### Lỗi hay gặp trên production
- Dùng timestamp làm idempotency key: hai cú bấm trong cùng một milli-giây sinh hai lệnh.
- Nhả hold khi đã gửi yêu cầu huỷ nhưng chưa có xác nhận từ sàn, dẫn tới âm tiền khi lệnh khớp nốt.
- Xử lý báo cáo khớp không idempotent: sàn gửi lại báo cáo (retransmission sau khi mất kết nối FIX) làm cộng khối lượng hai lần.
- Không có job đối soát trạng thái lệnh với sàn, để lệnh kẹt PENDING_NEW hàng giờ.

### Ví dụ đời thực
Một công ty chứng khoán gặp sự cố giờ mở cửa: app bán lẻ retry khi mạng chập chờn, và vì clientOrderId sinh ở server theo timestamp, 9h15 có 1.800 lệnh trùng được tạo, hold tiền gấp đôi khiến nhiều tài khoản báo "không đủ sức mua" dù còn tiền. Sau khi chuyển sang UUID do client sinh và thêm unique index (account_id, client_order_id), số lệnh trùng về 0; thời gian xử lý trung bình một lệnh 42ms, p99 180ms; số ticket "sức mua sai" giảm từ khoảng 60/ngày xuống còn vài ticket do nguyên nhân khác.

### Trả lời mẫu khi phỏng vấn
"OMS của tôi chia làm ba phần: nhận và chống trùng, kiểm tra và giữ tiền, theo dõi trạng thái. Mỗi lệnh có clientOrderId do app sinh, unique theo tài khoản, nên gửi lại bao nhiêu lần cũng chỉ một lệnh. Khi hợp lệ, tôi hold tiền hoặc cổ phiếu trong cùng transaction với việc ghi lệnh ở trạng thái NEW, rồi mới gửi sang sàn, để nếu mạng đứt thì lệnh vẫn còn dấu trong DB. Lệnh đi qua máy trạng thái NEW, PENDING_NEW, ACKNOWLEDGED, PARTIALLY_FILLED, FILLED hoặc CANCELLED, mỗi lần chuyển là một câu UPDATE có điều kiện theo trạng thái hiện tại, nên báo cáo khớp của sàn không bị luồng huỷ ghi đè. Huỷ là cancel-replace: chỉ nhả hold sau khi sàn xác nhận, vì lệnh cũ có thể khớp trong lúc chờ. Cuối cùng tôi có job tra soát lệnh treo và đối soát fill với sàn, và xử lý báo cáo khớp idempotent theo execId để báo cáo gửi lại không cộng khối lượng hai lần."

> Senior tip: đừng bao giờ để trạng thái lệnh chỉ nằm ở một cột — hãy lưu chuỗi sự kiện (order_events) kèm execId, thời điểm và nguồn (khách hay sàn). Khi có tranh chấp với khách hoặc với sàn, bạn dựng lại được chính xác điều gì đã xảy ra, theo thứ tự nào. Chi phí lưu thêm rất nhỏ so với một buổi sáng mất dữ liệu khớp lệnh.

> Cụm từ: OMS là hệ thống quản lý vòng đời lệnh. Hold là tạm phong toả tiền/chứng khoán cho một lệnh. Idempotency key là mã chống trùng cho một thao tác. Cancel-replace là huỷ lệnh cũ để đặt lệnh mới với giá/khối lượng khác.
`,
  follow: [
    'Nếu sàn chấp nhận lệnh nhưng báo cáo ACK bị mất, OMS phát hiện và xử lý thế nào?',
    'Bạn thiết kế bảng lưu fill (khớp từng phần) và cách tính khối lượng còn lại ra sao?',
    'Hold theo giá đặt hay giá trần, và vì sao lựa chọn đó ảnh hưởng tới trải nghiệm khách?'
  ],
  tags: ['OMS', 'chứng khoán', 'máy trạng thái lệnh', 'idempotency', 'hold', 'cancel-replace']
},
{
  id: 'banking-083',
  topic: 'banking',
  level: 'lead',
  q: 'Thiết kế sổ lệnh (order book) và matching engine khớp lệnh theo ưu tiên giá - thời gian (price-time priority): cấu trúc dữ liệu, tính bất biến khi chạy đa luồng và cách đo hiệu năng?',
  a: `**Tóm tắt:** Sổ lệnh là hai danh sách lệnh chờ mua (bid) và chờ bán (ask) được xếp theo giá tốt nhất trước, cùng giá thì lệnh đến trước được ưu tiên — đó chính là price-time priority. Matching engine chạy **một luồng duy nhất cho mỗi mã** (single-writer), mọi lệnh vào đi qua một hàng đợi có thứ tự, nên không cần khoá phức tạp mà vẫn tất định. Nguyên tắc bất di bất dịch: chỉ khớp khi giá mua lớn hơn hoặc bằng giá bán, khớp ở giá của lệnh nằm sẵn trong sổ, và không bao giờ khớp vượt khối lượng còn lại.

### Thuật ngữ
- **Order book (sổ lệnh)**: bảng hai chiều các lệnh chờ khớp. Ví dụ đời thường: như hai hàng người xếp hàng mua và bán vé, ai trả giá tốt hơn đứng trước, cùng giá thì ai đến trước được phục vụ trước.
- **Bid / Ask**: giá bên mua cao nhất (bid) và giá bên bán thấp nhất (ask). Khoảng cách giữa hai giá gọi là **spread**.
- **Price-time priority**: ưu tiên 1 là giá tốt hơn, ưu tiên 2 là thời gian đến sớm hơn. Trên HOSE/HNX lệnh khớp liên tục tuân theo quy tắc này.
- **Taker / Maker**: lệnh đến sau khớp với lệnh nằm sẵn — lệnh đến sau là taker, lệnh nằm sẵn là maker.
- **Tất định (deterministic)**: cùng một chuỗi lệnh đầu vào luôn cho cùng một chuỗi kết quả khớp. Bắt buộc với hệ thống tài chính, vì phải tái hiện được để kiểm toán.

### Vì sao phải là một luồng ghi duy nhất
Có hai lệnh mua cùng lúc tới giá 25.000, sổ chỉ còn 100 cổ phiếu giá 25.000 bên bán. Nếu hai luồng cùng đọc "còn 100" rồi cùng khớp 100, tổng khớp thành 200 — thừa một lượng không tồn tại. Các cách chống:
- Khoá từng mã trước khi khớp: đúng nhưng dễ chết lock, khó suy luận, hiệu năng giảm khi tranh chấp cao.
- **Một luồng cho mỗi mã** (hoặc một luồng cho một tập mã): mọi thao tác thêm/huỷ/khớp vào sổ tuần tự hoá tự nhiên, không cần khoá nội bộ, kết quả tất định và dễ replay.

Với sàn lớn, mỗi mã có thể có luồng riêng; các mã độc lập nhau nên scale theo số mã, còn trong một mã thì mãi mãi tuần tự.

### Cấu trúc dữ liệu
- **Bên giá**: cây tìm kiếm cân bằng hoặc cấu trúc sắp xếp để lấy giá tốt nhất trong O(log n) hoặc O(1) nếu dùng mảng chỉ số giá (giá có bước giá cố định, ví dụ bước 100 đồng thì dùng mảng chỉ số).
- **Trong một mức giá**: hàng đợi FIFO để đúng thứ tự thời gian.
- **Tra cứu lệnh để huỷ**: bảng băm orderId -> vị trí, để huỷ O(1). Huỷ "lười" (lazy delete) cũng hay dùng: đánh dấu huỷ, dọn khi tới lượt khớp.

Ví dụ sổ lệnh:
~~~text
BID (mua)                 ASK (bán)
25.100  x 500  (A)        25.300  x 300  (D)
25.000  x 800  (B)        25.400  x 900  (E)
25.000  x 200  (C)        25.500  x 1.200(F)
~~~

### Từng bước khớp một lệnh mua mới
1. Lấy ask thấp nhất. Nếu không có ask, hoặc giá ask > giá mua, dừng: phần còn lại vào sổ bên bid.
2. Nếu giá ask <= giá mua: khớp tại **giá ask** (giá của maker), khối lượng = min(còn lại của mua, còn lại của ask).
3. Trừ khối lượng hai bên, sinh bản ghi khớp (trade) có mã, giá, khối lượng, hai bên, thời điểm.
4. Lặp lại tới khi lệnh mua hết khối lượng hoặc không còn ask thoả giá.
5. Nếu lệnh mua còn khối lượng, đặt phần còn lại vào cuối hàng đợi tại mức giá của nó.

Với ví dụ trên, lệnh mua 25.400 x 400 sẽ khớp 300 với D tại 25.300, rồi 100 với E tại 25.400, xong hết khối lượng.

### Code minh hoạ (giản lược, một luồng)
~~~java
// Toàn bộ phương thức này chỉ chạy trên luồng của mã này -> không cần synchronized
void submit(Order in) {
    while (in.remaining() > 0 && !asks.isEmpty()) {
        PriceLevel best = asks.first();                 // mức giá bán thấp nhất
        if (best.price.compareTo(in.price) > 0) break;  // không còn giá thoả
        Order maker = best.peekFirst();                 // FIFO trong mức giá
        long qty = Math.min(in.remaining(), maker.remaining());
        trades.add(new Trade(in.symbol, in.id, maker.id, best.price, qty)); // khớp tại giá maker
        in.fill(qty);
        maker.fill(qty);
        if (maker.remaining() == 0) best.pollFirst();   // lệnh maker hết -> bỏ khỏi sổ
        if (best.isEmpty()) asks.removeFirst();
    }
    if (in.remaining() > 0) bids.add(in);               // phần dư vào sổ
}
~~~

Chú ý ba chi tiết quyết định tính đúng: khớp ở {{best.price}} chứ không phải giá của taker, dùng {{min}} khối lượng, và bỏ maker ngay khi hết.

### Cách chạy an toàn khi đa luồng
- Hàng đợi đầu vào có thứ tự (ví dụ một log tuần tự như Kafka partition theo mã, hoặc ring buffer nội bộ).
- Nếu chạy nhiều instance, **mỗi mã chỉ được một instance sở hữu** tại một thời điểm, thường qua leader election hoặc phân vùng cố định.
- Trạng thái sổ lệnh là dữ liệu trong bộ nhớ, được dựng lại bằng cách replay log lệnh khi khởi động; ảnh chụp (snapshot) định kỳ để replay nhanh.
- Kết quả khớp được ghi ra log bất biến trước khi công bố, để có thể tái hiện chính xác.

### Bảng trade-off
| Thiết kế | Độ đúng | Hiệu năng | Khi nào dùng |
|---|---|---|---|
| Một luồng/mã, in-memory + log | Cao, tất định | Rất nhanh (micro-giây tới mili-giây mỗi lệnh) | Matching engine thật, mô phỏng sàn |
| Khoá DB từng mã | Cao nhưng khó suy luận | Chậm, nghẽn khi tranh chấp | Hệ thống nhỏ, ít lệnh |
| Nhiều luồng cùng sửa sổ | Dễ sai | Nhanh trên lý thuyết | Không nên dùng cho khớp lệnh |

### Lỗi hay gặp
- Khớp ở giá của lệnh đến sau (taker) khiến một bên được lợi bất công và sai quy tắc sàn.
- Bỏ qua khối lượng còn lại sau khi khớp một phần, dẫn tới lệnh "biến mất" khỏi sổ.
- Huỷ lười nhưng quên kiểm tra cờ huỷ khi tới lượt khớp, sinh trade với lệnh đã huỷ.
- Dùng số thực dấu phẩy động (double) cho giá: 25.100 lưu thành 25100.0000001, so sánh sai. Giá phải là số nguyên theo đơn vị nhỏ nhất hoặc BigDecimal.
- Replay log không tất định vì phụ thuộc giờ hệ thống hoặc thứ tự thread — hai lần replay ra hai kết quả khác nhau.

### Ví dụ đời thực
Một đơn vị vận hành sàn mô phỏng cho cuộc thi đầu tư dùng DB với khoá theo mã. Khi 4.000 sinh viên cùng đặt lệnh lúc 9h15, p99 độ trễ khớp lên 2,3 giây và xuất hiện 37 cặp khớp vượt khối lượng do logic đọc-sửa-ghi. Chuyển sang một luồng/mã với sổ trong bộ nhớ: p99 còn 4ms, throughput đỉnh 12.000 lệnh/giây, và nhờ log lệnh bất biến, tranh chấp về kết quả khớp được giải quyết bằng replay thay vì tranh cãi.

### Trả lời mẫu khi phỏng vấn
"Matching engine của tôi giữ hai bên bid và ask, mỗi bên sắp theo giá tốt nhất trước và trong cùng một mức giá là hàng đợi FIFO — đó là price-time priority. Điều quan trọng nhất là tính tất định, nên tôi chạy một luồng duy nhất cho mỗi mã: lệnh vào qua một hàng đợi có thứ tự, không khoá, kết quả luôn tái hiện được. Khi khớp, tôi lấy mức giá đối diện tốt nhất, nếu giá thoả thì khớp tại giá của lệnh nằm sẵn trong sổ, khối lượng là min của hai bên, sinh trade, trừ khối lượng, lặp tới khi hết hoặc hết giá thoả, phần dư đặt vào cuối hàng đợi của mức giá. Tôi lưu log lệnh và trade bất biến để replay dựng lại sổ khi khởi động, snapshot định kỳ cho nhanh. Giá lưu bằng số nguyên đơn vị nhỏ nhất, không dùng double. Với nhiều instance, mỗi mã chỉ một instance sở hữu tại một thời điểm."

> Senior tip: hãy viết một bộ test replay: cho một chuỗi lệnh cố định, chạy hai lần và so từng trade. Bộ test này bắt được gần hết lỗi tinh vi của matching engine, kể cả lỗi chỉ xuất hiện khi có huỷ lười hoặc khớp một phần. Đo p99 và p999 theo từng mã, không chỉ trung bình — một mã thanh khoản cao có thể làm nghẽn cả luồng.

> Cụm từ: Order book là sổ hai chiều lệnh chờ mua/bán. Price-time priority là ưu tiên giá tốt trước, cùng giá thì thời gian trước. Taker là lệnh đến sau khớp với lệnh nằm sẵn (maker).
`,
  follow: [
    'Bạn xử lý huỷ lười (lazy delete) trong sổ lệnh thế nào để không sinh trade với lệnh đã huỷ?',
    'Snapshot và replay log hoạt động ra sao khi engine khởi động lại giữa phiên?',
    'Muốn scale theo số mã và theo số lệnh, bạn phân vùng và đo hiệu năng thế nào?'
  ],
  tags: ['order book', 'matching engine', 'price-time priority', 'chứng khoán', 'single writer', 'tất định']
},
{
  id: 'banking-084',
  topic: 'banking',
  level: 'senior',
  q: 'Các phiên giao dịch chứng khoán (ATO, khớp liên tục, ATC) khác nhau thế nào, các loại lệnh LO/MP/ATO/ATC ra sao, và backend phải xử lý gì khi chuyển phiên?',
  a: `**Tóm tắt:** Một ngày giao dịch chia thành các phiên: mở cửa (ATO — khớp tại giá mở cửa), khớp liên tục (khớp ngay khi mua bán gặp nhau), và đóng cửa (ATC — khớp tại giá đóng cửa). Mỗi phiên chỉ cho phép một số loại lệnh nhất định, và giá khớp được xác định theo quy tắc riêng của từng phiên. Backend phải coi phiên là **trạng thái có thời hạn** (có giờ bắt đầu/kết thúc thật, có thể đổi lịch), chặn lệnh sai phiên, và xử lý chuyển phiên một cách nguyên tử: huỷ lệnh ATO/ATC còn lại, chốt giá, rồi mở phiên mới.

### Thuật ngữ và các phiên trong ngày
- **Phiên (session)**: khoảng thời gian trong ngày mà sàn áp một tập quy tắc giao dịch. Ví dụ đời thường: như giờ mở cửa, giờ cao điểm và giờ đóng cửa của một cửa hàng — mỗi lúc có quy định phục vụ khác nhau.
- **ATO (At-The-Open)**: lệnh chỉ dùng trong phiên mở cửa, khớp tại một giá mở cửa duy nhất do sàn xác định để tối đa khối lượng khớp.
- **ATC (At-The-Closing)**: tương tự nhưng cho phiên đóng cửa; khớp tại một giá đóng cửa duy nhất. ATO/ATC không khớp liên tục, không hiện trong sổ lệnh theo cách thông thường, và nếu không khớp thì bị huỷ tự động hết phiên.
- **Khớp liên tục (continuous)**: lệnh vào là khớp ngay với lệnh đối diện nếu thoả giá — phần lớn thời gian trong ngày.
- **LO (Limit Order)**: lệnh giới hạn, nêu rõ giá mua tối đa hoặc giá bán tối thiểu.
- **MP (Market Price)**: lệnh thị trường, chỉ nêu khối lượng, chấp nhận khớp theo giá tốt nhất hiện có. Trên thị trường Việt Nam, MP thường chỉ được dùng trong phiên khớp liên tục và bị giới hạn bởi giá trần/sàn.
- **Giá trần / giá sàn**: mức giá cao nhất và thấp nhất được phép trong ngày, tính từ giá tham chiếu và biên độ (ví dụ 7% trên HOSE). Bước giá là đơn vị nhỏ nhất được phép thay đổi.
- **Giá tham chiếu**: giá đóng cửa ngày trước (đã điều chỉnh khi chia cổ tức, phát hành thêm) dùng để tính trần/sàn.

### Vì sao ATO/ATC cần quy tắc riêng
Với khớp liên tục, mỗi lệnh khớp riêng lẻ nên dễ: lấy giá đối diện tốt nhất. Với ATO/ATC, sàn phải chọn **một giá** cho tất cả lệnh khớp sao cho khối lượng khớp là lớn nhất — về bản chất là tìm điểm cân bằng giữa cung và cầu:

1. Gom tất cả lệnh ATO và lệnh LO còn hiệu lực.
2. Với mỗi mức giá khả thi, tính tổng khối lượng mua sẵn sàng trả từ mức đó trở lên và tổng khối lượng bán sẵn sàng nhận từ mức đó trở xuống.
3. Chọn mức giá cho khối lượng khớp nhỏ nhất của hai bên là lớn nhất; nếu hoà thì ưu tiên mức gần giá tham chiếu hơn (quy tắc cụ thể do sàn công bố).

Vì vậy backend của công ty chứng khoán **không tự khớp ATO/ATC** — nó gửi lệnh lên sàn, nhận báo cáo khớp sau khi sàn chốt giá. Điều này rất hay bị hiểu nhầm khi phỏng vấn.

### Ma trận loại lệnh theo phiên
| Loại lệnh | Phiên mở cửa (ATO) | Khớp liên tục | Phiên đóng cửa (ATC) |
|---|---|---|---|
| LO (giới hạn) | Có (tham gia tính giá mở cửa) | Có | Có (tham gia tính giá đóng cửa) |
| MP (thị trường) | Thường không | Có | Thường không |
| ATO | Bắt buộc dùng loại này | Không | Không |
| ATC | Không | Không | Bắt buộc dùng loại này |

Bảng trên là mô tả khái quát; chi tiết luôn theo quy chế hiện hành của từng sàn, và đây chính là lý do quy tắc phiên phải **cấu hình được**, không hard-code.

### Backend xử lý chuyển phiên thế nào
1. **Trạng thái phiên là dữ liệu, không phải if-else theo giờ**: bảng trading_session gồm mã sàn, ngày, loại phiên, thời điểm bắt đầu/kết thúc, trạng thái. Có job chuyển trạng thái theo lịch, có thể sửa khi sàn đổi giờ hoặc có sự cố.
2. **Chặn ở tầng API**: một lệnh ATO gửi lúc 9h16 (đã sang khớp liên tục) phải bị từ chối ngay với mã lỗi rõ ràng, không đẩy sang sàn để bị từ chối muộn.
3. **Chuyển phiên nguyên tử**: huỷ các lệnh ATO/ATC chưa khớp, nhả hold tương ứng, chốt số liệu phiên, rồi mới bật phiên mới. Nếu làm dở dang mà crash, phải replay được từ log.
4. **Kiểm tra giá theo phiên**: biên độ trần/sàn và bước giá có thể khác nhau (ví dụ phiên ATO/ATC cho phép dải giá rộng hơn), nên luôn kiểm tra bằng bộ quy tắc theo phiên.
5. **Đồng bộ với sàn**: giờ hệ thống của bạn và giờ sàn có thể lệch vài trăm mili-giây; hãy coi trạng thái do sàn công bố là nguồn sự thật cuối cùng.

### Code minh hoạ: kiểm tra lệnh theo phiên
~~~java
public void validate(OrderRequest r, Session s) {
    // 1) Loại lệnh có được dùng trong phiên này không
    if (!s.allowedTypes().contains(r.type())) {
        throw new Rejected("Loại lệnh " + r.type() + " không dùng được trong phiên " + s.code());
    }
    // 2) ATO/ATC không được kèm giá; LO/MP phải có/không có giá đúng quy định
    if (r.type() == Type.ATO || r.type() == Type.ATC) {
        if (r.price() != null) throw new Rejected("Lệnh " + r.type() + " không được đặt giá");
    }
    // 3) Giá trong biên độ và đúng bước giá của phiên (MP lấy giá trần/sàn làm biên)
    BigDecimal floor = s.floorPrice(r.symbol());
    BigDecimal ceil  = s.ceilingPrice(r.symbol());
    BigDecimal price = r.effectiveLimitPrice();     // MP -> giá trần khi mua, giá sàn khi bán
    if (price.compareTo(floor) < 0 || price.compareTo(ceil) > 0) {
        throw new Rejected("Giá ngoài biên độ " + floor + " - " + ceil);
    }
    if (price.remainder(s.tickSize(r.symbol())).compareTo(BigDecimal.ZERO) != 0) throw new Rejected("Sai bước giá");
    // 4) Khối lượng là bội số lô
    if (r.quantity() % s.lotSize(r.symbol()) != 0) throw new Rejected("Khối lượng sai lô");
}
~~~

### Lỗi hay gặp
- Hard-code giờ phiên trong code; hôm sàn đổi giờ hoặc nghỉ lễ bất thường là hỏng cả ngày.
- Coi lệnh ATO/ATC như LO thường, đẩy vào sổ khớp liên tục và báo khách "đã khớp" trong khi sàn chưa chốt giá.
- Không huỷ ATO/ATC chưa khớp khi hết phiên, để lệnh treo và hold tiền vô hạn.
- Tính trần/sàn từ giá đóng cửa thô mà quên điều chỉnh giá tham chiếu khi có chia cổ tức — lệch cả biên độ.
- Dùng MP không giới hạn giá: khách có thể khớp ở giá xa hơn kỳ vọng. Luôn giới hạn MP trong biên độ trần/sàn.
- So sánh giá bằng double: sai ở bước giá.

### Ví dụ đời thực
Một công ty chứng khoán để giờ phiên trong file cấu hình tĩnh. Vào ngày sàn thông báo mở cửa muộn 15 phút do sự cố kỹ thuật, hệ thống vẫn mở nhận lệnh đúng giờ cũ: khoảng 320 lệnh ATO bị đẩy lên sàn khi sàn chưa mở, bị từ chối hàng loạt, khách thấy "lệnh lỗi" ngay giữa phiên mở cửa. Sau khi chuyển trạng thái phiên thành dữ liệu có hiệu lực theo thời điểm (có bảng phiên và job điều khiển bởi sàn), cùng tình huống lặp lại nhưng hệ thống giữ lệnh ở trạng thái chờ và nhận đúng thời điểm, khiếu nại về "lệnh ma" giảm hẳn; số lệnh bị sàn từ chối do sai phiên từ khoảng 300/ngày xuống dưới 5.

### Trả lời mẫu khi phỏng vấn
"Trong ngày giao dịch có ba phiên chính: ATO mở cửa, khớp liên tục, ATC đóng cửa. ATO và ATC không khớp từng lệnh mà sàn chọn một giá duy nhất để khối lượng khớp lớn nhất, nên phía công ty chứng khoán chúng tôi chỉ gửi lệnh và chờ báo cáo khớp, không tự khớp. Lệnh LO dùng được ở cả ba phiên, MP chỉ ở khớp liên tục và luôn bị chặn trong biên độ trần sàn, còn ATO/ATC chỉ dùng đúng phiên của nó và không được kèm giá. Về backend, tôi coi phiên là dữ liệu có hiệu lực theo thời điểm chứ không hard-code giờ: API kiểm tra loại lệnh, giá, biên độ, bước giá và lô theo đúng phiên đang chạy. Khi chuyển phiên, tôi huỷ ATO hoặc ATC chưa khớp, nhả hold, chốt số liệu và mở phiên mới một cách nguyên tử, có thể replay từ log nếu crash. Cuối cùng, trạng thái do sàn công bố là chân lý, vì đồng hồ hai bên có thể lệch."

> Senior tip: đặt quy tắc phiên và quy tắc giá vào một module "market rules" có version và ngày hiệu lực. Khi sàn đổi biên độ hoặc thêm loại lệnh, bạn triển khai bằng dữ liệu và bật theo thời điểm, không phải deploy code trong phiên — và luôn có test chạy lại lịch sử một ngày giao dịch thật để so kết quả.

> Cụm từ: ATO/ATC là lệnh khớp tại giá mở cửa/đóng cửa. LO là lệnh giới hạn có giá. MP là lệnh thị trường không nêu giá. Giá tham chiếu là mốc để tính giá trần và giá sàn trong ngày.
`,
  follow: [
    'Vì sao phía công ty chứng khoán không nên tự khớp lệnh ATO/ATC mà phải chờ sàn chốt giá?',
    'Bạn mô hình hoá trạng thái phiên và xử lý chuyển phiên an toàn khi crash giữa chừng thế nào?',
    'Giá tham chiếu bị điều chỉnh do chia cổ tức ảnh hưởng đến kiểm tra trần/sàn ra sao?'
  ],
  tags: ['ATO', 'ATC', 'phiên giao dịch', 'LO', 'MP', 'giá trần sàn', 'chứng khoán']
},
{
  id: 'banking-085',
  topic: 'banking',
  level: 'senior',
  q: 'Hold tiền và chứng khoán khi đặt lệnh hoạt động thế nào, nhả hold ra sao khi khớp/huỷ, và chu kỳ thanh toán T+2 ảnh hưởng gì tới số dư khả dụng?',
  a: `**Tóm tắt:** Khi khách đặt lệnh mua, hệ thống giữ (hold) một khoản tiền; khi đặt lệnh bán, giữ số cổ phiếu tương ứng. Hold không phải là trừ tiền thật — nó chỉ làm giảm **số dư khả dụng** để khách không tiêu hai lần cùng một khoản. Khi khớp, hold được chuyển thành ghi nợ thật (tiền rời tài khoản) hoặc chuyển giao cổ phiếu; khi huỷ hoặc huỷ phần còn lại, hold được nhả. Chu kỳ thanh toán T+2 nghĩa là tiền và cổ phiếu chính thức đổi chủ vào ngày làm việc thứ hai sau ngày khớp, nên trong hai ngày đó khách thấy tiền "đã bị trừ" nhưng người bán chưa nhận được.

### Thuật ngữ
- **Số dư (balance)**: tổng tiền theo sổ. **Số dư khả dụng (available)**: phần được phép dùng ngay = số dư trừ tiền đang hold và các khoản phong toả khác. Ví dụ đời thường: trong ví có 1 triệu nhưng 600 nghìn đang đặt cọc giữ chỗ, thì số dư 1 triệu, khả dụng 400 nghìn.
- **Hold / reservation**: bản ghi "khoản tiền/cổ phiếu X đang bị giữ cho lệnh Y", có trạng thái ACTIVE, CONSUMED, RELEASED.
- **T+2**: ngày giao dịch T, thanh toán (tiền và chứng khoán chuyển chính thức) vào T+2 ngày làm việc. Ví dụ khớp thứ Hai thì thanh toán thứ Tư; khớp thứ Sáu thì thanh toán thứ Ba tuần sau (bỏ qua thứ Bảy, Chủ nhật và ngày lễ).
- **Thanh toán (settlement)**: bước chuyển tiền và chứng khoán giữa các bên qua hệ thống lưu ký (VSD) và ngân hàng thanh toán.
- **Sao kê (statement)**: bản ghi đối chiếu số dư, giao dịch theo kỳ. Hay dùng để khách tự kiểm tra.
- **Tiền về chờ (pending cash)**: tiền bán chứng khoán đã khớp nhưng chưa tới ngày thanh toán — hiển thị nhưng chưa dùng được.

### Vì sao phải hold trước khi gửi lệnh
Lệnh chứng khoán có thể khớp ngay lập tức và không thể "undo" một lần khớp. Nếu chỉ kiểm tra lúc khớp, hai request mua 60 triệu từ một tài khoản 100 triệu gửi gần như đồng thời có thể cùng qua kiểm tra, cùng khớp 60 triệu, và tài khoản âm 20 triệu. Hold biến việc kiểm tra thành một thao tác nguyên tử có trạng thái:

1. Nguyên tử: trừ available và tạo bản ghi hold trong **cùng một transaction**.
2. Kiểm tra điều kiện: available phải >= khoản hold, nếu không từ chối ngay.
3. Sổ sách rõ ràng: mọi hold đều có id, lệnh tham chiếu, thời điểm, số tiền, trạng thái.

### Vòng đời của hold
~~~text
Tạo hold (ACTIVE) --lệnh khớp 1 phần--> CONSUMED cho phần khớp + vẫn ACTIVE cho phần còn lại
ACTIVE --lệnh khớp hết--> CONSUMED toàn bộ --> ghi nợ tiền thật / chuyển cổ phiếu
ACTIVE --huỷ lệnh / hết phiên--> RELEASED --> available tăng lại
CONSUMED --không thể đảo--> chỉ đảo bằng giao dịch hoàn/điều chỉnh có duyệt
~~~

Điểm cần nhớ: **hold không phải bút toán kế toán**. Nó là lớp "giữ chỗ" phục vụ kiểm soát sức mua; tiền chỉ thực sự di chuyển ở bước thanh toán.

### Tiền đi qua những trạng thái nào (ví dụ mua 1.000 cổ phiếu giá 25.000)
1. **Đặt lệnh**: hold = 1.000 × 25.000 = 25.000.000 cộng phí dự kiến (ví dụ 0,15% = 37.500). Available giảm 25.037.500.
2. **Khớp một phần 400**: hold còn ACTIVE 15.022.500 (tương ứng 600 cổ phiếu), phần 400 chuyển CONSUMED; sinh nghĩa vụ thanh toán.
3. **Khớp hết**: toàn bộ hold CONSUMED; khoản tiền vào hàng đợi thanh toán T+2.
4. **T+2**: tiền rời tài khoản (ghi nợ), cổ phiếu vào tài khoản chứng khoán của khách. Nếu khách bán ngay trong T+0 hoặc T+1, tuỳ quy định hiện hành, cổ phiếu mua chưa về nên có thể chưa bán được (trước đây phải chờ T+2, hiện nhiều thị trường cho bán trong ngày nhưng tiền chỉ dùng được sau thanh toán).
5. **Huỷ phần còn lại**: nhả hold đúng phần chưa khớp.

### Code minh hoạ: hold và nhả hold an toàn
~~~java
// Trừ available có điều kiện để không bao giờ âm, kèm tạo hold trong cùng transaction
@Transactional
public Hold holdForOrder(long accountId, long orderId, BigDecimal amount) {
    int n = jdbc.update("""
        UPDATE cash_account
           SET available = available - ?
         WHERE id = ? AND available >= ?
        """, amount, accountId, amount);       // điều kiện available >= amount là chốt chặn
    if (n != 1) throw new InsufficientFunds(accountId, amount);
    return holdRepo.insert(accountId, orderId, amount, HoldStatus.ACTIVE);
}

// Nhả hold đúng một lần: chuyển ACTIVE -> RELEASED bằng CAS để job chạy lặp không cộng tiền 2 lần
@Transactional
public void release(long holdId) {
    int n = holdRepo.updateStatusIfCurrent(holdId, HoldStatus.ACTIVE, HoldStatus.RELEASED);
    if (n == 1) {
        holdRepo.addAvailable(holdId);          // cộng tiền lại cho available
    }
}
~~~

Hai chốt chặn quan trọng: {{WHERE available >= amount}} (không âm) và CAS ACTIVE -> RELEASED (job chạy lại không cộng tiền hai lần).

### Bảng: hold theo giá nào và nhả khi nào
| Quyết định | Lựa chọn A | Lựa chọn B | Gợi ý |
|---|---|---|---|
| Hold giá nào khi mua LO | Theo giá đặt | Theo giá trần | Giá trần an toàn hơn nhưng giữ nhiều tiền hơn; thực tế hay hold theo giá đặt + phí, kiểm tra lại lúc khớp |
| Khi nào nhả hold | Ngay khi gửi huỷ | Khi sàn xác nhận huỷ | Chờ xác nhận, vì lệnh có thể khớp trong lúc chờ |
| Xử lý hold khi khớp một phần | Giữ nguyên cả khoản | Tách phần khớp và phần còn lại | Tách rõ ràng, dễ đối soát |

### Lỗi hay gặp
- Cộng available khi nhả hold mà không kiểm tra trạng thái, job retry làm khách có thêm tiền "từ trên trời".
- Hold nhưng không bao giờ có job dọn hold mồ côi (lệnh bị xoá, phiên đổi), tiền bị giữ vĩnh viễn.
- Trộn available và balance trong cùng một cột, không thể giải thích cho khách vì sao "có tiền mà không mua được".
- Hiển thị tiền bán chứng khoán là khả dụng ngay khi khớp, khách dùng tiền trước ngày thanh toán rồi âm quỹ.
- Nhả hold khi khách sửa lệnh nhưng lệnh cũ vẫn khớp được.

### Ví dụ đời thực
Một công ty chứng khoán bị khiếu nại hàng loạt sau một buổi sáng có sự cố mạng: khách huỷ lệnh, hold được nhả, nhưng do job tra soát chạy lại sau đó, hold bị nhả lần hai và available tăng gấp đôi. Một số khách dùng "tiền ảo" đó mua tiếp, cuối ngày âm 1,7 tỷ đồng phải xử lý thủ công. Sau khi chuyển sang CAS ACTIVE -> RELEASED và thêm ràng buộc tổng available luôn bằng balance trừ tổng hold ACTIVE (kiểm tra trong job đối soát nội bộ mỗi 5 phút), sự cố không lặp lại; thời gian phát hiện lệch giảm từ cuối ngày xuống dưới 5 phút.

### Trả lời mẫu khi phỏng vấn
"Hold là cách tôi đảm bảo khách không tiêu hai lần cùng một khoản. Khi đặt lệnh mua, tôi trừ số dư khả dụng và tạo bản ghi hold trong cùng một transaction, với điều kiện available lớn hơn hoặc bằng khoản hold — nếu không thì từ chối ngay. Hold có trạng thái ACTIVE, CONSUMED, RELEASED; khớp một phần thì phần khớp chuyển CONSUMED, phần còn lại vẫn ACTIVE; khớp hết thì toàn bộ CONSUMED và khoản tiền đi vào hàng đợi thanh toán T+2; huỷ hoặc hết phiên thì RELEASED và available tăng lại. Nhả hold tôi làm bằng compare-and-set ACTIVE sang RELEASED, nên job chạy lại không cộng tiền hai lần. Điểm quan trọng là hold không phải bút toán: tiền chỉ thực sự rời tài khoản ở bước thanh toán, còn tiền bán chưa tới T+2 thì hiển thị là đang chờ, không cho dùng. Tôi luôn có job đối soát tổng available bằng balance trừ tổng hold để phát hiện lệch sớm."

> Senior tip: hãy xem hold như một sổ cái phụ có số dư riêng, và đối soát nó liên tục: tổng hold ACTIVE theo tài khoản phải khớp đúng phần chênh giữa balance và available. Khi con số này lệch, gần như luôn là hold bị nhả hai lần hoặc hold mồ côi — cả hai đều là lỗi tiền, không phải lỗi hiển thị.

> Cụm từ: Hold là tạm giữ tiền/chứng khoán cho một lệnh. Available là số dư được phép dùng. T+2 là thanh toán vào ngày làm việc thứ hai sau ngày khớp.
`,
  follow: [
    'Nếu khách bán chứng khoán vừa mua trong T+0, hệ thống xử lý hold cổ phiếu chưa về thế nào?',
    'Bạn đối soát hold với balance và available ra sao, và tần suất bao nhiêu là hợp lý?',
    'Khi sàn huỷ lệnh hàng loạt do sự cố, làm sao nhả hold an toàn và đúng thứ tự?'
  ],
  tags: ['hold', 'số dư khả dụng', 'T+2', 'thanh toán', 'chứng khoán', 'sức mua']
},
{
  id: 'banking-086',
  topic: 'banking',
  level: 'lead',
  q: 'Giao dịch ký quỹ (margin) hoạt động thế nào: tỷ lệ ký quỹ ban đầu, tỷ lệ duy trì, call margin và bán giải chấp (force sell) — bạn thiết kế hệ thống tính toán và cảnh báo ra sao?',
  a: `**Tóm tắt:** Giao dịch ký quỹ cho khách vay tiền của công ty chứng khoán để mua chứng khoán, thế chấp chính số chứng khoán đã mua cùng tài sản có sẵn. Hệ thống phải tính liên tục **tỷ lệ ký quỹ** (giá trị tài sản ròng chia giá trị khoản vay); khi tỷ lệ này rơi xuống dưới ngưỡng duy trì, hệ thống gọi ký quỹ thêm (call margin); xuống dưới ngưỡng giải chấp thì bán giải chấp để đưa tài khoản về ngưỡng an toàn. Đây là bài toán vừa tính đúng tiền, vừa phải chạy đúng giờ, vừa phải chịu được biến động giá lớn trong ngày.

### Thuật ngữ
- **Margin (ký quỹ)**: khách bỏ một phần vốn, công ty chứng khoán cho vay phần còn lại. Ví dụ đời thường: mua nhà trả góp — bạn có 30% tiền, ngân hàng cho vay 70%, và căn nhà là tài sản thế chấp.
- **Tỷ lệ ký quỹ ban đầu (initial margin)**: phần vốn khách phải tự có khi mở vị thế, ví dụ 50% nghĩa là mua 100 triệu thì khách bỏ 50 triệu, vay 50 triệu.
- **Tài sản ròng (equity)**: giá trị chứng khoán hiện tại cộng tiền mặt, trừ khoản vay và lãi vay. Nếu giá cổ phiếu giảm, equity giảm theo.
- **Tỷ lệ ký quỹ (margin ratio)**: equity chia cho giá trị chứng khoán (hoặc chia cho dư nợ, tuỳ quy ước — phải thống nhất và ghi rõ trong tài liệu). Ví dụ equity 50 triệu, chứng khoán 100 triệu thì tỷ lệ 50%.
- **Tỷ lệ duy trì (maintenance margin)**: ngưỡng tối thiểu phải giữ, ví dụ 35–40%. Dưới ngưỡng này thì phát sinh nghĩa vụ bổ sung tài sản.
- **Call margin (gọi ký quỹ)**: thông báo yêu cầu khách nộp thêm tiền hoặc bán bớt chứng khoán trong thời hạn quy định.
- **Force sell (bán giải chấp)**: công ty chứng khoán chủ động bán chứng khoán của khách để thu hồi nợ khi khách không xử lý call margin kịp.
- **Danh mục được vay (marginable list)**: chỉ một số mã được phép giao dịch ký quỹ, và mỗi mã có tỷ lệ cho vay riêng.

### Vì sao phải tính theo giá thị trường liên tục, không theo giá đặt
Giá cổ phiếu đổi trong suốt phiên. Nếu chỉ tính margin một lần khi đặt lệnh, một cú giảm 7% (hết biên độ một phiên) có thể đẩy tài khoản từ an toàn xuống dưới ngưỡng giải chấp mà hệ thống không biết. Vì vậy:
1. Mỗi khi có giá khớp mới hoặc giá tham chiếu cập nhật, cần tính lại equity.
2. Không cần tính lại toàn bộ tài khoản cho mọi tick; thường dùng tính toán theo lô (batch) vài giây một lần cộng với tính tức thời khi có giao dịch làm thay đổi vị thế.
3. Mức độ trễ phải được nêu rõ: cảnh báo dựa trên giá cách đây 5 giây khác với giá realtime, và điều này ảnh hưởng trách nhiệm pháp lý.

### Công thức và ví dụ số cụ thể
Giả sử khách có 60 triệu tiền mặt, vay thêm 40 triệu (tỷ lệ vay 40%), mua 100 triệu cổ phiếu A.

~~~text
equity       = giá trị chứng khoán - dư nợ vay - lãi vay
margin ratio = equity / giá trị chứng khoán
~~~

| Tình huống | Giá trị CK | Dư nợ | Equity | Tỷ lệ | Trạng thái |
|---|---|---|---|---|---|
| Mới mua | 100 | 40 | 60 | 60% | An toàn |
| Giảm 10% | 90 | 40 | 50 | 55,6% | An toàn |
| Giảm 30% | 70 | 40 | 30 | 42,9% | Gần ngưỡng duy trì |
| Giảm 40% | 60 | 40 | 20 | 33,3% | Dưới duy trì 35% -> call margin |
| Giảm 47% | 53 | 40 | 13 | 24,5% | Dưới ngưỡng giải chấp 25% -> force sell |

Ví dụ trên cho thấy chỉ cần giảm khoảng 40% là tài khoản vào diện nguy hiểm — trong khi một cổ phiếu có thể giảm 7% mỗi phiên, tức khoảng 6 phiên sàn liên tiếp.

### Thiết kế hệ thống: các thành phần
1. **Sổ vị thế và sổ nợ**: mỗi tài khoản có vị thế theo mã (số lượng, giá vốn, giá thị trường), dư nợ gốc, lãi vay tích luỹ theo ngày. Dùng BigDecimal với scale cố định, không dùng double.
2. **Bộ tính margin**: nhận snapshot giá, tính equity và tỷ lệ; thuần tuý, không side effect, để test dễ và chạy lại được.
3. **Máy trạng thái tài khoản**: NORMAL, WATCH, CALL_MARGIN, FORCE_SELL_PENDING, FORCE_SELLED, CLOSED. Chuyển trạng thái chỉ khi vượt ngưỡng, và có thời gian ân hạn theo hợp đồng.
4. **Bộ thông báo**: gửi cảnh báo qua app, SMS, email với nội dung rõ: thiếu bao nhiêu tiền, hạn bao lâu, hậu quả nếu không xử lý. Đây là bằng chứng pháp lý, phải lưu lại bản đã gửi.
5. **Bộ giải chấp**: chỉ bán đúng lượng cần thiết để đưa tỷ lệ về ngưỡng an toàn, ưu tiên mã thanh khoản cao, và ghi lại lý do, người/kíp duyệt nếu quy trình yêu cầu.

### Code minh hoạ: tính margin và quyết định trạng thái
~~~java
public MarginState evaluate(Position p, BigDecimal price, BigDecimal loan, MarginPolicy pol) {
    BigDecimal marketValue = p.qty().multiply(price).setScale(0, RoundingMode.DOWN);
    BigDecimal equity = marketValue.subtract(loan);                       // tài sản ròng
    if (marketValue.signum() == 0) return MarginState.CLOSED;

    // So sánh bằng cross-multiply để tránh chia số lẻ và sai số làm tròn
    BigDecimal ratio = equity.divide(marketValue, 6, RoundingMode.DOWN);

    if (ratio.compareTo(pol.forceSellThreshold()) < 0) return MarginState.FORCE_SELL_PENDING;
    if (ratio.compareTo(pol.maintenanceThreshold()) < 0) return MarginState.CALL_MARGIN;
    if (ratio.compareTo(pol.maintenanceThreshold().add(pol.warnBuffer())) < 0)
        return MarginState.WATCH;
    return MarginState.NORMAL;
}

// Số tiền cần nộp để về ngưỡng an toàn: equity' = target * marketValue  ->  thêm = target*MV - equity
public BigDecimal topUpNeeded(BigDecimal marketValue, BigDecimal equity, BigDecimal target) {
    return target.multiply(marketValue).subtract(equity).max(BigDecimal.ZERO)
                 .setScale(0, RoundingMode.CEILING);
}
~~~

Điểm tinh tế: **ngưỡng phải so sánh bằng số đã làm tròn cùng quy ước**, nếu không có tài khoản nằm sát ngưỡng sẽ nhảy trạng thái qua lại liên tục (hiện tượng rung), gửi thông báo trùng và làm khách hoảng.

### Bảng trade-off: tính margin khi nào
| Cách | Độ chính xác | Tải hệ thống | Ghi chú |
|---|---|---|---|
| Realtime mỗi tick giá | Cao nhất | Rất lớn | Chỉ nên cho tài khoản sát ngưỡng hoặc dùng streaming tính toán |
| Batch vài giây một lần | Cao, trễ vài giây | Vừa | Phổ biến; cần nêu rõ độ trễ trong hợp đồng |
| Tính khi có giao dịch | Thấp khi giá biến động | Nhỏ | Không đủ an toàn làm cơ chế duy nhất |

Thực tế thường kết hợp: batch định kỳ cho toàn bộ, cộng tính đẩy ngay khi một lệnh khớp hoặc khi giá vượt ngưỡng cảnh báo.

### Lỗi hay gặp
- Tính margin theo giá đặt lệnh thay vì giá thị trường hiện tại.
- Trộn quy ước tỷ lệ (equity/chứng khoán so với equity/dư nợ) giữa các màn hình, khách thấy hai con số khác nhau.
- Không tính lãi vay vào equity, khiến tỷ lệ thực tế thấp hơn hiển thị.
- Force sell bán toàn bộ danh mục dù chỉ cần một phần, gây thiệt hại cho khách và tranh chấp.
- Cảnh báo gửi trùng hàng trăm lần do rung trạng thái quanh ngưỡng; khách tưởng bị làm phiền và bỏ qua cảnh báo thật.
- Không lưu bằng chứng đã gửi cảnh báo: khi tranh chấp, không chứng minh được khách đã được thông báo.
- Dùng double cho tiền và giá dẫn tới sai ngưỡng ở đúng biên.

### Ví dụ đời thực
Một công ty chứng khoán tính margin theo lô 60 giây. Trong một phiên có tin xấu, cổ phiếu A giảm sàn hai phiên liên tiếp; tài khoản 1.240 khách vượt ngưỡng giải chấp nhưng batch chỉ phát hiện sau 60 giây, và lệnh bán giải chấp bị đẩy vào lúc giá đã sàn nên không khớp, dư nợ xấu tăng. Sau khi thêm tính đẩy theo sự kiện khi giá cập nhật và vượt ngưỡng cảnh báo (độ trễ p99 khoảng 800ms) cùng cơ chế đặt lệnh giải chấp có giá linh hoạt theo biên độ, tỷ lệ tài khoản âm vốn giảm từ 0,9% xuống 0,2% số tài khoản margin; số thông báo trùng giảm nhờ thêm khoảng đệm chống rung quanh ngưỡng.

### Trả lời mẫu khi phỏng vấn
"Margin là cho khách vay để mua chứng khoán, thế chấp bằng chính danh mục. Hệ thống của tôi tính equity bằng giá trị chứng khoán theo giá thị trường trừ dư nợ và lãi vay, rồi tính tỷ lệ ký quỹ. Ba ngưỡng cần có: ngưỡng cảnh báo, ngưỡng duy trì và ngưỡng giải chấp. Khi tỷ lệ xuống dưới ngưỡng duy trì thì chuyển trạng thái call margin và gửi thông báo kèm số tiền cần nộp, hạn và hậu quả; dưới ngưỡng giải chấp thì bán một phần đủ để đưa về ngưỡng an toàn, không bán sạch. Tôi tính theo batch vài giây một lần cho toàn bộ, cộng tính đẩy khi giá cập nhật và chạm ngưỡng cảnh báo, vì chờ 60 giây trong phiên giảm mạnh là quá lâu. Tiền và giá dùng BigDecimal với quy ước làm tròn thống nhất, có khoảng đệm chống rung quanh ngưỡng, và mọi thông báo, quyết định giải chấp đều lưu lại làm bằng chứng."

> Senior tip: khoảng đệm chống rung (hysteresis) quanh mỗi ngưỡng là bắt buộc, không phải tuỳ chọn. Không có nó, một tài khoản nằm đúng ngưỡng sẽ nhận hàng trăm thông báo mỗi phiên và bạn mất uy tín đúng lúc khách cần tin bạn nhất. Đồng thời hãy lưu mọi bản thông báo đã gửi kèm thời điểm và nội dung — đó là thứ bảo vệ cả khách và công ty khi có tranh chấp.

> Cụm từ: Margin là giao dịch ký quỹ (vay để mua). Equity là tài sản ròng. Call margin là yêu cầu nộp thêm tài sản. Force sell là bán giải chấp để thu hồi nợ.
`,
  follow: [
    'Bạn xử lý thế nào khi giá giảm sàn liên tiếp khiến lệnh giải chấp không khớp được?',
    'Làm sao tránh rung trạng thái quanh ngưỡng và tránh gửi thông báo trùng cho khách?',
    'Bạn thiết kế và kiểm thử bộ tính margin để chắc chắn đúng khi có khớp một phần, lãi vay và nhiều mã?'
  ],
  tags: ['margin', 'call margin', 'force sell', 'ký quỹ', 'chứng khoán', 'risk']
},
{
  id: 'banking-087',
  topic: 'banking',
  level: 'senior',
  q: 'Tính lãi tiền gửi/tiền vay theo ngày dùng quy ước actual/365 như thế nào? Làm tròn ra sao và xử lý ngày nghỉ, ngày lễ?',
  a: `**Tóm tắt:** Dùng BigDecimal, tính số ngày thực tế giữa hai ngày (actual), chia cho 365 (hoặc 360 theo quy ước của sản phẩm), làm tròn theo Half-Up ở bước cuối cùng, và chỉ tính ngày làm việc theo lịch cut-off; tiền lãi luôn ghi nhận như một bút toán riêng, không cộng vào gốc tự động nếu hợp đồng không cho phép.

### Actual/365 là gì
- Actual/365: lãi = gốc × lãi suất × (số ngày thực tế / 365).
- Actual/360: chia cho 360 (phổ biến trong vay USD).
- 30/360: giả định mỗi tháng 30 ngày (phổ biến trái phiếu).
- Phải thống nhất theo sản phẩm và ghi rõ trong hợp đồng.

### Tính số ngày
- Dùng LocalDate và ChronoUnit.DAYS.between(start, end).
- Ngày bắt đầu không tính, ngày kết thúc tính (convention) hoặc ngược lại — ghi rõ trong code và hợp đồng.
- Ngày nghỉ/lễ: nếu ngày đến hạn rơi vào cuối tuần hoặc lễ, dời theo quy tắc modified following (dời đến ngày làm việc tiếp theo, trừ khi sang tháng khác thì lùi lại).

### Làm tròn
- Tính lãi theo từng kỳ với độ chính xác cao (scale 10), chỉ làm tròn ở bước cuối.
- Dùng RoundingMode.HALF_UP hoặc HALF_EVEN theo quy định ngân hàng.
- Tiền lãi nhỏ (< 1 đồng) tích lũy vào kỳ sau, không mất.

### Code ví dụ
~~~java
public BigDecimal calcInterest(BigDecimal principal, BigDecimal rate, LocalDate from, LocalDate to) {
    long days = ChronoUnit.DAYS.between(from, to);
    BigDecimal factor = new BigDecimal(days).divide(new BigDecimal(365), 10, RoundingMode.HALF_UP);
    return principal.multiply(rate).multiply(factor).setScale(0, RoundingMode.HALF_UP);
}
~~~

### Ví dụ đời thực
Một ngân hàng tính lãi tiết kiệm 100.000.000 VND, lãi suất 5%/năm, từ 01/01 đến 31/01 (30 ngày): lãi = 100.000.000 × 0,05 × 30/365 = 410.958,9 VND → làm tròn 410.959 VND. Nếu dùng double thì sai vài đồng ở biên; nếu làm tròn từng ngày rồi cộng thì sai nhiều hơn.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng BigDecimal cho mọi tính toán tiền, không dùng double. Quy ước ngày actual/365 hoặc 360 theo sản phẩm, tính số ngày bằng ChronoUnit, làm tròn HALF_UP ở bước cuối với scale đủ lớn. Ngày nghỉ/lễ dời theo modified following. Tiền lãi ghi nhận riêng, không cộng gốc trừ khi hợp đồng cho phép. Tôi viết unit test cho biên: ngày đầu/kết, năm nhuận, làm tròn .5, và so sánh với kết quả Excel của phòng kế toán."

> Senior tip: Sai lầm phổ biến nhất là làm tròn lãi từng ngày rồi cộng lại — sai số tích lũy rất lớn. Luôn tính cả kỳ rồi làm tròn một lần. Và đừng quên năm nhuận: 365 hay 366 ảnh hưởng trực tiếp đến lãi.

### Cụm từ: actual/365 là tính lãi theo số ngày thực tế chia cho 365. Modified following là quy tắc dời ngày đến hạn rơi vào ngày nghỉ sang ngày làm việc tiếp theo. Half-Up là làm tròn nửa lên.
`,
  follow: [
    'Bạn xử lý thế nào khi ngày đến hạn rơi vào ngày lễ và dời sang tháng khác?',
    'Làm sao đảm bảo kết quả tính lãi khớp với phòng kế toán?',
    'Bạn lưu trữ và kiểm toán lịch sử tính lãi như thế nào?'
  ],
  tags: ['interest', 'BigDecimal', 'actual/365', 'rounding', 'banking']
},
{
  id: 'banking-088',
  topic: 'banking',
  level: 'senior',
  q: 'Giờ cut-off giao dịch liên ngân hàng và ngày làm việc kế tiếp ảnh hưởng thế nào đến xử lý và hiển thị cho khách?',
  a: `**Tóm tắt:** Cut-off là thời điểm trong ngày sau đó giao dịch không còn được xử lý trong ngày làm việc hiện tại mà chuyển sang ngày làm việc tiếp theo; mọi hiển thị "tiền về khi nào" phải tính theo cut-off và lịch ngày nghỉ, không theo thời gian thực của khách.

### Cut-off là gì
- Cut-off: giờ chốt xử lý trong ngày (ví dụ 16:00 cho chuyển tiền liên ngân hàng).
- Giao dịch trước cut-off: xử lý trong ngày, tiền về cùng ngày (nếu cùng hệ thống) hoặc T+1.
- Giao dịch sau cut-off: chuyển sang ngày làm việc tiếp theo, tiền về T+1 hoặc T+2.

### Ngày làm việc
- Ngày làm việc = thứ 2–6, trừ ngày lễ theo lịch ngân hàng.
- Phải có bảng lịch ngày nghỉ được cập nhật hàng năm và có hiệu lực theo ngày.
- Khi tính ngày làm việc kế tiếp, bỏ qua cuối tuần và lễ.

### Ảnh hưởng đến xử lý
- Khi nhận giao dịch sau cut-off, hệ thống đặt trạng thái PENDING và lên lịch xử lý vào ngày làm việc kế tiếp.
- Phải hiển thị cho khách: "Giao dịch sẽ được xử lý vào ngày X" chứ không phải "thành công".
- Nếu khách chuyển vào thứ 6 sau cut-off, tiền về thứ 2 (bỏ qua cuối tuần).

### Code ví dụ
~~~java
public LocalDate nextBusinessDay(LocalDate date) {
    LocalDate d = date.plusDays(1);
    while (isWeekend(d) || isHoliday(d)) d = d.plusDays(1);
    return d;
}
public boolean isBeforeCutOff(LocalTime now, LocalTime cutOff) {
    return now.isBefore(cutOff);
}
~~~

### Ví dụ đời thực
Một khách chuyển tiền liên ngân hàng lúc 17:30 thứ 6. Cut-off là 16:00, nên giao dịch được đặt PENDING và xử lý thứ 2. Nếu hệ thống hiển thị "thành công" ngay, khách sẽ gọi hotline khi không thấy tiền về. Sau khi thêm thông báo "dự kiến về thứ 2" và trạng thái PENDING rõ ràng, số cuộc gọi về giao dịch chuyển tiền giảm 30%.

### Trả lời mẫu khi phỏng vấn
"Cut-off và ngày làm việc là hai khái niệm cốt lõi trong banking. Tôi thiết kế một service tính ngày làm việc kế tiếp dựa trên lịch ngày nghỉ, và mọi giao dịch sau cut-off được đặt PENDING với ngày xử lý dự kiến. Hiển thị cho khách phải khớp với trạng thái thực tế, không được báo thành công khi chưa xử lý. Tôi cũng đảm bảo scheduler chạy đúng giờ cut-off và có cơ chế retry nếu job thất bại."

> Senior tip: Đừng hard-code lịch ngày nghỉ trong code. Lưu trong database với effective date và cache trong memory, cập nhật qua admin. Một năm có năm nhuận và thay đổi lịch lễ; hard-code sẽ gây lỗi đúng lúc lễ.

### Cụm từ: cut-off là giờ chốt xử lý trong ngày. Ngày làm việc là ngày ngân hàng mở cửa xử lý giao dịch. PENDING là trạng thái chờ xử lý.
`,
  follow: [
    'Bạn xử lý thế nào khi lịch ngày nghỉ thay đổi giữa chừng?',
    'Làm sao đảm bảo scheduler chạy đúng giờ cut-off và không bị miss?',
    'Bạn hiển thị trạng thái giao dịch cho khách như thế nào để tránh hiểu lầm?'
  ],
  tags: ['cut-off', 'business day', 'pending', 'banking']
},
{
  id: 'banking-089',
  topic: 'banking',
  level: 'lead',
  q: 'Tích hợp với core banking cũ qua lớp middleware/ESB: timeout, đối soát và giới hạn throughput xử lý thế nào?',
  a: `**Tóm tắt:** Middleware/ESB là lớp trung gian giữa kênh số và core banking cũ; phải thiết kế timeout ngắn, retry có kiểm soát, idempotency key, circuit breaker và đối soát tự động để xử lý trường hợp timeout không rõ kết quả.

### Middleware/ESB là gì
- Middleware (phần mềm trung gian): lớp nằm giữa các hệ thống, chuyển đổi định dạng và điều phối message.
- ESB (Enterprise Service Bus): một dạng middleware tập trung, định tuyến và chuyển đổi protocol.
- Core banking cũ thường chỉ hỗ trợ protocol cũ (ISO 8583, MQ, SOAP) và throughput thấp.

### Timeout
- Đặt timeout ngắn (3–5 giây) cho mỗi call đến core.
- Nếu timeout, không biết giao dịch thành công hay thất bại → trạng thái UNKNOWN.
- Phải có cơ chế tra soát (inquiry) để hỏi lại core về trạng thái giao dịch.

### Idempotency
- Mỗi request mang idempotency key (transaction id).
- Nếu retry, core phải nhận ra key đã xử lý và trả kết quả cũ, không xử lý lại.
- Lưu key trong database với TTL phù hợp.

### Circuit breaker
- Dùng Resilience4j hoặc Spring Cloud Circuit Breaker.
- Khi core lỗi liên tục, ngắt mạch để không làm nghẽn kênh số.
- Sau thời gian chờ, thử lại với một request (half-open).

### Đối soát
- Chạy batch định kỳ (mỗi 5 phút hoặc cuối ngày) so sánh giao dịch giữa kênh và core.
- Phát hiện lệch và tự động xử lý hoặc alert.

### Giới hạn throughput
- Core cũ có giới hạn TPS thấp (ví dụ 50 TPS).
- Dùng queue/buffer để làm phẳng traffic, tránh spike.
- Rate limit ở gateway để bảo vệ core.

### Ví dụ đời thực
Một ngân hàng có core banking cũ xử lý tối đa 30 TPS. Trong giờ cao điểm, kênh số gửi 200 TPS → core quá tải, timeout hàng loạt. Sau khi thêm queue làm phẳng traffic, rate limit ở gateway (25 TPS), circuit breaker và cơ chế tra soát tự động, tỷ lệ timeout giảm từ 8% xuống 0,3%, và mọi giao dịch timeout đều được tra soát và xử lý trong vòng 2 phút.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế một adapter layer bọc core banking cũ, với timeout ngắn, idempotency key, circuit breaker và retry có kiểm soát. Khi timeout, đặt trạng thái UNKNOWN và lên lịch tra soát tự động. Dùng queue để làm phẳng traffic và rate limit để bảo vệ core. Đối soát chạy định kỳ và alert khi có lệch. Tôi cũng ghi log đầy đủ để điều tra khi có sự cố."

> Senior tip: Sai lầm lớn nhất là retry ngay khi timeout mà không có idempotency — có thể trừ tiền khách hai lần. Luôn có idempotency key và cơ chế tra soát trước khi retry. Và đừng quên circuit breaker: khi core đang chết, tiếp tục gọi chỉ làm mọi thứ tệ hơn.

### Cụm từ: ESB là bus dịch vụ doanh nghiệp, trung gian giữa các hệ thống. Circuit breaker là cơ chế ngắt mạch khi downstream lỗi liên tục. Idempotency là đảm bảo thực thi nhiều lần cho cùng kết quả.
`,
  follow: [
    'Bạn xử lý thế nào khi tra soát cũng timeout?',
    'Làm sao đảm bảo idempotency key không bị trùng giữa các hệ thống?',
    'Bạn monitor và alert cho integration với core như thế nào?'
  ],
  tags: ['core banking', 'ESB', 'middleware', 'timeout', 'idempotency', 'circuit breaker']
}
);
