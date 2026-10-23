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
- Cẩn thận overflow khi tính {{target - nums[i]}} nếu ràng buộc lớn hơn (dùng {{long}}).`,
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
  solution: `### Ý tưởng\nDuyệt đầu vào theo thứ tự; loại chuỗi rỗng sau trim và thêm bản uppercase.\n~~~java\nclass Solution {\n    public List<String> normalize(List<String> ids) {\n        List<String> out = new ArrayList<>();\n        for (String id : ids) {\n            String value = id.trim();\n            if (!value.isEmpty()) out.add(value.toUpperCase(Locale.ROOT));\n        }\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nLocale.ROOT tránh quy tắc hoa chữ cái phụ thuộc locale máy chủ; không loại trùng nếu nghiệp vụ cần kiểm toán từng giao dịch.`,
  complexity: 'Time O(n·m), Space O(n·m)', starter: 'class Solution {\n    public List<String> normalize(List<String> ids) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main { static int p=0,t=0; static void c(String n,Object e,Object a){t++; if(Objects.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);} public static void main(String[] x){ Solution s=new Solution(); c("example",Arrays.asList("AB1","XY2"),s.normalize(Arrays.asList(" ab1 ","","Xy2"))); c("empty",Collections.emptyList(),s.normalize(Collections.emptyList())); c("spaces",Collections.emptyList(),s.normalize(Arrays.asList(" ","\\t"))); c("duplicates",Arrays.asList("A","A"),s.normalize(Arrays.asList("a","A"))); c("order",Arrays.asList("B","A"),s.normalize(Arrays.asList("b","a"))); System.out.println("RESULT "+p+"/"+t); }}`,
  follow: ['Nếu ID phân biệt hoa thường thì bạn thay đổi bước chuẩn hoá nào?']
},
{
  id: 'algo-050', title: 'Daily Transaction Totals', difficulty: 'easy', pattern: 'Hash Map', tags: ['hashmap', 'aggregation'],
  prompt: `Gộp số tiền giao dịch theo ngày. Mỗi giao dịch là [ngày, số tiền]; trả về map tổng theo ngày.\n\n### Ví dụ\n~~~text\n[["Mon", 5], ["Tue", 4], ["Mon", -2]] -> {Mon=3, Tue=4}\n~~~\n### Ràng buộc\nSố tiền nằm trong int; tổng dùng long.`,
  hints: ['Mỗi ngày là một key.', 'Dùng merge để cộng dồn.', 'Giá trị tổng cần là long để tránh overflow int.'],
  solution: `### Ý tưởng\nMap giữ tổng tích luỹ; mỗi dòng cập nhật đúng một key.\n~~~java\nclass Solution {\n    public Map<String, Long> totals(String[][] rows) {\n        Map<String, Long> out = new LinkedHashMap<>();\n        for (String[] row : rows) out.merge(row[0], Long.parseLong(row[1]), Long::sum);\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nChọn LinkedHashMap nếu kết quả cần thứ tự ngày xuất hiện; nếu ngày phải sắp chronologically, parse thành LocalDate rồi sort.`,
  complexity: 'Time O(n), Space O(d)', starter: 'class Solution {\n    public Map<String, Long> totals(String[][] rows) {\n        // TODO\n        return new LinkedHashMap<>();\n    }\n}',
  tests: `public class Main { static int p=0,t=0; static void c(String n,Object e,Object a){t++;if(Objects.deepEquals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);} public static void main(String[] z){Solution s=new Solution(); Map<String,Long> e=new LinkedHashMap<>(); e.put("Mon",3L);e.put("Tue",4L); c("example",e,s.totals(new String[][]{{"Mon","5"},{"Tue","4"},{"Mon","-2"}})); c("empty",new LinkedHashMap<>(),s.totals(new String[0][])); c("negative",Collections.singletonMap("D",-8L),s.totals(new String[][]{{"D","-8"}})); c("zero",Collections.singletonMap("D",0L),s.totals(new String[][]{{"D","3"},{"D","-3"}})); c("large",Collections.singletonMap("D",5000000000L),s.totals(new String[][]{{"D","2147483647"},{"D","2147483647"},{"D","705032706"}})); System.out.println("RESULT "+p+"/"+t); }}`,
  follow: ['Bạn sẽ xử lý dữ liệu vượt RAM theo batch thế nào?']
},
{
  id: 'algo-051', title: 'First Non-repeating Character', difficulty: 'easy', pattern: 'Hash Map / String', tags: ['string', 'frequency'],
  prompt: `Trả về index ký tự đầu tiên chỉ xuất hiện một lần trong chuỗi; nếu không có, trả -1.\n\n### Ví dụ\n~~~text\n"swiss" -> 1\n~~~\n### Ràng buộc\nChuỗi chỉ gồm chữ thường ASCII; độ dài tối đa 200000.`,
  hints: ['Cần biết tần suất trước khi chọn index.', 'Hai lượt duyệt vẫn là O(n).', 'Dùng mảng 26 phần tử cho alphabet đã giới hạn.'],
  solution: `### Ý tưởng\nĐếm tần suất rồi duyệt lại theo thứ tự ban đầu.\n~~~java\nclass Solution {\n    public int firstUnique(String s) {\n        int[] count = new int[26];\n        for (char ch : s.toCharArray()) count[ch - 'a']++;\n        for (int i = 0; i < s.length(); i++) if (count[s.charAt(i) - 'a'] == 1) return i;\n        return -1;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu Unicode grapheme được tính là một ký tự, char không đủ vì Java char là UTF-16 code unit; cần chốt rõ định nghĩa ký tự.`,
  complexity: 'Time O(n), Space O(1)', starter: 'class Solution {\n    public int firstUnique(String s) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",1,s.firstUnique("swiss"));c("empty",-1,s.firstUnique(""));c("all same",-1,s.firstUnique("zzzz"));c("first",0,s.firstUnique("abc"));c("last",4,s.firstUnique("aabbc"));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Nếu cần hỗ trợ Unicode code point thì cách đếm thay đổi ra sao?']
},
{
  id: 'algo-052', title: 'Merge Sorted Transaction Streams', difficulty: 'easy', pattern: 'Two Pointers', tags: ['array', 'merge'],
  prompt: `Trộn hai mảng số đã sắp tăng thành một mảng tăng, giữ cả phần tử trùng.\n\n### Ví dụ\n~~~text\n[1, 4] + [2, 4] -> [1, 2, 4, 4]\n~~~\n### Ràng buộc\nHai đầu vào có thể rỗng; giá trị có thể âm.`,
  hints: ['Giữ một con trỏ trên mỗi mảng.', 'Mỗi bước lấy phần tử nhỏ hơn.', 'Khi một mảng hết, chép phần còn lại.'],
  solution: `### Ý tưởng\nMỗi vòng lặp tiêu thụ ít nhất một phần tử nên tổng thời gian tuyến tính.\n~~~java\nclass Solution {\n    public int[] merge(int[] a, int[] b) {\n        int[] out = new int[a.length + b.length]; int i=0,j=0,k=0;\n        while(i<a.length && j<b.length) out[k++]=a[i]<=b[j]?a[i++]:b[j++];\n        while(i<a.length) out[k++]=a[i++];\n        while(j<b.length) out[k++]=b[j++];\n        return out;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu dữ liệu đến streaming, có thể phát từng phần tử nhưng cần backpressure khi consumer chậm.`,
  complexity: 'Time O(n + m), Space O(n + m)', starter: 'class Solution {\n    public int[] merge(int[] a, int[] b) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int[]e,int[]a){t++;if(Arrays.equals(e,a)){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+Arrays.toString(e)+" got "+Arrays.toString(a));}public static void main(String[]x){Solution s=new Solution();c("example",new int[]{1,2,4,4},s.merge(new int[]{1,4},new int[]{2,4}));c("both empty",new int[]{},s.merge(new int[]{},new int[]{}));c("one empty",new int[]{-2,0},s.merge(new int[]{},new int[]{-2,0}));c("negative",new int[]{-5,-2,1},s.merge(new int[]{-5,1},new int[]{-2}));c("many dup",new int[]{1,1,1,1},s.merge(new int[]{1,1},new int[]{1,1}));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Hai stream nếu chỉ sắp theo timestamp thì nên merge thế nào?']
},
{
  id: 'algo-053', title: 'Maximum Profit from One Trade', difficulty: 'easy', pattern: 'Array Scan', tags: ['array', 'greedy'],
  prompt: `Cho giá cổ phiếu theo ngày, chọn tối đa một lần mua rồi bán về sau để lợi nhuận lớn nhất; không giao dịch thì lợi nhuận 0.\n\n### Ví dụ\n~~~text\n[7, 1, 5, 3, 6, 4] -> 5\n~~~\n### Ràng buộc\n0 ≤ n ≤ 200000; giá không âm.`,
  hints: ['Khi đứng tại ngày bán, cần biết giá mua rẻ nhất trước đó.', 'Cập nhật min trước khi tính lợi nhuận.', 'Không cần lưu toàn bộ lịch sử ngoài giá thấp nhất và best.'],
  solution: `### Ý tưởng\nDuyệt trái sang phải, mỗi giá bán so với minimum đã thấy.\n~~~java\nclass Solution {\n    public int maxProfit(int[] prices) {\n        int low = Integer.MAX_VALUE, best = 0;\n        for (int price : prices) { low = Math.min(low, price); best = Math.max(best, price - low); }\n        return best;\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nNếu cho phép nhiều giao dịch, đây là một bài khác; cần làm rõ phí và cooldown.`,
  complexity: 'Time O(n), Space O(1)', starter: 'class Solution {\n    public int maxProfit(int[] prices) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {static int p=0,t=0;static void c(String n,int e,int a){t++;if(e==a){p++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": expected "+e+" got "+a);}public static void main(String[]x){Solution s=new Solution();c("example",5,s.maxProfit(new int[]{7,1,5,3,6,4}));c("empty",0,s.maxProfit(new int[]{}));c("single",0,s.maxProfit(new int[]{9}));c("descending",0,s.maxProfit(new int[]{9,7,3,1}));c("best late",9,s.maxProfit(new int[]{2,1,10}));System.out.println("RESULT "+p+"/"+t);}}`,
  follow: ['Nếu cần trả về cả ngày mua và bán thì xử lý tie thế nào?']
},
{
  id: 'algo-054', title: 'Balanced Brackets with Types', difficulty: 'easy', pattern: 'Stack', tags: ['stack', 'string'],
  prompt: `Kiểm tra chuỗi chỉ gồm (), [], {} có đóng mở đúng thứ tự không. Chuỗi rỗng được xem là hợp lệ.\n\n### Ví dụ\n~~~text\n{[()]} -> true; ([)] -> false\n~~~\n### Ràng buộc\nĐộ dài tối đa 200000.`,
  hints: ['Khi gặp ký tự mở, lưu loại ngoặc.', 'Ký tự đóng phải khớp với phần tử gần nhất chưa đóng.', 'Nếu stack còn phần tử sau vòng lặp thì chuỗi thiếu ngoặc đóng.'],
  solution: `### Ý tưởng\nStack mô hình hoá các ngoặc còn chờ đóng theo thứ tự LIFO.\n~~~java\nclass Solution {\n    public boolean balanced(String s) {\n        Deque<Character> st = new ArrayDeque<>();\n        for(char c:s.toCharArray()) {\n            if(c=='('||c=='['||c=='{') st.push(c);\n            else { if(st.isEmpty()) return false; char o=st.pop();\n                if((c==')'&&o!='(')||(c==']'&&o!='[')||(c=='}'&&o!='{')) return false; }\n        }\n        return st.isEmpty();\n    }\n}\n~~~\n### Lưu ý khi phỏng vấn\nArrayDeque không chấp nhận null; ở đây chỉ push char hợp lệ.`,
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
 solution:`### Ý tưởng\nHeap kích thước biểu diễn số phòng đang cần; end bằng start được tái sử dụng theo khoảng nửa mở.\n~~~java\nclass Solution { public int rooms(int[][] a){ Arrays.sort(a,Comparator.comparingInt(v->v[0])); PriorityQueue<Integer> q=new PriorityQueue<>(); for(int[] m:a){while(!q.isEmpty()&&q.peek()<=m[0])q.poll(); q.offer(m[1]);} return q.size();} }\n~~~\n### Lưu ý khi phỏng vấn\nNếu cần gán phòng cụ thể, heap nên lưu cả roomId; complexity vẫn O(n log n).`, complexity:'Time O(n log n), Space O(n)', starter:'class Solution { public int rooms(int[][] a) { return 0; } }',
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
});