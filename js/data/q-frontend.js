/*
 * Topic frontend (Vue 3 / JavaScript / TypeScript cho dev Java fullstack). Schema: AGENTS.md muc 4.
 */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'frontend-001',
  topic: 'frontend',
  level: 'senior',
  q: 'JavaScript là single-threaded, event loop xử lý bất đồng bộ như thế nào? Phân biệt microtask (Promise) và macrotask (setTimeout).',
  a: `**Tóm tắt:** JavaScript chỉ chạy trên một luồng chính. Khi cần chờ (timer, mạng, I/O) công việc được đẩy vào hàng đợi, event loop lấy từng việc chạy xong rồi mới lấy việc tiếp theo. Microtask (Promise) được ưu tiên chạy trước macrotask (setTimeout, setInterval, sự kiện trình duyệt).

### Cơ chế bên trong, từng bước
1. JS đọc code trên luồng chính, chạy các dòng đồng bộ ngay lập tức.
2. Khi gặp setTimeout hay fetch, trình duyệt nhận yêu cầu, giải phóng luồng JS, và hẹn chạy callback sau khi xong.
3. Callback được đẩy vào hàng đợi macrotask.
4. Khi một Promise hoàn thành, callback .then được đẩy vào hàng đợi microtask.
5. Event loop: chạy xong task hiện tại -> lấy tất cả microtask chạy hết -> vẽ lại giao diện (nếu có) -> lấy một macrotask tiếp theo -> lặp lại.

Vì chỉ có 1 luồng, JS giống một trình xử lý đơn luồng trong Java (single-threaded Executor), nhưng không cần pool luồng.

### Ví dụ code
~~~text
console.log('A: đồng bộ');

setTimeout(function () {
  console.log('B: macrotask setTimeout');
}, 0);

Promise.resolve().then(function () {
  console.log('C: microtask Promise');
});

console.log('D: đồng bộ kết thúc');
~~~

Thứ tự in ra: A, D, C, B.
Giải thích: A và D chạy ngay. C là microtask, chạy sau D nhưng trước B. B là macrotask, chờ lượt sau của event loop.

### So sánh microtask và macrotask
| Thuộc tính | Microtask | Macrotask |
|---|---|---|
| Nguồn phổ biến | Promise.then, await, queueMicrotask | setTimeout, setInterval, sự kiện click, I/O |
| Khi chạy | Hết task hiện tại, trước khi vẽ lại giao diện | Mỗi lượt mới của event loop |
| Ưu tiên | Cao hơn macrotask | Thấp hơn microtask |

### Lỗi hay gặp
- Vòng microtask vô hạn: Promise liên tục tạo Promise mới làm event loop không kịp vẽ giao diện, trang treo.
- Đặt quá nhiều công việc nặng vào microtask làm chuột bị chậm vài trăm mili-giây vì microtask chạy trước vẽ giao diện (render là một macrotask).

### Ví dụ đời thực
Một trang admin gọi API lấy danh sách đơn hàng (khoảng 5000 đơn). Code đặt xử lý render trong Promise.then (microtask) rồi tiếp tục gọi setTimeout trong microtask. Kết quả: microtask chạy liên tục 1200 ms, người dùng không bấm nút được trong khoảng đó, cảm giác trang bị đơ.

### Trả lời mẫu khi phỏng vấn
JavaScript chạy trên một luồng duy nhất nên nó không đồng bộ bằng cách tạo thread mới như Java. Thay vào đó, các tác vụ cần chờ được nhường cho trình duyệt hoặc Node.js, và kết quả được đẩy về hàng đợi. Event loop là vòng lặp lấy từng tác vụ từ hàng đợi chạy xong rồi lấy tác vụ tiếp theo. Microtask, ví dụ callback của Promise, được ưu tiên chạy ngay sau task hiện tại và trước macrotask như setTimeout. Vì microtask chạy trước vẽ giao diện, quá nhiều microtask có thể làm giao diện bị đơ. Trong phỏng vấn tôi nhấn mạnh điểm này để tránh việc viết code chặn luồng chính.

> Senior tip: Tránh đặt xử lý nặng trong microtask. Nếu cần chạy lâu, hãy chia nhỏ hoặc dùng setTimeout để event loop có thời gian vẽ giao diện và đáp ứng nhập chuột.
`,
  tags: ['javascript', 'event-loop'],
  follow: ['Promise.all', 'queueMicrotask', 'requestAnimationFrame']
},
{
  id: 'frontend-002',
  topic: 'frontend',
  level: 'senior',
  q: 'async/await trong JavaScript hoạt động như thế nào và xử lý lỗi ra sao? So sánh với Java CompletableFuture.',
  a: `**Tóm tắt:** async/await là cú pháp làm việc với Promise nhẹ nhàng hơn. Hàm đánh dấu async luôn trả về một Promise; từ khóa await tạm dừng hàm nhưng không chặn luồng chính, và lỗi được bắt bằng try/catch tương tự Java.

### Cơ chế hoạt động
1. Hàm async chạy đến dòng đầu tiên chứa await, tạm dừng và trả về Promise ngay lập tức.
2. Trình duyệt tiếp tục chạy các tác vụ khác, luồng JS không bị treo.
3. Khi Promise được await hoàn thành, phần còn lại của hàm được xếp vào microtask để chạy tiếp.
4. Lỗi trong hàm async thành Promise bị từ chối (rejected), bắt bằng try/catch.

async/await không tạo luồng mới; nó chỉ viết lại luồng thực thi bằng Promise và microtask dễ hiểu hơn.

### So sánh với Java CompletableFuture
| Đặc điểm | JavaScript async/await | Java CompletableFuture |
|---|---|---|
| Luồng thực thi | 1 luồng chính, không chặn | Có thể dùng pool nhiều luồng |
| Cách chờ | await (dừng hàm, không chặn luồng) | .join()/.get() (chặn luồng gọi) |
| Xử lý lỗi | try/catch | exceptionally / handle |
| Chạy song song | Promise.all | allOf / thenCompose |

### Ví dụ code
~~~text
function layDuLieu(id) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (id > 0) resolve({ id: id, ten: 'San pham ' + id });
      else reject(new Error('ID khong hop le'));
    }, 100);
  });
}

async function hienThi(id) {
  try {
    var sp = await layDuLieu(id);
    console.log(sp.ten);
  } catch (loi) {
    console.log('Loi: ' + loi.message);
  }
}

hienThi(1);
hienThi(-1);
~~~

### Lỗi hay gặp
- Bỏ qua await làm hàm tiếp tục chạy trước khi dữ liệu đến, biến số nhận giá trị undefined.
- Gọi await tuần tự cho các API độc lập làm tổng thời gian chờ bằng tổng từng API, thay vì bằng API chậm nhất. Dùng Promise.all để chạy song song.
- Quên try/catch làm lỗi không được bắt, ứng dụng bị treo mà không báo sai.

### Ví dụ đời thực
Trang chi tiết sản phẩm gọi 3 API độc lập: thông tin sản phẩm (300 ms), đánh giá (200 ms), tồn kho (100 ms). Nếu await tuần tự, tổng là 600 ms. Dùng Promise.all, tổng là khoảng 300 ms (chậm nhất), giảm nửa thời gian chờ của người dùng.

### Trả lời mẫu khi phỏng vấn
async/await là cách viết Promise để đọc hơn. Một hàm async luôn trả về Promise, và await tạm dừng hàm tại chỗ đó đến khi Promise hoàn thành, nhưng không chặn luồng chính của trình duyệt. Lỗi được bắt bằng try/catch, giống Java. Nếu gọi nhiều API độc lập, nên dùng Promise.all thay vì await từng cái một, để không làm chậm giao diện. Tôi cũng luôn bọc await trong try/catch để xử lý lỗi mạng một cách nhất quán.

> Senior tip: await không chặn luồng, nhưng vẫn chỉ chạy trên 1 luồng. Công việc CPU nặng (ví dụ mã hóa hình ảnh lớn) vẫn nên chạy trong Web Worker để tránh làm đơ giao diện.
`,
  tags: ['javascript', 'async-await'],
  follow: ['Promise.all', 'retry', 'top-level await']
},
{
  id: 'frontend-003',
  topic: 'frontend',
  level: 'senior',
  q: 'Closure trong JavaScript là gì và this hoạt động như thế nào? So sánh với Java lambda.',
  a: `**Tóm tắt:** Closure là hàm nhúng giữ được biến của hàm cha ngay sau khi hàm cha đã chạy xong. Từ khóa this trong JavaScript được quyết định theo cách hàm được GỌI, không theo nơi hàm được KHAI BÁO, khác hoàn toàn với Java.

### Closure
Closure xuất hiện khi một hàm con được định nghĩa bên trong hàm và sử dụng biến của hàm. Hàm con "kết lại" biến đó, nên biến vẫn tồn tại ngay sau khi hàm cha hoàn thành.

Ví dụ Java lambda cũng bắt biến từ vùng không gian xung quanh, nhưng Java yêu cầu biến bắt phải là effectively final, trong khi closure JavaScript cho phép thay đổi biến đã bắt.

### this
- Hàm thường: this được gán khi gọi (ví dụ obj.method() thì this là obj).
- Hàm mũi tên (arrow function): không có this riêng, kế thừa this từ hàm bao quanh (lexical this), khác với lambda Java - Java lambda kế thừa this của class bao quanh, còn arrow function kế thừa this từ phạm vi từ vựng (có thể là function, không nhất thiết là class).
- Hàm xử lý sự kiện (click, v.v.) thường bị mất this nếu gán trực tiếp.

### Ví dụ code
~~~text
function taoBoDem() {
  var dem = 0; // biến được closure bỏ nhớ

  return function () {
    dem = dem + 1;
    console.log('Dem: ' + dem);
  };
}

var boDem = taoBoDem();
boDem(); // Dem: 1
boDem(); // Dem: 2

var obj = {
  ten: 'May chu A',
  inTen: function () {
    setTimeout(function () {
      console.log(this.ten); // this là window, không phải obj
    }, 100);
  },
  inTenDung: function () {
    var that = this; // lưu this trước
    setTimeout(function () {
      console.log(that.ten); // May chu A
    }, 100);
  },
  inTenArrow: function () {
    setTimeout(() => {
      console.log(this.ten); // May chu A, arrow lấy this từ ngoài
    }, 100);
  }
};

obj.inTen();
obj.inTenDung();
obj.inTenArrow();
~~~

### Lỗi hay gặp
- Gán hàm xử lý sự kiện trực tiếp (button.onclick = obj.inTen) làm this trở thành nút nhấn, không phải obj.
- Quên rằng var trong closure là biến tham chiếu, nhiều hàm closure chia cùng một biến nếu tạo trong vòng lặp (với let/const thì mỗi vòng lặp có binding riêng).

### Ví dụ đời thực
Một thành phần Vue hiển thị danh sách 1000 mục. Mỗi mục có nút xóa. Nếu gán hàm xóa mất this, bấm xóa bị lỗi 'Cannot read property of undefined' và toàn bộ danh sách không cập nhật được, ảnh hưởng trực tiếp người dùng.

### Trả lời mẫu khi phỏng vấn
Closure là hàm nhúng lại biến của hàm sau khi kết thúc, tương tự lambda Java bắt biến từ vùng ngoài, tuy nhiên Java yêu cầu biến bắt phải effectively final còn JavaScript cho phép thay đổi biến đã bắt. this trong JavaScript được quyết định lúc gọi hàm không lúc khai báo, nên gán hàm làm sự kiện hoặc truyền callback rất dễ mất this. Cách khắc phục phổ biến là dùng arrow function để kế thừa this từ hàm bao quanh, hoặc lưu this vào biến tạm trước khi truyền callback.

> Senior tip: Trong callback sự kiện DOM, hãy dùng arrow function hoặc gọi bind(this) lúc đăng ký sự kiện, để không để this tùy ý cách trình duyệt gọi hàm.
`,
  tags: ['javascript', 'closure'],
  follow: ['bind', 'arrow function', 'memory leak']
},
{
  id: 'frontend-004',
  topic: 'frontend',
  level: 'senior',
  q: 'Trong JavaScript, == và === khác nhau thế nào? So sánh object và mảng với tập hợp trong Java.',
  a: `**Tóm tắt:** == so sánh sau khi ép kiểu hai vế sang cùng kiểu, còn === so sánh trực tiếp không ép kiểu. Object và mảng trong JavaScript so sánh theo tham chiếu (không giống Java so sánh nội dung qua equals).

### == và ===
- ==: ép kiểu trước khi so sánh. Ví dụ '5' == 5 là đúng vì chuỗi '5' được ép thành số 5.
- ===: không ép kiểu, cả giá trị và kiểu phải khớp. '5' === 5 là sai.

### Object và mảng so sánh tham chiếu
Hai object hoặc hai mảng có nội dung giống nhau vẫn được coi là khác nhau nếu chúng là hai đối tượng riêng biệt trong bộ nhớ. Điều này khác Java, nơi List hay Map so sánh nội dung thông qua equals().

### Ví dụ code
~~~text
console.log('5' == 5); // true, ép kiểu
console.log('5' === 5); // false, không ép kiểu
console.log(null == undefined); // true
console.log(null === undefined); // false
console.log([] == []); // false, hai mảng khác nhau ở bộ nhớ
console.log({} == {}); // false, hai object khác nhau

var a = { id: 1 };
var b = a; // cùng tham chiếu
console.log(a == b); // true
console.log(a === b); // true
~~~

### So sánh với Java
| Hành vi | JavaScript | Java |
|---|---|---|
| So sánh giá trị nguyên thủy | === so sánh trực tiếp | == cho nguyên thủy |
| Ép kiểu | == ép kiểu tự động | Không ép kiểu tự động cho == |
| So sánh object/mảng | Tham chiếu (khác nếu khác đối tượng) | equals() so sánh nội dung |

### Lỗi hay gặp
- Dùng == kiểm tra dữ liệu từ input (chuỗi) với số, gây sai lệch nhập liệu.
- So sánh hai mảng bằng === mong đợi nội dung giống nhau, nhưng kết quả luôn sai vì so sánh tham chiếu. Phải duyệt từng phần tử.

### Ví dụ đời thực
Form nhập số lượng sản phẩm. Code viết if (soLuong == 0) nhưng soLuong là chuỗi '0' từ ô input. Với ==, '0' == 0 là đúng nên vẫn chạy. Tuy nhiên đây là thói quen xấu: nên parse sang số trước rồi mới so sánh bằng ===. Nếu dùng if (soLuong === 0) mà quên parse, chuỗi '0' sẽ khác số 0, gây sai logic kiểm tra tồn kho.

### Trả lời mẫu khi phỏng vấn
Toán tử == sẽ ép kiểu hai vế sang cùng kiểu trước khi so sánh, nên '5' == 5 trả về đúng. Toán tử === không ép kiểu, cả giá trị và kiểu phải giống nhau nên '5' === 5 trả về sai. Object và mảng trong JavaScript được so sánh theo tham chiếu: hai object có nội dung giống nhau vẫn khác nhau nếu là hai đối tượng riêng biệt trong bộ nhớ. Điều này khác Java, trong List và Map dùng equals() để so sánh nội dung. Do đó, khi làm việc với dữ liệu từ form hoặc API, tôi luôn dùng === và so sánh đối tượng theo từng trường thay vì so sánh đối tượng trực tiếp.

> Senior tip: Luôn dùng === trong code production. Ép kiểu ngầm của == là nguồn lỗi khó phát hiện, đặc biệt khi dữ liệu từ input luôn là chuỗi.
`,
  tags: ['javascript', 'equality'],
  follow: ['Object.is', 'deep compare', 'Map Set']
},
{
  id: 'frontend-005',
  topic: 'frontend',
  level: 'lead',
  q: 'ES Modules và bundler (như Vite) hoạt động như thế nào ở mức khái niệm? Khi nào cần bundler?',
  a: `**Tóm tắt:** ES Modules là chuẩn module của JavaScript dùng import/export để chia code thành các tập tin nhỏ. Bundler (như Vite) gộp các tập tin này thành ít tập tin lớn hơn để trình duyệt tải nhanh hơn, và chỉ cần khi ứng dụng lớn hoặc cần tối ưu tải.

### ES Modules
- Mỗi tập tin là một module, có phạm vi biến riêng, không bị đụng độ tên toàn cục.
- Xuất bằng export, nhập bằng import. Trình duyệt phân tích câu lệnh import để xây dựng đồ thị module (module graph) và tải đúng thứ tự cần thiết.

### Bundler (Vite)
- Đọc file nhập vào, theo dõi các câu lệnh import, gộp tất thành một hoặc ít tập tin JavaScript.
- Vite ở chế độ phát triển không gộp toàn bộ ứng dụng, mà phục vụ từng module riêng lẻ, nên khởi động nhanh và hỗ trợ HMR (thay đổi module không tải lại trang).
- Khi build cho production, Vite gộp, loại bỏ code không dùng (tree-shaking), và chia nhỏ tập tin (code-splitting) để trình duyệt chỉ tải phần cần thiết.

### Khi nào cần bundler
- Ứng dụng chỉ có ít tập tin: có thể chạy thô trên trình duyệt hiện nay, không cần bundler.
- Ứng dụng lớn, nhiều thư viện ngoài, cần tối ưu kích thước và tốc độ tải: cần bundler.

### Ví dụ code
~~~text
// math.js
export function cong(a, b) {
  return a + b;
}

// app.js
import { cong } from './math.js';

console.log('Tong: ' + cong(2, 3));
~~~

Trình duyệt tải math.js trước, rồi mới chạy app.js vì app.js phụ thuộc vào math.js.

### Lỗi hay gặp
- Quên thêm type="module" vào thẻ script làm trình duyệt không hiểu import/export.
- Import từ đường dẫn sai hoặc thiếu ./ làm trình duyệt tìm module tại gốc trang thay cùng thư mục.
- Dùng biến toàn cục chia sẻ giữa các module làm code khó bảo trì và dễ bị ghi đè.

### Ví dụ đời thực
Một trang quản lý kho hàng có 200 tập tin JavaScript. Nếu không gộp, trình duyệt phải gửi 200 yêu cầu HTTP, mỗi yêu cầu tầm 50 ms, tổng 10 giây chỉ để tải code. Dùng Vite gộp thành 3 tập tin, tổng dung lượng 250 KB sau nén, thời gian tải giảm xuống dưới 1 giây trên mạng 4G.

### Trả lời mẫu khi phỏng vấn
ES Modules là tiêu chuẩn chia code JavaScript thành các tập tin riêng biệt bằng import và export. Mỗi module có biến riêng, không bị xung đột tên toàn cục. Bundler như Vite đọc đồ thị import, gộp các tập tin lại, và cho phát triển nhanh nhờ phục vụ từng module thay vì gộp toàn bộ ứng dụng. Khi build cho sản phẩm, Vite loại bỏ code không dùng và chia nhỏ tập tin để trình duyệt chỉ tải phần cần thiết. Ứng dụng nhỏ chỉ có ít tập tin có thể bỏ qua bundler; ứng dụng lớn thì cần bundler để tối ưu kích thước và tốc độ tải.

> Senior tip: Ở chế độ phát triển, Vite không gộp toàn bộ ứng dụng nên khởi động gần như ngay lập tức, nhưng luôn kiểm tra bản build production vì tree-shaking có thể loại bỏ code bạn còn cho đang sử dụng.
`,
  tags: ['javascript', 'esm', 'vite'],
  follow: ['code splitting', 'HMR', 'import maps']
},
{
  id: 'frontend-006',
  topic: 'frontend',
  level: 'senior',
  q: 'Vue 3 dùng ref và reactive để làm phản ứng dữ liệu như thế nào? Những khác biệt cơ bản giữa hai cách này là gì?',
  a: `**Tóm tắt:** Vue 3 có hệ thống phản ứng (reactivity system) tự động theo dõi dữ liệu và cập nhật giao diện khi dữ liệu thay đổi. ref dùng để gói giá trị nguyên thủy thành đối tượng phản ứng, reactive dùng để biến toàn bộ object thành đối tượng phản ứng; hai cách đều được xây dựng trên Proxy của JavaScript.

### Cơ chế bên trong, từng bước
Vue 3 gói dữ liệu vào một Proxy, đối tượng đặc biệt của JavaScript có thể bắt mọi lần đọc và ghi thuộc tính.
1. Khi bạn tạo ref(0) hoặc reactive({ soLuong: 0 }), Vue gói dữ liệu vào Proxy.
2. Lúc component hiển thị template, Vue đọc các thuộc tính dữ liệu. Proxy ghi nhận: "component này đang sử dụng thuộc tính soLuong".
3. Khi bạn thay đổi dữ liệu (soLuong = 5), Proxy bắt sự kiện ghi, tìm ra các component phụ thuộc và yêu cầu chúng hiển thị lại.
4. Vue chỉ vẽ lại những phần giao diện thực sự thay đổi, không vẽ lại toàn bộ trang.

Vì Proxy là cơ chế nội place của JavaScript, Vue không cần quét lại toàn bộ dữ liệu để biết cái gì thay đổi, nên hiệu năng cao.

### ref và reactive khác nhau ở đâu
| Đặc điểm | ref | reactive |
|---|---|---|
| Dùng cho | Giá trị nguyên thủy (số, chuỗi, boolean) và object | Chỉ dùng cho object |
| Cách truy cập trong script | Phải dùng .value (ví dụ dem.value) | Truy cập trực tiếp (ví dụ state.soLuong) |
| Cách truy cập trong template | Không cần .value (viết dem) | Không cần .value |
| Tạo mới | ref(0), ref({ ten: 'A' }) | reactive({ soLuong: 0 }) |

### Ví dụ code
~~~text
import { ref, reactive } from 'vue';

// ref: gói giá trị vào đối tượng { value: ... }
var dem = ref(0);
console.log('Số hiện tại: ' + dem.value); // 0
dem.value = dem.value + 1;

// reactive: biến toàn bộ object thành phản ứng
var state = reactive({ ten: 'Máy chủ A', soLuong: 0 });
console.log('Tên: ' + state.ten);
state.soLuong = state.soLuong + 1;
~~~

Trong template của Vue, bạn viết dem (không cần .value) và state.soLuong, Vue tự động bổ sung .value khi cần.

### Lỗi hay gặp
- Thêm hoặc xóa thuộc tính mới vào đối tượng reactive sau khi tạo vẫn phản ứng được (Vue 3 dùng Proxy, khác Vue 2 cần Vue.set). Lỗi thường gặp là destructuring reactive object (var { a } = state) hoặc dùng spread ({...state}) làm mất bảo bóc Proxy, biến kết quả không còn phản ứng.
- Gán lại toàn bộ object cho reactive (state = newState) làm mất phản ứng vì biến trong template vẫn trỏ đến object cũ. Cần mutate các thuộc tính thay vì gán mới, hoặc dùng ref chứa object.
- Dùng .value ở trong template (viết dem.value) sẽ hiển thị undefined vì dem đã được auto-unwrap, chỉ dùng .value ở trong script.

### Ví dụ đời thực
Trang danh sách đơn hàng hiển thị tổng số đơn (1000 đơn). Kết thúc một đơn, cộng thêm 1 vào biến dem.ref. Vue cập nhật ngay số hiển thị từ 1000 sang 1001, không cần tải lại trang. Nếu bạn dùng biến thường không có ref, số hiển thị được cập nhật trong bộ nhớ nhưng giao diện vẫn cũ, người dùng thấy dữ liệu sai.

### Trả lời mẫu khi phỏng vấn
Vue 3 sử dụng Proxy để bảo bọc dữ liệu và bắt mọi lần đọc, ghi thuộc tính. ref gói một giá trị thành đối tượng có thuộc tính value, phù hợp cho giá trị nguyên thủy. reactive biến toàn bộ object thành phản ứng, truy cập trực tiếp. Khi dữ liệu thay đổi, Proxy biết thành phần nào sử dụng dữ liệu đó và chỉ cập nhật phần giao diện liên quan. Tôi luôn dùng ref cho giá trị đơn lẻ, reactive cho bộ dữ liệu liên quan nhau, và bổ sung .value ở script nhưng không viết .value ở template.

> Senior tip: Nếu cần thêm thuộc tính động vào object phản ứng, hãy dùng toàn mảng reactive và thêm vào lúc khởi tạo, hoặc dùng ref với một object chứa tất cả trường cần thiết. Không thêm thuộc tính mới sau khi reactive đã được tạo.`,
  tags: ['vue3', 'reactivity', 'ref', 'reactive'],
  follow: ['Proxy', 'ref vs reactive', 'computed'],
},
{
  id: 'frontend-007',
  topic: 'frontend',
  level: 'senior',
  q: 'Composition API và Options API trong Vue 3 khác nhau như thế nào? Khi nào nên dùng cái nào?',
  a: `**Tóm tắt:** Options API tổ chức component theo nhóm tùy chọn (data, methods, computed, mounted...), Composition API nhóm theo tính năng (feature) dùng setup() và ref/reactive. Composition API phù hợp hơn cho component lớn và truyền dụng logic qua composable.

### Cơ chế hoạt động
Options API: Vue tự kết nối các tùy chọn theo tên. Component được chia thành các nhóm phân loại, viết ở nhiều khoảng khác nhau trong cùng một file.
Composition API: tất cả logic viết trong setup(), trả về một đối tượng để template truy cập. Vue chạy setup() một lần khi component tạo ra, lấy kết quả trả về hiển thị.

### Ví dụ code
~~~text
// Options API
export default {
  data() { return { dem: 0 }; },
  methods: { tang() { this.dem = this.dem + 1; } },
  mounted() { console.log('Đã khởi tạo'); }
};

// Composition API
import { ref, onMounted } from 'vue';
export default {
  setup() {
    var dem = ref(0);
    function tang() { dem.value = dem.value + 1; }
    onMounted(function () { console.log('Đã khởi tạo'); });
    return { dem, tang };
  }
};
~~~

### Bảng so sánh
| Đặc điểm | Options API | Composition API |
|---|---|---|
| Tổ chức | Theo loại (data, methods...) | Theo tính năng (feature) |
| Phù hợp | Component nhỏ, đơn giản | Component lớn, phức tạp |
| Truyền dụng logic | Không dễ, phải mixin | Dễ qua composable |
| TypeScript | Hỗ trợ hạn chế | Hỗ trợ tốt |

### Lỗi hay gặp
- Viết setup() quá dài, không chia thành composable, component khó đọc và bảo trì.
- Quên trả về ref/reactive từ setup() làm template không truy cập được.
- Dùng this trong setup() (this không có ý nghĩa ở đây), phải trả về biến cần thiết.

### Ví dụ đời thực
Một trang quản lý đơn hàng có 800 dòng code. Với Options API, logic lấy đơn hàng, lọc đơn hàng, tính tổng tiền nằm ở nhiều khoảng (data, methods, computed), sửa lỗi khó tìm. Với Composition API, bạn viết composable useDonHang() gồm tất cả logic liên quan đến đơn hàng, component gọn hơn ít dòng, sửa lỗi và thêm tính năng mới nhanh hơn.

### Trả lời mẫu khi phỏng vấn
Options API sắp xếp code theo loại tùy chọn như data, methods, computed, mounted, phù hợp với component nhỏ. Composition API viết tất cả logic trong setup(), nhóm theo tính năng, trả về đối tượng để template sử dụng, phù hợp với component lớn và truyền dụng logic qua composable. Nếu component có dưới 100 dòng, Options API đủ dùng; nếu component lớn hoặc cần chia logic nhiều trang sử dụng, chọn Composition API. Tôi luôn chia setup() thành các composable nhỏ để component gọn gàng và dễ kiểm thử.

> Senior tip: Kết hợp hai cách cùng một component là thường xảy ra: Options API cho phần giao diện đơn giản, Composition API cho phần logic phức tạp. Nhưng nếu dự án đã chọn một cách, hãy duy trì nhất quán toàn bộ để không làm đối với mọi người.`,
  tags: ['vue3', 'composition-api', 'options-api'],
  follow: ['composable', 'setup()', 'mixin'],
},
{
  id: 'frontend-008',
  topic: 'frontend',
  level: 'mid',
  q: 'computed và watch trong Vue 3 khác nhau như thế nào? Khi nào nên dùng computed, khi nào nên dùng watch?',
  a: `**Tóm tắt:** computed tính toán giá trị mới dựa trên các giá trị khác và lưu kết quả (cache), watch theo dõi sự thay đổi để thực hiện tác vụ phụ (side effect) như gọi API. computed dùng khi cần giá trị đã xử lý, watch dùng khi cần phản ứng với sự thay đổi.

### Cơ chế hoạt động
computed: phụ thuộc vào ref/reactive, chỉ tính lại khi giá trị phụ thuộc thay đổi, lưu kết quả lại nếu không có gì thay đổi. Như một biến tiền tính toán trong Java.
watch: chạy callback khi giá trị thay đổi, phù hợp cho tác vụ phụ (gọi API, lưu localStorage, thêm sự kiện). Không lưu kết quả, chỉ thực hiện hành động.

### Ví dụ code
~~~text
import { ref, computed, watch } from 'vue';

export default {
  setup() {
    var soLuong = ref(0);
    var donGia = ref(10000);

    // computed: tiền tố tiền hàng, chỉ tính lại khi soLuong hoặc donGia thay đổi
    var thanhTien = computed(function () {
      return soLuong.value * donGia.value;
    });

    // watch: gửi thông báo khi thành tiền thay đổi quá 1 triệu
    watch(thanhTien, function (moi, cu) {
      if (moi > 1000000) {
        console.log('Thành tiền quá 1 triệu: ' + moi);
      }
    });

    return { soLuong, donGia, thanhTien };
  }
};
~~~

### Bảng so sánh
| Đặc điểm | computed | watch |
|---|---|---|
| Mục đích | Tính giá trị đã xử lý | Thực hiện tác vụ phụ |
| Lưu kết quả | Có (cache) | Không |
| Chạy khi | Phụ thuộc thay đổi | Giá trị theo dõi thay đổi |
| Trả về | Giá trị | Không trả về (chạy hàm) |
| Ví dụ | Tính tổng tiền | Gửi thông báo, gọi API |

### Lỗi hay gặp
- Dùng watch để tính toán giá trị có thể dùng computed (không cần cache, code phức tạp hơn cần thiết).
- Quên dọn dẹp side effect trong watch (ví dụ hủy request API khi component bị xoá), làm lọt request và mất bộ nhớ.
- Dùng watch với giá trị không thay đổi, callback chạy lần đầu tiên luôn (nếu có immediate: true).

### Ví dụ đời thực
Trang tìm kiếm sản phẩm. Người dùng nhập từ khóa ở ô nhập. Bạn dùng watch theo dõi từ khóa, mỗi lần nhập gọi API tìm kiếm sau 300 mili-giây (debounce). Nếu dùng computed, API sẽ được gọi mỗi lần tiền tố tiền thành tiền được tính lại, không có nghĩa vì computed không làm side effect. Kết quả: danh sách sản phẩm cập nhật đúng lúc người dùng dừng nhập, không làm trễ trang.

### Trả lời mẫu khi phỏng vấn
computed tính toán giá trị mới dựa trên các giá trị khác và lưu kết quả, chỉ tính lại khi dữ liệu nhập thay đổi, thích hợp tính tổng tiền, lọc danh sách. watch theo dõi sự thay đổi để thực hiện tác vụ phụ như gọi API, gửi thông báo, lưu localStorage. Tôi dùng computed khi cần một giá trị đã xử lý, và dùng watch khi cần phản ứng với sự thay đổi để làm một hành động nào đó. Với tìm kiếm, tôi dùng watch với debounce để không gọi API quá nhiều lần.

> Senior tip: Luôn ưu tiên computed nếu chỉ cần giá trị đã xử lý, chỉ dùng watch khi cần side effect. Nếu gọi API trong watch, hãy dùng debounce và hủy request cũ khi component bị xoá để không làm lọt request và mất bộ nhớ.`,
  tags: ['vue3', 'computed', 'watch'],
  follow: ['debounce', 'immediate', 'deep watch'],
},
{
  id: 'frontend-009',
  topic: 'frontend',
  level: 'senior',
  q: 'Props, emit và v-model trong Vue 3 hoạt động như thế nào? Phân biệt truyền dữ liệu một chiều và hai chiều.',
  a: `**Tóm tắt:** Props truyền dữ liệu từ component cha sang component con, emit gửi sự kiện từ con lên cha, v-model là cách ngắn gọn để hai chiều liên kết dữ liệu giữa cha và con. Props là một chiều (cha -> con), emit là chiều ngược (con -> cha), v-model gộp hai chiều lại.

### Cơ chế hoạt động
Props: cha gõ thuộc tính xuống con, con chỉ đọc, không sửa props trực tiếp (Vue báo lỗi nếu sửa).
Emit: con gọi emit('ten-su-kien', giaTri) để thông báo lên cha, cha lắng nghe và cập nhật state của mình.
v-model: kết hợp props + emit. <con v-model="giaTri" /> tương đương <con :model-value="giaTri" @update:modelValue="giaTri = $event" />.

### Ví dụ code
~~~text
// Component con: ModalChinhSua.vue
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function capNhat(moi) {
      emit('update:modelValue', moi);
    }
    return { capNhat };
  }
};

// Template con
// <input :value="modelValue" @input="capNhat($event.target.value)" />

// Component cha
export default {
  setup() {
    var ten = ref('Nguyen Van A');
    return { ten };
  }
};

// Template cha
// <ModalChinhSua v-model="ten" />
~~~

### Bảng so sánh
| Cách | Hướng | Dùng để |
|---|---|---|
| Props | Cha -> con | Truyền dữ liệu xuống con |
| Emit | Con -> cha | Thông báo sự kiện lên cha |
| v-model | Hai chiều | Liên kết dữ liệu hai chiều |

### Lỗi hay gặp
- Sửa props trực tiếp trong component con, Vue báo lỗi và dữ liệu không cập nhật đúng.
- Quên emit làm cha không biết state đã thay đổi, giao diện bị động lạn.
- Dùng v-model nhiều thuộc tính (v-model:ten, v-model:tuoi) nhưng quên khai báo emits cho mỗi thuộc tính.

### Ví dụ đời thực
Một form chỉnh sửa thông tin người dùng ở modal. Cha mở modal và dùng v-model="thongTinNguoiDung". Con hiển thị ô nhập, người dùng sửa tên, con emit 'update:modelValue' với giá trị mới, cha cập nhật thongTinNguoiDung. Lưu thành công, gửi API cập nhật. Nếu quên emit, người dùng sửa tên nhưng form vẫn hiện tên cũ, nghĩ app bị lỗi.

### Trả lời mẫu khi phỏng vấn
Props truyền dữ liệu từ cha xuống con, con chỉ đọc không sửa trực tiếp. Emit gửi sự kiện từ con lên để cha biết state đã thay đổi. v-model gộp hai chiều, tương đương props modelValue và sự kiện update:modelValue. Tôi dùng props để cấu hình con, emit để con báo lỗi thành công, v-model cho form hai chiều. Luôn khai báo emits cho mỗi sự kiện con gửi lên để Vue kiểm tra đúng.

> Senior tip: Nếu cần nhiều thuộc tính hai chiều, dùng v-model:ten, v-model:tuoi (có thể tên khác modelValue bằng option modelModifiers). Không sửa props trong con, luôn emit để cha cập nhật, tránh dữ liệu bị động lạn giữa các component.`,
  tags: ['vue3', 'props', 'emit', 'v-model'],
  follow: ['v-model', 'emits', 'provide/inject'],
},
{
  id: 'frontend-010',
  topic: 'frontend',
  level: 'lead',
  q: 'Pinia quản lý state trong Vue 3 như thế nào? Khác biệt giữa Pinia và Vuex là gì?',
  a: `**Tóm tắt:** Pinia là thư viện quản lý state chính thức của Vue 3, lưu trạng thái chung cho toàn bộ ứng dụng. Store chứa state (dữ liệu), getter (tính toán từ state), action (thay đổi state, có thể bất đồng bộ gọi API). Các component truy cập và cập nhật dữ liệu chung qua store.

### Cơ chế hoạt động
Pinia tạo store lưu state ở một nơi trung gian. Mọi component cùng store cùng thấy thay đổi nhau.
- state: dữ liệu chung (ví danh sách đơn hàng, thông tin người dùng đăng nhập).
- getter: tính toán từ state (giống computed), ví tổng số đơn hàng.
- action: thay đổi state, có thể gọi API bất đồng bộ, ví thêm đơn hàng, cập nhật thông tin.
Component gọi action, state thay đổi, tất cả component dùng store cập nhật lại giao diện.

### Ví dụ code
~~~text
import { defineStore } from 'pinia';

export const useDonHangStore = defineStore('donhang', {
  state: () => ({
    danhSach: [],
    tong: 0
  }),
  getters: {
    soLuongDon: (state) => state.danhSach.length
  },
  actions: {
    async layDanhSach() {
      var kq = await fetch('/api/don-hang');
      this.danhSach = await kq.json();
      this.tong = this.danhSach.length;
    },
    themDon(don) {
      this.danhSach.push(don);
      this.tong = this.danhSach.length;
    }
  }
});

// Dùng trong component
import { useDonHangStore } from '@/stores/donhang';
export default {
  setup() {
    var store = useDonHangStore();
    console.log('Tổng đơn: ' + store.tong);
    return { store };
  }
};
~~~

### Bảng so sánh Pinia và Vuex
| Đặc điểm | Pinia | Vuex |
|---|---|---|
| Store | Nhiều store, tên khác nhau | Một store trung tâm |
| Action | Bất đồng bộ có bản | Bất động bộ có bản (không cần plugin) |
| TypeScript | Hỗ trợ tốt | Hỗ trợ tốt nhưng phức tạp hơn |
| Trạng thái | Chính thức Vue 3 | Đã giữ nguyên, không phát triển thêm |

### Lỗi hay gặp
- Thực hiện side effect (gọi API) trực tiếp trong component thay vì action, component khó kiểm thử và dính chéo.
- Lưu dữ liệu quá lớn vào store (ví danh sách 10000 bản ghi) làm hiệu năng giảm, chỉ lưu dữ liệu thực sự chung.

### Ví dụ đời thực
Một trang mua sách online có giỏ hàng. Người dùng thêm sách ở trang chi tiết, giỏ hàng ở header cập nhật luôn luôn. Pinia lưu giỏ hàng ở store chung, tất cả component thấy giỏ hàng hết số lượng sách. Sau 3 tháng, tổng số lượt thêm vào giỏ tăng lên 20000 đơn, trang hoạt động ổn định, không bị mất dữ liệu giỏ hàng khi chuyển trang.

### Trả lời mẫu khi phỏng vấn
Pinia là thư viện quản lý state chính thức của Vue 3, lưu trạng thái chung cho toàn ứng dụng. Store chứa state dữ liệu, getter tính toán từ state, action thay đổi state và có thể gọi API bất đồng bộ. Các component cùng store thấy thông tin nhau, cập nhật giao diện khi state thay đổi. Pinia khác Vuex ở chỗ cho phép nhiều store, hỗ trợ action bất đồng bộ có bản, và được ưu tiên cho Vue 3. Tôi dùng Pinia cho dữ liệu chung như thông tin người dùng, giỏ hàng, danh sách đơn hàng.

> Senior tip: Chia store theo tính năng (donhang, nguoidung, giohang) thay vì một store to. Chỉ lưu dữ liệu thực sự chung vào store, dữ liệu của một component lưu ở component. Khi gọi API trong action, luôn bắt lỗi và hiển thị thông báo người dùng hiểu được.`,
  tags: ['vue3', 'pinia', 'state-management', 'vuex'],
  follow: ['store', 'getter', 'action', 'vuex vs pinia']
},
{
  id: 'frontend-011',
  topic: 'frontend',
  level: 'senior',
  q: 'Vòng đời component trong Vue 3 (onMounted, onUnmounted, onUpdated...) hoạt động như thế nào? So sánh với lifecycle class component trong React hoặc @PostConstruct/@PreDestroy trong Spring.',
  a: `**Tóm tắt:** Vue 3 cung cấp các hook vòng đời trong Composition API (onMounted, onUnmounted, onUpdated, onBeforeMount, onBeforeUnmounted...) để chạy code tại các thời điểm chính xác của component. Giống @PostConstruct/@PreDestroy trong Spring, nhưng chạy trên luồng UI và gắn liền với việc render.
 
### Các hook chính và thứ tự chạy
1. onBeforeMount: chạy ngay trước component được gắn vào DOM, dữ liệu đã sẵn sàng nhưng DOM chưa có.
2. onMounted: chạy sau khi component đã có trong DOM, đây là lúc thường gọi API, thêm sự kiện DOM, khởi tạo thư viện thứ ba.
3. onBeforeUpdate: chạy khi dữ liệu thay đổi, trước khi DOM được cập nhật.
4. onUpdated: chạy sau khi DOM đã cập nhật xong do dữ liệu thay đổi.
5. onBeforeUnmount: chạy trước khi component bị xoá khỏi DOM, dùng để dọn dẹp (hủy timer, hủy đăng ký sự kiện, hủy WebSocket).
6. onUnmounted: chạy sau khi component đã bị xoá hoàn toàn.
 
### So sánh với Spring và React
| Đặc điểm | Vue 3 (Composition API) | Spring Bean | React Class Component |
|---|---|---|---|
| Khởi tạo | onMounted | @PostConstruct | componentDidMount |
| Hủy | onUnmounted | @PreDestroy | componentWillUnmount |
| Cập nhật | onUpdated | Không có khái niệm tương đương | componentDidUpdate |
| Phạm vi | Component UI | Bean toàn ứng dụng | Component UI |
 
### Ví dụ code
~~~text
import { ref, onMounted, onUnmounted, onUpdated } from 'vue';
 
export default {
  setup() {
    var thoiGian = ref(0);
    var timerId = null;
 
    onMounted(function () {
      console.log('Component đã gắn vào DOM');
      timerId = setInterval(function () {
        thoiGian.value = thoiGian.value + 1;
      }, 1000);
    });
 
    onUnmounted(function () {
      console.log('Component sắp bị xoá, dọn dẹp timer');
      clearInterval(timerId);
    });
 
    onUpdated(function () {
      console.log('DOM đã cập nhật, thời gian: ' + thoiGian.value);
    });
 
    return { thoiGian };
  }
};
~~~
 
### Lỗi hay gặp
- Quên clearInterval/clearTimeout trong onUnmounted gây rò rỉ bộ nhớ và callback chạy trên component đã chết.
- Gọi API trong onBeforeMount thay vì onMounted, component có thể bị xoá trước khi API xong dẫn đến lỗi cập nhật state trên component không còn tồn tại.
- Thực hiện side effect nặng trong onUpdated (ví dụ gọi API) gây vòng lặp vô hạn vì cập nhật state lại kích hoạt onUpdated.
 
### Ví dụ đời thực
Một dashboard theo dõi server real-time dùng WebSocket. onMounted mở kết nối, onUnmounted đóng kết nối. Nếu quên đóng trong onUnmounted, mỗi lần người dùng vào/ra trang dashboard tạo thêm một kết nối WebSocket. Sau 50 lần, server có 50 kết nối rác từ cùng một trình duyệt, tốn tài nguyên và làm chậm push dữ liệu thật.
 
### Trả lời mẫu khi phỏng vấn
Vue 3 cung cấp các hook vòng đời như onMounted, onUnmounted, onUpdated... trong Composition API. onMounted chạy sau khi component có trong DOM, dùng để gọi API, khởi tạo thư viện, thêm sự kiện. onUnmounted chạy trước khi xoá component, bắt buộc dùng để dọn dẹp timer, WebSocket, event listener. onUpdated chạy sau DOM cập nhật. Giống @PostConstruct/@PreDestroy trong Spring nhưng gắn liền với render UI. Tôi luôn dọn dẹp tài nguyên trong onUnmounted để tránh rò rỉ bộ nhớ.
 
> Senior tip: Không dùng onUpdated để gọi API hoặc thay đổi state, rất dễ gây vòng lặp vô hạn. Nếu cần phản ứng với thay đổi dữ liệu, hãy dùng watch hoặc computed thay vì onUpdated.`,
  tags: ['vue3', 'lifecycle', 'onMounted', 'onUnmounted'],
  follow: ['onBeforeMount', 'onErrorCaptured', 'keep-alive']
},
{
  id: 'frontend-012',
  topic: 'frontend',
  level: 'senior',
  q: 'Vue Router navigation guard (beforeEach, beforeResolve, afterEach) dùng để làm gì? Viết guard kiểm tra quyền truy cập trang admin (chỉ cho phép role ADMIN).',
  a: `**Tóm tắt:** Navigation guard trong Vue Router cho phép chặn, cho phép hoặc chuyển hướng điều hướng trước khi trang thực sự hiển thị. beforeEach chạy trước mọi điều hướng, beforeResolve chạy sau khi các component async đã tải xong, afterEach chạy sau khi điều hướng hoàn tất (không thể chặn). Dùng để kiểm tra đăng nhập, phân quyền, tải dữ liệu trước, ghi log.
 
### Ba loại guard chính
- beforeEach(to, from, next): chạy đầu tiên, có thể next() cho phép, next(false) hủy, next('/login') chuyển hướng. Phù hợp kiểm tra token, role.
- beforeResolve(to, from, next): chạy sau beforeEach và sau khi các component lazy-load đã resolve. Dùng khi cần dữ liệu component trước khi quyết định cho phép.
- afterEach(to, from): chạy sau điều hướng xong, không có next(), không thể chặn. Dùng cho analytics, scroll to top, đóng loading.
 
### So sánh với Spring Security Filter Chain
| Vue Router Guard | Spring Security Filter |
|---|---|
| beforeEach | Filter đầu tiên (SecurityContextPersistenceFilter) |
| beforeResolve | Filter sau khi Authentication đã xác thực |
| afterEach | Filter cuối (LoggingFilter) |
Cả hai đều chạy theo chuỗi, có thể chặn request/điều hướng sớm.
 
### Ví dụ code: Guard phân quyền admin
~~~text
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
 
const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/admin', component: () => import('@/views/Admin.vue'), meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/user', component: () => import('@/views/User.vue'), meta: { requiresAuth: true } }
];
 
const router = createRouter({
  history: createWebHistory(),
  routes
});
 
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
 
  // Chờ auth khởi tạo xong (nếu load token từ localStorage)
  if (!auth.initialized) {
    await auth.init();
  }
 
  // Trang công khai
  if (!to.meta.requiresAuth) {
    return next();
  }
 
  // Chưa đăng nhập -> về login
  if (!auth.token) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
 
  // Kiểm tra role
  const requiredRoles = to.meta.roles || [];
  if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
    return next({ path: '/403' }); // Không đủ quyền
  }
 
  // Đủ điều kiện
  next();
});
 
router.afterEach((to, from) => {
  // Ghi log, scroll top, analytics
  window.scrollTo(0, 0);
});
~~~
 
### Lỗi hay gặp
- Gọi next() nhiều lần trong một guard (ví dụ trong if/else quên return) gây lỗi "Navigation guard called next() multiple times".
- Quên await cho async function trong beforeEach, guard chạy xong trước khi dữ liệu sẵn sàng.
- Đặt logic phân quyền phức tạp trong component (mounted) thay vì guard, người dùng thấy trang lóe lên rồi bị chuyển hướng.
- Không xử lý trường hợp token hết hạn trong guard, dẫn đến API 401 lặp lại.
 
### Ví dụ đời thực
Hệ thống quản lý đơn hàng có 3 vai trò: ADMIN (xem tất cả), MANAGER (xem khu vực), STAFF (xem đơn của mình). Dùng beforeEach kiểm tra to.meta.roles. Nếu STAFF truy cập /admin, guard chuyển về /403 trong 50 ms, người dùng không bao giờ thấy giao diện admin. Log ghi nhận 1200 lần truy cập trái phép/tháng từ nhân viên mới, giúp team bảo mật audit.
 
### Trả lời mẫu khi phỏng vấn
Vue Router có ba guard chính: beforeEach chạy trước mọi điều hướng, dùng để kiểm tra đăng nhập và phân quyền; beforeResolve chạy sau khi component async đã tải, dùng khi cần dữ liệu component trước khi quyết định; afterEach chạy sau khi xong, dùng cho analytics. Để phân quyền admin, tôi thêm meta.roles: ['ADMIN'] vào route, trong beforeEach đọc authStore, nếu chưa đăng nhập chuyển về /login, nếu đăng nhập nhưng role không khớp chuyển về /403. Luôn return next() để tránh gọi nhiều lần.
 
> Senior tip: Đăng ký guard ở cấp router (router.beforeEach) thay vì per-route (beforeEnter) để logic tập trung, dễ bảo trì. Nếu app lớn, hãy tách guard thành file riêng (guards/auth.js, guards/permission.js) và import vào router.`,
  tags: ['vue3', 'vue-router', 'navigation-guard', 'auth', 'authorization'],
  follow: ['beforeEnter', 'lazy loading', 'scrollBehavior']
},
{
  id: 'frontend-013',
  topic: 'frontend',
  level: 'mid',
  q: 'provide/inject trong Vue 3 dùng để làm gì? Khác biệt với props truyền nhiều cấp (prop drilling) như thế nào?',
  a: `**Tóm tắt:** provide/inject cho phép component cha cung cấp dữ liệu/hàm cho bất kỳ component con cháu nào mà không cần truyền qua props từng cấp. Giải quyết vấn đề prop drilling (truyền props qua nhiều tầng component trung gian không cần dùng đến). Tương tự Dependency Injection trong Spring (@Autowired), nhưng ở cấp component UI.
 
### Cơ chế hoạt động
1. Component cha (hoặc tổ tiên) gọi provide('key', value) trong setup(). Value có thể là ref, reactive, hàm, object.
2. Component con cháu bất kỳ gọi inject('key') để nhận value. Mặc định inject không phản ứng, nếu cần phản ứng hãy provide một ref hoặc reactive.
3. Nếu không tìm thấy key, inject trả về undefined (hoặc giá trị mặc định inject('key', defaultValue)).
 
### So sánh provide/inject vs Prop Drilling
| Đặc điểm | Prop Drilling | provide/inject |
|---|---|---|
| Cách truyền | Props qua từng component trung gian | Cha provide, cháu inject trực tiếp |
| Component trung gian | Phải khai báo props, truyền tiếp | Không cần biết, không khai báo gì |
| Phản ứng | Tự động (props luôn phản ứng) | Cần provide ref/reactive mới phản ứng |
| TypeScript | Dễ infer type | Cần InjectionKey để type-safe |
| Phù hợp | 1-2 cấp, dữ liệu cục bộ | Nhiều cấp, dữ liệu toàn cục/theme/i18n |
 
### Ví dụ code
~~~text
import { ref, provide, inject, computed } from 'vue';
 
// Key duy nhất để tránh trùng lặp, dùng Symbol cho type-safe
const THEME_KEY = Symbol('theme');
 
// Component gốc App.vue
export default {
  setup() {
    var theme = ref('light'); // ref để con cháu thay đổi được
 
    function doiTheme() {
      theme.value = theme.value === 'light' ? 'dark' : 'light';
    }
 
    provide(THEME_KEY, { theme, doiTheme });
    return { theme, doiTheme };
  }
};
 
// Component con cháu bất kỳ (Button.vue, Card.vue, Modal.vue...)
export default {
  setup() {
    // inject trả về object { theme: ref, doiTheme: function }
    const { theme, doiTheme } = inject(THEME_KEY, { theme: ref('light'), doiTheme: () => {} });
    return { theme, doiTheme };
  }
};
 
// Template Button.vue
// <button @click="doiTheme" :class="theme">Chuyển theme</button>
~~~
 
### Lỗi hay gặp
- Provide giá trị nguyên thủy (string, number) thay vì ref/reactive: con cháu inject được nhưng khi cha thay đổi, con không cập nhật (mất phản ứng).
- Quên cung cấp giá trị mặc định cho inject: component dùng inject nhưng không có ancestor provide -> undefined, gây lỗi runtime.
- Lạm dụng provide/inject cho mọi thứ: chỉ dùng cho dữ liệu thực sự chia sẻ rộng (theme, locale, user info, config). Dữ liệu cục bộ 1-2 cấp nên dùng props.
 
### Ví dụ đời thực
Ứng dụng admin có 50 component. Theme (light/dark) và ngôn ngữ (vi/en) cần dùng ở khắp nơi: header, sidebar, modal, table, form. Nếu dùng props, 50 component đều phải khai báo theme, locale, và 20 component trung gian phải truyền tiếp. Dùng provide/inject: App.vue provide một lần, 50 component inject trực tiếp, không component trung gian nào phải sửa code. Thêm theme mới chỉ sửa App.vue.
 
### Trả lời mẫu khi phỏng vấn
provide/inject cho phép component cha chia sẻ dữ liệu cho con cháu bất kỳ mà không truyền qua props. Cha gọi provide(key, value), cháu gọi inject(key). Giá trị nên là ref hoặc reactive để giữ phản ứng. Khác với prop drilling: prop drilling buộc component trung gian khai báo và truyền props, provide/inject bỏ qua trung gian. Tương tự DI trong Spring: cha là container, provide là đăng ký bean, inject là @Autowired. Tôi dùng cho theme, locale, user info, config toàn cục.
 
> Senior tip: Luôn dùng Symbol làm key (const KEY = Symbol('name')) để tránh trùng lặp và hỗ trợ TypeScript tốt. Đặt giá trị mặc định cho inject để component có thể test độc lập không cần ancestor.`,
  tags: ['vue3', 'provide', 'inject', 'dependency-injection'],
  follow: ['InjectionKey', 'prop drilling', 'global store vs provide']
},
{
  id: 'frontend-014',
  topic: 'frontend',
  level: 'senior',
  q: 'Slots trong Vue 3 (default slot, named slot, scoped slot) hoạt động như thế nào? Viết component Card có header, content, footer tùy chỉnh.',
  a: `**Tóm tắt:** Slot là chỗ trống trong component con để component cha truyền nội dung (HTML, component khác) vào. Default slot dùng khi có một nội dung duy nhất. Named slot (slot name="ten") cho phép nhiều khu vực nội dung riêng biệt. Scoped slot (v-slot:ten="props") cho phép component con truyền dữ liệu ra cho component cha quyết định hiển thị như thế nào. Giống children trong React nhưng mạnh hơn nhờ named slot và scoped slot.
 
### Ba loại slot
1. Default slot: <slot /> hoặc <slot>nội dung mặc định</slot>. Cha truyền nội dung không tên: <Child>nội dung</Child>.
2. Named slot: <slot name="header" />. Cha truyền: <template #header>nội dung header</template>.
3. Scoped slot: <slot name="item" :data="item" :index="index" />. Cha nhận props: <template #item="{ data, index }">...</template>.
 
### So sánh với React children
| Vue Slot | React |
|---|---|
| Default slot | props.children |
| Named slot | props.header, props.footer (cần tự quy ước) |
| Scoped slot | Render props pattern (props.renderItem(item)) |
Vue slot là first-class citizen, declarative trong template, React dùng JSX pattern.
 
### Ví dụ code: Component Card
~~~text
// Card.vue
export default {
  props: ['title'],
  setup(props, { slots }) {
    return () => (
      <div class="card">
        <div class="card-header">
          {slots.header ? slots.header() : props.title}
        </div>
        <div class="card-body">
          {slots.default ? slots.default() : 'Không có nội dung'}
        </div>
        <div class="card-footer">
          {slots.footer ? slots.footer() : ''}
        </div>
      </div>
    );
  }
};
 
// Hoặc viết template (thông dụng hơn)
~~~
 
~~~text
<!-- Card.vue template -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">{{ title }}</slot>
    </div>
    <div class="card-body">
      <slot>Không có nội dung</slot>
    </div>
    <div class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
 
<script>
export default { props: ['title'] };
</script>
 
<!-- Sử dụng Card.vue -->
<Card title="Đơn hàng #123">
  <template #header>
    <h3>Đơn hàng #123</h3>
    <Badge>Chờ xử lý</Badge>
  </template>
 
  <template #default>
    <OrderItems :items="donHang.items" />
  </template>
 
  <template #footer>
    <Button @click="huyDon">Hủy</Button>
    <Button variant="primary" @click="xemChiTiet">Xem chi tiết</Button>
  </template>
</Card>
~~~
 
### Scoped slot ví dụ: Bảng có thể tùy chỉnh cột
~~~text
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr><th>STT</th><th>Tên</th><th>Thao tác</th></tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in items" :key="item.id">
        <td>{{ index + 1 }}</td>
        <td>{{ item.ten }}</td>
        <td>
          <slot name="actions" :item="item" :index="index">
            <button>Mặc định</button>
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
 
<!-- Cha tùy chỉnh cột actions -->
<DataTable :items="danhSach">
  <template #actions="{ item, index }">
    <Button @click="sua(item)">Sửa</Button>
    <Button danger @click="xoa(item)">Xóa</Button>
  </template>
</DataTable>
~~~
 
### Lỗi hay gặp
- Quên kiểm tra slots.name trước khi render, slot trống vẫn tạo element wrapper rỗng làm CSS lệch.
- Dùng scoped slot nhưng quên destructure props trong v-slot: <template #actions="props"> phải dùng props.item thay vì item.
- Truyền quá nhiều dữ liệu qua scoped slot làm component cha phụ thuộc chặt vào cấu trúc dữ liệu con, khó tái cấu trúc.
 
### Ví dụ đời thực
Thư viện component nội bộ có DataTable dùng scoped slot cho cột actions. 15 trang dùng DataTable, mỗi trang tùy chỉnh nút Sửa/Xóa/Xem/In khác nhau. Khi yêu cầu thêm nút "Xuất Excel", team chỉ cập nhật DataTable.vue thêm slot action mặc định, 15 trang không cần sửa code. Nếu không có scoped slot, DataTable phải nhận mảng config cột phức tạp, khó bảo trì.
 
### Trả lời mẫu khi phỏng vấn
Vue có ba loại slot: default slot cho một nội dung, named slot cho nhiều khu vực (header, footer), scoped slot cho phép con truyền dữ liệu ra để cha quyết định render. Card component dùng named slot header, default, footer. DataTable dùng scoped slot truyền item, index ra để cha tự render nút hành động. Khác React children: Vue slot declarative trong template, hỗ trợ named và scoped sẵn. Tôi dùng slot để component linh hoạt, cha quyết định UI, con chỉ lo khung và logic.
 
> Senior tip: Luôn đặt nội dung mặc định trong <slot>nội dung mặc định</slot> cho default/named slot. Với scoped slot, hãy định nghĩa rõ ràng props truyền ra (item, index, v.v.) và ghi chú JSDoc để IDE gợi ý cho người dùng component.`,
  tags: ['vue3', 'slot', 'named-slot', 'scoped-slot'],
  follow: ['slot fallback', 'dynamic slot name', 'renderless component']
},
{
  id: 'frontend-015',
  topic: 'frontend',
  level: 'lead',
  q: 'Async component (defineAsyncComponent), Suspense và Teleport trong Vue 3 giải quyết vấn đề gì? Khi nào nên dùng từng cái?',
  a: `**Tóm tắt:** Ba tính năng nâng cao của Vue 3: defineAsyncComponent tải component khi cần (code splitting), Suspense hiển thị fallback trong khi chờ async component/async setup, Teleport render nội dung vào DOM node khác (modal, tooltip). Ba cái cùng mục đích: cải thiện trải nghiệm tải và vị trí render.
 
### defineAsyncComponent (Code Splitting)
Cho phép chia nhỏ bundle, chỉ tải component khi thực sự cần. Mặc định Vue tải lazy (khi component được render lần đầu).
 
~~~text
import { defineAsyncComponent } from 'vue';
 
// Tải khi cần, có loading/error/delay/timeout
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200, // Chỉ hiện loading sau 200ms (tránh nháy)
  timeout: 10000 // 10s timeout -> hiện error
});
 
// Dùng trong template: <HeavyChart />
~~~
 
### Suspense (Chờ async)
Bọc component có setup() async hoặc async component, hiển thị #fallback trong khi chờ. Cần đặt ở component cha.
 
~~~text
<!-- Parent.vue -->
<template>
  <Suspense>
    <template #default>
      <Dashboard />  <!-- Dashboard.setup() là async, hoặc dùng HeavyChart -->
    </template>
    <template #fallback>
      <PageSkeleton />  <!-- Hiển thị khi chờ -->
    </template>
  </Suspense>
</template>
 
<!-- Dashboard.vue -->
<script>
export default {
  async setup() {
    const data = await fetchDashboardData(); // Chờ dữ liệu xong mới render
    return { data };
  }
};
</script>
~~~
 
### Teleport (Dịch chuyển DOM)
Render nội dung template vào DOM node khác (thường là body) thay vì vị trí component. Dùng cho modal, tooltip, dropdown, toast để tránh vấn đề z-index, overflow: hidden, stacking context.
 
~~~text
<!-- Modal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="hienThi">
      <div class="modal-box">
        <slot />
        <button @click="$emit('close')">Đóng</button>
      </div>
    </div>
  </Teleport>
</template>
 
<script>
export default { props: ['hienThi'], emits: ['close'] };
</script>
 
<!-- Dùng: <Modal :hienThi="show" @close="show=false">Nội dung</Modal> -->
~~~
 
### Bảng so sánh khi dùng cái nào
| Tính năng | Vấn đề giải quyết | Khi nào dùng |
|---|---|---|
| defineAsyncComponent | Bundle quá lớn, tải chậm trang đầu | Component nặng (biểu đồ, editor, bản đồ), trang ít truy cập |
| Suspense | UI nháy, layout shift khi chờ dữ liệu | Trang cần dữ liệu trước khi hiển thị, tránh spinner lẻ tẻ |
| Teleport | Modal bị cắt bởi overflow, z-index loạn | Modal, tooltip, dropdown, toast cần hiển thị trên tất cả |
 
### Lỗi hay gặp
- Dùng Suspense mà quên component con có async setup hoặc defineAsyncComponent -> Suspense không chờ, fallback không hiện.
- Teleport to="body" nhưng body chưa sẵn sàng (SSR) hoặc multiple root app -> Teleport không tìm thấy target. Cần to="#modal-root" với &lt;div id="modal-root"&gt;&lt;/div&gt; trong index.html.
- Async component không có errorComponent: khi mạng lỗi, ứng dụng trắng trang không thông báo.
- Lồng Suspense trong Suspense không cần thiết, chỉ một cấp cha đủ.
 
### Ví dụ đời thực
Trang admin có Dashboard (tải 5 widget), Báo cáo (biểu đồ nặng 300KB), Cài đặt. Dùng defineAsyncComponent cho Báo cáo: bundle chính giảm từ 450KB xuống 150KB, First Contentful Paint cải thiện từ 2.1s xuống 1.3s. Dashboard dùng Suspense với PageSkeleton: người dùng thấy khung sườn ngay 0.8s, dữ liệu đổ vào 1.5s, không bị layout shift. Modal xác nhận xóa dùng Teleport to="#modal-root": không bị cắt bởi sidebar overflow: hidden, z-index luôn trên cùng.
 
### Trả lời mẫu khi phỏng vấn
defineAsyncComponent chia nhỏ bundle, tải component khi cần (lazy load), cấu hình loading/error/delay/timeout. Suspense bọc component async (setup async hoặc async component), hiển thị fallback cho đến khi xong, tránh spinner rải rác. Teleport render nội dung vào DOM node khác (body hoặc #modal-root), giải quyết modal bị cắt bởi overflow/z-index. Tôi dùng async component cho trang nặng, Suspense cho trang cần dữ liệu trước khi hiện, Teleport cho modal/tooltip. Ba tính năng cùng hướng tới UX mượt mà hơn.
 
> Senior tip: Kết hợp ba cái: defineAsyncComponent tải component, Suspense chờ component đó xong (kèm dữ liệu async setup), Teleport đảm bảo modal hiển thị đúng chỗ. Trong vite.config.js, hãy cấu hình manualChunks để tách vendor và async component thành file riêng, tránh duplicate code.`,
  tags: ['vue3', 'async-component', 'suspense', 'teleport', 'code-splitting'],
  follow: ['defineAsyncComponent options', 'Suspense events', 'Teleport SSR']
},
{
  id: 'frontend-016',
  topic: 'frontend',
  level: 'lead',
  q: 'Gọi REST API bằng axios trong SPA Vue cần làm gì để an toàn? Hãy trình bày interceptor gắn JWT, cách xử lý refresh token khi hết hạn, xử lý phản hồi 401, và so sánh lưu token ở bộ nhớ trong, localStorage và cookie HttpOnly.',
  a: `**Tóm tắt:** axios là thư viện JavaScript gọi HTTP từ trình duyệt, tương tự RestTemplate hoặc WebClient trong Spring. Interceptor là hàm can thiệp trước khi yêu cầu gửi đi và sau khi phản hồi về, giống Spring Servlet Filter. JWT (JSON Web Token) là mã thông báo đăng nhập do server ký, client không thể giả mạo. XSS (Cross-Site Scripting) là lỗ hổng cho attacker chèn JavaScript vào trang để trộm token. Nên lưu access token ở bộ nhớ trong của JavaScript hoặc cookie HttpOnly, không để trong localStorage vì JavaScript đọc được localStorage và attacker có thể trộm qua XSS.

### Gọi API bằng axios, từng bước

1. Tạo axios instance với baseURL và timeout, dùng chung cho mọi yêu cầu (giống cấu hình RestTemplate một lần).
2. Gọi axios.get(...) trả về Promise (giống CompletableFuture Java): .then xử lý thành công, .catch xử lý lỗi.
3. Phản hồi có data (nội dung JSON đã chuyển đổi), status (200, 401, 500…), headers.
4. Lỗi mạng hoặc server 4xx/5xx đều ném vào .catch.

~~~text
import axios from 'axios';

var api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000 // dùng 10 giây, quá thời gian sẽ bỏ qua
});

api.get('/san-pham?trang=1&kichThuoc=20')
  .then(function (phanHoi) {
    console.log('Danh sách: ' + JSON.stringify(phanHoi.data));
  })
  .catch(function (loi) {
    console.log('Lỗi gọi API: ' + loi.message);
  });
~~~

phanHoi.data là mảng hoặc object JSON đã được axios chuyển đổi tự động, không cần JSON.parse như fetch thuần.

### Interceptor gắn JWT vào mọi yêu cầu

Sau khi đăng nhập, server trả JWT. Client lưu vào biến, interceptor request gắn header Authorization: Bearer <jwt> trước mỗi lần gửi. Không phải gắn thủ công ở mỗi axios.get, giảm lỗi quên và tập trung ở một nơi (giống Filter hoặc ControllerAdvice tập trung).

~~~text
var token = null; // bộ nhớ trong, mất khi tải lại trang
var refreshToken = null; // mã dài hạn để đổi access token mới

api.interceptors.request.use(function (config) {
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
}, function (loi) {
  return Promise.reject(loi);
});
~~~

### Refresh token và xử lý 401

401 Unauthorized nghĩa là chưa xác thực hoặc JWT hết hạn. Refresh token là mã dài hạn (ví dụ 7 ngày) dùng để đổi JWT mới mà không bắt người dùng nhập lại mật khẩu.

Khi nhận 401: gọi POST /auth/refresh với refresh token; nếu thành công, lưu JWT mới và gửi lại yêu cầu cũ; nếu refresh cũng hết hạn, xóa token và về trang đăng nhập. Đánh dấu yêu cầu đã thử lại (_retry = true) để tránh vòng lặp vô hạn.

~~~text
api.interceptors.response.use(function (phanHoi) {
  return phanHoi;
}, async function (loi) {
  var yeuCau = loi.config;
  if (loi.response && loi.response.status === 401 && !yeuCau._retry) {
    yeuCau._retry = true;
    try {
      var moi = await api.post('/auth/refresh', { refreshToken: refreshToken });
      token = moi.data.accessToken;
      yeuCau.headers.Authorization = 'Bearer ' + token;
      return api(yeuCau); // gửi lại yêu cầu cũ
    } catch (loiRefresh) {
      token = null;
      window.location.href = '/dang-nhap';
      return Promise.reject(loiRefresh);
    }
  }
  return Promise.reject(loi);
});
~~~

### Lưu token ở đâu

| Vị trí | JavaScript đọc được | XSS trộm được | Gửi tự động | Ghi chú |
|---|---|---|---|---|
| Biến JS (bộ nhớ trong) | Có | Có | Không | Mất khi tải lại trang |
| localStorage | Có | Có | Không | Không lưu JWT nhạy cảm |
| Cookie HttpOnly | Không | Không | Có | Cần SameSite và CSRF token |

Biến JS và localStorage đều có thể bị XSS đọc (XSS chạy JavaScript trong trang). Cookie HttpOnly JavaScript không đọc được, nên XSS không trộm được token, nhưng trình duyệt tự động gửi cookie với mỗi yêu cầu đến cùng domain, cần CSRF protection (SameSite cookie, CSRF token).

Phòng XSS: không dùng innerHTML với dữ liệu người dùng, dùng v-text của Vue (tự thoát), sanitize HTML, đặt header Content-Security-Policy.

### Lỗi hay gặp

- Lưu JWT trong localStorage: XSS trộm được token, attacker gọi API thay người dùng.
- Quên đánh dấu _retry: mỗi lần 401 gọi refresh, refresh lại 401, vòng lặp vô hạn.
- Refresh token lưu cùng chỗ với access token, hoặc quá dài hạn.
- Gắn token cho mọi domain (bao gồm API thứ ba): token rò rỉ ra ngoài mạng.
- Xử lý 401 tại mỗi component thay vì interceptor: code phân tán, không bao giờ hết.

### Ví dụ đời thực

Hệ thống quản lý đơn hàng, 2000 nhân viên. JWT access token hết hạn sau 15 phút, refresh token 7 ngày. Nhân viên làm việc hết ngày trong một tab: lúc 10h00 JWT hết hạn, axios tự gọi /auth/refresh, lấy JWT mới, gửi lại yêu cầu lấy đơn hàng, người dùng không biết gì. Nếu không xử lý 401, yêu cầu bị từ chối, trang báo lỗi 401 lặp lại.

### Trả lời mẫu khi phỏng vấn

axios là thư viện gọi HTTP ở trình duyệt, trả về Promise như CompletableFuture Java. Tôi dùng interceptor request để gắn header Authorization: Bearer JWT vào mọi yêu cầu, không cần gắn tay ở mỗi nút. Khi server trả 401 (JWT hết hạn), interceptor response gọi /auth/refresh để lấy JWT mới, lưu và gửi lại yêu cầu cũ; nếu refresh cũng hết hạn, xóa token và chuyển về trang đăng nhập. Đánh dấu yêu cầu đã thử lại (_retry) để tránh vòng lặp vô hạn. Về lưu trữ, tôi ưu tiên biến JS hoặc cookie HttpOnly (XSS không đọc được), không lưu JWT trong localStorage; đều phải chống XSS (không dùng innerHTML với dữ liệu người dùng) và CSRF (SameSite cookie).

> Senior tip: JWT hết hạn ngắn (15 phút) giúp giảm nguy cơ nếu token bị mất, nhưng phải có refresh token để không phải nhập mật khẩu liên tục. CORS không thay thế Spring Security: CORS chỉ chuyên ở trình duyệt, an toàn thực sự ở server (kiểm tra JWT, phân quyền).`,
  tags: ['axios', 'jwt', 'refresh-token', 'xss', 'security'],
  follow: ['refresh token', 'cookie HttpOnly', 'xử lý 401 tự động']
},
{
  id: 'frontend-017',
  topic: 'frontend',
  level: 'senior',
  q: 'CORS là gì, tại sao trình duyệt chặn gọi API từ domain khác, và cấu hình Spring Boot như thế nào?',
  a: `**Tóm tắt:** CORS (Cross-Origin Resource Sharing) là cơ chế trình duyệt cho phép trang web ở domain A gọi API ở domain B khi server B cho phép. Trình duyệt tuân theo Same-Origin Policy (nguyên tác cùng nguồn gốc) để trang độc hại không đọc được dữ liệu của trang khác. Origin bao gồm giao thức, tên miền, cổng (ví dụ http://localhost:3000 và http://localhost:8080 là hai origin khác nhau vì cổng khác nhau). Cấu hình ở Spring Boot bởi lớp WebMvcConfigurer, addCorsMapping, chọn origin, method, header được phép.

### Các bước xảy ra

1. Trang Vue (http://localhost:3000) gọi API Spring (http://localhost:8080/api/don-hang).
2. Nếu yêu cầu "đơn giản" (GET, header thông thường), trình duyệt vẫn gửi nhưng hủy phản hồi nếu header Access-Control-Allow-Origin không chứa origin của trang.
3. Nếu yêu cầu "phức tạp" (PUT, DELETE, header Authorization…), trình duyệt gửi yêu cầu trước OPTIONS (preflight) hỏi server có cho phép không.
4. Server trả 200 kèm Access-Control-Allow-Origin: http://localhost:3000, Access-Control-Allow-Methods, Access-Control-Allow-Headers. Mới lần sau trình duyệt gửi yêu cầu thực.

~~~text
Trang Vue (http://localhost:3000)           Spring Boot (http://localhost:8080)
      |                                               |
      |------- OPTIONS /api/don-hang ---------------->|
      |                                               |
      |<-- 200 + Allow-Origin: http://localhost:3000  |
      |                                               |
      |------- GET /api/don-hang -------------------->|
      |                                               |
      |<-- 200 + dữ liệu (trình duyệt chấp nhận) -----|
~~~

### Code cấu hình Spring Boot

~~~text
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")           // áp dụng tất cả dưới /api/**
      .allowedOrigins("http://localhost:3000") // chỉ cho trang này gọi (không dùng * khi cần mật khẩu)
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .allowedHeaders("*")
      .allowCredentials(true)               // cho phép gửi cookie và Authorization header
      .maxAge(3600);                        // trình duyệt lưu kết quả phép 1 giờ, không cần OPTIONS lần sau
  }
}
~~~

WebMvcConfigurer chạy như một Filter: kiểm tra origin trước khi controller chạy. Cơ chế allowedOrigins("*") cho phép mọi trang gọi, chỉ dùng cho API công khai. Nếu allowCredentials(true) thì không thể dùng "*" (trình duyệt sẽ chặn).

### Bảng trade-off

| Cách | Ưu điểm | Nhược điểm | Khi dùng |
|---|---|---|---|
| Dùng "*" | Cấu hình ngắn, tất cả domain đều gọi được | Không dùng với cookie/Authorization; dễ bị attacker gọi API | API công khai không mật khẩu |
| Liệt kê origin | Chuẩn xác domain client | Cần cập nhật khi thêm domain mới | API cần đăng nhập, dữ liệu nhạy cảm |

### Lỗi hay gặp

- Cấu hình CORS ở Spring mà quên thêm origin của frontend: console trình duyệt báo "blocked by CORS policy" (lỗi ở trình duyệt, không phải server trả 403).
- allowCredentials(true) cùng allowedOrigins("*"): Spring khởi động thất bại hoặc trình duyệt chặn.
- Quên preflight OPTIONS cho PUT/DELETE kèm header Authorization: gọi bị lỗi trước khi đến controller.
- Lỗi CORS chỉ xảy ra ở trình duyệt; gọi bằng Postman/curl vẫn OK, dùng để phân biệt lỗi CORS với lỗi server.

### Ví dụ đời thực

Trang Vue chạy localhost:3000, Spring Boot localhost:8080. Gọi API đăng nhập kèm cookie, console báo CORS blocked. Sau addCorsMapping với allowedOrigins("http://localhost:3000") và allowCredentials(true), lỗi mất. Ở production: frontend https://app.example.com, API https://api.example.com, cấu hình tương tự. Một lần deploy thêm miền https://m.example.com, team thêm vào danh sách allowedOrigins.

### Trả lời mẫu khi phỏng vấn

CORS là cơ chế trình duyệt cho phép trang ở domain A gọi API ở domain B khi server cho phép, dựa trên nguyên tác Same-Origin Policy (giống tên miền, cổng, giao thức). Yêu cầu phức tạp (PUT, DELETE, header Authorization) được trình duyệt kiểm tra bằng OPTIONS preflight trước. Ở Spring, tạo class implements WebMvcConfigurer, addCorsMapping("/api/**"), allowedOrigins(lấy domain frontend), allowedMethods, allowedHeaders, allowCredentials(true) nếu dùng cookie hoặc Authorization. Không dùng "*" khi cần mật khẩu. CORS chỉ bảo vệ trình duyệt, không chặn curl/Postman, an toàn thực sự ở Spring Security (xác thực JWT, phân quyền).

> Senior tip: Luôn liệt kê rõ domain frontend thay vì "*" cho API cần đăng nhập. CORS không phải tường lửa: attacker vẫn có thể gọi API bằng curl, nên bảo mật thực sự ở Spring Security (xác thực JWT, phân quyền) chứ không chỉ CORS.`,
  tags: ['cors', 'spring-boot', 'webmvconfigurer', 'same-origin'],
  follow: ['Same-Origin Policy', 'OPTIONS preflight', 'WebMvcConfigurer']
},
{
  id: 'frontend-018',
  topic: 'frontend',
  level: 'senior',
  q: 'Form nhiều trường trong Vue cần kiểm tra ở client và ở server (Spring Boot) như thế nào? Tại sao cần validation 2 phía?',
  a: `**Tóm tắt:** Validation 2 phía: client-side kiểm tra trước khi gửi, phản hồi ngay, UX tốt; server-side kiểm tra lại cuối cùng, an toàn vì client có thể bị bỏ qua (tắt JavaScript, gọi API bằng Postman). Ở client viết hàm kiểm tra từng trường (email, số điện thoại, độ dài), hiển thị lỗi dưới ô nhập, ẩn nút Submit nếu chưa hợp lệ. Ở server Spring Boot dùng Jakarta Bean Validation (@NotBlank, @Size, @Email, @Pattern) kèm @Valid, nếu sai trả HTTP 400 kèm chi tiết từng trường. Client nhận lỗi và hiển thị tương ứng từng trường.

### Các bước triển khai

1. Xác định form lớn (ví dụ thông tin khách hàng: họ tên, email, số điện thoại, địa chỉ, danh sách sản phẩm).
2. Client: biến form (ref/reactive), hàm kiểmTra() chạy khi bấm nút hoặc khi thay đổi, lưu lỗi từng trường, hiển thị dưới ô nhập.
3. Gửi bằng axios POST nếu kiểmTra() trả về true.
4. Server: DTO có @Valid, controller có BindingResult, nếu có lỗi trả 400 body là map {trường: thông báo lỗi}.
5. Client hiển thị loiServer tương ứng.

Code client:

~~~text
export default {
  setup() {
    var form = reactive({ hoTen: '', email: '', soDienThoai: '', loi: {}, loiServer: null });

    function kiểmTra() {
      var loi = {};
      if (!form.hoTen || form.hoTen.trim().length < 2) loi.hoTen = 'Họ tên phải ít nhất 2 kí tự';
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) loi.email = 'Email không hợp lệ';
      if (!/^\d{10,11}$/.test(form.soDienThoai)) loi.soDienThoai = 'Số điện thoại phải 10-11 chữ số';
      form.loi = loi;
      return Object.keys(loi).length === 0;
    }

    async function gửi() {
      if (!kiểmTra()) return;
      try {
        await axios.post('/api/khach-hang', form);
        alert('Gửi thành công');
      } catch (loi) {
        form.loiServer = (loi.response && loi.response.status === 400) ? loi.response.data : 'Hệ thống lỗi, vui lòng thử lại sau';
      }
    }

    return { form, kiểmTra, gửi };
  }
};
~~~

Regex ở JavaScript viết giữa hai dấu gạch ngang, không cần gọi thư viện thêm.

Code server:

~~~text
public class KhachHangDto {
  @NotBlank(message = "Họ tên không được để trống")
  @Size(min = 2, max = 100)
  private String hoTen;

  @NotBlank
  @Email(message = "Email không hợp lệ")
  private String email;

  @Pattern(regexp = "\\d{10,11}", message = "Số điện thoại phải 10-11 chữ số")
  private String soDienThoai;
}

@RestController
@RequestMapping("/api/khach-hang")
public class KhachHangController {
  @PostMapping
  public ResponseEntity<?> thêm(@Valid @RequestBody KhachHangDto dto, BindingResult result) {
    if (result.hasErrors()) {
      var loi = result.getFieldErrors().stream().collect(
        Collectors.toMap(fe -> fe.getField(), fe -> fe.getDefaultMessage(), (a, b) -> a));
      return ResponseEntity.badRequest().body(loi);
    }
    return ResponseEntity.status(201).build();
  }
}
~~~

@Valid tự động chạy Bean Validation trước khi controller chạy (giống AOP/interceptor ở Spring). BindingResult chứa lỗi từng trường.

### Bảng trade-off

| Bước | Client-side | Server-side |
|---|---|---|
| Tốc độ | Ngay lập tức, không gửi mạng | Phải chờ phản hồi server |
| UX | Báo lỗi ngay khi nhập sai | Báo lỗi sau bấm Submit |
| Toàn cầu | Dễ bị bỏ qua (tắt JS, Postman) | Không thể bỏ qua, quyết định cuối |
| Ví dụ | Email đúng định dạng, số dt 10 chữ số | Email đã tồn tại, đủ tiền, quyền truy cập |

### Lỗi hay gặp

- Chỉ validation client: attacker gọi API trực tiếp bằng Postman, dữ liệu rác vào CSDL.
- Quên @Valid ở controller: Bean Validation không chạy, dữ liệu không kiểm tra.
- Trả lời chung chung ("Có lỗi xảy ra"): người dùng không biết sửa trường nào.
- Kiểm tra phức tạp (email đã tồn tại) ở client: chưa, dữ liệu client cũ.

### Ví dụ đời thực

Form tạo đơn hàng 25 trường, 500 đơn/ngày. Chỉ validation client, 3% đơn bị thiếu số điện thoại do công cụ tự động gọi API. Sau thêm @Valid server và trả lời từng trường, tỉ lệ đơn thiếu thông tin giảm xuống dưới 0.2%, team giảm 10 giây làm thủ tục mỗi tháng.

### Trả lời mẫu khi phỏng vấn

Validation 2 phía nghĩa là kiểm tra ở client và ở server. Client dùng hàm JavaScript kiểm tra từng trường (họ tên, email, số điện thoại) ngay khi người dùng nhập, hiển thị lỗi dưới ô nhập và ẩn nút Submit nếu chưa hợp lệ, nhưng client có thể bỏ qua nên không bao giờ tin cậy. Server Spring Boot dùng @Valid Jakarta Bean Validation (@NotBlank, @Email, @Pattern) với BindingResult, nếu sai trả HTTP 400 kèm map lỗi từng trường. Client hiển thị lỗi tương ứng từng trường. Client cho trải nghiệm người dùng nhanh, server duy trì chính xác và an toàn.

> Senior tip: Validation client chỉ cho trải nghiệm người dùng, không bao giờ tin cậy. Luôn validation server trước khi ghi CSDL. Form lớn chia thành nhiều bước (multi-step form) và lưu tạm dữ liệu không nhạy cảm vào localStorage để không mất dữ liệu khi tải lại trang.`,
  tags: ['form', 'validation', 'spring-boot', 'axios'],
  follow: ['Jakarta Bean Validation', 'BindingResult', 'hiển thị lỗi từng trường']
},
{
  id: 'frontend-019',
  topic: 'frontend',
  level: 'senior',
  q: 'Bảng hiển thị hàng nghìn dòng ở Vue làm chậm trình duyệt. Phân trang server-side và virtual scroll giải quyết như thế nào, nào dùng cái nào?',
  a: `**Tóm tắt:** Phân trang server-side: client chỉ yêu cầu trang hiện tại (ví dụ 20 dòng), server trả dữ liệu và tổng số dòng, trình duyệt render ít phần tử. Virtual scroll: chỉ render các dòng hiển thị trên màn hình (ví dụ 20 dòng), khi cuộn thay đổi nội dung của các phần tử đã có. Cả hai giúp bảng mượt với dữ liệu lớn.

### Phân trang server-side

1. Người dùng chọn trang/kích thước trang, client gửi GET /api/don-hang?trang=1&kichThuoc=20.
2. Server lấy DB với LIMIT/OFFSET (PostgreSQL), trả danh sách 20 dòng và tổng 45230 dòng.
3. Vue render 20 dòng, hiển thị thanh phân trang (trang 1 / 2262).
4. Chuyển trang, gửi yêu cầu mới, thay thế danh sách.

Code client:

~~~text
export default {
  setup() {
    var danhSach = ref([]);
    var tongTrang = ref(1);
    var đangTải = ref(false);

    async function load(trang) {
      đangTải.value = true;
      var kq = await axios.get('/api/don-hang', {
        params: { page: trang, size: 20 }
      });
      danhSach.value = kq.data.danhSach; // 20 dòng
      tongTrang.value = Math.ceil(kq.data.tong / 20);
      đangTải.value = false;
    }

    return { danhSach, tongTrang, đangTải, load };
  }
};
~~~

Code server:

~~~text
@GetMapping("/don-hang")
public Page<DonHangDto> danhSach(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {
  Pageable pageable = PageRequest.of(page, size, Sort.by("ngayTao").descending());
  return donHangRepository.findAll(pageable);
}
~~~

Page chứa content, totalElements, totalPages. Ở PostgreSQL, Spring Data sinh câu truy vấn LIMIT/OFFSET.

### Virtual scroll

Với 100.000 dòng, render hết -> DOM lớn, treo. Virtual scroll chỉ render dòng nhìn thấy + kê đệm, khi cuộn thay đổi nội dung của các ô DOM đã có (giống RecyclerView Android hoặc JTable chỉ ô hiển thị).

Code cơ chế:

~~~text
<div class="khung" :style="{ height: tổngDòng * chiềuCaoDòng + 'px' }" @scroll="xửLýCuộn">
  <div class="nộiDung" :style="{ transform: 'translateY(' + bắtĐầu * chiềuCaoDòng + 'px)' }">
    <div v-for="(item, i) in hiểnThị" :key="item.id">{{ item.tên }}</div>
  </div>
</div>
~~~

Khung cao bằng tổng dòng * chiều cao một dòng, phần hiển thị dịch chuyển theo vị trí cuộn. Thư viện vue-virtual-scroller làm việc tương tự.

### Nào dùng cái nào

| Tính năng | Dùng khi | Không dùng khi |
|---|---|---|
| Phân trang server-side | Dữ liệu ở DB, tổng số lớn, cần tìm theo trang, xuất Excel | Dữ liệu ít (dưới 200 dòng), muốn cuộn liên tục không chia trang |
| Virtual scroll | Đã load hết dữ liệu ở client (ví dụ 5000 dòng), muốn cuộn liên tục | Dòng cao không bằng nhau và chưa xác định chiều cao cố định |
| Kết hợp | Lấy dữ liệu bởi phân trang server, render trang hiện tại bởi virtual scroll | Ít gặp, thêm phức tạp |

### Lỗi hay gặp

- Phân trang client-side với 100.000 dòng: render hết, treo một số giây.
- Virtual scroll với dòng cao không bằng nhau (văn bản nhiều dòng) chưa chiều cao cố định: vị trí cuộn bị sai.
- Quên :key="item.id" ở virtual scroll: Vue dùng nhầm dữ liệu khi cuộn.
- Phân trang server-side ORDER BY không có cột duy nhất: thứ tự dòng trôi dời giữa các trang.

### Ví dụ đời thực

Bảng lịch sử giao dịch ngân hàng 2 triệu dòng. Ban đầu load hết vào client: trình duyệt treo 8 giây. Chuyển sang phân trang server-side 50 dòng/trang: mỗi yêu cầu 120 ms, render ngay. Thanh cuộn hiển thị trang 1 / 40.000. Nhân viên tìm giao dịch tháng trước nhanh hơn.

### Trả lời mẫu khi phỏng vấn

Phân trang server-side chỉ yêu cầu trang hiện tại (ví dụ 20 dòng), server trả dữ liệu kèm tổng số (Spring Data Page, ở PostgreSQL là LIMIT/OFFSET), trình duyệt render ít phần tử. Virtual scroll chỉ render dòng nhìn thấy, khi cuộn thay đổi nội dung, dùng cho dữ liệu đã load hết ở client. Dùng phân trang server-side khi dữ liệu lớn ở DB cần tìm theo trang; dùng virtual scroll khi cuộn liên tục với dữ liệu nhỏ trung đã load hết; có thể kết hợp.

> Senior tip: Ở PostgreSQL, OFFSET lớn (trang 10.000+) chậm vì database quét qua tất cả dòng trước. Nếu người dùng cuộn sâu, dùng "seek method" (WHERE id > cuốiTrangTrước ORDER BY id LIMIT 20) hoặc chỉ cho vào trang gần đầu.`,
  tags: ['pagination', 'virtual-scroll', 'table', 'spring-data-jpa'],
  follow: ['LIMIT OFFSET', 'seek method', 'vue-virtual-scroller']
},
{
  id: 'frontend-020',
  topic: 'frontend',
  level: 'senior',
  q: 'Trang Vue chậm khi tải lần đầu và tìm kiếm gặp gọi API nhiều lần. Lazy load route và debounce giúp như thế nào?',
  a: `**Tóm tắt:** Hiệu năng trang đo bằng FCP (First Contentful Paint: lúc vẽ nội dung đầu tiên, mục tiêu dưới 1.8s), LCP (nội dung lớn nhất, dưới 2.5s), TTI (trang tương tác được, dưới 3.8s). Lazy load route chia bundle thành tập file, chỉ tải file khi người dùng vào trang đó, bundle chính nhỏ, FCP giảm. Debounce: chờ người dùng ngừng gõ 300-500ms mới gọi API, giảm số lượt yêu cầu mạng.

### Lazy load route

Ở Vue Router, khai báo component như hàm import:

~~~text
const routes = [
  { path: '/', component: HomeView },
  { path: '/don-hang', component: () => import('./views/DonHang.vue') },
  { path: '/bao-cao', component: () => import('./views/BaoCao.vue') }
];
~~~

Vite build tách DonHang.vue và Báo cáo thành file JS riêng, chỉ tải khi vào trang. Bundler chính không chứa code các trang ít truy cập. Giống lazy loading ở Spring (proxy tải cần) nhưng ở mức file JavaScript.

~~~text
Không lazy load:                      Có lazy load:
[app.js 1.2 MB]                     [app.js 450 KB]  [don-hang.js 400 KB]
                                    [bao-cao.js 350 KB]
~~~

### Debounce tìm kiếm

Người dùng gõ "iphone" (6 ký tự), gõ liên tục 6 lần trong 1 giây. Không debounce: 6 yêu cầu API. Có debounce 300ms: chỉ 1 yêu cầu, giảm 5/6 mạng.

~~~text
export default {
  setup() {
    var từKhóa = ref('');
    var timerId = null;
    var kếtQuả = ref([]);

    function tìmKiếm(moi) {
      từKhóa.value = moi;
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(function () {
        gọiApi();
      }, 300); // cho 300ms không gõ, nếu gõ tiếp bỏ timer cũ
    }

    async function gọiApi() {
      var kq = await axios.get('/api/san-pham', {
        params: { q: từKhóa.value }
      });
      kếtQuả.value = kq.data;
    }

    return { từKhóa, tìmKiếm, kếtQuả };
  }
};
~~~

setTimeout đặt hàm vào macrotask, chạy sau 300ms. Nếu gõ tiếp, clearTimeout bỏ timer cũ, đếm mới. Giống ScheduledExecutorService.schedule ở Java nhưng ở luồng trình duyệt.

### Hình ảnh

Dùng <img loading="lazy"> để tải hình khi cuộn đến, dùng kích thước chính xác (không tải ảnh 2 MB để hiển thị thumbnail 200px), chuyển sang WebP.

### Lỗi hay gặp

- Lazy load tất cả route gồm trang chủ: trang chủ cũng chờ tải file riêng, FCP không giảm. Chỉ lazy load trang ít truy cập (báo cáo, cài đặt).
- Debounce quá ngắn (50ms) còn nhiều yêu cầu; quá dài (1000ms) người dùng thấy chậm. 300-500ms phù hợp tìm kiếm.
- Gọi API mỗi lần thay đổi ref ở watch không debounce: tác động server.
- Quên clearTimeout sau khi component unmounted: timer chạy vùt ve, gọi API sau khi đã thoát trang.

### Ví dụ đời thực

Trang tìm kiếm sản phẩm 50.000 mục. Ban đầu bundle 1.2 MB, FCP 3.2s. Sau lazy load route: bundle chính 450 KB, FCP 1.1s. Thêm debounce 300ms: yêu cầu tìm kiếm giảm từ 1200 xuống 200 mỗi phút ở giờ cao điểm, giảm 83% tải server.

### Trả lời mẫu khi phỏng vấn

Lazy load route chia bundle thành các file, chỉ tải JavaScript của trang khi người dùng vào, giảm kích thước tải lần đầu và FCP (mục tiêu dưới 1.8s). Debounce chờ người dùng ngừng gõ 300-500ms mới gọi API, giảm số lượt yêu cầu mạng (ví dụ 6 lần gõ trở thành 1 gọi). Hình ảnh dùng loading="lazy" và kích thước chính xác. Đo bằng Lighthouse (Chrome DevTools). Lazy load giải quyết bundle lớn, debounce giải quyết gọi API ít, hai vấn đề khác nhau.

> Senior tip: Đo trước khi tối ưu (Lighthouse), không đoán. Lazy load route giảm bundle đầu vào, debounce giảm tải server, cái nào giải quyết vấn đề khác nhau, đo theo cái cần thiết nhất.`,
  tags: ['performance', 'lazy-load', 'debounce', 'vite'],
  follow: ['Lighthouse Core Web Vitals', 'Vite manualChunks', 'debounce vs throttle']
},
{
  id: 'frontend-021',
  topic: 'frontend',
  level: 'senior',
  q: 'TypeScript cho dev Java: type vs interface, generics, union/narrowing, any vs unknown khác nhau thế nào?',
  a: `**Tóm tắt:** TypeScript thêm kiểu tĩnh cho JavaScript; type và interface tương tự nhau nhưng interface hợp nhất khai báo và extends dễ hơn, type linh hoạt hơn với union/intersection. Generics tương tự Java. any tắt kiểm tra kiểu, unknown bắt buộc kiểm tra trước khi dùng.

### type vs interface
- interface: khai báo cấu trúc object, có thể merge (declaration merging), extends.
- type: alias cho mọi kiểu, hỗ trợ union, intersection, tuple.

### Generics
Tương tự Java: function f<T>(x: T): T. Constraint: <T extends Foo>.

### Union và narrowing
union: string | number. Narrowing: typeof (primitive), discriminant property (interface), instanceof (class).

### any vs unknown
- any: bỏ qua kiểm tra, nguy hiểm.
- unknown: an toàn, phải narrow trước khi dùng.

### Ví dụ đời thực
API response có thể {data} hoặc {error}: dùng union và narrowing để xử lý.

### Trả lời mẫu khi phỏng vấn
TypeScript cho dev Java là bước tự nhiên vì kiểu tĩnh quen thuộc. type và interface đều mô tả shape; interface hợp nhất khai báo và extends rõ ràng, type linh hoạt với union/intersection. Generics tương tự Java với constraint. Union kết hợp nhiều kiểu và narrowing thu hẹp kiểu bằng typeof/instanceof/discriminant. any tắt kiểm tra kiểu nên tránh; unknown an toàn hơn vì bắt buộc kiểm tra trước khi dùng. Trong dự án tôi dùng interface cho model domain, type cho union và utility. Pitfall: any lan truyền làm mất lợi ích kiểu. Senior tip: bật strict mode và noImplicitAny.

> Senior tip: Bật strict: true và noUncheckedIndexedAccess; tránh any bằng unknown + narrowing.`,
  tags: ['typescript', 'generics', 'narrowing'],
  follow: ['strict mode', 'utility types', 'declaration merging']
},
{
  id: 'frontend-022',
  topic: 'frontend',
  level: 'lead',
  q: 'Build và deploy SPA Vue cùng Spring Boot: Vite build, serve static, history mode fallback, cache-busting hoạt động thế nào?',
  a: `**Tóm tắt:** Vite build ra file tĩnh (HTML/CSS/JS hashed). Spring Boot serve static từ resources/static hoặc WebMvc. History mode cần fallback index.html cho route client. Cache-busting qua tên file hashed.

### Vite build
npm run build → dist/ với assets hashed (index-abc123.js).

### Serve static Spring Boot
Copy dist vào src/main/resources/static hoặc cấu hình ResourceHandler qua WebMvcConfigurer.

### History mode fallback
Vue Router history mode: route /users/123 không có file thật → server trả index.html. Spring Boot: controller @GetMapping("/**") return "forward:/index.html" hoặc ViewControllerRegistry.addViewController("/**").setViewName("forward:/index.html").

### Cache-busting
File hashed → cache lâu. index.html không cache hoặc cache ngắn.

### Ví dụ đời thực
Deploy jar chứa frontend + backend: một artifact, đơn giản CI/CD.

### Trả lời mẫu khi phỏng vấn
Build SPA bằng Vite tạo file tĩnh hashed. Spring Boot serve static. History mode cần fallback index.html cho route client-side. Cache-busting qua tên file hashed cho phép cache lâu assets. Pitfall: không fallback → 404 khi refresh trang con. Senior tip: tách build frontend trong CI rồi copy vào resources/static; đặt cache headers phù hợp.

> Senior tip: Hashed assets cache immutable; index.html no-cache; fallback index.html cho mọi route không phải API.`,
  tags: ['vite', 'deploy', 'spring-boot', 'spa'],
  follow: ['hash routing vs history', 'nginx fallback', 'cache headers']
},
{
  id: 'frontend-023',
  topic: 'frontend',
  level: 'senior',
  q: 'Test frontend (Vitest + Vue Test Utils) ở mức khái niệm: unit test component, mock API, coverage như thế nào?',
  a: `**Tóm tắt:** Vitest chạy unit test nhanh nhờ Vite transform; Vue Test Utils mount component để kiểm tra render và interaction; mock API bằng vi.mock hoặc MSW; coverage đo phần code được test nhưng không phải mục tiêu chính.

### Unit test component
mount(Component, {props}) trả về wrapper. Kiểm tra wrapper.text(), wrapper.find(selector), trigger('click'). flushPromises để chờ async.

### Mock API
vi.mock('axios') thay module; hoặc MSW intercept network ở mức HTTP, sát thực tế hơn. Mock ở boundary, không mock logic nội bộ.

### Coverage
v8/istanbul; ngưỡng trong CI (ví dụ 80%). Coverage là chỉ số, không phải mục tiêu; test behavior quan trọng hơn.

### Ví dụ đời thực
Test form validation: nhập sai → hiện lỗi; nhập đúng → gọi API mock và hiện thành công.

### Pitfall production
- Test implementation details (class internal) → refactor là vỡ test.
- Không await async → test false positive.
- Mock quá sâu → test không phản ánh thực tế.

### Trả lời mẫu khi phỏng vấn
Vitest nhanh vì dùng Vite transform và ESM. Vue Test Utils mount component và kiểm tra DOM/interaction. Mock API tránh phụ thuộc backend; MSW sát thực tế hơn vi.mock. Coverage theo dõi nhưng không phải mục tiêu chính. Pitfall: test implementation details thay vì behavior, không await async. Senior tip: test behavior, dùng data-testid, mock ở boundary, await flushPromises.

> Senior tip: Test behavior không implementation; mock API boundary; coverage là chỉ số không phải mục tiêu.`,
  tags: ['vitest', 'vue-test-utils', 'testing'],
  follow: ['msw', 'e2e playwright', 'testing library']
},
{
  id: 'frontend-024',
  topic: 'frontend',
  level: 'senior',
  q: 'Form phức tạp nhiều bước (wizard) trong Vue cần quản lý state, validation và điều hướng như thế nào?',
  a: `**Tóm tắt:** Wizard chia form thành steps; state tập trung (Pinia hoặc parent) để giữ dữ liệu qua steps; validation từng bước; điều hướng next/back với guard; persist draft để không mất khi refresh.

### State
Parent hoặc Pinia store lưu formData; mỗi step component bind v-model; step chỉ render UI.

### Validation
Validate step hiện tại trước khi next; disable nút next nếu invalid; validate toàn bộ trước submit.

### Điều hướng
Route per step hoặc component state; guard prevents skip; back không mất dữ liệu.

### Ví dụ đời thực
Đăng ký tài khoản 3 bước: thông tin → xác minh → hoàn tất; lưu draft sessionStorage.

### Pitfall production
- Mất dữ liệu khi refresh → persist sessionStorage/localStorage.
- Validation chỉ client → server validate lại.
- Submit trùng → idempotent key.

### Trả lời mẫu khi phỏng vấn
Wizard chia form thành steps. State tập trung giữ dữ liệu qua steps. Validation từng bước trước khi next. Điều hướng next/back với guard. Persist draft trong sessionStorage để không mất khi refresh. Pitfall: validation chỉ client, submit trùng. Senior tip: validate server-side cuối cùng, submit idempotent, lưu draft.

> Senior tip: Persist draft trong sessionStorage; validate server-side cuối cùng; submit idempotent.`,
  tags: ['form', 'wizard', 'validation'],
  follow: ['vuelidate', 'zod', 'sessionStorage']
},
{
  id: 'frontend-025',
  topic: 'frontend',
  level: 'mid',
  q: 'i18n trong Vue/Spring Boot: quản lý bản dịch, pluralization, lazy load locale như thế nào?',
  a: `**Tóm tắt:** vue-i18n quản lý bản dịch theo locale; key-based messages; pluralization theo rules ngôn ngữ; lazy load locale file khi chuyển; backend có thể dùng MessageSource hoặc frontend tự quản lý.

### vue-i18n
$t('key') trong template; messages theo locale; fallback locale.

### Pluralization
pluralization rules theo ngôn ngữ; ICU message format cho phức tạp.

### Lazy load locale
Dynamic import locale file khi switch; giảm bundle ban đầu.

### Backend
Spring MessageSource với Accept-Language; hoặc frontend tự quản lý và backend trả code.

### Ví dụ đời thực
App hỗ trợ vi/en: chuyển ngôn ngữ không reload trang; locale file lazy load.

### Pitfall production
- Hardcode text trong component.
- Key không namespace → trùng.
- Không fallback → missing key hiện raw key.

### Trả lời mẫu khi phỏng vấn
vue-i18n quản lý bản dịch theo locale. Key-based. Pluralization theo rules ngôn ngữ. Lazy load locale file khi chuyển. Backend có thể dùng MessageSource. Pitfall: hardcode text trong component, key không namespace. Senior tip: namespace theo feature, fallback locale, lazy load locale file.

> Senior tip: Namespace theo feature; fallback locale; lazy load locale file.`,
  tags: ['i18n', 'vue-i18n', 'localization'],
  follow: ['ICU message format', 'Spring MessageSource', 'locale detection']
},
{
  id: 'frontend-026',
  topic: 'frontend',
  level: 'senior',
  q: 'Vue 3 reactivity hoạt động từ gốc như thế nào? Hãy giải thích Proxy, cơ chế track/trigger, vì sao destructure reactive làm mất phản ứng, và khi nào dùng toRef/toRefs, shallowRef, markRaw.',
  a: `**Tóm tắt:** Vue 3 bọc dữ liệu trong Proxy. Khi component render, mọi lần đọc thuộc tính được ghi nhận là một phụ thuộc (track); khi có lệnh ghi, Vue tìm đúng những effect phụ thuộc và xếp lịch chạy lại (trigger). ref là một object { value } có getter/setter nên thay thế cả giá trị vẫn bắt được; reactive chỉ nhận object và trả về proxy. Destructure reactive lấy giá trị ra khỏi proxy, giống Java truyền primitive theo giá trị, nên thay đổi biến local không ảnh hưởng object gốc.

### Cơ chế bên trong, từng bước

1. Mỗi component có một effect chính là hàm render. Khi chạy, Vue đặt effect đó vào biến toàn cục activeEffect.
2. Trong lúc render, đọc {{state.count}} làm Proxy chạy get trap, gọi track(target, 'count'): tìm map phụ thuộc của object và thêm effect vào tập effect của key count.
3. Khi gán {{state.count}} = 5, Proxy chạy set trap: ghi giá trị bằng Reflect.set rồi gọi trigger(target, 'count') lấy đúng tập effect ở bước 2 và đưa vào hàng đợi job.
4. Vue gom job trong cùng một tick (nextTick), khử trùng lặp, sau đó chạy lại component. Nhờ vậy 10 lần đổi giá trị trong một hàm chỉ render 1 lần.

ref khác reactive ở chỗ nào:

- {{ref(0)}} tạo object có value; getter/setter nằm trong value nên gán {{page.value}} = 2 là một phép ghi thuộc tính, Proxy bắt được. Dùng cho number, string, boolean, hoặc khi cần thay thế cả object.
- {{reactive(obj)}} chỉ nhận object và trả proxy; đọc thuộc tính lồng nhau cũng được bọc proxy (deep, lazy: chỉ bọc khi có truy cập).
- Trong template, ref tự động bọc: viết {{page}} in ra 1, không cần {{page.value}}. Trong JavaScript phải viết {{page.value}}.

### Vì sao destructure làm mất phản ứng

~~~text
const state = reactive({ count: 0 });
const { count } = state;              // count là số 0, đã rời proxy
state.count = 1;                      // state đổi, count vẫn 0
const { count: c } = toRefs(state);   // c là ref, giữ liên kết
c.value = 2;                          // state.count = 2
~~~

Giống Java: {{state}} là một object, destructure là copy field ra biến local. Muốn giữ liên kết phải giữ reference (toRef/toRefs), không copy giá trị.

### Bảng chọn công cụ

| Công cụ | Dùng khi | Lưu ý |
|---|---|---|
| ref | primitive, hoặc cần thay cả object | trong JS phải .value |
| reactive | object có cấu trúc, không gán lại cả biến | không destructure |
| toRef / toRefs | cần destructure mà vẫn giữ liên kết | toRefs trả object gồm nhiều ref |
| shallowRef | mảng hoặc object lớn, chỉ thay cả khối | sửa bên trong không cập nhật |
| markRaw | class instance, object thư viện thứ ba | Vue không bao giờ bọc proxy |

### Ví dụ code

~~~text
import { reactive, ref, toRefs, shallowRef, markRaw } from 'vue';

const state = reactive({ count: 0, user: { name: 'An' } });
const { count: countRef } = toRefs(state);  // giữ liên kết
countRef.value++;                           // state.count = 1

const page = ref(1);                        // ref bọc trong { value }
page.value++;                               // trong JS phải có .value

const big = shallowRef({ rows: [] });       // chỉ theo dõi khi thay cả object
big.value = { rows: [1, 2, 3] };            // cập nhật
big.value.rows.push(4);                     // KHÔNG cập nhật (shallow)

const map = markRaw(new Map());             // Vue không bọc map này
~~~

### Lỗi hay gặp

- Destructure reactive rồi gán: giao diện không đổi, thường mất 1–2 giờ mới thấy nguyên nhân.
- Viết {{page.value}} trong template: template đã tự bọc, .value trở thành undefined nên ô trống.
- Bọc object của thư viện (axios instance, dayjs, Three.js) bằng reactive: proxy làm chậm và có thể hỏng this; dùng markRaw.
- So sánh reference (===) giữa proxy và object gốc: chúng là hai object khác nhau, thư viện bên thứ ba dễ hiểu nhầm.
- watch một reactive object: mặc định deep, vô tình theo dõi cả danh sách 5000 dòng.
- Gán lại biến reactive (state = reactive(...)): biến mất khỏi mọi component đang dùng proxy cũ.

### Ví dụ đời thực

Bảng 5000 dòng, mỗi dòng là một object trong reactive([]). Khi đổi sắp xếp, Vue phải bọc proxy 5000 phần tử; đo bằng performance.now thấy một lần sort mất 1,9 giây. Đổi sang shallowRef và thay cả mảng mới, cùng thao tác còn 18 ms. Lý do: component chỉ đọc cả mảng, không cần theo dõi từng field của từng dòng, nên bọc sâu là lãng phí.

### Trả lời mẫu khi phỏng vấn

Vue 3 dùng Proxy để bọc dữ liệu. Khi component render, mỗi lần đọc thuộc tính được ghi nhận là phụ thuộc; khi ghi, Vue chỉ chạy lại những component phụ thuộc đúng thuộc tính đó. ref là object có value với getter setter, dùng cho primitive hoặc khi cần thay cả object; reactive bọc object và trả proxy, đọc lồng nhau vẫn được theo dõi. Trong template ref tự bọc, trong JS phải dùng .value. Destructure reactive làm mất phản ứng vì nó copy giá trị ra khỏi proxy, giống Java truyền primitive theo giá trị; muốn giữ liên kết thì dùng toRef hoặc toRefs. shallowRef dùng cho mảng lớn khi chỉ thay cả khối, markRaw cho object của thư viện để Vue không bọc proxy. Tôi chọn theo dữ liệu: primitive thì ref, object có cấu trúc thì reactive, danh sách lớn thì shallowRef, object bên thứ ba thì markRaw.

> Senior tip: Đo trước khi tối ưu: proxy chỉ đắt khi component đọc từng field của hàng nghìn object. Danh sách lớn thì shallowRef và thay mảng mới; đừng reactive từng phần tử.`,
  tags: ['vue3', 'reactivity', 'proxy', 'ref', 'reactive'],
  follow: ['toRef và toRefs khác nhau thế nào', 'computed cache hoạt động ra sao', 'watch deep và shallow']
},
{
  id: 'frontend-027',
  topic: 'frontend',
  level: 'senior',
  q: 'Trong Vue 3, state nên đặt ở đâu: ref trong component, props/emit, provide/inject hay Pinia? Hãy đưa ra tiêu chí quyết định và dấu hiệu cho thấy một Pinia store đang bị dùng sai.',
  a: `**Tóm tắt:** Chọn theo phạm vi và vòng đời của state. Chỉ một component dùng thì để ref cục bộ; quan hệ cha–con trực tiếp thì props/emit; truyền sâu 3–4 cấp trong cùng một feature thì provide/inject; state dùng ở nhiều route, nhiều component không cùng cây, cần devtools, SSR hoặc persist thì Pinia. Dữ liệu lấy từ server (danh sách đơn hàng, hồ sơ người dùng) không phải client state: nó cần cache và invalidate, không nên nhân bản vào store rồi tự đồng bộ.

### Ba loại state

| Loại | Ví dụ | Nơi đặt |
|---|---|---|
| UI state | đang mở modal, tab đang chọn, nội dung gõ dở | ref cục bộ trong component |
| Client state | giỏ hàng, người dùng đã đăng nhập, theme | Pinia; provide/inject nếu phạm vi hẹp |
| Server state | đơn hàng, sản phẩm, kết quả tìm kiếm | cache riêng (TanStack Query) hoặc Pinia chỉ giữ trạng thái tải và lỗi |

### Tiêu chí quyết định, 5 câu hỏi

1. Chỉ component này dùng? Để ref cục bộ, không đưa lên store.
2. Cha–con 1–2 cấp? props/emit: dữ liệu một chiều, sự kiện ngược lại.
3. Sâu 3–4 cấp nhưng cùng một feature (theme, cấu hình form)? provide/inject, tránh prop drilling.
4. Dùng ở nhiều route hoặc nhiều component không cùng cây? Pinia.
5. Là dữ liệu từ API? cache cộng invalidate, đừng copy vào nhiều store.

### Ví dụ code

~~~text
// props/emit: cha giữ dữ liệu, con chỉ hiển thị và báo sự kiện
const props = defineProps({ user: Object });
const emit = defineEmits(['update:name']);
~~~

~~~text
// Pinia setup store: state, getter, action, dùng lại ở mọi nơi
export const useUserStore = defineStore('user', function () {
  const profile = ref(null);
  const isAdmin = computed(function () {
    return profile.value?.role === 'ADMIN';
  });
  async function load() {
    profile.value = await api.get('/me');
  }
  function reset() {
    profile.value = null;
  }
  return { profile, isAdmin, load, reset };
});
~~~

So sánh với Java: props/emit giống gọi method và truyền callback; provide/inject giống bean trong DI container có scope; Pinia giống singleton @Service giữ state toàn ứng dụng, nên phải cẩn thận như biến static.

### Dấu hiệu store bị dùng sai

- Copy state từ store vào data cục bộ: const { user } = store làm mất liên kết, phải dùng storeToRefs hoặc computed.
- Sửa trực tiếp props: Vue cảnh báo, component cha không biết dữ liệu đã đổi.
- Store giữ dữ liệu server và không invalidate sau POST/PUT: danh sách cũ, người dùng thấy bản ghi đã xoá.
- Reset store bằng cách gán object mới thay vì gọi action reset: component đang giữ tham chiếu cũ vẫn thấy dữ liệu cũ.
- Gọi useUserStore() ngoài setup (trong module hoặc callback global): chưa có active pinia nên lỗi.
- SSR dùng chung một store cho mọi request: người dùng A thấy dữ liệu người dùng B. Mỗi request phải tạo pinia mới.

### Ví dụ đời thực

Hệ thống 40 màn hình dùng chung một store user. Khi đăng xuất, code chỉ xoá token mà không reset store: người kế tiếp đăng nhập trên cùng máy thấy tên và avatar của người trước trong khoảng 2 giây, ghi nhận 12 báo cáo mỗi quý. Sửa bằng action reset gọi trong guard đăng xuất và sau khi đổi user, thêm test tự động kiểm tra store rỗng sau đăng xuất.

### Trả lời mẫu khi phỏng vấn

Tôi chọn theo phạm vi: ref cục bộ cho UI state, props/emit cho quan hệ cha–con 1–2 cấp, provide/inject khi phải truyền sâu trong cùng một feature, Pinia khi state sống qua nhiều route hoặc nhiều component không cùng cây. Với dữ liệu từ server, tôi không nhân bản vào store mà dùng một lớp cache có invalidate sau mutation, vì bản sao trong store rất dễ lệch. Store là singleton nên tôi luôn có action reset và gọi nó khi đăng xuất hoặc đổi người dùng, tránh rò dữ liệu giữa các phiên, nhất là khi SSR dùng chung một instance cho mọi request.

> Senior tip: Trước khi tạo store, hỏi hai câu: state này có sống lâu hơn component không, và có ai ngoài cây component này cần nó không. Hai câu trả lời "không" thì đừng tạo store.`,
  tags: ['vue3', 'pinia', 'props', 'emit', 'provide-inject', 'state-management'],
  follow: ['storeToRefs dùng khi nào', 'state colocation là gì', 'pinia trên SSR mỗi request một instance']
},
{
  id: 'frontend-028',
  topic: 'frontend',
  level: 'lead',
  q: 'Form lớn khoảng 50 trường, có upload file và gọi API: bạn thiết kế luồng submit thế nào để không double submit, không nhận response cũ, và hiển thị lỗi từng trường từ server?',
  a: `**Tóm tắt:** Coi mỗi lần submit là một giao dịch ở client với bốn trạng thái: idle, submitting, success, error. Vừa bấm là khoá ngay bằng cờ đồng bộ (không chờ await), sinh một idempotency key gửi kèm header; mỗi lần bấm tăng request id và chỉ áp dụng kết quả của id mới nhất; huỷ request cũ bằng AbortController khi người dùng sửa dữ liệu hoặc rời trang. Lỗi 4xx có body dạng ProblemDetail với map lỗi từng trường thì đổ vào errors theo tên field.

### Máy trạng thái của nút submit

| Trạng thái | Nút submit | Thông báo |
|---|---|---|
| idle | bấm được | ẩn |
| submitting | disabled, có spinner | Đang gửi… |
| success | disabled 1–2 giây | Đã tạo đơn hàng |
| error | bấm lại được | lỗi tổng cộng lỗi từng field |

### Chống double submit

- Cờ submitting đặt đồng bộ trước await: hai sự kiện click trong cùng một tick vẫn bị chặn.
- Idempotency-Key là UUID sinh một lần cho mỗi lần mở form; gửi lại cùng key thì server trả kết quả cũ thay vì tạo bản ghi mới. Lưu key trong Redis với TTL 24 giờ.
- Chỉ sinh key mới khi người dùng sửa dữ liệu sau khi lỗi, vì lúc đó là một giao dịch khác.

### Chống response cũ

- Mỗi lần submit tăng seq; callback chỉ áp dụng nếu seq còn khớp.
- AbortController huỷ request đang bay khi form đổi hoặc component unmount.
- Không dùng chung một cờ loading cho nhiều request khác nhau.

### Ví dụ code client

~~~text
let seq = 0;
let controller = null;
let submitKey = null;

async function submit() {
  if (submitting.value) return;        // chặn ngay trong cùng tick
  const my = ++seq;                    // id của lần bấm này
  controller = new AbortController();
  submitKey = submitKey || crypto.randomUUID();
  submitting.value = true;
  errors.value = {};
  try {
    await api.post('/orders', form, {
      headers: { 'Idempotency-Key': submitKey },
      signal: controller.signal
    });
    if (my !== seq) return;            // đã có lần bấm mới hơn
    status.value = 'success';
  } catch (e) {
    if (e.name === 'AbortError' || my !== seq) return;
    errors.value = e.response?.data?.errors || {};
    status.value = 'error';
  } finally {
    if (my === seq) submitting.value = false;
  }
}
~~~

### Ví dụ code server

~~~java
@PostMapping("/orders")
ResponseEntity<OrderDto> create(@Valid @RequestBody OrderDto dto,
                                @RequestHeader("Idempotency-Key") String key) {
  // Redis SET key response NX EX 86400: nếu đã có thì trả lại response cũ
  return ResponseEntity.ok(orderService.create(dto));
}

@ExceptionHandler(MethodArgumentNotValidException.class)
ProblemDetail invalid(MethodArgumentNotValidException e) {
  ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
  Map<String, String> errors = new HashMap<>();
  e.getBindingResult().getFieldErrors()
    .forEach(f -> errors.put(f.getField(), f.getDefaultMessage()));
  pd.setProperty("errors", errors);
  return pd;
}
~~~

### Ánh xạ mã lỗi sang hành vi

| Mã | Ý nghĩa | Client làm gì |
|---|---|---|
| 400 kèm errors | sai từng field | đổ vào errors, focus field đầu tiên |
| 401 | hết hạn token | refresh rồi gửi lại đúng một lần |
| 409 | bản ghi đã tồn tại | hiện liên kết tới bản ghi, không tạo lại |
| 422 | đúng cú pháp, sai nghiệp vụ | hiện lỗi tổng, giữ nguyên dữ liệu |
| 5xx, timeout | lỗi tạm | cho thử lại, không xoá form |

### Lỗi hay gặp

- Dùng một cờ loading chung: hai request song song, request ngắn kết thúc tắt loading của request dài.
- Không có idempotency key: người dùng bấm lại sau timeout tạo hai đơn.
- Bỏ qua thứ tự response: form đổi số lượng khi request cũ đang bay, kết quả cũ ghi đè.
- Hiện "Có lỗi xảy ra": người dùng không biết field nào sai.
- Xoá form khi lỗi: mất toàn bộ dữ liệu đã nhập.
- Gửi lại vô hạn khi 401: vòng lặp refresh.

### Ví dụ đời thực

Trang tạo đơn 50 trường, 1200 đơn mỗi ngày. Trước đây không có idempotency: khoảng 3% số lần bấm là double submit, tức 36 đơn trùng mỗi ngày, kế toán mất 2 giờ đối soát. Sau khi thêm idempotency key TTL 24 giờ và khoá nút đồng bộ, đơn trùng về 0. Ngoài ra thống kê 8 đơn sai số lượng do response cũ ghi đè; thêm seq và AbortController thì hết.

### Trả lời mẫu khi phỏng vấn

Tôi coi submit là một giao dịch ở client. Khi bấm, tôi khoá nút ngay bằng cờ đồng bộ, sinh idempotency key và tăng request id; chỉ response của id mới nhất mới được áp dụng, request cũ bị AbortController huỷ. Server nhận Idempotency-Key, lưu kết quả trong Redis 24 giờ để lần gửi lại cùng key trả về bản ghi cũ, không tạo trùng. Lỗi 400 có map lỗi từng field trong ProblemDetail, tôi đổ vào errors theo tên field và focus ô đầu tiên; 401 thì refresh token và gửi lại đúng một lần; 5xx thì giữ dữ liệu và cho thử lại. Tôi luôn giữ lại dữ liệu khi lỗi và chỉ sinh key mới khi người dùng thực sự sửa form, vì đó là một giao dịch khác.

> Senior tip: Double submit không phải lỗi UI mà là lỗi thiết kế API: nếu server không idempotent thì client có làm gì cũng không an toàn tuyệt đối. Idempotency-Key cộng unique constraint ở DB là lớp phòng thủ cuối.`,
  tags: ['form', 'submit', 'idempotency', 'abortcontroller', 'problem-detail'],
  follow: ['idempotency key hoạt động thế nào', 'ProblemDetail RFC 7807', 'AbortController khi unmount']
},
{
  id: 'frontend-029',
  topic: 'frontend',
  level: 'senior',
  q: 'Bảng dữ liệu 45 nghìn dòng: bạn tổ chức phân trang, sắp xếp, lọc phía server và xử lý race condition khi người dùng gõ tìm kiếm nhanh như thế nào? Khi nào dùng keyset pagination thay OFFSET?',
  a: `**Tóm tắt:** Đưa page, size, sort, q lên query string; server trả rows, total, page, pageSize và client chỉ render 20–50 dòng. Mỗi lần đổi bộ lọc là một request mới, nên phải debounce 300 ms cho ô tìm kiếm, huỷ request cũ bằng AbortController và đánh số request để bỏ response đến sau. Với trang sâu, OFFSET chậm vì DB phải bỏ qua N dòng; keyset pagination dùng WHERE (createdAt, id) < (?, ?) ORDER BY ... LIMIT n, chỉ đọc đúng 20 dòng.

### Luồng một request

1. URL là nguồn dữ liệu: /orders?page=3&size=20&sort=-createdAt&q=abc.
2. watch các ref page, sort, q; q debounce 300 ms, sort và page phản hồi ngay.
3. Gọi abort request trước, tăng seq.
4. Gửi GET /api/orders với page, size, sort, q.
5. Server dùng Pageable cộng Specification, chạy hai câu: SELECT dữ liệu với LIMIT/OFFSET và SELECT count(*).
6. Client chỉ thay rows khi seq còn khớp, đồng thời hiện thông báo Đang tải cho screen reader.

### Ví dụ code client

~~~text
let seq = 0;
let controller = null;

async function load() {
  const my = ++seq;
  if (controller) controller.abort();
  controller = new AbortController();
  loading.value = true;
  try {
    const res = await api.get('/orders', {
      params: { page: page.value, size: 20, sort: sort.value, q: q.value },
      signal: controller.signal
    });
    if (my !== seq) return;              // response cũ, bỏ
    rows.value = res.data.rows;
    total.value = res.data.total;
  } finally {
    if (my === seq) loading.value = false;
  }
}
watch(q, debounce(load, 300));
watch([page, sort], load);
~~~

### Ví dụ code server

~~~java
@GetMapping("/orders")
Page<OrderDto> list(@RequestParam int page, @RequestParam int size,
                    @RequestParam(defaultValue = "createdAt,desc") String sort,
                    @RequestParam(required = false) String q) {
  Sort s = Sort.by(Sort.Direction.DESC, "createdAt");
  Pageable p = PageRequest.of(page, size, s);
  return orderRepo.search(q, p);
}
~~~

### OFFSET so với keyset

| Tiêu chí | OFFSET/LIMIT | Keyset |
|---|---|---|
| Cú pháp | LIMIT 20 OFFSET 200000 | WHERE (created_at, id) < (?, ?) ORDER BY ... LIMIT 20 |
| Trang đầu | nhanh | nhanh |
| Trang sâu | chậm, DB bỏ qua N dòng | ổn định, chỉ đọc 20 dòng |
| Nhảy ngẫu nhiên tới trang 57 | được | không |
| Tổng số trang | có count(*) | không, chỉ next và prev |

Câu SQL keyset:

~~~sql
SELECT id, code, total, created_at
FROM orders
WHERE (created_at, id) < (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 20;
~~~

Điều kiện dùng row constructor phải cùng thứ tự với ORDER BY; nếu các cột sắp xếp có chiều khác nhau thì không dùng được row constructor, phải viết điều kiện OR.

### Lỗi hay gặp

- Không huỷ request cũ: gõ ba ký tự sinh ba request, response của ký tự đầu về sau ghi đè kết quả của ký tự cuối.
- ORDER BY nhận chuỗi từ client rồi nối vào SQL: nguy cơ injection; phải whitelist tên cột và sort qua enum.
- count(*) với 10 triệu dòng mất vài trăm ms: dùng hasNext (LIMIT size + 1) hoặc đếm gần đúng.
- Quên URL state: người dùng F5 hoặc bấm back mất bộ lọc.
- Selection theo index: khi đổi sort, checkbox chọn nhầm dòng; lưu theo id trong Set.
- Không có empty state: tìm kiếm 0 kết quả hiện bảng trống không lời giải thích.
- Debounce đặt sai chỗ: debounce cả hàm load dùng cho phân trang làm nút chuyển trang bị trễ 300 ms.

### Ví dụ đời thực

Bảng đơn hàng 45.230 dòng. Trang đầu với OFFSET 0 mất 18 ms; trang 2.000 với OFFSET 40.000 mất 1,4 giây vì PostgreSQL quét 40.020 dòng rồi bỏ 40.000. Chuyển sang keyset theo (created_at, id), mọi trang còn 22–26 ms. Gõ tìm kiếm nhanh trước đây sinh 6 request và 2 lần hiện sai kết quả; debounce 300 ms cộng abort giảm còn 1 request mỗi lần ngừng gõ.

### Trả lời mẫu khi phỏng vấn

Tôi để page, size, sort, q trên URL để chia sẻ và F5 được. Với ô tìm kiếm tôi debounce 300 ms, mỗi lần load tăng request id và abort request trước, chỉ áp dụng response của id mới nhất. Server trả rows và total, dùng Pageable với sort whitelist; với trang sâu tôi dùng keyset pagination theo (createdAt, id) để tránh OFFSET quét N dòng, đổi lại không nhảy ngẫu nhiên tới trang 57. Với 45 nghìn dòng, OFFSET trang 2.000 mất 1,4 giây còn keyset khoảng 25 ms. Tôi lưu selection theo id trong Set, không theo index, và luôn có empty state khi 0 kết quả.

> Senior tip: Đo bằng EXPLAIN (ANALYZE, BUFFERS) trên chính dữ liệu thật: OFFSET 200000 có thể đọc hàng trăm nghìn buffer. Nếu người dùng cần nhảy trang, giữ OFFSET nhưng giới hạn số trang; nếu cần cuộn liên tục hoặc đi sâu, dùng keyset.`,
  tags: ['pagination', 'keyset', 'table', 'debounce', 'abortcontroller', 'spring-data-jpa'],
  follow: ['keyset pagination', 'EXPLAIN ANALYZE', 'debounce cộng AbortController']
},
{
  id: 'frontend-030',
  topic: 'frontend',
  level: 'senior',
  q: 'Trong Vue 3 bạn thường viết lặp lại loading/error/data cộng onUnmounted abort ở mỗi component. Hãy thiết kế một composable useAsyncResource dùng chung: phải hủy request khi rời màn hình, bỏ qua response đến sau khi đã có request mới hơn, giữ dữ liệu cũ khi đang tải, và trả về data, error, loading, reload. Giải thích vì sao dùng shallowRef và markRaw, và vì sao gọi reload không được tạo vòng lặp.',
  a: `**Tóm tắt:** Composable useAsyncResource gom ba việc mà mọi màn hình gọi API đều lặp lại: giữ trạng thái loading, error, data; hủy request khi rời màn hình; và bỏ qua response đến sau khi đã có request mới hơn. Điểm cốt lõi là mỗi lần chạy được đánh số phiên; chỉ phiên mới nhất được ghi vào state, còn AbortController hủy phần việc ở tầng mạng để tiết kiệm băng thông và tránh cập nhật state sau khi component đã bị hủy.

### Vì sao cần một composable riêng

Ba màn hình (danh sách đơn hàng, chi tiết sản phẩm, tìm kiếm khách hàng) nếu viết tay mỗi chỗ phải có: ba ref data, loading, error; onUnmounted để abort; một biến đếm để bỏ response cũ; và try/catch/finally. Đó là khoảng 40 dòng nhân ba, và bug kinh điển là thiếu bước đếm: người dùng gõ nhanh 5 ký tự sinh 5 request, response của ký tự thứ 2 về sau và ghi đè kết quả của ký tự thứ 5, người dùng thấy sai dữ liệu. Đóng gói một lần, ba màn hình dùng chung, mỗi chỗ chỉ cần truyền hàm fetch.

### Cơ chế hoạt động, từng bước

1. Gọi useAsyncResource(fetcher, { immediate: true }) trong setup của component.
2. Bên trong tạo ba ref: loading, error, và data bằng shallowRef.
3. Mỗi lần chạy: seq tăng 1, tạo AbortController mới, abort controller cũ nếu còn, loading = true, error = null.
4. Await fetcher(signal). Nếu seq của lần chạy này khác seq hiện tại thì bỏ kết quả: đã có lần chạy mới hơn bắt đầu.
5. catch: chỉ nhận lỗi khi seq còn khớp và lỗi không phải AbortError. Request bị chính mình hủy không phải lỗi người dùng cần thấy.
6. finally: chỉ đặt loading = false khi seq còn khớp, nếu không sẽ tắt spinner của request đang chạy.
7. onScopeDispose (hook chạy khi component unmount, kể cả khi composable nằm lồng trong composable khác) gọi abort và tăng seq để mọi await còn treo bị vô hiệu.
8. reload() để gọi lại sau khi lưu form hoặc bấm nút thử lại.

### Code composable

~~~js
import { ref, shallowRef, onScopeDispose } from 'vue';

export function useAsyncResource(fetcher, opts = {}) {
  const data = shallowRef(null);   // data lớn: không cần reactive sâu
  const loading = ref(false);
  const error = ref(null);
  let seq = 0;
  let ctrl = null;

  async function run() {
    const my = ++seq;                      // phiên của lần chạy này
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();
    loading.value = true;
    error.value = null;
    try {
      const res = await fetcher(ctrl.signal);
      if (my !== seq) return;              // đã có phiên mới hơn
      data.value = res;
    } catch (e) {
      if (my !== seq || e.name === 'AbortError') return;
      error.value = e;
    } finally {
      if (my === seq) loading.value = false;
    }
  }

  onScopeDispose(() => { if (ctrl) ctrl.abort(); seq++; });
  if (opts.immediate !== false) run();
  return { data, loading, error, reload: run };
}
~~~

Dùng trong component:

~~~js
const { data, loading, error, reload } = useAsyncResource(
  signal => api.get('/orders', { signal })
);
~~~

Vì sao shallowRef thay ref: ref bọc object lớn bằng reactive sâu, mỗi lần đọc field đi qua Proxy; với 5000 dòng thì chi phí này vô ích vì ta luôn thay cả object. markRaw dùng khi fetcher trả instance class có method: reactive sẽ bọc Proxy làm mất private field và danh tính object. Nếu dữ liệu về rồi chỉ đọc, không sửa từng field, shallowRef cộng gán lại là đủ và nhanh hơn.

### Phía server: cho reload rẻ bằng ETag

~~~java
@GetMapping("/orders")
ResponseEntity<OrderPage> list(@RequestParam int page,
        @RequestHeader(value = "If-None-Match", required = false) String inm) {
  OrderPage data = service.page(page);          // server là nơi tính
  String tag = data.etag();                     // hash ổn định của nội dung
  if (tag.equals(inm)) {
    return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(tag).build();
  }
  return ResponseEntity.ok().eTag(tag).body(data);
}
~~~

Client bấm reload vẫn gọi mạng nhưng nếu nội dung không đổi thì server trả 304 với body rỗng, không phải serialize lại 20 dòng JSON. Kết hợp với composable, đây là cách giảm tải khi nhiều người cùng mở một trang.

### Bảng trade-off

| Cách | Ưu | Nhược | Khi nào dùng |
|---|---|---|---|
| watch cộng ref trong component | không cần thêm file | lặp code, dễ quên abort | 1–2 chỗ, form nhỏ |
| Composable useAsyncResource | dùng chung, tự abort | cần quy ước đặt tên và nơi giữ cache | từ 3 màn hình gọi API trở lên |
| Pinia store giữ data | nhiều màn hình chia sẻ dữ liệu | dễ thành god store | dữ liệu dùng chéo như giỏ hàng |

### Lỗi hay gặp

- Quên nhánh e.name === 'AbortError': request bị hủy lại hiện toast lỗi đỏ.
- Dùng reactive cho data lớn rồi push thêm dòng: mỗi lần thêm phải đi qua Proxy, chậm dần.
- Đặt composable ở module scope (ngoài setup): dùng chung một data cho mọi component, trang sau thấy dữ liệu trang trước.
- Gọi reload trong watch mà fetcher phụ thuộc chính data đang tải: vòng lặp vô hạn.
- Không có trạng thái rỗng: data là mảng rỗng thì spinner tắt mà không có lời giải thích.
- Chưa có timeout: mạng treo thì loading bật mãi; nên bọc AbortSignal.timeout hoặc setTimeout 10 giây.

### Ví dụ đời thực

Trang chi tiết sản phẩm gọi 3 request song song: sản phẩm, tồn kho, đánh giá. Người dùng gõ tìm kiếm 5 ký tự, mỗi ký tự kích hoạt bộ 3 request, tổng 15 request. Không có seq nên kết quả của ký tự thứ 2 về sau ghi đè ký tự thứ 5, khách hàng thấy đúng một sản phẩm rồi nhảy sang sản phẩm khác. Sau khi tách composable và thêm AbortController, chỉ 6 request thực sự chạy (hai bộ bị hủy giữa đường), không còn hiện sai, và số lần bật tắt spinner giảm từ 15 xuống 3.

### Trả lời mẫu khi phỏng vấn

Tôi không viết lại loading và error ở từng component mà tách một composable useAsyncResource. Bên trong có shallowRef cho data, ref cho loading và error, và một biến seq đếm phiên. Mỗi lần chạy tăng seq, tạo AbortController mới và abort cái cũ; sau khi await, nếu seq không còn khớp thì tôi bỏ kết quả, còn finally chỉ tắt loading khi seq khớp. Khi component unmount, onScopeDispose abort request và tăng seq để các await còn treo bị vô hiệu. Tôi dùng shallowRef vì data là object lớn, không cần reactive sâu, và markRaw cho instance class để không mất danh tính. Ở server tôi trả ETag để lần reload sau không phải tính lại. Kết quả đo được: trang tìm kiếm 5 ký tự giảm từ 15 request xuống 6 và không còn hiện sai dữ liệu.

> Senior tip: Composable chỉ bảo vệ được UI; nếu proxy hay service worker trả response chậm bất thường thì seq vẫn đúng nhưng băng thông vẫn tốn. Ghép thêm timeout phía client, và kiểm tra bằng Network tab với throttling Slow 3G chứ đừng chỉ test trên máy local.`,
  tags: ['vue3', 'composable', 'abortcontroller', 'race-condition', 'shallowref'],
  follow: ['onScopeDispose khác onUnmounted thế nào', 'ETag và 304 hoạt động ra sao', 'composable có nên giữ cache toàn cục không']
},
{
  id: 'frontend-031',
  topic: 'frontend',
  level: 'senior',
  q: 'Form có danh sách dòng động (nhiều số điện thoại, nhiều dòng chi tiết đơn hàng): bạn quản lý state, key khi render, validate chéo (ví dụ tổng tiền), dirty tracking và map lỗi từ server như thế nào để xóa dòng ở giữa không làm nội dung nhảy chỗ?',
  a: `**Tóm tắt:** Danh sách dòng động là mảng reactive các object, mỗi dòng có id ổn định; v-for phải dùng :key là id đó chứ không phải index, nếu không khi xóa dòng ở giữa Vue tái sử dụng DOM theo vị trí và nội dung người dùng đang gõ bị đổ sang dòng khác. Validate chéo như tổng tiền phải chạy lại khi bất kỳ dòng nào đổi nhưng có debounce và chỉ validate field liên quan. Lỗi server phải được map theo id dòng, vì chỉ số phía client có thể đã lệch so với lúc server nhận.

### Vì sao key bằng index gây lỗi

1. Vue dùng key để quyết định phần tử DOM nào được tái sử dụng cho phần tử dữ liệu nào.
2. Với key = index, mảng [A, B, C] sau khi xóa dòng thứ hai thành [A, C]; key của C vẫn là 1, giống key của B trước đó.
3. Vue giữ lại DOM của B, gồm cả chữ đã gõ, vị trí con trỏ và focus, rồi đổ dữ liệu của C vào đó. Người dùng thấy dòng mình đang gõ biến thành dòng khác.
4. key = id dòng (1, 2, 3) thì C luôn được nối với đúng DOM của nó, việc xóa chỉ gỡ DOM của B.

### Cơ chế form động

- Thêm: push object mới với id tăng dần, rồi nextTick và focus ô đầu của dòng mới.
- Xóa: tìm theo id rồi splice; chặn xóa dòng cuối để form luôn còn một dòng, hoặc cho xóa hết và validate riêng.
- Validate: watch deep trên mảng dòng cộng debounce 250 ms; mỗi lần chỉ validate dòng vừa đổi cộng các trường phụ thuộc như tổng.
- Gửi: mỗi dòng kèm id; server trả lỗi dạng lines[2].amount nhưng client phải dò theo id dòng tương ứng, không theo chỉ số.
- Dirty: so sánh JSON hiện tại với snapshot lúc mở form; nếu dirty và người dùng điều hướng thì chặn bằng beforeRouteLeave và beforeunload.

### Code state và thao tác

~~~js
const form = reactive({
  email: '',
  lines: [{ id: 1, name: '', amount: 0 }],
});
let nextId = 2;
const lineRefs = {};

function setLineRef(id, el) { if (el) lineRefs[id] = el; }

function addLine() {
  const id = nextId++;
  form.lines.push({ id, name: '', amount: 0 });
  nextTick(() => lineRefs[id] && lineRefs[id].focus());
}

function removeLine(id) {
  if (form.lines.length === 1) return;      // luôn giữ một dòng
  const i = form.lines.findIndex(l => l.id === id);
  if (i >= 0) form.lines.splice(i, 1);
}

const total = computed(() =>
  form.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
);
~~~

Template:

~~~html
<div v-for="line in form.lines" :key="line.id">
  <input :ref="el => setLineRef(line.id, el)" v-model="line.name" />
  <input v-model.number="line.amount" type="number" min="0" />
  <button @click="removeLine(line.id)">Xóa</button>
</div>
<p>Tổng: {{ total }}</p>
~~~

v-model.number quan trọng: nếu không, amount là chuỗi và phép cộng sẽ nối chuỗi, tổng thành 010 thay vì 10.

### Phía server: DTO và map lỗi

~~~java
public record OrderForm(@Email String email,
                        @NotEmpty List<@Valid Line> lines) {
  public record Line(Long id, @NotBlank String name,
                     @Positive BigDecimal amount) {}
}
~~~

Server trả ProblemDetail có errors kèm id dòng để client dò lại:

~~~java
@PostMapping("/orders")
ResponseEntity<OrderView> create(@Valid @RequestBody OrderForm form,
                                 BindingResult br) {
  if (br.hasErrors()) {
    ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    Map<String, String> errors = new HashMap<>();
    br.getFieldErrors().forEach(f -> errors.put(f.getField(), f.getDefaultMessage()));
    pd.setProperty("errors", errors);
    return ResponseEntity.badRequest().body(pd);
  }
  return ResponseEntity.ok(service.create(form));
}
~~~

### Bảng trade-off validate

| Cách | Ưu | Nhược | Dùng khi |
|---|---|---|---|
| Chỉ validate field khi blur | nhẹ, thông báo rõ | bỏ sót lỗi chéo | form dưới 10 trường |
| Validate toàn form mỗi keystroke | bắt hết ngay | lag, nhiễu thông báo | form rất nhỏ |
| Watch deep cộng debounce 250 ms | cân bằng | phải dọn watcher khi unmount | form nhiều dòng như ở đây |
| Validate ở server rồi map về | đúng nghiệp vụ | tốn một vòng mạng | luôn cần, nhưng không thay client |

### Lỗi hay gặp

- key bằng index, hoặc v-model trên phần tử mảng theo index sau khi splice.
- Dùng v-model với type=number mà thiếu .number.
- Gửi id dòng bằng index; khi client xóa dòng thì chỉ số lệch và map lỗi sai dòng.
- Không chặn xóa dòng cuối, server trả 400 với @NotEmpty khó hiểu với người dùng.
- Watch deep không debounce: mỗi ký tự chạy validate toàn bộ, form 200 dòng giật.
- Reset bằng form.lines = [] làm mất tham chiếu, component con đang giữ props cũ; nên splice hoặc gán mảng mới rồi nextTick.
- Quên beforeunload nên người dùng F5 mất dữ liệu đã gõ.

### Ví dụ đời thực

Form đơn hàng 200 dòng. Mỗi lần gõ amount, watcher deep chạy validate toàn bộ 200 dòng cộng parse 200 số, mất 320 ms mỗi ký tự, cảm giác lag rõ. Sau khi chỉ validate dòng đang sửa cộng tổng, thêm debounce 250 ms và .number, còn 45 ms. Một ca khác: người dùng xóa dòng thứ 3, nội dung của dòng 4 nhảy lên ô đang focus vì key bằng index; đổi sang key bằng id là hết.

### Trả lời mẫu khi phỏng vấn

Tôi giữ form là một reactive object với mảng lines, mỗi dòng có id tăng dần, và v-for dùng key là id đó; nếu dùng index thì xóa dòng ở giữa làm DOM bị tái sử dụng sai và nội dung nhảy chỗ. Thêm dòng thì push rồi nextTick focus ô đầu; xóa thì tìm theo id và splice, luôn giữ ít nhất một dòng. Tổng tiền là computed, và watcher deep có debounce 250 ms chỉ validate dòng vừa đổi cộng tổng, không validate cả form mỗi ký tự. Khi gửi, mỗi dòng kèm id; server trả lỗi kèm id dòng, tôi dò theo id chứ không theo chỉ số vì client có thể đã xóa dòng. Tôi thêm dirty tracking so với snapshot ban đầu và chặn điều hướng khi còn thay đổi chưa lưu.

> Senior tip: v-model trên mảng theo index là nguồn bug âm thầm nhất trong form động, vì nó chỉ sai sau khi xóa hoặc sắp xếp lại. Luôn gắn id nghiệp vụ cho từng dòng ngay từ lúc tạo, đừng dùng id tạm bằng index.`,
  tags: ['vue3', 'form', 'form-array', 'validation', 'key', 'dirty'],
  follow: ['key bằng id khác index thế nào', 'watch deep và debounce phối hợp ra sao', 'beforeRouteLeave chặn điều hướng thế nào']
},
{
  id: 'frontend-032',
  topic: 'frontend',
  level: 'senior',
  q: 'Một Pinia store trong dự án Vue phình thành 40 field và 12 action, dùng cho cả giỏ hàng, thanh toán và trang admin. Bạn chia lại thế nào, khi nào dùng storeToRefs, SSR mỗi request phải làm gì để không lẫn dữ liệu người dùng, và logout thì reset ra sao?',
  a: `**Tóm tắt:** Chia store theo miền nghiệp vụ giống như backend chia service: cart, checkout, session, ui; store chỉ giữ state, getter suy diễn và action gọi API. Dấu hiệu god store là nhiều màn hình không liên quan dùng chung một file, action gọi nhiều API khác nhau, và phải reset thủ công sau khi logout. Với SSR, mỗi request phải tạo một Pinia instance riêng, vì nếu dùng biến toàn cục thì người dùng A đọc được state của người dùng B. Setup store không có $reset, phải tự viết hàm reset.

### Cơ chế bên trong Pinia

1. defineStore(id, setup) nhận một hàm setup trả về các ref, computed và hàm; Pinia biến ref thành state, computed thành getter, hàm thành action.
2. State là reactive thật: gán store.lines = [] là đổi state và component dùng nó sẽ cập nhật.
3. Destructure state làm mất kết nối reactive, phải dùng storeToRefs. Destructure action thì được, vì action chỉ là hàm.
4. Store khác gọi được bằng cách gọi useOtherStore() bên trong action hoặc setup, lúc đó đã có active pinia.
5. $reset chỉ tồn tại ở option store, vì Pinia lưu state khởi tạo; setup store phải tự viết hàm reset hoặc tạo store mới.
6. SSR: mỗi request tạo createPinia(), gọi app.use(pinia), rồi mới render; state nằm trong pinia đó nên không dùng chung giữa các request.
7. Devtools hiển thị timeline action và snapshot state, hữu ích để thấy action nào làm đổi field nào.

### Code store chia theo miền

~~~js
export const useCartStore = defineStore('cart', () => {
  const lines = ref([]);                     // [{ sku, qty, price }]
  const count = computed(() => lines.value.reduce((s, l) => s + l.qty, 0));
  const total = computed(() => lines.value.reduce((s, l) => s + l.qty * l.price, 0));

  async function load() {
    const res = await api.get('/cart');      // server tính total, client chỉ hiển thị
    lines.value = res.data.lines;
  }
  function add(sku, qty) {
    const line = lines.value.find(l => l.sku === sku);
    if (line) line.qty += qty;
    else lines.value.push({ sku, qty, price: 0 });
  }
  function $reset() { lines.value = []; }    // setup store phải tự viết
  return { lines, count, total, load, add, $reset };
});

export const useCheckoutStore = defineStore('checkout', () => {
  const address = ref(null);
  const shipping = ref('standard');
  function $reset() { address.value = null; shipping.value = 'standard'; }
  return { address, shipping, $reset };
});

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false);
  const modal = ref(null);
  return { sidebarOpen, modal };
});
~~~

Log out:

~~~js
function logout() {
  useCartStore().$reset();
  useCheckoutStore().$reset();
  useSessionStore().$reset();
  router.push('/login');
}
~~~

Component dùng store đúng cách:

~~~js
const cart = useCartStore();
const { count, total } = storeToRefs(cart);   // giữ reactive
const { add } = cart;                          // action destructure được
~~~

### Phía server: tổng tiền do server tính

~~~java
record CartLine(String sku, int qty, BigDecimal price) {}
record CartView(List<CartLine> lines, BigDecimal total, int count) {}

@GetMapping("/cart")
CartView cart(Principal p) {
  List<CartLine> lines = cartService.linesOf(p.getName());
  BigDecimal total = lines.stream()
      .map(l -> l.price().multiply(BigDecimal.valueOf(l.qty)))
      .reduce(BigDecimal.ZERO, BigDecimal::add);
  return new CartView(lines, total, lines.size());
}
~~~

Client không tự tính tổng để làm nguồn chân lý, vì giá có thể đổi sau khi thêm vào giỏ; client chỉ hiển thị và gọi lại API khi cần.

### Bảng trade-off

| Cách | Ưu | Nhược | Khi nào |
|---|---|---|---|
| Một store duy nhất | dễ chia sẻ, ít file | god store, khó test, dễ lệch | app dưới 5 màn hình |
| Store theo miền cộng store session, ui | ranh giới rõ, test dễ | phải quy ước gọi chéo | hầu hết SPA vừa và lớn |
| Pinia cộng TanStack Query cho server state | cache, invalidate, retry sẵn | thêm dependency | nhiều màn hình đọc cùng dữ liệu |

### Lỗi hay gặp

- Destructure state: const { count } = store làm mất reactive; phải dùng storeToRefs.
- Gọi useCartStore() ở top-level module trước khi app.use(pinia) nên không có active pinia.
- Logout quên reset: người dùng B vẫn thấy tên và giỏ hàng của người dùng A trên cùng trình duyệt.
- Persist plugin lưu cả token hoặc dữ liệu cá nhân vào localStorage.
- SSR dùng một pinia global nên state của request trước rò sang request sau.
- Store chứa cả state chỉ một màn hình dùng, làm state colocation biến mất và khó biết field nào còn sống.

### Ví dụ đời thực

Store cart 40 field, 12 action, dùng chung cho giỏ hàng, thanh toán và trang admin. Sau khi logout, dropdown vẫn hiện tên khách cũ vì không reset; mỗi lần sửa một field nhỏ thì cả layout re-render. Chia thành cart (lines, count, total), checkout (address, shipping) và ui (sidebar, modal) giảm file từ 620 xuống 180 dòng; reset chỉ còn ba lời gọi, và số component re-render khi gõ địa chỉ giảm vì chúng chỉ đọc checkout.

### Trả lời mẫu khi phỏng vấn

Tôi chia store theo miền như backend chia service: cart, checkout, session, ui, mỗi store chỉ giữ state, getter suy diễn và action gọi API. Tổng tiền để server tính và trả về, client chỉ hiển thị, tránh lệch khi giá đổi. Destructure state thì tôi dùng storeToRefs, còn action thì destructure trực tiếp được. Logout phải gọi reset từng store, vì setup store không có $reset nên tôi tự viết. Với SSR, mỗi request tôi tạo createPinia() mới rồi app.use, nếu không state người dùng trước sẽ rò sang người sau. Tôi cũng không persist token vào localStorage.

> Senior tip: Store lớn thường là dấu hiệu backend chưa có endpoint đúng miền, khiến client phải giữ tạm nhiều dữ liệu. Trước khi chia store, hãy xem có API nào gộp được dữ liệu không; chia store mà API vẫn trả từng mảnh thì chỉ dời chỗ rắc rối.`,
  tags: ['vue3', 'pinia', 'state-management', 'ssr', 'storetores', 'reset'],
  follow: ['$reset khác nhau giữa option store và setup store thế nào', 'storeToRefs khác toRefs ra sao', 'Pinia trên SSR vì sao mỗi request một instance']
},
{
  id: 'frontend-033',
  topic: 'frontend',
  level: 'lead',
  q: 'SPA lưu JWT thế nào cho an toàn? So sánh localStorage, sessionStorage, biến trong bộ nhớ và cookie HttpOnly; trình bày luồng refresh token có rotation và phát hiện tái sử dụng, single-flight khi nhiều request cùng 401, CSRF khi dùng cookie, và vì sao guard ở client không phải là bảo mật.',
  a: `**Tóm tắt:** Nơi lưu token quyết định mô hình đe dọa: localStorage tiện nhưng mọi lỗ hổng XSS đều đọc được token và gửi về máy kẻ tấn công; cookie HttpOnly chặn JavaScript đọc nhưng trình duyệt tự đính kèm cookie nên mở cửa cho CSRF; biến trong bộ nhớ an toàn nhất với XSS nhưng mất sau F5. Kiến trúc thường dùng là access token ngắn hạn 5–15 phút giữ trong bộ nhớ, refresh token dài hạn trong cookie HttpOnly cộng Secure cộng SameSite, mỗi lần refresh xoay token, và nếu token cũ bị dùng lại thì thu hồi cả chuỗi.

### Cơ chế, từng bước

1. Đăng nhập thành công: server đặt cookie rt với HttpOnly, Secure, SameSite=Strict, path giới hạn ở /api/auth, Max-Age 14 ngày; trả access token cho client giữ trong biến JS.
2. Mỗi request API gắn Authorization: Bearer cộng access token, kèm credentials include để cookie rt được gửi khi gọi refresh.
3. Access token hết hạn thì server trả 401. Client không để từng request tự refresh, vì mười request cùng 401 sẽ sinh mười lần refresh.
4. Client dùng single-flight: mọi request 401 xếp hàng chờ một lời gọi refresh duy nhất.
5. Server nhận cookie rt, kiểm tra chữ ký và trạng thái thu hồi, cấp access token mới cộng refresh token mới, đồng thời đánh dấu token cũ là đã dùng.
6. Nếu token cũ xuất hiện lần hai, coi như bị đánh cắp: thu hồi toàn bộ chuỗi của thiết bị đó và buộc đăng nhập lại.
7. Logout gọi API thu hồi refresh token ở server, xóa cookie, xóa state.

### Vì sao cần rotation cộng reuse detection

Refresh token sống 14 ngày. Nếu không xoay, một lần lộ là kẻ tấn công dùng được 14 ngày, kể cả khi người dùng đã đổi mật khẩu. Rotation làm mỗi token chỉ dùng một lần; khi kẻ tấn công dùng token đã bị xoay, hệ thống phát hiện ngay và thu hồi chuỗi. Đây là cách các nhà cung cấp lớn làm, vì nó biến một lần lộ token thành một lần đăng nhập lại chứ không phải mất tài khoản.

### Code client: single-flight

~~~js
let accessToken = null;          // chỉ trong bộ nhớ, không localStorage
let refreshing = null;           // một Promise dùng chung cho mọi request

async function refresh() {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST', credentials: 'include',   // cookie rt đi kèm tự động
  });
  if (!res.ok) { accessToken = null; throw new Error('refresh failed'); }
  accessToken = res.headers.get('X-Access-Token');
}

async function request(url, opts = {}) {
  const send = () => fetch(url, {
    ...opts, credentials: 'include',
    headers: {
      ...(opts.headers || {}),
      ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
    },
  });
  let res = await send();
  if (res.status !== 401) return res;
  if (!refreshing) refreshing = refresh().finally(() => { refreshing = null; });
  await refreshing;
  if (!accessToken) throw new Error('session expired');
  return send();                  // phát lại đúng một lần
}
~~~

### Code server: cookie và rotation

~~~java
@PostMapping("/auth/refresh")
ResponseEntity<Void> refresh(@CookieValue("rt") String rt,
                             HttpServletResponse res) {
  Session s = tokenService.rotate(rt);   // thu hồi rt cũ, cấp rt mới
  ResponseCookie cookie = ResponseCookie.from("rt", s.refreshToken())
      .httpOnly(true).secure(true).sameSite("Strict")
      .path("/api/auth").maxAge(Duration.ofDays(14)).build();
  res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  return ResponseEntity.ok()
      .header("X-Access-Token", s.accessToken())
      .build();
}
~~~

Nếu không muốn trả access token qua header, có thể để access token trong bộ nhớ bằng cách trả trong body JSON, nhưng khi đó phải đảm bảo response không bị log. Header chỉ là một lựa chọn, điểm chính là cookie rt không bao giờ cho JavaScript đọc.

### Bảng so sánh nơi lưu token

| Nơi lưu | XSS đọc được | CSRF | Mất khi F5 | Ghi chú |
|---|---|---|---|---|
| localStorage | Có | Không | Không | Tiện nhất, rủi ro nhất |
| sessionStorage | Có | Không | Có | Ít rủi ro hơn chút, vẫn đọc được |
| Biến trong bộ nhớ | Không | Không | Có | Phải ghép refresh cookie |
| Cookie HttpOnly | Không | Có | Không | Phải có SameSite cộng CSRF token |

### Lỗi hay gặp

- Lưu cả access và refresh token ở localStorage: một lỗ hổng XSS ở thư viện render markdown là mất tài khoản.
- Refresh không rotation, token lộ dùng được đến hết hạn.
- Nhiều tab cùng hết hạn: năm tab cùng refresh, các token bị xoay lẫn nhau làm người dùng bị đăng xuất.
- SameSite=None mà thiếu Secure: trình duyệt không gửi cookie, hoặc gửi trong ngữ cảnh không an toàn.
- Access token trong query string: vào access log và header Referer.
- Chỉ dựa vào guard ở client: guard chỉ để điều hướng, API vẫn phải kiểm tra token.
- Logout chỉ xóa token ở client mà không thu hồi ở server.
- Không đặt timeout cho refresh; mạng treo thì mọi request đứng im.

### CSRF khi dùng cookie

Cookie được trình duyệt tự gửi, kể cả khi request đến từ site khác, nên kẻ tấn công có thể dựng form POST tới /api/transfer. Ba lớp phòng thủ: SameSite=Strict hoặc Lax để cookie không đi kèm request cross-site; kiểm tra Origin hoặc Referer ở server; và CSRF token dạng double submit, server cấp một token ngẫu nhiên, client gửi lại ở header, server so khớp. Với API thuần JSON và CORS whitelist, SameSite cộng kiểm tra Origin thường đã đủ, nhưng vẫn nên có CSRF token cho các request ghi.

### Ví dụ đời thực

Một SPA lưu refresh token trong localStorage. Thư viện render markdown chèn HTML không escape tạo lỗ hổng XSS; kẻ tấn công đọc localStorage và gửi token về. Bốn tài khoản bị chiếm, kẻ tấn công dùng token trong 11 ngày. Sau khi chuyển sang cookie HttpOnly cộng Secure cộng SameSite=Strict, thêm rotation và CSP, cùng lỗ hổng XSS vẫn còn nhưng không đọc được token; thêm rotation thì cửa sổ lạm dụng giảm từ 14 ngày xuống 2 phút.

### Trả lời mẫu khi phỏng vấn

Tôi tách hai loại token: access token ngắn hạn 10 phút giữ trong biến JS, refresh token 14 ngày trong cookie HttpOnly, Secure, SameSite=Strict và path giới hạn ở /api/auth. Khi 401, client không cho mỗi request tự refresh mà dùng single-flight: các request xếp hàng chờ một lời gọi refresh, xong thì phát lại. Server xoay refresh token mỗi lần dùng và đánh dấu token đã dùng; nếu token cũ xuất hiện lần hai thì thu hồi cả chuỗi, coi như bị đánh cắp. Vì refresh dựa vào cookie, tôi thêm CSRF token double submit và kiểm tra Origin ở server. Guard ở client chỉ để điều hướng, mọi API vẫn kiểm tra token ở server. Tôi đo được cửa sổ lạm dụng giảm từ 14 ngày xuống 2 phút.

> Senior tip: Câu hỏi này không có đáp án đúng tuyệt đối, vì localStorage cộng CSP nghiêm ngặt cũng là lựa chọn hợp lệ trong một số hệ thống nội bộ. Điều quan trọng là bạn nêu được mô hình đe dọa: XSS đọc được gì, CSRF gửi được gì, và mỗi lớp phòng thủ chặn được kịch bản nào.`,
  tags: ['security', 'jwt', 'refresh-token', 'csrf', 'xss', 'single-flight'],
  follow: ['rotation và reuse detection hoạt động thế nào', 'SameSite Lax khác Strict ra sao', 'guard ở client vì sao không phải bảo mật']
},
);

