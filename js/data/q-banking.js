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
}
);