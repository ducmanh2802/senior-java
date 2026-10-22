/* Algorithm / coding problems for the "Thuật toán" view and mock coding round — owner: task T14. Format: see AGENTS.md */
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-001',
  title: 'Two Sum',
  difficulty: 'easy',
  pattern: 'Hash Map',
  tags: ['array', 'hashmap'],
  prompt: `Cho mảng số nguyên {{nums}} và số {{target}}, trả về **chỉ số** của hai phần tử có tổng bằng {{target}}. Đề bài đảm bảo có đúng một đáp án, và không được dùng một phần tử hai lần.

### Ví dụ
~~~text
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
~~~

### Ràng buộc
- {{2 <= nums.length <= 10^4}}
- {{-10^9 <= nums[i], target <= 10^9}}`,
  hints: [
    'Brute force O(n²) duyệt mọi cặp. Có cách nào nhớ lại những số đã gặp không?',
    'Với mỗi {{x}}, số cần tìm là {{target - x}}. Tra cứu O(1) bằng cấu trúc dữ liệu nào?',
    'Duyệt một lượt: kiểm tra phần bù trong map trước, rồi mới {{put(x, i)}} để tránh dùng lại chính nó.'
  ],
  solution: `### Ý tưởng
Duyệt một lượt, dùng {{HashMap<value, index>}} lưu các số đã gặp. Với mỗi phần tử, kiểm tra phần bù {{target - x}} đã có trong map chưa.

~~~java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);
    }
    throw new IllegalArgumentException("no solution");
}
~~~

### Lưu ý khi phỏng vấn
- Hỏi lại: mảng đã sort chưa? Nếu đã sort thì dùng **two pointers** để đạt O(1) space.
- Cẩn thận overflow khi tính {{target - nums[i]}} nếu ràng buộc lớn hơn (dùng {{long}}).`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu mảng đã được sắp xếp thì sao?', 'Trả về tất cả các cặp không trùng (3Sum dẫn xuất)?']
},
{
  id: 'algo-002',
  title: 'Contains Duplicate',
  difficulty: 'easy',
  pattern: 'Hash Map',
  tags: ['array', 'hashset'],
  prompt: `Cho mảng số nguyên {{nums}}, trả về {{true}} nếu có ít nhất một giá trị xuất hiện từ hai lần trở lên, ngược lại trả về {{false}}.

### Ví dụ
~~~text
Input:  nums = [1, 2, 3, 1]
Output: true

Input:  nums = [1, 2, 3, 4]
Output: false
~~~

### Ràng buộc
- {{1 <= nums.length <= 10^5}}
- {{-10^9 <= nums[i] <= 10^9}}`,
  hints: [
    'Cách đơn giản nhất là sắp xếp rồi so sánh hai phần tử kề nhau. Độ phức tạp bao nhiêu?',
    'Ta chỉ cần biết một giá trị đã xuất hiện hay chưa, không cần đếm số lần. Cấu trúc nào phù hợp?',
    '{{HashSet.add(x)}} trả về {{false}} khi {{x}} đã tồn tại — có thể return ngay, không cần duyệt hết mảng.'
  ],
  solution: `### Ý tưởng
Dùng {{HashSet}} để ghi nhớ các giá trị đã gặp. Khi gặp lại một giá trị, trả về {{true}} ngay lập tức. Nếu duyệt hết mà không trùng thì trả về {{false}}.

Cách này đánh đổi bộ nhớ O(n) để lấy thời gian trung bình O(n). Nếu ưu tiên bộ nhớ, sort tại chỗ rồi so sánh kề nhau: O(n log n) time, O(1) space (với mảng đầu vào được phép sửa).

~~~java
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int x : nums) {
        if (!seen.add(x)) {   // add trả false nếu đã có
            return true;
        }
    }
    return false;
}
~~~

### Lưu ý khi phỏng vấn
- Nêu rõ trade-off: hash set nhanh nhưng tốn bộ nhớ; sort tiết kiệm bộ nhớ nhưng chậm hơn và có thể làm thay đổi input.
- Với dữ liệu cực lớn không vừa RAM, có thể dùng bitmap nếu miền giá trị nhỏ, hoặc Bloom filter để lọc trước (chấp nhận false positive).
- Đừng dùng {{HashSet<int[]>}} hay so sánh mảng bằng {{==}} — với primitive thì ổn, nhưng với object cần hiểu {{equals/hashCode}}.

> Senior tip: Trong pipeline ingest log, tôi thường dùng cách sort + so sánh kề khi batch khoảng vài triệu ID và cần tiết kiệm heap; còn với stream realtime thì hash set kèm giới hạn kích thước hoặc cửa sổ thời gian để tránh OOM.`,
  complexity: 'Time O(n) average, Space O(n)',
  follow: ['Nếu yêu cầu O(1) bộ nhớ thì làm thế nào?', 'Làm sao tìm tất cả các giá trị bị trùng thay vì chỉ true/false?']
},
{
  id: 'algo-003',
  title: 'Valid Anagram',
  difficulty: 'easy',
  pattern: 'Hash Map',
  tags: ['string', 'counting'],
  prompt: `Cho hai chuỗi {{s}} và {{t}}, kiểm tra {{t}} có phải là hoán vị của {{s}} hay không. Hai chuỗi là hoán vị của nhau nếu chúng có cùng các ký tự với cùng số lần xuất hiện, chỉ khác thứ tự.

### Ví dụ
~~~text
Input:  s = "anagram", t = "nagaram"
Output: true

Input:  s = "rat", t = "car"
Output: false
~~~

### Ràng buộc
- {{1 <= s.length, t.length <= 5 * 10^4}}
- {{s}} và {{t}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Nếu độ dài khác nhau thì chắc chắn không phải hoán vị — kiểm tra sớm.',
    'Ta cần so sánh tần số ký tự. Vì bảng chữ cái chỉ có 26 ký tự, dùng mảng đếm thay vì HashMap.',
    'Tăng đếm cho {{s}}, giảm đếm cho {{t}}; nếu mọi ô đều về 0 thì đúng. Có thể dừng sớm khi gặp ô âm.'
  ],
  solution: `### Ý tưởng
Đếm tần số từng ký tự của {{s}} vào mảng 26 phần tử, rồi trừ đi theo {{t}}. Nếu có bất kỳ ô nào khác 0, hai chuỗi không phải hoán vị.

~~~java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }
    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
~~~

### Lưu ý khi phỏng vấn
- Nếu input có Unicode, mảng 26 không đủ; dùng {{HashMap<Character, Integer>}} hoặc đếm theo code point.
- Có thể sort cả hai chuỗi rồi so sánh: O(n log n), code ngắn nhưng tốn thêm bộ nhớ.
- Hỏi lại xem có phân biệt hoa/thường và có bỏ qua khoảng trắng hay không — đề thực tế thường khác đề LeetCode.

> Senior tip: Với so khớp chữ ký (signature) trong hệ thống search, đếm tần số 26 ô nhanh hơn tạo sorted key rất nhiều; nhưng nếu cần key bền vững để cache thì nên chuẩn hoá thành mảng byte rồi băm.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu chuỗi có Unicode thì sửa thế nào?', 'Làm sao nhóm một danh sách chuỗi thành các nhóm anagram?']
},
{
  id: 'algo-004',
  title: 'Group Anagrams',
  difficulty: 'medium',
  pattern: 'Hash Map',
  tags: ['string', 'hashmap', 'sorting'],
  prompt: `Cho mảng chuỗi {{strs}}, nhóm các chuỗi là hoán vị của nhau vào cùng một nhóm. Thứ tự các nhóm và thứ tự phần tử trong nhóm không quan trọng.

### Ví dụ
~~~text
Input:  strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
~~~

### Ràng buộc
- {{1 <= strs.length <= 10^4}}
- {{0 <= strs[i].length <= 100}}
- {{strs[i]}} chỉ gồm chữ cái thường.`,
  hints: [
    'Hai anagram có cùng tập ký tự. Cần một "chữ ký" (key) giống nhau cho mọi anagram.',
    'Sort các ký tự của từng chuỗi để tạo key, hoặc đếm tần số 26 ký tự rồi mã hoá thành chuỗi.',
    'Dùng {{HashMap<key, List<String>>>}}; mỗi key ánh xạ tới danh sách các chuỗi cùng nhóm.'
  ],
  solution: `### Ý tưởng
Với mỗi chuỗi, tạo key bằng cách sắp xếp các ký tự. Mọi anagram của nhau sẽ cho cùng một key. Dùng map từ key sang danh sách chuỗi.

Độ phức tạp: mỗi chuỗi dài k cần O(k log k) để sort, tổng O(n * k log k). Nếu k lớn, có thể đếm tần số và mã hoá key trong O(k), đổi lại key dài hơn và dễ va chạm nếu nối chuỗi không cẩn thận.

~~~java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
~~~

### Lưu ý khi phỏng vấn
- Nếu chuỗi rỗng, key là chuỗi rỗng — vẫn hoạt động bình thường.
- Cẩn thận khi tự tạo key bằng cách nối tần số: phải có separator rõ ràng, nếu không {{"1,11"}} và {{"11,1"}} có thể va chạm.
- Trình bày thêm phương án sort: đơn giản, dễ đọc; phương án đếm tần số nhanh hơn với chuỗi dài nhưng code phức tạp hơn.

> Senior tip: Khi nhóm dữ liệu lớn trong batch job, tôi thường chọn key là mảng byte đã sort rồi băm bằng một hash ổn định; điều này tránh cấp phát String tạm cho hàng chục triệu bản ghi.`,
  complexity: 'Time O(n * k log k), Space O(n * k)',
  follow: ['Nếu chuỗi dài hàng nghìn ký tự thì tối ưu key thế nào?', 'Làm sao xử lý anagram có phân biệt hoa thường?']
},
{
  id: 'algo-005',
  title: 'Valid Palindrome',
  difficulty: 'easy',
  pattern: 'Two Pointers',
  tags: ['string', 'two-pointers'],
  prompt: `Cho chuỗi {{s}}, kiểm tra nó có phải palindrome khi chỉ xét các ký tự chữ và số, bỏ qua khoảng trắng, dấu câu và phân biệt hoa thường không quan trọng.

### Ví dụ
~~~text
Input:  s = "A man, a plan, a canal: Panama"
Output: true

Input:  s = "race a car"
Output: false

Input:  s = " "
Output: true
~~~

### Ràng buộc
- {{1 <= s.length <= 2 * 10^5}}
- {{s}} chỉ gồm ký tự ASCII in được.`,
  hints: [
    'Có thể tạo chuỗi đã chuẩn hoá rồi so sánh với bản đảo ngược, nhưng tốn O(n) bộ nhớ.',
    'Dùng hai con trỏ ở hai đầu; bỏ qua ký tự không phải chữ/số.',
    'Cẩn thận khi so sánh ký tự hoa/thường và khi một con trỏ vượt qua con trỏ kia.'
  ],
  solution: `### Ý tưởng
Hai con trỏ {{left}} và {{right}} tiến vào giữa. Mỗi bước, bỏ qua các ký tự không phải chữ hoặc số. Sau đó so sánh hai ký tự sau khi chuyển về chữ thường. Nếu lệch nhau thì không phải palindrome.

Cách này không cấp phát chuỗi mới, phù hợp với input lớn.

~~~java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện {{left < right}} trong các vòng lặp bỏ qua rất quan trọng, nếu không sẽ vượt biên với chuỗi toàn dấu câu.
- Hỏi lại: có cần xử lý Unicode (dấu tiếng Việt, emoji) không? {{Character}} chỉ xử lý theo code unit, chưa đủ cho mọi ngôn ngữ.
- Cách tạo chuỗi chuẩn hoá dễ đọc hơn nhưng O(n) bộ nhớ; nêu trade-off trước khi code.

> Senior tip: Với kiểm tra palindrome trong luồng xử lý văn bản lớn, tránh {{toLowerCase()}} trên toàn chuỗi vì có thể nhân đôi bộ nhớ; so sánh từng ký tự tại chỗ như trên thường nhanh và ít GC hơn.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu bỏ qua tối đa một ký tự thì kiểm tra thế nào?', 'Xử lý Unicode và emoji cần lưu ý gì?']
},
{
  id: 'algo-006',
  title: '3Sum',
  difficulty: 'medium',
  pattern: 'Two Pointers',
  tags: ['array', 'two-pointers', 'sorting'],
  prompt: `Cho mảng số nguyên {{nums}}, tìm tất cả bộ ba phần tử phân biệt theo chỉ số có tổng bằng 0. Kết quả không được chứa bộ ba trùng nhau (xét theo giá trị).

### Ví dụ
~~~text
Input:  nums = [-1, 0, 1, 2, -1, -4]
Output: [[-1,-1,2], [-1,0,1]]
~~~

### Ràng buộc
- {{3 <= nums.length <= 3000}}
- {{-10^5 <= nums[i] <= 10^5}}`,
  hints: [
    'Sort mảng trước. Với mỗi phần tử cố định, bài toán còn lại là tìm hai số có tổng cho trước.',
    'Đó chính là Two Sum trên mảng đã sort — dùng hai con trỏ ở hai đầu đoạn còn lại.',
    'Phải bỏ qua các giá trị trùng ở vòng ngoài và ở hai con trỏ, nếu không kết quả sẽ bị lặp.'
  ],
  solution: `### Ý tưởng
Sort mảng. Cố định {{nums[i]}}, dùng hai con trỏ {{lo = i + 1}}, {{hi = n - 1}} để tìm cặp có tổng {{-nums[i]}}.

- Nếu tổng nhỏ hơn 0, tăng {{lo}}.
- Nếu lớn hơn 0, giảm {{hi}}.
- Nếu bằng 0, ghi nhận bộ ba rồi bỏ qua mọi giá trị trùng của {{lo}} và {{hi}}.

~~~java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;   // bỏ trùng vòng ngoài
        int lo = i + 1, hi = nums.length - 1;
        while (lo < hi) {
            int sum = nums[i] + nums[lo] + nums[hi];
            if (sum < 0) {
                lo++;
            } else if (sum > 0) {
                hi--;
            } else {
                res.add(List.of(nums[i], nums[lo], nums[hi]));
                int a = nums[lo], b = nums[hi];
                while (lo < hi && nums[lo] == a) lo++;
                while (lo < hi && nums[hi] == b) hi--;
            }
        }
    }
    return res;
}
~~~

### Lưu ý khi phỏng vấn
- Không được dùng cùng một phần tử hai lần: hai con trỏ bắt đầu từ {{i + 1}} đảm bảo điều đó.
- Tổng ba số có thể vượt {{int}} nếu ràng buộc lớn hơn; ở đây {{10^5}} vẫn an toàn nhưng nên chủ động hỏi.
- Trình bày rõ tại sao sort không làm mất nghiệm: ta tìm theo giá trị, không theo thứ tự ban đầu.

> Senior tip: 3Sum là bài rất hay bị hỏi tiếp "nếu mảng streaming thì sao?". Câu trả lời: không thể sort streaming; phải dùng hash theo cặp hoặc chấp nhận lưu toàn bộ.`,
  complexity: 'Time O(n^2), Space O(1) ngoài kết quả',
  follow: ['Nếu yêu cầu 4Sum thì mở rộng thế nào?', 'Làm sao tránh trùng lặp nếu không sort?']
},
{
  id: 'algo-007',
  title: 'Container With Most Water',
  difficulty: 'medium',
  pattern: 'Two Pointers',
  tags: ['array', 'two-pointers', 'greedy'],
  prompt: `Cho mảng {{height}} biểu diễn độ cao các vách. Chọn hai vách để tạo một bể chứa, sao cho diện tích nước chứa được là lớn nhất. Diện tích bằng khoảng cách giữa hai vách nhân với chiều cao của vách thấp hơn.

### Ví dụ
~~~text
Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49
Giải thích: chọn vách index 1 (cao 8) và index 8 (cao 7),
khoảng cách 7, chiều cao 7 -> 49.
~~~

### Ràng buộc
- {{2 <= height.length <= 10^5}}
- {{0 <= height[i] <= 10^4}}`,
  hints: [
    'Brute force thử mọi cặp là O(n²). Cần tận dụng tính chất: diện tích bị giới hạn bởi vách thấp hơn.',
    'Bắt đầu với hai vách ngoài cùng — khoảng cách lớn nhất. Sau đó chỉ có thể thu hẹp.',
    'Nếu di chuyển vách cao hơn, chiều cao không tăng mà khoảng cách giảm, nên luôn di chuyển vách thấp hơn.'
  ],
  solution: `### Ý tưởng
Đặt hai con trỏ ở hai đầu. Diện tích hiện tại là {{min(height[l], height[r]) * (r - l)}}. Sau mỗi bước, chỉ di chuyển con trỏ đang trỏ tới vách thấp hơn, vì giữ vách thấp và thu hẹp khoảng cách không bao giờ cho kết quả tốt hơn.

Đây là lập luận greedy quan trọng cần nói rõ khi phỏng vấn: mọi cặp bị bỏ qua đều có diện tích không lớn hơn phương án hiện tại.

~~~java
public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int best = 0;
    while (left < right) {
        int h = Math.min(height[left], height[right]);
        best = Math.max(best, h * (right - left));
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Diện tích tối đa có thể tới {{10^4 * 10^5 = 10^9}}, vẫn nằm trong {{int}}; nhưng nếu ràng buộc lớn hơn thì dùng {{long}}.
- Khi hai vách bằng nhau, di chuyển bên nào cũng được; giải thích rằng không làm mất nghiệm tối ưu.
- Đừng nhầm với bài Trapping Rain Water: bài này chỉ chọn hai vách, không tính nước bị chặn ở giữa.

> Senior tip: Câu hỏi tiếp hay gặp là "chứng minh greedy đúng". Hãy nói: khi bỏ vách thấp hơn, mọi cặp chứa nó đều có chiều cao tối đa bằng chính nó, mà khoảng cách đã lớn nhất tại thời điểm xét, nên không thể tốt hơn.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Chứng minh tại sao luôn di chuyển vách thấp hơn.', 'Nếu cần trả về cả hai chỉ số thì sửa thế nào?']
},
{
  id: 'algo-008',
  title: 'Trapping Rain Water',
  difficulty: 'hard',
  pattern: 'Two Pointers',
  tags: ['array', 'two-pointers', 'prefix-max'],
  prompt: `Cho mảng {{height}} biểu diễn cao độ các cột có chiều rộng 1. Tính tổng lượng nước mưa có thể bị giữ lại giữa các cột sau khi trời mưa.

### Ví dụ
~~~text
Input:  height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6

Input:  height = [4,2,0,3,2,5]
Output: 9
~~~

### Ràng buộc
- {{1 <= height.length <= 2 * 10^4}}
- {{0 <= height[i] <= 10^5}}`,
  hints: [
    'Lượng nước tại mỗi cột bằng {{min(max bên trái, max bên phải) - height[i]}}, nếu dương.',
    'Có thể tính trước mảng prefix max và suffix max, nhưng tốn O(n) bộ nhớ.',
    'Dùng hai con trỏ: bên nào có max thấp hơn thì lượng nước tại đó đã được quyết định bởi max của bên đó.'
  ],
  solution: `### Ý tưởng
Tại cột {{i}}, nước giữ được là {{min(leftMax, rightMax) - height[i]}}. Thay vì lưu hai mảng max, ta duy trì {{leftMax}} và {{rightMax}} bằng hai con trỏ.

Nếu {{leftMax < rightMax}}, thì với cột bên trái, {{min(leftMax, rightMax)}} chính là {{leftMax}} — không cần biết chính xác rightMax. Ngược lại xử lý bên phải.

~~~java
public int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = Math.max(leftMax, height[left]);
            water += leftMax - height[left];
            left++;
        } else {
            rightMax = Math.max(rightMax, height[right]);
            water += rightMax - height[right];
            right--;
        }
    }
    return water;
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện so sánh có thể dùng {{height[left] < height[right]}} hoặc {{leftMax < rightMax}}; cả hai đều đúng nhưng cần giải thích nhất quán.
- Tổng nước có thể vượt {{int}} nếu mảng rất lớn; với ràng buộc trên thì {{2*10^4 * 10^5 = 2*10^9}} vẫn có thể tràn {{int}} (gần 2.1 tỷ). Nên dùng {{long}} để an toàn.
- Nêu thêm cách prefix/suffix max dễ hiểu hơn, và cách stack monotonic để so sánh.

> Senior tip: Bài này là ví dụ kinh điển cho việc "giảm bộ nhớ nhưng không đổi độ phức tạp". Trong phỏng vấn, tôi đánh giá cao ứng viên biết vẽ hình và giải thích bất biến của hai con trỏ hơn là chỉ đọc thuộc code.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu dùng stack monotonic thì cài đặt thế nào?', 'Làm sao trả về lượng nước tại từng cột, không chỉ tổng?']
}
);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-009',
  title: 'Best Time to Buy and Sell Stock',
  difficulty: 'easy',
  pattern: 'Sliding Window',
  tags: ['array', 'greedy', 'one-pass'],
  prompt: `Cho mảng {{prices}}, trong đó {{prices[i]}} là giá cổ phiếu ở ngày thứ {{i}}. Bạn được mua một lần và bán một lần, phải mua trước khi bán. Tính lợi nhuận lớn nhất có thể. Nếu không có giao dịch nào có lãi, trả về 0.

### Ví dụ
~~~text
Input:  prices = [7,1,5,3,6,4]
Output: 5
Giải thích: mua ngày 2 (giá 1), bán ngày 5 (giá 6).

Input:  prices = [7,6,4,3,1]
Output: 0
~~~

### Ràng buộc
- {{1 <= prices.length <= 10^5}}
- {{0 <= prices[i] <= 10^4}}`,
  hints: [
    'Với mỗi ngày bán, lợi nhuận tốt nhất là giá hôm đó trừ giá mua thấp nhất đã thấy trước đó.',
    'Chỉ cần nhớ một giá trị: mức giá thấp nhất từ đầu đến hiện tại.',
    'Duyệt một lượt, cập nhật min trước rồi mới tính lợi nhuận — hoặc tính rồi cập nhật, miễn không bán trước khi mua.'
  ],
  solution: `### Ý tưởng
Duyệt mảng một lượt. Tại mỗi ngày, {{minPrice}} là giá thấp nhất đã gặp. Nếu bán hôm nay, lợi nhuận là {{prices[i] - minPrice}}. Lấy max trên toàn bộ.

Đây là dạng sliding window tối giản: cửa sổ chỉ cần nhớ một giá trị min, không cần lưu cả cửa sổ.

~~~java
public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE;
    int best = 0;
    for (int price : prices) {
        minPrice = Math.min(minPrice, price);
        best = Math.max(best, price - minPrice);
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Đảm bảo mua trước bán: vì {{minPrice}} chỉ lấy từ các ngày trước hoặc bằng ngày hiện tại, điều kiện được giữ tự nhiên.
- Nếu giá có thể âm hoặc chênh lệch vượt {{int}}, dùng {{long}} cho lợi nhuận.
- Hỏi lại: có được giao dịch nhiều lần không? Nếu có, bài toán chuyển thành cộng các đoạn tăng (Best Time II).

> Senior tip: Bài này thường được dùng để kiểm tra tư duy trạng thái. Ứng viên hay viết vòng lặp hai lớp; hãy chỉ ra rằng trạng thái chỉ gồm "min đến hiện tại" và "best đến hiện tại", nên O(n) là đủ.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu được giao dịch nhiều lần thì làm thế nào?', 'Nếu có phí giao dịch hoặc cooldown thì sao?']
},
{
  id: 'algo-010',
  title: 'Longest Substring Without Repeating Characters',
  difficulty: 'medium',
  pattern: 'Sliding Window',
  tags: ['string', 'sliding-window', 'hashmap'],
  prompt: `Cho chuỗi {{s}}, tìm độ dài của chuỗi con dài nhất không có ký tự nào lặp lại. Chuỗi con là dãy ký tự liên tiếp.

### Ví dụ
~~~text
Input:  s = "abcabcbb"
Output: 3
Giải thích: "abc" là chuỗi con dài nhất không trùng.

Input:  s = "bbbbb"
Output: 1

Input:  s = "pwwkew"
Output: 3
Giải thích: "wke", không phải "pwke" vì "pwke" là subsequence.
~~~

### Ràng buộc
- {{0 <= s.length <= 5 * 10^4}}
- {{s}} gồm chữ cái, chữ số, ký hiệu và khoảng trắng.`,
  hints: [
    'Duy trì một cửa sổ các ký tự không trùng. Khi gặp ký tự đã có trong cửa sổ, phải thu hẹp từ bên trái.',
    'Cần biết vị trí gần nhất của mỗi ký tự để nhảy {{left}} nhanh thay vì bỏ từng ký tự.',
    'Dùng mảng 128 hoặc HashMap lưu chỉ số cuối; {{left = max(left, lastSeen[c] + 1)}} để không lùi cửa sổ.'
  ],
  solution: `### Ý tưởng
Mở rộng cửa sổ bằng con trỏ {{right}}. Nếu ký tự {{s[right]}} đã xuất hiện trong cửa sổ hiện tại, di chuyển {{left}} tới ngay sau vị trí xuất hiện trước đó. Dùng {{lastSeen}} để tra cứu O(1).

Điểm dễ sai: {{left}} phải lấy max với giá trị cũ, vì vị trí lặp có thể nằm trước cửa sổ hiện tại.

~~~java
public int lengthOfLongestSubstring(String s) {
    int[] lastSeen = new int[128];
    Arrays.fill(lastSeen, -1);
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen[c] >= left) {
            left = lastSeen[c] + 1;   // nhảy qua ký tự lặp
        }
        lastSeen[c] = right;
        best = Math.max(best, right - left + 1);
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Mảng 128 chỉ đúng với ASCII. Với Unicode, dùng {{HashMap<Character, Integer>}} hoặc thao tác theo code point.
- Chuỗi rỗng trả về 0; vòng lặp tự nhiên xử lý đúng.
- Có thể dùng {{Set}} và while để thu hẹp — dễ hiểu hơn nhưng có thể O(2n) thao tác; vẫn là O(n).

> Senior tip: Với dữ liệu log, tôi hay gặp biến thể "cửa sổ không có ID lặp trong 5 phút". Cùng một khung sliding window, nhưng cần thêm chiều thời gian và eviction theo timestamp; hãy hỏi rõ trước khi lao vào code.`,
  complexity: 'Time O(n), Space O(1) với ASCII',
  follow: ['Nếu cần trả về cả chuỗi con dài nhất thì sửa thế nào?', 'Nếu cho phép tối đa k ký tự lặp thì sao?']
},
{
  id: 'algo-011',
  title: 'Longest Repeating Character Replacement',
  difficulty: 'medium',
  pattern: 'Sliding Window',
  tags: ['string', 'sliding-window', 'counting'],
  prompt: `Cho chuỗi {{s}} gồm chữ cái in hoa và số nguyên {{k}}. Bạn được đổi tối đa {{k}} ký tự bất kỳ thành ký tự khác. Tìm độ dài chuỗi con dài nhất có thể biến thành toàn một ký tự giống nhau sau khi đổi.

### Ví dụ
~~~text
Input:  s = "ABAB", k = 2
Output: 4
Giải thích: đổi 2 chữ B thành A (hoặc ngược lại).

Input:  s = "AABABBA", k = 1
Output: 4
~~~

### Ràng buộc
- {{1 <= s.length <= 10^5}}
- {{0 <= k <= s.length}}
- {{s}} chỉ gồm chữ cái in hoa.`,
  hints: [
    'Trong một cửa sổ, số ký tự cần đổi bằng độ dài cửa sổ trừ số lần xuất hiện của ký tự nhiều nhất.',
    'Điều kiện cửa sổ hợp lệ: {{windowLength - maxFrequency <= k}}.',
    'Khi cửa sổ không hợp lệ, chỉ cần tăng {{left}} một bước; không cần giảm {{maxFrequency}} ngay, vì ta chỉ quan tâm cửa sổ dài nhất.'
  ],
  solution: `### Ý tưởng
Duy trì cửa sổ và tần số các ký tự. Gọi {{maxCount}} là tần số lớn nhất trong cửa sổ. Số ký tự cần đổi ít nhất là {{windowLength - maxCount}}. Nếu vượt {{k}}, thu hẹp cửa sổ từ trái.

Có một tối ưu kinh điển: không cần giảm {{maxCount}} khi thu hẹp, vì nếu sau này có cửa sổ dài hơn thì {{maxCount}} sẽ được cập nhật lại; giá trị cũ chỉ làm điều kiện khó hơn, không tạo kết quả sai.

~~~java
public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int left = 0, maxCount = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        int idx = s.charAt(right) - 'A';
        count[idx]++;
        maxCount = Math.max(maxCount, count[idx]);
        while (right - left + 1 - maxCount > k) {
            count[s.charAt(left) - 'A']--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Nếu không tự tin với tối ưu {{maxCount}}, có thể tính lại max mỗi lần — O(26n), vẫn chấp nhận được và dễ chứng minh hơn.
- Phải giải thích rõ vì sao không giảm {{maxCount}}: nó chỉ là cận trên, và ta đang tìm max length nên không cần cửa sổ nhỏ hơn kết quả tốt nhất đã thấy.
- Hỏi lại bảng chữ cái có cố định 26 ký tự không; nếu Unicode thì dùng HashMap.

> Senior tip: Đây là bài rất hợp để thể hiện khả năng chứng minh tính đúng đắn thay vì chỉ code. Trong production, biến thể "ít nhất k lần sửa" xuất hiện khi chuẩn hoá dữ liệu người dùng trước khi so khớp.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu thay ký tự tốn chi phí khác nhau thì sao?', 'Nếu phải trả về chuỗi con cụ thể thì làm thế nào?']
},
{
  id: 'algo-012',
  title: 'Minimum Window Substring',
  difficulty: 'hard',
  pattern: 'Sliding Window',
  tags: ['string', 'sliding-window', 'hashmap'],
  prompt: `Cho hai chuỗi {{s}} và {{t}}. Tìm chuỗi con ngắn nhất của {{s}} chứa đầy đủ mọi ký tự của {{t}}, kể cả số lần xuất hiện. Nếu không có, trả về chuỗi rỗng.

### Ví dụ
~~~text
Input:  s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"

Input:  s = "a", t = "a"
Output: "a"

Input:  s = "a", t = "aa"
Output: ""
~~~

### Ràng buộc
- {{1 <= s.length, t.length <= 10^5}}
- {{s}} và {{t}} gồm chữ cái hoa, thường và chữ số.`,
  hints: [
    'Cần một cửa sổ chứa đủ ký tự của {{t}}. Đếm tần số cần thiết của {{t}} trước.',
    'Mở rộng bên phải đến khi đủ, sau đó thu hẹp bên trái để tìm cửa sổ nhỏ nhất.',
    'Dùng biến {{missing}} đếm số ký tự còn thiếu thay vì so sánh hai map mỗi lần — giảm từ O(26) xuống O(1).'
  ],
  solution: `### Ý tưởng
Đếm tần số {{t}} vào mảng {{need}}. Duyệt {{right}} để mở rộng cửa sổ, giảm {{need}} và {{missing}} khi gặp ký tự cần. Khi {{missing == 0}}, cửa sổ hợp lệ: cập nhật đáp án rồi thu hẹp {{left}} cho đến khi không còn đủ.

Lưu ý: {{need[c]}} có thể âm với ký tự không thuộc {{t}}; điều đó bình thường và giúp việc thu hẹp xử lý đúng.

~~~java
public String minWindow(String s, String t) {
    int[] need = new int[128];
    for (int i = 0; i < t.length(); i++) need[t.charAt(i)]++;
    int missing = t.length();
    int left = 0, bestStart = 0, bestLen = Integer.MAX_VALUE;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (need[c] > 0) missing--;
        need[c]--;
        while (missing == 0) {
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestStart = left;
            }
            char d = s.charAt(left++);
            need[d]++;
            if (need[d] > 0) missing++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{while (need[c] == 0)}} hay so sánh map trực tiếp nếu chưa chắc; biến {{missing}} là cách gọn và ít lỗi nhất.
- Xử lý trường hợp {{t}} dài hơn {{s}} hoặc không đủ ký tự: trả về chuỗi rỗng.
- Với Unicode, mảng 128 không đủ; dùng HashMap và cẩn thận với surrogate pair.

> Senior tip: Bài này là bài "kể chuyện" rất tốt: nói rõ mỗi ký tự được thêm và bớt tối đa một lần, nên dù có vòng while bên trong, tổng thời gian vẫn O(n). Đừng để người phỏng vấn nghĩ đó là O(n²).`,
  complexity: 'Time O(n + m), Space O(1) với ASCII',
  follow: ['Nếu cần tìm tất cả cửa sổ ngắn nhất thì sao?', 'Nếu {{t}} rất lớn và chỉ cần kiểm tra tồn tại thì có cách nào nhanh hơn?']
},
{
  id: 'algo-013',
  title: 'Valid Parentheses',
  difficulty: 'easy',
  pattern: 'Stack',
  tags: ['stack', 'string'],
  prompt: `Cho chuỗi {{s}} chỉ gồm các ký tự {{(}}, {{)}}, {{lb}}, {{rb}}, {{lc}}, {{rc}}. Kiểm tra chuỗi có hợp lệ không: mọi ngoặc mở phải đóng đúng loại và đúng thứ tự lồng nhau.

### Ví dụ
~~~text
Input:  s = "()[]{}"
Output: true

Input:  s = "(]"
Output: false

Input:  s = "([)]"
Output: false
~~~

### Ràng buộc
- {{1 <= s.length <= 10^4}}
- {{s}} chỉ gồm các ký tự ngoặc.`,
  hints: [
    'Ngoặc đóng phải khớp với ngoặc mở gần nhất chưa được đóng — cấu trúc LIFO.',
    'Dùng stack; khi gặp ngoặc mở thì push, gặp ngoặc đóng thì pop và so khớp.',
    'Có thể push ngoặc đóng tương ứng khi gặp ngoặc mở, để lúc pop chỉ cần so sánh một ký tự.'
  ],
  solution: `### Ý tưởng
Duyệt chuỗi. Khi gặp ngoặc mở, đẩy ngoặc đóng tương ứng vào stack. Khi gặp ngoặc đóng, stack phải không rỗng và phần tử đầu phải khớp. Cuối cùng stack phải rỗng.

Cách push ngoặc đóng giúp code ngắn và tránh một bảng ánh xạ.

~~~java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(' -> stack.push(')');
            case '[' -> stack.push(']');
            case '{' -> stack.push('}');
            default -> {
                if (stack.isEmpty() || stack.pop() != c) return false;
            }
        }
    }
    return stack.isEmpty();
}
~~~

### Lưu ý khi phỏng vấn
- Chuỗi có độ dài lẻ chắc chắn sai — có thể return sớm để tối ưu.
- Dùng {{ArrayDeque}} thay cho {{Stack}} cũ: nhanh hơn và không bị đồng bộ hoá không cần thiết.
- Nếu gặp ký tự lạ, cần hỏi lại đề: bỏ qua hay coi là không hợp lệ?

> Senior tip: Trong parser cấu hình hoặc kiểm tra JSON fragment, stack ngoặc là bước đầu; nhưng đừng quên rằng ngoặc trong chuỗi (string literal) phải được bỏ qua — đó là câu hỏi follow-up rất hay gặp.`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu cần bỏ qua ngoặc nằm trong string literal thì sửa thế nào?', 'Làm sao trả về vị trí lỗi đầu tiên?']
},
{
  id: 'algo-014',
  title: 'Min Stack',
  difficulty: 'medium',
  pattern: 'Stack',
  tags: ['stack', 'design', 'o-1'],
  prompt: `Thiết kế một stack hỗ trợ {{push}}, {{pop}}, {{top}} và {{getMin}} — tất cả trong O(1). {{getMin}} trả về giá trị nhỏ nhất hiện có trong stack.

### Ví dụ
~~~text
MinStack st = new MinStack();
st.push(-2);
st.push(0);
st.push(-3);
st.getMin(); // -3
st.pop();
st.top();    // 0
st.getMin(); // -2
~~~

### Ràng buộc
- {{-2^31 <= val <= 2^31 - 1}}
- Số thao tác tối đa {{3 * 10^4}}
- {{pop}}, {{top}}, {{getMin}} chỉ gọi khi stack không rỗng.`,
  hints: [
    'Không thể duyệt toàn bộ stack mỗi lần lấy min — cần lưu thông tin min ngay khi push.',
    'Dùng một stack phụ song song lưu giá trị min tại từng thời điểm.',
    'Khi push giá trị bằng min hiện tại, vẫn phải push vào stack min; nếu chỉ lưu min một lần sẽ sai sau khi pop.'
  ],
  solution: `### Ý tưởng
Dùng hai stack: {{data}} chứa giá trị, {{mins}} chứa min tại mỗi độ sâu. Khi push {{x}}, min mới là {{min(x, mins.peek())}}. Khi pop, pop cả hai. Như vậy {{getMin}} chỉ là {{mins.peek()}}.

Cách này O(1) cho mọi thao tác và O(n) bộ nhớ phụ.

~~~java
class MinStack {
    private final Deque<Integer> data = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int val) {
        data.push(val);
        mins.push(mins.isEmpty() ? val : Math.min(val, mins.peek()));
    }

    public void pop() {
        data.pop();
        mins.pop();
    }

    public int top() {
        return data.peek();
    }

    public int getMin() {
        return mins.peek();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Có thể tối ưu bộ nhớ bằng cách chỉ push vào {{mins}} khi giá trị nhỏ hơn hoặc bằng min hiện tại, nhưng khi đó mỗi phần tử cần lưu thêm số lần lặp hoặc dùng cặp giá trị.
- Lưu ý trường hợp giá trị trùng nhau: nếu chỉ lưu min một lần, sau khi pop một giá trị trùng, min sẽ bị mất.
- Hỏi thêm: có cần thread-safe không? Nếu có, phải đồng bộ hoặc dùng cấu trúc khoá riêng.

> Senior tip: Trong phỏng vấn senior, tôi hay hỏi tiếp "nếu stack có hàng triệu phần tử và 99% là số dương tăng dần thì tối ưu bộ nhớ thế nào?". Câu trả lời tốt là dùng kỹ thuật lưu delta hoặc chỉ lưu min khi thay đổi, kèm giải thích đánh đổi.`,
  complexity: 'Time O(1) mỗi thao tác, Space O(n)',
  follow: ['Tối ưu bộ nhớ của stack min thế nào?', 'Nếu cần hỗ trợ cả getMax thì sao?']
},
{
  id: 'algo-015',
  title: 'Daily Temperatures',
  difficulty: 'medium',
  pattern: 'Stack',
  tags: ['array', 'monotonic-stack'],
  prompt: `Cho mảng {{temperatures}} là nhiệt độ từng ngày. Với mỗi ngày, cho biết cần chờ bao nhiêu ngày để có ngày ấm hơn; nếu không có, ghi 0.

### Ví dụ
~~~text
Input:  temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]
~~~

### Ràng buộc
- {{1 <= temperatures.length <= 10^5}}
- {{30 <= temperatures[i] <= 100}}`,
  hints: [
    'Với mỗi ngày, ta cần ngày gần nhất bên phải có nhiệt độ lớn hơn. Đây là bài toán "next greater element".',
    'Dùng stack lưu chỉ số của các ngày chưa tìm được ngày ấm hơn, giữ nhiệt độ giảm dần.',
    'Khi gặp nhiệt độ cao hơn đỉnh stack, pop và ghi khoảng cách chỉ số; lặp đến khi đỉnh lớn hơn hoặc bằng.'
  ],
  solution: `### Ý tưởng
Duy trì stack monotonic giảm: các chỉ số trong stack có nhiệt độ giảm dần từ đáy lên đỉnh. Khi gặp ngày {{i}} ấm hơn đỉnh, đó chính là ngày ấm hơn gần nhất của đỉnh; ghi {{i - j}} và pop.

Mỗi chỉ số được push và pop tối đa một lần, nên tổng thời gian O(n).

~~~java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] answer = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();   // chỉ số, nhiệt độ giảm dần
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int j = stack.pop();
            answer[j] = i - j;
        }
        stack.push(i);
    }
    return answer;
}
~~~

### Lưu ý khi phỏng vấn
- Dùng dấu {{>}} hay {{>=}}? Với yêu cầu "ấm hơn" (strictly greater), dùng {{>}}; nếu "ấm hơn hoặc bằng" thì đổi điều kiện.
- Stack lưu chỉ số, không lưu nhiệt độ, vì cần tính khoảng cách ngày.
- Có thể duyệt từ phải sang trái với next greater; hãy chọn một hướng và giải thích nhất quán.

> Senior tip: Monotonic stack là pattern xuất hiện rất nhiều trong bài toán tài chính (thời điểm giá vượt đỉnh cũ) và observability (thời điểm latency vượt ngưỡng). Hãy nhớ bất biến của stack thay vì học thuộc code.`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu cần tìm ngày ấm hơn gần nhất cả hai phía thì sao?', 'Nếu mảng được cập nhật streaming thì cấu trúc dữ liệu nào phù hợp?']
},
{
  id: 'algo-016',
  title: 'Largest Rectangle in Histogram',
  difficulty: 'hard',
  pattern: 'Stack',
  tags: ['array', 'monotonic-stack'],
  prompt: `Cho mảng {{heights}} biểu diễn chiều cao các cột có chiều rộng 1. Tìm diện tích hình chữ nhật lớn nhất nằm hoàn toàn bên trong biểu đồ cột.

### Ví dụ
~~~text
Input:  heights = [2,1,5,6,2,3]
Output: 10
Giải thích: chọn các cột 5 và 6, chiều cao 5, rộng 2.

Input:  heights = [2,4]
Output: 4
~~~

### Ràng buộc
- {{1 <= heights.length <= 10^5}}
- {{0 <= heights[i] <= 10^4}}`,
  hints: [
    'Với mỗi cột, nếu biết cột thấp hơn gần nhất bên trái và bên phải, ta tính được chiều rộng tối đa của hình chữ nhật có chiều cao bằng cột đó.',
    'Dùng stack monotonic tăng để tìm biên gần nhất thấp hơn ở cả hai phía trong một lượt.',
    'Thêm một cột sentinel cao 0 ở cuối để đảm bảo mọi cột còn lại trong stack đều được pop và xử lý.'
  ],
  solution: `### Ý tưởng
Duy trì stack các chỉ số có chiều cao tăng dần. Khi gặp cột {{i}} thấp hơn đỉnh stack, cột đỉnh không thể mở rộng sang phải nữa. Pop nó, chiều rộng là từ chỉ số ngay sau đỉnh mới đến {{i - 1}}.

Dùng sentinel {{i == n}} với chiều cao 0 để xử lý phần còn lại sau vòng lặp.

~~~java
public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    Deque<Integer> stack = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : heights[i];   // sentinel
        while (!stack.isEmpty() && heights[stack.peek()] > cur) {
            int h = heights[stack.pop()];
            int left = stack.isEmpty() ? 0 : stack.peek() + 1;
            best = Math.max(best, h * (i - left));
        }
        if (i < n) stack.push(i);
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Khi có chiều cao bằng nhau, dùng {{>}} giữ cột bên trái lại và vẫn tính đúng chiều rộng; nếu dùng {{>=}} cũng được nhưng phải giải thích.
- Diện tích có thể vượt {{int}} nếu chiều cao và chiều dài lớn; cân nhắc {{long}}.
- Đừng quên cột có chiều cao 0 — chúng vẫn là biên hợp lệ.

> Senior tip: Bài này thường xuất hiện dưới dạng "largest rectangle in binary matrix". Khi đó mỗi hàng là một histogram và bạn cộng dồn chiều cao theo cột; pattern stack giữ nguyên, chỉ thêm một vòng lặp ngoài.`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Mở rộng sang ma trận nhị phân tìm hình chữ nhật lớn nhất.', 'Nếu cần trả về toạ độ hình chữ nhật thì sửa thế nào?']
}
);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-017',
  title: 'Binary Search',
  difficulty: 'easy',
  pattern: 'Binary Search',
  tags: ['array', 'binary-search'],
  prompt: `Cho mảng {{nums}} đã sắp xếp tăng dần và số {{target}}. Trả về chỉ số của {{target}} trong mảng, hoặc -1 nếu không có. Yêu cầu độ phức tạp O(log n).

### Ví dụ
~~~text
Input:  nums = [-1,0,3,5,9,12], target = 9
Output: 4

Input:  nums = [-1,0,3,5,9,12], target = 2
Output: -1
~~~

### Ràng buộc
- {{1 <= nums.length <= 10^4}}
- {{-10^4 < nums[i], target < 10^4}}
- Mọi phần tử trong {{nums}} là duy nhất.`,
  hints: [
    'Mỗi lần so sánh với phần tử giữa, một nửa mảng chắc chắn không chứa target.',
    'Dùng khoảng đóng {{[lo, hi]}} và điều kiện {{while (lo <= hi)}} để không bỏ sót phần tử biên.',
    'Tính mid bằng {{lo + (hi - lo) / 2}} để tránh tràn số khi chỉ số lớn.'
  ],
  solution: `### Ý tưởng
Duy trì khoảng tìm kiếm {{[lo, hi]}}. So sánh {{nums[mid]}} với target: nếu nhỏ hơn, target nằm bên phải; nếu lớn hơn, nằm bên trái; nếu bằng, trả về ngay.

Chọn một quy ước khoảng rõ ràng và giữ nhất quán. Ở đây dùng khoảng đóng nên {{lo = mid + 1}} và {{hi = mid - 1}}.

~~~java
public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return -1;
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{(lo + hi) / 2}} với mảng cực lớn vì có thể tràn {{int}}.
- Nếu dùng khoảng nửa mở {{[lo, hi)}}, điều kiện là {{lo < hi}} và cập nhật {{hi = mid}}; đừng trộn hai quy ước.
- Hỏi lại mảng có phần tử trùng không; nếu có, bài toán có thể cần tìm biên trái/phải.

> Senior tip: Binary search là nơi lỗi off-by-one xuất hiện nhiều nhất trong phỏng vấn. Tôi luôn yêu cầu ứng viên viết ra bất biến "target nằm trong [lo, hi] nếu tồn tại" và kiểm tra với mảng 1 phần tử, 2 phần tử trước khi kết luận.`,
  complexity: 'Time O(log n), Space O(1)',
  follow: ['Tìm vị trí chèn (lower bound) thì sửa thế nào?', 'Nếu có phần tử trùng, làm sao tìm biên trái và biên phải?']
},
{
  id: 'algo-018',
  title: 'Search in Rotated Sorted Array',
  difficulty: 'medium',
  pattern: 'Binary Search',
  tags: ['array', 'binary-search'],
  prompt: `Mảng {{nums}} ban đầu tăng dần và không có phần tử trùng, sau đó bị xoay tại một vị trí bất kỳ. Cho {{target}}, trả về chỉ số của nó hoặc -1 nếu không có. Yêu cầu O(log n).

### Ví dụ
~~~text
Input:  nums = [4,5,6,7,0,1,2], target = 0
Output: 4

Input:  nums = [4,5,6,7,0,1,2], target = 3
Output: -1
~~~

### Ràng buộc
- {{1 <= nums.length <= 5000}}
- {{-10^4 <= nums[i], target <= 10^4}}
- Các phần tử là duy nhất.`,
  hints: [
    'Dù bị xoay, tại mỗi bước luôn có ít nhất một nửa mảng đang sắp xếp tăng dần.',
    'So sánh {{nums[lo]}} với {{nums[mid]}} để xác định nửa nào đang sorted.',
    'Nếu target nằm trong nửa sorted đó thì tìm ở đó, ngược lại tìm ở nửa còn lại.'
  ],
  solution: `### Ý tưởng
Vẫn dùng binary search. Tại mỗi vòng, xác định nửa trái hay nửa phải đang sorted:

- Nếu {{nums[lo] <= nums[mid]}}: nửa trái sorted. Kiểm tra target có nằm trong {{[nums[lo], nums[mid])}} không.
- Ngược lại: nửa phải sorted. Kiểm tra target có nằm trong {{(nums[mid], nums[hi]]}} không.

Nhờ vậy mỗi bước loại được một nửa, giữ O(log n).

~~~java
public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {              // nửa trái sorted
            if (target >= nums[lo] && target < nums[mid]) {
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        } else {                                   // nửa phải sorted
            if (target > nums[mid] && target <= nums[hi]) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
    }
    return -1;
}
~~~

### Lưu ý khi phỏng vấn
- Phải dùng {{<=}} ở điều kiện {{nums[lo] <= nums[mid]}} để xử lý mảng chỉ còn 1-2 phần tử.
- Nếu mảng có phần tử trùng, việc xác định nửa sorted có thể nhập nhằng; worst case O(n), cần nêu rõ.
- Kiểm tra nhanh với mảng không xoay, xoay 1 phần tử, target ở hai đầu.

> Senior tip: Bài này kiểm tra khả năng giữ bất biến khi điều kiện phức tạp. Trong thực tế, dữ liệu "sorted rồi append" rất hay gặp (log theo thời gian, ring buffer); hiểu bài này giúp bạn chọn đúng cấu trúc thay vì tìm kiếm tuyến tính.`,
  complexity: 'Time O(log n), Space O(1)',
  follow: ['Nếu mảng có phần tử trùng thì độ phức tạp thay đổi thế nào?', 'Tìm phần tử nhỏ nhất trong mảng xoay thì làm sao?']
},
{
  id: 'algo-019',
  title: 'Koko Eating Bananas',
  difficulty: 'medium',
  pattern: 'Binary Search',
  tags: ['array', 'binary-search', 'greedy'],
  prompt: `Có {{n}} đống chuối với số lượng {{piles[i]}}. Mỗi giờ, Koko chọn một đống và ăn tối đa {{k}} quả từ đống đó; nếu đống còn ít hơn {{k}} thì ăn hết và không ăn thêm đống khác trong giờ đó. Cần tìm tốc độ ăn {{k}} nhỏ nhất để ăn hết trong {{h}} giờ.

### Ví dụ
~~~text
Input:  piles = [3,6,7,11], h = 8
Output: 4

Input:  piles = [30,11,23,4,20], h = 5
Output: 30
~~~

### Ràng buộc
- {{1 <= piles.length <= 10^4}}
- {{piles.length <= h <= 10^9}}
- {{1 <= piles[i] <= 10^9}}`,
  hints: [
    'Nếu ăn với tốc độ {{k}} mà kịp thì tốc độ lớn hơn cũng kịp. Tính đơn điệu này cho phép binary search trên {{k}}.',
    'Cận dưới là 1, cận trên là đống lớn nhất (ăn mỗi đống trong 1 giờ).',
    'Hàm kiểm tra: tổng {{ceil(pile / k)}} trên các đống phải <= h. Dùng phép chia nguyên {{(pile + k - 1) / k}}.'
  ],
  solution: `### Ý tưởng
Binary search trên giá trị {{k}}, không phải trên chỉ số. Với mỗi {{k}}, tính số giờ cần thiết. Nếu <= h, thử {{k}} nhỏ hơn; ngược lại tăng {{k}}.

Đây là dạng "binary search on answer": miền kết quả đơn điệu, mỗi lần kiểm tra tốn O(n).

~~~java
public int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canFinish(piles, mid, h)) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    return lo;
}

private boolean canFinish(int[] piles, int speed, int h) {
    long hours = 0;
    for (int p : piles) {
        hours += (p + (long) speed - 1) / speed;   // ceil(p / speed)
        if (hours > h) return false;
    }
    return true;
}
~~~

### Lưu ý khi phỏng vấn
- Tổng số giờ có thể vượt {{int}}; dùng {{long}} và thoát sớm khi đã lớn hơn {{h}}.
- Biên {{lo < hi}} với cập nhật {{hi = mid}} là chuẩn cho "tìm min thoả mãn"; đừng dùng {{lo <= hi}} dễ lặp vô hạn.
- Hỏi lại: có được bỏ dở giờ khi ăn hết đống không? Đề chuẩn là mỗi giờ chỉ ăn một đống, phần dư không chuyển sang đống khác.

> Senior tip: Dạng binary search on answer rất hữu ích cho tuning: tìm batch size nhỏ nhất đạt throughput, tìm timeout nhỏ nhất mà error rate vẫn ổn. Điều kiện tiên quyết luôn là tính đơn điệu — hãy chứng minh trước khi code.`,
  complexity: 'Time O(n log maxPile), Space O(1)',
  follow: ['Nếu mỗi giờ được ăn nhiều đống thì bài toán thay đổi thế nào?', 'Làm sao tìm tốc độ nhỏ nhất và cả danh sách tốc độ tối ưu?']
},
{
  id: 'algo-020',
  title: 'Reverse Linked List',
  difficulty: 'easy',
  pattern: 'Linked List',
  tags: ['linked-list', 'pointer'],
  prompt: `Cho đầu của một singly linked list, đảo ngược danh sách và trả về đầu mới. Không được tạo danh sách mới với giá trị copy; phải thay đổi liên kết giữa các node.

### Ví dụ
~~~text
Input:  1 -> 2 -> 3 -> 4 -> 5
Output: 5 -> 4 -> 3 -> 2 -> 1
~~~

### Ràng buộc
- {{0 <= số node <= 5000}}
- {{-5000 <= Node.val <= 5000}}`,
  hints: [
    'Cần đổi hướng từng cạnh {{next}}. Nhưng nếu đổi ngay, bạn sẽ mất phần còn lại của danh sách.',
    'Dùng ba con trỏ: {{prev}}, {{cur}}, {{next}}; lưu {{next}} trước khi đổi {{cur.next}}.',
    'Sau khi duyệt hết, {{prev}} chính là đầu mới; {{cur}} là null.'
  ],
  solution: `### Ý tưởng
Duyệt danh sách một lượt. Ở mỗi node, lưu node kế tiếp, trỏ {{cur.next}} về {{prev}}, rồi tiến cả hai con trỏ. Khi kết thúc, {{prev}} là đầu mới.

Đây là thao tác tại chỗ, không cấp phát node mới.

~~~java
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;   // giữ phần còn lại
        cur.next = prev;            // đảo cạnh
        prev = cur;
        cur = next;
    }
    return prev;
}
~~~

### Lưu ý khi phỏng vấn
- Danh sách rỗng trả về null; danh sách một node trả về chính nó — vòng lặp xử lý đúng.
- Nếu được hỏi đệ quy, code ngắn hơn nhưng tốn O(n) stack, có thể tràn với danh sách rất dài.
- Hỏi lại: có được phép đổi giá trị thay vì liên kết không? Thường đề yêu cầu đổi liên kết để thể hiện hiểu con trỏ.

> Senior tip: Trong code production, reverse linked list xuất hiện khi đảo chiều lịch sử sự kiện hoặc xử lý đệ quy ngược. Nhưng với danh sách rất lớn, hãy cân nhắc mảng hoặc cấu trúc có truy cập ngẫu nhiên thay vì linked list vì cache locality kém.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Đảo ngược đoạn từ vị trí m đến n thì làm thế nào?', 'Kiểm tra palindrome trên linked list ra sao?']
},
{
  id: 'algo-021',
  title: 'Merge Two Sorted Lists',
  difficulty: 'easy',
  pattern: 'Linked List',
  tags: ['linked-list', 'merge', 'two-pointers'],
  prompt: `Cho hai singly linked list đã sắp xếp tăng dần. Hợp nhất chúng thành một danh sách mới cũng sắp xếp, bằng cách nối các node hiện có (không tạo node giá trị mới). Trả về đầu danh sách kết quả.

### Ví dụ
~~~text
Input:  l1 = 1 -> 2 -> 4, l2 = 1 -> 3 -> 4
Output: 1 -> 1 -> 2 -> 3 -> 4 -> 4

Input:  l1 = null, l2 = 0
Output: 0
~~~

### Ràng buộc
- {{0 <= số node mỗi danh sách <= 50}}
- {{-100 <= Node.val <= 100}}
- Cả hai danh sách đã sắp xếp tăng dần.`,
  hints: [
    'Giống bước merge trong merge sort: so sánh hai đầu danh sách và lấy node nhỏ hơn.',
    'Dùng node giả (dummy) để tránh phải xử lý đặc biệt cho phần tử đầu tiên.',
    'Sau khi một danh sách hết, nối nguyên phần còn lại của danh sách kia — không cần copy.'
  ],
  solution: `### Ý tưởng
Tạo {{dummy}} và con trỏ {{tail}}. Mỗi bước so sánh {{l1.val}} và {{l2.val}}, nối node nhỏ hơn vào sau {{tail}}, rồi tiến con trỏ tương ứng. Khi một bên hết, nối phần còn lại của bên kia.

~~~java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            tail.next = l1;
            l1 = l1.next;
        } else {
            tail.next = l2;
            l2 = l2.next;
        }
        tail = tail.next;
    }
    tail.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{<=}} để giữ tính ổn định (stable) khi giá trị bằng nhau — quan trọng nếu node còn dữ liệu phụ.
- Không cần duyệt phần còn lại; nối con trỏ là đủ, tiết kiệm O(n).
- Hỏi lại danh sách có được phép sửa tại chỗ không; đề chuẩn cho phép nối node.

> Senior tip: Merge hai danh sách sorted là nền tảng của external merge sort. Khi merge các file log đã sort, cùng logic này áp dụng với iterator/buffer thay vì node, nhưng nguyên tắc "lấy nhỏ hơn, nối phần còn lại" không đổi.`,
  complexity: 'Time O(m + n), Space O(1)',
  follow: ['Merge k danh sách sorted thì tối ưu thế nào?', 'Nếu danh sách rất dài và không vừa RAM thì sao?']
},
{
  id: 'algo-022',
  title: 'LRU Cache',
  difficulty: 'medium',
  pattern: 'Linked List',
  tags: ['design', 'hashmap', 'doubly-linked-list'],
  prompt: `Thiết kế cấu trúc LRU (Least Recently Used) với sức chứa {{capacity}}. Hỗ trợ {{get(key)}} và {{put(key, value)}} trong O(1). Khi vượt sức chứa, loại bỏ key ít được dùng gần đây nhất. {{get}} cũng được coi là "sử dụng" và phải cập nhật thứ tự.

### Ví dụ
~~~text
LRUCache cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);    // 1
cache.put(3, 3); // loại bỏ key 2
cache.get(2);    // -1
cache.put(4, 4); // loại bỏ key 1
cache.get(1);    // -1
cache.get(3);    // 3
~~~

### Ràng buộc
- {{1 <= capacity <= 3000}}
- {{0 <= key, value <= 10^4}}
- Tối đa {{2 * 10^5}} thao tác.`,
  hints: [
    'Cần tra cứu O(1) theo key: dùng HashMap. Cần biết thứ tự sử dụng: dùng danh sách liên kết.',
    'HashMap lưu key -> node; node nằm trong doubly linked list để xoá và chèn O(1).',
    'Dùng hai node sentinel head/tail để tránh xử lý null ở hai đầu danh sách.'
  ],
  solution: `### Ý tưởng
Kết hợp {{HashMap}} và doubly linked list. Node gần đầu là mới dùng nhất, node gần cuối là cũ nhất. Mỗi lần {{get}} hoặc {{put}} trúng key, đưa node lên đầu. Khi vượt sức chứa, xoá node cuối và key tương ứng khỏi map.

~~~java
class LRUCache {
    private static final class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private final Map<Integer, Node> map = new HashMap<>();
    private final int capacity;
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        unlink(n);
        addFirst(n);
        return n.val;
    }

    public void put(int key, int val) {
        Node n = map.get(key);
        if (n != null) {
            n.val = val;
            unlink(n);
            addFirst(n);
            return;
        }
        if (map.size() == capacity) {
            Node lru = tail.prev;
            map.remove(lru.key);
            unlink(lru);
        }
        n = new Node(key, val);
        map.put(key, n);
        addFirst(n);
    }

    private void unlink(Node n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }

    private void addFirst(Node n) {
        n.next = head.next;
        n.prev = head;
        head.next.prev = n;
        head.next = n;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{get}} cũng làm mới thứ tự — đây là điểm nhiều ứng viên bỏ sót.
- {{put}} với key đã tồn tại phải cập nhật value, không được tăng kích thước.
- Có thể dùng {{LinkedHashMap}} với {{accessOrder = true}} và {{removeEldestEntry}}, ngắn hơn nhưng ít thể hiện hiểu biết cấu trúc; hãy nêu cả hai.
- Nếu cần thread-safe, phải thêm khoá; LRU đơn giản không an toàn đa luồng.

> Senior tip: Trong hệ thống cache thật, LRU thuần có thể bị "cache pollution" bởi quét tuần tự. Các biến thể như LRU-K, ARC hoặc TinyLFU (Caffeine) thường tốt hơn. Khi phỏng vấn, nêu trade-off này sẽ ghi điểm.`,
  complexity: 'Time O(1) mỗi thao tác, Space O(capacity)',
  follow: ['Làm sao làm LRU thread-safe?', 'Khi nào nên dùng LFU thay vì LRU?']
},
{
  id: 'algo-023',
  title: 'Merge K Sorted Lists',
  difficulty: 'hard',
  pattern: 'Linked List',
  tags: ['linked-list', 'heap', 'divide-and-conquer'],
  prompt: `Cho mảng {{lists}} gồm {{k}} singly linked list đã sắp xếp tăng dần. Hợp nhất tất cả thành một danh sách sắp xếp và trả về đầu danh sách. Không được tạo bản sao giá trị.

### Ví dụ
~~~text
Input:  lists = [[1,4,5], [1,3,4], [2,6]]
Output: 1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6

Input:  lists = []
Output: []
~~~

### Ràng buộc
- {{0 <= k <= 10^4}}
- {{0 <= tổng số node <= 10^4}}
- {{-10^4 <= Node.val <= 10^4}}`,
  hints: [
    'Nếu merge tuần tự từng danh sách, mỗi lần phải duyệt lại phần đã merge — chậm.',
    'Cần cấu trúc luôn lấy được node nhỏ nhất trong {{k}} đầu danh sách: min-heap (PriorityQueue).',
    'Sau khi lấy một node, đẩy node kế tiếp của danh sách đó vào heap; dùng dummy để nối kết quả.'
  ],
  solution: `### Ý tưởng
Đưa tất cả head khác null vào {{PriorityQueue}} theo giá trị. Lần lượt pop node nhỏ nhất, nối vào kết quả, rồi đẩy {{node.next}} vào heap nếu có.

Mỗi node được push/pop đúng một lần, mỗi thao tác heap O(log k), nên tổng O(N log k) với N là tổng số node.

~~~java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq =
        new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
    for (ListNode node : lists) {
        if (node != null) pq.add(node);
    }
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();
        tail.next = node;
        tail = node;
        if (node.next != null) pq.add(node.next);
    }
    return dummy.next;
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{a.val - b.val}} làm comparator vì có thể tràn số với giá trị lớn; dùng {{Integer.compare}}.
- Nếu {{k}} lớn và danh sách ngắn, divide-and-conquer merge từng cặp cũng O(N log k) và ít bộ nhớ heap hơn.
- Hỏi lại danh sách có thể rỗng; xử lý null từng phần tử trước khi add.

> Senior tip: Với external merge (file lớn hơn RAM), bạn không thể giữ tất cả head trong heap nếu số file quá lớn; khi đó dùng multi-pass merge với fan-in giới hạn, ví dụ 64 file mỗi lượt. Đây là câu follow-up rất thực tế.`,
  complexity: 'Time O(N log k), Space O(k)',
  follow: ['So sánh heap và divide-and-conquer khi k rất lớn.', 'Nếu tổng dữ liệu lớn hơn RAM thì thiết kế thế nào?']
}
);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-024',
  title: 'Maximum Depth of Binary Tree',
  difficulty: 'easy',
  pattern: 'Tree',
  tags: ['tree', 'dfs', 'recursion'],
  prompt: `Cho gốc của một binary tree, trả về độ sâu lớn nhất — số node trên đường đi dài nhất từ gốc tới lá. Tree rỗng có độ sâu 0.

### Ví dụ
~~~text
Input:  root = [3,9,20,null,null,15,7]
Output: 3

Input:  root = []
Output: 0
~~~

### Ràng buộc
- {{0 <= số node <= 10^4}}
- {{-100 <= Node.val <= 100}}`,
  hints: [
    'Độ sâu của một cây bằng 1 cộng với độ sâu lớn hơn của hai cây con.',
    'Đây là định nghĩa đệ quy tự nhiên; base case là node null.',
    'Nếu lo ngại stack overflow với cây lệch, có thể dùng BFS theo tầng.'
  ],
  solution: `### Ý tưởng
Đệ quy: cây rỗng có độ sâu 0; ngược lại lấy 1 + max(độ sâu trái, độ sâu phải). Mỗi node được thăm đúng một lần.

~~~java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
~~~

### Lưu ý khi phỏng vấn
- Với cây lệch hoàn toàn (giống linked list) và hàng trăm nghìn node, đệ quy có thể tràn stack; BFS hoặc đệ quy có kiểm soát sẽ an toàn hơn.
- Hỏi lại "độ sâu" được tính theo node hay theo cạnh — hai cách chênh nhau 1.
- Cây rỗng trả 0, không phải 1.

> Senior tip: Trong production, độ sâu cây thường dùng để đánh giá rủi ro stack khi serialize/deserialize JSON lồng nhau. Với dữ liệu không kiểm soát, luôn đặt giới hạn độ sâu thay vì tin vào đệ quy vô hạn.`,
  complexity: 'Time O(n), Space O(h)',
  follow: ['Tính độ sâu bằng BFS thì làm thế nào?', 'Kiểm tra cây cân bằng thì cần thêm gì?']
},
{
  id: 'algo-025',
  title: 'Invert Binary Tree',
  difficulty: 'easy',
  pattern: 'Tree',
  tags: ['tree', 'dfs', 'recursion'],
  prompt: `Cho gốc của một binary tree, đảo ngược cây sao cho mọi node hoán đổi cây con trái và phải. Trả về gốc sau khi đảo.

### Ví dụ
~~~text
Input:       4
           /   \\
          2     7
         / \\   / \\
        1   3 6   9

Output:      4
           /   \\
          7     2
         / \\   / \\
        9   6 3   1
~~~

### Ràng buộc
- {{0 <= số node <= 100}}
- {{-100 <= Node.val <= 100}}`,
  hints: [
    'Tại mỗi node, chỉ cần hoán đổi con trỏ trái và phải.',
    'Sau khi hoán đổi, tiếp tục đảo hai cây con — thứ tự đảo trước hay sau đều được.',
    'Base case là node null; trả về null.'
  ],
  solution: `### Ý tưởng
Duyệt cây và tại mỗi node hoán đổi {{left}} với {{right}}. Có thể làm đệ quy (DFS) hoặc BFS với queue. Đệ quy ngắn gọn và tự nhiên nhất.

~~~java
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode tmp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(tmp);
    return root;
}
~~~

### Lưu ý khi phỏng vấn
- Phải lưu con trỏ tạm trước khi gán, nếu không sẽ mất một nhánh.
- Có thể hoán đổi trước rồi đệ quy hai con; kết quả như nhau.
- Với cây rất sâu, dùng BFS để tránh đệ quy sâu.

> Senior tip: Bài này đơn giản nhưng hay được dùng để kiểm tra ứng viên có thực sự hiểu con trỏ hay chỉ nhớ code. Hãy vẽ từng bước với cây 3 node và nói rõ thời điểm hoán đổi.`,
  complexity: 'Time O(n), Space O(h)',
  follow: ['Đảo cây bằng BFS thì viết thế nào?', 'Kiểm tra hai cây có phải ảnh gương của nhau ra sao?']
},
{
  id: 'algo-026',
  title: 'Binary Tree Level Order Traversal',
  difficulty: 'medium',
  pattern: 'Tree',
  tags: ['tree', 'bfs', 'queue'],
  prompt: `Cho gốc của một binary tree, trả về giá trị các node theo từng tầng, từ trên xuống, mỗi tầng là một danh sách riêng.

### Ví dụ
~~~text
Input:  root = [3,9,20,null,null,15,7]
Output: [[3], [9,20], [15,7]]
~~~

### Ràng buộc
- {{0 <= số node <= 2000}}
- {{-1000 <= Node.val <= 1000}}`,
  hints: [
    'Duyệt theo tầng là bài toán BFS kinh điển với queue.',
    'Cần tách từng tầng: ghi lại {{size = queue.size()}} trước khi xử lý tầng đó.',
    'Chỉ đưa con khác null vào queue; nếu đưa null sẽ phải xử lý đặc biệt.'
  ],
  solution: `### Ý tưởng
Dùng queue khởi tạo với root. Mỗi vòng lặp, lấy kích thước hiện tại của queue — đó chính là số node của tầng đang xét. Xử lý đúng {{size}} node, thêm con của chúng vào queue cho tầng sau.

~~~java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.add(node.left);
            if (node.right != null) queue.add(node.right);
        }
        result.add(level);
    }
    return result;
}
~~~

### Lưu ý khi phỏng vấn
- Nếu quên lấy {{size}} trước vòng for, bạn sẽ trộn các tầng với nhau.
- Có thể dùng {{List}} làm queue với chỉ số head để tránh cấp phát; nhưng {{ArrayDeque}} là lựa chọn chuẩn.
- Hỏi thêm: duyệt từ dưới lên (bottom-up) chỉ cần đảo kết quả hoặc thêm vào đầu danh sách.

> Senior tip: BFS theo tầng là nền tảng cho nhiều bài thực tế: lan truyền trạng thái trong graph, tính khoảng cách ngắn nhất không trọng số, hoặc render cây tổ chức theo cấp. Nhớ rằng BFS cần bộ nhớ O(width), có thể lớn hơn DFS O(height) rất nhiều.`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Duyệt zigzag theo tầng thì sửa thế nào?', 'Tính độ rộng lớn nhất của cây thì làm sao?']
},
{
  id: 'algo-027',
  title: 'Lowest Common Ancestor of a Binary Tree',
  difficulty: 'medium',
  pattern: 'Tree',
  tags: ['tree', 'dfs', 'lca'],
  prompt: `Cho gốc của một binary tree và hai node {{p}}, {{q}} (hai node này chắc chắn tồn tại trong cây). Tìm node tổ tiên chung gần nhất (Lowest Common Ancestor) của {{p}} và {{q}}. Một node cũng được coi là tổ tiên của chính nó.

### Ví dụ
~~~text
Input:  root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
Output: 3

Input:  root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
Output: 5
~~~

### Ràng buộc
- {{2 <= số node <= 10^5}}
- {{-10^9 <= Node.val <= 10^9}}
- Các giá trị node là duy nhất.`,
  hints: [
    'Nếu tìm thấy p hoặc q ở một nhánh, nhánh đó có thể chứa tổ tiên chung.',
    'Nếu p và q nằm ở hai nhánh khác nhau của một node, node đó chính là LCA.',
    'Dùng DFS trả về node tìm thấy; nếu cả hai nhánh đều trả về khác null thì node hiện tại là LCA.'
  ],
  solution: `### Ý tưởng
DFS từ gốc. Nếu node hiện tại là null, p hoặc q thì trả về node đó. Đệ quy hai nhánh. Nếu cả hai nhánh đều trả về node khác null, p và q nằm hai bên nên node hiện tại là LCA. Nếu chỉ một nhánh có kết quả, trả về kết quả đó.

~~~java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;
    return (left != null) ? left : right;
}
~~~

### Lưu ý khi phỏng vấn
- Cách này giả định cả p và q đều tồn tại. Nếu có thể thiếu node, cần thêm bước đếm hoặc kiểm tra sau khi tìm.
- Có thể dùng parent map + set để tìm LCA theo hướng bottom-up; O(n) bộ nhớ nhưng dễ hiểu.
- Với BST, có thể tận dụng thứ tự để tìm O(h) mà không cần đệ quy hai nhánh.

> Senior tip: LCA xuất hiện trong bài toán quyền truy cập theo cây tổ chức, hoặc tìm phạm vi chung của hai prefix trong trie. Hãy nắm cả biến thể BST để trả lời follow-up nhanh.`,
  complexity: 'Time O(n), Space O(h)',
  follow: ['Nếu là BST thì tối ưu thế nào?', 'Nếu p hoặc q có thể không tồn tại thì xử lý ra sao?']
},
{
  id: 'algo-028',
  title: 'Number of Islands',
  difficulty: 'medium',
  pattern: 'Graph',
  tags: ['graph', 'dfs', 'bfs', 'grid'],
  prompt: `Cho lưới {{grid}} kích thước {{m x n}} gồm ký tự {{1}} (đất) và {{0}} (nước). Đảo là nhóm các ô đất nối nhau theo 4 hướng (trên, dưới, trái, phải). Đếm số đảo.

### Ví dụ
~~~text
Input:
11110
11010
11000
00000
Output: 1

Input:
11000
11000
00100
00011
Output: 3
~~~

### Ràng buộc
- {{1 <= m, n <= 300}}
- {{grid[i][j]}} là {{0}} hoặc {{1}}.`,
  hints: [
    'Mỗi lần gặp ô đất chưa thăm, đó là một đảo mới.',
    'Từ ô đó, lan sang mọi ô đất kề cạnh để đánh dấu toàn bộ đảo.',
    'Có thể sửa trực tiếp grid từ 1 thành 0 để dùng làm visited, hoặc dùng mảng visited riêng.'
  ],
  solution: `### Ý tưởng
Duyệt từng ô. Khi gặp {{1}}, tăng biến đếm và gọi DFS để "chìm" toàn bộ đảo bằng cách đổi các ô đã thăm thành {{0}}. Nhờ vậy mỗi ô chỉ được xử lý một lần.

~~~java
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                count++;
                sink(grid, i, j);
            }
        }
    }
    return count;
}

private void sink(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (grid[i][j] != '1') return;
    grid[i][j] = '0';   // đánh dấu đã thăm
    sink(grid, i + 1, j);
    sink(grid, i - 1, j);
    sink(grid, i, j + 1);
    sink(grid, i, j - 1);
}
~~~

### Lưu ý khi phỏng vấn
- DFS đệ quy có thể sâu tới {{m*n}} (90.000 với 300x300), gần chạm giới hạn stack; BFS hoặc DFS lặp an toàn hơn.
- Nếu không được sửa input, dùng mảng {{boolean[][] visited}}.
- Hỏi lại: 4 hướng hay 8 hướng? Đề chuẩn dùng 4 hướng.
- Với lưới cực lớn, Union-Find cũng là lựa chọn tốt, đặc biệt khi dữ liệu đến dần.

> Senior tip: Bài này là ví dụ rõ nhất cho việc "visited chính là input đã bị biến đổi". Trong phỏng vấn, hãy nói rõ bạn đang sửa input và hỏi xem có được phép không — đó là chi tiết đánh giá sự cẩn thận.`,
  complexity: 'Time O(m * n), Space O(m * n) worst case',
  follow: ['Nếu lưới được cập nhật động (thêm nước/đất) thì dùng cấu trúc gì?', 'Đếm số đảo có diện tích lớn nhất thì sửa thế nào?']
},
{
  id: 'algo-029',
  title: 'Course Schedule',
  difficulty: 'medium',
  pattern: 'Graph',
  tags: ['graph', 'topological-sort', 'bfs'],
  prompt: `Có {{numCourses}} khoá học đánh số từ 0 đến {{numCourses - 1}}. Mảng {{prerequisites}} chứa các cặp {{[a, b]}} nghĩa là muốn học khoá {{a}} phải học xong khoá {{b}} trước. Kiểm tra xem có thể hoàn thành tất cả khoá học hay không (tức đồ thị phụ thuộc không có chu trình).

### Ví dụ
~~~text
Input:  numCourses = 2, prerequisites = [[1,0]]
Output: true

Input:  numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
~~~

### Ràng buộc
- {{1 <= numCourses <= 2000}}
- {{0 <= prerequisites.length <= 5000}}
- Mỗi cặp {{[a, b]}} có {{a != b}}.`,
  hints: [
    'Mô hình hoá thành đồ thị có hướng: cạnh từ b sang a. Cần kiểm tra chu trình.',
    'Topological sort bằng Kahn: bắt đầu từ các node có indegree 0.',
    'Nếu sau khi xử lý mà số node đã lấy nhỏ hơn numCourses thì còn chu trình.'
  ],
  solution: `### Ý tưởng
Xây adjacency list và mảng indegree. Đưa mọi khoá có indegree 0 vào queue. Lần lượt lấy ra, giảm indegree của các node kề; node nào về 0 thì đưa vào queue. Đếm số node đã xử lý; nếu bằng {{numCourses}} thì không có chu trình.

~~~java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] p : prerequisites) {
        adj.get(p[1]).add(p[0]);   // học p[1] trước p[0]
        indegree[p[0]]++;
    }
    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) {
        if (indegree[i] == 0) queue.add(i);
    }
    int processed = 0;
    while (!queue.isEmpty()) {
        int cur = queue.poll();
        processed++;
        for (int next : adj.get(cur)) {
            if (--indegree[next] == 0) queue.add(next);
        }
    }
    return processed == numCourses;
}
~~~

### Lưu ý khi phỏng vấn
- Cẩn thận chiều cạnh: nếu đảo ngược, kết quả vẫn có thể đúng cho bài "có chu trình" nhưng sai khi cần thứ tự học.
- Có thể dùng DFS với 3 màu (white/gray/black) để phát hiện chu trình; nêu cả hai hướng.
- Cạnh trùng hoặc self-loop: self-loop bị cấm bởi ràng buộc, nhưng cạnh trùng vẫn có thể xảy ra trong dữ liệu thật.

> Senior tip: Đây là mô hình của dependency graph trong build system, module Spring, hoặc pipeline dữ liệu. Khi graph lớn, Kahn cho phép xử lý song song các node indegree 0 — hãy nêu ý tưởng này vì nó thể hiện tư duy hệ thống.`,
  complexity: 'Time O(V + E), Space O(V + E)',
  follow: ['Nếu cần in ra một thứ tự học hợp lệ thì làm thế nào?', 'Phát hiện chu trình bằng DFS màu thì cài đặt ra sao?']
},
{
  id: 'algo-030',
  title: 'Network Delay Time (Dijkstra)',
  difficulty: 'medium',
  pattern: 'Graph',
  tags: ['graph', 'dijkstra', 'shortest-path', 'heap'],
  prompt: `Có {{n}} node mạng đánh số 1..n. Mảng {{times}} chứa bộ ba {{[u, v, w]}} nghĩa là tín hiệu từ {{u}} tới {{v}} mất {{w}} đơn vị thời gian (có hướng). Bắt đầu gửi tín hiệu từ node {{k}}. Trả về thời gian tối thiểu để mọi node nhận được tín hiệu, hoặc -1 nếu có node không thể tới.

### Ví dụ
~~~text
Input:  times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Output: 2

Input:  times = [[1,2,1]], n = 2, k = 2
Output: -1
~~~

### Ràng buộc
- {{1 <= k <= n <= 100}}
- {{1 <= times.length <= 6000}}
- {{1 <= u, v <= n}}, {{u != v}}, {{0 <= w <= 100}}`,
  hints: [
    'Cần khoảng cách ngắn nhất từ một nguồn tới mọi node, trọng số không âm.',
    'Dijkstra với priority queue: luôn mở rộng node có khoảng cách tạm thời nhỏ nhất.',
    'Sau khi tính xong, đáp án là khoảng cách lớn nhất; nếu có node vô cực thì trả -1.'
  ],
  solution: `### Ý tưởng
Dùng Dijkstra. Khởi tạo {{dist[k] = 0}}, các node khác vô cực. Priority queue chứa cặp {{(distance, node)}}. Mỗi lần pop, nếu khoảng cách đã lỗi thời thì bỏ qua; nếu không, thư giãn các cạnh ra.

Vì Java không có decrease-key, ta đẩy bản ghi mới và bỏ qua bản ghi cũ khi pop (lazy deletion).

~~~java
public int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
    for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.add(new int[]{0, k});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;   // bản ghi cũ
        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.add(new int[]{dist[v], v});
            }
        }
    }
    int answer = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        answer = Math.max(answer, dist[i]);
    }
    return answer;
}
~~~

### Lưu ý khi phỏng vấn
- Dijkstra chỉ đúng với trọng số không âm. Nếu có cạnh âm, phải dùng Bellman-Ford.
- Không cần mảng visited nếu dùng kiểm tra {{d > dist[u]}}; nhưng có thể thêm để rõ ràng.
- Độ phức tạp O(E log V) với heap; với đồ thị dày, có thể cân nhắc Fibonacci heap (hiếm dùng trong phỏng vấn).

> Senior tip: Trong hệ thống microservices, Dijkstra/bellman tương ứng bài toán chọn đường đi theo latency thấp nhất, nhưng latency thay đổi liên tục. Các hệ thống thật thường dùng thuật toán thích nghi hoặc load balancer dựa trên số liệu realtime thay vì chạy Dijkstra mỗi request.`,
  complexity: 'Time O(E log V), Space O(V + E)',
  follow: ['Nếu có cạnh trọng số âm thì dùng thuật toán nào?', 'Tìm đường đi ngắn nhất giữa mọi cặp node thì sao?']
}
);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-031',
  title: 'Last Stone Weight',
  difficulty: 'easy',
  pattern: 'Heap',
  tags: ['heap', 'priority-queue'],
  prompt: `Cho mảng {{stones}} là khối lượng các viên đá. Mỗi lượt, lấy hai viên nặng nhất và đập vào nhau:

- Nếu bằng nhau, cả hai vỡ hết.
- Nếu khác nhau, viên nhẹ vỡ, viên nặng còn lại phần chênh lệch.

Lặp đến khi còn tối đa một viên. Trả về khối lượng viên còn lại, hoặc 0 nếu không còn.

### Ví dụ
~~~text
Input:  stones = [2,7,4,1,8,1]
Output: 1
Giải thích: 8-7=1, 4-2=2, 2-1=1, 1-1=0, còn 1.

Input:  stones = [1]
Output: 1
~~~

### Ràng buộc
- {{1 <= stones.length <= 30}}
- {{1 <= stones[i] <= 1000}}`,
  hints: [
    'Mỗi bước cần lấy hai phần tử lớn nhất — cấu trúc nào hỗ trợ việc này hiệu quả?',
    'Max-heap (PriorityQueue với comparator đảo) cho phép lấy max trong O(log n).',
    'Sau khi lấy hai viên, nếu chênh lệch khác 0 thì đẩy lại vào heap; lặp đến khi heap có 0 hoặc 1 phần tử.'
  ],
  solution: `### Ý tưởng
Dùng max-heap chứa khối lượng các viên đá. Mỗi vòng lấy ra hai viên lớn nhất, tính chênh lệch; nếu khác 0 thì đẩy lại. Cuối cùng trả về phần tử còn lại hoặc 0.

~~~java
public int lastStoneWeight(int[] stones) {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
    for (int s : stones) maxHeap.add(s);
    while (maxHeap.size() > 1) {
        int a = maxHeap.poll();   // nặng nhất
        int b = maxHeap.poll();   // nặng thứ hai
        if (a != b) maxHeap.add(a - b);
    }
    return maxHeap.isEmpty() ? 0 : maxHeap.poll();
}
~~~

### Lưu ý khi phỏng vấn
- Nếu hai viên bằng nhau, không đẩy gì vào heap — nhiều bạn quên và đẩy 0.
- Có thể dùng mảng và sort lại mỗi lần, nhưng O(n² log n) hoặc O(n²) tuỳ cách; heap là lựa chọn tự nhiên.
- Hỏi lại: có cần giữ lịch sử các lần đập không? Nếu có, cần thêm cấu trúc.

> Senior tip: Bài này nhỏ nhưng thể hiện đúng tư duy chọn cấu trúc dữ liệu. Trong phỏng vấn, hãy nói rõ chi phí: heap O(n log n) time, O(n) space; so với sort mỗi vòng thì heap thắng khi số phần tử lớn.`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Nếu mỗi lần đập tốn thêm chi phí tỉ lệ khối lượng thì sao?', 'Làm sao trả về toàn bộ diễn biến các lần đập?']
},
{
  id: 'algo-032',
  title: 'Kth Largest Element in an Array',
  difficulty: 'medium',
  pattern: 'Heap',
  tags: ['heap', 'quickselect', 'array'],
  prompt: `Cho mảng số nguyên {{nums}} và số {{k}}, trả về phần tử lớn thứ {{k}} trong mảng (theo thứ tự sắp xếp giảm dần, không phải phần tử phân biệt thứ k). Không cần sắp xếp toàn bộ mảng.

### Ví dụ
~~~text
Input:  nums = [3,2,1,5,6,4], k = 2
Output: 5

Input:  nums = [3,2,3,1,2,4,5,5,6], k = 4
Output: 4
~~~

### Ràng buộc
- {{1 <= k <= nums.length <= 10^5}}
- {{-10^4 <= nums[i] <= 10^4}}`,
  hints: [
    'Sort toàn bộ là O(n log n) và làm thêm việc không cần thiết. Chỉ cần biết k phần tử lớn nhất.',
    'Giữ một min-heap kích thước {{k}}: phần tử nhỏ nhất trong heap chính là biên của top-k.',
    'Duyệt từng phần tử, đẩy vào heap; nếu heap vượt {{k}} thì pop phần tử nhỏ nhất. Cuối cùng đỉnh heap là đáp án.'
  ],
  solution: `### Ý tưởng
Dùng min-heap kích thước {{k}}. Với mỗi phần tử, thêm vào heap; nếu heap có hơn {{k}} phần tử, loại phần tử nhỏ nhất. Sau khi duyệt hết, đỉnh heap là phần tử lớn thứ {{k}}.

Cách này đặc biệt phù hợp với stream vì không cần lưu toàn bộ mảng.

~~~java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int x : nums) {
        minHeap.add(x);
        if (minHeap.size() > k) {
            minHeap.poll();   // loại phần tử nhỏ nhất
        }
    }
    return minHeap.peek();
}
~~~

### Lưu ý khi phỏng vấn
- Đừng nhầm min-heap với max-heap: để giữ top-k lớn nhất, heap phải là min-heap để dễ loại phần tử yếu nhất.
- Quickselect cho average O(n), worst O(n²); nêu trade-off nếu được hỏi tối ưu hơn.
- Nếu {{k}} gần bằng n, sort có thể đơn giản hơn và hằng số nhỏ hơn; hãy hỏi ràng buộc thực tế.

> Senior tip: Với top-K trong hệ thống monitoring, min-heap kích thước k là lựa chọn mặc định vì bộ nhớ O(k). Nếu k rất lớn hoặc phân tán, hãy cân nhắc Count-Min Sketch kèm heap xấp xỉ.`,
  complexity: 'Time O(n log k), Space O(k)',
  follow: ['Cài quickselect và phân tích worst case.', 'Nếu dữ liệu là stream vô hạn thì thiết kế thế nào?']
},
{
  id: 'algo-033',
  title: 'Merge Intervals',
  difficulty: 'medium',
  pattern: 'Heap',
  tags: ['intervals', 'sorting', 'array'],
  prompt: `Cho mảng các khoảng {{intervals}} với {{intervals[i] = [start, end]}}. Hợp nhất mọi khoảng giao nhau hoặc chạm nhau, trả về danh sách các khoảng không giao nhau.

### Ví dụ
~~~text
Input:  intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]

Input:  intervals = [[1,4],[4,5]]
Output: [[1,5]]
~~~

### Ràng buộc
- {{1 <= intervals.length <= 10^4}}
- {{0 <= start <= end <= 10^4}}`,
  hints: [
    'Nếu các khoảng được sắp xếp theo điểm bắt đầu, khoảng giao nhau sẽ nằm kề nhau.',
    'Sort theo start; duyệt và so sánh start hiện tại với end của khoảng cuối trong kết quả.',
    'Nếu giao nhau, mở rộng end của khoảng cuối thành max của hai end; nếu không, thêm khoảng mới.'
  ],
  solution: `### Ý tưởng
Sort các khoảng theo điểm bắt đầu. Duyệt từng khoảng: nếu danh sách kết quả rỗng hoặc khoảng hiện tại bắt đầu sau end của khoảng cuối, thêm mới. Ngược lại, cập nhật end của khoảng cuối bằng max hai end.

Sau khi sort, mỗi khoảng chỉ được xử lý một lần, nên tổng O(n log n).

~~~java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> merged = new ArrayList<>();
    for (int[] cur : intervals) {
        if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
            merged.add(cur);
        } else {
            int[] last = merged.get(merged.size() - 1);
            last[1] = Math.max(last[1], cur[1]);
        }
    }
    return merged.toArray(new int[0][]);
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện chạm nhau {{last[1] < cur[0]}} coi {{[1,4]}} và {{[4,5]}} là giao nhau; nếu đề không coi chạm là giao, đổi thành {{<=}}.
- Comparator dùng {{a[0] - b[0]}} có thể tràn nếu giá trị lớn; dùng {{Integer.compare}}.
- Hàm sort sửa trực tiếp mảng đầu vào — hỏi xem có được phép không.

> Senior tip: Merge intervals là nền tảng của bài toán lịch (calendar), cấp phát tài nguyên theo thời gian, và nén dải IP. Với dữ liệu streaming, không thể sort toàn bộ; khi đó dùng interval tree hoặc cấu trúc cân bằng theo start.`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Chèn một interval vào danh sách đã merge thì làm thế nào?', 'Nếu dữ liệu đến streaming thì xử lý ra sao?']
},
{
  id: 'algo-034',
  title: 'Meeting Rooms II',
  difficulty: 'medium',
  pattern: 'Heap',
  tags: ['intervals', 'heap', 'sorting'],
  prompt: `Cho mảng {{intervals}} với {{intervals[i] = [start, end]}} là thời gian bắt đầu và kết thúc của các cuộc họp. Tính số phòng họp tối thiểu cần thiết để tổ chức tất cả, biết rằng một phòng chỉ dùng được cho một cuộc họp tại một thời điểm.

### Ví dụ
~~~text
Input:  intervals = [[0,30],[5,10],[15,20]]
Output: 2

Input:  intervals = [[7,10],[2,4]]
Output: 1
~~~

### Ràng buộc
- {{1 <= intervals.length <= 10^4}}
- {{0 <= start < end <= 10^6}}`,
  hints: [
    'Số phòng cần bằng số cuộc họp diễn ra đồng thời tại thời điểm cao điểm.',
    'Có thể tách start và end, sort riêng, rồi quét bằng hai con trỏ.',
    'Hoặc dùng min-heap lưu end time: nếu phòng sớm nhất đã xong thì tái sử dụng, nếu không thì mở phòng mới.'
  ],
  solution: `### Ý tưởng
Tách tất cả start và end, sort riêng. Dùng hai con trỏ: nếu cuộc họp tiếp theo bắt đầu trước khi cuộc họp đang kết thúc sớm nhất kết thúc, cần thêm phòng; ngược lại, giải phóng một phòng.

Đây là cách O(n log n) time, O(n) space, dễ giải thích và ít lỗi.

~~~java
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n];
    int[] ends = new int[n];
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);
    int rooms = 0, best = 0, e = 0;
    for (int s : starts) {
        if (s < ends[e]) {
            rooms++;            // chưa có phòng trống
        } else {
            e++;                // tái sử dụng phòng đã xong
        }
        best = Math.max(best, rooms);
    }
    return best;
}
~~~

### Lưu ý khi phỏng vấn
- Nếu một cuộc họp kết thúc đúng lúc cuộc khác bắt đầu, thường được coi là tái sử dụng được (dùng {{<}}). Hãy hỏi lại quy ước.
- Cách heap: sort theo start, đẩy end vào min-heap; nếu end nhỏ nhất <= start hiện tại thì poll rồi đẩy end mới; kích thước heap là đáp án.
- Đừng nhầm với Merge Intervals: ở đây chỉ đếm số phòng, không cần gộp khoảng.

> Senior tip: Bài này mô hình hoá capacity planning: số worker, connection pool, hay slot trong scheduler. Trong thực tế, bạn còn phải tính buffer và thời gian chuyển ca; hãy nêu rằng mô hình lý thuyết chỉ là cận dưới.`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Cài bằng min-heap và so sánh với cách hai mảng.', 'Nếu cần gán từng cuộc họp vào phòng cụ thể thì làm thế nào?']
},
{
  id: 'algo-035',
  title: 'Climbing Stairs',
  difficulty: 'easy',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'fibonacci'],
  prompt: `Bạn đang leo một cầu thang có {{n}} bậc. Mỗi bước có thể leo 1 hoặc 2 bậc. Tính số cách khác nhau để lên tới đỉnh.

### Ví dụ
~~~text
Input:  n = 2
Output: 2
Giải thích: 1+1 hoặc 2.

Input:  n = 3
Output: 3
Giải thích: 1+1+1, 1+2, 2+1.
~~~

### Ràng buộc
- {{1 <= n <= 45}}`,
  hints: [
    'Để tới bậc {{n}}, bước cuối có thể từ bậc {{n-1}} (leo 1) hoặc {{n-2}} (leo 2).',
    'Vậy số cách là tổng số cách tới hai bậc trước — công thức Fibonacci.',
    'Không cần mảng DP; chỉ cần giữ hai giá trị gần nhất.'
  ],
  solution: `### Ý tưởng
Gọi {{f(n)}} là số cách tới bậc n. Ta có {{f(n) = f(n-1) + f(n-2)}}, với {{f(0) = 1}} và {{f(1) = 1}}. Dùng hai biến để tính lặp, tiết kiệm bộ nhớ.

~~~java
public int climbStairs(int n) {
    int prev = 1;   // f(0)
    int cur = 1;    // f(1)
    for (int i = 2; i <= n; i++) {
        int next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}
~~~

### Lưu ý khi phỏng vấn
- Với {{n = 45}}, kết quả vẫn vừa {{int}}; nếu {{n}} lớn hơn, dùng {{long}} hoặc BigInteger.
- Có thể giải bằng DP mảng O(n), nhưng hai biến thể hiện tối ưu bộ nhớ tốt hơn.
- Hỏi lại: nếu được leo 1, 2 hoặc 3 bậc thì công thức thay đổi thế nào? Tổng ba giá trị trước.

> Senior tip: Bài này là cửa ngõ vào DP. Điểm tôi hay hỏi tiếp là "nếu n = 10^9 thì sao?" — câu trả lời là dùng ma trận lũy thừa hoặc công thức Binet, nhưng cần xử lý số lớn và độ chính xác.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu được leo 1, 2, 3 bậc thì sửa thế nào?', 'Tính với n rất lớn bằng ma trận lũy thừa ra sao?']
},
{
  id: 'algo-036',
  title: 'Search Insert Position',
  difficulty: 'easy',
  pattern: 'Binary Search',
  tags: ['array', 'binary-search', 'lower-bound'],
  prompt: `Cho mảng {{nums}} đã sắp xếp tăng dần và số {{target}}. Nếu tìm thấy {{target}}, trả về chỉ số của nó. Nếu không, trả về vị trí nên chèn để mảng vẫn giữ thứ tự tăng dần.

### Ví dụ
~~~text
Input:  nums = [1,3,5,6], target = 5
Output: 2

Input:  nums = [1,3,5,6], target = 2
Output: 1

Input:  nums = [1,3,5,6], target = 7
Output: 4
~~~

### Ràng buộc
- {{1 <= nums.length <= 10^4}}
- {{-10^4 <= nums[i], target <= 10^4}}
- Mọi phần tử trong {{nums}} là duy nhất và đã sắp xếp.`,
  hints: [
    'Đây chính là bài tìm lower bound: vị trí đầu tiên có giá trị lớn hơn hoặc bằng target.',
    'Dùng binary search trên khoảng nửa mở {{[lo, hi)}} với {{hi = nums.length}}.',
    'Khi {{nums[mid] < target}}, chắc chắn đáp án nằm bên phải; ngược lại thu hẹp về bên trái.'
  ],
  solution: `### Ý tưởng
Tìm vị trí đầu tiên có {{nums[pos] >= target}}. Nếu target lớn hơn mọi phần tử, vị trí đó là {{nums.length}} — đúng với yêu cầu chèn ở cuối.

Dùng khoảng nửa mở {{[lo, hi)}}: {{hi}} ban đầu là {{nums.length}}, vòng lặp chạy khi {{lo < hi}}, và cập nhật {{hi = mid}} khi không chắc chắn.

~~~java
public int searchInsert(int[] nums, int target) {
    int lo = 0, hi = nums.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;   // lower bound
}
~~~

### Lưu ý khi phỏng vấn
- Kết quả đúng cho cả ba trường hợp: tìm thấy, không tìm thấy ở giữa, và lớn hơn mọi phần tử.
- Không dùng {{hi = nums.length - 1}} với khoảng nửa mở; nếu dùng khoảng đóng thì phải đổi điều kiện và cách cập nhật.
- Đây là nền tảng để cài đặt {{lower_bound}}/{{ceiling}} trong các bài tìm khoảng, chèn vào danh sách đã sort.

> Senior tip: Trong production, lower bound xuất hiện khi tìm bucket thời gian, chọn partition trong Kafka, hoặc chèn vào danh sách cấu hình đã sort. Hãy nhớ quy ước nửa mở để tránh lỗi khi target lớn hơn toàn bộ mảng.`,
  complexity: 'Time O(log n), Space O(1)',
  follow: ['Tìm upper bound (phần tử đầu tiên lớn hơn target) thì sửa thế nào?', 'Nếu mảng có phần tử trùng thì kết quả thay đổi ra sao?']
},
{
  id: 'algo-037',
  title: 'Coin Change',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'unbounded-knapsack'],
  prompt: `Cho mảng {{coins}} là mệnh giá các đồng xu (mỗi loại có số lượng không giới hạn) và số tiền {{amount}}. Tìm số đồng xu ít nhất để tạo đúng {{amount}}, hoặc -1 nếu không thể.

### Ví dụ
~~~text
Input:  coins = [1,2,5], amount = 11
Output: 3
Giải thích: 5 + 5 + 1.

Input:  coins = [2], amount = 3
Output: -1

Input:  coins = [1], amount = 0
Output: 0
~~~

### Ràng buộc
- {{1 <= coins.length <= 12}}
- {{1 <= coins[i] <= 2^31 - 1}}
- {{0 <= amount <= 10^4}}`,
  hints: [
    'Greedy không đúng với mọi bộ mệnh giá. Cần xét tất cả cách tạo từng mệnh giá nhỏ hơn.',
    'Gọi {{dp[x]}} là số xu ít nhất để tạo số tiền x. {{dp[0] = 0}}.',
    'Với mỗi x, thử mọi đồng xu c <= x: {{dp[x] = min(dp[x], dp[x-c] + 1)}}.'
  ],
  solution: `### Ý tưởng
DP từ 0 đến {{amount}}. Với mỗi số tiền, thử dùng từng đồng xu và lấy phương án ít xu nhất. Dùng một giá trị sentinel lớn hơn {{amount}} để biểu diễn "không thể".

Độ phức tạp O(amount * số loại xu), bộ nhớ O(amount).

~~~java
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);   // sentinel: không thể
    dp[0] = 0;
    for (int x = 1; x <= amount; x++) {
        for (int c : coins) {
            if (c <= x) {
                dp[x] = Math.min(dp[x], dp[x - c] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
~~~

### Lưu ý khi phỏng vấn
- Sentinel phải lớn hơn {{amount}}; nếu dùng {{Integer.MAX_VALUE}} thì {{+1}} có thể tràn.
- Thứ tự hai vòng lặp không ảnh hưởng kết quả số xu, nhưng ảnh hưởng nếu đếm số cách (khi đó cần tránh đếm trùng hoán vị).
- Greedy chỉ đúng với một số hệ mệnh giá (như 1,5,10,25 với điều kiện nhất định), không đúng tổng quát.

> Senior tip: Bài này là unbounded knapsack cơ bản. Trong toán tiền tệ thực tế, còn có ràng buộc số lượng từng mệnh giá và hao hụt; khi đó phải dùng DP có chiều số lượng hoặc thuật toán tối ưu hoá tuyến tính nguyên.`,
  complexity: 'Time O(amount * coins.length), Space O(amount)',
  follow: ['Đếm số cách tạo amount thì sửa thế nào?', 'Nếu mỗi mệnh giá có số lượng giới hạn thì sao?']
},
{
  id: 'algo-038',
  title: 'Longest Increasing Subsequence',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'binary-search', 'patience-sorting'],
  prompt: `Cho mảng số nguyên {{nums}}, tìm độ dài của dãy con tăng chặt dài nhất. Dãy con không cần liên tiếp nhưng phải giữ nguyên thứ tự.

### Ví dụ
~~~text
Input:  nums = [10,9,2,5,3,7,101,18]
Output: 4
Giải thích: [2,3,7,101] hoặc [2,5,7,18].

Input:  nums = [7,7,7,7]
Output: 1
~~~

### Ràng buộc
- {{1 <= nums.length <= 2500}}
- {{-10^4 <= nums[i] <= 10^4}}`,
  hints: [
    'DP O(n²): với mỗi i, xét mọi j < i và nối nếu nums[j] < nums[i].',
    'Có cách O(n log n): duy trì mảng tails, trong đó tails[k] là giá trị kết thúc nhỏ nhất của dãy tăng dài k+1.',
    'Với mỗi phần tử, binary search vị trí đầu tiên trong tails >= phần tử và thay thế; nếu vượt cuối thì mở rộng.'
  ],
  solution: `### Ý tưởng
Dùng patience sorting. Mảng {{tails}} lưu phần tử kết thúc nhỏ nhất cho mỗi độ dài. Với mỗi {{x}}, tìm vị trí {{pos}} đầu tiên có {{tails[pos] >= x}} và gán {{tails[pos] = x}}. Nếu {{pos == len}} thì tăng độ dài.

Lưu ý {{tails}} không phải dãy con thực tế, chỉ dùng để tính độ dài.

~~~java
public int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];
    int len = 0;
    for (int x : nums) {
        int lo = 0, hi = len;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] < x) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        tails[lo] = x;
        if (lo == len) len++;
    }
    return len;
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{<}} để tìm lower bound cho dãy tăng chặt; nếu muốn không giảm, tìm upper bound.
- Nếu cần trả về dãy con thực tế, phải lưu thêm parent/index — chỉ mảng tails là không đủ.
- DP O(n²) dễ hiểu hơn và cần thiết nếu bài toán yêu cầu thêm ràng buộc phức tạp.

> Senior tip: Trong bài toán tìm chuỗi tăng dài nhất của version/deploy, O(n log n) rất quan trọng vì log deploy có thể hàng triệu dòng. Hãy nhớ tails chỉ là công cụ tính độ dài; đừng cố in nó ra như đáp án.`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Cài DP O(n²) và so sánh.', 'Tìm dãy con tăng dài nhất thực tế thì cần thêm gì?']
},
{
  id: 'algo-039',
  title: 'Edit Distance',
  difficulty: 'hard',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'string', 'levenshtein'],
  prompt: `Cho hai chuỗi {{word1}} và {{word2}}. Tìm số phép biến đổi ít nhất để biến {{word1}} thành {{word2}}, với ba phép: chèn một ký tự, xoá một ký tự, thay thế một ký tự.

### Ví dụ
~~~text
Input:  word1 = "horse", word2 = "ros"
Output: 3
Giải thích: horse -> rorse (thay h bằng r) -> rose (xoá r) -> ros (xoá e).

Input:  word1 = "intention", word2 = "execution"
Output: 5
~~~

### Ràng buộc
- {{0 <= word1.length, word2.length <= 500}}
- Hai chuỗi gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Xét tiền tố của hai chuỗi. Nếu ký tự cuối giống nhau, không cần phép nào cho cặp đó.',
    'Nếu khác nhau, phép cuối là chèn, xoá hoặc thay thế — mỗi phép tương ứng một trạng thái con.',
    'Định nghĩa {{dp[i][j]}} là chi phí biến i ký tự đầu của word1 thành j ký tự đầu của word2.'
  ],
  solution: `### Ý tưởng
DP hai chiều. {{dp[i][j]}} là số phép ít nhất để biến {{word1[0..i)}} thành {{word2[0..j)}}.

- Nếu ký tự cuối bằng nhau: {{dp[i][j] = dp[i-1][j-1]}}.
- Ngược lại: 1 + min(xoá {{dp[i-1][j]}}, chèn {{dp[i][j-1]}}, thay {{dp[i-1][j-1]}}).

Base case: biến chuỗi rỗng thành j ký tự tốn j phép chèn; ngược lại tốn i phép xoá.

~~~java
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                int replace = dp[i - 1][j - 1];
                int delete = dp[i - 1][j];
                int insert = dp[i][j - 1];
                dp[i][j] = 1 + Math.min(replace, Math.min(delete, insert));
            }
        }
    }
    return dp[m][n];
}
~~~

### Lưu ý khi phỏng vấn
- Có thể giảm bộ nhớ xuống O(n) bằng hai hàng; nêu điều này nếu được hỏi tối ưu.
- Nếu cho phép hoán đổi hai ký tự kề (Damerau-Levenshtein), công thức cần thêm trường hợp.
- Với Unicode, {{charAt}} theo code unit có thể sai với emoji; dùng code point nếu cần chính xác.

> Senior tip: Edit distance là nền tảng của fuzzy matching, spell checker và diff. Trong production, với chuỗi rất dài người ta dùng giới hạn ngưỡng kết hợp banded DP để giảm từ O(mn) xuống gần O(k * min(m,n)).`,
  complexity: 'Time O(m * n), Space O(m * n)',
  follow: ['Tối ưu bộ nhớ xuống O(n) thì làm thế nào?', 'Nếu chỉ cần kiểm tra khoảng cách <= k thì tối ưu ra sao?']
}
);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-040',
  title: 'Subsets',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'bitmask'],
  prompt: `Cho mảng {{nums}} gồm các số nguyên phân biệt. Trả về tất cả các tập con (power set) của mảng, không trùng lặp, thứ tự bất kỳ.

### Ví dụ
~~~text
Input:  nums = [1,2,3]
Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]
~~~

### Ràng buộc
- {{1 <= nums.length <= 10}}
- {{-10 <= nums[i] <= 10}}
- Các phần tử phân biệt.`,
  hints: [
    'Mỗi phần tử có hai lựa chọn: có trong tập con hoặc không. Tổng cộng 2^n tập con.',
    'Duyệt theo chỉ số, tại mỗi bước quyết định chọn hoặc bỏ phần tử hiện tại.',
    'Có thể dùng backtracking với đường đi hiện tại; mỗi trạng thái đều là một tập con hợp lệ nên ghi nhận ngay khi vào hàm.'
  ],
  solution: `### Ý tưởng
Backtracking theo chỉ số bắt đầu. Mỗi lần gọi hàm, đường đi hiện tại là một tập con hợp lệ, nên thêm bản sao vào kết quả. Sau đó thử thêm từng phần tử từ vị trí {{start}} trở đi, đệ quy, rồi bỏ ra.

Cây quyết định có 2^n lá; mỗi tập con được copy khi ghi nhận nên tổng chi phí O(n * 2^n).

~~~java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(0, new ArrayList<>(), nums, result);
    return result;
}

private void backtrack(int start, List<Integer> path, int[] nums,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));   // mọi trạng thái đều hợp lệ
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(i + 1, path, nums, result);
        path.remove(path.size() - 1);
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phải copy {{new ArrayList<>(path)}} khi ghi kết quả; nếu thêm trực tiếp, mọi phần tử sẽ trỏ về cùng một list và bị thay đổi.
- Nếu mảng có phần tử trùng, cần sort và bỏ qua các nhánh trùng ở cùng một tầng.
- Có thể giải bằng bitmask từ 0 đến {{(1 << n) - 1}}; với n <= 10 thì cả hai cách đều ổn.

> Senior tip: Bài này là mẫu để học "backtracking template". Khi gặp bài tổ hợp, hãy xác định rõ: trạng thái ghi nhận khi nào, tham số start là gì, và điều kiện cắt tỉa. Ba câu hỏi đó quyết định code đúng hay sai.`,
  complexity: 'Time O(n * 2^n), Space O(n) ngoài kết quả',
  follow: ['Nếu nums có phần tử trùng thì sửa thế nào?', 'Sinh tập con có tổng bằng target thì làm sao?']
},
{
  id: 'algo-041',
  title: 'Permutations',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'recursion'],
  prompt: `Cho mảng {{nums}} gồm các số nguyên phân biệt. Trả về tất cả các hoán vị của mảng, theo thứ tự bất kỳ và không trùng lặp.

### Ví dụ
~~~text
Input:  nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
~~~

### Ràng buộc
- {{1 <= nums.length <= 6}}
- {{-10 <= nums[i] <= 10}}
- Các phần tử phân biệt.`,
  hints: [
    'Mỗi vị trí trong hoán vị cần chọn một phần tử chưa dùng.',
    'Dùng mảng {{used}} để đánh dấu phần tử đã nằm trong đường đi hiện tại.',
    'Khi đường đi đủ dài bằng n, ghi nhận; nếu không, thử mọi phần tử chưa dùng.'
  ],
  solution: `### Ý tưởng
Backtracking với mảng {{used}}. Tại mỗi bước, thử mọi phần tử chưa dùng, thêm vào đường đi, đệ quy, rồi hoàn tác. Khi đường đi có đủ n phần tử, đó là một hoán vị.

Có n! hoán vị; chi phí copy mỗi hoán vị là O(n).

~~~java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(new ArrayList<>(), nums, used, result);
    return result;
}

private void backtrack(List<Integer> path, int[] nums, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        backtrack(path, nums, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu có phần tử trùng, phải sort và bỏ qua phần tử trùng chưa dùng ở cùng tầng: {{i > 0 && nums[i] == nums[i - 1] && !used[i - 1]}}.
- Có thể hoán vị tại chỗ bằng swap, tiết kiệm mảng used nhưng khó kiểm soát trùng lặp hơn.
- Khi n tăng, số hoán vị bùng nổ; hãy hỏi có cần sinh tất cả hay chỉ đếm/duyệt theo thứ tự.

> Senior tip: Với bài toán lịch trình nhỏ, hoán vị + kiểm tra ràng buộc là cách nhanh để prototype. Nhưng trong production, n > 10 gần như không thể duyệt hết; hãy chuyển sang heuristic hoặc quy hoạch động trên tập con (bitmask DP).`,
  complexity: 'Time O(n * n!), Space O(n)',
  follow: ['Xử lý hoán vị có phần tử trùng thế nào?', 'Sinh hoán vị thứ k theo thứ tự từ điển ra sao?']
},
{
  id: 'algo-042',
  title: 'Combination Sum',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'combination'],
  prompt: `Cho mảng {{candidates}} gồm các số nguyên dương phân biệt và số {{target}}. Tìm tất cả các tổ hợp có tổng bằng {{target}}. Mỗi phần tử được dùng không giới hạn số lần. Kết quả không chứa tổ hợp trùng (khác thứ tự không tính là khác).

### Ví dụ
~~~text
Input:  candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]

Input:  candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]
~~~

### Ràng buộc
- {{1 <= candidates.length <= 30}}
- {{2 <= candidates[i] <= 40}}
- {{1 <= target <= 40}}`,
  hints: [
    'Đây là bài chọn nhiều lần từ một tập, cần tránh sinh hoán vị trùng nhau.',
    'Sort candidates và dùng tham số {{start}} để chỉ chọn các phần tử từ vị trí đó trở đi.',
    'Khi đệ quy, truyền chính {{i}} (không phải {{i + 1}}) để cho phép dùng lại; nếu phần tử vượt remain thì break vì đã sort.'
  ],
  solution: `### Ý tưởng
Backtracking với {{start}} và số tiền còn lại {{remain}}. Chọn {{candidates[i]}}, trừ vào remain, đệ quy với cùng {{i}} để cho phép dùng lại. Nếu remain = 0, ghi nhận; nếu âm, dừng nhánh.

Sort trước để có thể break sớm khi phần tử lớn hơn remain.

~~~java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates);
    List<List<Integer>> result = new ArrayList<>();
    backtrack(0, target, candidates, new ArrayList<>(), result);
    return result;
}

private void backtrack(int start, int remain, int[] candidates,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) break;   // đã sort
        path.add(candidates[i]);
        backtrack(i, remain - candidates[i], candidates, path, result);
        path.remove(path.size() - 1);
    }
}
~~~

### Lưu ý khi phỏng vấn
- Truyền {{i}} thay vì {{i + 1}} là mấu chốt cho phép dùng lại phần tử; nhưng vẫn phải giữ {{start}} để tránh hoán vị trùng.
- Nếu candidates có phần tử trùng, cần thêm bước bỏ qua cùng tầng: {{i > start && candidates[i] == candidates[i - 1]}}.
- Có thể cắt nhánh mạnh hơn bằng remain và giá trị nhỏ nhất; break sau sort là đủ cho bài này.

> Senior tip: Combination Sum là bài học về "tránh trùng lặp bằng thứ tự". Rất nhiều ứng viên code đúng tổng nhưng trả về hoán vị trùng; hãy vẽ cây đệ quy và chỉ ra tham số start đã loại bỏ nhánh quay lui thế nào.`,
  complexity: 'Time O(n^(target/minCoin)) worst case, Space O(target/minCoin)',
  follow: ['Nếu mỗi phần tử chỉ dùng một lần thì sửa thế nào?', 'Đếm số tổ hợp thay vì liệt kê thì tối ưu ra sao?']
},
{
  id: 'algo-043',
  title: 'Jump Game',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['array', 'greedy'],
  prompt: `Cho mảng {{nums}} với {{nums[i]}} là độ dài bước nhảy tối đa từ vị trí {{i}}. Bắt đầu từ vị trí 0, xác định có thể tới vị trí cuối cùng hay không.

### Ví dụ
~~~text
Input:  nums = [2,3,1,1,4]
Output: true
Giải thích: nhảy 1 bước từ 0 tới 1, rồi 3 bước tới cuối.

Input:  nums = [3,2,1,0,4]
Output: false
Giải thích: luôn bị kẹt ở vị trí 3.
~~~

### Ràng buộc
- {{1 <= nums.length <= 10^4}}
- {{0 <= nums[i] <= 10^5}}`,
  hints: [
    'Không cần thử mọi cách nhảy; chỉ cần biết vị trí xa nhất có thể tới.',
    'Duyệt từ trái sang phải, cập nhật {{farthest = max(farthest, i + nums[i])}}.',
    'Nếu tại một vị trí {{i}} mà {{i > farthest}}, nghĩa là không thể tới đó — trả false.'
  ],
  solution: `### Ý tưởng
Greedy: duy trì vị trí xa nhất có thể tới. Tại mỗi vị trí trong tầm với, cập nhật tầm với mới. Nếu gặp vị trí nằm ngoài tầm với, không thể tiếp tục.

Đây là O(n) time, O(1) space, tốt hơn DP O(n²).

~~~java
public boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) return false;          // không tới được i
        farthest = Math.max(farthest, i + nums[i]);
        if (farthest >= nums.length - 1) return true;
    }
    return true;
}
~~~

### Lưu ý khi phỏng vấn
- {{i + nums[i]}} có thể tràn nếu ràng buộc lớn; với {{10^4 + 10^5}} vẫn an toàn, nhưng nên dùng {{long}} nếu mở rộng.
- Mảng một phần tử luôn trả true vì đã ở cuối.
- Câu hỏi tiếp: tìm số bước nhảy ít nhất (Jump Game II) — khi đó dùng BFS/greedy theo tầng, không chỉ farthest đơn thuần.

> Senior tip: Greedy đúng ở đây vì khả năng tới vị trí xa hơn luôn tốt hơn hoặc bằng, không có lý do chọn bước ngắn. Khi gặp bài greedy, hãy luôn tự hỏi "có phản ví dụ nào mà chọn xa hơn lại tệ hơn không?" — nếu không, đó là dấu hiệu tốt.`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Tìm số bước nhảy ít nhất thì làm thế nào?', 'Nếu có thể nhảy lùi thì bài toán thay đổi ra sao?']
},
{
  id: 'algo-044',
  title: 'Non-overlapping Intervals',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['intervals', 'greedy', 'sorting'],
  prompt: `Cho mảng {{intervals}} với {{intervals[i] = [start, end]}}. Tìm số khoảng tối thiểu cần xoá để các khoảng còn lại không giao nhau. Hai khoảng chỉ chạm nhau ở biên (end == start) được coi là không giao.

### Ví dụ
~~~text
Input:  intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Giải thích: xoá [1,3], còn [1,2],[2,3],[3,4].

Input:  intervals = [[1,2],[1,2],[1,2]]
Output: 2
~~~

### Ràng buộc
- {{1 <= intervals.length <= 10^5}}
- {{-5 * 10^4 <= start < end <= 5 * 10^4}}`,
  hints: [
    'Cần giữ nhiều khoảng nhất có thể. Đây là bài chọn hoạt động (activity selection).',
    'Sort theo thời điểm kết thúc tăng dần; khoảng kết thúc sớm luôn là lựa chọn tốt để nhường chỗ cho khoảng sau.',
    'Duyệt và giữ lại khoảng nếu start >= end của khoảng đã chọn gần nhất; ngược lại phải xoá.'
  ],
  solution: `### Ý tưởng
Sort theo end tăng dần. Giữ khoảng đầu tiên, sau đó duyệt: nếu khoảng hiện tại bắt đầu không sớm hơn end của khoảng đã giữ, giữ nó và cập nhật end; nếu giao, tăng biến đếm xoá.

Đây là greedy chuẩn cho activity selection, chứng minh bằng trao đổi: chọn khoảng kết thúc sớm nhất luôn không tệ hơn bất kỳ lựa chọn nào khác.

~~~java
public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int removed = 0;
    int lastEnd = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < lastEnd) {
            removed++;                 // giao với khoảng đã giữ
        } else {
            lastEnd = intervals[i][1];
        }
    }
    return removed;
}
~~~

### Lưu ý khi phỏng vấn
- Sort theo start là sai hướng cho bài này; hãy giải thích vì sao sort theo end mới tối ưu.
- Điều kiện {{<}} cho phép chạm biên; nếu đề coi chạm là giao, đổi thành {{<=}}.
- Comparator dùng {{a[1] - b[1]}} có thể tràn với giá trị lớn; dùng {{Integer.compare}}.

> Senior tip: Activity selection xuất hiện trong lập lịch job, chọn phòng họp, và tối ưu batch window. Khi có trọng số (mỗi job lợi nhuận khác nhau), greedy không còn đúng — phải chuyển sang weighted interval scheduling với DP + binary search.`,
  complexity: 'Time O(n log n), Space O(1) ngoài sort',
  follow: ['Nếu mỗi khoảng có trọng số thì giải thế nào?', 'Tìm số khoảng tối đa không giao thay vì số cần xoá thì sao?']
},
{
  id: 'algo-045',
  title: 'Token Bucket Rate Limiter',
  difficulty: 'medium',
  pattern: 'Practical',
  tags: ['java', 'concurrency', 'rate-limiting'],
  prompt: `Thiết kế một rate limiter theo thuật toán token bucket trong Java. Yêu cầu:

- Có sức chứa {{capacity}} token, nạp lại {{refillPerSecond}} token mỗi giây.
- {{tryAcquire(n)}} trả về true và trừ {{n}} token nếu đủ, ngược lại trả false.
- An toàn khi nhiều thread gọi đồng thời.
- Không dùng thư viện ngoài.

### Ví dụ
~~~text
bucket = new TokenBucket(10, 2);   // 10 token, nạp 2 token/giây
bucket.tryAcquire(10);             // true, còn 0
bucket.tryAcquire(1);              // false
chờ 1 giây
bucket.tryAcquire(2);              // true
~~~

### Ràng buộc
- {{1 <= capacity <= 10^6}}
- {{0 < refillPerSecond <= 10^6}}
- {{1 <= n <= capacity}}`,
  hints: [
    'Không cần thread nền nạp token liên tục; chỉ cần tính lượng token được nạp từ lần kiểm tra trước.',
    'Dùng {{System.nanoTime()}} để tránh ảnh hưởng của đồng hồ hệ thống bị chỉnh.',
    'Bọc phần refill + kiểm tra + trừ token trong một critical section (synchronized hoặc ReentrantLock).'
  ],
  solution: `### Ý tưởng
Lưu số token hiện có và thời điểm refill gần nhất. Mỗi lần gọi, tính token được nạp thêm dựa trên thời gian trôi qua, giới hạn ở {{capacity}}, rồi mới kiểm tra và trừ.

Toàn bộ thao tác nằm trong {{synchronized}} để tránh hai thread cùng thấy đủ token và cùng trừ.

~~~java
public final class TokenBucket {
    private final long capacity;
    private final double tokensPerNano;
    private double tokens;
    private long lastRefillNanos;

    public TokenBucket(long capacity, double tokensPerSecond) {
        this.capacity = capacity;
        this.tokensPerNano = tokensPerSecond / 1_000_000_000.0;
        this.tokens = capacity;
        this.lastRefillNanos = System.nanoTime();
    }

    public synchronized boolean tryAcquire(int n) {
        long now = System.nanoTime();
        double refill = (now - lastRefillNanos) * tokensPerNano;
        tokens = Math.min(capacity, tokens + refill);
        lastRefillNanos = now;
        if (tokens >= n) {
            tokens -= n;
            return true;
        }
        return false;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{double}} có sai số; với yêu cầu chính xác cao, lưu token dưới dạng số nguyên micro-token hoặc dùng {{long}} với đơn vị nhỏ hơn.
- {{synchronized}} đủ cho một instance; với throughput rất cao, dùng {{ReentrantLock}} hoặc {{LongAdder}}/CAS có thể giảm contention.
- Rate limiter phân tán cần trạng thái chia sẻ (Redis + Lua) hoặc thuật toán sliding window; token bucket cục bộ chỉ giới hạn theo từng instance.

> Senior tip: Trong API gateway, token bucket thường được cấu hình theo burst và sustained rate. Tôi từng gặp sự cố khi dùng {{System.currentTimeMillis()}} và NTP chỉnh giờ làm token nhảy vọt; {{nanoTime()}} là lựa chọn an toàn hơn cho khoảng thời gian.`,
  complexity: 'Time O(1) mỗi lần gọi, Space O(1)',
  follow: ['So sánh token bucket với sliding window log.', 'Làm sao triển khai rate limiter phân tán cho nhiều instance?']
},
{
  id: 'algo-046',
  title: 'Bounded Blocking Queue',
  difficulty: 'hard',
  pattern: 'Practical',
  tags: ['java', 'concurrency', 'producer-consumer'],
  prompt: `Cài đặt một hàng đợi có giới hạn sức chứa trong Java:

- {{put(item)}} chặn khi queue đầy cho đến khi có chỗ.
- {{take()}} chặn khi queue rỗng cho đến khi có phần tử.
- FIFO, thread-safe, phản ứng đúng với interrupt.
- Không dùng {{ArrayBlockingQueue}} hay {{LinkedBlockingQueue}} có sẵn.

### Ví dụ
~~~text
BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(2);
producer: q.put("a"); q.put("b"); q.put("c"); // chặn ở "c"
consumer: q.take(); // "a", producer được đánh thức
~~~

### Ràng buộc
- {{1 <= capacity <= 10^5}}
- Nhiều producer và nhiều consumer.
- Không chấp nhận busy-wait.`,
  hints: [
    'Cần một lock chung và hai condition: một cho "còn chỗ" (notFull), một cho "còn hàng" (notEmpty).',
    'Luôn kiểm tra điều kiện trong vòng {{while}}, không dùng {{if}}, vì có thể bị đánh thức giả (spurious wakeup).',
    'Dùng mảng vòng (circular buffer) với head, tail, size để có FIFO và O(1).'
  ],
  solution: `### Ý tưởng
Dùng {{ReentrantLock}} và hai {{Condition}}. Producer chờ trên {{notFull}} khi đầy; consumer chờ trên {{notEmpty}} khi rỗng. Sau khi thêm/bớt, signal condition còn lại.

Mảng vòng giúp thao tác O(1) và không cấp phát node.

~~~java
public final class BoundedBlockingQueue<T> {
    private final Object[] items;
    private int head, tail, size;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBlockingQueue(int capacity) {
        items = new Object[capacity];
    }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (size == items.length) notFull.await();
            items[tail] = item;
            tail = (tail + 1) % items.length;
            size++;
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (size == 0) notEmpty.await();
            T item = (T) items[head];
            items[head] = null;   // tránh giữ reference
            head = (head + 1) % items.length;
            size--;
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{await()}} có thể ném {{InterruptedException}}; không được nuốt exception, hãy để caller xử lý hoặc khôi phục interrupt.
- Dùng {{signal()}} thay vì {{signalAll()}} khi chỉ cần đánh thức một thread, nhưng phải đảm bảo đúng condition.
- Nếu cần fairness hoặc nhiều producer/consumer tranh chấp mạnh, cân nhắc {{ReentrantLock(true)}} hoặc tách lock theo head/tail.
- Hỏi thêm về shutdown: cần "poison pill" hoặc cờ dừng để consumer thoát an toàn.

> Senior tip: Đây là bài kiểm tra hiểu biết thực sự về {{Condition}} và memory visibility. Đừng trả lời bằng {{wait/notify}} trên object nếu có thể dùng {{ReentrantLock}}; code dễ đọc hơn và ít lỗi hơn. Trong production, hãy dùng {{ArrayBlockingQueue}} trừ khi có lý do đặc biệt để tự viết.`,
  complexity: 'Time O(1) mỗi thao tác, Space O(capacity)',
  follow: ['Làm sao hỗ trợ timeout cho put/take?', 'Thiết kế shutdown an toàn cho producer-consumer thế nào?']
},
{
  id: 'algo-047',
  title: 'Reconcile Two Transaction Lists',
  difficulty: 'medium',
  pattern: 'Practical',
  tags: ['java', 'hashmap', 'fintech', 'reconciliation'],
  prompt: `Bạn có hai danh sách giao dịch: {{ledger}} (hệ thống nội bộ) và {{bank}} (sao kê ngân hàng). Mỗi giao dịch gồm {{id}} và {{amountCents}} (số tiền tính bằng cent, có thể âm). Một id có thể xuất hiện nhiều lần do gộp giao dịch, nên cần cộng dồn theo id. Hãy trả về danh sách các id bị lệch số tiền, kèm số tiền kỳ vọng và thực tế, sắp xếp theo id.

### Ví dụ
~~~text
ledger = [(T1, 1000), (T1, 500), (T2, 2000)]
bank   = [(T1, 1500), (T3, 700)]

Output:
T2: expected=2000, actual=0
T3: expected=0, actual=700
~~~

### Ràng buộc
- {{0 <= số giao dịch mỗi bên <= 10^6}}
- {{-10^12 <= amountCents <= 10^12}}
- {{id}} là chuỗi không rỗng, tối đa 64 ký tự.`,
  hints: [
    'Cần so sánh tổng tiền theo từng id giữa hai nguồn.',
    'Cộng dồn vào hai {{HashMap<String, Long>}} rồi hợp các key lại để so sánh.',
    'Không dùng {{double}} cho tiền; dùng {{long}} cent hoặc {{BigDecimal}}. Cẩn thận id chỉ có ở một bên.'
  ],
  solution: `### Ý tưởng
Cộng dồn số tiền theo id cho từng nguồn bằng {{merge}}. Sau đó hợp các id, so sánh tổng; nếu khác nhau, ghi nhận chênh lệch. Sắp xếp kết quả để đầu ra ổn định.

Đây là bài đối soát cơ bản trong fintech: idempotent, có thể chạy lại, và không phụ thuộc thứ tự giao dịch.

~~~java
public record Txn(String id, long amountCents) {}

public static List<String> reconcile(List<Txn> ledger, List<Txn> bank) {
    Map<String, Long> expected = new HashMap<>();
    for (Txn t : ledger) expected.merge(t.id(), t.amountCents(), Long::sum);
    Map<String, Long> actual = new HashMap<>();
    for (Txn t : bank) actual.merge(t.id(), t.amountCents(), Long::sum);

    Set<String> ids = new HashSet<>(expected.keySet());
    ids.addAll(actual.keySet());
    List<String> diffs = new ArrayList<>();
    for (String id : ids) {
        long e = expected.getOrDefault(id, 0L);
        long a = actual.getOrDefault(id, 0L);
        if (e != a) {
            diffs.add(id + ": expected=" + e + ", actual=" + a);
        }
    }
    Collections.sort(diffs);
    return diffs;
}
~~~

### Lưu ý khi phỏng vấn
- {{String}} nối chuỗi trong vòng lặp lớn không hiệu quả; trong production nên trả về record {{Diff}} thay vì chuỗi.
- Cộng dồn {{long}} có thể tràn nếu số lượng giao dịch cực lớn; cân nhắc {{BigInteger}} hoặc kiểm tra ngưỡng.
- Nếu hai nguồn quá lớn không vừa RAM, phải sort ngoài (external merge) theo id rồi so sánh streaming.
- Cần hỏi rõ quy tắc: giao dịch bị huỷ, hoàn tiền, hay chênh lệch tỷ giá xử lý thế nào.

> Senior tip: Đối soát thật không chỉ là so tổng; phải xử lý trạng thái giao dịch, thời gian hiệu lực và tiền tệ. Một mẹo tôi dùng: lưu thêm checksum/version để phát hiện bản ghi bị sửa, và chạy đối soát theo cửa sổ thời gian thay vì toàn bộ lịch sử.`,
  complexity: 'Time O(n + m + u log u), Space O(u)',
  follow: ['Nếu dữ liệu lớn hơn RAM thì đối soát thế nào?', 'Làm sao xử lý giao dịch bị trùng hoặc gửi lại (idempotency)?']
},
{
  id: 'algo-048',
  title: 'Top K Frequent Log Entries',
  difficulty: 'medium',
  pattern: 'Practical',
  tags: ['java', 'hashmap', 'heap', 'streaming'],
  prompt: `Cho một luồng log (mỗi dòng là một chuỗi) và số {{k}}. Trả về {{k}} giá trị xuất hiện nhiều nhất, sắp xếp giảm dần theo tần suất; nếu tần suất bằng nhau, sắp xếp tăng dần theo giá trị để kết quả ổn định.

### Ví dụ
~~~text
logs = ["ERROR db", "ERROR db", "WARN cache", "ERROR db", "INFO ok"]
k = 2
Output: ["ERROR db", "INFO ok"]
Giải thích: "ERROR db" xuất hiện 3 lần; các giá trị còn lại
cùng 1 lần nên lấy theo thứ tự từ điển tăng dần.
~~~

### Ràng buộc
- {{1 <= số dòng <= 10^7}}
- {{1 <= k <= số giá trị phân biệt}}
- Mỗi dòng tối đa 256 ký tự.`,
  hints: [
    'Đếm tần suất bằng {{HashMap}} trước, sau đó mới chọn top-k.',
    'Giữ min-heap kích thước {{k}} theo tần suất để loại phần tử yếu nhất.',
    'Khi tần suất bằng nhau, cần tiêu chí phụ (ví dụ thứ tự từ điển) để kết quả ổn định và dễ test.'
  ],
  solution: `### Ý tưởng
Đếm tần suất bằng {{merge}}. Dùng min-heap kích thước {{k}}; comparator so sánh tần suất tăng dần, nếu bằng thì ưu tiên loại key lớn hơn theo từ điển. Cuối cùng lấy các phần tử trong heap và đảo lại để có thứ tự giảm dần.

Bộ nhớ O(số giá trị phân biệt), thời gian O(n + u log k).

~~~java
public List<String> topK(Stream<String> logs, int k) {
    Map<String, Integer> freq = new HashMap<>();
    logs.forEach(s -> freq.merge(s, 1, Integer::sum));

    PriorityQueue<Map.Entry<String, Integer>> heap =
        new PriorityQueue<>((a, b) -> {
            int byCount = Integer.compare(a.getValue(), b.getValue());
            if (byCount != 0) return byCount;
            return b.getKey().compareTo(a.getKey());   // key lớn bị loại trước
        });

    for (Map.Entry<String, Integer> e : freq.entrySet()) {
        heap.add(e);
        if (heap.size() > k) heap.poll();
    }

    List<String> result = new ArrayList<>(k);
    while (!heap.isEmpty()) result.add(heap.poll().getKey());
    Collections.reverse(result);
    return result;
}
~~~

### Lưu ý khi phỏng vấn
- Nếu số giá trị phân biệt quá lớn (hàng chục triệu), {{HashMap}} có thể OOM; khi đó dùng Count-Min Sketch hoặc chia batch/MapReduce.
- Với dữ liệu streaming vô hạn, top-k chính xác cần lưu toàn bộ tần suất; nếu chấp nhận xấp xỉ, dùng thuật toán heavy hitters.
- Không dùng {{a.getValue() - b.getValue()}} trong comparator vì có thể tràn; dùng {{Integer.compare}}.
- Hỏi lại: "log entry" là cả dòng hay đã tách thành field? Việc tách field ảnh hưởng lớn đến cardinality.

> Senior tip: Trong hệ thống log thật, top-k thường chạy theo cửa sổ thời gian (5 phút, 1 giờ) và theo chiều dimension (service, endpoint). Hãy nêu rõ bạn sẽ partition theo service trước khi đếm để tránh một node phải giữ toàn bộ cardinality.`,
  complexity: 'Time O(n + u log k), Space O(u)',
  follow: ['Nếu dữ liệu không vừa RAM thì thiết kế MapReduce thế nào?', 'Làm sao tìm top-k theo từng cửa sổ thời gian?']
}
);
