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
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        throw new IllegalArgumentException("no solution");
    }
}
~~~

### Lưu ý khi phỏng vấn
- Hỏi lại: mảng đã sort chưa? Nếu đã sort thì dùng **two pointers** để đạt O(1) space.
- Cẩn thận overflow khi tính {{target - nums[i]}} nếu ràng buộc lớn hơn (dùng {{long}}).

> Senior tip: Two Sum là bài hash map kinh điển; luôn hỏi interviewer về mảng đã sort và yêu cầu space để chọn two pointers.`,
  starter: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", new int[]{0, 1}, () -> new Solution().twoSum(new int[]{2, 7, 11, 15}, 9));
        run("two equal", new int[]{0, 1}, () -> new Solution().twoSum(new int[]{3, 3}, 6));
        run("negatives", new int[]{0, 2}, () -> new Solution().twoSum(new int[]{-3, 4, 3, 90}, 0));
        run("middle", new int[]{1, 2}, () -> new Solution().twoSum(new int[]{1, 5, 9}, 14));
        run("duplicates", new int[]{2, 3}, () -> new Solution().twoSum(new int[]{1, 2, 2, 3}, 5));
        run("large", new int[]{9998, 9999}, () -> {
            int[] a = new int[10000];
            for (int i = 0; i < a.length; i++) a[i] = i + 1;
            return new Solution().twoSum(a, 19999);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) {   // add returns false if already present
                return true;
            }
        }
        return false;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nêu rõ trade-off: hash set nhanh nhưng tốn bộ nhớ; sort tiết kiệm bộ nhớ nhưng chậm hơn và có thể làm thay đổi input.
- Với dữ liệu cực lớn không vừa RAM, có thể dùng bitmap nếu miền giá trị nhỏ, hoặc Bloom filter để lọc trước (chấp nhận false positive).
- Đừng dùng {{HashSet<int[]>}} hay so sánh mảng bằng {{==}} — với primitive thì ổn, nhưng với object cần hiểu {{equals/hashCode}}.

> Senior tip: Trong pipeline ingest log, tôi thường dùng cách sort + so sánh kề khi batch khoảng vài triệu ID và cần tiết kiệm heap; còn với stream realtime thì hash set kèm giới hạn kích thước hoặc cửa sổ thời gian để tránh OOM.`,
  starter: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example true", true, () -> new Solution().containsDuplicate(new int[]{1, 2, 3, 1}));
        run("no duplicate", false, () -> new Solution().containsDuplicate(new int[]{1, 2, 3, 4}));
        run("single", false, () -> new Solution().containsDuplicate(new int[]{1}));
        run("negative duplicate", true, () -> new Solution().containsDuplicate(new int[]{-5, 0, -5}));
        run("large unique", false, () -> {
            int[] a = new int[100000];
            for (int i = 0; i < a.length; i++) a[i] = i;
            return new Solution().containsDuplicate(a);
        });
        run("large duplicate", true, () -> {
            int[] a = new int[100000];
            for (int i = 0; i < a.length; i++) a[i] = i;
            a[0] = 99999;
            return new Solution().containsDuplicate(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu input có Unicode, mảng 26 không đủ; dùng {{HashMap<Character, Integer>}} hoặc đếm theo code point.
- Có thể sort cả hai chuỗi rồi so sánh: O(n log n), code ngắn nhưng tốn thêm bộ nhớ.
- Hỏi lại xem có phân biệt hoa/thường và có bỏ qua khoảng trắng hay không — đề thực tế thường khác đề LeetCode.

> Senior tip: Với so khớp chữ ký (signature) trong hệ thống search, đếm tần số 26 ô nhanh hơn tạo sorted key rất nhiều; nhưng nếu cần key bền vững để cache thì nên chuẩn hoá thành mảng byte rồi băm.`,
  starter: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", true, () -> new Solution().isAnagram("anagram", "nagaram"));
        run("not anagram", false, () -> new Solution().isAnagram("rat", "car"));
        run("empty", true, () -> new Solution().isAnagram("", ""));
        run("single same", true, () -> new Solution().isAnagram("a", "a"));
        run("different length", false, () -> new Solution().isAnagram("ab", "a"));
        run("long", true, () -> new Solution().isAnagram("a".repeat(50000), "a".repeat(50000)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu chuỗi rỗng, key là chuỗi rỗng — vẫn hoạt động bình thường.
- Cẩn thận khi tự tạo key bằng cách nối tần số: phải có separator rõ ràng, nếu không {{"1,11"}} và {{"11,1"}} có thể va chạm.
- Trình bày thêm phương án sort: đơn giản, dễ đọc; phương án đếm tần số nhanh hơn với chuỗi dài nhưng code phức tạp hơn.

> Senior tip: Khi nhóm dữ liệu lớn trong batch job, tôi thường chọn key là mảng byte đã sort rồi băm bằng một hash ổn định; điều này tránh cấp phát String tạm cho hàng chục triệu bản ghi.`,
  starter: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static List<List<String>> normStr(List<List<String>> x) {
        List<List<String>> copy = new ArrayList<>();
        for (List<String> row : x) {
            List<String> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> String.join("|", a).compareTo(String.join("|", b)));
        return copy;
    }

    public static void main(String[] args) {
        run("example", normStr(Arrays.asList(
                Arrays.asList("ate", "eat", "tea"),
                Arrays.asList("nat", "tan"),
                Arrays.asList("bat"))),
            () -> normStr(new Solution().groupAnagrams(new String[]{"eat", "tea", "tan", "ate", "nat", "bat"})));
        run("single", normStr(Arrays.asList(Arrays.asList("a"))),
            () -> normStr(new Solution().groupAnagrams(new String[]{"a"})));
        run("two empty", normStr(Arrays.asList(Arrays.asList("", ""))),
            () -> normStr(new Solution().groupAnagrams(new String[]{"", ""})));
        run("distinct", normStr(Arrays.asList(Arrays.asList("abc"), Arrays.asList("def"))),
            () -> normStr(new Solution().groupAnagrams(new String[]{"abc", "def"})));
        run("all same", normStr(Arrays.asList(Arrays.asList("a", "a", "a"))),
            () -> normStr(new Solution().groupAnagrams(new String[]{"a", "a", "a"})));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện {{left < right}} trong các vòng lặp bỏ qua rất quan trọng, nếu không sẽ vượt biên với chuỗi toàn dấu câu.
- Hỏi lại: có cần xử lý Unicode (dấu tiếng Việt, emoji) không? {{Character}} chỉ xử lý theo code unit, chưa đủ cho mọi ngôn ngữ.
- Cách tạo chuỗi chuẩn hoá dễ đọc hơn nhưng O(n) bộ nhớ; nêu trade-off trước khi code.

> Senior tip: Với kiểm tra palindrome trong luồng xử lý văn bản lớn, tránh {{toLowerCase()}} trên toàn chuỗi vì có thể nhân đôi bộ nhớ; so sánh từng ký tự tại chỗ như trên thường nhanh và ít GC hơn.`,
  starter: "class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", true, () -> new Solution().isPalindrome("A man, a plan, a canal: Panama"));
        run("not palindrome", false, () -> new Solution().isPalindrome("race a car"));
        run("space only", true, () -> new Solution().isPalindrome(" "));
        run("digits and letter", false, () -> new Solution().isPalindrome("0P"));
        run("punctuation only", true, () -> new Solution().isPalindrome(".,"));
        run("underscore", true, () -> new Solution().isPalindrome("ab_a"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;   // skip duplicate outer values
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
}
~~~

### Lưu ý khi phỏng vấn
- Không được dùng cùng một phần tử hai lần: hai con trỏ bắt đầu từ {{i + 1}} đảm bảo điều đó.
- Tổng ba số có thể vượt {{int}} nếu ràng buộc lớn hơn; ở đây {{10^5}} vẫn an toàn nhưng nên chủ động hỏi.
- Trình bày rõ tại sao sort không làm mất nghiệm: ta tìm theo giá trị, không theo thứ tự ban đầu.

> Senior tip: 3Sum là bài rất hay bị hỏi tiếp "nếu mảng streaming thì sao?". Câu trả lời: không thể sort streaming; phải dùng hash theo cặp hoặc chấp nhận lưu toàn bộ.`,
  starter: "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static List<List<Integer>> norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example", norm(Arrays.asList(ints(-1, -1, 2), ints(-1, 0, 1))),
            () -> norm(new Solution().threeSum(new int[]{-1, 0, 1, 2, -1, -4})));
        run("no triplet", norm(new ArrayList<List<Integer>>()),
            () -> norm(new Solution().threeSum(new int[]{0, 1, 2})));
        run("three zeros", norm(Arrays.asList(ints(0, 0, 0))),
            () -> norm(new Solution().threeSum(new int[]{0, 0, 0})));
        run("two answers", norm(Arrays.asList(ints(-2, 0, 2), ints(-2, 1, 1))),
            () -> norm(new Solution().threeSum(new int[]{-2, 0, 1, 1, 2})));
        run("no solution", norm(new ArrayList<List<Integer>>()),
            () -> norm(new Solution().threeSum(new int[]{1, 2, -2, -1})));
        run("many zeros", norm(Arrays.asList(ints(0, 0, 0))),
            () -> norm(new Solution().threeSum(new int[1000])));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Diện tích tối đa có thể tới {{10^4 * 10^5 = 10^9}}, vẫn nằm trong {{int}}; nhưng nếu ràng buộc lớn hơn thì dùng {{long}}.
- Khi hai vách bằng nhau, di chuyển bên nào cũng được; giải thích rằng không làm mất nghiệm tối ưu.
- Đừng nhầm với bài Trapping Rain Water: bài này chỉ chọn hai vách, không tính nước bị chặn ở giữa.

> Senior tip: Câu hỏi tiếp hay gặp là "chứng minh greedy đúng". Hãy nói: khi bỏ vách thấp hơn, mọi cặp chứa nó đều có chiều cao tối đa bằng chính nó, mà khoảng cách đã lớn nhất tại thời điểm xét, nên không thể tốt hơn.`,
  starter: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 49, () -> new Solution().maxArea(new int[]{1, 8, 6, 2, 5, 4, 8, 3, 7}));
        run("two bars", 2, () -> new Solution().maxArea(new int[]{2, 4}));
        run("equal one", 1, () -> new Solution().maxArea(new int[]{1, 1}));
        run("decreasing", 6, () -> new Solution().maxArea(new int[]{5, 4, 3, 2, 1}));
        run("zeros", 0, () -> new Solution().maxArea(new int[]{0, 0, 0}));
        run("large plateau", 99990000, () -> {
            int[] a = new int[10000];
            Arrays.fill(a, 10000);
            return new Solution().maxArea(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện so sánh có thể dùng {{height[left] < height[right]}} hoặc {{leftMax < rightMax}}; cả hai đều đúng nhưng cần giải thích nhất quán.
- Tổng nước có thể vượt {{int}} nếu mảng rất lớn; với ràng buộc trên thì {{2*10^4 * 10^5 = 2*10^9}} vẫn có thể tràn {{int}} (gần 2.1 tỷ). Nên dùng {{long}} để an toàn.
- Nêu thêm cách prefix/suffix max dễ hiểu hơn, và cách stack monotonic để so sánh.

> Senior tip: Bài này là ví dụ kinh điển cho việc "giảm bộ nhớ nhưng không đổi độ phức tạp". Trong phỏng vấn, tôi đánh giá cao ứng viên biết vẽ hình và giải thích bất biến của hai con trỏ hơn là chỉ đọc thuộc code.`,
  starter: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 6, () -> new Solution().trap(new int[]{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}));
        run("second example", 9, () -> new Solution().trap(new int[]{4, 2, 0, 3, 2, 5}));
        run("single", 0, () -> new Solution().trap(new int[]{0}));
        run("flat", 0, () -> new Solution().trap(new int[]{3, 3, 3}));
        run("valley", 5, () -> new Solution().trap(new int[]{5, 0, 5}));
        run("small valley", 1, () -> new Solution().trap(new int[]{4, 2, 3}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int best = 0;
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            best = Math.max(best, price - minPrice);
        }
        return best;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đảm bảo mua trước bán: vì {{minPrice}} chỉ lấy từ các ngày trước hoặc bằng ngày hiện tại, điều kiện được giữ tự nhiên.
- Nếu giá có thể âm hoặc chênh lệch vượt {{int}}, dùng {{long}} cho lợi nhuận.
- Hỏi lại: có được giao dịch nhiều lần không? Nếu có, bài toán chuyển thành cộng các đoạn tăng (Best Time II).

> Senior tip: Bài này thường được dùng để kiểm tra tư duy trạng thái. Ứng viên hay viết vòng lặp hai lớp; hãy chỉ ra rằng trạng thái chỉ gồm "min đến hiện tại" và "best đến hiện tại", nên O(n) là đủ.`,
  starter: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 5, () -> new Solution().maxProfit(new int[]{7, 1, 5, 3, 6, 4}));
        run("decreasing", 0, () -> new Solution().maxProfit(new int[]{7, 6, 4, 3, 1}));
        run("single", 0, () -> new Solution().maxProfit(new int[]{1}));
        run("rise then fall", 2, () -> new Solution().maxProfit(new int[]{2, 4, 1}));
        run("flat", 0, () -> new Solution().maxProfit(new int[]{3, 3, 3}));
        run("large ramp", 9999, () -> {
            int[] a = new int[10000];
            for (int i = 0; i < a.length; i++) a[i] = i + 1;
            return new Solution().maxProfit(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] lastSeen = new int[128];
        Arrays.fill(lastSeen, -1);
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastSeen[c] >= left) {
                left = lastSeen[c] + 1;   // jump past the repeated char
            }
            lastSeen[c] = right;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Mảng 128 chỉ đúng với ASCII. Với Unicode, dùng {{HashMap<Character, Integer>}} hoặc thao tác theo code point.
- Chuỗi rỗng trả về 0; vòng lặp tự nhiên xử lý đúng.
- Có thể dùng {{Set}} và while để thu hẹp — dễ hiểu hơn nhưng có thể O(2n) thao tác; vẫn là O(n).

> Senior tip: Với dữ liệu log, tôi hay gặp biến thể "cửa sổ không có ID lặp trong 5 phút". Cùng một khung sliding window, nhưng cần thêm chiều thời gian và eviction theo timestamp; hãy hỏi rõ trước khi lao vào code.`,
  starter: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example 1", 3, () -> new Solution().lengthOfLongestSubstring("abcabcbb"));
        run("example 2", 1, () -> new Solution().lengthOfLongestSubstring("bbbbb"));
        run("example 3", 3, () -> new Solution().lengthOfLongestSubstring("pwwkew"));
        run("empty", 0, () -> new Solution().lengthOfLongestSubstring(""));
        run("space", 1, () -> new Solution().lengthOfLongestSubstring(" "));
        run("dvdf", 3, () -> new Solution().lengthOfLongestSubstring("dvdf"));
        run("alphabet", 26, () -> new Solution().lengthOfLongestSubstring("abcdefghijklmnopqrstuvwxyz"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu không tự tin với tối ưu {{maxCount}}, có thể tính lại max mỗi lần — O(26n), vẫn chấp nhận được và dễ chứng minh hơn.
- Phải giải thích rõ vì sao không giảm {{maxCount}}: nó chỉ là cận trên, và ta đang tìm max length nên không cần cửa sổ nhỏ hơn kết quả tốt nhất đã thấy.
- Hỏi lại bảng chữ cái có cố định 26 ký tự không; nếu Unicode thì dùng HashMap.

> Senior tip: Đây là bài rất hợp để thể hiện khả năng chứng minh tính đúng đắn thay vì chỉ code. Trong production, biến thể "ít nhất k lần sửa" xuất hiện khi chuẩn hoá dữ liệu người dùng trước khi so khớp.`,
  starter: "class Solution {\n    public int characterReplacement(String s, int k) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example 1", 4, () -> new Solution().characterReplacement("ABAB", 2));
        run("example 2", 4, () -> new Solution().characterReplacement("AABABBA", 1));
        run("no replacement", 1, () -> new Solution().characterReplacement("ABCD", 0));
        run("all same", 4, () -> new Solution().characterReplacement("AAAA", 2));
        run("single", 1, () -> new Solution().characterReplacement("A", 0));
        run("three b", 4, () -> new Solution().characterReplacement("ABBB", 2));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{while (need[c] == 0)}} hay so sánh map trực tiếp nếu chưa chắc; biến {{missing}} là cách gọn và ít lỗi nhất.
- Xử lý trường hợp {{t}} dài hơn {{s}} hoặc không đủ ký tự: trả về chuỗi rỗng.
- Với Unicode, mảng 128 không đủ; dùng HashMap và cẩn thận với surrogate pair.

> Senior tip: Bài này là bài "kể chuyện" rất tốt: nói rõ mỗi ký tự được thêm và bớt tối đa một lần, nên dù có vòng while bên trong, tổng thời gian vẫn O(n). Đừng để người phỏng vấn nghĩ đó là O(n²).`,
  starter: "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", "BANC", () -> new Solution().minWindow("ADOBECODEBANC", "ABC"));
        run("single", "a", () -> new Solution().minWindow("a", "a"));
        run("impossible", "", () -> new Solution().minWindow("a", "aa"));
        run("same string", "aa", () -> new Solution().minWindow("aa", "aa"));
        run("one char", "b", () -> new Solution().minWindow("ab", "b"));
        run("long", "cwae", () -> new Solution().minWindow("cabwefgewcwaefgcf", "cae"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') {
                stack.push(')');
            } else if (c == '[') {
                stack.push(']');
            } else if (c == '{') {
                stack.push('}');
            } else {
                if (stack.isEmpty() || stack.pop() != c) return false;
            }
        }
        return stack.isEmpty();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Chuỗi có độ dài lẻ chắc chắn sai — có thể return sớm để tối ưu.
- Dùng {{ArrayDeque}} thay cho {{Stack}} cũ: nhanh hơn và không bị đồng bộ hoá không cần thiết.
- Nếu gặp ký tự lạ, cần hỏi lại đề: bỏ qua hay coi là không hợp lệ?

> Senior tip: Trong parser cấu hình hoặc kiểm tra JSON fragment, stack ngoặc là bước đầu; nhưng đừng quên rằng ngoặc trong chuỗi (string literal) phải được bỏ qua — đó là câu hỏi follow-up rất hay gặp.`,
  starter: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", true, () -> new Solution().isValid("()[]{}"));
        run("wrong pair", false, () -> new Solution().isValid("(]"));
        run("wrong order", false, () -> new Solution().isValid("([)]"));
        run("closing only", false, () -> new Solution().isValid("]"));
        run("nested", true, () -> new Solution().isValid("{[]}"));
        run("unclosed", false, () -> new Solution().isValid("((("));
        run("long nested", true, () -> {
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < 5000; i++) b.append('(');
            for (int i = 0; i < 5000; i++) b.append(')');
            return new Solution().isValid(b.toString());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
  starter: "class MinStack {\n    public MinStack() {\n        \n    }\n    public void push(int val) {\n        \n    }\n    public void pop() {\n        \n    }\n    public int top() {\n        return 0;\n    }\n    public int getMin() {\n        return 0;\n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        runSteps("example", () -> {
            MinStack st = new MinStack();
            st.push(-2);
            st.push(0);
            st.push(-3);
            eq("min after pushes", -3, st.getMin());
            st.pop();
            eq("top after pop", 0, st.top());
            eq("min after pop", -2, st.getMin());
        });
        runSteps("duplicates", () -> {
            MinStack st = new MinStack();
            st.push(1);
            st.push(0);
            st.push(0);
            eq("min 1", 0, st.getMin());
            st.pop();
            eq("min 2", 0, st.getMin());
            st.pop();
            eq("min 3", 1, st.getMin());
        });
        runSteps("decreasing", () -> {
            MinStack st = new MinStack();
            st.push(3);
            st.push(2);
            st.push(1);
            eq("min 1", 1, st.getMin());
            st.pop();
            eq("min 2", 2, st.getMin());
        });
        runSteps("integer min", () -> {
            MinStack st = new MinStack();
            st.push(Integer.MIN_VALUE);
            eq("min", Integer.MIN_VALUE, st.getMin());
            eq("top", Integer.MIN_VALUE, st.top());
        });
        runSteps("top order", () -> {
            MinStack st = new MinStack();
            st.push(5);
            st.push(6);
            eq("top 6", 6, st.top());
            st.pop();
            eq("top 5", 5, st.top());
        });
        runSteps("single", () -> {
            MinStack st = new MinStack();
            st.push(42);
            eq("top", 42, st.top());
            eq("min", 42, st.getMin());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();   // indices, temperatures decreasing
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int j = stack.pop();
                answer[j] = i - j;
            }
            stack.push(i);
        }
        return answer;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dùng dấu {{>}} hay {{>=}}? Với yêu cầu "ấm hơn" (strictly greater), dùng {{>}}; nếu "ấm hơn hoặc bằng" thì đổi điều kiện.
- Stack lưu chỉ số, không lưu nhiệt độ, vì cần tính khoảng cách ngày.
- Có thể duyệt từ phải sang trái với next greater; hãy chọn một hướng và giải thích nhất quán.

> Senior tip: Monotonic stack là pattern xuất hiện rất nhiều trong bài toán tài chính (thời điểm giá vượt đỉnh cũ) và observability (thời điểm latency vượt ngưỡng). Hãy nhớ bất biến của stack thay vì học thuộc code.`,
  starter: "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", new int[]{1, 1, 4, 2, 1, 1, 0, 0},
            () -> new Solution().dailyTemperatures(new int[]{73, 74, 75, 71, 69, 72, 76, 73}));
        run("all equal", new int[]{0, 0, 0},
            () -> new Solution().dailyTemperatures(new int[]{1, 1, 1}));
        run("single", new int[]{0},
            () -> new Solution().dailyTemperatures(new int[]{30}));
        run("increasing", new int[]{1, 1, 0},
            () -> new Solution().dailyTemperatures(new int[]{30, 40, 50}));
        run("decreasing", new int[]{0, 0, 0},
            () -> new Solution().dailyTemperatures(new int[]{50, 40, 30}));
        run("large decreasing", new int[100000], () -> {
            int[] a = new int[100000];
            for (int i = 0; i < a.length; i++) a[i] = 100000 - i;
            return new Solution().dailyTemperatures(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Khi có chiều cao bằng nhau, dùng {{>}} giữ cột bên trái lại và vẫn tính đúng chiều rộng; nếu dùng {{>=}} cũng được nhưng phải giải thích.
- Diện tích có thể vượt {{int}} nếu chiều cao và chiều dài lớn; cân nhắc {{long}}.
- Đừng quên cột có chiều cao 0 — chúng vẫn là biên hợp lệ.

> Senior tip: Bài này thường xuất hiện dưới dạng "largest rectangle in binary matrix". Khi đó mỗi hàng là một histogram và bạn cộng dồn chiều cao theo cột; pattern stack giữ nguyên, chỉ thêm một vòng lặp ngoài.`,
  starter: "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 10, () -> new Solution().largestRectangleArea(new int[]{2, 1, 5, 6, 2, 3}));
        run("two bars", 4, () -> new Solution().largestRectangleArea(new int[]{2, 4}));
        run("zero", 0, () -> new Solution().largestRectangleArea(new int[]{0}));
        run("one", 1, () -> new Solution().largestRectangleArea(new int[]{1}));
        run("flat", 6, () -> new Solution().largestRectangleArea(new int[]{2, 2, 2}));
        run("mixed", 12, () -> new Solution().largestRectangleArea(new int[]{6, 2, 5, 4, 5, 1, 6}));
        run("large flat", 100000, () -> {
            int[] a = new int[100000];
            Arrays.fill(a, 1);
            return new Solution().largestRectangleArea(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{(lo + hi) / 2}} với mảng cực lớn vì có thể tràn {{int}}.
- Nếu dùng khoảng nửa mở {{[lo, hi)}}, điều kiện là {{lo < hi}} và cập nhật {{hi = mid}}; đừng trộn hai quy ước.
- Hỏi lại mảng có phần tử trùng không; nếu có, bài toán có thể cần tìm biên trái/phải.

> Senior tip: Binary search là nơi lỗi off-by-one xuất hiện nhiều nhất trong phỏng vấn. Tôi luôn yêu cầu ứng viên viết ra bất biến "target nằm trong [lo, hi] nếu tồn tại" và kiểm tra với mảng 1 phần tử, 2 phần tử trước khi kết luận.`,
  starter: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example found", 4, () -> new Solution().search(new int[]{-1, 0, 3, 5, 9, 12}, 9));
        run("example missing", -1, () -> new Solution().search(new int[]{-1, 0, 3, 5, 9, 12}, 2));
        run("single found", 0, () -> new Solution().search(new int[]{5}, 5));
        run("single missing", -1, () -> new Solution().search(new int[]{5}, 4));
        run("last", 1, () -> new Solution().search(new int[]{1, 3}, 3));
        run("first", 0, () -> new Solution().search(new int[]{1, 3, 5, 7, 9}, 1));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {              // left half sorted
                if (target >= nums[lo] && target < nums[mid]) {
                    hi = mid - 1;
                } else {
                    lo = mid + 1;
                }
            } else {                                   // right half sorted
                if (target > nums[mid] && target <= nums[hi]) {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
        }
        return -1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phải dùng {{<=}} ở điều kiện {{nums[lo] <= nums[mid]}} để xử lý mảng chỉ còn 1-2 phần tử.
- Nếu mảng có phần tử trùng, việc xác định nửa sorted có thể nhập nhằng; worst case O(n), cần nêu rõ.
- Kiểm tra nhanh với mảng không xoay, xoay 1 phần tử, target ở hai đầu.

> Senior tip: Bài này kiểm tra khả năng giữ bất biến khi điều kiện phức tạp. Trong thực tế, dữ liệu "sorted rồi append" rất hay gặp (log theo thời gian, ring buffer); hiểu bài này giúp bạn chọn đúng cấu trúc thay vì tìm kiếm tuyến tính.`,
  starter: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example found", 4, () -> new Solution().search(new int[]{4, 5, 6, 7, 0, 1, 2}, 0));
        run("example missing", -1, () -> new Solution().search(new int[]{4, 5, 6, 7, 0, 1, 2}, 3));
        run("single", 0, () -> new Solution().search(new int[]{1}, 1));
        run("two rotated", 1, () -> new Solution().search(new int[]{3, 1}, 1));
        run("pivot first", 0, () -> new Solution().search(new int[]{5, 1, 3}, 5));
        run("not rotated", 2, () -> new Solution().search(new int[]{1, 2, 3}, 3));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Tổng số giờ có thể vượt {{int}}; dùng {{long}} và thoát sớm khi đã lớn hơn {{h}}.
- Biên {{lo < hi}} với cập nhật {{hi = mid}} là chuẩn cho "tìm min thoả mãn"; đừng dùng {{lo <= hi}} dễ lặp vô hạn.
- Hỏi lại: có được bỏ dở giờ khi ăn hết đống không? Đề chuẩn là mỗi giờ chỉ ăn một đống, phần dư không chuyển sang đống khác.

> Senior tip: Dạng binary search on answer rất hữu ích cho tuning: tìm batch size nhỏ nhất đạt throughput, tìm timeout nhỏ nhất mà error rate vẫn ổn. Điều kiện tiên quyết luôn là tính đơn điệu — hãy chứng minh trước khi code.`,
  starter: "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example 1", 4, () -> new Solution().minEatingSpeed(new int[]{3, 6, 7, 11}, 8));
        run("example 2", 30, () -> new Solution().minEatingSpeed(new int[]{30, 11, 23, 4, 20}, 5));
        run("single pile one hour", 1, () -> new Solution().minEatingSpeed(new int[]{1}, 1));
        run("large pile", 500000000, () -> new Solution().minEatingSpeed(new int[]{1000000000}, 2));
        run("huge single", 312884470, () -> new Solution().minEatingSpeed(new int[]{312884470}, 1));
        run("three equal", 3, () -> new Solution().minEatingSpeed(new int[]{805306368, 805306368, 805306368}, 1000000000));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{-5000 <= Node.val <= 5000}}

{{ListNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng và so sánh danh sách).`,
  hints: [
    'Cần đổi hướng từng cạnh {{next}}. Nhưng nếu đổi ngay, bạn sẽ mất phần còn lại của danh sách.',
    'Dùng ba con trỏ: {{prev}}, {{cur}}, {{next}}; lưu {{next}} trước khi đổi {{cur.next}}.',
    'Sau khi duyệt hết, {{prev}} chính là đầu mới; {{cur}} là null.'
  ],
  solution: `### Ý tưởng
Duyệt danh sách một lượt. Ở mỗi node, lưu node kế tiếp, trỏ {{cur.next}} về {{prev}}, rồi tiến cả hai con trỏ. Khi kết thúc, {{prev}} là đầu mới.

Đây là thao tác tại chỗ, không cấp phát node mới.

~~~java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode cur = head;
        while (cur != null) {
            ListNode next = cur.next;   // keep the rest
            cur.next = prev;            // reverse link
            prev = cur;
            cur = next;
        }
        return prev;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Danh sách rỗng trả về null; danh sách một node trả về chính nó — vòng lặp xử lý đúng.
- Nếu được hỏi đệ quy, code ngắn hơn nhưng tốn O(n) stack, có thể tràn với danh sách rất dài.
- Hỏi lại: có được phép đổi giá trị thay vì liên kết không? Thường đề yêu cầu đổi liên kết để thể hiện hiểu con trỏ.

> Senior tip: Trong code production, reverse linked list xuất hiện khi đảo chiều lịch sử sự kiện hoặc xử lý đệ quy ngược. Nhưng với danh sách rất lớn, hãy cân nhắc mảng hoặc cấu trúc có truy cập ngẫu nhiên thay vì linked list vì cache locality kém.`,
  starter: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
  tests: `
class ListNode {
    int val;
    ListNode next;
    ListNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static ListNode build(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int v : vals) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }
    static ListNode range(int a, int b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int i = a; i <= b; i++) {
            tail.next = new ListNode(i);
            tail = tail.next;
        }
        return dummy.next;
    }
    static List<Integer> toList(ListNode h) {
        List<Integer> r = new ArrayList<>();
        while (h != null) { r.add(h.val); h = h.next; }
        return r;
    }

    public static void main(String[] args) {
        run("empty", ints(), () -> toList(new Solution().reverseList(null)));
        run("single", ints(7), () -> toList(new Solution().reverseList(build(7))));
        run("example", ints(5, 4, 3, 2, 1), () -> toList(new Solution().reverseList(build(1, 2, 3, 4, 5))));
        run("two", ints(2, 1), () -> toList(new Solution().reverseList(build(1, 2))));
        run("duplicates", ints(2, 2, 1), () -> toList(new Solution().reverseList(build(1, 2, 2))));
        runSteps("large", () -> {
            ListNode h = range(1, 5000);
            ListNode r = new Solution().reverseList(h);
            int count = 0;
            ListNode p = r;
            while (p != null) { count++; p = p.next; }
            eq("size", 5000, count);
            eq("head", 5000, r.val);
            ListNode tail = r;
            while (tail.next != null) tail = tail.next;
            eq("tail", 1, tail.val);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- Cả hai danh sách đã sắp xếp tăng dần.

{{ListNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng và so sánh danh sách).`,
  hints: [
    'Giống bước merge trong merge sort: so sánh hai đầu danh sách và lấy node nhỏ hơn.',
    'Dùng node giả (dummy) để tránh phải xử lý đặc biệt cho phần tử đầu tiên.',
    'Sau khi một danh sách hết, nối nguyên phần còn lại của danh sách kia — không cần copy.'
  ],
  solution: `### Ý tưởng
Tạo {{dummy}} và con trỏ {{tail}}. Mỗi bước so sánh {{l1.val}} và {{l2.val}}, nối node nhỏ hơn vào sau {{tail}}, rồi tiến con trỏ tương ứng. Khi một bên hết, nối phần còn lại của bên kia.

~~~java
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{<=}} để giữ tính ổn định (stable) khi giá trị bằng nhau — quan trọng nếu node còn dữ liệu phụ.
- Không cần duyệt phần còn lại; nối con trỏ là đủ, tiết kiệm O(n).
- Hỏi lại danh sách có được phép sửa tại chỗ không; đề chuẩn cho phép nối node.

> Senior tip: Merge hai danh sách sorted là nền tảng của external merge sort. Khi merge các file log đã sort, cùng logic này áp dụng với iterator/buffer thay vì node, nhưng nguyên tắc "lấy nhỏ hơn, nối phần còn lại" không đổi.`,
  starter: "class Solution {\n    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n        \n    }\n}",
  tests: `
class ListNode {
    int val;
    ListNode next;
    ListNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static ListNode build(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int v : vals) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }
    static ListNode range(int a, int b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int i = a; i <= b; i++) {
            tail.next = new ListNode(i);
            tail = tail.next;
        }
        return dummy.next;
    }
    static List<Integer> toList(ListNode h) {
        List<Integer> r = new ArrayList<>();
        while (h != null) { r.add(h.val); h = h.next; }
        return r;
    }

    public static void main(String[] args) {
        run("example", ints(1, 1, 2, 3, 4, 4),
            () -> toList(new Solution().mergeTwoLists(build(1, 2, 4), build(1, 3, 4))));
        run("one empty", ints(0), () -> toList(new Solution().mergeTwoLists(null, build(0))));
        run("both empty", ints(), () -> toList(new Solution().mergeTwoLists(null, null)));
        run("left empty", ints(1, 2, 3), () -> toList(new Solution().mergeTwoLists(null, build(1, 2, 3))));
        run("duplicates", ints(1, 1, 2, 2, 3),
            () -> toList(new Solution().mergeTwoLists(build(1, 2, 2), build(1, 3))));
        run("large", seq(1, 100), () -> toList(new Solution().mergeTwoLists(range(1, 50), range(51, 100))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
  starter: "class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    public int get(int key) {\n        return -1;\n    }\n    public void put(int key, int value) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        runSteps("example", () -> {
            LRUCache cache = new LRUCache(2);
            cache.put(1, 1);
            cache.put(2, 2);
            eq("get 1", 1, cache.get(1));
            cache.put(3, 3);
            eq("evicted 2", -1, cache.get(2));
            cache.put(4, 4);
            eq("evicted 1", -1, cache.get(1));
            eq("get 3", 3, cache.get(3));
            eq("get 4", 4, cache.get(4));
        });
        runSteps("capacity one", () -> {
            LRUCache cache = new LRUCache(1);
            cache.put(1, 1);
            eq("first", 1, cache.get(1));
            cache.put(2, 2);
            eq("evicted", -1, cache.get(1));
            eq("second", 2, cache.get(2));
        });
        runSteps("update existing", () -> {
            LRUCache cache = new LRUCache(2);
            cache.put(1, 1);
            cache.put(2, 2);
            cache.put(1, 10);
            eq("updated", 10, cache.get(1));
            cache.put(3, 3);
            eq("evict 2", -1, cache.get(2));
            eq("keep 3", 3, cache.get(3));
        });
        runSteps("get refreshes", () -> {
            LRUCache cache = new LRUCache(2);
            cache.put(1, 1);
            cache.put(2, 2);
            eq("get 1", 1, cache.get(1));
            cache.put(3, 3);
            eq("evict 2", -1, cache.get(2));
            eq("get 3", 3, cache.get(3));
        });
        runSteps("miss", () -> {
            LRUCache cache = new LRUCache(2);
            cache.put(1, 1);
            eq("miss", -1, cache.get(9));
            cache.put(2, 2);
            eq("still 1", 1, cache.get(1));
            eq("still 2", 2, cache.get(2));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{-10^4 <= Node.val <= 10^4}}

{{ListNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng và so sánh danh sách).`,
  hints: [
    'Nếu merge tuần tự từng danh sách, mỗi lần phải duyệt lại phần đã merge — chậm.',
    'Cần cấu trúc luôn lấy được node nhỏ nhất trong {{k}} đầu danh sách: min-heap (PriorityQueue).',
    'Sau khi lấy một node, đẩy node kế tiếp của danh sách đó vào heap; dùng dummy để nối kết quả.'
  ],
  solution: `### Ý tưởng
Đưa tất cả head khác null vào {{PriorityQueue}} theo giá trị. Lần lượt pop node nhỏ nhất, nối vào kết quả, rồi đẩy {{node.next}} vào heap nếu có.

Mỗi node được push/pop đúng một lần, mỗi thao tác heap O(log k), nên tổng O(N log k) với N là tổng số node.

~~~java
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Không dùng {{a.val - b.val}} làm comparator vì có thể tràn số với giá trị lớn; dùng {{Integer.compare}}.
- Nếu {{k}} lớn và danh sách ngắn, divide-and-conquer merge từng cặp cũng O(N log k) và ít bộ nhớ heap hơn.
- Hỏi lại danh sách có thể rỗng; xử lý null từng phần tử trước khi add.

> Senior tip: Với external merge (file lớn hơn RAM), bạn không thể giữ tất cả head trong heap nếu số file quá lớn; khi đó dùng multi-pass merge với fan-in giới hạn, ví dụ 64 file mỗi lượt. Đây là câu follow-up rất thực tế.`,
  starter: "class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}",
  tests: `
class ListNode {
    int val;
    ListNode next;
    ListNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static ListNode build(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int v : vals) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }
    static ListNode range(int a, int b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int i = a; i <= b; i++) {
            tail.next = new ListNode(i);
            tail = tail.next;
        }
        return dummy.next;
    }
    static List<Integer> toList(ListNode h) {
        List<Integer> r = new ArrayList<>();
        while (h != null) { r.add(h.val); h = h.next; }
        return r;
    }

    public static void main(String[] args) {
        run("example", ints(1, 1, 2, 3, 4, 4, 5, 6),
            () -> toList(new Solution().mergeKLists(new ListNode[]{
                build(1, 4, 5), build(1, 3, 4), build(2, 6)})));
        run("empty array", ints(), () -> toList(new Solution().mergeKLists(new ListNode[]{})));
        run("only nulls", ints(), () -> toList(new Solution().mergeKLists(new ListNode[]{null, null})));
        run("single list", ints(1, 2, 3),
            () -> toList(new Solution().mergeKLists(new ListNode[]{build(1, 2, 3)})));
        run("four singles", ints(1, 2, 3, 4),
            () -> toList(new Solution().mergeKLists(new ListNode[]{
                build(4), build(1), build(3), build(2)})));
        run("large", seq(1, 100), () -> {
            ListNode[] lists = new ListNode[10];
            for (int i = 0; i < 10; i++) lists[i] = range(i * 10 + 1, i * 10 + 10);
            return toList(new Solution().mergeKLists(lists));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{-100 <= Node.val <= 100}}

{{TreeNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng cây từ mảng level-order).`,
  hints: [
    'Độ sâu của một cây bằng 1 cộng với độ sâu lớn hơn của hai cây con.',
    'Đây là định nghĩa đệ quy tự nhiên; base case là node null.',
    'Nếu lo ngại stack overflow với cây lệch, có thể dùng BFS theo tầng.'
  ],
  solution: `### Ý tưởng
Đệ quy: cây rỗng có độ sâu 0; ngược lại lấy 1 + max(độ sâu trái, độ sâu phải). Mỗi node được thăm đúng một lần.

~~~java
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}
~~~

### Lưu ý khi phỏng vấn
- Với cây lệch hoàn toàn (giống linked list) và hàng trăm nghìn node, đệ quy có thể tràn stack; BFS hoặc đệ quy có kiểm soát sẽ an toàn hơn.
- Hỏi lại "độ sâu" được tính theo node hay theo cạnh — hai cách chênh nhau 1.
- Cây rỗng trả 0, không phải 1.

> Senior tip: Trong production, độ sâu cây thường dùng để đánh giá rủi ro stack khi serialize/deserialize JSON lồng nhau. Với dữ liệu không kiểm soát, luôn đặt giới hạn độ sâu thay vì tin vào đệ quy vô hạn.`,
  starter: "class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
  tests: `
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static TreeNode buildTree(Integer... vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode cur = q.poll();
            if (i < vals.length && vals[i] != null) {
                cur.left = new TreeNode(vals[i]);
                q.add(cur.left);
            }
            i++;
            if (i < vals.length && vals[i] != null) {
                cur.right = new TreeNode(vals[i]);
                q.add(cur.right);
            }
            i++;
        }
        return root;
    }
    static List<Integer> level(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) {
                out.add(null);
            } else {
                out.add(n.val);
                q.add(n.left);
                q.add(n.right);
            }
        }
        while (!out.isEmpty() && out.get(out.size() - 1) == null) {
            out.remove(out.size() - 1);
        }
        return out;
    }
    static TreeNode find(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode l = find(root.left, val);
        if (l != null) return l;
        return find(root.right, val);
    }

    public static void main(String[] args) {
        run("example", 3, () -> new Solution().maxDepth(buildTree(3, 9, 20, null, null, 15, 7)));
        run("empty", 0, () -> new Solution().maxDepth(buildTree()));
        run("single", 1, () -> new Solution().maxDepth(buildTree(1)));
        run("balanced", 3, () -> new Solution().maxDepth(buildTree(1, 2, 3, 4, 5, 6, 7)));
        run("skewed", 4, () -> new Solution().maxDepth(buildTree(1, 2, null, 3, null, 4)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{-100 <= Node.val <= 100}}

{{TreeNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng cây từ mảng level-order).`,
  hints: [
    'Tại mỗi node, chỉ cần hoán đổi con trỏ trái và phải.',
    'Sau khi hoán đổi, tiếp tục đảo hai cây con — thứ tự đảo trước hay sau đều được.',
    'Base case là node null; trả về null.'
  ],
  solution: `### Ý tưởng
Duyệt cây và tại mỗi node hoán đổi {{left}} với {{right}}. Có thể làm đệ quy (DFS) hoặc BFS với queue. Đệ quy ngắn gọn và tự nhiên nhất.

~~~java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode tmp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(tmp);
        return root;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phải lưu con trỏ tạm trước khi gán, nếu không sẽ mất một nhánh.
- Có thể hoán đổi trước rồi đệ quy hai con; kết quả như nhau.
- Với cây rất sâu, dùng BFS để tránh đệ quy sâu.

> Senior tip: Bài này đơn giản nhưng hay được dùng để kiểm tra ứng viên có thực sự hiểu con trỏ hay chỉ nhớ code. Hãy vẽ từng bước với cây 3 node và nói rõ thời điểm hoán đổi.`,
  starter: "class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}",
  tests: `
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static TreeNode buildTree(Integer... vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode cur = q.poll();
            if (i < vals.length && vals[i] != null) {
                cur.left = new TreeNode(vals[i]);
                q.add(cur.left);
            }
            i++;
            if (i < vals.length && vals[i] != null) {
                cur.right = new TreeNode(vals[i]);
                q.add(cur.right);
            }
            i++;
        }
        return root;
    }
    static List<Integer> level(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) {
                out.add(null);
            } else {
                out.add(n.val);
                q.add(n.left);
                q.add(n.right);
            }
        }
        while (!out.isEmpty() && out.get(out.size() - 1) == null) {
            out.remove(out.size() - 1);
        }
        return out;
    }
    static TreeNode find(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode l = find(root.left, val);
        if (l != null) return l;
        return find(root.right, val);
    }

    public static void main(String[] args) {
        run("example", Arrays.asList(4, 7, 2, 9, 6, 3, 1),
            () -> level(new Solution().invertTree(buildTree(4, 2, 7, 1, 3, 6, 9))));
        run("empty", ints(), () -> level(new Solution().invertTree(null)));
        run("single", ints(1), () -> level(new Solution().invertTree(buildTree(1))));
        run("one child", Arrays.asList(1, null, 2),
            () -> level(new Solution().invertTree(buildTree(1, 2))));
        run("mixed", Arrays.asList(1, 3, 2, 5, null, null, 4),
            () -> level(new Solution().invertTree(buildTree(1, 2, 3, 4, null, null, 5))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{-1000 <= Node.val <= 1000}}

{{TreeNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng cây từ mảng level-order).`,
  hints: [
    'Duyệt theo tầng là bài toán BFS kinh điển với queue.',
    'Cần tách từng tầng: ghi lại {{size = queue.size()}} trước khi xử lý tầng đó.',
    'Chỉ đưa con khác null vào queue; nếu đưa null sẽ phải xử lý đặc biệt.'
  ],
  solution: `### Ý tưởng
Dùng queue khởi tạo với root. Mỗi vòng lặp, lấy kích thước hiện tại của queue — đó chính là số node của tầng đang xét. Xử lý đúng {{size}} node, thêm con của chúng vào queue cho tầng sau.

~~~java
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu quên lấy {{size}} trước vòng for, bạn sẽ trộn các tầng với nhau.
- Có thể dùng {{List}} làm queue với chỉ số head để tránh cấp phát; nhưng {{ArrayDeque}} là lựa chọn chuẩn.
- Hỏi thêm: duyệt từ dưới lên (bottom-up) chỉ cần đảo kết quả hoặc thêm vào đầu danh sách.

> Senior tip: BFS theo tầng là nền tảng cho nhiều bài thực tế: lan truyền trạng thái trong graph, tính khoảng cách ngắn nhất không trọng số, hoặc render cây tổ chức theo cấp. Nhớ rằng BFS cần bộ nhớ O(width), có thể lớn hơn DFS O(height) rất nhiều.`,
  starter: "class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        \n    }\n}",
  tests: `
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static TreeNode buildTree(Integer... vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode cur = q.poll();
            if (i < vals.length && vals[i] != null) {
                cur.left = new TreeNode(vals[i]);
                q.add(cur.left);
            }
            i++;
            if (i < vals.length && vals[i] != null) {
                cur.right = new TreeNode(vals[i]);
                q.add(cur.right);
            }
            i++;
        }
        return root;
    }
    static List<Integer> level(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) {
                out.add(null);
            } else {
                out.add(n.val);
                q.add(n.left);
                q.add(n.right);
            }
        }
        while (!out.isEmpty() && out.get(out.size() - 1) == null) {
            out.remove(out.size() - 1);
        }
        return out;
    }
    static TreeNode find(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode l = find(root.left, val);
        if (l != null) return l;
        return find(root.right, val);
    }

    public static void main(String[] args) {
        run("example", Arrays.asList(ints(3), ints(9, 20), ints(15, 7)),
            () -> new Solution().levelOrder(buildTree(3, 9, 20, null, null, 15, 7)));
        run("empty", new ArrayList<List<Integer>>(),
            () -> new Solution().levelOrder(buildTree()));
        run("single", Arrays.asList(ints(1)),
            () -> new Solution().levelOrder(buildTree(1)));
        run("skewed", Arrays.asList(ints(1), ints(2), ints(3)),
            () -> new Solution().levelOrder(buildTree(1, 2, null, 3)));
        run("balanced", Arrays.asList(ints(1), ints(2, 3), ints(4, 5, 6, 7)),
            () -> new Solution().levelOrder(buildTree(1, 2, 3, 4, 5, 6, 7)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- Các giá trị node là duy nhất.

{{TreeNode}} đã được định nghĩa sẵn trong harness (kèm helper dựng cây từ mảng level-order).`,
  hints: [
    'Nếu tìm thấy p hoặc q ở một nhánh, nhánh đó có thể chứa tổ tiên chung.',
    'Nếu p và q nằm ở hai nhánh khác nhau của một node, node đó chính là LCA.',
    'Dùng DFS trả về node tìm thấy; nếu cả hai nhánh đều trả về khác null thì node hiện tại là LCA.'
  ],
  solution: `### Ý tưởng
DFS từ gốc. Nếu node hiện tại là null, p hoặc q thì trả về node đó. Đệ quy hai nhánh. Nếu cả hai nhánh đều trả về node khác null, p và q nằm hai bên nên node hiện tại là LCA. Nếu chỉ một nhánh có kết quả, trả về kết quả đó.

~~~java
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return (left != null) ? left : right;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cách này giả định cả p và q đều tồn tại. Nếu có thể thiếu node, cần thêm bước đếm hoặc kiểm tra sau khi tìm.
- Có thể dùng parent map + set để tìm LCA theo hướng bottom-up; O(n) bộ nhớ nhưng dễ hiểu.
- Với BST, có thể tận dụng thứ tự để tìm O(h) mà không cần đệ quy hai nhánh.

> Senior tip: LCA xuất hiện trong bài toán quyền truy cập theo cây tổ chức, hoặc tìm phạm vi chung của hai prefix trong trie. Hãy nắm cả biến thể BST để trả lời follow-up nhanh.`,
  starter: "class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        \n    }\n}",
  tests: `
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int v) { val = v; }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static TreeNode buildTree(Integer... vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode cur = q.poll();
            if (i < vals.length && vals[i] != null) {
                cur.left = new TreeNode(vals[i]);
                q.add(cur.left);
            }
            i++;
            if (i < vals.length && vals[i] != null) {
                cur.right = new TreeNode(vals[i]);
                q.add(cur.right);
            }
            i++;
        }
        return root;
    }
    static List<Integer> level(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) {
                out.add(null);
            } else {
                out.add(n.val);
                q.add(n.left);
                q.add(n.right);
            }
        }
        while (!out.isEmpty() && out.get(out.size() - 1) == null) {
            out.remove(out.size() - 1);
        }
        return out;
    }
    static TreeNode find(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode l = find(root.left, val);
        if (l != null) return l;
        return find(root.right, val);
    }

    public static void main(String[] args) {
        TreeNode root = buildTree(3, 5, 1, 6, 2, 0, 8, null, null, 7, 4);
        run("p5 q1", 3, () -> new Solution().lowestCommonAncestor(root, find(root, 5), find(root, 1)).val);
        run("p5 q4", 5, () -> new Solution().lowestCommonAncestor(root, find(root, 5), find(root, 4)).val);
        run("p1 q2", 3, () -> new Solution().lowestCommonAncestor(root, find(root, 1), find(root, 2)).val);
        run("p6 q7", 5, () -> new Solution().lowestCommonAncestor(root, find(root, 6), find(root, 7)).val);
        run("p2 q4", 2, () -> new Solution().lowestCommonAncestor(root, find(root, 2), find(root, 4)).val);
        run("p1 q8", 1, () -> new Solution().lowestCommonAncestor(root, find(root, 1), find(root, 8)).val);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
        grid[i][j] = '0';   // mark visited
        sink(grid, i + 1, j);
        sink(grid, i - 1, j);
        sink(grid, i, j + 1);
        sink(grid, i, j - 1);
    }
}
~~~

### Lưu ý khi phỏng vấn
- DFS đệ quy có thể sâu tới {{m*n}} (90.000 với 300x300), gần chạm giới hạn stack; BFS hoặc DFS lặp an toàn hơn.
- Nếu không được sửa input, dùng mảng {{boolean[][] visited}}.
- Hỏi lại: 4 hướng hay 8 hướng? Đề chuẩn dùng 4 hướng.
- Với lưới cực lớn, Union-Find cũng là lựa chọn tốt, đặc biệt khi dữ liệu đến dần.

> Senior tip: Bài này là ví dụ rõ nhất cho việc "visited chính là input đã bị biến đổi". Trong phỏng vấn, hãy nói rõ bạn đang sửa input và hỏi xem có được phép không — đó là chi tiết đánh giá sự cẩn thận.`,
  starter: "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static char[][] grid(String... rows) {
        char[][] g = new char[rows.length][];
        for (int i = 0; i < rows.length; i++) g[i] = rows[i].toCharArray();
        return g;
    }

    public static void main(String[] args) {
        run("example 1", 1, () -> new Solution().numIslands(grid(
            "11110", "11010", "11000", "00000")));
        run("example 2", 3, () -> new Solution().numIslands(grid(
            "11000", "11000", "00100", "00011")));
        run("all water", 0, () -> new Solution().numIslands(grid("000", "000")));
        run("single land", 1, () -> new Solution().numIslands(grid("1")));
        run("all land", 1, () -> new Solution().numIslands(grid("111", "111", "111")));
        run("diagonal not connected", 2, () -> new Solution().numIslands(grid("10", "01")));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[numCourses];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);   // take p[1] before p[0]
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
}
~~~

### Lưu ý khi phỏng vấn
- Cẩn thận chiều cạnh: nếu đảo ngược, kết quả vẫn có thể đúng cho bài "có chu trình" nhưng sai khi cần thứ tự học.
- Có thể dùng DFS với 3 màu (white/gray/black) để phát hiện chu trình; nêu cả hai hướng.
- Cạnh trùng hoặc self-loop: self-loop bị cấm bởi ràng buộc, nhưng cạnh trùng vẫn có thể xảy ra trong dữ liệu thật.

> Senior tip: Đây là mô hình của dependency graph trong build system, module Spring, hoặc pipeline dữ liệu. Khi graph lớn, Kahn cho phép xử lý song song các node indegree 0 — hãy nêu ý tưởng này vì nó thể hiện tư duy hệ thống.`,
  starter: "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("simple chain", true, () -> new Solution().canFinish(2, new int[][]{{1, 0}}));
        run("cycle", false, () -> new Solution().canFinish(2, new int[][]{{1, 0}, {0, 1}}));
        run("no prerequisites", true, () -> new Solution().canFinish(1, new int[][]{}));
        run("long chain", true, () -> new Solution().canFinish(4, new int[][]{{1, 0}, {2, 1}, {3, 2}}));
        run("disconnected cycle", false,
            () -> new Solution().canFinish(4, new int[][]{{1, 0}, {0, 1}, {2, 3}, {3, 2}}));
        run("many isolated", true, () -> new Solution().canFinish(5, new int[][]{}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
            if (d > dist[u]) continue;   // stale entry
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
}
~~~

### Lưu ý khi phỏng vấn
- Dijkstra chỉ đúng với trọng số không âm. Nếu có cạnh âm, phải dùng Bellman-Ford.
- Không cần mảng visited nếu dùng kiểm tra {{d > dist[u]}}; nhưng có thể thêm để rõ ràng.
- Độ phức tạp O(E log V) với heap; với đồ thị dày, có thể cân nhắc Fibonacci heap (hiếm dùng trong phỏng vấn).

> Senior tip: Trong hệ thống microservices, Dijkstra/bellman tương ứng bài toán chọn đường đi theo latency thấp nhất, nhưng latency thay đổi liên tục. Các hệ thống thật thường dùng thuật toán thích nghi hoặc load balancer dựa trên số liệu realtime thay vì chạy Dijkstra mỗi request.`,
  starter: "class Solution {\n    public int networkDelayTime(int[][] times, int n, int k) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 2, () -> new Solution().networkDelayTime(
            new int[][]{{2, 1, 1}, {2, 3, 1}, {3, 4, 1}}, 4, 2));
        run("unreachable", -1, () -> new Solution().networkDelayTime(new int[][]{{1, 2, 1}}, 2, 2));
        run("single node", 0, () -> new Solution().networkDelayTime(new int[][]{}, 1, 1));
        run("star", 4, () -> new Solution().networkDelayTime(
            new int[][]{{1, 2, 2}, {1, 3, 3}, {1, 4, 4}}, 4, 1));
        run("two paths", 3, () -> new Solution().networkDelayTime(
            new int[][]{{1, 2, 1}, {2, 3, 2}, {1, 3, 4}}, 3, 1));
        run("zero weights", 0, () -> new Solution().networkDelayTime(
            new int[][]{{1, 2, 0}, {2, 3, 0}}, 3, 1));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int s : stones) maxHeap.add(s);
        while (maxHeap.size() > 1) {
            int a = maxHeap.poll();   // heaviest
            int b = maxHeap.poll();   // second heaviest
            if (a != b) maxHeap.add(a - b);
        }
        return maxHeap.isEmpty() ? 0 : maxHeap.poll();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu hai viên bằng nhau, không đẩy gì vào heap — nhiều bạn quên và đẩy 0.
- Có thể dùng mảng và sort lại mỗi lần, nhưng O(n² log n) hoặc O(n²) tuỳ cách; heap là lựa chọn tự nhiên.
- Hỏi lại: có cần giữ lịch sử các lần đập không? Nếu có, cần thêm cấu trúc.

> Senior tip: Bài này nhỏ nhưng thể hiện đúng tư duy chọn cấu trúc dữ liệu. Trong phỏng vấn, hãy nói rõ chi phí: heap O(n log n) time, O(n) space; so với sort mỗi vòng thì heap thắng khi số phần tử lớn.`,
  starter: "class Solution {\n    public int lastStoneWeight(int[] stones) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 1, () -> new Solution().lastStoneWeight(new int[]{2, 7, 4, 1, 8, 1}));
        run("single", 1, () -> new Solution().lastStoneWeight(new int[]{1}));
        run("equal pair", 0, () -> new Solution().lastStoneWeight(new int[]{2, 2}));
        run("three ones", 1, () -> new Solution().lastStoneWeight(new int[]{1, 1, 1}));
        run("two tens", 2, () -> new Solution().lastStoneWeight(new int[]{10, 4, 2, 10}));
        run("mix", 2, () -> new Solution().lastStoneWeight(new int[]{3, 7, 2}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : nums) {
            minHeap.add(x);
            if (minHeap.size() > k) {
                minHeap.poll();   // remove smallest
            }
        }
        return minHeap.peek();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đừng nhầm min-heap với max-heap: để giữ top-k lớn nhất, heap phải là min-heap để dễ loại phần tử yếu nhất.
- Quickselect cho average O(n), worst O(n²); nêu trade-off nếu được hỏi tối ưu hơn.
- Nếu {{k}} gần bằng n, sort có thể đơn giản hơn và hằng số nhỏ hơn; hãy hỏi ràng buộc thực tế.

> Senior tip: Với top-K trong hệ thống monitoring, min-heap kích thước k là lựa chọn mặc định vì bộ nhớ O(k). Nếu k rất lớn hoặc phân tán, hãy cân nhắc Count-Min Sketch kèm heap xấp xỉ.`,
  starter: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example 1", 5, () -> new Solution().findKthLargest(new int[]{3, 2, 1, 5, 6, 4}, 2));
        run("example 2", 4, () -> new Solution().findKthLargest(new int[]{3, 2, 3, 1, 2, 4, 5, 5, 6}, 4));
        run("single", 1, () -> new Solution().findKthLargest(new int[]{1}, 1));
        run("duplicates", 2, () -> new Solution().findKthLargest(new int[]{2, 2, 2}, 2));
        run("negatives", -1, () -> new Solution().findKthLargest(new int[]{-1, -2, -3}, 1));
        run("large", 50001, () -> {
            int[] a = new int[100000];
            for (int i = 0; i < a.length; i++) a[i] = 100000 - i;
            return new Solution().findKthLargest(a, 50000);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện chạm nhau {{last[1] < cur[0]}} coi {{[1,4]}} và {{[4,5]}} là giao nhau; nếu đề không coi chạm là giao, đổi thành {{<=}}.
- Comparator dùng {{a[0] - b[0]}} có thể tràn nếu giá trị lớn; dùng {{Integer.compare}}.
- Hàm sort sửa trực tiếp mảng đầu vào — hỏi xem có được phép không.

> Senior tip: Merge intervals là nền tảng của bài toán lịch (calendar), cấp phát tài nguyên theo thời gian, và nén dải IP. Với dữ liệu streaming, không thể sort toàn bộ; khi đó dùng interval tree hoặc cấu trúc cân bằng theo start.`,
  starter: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", new int[][]{{1, 6}, {8, 10}, {15, 18}},
            () -> new Solution().merge(new int[][]{{1, 3}, {2, 6}, {8, 10}, {15, 18}}));
        run("touching", new int[][]{{1, 5}},
            () -> new Solution().merge(new int[][]{{1, 4}, {4, 5}}));
        run("single", new int[][]{{1, 2}},
            () -> new Solution().merge(new int[][]{{1, 2}}));
        run("nested", new int[][]{{1, 10}},
            () -> new Solution().merge(new int[][]{{1, 10}, {2, 3}}));
        run("unsorted", new int[][]{{1, 4}, {5, 7}},
            () -> new Solution().merge(new int[][]{{5, 7}, {1, 3}, {2, 4}}));
        run("disjoint", new int[][]{{1, 2}, {3, 4}},
            () -> new Solution().merge(new int[][]{{1, 2}, {3, 4}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
                rooms++;            // no free room
            } else {
                e++;                // reuse a finished room
            }
            best = Math.max(best, rooms);
        }
        return best;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu một cuộc họp kết thúc đúng lúc cuộc khác bắt đầu, thường được coi là tái sử dụng được (dùng {{<}}). Hãy hỏi lại quy ước.
- Cách heap: sort theo start, đẩy end vào min-heap; nếu end nhỏ nhất <= start hiện tại thì poll rồi đẩy end mới; kích thước heap là đáp án.
- Đừng nhầm với Merge Intervals: ở đây chỉ đếm số phòng, không cần gộp khoảng.

> Senior tip: Bài này mô hình hoá capacity planning: số worker, connection pool, hay slot trong scheduler. Trong thực tế, bạn còn phải tính buffer và thời gian chuyển ca; hãy nêu rằng mô hình lý thuyết chỉ là cận dưới.`,
  starter: "class Solution {\n    public int minMeetingRooms(int[][] intervals) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example 1", 2, () -> new Solution().minMeetingRooms(
            new int[][]{{0, 30}, {5, 10}, {15, 20}}));
        run("example 2", 1, () -> new Solution().minMeetingRooms(new int[][]{{7, 10}, {2, 4}}));
        run("single", 1, () -> new Solution().minMeetingRooms(new int[][]{{0, 5}}));
        run("touching", 1, () -> new Solution().minMeetingRooms(new int[][]{{0, 5}, {5, 10}}));
        run("triple", 2, () -> new Solution().minMeetingRooms(
            new int[][]{{0, 10}, {1, 2}, {2, 3}}));
        run("all overlap", 4, () -> new Solution().minMeetingRooms(
            new int[][]{{0, 5}, {1, 6}, {2, 7}, {3, 8}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Với {{n = 45}}, kết quả vẫn vừa {{int}}; nếu {{n}} lớn hơn, dùng {{long}} hoặc BigInteger.
- Có thể giải bằng DP mảng O(n), nhưng hai biến thể hiện tối ưu bộ nhớ tốt hơn.
- Hỏi lại: nếu được leo 1, 2 hoặc 3 bậc thì công thức thay đổi thế nào? Tổng ba giá trị trước.

> Senior tip: Bài này là cửa ngõ vào DP. Điểm tôi hay hỏi tiếp là "nếu n = 10^9 thì sao?" — câu trả lời là dùng ma trận lũy thừa hoặc công thức Binet, nhưng cần xử lý số lớn và độ chính xác.`,
  starter: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("one", 1, () -> new Solution().climbStairs(1));
        run("two", 2, () -> new Solution().climbStairs(2));
        run("three", 3, () -> new Solution().climbStairs(3));
        run("ten", 89, () -> new Solution().climbStairs(10));
        run("twenty", 10946, () -> new Solution().climbStairs(20));
        run("forty five", 1836311903, () -> new Solution().climbStairs(45));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Kết quả đúng cho cả ba trường hợp: tìm thấy, không tìm thấy ở giữa, và lớn hơn mọi phần tử.
- Không dùng {{hi = nums.length - 1}} với khoảng nửa mở; nếu dùng khoảng đóng thì phải đổi điều kiện và cách cập nhật.
- Đây là nền tảng để cài đặt {{lower_bound}}/{{ceiling}} trong các bài tìm khoảng, chèn vào danh sách đã sort.

> Senior tip: Trong production, lower bound xuất hiện khi tìm bucket thời gian, chọn partition trong Kafka, hoặc chèn vào danh sách cấu hình đã sort. Hãy nhớ quy ước nửa mở để tránh lỗi khi target lớn hơn toàn bộ mảng.`,
  starter: "class Solution {\n    public int searchInsert(int[] nums, int target) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("found", 2, () -> new Solution().searchInsert(new int[]{1, 3, 5, 6}, 5));
        run("middle", 1, () -> new Solution().searchInsert(new int[]{1, 3, 5, 6}, 2));
        run("after end", 4, () -> new Solution().searchInsert(new int[]{1, 3, 5, 6}, 7));
        run("before start", 0, () -> new Solution().searchInsert(new int[]{1, 3, 5, 6}, 0));
        run("single before", 0, () -> new Solution().searchInsert(new int[]{1}, 0));
        run("single after", 1, () -> new Solution().searchInsert(new int[]{1}, 2));
        run("two middle", 1, () -> new Solution().searchInsert(new int[]{1, 3}, 2));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);   // sentinel: impossible
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
}
~~~

### Lưu ý khi phỏng vấn
- Sentinel phải lớn hơn {{amount}}; nếu dùng {{Integer.MAX_VALUE}} thì {{+1}} có thể tràn.
- Thứ tự hai vòng lặp không ảnh hưởng kết quả số xu, nhưng ảnh hưởng nếu đếm số cách (khi đó cần tránh đếm trùng hoán vị).
- Greedy chỉ đúng với một số hệ mệnh giá (như 1,5,10,25 với điều kiện nhất định), không đúng tổng quát.

> Senior tip: Bài này là unbounded knapsack cơ bản. Trong toán tiền tệ thực tế, còn có ràng buộc số lượng từng mệnh giá và hao hụt; khi đó phải dùng DP có chiều số lượng hoặc thuật toán tối ưu hoá tuyến tính nguyên.`,
  starter: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 3, () -> new Solution().coinChange(new int[]{1, 2, 5}, 11));
        run("impossible", -1, () -> new Solution().coinChange(new int[]{2}, 3));
        run("zero amount", 0, () -> new Solution().coinChange(new int[]{1}, 0));
        run("exact coins", 2, () -> new Solution().coinChange(new int[]{2}, 4));
        run("huge coin", 2, () -> new Solution().coinChange(new int[]{1, 2147483647}, 2));
        run("mixed", 20, () -> new Solution().coinChange(new int[]{186, 419, 83, 408}, 6249));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{<}} để tìm lower bound cho dãy tăng chặt; nếu muốn không giảm, tìm upper bound.
- Nếu cần trả về dãy con thực tế, phải lưu thêm parent/index — chỉ mảng tails là không đủ.
- DP O(n²) dễ hiểu hơn và cần thiết nếu bài toán yêu cầu thêm ràng buộc phức tạp.

> Senior tip: Trong bài toán tìm chuỗi tăng dài nhất của version/deploy, O(n log n) rất quan trọng vì log deploy có thể hàng triệu dòng. Hãy nhớ tails chỉ là công cụ tính độ dài; đừng cố in nó ra như đáp án.`,
  starter: "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 4, () -> new Solution().lengthOfLIS(new int[]{10, 9, 2, 5, 3, 7, 101, 18}));
        run("all equal", 1, () -> new Solution().lengthOfLIS(new int[]{7, 7, 7, 7}));
        run("single", 1, () -> new Solution().lengthOfLIS(new int[]{1}));
        run("increasing", 4, () -> new Solution().lengthOfLIS(new int[]{1, 2, 3, 4}));
        run("decreasing", 1, () -> new Solution().lengthOfLIS(new int[]{4, 3, 2, 1}));
        run("large increasing", 2500, () -> {
            int[] a = new int[2500];
            for (int i = 0; i < a.length; i++) a[i] = i;
            return new Solution().lengthOfLIS(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Có thể giảm bộ nhớ xuống O(n) bằng hai hàng; nêu điều này nếu được hỏi tối ưu.
- Nếu cho phép hoán đổi hai ký tự kề (Damerau-Levenshtein), công thức cần thêm trường hợp.
- Với Unicode, {{charAt}} theo code unit có thể sai với emoji; dùng code point nếu cần chính xác.

> Senior tip: Edit distance là nền tảng của fuzzy matching, spell checker và diff. Trong production, với chuỗi rất dài người ta dùng giới hạn ngưỡng kết hợp banded DP để giảm từ O(mn) xuống gần O(k * min(m,n)).`,
  starter: "class Solution {\n    public int minDistance(String word1, String word2) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("horse to ros", 3, () -> new Solution().minDistance("horse", "ros"));
        run("intention", 5, () -> new Solution().minDistance("intention", "execution"));
        run("both empty", 0, () -> new Solution().minDistance("", ""));
        run("insert all", 3, () -> new Solution().minDistance("", "abc"));
        run("delete all", 3, () -> new Solution().minDistance("abc", ""));
        run("same", 0, () -> new Solution().minDistance("abc", "abc"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(0, new ArrayList<>(), nums, result);
        return result;
    }

    private void backtrack(int start, List<Integer> path, int[] nums,
                           List<List<Integer>> result) {
        result.add(new ArrayList<>(path));   // every state is valid
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(i + 1, path, nums, result);
            path.remove(path.size() - 1);
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phải copy {{new ArrayList<>(path)}} khi ghi kết quả; nếu thêm trực tiếp, mọi phần tử sẽ trỏ về cùng một list và bị thay đổi.
- Nếu mảng có phần tử trùng, cần sort và bỏ qua các nhánh trùng ở cùng một tầng.
- Có thể giải bằng bitmask từ 0 đến {{(1 << n) - 1}}; với n <= 10 thì cả hai cách đều ổn.

> Senior tip: Bài này là mẫu để học "backtracking template". Khi gặp bài tổ hợp, hãy xác định rõ: trạng thái ghi nhận khi nào, tham số start là gì, và điều kiện cắt tỉa. Ba câu hỏi đó quyết định code đúng hay sai.`,
  starter: "class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static List<List<Integer>> norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example", norm(Arrays.asList(
                new ArrayList<Integer>(), ints(1), ints(2), ints(3),
                ints(1, 2), ints(1, 3), ints(2, 3), ints(1, 2, 3))),
            () -> norm(new Solution().subsets(new int[]{1, 2, 3})));
        run("zero", norm(Arrays.asList(new ArrayList<Integer>(), ints(0))),
            () -> norm(new Solution().subsets(new int[]{0})));
        run("two", norm(Arrays.asList(
                new ArrayList<Integer>(), ints(1), ints(2), ints(1, 2))),
            () -> norm(new Solution().subsets(new int[]{1, 2})));
        run("negative", norm(Arrays.asList(
                new ArrayList<Integer>(), ints(-1), ints(0), ints(-1, 0))),
            () -> norm(new Solution().subsets(new int[]{-1, 0})));
        run("single", norm(Arrays.asList(new ArrayList<Integer>(), ints(5))),
            () -> norm(new Solution().subsets(new int[]{5})));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu có phần tử trùng, phải sort và bỏ qua phần tử trùng chưa dùng ở cùng tầng: {{i > 0 && nums[i] == nums[i - 1] && !used[i - 1]}}.
- Có thể hoán vị tại chỗ bằng swap, tiết kiệm mảng used nhưng khó kiểm soát trùng lặp hơn.
- Khi n tăng, số hoán vị bùng nổ; hãy hỏi có cần sinh tất cả hay chỉ đếm/duyệt theo thứ tự.

> Senior tip: Với bài toán lịch trình nhỏ, hoán vị + kiểm tra ràng buộc là cách nhanh để prototype. Nhưng trong production, n > 10 gần như không thể duyệt hết; hãy chuyển sang heuristic hoặc quy hoạch động trên tập con (bitmask DP).`,
  starter: "class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static List<List<Integer>> norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example", norm(Arrays.asList(
                ints(1, 2, 3), ints(1, 3, 2), ints(2, 1, 3),
                ints(2, 3, 1), ints(3, 1, 2), ints(3, 2, 1))),
            () -> norm(new Solution().permute(new int[]{1, 2, 3})));
        run("two", norm(Arrays.asList(ints(0, 1), ints(1, 0))),
            () -> norm(new Solution().permute(new int[]{0, 1})));
        run("single", norm(Arrays.asList(ints(1))),
            () -> norm(new Solution().permute(new int[]{1})));
        run("one two", norm(Arrays.asList(ints(1, 2), ints(2, 1))),
            () -> norm(new Solution().permute(new int[]{1, 2})));
        run("negative", norm(Arrays.asList(
                ints(-1, 0, 1), ints(-1, 1, 0), ints(0, -1, 1),
                ints(0, 1, -1), ints(1, -1, 0), ints(1, 0, -1))),
            () -> norm(new Solution().permute(new int[]{-1, 0, 1})));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
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
            if (candidates[i] > remain) break;   // sorted
            path.add(candidates[i]);
            backtrack(i, remain - candidates[i], candidates, path, result);
            path.remove(path.size() - 1);
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Truyền {{i}} thay vì {{i + 1}} là mấu chốt cho phép dùng lại phần tử; nhưng vẫn phải giữ {{start}} để tránh hoán vị trùng.
- Nếu candidates có phần tử trùng, cần thêm bước bỏ qua cùng tầng: {{i > start && candidates[i] == candidates[i - 1]}}.
- Có thể cắt nhánh mạnh hơn bằng remain và giá trị nhỏ nhất; break sau sort là đủ cho bài này.

> Senior tip: Combination Sum là bài học về "tránh trùng lặp bằng thứ tự". Rất nhiều ứng viên code đúng tổng nhưng trả về hoán vị trùng; hãy vẽ cây đệ quy và chỉ ra tham số start đã loại bỏ nhánh quay lui thế nào.`,
  starter: "class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static List<List<Integer>> norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example 1", norm(Arrays.asList(ints(2, 2, 3), ints(7))),
            () -> norm(new Solution().combinationSum(new int[]{2, 3, 6, 7}, 7)));
        run("example 2", norm(Arrays.asList(ints(2, 2, 2, 2), ints(2, 3, 3), ints(3, 5))),
            () -> norm(new Solution().combinationSum(new int[]{2, 3, 5}, 8)));
        run("impossible", norm(new ArrayList<List<Integer>>()),
            () -> norm(new Solution().combinationSum(new int[]{2}, 1)));
        run("only ones", norm(Arrays.asList(ints(1, 1))),
            () -> norm(new Solution().combinationSum(new int[]{1}, 2)));
        run("unsorted", norm(Arrays.asList(ints(2, 2, 3), ints(7))),
            () -> norm(new Solution().combinationSum(new int[]{7, 3, 2}, 7)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;          // cannot reach i
            farthest = Math.max(farthest, i + nums[i]);
            if (farthest >= nums.length - 1) return true;
        }
        return true;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{i + nums[i]}} có thể tràn nếu ràng buộc lớn; với {{10^4 + 10^5}} vẫn an toàn, nhưng nên dùng {{long}} nếu mở rộng.
- Mảng một phần tử luôn trả true vì đã ở cuối.
- Câu hỏi tiếp: tìm số bước nhảy ít nhất (Jump Game II) — khi đó dùng BFS/greedy theo tầng, không chỉ farthest đơn thuần.

> Senior tip: Greedy đúng ở đây vì khả năng tới vị trí xa hơn luôn tốt hơn hoặc bằng, không có lý do chọn bước ngắn. Khi gặp bài greedy, hãy luôn tự hỏi "có phản ví dụ nào mà chọn xa hơn lại tệ hơn không?" — nếu không, đó là dấu hiệu tốt.`,
  starter: "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example true", true, () -> new Solution().canJump(new int[]{2, 3, 1, 1, 4}));
        run("example false", false, () -> new Solution().canJump(new int[]{3, 2, 1, 0, 4}));
        run("single", true, () -> new Solution().canJump(new int[]{0}));
        run("stuck", false, () -> new Solution().canJump(new int[]{0, 1}));
        run("jump over", true, () -> new Solution().canJump(new int[]{2, 0, 0}));
        run("large all ones", true, () -> {
            int[] a = new int[10000];
            Arrays.fill(a, 1);
            return new Solution().canJump(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int removed = 0;
        int lastEnd = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < lastEnd) {
                removed++;                 // overlaps kept interval
            } else {
                lastEnd = intervals[i][1];
            }
        }
        return removed;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Sort theo start là sai hướng cho bài này; hãy giải thích vì sao sort theo end mới tối ưu.
- Điều kiện {{<}} cho phép chạm biên; nếu đề coi chạm là giao, đổi thành {{<=}}.
- Comparator dùng {{a[1] - b[1]}} có thể tràn với giá trị lớn; dùng {{Integer.compare}}.

> Senior tip: Activity selection xuất hiện trong lập lịch job, chọn phòng họp, và tối ưu batch window. Khi có trọng số (mỗi job lợi nhuận khác nhau), greedy không còn đúng — phải chuyển sang weighted interval scheduling với DP + binary search.`,
  starter: "class Solution {\n    public int eraseOverlapIntervals(int[][] intervals) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", 1, () -> new Solution().eraseOverlapIntervals(
            new int[][]{{1, 2}, {2, 3}, {3, 4}, {1, 3}}));
        run("all same", 2, () -> new Solution().eraseOverlapIntervals(
            new int[][]{{1, 2}, {1, 2}, {1, 2}}));
        run("single", 0, () -> new Solution().eraseOverlapIntervals(new int[][]{{1, 2}}));
        run("touching", 0, () -> new Solution().eraseOverlapIntervals(
            new int[][]{{1, 2}, {2, 3}}));
        run("classic", 2, () -> new Solution().eraseOverlapIntervals(
            new int[][]{{1, 100}, {11, 22}, {1, 11}, {2, 12}}));
        run("large disjoint", 0, () -> {
            int[][] a = new int[100000][2];
            for (int i = 0; i < a.length; i++) {
                a[i][0] = 2 * i;
                a[i][1] = 2 * i + 1;
            }
            return new Solution().eraseOverlapIntervals(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
  starter: "class TokenBucket {\n    public TokenBucket(long capacity, double tokensPerSecond) {\n        \n    }\n    public synchronized boolean tryAcquire(int n) {\n        return false;\n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }
    static void join(Thread t) {
        try { t.join(3000); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }

    public static void main(String[] args) {
        runSteps("initial capacity", () -> {
            TokenBucket b = new TokenBucket(10, 2);
            eq("first burst", true, b.tryAcquire(10));
            eq("empty", false, b.tryAcquire(1));
        });
        runSteps("partial drain", () -> {
            TokenBucket b = new TokenBucket(5, 1);
            eq("take 3", true, b.tryAcquire(3));
            eq("take 2", true, b.tryAcquire(2));
            eq("take 1", false, b.tryAcquire(1));
        });
        runSteps("oversize request", () -> {
            TokenBucket b = new TokenBucket(5, 1);
            eq("too many", false, b.tryAcquire(6));
            eq("still full", true, b.tryAcquire(5));
        });
        runSteps("refill after wait", () -> {
            TokenBucket b = new TokenBucket(10, 1000);
            eq("drain", true, b.tryAcquire(10));
            sleep(40);
            eq("refilled", true, b.tryAcquire(10));
        });
        runSteps("capacity cap", () -> {
            TokenBucket b = new TokenBucket(2, 10000);
            sleep(40);
            eq("two", true, b.tryAcquire(2));
            eq("third", false, b.tryAcquire(1));
        });
        runSteps("sequential", () -> {
            TokenBucket b = new TokenBucket(3, 1);
            eq("first", true, b.tryAcquire(1));
            eq("second", true, b.tryAcquire(1));
            eq("third", true, b.tryAcquire(1));
            eq("fourth", false, b.tryAcquire(1));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

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
            items[head] = null;   // avoid retaining a reference
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
  starter: "class BoundedBlockingQueue<T> {\n    public BoundedBlockingQueue(int capacity) {\n        \n    }\n    public void put(T item) throws InterruptedException {\n        \n    }\n    public T take() throws InterruptedException {\n        return null;\n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    static <T> void put(BoundedBlockingQueue<T> q, T v) {
        try { q.put(v); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }
    static <T> T take(BoundedBlockingQueue<T> q) {
        try { return q.take(); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }
    static void join(Thread t) {
        try { t.join(3000); }
        catch (InterruptedException e) { throw new RuntimeException(e); }
    }

    public static void main(String[] args) {
        runSteps("fifo", () -> {
            BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(3);
            put(q, "a");
            put(q, "b");
            put(q, "c");
            eq("first", "a", take(q));
            eq("second", "b", take(q));
            eq("third", "c", take(q));
        });
        runSteps("take blocks until put", () -> {
            BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(1);
            AtomicReference<String> got = new AtomicReference<>();
            Thread c = new Thread(() -> got.set(take(q)));
            c.start();
            sleep(80);
            eq("blocked", null, got.get());
            put(q, "x");
            join(c);
            eq("got", "x", got.get());
        });
        runSteps("put blocks until take", () -> {
            BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(1);
            put(q, "a");
            AtomicBoolean done = new AtomicBoolean(false);
            Thread p = new Thread(() -> { put(q, "b"); done.set(true); });
            p.start();
            sleep(80);
            eq("blocked", false, done.get());
            eq("first", "a", take(q));
            join(p);
            eq("done", true, done.get());
            eq("second", "b", take(q));
        });
        runSteps("single producer order", () -> {
            BoundedBlockingQueue<Integer> q = new BoundedBlockingQueue<>(10);
            List<Integer> out = new ArrayList<>();
            Thread prod = new Thread(() -> {
                for (int i = 1; i <= 100; i++) put(q, i);
            });
            Thread cons = new Thread(() -> {
                for (int i = 0; i < 100; i++) out.add(take(q));
            });
            prod.start();
            cons.start();
            join(prod);
            join(cons);
            eq("count", 100, out.size());
            eq("order", seq(1, 100), out);
        });
        runSteps("multiple producers", () -> {
            BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(8);
            ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
            Thread[] ps = new Thread[3];
            for (int p = 0; p < 3; p++) {
                final int id = p;
                ps[p] = new Thread(() -> {
                    for (int i = 0; i < 40; i++) put(q, "p" + id + "-" + i);
                });
                ps[p].start();
            }
            Thread cons = new Thread(() -> {
                for (int i = 0; i < 120; i++) {
                    String v = take(q);
                    counts.merge(v, 1, Integer::sum);
                }
            });
            cons.start();
            for (Thread t : ps) join(t);
            join(cons);
            eq("distinct", 120, counts.size());
            eq("first", 1, counts.get("p0-0"));
            eq("last", 1, counts.get("p2-39"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
- {{id}} là chuỗi không rỗng, tối đa 64 ký tự.

Class {{Txn}} đã được định nghĩa sẵn trong harness.`,
  hints: [
    'Cần so sánh tổng tiền theo từng id giữa hai nguồn.',
    'Cộng dồn vào hai {{HashMap<String, Long>}} rồi hợp các key lại để so sánh.',
    'Không dùng {{double}} cho tiền; dùng {{long}} cent hoặc {{BigDecimal}}. Cẩn thận id chỉ có ở một bên.'
  ],
  solution: `### Ý tưởng
Cộng dồn số tiền theo id cho từng nguồn bằng {{merge}}. Sau đó hợp các id, so sánh tổng; nếu khác nhau, ghi nhận chênh lệch. Sắp xếp kết quả để đầu ra ổn định.

Đây là bài đối soát cơ bản trong fintech: idempotent, có thể chạy lại, và không phụ thuộc thứ tự giao dịch.

~~~java
class Solution {
    public List<String> reconcile(List<Txn> ledger, List<Txn> bank) {
        Map<String, Long> expected = new HashMap<>();
        for (Txn t : ledger) expected.merge(t.id, t.amountCents, Long::sum);
        Map<String, Long> actual = new HashMap<>();
        for (Txn t : bank) actual.merge(t.id, t.amountCents, Long::sum);

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
}
~~~

### Lưu ý khi phỏng vấn
- {{String}} nối chuỗi trong vòng lặp lớn không hiệu quả; trong production nên trả về record {{Diff}} thay vì chuỗi.
- Cộng dồn {{long}} có thể tràn nếu số lượng giao dịch cực lớn; cân nhắc {{BigInteger}} hoặc kiểm tra ngưỡng.
- Nếu hai nguồn quá lớn không vừa RAM, phải sort ngoài (external merge) theo id rồi so sánh streaming.
- Cần hỏi rõ quy tắc: giao dịch bị huỷ, hoàn tiền, hay chênh lệch tỷ giá xử lý thế nào.

> Senior tip: Đối soát thật không chỉ là so tổng; phải xử lý trạng thái giao dịch, thời gian hiệu lực và tiền tệ. Một mẹo tôi dùng: lưu thêm checksum/version để phát hiện bản ghi bị sửa, và chạy đối soát theo cửa sổ thời gian thay vì toàn bộ lịch sử.`,
  starter: "class Solution {\n    public List<String> reconcile(List<Txn> ledger, List<Txn> bank) {\n        \n    }\n}",
  tests: `class Txn {
    String id;
    long amountCents;
    Txn(String id, long amountCents) {
        this.id = id;
        this.amountCents = amountCents;
    }
}
public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", Arrays.asList("T2: expected=2000, actual=0", "T3: expected=0, actual=700"),
            () -> new Solution().reconcile(
                Arrays.asList(new Txn("T1", 1000), new Txn("T1", 500), new Txn("T2", 2000)),
                Arrays.asList(new Txn("T1", 1500), new Txn("T3", 700))));
        run("empty", Arrays.asList(), () -> new Solution().reconcile(
            new ArrayList<Txn>(), new ArrayList<Txn>()));
        run("balanced", Arrays.asList(), () -> new Solution().reconcile(
            Arrays.asList(new Txn("A", 100), new Txn("B", -50)),
            Arrays.asList(new Txn("B", -50), new Txn("A", 100))));
        run("negative diff", Arrays.asList("B: expected=250, actual=200"),
            () -> new Solution().reconcile(
                Arrays.asList(new Txn("A", -500), new Txn("B", 250)),
                Arrays.asList(new Txn("A", -500), new Txn("B", 200))));
        run("aggregated equal", Arrays.asList(), () -> new Solution().reconcile(
            Arrays.asList(new Txn("X", 100), new Txn("X", 200)),
            Arrays.asList(new Txn("X", 300))));
        run("one side only", Arrays.asList("Z: expected=5, actual=0"),
            () -> new Solution().reconcile(
                Arrays.asList(new Txn("Z", 5)), new ArrayList<Txn>()));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
class Solution {
    public List<String> topK(Stream<String> logs, int k) {
        Map<String, Integer> freq = new HashMap<>();
        logs.forEach(s -> freq.merge(s, 1, Integer::sum));

        PriorityQueue<Map.Entry<String, Integer>> heap =
            new PriorityQueue<>((a, b) -> {
                int byCount = Integer.compare(a.getValue(), b.getValue());
                if (byCount != 0) return byCount;
                return b.getKey().compareTo(a.getKey());   // larger key is evicted first
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
}
~~~

### Lưu ý khi phỏng vấn
- Nếu số giá trị phân biệt quá lớn (hàng chục triệu), {{HashMap}} có thể OOM; khi đó dùng Count-Min Sketch hoặc chia batch/MapReduce.
- Với dữ liệu streaming vô hạn, top-k chính xác cần lưu toàn bộ tần suất; nếu chấp nhận xấp xỉ, dùng thuật toán heavy hitters.
- Không dùng {{a.getValue() - b.getValue()}} trong comparator vì có thể tràn; dùng {{Integer.compare}}.
- Hỏi lại: "log entry" là cả dòng hay đã tách thành field? Việc tách field ảnh hưởng lớn đến cardinality.

> Senior tip: Trong hệ thống log thật, top-k thường chạy theo cửa sổ thời gian (5 phút, 1 giờ) và theo chiều dimension (service, endpoint). Hãy nêu rõ bạn sẽ partition theo service trước khi đếm để tránh một node phải giữ toàn bộ cardinality.`,
  starter: "class Solution {\n    public List<String> topK(Stream<String> logs, int k) {\n        \n    }\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void eq(String what, Object expected, Object actual) {
        if (!Objects.deepEquals(expected, actual)) {
            throw new AssertionError(what + " expected "
                + Arrays.deepToString(new Object[]{expected})
                + " got " + Arrays.deepToString(new Object[]{actual}));
        }
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<Integer> ints(int... v) {
        List<Integer> r = new ArrayList<>();
        for (int x : v) r.add(x);
        return r;
    }
    static List<Integer> seq(int a, int b) {
        List<Integer> r = new ArrayList<>();
        for (int i = a; i <= b; i++) r.add(i);
        return r;
    }

    public static void main(String[] args) {
        run("example", Arrays.asList("ERROR db", "INFO ok"),
            () -> new Solution().topK(Stream.of(
                "ERROR db", "ERROR db", "WARN cache", "ERROR db", "INFO ok"), 2));
        run("all distinct", Arrays.asList("a", "b", "c"),
            () -> new Solution().topK(Stream.of("b", "a", "c"), 3));
        run("most frequent", Arrays.asList("x"),
            () -> new Solution().topK(Stream.of("x", "y", "x", "z", "x", "y"), 1));
        run("tie", Arrays.asList("a", "b"),
            () -> new Solution().topK(Stream.of("b", "a", "b", "a", "c"), 2));
        run("k equals size", Arrays.asList("a", "b", "c"),
            () -> new Solution().topK(Stream.of("c", "b", "a"), 3));
        run("large", Arrays.asList("k0", "k1", "k2"), () -> new Solution().topK(
            IntStream.range(0, 100000).mapToObj(i -> "k" + (i % 10)), 3));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n + u log k), Space O(u)',
  follow: ['Nếu dữ liệu không vừa RAM thì thiết kế MapReduce thế nào?', 'Làm sao tìm top-k theo từng cửa sổ thời gian?']
},
{
  id: 'algo-049', title: 'Normalize Transaction IDs', difficulty: 'easy', pattern: 'String / Simulation', tags: ['string', 'transactions'],
  prompt: `Chuẩn hoá danh sách mã giao dịch: bỏ khoảng trắng đầu/cuối, chuyển thành chữ hoa và bỏ các mã rỗng. Giữ nguyên thứ tự và bản ghi trùng.\n\n### Ví dụ\n~~~text\n[" ab1 ", "", "Xy2"] -> ["AB1", "XY2"]\n~~~\n### Ràng buộc\n0 ≤ n ≤ 100000; mã chỉ chứa chữ ASCII và số.`,
  hints: ['Duyệt một lần, tạo danh sách kết quả mới.', 'Dùng trim rồi kiểm tra chuỗi rỗng trước khi đổi hoa.', 'Không dùng Set vì giao dịch trùng vẫn có ý nghĩa.'],
  solution: `### Ý tưởng\nDuyệt đầu vào theo thứ tự; loại chuỗi rỗng sau trim và thêm bản uppercase.\n~~~java\nclass Solution {\n    public List<String> normalize(List<String> ids) {\n        List<String> out = new ArrayList<>();\n        for (String id : ids) {\n            String value = id.trim();\n            if (!value.isEmpty()) out.add(value.toUpperCase(Locale.ROOT));\n        }\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nLocale.ROOT tránh quy tắc hoa chữ cái phụ thuộc locale máy chủ; không loại trùng nếu nghiệp vụ cần kiểm toán từng giao dịch.

> Senior tip: Chuẩn hoá ID ở boundary giúp tránh bug locale; giữ nguyên thứ tự đầu vào để audit giao dịch.`,
  complexity: 'Time O(n·m), Space O(n·m)', starter: 'class Solution {\n    public List<String> normalize(List<String> ids) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main { static int p=0,t=0; static void c(String n,Object e,Object a){t++; if(Objects.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);} public static void main(String[] x){ Solution s=new Solution(); c("example",Arrays.asList("AB1","XY2"),s.normalize(Arrays.asList(" ab1 ","","Xy2"))); c("empty",Collections.emptyList(),s.normalize(Collections.emptyList())); c("spaces",Collections.emptyList(),s.normalize(Arrays.asList(" ","\\t"))); c("duplicates",Arrays.asList("A","A"),s.normalize(Arrays.asList("a","A"))); c("order",Arrays.asList("B","A"),s.normalize(Arrays.asList("b","a"))); System.out.println("RESULT "+p+"/"+t); }}`,
  follow: ['Nếu ID phân biệt hoa thường thì bạn thay đổi bước chuẩn hoá nào?']
},
{
  id: 'algo-050', title: 'Daily Transaction Totals', difficulty: 'easy', pattern: 'Hash Map', tags: ['hashmap', 'aggregation'],
  prompt: `Gộp số tiền giao dịch theo ngày. Mỗi giao dịch là [ngày, số tiền]; trả về map tổng theo ngày.\n\n### Ví dụ\n~~~text\n[["Mon", 5], ["Tue", 4], ["Mon", -2]] -> {Mon=3, Tue=4}\n~~~\n### Ràng buộc\nSố tiền nằm trong int; tổng dùng long.`,
  hints: ['Mỗi ngày là một key.', 'Dùng merge để cộng dồn.', 'Giá trị tổng cần là long để tránh overflow int.'],
  solution: `### Ý tưởng\nMap giữ tổng tích luỹ; mỗi dòng cập nhật đúng một key.\n~~~java\nclass Solution {\n    public Map<String, Long> totals(String[][] rows) {\n        Map<String, Long> out = new LinkedHashMap<>();\n        for (String[] row : rows) out.merge(row[0], Long.parseLong(row[1]), Long::sum);\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nChọn LinkedHashMap nếu kết quả cần thứ tự ngày xuất hiện; nếu ngày phải sắp chronologically, parse thành LocalDate rồi sort.

> Senior tip: Dùng Long cho tổng tiền; tổng hợp theo ngày nên sort theo LocalDate thay vì string để tránh lỗi định dạng.`,
  complexity: 'Time O(n), Space O(d)', starter: 'class Solution {\n    public Map<String, Long> totals(String[][] rows) {\n        // TODO\n        return new LinkedHashMap<>();\n    }\n}',
  tests: `public class Main { static int p=0,t=0; static void c(String n,Object e,Object a){t++;if(Objects.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);} public static void main(String[] z){Solution s=new Solution(); Map<String,Long> e=new LinkedHashMap<>(); e.put("Mon",3L);e.put("Tue",4L); c("example",e,s.totals(new String[][]{{"Mon","5"},{"Tue","4"},{"Mon","-2"}})); c("empty",new LinkedHashMap<>(),s.totals(new String[0][])); c("negative",Collections.singletonMap("D",-8L),s.totals(new String[][]{{"D","-8"}})); c("zero",Collections.singletonMap("D",0L),s.totals(new String[][]{{"D","3"},{"D","-3"}})); c("large",Collections.singletonMap("D",5000000000L),s.totals(new String[][]{{"D","2147483647"},{"D","2147483647"},{"D","705032706"}})); System.out.println("RESULT "+p+"/"+t); }}`,
  follow: ['Bạn sẽ xử lý dữ liệu vượt RAM theo batch thế nào?']
},
{
  id: 'algo-051', title: 'First Non-repeating Character', difficulty: 'easy', pattern: 'Hash Map / String', tags: ['string', 'frequency'],
  prompt: `Trả về index ký tự đầu tiên chỉ xuất hiện một lần trong chuỗi; nếu không có, trả -1.\n\n### Ví dụ\n~~~text\n"swiss" -> 1\n~~~\n### Ràng buộc\nChuỗi chỉ gồm chữ thường ASCII; độ dài tối đa 200000.`,
  hints: ['Cần biết tần suất trước khi chọn index.', 'Hai lượt duyệt vẫn là O(n).', 'Dùng mảng 26 phần tử cho alphabet đã giới hạn.'],
  solution: `### Ý tưởng\nĐếm tần suất rồi duyệt lại theo thứ tự ban đầu.\n~~~java\nclass Solution {\n    public int firstUnique(String s) {\n        int[] count = new int[26];\n        for (char ch : s.toCharArray()) count[ch - 'a']++;\n        for (int i = 0; i < s.length(); i++) if (count[s.charAt(i) - 'a'] == 1) return i;\n        return -1;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu Unicode grapheme được tính là một ký tự, char không đủ vì Java char là UTF-16 code unit; cần chốt rõ định nghĩa ký tự.

> Senior tip: First non-repeating character hay bị hỏi với Unicode; xác định rõ code point vs code unit trước khi code.`,
  complexity: 'Time O(n), Space O(1)', starter: 'class Solution {\n    public int firstUnique(String s) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",1,s.firstUnique("swiss"));c("empty",-1,s.firstUnique(""));c("all same",-1,s.firstUnique("zzzz"));c("first",0,s.firstUnique("abc"));c("last",4,s.firstUnique("aabbc"));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Nếu cần hỗ trợ Unicode code point thì cách đếm thay đổi ra sao?']
},
{
  id: 'algo-052', title: 'Merge Sorted Transaction Streams', difficulty: 'easy', pattern: 'Two Pointers', tags: ['array', 'merge'],
  prompt: `Trộn hai mảng số đã sắp tăng thành một mảng tăng, giữ cả phần tử trùng.\n\n### Ví dụ\n~~~text\n[1, 4] + [2, 4] -> [1, 2, 4, 4]\n~~~\n### Ràng buộc\nHai đầu vào có thể rỗng; giá trị có thể âm.`,
  hints: ['Giữ một con trỏ trên mỗi mảng.', 'Mỗi bước lấy phần tử nhỏ hơn.', 'Khi một mảng hết, chép phần còn lại.'],
  solution: `### Ý tưởng\nMỗi vòng lặp tiêu thụ ít nhất một phần tử nên tổng thời gian tuyến tính.\n~~~java\nclass Solution {\n    public int[] merge(int[] a, int[] b) {\n        int[] out = new int[a.length + b.length]; int i=0,j=0,k=0;\n        while(i<a.length && j<b.length) out[k++]=a[i]<=b[j]?a[i++]:b[j++];\n        while(i<a.length) out[k++]=a[i++];\n        while(j<b.length) out[k++]=b[j++];\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu dữ liệu đến streaming, có thể phát từng phần tử nhưng cần backpressure khi consumer chậm.

> Senior tip: Merge sorted streams cần cân nhắc memory và backpressure; với dữ liệu lớn, streaming iterator tốt hơn mảng.`,
  complexity: 'Time O(n + m), Space O(n + m)', starter: 'class Solution {\n    public int[] merge(int[] a, int[] b) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int[]e,int[]a){t++;if(Arrays.equals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.toString(e)+" got "+Arrays.toString(a));}public static void main(String[]x){Solution s=new Solution();c("example",new int[]{1,2,4,4},s.merge(new int[]{1,4},new int[]{2,4}));c("both empty",new int[]{},s.merge(new int[]{},new int[]{}));c("one empty",new int[]{-2,0},s.merge(new int[]{},new int[]{-2,0}));c("negative",new int[]{-5,-2,1},s.merge(new int[]{-5,1},new int[]{-2}));c("many dup",new int[]{1,1,1,1},s.merge(new int[]{1,1},new int[]{1,1}));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Hai stream nếu chỉ sắp theo timestamp thì nên merge thế nào?']
},
{
  id: 'algo-053', title: 'Maximum Profit from One Trade', difficulty: 'easy', pattern: 'Array Scan', tags: ['array', 'greedy'],
  prompt: `Cho giá cổ phiếu theo ngày, chọn tối đa một lần mua rồi bán về sau để lợi nhuận lớn nhất; không giao dịch thì lợi nhuận 0.\n\n### Ví dụ\n~~~text\n[7, 1, 5, 3, 6, 4] -> 5\n~~~\n### Ràng buộc\n0 ≤ n ≤ 200000; giá không âm.`,
  hints: ['Khi đứng tại ngày bán, cần biết giá mua rẻ nhất trước đó.', 'Cập nhật min trước khi tính lợi nhuận.', 'Không cần lưu toàn bộ lịch sử ngoài giá thấp nhất và best.'],
  solution: `### Ý tưởng\nDuyệt trái sang phải, mỗi giá bán so với minimum đã thấy.\n~~~java\nclass Solution {\n    public int maxProfit(int[] prices) {\n        int low = Integer.MAX_VALUE, best = 0;\n        for (int price : prices) { low = Math.min(low, price); best = Math.max(best, price - low); }\n        return best;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu cho phép nhiều giao dịch, đây là một bài khác; cần làm rõ phí và cooldown.

> Senior tip: Bài một giao dịch chỉ cần track min price; nếu nhiều giao dịch thì cần DP riêng, đừng trộn hai yêu cầu.`,
  complexity: 'Time O(n), Space O(1)', starter: 'class Solution {\n    public int maxProfit(int[] prices) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",5,s.maxProfit(new int[]{7,1,5,3,6,4}));c("empty",0,s.maxProfit(new int[]{}));c("single",0,s.maxProfit(new int[]{9}));c("descending",0,s.maxProfit(new int[]{9,7,3,1}));c("best late",9,s.maxProfit(new int[]{2,1,10}));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Nếu cần trả về cả ngày mua và bán thì xử lý tie thế nào?']
},
{
  id: 'algo-054', title: 'Balanced Brackets with Types', difficulty: 'easy', pattern: 'Stack', tags: ['stack', 'string'],
  prompt: `Kiểm tra chuỗi chỉ gồm (), [], {} có đóng mở đúng thứ tự không. Chuỗi rỗng được xem là hợp lệ.\n\n### Ví dụ\n~~~text\n{[()]} -> true; ([)] -> false\n~~~\n### Ràng buộc\nĐộ dài tối đa 200000.`,
  hints: ['Khi gặp ký tự mở, lưu loại ngoặc.', 'Ký tự đóng phải khớp với phần tử gần nhất chưa đóng.', 'Nếu stack còn phần tử sau vòng lặp thì chuỗi thiếu ngoặc đóng.'],
  solution: `### Ý tưởng\nStack mô hình hoá các ngoặc còn chờ đóng theo thứ tự LIFO.\n~~~java\nclass Solution {\n    public boolean balanced(String s) {\n        Deque<Character> st = new ArrayDeque<>();\n        for(char c:s.toCharArray()) {\n            if(c=='('||c=='['||c=='{') st.push(c);\n            else { if(st.isEmpty()) return false; char o=st.pop();\n                if((c==')'&&o!='(')||(c==']'&&o!='[')||(c=='}'&&o!='{')) return false; }\n        }\n        return st.isEmpty();\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nArrayDeque không chấp nhận null; ở đây chỉ push char hợp lệ.

> Senior tip: Balanced brackets nên dùng ArrayDeque; clarify ký tự hợp lệ và encoding trước khi implement.`,
  complexity: 'Time O(n), Space O(n)', starter: 'class Solution {\n    public boolean balanced(String s) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,boolean e,boolean a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("nested",true,s.balanced("{[()] }".replace(" ","")));c("crossed",false,s.balanced("([)]"));c("empty",true,s.balanced(""));c("leading close",false,s.balanced(")("));c("unclosed",false,s.balanced("{{["));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Nếu chuỗi có cả ký tự thường và chỉ cần bỏ qua chúng thì thay đổi gì?']
},
{
 id:'algo-055',title:'Longest Window Under Budget',difficulty:'medium',pattern:'Sliding Window',tags:['array','window'],
 prompt:`Cho mảng chi phí không âm và ngân sách B, trả độ dài đoạn liên tiếp dài nhất có tổng ≤ B.\n\n### Ví dụ\n~~~text\n[2,1,3,2], B=4 -> 2\n~~~\n### Ràng buộc\n0 ≤ n ≤ 200000; chi phí không âm.`, hints:['Dùng hai đầu cửa sổ.','Mở rộng phải, vượt ngân sách thì co trái.','Tính chất không âm bảo đảm co trái không làm tổng giảm bất thường.'],
 solution:`### Ý tưởng\nCửa sổ duy trì tổng hợp lệ; mỗi phần tử vào và ra nhiều nhất một lần.\n~~~java\nclass Solution { public int longest(int[] a,int budget){ int l=0,best=0; long sum=0; for(int r=0;r<a.length;r++){sum+=a[r]; while(sum>budget) sum-=a[l++]; best=Math.max(best,r-l+1);} return best;} }\n~~~\n### Lưu ý khi phỏng vấn\nSliding window này không đúng nếu có số âm vì tổng không còn đơn điệu.`, complexity:'Time O(n), Space O(1)', starter:'class Solution { public int longest(int[] a,int budget) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",2,s.longest(new int[]{2,1,3,2},4));c("empty",0,s.longest(new int[]{},5));c("all fit",3,s.longest(new int[]{1,1,1},3));c("none fit",0,s.longest(new int[]{5,6},2));c("zero",4,s.longest(new int[]{0,0,2,0},2));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Nếu chi phí âm xuất hiện, bạn chọn cấu trúc nào?']
},
{
 id:'algo-056',title:'Count Subarrays with Target Sum',difficulty:'medium',pattern:'Prefix Sum / Hash Map',tags:['prefix-sum','hashmap'],
 prompt:`Đếm số đoạn con liên tiếp có tổng bằng target; mảng có thể chứa số âm.\n\n### Ví dụ\n~~~text\n[1,1,1], target=2 -> 2\n~~~\n### Ràng buộc\nn ≤ 200000.`, hints:['Dùng prefix sum.','Với tổng hiện tại P, cần số prefix P-target đã gặp.','Map lưu tần suất, khởi tạo prefix 0 một lần.'],
 solution:`### Ý tưởng\nNếu prefix[j]-prefix[i]=target thì đoạn (i,j] hợp lệ; đếm prefix cần tìm trước khi ghi nhận prefix hiện tại.\n~~~java\nclass Solution { public long count(int[] a,int target){ Map<Long,Long> f=new HashMap<>(); f.put(0L,1L); long sum=0,ans=0; for(int v:a){sum+=v; ans+=f.getOrDefault(sum-target,0L); f.merge(sum,1L,Long::sum);} return ans;} }\n~~~\n### Lưu ý khi phỏng vấn\nDùng long cho tổng và kết quả; số đoạn có thể xấp xỉ n(n+1)/2.`, complexity:'Time O(n), Space O(n)', starter:'class Solution { public long count(int[] a,int target) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,long e,long a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",2,s.count(new int[]{1,1,1},2));c("empty",0,s.count(new int[]{},0));c("negative",4,s.count(new int[]{1,-1,1,-1},0));c("zeros",6,s.count(new int[]{0,0,0},0));c("single",1,s.count(new int[]{5},5));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Vì sao sliding window không tổng quát cho số âm?']
},
{
 id:'algo-057',title:'Merge Booking Intervals',difficulty:'medium',pattern:'Intervals',tags:['sort','interval'],
 prompt:`Gộp các khoảng lịch chồng lấn hoặc chạm nhau; trả danh sách đã sắp theo điểm bắt đầu.\n\n### Ví dụ\n~~~text\n[[1,3],[3,5],[8,9]] -> [[1,5],[8,9]]\n~~~\n### Ràng buộc\nMỗi khoảng có start ≤ end.`, hints:['Sắp xếp theo start.','Giữ khoảng hiện tại và mở rộng end nếu giao nhau.','Clone dữ liệu nếu không được phép sửa đầu vào.'],
 solution:`### Ý tưởng\nSau khi sort, chỉ khoảng cuối kết quả có thể giao với interval mới.\n~~~java\nclass Solution { public int[][] merge(int[][] a){ Arrays.sort(a,Comparator.comparingInt(x->x[0])); List<int[]> out=new ArrayList<>(); for(int[] v:a){if(out.isEmpty()||v[0]>out.get(out.size()-1)[1]) out.add(new int[]{v[0],v[1]}); else out.get(out.size()-1)[1]=Math.max(out.get(out.size()-1)[1],v[1]);} return out.toArray(new int[out.size()][]);} }\n~~~\n### Lưu ý khi phỏng vấn\nCần hỏi khoảng đóng hay nửa mở; điều kiện chạm nhau phụ thuộc hợp đồng thời gian.`, complexity:'Time O(n log n), Space O(n)', starter:'class Solution { public int[][] merge(int[][] a) { return new int[0][]; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int[][]e,int[][]a){t++;if(Arrays.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.deepToString(e)+" got "+Arrays.deepToString(a));}public static void main(String[]x){Solution s=new Solution();c("example",new int[][]{{1,5},{8,9}},s.merge(new int[][]{{1,3},{3,5},{8,9}}));c("empty",new int[][]{},s.merge(new int[][]{}));c("one",new int[][]{{2,4}},s.merge(new int[][]{{2,4}}));c("nested",new int[][]{{1,10}},s.merge(new int[][]{{1,10},{2,3},{4,8}}));c("unordered",new int[][]{{1,4},{7,9}},s.merge(new int[][]{{7,9},{1,2},{2,4}}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Lịch họp dùng khoảng [start,end) thì điều kiện overlap đổi thế nào?']
},
{
 id:'algo-058',title:'Minimum Meeting Rooms',difficulty:'medium',pattern:'Heap / Intervals',tags:['heap','scheduling'],
 prompt:`Cho các cuộc họp [start,end), tìm số phòng tối thiểu để không cuộc nào chồng lấn trong cùng phòng.\n\n### Ví dụ\n~~~text\n[[0,30],[5,10],[15,20]] -> 2\n~~~\n### Ràng buộc\nstart < end; n ≤ 100000.`, hints:['Sắp theo giờ bắt đầu.','Min-heap lưu giờ kết thúc sớm nhất của mỗi phòng đang bận.','Nếu phòng sớm nhất đã kết thúc, tái sử dụng phòng đó.'],
 solution:`### Ý tưởng\nHeap kích thước biểu diễn số phòng đang cần; end bằng start được tái sử dụng theo khoảng nửa mở.\n~~~java\nclass Solution { public int rooms(int[][] a){ Arrays.sort(a,Comparator.comparingInt(v->v[0])); PriorityQueue<Integer> q=new PriorityQueue<>(); int best=0; for(int[] m:a){while(!q.isEmpty()&&q.peek()<=m[0])q.poll(); q.offer(m[1]); best=Math.max(best,q.size());} return best;} }\n~~~\n### Lưu ý khi phỏng vấn\nNếu cần gán phòng cụ thể, heap nên lưu cả roomId; complexity vẫn O(n log n).`, complexity:'Time O(n log n), Space O(n)', starter:'class Solution { public int rooms(int[][] a) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",2,s.rooms(new int[][]{{0,30},{5,10},{15,20}}));c("empty",0,s.rooms(new int[][]{}));c("sequential",1,s.rooms(new int[][]{{0,2},{2,4},{4,5}}));c("same start",3,s.rooms(new int[][]{{1,3},{1,4},{1,5}}));c("unordered",2,s.rooms(new int[][]{{5,7},{0,6},{7,8}}));c("reuse all ended",2,s.rooms(new int[][]{{0,1},{0,2},{2,3},{2,4}}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Bạn sẽ trả về lịch gán từng meeting vào phòng ra sao?']
},
{
 id:'algo-059',title:'Search in Rotated Sorted Array',difficulty:'medium',pattern:'Binary Search',tags:['binary-search','array'],
 prompt:`Mảng tăng dần bị xoay tại một vị trí chưa biết, tìm index target hoặc -1; các phần tử không trùng.\n\n### Ví dụ\n~~~text\n[4,5,6,7,0,1,2], target=0 -> 4\n~~~\n### Ràng buộc\nO(log n) thời gian.`, hints:['Ở mỗi bước ít nhất một nửa vẫn được sắp xếp.','Xác định nửa sorted rồi kiểm tra target có nằm trong khoảng đó không.','Thu hẹp biên dựa trên khoảng bao gồm.'],
 solution:`### Ý tưởng\nBinary search vẫn loại một nửa mỗi lượt bằng cách nhận diện nửa có thứ tự.\n~~~java\nclass Solution { public int search(int[] a,int x){int l=0,r=a.length-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==x)return m;if(a[l]<=a[m]){if(a[l]<=x&&x<a[m])r=m-1;else l=m+1;}else{if(a[m]<x&&x<=a[r])l=m+1;else r=m-1;}}return -1;} }\n~~~\n### Lưu ý khi phỏng vấn\nCó duplicate làm nhận diện nửa sorted mơ hồ; worst case có thể giảm về O(n).`, complexity:'Time O(log n), Space O(1)', starter:'class Solution { public int search(int[] a,int x) { return -1; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",4,s.search(new int[]{4,5,6,7,0,1,2},0));c("empty",-1,s.search(new int[]{},3));c("absent",-1,s.search(new int[]{4,5,6,7,0,1,2},3));c("unrotated",2,s.search(new int[]{1,3,5,7},5));c("single",0,s.search(new int[]{8},8));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Bạn xử lý duplicate trong điều kiện nào để vẫn đảm bảo đúng?']
},
{
 id:'algo-060',title:'Minimum Rate to Finish Jobs',difficulty:'medium',pattern:'Binary Search on Answer',tags:['binary-search','capacity'],
 prompt:`Máy xử lý tối đa rate đơn vị mỗi giờ; mỗi giờ chỉ xử lý một job, phần dư giờ bỏ đi. Tìm rate nguyên nhỏ nhất để hoàn tất tất cả khối lượng trong H giờ.\n\n### Ví dụ\n~~~text\n[3,6,7,11], H=8 -> 4\n~~~\n### Ràng buộc\nKhối lượng dương; H ≥ số job.`, hints:['Rate thấp nhất là 1, cao nhất là job lớn nhất.','Kiểm tra rate bằng tổng ceil(work/rate).','Tính ceil bằng phép chia nguyên an toàn.'],
 solution:`### Ý tưởng\nTính khả thi đơn điệu theo rate nên binary search trên đáp án.\n~~~java\nclass Solution { public int minRate(int[] a,int h){int lo=1,hi=0;for(int x:a)hi=Math.max(hi,x);while(lo<hi){int m=lo+(hi-lo)/2;long hours=0;for(int x:a)hours+=(x+(long)m-1)/m;if(hours<=h)hi=m;else lo=m+1;}return lo;} }\n~~~\n### Lưu ý khi phỏng vấn\nÉp long trước phép cộng để tránh overflow khi x gần Integer.MAX_VALUE.`, complexity:'Time O(n log M), Space O(1)', starter:'class Solution { public int minRate(int[] a,int h) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",4,s.minRate(new int[]{3,6,7,11},8));c("one",5,s.minRate(new int[]{5},1));c("enough hours",1,s.minRate(new int[]{1,2,3},6));c("large",1073741824,s.minRate(new int[]{2147483647},2));c("tight",11,s.minRate(new int[]{3,6,7,11},4));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Nếu H nhỏ hơn số job, API nên trả gì?']
},
{
 id:'algo-061',title:'Count Connected Components',difficulty:'medium',pattern:'Graph / DFS',tags:['graph','dfs'],
 prompt:`Cho n đỉnh đánh số 0..n-1 và danh sách cạnh vô hướng, đếm thành phần liên thông.\n\n### Ví dụ\n~~~text\nn=5, edges=[[0,1],[1,2],[3,4]] -> 2\n~~~\n### Ràng buộc\nĐồ thị không có cạnh trùng; n ≤ 100000.`, hints:['Tạo adjacency list.','Mỗi lần gặp đỉnh chưa thăm, tăng count và DFS/BFS đánh dấu toàn vùng.','Dùng stack lặp để tránh tràn call stack trên graph sâu.'],
 solution:`### Ý tưởng\nMỗi lượt DFS đánh dấu đúng một connected component.\n~~~java\nclass Solution { public int components(int n,int[][] edges){List<List<Integer>> g=new ArrayList<>();for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int[]e:edges){g.get(e[0]).add(e[1]);g.get(e[1]).add(e[0]);}boolean[] seen=new boolean[n];int count=0;for(int i=0;i<n;i++)if(!seen[i]){count++;Deque<Integer> q=new ArrayDeque<>();q.push(i);seen[i]=true;while(!q.isEmpty()){int v=q.pop();for(int w:g.get(v))if(!seen[w]){seen[w]=true;q.push(w);}}}return count;} }\n~~~\n### Lưu ý khi phỏng vấn\nVới graph rất lớn trong production, adjacency list có overhead object; cân nhắc CSR/primitive arrays.`, complexity:'Time O(V + E), Space O(V + E)', starter:'class Solution { public int components(int n,int[][] edges) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",2,s.components(5,new int[][]{{0,1},{1,2},{3,4}}));c("empty graph",0,s.components(0,new int[][]{}));c("isolated",4,s.components(4,new int[][]{}));c("single component",1,s.components(4,new int[][]{{0,1},{1,2},{2,3}}));c("self loop",3,s.components(3,new int[][]{{1,1}}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Nếu cạnh có hướng, khái niệm component nào phù hợp?']
},
{
 id:'algo-062',title:'Shortest Path in an Unweighted Graph',difficulty:'medium',pattern:'Graph / BFS',tags:['graph','bfs'],
 prompt:`Tìm số cạnh ít nhất từ source đến target trong graph vô hướng không trọng số; không tới được trả -1.\n\n### Ví dụ\n~~~text\n0-1, 1-2, 0-3, 3-2: 0 tới 2 -> 2\n~~~\n### Ràng buộc\nĐỉnh đánh số 0..n-1.`, hints:['BFS thăm theo từng lớp khoảng cách.','Đánh dấu visited khi enqueue để không đưa lặp vào queue.','Có thể trả ngay khi target được lấy ra khỏi queue.'],
 solution:`### Ý tưởng\nBFS đảm bảo lần đầu thăm đỉnh là đường đi ít cạnh nhất.\n~~~java\nclass Solution { public int shortest(int n,int[][] e,int src,int dst){List<List<Integer>>g=new ArrayList<>();for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int[]x:e){g.get(x[0]).add(x[1]);g.get(x[1]).add(x[0]);}int[]d=new int[n];Arrays.fill(d,-1);Queue<Integer>q=new ArrayDeque<>();q.offer(src);d[src]=0;while(!q.isEmpty()){int v=q.poll();if(v==dst)return d[v];for(int w:g.get(v))if(d[w]<0){d[w]=d[v]+1;q.offer(w);}}return -1;} }\n~~~\n### Lưu ý khi phỏng vấn\nWeighted edges cần Dijkstra (trọng số không âm), không dùng BFS thường.`, complexity:'Time O(V + E), Space O(V + E)', starter:'class Solution { public int shortest(int n,int[][] e,int src,int dst) { return -1; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",2,s.shortest(4,new int[][]{{0,1},{1,2},{0,3},{3,2}},0,2));c("same",0,s.shortest(2,new int[][]{},1,1));c("disconnected",-1,s.shortest(3,new int[][]{{0,1}},0,2));c("direct",1,s.shortest(3,new int[][]{{0,2},{0,1}},0,2));c("chain",3,s.shortest(4,new int[][]{{0,1},{1,2},{2,3}},0,3));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Bạn sẽ xử lý nhiều truy vấn source-target trên cùng graph thế nào?']
},
{
 id:'algo-063',title:'Top K Frequent Transaction Codes',difficulty:'medium',pattern:'Heap / Hash Map',tags:['heap','frequency'],
 prompt:`Trả về k mã xuất hiện nhiều nhất; nếu cùng tần suất, mã từ điển nhỏ hơn đứng trước.\n\n### Ví dụ\n~~~text\n["b","a","b","a","c"], k=2 -> ["a","b"]\n~~~\n### Ràng buộc\n1 ≤ k ≤ số mã phân biệt.`, hints:['Đếm frequency bằng Map.','Comparator phải sắp tần suất giảm và key tăng.','Có thể sort toàn bộ unique keys hoặc dùng heap khi k nhỏ.'],
 solution:`### Ý tưởng\nSort unique key theo quy tắc xác định rồi lấy k phần tử đầu.\n~~~java\nclass Solution { public List<String> top(String[] a,int k){Map<String,Integer>m=new HashMap<>();for(String s:a)m.merge(s,1,Integer::sum);List<String>r=new ArrayList<>(m.keySet());r.sort((x,y)->m.get(x).equals(m.get(y))?x.compareTo(y):Integer.compare(m.get(y),m.get(x)));return new ArrayList<>(r.subList(0,k));} }\n~~~\n### Lưu ý khi phỏng vấn\nNếu dữ liệu stream không vừa RAM, cần approximate heavy hitters hoặc partition theo key.`, complexity:'Time O(n + u log u), Space O(u)', starter:'class Solution { public List<String> top(String[] a,int k) { return new ArrayList<>(); } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,Object e,Object a){t++;if(Objects.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("tie",Arrays.asList("a","b"),s.top(new String[]{"b","a","b","a","c"},2));c("single",Arrays.asList("x"),s.top(new String[]{"x","y","x"},1));c("all",Arrays.asList("a","b","c"),s.top(new String[]{"c","b","a"},3));c("frequency",Arrays.asList("z","a"),s.top(new String[]{"z","z","z","a","a","b"},2));c("duplicates",Arrays.asList("m"),s.top(new String[]{"m","m","m"},1));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Làm sao giới hạn memory nếu unique key rất lớn?']
},
{
 id:'algo-064',title:'Simulate ATM Withdrawals',difficulty:'medium',pattern:'Simulation / Greedy',tags:['simulation','greedy'],
 prompt:`ATM có các mệnh giá [100,50,20,10] và tồn kho từng loại. Với yêu cầu rút amount, trả vector số tờ dùng ít nhất theo greedy mệnh giá lớn trước; nếu không đủ chính xác hoặc tồn kho, trả null.\n\n### Ví dụ\n~~~text\namount=180, stock=[1,2,5,10] -> [1,1,1,1]\n~~~\n### Ràng buộc\nKhông sửa stock đầu vào khi giao dịch thất bại.`, hints:['Thử lần lượt từ mệnh giá lớn.','Giới hạn số tờ bởi tồn kho và amount/denomination.','Chỉ commit kết quả nếu remainder về 0.'],
 solution:`### Ý tưởng\nMỗi lần lấy tối đa số tờ khả dụng ở denomination hiện tại; kết quả tạm thời không làm đổi stock.\n~~~java\nclass Solution { public int[] withdraw(int amount,int[] stock){int[]d={100,50,20,10},out=new int[4];for(int i=0;i<4;i++){out[i]=Math.min(stock[i],amount/d[i]);amount-=out[i]*d[i];}return amount==0?out:null;} }\n~~~\n### Lưu ý khi phỏng vấn\nGreedy tối thiểu số tờ đúng với bộ mệnh giá chuẩn này trong điều kiện tồn kho? Khi giới hạn tồn kho, greedy không luôn tìm được tổ hợp nếu có denominations tùy ý; cần DP/backtracking.`, complexity:'Time O(1), Space O(1)', starter:'class Solution { public int[] withdraw(int amount,int[] stock) { return null; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int[]e,int[]a){t++;if(Arrays.equals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.toString(e)+" got "+Arrays.toString(a));}public static void main(String[]x){Solution s=new Solution();c("example",new int[]{1,1,1,1},s.withdraw(180,new int[]{1,2,5,10}));c("zero",new int[]{0,0,0,0},s.withdraw(0,new int[]{1,1,1,1}));c("impossible",null,s.withdraw(15,new int[]{0,0,0,1}));c("greedy limitation",null,s.withdraw(60,new int[]{0,1,3,0}));int[] st={1,2,5,10};c("exact",new int[]{0,1,0,1},s.withdraw(60,st));c("large",new int[]{2,0,0,0},s.withdraw(200,new int[]{2,0,0,0}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Làm sao đảm bảo không phát tiền nếu cassette hardware lỗi giữa chừng?']
},
{
 id:'algo-065',title:'Longest Increasing Subsequence Length',difficulty:'medium',pattern:'Dynamic Programming / Binary Search',tags:['dp','binary-search'],
 prompt:`Trả độ dài subsequence tăng nghiêm ngặt dài nhất; không cần liên tiếp.\n\n### Ví dụ\n~~~text\n[10,9,2,5,3,7,101,18] -> 4\n~~~\n### Ràng buộc\nn ≤ 200000.`, hints:['DP O(n²) là hướng cơ bản nhưng chậm với input lớn.','Duy trì tails: vị trí i là giá trị kết thúc nhỏ nhất của subsequence độ dài i+1.','Với mỗi số, lower_bound tìm vị trí đầu tiên ≥ số đó.'],
 solution:`### Ý tưởng\ntails không phải luôn là subsequence thật, nhưng độ dài của nó chính xác là đáp án.\n~~~java\nclass Solution { public int lis(int[] a){int[]t=new int[a.length];int size=0;for(int x:a){int l=0,r=size;while(l<r){int m=(l+r)/2;if(t[m]<x)l=m+1;else r=m;}t[l]=x;if(l==size)size++;}return size;} }\n~~~\n### Lưu ý khi phỏng vấn\nDùng < trong lower_bound để tăng nghiêm ngặt; bài không giảm dùng upper_bound.`, complexity:'Time O(n log n), Space O(n)', starter:'class Solution { public int lis(int[] a) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",4,s.lis(new int[]{10,9,2,5,3,7,101,18}));c("empty",0,s.lis(new int[]{}));c("equal",1,s.lis(new int[]{2,2,2}));c("increasing",4,s.lis(new int[]{1,2,3,4}));c("negative",4,s.lis(new int[]{-3,-2,-5,0,1}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Làm sao khôi phục chính dãy subsequence, không chỉ độ dài?']
},
{
 id:'algo-066',title:'Maximum Profit with At Most K Trades',difficulty:'hard',pattern:'Dynamic Programming',tags:['dp','transactions'],
 prompt:`Cho giá theo ngày và số giao dịch tối đa k. Mỗi giao dịch gồm mua rồi bán; không giữ nhiều vị thế cùng lúc. Trả lợi nhuận tối đa.\n\n### Ví dụ\n~~~text\nprices=[3,2,6,5,0,3], k=2 -> 7\n~~~\n### Ràng buộc\nn ≤ 1000, k ≤ 100.`, hints:['DP theo số giao dịch đã bán và trạng thái hold/cash.','Mỗi ngày dùng giá cũ để tránh mua và bán cùng ngày trong cùng transition.', 'Nếu k ≥ n/2, bài rút gọn thành tổng các đoạn tăng.'],
 solution:`### Ý tưởng\nDP giữ lợi nhuận tốt nhất sau tối đa j lần bán ở trạng thái cash hoặc đang giữ cổ phiếu.\n~~~java\nclass Solution { public long profit(int k,int[] p){if(p.length==0||k==0)return 0;if(k>=p.length/2){long a=0;for(int i=1;i<p.length;i++)a+=Math.max(0L,(long)p[i]-p[i-1]);return a;}long[] cash=new long[k+1],hold=new long[k+1];Arrays.fill(hold,Long.MIN_VALUE/4);for(int price:p)for(int j=k;j>=1;j--){cash[j]=Math.max(cash[j],hold[j]+price);hold[j]=Math.max(hold[j],cash[j-1]-price);}return cash[k];} }\n~~~\n### Lưu ý khi phỏng vấn\nNếu có fee/cooldown, transition state cần bổ sung; làm rõ thứ tự cập nhật để không dùng state cùng ngày sai.`, complexity:'Time O(nk), Space O(k)', starter:'class Solution { public long profit(int k,int[] p) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,long e,long a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",7,s.profit(2,new int[]{3,2,6,5,0,3}));c("empty",0,s.profit(2,new int[]{}));c("zero k",0,s.profit(0,new int[]{1,5}));c("one trade",6,s.profit(1,new int[]{1,2,3,0,6}));c("unlimited",5,s.profit(10,new int[]{1,3,2,5}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Thêm transaction fee và cooldown cần thêm trạng thái nào?']
},
{
 id:'algo-067',title:'Minimum Cost to Connect Sites',difficulty:'hard',pattern:'Graph / Minimum Spanning Tree',tags:['graph','mst','union-find'],
 prompt:`Cho n site và cạnh [u,v,cost] giữa một số cặp site, trả chi phí nhỏ nhất để kết nối tất cả site; nếu không thể thì -1.\n\n### Ví dụ\n~~~text\nn=4, edges=[[0,1,1],[1,2,2],[2,3,3],[0,3,9]] -> 6\n~~~\n### Ràng buộc\nChi phí không âm; n ≤ 100000.`, hints:['Một spanning tree tối ưu có n-1 cạnh.','Kruskal: sort cạnh theo cost và chỉ nhận cạnh nối hai component khác nhau.','Union-Find path compression + union by size giữ amortized gần hằng số.'],
 solution:`### Ý tưởng\nKruskal chọn cạnh rẻ nhất không tạo cycle; kết thúc khi đủ n-1 cạnh.\n~~~java\nclass Solution { public long mst(int n,int[][] e){Arrays.sort(e,Comparator.comparingInt(a->a[2]));int[]p=new int[n],sz=new int[n];for(int i=0;i<n;i++){p[i]=i;sz[i]=1;}long cost=0;int used=0;for(int[]x:e){int a=find(p,x[0]),b=find(p,x[1]);if(a!=b){if(sz[a]<sz[b]){int z=a;a=b;b=z;}p[b]=a;sz[a]+=sz[b];cost+=x[2];if(++used==n-1)return cost;}}return n<=1?0:-1;} static int find(int[]p,int x){while(p[x]!=x){p[x]=p[p[x]];x=p[x];}return x;} }\n~~~\n### Lưu ý khi phỏng vấn\nTổng cost dùng long; graph disconnected phải báo rõ thay vì trả forest cost.`, complexity:'Time O(E log E), Space O(V)', starter:'class Solution { public long mst(int n,int[][] e) { return -1; } static int find(int[] p,int x){return x;} }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,long e,long a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",6,s.mst(4,new int[][]{{0,1,1},{1,2,2},{2,3,3},{0,3,9}}));c("single",0,s.mst(1,new int[][]{}));c("disconnected",-1,s.mst(3,new int[][]{{0,1,2}}));c("duplicate routes",3,s.mst(3,new int[][]{{0,1,1},{0,1,2},{1,2,2},{0,2,8}}));c("zero costs",0,s.mst(3,new int[][]{{0,1,0},{1,2,0}}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Khi nào Prim tốt hơn Kruskal?']
},
{
 id:'algo-068',title:'Maximum Subarray Sum',difficulty:'hard',pattern:'Dynamic Programming / Prefix',tags:['array','kadane'],
 prompt:`Tìm tổng lớn nhất của một đoạn con không rỗng liên tiếp.\n\n### Ví dụ\n~~~text\n[-2,1,-3,4,-1,2,1,-5,4] -> 6\n~~~\n### Ràng buộc\n1 ≤ n ≤ 200000; phần tử có thể âm.`, hints:['Tại mỗi phần tử, so sánh bắt đầu đoạn mới với nối đoạn cũ.','Giữ best kết thúc tại vị trí hiện tại và best toàn cục.','Dùng long nếu tổng vượt phạm vi int.'],
 solution:`### Ý tưởng\nKadane duy trì best-ending-here; bỏ prefix âm vì nó chỉ làm mọi suffix phía sau nhỏ hơn.\n~~~java\nclass Solution { public long maxSubarray(int[] a){long cur=a[0],best=a[0];for(int i=1;i<a.length;i++){cur=Math.max(a[i],cur+a[i]);best=Math.max(best,cur);}return best;} }\n~~~\n### Lưu ý khi phỏng vấn\nKhông khởi tạo best bằng 0 nếu đoạn phải không rỗng; toàn mảng âm là edge case quan trọng.`, complexity:'Time O(n), Space O(1)', starter:'class Solution { public long maxSubarray(int[] a) { return 0; } }',
 tests:`public class Main {static int p=0,t=0;static void c(String n,long e,long a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",6,s.maxSubarray(new int[]{-2,1,-3,4,-1,2,1,-5,4}));c("single",-7,s.maxSubarray(new int[]{-7}));c("all negative",-1,s.maxSubarray(new int[]{-4,-1,-8}));c("all positive",10,s.maxSubarray(new int[]{1,2,3,4}));c("zero bridge",2,s.maxSubarray(new int[]{1,-1,0,2}));System.out.println("RESULT "+p+"/"+t);}}`, follow:['Làm sao trả cả biên trái và phải của đoạn tối ưu?']
},
{
  id: 'algo-069',
  title: 'LRU Cache',
  difficulty: 'medium',
  pattern: 'Hash Map / Design',
  tags: ['cache', 'linked-list'],
  prompt: `Thiết kế cache LRU có capacity dương. {{get(key)}} trả value hoặc -1; {{put(key, value)}} thêm/cập nhật. Mỗi thao tác phải O(1); truy cập gần nhất đứng đầu.

### Ví dụ
~~~text
capacity=2; put(1,1), put(2,2), get(1), put(3,3), get(2) -> -1
~~~
### Ràng buộc
Cache bắt đầu rỗng.`,
  hints: ['Map tra node theo key nhanh nhưng chưa biết node nào ít dùng nhất.', 'Kết hợp doubly linked list để unlink/move node O(1).', 'Dummy head/tail giảm nhánh biên; khi đầy, loại node ngay trước tail.'],
  solution: `### Ý tưởng
HashMap ánh xạ key tới node; doubly linked list giữ thứ tự sử dụng. get/put chạm node thì chuyển lên đầu, còn eviction lấy cuối danh sách.
~~~java
class LRUCache {
    private static class Node { int k,v; Node p,n; Node(int k,int v){this.k=k;this.v=v;} }
    private final int cap; private final Map<Integer,Node> map=new HashMap<>();
    private final Node h=new Node(0,0), t=new Node(0,0);
    public LRUCache(int c){cap=c;h.n=t;t.p=h;}
    private void unlink(Node x){x.p.n=x.n;x.n.p=x.p;}
    private void front(Node x){x.n=h.n;x.p=h;h.n.p=x;h.n=x;}
    public int get(int k){Node x=map.get(k);if(x==null)return -1;unlink(x);front(x);return x.v;}
    public void put(int k,int v){Node x=map.get(k);if(x!=null){x.v=v;unlink(x);front(x);return;}x=new Node(k,v);map.put(k,x);front(x);if(map.size()>cap){Node z=t.p;unlink(z);map.remove(z.k);}}
}
~~~
### Lưu ý khi phỏng vấn
Cần làm rõ capacity, key null và thread safety. Bản này không thread-safe; production thường cần đồng bộ hoặc cache chuyên dụng.
> Senior tip: Nếu thêm TTL, eviction theo thời gian và LRU là hai chính sách riêng; đừng để một policy âm thầm thay thế policy kia.`,
  starter: `class LRUCache {
    public LRUCache(int capacity) { }
    public int get(int key) { return -1; }
    public void put(int key, int value) { }
}`,
  tests: `public class Main { static int p=0,t=0; interface C{void run() throws Throwable;} static void c(String n,C x){t++;try{x.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": threw "+e);}} static void eq(int e,int a){if(e!=a)throw new AssertionError("expected "+e+" got "+a);} public static void main(String[]z){c("eviction",()->{LRUCache x=new LRUCache(2);x.put(1,1);x.put(2,2);eq(1,x.get(1));x.put(3,3);eq(-1,x.get(2));});c("update",()->{LRUCache x=new LRUCache(1);x.put(1,1);x.put(1,7);eq(7,x.get(1));});c("refresh order",()->{LRUCache x=new LRUCache(2);x.put(1,1);x.put(2,2);x.get(1);x.put(3,3);eq(-1,x.get(2));eq(1,x.get(1));});c("capacity one",()->{LRUCache x=new LRUCache(1);x.put(4,8);x.put(5,9);eq(-1,x.get(4));eq(9,x.get(5));});c("missing",()->eq(-1,new LRUCache(3).get(99)));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(1) per operation, Space O(capacity)',
  follow: ['Nếu nhiều thread gọi đồng thời thì bạn bảo vệ cấu trúc map và list thế nào?']
},
{
  id: 'algo-070',
  title: 'Top K Frequent Integers',
  difficulty: 'medium',
  pattern: 'Heap / Hash Map',
  tags: ['heap', 'frequency'],
  prompt: `Cho mảng số nguyên {{nums}} và {{k}}, trả {{k}} giá trị xuất hiện nhiều nhất. Nếu tần suất bằng nhau, số nhỏ hơn đứng trước để kết quả xác định.

### Ví dụ
~~~text
nums=[1,1,1,2,2,3], k=2 -> [1,2]
~~~
### Ràng buộc
{{1 <= k <= số giá trị phân biệt}}`,
  hints: ['Đếm mỗi giá trị một lần bằng HashMap.', 'Comparator cần tần suất giảm, sau đó giá trị tăng.', 'Min-heap kích thước k giảm sort xuống O(u log k).'],
  solution: `### Ý tưởng
Đếm tần suất, rồi duy trì min-heap gồm k ứng viên. Phần tử ở đỉnh là ứng viên yếu nhất theo tần suất; tie-break theo số lớn hơn sẽ bị loại trước.
~~~java
class Solution { public int[] topKFrequent(int[] a,int k){Map<Integer,Integer> m=new HashMap<>();for(int x:a)m.merge(x,1,Integer::sum);PriorityQueue<Integer> q=new PriorityQueue<>((x,y)->m.get(x).equals(m.get(y))?Integer.compare(y,x):Integer.compare(m.get(x),m.get(y)));for(int x:m.keySet()){q.offer(x);if(q.size()>k)q.poll();}int[] r=new int[k];for(int i=k-1;i>=0;i--)r[i]=q.poll();return r;} }
~~~
### Lưu ý khi phỏng vấn
Tie-break phải được định nghĩa nếu test cần output xác định. Với k gần u, sort toàn bộ có thể đơn giản hơn heap.
> Senior tip: Streaming vô hạn cần sketch heavy-hitter hoặc partition; heap chỉ giải quyết tập dữ liệu đã đếm được.`,
  starter: 'class Solution { public int[] topKFrequent(int[] nums, int k) { return new int[0]; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int[] go();}static void c(String n,int[]e,C f){t++;try{int[]a=f.go();if(Arrays.equals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.toString(e)+" got "+Arrays.toString(a));}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",new int[]{1,2},()->s.topKFrequent(new int[]{1,1,1,2,2,3},2));c("tie",new int[]{-2,4},()->s.topKFrequent(new int[]{4,-2},2));c("one value",new int[]{7},()->s.topKFrequent(new int[]{7,7,7},1));c("negative counts",new int[]{-1,0},()->s.topKFrequent(new int[]{-1,0,-1,0,2},2));c("all",new int[]{1,2,3},()->s.topKFrequent(new int[]{3,2,1},3));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(n + u log k), Space O(u + k)',
  follow: ['Nếu tie không cần thứ tự xác định, comparator có thể đơn giản hơn ra sao?']
},
{
  id: 'algo-071',
  title: 'Merge Intervals',
  difficulty: 'medium',
  pattern: 'Sorting',
  tags: ['interval', 'sorting'],
  prompt: `Cho danh sách khoảng đóng {{[start,end]}}, gộp các khoảng giao nhau và trả danh sách đã sắp xếp.

### Ví dụ
~~~text
[[1,3],[2,6],[8,10],[15,18]] -> [[1,6],[8,10],[15,18]]
~~~
### Ràng buộc
Khoảng chạm nhau tại đầu mút được xem là giao nhau.`,
  hints: ['Sắp xếp theo start để các khoảng có thể gộp nằm cạnh nhau.', 'So sánh start tiếp theo với end hiện tại.', 'Nếu start <= end thì kéo end lên max; nếu không, chốt khoảng.'],
  solution: `### Ý tưởng
Sau khi sort, chỉ cần giữ một khoảng đang mở. Mọi khoảng tiếp theo bắt đầu trước hoặc tại end hiện tại sẽ nhập vào nó.
~~~java
class Solution { public int[][] merge(int[][] a){if(a.length==0)return new int[0][2];Arrays.sort(a,(x,y)->Integer.compare(x[0],y[0]));List<int[]> r=new ArrayList<>();int s=a[0][0],e=a[0][1];for(int i=1;i<a.length;i++){if(a[i][0]<=e)e=Math.max(e,a[i][1]);else{r.add(new int[]{s,e});s=a[i][0];e=a[i][1];}}r.add(new int[]{s,e});return r.toArray(new int[r.size()][]);} }
~~~
### Lưu ý khi phỏng vấn
Đề khoảng mở/đóng sẽ đổi điều kiện biên. Hàm sort sửa input; clone trước nếu caller yêu cầu giữ nguyên.
> Senior tip: Với lịch lớn cập nhật liên tục, sort lại toàn bộ mỗi lần không phù hợp; cần cấu trúc interval có thứ tự hoặc batch hóa cập nhật.`,
  starter: 'class Solution { public int[][] merge(int[][] intervals) { return new int[0][2]; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int[][] go();}static void c(String n,int[][]e,C f){t++;try{int[][]a=f.go();if(Arrays.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.deepToString(e)+" got "+Arrays.deepToString(a));}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",new int[][]{{1,6},{8,10},{15,18}},()->s.merge(new int[][]{{1,3},{2,6},{8,10},{15,18}}));c("empty",new int[][]{},()->s.merge(new int[][]{}));c("touch",new int[][]{{1,5}},()->s.merge(new int[][]{{1,2},{2,5}}));c("contained",new int[][]{{1,10}},()->s.merge(new int[][]{{1,10},{2,3},{4,8}}));c("disjoint",new int[][]{{-3,-1},{0,2}},()->s.merge(new int[][]{{0,2},{-3,-1}}));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Nếu khoảng là nửa mở [start,end) thì điều kiện gộp thay đổi thế nào?']
},
{
  id: 'algo-072',
  title: 'Meeting Rooms II',
  difficulty: 'medium',
  pattern: 'Heap / Intervals',
  tags: ['meeting', 'heap'],
  prompt: `Cho các cuộc họp {{[start,end]}} với {{start < end}}, trả số phòng tối thiểu để mọi cuộc họp diễn ra đúng lịch.

### Ví dụ
~~~text
[[0,30],[5,10],[15,20]] -> 2
~~~
### Ràng buộc
Cuộc họp kết thúc tại thời điểm t có thể dùng chung phòng với cuộc họp bắt đầu tại t.`,
  hints: ['Sort cuộc họp theo giờ bắt đầu.', 'Min-heap giữ giờ kết thúc sớm nhất trong các phòng đang bận.', 'Nếu min end <= start, tái sử dụng phòng bằng cách poll trước khi offer end mới.'],
  solution: `### Ý tưởng
Khi xử lý cuộc họp theo start tăng dần, chỉ phòng kết thúc sớm nhất có thể được giải phóng trước cuộc họp này. Heap biểu diễn các phòng đang bận.
~~~java
class Solution { public int minMeetingRooms(int[][] a){Arrays.sort(a,(x,y)->Integer.compare(x[0],y[0]));PriorityQueue<Integer> q=new PriorityQueue<>();for(int[] x:a){if(!q.isEmpty()&&q.peek()<=x[0])q.poll();q.offer(x[1]);}return q.size();} }
~~~
### Lưu ý khi phỏng vấn
So sánh <= vì end bằng start cho phép tái sử dụng phòng. Nếu interval semantics khác, xác nhận điều đó trước.
> Senior tip: Calendar thực tế cần timezone, hủy họp và cập nhật đồng thời; thuật toán này chỉ giải quyết snapshot tĩnh.`,
  starter: 'class Solution { public int minMeetingRooms(int[][] intervals) { return 0; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int go();}static void c(String n,int e,C f){t++;try{int a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",2,()->s.minMeetingRooms(new int[][]{{0,30},{5,10},{15,20}}));c("empty",0,()->s.minMeetingRooms(new int[][]{}));c("touching",1,()->s.minMeetingRooms(new int[][]{{0,5},{5,9}}));c("all overlap",3,()->s.minMeetingRooms(new int[][]{{1,4},{2,5},{3,6}}));c("disjoint",1,()->s.minMeetingRooms(new int[][]{{-5,-1},{0,2},{4,8}}));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: ['Bạn sẽ trả lại lịch phân phòng cụ thể thay vì chỉ số lượng thế nào?']
},
{
  id: 'algo-073',
  title: 'Course Schedule',
  difficulty: 'medium',
  pattern: 'Graph / Topological Sort',
  tags: ['graph', 'topological-sort'],
  prompt: `Có {{numCourses}} khóa học và prerequisite {{[course, prerequisite]}}, xác định có thể học hết tất cả hay không.

### Ví dụ
~~~text
2, [[1,0]] -> true
2, [[1,0],[0,1]] -> false
~~~
### Ràng buộc
Các cạnh tạo đồ thị có hướng; cycle khiến không thể hoàn tất.`,
  hints: ['Mô hình mỗi prerequisite là cạnh prerequisite -> course.', 'Kahn: đếm indegree, đưa đỉnh 0 vào queue.', 'Nếu số đỉnh lấy khỏi queue bằng numCourses thì không có cycle.'],
  solution: `### Ý tưởng
Topological sort loại dần khóa không còn prerequisite. Cycle giữ lại indegree dương nên không thể lấy hết đỉnh.
~~~java
class Solution { public boolean canFinish(int n,int[][] p){List<List<Integer>> g=new ArrayList<>();int[] d=new int[n];for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int[] e:p){g.get(e[1]).add(e[0]);d[e[0]]++;}Queue<Integer> q=new ArrayDeque<>();for(int i=0;i<n;i++)if(d[i]==0)q.offer(i);int seen=0;while(!q.isEmpty()){int v=q.poll();seen++;for(int w:g.get(v))if(--d[w]==0)q.offer(w);}return seen==n;} }
~~~
### Lưu ý khi phỏng vấn
Nhiều edge trùng vẫn được xử lý đúng nếu indegree tăng/giảm tương ứng. Đầu vào production cần validate index.
> Senior tip: Nếu cần lập kế hoạch song song, topo order là nền tảng nhưng cần thêm duration và critical path.`,
  starter: 'class Solution { public boolean canFinish(int numCourses, int[][] prerequisites) { return false; } }',
  tests: `public class Main {static int p=0,t=0;interface C{boolean go();}static void c(String n,boolean e,C f){t++;try{boolean a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("simple",true,()->s.canFinish(2,new int[][]{{1,0}}));c("cycle",false,()->s.canFinish(2,new int[][]{{1,0},{0,1}}));c("no courses",true,()->s.canFinish(0,new int[][]{}));c("disconnected",true,()->s.canFinish(4,new int[][]{{1,0},{3,2}}));c("self cycle",false,()->s.canFinish(1,new int[][]{{0,0}}));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(V + E), Space O(V + E)',
  follow: ['Làm sao trả một thứ tự học hợp lệ thay vì boolean?']
},
{
  id: 'algo-074',
  title: 'Coin Change',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'coin-change'],
  prompt: `Cho các mệnh giá xu dương {{coins}} và số tiền {{amount}}, tìm số xu ít nhất để tạo đúng số tiền; không thể thì trả -1.

### Ví dụ
~~~text
coins=[1,2,5], amount=11 -> 3
~~~
### Ràng buộc
Mỗi mệnh giá có thể dùng không giới hạn; amount có thể bằng 0.`,
  hints: ['Đáp án của x phụ thuộc đáp án nhỏ hơn x một đồng xu.', 'dp[x] = min(dp[x], dp[x-coin] + 1).', 'Khởi tạo INF lớn hơn mọi đáp án; dp[0]=0.'],
  solution: `### Ý tưởng
Bottom-up DP tính lượng xu tối thiểu cho từng giá trị từ 0 đến amount. Vì mỗi coin có thể tái sử dụng, duyệt mọi coin cho mỗi tổng là phù hợp.
~~~java
class Solution { public int coinChange(int[] c,int a){int inf=a+1;int[] d=new int[a+1];Arrays.fill(d,inf);d[0]=0;for(int x=1;x<=a;x++)for(int v:c)if(v<=x&&d[x-v]!=inf)d[x]=Math.min(d[x],d[x-v]+1);return d[a]==inf?-1:d[a];} }
~~~
### Lưu ý khi phỏng vấn
Greedy không đúng với mọi hệ mệnh giá, ví dụ [1,3,4], amount 6. Bộ nhớ O(amount) có thể lớn khi amount rất lớn.
> Senior tip: Nếu amount thuộc miền rất lớn nhưng số coin nhỏ, cân nhắc shortest path trên residue hoặc thuật toán theo cấu trúc mệnh giá; đừng mặc định DP phù hợp.`,
  starter: 'class Solution { public int coinChange(int[] coins, int amount) { return -1; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int go();}static void c(String n,int e,C f){t++;try{int a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",3,()->s.coinChange(new int[]{1,2,5},11));c("zero",0,()->s.coinChange(new int[]{2},0));c("impossible",-1,()->s.coinChange(new int[]{2},3));c("greedy trap",2,()->s.coinChange(new int[]{1,3,4},6));c("single denomination",4,()->s.coinChange(new int[]{3},12));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(amount × số mệnh giá), Space O(amount)',
  follow: ['Nếu cần trả lại những đồng xu đã chọn, cần lưu thêm dữ liệu gì?']
},
{
  id: 'algo-075',
  title: 'Longest Substring Without Repeating Characters',
  difficulty: 'medium',
  pattern: 'Sliding Window',
  tags: ['string', 'sliding-window'],
  prompt: `Tìm độ dài substring dài nhất không chứa ký tự lặp trong chuỗi {{s}}.

### Ví dụ
~~~text
"abcabcbb" -> 3
~~~
### Ràng buộc
Chuỗi có thể rỗng; ký tự được tính theo Java char (UTF-16 code unit).`,
  hints: ['Dùng cửa sổ [left,right] và map ghi vị trí xuất hiện gần nhất.', 'Khi gặp ký tự trong cửa sổ, đưa left qua vị trí cũ.', 'left chỉ tăng: dùng max(left, previous + 1).'],
  solution: `### Ý tưởng
Mỗi lần mở rộng right, nếu ký tự đã xuất hiện sau hoặc tại left thì bỏ phần cửa sổ đến sau lần xuất hiện đó. Map lưu lần cuối giúp tránh co cửa sổ từng bước.
~~~java
class Solution { public int lengthOfLongestSubstring(String s){Map<Character,Integer> last=new HashMap<>();int left=0,best=0;for(int r=0;r<s.length();r++){char c=s.charAt(r);Integer p=last.put(c,r);if(p!=null&&p>=left)left=p+1;best=Math.max(best,r-left+1);}return best;} }
~~~
### Lưu ý khi phỏng vấn
Java char là code unit; nếu yêu cầu Unicode code point, cần duyệt code point và lưu vị trí theo index code point.
> Senior tip: Không reset toàn bộ map khi gặp duplicate; cập nhật left đơn điệu giúp mỗi ký tự được xử lý O(1) trung bình.`,
  starter: 'class Solution { public int lengthOfLongestSubstring(String s) { return 0; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int go();}static void c(String n,int e,C f){t++;try{int a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",3,()->s.lengthOfLongestSubstring("abcabcbb"));c("empty",0,()->s.lengthOfLongestSubstring(""));c("all same",1,()->s.lengthOfLongestSubstring("bbbbb"));c("repeat after window",3,()->s.lengthOfLongestSubstring("pwwkew"));c("distinct",5,()->s.lengthOfLongestSubstring("abcde"));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(n) average, Space O(min(n, alphabet))',
  follow: ['Nếu cần tìm cả vị trí substring dài nhất thì thay đổi gì?']
},
{
  id: 'algo-076',
  title: 'Kth Largest Element in an Array',
  difficulty: 'medium',
  pattern: 'Heap / Quickselect',
  tags: ['heap', 'selection'],
  prompt: `Tìm phần tử lớn thứ {{k}} trong mảng {{nums}}; phần tử lặp vẫn được tính theo vị trí trong thứ tự.

### Ví dụ
~~~text
[3,2,1,5,6,4], k=2 -> 5
~~~
### Ràng buộc
{{1 <= k <= nums.length}}`,
  hints: ['Min-heap kích thước k giữ k phần tử lớn nhất đã thấy.', 'Nếu heap vượt k, bỏ phần tử nhỏ nhất.', 'Đỉnh heap cuối cùng chính là phần tử lớn thứ k.'],
  solution: `### Ý tưởng
Duy trì min-heap tối đa k phần tử. Mọi phần tử nhỏ hơn đỉnh có thể bị bỏ vì đã có ít nhất k giá trị không nhỏ hơn nó.
~~~java
class Solution { public int findKthLargest(int[] a,int k){PriorityQueue<Integer> q=new PriorityQueue<>();for(int x:a){q.offer(x);if(q.size()>k)q.poll();}return q.peek();} }
~~~
### Lưu ý khi phỏng vấn
Heap O(n log k) ổn định; Quickselect trung bình O(n) nhưng worst-case O(n²) và thường sửa input.
> Senior tip: Với API không được phép sửa mảng do caller chia sẻ, copy trước khi partition Quickselect.`,
  starter: 'class Solution { public int findKthLargest(int[] nums, int k) { return 0; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int go();}static void c(String n,int e,C f){t++;try{int a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",5,()->s.findKthLargest(new int[]{3,2,1,5,6,4},2));c("largest",9,()->s.findKthLargest(new int[]{9,1,2},1));c("smallest",1,()->s.findKthLargest(new int[]{3,1,2},3));c("duplicates",4,()->s.findKthLargest(new int[]{4,4,4,1},2));c("negative",-5,()->s.findKthLargest(new int[]{-5,-2,-9},2));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(n log k), Space O(k)',
  follow: ['Khi nào Quickselect phù hợp hơn heap trong thực tế?']
},
{
  id: 'algo-077',
  title: 'Number of Islands',
  difficulty: 'medium',
  pattern: 'Graph / BFS',
  tags: ['grid', 'bfs'],
  prompt: `Grid gồm {{'1'}} là đất và {{'0'}} là nước. Đếm số đảo; các ô chỉ nối nhau theo bốn hướng.

### Ví dụ
~~~text
110
010
001 -> 2
~~~
### Ràng buộc
Grid rỗng có 0 đảo.`,
  hints: ['Quét từng ô; gặp đất chưa thăm thì phát hiện một đảo mới.', 'Flood fill BFS/DFS và đánh dấu toàn bộ vùng đất liên thông.', 'Đánh dấu khi enqueue để tránh thêm một ô nhiều lần.'],
  solution: `### Ý tưởng
Mỗi flood fill đi qua đúng một connected component của các ô đất. BFS lặp tránh nguy cơ tràn call stack trên grid lớn.
~~~java
class Solution { public int numIslands(char[][] g){if(g.length==0)return 0;int m=g.length,n=g[0].length,count=0;boolean[][] seen=new boolean[m][n];int[] dr={1,-1,0,0},dc={0,0,1,-1};for(int r=0;r<m;r++)for(int c=0;c<n;c++)if(g[r][c]=='1'&&!seen[r][c]){count++;Queue<int[]>q=new ArrayDeque<>();q.offer(new int[]{r,c});seen[r][c]=true;while(!q.isEmpty()){int[]x=q.poll();for(int d=0;d<4;d++){int a=x[0]+dr[d],b=x[1]+dc[d];if(a>=0&&a<m&&b>=0&&b<n&&g[a][b]=='1'&&!seen[a][b]){seen[a][b]=true;q.offer(new int[]{a,b});}}}}return count;} }
~~~
### Lưu ý khi phỏng vấn
Bản này không sửa input nhưng tốn O(mn) visited; có thể đánh dấu trực tiếp nếu được phép mutate grid.
> Senior tip: Với grid rất lớn hoặc phân tán, connected components cần partition và xử lý các cạnh nối giữa partition.`,
  starter: 'class Solution { public int numIslands(char[][] grid) { return 0; } }',
  tests: `public class Main {static int p=0,t=0;interface C{int go();}static void c(String n,int e,C f){t++;try{int a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){Solution s=new Solution();c("example",2,()->s.numIslands(new char[][]{{'1','1','0'},{'0','1','0'},{'0','0','1'}}));c("empty",0,()->s.numIslands(new char[][]{}));c("all water",0,()->s.numIslands(new char[][]{{'0','0'},{'0','0'}}));c("diagonal separate",2,()->s.numIslands(new char[][]{{'1','0'},{'0','1'}}));c("one component",1,()->s.numIslands(new char[][]{{'1','1'},{'1','1'}}));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(rows × cols), Space O(rows × cols)',
  follow: ['Nếu đường chéo cũng được xem là nối, cần sửa hướng duyệt ra sao?']
},
{
  id: 'algo-078',
  title: 'Fixed Window Rate Limiter',
  difficulty: 'medium',
  pattern: 'Design / Hash Map',
  tags: ['rate-limiter', 'design'],
  prompt: `Thiết kế limiter đơn giản theo user: cho phép tối đa {{limit}} request trong mỗi cửa sổ {{windowMs}}. Viết {{allow(user, nowMs)}} trả true khi request được chấp nhận. Cửa sổ bắt đầu tại request đầu tiên và kết thúc khi {{nowMs - start >= windowMs}}.

### Ví dụ
~~~text
limit=2, window=1000; allow("u",0)=true, allow("u",5)=true, allow("u",9)=false, allow("u",1000)=true
~~~
### Ràng buộc
{{limit > 0}}, {{windowMs > 0}}; thời gian truyền vào không giảm với từng user.`,
  hints: ['Lưu start và số request cho mỗi user.', 'Nếu đã qua windowMs thì bắt đầu cửa sổ mới trước khi xét limit.', 'Tách state theo user; request đúng ranh giới mở cửa sổ mới.'],
  solution: `### Ý tưởng
Map giữ start/count cho từng user. Request đầu tiên mở cửa sổ; trong cửa sổ tăng count tới limit; khi elapsed >= windowMs thì reset.
~~~java
class RateLimiter { static class State {long start;int count;State(long s){start=s;count=1;}} private final int limit;private final long window;private final Map<String,State> m=new HashMap<>(); RateLimiter(int l,long w){limit=l;window=w;} public boolean allow(String user,long now){State s=m.get(user);if(s==null||now-s.start>=window){m.put(user,new State(now));return true;}if(s.count>=limit)return false;s.count++;return true;} }
~~~
### Lưu ý khi phỏng vấn
Đây là fixed window per user, không thread-safe, không phân tán và state không được dọn. Production cần atomic update, eviction, clock policy và thường dùng Redis/Lua hoặc token bucket.
> Senior tip: Fixed window có thể cho burst gần 2×limit quanh ranh giới; sliding window giảm hiệu ứng đó nhưng tốn state hơn.`,
  starter: `class RateLimiter {
    RateLimiter(int limit, long windowMs) { }
    public boolean allow(String user, long nowMs) { return false; }
}`,
  tests: `public class Main {static int p=0,t=0;interface C{boolean go();}static void c(String n,boolean e,C f){t++;try{boolean a=f.go();if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}catch(Throwable x){System.out.println("FAIL "+n+": threw "+x);}}public static void main(String[]z){c("limit boundary",true,()->{RateLimiter r=new RateLimiter(2,10);return r.allow("u",0)&&r.allow("u",5)&&!r.allow("u",9)&&r.allow("u",10);});c("separate users",true,()->{RateLimiter r=new RateLimiter(1,10);return r.allow("a",0)&&r.allow("b",0)&&!r.allow("a",1);});c("reset",true,()->{RateLimiter r=new RateLimiter(1,10);r.allow("u",2);return r.allow("u",12);});c("window not elapsed",true,()->{RateLimiter r=new RateLimiter(1,10);r.allow("u",2);return !r.allow("u",11);});c("fresh",true,()->new RateLimiter(3,5).allow("new",100));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(1) average per request, Space O(number of users)',
  follow: ['Bạn xử lý nhiều server cùng limit và request đồng thời thế nào?']
},
{
  id: 'algo-079',
  title: 'Sliding Window Maximum',
  difficulty: 'hard',
  pattern: 'Sliding Window / Deque',
  tags: ['array', 'deque', 'monotonic'],
  prompt: `Cho mảng số nguyên {{nums}} và kích thước cửa sổ {{k}}, trả về giá trị lớn nhất trong mỗi cửa sổ trượt từ trái sang phải.

### Ví dụ
~~~text
Input:  nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]
Giải thích: cửa sổ 1: [1,3,-1] max=3; cửa sổ 2: [3,-1,-3] max=3...
~~~

### Ràng buộc
- {{1 <= nums.length <= 10^5}}
- {{1 <= k <= nums.length}}
- {{-10^4 <= nums[i] <= 10^4}}`,
  hints: [
    'Brute force duyệt từng cửa sổ là O(n*k). Cần cấu trúc cho phép thêm và xoá phần tử ở hai đầu cửa sổ trong O(1).',
    'Dùng deque (hàng đợi hai đầu): giữ chỉ số theo thứ tự giảm dần giá trị. Đầu deque luôn là max của cửa sổ hiện tại.',
    'Khi thêm phần tử mới, xoá từ cuối deque các phần tử nhỏ hơn nó; khi cửa sổ trượt, xoá phần tử rời khỏi cửa sổ từ đầu deque nếu cần.'
  ],
  solution: `### Ý tưởng
Duy trì deque chứa các chỉ số theo thứ tự giảm dần {{nums[i]}}. Với mỗi vị trí phải:
1. Xoá từ cuối các chỉ số có giá trị nhỏ hơn {{nums[i]}}.
2. Thêm {{i}} vào cuối.
3. Xoá từ đầu các chỉ số đã rời khỏi cửa sổ ({{i - k + 1 > deque.peek()}}).
4. Khi {{i >= k - 1}}, đầu deque là max của cửa sổ.

~~~java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || k <= 0) return new int[0];
        Deque<Integer> dq = new ArrayDeque<>();
        int[] res = new int[nums.length - k + 1];
        int idx = 0;
        for (int i = 0; i < nums.length; i++) {
            // Smaller values can never be the maximum while nums[i] stays in the window
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            // Remove the index that just fell out of the window
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
            // First full window ends at i == k - 1
            if (i >= k - 1) res[idx++] = nums[dq.peekFirst()];
        }
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Deque giữ chỉ số chứ không phải giá trị trực tiếp, để dễ kiểm tra phần tử nào đã rời khỏi cửa sổ.
- Nếu k = 1 thì kết quả chính là bản sao của nums; nếu tất cả phần tử bằng nhau thì deque chỉ còn một phần tử.

> Senior tip: Với stream dữ liệu liên tục, deque giữ tối đa k phần tử; bộ nhớ O(k) và không thể giảm thêm vì phải biết phần tử nào sắp rời cửa sổ.`,
  starter: 'class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + java.util.Arrays.deepToString(new Object[]{expected}) + " got " + java.util.Arrays.deepToString(new Object[]{actual}));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", new int[]{3,3,5,5,6,7}, () -> s.maxSlidingWindow(new int[]{1,3,-1,-3,5,3,6,7}, 3));
        run("k=1", new int[]{1,2,3}, () -> s.maxSlidingWindow(new int[]{1,2,3}, 1));
        run("all same", new int[]{5,5,5}, () -> s.maxSlidingWindow(new int[]{5,5,5,5}, 2));
        run("decreasing", new int[]{4,3,2}, () -> s.maxSlidingWindow(new int[]{4,3,2,1}, 2));
        run("single", new int[]{9}, () -> s.maxSlidingWindow(new int[]{9}, 1));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(k)',
  follow: ['Nếu k rất lớn (gần n) thì có thể dùng cấu trúc khác không?', 'Làm sao xử lý stream không biết trước độ dài?']
},
{
  id: 'algo-080',
  title: 'Word Ladder',
  difficulty: 'hard',
  pattern: 'BFS / Graph',
  tags: ['string', 'bfs', 'graph'],
  prompt: `Cho hai từ {{beginWord}} và {{endWord}}, cùng danh sách từ {{wordList}}. Tìm độ dài đường ngắn nhất từ {{beginWord}} đến {{endWord}} bằng cách chỉ thay đổi một ký tự ở mỗi bước và các từ trung gian phải có trong {{wordList}}. Nếu không có đường thì trả về 0.

### Ví dụ
~~~text
Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Giải thích: hit -> hot -> dot -> dog -> cog (5 từ, 4 bước) -> trả 5.
~~~

### Ràng buộc
- {{1 <= wordList.length <= 5000}}
- {{beginWord.length == endWord.length == wordList[i].length == 10}}`,
  hints: [
    'Xem mỗi từ là một đỉnh; hai từ nối nhau nếu khác đúng một ký tự. Cần đường đi ngắn nhất trên đồ thị không trọng số.',
    'Thay vì xây đồ thị tường minh, tạo các từ láng giềng bằng cách thay từng ký tự bằng 26 chữ cái và kiểm tra trong wordList.',
    'BFS từ beginWord, mỗi bước duyệt các từ láng giềng chưa thăm; dùng HashSet để tra cứu nhanh và đánh dấu đã thăm.'
  ],
  solution: `### Ý tưởng
BFS từ {{beginWord}}. Để tìm láng giềng nhanh, lưu {{wordList}} trong {{HashSet}}. Với mỗi từ, duyệt từng vị trí và thay bằng từng chữ cái từ 'a' đến 'z'; nếu từ mới có trong set và chưa thăm thì thêm vào hàng đợi.

~~~java
class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList); // O(1) lookup, also acts as visited set
        if (!words.contains(endWord)) return 0;
        Queue<String> q = new ArrayDeque<>();
        q.offer(beginWord);
        words.remove(beginWord);
        int steps = 1; // number of words on the current BFS path
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                String w = q.poll();
                if (w.equals(endWord)) return steps;
                char[] chars = w.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char orig = chars[j];
                    // Generate neighbors by trying all 26 letters at position j
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[j] = c;
                        String next = new String(chars);
                        if (words.contains(next)) {
                            words.remove(next); // mark visited before enqueue
                            q.offer(next);
                        }
                    }
                    chars[j] = orig;
                }
            }
            steps++;
        }
        return 0;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu wordList rất lớn, tạo đồ thị tường minh sẽ tốn O(n²); tạo láng giềng động giảm bộ nhớ nhưng tăng thời gian tạo láng giềng.
- Nếu beginWord bằng endWord thì đường đi là chính nó (1 từ) nhưng đề thường yêu cầu có đường đi thực sự.

> Senior tip: Trong production, nếu từ điển là từ thực tế tiếng Anh, có thể dùng index theo pattern (*ot) để tìm láng giềng nhanh hơn duyệt 26 chữ cái; điều này giảm từ O(L*26) xuống O(số láng giềng trung bình).`,
  starter: 'class Solution {\n    public int ladderLength(String beginWord, String endWord, java.util.List<String> wordList) {\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        java.util.List<String> w1 = java.util.Arrays.asList("hot","dot","dog","lot","log","cog");
        run("example", 5, () -> s.ladderLength("hit", "cog", w1));
        java.util.List<String> w2 = java.util.Arrays.asList("hot","dot","dog","lot","log");
        run("no path", 0, () -> s.ladderLength("hit", "cog", w2));
        java.util.List<String> w3 = java.util.Arrays.asList("hot","dot","dog","cog");
        run("same start end", 1, () -> s.ladderLength("hot", "hot", w3));
        java.util.List<String> w4 = java.util.Arrays.asList("a","b","c");
        run("short", 2, () -> s.ladderLength("a", "c", w4));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * L * 26), Space O(n)',
  follow: ['Nếu từ điển là tiếng Việt (Unicode), cấu trúc láng giềng cần điều chỉnh thế nào?', 'Có thể dùng bidirectional BFS để tăng tốc không?']
},
{
  id: 'algo-081',
  title: 'Median of Two Sorted Arrays',
  difficulty: 'hard',
  pattern: 'Binary Search',
  tags: ['array', 'binary-search', 'divide-conquer'],
  prompt: `Cho hai mảng đã sắp xếp {{nums1}} và {{nums2}}, tìm giá trị trung vị (median) của toàn bộ các phần tử đã hợp nhất. Độ phức tạp phải là O(log(min(m,n))).

### Ví dụ
~~~text
Input: nums1 = [1,3], nums2 = [2]  -> Output: 2.0
Input: nums1 = [1,2], nums2 = [3,4] -> Output: 2.5
~~~

### Ràng buộc
- {{0 <= nums1.length, nums2.length <= 1000}}
- {{-10^6 <= nums1[i], nums2[i] <= 10^6}}`,
  hints: [
    'Nếu hợp nhất hai mảng rồi tìm median thì O(m+n), không đạt yêu cầu.',
    'Dùng binary search trên mảng ngắn hơn để tìm điểm chia sao cho nửa trái và nửa phải có tổng số phần tử bằng nhau.',
    'Với mỗi điểm chia, kiểm tra điều kiện {{max(leftA, leftB) <= min(rightA, rightB)}}; điều chỉnh binary search dựa trên so sánh giá trị tại ranh giới.'
  ],
  solution: `### Ý tưởng
Chia cả hai mảng thành hai nửa sao cho số phần tử ở nửa trái bằng hoặc nhiều hơn nửa phải đúng một phần tử (khi tổng lẻ). Dùng binary search trên mảng ngắn hơn để tìm điểm chia {{i}}; điểm chia tương ứng trên mảng dài là {{(m+n+1)//2 - i}}.

Nếu {{max(leftA, leftB) <= min(rightA, rightB)}} thì đã tìm được; nếu không thì điều chỉnh binary search dựa trên giá trị ranh giới.

~~~java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int m = nums1.length, n = nums2.length;
        if (m > n) { int[] tmpA = nums1; nums1 = nums2; nums2 = tmpA; m = nums1.length; n = nums2.length; }
        int left = 0, right = m, halfLen = (m + n + 1) / 2;
        while (left <= right) {
            int i = (left + right) / 2; // cut in the shorter array
            int j = halfLen - i;        // cut in the longer array
            // Sentinels avoid extra branches when a cut is at an array edge
            int maxLeftA = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRightA = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeftB = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRightB = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
                if ((m + n) % 2 == 0) return (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2.0;
                else return Math.max(maxLeftA, maxLeftB);
            } else if (maxLeftA > minRightB) right = i - 1; // too many from nums1 on the left
            else left = i + 1;
        }
        throw new IllegalArgumentException("invalid input");
    }
}
~~~

### Lưu ý khi phỏng vấn
- Luôn đảm bảo tìm trên mảng ngắn hơn để binary search có log(min(m,n)).
- Khi tổng chẵn, median là trung bình của hai giá trị ở giữa; khi lẻ, là giá trị ở giữa.
- Cẩn thận overflow khi tính trung bình; dùng double ngay từ đầu.

> Senior tip: Bài này thường bị hỏi tiếp "nếu một mảng là stream vô hạn" — câu trả lời là phải dùng cấu trúc khác (ví dụ heap hai chiều) và không thể áp dụng binary search trực tiếp.`,
  starter: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            Double a = (actual instanceof Double) ? (Double) actual : Double.valueOf(String.valueOf(actual));
            Double e = (expected instanceof Double) ? (Double) expected : Double.valueOf(String.valueOf(expected));
            if (Math.abs(a - e) < 1e-6) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + e + " got " + a);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("odd", 2.0, () -> s.findMedianSortedArrays(new int[]{1,3}, new int[]{2}));
        run("even", 2.5, () -> s.findMedianSortedArrays(new int[]{1,2}, new int[]{3,4}));
        run("one empty", 1.0, () -> s.findMedianSortedArrays(new int[]{}, new int[]{1}));
        run("same values", 3.0, () -> s.findMedianSortedArrays(new int[]{3,3}, new int[]{3,3,3}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(log(min(m,n))), Space O(1)',
  follow: ['Nếu một mảng rất dài và một mảng rất ngắn, binary search có còn hiệu quả không?', 'Có thể mở rộng cho k median trong nhiều mảng không?']
},
{
  id: 'algo-082',
  title: 'Basic Calculator',
  difficulty: 'hard',
  pattern: 'Stack',
  tags: ['string', 'stack', 'math'],
  prompt: `Tính giá trị biểu thức toán học chứa các ký tự số nguyên, dấu cộng (+), trừ (-), và dấu ngoặc đơn ( ). Biểu thức có thể bắt đầu bằng dấu trừ. Không có dấu nhân hoặc chia.

### Ví dụ
~~~text
Input: s = "(1+(4+5+2)-3)+(6+8)"
Output: 23
Input: s = "- (3 + (4 + 5))"
Output: -12
~~~

### Ràng buộc
- {{1 <= s.length <= 3 * 10^4}}
- {{s chỉ gồm chữ số, '+', '-', '(', ')', và khoảng trắng}}`,
  hints: [
    'Dấu ngoặc thay đổi dấu của các số bên trong. Cần lưu dấu hiện tại và tổng tích luỹ cho từng cấp độ ngoặc.',
    'Dùng stack để đẩy tổng tích luỹ và dấu hiện tại khi gặp dấu mở ngoặc; khi gặp dấu đóng, tính tổng con và cộng vào tổng cha.',
    'Khoảng trắng không ảnh hưởng; có thể bỏ qua hoặc xử lý trực tiếp bằng cách đọc từng ký tự.'
  ],
  solution: `### Ý tưởng
Duyệt từng ký tự. Khi gặp số, tính giá trị hoàn chỉnh (có thể nhiều chữ số). Khi gặp dấu '+', thêm số với dấu hiện tại; khi gặp '-', trừ số với dấu hiện tại; khi gặp '(', đẩy tổng hiện tại và dấu hiện tại vào stack, reset tổng và dấu; khi gặp ')', tính tổng con và cộng vào tổng cha.

~~~java
class Solution {
    public int calculate(String s) {
        Stack<Integer> stack = new Stack<>();
        int result = 0, sign = 1, number = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            // Multi-digit number: keep accumulating until a non-digit appears
            if (Character.isDigit(c)) { number = number * 10 + (c - '0'); continue; }
            // Apply the pending term, then switch sign for the next one
            if (c == '+' || c == '-') { result += sign * number; sign = (c == '+') ? 1 : -1; number = 0; continue; }
            // Save the outer sum and sign, then start a fresh inner expression
            if (c == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
            // Close inner expression: apply its sign, then add it to the saved outer sum
            if (c == ')') { result += sign * number; number = 0; result = stack.pop() * result + stack.pop(); }
        }
        return result + sign * number;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đảm bảo reset số sau mỗi dấu hoặc sau khi đóng ngoặc; nếu không, số sẽ bị nhân 10 sai.
- Dấu trừ trước ngoặc phải được áp dụng cho toàn bộ biểu thức bên trong; stack lưu đúng cả tổng và dấu.

> Senior tip: Nếu mở rộng cho dấu nhân/chia, cần thêm stack cho toán tử và xử lý ưu tiên toán tử; bài này chỉ có cộng/trừ nên đơn giản hơn nhiều.`,
  starter: 'class Solution {\n    public int calculate(String s) {\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 23, () -> s.calculate("(1+(4+5+2)-3)+(6+8)"));
        run("negative inside", -12, () -> s.calculate("-(3+(4+5))"));
        run("single", 1, () -> s.calculate("1"));
        run("with spaces", 3, () -> s.calculate(" 2-1 + 2 "));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu thêm dấu nhân và chia, bạn sẽ điều chỉnh stack thế nào?', 'Có thể giải bằng đệ quy thay vì stack không?']
},
{
  id: 'algo-083',
  title: 'Longest Valid Parentheses',
  difficulty: 'hard',
  pattern: 'Stack / Dynamic Programming',
  tags: ['string', 'stack', 'dp'],
  prompt: `Cho chuỗi chỉ gồm ký tự mở và đóng ngoặc {{'('}} và {{')'}}, tìm độ dài chuỗi con hợp lệ dài nhất (các ngoặc khớp đúng và liên tục).

### Ví dụ
~~~text
Input: s = "(()"
Output: 2
Input: s = ")()())"
Output: 4
Input: s = ""
Output: 0
~~~

### Ràng buộc
- {{0 <= s.length <= 3 * 10^4}}`,
  hints: [
    'Một chuỗi con hợp lệ phải bắt đầu bằng ( và kết thúc bằng ), và bên trong cũng phải hợp lệ.',
    'Dùng stack để lưu chỉ số các dấu mở chưa khớp; khi gặp dấu đóng, nếu có dấu mở tương ứng thì tính độ dài.',
    'Nếu stack rỗng khi gặp dấu đóng, đẩy chỉ số hiện tại vào stack làm mốc mới; độ dài hợp lệ là chỉ số hiện tại trừ đỉnh stack.'
  ],
  solution: `### Ý tưởng
Dùng stack chứa chỉ số các dấu mở chưa khớp. Khi gặp {{')'}}:
- Nếu stack không rỗng: tính độ dài từ đỉnh stack (chỉ số mở tương ứng) đến hiện tại.
- Nếu stack rỗng: đẩy chỉ số hiện tại vào stack làm mốc mới cho chuỗi hợp lệ tiếp theo.

~~~java
class Solution {
    public int longestValidParentheses(String s) {
        Stack<Integer> stack = new Stack<>();
        stack.push(-1); // base index before the first valid substring
        int maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') stack.push(i);
            else {
                stack.pop();
                if (stack.isEmpty()) stack.push(i); // unmatched closing bracket: new base
                else maxLen = Math.max(maxLen, i - stack.peek());
            }
        }
        return maxLen;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Stack ban đầu chứa -1 để xử lý trường hợp chuỗi bắt đầu bằng dấu đóng; điều này đảm bảo tính độ dài đúng từ mốc đầu tiên.
- Độ phức tạp thời gian O(n) vì mỗi ký tự chỉ được đẩy và lấy ra một lần từ stack.

> Senior tip: Biến thể thường gặp là "đếm số chuỗi con hợp lệ" hoặc "tìm chuỗi con hợp lệ có độ dài tối thiểu"; cùng một khung stack hoặc DP, chỉ cần điều chỉnh cách tính kết quả cuối.`,
  starter: 'class Solution {\n    public int longestValidParentheses(String s) {\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.longestValidParentheses("(()"));
        run("mixed", 4, () -> s.longestValidParentheses(")()())"));
        run("empty", 0, () -> s.longestValidParentheses(""));
        run("full", 6, () -> s.longestValidParentheses("()(())"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu thêm dấu ngoặc vuông và nhọn thì sửa thế nào?', 'Có thể dùng DP thay vì stack không? Độ phức tạp thế nào?']
}
,
{
  id: 'algo-084',
  title: 'Evaluate Reverse Polish Notation',
  difficulty: 'medium',
  pattern: 'Stack',
  tags: ['stack', 'string', 'bytebytego'],
  prompt: `Cho mảng chuỗi {{tokens}} biểu diễn biểu thức RPN (Reverse Polish Notation). Mỗi phần tử là toán tử (+, -, *, /) hoặc số nguyên. Trả về giá trị biểu thức.

### Ví dụ
~~~text
Input: tokens = ["2","1","+","3","*"]
Output: 9
Giải thích: ((2 + 1) * 3) = 9

Input: tokens = ["4","13","5","/","+"]
Output: 6
~~~

### Ràng buộc
- {{1 <= tokens.length <= 10^4}}
- Mỗi toán tử áp dụng cho hai toán hạng trước đó; chia lấy phần nguyên và luôn hướng về 0.
- Không có phép chia cho 0.`,
  hints: [
    'Dùng stack: khi gặp số thì đẩy vào; khi gặp toán tử thì lấy hai phần tử trên đỉnh.',
    'Cẩn thận thứ tự: toán tử lấy phần tử thứ hai trước (pop), rồi phần tử thứ nhất (pop), tính rồi đẩy kết quả.',
    'Chia nguyên: dùng Math.trunc hoặc ép kiểu int sau khi chia double; luôn hướng về 0.'
  ],
  solution: `### Ý tưởng
Duyệt từng token từ trái sang phải. Nếu là số, đẩy vào stack. Nếu là toán tử, pop hai toán hạng, tính theo thứ tự đúng, đẩy kết quả lại. Cuối cùng stack còn đúng một phần tử — đó là đáp án.

~~~java
class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            if (t.equals("+")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a + b);
            } else if (t.equals("-")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a - b);
            } else if (t.equals("*")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a * b);
            } else if (t.equals("/")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a / b);
            } else {
                stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phép chia trong Java cho số âm: -3 / 2 = -1 (trunc toward zero), đúng yêu cầu đề chuẩn.
- Nếu có nhiều toán tử cùng loại, nên dùng switch hoặc map; tránh nhiều if-else rối.
- Đề đảm bảo biểu thức hợp lệ nên không cần kiểm tra stack rỗng khi pop.

> Senior tip: RPN thường dùng trong trình biên dịch hoặc biểu thức cấu hình; khi gặp dấu âm cho toán hạng, cần phân biệt số âm và toán tử trừ bằng cách kiểm tra độ dài token hoặc dùng prefix.`,
  starter: `class Solution {
    public int evalRPN(String[] tokens) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", 9, () -> new Solution().evalRPN(new String[]{"2","1","+","3","*"}));
        run("division", 6, () -> new Solution().evalRPN(new String[]{"4","13","5","/","+"}));
        run("negative", -6, () -> new Solution().evalRPN(new String[]{"-2","3","*"}));
        run("complex", 22, () -> new Solution().evalRPN(new String[]{"10","6","9","3","+","-11","*","/","*","17","+","5","+"}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Nếu có phép chia cho 0 thì xử lý thế nào?', 'Nếu biểu thức không hợp lệ thì phát hiện ra sao?']
},

{
  id: 'algo-085',
  title: 'Next Greater Element',
  difficulty: 'medium',
  pattern: 'Stacks',
  tags: ['stack', 'monotonic', 'circular', 'bytebytego'],
  prompt: `Cho mảng số nguyên {{nums}} có thể có phần tử trùng. Mảng được coi là **vòng tròn** (phần tử sau phần tử cuối quay về phần tử đầu). Với mỗi vị trí {{i}}, trả về {{nextGreater[i]}} là giá trị **đầu tiên** gặp được khi đi sang phải (theo chiều vòng) mà lớn hơn {{nums[i]}}; nếu không có thì {{-1}}.

### Ví dụ
~~~text
Input: nums = [1,2,1]
Output: [2,-1,2]
Giải thích: 1 thấy 2 ngay bên phải; 2 không thấy gì lớn hơn; 1 (cuối vòng) thấy 2 ở đầu.

Input: nums = [5,4,3,2,1]
Output: [-1,5,5,5,5]

Input: nums = [2,2,2]
Output: [-1,-1,-1]
~~~

### Ràng buộc
- {{0 <= n <= 10^5}}, {{-10^9 <= nums[i] <= 10^9}}
- Yêu cầu O(n): duyệt vòng hai lần {{2n}} nhưng vẫn O(n).`,
  hints: [
    'Bài kinh điển dùng monotonic stack (stack đơn điệu): duyệt mảng và giữ stack các phần tử chưa tìm được NGE.',
    'Với mảng vòng, duyệt {{i}} từ {{0}} đến {{2n-1}}, chỉ gán kết quả cho vị trí {{i % n}} chưa có.',
    'Trong vòng lặp, trong khi stack không rỗng và {{nums[stack.peek()] < nums[i]}} thì pop và gán {{res[popped] = nums[i]}}; rồi đẩy {{i % n}} vào stack.',
    'Chỉ đẩy {{i % n}} (không đẩy {{i}}) để mỗi phần tử vào stack đúng một lần → tổng O(n).'
  ],
  solution: `### Ý tưởng
Monotonic stack giảm dần: các index trong stack luôn có giá trị giảm dần. Khi gặp {{nums[i]}} lớn hơn đỉnh stack, {{nums[i]}} chính là NGE của mọi phần tử bị pop ra, vì ta đi từ trái sang phải và đây là phần tử lớn hơn **đầu tiên**.

Với mảng vòng, duyệt {{2n}} lần; mỗi index {{i}} xử lý như mảng thường nhưng chỉ đẩy {{i % n}} và chỉ gán kết quả nếu {{res[i % n]}} chưa được điền. Kết thúc {{2n}} bước, mọi vị trí có NGE đều đã điền, vị trí còn lại là {{-1}}.

~~~java
class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        Arrays.fill(res, -1);
        Deque<Integer> stack = new ArrayDeque<>(); // index, monotonic giảm dần
        for (int i = 0; i < 2 * n; i++) {
            int x = nums[i % n];
            // x lớn hơn đỉnh → x là NGE của mọi phần tử bị pop
            while (!stack.isEmpty() && nums[stack.peek()] < x) {
                res[stack.pop()] = x;
            }
            stack.push(i % n); // mỗi index chỉ push một lần
        }
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đảm bảo chỉ push {{i % n}}: nếu push {{i}} (lên đến {{2n-1}}) thì index bị xử lý hai lần, kết quả sai với phần tử trùng giá trị.
- Nếu đề không vòng thì bỏ {{% n}} và chạy một lần {{n}}; complexity giữ O(n).
- Phần tử trùng: điều kiện strict {{<}} (không dùng {{<=}}) — bằng giá trị thì không "thay thế", giữ nguyên, đúng đề bài "lớn hơn".

> Senior tip: Monotonic stack là pattern xuất hiện rất nhiều — Next Greater, Daily Temperatures, Largest Rectangle, Stock Span. Tôi luôn hỏi ứng viên "tại sao tổng số lần pop không quá n?" để kiểm tra hiểu amortized O(n): mỗi phần tử push một lần và pop tối đa một lần.`,
  starter: `class Solution {
    public int[] nextGreaterElements(int[] nums) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + java.util.Arrays.toString((int[]) expected) + " got " + java.util.Arrays.toString((int[]) actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example1", new int[]{2,-1,2}, () -> new Solution().nextGreaterElements(new int[]{1,2,1}));
        run("decreasing", new int[]{-1,5,5,5,5}, () -> new Solution().nextGreaterElements(new int[]{5,4,3,2,1}));
        run("duplicates", new int[]{-1,-1,-1}, () -> new Solution().nextGreaterElements(new int[]{2,2,2}));
        run("increasing", new int[]{2,3,4,-1}, () -> new Solution().nextGreaterElements(new int[]{1,2,3,4}));
        run("single", new int[]{-1}, () -> new Solution().nextGreaterElements(new int[]{1}));
        run("empty", new int[]{}, () -> new Solution().nextGreaterElements(new int[]{}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: [
    'Nếu cho phép không vòng thì code thay đổi thế nào?',
    'Daily Temperatures có liên hệ gì với bài này?'
  ]
},

{
  id: 'algo-086',
  title: 'Asteroid Collision',
  difficulty: 'medium',
  pattern: 'Stacks',
  tags: ['stack', 'simulation', 'bytebytego'],
  prompt: `Trên trục số có các tiểu hành tinh, mỗi tiểu hành tinh có kích thước (giá trị tuyệt đối) và hướng: dương là sang phải, âm là sang trái. Hai tiểu hành tinh **đối đầu** thì nổ: nếu kích thước bằng nhau thì cả hai biến mất; nếu khác thì cái nhỏ hơn biến mất. Trả về trạng thái còn lại sau khi mọi va chạm kết thúc (theo thứ tự trên trục).

### Ví dụ
~~~text
Input: asteroids = [5,10,-5]
Output: [5,10]
Giải thích: 10 và -5 đụng nhau, 10 lớn hơn nên -5 nổ.

Input: asteroids = [8,-8]
Output: []

Input: asteroids = [10,2,-5]
Output: [10]

Input: asteroids = [-2,-1,1,2]
Output: [-2,-1,1,2]
Giải thích: -2,-1 sang trái, 1,2 sang phải; không có cặp nào đối đầu.
~~~

### Ràng buộc
- {{1 <= n <= 10^4}}, {{-1000 <= asteroids[i] <= 1000}}, {{asteroids[i] != 0}}`,
  hints: [
    'Duyệt từ trái sang phải, đẩy các tiểu hành tinh đi **sang phải** (dương) vào stack — chúng chưa va chạm gì vì chưa có cái nào đi ngược về.',
    'Gặp tiểu hành tinh {{a < 0}} (sang trái): so sánh với đỉnh stack. Nếu đỉnh dương nhỏ hơn {{|a|}} thì đỉnh nổ (pop) và tiếp tục so; nếu bằng thì cả hai nổ; nếu đỉnh lớn hơn thì {{a}} nổ ngay.',
    'Tiểu hành tinh đi trái mà stack rỗng (hoặc đỉnh cũng đi trái) thì sống sót — đẩy vào kết quả.',
    'Sau khi xử lý xong, kết quả là các phần tử còn trong stack theo thứ tự đáy → đỉnh, cần đảo lại.'
  ],
  solution: `### Ý tưởng
Stack lưu các tiểu hành tinh đang "sống sót" theo thứ tự từ trái sang phải, tất cả đều đi **cùng hướng sang phải** khi ta xử lý một tiểu hành tinh mới đi trái. Vì không có va chạm nào giữa hai cái cùng chiều, chỉ cần lo çarp trán trái–phải.

~~~java
class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> st = new ArrayDeque<>(); // các asteroid đang sống, chỉ chứa asteroid dương
        for (int a : asteroids) {
            boolean alive = true;
            // a đi trái: đụng đỉnh stack (dương, đi phải)?
            while (alive && a < 0 && !st.isEmpty() && st.peek() > 0) {
                int top = st.peek();
                if (top < -a) st.pop();      // đỉnh nhỏ hơn → đỉnh nổ, a tiếp tục
                else if (top == -a) { st.pop(); alive = false; } // bằng nhau → cả hai nổ
                else alive = false;          // đỉnh lớn hơn → a nổ
            }
            if (alive) st.push(a);
        }
        int[] res = new int[st.size()];
        for (int i = res.length - 1; i >= 0; i--) res[i] = st.pop(); // đảo ngược
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Case [-2,-1,1,2]: stack chỉ có phần tử dương mới va chạm được; asteroid âm đầu tiên khi stack rỗng sống sót, các asteroid âm sau đó không đụng ai.
- Nếu đỉnh dương bằng |a| thì **cả hai** nổ — đừng đẩy lại {{a}}.
- Đừng viết đệ quy; while pop trong stack là đủ, mỗi phần tử push/pop tối đa một lần → O(n).

> Senior tip: Đây là bài kiểm tra simulation + stack điển hình. Ở phỏng vấn tôi hay thêm biến thể "nếu asteroid có thể cùng giá trị 0" hoặc "trả về số va chạm" để kiểm tra phần tách điều kiện; xử lý rõ ràng từng nhánh sẽ được điểm cao hơn code ngắn nhưng khó đọc.`,
  starter: `class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + java.util.Arrays.toString((int[]) expected) + " got " + java.util.Arrays.toString((int[]) actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example1", new int[]{5,10}, () -> new Solution().asteroidCollision(new int[]{5,10,-5}));
        run("annihilate", new int[]{}, () -> new Solution().asteroidCollision(new int[]{8,-8}));
        run("smaller dies", new int[]{10}, () -> new Solution().asteroidCollision(new int[]{10,2,-5}));
        run("same direction", new int[]{-2,-1,1,2}, () -> new Solution().asteroidCollision(new int[]{-2,-1,1,2}));
        run("equal dies both", new int[]{}, () -> new Solution().asteroidCollision(new int[]{5,-5}));
        run("left survives stack empty", new int[]{-5,10}, () -> new Solution().asteroidCollision(new int[]{-5,10}));
        run("chain", new int[]{10,12}, () -> new Solution().asteroidCollision(new int[]{10,-5,12,-3}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: [
    'Nếu đề yêu cầu đếm tổng số va chạm thì sửa thế nào?',
    'Tại sao stack chỉ cần lưu asteroid dương?'
  ]
},

{
  id: 'algo-087',
  title: 'Connect Ropes to Minimize Cost',
  difficulty: 'medium',
  pattern: 'Heaps',
  tags: ['heap', 'greedy', 'priority-queue', 'bytebytego'],
  prompt: `Bạn có {{n}} sợi dây, mỗi sợi có chiều dài {{ropes[i]}}. Mỗi bước, chọn hai sợi, ghép lại thành một sợi (chiều dài bằng tổng hai sợi) và tiêu tốn **chiều dài của sợi ghép được**. Tiếp tục đến khi còn đúng một sợi dây. Tìm tổng chi phí **nhỏ nhất**.

### Ví dụ
~~~text
Input: ropes = [1,2,3,4,5]
Output: 33
Giải thích: (1+2)=3 [chi phí 3] → [3,3,4,5]; (3+3)=6 [6] → [4,5,6]; (4+5)=9 [9] → [6,9]; (6+9)=15 [15]. Tổng: 3+6+9+15 = 33.

Input: ropes = [4,3,2,6]
Output: 29

Input: ropes = [5]
Output: 0
~~~

### Ràng buộc
- {{1 <= n <= 10^4}}, {{1 <= ropes[i] <= 10^4}}
- Luôn ghép hai sợi **ngắn nhất** tại mỗi bước.`,
  hints: [
    'Chi phí là tổng các "sợi ghép trung gian"; mỗi chiều dài gốc được cộng vào chi phí đúng bằng số lần nó được ghép.',
    'Cách tối ưu: luôn lấy hai sợi ngắn nhất — dùng min-heap (PriorityQueue) để lấy và đẩy lại tổng.',
    'Lặp đến khi heap còn 0 hoặc 1 phần tử; nếu n = 1 thì chi phí 0.',
    'Độ phức tạp O(n log n): mỗi bước pop/push log n, tổng n-1 bước.'
  ],
  solution: `### Ý tưởng
Greedy chứng minh được: ghép hai sợi ngắn nhất luôn tối ưu (giống Huffman coding). Dùng min-heap lưu các sợi đang có; mỗi bước pop hai phần tử nhỏ nhất, cộng chi phí += a + b, push lại {{a + b}}.

Với [1,2,3,4,5]: pop 1,2 → chi phí 3, push 3 → heap [3,3,4,5]; pop 3,3 → chi phí 6, push 6 → [4,5,6]; ... Tổng 33.

~~~java
class Solution {
    public int connectRopes(int[] ropes) {
        PriorityQueue<Integer> pq = new PriorityQueue<>(); // min-heap
        for (int r : ropes) pq.offer(r);
        int cost = 0;
        while (pq.size() > 1) {
            int a = pq.poll();
            int b = pq.poll();
            cost += a + b;   // chi phí bước này
            pq.offer(a + b); // sợi ghép quay lại heap
        }
        return cost;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{n == 1}}: while không chạy, trả 0 — đúng yêu cầu (không cần ghép gì).
- Nếu đề cho {{long}} (tổng có thể tràn int) thì khai báo {{long cost}} và PriorityQueue{{<Long>}}; với ràng buộc ở trên int là đủ.
- Đừng thử quy hoạch động O(n^2); greedy + heap đã là lời giải chuẩn O(n log n).

> Senior tip: Bài này cùng họ với Huffman coding và "chi phí nhỏ nhất của việc nối chuỗi". Ứng viên khá hay đề xuất "sắp xếp rồi ghép từ đầu" — cách đó chỉ đúng trong một số trường hợp; min-heap mới xử lý tổng quát khi tổng các sợi mới chen vào giữa dãy đã sắp.`,
  starter: `class Solution {
    public int connectRopes(int[] ropes) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example1", 33, () -> new Solution().connectRopes(new int[]{1,2,3,4,5}));
        run("example2", 29, () -> new Solution().connectRopes(new int[]{4,3,2,6}));
        run("single", 0, () -> new Solution().connectRopes(new int[]{5}));
        run("two", 7, () -> new Solution().connectRopes(new int[]{2,5}));
        run("equal", 16, () -> new Solution().connectRopes(new int[]{2,2,2,2}));
        run("descending", 200, () -> new Solution().connectRopes(new int[]{50,30,20,10}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n log n), Space O(n)',
  follow: [
    'Liên hệ với Huffman coding ở điểm nào?',
    'Nếu chi phí mỗi bước bằng tích hai sợi thì lời giải còn đúng không?'
  ]
},

{
  id: 'algo-088',
  title: 'Median of a Number Stream',
  difficulty: 'medium',
  pattern: 'Heaps',
  tags: ['heap', 'two-heaps', 'design', 'stream', 'bytebytego'],
  prompt: `Thiết kế cấu trúc dữ liệu cho luồng số vào ({{addNum}}), hỗ trợ trả về **trung vị** của toàn bộ số đã thêm ({{findMedian}}) trong O(log n) mỗi thao tác.

- Nếu số phần tử lẻ: trung vị là phần tử giữa (sắp xếp tăng dần).
- Nếu chẵn: trung vị là trung bình của hai phần tử giữa.

### Ví dụ
~~~text
addNum(1); addNum(2); findMedian() → 1.5
addNum(3);                 findMedian() → 2.0
~~~

### Ràng buộc
- {{1 <= tổng số lần addNum <= 10^5}}
- Số nguyên có thể âm, có thể trùng.
- findMedian luôn được gọi khi đã có ít nhất một số.`,
  hints: [
    'Giữ hai nửa: nửa dưới (các số nhỏ) và nửa trên (các số lớn). Trung vị chỉ phụ thuộc hai phần tử giữa của hai nửa.',
    'Dùng max-heap cho nửa dưới và min-heap cho nửa trên: PriorityQueue{{<Integer>}} mặc định là min-heap; max-heap đảo comparator.',
    'Giữ bất biến: size(maxHeap) == size(minHeap) hoặc nhiều hơn đúng 1; mọi phần tử trong maxHeap ≤ mọi phần tử trong minHeap.',
    'addNum: đẩy vào maxHeap, rồi "cân bằng" bằng cách chuyển đỉnh sang minHeap (và chiều ngược lại nếu lệch); findMedian là O(1).'
  ],
  solution: `### Ý tưởng
Hai heap: {{lower}} (max-heap) chứa nửa nhỏ, {{upper}} (min-heap) chứa nửa lớn, kích thước chênh lệch tối đa 1.

- {{addNum(x)}}: nếu {{x}} ≤ đỉnh {{lower}} thì đẩy vào {{lower}}, đẩy ngược {{upper}} để cân bằng. Cách đơn giản hơn: đẩy x vào lower rồi chuyển đỉnh lower sang upper, nếu lệch size thì chuyển đỉnh upper về lower.
- {{findMedian}}: size lệch → đỉnh {{lower}}; bằng nhau → trung bình hai đỉnh.

~~~java
class MedianFinder {
    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
    private final PriorityQueue<Integer> upper = new PriorityQueue<>(); // min-heap

    public void addNum(int num) {
        lower.offer(num);                 // luôn đẩy vào nửa nhỏ trước
        upper.offer(lower.poll());        // đỉnh lớn nhất nửa nhỏ → nửa lớn (giữ bất biến)
        if (lower.size() < upper.size())  // cân bằng size
            lower.offer(upper.poll());
    }

    public double findMedian() {
        if (lower.size() > upper.size()) return lower.peek();
        return lower.peek() / 2.0 + upper.peek() / 2.0; // tránh tràn int
    }
}
~~~

### Lưu ý khi phỏng vấn
- Bất biến quan trọng: {{upper.peek() >= lower.peek()}} luôn đúng nhờ bước chuyển đỉnh; nếu bỏ qua bước này thì hai nửa có thể xen kẽ sai.
- Trả về double: chia {{2.0}} trước khi nhân/trung bình để không mất phần lẻ.
- Variants phỏng vấn: cho phép xoá phần tử, tìm "kth largest" (chỉ cần lệch size đúng k), hoặc giới hạn bộ nhớ cho sliding median.

> Senior tip: Two-heap là pattern mặc định cho trung vị trực tuyến; trong production tôi thấy nó xuất hiện ở monitoring (percentile latency theo cửa sổ trượt) thay vì sort lại toàn bộ mỗi lần. Nếu cần sliding window thì kết hợp thêm HashMap để lazy-remove khỏi heap.`,
  starter: `class MedianFinder {
    public MedianFinder() {
        
    }
    public void addNum(int num) {
        
    }
    public double findMedian() {
        return 0.0;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Objects.equals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("classic", 2.0, () -> {
            MedianFinder mf = new MedianFinder();
            mf.addNum(1); mf.addNum(2);
            if (mf.findMedian() != 1.5) throw new AssertionError("after 1,2 expected 1.5");
            mf.addNum(3);
            return mf.findMedian();
        });
        run("single", 10.0, () -> {
            MedianFinder mf = new MedianFinder();
            mf.addNum(10);
            return mf.findMedian();
        });
        run("negatives", -2.0, () -> {
            MedianFinder mf = new MedianFinder();
            mf.addNum(-1); mf.addNum(-2); mf.addNum(-3);
            return mf.findMedian();
        });
        run("duplicates", 5.0, () -> {
            MedianFinder mf = new MedianFinder();
            mf.addNum(5); mf.addNum(5); mf.addNum(5); mf.addNum(5);
            return mf.findMedian();
        });
        run("interleaved", 0.0, () -> {
            MedianFinder mf = new MedianFinder();
            mf.addNum(0); mf.addNum(2); mf.addNum(-1);
            return mf.findMedian();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'addNum O(log n), findMedian O(1), Space O(n)',
  follow: [
    'Nếu cần findMedian của cửa sổ trượt thì làm thế nào?',
    'Làm sao chứng minh mọi x trong lower ≤ mọi y trong upper?'
  ]
},

{
  id: 'algo-089',
  title: 'Insert Interval',
  difficulty: 'medium',
  pattern: 'Merge Intervals',
  tags: ['intervals', 'array', 'bytebytego'],
  prompt: `Cho mảng {{intervals}} gồm các khoảng {{[start, end]}} đã sắp xếp theo {{start}}, **không giao nhau**, và một khoảng mới {{newInterval}}. Chèn {{newInterval}} vào và hợp nhất các khoảng nếu cần, trả về mảng kết quả đã sắp xếp.

### Ví dụ
~~~text
Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]

Input: intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output: [[1,2],[3,10],[12,16]]

Input: intervals = [], newInterval = [5,7]
Output: [[5,7]]
~~~

### Ràng buộc
- {{0 <= n <= 10^4}}, {{n * start/end <= 10^6}} (giá trị tọa độ là số nguyên)}
- intervals đã sắp xếp và pairwise disjoint.`,
  hints: [
    'Phân đoạn: các khoảng hoàn toàn nằm **trước** {{newInterval}} (end < new.start) giữ nguyên; các khoảng nằm **sau** (start > new.end) giữ nguyên; phần còn lại chồng lên → hợp nhất vào newInterval.',
    'Vòng 1: duyệt từ đầu, thêm mọi khoảng với {{end < newInterval[0]}} vào kết quả.',
    'Vòng 2: hợp nhất mọi khoảng còn chồng lấn: {{newInterval = [min(start), max(end)]}} cho đến khi hết chồng.',
    'Vòng 3: thêm {{newInterval}} rồi nối tiếp các khoảng còn lại — tổng vẫn O(n), không cần sort lại.'
  ],
  solution: `### Ý tưởng
Vì mảng đã sắp xếp, ta đi một lần: copy các khoảng hoàn toàn bên trái, gộp các khoảng chồng lấn với khoảng mới, rồi copy phần bên phải. Không cần merge toàn bộ mảng — chỉ các khoảng "bị đụng" mới tham gia hợp nhất.

~~~java
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> res = new ArrayList<>();
        int i = 0, n = intervals.length;
        // 1) các khoảng hoàn toàn trước newInterval
        while (i < n && intervals[i][1] < newInterval[0]) {
            res.add(intervals[i++]);
        }
        // 2) hợp nhất mọi khoảng chồng lấn
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        res.add(newInterval);
        // 3) các khoảng hoàn toàn sau
        while (i < n) res.add(intervals[i++]);
        return res.toArray(new int[0][]);
    }
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện biên: {{end == newStart}} (chạm đúng mép, ví dụ [1,2] và [3,5] với new [2,3]]) — đề coi "chạm mép" là chồng lấn ({{<=}}) thì [1,2],[2,3] gộp thành [1,3]. Hỏi người phỏng vấn rõ ràng.
- newInterval bị **sửa tại chỗ** — nếu không được phép sửa input thì clone trước.
- Không viết hàm merge chung; chỉ merge phần cần, code ngắn hơn và dễ chứng minh O(n).

> Senior tip: Khi phỏng vấn, tôi luôn xem ứng viên có hỏi "touching intervals (2,3) và (3,4) có gộp không?" không — trong calendar systems, hai cuộc họp [10:00-11:00] và [11:00-12:00] thường **không** coi là conflict, nhưng interval tree chuẩn của LeetCode lại gộp. Làm rõ spec trước khi code là dấu hiệu senior thật sự.`,
  starter: `class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Arrays.deepEquals((Object[]) expected, (Object[]) actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + java.util.Arrays.deepToString((int[][]) expected) + " got " + java.util.Arrays.deepToString((int[][]) actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("overlap front", new int[][]{{1,5},{6,9}},
            () -> new Solution().insert(new int[][]{{1,3},{6,9}}, new int[]{2,5}));
        run("merge middle", new int[][]{{1,2},{3,10},{12,16}},
            () -> new Solution().insert(new int[][]{{1,2},{3,5},{6,7},{8,10},{12,16}}, new int[]{4,8}));
        run("empty", new int[][]{{5,7}},
            () -> new Solution().insert(new int[0][], new int[]{5,7}));
        run("contained no expand", new int[][]{{1,5}},
            () -> new Solution().insert(new int[][]{{1,5}}, new int[]{2,3}));
        run("absorb all", new int[][]{{1,7}},
            () -> new Solution().insert(new int[][]{{1,5}}, new int[]{2,7}));
        run("append end", new int[][]{{1,2},{8,9}},
            () -> new Solution().insert(new int[][]{{1,2}}, new int[]{8,9}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1) ngoài kết quả',
  follow: [
    'Nếu intervals chưa sắp xếp thì lời giải nào tốt nhất?',
    'Phạm vi tọa độ lớn (10^9) và số khoảng nhiều thì dùng gì?'
  ]
},

{
  id: 'algo-090',
  title: 'Intervals Intersection',
  difficulty: 'medium',
  pattern: 'Merge Intervals',
  tags: ['intervals', 'two-pointers', 'bytebytego'],
  prompt: `Cho hai danh sách khoảng {{firstList}} và {{secondList}}, mỗi danh sách đã sắp xếp theo {{start}} và các khoảng bên trong **không giao nhau**. Trả về danh sách các khoảng giao của hai tập (mỗi phần tử là giao của một khoảng từ list này với một khoảng từ list kia), cũng đã sắp xếp và không giao nhau.

### Ví dụ
~~~text
Input: firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]
Output: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]

Input: firstList = [[1,3],[5,9]], secondList = []
Output: []

Input: firstList = [], secondList = [[4,8],[10,12]]
Output: []
~~~

### Ràng buộc
- {{0 <= m, n <= 10^4}}
- Mỗi list đã sort và disjoint nội bộ.`,
  hints: [
    'Giao của hai khoảng [[a,b]], [[c,d]] là [[max(a,c), min(b,d)]]; nếu max(start) > min(end) thì không giao.',
    'Two pointers {{i}}, {{j}} trên hai list: tại mỗi bước so sánh end của interval hiện tại, con trỏ nào end nhỏ hơn thì tăng (vì interval đó đã "kết thúc", không thể giao với interval sau của list kia nữa).',
    'Ghi nhận giao (nếu có) rồi {{i++}} nếu {{first[i][1] < second[j][1]}}, ngược lại {{j++}}.',
    'Giao chỉ gồm đúng hai khoảng (mỗi bên một), vì bên trong mỗi list đã disjoint.'
  ],
  solution: `### Ý tưởng
Hai con trỏ. Với cặp hiện tại {{(a, b)}}, giao là {{[max(a0,b0), min(a1,b1)]}} nếu {{max(a0,b0) <= min(a1,b1)}}. Sau đó di chuyển con trỏ của khoảng có end **nhỏ hơn**, vì khoảng đó đã kết thúc sớm hơn và không giao được với khoảng sau của list kia.

~~~java
class Solution {
    public int[][] intervalIntersection(int[][] first, int[][] second) {
        List<int[]> res = new ArrayList<>();
        int i = 0, j = 0;
        while (i < first.length && j < second.length) {
            int lo = Math.max(first[i][0], second[j][0]);
            int hi = Math.min(first[i][1], second[j][1]);
            if (lo <= hi) res.add(new int[]{lo, hi}); // có giao (touching tính là giao)
            // đẩy con trỏ của khoảng kết thúc trước
            if (first[i][1] < second[j][1]) i++;
            else j++;
        }
        return res.toArray(new int[0][]);
    }
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện {{lo <= hi}}: "touching" ([[1,2]] ∩ [[2,3]] = [[2,2]]) có được tính không? Đề chuẩn LeetCode tính; hỏi lại nếu spec khác.
- Không cần sort lại; bất biến của đề đã đảm bảo hai list sorted.
- Variant: thay {{max/min}} bằng kiểm tra không giao ({{first[i][1] < second[j][0]}}) rồi đẩy con trỏ end nhỏ hơn — logic tương đương nhưng dễ nhầm khi viết vội.

> Senior tip: Pattern hai con trỏ trên hai dãy sorted xuất hiện ở merged ranges của calendar, billing windows, capacity planning. Tôi thường hỏi thêm "nếu mỗi list có khoảng trùng lặp nội bộ thì sao?" — khi đó phải pre-merge từng list (O(m log m + n log n)) rồi chạy hai con trỏ, cho thấy bạn hiểu bất biến nào của thuật toán đang được dùng.`,
  starter: `class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (java.util.Arrays.deepEquals((Object[]) expected, (Object[]) actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + java.util.Arrays.deepToString((int[][]) expected) + " got " + java.util.Arrays.deepToString((int[][]) actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", new int[][]{{1,2},{5,5},{8,10},{15,23},{24,24},{25,25}},
            () -> new Solution().intervalIntersection(
                new int[][]{{0,2},{5,10},{13,23},{24,25}},
                new int[][]{{1,5},{8,12},{15,24},{25,26}}));
        run("empty second", new int[][]{},
            () -> new Solution().intervalIntersection(new int[][]{{1,3},{5,9}}, new int[0][]));
        run("empty first", new int[][]{},
            () -> new Solution().intervalIntersection(new int[0][], new int[][]{{4,8},{10,12}}));
        run("touching", new int[][]{{2,2}},
            () -> new Solution().intervalIntersection(new int[][]{{1,2}}, new int[][]{{2,3}}));
        run("disjoint", new int[][]{},
            () -> new Solution().intervalIntersection(new int[][]{{1,2}}, new int[][]{{3,4}}));
        run("one contains", new int[][]{{5,7}},
            () -> new Solution().intervalIntersection(new int[][]{{1,10}}, new int[][]{{5,7}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(m + n), Space O(1) ngoài kết quả',
  follow: [
    'Tại sao chỉ cần đẩy một trong hai con trỏ?',
    'Nếu trả về danh sách thời gian **rảnh** (free time) thì làm tiếp thế nào?'
  ]
},

{
  id: 'algo-091',
  title: 'Employee Free Time',
  difficulty: 'hard',
  pattern: 'Merge Intervals',
  tags: ['intervals', 'heap', 'min-heap', 'bytebytego'],
  prompt: `Cho lịch làm việc của {{k}} nhân viên: {{schedule[e]}} là danh sách các khoảng {{[start, end]}} mà nhân viên {{e}} **bận**, đã sắp xếp theo start và không giao nhau. Trả về danh sách các khoảng **rảnh chung cho tất cả** mọi nhân viên, đã sắp xếp và không giao nhau. Mảng kết quả **không rỗng** theo yêu cầu đề (mọi cặp lịch đều để lại ít nhất một khoảng rảnh) — nếu không có khoảng rảnh nào thì trả mảng rỗng.

### Ví dụ
~~~text
Input: schedule = [[[1,3],[6,7]], [[2,4]], [[2,5],[9,12]]]
Output: [[5,6],[7,9]]
Giải thích: Tổng bận gộp lại: [1,5],[6,7],[9,12] → còn rảnh [5,6] và [7,9].

Input: schedule = [[[1,3],[5,10]], [[2,4]]]
Output: [[4,5]]

Input: schedule = [[[1,2]], [[1,2]]]
Output: []
~~~

### Ràng buộc
- {{1 <= k <= 10^4}}, {{1 <= lịch mỗi nhân viên <= 10^3}}
- Giá trị start/end là số nguyên.`,
  hints: [
    'Không cần xử lý từng cặp nhân viên — hợp nhất **toàn bộ** các khoảng bận của mọi nhân viên thành một danh sách disjoint, rồi "free time" chính là các lỗ giữa các khoảng liên tiếp.',
    'Cách 1: gộp tất cả khoảng vào một mảng, sort theo start rồi merge — O(N log N) với N tổng số khoảng.',
    'Cách 2 (tốt hơn khi k lớn): min-heap theo start, trộn dần từng khoảng một — vẫn O(N log N) nhưng tránh sort nóng toàn bộ; hữu ích nếu lịch tới dần (streaming).',
    'Sau khi có merged busy intervals, free time là các lỗ giữa hai khoảng liên tiếp: từ end của khoảng trước đến start của khoảng sau (chỉ khi end trước nhỏ hơn start sau).'
  ],
  solution: `### Ý tưởng
**Bước 1 — merge busy intervals**: gộp mọi khoảng bận của mọi nhân viên rồi sort theo start, merge như bài Merge Intervals kinh điển. **Bước 2 — free time**: khoảng rảnh chỉ tồn tại giữa hai khoảng busy liền kề: từ {{end}} của khoảng trước đến {{start}} của khoảng sau (nếu chặt nhau thì không có lỗ).

Với [[[1,3],[6,7]], [[2,4]], [[2,5],[9,12]]]: gộp → sort → merge → [[1,5],[6,7],[9,12]]. Lỗ: [5,6] và [7,9].

~~~java
class Solution {
    public List<int[]> employeeFreeTime(int[][][] schedule) {
        // 1) gộp toàn bộ interval bận
        List<int[]> all = new ArrayList<>();
        for (int[][] emp : schedule)
            for (int[] iv : emp) all.add(iv);
        all.sort(Comparator.comparingInt(a -> a[0]));

        // 2) merge busy
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : all) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < iv[0])
                merged.add(iv); // không chồng → thêm mới
            else
                merged.get(merged.size() - 1)[1] =
                    Math.max(merged.get(merged.size() - 1)[1], iv[1]); // chồng → kéo dài
        }

        // 3) free = các lỗ giữa các busy liên tiếp
        List<int[]> free = new ArrayList<>();
        for (int i = 0; i < merged.size() - 1; i++)
            if (merged.get(i)[1] < merged.get(i + 1)[0])
                free.add(new int[]{merged.get(i)[1], merged.get(i + 1)[0]});
        return free;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Variant streaming: thay sort+merge bằng min-heap (PriorityQueue theo start): poll từng interval, merge vào "busy hiện tại"; free ghi nhận giữa busy hiện tại và interval kế tiếp trong heap — O(N log k) với k là số nhân viên đang mở.
- Chạm mép {{b == nextStart}}: không có khoảng rảnh (rỗng, không có độ dài dương).
- Nếu lịch của mỗi nhân viên có thể chưa sort/pre-merged thì phải merge riêng từng người trước — merge chung vẫn đúng vì sort toàn cục xử lý được.

> Senior tip: Đừng tối ưu sớm bằng heap trong buổi phỏng vấn trừ khi interviewer yêu cầu; sort toàn bộ O(N log N) với N tổng số lịch là đủ và code ngắn, ít lỗi. Nhưng nếu N ~ 10^7 và lịch tới stream thì heaps theo employee là lời giải thật sự cần thiết — chứng tỏ bạn biết khi nào cần.`,
  starter: `class Solution {
    public List<int[]> employeeFreeTime(int[][][] schedule) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            List<?> freeList = (List<?>) actual;
            int[][] actArr = new int[freeList.size()][];
            for (int i = 0; i < freeList.size(); i++) actArr[i] = (int[]) freeList.get(i);
            if (java.util.Arrays.deepEquals((Object[]) expected, (Object[]) actArr)) {
                passed++; System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + java.util.Arrays.deepToString((int[][]) expected) + " got " + java.util.Arrays.deepToString((int[][]) actArr));
            }
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example1", new int[][]{{5,6},{7,9}},
            () -> new Solution().employeeFreeTime(new int[][][]{{{1,3},{6,7}},{{2,4}},{{2,5},{9,12}}}));
        run("example2", new int[][]{{4,5}},
            () -> new Solution().employeeFreeTime(new int[][][]{{{1,3},{5,10}},{{2,4}}}));
        run("no free", new int[][]{},
            () -> new Solution().employeeFreeTime(new int[][][]{{{1,2}},{{1,2}}}));
        run("fully covered", new int[][]{},
            () -> new Solution().employeeFreeTime(new int[][][]{{{1,5}},{{2,3}}}));
        run("adjacent no gap", new int[][]{},
            () -> new Solution().employeeFreeTime(new int[][][]{{{1,2}},{{2,3}}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(N log N), Space O(N) — N tổng số khoảng của mọi nhân viên',
  follow: [
    'Làm sao giảm còn O(N log k) với k nhân viên?',
    'Nếu mỗi nhân viên có thể có lịch trùng lặp nội bộ thì xử lý thế nào?'
  ]
},

{
  id: 'algo-092',
  title: 'Kth Largest Number in a Stream',
  difficulty: 'easy',
  pattern: 'Top K Elements',
  tags: ['heap', 'design', 'stream', 'bytebytego'],
  prompt: `Cho một **stream** số nguyên và một số {{k}}. Implement lớp {{KthLargest}} với {{KthLargest(int k, int[] nums)}} — {{nums}} là các phần tử đã thấy trước đó (có thể rỗng) — và phương thức {{add(int val)}}: thêm {{val}} vào stream rồi trả về phần tử **lớn thứ {{k}}** của toàn bộ stream, tính cả {{val}} vừa thêm.

### Ví dụ
~~~text
Input: k = 3, nums = [4, 5, 8, 2]
add(3) → 4
add(5) → 5
add(10) → 5
add(9) → 8
add(4) → 8
Giải thích: stream [2,3,4,5,8,10] → phần tử lớn thứ 3 lần lượt là 4, 5, 5, 8, 8.

Input: k = 1, nums = []
add(7) → 7
add(100) → 100
~~~

### Ràng buộc
- {{1 <= k <= 10^4}}
- {{0 <= nums.length <= 10^4}}, {{-10^4 <= nums[i], val <= 10^4}}
- {{add}} được gọi tối đa {{10^4}} lần.`,
  hints: [
    'Sort lại toàn bộ stream sau mỗi lần add thì đúng nhưng tốn O(n log n) mỗi lượt — thực ra ta chỉ cần nhớ đúng {{k}} phần tử lớn nhất.',
    'Dùng **min-heap** chứa {{k}} phần tử lớn nhất: root là phần tử nhỏ nhất trong nhóm đó, tức chính là đáp án "lớn thứ k".',
    'Mỗi {{add}}: đẩy val vào heap, nếu heap vỡ kích thước {{k}} thì {{poll()}} bỏ root. O(log k) mỗi lượt, bộ nhớ O(k).'
  ],
  solution: `### Ý tưởng
Duy trì một **min-heap** đúng kích thước {{k}} chứa {{k}} phần tử lớn nhất đã thấy. Vì root là phần tử nhỏ nhất trong nhóm này, root chính là phần tử lớn thứ {{k}} của toàn stream. Khi thêm một số mới, nếu nó lớn hơn root thì nó sẽ thay root trong nhóm k; nếu nhỏ hơn thì bị loại ngay ở bước {{poll}} — không cần xử lý riêng.

~~~java
class KthLargest {
    private final int k;
    private final PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int n : nums) add(n);   // nap cac phan tu ban dau cung dung add
    }

    public int add(int val) {
        minHeap.offer(val);
        if (minHeap.size() > k) minHeap.poll();   // loai phan tu nho nhat trong k phan tu lon nhat
        return minHeap.peek();                    // root = phan tu lon thu k
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phân biệt với bài "tìm kth largest của một **mảng**" (sort/quickselect): ở đây data là **stream** nên cần cấu trúc giữ trạng thái giữa các lần gọi.
- Nếu {{nums.length < k}} thì sao? Đề đảm bảo luôn có ít nhất {{k}} phần tử khi {{add}} được gọi — nhưng nếu không, bạn phải hỏi lại interviewer để chốt hành vi.
- Bài đối xứng "kth smallest" dùng đúng mẫu này với **max-heap**.

> Senior tip: Mẫu "heap giữ đúng k phần tử" chạy khắp production — top-k seller, top-k endpoint theo latency, top-k consumer theo lag. Khi stream không fit memory thì mới nghĩ đến sketch xấp xỉ (Count-Min / Space-Saving); còn fit thì min-heap size k là đủ và luôn chính xác.`,
  starter: `class KthLargest {
    public KthLargest(int k, int[] nums) {
        
    }
    public int add(int val) {
        return 0;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual))
            throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void runSteps(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        runSteps("example", () -> {
            KthLargest k = new KthLargest(3, new int[]{4, 5, 8, 2});
            eq(4, k.add(3));
            eq(5, k.add(5));
            eq(5, k.add(10));
            eq(8, k.add(9));
            eq(8, k.add(4));
        });
        runSteps("empty stream k=1", () -> {
            KthLargest k = new KthLargest(1, new int[0]);
            eq(7, k.add(7));
            eq(100, k.add(100));
            eq(100, k.add(50));
        });
        runSteps("all smaller than root", () -> {
            KthLargest k = new KthLargest(2, new int[]{10, 9, 8});
            eq(9, k.add(7));
            eq(9, k.add(1));
        });
        runSteps("duplicates", () -> {
            KthLargest k = new KthLargest(2, new int[]{1, 1, 1});
            eq(1, k.add(1));
            eq(1, k.add(2));
            eq(1, k.add(0));
        });
        runSteps("single element", () -> {
            KthLargest k = new KthLargest(1, new int[]{5});
            eq(6, k.add(6));
            eq(6, k.add(4));
            eq(6, k.add(6));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(log k) mỗi add, O(n log k) khởi tạo; Space O(k)',
  follow: [
    'Nếu k thay đổi giữa chừng (reconfigure) thì làm thế nào?',
    'Nhiều thread cùng gọi add thì cần sửa gì?'
  ]
},
{
  id: 'algo-093',
  title: 'K Closest Points to Origin',
  difficulty: 'medium',
  pattern: 'Top K Elements',
  tags: ['heap', 'quickselect', 'geometry', 'bytebytego'],
  prompt: `Cho mảng {{points}} trong đó {{points[i] = [xi, yi]}} là tọa độ một điểm trên mặt phẳng. Trả về {{k}} điểm **gần gốc tọa độ (0, 0) nhất**. Thứ tự trong kết quả không quan trọng.

### Ví dụ
~~~text
Input: points = [[1, 3], [-2, 2]], k = 1
Output: [[-2, 2]]

Input: points = [[3, 3], [5, -1], [-2, 4]], k = 2
Output: [[3, 3], [-2, 4]]
~~~

### Ràng buộc
- {{1 <= k <= points.length <= 10^4}}
- {{-10^4 <= xi, yi <= 10^4}}`,
  hints: [
    'Khoảng cách đến gốc là {{sqrt(x^2 + y^2)}} — để so sánh thì chỉ cần **bình phương**, không cần sqrt (vừa nhanh vừa tránh sai số dấu chấm động).',
    'Cách straightforward: sort theo bình phương khoảng cách rồi lấy k phần tử đầu — O(n log n).',
    'Cách tối ưu hơn: max-heap giữ đúng k điểm gần nhất, mỗi phần tử mới so với root — O(n log k); hoặc quickselect partition O(n) trung bình.'
  ],
  solution: `### Ý tưởng
So sánh bình phương khoảng cách, không cần sqrt. Dùng **max-heap** theo bình phương khoảng cách, giữ đúng {{k}} phần tử nhỏ nhất: gặp điểm nào đẩy vào heap, nếu quá k thì {{poll()}} bỏ điểm xa nhất (root). Heap luôn chứa đúng k điểm gần gốc nhất, còn thứ tự thì không quan trọng nên trả thẳng ra được.

~~~java
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // max-heap theo binh phuong khoang cach: root la diem XA nhat trong k diem gan nhat
        PriorityQueue<int[]> heap = new PriorityQueue<>(
            (a, b) -> Integer.compare(b[0] * b[0] + b[1] * b[1],
                                      a[0] * a[0] + a[1] * a[1]));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) heap.poll();   // loai diem XA nhat
        }
        return heap.toArray(new int[0][]);
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{Integer.compare(a, b)}} thay vì {{a - b}}: tuy bình phương khoảng cách trong ràng buộc này không tràn int, nhưng thói quen này an toàn khi toạ độ lớn hơn (dùng {{long}}).
- Nếu interviewer yêu cầu O(n) trung bình: **quickselect** partition theo bình phương khoảng cách — code dài hơn, cẩn thận worst case O(n^2) khi dữ liệu dày đặc; có thể thêm random pivot.
- Nếu {{k = n}} thì sort cả mảng là tối ưu (không có phần bị loại); nếu {{k}} nhỏ thì heap thắng.

> Senior tip: Trong hệ thống thật, "k điểm gần nhất" (nearest-neighbour) là bài toán lõi của location service: tìm k chi nhánh/quán gần user. Ngoài thuật toán, cần chú ý index không gian (R-tree, geohash) — không ai scan toàn bộ {{10^7}} điểm mỗi request; thuật toán chỉ là bước cuối sau khi index đã lọc xong.`,
  starter: `class Solution {
    public int[][] kClosest(int[][] points, int k) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static int[][] norm(int[][] a) {
        int[][] c = new int[a.length][];
        for (int i = 0; i < a.length; i++) c[i] = a[i].clone();
        Arrays.sort(c, (x, y) -> x[0] != y[0] ? Integer.compare(x[0], y[0]) : Integer.compare(x[1], y[1]));
        return c;
    }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected "
                    + Arrays.deepToString((int[][]) expected)
                    + " got " + Arrays.deepToString((int[][]) actual));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", norm(new int[][]{{-2, 2}}),
            () -> norm(new Solution().kClosest(new int[][]{{1, 3}, {-2, 2}}, 1)));
        run("example2", norm(new int[][]{{3, 3}, {-2, 4}}),
            () -> norm(new Solution().kClosest(new int[][]{{3, 3}, {5, -1}, {-2, 4}}, 2)));
        run("single point", norm(new int[][]{{5, 5}}),
            () -> norm(new Solution().kClosest(new int[][]{{5, 5}}, 1)));
        run("k equals n", norm(new int[][]{{1, 1}, {2, 2}}),
            () -> norm(new Solution().kClosest(new int[][]{{2, 2}, {1, 1}}, 2)));
        run("negatives", norm(new int[][]{{-2, -2}}),
            () -> norm(new Solution().kClosest(new int[][]{{-2, -2}, {3, 3}}, 1)));
        run("large", norm(new int[][]{{0, 0}, {1, 0}, {2, 0}}),
            () -> {
                int[][] pts = new int[10000][2];
                for (int i = 0; i < pts.length; i++) { pts[i][0] = pts.length - 1 - i; pts[i][1] = 0; }
                return norm(new Solution().kClosest(pts, 3));
            });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n log k) với heap size k; Space O(k)',
  follow: [
    'Giải thích cách viết quickselect cho bài này và worst case khi nào xảy ra.',
    'Nếu mỗi điểm có weight thì "gần nhất" được định nghĩa thế nào?'
  ]
},
{
  id: 'algo-094',
  title: 'Kth Smallest Number in a Sorted Matrix',
  difficulty: 'medium',
  pattern: 'Top K Elements',
  tags: ['binary-search', 'matrix', 'heap', 'bytebytego'],
  prompt: `Cho ma trận vuông {{n x n}} mà mỗi **hàng** và mỗi **cột** đều được sắp xếp tăng dần (các phần tử có thể trùng nhau). Trả về phần tử **nhỏ thứ {{k}}** ({{k}} bắt đầu từ 1) nếu đọc ma trận theo thứ tự không giảm.

### Ví dụ
~~~text
Input: matrix = [[1, 5, 9],
                 [10, 11, 13],
                 [12, 13, 15]], k = 8
Output: 13
Giải thích: dãy tăng dần là [1, 5, 9, 10, 11, 12, 13, 13, 15] → phần tử thứ 8 là 13.

Input: matrix = [[-5]], k = 1
Output: -5
~~~

### Ràng buộc
- {{1 <= n <= 300}}
- {{-10^9 <= matrix[i][j] <= 10^9}}
- Ma trận được sắp xếp như mô tả, mọi {{1 <= k <= n^2}}.`,
  hints: [
    'Phần tử nhỏ nhất là {{matrix[0][0]}}, lớn nhất là {{matrix[n-1][n-1]}} — đáp án nằm trong đoạn giá trị này.',
    'Sort/flatten O(n^2 log n^2) đúng nhưng lãng phí. Hãy **binary search trên giá trị**: với mỗi {{mid}}, đếm số phần tử <= {{mid}}.',
    'Đếm số phần tử <= {{x}} O(n): bắt đầu từ góc **dưới-trái** (cột đầu tiên đã sort), nếu {{m[r][c] <= x}} thì cả {{r+1}} phần tử trên cột này đều <= x, sang cột tiếp; ngược lại đi lên một hàng.'
  ],
  solution: `### Ý tưởng
**Binary search trên không gian giá trị** từ {{lo = matrix[0][0]}} đến {{hi = matrix[n-1][n-1]}}. Với mỗi {{mid}}, gọi {{countLE(mid)}} — số phần tử nhỏ hơn hay bằng {{mid}} — bằng cách đi từ góc dưới-trái lên: mỗi cột đã sort nên nếu {{m[r][c] <= mid}} thì {{r+1}} phần tử phía trên đều đạt, cộng vào tổng và sang cột sau; nếu lớn hơn thì giảm {{r}}. O(n) cho mỗi lần đếm.

Nếu {{countLE(mid) < k}} thì đáp án > mid (đẩy {{lo}} lên); ngược lại đáp án <= mid ({{hi = mid}}). {{lo == hi}} là đáp án — phần tử nhỏ thứ k **chính là** giá trị nhỏ nhất mà có >= k phần tử <= nó.

~~~java
class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countLE(matrix, mid) < k) lo = mid + 1;   // qua nho, dap an ben phai
            else hi = mid;                                 // du nho, dap an nam trong [lo, mid]
        }
        return lo;
    }

    // dem so phan tu <= x, di tu goc duoi-trai
    private int countLE(int[][] m, int x) {
        int n = m.length, r = n - 1, c = 0, cnt = 0;
        while (r >= 0 && c < n) {
            if (m[r][c] <= x) { cnt += r + 1; c++; }   // toan bo cot nay deu <= x
            else r--;                                   // cot nay co phan tu > x, di len
        }
        return cnt;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cái bẫy kinh điển: mid là giá trị **không có thật** trong ma trận vẫn ổn — ta chỉ cần đếm, không cần mid là phần tử. Kết quả hội tụ về giá trị thật nhỏ thứ k (xử lý được cả khi có trùng lặp).
- Cách heap: n hàng, min-heap ban đầu chứa phần tử đầu mỗi hàng, {{poll}} {{k}} lần — O(k log n), **tốt hơn** khi {{k << n^2}}. Nói được cả hai là điểm cộng.
- {{lo + (hi - lo) / 2}} tránh tràn so với {{(lo + hi) / 2}} khi giá trị gần {{10^9}}.

> Senior tip: "Binary search trên answer + đếm số phần tử thoả điều kiện" là khuôn mẫu chung của nhiều bài hard (koko bananas, split array, magnetic force). Phỏng vấn senior nên nhận ra pattern này ngay từ câu chữ "tìm phần tử thứ k trong cấu trúc đã sort 2 chiều".`,
  starter: `class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example", 13, () -> new Solution().kthSmallest(
            new int[][]{{1, 5, 9}, {10, 11, 13}, {12, 13, 15}}, 8));
        run("k=1 smallest", 1, () -> new Solution().kthSmallest(
            new int[][]{{1, 5, 9}, {10, 11, 13}, {12, 13, 15}}, 1));
        run("k=n*n largest", 15, () -> new Solution().kthSmallest(
            new int[][]{{1, 5, 9}, {10, 11, 13}, {12, 13, 15}}, 9));
        run("single element", -5, () -> new Solution().kthSmallest(new int[][]{{-5}}, 1));
        run("duplicates", 2, () -> new Solution().kthSmallest(new int[][]{{1, 2}, {2, 3}}, 3));
        run("all equal", 7, () -> new Solution().kthSmallest(new int[][]{{7, 7}, {7, 7}}, 4));
        run("k mid duplicates", 3, () -> new Solution().kthSmallest(
            new int[][]{{1, 2, 3}, {3, 3, 4}, {4, 5, 6}}, 5));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n log(max - min)), Space O(1) — n là cạnh ma trận',
  follow: [
    'So sánh với cách dùng min-heap: khi nào heap thắng binary search?',
    'Nếu ma trận chỉ sort theo hàng, không sort theo cột thì sao?'
  ]
},
{
  id: 'algo-095',
  title: 'Frequency Sort',
  difficulty: 'medium',
  pattern: 'Top K Elements',
  tags: ['string', 'heap', 'bucket', 'bytebytego'],
  prompt: `Cho một chuỗi {{s}}. Sắp xếp lại các ký tự trong chuỗi sao cho các ký tự **giống nhau nằm cạnh nhau** và ký tự có **tần suất cao hơn đứng trước**. Nếu nhiều ký tự cùng tần suất thì thứ tự tương ứng tuỳ ý.

### Ví dụ
~~~text
Input:  s = "tree"
Output: "eert"   (hoặc "eetr" — e xuất hiện 2 lần nên đi trước)

Input:  s = "cccaaa"
Output: "cccaaa" (hoặc "aaaccc" — cả hai đều đúng)

Input:  s = "Aabb"
Output: "bbAa"   (hoặc "bbaA" — b: 2, a: 1, A: 1)
~~~

### Ràng buộc
- {{1 <= s.length <= 5 * 10^4}}; {{s}} gồm các ký tự in hoa, in thường và chữ số.`,
  hints: [
    'Đếm tần suất từng ký tự trước — O(n) bằng HashMap hay mảng 128 phần tử.',
    'Cách 1: đưa các cặp (ký tự, tần suất) vào **max-heap** theo tần suất, rồi lấy từng cặp ra và nối ký tự đúng số lần.',
    'Cách 2 (O(n)): gom ký tự vào **bucket** theo tần suất — bucket[i] chứa các ký tự xuất hiện i lần — rồi duyệt bucket từ cao xuống.'
  ],
  solution: `### Ý tưởng
Đếm tần suất, rồi xếp các (ký tự, tần suất) theo tần suất giảm dần bằng max-heap; mỗi lần lấy ra một cặp thì nối ký tự đó đúng số lần bằng StringBuilder. Mọi ký tự cùng tần suất nằm trong một nhóm liên tiếp — yêu cầu "giống nhau cạnh nhau" tự động thoả mãn.

~~~java
class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

        // max-heap theo tuyen giam dan cua tan suat
        PriorityQueue<Map.Entry<Character, Integer>> heap =
            new PriorityQueue<>((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        heap.addAll(freq.entrySet());

        StringBuilder sb = new StringBuilder();
        while (!heap.isEmpty()) {
            Map.Entry<Character, Integer> e = heap.poll();
            for (int i = 0; i < e.getValue(); i++) sb.append(e.getKey());
        }
        return sb.toString();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Vì đề cho phép thứ tự tùy ý khi cùng tần suất nên kết quả **không cần** được xác định tuyệt đối — interviewer có thể hỏi "làm sao cho kết quả deterministic?" → sort thứ cấp theo thứ tự bảng chữ cái.
- Bucket sort O(n) thường được nhắc tới như đáp án tối ưu: tần suất tối đa là {{n}} nên có tối đa {{n}} bucket; không cần so sánh, không log.
- Đừng viết {{b.getValue() - a.getValue()}} làm comparator nếu tần suất có thể lớn: {{Integer.compare}} an toàn hơn; trong ràng buộc này thì chưa tràn nhưng là thói quen tốt.

> Senior tip: "Frequency sort" là vỏ của rất nhiều bài thật: log compression (RLE), top-k query suggestion, hay "most active user trong window". Sau khi nói xong heap/bucket, senior nên discuss luôn phần **window**: đếm tần suất trong 5 phút gần nhất thì cần sliding window + map, không còn là một lần đếm tĩnh.`,
  starter: `class Solution {
    public String frequencySort(String s) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static String buildLarge() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 1000; i++) sb.append("x");
        for (int i = 0; i < 2000; i++) sb.append("y");
        for (int i = 0; i < 3000; i++) sb.append("z");
        return sb.toString();
    }
    static void checkValid(String name, String input, String output) {
        total++;
        try {
            if (output == null || output.length() != input.length()) {
                System.out.println("FAIL " + name + ": length " + (output == null ? "null" : output.length())
                    + " expected " + input.length());
                return;
            }
            Map<Character, Integer> in = new HashMap<>(), out = new HashMap<>();
            for (char c : input.toCharArray()) in.merge(c, 1, Integer::sum);
            for (char c : output.toCharArray()) out.merge(c, 1, Integer::sum);
            if (!in.equals(out)) {
                System.out.println("FAIL " + name + ": output is not an anagram of input");
                return;
            }
            int i = 0, prevFreq = Integer.MAX_VALUE;
            while (i < output.length()) {
                char c = output.charAt(i);
                int j = i;
                while (j < output.length() && output.charAt(j) == c) j++;
                int freq = in.get(c);
                if (j - i != freq) {
                    System.out.println("FAIL " + name + ": char " + c + " not contiguous (run "
                        + (j - i) + " vs freq " + freq + ")");
                    return;
                }
                if (freq > prevFreq) {
                    System.out.println("FAIL " + name + ": freq order broken at " + c);
                    return;
                }
                prevFreq = freq;
                i = j;
            }
            passed++;
            System.out.println("PASS " + name);
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        checkValid("example tree", "tree", new Solution().frequencySort("tree"));
        checkValid("example cccaaa", "cccaaa", new Solution().frequencySort("cccaaa"));
        checkValid("mixed case", "Aabb", new Solution().frequencySort("Aabb"));
        checkValid("single char", "z", new Solution().frequencySort("z"));
        checkValid("all distinct", "abc", new Solution().frequencySort("abc"));
        checkValid("digits", "11223", new Solution().frequencySort("11223"));
        checkValid("two chars", "aaabbb", new Solution().frequencySort("aaabbb"));
        checkValid("large", buildLarge(), new Solution().frequencySort(buildLarge()));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n log k) với heap (k = số ký tự khác nhau); bucket sort O(n). Space O(k + n)',
  follow: [
    'Giải thích cách làm bucket sort O(n) cho bài này.',
    'Nếu chỉ được dùng O(1) bộ nhớ tạm (ngoại trừ kết quả) thì xử lý thế nào?'
  ]
},

{
  id: 'algo-096',
  title: '0/1 Knapsack',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'knapsack', 'bytebytego'],
  prompt: `Bạn có {{n}} vật phẩm; vật phẩm thứ {{i}} có trọng lượng {{weights[i]}} và giá trị {{values[i]}}. Túi có tải trọng tối đa {{capacity}}. Mỗi vật phẩm chỉ được chọn **tối đa một lần** hoặc không chọn (0/1). Trả về giá trị lớn nhất có thể nhét vào túi.

### Ví dụ
~~~text
Input: weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
Output: 22
Giải thích: chọn vật 2 (nặng 2, giá 10) + vật 3 (nặng 3, giá 12) = 22.

Input: weights = [10], values = [5], capacity = 5
Output: 0
Giải thích: vật nặng hơn túi, không chọn được gì.

Input: weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 8
Output: 10
Giải thích: vật 2 (nặng 3, giá 4) + vật 4 (nặng 5, giá 6).
~~~

### Ràng buộc
- {{1 <= n <= 100}}
- {{1 <= weights[i], values[i] <= 100}}
- {{1 <= capacity <= 1000}}`,
  hints: [
    'Brute force: với mỗi vật có 2 lựa chọn → {{2^n}} — quá chậm. Trạng thái nào đang bị tính lại nhiều lần?',
    'Gọi {{dp[w]}} là giá trị lớn nhất nhét được trong túi có tải trọng tối đa {{w}}. Với mỗi vật, cập nhật thế nào để vật chỉ dùng một lần?',
    'Duyệt {{w}} **giảm dần** từ {{capacity}} xuống {{weights[i]}}: khi cập nhật {{dp[w]}}, các ô {{dp[w - weights[i]]}} bên trái chưa chứa vật hiện tại → vật chỉ được dùng một lần.'
  ],
  solution: `### Ý tưởng
DP 1 chiều: {{dp[w]}} = giá trị lớn nhất nhét được trong túi trọng lượng {{w}}. Với mỗi vật (nặng {{wt}}, giá {{val}}), duyệt {{w}} từ {{capacity}} xuống {{wt}}:

{{dp[w] = max(dp[w], dp[w - wt] + val)}}

Vì duyệt {{w}} giảm dần nên {{dp[w - wt]}} vẫn là trạng thái **chưa** cập nhật bởi vật hiện tại → mỗi vật tối đa một lần. Nếu duyệt tăng dần thì vật bị dùng vô số lần — đó là bài unbounded knapsack, cạm bẫy kinh điển.

~~~java
class Solution {
    public int knapsack(int[] weights, int[] values, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            // duyet nguoc: moi vat chi duoc dung MOT lan
            for (int w = capacity; w >= weights[i]; w--) {
                dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
            }
        }
        return dp[capacity];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Mở rộng sang 2 chiều {{dp[i][w]}} (xét {{i}} vật đầu tiên) để dễ trình bày; gộp còn 1 chiều chỉ khi đã giải thích được lý do duyệt ngược.
- Nếu interviewer hỏi "đếm số cách chọn được giá trị đúng target" → biến thể Count of Subset Sum; "phân hoạch thành 2 nửa bằng nhau" → Equal Partition.
- {{capacity}} lớn ({{10^6}}) còn {{n}} nhỏ → xem xét meet-in-the-middle hoặc branch & bound thay vì {{O(n * capacity)}}.

> Senior tip: Knapsack là gốc rễ của rất nhiều bài toán thật: batch sizing tối ưu doanh thu với ràng buộc RAM/CPU, chọn feature cho model dưới budget inference, chọn log sampling rate. Khiến bài gần production bằng cách thêm ràng buộc thứ hai (ví dụ còn hạn mức số lượng) — đó chính là multidimensional knapsack, và interviewer senior thường đẩy tới đó.`,
  starter: `class Solution {
    public int knapsack(int[] weights, int[] values, int capacity) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 22, () -> new Solution().knapsack(
            new int[]{1, 2, 3}, new int[]{6, 10, 12}, 5));
        run("item too heavy", 0, () -> new Solution().knapsack(
            new int[]{10}, new int[]{5}, 5));
        run("single item fits", 10, () -> new Solution().knapsack(
            new int[]{3}, new int[]{10}, 5));
        run("exact fit", 7, () -> new Solution().knapsack(
            new int[]{2, 2}, new int[]{3, 4}, 4));
        run("empty items", 0, () -> new Solution().knapsack(
            new int[0], new int[0], 10));
        run("classic", 10, () -> new Solution().knapsack(
            new int[]{2, 3, 4, 5}, new int[]{3, 4, 5, 6}, 8));
        run("value per weight trap", 18, () -> new Solution().knapsack(
            new int[]{4, 3, 2}, new int[]{10, 9, 8}, 6));
        run("large", 143, () -> {
            int n = 100;
            int[] w = new int[n], v = new int[n];
            for (int i = 0; i < n; i++) { w[i] = 1 + (i % 10); v[i] = 2 + (i % 7); }
            return new Solution().knapsack(w, v, 50);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * capacity), Space O(capacity)',
  follow: [
    'Tại sao duyệt w giảm dần mới đúng cho 0/1 knapsack?',
    'Nếu mỗi loại vật có số lượng giới hạn thì thuật toán nào?'
  ]
},
{
  id: 'algo-097',
  title: 'Subset Sum',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'subset-sum', 'bytebytego'],
  prompt: `Cho mảng số nguyên dương {{nums}} và một số {{target}}. Trả về {{true}} nếu tồn tại một **conset** (không cần liên tiếp) của {{nums}} có tổng bằng đúng {{target}}, ngược lại {{false}}.

### Ví dụ
~~~text
Input: nums = [1, 2, 3, 7], target = 6
Output: true
Giải thích: 1 + 2 + 3 = 6.

Input: nums = [1, 2, 3, 7], target = 15
Output: false
Giải thích: tổng cả mảng mới là 13, nhỏ hơn 15.

Input: nums = [1, 2, 5], target = 4
Output: false
~~~

### Ràng buộc
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}
- {{1 <= target <= 10^4}}`,
  hints: [
    'Gọi {{dp[s]}} là "có cách nào tạo ra tổng s từ các phần tử đã xét chưa?". {{dp[0]}} luôn {{true}} (chọn rỗng).',
    'Với mỗi phần tử {{x}}, nếu {{dp[s - x]}} đã true thì thêm {{x}} vào làm {{dp[s]}} true.',
    'Duyệt {{s}} giảm dần để mỗi phần tử chỉ dùng một lần — cùng khuôn mẫu với 0/1 knapsack; chỉ khác giá trị là boolean thay vì số.'
  ],
  solution: `### Ý tưởng
DP boolean 1 chiều: {{dp[s]}} = có thể tạo tổng {{s}} từ các phần tử đã xét. {{dp[0] = true}}. Với mỗi {{x}} trong {{nums}}, duyệt {{s}} từ {{target}} xuống {{x}}: {{dp[s] = dp[s] || dp[s - x]}}. Duyệt giảm dần đảm bảo mỗi phần tử tối đa một lần.

~~~java
class Solution {
    public boolean canPartition(int[] nums, int target) {
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;   // conset rong co tong 0
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];   // lay x hoac khong lay x
            }
        }
        return dp[target];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu {{target = 0}} → luôn {{true}} (conset rỗng); nếu tổng cả mảng < target thì cắt cụt ngay, tránh chạy DP vô ích.
- Số âm trong {{nums}}? Đề này chỉ số dương; nếu có số âm thì mảng boolean kích thước {{target + 1}} không còn đủ — cần map tổng → boolean, hoặc shift chỉ số.
- Từ subset sum dẫn thẳng tới hai bài biến thể: **Equal Partition** ({{target = sum / 2}}) và **Count Subset Sum** (đếm thay vì tồn tại).

> Senior tip: Subset sum xuất hiện trong thực tế như split bill cho nhóm, đóng gói đơn hàng theo thùng, anti-money-laundering (tìm tập giao dịch có tổng khớp số tiền đáng ngờ). Ở production với {{n}} lớn thì không chạy DP đầy đủ: xấp xỉ bằng sketch, hoặc meet-in-the-middle khi {{n ~ 40}}.`,
  starter: `class Solution {
    public boolean canPartition(int[] nums, int target) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", true, () -> new Solution().canPartition(new int[]{1, 2, 3, 7}, 6));
        run("example2 total too small", false, () -> new Solution().canPartition(new int[]{1, 2, 3, 7}, 15));
        run("no subset", false, () -> new Solution().canPartition(new int[]{1, 2, 5}, 4));
        run("single hit", true, () -> new Solution().canPartition(new int[]{5}, 5));
        run("single miss", false, () -> new Solution().canPartition(new int[]{5}, 3));
        run("target zero", true, () -> new Solution().canPartition(new int[]{1, 2}, 0));
        run("repeated ones", true, () -> new Solution().canPartition(new int[]{1, 1, 1, 1}, 3));
        run("exceeds sum", false, () -> new Solution().canPartition(new int[]{2, 4, 6}, 14));
        run("uses all elements", true, () -> new Solution().canPartition(new int[]{2, 4, 6}, 12));
        run("large false", false, () -> {
            int[] nums = new int[100];
            for (int i = 0; i < nums.length; i++) nums[i] = 1;
            return new Solution().canPartition(nums, 101);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * target), Space O(target)',
  follow: [
    'Trả về luôn conset cụ thể thay vì chỉ true/false thì sửa thế nào?',
    'Nếu nums có số âm thì thuật toán trên sai ở đâu?'
  ]
},

{
  id: 'algo-098',
  title: 'Equal Subset Sum Partition',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'partition', 'bytebytego'],
  prompt: `Cho mảng số nguyên dương {{nums}}. Trả về {{true}} nếu có thể **phân hoạch** {{nums}} thành hai conset sao cho tổng hai conset bằng nhau, ngược lại {{false}}.

### Ví dụ
~~~text
Input: nums = [1, 5, 11, 5]
Output: true
Giải thích: {1, 5, 5} và {11} — tổng đều là 11.

Input: nums = [1, 2, 3, 5]
Output: false
Giải thích: tổng 11 là số lẻ, không chia đôi được.

Input: nums = [2, 2, 2, 2]
Output: true
Giải thích: {2, 2} và {2, 2}.
~~~

### Ràng buộc
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}`,
  hints: [
    'Tổng hai nửa bằng nhau thì mỗi nửa phải đúng bằng {{sum / 2}}. Nếu {{sum}} lẻ thì từ chối ngay.',
    'Bài toán còn lại: tồn tại conset nào có tổng {{sum / 2}}? Đó chính là Subset Sum.',
    'Dùng mảng boolean {{dp[s]}}, duyệt giảm dần với từng phần tử — O(n * sum) thời gian, O(sum) bộ nhớ.'
  ],
  solution: `### Ý tưởng
Hai conset bằng nhau ⇔ mỗi conset có tổng {{sum / 2}}. Nếu {{sum}} lẻ → không thể. Còn lại chỉ là bài **Subset Sum** với target {{sum / 2}}: mảng boolean {{dp[s]}}, với mỗi {{x}} duyệt {{s}} giảm dần {{dp[s] = dp[s] || dp[s - x]}}.

~~~java
class Solution {
    public boolean canPartition(int[] nums) {
        int sum = 0;
        for (int x : nums) sum += x;
        if (sum % 2 != 0) return false;   // tong le khong chia duoc doi
        int target = sum / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[target];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Kiểm tra {{sum}} lẻ trước: cắt cụt sớm, tránh chạy DP thừa.
- Nếu {{nums.length <= 20}} ({{n}} nhỏ, giá trị lớn): meet-in-the-middle O({{2^(n/2)}}) tốt hơn O({{n * sum}}) khi {{sum}} khổng lồ.
- Truy vết (reconstruct) một trong hai conset: lưu thêm bit hoặc chạy DP 2 chiều rồi đi ngược — interviewer đôi khi hỏi phần này.

> Senior tip: Equal partition là bài kinh điển để hỏi nhận diện "đây là subset sum dưới vỏ bọc". Người tốt sẽ nói ngay: tổng lẻ out, còn lại quy về subset sum với target half. Trong production, bài này gắn với load balancing kiểu "chia N job thành 2 nhóm thời gian chạy bằng nhau" — NP-hard, thực tế dùng heuristic (greedy longest-processing-time-first) chứ không chạy DP khi {{sum}} quá lớn.`,
  starter: `class Solution {
    public boolean canPartition(int[] nums) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", true, () -> new Solution().canPartition(new int[]{1, 5, 11, 5}));
        run("odd sum", false, () -> new Solution().canPartition(new int[]{1, 2, 3, 5}));
        run("example3", true, () -> new Solution().canPartition(new int[]{2, 2, 2, 2}));
        run("single element", false, () -> new Solution().canPartition(new int[]{1}));
        run("triple plus pair", true, () -> new Solution().canPartition(new int[]{3, 3, 3, 4, 5}));
        run("too big single", false, () -> new Solution().canPartition(new int[]{100, 1}));
        run("large", true, () -> {
            int[] nums = new int[50];
            for (int i = 0; i < nums.length; i++) nums[i] = 100;
            return new Solution().canPartition(nums);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * sum), Space O(sum)',
  follow: [
    'Trả về một cách partition cụ thể thì làm tiếp thế nào?',
    'Meet-in-the-middle hoạt động thế nào khi n <= 40?'
  ]
},
{
  id: 'algo-099',
  title: 'Minimum Subset Sum Difference',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'partition', 'bytebytego'],
  prompt: `Chia mảng số nguyên dương {{nums}} thành hai conset {{S1}} và {{S2}} (mọi phần tử phải được gán vào đúng một conset). Trả về giá trị nhỏ nhất của {{|sum(S1) - sum(S2)|}}.

### Ví dụ
~~~text
Input: nums = [1, 6, 11, 5]
Output: 1
Giải thích: {6, 5} và {1, 11} → |11 - 12| = 1.

Input: nums = [1, 2, 3]
Output: 0
Giải thích: {1, 2} và {3} → |3 - 3| = 0.

Input: nums = [1]
Output: 1
Giải thích: {1} và {} → |1 - 0| = 1.
~~~

### Ràng buộc
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}`,
  hints: [
    'Gọi {{s1 + s2 = sum}}. Khi đó {{|s1 - s2| = |sum - 2 * s1|}} — difference nhỏ nhất khi {{s1}} gần {{sum / 2}} nhất.',
    'Đếm/xác định các tổng có thể đạt được bằng Subset Sum DP (boolean array), chỉ cần xét tới {{sum / 2}}.',
    'Tìm {{s}} lớn nhất ≤ {{sum / 2}} mà {{dp[s]}} true, đáp án là {{sum - 2 * s}}.'
  ],
  solution: `### Ý tưởng
{{|s1 - s2| = |sum - 2 * s1|}} → difference nhỏ nhất khi một conset có tổng gần {{sum / 2}} nhất. Chạy subset sum DP để biết tổng nào đạt được, rồi quét từ {{sum / 2}} xuống 0 tìm tổng khả thi lớn nhất {{s}}; đáp án {{= sum - 2 * s}} (chênh lệch hai bên, luôn không âm).

~~~java
class Solution {
    public int minSubsetDiff(int[] nums) {
        int sum = 0;
        for (int x : nums) sum += x;
        boolean[] dp = new boolean[sum / 2 + 1];
        dp[0] = true;
        for (int x : nums) {
            for (int s = sum / 2; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];
            }
        }
        // tim tong s <= sum/2 lon nhat co the dat duoc
        for (int s = sum / 2; s >= 0; s--) {
            if (dp[s]) return sum - 2 * s;   // sum - 2*s = |s - (sum - s)|
        }
        return sum;   // khong dat duoc gi ngoai conset rong
    }
}
~~~

### Lưu ý khi phỏng vấn
- Quét từ {{sum / 2}} xuống để tìm được tổng khả thi **lớn nhất** ≤ half — chênh lệch vì thế là nhỏ nhất. Quét tăng dần sẽ lấy nhầm tổng nhỏ, kết quả sai (lớn hơn).
- Bài chính dạng: partition được thì đáp án 0 — Equal Subset Sum Partition là trường hợp đặc biệt.
- {{nums}} có số âm? Công thức {{sum - 2*s}} không còn đúng trực tiếp; cần DP trên dãy tổng có thể âm (shift chỉ số).

> Senior tip: Đây là bài DP "biến thể một dòng" của subset sum — phần value nằm ở chỗ biến đổi công thức {{|s1 - s2| = |sum - 2*s1|}} trước khi code. Ứng dụng thật: chia dữ liệu làm 2 batch xử lý cho hai worker cho thời gian chạy sát nhau nhất, cân bằng partition cho database sharding hai node. Ở quy mô lớn thì quay về greedy + local search, không còn DP.`,
  starter: `class Solution {
    public int minSubsetDiff(int[] nums) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 1, () -> new Solution().minSubsetDiff(new int[]{1, 6, 11, 5}));
        run("example2 perfect", 0, () -> new Solution().minSubsetDiff(new int[]{1, 2, 3}));
        run("single", 1, () -> new Solution().minSubsetDiff(new int[]{1}));
        run("pair equal", 0, () -> new Solution().minSubsetDiff(new int[]{5, 5}));
        run("cannot split evenly", 2, () -> new Solution().minSubsetDiff(new int[]{1, 2, 5}));
        run("all equal quadruple", 0, () -> new Solution().minSubsetDiff(new int[]{3, 3, 3, 3}));
        run("large perfect", 0, () -> {
            int[] nums = new int[50];
            for (int i = 0; i < nums.length; i++) nums[i] = 1;
            return new Solution().minSubsetDiff(nums);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * sum), Space O(sum)',
  follow: [
    'Nếu bắt buộc hai conset không rỗng thì case nào cần xử lý riêng?',
    'Số phần tử lớn nhưng giá trị nhỏ (n = 10^5, num <= 100) thì tối ưu nào?'
  ]
},

{
  id: 'algo-100',
  title: 'Count of Subset Sum',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'subset-sum', 'bytebytego'],
  prompt: `Cho mảng số nguyên dương {{nums}} và số {{target}}. Đếm số **conset** của {{nums}} có tổng bằng đúng {{target}}. Hai phần tử bằng nhau ở hai vị trí khác nhau được coi là hai phần tử khác nhau (đếm theo chỉ số).

### Ví dụ
~~~text
Input: nums = [1, 1, 2, 3], target = 4
Output: 3
Giải thích: {1, 3} (chọn 1 đầu tiên), {1, 3} (chọn 1 thứ hai), {1, 1, 2}.

Input: nums = [1, 2, 3], target = 3
Output: 2
Giải thích: {3} và {1, 2}.

Input: nums = [1], target = 2
Output: 0
~~~

### Ràng buộc
- {{0 <= nums.length <= 200}}
- {{1 <= nums[i] <= 100}}
- {{1 <= target <= 10^4}}`,
  hints: [
    'Giống Subset Sum nhưng thay mảng boolean bằng mảng **đếm**: {{dp[s]}} = số cách tạo tổng {{s}}.',
    '{{dp[0] = 1}} — có đúng một cách tạo tổng 0: không chọn phần tử nào.',
    'Với mỗi {{x}} duyệt {{s}} giảm dần: {{dp[s] += dp[s - x]}} — mỗi cách tạo {{s - x}} cho một cách tạo {{s}} mới bằng cách thêm {{x}}.'
  ],
  solution: `### Ý tưởng
DP đếm 1 chiều: {{dp[s]}} = số conset có tổng {{s}}. {{dp[0] = 1}} (conset rỗng). Với mỗi {{x}}, duyệt {{s}} từ {{target}} xuống {{x}} và cộng dồn {{dp[s] += dp[s - x]}}. Duyệt giảm dần đảm bảo {{x}} chỉ tham gia mỗi cách chọn tối đa một lần.

~~~java
class Solution {
    public int countSubsets(int[] nums, int target) {
        int[] dp = new int[target + 1];
        dp[0] = 1;   // mot cach duy nhat de tong 0: khong chon gi
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] += dp[s - x];   // them moi cach lay x vao cac cach cua s - x
            }
        }
        return dp[target];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Tràn số: số cách có thể vượt {{int}} — hỏi interviewer có cần modulo không (thường mod {{10^9 + 7}}); khi đó dùng {{long}} rồi lấy modulo khi cộng.
- Nếu đề yêu cầu các conset **về mặt giá trị** ({1, 2} và {2, 1} tính một, hai số 1 bị coi là một) thì DP theo chỉ số sẽ đếm thừa — cần sort và xử lý nhóm trùng khác đi.
- {{target = 0}}: {{dp[0] = 1}} đếm cả conset rỗng; một số đề định nghĩa "conset không rỗng" thì phải trừ đi 1.

> Senior tip: Count subset sum là nền của việc tính "số combo sản phẩm khớp ngân sách khách hàng" hay "số tập giao dịch khớp mẫu bất thường" trong billing/AML. Giá trị phỏng vấn nằm ở chỗ bạn nhận ra **đổi boolean sang cộng dồn** là xong, và chủ động nói về tràn số/modulo — đó là dấu hiệu nghĩ tới production thay vì chỉ giải đề.`,
  starter: `class Solution {
    public int countSubsets(int[] nums, int target) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static int[] fill(int n, int v) {
        int[] a = new int[n];
        Arrays.fill(a, v);
        return a;
    }
    public static void main(String[] args) {
        run("example1", 3, () -> new Solution().countSubsets(new int[]{1, 1, 2, 3}, 4));
        run("example2", 2, () -> new Solution().countSubsets(new int[]{1, 2, 3}, 3));
        run("no way", 0, () -> new Solution().countSubsets(new int[]{1}, 2));
        run("empty target zero", 1, () -> new Solution().countSubsets(new int[0], 0));
        run("three ones choose two", 3, () -> new Solution().countSubsets(new int[]{1, 1, 1}, 2));
        run("duplicates matter", 3, () -> new Solution().countSubsets(new int[]{1, 2, 3, 3}, 6));
        run("large combination", 3268760, () -> new Solution().countSubsets(fill(25, 1), 10));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * target), Space O(target)',
  follow: [
    'Nếu kết quả cần modulo 10^9 + 7 thì code đổi thế nào?',
    'Đếm số conset có tổng trong đoạn [lo, hi] thì làm gì?'
  ]
},
{
  id: 'algo-101',
  title: 'Target Sum',
  difficulty: 'medium',
  pattern: '0/1 Knapsack (DP)',
  tags: ['dp', 'subset-sum', 'bytebytego'],
  prompt: `Cho mảng số nguyên không âm {{nums}} và số {{target}}. Với **mỗi** phần tử, bạn gán dấu {{+}} hoặc {{-}} trước nó. Trả về số cách gán dấu sao cho biểu thức tính ra đúng bằng {{target}}.

### Ví dụ
~~~text
Input: nums = [1, 1, 1, 1, 1], target = 3
Output: 5
Giải thích: cộng 4 số và trừ 1 số; vị trí số bị trừ có 5 cách chọn → 5 biểu thức.

Input: nums = [1], target = 1
Output: 1

Input: nums = [1], target = 2
Output: 0
~~~

### Ràng buộc
- {{1 <= nums.length <= 20}}
- {{0 <= nums[i] <= 1000}}
- {{-1000 <= target <= 1000}}`,
  hints: [
    'Gọi tổng các số được cộng là {{P}}, tổng các số bị trừ là {{N}}. Ta có {{P - N = target}} và {{P + N = sum}}.',
    'Từ hai phương trình: {{P = (sum + target) / 2}} — bài toán quy về **đếm conset** có tổng {{P}} (chính là Count of Subset Sum).',
    'Nếu {{abs(target) > sum}} hoặc {{(sum + target)}} lẻ thì không có cách nào — trả 0 sớm. Số 0 trong mảng nhân đôi kết quả một cách tự nhiên.'
  ],
  solution: `### Ý tưởng
{{P - N = target}} và {{P + N = sum}} → {{P = (sum + target) / 2}}. Bài toán trở thành: đếm số conset có tổng {{P}} — dùng lại DP của Count of Subset Sum. Kiểm tra sớm: {{abs(target) > sum}} hoặc {{(sum + target)}} lẻ → 0 cách. Số 0 trong mảng xử lý tự nhiên: khi {{x = 0}}, vòng lặp {{dp[s] += dp[s]}} nhân đôi số cách — đúng vì {{+0}} và {{-0}} là hai biểu thức khác nhau.

~~~java
class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int sum = 0;
        for (int x : nums) sum += x;
        if (Math.abs(target) > sum || (sum + target) % 2 != 0) return 0;
        int p = (sum + target) / 2;   // tong cac so duoc CONG
        int[] dp = new int[p + 1];
        dp[0] = 1;
        for (int x : nums) {
            for (int s = p; s >= x; s--) {
                dp[s] += dp[s - x];
            }
        }
        return dp[p];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đây là bài "biến đổi đại số trước khi code": nhớ {{P = (sum + target) / 2}} là chìa khóa; không quy được về subset sum thì phải quay lại DFS {{2^n}} ({{n <= 20}} vẫn chạy được nhưng chậm và dài hơn).
- Sau khi kiểm {{abs(target) <= sum}} thì {{sum + target >= 0}} nên phép modulo 2 an toàn, không âm.
- Số 0: mảng [0], target 0 → 2 ({{+0}}, {{-0}}) — DP tự cho kết quả đúng, đừng "xử lý đặc biệt" làm sai.

> Senior tip: Target sum là ví dụ mẫu mực về việc **biến đổi đề bài về bài đã biết** — kỹ năng phân tích này quan trọng hơn viết DP. Trong phỏng vấn thật, khi thấy "gán +/- cho từng phần tử", hãy nói ngay: quy về subset sum với mục tiêu {{(sum + target) / 2}}; phần còn lại chỉ là mechanical.`,
  starter: `class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 5, () -> new Solution().findTargetSumWays(new int[]{1, 1, 1, 1, 1}, 3));
        run("single hit", 1, () -> new Solution().findTargetSumWays(new int[]{1}, 1));
        run("single miss", 0, () -> new Solution().findTargetSumWays(new int[]{1}, 2));
        run("zero element", 2, () -> new Solution().findTargetSumWays(new int[]{0}, 0));
        run("zero does not help", 0, () -> new Solution().findTargetSumWays(new int[]{1, 0}, 0));
        run("mixed", 3, () -> new Solution().findTargetSumWays(new int[]{1, 2, 3, 4, 5}, 3));
        run("negative target", 5, () -> new Solution().findTargetSumWays(new int[]{1, 1, 1, 1, 1}, -3));
        run("zeros multiply", 8, () -> new Solution().findTargetSumWays(new int[]{0, 0, 0}, 0));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * (sum + target)), Space O(sum + target)',
  follow: [
    'DFS ghi nhớ (memo) làm bài này thế nào?',
    'Trả về một cách gán dấu cụ thể thì sửa code ra sao?'
  ]
},
{
  id: 'algo-102',
  title: 'House Robber',
  difficulty: 'medium',
  pattern: 'Fibonacci Numbers (DP)',
  tags: ['dp', 'array', 'bytebytego'],
  prompt: `Bạn là tên trộm đang hoạch định một dãy {{n}} căn nhà xếp trên một đường thẳng; nhà thứ {{i}} chứa số tiền {{nums[i]}}. Camera bắt buộc: **không được cướp hai nhà kề nhau**. Trả về số tiền lớn nhất có thể cướp được.

### Ví dụ
~~~text
Input: nums = [1, 2, 3, 1]
Output: 4
Giải thích: cướp nhà 1 và nhà 3 → 1 + 3 = 4 (không cướp nhà 2 và nhà 4).

Input: nums = [2, 7, 9, 3, 1]
Output: 12
Giải thích: 2 + 9 + 1 = 12.

Input: nums = [5]
Output: 5
~~~

### Ràng buộc
- {{1 <= nums.length <= 100}}
- {{0 <= nums[i] <= 400}}`,
  hints: [
    'Với từng nhà chỉ có hai lựa chọn: **cướp** nó (cộng tiền nó với kết quả tối ưu bỏ qua nhà liền trước) hoặc **không cướp** (giữ kết quả tối ưu xét đến nhà liền trước).',
    'Gọi {{dp[i]}} là số tiền tối đa xét {{i}} nhà đầu: {{dp[i] = max(dp[i-1], dp[i-2] + nums[i])}}.',
    'Chỉ cần hai biến {{prev1, prev2}} thay vì cả mảng — bài này chính là nơi luyện kỹ năng gộp mảng DP như Fibonacci.'
  ],
  solution: `### Ý tưởng
Nhà cuối: nếu cướp thì {{nums[n-1] + ket qua tot nhat cua [0, n-2]}}, không cướp thì {{ket qua tot nhat cua [0, n-1]}}. Công thức: {{dp[i] = max(dp[i-1], dp[i-2] + nums[i])}}. Gộp còn hai biến: {{prev2}} = kết quả tối ưu trước 2 nhà, {{prev1}} = trước 1 nhà.

~~~java
class Solution {
    public int rob(int[] nums) {
        int prev2 = 0;   // tot nhat truoc 2 nha
        int prev1 = 0;   // tot nhat truoc 1 nha
        for (int x : nums) {
            int cur = Math.max(prev1, prev2 + x);   // bo qua hoac an nha nay
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{nums.length = 1}}: vòng lặp chạy một lần → {{cur = max(0, 0 + x) = x}} — đúng.
- Variant vòng tròn (House Robber II): hai nhà đầu cuối kề nhau → chạy hai lượt: bỏ nhà đầu hoặc bỏ nhà cuối, lấy max.
- Variant "cướp được nhiều hơn nhưng bị phạt": phải hỏi rõ hình phạt cộng/trừ thế nào rồi mới viết công thức — cạm bẫy giao tiếp, không phải cạm bẫy code.

> Senior tip: House Robber là Fibonacci apply vào dữ liệu — khi phỏng vấn, hãy nhận ra họ đang test bạn có thấy {{dp[i] = f(dp[i-1], dp[i-2])}} không. Mọi bài DP một chiều dạng "quyết định lấy/không lấy phần tử i" đều có hình hài này; House Robber II, Delete and Earn, Minimum Cost Climbing Stairs đều là anh em ruột.`,
  starter: `class Solution {
    public int rob(int[] nums) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 4, () -> new Solution().rob(new int[]{1, 2, 3, 1}));
        run("example2", 12, () -> new Solution().rob(new int[]{2, 7, 9, 3, 1}));
        run("single house", 5, () -> new Solution().rob(new int[]{5}));
        run("two houses", 2, () -> new Solution().rob(new int[]{1, 2}));
        run("zero money", 0, () -> new Solution().rob(new int[]{0}));
        run("two big ends", 200, () -> new Solution().rob(new int[]{100, 1, 1, 100}));
        run("one to ten", 30, () -> new Solution().rob(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}));
        run("large flat", 20000, () -> {
            int[] nums = new int[100];
            Arrays.fill(nums, 400);
            return new Solution().rob(nums);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: [
    'House Robber II (nhà đầu cuối kề nhau) giải ra sao?',
    'Nếu muốn in ra danh sách nhà đã cướp thì lưu thêm gì?'
  ]
},
{
  id: 'algo-103',
  title: 'House Robber II',
  difficulty: 'medium',
  pattern: 'Fibonacci Numbers (DP)',
  tags: ['dp', 'circular', 'bytebytego'],
  prompt: `Giống bài House Robber: {{n}} căn nhà xếp theo **vòng tròn** (nhà 1 và nhà {{n}} kề nhau); nhà {{i}} chứa {{nums[i]}}; không được cướp hai nhà kề nhau. Trả về số tiền lớn nhất cướp được.

### Ví dụ
~~~text
Input: nums = [2, 3, 2]
Output: 3
Giải thích: không thể cướp cả nhà 1 và nhà 3 (chúng kề nhau theo vòng tròn) → chỉ lấy được nhà 2.

Input: nums = [1, 2, 3, 1]
Output: 4
Giải thích: nhà 1 + nhà 3 = 4.

Input: nums = [1, 2, 3]
Output: 3
~~~

### Ràng buộc
- {{1 <= nums.length <= 100}}
- {{0 <= nums[i] <= 400}}`,
  hints: [
    'Nhà đầu và nhà cuối không thể cùng được chọn — chia bài thành hai bài con tuyến tính: một bài **bỏ nhà cuối**, một bài **bỏ nhà đầu**.',
    'Chạy House Robber thường trên đoạn [0 .. n-2] và đoạn [1 .. n-1], lấy max của hai kết quả.',
    '{{n = 1}} là corner case đặc biệt: hai bài con đều rỗng → trả {{nums[0]}}.'
  ],
  solution: `### Ý tưởng
Ràng buộc vòng tròn duy nhất là "nhà 1 và nhà n không được cùng bị cướp". Loại cả hai trường hợp xung đột bằng cách chạy **hai lượt House Robber tuyến tính**: lượt A trên đoạn {{[0, n-2]}} (bỏ nhà cuối), lượt B trên đoạn {{[1, n-1]}} (bỏ nhà đầu). Đáp án = {{max(A, B)}}. {{n = 1}} thì trả thẳng {{nums[0]}}.

~~~java
class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        if (n == 1) return nums[0];   // truong hop rieng
        return Math.max(linear(nums, 0, n - 2), linear(nums, 1, n - 1));
    }

    // house robber tuyen tinh tren doan [lo, hi]
    private int linear(int[] nums, int lo, int hi) {
        int prev2 = 0, prev1 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- {{n = 2}}: hai bài con là [nums[0]] và [nums[1]] → lấy max — đúng (chỉ cướp được một nhà).
- Đừng cố "gộp" hai bài con vào một DP phức tạp: hai lần chạy tuyến tính O(n) đã tối ưu, code ngắn và ít lỗi hơn nhiều.
- Biến thể hard "cướp tối đa k nhà liên tiếp": cần DP hai chiều {{dp[i][j]}} — nói được hướng này là điểm cộng lớn.

> Senior tip: Mẫu "chia trường hợp vì ràng buộc tròn" còn thấy ở bên ngoài thuật toán: doanh số theo cửa sổ xoay vòng, chọn transaction trong lô có ràng buộc không được lấy cả đầu và cuối. Interviewer quan sát bạn có tự xử lý {{n = 1}} và {{n = 2}} ngay từ đầu để đánh giá mức độ corner-case.`,
  starter: `class Solution {
    public int rob(int[] nums) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 3, () -> new Solution().rob(new int[]{2, 3, 2}));
        run("example2", 4, () -> new Solution().rob(new int[]{1, 2, 3, 1}));
        run("example3", 3, () -> new Solution().rob(new int[]{1, 2, 3}));
        run("single house", 5, () -> new Solution().rob(new int[]{5}));
        run("two houses", 10, () -> new Solution().rob(new int[]{10, 2}));
        run("all equal triple", 10, () -> new Solution().rob(new int[]{10, 10, 10}));
        run("big last wins", 340, () -> new Solution().rob(new int[]{200, 3, 140, 20, 10}));
        run("skip first", 103, () -> new Solution().rob(new int[]{1, 3, 1, 3, 100}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: [
    'Tại sao hai bài con tuyến tính bao trùm mọi trường hợp?',
    'Nếu là đường thẳng (bài I) thì đoạn code nào dùng lại được?'
  ]
},

{
  id: 'algo-104',
  title: 'Minimum Cost to Climb Stairs',
  difficulty: 'easy',
  pattern: 'Fibonacci Numbers (DP)',
  tags: ['dp', 'array', 'bytebytego'],
  prompt: `Mỗi bậc cầu thang {{i}} có chi phí {{cost[i]}} — trả khoản phí này khi **bước lên** bậc đó. Từ bậc {{i}} bạn có thể bước lên 1 hoặc 2 bậc. Bạn có thể bắt đầu ở bậc 0 hoặc bậc 1 (miễn phí). "Đỉnh" là vị trí **sau** bậc cuối cùng. Trả về chi phí nhỏ nhất để lên tới đỉnh.

### Ví dụ
~~~text
Input: cost = [10, 15, 20]
Output: 15
Giải thích: bắt đầu ở bậc 1 → trả 15 để bước 2 bậc lên đỉnh.

Input: cost = [1, 100, 1, 1, 1, 100, 1]
Output: 4
Giải thích: bắt đầu ở bậc 0 → 0 → 2 → 4 → 6 → đỉnh, chi phí 1 + 1 + 1 + 1 = 4.

Input: cost = [1, 2]
Output: 1
~~~

### Ràng buộc
- {{2 <= cost.length <= 1000}}
- {{0 <= cost[i] <= 999}}`,
  hints: [
    'Muốn đứng ở bậc {{i}} thì bước cuối cùng đến từ {{i-1}} hoặc {{i-2}} — quan hệ Fibonacci.',
    '{{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}}: chi phí nhỏ nhất để **đứng được** trên bậc {{i}}.',
    'Đỉnh nằm sau bậc cuối: đáp án là {{min(dp[n-1], dp[n-2])}} — hoặc đặt {{cost}} thêm 0 ở cuối cho gọn.'
  ],
  solution: `### Ý tưởng
{{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}} — chi phí nhỏ nhất để đứng trên bậc {{i}}. Đỉnh là vị trí sau cùng nên chỉ cần bước từ {{n-1}} hoặc {{n-2}}: đáp án {{min(dp[n-1], dp[n-2])}}. Gộp hai biến như House Robber.

~~~java
class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int prev2 = cost[0];   // chi phi nho nhat de dung tren bac i-2
        int prev1 = cost[1];   // de dung tren bac i-1
        for (int i = 2; i < cost.length; i++) {
            int cur = cost[i] + Math.min(prev1, prev2);
            prev2 = prev1;
            prev1 = cur;
        }
        return Math.min(prev1, prev2);   // dinh co the tu n-1 hoac n-2 buoc len
    }
}
~~~

### Lưu ý khi phỏng vấn
- House Robber là "tối đa hoá giá trị khi không lấy kề"; bài này là "tối thiểu hoá chi phí khi đi 1-2 bước" — cùng khung {{dp[i] = f(dp[i-1], dp[i-2])}}, chỉ khác max/min và điều kiện gốc.
- Variant "thêm bậc đắt đỏ bất kỳ" (insert stairs): chỉ cần thêm phần tử và chạy lại DP — hỏi interviewer trước khi code.
- {{cost.length = 2}}: vòng lặp không chạy, trả {{min(cost[0], cost[1])}} — đúng.

> Senior tip: Bài này thuộc nhóm "Fibonacci numbers" của ByteByteGo — khi thấy "đi 1 hoặc 2 bước", hãy gọi ngay {{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}} trong đầu rồi mới hỏi chi tiết đề. Đánh giá senior nằm ở chỗ bạn **nhận ra pattern trong 10 giây**, không phải ở việc viết vòng lặp.`,
  starter: `class Solution {
    public int minCostClimbingStairs(int[] cost) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 15, () -> new Solution().minCostClimbingStairs(new int[]{10, 15, 20}));
        run("example2", 4, () -> new Solution().minCostClimbingStairs(new int[]{1, 100, 1, 1, 1, 100, 1}));
        run("two steps", 1, () -> new Solution().minCostClimbingStairs(new int[]{1, 2}));
        run("both zero", 0, () -> new Solution().minCostClimbingStairs(new int[]{0, 0}));
        run("decreasing", 3, () -> new Solution().minCostClimbingStairs(new int[]{5, 1, 1, 1, 1, 1}));
        run("hundred zeros", 0, () -> {
            int[] cost = new int[100];
            return new Solution().minCostClimbingStairs(cost);
        });
        run("big last", 1, () -> new Solution().minCostClimbingStairs(new int[]{1, 100}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: [
    'So sánh công thức với House Robber: giống và khác ở đâu?',
    'Nếu chi phí âm được phép thì thuật toán có còn đúng không?'
  ]
},
{
  id: 'algo-105',
  title: 'Decode Ways',
  difficulty: 'medium',
  pattern: 'Fibonacci Numbers (DP)',
  tags: ['dp', 'string', 'bytebytego'],
  prompt: `Một thông điệp gồm các chữ số {{A=1, B=2, ..., Z=26}} được mã hoá thành chuỗi {{s}} gồm các chữ số. Đếm số **cách giải mã** toàn bộ chuỗi thành chữ cái. Chữ số {{'0'}} không có mã riêng — chỉ hợp lệ khi nằm trong cặp {{10}} hoặc {{20}}.

### Ví dụ
~~~text
Input: s = "226"
Output: 3
Giải thích: "BZ" (2, 26), "VF" (22, 6), "BBF" (2, 2, 6).

Input: s = "06"
Output: 0
Giải thích: "0" không phải mã hợp lệ, "06" cũng không.

Input: s = "12"
Output: 2
Giải thích: "AB" (1, 2) và "L" (12).
~~~

### Ràng buộc
- {{1 <= s.length <= 100}}
- {{s}} chỉ gồm chữ số {{0-9}}.`,
  hints: [
    'Ký tự cuối có thể được giải mã bằng **một chữ số** {{s[n-1]}} (nếu khác 0) hoặc **hai chữ số** {{s[n-2..n-1]}} (nếu trong đoạn 10..26).',
    '{{dp[i]}} = số cách giải mã {{s[0..i]}}. {{dp[i] = (s[i] != 0 ? dp[i-1] : 0) + (10 <= s[i-1..i] <= 26 ? dp[i-2] : 0)}}.',
    'Chuỗi rỗng có 1 cách giải mã ({{dp[-1] = 1}}) — đó là lý do {{dp[0] = 1}} khi {{s[0] != 0}}. Gặp chuỗi bất khả thi giữa chừng ({{dp[i] = 0}}) thì dừng sớm.'
  ],
  solution: `### Ý tưởng
Quyết định ở cuối chuỗi: tách 1 chữ số hay 2 chữ số. {{dp[i]}} = số cách giải mã đoạn đầu dài {{i+1}}. Thêm hai điều kiện: chữ số cuối khác {{0}} mới tách được 1; cặp hai chữ số phải trong [10, 26] mới tách được 2. Duyệt tăng dần, gộp còn hai biến.

~~~java
class Solution {
    public int numDecodings(String s) {
        if (s.isEmpty() || s.charAt(0) == '0') return 0;
        int prev2 = 1;   // so cach cua doan trong (truoc i-1)
        int prev1 = 1;   // so cach cua s[0]
        for (int i = 1; i < s.length(); i++) {
            int cur = 0;
            if (s.charAt(i) != '0') cur += prev1;   // lay mot chu so rieng
            int two = (s.charAt(i - 1) - '0') * 10 + (s.charAt(i) - '0');
            if (two >= 10 && two <= 26) cur += prev2;   // lay cap 2 chu so
            prev2 = prev1;
            prev1 = cur;
            if (cur == 0) return 0;   // het cach giai ma, dung som
        }
        return prev1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cạm bẫy {{'0'}}: {{s = "30"}} → 0; {{s = "101"}} → 1 (chỉ "10, 1"); {{s = "100"}} → 0. Test kỹ mọi cặp có 0.
- {{s = "0"}} → 0, {{s = "1..9"}} → 1 — kiểm tra đầu vào trước vòng lặp.
- Bài này là Fibonacci "có điều kiện": nếu mọi cặp 10..26 và mọi chữ số đều hợp lệ thì kết quả đúng bằng số Fibonacci tương ứng; ràng buộc 0 làm gãy chuỗi — {{dp}} là công cụ theo dõi chỗ gãy.

> Senior tip: Decode ways phỏng vấn kỹ năng xử lý edge case (0, 00, 10, 20, 30) và ability suy luận công thức từ mô tả. Trong production, logic giải mã như thế này thường chạy trên log stream hàng triệu dòng mỗi phút — người giỏi sẽ nói luôn: O(n) single-pass là đủ, đừng build table nếu chỉ cần một kết quả.`,
  starter: `class Solution {
    public int numDecodings(String s) {
        
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    public static void main(String[] args) {
        run("example1", 3, () -> new Solution().numDecodings("226"));
        run("leading zero pair", 0, () -> new Solution().numDecodings("06"));
        run("example3", 2, () -> new Solution().numDecodings("12"));
        run("twenty-seven", 1, () -> new Solution().numDecodings("27"));
        run("single zero", 0, () -> new Solution().numDecodings("0"));
        run("ten", 1, () -> new Solution().numDecodings("10"));
        run("one zero one", 1, () -> new Solution().numDecodings("101"));
        run("mid zero kills", 2, () -> new Solution().numDecodings("11106"));
        run("twenty one zero one", 1, () -> new Solution().numDecodings("2101"));
        run("single digit", 1, () -> new Solution().numDecodings("1"));
        run("thirty", 0, () -> new Solution().numDecodings("30"));
        run("five ones", 8, () -> new Solution().numDecodings("11111"));
        run("twenty ones", 10946, () -> new Solution().numDecodings("11111111111111111111"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: [
    'Nếu bài yêu cầu IN ra một cách giải mã thay vì đếm thì làm sao?',
    'Biến thể: chữ số 0 được phép ánh xạ thành ký tự khác thì công thức đổi thế nào?'
  ]
}

);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-106',
  title: 'Clone Graph',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['graph', 'dfs', 'bfs', 'hashmap', 'bytebytego'],
  prompt: `Nhân bản đồ thị vô hướng liên thông. Mỗi node có {{val}} và danh sách {{neighbors}}. Trả về node tương ứng với node gốc; phải là **bản sao sâu**, không dùng chung tham chiếu với đồ thị gốc.

### Ví dụ
~~~text
Input: adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
~~~

### Ràng buộc
- {{1 <= n <= 100}}
- {{1 <= Node.val <= 100}}
- Không có cạnh tự lặp, không có cạnh song song.

> {{Node}} đã được định nghĩa sẵn: class Node với trường {{val}} (int) và {{neighbors}} (List<Node>); constructor {{Node(int val)}} khởi tạo {{neighbors}} rỗng.`,
  hints: [
    'Khi gặp một node đã nhân bản rồi, trả về bản sao đó để tránh lặp vô hạn và giữ tính liên thông.',
    'Dùng {{HashMap<Node, Node>}} ánh xạ node gốc -> node bản sao. DFS/BFS đều được.',
    'Nhân bản node trước, rồi mới duyệt neighbors; nếu làm ngược, đồ thị có chu trình sẽ đệ quy vô hạn.'
  ],
  solution: `### Ý tưởng
Duyệt đồ thị gốc, với mỗi node tạo node mới và lưu vào map. Khi gặp node đã có trong map, trả về bản sao tương ứng. Nhờ map, mỗi node chỉ tạo một lần, và chu trình không gây đệ quy vô hạn.

~~~java
class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Map<Node, Node> map = new HashMap<>();
        return dfs(node, map);
    }

    private Node dfs(Node node, Map<Node, Node> map) {
        Node clone = map.get(node);
        if (clone != null) return clone;
        clone = new Node(node.val);
        map.put(node, clone);
        for (Node nb : node.neighbors) {
            clone.neighbors.add(dfs(nb, map));
        }
        return clone;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Hỏi rõ có được sửa đồ thị gốc không (ở đây không sửa).
- BFS cũng làm được: queue + map; hữu ích khi đồ thị rất sâu và DFS có nguy cơ stack overflow.
- Kiểm tra deep copy: mọi node bản sao phải khác tham chiếu với node gốc.

> Senior tip: Nhân bản đồ thị là bài kiểm tra khả năng xử lý chu trình và trạng thái đã thăm. Map từ node gốc sang node sao vừa làm visited, vừa đảm bảo chia sẻ đúng tham chiếu trong bản sao.`,
  starter: "class Solution {\n    public Node cloneGraph(Node node) {\n        \n    }\n}",
  tests: `
class Node { public int val; public List<Node> neighbors; public Node(int v){val=v;neighbors=new ArrayList<>();} }
public class Main {
 static int passed=0,total=0;
 static void runSteps(String n, Runnable r){ total++; try{r.run();passed++;System.out.println("PASS "+n);} catch(Throwable t){System.out.println("FAIL "+n+": threw "+t);}}
 static Node build(int[][] adj){ if(adj.length==0) return null; Node[] ns=new Node[adj.length]; for(int i=0;i<adj.length;i++) ns[i]=new Node(i+1); for(int i=0;i<adj.length;i++) for(int v:adj[i]) ns[i].neighbors.add(ns[v-1]); return ns[0];}
 static boolean deep(Node o,Node c){ if(o==null||c==null) return o==c; Map<Integer,Node> mo=new HashMap<>(),mc=new HashMap<>(); Queue<Node> qo=new LinkedList<>(),qc=new LinkedList<>(); mo.put(o.val,o);qo.add(o); mc.put(c.val,c);qc.add(c); while(!qo.isEmpty()){ Node a=qo.poll(),b=qc.poll(); if(a==b) return false; for(Node n:a.neighbors) if(!mo.containsKey(n.val)){mo.put(n.val,n);qo.add(n);} for(Node n:b.neighbors) if(!mc.containsKey(n.val)){mc.put(n.val,n);qc.add(n);} } return true;}
 static boolean eq(Node a,Node b){ if(a==null&&b==null) return true; if(a==null||b==null) return false; Map<Integer,Node> ma=new HashMap<>(),mb=new HashMap<>(); Queue<Node> qa=new LinkedList<>(),qb=new LinkedList<>(); ma.put(a.val,a);qa.add(a); mb.put(b.val,b);qb.add(b); while(!qa.isEmpty()){ Node x=qa.poll(),y=qb.poll(); if(x.val!=y.val||x.neighbors.size()!=y.neighbors.size()) return false; List<Integer> xn=new ArrayList<>(),yn=new ArrayList<>(); for(Node n:x.neighbors) xn.add(n.val); for(Node n:y.neighbors) yn.add(n.val); Collections.sort(xn);Collections.sort(yn); if(!xn.equals(yn)) return false; for(Node n:x.neighbors) if(!ma.containsKey(n.val)){ma.put(n.val,n);qa.add(n);} for(Node n:y.neighbors) if(!mb.containsKey(n.val)){mb.put(n.val,n);qb.add(n);} } return ma.size()==mb.size();}
 public static void main(String[] args){
   runSteps("null", ()->{ if(new Solution().cloneGraph(null)!=null) throw new AssertionError("x");});
   int[][] a={{2,4},{1,3},{2,4},{1,3}}; Node o=build(a); Node c=new Solution().cloneGraph(o);
   runSteps("example", ()->{ if(!deep(o,c)||!eq(o,c)) throw new AssertionError("x");});
   Node s=new Node(1); Node cs=new Solution().cloneGraph(s);
   runSteps("single", ()->{ if(cs==s||cs.val!=1||!cs.neighbors.isEmpty()) throw new AssertionError("x");});
   int[][] b={{2},{1}}; Node o2=build(b); Node c2=new Solution().cloneGraph(o2);
   runSteps("two", ()->{ if(!deep(o2,c2)||!eq(o2,c2)) throw new AssertionError("x");});
   System.out.println("RESULT "+passed+"/"+total);
 } }
`,
  complexity: 'Time O(V + E), Space O(V)',
  follow: ['BFS nhân bản khác DFS ở điểm nào?', 'Làm sao nhân bản đồ thị có hướng và đồ thị rời rạc?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-107',
  title: 'Pacific Atlantic Water Flow',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['matrix', 'bfs', 'dfs', 'bytebytego'],
  prompt: `Cho ma trận {{heights}} kích thước {{m x n}}. Nước chảy từ ô cao hơn hoặc bằng sang ô thấp hơn hoặc bằng (4 hướng). Thái Bình Dương tiếp giáp biên trên và biên trái; Đại Tây Dương tiếp giáp biên dưới và biên phải. Trả về danh sách tọa độ {{[r, c]}} của các ô mà nước từ đó có thể chảy ra **cả hai** đại dương.

### Ví dụ
~~~text
Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
~~~

### Ràng buộc
- {{1 <= m, n <= 200}}
- {{0 <= heights[r][c] <= 10^5}}`,
  hints: [
    'Thay vì từ mỗi ô chảy xuống (tốn O(mn * mn)), hãy đảo ngược: từ đại dương chảy vào trong.',
    'Nước chảy ngược nghĩa là từ ô thấp sang ô cao hơn hoặc bằng.',
    'Tính tập ô chạm Thái Bình Dương và tập ô chạm Đại Tây Dương, lấy giao.'
  ],
  solution: `### Ý tưởng
Đảo ngược hướng chảy: từ các ô biên thuộc mỗi đại dương, BFS vào trong theo điều kiện ô kế tiếp có độ cao >= ô hiện tại. Giao của hai tập kết quả là các ô chảy được ra cả hai đại dương.

~~~java
class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        List<List<Integer>> res = new ArrayList<>();
        if (heights == null || heights.length == 0) return res;
        int m = heights.length, n = heights[0].length;
        boolean[][] pac = new boolean[m][n], atl = new boolean[m][n];
        Queue<int[]> q = new LinkedList<>();
        for (int i = 0; i < m; i++) { q.add(new int[]{i, 0}); pac[i][0] = true; }
        for (int j = 0; j < n; j++) { q.add(new int[]{0, j}); pac[0][j] = true; }
        bfs(heights, q, pac);
        q = new LinkedList<>();
        for (int i = 0; i < m; i++) { q.add(new int[]{i, n - 1}); atl[i][n - 1] = true; }
        for (int j = 0; j < n; j++) { q.add(new int[]{m - 1, j}); atl[m - 1][j] = true; }
        bfs(heights, q, atl);
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (pac[i][j] && atl[i][j]) {
                    List<Integer> c = new ArrayList<>();
                    c.add(i); c.add(j);
                    res.add(c);
                }
        return res;
    }
    private void bfs(int[][] h, Queue<int[]> q, boolean[][] vis) {
        int m = h.length, n = h[0].length;
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            for (int d = 0; d < 4; d++) {
                int nr = cur[0] + dr[d], nc = cur[1] + dc[d];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                if (vis[nr][nc]) continue;
                if (h[nr][nc] >= h[cur[0]][cur[1]]) {
                    vis[nr][nc] = true;
                    q.add(new int[]{nr, nc});
                }
            }
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- DFS đệ quy cũng được; BFS tránh stack overflow với lưới lớn.
- Kết quả theo thứ tự row-major.

> Senior tip: Khi bài hỏi "từ đâu có thể đạt tới biên", hãy nghĩ đến BFS ngược từ biên — giảm độ phức tạp từ O((mn)^2) xuống O(mn).`,
  starter: "class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static List<List<Integer>> L(int[]... rows){ List<List<Integer>> r=new ArrayList<>(); for(int[] row:rows){ List<Integer> c=new ArrayList<>(); for(int x:row) c.add(x); r.add(c);} return r;}
 public static void main(String[] args){
   int[][] h1={{1,2,2,3,5},{3,2,3,4,4},{2,4,5,3,1},{6,7,1,4,5},{5,1,1,2,4}};
   List<List<Integer>> exp1=L(new int[]{0,4},new int[]{1,3},new int[]{1,4},new int[]{2,2},new int[]{3,0},new int[]{3,1},new int[]{4,0});
   total++; try{ if(Objects.deepEquals(exp1,new Solution().pacificAtlantic(h1))){passed++;System.out.println("PASS example");} else System.out.println("FAIL example");} catch(Throwable t){System.out.println("FAIL example: threw "+t);}
   int[][] h2={{1}}; total++; try{ if(Objects.deepEquals(L(new int[]{0,0}),new Solution().pacificAtlantic(h2))){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");} catch(Throwable t){System.out.println("FAIL single: threw "+t);}
   int[][] h3={{3,3,3},{3,3,3},{3,3,3}}; List<List<Integer>> exp3=new ArrayList<>(); for(int i=0;i<3;i++) for(int j=0;j<3;j++){List<Integer> c=new ArrayList<>();c.add(i);c.add(j);exp3.add(c);}
   total++; try{ if(Objects.deepEquals(exp3,new Solution().pacificAtlantic(h3))){passed++;System.out.println("PASS flat");} else System.out.println("FAIL flat");} catch(Throwable t){System.out.println("FAIL flat: threw "+t);}
   total++; try{ if(Objects.deepEquals(new ArrayList<>(),new Solution().pacificAtlantic(new int[][]{}))){passed++;System.out.println("PASS empty");} else System.out.println("FAIL empty");} catch(Throwable t){System.out.println("FAIL empty: threw "+t);}
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(m * n), Space O(m * n)',
  follow: ['DFS đệ quy có rủi ro gì với lưới 200x200?', 'Có thể giải bằng Union-Find không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-108',
  title: 'Rotting Oranges',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['matrix', 'bfs', 'queue', 'bytebytego'],
  prompt: `Cho lưới {{grid}}: {{0}} = ô trống, {{1}} = cam tươi, {{2}} = cam thối. Mỗi phút, cam thối làm thối các cam tươi kề cạnh (4 hướng). Trả về số phút tối thiểu để tất cả cam thối; nếu có cam tươi không thể thối thì trả về {{-1}}. Nếu không có cam tươi ban đầu thì trả về {{0}}.

### Ví dụ
~~~text
Input: grid = [[2,1,1],[1,1,0],[0,1,1]]
Output: 4

Input: grid = [[2,1,1],[0,1,1],[1,0,1]]
Output: -1
~~~

### Ràng buộc
- {{1 <= m, n <= 10}}
- {{grid[i][j]}} ∈ {{0, 1, 2}}`,
  hints: [
    'Nhiều nguồn thối cùng lúc -> multi-source BFS.',
    'Ban đầu đưa tất cả cam thối vào queue, rồi BFS theo từng "lớp" (level).',
    'Sau BFS, nếu còn cam tươi (1) thì trả -1.'
  ],
  solution: `### Ý tưởng
Multi-source BFS: enqueue tất cả cam thối ban đầu. Mỗi level của BFS tương ứng một phút. Sau khi BFS kết thúc, nếu còn cam tươi thì trả -1.

~~~java
class Solution {
    public int orangesRotting(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        Queue<int[]> q = new LinkedList<>();
        int fresh = 0;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) q.add(new int[]{i, j});
                else if (grid[i][j] == 1) fresh++;
            }
        if (fresh == 0) return 0;
        int minutes = 0;
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        while (!q.isEmpty() && fresh > 0) {
            int size = q.size();
            for (int s = 0; s < size; s++) {
                int[] cur = q.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = cur[0] + dr[d], nc = cur[1] + dc[d];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                    if (grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;
                    fresh--;
                    q.add(new int[]{nr, nc});
                }
            }
            minutes++;
        }
        return fresh == 0 ? minutes : -1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- BFS theo level (đếm size queue) để đo phút; không dùng visited riêng vì đổi 1->2 đã là visited.
- Nếu input không được sửa, dùng mảng visited.

> Senior tip: Multi-source BFS là mẫu chuẩn cho "lan truyền theo thời gian" (fire, infection, signal). Khởi tạo queue với mọi nguồn ban đầu là chìa khóa.`,
  starter: "class Solution {\n    public int orangesRotting(int[][] grid) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static int[][] copy(int[][] g){ int[][] r=new int[g.length][]; for(int i=0;i<g.length;i++) r[i]=g[i].clone(); return r;}
 public static void main(String[] args){
   total++; try{ if(Objects.deepEquals(4,new Solution().orangesRotting(copy(new int[][]{{2,1,1},{1,1,0},{0,1,1}})))){passed++;System.out.println("PASS example");} else System.out.println("FAIL example");} catch(Throwable t){System.out.println("FAIL example: threw "+t);}
   total++; try{ if(Objects.deepEquals(-1,new Solution().orangesRotting(copy(new int[][]{{2,1,1},{0,1,1},{1,0,1}})))){passed++;System.out.println("PASS impossible");} else System.out.println("FAIL impossible");} catch(Throwable t){System.out.println("FAIL impossible: threw "+t);}
   total++; try{ if(Objects.deepEquals(0,new Solution().orangesRotting(copy(new int[][]{{0,2},{2,0}})))){passed++;System.out.println("PASS nofresh");} else System.out.println("FAIL nofresh");} catch(Throwable t){System.out.println("FAIL nofresh: threw "+t);}
   total++; try{ if(Objects.deepEquals(-1,new Solution().orangesRotting(copy(new int[][]{{1,1},{1,1}})))){passed++;System.out.println("PASS allfresh");} else System.out.println("FAIL allfresh");} catch(Throwable t){System.out.println("FAIL allfresh: threw "+t);}
   total++; try{ if(Objects.deepEquals(0,new Solution().orangesRotting(copy(new int[][]{{2}})))){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");} catch(Throwable t){System.out.println("FAIL single: threw "+t);}
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(m * n), Space O(m * n)',
  follow: ['Nếu có nhiều loại cam với tốc độ thối khác nhau thì sao?', 'Có thể dùng DFS không? Vì sao BFS phù hợp hơn?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-109',
  title: 'Topological Sort of a Directed Graph',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'kahn', 'bytebytego'],
  prompt: `Cho đồ thị có hướng với {{V}} đỉnh (0..V-1) và danh sách cạnh {{edges}} (u -> v). Trả về một thứ tự topo hợp lệ; nếu đồ thị có chu trình thì trả về mảng rỗng.

### Ví dụ
~~~text
Input: V = 4, edges = [[0,1],[1,2],[2,3]]
Output: [0,1,2,3]

Input: V = 4, edges = [[0,1],[1,2],[2,0],[3,3]]
Output: []
~~~

### Ràng buộc
- {{1 <= V <= 10^4}}
- {{0 <= edges.length <= 10^4}}`,
  hints: [
    'Thứ tự topo: mọi cạnh u->v thì u đứng trước v.',
    'Kahn: bắt đầu từ các đỉnh indegree 0, đưa vào queue, xử lý và giảm indegree của hàng xóm.',
    'Nếu số đỉnh đã xuất ra < V thì có chu trình.'
  ],
  solution: `### Ý tưởng
Kahn's algorithm: tính indegree, enqueue các đỉnh indegree 0. Khi pop một đỉnh, thêm vào kết quả và giảm indegree của các đỉnh kề; nếu indegree về 0 thì enqueue. Nếu kết quả đủ V đỉnh thì không có chu trình.

~~~java
class Solution {
    public int[] topoSort(int V, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] indeg = new int[V];
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indeg[e[1]]++;
        }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < V; i++) if (indeg[i] == 0) q.add(i);
        int[] res = new int[V];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            res[idx++] = u;
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) q.add(v);
            }
        }
        if (idx != V) return new int[0];
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- DFS (finish time) cũng cho thứ tự topo; Kahn dễ phát hiện cycle.
- Nhiều thứ tự hợp lệ; test nên kiểm tra tính hợp lệ thay vì so sánh mảng cố định. Ở đây harness kiểm tra indegree constraints.
- Với đồ thị lớn, dùng adjacency list.

> Senior tip: Topo sort là nền tảng cho scheduling, build system, và dependency resolution trong microservices.`,
  starter: "class Solution {\n    public int[] topoSort(int V, int[][] edges) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static boolean valid(int V,int[][] edges,int[] res){
   if(res.length==0){
     // cycle expected? caller decides; here just return true for empty handling separately
     return true;
   }
   if(res.length!=V) return false;
   int[] pos=new int[V];
   for(int i=0;i<V;i++) pos[res[i]]=i;
   for(int[] e:edges) if(pos[e[0]]>=pos[e[1]]) return false;
   // check permutation
   boolean[] seen=new boolean[V];
   for(int x:res){ if(x<0||x>=V||seen[x]) return false; seen[x]=true; }
   for(boolean b:seen) if(!b) return false;
   return true;
 }
 public static void main(String[] args){
   int[][] e1={{0,1},{1,2},{2,3}};
   int[] r1=new Solution().topoSort(4,e1);
   total++; if(r1.length==4 && valid(4,e1,r1)){passed++;System.out.println("PASS chain");} else System.out.println("FAIL chain");
   int[][] e2={{0,1},{1,2},{2,0},{3,3}};
   int[] r2=new Solution().topoSort(4,e2);
   total++; if(r2.length==0){passed++;System.out.println("PASS cycle");} else System.out.println("FAIL cycle");
   int[] r3=new Solution().topoSort(1,new int[][]{});
   total++; if(r3.length==1 && r3[0]==0){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   int[][] e4={{0,1},{0,2},{1,3},{2,3}};
   int[] r4=new Solution().topoSort(4,e4);
   total++; if(r4.length==4 && valid(4,e4,r4)){passed++;System.out.println("PASS diamond");} else System.out.println("FAIL diamond");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(V + E), Space O(V + E)',
  follow: ['DFS topo sort khác Kahn ở điểm nào?', 'Làm sao trả về tất cả thứ tự topo?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-110',
  title: 'Course Schedule II',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'bytebytego'],
  prompt: `Có {{numCourses}} khóa học đánh số 0..numCourses-1. prerequisites[i] = [a, b] nghĩa là để học a phải hoàn thành b. Trả về một thứ tự học hợp lệ; nếu không thể (có chu trình) trả về mảng rỗng.

### Ví dụ
~~~text
Input: numCourses = 2, prerequisites = [[1,0]]
Output: [0,1]

Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: []
~~~

### Ràng buộc
- {{1 <= numCourses <= 2000}}
- {{0 <= prerequisites.length <= 5000}}`,
  hints: [
    'Đây là topo sort trên đồ thị prerequisite -> course.',
    'Kahn: bắt đầu từ các khóa không có prerequisite.',
    'Nếu không đủ khóa học thì có chu trình.'
  ],
  solution: `### Ý tưởng
Xây đồ thị b -> a (b là prerequisite của a). Kahn: enqueue các khóa indegree 0. Kết quả là thứ tự học. Nếu thiếu khóa thì có cycle.

~~~java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] indeg = new int[numCourses];
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);
        int[] res = new int[numCourses];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            res[idx++] = u;
            for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        return idx == numCourses ? res : new int[0];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Có thể dùng DFS + stack finish time.
- Nhiều thứ tự hợp lệ; harness kiểm tra tính hợp lệ.

> Senior tip: Course schedule là ví dụ kinh điển của topo sort trong hệ thống build/deploy.`,
  starter: "class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static boolean valid(int n,int[][] prereq,int[] res){
   if(res.length==0) return false;
   if(res.length!=n) return false;
   int[] pos=new int[n];
   for(int i=0;i<n;i++) pos[res[i]]=i;
   for(int[] p:prereq) if(pos[p[0]]<=pos[p[1]]) return false;
   boolean[] seen=new boolean[n];
   for(int x:res){ if(x<0||x>=n||seen[x]) return false; seen[x]=true;}
   for(boolean b:seen) if(!b) return false;
   return true;
 }
 public static void main(String[] args){
   int[][] p1={{1,0}};
   int[] r1=new Solution().findOrder(2,p1);
   total++; if(valid(2,p1,r1)){passed++;System.out.println("PASS example");} else System.out.println("FAIL example");
   int[][] p2={{1,0},{0,1}};
   int[] r2=new Solution().findOrder(2,p2);
   total++; if(r2.length==0){passed++;System.out.println("PASS cycle");} else System.out.println("FAIL cycle");
   int[] r3=new Solution().findOrder(1,new int[][]{});
   total++; if(r3.length==1 && r3[0]==0){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   int[][] p4={{1,0},{2,0},{3,1},{3,2}};
   int[] r4=new Solution().findOrder(4,p4);
   total++; if(valid(4,p4,r4)){passed++;System.out.println("PASS diamond");} else System.out.println("FAIL diamond");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(V + E), Space O(V + E)',
  follow: ['Nếu có nhiều thứ tự hợp lệ, trả về thứ tự nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-111',
  title: 'Alien Dictionary',
  difficulty: 'hard',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'string', 'bytebytego'],
  prompt: `Cho danh sách {{words}} được sắp xếp theo thứ tự từ điển của một ngôn ngữ ngoài hành tinh. Suy ra thứ tự các ký tự. Trả về chuỗi chứa các ký tự theo thứ tự topo; nếu có nhiều đáp án trả về bất kỳ; nếu dữ liệu không hợp lệ (mâu thuẫn hoặc prefix sai) trả về {{""}}.

### Ví dụ
~~~text
Input: words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"

Input: words = ["z","x","z"]
Output: ""
~~~

### Ràng buộc
- {{1 <= words.length <= 100}}
- {{1 <= words[i].length <= 100}}
- Chỉ gồm chữ cái thường a-z`,
  hints: [
    'So sánh từng cặp từ liên tiếp để suy ra quan hệ thứ tự giữa hai ký tự đầu tiên khác nhau.',
    'Xây đồ thị ký tự và topo sort.',
    'Trường hợp prefix: nếu từ dài hơn đứng trước từ ngắn hơn có cùng prefix thì invalid.'
  ],
  solution: `### Ý tưởng
So sánh các từ liên tiếp, tìm ký tự đầu tiên khác nhau để tạo cạnh. Sau đó Kahn topo sort trên 26 ký tự xuất hiện. Nếu topo sort không đủ số ký tự xuất hiện hoặc phát hiện cycle/prefix invalid thì trả "".

~~~java
class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new HashMap<>();
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words) for (char c : w.toCharArray()) { adj.putIfAbsent(c, new HashSet<>()); indeg.putIfAbsent(c, 0); }
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int min = Math.min(a.length(), b.length());
            boolean found = false;
            for (int j = 0; j < min; j++) {
                char ca = a.charAt(j), cb = b.charAt(j);
                if (ca != cb) {
                    if (adj.get(ca).add(cb)) indeg.put(cb, indeg.get(cb) + 1);
                    found = true; break;
                }
            }
            if (!found && a.length() > b.length()) return "";
        }
        Queue<Character> q = new LinkedList<>();
        for (char c : indeg.keySet()) if (indeg.get(c) == 0) q.add(c);
        StringBuilder sb = new StringBuilder();
        while (!q.isEmpty()) {
            char u = q.poll();
            sb.append(u);
            for (char v : adj.get(u)) { int nv = indeg.get(v) - 1; indeg.put(v, nv); if (nv == 0) q.add(v); }
        }
        return sb.length() == indeg.size() ? sb.toString() : "";
    }
}
~~~

### Lưu ý khi phỏng vấn
- Prefix invalid là bẫy thường gặp.
- Nếu chỉ có một từ, mọi ký tự xuất hiện đều hợp lệ theo thứ tự bất kỳ.
- Có thể trả bất kỳ thứ tự hợp lệ nào.

> Senior tip: Alien dictionary là bài kiểm tra khả năng kết hợp string processing với graph algorithm.`,
  starter: "class Solution {\n    public String alienOrder(String[] words) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static boolean follows(String[] words,String order){
   Map<Character,Integer> pos=new HashMap<>();
   for(int i=0;i<order.length();i++) pos.put(order.charAt(i),i);
   for(int i=0;i+1<words.length;i++){
     String a=words[i],b=words[i+1];
     int min=Math.min(a.length(),b.length());
     int j=0;
     while(j<min && a.charAt(j)==b.charAt(j)) j++;
     if(j==min){ if(a.length()>b.length()) return false; }
     else {
       char ca=a.charAt(j), cb=b.charAt(j);
       if(!pos.containsKey(ca) || !pos.containsKey(cb)) return false;
       if(pos.get(ca)>=pos.get(cb)) return false;
     }
   }
   // all chars in words must appear in order
   Set<Character> chars=new HashSet<>();
   for(String w:words) for(char c:w.toCharArray()) chars.add(c);
   for(char c:chars) if(!pos.containsKey(c)) return false;
   return true;
 }
 public static void main(String[] args){
   String[] w1={"wrt","wrf","er","ett","rftt"};
   String r1=new Solution().alienOrder(w1);
   total++; if(!r1.isEmpty() && follows(w1,r1)){passed++;System.out.println("PASS example");} else System.out.println("FAIL example: "+r1);
   String[] w2={"z","x","z"};
   total++; if(new Solution().alienOrder(w2).isEmpty()){passed++;System.out.println("PASS cycle");} else System.out.println("FAIL cycle");
   String[] w3={"abc","ab"};
   total++; if(new Solution().alienOrder(w3).isEmpty()){passed++;System.out.println("PASS prefix");} else System.out.println("FAIL prefix");
   String[] w4={"z"};
   String r4=new Solution().alienOrder(w4);
   total++; if(r4.length()==1 && r4.equals("z")){passed++;System.out.println("PASS single");} else System.out.println("FAIL single: "+r4);
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(V + E) over characters, Space O(V + E)',
  follow: ['Nếu có nhiều ký tự không xuất hiện trong quan hệ thì đặt ở đâu?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-112',
  title: 'Sequence Reconstruction',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'bytebytego'],
  prompt: `Cho mảng {{org}} (một hoán vị của 1..n) và danh sách {{seqs}}. Kiểm tra xem {{org}} có phải là **thứ tự topo duy nhất** có thể suy ra từ {{seqs}} hay không (mỗi seq cho quan hệ thứ tự liên tiếp).

### Ví dụ
~~~text
Input: org = [1,2,3], seqs = [[1,2],[1,3]]
Output: false

Input: org = [1,2,3], seqs = [[1,2],[2,3]]
Output: true
~~~

### Ràng buộc
- {{1 <= n <= 10^4}}
- {{seqs[i].length >= 1}}`,
  hints: [
    'Xây đồ thị từ các cặp liên tiếp trong mỗi seq.',
    'Unique topo order nghĩa là tại mỗi bước chỉ có đúng một đỉnh indegree 0.',
    'Cũng phải kiểm tra org chứa đúng các phần tử và seqs không mâu thuẫn.'
  ],
  solution: `### Ý tưởng
Xây đồ thị từ các cặp liên tiếp trong seqs. Kahn: tại mỗi bước nếu queue có nhiều hơn một phần tử thì thứ tự không duy nhất. So sánh kết quả với org.

~~~java
class Solution {
    public boolean sequenceReconstruction(int[] org, int[][] seqs) {
        int n = org.length;
        Set<Integer> set = new HashSet<>();
        for (int x : org) set.add(x);
        List<Set<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new HashSet<>());
        int[] indeg = new int[n + 1];
        boolean[] seen = new boolean[n + 1];
        for (int[] seq : seqs) {
            for (int x : seq) {
                if (x < 1 || x > n || !set.contains(x)) return false;
                seen[x] = true;
            }
            for (int i = 0; i + 1 < seq.length; i++) {
                int u = seq[i], v = seq[i + 1];
                if (u == v) continue;
                if (adj.get(u).add(v)) indeg[v]++;
            }
        }
        for (int i = 1; i <= n; i++) if (!seen[i]) return false;
        Queue<Integer> q = new LinkedList<>();
        for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.add(i);
        int idx = 0;
        while (!q.isEmpty()) {
            if (q.size() > 1) return false;
            int u = q.poll();
            if (idx >= n || org[idx] != u) return false;
            idx++;
            for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        return idx == n;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Unique topo order là điều kiện quan trọng trong reconstruction.
- Cần validate seqs chứa đúng tập phần tử của org.

> Senior tip: Bài này thường xuất hiện trong phỏng vấn về dependency ordering với ràng buộc duy nhất.`,
  starter: "class Solution {\n    public boolean sequenceReconstruction(int[] org, int[][] seqs) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; try{ if(new Solution().sequenceReconstruction(new int[]{1,2,3}, new int[][]{{1,2},{2,3}})){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");} catch(Throwable t){System.out.println("FAIL basic: threw "+t);}
   total++; try{ if(!new Solution().sequenceReconstruction(new int[]{1,2,3}, new int[][]{{1,2},{1,3}})){passed++;System.out.println("PASS notunique");} else System.out.println("FAIL notunique");} catch(Throwable t){System.out.println("FAIL notunique: threw "+t);}
   total++; try{ if(!new Solution().sequenceReconstruction(new int[]{1,2,3}, new int[][]{{1,2},{2,3},{3,1}})){passed++;System.out.println("PASS cycle");} else System.out.println("FAIL cycle");} catch(Throwable t){System.out.println("FAIL cycle: threw "+t);}
   total++; try{ if(!new Solution().sequenceReconstruction(new int[]{1,2,3}, new int[][]{{1,2}})){passed++;System.out.println("PASS missing");} else System.out.println("FAIL missing");} catch(Throwable t){System.out.println("FAIL missing: threw "+t);}
   total++; try{ if(new Solution().sequenceReconstruction(new int[]{1}, new int[][]{{1}})){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");} catch(Throwable t){System.out.println("FAIL single: threw "+t);}
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n + E), Space O(n + E)',
  follow: ['Nếu seqs chứa phần tử ngoài org thì xử lý thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-113',
  title: 'Implement Trie (Prefix Tree)',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'design', 'string', 'bytebytego'],
  prompt: `Thiết kế cấu trúc dữ liệu Trie hỗ trợ:
- {{insert(word)}}: chèn từ.
- {{search(word)}}: trả về true nếu từ đã được chèn.
- {{startsWith(prefix)}}: trả về true nếu có từ nào đó bắt đầu bằng prefix.

### Ví dụ
~~~text
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // true
trie.search("app");     // false
trie.startsWith("app"); // true
trie.insert("app");
trie.search("app");     // true
~~~

### Ràng buộc
- {{1 <= word.length, prefix.length <= 2000}}
- Chỉ gồm chữ cái thường a-z`,
  hints: [
    'Mỗi node có mảng con của kích thước 26 và cờ isEnd.',
    'insert: duyệt/tạo node theo từng ký tự, đánh dấu isEnd ở cuối.',
    'search khác startsWith ở chỗ search yêu cầu isEnd = true.'
  ],
  solution: `### Ý tưởng
Trie node chứa mảng con 26 và cờ kết thúc. insert tạo node theo ký tự; search yêu cầu node cuối tồn tại và isEnd; startsWith chỉ yêu cầu node cuối tồn tại.

~~~java
class Trie {
    private static class Node {
        Trie.Node[] ch = new Trie.Node[26];
        boolean end;
    }
    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (cur.ch[i] == null) cur.ch[i] = new Node();
            cur = cur.ch[i];
        }
        cur.end = true;
    }

    public boolean search(String word) {
        Node cur = find(word);
        return cur != null && cur.end;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private Node find(String s) {
        Node cur = root;
        for (char c : s.toCharArray()) {
            int i = c - 'a';
            if (cur.ch[i] == null) return null;
            cur = cur.ch[i];
        }
        return cur;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Có thể dùng HashMap<Character, Node> để hỗ trợ unicode.
- Delete word: cần xóa node nếu không còn con và không phải end của từ khác.
- Space: tổng độ dài các từ.

> Senior tip: Trie là nền tảng cho autocomplete, spell check và routing table.`,
  starter: "class Trie {\n    public Trie() {\n        \n    }\n    public void insert(String word) {\n        \n    }\n    public boolean search(String word) {\n        \n    }\n    public boolean startsWith(String prefix) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   Trie t=new Trie();
   t.insert("apple");
   total++; if(t.search("apple")){passed++;System.out.println("PASS search1");} else System.out.println("FAIL search1");
   total++; if(!t.search("app")){passed++;System.out.println("PASS search2");} else System.out.println("FAIL search2");
   total++; if(t.startsWith("app")){passed++;System.out.println("PASS prefix1");} else System.out.println("FAIL prefix1");
   t.insert("app");
   total++; if(t.search("app")){passed++;System.out.println("PASS search3");} else System.out.println("FAIL search3");
   total++; if(!t.search("appl")){passed++;System.out.println("PASS search4");} else System.out.println("FAIL search4");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(L) per operation, Space O(total chars)',
  follow: ['Làm sao implement delete trong Trie?', 'So sánh Trie với HashMap prefix.']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-114',
  title: 'Word Search II',
  difficulty: 'hard',
  pattern: 'Tries',
  tags: ['backtracking', 'trie', 'matrix', 'bytebytego'],
  prompt: `Cho bảng chữ cái {{board}} kích thước {{m x n}} và danh sách {{words}}. Tìm tất cả từ trong {{words}} có thể được tạo thành bằng cách đi trên bảng theo 4 hướng, mỗi ô chỉ dùng một lần. Trả về danh sách các từ tìm được (không trùng).

### Ví dụ
~~~text
Input: board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]
~~~

### Ràng buộc
- {{1 <= m, n <= 12}}
- {{1 <= words.length <= 3 * 10^4}}
- {{1 <= words[i].length <= 10}}`,
  hints: [
    'Dùng Trie để kiểm tra prefix trong khi DFS.',
    'Khi tìm được một từ, xóa nó khỏi Trie để tránh trả trùng.',
    'Pruning: nếu node Trie không còn con thì cắt nhánh DFS.'
  ],
  solution: `### Ý tưởng
Xây Trie từ words. DFS từ mỗi ô, theo Trie. Khi gặp node end, thêm từ vào kết quả và xóa end. Loại bỏ nhánh Trie rỗng để prune.

~~~java
class Solution {
    static class TrieNode {
        TrieNode[] ch = new TrieNode[26];
        String word;
    }

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode cur = root;
            for (char c : w.toCharArray()) {
                int i = c - 'a';
                if (cur.ch[i] == null) cur.ch[i] = new TrieNode();
                cur = cur.ch[i];
            }
            cur.word = w;
        }
        List<String> res = new ArrayList<>();
        for (int i = 0; i < board.length; i++)
            for (int j = 0; j < board[0].length; j++)
                dfs(board, i, j, root, res);
        return res;
    }

    private void dfs(char[][] b, int r, int c, TrieNode node, List<String> res) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
        char ch = b[r][c];
        if (ch == '#' || node.ch[ch - 'a'] == null) return;
        TrieNode next = node.ch[ch - 'a'];
        if (next.word != null) { res.add(next.word); next.word = null; }
        b[r][c] = '#';
        dfs(b, r + 1, c, next, res);
        dfs(b, r - 1, c, next, res);
        dfs(b, r, c + 1, next, res);
        dfs(b, r, c - 1, next, res);
        b[r][c] = ch;
        // prune
        boolean empty = true;
        for (TrieNode t : next.ch) if (t != null) { empty = false; break; }
        if (empty && next.word == null) node.ch[ch - 'a'] = null;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu không prune, có thể TLE với board lớn.
- Kết quả có thể sort để deterministic; harness sort.

> Senior tip: Word Search II kết hợp Trie + backtracking, là bài khó điển hình của phỏng vấn senior.`,
  starter: "class Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static List<String> sort(List<String> l){ List<String> r=new ArrayList<>(l); Collections.sort(r); return r;}
 public static void main(String[] args){
   char[][] b1={{'o','a','a','n'},{'e','t','a','e'},{'i','h','k','r'},{'i','f','l','v'}};
   String[] w1={"oath","pea","eat","rain"};
   List<String> exp1=new ArrayList<>(Arrays.asList("eat","oath"));
   List<String> r1=sort(new Solution().findWords(b1,w1));
   total++; if(r1.equals(sort(exp1))){passed++;System.out.println("PASS example");} else System.out.println("FAIL example: "+r1);
   char[][] b2={{'a','b'},{'c','d'}};
   String[] w2={"ab","abcd"};
   List<String> r2=sort(new Solution().findWords(b2,w2));
   total++; if(r2.equals(sort(new ArrayList<>(Arrays.asList("ab"))))){passed++;System.out.println("PASS short");} else System.out.println("FAIL short: "+r2);
   char[][] b3={{'a'}};
   String[] w3={"a","a"};
   List<String> r3=sort(new Solution().findWords(b3,w3));
   total++; if(r3.equals(sort(new ArrayList<>(Arrays.asList("a"))))){passed++;System.out.println("PASS dup");} else System.out.println("FAIL dup: "+r3);
   char[][] b4={{'x'}};
   String[] w4={"y"};
   List<String> r4=new Solution().findWords(b4,w4);
   total++; if(r4.isEmpty()){passed++;System.out.println("PASS none");} else System.out.println("FAIL none: "+r4);
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(m*n*4^L) with pruning, Space O(total chars)',
  follow: ['Tại sao cần xóa từ khỏi Trie sau khi tìm thấy?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-115',
  title: 'Replace Words',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'string', 'bytebytego'],
  prompt: `Trong từ điển {{dictionary}} có các gốc từ. Với câu {{sentence}} (các từ cách nhau bởi khoảng trắng), thay mỗi từ bằng **gốc từ ngắn nhất** là tiền tố của nó; nếu không có gốc từ phù hợp thì giữ nguyên từ.

### Ví dụ
~~~text
Input: dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"
Output: "the cat was rat by the bat"
~~~

### Ràng buộc
- {{1 <= dictionary.length <= 1000}}
- {{1 <= dictionary[i].length <= 100}}
- {{1 <= sentence.length <= 10^6}}`,
  hints: [
    'Dùng Trie chứa các gốc từ.',
    'Với mỗi từ, đi theo Trie cho đến khi gặp node end -> gốc ngắn nhất.',
    'Nếu đi hết mà không gặp end thì giữ nguyên từ.'
  ],
  solution: `### Ý tưởng
Xây Trie từ dictionary. Với mỗi từ trong sentence, duyệt Trie theo ký tự; gặp node end đầu tiên thì đó là gốc ngắn nhất. Nếu không gặp, giữ từ gốc.

~~~java
class Solution {
    static class Node {
        Node[] ch = new Node[26];
        boolean end;
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        Node root = new Node();
        for (String w : dictionary) {
            Node cur = root;
            for (char c : w.toCharArray()) {
                int i = c - 'a';
                if (cur.ch[i] == null) cur.ch[i] = new Node();
                cur = cur.ch[i];
            }
            cur.end = true;
        }
        String[] words = sentence.split(" ", -1);
        StringBuilder sb = new StringBuilder();
        for (int wi = 0; wi < words.length; wi++) {
            if (wi > 0) sb.append(' ');
            String w = words[wi];
            Node cur = root;
            int len = 0;
            boolean found = false;
            for (int j = 0; j < w.length(); j++) {
                int i = w.charAt(j) - 'a';
                if (i < 0 || i >= 26 || cur.ch[i] == null) break;
                cur = cur.ch[i];
                len = j + 1;
                if (cur.end) { found = true; break; }
            }
            sb.append(found ? w.substring(0, len) : w);
        }
        return sb.toString();
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cần xử lý ký tự không phải a-z nếu đề cho phép; ở đây chỉ a-z.
- Từ điển có thể chứa từ trùng.

> Senior tip: Replace words minh họa việc dùng Trie để tìm prefix ngắn nhất hiệu quả.`,
  starter: "class Solution {\n    public String replaceWords(List<String> dictionary, String sentence) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   List<String> d1=Arrays.asList("cat","bat","rat");
   total++; if(new Solution().replaceWords(d1,"the cattle was rattled by the battery").equals("the cat was rat by the bat")){passed++;System.out.println("PASS example");} else System.out.println("FAIL example: "+new Solution().replaceWords(d1,"the cattle was rattled by the battery"));
   List<String> d2=Arrays.asList("a","aa","aaa");
   total++; if(new Solution().replaceWords(d2,"a aa aaa aaaa").equals("a a a a")){passed++;System.out.println("PASS shortest");} else System.out.println("FAIL shortest");
   List<String> d3=Arrays.asList("xyz");
   total++; if(new Solution().replaceWords(d3,"abc def").equals("abc def")){passed++;System.out.println("PASS none");} else System.out.println("FAIL none");
   List<String> d4=Arrays.asList();
   total++; if(new Solution().replaceWords(d4,"hello world").equals("hello world")){passed++;System.out.println("PASS emptydict");} else System.out.println("FAIL emptydict");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(total chars), Space O(total chars)',
  follow: ['Nếu dictionary có từ trùng thì xử lý thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-116',
  title: 'Search Suggestions System',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'binary-search', 'string', 'bytebytego'],
  prompt: `Cho mảng {{products}} và chuỗi {{searchWord}}. Sau mỗi ký tự gõ, trả về tối đa 3 sản phẩm có prefix khớp, sắp xếp từ điển. Kết quả là danh sách các danh sách (mỗi bước một danh sách).

### Ví dụ
~~~text
Input: products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"
Output: [["mobile","moneypot","monitor"],["mobile","moneypot","monitor"],["mouse","mousepad"],["mouse","mousepad"],["mouse","mousepad"]]
~~~

### Ràng buộc
- {{1 <= products.length <= 1000}}
- {{1 <= products[i].length <= 3000}}`,
  hints: [
    'Sort products rồi dùng binary search để tìm prefix.',
    'Hoặc dùng Trie, mỗi node lưu danh sách (tối đa 3) các từ.',
    'Trie cho phép trả kết quả theo prefix tăng dần.'
  ],
  solution: `### Ý tưởng
Sort products. Với mỗi prefix của searchWord, binary search lower_bound để tìm vị trí bắt đầu; lấy tối đa 3 từ liên tiếp có cùng prefix. Đơn giản và đủ nhanh.

~~~java
class Solution {
    public List<List<String>> suggestedProducts(String[] products, String searchWord) {
        Arrays.sort(products);
        List<List<String>> res = new ArrayList<>();
        String prefix = "";
        int start = 0;
        for (char c : searchWord.toCharArray()) {
            prefix += c;
            start = lowerBound(products, prefix, start);
            List<String> cur = new ArrayList<>();
            for (int i = start; i < products.length && i < start + 3; i++) {
                if (products[i].startsWith(prefix)) cur.add(products[i]);
                else break;
            }
            res.add(cur);
        }
        return res;
    }

    private int lowerBound(String[] a, String prefix, int from) {
        int lo = from, hi = a.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid].compareTo(prefix) < 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu dùng Trie, mỗi node lưu top 3 để trả O(L).
- Binary search approach O(n log n + L log n).

> Senior tip: Search suggestions là bài kiểm tra khả năng cân bằng giữa preprocessing và query.`,
  starter: "class Solution {\n    public List<List<String>> suggestedProducts(String[] products, String searchWord) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static List<List<String>> L(String[]... rows){ List<List<String>> r=new ArrayList<>(); for(String[] row:rows){ List<String> c=new ArrayList<>(Arrays.asList(row)); r.add(c);} return r;}
 public static void main(String[] args){
   String[] p1={"mobile","mouse","moneypot","monitor","mousepad"};
   List<List<String>> exp1=L(new String[]{"mobile","moneypot","monitor"},new String[]{"mobile","moneypot","monitor"},new String[]{"mouse","mousepad"},new String[]{"mouse","mousepad"},new String[]{"mouse","mousepad"});
   List<List<String>> r1=new Solution().suggestedProducts(p1,"mouse");
   total++; if(r1.equals(exp1)){passed++;System.out.println("PASS example");} else System.out.println("FAIL example: "+r1);
   String[] p2={"havana"};
   List<List<String>> r2=new Solution().suggestedProducts(p2,"havana");
   total++; if(r2.size()==6 && r2.get(5).equals(Arrays.asList("havana"))){passed++;System.out.println("PASS full");} else System.out.println("FAIL full: "+r2);
   String[] p3={"abc"};
   List<List<String>> r3=new Solution().suggestedProducts(p3,"z");
   total++; if(r3.size()==1 && r3.get(0).isEmpty()){passed++;System.out.println("PASS none");} else System.out.println("FAIL none: "+r3);
   String[] p4={"a","ab","abc"};
   List<List<String>> r4=new Solution().suggestedProducts(p4,"ab");
   total++; if(r4.get(0).equals(Arrays.asList("a","ab","abc")) && r4.get(1).equals(Arrays.asList("ab","abc"))){passed++;System.out.println("PASS prefix");} else System.out.println("FAIL prefix: "+r4);
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n log n + L log n), Space O(n)',
  follow: ['Nếu products rất lớn, Trie có lợi thế gì?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-117',
  title: 'Graph Valid Tree',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'bytebytego'],
  prompt: `Cho {{n}} node (0..n-1) và danh sách cạnh {{edges}} vô hướng. Kiểm tra xem chúng có tạo thành một **cây** (connected và acyclic) hay không.

### Ví dụ
~~~text
Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true

Input: n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false
~~~

### Ràng buộc
- {{1 <= n <= 2000}}
- {{0 <= edges.length <= 5000}}`,
  hints: [
    'Cây với n node phải có đúng n-1 cạnh và liên thông.',
    'Union-Find: nếu union hai node đã cùng component thì có cycle.',
    'Sau xử lý, số component phải là 1.'
  ],
  solution: `### Ý tưởng
Cây <=> n-1 cạnh, không cycle, liên thông. Union-Find: union từng cạnh; nếu find(u)==find(v) thì cycle. Cuối cùng kiểm tra số component == 1 (và edges.length == n-1).

~~~java
class Solution {
    public boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;
        int[] parent = new int[n];
        int[] rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ru = find(parent, e[0]), rv = find(parent, e[1]);
            if (ru == rv) return false;
            if (rank[ru] < rank[rv]) parent[ru] = rv;
            else if (rank[ru] > rank[rv]) parent[rv] = ru;
            else { parent[rv] = ru; rank[ru]++; }
        }
        return true;
    }

    private int find(int[] p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Điều kiện n-1 cạnh + không cycle => liên thông tự động.
- BFS/DFS cũng kiểm tra connected.

> Senior tip: Union-Find là công cụ chuẩn cho dynamic connectivity và Kruskal.`,
  starter: "class Solution {\n    public boolean validTree(int n, int[][] edges) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(new Solution().validTree(5,new int[][]{{0,1},{0,2},{0,3},{1,4}})){passed++;System.out.println("PASS tree");} else System.out.println("FAIL tree");
   total++; if(!new Solution().validTree(5,new int[][]{{0,1},{1,2},{2,3},{1,3},{1,4}})){passed++;System.out.println("PASS cycle");} else System.out.println("FAIL cycle");
   total++; if(new Solution().validTree(1,new int[][]{})){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   total++; if(!new Solution().validTree(4,new int[][]{{0,1},{2,3}})){passed++;System.out.println("PASS disconnected");} else System.out.println("FAIL disconnected");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n α(n)), Space O(n)',
  follow: ['DFS kiểm tra connected khác Union-Find ở điểm nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-118',
  title: 'Accounts Merge',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'string', 'bytebytego'],
  prompt: `Cho danh sách {{accounts}}, mỗi account là [name, email1, email2, ...]. Hai account cùng tên và chia sẻ ít nhất một email thì thuộc cùng một người. Gộp các account của cùng một người, trả về danh sách account gộp: [name, email đã sort, ...].

### Ví dụ
~~~text
Input: accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]
Output: [["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]
~~~

### Ràng buộc
- {{1 <= accounts.length <= 1000}}`,
  hints: [
    'Union-Find trên email; name lấy từ account đầu tiên.',
    'Map email -> index account để union.',
    'Sau đó gom email theo root, sort email.'
  ],
  solution: `### Ý tưởng
Union-Find trên email: với mỗi account, union email đầu tiên với các email còn lại. Map email -> tên. Sau đó gom email theo root component, sort, prepend tên.

~~~java
class Solution {
    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        Map<String, String> emailToName = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        for (List<String> acc : accounts) {
            String name = acc.get(0);
            for (int i = 1; i < acc.size(); i++) {
                String email = acc.get(i);
                emailToName.put(email, name);
                parent.putIfAbsent(email, email);
            }
            for (int i = 2; i < acc.size(); i++) union(parent, acc.get(1), acc.get(i));
        }
        Map<String, TreeSet<String>> groups = new HashMap<>();
        for (String email : parent.keySet()) {
            String root = find(parent, email);
            groups.computeIfAbsent(root, k -> new TreeSet<>()).add(email);
        }
        List<List<String>> res = new ArrayList<>();
        for (Map.Entry<String, TreeSet<String>> e : groups.entrySet()) {
            List<String> acc = new ArrayList<>();
            acc.add(emailToName.get(e.getKey()));
            acc.addAll(e.getValue());
            res.add(acc);
        }
        return res;
    }

    private String find(Map<String, String> p, String x) {
        while (!p.get(x).equals(x)) { p.put(x, p.get(p.get(x))); x = p.get(x); }
        return x;
    }
    private void union(Map<String, String> p, String a, String b) {
        String ra = find(p, a), rb = find(p, b);
        if (!ra.equals(rb)) p.put(ra, rb);
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cần sort email để output deterministic.
- Nếu một email xuất hiện ở nhiều account cùng tên thì gộp.

> Senior tip: Accounts merge là bài Union-Find kinh điển trên string keys.`,
  starter: "class Solution {\n    public List<List<String>> accountsMerge(List<List<String>> accounts) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static List<List<String>> norm(List<List<String>> in){
   List<List<String>> r=new ArrayList<>();
   for(List<String> a:in){ List<String> c=new ArrayList<>(a); if(c.size()>1) Collections.sort(c.subList(1,c.size())); r.add(c);}
   // sort outer by first email
   r.sort((x,y)-> x.size()>1 && y.size()>1 ? x.get(1).compareTo(y.get(1)) : 0);
   return r;
 }
 public static void main(String[] args){
   List<List<String>> acc=new ArrayList<>();
   acc.add(Arrays.asList("John","johnsmith@mail.com","john_newyork@mail.com"));
   acc.add(Arrays.asList("John","johnsmith@mail.com","john00@mail.com"));
   acc.add(Arrays.asList("Mary","mary@mail.com"));
   acc.add(Arrays.asList("John","johnnybravo@mail.com"));
   List<List<String>> res=new Solution().accountsMerge(acc);
   total++; if(norm(res).size()==3){passed++;System.out.println("PASS count");} else System.out.println("FAIL count: "+res);
   // check emails merged for John
   total++; boolean ok=false;
   for(List<String> a:res) if(a.get(0).equals("John") && a.contains("john00@mail.com") && a.contains("johnsmith@mail.com")) ok=true;
   if(ok){passed++;System.out.println("PASS merge");} else System.out.println("FAIL merge: "+res);
   List<List<String>> acc2=new ArrayList<>();
   acc2.add(Arrays.asList("Gabe","g@mail.com"));
   total++; if(new Solution().accountsMerge(acc2).size()==1){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   List<List<String>> acc3=new ArrayList<>();
   acc3.add(Arrays.asList("A","a@mail.com"));
   acc3.add(Arrays.asList("A","b@mail.com"));
   total++; if(new Solution().accountsMerge(acc3).size()==2){passed++;System.out.println("PASS separate");} else System.out.println("FAIL separate");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(N log N), Space O(N)',
  follow: ['Nếu cùng email xuất hiện với tên khác nhau thì sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-119',
  title: 'Redundant Connection',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'bytebytego'],
  prompt: `Cho đồ thị vô hướng gồm n node (1..n) được xây dựng bằng cách thêm các cạnh trong {{edges}} theo thứ tự. Có đúng một cạnh thừa tạo chu trình. Tìm cạnh đó (cạnh xuất hiện sau cùng trong edges nếu có nhiều).

### Ví dụ
~~~text
Input: edges = [[1,2],[1,3],[2,3]]
Output: [2,3]

Input: edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]
~~~

### Ràng buộc
- {{3 <= n <= 1000}}
- {{edges.length == n}}`,
  hints: [
    'Union-Find: duyệt cạnh theo thứ tự; nếu hai đầu đã cùng component thì cạnh này là thừa.',
    'Cạnh đầu tiên tạo cycle trong quá trình union là đáp án.',
    'Vì chỉ có một cycle, trả ngay khi phát hiện.'
  ],
  solution: `### Ý tưởng
Duyệt edges theo thứ tự, union hai đầu. Nếu find(u)==find(v) thì cạnh này tạo chu trình -> redundant. Trả cạnh đó.

~~~java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        int[] parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ru = find(parent, e[0]), rv = find(parent, e[1]);
            if (ru == rv) return e;
            parent[ru] = rv;
        }
        return new int[0];
    }

    private int find(int[] p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu có nhiều cạnh thừa, cần trả cạnh xuất hiện cuối; ở đây chỉ một.
- Path compression + union by rank để tối ưu.

> Senior tip: Redundant connection là bài Union-Find đơn giản nhưng hay dùng để kiểm tra tư duy graph.`,
  starter: "class Solution {\n    public int[] findRedundantConnection(int[][] edges) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   int[] r1=new Solution().findRedundantConnection(new int[][]{{1,2},{1,3},{2,3}});
   total++; if(r1.length==2 && r1[0]==2 && r1[1]==3){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic: "+Arrays.toString(r1));
   int[] r2=new Solution().findRedundantConnection(new int[][]{{1,2},{2,3},{3,4},{1,4},{1,5}});
   total++; if(r2.length==2 && r2[0]==1 && r2[1]==4){passed++;System.out.println("PASS example");} else System.out.println("FAIL example: "+Arrays.toString(r2));
   int[] r3=new Solution().findRedundantConnection(new int[][]{{1,2},{2,3},{1,3}});
   total++; if(r3[0]==1 && r3[1]==3){passed++;System.out.println("PASS last");} else System.out.println("FAIL last: "+Arrays.toString(r3));
   int[] r4=new Solution().findRedundantConnection(new int[][]{{1,2},{2,3},{3,4},{4,1}});
   total++; if(r4.length==2){passed++;System.out.println("PASS cycle4");} else System.out.println("FAIL cycle4: "+Arrays.toString(r4));
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n α(n)), Space O(n)',
  follow: ['Nếu có nhiều cạnh thừa, làm sao trả cạnh cuối cùng?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-120',
  title: 'Single Number II',
  difficulty: 'medium',
  pattern: 'Bit Manipulation',
  tags: ['bit-manipulation', 'array', 'bytebytego'],
  prompt: `Cho mảng {{nums}} trong đó mọi phần tử xuất hiện **3 lần** ngoại trừ một phần tử xuất hiện **1 lần**. Tìm phần tử đó. Yêu cầu O(n) time và O(1) space.

### Ví dụ
~~~text
Input: nums = [2,2,3,2]
Output: 3

Input: nums = [0,1,0,1,0,1,99]
Output: 99
~~~

### Ràng buộc
- {{1 <= nums.length <= 3 * 10^4}}
- {{-2^31 <= nums[i] <= 2^31 - 1}}`,
  hints: [
    'Đếm bit trên 32 vị trí; bit nào có tổng count % 3 != 0 thì thuộc số xuất hiện một lần.',
    "Có thể dùng two's complement và mask 32 bit.",
    'Nâng cao: dùng two variables (ones, twos) để đạt O(1) space không mảng count.'
  ],
  solution: `### Ý tưởng
Với mỗi trong 32 bit, đếm số phần tử có bit đó =1. Nếu count % 3 != 0 thì bit đó thuộc số xuất hiện một lần. Ghép lại thành int (xử lý bit dấu).

~~~java
class Solution {
    public int singleNumber(int[] nums) {
        int res = 0;
        for (int b = 0; b < 32; b++) {
            int count = 0;
            for (int x : nums) if (((x >>> b) & 1) == 1) count++;
            if (count % 3 != 0) res |= (1 << b);
        }
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- nums[i] có thể âm; dùng >>> khi đếm, và << khi ghép (Java int 32-bit two's complement) cho đúng.
- Follow-up: giải O(1) space với ones/twos.

> Senior tip: Single number II là bài kiểm tra hiểu biết về biểu diễn bit và modular counting.`,
  starter: "class Solution {\n    public int singleNumber(int[] nums) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(new Solution().singleNumber(new int[]{2,2,3,2})==3){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");
   total++; if(new Solution().singleNumber(new int[]{0,1,0,1,0,1,99})==99){passed++;System.out.println("PASS example");} else System.out.println("FAIL example");
   total++; if(new Solution().singleNumber(new int[]{-1,-1,-1,5})==5){passed++;System.out.println("PASS negative");} else System.out.println("FAIL negative");
   total++; if(new Solution().singleNumber(new int[]{7})==7){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(32 * n), Space O(1)',
  follow: ['Làm sao đạt O(1) space với ones/twos?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-121',
  title: 'Missing Number',
  difficulty: 'easy',
  pattern: 'Bit Manipulation',
  tags: ['array', 'bit-manipulation', 'math', 'bytebytego'],
  prompt: `Cho mảng {{nums}} chứa n số phân biệt lấy từ 0..n, thiếu đúng một số. Tìm số bị thiếu.

### Ví dụ
~~~text
Input: nums = [3,0,1]
Output: 2

Input: nums = [0,1]
Output: 2
~~~

### Ràng buộc
- {{n == nums.length}}
- {{0 <= nums[i] <= n}}
- Tất cả số phân biệt`,
  hints: [
    'Tổng 0..n là n(n+1)/2; trừ tổng nums.',
    'Hoặc XOR tất cả số 0..n với nums.',
    'Cả hai đều O(n).'
  ],
  solution: `### Ý tưởng
XOR tất cả số từ 0..n với các phần tử trong nums. Các số xuất hiện hai lần triệt tiêu, còn lại số bị thiếu.

~~~java
class Solution {
    public int missingNumber(int[] nums) {
        int res = nums.length;
        for (int i = 0; i < nums.length; i++) res ^= i ^ nums[i];
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Tổng có thể overflow nếu n lớn; XOR an toàn.
- Nếu thiếu nhiều số thì bài khác (Find All Numbers Disappeared).

> Senior tip: Missing number là ví dụ kinh điển của XOR để tìm phần tử duy nhất.`,
  starter: "class Solution {\n    public int missingNumber(int[] nums) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(new Solution().missingNumber(new int[]{3,0,1})==2){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");
   total++; if(new Solution().missingNumber(new int[]{0,1})==2){passed++;System.out.println("PASS end");} else System.out.println("FAIL end");
   total++; if(new Solution().missingNumber(new int[]{1})==0){passed++;System.out.println("PASS first");} else System.out.println("FAIL first");
   total++; if(new Solution().missingNumber(new int[]{0})==1){passed++;System.out.println("PASS zero");} else System.out.println("FAIL zero");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu mảng không bắt đầu từ 0 thì sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-122',
  title: 'Counting Bits',
  difficulty: 'easy',
  pattern: 'Bit Manipulation',
  tags: ['dynamic-programming', 'bit-manipulation', 'bytebytego'],
  prompt: `Cho số nguyên {{n}}, trả về mảng {{ans}} độ dài n+1 trong đó {{ans[i]}} là số bit 1 trong biểu diễn nhị phân của i (0 <= i <= n).

### Ví dụ
~~~text
Input: n = 2
Output: [0,1,1]

Input: n = 5
Output: [0,1,1,2,1,2]
~~~

### Ràng buộc
- {{0 <= n <= 10^5}}`,
  hints: [
    'ans[i] = ans[i >> 1] + (i & 1).',
    'Hoặc ans[i] = ans[i & (i-1)] + 1.',
    'DP O(n).'
  ],
  solution: `### Ý tưởng
DP: số bit 1 của i bằng số bit 1 của i/2 cộng bit cuối. Hoặc dùng i & (i-1) để loại bit 1 thấp nhất.

~~~java
class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++) ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }
}
~~~

### Lưu ý khi phỏng vấn
- O(n) tốt hơn O(n log n) naive.
- Có thể mở rộng cho range queries.

> Senior tip: Counting bits là bài DP trên bit cơ bản, hay xuất hiện trong phỏng vấn.`,
  starter: "class Solution {\n    public int[] countBits(int n) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(Arrays.equals(new Solution().countBits(2),new int[]{0,1,1})){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");
   total++; if(Arrays.equals(new Solution().countBits(5),new int[]{0,1,1,2,1,2})){passed++;System.out.println("PASS example");} else System.out.println("FAIL example");
   total++; if(Arrays.equals(new Solution().countBits(0),new int[]{0})){passed++;System.out.println("PASS zero");} else System.out.println("FAIL zero");
   total++; if(Arrays.equals(new Solution().countBits(8),new int[]{0,1,1,2,1,2,2,3,1})){passed++;System.out.println("PASS eight");} else System.out.println("FAIL eight");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['Có thể tính popcount bằng builtin không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-123',
  title: 'Sum of Two Integers',
  difficulty: 'medium',
  pattern: 'Bit Manipulation',
  tags: ['bit-manipulation', 'math', 'bytebytego'],
  prompt: `Tính {{a + b}} mà **không dùng** toán tử {{+}} và {{-}}.

### Ví dụ
~~~text
Input: a = 1, b = 2
Output: 3

Input: a = -1, b = 1
Output: 0
~~~

### Ràng buộc
- {{-1000 <= a, b <= 1000}}`,
  hints: [
    'Sum không carry: a XOR b.',
    'Carry: (a AND b) << 1.',
    'Lặp cho đến khi carry = 0.'
  ],
  solution: `### Ý tưởng
Dùng XOR để cộng không nhớ, AND+shift để tính nhớ. Lặp cho đến khi nhớ bằng 0.

~~~java
class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Java int 32-bit; với ràng buộc nhỏ không lo overflow.
- Nếu a,b lớn, cần mask 32-bit để mô phỏng unsigned.

> Senior tip: Sum of two integers là bài kiểm tra hiểu biết về arithmetic ở mức bit.`,
  starter: "class Solution {\n    public int getSum(int a, int b) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(new Solution().getSum(1,2)==3){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");
   total++; if(new Solution().getSum(-1,1)==0){passed++;System.out.println("PASS negative");} else System.out.println("FAIL negative");
   total++; if(new Solution().getSum(0,0)==0){passed++;System.out.println("PASS zero");} else System.out.println("FAIL zero");
   total++; if(new Solution().getSum(1000,-1000)==0){passed++;System.out.println("PASS cancel");} else System.out.println("FAIL cancel");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(1) (32 iterations), Space O(1)',
  follow: ['Nếu không được dùng loop thì sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-124',
  title: 'Rotate Image',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'matrix', 'math', 'bytebytego'],
  prompt: `Cho ma trận vuông {{matrix}} n x n, xoay ma trận **90 độ theo chiều kim đồng hồ** tại chỗ (in-place).

### Ví dụ
~~~text
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]
~~~

### Ràng buộc
- {{1 <= n <= 20}}
- {{-1000 <= matrix[i][j] <= 1000}}`,
  hints: [
    'Transpose rồi reverse mỗi hàng.',
    'Hoặc xoay từng lớp (layer) từ ngoài vào trong.',
    'In-place: không cấp ma trận mới.'
  ],
  solution: `### Ý tưởng
Transpose (đổi hàng/cột) rồi reverse mỗi hàng -> xoay 90° clockwise. Làm tại chỗ.

~~~java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int t = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = t;
            }
        for (int i = 0; i < n; i++) {
            int l = 0, r = n - 1;
            while (l < r) {
                int t = matrix[i][l];
                matrix[i][l] = matrix[i][r];
                matrix[i][r] = t;
                l++; r--;
            }
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nếu xoay counter-clockwise: reverse mỗi hàng rồi transpose.
- Kiểm tra n=1.

> Senior tip: Rotate image là bài geometry cơ bản, kiểm tra khả năng thao tác index.`,
  starter: "class Solution {\n    public void rotate(int[][] matrix) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static void runSteps(String n, Runnable r){ total++; try{r.run();passed++;System.out.println("PASS "+n);} catch(Throwable t){System.out.println("FAIL "+n+": threw "+t);}}
 static boolean eq(int[][] a,int[][] b){ if(a.length!=b.length) return false; for(int i=0;i<a.length;i++) if(!Arrays.equals(a[i],b[i])) return false; return true;}
 public static void main(String[] args){
   int[][] m1={{1,2,3},{4,5,6},{7,8,9}};
   new Solution().rotate(m1);
   runSteps("3x3", ()->{ if(!eq(m1,new int[][]{{7,4,1},{8,5,2},{9,6,3}})) throw new AssertionError("x");});
   int[][] m2={{1}};
   new Solution().rotate(m2);
   runSteps("1x1", ()->{ if(!eq(m2,new int[][]{{1}})) throw new AssertionError("x");});
   int[][] m3={{1,2},{3,4}};
   new Solution().rotate(m3);
   runSteps("2x2", ()->{ if(!eq(m3,new int[][]{{3,1},{4,2}})) throw new AssertionError("x");});
   int[][] m4={{1,2,3,4},{5,6,7,8},{9,10,11,12},{13,14,15,16}};
   new Solution().rotate(m4);
   runSteps("4x4", ()->{ if(!eq(m4,new int[][]{{13,9,5,1},{14,10,6,2},{15,11,7,3},{16,12,8,4}})) throw new AssertionError("x");});
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n^2), Space O(1)',
  follow: ['Nếu không được sửa input thì sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-125',
  title: 'Spiral Matrix',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'matrix', 'simulation', 'bytebytego'],
  prompt: `Cho ma trận {{matrix}} m x n, trả về tất cả phần tử theo thứ tự xoắn ốc (spiral) từ ngoài vào trong, theo chiều kim đồng hồ.

### Ví dụ
~~~text
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]
~~~

### Ràng buộc
- {{1 <= m, n <= 10}}
- {{-100 <= matrix[i][j] <= 100}}`,
  hints: [
    'Giữ 4 biên: top, bottom, left, right.',
    'Mỗi vòng: đi phải, xuống, trái, lên; sau đó thu hẹp biên.',
    'Cẩn thận khi còn một hàng/cột để không trùng.'
  ],
  solution: `### Ý tưởng
Giữ 4 biên. Mỗi vòng đi phải (top row), xuống (right col), trái (bottom row), lên (left col), rồi thu hẹp. Kiểm tra điều kiện để tránh trùng khi còn một hàng/cột.

~~~java
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        if (matrix.length == 0) return res;
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) res.add(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) res.add(matrix[i][right]);
            right--;
            if (top <= bottom)
                for (int j = right; j >= left; j--) res.add(matrix[bottom][j]);
            bottom--;
            if (left <= right)
                for (int i = bottom; i >= top; i--) res.add(matrix[i][left]);
            left++;
        }
        return res;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Có thể dùng visited matrix nhưng tốn O(mn) space.
- Biên approach O(1) space.

> Senior tip: Spiral traversal là bài geometry cơ bản, hay dùng trong UI grid rendering.`,
  starter: "class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   int[][] m1={{1,2,3},{4,5,6},{7,8,9}};
   total++; if(new Solution().spiralOrder(m1).equals(Arrays.asList(1,2,3,6,9,8,7,4,5))){passed++;System.out.println("PASS 3x3");} else System.out.println("FAIL 3x3: "+new Solution().spiralOrder(m1));
   int[][] m2={{1,2,3,4},{5,6,7,8},{9,10,11,12}};
   total++; if(new Solution().spiralOrder(m2).equals(Arrays.asList(1,2,3,4,8,12,11,10,9,5,6,7))){passed++;System.out.println("PASS 2x4");} else System.out.println("FAIL 2x4");
   int[][] m3={{1}};
   total++; if(new Solution().spiralOrder(m3).equals(Arrays.asList(1))){passed++;System.out.println("PASS single");} else System.out.println("FAIL single");
   int[][] m4={{1,2},{3,4}};
   total++; if(new Solution().spiralOrder(m4).equals(Arrays.asList(1,2,4,3))){passed++;System.out.println("PASS 2x2");} else System.out.println("FAIL 2x2");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(m*n), Space O(1) extra',
  follow: ['Nếu ma trận rỗng thì trả gì?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-126',
  title: 'Valid Sudoku',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'hash-table', 'matrix', 'bytebytego'],
  prompt: `Kiểm tra xem bảng Sudoku 9x9 có hợp lệ hay không. Chỉ cần các số 1-9 không trùng trong mỗi hàng, mỗi cột và mỗi khối 3x3 (ô '.' là trống). Không cần giải.

### Ví dụ
~~~text
Input: board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]
Output: true
~~~

### Ràng buộc
- {{board.length == 9}}, {{board[i].length == 9}}
- {{board[i][j]}} ∈ {{'1'..'9', '.'}}`,
  hints: [
    'Dùng 3 mảng boolean: rows[9][10], cols[9][10], boxes[9][10].',
    'Box index = (i/3)*3 + (j/3).',
    'Duyệt từng ô; nếu là số thì kiểm tra 3 nhóm.'
  ],
  solution: `### Ý tưởng
Kiểm tra mỗi số xuất hiện không quá một lần trong mỗi hàng, cột và khối 3x3. Dùng 3 mảng boolean 9x10.

~~~java
class Solution {
    public boolean isValidSudoku(char[][] board) {
        boolean[][] row = new boolean[9][10];
        boolean[][] col = new boolean[9][10];
        boolean[][] box = new boolean[9][10];
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char ch = board[i][j];
                if (ch == '.') continue;
                int d = ch - '0';
                int b = (i / 3) * 3 + (j / 3);
                if (row[i][d] || col[j][d] || box[b][d]) return false;
                row[i][d] = col[j][d] = box[b][d] = true;
            }
        }
        return true;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Chỉ validate, không solve.
- Có thể dùng HashSet cho từng nhóm.

> Senior tip: Valid Sudoku kiểm tra khả năng xử lý index và grouping.`,
  starter: "class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 static char[][] validBoard(){
   return new char[][]{
     {'5','3','.','.','7','.','.','.','.'},
     {'6','.','.','1','9','5','.','.','.'},
     {'.','9','8','.','.','.','.','6','.'},
     {'8','.','.','.','6','.','.','.','3'},
     {'4','.','.','8','.','3','.','.','1'},
     {'7','.','.','.','2','.','.','.','6'},
     {'.','6','.','.','.','.','2','8','.'},
     {'.','.','.','4','1','9','.','.','5'},
     {'.','.','.','.','8','.','.','7','9'}
   };
 }
 public static void main(String[] args){
   total++; if(new Solution().isValidSudoku(validBoard())){passed++;System.out.println("PASS valid");} else System.out.println("FAIL valid");
   char[][] bad=validBoard();
   bad[0][1]='5'; // duplicate in row
   total++; if(!new Solution().isValidSudoku(bad)){passed++;System.out.println("PASS rowdup");} else System.out.println("FAIL rowdup");
   char[][] bad2=validBoard();
   bad2[1][0]='5'; // duplicate in col? row1 col0 currently 6; set 5 duplicates col0 with row0
   total++; if(!new Solution().isValidSudoku(bad2)){passed++;System.out.println("PASS coldup");} else System.out.println("FAIL coldup");
   char[][] empty=new char[9][9];
   for(char[] r:empty) Arrays.fill(r,'.');
   total++; if(new Solution().isValidSudoku(empty)){passed++;System.out.println("PASS empty");} else System.out.println("FAIL empty");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(1) (81 cells), Space O(1)',
  follow: ['Nếu bảng có kích thước N x N tổng quát thì sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-127',
  title: 'Count Primes',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['math', 'sieve', 'bytebytego'],
  prompt: `Đếm số số nguyên tố nhỏ hơn {{n}}.

### Ví dụ
~~~text
Input: n = 10
Output: 4

Input: n = 0
Output: 0
~~~

### Ràng buộc
- {{0 <= n <= 5 * 10^6}}`,
  hints: [
    'Sieve of Eratosthenes: đánh dấu bội số của mỗi số nguyên tố.',
    'Chỉ cần sieve đến sqrt(n).',
    'Đếm các số chưa bị đánh dấu.'
  ],
  solution: `### Ý tưởng
Sieve of Eratosthenes: mảng boolean isComposite. Với mỗi i từ 2, nếu chưa composite, tăng count và đánh dấu bội số từ i*i. Độ phức tạp O(n log log n).

~~~java
class Solution {
    public int countPrimes(int n) {
        if (n <= 2) return 0;
        boolean[] composite = new boolean[n];
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (!composite[i]) {
                count++;
                if ((long) i * i < n)
                    for (int j = i * i; j < n; j += i) composite[j] = true;
            }
        }
        return count;
    }
}
~~~

### Lưu ý khi phỏng vấn
- i*i có thể overflow nếu n lớn; dùng long.
- Nếu cần danh sách prime thì lưu.

> Senior tip: Sieve là nền tảng cho các bài toán số học và crypto cơ bản.`,
  starter: "class Solution {\n    public int countPrimes(int n) {\n        \n    }\n}",
  tests: `
public class Main {
 static int passed=0,total=0;
 public static void main(String[] args){
   total++; if(new Solution().countPrimes(10)==4){passed++;System.out.println("PASS basic");} else System.out.println("FAIL basic");
   total++; if(new Solution().countPrimes(0)==0){passed++;System.out.println("PASS zero");} else System.out.println("FAIL zero");
   total++; if(new Solution().countPrimes(2)==0){passed++;System.out.println("PASS two");} else System.out.println("FAIL two");
   total++; if(new Solution().countPrimes(100)==25){passed++;System.out.println("PASS hundred");} else System.out.println("FAIL hundred");
   System.out.println("RESULT "+passed+"/"+total);
 }
}`,
  complexity: 'Time O(n log log n), Space O(n)',
  follow: ['Nếu n rất lớn (10^8) thì sieve có đủ bộ nhớ không?']
}
);

(function() {
  'use strict';
  (window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-128',
  title: 'Longest Palindromic Substring',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}, tìm chuỗi con liên tiếp dài nhất là palindrome (đọc xuôi ngả như nhau). Nếu có nhiều chuỗi dài nhất bằng nhau, trả về bất kỳ chuỗi nào.

### Ví dụ
~~~text
Input:  s = "cbbd"
Output: "bb"

Input:  s = "a"
Output: "a"

Input:  s = "abb"
Output: "bb"
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái và chữ số.`,
  hints: [
    'Với mỗi vị trí, coi nó là tâm của palindrome và mở rộng ra hai phía bằng hai con trỏ cho đến khi ký tự khác nhau.',
    'Có hai loại tâm: một ký tự (palindrome độ dài lẻ) và hai ký tự liền kề (palindrome độ dài chẵn).',
    'Lưu chuỗi dài nhất tìm được; mỗi vị trí được xét hai lần nên tổng số bước là O(n²) nhưng không tốn thêm bộ nhớ.'
  ],
  solution: `### Ý tưởng
Dùng phương pháp "mở rộng từ tâm" (expand around center). Với mỗi vị trí i trong chuỗi, coi nó là tâm của palindrome lẻ (tâm là một ký tự) và tâm của palindrome chẵn (tâm nằm giữa hai ký tự). Mở rộng ra trái phải cho đến khi ký tự khác nhau hoặc đạt biên chuỗi.

Mỗi mở rộng tốn O(n), có n vị trí nên tổng O(n²). Không dùng bảng DP 2D nên bộ nhớ chỉ O(1).

~~~java
class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() < 1) return "";
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > end - start) {
                start = i - (len - 1) / 2;
                end = i + len / 2;
            }
        }
        return s.substring(start, end + 1);
    }

    private int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cần xử lý cả hai loại tâm: "{{i, i}}" cho độ dài lẻ và "{{i, i + 1}}" cho độ dài chẵn.
- Có thể dùng bảng DP {{dp[i][j]}} cho biết s[i..j] có phải palindrome hay không, nhưng tốn O(n²) bộ nhớ.
- Khi s chứa Unicode, so sánh ký tự bằng {{charAt}} có thể chưa chính xác với surrogate pair.`,
  starter: "class Solution {\\n    public String longestPalindrome(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected '"
                    + expected + "' got '" + actual + "'");
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("cbbd", "bb", () -> new Solution().longestPalindrome("cbbd"));
        run("single", "a", () -> new Solution().longestPalindrome("a"));
        run("abb", "bb", () -> new Solution().longestPalindrome("abb"));
        run("bbbb", "bbbb", () -> new Solution().longestPalindrome("bbbb"));
        run("racecar", "racecar", () -> new Solution().longestPalindrome("racecar"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n^2), Space O(1)',
  follow: ['Nếu cần trả về độ dài thay vì chuỗi thì sửa thế nào?', 'Có cách nào đạt O(n) không?']
},
{
  id: 'algo-129',
  title: 'Palindromic Substrings Count',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}, tính số lượng chuỗi con liên tiếp là palindrome. Hai chuỗi con khác nhau nếu chúng có vị trí bắt đầu hoặc kết thúc khác nhau, kể cả cùng nội dung.

### Ví dụ
~~~text
Input:  s = "abc"
Output: 3
Giải thích: "a", "b", "c".

Input:  s = "aaa"
Output: 6
Giải thích: "a", "a", "a", "aa", "aa", "aaa".
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Với mỗi vị trí làm tâm, mở rộng ra hai phía và đếm mỗi lần tìm được palindrome.',
    'Có hai loại tâm: một ký tự (độ dài lẻ) và hai ký tự liền kề (độ dài chẵn).',
    'Mỗi mở rộng thành công tăng biến đếm 1; có n vị trí nên tổng O(n²).'
  ],
  solution: `### Ý tưởng
Tương tự bài Longest Palindromic Substring, nhưng thay vì lưu chuỗi dài nhất, ta đếm số lần mở rộng thành công. Với mỗi vị trí i, mở rộng từ tâm {{(i, i)}} và tâm {{(i, i + 1)}}; mỗi khi s.charAt(left) == s.charAt(right) thì tìm được một palindrome mới, tăng biến đếm.

Có n vị trí, mỗi vị trí mở rộng tối đa O(n) bước nên tổng O(n²), bộ nhớ O(1).

~~~java
class Solution {
    public int countSubstrings(String s) {
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            count += expandAroundCenter(s, i, i);
            count += expandAroundCenter(s, i, i + 1);
        }
        return count;
    }

    private int expandAroundCenter(String s, int left, int right) {
        int count = 0;
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            count++;
            left--;
            right++;
        }
        return count;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cần xử lý cả hai loại tâm: "{{i, i}}" cho độ dài lẻ và "{{i, i + 1}}" cho độ dài chẵn.
- Chuỗi con khác nhau theo vị trí, nên "aaa" có 6 palindrome (ba ô đơn, hai "aa", một "aaa").
- Có thể dùng bảng DP 2D nhưng tốn O(n²) bộ nhớ.`,
  starter: "class Solution {\\n    public int countSubstrings(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("abc", 3, () -> new Solution().countSubstrings("abc"));
        run("aaa", 6, () -> new Solution().countSubstrings("aaa"));
        run("abba", 6, () -> new Solution().countSubstrings("abba"));
        run("single", 1, () -> new Solution().countSubstrings("a"));
        run("two same", 3, () -> new Solution().countSubstrings("aa"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n^2), Space O(1)',
  follow: ['Nếu cần liệt kê tất cả các palindrome thì làm thế nào?', 'Có cách nào đạt O(n) không?']
},
{
  id: 'algo-130',
  title: 'Minimum Cuts for Palindrome Partitioning',
  difficulty: 'hard',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}, cắt sao cho mỗi phần đều là palindrome. Tìm số lần cắt ít nhất (tức có ít nhất bao nhiêu phần — 1).

### Ví dụ
~~~text
Input:  s = "aab"
Output: 1
Giải thích: cắt thành "aa" và "b", 1 lần cắt.

Input:  s = "a"
Output: 0
Giải thích: đã là palindrome, không cần cắt.

Input:  s = "noon"
Output: 0
~~~

### Ràng buộc
- {{1 <= s.length <= 2000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Xây dựng bảng DP {{isPal[i][j]}} cho biết s[i..j] có phải palindrome không.',
    'dp[i] là số lần cắt tối thiểu cho tiền tố {{s[0..i]}}; cập nhật nếu {{isPal[j][i]}} và dp[j-1] + 1.',
    'Bất kể i là đầu của một palindrome kéo dài từ j, số cắt cho s[0..i] là dp[j-1] + 1.'
  ],
  solution: `### Ý tưởng
Hai bước Dynamic Programming:

**Bước 1:** Dựng bảng {{isPal[i][j]}} — s[i..j] có phải palindrome hay không. Công thức: nếu {{s[i] == s[j]}} và ({{j - i < 2}} hoặc {{isPal[i+1][j-1]}}).

**Bước 2:** {{dp[i]}} là số lần cắt tối thiểu cho tiền tố {{s[0..i]}}. Với mỗi vị trí {{i}}, thử mọi {{j <= i}} sao cho {{isPal[j][i]}}; nếu được, cập nhật {{dp[i] = min(dp[i], (j > 0 ? dp[j-1] + 1 : 0))}}.

Độ phức tạp: O(n²) thời gian và O(n²) bộ nhớ cho bảng isPal; dp dùng O(n).

~~~java
class Solution {
    public int minCut(String s) {
        int n = s.length();
        boolean[][] isPal = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                isPal[i][j] = s.charAt(i) == s.charAt(j)
                    && (j - i < 2 || isPal[i + 1][j - 1]);
            }
        }
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            if (isPal[0][i]) {
                dp[i] = 0;
            } else {
                dp[i] = i;
                for (int j = 1; j <= i; j++) {
                    if (isPal[j][i]) {
                        dp[i] = Math.min(dp[i], dp[j - 1] + 1);
                    }
                }
            }
        }
        return dp[n - 1];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dòng {{isPal[i][j]}} được tính từ {{i}} giảm dần để {{isPal[i+1][...}} đã có giá trị.
- Nếu chỉ cần O(n) bộ nhớ, có thể dùng expand-from-center và cập nhật dp trong quá trình mở rộng, nhưng code phức tạp hơn.
- Câu hỏi thường gặp: "trả về cách cắt", không chỉ số lần cắt — cần lưu thêm trạng thái để backtrack.`,
  starter: "class Solution {\\n    public int minCut(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("aab", 1, () -> new Solution().minCut("aab"));
        run("single", 0, () -> new Solution().minCut("a"));
        run("noon", 0, () -> new Solution().minCut("noon"));
        run("bbab", 1, () -> new Solution().minCut("bbab"));
        run("abc", 2, () -> new Solution().minCut("abc"));
        run("long", 2, () -> new Solution().minCut("aabbcbb"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n^2), Space O(n^2)',
  follow: ['Nếu cần trả về cách cắt thực sự thì backtrack như thế nào?', 'Có cách giảm bộ nhớ xuống O(n) không?']
},
{
  id: 'algo-131',
  title: 'Longest Palindromic Subsequence',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}, tìm độ dài của dãy con (không nhất thiết liên tiếp) dài nhất là palindrome.

### Ví dụ
~~~text
Input:  s = "bbbab"
Output: 4
Giải thích: "bbbb" là palindrome dài nhất.

Input:  s = "cbbd"
Output: 2
Giải thích: "bb" là palindrome dài nhất.
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Nếu lật ngược s, dãy con chung dài nhất giữa s và s đảo ngược chính là dãy con palindrome dài nhất.',
    'dp[i][j] là độ dài LPS (Longest Palindromic Subsequence) của s[i..j].',
    'Nếu s[i] == s[j], dp[i][j] = dp[i+1][j-1] + 2; ngược lại dp[i][j] = max(dp[i+1][j], dp[i][j-1]).'
  ],
  solution: `### Ý tưởng
Dãy con palindrome dài nhất của s bằng dãy con chung dài nhất (LCS) của s và s đảo ngược. Đây là cách nhận biết nhanh trong phỏng vấn.

Cách DP trực tiếp: {{dp[i][j] độ dài LPS của s[i..j]}}. Nếu {{s.charAt(i) == s.charAt(j)}}: dp[i][j] = dp[i+1][j-1] + 2. Ngược lại: dp[i][j] = max(dp[i+1][j], dp[i][j-1]). Tính từ {{i}} giảm dần.

~~~java
class Solution {
    public int longestPalinSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = n - 1; i >= 0; i--) {
            dp[i][i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (s.charAt(i) == s.charAt(j)) {
                    dp[i][j] = dp[i + 1][j - 1] + 2;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[0][n - 1];
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dãy con khác với chuỗi con: dãy con có thể bỏ qua ký tự, nên không cần liên tiếp.
- Phân biệt với Longest Palindromic Substring: substring yêu cầu liên tiếp, subsequence thì không.
- Có thể tối ưu bộ nhớ xuống O(n) bằng cách chỉ lưu hàng hiện tại và hàng kế.`,
  starter: "class Solution {\\n    public int longestPalinSubseq(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("bbbab", 4, () -> new Solution().longestPalinSubseq("bbbab"));
        run("cbbd", 2, () -> new Solution().longestPalinSubseq("cbbd"));
        run("single", 1, () -> new Solution().longestPalinSubseq("a"));
        run("all same", 5, () -> new Solution().longestPalinSubseq("aaaaa"));
        run("two distinct", 1, () -> new Solution().longestPalinSubseq("ab"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n^2), Space O(n^2)',
  follow: ['Nếu cần trả về dãy con palindrome thực sự thì backtrack như thế nào?', 'Có cách giảm bộ nhớ xuống O(n) không?']
},
{
  id: 'algo-132',
  title: 'Gas Station',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['array', 'greedy', 'gas-station', 'bytebytego'],
  prompt: `Có {{n}} trạm xăng tròn, mỗi trạm có {{gas[i]}} lit xăng. Từ trạm i sang trạm i+1 tốn {{cost[i]}} lit. Xe bình ban đầu, bình không giới hạn dung tích. Tìm chỉ số trạm khởi đầu để xe đi vòng quanh toàn bộ vòng tròn, hoặc trả về -1 nếu không thể.

### Ví dụ
~~~text
Input:  gas = [1,2,3,4,5], cost = [3,4,5,1,2]
Output: 3
Giải thích: khởi tại trạm 3, bình có đủ xăng để đi hết vòng.

Input:  gas = [2,3,4], cost = [3,4,3]
Output: -1
~~~

### Ràng buộc
- {{n == gas.length == cost.length}}
- {{1 <= n <= 10^5}}
- {{0 <= gas[i], cost[i] <= 10^4}}`,
  hints: [
    'Nếu tổng xăng nhỏ hơn tổng chi phí, chắc chắn không thể đi hết vòng.',
    'Nếu bắt đầu tại trạm {{start}} mà bình rỗng ở trạm {{k}}, thì mọi trạm từ {{start}} đến {{k}} cũng không thể là khởi đầu.',
    'Tìm trạm đầu tiên mà bình không bao giờ rỗng trên đoạn đi từ đó đến cuối mảng.'
  ],
  solution: `### Ý tưởng
Hai điều kiện quan trọng:

1. Nếu {{tổng gas < tổng cost}}, trả về -1 ngay (không đủ xăng cho cả vòng).
2. Nếu tổng đủ, thì chắc chắn có một trạm khởi đầu hợp lệ. Tìm nó bằng cách duyệt một lần: duy trì {{tank}} (xăng còn lại). Nếu tại trạm {{i}}, {{tank < 0}}, thì khởi đầu không thể là bất kỳ trạm nào từ điểm bắt đầu hiện tại đến {{i}} — đặt khởi đầu mới là {{i + 1}} và reset tank.

Lý do: từ trạm A đến B, nếu tank trở nên âm, nghĩa là đoạn A→B hụt xăng, không thể bắt đầu ở bất kỳ trạm nào trong đoạn này.

~~~java
class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int totalGas = 0, totalCost = 0;
        int tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            totalGas += gas[i];
            totalCost += cost[i];
            tank += gas[i] - cost[i];
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }
        return totalGas < totalCost ? -1 : start;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Chỉ số start có thể vượt qua {{gas.length}} nếu mảng được duyệt hết; nhưng vì kiểm tra total trước, nếu có đáp án thì start sẽ nằm trong [0, n-1].
- Đây là dạng "greedy prefix sum": khi tiền tố tổng âm, cắt đoạn và bắt đầu mới.
- Trong thực tế, mô hình này xuất hiện khi lập lịch job cyclic hoặc kiểm tra cân bằng tải trên vòng quay.`,
  starter: "class Solution {\\n    public int canCompleteCircuit(int[] gas, int[] cost) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("example", 3, () -> new Solution().canCompleteCircuit(new int[]{1, 2, 3, 4, 5}, new int[]{3, 4, 5, 1, 2}));
        run("impossible", -1, () -> new Solution().canCompleteCircuit(new int[]{2, 3, 4}, new int[]{3, 4, 3}));
        run("single ok", 0, () -> new Solution().canCompleteCircuit(new int[]{5}, new int[]{4}));
        run("single fail", -1, () -> new Solution().canCompleteCircuit(new int[]{3}, new int[]{4}));
        run("start zero", 0, () -> new Solution().canCompleteCircuit(new int[]{5, 1, 2, 3, 4}, new int[]{4, 4, 1, 5, 1}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu xăng bị rò rỉ theo thời gian thì sửa thế nào?', 'Làm sao tìm tất cả trạm khởi đầu hợp lệ?']
},
{
  id: 'algo-133',
  title: 'Partition Labels',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['string', 'greedy', 'intervals', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Phân đoạn s thành nhiều phần sao cho mỗi chữ cái chỉ xuất hiện trong một phần duy nhất. Trả về độ dài các phần theo thứ tự.

### Ví dụ
~~~text
Input:  s = "ababcbacadefegdehijhklij"
Output: [9, 7, 8]
Giải thích: "ababcbaca", "defegde", "hijhklij".

Input:  s = "eccbbbbdec"
Output: [10]
~~~

### Ràng buộc
- {{1 <= s.length <= 500}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Ghi lại vị trí xuất hiện cuối cùng của mỗi chữ cái.',
    'Duyệt từ trái sang phải, duy trì cửa sổ. Nếu một chữ cái trong cửa sổ có vị trí cuối nằm bên phải, mở rộng cửa sổ đến đó.',
    'Khi chỉ số hiện tại đạt được biên phải xa nhất của cửa sổ, đóng cửa sổ và ghi độ dài.'
  ],
  solution: `### Ý tưởng
Hai bước:

**Bước 1:** Dựng mảng {{last[26]}} lưu chỉ số xuất hiện cuối cùng của mỗi chữ cái.

**Bước 2:** Duyệt chuỗi với hai con trỏ {{start}} và {{end}}. Với mỗi ký tự {{s[i]}}, cập nhật {{end = max(end, last[s[i] - 'a'])}}. Khi {{i == end}}, cửa sổ đã đóng: ghi {{end - start + 1}} và đặt {{start = i + 1}}.

Mỗi ký tự được xem xét một lần, nên O(n) thời gian và O(1) bộ nhớ (bảng 26 ô).

~~~java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) {
            last[s.charAt(i) - 'a'] = i;
        }
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                result.add(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Mảng {{last}} chỉ cần 26 phần tử vì chỉ có 26 chữ cái thường; nếu Unicode, dùng HashMap.
- Phần cuối cùng luôn được đóng khi i đạt đến last ký tự cuối cùng.
- Có thể hiểu từng phần là một "khoảng không giao nhau" sau khi hợp nhất các khoảng của cùng một chữ cái.`,
  starter: "class Solution {\\n    public List<Integer> partitionLabels(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + Arrays.deepToString(new Object[]{expected})
                    + " got " + Arrays.deepToString(new Object[]{actual}));
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("example", java.util.List.of(9, 7, 8), () -> new Solution().partitionLabels("ababcbacadefegdehijhklij"));
        run("single", java.util.List.of(10), () -> new Solution().partitionLabels("eccbbbbdec"));
        run("all same", java.util.List.of(3), () -> new Solution().partitionLabels("aaa"));
        run("distinct", java.util.List.of(1, 1, 1), () -> new Solution().partitionLabels("abc"));
        run("two", java.util.List.of(2, 2), () -> new Solution().partitionLabels("abab"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n), Space O(1)',
  follow: ['Nếu muốn mỗi phần tối đa K ký tự thì làm thế nào?', 'Làm sao xử lý nếu chữ cái có thể là Unicode?']
},
{
  id: 'algo-134',
  title: 'Minimum Number of Arrows to Burst Balloons',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['array', 'greedy', 'intervals', 'bytebytego'],
  prompt: `Có nhiều màu trên không phẳng, mỗi màu biểu diễn bằng khoảng trampion {{[x_start, x_end]}}. Một cung bắn tại tọa độ x sẽ nổ mọi màu có {{x_start <= x <= x_end}}. Tìm số cung ít nhất để nổ hết mọi màu.

### Ví dụ
~~~text
Input:  points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Giải thích: bắn tại x = 6 nổ [1,6] và [2,8]; bắn tại x = 11 não [10,16] và [7,12].

Input:  points = [[1,2],[3,4],[5,6],[7,8]]
Output: 4
~~~

### Ràng buộc
- {{1 <= points.length <= 10^5}}
- {{points[i].length == 2}}
- {{-2^31 <= x_start < x_end <= 2^31 - 1}}`,
  hints: [
    'Sắp xếp các khoảng theo đầu phải (x_end) tăng dần.',
    'Luôn bắn tại đầu phải của khoảng chưa bị nổ đầu tiên — cách này tối ưu vì chạm được nhiều khoảng nhất.',
    'Khi sang một khoảng mới, nếu đầu trái lớn hơn vị trí cung vừa bắn, cần bắn thêm một cung.'
  ],
  solution: `### Ý tưởng
Sắp xếp các khoảng theo {{x_end}} tăng dần. Giữ vị trí cung bắn gần nhất {{arrowPos}}. Khi xét khoảng mới:

- Nếu {{x_start > arrowPos}}, khoảng này chưa bị nổ → bắn cung mới tại {{x_end}}, cập nhật {{arrowPos = x_end}}.
- Nếu {{x_start <= arrowPos}}, khoảng này đã bị nổ bởi cung trước → bỏ qua.

Vì sắp xếp theo đầu phải, cung bắn tại điểm nhỏ nhất có thể bên trái nhưng vẫn chạm được khoảng hiện tại, tạo điều kiện chạm được nhiều khoảng sau này nhất.

~~~java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowPos = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cẩn thận overflow khi so sánh: dùng {{Integer.compare}} hoặc {{Long.compare}} thay vì {{a[1] - b[1]}} vì giá trị có thể gần {{Integer.MAX_VALUE}}.
- Nếu hai khoảng chỉ chạm nhau ở điểm biên (ví dụ [1,2] và [2,3]), cung tại x=2 nổ cả hai — được xử lý đúng bởi điều kiện {{points[i][0] > arrowPos}}.
- Đây là bài "interval scheduling" điển hình: chọn điểm chờ nhiều khoảng nhất.`,
  starter: "class Solution {\\n    public int findMinArrowShots(int[][] points) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("example", 2, () -> new Solution().findMinArrowShots(new int[][]{{10, 16}, {2, 8}, {1, 6}, {7, 12}}));
        run("disjoint", 4, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}, {3, 4}, {5, 6}, {7, 8}}));
        run("single", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}}));
        run("nested", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 10}, {2, 3}, {4, 5}}));
        run("touching", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}, {2, 3}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n log n), Space O(1)',
  follow: ['Nếu cung bắn tốn chi phí khác nhau theo vị trí thì làm thế nào?', 'Làm sao trả về tọa độ các cung bắn?']
},
{
  id: 'algo-135',
  title: 'N-Queens',
  difficulty: 'hard',
  pattern: 'Backtracking',
  tags: ['backtracking', 'chess', 'search', 'bytebytego'],
  prompt: `Cho bàn cờ {{n x n}}, đặt {{n}} quân hậu sao cho không có hai quân nào tấn công nhau. Một quân hậu tấn công theo hàng ngang, hàng dọc và hai đường chéo chính/phụ. Trả về tất cả các cách sắp xếp hợp lệ dưới dạng bàn cờ ký tự, với '.' là ô trống và 'Q' là hậu.

### Ví dụ
~~~text
Input:  n = 4
Output: [[".Q..",
          "...Q",
          "Q...",
          "..Q."],
         ["..Q.",
          "Q...",
          "...Q",
          ".Q.."]]
Giải thích: có đúng 2 cách sắp xếp cho bàn cờ 4x4.

Input:  n = 1
Output: [["Q"]]
~~~

### Ràng buộc
- {{1 <= n <= 9}}`,
  hints: [
    'Mỗi hàng đặt đúng một hậu. Dùng mảng {{col[i]}} cho biết hàng i có hậu ở cột col[i].',
    'Cần theo dõi các cột, đường chéo chính (row - col không đổi) và đường chéo phụ (row + col không đổi) đã bận chưa.',
    'Cắt tỉa: khi đặt hậu ở cột c bị conflict, bỏ qua ngay thay vì đệ qua sâu hơn.'
  ],
  solution: `### Ý tưởng
Backtracking theo hàng. Với mỗi hàng, thử đặt hậu ở mỗi cột và kiểm tra xem: cột đó đã bận chưa, đường chéo chính {{(row - col)}} đã bận chưa, hay đường chéo phụ {{(row + col)}} đã bận chưa. Nếu không xung đột, đánh dấu các dải này là bận và chuyển sang hàng tiếp theo.

Để kiểm tra O(1), dùng ba tập hợp boolean: {{cols}}, {{diag1}} (chéo chính), {{diag2}} (chéo phụ). Chéo chính có chỉ số {{row - col + n - 1}} để tránh số âm; chéo phụ có chỉ số {{row + col}}.

~~~java
class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        boolean[] cols = new boolean[n];
        boolean[] diag1 = new boolean[2 * n - 1];
        boolean[] diag2 = new boolean[2 * n - 1];
        int[] placement = new int[n];
        backtrack(0, n, cols, diag1, diag2, placement, result);
        return result;
    }

    private void backtrack(int row, int n, boolean[] cols, boolean[] diag1,
                           boolean[] diag2, int[] placement, List<List<String>> result) {
        if (row == n) {
            result.add(buildBoard(placement, n));
            return;
        }
        for (int col = 0; col < n; col++) {
            int d1 = row - col + n - 1;
            int d2 = row + col;
            if (cols[col] || diag1[d1] || diag2[d2]) continue;
            cols[col] = diag1[d1] = diag2[d2] = true;
            placement[row] = col;
            backtrack(row + 1, n, cols, diag1, diag2, placement, result);
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
    }

    private List<String> buildBoard(int[] placement, int n) {
        List<String> board = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < n; j++) {
                sb.append(j == placement[i] ? 'Q' : '.');
            }
            board.add(sb.toString());
        }
        return board;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đừng dùng mảng 2D lớn để biểu diễn bàn cờ trong quá trình backtracking; chỉ cần dãy {{placement}} với O(n) bộ nhớ.
- Số lời giải cho n quân hậu tăng rất nhanh (n=8 có 92 lời giải), nên nên hỏi xem cần liệt kê hay chỉ đếm.
- Bài toán mở rộng "N-Queens II" chỉ đếm số lời giải — tối ưu bộ nhớ hơn.`,
  starter: "class Solution {\\n    public List<List<String>> solveNQueens(int n) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static int countSolutions(int n) {
        List<List<String>> result = new Solution().solveNQueens(n);
        return result.size();
    }

    public static void main(String[] args) {
        run("n=1", 1, () -> countSolutions(1));
        run("n=2", 0, () -> countSolutions(2));
        run("n=3", 0, () -> countSolutions(3));
        run("n=4", 2, () -> countSolutions(4));
        run("n=5", 10, () -> countSolutions(5));
        run("n=6", 4, () -> countSolutions(6));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n!), Space O(n)',
  follow: ['Nếu chỉ cần đếm không cần liệt kê thì tối ưu thế nào?', 'Làm sao giản lược symmetry để giảm thời gian?']
},
{
  id: 'algo-136',
  title: 'Word Search',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'matrix', 'dfs', 'bytebytego'],
  prompt: `Cho bảng ký tự {{board}} {{m x n}} và chuỗi {{word}}. Kiểm tra có thể tìm được {{word}} trong bảng bằng cách đi qua các ô kề nhau (trên/dưới/trái/phải) mà mỗi ô chỉ dùng một lần hay không.

### Ví dụ
~~~text
Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true
Giải thích: "ABCCED" đi qua bảng như sau.

Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true
~~~

### Ràng buộc
- {{m == board.length, n == board[0].length}}
- {{1 <= m, n <= 6}}
- {{1 <= word.length <= 15}}
- {{board[i][j]}} và {{word[i]}} là chữ cái in hoa hoặc thường.`,
  hints: [
    'Với mỗi ô trong bảng có ký tự bằng ký tự đầu của word, bắt đầu DFS.',
    'DFS tại (r, c, idx): nếu board[r][c] != word.charAt(idx), trả về false. Nếu idx đã cuối, trả về true.',
    'Đánh dấu ô đã dùng (ví dụ đặt thanh dấu) trước khi đệ qua 4 hướng, rồi khôi phục sau khi quay lại.'
  ],
  solution: `### Ý tưởng
DFS backtracking trên bảng 2D. Với mỗi ô {{(r, c)}} có ký tự trùng với {{word.charAt(idx)}}, thử đi qua 4 hướng lân cận. Đánh dấu ô đã dùng bằng cách thay đổi giá trị (ví dụ thành ' ') để tránh dùng lại trong cùng một đường đi, sau đó khôi phục khi backtrack.

Nếu tìm thấy {{idx == word.length() - 1}}, trả về true.

~~~java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length, n = board[0].length;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (dfs(board, word, r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true;
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(idx)) return false;
        char temp = board[r][c];
        board[r][c] = '#';
        boolean found = dfs(board, word, r + 1, c, idx + 1)
            || dfs(board, word, r - 1, c, idx + 1)
            || dfs(board, word, r, c + 1, idx + 1)
            || dfs(board, word, r, c - 1, idx + 1);
        board[r][c] = temp;
        return found;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Cần khôi phục giá trị ô đã thay đổi sau khi backtrack; nếu quên, các nhánh khác sẽ bị ảnh hưởng.
- Điều kiện dừng {{idx == word.length()}} nên kiểm tra trước khi truy cập board để tránh out-of-bound.
- Nếu word dài và bảng nhỏ, có thể tối ưu bằng cách kiểm tra số lượng ký tự trong board trước.`,
  starter: "class Solution {\\n    public boolean exist(char[][] board, String word) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("abcced", true, () -> new Solution().exist(new char[][]{{'A','B','C','E'},{'S','F','C','S'},{'A','D','E','E'}}, "ABCCED"));
        run("see", true, () -> new Solution().exist(new char[][]{{'A','B','C','E'},{'S','F','C','S'},{'A','D','E','E'}}, "SEE"));
        run("single", true, () -> new Solution().exist(new char[][]{{'A'}}, "A"));
        run("two same", true, () -> new Solution().exist(new char[][]{{'A','B'},{'C','D'}}, "AB"));
        run("not found", false, () -> new Solution().exist(new char[][]{{'A','B'},{'C','E'}}, "ABCB"));
        run("reuse fails", false, () -> new Solution().exist(new char[][]{{'A','A'}}, "AAA"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(m * n * 4^L), Space O(L) where L = word.length()',
  follow: ['Nếu cần tìm tất cả các từ trong một từ điển thì làm thế nào?', 'Làm sao xử lý nếu được phép đi chéo ngưỡng?']
},
{
  id: 'algo-137',
  title: 'Palindrome Partitioning',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'string', 'partition', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}, cắt sao cho mỗi phần đều là palindrome. Trả về tất cả cách cắt thỏa mãn.

### Ví dụ
~~~text
Input:  s = "aab"
Output: [["a","a","b"], ["aa","b"]]
Giải thích: "a","a","b" và "aa","b" đều có mỗi phần là palindrome.

Input:  s = "a"
Output: [["a"]]
~~~

### Ràng buộc
- {{1 <= s.length <= 16}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Tại mỗi vị trí, thử mọi độ dài palindrome bắt đầu từ đó: dùng hàm kiểm tra palindrome.',
    'Sau khi tìm được một đoạn palindrome, thêm vào đường đi và đệ quy phần còn lại của chuỗi.',
    'Khi đến cuối chuỗi, đường đi hiện tại là một cách cắt hợp lệ, thêm vào kết quả.'
  ],
  solution: `### Ý tưởng
Backtracking với đường đi (path) là danh sách các đoạn palindrome tính đến thời điểm hiện tại. Với mỗi vị trí {{start}}, thử mọi vị trí kết thúc {{end}} sao cho {{s[start..end]}} là palindrome. Nếu có, thêm đoạn vào path, đệ quy từ {{end + 1}}, rồi xóa để thử đoạn khác.

Khi {{start}} đạt đến cuối chuỗi, thêm bản sao của path vào kết quả.

~~~java
class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (isPalindrome(s, start, end)) {
                path.add(s.substring(start, end + 1));
                backtrack(s, end + 1, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Nên tính trước bảng {{isPal[i][j]}} để kiểm tra palindrome trong O(1) thay vì O(n) mỗi lần gọi.
- Phải sao chép path ({{new ArrayList<>(path)}}) trước khi thêm vào kết quả; nếu thêm trực tiếp list, mọi phần tử sẽ thay đổi khi backtrack.
- Số lượng kết quả tăng nhanh với độ dài chuỗi; hỏi interviewer có cần đếm hay liệt kê.`,
  starter: "class Solution {\\n    public List<List<String>> partition(String s) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }

    public static void main(String[] args) {
        run("aab", 2, () -> new Solution().partition("aab").size());
        run("single", 1, () -> new Solution().partition("a").size());
        run("all same", 8, () -> new Solution().partition("aaa").size());
        run("two", 2, () -> new Solution().partition("ab").size());
        run("all distinct", 1, () -> new Solution().partition("abc").size());
        run("palindrome", 4, () -> new Solution().partition("aba").size());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * 2^n), Space O(n)',
  follow: ['Nếu chỉ cần số lượng cách cắt thì tối ưu thế nào?', 'Làm sao tìm cách cắt có ít nhất K phần palindrome?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-138',
  title: 'Subsets',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'array', 'subset', 'bytebytego'],
  prompt: `Cho mảng số nguyên {{nums}} không có phần tử trùng. Trả về tất cả các tập con (subset) có thể tạo ra. Thứ tự các tập con và thứ tự phần tử trong tập con không quan trọng.

### Ví dụ
~~~text
Input:  nums = [1, 2, 3]
Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]

Input:  nums = [0]
Output: [[],[0]]
~~~

### Ràng buộc
- {{1 <= nums.length <= 10}}
- {{-10 <= nums[i] <= 10}}
- Mọi phần tử trong {{nums}} là duy nhất.`,
  hints: [
    'Mỗi phần tử có hai lựa chọn: chọn hoặc không chọn — đây là cấu trúc cây nhị phân tự nhiên.',
    'Dùng backtracking: tại vị trí {{i}}, thêm {{nums[i]}} vào đường đi rồi đệ quy, sau đó bỏ ra (backtrack) rồi đệ quy.',
    'Khi đã xét hết tất cả các vị trí, đường đi hiện tại là một tập con hợp lệ, thêm vào kết quả.'
  ],
  solution: `### Ý tưởng
Backtracking từng phần tử. Tại mỗi bước {{i}}, ta có hai nhánh: (1) không chọn {{nums[i]}} — chuyển sang {{i+1}}; (2) chọn {{nums[i]}} — thêm vào path, chuyển sang {{i+1}}, rồi bỏ ra sau khi quay lại. Khi {{i == n}}, path là một tập con, thêm bản sao vào kết quả.

Tổng số tập con là {{2^n}}, mỗi tập con được xây dựng trong O(n) (do sao chép), tổng thời gian {{O(n * 2^n)}}.

~~~java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        // Mỗi lần gọi, path hiện tại là một tập con hợp lệ
        result.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);             // chọn nums[i]
            backtrack(nums, i + 1, path, result);
            path.remove(path.size() - 1);  // bỏ chọn nums[i] (backtrack)
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Không cần mảng {{used}} vì ta chỉ tiến về phía trước ({{i + 1}}), tránh lặp lại.
- Phải sao chép {{path}} khi thêm vào kết quả ({{new ArrayList<>(path)}}); nếu thêm trực tiếp, mọi phần tử sẽ bị thay đổi khi backtrack.
- Thứ tự kết quả: rỗng -> size 1 -> size 2... phù hợp với ý nghĩa "chọn/không chọn".
- Nếu input có phần tử trùng (Subsets II), cần sort và bỏ qua {{nums[i] == nums[i-1]}} khi {{i > start}}.

> Senior tip: Subsets là mẫu hình của backtracking "chọn/không chọn". Trong thực tế, biến thể này dùng cho feature selection, A/B testing combinations, và configuration space exploration.`,
  starter: "class Solution {\\n    public List<List<Integer>> subsets(int[] nums) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example [1,2,3]", norm(Arrays.asList(
            Arrays.asList(),
            Arrays.asList(1),
            Arrays.asList(2),
            Arrays.asList(1, 2),
            Arrays.asList(3),
            Arrays.asList(1, 3),
            Arrays.asList(2, 3),
            Arrays.asList(1, 2, 3)
        )), () -> norm(new Solution().subsets(new int[]{1, 2, 3})));
        run("single [0]", norm(Arrays.asList(
            Arrays.asList(),
            Arrays.asList(0)
        )), () -> norm(new Solution().subsets(new int[]{0})));
        run("two elements", norm(Arrays.asList(
            Arrays.asList(),
            Arrays.asList(1),
            Arrays.asList(2),
            Arrays.asList(1, 2)
        )), () -> norm(new Solution().subsets(new int[]{1, 2})));
        run("negative", norm(Arrays.asList(
            Arrays.asList(),
            Arrays.asList(-1),
            Arrays.asList(1),
            Arrays.asList(-1, 1)
        )), () -> norm(new Solution().subsets(new int[]{-1, 1})));
        run("max length 10", 1024, () -> new Solution().subsets(new int[]{1,2,3,4,5,6,7,8,9,10}).size());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * 2^n), Space O(n)',
  follow: ['Nếu mảng có phần tử trùng (Subsets II) thì sửa thế nào?', 'Làm sao sinh tập con theo thứ từ điển (lexicographic) mà không cần sort cuối?']
},
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-139',
  title: 'Permutations',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'array', 'permutation', 'bytebytego'],
  prompt: `Cho mảng số nguyên {{nums}} không có phần tử trùng. Trả về tất cả các hoán vị (permutation) có thể tạo ra. Thứ tự các hoán vị không quan trọng.

### Ví dụ
~~~text
Input:  nums = [1, 2, 3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]

Input:  nums = [0, 1]
Output: [[0,1],[1,0]]

Input:  nums = [1]
Output: [[1]]
~~~

### Ràng buộc
- {{1 <= nums.length <= 6}}
- {{-10 <= nums[i] <= 10}}
- Mọi phần tử trong {{nums}} là duy nhất.`,
  hints: [
    'Mỗi vị trí trong hoán vị có thể đặt một phần tử chưa dùng. Dùng mảng boolean {{used}} để theo dõi.',
    'Tại mỗi bước, thử mọi phần tử chưa dùng: đánh dấu used, thêm vào path, đệ quy, sau đó bỏ dấu và xóa path (backtrack).',
    'Khi độ dài path bằng {{n}}, đã có một hoán vị hoàn chỉnh, thêm bản sao vào kết quả.'
  ],
  solution: `### Ý tưởng
Backtracking với mảng {{used}} theo dõi phần tử đã dùng. Tại mỗi bước đệ quy, duyệt qua tất cả các phần tử; nếu chưa dùng thì thêm vào path, đánh dấu used, đệ quy; sau khi quay lại thì bỏ dấu và xóa khỏi path. Khi path đạt độ dài {{n}}, thêm bản sao vào kết quả.

Số hoán vị là {{n!}}. Mỗi hoán vị tốn O(n) để copy, tổng {{O(n * n!)}}.

~~~java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(nums, new ArrayList<>(), used, result);
        return result;
    }

    private void backtrack(int[] nums, List<Integer> path, boolean[] used, List<List<Integer>> result) {
        if (path.size() == nums.length) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(nums, path, used, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Phải dùng mảng {{used}} (hoặc Set) vì thứ tự trong hoán vị quan trọng — không thể chỉ dùng {{start}} như Subsets.
- Phải sao chép {{path}} khi thêm vào kết quả ({{new ArrayList<>(path)}}); nếu thêm trực tiếp, mọi phần tử sẽ bị thay đổi khi backtrack.
- Nếu input có phần tử trùng (Permutations II), cần sort và bỏ qua {{nums[i] == nums[i-1] && !used[i-1]}}.
- Có thể hoán đổi tại chỗ (swap) để tiết kiệm bộ nhớ {{used}}, nhưng cách dùng {{used}} dễ hiểu và dễ mở rộng hơn.

> Senior tip: Permutations là bài backtracking kinh điển cho "sắp xếp". Trong production, thường gặp biến thể "tìm hoán vị tiếp theo" (next permutation) hoặc "k-th permutation" — biết thuật toán next_permutation O(n) quan trọng hơn liệt kê tất cả.`,
  starter: "class Solution {\\n    public List<List<Integer>> permute(int[] nums) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example [1,2,3]", norm(Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(1, 3, 2),
            Arrays.asList(2, 1, 3),
            Arrays.asList(2, 3, 1),
            Arrays.asList(3, 1, 2),
            Arrays.asList(3, 2, 1)
        )), () -> norm(new Solution().permute(new int[]{1, 2, 3})));
        run("two elements [0,1]", norm(Arrays.asList(
            Arrays.asList(0, 1),
            Arrays.asList(1, 0)
        )), () -> norm(new Solution().permute(new int[]{0, 1})));
        run("single [1]", norm(Arrays.asList(
            Arrays.asList(1)
        )), () -> norm(new Solution().permute(new int[]{1})));
        run("negative", norm(Arrays.asList(
            Arrays.asList(-1, 1),
            Arrays.asList(1, -1)
        )), () -> norm(new Solution().permute(new int[]{-1, 1})));
        run("max length 6", 720, () -> new Solution().permute(new int[]{1,2,3,4,5,6}).size());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(n * n!), Space O(n)',
  follow: ['Nếu mảng có phần tử trùng (Permutations II) thì sửa thế nào?', 'Làm sao tìm hoán vị thứ k (k-th permutation) mà không liệt kê tất cả?']
},
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-140',
  title: 'Combination Sum',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'array', 'combination', 'bytebytego'],
  prompt: `Cho mảng số nguyên {{candidates}} **không trùng** và số mục tiêu {{target}}. Tìm tất cả các tổ hợp (combination) các số trong {{candidates}} có tổng bằng {{target}}. Mỗi số trong {{candidates}} có thể dùng **nhiều lần**. Hai tổ hợp được coi là giống nhau nếu chứa cùng các số với cùng số lần xuất hiện (thứ tự không quan trọng).

### Ví dụ
~~~text
Input:  candidates = [2, 3, 6, 7], target = 7
Output: [[2,2,3],[7]]
Giải thích: 2+2+3=7 và 7=7.

Input:  candidates = [2, 3, 5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]
~~~

### Ràng buộc
- {{1 <= candidates.length <= 30}}
- {{1 <= candidates[i] <= 200}}
- Các phần tử trong {{candidates}} là duy nhất.
- {{1 <= target <= 500}}`,
  hints: [
    'Vì mỗi số có thể dùng nhiều lần, tại mỗi bước ta có thể chọn lại số đó hoặc chuyển sang số tiếp theo.',
    'Để tránh tổ hợp trùng lặp do thứ tự (ví dụ [2,3] và [3,2] là một), chỉ xét các số từ vị trí {{start}} trở đi — đảm bảo tổ hợp luôn không giảm.',
    'Khi tổng hiện tại vượt {{target}}, cắt tỉa (prune) ngay vì các số đều dương.'
  ],
  solution: `### Ý tưởng
Backtracking với tham số {{start}} chỉ số phần tử bắt đầu xét. Tại mỗi bước, từ {{start}} đến cuối mảng, thử thêm {{candidates[i]}} vào path. Vì được dùng nhiều lần, đệ quy tiếp tục từ {{i}} (không phải {{i+1}}). Nếu tổng bằng {{target}}, thêm bản sao path vào kết quả. Nếu tổng vượt {{target}}, break (cắt tỉa) vì mảng có thể sort trước để các số sau lớn hơn.

Sort {{candidates}} trước giúp cắt tỉa sớm hơn.

~~~java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(candidates);  // giúp cắt tỉa sớm
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] candidates, int target, int start,
                           List<Integer> path, List<List<Integer>> result) {
        if (target == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            int val = candidates[i];
            if (val > target) break;  // cắt tỉa nhờ đã sort
            path.add(val);
            backtrack(candidates, target - val, i, path, result);  // i: có thể dùng lại
            path.remove(path.size() - 1);
        }
    }
}
~~~

### Lưu ý khi phỏng vấn
- Khác với Subsets/Permutations: có tham số {{target}} giảm dần, và {{start}} chỉ tăng (không giảm) để tránh tổ hợp trùng.
- Vì số dương, {{val > target}} là điều kiện cắt tỉa hiệu quả.
- Phải sao chép {{path}} khi thêm kết quả ({{new ArrayList<>(path)}}).
- Biến thể Combination Sum II: mỗi số chỉ dùng **một lần** -> đệ quy từ {{i+1}}, và bỏ qua trùng {{candidates[i] == candidates[i-1] && i > start}}.

> Senior tip: Combination Sum là bài "unbounded knapsack" dạng liệt kê. Trong thực tế, gặp khi tìm cách thanh toán (coin change variants), resource allocation. Nếu target lớn (5000+) mà chỉ cần đếm, dùng DP đếm O(n*target) nhanh hơn backtracking rất nhiều.`,
  starter: "class Solution {\\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\\n        \\n    }\\n}",
  tests: `public class Main {

    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) {
                passed++;
                System.out.println("PASS " + name);
            } else {
                System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
            }
        } catch (Throwable t) {
            System.out.println("FAIL " + name + ": threw " + t);
        }
    }
    static void norm(List<List<Integer>> x) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : x) {
            List<Integer> r = new ArrayList<>(row);
            Collections.sort(r);
            copy.add(r);
        }
        Collections.sort(copy, (a, b) -> {
            int n = Math.min(a.size(), b.size());
            for (int i = 0; i < n; i++) {
                int c = Integer.compare(a.get(i), b.get(i));
                if (c != 0) return c;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    public static void main(String[] args) {
        run("example 1", norm(Arrays.asList(
            Arrays.asList(2, 2, 3),
            Arrays.asList(7)
        )), () -> norm(new Solution().combinationSum(new int[]{2, 3, 6, 7}, 7)));
        run("example 2", norm(Arrays.asList(
            Arrays.asList(2, 2, 2, 2),
            Arrays.asList(2, 3, 3),
            Arrays.asList(3, 5)
        )), () -> norm(new Solution().combinationSum(new int[]{2, 3, 5}, 8)));
        run("single candidate", norm(Arrays.asList(
            Arrays.asList(2, 2, 2)
        )), () -> norm(new Solution().combinationSum(new int[]{2}, 6)));
        run("target equals candidate", norm(Arrays.asList(
            Arrays.asList(5)
        )), () -> norm(new Solution().combinationSum(new int[]{2, 5}, 5)));
        run("no solution", norm(new ArrayList<>()), () -> norm(new Solution().combinationSum(new int[]{3, 5}, 7)));
        run("larger target", norm(Arrays.asList(
            Arrays.asList(1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
            Arrays.asList(1, 1, 1, 1, 1, 1, 1, 1, 2),
            Arrays.asList(1, 1, 1, 1, 1, 1, 2, 2),
            Arrays.asList(1, 1, 1, 1, 2, 2, 2),
            Arrays.asList(1, 1, 2, 2, 2, 2),
            Arrays.asList(2, 2, 2, 2, 2)
        )), () -> norm(new Solution().combinationSum(new int[]{1, 2}, 10)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  complexity: 'Time O(N^(target/min)) phấp phới, Space O(target/min)',
  follow: ['Combination Sum II: mỗi số chỉ dùng một lần thì sửa thế nào?', 'Nếu target rất lớn (5000+) mà chỉ cần số lượng cách thì dùng thuật toán nào?']
},
);
})();
