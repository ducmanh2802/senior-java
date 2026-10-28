(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-architecture-001',
  track: 'architecture',
  order: 1,
  title: 'Parking Lot: Strategy cho tính phí và Factory cho loại xe',
  level: 'senior',
  minutes: 30,
  goals: [
    'Dẫn dắt buổi LLD từ yêu cầu đến sơ đồ class và lý do chọn pattern',
    'Áp dụng Strategy cho bảng giá theo giờ và Factory cho phân loại xe',
    'Xử lý concurrency khi nhiều xe vào cùng một tầng và tránh deadlock',
  ],
  body: `**Tóm tắt:** Thiết kế bãi đỗ xe nhiều tầng với Strategy tính phí và Factory tạo xe, tách biệt thuật toán giá thành khỏi logic tìm chỗ và hỗ trợ thêm bảng giá mới mà không sửa code cũ.

### LLD bắt đầu từ câu hỏi làm rõ, không từ sơ đồ
Trong vòng phỏng vấn LLD, interviewer không muốn bạn vẽ UML ngay lập tức. Họ muốn bạn đi theo quy trình: **làm rõ yêu cầu** (loại xe, số tầng, cách tính phí, có cần đặt trước chỗ không), **xác định entity chính** (Vehicle, ParkingSpot, ParkingFloor, Ticket, PricingStrategy), **vẽ quan hệ** (một tầng chứa nhiều chỗ, một chỗ chứa tối đa một xe), **chọn pattern** và **giải thích vì sao**, rồi mới nói đến concurrency và mở rộng.

### Bài toán Parking Lot
Yêu cầu điển hình: bãi đỗ xe nhiều tầng, mỗi tầng có nhiều chỗ, hỗ trợ nhiều loại xe (motorcycle, compact car, large truck), tính phí theo giờ hoặc theo giờ cố định, có khả năng thêm bảng giá mới cho ngày lễ mà không sửa code tính phí cũ.

### Entity và quan hệ
~~~text
ParkingLot
  |-- ParkingFloor (1..n)
        |-- ParkingSpot (1..n)
              |-- Vehicle (0..1)
Ticket
PricingStrategy (interface)
  |-- HourlyPricing
  |-- FlatRatePricing
  |-- HolidayPricing
VehicleFactory (interface / abstract)
  |-- MotorcycleFactory
  |-- CarFactory
  |-- TruckFactory
~~~

Mỗi tầng có một danh sách chỗ; mỗi chỗ có trạng thái (available / occupied / reserved) và kích thước (small, medium, large). Xe phải khớp kích thước với chỗ. Khi xe vào, hệ thống tìm chỗ phù hợp ở tầng gần nhất (hoặc theo chiến lược điều phối), tạo ticket, tính phí qua Strategy.

### Strategy cho tính phí
PricingStrategy định nghĩa phương thức {{calculateFee(durationMinutes, vehicleType)}}. Mỗi chiến lược thực hiện công thức riêng. Khi thêm bảng giá ngày lễ, bạn viết một lớp mới kế thừa Strategy và đăng ký vào factory hoặc injector; các lớp tính phí cũ không bị sửa — đúng nguyên tắc Open/Closed (OCP).

Điểm quan trọng khi trả lời phỏng vấn: Strategy tách **thuật toán thay đổi** khỏi **đối tượng sử dụng**. ParkingLot không cần biết giá được tính theo giờ, theo ngày hay theo loại xe; nó chỉ gọi {{strategy.calculateFee}}. Nhờ vậy cùng một bãi có thể đổi bảng giá theo mùa, theo khung giờ hoặc theo hợp đồng khách hàng mà không chạm vào logic tìm chỗ.

### Factory cho phân loại xe
VehicleFactory tạo đối tượng Vehicle từ dữ liệu đầu vào (biển số, loại). Nếu người dùng nhập sai loại hoặc thêm loại xe mới (ví dụ xe điện có kích thước riêng), bạn thêm một factory mới mà không sửa logic tìm chỗ chính. Điều này giữ nguyên Single Responsibility (SRP): factory chỉ chịu trách nhiệm tạo đối tượng.

### SOLID áp dụng ở đâu
- **SRP:** Ticket chỉ lưu dữ liệu vé; PricingStrategy chỉ tính tiền; SpotAllocator chỉ tìm chỗ.
- **OCP:** thêm bảng giá hoặc loại xe mới bằng lớp mới, không sửa lớp cũ.
- **DIP:** ParkingLot phụ thuộc interface {{PricingStrategy}} và {{VehicleFactory}}, không phụ thuộc lớp cụ thể.
- **ISP:** interface nhỏ, mỗi interface một nhóm hành vi; không nhồi mọi thứ vào một interface khổng lồ.

### Trade-off khi chọn pattern
| Phương án | Ưu điểm | Nhược điểm | Khi nào chọn |
|---|---|---|---|
| if-else trong một service | Ít lớp, dễ đọc với 2-3 loại | Mỗi lần thêm loại phải sửa hàm lớn, dễ hồi quy | Prototype, ít thay đổi |
| Strategy + Factory | Mở rộng độc lập, test từng phần | Thêm lớp, cần đăng ký | Bài toán có nhiều biến thể giá/loại xe |
| Rule engine cấu hình | Đổi giá không cần deploy | Phức tạp vận hành, khó debug | Bảng giá thay đổi hằng ngày |

### Concurrency và edge case
Nhiều xe có thể cùng yêu cầu vào cùng một tầng. Nếu dùng một khoá cho cả tầng, hiệu năng giảm mạnh. Cách tốt hơn là khoá theo từng chỗ (fine-grained lock) hoặc dùng cấu trúc đồng thời (ví dụ ConcurrentHashMap ánh xạ chỗ -> trạng thái) và kiểm tra trạng thái bằng CAS. Phải tránh deadlock khi một xe cần chuyển từ tầng A sang tầng B vì tầng B đầy; tốt nhất là không cho phép di chuyển giữa tầng khi đã đậu.

### Mở rộng
Nếu cần hỗ trợ đặt chỗ trước (reservation), thêm entity Reservation gắn với user và thời gian bắt đầu. Khi xe đến, kiểm tra reservation và chuyển chỗ từ reserved sang occupied. Nếu cần tính phí theo từng phút chính xác, Strategy nhận thêm timestamp bắt đầu và kết thúc; khi xe ra, hệ thống tính chênh lệch thời gian và áp dụng chiến lược phù hợp theo khung giờ.

### Liên hệ phỏng vấn
Interviewer thường hỏi tiếp: "Nếu bãi đỗ có 10.000 chỗ và cần tìm chỗ trống trong < 10 ms, bạn dùng cấu trúc dữ liệu gì?". Trả lời senior: giữ một danh sách chỗ trống theo kích thước (ví dụ PriorityQueue hoặc ConcurrentSkipList) cho mỗi tầng, cập nhật khi có xe vào/ra. Nếu hỏi về SOLID: Strategy thể hiện Open/Closed, Factory thể hiện Dependency Inversion (DIP) khi ParkingLot phụ thuộc vào interface thay vì lớp cụ thể.

> Senior tip: trong LLD thực tế, tôi luôn vẽ một bảng trade-off ngắn trước khi chọn pattern: Strategy giúp thay đổi hành vi động nhưng thêm lớp trừu tượng; Factory giảm phụ thuộc trực tiếp nhưng cần cơ chế đăng ký. Nếu thời gian giới hạn, tôi chọn Strategy cho phần tính phí vì đó là phần thay đổi thường xuyên nhất theo yêu cầu kinh doanh.
`,
  exercises: [
    {
      title: 'Tạo ticket và tính phí bằng Strategy',
      prompt: `Hoàn thiện class {{TicketService}} nhận một {{PricingStrategy}} và tạo {{Ticket}} cho một xe. Phương thức {{calculateFee(long minutes)}} gọi chiến lược; {{Ticket}} lưu mã vé, thời gian vào và số tiền đã tính. Starter có sẵn interface {{PricingStrategy}} và class {{Ticket}}.

Yêu cầu:
- Không sửa interface {{PricingStrategy}} hoặc class {{Ticket}}.
- Nếu chiến lược trả về số âm hoặc 0, coi là lỗi và ném {{IllegalArgumentException}}.
- Phải có ít nhất một bài tập kiểm tra trường hợp thêm chiến lược mới (HolidayPricing) mà không sửa code cũ.`,
      starter: `interface PricingStrategy {
    int calculateFee(long minutes, String vehicleType);
}

class Ticket {
    private final String code;
    private final long entryTime;
    private final int fee;

    Ticket(String code, long entryTime, int fee) {
        this.code = code; this.entryTime = entryTime; this.fee = fee;
    }
    String code() { return code; }
    long entryTime() { return entryTime; }
    int fee() { return fee; }
}

class TicketService {
    private final PricingStrategy strategy;

    TicketService(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    Ticket issueTicket(String code, long entryTime, long minutes, String vehicleType) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name);
    }
    public static void main(String[] args) {
        PricingStrategy hourly = (m, v) -> (int) Math.max(1, m / 60.0 * 10);
        TicketService s = new TicketService(hourly);
        check("basic fee", s.issueTicket("T1", 1000, 120, "car").fee() == 20);

        PricingStrategy flat = (m, v) -> 50;
        TicketService s2 = new TicketService(flat);
        check("flat rate", s2.issueTicket("T2", 2000, 30, "truck").fee() == 50);

        PricingStrategy holiday = (m, v) -> (v.equals("truck") ? 100 : 30);
        TicketService s3 = new TicketService(holiday);
        check("holiday truck", s3.issueTicket("T3", 3000, 10, "truck").fee() == 100);
        check("holiday car", s3.issueTicket("T4", 3100, 10, "car").fee() == 30);

        boolean thrown = false;
        try {
            PricingStrategy bad = (m, v) -> -5;
            new TicketService(bad).issueTicket("T5", 4000, 10, "car");
        } catch (IllegalArgumentException e) { thrown = true; }
        check("negative fee throws", thrown);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface PricingStrategy {
    int calculateFee(long minutes, String vehicleType);
}

class Ticket {
    private final String code;
    private final long entryTime;
    private final int fee;

    Ticket(String code, long entryTime, int fee) {
        this.code = code; this.entryTime = entryTime; this.fee = fee;
    }
    String code() { return code; }
    long entryTime() { return entryTime; }
    int fee() { return fee; }
}

class TicketService {
    private final PricingStrategy strategy;

    TicketService(PricingStrategy strategy) {
        if (strategy == null) throw new IllegalArgumentException("strategy null");
        this.strategy = strategy;
    }

    Ticket issueTicket(String code, long entryTime, long minutes, String vehicleType) {
        int fee = strategy.calculateFee(minutes, vehicleType);
        if (fee <= 0) throw new IllegalArgumentException("fee must be positive");
        return new Ticket(code, entryTime, fee);
    }
}`,
      hints: [
        'Trong {{issueTicket}}, gọi {{strategy.calculateFee}} và kiểm tra kết quả trước khi tạo {{Ticket}}.',
        'Nếu cần thêm chiến lược mới, tạo một lớp implement {{PricingStrategy}}; {{TicketService}} không cần biết chi tiết đó.',
      ],
      explain: `Bài tập này kiểm tra khả năng áp dụng Strategy đúng cách: {{TicketService}} phụ thuộc vào interface {{PricingStrategy}}, không phụ thuộc vào lớp cụ thể. Khi thêm chiến lược ngày lễ, bạn chỉ cần tạo đối tượng mới truyền vào constructor; không sửa {{TicketService}}. Đây là minh chứng cho Open/Closed Principle trong thực tế. Lỗi hay gặp là quên kiểm tra kết quả từ chiến lược (ví dụ giá âm do lỗi tính toán) hoặc truyền null cho strategy.`
    },
  ],
  check: [
    {
      q: 'Trong thiết kế Parking Lot, vì sao dùng Strategy cho tính phí thay vì một hàm tính duy nhất?',
      options: [
        'Để giảm số dòng code',
        'Để thêm bảng giá mới mà không sửa code cũ (Open/Closed)',
        'Để tăng tốc độ tính toán',
        'Để tránh dùng interface',
      ],
      answer: 1,
      explain: `Strategy cho phép thêm chiến lược mới bằng cách tạo lớp mới implement interface; code tính phí hiện tại không bị sửa — đúng nguyên tắc Open/Closed.`
    },
    {
      q: 'Factory cho loại xe giúp giảm phụ thuộc trực tiếp vào lớp cụ thể nào?',
      options: [
        'ParkingSpot',
        'Ticket',
        'Vehicle',
        'PricingStrategy',
      ],
      answer: 2,
      explain: `Factory tạo đối tượng {{Vehicle}} từ dữ liệu đầu vào; code chính chỉ phụ thuộc vào abstract class hoặc interface {{Vehicle}}, không phụ thuộc trực tiếp vào {{Car}} hay {{Truck}}.`
    },
    {
      q: 'Nếu nhiều xe cùng yêu cầu một chỗ trống cuối cùng, cách tránh deadlock tốt nhất là gì?',
      options: [
        'Dùng một khoá toàn cục cho cả bãi',
        'Khoá theo từng chỗ và kiểm tra trạng thái bằng CAS',
        'Không cho xe vào nữa',
        'Dùng synchronized trên lớp ParkingLot',
      ],
      answer: 1,
      explain: `Khoá toàn cục làm giảm hiệu năng cực mạnh; khoá theo từng chỗ cho phép nhiều thao tác song song và tránh deadlock khi không cần khóa nhiều chỗ cùng lúc.`
    },
  ],
  related: ['architecture-003', 'architecture-010', 'design-004'],
  tags: ['parking-lot', 'strategy-pattern', 'factory-pattern', 'LLD'],
},
{
  id: 'lesson-architecture-002',
  track: 'architecture',
  order: 2,
  title: 'Elevator: State pattern và chiến lược điều phối',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô phỏng trạng thái thang máy bằng State pattern và chuyển đổi xác định',
    'So sánh chiến lược điều phối FCFS và SCAN và chọn theo tải',
    'Xử lý mô phỏng theo tick thời gian mà không phụ thuộc đồng hồ thực',
  ],
  body: `**Tóm tắt:** Mô phỏng thang máy bằng State pattern với từng trạng thái là một lớp riêng, kết hợp chiến lược điều phối FCFS/SCAN/LOOK để chọn thang phù hợp theo tải.

### Vấn đề Elevator
Một toà nhà có nhiều thang máy, mỗi thang có nhiều tầng. Mỗi thang có các trạng thái: {{IDLE}}, {{MOVING_UP}}, {{MOVING_DOWN}}, {{DOOR_OPEN}}. Khi có yêu cầu từ tầng (gọi thang) hoặc từ bên trong (chọn tầng đích), hệ thống phải chọn thang phù hợp, di chuyển, mở cửa và đóng cửa đúng thời điểm.

### Sơ đồ class
~~~text
Elevator
  |-- ElevatorState (interface)
  |     |-- IdleState
  |     |-- MovingUpState
  |     |-- MovingDownState
  |     |-- DoorOpenState
  |     |-- OutOfServiceState  (mở rộng)
  |-- targetFloor, currentFloor, openTicks
Dispatcher (interface)
  |-- NearestCarStrategy  (FCFS)
  |-- ScanStrategy
  |-- LookStrategy
Building
  |-- Elevator (1..n)
  |-- Dispatcher
~~~

### State pattern cho thang
Thay vì dùng một biến trạng thái và một câu lệnh {{if-else}} dài, mỗi trạng thái là một lớp thực hiện interface {{ElevatorState}}. Phương thức {{handleRequest}} hoặc {{tick}} được gọi theo trạng thái hiện tại. Khi chuyển trạng thái, đối tượng hiện tại gọi {{elevator.setState(new MovingUpState())}}. Điều này giữ nguyên Single Responsibility: mỗi lớp chỉ chịu trách nhiệm cho hành vi của một trạng thái.

Điểm cốt lõi là **trạng thái sở hữu luật chuyển**. {{DoorOpenState}} biết rằng phải đếm đủ 3 tick trước khi đóng cửa; {{MovingUpState}} biết rằng mỗi tick chỉ được tăng một tầng và chỉ mở cửa khi đã tới đích. Nếu nhét các luật này vào một hàm {{tick}} khổng lồ, mỗi lần thêm trạng thái mới bạn phải sửa mọi nhánh if và rất dễ làm hỏng trạng thái cũ.

### Chiến lược điều phối
Có nhiều chiến lược chọn thang cho một yêu cầu:
- **FCFS (First Come First Served):** yêu cầu đầu tiên được gán cho thang gần nhất. Đơn giản nhưng có thể gây tải không đều.
- **SCAN:** thang di chuyển theo một hướng, phục vụ tất cả yêu cầu trên đường đi, rồi đổi hướng khi đến cuối. Tối ưu cho tải đều nhưng có thể làm chậm yêu cầu ở chiều ngược lại.
- **LOOK:** giống SCAN nhưng chỉ đi đến yêu cầu xa nhất theo hướng hiện tại rồi đổi hướng; giảm số lần đổi chiều so với SCAN.

Khi thiết kế cho một toà nhà thực tế, tôi thường chọn SCAN hoặc LOOK cho thang chính và FCFS cho thang phụ (ví dụ thang hàng hoá). Lý do: SCAN giảm thời gian chờ trung bình khi tải phân bố đều, còn FCFS dễ triển khai và dễ hiểu cho người vận hành.

### Trade-off chiến lược điều phối
| Chiến lược | Thời gian chờ trung bình | Độ phức tạp | Rủi ro chính |
|---|---|---|---|
| FCFS | Cao khi tải lệch | Thấp | Thang gần nhất bận liên tục, thang xa nhàn |
| SCAN | Thấp khi tải đều | Trung bình | Yêu cầu ngược chiều phải chờ hết lượt |
| LOOK | Thấp, ít đổi chiều hơn SCAN | Trung bình | Cần theo dõi hướng và tập đích chính xác |

### SOLID áp dụng ở đâu
- **SRP:** mỗi state chỉ lo hành vi của một trạng thái; {{Dispatcher}} chỉ chọn thang; {{Elevator}} chỉ giữ dữ liệu và di chuyển.
- **OCP:** thêm {{OUT_OF_SERVICE}} hoặc thang chỉ phục vụ tầng chẵn bằng lớp state/strategy mới, không sửa các state đang chạy.
- **LSP:** mọi {{ElevatorState}} thay thế được cho nhau qua {{setState}} mà {{Elevator}} không cần biết lớp cụ thể.
- **DIP:** {{Building}} phụ thuộc interface {{Dispatcher}} và {{ElevatorState}}, không phụ thuộc lớp cài đặt.

### Mô phỏng theo tick
Vì bài tập LLD thường yêu cầu mô phỏng theo thời gian xác định, chúng ta dùng một đồng hồ giả (tích tắc) truyền vào phương thức {{tick(long now)}}. Mỗi tick mô phỏng một khoảng thời gian (ví dụ 1 giây). Khi thang ở trạng thái {{DOOR_OPEN}}, sau một số tick cố định (ví dụ 3 tick), nó tự động chuyển sang trạng thái di chuyển. Khi ở trạng thái di chuyển, mỗi tick giảm khoảng cách đến đích một đơn vị. Cách này cho phép test hoàn toàn xác định, không cần {{Thread.sleep}}.

### Edge case và mở rộng
- **Nhiều thang cùng phục vụ một yêu cầu:** phải đảm bảo chỉ một thang nhận yêu cầu; dùng một bộ điều phối trung tâm hoặc một cấu trúc nguyên tử (ví dụ ConcurrentHashMap lưu trạng thái yêu cầu).
- **Yêu cầu từ tầng nhưng thang đang đi hướng ngược lại:** chiến lược điều phối phải tính toán khoảng cách và hướng hiện tại để chọn thang phù hợp.
- **Thang bị lỗi:** thêm trạng thái {{OUT_OF_SERVICE}} và chuyển mọi yêu cầu sang các thang còn lại. Vì trạng thái là một interface, bạn thêm lớp mới và gọi {{setState}} mà không sửa các state cũ.
- **Thang quá tải:** thêm giới hạn số người trong cabin; khi vượt quá, thang từ chối nhận thêm yêu cầu cho đến khi có người ra.

### Liên hệ phỏng vấn
Interviewer thường hỏi: "Nếu bạn phải thêm một tính năng mới — ví dụ thang chỉ phục vụ tầng chẵn — bạn sửa những phần nào mà không phá code cũ?". Câu trả lời senior: thêm một lớp chiến lược mới hoặc một trạng thái con (ví dụ {{EvenOnlyMovingUpState}}) kế thừa từ trạng thái cơ bản, và đăng ký nó vào factory hoặc cấu hình; các trạng thái và chiến lược hiện tại không bị ảnh hưởng.

> Senior tip: trong một dự án thật, tôi từng thấy một lỗi nghiêm trọng khi thang chuyển từ {{DOOR_OPEN}} sang {{MOVING_UP}} ngay lập tức mà không kiểm tra xem cửa đã đóng hoàn toàn chưa. Đó là lý do tôi luôn thêm một trạng thái trung gian {{DOOR_CLOSING}} và kiểm tra thời gian đóng cửa trước khi cho phép di chuyển, dù điều đó làm tăng số trạng thái.
`,
  exercises: [
    {
      title: 'Mô phỏng thang máy bằng State pattern theo tick',
      prompt: `Hoàn thiện class {{Elevator}} dùng interface {{ElevatorState}} để mô phỏng theo tick. Mỗi tick:
- Nếu trạng thái là {{DOOR_OPEN}} và đã đủ 3 tick, chuyển sang {{IDLE}} nếu không có đích, hoặc sang {{MOVING_UP}} / {{MOVING_DOWN}} nếu có đích mới.
- Nếu đang di chuyển, mỗi tick tiến một tầng; khi tới đích thì mở cửa.
- {{requestUp(int floor)}} và {{requestDown(int floor)}} chỉ nhận tầng hợp lệ theo hướng (cao hơn / thấp hơn tầng hiện tại) và trong khoảng 1..maxFloor.

Yêu cầu:
- Không dùng {{Thread.sleep}}; mọi thời gian tính bằng số tick.
- Cửa phải mở đúng 3 tick trước khi thang di chuyển tiếp.
- Thang phải chấp nhận một {{ElevatorState}} mới qua {{setState}} mà không cần sửa class {{Elevator}} (ví dụ trạng thái bảo trì).`,
      starter: `interface ElevatorState {
    String name();
    void tick(Elevator e);
}

class Elevator {
    private final int maxFloor;
    private int currentFloor;
    private ElevatorState state;

    Elevator(int maxFloor) {
        this.maxFloor = maxFloor;
        this.currentFloor = 1;
    }

    String state() { throw new UnsupportedOperationException("TODO"); }
    int currentFloor() { return currentFloor; }
    void setState(ElevatorState s) { this.state = s; }
    void requestUp(int floor) { throw new UnsupportedOperationException("TODO"); }
    void requestDown(int floor) { throw new UnsupportedOperationException("TODO"); }
    void tick() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static class MaintenanceState implements ElevatorState {
        public String name() { return "OUT_OF_SERVICE"; }
        public void tick(Elevator e) { }
    }
    public static void main(String[] args) {
        Elevator e = new Elevator(10);
        check("initial state", e.state().equals("IDLE") && e.currentFloor() == 1);
        e.requestUp(5);
        for (int i = 0; i < 4; i++) e.tick();
        check("after 4 ticks at floor 5", e.currentFloor() == 5);
        check("arrival opens door", e.state().equals("DOOR_OPEN"));
        e.tick();
        check("door still open after 1 tick", e.state().equals("DOOR_OPEN"));
        e.tick();
        check("door still open after 2 ticks", e.state().equals("DOOR_OPEN"));
        e.tick();
        check("door closes after 3 ticks", e.state().equals("IDLE"));

        Elevator e2 = new Elevator(5);
        e2.requestUp(3);
        for (int i = 0; i < 2; i++) e2.tick();
        check("moving up reaches floor 3", e2.currentFloor() == 3 && e2.state().equals("DOOR_OPEN"));
        for (int i = 0; i < 3; i++) e2.tick();
        e2.requestDown(1);
        for (int i = 0; i < 2; i++) e2.tick();
        check("moving down reaches floor 1", e2.currentFloor() == 1 && e2.state().equals("DOOR_OPEN"));

        Elevator e3 = new Elevator(10);
        e3.requestUp(4);
        for (int i = 0; i < 3; i++) e3.tick();
        check("at floor 4 with door open", e3.currentFloor() == 4 && e3.state().equals("DOOR_OPEN"));
        e3.requestUp(7);
        for (int i = 0; i < 3; i++) e3.tick();
        check("request during open door is queued", e3.state().equals("MOVING_UP"));
        for (int i = 0; i < 3; i++) e3.tick();
        check("queued request served after door closes", e3.currentFloor() == 7 && e3.state().equals("DOOR_OPEN"));

        Elevator e4 = new Elevator(5);
        e4.requestUp(0);
        e4.requestDown(9);
        e4.tick();
        check("invalid floors ignored", e4.state().equals("IDLE") && e4.currentFloor() == 1);

        Elevator e5 = new Elevator(5);
        e5.setState(new MaintenanceState());
        e5.requestUp(3);
        for (int i = 0; i < 5; i++) e5.tick();
        check("new state without editing Elevator", e5.state().equals("OUT_OF_SERVICE") && e5.currentFloor() == 1);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `interface ElevatorState {
    String name();
    void tick(Elevator e);
}

class Elevator {
    private final int maxFloor;
    private int currentFloor;
    private int targetFloor = -1;
    private ElevatorState state = new IdleState();

    Elevator(int maxFloor) {
        this.maxFloor = maxFloor;
        this.currentFloor = 1;
    }

    String state() { return state.name(); }
    int currentFloor() { return currentFloor; }
    int targetFloor() { return targetFloor; }
    void setState(ElevatorState s) { this.state = s; }

    void requestUp(int floor) {
        if (floor < 1 || floor > maxFloor || floor <= currentFloor) return;
        targetFloor = floor;
        if (state.name().equals("IDLE")) startMoving();
    }

    void requestDown(int floor) {
        if (floor < 1 || floor > maxFloor || floor >= currentFloor) return;
        targetFloor = floor;
        if (state.name().equals("IDLE")) startMoving();
    }

    void tick() { state.tick(this); }

    void startMoving() {
        if (targetFloor == -1) return;
        if (targetFloor > currentFloor) setState(new MovingUpState());
        else if (targetFloor < currentFloor) setState(new MovingDownState());
        else setState(new DoorOpenState());
    }

    void moveOneFloor(int delta) { currentFloor += delta; }

    void arrive() {
        targetFloor = -1;
        setState(new DoorOpenState());
    }
}

class IdleState implements ElevatorState {
    public String name() { return "IDLE"; }
    public void tick(Elevator e) { e.startMoving(); }
}

class MovingUpState implements ElevatorState {
    public String name() { return "MOVING_UP"; }
    public void tick(Elevator e) {
        if (e.currentFloor() < e.targetFloor()) {
            e.moveOneFloor(1);
            if (e.currentFloor() == e.targetFloor()) e.arrive();
        } else {
            e.arrive();
        }
    }
}

class MovingDownState implements ElevatorState {
    public String name() { return "MOVING_DOWN"; }
    public void tick(Elevator e) {
        if (e.currentFloor() > e.targetFloor()) {
            e.moveOneFloor(-1);
            if (e.currentFloor() == e.targetFloor()) e.arrive();
        } else {
            e.arrive();
        }
    }
}

class DoorOpenState implements ElevatorState {
    private int openTicks = 0;

    public String name() { return "DOOR_OPEN"; }
    public void tick(Elevator e) {
        openTicks++;
        if (openTicks >= 3) {
            if (e.targetFloor() != -1) e.startMoving();
            else e.setState(new IdleState());
        }
    }
}`,
      hints: [
        'Trong {{tick}}, uỷ quyền cho {{state.tick(this)}}; mỗi state tự quyết định chuyển sang state nào.',
        'Đừng quên reset {{targetFloor}} khi tới đích, nếu không cửa sẽ mở lại ngay sau khi đóng.',
        'Với yêu cầu trong lúc cửa mở, chỉ ghi nhận đích; {{DoorOpenState}} sẽ khởi động di chuyển sau tick thứ 3.',
      ],
      explain: `Bài tập kiểm tra hai điều: State pattern thực sự (mỗi trạng thái là một lớp) và mô phỏng xác định theo tick. {{Elevator}} chỉ giữ dữ liệu và các thao tác chuyển tầng; luật chuyển trạng thái nằm trong từng state. Nhờ vậy, test có thể thêm {{MaintenanceState}} chỉ bằng cách implement {{ElevatorState}} và gọi {{setState}} — minh chứng Open/Closed. Lỗi hay gặp: quên reset đích sau khi mở cửa, hoặc cho thang di chuyển ngay trong tick cửa vừa đóng thay vì tick kế tiếp, khiến số tick lệch một đơn vị và test trở nên khó đoán.`
    },
  ],
  check: [
    {
      q: 'State pattern cho Elevator giúp giảm rủi ro gì so với một biến trạng thái và câu lệnh if dài?',
      options: [
        'Tăng số dòng code',
        'Giảm khả năng thêm trạng thái mới mà không sửa code cũ',
        'Đảm bảo mỗi trạng thái chỉ có hành vi của chính nó, giảm lỗi khi thêm trạng thái mới',
        'Tăng tốc độ mô phỏng',
      ],
      answer: 2,
      explain: `State pattern tách hành vi của từng trạng thái thành lớp riêng; thêm trạng thái mới (ví dụ {{OUT_OF_SERVICE}}) chỉ cần thêm lớp mới mà không sửa các lớp hiện tại.`
    },
    {
      q: 'Chiến lược SCAN so với FCFS khác nhau chủ yếu ở điểm nào?',
      options: [
        'SCAN luôn phục vụ yêu cầu gần nhất',
        'SCAN đi theo một hướng và phục vụ tất cả yêu cầu trên đường, rồi đổi hướng',
        'FCFS không cho phép đổi hướng',
        'SCAN chỉ hoạt động với một thang',
      ],
      answer: 1,
      explain: `SCAN di chuyển theo một chiều, phục vụ mọi yêu cầu trên đường đi; FCFS chỉ phục vụ yêu cầu đầu tiên nhận được.`
    },
    {
      q: 'Vì sao mô phỏng theo tick thay vì dùng thời gian thực?',
      options: [
        'Để giảm độ phức tạp thuật toán',
        'Để kiểm thử hoàn toàn xác định, không phụ thuộc đồng hồ thực',
        'Để tiết kiệm bộ nhớ',
        'Để tránh dùng interface',
      ],
      answer: 1,
      explain: `Tick giả cho phép kiểm tra hành vi chính xác theo từng bước; thời gian thực tạo ra test không ổn định (flaky) và khó kiểm soát.`
    },
  ],
  related: ['architecture-020', 'design-004'],
  tags: ['elevator', 'state-pattern', 'dispatch-strategy', 'simulation'],
},
{
  id: 'lesson-architecture-003',
  track: 'architecture',
  order: 3,
  title: 'Notification Service: Observer và nguyên tắc Open/Closed',
  level: 'mid',
  minutes: 25,
  goals: [
    'Dùng Observer để thêm subscriber mới mà không sửa code gửi thông báo',
    'Áp dụng Open/Closed cho kênh mới (Email, SMS, Push)',
    'Xử lý retry và template một cách tách biệt',
  ],
  body: `**Tóm tắt:** Xây dựng dịch vụ thông báo đa kênh bằng Observer pattern, cho phép thêm kênh mới (Email, SMS, Push) mà không sửa code gửi, cùng cơ chế retry và template tách biệt.

### Vấn đề thông báo đa kênh
Một hệ thống cần gửi thông báo cho người dùng qua nhiều kênh: Email, SMS, Push notification. Mỗi kênh có định dạng khác nhau, thời gian gửi khác nhau, và có thể thất bại. Nếu viết một hàm {{sendNotification}} chứa toàn bộ logic cho từng kênh, mỗi lần thêm kênh mới (ví dụ WhatsApp) bạn phải sửa hàm đó — vi phạm Open/Closed.

### Sơ đồ class
~~~text
NotificationService
  |-- List<Subscriber>
  |-- subscribe / unsubscribe / notify(Event)
Event
  |-- EventType (EMAIL | SMS | PUSH)
  |-- content
Subscriber (interface)
  |-- supports(EventType): boolean
  |-- notify(Event): void
  |-- EmailSubscriber
  |-- SmsSubscriber
  |-- PushSubscriber
  |-- DigestSubscriber   (mở rộng: nhận mọi loại)
NotificationChannel (interface)
  |-- EmailChannel / SmsChannel / PushChannel
RetryPolicy + TemplateEngine   (thành phần tách biệt)
~~~

### Observer cho subscriber
Thay vì gọi trực tiếp từng kênh, hệ thống giữ một danh sách subscriber (các đối tượng thực hiện interface {{Subscriber}}). Khi có sự kiện cần thông báo, hệ thống gọi {{notify}} cho từng subscriber. Nếu muốn thêm SMS, bạn tạo một lớp mới implement {{Subscriber}} và đăng ký vào danh sách; không sửa code gửi sự kiện.

Cơ chế hoạt động gồm ba bước cố định: (1) service duyệt danh sách subscriber, (2) hỏi {{supports(type)}} để lọc, (3) gọi {{notify(event)}}. Nhờ bước lọc, một subscriber chỉ quan tâm Push sẽ không bị làm phiền bởi sự kiện Email. Đây chính là điểm khiến Observer phù hợp với bài toán pub/sub trong bộ nhớ: publisher không biết subscriber là ai, chỉ biết hợp đồng chung.

### Kênh mới và Open/Closed
Interface {{NotificationChannel}} định nghĩa các phương thức: {{send(Message message)}}, {{supports(MessageType type)}}, {{getRetryPolicy()}}. Mỗi kênh cụ thể ({{EmailChannel}}, {{SmsChannel}}, {{PushChannel}}) thực hiện interface này. Khi thêm kênh mới, bạn chỉ tạo lớp mới và đăng ký vào container hoặc factory; các kênh hiện tại không bị ảnh hưởng.

### SOLID áp dụng ở đâu
- **SRP:** {{NotificationService}} chỉ điều phối; kênh chỉ gửi; template chỉ dựng nội dung; retry chỉ quyết định thử lại.
- **OCP:** thêm subscriber hoặc kênh bằng lớp mới, không sửa vòng lặp notify.
- **LSP:** mọi subscriber tuân đúng hợp đồng {{supports}} / {{notify}}, thay thế được cho nhau.
- **ISP:** interface nhỏ, không bắt subscriber phải cài đặt phương thức không dùng.
- **DIP:** service phụ thuộc abstraction {{Subscriber}}, không phụ thuộc {{EmailSubscriber}}.

### Trade-off
| Cách tiếp cận | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|
| Gọi trực tiếp từng kênh trong service | Ít lớp, dễ debug tuyến tính | Thêm kênh phải sửa service, khó test | 1-2 kênh cố định |
| Observer trong bộ nhớ | Mở rộng dễ, test bằng subscriber giả | Không bền khi restart, không scale ngang | Ứng dụng nhỏ, sự kiện nội bộ |
| Message queue + worker | Chịu tải lớn, retry bền vững, tách deploy | Hạ tầng phức tạp, cần idempotency | Hàng triệu thông báo |

### Retry và template
Retry và template phải tách biệt khỏi kênh gửi. Một lớp {{RetryPolicy}} định nghĩa số lần thử lại, khoảng chờ (backoff), và điều kiện nào được coi là lỗi tạm thời. Một lớp {{TemplateEngine}} tạo nội dung thông báo từ dữ liệu sự kiện và loại kênh. Việc tách biệt này cho phép bạn thay đổi chính sách retry cho một kênh cụ thể mà không ảnh hưởng đến các kênh khác.

### Edge case và mở rộng
- **Kênh bị lỗi liên tục:** sau số lần retry tối đa, hệ thống nên đánh dấu kênh đó là không khả dụng và chuyển sang kênh dự phòng (fallback) nếu có.
- **Thông báo trùng lặp:** nếu người dùng nhận thông báo qua cả Email và Push cho cùng một sự kiện, hệ thống cần một cơ chế deduplication (ví dụ lưu một khóa idempotency cho mỗi thông báo).
- **Tốc độ gửi:** nếu có hàng triệu người dùng cùng nhận thông báo, bạn cần một hàng đợi (message queue) và các worker xử lý song song; hệ thống gửi chỉ chịu trách nhiệm đẩy vào hàng đợi, không gửi trực tiếp.
- **Đăng ký trùng:** dùng {{Set}} thay vì {{List}} để một subscriber không nhận hai lần cùng một sự kiện.

### Liên hệ phỏng vấn
Interviewer thường hỏi: "Nếu bạn phải thêm một kênh mới mà không sửa bất kỳ file nào hiện có, bạn làm thế nào?". Trả lời senior: sử dụng một file cấu hình hoặc một registry tự động phát hiện các lớp mới (ví dụ qua annotation hoặc quét classpath), và đăng ký chúng vào container trong lúc khởi động. Điều này giữ nguyên nguyên tắc Open/Closed ở cả cấp độ code và cấu hình.

> Senior tip: tôi từng thấy một hệ thống sản xuất bị sập vì một kênh SMS bị lỗi và không có giới hạn retry; hệ thống liên tục thử lại và làm cạn tài nguyên CPU. Đó là lý do tôi luôn thêm một chính sách retry có cap và một cơ chế circuit breaker cho mỗi kênh trong thiết kế thực tế.
`,
  exercises: [
    {
      title: 'Đăng ký subscriber và gửi thông báo đúng kênh',
      prompt: `Hoàn thiện class {{NotificationService}}. Nó giữ danh sách {{Subscriber}} và cung cấp:
- {{subscribe(Subscriber s)}}: thêm subscriber, bỏ qua nếu null hoặc đã có.
- {{unsubscribe(Subscriber s)}}: xoá subscriber.
- {{notify(Event event)}}: gọi {{notify}} cho từng subscriber có {{supports(event.type())}} trả về true; bỏ qua nếu event null.

Interface {{Subscriber}} có {{boolean supports(EventType type)}} và {{void notify(Event event)}}. Class {{Event}} có {{EventType type}} và {{String content}}.

Yêu cầu:
- Không sửa interface {{Subscriber}} hoặc class {{Event}}.
- Subscriber không hỗ trợ loại sự kiện phải không nhận thông báo.
- Thêm subscriber mới (ví dụ nhận mọi loại sự kiện) phải hoạt động mà không sửa {{NotificationService}}.`,
      starter: `enum EventType { EMAIL, SMS, PUSH }

class Event {
    private final EventType type;
    private final String content;
    Event(EventType type, String content) { this.type = type; this.content = content; }
    EventType type() { return type; }
    String content() { return content; }
}

interface Subscriber {
    boolean supports(EventType type);
    void notify(Event event);
}

class NotificationService {
    // TODO: thêm danh sách subscriber và các phương thức
    void subscribe(Subscriber s) { throw new UnsupportedOperationException("TODO"); }
    void unsubscribe(Subscriber s) { throw new UnsupportedOperationException("TODO"); }
    void notify(Event event) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static class Counting implements Subscriber {
        final EventType only;
        int count = 0;
        String last = "";
        Counting(EventType only) { this.only = only; }
        public boolean supports(EventType t) { return only == null || only == t; }
        public void notify(Event e) { count++; last = e.content(); }
    }
    public static void main(String[] args) {
        NotificationService svc = new NotificationService();
        Counting email = new Counting(EventType.EMAIL);
        Counting sms = new Counting(EventType.SMS);
        svc.subscribe(email);
        svc.subscribe(sms);

        svc.notify(new Event(EventType.EMAIL, "welcome"));
        check("routes email only", email.count == 1 && sms.count == 0);
        check("delivers content", email.last.equals("welcome"));

        svc.notify(new Event(EventType.SMS, "otp 123"));
        check("routes sms separately", sms.count == 1 && email.count == 1);

        Counting email2 = new Counting(EventType.EMAIL);
        svc.subscribe(email2);
        svc.notify(new Event(EventType.EMAIL, "second"));
        check("all matching subscribers receive", email.count == 2 && email2.count == 1);

        svc.subscribe(email);
        svc.notify(new Event(EventType.EMAIL, "third"));
        check("duplicate subscribe ignored", email.count == 3 && email2.count == 2);

        svc.unsubscribe(email2);
        svc.notify(new Event(EventType.EMAIL, "after"));
        check("unsubscribe stops delivery", email.count == 4 && email2.count == 2);

        Counting all = new Counting(null);
        svc.subscribe(all);
        svc.notify(new Event(EventType.PUSH, "promo"));
        check("new subscriber type works", all.count == 1 && all.last.equals("promo"));

        boolean safe = true;
        try { svc.notify(null); } catch (RuntimeException e) { safe = false; }
        check("null event ignored", safe);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

enum EventType { EMAIL, SMS, PUSH }

class Event {
    private final EventType type;
    private final String content;
    Event(EventType type, String content) { this.type = type; this.content = content; }
    EventType type() { return type; }
    String content() { return content; }
}

interface Subscriber {
    boolean supports(EventType type);
    void notify(Event event);
}

class NotificationService {
    private final Set<Subscriber> subscribers = new LinkedHashSet<>();

    void subscribe(Subscriber s) {
        if (s != null) subscribers.add(s);
    }

    void unsubscribe(Subscriber s) {
        subscribers.remove(s);
    }

    void notify(Event event) {
        if (event == null) return;
        for (Subscriber s : subscribers) {
            if (s.supports(event.type())) s.notify(event);
        }
    }
}`,
      hints: [
        'Dùng {{Set}} (ví dụ {{LinkedHashSet}}) để tự động chặn đăng ký trùng.',
        'Trong {{notify}}, kiểm tra event null trước và gọi {{supports}} trước khi {{notify}} subscriber.',
      ],
      explain: `Bài tập kiểm tra Observer đúng nghĩa: service không biết subscriber cụ thể, chỉ biết hợp đồng {{supports}} / {{notify}}. Dùng {{Set}} giải quyết luôn edge case đăng ký trùng. Việc thêm {{Counting}} nhận mọi loại sự kiện trong test chứng minh Open/Closed: không có dòng nào trong {{NotificationService}} phải sửa. Lỗi hay gặp là lặp qua toàn bộ subscriber mà quên gọi {{supports}}, khiến người dùng nhận thông báo sai kênh; hoặc dùng {{List}} nên một subscriber đăng ký hai lần sẽ nhận hai thông báo.`
    },
  ],
  check: [
    {
      q: 'Nguyên tắc Open/Closed (OCP) áp dụng cho Notification Service như thế nào?',
      options: [
        'Sửa hàm notify mỗi lần thêm kênh mới',
        'Thêm lớp mới implement interface Subscriber mà không sửa code gửi',
        'Xoá các subscriber cũ',
        'Thay đổi interface Subscriber mỗi lần',
      ],
      answer: 1,
      explain: `OCP yêu cầu phần mềm mở rộng được (thêm hành vi) nhưng đóng lại với sửa đổi; thêm subscriber mới bằng lớp mới implement interface đáp ứng đúng điều đó.`
    },
    {
      q: 'Vì sao cần tách RetryPolicy và TemplateEngine khỏi kênh gửi?',
      options: [
        'Để giảm số dòng code',
        'Để có thể thay đổi chính sách retry hoặc mẫu nội dung độc lập cho từng kênh',
        'Để tránh dùng interface',
        'Để tăng tốc độ gửi',
      ],
      answer: 1,
      explain: `Tách biệt cho phép cấu hình retry và template riêng cho từng kênh mà không ảnh hưởng đến kênh khác.`
    },
    {
      q: 'Nếu có hàng triệu người dùng cùng nhận thông báo, hệ thống gửi nên làm gì?',
      options: [
        'Gửi trực tiếp từ hệ thống chính',
        'Đẩy vào hàng đợi và dùng worker xử lý song song',
        'Tắt thông báo',
        'Gọi từng subscriber trong một vòng lặp đồng bộ',
      ],
      answer: 1,
      explain: `Hàng đợi giúp tách tải gửi khỏi hệ thống chính và cho phép xử lý song song; gửi trực tiếp sẽ làm sập hệ thống.`
    },
  ],
  related: ['design-006', 'architecture-020', 'architecture-017'],
  tags: ['notification-service', 'observer-pattern', 'open-closed', 'retry'],
},
{
  id: 'lesson-architecture-004',
  track: 'architecture',
  order: 4,
  title: 'Vending Machine: State pattern, tiền thừa ít đồng nhất và hết hàng',
  level: 'mid',
  minutes: 30,
  goals: [
    'Cài state machine cho máy bán hàng tự động với trạng thái rõ ràng',
    'Tính tiền thừa ít đồng nhất khi số lượng mỗi mệnh giá có hạn',
    'Xử lý hết hàng, thiếu tiền và hết tiền lẻ mà không làm mất tiền người dùng',
  ],
  body: `**Tóm tắt:** Máy bán hàng tự động dùng State pattern quản lý luồng mua hàng, tính tiền thừa ít đồng nhất bằng quy hoạch động và kiểm tra đủ điều kiện trước khi nhả hàng.

### Vấn đề Vending Machine
Một máy bán hàng tự động có các trạng thái: {{WAITING_FOR_MONEY}}, {{SELECTING_ITEM}}, {{DISPENSING}}. Người dùng đưa tiền vào, chọn sản phẩm, nhận sản phẩm và nhận tiền thừa. Mỗi trạng thái có hành vi khác nhau: ở trạng thái chờ tiền, không thể chọn sản phẩm; ở trạng thái chọn sản phẩm, không thể thêm tiền; ở trạng thái nhả hàng, không thể đổi ý.

### Sơ đồ class
~~~text
VendingMachine
  |-- VendingState (interface)
  |     |-- WaitingForMoney
  |     |-- SelectingItem
  |     |-- DispensingState
  |     |-- MaintenanceState  (mở rộng, không sửa máy)
  |-- prices : Map<String,Integer>
  |-- stock  : Map<String,Integer>
  |-- cash   : Map<Integer,Integer>  (mệnh giá -> số đồng)
  |-- ChangeMaker (interface)
  |     |-- GreedyChangeMaker  (mệnh giá canonical)
  |     |-- DpChangeMaker      (tối ưu tổng quát)
Product
  |-- name, price
~~~

### State pattern cho máy
Mỗi trạng thái là một lớp thực hiện interface {{VendingState}}. Phương thức {{insert}}, {{select}} và {{refund}} được định nghĩa trong interface và thực hiện khác nhau tùy trạng thái. Khi người dùng thực hiện một hành động không phù hợp với trạng thái hiện tại (ví dụ chọn sản phẩm khi đang chờ tiền), phương thức trả về lỗi hoặc bỏ qua.

Lợi ích thực tế: mã lỗi và luật chuyển trạng thái nằm cùng một chỗ. Khi thêm trạng thái bảo trì, bạn tạo {{MaintenanceState}} từ chối mọi thao tác và gọi {{setState}} từ xa; không phải rải thêm câu lệnh if trong ba phương thức công khai.

### Trả tiền thừa ít đồng nhất
Khi người dùng đưa tiền nhiều hơn giá sản phẩm, hệ thống phải trả lại số tiền thừa bằng cách kết hợp các mệnh giá tiền có sẵn sao cho tổng số đồng tiền là ít nhất. Với bộ mệnh giá canonical (1, 5, 10, 25 hoặc 10, 50, 100, 200, 500), thuật toán greedy — luôn chọn mệnh giá lớn nhất có thể — cho kết quả tối ưu và rất nhanh.

Nhưng có hai cái bẫy. Thứ nhất, máy chỉ có **số lượng hữu hạn** mỗi mệnh giá, nên bước chọn phải lấy {{min(remaining / denomination, available)}}. Thứ hai, greedy không tối ưu với bộ mệnh giá không canonical: với {{1, 3, 4}} và amount 6, greedy cho 4+1+1 = 3 đồng trong khi 3+3 = 2 đồng là tối ưu. Khi yêu cầu là "ít đồng nhất" tuyệt đối, dùng quy hoạch động {{dp[i][a]}} = số đồng ít nhất dùng i mệnh giá đầu để đạt amount a, rồi truy vết số lượng từng mệnh giá.

### Hết hàng và hết tiền lẻ
Nếu sản phẩm đã hết, trạng thái {{SELECTING_ITEM}} phải từ chối yêu cầu chọn sản phẩm đó và giữ người dùng ở trạng thái hiện tại (hoặc chuyển về {{WAITING_FOR_MONEY}} nếu muốn). Nếu tiền lẻ không đủ để trả thừa, hệ thống phải kiểm tra trước khi chấp nhận giao dịch; nếu thiếu, từ chối và trả lại toàn bộ tiền đã nhận. Điều này đảm bảo tính nhất quán: người dùng không bao giờ nhận sản phẩm mà không nhận đủ tiền thừa chính xác.

Thứ tự kiểm tra quan trọng: **hết hàng → thiếu tiền → không trả được thừa → mới nhả hàng**. Nếu đảo thứ tự và trừ kho trước khi kiểm tra tiền lẻ, bạn sẽ rơi vào trạng thái không thể hoàn tác: hàng đã trừ nhưng giao dịch bị huỷ.

### Trade-off
| Cách tính tiền thừa | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|
| Greedy | O(số mệnh giá), rất nhanh, dễ giải thích | Chỉ tối ưu với mệnh giá canonical | Máy có bộ mệnh giá chuẩn, lượng giao dịch lớn |
| DP theo amount | Tối ưu tuyệt đối, xử lý mệnh giá bất kỳ | O(amount × số mệnh giá), tốn bộ nhớ | Amount nhỏ, yêu cầu tối ưu chặt |
| Bảng tra trước | O(1) khi chạy | Cần cập nhật khi đổi kho tiền | Máy cố định, tải rất cao |

### SOLID áp dụng ở đâu
- **SRP:** state chỉ quyết định luồng; {{ChangeMaker}} chỉ tính phương án trả thừa; kho và két tiền do {{VendingMachine}} quản lý.
- **OCP:** thêm sản phẩm qua {{addProduct}}, thêm trạng thái qua lớp mới implement {{VendingState}}, thêm cách tính tiền qua {{ChangeMaker}} mới.
- **DIP:** {{VendingMachine}} phụ thuộc interface {{ChangeMaker}}; có thể thay greedy bằng DP mà không sửa máy.
- **ISP:** {{ChangeMaker}} chỉ có một phương thức đúng nhu cầu, không bắt cài đặt thừa.

### Mở rộng
Nếu cần thêm tính năng giảm giá (discount), bạn có thể thêm một chiến lược tính giá (tương tự Strategy trong Parking Lot) mà không sửa các trạng thái chính. Nếu cần hỗ trợ thanh toán bằng thẻ, bạn thêm một trạng thái mới {{PROCESSING_CARD}} và một lớp thực hiện giao diện thanh toán mới; các trạng thái cũ vẫn hoạt động bình thường. Nếu muốn thêm sản phẩm, chỉ cần gọi {{addProduct}} — logic trạng thái không phụ thuộc danh sách sản phẩm cụ thể.

### Liên hệ phỏng vấn
Interviewer thường hỏi: "Nếu bạn phải thêm một sản phẩm mới có giá khác, bạn sửa những phần nào?". Trả lời senior: bạn chỉ cần thêm sản phẩm vào kho dữ liệu; các trạng thái và logic tính tiền thừa không bị ảnh hưởng vì chúng phụ thuộc vào giá trị số học, không phụ thuộc vào danh sách sản phẩm cụ thể. Nếu hỏi về SOLID: State pattern thể hiện Open/Closed khi thêm trạng thái mới; tách logic tính giá khỏi trạng thái thể hiện Single Responsibility.

> Senior tip: trong một hệ thống sản xuất, tôi từng thấy lỗi nghiêm trọng khi máy bán hàng không kiểm tra tiền lẻ trước khi chấp nhận giao dịch, dẫn đến trường hợp người dùng nhận sản phẩm nhưng không nhận đủ tiền thừa vì máy thiếu tiền lẻ. Đó là lý do tôi luôn thêm bước kiểm tra khả năng trả thừa trước khi chuyển sang trạng thái {{DISPENSING}}, và luôn ghi log số đồng còn lại sau mỗi giao dịch để đối soát.
`,
  exercises: [
    {
      title: 'Tính tiền thừa ít đồng nhất với số lượng đồng có hạn',
      prompt: `Hoàn thiện {{ChangeCalculator.calculateChange(int amount, int[] denominations, int[] available)}}.

Trả về mảng {{result}} cùng độ dài với {{denominations}}, trong đó {{result[i]}} là số đồng mệnh giá {{denominations[i]}} cần trả, sao cho:
- Tổng tiền đúng bằng {{amount}}.
- Không dùng quá {{available[i]}} đồng cho mệnh giá thứ i.
- Tổng số đồng là **ít nhất** — kể cả khi bộ mệnh giá không canonical (ví dụ {{1, 3, 4}}).
- Nếu không thể trả đúng, trả về mảng rỗng.
- {{amount}} âm cũng trả về mảng rỗng; {{amount}} bằng 0 trả về mảng toàn số 0.`,
      starter: `class ChangeCalculator {
    int[] calculateChange(int amount, int[] denominations, int[] available) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static int sum(int[] counts, int[] denoms) {
        int s = 0;
        for (int i = 0; i < counts.length; i++) s += counts[i] * denoms[i];
        return s;
    }
    static int coins(int[] counts) {
        int s = 0;
        for (int c : counts) s += c;
        return s;
    }
    public static void main(String[] args) {
        ChangeCalculator calc = new ChangeCalculator();

        int[] d1 = {10, 50, 100, 200, 500};
        int[] a1 = {10, 5, 3, 3, 2};
        int[] r1 = calc.calculateChange(370, d1, a1);
        check("canonical change exact", sum(r1, d1) == 370);
        check("canonical change minimal", coins(r1) == 5);
        for (int i = 0; i < d1.length; i++) check("canonical within stock " + d1[i], r1[i] <= a1[i]);

        int[] d2 = {100, 200};
        int[] a2 = {2, 0};
        int[] r2 = calc.calculateChange(200, d2, a2);
        check("respects unavailable denomination", sum(r2, d2) == 200 && r2[1] == 0 && r2[0] == 2);

        int[] d3 = {1, 3, 4};
        int[] a3 = {10, 10, 10};
        int[] r3 = calc.calculateChange(6, d3, a3);
        check("non-canonical minimal", sum(r3, d3) == 6 && coins(r3) == 2);

        int[] d4 = {100, 10};
        int[] a4 = {10, 10};
        int[] r4 = calc.calculateChange(375, d4, a4);
        check("impossible amount returns empty", r4.length == 0);

        int[] r5 = calc.calculateChange(0, d1, a1);
        check("zero amount is valid", sum(r5, d1) == 0 && coins(r5) == 0);

        int[] r6 = calc.calculateChange(-5, d1, a1);
        check("negative amount rejected", r6.length == 0);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `class ChangeCalculator {
    int[] calculateChange(int amount, int[] denominations, int[] available) {
        int m = denominations.length;
        if (amount < 0) return new int[0];
        int[] result = new int[m];
        if (amount == 0) return result;

        int INF = Integer.MAX_VALUE / 2;
        int[][] dp = new int[m + 1][amount + 1];
        for (int[] row : dp) java.util.Arrays.fill(row, INF);
        dp[0][0] = 0;

        for (int i = 1; i <= m; i++) {
            int d = denominations[i - 1];
            int cap = available[i - 1];
            for (int a = 0; a <= amount; a++) {
                dp[i][a] = dp[i - 1][a];
                if (d <= 0) continue;
                int maxUse = Math.min(cap, a / d);
                for (int c = 1; c <= maxUse; c++) {
                    int prev = dp[i - 1][a - c * d];
                    if (prev + c < dp[i][a]) dp[i][a] = prev + c;
                }
            }
        }

        if (dp[m][amount] >= INF) return new int[0];

        int remaining = amount;
        for (int i = m; i >= 1; i--) {
            int d = denominations[i - 1];
            int cap = available[i - 1];
            for (int c = 0; c <= cap && c * d <= remaining; c++) {
                if (dp[i - 1][remaining - c * d] + c == dp[i][remaining]) {
                    result[i - 1] = c;
                    remaining -= c * d;
                    break;
                }
            }
        }
        return result;
    }
}`,
      hints: [
        'Với greedy, số đồng mỗi mệnh giá là {{min(remaining / denomination, available)}}; nhưng greedy không tối ưu với mệnh giá bất kỳ.',
        'Quy hoạch động: {{dp[i][a]}} là số đồng ít nhất dùng i mệnh giá đầu; chuyển bằng cách thử dùng c đồng mệnh giá thứ i.',
        'Sau khi tính dp, truy vết ngược từ {{dp[m][amount]}} để tìm số lượng từng mệnh giá.',
      ],
      explain: `Bài tập này cố tình dùng bộ mệnh giá không canonical {{1, 3, 4}} để chỉ ra greedy sai. Greedy cho 6 = 4 + 1 + 1 (3 đồng), còn tối ưu là 3 + 3 (2 đồng). Quy hoạch động có giới hạn số lượng xử lý đúng cả hai yêu cầu: đúng tổng tiền và ít đồng nhất. Lỗi hay gặp: chỉ kiểm tra tổng tiền mà quên giới hạn {{available}}, hoặc truy vết sai nên trả về số đồng không khớp dp.`
    },
    {
      title: 'VendingMachine: state machine và các bước kiểm tra trước khi nhả hàng',
      prompt: `Hoàn thiện {{VendingMachine}} dùng interface {{VendingState}} và {{ChangeMaker}} cho sẵn.

Luồng chuẩn:
1. {{insert(amount)}} chỉ hợp lệ khi đang {{WAITING_FOR_MONEY}} và mệnh giá đã nạp trong máy; cộng vào số dư, chuyển {{SELECTING_ITEM}}.
2. {{select(product)}} kiểm tra theo thứ tự: sản phẩm tồn tại và còn hàng → đủ tiền → có thể trả tiền thừa. Nếu ổn, chuyển {{DISPENSING}} và trả {{"OK"}}; nếu không, trả thông báo lỗi phù hợp và giữ trạng thái.
3. {{dispense()}} chỉ khi đang {{DISPENSING}}: trừ 1 sản phẩm, trả tiền thừa, về {{WAITING_FOR_MONEY}}.
4. {{refund()}} trả lại số dư và về {{WAITING_FOR_MONEY}}.

Yêu cầu:
- Nếu không thể trả đúng tiền thừa, huỷ giao dịch, hoàn tiền và **không** trừ kho.
- {{addProduct}} cho phép thêm sản phẩm mới mà không sửa class.
- Không dùng thư viện ngoài JDK.`,
      starter: `import java.util.*;

interface ChangeMaker {
    int[] makeChange(int amount, int[] denominations, int[] available);
}

class VendingMachine {
    VendingMachine(ChangeMaker changeMaker) { }
    void addProduct(String name, int price, int qty) { throw new UnsupportedOperationException("TODO"); }
    void loadCash(int denomination, int count) { throw new UnsupportedOperationException("TODO"); }
    String state() { throw new UnsupportedOperationException("TODO"); }
    int balance() { throw new UnsupportedOperationException("TODO"); }
    int lastChange() { throw new UnsupportedOperationException("TODO"); }
    int stockOf(String name) { throw new UnsupportedOperationException("TODO"); }
    String insert(int amount) { throw new UnsupportedOperationException("TODO"); }
    String select(String product) { throw new UnsupportedOperationException("TODO"); }
    String dispense() { throw new UnsupportedOperationException("TODO"); }
    String refund() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static class Greedy implements ChangeMaker {
        public int[] makeChange(int amount, int[] denoms, int[] avail) {
            int[] r = new int[denoms.length];
            int rem = amount;
            for (int i = 0; i < denoms.length; i++) {
                int use = Math.min(rem / denoms[i], avail[i]);
                r[i] = use;
                rem -= use * denoms[i];
            }
            if (rem != 0) return new int[0];
            return r;
        }
    }
    static class NoChange implements ChangeMaker {
        public int[] makeChange(int amount, int[] denoms, int[] avail) { return new int[0]; }
    }
    public static void main(String[] args) {
        VendingMachine vm = new VendingMachine(new Greedy());
        check("initial state", vm.state().equals("WAITING_FOR_MONEY") && vm.balance() == 0);
        check("cannot select before money", !vm.select("Soda").equals("OK"));
        check("invalid money rejected", !vm.insert(-100).equals("OK") && vm.state().equals("WAITING_FOR_MONEY"));

        check("insert accepted", vm.insert(200).equals("OK"));
        check("selecting state", vm.state().equals("SELECTING_ITEM") && vm.balance() == 200);
        check("second insert rejected", !vm.insert(100).equals("OK") && vm.balance() == 200);

        check("select valid item", vm.select("Soda").equals("OK"));
        check("dispensing state", vm.state().equals("DISPENSING"));
        check("cannot refund while dispensing", !vm.refund().equals("OK"));
        check("dispense completes", vm.dispense().equals("OK"));
        check("change is 50", vm.lastChange() == 50);
        check("stock decremented", vm.stockOf("Soda") == 1 && vm.state().equals("WAITING_FOR_MONEY") && vm.balance() == 0);

        check("insufficient funds", vm.insert(50).equals("OK") && !vm.select("Soda").equals("OK"));
        check("insufficient keeps balance", vm.balance() == 50 && vm.stockOf("Soda") == 1);
        check("refund works", vm.refund().equals("OK") && vm.balance() == 0 && vm.state().equals("WAITING_FOR_MONEY"));

        vm.insert(200);
        vm.select("Chips");
        vm.dispense();
        check("second product sold out", vm.stockOf("Chips") == 0);
        vm.insert(100);
        check("out of stock rejected", !vm.select("Chips").equals("OK") && vm.stockOf("Chips") == 0);
        vm.refund();

        vm.addProduct("Tea", 120, 1);
        check("new product without editing machine", vm.stockOf("Tea") == 1);
        vm.insert(200);
        check("buy new product", vm.select("Tea").equals("OK") && vm.dispense().equals("OK") && vm.lastChange() == 80);

        VendingMachine noChange = new VendingMachine(new NoChange());
        noChange.insert(500);
        check("no change rejects sale", noChange.select("Soda").equals("no change"));
        check("no change refunds balance", noChange.balance() == 0 && noChange.state().equals("WAITING_FOR_MONEY"));
        check("no change keeps stock", noChange.stockOf("Soda") == 2);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

interface ChangeMaker {
    int[] makeChange(int amount, int[] denominations, int[] available);
}

interface VendingState {
    String name();
    String insert(VendingMachine m, int amount);
    String select(VendingMachine m, String product);
    String refund(VendingMachine m);
}

class WaitingForMoney implements VendingState {
    public String name() { return "WAITING_FOR_MONEY"; }
    public String insert(VendingMachine m, int amount) {
        if (amount <= 0 || !m.accepts(amount)) return "invalid money";
        m.setBalance(amount);
        m.addCash(amount);
        m.setState(new SelectingItem());
        return "OK";
    }
    public String select(VendingMachine m, String product) { return "insert money first"; }
    public String refund(VendingMachine m) { return "nothing to refund"; }
}

class SelectingItem implements VendingState {
    public String name() { return "SELECTING_ITEM"; }
    public String insert(VendingMachine m, int amount) { return "money already inserted"; }
    public String select(VendingMachine m, String product) {
        if (m.stockOf(product) <= 0) return "out of stock";
        int price = m.priceOf(product);
        if (price < 0) return "unknown product";
        if (m.balance() < price) return "insufficient funds";
        int change = m.balance() - price;
        int[] plan = m.planChange(change);
        if (plan == null) {
            int refund = m.balance();
            m.removeCash(refund);
            m.setBalance(-refund);
            m.setState(new WaitingForMoney());
            return "no change";
        }
        m.beginDispense(product, plan, change);
        return "OK";
    }
    public String refund(VendingMachine m) {
        int refund = m.balance();
        m.removeCash(refund);
        m.setBalance(-refund);
        m.setState(new WaitingForMoney());
        return "OK";
    }
}

class DispensingState implements VendingState {
    public String name() { return "DISPENSING"; }
    public String insert(VendingMachine m, int amount) { return "not ready"; }
    public String select(VendingMachine m, String product) { return "not ready"; }
    public String refund(VendingMachine m) { return "not ready"; }
}

class VendingMachine {
    private final ChangeMaker changeMaker;
    private final Map<String, Integer> prices = new LinkedHashMap<>();
    private final Map<String, Integer> stock = new LinkedHashMap<>();
    private final TreeMap<Integer, Integer> cash = new TreeMap<>(Collections.reverseOrder());
    private VendingState state = new WaitingForMoney();
    private int balance;
    private int lastChange;
    private String selected;
    private int[] changePlan = new int[0];

    VendingMachine(ChangeMaker changeMaker) {
        this.changeMaker = changeMaker;
        addProduct("Soda", 150, 2);
        addProduct("Chips", 100, 1);
        loadCash(500, 5);
        loadCash(200, 5);
        loadCash(100, 5);
        loadCash(50, 5);
        loadCash(10, 10);
    }

    void addProduct(String name, int price, int qty) {
        prices.put(name, price);
        stock.put(name, qty);
    }

    void loadCash(int denomination, int count) {
        cash.put(denomination, count);
    }

    String state() { return state.name(); }
    int balance() { return balance; }
    int lastChange() { return lastChange; }
    int stockOf(String name) { return stock.getOrDefault(name, 0); }
    int priceOf(String name) { return prices.getOrDefault(name, -1); }
    boolean accepts(int amount) { return cash.containsKey(amount); }
    void setBalance(int delta) { balance += delta; }
    void addCash(int amount) { cash.merge(amount, 1, Integer::sum); }
    void removeCash(int amount) {
        Integer count = cash.get(amount);
        if (count != null && count > 0) cash.put(amount, count - 1);
    }
    void setState(VendingState s) { this.state = s; }

    String insert(int amount) { return state.insert(this, amount); }
    String select(String product) { return state.select(this, product); }
    String refund() { return state.refund(this); }

    int[] planChange(int amount) {
        int[] denoms = new int[cash.size()];
        int[] avail = new int[cash.size()];
        int i = 0;
        for (Map.Entry<Integer, Integer> e : cash.entrySet()) {
            denoms[i] = e.getKey();
            avail[i] = e.getValue();
            i++;
        }
        int[] plan = changeMaker.makeChange(amount, denoms, avail);
        int total = 0;
        for (int j = 0; j < plan.length; j++) total += plan[j] * denoms[j];
        return total == amount ? plan : null;
    }

    void beginDispense(String product, int[] plan, int change) {
        selected = product;
        changePlan = plan;
        lastChange = change;
        state = new DispensingState();
    }

    String dispense() {
        if (!state.name().equals("DISPENSING")) return "not ready";
        stock.put(selected, stock.get(selected) - 1);
        int i = 0;
        for (Map.Entry<Integer, Integer> e : cash.entrySet()) {
            int used = i < changePlan.length ? changePlan[i] : 0;
            e.setValue(e.getValue() - used);
            i++;
        }
        selected = null;
        changePlan = new int[0];
        balance = 0;
        state = new WaitingForMoney();
        return "OK";
    }
}`,
      hints: [
        'Đặt thứ tự kiểm tra trong {{select}} là: hết hàng → thiếu tiền → không trả được thừa → nhả hàng.',
        'Khi kiểm tra tiền thừa thất bại, hoàn toàn bộ số dư và quay về {{WaitingForMoney}} trước khi trả lỗi.',
        'Trong {{dispense}}, chỉ trừ kho và trừ tiền lẻ khi đang ở {{DISPENSING}}; như vậy giao dịch lỗi không để lại hậu quả.',
      ],
      explain: `Bài tập ghép State pattern với một quy tắc nghiệp vụ dễ sai: chỉ nhả hàng khi chắc chắn trả được tiền thừa. {{SelectingItem}} kiểm tra theo thứ tự và chỉ chuyển sang {{DispensingState}} khi mọi điều kiện đạt; nhờ vậy thao tác {{dispense}} là bước duy nhất thay đổi kho và két tiền, rất dễ đối soát. Test dùng {{NoChange}} để mô phỏng máy hết tiền lẻ: giao dịch bị huỷ, số dư về 0, kho không đổi. Việc thêm sản phẩm Tea bằng {{addProduct}} chứng minh Open/Closed ở mức dữ liệu. Lỗi hay gặp là trừ kho ngay trong {{select}} rồi mới phát hiện không trả được tiền thừa, hoặc quên cộng tiền người dùng vào két nên không thể tính phương án trả thừa.`
    },
  ],
  check: [
    {
      q: 'State pattern cho Vending Machine giúp giảm lỗi nào?',
      options: [
        'Giảm thời gian mô phỏng',
        'Tránh thực hiện hành động không phù hợp với trạng thái hiện tại',
        'Tăng số dòng code',
        'Loại bỏ nhu cầu kiểm tra trạng thái',
      ],
      answer: 1,
      explain: `Mỗi trạng thái định nghĩa hành vi riêng; hành động không phù hợp sẽ bị từ chối hoặc bỏ qua, tránh lỗi logic.`
    },
    {
      q: 'Nếu tiền lẻ không đủ để trả đúng số tiền thừa, máy bán hàng nên làm gì?',
      options: [
        'Vẫn bán sản phẩm và giữ lại tiền thừa',
        'Từ chối giao dịch và trả lại toàn bộ tiền đã nhận',
        'Trả lại một phần tiền thừa',
        'Bỏ qua và tiếp tục',
      ],
      answer: 1,
      explain: `Để đảm bảo tính nhất quán và tránh mất tiền hoặc tranh chấp, hệ thống phải từ chối và hoàn tiền đầy đủ.`
    },
    {
      q: 'Thuật toán greedy cho tiền thừa hoạt động đúng với mọi bộ mệnh giá?',
      options: [
        'Có, luôn đúng và luôn ít đồng nhất',
        'Chỉ tối ưu với các mệnh giá canonical (ví dụ 1, 5, 10, 25)',
        'Không bao giờ đúng',
        'Chỉ đúng khi có đủ tiền lẻ',
      ],
      answer: 1,
      explain: `Greedy cho kết quả tối ưu với các mệnh giá canonical; với mệnh giá bất kỳ (ví dụ 1, 3, 4), cần quy hoạch động hoặc kiểm tra lại để đảm bảo ít đồng nhất.`
    },
  ],
  related: ['architecture-010', 'design-016'],
  tags: ['vending-machine', 'state-pattern', 'greedy', 'dynamic-programming', 'edge-case'],
},
{
  id: 'lesson-architecture-005',
  track: 'architecture',
  order: 5,
  title: 'Movie Ticket Booking: giữ ghế tạm, đồng hồ tiêm vào và chống đặt trùng',
  level: 'senior',
  minutes: 40,
  goals: [
    'Chốt yêu cầu LLD trước rồi mới vẽ sơ đồ: show, seat, hold, booking',
    'Thiết kế luồng hai pha hold/confirm với hold có hạn và đồng hồ truyền vào',
    'Bảo đảm nhiều thread cùng chọn một ghế thì chỉ một bên thắng',
  ],
  body: `**Tóm tắt:** Dịch vụ đặt vé xem phim dùng luồng hold/confirm có hạn, đồng hồ tiêm vào và synchronized để chống race condition khi nhiều người cùng chọn ghế.

### Vòng LLD cho bài toán đặt vé xem phim
Đặt vé xem phim là bài LLD kinh điển về **tài nguyên hiếm và có tranh chấp**: một suất chiếu chỉ có vài trăm ghế, nhưng hàng trăm request có thể cùng chọn một hàng ghế đẹp trong một giây. Trong buổi phỏng vấn, đừng vẽ sơ đồ ngay — hãy làm rõ yêu cầu trước: một suất chiếu (show) có một lưới ghế theo hàng và cột; một khách có thể giữ nhiều ghế; **ghế bị giữ tạm (hold)** trong vài phút để khách có thời gian thanh toán; nếu hết giờ mà chưa xác nhận thì ghế tự nhả về trạng thái trống; và tuyệt đối không được có hai request ghi đè lên cùng một ghế. Hai phút chốt yêu cầu đúng cách ghi điểm hơn là một sơ đồ đẹp nhưng sai luồng.

### Sơ đồ class
~~~text
Show (suất chiếu)
  |-- seatState : mảng char (F free, H held, B booked)
SeatHold
  |-- holdId, userId, seatIndex, expiresAt
BookingService (một instance cho một suất chiếu)
  |-- hold(userId, row, col) -> holdId | null
  |-- confirm(holdId) -> true khi ghế chuyển thành B
  |-- cancel(holdId)  -> true khi ghế nhả về F
  |-- state(row, col) -> ký tự trạng thái
  |-- clock : LongSupplier  (đồng hồ tiêm vào)
~~~

### Luồng hai pha: hold rồi confirm
**Bước 1 — hold:** service kiểm tra ghế là F, chuyển sang H, sinh holdId duy nhất và ghi expiresAt = giờ hiện tại + thời gian giữ cho phép (ví dụ 3 phút trong thực tế; trong test là 60 giây). **Bước 2 — confirm:** khách đã thanh toán; nếu hold còn hạn, ghế chuyển thành B và hold bị xoá khỏi bản ghi. Nhánh thứ ba là cancel(holdId) chủ động nhả ghế về F. Đây là mẫu reservation có hạn rất phổ biến: đặt bàn nhà hàng, giữ chỗ xe, giữ máy chủ theo giờ.

Điểm mà interviewer hay đào: **expiresAt phải tính trên đồng hồ được tiêm vào (interface LongSupplier), không đọc đồng hồ hệ thống trực tiếp**. Nhờ vậy test có thể tua thời gian bằng một biến điều khiển, kết quả xác định 100%, không cần Thread.sleep. Trong production, service chạy một sweeper định kỳ quét các hold đã quá hạn để thu hồi ghế; trong bài tập ta dùng **lazy sweep**: trước mỗi thao tác ghi (hold, confirm, cancel, state), quét các hold đã hết hạn và nhả ghế trước khi xử lý. Hai cách bổ sung nhau: sweep nền cho gọn, sweep lazy chống quên.

### Chống đặt trùng khi nhiều thread cùng chọn một ghế
Nếu hai thread cùng đọc state[i] == F rồi cùng ghi H, cả hai đều giữ được ghế và khách "đặt hai lần". Giải pháp tối thiểu: mọi phương thức ghi là **synchronized** trên cùng một monitor, bên trong là chuỗi **check-then-act**: kiểm tra trạng thái rồi thay đổi trạng thái trong cùng một khoá. Nhờ vậy không bao giờ có hai holdId trỏ vào một ghế. Khi hệ thống to lên, khoá theo từng suất chiếu (mỗi show một monitor) hoặc theo từng ghế; to hơn nữa thì dùng cấu trúc đồng thời có putIfAbsent để tránh khoá rộng. Câu để nói với interviewer: **khoá phải bọc cả phần kiểm tra và phần ghi** — khoá chỉ phần ghi thì race vẫn còn nguyên.

### Edge case cần nói trong buổi LLD
- **Double confirm / double cancel:** hold được xác nhận hoặc nhả là bị xoá khỏi bản ghi; thao tác thứ hai trả false, không ghi đè lên ghế đã bán.
- **Ghế đã B:** hold trả về null, không âm thầm ghi đè.
- **Race:** nhiều thread đua lấy ghế trống cuối cùng — chỉ một thread thắng; trong test dùng CountDownLatch để 16 thread xuất phát cùng lúc.
- **Nhóm ghế tất-cả-hoặc-không:** giữ nhiều ghế, nếu một ghế bị mất trong lúc thanh toán thì phần còn lại phải được nhả — rollback của quy trình reservation.
- **Hold bị quên:** sweep phải nhả cả trạng thái ghế lẫn holdId, không để rác tích luỹ vô hạn.

### Trade-off: đặt ngay hay giữ chỗ
| Phương án | Ưu điểm | Nhược điểm | Khi nào chọn |
|---|---|---|---|
| Đặt ngay, không hold | Ít trạng thái, dễ cài | Khách không kịp thanh toán, ghế nhanh hết | Thanh toán gộp trong một bước |
| Hold có hạn + confirm | Phù hợp luồng giỏ hàng | Thêm trạng thái, cần cơ chế hết hạn | Đặt vé, nhà hàng, giữ chỗ xe |
| Optimistic lock (version) | Scale tốt, ít chờ | Retry khi xung đột cao | Tài nguyên tương đối dư, tranh chấp ít |

### SOLID áp dụng ở đâu
- **SRP:** BookingService chỉ lo trạng thái ghế; giá vé và xuất vé thuộc các service khác.
- **DIP:** đồng hồ được tiêm qua interface LongSupplier; service không phụ thuộc đồng hồ hệ thống nên test và production cùng dùng một bộ logic.
- **OCP:** thêm chính sách giữ chỗ khác (hold VIP dài hơn) là một tham số/chiến lược mới, không sửa logic check-then-act.

### Liên hệ phỏng vấn
Chuẩn bị trước câu hỏi "server crash giữa hold và confirm thì sao?": trạng thái hold cần được persist (row SQL với expiresAt) và sweeper nền tự thu hồi sau khi hệ thống restart; vì hold là một hợp đồng có hạn nên không cần transaction phân tán, chỉ cần quét các row quá hạn. Câu hỏi scale: sharding theo suất chiếu để mọi thao tác trên một show đi vào đúng một phân vùng — khoá không bao giờ vượt ranh giới node.

> Senior tip: trong một dự án vé thật, tôi từng thấy lỗi "ghế ma": ghế hiển thị trống nhưng không đặt được, vì bản ghi hold cũ còn nằm trong cache mà chưa bị thu hồi. Từ đó tôi luôn đặt nguyên tắc "trạng thái tạm phải có TTL ở mọi lớp lưu trữ": trong Redis là EXPIRE, trong DB là cron DELETE WHERE expiresAt < now(), trong service là lazy sweep. Ba lớp cùng một luật thì không còn cửa cho ghế ma.`,
  exercises: [
    {
      title: 'BookingService: hold có hạn, confirm/cancel và test race',
      prompt: `Hoàn thiện class {{BookingService}} cho một suất chiếu với lưới ghế {{rows}} x {{cols}}.

Luồng chuẩn:
- {{hold(userId, row, col)}}: nếu toạ độ hợp lệ và ghế đang là {{F}}, giữ ghế (thành {{H}}), trả về một holdId mới; nếu không, trả về {{null}}. Hold hết hạn sau {{holdMillis}} mili giây (tiêm vào qua constructor cùng LongSupplier).
- {{confirm(holdId)}}: nếu hold còn hạn, ghế thành {{B}}, trả về {{true}}; nếu hold không tồn tại hoặc đã hết hạn, trả về {{false}} và ghế phải được nhả về {{F}}.
- {{cancel(holdId)}}: nếu hold còn hiệu lực, ghế về {{F}}, trả về {{true}}; nếu không, {{false}}.
- {{state(row, col)}}: trả về ký tự trạng thái hiện tại; toạ độ ngoài lưới trả về {{'.'}}.

Yêu cầu:
- Trước mỗi thao tác, quét các hold đã quá hạn (lazy sweep) và nhả ghế tương ứng.
- Mọi phương thức ghi phải an toàn khi nhiều thread gọi cùng lúc: 16 thread cùng hold một ghế thì chỉ đúng một holdId thành công.
- Đồng hồ chỉ đọc qua {{LongSupplier.getAsLong()}} — không dùng đồng hồ hệ thống.`,
      starter: `import java.util.*;
import java.util.function.LongSupplier;

class BookingService {
    private final int rows, cols;
    private final long holdMillis;
    private final LongSupplier clock;
    private final char[] state;

    BookingService(int rows, int cols, long holdMillis, LongSupplier clock) {
        this.rows = rows; this.cols = cols; this.holdMillis = holdMillis; this.clock = clock;
        this.state = new char[rows * cols];
        java.util.Arrays.fill(state, 'F');
    }

    String hold(long userId, int row, int col) { throw new UnsupportedOperationException("TODO"); }
    boolean confirm(String holdId) { throw new UnsupportedOperationException("TODO"); }
    boolean cancel(String holdId) { throw new UnsupportedOperationException("TODO"); }
    char state(int row, int col) { throw new UnsupportedOperationException("TODO"); }
    int rows() { return rows; }
    int cols() { return cols; }
}`,
      tests: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    public static void main(String[] args) throws Exception {
        long[] now = {1000};
        BookingService s = new BookingService(3, 5, 60_000, () -> now[0]);
        check("hold free seat", s.hold(1, 1, 1) != null && s.state(1, 1) == 'H');
        check("double hold rejected", s.hold(2, 1, 1) == null && s.state(1, 1) == 'H');
        String h2 = s.hold(2, 1, 2);
        check("independent seat ok", h2 != null && s.state(1, 2) == 'H');
        check("cancel frees seat", s.cancel(h2) && s.state(1, 2) == 'F');
        String h1 = s.hold(1, 0, 0);
        check("hold another seat", h1 != null && s.state(0, 0) == 'H');
        check("cancel unknown fails", !s.cancel("no-such"));
        check("cancel twice fails", !s.cancel(h2));
        check("confirm books seat", s.confirm(h1) && s.state(0, 0) == 'B');
        check("confirm unknown fails", !s.confirm("no-such"));
        check("confirm twice fails", !s.confirm(h1));
        check("cancel booked fails", !s.cancel(h1));
        check("booked seat cannot be held", s.hold(9, 0, 0) == null);
        check("out of range rejected", s.hold(4, -1, 0) == null && s.hold(4, 3, 0) == null && s.hold(4, 0, 5) == null);
        check("state out of range", s.state(-1, 0) == '.' && s.state(3, 0) == '.');

        String h3 = s.hold(5, 2, 2);
        check("hold later ok", h3 != null && s.state(2, 2) == 'H');
        now[0] = 200_000;
        check("expired hold cannot confirm", !s.confirm(h3) && s.state(2, 2) == 'F');
        check("expired swept releases earlier seat", s.state(1, 1) == 'F');
        String h4 = s.hold(6, 2, 2);
        check("rehold after sweep works", h4 != null && s.state(2, 2) == 'H');
        now[0] = 261_000;
        String h5 = s.hold(7, 2, 2);
        check("lazy sweep lets others hold", h4 != null && h5 != null && s.state(2, 2) == 'H');
        check("old hold unusable after sweep", !s.confirm(h4) && !s.cancel(h4));

        BookingService t = new BookingService(2, 2, 60_000, () -> 1000L);
        ExecutorService ex = Executors.newFixedThreadPool(8);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger wins = new AtomicInteger();
        List<String> ids = Collections.synchronizedList(new ArrayList<String>());
        for (int i = 0; i < 16; i++) {
            final long uid = i;
            ex.submit(() -> {
                try { go.await(); } catch (InterruptedException e) { return; }
                String id = t.hold(uid, 1, 1);
                if (id != null) { wins.incrementAndGet(); ids.add(id); }
            });
        }
        go.countDown();
        ex.shutdown();
        ex.awaitTermination(10, TimeUnit.SECONDS);
        check("race: exactly one winner", wins.get() == 1 && ids.size() == 1 && t.state(1, 1) == 'H');

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;
import java.util.function.LongSupplier;

class BookingService {
    private final int rows, cols;
    private final long holdMillis;
    private final LongSupplier clock;
    private final char[] state;
    private final Map<String, Integer> holdSeat = new HashMap<>();
    private final Map<String, Long> holdExpiry = new HashMap<>();
    private long seq = 0;

    BookingService(int rows, int cols, long holdMillis, LongSupplier clock) {
        this.rows = rows; this.cols = cols; this.holdMillis = holdMillis; this.clock = clock;
        this.state = new char[rows * cols];
        for (int i = 0; i < state.length; i++) state[i] = 'F';
    }

    synchronized String hold(long userId, int row, int col) {
        if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
        sweepExpired();
        int i = row * cols + col;
        if (state[i] != 'F') return null;
        state[i] = 'H';
        String id = "h-" + (++seq);
        holdSeat.put(id, i);
        holdExpiry.put(id, clock.getAsLong() + holdMillis);
        return id;
    }

    synchronized boolean confirm(String holdId) {
        sweepExpired();
        if (holdId == null || !holdSeat.containsKey(holdId)) return false;
        state[holdSeat.get(holdId)] = 'B';
        release(holdId);
        return true;
    }

    synchronized boolean cancel(String holdId) {
        sweepExpired();
        if (holdId == null || !holdSeat.containsKey(holdId)) return false;
        state[holdSeat.get(holdId)] = 'F';
        release(holdId);
        return true;
    }

    synchronized char state(int row, int col) {
        if (row < 0 || row >= rows || col < 0 || col >= cols) return '.';
        sweepExpired();
        return state[row * cols + col];
    }

    int rows() { return rows; }
    int cols() { return cols; }

    private void release(String id) {
        holdSeat.remove(id);
        holdExpiry.remove(id);
    }

    private void sweepExpired() {
        long now = clock.getAsLong();
        for (String id : new ArrayList<>(holdExpiry.keySet())) {
            if (holdExpiry.get(id) <= now) {
                state[holdSeat.get(id)] = 'F';
                release(id);
            }
        }
    }
}`,
      hints: [
        'Dùng một mảng char một chiều cho trạng thái ghế, và một từ điển holdId ghi chỉ số ghế cùng hạn giữ.',
        'Gọi sweepExpired ở đầu mỗi phương thức để các hold quá hạn tự nhả ghế trước khi kiểm tra mới.',
        'Đánh dấu synchronized cho phần check-then-act để 16 thread không cùng giữ một ghế.',
      ],
      explain: `Phần khó nhất của bài này không phải quản lý mảng ghế, mà là **phần giữ và phần thời gian phải nằm chung trong một khoá**: mọi phương thức ghi bọc trong synchronized; confirm dùng bản ghi holdId để tìm chính xác ghế được book; lazy sweep chạy trước mỗi thao tác để hold hết hạn không chiếm ghế của người khác. Lỗi hay gặp: (1) tính expiresAt bằng đồng hồ hệ thống — test sẽ luôn sai vì đồng hồ thật không tua được; (2) khoá chỉ phần ghi mà không khoá phần kiểm tra — race vẫn xảy ra; (3) cho phép confirm/cancel thao tác với hold đã bị xoá — phải trả về false chứ không ghi đè.`,
    },
  ],
  check: [
    {
      q: 'Vì sao quản lý expiresAt phải dùng đồng hồ tiêm vào thay vì đọc trực tiếp đồng hồ hệ thống?',
      options: [
        'Để code ngắn hơn',
        'Để test có thể tua thời gian và kiểm tra phân định, không phụ thuộc đồng hồ thật',
        'Để tránh dùng interface',
        'Để đặt ghế nhanh hơn',
      ],
      answer: 1,
      explain: `Đồng hồ tiêm vào cho phép test kiểm soát thời gian bằng biến điều khiển; kết quả hold/confirm/cancel luôn xác định, không cần Thread.sleep.`,
    },
    {
      q: 'Rủi ro nào sinh ra nếu khoá chỉ bọc phần ghi trạng thái ghế mà không bọc phần kiểm tra?',
      options: [
        'Ghế luôn được giữ 2 giây',
        'Race vẫn tồn tại: hai thread cùng thấy ghế FREE rồi cùng ghi HELD',
        'Hold luôn hết hạn',
        'Không có rủi ro',
      ],
      answer: 1,
      explain: `Check-then-act phải nằm trong cùng một khoá; nếu khoá không đủ phạm vi thì hai thread vẫn đọc được trạng thái cũ rồi cùng ghi mới.`,
    },
    {
      q: 'Khi một hold hết hạn, ai chịu trách nhiệm nhả ghế?',
      options: [
        'Chỉ người dùng chủ động huỷ',
        'Sweeper nền hoặc lazy sweep trước mỗi thao tác ghi — đều phải nhả ghế và xoá holdId',
        'Không cần nhả, ghế được dùng lần sau',
        'Chỉ khi restart server',
      ],
      answer: 1,
      explain: `Lazy sweep trước mỗi thao tác cho tác vụ nhỏ; sweeper nền cho hệ thống thật. Cả hai phải nhả cả trạng thái ghế lẫn holdId.`,
    },
    {
      q: 'Thiết kế hold nhóm nhiều ghế tất-cả-hoặc-không thì điều đúng là',
      options: [
        'Confirm từng hold riêng lẻ, ai may mắn thì được',
        'Nếu có một hold trong nhóm hết hạn, phải nhả toàn bộ nhóm để đảm bảo rollback',
        'Nhóm không cần hạn giữ',
        'Chỉ giữ một mảng số nguyên',
      ],
      answer: 1,
      explain: `Hợp đồng reservation nhóm phải tất-cả-hoặc-không: nếu một ghế thất bại trong nhóm, các ghế còn lại phải được nhả để nhóm rơi về trạng thái ban đầu (rollback).`,
    },
  ],
  related: ['design-016', 'design-004', 'architecture-010'],
  tags: ['movie-ticket', 'seat-hold', 'synchronized', 'timed-hold', 'race-condition', 'LLD'],
},
{
  id: 'lesson-architecture-006',
  track: 'architecture',
  order: 6,
  title: 'Splitwise: Strategy chia tiền net balance và tối giản số giao dịch thanh toán',
  level: 'mid',
  minutes: 35,
  goals: [
    'Thiết kế Strategy cho các kiểu chia tiền: chia đều, theo percent, theo số chỉ định',
    'Giữ net balance cho mỗi người và từ chối expense khi phần chia không khớp tổng',
    'Tối giản số giao dịch thanh toán bằng netting theo kiểu greedy',
  ],
  body: `**Tóm tắt:** Chia bill nhóm bằng Strategy pattern (chia đều/percent/số chỉ định), giữ net balance mỗi người và tối giản giao dịch thanh toán bằng netting greedy.

### Đặt vấn đề: một expense nhiều kiểu chia
Splitwise (chia bill nhóm) có ba dữ kiện: một expense có **người trả (payer)**, tổng tiền, và **cách chia** (chia đều, theo percent, theo số tiền chỉ định). Hệ thống không cần lưu nợ từng cặp thô; chỉ cần một bản ghi **net balance** của mỗi người: dương là được nợ, âm là còn thiếu. Từ net này bạn có thể đưa ra mức thanh toán ít giao dịch nhất. Bài này luyện ra một quyết định kỹ thuật quan trọng: tiền là số nguyên (cent, kiểu long), không dùng double — một ví với 997 cent vẫn phải khớp đúng từng cent.

### Sơ đồ class
~~~text
SplitStrategy (interface)
  |-- split(amount, users, params) -> Map user -> số tiền họ chịu
  |-- EqualSplit   : chia đều, phần dư về người đứng đầu danh sách
  |-- PercentSplit : percent phải tổng 100, phần lẻ phân phát từng cent
  |-- ExactSplit   : số chỉ định phải tổng đúng amount
Ledger
  |-- net : Map user -> số dư ròng
  |-- addExpense(paidBy, amount, users, strategy, params)
  |-- net()    -> bản sao net
  |-- settle() -> List "B pays A 100"
~~~

### Strategy cho cách chia
Chiến lược chia là hiện thân rõ nhất của Open/Closed: Ledger không biết EqualSplit hay PercentSplit, chỉ biết hợp đồng "trả về map chia với tổng đúng amount". Thêm cách chia mới (shares, per-mille, ưu đãi) là thêm một lớp mới, không sửa Ledger. Hợp đồng bắt buộc cho mọi chiến lược: (1) share không âm; (2) tổng share đúng amount; (3) tổng lệch ném IllegalArgumentException. Nhờ (3), Ledger chỉ cần validate một lần nữa rồi ghi — lỗi bị chặn ở biên, không làm bẩn net.

### EqualSplit và phần dư
Chia 10 cent cho 3 người thì mỗi người 3 cent còn dư 1 cent. Phần dư phải phân phát theo cách xác định: quy ước **mỗi cent dư về người đứng đầu danh sách theo thứ tự**, từng người +1. Không phân phát ngẫu nhiên, vì test và UI cần kết quả lặp được. Tương tự với PercentSplit: mỗi người lấy floor của amount * percent / 100, phần còn lại phân như phần dư ở trên. Nếu tổng percent khác 100, ném IllegalArgumentException — expense bị từ chối trước khi đụng Ledger.

### Netting: tối giản số giao dịch thanh toán
Nợ thô có thể phức tạp như A phải B, B lại phải C, C lại phải A. Lưu ý tổng nợ bằng 0 — settle tối ưu nhất là không cần giao dịch nào. Thuật toán greedy chuẩn: (1) tách debtor (net âm) và creditor (net dương); (2) sắp debtor theo số nợ giảm dần (tie theo id tăng), creditor tương tự; (3) mỗi vòng nối một debtor và một creditor, số tiền là min(need, give), cập nhật số dư; bên nào về 0 thì bỏ khỏi danh sách. Với nhiều người thực tế greedy cho ra gần mức n-1 giao dịch — nói rõ với interviewer rằng tối ưu tuyệt đối là bài toán NP-hard, greedy là lựa chọn chính đáng.

### SOLID áp dụng ở đâu
- **SRP:** chiến lược chỉ chia; Ledger chỉ ghi net và settle; không nhồi chung một lớp.
- **OCP:** thêm cách chia mới không sửa Ledger; test có thể đưa một strategy tự viết vào và hệ thống vẫn chạy.
- **DIP:** Ledger phụ thuộc interface SplitStrategy, không phụ thuộc class cụ thể.
- **LSP:** mọi chiến lược cùng giữ hợp đồng "trả về map chia, tổng khớp amount" — thay thế được cho nhau.

### Edge case lớn
- **Chu kỳ nợ A trả cho B, B trả cho C, C trả cho A:** net của từng người bằng 0; settle trả danh sách rỗng — cho thấy netting bù trừ được chu kỳ.
- **Một debtor lớn, nhiều creditor:** greedy nối debtor vào từng creditor theo thứ tự đã sắp.
- **Expense một người:** payer tự chịu toàn bộ — net bằng 0, không sinh giao dịch.
- **Validate sai:** phần chia lệch tổng bị từ chối **trước khi** net bị đụng; nếu đã ghi nửa chừng rồi mới phát hiện sai, bạn phải viết code hoàn tác — dễ sai và khó review.

### Liên hệ phỏng vấn
Trả lời thiết kế DB: bảng Expense (id, paidBy, amount) và ExpenseShare (expenseId, userId, share) là nguồn sự thật; net là dữ liệu phái sinh, hoặc tính lazy, hoặc được cập nhật idempotent theo (expenseId, userId). Chỉ cần nói rõ "việc tính net là idempotent: mỗi expense được apply đúng một lần thì dữ liệu luôn cân" là bạn đã đi quá một vòng.

> Senior tip: trong một dự án tài chính thật, bug phổ biến nhất không phải ở thuật toán, mà ở một expense được apply hai lần sau retry (bạn ghi được 200 nhưng net đã trừ 400). Hãy dùng một bảng reconcile có key (expenseId, userId) — nếu trùng thì bỏ qua. Trong bài tập áp dụng cùng nguyên tắc: validate trước mọi lần ghi.`,
  exercises: [
    {
      title: 'Ba chiến lược chia tiền: đều percent và số chỉ định',
      prompt: `Hoàn thiện {{EqualSplit}} và {{PercentSplit}} theo interface {{SplitStrategy}} ({{ExactSplit}} đã có sẵn làm ví dụ).

Quy tắc chung: tiền là long tính theo cent, không dùng double. Kết quả là {{Map}} user -> số tiền họ chịu; tổng phải đúng bằng amount.

- {{EqualSplit}}: chia đều; phần dư {{amount % n}} phân phát +1 cho từng người đứng đầu danh sách theo thứ tự.
- {{PercentSplit}}: params chứa percent từng user (ví dụ {{A: 50, B: 25, C: 25}}); tổng percent phải đúng 100, ngược lại ném {{IllegalArgumentException}}; share cho mỗi người là floor của amount nhân percent chia 100, phần còn lại phân như phần dư của EqualSplit.
- amount âm hoặc users rỗng: ném {{IllegalArgumentException}}.`,
      starter: `import java.util.*;

interface SplitStrategy {
    Map<String, Long> split(long amount, List<String> users, Map<String, Long> params);
}

class ExactSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        long total = 0;
        for (String u : users) {
            Long s = params.get(u);
            if (s == null) throw new IllegalArgumentException("missing share for " + u);
            if (s < 0) throw new IllegalArgumentException("negative share");
            total += s;
        }
        if (total != amount) throw new IllegalArgumentException("shares must sum to amount");
        Map<String, Long> out = new LinkedHashMap<>();
        for (String u : users) out.put(u, params.get(u));
        return out;
    }
}

class EqualSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        throw new UnsupportedOperationException("TODO");
    }
}

class PercentSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static long sum(Map<String, Long> m) {
        long s = 0;
        for (long v : m.values()) s += v;
        return s;
    }
    public static void main(String[] args) {
        List<String> abc = Arrays.asList("A", "B", "C");

        Map<String, Long> r1 = new EqualSplit().split(300, abc, new LinkedHashMap<String, Long>());
        check("equal exact divide", r1.get("A") == 100 && r1.get("B") == 100 && r1.get("C") == 100 && sum(r1) == 300);

        Map<String, Long> r2 = new EqualSplit().split(10, abc, new LinkedHashMap<String, Long>());
        check("equal remainder to first user", r2.get("A") == 4 && r2.get("B") == 3 && r2.get("C") == 3 && sum(r2) == 10);

        Map<String, Long> r3 = new EqualSplit().split(0, abc, new LinkedHashMap<String, Long>());
        check("zero amount fine", r3.get("A") == 0 && r3.get("B") == 0 && r3.get("C") == 0);

        boolean threw = false;
        try { new EqualSplit().split(100, new ArrayList<String>(), new LinkedHashMap<String, Long>()); }
        catch (IllegalArgumentException e) { threw = true; }
        check("equal: empty users rejected", threw);

        Map<String, Long> pct = new LinkedHashMap<>();
        pct.put("A", 50L); pct.put("B", 30L); pct.put("C", 20L);
        Map<String, Long> r4 = new PercentSplit().split(1000, abc, pct);
        check("percent clean", r4.get("A") == 500 && r4.get("B") == 300 && r4.get("C") == 200 && sum(r4) == 1000);

        Map<String, Long> pct2 = new LinkedHashMap<>();
        pct2.put("A", 50L); pct2.put("B", 25L); pct2.put("C", 25L);
        Map<String, Long> r5 = new PercentSplit().split(997, abc, pct2);
        check("percent leftover to first user", r5.get("A") == 499 && r5.get("B") == 249 && r5.get("C") == 249 && sum(r5) == 997);

        Map<String, Long> pct3 = new LinkedHashMap<>();
        pct3.put("A", 50L); pct3.put("B", 30L);
        boolean threw2 = false;
        try { new PercentSplit().split(100, abc, pct3); }
        catch (IllegalArgumentException e) { threw2 = true; }
        check("percent: sum != 100 rejected", threw2);

        Map<String, Long> ex = new LinkedHashMap<>();
        ex.put("A", 150L); ex.put("B", 100L);
        Map<String, Long> r6 = new ExactSplit().split(250, Arrays.asList("A", "B"), ex);
        check("exact works", r6.get("A") == 150 && r6.get("B") == 100);
        boolean threw3 = false;
        try { new ExactSplit().split(200, Arrays.asList("A", "B"), ex); }
        catch (IllegalArgumentException e) { threw3 = true; }
        check("exact: mismatched sum rejected", threw3);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

interface SplitStrategy {
    Map<String, Long> split(long amount, List<String> users, Map<String, Long> params);
}

class ExactSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        long total = 0;
        for (String u : users) {
            Long s = params.get(u);
            if (s == null) throw new IllegalArgumentException("missing share for " + u);
            if (s < 0) throw new IllegalArgumentException("negative share");
            total += s;
        }
        if (total != amount) throw new IllegalArgumentException("shares must sum to amount");
        Map<String, Long> out = new LinkedHashMap<>();
        for (String u : users) out.put(u, params.get(u));
        return out;
    }
}

class EqualSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        if (amount < 0 || users.isEmpty()) throw new IllegalArgumentException("bad equal split");
        Map<String, Long> out = new LinkedHashMap<>();
        long base = amount / users.size();
        long remainder = amount % users.size();
        for (int i = 0; i < users.size(); i++) {
            out.put(users.get(i), base + (i < remainder ? 1 : 0));
        }
        return out;
    }
}

class PercentSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        if (amount < 0 || users.isEmpty()) throw new IllegalArgumentException("bad percent split");
        int totalPct = 0;
        for (String u : users) {
            Long pct = params.get(u);
            if (pct == null) throw new IllegalArgumentException("missing percent for " + u);
            totalPct += pct;
        }
        if (totalPct != 100) throw new IllegalArgumentException("percents must sum to 100");
        Map<String, Long> out = new LinkedHashMap<>();
        long assigned = 0;
        for (String u : users) {
            long share = amount * params.get(u) / 100;
            out.put(u, share);
            assigned += share;
        }
        long leftover = amount - assigned;
        int i = 0;
        while (leftover > 0 && i < users.size()) {
            out.put(users.get(i), out.get(users.get(i)) + 1);
            leftover--;
            i++;
        }
        return out;
    }
}`,
      hints: [
        'Với EqualSplit: phần dư amount chia lấy nguyên và chia lấy dư; mỗi cent dư về từng người đầu danh sách.',
        'Với PercentSplit: cộng tổng percent trước, rồi tính share floor cho từng người, cuối cùng phân phát phần lẻ theo thứ tự.',
        'Một bản chia phải luôn tổng đúng bằng amount — tự kiểm tra sau khi tính ra kết quả.',
      ],
      explain: `Ba chiến lược là minh hoạ Open/Closed: thêm kiểu chia mới chỉ là thêm một lớp, không sửa phần ghi nhận. Hai điểm để ghi điểm: (1) dùng long cent, không dùng double, để 997 cent vẫn khớp đúng; (2) validate tổng khớp amount ở trả về của split — lệch là từ chối, đừng nhét một bản chia lệch vào ledger rồi phải hoàn tác. Lỗi hay gặp: dùng double, mất cent sau phép làm tròn, hay phần dư về người ngẫu nhiên thay vì theo thứ tự xác định.`,
    },
    {
      title: 'Ledger: net balance và settle tối giản giao dịch',
      prompt: `Hoàn thiện class {{Ledger}}.

- {{addExpense(paidBy, amount, users, strategy, params)}}: gọi {{strategy.split}} để có map chia; nếu tổng không đúng amount, ném {{IllegalArgumentException}} và net phải nguyên vẹn (không ghi nửa chừng). Khi ghi: payer được cộng amount; từng người theo kết quả chia bị trừ.
- {{net()}}: trả về bản sao Map user -> số dư ròng (dương là được nợ, âm là còn thiếu).
- {{settle()}}: tối giản số giao dịch bằng greedy: debtor sắp theo số nợ giảm dần (tie theo id tăng), creditor sắp theo số được nợ giảm dần (tie theo id tăng); mỗi bước sinh một dòng {{debtor pays creditor so-tien}} với số tiền min(need, give); bên nào về 0 thì bỏ khỏi danh sách. settle không được thay đổi net (chỉ là kế hoạch thanh toán).`,
      starter: `import java.util.*;

interface SplitStrategy {
    Map<String, Long> split(long amount, List<String> users, Map<String, Long> params);
}

class ExactSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        long total = 0;
        for (String u : users) {
            Long s = params.get(u);
            if (s == null) throw new IllegalArgumentException("missing share for " + u);
            total += s;
        }
        if (total != amount) throw new IllegalArgumentException("shares must sum to amount");
        Map<String, Long> out = new LinkedHashMap<>();
        for (String u : users) out.put(u, params.get(u));
        return out;
    }
}

class Ledger {
    private final Map<String, Long> net = new LinkedHashMap<>();

    void addExpense(String paidBy, long amount, List<String> users, SplitStrategy strategy, Map<String, Long> params) {
        throw new UnsupportedOperationException("TODO");
    }

    Map<String, Long> net() { throw new UnsupportedOperationException("TODO"); }

    List<String> settle() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static Map<String, Long> single(String u, long v) {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put(u, v);
        return m;
    }
    static class Eq implements SplitStrategy {
        public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
            Map<String, Long> out = new LinkedHashMap<>();
            long base = amount / users.size();
            long rem = amount - base * users.size();
            for (int i = 0; i < users.size(); i++) out.put(users.get(i), base + (i < rem ? 1 : 0));
            return out;
        }
    }
    static class OnePayer implements SplitStrategy {
        public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
            Map<String, Long> out = new LinkedHashMap<>();
            out.put(users.get(0), amount);
            return out;
        }
    }
    static class BadSplit implements SplitStrategy {
        public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
            Map<String, Long> out = new LinkedHashMap<>();
            out.put(users.get(0), amount / 2);
            return out;
        }
    }
    public static void main(String[] args) {
        Ledger l = new Ledger();
        List<String> abc = Arrays.asList("A", "B", "C");
        l.addExpense("A", 300, abc, new Eq(), new LinkedHashMap<String, Long>());
        Map<String, Long> net1 = l.net();
        check("net after one expense", net1.get("A") == 200 && net1.get("B") == -100 && net1.get("C") == -100);

        List<String> out = l.settle();
        check("settle minimal transfers", out.size() == 2 && out.contains("B pays A 100") && out.contains("C pays A 100"));
        check("settle keeps net intact", l.net().get("A") == 200);

        Ledger cycle = new Ledger();
        cycle.addExpense("A", 100, Collections.singletonList("B"), new ExactSplit(), single("B", 100));
        cycle.addExpense("B", 100, Collections.singletonList("C"), new ExactSplit(), single("C", 100));
        cycle.addExpense("C", 100, Collections.singletonList("A"), new ExactSplit(), single("A", 100));
        Map<String, Long> net2 = cycle.net();
        check("cycle nets to zero", net2.size() == 3 && net2.get("A") == 0 && net2.get("B") == 0 && net2.get("C") == 0);
        check("cycle settle empty", cycle.settle().isEmpty());

        Ledger big = new Ledger();
        big.addExpense("A", 600, Collections.singletonList("C"), new ExactSplit(), single("C", 600));
        big.addExpense("B", 200, Collections.singletonList("C"), new ExactSplit(), single("C", 200));
        List<String> bigOut = big.settle();
        check("greedy order deterministic", bigOut.equals(Arrays.asList("C pays A 600", "C pays B 200")));

        boolean threw = false;
        try { big.addExpense("A", 100, Collections.singletonList("C"), new BadSplit(), single("C", 50)); }
        catch (IllegalArgumentException e) { threw = true; }
        check("bad split rejected", threw);
        Map<String, Long> net3 = big.net();
        check("net unchanged after rejection", net3.get("A") == 600 && net3.get("B") == 200 && net3.get("C") == -800);

        Ledger custom = new Ledger();
        custom.addExpense("D", 70, Collections.singletonList("A"), new OnePayer(), new LinkedHashMap<String, Long>());
        check("custom strategy settles", custom.settle().equals(Collections.singletonList("A pays D 70")));

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

interface SplitStrategy {
    Map<String, Long> split(long amount, List<String> users, Map<String, Long> params);
}

class ExactSplit implements SplitStrategy {
    public Map<String, Long> split(long amount, List<String> users, Map<String, Long> params) {
        long total = 0;
        for (String u : users) {
            Long s = params.get(u);
            if (s == null) throw new IllegalArgumentException("missing share for " + u);
            total += s;
        }
        if (total != amount) throw new IllegalArgumentException("shares must sum to amount");
        Map<String, Long> out = new LinkedHashMap<>();
        for (String u : users) out.put(u, params.get(u));
        return out;
    }
}

class Ledger {
    private final Map<String, Long> net = new LinkedHashMap<>();

    private void bump(Map<String, Long> m, String u, long v) {
        m.put(u, m.getOrDefault(u, 0L) + v);
    }

    void addExpense(String paidBy, long amount, List<String> users, SplitStrategy strategy, Map<String, Long> params) {
        Map<String, Long> split = strategy.split(amount, users, params);
        long sum = 0;
        for (long v : split.values()) sum += v;
        if (sum != amount) throw new IllegalArgumentException("split sum mismatch");
        Map<String, Long> copy = new LinkedHashMap<>(net);
        bump(copy, paidBy, amount);
        for (Map.Entry<String, Long> e : split.entrySet()) bump(copy, e.getKey(), -e.getValue());
        net.clear();
        net.putAll(copy);
    }

    Map<String, Long> net() { return new LinkedHashMap<>(net); }

    List<String> settle() {
        List<String> out = new ArrayList<>();
        Map<String, Long> bal = new LinkedHashMap<>(net);
        List<String> debtors = new ArrayList<>();
        List<String> creditors = new ArrayList<>();
        for (Map.Entry<String, Long> e : bal.entrySet()) {
            if (e.getValue() < 0) debtors.add(e.getKey());
            else if (e.getValue() > 0) creditors.add(e.getKey());
        }
        debtors.sort((a, b) -> {
            long da = -bal.get(a), db = -bal.get(b);
            if (da != db) return Long.compare(db, da);
            return a.compareTo(b);
        });
        creditors.sort((a, b) -> {
            long ca = bal.get(a), cb = bal.get(b);
            if (ca != cb) return Long.compare(cb, ca);
            return a.compareTo(b);
        });
        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            String d = debtors.get(i), c = creditors.get(j);
            long need = -bal.get(d), give = bal.get(c);
            long t = Math.min(need, give);
            out.add(d + " pays " + c + " " + t);
            bal.put(d, bal.get(d) + t);
            bal.put(c, bal.get(c) - t);
            if (bal.get(d) == 0) i++;
            if (bal.get(c) == 0) j++;
        }
        return out;
    }
}`,
      hints: [
        'Ghi net qua một bản sao Map tạm rồi mới commit về net chính; lỗi giữa chừng thì không commit.',
        'Trong settle, thao tác trên bản sao net để settle không phá net thật; dùng Long.compare để sắp số, tie theo id.',
        'Với chu kỳ nợ A, B, C trả tuần tự cho nhau, net của từng người về 0 nên settle trả danh sách rỗng.',
      ],
      explain: `Bài này đánh giá một năng lực thiết kế: **tách netting khỏi cách chia**. Ledger không cần biết EqualSplit hay PercentSplit; chỉ cần tổng được validate và một net map. Test đưa cả ba strategy tự viết (Eq, OnePayer, BadSplit) vào mà không phải sửa Ledger, minh hoạ Open/Closed trực tiếp. Lỗi hay gặp: (1) mutate net trực tiếp rồi mới bị throw — net lệch và test nhận biết được; (2) dùng double nên chuỗi "B pays A 100" biến thành "100.0"; (3) settle thay đổi net — làm cho lần sau settle trả kết quả khác. Tóm lại: settle nên đọc net, in kế hoạch, không đổi dữ liệu.`,
    },
  ],
  check: [
    {
      q: 'Vì sao nên dùng long theo cent thay vì double khi chia tiền?',
      options: [
        'Để code gọn hơn',
        'Tránh sai số thập phân; một cent lệch làm dữ liệu tài chính không cân',
        'Tăng tốc độ tính toán',
        'Dễ đọc hơn',
      ],
      answer: 1,
      explain: `Double không giữ chính xác số thập phân (0.1 cộng 0.2 ra 0.30000000000000004); tiền phải dùng long theo đơn vị nhỏ nhất.`,
    },
    {
      q: 'Greedy settle trong bài này cho số giao dịch khoảng bao nhiêu cho n người?',
      options: [
        'Cỡ n lũy thừa 2 giao dịch',
        'Tối đa n-1 giao dịch, gần mức tối ưu vì mỗi lần khớp một debtor với một creditor là bớt một bên',
        'Luôn n chia 2',
        'Không giới hạn',
      ],
      answer: 1,
      explain: `Greedy khớp một debtor với một creditor mỗi vòng; tối ưu tuyệt đối là NP-hard nên greedy cho gần mức n-1 là chuẩn.`,
    },
    {
      q: 'Nếu net của mọi người bằng 0, settle trả về gì?',
      options: [
        'Ném ngoại lệ',
        'Danh sách rỗng, mọi nợ đã được bù trừ trong net',
        'Một giao dịch bằng 0',
        'Treo vô hạn',
      ],
      answer: 1,
      explain: `Không còn debtor hoặc creditor nào nên danh sách kết quả rỗng; chu kỳ A, B, C trả tuần tự là ví dụ cụ thể.`,
    },
    {
      q: 'Nếu tổng phần chia khác tổng amount, hành vi đúng là',
      options: [
        'Ghi net trước rồi hoàn tác sau',
        'Từ chối expense ngay, net nguyên vẹn — validate ở biên trước khi đụng dữ liệu',
        'Không cần validate',
        'Chỉ validate lúc cuối ngày',
      ],
      answer: 1,
      explain: `Fail fast ở biên: split trả về phải khớp tổng amount; nếu lệch thì expense bị từ chối trước khi Ledger ghi bất kỳ cent nào.`,
    },
  ],
  related: ['design-014', 'design-027'],
  tags: ['splitwise', 'strategy-pattern', 'net-balance', 'netting', 'greedy', 'LLD'],
},
{
  id: 'lesson-architecture-007',
  track: 'architecture',
  order: 7,
  title: 'Logging framework: filter theo level, Decorator định dạng và nhiều appender',
  level: 'senior',
  minutes: 35,
  goals: [
    'Thiết kế pipeline log: filter theo level rồi đến appender và Decorator',
    'Hiểu vì sao format là Decorator bọc appender chứ không nằm trong Logger',
    'Thêm kênh hoặc filter mới mà không sửa Logger (Open/Closed)',
  ],
  body: `**Tóm tắt:** Framework logging dùng filter chain quyết định event đi hay không, Decorator bọc appender định dạng độc lập, và thêm kênh/lọc mới mà không sửa Logger.

### Vòng LLD cho logging framework
Logging là bài LLD nhỏ nhưng khéo: một Logger nhận một event (level, message, timestamp), quyết định **cho đi hay không** (filter), rồi **gửi cho ai** (appender), và **dạng gì** (format). Hỏi làm rõ trước: có mấy level; một log có thể đi tới nhiều nơi đồng thời không (console, file, giám sát); format có khác nhau theo nơi gửi không; log chứa dữ liệu nhạy cảm thì xử lý thế nào? Bài này dùng bộ test với một appender nhớ trong bộ nhớ nên chỉ tập trung vào phần logic.

### Sơ đồ class
~~~text
LogRecord (bất biến)
  |-- level int, message String, timestamp long
Levels
  |-- DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3
LogFilter (interface) -- accept hoặc từ chối
  |-- LevelFilter(minLevel)
  |-- OnlyOtp (filter tự thêm trong test)
Appender (interface)
  |-- append(LogRecord)
  |-- InMemoryAppender
  |-- PiiMask (Decorator: che số)
  |-- TimestampDecorator (Decorator: thêm [ts=...])
Logger
  |-- List LogFilter, List Appender
  |-- log(level, message, timestamp)
~~~

### Pipeline: filter trước appender sau
Mỗi lần {{log(level, message, timestamp)}} diễn ra theo một thứ tự cố định: (1) dựng LogRecord bất biến; (2) duyệt filter: **mọi filter phải đồng ý** — một filter từ chối là event bị bỏ, không đi đâu cả; (3) nếu qua hết, record được gửi cho từng appender đã đăng ký. Cách duyệt này là biến thể của Chain of Responsibility thường gặp trong Logback: thành một chuỗi filter, mỗi mắt xích có quyền phủ quyết event; khác với CoR "ai ôm được thì ôm và dừng", ở đây event chỉ đi tiếp khi **cả chuỗi đồng ý**. Nói rõ sự khác biệt này trong phỏng vấn là một điểm cộng: bạn biết tại sao chọn bộ lọc phủ quyết — vì một log sai level không nên đi tới bất kỳ appender nào.

### Format là Decorator, không nằm trong Logger
Logger chỉ có hai việc: lọc và phát. Định dạng (thêm timestamp, che dữ liệu nhạy cảm) là từng lớp Decorator bọc quanh một Appender. Thứ tự bọc quyết định thứ tự xử lý: nếu bọc {{PiiMask}} bên ngoài và {{Timestamp}} bên trong thì **che số trước, thêm timestamp sau** — do đó số trong timestamp không bị che. Đây là lý do thứ tự bọc Decorator phải được nói rõ; trong phỏng vấn hãy vẽ luồng "record → PiiMask → Timestamp → appender". PiiMask che bằng cách thay từng chữ số thành dấu sao; message bị biến đổi nhưng level và timestamp giữ nguyên (record bất biến chỉ được thay bằng record mới, không được sửa record cũ).

### Mở rộng không sửa code
Test thêm một Appender tự viết và một filter tự viết — Logger không được sửa dòng nào. Đây là tín hiệu Open/Closed thứ hai của bài: pipeline mở bởi interface, chốt bởi danh sách đăng ký qua add. Trong sản phẩm thật, các appender xuất hiện theo cấu hình: Logback dùng XML hay YAML, Spring dùng bean; cùng nguyên tắc đó là một registry khi khởi động.

### Trade-off
| Phương án | Ưu điểm | Nhược điểm | Khi nào chọn |
|---|---|---|---|
| Log trực tiếp System.out | Nhanh nhất | Không lọc được, không định dạng, khó đổi | Script chạy một lần |
| Filter + appender + Decorator | Tách bạch, test được từng phần, mở rộng bằng lớp mới | Cần cấu hình, phức tạp hơn | Ứng dụng thật |
| Logback config (XML/YAML) | Cấu hình đổi không cần build lại | Phải học ngôn ngữ cấu hình | Project lớn dùng SLF4J |

### SOLID áp dụng ở đâu
- **SRP:** Logger chỉ điều phối; filter chỉ lọc; Decorator chỉ định dạng; appender chỉ ghi.
- **DIP/LSP:** mọi appender và filter là interface; có thể thay thế với record bất biến.
- **OCP:** thêm filter hoặc appender là thêm class mới, không mở code Logger.
- **ISP:** filter chỉ có accept, appender chỉ có append — không bắt ai cài đặt phương thức thừa.

### Liên hệ phỏng vấn
Nói về nghiệp vụ log sản phẩm: log level áp dụng từng môi trường (DEV cho DEBUG verbose, PROD chỉ INFO trở lên); trong sandbox ta dùng LevelFilter(2) tức cho phép WARN trở lên. Rồi nói nối tiếp: log nhạy cảm phải được mask; log hệ thống chịu tải cao phải dùng async appender hoặc queue. Thách thức: nếu async, thứ tự log có thể đảo; nếu cần thứ tự, dùng BlockingQueue có capacity và ghi theo batch.

> Senior tip: trong một dự án nhà băng thật, tôi từng thấy người lập trình dùng StringBuilder để format log, rồi đặt một khoá đồng bộ chung — mọi dòng log phải đợi nhau, tốn hàng trăm giây CPU mỗi ngày. Thay vào đó, Logback tự sinh timestamp và pipeline format chạy ngoài khoá tối ưu hơn nhiều. Khi LLD logging, luôn hỏi thêm "Logger này có chịu được hàng nghìn request mỗi giây không".`,
  exercises: [
    {
      title: 'Logger với filter chain và Decorator che dữ liệu nhạy cảm',
      prompt: `Hoàn thiện {{Logger}} và decorator {{PiiMask}}.

Class {{Logger}} giữ danh sách filter và appender:
- {{addFilter(LogFilter f)}} / {{addAppender(Appender a)}}: thêm nếu khác null.
- {{log(int level, String message, long timestamp)}}: dựng {{LogRecord}}; nếu có filter nào từ chối thì bỏ; ngược lại gửi record cho từng appender theo thứ tự đăng ký. Không ném exception với input hợp lệ.

Class {{PiiMask}} là Decorator bọc một appender: khi nhận record, thay từng chữ số bằng {{*}} rồi gửi bản record mới cho appender bên trong; level và timestamp giữ nguyên. Record là bất biến, không sửa được object cũ.

Thứ tự Decorator trong test: {{new PiiMask(new TimestampDecorator(mem))}} — che số trước, thêm {{[ts=...]}} sau.`,
      starter: `import java.util.*;

class Levels {
    static final int DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3;
}

class LogRecord {
    private final int level;
    private final String message;
    private final long timestamp;
    LogRecord(int level, String message, long timestamp) {
        this.level = level; this.message = message; this.timestamp = timestamp;
    }
    int level() { return level; }
    String message() { return message; }
    long timestamp() { return timestamp; }
}

interface LogFilter { boolean accept(LogRecord r); }

interface Appender { void append(LogRecord r); }

class InMemoryAppender implements Appender {
    final List<LogRecord> records = new ArrayList<>();
    public void append(LogRecord r) { records.add(r); }
}

class LevelFilter implements LogFilter {
    private final int minLevel;
    LevelFilter(int minLevel) { this.minLevel = minLevel; }
    public boolean accept(LogRecord r) { return r.level() >= minLevel; }
}

class TimestampDecorator implements Appender {
    private final Appender next;
    TimestampDecorator(Appender next) { this.next = next; }
    public void append(LogRecord r) {
        next.append(new LogRecord(r.level(), "[ts=" + r.timestamp() + "] " + r.message(), r.timestamp()));
    }
}

class PiiMask implements Appender {
    PiiMask(Appender next) { }
    public void append(LogRecord r) { throw new UnsupportedOperationException("TODO"); }
}

class Logger {
    void addFilter(LogFilter f) { throw new UnsupportedOperationException("TODO"); }
    void addAppender(Appender a) { throw new UnsupportedOperationException("TODO"); }
    void log(int level, String message, long timestamp) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static class CountingAppender implements Appender {
        int count = 0;
        LogRecord last = null;
        public void append(LogRecord r) { count++; last = r; }
    }
    static class OnlyOtp implements LogFilter {
        public boolean accept(LogRecord r) { return r.message().contains("otp"); }
    }
    public static void main(String[] args) {
        InMemoryAppender mem = new InMemoryAppender();
        CountingAppender cnt = new CountingAppender();
        Logger log = new Logger();
        log.addFilter(new LevelFilter(Levels.WARN));
        log.addAppender(mem);
        log.addAppender(cnt);

        log.log(Levels.INFO, "day la log debug", 100);
        check("below min level dropped", mem.records.isEmpty() && cnt.count == 0);
        log.log(Levels.WARN, "disk gan day", 110);
        check("warn passes one filter", mem.records.size() == 1 && cnt.count == 1);
        check("record keeps fields", mem.records.get(0).message().equals("disk gan day") && mem.records.get(0).level() == Levels.WARN && mem.records.get(0).timestamp() == 110);
        log.log(Levels.ERROR, "boom", 120);
        check("reaches all appenders", mem.records.size() == 2 && cnt.count == 2);

        InMemoryAppender mem2 = new InMemoryAppender();
        Logger log2 = new Logger();
        log2.addAppender(new PiiMask(mem2));
        log2.log(Levels.INFO, "Goi 0912345678 kiem tra", 200);
        LogRecord r2 = mem2.records.get(0);
        check("mask hides digits", r2.message().equals("Goi ********** kiem tra"));
        check("mask keeps level and ts", r2.level() == Levels.INFO && r2.timestamp() == 200);

        InMemoryAppender mem3 = new InMemoryAppender();
        Logger log3 = new Logger();
        log3.addAppender(new PiiMask(new TimestampDecorator(mem3)));
        log3.log(Levels.WARN, "user 12345 login 00", 300);
        check("decorators mask inner first", mem3.records.get(0).message().equals("[ts=300] user ***** login **"));

        Logger log4 = new Logger();
        CountingAppender cnt4 = new CountingAppender();
        log4.addFilter(new LevelFilter(Levels.INFO));
        log4.addFilter(new OnlyOtp());
        log4.addAppender(cnt4);
        log4.log(Levels.ERROR, "system crash", 400);
        check("chain second filter can veto", cnt4.count == 0);
        log4.log(Levels.ERROR, "otp invalid", 410);
        check("chain all must accept", cnt4.count == 1);

        Logger log5 = new Logger();
        CountingAppender cnt5 = new CountingAppender();
        log5.addAppender(cnt5);
        log5.log(Levels.DEBUG, "custom", 500);
        check("new appender works", cnt5.count == 1 && cnt5.last.message().equals("custom"));

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

class Levels {
    static final int DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3;
}

class LogRecord {
    private final int level;
    private final String message;
    private final long timestamp;
    LogRecord(int level, String message, long timestamp) {
        this.level = level; this.message = message; this.timestamp = timestamp;
    }
    int level() { return level; }
    String message() { return message; }
    long timestamp() { return timestamp; }
}

interface LogFilter { boolean accept(LogRecord r); }

interface Appender { void append(LogRecord r); }

class InMemoryAppender implements Appender {
    final List<LogRecord> records = new ArrayList<>();
    public void append(LogRecord r) { records.add(r); }
}

class LevelFilter implements LogFilter {
    private final int minLevel;
    LevelFilter(int minLevel) { this.minLevel = minLevel; }
    public boolean accept(LogRecord r) { return r.level() >= minLevel; }
}

class TimestampDecorator implements Appender {
    private final Appender next;
    TimestampDecorator(Appender next) { this.next = next; }
    public void append(LogRecord r) {
        next.append(new LogRecord(r.level(), "[ts=" + r.timestamp() + "] " + r.message(), r.timestamp()));
    }
}

class PiiMask implements Appender {
    private final Appender next;
    PiiMask(Appender next) { this.next = next; }
    public void append(LogRecord r) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < r.message().length(); i++) {
            char c = r.message().charAt(i);
            sb.append(Character.isDigit(c) ? '*' : c);
        }
        next.append(new LogRecord(r.level(), sb.toString(), r.timestamp()));
    }
}

class Logger {
    private final List<LogFilter> filters = new ArrayList<>();
    private final List<Appender> appenders = new ArrayList<>();

    void addFilter(LogFilter f) { if (f != null) filters.add(f); }
    void addAppender(Appender a) { if (a != null) appenders.add(a); }

    void log(int level, String message, long timestamp) {
        LogRecord r = new LogRecord(level, message, timestamp);
        for (LogFilter f : filters) {
            if (!f.accept(r)) return;
        }
        for (Appender a : appenders) a.append(r);
    }
}`,
      hints: [
        'PiiMask thay từng chữ số thành dấu sao rồi tạo LogRecord mới; không được mutate bất kỳ field nào.',
        'Trong Logger, duyệt filter trước, chỉ khi mọi filter đồng ý mới duyệt appender.',
        'addFilter và addAppender chỉ thêm khi tham số khác null.',
      ],
      explain: `Điểm quan trọng nhất của bài này là quy tắc "record là bất biến: Decorator thay bản mới, không sửa bản cũ" và "thứ tự bọc Decorator quyết định thứ tự xử la": PiiMask bên ngoài bọc Timestamp bên trong thì số trong timestamp bị che; ngược lại giữ nguyên timestamp và chỉ che số trong message. Lỗi thường gặp là dùng Character.isLetterOrDigit để che (sai, chỉ che chữ số), hay dùng replaceAll với regex (dễ sai mã hóa). Còn Logger sai là gọi appender có filter chưa đồng ý, tức là filter chỉ coi như gợi ý.`,
    },
  ],
  check: [
    {
      q: 'Pipeline trong Logger của bài này duyệt filter theo quy tắc nào?',
      options: [
        'Một filter đồng ý là đủ, event được gửi tới appender',
        'Mọi filter phải đồng ý; một filter từ chối là event bị bỏ',
        'Filter đầu tiên quyết định, các filter sau không làm gì',
        'Filter chỉ dùng để ghi log vào file, không lọc',
      ],
      answer: 1,
      explain: `Filter chain kiểu từng mắt xích có quyền phủ quyết: mọi filter phải đồng ý thì event mới đi tới appender; kiểu này dùng khi một log sai level không được đi đâu cả.`,
    },
    {
      q: 'Vì sao định dạng (timestamp, mask PII) là Decorator bọc appender chứ không nằm trong Logger?',
      options: [
        'Để Logger có ít method hơn',
        'Để combo định dạng được cấu hình độc lập cho mỗi đích ghi, và Logger không phải sửa khi thêm định dạng mới',
        'Format chậm hơn trong Logger',
        'Để tránh dùng interface',
      ],
      answer: 1,
      explain: `Decorator bọc appender cho phép phối hợp từng định dạng cho từng đích ghi; Logger giữ nguyên hai việc lọc và phát.`,
    },
    {
      q: 'Bọc {{new PiiMask(new TimestampDecorator(mem))}} luồng xử lý là gì?',
      options: [
        'Thêm timestamp trước, che số sau; số trong timestamp bị che',
        'Che số trong message trước, thêm timestamp sau; timestamp giữ nguyên chữ số',
        'Cả hai phải cùng chạy song song',
        'Timestamp chỉ áp dụng cho level ERROR',
      ],
      answer: 1,
      explain: `Decorator trong xử lý trước, Decorator ngoài xử lý sau; do đó PiiMask (trong) chạy trước Timestamp (ngoài), timestamp thêm sau không bị che.`,
    },
    {
      q: 'LogRecord nên được thiết kế thế nào?',
      options: [
        'Mutable, để Decorator sửa save code',
        'Bất biến: Decorator tạo record mới, giữ nguyên object cũ để thread-safe và dễ suy luận',
        'Có getters và setters đầy đủ',
        'Ghi trực tiếp vào field public',
      ],
      answer: 1,
      explain: `Record bất biến cho phép Decorator tạo bản mới an toàn và không gây hiệu ứng lăn tàu khi nhiều appender cùng thao tác trên cùng record.`,
    },
  ],
  related: ['architecture-002', 'architecture-016'],
  tags: ['logging-framework', 'filter-chain', 'decorator-pattern', 'pii-mask', 'appenders', 'LLD'],
},
{
  id: 'lesson-architecture-008',
  track: 'architecture',
  order: 8,
  title: 'Text editor Undo/Redo: Command pattern, giới hạn lịch sử và gộp thao tác gõ',
  level: 'mid',
  minutes: 30,
  goals: [
    'Dùng Command pattern để mỗi thao tác biết cách làm và hoàn tác chính nó',
    'Giới hạn kích thước lịch sử undo bằng một deque có giới hạn',
    'Gộp các ký tự gõ liên tiếp thành một command để undo trả về cả từ',
  ],
  body: `**Tóm tắt:** Text editor dùng Command pattern cho undo/redo, gộp các thao tác gõ liên tiếp và giới hạn lịch sử bằng deque để tiết kiệm bộ nhớ.

### Vòng LLD cho editor với Undo/Redo
Trong word processor hoặc editor (VS Code, Google Docs) mỗi lần nhận ký tự là một diff nhỏ — một file có hàng nghìn chữ cái vẫn phải undo được *cả cụm*, không phải từng ký tự một. Bài phỏng vấn LLD này khai thác Command pattern: mỗi thao tác (gõ, xoá) là một command biết tự thực thi và tự hoàn tác; history là tập command; redo là tái thực thi. Đi hai câu hỏi làm rõ trước: lịch sử có giới hạn bằng bao nhiêu (bộ nhớ có hạn)? Hai lần gõ liền nhau tính là một thao tác hay hai? (Câu thứ hai ra câu "gộp": gõ liên tiếp liền kề thì gộp vào một lệnh.)

### Sơ đồ class
~~~text
Cmd (abstract)
  |-- pos int
  |-- execute(Editor e) : tác động vào buffer và cursor
  |-- undo(Editor e)    : trả buffer về trạng thái cũ
InsertCmd  (pos, text) : execute chèn pos; undo xoá đoạn [pos, pos+len)
DeleteCmd  (pos, removed) : execute xoá đoạn; undo chèn lại
Editor
  |-- buf StringBuilder, cursor int
  |-- undoStack : Deque đầu tiên là command mới nhất
  |-- redoStack : Deque
  |-- type(s), delete(n), undo(), redo(), run(cmd)
~~~

### Hai ngăn cho undo và redo
Một ngăn không đủ: khi undo, command bị đẩy sang redoStack; khi redo, lại quay về undoStack. Mỗi lần người dùng **thực hiện một thao tác mới** (type, delete, hoặc run một command tự thêm), hệ thống xoá mọi lệnh đang chờ trong redoStack — không còn đường redo về nhánh cũ nữa, vì lịch sử đã tách nhánh. Như vậy: sau khi undo, người dùng có kiểu chữ mới — redoStack phải rỗng.

### Gộp thao tác gõ liên tiếp
Khi gõ {{type("he")}} rồi {{type("llo")}} và cursor đang nằm ngay sau phần text của command chèn trước đó, editor thật coi hai lần gõ là một lệnh duy nhất. Quy tắc: **command mới là một InsertCmd, lịch sử không có lệnh pending (redoStack rỗng), và vị trí cursor nằm đúng ở cuối phần text của InsertCmd trên đỉnh stack** — khi đó chỉ cần nối text của command cũ: {{top.text += s}}. Nếu người dùng đã undo (hoặc đã xoá ký tự bằng delete) trước đó, hoặc lệnh trên đỉnh là DeleteCmd, thì phải mở một command mới. Không thể gộp qua ranh giới lệnh loại khác.

Điều thú vị: gộp **không** làm tăng kích thước lịch sử. Nhưng một command gộp dài nhiều chữ vẫn trả về undo một lần — đúng như cảm giác người dùng.

### Giới hạn lịch sử
Vì bộ nhớ có hạn, lịch sử chỉ giữ {{limit}} command gần nhất: khi push làm tăng kích thước vượt giới hạn thì **bỏ command cũ nhất** (deque removeLast). Điều này buộc tester phải check: sau một chuỗi dài các thao tác luôn {{historySize() <= limit}}; khi vượt mốc, các command cũ không thể undo nữa — cursor và buffer vẫn nhất quán vì nó được quyết định theo mỗi thao tác, còn undo chỉ sống trên những command còn lại.

### SOLID áp dụng ở đâu
- **OCP:** thêm command loại mới không phải sửa Editor (giữ {{run(Cmd)}}): ví dụ "Replace All", "Auto-link" hay một MacroCommand đều là một lớp mới.
- **SRP:** mỗi command chỉ biết tự thực hiện và hoàn tác của chính nó; Editor chỉ quản lý buffer, cursor, và hai ngăn.
- **DIP:** Editor phụ thuộc lớp Cmd; test có thể viết một UpperCmd tự thêm.

### Trade-off
| Hướng triển khai | Ưu điểm | Nhược điểm | Khi nào chọn |
|---|---|---|---|
| Snapshot toàn buffer cho mỗi lần chỉnh | Giải thích dễ | Tốn bộ nhớ trầm trọng với file lớn | Editor lớn hơn vài trăm KB |
| Command pattern + diff | Nhẹ bộ nhớ, undo theo từng thao tác | Phải cài execute và undo cho từng loại lệnh mới | Text editor, design tool |
| CRDT / operational transform | Nhiều người cùng sửa toàn được | Phức tạp hơn nhiều | Google Docs, Figma |

### Liên hệ phỏng vấn
Chuẩn bị trước hai câu hỏi đi tiếp: "Nếu nhiều người cùng sửa một file (realtime)?" — câu trả lời là Operational Transform hoặc CRDT, và undo ở đó phức tạp hơn nhiều; và "Nếu muốn undo theo từ thay vì theo ký tự?" — câu trả lời là quy tắc gộp theo con trỏ như bài này, hoặc gộp theo thời gian. Khi hỏi về offrir, giải thích rằng Command là lớp discrete có execute, undo và redo tại chỗ; Editor chỉ quản lý hai ngăn.

> Senior tip: Tôi từng thấy một ứng dụng office tự viết lưu toàn buffer như một chuỗi String cho mỗi mức undo → với file 1 MB, 100 undo ăn 100 MB. Command pattern nặng hơn một chút khi code, nhưng là lựa chọn duy nhất giữ được scale. Chi phí đáng trả vì bộ nhớ tiết kiệm hàng chục lần.`,
  exercises: [
    {
      title: 'Editor: undo redo có giới hạn và gộp gõ liên tiếp',
      prompt: `Hoàn thiện class {{Editor}} dùng class {{Cmd}}, {{InsertCmd}}, {{DeleteCmd}} cho sẵn.

API cần có:
- {{type(String s)}}: nếu {{s}} rỗng thì bỏ qua. Nếu đỉnh undoStack là một {{InsertCmd}} và vị trí {{cursor}} đang nằm ngay sau phần text của nó và **không** có lệnh pending trong redoStack thì **gộp**: {{top.text += s}}, buf chèn s tại cursor, cursor tăng theo {{s.length}}. Ngược lại chạy một InsertCmd mới qua {{run(Cmd)}}.
- {{delete(int n)}}: không làm gì nếu cursor bằng 0; số ký tự xoá là {{min(n, cursor)}} (xoá đoạn ngay trước cursor), như một {{DeleteCmd}}.
- {{undo()}} / {{redo()}}: nếu có lệnh trong ngăn, lấy ra; undo hoàn tác; redo thực thi lại; trả về {{true}} khi có thao tác được thực hiện, {{false}} nếu không.
- {{run(Cmd c)}}: thực thi c, push vào undoStack, đồng thời **xóa redoStack**.
- Giới hạn: sau một lần push, nếu {{historySize() > limit}} bỏ command cũ nhất.
- {{canUndo()}}, {{canRedo()}}, {{historySize()}}, {{text()}}, {{cursor()}}.`,
      starter: `import java.util.*;

class Cmd {
    final int pos;
    Cmd(int pos) { this.pos = pos; }
    void execute(Editor e) { }
    void undo(Editor e) { }
}

class InsertCmd extends Cmd {
    String text;
    InsertCmd(int pos, String text) { super(pos); this.text = text; }
    void execute(Editor e) { e.buf.insert(pos, text); e.cursor = pos + text.length(); }
    void undo(Editor e) { e.buf.delete(pos, pos + text.length()); e.cursor = pos; }
}

class DeleteCmd extends Cmd {
    String removed;
    DeleteCmd(int pos, String removed) { super(pos); this.removed = removed; }
    void execute(Editor e) { e.buf.delete(pos, pos + removed.length()); e.cursor = pos; }
    void undo(Editor e) { e.buf.insert(pos, removed); e.cursor = pos + removed.length(); }
}

class Editor {
    StringBuilder buf = new StringBuilder();
    int cursor = 0;
    private final int limit;
    private final Deque<Cmd> undoStack = new ArrayDeque<>();
    private final Deque<Cmd> redoStack = new ArrayDeque<>();

    Editor(int historyLimit) { this.limit = historyLimit; }

    String text() { return buf.toString(); }
    int cursor() { return cursor; }
    boolean canUndo() { throw new UnsupportedOperationException("TODO"); }
    boolean canRedo() { throw new UnsupportedOperationException("TODO"); }
    int historySize() { throw new UnsupportedOperationException("TODO"); }
    void run(Cmd c) { throw new UnsupportedOperationException("TODO"); }
    void type(String s) { throw new UnsupportedOperationException("TODO"); }
    void delete(int n) { throw new UnsupportedOperationException("TODO"); }
    boolean undo() { throw new UnsupportedOperationException("TODO"); }
    boolean redo() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, n = 0;
    static void check(String name, boolean ok) {
        n++; if (ok) { p++; System.out.println("PASS " + name); } else System.out.println("FAIL " + name);
    }
    static class UpperCmd extends Cmd {
        String saved;
        UpperCmd() { super(0); }
        void execute(Editor e) {
            saved = e.buf.toString();
            e.buf.setLength(0);
            e.buf.append(saved.toUpperCase());
            e.cursor = 0;
        }
        void undo(Editor e) {
            e.buf.setLength(0);
            e.buf.append(saved);
            e.cursor = 0;
        }
    }
    public static void main(String[] args) {
        Editor ed = new Editor(5);
        check("empty editor", ed.text().equals("") && ed.historySize() == 0 && !ed.canUndo() && !ed.canRedo());
        ed.type("hello");
        check("typed text and cursor", ed.text().equals("hello") && ed.cursor() == 5 && ed.historySize() == 1);
        check("undo reverts", ed.undo() && ed.text().equals("") && ed.cursor() == 0 && ed.canRedo());
        check("redo restores", ed.redo() && ed.text().equals("hello") && ed.cursor() == 5);

        Editor ed2 = new Editor(5);
        ed2.type("he");
        ed2.type("llo");
        check("consecutive typing merges", ed2.text().equals("hello") && ed2.historySize() == 1);
        ed2.undo();
        check("merged undo reverts whole run", ed2.text().equals("") && ed2.historySize() == 0);
        ed2.redo();
        ed2.undo();
        ed2.type("x");
        check("new edit clears redo", ed2.text().equals("x") && !ed2.canRedo() && ed2.historySize() == 1);
        ed2.undo();
        check("new command undo reverts separately", ed2.text().equals("") && ed2.historySize() == 0);

        Editor ed3 = new Editor(5);
        ed3.type("abcd");
        ed3.delete(2);
        check("delete is one command", ed3.text().equals("ab") && ed3.cursor() == 2 && ed3.historySize() == 2);
        ed3.type("x");
        check("delete breaks typing run", ed3.text().equals("abx") && ed3.historySize() == 3);
        ed3.undo();
        check("undo new typing first", ed3.text().equals("ab") && ed3.cursor() == 2);
        ed3.undo();
        check("undo restores deleted chars", ed3.text().equals("abcd") && ed3.cursor() == 4);
        ed3.delete(10);
        check("delete clamps at cursor", ed3.text().equals("") && ed3.cursor() == 0 && ed3.historySize() == 2);
        check("redo cleared after new edit", !ed3.redo() && ed3.text().equals(""));
        ed3.undo();
        check("undo clamped delete", ed3.text().equals("abcd") && ed3.cursor() == 4);

        Editor ed4 = new Editor(2);
        ed4.type("aa");
        ed4.delete(1);
        ed4.type("b");
        check("history bounded at limit", ed4.historySize() == 2);
        ed4.undo();
        ed4.undo();
        check("oldest command dropped", ed4.text().equals("aa") && !ed4.canUndo());
        ed4.delete(5);
        check("delete clamps at buffer start", ed4.text().equals("") && ed4.cursor() == 0);

        Editor ed5 = new Editor(5);
        ed5.delete(3);
        check("delete on empty is no-op", ed5.historySize() == 0 && ed5.text().equals(""));

        Editor ed6 = new Editor(5);
        ed6.type("hey");
        ed6.run(new UpperCmd());
        check("custom command runs", ed6.text().equals("HEY") && ed6.historySize() == 2);
        ed6.undo();
        check("custom command undoes", ed6.text().equals("hey") && ed6.historySize() == 1);

        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `import java.util.*;

class Cmd {
    final int pos;
    Cmd(int pos) { this.pos = pos; }
    void execute(Editor e) { }
    void undo(Editor e) { }
}

class InsertCmd extends Cmd {
    String text;
    InsertCmd(int pos, String text) { super(pos); this.text = text; }
    void execute(Editor e) { e.buf.insert(pos, text); e.cursor = pos + text.length(); }
    void undo(Editor e) { e.buf.delete(pos, pos + text.length()); e.cursor = pos; }
}

class DeleteCmd extends Cmd {
    String removed;
    DeleteCmd(int pos, String removed) { super(pos); this.removed = removed; }
    void execute(Editor e) { e.buf.delete(pos, pos + removed.length()); e.cursor = pos; }
    void undo(Editor e) { e.buf.insert(pos, removed); e.cursor = pos + removed.length(); }
}

class Editor {
    StringBuilder buf = new StringBuilder();
    int cursor = 0;
    private final int limit;
    private final Deque<Cmd> undoStack = new ArrayDeque<>();
    private final Deque<Cmd> redoStack = new ArrayDeque<>();

    Editor(int historyLimit) { this.limit = historyLimit; }

    String text() { return buf.toString(); }
    int cursor() { return cursor; }
    boolean canUndo() { return !undoStack.isEmpty(); }
    boolean canRedo() { return !redoStack.isEmpty(); }
    int historySize() { return undoStack.size(); }

    void run(Cmd c) {
        redoStack.clear();
        c.execute(this);
        undoStack.addFirst(c);
        while (undoStack.size() > limit) undoStack.removeLast();
    }

    void type(String s) {
        if (s == null || s.isEmpty()) return;
        boolean hadRedo = !redoStack.isEmpty();
        Cmd top = undoStack.peekFirst();
        boolean merged = !hadRedo && top instanceof InsertCmd
                && top.pos + ((InsertCmd) top).text.length() == cursor;
        if (merged) {
            ((InsertCmd) top).text += s;
            buf.insert(cursor, s);
            cursor += s.length();
        } else {
            run(new InsertCmd(cursor, s));
        }
    }

    void delete(int n) {
        if (n <= 0 || cursor <= 0) return;
        int count = Math.min(n, cursor);
        int pos = cursor - count;
        run(new DeleteCmd(pos, buf.substring(pos, cursor)));
    }

    boolean undo() {
        Cmd c = undoStack.pollFirst();
        if (c == null) return false;
        c.undo(this);
        redoStack.addFirst(c);
        return true;
    }

    boolean redo() {
        Cmd c = redoStack.pollFirst();
        if (c == null) return false;
        c.execute(this);
        undoStack.addFirst(c);
        return true;
    }
}`,
      hints: [
        'run(Cmd) là nơi duy nhất quyết định: xoá redoStack, thực thi command, push lên undoStack, rồi cắt bớt nếu vượt giới hạn.',
        'type(String) chỉ gộp khi đỉnh undoStack là InsertCmd, cursor đang ở cuối phần text của nó và redoStack đang rỗng.',
        'Dùng addFirst và removeLast với Deque (ArrayDeque) như một ngăn xếp có giới hạn.',
      ],
      explain: `Ghi nhớ 3 điểm: (1) **undo() chỉ gọi cmd.undo()**: mỗi loại command tự biết hoàn tác chính mình, Editor không có nhánh if nào; khi thêm command mới thì Editor không đổi. (2) **gộp điều kiện**: phải kiểm cả redoStack rỗng, còn top phải là InsertCmd, và vị trí con trỏ nằm đúng ở cuối phần text trước đó; thiếu một điều kiện là merge sai khi user vừa undo — sinh một lịch sử trôi nổi không đúng nhánh. (3) **giới hạn lịch sử** cắt bớt từ đuôi deque; removeLast loại command cũ nhất, còn lệnh mới ở đầu.`,
    },
  ],
  check: [
    {
      q: 'Vì sao dùng Command pattern thay vì lưu snapshot của buffer ở mỗi lần chỉnh sửa?',
      options: [
        'Snapshot nhanh hơn khi có nhiều người dùng',
        'Command chỉ lưu diff nên nhẹ bộ nhớ; có thêm hành vi tự hoàn tác (undo) không cần snapshot',
        'Snapshot không dùng được với StringBuilder',
        'Command luôn đơn giản hơn khi phải cài execute và undo',
      ],
      answer: 1,
      explain: `Snapshot toàn buffer ăn bộ nhớ với file lớn; Command lưu diff và biết tự hoàn tác, thêm loại command mới không phải sửa Editor.`,
    },
    {
      q: 'Khi gõ vài ký tự sau khi vừa undo, redoStack phải ở trạng thái nào?',
      options: [
        'Giữ nguyên, người dùng vẫn redo được phần đã undo trước đó',
        'Bị xoá sạch, vì lịch sử đã tách rời khỏi nhánh cũ',
        'Được push thêm một bản ghi bằng 0',
        'Tự động redo phần đã undo',
      ],
      answer: 1,
      explain: `Mỗi lần thực hiện một lệnh mới (bao gồm gộp gõ), redoStack phải bị xoá — history đã tách nhánh, không có con đường redo về nhánh cũ.`,
    },
    {
      q: 'Lịch sử undo giới hạn {{limit}} điểm, khi vượt phải làm gì?',
      options: [
        'Ném ngoại lệ',
        'Bỏ command cũ nhất (removeLast) khỏi ngăn, giữ số command đúng bằng giới hạn',
        'Gộp tất cả vào một command',
        'Tắt undo đi vĩnh viễn',
      ],
      answer: 1,
      explain: `Chuẩn của editor thật: history là deque giới hạn, bỏ command cũ nhất; buffer và cursor vẫn nhất quán vì buffer và cursor được cập nhật theo từng thao tác, còn undo chỉ hoạt động trên lệnh còn nằm lại.`,
    },
    {
      q: 'Thử gộp gõ "he" và "llo": điều kiện nào **không** bắt buộc để gộp?',
      options: [
        'Đỉnh undoStack là InsertCmd và vị trí con trỏ nằm ngay sau phần text của nó',
        'redoStack đang rỗng (người dùng không vừa undo)',
        'Không có DeleteCmd nằm giữa hai lần gõ',
        'Thời gian giữa hai lần gõ nhỏ hơn 50 ms',
      ],
      answer: 3,
      explain: `Đo thời gian là chiến lược của một số editor (timeout-based), nhưng rules của bài này gộp theo vị trí; thời gian giữa hai lần gõ không có trong hợp đồng của bài này.`,
    },
  ],
  related: ['architecture-002'],
  tags: ['text-editor', 'command-pattern', 'undo-redo', 'command-merge', 'bounded-history', 'LLD'],
},
);
