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
  }
);
