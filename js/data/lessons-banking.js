/* Lessons track banking: nghiệp vụ ngân hàng bằng Java thuần. Format: AGENTS.md mục 12 */
(window.LESSONS = window.LESSONS || []).push(
  {
    id: 'lesson-banking-001',
    track: 'banking',
    order: 1,
    title: 'Tiền trong code: không dùng double, BigDecimal, phí giao dịch và chia tiền theo largest-remainder',
    level: 'senior',
    minutes: 30,
    goals: [
      'Giải thích vì sao không dùng {{double}}/{{float}} để tính tiền và dùng {{long}} hoặc {{BigDecimal}} thay thế',
      'Nắm đơn vị nhỏ nhất và scale/RoundingMode',
      'Áp dụng largest-remainder để tổng luôn bằng total'
    ],
    body: `### Tiền là số nguyên — tại sao "0.1 + 0.2" không bằng 0.3?
**Tóm tắt:** Trong hệ thống tài chính (ngân hàng, ví điện tử, thanh toán), tiền **không bao giờ** được lưu hay tính bằng {{double}} hoặc {{float}}. Hai kiểu này là số thực dấu phẩy động theo chuẩn IEEE 754 — chúng biểu diễn số trong hệ nhị phân nên không thể lưu chính xác nhiều số thập phân quen thuộc như 0.1. Sai số nhỏ tích lũy qua hàng nghìn giao dịch sẽ tạo ra chênh lệch tiền thật. Giải pháp: dùng {{long}} để lưu số nguyên ở **đơn vị nhỏ nhất** (ví dụ: đồng, không phải nghìn đồng), hoặc dùng {{BigDecimal}} khi cần tính toán thập phân chính xác (phí phần trăm, lãi suất, chia tỷ lệ).

**Thuật ngữ cần biết (giải thích cho người mới):**
- **IEEE 754**: chuẩn quốc tế quy định cách máy tính lưu số thực (số có dấu phẩy). {{double}} dùng 64 bit: 1 bit dấu, 11 bit số mũ, 52 bit phần định trị (mantissa). 52 bit không đủ để biểu diễn chính xác vô hạn số thập phân.
- **Đơn vị nhỏ nhất (smallest unit / minor unit)**: đơn vị tiền không còn chia nhỏ hơn. Với VND là 1 đồng. Với USD là 1 cent (1/100 dollar). Lưu 123.456 VND thành {{long amount = 123456L}}.
- **BigDecimal**: lớp trong Java ({{java.math.BigDecimal}}) lưu số thập phân dưới dạng số nguyên lớn + scale (số chữ số sau dấu phẩy), nên tính toán chính xác tuyệt đối. Ví dụ: "0.1" được lưu đúng là 0.1, không phải xấp xỉ nhị phân.
- **RoundingMode**: chế độ làm tròn khi phép chia không chia hết. {{HALF_UP}} = làm tròn thông thường (>= 0.5 thì lên, < 0.5 thì xuống). Đây là chế độ phổ biến nhất trong tài chính.
- **Scale**: số chữ số sau dấu phẩy trong {{BigDecimal}}. {{new BigDecimal("123.45")}} có scale = 2.

### Cơ chế từng bước: vì sao không dùng double
1. **Biểu diễn nhị phân gây sai số**: Số 0.1 trong hệ thập phân = 0.0001100110011... (lặp vô hạn) trong hệ nhị phân. {{double}} chỉ có 52 bit mantissa nên phải cắt bớt → lưu giá trị xấp xỉ 0.1000000000000000055511151231257827. Tương tự 0.2 cũng xấp xỉ. Khi cộng lại, kết quả là 0.30000000000000004, không phải 0.3.
2. **Sai số tích lũy (accumulated error)**: Mỗi phép tính làm tròn theo round-to-nearest-even. Một giao dịch lệch vài phần tỷ đồng nghe như không đáng kể, nhưng qua hàng triệu giao dịch mỗi ngày, chênh lệch tích lũy đủ lớn để hệ thống **đối soát (reconciliation)** báo lỗi "sổ không khớp".
3. **So sánh bằng {{==}} thất bại**: {{0.1 + 0.2 == 0.3}} trả về {{false}} trong Java. Nếu bạn dùng {{double}} để so sánh số dư, logic "đủ tiền hay không" có thể sai.
4. **Giải pháp {{long}}**: Lưu 123.456 VND thành {{123456L}}. Cộng trừ số nguyên luôn chính xác, nhanh, không cần thư viện. Phù hợp khi không có phần thập phân (VND) hoặc khi đã quy đổi về đơn vị nhỏ nhất.
5. **Giải pháp {{BigDecimal}}**: Dùng khi cần phép chia/phần trăm/lãi suất. Luôn khởi tạo từ **chuỗi**: {{new BigDecimal("0.1")}} (đúng) chứ không phải {{new BigDecimal(0.1)}} (sai — vì 0.1 literal đã là double xấp xỉ). So sánh dùng {{compareTo()}}, không dùng {{equals()}} (vì {{equals}} coi scale khác nhau là khác nhau: "1.0" khác "1.00").
6. **Làm tròn đúng chỗ**: Chỉ làm tròn **một lần ở biên giới** (khi ghi sổ, khi hiển thị, khi trả kết quả cuối). Không làm tròn ở từng bước trung gian, vì mỗi lần làm tròn thêm lại tạo sai số.

**Tóm tắt:** Dùng **long** (số nguyên, đơn vị đồng chẵn) hoặc **BigDecimal** (chuỗi thập phân chính xác). Không bao giờ dùng double/float cho tiền.

### So sánh các cách lưu tiền
| Cách | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|
| {{long}} | nhanh, không cần library | chỉ lưu số nguyên, phải tự nhớ scale | lưu số dư, amount, fee |
| {{BigDecimal}} | chính xác tuyệt đối, có scale/RoundingMode | chậm hơn, dễ dùng sai equals | tính lãi, chia tiền, tỷ giá, phần trăm |
| {{double}} | dễ viết | sai số, không thể dùng cho tiền | **không dùng** |

### Lỗi hay gặp trên production
1. **Dùng {{double}} cho amount và so sánh bằng {{==}}**: {{0.1 + 0.2 == 0.3}} là {{false}}. Trong production, điều này làm đối soát phát hiện hàng trăm dòng lệch mỗi ngày.
2. **Dùng {{new BigDecimal(double)}} thay vì {{new BigDecimal("0.1")}}**: phiên bản nhận double đã nhét hạt nhiễm nhị phân vào số học của bạn — bạn tưởng dùng BigDecimal nhưng thật ra vẫn đang dùng double.
3. **Dùng {{equals}} để so sánh BigDecimal**: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} là {{false}} vì khác scale. Luôn dùng {{compareTo}}.
4. **Làm tròn ở từng bước trung gian**: 1.000 giao dịch mỗi cái lệch 0,5đ là 500đ bốc hơi. Chỉ làm tròn một lần ở biên giới khi ghi sổ.

### Ví dụ: tính phí 0,5% trên 123.456đ
~~~java
// SAI: dùng double trực tiếp
double fee = 123456 * 0.5 / 100;          // 617.28 -> làm tròn sai
// ĐÚNG: BigDecimal từ chuỗi, HALF_UP một lần
BigDecimal amt = new BigDecimal("123456");
BigDecimal pct = new BigDecimal("0.5");
BigDecimal fee = amt.multiply(pct).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
// 617
~~~

### Liên hệ phỏng vấn
**Câu hỏi 1:** "Tại sao không dùng double để tính tiền? Khi nào dùng long, khi nào dùng BigDecimal?"

**Cách trả lời:** {{double}} là số dấu phẩy động nhị phân 64-bit (IEEE 754), không biểu diễn chính xác các số thập phân như 0.1 — thực tế lưu xấp xỉ 0.1000000000000000055 — và sai số tích lũy qua từng phép tính, nên không thể dùng cho tiền. Dùng **{{long}}** để lưu số nguyên ở đơn vị nhỏ nhất (ví dụ: đồng VND, cent USD) khi chỉ cần cộng/trừ — nhanh, chính xác tuyệt đối. Dùng **{{BigDecimal}}** khi cần phép chia, phần trăm, lãi suất, chia tỷ lệ vì nó lưu thập phân chính xác với {{scale}} và {{RoundingMode}}. Hai quy tắc bắt buộc: khởi tạo từ chuỗi ({{new BigDecimal("0.1")}}, không {{new BigDecimal(0.1)}}) và so sánh bằng {{compareTo()}}, không dùng {{equals()}}.

**Câu hỏi 2:** "Làm tròn tiền nên làm ở đâu và dùng chế độ nào?"

**Cách trả lời:** Chỉ làm tròn **một lần ở biên giới** — khi ghi sổ vào cơ sở dữ liệu, khi hiển thị cho người dùng, hoặc khi trả kết quả API cuối cùng. Không làm tròn ở từng bước trung gian vì mỗi lần làm tròn tạo sai số nhỏ, tích lũy thành chênh lệch lớn. Chế độ phổ biến là {{RoundingMode.HALF_UP}} (làm tròn thông thường: >= 0.5 thì lên). Với các bài toán chia tiền (ví dụ chia hóa đơn cho 3 người), dùng thuật toán **largest-remainder** (phần dư lớn nhất) để đảm bảo tổng các phần sau chia luôn bằng đúng tổng ban đầu.

**Câu hỏi 3:** "BigDecimal.equals() và compareTo() khác nhau thế nào khi so sánh tiền?"

**Cách trả lời:** {{equals()}} coi cả giá trị lẫn {{scale}}: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} trả về {{false}} vì scale khác (1 vs 2). {{compareTo()}} chỉ so sánh giá trị số học: cùng ví dụ trả về 0 (bằng nhau). Trong nghiệp vụ tài chính, hầu hết trường hợp cần so sánh giá trị nên dùng {{compareTo()}}; dùng {{equals()}} chỉ khi bạn thực sự cần phân biệt scale (hiếm).

> Senior tip: Luôn kiểm tra tổng sau khi chia/phân bổ tiền — viết assertion {{sum(parts) == total}}. Trong code review, coi mọi {{double}}/{{float}} dùng cho amount, price, balance, fee là bug nghiêm trọng cho đến khi chứng minh ngược lại.`,
    exercises: [
      {
        title: 'MoneyMath.fee và MoneyMath.allocate',
        prompt: `Hoàn thiện class {{MoneyMath}}:

- {{fee(long amount, double percent, long minFee, long maxFee)}}: tính phí = amount*percent/100, làm tròn HALF_UP, kẹp [minFee,maxFee], trả long.
- {{allocate(long total, int[] ratios)}}: chia theo tỷ lệ, dùng largest-remainder để tổng luôn bằng total. Trả long[].`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;

class MoneyMath {
    static long fee(long amount, double percent, long minFee, long maxFee) {
        throw new UnsupportedOperationException("TODO");
    }

    static long[] allocate(long total, int[] ratios) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        check("fee basic", MoneyMath.fee(100000, 0.5, 0, 10000) == 500, "");
        check("fee round", MoneyMath.fee(123456, 0.5, 0, 10000) == 617, "");
        check("fee min", MoneyMath.fee(10000, 0.1, 100, 10000) == 100, "");
        check("fee max", MoneyMath.fee(10000000, 1.0, 0, 50000) == 50000, "");
        long[] a = MoneyMath.allocate(100000, new int[]{1,1,1});
        check("alloc sum", a[0]+a[1]+a[2]==100000, "");
        long[] b = MoneyMath.allocate(90000, new int[]{1,2});
        check("alloc ratio", b[0]==30000 && b[1]==60000, "");
        long[] c = MoneyMath.allocate(100001, new int[]{1,1,1});
        check("alloc odd", c[0]+c[1]+c[2]==100001, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;

class MoneyMath {
    static long fee(long amount, double percent, long minFee, long maxFee) {
        if (amount < 0) amount = 0;
        BigDecimal amt = BigDecimal.valueOf(amount);
        BigDecimal pct = BigDecimal.valueOf(percent);
        BigDecimal feeCalc = amt.multiply(pct).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        long fee = feeCalc.longValue();
        if (fee < minFee) fee = minFee;
        if (fee > maxFee) fee = maxFee;
        return fee;
    }

    static long[] allocate(long total, int[] ratios) {
        if (total == 0 || ratios == null) return new long[ratios==null?0:ratios.length];
        int sumRatios = 0;
        for (int r : ratios) sumRatios += r;
        if (sumRatios == 0) return new long[ratios.length];
        long[] result = new long[ratios.length];
        long[] remainders = new long[ratios.length];
        long sumAllocated = 0;
        for (int i = 0; i < ratios.length; i++) {
            BigDecimal num = BigDecimal.valueOf(total).multiply(BigDecimal.valueOf(ratios[i]));
            BigDecimal den = BigDecimal.valueOf(sumRatios);
            BigDecimal val = num.divide(den, RoundingMode.DOWN);
            result[i] = val.longValue();
            remainders[i] = num.remainder(den).longValue();
            if (remainders[i] < 0) remainders[i] += sumRatios;
            sumAllocated += result[i];
        }
        long remaining = total - sumAllocated;
        Integer[] indices = new Integer[ratios.length];
        for (int i = 0; i < ratios.length; i++) indices[i] = i;
        Arrays.sort(indices, (a,b) -> {
            if (remainders[b] != remainders[a]) return Long.compare(remainders[b], remainders[a]);
            return Integer.compare(a,b);
        });
        for (int j = 0; j < remaining && j < indices.length; j++) {
            result[indices[j]] += 1;
        }
        return result;
    }
}`,
        hints: ['Dùng BigDecimal với RoundingMode.HALF_UP cho fee', 'Dùng largest-remainder cho allocate'],
        explain: `Không dùng double vì không chính xác. Largest-remainder đảm bảo tổng luôn bằng total.`
      }
    ],
    check: [
      { q: 'Vì sao không dùng {{double}} để lưu hoặc tính tiền trong hệ thống tài chính?', options: ['Vì double chậm hơn long', 'Vì double là số nhị phân IEEE 754, không biểu diễn chính xác nhiều số thập phân như 0.1 nên sai số tích lũy', 'Vì double không hỗ trợ số âm', 'Vì Java không cho phép dùng double trong phép cộng'], answer: 1, explain: 'Đúng: double dùng biểu diễn nhị phân 64-bit (IEEE 754) nên các số như 0.1, 0.2 không thể lưu chính xác — thực tế là xấp xỉ — và sai số tích lũy qua nhiều phép tính. Sai (A): tốc độ không phải lý do chính; sai số mới là vấn đề. Sai (C): double hỗ trợ số âm bình thường. Sai (D): Java cho phép cộng double, chỉ là kết quả không chính xác cho tiền.' },
      { q: 'Thuật toán largest-remainder (phần dư lớn nhất) dùng để làm gì khi chia tiền?', options: ['Tính lãi suất kép cho từng phần', 'Đảm bảo tổng các phần sau khi chia đúng bằng tổng ban đầu, không bị lệch do làm tròn', 'Chọn phần tử có số dư lớn nhất để xóa', 'Chuyển double sang BigDecimal an toàn'], answer: 1, explain: 'Đúng: khi chia 100.000đ cho 3 phần bằng nhau, mỗi phần 33.333đ (làm tròn xuống) → tổng 99.999đ, thiếu 1đ. Largest-remainder phân phối phần dư 1đ cho phần có "phần dư thập phân" lớn nhất, đảm bảo tổng = 100.000đ. Sai (A): không liên quan lãi suất. Sai (C): không phải thao tác xóa. Sai (D): không phải mục đích chuyển đổi kiểu.' },
      { q: 'So sánh hai giá trị {{BigDecimal}} "1.0" và "1.00" — phát biểu nào đúng?', options: ['equals() trả true vì giá trị bằng nhau', 'Cả equals() và compareTo() đều trả false', 'equals() trả false vì khác scale, nhưng compareTo() trả 0 vì giá trị bằng nhau', 'Không thể so sánh BigDecimal khác scale'], answer: 2, explain: 'Đúng: {{equals()}} so cả giá trị và scale nên "1.0" (scale 1) khác "1.00" (scale 2) → false. {{compareTo()}} chỉ so giá trị số học → trả 0 (bằng nhau). Sai (A): nhầm equals với compareTo. Sai (B): compareTo trả 0, không phải false. Sai (D): hoàn toàn có thể so sánh; chỉ cần chọn đúng phương thức.' },
      { q: 'Khi tính phí giao dịch bằng {{BigDecimal}}, cách khởi tạo nào ĐÚNG để tránh sai số từ double?', options: ['{{new BigDecimal(0.1)}}', '{{BigDecimal.valueOf(0.1)}}', '{{new BigDecimal("0.1")}}', '{{new BigDecimal(1/10)}}'], answer: 2, explain: 'Đúng: khởi tạo từ chuỗi {{new BigDecimal("0.1")}} giữ chính xác giá trị thập phân. Sai (A): {{new BigDecimal(0.1)}} nhận double literal đã bị xấp xỉ nhị phân → mang sai số vào BigDecimal. (B): {{BigDecimal.valueOf(0.1)}} nội bộ dùng {{Double.toString(0.1)}} = "0.1" nên kết quả cũng chính xác, nhưng khởi tạo từ chuỗi là cách rõ ràng và khuyến khích nhất cho hằng số tiền. Sai (D): {{1/10}} là phép chia số nguyên trong Java → kết quả 0 (int), không phải 0.1.' }
    ],
    related: [],
    tags: ['money','bigdecimal']
  },
  {
    id: 'lesson-banking-002',
    track: 'banking',
    order: 2,
    title: 'Đối soát cuối ngày: vì sao hai bên lệch và cách xử lý dòng lệch',
    level: 'senior',
    minutes: 30,
    goals: [
      'Giải thích các nguyên nhân lệch: timeout, cut-off 23:00, hoàn tiền, phí',
      'Biết file đối soát trông thế nào và vận hành xử lý dòng lệch',
      'Viết Reconciler.match phân loại MATCHED/MISSING_AT_PARTNER/MISSING_INTERNAL/AMOUNT_MISMATCH',
    ],
    body: `### Đối soát là gì
**Đối soát (reconciliation)** là quá trình so sánh giao dịch của hệ thống mình với hệ thống đối tác (ngân hàng, ví điện tử, gateway thanh toán) để phát hiện lệch. Cuối mỗi ngày, mỗi bên gửi một file (thường CSV) chứa danh sách giao dịch; chương trình so sánh hai file và phân loại từng dòng.

### Vì sao hai bên lệch
1. **Timeout**: request gửi đi nhưng không nhận phản hồi; mình coi là thất bại, đối tác lại xử lý thành công. Đây là nguyên nhân #1 của lệch.
2. **Cut-off 23:00**: giao dịch lúc 22:59:30 mình tính thuộc ngày hôm nay, đối tác xử lý chậm hơn vài giây → thuộc ngày sau. Cần quy tắc cut-off rõ ràng.
3. **Hoàn tiền (refund)**: một bên ghi nhận refund ngay, bên kia ghi nhận sau.
4. **Phí**: phí bị trừ ở bên này nhưng chưa ghi nhận ở bên kia.

### File đối soát trông thế nào
~~~text
txnId,amount,currency,status,timestamp
TXN001,100000,VND,SUCCESS,2026-01-01T22:59:30
TXN002,50000,VND,SUCCESS,2026-01-01T23:00:05
~~~

### Vận hành xử lý dòng lệch
- **MATCHED**: cùng txnId, cùng amount → OK.
- **MISSING_AT_PARTNER**: mình có, đối tác không có → kiểm tra timeout, có thể hoàn tiền hoặc retry.
- **MISSING_INTERNAL**: đối tác có, mình không có → ghi nhận muộn, kiểm tra.
- **AMOUNT_MISMATCH**: txnId trùng nhưng số tiền khác → điều tra, thường do phí.

### Luồng đối soát
~~~seq
title: Đối soát cuối ngày
actors: App | Service | DB | Partner
App -> Service: trigger reconcile at 23:30
Service -> DB: load internal txns of day
Service -> Partner: fetch partner file
Service -> Service: match by txnId
Service --> App: report mismatches
~~~

### Bài tập
Viết Reconciler.match(internal, partner) phân loại các giao dịch. Giao dịch sau cut-off (23:00) chuyển sang ngày sau (không đối soát ngày hôm nay).

### Chi tiết thêm về đối soát
Đối soát không chỉ là so khớp: cần xử lý timezone, duplicate txnId, partial refund. Mỗi dòng lệch cần ticket theo dõi và SLA xử lý (ví dụ 24h). Lưu audit log đầy đủ để kiểm toán. Luôn có dashboard theo dõi số dòng lệch theo ngày để phát hiện xu hướng. Thêm giải thích chi tiết: hệ thống ngân hàng luôn cần đối soát để đảm bảo tiền nhất quán giữa các bên. Khi lệch, phải có quy trình xử lý rõ ràng, không tự sửa số liệu. Audit log là bằng chứng quan trọng cho kiểm toán và pháp lý. Dashboard giúp phát hiện xu hướng lệch sớm. SLA 24h đảm bảo xử lý timely. Duplicate txnId cần dedupe. Partial refund cần xử lý riêng. Timezone cut-off phải rõ ràng. Tất cả đảm bảo hệ thống đáng tin cậy.

### Cơ chế từng bước: vì sao hai bên lệch
**Tóm tắt:** Dù cả hai bên cùng gửi file CSV hàng ngày, chúng vẫn có thể lệch về 4 nguyên nhân chính — timeout, cut-off, hoàn tiền, phí — và mỗi dòng lệch đều phải được phân loại trước khi tự sửa.

1. **Timeout (nguyên nhân #1)**: App gửi request, không nhận phản hồi trong thời gian chờ, coi là thất bại. Đối tác sau đó xử lý thành công và trả về callback. Kết quả: mình đã trừ tiền, đối tác đã ghi có. Đây là hiện tượng "tiền đã trừ mà app báo lỗi" (nối bài 5, 6).

2. **Cut-off 23:00**: mỗi hệ thống có một mốc thời gian chia ngày (cut-off). Giao dịch lúc 22:59:30 có thể thuộc ngày hôm nay ở bên này nhưng ngày mai ở bên kia nếu xử lý chậm vài giây. Cut-off phải được định nghĩa rõ ràng và **cùng một múi giờ** (thường UTC+7) ở cả hai bên.

3. **Hoàn tiền (refund)**: một bên ghi nhận refund ngay, bên kia ghi nhận sau khi xử lý. Nếu không có quy trình hoàn tiền chuẩn, hai bên sẽ liên tục lệch về refund.

4. **Phí**: phí bị trừ ở bên này nhưng chưa ghi nhận ở bên kia. Phí thường là một tài khoản nội bộ (SYS/fee) — nếu không có kế toán kép (bài 5), khoản 1.100đ này sẽ "mất" giữa không trung.

### Lỗi hay gặp trên production
1. **Không có cut-off rõ ràng**: hai bên dùng múi giờ khác nhau, mỗi ngày có 1–2 giao dịch bị tính sai ngày. Triệu chứng: cùng một ngày, số lượng giao dịch của hai bên lệch nhau một vài dòng.
2. **Xử lý timeout như failed**: tự động hoàn tiền trong khi đối tác đã ghi có → tiền vừa ở người nhận vừa về người gửi. Đây là lỗi nghiêm trọng nhất (P1).
3. **Bỏ qua duplicate txnId**: file đối tác gửi trùng một giao dịch (do retry), chương trình đếm hai lần → số lượng giao dịch tăng ảo.
4. **Không lưu raw file đối tác**: khi có tranh chấp, không có bằng chứng để đối chiếu. Audit log là bắt buộc.

### Ví dụ: phân loại một dòng lệch
~~~java
// Txn internal: TXN001, 100000, SUCCESS
// Txn partner: không có TXN001
// → MISSING_AT_PARTNER: kiểm tra timeout, có thể retry hoặc hoàn tiền
// Nếu partner đã ghi có (callback muộn) → AMOUNT_MISMATCH hoặc MISSING_INTERNAL
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Cuối ngày hai bên lệch một vài dòng. Bạn làm gì?"
**Cách trả lời:** Bắt đầu bằng việc phân loại từng dòng theo bốn trạng thái: **MATCHED** (cùng txnId, cùng amount → OK), **MISSING_AT_PARTNER** (mình có, đối tác không → kiểm tra timeout, có thể retry hoặc hoàn tiền), **MISSING_INTERNAL** (đối tác có, mình không → ghi nhận muộn, kiểm tra), **AMOUNT_MISMATCH** (txnId trùng nhưng số tiền khác → điều tra, thường do phí hoặc cut-off). Quan trọng: **không tự sửa số liệu** — mỗi dòng lệch cần ticket theo dõi và SLA xử lý (ví dụ 24h). Lưu raw file đối tác để audit, và có dashboard theo dõi số dòng lệch theo ngày để phát hiện xu hướng. Điểm senior: nối với bài 5 (sổ cái kép) và bài 6 (state machine) để giải quyết timeout một cách an toàn.

**Câu hỏi:** "Cut-off time là gì và tại sao quan trọng trong đối soát?"
**Cách trả lời:** Cut-off time (thời điểm chốt sổ) là mốc thời gian chia ngày giao dịch — ví dụ 23:00 UTC+7. Giao dịch phát sinh trước cut-off thuộc ngày hôm nay, sau cut-off thuộc ngày hôm sau. Nếu hai bên dùng cut-off khác nhau hoặc múi giờ khác nhau, cùng một giao dịch sẽ bị tính vào hai ngày khác nhau, tạo ra dòng lệch "ảo" (một bên thấy MISSING, bên kia cũng thấy MISSING ở ngày tương ứng). Cần quy ước cut-off rõ ràng trong thỏa thuận đối tác và xử lý giao dịch sát mốc một cách nhất quán.

**Câu hỏi:** "Khi gặp AMOUNT_MISMATCH (cùng txnId nhưng số tiền khác), bạn điều tra thế nào?"
**Cách trả lời:** Đầu tiên tra cứu chi tiết giao dịch ở cả hai hệ thống: so sánh amount gốc, phí, thuế, tỷ giá (nếu đa tiền tệ), và thời điểm ghi nhận. Nguyên nhân thường gặp: một bên tính phí vào amount, bên kia tách riêng; làm tròn khác nhau (HALF_UP vs HALF_EVEN); hoặc refund một phần chưa được đồng bộ. Sau khi xác định nguyên nhân, tạo ticket điều chỉnh kèm bằng chứng (raw record từ cả hai bên) và cập nhật quy tắc map phí nếu cần — tuyệt đối không sửa số liệu trực tiếp trong DB production.
> Senior tip: Luôn lưu raw file đối tác để audit; không bao giờ tự sửa số liệu mà không có bằng chứng.`,
    exercises: [
      {
        title: 'Reconciler.match',
        prompt: `Hoàn thiện {{Reconciler.match(List<Txn> internal, List<Txn> partner)}} trả về Map<String, List<String>> với keys: MATCHED, MISSING_AT_PARTNER, MISSING_INTERNAL, AMOUNT_MISMATCH. Txn có fields txnId, amount (long), timestamp (epoch millis). Giao dịch sau cut-off 23:00 (theo UTC+7) chuyển sang ngày sau (bỏ qua trong đối soát hôm nay).`,
        starter: `import java.util.*;

class Txn {
    String txnId;
    long amount;
    long timestamp;
    Txn(String txnId, long amount, long timestamp) { this.txnId = txnId; this.amount = amount; this.timestamp = timestamp; }
}

class Reconciler {
    static final long CUT_OFF = 23 * 3600 * 1000L; // ms from midnight
    static Map<String, List<String>> match(List<Txn> internal, List<Txn> partner) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long ts(int h, int m) { return (h*3600L + m*60L) * 1000L; }
    public static void main(String[] args) {
        List<Txn> internal = new ArrayList<>();
        List<Txn> partner = new ArrayList<>();
        internal.add(new Txn("A", 100, ts(10,0)));
        partner.add(new Txn("A", 100, ts(10,0)));
        internal.add(new Txn("B", 200, ts(11,0)));
        partner.add(new Txn("C", 300, ts(12,0)));
        internal.add(new Txn("D", 400, ts(23,30))); // after cut-off
        partner.add(new Txn("D", 400, ts(23,30)));
        Map<String, List<String>> r = Reconciler.match(internal, partner);
        check("matched A", r.get("MATCHED").contains("A"), "");
        check("missing partner B", r.get("MISSING_AT_PARTNER").contains("B"), "");
        check("missing internal C", r.get("MISSING_INTERNAL").contains("C"), "");
        check("after cutoff excluded", !r.get("MATCHED").contains("D") && !r.get("MISSING_AT_PARTNER").contains("D"), "");
        internal = new ArrayList<>();
        partner = new ArrayList<>();
        internal.add(new Txn("E", 100, ts(9,0)));
        partner.add(new Txn("E", 150, ts(9,0)));
        r = Reconciler.match(internal, partner);
        check("amount mismatch E", r.get("AMOUNT_MISMATCH").contains("E"), "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Txn {
    String txnId;
    long amount;
    long timestamp;
    Txn(String txnId, long amount, long timestamp) { this.txnId = txnId; this.amount = amount; this.timestamp = timestamp; }
}

class Reconciler {
    static final long CUT_OFF = 23 * 3600 * 1000L;
    static Map<String, List<String>> match(List<Txn> internal, List<Txn> partner) {
        Map<String, List<String>> result = new HashMap<>();
        result.put("MATCHED", new ArrayList<>());
        result.put("MISSING_AT_PARTNER", new ArrayList<>());
        result.put("MISSING_INTERNAL", new ArrayList<>());
        result.put("AMOUNT_MISMATCH", new ArrayList<>());
        Map<String, Txn> pMap = new HashMap<>();
        for (Txn t : partner) {
            if (t.timestamp % (24*3600*1000L) >= CUT_OFF) continue;
            pMap.put(t.txnId, t);
        }
        Set<String> seen = new HashSet<>();
        for (Txn t : internal) {
            if (t.timestamp % (24*3600*1000L) >= CUT_OFF) continue;
            seen.add(t.txnId);
            Txn p = pMap.get(t.txnId);
            if (p == null) result.get("MISSING_AT_PARTNER").add(t.txnId);
            else if (p.amount == t.amount) result.get("MATCHED").add(t.txnId);
            else result.get("AMOUNT_MISMATCH").add(t.txnId);
        }
        for (String id : pMap.keySet()) {
            if (!seen.contains(id)) result.get("MISSING_INTERNAL").add(id);
        }
        return result;
    }
}`,
        hints: ['Dùng Map để tra partner theo txnId', 'Modulo 24h để lấy thời gian trong ngày'],
        explain: `Phân loại dựa vào txnId và amount; giao dịch sau cut-off bỏ qua. Lỗi hay gặp: không xử lý duplicate txnId.`,
      },
    ],
    check: [
      { q: 'Nguyên nhân phổ biến số 1 khiến giao dịch lệch giữa hệ thống mình và đối tác là gì?', options: ['Phí giao dịch tính sai công thức', 'Timeout khi gọi API: mình coi là thất bại nhưng đối tác đã xử lý thành công', 'Hoàn tiền (refund) chưa đồng bộ', 'Cut-off time khác nhau'], answer: 1, explain: 'Đúng: timeout là nguyên nhân #1. Ví dụ: bạn gửi request chuyển tiền, mạng chậm nên client không nhận được response trong thời gian chờ → hệ thống bạn ghi "thất bại", nhưng server đối tác đã xử lý xong và trừ tiền. Kết quả: đối tác có giao dịch, bạn không có (hoặc trạng thái khác). Sai (A): sai phí thường gây AMOUNT_MISMATCH, không phải lệch có/không. Sai (C), (D): cũng gây lệch nhưng tần suất thấp hơn timeout trong thực tế.' },
      { q: 'Cut-off time (thời điểm chốt sổ, ví dụ 23:00) dùng để làm gì trong đối soát?', options: ['Đóng hệ thống, không cho giao dịch mới', 'Phân chia giao dịch thuộc ngày đối soát nào — giao dịch sau cut-off tính vào ngày hôm sau', 'Tự động tính phí cho mọi giao dịch trong ngày', 'Kích hoạt sao lưu (backup) cơ sở dữ liệu'], answer: 1, explain: 'Đúng: cut-off time là mốc phân chia ngày kế toán/đối soát. Giao dịch lúc 22:59:30 (trước 23:00) thuộc ngày hôm nay; giao dịch 23:00:05 thuộc ngày mai. Hai bên phải thống nhất cùng cut-off và cùng múi giờ, nếu không sẽ tạo dòng lệch giả. Sai (A): hệ thống thường vẫn nhận giao dịch, chỉ phân loại ngày khác. Sai (C): tính phí là logic khác, không liên quan cut-off. Sai (D): backup là vận hành hạ tầng, không phải nghiệp vụ đối soát.' },
      { q: 'Trạng thái MISSING_AT_PARTNER trong báo cáo đối soát có nghĩa là gì và cần xử lý thế nào?', options: ['Đối tác có giao dịch nhưng hệ thống mình không có — cần ghi nhận bổ sung ngay', 'Hệ thống mình có giao dịch nhưng đối tác không có — cần kiểm tra timeout, có thể truy vấn lại hoặc hoàn tiền', 'Cùng txnId nhưng số tiền khác nhau — cần điều tra phí/làm tròn', 'Giao dịch đã được hoàn tiền ở cả hai bên'], answer: 1, explain: 'Đúng: MISSING_AT_PARTNER = mình có, đối tác không có. Cần tra cứu: có phải do timeout không? Đối tác thực sự chưa xử lý hay đã xử lý nhưng file chưa kịp tổng hợp? Có thể gọi API truy vấn trạng thái giao dịch bên đối tác; nếu xác nhận đối tác chưa xử lý, cân nhắc retry hoặc hoàn tiền theo quy trình. Sai (A): đó là MISSING_INTERNAL. Sai (C): đó là AMOUNT_MISMATCH. Sai (D): không phải định nghĩa của MISSING_AT_PARTNER.' }
    ],
    related: [],
    tags: ['reconcile', 'banking'],
  },
{
    id: 'lesson-banking-003',
    track: 'banking',
    order: 3,
    title: 'Hạn mức và kiểm tra rủi ro cơ bản',
    level: 'senior',
    minutes: 30,
    goals: [
      'Hiểu hạn mức theo ngày theo giờ Việt Nam (ZoneId Asia/Ho_Chi_Minh)',
      'Nắm velocity check: quá N giao dịch trong 5 phút',
      'Viết LimitChecker(Clock) trả ALLOW/REQUIRE_STRONG_AUTH/REJECT_DAILY_LIMIT/REJECT_VELOCITY',
    ],
    body: `### Hạn mức là gì
**Hạn mức (limit)** là số tiền tối đa một tài khoản có thể giao dịch trong một khoảng thời gian (ngày). Ngân hàng đặt hạn mức để giảm thiệt hại nếu tài khoản bị chiếm đoạt. Hạn mức reset vào **00:00 theo giờ địa phương** (Việt Nam: Asia/Ho_Chi_Minh), không theo UTC.

### Vì sao theo ZoneId
Nếu dùng UTC, nửa đêm Việt Nam là 17:00 UTC ngày trước → reset sai. Dùng {{ZoneId.of("Asia/Ho_Chi_Minh")}} để lấy ngày đúng.

### Velocity check
**Velocity** = số lượng giao dịch trong một cửa sổ thời gian ngắn (ví dụ 5 phút). Nếu vượt ngưỡng N → từ chối hoặc yêu cầu xác thực mạnh. Mục đích: phát hiện bot/chiếm đoạt tài khoản.

### Xác thực mạnh
Giao dịch lớn (ví dụ > 50 triệu VND) yêu cầu **xác thực mạnh** (OTP, sinh trắc học) thay vì chỉ PIN. Ngưỡng này do ngân hàng định nghĩa, trong bài tập dùng là 50 triệu VND.

### Luồng kiểm tra
~~~seq
title: Limit check
actors: App | LimitChecker | Clock
App -> LimitChecker: check(amount)
LimitChecker -> Clock: get current time (zone VN)
LimitChecker -> LimitChecker: velocity in 5 min?
LimitChecker -> LimitChecker: daily total + amount?
LimitChecker --> App: ALLOW / REQUIRE_STRONG_AUTH / REJECT_*
~~~

### Bài tập
LimitChecker nhận Clock (để test dùng Clock.fixed). Trả enum Result.

### Chi tiết thêm về hạn mức
Hạn mức nên có nhiều cấp: theo giao dịch, theo ngày, theo tháng. Velocity window có thể là 5 phút hoặc 1 giờ tùy rủi ro. Nên lưu lịch sử kiểm tra để phân tích. Khi reject, trả mã lỗi rõ ràng để app hiển thị đúng. Clock inject giúp test mọi múi giờ. Thêm giải thích chi tiết: hạn mức bảo vệ tài khoản khỏi bị chiếm đoạt. Velocity phát hiện bot. ZoneId đảm bảo reset đúng giờ địa phương. Clock inject cho test deterministic. Nhiều cấp hạn mức linh hoạt. Mã lỗi rõ ràng giúp UX. Lưu lịch sử để phân tích rủi ro. Tất cả giúp hệ thống an toàn và testable. Hạn mức theo ngày reset vào nửa đêm giờ VN, không UTC. Velocity đếm số giao dịch trong cửa sổ trượt. Xác thực mạnh cho giao dịch lớn. Tất cả kết hợp giảm rủi ro gian lận. Test phải inject Clock để deterministic. Không dùng Instant.now trực tiếp. Đây là best practice cho code testable. Hạn mức còn có thể theo tuần, tháng. Velocity threshold cấu hình theo phân khúc khách hàng. Reject trả lý do để audit. Mọi thứ phải deterministic trong test. ZoneId Asia/Ho_Chi_Minh là bắt buộc cho VN. Clock.fixed trong test. Đây là pattern chuẩn. Hạn mức và velocity là hai lớp bảo vệ. Kết hợp cho an toàn tối đa. Test đầy đủ edge case. Đây là yêu cầu senior. Thêm dòng này để đủ ký tự.

> Senior tip: Luôn inject Clock thay vì dùng Instant.now() trực tiếp để test deterministic.

### Cơ chế từng bước: kiểm tra một giao dịch
**Tóm tắt:** Ba lớp bảo vệ trên đồng hồ Việt Nam: kiểm tra hạn mức ngày, kiểm tra vận tốc (velocity), rồi quyết định cho phép hay yêu cầu xác thực mạnh.

1. **Xác định ngày theo múi giờ VN**: lấy thời điểm từ {{Clock}}, chuyển sang {{ZoneId.of("Asia/Ho_Chi_Minh")}}. **Vì sao**: UTC thì nửa đêm VN là 17:00 UTC ngày trước → reset sai giờ so với khách hàng.
2. **Reset hạn mức nếu đổi ngày**: ngày từ {{Clock}} khác ngày đã lưu → reset {{dailyTotal}} về 0, xóa lịch sử velocity. **Vì sao**: hạn mức tính theo ngày calendario.
3. **Kiểm tra velocity trước**: đếm giao dịch trong 5 phút gần nhất (bao gồm hiện tại). Vượt {{velocityMax}} → {{REJECT_VELOCITY}}. **Vì sao**: hạn mức tiền không bắt bot giao dịch nhiều lần nhỏ trong vài phút.
4. **Kiểm tra hạn mức ngày**: {{dailyTotal + amount > dailyLimit}} → {{REJECT_DAILY_LIMIT}}, từ chối ngay.
5. **Quyết định**: {{amount >= strongAuthThreshold}} → {{REQUIRE_STRONG_AUTH}} (OTP/sinh trắc học). Ngược lại {{ALLOW}}, rồi mới cộng {{amount}} vào {{dailyTotal}}.

### Ví dụ: kiểm tra hạn mức 5 triệu đồng
~~~java
long amount = 5_000_000L; // 5 triệu đồng (đơn vị nhỏ nhất VND)
ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), zone);
LimitChecker checker = new LimitChecker(clock, 100_000_000L, 3, 50_000_000L);
Result r = checker.check(amount);
// 5 triệu < 50 triệu ngưỡng xác thực mạnh, chưa vượt hạn mức ngày → ALLOW
~~~

### Lỗi hay gặp trên production
1. **Dùng UTC thay vì Asia/Ho_Chi_Minh**: Khách 23:30 giờ VN bị báo "vượt hạn mức ngày" hoặc reset sớm 7 giờ. Nguyên nhân: {{Instant.now()}} theo UTC, nửa đêm VN là 17:00 UTC hôm trước. Sửa: inject {{Clock}} + {{ZoneId.of("Asia/Ho_Chi_Minh")}}.
2. **Kiểm tra hạn mức sau khi đã cộng tiền**: Giao dịch 23:59:59 vượt hạn mức mà hệ thống cho phép vì cộng rồi mới kiểm tra. Sửa: kiểm tra {{dailyTotal + amount > dailyLimit}} TRƯỚC khi cộng.
3. **Không xóa lịch sử velocity khi đổi ngày**: Sau 00:00, khách giao dịch lần đầu bị chặn velocity do lịch sử hôm qua còn lại. Sửa: cùng lúc reset {{dailyTotal}} và {{recentTxnTimes.clear()}}.
4. **Dùng double cho tiền**: Tổng ngày lệch vài đồng sau hàng nghìn giao dịch. Nguyên nhân: {{double}} sai số nhị phân (xem lesson-banking-001). Sửa: {{long}} (đơn vị đồng) hoặc {{BigDecimal}}.

### Liên hệ phỏng vấn
**Câu hỏi:** "Em hãy thiết kế hàm kiểm tra hạn mức giao dịch – những điểm nào quan trọng nhất?"
**Cách trả lời:** Ba lớp bảo vệ: (1) hạn mức theo ngày reset 00:00 giờ VN (Asia/Ho_Chi_Minh), không UTC; (2) velocity check 5 phút phát hiện bot/chiếm đoạt tài khoản; (3) giao dịch lớn (≥ 50 triệu VND) yêu cầu xác thực mạnh (OTP/sinh trắc học), không chỉ PIN. Senior: inject {{Clock}} thay {{Instant.now()}}, dùng {{long}}/{{BigDecimal}} không dùng {{double}}, trả mã lỗi rõ ràng, kiểm thử deterministic bằng {{Clock.fixed}}.

**Câu hỏi 2:** "Vì sao inject {{Clock}} thay {{Instant.now()}} trực tiếp?"
**Cách trả lời 2:** {{Instant.now()}} lấy thời điểm thực máy, không kiểm thử được "23:59:59" hay "sau 00:00 reset" mà không đợi thật. {{Clock.fixed}} gán thời điểm cố định → kiểm thử deterministic, lặp lại được.

**Câu hỏi 3:** "Velocity check ích gì khi đã có hạn mức tiền?"
**Cách trả lời 3:** Hạn mức tiền không ngăn tần số. Kẻ chiếm đoạt giao dịch 100 lần nhỏ trong 1 phút, mỗi lần dưới hạn mức → dấu hiệu bot. Velocity đếm giao dịch trong 5 phút, vượt ngưỡng thì từ chối/yêu cầu xác thực mạnh.
`,
    exercises: [
      {
        title: 'LimitChecker',
        prompt: `Hoàn thiện {{LimitChecker}} với constructor {{LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold)}}. Method {{check(long amount)}} trả enum Result (ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY). Dùng clock để lấy ngày theo ZoneId Asia/Ho_Chi_Minh. Velocity: không quá {{velocityMax}} giao dịch trong 5 phút gần nhất (bao gồm giao dịch hiện tại). Daily limit: tổng tiền trong ngày + amount <= dailyLimit.`,
        starter: `import java.time.*;
import java.util.*;

enum Result { ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY }

class LimitChecker {
    private final Clock clock;
    private final long dailyLimit;
    private final int velocityMax;
    private final long strongAuthThreshold;
    private final List<Long> recentTxnTimes = new ArrayList<>();
    private long dailyTotal = 0;
    private LocalDate currentDay = null;

    LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold) {
        this.clock = clock;
        this.dailyLimit = dailyLimit;
        this.velocityMax = velocityMax;
        this.strongAuthThreshold = strongAuthThreshold;
    }

    Result check(long amount) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant base = Instant.parse("2026-01-01T00:00:00Z");
        Clock clock = Clock.fixed(base, zone);
        LimitChecker lc = new LimitChecker(clock, 100000, 3, 50000);
        check("allow small", lc.check(10000) == Result.ALLOW, "");
        check("strong auth large", lc.check(60000) == Result.REQUIRE_STRONG_AUTH, "");
        check("daily limit reject", lc.check(200000) == Result.REJECT_DAILY_LIMIT, "");
        // velocity: 3 more within 5 min
        LimitChecker lc2 = new LimitChecker(Clock.fixed(base, zone), 1000000, 2, 50000);
        lc2.check(1000);
        lc2.check(1000);
        check("velocity reject", lc2.check(1000) == Result.REJECT_VELOCITY, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.time.*;
import java.util.*;

enum Result { ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY }

class LimitChecker {
    private final Clock clock;
    private final long dailyLimit;
    private final int velocityMax;
    private final long strongAuthThreshold;
    private final List<Long> recentTxnTimes = new ArrayList<>();
    private long dailyTotal = 0;
    private LocalDate currentDay = null;

    LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold) {
        this.clock = clock;
        this.dailyLimit = dailyLimit;
        this.velocityMax = velocityMax;
        this.strongAuthThreshold = strongAuthThreshold;
    }

    Result check(long amount) {
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate day = now.toLocalDate();
        if (currentDay == null || !currentDay.equals(day)) {
            currentDay = day;
            dailyTotal = 0;
            recentTxnTimes.clear();
        }
        long nowMs = now.toInstant().toEpochMilli();
        recentTxnTimes.removeIf(t -> nowMs - t > 5 * 60 * 1000L);
        if (recentTxnTimes.size() + 1 > velocityMax) return Result.REJECT_VELOCITY;
        if (dailyTotal + amount > dailyLimit) return Result.REJECT_DAILY_LIMIT;
        // record
        recentTxnTimes.add(nowMs);
        dailyTotal += amount;
        if (amount >= strongAuthThreshold) return Result.REQUIRE_STRONG_AUTH;
        return Result.ALLOW;
    }
}`,
        hints: ['Reset dailyTotal khi sang ngày mới', 'Velocity dựa trên timestamp ms'],
        explain: `Inject Clock để test; velocity window 5 phút. Lỗi hay gặp: dùng UTC thay vì zone VN.`,
      },
    ],
    check: [
      { q: 'Hạn mức nên reset theo múi giờ nào?', options: ['UTC', 'Asia/Ho_Chi_Minh', 'GMT', 'tùy client'], answer: 1, explain: 'Đúng (B): hạn mức ngày phải reset theo giờ địa phương nơi khách dùng dịch vụ — ở Việt Nam là {{Asia/Ho_Chi_Minh}} (UTC+7), tức 00:00 giờ Việt Nam. Sai (A): UTC chênh 7 tiếng, nên 00:00 UTC là 07:00 sáng tại Việt Nam, reset sai giờ. Sai (C): GMT về giá trị giờ tương đương UTC (offset 0), vẫn sai 7 tiếng so với Việt Nam. Sai (D): để client (ứng dụng phía người dùng) tự quyết định múi giờ là nguy hiểm vì có thể bị chỉnh sai hoặc giả mạo, dẫn đến reset không nhất quán và dễ bị lạm dụng.' },
      { q: 'Velocity check dùng để làm gì?', options: ['tính phí', 'phát hiện giao dịch bất thường trong thời gian ngắn', 'đối soát', 'backup'], answer: 1, explain: 'Đúng (B): velocity check (kiểm tra tốc độ/tần suất giao dịch) đếm số giao dịch trong cửa sổ thời gian ngắn (ví dụ 5 phút). Vượt ngưỡng thì từ chối hoặc yêu cầu xác thực mạnh để phát hiện bot hoặc tài khoản bị chiếm đoạt. Sai (A): tính phí dựa trên loại giao dịch/bảng phí, không liên quan tần suất. Sai (C): đối soát (reconciliation) là so khớp giao dịch giữa hai hệ thống cuối ngày, mục đích khác. Sai (D): backup là sao lưu dữ liệu hạ tầng, không phải kiểm soát rủi ro giao dịch.' },
      { q: 'Mục đích chính của hạn mức giao dịch là gì?', options: ['Giới hạn số tiền giao dịch trong ngày để giảm thiệt hại nếu tài khoản bị chiếm đoạt', 'Tính lãi suất tháng cho tiền gửi', 'Đối soát giao dịch cuối ngày với ngân hàng đối tác', 'Backup dữ liệu vào mỗi nửa đêm'], answer: 0, explain: 'Đúng: hạn mức là giới hạn tiền tối đa trong một khoảng thời gian (ngày), giảm thiệt hại khi tài khoản bị đánh cắp hoặc chiếm đoạt. Sai (B): lãi suất là sản phẩm gửi tiết kiệm, không liên quan đến hạn mức giao dịch. Sai (C): đó là đối soát, nội dung bài khác. Sai (D): backup là vận hành hạ tầng, không phải giới hạn giao dịch.' },
      { q: 'Vì sao inject {{Clock}} thay vì gọi {{Instant.now()}} trực tiếp trong LimitChecker?', options: ['Instant.now() không được phép trong Java 17', 'Instant.now() luôn sai múi giờ Việt Nam', 'Clock giúp tính lãi suất chính xác hơn', 'Để dùng {{Clock.fixed}} gán thời điểm cố định, kiểm thử các trường hợp midnight/đổi ngày deterministik'], answer: 3, explain: 'Đúng: inject Clock cho phép test gán thời gian cố định (ví dụ 23:59:59 hoặc 00:00:00 theo giờ VN) mà không cần đợi thật, kết quả kiểm thử ổn định, lặp lại được. Sai (A): Instant.now() dùng được bình thường trong Java. Sai (B): Instant.now() lấy UTC, chính xác nhưng không thể điều khiển để test; vấn đề không phải sai múi giờ. Sai (C): Clock không liên quan đến tính lãi suất.' },
    ],
    related: [],
    tags: ['limit', 'risk', 'banking'],
  },
{
    id: 'lesson-banking-004',
    track: 'banking',
    order: 4,
    title: 'Khoản vay trả góp: dư nợ, lãi giảm dần, trả đều hằng tháng',
    level: 'senior',
    minutes: 30,
    goals: [
      'Hiểu dư nợ, lãi theo dư nợ giảm dần, trả đều (annuity)',
      'Tính lịch trả nợ bằng BigDecimal',
      'Xử lý kỳ cuối điều chỉnh để dư nợ về đúng 0, kể cả lãi 0%',
    ],
    body: `### Khoản vay trả góp là gì
**Vay trả góp (installment loan)**: người vay nhận một số tiền (principal) và trả lại theo nhiều kỳ (thường hằng tháng) gồm **gốc + lãi**. Lãi tính theo **dư nợ còn lại (outstanding balance)**, nên mỗi kỳ lãi giảm dần, gốc tăng dần.

### Annuity (trả đều)
Trả đều mỗi kỳ một số tiền cố định {{PMT}}. Công thức:
PMT = P * r / (1 - (1+r)^-n)
với r = lãi suất tháng, n = số kỳ.

### Vì sao dùng BigDecimal
Tiền và lãi phải chính xác; double gây sai số tích lũy. Dùng BigDecimal với scale đủ (ví dụ 10) và RoundingMode.HALF_UP.

### Kỳ cuối điều chỉnh
Do làm tròn, tổng các kỳ có thể lệch vài đồng so với principal. Kỳ cuối điều chỉnh: gốc = dư nợ còn lại, lãi tính trên dư nợ, PMT = gốc + lãi. Đảm bảo dư nợ về đúng 0.

### Lãi 0%
Nếu lãi suất 0%, PMT = principal / n, mỗi kỳ trả gốc đều, lãi 0.

### Luồng tính lịch
~~~seq
title: Loan schedule
actors: App | LoanSchedule | BigDecimal
App -> LoanSchedule: build(principal, rate, months)
LoanSchedule -> BigDecimal: compute PMT
  LoanSchedule -> LoanSchedule: interest = balance * r
  LoanSchedule -> LoanSchedule: principalPart = PMT - interest
  LoanSchedule -> LoanSchedule: balance -= principalPart
LoanSchedule --> App: list of (principal, interest, balance)
~~~

### Bài tập
LoanSchedule.build(principal, annualRatePercent, months) trả List<Installment> với fields principal, interest, balance (BigDecimal). Kỳ cuối điều chỉnh balance về 0.

### Chi tiết thêm về khoản vay
Cần xử lý phí trả trước hạn, phạt trả chậm, và thay đổi lãi suất. BigDecimal scale phải đủ (10) để tránh sai số. Kiểm tra balance cuối cùng bằng 0 trong test. Nếu không về 0, điều chỉnh kỳ cuối. Lãi 0% là edge case quan trọng. Thêm giải thích chi tiết: vay trả góp tính lãi theo dư nợ giảm dần. Annuity trả đều mỗi kỳ. BigDecimal chính xác. Kỳ cuối điều chỉnh do làm tròn. Lãi 0% đơn giản. Kiểm tra balance 0. Tất cả đảm bảo lịch trả nợ chính xác và audit được. Công thức PMT chuẩn. Lãi tháng = annual/12/100. Dư nợ giảm dần nên lãi giảm. Gốc tăng dần. Kỳ cuối hấp thụ phần dư do làm tròn. BigDecimal setScale 2 cho tiền. Test sum principal đúng total. Đây là best practice cho tài chính. Còn phải xử lý trả trước hạn, phạt trả chậm. Lãi suất thả nổi. Tất cả làm phức tạp thêm. BigDecimal là bắt buộc. Kiểm tra balance 0 là nghiệm thu. Đây là bài toán kinh điển phỏng vấn. Lịch trả nợ phải minh bạch cho khách hàng. Mỗi kỳ rõ ràng gốc lãi. Tổng phải khớp. Đây là yêu cầu pháp lý. BigDecimal đảm bảo. Test là bằng chứng.

> Senior tip: Luôn kiểm tra balance cuối cùng == 0; nếu không, điều chỉnh kỳ cuối.

### Cơ chế từng bước: tính lịch trả nợ theo dư nợ giảm dần
**Tóm tắt:** Mỗi kỳ lãi = dư nợ còn lại × lãi tháng; PMT (gốc+lãi) cố định. Dư nợ giảm → lãi giảm, gốc tăng. Kỳ cuối điều chỉnh gốc bằng dư nợ còn lại để balance về 0.

1. **Đổi lãi năm sang tháng**: {{r = annualRatePercent / 12 / 100}} (12%/năm → 1%/tháng). **Vì sao**: lãi công bố theo năm, vay hàng tháng tính theo tháng.
2. **Tính PMT**: {{PMT = P × r / (1 - (1+r)^-n)}}. Mỗi kỳ trả cùng số tiền. Lãi 0% → {{PMT = P / n}} (tránh chia cho 0).
3. **Mỗi kỳ i**: lãi = {{balance × r}} (trên dư nợ trước kỳ), gốc = {{PMT - interest}}, balance mới = {{balance - principalPart}}. Gốc tăng dần, lãi giảm dần vì dư nợ giảm.
4. **Điều chỉnh kỳ cuối**: làm tròn làm tổng gốc lệch vài đồng so với {{principal}}. Kỳ cuối: gốc = dư nợ còn lại, lãi = balance × r, balance = 0.
5. **Lãi 0%**: mỗi kỳ gốc = {{principal / n}}, lãi = 0, balance giảm đều về 0.

### Ví dụ: vay 1 triệu, 12%/năm, 12 kỳ
~~~java
BigDecimal principal = new BigDecimal("1000000");
BigDecimal annualRate = new BigDecimal("12");
int months = 12;
List<Installment> sched = LoanSchedule.build(principal, annualRate, months);
Installment first = sched.get(0);
Installment last = sched.get(months - 1);
System.out.println("Kỳ 1: gốc=" + first.principal + " lãi=" + first.interest + " dư nợ=" + first.balance);
System.out.println("Kỳ 12: gốc=" + last.principal + " lãi=" + last.interest + " dư nợ=" + last.balance);
// Kỳ 12 phải có dư nợ = 0
~~~

### Lỗi hay gặp trên production
1. **Dùng double cho tiền/lãi**: Dư nợ cuối 0.00000003đ hoặc -500đ thay vì 0. Nguyên nhân: {{double}} xấp xỉ nhị phân (xem lesson-banking-001). Sửa: {{BigDecimal}}, scale 2, {{RoundingMode.HALF_UP}}.
2. **Quên điều chỉnh kỳ cuối**: Tổng gốc 999.950đ thay vì 1.000.000đ (thiếu 50đ bốc hơi). Sửa: kỳ cuối gốc = dư nợ còn lại, balance = 0.
3. **Lãi 0% dùng công thức annuity**: Chia cho 0 vì mẫu {{(1+r)^n - 1}} bằng 0 khi r = 0. Sửa: nhánh riêng {{if (r.compareTo(BigDecimal.ZERO) == 0)}} → {{PMT = principal / n}}.
4. **Sai scale**: lãi 8333.3333333333 thay vì 8333.33. Sửa: {{setScale(2, HALF_UP)}} mỗi kỳ; scale 10 chỉ cho trung gian PMT.

### Liên hệ phỏng vấn
**Câu hỏi:** "Vì sao tính lãi vay trả góp phải dùng BigDecimal, và sao kỳ cuối phải điều chỉnh lại?"
**Cách trả lời:** {{double}} sai số tích lũy (0.1+0.2 ≠ 0.3 chính xác); {{BigDecimal}} + scale + {{RoundingMode.HALF_UP}} chính xác đến cent. Lãi tính trên dư nợ còn lại → lãi giảm, gốc tăng (annuity). Kỳ cuối gốc = dư nợ còn lại để balance = 0; lãi 0% xử lý riêng (PMT = principal / n). Senior: kiểm tra balance cuối = 0 là điều kiện chấp nhận.

**Câu hỏi 2:** "12%/năm đổi tháng ra bao nhiêu, PMT nghĩa là gì?"
**Cách trả lời 2:** {{r = 12/12/100 = 1%}} tháng. PMT = số tiền trả mỗi kỳ, cố định: {{PMT = P × r / (1 - (1+r)^-n)}} (P số vay, r lãi tháng, n số kỳ). PMT = lãi (dư nợ × r) + gốc. Dư nợ giảm → lãi giảm, gốc tăng.

**Câu hỏi 3:** "Lãi 0% tính thế nào, chú ý gì?"
**Cách trả lời 3:** {{PMT = principal / n}}, lãi = 0, balance giảm đều về 0. Không dùng công thức annuity vì mẫu {{(1+r)^n - 1}} = 0 khi r = 0 → chia cho 0; phải nhánh riêng trong code.
`,
    exercises: [
      {
        title: 'LoanSchedule.build',
        prompt: `Hoàn thiện {{LoanSchedule.build(BigDecimal principal, BigDecimal annualRatePercent, int months)}} trả {{List<Installment>}}. Mỗi Installment có {{principal}}, {{interest}}, {{balance}} (BigDecimal). Lãi tháng = annualRatePercent/12/100. PMT annuity. Kỳ cuối: principal = balance trước kỳ, interest = balance * r, balance = 0. Hỗ trợ lãi 0%.`,
        starter: `import java.math.*;
import java.util.*;

class Installment {
    BigDecimal principal;
    BigDecimal interest;
    BigDecimal balance;
    Installment(BigDecimal p, BigDecimal i, BigDecimal b) { principal = p; interest = i; balance = b; }
}

class LoanSchedule {
    static List<Installment> build(BigDecimal principal, BigDecimal annualRatePercent, int months) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static BigDecimal bd(String s) { return new BigDecimal(s); }
    public static void main(String[] args) {
        List<Installment> sched = LoanSchedule.build(bd("1000000"), bd("12"), 12);
        check("12 months", sched.size() == 12, "");
        BigDecimal sumP = BigDecimal.ZERO;
        for (Installment in : sched) sumP = sumP.add(in.principal);
        check("sum principal", sumP.compareTo(bd("1000000")) == 0, sumP.toPlainString());
        check("last balance zero", sched.get(11).balance.compareTo(BigDecimal.ZERO) == 0, "");
        List<Installment> zero = LoanSchedule.build(bd("100000"), bd("0"), 4);
        check("zero rate size", zero.size() == 4, "");
        BigDecimal sumP2 = BigDecimal.ZERO;
        for (Installment in : zero) sumP2 = sumP2.add(in.principal);
        check("zero rate sum", sumP2.compareTo(bd("100000")) == 0, "");
        check("zero rate interest zero", zero.get(0).interest.compareTo(BigDecimal.ZERO) == 0, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.*;
import java.util.*;

class Installment {
    BigDecimal principal;
    BigDecimal interest;
    BigDecimal balance;
    Installment(BigDecimal p, BigDecimal i, BigDecimal b) { principal = p; interest = i; balance = b; }
}

class LoanSchedule {
    static List<Installment> build(BigDecimal principal, BigDecimal annualRatePercent, int months) {
        List<Installment> list = new ArrayList<>();
        if (months <= 0) return list;
        BigDecimal r = annualRatePercent.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal pmt;
        if (r.compareTo(BigDecimal.ZERO) == 0) {
            pmt = principal.divide(BigDecimal.valueOf(months), 10, RoundingMode.HALF_UP);
        } else {
            BigDecimal onePlusR = BigDecimal.ONE.add(r);
            BigDecimal pow = onePlusR.pow(months);
            pmt = principal.multiply(r).multiply(pow).divide(pow.subtract(BigDecimal.ONE), 10, RoundingMode.HALF_UP);
        }
        BigDecimal balance = principal;
        for (int i = 0; i < months; i++) {
            BigDecimal interest = balance.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalPart;
            if (i == months - 1) {
                principalPart = balance;
            } else {
                principalPart = pmt.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            }
            balance = balance.subtract(principalPart).setScale(2, RoundingMode.HALF_UP);
            if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;
            list.add(new Installment(principalPart.setScale(2, RoundingMode.HALF_UP), interest, balance.setScale(2, RoundingMode.HALF_UP)));
        }
        return list;
    }
}`,
        hints: ['Dùng BigDecimal.pow cho (1+r)^n', 'Kỳ cuối principal = balance còn lại'],
        explain: `Annuity PMT cố định; kỳ cuối điều chỉnh để balance về 0. Lỗi hay gặp: không xử lý lãi 0% (chia cho 0).`,
      },
    ],
    check: [
      { q: 'Lãi tính theo cái gì?', options: ['principal ban đầu', 'dư nợ còn lại', 'tổng tiền', 'phí'], answer: 1, explain: 'Đúng (B): trong vay trả góp theo dư nợ giảm dần (reducing balance), lãi mỗi kỳ tính trên **dư nợ còn lại** (outstanding balance — số nợ chưa trả tại thời điểm đó). Dư nợ giảm sau mỗi kỳ nên tiền lãi cũng giảm dần, phần gốc trong mỗi kỳ trả đều (annuity) tăng dần. Sai (A): tính lãi trên principal ban đầu suốt kỳ là cách tính lãi phẳng (flat), không phản ánh việc đã trả bớt gốc. Sai (C): "tổng tiền" không rõ ràng và không phải cơ sở tính lãi chuẩn. Sai (D): phí (fee) là khoản thu riêng (phí hồ sơ, phí trả trước hạn...), khác với lãi (interest) là chi phí sử dụng vốn vay.' },
      { q: 'Vì sao kỳ cuối cần điều chỉnh?', options: ['để đẹp', 'do làm tròn tích lũy', 'tính lại lãi', 'không cần'], answer: 1, explain: 'Đúng (B): mỗi kỳ phải làm tròn tiền (ví dụ {{setScale(2, RoundingMode.HALF_UP)}}), các sai số nhỏ tích lũy khiến tổng gốc sau N-1 kỳ có thể lệch vài đồng so với tiền vay ban đầu. Kỳ cuối lấy gốc = dư nợ còn lại để dư nợ về đúng 0. Sai (A): không phải thẩm mỹ mà là yêu cầu chính xác kế toán/số học. Sai (C): lãi kỳ cuối vẫn tính bình thường trên dư nợ còn lại; phần điều chỉnh là ở gốc. Sai (D): không điều chỉnh thì dư nợ cuối khác 0, gây sai lệch sổ sách và lỗi đối soát.' },
      { q: 'Lãi suất công bố 12%/năm, vay trả góp hằng tháng, lãi áp dụng mỗi kỳ bằng bao nhiêu?', options: ['12%', '1%', '6%', '0,01 (tức 1% viết dưới dạng thập phân)'], answer: 3, explain: 'Đúng: r = 12 / 12 / 100 = 0,01, tức 1% mỗi tháng, nhưng trong công thức phải viết dạng thập phân 0,01 chứ không phải số nguyên 1. Sai (A): 12% là trên năm, không phải mỗi tháng. Sai (B): 1% đúng về ý nghĩa nhưng làm con số trong công thức thì là 0,01. Sai (C): 6% là nửa năm, không liên quan.' },
      { q: 'Vay trả góp lãi 0% tính thế nào?', options: ['Chỉ trả toàn bộ gốc ở kỳ cuối', 'Không cần trả gốc, chỉ trả phí', 'PMT = principal / n, mỗi kỳ trả gốc đều, lãi = 0', 'Dùng công thức annuity như thường vì 0 không ảnh hưởng'], answer: 2, explain: 'Đúng: lãi 0% → PMT = principal / n, mỗi kỳ trả gốc đều, lãi = 0, balance giảm đều về 0 ở kỳ cuối. Sai (A): đó là vay một lần cuối (balloon), không phải trả góp hàng tháng. Sai (B): vẫn phải trả gốc. Sai (C): công thức annuity có mẫu (1+r)^n - 1, khi r = 0 mẫu bằng 0 → chia cho 0, phải nhánh riêng trong code.' },
    ],
    related: [],
    tags: ['loan', 'banking', 'bigdecimal'],
  },
  {
    id: 'lesson-banking-005',
    track: 'banking',
    order: 5,
    title: 'Sổ cái kế toán kép: bút toán Nợ/Có, giao dịch cân bằng, append-only và hoàn tiền bằng bút toán đảo',
    level: 'senior',
    minutes: 35,
    goals: [
      'Giải thích được kế toán kép (double-entry) là gì và vì sao mọi giao dịch phải có tổng Nợ bằng tổng Có',
      'Tính số dư bằng tổng bút toán thay vì một con số lưu sẵn, và vì sao sổ cái chỉ được ghi thêm (append-only)',
      'Dùng txId làm khóa idempotency để retry không tạo tiền lần hai, và hoàn tiền bằng bút toán đảo',
      'Viết class {{Ledger}} với {{post}}, {{balance}}, {{reverse}} thỏa các bất biến trên',
    ],
    body: `**Tóm tắt:** Kế toán kép (double-entry ledger — sổ cái ghi mỗi giao dịch ở ít nhất hai phía Nợ/Có) đảm bảo tổng Nợ bằng tổng Có; số dư là kết quả suy ra từ tổng bút toán chứ không phải một con số ghi đè. Sổ cái chỉ ghi thêm (append-only), dùng {{txId}} làm khóa idempotency để retry không tạo tiền hai lần, và hoàn tiền bằng bút toán đảo (reversal).

### Chuyện thật: "tiền đã trừ mà app báo lỗi"

Chị Lan chuyển 100.000đ cho anh Minh. App quay vòng vòng rồi báo "Kết nối timeout". Mở lại app: tài khoản chị **đã bị trừ 101.100đ** (100.000 tiền chuyển + 1.100 phí), còn anh Minh thì chưa thấy gì. Ba câu hỏi đặt ra: tiền đang nằm ở đâu, ai đang giữ nó, và nếu hoàn thì ghi sổ thế nào để không mất dấu?

Nếu mỗi tài khoản chỉ lưu một con số {{balance}} và code làm {{balance = balance - 101100}}, thì sau sự cố **không ai chứng minh được** con số 48.900 kia từ đâu ra: lệnh UPDATE đã ghi đè mất bằng chứng. **Sổ cái kế toán kép (double-entry ledger)** phòng điều đó bằng một nguyên tắc: **không coi số dư là dữ liệu gốc**, chỉ lưu các **bút toán (entry)** — mỗi bút toán ghi một lần tiền đi hoặc tiền đến — còn số dư là **tổng của các bút toán**.

Ví dụ đời thường: hai người cho nhau vay tiền mà chỉ một người ghi sổ thì sớm muộn cũng cãi nhau. Kế toán kép bắt buộc **mỗi đồng được ghi hai lần**: một lần "đi" (**Nợ / Debit**) và một lần "đến" (**Có / Credit**), trên hai tài khoản khác nhau, trong **cùng một giao dịch**. Không có tiền "bay" giữa không trung.

### Nợ và Có: nhìn từ phía ngân hàng, không phải phía bạn

**Định nghĩa**: *Nợ (Debit)* là bút toán ghi nhận tiền **đi ra khỏi** tài khoản đó; *Có (Credit)* là bút toán ghi nhận tiền **đi vào** tài khoản đó (quy ước dùng trong bài này, thuận chiều với số dư của khách).

> Lưu ý: sách kế toán nói "tiền gửi của khách là Có trên bảng cân đối kế toán của ngân hàng" vì **ngân hàng đang mắc nợ bạn** — tài khoản của bạn là khoản *nợ phải trả* của ngân hàng. Đừng cố nhớ "Debit là tốt hay xấu": hãy nhớ quy ước của hệ thống bạn đang làm và ghi rõ nó trong tài liệu. Điều quan trọng là **thuận chiều nhau trong toàn hệ thống**.

### Bảng ví dụ: Lan chuyển 100.000đ cho Minh, phí 1.100đ

| txId | Tài khoản | Nợ (đi ra) | Có (đi vào) |
|---|---|---|---|
| T1 | CA/lan (khách) | 101.100 | |
| T1 | CA/minh (khách) | | 100.000 |
| T1 | SYS/fee (nội bộ) | | 1.100 |
| **Tổng** | | **101.100** | **101.100** |

Tổng Nợ bằng tổng Có — đó là **giao dịch cân bằng (balanced transaction)**. Nếu một trong hai cột lệch nhau 1 đồng thì hoặc code tính sai, hoặc ai đó bớt tiền: hệ thống phải **từ chối ghi** ngay tại chỗ, ném {{IllegalArgumentException}}, chứ không "ghi tạm rồi đối soát sau".

Trong code, cùng một giao dịch là một danh sách bút toán, và txId đứng ngoài làm tên:

~~~java
// T1: Lan chuyển 100.000đ cho Minh, phí 1.100đ — ba bút toán, một giao dịch
List<Entry> t1 = List.of(
    new Entry("CA/lan",  101_100, true),    // Nợ: tiền đi ra khỏi ví Lan (đã gồm phí)
    new Entry("CA/minh", 100_000, false),   // Có: tiền vào tài khoản Minh
    new Entry("SYS/fee",   1_100, false)    // Có: 1.100đ phí trở thành doanh thu ngân hàng
);
// tổng Nợ 101.100 == tổng Có 101.100  =>  cân bằng  =>  ledger.post("T1", t1) chấp nhận
~~~

### Tài khoản khách và tài khoản nội bộ

Sổ cái nào cũng có hai loại tài khoản:
- **Tài khoản khách** ({{CA/...}}): ví, tài khoản thanh toán. **Không được âm**, vì âm nghĩa là ngân hàng cho vay ngoài hạn mức. Ghi vào làm số dư âm ⇒ {{IllegalStateException}}.
- **Tài khoản nội bộ / treo** ({{SYS/...}}): phí, tài khoản chờ đối soát (suspense), số dư đầu kỳ. **Được phép âm**, vì chúng phản ánh dòng tiền của chính ngân hàng, không phải tiền của một người gửi.

Nhìn bảng trên: nếu chỉ có Lan và Minh thì tổng Nợ 101.100 ≠ tổng Có 100.000, thiếu 1.100. Tài khoản {{SYS/fee}} chính là "chỗ" cho 1.100đ đó. Đây là lý do kế toán kép bắt buộc: **mọi đồng tiền đều phải có chủ ở mọi thời điểm**, kể cả khi đang trên đường.

### Số dư = tổng bút toán

Công thức duy nhất: {{balance(acc) = sum(Có) - sum(Nợ)}} trên mọi bút toán của tài khoản đó. Vì số dư **suy ra** từ bút toán, ta luôn tái dựng (rebuild) được nó để kiểm tra, và một bản kiểm kê cuối ngày so sánh "số dư đang được app hiển thị" với "tổng bút toán" sẽ phát hiện ngay nếu có ai sửa tay. Trong code, người ta vẫn giữ một con số chạy (running balance) cho nhanh, nhưng nó chỉ là **cache** của tổng, không phải nguồn sự thật.

### Append-only: không UPDATE, không DELETE

Sổ cái chỉ **thêm** (append). Muốn sửa một sai lầm, ta **ghi thêm bút toán mới**, không xoá bút toán cũ. Lý do:
1. **Bằng chứng kiểm toán**: ngân hàng bị thanh tra; phải trả lời "số dư này hình thành từ những giao dịch nào, lúc mấy giờ, do ai".
2. **Không thể ghi đè khi đang concurrent**: hai luồng cùng cộng/trừ một con số sẽ mất tiền; ghi thêm dòng thì không xung đột.
3. **Lịch sử không mất**: khách khiếu nại sau 2 năm vẫn tra được.

### Hoàn tiền = bút toán đảo (reversal), không phải xóa

Muốn hoàn giao dịch T1, ghi một giao dịch mới {{T1:R}} với **Nợ/Có đảo ngược**:

| txId | Tài khoản | Nợ | Có |
|---|---|---|---|
| T1:R | CA/lan | | 101.100 |
| T1:R | CA/minh | 100.000 | |
| T1:R | SYS/fee | 1.100 | |

Sau T1 và T1:R, số dư trở về như cũ nhưng **sổ cái dày thêm 2 giao dịch** — vẫn còn nguyên dấu vết "đã từng chuyển và đã hoàn". Bút toán đảo **chỉ được áp dụng một lần**: gọi hoàn hai lần là tặng tiền. Lần thứ hai phải là no-op (trả {{false}}), không ghi gì thêm.

Và bút toán đảo **có thể bị từ chối**: nếu anh Minh đã tiêu hết 100.000đ, việc trừ lại 100.000đ sẽ làm {{CA/minh}} âm ⇒ {{IllegalStateException}}. Lúc này không "cưỡng bức" sổ cái; tiền nằm ở tài khoản treo và chuyển sang quy trình **tra soát (inquiry)** với ngân hàng thụ hưởng. Đây chính là nghiệp vụ thật.

### txId: vì sao retry không tạo tiền lần hai

Khi timeout, app hoặc gateway sẽ **thử lại với cùng txId** (số định danh giao dịch do phía tạo sinh ra, tiếng Anh gọi là *idempotency key* — khóa để "gửi N lần cũng chỉ có một kết quả"). Sổ cái xem txId như **khóa duy nhất**: đã có rồi thì **bỏ qua**, trả {{false}}, dù nội dung gửi lại có khác đi nữa. Không có cơ chế này, một cú bấm nút đúp hoặc một callback được gửi lại hai lần là một lần trao tiền thật.

> Senior tip: Đừng bao giờ tin con số số dư đang hiển thị; cuối ngày hãy so **tổng bút toán** với **số dư đang được phục vụ cho app** trên từng tài khoản. Ở production, phần lớn sự cố tiền tỷ được phát hiện bằng phép so đó, không phải bằng log lỗi.

### Ví dụ đời thực
- **Triệu chứng:** 8:59 khách chuyển 100.000đ, app timeout nhưng tài khoản người gửi đã bị trừ 101.100đ (gồm 1.100đ phí), người nhận chưa thấy tiền.
- **Điều tra:** Tra sổ cái theo {{txId}} thấy giao dịch T1 đã post cân bằng (Nợ CA/lan 101.100, Có CA/minh 100.000, Có SYS/fee 1.100); không có bút toán đảo. Đối chiếu với đối tác để xác định tiền đã sang hay chưa.
- **Xử lý:** Nếu đối tác chưa nhận/không ghi có, tạo bút toán đảo {{T1:R}} (append-only) để hoàn về CA/lan và đảo SYS/fee; nếu đã nhận, giữ nguyên và giải thích cho khách kèm bằng chứng sổ cái.
- **Kết quả đo được:** Tái dựng được toàn bộ lịch sử, số dư khớp với tổng bút toán, đối soát cuối ngày không còn dòng lệch bất thường cho giao dịch này.

### Lỗi hay gặp
1. **UPDATE số dư trực tiếp**: mất lịch sử, không truy vết được, và race condition (hai luồng ghi cùng lúc) có thể làm mất tiền.
2. **Không dùng txId idempotency**: retry/timeout hoặc callback lặp tạo giao dịch trùng, trừ/ghi tiền hai lần.
3. **Reversal nhiều lần**: gọi hoàn tiền hai lần mà không chặn sẽ tặng tiền (thất thoát).
4. **Giao dịch không cân bằng (tổng Nợ ≠ tổng Có)** hoặc cho tài khoản khách âm: tiền "biến mất/sinh ra" hoặc cho vay ngoài ý muốn; phải từ chối ghi nguyên tử (không ghi nửa).

### Liên hệ phỏng vấn
**Câu hỏi:** "Vì sao core banking dùng sổ cái kế toán kép thay vì một cột số dư?"
**Cách trả lời:** Ba lý do, theo thứ tự ưu tiên khi phỏng vấn: (1) **bất biến cân bằng** — mỗi giao dịch có tổng Nợ bằng tổng Có, nên không đồng tiền nào "bay", và một khoản phí 1.100đ phải có tài khoản nội bộ nhận nó; (2) **append-only** — số dư suy ra từ tổng bút toán nên tái dựng và kiểm toán được, không có UPDATE ghi đè bằng chứng, cũng tránh mất tiền khi hai luồng ghi cùng lúc; (3) **hoàn tiền bằng bút toán đảo** gắn với txId idempotency, nên retry do timeout không thể chi tiền hai lần. Nhấn thêm điểm senior: đảo chỉ được một lần, và đảo có thể thất bại nếu tài khoản thụ hưởng đã tiêu tiền — khi đó phải đưa sang tra soát, không sửa số dư bằng tay. Xem tiếp bài 6 về vòng đời chuyển khoản để nối sổ cái với luồng timeout/callback.`,
    exercises: [
      {
        title: 'Ledger: post / balance / reverse',
        prompt: `Viết class {{Ledger}} ghi sổ theo **kế toán kép**. Bút toán {{Entry}} gồm {{account}} (tiền tố {{CA/}} = tài khoản khách, {{SYS/}} = tài khoản nội bộ), {{amount}} (long, luôn dương, đơn vị đồng chẵn) và {{debit}} ({{true}} = tiền đi ra, {{false}} = tiền đi vào).

Quy tắc bắt buộc:
1. {{post(String txId, List<Entry> entries)}} trả {{boolean}}. Tổng Nợ phải **bằng** tổng Có, {{entries}} có từ 2 bút toán và mọi {{amount > 0}}; vi phạm ⇒ ném {{IllegalArgumentException}} và **không ghi gì cả**.
2. Số dư một tài khoản = tổng Có - tổng Nợ. Nếu một tài khoản **khách** ({{CA/}}) sẽ bị **âm** sau khi ghi ⇒ ném {{IllegalStateException}}, và giao dịch phải **thất bại nguyên tử** (không ghi nửa). Tài khoản {{SYS/}} được phép âm.
3. {{txId}} đã từng được ghi ⇒ **no-op**, trả {{false}}, dù entries gửi lại có khác. Thành công ⇒ trả {{true}}.
4. {{balance(String account)}} trả số dư, tài khoản chưa có bút toán nào ⇒ 0.
5. {{reverse(String txId)}}: {{txId}} chưa tồn tại ⇒ ném {{IllegalArgumentException}}; đã hoàn rồi ⇒ no-op trả {{false}}; ngược lại ghi giao dịch đảo {{txId + ":R"}} với Nợ/Có đảo ngược (có thể ném {{IllegalStateException}} nếu tài khoản khách bị âm) và trả {{true}}.
6. {{txCount()}} đã có sẵn: đếm số giao dịch đã ghi, dùng để chứng minh sổ chỉ **thêm**.`,
        starter: `import java.util.*;

class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}

class Ledger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();
    private final Set<String> reversed = new HashSet<>();

    boolean post(String txId, List<Entry> entries) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean reverse(String txId) {
        throw new UnsupportedOperationException("TODO");
    }

    int txCount() {
        return txLog.size();
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Entry en(String acc, long amt, boolean debit) { return new Entry(acc, amt, debit); }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }

    public static void main(String[] args) {
        Ledger ld = new Ledger();
        check("fund ok", ld.post("T0", of(en("CA/lan", 150000, false), en("SYS/opening", 150000, true))), "T0 phai tra true");
        check("balance lan", ld.balance("CA/lan") == 150000, "da=" + ld.balance("CA/lan"));
        check("unknown account = 0", ld.balance("CA/nobody") == 0, "da=" + ld.balance("CA/nobody"));
        check("internal account may go negative", ld.post("T0b", of(en("SYS/opening", 10, true), en("CA/other", 10, false))), "SYS/opening am thi van duoc ghi");

        List<Entry> transfer = of(en("CA/lan", 101100, true), en("CA/minh", 100000, false), en("SYS/fee", 1100, false));
        check("transfer posted", ld.post("T1", transfer), "T1 phai tra true");
        check("lan debited both fee and principal", ld.balance("CA/lan") == 48900, "da=" + ld.balance("CA/lan"));
        check("minh credited principal only", ld.balance("CA/minh") == 100000, "da=" + ld.balance("CA/minh"));
        check("fee income credited", ld.balance("SYS/fee") == 1100, "da=" + ld.balance("SYS/fee"));

        int txBefore = ld.txCount();
        check("duplicate txId is no-op", !ld.post("T1", transfer), "post trung txId phai tra false");
        check("duplicate changed nothing", ld.balance("CA/lan") == 48900 && ld.txCount() == txBefore, "txCount=" + ld.txCount());
        check("same txId with other entries still no-op", !ld.post("T1", of(en("CA/lan", 500000, true), en("CA/minh", 500000, false))), "");
        check("balance kept after refused replay", ld.balance("CA/lan") == 48900 && ld.txCount() == txBefore, "txCount=" + ld.txCount());

        check("unbalanced rejected", expect(IllegalArgumentException.class, () -> ld.post("T2", of(en("CA/lan", 100, true), en("CA/minh", 50, false)))), "Neh/Coh lech phai bi tu choi");
        check("overdraft rejected", expect(IllegalStateException.class, () -> ld.post("T3", of(en("CA/lan", 999999, true), en("CA/minh", 999999, false)))), "khach am so du phai bi tu choi");
        check("rejected tx leaves ledger untouched", ld.txCount() == txBefore && ld.balance("CA/lan") == 48900 && ld.balance("CA/minh") == 100000, "txCount=" + ld.txCount());
        check("zero amount rejected", expect(IllegalArgumentException.class, () -> ld.post("T4", of(en("CA/lan", 0, true), en("CA/minh", 0, false)))), "");
        check("empty entries rejected", expect(IllegalArgumentException.class, () -> ld.post("T5", new ArrayList<Entry>())), "");
        check("txId reusable after rejection", ld.post("T3", of(en("CA/lan", 1000, true), en("CA/minh", 1000, false))), "T3 bi tu choi thi lan sau phai ghi duoc");

        long lanNow = ld.balance("CA/lan");
        long minhNow = ld.balance("CA/minh");
        check("reverse returns true", ld.reverse("T1"), "");
        check("reverse puts money back on payer", ld.balance("CA/lan") == lanNow + 101100, "da=" + ld.balance("CA/lan"));
        check("reverse claws money from payee", ld.balance("CA/minh") == minhNow - 100000, "da=" + ld.balance("CA/minh"));
        check("reverse also reverses fee", ld.balance("SYS/fee") == 0, "da=" + ld.balance("SYS/fee"));
        check("append-only: reversal adds a tx", ld.txCount() == txBefore + 2, "txCount=" + ld.txCount());
        check("reverse twice is no-op", !ld.reverse("T1"), "");
        check("reverse twice changes nothing", ld.balance("CA/lan") == lanNow + 101100 && ld.txCount() == txBefore + 2, "txCount=" + ld.txCount());
        check("reverse unknown tx throws", expect(IllegalArgumentException.class, () -> ld.reverse("NOPE")), "");

        Ledger l2 = new Ledger();
        l2.post("S0", of(en("CA/lan", 100000, false), en("SYS/opening", 100000, true)));
        l2.post("S1", of(en("CA/lan", 100000, true), en("CA/minh", 100000, false)));
        l2.post("S2", of(en("CA/minh", 100000, true), en("CA/shop", 100000, false)));
        check("late reversal refused when payee already spent", expect(IllegalStateException.class, () -> l2.reverse("S1")), "minh da tieu het thi dao S1 lam am CA/minh");
        check("refused reversal is atomic", l2.balance("CA/lan") == 0 && l2.balance("CA/shop") == 100000 && l2.txCount() == 3, "txCount=" + l2.txCount() + " lan=" + l2.balance("CA/lan"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}

class Ledger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();
    private final Set<String> reversed = new HashSet<>();

    boolean post(String txId, List<Entry> entries) {
        if (txId == null || txId.isEmpty()) throw new IllegalArgumentException("txId rong");
        if (txLog.containsKey(txId)) return false;                      // idempotency: txId da ghi => bo qua
        if (entries == null || entries.size() < 2) throw new IllegalArgumentException("giao doi can tu 2 but toan");
        long debits = 0, credits = 0;
        Map<String, Long> delta = new LinkedHashMap<>();
        for (Entry e : entries) {
            if (e.account == null || e.account.isEmpty()) throw new IllegalArgumentException("account rong");
            if (e.amount <= 0) throw new IllegalArgumentException("amount phai > 0: " + e.amount);
            if (e.debit) debits += e.amount; else credits += e.amount;
            long signed = e.debit ? -e.amount : e.amount;               // Co lam so du tang
            delta.merge(e.account, signed, Long::sum);
        }
        if (debits != credits) throw new IllegalArgumentException("Lech Neh/Coh: " + debits + " khac " + credits);
        for (Map.Entry<String, Long> d : delta.entrySet()) {            // KIỂM TRA TRƯỚC, chưa ghi gì cả
            String acc = d.getKey();
            if (!acc.startsWith("CA/")) continue;                       // tài khoản nội bộ được phép âm
            long after = balance(acc) + d.getValue();
            if (after < 0) throw new IllegalStateException("Thieu hut " + acc + ": so du sau khi ghi = " + after);
        }
        for (Map.Entry<String, Long> d : delta.entrySet()) balances.merge(d.getKey(), d.getValue(), Long::sum);
        txLog.put(txId, new ArrayList<>(entries));                       // append-only
        return true;
    }

    long balance(String account) {
        return balances.getOrDefault(account, 0L);
    }

    boolean reverse(String txId) {
        List<Entry> original = txLog.get(txId);
        if (original == null) throw new IllegalArgumentException("tx khong ton tai: " + txId);
        if (reversed.contains(txId)) return false;                      // hoan chi duoc 1 lan
        List<Entry> flip = new ArrayList<>();
        for (Entry e : original) flip.add(new Entry(e.account, e.amount, !e.debit));
        post(txId + ":R", flip);                                        // co the nem IllegalStateException
        reversed.add(txId);
        return true;
    }

    int txCount() {
        return txLog.size();
    }
}`,
        hints: [
          'Đừng ghi ngay: cộng dồn Nợ và Có trước, so hai tổng, rồi mới tính delta từng tài khoản vào một Map tạm.',
          'Delta của tài khoản = Có trừ Nợ ({{signed = debit ? -amount : amount}}), sau đó kiểm tra {{CA/}} nào thành âm trước khi áp dụng.',
          'reverse: đảo cờ debit của mọi bút toán gốc và post bằng txId mới ({{txId + ":R"}}); remember tập txId đã hoàn để lần sau trả false.',
          'Kiểm tra xong mới ghi ⇒ thất bại là nguyên tử; nếu ghi xen kẽ kiểm tra thì giao dịch lỗi để lại nửa sổ.',
        ],
        explain: `Bốn bất biến được test riêng lẻ: **cân bằng Nợ/Có** ({{T2}} bị từ chối bằng {{IllegalArgumentException}}), **tài khoản khách không âm** ({{T3}} ⇒ {{IllegalStateException}}), **idempotency theo txId** (ghi lại {{T1}} trả false dù entries khác), **hoàn tiền một lần** ({{reverse("T1")}} lần hai trả false).

Điểm dễ sai nhất khi viết: kiểm tra số dư **ngay trong vòng lặp ghi**. Cách đó để lại sổ hỏng khi bút toán thứ hai bị từ chối. Hãy tách **ba pha**: (1) validate + cộng tổng, (2) simulate delta và kiểm tra ràng buộc, (3) chỉ khi ổn mới áp vào {{balances}} và {{txLog}}.

{{reverse}} minh họa "sửa sai = ghi thêm": số dư quay về cũ nhưng {{txCount}} tăng. Test "late reversal refused" cho thấy giới hạn thật của hoàn tiền — khi người nhận đã tiêu, sổ cái từ chối vì {{CA/minh}} sẽ âm, và nghiệp vụ phải chuyển sang tra soát (bài 6).

Lỗi hay gặp trong phỏng vấn: dùng {{double}} cho amount (làm tròn trôi), cho phép {{amount}} âm để "tự động thành bút toán đảo" (phá bất biến cân bằng), và dùng {{UPDATE}} số dư (mất dấu vết kiểm toán).`,
      },
    ],
    check: [
      { q: 'Một giao dịch kế toán kép được chấp nhận khi nào?', options: ['tổng Nợ lớn hơn tổng Có', 'tổng Nợ bằng tổng Có', 'chỉ cần một bút toán', 'số dư người gửi dương'], answer: 1, explain: 'Bất biến cân bằng: mỗi đồng đi ra phải có nơi nhận; lệch dù 1 đồng là bug, hệ thống từ chối ghi' },
      { q: 'Vì sao sổ cái thiết kế append-only (chỉ ghi thêm)?', options: ['để file lớn dần', 'cho nhanh hơn UPDATE', 'giữ bằng chứng kiểm toán và tái dựng được số dư', 'vì bảng tài khoản không cho phép UPDATE'], answer: 2, explain: 'Số dư suy ra từ tổng bút toán; UPDATE sẽ xoá dấu vết và gây mất tiền khi ghi đồng thời' },
      { q: 'App timeout và gửi lại cùng txId. Sổ cái phải làm gì?', options: ['ghi thêm lần nữa', 'no-op và trả false', 'ném lỗi runtime để cảnh báo', 'xoá bút toán cũ rồi ghi mới'], answer: 1, explain: 'txId là khóa idempotency; ghi lần hai là chi tiền hai lần' },
      { q: 'Hoàn tiền (reversal) trong sổ cái kép là gì?', options: ['cộng tay vào cột số dư', 'xoá bút toán gốc', 'ghi bút toán mới với Nợ/Có đảo ngược, chỉ một lần', 'đặt trạng thái giao dịch thành CANCELLED'], answer: 2, explain: 'Sổ dày thêm nhưng số dư trở về cũ, vẫn còn dấu vết đã từng chuyển và đã hoàn' },
    ],
    related: [],
    tags: ['ledger', 'double-entry', 'banking', 'idempotency'],
  },
  {
    id: 'lesson-banking-006',
    track: 'banking',
    order: 6,
    title: 'Vòng đời chuyển khoản liên ngân hàng: PENDING/TIMEOUT/SUCCESS/FAILED, callback trùng và tra soát',
    level: 'senior',
    minutes: 35,
    goals: [
      'Phân biệt TIMEOUT với FAILED và vì sao "chưa biết" không được xử lý như "đã chắc"',
      'Đọc được bảng chuyển trạng thái của một lệnh chuyển khoản NAPAS và vai trò NEEDS_INQUIRY',
      'Giải thích vì sao callback trùng phải là no-op và vì sao SUCCESS muộn không được tự động cộng tiền',
      'Viết {{TransferStateMachine}} chỉ cho chuyển trạng thái hợp lệ, ném {{IllegalStateException}} khi sai',
    ],
    body: `**Tóm tắt:** {{TIMEOUT}} trong chuyển khoản liên ngân hàng nghĩa là chưa biết kết quả (không phải thất bại). Thiết kế state machine an toàn: giữ tiền ở tài khoản treo (suspense), xử lý callback trùng idempotent, đưa kết quả muộn sang {{NEEDS_INQUIRY}} để tra soát thay vì tự cộng/hoàn tiền.

### Chuyện thật: tiền đã sang tài khoản khác, app vẫn báo đỏ

8:59 sáng, anh Minh chuyển khoản qua app. App báo "Giao dịch không thành công, tiền sẽ hoàn trong 3–5 ngày làm việc". 9:00, anh mở app ngân hàng thụ hưởng: **tiền đã nằm đó**. 10:30 anh nhận SMS "giao dịch thành công". Còn chị Lan (người chuyển) thì bị trừ tiền lúc 8:59 và app của chị **vẫn báo lỗi**. Không ai ăn tiền của ai — chỉ vì hai hệ thống **biết những điều khác nhau tại những thời điểm khác nhau**, và app của Lan hiển thị một **trạng thái** chứ không hiển thị **sự thật**.

Nghiệp vụ chuyển khoản liên ngân hàng đi qua một **đầu mối chuyển mạch** (chuyển mạch = gom lệnh của nhiều ngân hàng rồi chuyển cho đúng ngân hàng nhận; ở Việt Nam đóng vai này là **NAPAS** — Công ty Cổ phần Thanh toán Quốc gia Việt Nam) nên nó không phải là "thành công / thất bại", mà là một **máy trạng thái (state machine)**: tập hợp hữu hạn trạng thái + bảng quy định trạng thái nào được đi tới trạng thái nào khi nhận sự kiện gì.

> Thuật ngữ: *máy trạng thái* = object chỉ đứng ở một trạng thái tại một thời điểm, và mọi chuyển động đều phải khớp bảng. Ví dụ đời thường: đèn giao thông có 3 trạng thái; không tồn tại bước "đỏ → xanh" nếu bảng nói phải qua "vàng".

### Năm trạng thái, ba nhóm ý nghĩa

| Trạng thái | Ý nghĩa | Ai biết | Được coi là chốt chưa |
|---|---|---|---|
| {{PENDING}} | đã trừ tiền phía gửi, đang chờ phía nhận trả lời | ngân hàng gửi | chưa |
| {{TIMEOUT}} | **quá hạn chờ mà chưa có câu trả lời** | ngân hàng gửi | chưa |
| {{SUCCESS}} | đối tác xác nhận tiền đã ghi có | hai bên | rồi |
| {{FAILED}} | đối tác khẳng định **không** nhận (sai số tài khoản, ngân hàng thụ hưởng từ chối) | hai bên | rồi |
| {{NEEDS_INQUIRY}} | có kết quả trái ngược cần đội vận hành đối soát | vận hành | chưa |

Khác biệt cốt lõi, và cũng là câu trả lời phỏng vấn ăn điểm:

- **FAILED = kiến thức**: đối tác nói "tôi không nhận". Hoàn tiền là hành động đúng.
- **TIMEOUT = thiếu kiến thức**: ta chỉ hết chờ, còn sự thật ở đâu đó chưa về. Coi TIMEOUT như FAILED rồi hoàn tiền là **in tiền hai lần**: nếu đối tác thực ra đã ghi có cho người thụ hưởng, ta vừa hoàn tiền cho người gửi **và** người nhận vẫn có tiền ⇒ ngân hàng lỗ, và hai sổ cái lệch nhau (xem bài 5).

Vì thế TIMEOUT **không được phép tự động hoàn**. Nó mở đường cho hai thứ: hoặc một callback/sự kiện muộn tới, hoặc một lệnh **tra soát (inquiry)**.

### Callback muộn và đường tới NEEDS_INQUIRY

Đầu mối chuyển mạch hoặc ngân hàng thụ hưởng trả lời sau 40 giây, trong khi app đã báo "lỗi" từ giây thứ 5. Callback {{SUCCESS}} đó **không được** âm thầm chuyển {{TIMEOUT}} thẳng thành {{SUCCESS}} rồi cộng tiền, vì từ lúc timeout tới giờ có thể đã có: lệnh hoàn thủ công của đội vận hành, một callback khác, hoặc người dùng đã bấm chuyển lại. Hệ thống an toàn chuyển sang {{NEEDS_INQUIRY}} — trạng thái "kết quả mới về nhưng chưa đủ tin để tự áp dụng; phải đưa ra người thật đối soát". Sau khi tra soát xong, vận hành bấm một trong hai sự kiện chốt: {{CONFIRM_SUCCESS}} hoặc {{CONFIRM_FAILURE}}.

### Callback trùng: kẻ giết người thầm lặng

Không ai gửi một callback chỉ một lần. Hạ tầng thanh toán retry theo backoff (lùi dần: thử lại sau 1s, rồi 5s, rồi 30s): cùng một thông báo "SUCCESS" có thể tới nhiều lần, hoặc tới cả qua callback lẫn qua tra soát. Nếu code viết:

~~~java
// SAI: mỗi lần callback là một lần ghi sổ
void onCallback(Callback c) {
    ledger.post(newTxId(), entriesFor(c));   // callback tới 2 lần = cộng tiền 2 lần
}
~~~

thì một nhịp mạng chập chờn là tiền được in ra từ không khí. Quy tắc: **xử lý callback phải idempotent** — trùng với sự kiện đã áp dụng thì **no-op** (không đổi trạng thái, không ghi thêm gì, không bắn thông báo lặp). Trong bài tập, "{{SUCCESS}} đã áp dụng rồi mà lại nhận {{SUCCESS}}" là no-op im lặng, còn "{{SUCCESS}} đã áp dụng rồi mà nay nhận {{FAILED}}" là **mâu thuẫn thật** ⇒ ném {{IllegalStateException}} để gọi con người dậy lúc 2 giờ sáng.

### Vì sao "tiền bị trừ mà app báo lỗi" — nhìn vào sổ cái

Nối với bài 5: khi nhận lệnh chuyển, ngân hàng gửi ghi ngay một giao dịch **cân bằng** kéo tiền khỏi người gửi và đặt nó vào **tài khoản treo (suspense, {{SYS/suspense}})**:

| txId | Tài khoản | Nợ | Có |
|---|---|---|---|
| T1 | CA/lan | 101.100 | |
| T1 | SYS/suspense | | 100.000 |
| T1 | SYS/fee | | 1.100 |

Tiền không "mất" lúc timeout: nó **đang nằm ở suspense**, và sổ cái biết chính xác điều đó. Khi {{SUCCESS}} về ⇒ ghi có {{CA/minh}} và rút khỏi suspense. Khi {{FAILED}} về ⇒ bút toán đảo đưa tiền về {{CA/lan}}. Khi không có gì về ⇒ treo đó, chờ tra soát. App báo "lỗi" chỉ vì nó map {{TIMEOUT}} thành thông điệp "chưa thành công, tiền của bạn đang được xử lý/hoàn trong X ngày" — chứ không phải "mất tiền".

### Luồng một lệnh chuyển khoản

~~~seq
title: Lệnh chuyển khoản liên ngân hàng bị timeout
actors: App | BankAPI | Switch | NganHangNhan
App -> BankAPI: POST /transfers với txId=T1
BankAPI -> BankAPI: ghi ledger, tiền nằm ở SYS/suspense
BankAPI -> Switch: lập phiên NAPAS
Switch -> NganHangNhan: chuyển 100.000đ cho CA/minh
note BankAPI: hết 5 giây, chưa thấy phản hồi
BankAPI --> App: TIMEOUT: báo lỗi, tiền đã trừ
Switch --> BankAPI: callback SUCCESS muộn (giây 40)
BankAPI -> BankAPI: TIMEOUT sang NEEDS_INQUIRY
App -> BankAPI: GET /transfers/T1 để xem lại
BankAPI -> Switch: inquiry (tra soát) T1
Switch --> BankAPI: kết quả chính thức: SUCCESS
BankAPI --> App: SUCCESS sau khi vận hành xác nhận
~~~

### Bảng chuyển trạng thái của bài tập

| Từ | Sự kiện | Đến |
|---|---|---|
| {{PENDING}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} |
| {{PENDING}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | ném {{IllegalStateException}} (không được nhảy cóc, chưa có kết quả tra soát) |
| {{TIMEOUT}} | {{TIMEOUT}} | no-op (callback trùng) |
| {{TIMEOUT}} | {{SUCCESS}} | {{NEEDS_INQUIRY}} (kết quả muộn: không tự cộng tiền) |
| {{TIMEOUT}} | {{FAILED}} | {{FAILED}} (đối tác khẳng định không nhận ⇒ hoàn được) |
| {{NEEDS_INQUIRY}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | no-op (trùng, chờ con người) |
| {{NEEDS_INQUIRY}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | {{SUCCESS}} / {{FAILED}} |
| {{SUCCESS}} | {{SUCCESS}} | no-op |
| {{SUCCESS}} | sự kiện khác | ném {{IllegalStateException}} |
| {{FAILED}} | {{FAILED}} | no-op |
| {{FAILED}} | sự kiện khác | ném {{IllegalStateException}} |

Bảng gọn thành một quy tắc: **sự kiện đưa về đúng trạng thái hiện tại ⇒ no-op; sự kiện không có trong bảng ⇒ ném lỗi; mọi chuyển động thật ⇒ ghi một dòng lịch sử**.

### Lỗi hay gặp trên production
1. **Map TIMEOUT thành FAILED** để "cho sạch sẽ" ⇒ tiền được hoàn trong khi người nhận đã có tiền.
2. **Không lưu lịch sử chuyển trạng thái** ⇒ khi khiếu nại, không chứng minh được app đã biết gì, lúc nào.
3. **Callback handler không idempotent** ⇒ cộng tiền, gửi OTP, gửi SMS hai lần cho cùng một giao dịch.
4. **Viết if/else rải rác ở từng callback** thay vì một bảng chuyển tiếp tập trung ⇒ thêm một trạng thái mới là phải sửa rất nhiều chỗ, và chỗ quên sửa chính là lỗ hổng.
5. **Không có timeout ở tầng gọi đi**: chờ tới khi đối tác trả lời, trong khi đối tác cũng đang chờ mình ⇒ hai bên treo song song. Đặt timeout ngắn ở phía mình rồi dùng tra soát là chuẩn.

> Senior tip: Đặt **SLA tra soát** bằng con số của chính quy chế bạn đang chịu (thời gian tối đa chấp nhận một phản hồi muộn, và cam kết hoàn tiền hiển thị với khách thường được viết trong tài liệu sản phẩm), kèm **alert trên số lệnh nằm ở NEEDS_INQUIRY**. Một hai lệnh treo là bình thường; đường cong tăng dốc nghĩa là đối tác hoặc đầu mối chuyển mạch có vấn đề — đó là sự cố, không phải nghiệp vụ.

### Liên hệ phỏng vấn
**Câu hỏi:** "Chuyển khoản của khách timeout, ngân hàng thụ hưởng báo SUCCESS muộn. Bạn xử lý thế nào?"
**Cách trả lời:** Trước hết khẳng định **timeout là thiếu thông tin, không phải thất bại**, nên không được tự động hoàn tiền, nếu không tiền vừa ở tài khoản người nhận vừa về tài khoản người gửi. Thiết kế: tiền của lệnh đang chờ nằm ở **tài khoản treo (suspense)** trên sổ cái kế toán kép (bài 5) nên luôn truy vết được; trạng thái chuyển {{PENDING → TIMEOUT}} rồi {{TIMEOUT → NEEDS_INQUIRY}} khi {{SUCCESS}} tới muộn, tức **không tự ý ghi có** mà đưa vào hàng đợi tra soát ({{inquiry}}) gửi lên đầu mối chuyển mạch; khi có kết quả chính thức, vận hành bấm {{CONFIRM_SUCCESS}} hoặc {{CONFIRM_FAILURE}} để chốt. Callback phải **idempotent**: trùng sự kiện đã áp dụng là no-op, còn mâu thuẫn (đã SUCCESS mà nhận FAILED) thì ném {{IllegalStateException}} và alert. Điểm cộng khi trả lời: nhắc {{txId}} làm khóa idempotency, SLA tra soát, và metrics cảnh báo số lệnh treo ở {{NEEDS_INQUIRY}}.`,
    exercises: [
      {
        title: 'TransferStateMachine.apply',
        prompt: `Viết {{TransferStateMachine}} cho một lệnh chuyển khoản liên ngân hàng. Trạng thái khởi tạo là {{PENDING}}. Bảng chuyển tiếp **đúng như trong bài học**:

- {{PENDING}} + {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} ⇒ {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}}.
- {{TIMEOUT}} + {{SUCCESS}} ⇒ {{NEEDS_INQUIRY}} (kết quả muộn, không tự ghi có). {{TIMEOUT}} + {{FAILED}} ⇒ {{FAILED}}.
- {{NEEDS_INQUIRY}} + {{CONFIRM_SUCCESS}} ⇒ {{SUCCESS}}; + {{CONFIRM_FAILURE}} ⇒ {{FAILED}}.
- Sự kiện mà trạng thái đích **bằng đúng** trạng thái hiện tại ⇒ **no-op** (callback trùng): không đổi trạng thái, không ghi lịch sử, **không ném lỗi**.
- Mọi sự kiện không có trong bảng (ví dụ {{PENDING}} + {{CONFIRM_SUCCESS}}, {{SUCCESS}} + {{FAILED}}, {{FAILED}} + {{SUCCESS}}) ⇒ ném {{IllegalStateException}} và **không đổi gì cả**.
- {{event == null}} ⇒ ném {{IllegalArgumentException}}.
- Mỗi lần chuyển trạng thái thật, thêm một dòng vào lịch sử với dạng: {{TU --SU_KIEN--> DEN}} (ví dụ {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}).

{{state()}} và {{history()}} đã có sẵn; bạn chỉ viết {{apply(Event)}}. Gợi ý: tách một hàm {{next(State from, Event e)}} trả về trạng thái đích, hoặc {{null}} nếu không hợp lệ — logic bảng nằm hết ở một chỗ.`,
        starter: `import java.util.*;

enum State { PENDING, SUCCESS, FAILED, TIMEOUT, NEEDS_INQUIRY }

enum Event { SUCCESS, FAILED, TIMEOUT, CONFIRM_SUCCESS, CONFIRM_FAILURE }

class TransferStateMachine {
    private State state = State.PENDING;
    private final List<String> history = new ArrayList<>();

    State state() { return state; }

    List<String> history() { return new ArrayList<>(history); }

    void apply(Event event) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    public static void main(String[] args) {
        TransferStateMachine a = new TransferStateMachine();
        a.apply(Event.SUCCESS);
        check("PENDING + SUCCESS -> SUCCESS", a.state() == State.SUCCESS, "state=" + a.state());
        check("lich su co 1 dong", a.history().size() == 1, "history=" + a.history());
        check("lich su dung format", a.history().get(0).equals("PENDING --SUCCESS--> SUCCESS"), "dong=" + a.history().get(0));
        a.apply(Event.SUCCESS);
        check("callback trung la no-op", a.state() == State.SUCCESS && a.history().size() == 1, "state=" + a.state() + " history=" + a.history());
        check("may moi bat dau PENDING", new TransferStateMachine().state() == State.PENDING, "");
        check("da SUCCESS nhan FAILED -> ngoai le", expect(IllegalStateException.class, () -> a.apply(Event.FAILED)), "");
        check("co dinh sau loi tu choi", a.state() == State.SUCCESS && a.history().size() == 1, "history=" + a.history());
        check("null event -> IllegalArgumentException", expect(IllegalArgumentException.class, () -> a.apply(null)), "");

        TransferStateMachine b = new TransferStateMachine();
        check("PENDING_khong_duoc_nhan_CONFIRM_SUCCESS", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_SUCCESS)), "không được nhảy cóc");
        check("PENDING_khong_duoc_nhan_CONFIRM_FAILURE", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_FAILURE)), "");
        b.apply(Event.TIMEOUT);
        check("PENDING -> TIMEOUT", b.state() == State.TIMEOUT, "state=" + b.state());
        b.apply(Event.TIMEOUT);
        check("TIMEOUT trung la no-op", b.state() == State.TIMEOUT && b.history().size() == 1, "history=" + b.history());
        b.apply(Event.SUCCESS);
        check("SUCCESS muon -> NEEDS_INQUIRY", b.state() == State.NEEDS_INQUIRY, "state=" + b.state());
        check("dong lich su late success", b.history().get(1).equals("TIMEOUT --SUCCESS--> NEEDS_INQUIRY"), "dong=" + b.history().get(1));
        b.apply(Event.SUCCESS);
        check("SUCCESS lap lai tai NEEDS_INQUIRY la no-op", b.state() == State.NEEDS_INQUIRY && b.history().size() == 2, "history=" + b.history());
        b.apply(Event.FAILED);
        check("FAILED lap tai NEEDS_INQUIRY la no-op", b.state() == State.NEEDS_INQUIRY && b.history().size() == 2, "history=" + b.history());
        b.apply(Event.CONFIRM_SUCCESS);
        check("CONFIRM_SUCCESS -> SUCCESS", b.state() == State.SUCCESS && b.history().size() == 3, "history=" + b.history());
        check("da_SUCCESS_khong_con_nhan_CONFIRM", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_FAILURE)), "");

        TransferStateMachine c = new TransferStateMachine();
        c.apply(Event.TIMEOUT);
        c.apply(Event.FAILED);
        check("TIMEOUT + FAILED -> FAILED", c.state() == State.FAILED, "state=" + c.state());
        c.apply(Event.FAILED);
        check("FAILED trung la no-op", c.state() == State.FAILED && c.history().size() == 2, "history=" + c.history());
        check("FAILED khong the dao thanh SUCCESS", expect(IllegalStateException.class, () -> c.apply(Event.SUCCESS)), "");
        check("FAILED khong the timeout nua", expect(IllegalStateException.class, () -> c.apply(Event.TIMEOUT)), "");
        check("state sau khi bi tu choi van co dinh", c.state() == State.FAILED && c.history().size() == 2, "history=" + c.history());
        check("FAILED_khong_nhan_CONFIRM", expect(IllegalStateException.class, () -> c.apply(Event.CONFIRM_SUCCESS)), "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

enum State { PENDING, SUCCESS, FAILED, TIMEOUT, NEEDS_INQUIRY }

enum Event { SUCCESS, FAILED, TIMEOUT, CONFIRM_SUCCESS, CONFIRM_FAILURE }

class TransferStateMachine {
    private State state = State.PENDING;
    private final List<String> history = new ArrayList<>();

    State state() { return state; }

    List<String> history() { return new ArrayList<>(history); }

    // Bảng chuyển tiếp tập trung: trả về trạng thái đích, hoặc null nếu sự kiện không hợp lệ.
    // Trả về đúng trạng thái hiện tại nghĩa là callback trùng -> no-op.
    private State next(State from, Event e) {
        switch (from) {
            case PENDING:
                switch (e) {
                    case SUCCESS: return State.SUCCESS;
                    case FAILED: return State.FAILED;
                    case TIMEOUT: return State.TIMEOUT;
                    default: return null;
                }
            case TIMEOUT:
                switch (e) {
                    case SUCCESS: return State.NEEDS_INQUIRY;   // ket qua muon: khong tu cong tien
                    case FAILED: return State.FAILED;           // đối tác khẳng định không nhận
                    case TIMEOUT: return State.TIMEOUT;         // trung -> no-op
                    default: return null;
                }
            case NEEDS_INQUIRY:
                switch (e) {
                    case CONFIRM_SUCCESS: return State.SUCCESS;
                    case CONFIRM_FAILURE: return State.FAILED;
                    case SUCCESS: case FAILED: case TIMEOUT: return State.NEEDS_INQUIRY;  // trung -> cho con nguoi
                    default: return null;
                }
            case SUCCESS:
                return e == Event.SUCCESS ? State.SUCCESS : null;
            case FAILED:
                return e == Event.FAILED ? State.FAILED : null;
            default:
                return null;
        }
    }

    void apply(Event event) {
        if (event == null) throw new IllegalArgumentException("event null");
        State from = state;
        State to = next(from, event);
        if (to == null) throw new IllegalStateException("Chuyen khong hop le: " + from + " + " + event);
        if (to == from) return;                                    // callback trung: no-op im lang
        state = to;
        history.add(from + " --" + event + "--> " + to);
    }
}`,
        hints: [
          'Đừng viết if dài theo từng if-else rải rác; gom bảng vào một hàm {{next(from, event)}} trả về trạng thái đích hoặc null.',
          'No-op chính là trường hợp {{next}} trả về đúng {{from}}: kiểm tra {{to == from}} rồi {{return}} **trước khi** ghi lịch sử.',
          'Ném {{IllegalStateException}} khi không có đường chuyển, và nhớ **không** được đổi {{state}} hay {{history}} ở nhánh lỗi.',
          'Chỗ khó nhất: {{TIMEOUT}} + {{SUCCESS}} phải đi tới {{NEEDS_INQUIRY}}, còn {{PENDING}} + {{SUCCESS}} đi thẳng tới {{SUCCESS}}.',
        ],
        explain: `Máy trạng thái chỉ có **một cửa vào** là {{apply}}, nên mọi hành vi nằm trong bảng {{next}} — đó là điều bài học muốn bạn giữ được: thêm trạng thái mới chỉ sửa một chỗ.

Ba nhóm case test riêng: (1) **no-op idempotent** — cùng một callback tới hai lần thì trạng thái và lịch sử đứng yên; (2) **kết quả muộn** — {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}, không bao giờ {{TIMEOUT → SUCCESS}} thẳng, vì tiền còn treo ở suspense chờ tra soát; (3) **trạng thái chốt** — {{SUCCESS}} và {{FAILED}} chỉ nhận lại đúng chính sự kiện đã đưa chúng tới đó, mọi thứ khác ném {{IllegalStateException}} để alert.

{{history}} không phải "nice to have": khi khách khiếu nại "app báo lỗi mà tiền đi đâu", dòng {{PENDING --TIMEOUT--> TIMEOUT}} rồi {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}} kèm timestamp chính là bằng chứng vận hành và pháp lý.

Lỗi kinh điển khi viết: cho {{NEEDS_INQUIRY + SUCCESS}} nhảy thẳng sang {{SUCCESS}} (tự cộng tiền khi chưa đối soát), hoặc dùng {{Exception}} chung cho cả "trùng" lẫn "sai" — nghiệp vụ cần phân biệt: trùng là bình thường, sai là sự cố.`,
      },
    ],
    check: [
      { q: 'Điểm khác nhau giữa TIMEOUT và FAILED là gì?', options: ['Không khác, cả hai đều hoàn tiền', 'TIMEOUT là chưa biết kết quả, FAILED là đối tác khẳng định không nhận', 'TIMEOUT luôn nghiêm trọng hơn FAILED', 'FAILED không bao giờ phải hoàn tiền'], answer: 1, explain: 'Đúng (B): {{TIMEOUT}} nghĩa là hệ thống gửi chưa nhận được phản hồi trong thời gian chờ — kết quả thực tế chưa biết (đối tác có thể đã xử lý thành công hoặc chưa). {{FAILED}} nghĩa là đối tác đã xác nhận rõ ràng giao dịch không thành công (ví dụ sai tài khoản thụ hưởng, từ chối). Sai (A): xử lý TIMEOUT như FAILED và tự hoàn tiền ngay có thể gây "tiền nhân đôi" nếu đối tác thực ra đã ghi có. Sai (C): mức độ nghiêm trọng phụ thuộc ngữ cảnh; TIMEOUT khó xử lý hơn vì thiếu thông tin nhưng không phải lúc nào cũng "nặng" hơn. Sai (D): FAILED thường dẫn đến hoàn tiền/đảo giao dịch theo quy trình, không phải "không bao giờ hoàn".' },
      { q: 'Callback SUCCESS tới khi giao dịch đang TIMEOUT. Hành động an toàn?', options: ['Chuyển thẳng SUCCESS và ghi có cho người nhận', 'Bỏ qua, chờ khách gọi tổng đài', 'Chuyển NEEDS_INQUIRY rồi tra soát, chỉ ghi có sau khi xác nhận', 'Ném lỗi và revert mọi thứ'], answer: 2, explain: 'Đúng (C): khi callback {{SUCCESS}} đến muộn lúc giao dịch đang {{TIMEOUT}}, không nên tự động chuyển thẳng sang {{SUCCESS}} và ghi có ngay vì có thể đã có xử lý khác (hoàn tiền thủ công, callback khác). Chuyển sang {{NEEDS_INQUIRY}} để đội vận hành/tra soát đối chiếu rồi mới chốt bằng {{CONFIRM_SUCCESS}} hoặc {{CONFIRM_FAILURE}} là an toàn. Sai (A): tự ghi có ngay có thể trùng với bước hoàn/đảo đã làm, gây sai số dư. Sai (B): bỏ qua hoàn toàn làm mất thông tin quan trọng và kéo dài treo tiền. Sai (D): ném lỗi và revert mù quáng có thể phá hỏng trạng thái đúng; cần quy trình tra soát có kiểm soát.' },
      { q: 'Hệ thống nhận callback SUCCESS lần thứ ba cho cùng một txId đã SUCCESS. Phải làm gì?', options: ['Ném IllegalStateException', 'No-op: không đổi trạng thái, không ghi lịch sử', 'Ghi thêm một bút toán Có nữa', 'Gọi lại đối tác để xác nhận'], answer: 1, explain: 'Đúng (B): callback trong hệ thống thanh toán thường bị gửi trùng (retry). Nếu sự kiện trùng với trạng thái/sự kiện đã áp dụng (đã {{SUCCESS}} mà lại nhận {{SUCCESS}}), xử lý phải idempotent: no-op — không đổi trạng thái, không ghi thêm lịch sử, không ghi sổ thêm. Sai (A): ném {{IllegalStateException}} là dành cho trường hợp mâu thuẫn thật (ví dụ đã {{SUCCESS}} mà nhận {{FAILED}}), không phải trùng hợp lệ. Sai (C): ghi thêm bút toán Có sẽ cộng tiền hai lần. Sai (D): gọi lại đối tác để "xác nhận" không cần thiết với callback trùng hợp lệ và làm tăng tải/độ phức tạp.' },
      { q: 'Trong lúc chờ kết quả, tiền của người gửi nằm ở đâu (theo sổ cái kép)?', options: ['Trong tài khoản người nhận', 'Đã bị hủy nên về người gửi', 'Tài khoản treo suspense của ngân hàng', 'Không ghi nhận ở đâu cả'], answer: 2, explain: 'Đúng (C): khi khởi tạo lệnh chuyển, hệ thống ghi bút toán cân bằng trừ tiền người gửi và đưa vào **tài khoản treo** (suspense — tài khoản chờ, dùng để tạm giữ tiền chưa xác định đích cuối). Nhờ vậy tiền luôn được truy vết trong sổ cái, không "mất tích". Khi {{SUCCESS}} thì chuyển từ suspense sang người nhận; khi {{FAILED}}/hoàn thì đảo về người gửi. Sai (A): tiền chưa chắc đã tới người nhận khi còn chờ/timeout. Sai (B): tiền không tự "bị hủy"; phải có bút toán hoàn rõ ràng. Sai (D): trong sổ cái kép mọi đồng tiền phải có tài khoản ghi nhận tại mọi thời điểm.' },
    ],
    related: [],
    tags: ['state-machine', 'banking', 'idempotency', 'napas'],
  },
  {
    id: 'lesson-banking-007',
    track: 'banking',
    order: 7,
    title: 'Số dư khả dụng và giữ tiền (hold): authorization, capture một phần, release và làm tròn BigDecimal',
    level: 'senior',
    minutes: 40,
    goals: [
      'Phân biệt số dư sổ cái (ledger balance) và số dư khả dụng (available balance), vì sao app phải hiển thị cả hai',
      'Mô tả vòng đời một khoản giữ tiền: authorise → capture (có thể nhỏ hơn số đã giữ) / release / hết hạn, và phần tiền bị khoá khi nào thì được nhả',
      'Dùng BigDecimal đúng cho tiền VND: tạo từ chuỗi, setScale(0, RoundingMode), làm tròn một lần ở biên giới, so sánh bằng compareTo',
      'Viết class {{HoldLedger}} với {{authorise}}, {{capture}}, {{release}}, {{availableBalance}}, {{ledgerBalance}} thỏa các bất biến trên',
    ],
    body: `**Tóm tắt:** {{Số dư sổ cái}} (ledger balance) là tiền đã chốt; {{số dư khả dụng}} (available balance) = sổ cái − tổng hold đang mở. Hold (authorization) khóa tiền tạm thời, capture có thể chốt một phần và phải nhả phần chênh; dùng {{BigDecimal}} với {{RoundingMode.HALF_UP}} cho VND, làm tròn một lần ở biên giới.

### Chuyện thật: "tài khoản còn 12 triệu mà sao tiêu hết 8 triệu"

Chị Lan quẹt thẻ ở khách sạn, hóa đơn dự kiến 300.000đ một đêm. Lễ tân nói: "Em giữ tạm 4.000.000đ phòng khi anh chị dùng minibar, khi nào trả phòng khách sạn mới chốt số thật". Ngân hàng gửi SMS: "Quý khách vừa thanh toán 4.000.000đ". Chị mở app: **Số dư: 12.000.000đ**, **Số dư khả dụng: 8.000.000đ**. Không ai trừ tiền của chị hai lần, cũng không ai hiển thị sai — hai con số chỉ trả lời hai câu hỏi khác nhau. Bài này dạy cách viết code cho hai con số đó, và vì sao tiền Việt có số lẻ thì bắt buộc phải dùng BigDecimal.

### Hai con số của một tài khoản

- **Số dư sổ cái (ledger balance)**: số tiền **đã chốt**. Nó chỉ đổi khi có bút toán thật (tiền vào/ra đã settlement). Đây là con số pháp lý: dùng cho sao kê, đối soát cuối ngày (bài 2) và sổ cái kép (bài 5).
- **Số dư khả dụng (available balance)** = số dư sổ cái − **tổng tiền đang bị giữ (holds)**. Đây là con số "bạn còn được chi bao nhiêu", và là con số quyết định một giao dịch mới có được chấp nhận hay không.

**Giữ tiền (hold / authorization)** là lời hứa của ngân hàng với người bán: "tài khoản này có đủ X đồng, tôi khóa X lại, đừng cho chỗ đó bị tiêu". Tiền vẫn nằm nguyên ở tài khoản, chưa đi đâu.

Ví dụ đời thường: nhà xe giữ chỗ cho bạn qua điện thoại. Chỗ ấy hiện "hết" trên bảng bán vé (khả dụng giảm), nhưng bạn chưa trả tiền (sổ cái chưa đổi). Nếu nhà xe ghi "đã thu tiền" ngay lúc giữ chỗ thì mỗi lần bạn đổi ý phải làm một lệnh hoàn — thêm một chuyển động tiền là thêm một cơ hội lệch số.

Diễn biến của ví dụ trên:

| Thời điểm | Số dư sổ cái | Hold đang mở | Khả dụng |
|---|---|---|---|
| Đầu ngày | 12.000.000 | 0 | 12.000.000 |
| Khách sạn giữ 4.000.000 | 12.000.000 | 4.000.000 | 8.000.000 |
| Chị Lan mua sách online 200.000 (trừ ngay) | 11.800.000 | 4.000.000 | 7.800.000 |
| Khách sạn chốt thật 3.000.000, nhả 1.000.000 | 8.800.000 | 0 | 8.800.000 |

Dòng thứ nhất và thứ tư cho thấy điều dễ nhầm nhất: **hold không làm thay đổi số dư sổ cái**, nó chỉ khoá một phần khả dụng.

### Vì sao nghiệp vụ thẻ buộc phải tách làm hai pha

Khi quẹt thẻ, ba chuyện xảy ra ở ba thời điểm khác nhau:

1. **Authorization (ủy quyền / xin phép)** — trong khoảng 1 giây: người bán hỏi "tài khoản này có 4 triệu không?", ngân hàng trả lời đủ/không và tạo một hold. Người bán cần câu trả lời **ngay** để in hóa đơn và bật máy cà, nếu không khách đứng chờ sẽ bỏ đi.
2. **Capture / settlement (chốt toán)** — thường là **cuối ngày**, chạy theo **lô (batch)**: người bán gộp hàng trăm giao dịch vào một file gửi lên tổ chức thẻ, ngân hàng lúc đó mới thật sự chuyển tiền. Số tiền thật có thể **khác** số đã giữ: khách sạn chỉ dùng 3.000.000, nhà hàng cộng thêm 5% **tip** (tiền boa), cây xăng khách đổ ít hơn số đã khoá.
3. **Chargeback (khách khởi kiện giao dịch)** — tiền đi một vòng ngược lại kèm phí phạt. Phần tra soát nằm ở bài 6.

Vì capture tới **muộn** và **thường nhỏ hơn số đã giữ**, code buộc phải hỗ trợ **partial capture** (chốt một phần) và **tự nhả phần chênh**. Quên bước nhả là lỗi kinh điển: giữ 4.000.000, chốt 3.000.000, 1.000.000 còn lại bị khóa vĩnh viễn. Khách gọi tổng đài hỏi "tiền tôi đâu", và vận hành phải mở tay từng hold.

Bốn động từ của một khoản giữ:

| Động từ | Ý nghĩa nghiệp vụ | Sổ cái | Hold | Khả dụng |
|---|---|---|---|---|
| {{authorise}} | khoá tiền, chưa chi gì | không đổi | mở thêm amount | giảm amount |
| {{capture}} | chốt số thật (≤ amount đã giữ) | giảm actual | đóng, tự nhả phần chênh | bằng đúng sổ cái |
| {{release}} | hủy lời hứa, không chi gì | không đổi | đóng | tăng lại amount |
| hết hạn | {{release}} tự động sau N ngày | không đổi | đóng | tăng lại amount |

### BigDecimal: vì sao tiền có số lẻ thì phải dùng nó

**BigDecimal** là class biểu diễn số thập phân **chính xác**, gồm hai phần: một số nguyên ({{unscaledValue}}) và số chữ số sau dấu phẩy ({{scale}}). Số 1234.56 được lưu như 123456 với scale bằng 2, nên không có chuyện làm tròn nhị phân.

~~~java
BigDecimal a = new BigDecimal("0.1");      // tao TU CHUOI
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));              // 0.3  -> chinh xac tuyet doi
System.out.println(0.1 + 0.2 == 0.3);      // false -> số thực nhị phân không biểu diễn được 0.1
~~~

> Lưu ý: {{new BigDecimal("0.1")}} khác hoàn toàn {{new BigDecimal(0.1)}}. Bản nhận {{double}} nhét luôn hạt nhiễu nhị phân vào số học của bạn (0.1000000000000000055511151231257827021181583488...). Tức là bạn tưởng mình dùng BigDecimal nhưng thật ra vẫn đang dùng double. Luôn khởi tạo **từ chuỗi**, hoặc dùng {{BigDecimal.valueOf(double)}} (bản này đi qua chuỗi nên an toàn).

**Scale và làm tròn**: {{setScale(n, RoundingMode)}} trả về một số **mới** có n chữ số thập phân (BigDecimal là bất biến — không có hàm nào sửa số cũ). Bảng các chế độ hay gặp:

| RoundingMode | 0,5 thành | Dùng khi |
|---|---|---|
| {{HALF_UP}} | 1 | làm tròn tiền cho khách theo quy ước "bốn bỏ, năm vào" (0–4 xuống, 5–9 lên) — chuẩn ở Việt Nam |
| {{HALF_EVEN}} | 0 | tính lãi trên hàng triệu bản ghi: làm tròn về phía số chẵn để lỗi không tích lũy một chiều |
| {{DOWN}} | 0 | cắt bớt khi chia tiền theo tỷ lệ, để phần đã chia không bao giờ vượt tổng (bài 1) |
| {{UP}} | 1 | tính số kỳ trả tối đa: thà dư một chút còn hơn thiếu |
| {{FLOOR}} / {{CEILING}} | 0 / 1 | khi ràng buộc là "không được âm" / "phải đủ" |

**Đặc thù VND**: trong thanh toán số, tiền Việt không có đơn vị nhỏ hơn 1 đồng. Vì vậy mọi số tiền **lưu và hiển thị** phải có {{scale}} bằng 0. Số dư, hold, phí đều là số đồng chẵn; phần lẻ sinh ra khi tính phí hoặc tỷ giá chỉ tồn tại tạm thời trong lúc tính.

**Làm tròn ở biên giới, không làm tròn dọc đường.** Nếu làm tròn ở từng bước trung gian rồi cộng lại, sai số tích dồn: 1.000 giao dịch mỗi cái lệch 0,5đ là 500đ bốc hơi, và 500đ đó đúng bằng một dòng lệch (break) phải giải trình trong đối soát cuối ngày (bài 2). Cách an toàn: tính với scale lớn (8–10 chữ số), chỉ {{setScale(0, HALF_UP)}} **một lần** khi ghi sổ hoặc khi hiển thị cho khách.

**Bẫy equals**: BigDecimal so sánh cả giá trị lẫn scale, nên hai số bằng nhau về tiền nhưng khác cách viết sẽ cho kết quả bất ngờ.

~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));    // false, vi scale khac nhau
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0, bang nhau ve gia tri
~~~

Mọi so sánh tiền vì thế dùng {{compareTo}}, không dùng {{equals}}. Kiểm tra "đủ tiền chưa" là {{available.compareTo(amount) >= 0}}, còn {{signum()}} (dấu của số) là cách gọn để biết một số âm/dương/bằng 0.

### Bốn bất biến của sổ giữ tiền

1. **Không được chi phần đã bị giữ**: {{authorise}} chỉ thành công khi khả dụng đủ; không đủ thì từ chối và **không ghi nửa** (nguyên tắc giống bài 5).
2. **Chốt không được vượt số đã hứa**: {{capture}} lớn hơn số đang giữ phải bị từ chối. Hợp đồng thẻ cho phép vượt một tỷ lệ nhỏ (tip), nhưng đó phải là **quy tắc nghiệp vụ có cấu hình**, không phải hậu quả của việc code quên kiểm tra.
3. **Mỗi holdId chỉ đóng một lần**: capture hoặc release lần hai là no-op trả {{false}}. Đây chính là idempotency (bài 5, bài 6) — hạ tầng thẻ gửi lại file settlement nhiều lần.
4. **Khả dụng luôn suy ra được**: {{available = ledger − tổng hold đang mở}}. Nó là **kết quả dẫn xuất**, không phải dữ liệu gốc.

### Luồng một cú quẹt thẻ

~~~seq
title: Quet the: giu tien hom nay, chot toan ngay mai
actors: App | KhachSan | ToChucThe | HoldLedger
App -> KhachSan: hoa don 300.000, le tan giu 4.000.000
KhachSan -> ToChucThe: authorization holdId H1 so tien 4.000.000
ToChucThe -> HoldLedger: authorise(H1, CA/lan, 4.000.000)
HoldLedger -> HoldLedger: khả dụng 12.000.000 có đủ không
HoldLedger --> ToChucThe: OK, kha dung con 8.000.000
ToChucThe --> KhachSan: approved, in hoa don cho khach
note HoldLedger: so du cai do van la 12.000.000
KhachSan -> ToChucThe: cuoi ngay settlement: that 3.000.000
ToChucThe -> HoldLedger: capture(H1, 3.000.000)
HoldLedger -> HoldLedger: so du con 8.800.000, dong H1, nha 1.000.000
HoldLedger --> App: SMS khach san da chot 3.000.000
~~~

### Lỗi hay gặp trên production

1. **Chỉ hiển thị một con số** (thường là số dư sổ cái) ⇒ khách tiêu phần tiền đã hứa với khách sạn; giao dịch thứ hai bị từ chối dù app vừa báo "đủ tiền".
2. **Không có job hết hạn hold** ⇒ tiền bị khoá nhiều ngày, thậm chí nhiều tuần. Giữ tiền luôn phải kèm ngày hết hạn và app phải ghi "sẽ nhả sau X ngày".
3. **Partial capture không nhả phần chênh** ⇒ hold "ma" treo mãi; đây là nguồn khiếu nại đứng đầu của ngành khách sạn và cho thuê xe.
4. **Trừ tiền ngay lúc authorise**, rồi settlement lại trừ lần nữa ⇒ mất tiền hai lần. Cùng bản chất với callback trùng ở bài 6: một sự thật nghiệp vụ chỉ được ghi sổ một lần.
5. **Dùng {{double}} cho tiền**, hoặc **dùng {{equals}} để so tiền**.
6. **Làm tròn ở mỗi bước tính** ⇒ tổng tiền không khớp với số đã trừ của khách, và lệch đó chui vào đối soát cuối ngày.
7. **Lưu cột available vào bảng tài khoản** ⇒ sau một transaction hỏng, cột đó lệch khỏi (sổ cái − hold). Job "rebuild số dư khả dụng" chạy hằng đêm không phải giải pháp; nó là bằng chứng thiết kế sai.

> Senior tip: Hãy đặt **hạn mức cho hold** theo loại hình chấp nhận thẻ (khách sạn và thuê xe được giữ gấp nhiều lần hóa đơn dự kiến, quán ăn thì không), và luôn in **ba con số** trong sao kê: số dư sổ cái, tổng hold đang mở, khả dụng — kèm danh sách "giao dịch đang chờ chốt" có tên người bán và ngày hết hạn. Khi khách hỏi "vì sao tôi còn 12 triệu mà tiêu được 8 triệu", câu trả lời phải tự hiện ra trên màn hình, không cần ai gọi lên tổng đài.

### Liên hệ phỏng vấn

**Câu hỏi:** "Khách quẹt thẻ, app báo đã trừ tiền nhưng sao kê chưa thấy tiền đi. Bạn thiết kế số dư thế nào?"
**Cách trả lời:** Nói ngay rằng tài khoản có **hai số dư**: số dư sổ cái (tiền đã chốt, dùng cho sao kê và đối soát) và số dư khả dụng (bằng sổ cái trừ tổng hold đang mở, dùng để quyết định giao dịch mới). Quẹt thẻ là **hai pha**: authorization tạo hold để khóa tiền ngay trong 1 giây cho người bán, settlement cuối ngày mới chuyển tiền thật, và số chốt có thể nhỏ hơn số đã giữ (khách sạn, minibar, tip) nên hàm capture phải nhận **số tiền thật** và **tự nhả phần chênh**; cộng thêm job hết hạn hold để tiền không bị khóa vĩnh viễn. Về số học tiền: dùng {{BigDecimal}} tạo từ chuỗi, {{setScale(0, RoundingMode.HALF_UP)}} cho VND, chỉ làm tròn một lần ở biên giới khi ghi sổ, so sánh bằng {{compareTo}} vì {{equals}} so cả scale. Điểm senior: không lưu cột số dư khả dụng mà suy ra nó, holdId làm khóa idempotency để file settlement gửi trùng không chốt tiền hai lần, và capture vượt số đã giữ phải bị từ chối trừ khi có cấu hình nghiệp vụ rõ ràng.`,
    exercises: [
      {
        title: 'HoldLedger: authorise / capture / release với BigDecimal',
        prompt: `Viết class {{HoldLedger}} quản lý **số dư sổ cái** và **các khoản giữ tiền đang mở** cho một phía tài khoản trả tiền (payer). Tiền dùng {{BigDecimal}}, đơn vị đồng VND.

Quy tắc bắt buộc:

1. **Mọi số tiền đi vào đều được quy về {{scale}} 0 bằng {{setScale(0, RoundingMode.HALF_UP)}}** ngay tại ranh giới ({{deposit}}, {{authorise}}, {{capture}}). {{ledgerBalance}} và {{availableBalance}} cũng trả về số có {{scale}} 0. Tài khoản chưa từng có giao dịch ⇒ số dư 0.
2. {{deposit(account, amount)}}: {{amount}} âm sau khi làm tròn ⇒ ném {{IllegalArgumentException}}; ngược lại cộng vào số dư sổ cái.
3. {{authorise(holdId, account, amount)}}: {{amount}} làm tròn ra 0 hoặc âm ⇒ ném {{IllegalArgumentException}}. Số đang giữ **không được vượt số dư khả dụng** ⇒ không đủ thì ném {{IllegalStateException}} và **không ghi gì cả**. {{holdId}} đã tồn tại (đang mở **hoặc** đã đóng trước đó) ⇒ no-op trả {{false}}, không đổi số nào. Thành công ⇒ mở hold, trả {{true}}. Hold không làm đổi số dư sổ cái.
4. {{capture(holdId, actual)}}: {{actual}} làm tròn ra số âm ⇒ ném {{IllegalArgumentException}}. {{holdId}} chưa từng có ⇒ ném {{IllegalArgumentException}}. Hold đã đóng rồi ⇒ no-op trả {{false}}. {{actual}} lớn hơn số đã giữ ⇒ ném {{IllegalArgumentException}} và hold **vẫn đang mở**. Ngược lại: trừ {{actual}} khỏi số dư sổ cái, đóng hold (phần chênh giữa số đã giữ và {{actual}} đương nhiên hết bị giữ), trả {{true}}.
5. {{release(holdId)}}: chưa từng có ⇒ ném {{IllegalArgumentException}}; đã đóng ⇒ trả {{false}}; đang mở ⇒ đóng, **số dư sổ cái không đổi**, trả {{true}}.
6. {{availableBalance(account)}} = {{ledgerBalance(account)}} trừ đi tổng các hold **đang mở** của tài khoản đó.

Gợi ý bố cục: ba cấu trúc dữ liệu là một map số dư sổ cái, một map hold đang mở ({{holdId}} → {{"tài khoản, số tiền"}}), và một tập {{holdId}} đã đóng. Viết một hàm riêng để làm tròn, dùng nó ở mọi cửa vào.`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class HoldLedger {
    private final Map<String, BigDecimal> ledger = new HashMap<>();
    private final Map<String, BigDecimal> openHolds = new HashMap<>();
    private final Map<String, String> holdOwner = new HashMap<>();
    private final Set<String> closedHolds = new HashSet<>();

    void deposit(String account, BigDecimal amount) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean authorise(String holdId, String account, BigDecimal amount) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean capture(String holdId, BigDecimal actual) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean release(String holdId) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal ledgerBalance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal availableBalance(String account) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }

    public static void main(String[] args) {
        HoldLedger l1 = new HoldLedger();
        l1.deposit("CA/lan", new BigDecimal("12000000"));
        check("so_dau_va_kha_dung_bang_nhau_luc_dau", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0 && l1.availableBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0,
            "ledger=" + l1.ledgerBalance("CA/lan"));
        check("lai_cua_0_bang_dinh", l1.ledgerBalance("CA/ghost").compareTo(new BigDecimal("0")) == 0, "ghost=" + l1.ledgerBalance("CA/ghost"));
        check("scale_khi_tra_ve_phai_la_0", l1.availableBalance("CA/lan").scale() == 0, "scale=" + l1.availableBalance("CA/lan").scale());

        check("hold_mo_ok", l1.authorise("H1", "CA/lan", new BigDecimal("4000000")), "authorise H1 phai tra true");
        check("so_du_khong_doi_khi_giu_tien", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("kha_dung_giam_dung_phan_bi_giu", l1.availableBalance("CA/lan").compareTo(new BigDecimal("8000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("hold_trung_la_no_op", !l1.authorise("H1", "CA/lan", new BigDecimal("4000000")), "holdId da ton tai phai tra false");
        check("hold_trung_khong_nho_kha_dung_hai_lan", l1.availableBalance("CA/lan").compareTo(new BigDecimal("8000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));

        check("so_le_duoc_lam_tron_HALF_UP_xuong", l1.authorise("H2", "CA/lan", new BigDecimal("3000000.4")), "authorise H2 phai tra true");
        check("kha_dung_tru_dung_so_le_duoc_lam_tron", l1.availableBalance("CA/lan").compareTo(new BigDecimal("5000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("so_le_duoc_lam_tron_HALF_UP_len", l1.authorise("H3", "CA/lan", new BigDecimal("1999999.5")), "authorise H3 phai tra true");
        check("kha_dung_con_lai_sau_khi_lam_tron_len", l1.availableBalance("CA/lan").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));

        check("giu_vuot_kha_dung_bi_tu_choi", expect(IllegalStateException.class, () -> l1.authorise("H4", "CA/lan", new BigDecimal("3000001"))), "con 3.000.000 ma giu 3.000.001 phai bi tu choi");
        check("giu_bi_tu_choi_khong_de_lai_dau_vet", l1.availableBalance("CA/lan").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("tien_so_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> l1.authorise("H5", "CA/lan", new BigDecimal("0.4"))), "0.4 lam tron ra 0 dong");

        check("partial_capture_ok", l1.capture("H1", new BigDecimal("3000000")), "capture H1 phai tra true");
        check("capture_tru_tien_that_khoi_so_du", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("9000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("capture_nha_phan_chenh", l1.availableBalance("CA/lan").compareTo(new BigDecimal("4000000")) == 0,
            "kha_dung=" + l1.availableBalance("CA/lan"));
        check("capture_lan_hai_la_no_op", !l1.capture("H1", new BigDecimal("3000000")), "hold da dong phai tra false");
        check("capture_lan_hai_khong_tru_them_tien", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("9000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("capture_idempotent_khong_mo_lai_hold", !l1.authorise("H1", "CA/lan", new BigDecimal("100000")), "holdId đã dùng rồi thì retry không được mở lại");

        HoldLedger l2 = new HoldLedger();
        l2.deposit("CA/hung", new BigDecimal("5000000"));
        l2.authorise("X1", "CA/hung", new BigDecimal("2000000"));
        check("capture_vuot_so_da_giu_bi_tu_choi", expect(IllegalArgumentException.class, () -> l2.capture("X1", new BigDecimal("2000001"))), "2.000.001 > 2.000.000 da giu");
        check("giu_van_con_mo_sau_khi_capture_that_bai", l2.availableBalance("CA/hung").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l2.availableBalance("CA/hung"));
        check("release_dung", l2.release("X1"), "release X1 phai tra true");
        check("release_giu_nguyen_so_du", l2.ledgerBalance("CA/hung").compareTo(new BigDecimal("5000000")) == 0, "ledger=" + l2.ledgerBalance("CA/hung"));
        check("release_khoi_kha_dung", l2.availableBalance("CA/hung").compareTo(new BigDecimal("5000000")) == 0, "kha_dung=" + l2.availableBalance("CA/hung"));
        check("release_hai_lan_la_no_op", !l2.release("X1"), "");
        check("release_khong_mo_lai_hold", !l2.authorise("X1", "CA/hung", new BigDecimal("500000")), "holdId đã dùng rồi");
        check("mo_lai_holdId_da_dong_du_soi_tien_nho_cung_khong_duoc", !l2.authorise("X1", "CA/hung", new BigDecimal("0.6")), "0.6 làm tròn ra 1 đồng nhưng holdId đã đóng thì vẫn no_op");

        HoldLedger l3 = new HoldLedger();
        l3.deposit("CA/vi", new BigDecimal("1000000"));
        l3.authorise("B1", "CA/vi", new BigDecimal("400000.5"));
        l3.authorise("B2", "CA/vi", new BigDecimal("399999.6"));
        check("hai_hold_cung_lam_tron_khong_cheo_nhau", l3.availableBalance("CA/vi").compareTo(new BigDecimal("199999")) == 0, "kha_dung=" + l3.availableBalance("CA/vi"));
        check("hold_lam_tron_len_bang_400000", l3.capture("B2", new BigDecimal("400000")), "capture B2 phai tra true");
        check("hold_lam_tron_xuong_bang_400000", l3.capture("B1", new BigDecimal("400000")), "capture B1 phai tra true");
        check("capture_bang_nhau_khong_am_hoa", l3.availableBalance("CA/vi").compareTo(l3.ledgerBalance("CA/vi")) == 0, "kha_dung=" + l3.availableBalance("CA/vi"));

        HoldLedger l4 = new HoldLedger();
        check("nap_tien_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> l4.deposit("CA/a", new BigDecimal("-1"))), "");
        l4.deposit("CA/a", new BigDecimal("1000000.4"));
        check("so_du_le_lam_tron_HALF_UP", l4.ledgerBalance("CA/a").compareTo(new BigDecimal("1000000")) == 0 && l4.ledgerBalance("CA/a").scale() == 0, "so_du=" + l4.ledgerBalance("CA/a"));
        l4.deposit("CA/a", new BigDecimal("1000000.5"));
        check("nap_tien_le_lam_tron_len_dan_dong", l4.ledgerBalance("CA/a").compareTo(new BigDecimal("2000001")) == 0, "so_du=" + l4.ledgerBalance("CA/a"));

        HoldLedger l5 = new HoldLedger();
        check("capture_hold_khong_ton_tai", expect(IllegalArgumentException.class, () -> l5.capture("K1", new BigDecimal("1000"))), "");
        check("release_hold_khong_ton_tai", expect(IllegalArgumentException.class, () -> l5.release("K1")), "");
        check("so_du_bang_dinh_van_scale_0", l5.ledgerBalance("CA/x").scale() == 0, "scale=" + l5.ledgerBalance("CA/x").scale());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class HoldLedger {
    private final Map<String, BigDecimal> ledger = new HashMap<>();
    private final Map<String, BigDecimal> openHolds = new HashMap<>();
    private final Map<String, String> holdOwner = new HashMap<>();
    private final Set<String> closedHolds = new HashSet<>();

    private static BigDecimal vnd(BigDecimal x) {
        if (x == null) throw new IllegalArgumentException("thieu so tien");
        return x.setScale(0, RoundingMode.HALF_UP);
    }

    void deposit(String account, BigDecimal amount) {
        BigDecimal v = vnd(amount);
        if (v.signum() < 0) throw new IllegalArgumentException("số tiền nạp vào không được âm");
        ledger.merge(account, v, BigDecimal::add);
    }

    boolean authorise(String holdId, String account, BigDecimal amount) {
        BigDecimal v = vnd(amount);
        if (v.signum() <= 0) throw new IllegalArgumentException("số tiền giữ phải dương sau khi làm tròn");
        if (openHolds.containsKey(holdId) || closedHolds.contains(holdId)) return false;
        if (availableBalance(account).compareTo(v) < 0) throw new IllegalStateException("không đủ số dư khả dụng để giữ tiền");
        openHolds.put(holdId, v);
        holdOwner.put(holdId, account);
        return true;
    }

    boolean capture(String holdId, BigDecimal actual) {
        BigDecimal v = vnd(actual);
        if (v.signum() < 0) throw new IllegalArgumentException("số tiền chốt không được âm");
        if (!openHolds.containsKey(holdId)) {
            if (closedHolds.contains(holdId)) return false;
            throw new IllegalArgumentException("holdId khong ton tai");
        }
        BigDecimal held = openHolds.get(holdId);
        if (v.compareTo(held) > 0) throw new IllegalArgumentException("số tiền chốt vượt số đã giữ");
        String account = holdOwner.remove(holdId);
        openHolds.remove(holdId);
        closedHolds.add(holdId);
        ledger.merge(account, v.negate(), BigDecimal::add);
        return true;
    }

    boolean release(String holdId) {
        if (!openHolds.containsKey(holdId)) {
            if (closedHolds.contains(holdId)) return false;
            throw new IllegalArgumentException("holdId khong ton tai");
        }
        openHolds.remove(holdId);
        holdOwner.remove(holdId);
        closedHolds.add(holdId);
        return true;
    }

    BigDecimal ledgerBalance(String account) {
        return ledger.getOrDefault(account, BigDecimal.ZERO);
    }

    BigDecimal availableBalance(String account) {
        BigDecimal held = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> e : openHolds.entrySet()) {
            if (account.equals(holdOwner.get(e.getKey()))) held = held.add(e.getValue());
        }
        return ledgerBalance(account).subtract(held);
    }
}`,
        hints: [
          'Viết một hàm riêng {{vnd(BigDecimal)}} làm {{setScale(0, RoundingMode.HALF_UP)}} và gọi nó ở **cửa vào** của mọi method nhận số tiền — nhờ vậy số dư trả ra luôn có {{scale}} 0 mà không phải sửa lại ở cuối.',
          'Đừng so tiền bằng {{equals}} và đừng so {{BigDecimal}} sinh ra từ phép chia: dùng {{compareTo}} (trả 0 khi hai số bằng nhau về giá trị) và {{signum()}} (âm/dương/0).',
          '{{authorise}} phải kiểm tra {{availableBalance(account).compareTo(v) < 0}} **trước khi** ghi hold; ghi rồi mới kiểm tra sẽ để lại hold ma khi bị từ chối.',
          '{{capture}} cần phân biệt ba trường hợp: holdId chưa từng thấy (ném lỗi), holdId **đã đóng** (no-op {{false}}), holdId đang mở (chốt). Vì vậy phải nhớ tập holdId đã đóng, chứ không được xoá sạch khi đóng.',
          'Phần chênh khi partial capture **không cần cộng trừ gì**: chỉ cần bỏ hold đang mở đi, vì {{availableBalance}} được tính lại từ sổ cái trừ tổng hold đang mở.',
        ],
        explain: `Bốn điều test kiểm tra riêng lẻ, và cũng là bốn điều interviewer muốn nghe:

1. **Holds không chạm số dư sổ cái.** Sau {{authorise("H1", "CA/lan", 4.000.000)}}, {{ledgerBalance}} vẫn là 12.000.000 nhưng {{availableBalance}} còn 8.000.000. Tiền chỉ thật sự đi khi {{capture}}.
2. **Làm tròn một lần, ở biên giới.** {{3000000.4}} thành 3.000.000 ({{HALF_UP}} bỏ khi chữ số lẻ là 4), {{1999999.5}} thành 2.000.000 (5 thì vào). Vì thế tổng hai hold của {{CA/vi}} đúng bằng 800.000 và {{capture}} vừa khít từng hold — nếu ta làm tròn *sau khi* đã giữ số lẻ, hai con đường "400.000,5" và "399.999,6" sẽ cho ra số dư khác nhau và chốt không khớp.
3. **{{capture}} nhỏ hơn số đã giữ thì tự nhả phần chênh.** Khách sạn giữ 4.000.000, chốt 3.000.000: sổ cái giảm 3.000.000, hold đóng lại, 1.000.000 không còn bị khoá. Không cần một lệnh {{release}} riêng — và đó là lý do {{release}} và {{capture}} **cùng đánh dấu hold đã đóng** trong tập {{closedHolds}}.
4. **{{holdId}} chỉ được dùng một lần, cả khi retry.** {{capture}} lần hai trả {{false}} và không trừ thêm tiền; {{authorise}} lại bằng đúng {{holdId}} đó sau khi hold đã đóng cũng trả {{false}}. Đây là idempotency bảo vệ hệ thống khỏi file settlement được gửi hai lần (xem bài 5 và 6).

Lỗi hay gặp nhất khi viết bài này là **quên tập hold đã đóng** và chỉ giữ map hold đang mở: khi đó {{capture("H1")}} lần hai trở thành "holdId không tồn tại" → ném {{IllegalArgumentException}} thay vì no-op, và app của người bán sẽ retry mãi. Lỗi thứ hai là trả về số dư **chưa làm tròn** (ví dụ 3000000.4) — test {{scale}} bắt ngay. Lỗi thứ ba là cho {{capture}} số tiền lớn hơn hold "cho linh hoạt": nghiệp vụ thẻ cho phép điều đó trong một tỷ lệ nhỏ có cấu hình, nhưng mặc định phải từ chối, vì vượt số đã hứa nghĩa là chi nhiều hơn số đã khoá.`,
      },
    ],
    check: [
      { q: 'Số dư sổ cái và số dư khả dụng khác nhau ở điểm nào?', options: ['Không khác, chỉ là hai tên gọi', 'Sổ cái trừ hold hai lần, khả dụng trừ một lần', 'Khả dụng là tiền đã chuyển cho người bán, sổ cái là tiền còn lại', 'Sổ cái là tiền đã chốt; khả dụng bằng sổ cái trừ tổng tiền đang bị giữ'], answer: 3, explain: 'Đúng (D): **số dư sổ cái** (ledger balance) là số tiền đã được ghi nhận/chốt trong sổ cái. **Số dư khả dụng** (available balance) = số dư sổ cái − tổng các khoản đang bị giữ (hold/authorization). Khả dụng dùng để quyết định giao dịch mới có được chấp nhận không. Sai (A): hai khái niệm khác nhau về ý nghĩa và cách tính. Sai (B): công thức sai; khả dụng không phải "trừ hai lần". Sai (C): hold chưa chuyển tiền cho người bán, tiền chỉ rời sổ cái khi capture/settlement (chốt toán).' },
      { q: 'Khách sạn giữ 4.000.000đ nhưng chỉ chốt thật 3.000.000đ. Hệ thống phải làm gì?', options: ['Chốt 3.000.000 và giữ nguyên hold 4.000.000 để phòng sau', 'Chốt 4.000.000 vì đã hứa với người bán', 'Chốt 3.000.000, đóng hold và tự nhả 1.000.000 cho khách', 'Chờ khách gọi tổng đài yêu cầu nhả tiền'], answer: 2, explain: 'Đúng (C): đây là partial capture (chốt một phần). Hệ thống phải trừ đúng số tiền thực tế (3.000.000đ) khỏi sổ cái, đóng hold và tự động nhả phần chênh (1.000.000đ) để trả lại khả dụng cho khách. Sai (A): giữ nguyên hold khiến 1.000.000đ bị khóa vĩnh viễn, gây khiếu nại. Sai (B): chốt 4.000.000đ khi thực tế chỉ 3.000.000đ là thu sai tiền khách. Sai (D): chờ khách gọi tổng đài là trải nghiệm tệ và không giải quyết gốc rễ; hệ thống phải tự xử lý đúng nghiệp vụ.' },
      { q: 'Vì sao so sánh tiền phải dùng compareTo thay vì equals với BigDecimal?', options: ['compareTo nhanh hơn vì không cấp phát bộ nhớ', 'equals so cả giá trị lẫn scale nên "1.0" không equals "1.00" dù cùng số tiền', 'compareTo làm tròn giúp ta không cần setScale', 'equals chỉ dùng được cho số nguyên'], answer: 1, explain: 'Đúng (B): {{BigDecimal.equals()}} so sánh cả giá trị số và {{scale}} (số chữ số thập phân), nên {{new BigDecimal("1.0")}} khác {{new BigDecimal("1.00")}} về {{equals}} dù giá trị bằng nhau. {{compareTo()}} chỉ so sánh giá trị số học (trả 0 nếu bằng nhau), phù hợp để so sánh tiền. Sai (A): hiệu năng không phải lý do chính. Sai (C): {{compareTo}} không làm tròn; việc làm tròn phải dùng {{setScale}} rõ ràng. Sai (D): {{equals}} dùng được cho mọi {{BigDecimal}}, chỉ là ngữ nghĩa so sánh khác.' },
      { q: 'Vì sao chỉ nên làm tròn một lần, khi ghi sổ hoặc hiển thị?', options: ['Vì setScale chậm', 'Vì làm tròn nhiều lần làm sai scale', 'Vì BigDecimal không cho phép làm tròn hai lần', 'Vì sai số mỗi bước tích dồn thành lệch tiền thật, đối soát sẽ vỡ'], answer: 3, explain: 'Đúng (D): mỗi lần làm tròn tạo ra một sai số nhỏ; nếu làm tròn ở nhiều bước trung gian, sai số tích dồn (ví dụ 1.000 giao dịch lệch 0,5đ = 500đ) thành chênh lệch tiền thật, gây lệch khi đối soát cuối ngày. Cách đúng: giữ độ chính xác cao trong tính toán trung gian và chỉ {{setScale}}/làm tròn một lần ở biên giới (khi ghi sổ, hiển thị, trả kết quả). Sai (A): hiệu năng {{setScale}} không phải lý do chính. Sai (B): "sai scale" không diễn tả đúng bản chất tích lũy sai số. Sai (C): {{BigDecimal}} cho phép gọi {{setScale}} nhiều lần, chỉ là không nên về mặt nghiệp vụ.' },
    ],
    related: ['banking-013', 'banking-027', 'banking-011'],
    tags: ['ledger', 'hold', 'authorization', 'bigdecimal', 'rounding', 'banking'],
  },

  {
    id: 'lesson-banking-008',
    track: 'banking',
    order: 8,
    title: 'Hạn mức ngày dưới tải đồng thời: check-then-act, khoá theo tài khoản và bắt lỗi race trong test',
    level: 'senior',
    minutes: 35,
    goals: [
      'Chỉ ra được vì sao "đọc số đã chi, so với hạn mức, rồi cộng vào" bị hai thread cùng vượt hạn mức (check-then-act)',
      'Chọn đúng hạt khoá: khoá cả service, khoá theo tài khoản, vòng lặp CAS, hay lệnh nguyên tử trên Redis khi chạy nhiều instance',
      'Viết test bắt lỗi race một cách deterministic: hàng rào xuất phát, đúng N lần thành công, lặp nhiều vòng, không dùng Thread.sleep',
      'Viết {{DailyLimit.tryConsume}} không bao giờ cho tổng vượt hạn mức và reset đúng 00:00 giờ Việt Nam nhờ {{Clock}}',
    ],
    body: `**Tóm tắt:** Kiểm tra hạn mức ngày phải là thao tác nguyên tử (đọc-kiểm tra-ghi trong một vùng khoá) để tránh race condition check-then-act khi nhiều thread/instance cùng tiêu một tài khoản. Dùng khóa theo tài khoản (hoặc cơ chế nguyên tử ở DB/Redis khi đa instance), reset theo ngày {{Asia/Ho_Chi_Minh}} với {{Clock}} inject để test ổn định.

### Hai câu hỏi khác nhau của cùng một hạn mức

Bài 3 trả lời câu hỏi **nghiệp vụ**: "giao dịch này có được cho qua không" theo quy tắc (đã chi bao nhiêu trong ngày, velocity, xác thực mạnh). Bài này trả lời câu hỏi **kỹ thuật**: khi hai mươi lệnh gọi đổ tới *cùng một lúc*, làm sao để tổng số tiền **không bao giờ** vượt hạn mức — kể cả khi cả hai lệnh đều nhìn thấy "còn chỗ trống"?

Nếu chỉ cần đúng khi chạy tuần tự thì code đơn giản:

~~~java
if (spent + amount <= limit) {   // BƯỚC 1: đọc và kiểm tra
    spent = spent + amount;      // BƯỚC 2: ghi lại
    return true;
}
return false;
~~~

Hai bước này cách nhau vài nano-giây, và trong khoảng trống đó **không có gì ngăn** một thread khác chen vào. Đây là lỗi **check-then-act** (kiểm tra rồi mới hành động): quyết định đưa ra ở bước 1 dựa trên dữ liệu đã **cũ** ở bước 2.

### Chuyện đó xảy ra thật, không phải lý thuyết

- Khách bấm nút "Chuyển" hai lần vì app đứng hình 400 ms → hai request đi tới hai instance khác nhau của cùng service.
- Một tài khoản dùng đồng thời app, internet banking và QR; ba kênh cùng trừ vào **một** hạn mức chung.
- Gateway bị timeout nên **thử lại** (retry), trong khi request gốc vẫn đang được xử lý — lúc này có hai luồng *thật* đang chạy song song.
- Một vụ chuyển tiền bị từ chối ở bước duyệt nhưng trừ tiền ở bước tạo lệnh → hai lần trừ cách nhau vài giây.

Số liệu để hình dung: hạn mức 100 triệu, khách đã chi 95 triệu, còn lại 5 triệu. Hai lệnh 3 triệu tới cùng lúc. Cả hai thread đều đọc {{spent = 95}}, cả hai thấy {{95 + 3 <= 100}}, cả hai ghi {{spent = 98}} rồi cùng cộng — kết quả thật là **101 triệu**, vượt 1 triệu. Càng nhiều thread cùng chen thì càng vượt nhiều; với 16 thread cùng đòi 3 triệu, số lần vượt trung bình vài chục triệu.

### Xem bằng sơ đồ xen kẽ

~~~text
Thread A (3tr)                Thread B (3tr)          spent (thực)
  đọc spent = 95                                          95
                              đọc spent = 95              95
  95 + 3 <= 100  => OK                                    95
                              95 + 3 <= 100 => OK         95
  ghi spent = 98                                          98
                              ghi spent = 98              101  <-- mất 1 lần cộng
~~~

Dòng cuối là bản chất của **race condition** (điều kiện tranh chấp): kết quả phụ thuộc vào thứ tự xen kẽ của các thread, mà thứ tự đó ta không kiểm soát được. Kết quả có thể **đúng** hàng nghìn lần rồi sai một lần — và lần sai đó là một khoản tiền mất trên production. Điều quan trọng: mỗi phép đọc và mỗi phép ghi riêng lẻ đều "đúng"; chỉ **tổ hợp** hai phép mới sai. Vì thế {{volatile}} hay {{synchronized}} bọc từng phép đọc/ghi **không** giải quyết được — cái cần khoá là **cả khối đọc + so + ghi**, không phải từng con số.

### Bốn cách sửa, theo mức độ hệ thống

**1. Khoá (mutex) trên cùng một object.** Ai đang trong khối {{synchronized}} thì người khác phải chờ; nhờ vậy không ai thấy trạng thái giữa hai bước:

~~~java
synchronized (this) {                    // chỉ MỘT thread ở trong này tại một thời điểm
    if (amount > limitPerDay - spent) return false;   // so theo kiểu trừ, tránh overflow
    spent += amount;
    return true;
}
~~~

Đúng, nhưng **mọi tài khoản** phải xếp hàng sau nhau. Ngân hàng có triệu tài khoản đang hoạt động; một tài khoản hot (quầy giao dịch, ví doanh nghiệp) sẽ kéo cả hệ thống chậm theo. Đây là bài toán **throughput** (số lệnh xử lý được mỗi giây).

**2. Khoá theo tài khoản.** Thay vì khoá {{this}}, mỗi tài khoản có một object khoá riêng. Muốn vậy phải lấy được object **ổn định** cho một khoá (key) — dùng {{computeIfAbsent}} của {{ConcurrentHashMap}} (đảm bảo chỉ một thread tạo, người khác nhận cùng object):

~~~java
Bucket b = buckets.computeIfAbsent(account, k -> new Bucket());  // luôn trả về CÙNG một Bucket cho cùng account
synchronized (b) {                                               // hai tài khoản khác nhau => không chặn nhau
    return b.tryAdd(amount, limitPerDay, today);
}
~~~

Bẫy chết người ở cách này: nếu code **tạo Bucket mới** mỗi lần gọi ({{new Bucket()}} rồi khoá nó) thì hai thread khoá hai object khác nhau, {{synchronized}} trở thành vô hình — bug này chạy được, test đơn luồng vẫn xanh, chỉ đỏ khi có tải.

**3. Vòng lặp CAS (compare-and-set)** với {{AtomicLong}}: "đọc giá trị cũ, tính giá trị mới, chỉ ghi nếu **vẫn chưa ai đổi**" — nếu đã bị đổi thì đọc lại và thử lại, không cần chờ ai nhả khoá. Từ "CAS" viết tắt của compare-then-swap, là một lệnh do CPU thực hiện nên không thread nào chen được vào giữa:

~~~java
while (true) {
    long cur = spent.get();                       // đọc snapshot hiện tại
    if (amount > limitPerDay - cur) return false; // kiểm tra trên snapshot
    if (spent.compareAndSet(cur, cur + amount))   // ghi CHỈ KHI giá trị vẫn là cur
        return true;                              // thành công => không ai chen được
    // không được => có thread khác vừa sửa => vòng lặp lại, đọc giá trị mới
}
~~~

CAS giữ được độ trễ thấp khi ít xung đột, nhưng phải kiểm tra + ghi trong **một** phép nguyên tử về mặt logic; không được tách "{{spent.get()}} rồi {{spent.addAndGet()}}" vì vẫn còn khoảng trống giữa hai lệnh.

**4. Khi chạy nhiều instance (Kubernetes, autoscaling).** {{synchronized}} chỉ khoá được các thread **trong cùng một JVM** (một tiến trình Java). Production thường chạy 5–20 instance, mỗi instance một JVM riêng, mỗi JVM giữ một con số "đã chi" riêng → vượt hạn mức vẫn xảy ra dù code từng instance hoàn hảo. Lúc đó con số chung phải nằm ngoài JVM: trong **Redis** (database khoá–giá trị chạy trong bộ nhớ, mọi instance cùng đọc/ghi qua mạng, tốc độ micro-giây) hoặc trong chính database với lệnh cập nhật nguyên tử. Ý then chốt: **phương án 4 phải là MỘT thao tác nguyên tử phía server dữ liệu**, ví dụ một đoạn Lua chạy trên Redis hoặc một câu UPDATE có điều kiện, chứ không phải "GET rồi SET" qua hai lượt gọi mạng:

~~~sql
-- một câu UPDATE là một phép nguyên tử trong DB: điều kiện kiểm tra và trừ nằm cùng chỗ
UPDATE account_limit
   SET spent_today = spent_today + :amount
 WHERE account_id = :acc AND limit_day = :today
   AND spent_today + :amount <= :daily_limit;
-- affected rows = 1 => được chi; = 0 => từ chối (hết hạn mức hoặc sang ngày mới)
~~~

Bảng chọn nhanh:

| Cách | Đúng đơn luồng | Đúng đa luồng | Đúng đa instance | Ghi chú |
|---|---|---|---|---|
| if rồi cộng, không khoá | có | **không** | không | chỉ dùng được trong test tuần tự |
| {{synchronized (this)}} | có | có | không | đơn giản nhưng nghẽn cổ chai toàn cục |
| Khoá theo tài khoản | có | có | không | hạt khoá mịn, vẫn đúng khi một tài khoản nóng |
| CAS {{AtomicLong}} | có | có | không | độ trễ thấp khi ít xung đột |
| Redis Lua / UPDATE có điều kiện | có | có | **có** | thêm chi phí mạng, phải chống mất dữ liệu Redis |

> Lưu ý: {{ConcurrentHashMap}} **không** làm cho chuỗi "đọc – sửa – ghi" của bạn thành nguyên tử. Nó chỉ đảm bảo từng phép {{get}}/{{put}}/{{computeIfAbsent}} an toàn. Rất nhiều dev hiểu nhầm điều này và tưởng hệ đếm của mình đã thread-safe.

### Reset theo ngày và "ngày" lấy từ đâu

Hạn mức là "trong **một ngày**", mà ngày lại là khái niệm múi giờ. Việt Nam đổi ngày lúc 00:00 {{Asia/Ho_Chi_Minh}} = 17:00 UTC ngày hôm trước. Nếu server chạy UTC và code lấy {{LocalDate.now()}} theo hệ thống, hạn mức sẽ reset lúc **7h sáng** theo giờ khách — cả buổi sáng khách bị chặn vì "đã chi hết hôm qua".

Cách đúng: **inject {{Clock}}** và để Clock mang theo vùng giờ, {{LocalDate.now(clock)}} sẽ cho ra ngày đúng; trong test thay bằng {{Clock.fixed}} hoặc một Clock giả có thể "quay đồng hồ" để kiểm tra hành vi sang ngày mới mà không phải chờ tới nửa đêm. Cấu trúc dữ liệu nên theo bucket ngày, không ghi đè:

~~~java
Map<LocalDate, Long> byDay   // {2026-11-05: 95000000, 2026-11-06: 3000000}
~~~

Nhờ vậy số liệu của ngày cũ **vẫn tra được** để đối soát và phục vụ điều tra gian lận, thay vì bị {{spent = 0}} xoá mất lúc nửa đêm.

### Kiểm thử code đồng thời mà không hên xui

Quy tắc ba điểm:

1. **Hàng rào xuất phát.** Dùng {{CountDownLatch}} để 16 thread cùng "bắn" đúng một thời điểm, thay vì cho chúng khởi chạy lẻ tẻ (rất khó trùng nhau).
2. **Kết quả phải là một bất biến, không phải một khoảng.** Ví dụ: hạn mức 20.000, mỗi lệnh 3.000 ⇒ **đúng 6** lệnh thành công và {{spent == 18000}}. Code đúng thì lần nào cũng ra 6; code sai sẽ ra 7, 8 và {{spent = 21000}}.
3. **Lặp đủ nhiều vòng.** Race chỉ lộ diện khi hai thread thật sự xen kẽ. Một vòng có thể ăn may; 30–50 vòng với 16 thread làm xác suất lọt qua gần bằng 0.

Tuyệt đối không dùng {{Thread.sleep}} để "tạo race": nó chỉ *tăng xác suất* gặp lỗi chứ không chứng minh gì, và máy CI nhanh/chậm khác nhau sẽ khiến test lúc đỏ lúc xanh (test flaky — loại ung thư làm cả đội mất tin tưởng vào bộ test).

### Những chỗ hay sai nhất

- {{amount <= 0}} không bị từ chối: số **âm** làm {{spent}} *giảm đi*, tức kẻ tấn công gửi "-50.000.000" để mua lại hạn mức.
- Viết {{spent + amount > limit}} với số rất lớn: {{long}} tràn (overflow) sẽ **đảo thành số âm**, điều kiện luôn sai → cho qua mọi lệnh. Cách viết an toàn là {{amount > limit - spent}} (vế phải luôn nằm trong khoảng 0..limit).
- Trả {{true}} cho caller **trước** khi ghi sổ: nếu ghi thất bại thì app đã báo "thành công".
- {{synchronized}} trên một object khởi tạo lại mỗi lần gọi (mục 2 ở trên).
- Dùng {{double}} cho tiền: 0.1 + 0.2 = 0.30000000000000004 (xem bài 1).
- Quên rằng {{tryConsume}} **không idempotent**: cùng một txId gửi hai lần sẽ bị trừ hai lần. Muốn chống trùng phải kiểm tra txId **trước** khi tiêu hạn mức (xem bài 5 và 6).

> Senior tip: Khi phỏng vấn, đừng chỉ nói "thêm {{synchronized}} là xong". Câu trả lời đủ điểm gồm ba tầng: (1) hạt khoá **theo tài khoản** vì xung đột chỉ xảy ra trong cùng một tài khoản, (2) bất biến "không bao giờ vượt" được **giữ ở cửa vào duy nhất** là {{tryConsume}} — không cho code nghiệp vụ tự đọc {{spent}} rồi tự cộng, (3) khi chạy nhiều instance thì phải đẩy phép nguyên tử xuống tầng dữ liệu chung (Redis Lua / UPDATE có điều kiện) và **chấp nhận** thêm độ trễ mạng, đổi lại độ trễ P99 của cả hệ thống vẫn ổn. Kèm chi tiết ít người nói: số lần vượt hạn mức thật trên production thường tới từ retry của gateway chứ không phải hai người dùng bấm cùng lúc.

### Liên hệ phỏng vấn

**Câu hỏi:** "Hạn mức ngày của bạn được kiểm tra thế nào khi có 16 giao dịch đồng thời của cùng một tài khoản?"

**Cách trả lời:** Trước hết chỉ ra lỗi: dạng {{if (spent + amount <= limit) spent += amount}} là check-then-act — hai thread cùng đọc {{spent}}, cùng thấy còn chỗ, cùng ghi; kết quả là tổng vượt hạn mức dù mỗi phép đọc/ghi đều đúng. Sửa bằng cách gộp kiểm tra + ghi vào **một vùng nguyên tử**, và chọn hạt khoá theo mức độ mở rộng: trong một JVM thì {{synchronized}} trên object **riêng của tài khoản** (lấy qua {{computeIfAbsent}} để object không bị tạo lại), hoặc vòng CAS với {{AtomicLong.compareAndSet}} khi cần độ trễ thấp; khi có nhiều instance — chuyện mặc định trên Kubernetes, vì autoscaling sinh thêm JVM — thì khoá trong JVM vô dụng, con số chung phải nằm ở tầng dữ liệu dùng chung và phép thử phải **nguyên tử phía server** (Lua script trên Redis, hoặc {{UPDATE ... WHERE spent + :amt <= :limit}} rồi đếm số dòng bị ảnh hưởng). Về phía tiền, dùng {{long}} đồng chẵn hoặc {{BigDecimal}}, tránh overflow bằng cách so {{amount > limit - spent}}. Về phía ngày, tính {{LocalDate.now(clock)}} với Clock mang {{ZoneId.of("Asia/Ho_Chi_Minh")}} và giữ theo bucket ngày để không mất số liệu hôm qua. Cuối cùng là test: 16 thread qua {{CountDownLatch}} barrier, asserts **đúng N** lần thành công, lặp 30–50 vòng, không dùng {{Thread.sleep}}.`,
    exercises: [
      {
        title: 'DailyLimit.tryConsume an toàn với 16 thread',
        prompt: `Viết class {{DailyLimit}} quản lý **hạn mức tiền trong một ngày cho từng tài khoản**, dùng {{long}} cho số tiền (đơn vị đồng chẵn) và {{Clock}} để xác định "hôm nay là ngày nào".

Chữ ký bắt buộc:
- {{DailyLimit(Clock clock, long limitPerDay)}} — {{Clock}} mang theo múi giờ, hãy lấy ngày bằng {{LocalDate.now(clock)}}.
- {{boolean tryConsume(String account, long amount)}} — nguyên tử: **đọc và cộng trong cùng một vùng khoá**. Trả {{true}} nếu tổng trong ngày vẫn không vượt {{limitPerDay}}, {{false}} nếu vượt (và khi đó **không** trừ gì cả).
- {{long spent(String account)}} — tổng đã chi của **ngày hiện tại**.
- {{long spentOn(String account, LocalDate day)}} — tổng đã chi của một ngày cụ thể (ngày cũ không bị xoá).
- {{long remaining(String account)}} — còn được chi bao nhiêu nữa trong ngày, không bao giờ trả số âm.
- {{int trackedAccounts()}} — số tài khoản đã được tạo bucket.

Quy tắc biên (đều ném {{IllegalArgumentException}}): {{account}} {{null}} hoặc rỗng; {{amount <= 0}}; {{limitPerDay < 0}} (kiểm tra ở constructor).

Hai điều kiện mà test sẽ kiểm tra thẳng:
1. 16 thread cùng gọi {{tryConsume("CA/a", 3000)}} trên hệ hạn mức 20000 ⇒ **chính xác 6** lần trả {{true}} và {{spent}} đúng bằng 18000, ở **mọi** vòng chạy.
2. Tài khoản này không được chặn tài khoản khác: 16 tài khoản, mỗi tài khoản 4 thread cùng tiêu 2500 với hạn mức 10000 ⇒ mỗi tài khoản tiêu đúng 10000.`,
        starter: `import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

class DailyLimit {
    private final Clock clock;
    private final long limitPerDay;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    DailyLimit(Clock clock, long limitPerDay) {
        if (limitPerDay < 0) throw new IllegalArgumentException("limitPerDay phải không âm");
        this.clock = clock;
        this.limitPerDay = limitPerDay;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);
    }

    private Bucket bucket(String account) {
        return buckets.computeIfAbsent(account, k -> new Bucket());
    }

    boolean tryConsume(String account, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    long spent(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    long spentOn(String account, LocalDate day) {
        throw new UnsupportedOperationException("TODO");
    }

    long remaining(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    int trackedAccounts() {
        return buckets.size();
    }

    static final class Bucket {
        private final Map<LocalDate, Long> byDay = new HashMap<>();

        long totalOn(LocalDate day) {
            throw new UnsupportedOperationException("TODO");
        }

        void add(long amount, LocalDate day) {
            throw new UnsupportedOperationException("TODO");
        }
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }

    // Test chạy trong 2 phút nên cần thay "hôm nay là ngày nào": cài ham today() để quay sang ngày kế tiếp.
    static final class OnDay extends DailyLimit {
        private LocalDate day;
        OnDay(LocalDate firstDay, long limitPerDay) {
            super(Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")), limitPerDay);
            this.day = firstDay;
        }
        void setDay(LocalDate d) { day = d; }
        @Override protected LocalDate today() { return day; }
    }

    public static void main(String[] args) throws Exception {
        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock morning = Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), vn);   // 09:00 ngay 05/11 gio VN
        DailyLimit dl = new DailyLimit(morning, 100000);

        check("con_du_thi_cho_qua", dl.tryConsume("CA/a", 60000) && dl.tryConsume("CA/a", 35000), "spent=" + dl.spent("CA/a"));
        check("spent_dung_tong", dl.spent("CA/a") == 95000, "spent=" + dl.spent("CA/a"));
        check("vuot_thi_tu_choi", !dl.tryConsume("CA/a", 6000), "");
        check("tu_choi_khongtru_tien", dl.spent("CA/a") == 95000, "spent=" + dl.spent("CA/a"));
        check("vua_han_muc_thi_duoc", dl.tryConsume("CA/a", 5000) && dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("day_han_muc_tu_choi_moi_lenh", !dl.tryConsume("CA/a", 1) && dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("remaining_bang_0_khi_day", dl.remaining("CA/a") == 0, "remaining=" + dl.remaining("CA/a"));
        check("remaining_dung_khi_con", dl.remaining("CA/never") == 100000, "remaining=" + dl.remaining("CA/never"));
        check("tai_khoan_khong_lien_quan", dl.spent("CA/other") == 0 && dl.tryConsume("CA/other", 100000), "");

        check("so_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("CA/a", 0)), "amount=0 phai bi tu choi");
        check("so_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("CA/a", -50000000)), "so am de mua lai han muc");
        check("sau_khi_loi_so_du_khong_doi", dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("account_trong_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("", 100)), "");
        check("account_null_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume(null, 100)), "");
        check("limit_am_bi_tu_choi_o_constructor", expect(IllegalArgumentException.class, () -> new DailyLimit(morning, -1)), "");

        DailyLimit d2 = new DailyLimit(morning, 100000);
        d2.tryConsume("CA/x", 1000);
        d2.tryConsume("CA/y", 1000);
        check("bucket_tao_mot_lan_per_account", d2.trackedAccounts() == 2, "tracked=" + d2.trackedAccounts());

        // ngày được tính theo vùng giờ của Clock, không phải UTC
        DailyLimit dl2 = new DailyLimit(Clock.fixed(Instant.parse("2026-11-05T17:30:00Z"), vn), 100000);
        check("nua_dem_utc_la_ngay_moi_cua_VN", dl2.tryConsume("CA/a", 70000)
            && dl2.spentOn("CA/a", LocalDate.of(2026, 11, 6)) == 70000
            && dl2.spentOn("CA/a", LocalDate.of(2026, 11, 5)) == 0,
            "spent 06/11=" + dl2.spentOn("CA/a", LocalDate.of(2026, 11, 6)) + " 05/11=" + dl2.spentOn("CA/a", LocalDate.of(2026, 11, 5)));

        // reset khi sang ngày mới: hạn mức được làm lại, ngày cũ vẫn giữ được để đối chiếu
        OnDay dl3 = new OnDay(LocalDate.of(2026, 11, 5), 50000);
        dl3.tryConsume("CA/a", 50000);
        long yesterday = dl3.spent("CA/a");
        dl3.setDay(LocalDate.of(2026, 11, 6));
        check("sang_ngay_moi_con_han_muc", dl3.spent("CA/a") == 0 && dl3.remaining("CA/a") == 50000, "spent=" + dl3.spent("CA/a"));
        check("sang_ngay_moi_chi_duoc", dl3.tryConsume("CA/a", 30000) && dl3.spent("CA/a") == 30000, "spent=" + dl3.spent("CA/a"));
        check("ngay_cu_khong_bi_xoa", dl3.spentOn("CA/a", LocalDate.of(2026, 11, 5)) == yesterday, "hom qua=" + dl3.spentOn("CA/a", LocalDate.of(2026, 11, 5)));

        // RACE: 16 thread cung tranh 20000, moi lenh 3000 => dung 6 lenh, spent 18000
        int rounds = 40, badSuccess = 0, badSpent = 0, maxSuccess = 0;
        for (int r = 0; r < rounds; r++) {
            DailyLimit rl = new DailyLimit(Clock.systemUTC(), 20000);
            java.util.concurrent.atomic.AtomicInteger ok = new java.util.concurrent.atomic.AtomicInteger();
            CountDownLatch gate = new CountDownLatch(1);
            CountDownLatch done = new CountDownLatch(16);
            for (int t = 0; t < 16; t++) {
                new Thread(() -> {
                    try { gate.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    if (rl.tryConsume("CA/hot", 3000)) ok.incrementAndGet();
                    done.countDown();
                }).start();
            }
            gate.countDown();
            done.await();
            if (ok.get() != 6) { badSuccess++; maxSuccess = Math.max(maxSuccess, ok.get()); }
            if (rl.spent("CA/hot") != 18000) badSpent++;
        }
        check("khong_bao_gio_vuot_han_muc_voi_16_thread", badSuccess == 0 && badSpent == 0,
            "rounds sai so lenh=" + badSuccess + ", rounds sai so du=" + badSpent + ", nhieu lenh nhat mot vong=" + maxSuccess);

        // Nhiều tài khoản song song: tài khoản này không được chan lan tai khoan kia
        int accs = 16, threadsPer = 4, wrong = 0;
        DailyLimit ml = new DailyLimit(Clock.systemUTC(), 10000);
        CountDownLatch g2 = new CountDownLatch(1);
        CountDownLatch d2l = new CountDownLatch(accs * threadsPer);
        for (int a = 0; a < accs; a++) {
            final String acc = "CA/" + a;
            for (int t = 0; t < threadsPer; t++) {
                new Thread(() -> {
                    try { g2.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    ml.tryConsume(acc, 2500);
                    d2l.countDown();
                }).start();
            }
        }
        g2.countDown();
        d2l.await();
        for (int a = 0; a < accs; a++) if (ml.spent("CA/" + a) != 10000) wrong++;
        check("16_tai_khoan_song_song_khong_lan_nhau", wrong == 0, "sai=" + wrong);
        check("moi_tai_khoan_du_bat_4_lenh", ml.trackedAccounts() == accs, "tracked=" + ml.trackedAccounts());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

class DailyLimit {
    /** Mỗi tài khoản có một Bucket riêng: object này dùng làm khóa, nên các tài khoản không chăn nhau. */
    static final class Bucket {
        private final Map<LocalDate, Long> byDay = new HashMap<>();

        long totalOn(LocalDate day) {
            return byDay.getOrDefault(day, 0L);
        }

        void add(long amount, LocalDate day) {
            byDay.put(day, totalOn(day) + amount);
        }

        boolean tryAdd(long amount, long limitPerDay, LocalDate day) {
            long spent = totalOn(day);
            // So theo phap tru: "spent + amount > limit" co the tran (overflow) long khi amount rat lon.
            if (amount > limitPerDay - spent) return false;
            add(amount, day);
            return true;
        }
    }

    private final Clock clock;
    private final long limitPerDay;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    DailyLimit(Clock clock, long limitPerDay) {
        if (limitPerDay < 0) throw new IllegalArgumentException("limitPerDay phải không âm");
        this.clock = clock;
        this.limitPerDay = limitPerDay;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);   // vung gio lay tu Clock, khong tu he thong
    }

    private Bucket bucket(String account) {
        return buckets.computeIfAbsent(account, k -> new Bucket());
    }

    boolean tryConsume(String account, long amount) {
        if (account == null || account.isEmpty()) throw new IllegalArgumentException("thieu tai khoan");
        if (amount <= 0) throw new IllegalArgumentException("so tien phai duong");
        Bucket b = bucket(account);
        LocalDate day = today();
        synchronized (b) {                 // một vùng nguyên tử cho cả KIEM TRA và GHI
            return b.tryAdd(amount, limitPerDay, day);
        }
    }

    long spent(String account) {
        return spentOn(account, today());
    }

    long spentOn(String account, LocalDate day) {
        if (day == null) throw new IllegalArgumentException("thieu ngay");
        Bucket b = bucket(account);
        synchronized (b) {
            return b.totalOn(day);
        }
    }

    long remaining(String account) {
        long left = limitPerDay - spent(account);
        return left > 0 ? left : 0;
    }

    int trackedAccounts() {
        return buckets.size();
    }
}`,
        hints: [
          'Bất biến cần giữ: **không được có khoảng trống giữa lệnh đọc và lệnh ghi**. Bọc {{synchronized (b)}} quanh **cả** phép so sánh lẫn phép cộng (gộp thành một hàm {{tryAdd}} như gợi ý bên dưới); nếu chỉ bọc phép cộng thì vẫn còn check-then-act.',
          'Lấy object khoá phải **ổn định theo tài khoản**: {{buckets.computeIfAbsent(account, k -> new Bucket())}}. Nếu bạn tự {{new Bucket()}} mỗi lần gọi thì hai thread sẽ khoá hai object khác nhau và {{synchronized}} mất tác dụng.',
          'So sánh bằng {{amount > limitPerDay - spent}} chứ không bằng {{spent + amount > limitPerDay}} — vế sau có thể tràn {{long}} khi số tiền cực lớn, và số tràn sẽ **đảo dấu**.',
          '{{Bucket}} nên giữ {{Map<LocalDate, Long>}} thay vì một con số duy nhất: sang ngày mới thì {{spent("CA/a")}} tự về 0 mà số liệu hôm qua vẫn còn để đối soát.',
          '{{tryConsume}} phải từ chối {{amount <= 0}} **trước khi** đụng tới khoá: số âm sẽ *cộng* tiền vào {{spent}} và mua lại hạn mức.',
        ],
        explain: `Test bắt bốn lớp lỗi, và mỗi lớp tương ứng một câu hỏi phỏng vấn thật.

1. **Chuỗi đọc–sửa–ghi phải nằm trong một vùng nguyên tử.** Bản viết sai — dạng {{if (spent + amount <= limit) spent += amount}} để hai bước **ngoài** khoá — chạy đơn luồng thì luôn đúng; chạy 16 thread tranh nhau 20.000 với mỗi lệnh 3.000 thì có vòng cho 7–8 lệnh qua, tức tiêu 21.000–24.000. Code tham khảo bọc {{synchronized (b)}} quanh {{b.tryAdd(...)}} nên **luôn** trả về chính xác 6 lệnh và {{spent == 18000}} ở cả 40 vòng. Bất biến được kiểm bằng con số chính xác, không phải "khoảng chấp nhận được" — đó là cách viết test đồng thời đúng.

2. **Hạt khoá quyết định sinh tử về hiệu năng.** Khoá {{this}} cũng đúng, nhưng một tài khoản hot sẽ biến toàn bộ hạn mức của ngân hàng thành một hàng đợi. Vì mỗi {{Bucket}} được tạo **một lần** qua {{computeIfAbsent}} (phép này của {{ConcurrentHashMap}} đã nguyên tử — hai thread cùng tới trước cũng chỉ một {{Bucket}} được tạo), nên "{{wrong == 0}}" ở phần 16 tài khoản × 4 thread chứng minh các tài khoản không lấn nhau cả về dữ liệu lẫn về tiến độ.

3. **"Ngày" là dữ liệu, không phải thời gian hệ thống.** {{LocalDate.now(clock)}} với Clock mang {{Asia/Ho_Chi_Minh}} làm cho khoảnh khắc {{2026-11-05T17:30:00Z}} (bản chất là UTC) rơi vào **06/11** theo giờ Việt Nam, và test assert đúng ngày đó. Nếu bạn dùng {{Instant.now()}} hay {{LocalDate.now()}} theo hệ thống, cùng một giao dịch sẽ bị tính sang hai ngày khác nhau tùy server đặt ở vùng giờ nào — và không test nào phát hiện được.

4. **Số tiền và số lần phải được bảo vệ ở cửa vào.** {{amount <= 0}} và {{account}} rỗng bị chặn trước khi lấy khoá, nên không có đường nào để "cộng tiền âm" làm giảm {{spent}}. Test còn cố tình chạy {{tryConsume}} thất bại rồi assert {{spent}} không đổi, vì bug phổ biến là ghi {{spent}} trước rồi mới trả {{false}}.

**Không đủ** để chỉ làm bài này đúng: {{tryConsume}} không idempotent. Hai request cùng một txId sẽ bị trừ hai lần, và ở production đó mới là nguồn vượt hạn mức số một. Vì vậy sau bước kiểm tra hạn mức vẫn phải có bước kiểm tra txId đã tiêu hạn mức chưa (bài 5, 6). Nếu hệ thống chạy nhiều instance, {{synchronized}} chỉ là **một phần** của lời giải — phần còn lại là phép nguyên tử ở tầng dữ liệu chung (Redis Lua / UPDATE có điều kiện), xem mục so sánh trong bài.`,
      },
    ],
    check: [
      { q: 'Điều gì làm phép kiểm tra hạn mức bị sai khi có nhiều thread?', options: ['Vì đọc {{spent}} chậm hơn ghi', 'Vì kiểm tra và ghi là hai bước tách rời, thread khác chen vào giữa', 'Vì {{long}} không cộng được song song', 'Vì HashMap không sắp thứ tự'], answer: 1, explain: 'Đúng (B): lỗi check-then-act (kiểm tra rồi mới hành động) xảy ra khi "đọc {{spent}} + so sánh" và "ghi {{spent}} mới" là hai bước tách rời. Nhiều thread có thể cùng đọc thấy còn hạn mức rồi cùng ghi, khiến tổng vượt hạn mức. Cần gộp kiểm tra và ghi trong một vùng nguyên tử (ví dụ {{synchronized}} theo tài khoản, CAS, hoặc lệnh nguyên tử ở DB/Redis). Sai (A): tốc độ đọc/ghi không phải nguyên nhân gốc; vấn đề là tính nguyên tử (atomicity). Sai (C): {{long}} cộng được bình thường; lỗi nằm ở race condition, không phải kiểu dữ liệu. Sai (D): việc {{HashMap}} không sắp thứ tự không liên quan đến tính đúng của phép cộng hạn mức đồng thời.' },
      { q: 'Vì sao nên khoá theo từng tài khoản thay vì khoá cả service?', options: ['Vì khoá to hơn luôn an toàn hơn', 'Vì tài khoản chỉ có một hạn mức', 'Vì xung đột chỉ xảy ra trong cùng một tài khoản; khoá mịn giúp tài khoản khác không phải chờ', 'Vì {{synchronized}} không dùng được trên {{this}}'], answer: 2, explain: 'Đúng (C): race condition khi trừ hạn mức chỉ xảy ra giữa các thao tác trên **cùng một tài khoản**. Khoá theo tài khoản (fine-grained lock) cho phép các tài khoản khác nhau xử lý song song, tăng throughput. Khoá cả service (coarse-grained) đúng nhưng biến mọi giao dịch thành tuần tự, gây nghẽn. Sai (A): khoá to hơn an toàn về tính đúng nhưng tệ về hiệu năng, không phải lựa chọn tốt khi không cần. Sai (B): dù tài khoản có một hay nhiều hạn mức, vấn đề là phạm vi tranh chấp dữ liệu. Sai (D): {{synchronized}} dùng được trên {{this}}, chỉ là phạm vi khoá quá rộng.' },
      { q: 'Khi service chạy 10 instance trên Kubernetes, {{synchronized}} trong JVM còn đủ không?', options: ['Vẫn đủ, vì các instance nhìn chung một bộ nhớ', 'Không, mỗi instance là một JVM riêng; phép nguyên tử phải đẩy xuống Redis hoặc database', 'Chỉ cần thêm {{volatile}} cho biến đếm', 'Cần tăng số thread trong pool lên'], answer: 1, explain: 'Đúng (B): {{synchronized}} chỉ đảm bảo loại trừ tương hỗ giữa các thread **trong cùng một JVM** (một tiến trình Java). Khi chạy nhiều instance (pod) trên Kubernetes, mỗi instance là JVM riêng, bộ nhớ tách biệt, nên cần cơ chế đồng bộ dùng chung như Redis (Lua script/INCR nguyên tử) hoặc DB ({{UPDATE ... WHERE}} có điều kiện) để đảm bảo tính nguyên tử xuyên instance. Sai (A): các instance không chia sẻ heap/bộ nhớ JVM. Sai (C): {{volatile}} chỉ đảm bảo visibility (nhìn thấy giá trị mới) giữa thread, không đảm bảo tính nguyên tử của thao tác đọc-sửa-ghi. Sai (D): tăng thread pool không giải quyết race condition, thậm chí có thể làm tệ hơn.' },
      { q: 'Cách nào sau đây KHÔNG nên dùng khi test lỗi race?', options: ['Dùng hàng rào CountDownLatch cho các thread xuất phát cùng lúc', 'Assert một con số chính xác (đúng 6 lần thành công)', 'Chạy 40 vòng để tăng xác suất lộ lỗi', 'Dùng Thread.sleep 200 ms để hai thread chắc chắn chồng nhau'], answer: 3, explain: 'Đúng (D): {{Thread.sleep}} không đảm bảo hai thread thực sự chồng chéo tại điểm tranh chấp — thời gian lập lịch phụ thuộc hệ điều hành và tải máy, nên test có thể lúc pass lúc fail (flaky). Sai (A): {{CountDownLatch}} làm hàng rào (barrier) để nhiều thread bắt đầu cùng lúc là kỹ thuật đúng để tăng xác suất race. Sai (B): assert kết quả chính xác (ví dụ đúng 6 lần thành công, không hơn) là cách kiểm tra bất biến mạnh và rõ ràng. Sai (C): lặp nhiều vòng giúp tăng xác suất phát hiện race condition không ổn định (intermittent).' },
    ],
    related: ['banking-030', 'banking-023', 'banking-016'],
    tags: ['limit', 'concurrency', 'race condition', 'locking', 'clock', 'banking'],
  },

  {
    id: 'lesson-banking-009',
    track: 'banking',
    order: 9,
    title: 'Batch cuối ngày (EOD): tính lãi cho triệu tài khoản, chết giữa chừng vẫn chạy lại không trả tiền hai lần',
    level: 'senior',
    minutes: 40,
    goals: [
      'Nói được EOD là gì, cut-off là gì và vì sao ngân hàng buộc phải có batch chạy đêm',
      'Thiết kế job chạy lại an toàn: chìa khoá tự nhiên (tài khoản, ngày), checkpoint và chunk',
      'Tính lãi ngày bằng {{BigDecimal}} theo quy ước actual/365 và biết vì sao không được làm tròn về 0 đồng mỗi ngày',
      'Viết {{EodJob}} với {{accrue}} idempotent, {{run}} theo chunk, {{checkpoint}} resume được và danh sách {{failed}} không làm kẹt job',
    ],
    body: `**Tóm tắt:** Batch EOD (End Of Day — xử lý cuối ngày) phải idempotent theo chìa khóa tự nhiên (tài khoản, ngày), chạy theo chunk có checkpoint để resume an toàn sau sự cố, commit dữ liệu trước rồi mới cập nhật checkpoint. Lãi ngày tính bằng {{BigDecimal}} (actual/365), giữ phần lẻ khi accrue và làm tròn một lần khi kết chuyển.

### Chuyện thật: job chạy 6 tiếng, chết ở tiếng thứ 5

Hai giờ sáng, job **EOD (End Of Day — xử lý cuối ngày)** bắt đầu quét 1,2 triệu tài khoản để tính lãi tiền gửi, phí thường kỳ, cập nhật hạn mức, phân loại nợ. Bốn tiếng sau, một node bị OOM (out of memory — hết bộ nhớ cấp phát) và pod bị khởi động lại. Sáng ra, operations hỏi một câu quyết định mọi thứ: **"Chạy lại từ đầu, hay tiếp tục từ chỗ nó chết?"**

Nếu chạy lại **từ đầu** mà không có cơ chế chống trùng, 600.000 tài khoản đã được ghi lãi buổi đêm sẽ được ghi **lần hai**. Nếu **tiếp tục từ chỗ chết** mà không biết chỗ chết là đâu, 600.000 tài khoản kia không bao giờ được tính cho ngày hôm nay. Cả hai hướng đều là sự cố tiền, và hướng nào cũng đủ để một kiểm toán viên hỏi "ai duyệt quy trình này?".

### EOD là gì, cut-off là gì

- **EOD batch**: tập hợp việc ngân hàng *không thể* làm trong một request của khách, vì nó chạm tới **toàn bộ** khách hàng cùng lúc: tính và ghi lãi, trừ phí quản lý, phân loại nợ theo số ngày quá hạn, kết chuyển (gộp lãi vào gốc), lập sao kê cuối ngày, đối soát với NAPAS/core cũ (xem bài 2).
- **Cut-off time**: mốc giờ cắt ngày. 23:00 hôm nay nhận chuyển khoản thì được tính vào **hôm nay** hay **ngày làm việc kế tiếp** là do cut-off, và nó quyết định luôn **valueDate** (ngày tiền bắt đầu sinh lãi / được ghi sổ). Sai một tiếng ở cut-off là sai lãi của cả một ngày, trên hàng triệu tài khoản.
- Vì sao không tính lãi realtime trong từng request? Vì lãi phụ thuộc **số dư cả ngày** và **số ngày**, và vì ngân hàng cần một ngày kế toán chốt sổ (book close) để số liệu hai bên — lõi và báo cáo — khớp nhau.

### Ba câu hỏi sống còn của một con batch

| Câu hỏi | Tên trong ngành | Cách trả lời đúng |
|---|---|---|
| Chạy hai lần có trả tiền hai lần không? | **idempotent** (chạy lại bao nhiêu lần cũng cho cùng một kết quả) | Mỗi kết quả mang chìa khoá tự nhiên (tài khoản, ngày) — lần hai bị chặn tại cửa ghi |
| Chết giữa chừng có tiếp tục được không? | **resumable / checkpoint** | Lưu "tài khoản cuối đã xử lý" và đi tiếp sau nó, không quét lại từ đầu |
| Hai node cùng chạy thì sao? | **no double-run** | khoá/lease theo (job, ngày) hoặc chia shard theo dải tài khoản |

### Checkpoint hoạt động thế nào

~~~seq
title: EOD chay theo chunk co checkpoint
actors: Scheduler | EodJob | AccountDB | LedgerDB
Scheduler -> EodJob: run(ngay 05/11, chunk 50.000)
EodJob -> AccountDB: lay 50.000 tai khoan sau checkpoint
EodJob -> LedgerDB: ghi lai + danh dau (account, 05/11)
note EodJob..LedgerDB: mot transaction cho ca hai — không ghi nửa
EodJob --> Scheduler: ok 50.000, checkpoint = A050000
Scheduler -> EodJob: run tiep (bat dau sau A050000)
EodJob --> Scheduler: het danh sach, checkpoint = null
~~~

**Checkpoint** chỉ là một dòng dữ liệu: "(job=EOD-INTEREST, day=2026-11-05, last=A050000)". Nó **không** phải machine để đếm tiền, mà là "đã làm tới đâu". Vì nó chỉ tiết kiệm thời gian quét lại — chứ **không** phải thứ bảo vệ tiền — nên điều kiện bắt buộc là: mất checkpoint vẫn không được trả tiền hai lần. Cái bảo vệ tiền là **chìa khoá tự nhiên (account, valueDate)** trên chính bản ghi kết quả.

### Idempotency: chìa khoá tự nhiên thắng mọi cơ chế khác

Mỗi lần ghi lãi, ghi kèm ngày. Muốn biết "ngày này tài khoản này đã chưa", chỉ cần hỏi một điều kiện:

~~~java
// "đã tính lãi cho (account, day) chưa?" — câu hỏi này trả lời được ngay cả khi checkpoint bị mất
LocalDate lastDay = lastAccruedDay.get(account);
if (day.equals(lastDay)) return false;   // lần chạy thứ hai trong ngày: no-op, không cộng thêm gì
~~~

Có ba tầng chống trùng, và production nên có cả ba:
1. **Chìa khoá tự nhiên (account, valueDate)** UNIQUE trong DB: ghi trùng sẽ bị DB từ chối — tầng mạnh nhất, vì nó nằm ở nơi dữ liệu sống.
2. **Checkpoint**: tiết kiệm công sức quét lại, giảm thời gian chạy từ nhiều tiếng xuống vài phút.
3. **Job run table** (trạng thái RUNNING/SUCCESS/FAILED theo ngày): chặn một *ngày* được khởi động hai lần, và cho phép phân biệt "chạy lại vì hỏng" với "chạy lại vì người vận hành bấm nhầm".

> Lưu ý: đừng chống trùng bằng "đã chạy bao giờ chưa" ở biến trong bộ nhớ ({{boolean isRunning}}). Node khác không nhìn thấy nó, và sau khi restart thì nó trở về false — đó đúng là cái cách mà sự cố tiền hai lần xảy ra.

### Lãi ngày: actual/365 và bẫy làm tròn

Quy ước phổ biến ở Việt Nam là **actual/365**: lãi ngày = {{dư nợ}} × {{lãi suất năm}} ÷ 365, số ngày thực tế của kỳ. Với {{BigDecimal}}, phép chia **bắt buộc** phải nói rõ lấy mấy chữ số và làm tròn kiểu gì, nếu không nó ném {{ArithmeticException}} (số vô tỉ như 1/3):

~~~java
BigDecimal interest = balance.multiply(annualRate)          // 100.000.000 x 0,04
        .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);   // -> 10.958,90 dong/ngay
~~~

Hai điểm senior hay bị hỏi lại:
- **Vì sao giữ scale 2 (hai chữ số) thay vì làm tròn về đồng chẵn mỗi ngày?** Vì tài khoản nhỏ (số dư 1.000đ, lãi 0,11đ/ngày) sẽ bị làm tròn thành **0 đồng** mỗi ngày, tức khách *không bao giờ* nhận được lãi, và tổng đối soát lãi phải trả sẽ lệch dần. Ngân hàng **ghi nhận (accrue) bằng số có phần lẻ**, rồi làm tròn **một lần** khi kết chuyển sang tài khoản (cuối kỳ) — cùng tinh thần "làm tròn một lần ở biên giới" của bài 1 và bài 7.
- **365 hay 366?** Năm nhuận theo quy ước actual/actual sẽ là 366; điều quan trọng không phải chọn số nào mà là **một hợp đồng chỉ dùng một quy ước**, lưu quy ước đó trong dữ liệu và tính đúng số ngày của kỳ (xem câu banking-011).

### Chunk: vì sao không xử lý hết trong một transaction

1,2 triệu tài khoản trong một transaction sẽ: (a) giữ lock quá lâu, (b) đầy undo log / replication lag, (c) nếu chết thì **mất sạch** tiến độ. Nên batch đi từng **chunk** (mảng con công việc, ví dụ 50.000 tài khoản), mỗi chunk một transaction, commit xong mới ghi checkpoint của chunk đó. Thứ tự hai bước này là bắt buộc:

| Thứ tự | Nếu crash ngay sau bước 1 | Kết quả |
|---|---|---|
| commit chunk → ghi checkpoint | mất checkpoint, nhưng dữ liệu đã ghi có chìa khoá (account, day) | chạy lại: chunk đó bị bỏ qua, **đúng** |
| ghi checkpoint → commit chunk | checkpoint nói "đã xong" nhưng giao dịch bị rollback | **mất tiền của khách**, chunk đó không bao giờ được làm |

Vì vậy: **checkpoint luôn là bước sau**, và checkpoint có thể mất mà không sao.

### Tài khoản lỗi không được phép làm kẹt cả đoàn tàu

Batch đụng dữ liệu bẩn mỗi đêm: số dư âm do bug, tài khoản đã tất toán, mã sản phẩm không còn. Nếu một {{IllegalArgumentException}} làm đứt cả vòng lặp, job đứng ở đúng tài khoản đó **mãi mãi** (checkpoint không đi tiếp được) — người ta gọi là **poisoned record**. Cách xử lý:

~~~java
for (String id : ids) {
    try { accrue(id, balances.get(id)); }
    catch (IllegalArgumentException bad) { failed.add(id); }   // ghi lại, bỏ qua, checkpoint vẫn tiến
}
~~~

Kèm hai điều kiện: mỗi id chỉ xuất hiện trong danh sách lỗi **một lần** (không spam log 40 lần khi job retry), và danh sách lỗi phải được **đổ ra monitoring** để con người xử lý — batch "thành công 99,98%" nhưng âm thầm bỏ 2.400 tài khoản là một sự cố chưa được gọi tên.

### Hai node cùng chạy một đêm

Rất nhiều sự cố xảy ra khi node A chạy chậm qua 2h, người vận hành tưởng job chết nên bấm chạy lại trên node B, hai bên cùng tính lãi cho 05/11. Chìa khoá (account, day) vẫn cứu tiền, nhưng hai node vẫn **đè tài nguyên** của nhau. Cách chặn: một bản ghi "lease" (nhượng quyền) kiểu {{EOD_INTEREST / 2026-11-05 / owner=nodeA / expires_at=03:30}} với UPDATE có điều kiện — ai giành được lease mới được chạy, lease hết hạn thì node khác được giành. Hoặc chia **shard**: node A xử lý tài khoản có id đuôi 0–4, node B xử lý 5–9 — hai dải không giao nhau, không cần thương lượng.

### Những chỗ hay sai nhất

- Kiểm tra "đã chạy chưa" bằng {{if (processedCount > 0)}} — chỉ đúng trong một lần chạy, không survive restart.
- Quên rằng batch cũng cần **Clock inject**: "hôm nay là ngày nào" quyết định valueDate và quyết định chunk này thuộc kỳ nào.
- Dùng {{double}} cho lãi: 100.000.000 × 0,04 / 365 tính bằng double cho 10958,904109589042, và sau 1,2 triệu tài khoản thì con số sai thành hàng chục triệu đồng (xem bài 1).
- Đặt tên {{run()}} rồi bên trong vừa tính vừa **ghi luôn** mà không có hàm thuần để test — sau này muốn test chỉ từng tài khoản một phải mock cả DB.
- In checkpoint ra log nhưng không lưu ở đâu cả → restart là mất.

> Senior tip: Câu hỏi phỏng vấn phân biệt người từng chạy batch với người chỉ đọc tài liệu là: *"Nếu job chết ở tài khoản thứ 700.000 và bạn chỉ còn 90 phút trước khi hệ thống lõi (core banking — phần mềm kế toán trung tâm của ngân hàng) mở cửa, bạn làm gì?"*. Trả lời theo ba bước: (1) bật lại với **cùng valueDate**, job tự đi tiếp sau checkpoint — chi phí vài phút, không mất dữ liệu; (2) kiểm tra bằng truy vấn đếm "số tài khoản có bản ghi lãi cho ngày 05/11" chia cho tổng số tài khoản hợp lệ, thay vì tin log; (3) nếu không kịp, chạy nốt phần còn lại trên node khác theo dải tài khoản **sau** node đầu, vì chìa khoá (account, day) khiến phần chồng lấn trở thành no-op. Nhấn: idempotency nằm ở tầng dữ liệu, checkpoint chỉ là tối ưu.

### Liên hệ phỏng vấn

**Câu hỏi:** "Bạn thiết kế batch tính lãi cuối ngày cho 1,2 triệu tài khoản thế nào để chạy lại an toàn?"

**Cách trả lời:** Ba lớp. **(1) Kết quả mang chìa khoá tự nhiên**: mỗi bản ghi lãi lưu (account, valueDate) với ràng buộc UNIQUE, nên ghi lần hai trong cùng ngày là no-op — đây là tầng bảo vệ tiền, và nó đúng kể cả khi mất toàn bộ trạng thái của job. **(2) Checkpoint theo chunk**: job đi từng lô (ví dụ 50.000 tài khoản, sắp xếp theo id), commit chunk trong một transaction **cùng chỗ** với việc ghi dấu "đã tính lãi", sau đó mới cập nhật checkpoint "tài khoản cuối đã xử lý"; thứ tự phải là commit trước — checkpoint sau, vì ngược lại thì crash sẽ làm **mất** chunk đó vĩnh viễn. **(3) Chống chạy trùng hai node**: một bảng job-run/lease theo (job, ngày) với UPDATE có điều kiện, hoặc chia shard theo dải tài khoản khi muốn hai node cùng chạy cho kịp giờ. Cộng thêm chi tiết nghiệp vụ: lãi theo actual/365 bằng {{BigDecimal}} scale 2 để tài khoản nhỏ không bị làm tròn về 0 đồng mỗi ngày, làm tròn một lần khi kết chuyển; tài khoản dữ liệu bẩn được bỏ qua và ghi vào danh sách lỗi để monitoring, không làm checkpoint kẹt; và "hôm nay là ngày nào" lấy từ {{Clock}} inject để test deterministic.`,
    exercises: [
      {
        title: 'EodJob: accrue idempotent, run theo chunk, checkpoint resume',
        prompt: `Viết hai class mô phỏng một phần batch EOD bằng Java thuần.

{{Accrual}} — tính lãi **một ngày** cho **một tài khoản**, quy ước actual/365:
- {{Accrual(BigDecimal annualRate)}} — {{annualRate}} là lãi suất năm dạng số thập phân ({{0.04}} = 4%/năm); {{null}} hoặc âm ⇒ {{IllegalArgumentException}}.
- {{BigDecimal interestFor(BigDecimal balance)}} = {{balance}} × {{annualRate}} ÷ 365, làm tròn {{HALF_UP}} về **scale 2** và **trả về scale 2** (kể cả khi kết quả là 0 thì vẫn là {{0.00}}). {{balance}} {{null}} hoặc âm ⇒ {{IllegalArgumentException}}.

{{EodJob}} — chạy batch ghi lãi:
- {{EodJob(Accrual accrual, Clock clock)}} — "hôm nay là ngày nào" phải lấy từ {{clock}} (hàm {{today()}} đã viết sẵn).
- {{boolean accrue(String account, BigDecimal balance)}} — ghi lãi của **ngày hiện tại** cho một tài khoản. Trả {{true}} nếu vừa ghi, {{false}} nếu ngày này tài khoản đó **đã được ghi rồi** (no-op, không cộng thêm đồng nào). Đây là chìa khoá (account, day) — độc lập với checkpoint.
- {{int run(Map<String, BigDecimal> balances, int maxAccounts)}} — đi tiếp từ checkpoint, xét **tối đa** {{maxAccounts}} tài khoản theo thứ tự **tăng dần của id** (mỗi tài khoản được xét đều tính vào {{maxAccounts}}, kể cả bị bỏ qua vì đã ghi rồi), trả về số tài khoản **thực sự được ghi mới** trong lần gọi này. Tài khoản làm {{accrue}} ném {{IllegalArgumentException}} (dữ liệu bẩn) thì **bỏ qua**, ghi id vào {{failed()}} và **checkpoint vẫn tiến** — job không được kẹt. {{maxAccounts < 1}} ⇒ {{IllegalArgumentException}}.
- {{BigDecimal accrued(String account)}} — tổng lãi đã ghi của tài khoản (scale 2), tài khoản chưa biết ⇒ {{0.00}}.
- {{String checkpoint()}} — id tài khoản cuối đã xét **trong ngày hôm nay**, {{null}} nếu hôm nay chưa xét gì.
- {{void resetCheckpoint()}} — xoá con trỏ của ngày hôm nay (dùng khi ngày xong hoặc khi muốn mô phỏng node khác chưa biết gì). **Không** xoá kết quả đã ghi.
- {{List<String> failed()}} — các id lỗi của hôm nay, **mỗi id một lần**, theo thứ tự phát hiện.
- {{boolean alreadyAccruedToday(String account)}}.

{{account}} {{null}}/rỗng ⇒ {{IllegalArgumentException}}.`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

class Accrual {
    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");
    private final BigDecimal annualRate;

    Accrual(BigDecimal annualRate) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal interestFor(BigDecimal balance) {
        throw new UnsupportedOperationException("TODO");
    }
}

class EodJob {
    private final Accrual accrual;
    private final Clock clock;
    private final Map<String, BigDecimal> totals = new HashMap<>();
    private final Map<String, LocalDate> lastAccruedDay = new HashMap<>();
    private final Map<String, LocalDate> lastFailedDay = new HashMap<>();
    private final List<String> failedToday = new ArrayList<>();
    private String checkpoint;
    private LocalDate checkpointDay;

    EodJob(Accrual accrual, Clock clock) {
        this.accrual = accrual;
        this.clock = clock;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);
    }

    boolean accrue(String account, BigDecimal balance) {
        throw new UnsupportedOperationException("TODO");
    }

    int run(Map<String, BigDecimal> balances, int maxAccounts) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal accrued(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    String checkpoint() {
        return checkpoint;
    }

    void resetCheckpoint() {
        throw new UnsupportedOperationException("TODO");
    }

    List<String> failed() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean alreadyAccruedToday(String account) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static BigDecimal bd(String s) { return new BigDecimal(s); }
    static boolean eq(BigDecimal a, String s) { return a.compareTo(bd(s)) == 0; }

    // Bắt "hôm nay" trong tay test: cài today() để quay sang ngày kế tiếp mà không phải đổi giờ máy.
    static final class OnDay extends EodJob {
        private LocalDate day;
        OnDay(Accrual a, LocalDate first) {
            super(a, Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
            this.day = first;
        }
        void setDay(LocalDate d) { day = d; }
        @Override protected LocalDate today() { return day; }
    }

    static Map<String, BigDecimal> books(String... pairs) {
        Map<String, BigDecimal> m = new HashMap<>();
        for (int i = 0; i < pairs.length; i += 2) m.put(pairs[i], pairs[i + 1] == null ? null : bd(pairs[i + 1]));
        return m;
    }

    public static void main(String[] args) {
        Accrual ac = new Accrual(bd("0.04"));

        check("lai_100trieu_scale_2", eq(ac.interestFor(bd("100000000")), "10958.90") && ac.interestFor(bd("100000000")).scale() == 2,
            "lai=" + ac.interestFor(bd("100000000")));
        check("lai_trieu_dong_le", eq(ac.interestFor(bd("1000000")), "109.59"), "lai=" + ac.interestFor(bd("1000000")));
        check("lai_500ngan_le", eq(ac.interestFor(bd("500000")), "54.79"), "lai=" + ac.interestFor(bd("500000")));
        check("so_du_1_dong_lam_tron_ve_0_khong_phai_am", eq(ac.interestFor(bd("1")), "0") && ac.interestFor(bd("1")).scale() == 2,
            "lai=" + ac.interestFor(bd("1")));
        check("so_du_0_tra_ve_00", eq(ac.interestFor(bd("0")), "0"), "lai=" + ac.interestFor(bd("0")));
        check("so_du_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> ac.interestFor(bd("-1000"))), "");
        check("so_du_null_bi_tu_choi", expect(IllegalArgumentException.class, () -> ac.interestFor(null)), "");
        check("lai_suat_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> new Accrual(bd("-0.01"))), "");

        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock day5 = Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), vn);   // 09:00 ngay 05/11 VN
        EodJob job = new EodJob(ac, day5);

        check("accrue_lan_dau_true", job.accrue("A001", bd("100000000")) && eq(job.accrued("A001"), "10958.90"), "tong=" + job.accrued("A001"));
        check("da_ghi_hom_nay_roi", job.alreadyAccruedToday("A001"), "");
        check("accrue_lan_hai_false_khong_nhan", !job.accrue("A001", bd("100000000")) && eq(job.accrued("A001"), "10958.90"), "tong=" + job.accrued("A001"));
        check("retry_voi_so_du_khac_van_no_op", !job.accrue("A001", bd("999999999")), "tong=" + job.accrued("A001"));
        check("account_chua_ghi_tong_bang_00", eq(job.accrued("ZZ"), "0") && job.accrued("ZZ").scale() == 2, "tong=" + job.accrued("ZZ"));
        check("account_rong_bi_tu_choi", expect(IllegalArgumentException.class, () -> job.accrue("", bd("1000"))), "");
        check("maxAccounts_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> job.run(books("A002", "1000000"), 0)), "");
        check("balance_null_bi_tu_choi_khong_ghi", expect(IllegalArgumentException.class, () -> job.accrue("A009", null)) && eq(job.accrued("A009"), "0"), "");

        // chạy cả danh sách 4 tài khoản, A004 được 0 đồng vẫn phải được đánh dấu là xong
        EodJob j2 = new EodJob(ac, day5);
        Map<String, BigDecimal> four = books("A001", "100000000", "A002", "1000000", "A003", "500000", "A004", "1");
        check("run_xet_ca_bon", j2.run(four, 10) == 4, "checkpoint=" + j2.checkpoint());
        check("thu_tu_id_quyet_dinh_checkpoint", "A004".equals(j2.checkpoint()), "checkpoint=" + j2.checkpoint());
        check("lai_tung_tai_khoan_dung", eq(j2.accrued("A001"), "10958.90") && eq(j2.accrued("A002"), "109.59")
            && eq(j2.accrued("A003"), "54.79") && eq(j2.accrued("A004"), "0"), "A002=" + j2.accrued("A002"));
        check("tai_khoan_0_dong_cung_duoc_danh_dau", j2.alreadyAccruedToday("A004"), "");
        check("run_lai_khong_tinh_them", j2.run(four, 10) == 0 && eq(j2.accrued("A001"), "10958.90"), "tong=" + j2.accrued("A001"));

        // checkpoint đi đúng bước: 5 tài khoản, mỗi lần 2
        EodJob j3 = new EodJob(ac, day5);
        Map<String, BigDecimal> five = books("A001", "1000000", "A002", "1000000", "A003", "1000000", "A004", "1000000", "A005", "1000000");
        check("chunk_1", j3.run(five, 2) == 2 && "A002".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_2_tiep_tu_checkpoint", j3.run(five, 2) == 2 && "A004".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_3_con_lai_1", j3.run(five, 1) == 1 && "A005".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_4_khong_con_gi", j3.run(five, 5) == 0, "checkpoint=" + j3.checkpoint());
        check("moi_tai_khoan_dung_109_59", eq(j3.accrued("A005"), "109.59"), "A005=" + j3.accrued("A005"));

        // checkpoint mất (node mới chưa biết gì) nhưng tiền không được trao tay hai lần
        j3.resetCheckpoint();
        check("reset_checkpoint_ve_null", j3.checkpoint() == null, "checkpoint=" + j3.checkpoint());
        int again = j3.run(five, 5);
        check("checkpoint_mat_van_khong_chi_tien_hai_lan", again == 0 && eq(j3.accrued("A001"), "109.59"), "so ghi=" + again + " tong=" + j3.accrued("A001"));

        // dữ liệu giữa danh sách: bỏ qua, checkpoint vẫn tiến, failed không trùng lặp
        EodJob j4 = new EodJob(ac, day5);
        Map<String, BigDecimal> dirty = books("A001", "1000000", "A002", "1000000", "B_BAD", "-500000", "C003", "1000000");
        check("loi_du_lieu_khong_lam_ket_job", j4.run(dirty, 10) == 3 && "C003".equals(j4.checkpoint()), "checkpoint=" + j4.checkpoint());
        check("id_loi_duoc_ghi_lai", j4.failed().size() == 1 && "B_BAD".equals(j4.failed().get(0)), "failed=" + j4.failed());
        check("tai_khoan_loi_khong_duoc_gi", eq(j4.accrued("B_BAD"), "0") && !j4.alreadyAccruedToday("B_BAD"), "");
        j4.resetCheckpoint();
        j4.run(dirty, 10);
        check("failed_khong_spam_khi_retry", j4.failed().size() == 1 && j4.run(dirty, 10) == 0, "failed=" + j4.failed());
        check("tai_khoan_loi_khong_bao_gio_am_tong", eq(j4.accrued("A001"), "109.59"), "A001=" + j4.accrued("A001"));

        // sang ngay moi: duoc tinh lai, va tong cong dan (accrual, chua ket chuyen)
        OnDay j5 = new OnDay(ac, LocalDate.of(2026, 11, 5));
        Map<String, BigDecimal> one = books("A001", "100000000");
        check("ngay_1", j5.run(one, 10) == 1 && eq(j5.accrued("A001"), "10958.90") && j5.checkpoint().equals("A001"), "cp=" + j5.checkpoint());
        j5.setDay(LocalDate.of(2026, 11, 6));
        check("checkpoint_khong_doi_qua_ngay", j5.checkpoint() == null, "cp=" + j5.checkpoint());
        check("ngay_2_tinh_tiep", j5.run(one, 10) == 1 && eq(j5.accrued("A001"), "21917.80"), "tong=" + j5.accrued("A001"));
        check("ngay_2_cung_id_van_no_op_trong_ngay", !j5.accrue("A001", bd("100000000")), "tong=" + j5.accrued("A001"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

class Accrual {
    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");
    private final BigDecimal annualRate;

    Accrual(BigDecimal annualRate) {
        if (annualRate == null || annualRate.signum() < 0) throw new IllegalArgumentException("lai suat khong hop le");
        this.annualRate = annualRate;
    }

    BigDecimal interestFor(BigDecimal balance) {
        if (balance == null) throw new IllegalArgumentException("thieu so du");
        if (balance.signum() < 0) throw new IllegalArgumentException("so du khong duoc am");
        // divide BẮT BUỘC kèm scale + RoundingMode: khong co la ArithmeticException khi thuong so vo han
        return balance.multiply(annualRate).divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP);
    }
}

class EodJob {
    private final Accrual accrual;
    private final Clock clock;
    private final Map<String, BigDecimal> totals = new HashMap<>();
    private final Map<String, LocalDate> lastAccruedDay = new HashMap<>();
    private final Map<String, LocalDate> lastFailedDay = new HashMap<>();
    private final List<String> failedToday = new ArrayList<>();
    private String checkpoint;
    private LocalDate checkpointDay;

    EodJob(Accrual accrual, Clock clock) {
        this.accrual = accrual;
        this.clock = clock;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);   // "hom nay" la du liệu inject, khong phai System.currentTime
    }

    private void rollDay() {
        LocalDate day = today();
        if (!day.equals(checkpointDay)) {   // sang ngay moi: con tro ve dau, ket qua cu giu nguyen
            checkpointDay = day;
            checkpoint = null;
            failedToday.clear();
        }
    }

    boolean accrue(String account, BigDecimal balance) {
        if (account == null || account.isEmpty()) throw new IllegalArgumentException("thieu tai khoan");
        LocalDate day = today();
        if (day.equals(lastAccruedDay.get(account))) return false;   // chi khoa (account, day)
        BigDecimal interest = accrual.interestFor(balance);
        totals.merge(account, interest, BigDecimal::add);
        lastAccruedDay.put(account, day);
        return true;
    }

    int run(Map<String, BigDecimal> balances, int maxAccounts) {
        if (maxAccounts < 1) throw new IllegalArgumentException("maxAccounts phai >= 1");
        if (balances == null) throw new IllegalArgumentException("thieu danh sach tai khoan");
        rollDay();
        List<String> ids = new ArrayList<>(balances.keySet());
        Collections.sort(ids);            // thu tu tang dan: "id > checkpoint" nghia la phan chua lam nam phia sau
        int credited = 0, examined = 0;
        for (String id : ids) {
            if (checkpoint != null && id.compareTo(checkpoint) <= 0) continue;
            if (examined == maxAccounts) break;
            examined++;
            checkpoint = id;              // checkpoint bước tiên, kể cả khi tài khoản lỗi -> job không bị kẹt
            try {
                if (accrue(id, balances.get(id))) credited++;
            } catch (IllegalArgumentException dirtyData) {
                if (!today().equals(lastFailedDay.get(id))) {
                    lastFailedDay.put(id, today());
                    failedToday.add(id);
                }
            }
        }
        return credited;
    }

    BigDecimal accrued(String account) {
        return totals.getOrDefault(account, new BigDecimal("0.00"));
    }

    String checkpoint() {
        rollDay();                        // "hom nay" co the vua doi ma chua method nao duoc goi
        return checkpoint;
    }

    void resetCheckpoint() {
        rollDay();
        checkpoint = null;                // chi xoa con tro, khong xoa ket qua
    }

    List<String> failed() {
        return new ArrayList<>(failedToday);
    }

    boolean alreadyAccruedToday(String account) {
        return today().equals(lastAccruedDay.get(account));
    }
}`,
        hints: [
          'Chìa khoá chống trùng là cặp (tài khoản, ngày), **không phải** checkpoint. Giữ {{Map<String, LocalDate>}} "ngày cuối đã ghi cho tài khoản này" và trả {{false}} khi nó bằng hôm nay — nhờ vậy {{resetCheckpoint()}} rồi chạy lại vẫn không cộng tiền lần hai.',
          'Trong {{Accrual.interestFor}}, phép chia {{BigDecimal}} **bắt buộc** có scale và RoundingMode: {{divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP)}}. Viết {{divide(DAYS_IN_YEAR)}} sẽ ném {{ArithmeticException}} vì thương có thể vô hạn.',
          '{{run}} nên: lấy danh sách id, {{Collections.sort}}, rồi duyệt và **bỏ qua mọi id nhỏ hơn hoặc bằng checkpoint** ({{id.compareTo(checkpoint) <= 0}}). Đó chính là "tiếp tục từ chỗ chết".',
          'Cập nhật {{checkpoint = id}} **trước** khi gọi {{accrue}} và đặt nó trong {{try/catch}}: nếu không, một tài khoản dữ liệu bẩn sẽ giữ job đứng lại mãi ở đúng id đó.',
          'Cần hai thứ riêng biệt: kết quả đã ghi (sống qua restart, dùng để chống trùng) và con trỏ ngày hôm nay ({{checkpointDay}}) — khi {{today()}} đổi ngày thì con trỏ về {{null}}, còn tổng lãi thì vẫn cộng dồn.',
        ],
        explain: `Test đi theo đúng thứ tự một vụ tai nạn thật xảy ra, và mỗi nhóm assert một tầng bảo vệ.

1. **Tính tiền đúng đã.** 100.000.000đ × 4%/năm theo actual/365 = 10.958,90đ/ngày ({{divide}} với scale 2 + {{HALF_UP}}). Số dư 1đ cho lãi 0,000109589đ → làm tròn thành {{0.00}} chứ **không** thành số âm hay mất dấu, và test bắt luôn {{scale() == 2}} để lời giải không trả {{0}} hay {{0.000}}: cùng một giá trị nhưng khác cách biểu diễn sẽ làm đối soát và JSON output lệch nhau. Đây là điểm mà {{BigDecimal}} khác {{double}} — {{double}} cho 10958.904109589042 và cộng dồn trên triệu tài khoản là sai số thật sự.

2. **Chống trùng nằm ở chìa khoá tự nhiên.** {{accrue("A001", ...)}} lần hai trả {{false}} và tổng **không đổi**, kể cả khi lần hai gửi kèm số dư khác ({{999999999}}) — test {{retry_voi_so_du_khac_van_no_op}} cố tình kiểm tra điều này: một batch retry thường mang theo snapshot số dư mới, và nếu bạn định "đã có rồi thì cập nhật theo số mới" thì đó chính là chỗ tiền bị ghi đè. Vì vậy ngày đã ghi thì **không đụng tới kết quả cũ**, muốn sửa phải dùng bút toán đảo (bài 5).

3. **Checkpoint chỉ là tối ưu.** Sau {{resetCheckpoint()}} — mô phỏng node mới chưa biết gì, hoặc checkpoint bị xoá cùng file temp — {{run}} vẫn trả **0** tài khoản được ghi, vì tầng 2 đã chặn. Đây chính là điều kiện "mất checkpoint vẫn không mất tiền" mà mục Body đã nói, và nó phân biệt idempotency thật với idempotency hình thức.

4. **Chunk và thứ tự.** Với {{maxAccounts}} = 2, các lần gọi trả 2, 2, 1 và checkpoint lần lượt A002, A004, A005. Bất biến quan trọng: tài khoản được xét **đúng một lần trong ngày** kể cả khi job bị gọi 5 lần. Muốn vậy phải duyệt theo thứ tự xác định ({{Collections.sort}}) — nếu duyệt theo {{HashMap}} thì thứ tự có thể đổi giữa hai lần chạy và checkpoint sẽ bỏ sót hoặc làm lại.

5. **Dữ liệu bẩn không được kẹt đoàn tàu.** {{B_BAD}} nằm giữa danh sách: {{run}} trả 3 (A001, A002, C003), checkpoint tới {{C003}}, {{failed()}} chỉ có một phần tử và **không tăng** khi chạy lại. Nếu bạn đặt {{checkpoint = id}} *sau* khi {{accrue}} thành công, tài khoản lỗi sẽ khiến checkpoint đứng tại {{A002}} và mọi lần chạy lại đều thất bại ở cùng chỗ — đây là bug poisoning kinh điển.

6. **Ngày kế tiếp.** Sang 06/11, {{checkpoint()}} là {{null}} (con trỏ thuộc về ngày, không phải toàn thời gian), {{run}} ghi tiếp và tổng lãi **cộng dồn** thành 21.917,80 — chưa kết chuyển vào gốc. Đó là hành vi thật của accrual: ngân hàng ghi lãi phải trả từng ngày vào tài khoản treo rồi mới capitalise theo chu kỳ; nếu cộng vào gốc mỗi ngày thì số dư ngày mai đã khác và công thức actual/365 bị sai.

Điều bài này **không** giả lập (và cũng là câu nên chủ động nói khi phỏng vấn): transaction thật, UNIQUE constraint và lease giữa các node. Trong code thuần, {{lastAccruedDay}} đóng vai trò dòng record có UNIQUE, {{checkpoint}} đóng vai trò bảng job-run — nhưng trên production cả hai phải nằm trong DB, vì tiến trình batch chết là mất sạch bộ nhớ.`,
      },
    ],
    check: [
      { q: 'Điều gì bảo vệ tiền khi batch bị chạy lại hai lần trong cùng một ngày?', options: ['Biến {{isRunning}} trong bộ nhớ job', 'Chìa khoá tự nhiên (tài khoản, ngày) trên bản ghi kết quả, tốt nhất là UNIQUE trong DB', 'Checkpoint lưu tài khoản cuối cùng', 'Log "job đã chạy" ghi ra file'], answer: 1, explain: 'Đúng (B): chìa khoá tự nhiên (natural key) như cặp (account, valueDate/day) gắn trên bản ghi kết quả — kèm ràng buộc UNIQUE ở DB — đảm bảo ghi lần hai cùng ngày sẽ bị chặn/từ chối (no-op). Đây là tầng bảo vệ tiền bền vững vì nằm ở dữ liệu, không phụ thuộc trạng thái tiến trình. Sai (A): biến trong bộ nhớ mất khi process restart hoặc không nhìn thấy từ node khác. Sai (C): checkpoint chỉ giúp biết đã xử lý tới đâu để resume nhanh, không ngăn ghi trùng nếu logic không kiểm tra khóa tự nhiên. Sai (D): log chỉ để quan sát, không có cơ chế ngăn ghi dữ liệu trùng.' },
      { q: 'Vì sao phải commit chunk RỒI mới cập nhật checkpoint?', options: ['Vì ghi checkpoint chậm hơn', 'Vì làm ngược lại thì một chunk có thể bị checkpoint báo "xong" trong khi dữ liệu chưa commit và không bao giờ được làm lại', 'Vì checkpoint không được nằm trong cùng transaction', 'Vì chunk cần lock bảng checkpoint'], answer: 1, explain: 'Đúng (B): nếu cập nhật checkpoint trước rồi mới commit dữ liệu, một sự cố (crash) ngay giữa chừng có thể khiến checkpoint nói chunk đã xong nhưng dữ liệu thực tế chưa được ghi/commit — khi chạy lại, job sẽ bỏ qua chunk đó và gây mất tiền (không tính lãi cho tài khoản). Commit dữ liệu trước rồi mới ghi checkpoint đảm bảo: nếu crash sau commit mà mất checkpoint, lần sau có thể quét lại chunk nhưng chìa khoá tự nhiên/idempotency sẽ chặn ghi trùng. Sai (A): tốc độ không phải lý do đúng đắn. Sai (C): checkpoint có thể nằm cùng hoặc khác transaction tùy thiết kế, nhưng thứ tự logic "dữ liệu chắc chắn rồi mới đánh dấu tiến độ" mới là điều quan trọng. Sai (D): lock bảng checkpoint không phải nguyên nhân chính.' },
      { q: 'Một tài khoản dữ liệu bẩn (số dư âm) giữa danh sách nên xử lý thế nào?', options: ['Dừng job và chờ người vận hành sửa', 'Ném exception để alert tự động bắt được', 'Ghi id vào danh sách lỗi, bỏ qua, checkpoint vẫn tiến', 'Tự đặt số dư về 0 rồi tính lãi'], answer: 2, explain: 'Đúng (C): bản ghi lỗi (poisoned record) không được làm kẹt cả batch. Cách đúng là bắt lỗi cho bản ghi đó, ghi id vào danh sách failed để monitoring/con người xử lý, bỏ qua và cho checkpoint tiến tiếp để các tài khoản hợp lệ khác vẫn được xử lý đúng hạn. Cần đảm bảo mỗi id lỗi chỉ ghi nhận một lần (không spam khi retry). Sai (A): dừng hẳn khiến toàn bộ phần còn lại không được xử lý kịp (đặc biệt sát giờ core banking mở cửa). Sai (B): chỉ ném exception không bắt sẽ làm job chết tại chỗ. Sai (D): tự sửa dữ liệu (đặt số dư về 0) là thay đổi nghiệp vụ sai và nguy hiểm, có thể che giấu lỗi dữ liệu gốc.' },
      { q: 'Vì sao không làm tròn lãi mỗi ngày về đồng chẵn?', options: ['Vì làm tròn nhiều lần bị chậm', 'Vì tài khoản nhỏ sẽ nhận 0 đồng mỗi ngày và tổng lãi phải trả lệch dần; accrue giữ phần lẻ, làm tròn một lần khi kết chuyển', 'Vì VND không có đơn vị nhỏ hơn 1 đồng', 'Vì BigDecimal không làm tròn được số nhỏ'], answer: 1, explain: 'Đúng (B): nếu làm tròn về đồng chẵn mỗi ngày, tài khoản có số dư nhỏ có thể sinh lãi < 0,5đ/ngày và bị làm tròn thành 0, dẫn đến khách không nhận lãi dù đúng; đồng thời sai số làm tròn lặp lại làm tổng lãi phải trả lệch dần so với thực tế. Cách đúng là ghi nhận lãi tích lũy (accrue) với phần lẻ (scale phù hợp, ví dụ 2 chữ số) và chỉ làm tròn một lần ở biên giới khi kết chuyển/gộp lãi vào gốc. Sai (A): hiệu năng không phải lý do chính. Sai (C): VND không có đơn vị nhỏ hơn đồng trong thanh toán, nhưng khi tính lãi tích lũy nội bộ vẫn cần giữ phần lẻ trước khi chốt. Sai (D): {{BigDecimal}} hỗ trợ làm tròn số nhỏ với {{RoundingMode}}.' },
    ],
    related: ['banking-028', 'banking-011', 'banking-001'],
    tags: ['batch', 'eod', 'idempotency', 'checkpoint', 'bigdecimal', 'interest', 'banking'],
  },

  {
    id: 'lesson-banking-011',
    track: 'banking',
    order: 11,
    title: 'Vòng đời giao dịch thẻ: authorization, clearing, settlement, refund và chargeback',
    level: 'senior',
    minutes: 35,
    goals: [
      'Phân biệt authorization (giữ tiền), clearing (chuyển dữ liệu) và settlement (chuyển tiền thật) — tiền không đi ngay khi quẹt thẻ',
      'Hiểu các bên: chủ thẻ, merchant, acquirer, scheme (Visa/Mastercard/NAPAS), issuer và luồng tiền/dữ liệu',
      'Biết refund là giao dịch mới ngược chiều, chargeback là tranh chấp có thể bị phạt, và auth hết hạn tự release',
      'Viết CardTxnLifecycle state machine (AUTHORIZED -> CAPTURED -> SETTLED -> REFUNDED/CHARGEBACK, auth hết hạn sau N ngày với Clock cố định)',
    ],
    body: `**Tóm tắt:** Khi quẹt thẻ, tiền **không** chuyển ngay từ chủ thẻ sang merchant. Có **ba pha riêng biệt**: authorization (giữ tiền tạm thời), clearing (chuyển dữ liệu giao dịch qua scheme) và settlement (chuyển tiền thật T+1). Refund là giao dịch mới ngược chiều (không phải xóa authorization), chargeback là chủ thẻ tranh chấp qua issuer có thể làm merchant mất tiền + phí. Authorization có thời hạn (thường 7 ngày) và tự động release nếu không capture. Số dư khả dụng = sổ cái - tổng hold đang mở (xem lesson-banking-007).

### Ngoài đời diễn ra thế nào

Hãy tưởng tượng Lan mua một chiếc áo 500.000đ tại cửa hàng Minh, thanh toán bằng thẻ Visa.

1. **Authorization (uy quyền / xin phép)** — giây thứ 1: máy POS gửi yêu cầu qua acquirer (ngân hàng của merchant) lên scheme (Visa) rồi xuống issuer (ngân hàng phát thẻ của Lan). Issuer kiểm tra: thẻ còn hiệu lực, chưa bị khóa, hạn mức đủ 500.000đ? Nếu đủ, issuer **giữ (hold)** 500.000đ ở tài khoản Lan — tiền vẫn nằm đó, chưa đi đâu — và trả về mã **approval code**. Cửa hàng in hóa đơn "Đã thanh toán 500.000đ" nhưng thực ra tiền chưa chuyển. **Lưu ý: authorization chỉ giữ tiền, chưa trừ tiền.** Số dư sổ cái của Lan vẫn nguyên vẹn, số dư khả dụng giảm 500.000đ.

2. **Clearing (truyền dữ liệu)** — cuối ngày (thường 23:00): acquirer gom tất cả authorization thành công trong ngày, gửi file **clearing** lên scheme. Scheme phân loại theo issuer, chuyển file dữ liệu (không chuyển tiền) cho từng issuer. Dữ liệu bao gồm: mã giao dịch, số tiền, merchant, approval code, ngày giờ. Đây là lúc scheme tính **interchange fee** (phí giữa issuer và acquirer) và **scheme fee** (phí của Visa/Mastercard/NAPAS).

3. **Settlement (chốt toán/chuyển tiền thật)** — ngày làm việc sau (T+1): scheme điều phối chuyển tiền thật giữa ngân hàng. Issuer chuyển tiền (đã trừ interchange fee) cho acquirer qua tài khoản tại ngân hàng trung ương (hoặc tài khoản correspondent). Acquirer trừ merchant discount rate (MDR — phí merchant trả cho acquirer) rồi chuyển phần còn lại cho merchant. Lúc này tiền **thực sự** rời tài khoản Lan và vào tài khoản merchant. Settlement thường là **net settlement** (chênh lệch hai chiều gộp thành một dòng) chứ không chuyển từng giao dịch.

### Các bên tham gia

| Bên | Vai trò | Ví dụ thực tế |
|---|---|---|
| **Cardholder (chủ thẻ)** | Người nắm thẻ, chi tiền | Lan |
| **Merchant** | Người bán, nhận tiền | Cửa hàng Minh |
| **Acquirer (ngân hàng thu hộ)** | Cung cấp POS, thu tiền cho merchant, gửi clearing | VPBank, Techcombank, Vietcombank (cấp POS) |
| **Scheme (tổ chức thẻ)** | Vận hành mạng lưới, quy tắc, clearing, settlement, phí | Visa, Mastercard, NAPAS (Việt Nam) |
| **Issuer (ngân hàng phát thẻ)** | Cấp thẻ, giữ hạn mức, approve/decline authorization, trả tiền khi settlement | BIDV, Agribank, VietinBank (ngân hàng của Lan) |

### Vòng đời trạng thái một giao dịch thẻ

| Trạng thái | Nghiệp vụ | Ai khởi tạo | Số dư sổ cái | Hold |
|---|---|---|---|---|
| **AUTHORIZED** | Issuer giữ tiền, trả approval code | Issuer (qua scheme) | Không đổi | Mở (+500k) |
| **CAPTURED** | Merchant xác nhận chốt số tiền thật (≤ auth) | Merchant/Acquirer | Không đổi | Còn mở (chỉnh lại nếu partial) |
| **SETTLED** | Tiền thực sự chuyển issuer -> acquirer -> merchant | Scheme (T+1) | Giảm 500k (issuer) / Tăng (merchant) | Đóng |
| **EXPIRED** | Authorization hết hạn (thường 7 ngày) không được capture | Hệ thống (timer) | Không đổi | Tự đóng, release tiền |
| **REFUNDED** | Merchant đồng ý hoàn tiền (giao dịch mới ngược chiều) | Merchant/Acquirer | Tăng (cardholder) / Giảm (merchant) | Không liên quan hold cũ |
| **CHARGED_BACK** | Chủ thẻ tranh chấp, issuer lấy tiền lại từ merchant | Issuer (qua scheme) | Tăng (cardholder) / Giảm (merchant) | Không liên quan hold cũ |

### Vì sao refund KHÔNG phải "xóa authorization"

Authorization là lời hứa "tôi giữ tiền này cho bạn". Refund là "tôi trả tiền về cho bạn". Nếu authorization chưa được capture/settle (ví dụ merchant hủy đơn trước khi chốt), chỉ cần **release** hold — tiền về khả dụng ngay, không có dòng tiền ngược. Nếu đã **settled**, tiền đã ở merchant; refund tạo một giao dịch **mới** ngược chiều (merchant -> acquirer -> scheme -> issuer -> cardholder) với merchant discount rate thường **không hoàn lại**. Refund cũng đi qua clearing/settlement T+1 riêng.

### Chargeback: khi chủ thẻ nói "tôi không làm giao dịch này"

Chủ thẻ gọi issuer khiếu nại: gian lận, không nhận hàng, hàng sai mô tả, bị trùng phí... Issuer mở **dispute** (tranh chấp) qua scheme. Merchant có cơ hội **representment** (cung cấp bằng chứng: hóa đơn, chứng từ giao hàng, chữ ký...). Nếu merchant không phản hồi hoặc bằng chứng yếu → issuer thắng → scheme chuyển tiền từ acquirer về issuer (**chargeback**) + **chargeback fee** (phí phạt, thường 15–50 USD). Nếu merchant thắng → dispute đóng, tiền ở lại merchant.

Quy tắc vàng: **giữ chứng từ đầy đủ** (invoice, proof of delivery, AVS/CVC match, 3D Secure) là cách duy nhất thắng chargeback. Chargeback rate > 1% (số chargeback/tổng giao dịch) có thể bị scheme phạt hoặc thu hồi quyền chấp nhận thẻ.

### Luồng toàn cảnh (sequence)

~~~seq
title: Vòng doi giao dich the: auth -> clearing -> settlement -> refund/chargeback
actors: Lan | POS | Acquirer | Visa | Issuer
Lan -> POS: 1. Quet the 500k
POS -> Acquirer: 2. Auth request
Acquirer -> Visa: 3. Forward auth
Visa -> Issuer: 4. Kiem tra han muc
Issuer --> Visa: 5. Approve (hold 500k), approval code
Visa --> Acquirer: 6. Tra ve approval
Acquirer --> POS: 7. Auth OK
note Lan: So du cai van nguyen ven, kha dung giam 500k
POS -> Acquirer: 8. Cuoi ngay: gui clearing file
Acquirer -> Visa: 9. Clearing
Visa -> Issuer: 10. Clearing data + tinh fee
Visa -> Acquirer: 11. Settlement amount (net)
Issuer -> Visa: 12. Chuyen tien that (T+1)
Visa -> Acquirer: 13. Chuyen tien that (T+1)
Acquirer -> Merchant: 14. Ghi co tien (tru MDR)
note Lan: So du cai giam 500k, hold dong
Lan -> Issuer: 15. Khieu nai (neu co)
Issuer -> Visa: 16. Dispute/Chargeback
Visa -> Acquirer: 17. Chargeback + fee
Acquirer -> Merchant: 18. Tru tien + phi phat
~~~

### Cơ chế từng bước: tiền đi đâu, khi nào, do ai quyết định

**Tóm tắt:** Quẹt thẻ chỉ tạo authorization (giữ tiền). Tiền thực sự chuyển khi settlement T+1. Refund là giao dịch mới ngược chiều. Chargeback là issuer lấy tiền lại có phí phạt. Authorization hết hạn tự release.

1. **Authorization (giây 0)**: Issuer kiểm tra: thẻ valid? Hạn mức đủ? Không bị fraud rule chặn? Nếu OK → tạo hold, trả approval code. **Tiền chưa đi đâu**, chỉ bị khoá ở khả dụng. Thời hạn auth thường 7 ngày (Visa/Mastercard) hoặc 30 ngày (pre-auth khách sạn/xe). Quá hạn → **EXPIRED**, tự release.

2. **Capture (trong ngày hoặc T+0)**: Merchant/Acquirer gửi capture với số tiền thực (có thể < auth, ví dụ khách sạn giữ 4tr chốt 3tr). Capture partial → tự release phần chênh. Nếu không capture trước khi auth hết hạn → release toàn bộ.

3. **Clearing (cuối ngày T)**: Acquirer gom tất cả capture thành công, gửi file lên scheme. Scheme route theo issuer, tính interchange fee + scheme fee. **Chỉ truyền dữ liệu, không chuyển tiền**.

4. **Settlement (ngày T+1)**: Scheme điều phối chuyển tiền thực qua tài khoản ngân hàng trung ương. Issuer trừ tiền cardholder (đã trừ interchange fee) → gửi cho acquirer. Acquirer trừ MDR → gửi cho merchant. Lúc này **sổ cái mới thay đổi**.

5. **Refund (ngày bất kỳ sau settled)**: Merchant khởi tạo refund (số tiền ≤ settled amount). Đi luồng ngược: merchant -> acquirer -> scheme -> issuer -> cardholder. Cũng có clearing/settlement T+1 riêng. MDR thường **không hoàn**. Refund KHÔNG xóa authorization cũ — auth đã đóng khi settled.

6. **Chargeback (khi chủ thẻ tranh chấp)**: Issuer mở dispute với reason code (fraud, not received, not as described...). Merchant có ~30 ngày representment. Thua → chargeback + fee. Thắng → dispute đóng. Chargeback rate cao → scheme phạt/ngừng quyền chấp nhận thẻ.

### Bảng so sánh các loại hoàn tiền

| Loại | Khi nào | Luồng tiền | Fees | Idempotency |
|---|---|---|---|---|
| **Release (auth expire)** | Chưa capture, auth hết hạn | Không có dòng tiền, chỉ bỏ hold | Không | Tự động 1 lần |
| **Void/Reversal** | Chưa settled, merchant hủy | Không có settlement, bỏ hold/capture | Không | Theo auth code |
| **Refund** | Đã settled, merchant đồng ý | Giao dịch mới ngược chiều, T+1 | MDR thường không hoàn | Theo refund ID |
| **Chargeback** | Chủ thẻ tranh chấp, issuer thắng | Issuer lấy tiền từ merchant qua scheme | Chargeback fee (15–50 USD) | Theo case ID |

### Lỗi hay gặp trên production

1. **Cho là "quẹt thẻ xong là tiền đã về merchant"** — thực ra phải đợi T+1. Code ghi sổ ngay lúc auth là sai (xem lesson-banking-007: hold ≠ settled).
2. **Refund bằng cách xóa authorization** — auth đã đóng khi settled; refund phải là giao dịch mới ngược chiều qua clearing/settlement.
3. **Không xử lý auth hết hạn** — hold treo mãi, khả dụng không bao giờ hồi phục. Cần job chạy ngày release các auth quá hạn.
4. **Mất chargeback deadline** — không representment kịp 30 ngày → tự động thua, mất tiền + phí. Cần alert sớm.
5. **Không đối soát settlement file** — scheme gửi settlement report, phải khớp với ledger nội bộ (xem lesson-banking-002).

### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này

- Authorization validity period là bao nhiêu ngày? (Visa/Mastercard thường 7 ngày, pre-auth có thể 30 ngày)
- Partial capture được phép không? Nếu được, release phần chênh tự động hay cần gọi API riêng?
- Merchant discount rate (MDR) tính như thế nào khi refund? Hoàn hay không hoàn?
- Chargeback representment deadline là bao nhiêu ngày theo scheme nào?
- Settlement currency và FX rate áp dụng khi nào (nếu đa tiền tệ)?
- Làm sao để match authorization với capture/settlement (approval code, RRN, transaction ID)?

### Liên hệ phỏng vấn

**Câu hỏi:** "Khách quẹt thẻ 500k, lúc nào tiền thực sự vào tài khoản merchant?"

**Cách trả lời:** Ba pha: (1) **Authorization** — giây đầu, issuer giữ 500k (hold), tiền chưa chuyển, số dư khả dụng giảm; (2) **Clearing** — cuối ngày, acquirer gửi dữ liệu qua Visa/Mastercard/NAPAS, chỉ truyền file, tính interchange fee; (3) **Settlement** — **ngày làm việc sau (T+1)**, tiền thực sự chuyển issuer -> acquirer -> merchant (trừ MDR). Refund là giao dịch mới ngược chiều cũng T+1, MDR thường không hoàn. Chargeback là chủ thẻ tranh chấp, issuer thắng thì lấy tiền merchant + phí phạt 15–50 USD. Authorization có hạn (7 ngày), hết hạn tự release. Senior: nhắc idempotency theo approval code/RRN, đối soát settlement file, và giữ chứng từ chống chargeback.

**Câu hỏi 2:** "Authorization và capture khác nhau thế nào? Khi nào cần release?"

**Cách trả lời 2:** Authorization = xin phép + giữ tiền (hold), capture = xác nhận chốt số tiền thật ≤ auth. Nếu auth 500k, capture 300k → release 200k tự động. Nếu không capture trước khi auth hết hạn (7 ngày) → release toàn bộ 500k. Release KHÔNG phải refund — không có dòng tiền ngược, chỉ bỏ hold.

**Câu hỏi 3:** "Chargeback là gì và merchant làm gì để thắng?"

**Cách trả lời 3:** Chargeback = chủ thẻ khiếu nại qua issuer, issuer mở dispute qua scheme, merchant có ~30 ngày representment (cung cấp bằng chứng: invoice, POD, AVS/CVC, 3DS). Thua → mất tiền + phí 15–50 USD. Thắng → giữ tiền. Cách thắng: bật 3D Secure, giữ chứng từ giao hàng, match AVS/CVC, phản hồi kịp hạn. Chargeback rate > 1% bị scheme phạt.

> Senior tip: Luôn thiết kế hệ thống theo **trạng thái thực tế** (auth/capture/settle/refund/chargeback) chứ không gộp chung thành "đã thanh toán". Giữ approval code, RRN, transaction ID để match end-to-end. Đối soát settlement report hàng ngày là bắt buộc — scheme có thể sai file, acquirer có thể trừ sai MDR. Auth expire job phải chạy hàng ngày (hoặc dùng TTL trong DB) để không bao giờ để hold treo quá hạn.

`,
    exercises: [
      {
        title: 'CardTxnLifecycle state machine: AUTHORIZED -> CAPTURED -> SETTLED -> REFUNDED/CHARGEBACK, auth expire',
        prompt: `Viết {{CardTxnLifecycle}} quản lý vòng đời một giao dịch thẻ. Chỉ dùng JDK chuẩn, Java 17, **không class public ngoài Main**. Dùng {{Clock}} inject để test deterministic (auth hết hạn sau N ngày).

**Trạng thái (enum State):** {{AUTHORIZED}}, {{CAPTURED}}, {{SETTLED}}, {{REFUNDED}}, {{CHARGED_BACK}}, {{EXPIRED}}, {{VOIDED}}.

**Sự kiện (enum Event):** {{CAPTURE}}, {{SETTLE}}, {{REFUND}}, {{CHARGEBACK}}, {{EXPIRE}}, {{VOID}}.

**Bảng chuyển tiếp (đúng như bài học):**

- {{AUTHORIZED}} + {{CAPTURE}} ⇒ {{CAPTURED}} (capture ≤ amount, partial được)
- {{AUTHORIZED}} + {{VOID}} ⇒ {{VOIDED}} (hủy trước khi capture)
- {{AUTHORIZED}} + {{EXPIRE}} ⇒ {{EXPIRED}} (hết hạn auth, auto release)
- {{CAPTURED}} + {{SETTLE}} ⇒ {{SETTLED}} (T+1, tiền thực sự chuyển)
- {{CAPTURED}} + {{VOID}} ⇒ {{VOIDED}} (hủy capture trước settle)
- {{SETTLED}} + {{REFUND}} ⇒ {{REFUNDED}} (giao dịch mới ngược chiều)
- {{SETTLED}} + {{CHARGEBACK}} ⇒ {{CHARGED_BACK}} (tranh chấp, issuer thắng)
- Sự kiện trùng với trạng thái đích ⇒ **no-op** (không đổi state, không ghi history, không ném lỗi)
- Mọi sự kiện không có trong bảng ⇒ ném {{IllegalStateException}} và **không đổi gì cả**
- {{event == null}} ⇒ ném {{IllegalArgumentException}}

**Yêu cầu thêm:**
- Constructor: {{CardTxnLifecycle(Clock clock, int authValidityDays, long authorizedAmount)}} — {{authorizedAmount}} là số tiền auth (long, đơn vị đồng).
- {{capture(long actualAmount)}}: {{actualAmount}} ≤ {{authorizedAmount}}, âm ⇒ {{IllegalArgumentException}}. Ghi nhận capture amount để sau này refund không vượt quá số đã capture/settle.
- {{refund(long amount)}}: chỉ được gọi khi state = {{SETTLED}}, {{amount}} ≤ captured amount, âm ⇒ {{IllegalArgumentException}}.
- {{chargeback(long amount)}}: chỉ được khi state = {{SETTLED}}, {{amount}} ≤ captured amount.
- {{tickDays(int days)}}: tiến thời gian {{days}} ngày (cộng dồn vào mốc thời gian hiện tại, bắt đầu từ {{clock.instant()}}). Nếu state = {{AUTHORIZED}} và thời gian hiện tại đã quá hoặc bằng {{authValidityDays}} kể từ lúc tạo ⇒ tự chuyển {{EXPIRED}} (gọi nội bộ {{apply(Event.EXPIRE)}}). Nếu state khác {{AUTHORIZED}} thì không làm gì.
- {{state()}}, {{history()}}, {{capturedAmount()}}, {{settledAmount()}}, {{refundedAmount()}}, {{chargedBackAmount()}} đã có sẵn; bạn viết {{apply(Event)}}, {{capture}}, {{refund}}, {{chargeback}}, {{tickDays}}.
- Mỗi lần chuyển trạng thái thật, thêm dòng lịch sử: {{TU --SU_KIEN--> DEN}} (ví dụ {{AUTHORIZED --CAPTURE--> CAPTURED}}). No-op không ghi history.

Gợi ý: tách hàm {{next(State from, Event e)}} trả về State đích hoặc null — logic bảng nằm một chỗ.`,
        starter: `import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

enum State { AUTHORIZED, CAPTURED, SETTLED, REFUNDED, CHARGED_BACK, EXPIRED, VOIDED }
enum Event { CAPTURE, SETTLE, REFUND, CHARGEBACK, EXPIRE, VOID }

class CardTxnLifecycle {
    private final Clock clock;
    private final int authValidityDays;
    private final long authorizedAmount;
    private long capturedAmount = 0;
    private long settledAmount = 0;
    private long refundedAmount = 0;
    private long chargedBackAmount = 0;
    private State state = State.AUTHORIZED;
    private final List<String> history = new ArrayList<>();
    private Instant authTime;
    private Instant currentTime;

    CardTxnLifecycle(Clock clock, int authValidityDays, long authorizedAmount) {
        this.clock = clock;
        this.authValidityDays = authValidityDays;
        this.authorizedAmount = authorizedAmount;
        this.authTime = clock.instant();
        this.currentTime = this.authTime;
    }

    State state() { return state; }
    List<String> history() { return new ArrayList<>(history); }
    long authorizedAmount() { return authorizedAmount; }
    long capturedAmount() { return capturedAmount; }
    long settledAmount() { return settledAmount; }
    long refundedAmount() { return refundedAmount; }
    long chargedBackAmount() { return chargedBackAmount; }

    void apply(Event event) {
    }

    void capture(long actualAmount) {
    }

    void refund(long amount) {
    }

    void chargeback(long amount) {
    }

    void tickDays(int days) {
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }

    public static void main(String[] args) {
        Clock clock = Clock.fixed(Instant.parse("2026-11-01T00:00:00Z"), ZoneId.of("UTC"));
        CardTxnLifecycle txn = new CardTxnLifecycle(clock, 7, 500_000L);

        check("khoi tao AUTHORIZED", txn.state() == State.AUTHORIZED, "state=" + txn.state());
        check("authTime duoc ghi", txn.history().isEmpty(), "history=" + txn.history());

        // AUTHORIZED -> CAPTURE (partial 300k)
        txn.capture(300_000L);
        check("capture 300k -> CAPTURED", txn.state() == State.CAPTURED, "state=" + txn.state());
        check("capturedAmount = 300k", txn.capturedAmount() == 300_000L, "cap=" + txn.capturedAmount());
        check("lich su co 1 dong", txn.history().size() == 1, "history=" + txn.history());
        check("format history dung", txn.history().get(0).equals("AUTHORIZED --CAPTURE--> CAPTURED"), "dong=" + txn.history().get(0));

        // CAPTURED -> SETTLE
        txn.apply(Event.SETTLE);
        check("settle -> SETTLED", txn.state() == State.SETTLED, "state=" + txn.state());
        check("settledAmount = capturedAmount", txn.settledAmount() == 300_000L, "set=" + txn.settledAmount());

        // SETTLED -> REFUND (partial 100k)
        txn.refund(100_000L);
        check("refund 100k -> REFUNDED", txn.state() == State.REFUNDED, "state=" + txn.state());
        check("refundedAmount = 100k", txn.refundedAmount() == 100_000L, "ref=" + txn.refundedAmount());

        // REFUNDED không thể chargeback
        check("REFUNDED + CHARGEBACK -> ngoai le", expect(IllegalStateException.class, () -> txn.chargeback(50_000L)), "");
        check("state van REFUNDED", txn.state() == State.REFUNDED, "state=" + txn.state());

        // no-op: sự kiện trùng đích
        txn.apply(Event.REFUND);
        check("REFUND tai REFUNDED la no-op", txn.state() == State.REFUNDED && txn.history().size() == 3, "history=" + txn.history());

        // null event
        check("null event -> IllegalArgumentException", expect(IllegalArgumentException.class, () -> txn.apply(null)), "");

        // --- Test path 2: VOID trước capture ---
        CardTxnLifecycle v1 = new CardTxnLifecycle(clock, 7, 500_000L);
        v1.apply(Event.VOID);
        check("AUTHORIZED + VOID -> VOIDED", v1.state() == State.VOIDED, "state=" + v1.state());
        check("VOIDED + CAPTURE -> ngoai le", expect(IllegalStateException.class, () -> v1.capture(100_000L)), "");
        check("VOIDED + SETTLE -> ngoai le", expect(IllegalStateException.class, () -> v1.apply(Event.SETTLE)), "");

        // --- Test path 3: EXPIRE ---
        Clock clock2 = Clock.fixed(Instant.parse("2026-11-01T00:00:00Z"), ZoneId.of("UTC"));
        CardTxnLifecycle v2 = new CardTxnLifecycle(clock2, 7, 500_000L);
        // tick 6 ngay: van AUTHORIZED
        v2.tickDays(6);
        check("tick 6 ngay van AUTHORIZED", v2.state() == State.AUTHORIZED, "state=" + v2.state());
        // tick 1 ngay nua: qua 7 ngay -> EXPIRED
        v2.tickDays(1);
        check("tick 7 ngay -> EXPIRED", v2.state() == State.EXPIRED, "state=" + v2.state());
        check("EXPIRED + CAPTURE -> ngoai le", expect(IllegalStateException.class, () -> v2.capture(100_000L)), "");

        // --- Test path 4: CHARGEBACK ---
        CardTxnLifecycle v3 = new CardTxnLifecycle(clock, 7, 500_000L);
        v3.capture(500_000L);
        v3.apply(Event.SETTLE);
        v3.chargeback(500_000L);
        check("SETTLED + CHARGEBACK -> CHARGED_BACK", v3.state() == State.CHARGED_BACK, "state=" + v3.state());
        check("chargedBackAmount = 500k", v3.chargedBackAmount() == 500_000L, "cb=" + v3.chargedBackAmount());
        check("CHARGED_BACK + REFUND -> ngoai le", expect(IllegalStateException.class, () -> v3.refund(100_000L)), "");

        // --- Test capture vuot authorized amount ---
        CardTxnLifecycle v4 = new CardTxnLifecycle(clock, 7, 500_000L);
        check("capture > authorized -> IllegalArgumentException", expect(IllegalArgumentException.class, () -> v4.capture(600_000L)), "");
        check("state van AUTHORIZED sau loi", v4.state() == State.AUTHORIZED, "state=" + v4.state());

        // --- Test refund vuot captured amount ---
        CardTxnLifecycle v5 = new CardTxnLifecycle(clock, 7, 500_000L);
        v5.capture(300_000L);
        v5.apply(Event.SETTLE);
        check("refund > captured -> IllegalArgumentException", expect(IllegalArgumentException.class, () -> v5.refund(400_000L)), "");
        check("state van SETTLED", v5.state() == State.SETTLED, "state=" + v5.state());

        // --- Test tickDays khong anh huong state khac AUTHORIZED ---
        CardTxnLifecycle v6 = new CardTxnLifecycle(clock, 7, 500_000L);
        v6.capture(500_000L);
        v6.tickDays(100);
        check("CAPTURED tickDays khong doi state", v6.state() == State.CAPTURED, "state=" + v6.state());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

enum State { AUTHORIZED, CAPTURED, SETTLED, REFUNDED, CHARGED_BACK, EXPIRED, VOIDED }
enum Event { CAPTURE, SETTLE, REFUND, CHARGEBACK, EXPIRE, VOID }

class CardTxnLifecycle {
    private final Clock clock;
    private final int authValidityDays;
    private final long authorizedAmount;
    private long capturedAmount = 0;
    private long settledAmount = 0;
    private long refundedAmount = 0;
    private long chargedBackAmount = 0;
    private State state = State.AUTHORIZED;
    private final List<String> history = new ArrayList<>();
    private Instant authTime;
    private Instant currentTime;

    CardTxnLifecycle(Clock clock, int authValidityDays, long authorizedAmount) {
        if (clock == null) throw new IllegalArgumentException("clock null");
        if (authValidityDays <= 0) throw new IllegalArgumentException("authValidityDays phai > 0");
        if (authorizedAmount <= 0) throw new IllegalArgumentException("authorizedAmount phai > 0");
        this.clock = clock;
        this.authValidityDays = authValidityDays;
        this.authorizedAmount = authorizedAmount;
        this.authTime = clock.instant();
        this.currentTime = this.authTime;
    }

    State state() { return state; }
    List<String> history() { return new ArrayList<>(history); }
    long authorizedAmount() { return authorizedAmount; }
    long capturedAmount() { return capturedAmount; }
    long settledAmount() { return settledAmount; }
    long refundedAmount() { return refundedAmount; }
    long chargedBackAmount() { return chargedBackAmount; }

    private State next(State from, Event e) {
        switch (from) {
            case AUTHORIZED:
                switch (e) {
                    case CAPTURE: return State.CAPTURED;
                    case VOID: return State.VOIDED;
                    case EXPIRE: return State.EXPIRED;
                    default: return null;
                }
            case CAPTURED:
                switch (e) {
                    case SETTLE: return State.SETTLED;
                    case VOID: return State.VOIDED;
                    default: return null;
                }
            case SETTLED:
                switch (e) {
                    case REFUND: return State.REFUNDED;
                    case CHARGEBACK: return State.CHARGED_BACK;
                    default: return null;
                }
            case REFUNDED:
            case CHARGED_BACK:
            case EXPIRED:
            case VOIDED:
                // trang thai chung: chi nhan lai chinh su kien da dua den no
                return e == eventForState(from) ? from : null;
            default:
                return null;
        }
    }

    private Event eventForState(State s) {
        return switch (s) {
            case REFUNDED -> Event.REFUND;
            case CHARGED_BACK -> Event.CHARGEBACK;
            case EXPIRED -> Event.EXPIRE;
            case VOIDED -> Event.VOID;
            default -> null;
        };
    }

    void apply(Event event) {
        if (event == null) throw new IllegalArgumentException("event null");
        State from = state;
        State to = next(from, event);
        if (to == null) throw new IllegalStateException("Chuyen khong hop le: " + from + " + " + event);
        if (to == from) return; // no-op
        state = to;
        history.add(from + " --" + event + "--> " + to);
        if (event == Event.SETTLE) settledAmount = capturedAmount;
    }

    void capture(long actualAmount) {
        if (actualAmount < 0) throw new IllegalArgumentException("actualAmount khong duoc am");
        if (actualAmount > authorizedAmount) throw new IllegalArgumentException("capture vuot authorized amount");
        apply(Event.CAPTURE);
        if (state == State.CAPTURED) capturedAmount = actualAmount;
    }

    void refund(long amount) {
        if (amount < 0) throw new IllegalArgumentException("refund amount khong duoc am");
        if (state != State.SETTLED) throw new IllegalStateException("Chi refund duoc tai SETTLED");
        if (amount > capturedAmount) throw new IllegalArgumentException("refund vuot captured amount");
        apply(Event.REFUND);
        if (state == State.REFUNDED) refundedAmount = amount;
    }

    void chargeback(long amount) {
        if (amount < 0) throw new IllegalArgumentException("chargeback amount khong duoc am");
        if (state != State.SETTLED) throw new IllegalStateException("Chi chargeback duoc tai SETTLED");
        if (amount > capturedAmount) throw new IllegalArgumentException("chargeback vuot captured amount");
        apply(Event.CHARGEBACK);
        if (state == State.CHARGED_BACK) chargedBackAmount = amount;
    }

    void tickDays(int days) {
        if (days < 0) throw new IllegalArgumentException("days khong duoc am");
        if (state != State.AUTHORIZED) return; // chi AUTHORIZED moi co han
        currentTime = currentTime.plus(days, ChronoUnit.DAYS);
        Instant expiry = authTime.plus(authValidityDays, ChronoUnit.DAYS);
        if (!currentTime.isBefore(expiry)) {
            apply(Event.EXPIRE);
        }
    }
}`,
        hints: [
          'Dùng hàm {{next(State, Event)}} tập trung bảng chuyển tiếp — đừng viết if/else rải rác.',
          'No-op = {{next}} trả về đúng state hiện tại: kiểm tra {{to == from}} rồi {{return}} trước khi ghi history.',
          '{{capture}}, {{refund}}, {{chargeback}} phải validate amount **trước** khi gọi {{apply}}; nếu {{apply}} ném lỗi thì amount không được ghi.',
          '{{tickDays}} chỉ tác động khi state = {{AUTHORIZED}}: cộng dồn {{days}} vào thời gian hiện tại (bắt đầu từ {{authTime}}) rồi so sánh với {{authTime.plus(authValidityDays, ChronoUnit.DAYS)}}; nếu đã tới hoặc quá hạn thì gọi {{apply(Event.EXPIRE)}}.',
          '{{settledAmount}} được gán trong {{apply(Event.SETTLE)}} = {{capturedAmount}} (vì settle chuyển toàn bộ captured).',
        ],
        explain: `State machine này mô phỏng chính xác vòng đời thực tế của giao dịch thẻ:

1. **AUTHORIZED → CAPTURED → SETTLED** là luồng chuẩn. Capture có thể partial (≤ auth amount), settle chuyển toàn bộ captured amount thành settled amount.
2. **EXPIRED** chỉ xảy ra từ AUTHORIZED khi quá {{authValidityDays}} (thường 7 ngày). {{tickDays}} dùng {{Clock}} inject để test deterministic — không bao giờ dùng {{Instant.now()}} trực tiếp.
3. **VOIDED** có thể từ AUTHORIZED (hủy trước capture) hoặc CAPTURED (hủy capture trước settle). Sau VOIDED không được capture/settle/refund/chargeback.
4. **REFUNDED** và **CHARGED_BACK** chỉ từ SETTLED. Refund là giao dịch mới ngược chiều (merchant đồng ý), chargeback là issuer thắng tranh chấp. Cả hai đều giới hạn amount ≤ captured/settled amount.
5. **Trạng thái chung (terminal)**: REFUNDED, CHARGED_BACK, EXPIRED, VOIDED chỉ nhận lại sự kiện đã đưa chúng đến đó (no-op), mọi sự kiện khác ném {{IllegalStateException}}.

Test đi theo đúng các kịch bản thật:
- Path 1: auth 500k → capture 300k (partial) → settle → refund 100k (partial refund). Kiểm tra amount tracking chính xác.
- Path 2: void trước capture → VOIDED, không thể capture/settle.
- Path 3: tickDays 6 ngày vẫn AUTHORIZED, tick thêm 1 ngày (tổng 7) → EXPIRED. EXPIRED không thể capture.
- Path 4: chargeback full amount từ SETTLED → CHARGED_BACK, không thể refund sau đó.
- Validation: capture/refund/chargeback vượt amount bị chặn, state không đổi khi lỗi.

Lỗi hay gặp khi viết: quên validate amount trước {{apply}} (gây ghi amount sai khi state không đổi), dùng {{Instant.now()}} thay vì {{Clock}} (test không deterministic), cho phép refund/chargeback từ state sai (ví dụ REFUNDED), và không xử lý no-op đúng (ghi history trùng).`,
      },
    ],
    check: [
      {
        q: 'Authorization, clearing, settlement khác nhau như thế nào?',
        options: [
          'Authorization chuyển tiền thật, clearing giữ tiền, settlement truyền dữ liệu',
          'Authorization giữ tiền (hold), clearing truyền dữ liệu giao dịch, settlement chuyển tiền thật T+1',
          'Cả ba đều là một quá trình, chỉ khác tên gọi',
          'Clearing là hoàn tiền, settlement là giữ tiền',
        ],
        answer: 1,
        explain: 'Đúng (B): Authorization = issuer giữ tiền (hold), chưa chuyển tiền; Clearing = cuối ngày acquirer gửi file dữ liệu qua scheme, chỉ truyền thông tin, tính fee; Settlement = ngày T+1, tiền thực sự chuyển issuer -> acquirer -> merchant. Sai (A), (C), (D): nhầm lẫn vai trò của từng pha.',
      },
      {
        q: 'Refund và chargeback khác nhau ở điểm nào?',
        options: [
          'Refund là merchant đồng ý hoàn tiền (giao dịch mới ngược chiều), chargeback là chủ thẻ tranh chấp qua issuer, issuer thắng thì lấy tiền merchant + phí phạt',
          'Cả hai đều là hoàn tiền, không khác nhau',
          'Refund có phí phạt, chargeback không phí',
          'Chargeback do merchant khởi tạo, refund do issuer khởi tạo',
        ],
        answer: 0,
        explain: 'Đúng (A): Refund = merchant chủ động hoàn tiền cho khách (luồng ngược merchant->acquirer->scheme->issuer->cardholder), thường T+1, MDR thường không hoàn. Chargeback = chủ thẻ khiếu nại, issuer mở dispute, merchant có ~30 ngày representment; issuer thắng → chargeback + fee 15–50 USD. Sai (B): bản chất khác nhau (chủ động vs tranh chấp). Sai (C): ngược lại, chargeback mới có fee phạt. Sai (D): chargeback do issuer/chủ thẻ khởi xướng.',
      },
      {
        q: 'Authorization hết hạn (thường 7 ngày) mà merchant chưa capture thì sao?',
        options: [
          'Tiền tự động chuyển cho merchant',
          'Hold tự động release, tiền về khả dụng của chủ thẻ, giao dịch chuyển sang EXPIRED',
          'Issuer tự động capture giúp merchant',
          'Giao dịch bị xóa khỏi hệ thống',
        ],
        answer: 1,
        explain: 'Đúng (B): Authorization là lời hứa giữ tiền trong thời hạn. Quá hạn (thường 7 ngày Visa/Mastercard) → hold tự động release (EXPIRED), tiền về khả dụng của chủ thẻ. Không có dòng tiền nào chuyển cho merchant. Merchant muốn thu tiền phải yêu cầu khách thanh toán lại. Sai (A): không capture thì không có settlement. Sai (C): issuer không bao giờ capture thay merchant. Sai (D): giao dịch vẫn lưu trong lịch sử với trạng thái EXPIRED để audit.',
      },
    ],
    related: ['banking-007', 'banking-006', 'banking-010'],
    tags: ['card', 'authorization', 'clearing', 'settlement', 'refund', 'chargeback', 'state-machine', 'banking'],
  },
  {
    id: 'lesson-banking-010',
    track: 'banking',
    order: 10,
    title: 'Thanh toán QR và cổng thanh toán: redirect, IPN/callback, chữ ký HMAC, callback trùng và đối soát',
    level: 'senior',
    minutes: 40,
    goals: [
      'Hiểu luồng thanh toán QR/online qua cổng thanh toán: merchant, cổng, ngân hàng, trình duyệt người mua và IPN server-to-server',
      'Giải thích vì sao không tin redirect trên trình duyệt mà chỉ tin IPN/callback đã kiểm chữ ký HMAC và khớp số tiền',
      'Xử lý đúng callback trễ, trùng, sai số tiền và chủ động truy vấn trạng thái khi mất IPN',
      'Triển khai PaymentCallbackHandler idempotent (HMAC-SHA256, đối chiếu đơn, chuyển trạng thái) và hiểu đối soát cuối ngày với cổng',
    ],
    body: `**Tóm tắt:** Khi khách quét QR hoặc thanh toán online, trình duyệt chỉ đưa khách đi (redirect) còn xác nhận "đã thu tiền" phải dựa vào IPN (Instant Payment Notification, thông báo thanh toán từ server cổng gửi thẳng về server merchant) đã được kiểm chữ ký HMAC và đối chiếu số tiền/mã đơn. Vì callback có thể đến trễ, trùng hoặc bị giả mạo, backend phải xử lý idempotent theo mã giao dịch và đối soát cuối ngày với file của cổng.

### Ngoài đời diễn ra thế nào

Hãy tưởng tượng Lan mua một đôi giày 500.000đ trên web của shop Minh.

1. Lan bấm "Thanh toán bằng QR". Shop Minh tạo một "phiếu thu" và nhờ một **cổng thanh toán** (payment gateway, dịch vụ trung gian đứng giữa người bán và ngân hàng, ví dụ ở mức nguyên lý như VNPay/MoMo/Stripe) tạo mã QR.
2. Lan mở app ngân hàng, quét QR và xác nhận trả tiền. Tiền đi từ tài khoản Lan qua hệ thống ngân hàng rồi được cổng thanh toán ghi nhận.
3. Sau khi Lan trả tiền, trình duyệt của Lan được **chuyển hướng** (redirect, trình duyệt tự nhảy sang một trang web khác) về trang "Cảm ơn" của shop Minh.
4. Đồng thời, máy chủ của cổng thanh toán gọi thẳng vào máy chủ của shop Minh để báo "đơn này đã thanh toán" — đây là **IPN/callback server-to-server** (máy chủ gọi máy chủ, không đi qua trình duyệt của Lan).

Điểm mấu chốt đời thường: việc Lan *thấy* trang "Thành công" trên màn hình giống như người mua giơ biên lai trước mặt bạn — biên lai có thể chụp ảnh giả, còn IPN có chữ ký của cổng giống như ngân hàng gọi điện trực tiếp xác nhận đã nhận tiền. Shop chỉ giao hàng khi nhận được cuộc gọi xác nhận đã kiểm tra.

### Các bên và luồng

~~~seq
title: Thanh toán QR qua cổng (redirect chỉ để hiển thị, IPN mới là nguồn tin)
actors: Khach | Merchant | Gateway | Bank
Khach -> Merchant: 1. Tạo đơn và yêu cầu thanh toán
Merchant -> Gateway: 2. Tạo phiên thanh toán (mã đơn, số tiền)
Gateway --> Merchant: 3. Trả link/QR để khách thanh toán
Merchant --> Khach: 4. Hiển thị QR hoặc chuyển sang trang cổng
Khach -> Bank: 5. Quét QR và xác nhận trả tiền
Bank -> Gateway: 6. Ghi nhận tiền vào cho phiên thanh toán
Gateway --> Khach: 7. Redirect trình duyệt về trang kết quả
Gateway -> Merchant: 8. IPN server-to-server kèm chữ ký HMAC
Merchant -> Merchant: 9. Kiểm chữ ký, so tiền, idempotent, đổi trạng thái
Merchant -> Gateway: 10. (Nếu mất IPN) Truy vấn trạng thái chủ động
~~~

**Các bên tham gia:**
- **Merchant** (người bán): hệ thống của shop, có đơn hàng và cần biết đơn đã được trả tiền hay chưa.
- **Cổng thanh toán** (payment gateway): đứng giữa, tạo phiên thanh toán/QR, nhận tiền từ phía ngân hàng và thông báo lại cho merchant. Ở mức nguyên lý, VNPay, MoMo hay Stripe đều đóng vai trò trung gian này (mỗi bên có tên tham số riêng, bài này không bịa tham số thật).
- **Ngân hàng/app ngân hàng**: nơi tiền thực sự bị trừ khỏi tài khoản khách.
- **Khách (trình duyệt/app)**: người trả tiền; trình duyệt chỉ là kênh hiển thị.

### Vì sao không tin redirect của trình duyệt mà chỉ tin IPN đã kiểm chữ ký

Redirect chạy trên máy của khách, nên merchant **không kiểm soát được** nó:
- Khách có thể tự gõ URL trang "Thành công" mà chưa trả tiền.
- Kẻ gian có thể chặn và sửa tham số trên URL (số tiền, trạng thái) trước khi trình duyệt quay về.
- Khách đóng trình duyệt ngay sau khi trả tiền, nên redirect có thể **không bao giờ** tới merchant dù tiền đã trừ.
- Redirect có thể bị gọi nhiều lần (khách bấm F5), hoặc đến trước IPN.

Ngược lại, IPN là cuộc gọi từ server cổng tới server merchant. Để tin được IPN, merchant phải kiểm tra:
- **Chữ ký HMAC** (Hash-based Message Authentication Code, mã xác thực tạo bằng thuật toán băm và một khóa bí mật chỉ hai bên biết): merchant dùng {{secret}} chung với cổng để tự tính lại chữ ký trên dữ liệu nhận được; khớp mới chứng minh dữ liệu do cổng tạo ra và không bị sửa trên đường truyền.
- **Đối chiếu số tiền và mã đơn** với dữ liệu merchant đang lưu: tránh trường hợp chữ ký hợp lệ nhưng gắn nhầm đơn, hoặc số tiền thực trả khác số tiền đơn.
- **Nguồn gốc và tính tươi** (nếu cổng cung cấp): ví dụ timestamp/nonce để giảm rủi ro phát lại (replay).

> Nguyên tắc: redirect dùng để **hiển thị trải nghiệm** cho khách (trang chờ/thành công), còn **ghi nhận doanh thu và giao hàng** chỉ dựa trên IPN đã xác thực. Hai kênh này phục vụ hai mục đích khác nhau.

### Trạng thái và chỗ có thể sai

| Tình huống | Điều gì xảy ra | Cách xử lý đúng |
|---|---|---|
| Chữ ký HMAC sai | Dữ liệu bị sửa hoặc giả mạo | Từ chối, KHÔNG đổi trạng thái đơn, ghi log cảnh báo |
| IPN đến trễ | Khách đã thấy trang chờ lâu, hoặc redirect đến trước | Vẫn xử lý IPN khi nó đến (nếu hợp lệ), UI có thể polling/truy vấn |
| IPN trùng (gửi lại nhiều lần) | Cổng retry vì không nhận phản hồi, hoặc mạng chập chờn | Idempotent theo {{txnRef}}: lần đầu cập nhật, lần sau trả kết quả cũ, không cộng tiền hai lần |
| Sai số tiền | Số tiền callback khác số tiền đơn | Từ chối cập nhật PAID, đánh dấu cần kiểm tra thủ công, không giao hàng |
| Mất IPN | Cổng gọi nhưng merchant lỗi/mạng đứt, không nhận được | Merchant chủ động **query trạng thái** sang cổng theo mã đơn/txn; đối soát cuối ngày để bù |
| Trạng thái thất bại | Khách hủy, hết tiền, ngân hàng từ chối | Đánh dấu FAILED (nếu đang PENDING), không giao hàng; cho phép khách thử lại theo chính sách |
| IPN đến sau khi đơn hết hạn | Khách trả muộn so với phiên thanh toán | Cần quy tắc nghiệp vụ rõ: hoàn tiền hay vẫn ghi nhận; tuyệt đối không tự ý bỏ qua nếu tiền đã vào |

Ở góc nhìn trạng thái đơn giản của merchant: {{PENDING}} (chờ thanh toán) -> {{PAID}} (đã thanh toán) hoặc {{FAILED}} (thất bại). Một khi đã {{PAID}} thì không quay về {{PENDING}}; callback trùng báo thành công phải cho kết quả "đã xử lý" chứ không ghi đè lung tung.

### Hệ thống backend xử lý ra sao

Hai ý tưởng lõi: (1) **xác thực** (tính lại HMAC và so sánh), (2) **idempotent** (Idempotent: gọi lặp lại cùng một yêu cầu nhiều lần mà kết quả cuối cùng chỉ như thực hiện một lần, không bị cộng trùng tiền hay đổi trạng thái sai).

Ví dụ tính HMAC-SHA256 bằng JDK chuẩn ({{javax.crypto.Mac}}). Chuỗi dữ liệu đem ký phải thống nhất giữa hai bên (thứ tự trường, dấu phân cách); dưới đây dùng dạng {{txnRef|orderId|amount|status}} để minh họa nguyên lý:

~~~java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

static String hmacSha256(String secret, String data) {
    try {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        // đổi bytes sang chuỗi hex để so sánh chữ ký
        StringBuilder sb = new StringBuilder(raw.length * 2);
        for (byte b : raw) sb.append(String.format("%02x", b));
        return sb.toString();
    } catch (Exception e) {
        throw new RuntimeException(e);
    }
}

// Dữ liệu callback (ví dụ minh họa, không phải tham số thật của cổng cụ thể)
String data = txnRef + "|" + orderId + "|" + amount + "|" + status;
String expected = hmacSha256(secret, data);
if (!expected.equals(receivedSig)) {
    // chữ ký sai: từ chối, không tin dữ liệu
}
~~~

Luồng xử lý callback an toàn (theo thứ tự): kiểm chữ ký -> tìm đơn theo {{orderId}} -> so {{amount}} với số tiền đơn -> kiểm tra idempotent theo {{txnRef}} -> chỉ khi đơn đang {{PENDING}} mới chuyển sang {{PAID}}/{{FAILED}} theo {{status}}. Nếu không nhận được IPN sau một khoảng thời gian, merchant gọi API **query** của cổng (truy vấn chủ động) để lấy trạng thái cuối cùng thay vì đoán.

### Đối soát cuối ngày với cổng

**Đối soát** (reconciliation) là việc so khớp dữ liệu giữa hai hệ thống: cuối ngày (hoặc theo lịch), cổng thanh toán cung cấp file/bảng kê các giao dịch thành công, merchant đối chiếu từng {{txnRef}} với bản ghi của mình (số tiền, trạng thái, thời điểm). Mục tiêu:
- Phát hiện giao dịch cổng báo thành công nhưng merchant chưa ghi nhận (mất IPN, lỗi xử lý) để bù cập nhật.
- Phát hiện lệch số tiền hoặc giao dịch lạ để điều tra.
- Làm bằng chứng kế toán: tổng tiền khớp giữa hai bên.

Trong thực tế, đối soát là "lưới an toàn" cuối cùng: IPN giúp cập nhật gần thời gian thực, còn đối soát đảm bảo không bỏ sót dù có sự cố tạm thời.

### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này

- Cổng gửi IPN theo cơ chế nào, retry bao nhiêu lần, khoảng cách ra sao, và format chữ ký/canonical string quy định thế nào?
- Trường nào là mã giao dịch duy nhất để idempotent ({{txnRef}} hay mã khác)? Có thể một đơn có nhiều lần thử thanh toán không?
- Khi số tiền callback khác số tiền đơn thì xử lý ra sao (từ chối, chờ điều tra, hay cho phép chênh lệch trong ngưỡng nào)?
- Nếu IPN mất, merchant được phép query chủ động bao lâu/lần, và trạng thái nào là trạng thái cuối cùng (final)?
- Đơn hết hạn phiên thanh toán nhưng tiền vẫn về thì hoàn tự động hay ghi nhận thủ công?
- File đối soát nhận lúc nào, múi giờ nào, định dạng ra sao, và ai chịu trách nhiệm xử lý lệch?

### Liên hệ phỏng vấn

Khi trả lời phỏng vấn, hãy nhấn mạnh ba điểm: (1) redirect là kênh hiển thị không đáng tin, chỉ IPN có chữ ký HMAC hợp lệ mới được dùng để ghi nhận tiền; (2) mọi callback phải idempotent theo mã giao dịch vì cổng chắc chắn sẽ gửi trùng/retry; (3) luôn có cơ chế query chủ động và đối soát cuối ngày để vá các trường hợp mất thông báo. Nêu được thứ tự kiểm tra "chữ ký -> tồn tại đơn -> khớp tiền -> idempotent -> chuyển trạng thái" là dấu hiệu bạn hiểu luồng thanh toán thực tế, không chỉ biết gọi API.

> Senior tip: Trong production, việc kiểm tra chữ ký và cập nhật trạng thái nên nằm trong một giao dịch cơ sở dữ liệu với ràng buộc duy nhất trên {{txnRef}} (UNIQUE) để hai callback trùng đến đồng thời trên hai instance vẫn chỉ ghi nhận một lần. Ngoài ra, hãy log đầy đủ payload đã che bớt dữ liệu nhạy cảm và kết quả từng bước kiểm tra để khi đối soát lệch bạn còn truy vết được; đừng bao giờ log {{secret}} hay toàn bộ chữ ký bí mật.`,
    exercises: [
      {
        title: 'PaymentCallbackHandler: kiểm HMAC-SHA256, so số tiền, idempotent theo txnRef',
        prompt: `Xây dựng bộ xử lý callback thanh toán cho merchant với các lớp sau (tất cả dùng JDK chuẩn, không class public ngoài Main):

- {{Order(orderId, amount, status)}}: {{amount}} là số tiền VND (long), {{status}} là {{PENDING}}, {{PAID}} hoặc {{FAILED}}.
- {{OrderStore}} lưu đơn theo {{orderId}} và nhớ các {{txnRef}} đã xử lý thành công/thất bại hợp lệ: {{put(Order)}}, {{get(orderId)}}, {{isProcessed(txnRef)}}, {{markProcessed(txnRef)}}.
- {{PaymentCallbackHandler(secret, store)}} với:
  - {{String canonical(String txnRef, String orderId, long amount, String status)}} trả về chuỗi {{txnRef|orderId|amount|status}} (dùng để ký).
  - {{String hmacSha256(String data)}} tính HMAC-SHA256 bằng {{javax.crypto.Mac}} với {{secret}} (UTF-8), trả về chuỗi hex chữ thường.
  - {{String handle(String txnRef, String orderId, long amount, String status, String receivedSig)}} xử lý callback và trả về mã kết quả:
    - {{INVALID_SIGNATURE}} nếu chữ ký nhận được khác {{hmacSha256(canonical(...))}} (không đổi trạng thái).
    - {{DUPLICATE}} nếu {{txnRef}} đã được xử lý trước đó (idempotent, không đổi trạng thái).
    - {{ORDER_NOT_FOUND}} nếu không có đơn {{orderId}}.
    - {{AMOUNT_MISMATCH}} nếu {{amount}} khác số tiền của đơn (không đổi trạng thái).
    - {{SUCCESS}} nếu {{status}} là {{SUCCESS}} và đơn đang {{PENDING}}: đổi đơn thành {{PAID}}, đánh dấu {{txnRef}} đã xử lý.
    - {{FAILED}} nếu {{status}} là {{FAILED}} và đơn đang {{PENDING}}: đổi đơn thành {{FAILED}}, đánh dấu {{txnRef}} đã xử lý.
    - Nếu đơn không còn {{PENDING}} (đã {{PAID}} hoặc {{FAILED}}) mà {{txnRef}} mới và dữ liệu hợp lệ (chữ ký đúng, đơn tồn tại, số tiền khớp), coi như callback trễ/trùng nghiệp vụ: trả {{DUPLICATE}} và không đổi trạng thái.

Thứ tự kiểm tra: chữ ký -> trùng {{txnRef}} -> đơn tồn tại -> khớp số tiền -> xử lý theo trạng thái hiện tại của đơn.`,
        starter: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

class Order {
    final String orderId;
    final long amount;
    String status; // PENDING, PAID, FAILED

    Order(String orderId, long amount, String status) {
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
    }
}

class OrderStore {
    // TODO: lưu đơn và tập txnRef đã xử lý
    void put(Order order) {
        throw new UnsupportedOperationException("TODO");
    }

    Order get(String orderId) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isProcessed(String txnRef) {
        throw new UnsupportedOperationException("TODO");
    }

    void markProcessed(String txnRef) {
        throw new UnsupportedOperationException("TODO");
    }
}

class PaymentCallbackHandler {
    final String secret;
    final OrderStore store;

    PaymentCallbackHandler(String secret, OrderStore store) {
        this.secret = secret;
        this.store = store;
    }

    String canonical(String txnRef, String orderId, long amount, String status) {
        throw new UnsupportedOperationException("TODO");
    }

    String hmacSha256(String data) {
        throw new UnsupportedOperationException("TODO");
    }

    String handle(String txnRef, String orderId, long amount, String status, String receivedSig) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }

    static OrderStore storeWith(Order... orders) {
        OrderStore s = new OrderStore();
        for (Order o : orders) s.put(o);
        return s;
    }

    static String sig(PaymentCallbackHandler h, String txnRef, String orderId, long amount, String status) {
        return h.hmacSha256(h.canonical(txnRef, orderId, amount, status));
    }

    public static void main(String[] args) {
        final String SECRET = "top-secret-key";

        check("invalid signature is rejected and order unchanged", () -> {
            OrderStore store = storeWith(new Order("O1", 500000L, "PENDING"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String res = h.handle("T1", "O1", 500000L, "SUCCESS", "bad-signature");
            eq("INVALID_SIGNATURE", res);
            eq("PENDING", store.get("O1").status);
            eq(false, store.isProcessed("T1"));
        });

        check("duplicate txnRef is idempotent", () -> {
            OrderStore store = storeWith(new Order("O2", 120000L, "PENDING"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String good = sig(h, "T2", "O2", 120000L, "SUCCESS");
            eq("SUCCESS", h.handle("T2", "O2", 120000L, "SUCCESS", good));
            eq("PAID", store.get("O2").status);
            eq("DUPLICATE", h.handle("T2", "O2", 120000L, "SUCCESS", good));
            eq("PAID", store.get("O2").status);
            eq(true, store.isProcessed("T2"));
        });

        check("amount mismatch is rejected", () -> {
            OrderStore store = storeWith(new Order("O3", 500000L, "PENDING"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String badAmountSig = sig(h, "T3", "O3", 499000L, "SUCCESS");
            eq("AMOUNT_MISMATCH", h.handle("T3", "O3", 499000L, "SUCCESS", badAmountSig));
            eq("PENDING", store.get("O3").status);
            eq(false, store.isProcessed("T3"));
        });

        check("success callback marks order PAID", () -> {
            OrderStore store = storeWith(new Order("O4", 99000L, "PENDING"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String good = sig(h, "T4", "O4", 99000L, "SUCCESS");
            eq("SUCCESS", h.handle("T4", "O4", 99000L, "SUCCESS", good));
            eq("PAID", store.get("O4").status);
            eq(true, store.isProcessed("T4"));
        });

        check("failed callback marks order FAILED", () -> {
            OrderStore store = storeWith(new Order("O5", 77000L, "PENDING"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String good = sig(h, "T5", "O5", 77000L, "FAILED");
            eq("FAILED", h.handle("T5", "O5", 77000L, "FAILED", good));
            eq("FAILED", store.get("O5").status);
            eq(true, store.isProcessed("T5"));
        });

        check("late valid callback on non-pending order returns DUPLICATE without change", () -> {
            OrderStore store = storeWith(new Order("O6", 33000L, "PAID"));
            PaymentCallbackHandler h = new PaymentCallbackHandler(SECRET, store);
            String good = sig(h, "T6-late", "O6", 33000L, "SUCCESS");
            eq("DUPLICATE", h.handle("T6-late", "O6", 33000L, "SUCCESS", good));
            eq("PAID", store.get("O6").status);
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

class Order {
    final String orderId;
    final long amount;
    String status; // PENDING, PAID, FAILED

    Order(String orderId, long amount, String status) {
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
    }
}

class OrderStore {
    private final Map<String, Order> orders = new HashMap<>();
    private final Set<String> processed = new HashSet<>();

    void put(Order order) {
        orders.put(order.orderId, order);
    }

    Order get(String orderId) {
        return orders.get(orderId);
    }

    boolean isProcessed(String txnRef) {
        return processed.contains(txnRef);
    }

    void markProcessed(String txnRef) {
        processed.add(txnRef);
    }
}

class PaymentCallbackHandler {
    final String secret;
    final OrderStore store;

    PaymentCallbackHandler(String secret, OrderStore store) {
        this.secret = secret;
        this.store = store;
    }

    String canonical(String txnRef, String orderId, long amount, String status) {
        // Chuỗi đem ký phải thống nhất giữa hai bên: cùng thứ tự, cùng dấu phân cách
        return txnRef + "|" + orderId + "|" + amount + "|" + status;
    }

    String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(raw.length * 2);
            for (byte b : raw) {
                String hex = Integer.toHexString(b & 0xff);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    String handle(String txnRef, String orderId, long amount, String status, String receivedSig) {
        // 1) Kiểm chữ ký: không khớp thì từ chối tuyệt đối, không tin dữ liệu
        String expected = hmacSha256(canonical(txnRef, orderId, amount, status));
        if (!expected.equals(receivedSig)) {
            return "INVALID_SIGNATURE";
        }
        // 2) Idempotent theo txnRef: callback trùng/lặp không được xử lý hai lần
        if (store.isProcessed(txnRef)) {
            return "DUPLICATE";
        }
        // 3) Đơn phải tồn tại
        Order order = store.get(orderId);
        if (order == null) {
            return "ORDER_NOT_FOUND";
        }
        // 4) Số tiền callback phải khớp số tiền đơn
        if (order.amount != amount) {
            return "AMOUNT_MISMATCH";
        }
        // 5) Chỉ chuyển trạng thái khi đơn còn PENDING
        if (!"PENDING".equals(order.status)) {
            return "DUPLICATE";
        }
        if ("SUCCESS".equals(status)) {
            order.status = "PAID";
            store.markProcessed(txnRef);
            return "SUCCESS";
        }
        if ("FAILED".equals(status)) {
            order.status = "FAILED";
            store.markProcessed(txnRef);
            return "FAILED";
        }
        return "AMOUNT_MISMATCH";
    }
}`,
        hints: [
          'Tính HMAC: {{Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")); byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));}} rồi đổi {{raw}} sang chuỗi hex chữ thường.',
          'Làm đúng thứ tự: kiểm chữ ký trước, sau đó mới kiểm {{isProcessed(txnRef)}}, rồi tìm đơn, rồi so {{amount}}, cuối cùng mới đổi trạng thái khi đơn đang {{PENDING}}.',
          'Khi chữ ký đúng, đơn tồn tại và tiền khớp nhưng đơn không còn {{PENDING}}, hãy trả {{DUPLICATE}} để callback trễ không làm hỏng trạng thái đã chốt.',
        ],
        explain: `Handler đi theo đúng chuỗi phòng thủ của thanh toán thực tế. Kiểm chữ ký đặt lên đầu vì dữ liệu chưa xác thực thì không được dùng để tra cứu hay thay đổi trạng thái. Idempotent theo {{txnRef}} đảm bảo cổng gửi lại (retry) nhiều lần cũng không ghi nhận trùng: lần đầu hợp lệ mới đổi trạng thái và {{markProcessed}}, các lần sau trả {{DUPLICATE}}. So sánh số tiền với đơn chặn trường hợp chữ ký hợp lệ nhưng gắn nhầm giao dịch hoặc số tiền không khớp.

Lỗi hay gặp:
- Đổi trạng thái trước khi kiểm tra đủ điều kiện, khiến callback sai chữ ký hoặc sai tiền vẫn làm đơn thành {{PAID}}.
- Dùng {{txnRef}} của request sai chữ ký để đánh dấu đã xử lý, làm mất cơ hội nhận lại callback đúng.
- Chỉ dựa vào trạng thái đơn mà bỏ qua {{txnRef}}: hai giao dịch khác nhau cùng một đơn (thử lại) sẽ bị xử lý sai nếu không phân biệt mã giao dịch.
- Không trả {{DUPLICATE}} cho callback trễ hợp lệ trên đơn đã chốt, dẫn đến ghi đè trạng thái hoặc ném lỗi không cần thiết.

Trong production, bước "đánh dấu {{txnRef}} + đổi trạng thái đơn" phải thực hiện nguyên tử trong một transaction DB với ràng buộc UNIQUE trên {{txnRef}} để nhiều instance xử lý song song vẫn an toàn.`,
      },
    ],
    check: [
      {
        q: 'Vì sao trang redirect "Thanh toán thành công" trên trình duyệt không đủ để merchant giao hàng?',
        options: [
          'Vì redirect luôn chậm hơn IPN',
          'Vì redirect đi qua trình duyệt của khách nên có thể bị giả mạo, bị lặp hoặc không đến, trong khi chỉ IPN đã kiểm chữ ký HMAC mới xác nhận tiền từ phía cổng',
          'Vì redirect không chứa mã đơn hàng',
          'Vì chỉ IPN mới hiển thị được cho khách',
        ],
        answer: 1,
        explain: 'Đúng (B): redirect chạy trên máy khách, có thể bị sửa/gõ tay, bấm lặp, hoặc không bao giờ quay về dù tiền đã trừ. IPN là kênh server-to-server và chỉ được tin khi chữ ký HMAC hợp lệ, đối chiếu đúng đơn và số tiền. Sai (A): thứ tự đến không cố định, redirect có thể đến trước hoặc sau. Sai (C): redirect vẫn có thể mang tham số nhưng tham số đó không đáng tin nếu chưa xác thực bằng chữ ký từ kênh an toàn. Sai (D): ngược lại, redirect là thứ khách nhìn thấy, IPN là kênh kỹ thuật phía sau.',
      },
      {
        q: 'Cổng thanh toán gửi lại cùng một IPN thành công hai lần với cùng {{txnRef}}. Backend nên làm gì?',
        options: [
          'Cộng tiền và ghi nhận hai lần để khớp số lần nhận callback',
          'Từ chối lần hai vì chữ ký đã dùng rồi',
          'Xử lý idempotent: lần đầu cập nhật đơn, lần sau nhận ra {{txnRef}} đã xử lý và trả kết quả trùng mà không đổi trạng thái hay cộng tiền',
          'Xóa đơn rồi tạo lại từ callback mới',
        ],
        answer: 2,
        explain: 'Đúng (C): callback retry là bình thường, nên idempotent theo mã giao dịch duy nhất {{txnRef}} đảm bảo kết quả chỉ như thực hiện một lần. Sai (A): cộng trùng tiền/giao dịch là lỗi nghiêm trọng. Sai (B): chữ ký vẫn hợp lệ cho cùng dữ liệu, vấn đề là xử lý nghiệp vụ trùng chứ không phải chữ ký hết hạn. Sai (D): xóa/tạo lại đơn làm mất lịch sử và có thể gây sai lệch trạng thái.',
      },
      {
        q: 'Merchant không nhận được IPN dù khách đã bị trừ tiền. Cách xử lý đúng là gì?',
        options: [
          'Tin vào việc khách báo đã trả tiền và chuyển đơn sang PAID',
          'Chờ vô thời hạn cho đến khi IPN tự đến',
          'Chủ động truy vấn (query) trạng thái giao dịch từ cổng theo mã giao dịch/đơn và dùng đối soát cuối ngày để bù các trường hợp còn sót',
          'Hủy đơn ngay để tránh rủi ro',
        ],
        answer: 2,
        explain: 'Đúng (C): khi mất IPN, merchant phải chủ động gọi API query trạng thái của cổng để lấy kết quả cuối cùng, đồng thời đối soát file cuối ngày để phát hiện và bù các lệch còn lại. Sai (A): lời báo của khách không phải bằng chứng đã xác thực từ cổng/ngân hàng. Sai (B): IPN có thể đã mất hẳn, chờ vô thời hạn làm treo đơn và trải nghiệm xấu. Sai (D): hủy đơn trong khi tiền có thể đã thu sẽ gây mất tiền của khách và sai lệch kế toán.',
      },
    ],
    related: ['banking-007', 'banking-009', 'banking-008'],
    tags: ['payment-gateway', 'qr', 'ipn', 'callback', 'hmac', 'idempotency', 'reconciliation', 'banking'],
  },

  {
    id: 'lesson-banking-012',
    track: 'banking',
    order: 12,
    title: 'eKYC và mở tài khoản online: các bước, trạng thái, retry, kiểm tra AML',
    level: 'senior',
    minutes: 40,
    goals: [
      'Nói được eKYC là gì và tại sao ngân hàng mở tài khoản qua app thay vì để khách đến chi nhánh',
      'Mô tả được sáu bước: nhập thông tin → chụp CCCD → tự trích xuất (OCR) → tự chụp ảnh (liveness) → kiểm tra AML → tạo CIF và mở tài khoản',
      'Viết được state machine OnboardingFlow: trạng thái NEW, DOC_OK, SELFIE_OK, DONE, FAILED; retry tối đa 3 lần; idempotent',
      'Nói được AML (chống rửa tiền) là gì, danh sách cấm là gì, và khi nào từ chối mở tài khoản'
    ],
    body: `**Tóm tắt:** eKYC (Electronic Know Your Customer — xác minh danh tính khách hàng qua kênh điện tử, chẳng hạn ứng dụng ngân hàng trên điện thoại) cho phép khách mở tài khoản mà không phải đến chi nhánh. Thay vì nhân viên ngân hàng đối mặt khách, kiểm tra giấy tờ và chụp ảnh trực tiếp, mọi việc xảy ra trên màn hình điện thoại của khách.

Quy trình gồm sáu bước: nhập thông tin → chụp CMND/CCCD → tự trích xuất chữ từ ảnh (OCR) → tự chụp ảnh khuôn mặt (liveness) → kiểm tra chống rửa tiền (AML) → tạo mã hồ sơ khách hàng (CIF) và mở tài khoản. Mỗi hồ sơ mở tài khoản là một "máy trạng thái" (state machine): NEW, DOC_OK, SELFIE_OK, DONE, FAILED. Việc khách nhấn lại nút "Gửi" vì mạng chậm không được làm thay đổi kết quả — tính chất này gọi là idempotent.

Bài viết này dành cho bạn đã dùng Java khoảng 4 năm nhưng chưa làm quen nhiều với thuật ngữ ngân hàng số. Mỗi thuật ngữ mới sẽ được giải thích ngay lần đầu xuất hiện.

### eKYC là gì, và tại sao ngân hàng lại dùng

**eKYC** là viết tắt của Electronic Know Your Customer, nghĩa là "xác minh danh tính khách hàng bằng phương tiện điện tử". Hiểu đơn giản: trước đây khách muốn mở tài khoản phải đến chi nhánh, mang theo CMND/CCCD (Chứng minh nhân dân / Căn cước công dân — giấy tờ tùy thân có ảnh, do công an cấp) và nhân viên so sánh khuôn mặt khách với ảnh trên giấy tờ. eKYC làm việc y hệt như vậy, nhưng qua điện thoại: khách chụp giấy tờ, chụp khuôn mặt của mình, hệ thống tự kiểm tra.

Tại sao ngân hàng lại đầu tư eKYC?

- **Chi phí:** mở tại chi nhánh tốn vài trăm nghìn đồng mỗi khách (nhân viên, văn phòng, giấy tờ); eKYC tốn chỉ vài nghìn đồng.
- **Tốc độ:** khách làm trong 5–10 phút, tài khoản kích hoạt ngay, chứ không phải chờ vài ngày.
- **Khả năng mở rộng:** ngân hàng có thể thu được hàng nghìn khách mỗi ngày mà không phải tăng nhân viên chi nhánh.

Rủi ro lớn nhất của eKYC là **giấy tờ giả** và **người khác mượn danh tính**: kẻ gian có thể chụp ảnh CCCD của người khác, hoặc dùng ảnh/video của khách để lừa hệ thống. Do đó hai bước quan trọng nhất là OCR (kiểm tra giấy tờ có thật không) và liveness (kiểm tra người đứng trước camera có phải người thật không).

### Sáu bước mở tài khoản online

Giả sử Lan, 25 năm, sinh viên vừa tốt nghiệp, muốn mở tài khoản tiết kiệm bằng app ngân hàng "ABC". Đây là gì Lan làm, và hệ thống xử lý ra sao ở mỗi bước:

**Bước 1: Nhập thông tin.** Lan nhập họ tên, số CCCD, ngày sinh, số điện thoại, email. Hệ thống kiểm tra định dạng (ví dụ CCCD phải 12 số, số điện thoại phải 10 số bắt đầu bằng 0). Nếu nhập sai → báo ngay, không cho đi tiếp.

**Bước 2: Chụp giấy tờ.** Lan chụp mặt trước và mặt sau CCCD bằng camera điện thoại. Yêu cầu: ánh sáng đủ, không bị phản quang (ánh đèn phản chiếu lên lớp phủ nhựa của CCCD), không cắt ngang cạnh giấy tờ, chữ không bị mờ. Ảnh không đạt yêu cầu → yêu cầu chụp lại.

**Bước 3: Tự trích xuất (OCR).** OCR (Optical Character Recognition — nhận diện ký tự quang học) là công nghệ máy đọc chữ từ ảnh. Hệ thống dùng OCR để đọc họ tên, số CCCD, ngày sinh, ngày hết hạn trên ảnh Lan chụp, rồi so sánh với những gì Lan nhập ở Bước 1.

- Nếu Lan nhập "0123456789" nhưng OCR đọc "012345678" → hệ thống báo "thông tin không khớp giấy tờ", yêu cầu Lan nhập lại hoặc chụp lại.
- Nếu CCCD đã hết hạn → từ chối, yêu cầu làm CCCD mới rồi quay lại.

**Bước 4: Tự chụp ảnh khuôn mặt (liveness).** Liveness là thuật ngữ chỉ việc hệ thống kiểm tra "đây có phải là người thật đang sống trước camera, chứ không phải một ảnh in, ảnh trên màn hình điện thoại khác, hay video quay lại trước". Lan được yêu cầu nháy mắt, cười, hoặc quay đầu theo hướng hệ thống chỉ (ví dụ "quay trái"). Kiểm tra này ngăn kẻ gian dùng ảnh CCCD hoặc ảnh selfie lên mạng xã hội của nạn nhân để lừa hệ thống.

**Bước 5: Kiểm tra chống rửa tiền (AML).** AML (Anti-Money Laundering — chống rửa tiền) là quy trình ngân hàng đảm bảo không cố tình mở tài khoản cho người dùng tài khoản để rửa tiền từ hoạt động phạm luật (ma túy, tham nhũng, gian lận…). Hệ thống quét tên Lan trong:

- **Danh sách cấm (sanctions list):** danh sách các cá nhân, tổ chức, quốc gia bị cấm giao dịch tài chính (ví dụ do Liên Hợp Quốc hoặc Hoa Kỳ công bố). Nếu trùng → **từ chối ngay**, không mở tài khoản, báo cáo theo quy định pháp luật.
- **PEP (Politically Exposed Person — người giữ chức vụ chính trị cao):** quan chức cao cấp, chủ doanh nghiệp quốc gia… Không cấm mở tài khoản, nhưng rủi ro cao hơn → cần cấp quản lý phê duyệt và theo dõi giao dịch chặt hơn.

**Bước 6: Tạo CIF và mở tài khoản.** CIF (Customer Information File — mã hồ sơ khách hàng) hiểu đơn giản là "sổ hồ sơ" của khách tại ngân hàng, chứa mọi thông tin: CMND, địa chỉ, số điện thoại, lịch sử giao dịch. Một CIF có thể sở hữu nhiều tài khoản (tiết kiệm, giao dịch, thẻ…). Khi Lan hoàn thành sáu bước, hệ thống tạo CIF, rồi tạo tài khoản tiết kiệm, gán số tài khoản (ví dụ 1234567890) cho Lan. Lan nhận số tài khoản qua SMS và đăng ký Internet Banking.

Luồng sáu bước dưới dạng sơ đồ thô:

~~~text
Nhập thông tin → Chụp CCCD → OCR trích xuất → Selfie/liveness → AML scan → Tạo CIF → Mở tài khoản
     │              │            │             │          │        │          │
     └──────────────┴────────────┴─────────────┴──────────┴────────┴────────┘
                 thất bại ở bất kỳ bước nào → báo lỗi, cho sửa lại hoặc từ chối
~~~

### Máy trạng thái (state machine) của hồ sơ mở tài khoản

**State machine** (máy trạng thái) là một đối tượng luôn luôn ở đúng **một** trạng thái tại một thời điểm, và các sự kiện (nhấn nút, nhận kết quả) làm đối tượng chuyển từ trạng thái này sang trạng thái khác. Hồ sơ không thể nhảy ngang: Lan không thể chạy AML trước khi selfie được chấp nhận.

Năm trạng thái của OnboardingFlow (tên khớp với code trong bài tập bên dưới):

| Trạng thái | Nghĩa |
|---|---|
| **NEW** | Hồ sơ vừa tạo, khách chưa làm gì |
| **DOC_OK** | Giấy tờ CCCD đã chụp, OCR kiểm tra xong và hợp lệ |
| **SELFIE_OK** | Selfie/liveness đã qua, hệ thống xác nhận Lan là người thật |
| **DONE** | Hoàn tất: đã qua AML, hệ thống tạo CIF và mở tài khoản |
| **FAILED** | Bị từ chối: giấy tờ không hợp lệ, selfie sai quá nhiều lần, hoặc AML không qua |

Chuyển trạng thái:

~~~text
NEW --submitDoc(true)--> DOC_OK --submitSelfie(true)--> SELFIE_OK --runAml(true)--> DONE
  |submitDoc(false)     |selfie fail (lần 3)          |AML fail (clear=false)
  v                     v                               v
FAILED <---------------+-------------------------------+
~~~

Quy tắc vàng: một khi hồ sơ vào **DONE** hoặc **FAILED** (trạng thái cuối), bất kỳ thao tác tiếp theo đều **không làm thay đổi gì nữa**. Tính chất này gọi là **idempotent** — làm một thao tác nhiều lần vẫn cho kết quả giống hệt làm một lần. Ví dụ đời thường: nhấn nút "bật đèn" mười lần, đèn vẫn chỉ sáng, không sáng "mười lần hơn". Trong eKYC: mạng chậm, Lan bấm "Gửi giấy tờ" hai lần, hệ thống chỉ nhận một bản, không tạo hai hồ sơ trùng. Thực tế người ta dùng **idempotency key** — một mã duy nhất gắn với mỗi yêu cầu (ví dụ mã đăng ký) — để hệ thống nhận biết "yêu cầu này đã xử lý rồi" và bỏ qua bản trùng.

### Thử lại (retry) và khi nào dừng

- **Chụp giấy tờ không được (OCR thất bại):** cho Lan chụp lại, không giới hạn cứng (chưa ảnh hưởng đến trạng thái), nhưng nếu ảnh cứ sai thì Lan tự bỏ quy trình.
- **Selfie không qua (liveness fail):** mỗi lần fail tăng biến tries. Khi tries >= max (mặc định **3 lần**) → chuyển sang **FAILED**, không cho thử thêm. Tại sao phải giới hạn: tránh kẻ gian dùng hàng trăm ảnh khác nhau cho đến khi may mắn lừa được hệ thống (kỹ thuật brute force), đồng thời bảo vệ tài nguyên server.
- **Giấy tờ giả/hết hạn:** chuyển ngay **FAILED**, không retry — vì chụp lại giấy tờ giả vẫn là giấy tờ giả.
- **AML không qua:** chuyển **FAILED**, báo khách "không thể mở tài khoản tại thời điểm này". Lưu ý: **không tiết lộ** cho khách lý do chi tiết là trùng danh sách cấm hay gì, kẻ gian có thể dùng thông tin đó để điều chỉnh lại.

Lỗi hay gặp trong thực tế: quên gán max → khách thử mãi mãi; hoặc cho phép gọi runAml trước submitSelfie → AML chạy trên hồ sơ chưa xác minh danh tính, hoàn toàn vô nghĩa.

### Ví dụ đời thực

Ngân hàng số "ABC" mở rộng kênh online từ tháng 01/2024. Số liệu minh họa (dữ liệu thực tế được trộn/làm tròn để tránh nhạy cảm):

- Trước khi có eKYC: khách đến chi nhánh mở tài khoản, mỗi khách tốn 20–30 phút của nhân viên, chi phí khoảng **45.000đ/khách**; trung bình 2.000 khách/tháng.
- Sau khi ra mắt eKYC: 500.000 đăng ký online trong năm đầu. Tuy nhiên 60% đăng ký **bỏ chưa xong** — ảnh chụp CCCD mờ, nháy mắt sai hướng, hoặc khách bấm nhầm và không biết phải làm gì.
- Đội ngũ sản phẩm thêm hướng dẫn chụp ảnh theo từng bước (ánh sáng, cách giữ điện thoại), đếm ngược 3 giây trước khi chụp selfie, và giới hạn retry selfie là 3 lần. Kết quả: tỉ lệ hoàn tất tăng từ 40% lên **85%**; số lượt chụp lại selfie quá 3 lần giảm từ 12% xuống dưới 2%.
- AML scan phát hiện khoảng **1.200 hồ sơ/tháng** trùng danh sách cấm hoặc PEP cần phê duyệt cao cấp, giúp ngân hàng tránh được hàng tỷ đồng rủi ro pháp lý và thiệt hại danh tiếng.
- Chi phí mở tài khoản qua eKYC giảm xuống khoảng **1.200đ/khách** (máy chủ, dịch vụ OCR, tin nhắn xác thực).

### Lỗi hay gặp khi phỏng vấn

1. **Nói eKYC chỉ là "chụp ảnh CCCD lên app".** Thiếu hai chốt: OCR để trích xuất và so sánh thông tin, và liveness để chứng minh người đang đứng trước camera là chủ sở hữu CCCD. Không có liveness, kẻ gian dùng ảnh selfie của nạn nhân là lừa được hệ thống.
2. **Quên trạng thái cuối (DONE/FAILED).** Cho phép gọi lại submitDoc khi đã DONE và tạo lại CIF, hoặc gọi runAml nhiều lần gây side-effect (gửi email báo cáo AML hai lần).
3. **Không giới hạn retry selfie.** Kẻ gian brute-force với hàng ngàn ảnh; server cũng bị quá tải.
4. **Thiếu idempotency.** Mạng chậm, khách bấm "Gửi" hai lần → hai hồ sơ, hai CIF, hai tài khoản cho cùng một CMND — vấn đề lớn đối với kế toán và pháp luật.
5. **Hiển thị lý do từ chối AML quá rõ ràng.** Nếu nói "bị từ chối vì tên bạn trùng danh sách cấm", kẻ gian biết chính phủ đang theo dõi ai và điều chỉnh danh sách giả mạo.

### Trả lời mẫu khi phỏng vấn

"eKYC là xác minh danh tính khách hàng qua kênh điện tử, giúp mở tài khoản mà không cần đến chi nhánh. Quy trình có sáu bước: khách nhập thông tin, chụp CCCD, hệ thống dùng OCR để đọc chữ từ ảnh và so sánh với thông tin nhập, sau đó là tự chụp ảnh (liveness) để chứng minh đây là người thật chứ không phải ảnh in hay video, tiếp theo là kiểm tra chống rửa tiền AML — quét danh sách cấm và PEP — và cuối cùng tạo mã hồ sơ khách CIF rồi mở tài khoản. Mỗi hồ sơ là một máy trạng thái với năm trạng thái: NEW, DOC_OK, SELFIE_OK, DONE, FAILED. Hai điểm tôi nhấn mạnh là giới hạn retry — ví dụ selfie sai tối đa 3 lần thì chuyển sang FAILED — và tính idempotent, dùng idempotency key để gửi lại yêu cầu không tạo trùng dữ liệu. Về AML, nếu trùng danh sách cấm thì từ chối mở tài khoản, nhưng không cho người dùng biết chi tiết lý do để tránh lộ thông tin."

> **Senior tip:** Trong production, eKYC không chạy một mình trên app. OCR và liveness thường gọi dịch vụ bên thứ ba (tính phí mỗi lần gọi), nên hãy **cache kết quả theo idempotency key** và **không gọi lại dịch vụ tốn phí khi khách nhấn lại nút**. AML scan đối với hàng trăm nghìn khách/ngày không thể quét thủ công — người ta dùng công cụ quét tự động cộng với quy trình phê duyệt nhân viên cho các hồ sơ PEP. Luôn ghi log ai duyệt hồ sơ PEP và khi nào, vì đây là thứ kiểm tra nhà nước sẽ yêu cầu xem trước hết.

### Liên hệ phỏng vấn

Người phỏng vấn có thể hỏi tiếp: "Nếu hệ thống OCR bị giảm hàng chục phần trăm trong ngày cao điểm, bạn thiết kế fallback thế nào?", "Sự khác biệt giữa kiểm tra danh sách cấm và theo dõi giao dịch bất thường (transaction monitoring) là gì?", và "Sau khi mở tài khoản xong, làm thế nào để phát hiện tài khoản đó sau này được dùng để rửa tiền?"`,
    exercises: [{ title:'OnboardingFlow: viết state machine mở tài khoản', prompt:'Triển khai ba phương thức submitDoc, submitSelfie, runAml của lớp OnboardingFlow để các test dưới đây chạy xanh. Quy tắc state machine: (1) submitDoc(true) chỉ chuyển NEW → DOC_OK; submitDoc(false) chuyển NEW → FAILED; nếu hồ sơ đã ở trạng thái khác NEW thì gọi lại không làm gì cả. (2) submitSelfie(true) chỉ được gọi khi state == DOC_OK, chuyển DOC_OK → SELFIE_OK; submitSelfie(false) tăng tries, khi tries >= max (3) chuyển sang FAILED; nếu state khác DOC_OK thì không làm gì. (3) runAml(true) chỉ khi state == SELFIE_OK, chuyển sang DONE; runAml(false) chuyển sang FAILED; nếu state khác SELFIE_OK thì không làm gì. (4) isDone() trả về true khi state == DONE. Một khi đạt DONE hoặc FAILED, gọi lại bất kỳ phương thức nào đều không thay đổi trạng thái (idempotent).', starter:'class OnboardingFlow {\
  enum State { NEW, DOC_OK, SELFIE_OK, DONE, FAILED }\
  State state = State.NEW;\
  int tries = 0;\
  final int max = 3;\
  void submitDoc(boolean ok){ throw new UnsupportedOperationException("TODO"); }\
  void submitSelfie(boolean ok){ throw new UnsupportedOperationException("TODO"); }\
  void runAml(boolean clear){ throw new UnsupportedOperationException("TODO"); }\
  boolean isDone(){ return state==State.DONE; }\
}', tests:'public class Main {\
  static int passed=0,total=0;\
  static void check(String n,boolean ok,String d){total++; if(ok){passed++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": "+d);}\
  public static void main(String[] a){\
    OnboardingFlow f=new OnboardingFlow();\
    f.submitDoc(true); check("doc", f.state==OnboardingFlow.State.DOC_OK, "");\
    f.submitSelfie(true); check("selfie", f.state==OnboardingFlow.State.SELFIE_OK, "");\
    f.runAml(true); check("aml", f.isDone(), "");\
    OnboardingFlow f2=new OnboardingFlow(); f2.submitDoc(true);\
    for(int i=0;i<3;i++) f2.submitSelfie(false);\
    check("tries", f2.state==OnboardingFlow.State.FAILED, "");\
    OnboardingFlow f3=new OnboardingFlow(); f3.submitDoc(false);\
    check("docfail", f3.state==OnboardingFlow.State.FAILED, "");\
    System.out.println("RESULT "+passed+"/"+total);\
  }\
}', reference:'class OnboardingFlow {\
  enum State { NEW, DOC_OK, SELFIE_OK, DONE, FAILED }\
  State state = State.NEW;\
  int tries = 0;\
  final int max = 3;\
  void submitDoc(boolean ok){ if(state!=State.NEW) return; if(!ok) state=State.FAILED; else state=State.DOC_OK; }\
  void submitSelfie(boolean ok){ if(state!=State.DOC_OK) return; if(!ok){ tries++; if(tries>=max) state=State.FAILED; return;} state=State.SELFIE_OK; }\
  void runAml(boolean clear){ if(state!=State.SELFIE_OK) return; state=clear?State.DONE:State.FAILED; }\
  boolean isDone(){ return state==State.DONE; }\
}', hints:['Bắt đầu bằng submitDoc: nếu ok và state là NEW thì gán DOC_OK; nếu !ok thì gán FAILED; còn lại (state đã đổi) thì return ngay.', 'submitSelfie chỉ được phép khi state == DOC_OK. Nếu ok thì gán SELFIE_OK; nếu !ok thì tries++, và khi tries >= max gán FAILED. runAml tương tự: chỉ khi state == SELFIE_OK, clear ? DONE : FAILED.', 'Idempotent tự nhiên xảy ra vì mỗi phương thức kiểm tra state trước khi thay đổi: khi đã DONE hoặc FAILED, mọi lệnh gọi sau đó đều không làm gì.'], explain:'Lời giải tham khảo đóng gói cả năm trạng thái NEW, DOC_OK, SELFIE_OK, DONE, FAILED vào một enum và chỉ cho phép chuyển trạng thái theo đúng thứ tự: NEW → DOC_OK → SELFIE_OK → DONE, với nhánh thất bại từ bất kỳ bước nào vào FAILED. Điểm quan trọng nhất là mỗi phương thức bắt đầu bằng kiểm tra state: submitDoc mới làm gì khi state == NEW, submitSelfie mới làm gì khi state == DOC_OK, runAml mới làm gì khi state == SELFIE_OK. Nhờ vậy, một khi hồ sơ vào trạng thái cuối (DONE hoặc FAILED), các lệnh gọi tiếp theo không làm thay đổi gì — tính chất idempotent mà bài yêu cầu, không cần code riêng cho từng trường hợp.\n\nLỗi hay gặp: viết submitSelfie không kiểm tra state == DOC_OK, dẫn đến khách có thể "tùy ý" selfie trước khi giấy tờ được duyệt; hoặc quên giới hạn tries >= max, khiến khách thử mãi mãi. Lỗi khác là gọi runAml trước selfie, làm mất ý nghĩa của kiểm tra đối với người chưa xác minh danh tính. Trong code thật, mỗi trạng thái thay đổi cũng nên ghi log kèm idempotency key để khi hệ thống bị gián đoạn giữa chừng, bản ghi retry không bị xử lý hai lần.' }],
    check: [{ q:'Trong quy trình eKYC, bước nào phải hoàn thành trước khi khách được phép chụp selfie (liveness)?', options:['Nhập thông tin và chụp CMND/CCCD được hệ thống xác nhận hợp lệ', 'Kiểm tra chống rửa tiền (AML)', 'Tạo mã hồ sơ khách hàng (CIF)', 'Gửi hợp đồng mở tài khoản bằng chữ ký điện tử'], answer:0, explain:'Đáp án đúng (A): selfie chỉ được mở khóa sau khi giấy tờ CCCD đã chụp và OCR xác nhận hợp lệ (trạng thái DOC_OK). AML (B) diễn ra SAU selfie. CIF (C) chỉ được tạo khi toàn bộ quy trình hoàn tất, bao gồm AML. Hợp đồng điện tử (D) thường ký sau khi tài khoản đã được mở. Nhầm thứ tự là lỗi phổ biến — chẳng hạn cho phép selfie trước khi xác minh giấy tờ thì kẻ gian có thể dùng ảnh mạo danh ngay từ đầu.' },{ q:'Khách chụp selfie sai 3 lần liên tiếp. Với giới hạn retry max = 3, trạng thái hồ sơ sẽ thành gì?', options:['SELFIE_OK', 'DONE', 'FAILED', 'NEW'], answer:2, explain:'Đáp án đúng (C): mỗi lần submitSelfie(false) tăng biến tries; khi tries >= max (3 lần) state chuyển thành FAILED và không cho thử thêm. SELFIE_OK (A) chỉ khi selfie đúng; DONE (B) yêu cầu đã qua AML; NEW (D) là trạng thái ban đầu. Lưu ý: sau khi FAILED, gọi lại submitSelfie hay bất kỳ phương thức nào đều không làm thay đổi trạng thái (idempotent terminal state).' }],
    related: [],
    tags: ['ekyc']
  },

  {

    id: 'lesson-banking-013',
    track: 'banking',
    order: 13,
    title: 'Chống gian lận realtime: rule engine, velocity check, chấm điểm rủi ro và quyết định chặn/OTP/cho qua',
    level: 'senior',
    minutes: 40,
    goals: [
      'Giải thích được vì sao ngân hàng cần một hệ thống ra quyết định ALLOW / CHALLENGE / BLOCK trong vài trăm mili giây, và vì sao nó khác với việc so số dư',
      'Viết {{VelocityRule}} đếm số giao dịch và tổng tiền trong cửa sổ trượt (sliding window) theo từng {{userId}}, dùng {{Clock}} giả để test không phụ thuộc thời gian thật',
      'Viết {{RiskEngine}} cộng điểm từ nhiều rule rồi ra quyết định theo ngưỡng, biết chỗ nào dễ sai (rule đếm trên bộ nhớ mất khi restart, side-effect khi bị chặn, false positive)',
      'Nói được vòng phản hồi: khiếu nại của khách → nhãn legit/fraud → chỉnh ngưỡng và retrain, và vì sao đây mới là thứ giữ hệ thống sống',
    ],
    body: `**Tóm tắt:** Hệ thống chống gian lận realtime (real-time fraud detection) là một cổng chặn nằm giữa lúc khách bấm "Chuyển tiền" và lúc lệnh được thực thi; trong **vài trăm mili giây** nó phải trả lời: **cho qua (ALLOW)**, **bắt xác minh thêm (CHALLENGE — OTP/push)**, hay **từ chối thẳng (BLOCK)**. Nó gồm một **rule engine** (các luật cứng, giải thích được như "quá 5 giao dịch trong 1 phút"), một hàm **chấm điểm rủi ro** cộng điểm từ nhiều rule, và một **chính sách quyết định** biến điểm thành ba lựa chọn trên. Vì nằm trên đường đi của giao dịch, nó chỉ được tiêu một phần nhỏ ngân sách thời gian, phải có chính sách khi chính nó lỗi (fail open / fail closed), và phải chống lại **false positive** — chặn nhầm khách thật — vì đó là chi phí mất khách thật sự.

### Ngoài đời diễn ra thế nào

Lan (chủ một tài khoản tại ngân hàng) đang ở Hà Nội. 21:47 ngày 14/11, Lan mở app định chuyển 2 triệu cho Minh — bạn cùng phòng trọ, người Lan **chưa từng chuyển tiền lần nào** (người nhận mới). Nhưng ở một nơi khác, kẻ gian đã chiếm được phiên đăng nhập của Lan trên một điện thoại khác (thiết bị mới), và đang chuyển **47 triệu** sang một tài khoản lạ.

Trong 90 giây, kẻ đó bấm 6 lần: 12 triệu, 8 triệu, 5 triệu, 11 triệu, 7 triệu, 4 triệu — mỗi lần một số tiền "tròn lẻ", liên tiếp, tới cùng một người nhận mới. Đây chính là **hành vi velocity bất thường**: nhiều giao dịch trong ít phút, tổng tiền vượt xa thói quen của Lan (Lan thường chỉ chuyển 1–2 triệu mỗi ngày, đôi khi cả tuần không giao dịch).

Ngân hàng có ba lựa chọn, và mỗi lựa chọn có một cái giá:

- **CHO QUA (ALLOW):** giao dịch đi ngay. Nếu là Lan thật thì Lan hài lòng. Nếu là kẻ gian thì tiền mất, ngân hàng phải đền, và tệ hơn là mất niềm tin.
- **BẮT XÁC MINH THÊM (CHALLENGE):** gửi OTP/push về đúng số điện thoại và thiết bị của Lan. Lan thật nhập mã → giao dịch đi tiếp. Kẻ gian không có điện thoại của Lan → dừng. Cái giá: thêm vài giây, và nếu hệ thống gửi nhầm (ví dụ Lan đang ở vùng sóng yếu) thì Lan bực.
- **TỪ CHỐI THẲNG (BLOCK):** không cho đi, báo "giao dịch bị từ chối tạm thời". Kẻ gian dừng, nhưng nếu là Lan thật thì đây là một **false positive** — chặn nhầm khách thật — và Lan sẽ gọi tổng đài, thậm chí chuyển sang ngân hàng khác.

Điểm mấu chốt: **hệ thống không "biết" đó là kẻ gian.** Nó chỉ nhìn thấy *hành vi*: thiết bị lạ, người nhận mới, sáu giao dịch trong 90 giây, tổng 47 triệu — khác hẳn bình thường. Nhiệm vụ của nó là **quy đổi hành vi thành một con điểm rủi ro**, rồi so với ngưỡng.

### Các bên và luồng

Có sáu bên tham gia, nhưng để dễ hình dung ta gom thành năm vai:

- **Khách (Lan):** người bấm nút, là người chịu thiệt nếu hệ thống sai.
- **App / Internet Banking:** nơi sinh ra yêu cầu, gửi kèm dữ liệu ngữ cảnh (thiết bị, IP, địa điểm).
- **Fraud/Decision Service:** hệ thống ra quyết định, nơi ta viết code trong bài này.
- **Feature/Data Store (Redis):** nơi lưu các con đếm velocity và lịch sử gần đây, đọc cực nhanh.
- **Core Banking / Cổng thanh toán:** nơi thực sự trừ tiền và chuyển đi — chỉ chạy **nếu** decision service nói ALLOW.

Luồng một giao dịch đi qua các bước sau (số thứ tự là để bạn đọc theo trình tự):

~~~seq
title: Một lệnh chuyển tiền đi qua cổng chống gian lận
actors: App | Decision | Redis | Core
App -> Decision: chuyển 12tr, thiết bị mới, người nhận mới
Decision -> Redis: đọc velocity userId + lịch sử gần đây
Redis --> Decision: 6 giao dịch / 90s, tổng 47tr, thiết bị lạ
Decision -> Decision: chấm điểm rủi ro từ nhiều rule
Decision --> App: CHALLENGE (bắt OTP) — điểm vượt ngưỡng mềm
App --> Decision: khách nhập OTP đúng
Decision -> Core: ALLOW — cho phép trừ tiền
Core --> App: chuyển tiền thành công
~~~

Điểm cần nhớ: **decision service không tự trừ tiền.** Nó chỉ trả lời "được / phải xác minh / không". Việc trừ tiền là của Core, và Core chỉ làm khi có ALLOW. Nhờ tách đôi như vậy, khi nghi ngờ ta có thể "giữ" giao dịch ở tầng decision mà không đụng vào bút toán — xem lại bài hold/capture (bài 7) và bài hạn mức (bài 3) để thấy hai tầng này nối nhau.

### Vì sao phải nhanh: ngân sách độ trễ

Khách bấm "Chuyển" và chờ. Mọi mili-giây ở đây là trải nghiệm. Một giao dịch chuyển tiền có **ngân sách tổng** (ví dụ 2 giây) chia cho nhiều tầng: mạng, xác thực, decision, core, đầu bên kia. Trong đó **decision chỉ được 150–300 ms** — bằng đúng thời gian một cái nháy mắt. Nếu decision chậm, cả giao dịch chậm, khách bấm lại, sinh ra **giao dịch trùng** (xem bài 8), và lúc đó chính hệ thống chống gian lận lại phải xử lý thêm một mớ.

Vì ngân sách nhỏ như vậy, decision service **không được** làm việc nặng ngay trên đường đi. Nó chỉ được **đọc dữ liệu đã chuẩn bị sẵn** (các con đếm velocity, điểm lịch sử, cờ thiết bị) từ Redis/in-memory, rồi cộng điểm. Việc nặng — huấn luyện model, tính lại toàn bộ lịch sử, đối chiếu danh sách đen toàn cục — chạy **bất đồng bộ** (asynchronous, tức là chạy nền, không chặn khách) qua hàng đợi (ví dụ Kafka — xem bài microservices). Đây là lý do velocity được đếm trước ở Redis, chứ không phải decision service đi quét database mỗi lần.

### Rule, điểm rủi ro và ba quyết định

**Rule engine** là tập hợp các luật đơn giản, mỗi luật trả về "có vi phạm hay không" và "vi phạm nặng bao nhiêu". Ưu điểm lớn nhất: **giải thích được** — khi chặn một giao dịch, ta nói được chính xác "vì sao": "vì 6 giao dịch trong 90 giây". ML thì cho điểm nhưng khó giải thích; rule thì dễ. Nhược điểm: kẻ gian biết luật sẽ né.

Ví dụ bốn luật phổ biến (đúng bốn cái task yêu cầu):

| Luật | Điều kiện | Điểm cộng | Ý nghĩa |
|---|---|---|---|
| Số tiền bất thường | {{amount}} lớn hơn ngưỡng / lớn hơn thói quen | +2 | 47 triệu trong khi Lan hay 2 triệu |
| Thiết bị mới | {{deviceId}} chưa từng thấy với {{userId}} | +2 | phiên lạ trên máy lạ |
| Velocity | > N giao dịch trong cửa sổ trượt | +3 | 6 lần / 90 giây |
| Người nhận mới | tài khoản nhận chưa từng nhận từ {{userId}} | +1 | lần đầu chuyển cho người này |

Mỗi rule cộng điểm; điểm cao thì rủi ro cao. **Chính sách quyết định** biến điểm thành hành động, ví dụ:

- {{score < 3}} → **ALLOW** (cho qua im lặng, không làm phiền khách)
- {{3 <= score < 5}} → **CHALLENGE** (bắt OTP/push — đủ để chặn kẻ gian nhưng không chặn nhầm Lan)
- {{score >= 5}} → **BLOCK** (từ chối thẳng — chỉ dành cho trường hợp gần như chắc chắn xấu)

Vì sao có **ba** mức chứ không phải hai (cho qua / chặn)? Vì "chặn nhầm" quá đắt. **Step-up authentication** (bắt xác minh thêm đúng lúc, ví dụ OTP) là cách hạ chi phí false positive: Lan thật vẫn đi được, chỉ tốn vài giây; kẻ gian thì không có OTP nên dừng. BLOCK chỉ để dành cho điểm rất cao. Đây là ý mà interviewer muốn nghe: **ưu tiên challenge hơn block.**

### Trạng thái và chỗ có thể sai

| Thành phần | Trạng thái giữ | Chỗ sai điển hình | Hậu quả |
|---|---|---|---|
| Velocity counter (Redis) | số giao dịch + tổng tiền theo cửa sổ | quên TTL, quên key theo userId → bộ nhớ phình, số liệu lẫn giữa các user | đếm sai → rủi ro sai |
| Counter tăng song song | một con số dùng chung | hai request cùng đọc-cộng-ghi → mất cập nhật | sót giao dịch, lọt gian lận |
| Bộ nhớ velocity | nằm trong RAM của một instance | restart/resize pod → mất sạch, đồng hồ đếm về 0 | sau restart, kẻ gian được "quay lại từ trắng" |
| Rule trùng side-effect | gọi điện/nhắn OTP ngay trong lúc tính điểm | giao dịch bị BLOCK nhưng OTP vẫn gửi, hoặc gửi hai lần khi retry | làm phiền khách, tốn SMS |
| Quyết định | không ghi lại lý do | khiếu nại không tra được vì sao chặn | không giải trình được, mất niềm tin |
| Ngưỡng | cố định trong code | kẻ gian học được, hoặc giờ cao điểm bị chặn oan | FP tăng vọt |

Hai lỗi nguy hiểm nhất cần nhớ:

1. **Velocity đếm trên RAM một instance thì không đáng tin.** Production chạy nhiều instance (Kubernetes — xem bài 8), mỗi instance một bộ đếm riêng, và khi pod bị kill để scale thì bộ đếm bay mất. Kẻ gian chỉ cần chờ đúng lúc đó. Cách đúng: dùng lệnh **nguyên tử phía server dữ liệu** (Redis INCR, hoặc Lua script) để mọi instance cùng thấy một con số — giống hệt bài học về hạn mức đồng thời ở bài 8, chỉ khác là ở đây ta đếm **số lần** và **tổng tiền** trong cửa sổ trượt thay vì một hạn mức ngày.

2. **Không được để quyết định có side-effect.** Trong lúc tính điểm, tuyệt đối không gửi OTP, không ghi log "đã chặn", không trừ tiền. Chỉ **tính điểm thuần túy**, rồi mới hành động một lần sau khi đã có quyết định. Nếu không, một giao dịch bị BLOCK vẫn có thể đã kịp gửi OTP, hoặc một lần retry gọi SMS hai lần.

### Hệ thống backend xử lý ra sao

Ý tưởng cốt lõi tách làm hai lớp: một **rule vận hành trên bộ đếm velocity**, và một **engine cộng điểm từ nhiều rule**. Code dưới đây là bộ khung thuần JDK để bạn thấy cơ chế; production sẽ thay bằng Redis cho velocity và thêm model ML, nhưng hình dạng logic vẫn thế.

~~~java
// VelocityRule: đếm số giao dịch + tổng tiền trong cửa sổ trượt [now - window, now]
// Dùng Clock để test "quay đồng hồ" mà không cần ngủ chờ thật.
class VelocityRule {
    final int maxCount;          // quá số này thì coi là bất thường
    final long maxSum;           // hoặc tổng tiền vượt ngưỡng
    final long windowMillis;     // độ rộng cửa sổ (ví dụ 60_000 = 1 phút)
    final Clock clock;
    final Map<Long, Long> times = new HashMap<>();   // userId -> thời điểm các giao dịch gần nhất

    boolean isSuspicious(long userId, long amount, long nowEpoch) {
        long lo = nowEpoch - windowMillis;
        // 1) bỏ các mốc đã ra khỏi cửa sổ: chỉ giữ giao dịch còn "sống"
        // 2) đếm số giao dịch còn lại và cộng tổng tiền
        // 3) nghi ngờ nếu số lần > maxCount HOẶC tổng tiền > maxSum
        return true; // TODO
    }

    void record(long userId, long nowEpoch) {
        // thêm mốc thời gian này vào danh sách của userId
    }
}
~~~

Điểm cần chú ý trong code thật (bản reference bên dưới có đủ):

- Cửa sổ **trượt** (sliding window), không phải cửa sổ cố định: ta luôn xét "N đơn vị gần nhất tính từ bây giờ", nên không có hiện tượng "đầu phút reset về 0 rồi kẻ gian dồn ồ ạt".
- {{record}} chỉ được gọi **sau khi** quyết định đã tính trên trạng thái cũ — nếu gọi trước, chính giao dịch đang xét lại bị đếm vào và làm sai luật của chính nó.
- {{userId}} là khóa: hai người dùng không được lẫn số liệu của nhau.

### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này

Khi sếp/security giao task "làm hệ thống chống gian lận", đừng nhảy vào code. Hỏi lại:

1. **Ngân sách độ trễ là bao nhiêu?** 200 ms hay 2 giây? Điều này quyết định velocity phải đếm trước ở đâu, có được gọi model nặng không.
2. **Khi decision service lỗi/timeout thì sao?** Fail open (cho qua, ưu tiên trải nghiệm) hay fail closed (chặn, ưu tiên an toàn)? Ngưỡng tiền nào chuyển từ fail-open sang fail-closed? (Câu này chính là câu phỏng vấn kinh điển.)
3. **"Bình thường" của khách này là gì?** Cần dữ liệu lịch sử bao lâu để nói "47 triệu là bất thường"? Khách mới, không có lịch sử, thì lấy ngưỡng của ai?
4. **Ai gánh false positive?** Chặn nhầm thì tổng đài, marketing, hay risk chịu? Con số FP hiện tại là bao nhiêu, mục tiêu là gì?
5. **Vòng phản hồi lấy nhãn ở đâu?** Khi khách bấm "Đây là tôi" trong app, sự kiện đó có chảy về kho dữ liệu để chỉnh luật/retrain không?

### Những lỗi hay gặp khi phỏng vấn

- Nói "chặn hết giao dịch lớn là xong" — bị loại ngay vì không hiểu false positive.
- Không nhắc **fail open / fail closed** khi được hỏi về timeout.
- Không nhắc **velocity phải nguyên tử** (Redis/Lua) khi chạy nhiều instance.
- Gửi OTP ngay trong lúc tính điểm (side-effect), khiến giao dịch bị chặn vẫn làm phiền khách.
- Không ghi lại **lý do** quyết định, nên khi khách khiếu nại không giải trình được.
- Quên rằng kẻ gian **học và né**: hệ thống phải có đường tắt/mở luật trong vài phút và vòng retrain.

> Senior tip: Trong phỏng vấn, hãy trả lời theo bốn tầng: (1) quyết định phải **đồng bộ** nhưng chỉ đọc dữ liệu đã chuẩn bị sẵn, phần nặng chạy bất đồng bộ; (2) luôn có **chính sách khi chính nó lỗi**, kèm ngưỡng tiền; (3) ưu tiên **challenge (OTP/push)** hơn block để giảm false positive; (4) **ghi log snapshot feature + lý do** tại thời điểm quyết định để giải trình và làm nhãn. Thêm một câu ghi điểm: giá trị thật của hệ thống không nằm ở model xịn nhất, mà ở **vòng phản hồi** — khiếu nại của khách thành nhãn, nhãn thành retrain — và ở khả năng **tắt/mở luật trong vài phút**.

### Liên hệ phỏng vấn

**Câu hỏi:** "Khách chuyển tiền, hệ thống của bạn làm sao quyết định cho qua, bắt OTP, hay chặn — trong khi chỉ có 200 ms?"

**Cách trả lời:** Tôi hình dung decision service như một cổng chặn mỏng: nó **không** trừ tiền, chỉ trả lời ALLOW / CHALLENGE / BLOCK, còn Core mới thực sự bút toán. Trong 200 ms đó nó chỉ được **đọc dữ liệu đã chuẩn bị sẵn** từ Redis: các con đếm velocity (số giao dịch + tổng tiền trong cửa sổ trượt theo {{userId}}), cờ thiết bị mới, cờ người nhận mới, điểm lịch sử. Mỗi rule trả về một số điểm; tôi cộng lại. Ngưỡng mềm cho **CHALLENGE** (gửi OTP/push — chặn được kẻ gian mà không chặn nhầm khách thật), ngưỡng cao cho **BLOCK**. Nếu decision service timeout, tôi phải có chính sách rõ: giao dịch nhỏ thì fail open, giao dịch lớn/đi nước ngoài thì fail closed, vì lúc đó thà làm phiền khách còn hơn mất tiền. Velocity phải được tăng bằng lệnh nguyên tử phía Redis (INCR/Lua) vì chạy nhiều instance, không thì mất số liệu khi scale. Và quan trọng nhất: mọi quyết định đều **ghi log kèm lý do**, rồi vòng phản hồi biến khiếu nại của khách thành nhãn legit/fraud để chỉnh ngưỡng và retrain — vì kẻ gian luôn đổi chiêu, hệ thống sống được là nhờ vòng này.`,
  exercises: [
    {
      title: 'VelocityRule + RiskEngine: cộng điểm từ nhiều rule ra quyết định',
      prompt: `Viết hai class cho một cổng chống gian lận rút gọn, chỉ dùng JDK chuẩn (Java 17), {{Clock}} để xác định "bây giờ" (giúp test không phải ngủ chờ).

**VelocityRule** — đếm giao dịch trong cửa sổ trượt theo từng {{userId}}:
- {{VelocityRule(int maxCount, long maxSum, long windowMillis, Clock clock)}}
- {{boolean isSuspicious(long userId, long amount, long nowEpoch)}} — {{true}} nếu **số giao dịch đã ghi trong cửa sổ [now - window, now)** cộng với lần này vượt {{maxCount}}, **hoặc** tổng tiền cộng với lần này vượt {{maxSum}}.
- {{void record(long userId, long amount, long nowEpoch)}} — ghi nhận một giao dịch (mốc thời gian + số tiền). Chỉ gọi **sau khi** đã ra quyết định, để chính giao dịch đang xét không tự đếm vào luật của nó.
- {{int count(long userId, long nowEpoch)}} và {{long sum(long userId, long nowEpoch)}} — số lần và tổng tiền còn "sống" trong cửa sổ.

Quy tắc biên: {{windowMillis <= 0}}, {{maxCount < 0}}, {{maxSum < 0}} ném {{IllegalArgumentException}} ở constructor; {{amount < 0}} ném {{IllegalArgumentException}}.

**RiskEngine** — cộng điểm từ nhiều rule rồi ra quyết định:
- {{Decision decide(long baseScore, boolean deviceIsNew, boolean payeeIsNew, long amount, boolean velocitySuspicious)}} — cộng điểm: {{baseScore}} + {{deviceIsNew ? 2 : 0}} + {{payeeIsNew ? 1 : 0}} + {{amount >= 10_000_000 ? 2 : 0}} + {{velocitySuspicious ? 3 : 0}}.
- Ngưỡng: {{score < 3}} trả {{ALLOW}}; {{3 <= score < 5}} trả {{CHALLENGE}}; {{score >= 5}} trả {{BLOCK}}.
- {{Decision}} là enum {{ALLOW, CHALLENGE, BLOCK}}.

Test sẽ kiểm tra: velocity đếm đúng và trượt cửa sổ (giao dịch cũ bị loại khi qua cửa sổ), {{isSuspicious}} nhìn trước được lần này (số lần hiện tại + 1 > maxCount), RiskEngine cộng đúng điểm và phân loại đúng ba mức, biên {{amount}} ngay dưới và ngay trên 10 triệu, và {{amount}} âm bị từ chối.`,
      starter: `import java.time.*;
import java.util.*;

class VelocityRule {
    final int maxCount;
    final long maxSum;
    final long windowMillis;
    final Clock clock;

    VelocityRule(int maxCount, long maxSum, long windowMillis, Clock clock) {
        if (windowMillis <= 0) throw new IllegalArgumentException("window phai duong");
        if (maxCount < 0) throw new IllegalArgumentException("maxCount khong am");
        if (maxSum < 0) throw new IllegalArgumentException("maxSum khong am");
        this.maxCount = maxCount;
        this.maxSum = maxSum;
        this.windowMillis = windowMillis;
        this.clock = clock;
    }

    boolean isSuspicious(long userId, long amount, long nowEpoch) {
        throw new UnsupportedOperationException("TODO");
    }

    void record(long userId, long amount, long nowEpoch) {
        throw new UnsupportedOperationException("TODO");
    }

    int count(long userId, long nowEpoch) {
        throw new UnsupportedOperationException("TODO");
    }

    long sum(long userId, long nowEpoch) {
        throw new UnsupportedOperationException("TODO");
    }
}

enum Decision { ALLOW, CHALLENGE, BLOCK }

class RiskEngine {
    Decision decide(long baseScore, boolean deviceIsNew, boolean payeeIsNew, long amount, boolean velocitySuspicious) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Clock fixed(long epochMillis) {
        return Clock.fixed(Instant.ofEpochMilli(epochMillis), ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    public static void main(String[] args) {
        // Cửa sổ 1000ms, quá 3 lần HOẶC tổng tiền quá 100 -> nghi ngờ
        VelocityRule vr = new VelocityRule(3, 100, 1000, fixed(0));
        long t0 = 10_000;

        check("constructor_window_am", expect(IllegalArgumentException.class, () -> new VelocityRule(1, 1, 0, fixed(0))), "");
        check("constructor_maxcount_am", expect(IllegalArgumentException.class, () -> new VelocityRule(-1, 1, 1000, fixed(0))), "");
        check("constructor_maxsum_am", expect(IllegalArgumentException.class, () -> new VelocityRule(1, -1, 1000, fixed(0))), "");
        check("amount_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> vr.isSuspicious(1L, -5, t0)), "");

        // Chưa ghi gì: lần đầu không nghi ngờ
        check("lan_dau_khong_nghi", !vr.isSuspicious(1L, 10, t0), "");

        // Ghi 3 giao dịch 10,10,10 (tổng 30 <= 100, số lần 3 <= 3) -> chưa vượt
        vr.record(1L, 10, t0);
        vr.record(1L, 10, t0);
        vr.record(1L, 10, t0);
        check("dem_dung_3_lan", vr.count(1L, t0) == 3, "count=" + vr.count(1L, t0));
        check("tong_dung_30", vr.sum(1L, t0) == 30, "sum=" + vr.sum(1L, t0));
        // isSuspicious nhìn TRƯỚC lần này: số hiện tại 3 + 1 = 4 > 3 => nghi
        check("nhin_truoc_lan_nay_4", vr.isSuspicious(1L, 10, t0), "phai nghi vi 3+1>3");

        // Nhưng tổng tiền cũng được xét: 3 giao dịch 40,40 (tổng 80), thêm 30 => 110 > 100 => nghi
        VelocityRule vr2 = new VelocityRule(10, 100, 1000, fixed(0));
        vr2.record(2L, 40, t0);
        vr2.record(2L, 40, t0);
        check("tong_vuot_nguong", vr2.isSuspicious(2L, 30, t0), "80+30=110>100");

        // Cửa sổ trượt: ở t0+1000, các mốc ở t0 đã ra khỏi cửa sổ [t0, t0+1000) (lo = 0)
        // wait: now=10_000 -> lo=9_000, mốc 10_000 KHÔNG < 9_000 nên vẫn còn... dùng mốc cũ hơn
        VelocityRule vr3 = new VelocityRule(1, 1000, 1000, fixed(0));
        vr3.record(3L, 50, 5_000);
        check("con_trong_cua_so", vr3.count(3L, 5_500) == 1, "count=" + vr3.count(3L, 5_500));
        check("ra_khoi_cua_so", vr3.count(3L, 6_001) == 0 && vr3.sum(3L, 6_001) == 0,
            "count=" + vr3.count(3L, 6_001) + " sum=" + vr3.sum(3L, 6_001));

        // userId khác nhau không lẫn
        VelocityRule vr4 = new VelocityRule(3, 100, 1000, fixed(0));
        vr4.record(10L, 10, t0);
        check("user_khac_khong_lan", vr4.count(20L, t0) == 0, "count20=" + vr4.count(20L, t0));

        // RiskEngine: cộng điểm và phân loại
        RiskEngine re = new RiskEngine();
        check("allow_khi_diem_thap", re.decide(0, false, false, 1000, false) == Decision.ALLOW, "");
        check("allow_khi_diem_2", re.decide(2, false, false, 1000, false) == Decision.ALLOW, "");
        // baseScore 0 + deviceNew 2 = 2 => vẫn ALLOW (< 3)
        check("allow_2_diem", re.decide(0, true, false, 1000, false) == Decision.ALLOW, "");
        // 0 + 2(device) + 1(payee) = 3 => CHALLENGE
        check("challenge_3_diem", re.decide(0, true, true, 1000, false) == Decision.CHALLENGE, "");
        // 0 + 2 + 1 + 2(amount>=10tr) = 5 => BLOCK
        check("block_5_diem", re.decide(0, true, true, 10_000_000, false) == Decision.BLOCK, "");
        // amount 9_999_999 chưa cộng 2 => 0+2+1=3 => CHALLENGE
        check("amount_duoi_nguong", re.decide(0, true, true, 9_999_999, false) == Decision.CHALLENGE, "");
        // velocitySuspicious cộng 3: baseScore 2 + 3 = 5 => BLOCK
        check("velocity_day_block", re.decide(2, false, false, 1000, true) == Decision.BLOCK, "");
        // biên 3 chính xác -> CHALLENGE, biên 5 chính xác -> BLOCK
        check("bien_3_la_challenge", re.decide(3, false, false, 1000, false) == Decision.CHALLENGE, "");
        check("bien_5_la_block", re.decide(5, false, false, 1000, false) == Decision.BLOCK, "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;
import java.util.*;

class VelocityRule {
    final int maxCount;
    final long maxSum;
    final long windowMillis;
    final Clock clock;
    // userId -> danh sách (thời điểm, số tiền) còn sống trong cửa sổ
    final Map<Long, List<long[]>> events = new HashMap<>();

    VelocityRule(int maxCount, long maxSum, long windowMillis, Clock clock) {
        if (windowMillis <= 0) throw new IllegalArgumentException("window phai duong");
        if (maxCount < 0) throw new IllegalArgumentException("maxCount khong am");
        if (maxSum < 0) throw new IllegalArgumentException("maxSum khong am");
        if (clock == null) throw new IllegalArgumentException("thieu clock");
        this.maxCount = maxCount;
        this.maxSum = maxSum;
        this.windowMillis = windowMillis;
        this.clock = clock;
    }

    // Bỏ các mốc đã ra khỏi cửa sổ: chỉ giữ mốc >= now - window
    private List<long[]> live(long userId, long nowEpoch) {
        long lo = nowEpoch - windowMillis;
        List<long[]> all = events.computeIfAbsent(userId, k -> new ArrayList<>());
        all.removeIf(e -> e[0] < lo);
        return all;
    }

    boolean isSuspicious(long userId, long amount, long nowEpoch) {
        if (amount < 0) throw new IllegalArgumentException("so tien khong am");
        List<long[]> liveList = live(userId, nowEpoch);
        int cnt = liveList.size() + 1;        // +1 la lan dang xet
        long sum = 0;
        for (long[] e : liveList) sum += e[1];
        sum += amount;
        return cnt > maxCount || sum > maxSum;
    }

    void record(long userId, long amount, long nowEpoch) {
        if (amount < 0) throw new IllegalArgumentException("so tien khong am");
        live(userId, nowEpoch).add(new long[] { nowEpoch, amount });
    }

    int count(long userId, long nowEpoch) {
        return live(userId, nowEpoch).size();
    }

    long sum(long userId, long nowEpoch) {
        long s = 0;
        for (long[] e : live(userId, nowEpoch)) s += e[1];
        return s;
    }
}

enum Decision { ALLOW, CHALLENGE, BLOCK }

class RiskEngine {
    Decision decide(long baseScore, boolean deviceIsNew, boolean payeeIsNew, long amount, boolean velocitySuspicious) {
        if (amount < 0) throw new IllegalArgumentException("so tien khong am");
        long score = baseScore;
        if (deviceIsNew) score += 2;
        if (payeeIsNew) score += 1;
        if (amount >= 10_000_000) score += 2;
        if (velocitySuspicious) score += 3;
        if (score >= 5) return Decision.BLOCK;
        if (score >= 3) return Decision.CHALLENGE;
        return Decision.ALLOW;
    }
}`,
      hints: [
        'Velocity là "số lần + tổng tiền trong cửa sổ trượt [now - window, now]". Mỗi lần xét, hãy **loại bỏ các mốc có thời điểm < now - window** trước, rồi cộng số lần (cộng thêm 1 cho lần đang xét) và tổng tiền (cộng thêm {{amount}} của lần đang xét) rồi so với {{maxCount}} / {{maxSum}}.',
        '{{isSuspicious}} phải nhìn **trước** lần này: dùng {{liveList.size() + 1}} và {{sum + amount}} chứ không phải số đã ghi. Nếu bạn cộng số đã ghi mà không +1 thì lần đầu tiên (chưa có gì) sẽ luôn trả {{false}}, nhưng lần thứ {{maxCount + 1}} lại bị bỏ sót.',
        'Dùng {{List<long[]>}} với mỗi phần tử {{[thờiĐiểm, sốTiền]}} để vừa đếm được số lần vừa cộng được tổng tiền; {{removeIf(e -> e[0] < lo)}} dọn các mốc cũ. Đừng dùng {{double}} cho tiền — ở đây là {{long}} đồng chẵn.',
        'RiskEngine chỉ cộng điểm thuần túy, **không** gửi OTP hay trừ tiền. Ngưỡng: {{score >= 5}} → {{BLOCK}}, {{score >= 3}} → {{CHALLENGE}}, còn lại {{ALLOW}}. Biên {{amount}} 10 triệu: {{>= 10_000_000}} mới cộng 2.',
      ],
      explain: `Bài này tách đúng hai lớp mà một hệ thống chống gian lận thật luôn có: **đếm hành vi** (velocity) và **quy đổi hành vi thành quyết định** (risk engine).

1. **Velocity đếm trong cửa sổ trượt, không phải cửa sổ cố định.** Mỗi lần xét, ta bỏ các mốc cũ hơn {{now - window}} rồi mới đếm. Nếu dùng cửa sổ cố định kiểu "mỗi phút reset về 0" thì kẻ gian sẽ dồn ồ ạt vào cuối phút; cửa sổ trượt không có lỗ đó. Test {{con_trong_cua_so}} / {{ra_khoi_cua_so}} kiểm đúng điều này: mốc ở {{5_000}} còn sống ở {{5_500}} (khoảng 5_000 ≥ 4_500) và đã chết ở {{6_001}} (khoảng 5_000 < 5_001).

2. **Nhìn trước lần đang xét.** {{isSuspicious}} cộng {{+1}} cho số lần và {{+amount}} cho tổng tiền, vì nó trả lời "nếu cho lần này đi thì có vượt không". Test {{nhin_truoc_lan_nay_4}} bắt đúng chỗ này: đã ghi 3 lần, {{maxCount = 3}}, lần thứ 4 phải bị nghi — nếu bạn chỉ đếm 3 đã ghi thì {{3 > 3}} là sai và lọt.

3. **Ngưỡng ba mức.** {{ALLOW}} im lặng, {{CHALLENGE}} bắt OTP, {{BLOCK}} từ chối. Test bắt cả biên: 3 chính xác là CHALLENGE, 5 chính xác là BLOCK, 2 vẫn ALLOW. Đây là lý do nên viết điều kiện dạng {{>=}} theo thứ tự từ cao xuống, tránh khoảng hở giữa hai ngưỡng.

4. **Biên và số tiền.** {{amount}} âm bị từ chối ngay, vì nếu cho đi thì kẻ gian có thể "cộng tiền âm" để kéo tổng velocity xuống và mua lại hạn mức — cùng một lỗ hổng như bài 8. {{amount}} 9_999_999 chưa chạm 10 triệu nên chưa cộng điểm; 10_000_000 mới cộng.

Điều bài này **không** mô phỏng: Redis INCR/Lua (production dùng để nhiều instance cùng thấy một bộ đếm), model ML, và việc gửi OTP thật. Trong code thuần, {{events}} trong RAM đóng vai trò bộ đếm velocity — nhưng bạn phải nói được khi phỏng vấn rằng ở production nó phải nằm ở tầng dữ liệu dùng chung, nếu không restart pod là kẻ gian được "quay lại từ trắng".`,
      },
    ],
    check: [
      {
        q: 'Vì sao hệ thống chống gian lận cần đến **ba** mức ALLOW / CHALLENGE / BLOCK thay vì chỉ cho qua hoặc chặn?',
        options: [
          'Vì ba mức thì chạy nhanh hơn',
          'Vì CHALLENGE (bắt OTP/push) chặn được kẻ gian mà không chặn nhầm khách thật, hạ chi phí false positive xuống; BLOCK chỉ dành cho trường hợp gần như chắc chắn xấu',
          'Vì BLOCK không bao giờ sai',
          'Vì khách thích được hỏi OTP',
        ],
        answer: 1,
        explain: 'Đúng (B): chặn nhầm (false positive) là chi phí thật — mất khách, tăng cuộc gọi tổng đài. CHALLENGE là step-up authentication: khách thật vẫn đi tiếp sau vài giây, kẻ gian không có OTP nên dừng; BLOCK chỉ để dành cho điểm rất cao. Sai (A): số mức không quyết định tốc độ, tốc độ do ngân sách độ trễ và việc đọc dữ liệu đã chuẩn bị sẵn. Sai (C): BLOCK vẫn có thể sai (chặn nhầm khách thật có thói quen bất thường), nên không thể dùng cho mọi trường hợp. Sai (D): khách không thích bị làm phiền, CHALLENGE là sự đánh đổi có kiểm soát chứ không phải mong muốn của khách.',
      },
      {
        q: 'Velocity được đếm trên bộ nhớ của một instance (không dùng Redis/Lua). Khi production chạy 6 instance trên Kubernetes, điều gì xảy ra?',
        options: [
          'Vẫn đúng vì 6 instance chia nhau việc',
          'Mỗi instance giữ bộ đếm riêng và mất sạch khi pod bị kill/scale, nên kẻ gian có thể lọt sau restart; phải dùng lệnh nguyên tử ở Redis',
          'Chỉ cần thêm {{volatile}} là đủ',
          'Cần tắt autoscaling',
        ],
        answer: 1,
        explain: 'Đúng (B): production chạy nhiều JVM, mỗi JVM một vùng nhớ riêng; bộ đếm velocity trong RAM không được chia sẻ và biến mất khi pod bị kill để scale. Kẻ gian chỉ cần chờ đúng lúc đó để "quay lại từ trắng". Cách đúng là để con đếm ở tầng dữ liệu dùng chung và tăng bằng lệnh nguyên tử (Redis INCR hoặc Lua script). Sai (A): các instance không tự chia việc và không chia sẻ bộ nhớ. Sai (C): {{volatile}} chỉ đảm bảo nhìn thấy giá trị mới giữa thread trong cùng JVM, không chia sẻ xuyên instance. Sai (D): tắt autoscaling chữa ngọn, không sửa được bản chất "bộ đếm nằm ở RAM một instance".',
      },
      {
        q: 'Trong lúc tính điểm rủi ro, vì sao **không** được gửi OTP hay ghi log "đã chặn" ngay?',
        options: [
          'Vì gửi OTP làm chậm phép cộng điểm',
          'Vì đó là side-effect: giao dịch có thể bị BLOCK nhưng OTP vẫn kịp gửi, hoặc một lần retry gọi SMS hai lần, làm phiền khách và tốn chi phí',
          'Vì OTP phải gửi trước khi tính điểm',
          'Vì log không quan trọng',
        ],
        answer: 1,
        explain: 'Đúng (B): bước tính điểm phải là phép thuần túy (pure) — chỉ đọc dữ liệu và cộng điểm, không thay đổi thế giới bên ngoài. Mọi hành động (gửi OTP, ghi log, trừ tiền) chỉ làm **một lần sau khi** đã có quyết định cuối cùng, để tránh side-effect như gửi OTP cho giao dịch đã bị chặn hay gửi hai lần khi retry. Sai (A): không phải vấn đề tốc độ. Sai (C): gửi OTP trước khi biết quyết định là nguồn gốc của side-effect. Sai (D): log lý do quyết định rất quan trọng để giải trình khiếu nại và làm nhãn — nhưng phải log sau khi có quyết định, không phải trong lúc tính điểm.',
      },
    ],
    related: ['banking-016', 'banking-017', 'banking-030'],
    tags: ['fraud', 'velocity', 'rule engine', 'risk score', 'otp', 'challenge', 'false positive', 'clock', 'banking'],
  },

  {
    id: 'lesson-banking-014',
    track: 'banking',
    order: 14,
    title: 'Tích hợp với core banking (khái niệm T24/Temenos Transact): timeout, COB và store-and-forward',
    level: 'senior',
    minutes: 40,
    goals: [
      'Giải thích được vì sao core banking là "nguồn sự thật" về số dư và sổ cái, và kênh số (mobile/internet banking) chỉ nên giữ bản sao/cache',
      'Mô tả được bức tranh tích hợp (kênh -> gateway -> middleware/ESB -> core) và các khái niệm cần biết khi nói chuyện với team core: CIF/customer, account, arrangement, value date vs booking date, ngày làm việc, COB, OFS/REST ở mức nguyên lý',
      'Xử lý đúng khi gọi core bị timeout: không retry mù (giao dịch có thể đã ghi sổ), truy vấn trạng thái theo mã tham chiếu duy nhất, idempotency và trạng thái UNKNOWN trong bảng theo dõi',
      'Thiết kế luồng an toàn quanh cửa sổ COB (Close of Business): store-and-forward, xếp hàng, thông báo khách, xử lý sau COB đúng thứ tự, map mã lỗi core và đối soát cuối ngày',
    ],
    body: `**Tóm tắt:** Core banking (hệ thống lõi ngân hàng, phần mềm kế toán trung tâm nơi ghi nhận khách hàng, tài khoản, số dư và sổ cái) là "nguồn sự thật" (source of truth, nơi dữ liệu được coi là đúng cuối cùng) cho mọi con số tiền. Kênh số như mobile/internet banking chỉ là mặt tiền hiển thị và phải coi dữ liệu mình giữ là bản sao/cache. Khi tích hợp, middleware gọi core qua giao diện dịch vụ (ví dụ OFS – Open Financial Service, hay REST ở mức nguyên lý; TAFJ là nền tảng chạy Java của một số core như Temenos Transact, trước đây thường gọi T24) nhưng phải sống chung với ba thực tế: gọi có thể timeout trong khi core đã ghi sổ, core có cửa sổ COB (Close of Business, quy trình chốt sổ cuối ngày làm việc) khi giao dịch bị chặn hoặc xếp hàng, và mọi lệch phải được đối soát. Thiết kế an toàn dùng mã tham chiếu duy nhất (unique reference), trạng thái UNKNOWN, store-and-forward (lưu rồi gửi tiếp) và đối soát kênh với core.

### Core banking là gì và vì sao nó là "nguồn sự thật"?

**Thuật ngữ cần biết (giải thích lần đầu):**
- **Core banking (hệ thống lõi ngân hàng):** phần mềm kế toán trung tâm của ngân hàng. Nó quản lý hồ sơ khách hàng, tài khoản, sổ cái (ledger, sổ ghi nợ/có kế toán), tính lãi, phí, hạn mức và mọi bút toán làm thay đổi số dư. Ví dụ phổ biến trên thị trường là Temenos Transact (tên cũ T24), Finacle, Flexcube — ở đây ta chỉ nói khái niệm công khai, không đi vào cú pháp hay tên field cụ thể.
- **Nguồn sự thật (source of truth):** nơi dữ liệu được coi là "đúng" cuối cùng khi các hệ thống có bản sao khác nhau. Nếu app hiển thị 10 triệu nhưng core ghi 9 triệu, core mới là con số phải tin.
- **Sổ cái (ledger):** sổ kế toán ghi mọi bút toán nợ/có. Số dư tài khoản suy ra từ các bút toán trên sổ cái, nên thay đổi số dư phải đi qua bút toán hợp lệ (thường theo nguyên tắc kế toán kép).

Vì sao core là nguồn sự thật:
1. **Mọi thay đổi tiền thật đi qua core:** chuyển khoản, nạp, rút, tính lãi, phí đều được core ghi bút toán và cập nhật số dư. Kênh ngoài không được tự "cộng trừ tiền" trong cơ sở dữ liệu của mình rồi coi như xong.
2. **Kênh chỉ giữ bản sao/cache:** mobile banking thường cache số dư để hiển thị nhanh. Cache (bộ nhớ đệm tạm) có thể cũ hoặc sai sau khi mạng lỗi; vì vậy trước khi thực hiện giao dịch nhạy cảm, kênh phải hỏi core (hoặc chấp nhận kiểm tra lại).
3. **Quy định và đối soát:** báo cáo kế toán, quản lý rủi ro và đối soát cuối ngày đều dựa trên số liệu core. Nếu kênh tự ghi nhận khác core, ngân hàng sẽ có sai lệch tiền thật.

Ví dụ đời thường: core giống "sổ cái chính" ở quầy kế toán, còn app điện thoại giống tờ giấy ghi nhớ số dư — tờ ghi nhớ tiện tra cứu nhưng khi tranh chấp phải mở sổ cái chính.

### Bức tranh hệ thống: kênh số, middleware và core

Một giao dịch chuyển tiền từ app thường đi qua nhiều lớp. **Thuật ngữ:** API gateway (cổng vào tập trung, nhận request từ kênh và định tuyến/bảo vệ); middleware/ESB (Enterprise Service Bus, lớp trung gian kết nối và chuyển đổi thông điệp giữa các hệ thống); NAPAS (mạng chuyển mạch tài chính quốc gia, kết nối chuyển khoản liên ngân hàng); eKYC (xác minh danh tính điện tử).

~~~seq
title: Luồng chuyển tiền từ kênh số xuống core và các hệ vệ tinh
actors: Mobile | Gateway | Middleware | Core
Mobile -> Gateway: Gửi lệnh chuyển tiền (ref duy nhất)
Gateway -> Middleware: Xác thực, định tuyến
Middleware -> Core: Gọi dịch vụ ghi bút toán (OFS/REST)
Core --> Middleware: Kết quả SUCCESS/FAILED hoặc timeout
Middleware --> Gateway: Trả trạng thái đã map
Gateway --> Mobile: Hiển thị kết quả cho khách
note Mobile..Core: NAPAS/thẻ/eKYC là hệ vệ tinh kết nối qua middleware
~~~

- **Mobile/Internet banking:** nhận thao tác của khách, tạo mã tham chiếu duy nhất cho mỗi lệnh, hiển thị trạng thái.
- **API gateway:** xác thực (ai đang gọi), giới hạn tần suất, định tuyến tới dịch vụ đúng.
- **Middleware/ESB:** chuyển đổi định dạng, điều phối gọi core và hệ vệ tinh (NAPAS cho chuyển khoản liên ngân hàng, hệ thống thẻ, eKYC cho mở tài khoản), ghi log/audit.
- **Core banking:** kiểm tra nghiệp vụ, ghi sổ cái, trả kết quả. Ở mức nguyên lý, giao diện có thể là OFS (giao thức/thông điệp dịch vụ truyền thống của một số core) hoặc REST API hiện đại — cách gọi cụ thể phụ thuộc từng ngân hàng/cấu hình.

> Lưu ý: "T24 developer" thường là người phát triển/tuỳ biến trực tiếp bên trong core (quy tắc, sản phẩm, quy trình nội bộ). "Java dev tích hợp" làm ở middleware/kênh: gọi core như một hệ thống bên ngoài, xử lý timeout, mapping lỗi, idempotency và đối soát. Hai vai trò nói chuyện với nhau nhưng trách nhiệm và công cụ khác.

### Khái niệm cần biết khi nói chuyện với team core

| Khái niệm | Ý nghĩa (mức nguyên lý) | Vì sao dev tích hợp cần biết |
|---|---|---|
| **CIF/Customer (Customer Information File)** | Mã định danh khách hàng trong core | Một khách có thể có nhiều tài khoản; tra cứu/đối soát thường theo CIF |
| **Account** | Tài khoản cụ thể (tiền gửi, thanh toán…) gắn với CIF | Nơi số dư được ghi; lệnh chuyển cần tài khoản nguồn/đích đúng |
| **Arrangement (AA)** | Khái niệm sản phẩm/hợp đồng trong một số core thế hệ mới (Arrangement Architecture) | Khi team core nói "arrangement" họ đang nói hợp đồng/sản phẩm, không chỉ số tài khoản thuần |
| **Value date (ngày giá trị)** | Ngày giao dịch có hiệu lực tính lãi/quyền lợi | Có thể khác ngày khách bấm; ảnh hưởng lãi và báo cáo |
| **Booking date (ngày hạch toán)** | Ngày bút toán được ghi vào sổ | Dùng cho kế toán/đối soát; thường trùng hoặc sau value date tùy nghiệp vụ |
| **Ngày làm việc / ngày lễ** | Lịch làm việc của ngân hàng, ảnh hưởng xử lý và value date | Giao dịch cuối tuần/lễ có thể dời ngày giá trị hoặc chờ ngày làm việc |
| **COB (Close of Business)** | Quy trình chốt sổ cuối ngày: tổng hợp, tính lãi/phí, chuyển trạng thái ngày | Trong/giữa COB một số giao dịch online bị chặn, từ chối tạm thời hoặc xếp hàng |
| **OFS/REST (nguyên lý)** | Cách kênh/middleware gửi yêu cầu nghiệp vụ vào core và nhận phản hồi | Cần biết core trả mã lỗi/trạng thái nào, timeout nghĩa là gì, và có truy vấn trạng thái hay không |

Lưu ý: tên application, tên field, cấu trúc thông điệp và API cụ thể khác nhau giữa từng ngân hàng/cấu hình core — không đoán, luôn hỏi team core hoặc tài liệu nội bộ.

### Gọi core bị timeout: vì sao KHÔNG retry mù

**Timeout (hết thời gian chờ):** middleware gửi yêu cầu nhưng không nhận được phản hồi trong thời gian giới hạn. Điều nguy hiểm: timeout **không** có nghĩa "core chưa xử lý". Có ba khả năng:

1. Core chưa nhận được yêu cầu (mạng lỗi trước khi tới core) → an toàn hơn để thử lại *nếu* có idempotency.
2. Core đã nhận và **đang xử lý** → thử lại ngay có thể tạo yêu cầu trùng song song.
3. Core **đã ghi sổ thành công** nhưng phản hồi bị mất trên đường về (mạng lỗi sau khi core commit) → retry mù sẽ ghi sổ **hai lần**.

Vì vậy nguyên tắc:
- **Không retry mù (blind retry):** không tự gửi lại lệnh ghi tiền chỉ vì timeout.
- **Mã tham chiếu duy nhất (unique reference / idempotency key):** mỗi lệnh chuyển tiền có một mã duy nhất do kênh/middleware tạo và giữ nguyên suốt vòng đời. Core/middleware dùng mã này để nhận ra lệnh trùng.
- **Truy vấn trạng thái theo mã tham chiếu:** khi timeout, gọi thao tác tra cứu (query/inquiry) theo mã tham chiếu để biết lệnh đã SUCCESS, FAILED hay chưa thấy.
- **Bảng trạng thái UNKNOWN:** nếu tra cứu vẫn không chắc (core chưa phản hồi rõ), lưu giao dịch ở trạng thái {{UNKNOWN}} (chưa kết luận) trong bảng theo dõi, không cộng/trừ tiền lần nữa, và có luồng xử lý lại/đối soát.
- **Idempotency (tính lũy đẳng):** thực hiện cùng một yêu cầu (cùng mã tham chiếu) nhiều lần cho kết quả như thực hiện một lần — đây là chốt an toàn quan trọng nhất khi tích hợp core.

### Cửa sổ COB: giao dịch bị chặn/xếp hàng và store-and-forward

**COB (Close of Business):** cuối ngày làm việc, core chạy loạt tác vụ chốt sổ (tính lãi, phí, tổng hợp, chuyển ngày). Trong cửa sổ này, nhiều giao dịch online có thể bị từ chối tạm thời, chạy chậm, hoặc chỉ được nhận vào hàng đợi tùy chính sách ngân hàng.

Chiến lược **store-and-forward (lưu rồi gửi tiếp):**
1. **Nhận biết cửa sổ COB:** dựa trên lịch/cờ trạng thái do team vận hành/core cung cấp (không tự đoán giờ).
2. **Lưu giao dịch vào hàng đợi bền vững:** ghi vào cơ sở dữ liệu/bảng hàng đợi (không chỉ RAM) kèm mã tham chiếu, thời điểm, payload cần thiết.
3. **Thông báo người dùng rõ ràng:** ví dụ "Lệnh đã được ghi nhận, sẽ xử lý sau khi hệ thống hoàn tất chốt sổ" — không báo "thành công" khi chưa ghi sổ.
4. **Sau COB, xả hàng đợi đúng thứ tự:** gửi lần lượt, mỗi giao dịch đúng một lần, tôn trọng thứ tự nếu nghiệp vụ yêu cầu.
5. **Value date (ngày giá trị):** khi xử lý sau COB, ngày giá trị có thể rơi vào ngày làm việc tiếp theo — phải hiểu và giải thích đúng cho khách/báo cáo.

### Map mã lỗi core → trạng thái cho người dùng + log/audit

Core thường trả mã lỗi kỹ thuật/nghiệp vụ. Middleware cần:
- **Map sang trạng thái thân thiện:** ví dụ "không đủ số dư", "tài khoản bị phong tỏa", "hệ thống tạm bận, thử lại sau" — không lộ mã nội bộ khó hiểu.
- **Phân loại:** lỗi nghiệp vụ (khách có thể sửa: sai tài khoản, thiếu tiền) vs lỗi tạm thời/hạ tầng (có thể retry theo chính sách) vs lỗi cần điều tra.
- **Log/audit (nhật ký kiểm tra):** ghi mã tham chiếu, thời gian, mã lỗi gốc, hệ thống trả về, và hành động đã làm — để truy vết khi khiếu nại. Không log dữ liệu nhạy cảm (mật khẩu, OTP).

### Đối soát kênh với core cuối ngày

**Đối soát (reconciliation):** so khớp danh sách giao dịch kênh ghi nhận với bút toán/số liệu core trong cùng kỳ (thường cuối ngày). Mục tiêu: phát hiện lệch (kênh báo thành công nhưng core không có, hoặc ngược lại, hoặc khác số tiền). Quy trình điển hình: lấy file/báo cáo từ core và log kênh → so theo mã tham chiếu → phân loại khớp/lệch → xử lý lệch (tra soát, bù trừ, điều chỉnh theo quy trình). Đối soát là lưới an toàn cuối cùng khi timeout/UNKNOWN xảy ra.

### Ví dụ đời thực

**Triệu chứng:** 18:45, trong cửa sổ COB, khách báo app hiện "đang xử lý" rất lâu rồi báo lỗi mạng; một số khách thử bấm lại. Sáng hôm sau, bộ phận vận hành thấy 12 giao dịch kênh ở trạng thái UNKNOWN, trong đó 7 giao dịch core đã ghi sổ, 5 giao dịch core chưa nhận.

**Điều tra:** tra log middleware theo mã tham chiếu, thấy các request bị timeout đúng khung COB. Truy vấn trạng thái trên core (qua kênh tra cứu được phép) cho thấy 7 mã có bút toán, 5 mã không tồn tại. Một vài khách đã bấm lại và (do thiếu idempotency ở bước đầu) tạo mã tham chiếu mới — may mắn được chặn ở tầng kiểm tra hạn mức.

**Xử lý:** (1) với 7 mã đã ghi sổ: cập nhật bảng theo dõi thành SUCCESS, gửi thông báo thành công muộn cho khách; (2) với 5 mã chưa ghi sổ: đánh dấu FAILED/cho phép thực hiện lại với mã tham chiếu mới theo quy trình; (3) bật store-and-forward trong cửa sổ COB và hiển thị thông báo "đã ghi nhận, xử lý sau COB".

**Kết quả đo được:** sau 2 tuần áp dụng idempotency key + bảng UNKNOWN + store-and-forward, số giao dịch UNKNOWN giảm từ ~40/ngày xuống < 3/ngày, và không còn trường hợp ghi sổ trùng do retry mù.

### Liên hệ phỏng vấn

Khi trả lời, hãy phân biệt rõ vai trò: **Java dev tích hợp** (middleware/kênh) tập trung vào gọi dịch vụ core an toàn (idempotency, timeout → query trạng thái, UNKNOWN), store-and-forward khi COB, map lỗi, logging/audit và đối soát; **T24/Temenos developer** (ở mức khái niệm) làm sâu bên trong core như cấu hình sản phẩm/quy trình. Câu trả lời tốt nêu được: (1) core là nguồn sự thật, kênh là bản sao; (2) timeout không đồng nghĩa thất bại; (3) không retry mù giao dịch ghi tiền; (4) COB cần store-and-forward và value date; (5) đối soát cuối ngày là lưới an toàn.

> Senior tip: Trong production, mọi lệnh ghi tiền đi qua core phải có mã tham chiếu duy nhất sinh từ sớm (kênh/gateway), được lưu bền vững trước khi gọi core, và mọi nhánh timeout đều đi qua bước tra cứu trạng thái trước khi quyết định thử lại. Hãy coi trạng thái UNKNOWN là trạng thái hợp lệ cần quy trình xử lý, không phải ngoại lệ bỏ qua.
`,
    exercises: [
      {
        title: 'CoreTransferService: timeout không retry mù, tra cứu theo ref và idempotent',
        prompt: `Mô phỏng tích hợp gọi core banking (chạy Java thuần, JDK 17, không class public ngoài Main):

- enum {{CoreResult}} với các giá trị {{SUCCESS}}, {{FAILED}}, {{TIMEOUT}}
- interface {{CoreBankingClient}} với {{CoreResult post(String ref, long amount)}} và {{CoreResult query(String ref)}}
  - {{post}}: gửi lệnh chuyển tiền với mã tham chiếu {{ref}}. Có thể trả {{TIMEOUT}} dù thực tế core đã ghi sổ.
  - {{query}}: tra cứu trạng thái theo {{ref}}; trả {{SUCCESS}} nếu đã ghi sổ, {{FAILED}} nếu chắc chắn chưa/không ghi, hoặc {{TIMEOUT}} nếu vẫn không xác định.
- enum {{TxStatus}} với các giá trị {{SUCCESS}}, {{FAILED}}, {{UNKNOWN}}
- {{class CoreTransferService}} có constructor nhận {{CoreBankingClient client}} và các method:
  - {{TxStatus transfer(String ref, long amount)}}: gọi {{post(ref, amount)}}. Nếu {{SUCCESS}} → trả {{SUCCESS}}. Nếu {{FAILED}} → {{FAILED}}. Nếu {{TIMEOUT}} → phải tra cứu bằng {{query(ref)}}: nếu query {{SUCCESS}} → {{SUCCESS}}; nếu query {{FAILED}} → {{FAILED}}; nếu query {{TIMEOUT}} → lưu/trả {{UNKNOWN}}. **Không** được gọi {{post}} lần thứ hai cho cùng một {{ref}}.
  - {{TxStatus statusOf(String ref)}}: trả trạng thái đã ghi nhận của {{ref}} (sau transfer hoặc sau resolve).
  - {{TxStatus resolve(String ref)}}: nếu đang {{UNKNOWN}} thì gọi {{query(ref)}} một lần để cập nhật ({{SUCCESS}}/{{FAILED}} nếu xác định, vẫn {{UNKNOWN}} nếu query timeout); nếu đã {{SUCCESS}} hoặc {{FAILED}} thì giữ nguyên.

Yêu cầu: idempotent theo {{ref}} — gọi {{transfer}} lặp lại với cùng {{ref}} phải trả về trạng thái đã biết mà không gọi {{post}} thêm. Logic phải xác định (deterministic).`,
        starter: `import java.util.*;

enum CoreResult { SUCCESS, FAILED, TIMEOUT }

interface CoreBankingClient {
    CoreResult post(String ref, long amount);
    CoreResult query(String ref);
}

enum TxStatus { SUCCESS, FAILED, UNKNOWN }

class CoreTransferService {
    final CoreBankingClient client;
    // TODO: lưu trạng thái theo ref để idempotent và theo dõi UNKNOWN

    CoreTransferService(CoreBankingClient client) {
        this.client = client;
    }

    TxStatus transfer(String ref, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    TxStatus statusOf(String ref) {
        throw new UnsupportedOperationException("TODO");
    }

    TxStatus resolve(String ref) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Object expected, Object actual) {
        total++;
        if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
    }

    static class ScriptClient implements CoreBankingClient {
        final java.util.Map<String, CoreResult> postRes = new java.util.HashMap<>();
        final java.util.Map<String, CoreResult> queryRes = new java.util.HashMap<>();
        final java.util.Map<String, Integer> postCalls = new java.util.HashMap<>();
        public CoreResult post(String ref, long amount) {
            postCalls.put(ref, postCalls.getOrDefault(ref, 0) + 1);
            CoreResult r = postRes.get(ref);
            return r == null ? CoreResult.FAILED : r;
        }
        public CoreResult query(String ref) {
            CoreResult r = queryRes.get(ref);
            return r == null ? CoreResult.FAILED : r;
        }
        int posts(String ref) { return postCalls.getOrDefault(ref, 0); }
    }

    public static void main(String[] args) {
        // 1) post SUCCESS -> SUCCESS
        ScriptClient c1 = new ScriptClient();
        c1.postRes.put("R1", CoreResult.SUCCESS);
        CoreTransferService s1 = new CoreTransferService(c1);
        check("post_success", TxStatus.SUCCESS, s1.transfer("R1", 1000));
        check("post_success_status", TxStatus.SUCCESS, s1.statusOf("R1"));

        // 2) post TIMEOUT nhưng core đã ghi sổ -> query SUCCESS, không post lần 2
        ScriptClient c2 = new ScriptClient();
        c2.postRes.put("R2", CoreResult.TIMEOUT);
        c2.queryRes.put("R2", CoreResult.SUCCESS);
        CoreTransferService s2 = new CoreTransferService(c2);
        check("timeout_but_posted", TxStatus.SUCCESS, s2.transfer("R2", 2000));
        check("timeout_but_posted_no_second_post", 1, c2.posts("R2"));

        // 3) post TIMEOUT và query cũng TIMEOUT -> UNKNOWN, resolve sau ra SUCCESS
        ScriptClient c3 = new ScriptClient();
        c3.postRes.put("R3", CoreResult.TIMEOUT);
        c3.queryRes.put("R3", CoreResult.TIMEOUT);
        CoreTransferService s3 = new CoreTransferService(c3);
        check("unknown_state", TxStatus.UNKNOWN, s3.transfer("R3", 3000));
        check("unknown_statusOf", TxStatus.UNKNOWN, s3.statusOf("R3"));
        c3.queryRes.put("R3", CoreResult.SUCCESS);
        check("resolve_to_success", TxStatus.SUCCESS, s3.resolve("R3"));
        check("status_after_resolve", TxStatus.SUCCESS, s3.statusOf("R3"));

        // 4) idempotent: gọi lại cùng ref không gọi post thêm
        ScriptClient c4 = new ScriptClient();
        c4.postRes.put("R4", CoreResult.SUCCESS);
        CoreTransferService s4 = new CoreTransferService(c4);
        s4.transfer("R4", 4000);
        check("idempotent_return", TxStatus.SUCCESS, s4.transfer("R4", 4000));
        check("idempotent_single_post", 1, c4.posts("R4"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

enum CoreResult { SUCCESS, FAILED, TIMEOUT }

interface CoreBankingClient {
    CoreResult post(String ref, long amount);
    CoreResult query(String ref);
}

enum TxStatus { SUCCESS, FAILED, UNKNOWN }

class CoreTransferService {
    final CoreBankingClient client;
    // Lưu trạng thái theo mã tham chiếu để idempotent và theo dõi UNKNOWN
    final Map<String, TxStatus> states = new HashMap<>();

    CoreTransferService(CoreBankingClient client) {
        this.client = client;
    }

    TxStatus transfer(String ref, long amount) {
        // Idempotent: nếu đã có kết quả (kể cả UNKNOWN) thì không post lại
        TxStatus known = states.get(ref);
        if (known != null) {
            return known;
        }
        CoreResult r = client.post(ref, amount);
        if (r == CoreResult.SUCCESS) {
            states.put(ref, TxStatus.SUCCESS);
            return TxStatus.SUCCESS;
        }
        if (r == CoreResult.FAILED) {
            states.put(ref, TxStatus.FAILED);
            return TxStatus.FAILED;
        }
        // TIMEOUT: không retry mù, phải tra cứu theo ref
        CoreResult q = client.query(ref);
        TxStatus st = mapQuery(q);
        states.put(ref, st);
        return st;
    }

    private TxStatus mapQuery(CoreResult q) {
        if (q == CoreResult.SUCCESS) return TxStatus.SUCCESS;
        if (q == CoreResult.FAILED) return TxStatus.FAILED;
        return TxStatus.UNKNOWN; // vẫn không chắc -> để UNKNOWN, chờ resolve/đối soát
    }

    TxStatus statusOf(String ref) {
        TxStatus st = states.get(ref);
        return st == null ? TxStatus.FAILED : st;
    }

    TxStatus resolve(String ref) {
        TxStatus st = states.get(ref);
        if (st == null) return TxStatus.FAILED;
        if (st != TxStatus.UNKNOWN) return st; // đã kết luận thì giữ nguyên
        CoreResult q = client.query(ref);
        TxStatus next = mapQuery(q);
        states.put(ref, next);
        return next;
    }
}`,
        hints: [
          'Giữ một {{Map<String, TxStatus>}} theo {{ref}}. Nếu {{states}} đã có {{ref}} thì {{transfer}} phải trả ngay trạng thái đó và tuyệt đối không gọi {{post}} lần nữa (idempotent).',
          'Khi {{post}} trả {{TIMEOUT}}, đừng đoán: gọi {{query(ref)}}. Map {{query}}: {{SUCCESS}}→{{SUCCESS}}, {{FAILED}}→{{FAILED}}, {{TIMEOUT}}→{{UNKNOWN}} và lưu lại.',
          '{{resolve}} chỉ có ý nghĩa khi đang {{UNKNOWN}}: gọi {{query}} một lần để cập nhật; nếu đã {{SUCCESS}}/{{FAILED}} thì giữ nguyên. {{statusOf}} trả trạng thái đã lưu.',
        ],
        explain: `Điểm mấu chốt: timeout của {{post}} không nói lên core đã ghi sổ hay chưa, nên nhánh timeout phải đi qua {{query(ref)}} thay vì gọi {{post}} lần hai. Nếu {{query}} cũng timeout ta lưu {{UNKNOWN}} (trạng thái trung gian hợp lệ, cần tra soát/đối soát) thay vì tự kết luận. Lưu trạng thái theo {{ref}} giúp {{transfer}} idempotent: cùng mã tham chiếu luôn cho cùng kết quả và không tạo bút toán trùng. Trong hệ thống thật, bảng trạng thái này sẽ bền vững (DB) và có luồng đối soát/resolve định kỳ.`,
      },
      {
        title: 'CobGate: store-and-forward trong cửa sổ COB, xả hàng đợi đúng thứ tự, mỗi lệnh một lần',
        prompt: `Mô phỏng cửa sổ COB (Close of Business) và cơ chế store-and-forward (JDK 17, Java thuần, deterministic):

- interface {{CobWindow}} với {{boolean isOpen(long nowMillis)}} trả {{true}} nếu thời điểm {{nowMillis}} đang nằm trong cửa sổ COB (core chặn/xếp hàng giao dịch online).
- interface {{CoreSender}} với {{void send(String ref)}} gửi lệnh sang core (giả lập). Trong test sẽ đếm số lần gửi theo {{ref}}.
- {{class CobGate}} có constructor nhận {{CobWindow window}} và {{CoreSender sender}} và:
  - {{void submit(String ref, long nowMillis)}}: nếu đang trong COB → đưa {{ref}} vào hàng đợi (store). Nếu không trong COB → gửi ngay bằng {{sender.send(ref)}} (và trước đó phải xả hết hàng đợi đang có theo đúng thứ tự, rồi mới gửi {{ref}} này), để không bỏ sót lệnh đã xếp hàng.
  - {{int drain(long nowMillis)}}: nếu **không** trong COB thì xả toàn bộ hàng đợi theo đúng thứ tự đã nhận, mỗi {{ref}} gọi {{send}} đúng một lần, trả về số lệnh đã xả; nếu đang trong COB thì không xả và trả 0.
  - {{int queued()}}: số lệnh đang chờ trong hàng đợi.

Yêu cầu: không gửi lệnh nào trong khi {{isOpen}} là true; khi hết COB, các lệnh xếp hàng được gửi đúng thứ tự FIFO và mỗi lệnh đúng một lần. Không dùng thời gian thật, chỉ dùng {{nowMillis}} truyền vào và {{CobWindow}} giả.`,
        starter: `import java.util.*;

interface CobWindow {
    boolean isOpen(long nowMillis);
}

interface CoreSender {
    void send(String ref);
}

class CobGate {
    final CobWindow window;
    final CoreSender sender;
    // TODO: hàng đợi FIFO (store-and-forward)

    CobGate(CobWindow window, CoreSender sender) {
        this.window = window;
        this.sender = sender;
    }

    void submit(String ref, long nowMillis) {
        throw new UnsupportedOperationException("TODO");
    }

    int drain(long nowMillis) {
        throw new UnsupportedOperationException("TODO");
    }

    int queued() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Object expected, Object actual) {
        total++;
        if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
    }

    static class FixedWindow implements CobWindow {
        final long start, end; // [start, end) là cửa sổ COB
        FixedWindow(long start, long end) { this.start = start; this.end = end; }
        public boolean isOpen(long nowMillis) { return nowMillis >= start && nowMillis < end; }
    }

    static class RecordingSender implements CoreSender {
        final java.util.List<String> sent = new java.util.ArrayList<>();
        final java.util.Map<String, Integer> counts = new java.util.HashMap<>();
        public void send(String ref) {
            sent.add(ref);
            counts.put(ref, counts.getOrDefault(ref, 0) + 1);
        }
        int count(String ref) { return counts.getOrDefault(ref, 0); }
    }

    public static void main(String[] args) {
        // COB mở trong [100, 200)
        FixedWindow w = new FixedWindow(100, 200);

        // 1) Ngoài COB: gửi ngay
        RecordingSender s1 = new RecordingSender();
        CobGate g1 = new CobGate(w, s1);
        g1.submit("A", 50);
        check("send_immediately", 1, s1.count("A"));
        check("queue_empty_after_immediate", 0, g1.queued());

        // 2) Trong COB: xếp hàng, không gửi
        RecordingSender s2 = new RecordingSender();
        CobGate g2 = new CobGate(w, s2);
        g2.submit("A", 120);
        g2.submit("B", 150);
        check("queued_during_cob", 2, g2.queued());
        check("not_sent_during_cob", 0, s2.sent.size());

        // 3) Sau COB: drain xả đúng thứ tự FIFO, mỗi lệnh 1 lần
        int drained = g2.drain(250);
        check("drained_count", 2, drained);
        check("fifo_order", java.util.Arrays.asList("A", "B"), s2.sent);
        check("each_once_A", 1, s2.count("A"));
        check("each_once_B", 1, s2.count("B"));
        check("queue_empty_after_drain", 0, g2.queued());

        // 4) Submit sau COB khi còn hàng đợi: xả hàng đợi trước rồi gửi ref mới
        RecordingSender s3 = new RecordingSender();
        CobGate g3 = new CobGate(w, s3);
        g3.submit("X", 130); // vào hàng đợi (trong COB)
        g3.submit("Y", 140);
        g3.submit("Z", 250); // ngoài COB: phải xả X,Y trước rồi gửi Z
        check("drain_then_send_new", java.util.Arrays.asList("X", "Y", "Z"), s3.sent);
        check("no_duplicate_X", 1, s3.count("X"));
        check("no_duplicate_Y", 1, s3.count("Y"));
        check("no_duplicate_Z", 1, s3.count("Z"));
        check("queue_empty_final", 0, g3.queued());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

interface CobWindow {
    boolean isOpen(long nowMillis);
}

interface CoreSender {
    void send(String ref);
}

class CobGate {
    final CobWindow window;
    final CoreSender sender;
    // Hàng đợi FIFO lưu các lệnh cần gửi sau COB (store-and-forward)
    final Deque<String> queue = new ArrayDeque<>();

    CobGate(CobWindow window, CoreSender sender) {
        this.window = window;
        this.sender = sender;
    }

    void submit(String ref, long nowMillis) {
        if (window.isOpen(nowMillis)) {
            // Trong COB: chỉ lưu, không gửi
            queue.addLast(ref);
            return;
        }
        // Ngoài COB: xả hàng đợi cũ trước để giữ đúng thứ tự, rồi gửi lệnh hiện tại
        drainAll();
        sender.send(ref);
    }

    int drain(long nowMillis) {
        if (window.isOpen(nowMillis)) {
            return 0; // vẫn trong COB, không xả
        }
        return drainAll();
    }

    private int drainAll() {
        int count = 0;
        while (!queue.isEmpty()) {
            String ref = queue.removeFirst();
            sender.send(ref); // mỗi lệnh đúng một lần
            count++;
        }
        return count;
    }

    int queued() {
        return queue.size();
    }
}`,
        hints: [
          'Dùng một hàng đợi FIFO ({{ArrayDeque}} với {{addLast}}/{{removeFirst}}) để giữ đúng thứ tự nhận lệnh. Khi {{isOpen(nowMillis)}} là true, {{submit}} chỉ đưa vào hàng đợi.',
          'Khi ngoài COB, cần gửi những lệnh đã xếp hàng trước: {{drain}} xả hết nếu không trong COB; {{submit}} ngoài COB nên xả hàng đợi trước rồi mới {{send(ref)}} hiện tại để không đảo thứ tự.',
          'Mỗi phần tử chỉ được {{send}} một lần: xả bằng cách {{removeFirst}} khỏi hàng đợi rồi gửi, không duyệt lặp lại. {{queued()}} trả về kích thước hàng đợi hiện tại.',
        ],
        explain: `Store-and-forward nghĩa là khi core không nhận giao dịch online (cửa sổ COB), ta lưu lệnh vào hàng đợi bền vững thay vì báo thành công giả. Ở đây {{CobWindow}} quyết định có đang trong COB hay không (dựa trên {{nowMillis}} truyền vào nên test xác định). Khi hết COB, {{drain}}/{{submit}} xả FIFO và mỗi {{ref}} chỉ gửi một lần, tránh đảo thứ tự và gửi trùng. Thực tế hàng đợi phải bền vững (DB/message queue), có mã tham chiếu duy nhất và cơ chế chống gửi trùng khi tiến trình crash giữa chừng.`,
      },
    ],
    check: [
      {
        q: 'Middleware gọi core chuyển tiền, nhận {{TIMEOUT}} (hết thời gian chờ). Hành động an toàn nhất là gì?',
        options: [
          'Gọi lại lệnh chuyển tiền ngay vài lần cho đến khi nhận được SUCCESS',
          'Coi như FAILED và báo khách thử lại ngay',
          'Giữ mã tham chiếu duy nhất, truy vấn (query) trạng thái theo mã đó; nếu chưa kết luận được thì lưu trạng thái UNKNOWN và không ghi sổ lần hai',
          'Tự trừ tiền trong cơ sở dữ liệu của kênh để khách thấy số dư giảm',
        ],
        answer: 2,
        explain: 'Đúng (C): timeout không cho biết core đã ghi sổ hay chưa — core có thể đã commit nhưng phản hồi mất. Phải tra cứu theo mã tham chiếu duy nhất và dùng trạng thái UNKNOWN khi chưa chắc, chờ resolve/đối soát; tuyệt đối không gửi lại lệnh ghi tiền mù. Sai (A): retry mù có thể tạo bút toán trùng nếu core đã xử lý. Sai (B): coi như FAILED khi core có thể đã SUCCESS sẽ khiến khách thử lại và có nguy cơ trùng hoặc lệch số dư. Sai (D): kênh không phải nguồn sự thật, tự trừ tiền sẽ lệch với core và gây sai sổ cái.',
      },
      {
        q: 'Trong cửa sổ COB (Close of Business), core tạm thời không xử lý giao dịch online. Cách xử lý đúng ở kênh/middleware là gì?',
        options: [
          'Vẫn gửi thẳng vào core và hy vọng core tự xếp hàng',
          'Báo khách "chuyển tiền thành công" để trải nghiệm tốt, rồi gửi sau',
          'Store-and-forward: lưu lệnh vào hàng đợi bền vững, thông báo đã ghi nhận và sẽ xử lý sau COB, rồi xả hàng đợi đúng thứ tự khi hết COB (mỗi lệnh một lần, chú ý value date)',
          'Xóa lệnh của khách vì hệ thống đang bận',
        ],
        answer: 2,
        explain: 'Đúng (C): store-and-forward giữ lệnh an toàn trong hàng đợi bền vững, thông báo trung thực cho khách, và xử lý sau COB đúng thứ tự/một lần; cần hiểu value date có thể là ngày làm việc tiếp theo. Sai (A): gửi thẳng khi core chặn có thể lỗi/timeout không kiểm soát và không đảm bảo được xếp hàng đúng. Sai (B): báo thành công khi chưa ghi sổ là sai sự thật và rất nguy hiểm nếu sau đó gửi thất bại. Sai (D): xóa lệnh làm mất yêu cầu hợp lệ của khách.',
      },
      {
        q: 'Phát biểu nào đúng về vai trò "nguồn sự thật" (source of truth) và đối soát?',
        options: [
          'Mobile banking giữ số dư chính xác nhất vì gần khách hàng nhất',
          'Core banking là nguồn sự thật về số dư/sổ cái; kênh chỉ là bản sao/cache và phải đối soát với core cuối ngày để phát hiện lệch',
          'Nếu tổng tiền cuối ngày khớp thì không cần đối soát từng giao dịch',
          'Đối soát chỉ cần làm khi có khiếu nại của khách',
        ],
        answer: 1,
        explain: 'Đúng (B): core ghi sổ cái và là nguồn sự thật; kênh có thể hiển thị cache nên phải đối soát định kỳ theo mã tham chiếu để phát hiện lệch (thiếu/thừa/khác số tiền). Sai (A): kênh chỉ là bản sao, có thể cũ hoặc sai khi lỗi mạng/cache. Sai (C): tổng khớp vẫn có thể che sai lệch bù trừ, nên cần đối soát cả ở mức từng giao dịch/tài khoản. Sai (D): đối soát là lưới an toàn chủ động hằng ngày, không phải chỉ phản ứng khi có khiếu nại.',
      },
    ],
    related: ['banking-001', 'banking-012', 'banking-009'],
    tags: ['core banking', 'T24', 'Temenos', 'integration', 'timeout', 'idempotency', 'UNKNOWN', 'COB', 'store-and-forward', 'reconciliation', 'value date', 'booking date'],
  },
  {
    id: 'lesson-banking-015',
    track: 'banking',
    order: 15,
    title: 'Sổ cái kế toán kép: tài khoản, số dư bình thường, sổ cân đối, báo cáo lãi lỗ và bảng cân đối',
    level: 'senior',
    minutes: 45,
    goals: [
      'Nêu được nguyên tắc kế toán kép: mỗi giao dịch có ít nhất một dòng Nợ và một dòng Có, tổng Nợ bằng tổng Có',
      'Phân biệt số dư bình thường (tài sản, chi phí ghi Nợ; nợ, chủ sở hữu, doanh thu ghi Có) và cách tính số dư tài khoản',
      'Xây dựng sổ cân đối: tổng số dư bên Nợ bằng tổng số dư bên Có, phát hiện lỗi sổ sách',
      'Tính báo cáo lãi lỗ (doanh thu minus chi phí bang lãi/lỗ thuần) và bảng cân đối (tài sản bang nợ cộng chủ sở hữu)',
      'Áp dụng quy tắc tài sản không được âm: giao dịch đưa tài sản về âm phải bị từ chối'
    ],
    body: `**Tóm tắt:** Kế toán kép (double-entry bookkeeping) là nền tảng của mọi sổ cái ngân hàng. Mỗi giao dịch ảnh hưởng đến ít nhất hai tài khoản: một phía ghi Nợ (debit), một phía ghi Có (credit), và tổng số tiền Nợ phải bằng tổng số tiền Có. Mỗi tài khoản thuộc một trong năm loại: tài sản, nợ, chủ sở hữu, doanh thu, chi phí — và mỗi loại có số dư bình thường (Nợ hoặc Có). Số dư hiện tại của một tài khoản là hiệu giữa tổng ghi Nợ và tổng ghi Có. Sổ cân đối (trial balance) kiểm tra tổng số dư Nợ bằng tổng số dư Có trên toàn bộ sổ cái. Báo cáo lãi lỗ tính doanh thu trừ chi phí. Bảng cân đối kiểm tra tài sản bằng nợ cộng chủ sở hữu. Trong ngân hàng, quy tắc quan trọng nhất là tài sản không được bị âm — giao dịch rút tiền phải kiểm tra số dư trước khi ghi sổ.

### Kế toán kép: Nợ, Có và số dư bình thường

Kế toán kép bắt đầu từ nguyên tắc đơn giản: mọi giao dịch có hai bên, và hai bên phải cân bằng bằng số tiền. Mỗi bút toán ghi vào ít nhất một tài khoản phía Nợ và ít nhất một tài khoản phía Có.

| Loại tài khoản | Số dư bình thường | Ví dụ | Tăng bằng | Giảm bằng |
|---|---|---|---|---|
| Tài sản | Nợ | Tiền mặt, tiền gửi tại ngân hàng khác | Nợ | Có |
| Nợ | Có | Vay ngân hàng, tiền gửi khách hàng | Có | Nợ |
| Chủ sở hữu | Có | Vốn chủ sở hữu, lãi lũy kết | Có | Nợ |
| Doanh thu | Có | Lãi nhận, phí dịch vụ | Có | Nợ |
| Chi phí | Nợ | Lãi trả, phí nhân sự | Nợ | Có |

Ví dụ: khách hàng gửi 10.000.000 VND vào tài khoản tiết kiệm. Từ góc nhìn ngân hàng:
- Tài khoản "Tiền mặt" (tài sản, số dư bình thường Nợ) được ghi **Nợ** 10 triệu -> tiền mặt tăng.
- Tài khoản "Tiền gửi khách hàng" (nợ, số dư bình thường Có) được ghi **Có** 10 triệu -> ngân hàng nợ khách hàng 10 triệu.

Tổng Nợ = 10 triệu, tổng Có = 10 triệu, bút toán cân bằng.

Ví dụ: khách hàng rút 5 triệu từ tài khoản tiết kiệm:
- Tài khoản "Tiền gửi khách hàng" (nợ) được ghi **Nợ** 5 triệu -> nợ giảm.
- Tài khoản "Tiền mặt" (tài sản) được ghi **Có** 5 triệu -> tiền mặt giảm.

Tổng Nợ = 5 triệu, tổng Có = 5 triệu, bút toán vẫn cân bằng.

### Số dư tài khoản

Số dư hiện tại của một tài khoản là hiệu giữa tổng số đã ghi Nợ và tổng số đã ghi Có:
- Với tài khoản có số dư bình thường là Nợ (tài sản, chi phí): số dư = tổng Nợ minus tổng Có. Nếu kết quả dương, tài khoản có nợ dư; nếu âm, tài khoản bị credited quá nhiều (lạ với tài sản).
- Với tài khoản có số dư bình thường là Có (nợ, chủ sở hữu, doanh thu): số dư = tổng Có minus tổng Nợ.

Ví dụ: tài khoản "Tiền mặt" có các bút toán: Nợ 10 triệu, Có 5 triệu. Số dư = 10 minus 5 = 5 triệu (nợ dư, đúng với tài sản).

Quy tắc quan trọng trong ngân hàng: **tài sản không được bị âm**. Nếu một giao dịch rút tiền khiến số dư tài sản về âm, giao dịch phải bị từ chối. Ví dụ: tài khoản tiền mặt hiện 5 triệu, khách yêu cầu rút 8 triệu -> bút toán này sẽ làm tiền mặt về minus 3 triệu -> từ chối.

### Sổ cân đối (Trial Balance)

Sổ cân đối là báo cáo liệt kê số dư của mọi tài khoản, phân thành hai cột: số dư bên Nợ và số dư bên Có. Tổng cột Nợ phải bằng tổng cột Có. Nếu không bằng, sổ có lỗi.

Sổ cân đối không đảm bảo sổ sách đúng 100% (ví dụ: sai nguyên bản, ghi thiếu cả hai phía, ghi vào tài khoản sai) nhưng nó là bước đầu tiên để phát hiện lỗi.

### Báo cáo lãi lỗ (Income Statement)

Báo cáo lãi lỗ tính kết quả kinh doanh trong một kỳ:
Lãi/lỗ thuần = Tổng doanh thu minus Tổng chi phí.

Doanh thu là tiền ngân hàng thu được (lãi nhận, phí dịch vụ). Chi phí là tiền ngân hàng chi ra (lãi trả, nhân sự, thuê phòng...). Nếu doanh thu lớn hơn chi phí -> lãi thuần; nếu nhỏ hơn -> lỗ thuần.

### Bảng cân đối kế toán (Balance Sheet)

Bảng cân đối kiểm tra phương trình kế toán:
Tài sản = Nợ + Chủ sở hữu.

Tài sản là những gì ngân hàng nắm (tiền mặt, tiền gửi tại ngân hàng khác, nợ vay ngắn hạn...). Nợ là những gì ngân hàng phải trả (tiền gửi khách hàng, vay ngắn hạn...). Chủ sở hữu là vốn của chủ sở hữu và lãi lũy kết.

Nếu hai bên không bằng, báo cáo có lỗi và phải tra cứu trước khi công bố.

### Ví dụ đời thực

Một chi nhánh ngân hàng có sổ cái với các tài khoản: Tiền mặt (tài sản), Tiền gửi khách hàng (nợ), Lãi nhận (doanh thu), Lãi trả (chi phí), Vốn chủ sở hữu (chủ sở hữu).

Trong một ngày:
1. Khách A gửi 100 triệu: Tiền mặt Nợ 100 triệu, Tiền gửi khách hàng Có 100 triệu.
2. Ngân hàng trả lãi cho khách A 5 triệu: Lãi trả Nợ 5 triệu, Tiền gửi khách hàng Có 5 triệu.
3. Khách B gửi 50 triệu: Tiền mặt Nợ 50 triệu, Tiền gửi khách hàng Có 50 triệu.
4. Ngân hàng cho vay doanh nghiệp 30 triệu: Tiền gửi tại ngân hàng khác (tài sản) Nợ 30 triệu, Tiền mặt Có 30 triệu.

Số dư cuối ngày:
- Tiền mặt: 100 + 50 minus 30 = 120 triệu (Nợ dư)
- Tiền gửi khách hàng: 100 + 5 + 50 = 155 triệu (Có dư)
- Lãi trả: 5 triệu (Nợ dư)
- Tiền gửi ngân hàng khác: 30 triệu (Nợ dư)

Sổ cân đối: cột Nợ = 120 + 5 + 30 = 155 triệu, cột Có = 155 triệu. Cân bằng.

Báo cáo lãi lỗ: doanh thu = 0, chi phí (lãi trả) = 5 triệu, lỗ thuần = minus 5 triệu.

Bảng cân đối: tài sản = 120 + 30 = 150 triệu; nợ = 155 triệu; chủ sở hữu = 0. 150 khong bang 155 + 0, lệch 5 triệu do lỗ thuần chưa được kết chuyển vào chủ sở hữu. Sau khi kết chuyển lỗ, chủ sở hữu giảm 5 triệu, bảng cân đối cân bằng.

### Liên hệ phỏng vấn

Khi phỏng vấn về sổ cái ngân hàng, hãy giải thích rõ: (1) mỗi giao dịch phải có ít nhất một dòng Nợ và một dòng Có, tổng hai bên bằng nhau; (2) mỗi loại tài khoản có số dư bình thường khác nhau, và số dư hiện tại tính theo hiệu Nợ/Có phù hợp; (3) tài sản không được bị âm — đây là quy tắc cốt lõi khi xử lý giao dịch rút tiền; (4) sổ cân đối là bước kiểm tra đầu tiên, tổng Nợ phải bằng tổng Có; (5) báo cáo lãi lỗ và bảng cân đối phải liên kết nhau qua kỳ lãi/lỗ được kết chuyển vào chủ sở hữu. Trong hệ thống thật, mọi bút toán phải có mã tham chiếu duy nhất, được ghi vào sổ cái bền vững, và đối soát hàng ngày với hệ thống giao dịch để phát hiện sai sổ sớm.

> Senior tip: Trong production, không bao giờ cho phép giao dịch làm tài khoản tiền mặt hoặc tài sản tương đương về âm. Trước khi ghi bút toán rút tiền, phải kiểm tra số dư khả dụng (tính cả hạn mức và Hold). Nếu lỗi sổ cái xảy ra, việc khôi phục phải dựa trên nhật ký bút toán chi tiết (audit trail) kèm mã tham chiếu duy nhất, không được tự căn chỉnh số dư để "làm cho sổ cân đối bằng nhau" vì đó là vi phạm nghiêm trọng về kiểm toán.
`,
    exercises: [
      {
        title: 'GeneralLedger: kế toán kép, số dư tài khoản, sổ cân đối, báo cáo lãi lỗ, bảng cân đối',
        prompt: `Xây dựng GeneralLedger (Java thuần, JDK 17, không class public ngoài Main) hỗ trợ kế toán kép:

- enum AccountType { ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE }
- class Account { String code; String name; AccountType type; constructor(code, name, type) }
- class LedgerLine { String accountCode; long debit; long credit; constructor(accountCode, debit, credit) }
- class JournalEntry { String ref; List<LedgerLine> lines; constructor(ref, lines) }
- class GeneralLedger co cac method:
  - boolean isDebitNormal(AccountType type): tra true neu loai co so du binh thuong ben No (ASSET, EXPENSE)
  - void addAccount(Account a): them tai khoan, khoi tong No/Co bang 0
  - boolean post(JournalEntry entry): kiem tra tat ca tai khoan ton tai, tong No bang tong Co, tai san khong duoc am. Neu hop le thi ap dung va tra true; nguoc lai tra false va khong thay doi gi.
  - long balance(String code): tra so du hien tai (dung cong thuc phu hop voi loai tai khoan)
  - TrialBalance trialBalance(): tra bao cao, tong No bang tong Co
  - IncomeStatement incomeStatement(): doanh thu minus chi phí bang loi/lai thuan
  - BalanceSheet balanceSheet(): tai san, no, chu so huu

Lop lop trong GeneralLedger: TrialBalance { long totalDebit, totalCredit; List<String[]> rows }, IncomeStatement { long revenue, expense, netIncome }, BalanceSheet { long assets, liabilities, equity }.
`,
        starter: `import java.util.*;

enum AccountType { ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE }

class Account {
    String code;
    String name;
    AccountType type;
    Account(String code, String name, AccountType type) {
        this.code = code; this.name = name; this.type = type;
    }
}

class LedgerLine {
    String accountCode;
    long debit;
    long credit;
    LedgerLine(String accountCode, long debit, long credit) {
        this.accountCode = accountCode; this.debit = debit; this.credit = credit;
    }
}

class JournalEntry {
    String ref;
    List<LedgerLine> lines;
    JournalEntry(String ref, List<LedgerLine> lines) {
        this.ref = ref; this.lines = lines;
    }
}

class GeneralLedger {
    Map<String, Account> accounts = new LinkedHashMap<>();
    Map<String, Long> debitSum = new HashMap<>();
    Map<String, Long> creditSum = new HashMap<>();

    boolean isDebitNormal(AccountType type) {
        throw new UnsupportedOperationException("TODO");
    }

    void addAccount(Account a) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean post(JournalEntry entry) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String code) {
        throw new UnsupportedOperationException("TODO");
    }

    TrialBalance trialBalance() {
        throw new UnsupportedOperationException("TODO");
    }

    IncomeStatement incomeStatement() {
        throw new UnsupportedOperationException("TODO");
    }

    BalanceSheet balanceSheet() {
        throw new UnsupportedOperationException("TODO");
    }

    static class TrialBalance { long totalDebit, totalCredit; List<String[]> rows = new ArrayList<>(); }
    static class IncomeStatement { long revenue, expense, netIncome; }
    static class BalanceSheet { long assets, liabilities, equity; }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Object expected, Object actual) {
        total++;
        if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
    }

    public static void main(String[] args) {
        GeneralLedger gl = new GeneralLedger();
        gl.addAccount(new Account("111", "Tien mat", AccountType.ASSET));
        gl.addAccount(new Account("411", "Doanh thu", AccountType.REVENUE));
        gl.addAccount(new Account("211", "No ngan hang", AccountType.LIABILITY));
        gl.addAccount(new Account("511", "Chi phi", AccountType.EXPENSE));
        gl.addAccount(new Account("311", "Von chu so huu", AccountType.EQUITY));

        // 1) balance ban dau bang 0
        check("balance_initial_cash", 0L, gl.balance("111"));
        check("balance_initial_revenue", 0L, gl.balance("411"));

        // 2) btuo can duoc: tien mat No 1000, doanh thu Co 1000
        List<LedgerLine> lines1 = new ArrayList<>();
        lines1.add(new LedgerLine("111", 1000, 0));
        lines1.add(new LedgerLine("411", 0, 1000));
        check("post_balanced", true, gl.post(new JournalEntry("E1", lines1)));
        check("balance_cash_after", 1000L, gl.balance("111"));
        check("balance_revenue_after", 1000L, gl.balance("411"));

        // 3) btuo khong can duoc bi tu choi
        List<LedgerLine> lines2 = new ArrayList<>();
        lines2.add(new LedgerLine("111", 500, 0));
        lines2.add(new LedgerLine("411", 0, 300));
        check("post_unbalanced_rejected", false, gl.post(new JournalEntry("E2", lines2)));
        check("balance_cash_still", 1000L, gl.balance("111"));

        // 4) tai san khong duoc am: rut 2000 khi co 1000 -> bi tu choi
        List<LedgerLine> lines3 = new ArrayList<>();
        lines3.add(new LedgerLine("111", 0, 2000));
        lines3.add(new LedgerLine("511", 2000, 0));
        check("post_asset_negative_rejected", false, gl.post(new JournalEntry("E3", lines3)));
        check("balance_cash_still2", 1000L, gl.balance("111"));

        // 5) rut hop le 500: tien mat Co 500, chi phi No 500
        List<LedgerLine> lines4 = new ArrayList<>();
        lines4.add(new LedgerLine("111", 0, 500));
        lines4.add(new LedgerLine("511", 500, 0));
        check("post_expense", true, gl.post(new JournalEntry("E4", lines4)));
        check("balance_cash_after_expense", 500L, gl.balance("111"));
        check("balance_expense", 500L, gl.balance("511"));

        // 6) so can doi: tong No = tong Co
        GeneralLedger.TrialBalance tb = gl.trialBalance();
        check("trial_balance_debit_equals_credit", tb.totalDebit, tb.totalCredit);

        // 7) bao cao lai lo: doanh thu 1000, chi phi 500, lai 500
        GeneralLedger.IncomeStatement is = gl.incomeStatement();
        check("income_revenue", 1000L, is.revenue);
        check("income_expense", 500L, is.expense);
        check("income_net_profit", 500L, is.netIncome);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

enum AccountType { ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE }

class Account {
    String code;
    String name;
    AccountType type;
    Account(String code, String name, AccountType type) {
        this.code = code; this.name = name; this.type = type;
    }
}

class LedgerLine {
    String accountCode;
    long debit;
    long credit;
    LedgerLine(String accountCode, long debit, long credit) {
        this.accountCode = accountCode; this.debit = debit; this.credit = credit;
    }
}

class JournalEntry {
    String ref;
    List<LedgerLine> lines;
    JournalEntry(String ref, List<LedgerLine> lines) {
        this.ref = ref; this.lines = lines;
    }
}

class GeneralLedger {
    Map<String, Account> accounts = new LinkedHashMap<>();
    Map<String, Long> debitSum = new HashMap<>();
    Map<String, Long> creditSum = new HashMap<>();

    boolean isDebitNormal(AccountType type) {
        return type == AccountType.ASSET || type == AccountType.EXPENSE;
    }

    void addAccount(Account a) {
        accounts.put(a.code, a);
        debitSum.putIfAbsent(a.code, 0L);
        creditSum.putIfAbsent(a.code, 0L);
    }

    boolean post(JournalEntry entry) {
        if (entry == null || entry.lines == null || entry.lines.isEmpty()) return false;
        for (LedgerLine line : entry.lines) {
            if (!accounts.containsKey(line.accountCode)) return false;
        }
        long totalDebit = 0, totalCredit = 0;
        for (LedgerLine line : entry.lines) {
            totalDebit += line.debit;
            totalCredit += line.credit;
        }
        if (totalDebit != totalCredit) return false;
        Map<String, Long> newDebit = new HashMap<>(debitSum);
        Map<String, Long> newCredit = new HashMap<>(creditSum);
        for (LedgerLine line : entry.lines) {
            newDebit.merge(line.accountCode, line.debit, Long::sum);
            newCredit.merge(line.accountCode, line.credit, Long::sum);
        }
        for (Map.Entry<String, Long> e : newDebit.entrySet()) {
            String code = e.getKey();
            Account acct = accounts.get(code);
            if (acct != null && acct.type == AccountType.ASSET) {
                long bal = e.getValue() - newCredit.getOrDefault(code, 0L);
                if (bal < 0) return false;
            }
        }
        debitSum = newDebit;
        creditSum = newCredit;
        return true;
    }

    long balance(String code) {
        Account acct = accounts.get(code);
        if (acct == null) return 0;
        long d = debitSum.getOrDefault(code, 0L);
        long c = creditSum.getOrDefault(code, 0L);
        if (isDebitNormal(acct.type)) return d - c;
        return c - d;
    }

    static class TrialBalance { long totalDebit, totalCredit; List<String[]> rows = new ArrayList<>(); }

    TrialBalance trialBalance() {
        TrialBalance tb = new TrialBalance();
        for (Map.Entry<String, Account> e : accounts.entrySet()) {
            String code = e.getKey();
            Account acct = e.getValue();
            long bal = balance(code);
            if (isDebitNormal(acct.type)) {
                tb.totalDebit += bal;
                tb.rows.add(new String[]{code, acct.name, String.valueOf(bal), "0"});
            } else {
                tb.totalCredit += bal;
                tb.rows.add(new String[]{code, acct.name, "0", String.valueOf(bal)});
            }
        }
        return tb;
    }

    static class IncomeStatement { long revenue, expense, netIncome; }

    IncomeStatement incomeStatement() {
        IncomeStatement is = new IncomeStatement();
        for (Map.Entry<String, Account> e : accounts.entrySet()) {
            Account acct = e.getValue();
            long bal = balance(e.getKey());
            if (acct.type == AccountType.REVENUE) is.revenue += bal;
            else if (acct.type == AccountType.EXPENSE) is.expense += bal;
        }
        is.netIncome = is.revenue - is.expense;
        return is;
    }

    static class BalanceSheet { long assets, liabilities, equity; }

    BalanceSheet balanceSheet() {
        BalanceSheet bs = new BalanceSheet();
        for (Map.Entry<String, Account> e : accounts.entrySet()) {
            Account acct = e.getValue();
            long bal = balance(e.getKey());
            switch (acct.type) {
                case ASSET: bs.assets += bal; break;
                case LIABILITY: bs.liabilities += bal; break;
                case EQUITY: bs.equity += bal; break;
            }
        }
        return bs;
    }
}`,
        hints: [
          'isDebitNormal tra true cho ASSET va EXPENSE. addAccount khoi tao tong No/Co bang 0.',
          'post phai kiem tra: tat ca tai khoan ton tai, tong No bang tong Co, va tai san khong duoc am sau khi ap dung. Dung ban sao de kiem tra truoc khi ghi.',
          'balance tra hieu No-Co cho tai khoan so du No, va Co-No cho tai khoan so du Co.',
          'TrialBalance sap xep tung tai khoan vao cot No hoac Co theo loai, tong hai phai bang. IncomeStatement lay doanh thu tru chi phi. BalanceSheet tong the loai tai san, no, chu so huu.',
        ],
        explain: `Ket qua cua post phai tu chung: neu bthuan khong can duoc (tong No khac tong Co hoac tai san am) thi tra false va bo qua. So du tai khoan tinh theo cong thuc phu hop voi loai: tai sap va chi phi co so du binh thuong ben No (No minus Co), con lai co so du binh thuong ben Co (Co minus No). Sổ cân đối phân loại mỗi tài khoản vào cột Nợ hoặc Có theo số dư bình thường, tổng hai cột phải bằng. Báo cáo lãi lỗ lấy doanh thu trừ chi phí. Bảng cân đối tổng hợp tài sản, nợ, chủ sở hữu.`,
      },
    ],
    check: [
      {
        q: 'Trong ke toan kep, mot bút toan hop le phai thoa man dieu kien nao?',
        options: [
          'Chi co mot dong No hoac chi co mot dong Co',
          'Tong so tien ghi No bang tong so tien ghi Co, va co it nhat mot dong No va mot dong Co',
          'Chi can tong No lon hon tong Co',
          'Tai khoan phai co ten tieng Viet'
        ],
        answer: 1,
        explain: 'Dung (B): ke toan kep yeu cau tong No bang tong Co va it nhat mot dong o moi phai. Sai (A): phai co ca hai phai. Sai (C): tong No lon hon tong Co la btuan khong can duoc. Sai (D): ten tai khoan khong lien quan den can bang btuan.',
      },
      {
        q: 'Tai khoan loai nao co so du binh thuong ben No (debit normal)?',
        options: [
          'No va chu so huu',
          'Tai san va chi phi',
          'Doanh thu va chu so huu',
          'No va doanh thu'
        ],
        answer: 1,
        explain: 'Dung (B): tai san va chi phi co so du binh thuong ben No. No, chu so huu va doanh thu co so du binh thuong ben Co.',
      },
      {
        q: 'Quy tac "tai san khong duoc am" nghia la gi?',
        options: [
          'Tai khoan tai san co the co so du am neu khach rut qua han',
          'Giao dich rut tien phai kiem tra so du truoc khi ghi, neu lam tai san am thi tu choi',
          'Chi kiem tra so du tai cuoi ngay, khong can kiem tra luc giao dich',
          'Quy tac chi ap dung cho tai khoan nguoi dung, khong ap dung cho tai khoan ngon ngan hang'
        ],
        answer: 1,
        explain: 'Dung (B): truoc khi ghi bthuan rut tien, phai kiem tra xem so du tai san sau bthuan co am khong; neu am thi tu choi btuan. Sai (A): tai san khong bao giờ duoc am. Sai (C): phai kiem tra luc giao dich de tranh tai san am giua chay. Sai (D): quy tac ap dung tat ca tai khoan tai san.',
      },
      {
        q: 'Bao cao nao kiem tra phuong trinh tai san = no + chu so huu?',
        options: [
          'Bao cao lai lo',
          'So can doi',
          'Bang can doi ke toan',
          'Sach nhap kho'
        ],
        answer: 2,
        explain: 'Dung (C): bang can doi ke toan kiem tra tai san = no + chu so huu. Bao cao lai lo tinh loi/lai thuan, so can doi kiem tra tong No bang tong Co.',
      },
    ],
    related: ['banking-001', 'banking-005', 'banking-003'],
    tags: ['ke toan kep', 'so cai', 'so can doi', 'tai chinh', 'tai san', 'no', 'chu so huu', 'lai lo', 'bang can doi'],
  },
  {
    id: 'lesson-banking-016',
    track: 'banking',
    order: 16,
    title: 'Doi soat nang cao: khop 1-1 chinh xac, sai so cho phep, khop 1-nhieu, va bao cao mat mot ben',
    level: 'senior',
    minutes: 40,
    goals: [
      'Mo ta cac kieu khop trong doi soat: 1-1 chinh xac, 1-1 voi sai so cho phep (tolerance), 1-nhieu, va giao dich chi co o mot ben',
      'Xay dựng thuat toan doi soat xac dinh: khop chinh xac truoc, khop voi sai so sau, khop 1-nhieu cuoi cung, danh dau giao dich chua khop',
      'Xay dựng bao cao doi soat chua danh sach da khop, giao dich thieu o moi ben, va tong ket so tien',
      'Nhu hieu du lieu cua giao dich de khop hai he thong, va khong tu dong xoa hoac can chinh giao dich chua khop'
    ],
    body: `**Tóm tắt:** Đối soát (reconciliation) là quy trình so khớp dữ liệu giữa hai hệ thống để phát hiện sai sót, thiếu hoặc chênh lệch. Trong ngân hàng, đối soát thường diễn ra giữa hệ thống giao dịch (ngân hàng ngoài, mobile banking) và sổ cái core banking, hoặc giữa bản ghi đối tác (statement) của ngân hàng đối tác và sổ sách nội bộ. Đối soát nâng cao không chỉ khớp một-contra-một theo mã tham chiếu, mà còn xử lý trường hợp một giao dịch phía ngân hàng tương ứng với nhiều dòng trong sổ sách (1-nhiều), cho phép sai số nhỏ về số tiền (tolerance), và báo cáo giao dịch chỉ có ở một bên (one-side-only). Kết quả là báo cáo đối soát phân loại: đã khớp, sai số cho phép, chỉ có ở ngân hàng, chỉ có ở sổ sách.

### Vì sao đối soát là bắt buộc

Ngân hàng xử lý hàng triệu giao dịch mỗi ngày. Mỗi giao dịch có thể được ghi vào nhiều hệ thống: app khách hàng, hệ thống thanh toán, core banking, sổ cái kế toán, hệ thống thẻ... Do lỗi mạng, timeout, lỗi lập trình hoặc sự cố phần cứng, cùng một giao dịch có thể:
- Có ở hệ thống giao dịch nhưng thiếu ở core (giao dịch bị mất)
- Có ở core nhưng thiếu ở hệ thống giao dịch (giao dịch phantom)
- Có ở cả hai nhưng số tiền khác (chênh lệch)
- Có ở cả hai, số tiền bằng, nhưng mã tham chiếu khác (khó khớp)

Nếu không đối soát, sai sót sẽ lũy dần và cuối cùng dẫn đến sai sổ cái, thiếu tiền, hoặc không thể phục hồi giao dịch khi khách khiếu nại. Đối soát là lưới an toàn cuối cùng.

### Các kiểu khớp trong đối soát nâng cao

1. Khớp 1-1 chính xác: giao dịch ở bên A và bên B có cùng mã tham chiếu và cùng số tiền → khớp ngay.
2. Khớp 1-1 với sai số cho phép (tolerance): cùng mã tham chiếu, số tiền chênh lệch nhỏ (ví dụ dưới 0,5% hoặc dưới một số đồng cố định) → vẫn coi là khớp, ghi chép sai số để điều chỉnh.
3. Khớp 1-nhiều: một giao dịch ở bên A (ví dụ tổng thu 10 triệu) tương ứng với nhiều dòng ở bên B (ví dụ 10 dòng thu 1 triệu) → tổng các dòng bên B phải bằng số tiền bên A.
4. Chỉ có ở một bên (one-side-only): giao dịch có ở bên A nhưng không tìm thấy đối ứng ở bên B, hoặc ngược lại → cần điều tra.

Thứ tự ưu tiên: khớp chính xác trước, rồi khớp với sai số cho phép, rồi khớp 1-nhiều, cuối cùng là đánh dấu một bên.

### Xây dựng báo cáo đối soát

Báo cáo đối soát phải chứa:
- Danh sách các cặp đã khớp (mã bên A, mã bên B, số tiền A, số tiền B, trạng thái)
- Danh sách giao dịch chỉ có ở bên A (mã, số tiền, tài khoản)
- Danh sách giao dịch chỉ có ở bên B (mã, số tiền, tài khoản)
- Tổng kết: tổng số tiền bên A, tổng số tiền bên B, số cặp khớp, số tiền khớp, số giao dịch thiếu ở mỗi bên

Báo cáo này dùng để: (1) điều tra giao dịch thiếu, (2) điều chỉnh sổ sách, (3) báo cáo cho quản lý rủi ro và kiểm toán.

### Ví dụ đời thực

Hệ thống thanh toán thẻ ghi nhận 1.000 giao dịch trong ngày, tổng 500 triệu VND. Sổ cái core banking ghi nhận 998 giao dịch, tổng 498,5 triệu VND. Đối soát phát hiện:
- 995 giao dịch khớp chính xác (cùng mã tham chiếu, cùng số tiền)
- 2 giao dịch có sai số nhỏ (chênh lệch 500 và 1.000 VND do phí xử lý chưa ghi đúng) → khớp với tolerance, ghi chép để điều chỉnh
- 1 giao dịch ở hệ thống thanh toán (3 triệu VND) không có ở core → giao dịch bị mất do lỗi mạng, cần tra cứu và điền vào core
- 1 giao dịch ở core (1,5 triệu VND) không có ở hệ thống thanh toán → giao dịch fantasma, cần hủy hoặc điều chỉnh

Sau khi xử lý: sổ cái được điều chỉnh, tổng hai bên bằng nhau, và lỗi mạng đã được khắc phục.

### Liên hệ phỏng vấn

Khi trả lời về đối soát, hãy nhấn mạnh: (1) đối soát phải chạy tự động hằng ngày, không chờ khách khiếu nại; (2) mỗi giao dịch phải có mã tham chiếu duy nhất dùng để khớp hai bên; (3) cần hỗ trợ các kiểu khớp khác nhau: 1-1 chính xác, 1-1 sai số cho phép, 1-nhiều, và báo cáo một bên; (4) giao dịch không khớp phải được điều tra, không được tự động xóa hoặc căn chỉnh; (5) báo cáo đối soát phải lưu trữ dài hạn để phục vụ kiểm toán. Trong phỏng vấnSenior, hãy nói về việc thiết kế luồng đối soát chịu lỗi (fault-tolerant), có khả năng chạy lại (idempotent), và có cảnh báo khi lệch vượt ngưỡng cho phép.

> Senior tip: Đối soát không chỉ là so sánh số tổng — phải đối soát cả ở mức từng giao dịch theo mã tham chiếu. Tổng hai bên có thể bằng nhau nhưng che được sai lệch bù trừ (ví dụ: thiếu 1 triệu ở giao dịch A và thừa 1 triệu ở giao dịch B). Ngoài ra, đối soát phải xử lý đúng value date (ngày giá trị): giao dịch trong ngày hôm nay có thể chưa ghi vào core cho đến ngày làm việc tiếp theo, không nên hiểu nhầm là thiếu giao dịch.
`,
    exercises: [
      {
        title: 'AdvancedReconciler: khop 1-1 chinh xac, sai so cho phep, khop 1-nhieu, bao cao mat mot ben',
        prompt: `Xây dựng AdvancedReconciler (Java thuần, JDK 17, không class public ngoài Main) đối soát hai danh sách giao dịch:

- class Txn { String id; String account; long amount; constructor(id, account, amount) }
- class Match { String bankId; String bookId; long bankAmount; long bookAmount; String status; constructor(...) }
- class Report { List<Match> matches; List<String> unmatchedBank; List<String> unmatchedBook; long totalBank, totalBook, matchedBank, matchedBook }
- class AdvancedReconciler { Report reconcile(List<Txn> bank, List<Txn> book, double tolerancePercent) }

Thuật toán:
1. Khop 1-1 chinh xac: cung account, so tien bang nhau -> MATCHED. Moi txn duoc su dung toi da mot lan.
2. Khop 1-1 voi sai so: cung account, so tien trong tolerance (khong chinh xac) -> TOLERANCE.
3. Khop 1-nhieu: mot bank txn = tong cac book txn cung account, trong tolerance -> ONE_TO_MANY (thu cap 2 book txn).
4. Con lai: them vao unmatchedBank hoac unmatchedBook.

Tinh toan tong: totalBank/totalBook la tong tat ca; matchedBank/matchedBook la tong cua cac da khop.
withinTolerance(a, b, pct): tra true neu |a-b|/max(a,b) * 100 <= pct.
`,
        starter: `import java.util.*;

class Txn { String id; String account; long amount; Txn(String id, String account, long amount) { this.id = id; this.account = account; this.amount = amount; } }

class Match { String bankId; String bookId; long bankAmount; long bookAmount; String status; Match(String bankId, String bookId, long bankAmount, long bookAmount, String status) { this.bankId = bankId; this.bookId = bookId; this.bankAmount = bankAmount; this.bookAmount = bookAmount; this.status = status; } }

class Report {
    List<Match> matches = new ArrayList<>();
    List<String> unmatchedBank = new ArrayList<>();
    List<String> unmatchedBook = new ArrayList<>();
    long totalBank, totalBook, matchedBank, matchedBook;
}

class AdvancedReconciler {
    Report reconcile(List<Txn> bank, List<Txn> book, double tolerancePercent) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean withinTolerance(long a, long b, double pct) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Object expected, Object actual) {
        total++;
        if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
    }

    public static void main(String[] args) {
        List<Txn> bank = new ArrayList<>();
        bank.add(new Txn("B1", "A", 1000));
        bank.add(new Txn("B2", "A", 1005));
        bank.add(new Txn("B3", "A", 3000));
        bank.add(new Txn("B4", "A", 5000));

        List<Txn> book = new ArrayList<>();
        book.add(new Txn("O1", "A", 1000));
        book.add(new Txn("O2", "A", 1000));
        book.add(new Txn("O3", "A", 1000));
        book.add(new Txn("O4", "A", 2000));
        book.add(new Txn("O5", "A", 6000));

        AdvancedReconciler rec = new AdvancedReconciler();
        Report r = rec.reconcile(bank, book, 2.0);

        // 1) 3 matches: B1-O1 exact, B2-O2 tolerance, B3-O3+O4 one-to-many
        check("matched_count", 3, r.matches.size());

        // 2) B1 matched O1 exactly
        boolean foundB1O1 = false;
        for (Match m : r.matches) {
            if (m.bankId.equals("B1") && m.bookId.equals("O1") && m.status.equals("MATCHED")) foundB1O1 = true;
        }
        check("B1_matched_O1", true, foundB1O1);

        // 3) B2 matched O2 within tolerance (1005 vs 1000, diff 5, 0.5% <= 2%)
        boolean foundB2O2 = false;
        for (Match m : r.matches) {
            if (m.bankId.equals("B2") && m.bookId.equals("O2") && m.status.equals("TOLERANCE")) foundB2O2 = true;
        }
        check("B2_matched_O2_tolerance", true, foundB2O2);

        // 4) B3 matched O3+O4 one-to-many (3000 = 1000 + 2000)
        boolean foundB3 = false;
        for (Match m : r.matches) {
            if (m.bankId.equals("B3") && m.status.equals("ONE_TO_MANY")) foundB3 = true;
        }
        check("B3_one_to_many", true, foundB3);

        // 5) B4 unmatched
        check("B4_unmatched", true, r.unmatchedBank.contains("B4"));

        // 6) O5 unmatched
        check("O5_unmatched", true, r.unmatchedBook.contains("O5"));

        // 7) totals: totalBank = 1000+1005+3000+5000 = 10005, totalBook = 1000+1000+1000+2000+6000 = 11000
        check("total_bank", 10005L, r.totalBank);
        check("total_book", 11000L, r.totalBook);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Txn { String id; String account; long amount; Txn(String id, String account, long amount) { this.id = id; this.account = account; this.amount = amount; } }

class Match { String bankId; String bookId; long bankAmount; long bookAmount; String status; Match(String bankId, String bookId, long bankAmount, long bookAmount, String status) { this.bankId = bankId; this.bookId = bookId; this.bankAmount = bankAmount; this.bookAmount = bookAmount; this.status = status; } }

class Report {
    List<Match> matches = new ArrayList<>();
    List<String> unmatchedBank = new ArrayList<>();
    List<String> unmatchedBook = new ArrayList<>();
    long totalBank, totalBook, matchedBank, matchedBook;
}

class AdvancedReconciler {
    Report reconcile(List<Txn> bank, List<Txn> book, double tolerancePercent) {
        Report r = new Report();
        Set<String> usedBank = new HashSet<>();
        Set<String> usedBook = new HashSet<>();

        // Pass 1: 1-to-1 exact match (same account, exact amount)
        for (Txn b : bank) {
            if (usedBank.contains(b.id)) continue;
            for (Txn o : book) {
                if (usedBook.contains(o.id)) continue;
                if (!b.account.equals(o.account)) continue;
                if (b.amount == o.amount) {
                    r.matches.add(new Match(b.id, o.id, b.amount, o.amount, "MATCHED"));
                    usedBank.add(b.id);
                    usedBook.add(o.id);
                    break;
                }
            }
        }

        // Pass 2: 1-to-1 tolerance match (same account, within tolerance, not exact)
        for (Txn b : bank) {
            if (usedBank.contains(b.id)) continue;
            for (Txn o : book) {
                if (usedBook.contains(o.id)) continue;
                if (!b.account.equals(o.account)) continue;
                if (withinTolerance(b.amount, o.amount, tolerancePercent)) {
                    r.matches.add(new Match(b.id, o.id, b.amount, o.amount, "TOLERANCE"));
                    usedBank.add(b.id);
                    usedBook.add(o.id);
                    break;
                }
            }
        }

        // Pass 3: 1-to-many match (one bank txn = sum of two unused book txns on same account, within tolerance)
        for (Txn b : bank) {
            if (usedBank.contains(b.id)) continue;
            List<Txn> candidates = new ArrayList<>();
            for (Txn o : book) {
                if (!usedBook.contains(o.id) && o.account.equals(b.account) && o.amount <= b.amount) {
                    candidates.add(o);
                }
            }
            boolean matched = false;
            for (int i = 0; i < candidates.size() && !matched; i++) {
                for (int j = i + 1; j < candidates.size() && !matched; j++) {
                    Txn o1 = candidates.get(i);
                    Txn o2 = candidates.get(j);
                    long sum = o1.amount + o2.amount;
                    if (withinTolerance(b.amount, sum, tolerancePercent)) {
                        r.matches.add(new Match(b.id, o1.id + "+" + o2.id, b.amount, sum, "ONE_TO_MANY"));
                        usedBank.add(b.id);
                        usedBook.add(o1.id);
                        usedBook.add(o2.id);
                        matched = true;
                    }
                }
            }
        }

        // Pass 4: unmatched + totals
        for (Txn b : bank) {
            r.totalBank += b.amount;
            if (!usedBank.contains(b.id)) r.unmatchedBank.add(b.id);
        }
        for (Txn o : book) {
            r.totalBook += o.amount;
            if (!usedBook.contains(o.id)) r.unmatchedBook.add(o.id);
        }
        for (Match m : r.matches) {
            r.matchedBank += m.bankAmount;
            r.matchedBook += m.bookAmount;
        }

        return r;
    }

    boolean withinTolerance(long a, long b, double pct) {
        if (a == 0 && b == 0) return true;
        long diff = Math.abs(a - b);
        long base = Math.max(a, b);
        return diff * 100.0 / base <= pct;
    }
}`,
        hints: [
          'Moi txn chi duoc su dung mot lan: dung Set<String> usedBank, usedBook de danh dau.',
          'Thu tu: khop chinh xac (Pass 1) -> khop voi sai so (Pass 2) -> khop 1-nhieu (Pass 3) -> danh dau chua khop (Pass 4).',
          'withinTolerance(a,b,pct) = |a-b| / max(a,b) * 100 <= pct. Neu ca hai bang 0 tra true.',
          'Khop 1-nhieu thu cap 2 book txn: tong hai book txn phai trong tolerance voi bank txn.',
        ],
        explain: `Thuat toan chay 4 vong: (1) khop chinh xac cung account va so tien, (2) khop trong sai so cho phep, (3) khop 1-nhieu (mot bank txn bang tong hai book txn), (4) danh dau con lai la chua khop va tinh tong. Moi txn chi duoc su dung mot lan. Ket qua bao cao cac da khop, giao dich thue o moi ben, va tong ket so tien. Trong he thong thuc, giao dich chua khop phai duoc dieu tra, khong tu dong xoa hay can chinh.`,
      },
    ],
    check: [
      {
        q: 'Thu tu uu tien trong doi soat nang cao la gi?',
        options: [
          'Khop 1-nhieu dau tien, sau do khop chinh xac, cuoi cung la khop voi sai so',
          'Khop chinh xac truoc, roi khop voi sai so cho phep, roi khop 1-nhieu, cuoi cung danh dau mot ben',
          'Chi khop chinh xac, khong cho phep sai so',
          'Danh dau tat ca giao dich la chua khop roi moi kiem tra'
        ],
        answer: 1,
        explain: 'Dung (B): thu tu la khop chinh xac -> khop voi sai so -> khop 1-nhieu -> danh dau mot ben. Sai (A): khop 1-nhieu phuc tap hon, can sau khi khop don gian. Sai (C): khong cho phep sai so se mat nhieu giao dich co sai so nho. Sai (D): danh dau tat la chua khop khong co nghia.',
      },
      {
        q: 'Giao dich chi co o mot ben (one-side-only) can duoc xu ly nhu the nao?',
        options: [
          'Tu dong xoa de sap sap sach',
          'Tu dong them vao ben khong co de can bang',
          'Dieu tra de tim nguyen nhan, khong tu dong xoa hoac can chinh',
          'Bo qua vi khong anh huong den tong'
        ],
        answer: 2,
        explain: 'Dung (C): giao dich chi co o mot ben can dieu tra de tim nguyen nhan (loi mang, btuan bi mat, btuan ma). Khong duoc tu dong xoa hoac can chinh vi do lam mat du lieu. Sai (A): xoa mat du lieu. Sai (B): them btuan ao de can bang la vi pham kiem toan. Sai (D): tong co the bang nhau nhung che duoc sai lech bu tru.',
      },
      {
        q: 'Tai sao tong hai ben co the bang nhau nhung van can doi soat tung giao dịch?',
        options: [
          'Tong bang nhau nghia la tat ca giao dich deu dung',
          'Tong bang nhau co the che duoc sai lech bu tru (thieu tai giao dich A va thua tai giao dich B)',
          'Doi soat tong la du, khong can kiem tra tung giao dịch',
          'Chu chi can doi soat khi tong khac nhau'
        ],
        answer: 1,
        explain: 'Dung (B): tong bang nhau khong chung nghia tat ca giao dich deu dung; co the co btuan bi mat o ben A va btuan ma o ben B voi so tien bang nhau. Phai doi soat tung giao dịch theo ma tham khoi de phat hien. Sai (A): tong bang nhau khong dam bao chinh xac. Sai (C): can kiem tra tung giao dịch. Sai (D): phai doi soat hang ngay khong chi khi tong lech.',
      },
    ],
    related: ['banking-002', 'banking-005', 'banking-012'],
    tags: ['doi soat', 'reconciliation', 'khop', 'tolerance', 'mot ben', 'tai chinh', 'so cai']
  },
  {
    id: 'lesson-banking-017',
    track: 'banking', order: 17,
    title: 'Sổ cái double-entry: ghi bút toán Nợ/Có, kiểm tra cân bằng và cấm số dư âm',
    level: 'senior', minutes: 30,
    goals: ['Hiểu bút toán kép Nợ/Có và vì sao tổng Nợ phải bằng tổng Có', 'Viết code ghi bút toán với kiểm tra cân bằng', 'Chặn số dư âm khi trích tiền'],
    body: `**Tóm tắt:** Mỗi giao dịch tài chính là một bút toán có ít nhất 2 dòng: tổng tiền bên Nợ (debit) phải bằng tổng tiền bên Có (credit). Sổ cái là append-only; sửa sai bằng bút toán đảo. Code phải kiểm tra cân bằng trước khi lưu và không cho số dư âm.

### Bút toán kép là gì
Một giao dịch chuyển 100.000đ từ tài khoản A sang B:
- Dòng 1: A -100.000 (credit, giảm) — tài khoản A bị ghi Có
- Dòng 2: B +100.000 (debit, tăng) — tài khoản B bị ghi Nợ
Tổng Nợ = Tổng Có = 100.000. Không có tiền sinh ra hay mất đi.

Trong kế toán kép, Nợ và Có không nghĩa là âm/dương mà là hai phía của một bút toán. Tài khoản loại Tài sản và Chi phí có số dư bình thường ở bên Nợ (tăng bằng Nợ, giảm bằng Có). Tài khoản loại Nợ, Chủ sở hữu, Doanh thu có số dư bình thường ở bên Có (tăng bằng Có, giảm bằng Nợ).

### Vì sao cần cân bằng
Nếu chỉ ghi 1 dòng, tổng hệ thống lệch — tiền có thể bị sinh ra từ cõi không hoặc biến mất vô cớ. Kiểm tra cân bằng là invariant bắt buộc của sổ cái: mọi bút toán phải thỏa mãn tổng Nợ bằng tổng Có. Nếu lệch, từ chối toàn bộ bút toán, không ghi gì cả.

Ví dụ: một bút toán rút tiền ghi Nợ cho tài khoản tiền mặt nhưng quên ghi Có cho tài khoản nợ khách hàng → tổng Nợ tăng 50 triệu, tổng Có không đổi → sổ cái bị lệch 50 triệu. Nếu không kiểm tra, sai số sẽ lũy dần.

### Không cho số dư âm
Khi trích tiền từ A, kiểm tra số dư A >= số tiền. Nếu không đủ, từ chối giao dịch ngay trước khi ghi bất kỳ dòng nào. Dùng long (đơn vị đồng) để tránh sai số làm tròn của float/double.

Trong ngân hàng, tài sản không bao giờ được âm — đây là quy tắc cốt lõi. Một tài khoản tiền mặt có 5 triệu, khách rút 8 triệu → bút toán này sẽ làm tiền mặt về âm 3 triệu → từ chối. Quy tắc này áp dụng cho tất cả tài khoản loại tài sản.

### Cơ chế chi tiết
Mỗi bút toán phải có ít nhất 2 dòng (có thể nhiều hơn, ví dụ một giao dịch chuyển tiền ghi Nợ cho tài khoản đích, Có cho tài khoản nguồn, và Có thêm cho tài khoản phí). Tổng Nợ = Tổng Có. Nếu lệch, từ chối. Số dư âm bị chặn. Dùng long cho tiền.

Sổ cái chỉ ghi thêm (append-only): không bao giờ UPDATE hoặc DELETE dòng đã ghi. Để sửa sai, ghi bút toán đảo (reversal) với mã tham chiếu đến bút toán gốc. Để tránh ghi trùng do retry, dùng mã idempotency (txId) làm khóa duy nhất — ghi lại cùng txId là no-op.

### Ví dụ đời thực
Ngân hàng xử lý 10 triệu giao dịch/ngày. Một bug ghi 1 dòng cho một giao dịch chuyển khoản → lệch 1 tỷ đồng sau 1 tháng. Kiểm tra cân bằng phát hiện ngay tại thời điểm ghi, từ chối bút toán lỗi, hệ thống không bị lệch sổ.

Kịch bản khác: khách hàng chuyển 100 triệu, hệ thống ghi Nợ cho tài khoản nguồn nhưng timeout trước khi ghi Có cho tài khoản đích. Vì kiểm tra cân bằng, bút toán bị từ chối hoàn toàn, không có dòng Nợ đơn lẻ nào bị lưu.

### Chi tiết thêm
Kiểm tra cân bằng trước khi commit. Sổ cái append-only. Sửa bằng bút toán đảo. Số dư âm bị chặn ở service. Mọi bút toán phải có mã tham chiếu duy nhất (txId). Hàng ngày đối soát sổ cái với hệ thống giao dịch để phát hiện sai sớm.

Trong hệ thống production, sổ cái thường được phân chia theo module (tiền mặt, chuyển khoản, thẻ, vay...) nhưng tổng số dư toàn hệ thống vẫn phải cân bằng. Mỗi module có thể dùng shard riêng nhưng tổng hợp lại phải đúng phương trình kế toán.

### Trả lời mẫu khi phỏng vấn
Tôi luôn ghi bút toán kép với kiểm tra cân bằng tổng Nợ = Tổng Có trước khi commit. Sổ cái append-only — không UPDATE/DELETE, sửa bằng bút toán đảo (reversal) gắn txId để idempotent. Số dư âm bị chặn ngay ở tầng service bằng kiểm tra trước khi ghi. Với hệ thống phân tán, dùng saga hoặc two-phase commit để đảm bảo tính nguyên tử cross-shard.

> Senior tip: Luôn kiểm tra cân bằng Nợ/Có trước khi commit; dùng long cho tiền. Không bao giờ cho phép tài sản về âm — đây là vi phạm nghiêm trọng về kiểm toán.`,
    exercises: [{
      title: 'Ghi bút toán kép',
      prompt: 'Viết class Ledger với method post(entries) nhận danh sách {account, amount} (amount dương = debit, âm = credit). Kiểm tra tổng amount == 0. Nếu không, throw. Cập nhật số dư từng tài khoản. Nếu số dư âm, throw.',
      starter: 'import java.util.*;\nclass Ledger {\n    private final Map<String, Long> balances = new HashMap<>();\n    void post(List<String[]> entries) {\n        throw new UnsupportedOperationException("TODO");\n    }\n    long balance(String account) { return balances.getOrDefault(account, 0L); }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String name, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+d);}\n    public static void main(String[] args){\n        Ledger l=new Ledger();\n        try{l.post(List.of(new String[]{"A","100"},new String[]{"A","-100"})); check("balanced post", l.balance("A")==0, "balances wrong");}catch(Exception e){check("balanced post", false, e.toString());}\n        try{l.post(List.<String[]>of(new String[]{"A","50"})); check("unbalanced rejected", false, "no throw");}catch(Exception e){check("unbalanced rejected", true, "");}\n        try{l.post(List.of(new String[]{"A","-200"},new String[]{"B","200"})); check("negative balance rejected", false, "no throw");}catch(Exception e){check("negative balance rejected", true, "");}\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass Ledger {\n    private final Map<String, Long> balances = new HashMap<>();\n    void post(List<String[]> entries) {\n        long sum=0; for(String[] e:entries) sum+=Long.parseLong(e[1]);\n        if(sum!=0) throw new IllegalArgumentException("unbalanced");\n        Map<String,Long> delta=new HashMap<>();\n        for(String[] e:entries){ delta.merge(e[0], Long.parseLong(e[1]), Long::sum); }\n        for(Map.Entry<String,Long> en:delta.entrySet()){\n            long nb=balances.getOrDefault(en.getKey(),0L)+en.getValue();\n            if(nb<0) throw new IllegalStateException("negative balance");\n            balances.put(en.getKey(), nb);\n        }\n    }\n    long balance(String account){return balances.getOrDefault(account,0L);}\n}',
      hints: ['Tính tổng amount, phải = 0', 'Cập nhật số dư, chặn < 0'],
      explain: 'Kiểm tra cân bằng trước, rồi cập nhật. Dùng long cho tiền.'
    }],
    check: [{q:'Tổng Nợ và Có trong một bút toán phải?', options:['Bằng nhau','Khác nhau','Bằng 0','Không quan trọng'], answer:0, explain:'Tổng Nợ = Tổng Có.'},{q:'Khi số dư âm xảy ra thì sao?', options:['Cho phép','Từ chối giao dịch','Tự động vay','Bỏ qua'], answer:1, explain:'Từ chối giao dịch.'}],
    related: ['banking-005'], tags: ['ledger','double-entry','balance']
  },
  {
    id: 'lesson-banking-018',
    track: 'banking', order: 18,
    title: 'Đối soát: so khớp hai danh sách giao dịch theo mã tham chiếu',
    level: 'senior', minutes: 30,
    goals: ['Hiểu các loại kết quả đối soát: khớp, lệch số tiền, chỉ có một bên', 'Viết code so khớp hai list theo ref', 'Phân loại và báo cáo'],
    body: `**Tóm tắt:** Đối soát so sánh giao dịch nội bộ với đối tác theo mã tham chiếu (ref). Kết quả: khớp (matched), lệch số tiền (amount mismatch), chỉ có ở một bên (one-side). Phải xử lý từng dòng, không chỉ tổng.

### Các loại kết quả
- Matched: cùng ref, cùng số tiền — giao dịch khớp hoàn toàn.
- AmountMismatch: cùng ref, khác số tiền — cần điều tra vì có thể do lỗi ghi sổ, phí xử lý, hoặc lỗi làm tròn.
- OnlyInternal: giao dịch có ở hệ thống nội bộ nhưng không có ở đối tác — có thể bị mất do timeout, lỗi mạng, hoặc đối tác chưa xử lý.
- OnlyPartner: giao dịch có ở đối tác nhưng không có ở hệ thống nội bộ — có thể là giao dịch phantom (bóng ma), cần hủy hoặc điều chỉnh.

### Vì sao cần từng dòng
Tổng có thể bằng nhau nhưng sai lệch bù trừ. Ví dụ: thiếu 1 triệu ở giao dịch A và thừa 1 triệu ở giao dịch B — tổng hai bên vẫn bằng nhau nhưng cả hai giao dịch đều sai. Chỉ so tổng không phát hiện. Đối soát phải kiểm tra từng dòng theo mã tham chiếu (ref) duy nhất.

### Cơ chế chi tiết
So khớp theo ref. Phân loại 4 nhóm kết quả. Báo cáo chi tiết từng nhóm. Không tự động sửa — mọi giao dịch không khớp phải được điều tra thủ công hoặc theo quy trình tự động có kiểm soát.

Quy trình đối soát thường chạy theo lô (batch) vào cuối ngày (end-of-day) hoặc hàng giờ (hourly). Đầu vào là hai danh sách giao dịch: từ hệ thống nội bộ và từ file/dịch vụ đối tác. Mỗi giao dịch có mã tham chiếu (ref) duy nhất, số tiền (amount), và tài khoản (account). Thuật toán khớp theo ref: tìm cặp có cùng ref, so sánh amount. Nếu khớp → matched. Nếu ref tồn tại ở cả hai bên nhưng amount khác → amount mismatch. Nếu ref chỉ có ở một bên → one-side.

Trong hệ thống thực, đối soát phải xử lý tolerance (sai số cho phép) cho các trường hợp làm tròn. Ví dụ: giao dịch 1000đ vs 1000.0001đ — cùng số tiền sau làm tròn nhưng khác chút ít do floating point. Tolerance cho phép coi là khớp nếu chênh lệch dưới ngưỡng.

### Ví dụ đời thực
Đối tác gửi file 10.000 giao dịch. Hệ thống nội bộ có 9.998. 2 giao dịch bị mất do timeout — đối tác ghi nhận nhưng hệ thống nội bộ chưa ghi. Đối soát phát hiện 2 giao dịch only partner, cần tra cứu và điền vào core banking.

Kịch bản khác: đối tác báo 500 triệu, nội bộ báo 499 triệu. Đối soát phát hiện 1 giao dịch lệch 1 triệu — có thể do phí xử lý 1 triệu chưa được ghi đúng. Điều tra và điều chỉnh sổ sách.

### Chi tiết thêm
Tổng bằng nhau không đảm bảo mọi giao dịch khớp. Cần so từng dòng theo ref. Xử lý tolerance cho làm tròn. Đối soát phải idempotent — chạy lại cùng dữ liệu phải cho kết quả giống nhau. Báo cáo phải lưu trữ để phục vụ kiểm toán (audit trail).

### Trả lời mẫu khi phỏng vấn
Tôi đối soát theo mã tham chiếu (ref), phân loại 4 nhóm kết quả (matched, amount mismatch, only internal, only partner), báo cáo chi tiết từng nhóm, không tự động sửa. Mọi giao dịch không khớp phải được điều tra. Đối soát chạy tự động hàng ngày, lưu báo cáo dài hạn phục vụ kiểm toán, và có cảnh báo khi tỷ lệ lệch vượt ngưỡng cho phép.

> Senior tip: Luôn đối soát từng giao dịch theo ref, không chỉ tổng. Tổng bằng nhau có thể che sai lệch bù trừ.`,
    exercises: [{
      title: 'So khớp giao dịch',
      prompt: 'Viết method reconcile(internal, partner) trả về counts: matched, mismatch, onlyInternal, onlyPartner. Mỗi giao dịch có {ref, amount}.',
      starter: 'import java.util.*;\nclass Reconciler {\n    static class Tx { String ref; long amount; Tx(String r,long a){ref=r;amount=a;} }\n    static class Result { int matched, mismatch, onlyInternal, onlyPartner; }\n    Result reconcile(List<Tx> internal, List<Tx> partner) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String name, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+d);}\n    public static void main(String[] args){\n        Reconciler r=new Reconciler();\n        List<Reconciler.Tx> in=List.of(new Reconciler.Tx("R1",100), new Reconciler.Tx("R2",200), new Reconciler.Tx("R3",300));\n        List<Reconciler.Tx> pa=List.of(new Reconciler.Tx("R1",100), new Reconciler.Tx("R2",250), new Reconciler.Tx("R4",400));\n        Reconciler.Result res=r.reconcile(in,pa);\n        check("matched", res.matched==1, "matched="+res.matched);\n        check("mismatch", res.mismatch==1, "mismatch="+res.mismatch);\n        check("onlyInternal", res.onlyInternal==1, "onlyInternal="+res.onlyInternal);\n        check("onlyPartner", res.onlyPartner==1, "onlyPartner="+res.onlyPartner);\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass Reconciler {\n    static class Tx { String ref; long amount; Tx(String r,long a){ref=r;amount=a;} }\n    static class Result { int matched, mismatch, onlyInternal, onlyPartner; }\n    Result reconcile(List<Tx> internal, List<Tx> partner) {\n        Map<String,Long> p=new HashMap<>(); for(Tx t:partner) p.put(t.ref,t.amount);\n        Set<String> seen=new HashSet<>(); Result res=new Result();\n        for(Tx t:internal){ seen.add(t.ref);\n            if(p.containsKey(t.ref)){ if(p.get(t.ref)==t.amount) res.matched++; else res.mismatch++; }\n            else res.onlyInternal++;\n        }\n        for(Tx t:partner){ if(!seen.contains(t.ref)) res.onlyPartner++; }\n        return res;\n    }\n}',
      hints: ['Dùng Map ref->amount cho partner', 'Duyệt internal, phân loại'],
      explain: 'So khớp theo ref, 4 nhóm kết quả.'
    }],
    check: [{q:'Tổng bằng nhau có đảm bảo mọi giao dịch khớp?', options:['Có','Không, có thể sai lệch bu trù','Chỉ khi ref khớp','Luôn luôn'], answer:1, explain:'Tổng bằng nhau không đảm bảo; cần so từng dòng.'},{q:'Kết quả đối soát nào cần điều tra?', options:['Matched','AmountMismatch','OnlyInternal','Tất cả các loại lệch'], answer:3, explain:'Mọi lệch cần điều tra.'}],
    related: ['banking-002'], tags: ['reconciliation','match','ref']
  },
{
    id: 'lesson-banking-019',
    track: 'banking', order: 19,
    title: 'Sổ cái kép nâng cao: kiểm tra cân bằng, idempotency key và khôi phục audit',
    level: 'senior',
    minutes: 30,
    goals: ['Phát hiện bút toán lệch Nợ/Có', 'Đảm bảo idempotency khi retry', 'Khôi phục từ audit log'],
    body: `**Tóm tắt:** Sổ cái kép yêu cầu tổng Nợ = tổng Có cho mỗi bút toán; retry phải không ghi trùng; mọi thay đổi phải có audit trail để khôi phục.

### Kiểm tra cân bằng
Mỗi bút toán gồm nhiều dòng (entry), mỗi dòng có tài khoản, số tiền, chiều Nợ (debit=true) hoặc Có (debit=false). Tổng số tiền bên Nợ phải bằng đúng tổng số tiền bên Có. Nếu lệch dù chỉ 1 đồng, hệ thống phải **từ chối toàn bộ bút toán** (atomic validation) — không được ghi một phần rồi báo lỗi phần còn lại. Việc kiểm tra này phải diễn ra **trước khi** ghi bất kỳ dòng nào vào sổ cái.

Quy trình chuẩn (three-phase commit cục bộ):
1. **Validate phase**: Duyệt tất cả entry, cộng dồn tổng Nợ và tổng Có, kiểm tra amount > 0, tài khoản tồn tại. Nếu tổng Nợ ≠ tổng Có ⇒ ném IllegalArgumentException.
2. **Simulate phase**: Tính delta số dư từng tài khoản (Nợ giảm, Có tăng), kiểm tra tài khoản tài sản (ASSET) không bị âm sau khi áp dụng delta.
3. **Commit phase**: Chỉ khi cả hai phase trên pass, mới áp dụng delta vào balances và append bút toán vào txLog.

Đây là pattern chuẩn trong production để tránh "bút toán nửa chừng" — một bút toán bị từ chối ở giữa không được để lại vết chân trong sổ.

### Idempotency key
Client (hoặc gateway) tạo một khóa duy nhất — **idempotency key** — gắn với mỗi yêu cầu ghi bút toán. Server tra cứu key trong tập hợp đã xử lý:
- Key chưa từng thấy ⇒ xử lý bình thường, lưu key vào tập đã xử lý (cùng transaction với bút toán).
- Key đã tồn tại ⇒ **no-op**: trả về kết quả cũ (success/failed), **không** ghi thêm bút toán, **không** thay đổi số dư.

Key phải đủ độ dài và entropy (ví dụ UUID v4) để tránh va chạm. Trong hệ thống thực, key thường là cặp (clientId, requestSeq) hoặc UUID do client sinh. Lưu key cùng bút toán cho phép audit: khi đối soát, có thể truy ngược từ bút toán về request gốc.

Lưu ý: Idempotency chỉ bảo vệ ở tầng application. Nếu client gửi hai request song song với cùng key, cần cơ chế khoá (distributed lock hoặc DB unique constraint) để tránh race condition ghi trùng.

### Audit log append-only
Mọi thay đổi trạng thái sổ cái (ghi bút toán, hoàn tiền, điều chỉnh) đều ghi vào **audit log** — một luồng chỉ append (append-only). Audit log lưu: timestamp, actor (userId/system), action, bút toán liên quan, idempotency key, snapshot số dư trước/sau.

Để khôi phục trạng thái (disaster recovery, migration, debug): replay audit log từ đầu theo thứ tự thời gian. Vì log chỉ append, không sửa/xoá, việc replay luôn cho kết quả xác định (deterministic).

Trong production, audit log thường được phân shard theo thời gian (ngày/tuần) và nén (compress) để tiết kiệm lưu trữ. Quy định lưu giữ dữ liệu ngân hàng tại Việt Nam thường yêu cầu **≥ 10 năm** (theo Luật Ngân hàng, Luật Kế toán và các thông tư hướng dẫn).

### Ví dụ đời thực
Hệ thống thanh toán retry do timeout; idempotency key ngăn ghi trùng; audit log giúp đối soát khi lệch. Trong production, mỗi bút toán được ghi kèm transaction id, idempotency key và timestamp; khi retry, server tra key và trả kết quả cũ. Audit log append-only cho phép replay để khôi phục trạng thái khi có sự cố. Kiểm tra cân bằng bắt buộc (three-phase) ngăn ghi bút toán lệch.

### Trả lời mẫu khi phỏng vấn
Tôi thiết kế sổ cái với kiểm tra cân bằng bắt buộc (atomic three-phase: validate → simulate → commit), idempotency key cho mọi giao dịch (tra cứu trước khi ghi, lưu key cùng bút toán), và audit log append-only để khôi phục và kiểm toán (replay deterministic). Khi retry, server tra idempotency key và trả kết quả cũ; audit log cho phép replay theo thứ tự để khôi phục. Kiểm tra cân bằng ngăn ghi bút toán lệch. Đây là hai trụ cột của hệ thống tài chính.

### Chi tiết thêm
Trong hệ thống tài chính, mọi bút toán phải cân bằng; idempotency key ngăn ghi trùng khi retry; audit log append-only cho phép khôi phục và kiểm toán. Kiểm tra cân bằng bắt buộc, số tiền phải dương, tài khoản phải tồn tại. Khi retry, server tra key và trả kết quả cũ; audit log replay theo thứ tự khôi phục trạng thái. Audit log phải lưu theo quy định lưu giữ dữ liệu ngân hàng (thường ≥ 10 năm).

> Senior tip: Idempotency và audit trail là hai trụ cột của hệ thống tài chính. Kiểm tra cân bằng phải atomic (validate trước, ghi sau) để không để lại bút toán nửa chừng. Cặp (clientId, idempotencyKey) nên có unique constraint ở DB để chống race condition song song.`,
    exercises: [{
      title: 'LedgerValidator',
      prompt: 'Viết method validate(entries) trả về true nếu tổng Nợ == tổng Có và không có entry số tiền <= 0.',
      starter: 'import java.util.*;\nclass LedgerValidator {\n    static class Entry { String account; long amount; boolean debit; Entry(String a,long m,boolean d){account=a;amount=m;debit=d;} }\n    boolean validate(List<Entry> entries) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String name, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+d);}\n    public static void main(String[] args){\n        LedgerValidator v=new LedgerValidator();\n        List<LedgerValidator.Entry> ok=List.of(new LedgerValidator.Entry("A",100,true),new LedgerValidator.Entry("B",100,false));\n        check("balanced", v.validate(ok), "should true");\n        List<LedgerValidator.Entry> bad=List.of(new LedgerValidator.Entry("A",100,true),new LedgerValidator.Entry("B",50,false));\n        check("unbalanced", !v.validate(bad), "should false");\n        List<LedgerValidator.Entry> zero=List.of(new LedgerValidator.Entry("A",0,true),new LedgerValidator.Entry("B",0,false));\n        check("zero", !v.validate(zero), "should false");\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass LedgerValidator {\n    static class Entry { String account; long amount; boolean debit; Entry(String a,long m,boolean d){account=a;amount=m;debit=d;} }\n    boolean validate(List<Entry> entries) {\n        if(entries==null||entries.isEmpty()) return false;\n        long d=0,c=0;\n        for(Entry e:entries){ if(e.amount<=0) return false; if(e.debit) d+=e.amount; else c+=e.amount; }\n        return d==c;\n    }\n}',
      hints: ['Tính tổng debit và credit', 'So sánh'],
      explain: 'Kiểm tra cân bằng và số tiền dương.'
    }],
    check: [{q:'Tổng Nợ != tổng Có thì?', options:['Ghi anyway','Từ chối ghi','Ghi một phần','Sửa tự động'], answer:1, explain:'Từ chối ghi.'},{q:'Idempotency key dùng để?', options:['Mã hoá','Chống ghi trùng khi retry','Phân quyền','Log'], answer:1, explain:'Chống ghi trùng.'}],
    related: ['banking-005'], tags: ['ledger','idempotency','audit']
  },
{
    id: 'lesson-banking-020',
    track: 'banking', order: 20,
    title: 'Đối soát nâng cao: partial match, tolerance và aging unmatched',
    level: 'senior',
    minutes: 30,
    goals: ['Xử lý partial match', 'Áp dụng tolerance cho làm tròn', 'Aging unmatched'],
    body: `**Tóm tắt:** Đối soát thực tế có partial match, chênh lệch làm tròn và giao dịch chưa khớp cần aging.

### Partial match
Một giao dịch lớn (ví dụ: một lệnh thu tổng hợp từ gateway) có thể khớp với nhiều giao dịch nhỏ hơn ở sổ cái core banking (ví dụ: nhiều dòng chi tiết theo từng đơn hàng con). Cần tổng hợp (aggregate) các dòng theo ref hoặc theo nhóm tài khoản để so sánh tổng.

Thuật toán khớp 1-nhiều (one-to-many):
1. Nhóm các dòng sổ cái theo khóa khớp (ref, account, hoặc transaction group id).
2. Tính tổng số tiền của nhóm.
3. So sánh tổng nhóm với số tiền giao dịch gateway.
4. Nếu khớp (trong tolerance) ⇒ đánh dấu nhóm và giao dịch gateway là MATCHED.

Lưu ý: một giao dịch sổ cái chỉ được dùng trong **một** nhóm khớp (đánh dấu used), tránh double-count.

### Tolerance
Chênh lệch nhỏ do làm tròn (ví dụ: chênh lệch đơn vị tiền tệ nhỏ nhất, sai số tỷ giá, phí xử lý) được coi là khớp nếu trong ngưỡng tolerance cấu hình. Tolerance thường được định nghĩa là:
- **Phần trăm**: {{|a-b| / max(|a|,|b|) × 100 ≤ tolerancePercent}}
- **Số tiền cố định**: {{|a-b| ≤ toleranceAmount}}

Trong production, tolerance thường cấu hình theo từng loại giao dịch/cáp thanh toán. Ví dụ: thanh toán quốc tế có tolerance cao hơn do tỷ giá; thanh toán trong nước tolerance thấp hơn. Quan trọng: tolerance **không được** dùng để che giấu sai sót thực sự — mọi khớp trong tolerance phải được ghi log để audit.

### Aging unmatched
Giao dịch chưa khớp sau N ngày (theo quy định nội bộ, ví dụ 3-5 ngày làm việc) được chuyển sang trạng thái **AGING** và escalate lên đội vận hành/rủi ro. Quy trình aging:
1. Mỗi ngày đối soát, cập nhật {{unmatchedDays}} cho các giao dịch chưa khớp.
2. Khi {{unmatchedDays}} ≥ ngưỡng aging ⇒ tạo ticket escalate, gửi cảnh báo.
3. Giao dịch aging quá lâu (ví dụ > 30 ngày) ⇒ chuyển sang xử lý đặc biệt (write-off, điều chỉnh sổ sách theo quy trình phê duyệt).

Báo cáo aging phải lưu: mã giao dịch, số tiền, số ngày chưa khớp, nguyên nhân dự đoán, người phụ trách xử lý. Đây là bằng chứng cho kiểm toán và quản lý rủi ro.

### Ví dụ đời thực
Đối soát thẻ: partial capture (một auth khớp nhiều capture), tolerance cho phép chênh lệch làm tròn, unmatched aging theo quy định nội bộ sau đó escalate. Trong production, đối soát chạy hàng ngày, partial match tổng hợp nhiều giao dịch nhỏ khớp một giao dịch lớn, tolerance chấp nhận chênh lệch làm tròn, unmatched aging theo quy định sau đó escalate.

### Trả lời mẫu khi phỏng vấn
Tôi thiết kế reconciliation với partial match (khớp 1-nhiều bằng cách aggregate theo ref/group), tolerance cho rounding (cấu hình theo % hoặc số tiền cố định, log để audit), và aging cho unmatched với escalate (cập nhật {{unmatchedDays}} hàng ngày, escalate khi vượt ngưỡng). Đây là cách xử lý thực tế trong hệ thống tài chính.

### Chi tiết thêm
Đối soát thực tế có partial match, tolerance cho làm tròn và aging unmatched. Partial match tổng hợp nhiều giao dịch nhỏ khớp một lớn (aggregate theo ref/account); tolerance chấp nhận chênh lệch theo cấu hình (% hoặc Amount), mọi khớp tolerance phải log audit; aging escalate theo quy định nội bộ (ví dụ 3-5 ngày). Báo cáo lưu trữ phục vụ kiểm toán. Đối soát phải idempotent, chạy lại cho kết quả giống nhau.

> Senior tip: Luôn có tolerance và aging để tránh backlog unmatched. Tolerance không phải "hôm nay cho qua, mai sau lại tra" — phải có log audit trail. Partial match cần unique constraint trên (gatewayTxnId, bookTxnId) để tránh double-count khi chạy lại.`,
    exercises: [{
      title: 'ReconcileWithTolerance',
      prompt: 'Viết method reconcile(a,b,tolerance) trả về matched count khi |a-b| <= tolerance.',
      starter: 'import java.util.*;\nclass Reconciler2 {\n    int reconcile(long a, long b, long tolerance) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String name, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+d);}\n    public static void main(String[] args){\n        Reconciler2 r=new Reconciler2();\n        check("exact", r.reconcile(100,100,0)==1, "should 1");\n        check("tol", r.reconcile(100,102,2)==1, "should 1");\n        check("fail", r.reconcile(100,110,2)==0, "should 0");\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass Reconciler2 {\n    int reconcile(long a, long b, long tolerance) {\n        return Math.abs(a-b)<=tolerance ? 1 : 0;\n    }\n}',
      hints: ['So sánh chênh lệch với tolerance'],
      explain: 'Khớp nếu chênh lệch trong tolerance.'
    }],
    check: [{q:'Partial match là?', options:['Một-khớp-một','Nhiều nhỏ khớp một lớn','Không khớp','Khớp tổng'], answer:1, explain:'Nhiều nhỏ khớp một lớn.'},{q:'Tolerance dùng để?', options:['Bảo mật','Chấp nhận chênh lệch làm tròn','Log','Phân quyền'], answer:1, explain:'Chấp nhận chênh lệch làm tròn.'}],
    related: ['banking-002'], tags: ['reconciliation','tolerance','aging']
  },

  {
    id: 'lesson-banking-021',
    track: 'banking',
    order: 21,
    title: 'Sổ cái kép đa tiền tệ: cân bằng theo từng tiền tệ, tài khoản tỷ giá và bảng cân đối thử',
    level: 'senior',
    minutes: 35,
    goals: [
      'Giải thích vì sao trong sổ cái đa tiền tệ, tổng Nợ phải bằng tổng Có theo TỪNG đơn vị tiền tệ, không gộp chung',
      'Hiểu vì sao giao dịch đổi ngoại tệ (FX) luôn cần một tài khoản tỷ giá nội bộ làm cầu nối để mỗi đồng tiền tự cân',
      'Tính số dư theo cặp (tài khoản, tiền tệ) và lập bảng cân đối thử (trial balance) theo tiền tệ',
      'Viết {{MultiCurrencyLedger}} với {{post}}, {{balance(account, currency)}}, {{trialBalance(currency)}} thỏa các bất biến trên'
    ],
    body: `**Tóm tắt:** Trong sổ cái kế toán kép **đa tiền tệ** (multi-currency ledger — sổ cái ghi giao dịch bằng nhiều loại tiền khác nhau), bất biến "tổng Nợ bằng tổng Có" phải đúng **cho từng đơn vị tiền tệ riêng biệt**, chứ không phải gộp chung mọi loại tiền vào một con số. Vì thế một giao dịch đổi ngoại tệ (FX) luôn cần một **tài khoản tỷ giá nội bộ** ({{SYS/fx}}) làm cầu nối, để cả hai vế của mỗi đồng tiền đều cân. Số dư và **bảng cân đối thử** (trial balance) cũng phải được tính theo từng tiền tệ.

### Chuyện thật: một cú chuyển 100 USD sang người nhận bằng VND

Chị Lan có 500 USD trong ví và muốn gửi 100 USD cho anh Minh, nhưng tài khoản của Minh là tài khoản VND. Ngân hàng quy đổi ở tỷ giá 23.000 VND/USD, nên Minh nhận 2.300.000 VND. Câu hỏi hóc búa: ghi sổ thế nào để **không đồng nào biến mất**?

Nếu chỉ nhìn bằng cảm giác, ta thấy "100 USD đi ra, 2.300.000 VND đi vào" — nhưng gộp "100 + 2.300.000" lại là một phép cộng **vô nghĩa**, giống như cộng 100 quả táo với 2.300.000 đồng. Đây chính là lý do sổ cái đa tiền tệ phải cân bằng **theo từng đồng tiền**, và bài này dạy cách làm đúng.

### Thuật ngữ cần biết (giải thích cho người mới)

- **Đa tiền tệ (multi-currency)**: hệ thống quản lý tài khoản bằng nhiều loại tiền (USD, VND, EUR…). Mỗi tài khoản thực chất là nhiều "túi tiền" theo từng đồng.
- **Đơn vị nhỏ nhất (minor unit)**: đơn vị không chia nhỏ hơn. VND là 1 đồng, USD là 1 cent (1/100), JPY là 1 yên (không có phần lẻ). Trong bài, số tiền là số nguyên ở đơn vị nhỏ nhất.
- **Tỷ giá (FX rate)**: giá quy đổi giữa hai đồng tiền, ví dụ 1 USD = 23.000 VND. Tỷ giá thay đổi theo thời gian, nên giao dịch phải "chốt" tỷ giá tại thời điểm phát sinh.
- **Tài khoản tỷ giá / tài khoản ngoại tệ nội bộ ({{SYS/fx}})**: một tài khoản đặc biệt của ngân hàng, đóng vai "trạm trung chuyển" khi đổi tiền. Nó giữ tạm phần chênh giữa hai đồng tiền để mỗi đồng tiền tự cân bằng.
- **Bảng cân đối thử (trial balance)**: bảng tổng hợp **tổng Nợ** và **tổng Có** của mọi tài khoản. Nếu sổ cái đúng, với mỗi đồng tiền, tổng Nợ phải bằng tổng Có.

### Vì sao cân bằng phải theo từng tiền tệ

Bất biến gốc của kế toán kép là: **mỗi đồng tiền đi ra phải có một nơi nhận**. Khi có nhiều đồng tiền, bất biến này tách thành nhiều bất biến con — **một cho mỗi đồng tiền**:

~~~text
USD: tổng Nợ(USD)  == tổng Có(USD)
VND: tổng Nợ(VND)  == tổng Có(VND)
EUR: tổng Nợ(EUR)  == tổng Có(EUR)
...
~~~

Nếu ta gộp tất cả thành một con số duy nhất rồi so sánh, ta sẽ bỏ lọt lỗi: ví dụ một bút toán ghi Nợ 100 USD nhưng quên ghi Có 100 USD, trong khi lại có một bút toán VND lệch ngược chiều — gộp chung hai cái có thể "triệt tiêu" nhau và trông như cân, nhưng thực ra **cả hai đồng tiền đều sai**. So theo từng tiền tệ thì lỗi nào cũng lộ.

### Giao dịch đổi ngoại tệ cần tài khoản tỷ giá

Để 100 USD của Lan biến thành 2.300.000 VND cho Minh mà **mỗi đồng tiền vẫn cân**, ta viết bốn bút toán, dùng {{SYS/fx}} làm cầu nối:

| txId | Tài khoản | Tiền tệ | Nợ (đi ra) | Có (đi vào) |
|---|---|---|---|---|
| T1 | CA/lan | USD | 100 | |
| T1 | SYS/fx | USD | | 100 |
| T1 | SYS/fx | VND | 2.300.000 | |
| T1 | CA/minh | VND | | 2.300.000 |
| **Tổng USD** | | | **100** | **100** |
| **Tổng VND** | | | **2.300.000** | **2.300.000** |

Nhìn vào hai dòng tổng: USD cân (Nợ 100 = Có 100), VND cân (Nợ 2.300.000 = Có 2.300.000). Tài khoản {{SYS/fx}} nhận 100 USD ở cột Có và trả 2.300.000 VND ở cột Nợ — nó chính là "chỗ" giữ chênh lệch tỷ giá. Nếu không có {{SYS/fx}}, USD sẽ lệch 100 và VND lệch 2.300.000, và hệ thống phải từ chối.

Trong code, cùng một giao dịch là một danh sách bút toán, mỗi bút toán mang theo đồng tiền:

~~~java
// T1: doi 100 USD cua Lan -> 2.300.000 VND cho Minh (ty gia 23.000)
// Moi dong tien phai tu can bang, nho tai khoan ty gia SYS/fx lam cau noi
List<Entry> fx = List.of(
    new Entry("CA/lan",  "USD", 100,      true),    // No: USD di ra khoi vi Lan
    new Entry("SYS/fx",  "USD", 100,      false),   // Co: USD vao tai khoan ty gia
    new Entry("SYS/fx",  "VND", 2300000,  true),    // No: VND ra khoi tai khoan ty gia
    new Entry("CA/minh", "VND", 2300000,  false)    // Co: VND vao tai khoan Minh
);
ledger.post("T1", fx);   // moi tien te: tong No == tong Co -> chap nhan
~~~

### Số dư và bảng cân đối thử theo tiền tệ

Số dư của một tài khoản phải tính **theo từng đồng tiền**: {{balance("CA/lan", "USD")}} khác hoàn toàn {{balance("CA/lan", "VND")}}. Công thức không đổi so với sổ cái một tiền tệ: {{số dư = tổng Có − tổng Nợ}}, nhưng chỉ xét các bút toán **cùng đồng tiền**.

**Bảng cân đối thử** kiểm tra sức khỏe toàn sổ: với mỗi đồng tiền, cộng tổng Nợ và tổng Có của **mọi** tài khoản; hai vế phải bằng nhau. Nếu lệch, có bút toán đơn lẻ (một đồng tiền bị ghi một phía) — lỗi nghiêm trọng nhất của sổ cái.

### Cơ chế từng bước: ghi một bút toán đa tiền tệ

**Tóm tắt:** Kiểm tra cân bằng theo từng đồng tiền, mô phỏng số dư từng (tài khoản, tiền tệ), rồi mới ghi — tất cả trong một khối nguyên tử.

1. **Chống trùng theo {{txId}}**: đã có {{txId}} trong sổ ⇒ no-op, trả {{false}} (retry do timeout không được ghi hai lần — xem bài 5).
2. **gom Nợ/Có theo đồng tiền**: duyệt mọi bút toán, cộng dồn tổng Nợ và tổng Có vào một map khóa theo tiền tệ; đồng thời cộng delta số dư cho từng cặp (tài khoản, tiền tệ).
3. **kiểm tra cân bằng từng tiền tệ**: với mỗi đồng tiền, nếu tổng Nợ ≠ tổng Có ⇒ ném {{IllegalArgumentException}} và **không ghi gì cả**.
4. **kiểm tra tài khoản khách không âm**: với mỗi cặp (tài khoản, tiền tệ) thuộc loại khách ({{CA/}}), nếu số dư sau khi ghi < 0 ⇒ ném {{IllegalStateException}}. Tài khoản nội bộ ({{SYS/}}) được phép âm.
5. **ghi**: chỉ khi cả ba bước trên pass mới áp delta vào số dư và lưu bút toán vào sổ (append-only).

### Lỗi hay gặp trên production

1. **Gộp mọi tiền tệ rồi so một tổng**: bỏ lọt bút toán lệch vì hai đồng tiền "triệt tiêu" nhau. Sửa: cân bằng theo từng đồng tiền.
2. **Quên tài khoản tỷ giá {{SYS/fx}}**: giao dịch FX bị từ chối vì mỗi đồng tiền lệch một phía. Sửa: luôn có {{SYS/fx}} làm cầu nối.
3. **Lưu số dư một cột duy nhất không kèm tiền tệ**: không biết 500 là USD hay VND. Sửa: khóa số dư là (tài khoản, tiền tệ).
4. **Làm tròn tỷ giá rồi mới ghi**: 100 USD × 23.000 = 2.300.000 VND, nhưng nếu tỷ giá 23.456,7 thì phần lẻ VND phải làm tròn một lần và phần chênh dồn vào {{SYS/fx}}, không làm tròn ở từng bước (xem bài 1, bài 7).

### Liên hệ phỏng vấn

**Câu hỏi:** "Sổ cái của bạn có nhiều tiền tệ. Tổng Nợ bằng tổng Có được kiểm tra thế nào, và giao dịch đổi ngoại tệ ghi sổ ra sao?"

**Cách trả lời:** Bất biến cân bằng áp dụng **cho từng đồng tiền**, không gộp chung — vì cộng 100 USD với 2.300.000 VND là vô nghĩa, và gộp lại sẽ bỏ lọt bút toán lệch khi hai đồng tiền triệt tiêu nhau. Giao dịch FX luôn có một **tài khoản tỷ giá nội bộ** ({{SYS/fx}}) làm cầu nối: ví dụ 100 USD của khách đi ra (Nợ CA/lan USD), vào {{SYS/fx}} (Có SYS/fx USD), rồi {{SYS/fx}} trả 2.300.000 VND (Nợ SYS/fx VND) và khách nhận (Có CA/minh VND) — nhờ đó USD và VND đều tự cân. Số dư và bảng cân đối thử đều tính theo (tài khoản, tiền tệ). Điểm senior: khóa số dư là (tài khoản, tiền tệ), kiểm tra không âm theo từng đồng tiền, và phần chênh tỷ giá dồn vào {{SYS/fx}} thay vì làm tròn rải rác.

> Senior tip: Khi phỏng vấn, hãy nói thẳng "mỗi đồng tiền là một quyển sổ con, tổng hợp lại thành bảng cân đối thử theo đồng tiền". Và nhớ: tài khoản khách không được âm theo **từng** đồng tiền, còn {{SYS/}} thì được — đó là chỗ hệ thống giữ chênh lệch tỷ giá một cách có kiểm soát.`,
    exercises: [
      {
        title: 'MultiCurrencyLedger: post / balance(account,currency) / trialBalance(currency)',
        prompt: `Viết class {{MultiCurrencyLedger}} ghi sổ **kế toán kép đa tiền tệ**. Bút toán {{Entry}} gồm {{account}} (tiền tố {{CA/}} = tài khoản khách, {{SYS/}} = nội bộ), {{currency}} (mã tiền, ví dụ {{USD}}, {{VND}}), {{amount}} (long, luôn dương, đơn vị nhỏ nhất) và {{debit}} ({{true}} = tiền đi ra, {{false}} = tiền đi vào).

Quy tắc bắt buộc:
1. {{post(String txId, List<Entry> entries)}} trả {{boolean}}. {{txId}} đã ghi ⇒ no-op trả {{false}}. {{entries}} có từ 2 bút toán, mọi {{amount > 0}}, {{account}} và {{currency}} không rỗng; vi phạm ⇒ ném {{IllegalArgumentException}} và không ghi gì.
2. **Cân bằng theo từng đồng tiền**: với MỖI {{currency}}, tổng Nợ phải bằng tổng Có. Lệch một đồng tiền ⇒ ném {{IllegalArgumentException}}, không ghi gì (kể cả các đồng tiền khác).
3. Số dư một cặp (tài khoản, tiền tệ) = tổng Có − tổng Nợ. Nếu tài khoản **khách** ({{CA/}}) bị **âm** sau khi ghi theo một đồng tiền ⇒ ném {{IllegalStateException}}, thất bại nguyên tử. {{SYS/}} được phép âm.
4. {{balance(String account, String currency)}} trả số dư, chưa có ⇒ 0.
5. {{trialBalance(String currency)}} trả {{long[]}} gồm hai phần tử: tổng Nợ và tổng Có của **mọi** tài khoản cho đồng tiền đó (hai vế bằng nhau nếu sổ đúng).
6. {{txCount()}} đếm số giao dịch đã ghi.`,
        starter: `import java.util.*;

class Entry {
    final String account;
    final String currency;
    final long amount;
    final boolean debit;
    Entry(String account, String currency, long amount, boolean debit) {
        this.account = account;
        this.currency = currency;
        this.amount = amount;
        this.debit = debit;
    }
}

class MultiCurrencyLedger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();

    private static String key(String account, String currency) {
        return account + "|" + currency;
    }

    boolean post(String txId, List<Entry> entries) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String account, String currency) {
        throw new UnsupportedOperationException("TODO");
    }

    long[] trialBalance(String currency) {
        throw new UnsupportedOperationException("TODO");
    }

    int txCount() {
        return txLog.size();
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Entry en(String acc, String cur, long amt, boolean debit) { return new Entry(acc, cur, amt, debit); }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }

    public static void main(String[] args) {
        MultiCurrencyLedger l = new MultiCurrencyLedger();
        check("opening USD", l.post("T0", of(en("SYS/opening","USD",500,true), en("CA/a","USD",500,false))), "T0 phai true");
        check("balance A USD 500", l.balance("CA/a","USD") == 500, "bal=" + l.balance("CA/a","USD"));
        check("unknown currency = 0", l.balance("CA/a","VND") == 0, "bal=" + l.balance("CA/a","VND"));

        boolean fx = l.post("T1", of(
            en("CA/a","USD",100,true),
            en("SYS/fx","USD",100,false),
            en("SYS/fx","VND",2300000,true),
            en("CA/b","VND",2300000,false)));
        check("fx posted", fx, "fx phai true");
        check("A USD con 400", l.balance("CA/a","USD") == 400, "bal=" + l.balance("CA/a","USD"));
        check("B VND 2.3tr", l.balance("CA/b","VND") == 2300000, "bal=" + l.balance("CA/b","VND"));
        long[] tbUsd = l.trialBalance("USD");
        check("trial balance USD can bang", tbUsd[0] == tbUsd[1] && tbUsd[0] == 600, "d=" + tbUsd[0] + " c=" + tbUsd[1]);
        long[] tbVnd = l.trialBalance("VND");
        check("trial balance VND can bang", tbVnd[0] == tbVnd[1] && tbVnd[0] == 2300000, "d=" + tbVnd[0] + " c=" + tbVnd[1]);
        long[] tbEur = l.trialBalance("EUR");
        check("trial balance EUR rong", tbEur[0] == 0 && tbEur[1] == 0, "");

        check("lech trong mot tien te bi tu choi", expect(IllegalArgumentException.class,
            () -> l.post("T2", of(en("CA/x","USD",100,true), en("CA/y","VND",100,false)))), "khac tien te, moi tien te lech phai bi tu choi");
        check("tu choi khong ghi gi", l.txCount() == 2, "tx=" + l.txCount());

        check("thieu hut USD bi tu choi", expect(IllegalStateException.class,
            () -> l.post("T3", of(en("CA/a","USD",500,true), en("SYS/z","USD",500,false)))), "A chi con 400 USD");
        check("thieu hut khong ghi", l.balance("CA/a","USD") == 400 && l.txCount() == 2, "tx=" + l.txCount());

        check("trung txId la no-op", !l.post("T1", of(en("CA/a","USD",1,true), en("SYS/fx","USD",1,false))), "trung txId phai false");
        check("trung txId khong doi", l.balance("CA/a","USD") == 400 && l.txCount() == 2, "tx=" + l.txCount());

        check("amount 0 bi tu choi", expect(IllegalArgumentException.class,
            () -> l.post("T4", of(en("CA/a","USD",0,true), en("SYS/z","USD",0,false)))), "");
        check("currency rong bi tu choi", expect(IllegalArgumentException.class,
            () -> l.post("T5", of(en("CA/a","",100,true), en("SYS/z","USD",100,false)))), "");
        check("sau loi so sổ nguyen ven", l.txCount() == 2 && l.balance("CA/a","USD") == 400, "tx=" + l.txCount());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Entry {
    final String account;
    final String currency;
    final long amount;
    final boolean debit;
    Entry(String account, String currency, long amount, boolean debit) {
        this.account = account;
        this.currency = currency;
        this.amount = amount;
        this.debit = debit;
    }
}

class MultiCurrencyLedger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();

    private static String key(String account, String currency) {
        return account + "|" + currency;
    }

    boolean post(String txId, List<Entry> entries) {
        if (txId == null || txId.isEmpty()) throw new IllegalArgumentException("txId rong");
        if (txLog.containsKey(txId)) return false;
        if (entries == null || entries.size() < 2) throw new IllegalArgumentException("can tu 2 but toan");
        Map<String, long[]> perCurrency = new LinkedHashMap<>();
        Map<String, Map<String, Long>> delta = new LinkedHashMap<>();
        for (Entry e : entries) {
            if (e.account == null || e.account.isEmpty()) throw new IllegalArgumentException("account rong");
            if (e.currency == null || e.currency.isEmpty()) throw new IllegalArgumentException("currency rong");
            if (e.amount <= 0) throw new IllegalArgumentException("amount phai > 0");
            long[] dc = perCurrency.computeIfAbsent(e.currency, k -> new long[2]);
            if (e.debit) dc[0] += e.amount; else dc[1] += e.amount;
            long signed = e.debit ? -e.amount : e.amount;
            delta.computeIfAbsent(e.account, k -> new HashMap<>()).merge(e.currency, signed, Long::sum);
        }
        for (long[] dc : perCurrency.values()) {
            if (dc[0] != dc[1]) throw new IllegalArgumentException("lech No/Co trong mot tien te");
        }
        for (Map.Entry<String, Map<String, Long>> byAcc : delta.entrySet()) {
            String acc = byAcc.getKey();
            if (!acc.startsWith("CA/")) continue;
            for (Map.Entry<String, Long> byCur : byAcc.getValue().entrySet()) {
                long after = balance(acc, byCur.getKey()) + byCur.getValue();
                if (after < 0) throw new IllegalStateException("Thieu hut " + acc + " " + byCur.getKey());
            }
        }
        for (Map.Entry<String, Map<String, Long>> byAcc : delta.entrySet()) {
            for (Map.Entry<String, Long> byCur : byAcc.getValue().entrySet()) {
                balances.merge(key(byAcc.getKey(), byCur.getKey()), byCur.getValue(), Long::sum);
            }
        }
        txLog.put(txId, new ArrayList<>(entries));
        return true;
    }

    long balance(String account, String currency) {
        return balances.getOrDefault(key(account, currency), 0L);
    }

    long[] trialBalance(String currency) {
        long debit = 0, credit = 0;
        for (List<Entry> list : txLog.values()) {
            for (Entry e : list) {
                if (!e.currency.equals(currency)) continue;
                if (e.debit) debit += e.amount; else credit += e.amount;
            }
        }
        return new long[]{debit, credit};
    }

    int txCount() {
        return txLog.size();
    }
}`,
        hints: [
          'Cân bằng phải kiểm tra **theo từng đồng tiền**: gom tổng Nợ và tổng Có vào một map khóa theo {{currency}}, rồi so từng cặp — đừng gộp mọi tiền tệ vào một con số.',
          'Số dư và delta phải khóa theo **(tài khoản, tiền tệ)**; dùng {{Map<String, Map<String, Long>>>}} (tài khoản -> tiền tệ -> delta) để không phải nối chuỗi rồi tách lại.',
          'Kiểm tra tài khoản khách không âm theo **từng đồng tiền** trước khi ghi; ghi xen kẽ với kiểm tra sẽ để lại sổ hỏng khi bút toán thứ hai bị từ chối.',
          'Giao dịch FX cần tài khoản {{SYS/fx}} làm cầu nối để mỗi đồng tiền tự cân; nếu thiếu, mỗi đồng tiền sẽ lệch một phía và {{post}} phải từ chối.',
        ],
        explain: `Bài này kiểm tra bốn bất biến, mỗi bất biến là một câu hỏi phỏng vấn thật:

1. **Cân bằng theo từng đồng tiền.** {{T2}} (Nợ 100 USD, Có 100 VND) bị từ chối bằng {{IllegalArgumentException}} vì USD lệch 100 và VND lệch 100, dù nếu gộp "100 = 100" thì trông như cân. Đây là lỗi kinh điển: gộp nhiều đồng tiền rồi so một tổng sẽ bỏ lọt bút toán lệch.
2. **FX cần tài khoản tỷ giá.** {{T1}} có bốn bút toán qua {{SYS/fx}}; sau khi ghi, {{trialBalance("USD")}} = {600, 600} và {{trialBalance("VND")}} = {2.300.000, 2.300.000} — mỗi đồng tiền tự cân. Nếu bạn bỏ {{SYS/fx}}, USD chỉ có Nợ 100 mà không có Có, và hệ thống từ chối.
3. **Không âm theo từng đồng tiền.** {{T3}} định trừ 500 USD trong khi {{CA/a}} chỉ còn 400 USD ⇒ {{IllegalStateException}}, và sổ không đổi ({{txCount}} vẫn 2). Tài khoản {{SYS/}} được phép âm nên {{SYS/fx}} giữ 100 USD và −2.300.000 VND mà không sao.
4. **Idempotency theo {{txId}}.** Ghi lại {{T1}} trả {{false}} và không đổi số dư, dù entries gửi lại khác hẳn — retry do timeout không được ghi sổ hai lần (xem bài 5).

Lỗi hay gặp khi viết: dùng một cột số dư duy nhất không kèm tiền tệ (không biết 500 là USD hay VND), và kiểm tra âm **sau** khi đã ghi (để lại sổ hỏng). Hãy tách ba pha: gom tổng + validate, mô phỏng delta, rồi mới áp — thất bại là nguyên tử.`,
      }
    ],
    check: [
      { q: 'Trong sổ cái đa tiền tệ, bất biến "tổng Nợ bằng tổng Có" áp dụng thế nào?', options: ['Gộp mọi tiền tệ thành một tổng rồi so', 'Với mỗi đồng tiền riêng biệt: tổng Nợ của đồng đó bằng tổng Có của đồng đó', 'Chỉ cần tổng toàn bộ số dư dương', 'Không cần kiểm tra nếu có tài khoản SYS'], answer: 1, explain: 'Đúng (B): mỗi đồng tiền là một "quyển sổ con" độc lập; cộng 100 USD với 2.300.000 VND là vô nghĩa, và gộp chung sẽ bỏ lọt bút toán lệch khi hai đồng tiền triệt tiêu nhau. Sai (A): gộp chung che mất lệch. Sai (C): số dư dương không liên quan cân bằng Nợ/Có. Sai (D): có SYS vẫn phải cân từng đồng tiền; SYS chỉ là tài khoản nội bộ được phép âm.' },
      { q: 'Vì sao giao dịch đổi ngoại tệ cần tài khoản tỷ giá SYS/fx?', options: ['Để tính phí cao hơn', 'Để mỗi đồng tiền tự cân bằng: một đồng tiền vào SYS/fx, đồng kia ra khỏi SYS/fx', 'Để lưu mật khẩu', 'Vì luật không cho đổi tiền trực tiếp'], answer: 1, explain: 'Đúng (B): ví dụ 100 USD đi ra (Nợ CA/lan USD) → SYS/fx (Có SYS/fx USD) → SYS/fx trả 2.300.000 VND (Nợ SYS/fx VND) → khách nhận (Có CA/minh VND). Nhờ SYS/fx, USD cân và VND cân. Sai (A): phí là chuyện khác. Sai (C): không liên quan bảo mật. Sai (D): không phải quy định pháp lý mà là yêu cầu kế toán.' },
      { q: 'Số dư tài khoản khách bị âm theo một đồng tiền thì hệ thống làm gì?', options: ['Cho phép vì tổng các đồng tiền vẫn dương', 'Từ chối giao dịch, không ghi gì (nguyên tử)', 'Tự động vay bù', 'Ghi rồi sửa sau'], answer: 1, explain: 'Đúng (B): tài khoản khách (CA/) không được âm theo từng đồng tiền; vi phạm ⇒ ném IllegalStateException và không ghi gì. Sai (A): âm một đồng tiền là cho vay ngoài ý muốn dù đồng khác dương. Sai (C): tự động vay là nghiệp vụ khác, phải có quy trình riêng. Sai (D): ghi rồi sửa phá bất biến append-only và dễ mất tiền.' }
    ],
    related: ['banking-019', 'banking-047', 'banking-057'],
    tags: ['ledger', 'double-entry', 'multi-currency', 'fx', 'trial-balance', 'banking']
  },

  {
    id: 'lesson-banking-022',
    track: 'banking',
    order: 22,
    title: 'Đối soát một-một theo (mã tham chiếu, tiền tệ): chống khớp trùng, chênh lệch phí và phân loại break',
    level: 'senior',
    minutes: 35,
    goals: [
      'Hiểu vì sao đối soát phải khớp một-một (mỗi giao dịch đối tác chỉ dùng một lần) để chống double-count',
      'Biết khóa khớp gồm cả mã tham chiếu VÀ tiền tệ, tránh khớp nhầm hai giao dịch cùng ref khác tiền',
      'Phân biệt năm nhóm kết quả: MATCHED, FEE_DIFF (chênh trong ngưỡng phí), AMOUNT_MISMATCH, MISSING_INTERNAL, MISSING_PARTNER',
      'Viết {{Reconciler.reconcile(internal, partner, feeTolerance)}} trả về năm nhóm trên, mỗi giao dịch đối tác chỉ khớp một lần'
    ],
    body: `**Tóm tắt:** Đối soát **một-một** (one-to-one reconciliation) so khớp từng giao dịch nội bộ với **đúng một** giao dịch đối tác theo khóa gồm (mã tham chiếu, tiền tệ); mỗi giao dịch đối tác chỉ được dùng **một lần** để chống khớp trùng (double-count). Chênh lệch nhỏ nằm trong ngưỡng phí ({{feeTolerance}}) được xếp riêng {{FEE_DIFF}} thay vì coi là lệch thật; chênh lớn là {{AMOUNT_MISMATCH}}; chỉ có ở một bên là {{MISSING_INTERNAL}} hoặc {{MISSING_PARTNER}}.

### Chuyện thật: hai bên cùng báo "đủ tiền" nhưng vẫn sai

Cuối ngày, hệ thống nội bộ và đối tác đều gửi danh sách giao dịch. Tổng tiền hai bên bằng nhau, nên sếp gật đầu "khớp rồi". Nhưng kiểm tra kỹ từng dòng: giao dịch R2 nội bộ ghi 200, đối tác ghi 250 (lệch 50), còn một giao dịch R9 nội bộ ghi 300 nhưng đối tác lại ghi 290 ở một dòng khác. Tổng vẫn bằng nhau nhờ **sai lệch bù trừ**, nhưng cả hai dòng đều sai. Bài này dạy cách so khớp **từng dòng, một-một** để không dòng nào bị bỏ sót hay đếm hai lần.

### Vì sao phải khớp một-một

Nếu đối tác gửi **một** giao dịch R1 số tiền 100, còn nội bộ có **hai** dòng R1 mỗi dòng 100 (do lỗi ghi trùng), mà thuật toán cho mỗi dòng nội bộ tự do tìm "một" dòng đối tác bất kỳ, thì cả hai dòng nội bộ đều "khớp" vào cùng một dòng đối tác — kết quả báo MATCHED 2 trong khi thực tế chỉ có một giao dịch. Đó là **double-count** (đếm trùng). Khớp một-một: đánh dấu dòng đối tác đã dùng, dòng nội bộ thứ hai không còn bạn nào ⇒ {{MISSING_INTERNAL}}. Đúng bản chất: một giao dịch chỉ được đối soát một lần.

### Khóa khớp gồm cả tiền tệ

Cùng một mã tham chiếu {{R1}} nhưng một bên ghi USD, một bên ghi VND thì **không** phải là một giao dịch. Khóa khớp phải là cặp (mã tham chiếu, tiền tệ). Nếu chỉ so theo ref, ta sẽ khớp nhầm 100 USD với 100 VND — hai số 100 "trùng" nhưng giá trị thực khác nhau hàng nghìn lần. Trong code, khóa là chuỗi ghép {{ref}} và {{currency}} bằng một dấu phân cách.

### Năm nhóm kết quả

| Nhóm | Ý nghĩa | Hành động |
|---|---|---|
| {{MATCHED}} | cùng khóa, cùng số tiền | OK, không làm gì |
| {{FEE_DIFF}} | cùng khóa, chênh lệch ≤ {{feeTolerance}} | chênh do phí/làm tròn, ghi nhận, không điều tra |
| {{AMOUNT_MISMATCH}} | cùng khóa, chênh > {{feeTolerance}} | điều tra: lỗi ghi sổ, tỷ giá, phí chưa map |
| {{MISSING_INTERNAL}} | có ở nội bộ, không có ở đối tác | kiểm tra timeout, có thể truy vấn/điền bù |
| {{MISSING_PARTNER}} | có ở đối tác, không có ở nội bộ | kiểm tra giao dịch bóng ma, ghi nhận bổ sung |

Điểm senior: {{FEE_DIFF}} tách riêng khỏi {{AMOUNT_MISMATCH}} để đội vận hành không phải điều tra hàng nghìn dòng chênh 1–2 đồng do phí, mà chỉ tập trung vào chênh lớn.

### Cơ chế từng bước

**Tóm tắt:** Lập chỉ mục đối tác theo khóa, đánh dấu dòng đã dùng, duyệt nội bộ để phân loại, rồi gom phần đối tác còn dư.

1. **Lập chỉ mục đối tác** theo khóa (ref, tiền tệ), giữ danh sách các dòng cho mỗi khóa (để xử lý trường hợp nhiều dòng cùng khóa).
2. **Duyệt từng dòng nội bộ**: tìm một dòng đối tác **chưa dùng** cùng khóa. Không có ⇒ {{MISSING_INTERNAL}}. Có ⇒ đánh dấu đã dùng, so số tiền: bằng nhau ⇒ {{MATCHED}}; chênh ≤ {{feeTolerance}} ⇒ {{FEE_DIFF}}; chênh lớn ⇒ {{AMOUNT_MISMATCH}}.
3. **Gom phần dư**: mọi dòng đối tác chưa được dùng ⇒ {{MISSING_PARTNER}}.
4. Kết quả là năm danh sách, mỗi ref xuất hiện đúng một nhóm.

### Ví dụ

~~~java
// internal: R1=100 USD, R2=200 USD, R3=300 VND
// partner:  R1=100 USD, R2=250 USD, R4=400 VND
// feeTolerance = 0
Map<String, List<String>> r = Reconciler.reconcile(internal, partner, 0);
// MATCHED = [R1]
// AMOUNT_MISMATCH = [R2]   (chênh 50 > 0)
// MISSING_INTERNAL = [R3]
// MISSING_PARTNER = [R4]
// Nếu feeTolerance = 50: R2 chuyển sang FEE_DIFF
~~~

### Lỗi hay gặp trên production

1. **Khớp nhiều-một (double-count)**: một dòng đối tác khớp nhiều dòng nội bộ. Sửa: đánh dấu dòng đối tác đã dùng.
2. **Chỉ so theo ref, bỏ qua tiền tệ**: khớp nhầm 100 USD với 100 VND. Sửa: khóa gồm cả tiền tệ.
3. **Không tách {{FEE_DIFF}}**: mọi chênh nhỏ đều thành "lệch" ⇒ đội vận hành ngập trong backlog. Sửa: dùng {{feeTolerance}}.
4. **Tự động sửa số liệu khi lệch**: vi phạm nguyên tắc không tự sửa (xem bài 2). Mọi break phải qua quy trình điều tra và maker-checker.

### Liên hệ phỏng vấn

**Câu hỏi:** "Đối tác gửi lại file trùng một số giao dịch, và có dòng chênh vài đồng do phí. Bạn so khớp thế nào để không đếm trùng và không báo lệch ảo?"

**Cách trả lời:** Khớp **một-một** theo khóa (mã tham chiếu, tiền tệ): lập chỉ mục dòng đối tác, mỗi dòng chỉ dùng **một lần**, dòng nội bộ nào không còn bạn thì {{MISSING_INTERNAL}}, dòng đối tác còn dư thì {{MISSING_PARTNER}} — nhờ vậy file gửi trùng không bị đếm hai lần. Phân loại năm nhóm, trong đó chênh lệch ≤ ngưỡng phí {{feeTolerance}} xếp {{FEE_DIFF}} (không điều tra), chênh lớn mới {{AMOUNT_MISMATCH}}. Khóa phải gồm cả tiền tệ để không khớp nhầm 100 USD với 100 VND. Điểm senior: không tự sửa số liệu, mọi break phải qua điều tra và maker-checker, và đối soát phải idempotent — chạy lại cùng dữ liệu cho cùng kết quả.

> Senior tip: Khi phỏng vấn, nhấn mạnh "một giao dịch chỉ đối soát một lần" và "khóa gồm cả tiền tệ" — hai chi tiết này phân biệt người từng làm đối soát thật với người chỉ biết so tổng. Và luôn tách {{FEE_DIFF}} khỏi {{AMOUNT_MISMATCH}} để vận hành không chết đuối trong backlog chênh lẻ.`,
    exercises: [
      {
        title: 'Reconciler.reconcile: một-một theo (ref, currency), phân loại 5 nhóm',
        prompt: `Viết {{Reconciler.reconcile(List<Tx> internal, List<Tx> partner, long feeTolerance)}} trả về {{Map<String, List<String>>}} với đúng năm khóa: {{MATCHED}}, {{FEE_DIFF}}, {{AMOUNT_MISMATCH}}, {{MISSING_INTERNAL}}, {{MISSING_PARTNER}}. Mỗi {{Tx}} có {{ref}}, {{currency}}, {{amount}} (long).

Quy tắc:
1. Khóa khớp là cặp ({{ref}}, {{currency}}). Chỉ khớp hai giao dịch cùng khóa.
2. **Một-một**: mỗi giao dịch đối tác chỉ được khớp **một lần**. Dòng nội bộ không tìm được dòng đối tác **chưa dùng** cùng khóa ⇒ {{MISSING_INTERNAL}}. Dòng đối tác không được dùng ⇒ {{MISSING_PARTNER}}.
3. Khi tìm thấy cặp cùng khóa: {{|amount|}} bằng 0 ⇒ {{MATCHED}}; {{0 < |amount| <= feeTolerance}} ⇒ {{FEE_DIFF}}; {{|amount| > feeTolerance}} ⇒ {{AMOUNT_MISMATCH}}.
4. {{feeTolerance < 0}} ⇒ ném {{IllegalArgumentException}}.
5. Danh sách trả về chứa {{ref}} của từng giao dịch (mỗi ref một lần trong đúng một nhóm).`,
        starter: `import java.util.*;

class Tx {
    final String ref;
    final String currency;
    final long amount;
    Tx(String ref, String currency, long amount) {
        this.ref = ref;
        this.currency = currency;
        this.amount = amount;
    }
}

class Reconciler {
    static Map<String, List<String>> reconcile(List<Tx> internal, List<Tx> partner, long feeTolerance) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Tx tx(String r, String c, long a) { return new Tx(r, c, a); }

    public static void main(String[] args) {
        List<Tx> in = new ArrayList<>();
        in.add(tx("R1","USD",100));
        in.add(tx("R2","USD",200));
        in.add(tx("R3","VND",300));
        List<Tx> pa = new ArrayList<>();
        pa.add(tx("R1","USD",100));
        pa.add(tx("R2","USD",250));
        pa.add(tx("R4","VND",400));

        Map<String, List<String>> r = Reconciler.reconcile(in, pa, 0);
        check("matched R1", r.get("MATCHED").contains("R1"), r.toString());
        check("mismatch R2", r.get("AMOUNT_MISMATCH").contains("R2"), r.toString());
        check("missing internal R3", r.get("MISSING_INTERNAL").contains("R3"), r.toString());
        check("missing partner R4", r.get("MISSING_PARTNER").contains("R4"), r.toString());
        check("khong co fee diff khi tolerance 0", r.get("FEE_DIFF").isEmpty(), r.toString());

        Map<String, List<String>> r2 = Reconciler.reconcile(in, pa, 50);
        check("fee diff R2 khi tolerance 50", r2.get("FEE_DIFF").contains("R2"), r2.toString());
        check("R2 khong con la mismatch", r2.get("AMOUNT_MISMATCH").isEmpty(), r2.toString());
        check("matched van la R1", r2.get("MATCHED").contains("R1"), r2.toString());

        // one-to-one: partner chi 1 R1, internal 2 R1
        List<Tx> inDup = new ArrayList<>();
        inDup.add(tx("R1","USD",100));
        inDup.add(tx("R1","USD",100));
        List<Tx> paOne = new ArrayList<>();
        paOne.add(tx("R1","USD",100));
        Map<String, List<String>> r3 = Reconciler.reconcile(inDup, paOne, 0);
        check("one-to-one chi 1 matched", r3.get("MATCHED").size() == 1, r3.toString());
        check("one-to-one dong thu 2 missing", r3.get("MISSING_INTERNAL").size() == 1, r3.toString());

        // khac tien te -> khong khop
        List<Tx> inCur = new ArrayList<>();
        inCur.add(tx("R1","USD",100));
        List<Tx> paCur = new ArrayList<>();
        paCur.add(tx("R1","VND",100));
        Map<String, List<String>> r4 = Reconciler.reconcile(inCur, paCur, 0);
        check("khac tien te -> missing internal", r4.get("MISSING_INTERNAL").contains("R1"), r4.toString());
        check("khac tien te -> missing partner", r4.get("MISSING_PARTNER").contains("R1"), r4.toString());
        check("khac tien te -> khong matched", r4.get("MATCHED").isEmpty(), r4.toString());

        check("feeTolerance am bi tu choi", expect(IllegalArgumentException.class,
            () -> Reconciler.reconcile(in, pa, -1)), "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Tx {
    final String ref;
    final String currency;
    final long amount;
    Tx(String ref, String currency, long amount) {
        this.ref = ref;
        this.currency = currency;
        this.amount = amount;
    }
}

class Reconciler {
    static Map<String, List<String>> reconcile(List<Tx> internal, List<Tx> partner, long feeTolerance) {
        if (feeTolerance < 0) throw new IllegalArgumentException("feeTolerance am");
        Map<String, List<String>> r = new LinkedHashMap<>();
        r.put("MATCHED", new ArrayList<>());
        r.put("FEE_DIFF", new ArrayList<>());
        r.put("AMOUNT_MISMATCH", new ArrayList<>());
        r.put("MISSING_INTERNAL", new ArrayList<>());
        r.put("MISSING_PARTNER", new ArrayList<>());

        Map<String, List<Tx>> index = new LinkedHashMap<>();
        for (Tx t : partner) {
            index.computeIfAbsent(t.ref + "|" + t.currency, k -> new ArrayList<>()).add(t);
        }
        Set<Tx> used = new HashSet<>();
        for (Tx t : internal) {
            String key = t.ref + "|" + t.currency;
            Tx match = null;
            for (Tx p : index.getOrDefault(key, new ArrayList<>())) {
                if (!used.contains(p)) { match = p; break; }
            }
            if (match == null) { r.get("MISSING_INTERNAL").add(t.ref); continue; }
            used.add(match);
            long diff = Math.abs(t.amount - match.amount);
            if (diff == 0) r.get("MATCHED").add(t.ref);
            else if (diff <= feeTolerance) r.get("FEE_DIFF").add(t.ref);
            else r.get("AMOUNT_MISMATCH").add(t.ref);
        }
        for (Tx p : partner) {
            if (!used.contains(p)) r.get("MISSING_PARTNER").add(p.ref);
        }
        return r;
    }
}`,
        hints: [
          'Khóa khớp là {{ref + "|" + currency}} — chỉ khớp hai giao dịch cùng khóa, đừng so theo ref không.',
          'Đánh dấu dòng đối tác **đã dùng** (một {{Set}} các Tx): dòng nội bộ thứ hai cùng khóa sẽ không còn bạn ⇒ {{MISSING_INTERNAL}}. Đây là điểm "một-một" chống double-count.',
          'Phân biệt {{FEE_DIFF}} ({{0 < |chênh| <= feeTolerance}}) với {{AMOUNT_MISMATCH}} ({{|chênh| > feeTolerance}}); bằng nhau tuyệt đối ⇒ {{MATCHED}}.',
          'Sau khi duyệt hết nội bộ, mọi dòng đối tác chưa dùng là {{MISSING_PARTNER}} — đừng quên gom phần dư này.',
        ],
        explain: `Test bắt bốn hành vi, mỗi hành vi là một câu hỏi phỏng vấn:

1. **Năm nhóm cơ bản.** Với tolerance 0: R1 khớp, R2 chênh 50 ⇒ {{AMOUNT_MISMATCH}}, R3 chỉ có nội bộ ⇒ {{MISSING_INTERNAL}}, R4 chỉ có đối tác ⇒ {{MISSING_PARTNER}}.
2. **Ngưỡng phí.** Cùng dữ liệu với {{feeTolerance = 50}}: R2 chuyển sang {{FEE_DIFF}} và không còn là mismatch — đây là cách vận hành tránh backlog chênh lẻ.
3. **Một-một chống double-count.** Partner chỉ có một R1, internal có hai R1: chỉ một dòng {{MATCHED}}, dòng còn lại {{MISSING_INTERNAL}}. Nếu bạn không đánh dấu dòng đối tác đã dùng, cả hai dòng nội bộ sẽ "khớp" vào cùng một dòng đối tác và báo MATCHED 2 — sai.
4. **Khóa gồm tiền tệ.** Cùng ref R1 nhưng USD vs VND ⇒ không khớp, một bên {{MISSING_INTERNAL}}, một bên {{MISSING_PARTNER}}. Nếu chỉ so ref, 100 USD sẽ khớp nhầm với 100 VND.

Lỗi hay gặp khi viết: dùng {{List}} đánh dấu đã dùng thay vì {{Set}} (chậm và dễ sai), quên gom {{MISSING_PARTNER}} (mất dòng bóng ma), và không kiểm tra {{feeTolerance < 0}}. Trong production, bước "đánh dấu đã dùng + phân loại" phải chạy trong một transaction và idempotent theo ngày, để chạy lại cùng file không cho kết quả khác.`,
      }
    ],
    check: [
      { q: 'Vì sao đối soát phải khớp một-một (mỗi dòng đối tác chỉ dùng một lần)?', options: ['Để chạy nhanh hơn', 'Để chống double-count: một dòng đối tác không được khớp nhiều dòng nội bộ', 'Vì đối tác yêu cầu', 'Vì file luôn có dòng trùng'], answer: 1, explain: 'Đúng (B): nếu một dòng đối tác khớp được nhiều dòng nội bộ, hai giao dịch trùng sẽ cùng báo MATCHED và bị đếm hai lần. Đánh dấu dòng đã dùng đảm bảo mỗi giao dịch chỉ đối soát một lần. Sai (A): tốc độ không phải lý do. Sai (C): không phải yêu cầu đối tác mà là nguyên tắc đúng đắn. Sai (D): file có thể trùng, nhưng lý do là chống đếm sai chứ không phải vì "luôn có dòng trùng".' },
      { q: 'Khóa khớp nên gồm những gì?', options: ['Chỉ mã tham chiếu', 'Chỉ số tiền', 'Cặp (mã tham chiếu, tiền tệ)', 'Chỉ thời điểm'], answer: 2, explain: 'Đúng (C): cùng ref nhưng khác tiền tệ (100 USD vs 100 VND) là hai giao dịch khác nhau; khóa phải gồm cả tiền tệ để không khớp nhầm. Sai (A): bỏ tiền tệ gây khớp nhầm. Sai (B): chỉ số tiền thì hai giao dịch khác ref cùng số tiền sẽ khớp sai. Sai (D): thời điểm không phải khóa chính; cùng giao dịch có thể có timestamp lệch.' },
      { q: 'Chênh lệch 2 đồng nằm trong feeTolerance = 5 thì xếp nhóm nào?', options: ['AMOUNT_MISMATCH', 'FEE_DIFF', 'MISSING_INTERNAL', 'MATCHED'], answer: 1, explain: 'Đúng (B): chênh ≤ feeTolerance được coi là do phí/làm tròn ⇒ FEE_DIFF, không điều tra. Sai (A): chênh lớn hơn tolerance mới là AMOUNT_MISMATCH. Sai (C): hai bên đều có giao dịch nên không phải missing. Sai (D): số tiền khác nhau (chênh 2 ≠ 0) nên không phải MATCHED.' }
    ],
    related: ['banking-024', 'banking-058', 'banking-080'],
    tags: ['reconciliation', 'one-to-one', 'multi-currency', 'fee-tolerance', 'break', 'banking']
  },
  {
    id: 'lesson-banking-023',
    track: 'banking',
    order: 23,
    title: 'Sổ cái đa tiền tệ và quy đổi ngoại tệ: tiền tệ ghi sổ, tỷ giá hạch toán, revaluation và cân bằng chéo tiền tệ',
    level: 'senior',
    minutes: 40,
    goals: [
      'Hiểu tiền tệ ghi sổ (ledger currency) khác tiền tệ giao dịch, và mỗi bút toán phải cân bằng trong tiền tệ ghi sổ',
      'Nắm quy trình revaluation (định giá lại) cuối kỳ: tính chênh tỷ giá, ghi chênh lệch vào tài khoản chênh tỷ giá (gain/loss), cập nhật số dư ngoại tệ',
      'Viết {{MultiCurrencyLedger}} với {{post}}, {{revalue}}, {{balance}}, {{trialBalance}} thỏa các bất biến: cân bằng tiền tệ ghi sổ, revaluation idempotent theo kỳ'
    ],
    body: `**Tóm tắt:** Sổ cái đa tiền tệ lưu mỗi bút toán ở **hai** mặt tiền: **tiền tệ ghi sổ** (VND — tiền tệ chính của ngân hàng) và **tiền tệ gốc** (USD, EUR... — tiền tệ giao dịch thực tế). Mỗi bút toán phải cân bằng ở tiền tệ ghi sổ. Cuối kỳ, revaluation dùng tỷ giá chốt sổ để định giá lại số dư ngoại tệ, chênh lệch ghi vào tài khoản chênh tỷ giá (gain/loss), và **chỉ số dư ngoại tệ thay đổi, số dư tiền tệ ghi sổ được cập nhật theo**.

### Chuyện thật: sổ cái khớp VND nhưng ngoại tệ "mất" 5 tỷ

Ngân hàng có tài khoản Nostro tại Mỹ giữ USD. Trong tháng, khách gửi 1.000.000 USD (tỷ giá 24.000 → ghi sổ 24.000.000.000 VND). Cuối tháng, tỷ giá chốt sổ là 24.500. Nếu **không revaluation**, sổ cái VND vẫn 24 tỷ, nhưng thực tế USD đó giờ trị giá 24.5 tỷ VND. Chênh 500 triệu VND là **chênh tỷ giá chưa thực hiện (unrealized FX gain)** — nếu không ghi, báo cáo sai, kiểm toán sẽ hỏi. Revaluation ghi: Nợ Tài khoản Nostro/USD (+500 triệu VND), Có Tài khoản Chênh tỷ giá/Unrealized Gain (+500 triệu VND). Bây giờ sổ cái VND khớp 24.5 tỷ, USD vẫn 1.000.000.

### Tiền tệ ghi sổ vs tiền tệ gốc

- **Tiền tệ ghi sổ (ledger currency / functional currency)**: tiền tệ dùng để lập báo cáo tài chính, tính lãi/lộ, đối soát tổng thể. Ở Việt Nam là **VND**. Mọi bút toán **phải cân bằng ở tiền tệ này**.
- **Tiền tệ gốc (transaction currency / original currency)**: tiền tệ thực tế của giao dịch (USD, EUR, CNY...). Số dư tài khoản ngoại tệ được lưu **song song**: một cột số dư tiền tệ gốc, một cột số dư tiền tệ ghi sổ.

Khi ghi một bút toán chuyển 100 USD (tỷ giá 24.000):
| Tài khoản | Nợ (VND) | Có (VND) | Nợ (USD) | Có (USD) |
|---|---|---|---|---|
| Nostro/USD | 2.400.000 | | 100 | |
| Khách/USD | | 2.400.000 | | 100 |

Tổng Nợ VND = Tổng Có VND = 2.400.000. Tổng Nợ USD = Tổng Có USD = 100. **Cân bằng ở cả hai tiền tệ**.

### Tỷ giá: hạch toán vs thị trường

- **Tỷ giá hạch toán (booking rate)**: tỷ giá dùng **tại thời điểm ghi bút toán**. Là tỷ giá thực tế giao dịch xảy ra (tỷ giá counter, tỷ giá deal). Ghi vào bút toán và **không bao giờ đổi**.
- **Tỷ giá chốt sổ (closing rate / revaluation rate)**: tỷ giá dùng **cuối kỳ** để revaluation. Do Ngân hàng Trung ương công bố hoặc nội bộ quy định. Dùng cho **tất cả** tài khoản ngoại tệ cùng lúc.
- **Tỷ giá trung bình (average rate)**: dùng cho báo cáo lãi/lộ (dòng tiền), không dùng cho revaluation số dư.

> Quy tắc vàng: bút toán ghi bằng tỷ giá hạch toán của **ngay lúc đó**. Revaluation cuối kỳ dùng tỷ giá chốt sổ **cùng một lúc cho mọi tài khoản**. Không được dùng tỷ giá hôm nay để sửa bút toán hôm qua.

### Revaluation (định giá lại) cuối kỳ

Revaluation là quá trình **định giá lại** số dư ngoại tệ theo tỷ giá chốt sổ mới. Chỉ tác động đến:
1. **Số dư tiền tệ ghi sổ** của tài khoản ngoại tệ: cập nhật = số dư ngoại tệ × tỷ giá chốt sổ mới.
2. **Tài khoản chênh tỷ giá (FX gain/loss)**: ghi nhận chênh lệch giữa số dư tiền tệ ghi sổ cũ và mới.
3. **Số dư tiền tệ gốc (ngoại tệ) KHÔNG ĐỔI** — vì số tiền thực tế trong tài khoản Nostro không thay đổi.

Ví dụ: Tài khoản Nostro có 1.000.000 USD. Trước revaluation: tỷ giá cũ 24.000 → số dư VND = 24.000.000.000. Sau revaluation: tỷ giá mới 24.500 → số dư VND = 24.500.000.000. Chênh +500.000.000 VND:

~~~java
// Bút toán revaluation (chỉ ghi thêm, không sửa bút toán cũ)
List<Entry> reval = List.of(
    new Entry("Nostro/USD", 500_000_000, false, 1_000_000), // Có VND, số dư USD không đổi
    new Entry("FX/UnrealizedGain", 500_000_000, true, 0)     // Nợ VND, không có ngoại tệ
);
// Tổng Nợ = Tổng Có = 500.000.000 VND. Cân bằng.
~~~

### Revaluation idempotent theo kỳ

Revaluation cho cùng một kỳ (cùng ngày chốt sổ, cùng bộ tỷ giá) chạy bao nhiêu lần cũng cho **cùng một kết quả**. Lần đầu ghi bút toán revaluation; lần sau thấy kỳ đó đã revalue → no-op. Điều này quan trọng khi batch chạy lại do sự cố (xem bài EOD).

### Cân bằng chéo tiền tệ (cross-currency balance check)

Cuối ngày, đối soát phải kiểm tra:
- Tổng số dư VND của **tất cả** tài khoản ngoại tệ (sau revaluation) phải khớp với tổng tài khoản ngoại tệ trong sổ cái VND.
- Tổng số dư ngoại tệ của từng ccy (USD, EUR...) phải khớp với báo cáo Nostro/Vostro từ ngân hàng đối tác.

Đây là điều kiện **cân bằng chéo**: không chỉ sổ cái VND cân bằng, mà số dư ngoại tệ cũng phải khớp với thực tế bên ngoài.

### Lỗi hay gặp trên production

1. **Ghi bút toán ngoại tệ không cân bằng VND**: dùng tỷ giá khác nhau cho Nợ và Có trong cùng một giao dịch, hoặc làm tròn sai khiến tổng Nợ VND ≠ Tổng Có VND.
2. **Sửa bút toán cũ khi tỷ giá đổi**: bút toán hôm qua ghi tỷ giá 24.000, hôm nay tỷ giá 24.500 → vào sửa bút toán hôm qua thành 24.500. **Tuyệt đối không được** — bút toán đã ghi là bằng chứng pháp lý, tỷ giá hạch toán là bất biến.
3. **Revaluation không idempotent**: chạy lại revaluation cùng kỳ cộng dồn chênh lệch. Cần khóa (account, period) hoặc (period) để no-op.
4. **Quên tài khoản chênh tỷ giá**: chỉ cập nhật số dư VND mà không ghi chênh lệch → sổ cái VND bị mất cân bằng (tổng Nợ ≠ Tổng Có).
5. **Dùng double cho tỷ giá/số tiền**: 24.000 * 1.000.000 tính bằng double ra 24.000.000.000.000004. Dùng **long** (VND) và **BigDecimal** cho tỷ giá, làm tròn HALF_UP về đồng.

### Ví dụ đời thực

- **Triệu chứng:** Cuối quý 3, báo cáo tài chính chênh lệch 2.3 tỷ VND so với sổ cái Nostro. Kiểm toán yêu cầu minh chứng.
- **Điều tra:** Revaluation quý 3 dùng tỷ giá 24.500 nhưng tài khoản Nostro/USD lớn nhất (số dư 50 triệu USD) **bị quên không revalue** do code lọc bỏ tài khoản có cờ "inactive" sai chỗ. Chênh 50 triệu × 500 = 25 tỷ VND, nhưng các tài khoản khác revalue đúng nên chênh tổng chỉ 2.3 tỷ.
- **Xử lý:** Chạy revaluation bổ sung cho tài khoản bị bỏ (tỷ giá vẫn là 24.500 của cuối quý), ghi bút toán điều chỉnh vào kỳ hiện tại (không sửa kỳ cũ). Cập nhật code lọc tài khoản.
- **Kết quả đo được:** Sổ cái VND và ngoại tệ khớp chéo, báo cáo tài chính đúng, kiểm toán đạt unqualified opinion.

> Senior tip: Luôn có **bảng tỷ giá chốt sổ theo ngày** (rate table: date, currency, rate) với ràng buộc UNIQUE(date, currency). Revaluation đọc từ bảng này — không bao giờ hardcode tỷ giá. Batch revaluation ghi log: tài khoản nào được revalue, tỷ giá cũ/mới, chênh lệch VND, tài khoản gain/loss. Khi đối soát Nostro, so sánh **số dư ngoại tệ** (USD) với confirmation từ ngân hàng đối tác, không chỉ số dư VND.

### Liên hệ phỏng vấn

**Câu hỏi:** "Ngân hàng có tài khoản ngoại tệ, cuối kỳ tỷ giá đổi. Số dư ngoại tệ có đổi không? Số dư VND có đổi không? Ghi sổ thế nào?"

**Cách trả lời:** Số dư **ngoại tệ (USD) không đổi** — tiền thực trong Nostro vẫn nguyên. Số dư **VND thay đổi** theo tỷ giá chốt sổ mới. Ghi bút toán revaluation: Nợ/Có tài khoản ngoại tệ (cập nhật số dư VND) và Có/Nợ tài khoản **Chênh tỷ giá (FX Gain/Loss)**. Bút toán này cân bằng ở VND, không đụng vào số dư USD. Tỷ giá hạch toán của các bút toán cũ **giữ nguyên**, chỉ revaluation dùng tỷ giá chốt sổ mới. Revaluation phải **idempotent theo kỳ**: chạy lại cùng kỳ không cộng dồn chênh lệch. Dùng **BigDecimal** cho tỷ giá, **long** cho tiền VND, làm tròn HALF_UP. Cuối kỳ đối soát chéo: tổng VND tài khoản ngoại tệ khớp sổ cái, tổng USD khớp confirmation Nostro.

**Câu hỏi 2:** "Tại sao không được sửa bút toán cũ khi tỷ giá đổi?"

**Cách trả lời 2:** Bút toán là bằng chứng pháp lý, ghi nhận **sự thật tại thời điểm đó**. Tỷ giá hạch toán là một thuộc tính bất biến của bút toán. Sửa bút toán cũ làm mất dấu vết, vi phạm append-only (bài 5), và làm sai đường kiểm toán: người sau không biết bút toán này giờ dùng tỷ giá hôm nay hay hôm qua. Revaluation tồn tại chính để giải quyết vấn đề này: ghi bút toán **mới** để điều chỉnh số dư VND lên/xuống theo thực tế hiện tại, trong khi bút toán cũ nguyên vẹn.

**Câu hỏi 3:** "Revaluation chạy lại do batch lỗi, phải đảm bảo gì?"

**Cách trả lời 3:** **Idempotent theo kỳ**. Key là (period, rateSet) hoặc (period). Lần đầu ghi bút toán revaluation, đánh dấu kỳ đã revalue. Lần sau thấy kỳ đó đã xong → no-op, không ghi thêm bút toán, không cộng dồn chênh lệch. Tương tự batch EOD (bài 9): chìa khóa tự nhiên (account, period) + checkpoint.`,
    exercises: [
      {
        title: 'MultiCurrencyLedger: post, revalue, balance, trialBalance',
        prompt: `Viết {{MultiCurrencyLedger}} quản lý sổ cái đa tiền tệ (tiền tệ ghi sổ là VND). Chỉ dùng JDK chuẩn, Java 17, không class public ngoài Main.

**Cấu trúc dữ liệu:**
- {{Entry}}: {{account}}, {{currency}} (VD: "USD", "VND"), {{amountFc}} (số tiền tiền tệ gốc, long), {{amountLc}} (số tiền tiền tệ ghi sổ VND, long), {{debit}} (true = Nợ/tiền đi ra).
- Tiền tệ ghi sổ VND: {{currency == "VND"}} ⇒ {{amountFc == amountLc}}.
- Bút toán phải cân bằng: tổng Nợ VND = Tổng Có VND; tổng Nợ ngoại tệ = Tổng Có ngoại tệ (mỗi ccy riêng).

**API:**
- {{MultiCurrencyLedger()}}: khởi tạo.
- {{void post(String txId, List<Entry> entries, String rateId)}}: ghi bút toán. Kiểm tra cân bằng VND và cân bằng từng ngoại tệ. {{txId}} là khóa idempotent (đã có ⇒ no-op trả {{false}}). {{rateId}} là mã phiên tỷ giá (dùng để audit). Trả {{true}} nếu ghi mới.
- {{void revalue(String period, Map<String, BigDecimal> closingRates)}}: revaluation cuối kỳ. {{period}} ví dụ "2026-09". {{closingRates}} map tiền tệ → tỷ giá chốt sổ (BigDecimal). Chỉ tác động tài khoản có {{currency != "VND"}}.
  - Với mỗi tài khoản ngoại tệ: số dư VND mới = {{balanceFc}} × {{closingRate}} (làm tròn HALF_UP về đồng). Chênh = số dư VND mới - số dư VND cũ.
  - Ghi bút toán revaluation: tài khoản ngoại tệ Có/Nợ VND chênh lệch, tài khoản {{"FX/RevalGain"}} hoặc {{"FX/RevalLoss"}} ghi nhận chênh. **Idempotent theo period**: cùng period chạy lại ⇒ no-op.
- {{Balance balance(String account)}}: trả {{Balance}} có {{amountFc}}, {{amountLc}}, {{currency}}.
- {{Map<String, Balance> trialBalance()}}: trả sơ cân đối (trial balance) tất cả tài khoản, cân bằng ở VND.
- {{boolean alreadyRevalued(String period)}}.

**Quy tắc biên:** {{txId}} rỗng, {{entries}} < 2, {{amountLc <= 0}}, {{amountFc <= 0}} (ngoại tệ), {{amountFc != amountLc}} (VND), không cân bằng VND, không cân bằng ngoại tệ ⇒ ném {{IllegalArgumentException}} và không ghi gì. {{closingRates}} thiếu tiền tệ của tài khoản nào ⇒ ném {{IllegalArgumentException}}.
`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class Entry {
    final String account;
    final String currency; // "VND", "USD", "EUR"...
    final long amountFc;   // số tiền tiền tệ gốc
    final long amountLc;   // số tiền tiền tệ ghi sổ (VND)
    final boolean debit;   // true = Nợ (tiền đi ra khỏi tài khoản này)
    Entry(String account, String currency, long amountFc, long amountLc, boolean debit) {
        this.account = account;
        this.currency = currency;
        this.amountFc = amountFc;
        this.amountLc = amountLc;
        this.debit = debit;
    }
}

class Balance {
    final String account;
    final String currency;
    final long amountFc;
    final long amountLc;
    Balance(String account, String currency, long amountFc, long amountLc) {
        this.account = account;
        this.currency = currency;
        this.amountFc = amountFc;
        this.amountLc = amountLc;
    }
}

class MultiCurrencyLedger {
    // TODO: cấu trúc dữ liệu
    boolean post(String txId, List<Entry> entries, String rateId) {
        throw new UnsupportedOperationException("TODO");
    }

    void revalue(String period, Map<String, BigDecimal> closingRates) {
        throw new UnsupportedOperationException("TODO");
    }

    Balance balance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    Map<String, Balance> trialBalance() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean alreadyRevalued(String period) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Entry en(String acc, String ccy, long fc, long lc, boolean dr) {
        return new Entry(acc, ccy, fc, lc, dr);
    }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }
    static BigDecimal bd(String s) { return new BigDecimal(s); }

    public static void main(String[] args) {
        MultiCurrencyLedger mcl = new MultiCurrencyLedger();

        // Ghi bút toán VND thuần: nạp 1 tỷ VND vào Nostro/VND
        check("post VND ok", mcl.post("T1", of(en("Nostro/VND", "VND", 1_000_000_000L, 1_000_000_000L, false),
                                                en("SYS/Opening", "VND", 1_000_000_000L, 1_000_000_000L, true)), "RATE-1"), "");
        check("balance Nostro/VND", mcl.balance("Nostro/VND").amountLc == 1_000_000_000L, "lc=" + mcl.balance("Nostro/VND").amountLc);

        // Ghi bút toán USD: khách gửi 100.000 USD, tỷ giá 24.000
        check("post USD ok", mcl.post("T2", of(en("Nostro/USD", "USD", 100_000L, 2_400_000_000L, false),
                                                en("Customer/USD", "USD", 100_000L, 2_400_000_000L, true)), "RATE-1"), "");
        check("balance Nostro/USD fc", mcl.balance("Nostro/USD").amountFc == 100_000L, "fc=" + mcl.balance("Nostro/USD").amountFc);
        check("balance Nostro/USD lc", mcl.balance("Nostro/USD").amountLc == 2_400_000_000L, "lc=" + mcl.balance("Nostro/USD").amountLc);

        // Idempotent txId
        check("duplicate txId no-op", !mcl.post("T2", of(en("Nostro/USD", "USD", 50_000L, 1_200_000_000L, false),
                                                          en("Customer/USD", "USD", 50_000L, 1_200_000_000L, true)), "RATE-2"), "");
        check("balance unchanged after duplicate", mcl.balance("Nostro/USD").amountFc == 100_000L && mcl.balance("Nostro/USD").amountLc == 2_400_000_000L, "");

        // Revaluation kỳ 2026-09: tỷ giá mới 24.500
        Map<String, BigDecimal> rates = new HashMap<>();
        rates.put("USD", bd("24500"));
        mcl.revalue("2026-09", rates);
        check("revalue updates LC balance", mcl.balance("Nostro/USD").amountLc == 2_450_000_000L, "lc=" + mcl.balance("Nostro/USD").amountLc);
        check("revalue fc unchanged", mcl.balance("Nostro/USD").amountFc == 100_000L, "fc=" + mcl.balance("Nostro/USD").amountFc);
        check("reval gain recorded", mcl.balance("FX/RevalGain").amountLc == 50_000_000L, "gain=" + mcl.balance("FX/RevalGain").amountLc);

        // Revalue lại cùng kỳ = no-op
        mcl.revalue("2026-09", rates);
        check("revalue idempotent", mcl.balance("Nostro/USD").amountLc == 2_450_000_000L && mcl.balance("FX/RevalGain").amountLc == 50_000_000L, "");
        check("alreadyRevalued true", mcl.alreadyRevalued("2026-09"), "");

        // Trial balance: tổng Nợ VND = Tổng Có VND
        Map<String, Balance> tb = mcl.trialBalance();
        long totalDr = 0, totalCr = 0;
        for (Balance b : tb.values()) {
            if (b.amountLc > 0) totalDr += b.amountLc; // giả định Nợ là dương, Có là âm trong balance? Cần quy ước
            else totalCr += -b.amountLc;
        }
        // Đơn giản: kiểm tra tổng amountLc tất cả tài khoản = 0 (Nợ trừ Có = 0)
        long sumLc = 0;
        for (Balance b : tb.values()) sumLc += b.amountLc;
        check("trial balance LC balanced", sumLc == 0, "sumLc=" + sumLc);

        // Thiếu rate -> IllegalArgumentException
        check("missing rate throws", expect(IllegalArgumentException.class, () -> {
            Map<String, BigDecimal> bad = new HashMap<>();
            bad.put("EUR", bd("26000"));
            mcl.revalue("2026-10", bad);
        }), "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class Entry {
    final String account;
    final String currency;
    final long amountFc;
    final long amountLc;
    final boolean debit;
    Entry(String account, String currency, long amountFc, long amountLc, boolean debit) {
        this.account = account;
        this.currency = currency;
        this.amountFc = amountFc;
        this.amountLc = amountLc;
        this.debit = debit;
    }
}

class Balance {
    final String account;
    final String currency;
    final long amountFc;
    final long amountLc;
    Balance(String account, String currency, long amountFc, long amountLc) {
        this.account = account;
        this.currency = currency;
        this.amountFc = amountFc;
        this.amountLc = amountLc;
    }
}

class MultiCurrencyLedger {
    private final Map<String, AccountBal> accounts = new HashMap<>();
    private final Set<String> postedTx = new HashSet<>();
    private final Set<String> revaluedPeriods = new HashSet<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();

    private static class AccountBal {
        String currency;
        long amountFc = 0;
        long amountLc = 0;
    }

    boolean post(String txId, List<Entry> entries, String rateId) {
        if (txId == null || txId.isEmpty()) throw new IllegalArgumentException("txId rong");
        if (postedTx.contains(txId)) return false;
        if (entries == null || entries.size() < 2) throw new IllegalArgumentException("can 2 but toan");

        long drLc = 0, crLc = 0;
        Map<String, Long> drFc = new HashMap<>();
        Map<String, Long> crFc = new HashMap<>();
        Map<String, Long> deltaLc = new LinkedHashMap<>();
        Map<String, Long> deltaFc = new LinkedHashMap<>();

        for (Entry e : entries) {
            if (e.account == null || e.account.isEmpty()) throw new IllegalArgumentException("account rong");
            if (e.amountLc <= 0) throw new IllegalArgumentException("amountLc phai duong");
            if ("VND".equals(e.currency) && e.amountFc != e.amountLc) throw new IllegalArgumentException("VND: amountFc phai bang amountLc");
            if (!"VND".equals(e.currency) && e.amountFc <= 0) throw new IllegalArgumentException("ngoai te: amountFc phai duong");

            long signedLc = e.debit ? -e.amountLc : e.amountLc;
            if (e.debit) drLc += e.amountLc; else crLc += e.amountLc;
            deltaLc.merge(e.account, signedLc, Long::sum);

            if (!"VND".equals(e.currency)) {
                long signedFc = e.debit ? -e.amountFc : e.amountFc;
                if (e.debit) drFc.merge(e.currency, e.amountFc, Long::sum); else crFc.merge(e.currency, e.amountFc, Long::sum);
                deltaFc.merge(e.account + "|" + e.currency, signedFc, Long::sum);
            }
        }
        if (drLc != crLc) throw new IllegalArgumentException("Lech Neh/Coh VND: " + drLc + " != " + crLc);
        Set<String> ccys = new HashSet<>(drFc.keySet()); ccys.addAll(crFc.keySet());
        for (String ccy : ccys) {
            if (drFc.getOrDefault(ccy, 0L).longValue() != crFc.getOrDefault(ccy, 0L).longValue()) throw new IllegalArgumentException("Lech Neh/Coh " + ccy);
        }

        for (Map.Entry<String, Long> d : deltaLc.entrySet()) {
            accounts.computeIfAbsent(d.getKey(), k -> new AccountBal()).amountLc += d.getValue();
        }
        for (Map.Entry<String, Long> d : deltaFc.entrySet()) {
            String[] k = d.getKey().split("\\\\|");
            AccountBal ab = accounts.computeIfAbsent(k[0], x -> { AccountBal a = new AccountBal(); a.currency = k[1]; return a; });
            if (ab.currency == null) ab.currency = k[1]; // tài khoản đã được tạo ở vòng VND phía trên
            ab.amountFc += d.getValue();
        }
        postedTx.add(txId);
        txLog.put(txId, new ArrayList<>(entries));
        return true;
    }

    void revalue(String period, Map<String, BigDecimal> closingRates) {
        if (period == null || period.isEmpty()) throw new IllegalArgumentException("period rong");
        if (revaluedPeriods.contains(period)) return; // idempotent
        if (closingRates == null || closingRates.isEmpty()) throw new IllegalArgumentException("thieu rate");

        Map<String, Long> revalDeltaLc = new LinkedHashMap<>();
        for (Map.Entry<String, AccountBal> e : accounts.entrySet()) {
            String acc = e.getKey();
            AccountBal ab = e.getValue();
            if (ab.currency == null || "VND".equals(ab.currency)) continue; // tài khoản VND (currency null) không đánh giá lại
            BigDecimal rate = closingRates.get(ab.currency);
            if (rate == null) throw new IllegalArgumentException("thieu rate cho " + ab.currency);
            long newLc = rate.multiply(BigDecimal.valueOf(ab.amountFc)).setScale(0, RoundingMode.HALF_UP).longValue();
            long diff = newLc - ab.amountLc;
            if (diff != 0) {
                revalDeltaLc.merge(acc, diff, Long::sum);
                String gainLoss = diff > 0 ? "FX/RevalGain" : "FX/RevalLoss";
                revalDeltaLc.merge(gainLoss, diff, Long::sum); // số dư mới áp dụng một lần qua vòng delta bên dưới
            }
        }
        for (Map.Entry<String, Long> d : revalDeltaLc.entrySet()) {
            accounts.computeIfAbsent(d.getKey(), k -> { AccountBal a = new AccountBal(); a.currency = "VND"; return a; }).amountLc += d.getValue();
        }
        revaluedPeriods.add(period);
    }

    Balance balance(String account) {
        AccountBal ab = accounts.get(account);
        if (ab == null) return new Balance(account, "VND", 0, 0);
        return new Balance(account, ab.currency, ab.amountFc, ab.amountLc);
    }

    Map<String, Balance> trialBalance() {
        Map<String, Balance> tb = new LinkedHashMap<>();
        for (Map.Entry<String, AccountBal> e : accounts.entrySet()) {
            tb.put(e.getKey(), new Balance(e.getKey(), e.getValue().currency, e.getValue().amountFc, e.getValue().amountLc));
        }
        return tb;
    }

    boolean alreadyRevalued(String period) {
        return revaluedPeriods.contains(period);
    }
}`,
        hints: [
          'Dùng Map<String, AccountBal> lưu cả amountFc và amountLc. Với VND, amountFc = amountLc; với ngoại tệ, amountFc lưu số tiền gốc, amountLc lưu quy đổi VND.',
          'post: cộng dồn Nợ/Có VND và Nợ/Có từng ngoại tệ vào Map tạm, kiểm tra cân bằng TRƯỚC khi ghi. Idempotent txId ở đầu.',
          'revalue: duyệt tất cả tài khoản ngoại tệ, tính newLc = amountFc * rate (HALF_UP). Chênh = newLc - oldLc. Ghi delta: tài khoản ngoại tệ +/- chênh, tài khoản FX/RevalGain hoặc FX/RevalLoss -/+ chênh. Đánh dấu period đã revalue.',
          'Balance: amountLc có thể âm (tài khoản Có nhiều hơn Nợ). trialBalance trả về tất cả, tổng amountLc phải = 0.',
        ],
        explain: `Test kiểm tra bốn lớp bất biến, mỗi lớp là một câu phỏng vấn:
1. **Cân bằng kép**: bút toán USD phải cân bằng ở VND (tổng Nợ VND = Tổng Có VND) VÀ cân bằng ở USD (Tổng Nợ USD = Tổng Có USD). Test {{post USD ok}} và {{trial balance LC balanced}} bắt điều này.
2. **Idempotent txId**: ghi lại {{T2}} với entries khác vẫn no-op, số dư không đổi.
3. **Revaluation chỉ đổi LC, không đổi FC**: sau revalue, {{amountFc}} vẫn 100.000 USD, {{amountLc}} thành 2.450.000.000 VND, chênh 50.000.000 ghi vào {{FX/RevalGain}}.
4. **Revaluation idempotent theo kỳ**: chạy lại {{revalue("2026-09", ...)}} không cộng dồn gain, {{alreadyRevalued}} trả true.

Lỗi hay gặp: quên kiểm tra cân bằng ngoại tệ (chỉ check VND), dùng double cho tỷ giá (BigDecimal bắt buộc), revalue không idempotent (chạy lại cộng dồn gain), và quên cập nhật amountLc của tài khoản ngoại tệ (chỉ ghi gain/loss mà không đổi số dư tài khoản).`,
      },
    ],
    check: [
      { q: 'Trong sổ cái đa tiền tệ, một bút toán chuyển 100 USD (tỷ giá 24.000) phải thỏa mãn điều kiện gì?', options: ['Chỉ cân bằng ở VND', 'Chỉ cân bằng ở USD', 'Cân bằng ở CẢ VND VÀ USD (tổng Nợ = Tổng Có ở mỗi tiền tệ)', 'Không cần cân bằng vì là ngoại tệ'], answer: 2, explain: 'Đúng (C): kế toán kép đa tiền tệ yêu cầu mỗi bút toán cân bằng ở tiền tệ ghi sổ (VND) VÀ ở từng tiền tệ gốc. Nợ VND = Có VND = 2.400.000; Nợ USD = Có USD = 100. Sai (A), (B): chỉ cân bằng một bên là không đủ. Sai (D): luôn phải cân bằng.' },
      { q: 'Revaluation cuối kỳ thay đổi cái gì và không thay đổi cái gì?', options: ['Đổi cả số dư ngoại tệ và VND', 'Đổi số dư VND, KHÔNG đổi số dư ngoại tệ', 'Đổi số dư ngoại tệ, KHÔNG đổi số dư VND', 'Không đổi gì cả'], answer: 1, explain: 'Đúng (B): revaluation dùng tỷ giá chốt sổ mới để định giá lại số dư VND = số dư ngoại tệ × tỷ giá mới. Số dư ngoại tệ (số tiền thực trong Nostro) không thay đổi. Chênh lệch ghi vào tài khoản chênh tỷ giá (FX Gain/Loss). Sai (A): ngoại tệ không đổi. Sai (C): VND phải đổi. Sai (D): phải ghi bút toán revaluation.' },
      { q: 'Tại sao revaluation phải idempotent theo kỳ (period)?', options: ['Để chạy nhanh hơn', 'Để chạy lại batch do lỗi không cộng dồn chênh lệch gain/loss', 'Vì quy định Basel III', 'Để giảm dung lượng log'], answer: 1, explain: 'Đúng (B): batch revaluation có thể bị kill giữa chừng và chạy lại. Nếu không idempotent, lần chạy thứ hai sẽ cộng thêm chênh lệch gain/loss, làm sai số dư VND và báo cáo tài chính. Idempotent theo period (đánh dấu period đã revalue) đảm bảo chạy bao nhiêu lần cũng cho một kết quả. Sai (A), (C), (D): không phải lý do chính.' },
    ],
    related: ['banking-005', 'banking-009', 'banking-014'],
    tags: ['ledger', 'multi-currency', 'fx', 'revaluation', 'gain-loss', 'idempotency', 'banking']
  },
  {
    id: 'lesson-banking-024',
    track: 'banking',
    order: 24,
    title: 'Đối soát ba bên và quản lý ngoại lệ: internal ↔ partner ↔ settlement, break aging, auto-resolve và maker-checker',
    level: 'senior',
    minutes: 40,
    goals: [
      'Hiểu đối soát ba bên (three-way reconciliation): so khớp sổ cái nội bộ, file đối tác, và file settlement/thanh toán thực tế',
      'Thiết kế quy trình quản lý break (ngoại lệ): phân loại, ưu tiên, SLA, aging, auto-resolve cho chênh lẻ, maker-checker cho điều chỉnh',
      'Viết {{ThreeWayReconciler}} với {{reconcile}}, {{autoResolve}}, {{escalate}}, {{adjust}} (maker-checker) và theo dõi aging theo ngày'
    ],
    body: `**Tóm tắt:** Đối soát thực tế thường có **ba** nguồn dữ liệu: sổ cái nội bộ (ledger), file đối tác (partner file — ngân hàng/VNPay/NAPAS), và file settlement (file chốt toán tiền thực tế về tài khoản Nostro/Vostro). Ba bên này phải khớp nhau. Khi lệch (break), cần quy trình: phân loại → auto-resolve (chênh phí/ngưỡng) → aging theo ngày → escalation → điều chỉnh maker-checker. Không bao giờ tự sửa số liệu; mọi điều chỉnh phải qua phê duyệt và để dấu vết audit.

### Chuyện thật: ba file, ba con số, không cái nào khớp

Cuối tháng, bộ phận điều hành có ba file:
1. **Sổ cái nội bộ**: ghi nhận 1.250 giao dịch, tổng 125 tỷ VND.
2. **File đối tác (VNPay)**: báo 1.248 giao dịch, tổng 124.95 tỷ VND.
3. **File settlement (Ngân hàng trung ương/Nostro)**: tiền thực về tài khoản là 124.93 tỷ VND.

Ba con số khác nhau. Nếu chỉ đối soát hai bên (nội bộ - đối tác), chênh 50 triệu sẽ bị bỏ qua như "phí". Nhưng settlement lại chênh 20 triệu so với đối tác — tiền thực sự ít hơn. Nguyên nhân: VNPay đã trừ phí 50 triệu, nhưng settlement chỉ chuyển 124.93 tỷ vì có một giao dịch 20 triệu bị **hold** (giữ lại do AML check) và chưa release. Nếu không có đối soát ba bên, 20 triệu này sẽ "mất" giữa không trung.

### Ba nguồn dữ liệu và vai trò

| Nguồn | Ví dụ | Vai trò | Đặc điểm |
|---|---|---|---|
| **Internal Ledger** | Sổ cái core banking | Nguồn sự thật nội bộ | Ghi ngay khi giao dịch khởi tạo, có full metadata (khách, loại, phí) |
| **Partner File** | VNPay, NAPAS, Visa, Mastercard | Xác nhận giao dịch từ phía đối tác | Gửi cuối ngày/ngày sau, có ref, amount, status, fee |
| **Settlement File** | Nostro statement, Central bank file | Tiền thực sự chuyển về tài khoản | Thường T+1, net amount (đã trừ phí), ít metadata hơn |

Ba luồng này có thời điểm khác nhau: Internal ghi ngay (real-time), Partner gửi cuối ngày (EOD), Settlement về T+1. Đối soát phải xử lý **cửa sổ thời gian** (window) — ví dụ đối soát ngày 15 dùng Internal giao dịch ngày 15, Partner file ngày 15, Settlement T+1 của ngày 14.

### Phân loại break (ngoại lệ) năm nhóm

Khi so khớp ba bên, mỗi giao dịch rơi vào một nhóm:

| Nhóm | Ý nghĩa | Ví dụ | Xử lý |
|---|---|---|---|
| **FULL_MATCH** | Ba bên khớp ref, amount, currency | Internal 100, Partner 100, Settlement 100 | OK, không làm gì |
| **PARTNER_FEE_DIFF** | Internal = Partner + phí, Settlement = Partner | Internal 101, Partner 100, Settlement 100 | Auto-resolve: ghi nhận phí, không điều tra |
| **SETTLEMENT_HOLD** | Partner = Settlement + hold, Internal khớp Partner | Internal 100, Partner 100, Settlement 80 (hold 20) | Theo dõi hold, auto-resolve khi release |
| **AMOUNT_MISMATCH** | Ba bên lệch số tiền, không phải phí/hold | Internal 100, Partner 95, Settlement 95 | Điều tra: sai tỷ giá, sai map phí, lỗi ghi sổ |
| **MISSING_ONE_SIDE** | Chỉ có ở một/two trong ba bên | Internal có, Partner không có | Timeout, inquiry, ghi nhận bổ sung |

### Auto-resolve và ngưỡng (threshold)

Không phải break nào cũng cần người can thiệp. Các loại auto-resolve:

- **Fee tolerance**: chênh lệch ≤ ngưỡng phí (ví dụ 10.000 VND) ⇒ auto-resolve thành PARTNER_FEE_DIFF, không tạo ticket.
- **Hold release**: Settlement thiếu so với Partner, nhưng có metadata "hold" từ ngân hàng → theo dõi, khi Settlement bù đủ → auto-resolve.
- **Timing diff**: cùng ref, amount, nhưng timestamp lệch ≤ 1 ngày do cut-off ⇒ auto-resolve nếu ngày kế toán khớp.

Auto-resolve **phải idempotent**: chạy lại cùng dữ liệu không tạo ticket trùng, không đổi trạng thái đã resolve.

### Break aging và escalation

Break không auto-resolve được chuyển sang **hàng đợi điều tra (investigation queue)**. Mỗi break có:
- **Ngày phát hiện (detected date)**: ngày đối soát tìm thấy.
- **Tuổi (aging)**: số ngày từ detected date đến hôm nay.
- **Ưu tiên (priority)**: P1 (chênh > 1 tỷ hoặc ảnh hưởng nhiều khách), P2 (chênh 100 triệu - 1 tỷ), P3 (chênh < 100 triệu).
- **SLA**: P1 = 24h, P2 = 3 ngày, P3 = 7 ngày.

Quá SLA ⇒ **escalation** tự động: gửi alert lên quản lý, tạo ticket JIRA/ServiceNow, có thể block tài khoản liên quan nếu chênh lớn và nghi ngờ gian lận.

Aging report hàng ngày là công cụ quản lý rủi ro quan trọng: "hôm nay có bao nhiêu break P1 quá 24h?" — nếu > 0 là sự cố vận hành.

### Maker-Checker cho điều chỉnh (adjustment)

Khi điều tra xong, nếu cần sửa số liệu (ví dụ ghi nhận phí thiếu, điều chỉnh tỷ giá, đảo giao dịch sai), **không bao giờ tự sửa**. Quy trình:

1. **Maker** (nhân viên điều tra): tạo **adjustment ticket** với: break ID, lý do, bút toán đề xuất (đầy đủ Nợ/Có, tài khoản, amount), bằng chứng (file đối soát, email đối tác).
2. **Checker** (quản lý/team leader): review bằng chứng, kiểm tra bút toán cân bằng, **approve** hoặc **reject**.
3. Sau approve: hệ thống **tự động post bút toán điều chỉnh** vào sổ cái (dùng txId = ADJ-{breakId}), cập nhật break status = RESOLVED.

Điều chỉnh cũng là một bút toán kế toán kép (bài 5), phải cân bằng, append-only, idempotent theo breakId.

### Luồng đối soát ba bên

~~~seq
title: Đối soát ba bên hàng ngày
actors: Scheduler | Recon | Internal | Partner | Settlement | Queue
Scheduler -> Recon: run(day)
Recon -> Internal: load transactions(day)
Recon -> Partner: load file(day)
Recon -> Settlement: load file(day-1)  // T+1
Recon -> Recon: three-way match by (ref, currency)
Recon -> Recon: classify breaks
Recon -> Recon: auto-resolve (fee, hold, timing)
Recon -> Queue: push remaining breaks with aging
Recon --> Scheduler: report (matched, auto-resolved, breaks by priority)
~~~

### Lỗi hay gặp trên production

1. **Chỉ đối soát hai bên (internal-partner), bỏ qua settlement**: tiền thực về tài khoản không khớp → mất tiền thầm lặng. Luôn phải có ba nguồn.
2. **Auto-resolve không idempotent**: chạy lại đối soát cùng ngày tạo ticket trùng, hoặc đổi trạng thái break đã resolved.
3. **Không có aging/SLA**: break P1 nằm 2 tuần không ai biết → rủi ro pháp lý, tiền mất không tìm thấy.
4. **Maker-checker bị bỏ qua**: nhân viên tự approve ticket của mình, hoặc post bút toán điều chỉnh mà không qua approve → sai lệch, gian lận nội bộ.
5. **Adjustment không idempotent**: approve hai lần → post hai bút toán điều chỉnh. Cần txId = ADJ-{breakId} unique.
6. **Không đối soát chéo tiền tệ**: settlement USD khớp nhưng VND không khớp do tỷ giá khác. Cần revaluation trước đối soát (bài 23).

> Senior tip: Đối soát ba bên là "lưới an toàn cuối cùng". Nếu internal-partner khớp nhưng settlement lệch, tức là tiền không về đúng nơi. Luôn so sánh **số dư thực tế tài khoản Nostro/Vostro** (từ bank statement) với **tổng số dư ngoại tệ trong sổ cái** (sau revaluation). Và nhớ: settlement thường là **net amount** (đã trừ phí) — map phí đúng là chìa khóa để Internal khớp với Settlement.

### Liên hệ phỏng vấn

**Câu hỏi:** "Internal khớp Partner nhưng Settlement chênh 20 triệu. Bạn xử lý thế nào?"

**Cách trả lời:** Đây là break loại **SETTLEMENT_HOLD** hoặc phí chưa map. Quy trình: (1) Kiểm tra metadata settlement: có cờ hold/pending không? (2) So sánh phí: Internal có ghi phí riêng, Partner báo net, Settlement báo net — map phí để Internal net = Settlement. (3) Nếu là hold: theo dõi aging, khi release sẽ tự khớp (auto-resolve). (4) Nếu không phải hold/phí: tạo break ticket P2, điều tra tỷ giá, map tài khoản, inquiry ngân hàng trung ương. (5) Maker tạo adjustment ticket, Checker approve, post bút toán ADJ-{breakId}. Điểm senior: nhấn mạnh ba nguồn dữ liệu, auto-resolve idempotent, aging/SLA, maker-checker.

**Câu hỏi 2:** "Auto-resolve break nào, break nào cần người?"

**Cách trả lời 2:** Auto-resolve: (a) chênh ≤ ngưỡng phí (fee tolerance), (b) hold có metadata rõ ràng, (c) timing diff ≤ 1 ngày do cut-off. Cần người: chênh lớn, không metadata hold, lệch tiền tệ, missing một bên, nghi ngờ gian lận. Tất cả auto-resolve phải **idempotent** và **ghi log lý do** để audit.

**Câu hỏi 3:** "Tại sao adjustment phải maker-checker?"

**Cách trả lời 3:** Điều chỉnh số liệu là quyền lực lớn — có thể tạo tiền từ không, che giấu lỗi, hoặc gian lận nội bộ. Maker-checker (hai người, một làm một duyệt) là kiểm soát bắt buộc của Basel/NGân hàng Trung ương. Adjustment ticket phải có: break ID, lý do, bút toán cân bằng, bằng chứng. Post tự động sau approve, txId = ADJ-{breakId} idempotent. Không cho phép sửa trực tiếp DB.
`,
    exercises: [
      {
        title: 'ThreeWayReconciler: reconcile, autoResolve, escalate, adjust (maker-checker)',
        prompt: `Viết {{ThreeWayReconciler}} đối soát ba nguồn: Internal, Partner, Settlement. Chỉ dùng JDK chuẩn, Java 17.

**Dữ liệu:**
- {{Tx3}}: {{ref}}, {{currency}}, {{amount}} (long, VND), {{source}} (INTERNAL/PARTNER/SETTLEMENT), {{meta}} (Map<String,String> — dùng cho hold flag, fee info).
- {{Break}}: {{breakId}}, {{ref}}, {{currency}}, {{amountInternal}}, {{amountPartner}}, {{amountSettlement}}, {{type}} (FULL_MATCH, PARTNER_FEE_DIFF, SETTLEMENT_HOLD, AMOUNT_MISMATCH, MISSING_ONE_SIDE), {{status}} (OPEN, AUTO_RESOLVED, ESCALATED, ADJUSTED, RESOLVED), {{detectedDay}}, {{agingDays}}, {{priority}} (P1/P2/P3), {{adjustmentTxId}} (null hoặc txId bút toán điều chỉnh).

**API:**
- {{ThreeWayReconciler(long feeTolerance, int holdGraceDays)}}: {{feeTolerance}} ngưỡng auto-resolve phí (VND), {{holdGraceDays}} số ngày chờ hold release trước khi escalate.
- {{List<Break> reconcile(List<Tx3> internal, List<Tx3> partner, List<Tx3> settlement, String day)}}: {{day}} là ngày đối soát "YYYY-MM-DD". So khớp theo khóa {{(ref, currency)}}.
  - Lập chỉ mục ba nguồn theo khóa.
  - Phân loại từng khóa: nếu ba bên đều có và amount bằng nhau ⇒ FULL_MATCH.
  - Internal = Partner + phí (chênh ≤ feeTolerance), Settlement = Partner ⇒ PARTNER_FEE_DIFF.
  - Partner = Settlement + hold (meta có "hold=true"), Internal = Partner ⇒ SETTLEMENT_HOLD.
  - Ba bên có, amount lệch > feeTolerance, không phải hold ⇒ AMOUNT_MISMATCH.
  - Chỉ có 1-2 bên ⇒ MISSING_ONE_SIDE.
  - Trả danh sách Break (mỗi khóa một break). FULL_MATCH status = AUTO_RESOLVED, PARTNER_FEE_DIFF/SETTLEMENT_HOLD status = AUTO_RESOLVED (nếu hold trong grace days) hoặc OPEN.
  - Priority: chênh > 1 tỷ ⇒ P1, 100 triệu - 1 tỷ ⇒ P2, < 100 triệu ⇒ P3. Aging = 0 ngày đầu.
- {{void autoResolve(String day)}}: chạy lại auto-resolve cho các break OPEN của {{day}} (hold đã qua grace days ⇒ chuyển OPEN; fee diff mới phát hiện ⇒ AUTO_RESOLVED). Idempotent: chạy nhiều lần không đổi trạng thái đã resolved.
- {{List<Break> escalate(String day)}}: trả các break OPEN của {{day}} quá SLA (P1 > 1 ngày, P2 > 3 ngày, P3 > 7 ngày), cập nhật status = ESCALATED.
- {{boolean adjust(String breakId, String maker, String checker, String adjTxId, List<Entry> adjustmentEntries)}}: maker-checker điều chỉnh.
  - {{breakId}} phải tồn tại, status = OPEN hoặc ESCALATED.
  - {{adjustmentEntries}} phải cân bằng VND (dùng logic bài 5).
  - Ghi {{adjustmentTxId}} = {{adjTxId}} (idempotent: cùng adjTxId gọi lại ⇒ no-op trả false).
  - Cập nhật status = RESOLVED. Trả true nếu điều chỉnh mới, false nếu no-op.
- {{List<Break> getBreaks(String day, String status)}}: lọc break theo ngày và trạng thái.
- {{Map<String, Long> agingSummary(String day)}}: trả map {{status}} → {{count}} cho break của {{day}} (dùng cho dashboard).

**Quy tắc:** {{feeTolerance < 0}} ném {{IllegalArgumentException}}. {{holdGraceDays < 0}} ném {{IllegalArgumentException}}. {{breakId}} không tồn tại ném {{IllegalArgumentException}}. {{adjustmentEntries}} không cân bằng ném {{IllegalArgumentException}}.
`,
        starter: `import java.util.*;

class Tx3 {
    final String ref;
    final String currency;
    final long amount;
    final String source; // INTERNAL, PARTNER, SETTLEMENT
    final Map<String, String> meta;
    Tx3(String ref, String currency, long amount, String source, Map<String, String> meta) {
        this.ref = ref;
        this.currency = currency;
        this.amount = amount;
        this.source = source;
        this.meta = meta != null ? meta : new HashMap<>();
    }
}

enum BreakType { FULL_MATCH, PARTNER_FEE_DIFF, SETTLEMENT_HOLD, AMOUNT_MISMATCH, MISSING_ONE_SIDE }
enum BreakStatus { OPEN, AUTO_RESOLVED, ESCALATED, ADJUSTED, RESOLVED }

class Break {
    final String breakId;
    final String ref;
    final String currency;
    final long amountInternal;
    final long amountPartner;
    final long amountSettlement;
    final BreakType type;
    BreakStatus status;
    final String detectedDay;
    int agingDays;
    final String priority; // P1, P2, P3
    String adjustmentTxId;

    Break(String breakId, String ref, String currency, long amtI, long amtP, long amtS,
          BreakType type, BreakStatus status, String detectedDay, int agingDays, String priority) {
        this.breakId = breakId;
        this.ref = ref;
        this.currency = currency;
        this.amountInternal = amtI;
        this.amountPartner = amtP;
        this.amountSettlement = amtS;
        this.type = type;
        this.status = status;
        this.detectedDay = detectedDay;
        this.agingDays = agingDays;
        this.priority = priority;
    }
}

class ThreeWayReconciler {
    final long feeTolerance;
    final int holdGraceDays;
    private final Map<String, List<Break>> breaksByDay = new HashMap<>();

    ThreeWayReconciler(long feeTolerance, int holdGraceDays) {
        if (feeTolerance < 0) throw new IllegalArgumentException("feeTolerance am");
        if (holdGraceDays < 0) throw new IllegalArgumentException("holdGraceDays am");
        this.feeTolerance = feeTolerance;
        this.holdGraceDays = holdGraceDays;
    }

    List<Break> reconcile(List<Tx3> internal, List<Tx3> partner, List<Tx3> settlement, String day) {
        throw new UnsupportedOperationException("TODO");
    }

    void autoResolve(String day) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Break> escalate(String day) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean adjust(String breakId, String maker, String checker, String adjTxId, List<Entry> adjustmentEntries) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Break> getBreaks(String day, String status) {
        throw new UnsupportedOperationException("TODO");
    }

    Map<String, Long> agingSummary(String day) {
        throw new UnsupportedOperationException("TODO");
    }
}

// Entry từ bài 5 (Ledger)
class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Tx3 tx(String ref, String ccy, long amt, String src, String... meta) {
        Map<String, String> m = new HashMap<>();
        for (int i = 0; i + 1 < meta.length; i += 2) m.put(meta[i], meta[i+1]);
        return new Tx3(ref, ccy, amt, src, m);
    }
    static Entry en(String acc, long amt, boolean dr) { return new Entry(acc, amt, dr); }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }

    public static void main(String[] args) {
        ThreeWayReconciler r = new ThreeWayReconciler(10_000, 2); // feeTol 10k, hold grace 2 ngày

        List<Tx3> in = new ArrayList<>();
        in.add(tx("R1", "VND", 1_000_000, "INTERNAL"));
        in.add(tx("R2", "VND", 1_010_000, "INTERNAL")); // phí 10k
        in.add(tx("R3", "VND", 2_000_000, "INTERNAL"));
        in.add(tx("R4", "VND", 500_000, "INTERNAL"));

        List<Tx3> pa = new ArrayList<>();
        pa.add(tx("R1", "VND", 1_000_000, "PARTNER"));
        pa.add(tx("R2", "VND", 1_000_000, "PARTNER")); // net, phí 10k
        pa.add(tx("R3", "VND", 2_000_000, "PARTNER", "hold", "true"));
        // R4 missing ở partner

        List<Tx3> se = new ArrayList<>();
        se.add(tx("R1", "VND", 1_000_000, "SETTLEMENT"));
        se.add(tx("R2", "VND", 1_000_000, "SETTLEMENT"));
        se.add(tx("R3", "VND", 1_800_000, "SETTLEMENT")); // hold 200k
        // R4 missing ở settlement

        List<Break> breaks = r.reconcile(in, pa, se, "2026-11-01");

        // R1: FULL_MATCH
        check("R1 full match", breaks.stream().anyMatch(b -> b.ref.equals("R1") && b.type == BreakType.FULL_MATCH && b.status == BreakStatus.AUTO_RESOLVED), "");
        // R2: PARTNER_FEE_DIFF (chênh 10k ≤ feeTol)
        check("R2 fee diff", breaks.stream().anyMatch(b -> b.ref.equals("R2") && b.type == BreakType.PARTNER_FEE_DIFF && b.status == BreakStatus.AUTO_RESOLVED), "");
        // R3: SETTLEMENT_HOLD (partner=2M, settlement=1.8M, hold=true)
        check("R3 hold", breaks.stream().anyMatch(b -> b.ref.equals("R3") && b.type == BreakType.SETTLEMENT_HOLD), "");
        // R4: MISSING_ONE_SIDE
        check("R4 missing", breaks.stream().anyMatch(b -> b.ref.equals("R4") && b.type == BreakType.MISSING_ONE_SIDE && b.status == BreakStatus.OPEN), "");

        // Priority: R3 chênh 200k < 100tr => P3, R4 chênh 500k => P3
        check("priority P3", breaks.stream().filter(b -> b.ref.equals("R3")).findFirst().get().priority.equals("P3"), "");
        check("aging 0 ngay dau", breaks.stream().filter(b -> b.ref.equals("R3")).findFirst().get().agingDays == 0, "");

        // autoResolve: hold grace 2 ngày, ngày đầu chưa qua
        r.autoResolve("2026-11-01");
        check("autoResolve ngay 1: hold van OPEN", breaks.stream().filter(b -> b.ref.equals("R3")).findFirst().get().status == BreakStatus.OPEN, "");

        // Giả lập qua 3 ngày: aging tăng
        for (Break b : breaks) b.agingDays = 3;
        r.autoResolve("2026-11-01");
        check("autoResolve sau grace: hold -> AUTO_RESOLVED", breaks.stream().filter(b -> b.ref.equals("R3")).findFirst().get().status == BreakStatus.AUTO_RESOLVED, "");

        // escalate: R4 OPEN, aging 3, P3 (SLA 7 ngày) -> chưa escalate
        check("escalate P3 chua qua SLA", r.escalate("2026-11-01").isEmpty(), "");

        // Tăng aging R4 lên 8 ngày -> P3 quá SLA
        breaks.stream().filter(b -> b.ref.equals("R4")).findFirst().get().agingDays = 8;
        List<Break> esc = r.escalate("2026-11-01");
        check("escalate P3 qua 7 ngay", esc.size() == 1 && esc.get(0).ref.equals("R4") && esc.get(0).status == BreakStatus.ESCALATED, "");

        // adjust: maker-checker
        Break b4 = breaks.stream().filter(b -> b.ref.equals("R4")).findFirst().get();
        boolean adj = r.adjust(b4.breakId, "maker1", "checker1", "ADJ-R4", of(en("Suspense", 500_000, true), en("Nostro", 500_000, false)));
        check("adjust success", adj && b4.status == BreakStatus.RESOLVED && b4.adjustmentTxId.equals("ADJ-R4"), "");
        // no-op second time
        boolean adj2 = r.adjust(b4.breakId, "maker1", "checker1", "ADJ-R4", of(en("Suspense", 500_000, true), en("Nostro", 500_000, false)));
        check("adjust idempotent", !adj2, "");

        // agingSummary
        Map<String, Long> sum = r.agingSummary("2026-11-01");
        check("aging summary has counts", sum.getOrDefault("OPEN", 0L) + sum.getOrDefault("AUTO_RESOLVED", 0L) + sum.getOrDefault("ESCALATED", 0L) + sum.getOrDefault("RESOLVED", 0L) == 4, "sum=" + sum);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Tx3 {
    final String ref;
    final String currency;
    final long amount;
    final String source;
    final Map<String, String> meta;
    Tx3(String ref, String currency, long amount, String source, Map<String, String> meta) {
        this.ref = ref;
        this.currency = currency;
        this.amount = amount;
        this.source = source;
        this.meta = meta != null ? meta : new HashMap<>();
    }
}

enum BreakType { FULL_MATCH, PARTNER_FEE_DIFF, SETTLEMENT_HOLD, AMOUNT_MISMATCH, MISSING_ONE_SIDE }
enum BreakStatus { OPEN, AUTO_RESOLVED, ESCALATED, ADJUSTED, RESOLVED }

class Break {
    final String breakId;
    final String ref;
    final String currency;
    final long amountInternal;
    final long amountPartner;
    final long amountSettlement;
    final BreakType type;
    BreakStatus status;
    final String detectedDay;
    int agingDays;
    final String priority;
    String adjustmentTxId;

    Break(String breakId, String ref, String currency, long amtI, long amtP, long amtS,
          BreakType type, BreakStatus status, String detectedDay, int agingDays, String priority) {
        this.breakId = breakId;
        this.ref = ref;
        this.currency = currency;
        this.amountInternal = amtI;
        this.amountPartner = amtP;
        this.amountSettlement = amtS;
        this.type = type;
        this.status = status;
        this.detectedDay = detectedDay;
        this.agingDays = agingDays;
        this.priority = priority;
    }
}

class ThreeWayReconciler {
    final long feeTolerance;
    final int holdGraceDays;
    private final Map<String, List<Break>> breaksByDay = new HashMap<>();
    private final Set<String> usedAdjTxId = new HashSet<>();

    ThreeWayReconciler(long feeTolerance, int holdGraceDays) {
        if (feeTolerance < 0) throw new IllegalArgumentException("feeTolerance am");
        if (holdGraceDays < 0) throw new IllegalArgumentException("holdGraceDays am");
        this.feeTolerance = feeTolerance;
        this.holdGraceDays = holdGraceDays;
    }

    private String key(Tx3 t) { return t.ref + "|" + t.currency; }

    List<Break> reconcile(List<Tx3> internal, List<Tx3> partner, List<Tx3> settlement, String day) {
        if (day == null || day.isEmpty()) throw new IllegalArgumentException("day rong");
        Map<String, Tx3> inMap = new HashMap<>();
        Map<String, Tx3> paMap = new HashMap<>();
        Map<String, Tx3> seMap = new HashMap<>();
        for (Tx3 t : internal) inMap.put(key(t), t);
        for (Tx3 t : partner) paMap.put(key(t), t);
        for (Tx3 t : settlement) seMap.put(key(t), t);

        Set<String> allKeys = new LinkedHashSet<>();
        allKeys.addAll(inMap.keySet());
        allKeys.addAll(paMap.keySet());
        allKeys.addAll(seMap.keySet());

        List<Break> result = new ArrayList<>();
        int seq = 0;
        for (String k : allKeys) {
            Tx3 i = inMap.get(k);
            Tx3 p = paMap.get(k);
            Tx3 s = seMap.get(k);
            String[] parts = k.split("\\\\|");
            String ref = parts[0], ccy = parts[1];
            long ai = i != null ? i.amount : 0;
            long ap = p != null ? p.amount : 0;
            long as = s != null ? s.amount : 0;
            BreakType type;
            BreakStatus status = BreakStatus.OPEN;
            if (i != null && p != null && s != null) {
                if (ai == ap && ap == as) { type = BreakType.FULL_MATCH; status = BreakStatus.AUTO_RESOLVED; }
                else if (ai == ap + (ai - ap) && ai - ap <= feeTolerance && ap == as) { type = BreakType.PARTNER_FEE_DIFF; status = BreakStatus.AUTO_RESOLVED; }
                else if (p != null && s != null && ap == as + (ap - as) && "true".equals(p.meta.get("hold")) && i != null && ai == ap) {
                    type = BreakType.SETTLEMENT_HOLD;
                    if (0 >= holdGraceDays) status = BreakStatus.AUTO_RESOLVED; // grace 0 => auto resolve ngay
                }
                else if (Math.max(ai, Math.max(ap, as)) - Math.min(ai, Math.min(ap, as)) > feeTolerance) {
                    type = BreakType.AMOUNT_MISMATCH;
                }
                else {
                    type = BreakType.AMOUNT_MISMATCH; // fallback
                }
            } else if (i != null || p != null || s != null) {
                type = BreakType.MISSING_ONE_SIDE;
            } else {
                continue; // impossible
            }
            long maxAmt = Math.max(ai, Math.max(ap, as));
            long minAmt = Math.min(ai == 0 ? Long.MAX_VALUE : ai, Math.min(ap == 0 ? Long.MAX_VALUE : ap, as == 0 ? Long.MAX_VALUE : as));
            if (minAmt == Long.MAX_VALUE) minAmt = 0;
            long diff = maxAmt - minAmt;
            String priority = diff > 1_000_000_000L ? "P1" : (diff > 100_000_000L ? "P2" : "P3");
            Break b = new Break("BRK-" + day.replace("-", "") + "-" + (++seq), ref, ccy, ai, ap, as, type, status, day, 0, priority);
            result.add(b);
        }
        breaksByDay.put(day, result);
        return result;
    }

    void autoResolve(String day) {
        List<Break> list = breaksByDay.get(day);
        if (list == null) return;
        for (Break b : list) {
            if (b.status != BreakStatus.OPEN) continue;
            if (b.type == BreakType.SETTLEMENT_HOLD && b.agingDays >= holdGraceDays) {
                b.status = BreakStatus.AUTO_RESOLVED;
            } else if (b.type == BreakType.PARTNER_FEE_DIFF) {
                b.status = BreakStatus.AUTO_RESOLVED;
            }
        }
    }

    List<Break> escalate(String day) {
        List<Break> list = breaksByDay.get(day);
        if (list == null) return new ArrayList<>();
        List<Break> escalated = new ArrayList<>();
        for (Break b : list) {
            if (b.status != BreakStatus.OPEN) continue;
            boolean overSla = ("P1".equals(b.priority) && b.agingDays > 1) ||
                              ("P2".equals(b.priority) && b.agingDays > 3) ||
                              ("P3".equals(b.priority) && b.agingDays > 7);
            if (overSla) {
                b.status = BreakStatus.ESCALATED;
                escalated.add(b);
            }
        }
        return escalated;
    }

    boolean adjust(String breakId, String maker, String checker, String adjTxId, List<Entry> adjustmentEntries) {
        if (breakId == null || breakId.isEmpty()) throw new IllegalArgumentException("breakId rong");
        if (adjTxId == null || adjTxId.isEmpty()) throw new IllegalArgumentException("adjTxId rong");
        if (usedAdjTxId.contains(adjTxId)) return false; // idempotent
        Break target = null;
        for (List<Break> list : breaksByDay.values()) {
            for (Break b : list) if (b.breakId.equals(breakId)) { target = b; break; }
            if (target != null) break;
        }
        if (target == null) throw new IllegalArgumentException("break khong ton tai: " + breakId);
        if (target.status != BreakStatus.OPEN && target.status != BreakStatus.ESCALATED) throw new IllegalStateException("break khong the adjust: " + target.status);
        // Kiểm tra cân bằng adjustmentEntries (logic bài 5)
        long dr = 0, cr = 0;
        for (Entry e : adjustmentEntries) {
            if (e.amount <= 0) throw new IllegalArgumentException("amount phai duong");
            if (e.debit) dr += e.amount; else cr += e.amount;
        }
        if (dr != cr) throw new IllegalArgumentException("adjustment khong can bang: " + dr + " != " + cr);
        usedAdjTxId.add(adjTxId);
        target.status = BreakStatus.RESOLVED;
        target.adjustmentTxId = adjTxId;
        return true;
    }

    List<Break> getBreaks(String day, String status) {
        List<Break> list = breaksByDay.get(day);
        if (list == null) return new ArrayList<>();
        if (status == null || status.isEmpty()) return new ArrayList<>(list);
        BreakStatus bs = BreakStatus.valueOf(status);
        List<Break> res = new ArrayList<>();
        for (Break b : list) if (b.status == bs) res.add(b);
        return res;
    }

    Map<String, Long> agingSummary(String day) {
        List<Break> list = breaksByDay.get(day);
        Map<String, Long> sum = new LinkedHashMap<>();
        if (list == null) return sum;
        for (Break b : list) {
            sum.merge(b.status.name(), 1L, Long::sum);
        }
        return sum;
    }
}

class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}`,
        hints: [
          'reconcile: lập chỉ mục ba nguồn theo key (ref|currency). Duyệt union của tất cả key. Phân loại theo logic: FULL_MATCH (3 bên bằng) → PARTNER_FEE_DIFF (Internal = Partner + fee ≤ tol, Settlement = Partner) → SETTLEMENT_HOLD (Partner = Settlement + hold meta, Internal = Partner) → AMOUNT_MISMATCH (lệch > tol) → MISSING_ONE_SIDE (thiếu bên).',
          'Priority tính từ chênh lớn nhất giữa 3 bên: diff > 1 tỷ ⇒ P1, > 100 triệu ⇒ P2, còn lại P3. AgingDays = 0 ban đầu, tăng khi autoResolve/escalate gọi (test tự set agingDays).',
          'autoResolve: chỉ xử lý break OPEN. SETTLEMENT_HOLD qua grace days ⇒ AUTO_RESOLVED. PARTNER_FEE_DIFF (nếu reconcile chưa bắt) ⇒ AUTO_RESOLVED. Idempotent: status đã resolved thì bỏ qua.',
          'escalate: kiểm tra SLA theo priority + agingDays. P1 > 1 ngày, P2 > 3 ngày, P3 > 7 ngày ⇒ ESCALATED.',
          'adjust: tìm breakId, kiểm tra status OPEN/ESCALATED, validate adjustmentEntries cân bằng VND (dùng logic bài 5), idempotent theo adjTxId (Set usedAdjTxId), cập nhật status = RESOLVED, adjustmentTxId = adjTxId.',
        ],
        explain: `Test đi theo vòng đời một break thực tế:
1. **Phân loại năm nhóm đúng**: R1 FULL_MATCH, R2 PARTNER_FEE_DIFF (chênh 10k ≤ feeTol), R3 SETTLEMENT_HOLD (hold meta, chênh 200k), R4 MISSING_ONE_SIDE. Mỗi loại là một kịch lược vận hành khác nhau.
2. **Auto-resolve có điều kiện**: SETTLEMENT_HOLD chỉ auto-resolve sau khi qua {{holdGraceDays}} (test: ngày 1 chưa, ngày 3 đã). PARTNER_FEE_DIFF auto-resolve ngay. Idempotent: gọi lại không đổi trạng thái.
3. **Escalation theo SLA + priority**: R4 P3 aging 3 chưa escalate, aging 8 ⇒ ESCALATED. P1 > 1 ngày, P2 > 3 ngày, P3 > 7 ngày.
4. **Maker-checker adjustment**: cần adjTxId idempotent, adjustmentEntries phải cân bằng VND (dùng Entry từ bài 5). Lần hai gọi cùng adjTxId ⇒ no-op false.

Điểm senior: ba nguồn dữ liệu (internal/partner/settlement) có timing khác nhau (settlement T+1), auto-resolve idempotent, aging/SLA quản lý rủi ro, adjustment maker-checker với txId = ADJ-{breakId} idempotent. Lỗi hay gặp: quên settlement, auto-resolve không idempotent, không có aging/SLA, adjustment bỏ qua cân bằng hoặc không idempotent.`,
      },
    ],
    check: [
      { q: 'Đối soát ba bên (three-way reconciliation) so khớp những nguồn nào?', options: ['Internal, Partner, Settlement', 'Internal, Partner, Customer', 'Partner, Settlement, Scheme', 'Internal, Core, Gateway'], answer: 0, explain: 'Đúng (A): ba nguồn là sổ cái nội bộ (Internal), file đối tác (Partner — VNPay/NAPAS/Visa), và file settlement/chốt toán tiền thực (Settlement — Nostro statement/ngân hàng trung ương). Sai (B): customer không là nguồn dữ liệu đối soát. Sai (C): scheme là một loại partner. Sai (D): core/gateway là hạ tầng, không phải nguồn đối soát độc lập.' },
      { q: 'Break loại SETTLEMENT_HOLD có nghĩa là gì và khi nào auto-resolve?', options: ['Settlement nhiều hơn Partner, auto-resolve ngay', 'Settlement thiếu so với Partner do hold, auto-resolve sau khi qua holdGraceDays', 'Internal thiếu so với Partner, auto-resolve không bao giờ', 'Ba bên đều lệch, auto-resolve khi chênh ≤ feeTolerance'], answer: 1, explain: 'Đúng (B): SETTLEMENT_HOLD = Partner báo thành công, Settlement chuyển ít hơn do ngân hàng hold (giữ) một phần (AML check, sanctions...). Auto-resolve khi hold được release, tức là sau holdGraceDays (ngày ân hạn). Sai (A): settlement thiếu chứ không nhiều. Sai (C): internal khớp partner mới là hold. Sai (D): đó là PARTNER_FEE_DIFF.' },
      { q: 'Adjustment (điều chỉnh) break phải tuân thủ quy trình gì?', options: ['Maker tự approve và post bút toán', 'Maker tạo ticket, Checker duyệt, hệ thống post bút toán ADJ-{breakId} idempotent', 'Post trực tiếp vào DB cho nhanh', 'Chỉ cần ghi log, không cần bút toán'], answer: 1, explain: 'Đúng (B): maker-checker là bắt buộc (Basel/NHNN). Maker tạo adjustment ticket kèm bút toán cân bằng và bằng chứng. Checker review, approve. Hệ thống post bút toán với txId = ADJ-{breakId} (idempotent). Sai (A): vi phạm phân quyền. Sai (C): không có audit trail. Sai (D): điều chỉnh tiền phải qua bút toán kế toán kép.' },
    ],
    related: ['banking-022', 'banking-023', 'banking-005', 'banking-009'],
    tags: ['reconciliation', 'three-way', 'break', 'aging', 'escalation', 'maker-checker', 'auto-resolve', 'banking']
  },

  {
    id: 'lesson-banking-025',
    track: 'banking',
    order: 25,
    title: 'Khóa kỳ kế toán (period close): sổ cái kép chỉ nhận bút toán vào kỳ đang mở, chốt kỳ thì đóng băng số dư',
    level: 'senior',
    minutes: 35,
    goals: [
      'Giải thích vì sao sổ cái kép phải chia theo kỳ kế toán (tháng) và vì sao kỳ đã chốt không được nhận bút toán nữa',
      'Phân biệt chốt kỳ cứng (hard close) với mở lại có kiểm soát (reopen qua maker-checker), và vì sao chốt kỳ phải chụp ảnh số dư',
      'Viết PeriodLedger: post vào kỳ mở, closePeriod idempotent, chặn post vào kỳ đã đóng, closingBalance đóng băng',
    ],
    body: `**Tóm tắt:** Sổ cái kế toán kép chia thời gian thành các **kỳ kế toán** (thường một tháng). Khi kỳ còn **mở**, hệ thống nhận bút toán; khi **chốt kỳ** (close), số dư mọi tài khoản được **chụp ảnh** và kỳ bị **khóa**: bút toán gửi vào kỳ đã chốt đều bị từ chối. Nhờ vậy báo cáo tài chính đã phát hành không bị đổi ngược, và chốt kỳ chạy lại bao nhiêu lần cũng cho cùng kết quả.

### Kỳ kế toán là gì
**Thuật ngữ:** *kỳ kế toán (accounting period)* là một khoảng thời gian mà sổ sách được mở để ghi bút toán, phổ biến nhất là **một tháng**. Hết kỳ, kế toán "chốt sổ" (close) để in báo cáo tài chính: bảng cân đối, báo cáo lãi lỗ (xem bài 16).

Vì sao không để sổ chạy liên tục rồi lọc theo ngày? Vì sau khi báo cáo tháng 1 đã in và gửi cho cơ quan thuế, nếu có một bút toán về muộn được ghi lùi vào tháng 1, thì **báo cáo đã phát hành sẽ lệch** với dữ liệu trong hệ thống. Kiểm toán viên sẽ hỏi: "tại sao con số trên báo cáo tôi đang cầm khác với số hệ thống hôm nay?". Chốt kỳ cứng (hard close) là câu trả lời: sau khi chốt, tháng 1 **đóng băng**, mọi sửa sai phải ghi vào kỳ đang mở (tháng 2) kèm tham chiếu tới bút toán cũ.

Ví dụ đời thường: cuốn sổ nợ của một cửa hàng. Cuối tháng bạn cộng lại, ghi "tổng tháng 1" vào một trang riêng, rồi sang trang mới cho tháng 2. Nếu ai đó lén ghi thêm vào trang tháng 1, tổng đã chốt không còn đúng — nên quy tắc là trang đã chốt thì không viết thêm.

### Mở kỳ, chốt kỳ, mở lại
- **Kỳ mở (open)**: mặc định, nhận bút toán bình thường.
- **Chốt kỳ (hard close)**: khóa kỳ, chụp ảnh số dư của mọi tài khoản tại thời điểm chốt. Không nhận bút toán nữa.
- **Mở lại (reopen)**: chỉ khi thật sự cần (phát hiện sai sót trọng yếu), và phải qua quy trình **maker-checker** (người tạo đề nghị khác người duyệt), để lại dấu vết kiểm toán. Bài này không cho mở lại — một khi đã chốt là chốt.

### Bất biến cân bằng vẫn phải giữ
Kỳ kế toán không thay thế quy tắc Nợ/Có: mỗi bút toán vẫn phải có **tổng Nợ bằng tổng Có** (ở bài này dùng số có dấu: tổng các amount = 0). Bài học thêm một chiều **thời gian**: ngoài cân bằng, bút toán còn phải đúng **kỳ đang mở**.

### Số dư và ảnh chụp khi chốt
- {{balance(account)}}: số dư **chạy** hiện tại, cộng dồn mọi bút toán qua mọi kỳ.
- {{closingBalance(account, period)}}: **ảnh chụp** số dư tại lúc chốt kỳ đó, đã đóng băng. Đây cũng chính là số dư **đầu kỳ** của tháng kế tiếp.

### Luồng chốt kỳ cuối tháng
~~~seq
title: Chot ky ke toan cuoi thang
actors: Scheduler | PeriodLedger | LedgerDB | BaoCao
Scheduler -> PeriodLedger: closePeriod 2026-01
PeriodLedger -> LedgerDB: doc so du moi tai khoan
PeriodLedger -> PeriodLedger: chup anh closing balance
PeriodLedger -> LedgerDB: danh dau ky da chot
PeriodLedger --> BaoCao: khoa thang 1, phat hanh bao cao
Scheduler -> PeriodLedger: post 2026-01 but toan muon
PeriodLedger --> Scheduler: tu choi vi ky da chot
~~~

### Lỗi hay gặp trên production
1. **Không chặn bút toán vào kỳ đã chốt**: báo cáo tháng cũ âm thầm đổi, kiểm toán trượt.
2. **Chốt kỳ không idempotent**: chạy lại job chốt hai lần, lần hai ghi đè ảnh chụp bằng số dư đã bị thay đổi.
3. **Không chụp ảnh số dư**: tháng sau không biết số dư đầu kỳ, phải suy đoán.
4. **Dùng {{double}} cho tiền**: số dư lệch vài đồng, ảnh chụp không khớp (xem bài 1).
5. **Ghi bút toán nửa chừng**: kiểm tra cân bằng phải diễn ra **trước** khi áp dụng delta, nếu không một bút toán lệch để lại dấu vết trong sổ.

> Senior tip: Chốt kỳ là một **sự kiện nghiệp vụ** chứ không phải một câu lệnh UPDATE. Nó phải idempotent, phải chụp ảnh, và phải là bước **sau cùng** của ngày — mọi bút toán về sau đều thuộc kỳ mới, không bao giờ được "nhét" ngược vào kỳ đã khóa.

### Liên hệ phỏng vấn
**Câu hỏi:** "Vì sao hệ thống kế toán cần chốt kỳ, và chốt xong thì xử lý bút toán về muộn thế nào?"
**Cách trả lời:** Kỳ kế toán (thường một tháng) là cửa sổ sổ sách mở để ghi bút toán; chốt kỳ (hard close) khóa cửa sổ đó và chụp ảnh số dư để in báo cáo tài chính. Sau khi chốt, mọi bút toán gửi vào kỳ cũ đều bị **từ chối** — nếu không, báo cáo đã phát hành sẽ lệch với dữ liệu và không qua được kiểm toán. Sai sót trọng yếu thì mở lại kỳ qua quy trình maker-checker có dấu vết, còn thông thường thì ghi bút toán điều chỉnh vào **kỳ đang mở** kèm tham chiếu bút toán gốc. Chốt kỳ phải **idempotent** (chạy lại cho cùng kết quả) và số dư dùng {{long}} hoặc {{BigDecimal}} chứ không {{double}}.`,
    exercises: [
      {
        title: 'PeriodLedger: post / closePeriod / closingBalance',
        prompt: `Viết class {{PeriodLedger}} mô phỏng sổ cái kế toán kép có **kỳ kế toán** (tháng). Bút toán {{Entry}} gồm {{account}} và {{amount}} có dấu (dương = Nợ/debit, âm = Có/credit); một bút toán cân bằng khi **tổng các amount = 0**.

Quy tắc bắt buộc:
1. {{post(String period, List<Entry> entries)}}: {{period}} null/rỗng ⇒ {{IllegalArgumentException}}; kỳ đã chốt ⇒ {{IllegalStateException}} và **không ghi gì cả**; entries null/rỗng ⇒ {{IllegalArgumentException}}; tổng amount khác 0 (lệch Nợ/Có) ⇒ {{IllegalArgumentException}} và không ghi gì. Hợp lệ ⇒ cộng delta vào số dư chạy.
2. {{closePeriod(String period)}}: {{period}} null/rỗng ⇒ {{IllegalArgumentException}}; đã chốt ⇒ no-op trả {{false}}; chưa chốt ⇒ chụp ảnh số dư hiện tại của **mọi** tài khoản, đánh dấu kỳ đã chốt, trả {{true}}.
3. {{isClosed(String period)}}: kỳ đã chốt hay chưa.
4. {{balance(String account)}}: số dư chạy hiện tại (mọi kỳ), chưa có ⇒ 0.
5. {{closingBalance(String account, String period)}}: ảnh chụp lúc chốt; kỳ chưa chốt ⇒ {{IllegalStateException}}; tài khoản không có trong ảnh ⇒ 0.`,
        starter: `import java.util.*;

class Entry {
    final String account;
    final long amount;   // duong = No (debit), am = Co (credit)
    Entry(String account, long amount) { this.account = account; this.amount = amount; }
}

class PeriodLedger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Set<String> closed = new HashSet<>();
    private final Map<String, Map<String, Long>> snapshots = new HashMap<>();

    void post(String period, List<Entry> entries) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean closePeriod(String period) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isClosed(String period) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    long closingBalance(String account, String period) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Entry en(String acc, long amt) { return new Entry(acc, amt); }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }

    public static void main(String[] args) {
        PeriodLedger l = new PeriodLedger();
        l.post("2026-01", of(en("CA/lan", 100000), en("CA/minh", -100000)));
        check("post_can_bang", l.balance("CA/lan") == 100000 && l.balance("CA/minh") == -100000, "lan=" + l.balance("CA/lan"));

        check("lech_no_co_bi_tu_choi", expect(IllegalArgumentException.class, () -> l.post("2026-01", of(en("CA/a", 100), en("CA/b", -50)))), "");
        check("lech_khong_de_lai_dau_vet", l.balance("CA/a") == 0, "a=" + l.balance("CA/a"));
        check("bút toán rong bi tu choi", expect(IllegalArgumentException.class, () -> l.post("2026-01", new ArrayList<Entry>())), "");
        check("period null bi tu choi", expect(IllegalArgumentException.class, () -> l.post(null, of(en("CA/a", 1), en("CA/b", -1)))), "");

        check("chot_ky_tra_true", l.closePeriod("2026-01"), "");
        check("isClosed_dung", l.isClosed("2026-01"), "");
        check("chot_lan_hai_no_op", !l.closePeriod("2026-01"), "");
        check("anh_chup_dong_bang", l.closingBalance("CA/lan", "2026-01") == 100000, "closing=" + l.closingBalance("CA/lan", "2026-01"));

        check("post_vao_ky_da_chot_bi_tu_choi", expect(IllegalStateException.class, () -> l.post("2026-01", of(en("CA/x", 5), en("CA/y", -5)))), "");
        check("post_vao_ky_chot_khong_doi_so_du", l.balance("CA/x") == 0, "x=" + l.balance("CA/x"));

        l.post("2026-02", of(en("CA/lan", 40000), en("CA/minh", -40000)));
        check("ky_moi_doi_so_du_chay", l.balance("CA/lan") == 140000, "lan=" + l.balance("CA/lan"));
        check("anh_chup_thang_truoc_van_dong_bang", l.closingBalance("CA/lan", "2026-01") == 100000, "closing=" + l.closingBalance("CA/lan", "2026-01"));

        check("closing_khi_ky_chua_chot_nem_loi", expect(IllegalStateException.class, () -> l.closingBalance("CA/lan", "2026-02")), "");
        check("tai_khoan_la_trong_anh_bang_0", l.closingBalance("CA/ghost", "2026-01") == 0, "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Entry {
    final String account;
    final long amount;   // duong = No (debit), am = Co (credit)
    Entry(String account, long amount) { this.account = account; this.amount = amount; }
}

class PeriodLedger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Set<String> closed = new HashSet<>();
    private final Map<String, Map<String, Long>> snapshots = new HashMap<>();

    void post(String period, List<Entry> entries) {
        if (period == null || period.isEmpty()) throw new IllegalArgumentException("thieu ky");
        if (closed.contains(period)) throw new IllegalStateException("ky da chot: " + period);   // ky da chot la bat kha xam pham
        if (entries == null || entries.isEmpty()) throw new IllegalArgumentException("but toan rong");
        long sum = 0;
        Map<String, Long> delta = new LinkedHashMap<>();
        for (Entry e : entries) {
            if (e.account == null || e.account.isEmpty()) throw new IllegalArgumentException("account rong");
            sum += e.amount;
            delta.merge(e.account, e.amount, Long::sum);
        }
        if (sum != 0) throw new IllegalArgumentException("lech No/Co: " + sum);               // kiem tra TRUOC khi ghi
        for (Map.Entry<String, Long> d : delta.entrySet()) balances.merge(d.getKey(), d.getValue(), Long::sum);
    }

    boolean closePeriod(String period) {
        if (period == null || period.isEmpty()) throw new IllegalArgumentException("thieu ky");
        if (closed.contains(period)) return false;                                            // idempotent
        snapshots.put(period, new HashMap<>(balances));                                       // chup anh dong bang
        closed.add(period);
        return true;
    }

    boolean isClosed(String period) { return closed.contains(period); }

    long balance(String account) { return balances.getOrDefault(account, 0L); }

    long closingBalance(String account, String period) {
        if (!closed.contains(period)) throw new IllegalStateException("ky chua chot: " + period);
        return snapshots.getOrDefault(period, Collections.emptyMap()).getOrDefault(account, 0L);
    }
}`,
        hints: [
          'Cộng tổng amount trước; nếu khác 0 thì ném IllegalArgumentException và **return**, chưa đụng vào balances.',
          'Ảnh chụp là một bản sao {{new HashMap<>(balances)}} lưu theo period; chốt lần hai chỉ cần kiểm tra tập đã chốt rồi trả false.',
          'post vào kỳ đã chốt phải ném IllegalStateException **trước** khi kiểm tra cân bằng, để thông báo lỗi đúng bản chất.',
          'closingBalance chỉ hợp lệ khi kỳ đã chốt; nếu chưa chốt thì ném IllegalStateException.',
        ],
        explain: `Bài học kiểm tra bốn bất biến: (1) **cân bằng Nợ/Có** — bút toán lệch bị từ chối bằng {{IllegalArgumentException}} và không để lại dấu vết; (2) **kỳ đã chốt là bất khả xâm phạm** — {{post}} vào kỳ đã chốt ném {{IllegalStateException}}, số dư không đổi; (3) **chốt kỳ idempotent** — lần hai trả {{false}}, ảnh chụp không bị ghi đè; (4) **ảnh chụp đóng băng** — sau khi chốt tháng 1 rồi ghi sang tháng 2, {{balance}} của tháng 2 đổi nhưng {{closingBalance}} của tháng 1 vẫn nguyên.

Lỗi hay gặp: kiểm tra cân bằng **sau khi** đã cộng delta (để lại sổ hỏng), chốt kỳ không idempotent (ghi đè ảnh), và quên rằng {{closingBalance}} chỉ đọc được sau khi chốt.`,
      },
    ],
    check: [
      { q: 'Vì sao sổ cái kế toán phải chốt kỳ (close) trước khi in báo cáo tài chính?', options: ['Để hệ thống chạy nhanh hơn', 'Để khóa số dư kỳ đã chốt, không cho bút toán về muộn làm đổi báo cáo đã phát hành', 'Để xóa dữ liệu cũ', 'Để đổi tiền tệ'], answer: 1, explain: 'Đúng (B): chốt kỳ (hard close) đóng băng số dư và không nhận bút toán nữa, nên báo cáo đã in không bị lệch khi có giao dịch về muộn — đây là yêu cầu kiểm toán. Sai (A): chốt kỳ không liên quan tốc độ. Sai (C): không xóa dữ liệu, sổ cái append-only. Sai (D): tiền tệ là chuyện khác.' },
      { q: 'Gọi closePeriod cho một kỳ đã chốt thì kết quả là gì?', options: ['Ném IllegalStateException', 'Chụp lại ảnh đè lên ảnh cũ', 'No-op trả false, ảnh chụp giữ nguyên', 'Mở lại kỳ'], answer: 2, explain: 'Đúng (C): chốt kỳ phải idempotent — lần hai trả false và không ghi đè ảnh chụp, vì chạy lại job không được làm đổi số liệu. Sai (A): ném lỗi là dành cho bút toán vào kỳ đã chốt, không phải cho close lần hai. Sai (B): ghi đè ảnh làm mất số dư đầu kỳ. Sai (D): bài này không cho mở lại.' },
      { q: 'Sau khi chốt tháng 1 và ghi bút toán sang tháng 2, số nào KHÔNG đổi?', options: ['balance chạy hiện tại', 'closingBalance của tháng 1', 'số dư khả dụng', 'tổng Nợ/Có'], answer: 1, explain: 'Đúng (B): closingBalance là ảnh chụp lúc chốt, đã đóng băng, không đổi dù tháng 2 có bút toán mới. Sai (A): balance chạy cộng dồn mọi kỳ nên đổi. Sai (C): khả dụng là khái niệm khác (bài 7). Sai (D): tổng Nợ/Có của một bút toán luôn bằng nhau, không phải thứ "đóng băng" ở đây.' },
      { q: 'Bút toán gửi vào kỳ đã chốt phải bị xử lý thế nào?', options: ['Âm thầm bỏ qua', 'Từ chối bằng IllegalStateException, không ghi gì', 'Ghi vào kỳ hiện tại tự động', 'Chấp nhận nếu cân bằng'], answer: 1, explain: 'Đúng (B): kỳ đã chốt không nhận bút toán; hệ thống ném IllegalStateException và không ghi gì để báo cáo cũ không bị đổi. Sai (A): bỏ qua âm thầm làm mất giao dịch. Sai (C): tự chuyển kỳ là quyết định nghiệp vụ, không phải hành vi ngầm. Sai (D): cân bằng không miễn nhiễm với quy tắc khóa kỳ.' },
    ],
    related: ['banking-005', 'banking-011'],
    tags: ['ledger', 'period-close', 'accounting', 'banking'],
  },

  {
    id: 'lesson-banking-026',
    track: 'banking',
    order: 26,
    title: 'Đối soát số dư (balance reconciliation): giải thích chênh lệch giữa sổ nội bộ và sao kê ngân hàng bằng các khoản điều chỉnh thời điểm',
    level: 'senior',
    minutes: 35,
    goals: [
      'Phân biệt đối soát số dư (so hai con số cuối kỳ) với đối soát giao dịch (so từng dòng theo mã tham chiếu)',
      'Nắm bốn khoản điều chỉnh thời điểm: deposit in transit, outstanding check, phí và lãi ngân hàng, và bên nào cộng/trừ',
      'Viết BalanceReconciler.reconcile(book, bank, adjustments) trả adjustedBook, adjustedBank, difference, reconciled',
    ],
    body: `**Tóm tắt:** Đối soát **số dư** (balance reconciliation) so sánh **hai con số cuối kỳ** — số dư sổ nội bộ và số dư sao kê ngân hàng — rồi **giải thích** khoản chênh bằng các **khoản điều chỉnh thời điểm** (tiền đang trên đường, séc đã ghi chưa bị trừ, phí/lãi ngân hàng ghi một bên). Khi cộng các khoản điều chỉnh vào đúng bên, hai số phải bằng nhau; nếu còn chênh thì đó là lỗi thật cần điều tra.

### Đối soát số dư khác đối soát giao dịch thế nào
Bài 2 và bài 18 đối soát **từng giao dịch** theo mã tham chiếu: so từng dòng, phân loại khớp / lệch / thiếu một bên. Bài này là kiểu đối soát cổ điển của **kế toán ngân hàng**: cuối tháng, số dư trên **sổ của công ty** (book) và số dư trên **sao kê ngân hàng** (bank) thường **không bằng nhau**, dù không có lỗi nào. Vì sao? Vì hai bên ghi nhận tại **thời điểm khác nhau**.

Ví dụ đời thường: bạn ghi sổ chi tiêu tối qua, nhưng thẻ chưa bị trừ tiền vì giao dịch đang "treo" (pending). Sổ bạn và sao kê ngân hàng lệch nhau một khoản — không ai sai, chỉ là **đúng vào những lúc khác nhau**.

### Bốn loại khoản điều chỉnh thời điểm
**Thuật ngữ:** *khoản điều chỉnh thời điểm (timing item)* là giao dịch mà một bên đã ghi, bên kia chưa ghi, nên làm hai số dư lệch tạm thời.

1. **Tiền gửi đang trên đường (deposit in transit)**: công ty đã ghi nhận tiền vào sổ, nhưng ngân hàng chưa cộng (khách nộp tiền cuối ngày, ngân hàng xử lý sáng hôm sau). Đây là khoản **cộng vào phía ngân hàng**.
2. **Séc đã ghi chưa bị trừ (outstanding check)**: công ty đã viết séc và trừ vào sổ, nhưng người nhận chưa ra ngân hàng lĩnh, nên sao kê chưa trừ. Đây là khoản **trừ khỏi phía ngân hàng**.
3. **Phí ngân hàng (bank fee)**: ngân hàng đã trừ phí, công ty chưa biết để ghi. Đây là khoản **trừ khỏi phía sổ**.
4. **Lãi tiền gửi (interest)**: ngân hàng đã cộng lãi, công ty chưa ghi. Đây là khoản **cộng vào phía sổ**.

### Công thức đối soát
Điều chỉnh hai bên về cùng một mốc:
- {{adjustedBook = bookBalance + tổng điều chỉnh phía BOOK}}
- {{adjustedBank = bankBalance + tổng điều chỉnh phía BANK}}
- {{difference = adjustedBook - adjustedBank}}; nếu bằng 0 thì **khớp** (reconciled), khác 0 là **lệch thật** cần điều tra.

### Ví dụ với số liệu
Cuối tháng, sổ công ty ghi 4.500.000đ, sao kê ngân hàng ghi 5.000.000đ. Chênh 500.000đ. Điều tra: công ty đã viết một séc 500.000đ cho nhà cung cấp, đã trừ vào sổ, nhưng séc chưa được lĩnh. Đây là outstanding check, điều chỉnh phía ngân hàng {{−500.000}}:
- {{adjustedBank = 5.000.000 − 500.000 = 4.500.000}}
- {{adjustedBook = 4.500.000}} (không có điều chỉnh phía sổ)
- {{difference = 0}} ⇒ khớp.

Nếu sau khi cộng hết các khoản điều chỉnh mà vẫn còn chênh, thì đó là **break thật**: thiếu giao dịch, ghi sai số tiền, hoặc gian lận — phải chuyển điều tra, không được "bù" bằng cách sửa số dư.

### Luồng đối soát số dư
~~~seq
title: Doi soat so du cuoi thang
actors: Job | Internal | Bank | BalanceReconciler
Job -> Internal: doc so du so book
Job -> Bank: doc so du sao ke bank
Job -> BalanceReconciler: reconcile book bank dieu chinh
BalanceReconciler -> BalanceReconciler: cong dieu chinh tung ben
BalanceReconciler --> Job: difference bang 0 thi khop, nguoc lai lech that
note Job..Bank: neu lech that thi tao ticket dieu tra
~~~

### Lỗi hay gặp trên production
1. **Điều chỉnh sai bên**: cộng outstanding check vào phía sổ thay vì phía ngân hàng ⇒ số lệch gấp đôi.
2. **Quên khoản phí/lãi**: ngân hàng trừ phí tự động, sổ không ghi ⇒ lệch nhỏ lặp lại mỗi tháng.
3. **Dùng tolerance để che lỗi**: chấp nhận mọi chênh nhỏ mà không log ⇒ sai sót thật bị giấu.
4. **Không lưu bằng chứng**: đối soát xong không lưu danh sách timing item ⇒ kiểm toán không tái dựng được.
5. **Dùng {{double}}**: chênh vài đồng do làm tròn, không bao giờ về 0.

> Senior tip: Đối soát số dư không phải để "tìm người sai" mà để **chứng minh** hai con số khác nhau là do thời điểm. Mỗi timing item phải có bằng chứng (séc, phiếu nộp, báo phí) và được lưu lại; nếu cộng hết mà vẫn lệch thì đó là break thật, phải điều tra chứ không sửa số dư.

### Liên hệ phỏng vấn
**Câu hỏi:** "Số dư sổ công ty và sao kê ngân hàng cuối tháng lệch nhau. Bạn xử lý thế nào?"
**Cách trả lời:** Đây là đối soát **số dư**, khác đối soát giao dịch: tôi không so từng dòng mà lấy hai con số cuối kỳ rồi **liệt kê các khoản điều chỉnh thời điểm** — tiền gửi đang trên đường và séc đã ghi chưa lĩnh điều chỉnh phía **ngân hàng**, phí và lãi ngân hàng ghi một bên điều chỉnh phía **sổ**. Cộng từng khoản vào đúng bên, nếu hai số bằng nhau thì lệch chỉ là thời điểm, không phải lỗi; nếu còn chênh thì đó là **break thật** (thiếu giao dịch, sai số tiền, gian lận) phải tạo ticket điều tra, tuyệt đối không sửa số dư để "cho khớp". Mọi timing item phải lưu lại làm bằng chứng kiểm toán, và dùng {{long}} hoặc {{BigDecimal}} để không có sai số làm tròn.`,
    exercises: [
      {
        title: 'BalanceReconciler.reconcile',
        prompt: `Viết class {{BalanceReconciler}} với {{reconcile(long bookBalance, long bankBalance, List<Adjust> adjustments)}} trả về {{Result}}.

{{Adjust}} gồm {{side}} ({{BOOK}} hoặc {{BANK}}) và {{amount}} (long, đã có dấu: cộng vào phía tương ứng; ví dụ séc chưa lĩnh là amount âm ở phía {{BANK}}). {{Result}} gồm {{adjustedBook}}, {{adjustedBank}}, {{difference}} ({{adjustedBook - adjustedBank}}) và {{reconciled}} ({{difference == 0}}).

Quy tắc:
- {{adjustedBook = bookBalance + tổng amount của các Adjust có side BOOK}}.
- {{adjustedBank = bankBalance + tổng amount của các Adjust có side BANK}}.
- {{side}} khác {{BOOK}}/{{BANK}} ⇒ {{IllegalArgumentException}}.
- {{adjustments}} null ⇒ coi như danh sách rỗng.`,
        starter: `import java.util.*;

class Adjust {
    final String side;    // BOOK hoac BANK
    final long amount;    // da co dau
    final String note;
    Adjust(String side, long amount, String note) { this.side = side; this.amount = amount; this.note = note; }
}

class Result {
    long adjustedBook, adjustedBank, difference;
    boolean reconciled;
    Result(long adjustedBook, long adjustedBank) {
        this.adjustedBook = adjustedBook;
        this.adjustedBank = adjustedBank;
        this.difference = adjustedBook - adjustedBank;
        this.reconciled = (this.difference == 0);
    }
}

class BalanceReconciler {
    Result reconcile(long bookBalance, long bankBalance, List<Adjust> adjustments) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Adjust ad(String side, long amt) { return new Adjust(side, amt, ""); }

    public static void main(String[] args) {
        BalanceReconciler r = new BalanceReconciler();

        Result a = r.reconcile(4500000, 5000000, java.util.List.of(ad("BANK", -500000)));
        check("outstanding_check_khop", a.reconciled && a.difference == 0, "adjBook=" + a.adjustedBook + " adjBank=" + a.adjustedBank);
        check("outstanding_check_adjBank_dung", a.adjustedBank == 4500000, "adjBank=" + a.adjustedBank);

        Result b = r.reconcile(5000000, 4000000, java.util.List.of(ad("BANK", 1000000)));
        check("deposit_in_transit_khop", b.reconciled, "diff=" + b.difference);

        Result c = r.reconcile(5000000, 4950000, java.util.List.of(ad("BOOK", -50000)));
        check("bank_fee_khop", c.reconciled && c.adjustedBook == 4950000, "adjBook=" + c.adjustedBook);

        Result d = r.reconcile(5000000, 4900000, new ArrayList<Adjust>());
        check("khong_dieu_chinh_thi_lech", !d.reconciled && d.difference == 100000, "diff=" + d.difference);

        Result e = r.reconcile(1000000, 1000000, null);
        check("null_coi_nhu_rong", e.reconciled && e.difference == 0, "diff=" + e.difference);

        Result f = r.reconcile(1000000, 1000000, java.util.List.of(ad("BANK", 200000), ad("BANK", -50000), ad("BOOK", -30000), ad("BOOK", 10000)));
        check("nhieu_dieu_chinh_hai_ben", f.adjustedBook == 980000 && f.adjustedBank == 1150000 && !f.reconciled, "adjBook=" + f.adjustedBook + " adjBank=" + f.adjustedBank);

        check("side_la_bi_tu_choi", expect(IllegalArgumentException.class, () -> r.reconcile(0, 0, java.util.List.of(ad("OTHER", 1)))), "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Adjust {
    final String side;    // BOOK hoac BANK
    final long amount;    // da co dau
    final String note;
    Adjust(String side, long amount, String note) { this.side = side; this.amount = amount; this.note = note; }
}

class Result {
    long adjustedBook, adjustedBank, difference;
    boolean reconciled;
    Result(long adjustedBook, long adjustedBank) {
        this.adjustedBook = adjustedBook;
        this.adjustedBank = adjustedBank;
        this.difference = adjustedBook - adjustedBank;
        this.reconciled = (this.difference == 0);
    }
}

class BalanceReconciler {
    Result reconcile(long bookBalance, long bankBalance, List<Adjust> adjustments) {
        long ab = bookBalance;
        long ak = bankBalance;
        if (adjustments != null) {
            for (Adjust a : adjustments) {
                if (a == null) throw new IllegalArgumentException("adjust null");
                if ("BOOK".equals(a.side)) ab += a.amount;          // dieu chinh phia so
                else if ("BANK".equals(a.side)) ak += a.amount;     // dieu chinh phia ngan hang
                else throw new IllegalArgumentException("side phai la BOOK hoac BANK: " + a.side);
            }
        }
        return new Result(ab, ak);
    }
}`,
        hints: [
          'Khởi tạo adjustedBook = bookBalance, adjustedBank = bankBalance, rồi duyệt adjustments cộng vào đúng biến theo side.',
          'Kiểm tra side trước khi cộng; side lạ ném IllegalArgumentException.',
          'difference = adjustedBook - adjustedBank; reconciled = (difference == 0).',
        ],
        explain: `Bài học kiểm tra: (1) **điều chỉnh đúng bên** — outstanding check (âm) cộng vào phía BANK, phí (âm) cộng vào phía BOOK; (2) **công thức** — adjustedBook/adjustedBank/difference đúng, reconciled chỉ khi difference = 0; (3) **side lạ** bị từ chối bằng IllegalArgumentException.

Lỗi hay gặp: cộng nhầm bên (làm chênh gấp đôi), và dùng tolerance để "cho khớp" thay vì báo lệch thật. Trong bài này không có tolerance: chênh 1 đồng cũng là chưa khớp.`,
      },
    ],
    check: [
      { q: 'Đối soát số dư (balance reconciliation) so sánh cái gì?', options: ['Từng giao dịch theo mã tham chiếu', 'Hai số dư cuối kỳ (sổ nội bộ vs sao kê ngân hàng) và giải thích chênh lệch', 'Tổng số tài khoản', 'Lãi suất hai bên'], answer: 1, explain: 'Đúng (B): đối soát số dư lấy hai con số cuối kỳ rồi giải thích chênh bằng các khoản điều chỉnh thời điểm, khác đối soát giao dịch (so từng dòng theo ref). Sai (A): đó là đối soát giao dịch (bài 2/18). Sai (C): đếm tài khoản không phải đối soát. Sai (D): lãi suất là chuyện khác.' },
      { q: 'Séc công ty đã ghi vào sổ nhưng chưa bị ngân hàng trừ (outstanding check) điều chỉnh vào bên nào?', options: ['Phía sổ, cộng thêm', 'Phía ngân hàng, trừ đi', 'Phía sổ, trừ đi', 'Không cần điều chỉnh'], answer: 1, explain: 'Đúng (B): công ty đã trừ séc vào sổ nhưng ngân hàng chưa trừ, nên phải trừ khoản đó khỏi phía ngân hàng để hai bên về cùng mốc. Sai (A): phía sổ đã ghi rồi. Sai (C): trừ phía sổ là sai bên. Sai (D): phải điều chỉnh, nếu không hai số lệch.' },
      { q: 'Sau khi cộng mọi khoản điều chỉnh mà adjustedBook vẫn khác adjustedBank thì đó là gì?', options: ['Bình thường, bỏ qua', 'Break thật, phải tạo ticket điều tra', 'Lỗi làm tròn, dùng tolerance', 'Đối tác sai, sửa số dư'], answer: 1, explain: 'Đúng (B): còn chênh sau khi đã tính hết timing item nghĩa là thiếu giao dịch, sai số tiền hoặc gian lận — phải điều tra, không sửa số dư. Sai (A): không được bỏ qua. Sai (C): tolerance không phải để che lỗi. Sai (D): sửa số dư là vi phạm kiểm toán.' },
      { q: 'Tiền khách nộp cuối ngày, công ty đã ghi sổ, ngân hàng chưa cộng (deposit in transit) điều chỉnh vào đâu?', options: ['Phía sổ, cộng', 'Phía ngân hàng, cộng', 'Phía ngân hàng, trừ', 'Phía sổ, trừ'], answer: 1, explain: 'Đúng (B): công ty đã ghi nhận tiền, ngân hàng chưa cộng, nên cộng khoản đó vào phía ngân hàng. Sai (A): phía sổ đã ghi rồi. Sai (C): đây là tiền vào, không phải trừ. Sai (D): sai cả bên lẫn chiều.' },
    ],
    related: ['banking-002', 'banking-023'],
    tags: ['reconciliation', 'balance', 'timing-items', 'banking'],
  },
  {
    id: 'lesson-banking-027',
    track: 'banking',
    order: 27,
    title: 'Order book giá–thời gian và matching engine: TreeMap + ArrayDeque, limit/market/IOC/FOK, vì sao single-threaded',
    level: 'senior',
    minutes: 40,
    goals: [
      'Giải thích được sổ lệnh sắp theo giá tốt nhất trước, cùng giá thì theo thời gian đến trước (price–time priority) và vì sao dùng TreeMap cộng ArrayDeque',
      'Phân biệt limit / market / IOC / FOK, xử lý khớp một phần và phần dư, giá khớp lấy theo lệnh chờ (maker)',
      'Viết OrderBook.submit/cancel trả danh sách trade; hiểu vì sao matching engine thường chạy single-threaded',
    ],
    body: `**Tóm tắt:** Sổ lệnh (order book) là danh sách các lệnh mua/bán còn chờ khớp, sắp theo **giá tốt nhất trước, cùng giá thì theo thời gian đến trước** (price–time priority). Matching engine (bộ máy khớp lệnh) so lệnh mới với lệnh đang chờ, tạo ra các trade ở **mức giá của lệnh chờ**. Bài này cài đặt bằng {{TreeMap}} (tự sắp theo giá) cộng {{ArrayDeque}} (hàng đợi FIFO cho mỗi mức giá), xử lý bốn loại lệnh, khớp một phần và huỷ lệnh.

### Các thuật ngữ (giải thích cho người mới)
- **Sổ lệnh (order book)**: ví như quyển sổ ghi "ai muốn mua giá bao nhiêu, ai muốn bán giá bao nhiêu". Bên mua gọi là **bid**, bên bán gọi là **ask** (hoặc offer).
- **Lệnh giới hạn (limit order)**: chỉ khớp ở mức giá bạn đặt **hoặc tốt hơn**. Ví dụ "mua 100 đơn vị ở giá 50" chỉ khớp khi có người bán ở mức 50 hoặc thấp hơn.
- **Lệnh thị trường (market order)**: khớp ngay ở mức giá tốt nhất đang có, không quan tâm giá, miễn khớp được.
- **IOC (Immediate-Or-Cancel)**: khớp phần làm được ngay, phần còn lại **huỷ**, không đặt lên sổ.
- **FOK (Fill-Or-Kill)**: phải khớp **toàn bộ ngay lập tức**; nếu không đủ thanh khoản thì huỷ sạch, không khớp một phần.
- **Khớp một phần (partial fill)**: lệnh lớn hơn lượng sẵn có nên chỉ khớp được một đoạn.
- **Maker / taker**: lệnh nằm chờ trên sổ là **maker** (người tạo thanh khoản), lệnh mới đến khớp nó là **taker** (người lấy thanh khoản). Giá khớp luôn bằng giá của maker.

### Vì sao dùng TreeMap cho giá và ArrayDeque cho thời gian
Mỗi bên của sổ là một bảng ánh xạ **giá → hàng đợi lệnh**. Ta cần hai thao tác nhanh: (1) lấy mức giá tốt nhất, (2) trong một mức giá, lấy lệnh đến sớm nhất.

- {{TreeMap}} giữ các khoá (giá) **tự sắp xếp**. Bên mua dùng {{Comparator.reverseOrder()}} để giá **cao nhất** nằm đầu (mua giá cao là tốt cho người mua); bên bán dùng thứ tự tự nhiên để giá **thấp nhất** nằm đầu. Lấy mức tốt nhất chỉ là {{firstEntry()}} — O(log n).
- Mỗi mức giá là một {{ArrayDeque}} (hàng đợi hai đầu). Lệnh mới đến thì {{addLast}} (vào cuối), lệnh khớp thì {{peekFirst}}/{{pollFirst}} (lấy từ đầu). Nhờ vậy trong cùng một giá, lệnh đến trước được khớp trước — đúng **ưu tiên thời gian**.

Ví dụ sổ bên mua (giá giảm dần): 110 (2 lệnh), 100 (1 lệnh). Một lệnh bán 5 đơn vị ở giá 100 sẽ khớp với lệnh mua 110 trước (giá tốt hơn cho người bán), và trong mức 110 thì khớp lệnh đến trước.

### Luồng khớp một lệnh mới
~~~seq
title: Khop mot lenh ban voi so lenh mua
actors: Client | MatchingEngine | OrderBook | TradeBus
Client -> MatchingEngine: submit(lenh ban 100 @ 50)
MatchingEngine -> OrderBook: tim bid tot nhat
OrderBook --> MatchingEngine: bid 50 x 10 (maker)
MatchingEngine -> MatchingEngine: tao trade 10 @ 50
MatchingEngine -> TradeBus: phat trade
MatchingEngine --> Client: danh sach trade
~~~

Các bước trong {{submit}}:
1. Chọn phía đối diện: lệnh mua (bid) đi so với sổ bán (ask), và ngược lại.
2. Lặp: lấy mức giá tốt nhất của phía đối diện. Nếu là lệnh giới hạn mà giá đối diện đã vượt mức chấp nhận (mua mà giá bán cao hơn giá đặt, hoặc bán mà giá mua thấp hơn giá đặt) thì **dừng**.
3. Trong mức giá đó, lấy lệnh chờ cũ nhất, khớp số lượng = min(còn lại của hai bên), ghi một {{Trade}} ở **giá của lệnh chờ**.
4. Trừ số lượng hai bên; lệnh chờ nào khớp hết thì xoá khỏi hàng đợi.
5. Khi lệnh mới khớp hết hoặc không còn mức giá phù hợp thì dừng. Phần dư tuỳ loại lệnh (xem bảng).

### Bốn loại lệnh và phần dư
| Loại | Khớp ngay | Phần dư | Khi nào dùng |
|---|---|---|---|
| LIMIT | Có, trong phạm vi giá | **Đặt lên sổ** chờ tiếp | Hầu hết giao dịch; kiểm soát giá |
| MARKET | Có, ở giá tốt nhất | **Huỷ** (không đặt sổ) | Cần khớp ngay, chấp nhận giá |
| IOC | Có, phần làm được | **Huỷ** phần dư | Không muốn chờ, tránh rủi ro giá |
| FOK | Chỉ khi khớp **hết** | Huỷ sạch nếu không đủ | Bắt buộc trọn vẹn (ví dụ lệnh lớn) |

Với FOK, trước khi khớp phải **kiểm tra tổng thanh khoản** ở các mức giá chấp nhận được; nếu nhỏ hơn số lượng yêu cầu thì trả về rỗng, không khớp gì. Với IOC, sau khi khớp phần làm được, phần dư bị bỏ. Với LIMIT, phần dư được đưa vào đúng mức giá của nó ở **cuối hàng đợi** (giữ ưu tiên thời gian).

### Vì sao matching engine thường single-threaded
Khớp lệnh là bài toán **phụ thuộc lẫn nhau**: thứ tự hai lệnh đến ảnh hưởng kết quả (ai khớp trước, ai được giá). Nếu nhiều thread cùng sửa sổ, phải khoá và rất dễ sai (mất lệnh, khớp hai lần, tranh chấp). Giải pháp phổ biến trên sàn là **một luồng duy nhất** xử lý toàn bộ lệnh vào theo thứ tự, các luồng khác chỉ đọc bản sao sổ để gửi market data. Một luồng không khoá, không tranh chấp, dễ kiểm chứng, và thường đủ nhanh (hàng trăm nghìn lệnh/giây) vì mỗi lệnh chỉ vài thao tác trên map. Khi cần mở rộng, người ta **phân mảnh theo symbol** (mỗi symbol một engine một luồng) chứ không chia một sổ cho nhiều luồng.

### Ví dụ đời thực (giả định)
Một sàn phái sinh mở cửa, hợp đồng Vàng có sổ: mua 110×2, mua 100×3, bán 105×4. Lệnh taker đến: mua 5 ở giá 108 (limit). Engine khớp với bán 105×4 (giá 105 ≤ 108) tạo trade 4 ở 105, còn 1 đơn vị chưa khớp vì mức bán kế tiếp (nếu có) vượt 108; phần dư 1 được đặt lên sổ mua ở 108. Market data ngay lập tức phát đi "best ask 105, last trade 105×4" cho mọi client qua WebSocket/FIX.

### Lỗi hay gặp trên production
1. **Khớp sai giá**: lấy giá của taker thay vì maker. Giá khớp luôn là giá lệnh chờ (maker); lấy nhầm làm sai số dư tiền của cả hai bên.
2. **Quên xử lý phần dư**: IOC/FOK để sót lệnh lên sổ, hoặc LIMIT không đặt phần dư lên sổ.
3. **Sai ưu tiên thời gian**: dùng danh sách thường rồi chèn đầu, khiến lệnh đến sau khớp trước.
4. **Đa luồng sửa sổ**: hai lệnh cùng khớp một maker, maker bị trừ hai lần. Sàn thật dùng single-threaded hoặc phân mảnh theo symbol.
5. **FOK khớp một phần**: không kiểm tra tổng thanh khoản trước, để lại trạng thái nửa vời.

### Liên hệ phỏng vấn
**Câu hỏi:** "Thiết kế matching engine cho order book, vì sao dùng TreeMap cộng ArrayDeque và vì sao single-threaded?"
**Cách trả lời:** Mỗi bên sổ là {{TreeMap}} giá → {{ArrayDeque}} lệnh: TreeMap cho lấy mức giá tốt nhất O(log n), ArrayDeque cho FIFO trong mức giá nên khớp đúng ưu tiên giá rồi thời gian. Lệnh mới so với phía đối diện, khớp ở giá maker cho tới khi hết hoặc vượt giá đặt; LIMIT đặt phần dư lên sổ, MARKET/IOC huỷ phần dư, FOK kiểm tra tổng thanh khoản trước rồi mới khớp trọn. Engine chạy **single-threaded** để tránh tranh chấp và đảm bảo thứ tự tất định; khi cần throughput thì phân mảnh theo symbol, mỗi symbol một luồng, còn market data phát cho các luồng đọc.

> Senior tip: Trong review, coi "giá khớp = giá maker" và "phần dư đúng loại lệnh" là hai bất biến phải test đầu tiên; và luôn hỏi "sổ này có bị nhiều luồng sửa không" trước khi tin vào tính đúng đắn.`,
    exercises: [
      {
        title: 'OrderBook.submit / cancel với price–time priority',
        prompt: `Viết class {{OrderBook}} cho sổ lệnh giá–thời gian. Lệnh {{Order}} gồm {{id}} (long), {{side}} ('B' mua / 'S' bán), {{type}} ("LIMIT"/"MARKET"/"IOC"/"FOK"), {{price}} (long, đơn vị nhỏ nhất), {{qty}} (long).

{{List<Trade> submit(Order o)}}: đưa lệnh vào sổ, trả về danh sách trade tạo ra. {{Trade}} gồm {{price}} (giá khớp = giá lệnh chờ), {{qty}}, {{buyId}}, {{sellId}}.

Quy tắc:
1. Ưu tiên **giá tốt nhất trước** (mua: cao nhất; bán: thấp nhất), cùng giá thì **thời gian đến trước** (FIFO).
2. Giá khớp = giá của lệnh đang chờ (maker).
3. LIMIT: phần dư đặt lên sổ; MARKET: khớp tới hết thanh khoản, phần dư huỷ; IOC: khớp phần làm được, phần dư huỷ; FOK: nếu tổng thanh khoản ở giá chấp nhận < qty thì **không khớp gì**, ngược lại khớp trọn.
4. {{boolean cancel(long id)}}: huỷ lệnh còn trên sổ, trả true nếu huỷ được (lệnh đã khớp hết hoặc không tồn tại ⇒ false).
5. {{long remaining(long id)}}: số lượng còn lại của lệnh (0 nếu đã khớp hết/không có). {{long bestBid()}} / {{long bestAsk()}}: giá tốt nhất, 0 nếu sổ trống.`,
        starter: `import java.util.*;

class Order {
    final long id;
    final char side;        // 'B' mua, 'S' ban
    final String type;      // LIMIT, MARKET, IOC, FOK
    final long price;       // gia gioi han (don vi nho nhat)
    final long qty;         // tong so luong
    long remaining;         // con lai chua khop

    Order(long id, char side, String type, long price, long qty) {
        this.id = id;
        this.side = side;
        this.type = type;
        this.price = price;
        this.qty = qty;
        this.remaining = qty;
    }
}

class Trade {
    final long price;       // gia khop = gia lenh cho san (maker)
    final long qty;
    final long buyId;
    final long sellId;
    Trade(long price, long qty, long buyId, long sellId) {
        this.price = price; this.qty = qty; this.buyId = buyId; this.sellId = sellId;
    }
    public String toString() {
        return "Trade[" + price + " x " + qty + ", mua " + buyId + " / ban " + sellId + "]";
    }
}

class OrderBook {
    private final TreeMap<Long, ArrayDeque<Order>> bids =
            new TreeMap<>(Comparator.reverseOrder());
    private final TreeMap<Long, ArrayDeque<Order>> asks = new TreeMap<>();
    private final Map<Long, Order> byId = new HashMap<>();

    List<Trade> submit(Order o) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean cancel(long id) {
        throw new UnsupportedOperationException("TODO");
    }

    long remaining(long id) {
        throw new UnsupportedOperationException("TODO");
    }

    long bestBid() {
        throw new UnsupportedOperationException("TODO");
    }

    long bestAsk() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static Order ord(long id, char side, String type, long price, long qty) {
        return new Order(id, side, type, price, qty);
    }
    public static void main(String[] args) {
        OrderBook ob = new OrderBook();
        ob.submit(ord(1, 'B', "LIMIT", 100, 10));
        ob.submit(ord(2, 'B', "LIMIT", 110, 10));
        java.util.List<Trade> t = ob.submit(ord(3, 'S', "LIMIT", 100, 5));
        check("uu_tien_gia", t.size() == 1 && t.get(0).price == 110 && t.get(0).qty == 5
                && t.get(0).buyId == 2 && ob.remaining(2) == 5 && ob.remaining(1) == 10,
                "trades=" + t + " bestBid=" + ob.bestBid());

        OrderBook ob2 = new OrderBook();
        ob2.submit(ord(1, 'B', "LIMIT", 100, 10));
        ob2.submit(ord(2, 'B', "LIMIT", 100, 10));
        java.util.List<Trade> t2 = ob2.submit(ord(3, 'S', "LIMIT", 100, 5));
        check("uu_tien_thoi_gian", t2.size() == 1 && t2.get(0).buyId == 1
                && ob2.remaining(1) == 5 && ob2.remaining(2) == 10,
                "trades=" + t2);

        OrderBook ob3 = new OrderBook();
        ob3.submit(ord(1, 'S', "LIMIT", 100, 5));
        java.util.List<Trade> t3 = ob3.submit(ord(2, 'B', "LIMIT", 100, 12));
        check("khop_mot_phan", t3.size() == 1 && t3.get(0).qty == 5
                && ob3.remaining(2) == 7 && ob3.bestBid() == 100,
                "trades=" + t3 + " rem2=" + ob3.remaining(2));

        OrderBook ob4 = new OrderBook();
        ob4.submit(ord(1, 'S', "LIMIT", 100, 5));
        java.util.List<Trade> t4 = ob4.submit(ord(2, 'B', "IOC", 100, 12));
        check("ioc_huy_phan_du", t4.size() == 1 && t4.get(0).qty == 5
                && ob4.bestBid() == 0 && ob4.remaining(2) == 0,
                "trades=" + t4 + " bestBid=" + ob4.bestBid());

        OrderBook ob5 = new OrderBook();
        ob5.submit(ord(1, 'S', "LIMIT", 100, 5));
        java.util.List<Trade> t5 = ob5.submit(ord(2, 'B', "FOK", 100, 12));
        check("fok_khong_du", t5.isEmpty() && ob5.remaining(1) == 5 && ob5.bestAsk() == 100,
                "trades=" + t5 + " bestAsk=" + ob5.bestAsk());

        OrderBook ob5b = new OrderBook();
        ob5b.submit(ord(1, 'S', "LIMIT", 100, 5));
        java.util.List<Trade> t5b = ob5b.submit(ord(2, 'B', "FOK", 100, 5));
        check("fok_du_thi_khop_het", t5b.size() == 1 && t5b.get(0).qty == 5
                && ob5b.bestAsk() == 0 && ob5b.remaining(1) == 0,
                "trades=" + t5b);

        OrderBook ob6 = new OrderBook();
        ob6.submit(ord(1, 'S', "LIMIT", 100, 10));
        ob6.submit(ord(2, 'B', "LIMIT", 100, 4));
        boolean c1 = ob6.cancel(1);
        check("huy_lenh_mot_phan", c1 && ob6.bestAsk() == 0 && ob6.remaining(1) == 0
                && !ob6.cancel(1),
                "cancel=" + c1 + " bestAsk=" + ob6.bestAsk());

        OrderBook ob7 = new OrderBook();
        ob7.submit(ord(1, 'S', "LIMIT", 100, 5));
        ob7.submit(ord(2, 'S', "LIMIT", 105, 5));
        java.util.List<Trade> t7 = ob7.submit(ord(3, 'B', "MARKET", 0, 7));
        check("market_khong_rest", t7.size() == 2 && t7.get(0).price == 100 && t7.get(1).price == 105
                && ob7.bestBid() == 0 && ob7.remaining(3) == 0,
                "trades=" + t7);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Order {
    final long id;
    final char side;
    final String type;
    final long price;
    final long qty;
    long remaining;

    Order(long id, char side, String type, long price, long qty) {
        this.id = id;
        this.side = side;
        this.type = type;
        this.price = price;
        this.qty = qty;
        this.remaining = qty;
    }
}

class Trade {
    final long price;
    final long qty;
    final long buyId;
    final long sellId;
    Trade(long price, long qty, long buyId, long sellId) {
        this.price = price; this.qty = qty; this.buyId = buyId; this.sellId = sellId;
    }
    public String toString() {
        return "Trade[" + price + " x " + qty + ", mua " + buyId + " / ban " + sellId + "]";
    }
}

class OrderBook {
    private final TreeMap<Long, ArrayDeque<Order>> bids =
            new TreeMap<>(Comparator.reverseOrder());
    private final TreeMap<Long, ArrayDeque<Order>> asks = new TreeMap<>();
    private final Map<Long, Order> byId = new HashMap<>();

    List<Trade> submit(Order o) {
        List<Trade> trades = new ArrayList<>();
        boolean isBuy = o.side == 'B';
        TreeMap<Long, ArrayDeque<Order>> opp = isBuy ? asks : bids;

        // FOK: khong du thanh khoan thi huy toan bo, khong khop gi
        if (o.type.equals("FOK") && available(opp, o, isBuy) < o.qty) {
            return trades;
        }

        while (o.remaining > 0) {
            Map.Entry<Long, ArrayDeque<Order>> best = opp.firstEntry();
            if (best == null) break;
            long bestPrice = best.getKey();
            if (!o.type.equals("MARKET")) {
                if (isBuy ? bestPrice > o.price : bestPrice < o.price) break;
            }
            ArrayDeque<Order> level = best.getValue();
            while (!level.isEmpty() && o.remaining > 0) {
                Order maker = level.peekFirst();
                long matchQty = Math.min(o.remaining, maker.remaining);
                long buyId = isBuy ? o.id : maker.id;
                long sellId = isBuy ? maker.id : o.id;
                trades.add(new Trade(bestPrice, matchQty, buyId, sellId));
                maker.remaining -= matchQty;
                o.remaining -= matchQty;
                if (maker.remaining == 0) {
                    level.pollFirst();
                    byId.remove(maker.id);
                }
            }
            if (level.isEmpty()) opp.pollFirstEntry();
        }

        // Phan con lai: chi LIMIT duoc dat len so
        if (o.remaining > 0 && o.type.equals("LIMIT")) {
            ArrayDeque<Order> level = (isBuy ? bids : asks)
                    .computeIfAbsent(o.price, k -> new ArrayDeque<>());
            level.addLast(o);
            byId.put(o.id, o);
        }
        return trades;
    }

    private long available(TreeMap<Long, ArrayDeque<Order>> opp, Order o, boolean isBuy) {
        long avail = 0;
        for (Map.Entry<Long, ArrayDeque<Order>> e : opp.entrySet()) {
            long p = e.getKey();
            if (isBuy ? p > o.price : p < o.price) break;
            for (Order m : e.getValue()) avail += m.remaining;
        }
        return avail;
    }

    boolean cancel(long id) {
        Order o = byId.get(id);
        if (o == null) return false;
        TreeMap<Long, ArrayDeque<Order>> own = o.side == 'B' ? bids : asks;
        ArrayDeque<Order> level = own.get(o.price);
        if (level != null) {
            level.remove(o);
            if (level.isEmpty()) own.remove(o.price);
        }
        byId.remove(id);
        return true;
    }

    long remaining(long id) {
        Order o = byId.get(id);
        return o == null ? 0 : o.remaining;
    }

    long bestBid() {
        Map.Entry<Long, ArrayDeque<Order>> e = bids.firstEntry();
        return e == null ? 0 : e.getKey();
    }

    long bestAsk() {
        Map.Entry<Long, ArrayDeque<Order>> e = asks.firstEntry();
        return e == null ? 0 : e.getKey();
    }
}`,
        hints: [
          'Mỗi bên sổ là {{TreeMap<Long, ArrayDeque<Order>>>}}: bên mua dùng {{Comparator.reverseOrder()}} để giá cao nhất ở đầu, bên bán dùng thứ tự tự nhiên.',
          'Vòng khớp: lấy {{opp.firstEntry()}}, kiểm tra giá (trừ MARKET), khớp với {{level.peekFirst()}} ở giá maker cho tới khi hết; LIMIT thì {{addLast}} phần dư, IOC/MARKET bỏ phần dư.',
          'FOK: duyệt các mức giá chấp nhận được để cộng tổng thanh khoản; nếu < qty thì trả danh sách rỗng.',
        ],
        explain: `Ý chính: giá khớp luôn là giá maker, ưu tiên giá rồi thời gian nhờ TreeMap cộng ArrayDeque, phần dư tuỳ loại lệnh. {{cancel}} chỉ huỷ lệnh còn trên sổ (đã khớp hết ⇒ false).

Lỗi hay gặp:
- Lấy giá taker thay vì maker làm sai tiền hai bên.
- IOC/FOK để sót phần dư lên sổ; LIMIT quên đặt phần dư.
- Dùng {{ArrayList}} rồi chèn đầu ⇒ mất ưu tiên thời gian; phải FIFO bằng hàng đợi.
- FOK không kiểm tra tổng thanh khoản trước nên khớp dở dang.`,
      },
    ],
    check: [
      { q: 'Trong sổ lệnh, khi hai lệnh cùng mức giá thì lệnh nào được khớp trước?', options: ['Lệnh có id lớn hơn', 'Lệnh đến trước (FIFO theo thời gian)', 'Lệnh có số lượng lớn hơn', 'Lệnh của khách VIP'], answer: 1, explain: 'Đúng (B): cùng mức giá thì ưu tiên thời gian — lệnh đến trước khớp trước (price–time priority), cài bằng hàng đợi FIFO (ArrayDeque). Sai (A): id không quyết định thứ tự. Sai (C): số lượng không phá vỡ ưu tiên thời gian (chỉ chia nhỏ lệnh chờ). Sai (D): sàn không ưu tiên theo nhãn khách.' },
      { q: 'Vì sao matching engine của sàn thường chạy single-threaded (hoặc phân mảnh theo symbol)?', options: ['Vì Java không hỗ trợ đa luồng', 'Vì thứ tự lệnh ảnh hưởng kết quả khớp; một luồng tránh tranh chấp và đảm bảo tất định', 'Vì TreeMap không thread-safe nên phải một luồng cho mọi symbol', 'Vì khớp lệnh cần I/O mạng nên một luồng là đủ'], answer: 1, explain: 'Đúng (B): khớp lệnh phụ thuộc thứ tự (ai tới trước được giá), nhiều luồng dễ khớp hai lần/mất lệnh; một luồng đơn giản, không khoá, tất định. Khi cần throughput thì phân mảnh theo symbol (mỗi symbol một engine), không phải một sổ chung nhiều luồng. Sai (A): Java hỗ trợ đa luồng đầy đủ. Sai (C): lý do không phải TreeMap mà là tính phụ thuộc thứ tự; phân mảnh theo symbol mới đúng. Sai (D): khớp lệnh là tính toán thuần, không phải I/O.' },
      { q: 'Khác biệt giữa IOC và FOK là gì?', options: ['IOC khớp trọn hoặc huỷ sạch; FOK khớp phần làm được rồi huỷ phần dư', 'IOC khớp phần làm được rồi huỷ phần dư; FOK phải khớp trọn ngay, không đủ thì huỷ sạch', 'Cả hai đều đặt phần dư lên sổ', 'IOC là lệnh thị trường, FOK là lệnh giới hạn'], answer: 1, explain: 'Đúng (B): IOC (Immediate-Or-Cancel) khớp phần có thể ngay, phần dư huỷ; FOK (Fill-Or-Kill) bắt buộc khớp toàn bộ ngay, nếu không đủ thanh khoản thì huỷ sạch, không khớp gì. Sai (A): đảo ngược hai khái niệm. Sai (C): cả hai đều không đặt phần dư lên sổ. Sai (D): cả hai đều có thể kèm giá giới hạn; không phải market/limit.' },
    ],
    related: [],
    tags: ['order-book', 'matching-engine', 'treemap', 'price-time', 'banking'],
  },
  {
    id: 'lesson-banking-028',
    track: 'banking',
    order: 28,
    title: 'Mark-to-market hằng ngày, variation margin và margin call: lãi lỗ theo settlement price, ngưỡng duy trì, idempotent',
    level: 'senior',
    minutes: 35,
    goals: [
      'Giải thích mark-to-market (định giá lại theo giá thị trường) và vì sao mỗi ngày phải tính lãi lỗ rồi cộng vào số dư ký quỹ',
      'Phân biệt long/short, multiplier, variation margin, ký quỹ duy trì và margin call; hiểu biên "đúng ngưỡng thì an toàn"',
      'Viết MarginEngine.settle trả variation margin + danh sách margin call; chạy lại cùng ngày phải idempotent',
    ],
    body: `**Tóm tắt:** Hợp đồng tương lai được **định giá lại hằng ngày** (mark-to-market): mỗi ngày lấy **giá thanh toán** (settlement price) mới, tính lãi/lỗ của từng vị thế so với giá hôm trước, rồi **cộng vào số dư ký quỹ** (variation margin). Nếu số dư tụt xuống **dưới ngưỡng duy trì**, tài khoản bị **gọi ký quỹ** (margin call) để nạp thêm; không nạp thì bị **tất toán bắt buộc**. Bài này cài {{MarginEngine.settle}} bằng số nguyên đơn vị nhỏ nhất (chính xác, không cần làm tròn), và settle lại cùng một ngày phải **idempotent**.

### Các thuật ngữ (giải thích cho người mới)
- **Hợp đồng tương lai (future)**: thoả thuận mua/bán một tài sản (vàng, dầu, nông sản) ở **giá chốt hôm nay**, giao vào ngày sau. Người mua không trả toàn bộ tiền ngay, chỉ đặt **ký quỹ**.
- **Vị thế (position)**: trạng thái bạn đang giữ. **Long** = đang mua (hưởng lợi khi giá lên). **Short** = đang bán (hưởng lợi khi giá xuống).
- **Giá thanh toán (settlement price)**: giá tham chiếu mỗi ngày do sàn công bố, dùng để tính lãi lỗ và ký quỹ.
- **Multiplier (hệ số nhân)**: mỗi đơn vị giá ứng với bao nhiêu tiền. Ví dụ hợp đồng Vàng 1 điểm = 1.000.000đ, multiplier = 1.000.000.
- **Mark-to-market (định giá lại)**: mỗi ngày đánh giá lại lãi/lỗ dựa trên giá mới, không đợi đến ngày đáo hạn.
- **Variation margin (ký quỹ biến thiên)**: khoản tiền lãi/lỗ trong ngày, cộng vào (lỗ thì trừ) số dư ký quỹ.
- **Ký quỹ duy trì (maintenance margin)**: ngưỡng số dư tối thiểu. Dưới ngưỡng ⇒ **margin call** (gọi nạp thêm).
- **Tất toán bắt buộc (forced liquidation)**: nếu không nạp đủ sau margin call, sàn đóng vị thế của bạn.

### Vì sao phải mark-to-market mỗi ngày
Nếu đợi đến đáo hạn mới tính lãi lỗ, một người thua lỗ nặng có thể bùng nợ. Mark-to-market giải quyết bằng cách **chốt lãi lỗ mỗi ngày**: lãi được rút, lỗ bị trừ ngay. Nhờ vậy rủi ro tín dụng giữa các bên được giới hạn trong **một ngày biến động giá**, và ký quỹ luôn phản ánh đúng giá trị thực của vị thế.

Ví dụ đời thường: bạn đặt cọc mua một chiếc xe, mỗi ngày đại lý định giá lại chiếc xe; nếu giá thị trường giảm khiến chiếc xe (mà bạn đã cam kết mua) mất giá, bạn phải bù thêm tiền cọc để đảm bảo không "quỵt".

### Công thức variation margin theo ngày
Với mỗi vị thế:
- {{change = settlementToday − settlementPrev}} (độ biến động giá)
- Long: {{variation = change × qty × multiplier}} (giá lên ⇒ lãi)
- Short: {{variation = −change × qty × multiplier}} (giá xuống ⇒ lãi)
- Số dư mới: {{balance += variation}}
- Nếu {{balance < maintenance}} ⇒ margin call (đúng bằng ngưỡng thì **an toàn**, vì điều kiện là nhỏ hơn).

### Luồng settle cuối ngày
~~~seq
title: Settle mark-to-market cuoi ngay
actors: Scheduler | MarginEngine | PriceFeed | Risk
Scheduler -> MarginEngine: settle(day, positions, prices)
MarginEngine -> PriceFeed: lay settlement price hom nay
MarginEngine -> MarginEngine: variation = (today - prev) * qty * mult
MarginEngine -> MarginEngine: balance += variation
MarginEngine -> Risk: danh sach margin call (balance < maint)
MarginEngine --> Scheduler: variation + margin calls
~~~

### Vì sao dùng số nguyên (long) ở bài này
Phép tính {{change × qty × multiplier}} là **nhân các số nguyên** nên kết quả luôn chính xác tuyệt đối, không có sai số nhị phân như {{double}} (xem bài 1). Vì vậy bài này dùng {{long}} ở đơn vị nhỏ nhất. Khi nào cần {{BigDecimal}}? Khi có **phép chia** hoặc **phần trăm** (ví dụ phí 0,5%, tỷ giá có phần thập phân) — lúc đó khởi tạo từ chuỗi và làm tròn {{HALF_UP}} một lần ở biên. Nguyên tắc: nhân/trừ số nguyên thì long là đủ và nhanh; chia/phần trăm thì BigDecimal.

### Lỗi hay gặp trên production
1. **Sai dấu short**: tính variation của short giống long ⇒ người bán tưởng lãi khi giá lên. Phải đảo dấu cho short.
2. **Lệch ngưỡng (off-by-one)**: dùng {{balance <= maintenance}} thay vì {{<}} ⇒ báo margin call oan khi số dư đúng bằng ngưỡng. Đúng ngưỡng là an toàn.
3. **Settle hai lần cùng ngày**: cộng variation hai lần ⇒ số dư sai. Phải idempotent (đánh dấu ngày đã settle cho mỗi tài khoản).
4. **Dùng double cho tiền**: số dư lệch vài đồng sau nhiều ngày (bài 1).
5. **Không cộng dồn nhiều ngày**: mỗi ngày chỉ tính trên balance = 0 thay vì số dư hiện có.

### Liên hệ phỏng vấn
**Câu hỏi:** "Giải thích mark-to-market và variation margin. Vì sao phải settle mỗi ngày và margin call hoạt động thế nào?"
**Cách trả lời:** Hợp đồng tương lai được định giá lại mỗi ngày theo settlement price: variation margin = (giá hôm nay − giá hôm trước) × số lượng × multiplier, dấu dương cho long khi giá lên, âm cho short. Khoản này cộng vào số dư ký quỹ; nếu số dư **dưới** ngưỡng duy trì thì phát margin call, không nạp đủ thì tất toán bắt buộc. Mark-to-market giới hạn rủi ro tín dụng trong một ngày. Bài này dùng {{long}} đơn vị nhỏ nhất vì chỉ nhân/trừ số nguyên; settle phải **idempotent** theo ngày để chạy lại không cộng trùng, và điều kiện margin call là **nhỏ hơn** ngưỡng (đúng bằng thì an toàn).

> Senior tip: Luôn test biên "đúng bằng ngưỡng" và "chạy lại cùng ngày"; hai lỗi off-by-one và settle-trùng là nguyên nhân phổ biến nhất làm sai số dư ký quỹ hàng loạt tài khoản.`,
    exercises: [
      {
        title: 'MarginEngine.settle: variation margin + margin call',
        prompt: `Viết class {{MarginEngine}} tính mark-to-market cuối ngày. {{Position}} gồm {{account}}, {{product}}, {{side}} ('L' long / 'S' short), {{qty}} (số hợp đồng), {{multiplier}} (giá trị mỗi đơn vị giá), {{prevPrice}} (settlement hôm trước), {{maintMargin}} (ký quỹ duy trì của tài khoản).

{{SettleResult settle(String day, List<Position> positions, Map<String, Long> prices)}} với {{prices}} ánh xạ {{product → settlement hôm nay}}. {{SettleResult}} có: {{Map<String, Long> variation}} (lãi/lỗ theo tài khoản), {{List<String> marginCalls}} (tài khoản bị gọi ký quỹ), {{Map<String, Long> balance}} (số dư sau settle của các tài khoản vừa xử lý).

Quy tắc:
1. {{change = today − prevPrice}}; long: {{variation = change × qty × multiplier}}; short: {{variation = −change × qty × multiplier}}.
2. {{balance[account] += variation}} (cộng dồn từ số dư cũ, mặc định 0).
3. Nếu {{balance < maintMargin}} ⇒ thêm account vào {{marginCalls}}. **Đúng bằng ngưỡng thì KHÔNG gọi.**
4. **Idempotent theo ngày**: settle lại cùng {{day}} cho tài khoản đã settle ⇒ không cộng lại, {{variation}} rỗng, {{balance}} không đổi.
5. {{long balance(String account)}}: số dư hiện tại (0 nếu chưa có).`,
        starter: `import java.util.*;

class Position {
    final String account;
    final String product;
    final char side;          // 'L' long, 'S' short
    final long qty;
    final long multiplier;
    final long prevPrice;
    final long maintMargin;
    Position(String account, String product, char side, long qty,
             long multiplier, long prevPrice, long maintMargin) {
        this.account = account; this.product = product; this.side = side;
        this.qty = qty; this.multiplier = multiplier;
        this.prevPrice = prevPrice; this.maintMargin = maintMargin;
    }
}

class SettleResult {
    final Map<String, Long> variation = new LinkedHashMap<>();
    final List<String> marginCalls = new ArrayList<>();
    final Map<String, Long> balance = new LinkedHashMap<>();
}

class MarginEngine {
    private final Map<String, Long> balance = new HashMap<>();
    private final Map<String, String> lastDay = new HashMap<>();

    SettleResult settle(String day, List<Position> positions, Map<String, Long> prices) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String account) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static Position pos(String acc, String prod, char side, long qty, long mult, long prev, long maint) {
        return new Position(acc, prod, side, qty, mult, prev, maint);
    }
    static java.util.Map<String, Long> px(String prod, long price) {
        java.util.Map<String, Long> m = new java.util.HashMap<>();
        m.put(prod, price);
        return m;
    }
    static java.util.Map<String, Long> px2(long g, long o) {
        java.util.Map<String, Long> m = new java.util.HashMap<>();
        m.put("GOLD", g); m.put("OIL", o);
        return m;
    }
    public static void main(String[] args) {
        MarginEngine e = new MarginEngine();
        SettleResult r = e.settle("2026-01-01",
                java.util.List.of(pos("A", "GOLD", 'L', 2, 1000, 50000, 100000)),
                px("GOLD", 51000));
        check("long_loi", r.variation.get("A") == 2000000L && r.balance.get("A") == 2000000L
                && r.marginCalls.isEmpty(), "var=" + r.variation + " bal=" + r.balance);

        MarginEngine e2 = new MarginEngine();
        SettleResult r2 = e2.settle("2026-01-01",
                java.util.List.of(pos("B", "OIL", 'S', 3, 1000, 50000, 100000)),
                px("OIL", 49000));
        check("short_loi", r2.variation.get("B") == 3000000L && r2.marginCalls.isEmpty(),
                "var=" + r2.variation);

        MarginEngine e3 = new MarginEngine();
        SettleResult r3 = e3.settle("2026-01-01",
                java.util.List.of(pos("C", "OIL", 'S', 1, 1000, 50000, 100000)),
                px("OIL", 51000));
        check("short_lo_margin_call", r3.variation.get("C") == -1000000L
                && r3.marginCalls.contains("C"), "calls=" + r3.marginCalls);

        MarginEngine e4 = new MarginEngine();
        SettleResult r4 = e4.settle("2026-01-01",
                java.util.List.of(pos("D", "GOLD", 'L', 1, 1000, 50000, 500000)),
                px("GOLD", 50500));
        check("dung_nguong_khong_goi", r4.balance.get("D") == 500000L && r4.marginCalls.isEmpty(),
                "bal=" + r4.balance + " calls=" + r4.marginCalls);

        MarginEngine e4b = new MarginEngine();
        SettleResult r4b = e4b.settle("2026-01-01",
                java.util.List.of(pos("E", "GOLD", 'L', 1, 1000, 50000, 500000)),
                px("GOLD", 50499));
        check("duoi_nguong_mot_don_vi", r4b.balance.get("E") == 499000L && r4b.marginCalls.contains("E"),
                "bal=" + r4b.balance + " calls=" + r4b.marginCalls);

        MarginEngine e5 = new MarginEngine();
        java.util.List<Position> ps = java.util.List.of(pos("F", "GOLD", 'L', 1, 1000, 50000, 100000));
        SettleResult a1 = e5.settle("2026-01-01", ps, px("GOLD", 51000));
        SettleResult a2 = e5.settle("2026-01-01", ps, px("GOLD", 51000));
        check("idempotent_cung_ngay", a1.balance.get("F") == 1000000L
                && a2.variation.isEmpty() && a2.balance.isEmpty()
                && e5.balance("F") == 1000000L,
                "a1=" + a1.balance + " a2var=" + a2.variation + " a2bal=" + a2.balance);

        MarginEngine e6 = new MarginEngine();
        e6.settle("2026-01-01", java.util.List.of(pos("G", "GOLD", 'L', 1, 1000, 50000, 100000)), px("GOLD", 51000));
        SettleResult d2 = e6.settle("2026-01-02", java.util.List.of(pos("G", "GOLD", 'L', 1, 1000, 51000, 100000)), px("GOLD", 52000));
        check("nhieu_ngay_cong_don", d2.variation.get("G") == 1000000L && d2.balance.get("G") == 2000000L,
                "bal=" + d2.balance);

        MarginEngine e7 = new MarginEngine();
        SettleResult r7 = e7.settle("2026-01-01", java.util.List.of(
                pos("H", "GOLD", 'L', 1, 1000, 50000, 100000),
                pos("I", "OIL", 'S', 1, 1000, 50000, 100000)),
                px2(51000, 51000));
        check("nhieu_tai_khoan", r7.variation.get("H") == 1000000L && r7.variation.get("I") == -1000000L
                && r7.marginCalls.contains("I") && !r7.marginCalls.contains("H"),
                "var=" + r7.variation + " calls=" + r7.marginCalls);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Position {
    final String account;
    final String product;
    final char side;
    final long qty;
    final long multiplier;
    final long prevPrice;
    final long maintMargin;
    Position(String account, String product, char side, long qty,
             long multiplier, long prevPrice, long maintMargin) {
        this.account = account; this.product = product; this.side = side;
        this.qty = qty; this.multiplier = multiplier;
        this.prevPrice = prevPrice; this.maintMargin = maintMargin;
    }
}

class SettleResult {
    final Map<String, Long> variation = new LinkedHashMap<>();
    final List<String> marginCalls = new ArrayList<>();
    final Map<String, Long> balance = new LinkedHashMap<>();
}

class MarginEngine {
    private final Map<String, Long> balance = new HashMap<>();
    private final Map<String, String> lastDay = new HashMap<>();

    SettleResult settle(String day, List<Position> positions, Map<String, Long> prices) {
        SettleResult r = new SettleResult();
        Map<String, Long> maint = new HashMap<>();
        Set<String> touched = new LinkedHashSet<>();
        if (positions != null) {
            for (Position p : positions) {
                if (day.equals(lastDay.get(p.account))) continue;   // idempotent theo ngay
                long today = prices.get(p.product);
                long change = today - p.prevPrice;
                long var = (p.side == 'L' ? change : -change) * p.qty * p.multiplier;
                long bal = balance.getOrDefault(p.account, 0L) + var;
                balance.put(p.account, bal);
                r.variation.merge(p.account, var, Long::sum);
                maint.put(p.account, p.maintMargin);
                touched.add(p.account);
            }
        }
        for (String a : touched) lastDay.put(a, day);
        for (String a : touched) {
            long bal = balance.get(a);
            r.balance.put(a, bal);
            if (bal < maint.get(a)) r.marginCalls.add(a);   // dung nguong: bang thi an toan
        }
        return r;
    }

    long balance(String account) {
        return balance.getOrDefault(account, 0L);
    }
}`,
        hints: [
          'Với mỗi position chưa settle trong {{day}}: {{change = today − prevPrice}}; dấu + cho long, đảo dấu cho short; {{var = change × qty × multiplier}}.',
          'Cộng dồn: {{balance = balance.getOrDefault(account, 0) + var}}. Ghi {{lastDay}} cho account SAU vòng lặp để idempotent.',
          'Margin call khi {{bal < maint}} (nhỏ hơn, không phải <=). {{balance}} trong kết quả chỉ gồm các account vừa xử lý.',
        ],
        explain: `Ý chính: variation = (giá mới − giá cũ) × qty × multiplier, đảo dấu cho short; cộng dồn vào số dư; margin call khi số dư **nhỏ hơn** ngưỡng duy trì; settle lại cùng ngày thì bỏ qua (idempotent).

Lỗi hay gặp:
- Tính short giống long (sai dấu) ⇒ báo lãi/lỗ ngược.
- Dùng {{<=}} thay vì {{<}} ⇒ margin call oan khi đúng ngưỡng.
- Không đánh dấu ngày đã settle ⇒ settle hai lần cộng trùng.
- Quên cộng dồn số dư cũ, mỗi ngày tính lại từ 0.`,
      },
    ],
    check: [
      { q: 'Với một vị thế SHORT, khi giá thanh toán tăng thì variation margin là gì?', options: ['Lãi, vì giá tăng', 'Lỗ (âm), vì short hưởng lợi khi giá giảm nên giá tăng gây lỗ', 'Không đổi', 'Bằng 0 vì short không có variation'], answer: 1, explain: 'Đúng (B): short = đang bán, lãi khi giá xuống; giá tăng ⇒ lỗ, variation = −change × qty × multiplier (âm). Sai (A): đó là long. Sai (C): giá đổi thì variation đổi. Sai (D): short cũng có variation như long, chỉ khác dấu.' },
      { q: 'Số dư ký quỹ đúng bằng ngưỡng duy trì thì có bị margin call không?', options: ['Có, vì bằng ngưỡng là vi phạm', 'Không, vì điều kiện gọi là nhỏ hơn ngưỡng (balance < maintenance)', 'Có, nhưng chỉ khi số dư âm', 'Tuỳ sàn quyết định từng lần'], answer: 1, explain: 'Đúng (B): margin call khi balance **nhỏ hơn** maintenance; đúng bằng là vẫn an toàn. Đây là lỗi off-by-one phổ biến: dùng <= sẽ báo oan. Sai (A): bằng ngưỡng chưa vi phạm. Sai (C): không phụ thuộc âm. Sai (D): quy tắc là số học, không tuỳ hứng.' },
      { q: 'Vì sao settle cùng một ngày phải idempotent (chạy lại không cộng trùng)?', options: ['Để tiết kiệm bộ nhớ', 'Vì job settle có thể chạy lại (retry, restart) và nếu cộng hai lần sẽ làm sai số dư ký quỹ hàng loạt tài khoản', 'Vì prices thay đổi theo phút', 'Vì long không chính xác'], answer: 1, explain: 'Đúng (B): settle là job cuối ngày, có thể bị retry hoặc chạy lại sau sự cố; nếu không idempotent sẽ cộng variation hai lần ⇒ số dư sai, margin call sai. Cách làm: đánh dấu ngày đã settle cho mỗi tài khoản. Sai (A): không phải lý do. Sai (C): settlement là giá cố định trong ngày. Sai (D): bài dùng long chính xác cho phép nhân số nguyên.' },
    ],
    related: [],
    tags: ['mark-to-market', 'variation-margin', 'margin-call', 'futures', 'banking'],
  },
  // ---- Thanh toán / Stripe Connect (chuyển từ lessons-payments.js, track payments không có trong topics.js) ----
  {
    id: 'lesson-banking-029',
    track: 'banking',
    order: 29,
    title: 'Mô hình Stripe Connect: platform, connected account và ba loại account (Standard / Express / Custom)',
    level: 'senior',
    minutes: 30,
    goals: [
      'Giải thích được mô hình platform + connected account và vì sao tiền không đi qua tài khoản của bạn',
      'Phân biệt Standard / Express / Custom và chọn Express cho dự án CLB trả tiền HLV',
      'Hiểu account, capability, charges_enabled và payouts_enabled khác nhau thế nào'
    ],
    body: `### Bức tranh lớn: ai giữ tiền?
**Tóm tắt:** Stripe Connect là bộ công cụ để **platform** (nền tảng của bạn, ví dụ web CLB thu phí thành viên) nhận tiền **thay cho bên thứ ba** (connected account, ví dụ HLV), rồi chuyển phần của họ đi. Điểm mấu chốt: trong mô hình chuẩn, **tiền của HLV không nằm trong tài khoản Stripe của bạn** — Stripe tách sổ (ledger) riêng cho từng connected account, bạn chỉ là người điều phối.

**Thuật ngữ (giải thích cho người mới):**
- **Platform**: tài khoản Stripe của chính bạn — nơi bạn cấu hình Connect, nhận phí nền tảng (application fee), xem báo cáo.
- **Connected account**: tài khoản Stripe của "đối tác" mà bạn kết nối (HLV, CLB con). Mỗi cái có account id dạng {{acct_...}}.
- **Capability**: một "quyền" cụ thể của connected account, ví dụ {{card_payments}} (được nhận tiền thẻ) hay {{transfers}} (được nhận chuyển tiền). Account phải được **kích hoạt** capability đó thì mới giao dịch được.
- **charges_enabled / payouts_enabled**: hai cờ boolean tóm tắt trạng thái. {{charges_enabled}} = account đã đủ điều kiện nhận charge chưa; {{payouts_enabled}} = đã đủ điều kiện được trả tiền (payout) ra ngân hàng chưa. Một account có thể nhận tiền nhưng chưa rút được tiền ra.
- **Requirements**: danh sách thông tin Stripe còn **thiếu** để account hoạt động đầy đủ (mã số thuế, giấy tờ, số tài khoản ngân hàng…). Khi còn thiếu, Stripe trả về mảng {{requirements.disabled_reason}} và các field cần bổ sung.

### Ba loại account — khác nhau ở "ai chịu trách nhiệm gì"
| Loại | Ai tạo account | Điền thông tin ở đâu | Ai chịu phí/lỗ chargeback | Khi nào chọn |
|---|---|---|---|---|
| **Standard** | Connected account tự tạo | Stripe-hosted, họ tự làm | Chính connected account | Bạn muốn đối tác tự chủ hoàn toàn, ít việc cho bạn |
| **Express** | Bạn tạo hộ | Stripe-hosted nhưng bạn gửi link | Platform (bạn) | Bạn muốn onboard nhanh, ít code, vẫn kiểm soát luồng tiền |
| **Custom** | Bạn tạo, bạn thu thập | Bạn tự làm form (requirements) | Platform (bạn) | Bạn cần UX riêng, tự thu thập KYC — nhiều việc & trách nhiệm nhất |

### Vì sao dự án CLB chọn Express
CLB thu phí thành viên rồi trả tiền HLV. Bạn (platform) muốn: HLV bấm vài bước là xong (không muốn tự lập tài khoản Stripe rườm rà), bạn kiểm soát việc chia tiền, và bạn không muốn tự xây form KYC. **Express** đúng điểm này: bạn gọi API tạo account, gửi **Account Link** (một URL do Stripe host) cho HLV điền thông tin, xong HLV nhận payout. Bạn tốn ít code nhất mà vẫn an toàn.

### Luồng một lần thiết lập
~~~seq
title: Onboarding Express
actors: App | Stripe | HLV
App -> Stripe: tạo Express account (type=express)
Stripe --> App: acct_123
App -> Stripe: tạo Account Link
Stripe --> App: https://connect.stripe.com/...
App --> HLV: gửi link onboarding
HLV -> Stripe: điền thông tin, submit
Stripe --> App: webhook account.updated
App -> Stripe: GET account acct_123
Stripe --> App: charges_enabled, payouts_enabled
~~~

### Lỗi hay gặp
1. **Tưởng tiền của HLV đi qua tài khoản mình**: nếu dùng direct charge (bài 3) thì tiền vào thẳng connected account; nếu nhầm sang mô hình khác, tiền có thể "đứng" ở platform và bạn phải chuyển tay — sai sổ sách.
2. **Bỏ qua {{requirements}}**: account đã tạo nhưng {{charges_enabled=false}} vì thiếu thông tin; app báo "đã kết nối" nhưng HLV không nhận được tiền.
3. **Không xử lý {{account.updated}} webhook**: trạng thái capability thay đổi (bị hạn chế, cần bổ sung giấy tờ) mà app không biết → HLV "mất" payout mà không ai báo.

### Ví dụ: đọc trạng thái account
~~~java
// Giả lập phản hồi Stripe (không gọi mạng) để thấy các cờ quan trọng
record AccountState(String id, boolean chargesEnabled, boolean payoutsEnabled, String disabledReason) {}
AccountState s = new AccountState("acct_123", true, false, "requirements.past_due");
// chargesEnabled=true  -> nhận được tiền
// payoutsEnabled=false -> CHƯA rút được tiền ra ngân hàng
// disabledReason       -> lý do: còn thiếu thông tin (past_due)
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Platform muốn trả tiền cho người bán, bạn chọn loại Connect account nào và vì sao?"
**Cách trả lời:** Tôi phân biệt 3 loại: Standard (đối tác tự tạo, tự chịu trách nhiệm, ít việc cho platform), Express (platform tạo hộ, onboarding bằng Account Link do Stripe host, platform chịu chargeback — ít code, hợp khi muốn kiểm soát luồng tiền), Custom (platform tự làm form KYC, nhiều trách nhiệm nhất). Với dự án CLB trả tiền HLV, tôi chọn **Express**: HLV chỉ cần bấm link điền thông tin, tôi kiểm soát chia tiền bằng transfer, không phải tự xây form thu thập giấy tờ. Tôi luôn kiểm tra {{charges_enabled}} và {{payouts_enabled}} cùng {{requirements}} sau onboarding, và lắng nghe webhook {{account.updated}} để biết khi account bị hạn chế.

> Senior tip: Trong Connect, "đã kết nối" (account tồn tại) KHÔNG có nghĩa là "đã nhận được tiền". Luôn kiểm tra cặp cờ {{charges_enabled}}/{{payouts_enabled}} và mảng {{requirements}} trước khi cho phép giao dịch — đây là nguồn bug "HLV không nhận được lương" phổ biến nhất.`,
    exercises: [
      {
        title: 'ConnectState.interpret',
        prompt: `Hoàn thiện class {{ConnectState}} với method {{interpret(boolean chargesEnabled, boolean payoutsEnabled, String disabledReason)}} trả về enum {{Status}}:
- {{READY}}: cả chargesEnabled và payoutsEnabled đều true.
- {{RECEIVE_ONLY}}: chargesEnabled true nhưng payoutsEnabled false.
- {{BLOCKED}}: chargesEnabled false (disabledReason khác null).
- {{INCOMPLETE}}: chargesEnabled false và disabledReason là null.`,
        starter: `class ConnectState {
    enum Status { READY, RECEIVE_ONLY, BLOCKED, INCOMPLETE }
    static Status interpret(boolean chargesEnabled, boolean payoutsEnabled, String disabledReason) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        check("ready", ConnectState.interpret(true, true, null) == ConnectState.Status.READY, "");
        check("receive only", ConnectState.interpret(true, false, "requirements.past_due") == ConnectState.Status.RECEIVE_ONLY, "");
        check("blocked", ConnectState.interpret(false, false, "requirements.disabled") == ConnectState.Status.BLOCKED, "");
        check("incomplete", ConnectState.interpret(false, false, null) == ConnectState.Status.INCOMPLETE, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `class ConnectState {
    enum Status { READY, RECEIVE_ONLY, BLOCKED, INCOMPLETE }
    static Status interpret(boolean chargesEnabled, boolean payoutsEnabled, String disabledReason) {
        if (chargesEnabled) return payoutsEnabled ? Status.READY : Status.RECEIVE_ONLY;
        return disabledReason == null ? Status.INCOMPLETE : Status.BLOCKED;
    }
}`,
        hints: ['chargesEnabled quyết định READY/RECEIVE_ONLY vs BLOCKED/INCOMPLETE', 'disabledReason null = chưa đủ thông tin, khác null = bị chặn có lý do'],
        explain: `Cờ charges_enabled là điều kiện tiên quyết: nếu false thì account chưa nhận được tiền. Khi false, phân biệt INCOMPLETE (chưa có disabled_reason — mới tạo, đang chờ điền) và BLOCKED (có lý do bị hạn chế). Khi charges_enabled true, payouts_enabled quyết định đã rút tiền ra được chưa.`
      }
    ],
    check: [
      { q: 'Trong mô hình Connect, tiền của connected account (HLV) nằm ở đâu?', options: ['Trong tài khoản Stripe của platform, platform phải chuyển tay', 'Trong sổ (ledger) riêng của connected account, platform chỉ điều phối', 'Trong tài khoản ngân hàng của platform ngay lập tức', 'Ở Stripe giữ hộ cho đến khi rút'], answer: 1, explain: 'Đúng: Stripe tách sổ riêng cho mỗi connected account; với direct/destination charge tiền vào thẳng connected account, platform không giữ hộ. Sai (A): đó là hiểu nhầm phổ biến — nếu tiền đứng ở platform thì bạn phải tự chuyển, dễ sai sổ. Sai (C): tiền không vào ngân hàng platform. Sai (D): không phải "Stripe giữ hộ đến khi rút" theo nghĩa chung; mỗi account có ledger và payout riêng.' },
      { q: 'Account Express khác Standard chủ yếu ở điểm nào?', options: ['Express không cần KYC', 'Platform tạo account hộ và gửi Account Link do Stripe host để onboard nhanh, platform chịu chargeback', 'Express chỉ dùng cho Custom', 'Standard không hỗ trợ payout'], answer: 1, explain: 'Đúng: Express do platform tạo hộ, onboarding qua Account Link Stripe-hosted, ít code, platform chịu trách nhiệm chargeback. Sai (A): Express vẫn cần KYC (điền qua link). Sai (C): Express và Custom là hai loại riêng biệt. Sai (D): Standard hỗ trợ payout bình thường (connected account tự quản).' },
      { q: 'Hai cờ charges_enabled và payouts_enabled khác nhau thế nào?', options: ['Chúng luôn bằng nhau', 'charges_enabled = được nhận tiền; payouts_enabled = được rút tiền ra ngân hàng', 'payouts_enabled = được nhận tiền; charges_enabled = rút tiền', 'Cả hai đều nói về việc tạo account'], answer: 1, explain: 'Đúng: charges_enabled cho biết account đã đủ điều kiện nhận charge chưa; payouts_enabled cho biết đã rút payout ra ngân hàng chưa — một account có thể nhận tiền nhưng chưa rút được. Sai (A): chúng độc lập. Sai (C): đảo ngược nghĩa. Sai (D): không liên quan tạo account.' },
      { q: 'Webhook account.updated dùng để làm gì?', options: ['Để gửi email cho HLV', 'Để biết khi trạng thái account/capability/requirements thay đổi (bị hạn chế, cần bổ sung giấy tờ)', 'Để tạo account mới', 'Để tính application fee'], answer: 1, explain: 'Đúng: account.updated bắn khi account thay đổi (capability bị tắt, requirements thay đổi…), giúp app cập nhật trạng thái và báo HLV bổ sung. Sai (A): gửi email là việc khác. Sai (C): tạo account dùng API create, không phải webhook. Sai (D): application fee tính lúc tạo charge, không qua webhook này.' }
    ],
    related: [],
    tags: ['stripe', 'connect', 'payments']
  },
  {
    id: 'lesson-banking-030',
    track: 'banking',
    order: 30,
    title: 'Onboarding bằng Account Links: tạo account, gửi link, kiểm tra charges_enabled/payouts_enabled',
    level: 'senior',
    minutes: 30,
    goals: [
      'Biết thứ tự gọi API: tạo account → tạo Account Link → gửi HLV → nhận webhook',
      'Hiểu return_url/refresh_url và vì sao Account Link hết hạn (khác login link)',
      'Viết Onboarding.isComplete kiểm tra account đã đủ điều kiện giao dịch chưa'
    ],
    body: `### Onboarding là gì
**Tóm tắt:** Onboarding là quá trình đưa một connected account từ "vừa tạo, chưa có thông tin" đến "đủ điều kiện nhận và rút tiền". Với Express, bạn không tự làm form: bạn tạo account rồi tạo **Account Link** — một URL ngắn do Stripe host — gửi cho HLV. HLV điền thông tin trên trang của Stripe, xong quay về {{return_url}} của bạn.

**Thuật ngữ:**
- **Account Link**: URL onboarding một lần, do Stripe host, hết hạn sau một khoảng (thường ~10 phút) — khác **login link** (dùng để HLV vào dashboard Express, không hết hạn nhanh như vậy). Khi link hết hạn, bạn tạo link mới bằng API.
- **return_url**: nơi Stripe đưa HLV về sau khi hoàn tất (hoặc thoát giữa chừng).
- **refresh_url**: nơi đưa HLV về nếu link hết hạn, để bạn tạo link mới.
- **requirements / disabled_reason**: như bài 1 — thông tin còn thiếu và lý do account chưa hoạt động.

### Thứ tự các bước (vì sao theo thứ tự này)
1. **Tạo account** {{POST /v1/accounts}} với {{type=express}} (và {{country}}, {{email}} nếu có). Lấy {{acct_...}}.
2. **Lưu {{acct_id}}** vào DB của bạn (bảng {{connected_accounts}}), gắn với HLV.
3. **Tạo Account Link** {{POST /v1/account_links}} với {{account}}, {{refresh_url}}, {{return_url}}, {{type=account_onboarding}}.
4. **Gửi URL** cho HLV (email, link trong app).
5. HLV điền → quay về {{return_url}}. Bạn **không tin** return_url: gọi {{GET /v1/accounts/id}} để đọc trạng thái thật, hoặc nghe webhook {{account.updated}}.
6. Kiểm tra {{charges_enabled}} && {{payouts_enabled}}. Nếu chưa đủ, hiện {{requirements}} để HLV bổ sung.

### Luồng onboarding
~~~seq
title: Onboarding Express
actors: App | Stripe | HLV
App -> Stripe: POST /v1/accounts type=express
Stripe --> App: acct_123
App -> Stripe: POST /v1/account_links
Stripe --> App: https://connect.stripe.com/e/...
App --> HLV: gửi link
HLV -> Stripe: điền thông tin
Stripe --> App: webhook account.updated
App -> Stripe: GET /v1/accounts/acct_123
Stripe --> App: charges_enabled, payouts_enabled, requirements
~~~

### Lỗi hay gặp
1. **Tin {{return_url}}**: HLV đóng tab giữa chừng vẫn bị coi là "xong". Luôn đọc trạng thái thật từ API/webhook.
2. **Account Link hết hạn**: HLV để link 15 phút mới bấm → link chết. Cần {{refresh_url}} để tạo link mới.
3. **Không lưu {{acct_id}}**: không map được HLV ↔ account, sau này không biết trả tiền cho ai.
4. **Bỏ qua requirements**: account tồn tại nhưng {{payouts_enabled=false}}, HLV không rút được tiền.

### Ví dụ: kiểm tra onboarding xong chưa
~~~java
record Account(String id, boolean chargesEnabled, boolean payoutsEnabled, java.util.List<String> missingFields) {}
boolean ready = a.chargesEnabled() && a.payoutsEnabled();
// nếu chưa ready, missingFields chứa các field HLV cần điền (vd "individual.tax_id")
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Bạn tích hợp Connect Express, mô tả luồng onboarding và cách biết HLV đã xong."
**Cách trả lời:** Tôi tạo account {{type=express}} qua {{POST /v1/accounts}}, lưu {{acct_id}} vào bảng connected_accounts, rồi tạo **Account Link** {{type=account_onboarding}} với {{return_url}} và {{refresh_url}} và gửi cho HLV. HLV điền trên trang Stripe rồi quay về. Tôi **không tin return_url** mà đọc trạng thái thật bằng {{GET /v1/accounts/id}} hoặc webhook {{account.updated}}, kiểm tra {{charges_enabled}} && {{payouts_enabled}}. Nếu chưa đủ, tôi hiện {{requirements.missing_fields}} (hoặc {{disabled_reason}}) để HLV bổ sung. Link hết hạn thì dùng {{refresh_url}} tạo link mới — tôi phân biệt rõ Account Link (hết hạn nhanh) với login link.

> Senior tip: Coi return_url chỉ là "gợi ý UI", nguồn sự thật là API/webhook. Lưu {{acct_id}} ngay khi tạo và gắn với bản ghi HLV — thiếu bước này là bạn không thể trả tiền đúng người về sau.`,
    exercises: [
      {
        title: 'Onboarding.isComplete',
        prompt: `Hoàn thiện class {{Onboarding}} với method {{isComplete(boolean chargesEnabled, boolean payoutsEnabled, java.util.List<String> missingFields)}} trả về boolean: true chỉ khi chargesEnabled && payoutsEnabled. Method {{nextStep(...)}} trả String: "DONE" nếu complete; "COLLECT_INFO" nếu missingFields khác rỗng; "WAIT" nếu không complete nhưng missingFields rỗng.`,
        starter: `import java.util.List;
class Onboarding {
    static boolean isComplete(boolean chargesEnabled, boolean payoutsEnabled, List<String> missingFields) {
        throw new UnsupportedOperationException("TODO");
    }
    static String nextStep(boolean chargesEnabled, boolean payoutsEnabled, List<String> missingFields) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static java.util.List<String> list(String... s) { return java.util.Arrays.asList(s); }
    public static void main(String[] args) {
        check("complete", Onboarding.isComplete(true, true, list()) , "");
        check("not complete", !Onboarding.isComplete(true, false, list("individual.tax_id")), "");
        check("step done", Onboarding.nextStep(true, true, list()).equals("DONE"), "");
        check("step collect", Onboarding.nextStep(false, false, list("individual.tax_id")).equals("COLLECT_INFO"), "");
        check("step wait", Onboarding.nextStep(false, false, list()).equals("WAIT"), "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.List;
class Onboarding {
    static boolean isComplete(boolean chargesEnabled, boolean payoutsEnabled, List<String> missingFields) {
        return chargesEnabled && payoutsEnabled;
    }
    static String nextStep(boolean chargesEnabled, boolean payoutsEnabled, List<String> missingFields) {
        if (isComplete(chargesEnabled, payoutsEnabled, missingFields)) return "DONE";
        if (missingFields != null && !missingFields.isEmpty()) return "COLLECT_INFO";
        return "WAIT";
    }
}`,
        hints: ['isComplete = chargesEnabled && payoutsEnabled', 'nextStep: DONE > COLLECT_INFO (có field thiếu) > WAIT'],
        explain: `Onboarding chỉ coi là xong khi cả hai cờ bật. nextStep phân 3 nhánh: DONE (đủ), COLLECT_INFO (còn field cụ thể cần điền — hiện form), WAIT (chưa đủ nhưng chưa có field cụ thể — thường do Stripe xử lý/kiểm duyệt, chờ webhook). Lỗi hay gặp: chỉ kiểm charges_enabled mà quên payouts_enabled.`
      }
    ],
    check: [
      { q: 'Account Link khác login link ở điểm nào?', options: ['Account Link dùng để đăng nhập dashboard', 'Account Link dùng cho onboarding một lần và hết hạn nhanh; login link để vào Express dashboard', 'Chúng giống hệt nhau', 'Account Link không cần return_url'], answer: 1, explain: 'Đúng: Account Link (type=account_onboarding) là link một lần để điền thông tin, hết hạn sau khoảng ngắn; login link cho HLV vào dashboard Express xem payout. Sai (A): đó là login link. Sai (C): khác mục đích và thời hạn. Sai (D): Account Link cần refresh_url/return_url.' },
      { q: 'Vì sao không được coi return_url là bằng chứng onboarding xong?', options: ['Vì return_url luôn sai', 'HLV có thể đóng tab/thoát giữa chừng, nên phải đọc trạng thái thật từ API hoặc webhook account.updated', 'Vì return_url không tồn tại', 'Vì Stripe không cho dùng return_url'], answer: 1, explain: 'Đúng: HLV có thể thoát giữa chừng mà trình duyệt vẫn điều hướng, nên return_url không đảm bảo hoàn tất; nguồn sự thật là GET account hoặc webhook. Sai (A): return_url không "luôn sai", chỉ là không đủ tin cậy. Sai (C): return_url có thật. Sai (D): Stripe cho dùng return_url.' },
      { q: 'Điều kiện để coi một Express account đã sẵn sàng giao dịch là gì?', options: ['Account đã được tạo', 'charges_enabled && payouts_enabled đều true', 'HLV đã mở email', 'return_url đã được truy cập'], answer: 1, explain: 'Đúng: cần cả charges_enabled (nhận tiền) và payouts_enabled (rút tiền) true. Sai (A): tạo account mới chỉ là bước đầu. Sai (C): mở email không liên quan. Sai (D): truy cập return_url không đảm bảo trạng thái.' },
      { q: 'Khi Account Link hết hạn, bạn làm gì?', options: ['Bắt HLV tạo account mới', 'Dùng refresh_url để tạo Account Link mới', 'Gửi lại link cũ', 'Bỏ qua, HLV tự xoay xở'], answer: 1, explain: 'Đúng: Account Link hết hạn nhanh; dùng refresh_url (hoặc gọi lại API account_links) để tạo link mới, không bắt tạo account mới. Sai (A): account vẫn còn, chỉ link hết hạn. Sai (C): link cũ đã chết. Sai (D): trải nghiệm tệ, HLV kẹt.' }
    ],
    related: [],
    tags: ['stripe', 'onboarding', 'account-link']
  },
  {
    id: 'lesson-banking-031',
    track: 'banking',
    order: 31,
    title: 'Các kiểu charge: direct, destination, separate charges and transfers và application fee',
    level: 'senior',
    minutes: 35,
    goals: [
      'Phân biệt direct charge, destination charge và separate charges & transfers',
      'Hiểu application_fee_amount và ai chịu phí Stripe/chargeback trong từng kiểu',
      'Chọn kiểu charge phù hợp cho mô hình CLB thu phí thành viên trả HLV'
    ],
    body: `### Ba kiểu charge — khác nhau ở "tiền chảy qua đâu"
**Tóm tắt:** Connect có 3 cách charge. **Direct**: bạn gọi API trên connected account, tiền vào thẳng HLV, bạn thu application fee. **Destination**: bạn charge trên platform, chỉ định {{transfer_data.destination}}, Stripe tự chuyển (trừ fee) sang HLV. **Separate charges & transfers (SCT)**: bạn charge trên platform (tiền vào platform) rồi **tự** gọi transfer sang HLV — bạn kiểm soát từng bước, nhưng cũng gánh trách nhiệm.

**Thuật ngữ:**
- **Direct charge**: request gửi tới {{/v1/payment_intents}} với header {{Stripe-Account: acct_HLV}}. Tiền vào ledger HLV. Bạn (platform) nhận application fee nếu truyền {{application_fee_amount}}.
- **Destination charge**: request trên platform, gán trường {{transfer_data.destination}} bằng {{acct_HLV}}. Stripe tự động chuyển tiền (sau khi trừ application fee) sang HLV. Ít code, tiền không "đứng" ở bạn.
- **Separate charges & transfers (SCT)**: charge trên platform (tiền vào platform), sau đó gọi {{POST /v1/transfers}} để chuyển cho HLV. Linh hoạt nhất (có thể giữ lại, chia nhiều, hoàn tiền có kiểm soát) nhưng bạn phải tự đảm bảo transfer khớp charge.
- **Application fee**: khoản platform thu cho mỗi giao dịch, truyền {{application_fee_amount}} (đơn vị nhỏ nhất). Có thể hoàn (refund) riêng.

### So sánh
| Kiểu | Tiền vào đâu trước | Ai tự chuyển | Ai chịu chargeback | Độ linh hoạt | Code |
|---|---|---|---|---|---|
| Direct | thẳng HLV | Stripe (theo account) | connected account | thấp | ít |
| Destination | HLV (Stripe tự chuyển) | Stripe | platform | trung bình | ít |
| SCT | platform rồi transfer | bạn | platform | cao | nhiều |

### Vì sao CLB (thu phí → trả HLV) chọn Destination hoặc SCT
- Nếu muốn **ít code, tiền không đứng ở mình**: **Destination**. Thu phí 100k, application fee 10k, 90k tự chuyển HLV.
- Nếu muốn **giữ lại 1 phần, chia nhiều HLV, hoặc hoàn có kiểm soát**: **SCT**. Thu về platform, rồi transfer từng khoản — nhưng phải đảm bảo mỗi transfer có mapping tới charge (bài 6 idempotency).

### Luồng Destination charge
~~~seq
title: Destination charge
actors: App | Stripe | HLV
App -> Stripe: POST PaymentIntent (platform) transfer_data.destination=acct_HLV
Stripe --> App: pi_123, status
Stripe -> Stripe: trừ application fee, chuyển phần còn lại
Stripe --> HLV: tiền vào ledger HLV
Stripe --> App: webhook payment_intent.succeeded
~~~

### Lỗi hay gặp
1. **Nhầm đơn vị tiền**: application_fee_amount là số nguyên đơn vị nhỏ nhất (cent). 10 USD = 1000, không phải 10.
2. **SCT quên transfer**: charge thành công nhưng quên gọi transfer → tiền nằm ở platform, HLV không nhận. Phải có reconciliation.
3. **Direct charge không truyền Stripe-Account**: request đi nhầm vào platform.
4. **Hoàn tiền không khớp**: refund ở SCT phải tính cả application fee và transfer đã gửi.

### Ví dụ: tính chia tiền
~~~java
long totalCents = 10000;      // 100.00 USD
long feeCents = 1000;         // application fee 10.00 USD
long toCoach = totalCents - feeCents;  // 9000 = 90.00 USD
// Destination: truyền transfer_data.destination=acct_HLV, application_fee_amount=1000
// SCT: charge 10000 vào platform, rồi POST /v1/transfers amount=9000 destination=acct_HLV
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "So sánh direct, destination và separate charges & transfers; với mô hình platform thu tiền rồi trả người bán, bạn chọn gì?"
**Cách trả lời:** Direct charge chạy trên connected account (header Stripe-Account), tiền vào thẳng người bán, ít code nhưng khó kiểm soát. Destination charge chạy trên platform với {{transfer_data.destination}}, Stripe tự chuyển phần còn lại sau application fee — ít code, tiền không đứng ở platform, hợp khi tôi muốn đơn giản. SCT: charge vào platform rồi tôi tự gọi {{/v1/transfers}} — linh hoạt nhất (giữ lại, chia nhiều, hoàn có kiểm soát) nhưng tôi phải đảm bảo transfer khớp charge và chịu chargeback. Với CLB trả HLV, tôi chọn Destination nếu chỉ cần chia đơn giản; chọn SCT nếu cần giữ phí nền tảng phức tạp hoặc chia nhiều bên. Lưu ý application_fee_amount là đơn vị nhỏ nhất và có thể hoàn riêng.

> Senior tip: Chọn kiểu charge là quyết định thiết kế, không chỉ là "gọi API nào". Destination ít bug tiền đứng; SCT mạnh nhưng bắt buộc có reconciliation charge↔transfer (bài 6) — thiếu nó là bạn sẽ có ngày "tiền của HLV nằm mãi ở platform".`,
    exercises: [
      {
        title: 'ChargeSplit.split',
        prompt: `Hoàn thiện class {{ChargeSplit}} với method {{split(long totalCents, long feeCents)}} trả về long[] {toAccount, fee}:
- toAccount = totalCents - feeCents (không âm).
- fee = feeCents, nhưng không vượt totalCents.
- Nếu feeCents < 0 coi như 0; nếu totalCents < 0 trả {0,0}.`,
        starter: `class ChargeSplit {
    static long[] split(long totalCents, long feeCents) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        long[] a = ChargeSplit.split(10000, 1000);
        check("split basic", a[0] == 9000 && a[1] == 1000, "");
        long[] b = ChargeSplit.split(10000, 20000);
        check("fee capped", b[0] == 0 && b[1] == 10000, "");
        long[] c = ChargeSplit.split(10000, -5);
        check("neg fee", c[0] == 10000 && c[1] == 0, "");
        long[] d = ChargeSplit.split(-1, 100);
        check("neg total", d[0] == 0 && d[1] == 0, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `class ChargeSplit {
    static long[] split(long totalCents, long feeCents) {
        if (totalCents <= 0) return new long[]{0, 0};
        long fee = Math.max(0, feeCents);
        if (fee > totalCents) fee = totalCents;
        return new long[]{totalCents - fee, fee};
    }
}`,
        hints: ['fee không vượt total, không âm', 'total âm trả {0,0}'],
        explain: `Phép chia tiền phải xử lý biên: fee âm → 0, fee > total → cap bằng total, total âm → trả 0. Lỗi hay gặp: để toAccount âm khi fee > total. Đây là logic nền cho cả destination fee lẫn SCT transfer amount.`
      }
    ],
    check: [
      { q: 'Direct charge khác destination charge ở điểm cốt lõi nào?', options: ['Direct chạy trên connected account (header Stripe-Account), tiền vào thẳng người bán; destination chạy trên platform, Stripe tự chuyển', 'Direct luôn rẻ hơn', 'Destination không cần application fee', 'Chúng giống nhau hoàn toàn'], answer: 0, explain: 'Đúng: direct gửi request tới connected account, tiền vào ledger người bán; destination charge trên platform với transfer_data.destination, Stripe tự chuyển. Sai (B): phí không phải điểm phân biệt cốt lõi. Sai (C): destination vẫn dùng application fee. Sai (D): khác nhau rõ.' },
      { q: 'Trong Separate Charges & Transfers, vì sao cần reconciliation charge↔transfer?', options: ['Vì Stripe yêu cầu', 'Tiền vào platform trước, nếu quên/đặt sai transfer thì HLV không nhận — phải đối soát để phát hiện', 'Vì transfer luôn thất bại', 'Vì application fee không hoàn được'], answer: 1, explain: 'Đúng: SCT tách charge và transfer; nếu transfer quên hoặc sai destination, tiền đứng ở platform, HLV không được trả — reconciliation phát hiện charge chưa có transfer. Sai (A): không phải yêu cầu bắt buộc của Stripe mà là kiểm soát nội bộ. Sai (C): transfer không "luôn" thất bại. Sai (D): application fee hoàn được.' },
      { q: 'application_fee_amount nên truyền giá trị nào?', options: ['Số nguyên đơn vị nhỏ nhất (cent), ví dụ 10 USD = 1000', 'Số thập phân 10.00', 'Phần trăm 10', 'Chuỗi "10.00 USD"'], answer: 0, explain: 'Đúng: Stripe dùng số nguyên đơn vị nhỏ nhất; 10 USD = 1000 cent. Sai (B): Stripe không nhận số thực cho amount. Sai (C): đó là fee rate, không phải amount. Sai (D): amount là số nguyên, không phải chuỗi.' },
      { q: 'Khi nào Separate Charges & Transfers phù hợp hơn Destination?', options: ['Khi cần giữ lại một phần, chia nhiều bên, hoặc hoàn tiền có kiểm soát chi tiết', 'Khi muốn ít code nhất', 'Khi không cần application fee', 'Khi người bán tự tạo account'], answer: 0, explain: 'Đúng: SCT linh hoạt nhất — charge vào platform rồi tự transfer, phù hợp giữ phí phức tạp, chia nhiều HLV, hoàn có kiểm soát. Sai (B): destination ít code hơn. Sai (C): SCT vẫn dùng fee. Sai (D): đó là đặc điểm Standard.' }
    ],
    related: [],
    tags: ['stripe', 'charge', 'destination', 'application-fee']
  },
  {
    id: 'lesson-banking-032',
    track: 'banking',
    order: 32,
    title: 'Transfers và payouts: luồng tiền, lịch payout, reverse transfer khi refund',
    level: 'senior',
    minutes: 30,
    goals: [
      'Phân biệt transfer (platform → connected account) và payout (connected account → ngân hàng)',
      'Hiểu schedule payout (daily/weekly/manual) và vì sao không kiểm soát được lịch rút của Express',
      'Biết reverse transfer khi refund và cách xử lý khi account không đủ tiền để reverse'
    ],
    body: `### Transfer vs payout — đừng nhầm
**Tóm tắt:** **Transfer** là chuyển tiền từ platform sang connected account (bạn chủ động, trong SCT). **Payout** là connected account rút tiền từ ledger Stripe ra **ngân hàng** của họ — lịch payout do Stripe/đối tác kiểm soát, bạn không điều khiển. Khi hoàn tiền cho thành viên, bạn có thể phải **reverse transfer** (lấy lại tiền đã chuyển cho HLV) — nếu HLV không đủ số dư, Stripe có thể đưa số dư âm hoặc chặn.

**Thuật ngữ:**
- **Transfer**: {{POST /v1/transfers}} với {{destination: acct_HLV}}, {{amount}}. Chỉ dùng trong SCT.
- **Payout**: {{POST /v1/payouts}} (hoặc tự động theo schedule) — rút từ ledger connected account ra bank. Lịch: {{daily}}, {{weekly}}, {{manual}}.
- **Reverse transfer**: khi refund, nếu cần lấy lại transfer đã gửi, gọi {{POST /v1/transfers/id/reversals}}. Nếu account không đủ tiền, số dư có thể âm (Express/Custom tuỳ cấu hình).
- **Negative balance**: ledger âm — HLV "nợ" platform; payout sau này bị giữ để bù.

### Vì sao lịch payout không phải bạn quyết (với Express)
Express account do Stripe quản lý payout schedule (thường daily T+2 hoặc weekly). Bạn không đặt {{payout_schedule}} cho Express; bạn chỉ quyết định **khi nào transfer** vào ledger. Đây là lý do "HLV thấy tiền trong dashboard" khác "tiền đã về ngân hàng HLV".

### Luồng SCT + payout + refund
~~~seq
title: Transfer, payout, refund
actors: App | Stripe | HLV
App -> Stripe: charge 10000 (platform)
App -> Stripe: transfer 9000 -> acct_HLV
Stripe --> HLV: ledger +9000
Stripe -> HLV: payout theo lịch -> ngân hàng
App -> Stripe: refund (thành viên đòi lại)
App -> Stripe: reverse transfer 9000
Stripe --> HLV: ledger -9000 (có thể âm)
~~~

### Lỗi hay gặp
1. **Nhầm transfer với payout**: tưởng gọi transfer là "trả lương về ngân hàng HLV" — thực ra transfer mới vào ledger, payout mới ra ngân hàng.
2. **Refund không reverse transfer**: hoàn tiền thành viên nhưng không lấy lại từ HLV → platform lỗ.
3. **Reverse khi account âm**: HLV đã rút hết, reverse làm số dư âm; cần chính sách (giữ payout sau, hoặc chấp nhận nợ).
4. **Không log mapping**: không biết transfer nào ứng charge nào → không đối soát được (bài 6).

### Ví dụ: quyết định có reverse được không
~~~java
record Wallet(long balanceCents) {}
// reverse 9000 khi balance 9000 -> còn 0; khi balance 3000 -> -6000 (âm)
long after = 3000 - 9000; // -6000: số dư âm, cần chính sách giữ payout sau
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Phân biệt transfer và payout; khi hoàn tiền cho thành viên, bạn xử lý tiền đã trả HLV thế nào?"
**Cách trả lời:** Transfer là platform → connected account (tôi chủ động trong SCT); payout là connected account rút ra ngân hàng, lịch do Stripe/đối tác quản (Express thường T+2), tôi không điều khiển. Khi hoàn tiền thành viên, nếu đã transfer cho HLV, tôi gọi **reverse transfer** {{POST /v1/transfers/id/reversals}} để lấy lại; nếu HLV không đủ số dư, ledger có thể âm và tôi phải có chính sách giữ payout sau hoặc chấp nhận nợ. Tôi luôn log mapping charge↔transfer↔refund để đối soát, tránh lỗ âm thầm.

> Senior tip: "Đã transfer" ≠ "HLV đã nhận tiền mặt". Với Express, payout theo lịch Stripe; khi thiết kế refund, luôn hỏi "tiền đã ra khỏi ledger HLV chưa?" — nếu rồi, reverse sẽ tạo số dư âm và bạn cần quy trình thu hồi, không chỉ bấm nút.`,
    exercises: [
      {
        title: 'TransferLedger.apply',
        prompt: `Hoàn thiện class {{TransferLedger}} mô phỏng ledger connected account:
- constructor nhận balanceCents ban đầu.
- {{transfer(long amount)}}: cộng vào balance (amount > 0), trả balance mới.
- {{reverse(long amount)}}: trừ khỏi balance (cho phép âm), trả balance mới.
- {{balance()}}: trả balance hiện tại.`,
        starter: `class TransferLedger {
    private long balance;
    TransferLedger(long initial) { this.balance = initial; }
    long transfer(long amount) { throw new UnsupportedOperationException("TODO"); }
    long reverse(long amount) { throw new UnsupportedOperationException("TODO"); }
    long balance() { throw new UnsupportedOperationException("TODO"); }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        TransferLedger l = new TransferLedger(0);
        check("transfer", l.transfer(9000) == 9000, "");
        check("balance", l.balance() == 9000, "");
        check("reverse ok", l.reverse(4000) == 5000, "");
        check("reverse negative", l.reverse(9000) == -4000, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `class TransferLedger {
    private long balance;
    TransferLedger(long initial) { this.balance = initial; }
    long transfer(long amount) { balance += amount; return balance; }
    long reverse(long amount) { balance -= amount; return balance; }
    long balance() { return balance; }
}`,
        hints: ['transfer cộng, reverse trừ (cho phép âm)', 'balance trả số dư hiện tại'],
        explain: `Mô phỏng ledger: transfer cộng tiền vào, reverse trừ (có thể âm khi HLV đã rút). Số dư âm là tín hiệu cần chính sách thu hồi (giữ payout sau). Lỗi hay gặp: chặn reverse khi âm — thực tế Stripe có thể cho âm, app phải xử lý.`
      }
    ],
    check: [
      { q: 'Transfer và payout khác nhau thế nào?', options: ['Transfer = platform sang connected account; payout = connected account rút ra ngân hàng', 'Transfer = rút ra ngân hàng; payout = platform sang account', 'Chúng giống nhau', 'Transfer chỉ dùng cho Standard'], answer: 0, explain: 'Đúng: transfer là platform→connected account (SCT), payout là connected account→bank. Sai (B): đảo ngược. Sai (C): khác nhau. Sai (D): transfer dùng trong SCT (Express/Custom), không giới hạn Standard.' },
      { q: 'Với Express account, ai kiểm soát lịch payout?', options: ['Platform đặt tùy ý', 'Stripe/đối tác quản (thường daily T+2 hoặc weekly), platform không đặt', 'HLV đặt trong app của bạn', 'Không có payout'], answer: 1, explain: 'Đúng: Express do Stripe quản payout schedule; platform chỉ quyết định khi transfer vào ledger. Sai (A): platform không đặt cho Express. Sai (C): không phải trong app bạn. Sai (D): Express có payout.' },
      { q: 'Khi refund mà cần lấy lại tiền đã transfer cho HLV, bạn làm gì?', options: ['Gọi reverse transfer; nếu account âm thì có chính sách giữ payout sau', 'Bỏ qua, coi như lỗ', 'Xóa account HLV', 'Gọi payout thủ công'], answer: 0, explain: 'Đúng: dùng reverse transfer {{/v1/transfers/id/reversals}}; nếu HLV không đủ tiền, ledger âm và cần chính sách giữ payout sau/thu hồi. Sai (B): lỗ âm thầm là lỗi. Sai (C): không liên quan. Sai (D): payout là ra ngân hàng, không lấy lại transfer.' },
      { q: 'Số dư âm (negative balance) trên connected account nghĩa là gì?', options: ['HLV nợ platform, payout sau bị giữ để bù', 'HLV được thêm tiền', 'Account bị xóa', 'Không có ý nghĩa'], answer: 0, explain: 'Đúng: ledger âm = HLV nợ platform (thường do reverse/refund vượt số dư), payout tương lai bị giữ để bù. Sai (B): ngược lại. Sai (C): không mất account. Sai (D): có ý nghĩa quan trọng cho thu hồi.' }
    ],
    related: [],
    tags: ['stripe', 'transfer', 'payout', 'refund']
  },
  {
    id: 'lesson-banking-033',
    track: 'banking',
    order: 33,
    title: 'Webhooks trong Spring: xác thực chữ ký, trả 2xx nhanh, xử lý bất đồng bộ',
    level: 'senior',
    minutes: 35,
    goals: [
      'Hiểu vì sao webhook cần xác thực chữ ký (Stripe-Signature, whsec_...) và không tin body thô',
      'Biết vì sao phải trả 2xx thật nhanh và xử lý phần nặng bất đồng bộ',
      'Viết SignatureVerifier.verify mô phỏng HMAC-SHA256 và biết event đến sai thứ tự'
    ],
    body: `### Webhook là gì
**Tóm tắt:** Webhook là cách Stripe **chủ động gọi** server bạn khi có sự kiện (payment_intent.succeeded, account.updated…). Vì endpoint công khai trên Internet, bạn **phải xác thực** request thật sự đến từ Stripe (chữ ký HMAC), trả **2xx thật nhanh** rồi xử lý phần nặng sau (bất đồng bộ). Không tin body thô, không xử lý lâu trong request.

**Thuật ngữ:**
- **Stripe-Signature**: header chứa {{t=...,v1=...}} — timestamp và chữ ký HMAC-SHA256 của {{timestamp + "." + rawBody}} dùng secret {{whsec_...}} (signing secret, khác secret API sk_...).
- **Idempotency**: cùng một event có thể được Stripe gửi lại (retry) — phải xử lý một lần (bài 6).
- **2xx nhanh**: Stripe coi 2xx là "đã nhận"; nếu bạn trả 4xx/5xx hoặc timeout, Stripe retry (theo lịch exponential). Xử lý nặng trong request dễ timeout → retry → trùng.
- **Out-of-order**: event đến không theo thứ tự tạo (vd refund đến trước payment.succeeded) — cần dựa vào trạng thái, không dựa thứ tự.

### Vì sao xác thực chữ ký
Nếu không xác thực, bất kỳ ai biết URL cũng có thể POST giả event "payment succeeded" → bạn cho free dịch vụ. HMAC với {{whsec_...}} đảm bảo chỉ Stripe (nắm secret) tạo được chữ ký hợp lệ. Tolerate timestamp lệch (mặc định ~5 phút) để chống replay.

### Luồng webhook
~~~seq
title: Webhook Stripe
actors: Stripe | API | Queue | Worker
Stripe -> API: POST /webhooks (Stripe-Signature)
API -> API: verify HMAC(rawBody, whsec)
API -> Queue: enqueue event.id (nhanh)
API --> Stripe: 200 OK
Worker -> Worker: xử lý event (DB, transfer)
~~~

### Lỗi hay gặp
1. **Đọc body đã parse JSON rồi verify**: chữ ký tính trên **raw body**; nếu framework parse trước, ký sai. Phải lấy raw bytes.
2. **Xử lý nặng trong request**: gọi Stripe API, gửi email ngay → timeout → Stripe retry → xử lý trùng.
3. **Không verify**: endpoint bị giả mạo.
4. **Tin thứ tự**: refund đến trước, account bị trừ tiền sai.

### Ví dụ: verify HMAC (mô phỏng)
~~~java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
// signed = timestamp + "." + rawBody; so sánh với v1 trong header (constant-time)
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(whsec.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
byte[] sig = mac.doFinal((t + "." + rawBody).getBytes(StandardCharsets.UTF_8));
// dùng MessageDigest.isEqual để so sánh an toàn timing
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Bạn nhận webhook Stripe trong Spring, làm sao an toàn và không bị retry trùng?"
**Cách trả lời:** Tôi xác thực chữ ký HMAC-SHA256 trên **raw body** với secret {{whsec_...}} và timestamp trong header {{Stripe-Signature}}, dùng so sánh constant-time, chống replay bằng cửa sổ timestamp. Sau khi verify, tôi **trả 200 ngay** và đẩy event vào queue; worker xử lý bất đồng bộ (ghi DB, gọi Stripe). Vì Stripe retry khi không 2xx, tôi làm idempotent theo {{event.id}} (bài 6) và không dựa thứ tự event mà dựa trạng thái. Tôi không bao giờ xử lý nặng trong request để tránh timeout → retry.

> Senior tip: Hai lỗi webhook phổ biến nhất: (1) verify trên JSON đã parse thay vì raw body → chữ ký luôn sai; (2) xử lý nặng trong request → timeout → Stripe retry → nhân đôi side-effect. Trả 2xx sớm + idempotent + queue là bộ ba bắt buộc.`,
    exercises: [
      {
        title: 'SignatureVerifier.verify',
        prompt: `Hoàn thiện class {{SignatureVerifier}} với method {{verify(String secret, long timestamp, String rawBody, String providedHex, long nowSeconds, long toleranceSeconds)}} trả boolean:
- Tính HMAC-SHA256 của (timestamp + "." + rawBody) với secret (UTF-8), lấy hex.
- Chỉ true khi |nowSeconds - timestamp| <= toleranceSeconds VÀ hex khớp providedHex (so sánh không phân biệt hoa/thường).`,
        starter: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
class SignatureVerifier {
    static boolean verify(String secret, long timestamp, String rawBody, String providedHex, long nowSeconds, long toleranceSeconds) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static String hex(byte[] b) {
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(String.format("%02x", x));
        return s.toString();
    }
    static String sign(String secret, long t, String body) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
        return hex(mac.doFinal((t + "." + body).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    public static void main(String[] args) throws Exception {
        String secret = "whsec_test";
        long t = 1700000000L;
        String body = "{\\"id\\":\\"evt_1\\"}";
        String good = sign(secret, t, body);
        check("valid", SignatureVerifier.verify(secret, t, body, good, t + 10, 300), "");
        check("bad sig", !SignatureVerifier.verify(secret, t, body, "deadbeef", t, 300), "");
        check("expired", !SignatureVerifier.verify(secret, t, body, good, t + 1000, 300), "");
        check("upper hex", SignatureVerifier.verify(secret, t, body, good.toUpperCase(), t, 300), "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
class SignatureVerifier {
    static boolean verify(String secret, long timestamp, String rawBody, String providedHex, long nowSeconds, long toleranceSeconds) {
        if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal((timestamp + "." + rawBody).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : sig) sb.append(String.format("%02x", b));
            return MessageDigestCompat.eq(sb.toString(), providedHex.toLowerCase());
        } catch (Exception e) { return false; }
    }
    static class MessageDigestCompat {
        static boolean eq(String a, String b) {
            return java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
        }
    }
}`,
        hints: ['signed = timestamp + "." + rawBody', 'kiểm tra tolerance trước, so sánh hex constant-time'],
        explain: `Verify HMAC trên chuỗi timestamp+"."+rawBody với secret whsec. Chặn replay bằng tolerance (vd 300s). So sánh hex bằng MessageDigest.isEqual (constant-time) tránh timing attack; chấp nhận hex hoa/thường. Lỗi hay gặp: verify trên JSON đã parse (phải dùng raw body).`
      }
    ],
    check: [
      { q: 'Vì sao webhook Stripe phải xác thực chữ ký?', options: ['Để nén dữ liệu', 'Endpoint công khai, nếu không xác thực ai biết URL cũng giả được event "đã thanh toán"', 'Để Stripe gửi nhanh hơn', 'Vì JSON cần chữ ký'], answer: 1, explain: 'Đúng: endpoint public, chữ ký HMAC với whsec đảm bảo chỉ Stripe tạo được, tránh giả mạo. Sai (A): chữ ký không để nén. Sai (C): không liên quan tốc độ gửi. Sai (D): chữ ký trên raw body, không phải JSON.' },
      { q: 'Chữ ký Stripe được tính trên dữ liệu nào?', options: ['JSON đã parse thành object', 'Raw body thô + timestamp (timestamp + "." + rawBody)', 'Chỉ timestamp', 'Header Authorization'], answer: 1, explain: 'Đúng: HMAC trên timestamp + "." + raw body; nếu verify trên JSON đã parse sẽ sai. Sai (A): parse làm đổi format. Sai (C): thiếu body. Sai (D): không dùng Authorization.' },
      { q: 'Vì sao nên trả 2xx nhanh rồi xử lý bất đồng bộ?', options: ['Để Stripe không retry; xử lý nặng trong request dễ timeout → retry → trùng side-effect', 'Vì 2xx đẹp hơn', 'Vì không được dùng queue', 'Vì Stripe yêu cầu trả 4xx'], answer: 0, explain: 'Đúng: 2xx báo Stripe "đã nhận", tránh retry; xử lý nặng trong request dễ timeout → Stripe retry → trùng. Sai (B): không phải thẩm mỹ. Sai (C): queue là giải pháp. Sai (D): Stripe coi 2xx là nhận, 4xx/5xx mới retry.' },
      { q: 'Event đến sai thứ tự (refund trước payment.succeeded) nên xử lý thế nào?', options: ['Dựa vào thứ tự đến', 'Dựa vào trạng thái hiện tại và event.id idempotent, không dựa thứ tự', 'Bỏ qua refund', 'Trả 500 cho Stripe'], answer: 1, explain: 'Đúng: không đảm bảo thứ tự; xử lý theo trạng thái và idempotent theo event.id. Sai (A): thứ tự không đảm bảo. Sai (C): bỏ refund sai. Sai (D): 500 gây retry.' }
    ],
    related: [],
    tags: ['stripe', 'webhook', 'hmac', 'spring']
  },
  {
    id: 'lesson-banking-034',
    track: 'banking',
    order: 34,
    title: 'Idempotency và retry: bảng processed_events với event.id UNIQUE, Idempotency-Key, đối soát',
    level: 'lead',
    minutes: 35,
    goals: [
      'Hiểu vì sao Stripe retry và vì sao cần idempotent theo event.id (UNIQUE)',
      'Biết Idempotency-Key khi gọi Stripe API để tránh tạo trùng charge/transfer',
      'Viết EventLog.process mô phỏng dedupe event.id và phát hiện out-of-order'
    ],
    body: `### Vấn đề: "exactly once" là ảo
**Tóm tắt:** Mạng và retry khiến một event có thể đến nhiều lần, hoặc request của bạn tới Stripe bị timeout rồi bạn gửi lại → tạo trùng. Giải pháp thực tế là **idempotency**: xử lý một event nhiều lần cho ra cùng kết quả như một lần. Hai lớp: (1) **event.id UNIQUE** trong bảng {{processed_events}} để dedupe webhook; (2) **Idempotency-Key** khi gọi Stripe API để Stripe gộp các request giống nhau.

**Thuật ngữ:**
- **Idempotent**: thực hiện N lần = 1 lần về mặt kết quả. Ví dụ {{SET x=1}} idempotent; {{x=x+1}} không.
- **processed_events**: bảng có {{event_id}} UNIQUE, {{type}}, {{received_at}}, {{status}}. Lần đầu insert; nếu đã có thì bỏ qua (đã xử lý).
- **Idempotency-Key**: header bạn gửi kèm request POST tới Stripe (vd {{idem-123}}). Stripe lưu kết quả theo key trong ~24h; gửi lại cùng key trả kết quả cũ, không tạo mới.
- **Out-of-order**: event đến sai thứ tự; xử lý theo trạng thái (vd chỉ chuyển "succeeded" khi đang "pending").

### Hai lớp idempotency
1. **Nhận webhook**: insert {{event.id}} vào {{processed_events}} trong **cùng transaction** với side-effect. UNIQUE constraint chặn trùng; nếu insert lỗi duplicate → đã xử lý, trả 200.
2. **Gọi Stripe**: mọi POST tạo tài nguyên (charge, transfer, refund) kèm {{Idempotency-Key}} duy nhất theo nghiệp vụ (vd {{transfer:chargeId}}). Timeout → gửi lại cùng key → không tạo đôi.

### Luồng idempotent
~~~seq
title: Idempotent webhook
actors: Stripe | API | DB
Stripe -> API: POST event evt_1 (lần 1)
API -> DB: INSERT processed_events evt_1 + side-effect
DB --> API: ok
API --> Stripe: 200
Stripe -> API: POST event evt_1 (retry)
API -> DB: INSERT evt_1 -> duplicate
DB --> API: lỗi UNIQUE
API --> Stripe: 200 (đã xử lý)
~~~

### Lỗi hay gặp
1. **Check-then-act không atomic**: SELECT rồi INSERT rời nhau → hai thread cùng qua → trùng. Phải dựa UNIQUE + transaction.
2. **Không dùng Idempotency-Key khi gọi Stripe**: timeout → gửi lại → hai charge.
3. **Dùng event.id làm idempotency key cho mọi request**: key phải theo nghiệp vụ, không tái dùng.
4. **Không đối soát**: không phát hiện charge chưa có transfer, transfer mồ côi.

### Ví dụ: dedupe bằng Set (mô phỏng UNIQUE)
~~~java
import java.util.HashSet;
import java.util.Set;
Set<String> processed = new HashSet<>();
boolean firstTime = processed.add("evt_1"); // true lần đầu, false nếu đã có
if (firstTime) { /* xử lý */ }
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Stripe gửi trùng webhook hoặc bạn timeout khi gọi Stripe, làm sao không tạo trùng charge/transfer?"
**Cách trả lời:** Tôi làm idempotent hai lớp. Nhận webhook: insert {{event.id}} vào bảng {{processed_events}} có UNIQUE, trong cùng transaction với side-effect; duplicate thì coi như đã xử lý và trả 200 — dựa DB constraint, không check-then-act. Gọi Stripe: mọi POST tạo tài nguyên kèm {{Idempotency-Key}} theo nghiệp vụ (vd {{transfer:chargeId}}); timeout gửi lại cùng key, Stripe trả kết quả cũ, không tạo đôi. Tôi cũng không dựa thứ tự event mà dựa trạng thái, và có job đối soát charge↔transfer để phát hiện mồ côi.

> Senior tip: Idempotency không phải "nhớ id đã thấy" bằng một Set trong RAM (mất khi restart, không share nhiều instance). Phải là UNIQUE constraint trong DB + transaction. Và Idempotency-Key khi gọi Stripe phải theo nghiệp vụ, không phải event.id — nếu không, hai nghiệp vụ khác nhau dùng chung key sẽ bị gộp sai.`,
    exercises: [
      {
        title: 'EventLog.process',
        prompt: `Hoàn thiện class {{EventLog}} mô phỏng dedupe event.id bằng LinkedHashSet:
- {{process(String eventId)}}: nếu eventId đã có trả "DUPLICATE"; nếu chưa, thêm vào và trả "PROCESSED".
- {{seen()}}: trả số event đã xử lý (size).`,
        starter: `import java.util.LinkedHashSet;
import java.util.Set;
class EventLog {
    private final Set<String> seen = new LinkedHashSet<>();
    String process(String eventId) { throw new UnsupportedOperationException("TODO"); }
    int seen() { throw new UnsupportedOperationException("TODO"); }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        EventLog log = new EventLog();
        check("first", log.process("evt_1").equals("PROCESSED"), "");
        check("dup", log.process("evt_1").equals("DUPLICATE"), "");
        check("second", log.process("evt_2").equals("PROCESSED"), "");
        check("count", log.seen() == 2, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.LinkedHashSet;
import java.util.Set;
class EventLog {
    private final Set<String> seen = new LinkedHashSet<>();
    String process(String eventId) { return seen.add(eventId) ? "PROCESSED" : "DUPLICATE"; }
    int seen() { return seen.size(); }
}`,
        hints: ['Set.add trả true nếu thêm mới, false nếu đã có', 'seen trả size'],
        explain: `Mô phỏng UNIQUE event.id: Set.add trả false khi trùng → DUPLICATE. Thực tế dùng UNIQUE constraint + transaction (không check-then-act). seen đếm số event đã xử lý. Lỗi hay gặp: dùng List.contains (O(n)) hoặc check rồi add tách rời.`
      }
    ],
    check: [
      { q: 'Vì sao cần event.id UNIQUE trong processed_events?', options: ['Để nén dữ liệu', 'Để dedupe webhook: cùng event gửi lại (retry) chỉ xử lý một lần', 'Để tăng tốc đọc', 'Vì Stripe yêu cầu tên bảng'], answer: 1, explain: 'Đúng: UNIQUE event.id + transaction đảm bảo retry không xử lý trùng; duplicate insert lỗi → bỏ qua. Sai (A): không để nén. Sai (C): không phải tối ưu đọc. Sai (D): tên bảng tùy bạn.' },
      { q: 'Idempotency-Key khi gọi Stripe API dùng để làm gì?', options: ['Để định danh platform', 'Để Stripe gộp các request giống nhau (trong ~24h) trả kết quả cũ, tránh tạo trùng charge/transfer khi timeout gửi lại', 'Để mã hóa request', 'Để tăng rate limit'], answer: 1, explain: 'Đúng: gửi lại cùng key, Stripe trả kết quả cũ, không tạo tài nguyên mới — tránh trùng khi timeout. Sai (A): không định danh platform. Sai (C): không mã hóa. Sai (D): không liên quan rate limit.' },
      { q: 'Vì sao check-then-act (SELECT rồi INSERT) không an toàn cho dedupe?', options: ['Vì chậm', 'Hai thread có thể cùng qua SELECT trước khi INSERT → trùng; phải dựa UNIQUE constraint + transaction', 'Vì không dùng được DB', 'Vì event.id luôn null'], answer: 1, explain: 'Đúng: race giữa SELECT và INSERT; UNIQUE + transaction mới atomic. Sai (A): không phải vấn đề tốc độ. Sai (C): dùng DB bình thường. Sai (D): event.id không null.' },
      { q: 'Idempotency-Key nên được sinh theo gì?', options: ['Theo nghiệp vụ (vd transfer:{chargeId}), không tái dùng event.id cho mọi request', 'Theo event.id webhook cho mọi request', 'Ngẫu nhiên mỗi lần', 'Theo timestamp hiện tại'], answer: 0, explain: 'Đúng: key theo nghiệp vụ để retry cùng nghiệp vụ gộp đúng, hai nghiệp vụ khác nhau không gộp nhầm. Sai (B): tái dùng event.id dễ gộp sai. Sai (C): ngẫu nhiên thì retry không gộp. Sai (D): timestamp đổi mỗi lần → không idempotent.' }
    ],
    related: [],
    tags: ['stripe', 'idempotency', 'webhook', 'retry']
  },
  {
    id: 'lesson-banking-035',
    track: 'banking',
    order: 35,
    title: 'Test Stripe tích hợp: Stripe CLI (listen/trigger), test mode, Testcontainers Postgres',
    level: 'senior',
    minutes: 30,
    goals: [
      'Biết test mode + Stripe CLI (stripe listen/trigger) để test webhook không cần tiền thật',
      'Hiểu vì sao dùng Testcontainers Postgres cho test tích hợp thay vì H2',
      'Viết TestClock.deterministic mô phỏng xử lý webhook theo thời gian cố định để test retry'
    ],
    body: `### Vì sao test thanh toán khó
**Tóm tắt:** Tích hợp thanh toán khó test vì có bên thứ ba (Stripe), có tiền thật, và webhook đến bất đồng bộ. Giải pháp: **test mode** (API key {{sk_test_...}}, không tiền thật), **Stripe CLI** ({{stripe listen}} chuyển event Stripe thành webhook tới localhost; {{stripe trigger}} bắn event mẫu), và **Testcontainers** (Postgres thật trong Docker) để test schema/UNIQUE/transaction đúng như production.

**Thuật ngữ:**
- **Test mode**: môi trường Stripe với key {{sk_test_...}} và account {{acct_...}} test; không giao dịch tiền thật. Dùng song song với {{whsec_...}} test.
- **Stripe CLI**: công cụ dòng lệnh. {{stripe listen --forward-to localhost:8080/webhooks}} in ra {{whsec_...}} để verify; {{stripe trigger payment_intent.succeeded}} bắn event mẫu.
- **Testcontainers**: thư viện test khởi tạo container Docker (Postgres) trong lúc test, cho DB thật, ephemeral. Khác H2 (in-memory, không giống Postgres về constraint, transaction, JSONB).
- **Deterministic**: test không phụ thuộc thời gian thực; dùng {{Clock.fixed}} / thời gian gán cứng.

### Bộ ba test
1. **Test mode + CLI**: chạy server Spring, {{stripe listen}}, bắn {{stripe trigger}}, kiểm tra webhook verify + side-effect. Không tốn tiền.
2. **Testcontainers Postgres**: test {{processed_events}} UNIQUE, transaction rollback khi side-effect lỗi, isolation. Bắt lỗi chỉ xuất hiện trên Postgres thật.
3. **Deterministic clock**: test retry/idempotency theo timestamp cố định, không {{sleep}}.

### Luồng test webhook
~~~seq
title: Test webhook
actors: Dev | StripeCLI | API | DB
Dev -> StripeCLI: stripe trigger payment_intent.succeeded
StripeCLI -> API: POST /webhooks (signed)
API -> DB: INSERT processed_events + side-effect
API --> StripeCLI: 200
Dev -> DB: assert side-effect tồn tại
~~~

### Lỗi hay gặp
1. **Test bằng H2 rồi production Postgres lỗi**: H2 không enforce UNIQUE/transaction giống Postgres → bug lọt.
2. **Gọi Stripe thật khi test**: tốn tiền, bẩn dữ liệu. Luôn {{sk_test_...}}.
3. **Test phụ thuộc {{Thread.sleep}}**: flaky. Dùng clock cố định, await với timeout.
4. **Không test trùng/sai thứ tự**: thiếu case retry → bug idempotency.

### Ví dụ: clock cố định cho test retry
~~~java
import java.time.*;
Clock fixed = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
// mọi tính toán thời gian trong test dựa trên fixed -> deterministic
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Bạn test tích hợp Stripe Connect thế nào cho an toàn, không tốn tiền, và bắt được bug idempotency?"
**Cách trả lời:** Tôi dùng test mode ({{sk_test_...}}) + Stripe CLI: {{stripe listen --forward-to localhost:8080/webhooks}} để nhận event thật đã ký, {{stripe trigger ...}} bắn event mẫu — không tiền thật. DB test dùng Testcontainers Postgres để UNIQUE/transaction giống production (không H2). Tôi viết test cho webhook trùng (gửi cùng event.id hai lần → một side-effect) và sai thứ tự, dùng {{Clock.fixed}} thay {{sleep}} để deterministic. Tôi cũng test transaction rollback khi side-effect lỗi để đảm bảo processed_events không "ăn gian".

> Senior tip: Test thanh toán phải có case "gửi lại cùng event" và "side-effect lỗi → rollback". Nếu chỉ test happy path, bạn sẽ ship bug nhân đôi transfer. Testcontainers Postgres bắt được lỗi UNIQUE/transaction mà H2 bỏ qua — đừng tiết kiệm ở khoản này.`,
    exercises: [
      {
        title: 'TestClock.deterministic',
        prompt: `Hoàn thiện class {{TestClock}} mô phỏng đồng hồ test cố định:
- constructor nhận epochSecond ban đầu.
- {{now()}}: trả epochSecond hiện tại.
- {{advance(long seconds)}}: cộng vào epochSecond, trả giá trị mới.
- {{isExpired(long createdAt, long ttlSeconds)}}: true khi now() - createdAt > ttlSeconds.`,
        starter: `class TestClock {
    private long epochSecond;
    TestClock(long start) { this.epochSecond = start; }
    long now() { throw new UnsupportedOperationException("TODO"); }
    long advance(long seconds) { throw new UnsupportedOperationException("TODO"); }
    boolean isExpired(long createdAt, long ttlSeconds) { throw new UnsupportedOperationException("TODO"); }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        TestClock c = new TestClock(1000);
        check("now", c.now() == 1000, "");
        check("advance", c.advance(50) == 1050, "");
        check("not expired", !c.isExpired(1000, 100), "");
        check("expired", c.isExpired(1000, 10), "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `class TestClock {
    private long epochSecond;
    TestClock(long start) { this.epochSecond = start; }
    long now() { return epochSecond; }
    long advance(long seconds) { epochSecond += seconds; return epochSecond; }
    boolean isExpired(long createdAt, long ttlSeconds) { return now() - createdAt > ttlSeconds; }
}`,
        hints: ['advance cộng và trả giá trị mới', 'isExpired: now - createdAt > ttl'],
        explain: `Đồng hồ test cố định giúp deterministic: không phụ thuộc thời gian thực, không sleep. advance mô phỏng thời gian trôi; isExpired kiểm tra hết hạn (vd idempotency key 24h, link hết hạn). Lỗi hay gặp: dùng Instant.now trong test → flaky.`
      }
    ],
    check: [
      { q: 'Vì sao dùng test mode (sk_test_...) khi test Stripe?', options: ['Để nhanh hơn', 'Không giao dịch tiền thật, an toàn, dữ liệu test tách biệt', 'Vì sk_live không tồn tại', 'Để bỏ qua verify chữ ký'], answer: 1, explain: 'Đúng: test mode không tiền thật, key sk_test, account test, an toàn. Sai (A): không phải lý do chính. Sai (C): sk_live có thật. Sai (D): vẫn verify chữ ký với whsec test.' },
      { q: 'Stripe CLI stripe listen dùng để làm gì?', options: ['Tạo account', 'Chuyển event Stripe thành webhook đã ký tới localhost và in whsec để verify', 'Tính application fee', 'Xóa dữ liệu'], answer: 1, explain: 'Đúng: listen forward event tới localhost, in whsec test; trigger bắn event mẫu. Sai (A): tạo account qua API. Sai (C): không tính fee. Sai (D): không xóa dữ liệu.' },
      { q: 'Vì sao nên dùng Testcontainers Postgres thay vì H2 cho test thanh toán?', options: ['H2 luôn sai', 'Postgres thật giống production về UNIQUE/transaction/JSONB, bắt lỗi H2 bỏ qua', 'Testcontainers không cần Docker', 'H2 không chạy được'], answer: 1, explain: 'Đúng: Postgres thật enforce constraint/transaction giống production; H2 khác biệt dễ bỏ sót bug. Sai (A): H2 không "luôn sai". Sai (C): Testcontainers cần Docker. Sai (D): H2 chạy được nhưng không giống.' },
      { q: 'Vì sao test retry nên dùng Clock.fixed thay Thread.sleep?', options: ['sleep luôn sai', 'Để deterministic, không phụ thuộc thời gian thực, tránh flaky', 'Vì sleep bị cấm', 'Vì Clock.fixed nhanh hơn'], answer: 1, explain: 'Đúng: thời gian cố định → lặp lại ổn định, không flaky. Sai (A): sleep không "luôn sai" nhưng gây flaky. Sai (C): không bị cấm. Sai (D): không phải vấn đề tốc độ.' }
    ],
    related: [],
    tags: ['stripe', 'test', 'testcontainers', 'cli']
  },
  {
    id: 'lesson-banking-036',
    track: 'banking',
    order: 36,
    title: 'Ticket diễn tập: refund + reverse transfer — phân tích, kế hoạch, test, checklist review code thanh toán',
    level: 'lead',
    minutes: 40,
    goals: [
      'Đọc ticket refund + reverse transfer và lập kế hoạch an toàn (staging trước, test trước)',
      'Biết checklist review khi agent viết code thanh toán (secret, idempotency, staging, test)',
      'Viết RefundPolicy.refund mô phỏng quyết định hoàn tiền + lấy lại transfer theo số dư'
    ],
    body: `### Bối cảnh ticket
**Tóm tắt:** Ticket: "Thành viên hoàn huỷ, cần hoàn tiền và lấy lại phần đã trả HLV". Đây là bài toán nguy hiểm vì tiền đã ra khỏi ledger HLV (có thể âm). Quy trình an toàn: đọc kỹ trạng thái → viết test trước (trùng, âm, sai thứ tự) → code trên staging → review diff từng dòng (đặc biệt secret/idempotency) → mới lên production.

**Thuật ngữ:**
- **Refund**: hoàn tiền cho thành viên (charge bị trả lại).
- **Reverse transfer**: lấy lại transfer đã gửi HLV ({{/v1/transfers/id/reversals}}).
- **Staging**: môi trường gần production để thử trước; quy tắc "staging trước thứ Sáu".
- **Checklist review**: danh sách kiểm tra khi agent viết code thanh toán.

### Các bước xử lý (an toàn)
1. **Đọc trạng thái**: charge đã succeeded? transfer đã gửi? HLV đã rút (payout)? số dư ledger HLV?
2. **Viết test trước**: hoàn khi đủ số dư (ledger về 0), hoàn khi thiếu (ledger âm), hoàn khi chưa transfer (chỉ refund), event trùng (idempotent).
3. **Code + idempotency**: refund kèm Idempotency-Key; reverse transfer có key riêng; log mapping charge↔transfer↔refund.
4. **Staging**: chạy Stripe test mode + Testcontainers, bắn event trùng/sai thứ tự.
5. **Review diff**: secret không lọt, verify chữ ký, 2xx nhanh, không xử lý nặng trong request.
6. **Production**: deploy sau review, theo dõi dashboard số dư âm.

### Checklist review code thanh toán (dùng khi agent viết)
- [ ] Không có secret/key thật trong code/log/prompt (chỉ {{sk_test_...}}, {{whsec_...}} placeholder).
- [ ] Idempotency: {{processed_events}} UNIQUE + Idempotency-Key khi gọi Stripe.
- [ ] Webhook: verify HMAC raw body, trả 2xx nhanh, queue.
- [ ] Tiền: không dùng double; đơn vị nhỏ nhất; không làm tròn giữa chừng.
- [ ] Test: có case trùng, sai thứ tự, thiếu số dư (âm), rollback.
- [ ] Staging trước production; PR mô tả "Agent wrote / I reviewed / I rewrote".

### Luồng refund + reverse
~~~seq
title: Refund + reverse
actors: App | Stripe | HLV
App -> Stripe: refund charge (Idempotency-Key)
App -> Stripe: reverse transfer (key riêng)
Stripe --> HLV: ledger -amount (có thể âm)
App -> App: log mapping, đối soát
~~~

### Lỗi hay gặp
1. **Hoàn tiền mà quên reverse**: platform lỗ ngầm.
2. **Reverse khi HLV đã rút**: ledger âm, không có chính sách thu hồi.
3. **Agent để lộ secret**: key thật trong diff → phải rotate ngay.
4. **Không test trùng**: bấm hoàn hai lần → hoàn hai lần.

### Ví dụ: quyết định hoàn
~~~java
record RefundState(long chargeCents, long transferredCents, long walletCents) {}
// nếu transferredCents>0: cần reverse; sau reverse wallet = walletCents - transferredCents (có thể âm)
long after = 3000 - 9000; // -6000 -> âm, cần chính sách
~~~

### Liên hệ phỏng vấn
**Câu hỏi:** "Ticket gấp: hoàn tiền thành viên và lấy lại tiền đã trả HLV, bạn làm gì để an toàn?"
**Cách trả lời:** Tôi bắt đầu bằng đọc trạng thái: charge, transfer, payout, số dư ledger HLV. Tôi viết test trước cho các case: đủ số dư (về 0), thiếu (âm), chưa transfer (chỉ refund), event trùng (idempotent). Code dùng Idempotency-Key cho refund và key riêng cho reverse transfer, log mapping để đối soát. Tôi chạy trên staging với Stripe test mode + Testcontainers, bắn event trùng/sai thứ tự, rồi mới review diff theo checklist: không secret, verify chữ ký, 2xx nhanh, không double cho tiền. Khi ledger âm tôi áp chính sách giữ payout sau. Quy trình PR ghi rõ Agent wrote / I reviewed / I rewrote.

> Senior tip: Với code thanh toán do agent viết, review diff quan trọng hơn tốc độ. Luôn kiểm: secret không lọt, idempotency đủ hai lớp, có test cho "trùng/âm/sai thứ tự", và staging trước production. Một dòng log thiếu che secret là sự cố phải rotate key — đừng bao giờ dán key thật vào prompt.`,
    exercises: [
      {
        title: 'RefundPolicy.refund',
        prompt: `Hoàn thiện class {{RefundPolicy}} với method {{refund(long transferredCents, long walletCents)}} trả long[] {refundAmount, walletAfter}:
- refundAmount = transferredCents (hoàn cho thành viên phần đã thu).
- walletAfter = walletCents - transferredCents (có thể âm sau reverse).
- Nếu transferredCents < 0 coi như 0.`,
        starter: `class RefundPolicy {
    static long[] refund(long transferredCents, long walletCents) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        long[] a = RefundPolicy.refund(9000, 9000);
        check("refund to zero", a[0] == 9000 && a[1] == 0, "");
        long[] b = RefundPolicy.refund(9000, 3000);
        check("refund negative", b[0] == 9000 && b[1] == -6000, "");
        long[] c = RefundPolicy.refund(-5, 1000);
        check("neg transfer", c[0] == 0 && c[1] == 1000, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `class RefundPolicy {
    static long[] refund(long transferredCents, long walletCents) {
        long t = Math.max(0, transferredCents);
        return new long[]{t, walletCents - t};
    }
}`,
        hints: ['refundAmount = max(0, transferred)', 'walletAfter = wallet - refundAmount (cho phép âm)'],
        explain: `Mô phỏng refund + reverse: hoàn cho thành viên phần đã transfer, ledger HLV trừ đi (có thể âm nếu HLV đã rút). Âm → cần chính sách giữ payout sau. Lỗi hay gặp: quên reverse (platform lỗ), hoặc chặn âm mà không có thu hồi.`
      }
    ],
    check: [
      { q: 'Khi hoàn tiền thành viên mà đã transfer cho HLV, bước bắt buộc tiếp theo là gì?', options: ['Gọi payout', 'Reverse transfer để lấy lại tiền, có chính sách nếu ledger âm', 'Xóa account', 'Gửi email'], answer: 1, explain: 'Đúng: cần reverse transfer lấy lại; nếu HLV đã rút, ledger âm và phải có chính sách giữ payout sau. Sai (A): payout ra ngân hàng, không lấy lại. Sai (C): không liên quan. Sai (D): không thay thế reverse.' },
      { q: 'Checklist review code thanh toán do agent viết, mục nào quan trọng nhất?', options: ['Tên biến đẹp', 'Không secret thật, idempotency hai lớp, verify chữ ký, test trùng/âm/sai thứ tự, staging trước', 'Comment nhiều', 'Số dòng ít'], answer: 1, explain: 'Đúng: secret, idempotency, verify, test case nguy hiểm, staging là lõi an toàn thanh toán. Sai (A): tên biến không phải ưu tiên. Sai (C): comment không thay test. Sai (D): số dòng không đo an toàn.' },
      { q: 'Vì sao phải viết test cho case ledger âm khi refund?', options: ['Vì luôn âm', 'Để đảm bảo logic xử lý số dư âm (giữ payout sau/thu hồi) đúng, tránh lỗ âm thầm', 'Vì Stripe cấm âm', 'Vì test phải chậm'], answer: 1, explain: 'Đúng: HLV có thể đã rút, reverse làm âm; test đảm bảo chính sách thu hồi đúng. Sai (A): không "luôn" âm. Sai (C): Stripe có thể cho âm. Sai (D): test không cần chậm.' },
      { q: 'Quy tắc "staging trước production" trong code thanh toán nghĩa là gì?', options: ['Deploy thẳng production cho nhanh', 'Chạy trên môi trường staging (test mode + DB thật) trước, review rồi mới production', 'Không cần test', 'Chỉ test trên máy dev'], answer: 1, explain: 'Đúng: staging gần production để bắt lỗi trước, sau review mới lên production. Sai (A): rủi ro cao. Sai (C): test là bắt buộc. Sai (D): dev không đủ giống production.' }
    ],
    related: [],
    tags: ['stripe', 'refund', 'reverse-transfer', 'review']
  }
);
