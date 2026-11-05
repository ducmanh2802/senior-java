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
title: Khach xem so du qua app
actors: Khach | App | Gateway | Core | DB
Khach -> App: mo app, nhan xem so du
App -> Gateway: GET tai khoan so du
Gateway -> Core: tra cuu so du khach A
Core -> DB: doc so du
DB --> Core: tra ve 10.000.000 VND
Core --> Gateway: 10.000.000 VND
Gateway --> App: 200 OK + so du
App --> Khach: hien thi 10.000.000 VND
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
title: Chuyen khoan lien ngan hang 24/7 qua NAPAS
actors: Khach gui | Ngan hang gui | NAPAS | Ngan hang nhan | Khach nhan
Khach gui -> Ngan hang gui: yeu cau chuyen tien 5 trieu VND
Ngan hang gui -> NAPAS: gui goi giao dich
NAPAS -> Ngan hang nhan: kiem tra tai khoan va cap nhat so du
Ngan hang nhan --> NAPAS: chấp nhận, tien da den
NAPAS --> Ngan hang gui: thong bao thanh cong
Ngan hang gui --> Khach gui: thong bao da chuyen xong
Ngan hang nhan --> Khach nhan: thong bao nhan tien
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
title: Ghi giao dich chuyen tien vao so cai kep
actors: App | Dich vu | LedgerDB | App
App -> Dich vu: yeu cau chuyen 2 trieu A -> B
Dich vu -> LedgerDB: ghi dong 1: A -2 trieu
Dich vu -> LedgerDB: ghi dong 2: B +2 trieu
LedgerDB --> Dich vu: kiem tra tong bang 0, commit
Dich vu --> App: thong bao thanh cong
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
- Giao dich chua khop: mot ben ghi giao dich, ben kia chua ghi (vi du nhan vien nhap sai ma tai khoan).
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
title: Doi soat cuoi ngay va xu ly lech
actors: Ngan hang A | NAPAS | Ngan hang B | Nhan vien tra sot
Ngan hang A -> NAPAS: gui 100 giao dich, 500 trieu
NAPAS -> Ngan hang B: chuyen tien
Ngan hang B --> NAPAS: nhan 99 giao dich, 495 trieu
NAPAS --> Ngan hang A: bao cao 99/100, lech 5 trieu
Nhan vien tra sot -> Ngan hang A: kiem tra nhat ky giao dich lech
Nhan vien tra sot -> Ngan hang B: xac nhan chua nhan 5 trieu
Nhan vien tra sot -> Ngan hang B: cong 5 trieu tai khoan nhan
Nhan vien tra sot --> Ngan hang A: bao cao ket qua
~~~

### Lỗi hay gặp
- Chỉ đối soát tổng số tiền, không kiểm tra từng giao dịch -> bị bỏ lọc giao dịch lệch nhỏ nhiều lần.
- Tra soát nhưng không ghi lại nguyên nhân -> cùng lỗi xảy ra lại trong ngày sau.
- Điều chỉnh sổ cái không được phán duyệt (maker-checker) -> nhân viên sửa số tiền theo ý muốn, gây rủi ro gian lận.
- Thông báo lệch muộn -> khách phàn nàn, ngân hàng mất uy tín.
- Không có giới hạn thời gian xử lý lệch -> giao dịch treo float tháng năm, báo cáo sai.

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
title: Giao dich vao ngay le sau cut-off
actors: Khach | App | Ngan hang | He thong xu ly
Khach -> App: gui tien 100 trieu luc 23h ngay Chu Nhat
App -> Ngan hang: gui giao dich
Ngan hang -> He thong xu ly: chấp nhận, tinh value date = ngay lam viec dau tien tuan sau
He thong xu ly --> Ngan hang: da chấp nhận
Ngan hang --> Khach: thong bao da chấp nhận, tien cong ngay lam viec tiep theo
~~~

### Lỗi hay gặp
- Tính ngày giao dịch bằng ngày hiện tại, không kiểm tra cut-off và ngày lễ -> value date sai, lãi sai.
- Không phân biệt ngày làm việc và ngày thực tế -> sai số dư, khách phàn nàn.
- Tính lãi trong ngày lễ như một ngày bình thường cho sản phẩm chỉ tính lãi trong ngày làm việc -> sai số tiền lãi.
- Thông báo cho khách tiền đã được cộng nhưng value date chưa đến -> khách hoang mang, gọi điện bàn chuyển.

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
title: Maker-checker chuyen tien trong back-office
actors: Maker | Checker | He thong | Nhan vien
Maker -> He thong: tao yeu cau chuyen 500 trieu
He thong --> Maker: da luu, trang thai cho duyet
Maker --> Checker: thong bao co yeu cau moi
Checker -> He thong: xem yeu cau, kiem tra tai khoan
Checker -> He thong: duyet yeu cau
He thong --> Checker: da duyet, tien duoc chuyen
He thong -> Nhan vien: ghi audit trail (mai, duyet, 14:32, 500 trieu)
~~~

### Lỗi hay gặp
- Một nhân viên đồng thời là maker và checker -> không có khi kiểm, dễ gian lận.
- Checker duyệt không kiểm tra tài khoản -> được chuyển tiền sai, bị mất tiền.
- Audit trail không ghi IP hoặc thời gian -> không biết lỗi xuất phát ở đâu.
- Phân quyền quá rộng (một nhân viên nhiều vai trò) -> có thể sửa hạn mức và duyệt cùng lúc.
- Không kiểm tra quyền mỗi lần nhấn nút -> sau khi đăng nhập, nhân viên có thể truy cập trang không được phép.

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
title: Nhan vien xem thong tin khach da che
actors: Nhan vien | He thong | Co so du lieu
Nhan vien -> He thong: xem tai khoan khach A
He thong -> Co so du lieu: lay thong tin khach
Co so du lieu --> He thong: CMND da ma hoa, so the da che
He thong --> Nhan vien: hien thi ho ten, CMND che, the che
~~~

### Lỗi hay gặp
- Lưu mật khẩu ở dạng văn bản thô -> nếu cơ sở dữ liệu bị lộ, tất cả mật khẩu bị theft.
- Hiển thị đầy đủ số thẻ/CMND trên màn hình hoặc in hóa đơn -> mất mật thông tin.
- Ghi số thẻ vào log để debug -> log bị lưu, kẻ xấu xem được thẻ.
- Không che số điện thoại khi gửi thông báo cho khách khác -> mất mật liên hệ.
- Nhân viên thủ ngân có thể xem toàn bộ số CMND -> vi phạm quyền ít nhất.

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
title: Thanh toan the voi token va log che
actors: Khach | He thong thanh toan | Token Vault | Log
Khach -> He thong thanh toan: nhap so the, thanh toan
He thong thanh toan -> Token Vault: doi so the thanh token
Token Vault --> He thong thanh toan: tra ve token tok_abc123
He thong thanh toan -> Log: ghi log "the **** **** **** 3456 thanh cong"
Log --> He thong thanh toan: da ghi
~~~

### Lỗi hay gặp
- Lưu CVV trong cơ sở dữ liệu -> vi phạm PCI DSS, nếu bị lộ kẻ xấu có thể mua online.
- Lưu số thẻ thật ở dạng văn bản thô -> nếu bị lộ, tất cả thẻ bị theft.
- Ghi số thẻ đầy đủ vào log để debug -> mất mật thẻ.
- Token không được mã hóa hoặc lưu ở hệ thống không bảo mật -> kẻ xấu lấy được token và số thẻ.
- Nhân viên có thể xem số thẻ đầy đủ trong hệ thống quản lý -> vi phạm quyền ít nhất.

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
title: Rut tien ATM dung ISO 8583
actors: Khach | ATM | He thong the | Mang the | Ngan hang
Khach -> ATM: chụp thẻ, nhap ma pin, rut 2 trieu
ATM -> He thong the: gui thong bao ISO 8583 MTI 0100
He thong the -> Mang the: chuyen tiep yeu cau
Mang the -> Ngan hang: kiem tra tai khoan, so du
Ngan hang --> Mang the: tra loi MTI 0110, ma 00 thanh cong
Mang the --> He thong the: tra loi ket qua
He thong the --> ATM: cho phep rut tien
ATM --> Khach: phat 2 trieu, in hoa don
~~~

### Lỗi hay gặp
- Chung ISO 8583 và ISO 20022 là cùng một -> là hai chuẩn khác nhau, ứng dụng khác nhau.
- Điền sai trường ISO 8583 (cần biết trường nào dùng cho gì) -> gửi sai dữ liệu, ngân hàng đối tác từ chối.
- Thấy ISO 20022 như đơn giản (chỉ có số tiền và tài khoản) -> thiếu thông tin, giao dịch bị không chấp nhận.
- Không cập nhật khi chuẩn thay đổi (ví dụ ISO 20022 có nhiều phiên bản) -> hệ thống cũ bị lỗi khi kết nối với đối tác mới.

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
title: Tinh lai tien gui voi BigDecimal
actors: App | Tinh lai | CSDL | App
App -> Tinh lai: yeu tinh lai 100 trieu, 6% nam, 30 ngay
Tinh lai -> CSDL: doc du no, lai suat, so ngay
CSDL --> Tinh lai: du no 100 trieu, 6%, 30 ngay
Tinh lai --> App: 493.150.68 VND (da lam tron)
App --> Khach: hien thi so tien lai
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
    return remaining.min(requested);      // capture khong bao lon hon so con duoc giu
}
~~~

### Vì sao tiền "bị giữ" vài ngày — nguyên nhân thật
- Auth có hạn: merchant quên capture thì hold tự hết sau vài ngày (khách sạn, xăng, cho thuê xe thường giữ lâu hơn vì số tiền cuối chưa biết).
- Capture và settlement chạy theo lô cuối ngày, không chạy tức thời.
- Giao dịch nước ngoài: số tiền hold là ước lượng theo tỷ giá tạm tính, số capture chính thức có thể lệch vài chục nghìn đồng, app phải hiển thị số "tạm giữ".

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
Vi du minh hoa cau truc TLV (khong phai payload that cua ngan hang nao):
00 02 01            : phien ban
01 02 12            : kieu QR (12 = thanh toan hang hoa, dich vu)
26 26 0010 970436 0114 1028394056 : BIN ngan hang tho huong + so tai khoan
52 04 5311          : MCC cua hang ban le
53 03 704           : tien te VND
54 06 250.00        : so tien
59 15 CUA HANG A    : ten nguoi ban
60 06 HA NOI        : thanh phan
58 02 VN            : quoc gia
62 17 01 13 A123456 : ma don hang (truong con ben trong)
63 04 B7F2          : CRC
~~~

Số tiền trong QR chỉ là **đề nghị**; khách vẫn có thể đổi (với QR tĩnh) hoặc app vẫn phải hiện màn hình xác nhận. Vì vậy người bán không được lấy số tiền từ QR làm bằng chứng đã thu, mà phải lấy số tiền ghi trên sổ.

### Luồng từ app khách tới tài khoản người bán
~~~seq
title: Khach quet VietQR thanh toan 250.000
actors: Khach | App khach | NAPAS | Core nguoi ban | POS nguoi ban
Khach -> App khach: mo app, quet QR
App khach -> App khach: doc TLV, hien ten va so tien
Khach -> App khach: xac nhan "Chuyen 250.000"
App khach -> NAPAS: lenh chuyen khoan nhanh 24/7
NAPAS -> Core nguoi ban: ghi co tai khoan nguoi ban
Core nguoi ban --> NAPAS: da cap nhat so du
NAPAS --> App khach: thanh cong, kem ma tham chieu
App khach --> Khach: hien thi "Da chuyen"
Core nguoi ban -> POS nguoi ban: webhook bao co
POS nguoi ban -> POS nguoi ban: doi chieu, xac nhan don A123456
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
  order_code    VARCHAR(32)  NOT NULL UNIQUE,      -- ma don in trong noi dung chuyen khoan
  amount        NUMERIC(20,0) NOT NULL,            -- VND, khong dung so thap phan
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
  PRIMARY KEY (mandate_id, period_key)        -- mot ky chi duoc thu mot lan
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
So du cuoi lan chay thu #4  (toan bo 2.113.402 tai khoan)
MATCH            2.113.398
EXPLAINED             4   (3 tai khoan chet da doi soat tay, 1 lenh phí - da co bien ban)
UNEXPLAINED           0   <-- dieu kien can de cut-over: bang 0
Tong GL vs tong so du:  chenh 0
So du am bat thuong:     0
Tai khoan khong map duoc san pham: 0
~~~

~~~java
record AccountDiff(String accountNo, BigDecimal oldBalance, BigDecimal newBalance) {
    BigDecimal delta() { return newBalance.subtract(oldBalance); }
}

static String classify(AccountDiff d, Map<String, String> approvedExceptions) {
    BigDecimal delta = d.delta();
    if (delta.signum() == 0) return "MATCH";
    String note = approvedExceptions.get(d.accountNo());
    return note != null ? "EXPLAINED: " + note : "UNEXPLAINED";   // con UNEXPLAINED thi khong cat
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
Ledger -> Ledger: kiem tra can bang, ghi append-only
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

CREATE TABLE consumer_dedup (               -- phia nhan, chong xu ly trung
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
Trong tai -> DC A: kiem tra su song, that bai
Trong tai -> DC B: quorum dong y, coi DC A da chet
Dinh tuyen -> DC B: chuyen dinh tuyen ve DC B
DC B -> DC B: nang DB standby len primary
DC B -> DC B: kiem tra giao dich cuoi da ap dung
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

> Senior tip: Trả lời theo ba câu chốt: (1) RPO của dữ liệu đã báo thành công phải bằng 0, nên ghi sổ được nhân bản đồng bộ, và tôi chấp nhận đánh đổi độ trễ cùng việc tạm dừng ghi khi mất kênh; (2) RTO là tổng của một chuỗi bước có người chịu trách nhiệm, tôi chia ngân sách thời gian cho từng bước và diễn tập để đo con số thật; (3) SLA bị trần của phụ thuộc bên ngoài chặn lại, nên tôi tính theo chuỗi và bàn lại phạm vi cam kết. Câu chốt thứ tư ghi điểm: hệ thống thanh toán dự phòng tốt là hệ thống **replay được** — mất kết nối không mất tiền vì đã có tham chiếu duy nhất và chứng thư đối soát.

> Cụm từ: Split-brain là tình trạng hai bản cùng nghĩ mình là bản chính và cùng nhận ghi, sinh ra hai lịch sử số dư khác nhau. Failback là bước đưa lưu lượng về data center ban đầu sau khi khắc phục, thường khó hơn failover vì phải đồng bộ dữ liệu phát sinh theo chiều ngược.

  `,
  follow: [
    'Vì sao RPO bằng 0 cho giao dịch đã báo thành công buộc phải nhân bản đồng bộ, và cái giá là gì?',
    'Kênh nối giữa hai data center đứt: hệ thống phải ứng xử thế nào để không có hai phiên bản số dư?',
    'Sau failover, khách khiếu nại "đã bấm chuyển tiền hai lần", bạn dựa vào dữ liệu nào để trả lời?'
  ],
  tags: ['SLA', 'RTO', 'RPO', 'active-passive', 'disaster recovery']
}
);