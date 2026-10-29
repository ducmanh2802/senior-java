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
**Brute force:** thử mọi cặp (i, j) → O(n²). Với n = 10^4 là 5·10^7 phép so sánh, chậm.

**Nhận xét:** đứng ở phần tử {{x = nums[i]}}, số cần tìm là **phần bù** {{target - x}}. Câu hỏi "phần bù đã xuất hiện trước đó chưa, ở index nào?" trả lời được trong O(1) nếu ta lưu các số đã gặp vào {{HashMap<giá trị, index>}}.

Duyệt một lượt:
1. Tính phần bù {{target - nums[i]}}, tra trong map.
2. Có → trả {{[index của phần bù, i]}}.
3. Không → {{put(nums[i], i)}} rồi đi tiếp.

**Vì sao tra trước rồi mới put?** Để không ghép một phần tử với chính nó. Ví dụ nums=[3,...], target=6: nếu put 3 trước rồi mới tra 6-3=3 thì sẽ "tìm thấy" chính index 0.

Chạy tay nums=[2,7,11,15], target=9:
~~~text
i=0, x=2: cần 7, map {}      -> chưa có, put 2->0
i=1, x=7: cần 2, map {2:0}   -> có! trả [0, 1]
~~~

~~~java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // giá trị -> index đã gặp
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);      // phần bù đã xuất hiện chưa?
            if (j != null) return new int[]{j, i};       // j < i nên thứ tự [j, i] tăng dần
            seen.put(nums[i], i);                        // put SAU khi tra: không dùng lại chính nó
        }
        throw new IllegalArgumentException("no solution"); // đề đảm bảo không xảy ra
    }
}
~~~

### Vì sao trùng giá trị vẫn đúng?
nums=[3,3], target=6: i=0 tra 3 → chưa có, put 3→0; i=1 tra 3 → thấy index 0 → [0,1]. Nếu có nhiều số giống nhau, {{put}} ghi đè index cũ, nhưng đề chỉ có một đáp án nên không ảnh hưởng.

### Lưu ý khi phỏng vấn
- Hỏi lại: mảng đã sort chưa? Nếu đã sort thì dùng **two pointers** (trái/phải tiến dần vào giữa) để đạt O(1) bộ nhớ.
- Với ràng buộc ±10^9, {{target - nums[i]}} tối đa 2·10^9, vẫn nằm trong {{int}} (max ≈ 2,147·10^9). Nếu ràng buộc lớn hơn thì phải tính bằng {{long}}.
- {{seen.get}} trả {{Integer}} (có thể null), đừng gán vào {{int}} trực tiếp vì sẽ NullPointerException khi unboxing.

> Senior tip: Two Sum là bài hash map kinh điển; mẫu "lưu cái đã thấy để tra phần bù" xuất hiện trong đối soát giao dịch (tìm cặp ghi nợ/ghi có khớp nhau), phát hiện trùng lặp... Luôn hỏi interviewer về mảng đã sort và yêu cầu bộ nhớ để chọn giữa hash map và two pointers.`,
  starter: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // TODO\n        return new int[0];\n    }\n}",
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
  starter: "class Solution {\n    public List<String> topK(Stream<String> logs, int k) {\n        // TODO\n        return new ArrayList<>();\n    }\n}",
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
  prompt: `Hệ thống nhận danh sách mã giao dịch từ nhiều nguồn, định dạng không đồng nhất. Viết hàm chuẩn hoá: với mỗi mã, bỏ khoảng trắng đầu/cuối, chuyển thành chữ hoa; mã nào sau khi bỏ khoảng trắng mà rỗng thì loại. **Giữ nguyên thứ tự** và **giữ cả mã trùng** (mỗi dòng là một giao dịch thật).

### Ví dụ
~~~text
Input:  [" ab1 ", "", "Xy2", "  "]
Output: ["AB1", "XY2"]
~~~

### Ràng buộc
- {{0 <= ids.size() <= 10^5}}
- Mỗi mã dài tối đa 64 ký tự, gồm chữ cái ASCII, chữ số và khoảng trắng/tab ở hai đầu.`,
  hints: [
    'Duyệt danh sách một lần và tạo một List kết quả mới (không sửa list đầu vào).',
    'Với mỗi mã: {{trim()}} trước, nếu kết quả rỗng thì bỏ qua, ngược lại mới đổi sang chữ hoa.',
    'Không dùng Set để "dọn" dữ liệu: hai giao dịch trùng mã vẫn là hai dòng cần kiểm toán.'
  ],
  solution: `### Ý tưởng
Bài này kiểm tra bạn có xử lý chuỗi cẩn thận không, chứ không cần thuật toán phức tạp. Ta đi từng phần tử theo thứ tự:
1. {{trim()}} bỏ mọi ký tự khoảng trắng (space, tab...) ở hai đầu.
2. Nếu chuỗi còn lại rỗng ({{isEmpty()}}) thì đây là dòng rác, bỏ qua.
3. Ngược lại đổi sang chữ hoa bằng {{toUpperCase(Locale.ROOT)}} rồi thêm vào kết quả.

Vì chỉ thêm vào cuối List kết quả theo đúng thứ tự duyệt, thứ tự ban đầu được giữ nguyên, và mã trùng vẫn xuất hiện đủ số lần.

~~~java
class Solution {
    public List<String> normalize(List<String> ids) {
        List<String> out = new ArrayList<>(ids.size()); // cấp trước dung lượng, tránh resize nhiều lần
        for (String id : ids) {
            String value = id.trim();                    // bỏ space/tab ở hai đầu
            if (value.isEmpty()) continue;               // dòng rỗng: loại
            out.add(value.toUpperCase(Locale.ROOT));     // Locale.ROOT: kết quả không phụ thuộc máy chủ
        }
        return out;
    }
}
~~~

### Vì sao cần Locale.ROOT?
{{toUpperCase()}} không tham số dùng locale mặc định của JVM. Trên máy cấu hình tiếng Thổ Nhĩ Kỳ ({{tr-TR}}), chữ {{i}} viết hoa thành {{İ}} (có dấu chấm), nên {{"txid"}} thành {{"TXİD"}} và không khớp với {{"TXID"}} trong DB. {{Locale.ROOT}} cho kết quả giống nhau ở mọi máy.

### Lưu ý khi phỏng vấn
- Hỏi lại: mã có phân biệt hoa thường không? Có được loại trùng không? Đề này nói rõ là **không** loại trùng.
- Thời gian O(n·m) với m là độ dài trung bình của mã, vì {{trim}} và {{toUpperCase}} đều duyệt từng ký tự và tạo chuỗi mới.

> Senior tip: Chuẩn hoá dữ liệu ngay ở "cửa vào" hệ thống (controller/consumer) một lần duy nhất; nếu mỗi service tự chuẩn hoá theo cách riêng thì join giữa các hệ thống sẽ lệch nhau.`,
  complexity: 'Time O(n·m), Space O(n·m)',
  starter: 'class Solution {\n    public List<String> normalize(List<String> ids) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", Arrays.asList("AB1", "XY2"), () -> s.normalize(Arrays.asList(" ab1 ", "", "Xy2", "  ")));
        run("empty list", Collections.emptyList(), () -> s.normalize(Collections.emptyList()));
        run("only blanks and tab", Collections.emptyList(), () -> s.normalize(Arrays.asList(" ", "\\t", "")));
        run("keep duplicates", Arrays.asList("A", "A"), () -> s.normalize(Arrays.asList("a", " A ")));
        run("keep order", Arrays.asList("B", "A", "C9"), () -> s.normalize(Arrays.asList("b", "a", "c9")));
        run("inner space kept", Arrays.asList("A B"), () -> s.normalize(Arrays.asList("  a b  ")));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu mã phân biệt hoa thường thì bạn đổi bước chuẩn hoá nào?', 'Nếu input là file 50 GB thì xử lý thế nào để không hết RAM?']
},
{
  id: 'algo-050', title: 'Daily Transaction Totals', difficulty: 'easy', pattern: 'Hash Map', tags: ['hashmap', 'aggregation'],
  prompt: `Mỗi giao dịch là một cặp {{[ngày, số tiền]}} dạng chuỗi, ví dụ {{["Mon", "5"]}}. Số tiền là số nguyên, có thể âm (hoàn tiền). Trả về Map tổng số tiền theo từng ngày, giữ thứ tự ngày theo lần xuất hiện đầu tiên.

### Ví dụ
~~~text
Input:  [["Mon","5"], ["Tue","4"], ["Mon","-2"]]
Output: {Mon=3, Tue=4}
~~~

### Ràng buộc
- {{0 <= rows.length <= 10^6}}
- Mỗi số tiền nằm trong phạm vi {{int}}, nhưng **tổng** có thể vượt {{int}}, nên trả về {{Long}}.`,
  hints: [
    'Mỗi ngày là một key trong Map, value là tổng đang cộng dồn.',
    'Map.merge(key, value, Long::sum) vừa thêm key mới vừa cộng dồn key cũ trong một lệnh.',
    'Dùng LinkedHashMap để giữ thứ tự xuất hiện; parse số tiền bằng Long.parseLong để tổng không tràn.'
  ],
  solution: `### Ý tưởng
Đây là bài "group by + sum" giống câu SQL {{SELECT day, SUM(amount) ... GROUP BY day}}. Ta dùng Map: key là ngày, value là tổng hiện tại.

Duyệt từng dòng:
1. Lấy {{row[0]}} là ngày, parse {{row[1]}} thành {{long}}.
2. {{merge(day, amount, Long::sum)}}: nếu ngày chưa có trong map thì đặt value = amount; nếu đã có thì value = value cũ + amount.

Chạy tay với ví dụ: Mon=5 → Tue=4 → Mon=5+(-2)=3. Kết quả là Mon=3, Tue=4.

~~~java
class Solution {
    public Map<String, Long> totals(String[][] rows) {
        // LinkedHashMap giữ thứ tự key theo lần put đầu tiên (HashMap thì không)
        Map<String, Long> out = new LinkedHashMap<>();
        for (String[] row : rows) {
            long amount = Long.parseLong(row[1]);   // parse sang long: cộng nhiều int có thể vượt 2^31-1
            out.merge(row[0], amount, Long::sum);    // chưa có key -> put; có rồi -> cộng dồn
        }
        return out;
    }
}
~~~

### Vì sao phải dùng long?
{{Integer.MAX_VALUE}} ≈ 2,1 tỷ. Ba giao dịch 2 tỷ cộng bằng {{int}} sẽ tràn số thành số âm mà **không** báo lỗi. Với tiền, sai âm thầm còn nguy hiểm hơn exception. Trong hệ thống thật, tiền thường dùng {{long}} (đơn vị nhỏ nhất, ví dụ xu) hoặc {{BigDecimal}}, không bao giờ dùng {{double}}.

### Lưu ý khi phỏng vấn
- {{merge}} tương đương {{put(key, getOrDefault(key, 0L) + amount)}} nhưng chỉ tra map một lần.
- Nếu cần sắp theo thời gian thật, đổi key thành {{LocalDate}} và dùng {{TreeMap}} thay vì so sánh chuỗi.

> Senior tip: Khi dữ liệu không vừa RAM, làm giống MapReduce: đọc theo batch, tổng hợp cục bộ từng batch rồi gộp kết quả; hoặc đẩy việc này xuống DB bằng GROUP BY có index trên cột ngày.`,
  complexity: 'Time O(n), Space O(d) với d là số ngày khác nhau',
  starter: 'class Solution {\n    public Map<String, Long> totals(String[][] rows) {\n        // TODO\n        return new LinkedHashMap<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            boolean ok = Objects.equals(expected, actual)
                && (!(expected instanceof Map) || new ArrayList<>(((Map<?, ?>) expected).keySet()).equals(new ArrayList<>(((Map<?, ?>) actual).keySet())));
            if (ok) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static Map<String, Long> m(Object... kv) {
        Map<String, Long> r = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) r.put((String) kv[i], (Long) kv[i + 1]);
        return r;
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", m("Mon", 3L, "Tue", 4L), () -> s.totals(new String[][]{{"Mon", "5"}, {"Tue", "4"}, {"Mon", "-2"}}));
        run("empty", m(), () -> s.totals(new String[0][]));
        run("negative only", m("D", -8L), () -> s.totals(new String[][]{{"D", "-8"}}));
        run("cancel to zero", m("D", 0L), () -> s.totals(new String[][]{{"D", "3"}, {"D", "-3"}}));
        run("order of first appearance", m("Wed", 1L, "Mon", 2L), () -> s.totals(new String[][]{{"Wed", "1"}, {"Mon", "2"}}));
        run("overflow int", m("D", 5000000000L), () -> s.totals(new String[][]{{"D", "2147483647"}, {"D", "2147483647"}, {"D", "705032706"}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Bạn xử lý dữ liệu vượt RAM theo batch thế nào?', 'Nếu số tiền có phần thập phân thì đổi kiểu dữ liệu gì và vì sao không dùng double?']
},
{
  id: 'algo-051', title: 'First Non-repeating Character', difficulty: 'easy', pattern: 'Hash Map / String', tags: ['string', 'frequency'],
  prompt: `Cho chuỗi {{s}} chỉ gồm chữ thường {{a..z}}. Trả về **index** của ký tự đầu tiên chỉ xuất hiện đúng một lần; nếu không có thì trả {{-1}}.

### Ví dụ
~~~text
"swiss"  -> 1   (s xuất hiện 3 lần, 'w' là ký tự đầu tiên chỉ xuất hiện 1 lần)
"aabb"   -> -1
~~~

### Ràng buộc
- {{0 <= s.length() <= 2 * 10^5}}
- {{s}} chỉ gồm chữ cái thường ASCII.`,
  hints: [
    'Khi đứng ở một ký tự, bạn chưa biết phía sau nó còn lặp lại không. Vậy cần biết tần suất của mọi ký tự trước.',
    'Lượt 1: đếm tần suất. Lượt 2: duyệt lại theo thứ tự, ký tự đầu tiên có tần suất 1 là đáp án. Hai lượt vẫn là O(n).',
    'Bảng chữ cái chỉ có 26 ký tự, nên dùng {{int[26]}} thay cho HashMap: nhanh hơn và không boxing.'
  ],
  solution: `### Ý tưởng
Làm hai lượt duyệt:
1. **Đếm**: {{count[ch - 'a']++}}. Phép {{ch - 'a'}} đổi ký tự thành số 0..25 ('a'→0, 'b'→1...), dùng làm index mảng.
2. **Tìm**: duyệt lại từ trái sang phải, trả index đầu tiên có {{count == 1}}.

Vì sao không làm được trong một lượt? Với {{"swiss"}}, khi gặp 's' ở index 0, ta chưa biết còn hai chữ 's' nữa phía sau. Chỉ sau khi đếm xong mới biết.

Chạy tay {{"swiss"}}: count[s]=3, count[w]=1, count[i]=1. Duyệt lại: index 0 's' (3) → bỏ; index 1 'w' (1) → trả **1**.

~~~java
class Solution {
    public int firstUnique(String s) {
        int[] count = new int[26];                  // count[0] cho 'a', count[25] cho 'z'
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;              // lượt 1: đếm tần suất
        }
        for (int i = 0; i < s.length(); i++) {
            if (count[s.charAt(i) - 'a'] == 1) return i; // lượt 2: giữ đúng thứ tự gốc
        }
        return -1;                                   // không có ký tự nào xuất hiện đúng 1 lần
    }
}
~~~

### Vì sao Space là O(1)?
Mảng luôn có 26 phần tử, không phụ thuộc độ dài chuỗi. Nếu bảng chữ cái không giới hạn (Unicode) thì phải dùng {{HashMap<Integer, Integer>}} và Space thành O(k) với k là số ký tự khác nhau.

### Lưu ý khi phỏng vấn
- {{char}} trong Java là một UTF-16 code unit. Emoji hay một số chữ Hán chiếm **hai** char, nên nếu đề có Unicode thì phải duyệt bằng {{s.codePoints()}}.
- Hỏi lại "ký tự" có phân biệt hoa thường không.

> Senior tip: Nếu đề chuyển thành stream ký tự vô hạn (hỏi "ký tự không lặp đầu tiên tính đến giờ"), hãy dùng {{LinkedHashMap}} hoặc mảng đếm + hàng đợi các ứng viên; mỗi ký tự mới chỉ tốn O(1).`,
  complexity: 'Time O(n), Space O(1) (mảng 26 phần tử)',
  starter: 'class Solution {\n    public int firstUnique(String s) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 1, () -> s.firstUnique("swiss"));
        run("no unique", -1, () -> s.firstUnique("aabb"));
        run("empty", -1, () -> s.firstUnique(""));
        run("single char", 0, () -> s.firstUnique("z"));
        run("first index", 0, () -> s.firstUnique("abc"));
        run("last index", 4, () -> s.firstUnique("aabbc"));
        run("large", 199999, () -> { StringBuilder b = new StringBuilder(); for (int i = 0; i < 99999; i++) b.append("ab"); b.append("aac"); return s.firstUnique(b.toString().substring(1)); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần hỗ trợ Unicode code point thì cách đếm thay đổi ra sao?', 'Nếu ký tự đến dạng stream và cần trả lời sau mỗi ký tự thì sao?']
},
{
  id: 'algo-052', title: 'Merge Sorted Transaction Streams', difficulty: 'easy', pattern: 'Two Pointers', tags: ['array', 'merge'],
  prompt: `Hai hệ thống gửi về hai mảng giá trị giao dịch, mỗi mảng **đã sắp tăng dần**. Trộn thành một mảng tăng dần duy nhất, giữ cả phần tử trùng.

### Ví dụ
~~~text
a = [1, 4], b = [2, 4]  -> [1, 2, 4, 4]
a = [],     b = [-2, 0] -> [-2, 0]
~~~

### Ràng buộc
- {{0 <= a.length, b.length <= 10^5}}; mảng có thể rỗng; giá trị có thể âm.
- Yêu cầu O(n + m), không được nối hai mảng rồi sort lại.`,
  hints: [
    'Đặt một con trỏ ở đầu mỗi mảng. Phần tử nhỏ nhất chưa lấy luôn nằm ở một trong hai con trỏ.',
    'Mỗi bước so sánh a[i] với b[j], chép phần tử nhỏ hơn vào kết quả rồi tăng con trỏ tương ứng.',
    'Khi một mảng đã hết, phần còn lại của mảng kia đã sắp sẵn: chép thẳng vào cuối.'
  ],
  solution: `### Ý tưởng
Đây chính là bước "merge" của Merge Sort. Ba con trỏ: {{i}} trên {{a}}, {{j}} trên {{b}}, {{k}} là vị trí ghi tiếp theo trong {{out}}.

Vì cả hai mảng đã tăng dần, phần tử nhỏ nhất **chưa được lấy** chắc chắn là {{a[i]}} hoặc {{b[j]}}. So sánh hai giá trị, lấy cái nhỏ hơn, tiến con trỏ đó. Lặp đến khi một mảng hết, rồi chép phần còn lại.

Chạy tay a=[1,4], b=[2,4]:
~~~text
i=0,j=0: 1 vs 2 -> lấy 1   out=[1]
i=1,j=0: 4 vs 2 -> lấy 2   out=[1,2]
i=1,j=1: 4 vs 4 -> lấy a   out=[1,2,4]   (dùng <= nên lấy a trước: merge ổn định)
a hết -> chép b còn lại     out=[1,2,4,4]
~~~

~~~java
class Solution {
    public int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) {
            if (a[i] <= b[j]) out[k++] = a[i++];   // <= : khi bằng nhau ưu tiên a (stable)
            else out[k++] = b[j++];
        }
        while (i < a.length) out[k++] = a[i++];     // chỉ một trong hai vòng này thực sự chạy
        while (j < b.length) out[k++] = b[j++];
        return out;
    }
}
~~~

### Vì sao O(n + m)?
Mỗi lần lặp ghi đúng một phần tử vào {{out}} và tăng {{k}}; {{out}} có n + m ô nên tổng số lần lặp là n + m. Nối hai mảng rồi {{Arrays.sort}} tốn O((n+m) log(n+m)) và bỏ phí thông tin "đã sắp sẵn".

### Lưu ý khi phỏng vấn
- Hỏi rõ có giữ phần tử trùng không (đề này: có).
- Dùng {{<=}} để merge ổn định: quan trọng khi phần tử là object (giao dịch cùng timestamp giữ thứ tự nguồn).

> Senior tip: Khi trộn K stream (Kafka partition, file log đã sort), dùng {{PriorityQueue}} chứa đầu mỗi stream: O(N log K) và chỉ giữ K phần tử trong RAM, thay vì đọc hết vào mảng.`,
  complexity: 'Time O(n + m), Space O(n + m) cho mảng kết quả',
  starter: 'class Solution {\n    public int[] merge(int[] a, int[] b) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, int[] expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + Arrays.toString(expected) + " got " + (actual instanceof int[] ? Arrays.toString((int[]) actual) : actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", new int[]{1, 2, 4, 4}, () -> s.merge(new int[]{1, 4}, new int[]{2, 4}));
        run("both empty", new int[]{}, () -> s.merge(new int[]{}, new int[]{}));
        run("a empty", new int[]{-2, 0}, () -> s.merge(new int[]{}, new int[]{-2, 0}));
        run("b empty", new int[]{3, 5}, () -> s.merge(new int[]{3, 5}, new int[]{}));
        run("negative", new int[]{-5, -2, 1}, () -> s.merge(new int[]{-5, 1}, new int[]{-2}));
        run("all duplicates", new int[]{1, 1, 1, 1}, () -> s.merge(new int[]{1, 1}, new int[]{1, 1}));
        run("b all smaller", new int[]{1, 2, 7, 8}, () -> s.merge(new int[]{7, 8}, new int[]{1, 2}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Trộn K stream đã sắp xếp thì dùng cấu trúc gì và độ phức tạp ra sao?', 'Nếu a có đủ chỗ trống ở cuối, làm sao merge in-place không tốn thêm mảng?']
},
{
  id: 'algo-053', title: 'Maximum Profit from One Trade', difficulty: 'easy', pattern: 'Array Scan', tags: ['array', 'greedy'],
  prompt: `Cho {{prices[i]}} là giá cổ phiếu ngày {{i}}. Bạn được mua **tối đa một lần** và bán ở một ngày **sau** ngày mua. Trả lợi nhuận lớn nhất; nếu không có cách nào có lãi thì trả {{0}} (không giao dịch).

### Ví dụ
~~~text
[7, 1, 5, 3, 6, 4] -> 5   (mua ngày 1 giá 1, bán ngày 4 giá 6)
[7, 6, 4, 3, 1]    -> 0   (giá chỉ giảm, không giao dịch)
~~~

### Ràng buộc
- {{0 <= prices.length <= 2 * 10^5}}
- {{0 <= prices[i] <= 10^4}}`,
  hints: [
    'Brute force thử mọi cặp (mua i, bán j > i) là O(n²). Hãy cố định ngày bán thay vì cặp.',
    'Nếu bán ở ngày j, giá mua tốt nhất là giá **thấp nhất** trong các ngày trước j.',
    'Duyệt một lần, giữ {{minPrice}} đã thấy và {{best}} lợi nhuận; cập nhật min trước rồi tính {{price - minPrice}}.'
  ],
  solution: `### Ý tưởng
Đổi góc nhìn: thay vì thử mọi cặp (mua, bán), hãy hỏi "nếu **bán hôm nay** thì lãi tối đa bao nhiêu?". Câu trả lời là giá hôm nay trừ giá thấp nhất đã gặp trước đó. Lấy max của câu trả lời qua mọi ngày là xong.

Chạy tay [7,1,5,3,6,4]:
~~~text
giá:   7   1   5   3   6   4
min:   7   1   1   1   1   1
lãi:   0   0   4   2   5   3     -> best = 5
~~~

~~~java
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE; // giá mua thấp nhất tính đến hôm nay
        int best = 0;                     // 0 = không giao dịch, nên không bao giờ âm
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);         // có thể "mua" hôm nay
            best = Math.max(best, price - minPrice);       // nếu bán hôm nay thì lãi bao nhiêu
        }
        return best;
    }
}
~~~

### Vì sao cập nhật min trước vẫn đúng?
Nếu hôm nay là giá thấp nhất mới, {{price - minPrice = 0}}, tức "mua và bán cùng ngày", lãi 0, không làm sai {{best}}. Nhờ vậy code không cần xử lý riêng ngày đầu tiên hay mảng rỗng.

### Lưu ý khi phỏng vấn
- Hỏi lại: được giao dịch nhiều lần không? Có phí? Có cooldown? Mỗi biến thể là một bài khác (nhiều lần: cộng mọi đoạn tăng; k lần: DP).
- Nếu cần trả cả ngày mua/bán, lưu thêm index của min và của lần cập nhật best.

> Senior tip: Mẫu "giữ cực trị của phần đã duyệt" (running min/max) xuất hiện rất nhiều: tính drawdown lớn nhất của danh mục, độ trễ tăng mạnh nhất so với baseline... Nhận ra mẫu này giúp đổi O(n²) thành O(n).`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public int maxProfit(int[] prices) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 5, () -> s.maxProfit(new int[]{7, 1, 5, 3, 6, 4}));
        run("descending", 0, () -> s.maxProfit(new int[]{7, 6, 4, 3, 1}));
        run("empty", 0, () -> s.maxProfit(new int[]{}));
        run("single day", 0, () -> s.maxProfit(new int[]{9}));
        run("min after max", 9, () -> s.maxProfit(new int[]{2, 1, 10}));
        run("later lower min", 6, () -> s.maxProfit(new int[]{3, 8, 1, 7}));
        run("large", 199999, () -> { int[] a = new int[200000]; for (int i = 0; i < a.length; i++) a[i] = i; return s.maxProfit(a); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần trả về cả ngày mua và bán thì xử lý tie thế nào?', 'Nếu được giao dịch không giới hạn số lần thì lời giải thay đổi ra sao?']
},
{
  id: 'algo-054', title: 'Balanced Brackets with Types', difficulty: 'easy', pattern: 'Stack', tags: ['stack', 'string'],
  prompt: `Cho chuỗi {{s}} chỉ gồm các ký tự ngoặc ( ) [ ] và { }. Chuỗi hợp lệ khi mỗi ngoặc mở được đóng bởi **đúng loại** ngoặc và **đúng thứ tự** (ngoặc mở sau phải đóng trước). Chuỗi rỗng là hợp lệ.

### Ví dụ
~~~text
"{[()]}" -> true
"([)]"   -> false   ( '[' chưa đóng mà đã gặp ')' )
"(("     -> false   (thiếu ngoặc đóng)
~~~

### Ràng buộc
- {{0 <= s.length() <= 2 * 10^5}}`,
  hints: [
    'Ngoặc đóng phải khớp với ngoặc mở **gần nhất chưa được đóng**. Cấu trúc nào cho bạn phần tử "vào sau, ra trước"?',
    'Gặp ngoặc mở: push vào stack. Gặp ngoặc đóng: stack rỗng → sai; pop ra và kiểm tra đúng loại.',
    'Duyệt xong mà stack vẫn còn phần tử nghĩa là còn ngoặc mở chưa đóng → sai.'
  ],
  solution: `### Ý tưởng
Ngoặc lồng nhau theo kiểu "mở sau đóng trước" (LIFO), đúng bản chất của **stack**. Stack chứa các ngoặc mở đang chờ được đóng; đỉnh stack là ngoặc mở gần nhất.

Ba trường hợp sai:
1. Gặp ngoặc đóng khi stack rỗng (đóng mà chưa mở), ví dụ {{")("}}.
2. Ngoặc đóng khác loại với đỉnh stack, ví dụ {{"([)]"}}: gặp {{)}} nhưng đỉnh là {{[}}.
3. Hết chuỗi mà stack còn phần tử, ví dụ {{"(("}}.

Chạy tay với chuỗi "{[()]}":
~~~text
{  push      stack: {
[  push      stack: { [
(  push      stack: { [ (
)  pop ( OK  stack: { [
]  pop [ OK  stack: {
}  pop { OK  stack: (rỗng) -> true
~~~

~~~java
class Solution {
    public boolean balanced(String s) {
        Deque<Character> stack = new ArrayDeque<>(); // ArrayDeque nhanh hơn lớp Stack cũ (synchronized)
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);                        // ngoặc mở: chờ được đóng
            } else {
                if (stack.isEmpty()) return false;    // đóng mà không có gì để đóng
                char open = stack.pop();              // ngoặc mở gần nhất
                if (c == ')' && open != '(') return false;
                if (c == ']' && open != '[') return false;
                if (c == '}' && open != '{') return false;
            }
        }
        return stack.isEmpty();                       // còn ngoặc mở thừa -> sai
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{Deque}}/{{ArrayDeque}} chứ không dùng {{java.util.Stack}}: {{Stack}} kế thừa {{Vector}}, mọi method đều synchronized, chậm và là API cũ.
- Tối ưu nhỏ: chuỗi độ dài lẻ chắc chắn sai, có thể return false ngay.
- Có thể thay chuỗi if bằng một {{Map<Character, Character>}} ánh xạ ngoặc đóng sang ngoặc mở để code gọn khi có nhiều loại ngoặc.

> Senior tip: Cùng ý tưởng stack này dùng để validate JSON/XML lồng nhau, kiểm tra cặp BEGIN/COMMIT trong log transaction, hay parser biểu thức. Nhớ đặt giới hạn độ sâu khi xử lý input không tin cậy để tránh tấn công "nesting bomb".`,
  complexity: 'Time O(n), Space O(n)',
  starter: 'class Solution {\n    public boolean balanced(String s) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("nested", true, () -> s.balanced("{[()]}"));
        run("crossed", false, () -> s.balanced("([)]"));
        run("empty", true, () -> s.balanced(""));
        run("close first", false, () -> s.balanced(")("));
        run("unclosed", false, () -> s.balanced("(("));
        run("wrong type", false, () -> s.balanced("(]"));
        run("sequence", true, () -> s.balanced("()[]{}"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu chuỗi có cả ký tự thường và chỉ cần bỏ qua chúng thì thay đổi gì?', 'Làm sao trả về vị trí ký tự gây lỗi đầu tiên để báo cho người dùng?']
},
{
  id: 'algo-055', title: 'Longest Window Under Budget', difficulty: 'medium', pattern: 'Sliding Window', tags: ['array', 'window'],
  prompt: `Cho mảng chi phí theo ngày {{a}} (mọi phần tử **không âm**) và ngân sách {{budget}}. Tìm độ dài đoạn ngày **liên tiếp** dài nhất có tổng chi phí {{<= budget}}. Không có đoạn nào thoả thì trả {{0}}.

### Ví dụ
~~~text
a = [2, 1, 3, 2], budget = 4 -> 2   ([2,1] tổng 3 hoặc [1,3] tổng 4)
a = [5, 6],       budget = 2 -> 0
~~~

### Ràng buộc
- {{0 <= a.length <= 2 * 10^5}}
- {{0 <= a[i] <= 10^4}}, {{0 <= budget <= 10^9}}`,
  hints: [
    'Brute force thử mọi cặp (l, r) là O(n²). Hãy tận dụng việc mọi phần tử không âm.',
    'Giữ cửa sổ [l, r] và tổng của nó. Mỗi bước mở rộng r; nếu tổng vượt budget thì tăng l (bỏ phần tử bên trái) cho đến khi hợp lệ.',
    'Vì phần tử không âm, bỏ phần tử bên trái chỉ làm tổng giảm hoặc giữ nguyên, nên l không bao giờ cần lùi lại: mỗi phần tử vào và ra cửa sổ tối đa một lần.'
  ],
  solution: `### Ý tưởng
Dùng **sliding window** (cửa sổ trượt) hai con trỏ {{l}} và {{r}}:
1. Tăng {{r}} để đưa {{a[r]}} vào cửa sổ, cộng vào {{sum}}.
2. Trong khi {{sum > budget}}: bỏ {{a[l]}} ra khỏi cửa sổ và tăng {{l}}.
3. Lúc này cửa sổ [l, r] hợp lệ, cập nhật {{best = max(best, r - l + 1)}}.

**Vì sao đúng?** Mọi phần tử không âm nên tổng là **đơn điệu**: mở rộng cửa sổ chỉ làm tổng tăng, thu hẹp chỉ làm tổng giảm. Nếu [l, r] đã vượt ngân sách thì mọi cửa sổ [l, r'] với r' > r cũng vượt, nên bỏ hẳn l là an toàn, không bỏ sót đáp án.

Chạy tay a=[2,1,3,2], budget=4:
~~~text
r=0: sum=2          [2]      best=1
r=1: sum=3          [2,1]    best=2
r=2: sum=6 > 4 -> bỏ 2, sum=4  [1,3]  best=2
r=3: sum=6 > 4 -> bỏ 1, sum=5 > 4 -> bỏ 3, sum=2  [2]  best=2
~~~

~~~java
class Solution {
    public int longest(int[] a, int budget) {
        int l = 0, best = 0;
        long sum = 0;                          // long: tổng 2*10^5 * 10^4 = 2*10^9 vượt int
        for (int r = 0; r < a.length; r++) {
            sum += a[r];                       // mở rộng cửa sổ sang phải
            while (sum > budget) {             // vượt ngân sách -> thu hẹp từ trái
                sum -= a[l];
                l++;
            }
            best = Math.max(best, r - l + 1);  // cửa sổ [l, r] hợp lệ (có thể rỗng khi l = r + 1)
        }
        return best;
    }
}
~~~

### Vì sao O(n) dù có vòng while lồng trong for?
{{l}} chỉ tăng, tối đa n lần trong **toàn bộ** chương trình, không phải n lần cho mỗi r. Tổng số bước của cả hai con trỏ ≤ 2n.

### Lưu ý khi phỏng vấn
- Nếu mảng có số âm, tổng không còn đơn điệu nên sliding window **sai**; khi đó dùng prefix sum + cấu trúc tìm kiếm (ví dụ prefix sum + monotonic deque hoặc TreeMap).
- Khi phần tử lớn hơn budget, cửa sổ co về rỗng (l = r + 1), độ dài 0, code vẫn đúng không cần xử lý riêng.

> Senior tip: Sliding window dùng nhiều trong thực tế: rate limiting theo khoảng thời gian, tính trung bình động latency, phát hiện burst giao dịch. Điều kiện để dùng được luôn là "co/giãn cửa sổ làm đại lượng thay đổi đơn điệu".`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public int longest(int[] a, int budget) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.longest(new int[]{2, 1, 3, 2}, 4));
        run("empty", 0, () -> s.longest(new int[]{}, 5));
        run("all fit", 3, () -> s.longest(new int[]{1, 1, 1}, 3));
        run("none fit", 0, () -> s.longest(new int[]{5, 6}, 2));
        run("zeros", 4, () -> s.longest(new int[]{0, 0, 2, 0}, 2));
        run("budget zero", 2, () -> s.longest(new int[]{1, 0, 0, 3}, 0));
        run("best at end", 3, () -> s.longest(new int[]{9, 1, 2, 1}, 4));
        run("large", 200000, () -> { int[] a = new int[200000]; Arrays.fill(a, 10000); return s.longest(a, 2000000000); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu chi phí có thể âm, bạn chọn cách tiếp cận nào?', 'Nếu cần đếm số đoạn có tổng <= budget thay vì độ dài lớn nhất thì sửa thế nào?']
},
{
  id: 'algo-056', title: 'Count Subarrays with Target Sum', difficulty: 'medium', pattern: 'Prefix Sum / Hash Map', tags: ['prefix-sum', 'hashmap'],
  prompt: `Cho mảng số nguyên {{a}} (có thể có số **âm** và số 0) và {{target}}. Đếm số đoạn con **liên tiếp, không rỗng** có tổng đúng bằng {{target}}.

### Ví dụ
~~~text
a = [1, 1, 1],      target = 2 -> 2   ([1,1] ở vị trí 0-1 và 1-2)
a = [1, -1, 1, -1], target = 0 -> 4
~~~

### Ràng buộc
- {{0 <= a.length <= 2 * 10^5}}
- {{-10^4 <= a[i] <= 10^4}}; kết quả có thể rất lớn nên trả về {{long}}.`,
  hints: [
    'Sliding window không dùng được vì có số âm (tổng không đơn điệu). Hãy nghĩ tới prefix sum.',
    'Gọi P(j) là tổng a[0..j]. Tổng đoạn (i, j] = P(j) - P(i). Đoạn có tổng target khi P(i) = P(j) - target.',
    'Duyệt từ trái, dùng HashMap đếm số lần mỗi giá trị prefix đã xuất hiện; khởi tạo map với prefix 0 xuất hiện 1 lần (đoạn bắt đầu từ index 0).'
  ],
  solution: `### Ý tưởng
**Prefix sum**: {{P(j) = a[0] + ... + a[j]}}, quy ước {{P(-1) = 0}}. Tổng đoạn từ i+1 đến j bằng {{P(j) - P(i)}}.

Đoạn kết thúc tại j có tổng target ⇔ {{P(i) = P(j) - target}} với một i < j nào đó. Vậy khi đứng ở j, số đoạn hợp lệ kết thúc tại j = **số lần giá trị {{P(j) - target}} đã xuất hiện** trong các prefix trước đó. HashMap trả lời câu hỏi này trong O(1).

Thứ tự quan trọng: **đếm trước, ghi nhận prefix hiện tại sau**, để không ghép prefix với chính nó (tạo đoạn rỗng).

Chạy tay a=[1,1,1], target=2 (map khởi tạo {0:1}):
~~~text
j=0: sum=1, cần 1-2=-1 -> 0 đoạn  map {0:1, 1:1}
j=1: sum=2, cần 0      -> 1 đoạn  map {0:1, 1:1, 2:1}
j=2: sum=3, cần 1      -> 1 đoạn  map {..., 3:1}      tổng = 2
~~~

~~~java
class Solution {
    public long count(int[] a, int target) {
        Map<Long, Long> seen = new HashMap<>(); // giá trị prefix -> số lần đã xuất hiện
        seen.put(0L, 1L);                       // P(-1) = 0: cho phép đoạn bắt đầu từ index 0
        long sum = 0, ans = 0;
        for (int v : a) {
            sum += v;                                       // sum = P(j)
            ans += seen.getOrDefault(sum - target, 0L);     // số i có P(i) = P(j) - target
            seen.merge(sum, 1L, Long::sum);                 // ghi nhận P(j) SAU khi đếm
        }
        return ans;
    }
}
~~~

### Vì sao kết quả dùng long?
Với mảng toàn số 0 và target = 0, **mọi** đoạn đều hợp lệ: n(n+1)/2 ≈ 2*10^10 đoạn khi n = 2*10^5, vượt {{int}}.

### Lưu ý khi phỏng vấn
- Đây là mẫu "prefix sum + hash map" kinh điển (LeetCode 560). Nhận diện: đếm đoạn con có tổng/XOR bằng K, mảng có số âm.
- Key của map là {{Long}}: nhớ {{0L}} chứ không phải {{0}}, nếu không {{get(0)}} sẽ tìm key Integer và luôn trả null.

> Senior tip: Cùng ý tưởng "hiệu hai prefix" giúp trả lời nhanh các câu hỏi khoảng thời gian trên dữ liệu tích luỹ, ví dụ số dư tài khoản giữa hai thời điểm = hiệu hai snapshot số dư cộng dồn, thay vì cộng lại từng giao dịch.`,
  complexity: 'Time O(n), Space O(n)',
  starter: 'class Solution {\n    public long count(int[] a, int target) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2L, () -> s.count(new int[]{1, 1, 1}, 2));
        run("empty", 0L, () -> s.count(new int[]{}, 0));
        run("negative", 4L, () -> s.count(new int[]{1, -1, 1, -1}, 0));
        run("zeros", 6L, () -> s.count(new int[]{0, 0, 0}, 0));
        run("single", 1L, () -> s.count(new int[]{5}, 5));
        run("none", 0L, () -> s.count(new int[]{1, 2, 3}, 7));
        run("mixed", 4L, () -> s.count(new int[]{3, 4, 7, 2, -3, 1, 4, 2}, 7));
        run("large all zero", 20000100000L, () -> s.count(new int[200000], 0));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Vì sao sliding window không tổng quát cho số âm?', 'Nếu cần tìm đoạn DÀI NHẤT có tổng bằng target thì map lưu gì?']
},
{
  id: 'algo-057', title: 'Merge Booking Intervals', difficulty: 'medium', pattern: 'Intervals', tags: ['sort', 'interval'],
  prompt: `Hệ thống đặt phòng có danh sách khoảng thời gian {{[start, end]}} (khoảng **đóng**, start ≤ end), chưa sắp xếp. Gộp mọi khoảng **chồng lấn hoặc chạm nhau** (ví dụ [1,3] và [3,5]) và trả danh sách đã sắp theo start.

### Ví dụ
~~~text
[[1,3],[3,5],[8,9]] -> [[1,5],[8,9]]
[[7,9],[1,2],[2,4]] -> [[1,4],[7,9]]
~~~

### Ràng buộc
- {{0 <= intervals.length <= 10^5}}
- {{0 <= start <= end <= 10^9}}`,
  hints: [
    'Nếu các khoảng nằm lộn xộn, khó biết khoảng nào gộp với khoảng nào. Sắp xếp theo start trước.',
    'Sau khi sort, một khoảng mới chỉ có thể gộp với khoảng **cuối cùng** trong kết quả.',
    'Nếu start mới <= end cuối thì kéo end cuối = max(end cuối, end mới); ngược lại thêm khoảng mới vào kết quả.'
  ],
  solution: `### Ý tưởng
1. Sắp xếp theo {{start}} tăng dần.
2. Duyệt lần lượt, giữ danh sách kết quả {{out}}. Gọi {{last}} là khoảng cuối của {{out}}.
   - Nếu {{cur.start <= last.end}}: chồng lấn hoặc chạm → gộp: {{last.end = max(last.end, cur.end)}}.
   - Ngược lại: không giao → thêm bản sao của {{cur}} vào {{out}}.

**Vì sao chỉ cần so với khoảng cuối?** Sau khi sort, mọi khoảng trong {{out}} trừ khoảng cuối đều kết thúc trước {{last.start}} ≤ {{cur.start}}, nên không thể giao với {{cur}}.

Vì sao dùng {{max}}? Khoảng mới có thể nằm **gọn bên trong** khoảng cũ, ví dụ [1,10] rồi [2,3]: end phải giữ 10, không được thành 3.

~~~java
class Solution {
    public int[][] merge(int[][] intervals) {
        int[][] a = intervals.clone();                     // không sắp xếp trên mảng của caller
        Arrays.sort(a, Comparator.comparingInt(x -> x[0])); // sort theo start
        List<int[]> out = new ArrayList<>();
        for (int[] cur : a) {
            if (out.isEmpty() || cur[0] > out.get(out.size() - 1)[1]) {
                out.add(new int[]{cur[0], cur[1]});        // không giao: mở khoảng mới (copy)
            } else {
                int[] last = out.get(out.size() - 1);
                last[1] = Math.max(last[1], cur[1]);       // giao/chạm: kéo dài end
            }
        }
        return out.toArray(new int[0][]);
    }
}
~~~

### Lưu ý khi phỏng vấn
- **Hỏi khoảng đóng hay nửa mở.** Với lịch họp {{[start, end)}}, [1,3) và [3,5) không chồng lấn; có gộp hay không là quyết định nghiệp vụ. Đề này coi chạm nhau là gộp ({{>}} chứ không phải {{>=}}).
- {{intervals.clone()}} chỉ copy mảng ngoài (shallow), đủ để sort không làm đổi thứ tự mảng của caller; vì ta tạo {{new int[]}} khi thêm vào {{out}} nên cũng không sửa mảng con.
- Comparator dùng {{Integer.compare}}/{{comparingInt}}, không dùng {{x[0] - y[0]}} vì có thể tràn số với giá trị âm lớn.

> Senior tip: Trong hệ thống đặt chỗ thật, kiểm tra chồng lấn nên làm trong DB để tránh race condition: PostgreSQL có exclusion constraint với kiểu tsrange ({{EXCLUDE USING gist}}) chặn hai booking giao nhau ngay cả khi hai request chạy đồng thời.`,
  complexity: 'Time O(n log n), Space O(n)',
  starter: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        // TODO\n        return new int[0][];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, int[][] expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + Arrays.deepToString(expected) + " got " + (actual instanceof int[][] ? Arrays.deepToString((int[][]) actual) : actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", new int[][]{{1, 5}, {8, 9}}, () -> s.merge(new int[][]{{1, 3}, {3, 5}, {8, 9}}));
        run("empty", new int[][]{}, () -> s.merge(new int[][]{}));
        run("one", new int[][]{{2, 4}}, () -> s.merge(new int[][]{{2, 4}}));
        run("nested", new int[][]{{1, 10}}, () -> s.merge(new int[][]{{1, 10}, {2, 3}, {4, 8}}));
        run("unordered", new int[][]{{1, 4}, {7, 9}}, () -> s.merge(new int[][]{{7, 9}, {1, 2}, {2, 4}}));
        run("point intervals", new int[][]{{0, 0}, {2, 2}}, () -> s.merge(new int[][]{{2, 2}, {0, 0}, {0, 0}}));
        run("chain", new int[][]{{1, 6}}, () -> s.merge(new int[][]{{5, 6}, {1, 2}, {2, 3}, {3, 5}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Lịch họp dùng khoảng [start,end) thì điều kiện gộp đổi thế nào?', 'Nếu booking được thêm liên tục, bạn dùng cấu trúc gì để chèn và gộp nhanh hơn sort lại mỗi lần?']
},
{
  id: 'algo-058', title: 'Minimum Meeting Rooms', difficulty: 'medium', pattern: 'Heap / Intervals', tags: ['heap', 'scheduling'],
  prompt: `Cho các cuộc họp dạng {{[start, end)}} (nửa mở: họp kết thúc lúc 10 thì phòng dùng lại được cho cuộc bắt đầu lúc 10). Tìm **số phòng ít nhất** để không có hai cuộc họp chồng lấn trong cùng phòng.

### Ví dụ
~~~text
[[0,30],[5,10],[15,20]] -> 2
[[0,2],[2,4],[4,5]]     -> 1   (nối tiếp, dùng chung 1 phòng)
~~~

### Ràng buộc
- {{0 <= meetings.length <= 10^5}}
- {{0 <= start < end <= 10^9}}`,
  hints: [
    'Xử lý các cuộc họp theo giờ bắt đầu tăng dần, giống như thời gian trôi.',
    'Khi một cuộc họp mới bắt đầu, chỉ cần biết phòng nào **kết thúc sớm nhất**: nếu phòng đó đã trống thì dùng lại được. Cấu trúc nào lấy min nhanh?',
    'Min-heap chứa giờ kết thúc của các phòng đang bận. Trước khi thêm cuộc họp mới, poll mọi phòng có end <= start. Kích thước heap lớn nhất là đáp án.'
  ],
  solution: `### Ý tưởng
Mô phỏng theo thời gian:
1. Sắp xếp cuộc họp theo {{start}}.
2. Min-heap {{busy}} chứa giờ kết thúc của các phòng **đang có người họp**. Đỉnh heap = phòng sắp trống sớm nhất.
3. Với mỗi cuộc họp: poll khỏi heap mọi phòng có {{end <= start}} (đã họp xong, phòng trống). Sau đó đưa {{end}} của cuộc họp mới vào heap.
4. {{busy.size()}} là số phòng đang dùng cùng lúc; đáp án là giá trị lớn nhất của nó.

Chạy tay [[0,30],[5,10],[15,20]]:
~~~text
[0,30):  heap rỗng            -> push 30   heap={30}     size 1
[5,10):  đỉnh 30 > 5, bận     -> push 10   heap={10,30}  size 2
[15,20): đỉnh 10 <= 15, trống -> poll 10, push 20 heap={20,30} size 2
đáp án = 2
~~~

~~~java
class Solution {
    public int rooms(int[][] meetings) {
        int[][] a = meetings.clone();                         // không sửa mảng của caller
        Arrays.sort(a, Comparator.comparingInt(m -> m[0]));   // theo giờ bắt đầu
        PriorityQueue<Integer> busy = new PriorityQueue<>();  // min-heap giờ kết thúc
        int best = 0;
        for (int[] m : a) {
            while (!busy.isEmpty() && busy.peek() <= m[0]) {
                busy.poll();                                  // <= vì khoảng nửa mở: end == start dùng lại được
            }
            busy.offer(m[1]);                                 // cuộc họp mới chiếm một phòng
            best = Math.max(best, busy.size());               // số phòng dùng đồng thời lúc này
        }
        return best;
    }
}
~~~

### Cách khác: quét sự kiện
Tách thành hai mảng {{starts}} và {{ends}}, sort cả hai, dùng hai con trỏ: gặp start thì +1 phòng, gặp end (khi end <= start hiện tại) thì -1. Cũng O(n log n), không cần heap, nhưng khó mở rộng khi cần biết cuộc họp nào ở phòng nào.

### Lưu ý khi phỏng vấn
- Điều kiện {{<=}} hay {{<}} phụ thuộc khoảng nửa mở hay đóng; luôn hỏi lại.
- Nếu cần gán phòng cụ thể, heap lưu {{[end, roomId]}} và tái sử dụng roomId khi poll.

> Senior tip: Bài này chính là bài toán "số kết nối/thread đồng thời tối đa" từ log request (start, end). Dùng nó để sizing connection pool hoặc số pod: đỉnh đồng thời thực tế quan trọng hơn trung bình.`,
  complexity: 'Time O(n log n), Space O(n)',
  starter: 'class Solution {\n    public int rooms(int[][] meetings) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.rooms(new int[][]{{0, 30}, {5, 10}, {15, 20}}));
        run("empty", 0, () -> s.rooms(new int[][]{}));
        run("back to back", 1, () -> s.rooms(new int[][]{{0, 2}, {2, 4}, {4, 5}}));
        run("same start", 3, () -> s.rooms(new int[][]{{1, 3}, {1, 4}, {1, 5}}));
        run("unordered", 2, () -> s.rooms(new int[][]{{5, 7}, {0, 6}, {7, 8}}));
        run("reuse two rooms", 2, () -> s.rooms(new int[][]{{0, 1}, {0, 2}, {2, 3}, {2, 4}}));
        run("peak in middle", 3, () -> s.rooms(new int[][]{{0, 10}, {1, 5}, {2, 6}, {6, 9}, {9, 12}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Bạn sẽ trả về lịch gán từng meeting vào phòng ra sao?', 'Nếu meeting được thêm/huỷ liên tục trong ngày thì cấu trúc dữ liệu nào phù hợp?']
},
{
  id: 'algo-059', title: 'Search in Rotated Sorted Array', difficulty: 'medium', pattern: 'Binary Search', tags: ['binary-search', 'array'],
  prompt: `Một mảng tăng dần, các phần tử **không trùng**, đã bị xoay tại một vị trí chưa biết (ví dụ [0,1,2,4,5,6,7] thành [4,5,6,7,0,1,2]). Tìm index của {{x}}, không có thì trả {{-1}}. Yêu cầu **O(log n)**.

### Ví dụ
~~~text
a = [4,5,6,7,0,1,2], x = 0 -> 4
a = [4,5,6,7,0,1,2], x = 3 -> -1
~~~

### Ràng buộc
- {{0 <= a.length <= 10^5}}, phần tử phân biệt.`,
  hints: [
    'Duyệt tuyến tính là O(n). Binary search cần biết "x nằm ở nửa nào", mà mảng xoay thì không tăng toàn bộ.',
    'Cắt tại mid, **ít nhất một nửa** [l..m] hoặc [m..r] vẫn tăng dần. So sánh a[l] với a[m] để biết nửa nào.',
    'Với nửa tăng dần, chỉ cần kiểm tra x có nằm trong khoảng [đầu, cuối) của nửa đó không; nếu có thì tìm ở đó, nếu không thì tìm nửa kia.'
  ],
  solution: `### Ý tưởng
Mảng xoay gồm hai đoạn tăng dần nối nhau. Cắt ở {{m}} bất kỳ thì **ít nhất một nửa vẫn tăng dần** (điểm "gãy" chỉ nằm ở một bên).
- Nếu {{a[l] <= a[m]}}: nửa trái [l..m] tăng dần. Khi đó nếu {{a[l] <= x < a[m]}} thì x chỉ có thể ở nửa trái, ngược lại ở nửa phải.
- Ngược lại nửa phải [m..r] tăng dần: nếu {{a[m] < x <= a[r]}} thì đi phải, không thì đi trái.

Vì nửa tăng dần có min/max ở hai đầu, kiểm tra "x có trong khoảng" là chính xác. Mỗi bước vẫn loại bỏ một nửa → O(log n).

Chạy tay a=[4,5,6,7,0,1,2], x=0:
~~~text
l=0,r=6,m=3: a[m]=7. a[0]=4<=7 -> trái tăng [4..7]; 0 không trong [4,7) -> l=4
l=4,r=6,m=5: a[m]=1. a[4]=0<=1 -> trái tăng [0..1]; 0 trong [0,1) -> r=4
l=4,r=4,m=4: a[m]=0 == x -> trả 4
~~~

~~~java
class Solution {
    public int search(int[] a, int x) {
        int l = 0, r = a.length - 1;
        while (l <= r) {
            int m = l + (r - l) / 2;              // tránh tràn số của (l + r) / 2
            if (a[m] == x) return m;
            if (a[l] <= a[m]) {                   // nửa trái [l..m] tăng dần
                if (a[l] <= x && x < a[m]) r = m - 1;
                else l = m + 1;
            } else {                              // nửa phải [m..r] tăng dần
                if (a[m] < x && x <= a[r]) l = m + 1;
                else r = m - 1;
            }
        }
        return -1;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{<=}} trong {{a[l] <= a[m]}}: khi l == m (đoạn còn 1-2 phần tử), nửa trái chỉ có một phần tử và vẫn coi là tăng dần.
- **Có phần tử trùng** (ví dụ [1,1,1,0,1]): a[l] == a[m] == a[r] thì không biết nửa nào tăng; chỉ có thể {{l++}}, worst case O(n).
- Mảng không xoay vẫn chạy đúng (nhánh trái luôn tăng).

> Senior tip: Binary search dễ sai ở biên (vòng lặp vô hạn, bỏ sót phần tử). Khi phỏng vấn, chạy tay với mảng 1 và 2 phần tử trước khi tuyên bố xong; đó là chỗ interviewer hay bắt lỗi.`,
  complexity: 'Time O(log n), Space O(1)',
  starter: 'class Solution {\n    public int search(int[] a, int x) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 4, () -> s.search(new int[]{4, 5, 6, 7, 0, 1, 2}, 0));
        run("absent", -1, () -> s.search(new int[]{4, 5, 6, 7, 0, 1, 2}, 3));
        run("empty", -1, () -> s.search(new int[]{}, 3));
        run("not rotated", 2, () -> s.search(new int[]{1, 3, 5, 7}, 5));
        run("single", 0, () -> s.search(new int[]{8}, 8));
        run("two elements rotated", 1, () -> s.search(new int[]{3, 1}, 1));
        run("left part", 1, () -> s.search(new int[]{6, 7, 1, 2, 3, 4, 5}, 7));
        run("last element", 6, () -> s.search(new int[]{6, 7, 1, 2, 3, 4, 5}, 5));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Bạn xử lý duplicate thế nào và độ phức tạp worst case đổi ra sao?', 'Làm sao tìm vị trí điểm xoay (phần tử nhỏ nhất) trong O(log n)?']
},
{
  id: 'algo-060', title: 'Minimum Rate to Finish Jobs', difficulty: 'medium', pattern: 'Binary Search on Answer', tags: ['binary-search', 'capacity'],
  prompt: `Có các job với khối lượng {{a[i]}} đơn vị. Máy chạy với tốc độ {{rate}} đơn vị/giờ, mỗi giờ chỉ làm **một** job; nếu job còn ít hơn {{rate}} đơn vị thì làm xong và phần còn lại của giờ đó bỏ phí. Vậy job {{a[i]}} tốn {{ceil(a[i] / rate)}} giờ. Tìm {{rate}} nguyên **nhỏ nhất** để hoàn tất mọi job trong {{h}} giờ.

### Ví dụ
~~~text
a = [3,6,7,11], h = 8 -> 4
  rate=4: 1 + 2 + 2 + 3 = 8 giờ  (đạt)
  rate=3: 1 + 2 + 3 + 4 = 10 giờ (không đạt)
~~~

### Ràng buộc
- {{1 <= a.length <= 10^4}}, {{a.length <= h <= 10^9}}
- {{1 <= a[i] <= 2^31 - 1}}`,
  hints: [
    'Thử rate = 1, 2, 3... đến khi đạt là quá chậm (rate có thể tới 2 tỷ). Nhận xét: nếu rate r đạt thì mọi rate > r cũng đạt.',
    'Tính chất "đạt/không đạt" đơn điệu theo rate nên binary search trên **đáp án**: lo = 1, hi = max(a) (rate = max(a) luôn đạt vì mỗi job 1 giờ và h >= số job).',
    'Kiểm tra một rate m: tổng ceil(a[i]/m) <= h? Tính ceil bằng (a[i] + m - 1) / m trên kiểu long để không tràn số.'
  ],
  solution: `### Ý tưởng
**Binary search on answer**: không tìm trong mảng, mà tìm trong miền giá trị của đáp án [1, max(a)].

Hàm {{hours(m)}} = tổng số giờ cần với rate m, **giảm dần** khi m tăng. Vậy dãy "đạt?" theo m có dạng {{F F F ... F T T T ... T}}. Ta cần tìm chữ T đầu tiên; binary search làm được trong O(log max).

Mẫu tìm "T đầu tiên":
- {{m}} đạt → đáp án là m hoặc nhỏ hơn → {{hi = m}} (giữ m lại).
- {{m}} không đạt → đáp án lớn hơn m → {{lo = m + 1}}.
- Dừng khi {{lo == hi}}.

~~~java
class Solution {
    public int minRate(int[] a, int h) {
        int lo = 1, hi = 0;
        for (int x : a) hi = Math.max(hi, x);       // rate = max(a) chắc chắn đạt
        while (lo < hi) {
            int m = lo + (hi - lo) / 2;             // không dùng (lo+hi)/2: có thể tràn int
            if (hours(a, m) <= h) hi = m;           // đạt: thử rate nhỏ hơn, giữ m
            else lo = m + 1;                        // không đạt: cần rate lớn hơn
        }
        return lo;
    }

    private long hours(int[] a, int rate) {
        long total = 0;
        for (int x : a) {
            total += (x + (long) rate - 1) / rate;  // ceil(x / rate); ép long trước khi cộng
        }
        return total;                               // long: tổng có thể vượt int
    }
}
~~~

### Vì sao phải ép long?
Với {{x = 2147483647}} và {{rate = 2}}, {{x + rate - 1}} trên int bị tràn thành số âm → ceil sai. Ép {{(long) rate}} làm cả biểu thức tính trên long.

### Độ phức tạp
Mỗi lần kiểm tra O(n), số lần kiểm tra O(log M) với M = max(a) ≈ 31 lần cho 2^31. Tổng O(n log M).

### Lưu ý khi phỏng vấn
- Nhận diện mẫu: "tìm giá trị nhỏ nhất/lớn nhất sao cho điều kiện thoả" + điều kiện đơn điệu → binary search on answer (Koko Eating Bananas, chia mảng tối thiểu hoá max, capacity giao hàng trong D ngày).
- Nếu h < số job thì không rate nào đạt; đề đã loại trường hợp này, nhưng nên hỏi API muốn trả gì.

> Senior tip: Mẫu này dùng thật khi capacity planning: "số consumer tối thiểu để xử lý backlog Kafka trong 1 giờ", "throughput tối thiểu để batch đêm chạy xong trước 6h". Viết hàm kiểm tra khả thi rồi binary search, thay vì đoán mò cấu hình.`,
  complexity: 'Time O(n log M) với M = max(a), Space O(1)',
  starter: 'class Solution {\n    public int minRate(int[] a, int h) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 4, () -> s.minRate(new int[]{3, 6, 7, 11}, 8));
        run("one job one hour", 5, () -> s.minRate(new int[]{5}, 1));
        run("plenty of hours", 1, () -> s.minRate(new int[]{1, 2, 3}, 6));
        run("tight", 11, () -> s.minRate(new int[]{3, 6, 7, 11}, 4));
        run("overflow", 1073741824, () -> s.minRate(new int[]{2147483647}, 2));
        run("classic", 23, () -> s.minRate(new int[]{30, 11, 23, 4, 20}, 6));
        run("huge h", 1, () -> s.minRate(new int[]{1000, 1000}, 1000000000));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu H nhỏ hơn số job, API nên trả gì?', 'Nếu mỗi giờ máy được làm nhiều job (không bỏ phí phần dư) thì bài còn cần binary search không?']
},
{
  id: 'algo-061', title: 'Count Connected Components', difficulty: 'medium', pattern: 'Graph / DFS', tags: ['graph', 'dfs'],
  prompt: `Có {{n}} đỉnh đánh số {{0..n-1}} và danh sách cạnh **vô hướng** {{edges}}. Đếm số **thành phần liên thông** (nhóm đỉnh mà từ một đỉnh đi tới được mọi đỉnh khác trong nhóm). Đỉnh không có cạnh nào tự nó là một thành phần.

### Ví dụ
~~~text
n = 5, edges = [[0,1],[1,2],[3,4]] -> 2   ({0,1,2} và {3,4})
n = 4, edges = []                  -> 4
~~~

### Ràng buộc
- {{0 <= n <= 10^5}}, {{0 <= edges.length <= 2 * 10^5}}
- Cạnh có thể là self-loop ({{[v, v]}}).`,
  hints: [
    'Dựng adjacency list: với mỗi cạnh [u, v], thêm v vào danh sách kề của u và ngược lại (vô hướng).',
    'Duyệt mọi đỉnh. Gặp đỉnh chưa thăm nghĩa là phát hiện một thành phần mới: tăng count, rồi DFS/BFS đánh dấu toàn bộ đỉnh đi tới được.',
    'Dùng stack/queue tự quản lý thay vì đệ quy: graph dạng chuỗi 10^5 đỉnh sẽ làm đệ quy StackOverflowError.'
  ],
  solution: `### Ý tưởng
Hình dung các đỉnh là người, cạnh là quan hệ quen biết; thành phần liên thông là một "nhóm bạn". Cách đếm:
1. Dựng **adjacency list** {{g}}: {{g.get(v)}} là danh sách đỉnh kề v.
2. Duyệt i = 0..n-1. Nếu i **chưa thăm**: đây là nhóm mới → {{count++}}, rồi "loang" từ i (DFS) để đánh dấu cả nhóm là đã thăm.
3. Lần sau gặp đỉnh của nhóm đó, nó đã được đánh dấu nên không đếm lại.

Mỗi lượt loang đánh dấu **đúng một** thành phần, nên số lượt loang = số thành phần.

~~~java
class Solution {
    public int components(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) {                  // cạnh vô hướng: thêm cả hai chiều
            g.get(e[0]).add(e[1]);
            g.get(e[1]).add(e[0]);
        }
        boolean[] seen = new boolean[n];
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (seen[i]) continue;               // đã thuộc một nhóm đếm trước đó
            count++;                             // nhóm mới
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(i);
            seen[i] = true;                      // đánh dấu khi push, tránh push trùng
            while (!stack.isEmpty()) {           // DFS bằng stack tự quản lý
                int v = stack.pop();
                for (int w : g.get(v)) {
                    if (!seen[w]) { seen[w] = true; stack.push(w); }
                }
            }
        }
        return count;
    }
}
~~~

### Vì sao O(V + E)?
Mỗi đỉnh được push/pop đúng một lần (nhờ {{seen}}); mỗi cạnh được xem hai lần (một lần từ mỗi đầu). Self-loop {{[1,1]}} chỉ thêm 1 vào danh sách kề của chính nó, {{seen[1]}} đã true nên bị bỏ qua.

### Cách khác: Union-Find
Ban đầu count = n. Với mỗi cạnh, nếu {{find(u) != find(v)}} thì {{union}} và {{count--}}. Gần O(E) và **không cần dựng adjacency list**, rất hợp khi cạnh đến dạng stream.

### Lưu ý khi phỏng vấn
- Hỏi: graph có hướng hay vô hướng? Với graph có hướng, khái niệm tương ứng là strongly connected components (Tarjan/Kosaraju), khó hơn hẳn.
- Đệ quy DFS sâu 10^5 tầng sẽ tràn stack mặc định (~512KB-1MB); dùng stack tường minh như trên.

> Senior tip: Với graph hàng chục triệu đỉnh, {{List<List<Integer>>}} tốn rất nhiều bộ nhớ vì mỗi Integer là một object (~16 byte) cộng header của mỗi ArrayList. Dạng CSR (hai mảng int: offset và target) giảm bộ nhớ vài lần.`,
  complexity: 'Time O(V + E), Space O(V + E)',
  starter: 'class Solution {\n    public int components(int n, int[][] edges) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.components(5, new int[][]{{0, 1}, {1, 2}, {3, 4}}));
        run("no vertices", 0, () -> s.components(0, new int[][]{}));
        run("isolated", 4, () -> s.components(4, new int[][]{}));
        run("single component", 1, () -> s.components(4, new int[][]{{0, 1}, {1, 2}, {2, 3}}));
        run("self loop", 3, () -> s.components(3, new int[][]{{1, 1}}));
        run("cycle plus isolated", 2, () -> s.components(4, new int[][]{{0, 1}, {1, 2}, {2, 0}}));
        run("long chain no stack overflow", 1, () -> {
            int n = 100000; int[][] e = new int[n - 1][];
            for (int i = 0; i < n - 1; i++) e[i] = new int[]{i, i + 1};
            return s.components(n, e);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cạnh có hướng, khái niệm component nào phù hợp?', 'Nếu cạnh được thêm dần theo thời gian và cần trả lời số component sau mỗi lần thêm thì dùng gì?']
},
{
  id: 'algo-062', title: 'Shortest Path in an Unweighted Graph', difficulty: 'medium', pattern: 'Graph / BFS', tags: ['graph', 'bfs'],
  prompt: `Graph **vô hướng, không trọng số** có {{n}} đỉnh {{0..n-1}} và danh sách cạnh {{e}}. Trả số cạnh ít nhất để đi từ {{src}} tới {{dst}}; không tới được thì trả {{-1}}. Nếu {{src == dst}} thì trả {{0}}.

### Ví dụ
~~~text
n = 4, cạnh 0-1, 1-2, 0-3, 3-2; src = 0, dst = 2 -> 2   (0-1-2 hoặc 0-3-2)
n = 3, cạnh 0-1;            src = 0, dst = 2 -> -1
~~~

### Ràng buộc
- {{1 <= n <= 10^5}}, {{0 <= e.length <= 2 * 10^5}}, {{0 <= src, dst < n}}`,
  hints: [
    'Graph không trọng số: "đường ngắn nhất" = ít cạnh nhất. BFS duyệt theo từng lớp khoảng cách 0, 1, 2...',
    'Lưu mảng dist[] khởi tạo -1 (chưa thăm). Khi lấy v ra khỏi queue, mọi láng giềng w chưa thăm có dist[w] = dist[v] + 1.',
    'Gán dist (đánh dấu đã thăm) ngay lúc **enqueue**, không phải lúc dequeue, để một đỉnh không bị đưa vào queue nhiều lần.'
  ],
  solution: `### Ý tưởng
**BFS** (tìm kiếm theo chiều rộng) giống như ném hòn đá xuống nước: sóng lan ra từng vòng. Vòng 0 là {{src}}, vòng 1 là các đỉnh kề src, vòng 2 là đỉnh kề của vòng 1 mà chưa thăm...

Queue (FIFO) đảm bảo xử lý hết vòng k rồi mới tới vòng k+1. Vì vậy **lần đầu tiên** một đỉnh được chạm tới chính là qua đường ít cạnh nhất, và {{dist}} của nó không bao giờ cần sửa lại.

Chạy tay ví dụ 1:
~~~text
queue=[0]     dist: 0=0
lấy 0 -> thăm 1, 3          dist 1=1, 3=1   queue=[1,3]
lấy 1 -> thăm 2             dist 2=2        queue=[3,2]
lấy 3 -> 2 đã thăm, bỏ qua                  queue=[2]
lấy 2 == dst -> trả 2
~~~

~~~java
class Solution {
    public int shortest(int n, int[][] e, int src, int dst) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] x : e) { g.get(x[0]).add(x[1]); g.get(x[1]).add(x[0]); }

        int[] dist = new int[n];
        Arrays.fill(dist, -1);                   // -1 = chưa thăm
        Queue<Integer> q = new ArrayDeque<>();
        q.offer(src);
        dist[src] = 0;
        while (!q.isEmpty()) {
            int v = q.poll();
            if (v == dst) return dist[v];        // lần đầu lấy ra dst = khoảng cách ngắn nhất
            for (int w : g.get(v)) {
                if (dist[w] == -1) {             // chưa thăm
                    dist[w] = dist[v] + 1;       // đánh dấu NGAY khi enqueue
                    q.offer(w);
                }
            }
        }
        return -1;                               // queue cạn mà chưa gặp dst: không tới được
    }
}
~~~

### Lưu ý khi phỏng vấn
- **Không dùng DFS** cho đường ngắn nhất: DFS có thể đi đường vòng dài tới dst trước.
- Có trọng số không âm → **Dijkstra** (PriorityQueue). Trọng số chỉ 0 hoặc 1 → 0-1 BFS với deque.
- Cần in ra đường đi: lưu thêm {{parent[w] = v}} khi enqueue, rồi lần ngược từ dst.

> Senior tip: Khi graph rất lớn và biết cả hai đầu, **bidirectional BFS** (loang từ src và dst cùng lúc, dừng khi gặp nhau) giảm số đỉnh phải thăm từ khoảng b^d xuống 2·b^(d/2), như cách các mạng xã hội tính "bạn của bạn".`,
  complexity: 'Time O(V + E), Space O(V + E)',
  starter: 'class Solution {\n    public int shortest(int n, int[][] e, int src, int dst) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.shortest(4, new int[][]{{0, 1}, {1, 2}, {0, 3}, {3, 2}}, 0, 2));
        run("same vertex", 0, () -> s.shortest(2, new int[][]{}, 1, 1));
        run("disconnected", -1, () -> s.shortest(3, new int[][]{{0, 1}}, 0, 2));
        run("direct edge", 1, () -> s.shortest(3, new int[][]{{0, 2}, {0, 1}}, 0, 2));
        run("chain", 3, () -> s.shortest(4, new int[][]{{0, 1}, {1, 2}, {2, 3}}, 0, 3));
        run("shortcut beats long path", 2, () -> s.shortest(6, new int[][]{{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 5}, {0, 5}, {5, 4}}, 0, 4));
        run("reverse direction", 3, () -> s.shortest(4, new int[][]{{0, 1}, {1, 2}, {2, 3}}, 3, 0));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Bạn sẽ xử lý nhiều truy vấn source-target trên cùng graph thế nào?', 'Nếu cạnh có trọng số không âm thì đổi thuật toán gì và vì sao BFS sai?']
},
{
  id: 'algo-063', title: 'Top K Frequent Transaction Codes', difficulty: 'medium', pattern: 'Heap / Hash Map', tags: ['heap', 'frequency'],
  prompt: `Cho mảng mã giao dịch (chuỗi) và {{k}}. Trả về danh sách {{k}} mã xuất hiện nhiều nhất, sắp **tần suất giảm dần**; nếu cùng tần suất, mã nhỏ hơn theo **thứ tự từ điển** đứng trước.

### Ví dụ
~~~text
["b","a","b","a","c"], k = 2 -> ["a","b"]   (a và b cùng 2 lần, "a" < "b")
["z","z","z","a","a","b"], k = 2 -> ["z","a"]
~~~

### Ràng buộc
- {{1 <= codes.length <= 10^5}}
- {{1 <= k <=}} số mã phân biệt.`,
  hints: [
    'Bước 1: đếm tần suất từng mã bằng HashMap.',
    'Bước 2: sắp các mã phân biệt theo hai tiêu chí: tần suất giảm dần, nếu bằng thì chuỗi tăng dần. Viết Comparator cho đúng thứ tự này.',
    'Sort toàn bộ là O(u log u) với u mã phân biệt. Khi k nhỏ hơn nhiều u, min-heap kích thước k cho O(u log k).'
  ],
  solution: `### Ý tưởng
Hai bước:
1. **Đếm**: {{freq.merge(code, 1, Integer::sum)}}.
2. **Sắp xếp** danh sách mã phân biệt bằng Comparator hai tầng rồi lấy k phần tử đầu.

Comparator viết bằng API {{Comparator}} của Java 8+ cho dễ đọc:
- {{comparing(freq::get, reverseOrder())}}: tần suất **giảm dần**.
- {{.thenComparing(naturalOrder())}}: nếu bằng nhau, chuỗi **tăng dần**.

Chạy tay ["b","a","b","a","c"]: freq = {a=2, b=2, c=1}. Sắp: a(2), b(2), c(1) (a trước b vì "a" < "b"). Lấy 2 → [a, b].

~~~java
class Solution {
    public List<String> top(String[] codes, int k) {
        Map<String, Integer> freq = new HashMap<>();
        for (String c : codes) freq.merge(c, 1, Integer::sum);   // đếm tần suất

        List<String> keys = new ArrayList<>(freq.keySet());       // các mã phân biệt
        keys.sort(Comparator
                .comparing((String key) -> freq.get(key), Comparator.reverseOrder()) // tần suất giảm
                .thenComparing(Comparator.naturalOrder()));       // hoà thì theo từ điển tăng
        return new ArrayList<>(keys.subList(0, k));               // copy: subList chỉ là view
    }
}
~~~

### Khi nào dùng heap?
Nếu u = 10 triệu mã mà k = 10, sort toàn bộ tốn O(u log u). Min-heap kích thước k giữ "k ứng viên tốt nhất"; đỉnh heap là ứng viên **yếu nhất** (tần suất thấp nhất, hoà thì chuỗi lớn nhất) và bị đẩy ra khi heap vượt k. Tổng O(u log k). Cuối cùng đảo ngược thứ tự lấy ra từ heap. Xem bài Top K Frequent Log Entries để có code heap.

### Lưu ý khi phỏng vấn
- **Tie-break phải xác định** nếu muốn kết quả ổn định để test; luôn hỏi interviewer.
- Không viết comparator {{(x, y) -> freq.get(y) - freq.get(x)}}: phép trừ có thể tràn số với giá trị lớn. Dùng {{Integer.compare}} hoặc {{Comparator.comparing}}.
- {{subList}} trả về view gắn với list gốc; copy ra {{new ArrayList<>(...)}} để caller sửa thoải mái.

> Senior tip: Với stream lớn không vừa RAM (top mã lỗi toàn hệ thống), dùng thuật toán xấp xỉ như Count-Min Sketch + heap, hoặc đẩy cho hệ thống chuyên dụng (Elasticsearch terms aggregation, Redis TopK). Nói rõ trade-off độ chính xác/bộ nhớ là điểm cộng.`,
  complexity: 'Time O(n + u log u), Space O(u) (u = số mã phân biệt)',
  starter: 'class Solution {\n    public List<String> top(String[] codes, int k) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("tie by name", Arrays.asList("a", "b"), () -> s.top(new String[]{"b", "a", "b", "a", "c"}, 2));
        run("single", Arrays.asList("x"), () -> s.top(new String[]{"x", "y", "x"}, 1));
        run("all equal frequency", Arrays.asList("a", "b", "c"), () -> s.top(new String[]{"c", "b", "a"}, 3));
        run("frequency first", Arrays.asList("z", "a"), () -> s.top(new String[]{"z", "z", "z", "a", "a", "b"}, 2));
        run("one distinct", Arrays.asList("m"), () -> s.top(new String[]{"m", "m", "m"}, 1));
        run("lexicographic not length", Arrays.asList("AB", "B"), () -> s.top(new String[]{"B", "AB", "C", "B", "AB"}, 2));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Làm sao giới hạn memory nếu số mã phân biệt rất lớn?', 'Nếu cần top-k trong cửa sổ 5 phút gần nhất thì thiết kế thế nào?']
},
{
  id: 'algo-064', title: 'Simulate ATM Withdrawals', difficulty: 'medium', pattern: 'Simulation / Greedy', tags: ['simulation', 'greedy'],
  prompt: `ATM có 4 loại tiền mệnh giá {{[100, 50, 20, 10]}} với tồn kho {{stock[i]}} tờ tương ứng. Với yêu cầu rút {{amount}}, trả mảng 4 phần tử là **số tờ mỗi loại**, sao cho tổng đúng bằng amount, không vượt tồn kho và **tổng số tờ ít nhất**. Nếu không thể, trả {{null}}. Hàm **không được sửa** mảng {{stock}}.

### Ví dụ
~~~text
amount = 180, stock = [1,2,5,10] -> [1,1,1,1]   (100+50+20+10, 4 tờ)
amount = 60,  stock = [0,1,3,0]  -> [0,0,3,0]   (3 tờ 20; nếu lấy 50 trước thì còn 10 mà hết tờ 10)
amount = 15,  stock = [1,1,1,1]  -> null
~~~

### Ràng buộc
- {{0 <= amount <= 10^6}}, {{0 <= stock[i] <= 10^4}}`,
  hints: [
    'Thử greedy "mệnh giá lớn trước" với ví dụ 2: lấy 50, còn 10, không có tờ 10 → thất bại, trong khi 20×3 là đáp án. Greedy thuần không đủ khi tồn kho có hạn.',
    'Quan sát: 100, 20, 10 tạo thành chuỗi chia hết (100 = 5×20, 20 = 2×10). Với các mệnh giá như vậy, greedy (lấy tối đa tờ lớn có thể) luôn tìm được cách ít tờ nhất nếu có cách. Chỉ tờ 50 "phá" chuỗi này.',
    'Vậy thử mọi số tờ 50 có thể (c50 từ lớn đến 0), phần còn lại amount - 50·c50 chia greedy cho 100, 20, 10; giữ phương án ít tờ nhất.'
  ],
  solution: `### Ý tưởng
**Vì sao greedy thuần sai?** amount = 60, stock = [0,1,3,0]: greedy lấy 1 tờ 50, còn 10 nhưng hết tờ 10 → báo thất bại, dù 3 tờ 20 là cách hợp lệ.

**Quan sát then chốt:** các mệnh giá 100, 20, 10 chia hết lẫn nhau theo chuỗi (10 | 20 | 100). Với hệ như vậy, lấy **càng nhiều tờ lớn càng tốt** (trong giới hạn tồn kho) luôn tối ưu: thay vì dùng 5 tờ 20 thì 1 tờ 100 ít tờ hơn, và nếu greedy không ghép được thì không cách nào ghép được (phần dư sau tờ lớn luôn phải bù bằng tờ nhỏ hơn, mà tờ nhỏ hơn cũng ghép theo bội của nhau).

Chỉ tờ 50 nằm ngoài chuỗi: 50 không phải bội của 20, nên chọn bao nhiêu tờ 50 ảnh hưởng tới việc phần còn lại có ghép được hay không. Vì vậy:
1. Thử mọi {{c50}} từ {{min(stock[1], amount/50)}} xuống 0.
2. Phần còn lại {{rest = amount - 50·c50}}: greedy theo 100 → 20 → 10.
3. Nếu rest về 0, đếm số tờ; giữ phương án ít tờ nhất (hoà thì giữ phương án nhiều tờ 50 hơn, vì gặp trước).

Số lần thử tối đa amount/50 + 1, mỗi lần O(1) → O(amount/50).

~~~java
class Solution {
    private static final int[] DENOM = {100, 50, 20, 10};

    public int[] withdraw(int amount, int[] stock) {
        int[] best = null;
        int bestNotes = Integer.MAX_VALUE;
        int max50 = Math.min(stock[1], amount / 50);
        for (int c50 = max50; c50 >= 0; c50--) {          // thử mọi số tờ 50
            int[] use = new int[4];                         // mảng mới: không đụng vào stock
            use[1] = c50;
            int rest = amount - 50 * c50;
            for (int i : new int[]{0, 2, 3}) {              // greedy cho chuỗi 100 -> 20 -> 10
                use[i] = Math.min(stock[i], rest / DENOM[i]); // lấy nhiều nhất có thể
                rest -= use[i] * DENOM[i];
            }
            if (rest != 0) continue;                        // không ghép đủ với c50 này
            int notes = use[0] + use[1] + use[2] + use[3];
            if (notes < bestNotes) { bestNotes = notes; best = use; }
        }
        return best;                                        // null nếu không phương án nào hợp lệ
    }
}
~~~

### Lưu ý khi phỏng vấn
- Hỏi rõ mục tiêu: ít tờ nhất? Giữ lại tờ nhỏ để thối cho khách sau? Mỗi mục tiêu cho đáp án khác nhau.
- Với **bộ mệnh giá tuỳ ý**, cách tổng quát là DP bounded knapsack (giống Coin Change có giới hạn số đồng). Ở đây tận dụng cấu trúc mệnh giá để có lời giải đơn giản và nhanh.
- Không sửa {{stock}} trong hàm tính toán: tính phương án trước, chỉ trừ tồn kho khi phần cứng nhả tiền thành công.

> Senior tip: Trong hệ thống tiền thật, tách "lập kế hoạch" (hàm thuần, dễ test) khỏi "thực thi" (có side effect, cần transaction/compensation). Nếu cassette kẹt giữa chừng, phải ghi journal số tờ đã nhả thực tế để đối soát, không tin vào kế hoạch.`,
  complexity: 'Time O(amount / 50), Space O(1)',
  starter: 'class Solution {\n    public int[] withdraw(int amount, int[] stock) {\n        // TODO\n        return null;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, int[] expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + Arrays.toString(expected) + " got " + (actual instanceof int[] ? Arrays.toString((int[]) actual) : actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", new int[]{1, 1, 1, 1}, () -> s.withdraw(180, new int[]{1, 2, 5, 10}));
        run("greedy trap 60", new int[]{0, 0, 3, 0}, () -> s.withdraw(60, new int[]{0, 1, 3, 0}));
        run("not multiple of 10", null, () -> s.withdraw(15, new int[]{1, 1, 1, 1}));
        run("zero amount", new int[]{0, 0, 0, 0}, () -> s.withdraw(0, new int[]{1, 1, 1, 1}));
        run("insufficient stock", null, () -> s.withdraw(30, new int[]{0, 0, 1, 0}));
        run("skip 50 to use 100", new int[]{1, 0, 3, 0}, () -> s.withdraw(160, new int[]{1, 1, 3, 0}));
        run("fewest notes", new int[]{0, 1, 1, 1}, () -> s.withdraw(80, new int[]{0, 1, 4, 1}));
        run("stock unchanged", new int[]{1, 2, 5, 10}, () -> { int[] st = {1, 2, 5, 10}; s.withdraw(180, st); return st; });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu mục tiêu là giữ lại nhiều tờ nhỏ nhất có thể cho các lần rút sau thì đổi tiêu chí thế nào?', 'Làm sao đảm bảo không trừ tồn kho sai nếu cassette hardware lỗi giữa chừng?']
},
{
  id: 'algo-065', title: 'Longest Increasing Subsequence Length', difficulty: 'medium', pattern: 'Dynamic Programming / Binary Search', tags: ['dp', 'binary-search'],
  prompt: `Cho mảng {{a}}, trả độ dài **dãy con tăng nghiêm ngặt** dài nhất. Dãy con (subsequence) lấy các phần tử theo đúng thứ tự nhưng **không cần liền nhau**.

### Ví dụ
~~~text
[10,9,2,5,3,7,101,18] -> 4   (ví dụ 2,3,7,18 hoặc 2,5,7,101)
[2,2,2]               -> 1   (tăng nghiêm ngặt: bằng nhau không tính)
~~~

### Ràng buộc
- {{0 <= a.length <= 2 * 10^5}} (O(n²) sẽ quá chậm)
- {{-10^9 <= a[i] <= 10^9}}`,
  hints: [
    'Cách cơ bản: dp[i] = độ dài LIS kết thúc tại i = 1 + max(dp[j]) với j < i và a[j] < a[i]. Đúng nhưng O(n²).',
    'Cách nhanh: giữ mảng tails, trong đó tails[len-1] là **giá trị kết thúc nhỏ nhất** của một dãy tăng độ dài len. Mảng tails luôn tăng dần.',
    'Với mỗi x, binary search vị trí đầu tiên trong tails có giá trị >= x (lower bound). Ghi đè x vào đó; nếu vị trí đó bằng size thì dãy dài thêm 1.'
  ],
  solution: `### Ý tưởng
**Bước 1, hiểu bản O(n²):** {{dp[i]}} = độ dài dãy tăng dài nhất kết thúc tại i. Muốn nối a[i] vào sau một dãy, dãy đó phải kết thúc bằng số nhỏ hơn a[i]. Đúng nhưng mỗi i phải xem lại mọi j < i.

**Bước 2, nhận xét để tăng tốc:** với cùng độ dài, dãy có **phần tử cuối nhỏ hơn** luôn "tốt hơn", vì nó dễ nối thêm số sau. Nên với mỗi độ dài len, chỉ cần nhớ phần tử cuối nhỏ nhất: {{tails[len-1]}}.

Mảng {{tails}} luôn **tăng dần** (dãy dài hơn phải kết thúc bằng số lớn hơn), nên tìm kiếm trên nó bằng binary search. Với mỗi x:
- Tìm vị trí {{pos}} đầu tiên có {{tails[pos] >= x}}.
- Nếu {{pos == size}}: x lớn hơn mọi phần tử cuối → kéo dài dãy dài nhất, {{size++}}.
- Ngược lại: ghi {{tails[pos] = x}} → dãy độ dài pos+1 giờ kết thúc bằng số nhỏ hơn (tốt hơn).

Chạy tay [10,9,2,5,3,7,101,18]:
~~~text
x=10  tails=[10]
x=9   tails=[9]          (thay 10)
x=2   tails=[2]
x=5   tails=[2,5]        (nối dài)
x=3   tails=[2,3]        (thay 5)
x=7   tails=[2,3,7]
x=101 tails=[2,3,7,101]
x=18  tails=[2,3,7,18]   -> size = 4
~~~
Lưu ý: {{tails}} **không nhất thiết** là một dãy con thật, nhưng **độ dài** của nó luôn đúng bằng LIS.

~~~java
class Solution {
    public int lis(int[] a) {
        int[] tails = new int[a.length];
        int size = 0;                          // số phần tử đang dùng trong tails
        for (int x : a) {
            int lo = 0, hi = size;             // tìm trong tails[0..size)
            while (lo < hi) {                  // lower bound: vị trí đầu tiên có tails[pos] >= x
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = x;                     // thay thế hoặc nối dài
            if (lo == size) size++;            // x lớn hơn mọi phần tử cuối: LIS dài thêm 1
        }
        return size;
    }
}
~~~

### Lưu ý khi phỏng vấn
- **Tăng nghiêm ngặt** dùng lower bound ({{tails[mid] < x}}); nếu đề cho phép **không giảm** (bằng nhau được), dùng upper bound ({{tails[mid] <= x}}).
- Nói bản O(n²) trước rồi tối ưu: interviewer muốn thấy quá trình suy nghĩ.
- Muốn in ra dãy thật: lưu thêm index cuối cho mỗi độ dài và mảng {{parent}}, rồi lần ngược.

> Senior tip: LIS xuất hiện trong thực tế ở diff/patience sorting (git diff --patience dùng ý tưởng này) và trong bài "xếp hộp/phong bì lồng nhau". Nhận ra mô hình LIS phía sau đề "nghiệp vụ" là kỹ năng được đánh giá cao.`,
  complexity: 'Time O(n log n), Space O(n)',
  starter: 'class Solution {\n    public int lis(int[] a) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 4, () -> s.lis(new int[]{10, 9, 2, 5, 3, 7, 101, 18}));
        run("empty", 0, () -> s.lis(new int[]{}));
        run("all equal", 1, () -> s.lis(new int[]{2, 2, 2}));
        run("increasing", 4, () -> s.lis(new int[]{1, 2, 3, 4}));
        run("decreasing", 1, () -> s.lis(new int[]{5, 4, 3, 2}));
        run("negative", 4, () -> s.lis(new int[]{-3, -2, -5, 0, 1}));
        run("classic", 4, () -> s.lis(new int[]{0, 1, 0, 3, 2, 3}));
        run("large", 200000, () -> { int[] a = new int[200000]; for (int i = 0; i < a.length; i++) a[i] = i * 2 - 100000; return s.lis(a); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Làm sao khôi phục chính dãy subsequence, không chỉ độ dài?', 'Nếu bài cho phép phần tử bằng nhau (không giảm) thì sửa dòng nào?']
},
{
  id: 'algo-066', title: 'Maximum Profit with At Most K Trades', difficulty: 'hard', pattern: 'Dynamic Programming', tags: ['dp', 'transactions'],
  prompt: `Cho giá cổ phiếu theo ngày {{p}} và số giao dịch tối đa {{k}}. Một giao dịch = mua rồi bán; **không giữ hai vị thế cùng lúc** (phải bán xong mới được mua lại). Được mua và bán cùng một ngày cho các giao dịch khác nhau. Trả lợi nhuận lớn nhất.

### Ví dụ
~~~text
k = 2, p = [3,2,6,5,0,3] -> 7   (mua 2 bán 6: +4; mua 0 bán 3: +3)
k = 1, p = [1,2,3,0,6]   -> 6   (mua 0 bán 6)
~~~

### Ràng buộc
- {{0 <= p.length <= 1000}}, {{0 <= k <= 100}}, {{0 <= p[i] <= 1000}}`,
  hints: [
    'Mỗi thời điểm, trạng thái của bạn gồm: đã hoàn tất bao nhiêu giao dịch (j) và đang cầm cổ phiếu hay đang cầm tiền.',
    'cash[j] = lợi nhuận tốt nhất khi đang cầm tiền và đã bán j lần; hold[j] = lợi nhuận tốt nhất khi đang cầm cổ phiếu của giao dịch thứ j. Mỗi ngày: cash[j] = max(cash[j], hold[j] + giá), hold[j] = max(hold[j], cash[j-1] - giá).',
    'Nếu k >= n/2 thì giới hạn k không còn tác dụng: cộng mọi đoạn tăng giá p[i] - p[i-1] > 0.'
  ],
  solution: `### Ý tưởng
Đây là DP theo **trạng thái**. Mỗi ngày, ta chỉ có thể ở một trong hai tình huống cho mỗi j = 1..k:
- {{hold[j]}}: đang **cầm cổ phiếu** của giao dịch thứ j (đã mua j lần, bán j-1 lần). Giá trị = lợi nhuận tốt nhất (mua làm lợi nhuận giảm).
- {{cash[j]}}: đang **cầm tiền**, đã bán xong j lần.

Chuyển trạng thái trong một ngày với giá {{price}}:
- {{cash[j] = max(cash[j], hold[j] + price)}}: hoặc không làm gì, hoặc bán hôm nay.
- {{hold[j] = max(hold[j], cash[j-1] - price)}}: hoặc vẫn cầm, hoặc mua hôm nay sau khi đã xong j-1 giao dịch.

Khởi tạo {{cash[j] = 0}} (chưa làm gì), {{hold[j] = -vô cực}} (chưa thể cầm cổ phiếu khi chưa mua). Đáp án {{cash[k]}} (cash không giảm theo j vì "tối đa k" bao gồm cả làm ít hơn).

**Thứ tự cập nhật:** duyệt j từ k xuống 1 để {{cash[j-1]}} dùng trong {{hold[j]}} vẫn là giá trị **hôm qua**. Thật ra mua-bán cùng ngày không tạo lãi nên thứ tự nào cũng ra cùng kết quả, nhưng duyệt ngược giúp lập luận rõ ràng.

**Rút gọn khi k lớn:** n ngày có tối đa n/2 đoạn tăng tách biệt. Nếu k >= n/2 coi như không giới hạn: cộng mọi chênh lệch dương giữa hai ngày liên tiếp. Nhánh này tránh O(nk) khi k rất lớn.

~~~java
class Solution {
    public long profit(int k, int[] p) {
        int n = p.length;
        if (n == 0 || k == 0) return 0;
        if (k >= n / 2) {                          // không giới hạn thực sự: lấy mọi đoạn tăng
            long sum = 0;
            for (int i = 1; i < n; i++) sum += Math.max(0, p[i] - p[i - 1]);
            return sum;
        }
        long[] cash = new long[k + 1];             // cash[j]: cầm tiền, đã bán j lần
        long[] hold = new long[k + 1];             // hold[j]: đang cầm cổ phiếu của giao dịch thứ j
        Arrays.fill(hold, Long.MIN_VALUE / 4);     // "-vô cực" nhưng cộng price không tràn số
        for (int price : p) {
            for (int j = k; j >= 1; j--) {
                cash[j] = Math.max(cash[j], hold[j] + price);     // bán hôm nay
                hold[j] = Math.max(hold[j], cash[j - 1] - price); // mua hôm nay
            }
        }
        return cash[k];
    }
}
~~~

### Chạy tay k=2, p=[3,2,6,5,0,3] (chỉ ghi hold1, cash1, hold2, cash2)
~~~text
3: h1=-3 c1=0  h2=-3 c2=0
2: h1=-2 c1=0  h2=-2 c2=0
6: h1=-2 c1=4  h2=-2 c2=4
5: h1=-2 c1=4  h2=-1 c2=4
0: h1= 0 c1=4  h2= 4 c2=4
3: h1= 0 c1=4  h2= 4 c2=7   -> đáp án 7
~~~

### Lưu ý khi phỏng vấn
- Dùng {{Long.MIN_VALUE / 4}} thay cho {{Long.MIN_VALUE}}: {{MIN_VALUE + price}} vẫn ổn, nhưng {{MIN_VALUE - price}} sẽ tràn thành số dương rất lớn → sai.
- Thêm phí giao dịch: trừ fee khi bán. Thêm cooldown 1 ngày: hold[j] mua từ cash của **hôm kia**, cần lưu thêm một mảng.

> Senior tip: Cách mô hình hoá "trạng thái + chuyển trạng thái" này chính là state machine bạn dùng hằng ngày (trạng thái đơn hàng, saga). Trong phỏng vấn, vẽ sơ đồ trạng thái trước khi viết công thức DP sẽ giúp bạn và interviewer cùng kiểm tra tính đúng.`,
  complexity: 'Time O(n·k), Space O(k)',
  starter: 'class Solution {\n    public long profit(int k, int[] p) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 7L, () -> s.profit(2, new int[]{3, 2, 6, 5, 0, 3}));
        run("empty", 0L, () -> s.profit(2, new int[]{}));
        run("zero k", 0L, () -> s.profit(0, new int[]{1, 5}));
        run("one trade", 6L, () -> s.profit(1, new int[]{1, 2, 3, 0, 6}));
        run("unlimited", 5L, () -> s.profit(10, new int[]{1, 3, 2, 5}));
        run("falling prices", 0L, () -> s.profit(2, new int[]{9, 7, 4, 1}));
        run("k limits gains", 13L, () -> s.profit(2, new int[]{1, 2, 1, 5, 1, 10, 1, 3}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Thêm transaction fee và cooldown cần thêm trạng thái nào?', 'Nếu cần in ra các ngày mua/bán thì lưu thêm gì?']
},
{
  id: 'algo-067', title: 'Minimum Cost to Connect Sites', difficulty: 'hard', pattern: 'Graph / Minimum Spanning Tree', tags: ['graph', 'mst', 'union-find'],
  prompt: `Có {{n}} site (đánh số {{0..n-1}}) và danh sách đường cáp có thể kéo {{[u, v, cost]}}. Chọn một số đường cáp sao cho mọi site đều liên thông với nhau và **tổng chi phí nhỏ nhất**. Trả tổng chi phí; nếu không thể nối hết thì trả {{-1}}.

### Ví dụ
~~~text
n = 4, edges = [[0,1,1],[1,2,2],[2,3,3],[0,3,9]] -> 6   (chọn 1 + 2 + 3, bỏ cạnh 9)
n = 3, edges = [[0,1,2]]                         -> -1  (site 2 không nối được)
~~~

### Ràng buộc
- {{1 <= n <= 10^5}}, {{0 <= edges.length <= 2 * 10^5}}, {{0 <= cost <= 10^6}}
- Có thể có nhiều cạnh giữa cùng một cặp site.`,
  hints: [
    'Lời giải tối ưu không bao giờ chứa chu trình (bỏ cạnh đắt nhất trong chu trình vẫn liên thông và rẻ hơn). Vậy đáp án là một cây khung có đúng n-1 cạnh: minimum spanning tree (MST).',
    'Kruskal: sắp cạnh theo cost tăng dần, lần lượt nhận cạnh nếu nó nối hai nhóm **khác nhau**; bỏ qua nếu hai đầu đã cùng nhóm (sẽ tạo chu trình).',
    'Dùng Union-Find (Disjoint Set Union) để kiểm tra "cùng nhóm?" và gộp nhóm gần O(1). Đủ n-1 cạnh thì dừng; hết cạnh mà chưa đủ thì trả -1.'
  ],
  solution: `### Ý tưởng
**Vì sao đáp án là một cây?** Nếu tập cạnh đã chọn có chu trình, bỏ đi một cạnh trên chu trình thì vẫn liên thông và chi phí không tăng. Vậy chỉ cần tìm cây khung (n-1 cạnh) rẻ nhất: **MST**.

**Kruskal (tham lam):** xét cạnh từ rẻ đến đắt. Nhận cạnh nếu nó nối hai thành phần **chưa** liên thông; nếu hai đầu đã cùng thành phần thì cạnh này chỉ tạo chu trình → bỏ. Tính đúng đắn đến từ "cut property": cạnh rẻ nhất băng qua một lát cắt bất kỳ luôn thuộc một MST nào đó.

**Union-Find** quản lý các thành phần:
- {{parent[x]}}: "cha" của x; gốc là đại diện của nhóm. {{find(x)}} đi lên tới gốc.
- **Path compression**: khi đi lên, nối tắt x tới ông của nó → cây phẳng dần.
- **Union by size**: gắn cây nhỏ vào cây lớn → cây không bị cao.
Hai kỹ thuật cùng nhau cho chi phí trung bình gần như hằng số (hàm Ackermann ngược α(n) ≤ 4).

Chạy tay ví dụ: cạnh đã sort (0-1:1), (1-2:2), (2-3:3), (0-3:9). Nhận 1, 2, 3 → đủ 3 = n-1 cạnh, tổng 6, dừng; cạnh 9 không cần xét.

~~~java
class Solution {
    public long mst(int n, int[][] edges) {
        int[][] e = edges.clone();                          // không sort trên mảng của caller
        Arrays.sort(e, Comparator.comparingInt(x -> x[2])); // cạnh rẻ trước
        int[] parent = new int[n], size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        long cost = 0;                                      // long: tổng có thể vượt int
        int used = 0;
        if (n == 1) return 0;                               // một site: đã liên thông
        for (int[] x : e) {
            int a = find(parent, x[0]), b = find(parent, x[1]);
            if (a == b) continue;                           // cùng nhóm: cạnh tạo chu trình
            if (size[a] < size[b]) { int t = a; a = b; b = t; }
            parent[b] = a;                                  // gắn cây nhỏ vào cây lớn
            size[a] += size[b];
            cost += x[2];
            if (++used == n - 1) return cost;               // đủ cây khung
        }
        return -1;                                          // hết cạnh mà chưa nối hết
    }

    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];                  // path halving: nối tắt lên ông
            x = parent[x];
        }
        return x;
    }
}
~~~

### Lưu ý khi phỏng vấn
- **Kruskal vs Prim:** Kruskal O(E log E), hợp graph thưa và cạnh cho dạng danh sách. Prim với PriorityQueue O(E log V), hợp graph dày hoặc dạng adjacency list.
- Trả -1 khi graph không liên thông, đừng trả về chi phí của "rừng" (forest) vì caller sẽ tưởng đã nối hết.
- {{find}} dạng vòng lặp tránh đệ quy sâu.

> Senior tip: Union-Find là công cụ rất đa dụng ngoài MST: gộp tài khoản trùng (account merge theo email/số điện thoại), phát hiện cụm thiết bị gian lận dùng chung thông tin, nhóm sự cố liên quan. Nhớ hai tối ưu path compression + union by size.`,
  complexity: 'Time O(E log E), Space O(V + E)',
  starter: 'class Solution {\n    public long mst(int n, int[][] edges) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 6L, () -> s.mst(4, new int[][]{{0, 1, 1}, {1, 2, 2}, {2, 3, 3}, {0, 3, 9}}));
        run("single site", 0L, () -> s.mst(1, new int[][]{}));
        run("disconnected", -1L, () -> s.mst(3, new int[][]{{0, 1, 2}}));
        run("parallel edges", 3L, () -> s.mst(3, new int[][]{{0, 1, 1}, {0, 1, 2}, {1, 2, 2}, {0, 2, 8}}));
        run("zero costs", 0L, () -> s.mst(3, new int[][]{{0, 1, 0}, {1, 2, 0}}));
        run("skip cycle edge", 7L, () -> s.mst(4, new int[][]{{0, 1, 1}, {1, 2, 1}, {0, 2, 1}, {2, 3, 5}, {1, 3, 6}}));
        run("large sum", 3000000L, () -> s.mst(4, new int[][]{{0, 1, 1000000}, {1, 2, 1000000}, {2, 3, 1000000}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Khi nào Prim tốt hơn Kruskal?', 'Nếu có thêm một cạnh mới sau khi đã có MST, cập nhật thế nào mà không chạy lại từ đầu?']
},
{
  id: 'algo-068', title: 'Maximum Subarray Sum', difficulty: 'hard', pattern: 'Dynamic Programming / Prefix', tags: ['array', 'kadane'],
  prompt: `Cho mảng số nguyên {{a}} (có thể có số âm), tìm **tổng lớn nhất** của một đoạn con **liên tiếp, không rỗng**.

### Ví dụ
~~~text
[-2,1,-3,4,-1,2,1,-5,4] -> 6   (đoạn [4,-1,2,1])
[-4,-1,-8]              -> -1  (bắt buộc chọn ít nhất 1 phần tử)
~~~

### Ràng buộc
- {{1 <= a.length <= 2 * 10^5}}
- {{-10^9 <= a[i] <= 10^9}} (tổng có thể vượt int, trả về {{long}})`,
  hints: [
    'Brute force thử mọi đoạn (i, j) là O(n²). Hãy hỏi: "đoạn tốt nhất **kết thúc tại i** có tổng bao nhiêu?"',
    'Đoạn tốt nhất kết thúc tại i hoặc là chỉ có a[i], hoặc là đoạn tốt nhất kết thúc tại i-1 nối thêm a[i]. Chọn cái lớn hơn.',
    'Giữ hai biến: cur (tốt nhất kết thúc tại vị trí hiện tại) và best (tốt nhất toàn cục). Khởi tạo bằng a[0], không phải 0, vì mảng có thể toàn số âm.'
  ],
  solution: `### Ý tưởng (thuật toán Kadane)
Gọi {{cur(i)}} = tổng lớn nhất của đoạn **kết thúc đúng tại i**. Có hai lựa chọn:
- Nối a[i] vào đoạn tốt nhất kết thúc tại i-1: {{cur(i-1) + a[i]}}.
- Bắt đầu đoạn mới chỉ gồm a[i].

Vậy {{cur(i) = max(a[i], cur(i-1) + a[i])}}. Nói cách khác: nếu {{cur(i-1)}} âm thì nó chỉ kéo tổng xuống, nên **bỏ** nó và bắt đầu lại. Đáp án là max của mọi cur(i).

Chạy tay [-2,1,-3,4,-1,2,1,-5,4]:
~~~text
a:    -2   1  -3   4  -1   2   1  -5   4
cur:  -2   1  -2   4   3   5   6   1   5
best: -2   1   1   4   4   5   6   6   6   -> 6
~~~

~~~java
class Solution {
    public long maxSubarray(int[] a) {
        long cur = a[0];                         // tốt nhất kết thúc tại vị trí hiện tại
        long best = a[0];                        // KHÔNG khởi tạo 0: mảng toàn âm phải trả số âm
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);    // bắt đầu lại, hay nối tiếp đoạn cũ?
            best = Math.max(best, cur);
        }
        return best;                             // long: 2*10^5 * 10^9 vượt xa int
    }
}
~~~

### Liên hệ với prefix sum
Tổng đoạn (i, j] = P(j) - P(i). Muốn lớn nhất tại j thì trừ đi **prefix nhỏ nhất** trước j. Đây chính là bài "mua thấp bán cao" (Maximum Profit from One Trade) trên mảng prefix sum; Kadane là cách viết gọn của cùng ý tưởng.

### Lưu ý khi phỏng vấn
- Edge case quan trọng nhất: **mảng toàn số âm**. Khởi tạo {{best = 0}} sẽ trả 0, sai vì đoạn không được rỗng.
- Muốn trả cả vị trí đoạn: lưu {{start}} tạm khi bắt đầu lại, và chốt {{(start, i)}} mỗi khi cập nhật best.
- Biến thể mảng vòng (circular): đáp án = max(Kadane thường, tổng - đoạn con nhỏ nhất), cẩn thận trường hợp toàn âm.

> Senior tip: Kadane dùng thật trong phân tích chuỗi thời gian: tìm khoảng thời gian lãi/lỗ lớn nhất, giai đoạn latency tăng liên tục so với baseline (đổi mỗi điểm thành chênh lệch so với ngưỡng rồi chạy Kadane).`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public long maxSubarray(int[] a) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 6L, () -> s.maxSubarray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4}));
        run("single negative", -7L, () -> s.maxSubarray(new int[]{-7}));
        run("all negative", -1L, () -> s.maxSubarray(new int[]{-4, -1, -8}));
        run("all positive", 10L, () -> s.maxSubarray(new int[]{1, 2, 3, 4}));
        run("zero bridge", 2L, () -> s.maxSubarray(new int[]{1, -1, 0, 2}));
        run("restart after big loss", 7L, () -> s.maxSubarray(new int[]{5, -20, 3, 4}));
        run("overflow int", 3000000000L, () -> s.maxSubarray(new int[]{1000000000, 1000000000, 1000000000}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Làm sao trả cả biên trái và phải của đoạn tối ưu?', 'Nếu mảng là vòng tròn (phần tử cuối nối với đầu) thì xử lý thế nào?']
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
Cần hai việc đều O(1):
- **Tra cứu theo key** → {{HashMap<key, Node>}}.
- **Biết phần tử ít dùng gần đây nhất và đổi thứ tự sử dụng** → **danh sách liên kết đôi** (doubly linked list): đầu danh sách là mới dùng nhất, cuối là lâu nhất. Có con trỏ tới node thì gỡ node ra (unlink) và chèn lên đầu đều O(1), vì chỉ sửa vài con trỏ {{prev}}/{{next}}.

Map trỏ thẳng vào node trong list, nên {{get}} tìm node O(1), rồi chuyển node lên đầu O(1).

Hai node giả {{head}} và {{tail}} (sentinel) luôn nằm ở hai đầu, giúp mọi node thật đều có prev và next khác null → không cần if xử lý list rỗng hay node đầu/cuối.

Chạy tay capacity=2:
~~~text
put(1,1)  list: head-1-tail
put(2,2)  list: head-2-1-tail
get(1)=1  list: head-1-2-tail       (1 lên đầu)
put(3,3)  thêm 3 -> size 3 > 2, xoá node trước tail là 2
          list: head-3-1-tail
get(2)=-1
~~~

~~~java
class LRUCache {
    private static class Node {
        int key, value;
        Node prev, next;
        Node(int key, int value) { this.key = key; this.value = value; }
    }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0); // sentinel

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    private void unlink(Node x) {           // gỡ x khỏi list: nối hai hàng xóm với nhau
        x.prev.next = x.next;
        x.next.prev = x.prev;
    }

    private void addFront(Node x) {         // chèn x ngay sau head (mới dùng nhất)
        x.next = head.next;
        x.prev = head;
        head.next.prev = x;
        head.next = x;
    }

    public int get(int key) {
        Node x = map.get(key);
        if (x == null) return -1;
        unlink(x);                          // vừa được dùng: chuyển lên đầu
        addFront(x);
        return x.value;
    }

    public void put(int key, int value) {
        Node x = map.get(key);
        if (x != null) {                    // key đã có: cập nhật value và làm mới thứ tự
            x.value = value;
            unlink(x);
            addFront(x);
            return;
        }
        x = new Node(key, value);
        map.put(key, x);
        addFront(x);
        if (map.size() > capacity) {        // quá sức chứa: bỏ node lâu nhất (trước tail)
            Node lru = tail.prev;
            unlink(lru);
            map.remove(lru.key);            // Node lưu key chính là để xoá được khỏi map ở đây
        }
    }
}
~~~

### Vì sao Node phải lưu cả key?
Khi evict, ta chỉ có node ở cuối list; phải biết key của nó để {{map.remove(key)}}. Quên lưu key là lỗi hay gặp.

### Lưu ý khi phỏng vấn
- Java có sẵn {{LinkedHashMap(capacity, 0.75f, true)}} (accessOrder = true) + override {{removeEldestEntry}} để làm LRU trong ~5 dòng. Nên nhắc tới, nhưng interviewer thường muốn bạn tự cài đặt.
- Bản này **không thread-safe**. Bọc mọi method bằng {{synchronized}} là cách đơn giản nhất nhưng thành điểm nghẽn; production nên dùng thư viện như Caffeine.

> Senior tip: LRU thuần bị "cache pollution" khi có full scan (một batch đọc hàng triệu key một lần, đẩy hết key nóng ra). Caffeine dùng W-TinyLFU (kết hợp tần suất và độ mới) nên hit rate tốt hơn rõ rệt; đó là câu trả lời mở rộng rất được đánh giá cao.`,
  starter: `class LRUCache {
    public LRUCache(int capacity) {
        // TODO
    }

    public int get(int key) {
        // TODO
        return -1;
    }

    public void put(int key, int value) {
        // TODO
    }
}`,
  tests: `public class Main { static int p=0,t=0; interface C{void run() throws Throwable;} static void c(String n,C x){t++;try{x.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": threw "+e);}} static void eq(int e,int a){if(e!=a)throw new AssertionError("expected "+e+" got "+a);} public static void main(String[]z){c("eviction",()->{LRUCache x=new LRUCache(2);x.put(1,1);x.put(2,2);eq(1,x.get(1));x.put(3,3);eq(-1,x.get(2));});c("update",()->{LRUCache x=new LRUCache(1);x.put(1,1);x.put(1,7);eq(7,x.get(1));});c("refresh order",()->{LRUCache x=new LRUCache(2);x.put(1,1);x.put(2,2);x.get(1);x.put(3,3);eq(-1,x.get(2));eq(1,x.get(1));});c("capacity one",()->{LRUCache x=new LRUCache(1);x.put(4,8);x.put(5,9);eq(-1,x.get(4));eq(9,x.get(5));});c("missing",()->eq(-1,new LRUCache(3).get(99)));System.out.println("RESULT "+p+"/"+t);}}`,
  complexity: 'Time O(1) per operation, Space O(capacity)',
  follow: ['Nếu nhiều thread gọi đồng thời thì bạn bảo vệ cấu trúc map và list thế nào?']
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
Mô hình hoá thành **đồ thị có hướng**: cạnh {{prerequisite -> course}} nghĩa là "phải học prerequisite trước". Học hết được ⇔ đồ thị **không có chu trình** (chu trình A cần B, B cần A thì không bao giờ bắt đầu được).

**Thuật toán Kahn (topological sort bằng BFS):**
1. {{indegree[v]}} = số môn tiên quyết **còn chưa học** của v.
2. Đưa mọi môn có indegree 0 (không cần gì) vào queue.
3. Lấy một môn ra = "học xong môn đó" → giảm indegree của các môn phụ thuộc nó; môn nào về 0 thì đưa vào queue.
4. Đếm số môn đã học. Bằng numCourses → không có chu trình.

Vì sao chu trình bị phát hiện? Các môn trong chu trình chờ lẫn nhau nên indegree của chúng không bao giờ về 0, không bao giờ vào queue → số môn đã học < numCourses.

Chạy tay n=4, prerequisites=[[1,0],[2,1],[3,2]]: indegree = [0,1,1,1]. Queue [0] → học 0, indeg[1]=0 → học 1 → học 2 → học 3. Đếm 4 = n → true.

~~~java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> next = new ArrayList<>();       // next[p] = các môn cần p
        for (int i = 0; i < numCourses; i++) next.add(new ArrayList<>());
        int[] indegree = new int[numCourses];               // số tiên quyết chưa học
        for (int[] e : prerequisites) {                     // e = [course, prerequisite]
            next.get(e[1]).add(e[0]);
            indegree[e[0]]++;
        }
        Queue<Integer> ready = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) ready.offer(i);           // học được ngay
        }
        int learned = 0;
        while (!ready.isEmpty()) {
            int c = ready.poll();
            learned++;                                      // học xong c
            for (int d : next.get(c)) {
                if (--indegree[d] == 0) ready.offer(d);     // d đã đủ tiên quyết
            }
        }
        return learned == numCourses;                       // còn môn kẹt -> có chu trình
    }
}
~~~

### Lưu ý khi phỏng vấn
- Đọc kỹ thứ tự trong cặp: đề cho {{[course, prerequisite]}}, cạnh đi từ {{e[1]}} sang {{e[0]}}. Đảo ngược vẫn cho đúng kết quả true/false nhưng sai thứ tự học nếu bị hỏi tiếp.
- Cạnh trùng lặp vẫn đúng vì indegree tăng và giảm cùng số lần. Self-loop {{[0,0]}} làm indegree[0] = 1 mãi → false, đúng.
- Cách khác: DFS ba màu (trắng/xám/đen), gặp node xám là có chu trình; nhưng đệ quy sâu có thể tràn stack.

> Senior tip: Topological sort có mặt ở khắp nơi: Maven/Gradle sắp thứ tự build module, Spring khởi tạo bean theo dependency (và báo lỗi circular dependency), Flyway/Liquibase, Airflow DAG. Nhắc tới ví dụ thật cho thấy bạn hiểu ứng dụng chứ không chỉ thuộc bài.`,
  starter: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        // TODO
        return false;
    }
}`,
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
**Vì sao greedy (lấy xu lớn nhất trước) sai?** coins=[1,3,4], amount=6: greedy lấy 4+1+1 = 3 xu, nhưng 3+3 chỉ 2 xu.

**DP từ dưới lên:** {{dp[x]}} = số xu ít nhất để tạo đúng x.
- {{dp[0] = 0}} (không cần xu nào).
- Để tạo x, đồng xu **cuối cùng** là một coin c nào đó (c ≤ x); trước đó phải tạo được x - c với ít xu nhất. Vậy {{dp[x] = min(dp[x - c] + 1)}} trên mọi c.
- Khởi tạo các ô còn lại bằng "vô cực" {{INF = amount + 1}} (nhiều hơn mọi đáp án có thể, vì tối đa là amount đồng xu mệnh giá 1). Cuối cùng {{dp[amount]}} còn là INF thì không tạo được.

Chạy tay coins=[1,2,5], amount=11:
~~~text
x:   0 1 2 3 4 5 6 7 8 9 10 11
dp:  0 1 1 2 2 1 2 2 3 3 2  3     (11 = 5 + 5 + 1)
~~~

~~~java
class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;                     // lớn hơn mọi đáp án hợp lệ
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;                                // tạo 0 đồng cần 0 xu
        for (int x = 1; x <= amount; x++) {
            for (int c : coins) {
                if (c <= x && dp[x - c] != INF) { // x - c tạo được thì thêm 1 xu c
                    dp[x] = Math.min(dp[x], dp[x - c] + 1);
                }
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
}
~~~

### Vì sao dùng amount + 1 thay vì Integer.MAX_VALUE?
{{MAX_VALUE + 1}} tràn thành số âm, làm {{min}} chọn sai. INF = amount + 1 đủ lớn mà cộng 1 vẫn an toàn (ở đây còn kiểm tra {{!= INF}} cho rõ ràng).

### Lưu ý khi phỏng vấn
- Đây là **unbounded knapsack**: mỗi coin dùng không giới hạn. Nếu mỗi coin chỉ dùng một lần, phải duyệt x từ lớn xuống nhỏ cho từng coin (0/1 knapsack).
- Biến thể "đếm số cách tạo amount" (Coin Change II): vòng ngoài là coin, vòng trong là x, để không đếm hoán vị trùng.
- Bộ nhớ O(amount): amount 10^9 thì không làm được, cần hỏi lại ràng buộc.

> Senior tip: Hệ mệnh giá tiền thật (1, 2, 5, 10...) là "canonical" nên greedy đúng; nhưng hệ thống voucher/điểm thưởng tuỳ ý thì không. Khi nghiệp vụ hỏi "dùng ít voucher nhất", nhắc tới phản ví dụ [1,3,4] để thuyết phục team không dùng greedy.`,
  starter: `class Solution {
    public int coinChange(int[] coins, int amount) {
        // TODO
        return -1;
    }
}`,
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
**Sliding window** {{[left, right]}} luôn là một chuỗi **không có ký tự lặp**. Mở rộng right từng bước; khi ký tự mới đã nằm trong cửa sổ thì phải dời left qua vị trí cũ của ký tự đó.

Map {{last}} lưu **vị trí gần nhất** mỗi ký tự xuất hiện. Nhờ vậy left nhảy thẳng tới {{last[c] + 1}} thay vì co từng bước.

**Điều kiện quan trọng:** chỉ dời left nếu vị trí cũ **nằm trong cửa sổ** ({{prev >= left}}). Nếu vị trí cũ ở bên trái left thì ký tự đó đã bị loại khỏi cửa sổ rồi; dời left về đó sẽ làm cửa sổ **lùi lại** và sai. Ví dụ {{"abba"}}: tới 'a' cuối, last['a'] = 0 nhưng left đã là 2.

Chạy tay "pwwkew":
~~~text
r=0 'p'  left=0  window "p"    best=1
r=1 'w'  left=0  window "pw"   best=2
r=2 'w'  prev=1 >= 0 -> left=2  "w"    best=2
r=3 'k'  left=2  "wk"          best=2
r=4 'e'  left=2  "wke"         best=3
r=5 'w'  prev=2 >= 2 -> left=3  "kew"  best=3
~~~

~~~java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>(); // ký tự -> index gần nhất
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            Integer prev = last.put(c, right);          // put trả về giá trị cũ (hoặc null)
            if (prev != null && prev >= left) {
                left = prev + 1;                        // bỏ phần cửa sổ tới hết lần xuất hiện cũ
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Mỗi ký tự được xử lý O(1) và left chỉ tăng, nên tổng O(n).
- Nếu chỉ có ASCII, thay HashMap bằng {{int[128]}} (khởi tạo -1): nhanh hơn, không boxing {{Character}}.
- {{char}} là UTF-16 code unit; emoji chiếm 2 char. Nếu đề tính theo ký tự Unicode thật, duyệt bằng code point.

> Senior tip: Đây là khuôn mẫu "cửa sổ dài nhất thoả điều kiện" — thay điều kiện "không lặp" bằng "tối đa K ký tự khác nhau" hay "tối đa K lần thay thế" là ra cả họ bài. Nắm khuôn mẫu, đừng thuộc lòng từng bài.`,
  starter: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // TODO
        return 0;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 3, () -> s.lengthOfLongestSubstring("abcabcbb"));
        run("empty", 0, () -> s.lengthOfLongestSubstring(""));
        run("all same", 1, () -> s.lengthOfLongestSubstring("bbbbb"));
        run("pwwkew", 3, () -> s.lengthOfLongestSubstring("pwwkew"));
        run("distinct", 5, () -> s.lengthOfLongestSubstring("abcde"));
        run("left must not move back", 2, () -> s.lengthOfLongestSubstring("abba"));
        run("dvdf", 3, () -> s.lengthOfLongestSubstring("dvdf"));
        run("spaces count as chars", 3, () -> s.lengthOfLongestSubstring("a b a"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
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
Cách đơn giản nhất là sort rồi lấy {{a[n - k]}}: O(n log n). Ta làm tốt hơn với **min-heap kích thước k**.

Heap luôn chứa **k phần tử lớn nhất đã thấy**. Đỉnh min-heap là phần tử **nhỏ nhất trong k phần tử đó**, tức chính là phần tử lớn thứ k đến thời điểm hiện tại.

Với mỗi x: offer vào heap; nếu heap có k+1 phần tử thì poll phần tử nhỏ nhất ra (nó không thể là top k, vì đã có k phần tử lớn hơn hoặc bằng nó). Duyệt xong, {{peek()}} là đáp án.

Chạy tay [3,2,1,5,6,4], k=2:
~~~text
3 -> {3}
2 -> {2,3}
1 -> {1,2,3} -> poll 1 -> {2,3}
5 -> {2,3,5} -> poll 2 -> {3,5}
6 -> {3,5,6} -> poll 3 -> {5,6}
4 -> {4,5,6} -> poll 4 -> {5,6}
peek = 5
~~~

~~~java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(); // min-heap (mặc định)
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();  // bỏ phần tử nhỏ nhất: chắc chắn không thuộc top k
        }
        return heap.peek();                    // nhỏ nhất trong top k = lớn thứ k
    }
}
~~~

### So sánh các cách
| Cách | Thời gian | Bộ nhớ | Ghi chú |
|---|---|---|---|
| Sort | O(n log n) | O(1)-O(n) | đơn giản nhất |
| Min-heap k | O(n log k) | O(k) | hợp với stream, không sửa input |
| Quickselect | TB O(n), xấu nhất O(n²) | O(1) | sửa input, cần pivot ngẫu nhiên |

### Lưu ý khi phỏng vấn
- Phần tử trùng vẫn được tính riêng: [4,4,4,1], k=2 → 4.
- Quickselect: partition như quicksort nhưng chỉ đệ quy vào **một** phía chứa vị trí n-k. Chọn pivot ngẫu nhiên để tránh worst case O(n²) với input đã sort.

> Senior tip: Heap kích thước k phù hợp với dữ liệu stream (ví dụ p99 latency xấp xỉ, top-k đơn hàng lớn nhất trong ngày) vì chỉ giữ k phần tử trong RAM. Với API không được phép sửa mảng caller chia sẻ, copy trước khi chạy Quickselect.`,
  starter: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        // TODO
        return 0;
    }
}`,
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
Coi mỗi ô đất là một đỉnh, hai ô đất kề nhau (lên/xuống/trái/phải) có cạnh nối. Một **đảo** = một thành phần liên thông. Cách đếm:
1. Quét mọi ô theo thứ tự hàng/cột.
2. Gặp ô đất **chưa thăm** → phát hiện đảo mới, {{count++}}.
3. **Flood fill** (loang) bằng BFS từ ô đó, đánh dấu mọi ô đất đi tới được là đã thăm, để không đếm lại.

Mảng {{dr}}/{{dc}} liệt kê 4 hướng: (1,0) xuống, (-1,0) lên, (0,1) phải, (0,-1) trái. Ô chéo **không** được tính là kề.

Chạy tay grid ví dụ:
~~~text
1 1 0     (0,0) đất mới -> count=1, loang thăm (0,0),(0,1),(1,1)
0 1 0     ...các ô còn lại của đảo 1 đã thăm
0 0 1     (2,2) đất mới -> count=2
~~~

~~~java
class Solution {
    private static final int[] DR = {1, -1, 0, 0};
    private static final int[] DC = {0, 0, 1, -1};

    public int numIslands(char[][] grid) {
        if (grid.length == 0) return 0;
        int rows = grid.length, cols = grid[0].length, count = 0;
        boolean[][] seen = new boolean[rows][cols];     // không sửa grid của caller
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1' || seen[r][c]) continue;
                count++;                                // đảo mới
                Queue<int[]> q = new ArrayDeque<>();
                q.offer(new int[]{r, c});
                seen[r][c] = true;                      // đánh dấu khi enqueue
                while (!q.isEmpty()) {
                    int[] cell = q.poll();
                    for (int d = 0; d < 4; d++) {
                        int nr = cell[0] + DR[d], nc = cell[1] + DC[d];
                        boolean inside = nr >= 0 && nr < rows && nc >= 0 && nc < cols;
                        if (inside && grid[nr][nc] == '1' && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            q.offer(new int[]{nr, nc});
                        }
                    }
                }
            }
        }
        return count;
    }
}
~~~

### Lưu ý khi phỏng vấn
- Mỗi ô được enqueue tối đa một lần → O(rows × cols).
- Đánh dấu **khi enqueue** chứ không phải khi dequeue; nếu không một ô có thể vào queue nhiều lần (từ nhiều hàng xóm).
- DFS đệ quy ngắn hơn nhưng grid 1000×1000 toàn đất sẽ đệ quy sâu 10^6 tầng → StackOverflowError. BFS/stack tường minh an toàn hơn.
- Nếu được phép sửa grid, gán {{grid[r][c] = '0'}} thay cho mảng seen để tiết kiệm bộ nhớ, nhưng phải hỏi trước.

> Senior tip: Bài này là connected components trên lưới; Union-Find cũng giải được và hợp khi ô đất được "bật" dần theo thời gian (bài Number of Islands II). Với ảnh/bản đồ rất lớn, chia ô theo vùng, đếm cục bộ rồi gộp các đảo chạm đường biên.`,
  starter: `class Solution {
    public int numIslands(char[][] grid) {
        // TODO
        return 0;
    }
}`,
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
Mỗi user có một trạng thái riêng: {{start}} (thời điểm mở cửa sổ hiện tại) và {{count}} (số request đã cho qua trong cửa sổ). Lưu trong {{Map<String, State>}}.

Khi có request {{allow(user, now)}}:
1. Chưa có state, **hoặc** cửa sổ đã hết hạn ({{now - start >= windowMs}}) → mở cửa sổ mới bắt đầu tại now, count = 1, cho qua.
2. Còn trong cửa sổ và {{count >= limit}} → từ chối.
3. Còn trong cửa sổ và chưa đủ limit → {{count++}}, cho qua.

Chạy tay limit=2, window=1000:
~~~text
allow(u,0)    : chưa có state -> mở [0, 1000), count=1  -> true
allow(u,5)    : 5-0 < 1000, count 1 < 2 -> count=2      -> true
allow(u,9)    : count 2 >= 2                            -> false
allow(u,1000) : 1000-0 >= 1000 -> mở cửa sổ mới tại 1000 -> true
~~~

~~~java
class RateLimiter {
    private static class State {
        long start;   // thời điểm bắt đầu cửa sổ hiện tại
        int count;    // số request đã cho qua trong cửa sổ
        State(long start) { this.start = start; this.count = 1; }
    }

    private final int limit;
    private final long windowMs;
    private final Map<String, State> states = new HashMap<>();

    RateLimiter(int limit, long windowMs) {
        this.limit = limit;
        this.windowMs = windowMs;
    }

    public boolean allow(String user, long nowMs) {
        State s = states.get(user);
        if (s == null || nowMs - s.start >= windowMs) {   // lần đầu, hoặc cửa sổ đã hết
            states.put(user, new State(nowMs));           // mở cửa sổ mới, request này là thứ 1
            return true;
        }
        if (s.count >= limit) return false;               // đã đủ hạn mức trong cửa sổ
        s.count++;
        return true;
    }
}
~~~

### So sánh các thuật toán rate limit
| Thuật toán | Ưu | Nhược |
|---|---|---|
| Fixed window | đơn giản, O(1) bộ nhớ/user | burst gần 2×limit quanh ranh giới cửa sổ |
| Sliding log | chính xác | lưu mọi timestamp, tốn bộ nhớ |
| Sliding window counter | xấp xỉ tốt, rẻ | phức tạp hơn một chút |
| Token bucket | cho phép burst có kiểm soát | cần tính refill theo thời gian |

### Lưu ý khi phỏng vấn
- Bản này **không thread-safe**: hai thread cùng user có thể đọc count = 1 rồi cùng tăng. Dùng {{ConcurrentHashMap.compute(user, ...)}} để cập nhật nguyên tử theo key.
- State không bao giờ được dọn → map phình to theo số user; cần TTL/eviction (ví dụ Caffeine {{expireAfterAccess}}).
- Dùng thời gian truyền vào (không gọi {{System.currentTimeMillis()}} bên trong) giúp test xác định, và là kỹ thuật inject clock nên dùng trong production code.

> Senior tip: Nhiều instance phía sau load balancer thì limiter trong RAM mỗi máy không còn đúng. Thường dùng Redis: {{INCR}} + {{EXPIRE}} cho fixed window, hoặc Lua script cho token bucket để thao tác nguyên tử; hoặc đẩy rate limit lên API gateway.`,
  starter: `class RateLimiter {
    RateLimiter(int limit, long windowMs) {
        // TODO
    }

    public boolean allow(String user, long nowMs) {
        // TODO
        return false;
    }
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
**Brute force:** với mỗi cửa sổ, duyệt k phần tử tìm max → O(n·k), với n = 10^5 và k = 5·10^4 là quá chậm.

**Nhận xét then chốt:** nếu {{nums[j] <= nums[i]}} với j < i, thì từ lúc i vào cửa sổ, j **không bao giờ** còn là max nữa (j rời cửa sổ trước i, và trong lúc cùng có mặt thì i lớn hơn hoặc bằng). Vậy j có thể bị bỏ ngay.

Sau khi bỏ hết những phần tử "vô dụng" như vậy, các phần tử còn lại có giá trị **giảm dần** từ trái sang phải. Đây gọi là **monotonic deque** (hàng đợi đơn điệu). Max của cửa sổ luôn ở **đầu deque**.

Với mỗi vị trí i:
1. Từ **cuối** deque: bỏ các index có giá trị {{<= nums[i]}} (vô dụng).
2. Thêm i vào cuối.
3. Từ **đầu** deque: nếu index ở đầu đã rời cửa sổ ({{<= i - k}}) thì bỏ.
4. Khi {{i >= k - 1}} (đã đủ một cửa sổ đầy), {{nums[đầu deque]}} là max.

Deque lưu **index** chứ không lưu giá trị, để ở bước 3 biết phần tử nào đã ra khỏi cửa sổ.

Chạy tay nums=[1,3,-1,-3,5,3,6,7], k=3 (deque ghi index:giá trị):
~~~text
i=0 (1):  [0:1]
i=1 (3):  bỏ 0:1          [1:3]
i=2 (-1): [1:3, 2:-1]                 -> max 3
i=3 (-3): [1:3, 2:-1, 3:-3]           -> max 3
i=4 (5):  bỏ hết, [4:5]               -> max 5
i=5 (3):  [4:5, 5:3]                  -> max 5
i=6 (6):  bỏ 5:3, 4:5, [6:6]          -> max 6
i=7 (7):  bỏ 6:6, [7:7]               -> max 7
~~~

~~~java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || k <= 0) return new int[0];
        Deque<Integer> dq = new ArrayDeque<>();          // index, giá trị giảm dần từ đầu tới cuối
        int[] res = new int[nums.length - k + 1];
        int idx = 0;
        for (int i = 0; i < nums.length; i++) {
            // Phần tử nhỏ hơn hoặc bằng nums[i] không bao giờ còn là max: bỏ khỏi cuối
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            // Index ở đầu đã rời cửa sổ [i-k+1, i] thì bỏ
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            // Cửa sổ đầy đầu tiên kết thúc tại i = k - 1
            if (i >= k - 1) res[idx++] = nums[dq.peekFirst()];
        }
        return res;
    }
}
~~~

### Vì sao O(n) dù có while lồng trong for?
Mỗi index được {{offerLast}} đúng một lần và bị poll (từ đầu hoặc cuối) tối đa một lần. Tổng số thao tác trên deque ≤ 2n.

### Lưu ý khi phỏng vấn
- Ở bước 3 chỉ cần {{if}} chứ không cần {{while}}: mỗi bước cửa sổ chỉ trượt 1 ô, nên tối đa một index rời đi.
- k = 1: kết quả là bản sao của nums. Mọi phần tử bằng nhau: dùng {{<=}} nên deque chỉ giữ index mới nhất.

> Senior tip: Monotonic deque là công cụ cho "min/max trên cửa sổ trượt": cảnh báo khi giá trị max của CPU trong 5 phút gần nhất vượt ngưỡng, hay giá thấp nhất trong N phiên. Bộ nhớ O(k) là cận dưới vì phải nhớ các phần tử có thể trở thành max sau này.`,
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
  prompt: `Cho hai từ {{beginWord}} và {{endWord}}, cùng danh sách từ {{wordList}}. Mỗi bước được đổi **đúng một ký tự**, và từ mới phải có trong {{wordList}} ({{beginWord}} không cần có trong danh sách). Trả về **số từ** trên dãy biến đổi ngắn nhất từ {{beginWord}} đến {{endWord}} (tính cả hai đầu). Không có đường thì trả {{0}}; nếu {{beginWord}} bằng {{endWord}} (và endWord có trong danh sách) thì trả {{1}}.

### Ví dụ
~~~text
Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Giải thích: hit -> hot -> dot -> dog -> cog (5 từ, 4 bước) -> trả 5.

Input: cùng beginWord/endWord, wordList = ["hot","dot","dog","lot","log"]
Output: 0   (endWord không có trong danh sách)
~~~

### Ràng buộc
- {{1 <= wordList.length <= 5000}}
- {{1 <= beginWord.length() <= 10}}; mọi từ cùng độ dài, chỉ gồm chữ thường a-z.`,
  hints: [
    'Xem mỗi từ là một đỉnh; hai từ nối nhau nếu khác đúng một ký tự. Cần đường đi ngắn nhất trên đồ thị không trọng số.',
    'Thay vì xây đồ thị tường minh, tạo các từ láng giềng bằng cách thay từng ký tự bằng 26 chữ cái và kiểm tra trong wordList.',
    'BFS từ beginWord, mỗi bước duyệt các từ láng giềng chưa thăm; dùng HashSet để tra cứu nhanh và đánh dấu đã thăm.'
  ],
  solution: `### Ý tưởng
Coi mỗi từ là một **đỉnh**; hai từ khác nhau đúng một ký tự thì có **cạnh**. Bài toán thành: đường đi ít cạnh nhất trong đồ thị không trọng số → **BFS**.

Dựng sẵn đồ thị bằng cách so mọi cặp từ tốn O(n²·L). Thay vào đó, sinh láng giềng **động**: với từ hiện tại, thử thay từng vị trí bằng 26 chữ cái và tra trong {{HashSet}} (O(L) mỗi lần tra vì phải hash chuỗi).

BFS theo **từng lớp**: lớp 1 là beginWord, lớp 2 là các từ cách 1 bước... Biến {{steps}} là số từ trên đường đi tới lớp hiện tại; lần đầu gặp endWord chính là đường ngắn nhất (tính chất của BFS).

Mẹo: dùng chính set {{words}} làm visited: **xoá** từ khỏi set ngay khi đưa vào queue, để không ai thăm lại nó.

~~~java
class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList); // tra O(1) theo hash, kiêm luôn "chưa thăm"
        if (!words.contains(endWord)) return 0;
        Queue<String> q = new ArrayDeque<>();
        q.offer(beginWord);
        words.remove(beginWord);
        int steps = 1;                               // số từ trên đường đi tới lớp hiện tại
        while (!q.isEmpty()) {
            int size = q.size();                     // xử lý trọn một lớp BFS
            for (int i = 0; i < size; i++) {
                String w = q.poll();
                if (w.equals(endWord)) return steps;
                char[] chars = w.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char orig = chars[j];
                    for (char c = 'a'; c <= 'z'; c++) {  // thử mọi chữ cái ở vị trí j
                        chars[j] = c;
                        String next = new String(chars);
                        if (words.remove(next)) {        // có trong từ điển và chưa thăm
                            q.offer(next);
                        }
                    }
                    chars[j] = orig;                     // trả lại ký tự gốc trước khi sang vị trí khác
                }
            }
            steps++;
        }
        return 0;
    }
}
~~~

### Độ phức tạp
Mỗi từ vào queue tối đa một lần (n từ). Với mỗi từ: L vị trí × 26 chữ cái, mỗi lần tạo và hash chuỗi tốn O(L). Tổng O(n · L² · 26) thời gian, O(n · L) bộ nhớ cho set và queue.

### Lưu ý khi phỏng vấn
- {{words.remove(next)}} trả true nếu phần tử có trong set: gộp "kiểm tra" và "đánh dấu đã thăm" làm một.
- Kiểm tra endWord có trong danh sách ngay từ đầu để trả 0 sớm.
- **Bidirectional BFS** (loang đồng thời từ hai đầu, luôn mở rộng phía nhỏ hơn) giảm mạnh số đỉnh phải thăm khi từ điển lớn.

> Senior tip: Nếu từ điển cố định và có nhiều truy vấn, tiền xử lý index theo pattern (h*t, *ot, ho*) để tra láng giềng trực tiếp thay vì thử 26 chữ cái mỗi vị trí; đây là trade-off bộ nhớ đổi lấy tốc độ điển hình.`,
  starter: 'class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        // TODO\n        return 0;\n    }\n}',
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
  complexity: 'Time O(n · L² · 26), Space O(n · L)',
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
**Cách dễ:** merge hai mảng (như Merge Sort) rồi lấy phần tử giữa → O(m+n). Đúng nhưng chưa đạt O(log(min(m,n))).

**Đổi câu hỏi:** median chia tập hợp nhất thành hai nửa bằng nhau, mọi phần tử nửa trái ≤ mọi phần tử nửa phải. Ta tìm một **đường cắt** trên mỗi mảng:
- Cắt nums1 tại {{i}}: nums1[0..i-1] thuộc nửa trái, nums1[i..] thuộc nửa phải.
- Cắt nums2 tại {{j}} tương tự.
- Nửa trái phải có đúng {{half = (m + n + 1) / 2}} phần tử (khi tổng lẻ, nửa trái nhiều hơn một), nên {{j = half - i}}. Chọn i là xác định luôn j.

Đường cắt **đúng** khi phần tử lớn nhất bên trái không vượt phần tử nhỏ nhất bên phải. Vì mỗi mảng đã sort, chỉ cần kiểm tra chéo:
- {{maxLeftA <= minRightB}} (nums1[i-1] ≤ nums2[j])
- {{maxLeftB <= minRightA}} (nums2[j-1] ≤ nums1[i])

Nếu {{maxLeftA > minRightB}}: lấy quá nhiều từ nums1 → giảm i. Ngược lại tăng i. Đây là binary search trên i ∈ [0, m].

Khi cắt sát mép (i = 0 hoặc i = m), một phía không có phần tử; dùng {{Integer.MIN_VALUE}}/{{MAX_VALUE}} làm "lính canh" để phép so sánh luôn đúng mà không cần if riêng.

Chạy tay nums1=[1,2], nums2=[3,4]: m=n=2, half=2.
~~~text
lo=0,hi=2: i=1, j=1: leftA=1, rightA=2, leftB=3, rightB=4
           leftB 3 > rightA 2 -> lấy quá ít từ nums1 -> lo=2
lo=2,hi=2: i=2, j=0: leftA=2, rightA=+inf, leftB=-inf, rightB=3
           2 <= 3 và -inf <= +inf -> đúng. Tổng chẵn:
           (max(2,-inf) + min(+inf,3)) / 2 = (2+3)/2 = 2.5
~~~

~~~java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {               // luôn binary search trên mảng ngắn hơn
            int[] t = nums1; nums1 = nums2; nums2 = t;
        }
        int m = nums1.length, n = nums2.length;
        int half = (m + n + 1) / 2;                      // số phần tử nửa trái
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;                       // cắt nums1: lấy i phần tử sang trái
            int j = half - i;                            // nums2 bù cho đủ half
            int leftA  = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int rightA = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int leftB  = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int rightB = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (leftA <= rightB && leftB <= rightA) {    // đường cắt đúng
                if ((m + n) % 2 == 1) return Math.max(leftA, leftB);
                return ((long) Math.max(leftA, leftB) + Math.min(rightA, rightB)) / 2.0;
            } else if (leftA > rightB) {
                hi = i - 1;                              // quá nhiều phần tử từ nums1
            } else {
                lo = i + 1;                              // quá ít phần tử từ nums1
            }
        }
        throw new IllegalArgumentException("input arrays must be sorted");
    }
}
~~~

### Vì sao j luôn hợp lệ?
Vì m ≤ n và 0 ≤ i ≤ m nên {{j = half - i}} nằm trong [0, n]. Nếu binary search trên mảng dài hơn, j có thể âm → ArrayIndexOutOfBounds. Đó là lý do phải hoán đổi để nums1 là mảng ngắn.

### Lưu ý khi phỏng vấn
- Tổng lẻ: median là {{max(leftA, leftB)}} (nửa trái nhiều hơn một phần tử). Tổng chẵn: trung bình của max trái và min phải.
- Ép {{long}} trước khi cộng để tránh tràn số nếu giá trị gần {{Integer.MAX_VALUE}}; chia cho {{2.0}} để ra số thực.
- Bài này rất dễ sai biên; luyện chạy tay với một mảng rỗng và hai mảng lệch độ dài.

> Senior tip: Nếu dữ liệu là stream liên tục và cần median động, dùng hai heap (max-heap cho nửa dưới, min-heap cho nửa trên) giữ cân bằng kích thước: thêm O(log n), lấy median O(1). Với hệ thống metrics, người ta thường chấp nhận median xấp xỉ (t-digest, HdrHistogram) để tiết kiệm bộ nhớ.`,
  starter: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { double get() throws Throwable; }
    static void run(String name, double expected, Case c) {
        total++;
        try {
            double actual = c.get();
            if (Math.abs(actual - expected) < 1e-9) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("odd", 2.0, () -> s.findMedianSortedArrays(new int[]{1, 3}, new int[]{2}));
        run("even", 2.5, () -> s.findMedianSortedArrays(new int[]{1, 2}, new int[]{3, 4}));
        run("first empty", 1.0, () -> s.findMedianSortedArrays(new int[]{}, new int[]{1}));
        run("second empty", 2.5, () -> s.findMedianSortedArrays(new int[]{1, 2, 3, 4}, new int[]{}));
        run("same values", 3.0, () -> s.findMedianSortedArrays(new int[]{3, 3}, new int[]{3, 3, 3}));
        run("negatives", -1.5, () -> s.findMedianSortedArrays(new int[]{-5, -3, -1}, new int[]{-2, 0, 4}));
        run("disjoint ranges", 5.5, () -> s.findMedianSortedArrays(new int[]{1, 2, 3, 4, 5}, new int[]{6, 7, 8, 9, 10}));
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
Chỉ có cộng và trừ, nên giá trị biểu thức = tổng các số, mỗi số mang một **dấu** (+1 hoặc -1). Khó khăn duy nhất là dấu ngoặc: {{-(3+4)}} đảo dấu mọi số bên trong.

Ta duyệt từng ký tự và giữ:
- {{result}}: tổng đã tính của **cấp ngoặc hiện tại**.
- {{sign}}: dấu áp cho số đang đọc (+1/-1).
- {{number}}: số đang đọc dở (có thể nhiều chữ số).

Quy tắc:
1. **Chữ số:** {{number = number * 10 + digit}} (đọc "123" thành 1 → 12 → 123).
2. **'+' hoặc '-':** số trước đó đã đọc xong → {{result += sign * number}}; đặt sign mới; number = 0.
3. **'(':** bắt đầu biểu thức con. **Cất** {{result}} và {{sign}} hiện tại vào stack (để quay lại sau), rồi reset result = 0, sign = +1.
4. **')':** cộng số cuối vào result (giờ là giá trị biểu thức con). Lấy lại dấu đã cất trước ngoặc và result của cấp ngoài: {{result = outerResult + signBeforeParen * result}}.
5. **Khoảng trắng:** bỏ qua.
Cuối cùng cộng số cuối cùng còn dở: {{result + sign * number}}.

Dấu trừ đứng đầu (hoặc ngay sau '(') hoạt động tự nhiên: lúc đó number = 0, cộng 0 vào result rồi đặt sign = -1.

Chạy tay "1-(-2)":
~~~text
'1'  number=1
'-'  result=1, sign=-1, number=0
'('  push result=1, push sign=-1; result=0, sign=+1
'-'  result=0+1*0=0, sign=-1
'2'  number=2
')'  result=0+(-1)*2=-2; sign cất=-1, result cất=1 -> result = 1 + (-1)*(-2) = 3
kết thúc: 3 + sign*0 = 3
~~~

~~~java
class Solution {
    public int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();   // cất (result, sign) của cấp ngoài
        int result = 0, sign = 1, number = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) {
                number = number * 10 + (c - '0');    // số nhiều chữ số
            } else if (c == '+' || c == '-') {
                result += sign * number;             // chốt số vừa đọc
                sign = (c == '+') ? 1 : -1;
                number = 0;
            } else if (c == '(') {
                stack.push(result);                  // cất tổng cấp ngoài
                stack.push(sign);                    // cất dấu đứng trước '('
                result = 0;
                sign = 1;
            } else if (c == ')') {
                result += sign * number;             // giá trị biểu thức trong ngoặc
                number = 0;
                int signBefore = stack.pop();        // pop ngược thứ tự push: sign trước
                int outer = stack.pop();
                result = outer + signBefore * result;
            }
            // khoảng trắng: bỏ qua
        }
        return result + sign * number;               // số cuối cùng chưa được chốt
    }
}
~~~

### Lưu ý khi phỏng vấn
- Dùng {{ArrayDeque}} thay cho {{java.util.Stack}} (Stack kế thừa Vector, synchronized, là API cũ).
- Lỗi hay gặp: quên cộng số cuối cùng sau vòng lặp; quên reset number sau ')'.
- Stack chỉ sâu bằng số ngoặc lồng nhau, nên Space O(n) trong trường hợp xấu nhất.

> Senior tip: Khi có thêm nhân/chia và ưu tiên toán tử, dùng thuật toán Shunting-yard (hai stack: số và toán tử) hoặc recursive descent parser. Trong production, đừng tự viết parser cho biểu thức người dùng nhập nếu có thư viện đã kiểm chứng; và luôn giới hạn độ dài/độ sâu để tránh tấn công DoS.`,
  starter: 'class Solution {\n    public int calculate(String s) {\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 23, () -> s.calculate("(1+(4+5+2)-3)+(6+8)"));
        run("leading minus with spaces", -12, () -> s.calculate("- (3 + (4 + 5))"));
        run("single", 1, () -> s.calculate("1"));
        run("with spaces", 3, () -> s.calculate(" 2-1 + 2 "));
        run("unary minus inside", 3, () -> s.calculate("1-(-2)"));
        run("multi digit", 1110, () -> s.calculate("1234 - (100 + 24)"));
        run("nested minus", 0, () -> s.calculate("-(1-(2-1))"));
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
Stack lưu **index**, không lưu ký tự. Bất biến (invariant) quan trọng: **đáy stack luôn là index của "vật cản" cuối cùng**, tức vị trí ngay trước đoạn hợp lệ có thể đang hình thành. Ban đầu chưa có vật cản nào nên đẩy {{-1}}.

Duyệt i từ trái sang phải:
- Gặp {{'('}}: push i (ngoặc mở đang chờ được đóng).
- Gặp {{')'}}: pop một phần tử (ghép với ngoặc mở gần nhất).
  - Nếu stack **rỗng** sau khi pop: ta vừa pop mất vật cản, nghĩa là ')' này không có '(' để ghép → chính nó là vật cản mới: push i.
  - Nếu stack **không rỗng**: đoạn từ sau {{stack.peek()}} tới i là hợp lệ, độ dài {{i - stack.peek()}}.

Vì sao {{i - peek}}? Đỉnh stack là index của ký tự **chưa được ghép** gần nhất phía trước (một '(' còn mở hoặc vật cản). Mọi thứ nằm giữa nó và i đều đã ghép cặp hết → đoạn hợp lệ liên tục.

Chạy tay ")()())":
~~~text
khởi tạo stack [-1]
i=0 ')': pop -1 -> rỗng -> push 0       stack [0]
i=1 '(': push 1                          stack [0,1]
i=2 ')': pop 1 -> peek 0 -> len 2-0=2    stack [0]
i=3 '(': push 3                          stack [0,3]
i=4 ')': pop 3 -> peek 0 -> len 4-0=4    stack [0]   best=4
i=5 ')': pop 0 -> rỗng -> push 5         stack [5]
đáp án 4
~~~

~~~java
class Solution {
    public int longestValidParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);                          // vật cản giả: trước index 0
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') {
                stack.push(i);                   // ngoặc mở chờ ghép
            } else {
                stack.pop();                     // ghép với '(' gần nhất (hoặc lấy mất vật cản)
                if (stack.isEmpty()) {
                    stack.push(i);               // ')' thừa: thành vật cản mới
                } else {
                    best = Math.max(best, i - stack.peek()); // đoạn hợp lệ kết thúc tại i
                }
            }
        }
        return best;
    }
}
~~~

### Cách khác O(1) bộ nhớ
Duyệt trái → phải đếm {{open}}, {{close}}: bằng nhau thì cập nhật 2·close; close > open thì reset cả hai. Rồi duyệt phải → trái với điều kiện ngược lại (để bắt trường hợp như "(()" mà lượt đầu bỏ sót).

### Lưu ý khi phỏng vấn
- Mỗi index push/pop tối đa một lần → O(n).
- Dùng {{ArrayDeque}} thay cho {{Stack}} cũ.
- Lỗi hay gặp: chỉ đếm số cặp khớp (cho ")()())" ra 4 đúng nhưng "()(()" ra 4 sai, đáp án là 2 vì hai đoạn hợp lệ không liền nhau).

> Senior tip: Kỹ thuật "stack chứa index + vật cản" dùng lại cho nhiều bài về đoạn liên tiếp (largest rectangle in histogram, next greater element). Khi giải thích, hãy phát biểu invariant của stack trước; interviewer đánh giá cao việc bạn chứng minh được vì sao code đúng.`,
  starter: 'class Solution {\n    public int longestValidParentheses(String s) {\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        run("example", 2, () -> s.longestValidParentheses("(()"));
        run("mixed", 4, () -> s.longestValidParentheses(")()())"));
        run("empty", 0, () -> s.longestValidParentheses(""));
        run("full", 6, () -> s.longestValidParentheses("()(())"));
        run("reversed pair", 0, () -> s.longestValidParentheses(")("));
        run("not contiguous", 2, () -> s.longestValidParentheses("()(()"));
        run("nested and joined", 8, () -> s.longestValidParentheses("((()()))("));
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
  prompt: `Một thông điệp chữ cái được mã hoá thành chuỗi chữ số theo bảng {{A = 1, B = 2, ..., Z = 26}}. Cho chuỗi {{s}} chỉ gồm chữ số, hãy đếm **số cách giải mã** toàn bộ chuỗi trở lại thành chữ cái. Mỗi mã là 1 hoặc 2 chữ số; mã có số {{0}} đứng đầu (như {{"06"}}) không hợp lệ, và riêng {{"0"}} cũng không ứng với chữ nào.

### Ví dụ
~~~text
Input:  s = "12"
Output: 2
Giải thích: "AB" (1, 2) và "L" (12).

Input:  s = "226"
Output: 3
Giải thích: "BZ" (2, 26), "VF" (22, 6), "BBF" (2, 2, 6).

Input:  s = "06"
Output: 0
Giải thích: "0" không phải mã hợp lệ và "06" cũng không (khác "6").
~~~

### Ràng buộc
- {{1 <= s.length <= 100}}
- {{s}} chỉ gồm chữ số {{'0'..'9'}}.
- Đề đảm bảo kết quả vừa kiểu {{int}}.`,
  hints: [
    'Nhìn vào **đoạn mã cuối cùng** của một cách giải mã: hoặc nó là 1 chữ số {{s[i]}} (chỉ được khi khác {{0}}), hoặc là 2 chữ số {{s[i-1..i]}} (chỉ được khi nằm trong 10..26).',
    'Gọi {{ways[i]}} = số cách giải mã {{i}} ký tự đầu. Khi đó {{ways[i] = (s[i-1] != 0 ? ways[i-1] : 0) + (10 <= s[i-2..i-1] <= 26 ? ways[i-2] : 0)}}, với {{ways[0] = 1}} (chuỗi rỗng có đúng 1 cách: không làm gì).',
    'Mỗi bước chỉ cần hai giá trị trước, giống Fibonacci: giữ hai biến {{prev2}}, {{prev1}} thay cho cả mảng để có O(1) bộ nhớ.'
  ],
  solution: `### Ý tưởng
Đây là "Fibonacci có điều kiện". Ở Climbing Stairs, mỗi bước leo 1 hoặc 2 bậc nên {{ways[i] = ways[i-1] + ways[i-2]}}. Ở đây "leo 1 bậc" = dùng 1 chữ số, "leo 2 bậc" = dùng 2 chữ số, nhưng mỗi kiểu chỉ được phép khi mã hợp lệ:
- Dùng 1 chữ số {{s[i-1]}}: hợp lệ khi chữ số đó khác {{'0'}}.
- Dùng 2 chữ số {{s[i-2..i-1]}}: hợp lệ khi giá trị trong khoảng [10, 26] (tự loại "05", "27"...).

Gọi {{ways[i]}} là số cách giải mã **i ký tự đầu**. Đặt {{ways[0] = 1}}: chuỗi rỗng có một cách giải mã (rỗng). Giá trị này giúp công thức đúng cho mã 2 chữ số đầu tiên, ví dụ {{"12"}}: dùng "12" ứng với {{ways[0] = 1}} cách.

~~~java
class Solution {
    public int numDecodings(String s) {
        int prev2 = 1;                                   // ways[i-2], ban dau = ways[0] = 1 (chuoi rong)
        int prev1 = s.charAt(0) == '0' ? 0 : 1;          // ways[i-1], ban dau = ways[1]
        for (int i = 2; i <= s.length(); i++) {
            int cur = 0;
            char one = s.charAt(i - 1);                  // ky tu cuoi cua tien to dai i
            if (one != '0') cur += prev1;                // dung 1 chu so lam ma cuoi
            int two = (s.charAt(i - 2) - '0') * 10 + (one - '0');
            if (two >= 10 && two <= 26) cur += prev2;    // dung 2 chu so lam ma cuoi
            prev2 = prev1;                               // dich cua so sang phai
            prev1 = cur;
        }
        return prev1;                                    // ways[n]
    }
}
~~~

### Chạy tay với s = "226"
| i | tiền tố | 1 chữ số | 2 chữ số | ways[i] |
|---|---|---|---|---|
| 0 | "" | | | 1 |
| 1 | "2" | '2' ✔ → 1 | | 1 |
| 2 | "22" | '2' ✔ → 1 | "22" ✔ → 1 | 2 |
| 3 | "226" | '6' ✔ → 2 | "26" ✔ → 1 | 3 |

### Các trường hợp số 0 (hay bị hỏi)
- {{"10"}} → 1 (chỉ "J"). {{"100"}} → 0: chữ "0" cuối không đứng một mình được và "00" không hợp lệ.
- {{"30"}} → 0: "0" không đứng riêng, "30" > 26.
- {{"101"}} → 1: chỉ có (10, 1).
- Một khi {{ways[i] = 0}} và {{ways[i-1] = 0}} thì mọi giá trị sau cũng bằng 0. Có thể dừng sớm, nhưng không bắt buộc.

### Độ phức tạp
Một vòng lặp → O(n) thời gian, O(1) bộ nhớ.

### Lưu ý khi phỏng vấn
- Nói rõ ý nghĩa {{ways[0] = 1}}: đây là chỗ ứng viên hay lúng túng.
- Viết bản đệ quy có memo trước nếu bạn thấy dễ nghĩ hơn, rồi chuyển sang bottom-up và rút gọn còn hai biến.

> Senior tip: Hầu hết bài "đếm số cách" theo từng vị trí đều có dạng {{ways[i]}} phụ thuộc vài giá trị trước. Hãy tìm "quyết định cuối cùng" (ở đây: mã cuối dài 1 hay 2), công thức sẽ hiện ra.`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public int numDecodings(String s) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example 12", 2, () -> new Solution().numDecodings("12"));
        run("example 226", 3, () -> new Solution().numDecodings("226"));
        run("leading zero", 0, () -> new Solution().numDecodings("06"));
        run("single digit", 1, () -> new Solution().numDecodings("1"));
        run("single zero", 0, () -> new Solution().numDecodings("0"));
        run("ten", 1, () -> new Solution().numDecodings("10"));
        run("twenty-seven", 1, () -> new Solution().numDecodings("27"));
        run("thirty", 0, () -> new Solution().numDecodings("30"));
        run("one zero zero", 0, () -> new Solution().numDecodings("100"));
        run("one zero one", 1, () -> new Solution().numDecodings("101"));
        run("mid zero", 2, () -> new Solution().numDecodings("11106"));
        run("five ones", 8, () -> new Solution().numDecodings("11111"));
        run("twenty ones", 10946, () -> new Solution().numDecodings("11111111111111111111"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần in ra một (hoặc mọi) cách giải mã thay vì đếm thì làm sao?', 'Biến thể Decode Ways II có ký tự {{*}} đại diện cho 1–9: công thức thay đổi thế nào?']
}

);

(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-106',
  title: 'Clone Graph',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['graph', 'dfs', 'bfs', 'hashmap', 'bytebytego'],
  prompt: `Cho một node bất kỳ của **đồ thị vô hướng liên thông**. Mỗi node có giá trị {{val}} (duy nhất) và danh sách {{neighbors}}. Hãy tạo **bản sao sâu** (deep copy) của cả đồ thị và trả về node bản sao tương ứng với node được cho. Bản sao phải gồm toàn node **mới**, không được dùng lại bất kỳ node nào của đồ thị gốc; nếu input là {{null}} thì trả về {{null}}.

### Ví dụ
~~~text
Input:  adjList = [[2,4],[1,3],[2,4],[1,3]]
        (node 1 nối 2 và 4; node 2 nối 1 và 3; node 3 nối 2 và 4; node 4 nối 1 và 3)
Output: [[2,4],[1,3],[2,4],[1,3]]  (cùng cấu trúc, nhưng toàn node mới)

Input:  adjList = [[]]   (một node, không có cạnh)
Output: [[]]
~~~

### Ràng buộc
- {{0 <= số node <= 100}}, {{1 <= Node.val <= 100}}, các {{val}} khác nhau.
- Không có cạnh tự nối và không có cạnh lặp.

> {{Node}} đã được định nghĩa sẵn, gồm trường {{public int val}}, trường {{public List<Node> neighbors}} và constructor {{Node(int val)}} (khởi tạo {{neighbors}} rỗng).`,
  hints: [
    'Đồ thị có chu trình (1 → 2 → 1). Nếu cứ thấy neighbor là tạo node mới thì sẽ lặp vô hạn. Cần nhớ node gốc nào **đã được sao chép**.',
    'Dùng {{Map<Node, Node>}} ánh xạ node gốc → node bản sao. Map này vừa là "visited", vừa giúp nối cạnh tới đúng bản sao đã có.',
    'Tạo bản sao và **đưa vào map trước**, rồi mới duyệt neighbors. Nếu đưa vào map sau khi duyệt xong, chu trình sẽ gọi đệ quy lại chính node đó mãi.'
  ],
  solution: `### Ý tưởng
Duyệt đồ thị gốc (DFS hoặc BFS). Với mỗi node gốc ta tạo đúng **một** node bản sao và ghi vào {{Map<Node, Node> copies}}.
- Gặp node chưa có trong map: tạo bản sao, ghi vào map, rồi sao chép từng neighbor và thêm vào {{neighbors}} của bản sao.
- Gặp node đã có trong map: trả về bản sao đã tạo, không tạo thêm. Đây là điều giúp chu trình không gây lặp vô hạn và các cạnh trỏ đúng vào cùng một node bản sao.

~~~java
class Solution {
    private final Map<Node, Node> copies = new HashMap<>(); // node goc -> node ban sao

    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Node existing = copies.get(node);
        if (existing != null) return existing;      // da sao chep roi: dung lai ban sao
        Node copy = new Node(node.val);
        copies.put(node, copy);                     // ghi vao map TRUOC khi duyet neighbors
        for (Node nb : node.neighbors) {
            copy.neighbors.add(cloneGraph(nb));     // sao chep (hoac lay lai) tung neighbor
        }
        return copy;
    }
}
~~~

### Chạy tay với đồ thị vuông 1-2-3-4
1. {{clone(1)}}: tạo 1', map {1→1'}. Duyệt neighbor 2.
2. {{clone(2)}}: tạo 2', map thêm 2→2'. Neighbor 1 đã có → trả 1'. Neighbor 3 → {{clone(3)}}.
3. {{clone(3)}}: tạo 3'. Neighbor 2 đã có → 2'. Neighbor 4 → {{clone(4)}}: tạo 4', neighbor 1 và 3 đều đã có.
4. Quay về 1: neighbor 4 đã có → 4'. Xong, mỗi node gốc có đúng một bản sao.

### Độ phức tạp
Mỗi node được tạo một lần, mỗi cạnh được duyệt hai lần (vô hướng) → O(V + E) thời gian, O(V) bộ nhớ cho map và stack đệ quy.

### Lưu ý khi phỏng vấn
- Đồ thị rất sâu (dạng đường thẳng hàng nghìn node) có thể làm DFS đệ quy bị {{StackOverflowError}}; khi đó dùng BFS với {{ArrayDeque}}.
- Map dùng {{Node}} làm key dựa trên {{equals/hashCode}} mặc định (so sánh tham chiếu), đúng là điều ta cần. Nếu {{val}} duy nhất thì cũng có thể dùng {{Map<Integer, Node>}}.
- Thứ tự {{neighbors}} của bản sao nên giữ giống bản gốc.

> Senior tip: Cùng mẫu "map từ đối tượng gốc sang bản sao" được dùng khi deep-copy object graph có tham chiếu vòng (ví dụ entity JPA hai chiều). Thiếu map đó là nguyên nhân kinh điển của {{StackOverflowError}} khi serialize hoặc clone.`,
  complexity: 'Time O(V + E), Space O(V)',
  starter: 'class Solution {\n    public Node cloneGraph(Node node) {\n        // TODO\n        return null;\n    }\n}',
  tests: `class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { neighbors = new ArrayList<>(); }
    public Node(int v) { val = v; neighbors = new ArrayList<>(); }
}
public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // adj[i] = danh sach val (1-based) cua neighbor cua node i+1
    static Node build(int[][] adj) {
        if (adj.length == 0) return null;
        Node[] ns = new Node[adj.length];
        for (int i = 0; i < adj.length; i++) ns[i] = new Node(i + 1);
        for (int i = 0; i < adj.length; i++) for (int v : adj[i]) ns[i].neighbors.add(ns[v - 1]);
        return ns[0];
    }
    static Set<Node> collect(Node start) {
        Set<Node> seen = Collections.newSetFromMap(new IdentityHashMap<>());
        Deque<Node> st = new ArrayDeque<>();
        if (start != null) { st.push(start); seen.add(start); }
        while (!st.isEmpty()) for (Node nb : st.pop().neighbors) if (seen.add(nb)) st.push(nb);
        return seen;
    }
    // "ok" neu copy co cung cau truc (giu thu tu neighbors) va khong dung chung node nao voi goc
    static String check(Node orig, Node copy) {
        if (orig == null) return copy == null ? "ok" : "expected null";
        if (copy == null) return "copy is null";
        Set<Node> origNodes = collect(orig);
        Set<Node> copyNodes = collect(copy);
        for (Node n : copyNodes) if (origNodes.contains(n)) return "shares node " + n.val + " with original";
        if (origNodes.size() != copyNodes.size()) return "node count " + copyNodes.size() + " != " + origNodes.size();
        Map<Integer, Node> byVal = new HashMap<>();
        for (Node n : copyNodes) if (byVal.put(n.val, n) != null) return "duplicate copy of node " + n.val;
        for (Node o : origNodes) {
            Node c = byVal.get(o.val);
            if (c == null) return "missing node " + o.val;
            if (c.neighbors.size() != o.neighbors.size()) return "node " + o.val + " neighbor count differs";
            for (int i = 0; i < o.neighbors.size(); i++) {
                if (c.neighbors.get(i) != byVal.get(o.neighbors.get(i).val)) return "node " + o.val + " neighbor " + i + " wrong";
            }
        }
        return copy.val == orig.val ? "ok" : "returned node " + copy.val + " instead of " + orig.val;
    }
    public static void main(String[] args) {
        run("null input", "ok", () -> check(null, new Solution().cloneGraph(null)));
        run("example square", "ok", () -> { Node o = build(new int[][]{{2, 4}, {1, 3}, {2, 4}, {1, 3}}); return check(o, new Solution().cloneGraph(o)); });
        run("single node", "ok", () -> { Node o = build(new int[][]{{}}); return check(o, new Solution().cloneGraph(o)); });
        run("two nodes", "ok", () -> { Node o = build(new int[][]{{2}, {1}}); return check(o, new Solution().cloneGraph(o)); });
        run("triangle", "ok", () -> { Node o = build(new int[][]{{2, 3}, {1, 3}, {1, 2}}); return check(o, new Solution().cloneGraph(o)); });
        run("long path 100", "ok", () -> {
            int n = 100; int[][] adj = new int[n][];
            for (int i = 0; i < n; i++) {
                List<Integer> nb = new ArrayList<>();
                if (i > 0) nb.add(i); if (i < n - 1) nb.add(i + 2);
                adj[i] = nb.stream().mapToInt(Integer::intValue).toArray();
            }
            Node o = build(adj); return check(o, new Solution().cloneGraph(o));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Viết lại bằng BFS với hàng đợi: khác DFS ở chỗ nào?', 'Nếu đồ thị có hướng và không liên thông (cho danh sách mọi node) thì sửa thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-107',
  title: 'Pacific Atlantic Water Flow',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['matrix', 'bfs', 'dfs', 'bytebytego'],
  prompt: `Một hòn đảo hình chữ nhật được chia thành lưới {{m x n}}, {{heights[r][c]}} là độ cao ô {{(r, c)}}. **Thái Bình Dương** giáp cạnh trên và cạnh trái của đảo; **Đại Tây Dương** giáp cạnh dưới và cạnh phải. Nước mưa từ một ô chảy sang ô kề (trên/dưới/trái/phải) nếu ô kề có độ cao **nhỏ hơn hoặc bằng**; ô nằm sát mép đảo chảy thẳng ra đại dương giáp mép đó. Trả về toạ độ {{[r, c]}} của mọi ô mà nước từ đó chảy được ra **cả hai** đại dương, theo thứ tự hàng trước, cột sau (row-major).

### Ví dụ
~~~text
Input:  heights = [[1,2,2,3,5],
                   [3,2,3,4,4],
                   [2,4,5,3,1],
                   [6,7,1,4,5],
                   [5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
Giải thích: ví dụ ô (2,2) cao 5:
  (2,2)=5 → (1,2)=3 → (0,2)=2 → mép trên → Thái Bình Dương
  (2,2)=5 → (2,3)=3 → (2,4)=1 → mép phải → Đại Tây Dương

Input:  heights = [[1]]
Output: [[0,0]]
~~~

### Ràng buộc
- {{1 <= m, n <= 200}}
- {{0 <= heights[r][c] <= 10^5}}`,
  hints: [
    'Thử từ mỗi ô xem nước có ra được biển không sẽ tốn O((mn)²). Hãy đảo chiều câu hỏi: **từ biển đi ngược lên**, những ô nào tới được?',
    'Đi ngược dòng nghĩa là từ ô hiện tại sang ô kề có độ cao **lớn hơn hoặc bằng**. Bắt đầu BFS/DFS từ mọi ô ở mép giáp Thái Bình Dương để đánh dấu {{pacific[r][c]}}; làm tương tự cho Đại Tây Dương.',
    'Đáp án là các ô có cả {{pacific}} và {{atlantic}} đều đúng. Duyệt lưới theo hàng rồi cột để kết quả đúng thứ tự.'
  ],
  solution: `### Ý tưởng
Câu hỏi gốc: "từ ô X nước có chảy ra biển không?". Hỏi cho từng ô thì mỗi lần mất O(mn), tổng O((mn)²) = 1,6·10^9 với lưới 200×200, quá chậm.

Đảo chiều: "biển có thể **ngược dòng** lên tới những ô nào?". Nước chảy từ A xuống B khi {{h[B] <= h[A]}}, nên đi ngược từ B lên A khi {{h[A] >= h[B]}}. Chỉ cần **hai lần BFS nhiều nguồn**:
1. Nguồn = mọi ô ở hàng 0 và cột 0 → đánh dấu {{pacific}}.
2. Nguồn = mọi ô ở hàng m-1 và cột n-1 → đánh dấu {{atlantic}}.
3. Ô thuộc cả hai tập là đáp án.

~~~java
class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        boolean[][] pacific = new boolean[m][n], atlantic = new boolean[m][n];
        Deque<int[]> pq = new ArrayDeque<>(), aq = new ArrayDeque<>();
        for (int r = 0; r < m; r++) {
            mark(pq, pacific, r, 0);          // cot trai giap Thai Binh Duong
            mark(aq, atlantic, r, n - 1);     // cot phai giap Dai Tay Duong
        }
        for (int c = 0; c < n; c++) {
            mark(pq, pacific, 0, c);          // hang tren
            mark(aq, atlantic, m - 1, c);     // hang duoi
        }
        bfs(heights, pq, pacific);
        bfs(heights, aq, atlantic);
        List<List<Integer>> res = new ArrayList<>();
        for (int r = 0; r < m; r++)           // duyet hang roi cot -> ket qua row-major
            for (int c = 0; c < n; c++)
                if (pacific[r][c] && atlantic[r][c]) res.add(Arrays.asList(r, c));
        return res;
    }

    private void mark(Deque<int[]> q, boolean[][] seen, int r, int c) {
        if (!seen[r][c]) { seen[r][c] = true; q.add(new int[]{r, c}); }
    }

    // di nguoc dong: sang o ke co do cao >= o hien tai
    private void bfs(int[][] h, Deque<int[]> q, boolean[][] seen) {
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= h.length || nc < 0 || nc >= h[0].length) continue;
                if (seen[nr][nc] || h[nr][nc] < h[cur[0]][cur[1]]) continue;
                mark(q, seen, nr, nc);
            }
        }
    }
}
~~~

### Chạy tay với lưới 2×2 [[1,2],[4,3]]
- Thái Bình Dương: nguồn (0,0),(0,1),(1,0). Từ (0,1)=2 ngược lên (1,1)=3 (3 ≥ 2) → cả 4 ô.
- Đại Tây Dương: nguồn (1,0),(1,1),(0,1). Từ đó sang (0,0)=1? 1 < 2 và 1 < 4 → không. Vậy 3 ô.
- Giao: (0,1),(1,0),(1,1).

### Độ phức tạp
Mỗi ô vào hàng đợi tối đa một lần cho mỗi đại dương → O(m·n) thời gian và bộ nhớ.

### Lưu ý khi phỏng vấn
- DFS đệ quy cũng được, nhưng lưới 200×200 có thể tạo đường đi dài 40.000 ô → nguy cơ {{StackOverflowError}}; BFS an toàn hơn.
- Điều kiện là **≥** (ô bằng nhau vẫn chảy được). Dùng {{>}} sẽ sai với vùng phẳng.
- Đánh dấu {{seen}} **khi đưa vào hàng đợi**, không phải khi lấy ra, để một ô không bị thêm nhiều lần.

> Senior tip: "Đảo chiều tìm kiếm từ đích" là mẹo tối ưu hay gặp: thay vì hỏi N nguồn có tới được đích không, hãy loang một lần từ đích. Cùng ý tưởng dùng khi tính "service nào bị ảnh hưởng nếu DB X sập" trên đồ thị phụ thuộc.`,
  complexity: 'Time O(m * n), Space O(m * n)',
  starter: 'class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<List<Integer>> L(int[]... rows) {
        List<List<Integer>> r = new ArrayList<>();
        for (int[] row : rows) r.add(Arrays.asList(row[0], row[1]));
        return r;
    }
    public static void main(String[] args) {
        run("example", L(new int[]{0, 4}, new int[]{1, 3}, new int[]{1, 4}, new int[]{2, 2}, new int[]{3, 0}, new int[]{3, 1}, new int[]{4, 0}),
            () -> new Solution().pacificAtlantic(new int[][]{{1, 2, 2, 3, 5}, {3, 2, 3, 4, 4}, {2, 4, 5, 3, 1}, {6, 7, 1, 4, 5}, {5, 1, 1, 2, 4}}));
        run("single cell", L(new int[]{0, 0}), () -> new Solution().pacificAtlantic(new int[][]{{1}}));
        run("single row", L(new int[]{0, 0}, new int[]{0, 1}, new int[]{0, 2}), () -> new Solution().pacificAtlantic(new int[][]{{1, 2, 3}}));
        run("flat 3x3", L(new int[]{0, 0}, new int[]{0, 1}, new int[]{0, 2}, new int[]{1, 0}, new int[]{1, 1}, new int[]{1, 2}, new int[]{2, 0}, new int[]{2, 1}, new int[]{2, 2}),
            () -> new Solution().pacificAtlantic(new int[][]{{3, 3, 3}, {3, 3, 3}, {3, 3, 3}}));
        run("2x2 low corner", L(new int[]{0, 1}, new int[]{1, 0}, new int[]{1, 1}), () -> new Solution().pacificAtlantic(new int[][]{{1, 2}, {4, 3}}));
        run("large 200x200 flat", 40000, () -> {
            int[][] h = new int[200][200];
            return new Solution().pacificAtlantic(h).size();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['DFS đệ quy có rủi ro gì với lưới 200x200 và khắc phục thế nào?', 'Nếu lưới thay đổi (một ô được nâng độ cao) thì có cần tính lại toàn bộ không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-108',
  title: 'Rotting Oranges',
  difficulty: 'medium',
  pattern: 'Graphs (DFS/BFS)',
  tags: ['matrix', 'bfs', 'queue', 'bytebytego'],
  prompt: `Cho lưới {{grid}} kích thước {{m x n}}, mỗi ô là {{0}} (trống), {{1}} (cam tươi) hoặc {{2}} (cam thối). Mỗi phút, mọi quả cam tươi **kề cạnh** (trên/dưới/trái/phải) với một quả cam thối sẽ bị thối. Trả về số phút **ít nhất** để không còn quả cam tươi nào. Nếu có quả không bao giờ bị thối thì trả về {{-1}}; nếu ban đầu đã không có cam tươi thì trả về {{0}}.

### Ví dụ
~~~text
Input:  grid = [[2,1,1],
                [1,1,0],
                [0,1,1]]
Output: 4

Input:  grid = [[2,1,1],
                [0,1,1],
                [1,0,1]]
Output: -1
Giải thích: quả ở góc dưới trái (2,0) không kề quả nào, không bao giờ thối.

Input:  grid = [[0,2]]
Output: 0
~~~

### Ràng buộc
- {{1 <= m, n <= 10}}
- {{grid[r][c]}} là {{0}}, {{1}} hoặc {{2}}.`,
  hints: [
    'Mọi quả thối ban đầu cùng lan **đồng thời**. Đưa tất cả chúng vào hàng đợi ngay từ đầu (BFS nhiều nguồn), không chạy BFS riêng cho từng quả.',
    'Xử lý BFS theo **từng lớp**: lấy đúng {{q.size()}} phần tử hiện có trong hàng đợi = những quả thối ở phút hiện tại; các quả chúng làm thối thuộc phút kế tiếp.',
    'Đếm số cam tươi lúc đầu, giảm dần mỗi khi một quả bị thối. Kết thúc mà vẫn còn cam tươi thì trả {{-1}}.'
  ],
  solution: `### Ý tưởng
Đây là bài "lan truyền theo thời gian" kinh điển và lời giải là **BFS nhiều nguồn**:
1. Duyệt lưới: đưa mọi quả thối vào hàng đợi, đếm số quả tươi {{fresh}}.
2. Nếu {{fresh == 0}} → trả 0.
3. Lặp theo từng phút: lấy ra **đúng số phần tử đang có** trong hàng đợi (lớp hiện tại). Mỗi quả làm thối các quả tươi kề, đổi chúng thành 2 (chính là đánh dấu đã thăm), giảm {{fresh}}, đưa vào hàng đợi cho phút sau.
4. Hết vòng mà {{fresh > 0}} → {{-1}}, ngược lại trả số phút.

Vì sao BFS cho số phút **ít nhất**? BFS thăm các ô theo thứ tự khoảng cách tăng dần tới nguồn gần nhất. Thời điểm một quả bị thối chính là khoảng cách ngắn nhất từ nó tới một quả thối ban đầu.

~~~java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        Deque<int[]> q = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) q.add(new int[]{r, c}); // moi nguon cung bat dau o phut 0
                else if (grid[r][c] == 1) fresh++;
            }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (fresh > 0 && !q.isEmpty()) {
            int size = q.size();                 // so qua thoi cua phut hien tai
            for (int k = 0; k < size; k++) {
                int[] cur = q.poll();
                for (int[] d : dirs) {
                    int r = cur[0] + d[0], c = cur[1] + d[1];
                    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != 1) continue;
                    grid[r][c] = 2;              // lam thoi = danh dau da tham
                    fresh--;
                    q.add(new int[]{r, c});      // se lan tiep o phut sau
                }
            }
            minutes++;                           // xong mot lop = qua mot phut
        }
        return fresh == 0 ? minutes : -1;
    }
}
~~~

### Chạy tay với ví dụ 1
- Phút 0: thối {(0,0)}, fresh = 6.
- Phút 1: (0,1),(1,0) thối. Phút 2: (0,2),(1,1). Phút 3: (2,1). Phút 4: (2,2). fresh = 0 → 4.

### Độ phức tạp
Mỗi ô vào hàng đợi tối đa một lần → O(m·n) thời gian và bộ nhớ.

### Lưu ý khi phỏng vấn
- Điều kiện {{fresh > 0}} trong vòng {{while}} quan trọng: nếu không có, vòng cuối (lớp không làm thối thêm quả nào) vẫn cộng thêm 1 phút.
- Lời giải trên sửa {{grid}} của người gọi. Nếu không được sửa input, dùng mảng {{visited}} riêng hoặc copy lưới. Hỏi interviewer.
- Chạy BFS riêng từ từng quả thối rồi lấy min là sai mô hình (các nguồn lan đồng thời) và chậm hơn.

> Senior tip: BFS nhiều nguồn mô hình hoá tốt "lan truyền đồng thời": cháy rừng, lây nhiễm, hay tính khoảng cách từ mỗi điểm tới kho gần nhất. Nhận ra "nhiều điểm bắt đầu cùng lúc" là chìa khoá.`,
  complexity: 'Time O(m * n), Space O(m * n)',
  starter: 'class Solution {\n    public int orangesRotting(int[][] grid) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", 4, () -> new Solution().orangesRotting(new int[][]{{2, 1, 1}, {1, 1, 0}, {0, 1, 1}}));
        run("unreachable", -1, () -> new Solution().orangesRotting(new int[][]{{2, 1, 1}, {0, 1, 1}, {1, 0, 1}}));
        run("no fresh", 0, () -> new Solution().orangesRotting(new int[][]{{0, 2}}));
        run("only empty", 0, () -> new Solution().orangesRotting(new int[][]{{0}}));
        run("fresh without rotten", -1, () -> new Solution().orangesRotting(new int[][]{{1}}));
        run("two sources at once", 2, () -> new Solution().orangesRotting(new int[][]{{2, 1, 1}, {1, 1, 1}, {0, 1, 2}}));
        run("long line", 9, () -> new Solution().orangesRotting(new int[][]{{2, 1, 1, 1, 1, 1, 1, 1, 1, 1}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu không được sửa grid đầu vào thì đổi code thế nào?', 'Vì sao DFS không phù hợp để tính số phút ít nhất?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-109',
  title: 'Topological Sort of a Directed Graph',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'kahn', 'bytebytego'],
  prompt: `Cho đồ thị có hướng gồm {{V}} đỉnh đánh số {{0..V-1}} và danh sách cạnh {{edges}}, mỗi cạnh {{[u, v]}} nghĩa là có mũi tên {{u → v}}. Trả về một **thứ tự topo** bất kỳ: mảng chứa mỗi đỉnh đúng một lần sao cho với mọi cạnh {{u → v}}, {{u}} đứng trước {{v}}. Nếu đồ thị có chu trình (kể cả cạnh tự nối {{[x, x]}}) thì không tồn tại thứ tự topo, trả về mảng rỗng.

### Ví dụ
~~~text
Input:  V = 4, edges = [[0,1],[1,2],[2,3]]
Output: [0,1,2,3]

Input:  V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]
Output: [0,1,2,3] hoặc [0,2,1,3] (đều hợp lệ)

Input:  V = 3, edges = [[0,1],[1,2],[2,0]]
Output: []   (chu trình 0 → 1 → 2 → 0)
~~~

### Ràng buộc
- {{1 <= V <= 10^4}}
- {{0 <= edges.length <= 10^4}}, {{0 <= u, v < V}}`,
  hints: [
    'Đỉnh nào **không có mũi tên đi vào** (bậc vào = 0) thì không phải chờ ai, có thể đứng đầu.',
    'Thuật toán Kahn: đưa mọi đỉnh bậc vào 0 vào hàng đợi. Lấy một đỉnh ra, ghi vào kết quả, rồi "xoá" các cạnh đi ra từ nó (giảm bậc vào của đỉnh đích). Đỉnh nào giảm về 0 thì vào hàng đợi.',
    'Nếu đến cuối mà số đỉnh đã ghi nhận ít hơn {{V}} thì các đỉnh còn lại nằm trong chu trình (luôn còn mũi tên đi vào) → trả mảng rỗng.'
  ],
  solution: `### Ý tưởng
Thứ tự topo giống sắp lịch công việc có phụ thuộc: việc nào không phụ thuộc ai thì làm trước, làm xong thì "gỡ" phụ thuộc của các việc sau.

**Thuật toán Kahn** (BFS theo bậc vào):
1. Dựng danh sách kề {{adj}} và mảng {{indeg[v]}} = số cạnh đi vào {{v}}.
2. Đưa mọi đỉnh có {{indeg == 0}} vào hàng đợi.
3. Lấy đỉnh {{u}} ra, ghi vào kết quả. Với mỗi cạnh {{u → v}}: giảm {{indeg[v]}}; nếu về 0 thì {{v}} sẵn sàng → vào hàng đợi.
4. Nếu số đỉnh ghi nhận {{< V}} → có chu trình.

Vì sao phát hiện được chu trình? Trong một chu trình, mỗi đỉnh luôn có ít nhất một cạnh đi vào từ đỉnh khác **trong cùng chu trình**; không đỉnh nào của chu trình được ghi nhận trước nên bậc vào không bao giờ về 0.

~~~java
class Solution {
    public int[] topoSort(int V, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[V];                 // so canh di vao moi dinh
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indeg[e[1]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int v = 0; v < V; v++) if (indeg[v] == 0) q.add(v); // khong phu thuoc ai
        int[] order = new int[V];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            order[idx++] = u;
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) q.add(v);    // v het phu thuoc -> san sang
            }
        }
        return idx == V ? order : new int[0];     // thieu dinh -> co chu trinh
    }
}
~~~

### Chạy tay với V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]
- indeg = [0,1,1,2]. Hàng đợi: [0].
- Lấy 0 → indeg[1]=0, indeg[2]=0 → hàng đợi [1,2].
- Lấy 1 → indeg[3]=1. Lấy 2 → indeg[3]=0 → hàng đợi [3]. Lấy 3.
- Kết quả [0,1,2,3], đủ 4 đỉnh.

### Độ phức tạp
Mỗi đỉnh vào/ra hàng đợi một lần, mỗi cạnh được xét một lần → O(V + E) thời gian, O(V + E) bộ nhớ.

### Lưu ý khi phỏng vấn
- Có nhiều thứ tự hợp lệ; nếu cần thứ tự nhỏ nhất theo từ điển thì thay hàng đợi bằng {{PriorityQueue}} (O((V + E) log V)).
- Cách khác: DFS, đỉnh nào **duyệt xong** thì đẩy vào stack; đảo stack là thứ tự topo. Phát hiện chu trình bằng 3 màu (chưa thăm / đang thăm / xong).
- Bài này gần như **trùng thuật toán với algo-110 (Course Schedule II)**, chỉ khác cách diễn đạt cạnh.

> Senior tip: Topological sort là lõi của build tool (Maven/Gradle sắp thứ tự module), Spring khởi tạo bean theo phụ thuộc, và migration DB. Lỗi "circular dependency" bạn từng gặp chính là bước 4 của Kahn.`,
  complexity: 'Time O(V + E), Space O(V + E)',
  starter: 'class Solution {\n    public int[] topoSort(int V, int[][] edges) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // tra ve "valid" neu res la hoan vi cua 0..V-1 va moi canh u->v co u dung truoc v
    static String check(int V, int[][] edges, int[] res) {
        if (res == null) return "null";
        if (res.length != V) return "length " + res.length + ": " + Arrays.toString(res);
        int[] pos = new int[V];
        Arrays.fill(pos, -1);
        for (int i = 0; i < V; i++) {
            if (res[i] < 0 || res[i] >= V || pos[res[i]] != -1) return "not a permutation: " + Arrays.toString(res);
            pos[res[i]] = i;
        }
        for (int[] e : edges) if (pos[e[0]] >= pos[e[1]]) return "edge " + e[0] + "->" + e[1] + " violated: " + Arrays.toString(res);
        return "valid";
    }
    public static void main(String[] args) {
        run("chain", "valid", () -> { int[][] e = {{0, 1}, {1, 2}, {2, 3}}; return check(4, e, new Solution().topoSort(4, e)); });
        run("diamond", "valid", () -> { int[][] e = {{0, 1}, {0, 2}, {1, 3}, {2, 3}}; return check(4, e, new Solution().topoSort(4, e)); });
        run("reverse numbering", "valid", () -> { int[][] e = {{3, 2}, {2, 1}, {1, 0}}; return check(4, e, new Solution().topoSort(4, e)); });
        run("no edges", "valid", () -> check(3, new int[0][], new Solution().topoSort(3, new int[0][])));
        run("cycle -> empty", 0, () -> new Solution().topoSort(3, new int[][]{{0, 1}, {1, 2}, {2, 0}}).length);
        run("self loop -> empty", 0, () -> new Solution().topoSort(2, new int[][]{{0, 1}, {1, 1}}).length);
        run("large chain 10000", "valid", () -> {
            int V = 10000; int[][] e = new int[V - 1][];
            for (int i = 0; i + 1 < V; i++) e[i] = new int[]{V - 1 - i, V - 2 - i};
            return check(V, e, new Solution().topoSort(V, e));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Viết thứ tự topo bằng DFS và phát hiện chu trình bằng 3 trạng thái màu như thế nào?', 'Muốn thứ tự topo nhỏ nhất theo từ điển thì sửa gì?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-110',
  title: 'Course Schedule II',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'bytebytego'],
  prompt: `Có {{numCourses}} môn học đánh số {{0..numCourses-1}}. {{prerequisites[i] = [a, b]}} nghĩa là muốn học môn {{a}} thì phải học xong môn {{b}} trước. Trả về **một** thứ tự học hết mọi môn thoả mãn tất cả điều kiện; nếu không thể (điều kiện vòng tròn) thì trả về mảng rỗng.

### Ví dụ
~~~text
Input:  numCourses = 2, prerequisites = [[1,0]]
Output: [0,1]

Input:  numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
Output: [0,1,2,3] hoặc [0,2,1,3]

Input:  numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: []   (0 cần 1, 1 lại cần 0)
~~~

### Ràng buộc
- {{1 <= numCourses <= 2000}}
- {{0 <= prerequisites.length <= numCourses * (numCourses - 1)}}
- Các cặp {{[a, b]}} khác nhau và {{a != b}}.`,
  hints: [
    'Vẽ mỗi điều kiện {{[a, b]}} thành mũi tên {{b → a}} ("học b xong mới tới a"). Bài toán trở thành tìm thứ tự topo.',
    'Môn không có điều kiện tiên quyết (bậc vào 0) học trước. Học xong một môn thì giảm bậc vào của các môn phụ thuộc nó (thuật toán Kahn).',
    'Nếu học được ít hơn {{numCourses}} môn thì có vòng phụ thuộc → trả mảng rỗng.'
  ],
  solution: `### Ý tưởng
Đổi đề sang đồ thị: mỗi môn là một đỉnh, điều kiện {{[a, b]}} là cạnh {{b → a}}. Thứ tự học hợp lệ chính là **thứ tự topo**. Dùng thuật toán Kahn:
1. {{indeg[a]}} = số môn tiên quyết của {{a}}.
2. Hàng đợi khởi đầu = các môn có {{indeg == 0}} (học ngay được).
3. Lấy môn {{b}} ra, thêm vào lịch học. Với mỗi môn {{a}} cần {{b}}: {{indeg[a]--}}; về 0 thì {{a}} đã đủ điều kiện → vào hàng đợi.
4. Lịch học đủ {{numCourses}} môn → trả lịch; ngược lại có vòng → mảng rỗng.

~~~java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> next = new ArrayList<>();  // next[b] = cac mon can b
        for (int i = 0; i < numCourses; i++) next.add(new ArrayList<>());
        int[] indeg = new int[numCourses];             // so mon tien quyet con thieu
        for (int[] p : prerequisites) {
            next.get(p[1]).add(p[0]);                  // canh b -> a
            indeg[p[0]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int c = 0; c < numCourses; c++) if (indeg[c] == 0) q.add(c);
        int[] order = new int[numCourses];
        int taken = 0;
        while (!q.isEmpty()) {
            int b = q.poll();
            order[taken++] = b;                        // hoc mon b
            for (int a : next.get(b)) {
                if (--indeg[a] == 0) q.add(a);         // a da du dieu kien
            }
        }
        return taken == numCourses ? order : new int[0];
    }
}
~~~

### Chạy tay với ví dụ 2
indeg = [0,1,1,2]. Hàng đợi [0] → học 0, môn 1 và 2 về 0 → học 1 (môn 3 còn 1) → học 2 (môn 3 về 0) → học 3. Kết quả [0,1,2,3].

### Độ phức tạp
O(V + E) thời gian và bộ nhớ, với V = số môn, E = số điều kiện.

### Lưu ý khi phỏng vấn
- Hay nhầm chiều cạnh: {{[a, b]}} là "a cần b" nên cạnh đi **từ b sang a**. Nói to điều này khi phỏng vấn.
- Course Schedule I (algo-029, algo-073) chỉ hỏi "có học hết được không" → cùng code, trả {{taken == numCourses}}.
- Bài này cùng thuật toán với algo-109 (Topological Sort).

> Senior tip: Hệ thống CI/CD chạy job theo pipeline có phụ thuộc, hay Kubernetes/Helm cài chart có dependency, đều cần thứ tự topo và phải báo lỗi rõ ràng khi có vòng. Trong thực tế nên in ra **các đỉnh còn lại** (chính là các đỉnh dính vòng) để người dùng sửa cấu hình.`,
  complexity: 'Time O(V + E), Space O(V + E)',
  starter: 'class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // "valid" neu res la hoan vi 0..n-1 va moi [a,b] co b hoc truoc a
    static String check(int n, int[][] pre, int[] res) {
        if (res == null) return "null";
        if (res.length != n) return "length " + res.length + ": " + Arrays.toString(res);
        int[] pos = new int[n];
        Arrays.fill(pos, -1);
        for (int i = 0; i < n; i++) {
            if (res[i] < 0 || res[i] >= n || pos[res[i]] != -1) return "not a permutation: " + Arrays.toString(res);
            pos[res[i]] = i;
        }
        for (int[] p : pre) if (pos[p[1]] >= pos[p[0]]) return "course " + p[0] + " before its prerequisite " + p[1];
        return "valid";
    }
    public static void main(String[] args) {
        run("example", "valid", () -> { int[][] p = {{1, 0}}; return check(2, p, new Solution().findOrder(2, p)); });
        run("diamond", "valid", () -> { int[][] p = {{1, 0}, {2, 0}, {3, 1}, {3, 2}}; return check(4, p, new Solution().findOrder(4, p)); });
        run("single course", "valid", () -> check(1, new int[0][], new Solution().findOrder(1, new int[0][])));
        run("no prerequisites", "valid", () -> check(3, new int[0][], new Solution().findOrder(3, new int[0][])));
        run("two-course cycle", 0, () -> new Solution().findOrder(2, new int[][]{{1, 0}, {0, 1}}).length);
        run("cycle in part of graph", 0, () -> new Solution().findOrder(4, new int[][]{{1, 0}, {2, 1}, {3, 2}, {1, 3}}).length);
        run("edge direction matters", "valid", () -> { int[][] p = {{0, 1}, {0, 2}, {1, 2}}; return check(3, p, new Solution().findOrder(3, p)); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu có vòng phụ thuộc, làm sao in ra chính các môn nằm trong vòng?', 'Nếu mỗi học kỳ học được tối đa k môn thì cần tối thiểu bao nhiêu học kỳ?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-111',
  title: 'Alien Dictionary',
  difficulty: 'hard',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'string', 'bytebytego'],
  prompt: `Một ngôn ngữ ngoài hành tinh dùng các chữ cái {{a-z}} nhưng theo **thứ tự khác**. Bạn nhận danh sách {{words}} đã được sắp xếp theo thứ tự từ điển của ngôn ngữ đó. Hãy suy ra một thứ tự các chữ cái và trả về dưới dạng chuỗi chứa **mọi chữ cái xuất hiện** trong {{words}}, mỗi chữ đúng một lần. Nếu có nhiều đáp án, trả về bất kỳ. Nếu dữ liệu mâu thuẫn thì trả về {{""}}. Dữ liệu mâu thuẫn gồm hai loại: có vòng thứ tự (a trước b, b trước a), hoặc một từ đứng trước **tiền tố của chính nó** (ví dụ {{"abc"}} đứng trước {{"ab"}}).

### Ví dụ
~~~text
Input:  words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"
Giải thích: "wrt" < "wrf" cho t < f; "wrf" < "er" cho w < e; "er" < "ett" cho r < t; "ett" < "rftt" cho e < r.

Input:  words = ["z","x","z"]
Output: ""   (z < x và x < z: mâu thuẫn)

Input:  words = ["abc","ab"]
Output: ""   (từ dài đứng trước tiền tố của nó)
~~~

### Ràng buộc
- {{1 <= words.length <= 100}}
- {{1 <= words[i].length <= 100}}
- {{words[i]}} chỉ gồm chữ cái thường {{a-z}}.`,
  hints: [
    'So sánh **hai từ liền kề**: ký tự khác nhau **đầu tiên** cho ta đúng một thông tin "chữ c1 đứng trước chữ c2". Các ký tự phía sau không cho thông tin gì.',
    'Mỗi thông tin là một cạnh {{c1 → c2}} trong đồ thị 26 đỉnh. Thứ tự chữ cái cần tìm là thứ tự topo của đồ thị đó (thuật toán Kahn).',
    'Hai trường hợp trả {{""}}: (1) topo sort không lấy được hết các chữ (có vòng); (2) hai từ liền kề không có ký tự khác nhau nhưng từ trước dài hơn từ sau.'
  ],
  solution: `### Ý tưởng
Từ điển bình thường so sánh hai từ bằng **ký tự khác nhau đầu tiên**. Đảo ngược: nhìn hai từ liền kề, ký tự khác nhau đầu tiên cho biết chữ nào đứng trước. Ví dụ {{"wrt" < "wrf"}}: ký tự đầu tiên khác nhau là {{t}} và {{f}} → {{t}} trước {{f}}.

Các bước:
1. Ghi nhận mọi chữ xuất hiện (cả những chữ không có quan hệ nào cũng phải có trong kết quả).
2. Với mỗi cặp từ liền kề, tìm ký tự khác nhau đầu tiên → cạnh {{c1 → c2}} (dùng Set để không đếm trùng cạnh). Nếu không có ký tự khác mà từ trước dài hơn → mâu thuẫn, trả {{""}}.
3. Kahn: chữ có bậc vào 0 ra trước. Nếu lấy được ít chữ hơn số chữ xuất hiện → có vòng → {{""}}.

~~~java
class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new HashMap<>();
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words)
            for (char c : w.toCharArray()) {          // moi chu xuat hien deu la mot dinh
                adj.putIfAbsent(c, new HashSet<>());
                indeg.putIfAbsent(c, 0);
            }
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int len = Math.min(a.length(), b.length());
            int j = 0;
            while (j < len && a.charAt(j) == b.charAt(j)) j++; // tim ky tu khac dau tien
            if (j == len) {
                if (a.length() > b.length()) return "";        // "abc" truoc "ab": vo ly
                continue;                                       // khong co thong tin moi
            }
            char from = a.charAt(j), to = b.charAt(j);
            if (adj.get(from).add(to)) indeg.merge(to, 1, Integer::sum); // canh moi: tang bac vao
        }
        Deque<Character> q = new ArrayDeque<>();
        for (Map.Entry<Character, Integer> e : indeg.entrySet()) if (e.getValue() == 0) q.add(e.getKey());
        StringBuilder order = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll();
            order.append(c);
            for (char nx : adj.get(c)) {
                if (indeg.merge(nx, -1, Integer::sum) == 0) q.add(nx);
            }
        }
        return order.length() == indeg.size() ? order.toString() : ""; // thieu chu -> co vong
    }
}
~~~

### Chạy tay với ví dụ 1
Cạnh: t→f, w→e, r→t, e→r. Bậc vào: w=0, e=1, r=1, t=1, f=1.
Kahn: w → (e về 0) e → r → t → f. Kết quả "wertf".

### Độ phức tạp
Gọi C = tổng số ký tự của mọi từ. Bước so sánh O(C); đồ thị tối đa 26 đỉnh và 26·25 cạnh nên topo sort coi như O(1). Tổng O(C) thời gian, O(1) bộ nhớ phụ (bảng chữ cái cố định).

### Lưu ý khi phỏng vấn
- **Chỉ** ký tự khác nhau đầu tiên mới cho thông tin; so sánh tiếp các ký tự sau là sai.
- Bẫy tiền tố: {{["abc","ab"]}} không thể là từ điển hợp lệ ở bất kỳ ngôn ngữ nào.
- Chữ xuất hiện mà không có quan hệ vẫn phải có trong kết quả (ví dụ {{["z"]}} → {{"z"}}).
- Không thêm cạnh trùng hai lần vào {{indeg}}, nếu không bậc vào bị đếm sai và thuật toán báo vòng nhầm.

> Senior tip: Bài này kiểm tra khả năng **mô hình hoá**: biến dữ liệu chuỗi thành đồ thị rồi áp thuật toán chuẩn. Khi gặp vấn đề lạ, hãy hỏi "đâu là đỉnh, đâu là cạnh?". Rất nhiều bài toán phụ thuộc thực tế giải theo cách này.`,
  complexity: 'Time O(C) với C = tổng số ký tự, Space O(1) (tối đa 26 chữ)',
  starter: 'class Solution {\n    public String alienOrder(String[] words) {\n        // TODO\n        return "";\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // "valid" neu order chua dung moi chu xuat hien (moi chu 1 lan) va words duoc sap xep theo order
    static String check(String[] words, String order) {
        Map<Character, Integer> pos = new HashMap<>();
        for (int i = 0; i < order.length(); i++) if (pos.put(order.charAt(i), i) != null) return "duplicate letter in " + order;
        Set<Character> chars = new HashSet<>();
        for (String w : words) for (char c : w.toCharArray()) chars.add(c);
        if (!chars.equals(pos.keySet())) return "letters " + pos.keySet() + " != " + chars;
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int j = 0, len = Math.min(a.length(), b.length());
            while (j < len && a.charAt(j) == b.charAt(j)) j++;
            if (j < len && pos.get(a.charAt(j)) > pos.get(b.charAt(j))) return "order " + order + " breaks " + a + " < " + b;
        }
        return "valid";
    }
    public static void main(String[] args) {
        run("example (unique answer)", "wertf", () -> new Solution().alienOrder(new String[]{"wrt", "wrf", "er", "ett", "rftt"}));
        run("cycle", "", () -> new Solution().alienOrder(new String[]{"z", "x", "z"}));
        run("prefix invalid", "", () -> new Solution().alienOrder(new String[]{"abc", "ab"}));
        run("single word", "valid", () -> { String[] w = {"z"}; return check(w, new Solution().alienOrder(w)); });
        run("letters without relation kept", "valid", () -> { String[] w = {"ab", "adc"}; return check(w, new Solution().alienOrder(w)); });
        run("conflict across pairs", "", () -> new Solution().alienOrder(new String[]{"ac", "bc", "ad", "bd"}));
        run("same words", "valid", () -> { String[] w = {"z", "z"}; return check(w, new Solution().alienOrder(w)); });
        run("repeated relation", "valid", () -> { String[] w = {"ab", "ac", "bb", "bc"}; return check(w, new Solution().alienOrder(w)); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Làm sao biết thứ tự suy ra được là **duy nhất**?', 'Nếu danh sách từ rất lớn và đến dần theo stream thì xây đồ thị thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-112',
  title: 'Sequence Reconstruction',
  difficulty: 'medium',
  pattern: 'Topological Sort',
  tags: ['graph', 'topological-sort', 'bytebytego'],
  prompt: `Cho mảng {{org}} là một hoán vị của {{1..n}} và danh sách các dãy {{seqs}}. Mỗi dãy trong {{seqs}} cho biết thứ tự: phần tử đứng trước phải xuất hiện trước phần tử đứng sau. Hỏi {{org}} có phải là dãy **duy nhất** có độ dài n thoả mọi dãy trong {{seqs}} (mỗi dãy là dãy con của nó) hay không? Trả về {{false}} nếu {{seqs}} chứa số nằm ngoài {{1..n}}, hoặc không nhắc tới đủ mọi số {{1..n}}.

### Ví dụ
~~~text
Input:  org = [1,2,3], seqs = [[1,2],[1,3]]
Output: false
Giải thích: cả [1,2,3] và [1,3,2] đều thoả, nên không duy nhất.

Input:  org = [1,2,3], seqs = [[1,2],[2,3]]
Output: true

Input:  org = [4,1,5,2,6,3], seqs = [[5,2,6,3],[4,1,5,2]]
Output: true
~~~

### Ràng buộc
- {{1 <= n <= 10^4}}, {{org}} là hoán vị của {{1..n}}
- {{1 <= seqs[i].length}}, tổng độ dài các dãy {{<= 10^5}}`,
  hints: [
    'Mỗi cặp phần tử **liền kề** trong một dãy {{seqs[i]}} cho một cạnh {{u → v}}. Dãy cần tìm là một thứ tự topo của đồ thị đó.',
    'Thứ tự topo là **duy nhất** khi và chỉ khi ở mọi bước của Kahn, hàng đợi chỉ có **đúng một** đỉnh (nếu có hai đỉnh cùng sẵn sàng thì đổi thứ tự chúng được).',
    'Đi song song với {{org}}: đỉnh lấy ra ở bước i phải bằng {{org[i]}}. Đừng quên kiểm tra số lạ và số bị thiếu.'
  ],
  solution: `### Ý tưởng
1. **Dựng đồ thị:** với mỗi dãy, mỗi cặp liền kề {{(u, v)}} là cạnh {{u → v}} (dùng Set để không tính trùng). Đồng thời kiểm tra mọi số nằm trong {{1..n}} và đánh dấu số nào đã xuất hiện.
2. **Kahn có kiểm tra duy nhất:** nếu hàng đợi có ≥ 2 đỉnh thì có ít nhất hai thứ tự khác nhau → {{false}}. Đỉnh lấy ra phải đúng bằng {{org[idx]}}.
3. Cuối cùng phải xử lý đủ n đỉnh (không có vòng).

Vì sao "hàng đợi luôn đúng một phần tử" ⇔ duy nhất? Nếu lúc nào đó có hai đỉnh {{x, y}} cùng bậc vào 0 thì giữa chúng không có ràng buộc, đổi chỗ x và y vẫn hợp lệ → có ≥ 2 đáp án. Ngược lại, nếu luôn chỉ một lựa chọn thì mỗi bước bị ép buộc → đáp án duy nhất.

~~~java
class Solution {
    public boolean sequenceReconstruction(int[] org, int[][] seqs) {
        int n = org.length;
        List<Set<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new HashSet<>());
        int[] indeg = new int[n + 1];
        boolean[] seen = new boolean[n + 1];
        for (int[] seq : seqs) {
            for (int i = 0; i < seq.length; i++) {
                if (seq[i] < 1 || seq[i] > n) return false;    // so la
                seen[seq[i]] = true;
                if (i > 0 && adj.get(seq[i - 1]).add(seq[i])) indeg[seq[i]]++; // canh moi
            }
        }
        for (int v = 1; v <= n; v++) if (!seen[v]) return false; // thieu so -> khong xac dinh duoc
        Deque<Integer> q = new ArrayDeque<>();
        for (int v = 1; v <= n; v++) if (indeg[v] == 0) q.add(v);
        int idx = 0;
        while (!q.isEmpty()) {
            if (q.size() > 1) return false;        // 2 lua chon -> khong duy nhat
            int u = q.poll();
            if (org[idx++] != u) return false;     // khac org
            for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        return idx == n;                           // thieu dinh -> co vong
    }
}
~~~

### Chạy tay với org = [1,2,3], seqs = [[1,2],[1,3]]
Cạnh 1→2, 1→3. Hàng đợi [1] → lấy 1 (= org[0]) → 2 và 3 cùng về 0 → hàng đợi có 2 phần tử → {{false}}.

### Độ phức tạp
O(n + L) với L = tổng độ dài các dãy (mỗi cặp liền kề tạo tối đa một cạnh).

### Lưu ý khi phỏng vấn
- Cạnh u → u (hai số giống nhau liền kề) là vòng tự nối: lời giải trên tự động trả {{false}} vì bậc vào của u không về 0.
- Cách khác không cần Kahn: kiểm tra mọi cặp liền kề {{(org[i], org[i+1])}} đều xuất hiện liền kề trong một dãy nào đó (và mọi cạnh tôn trọng thứ tự của org). Cách này cũng O(n + L).

> Senior tip: Câu hỏi "có duy nhất một cách sắp xếp không?" xuất hiện khi kiểm tra cấu hình pipeline có xác định (deterministic) hay không. Thứ tự không duy nhất nghĩa là kết quả có thể khác nhau giữa các lần chạy, nguồn gốc của những bug khó tái hiện.`,
  complexity: 'Time O(n + L), Space O(n + L) với L = tổng độ dài seqs',
  starter: 'class Solution {\n    public boolean sequenceReconstruction(int[] org, int[][] seqs) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("unique chain", true, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 2}, {2, 3}}));
        run("not unique", false, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 2}, {1, 3}}));
        run("unique with extra edge", true, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 2}, {1, 3}, {2, 3}}));
        run("example 3", true, () -> new Solution().sequenceReconstruction(new int[]{4, 1, 5, 2, 6, 3}, new int[][]{{5, 2, 6, 3}, {4, 1, 5, 2}}));
        run("different order", false, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 3}, {3, 2}}));
        run("cycle", false, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 2}, {2, 3}, {3, 1}}));
        run("missing number", false, () -> new Solution().sequenceReconstruction(new int[]{1, 2, 3}, new int[][]{{1, 2}}));
        run("out of range", false, () -> new Solution().sequenceReconstruction(new int[]{1}, new int[][]{{1}, {2}}));
        run("single", true, () -> new Solution().sequenceReconstruction(new int[]{1}, new int[][]{{1}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Giải bằng cách kiểm tra các cặp liền kề của org (không dùng Kahn) như thế nào?', 'Nếu seqs chứa số ngoài org mà vẫn muốn bỏ qua thay vì trả false thì sửa gì?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-113',
  title: 'Implement Trie (Prefix Tree)',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'design', 'string', 'bytebytego'],
  prompt: `Cài đặt lớp {{Trie}} (cây tiền tố) với các thao tác:
- {{Trie()}}: khởi tạo cây rỗng.
- {{void insert(String word)}}: thêm từ {{word}}.
- {{boolean search(String word)}}: {{true}} nếu **đúng từ** {{word}} đã từng được thêm.
- {{boolean startsWith(String prefix)}}: {{true}} nếu có ít nhất một từ đã thêm bắt đầu bằng {{prefix}}.

### Ví dụ
~~~text
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // true
trie.search("app");     // false  ("app" chỉ là tiền tố, chưa được thêm như một từ)
trie.startsWith("app"); // true
trie.insert("app");
trie.search("app");     // true
~~~

### Ràng buộc
- {{1 <= word.length, prefix.length <= 2000}}
- Chỉ gồm chữ cái thường {{a-z}}.
- Tổng số lời gọi tối đa {{3 * 10^4}}.`,
  hints: [
    'Mỗi node đại diện cho một tiền tố. Node có tối đa 26 con, con thứ {{c - \'a\'}} ứng với việc nối thêm chữ {{c}}.',
    'Cần thêm cờ {{isEnd}} ở node: tiền tố này có phải là **một từ hoàn chỉnh** đã được thêm hay không. Đó là chỗ khác nhau giữa {{search}} và {{startsWith}}.',
    'Viết một hàm phụ {{find(s)}} đi từ gốc theo từng ký tự, trả về node cuối (hoặc {{null}} nếu đứt giữa chừng). {{search}} = node khác null và {{isEnd}}; {{startsWith}} = node khác null.'
  ],
  solution: `### Ý tưởng
Trie lưu các từ theo dạng cây, các từ có chung tiền tố thì **dùng chung** các node đầu. Ví dụ "app" và "apple" cùng đi qua a → p → p:
~~~text
(root)
  └─ a
     └─ p
        └─ p  [isEnd: "app"]
           └─ l
              └─ e  [isEnd: "apple"]
~~~
- **insert:** đi từ gốc theo từng ký tự, thiếu node thì tạo mới; tới ký tự cuối thì bật {{isEnd}}.
- **search:** đi theo từng ký tự; đứt giữa chừng → false; đi hết thì cần {{isEnd == true}}.
- **startsWith:** giống search nhưng không cần {{isEnd}}.

~~~java
class Trie {
    private static class Node {
        Node[] children = new Node[26]; // children[c - 'a'] = node sau khi noi them chu c
        boolean isEnd;                  // tien to nay la mot tu da insert
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (int i = 0; i < word.length(); i++) {
            int k = word.charAt(i) - 'a';
            if (cur.children[k] == null) cur.children[k] = new Node(); // tao node con neu chua co
            cur = cur.children[k];
        }
        cur.isEnd = true;                   // danh dau ket thuc mot tu
    }

    public boolean search(String word) {
        Node node = find(word);
        return node != null && node.isEnd;  // phai la tu hoan chinh
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;        // chi can duong di ton tai
    }

    // di theo s tu goc; tra ve node cuoi hoac null neu duong di bi dut
    private Node find(String s) {
        Node cur = root;
        for (int i = 0; i < s.length() && cur != null; i++) {
            cur = cur.children[s.charAt(i) - 'a'];
        }
        return cur;
    }
}
~~~

### Độ phức tạp
- Mỗi thao tác O(L) với L = độ dài từ/tiền tố, **không phụ thuộc** số từ đã lưu.
- Bộ nhớ: tối đa một node cho mỗi ký tự được insert (O(tổng độ dài)), mỗi node chứa mảng 26 tham chiếu.

### So sánh với HashSet
| | Trie | HashSet<String> |
|---|---|---|
| search đúng từ | O(L) | O(L) (tính hash) |
| startsWith | O(L) | phải duyệt mọi từ, O(N·L) |
| Bộ nhớ | tốn khi ít tiền tố chung | gọn hơn |

### Lưu ý khi phỏng vấn
- Bảng chữ cái lớn (Unicode) thì thay mảng 26 bằng {{HashMap<Character, Node>}}.
- Xoá từ: tắt {{isEnd}}, rồi (tuỳ chọn) xoá ngược các node không còn con và không phải cuối của từ khác.
- Hay quên trường hợp "tiền tố của từ đã có" ({{search("app")}} sau khi chỉ insert "apple") → phải là false.

> Senior tip: Trie (và biến thể nén như radix tree) dùng trong autocomplete, định tuyến IP theo longest-prefix match, và router của nhiều web framework để khớp URL path nhanh.`,
  complexity: 'Time O(L) mỗi thao tác, Space O(tổng số ký tự đã insert)',
  starter: 'class Trie {\n    public Trie() {\n        // TODO\n    }\n\n    public void insert(String word) {\n        // TODO\n    }\n\n    public boolean search(String word) {\n        // TODO\n        return false;\n    }\n\n    public boolean startsWith(String prefix) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // tu "aaaa".."zzzz" duy nhat cho moi i (viet i theo co so 26, dung 4 chu)
    static String word(int i) { char[] w = new char[4]; for (int k = 3; k >= 0; k--) { w[k] = (char) ('a' + i % 26); i /= 26; } return new String(w); }
    public static void main(String[] args) {
        run("example sequence", Arrays.asList(true, false, true, true), () -> {
            Trie t = new Trie();
            t.insert("apple");
            boolean a = t.search("apple"), b = t.search("app"), c = t.startsWith("app");
            t.insert("app");
            return Arrays.asList(a, b, c, t.search("app"));
        });
        run("empty trie", Arrays.asList(false, false), () -> { Trie t = new Trie(); return Arrays.asList(t.search("a"), t.startsWith("a")); });
        run("longer word not found", false, () -> { Trie t = new Trie(); t.insert("app"); return t.search("apple"); });
        run("prefix longer than word", false, () -> { Trie t = new Trie(); t.insert("ab"); return t.startsWith("abc"); });
        run("whole word is prefix", true, () -> { Trie t = new Trie(); t.insert("abc"); return t.startsWith("abc"); });
        run("branching words", Arrays.asList(true, true, false, true, false), () -> {
            Trie t = new Trie();
            t.insert("car"); t.insert("cat"); t.insert("dog");
            return Arrays.asList(t.search("car"), t.search("cat"), t.search("ca"), t.startsWith("do"), t.startsWith("cb"));
        });
        run("insert twice", true, () -> { Trie t = new Trie(); t.insert("x"); t.insert("x"); return t.search("x"); });
        run("many words", 5000, () -> {
            Trie t = new Trie();
            for (int i = 0; i < 5000; i++) t.insert(word(i));
            int found = 0;
            for (int i = 0; i < 5000; i++) if (t.search(word(i))) found++;
            for (int i = 5000; i < 6000; i++) if (t.search(word(i))) found += 100000; // tu chua insert
            return found;
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Cài đặt thêm {{delete(word)}} sao cho không làm hỏng các từ khác có chung tiền tố thế nào?', 'Muốn trả về top 3 từ phổ biến nhất bắt đầu bằng một tiền tố (autocomplete) thì lưu thêm gì ở node?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-114',
  title: 'Word Search II',
  difficulty: 'hard',
  pattern: 'Tries',
  tags: ['backtracking', 'trie', 'matrix', 'bytebytego'],
  prompt: `Cho bảng chữ cái {{board}} kích thước {{m x n}} và danh sách từ {{words}}. Một từ "có trong bảng" nếu ghép được từ các ô **kề cạnh** liên tiếp (trên/dưới/trái/phải), mỗi ô dùng **không quá một lần** trong cùng một từ. Trả về mọi từ trong {{words}} có trong bảng, mỗi từ **một lần**, thứ tự tuỳ ý.

### Ví dụ
~~~text
Input:  board = [["o","a","a","n"],
                 ["e","t","a","e"],
                 ["i","h","k","r"],
                 ["i","f","l","v"]]
        words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]

Input:  board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []   (muốn quay lại ô "b" thì phải dùng ô đó hai lần)
~~~

### Ràng buộc
- {{1 <= m, n <= 12}}
- {{1 <= words.length <= 3 * 10^4}}, {{1 <= words[i].length <= 10}}
- Chỉ gồm chữ cái thường; {{words}} có thể chứa từ trùng nhau.`,
  hints: [
    'Chạy Word Search (DFS) riêng cho từng từ tốn O(số từ × m × n × 4^L): quá chậm với 3·10^4 từ. Cần tìm **mọi từ trong một lần DFS**.',
    'Đưa mọi từ vào một Trie. Khi DFS trên bảng, đi song song trên Trie: chữ ở ô kế tiếp không có trong node con của Trie thì cắt nhánh ngay, vì không từ nào bắt đầu bằng tiền tố đó.',
    'Lưu cả từ ở node cuối của nó. Tìm thấy thì thêm vào kết quả và đặt về {{null}} để không thêm trùng. Có thể xoá luôn node lá đã "hết việc" để các lần DFS sau càng nhanh.'
  ],
  solution: `### Ý tưởng
Kết hợp **Trie** và **backtracking**:
1. Dựng Trie từ {{words}}; node kết thúc từ lưu luôn chuỗi từ đó ({{node.word}}).
2. Từ mỗi ô của bảng, DFS: chỉ đi sang ô có chữ khớp với một node con của node Trie hiện tại. Nhờ vậy ta khám phá **mọi từ cùng lúc**, và nhánh nào không phải tiền tố của từ nào thì dừng ngay.
3. Gặp node có {{word != null}} → thêm vào kết quả rồi đặt {{word = null}} (chống trùng).
4. Đánh dấu ô đang dùng bằng {{'#'}}, đệ quy 4 hướng, rồi trả lại chữ cũ (backtrack).
5. Tối ưu: sau khi DFS qua một node con mà node đó không còn con và không còn từ → xoá khỏi Trie.

~~~java
class Solution {
    private static class TrieNode {
        TrieNode[] next = new TrieNode[26];
        String word;                        // khac null neu mot tu ket thuc tai day
    }

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {            // dung Trie tu danh sach tu
            TrieNode cur = root;
            for (char ch : w.toCharArray()) {
                int k = ch - 'a';
                if (cur.next[k] == null) cur.next[k] = new TrieNode();
                cur = cur.next[k];
            }
            cur.word = w;
        }
        List<String> found = new ArrayList<>();
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                dfs(board, r, c, root, found);
        return found;
    }

    private void dfs(char[][] b, int r, int c, TrieNode parent, List<String> found) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
        char ch = b[r][c];
        if (ch == '#') return;                       // o dang nam tren duong di hien tai
        TrieNode node = parent.next[ch - 'a'];
        if (node == null) return;                    // khong tu nao co tien to nay: cat nhanh
        if (node.word != null) {                     // tim thay mot tu
            found.add(node.word);
            node.word = null;                        // tranh them trung
        }
        b[r][c] = '#';                               // danh dau da dung
        dfs(b, r + 1, c, node, found);
        dfs(b, r - 1, c, node, found);
        dfs(b, r, c + 1, node, found);
        dfs(b, r, c - 1, node, found);
        b[r][c] = ch;                                // backtrack: tra lai chu cu
        if (node.word == null && isLeaf(node)) parent.next[ch - 'a'] = null; // nhanh da het viec
    }

    private boolean isLeaf(TrieNode node) {
        for (TrieNode t : node.next) if (t != null) return false;
        return true;
    }
}
~~~

### Độ phức tạp
- Dựng Trie: O(tổng độ dài các từ).
- DFS: mỗi ô là điểm bắt đầu, mỗi bước có tối đa 3 hướng mới (không quay lại ô vừa đi) → cận trên O(m·n·4·3^(L-1)) với L ≤ 10 là độ dài từ dài nhất. Nhờ Trie cắt nhánh, thực tế nhanh hơn rất nhiều.
- Bộ nhớ: O(tổng độ dài các từ) cho Trie, O(L) cho đệ quy.

### Lưu ý khi phỏng vấn
- Lưu {{word}} ở node thay vì truyền {{StringBuilder}} theo đường đi giúp code gọn và khỏi tạo chuỗi trung gian.
- Đặt {{word = null}} sau khi tìm thấy là cách chống trùng rẻ nhất (không cần {{Set}}).
- Bước xoá node lá là tối ưu quan trọng khi nhiều từ chung tiền tố; không có nó lời giải vẫn đúng nhưng chậm hơn trên bảng lớn.

> Senior tip: Mẫu "gộp nhiều truy vấn vào một cấu trúc rồi duyệt một lần" (ở đây gộp 3·10^4 từ vào Trie) giống multi-pattern matching (Aho-Corasick) dùng trong lọc từ khoá, WAF, hay quét log tìm nhiều mẫu lỗi cùng lúc.`,
  complexity: 'Time O(m * n * 4 * 3^(L-1)) cận trên, Space O(tổng độ dài từ)',
  starter: 'class Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<String> sorted(List<String> l) { List<String> r = new ArrayList<>(l); Collections.sort(r); return r; }
    static char[][] example() { return new char[][]{{'o', 'a', 'a', 'n'}, {'e', 't', 'a', 'e'}, {'i', 'h', 'k', 'r'}, {'i', 'f', 'l', 'v'}}; }
    public static void main(String[] args) {
        run("example", Arrays.asList("eat", "oath"), () -> sorted(new Solution().findWords(example(), new String[]{"oath", "pea", "eat", "rain"})));
        run("cell reuse not allowed", Collections.emptyList(), () -> sorted(new Solution().findWords(new char[][]{{'a', 'b'}, {'c', 'd'}}, new String[]{"abcb"})));
        run("short found long not", Arrays.asList("ab"), () -> sorted(new Solution().findWords(new char[][]{{'a', 'b'}, {'c', 'd'}}, new String[]{"ab", "abcd"})));
        run("duplicate words reported once", Arrays.asList("a"), () -> sorted(new Solution().findWords(new char[][]{{'a'}}, new String[]{"a", "a"})));
        run("word is prefix of another", Arrays.asList("oa", "oaa"), () -> sorted(new Solution().findWords(example(), new String[]{"oa", "oaa"})));
        run("nothing found", Collections.emptyList(), () -> sorted(new Solution().findWords(new char[][]{{'x'}}, new String[]{"y"})));
        run("snake path", Arrays.asList("abcfed"), () -> sorted(new Solution().findWords(new char[][]{{'a', 'b', 'c'}, {'d', 'e', 'f'}}, new String[]{"abcfed", "abcd"})));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Vì sao cần đặt {{word = null}} sau khi tìm thấy, và có cách nào khác?', 'Nếu bảng rất lớn nhưng danh sách từ nhỏ thì nên dựng Trie từ từ hay từ bảng?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-115',
  title: 'Replace Words',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'string', 'bytebytego'],
  prompt: `Cho danh sách **gốc từ** {{dictionary}} và một câu {{sentence}} gồm các từ cách nhau bởi **đúng một** dấu cách. Thay mỗi từ trong câu bằng **gốc từ ngắn nhất** là tiền tố của nó; từ không có gốc nào phù hợp thì giữ nguyên. Trả về câu sau khi thay.

### Ví dụ
~~~text
Input:  dictionary = ["cat","bat","rat"]
        sentence   = "the cattle was rattled by the battery"
Output: "the cat was rat by the bat"

Input:  dictionary = ["a","b","c"]
        sentence   = "aadsfasf absbs bbab cadsfafs"
Output: "a a b c"
~~~

### Ràng buộc
- {{1 <= dictionary.length <= 1000}}, {{1 <= dictionary[i].length <= 100}}
- {{1 <= sentence.length <= 10^6}}
- Chỉ gồm chữ cái thường và dấu cách; không có dấu cách thừa ở đầu, cuối hay giữa.`,
  hints: [
    'Cách thô: với mỗi từ, thử mọi gốc xem có phải tiền tố không: O(số từ × số gốc × độ dài). Có thể làm tốt hơn.',
    'Đưa các gốc vào Trie (đánh dấu node cuối mỗi gốc). Với mỗi từ trong câu, đi dọc Trie theo từng ký tự.',
    'Node đầu tiên có cờ kết thúc mà bạn gặp chính là **gốc ngắn nhất**: dừng ngay. Nếu đường đi bị đứt hoặc hết từ mà chưa gặp, giữ nguyên từ.'
  ],
  solution: `### Ý tưởng
1. Dựng Trie từ các gốc, node cuối của mỗi gốc có {{isRoot = true}}.
2. Tách câu thành các từ. Với mỗi từ, đi từ gốc Trie theo từng ký tự:
   - Không có node con cho ký tự này → từ không có gốc nào → giữ nguyên.
   - Tới node có {{isRoot}} → tiền tố đã đi chính là gốc **ngắn nhất** (vì ta đi từ ngắn tới dài) → dùng nó.
3. Nối kết quả bằng {{StringBuilder}} (không cộng chuỗi trong vòng lặp).

~~~java
class Solution {
    private static class Node {
        Node[] next = new Node[26];
        boolean isRoot;                         // mot goc tu ket thuc tai day
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        Node trie = new Node();
        for (String root : dictionary) {        // dung Trie tu cac goc
            Node cur = trie;
            for (char ch : root.toCharArray()) {
                int k = ch - 'a';
                if (cur.next[k] == null) cur.next[k] = new Node();
                cur = cur.next[k];
            }
            cur.isRoot = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            out.append(shortestRoot(trie, word));
        }
        return out.toString();
    }

    // goc ngan nhat la tien to cua word, hoac chinh word neu khong co
    private String shortestRoot(Node trie, String word) {
        Node cur = trie;
        for (int i = 0; i < word.length(); i++) {
            cur = cur.next[word.charAt(i) - 'a'];
            if (cur == null) return word;          // duong di dut: khong co goc
            if (cur.isRoot) return word.substring(0, i + 1); // gap goc dau tien = ngan nhat
        }
        return word;                               // het tu ma chua gap goc
    }
}
~~~

### Chạy tay với "rattled"
Trie có c-a-t, b-a-t, r-a-t. Đi r → a → t: node "rat" có {{isRoot}} → trả "rat", không cần xem phần "tled".

### Độ phức tạp
- Dựng Trie: O(tổng độ dài các gốc).
- Mỗi từ dừng sau tối đa {{min(độ dài từ, độ dài gốc dài nhất)}} bước → tổng O(độ dài câu).
- Bộ nhớ: O(tổng độ dài các gốc) cho Trie, O(độ dài câu) cho kết quả.

### Lưu ý khi phỏng vấn
- Có gốc "a" và "aa" thì luôn dùng "a" (ngắn nhất), nhờ dừng ở {{isRoot}} đầu tiên.
- Cách khác: cho các gốc vào {{HashSet}}, với mỗi từ thử các tiền tố độ dài 1, 2, 3...; đơn giản nhưng mỗi lần {{substring}} tạo chuỗi mới, chậm hơn Trie khi từ dài.

> Senior tip: Bài này là "longest/shortest prefix match": cùng mô hình với bảng định tuyến IP hay chọn rule cấu hình theo đường dẫn URL. Trie biến nó thành phép đi O(độ dài khoá), không phụ thuộc số rule.`,
  complexity: 'Time O(D + S) với D = tổng độ dài gốc, S = độ dài câu; Space O(D + S)',
  starter: 'class Solution {\n    public String replaceWords(List<String> dictionary, String sentence) {\n        // TODO\n        return sentence;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected [" + expected + "] got [" + actual + "]");
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", "the cat was rat by the bat", () -> new Solution().replaceWords(Arrays.asList("cat", "bat", "rat"), "the cattle was rattled by the battery"));
        run("single letters", "a a b c", () -> new Solution().replaceWords(Arrays.asList("a", "b", "c"), "aadsfasf absbs bbab cadsfafs"));
        run("shortest root wins", "a a a a", () -> new Solution().replaceWords(Arrays.asList("aaa", "aa", "a"), "a aa aaa aaaa"));
        run("no match", "abc def", () -> new Solution().replaceWords(Arrays.asList("xyz"), "abc def"));
        run("root longer than word", "ca", () -> new Solution().replaceWords(Arrays.asList("cat"), "ca"));
        run("word equals root", "cat", () -> new Solution().replaceWords(Arrays.asList("cat"), "cat"));
        run("single word sentence", "rat", () -> new Solution().replaceWords(Arrays.asList("rat"), "rattle"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu thay vì gốc ngắn nhất cần gốc **dài nhất** thì sửa chỗ nào?', 'So sánh lời giải Trie với lời giải HashSet thử từng tiền tố về thời gian và bộ nhớ?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-116',
  title: 'Search Suggestions System',
  difficulty: 'medium',
  pattern: 'Tries',
  tags: ['trie', 'binary-search', 'string', 'bytebytego'],
  prompt: `Cho mảng tên sản phẩm {{products}} và từ khoá {{searchWord}}. Người dùng gõ {{searchWord}} từng ký tự một. Sau **mỗi** ký tự, hệ thống gợi ý tối đa **3** sản phẩm có tiền tố trùng với phần đã gõ; nếu nhiều hơn 3 thì lấy 3 sản phẩm nhỏ nhất theo thứ tự từ điển. Trả về danh sách gồm {{searchWord.length()}} danh sách gợi ý (danh sách có thể rỗng).

### Ví dụ
~~~text
Input:  products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"
Output: [["mobile","moneypot","monitor"],
         ["mobile","moneypot","monitor"],
         ["mouse","mousepad"],
         ["mouse","mousepad"],
         ["mouse","mousepad"]]
Giải thích: sau khi sắp xếp: mobile, moneypot, monitor, mouse, mousepad.
"m" và "mo" khớp cả 5 → lấy 3 đầu. "mou", "mous", "mouse" khớp mouse, mousepad.

Input:  products = ["havana"], searchWord = "tatiana"
Output: [[],[],[],[],[],[],[]]
~~~

### Ràng buộc
- {{1 <= products.length <= 1000}}, {{1 <= products[i].length <= 3000}}
- {{1 <= searchWord.length <= 1000}}
- Chỉ gồm chữ cái thường; các {{products[i]}} khác nhau.`,
  hints: [
    'Sau khi **sắp xếp** {{products}}, mọi sản phẩm có cùng một tiền tố nằm thành một **đoạn liên tiếp**. Ba gợi ý chính là ba phần tử đầu của đoạn đó.',
    'Tìm vị trí đầu đoạn bằng binary search: phần tử đầu tiên {{>= prefix}} (lower bound). Tiền tố càng dài thì vị trí này chỉ có thể dịch sang phải, nên có thể tìm tiếp từ vị trí cũ.',
    'Từ vị trí đó lấy tối đa 3 phần tử, dừng ngay khi gặp phần tử không bắt đầu bằng {{prefix}}. Cách khác: Trie mà mỗi node lưu sẵn 3 từ nhỏ nhất đi qua nó.'
  ],
  solution: `### Ý tưởng
Sắp xếp {{products}}. Các chuỗi có cùng tiền tố P nằm liền nhau và chuỗi nhỏ nhất trong số đó là chuỗi đầu tiên {{>= P}} (vì mọi chuỗi bắt đầu bằng P đều {{>= P}}, và chuỗi nào {{>= P}} mà nhỏ hơn chuỗi đầu đoạn thì đã nằm trước đoạn).

Với mỗi tiền tố {{searchWord[0..i]}}:
1. Binary search tìm {{start}} = chỉ số đầu tiên có {{products[start] >= prefix}}.
2. Lấy {{products[start]}}, {{products[start+1]}}, {{products[start+2]}} nếu chúng bắt đầu bằng {{prefix}}.

~~~java
class Solution {
    public List<List<String>> suggestedProducts(String[] products, String searchWord) {
        String[] sorted = products.clone();        // khong sua mang cua nguoi goi
        Arrays.sort(sorted);
        List<List<String>> result = new ArrayList<>();
        StringBuilder prefix = new StringBuilder();
        int start = 0;
        for (char ch : searchWord.toCharArray()) {
            prefix.append(ch);
            String p = prefix.toString();
            start = lowerBound(sorted, p, start);  // prefix dai hon -> vi tri chi tien len
            List<String> suggestions = new ArrayList<>();
            for (int i = start; i < sorted.length && suggestions.size() < 3; i++) {
                if (!sorted[i].startsWith(p)) break; // het doan cung tien to
                suggestions.add(sorted[i]);
            }
            result.add(suggestions);
        }
        return result;
    }

    // chi so dau tien trong [from, n) co a[i] >= key
    private int lowerBound(String[] a, String key, int from) {
        int lo = from, hi = a.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid].compareTo(key) < 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
~~~

### Chạy tay với ví dụ 1
Sau sắp xếp: [mobile, moneypot, monitor, mouse, mousepad].
- "m": lower bound = 0 → mobile, moneypot, monitor.
- "mo": vẫn 0 → như trên.
- "mou": "monitor" < "mou" < "mouse" → start = 3 → mouse, mousepad.

### Độ phức tạp
- Sắp xếp: O(n log n) phép so sánh, mỗi phép tốn tối đa O(độ dài chuỗi).
- Mỗi ký tự gõ: binary search O(log n) phép so sánh + lấy 3 phần tử → tổng O(L · log n) phép so sánh, L = độ dài searchWord.
- Bộ nhớ: O(n) cho mảng đã sắp xếp (không tính kết quả).

### Lưu ý khi phỏng vấn
- So với Trie: binary search đơn giản, ít bộ nhớ; Trie lưu sẵn top 3 ở mỗi node thì mỗi lần gõ chỉ O(1), hợp với hệ thống phục vụ hàng triệu truy vấn trên một tập sản phẩm ít thay đổi.
- Nhớ trường hợp tiền tố không khớp gì: vẫn phải thêm danh sách rỗng cho bước đó.

> Senior tip: Autocomplete thật thường không xếp theo từ điển mà theo độ phổ biến; khi đó mỗi node Trie lưu top-k theo điểm số, và cập nhật chạy offline định kỳ thay vì mỗi lần người dùng gõ.`,
  complexity: 'Time O(n log n + L log n) phép so sánh chuỗi, Space O(n)',
  starter: 'class Solution {\n    public List<List<String>> suggestedProducts(String[] products, String searchWord) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static List<List<String>> L(String[]... rows) { List<List<String>> r = new ArrayList<>(); for (String[] row : rows) r.add(Arrays.asList(row)); return r; }
    public static void main(String[] args) {
        run("example", L(new String[]{"mobile", "moneypot", "monitor"}, new String[]{"mobile", "moneypot", "monitor"}, new String[]{"mouse", "mousepad"}, new String[]{"mouse", "mousepad"}, new String[]{"mouse", "mousepad"}),
            () -> new Solution().suggestedProducts(new String[]{"mobile", "mouse", "moneypot", "monitor", "mousepad"}, "mouse"));
        run("full match single product", L(new String[]{"havana"}, new String[]{"havana"}, new String[]{"havana"}, new String[]{"havana"}, new String[]{"havana"}, new String[]{"havana"}),
            () -> new Solution().suggestedProducts(new String[]{"havana"}, "havana"));
        run("no match after first char", L(new String[]{}, new String[]{}, new String[]{}),
            () -> new Solution().suggestedProducts(new String[]{"havana"}, "tat"));
        run("diverges midway", L(new String[]{"baggage", "bags", "banner"}, new String[]{"baggage", "bags", "banner"}, new String[]{"baggage", "bags"}, new String[]{"bags"}),
            () -> new Solution().suggestedProducts(new String[]{"bags", "baggage", "banner", "box", "cloths"}, "bags"));
        run("prefix is product", L(new String[]{"a", "ab", "abc"}, new String[]{"ab", "abc"}),
            () -> new Solution().suggestedProducts(new String[]{"abc", "ab", "a"}, "ab"));
        run("input not modified", "[mouse, mobile]", () -> { String[] p = {"mouse", "mobile"}; new Solution().suggestedProducts(p, "m"); return Arrays.toString(p); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu sản phẩm được thêm/xoá liên tục thì chọn Trie hay mảng sắp xếp? Vì sao?', 'Làm sao xếp gợi ý theo độ phổ biến thay vì thứ tự từ điển?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-117',
  title: 'Graph Valid Tree',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'bytebytego'],
  prompt: `Cho {{n}} node đánh số {{0..n-1}} và danh sách cạnh **vô hướng** {{edges}}. Kiểm tra các cạnh này có tạo thành **một cây** hay không: tức đồ thị **liên thông** (đi được giữa mọi cặp node) và **không có chu trình**.

### Ví dụ
~~~text
Input:  n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true

Input:  n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false   (chu trình 1-2-3-1)

Input:  n = 4, edges = [[0,1],[2,3]]
Output: false   (hai mảnh rời nhau)
~~~

### Ràng buộc
- {{1 <= n <= 2000}}
- {{0 <= edges.length <= 5000}}
- Không có cạnh tự nối và không có cạnh lặp.`,
  hints: [
    'Một cây có n node thì có **đúng n - 1 cạnh**. Số cạnh khác n - 1 → chắc chắn không phải cây.',
    'Nếu đã có đúng n - 1 cạnh thì "không có chu trình" tương đương "liên thông". Vậy chỉ cần kiểm tra một trong hai.',
    'Union-Find: duyệt từng cạnh {{(u, v)}}. Nếu {{find(u) == find(v)}} thì u và v vốn đã nối với nhau, thêm cạnh này tạo chu trình → false.'
  ],
  solution: `### Ý tưởng
Tính chất của cây n node: liên thông, không chu trình, và có đúng n - 1 cạnh. Hai trong ba điều này kéo theo điều thứ ba. Vì vậy:
1. Nếu {{edges.length != n - 1}} → false.
2. Kiểm tra không có chu trình bằng **Union-Find** (Disjoint Set Union): mỗi node ban đầu là một nhóm riêng. Với mỗi cạnh, nếu hai đầu đã cùng nhóm thì cạnh đó khép một vòng → false; ngược lại gộp hai nhóm.
3. Qua được hết → n - 1 cạnh, không chu trình → liên thông → là cây.

**Union-Find hoạt động thế nào?** Mỗi nhóm là một cây nhỏ, {{parent[x]}} trỏ lên cha; gốc là đại diện nhóm. {{find(x)}} đi lên tới gốc. Hai kỹ thuật giữ cây thấp: **path compression** (cho node trỏ thẳng/gần tới gốc khi đi qua) và **union by rank** (gắn cây thấp vào dưới cây cao).

~~~java
class Solution {
    private int[] parent, rank;

    public boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;   // cay phai co dung n-1 canh
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i; // moi node la mot nhom rieng
        for (int[] e : edges) {
            if (!union(e[0], e[1])) return false;  // hai dau da cung nhom -> chu trinh
        }
        return true;                               // n-1 canh + khong chu trinh = lien thong
    }

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];         // path compression (halving)
            x = parent[x];
        }
        return x;
    }

    // gop hai nhom; tra ve false neu da cung nhom
    private boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; } // ra la cay cao hon
        parent[rb] = ra;                           // gan cay thap vao duoi cay cao
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}
~~~

### Chạy tay với ví dụ 2
5 node, 5 cạnh ≠ 4 → false ngay ở bước 1. Nếu bỏ bước 1: union(0,1), union(1,2), union(2,3), rồi cạnh (1,3): find(1) == find(3) → chu trình → false.

### Độ phức tạp
O(n + E·α(n)) thời gian, với α là hàm Ackermann ngược (≤ 4 trong thực tế, coi như hằng số). Bộ nhớ O(n).

### Lưu ý khi phỏng vấn
- Đừng quên trường hợp {{n = 1, edges = []}}: một node đơn lẻ là cây hợp lệ.
- Cách khác: BFS/DFS từ node 0, đếm số node thăm được; cây ⇔ đúng n - 1 cạnh và thăm đủ n node.
- Giải thích được vì sao chỉ cần kiểm tra hai trong ba điều kiện là điểm cộng.

> Senior tip: Union-Find là công cụ chuẩn cho bài toán "kết nối động": thuật toán Kruskal tìm cây khung nhỏ nhất, gom nhóm tài khoản trùng, hay phát hiện vòng khi thêm dần cạnh vào mạng lưới.`,
  complexity: 'Time O(n + E * α(n)), Space O(n)',
  starter: 'class Solution {\n    public boolean validTree(int n, int[][] edges) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("tree", true, () -> new Solution().validTree(5, new int[][]{{0, 1}, {0, 2}, {0, 3}, {1, 4}}));
        run("cycle", false, () -> new Solution().validTree(5, new int[][]{{0, 1}, {1, 2}, {2, 3}, {1, 3}, {1, 4}}));
        run("single node", true, () -> new Solution().validTree(1, new int[0][]));
        run("two nodes no edge", false, () -> new Solution().validTree(2, new int[0][]));
        run("disconnected", false, () -> new Solution().validTree(4, new int[][]{{0, 1}, {2, 3}}));
        run("n-1 edges but cycle + isolated", false, () -> new Solution().validTree(4, new int[][]{{0, 1}, {1, 2}, {2, 0}}));
        run("long path 2000", true, () -> {
            int n = 2000; int[][] e = new int[n - 1][];
            for (int i = 0; i + 1 < n; i++) e[i] = new int[]{i + 1, i};
            return new Solution().validTree(n, e);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Giải bằng BFS/DFS thay vì Union-Find thì kiểm tra những gì?', 'Path compression và union by rank giúp gì, nếu bỏ cả hai thì độ phức tạp xấu nhất là bao nhiêu?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-118',
  title: 'Accounts Merge',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'string', 'bytebytego'],
  prompt: `Cho danh sách {{accounts}}, mỗi phần tử có dạng {{[name, email1, email2, ...]}}. Hai account có **chung ít nhất một email** thì chắc chắn thuộc cùng một người (khi đó tên cũng giống nhau). Lưu ý quan hệ này **bắc cầu**: A chung email với B, B chung email với C thì A, B, C là một người. Hai account trùng tên nhưng không liên quan email thì có thể là hai người khác nhau. Gộp các account của cùng một người, mỗi account kết quả có dạng {{[name, các email **đã sắp xếp tăng dần** và không trùng]}}. Thứ tự các account trong kết quả tuỳ ý.

### Ví dụ
~~~text
Input:  accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],
                    ["John","johnsmith@mail.com","john00@mail.com"],
                    ["Mary","mary@mail.com"],
                    ["John","johnnybravo@mail.com"]]
Output: [["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],
         ["Mary","mary@mail.com"],
         ["John","johnnybravo@mail.com"]]
Giải thích: hai account John đầu chung johnsmith@mail.com nên gộp. John cuối là người khác.
~~~

### Ràng buộc
- {{1 <= accounts.length <= 1000}}, {{2 <= accounts[i].length <= 10}}
- Mọi email hợp lệ, độ dài tối đa 30.`,
  hints: [
    'Coi mỗi **email** là một đỉnh. Trong cùng một account, mọi email thuộc cùng một người → nối chúng với nhau (chỉ cần nối email đầu với từng email còn lại).',
    'Union-Find trên chuỗi email ({{Map<String, String> parent}}) gom các email thành nhóm. Mỗi nhóm cuối cùng là một người.',
    'Nhớ tên theo email ({{Map<String, String> emailToName}}). Gom email theo gốc của nhóm, dùng {{TreeSet}} để vừa sắp xếp vừa bỏ trùng, rồi thêm tên vào đầu.'
  ],
  solution: `### Ý tưởng
"Chung email thì cùng người" và quan hệ bắc cầu chính là **các thành phần liên thông** trong đồ thị mà đỉnh là email. Union-Find tìm thành phần liên thông rất gọn:
1. Với mỗi account: mỗi email là một phần tử của Union-Find; nối email đầu tiên với các email còn lại. Ghi {{emailToName}}.
2. Sau khi xử lý hết, hai email cùng gốc ({{find}}) ⇔ cùng một người.
3. Gom email theo gốc vào {{TreeSet}} (tự sắp xếp, bỏ trùng). Mỗi nhóm thành một account: tên + danh sách email.

~~~java
class Solution {
    private final Map<String, String> parent = new HashMap<>();

    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        Map<String, String> emailToName = new HashMap<>();
        for (List<String> acc : accounts) {
            String name = acc.get(0), first = acc.get(1);
            for (int i = 1; i < acc.size(); i++) {
                String email = acc.get(i);
                parent.putIfAbsent(email, email);   // email moi: tu lam goc
                emailToName.put(email, name);
                union(first, email);                // cung account -> cung nguoi
            }
        }
        Map<String, TreeSet<String>> groups = new HashMap<>(); // goc -> cac email (sap xep)
        for (String email : parent.keySet()) {
            groups.computeIfAbsent(find(email), k -> new TreeSet<>()).add(email);
        }
        List<List<String>> result = new ArrayList<>();
        for (TreeSet<String> emails : groups.values()) {
            List<String> acc = new ArrayList<>();
            acc.add(emailToName.get(emails.first()));  // ten cua nguoi nay
            acc.addAll(emails);
            result.add(acc);
        }
        return result;
    }

    private String find(String x) {
        while (!parent.get(x).equals(x)) {
            parent.put(x, parent.get(parent.get(x))); // path compression
            x = parent.get(x);
        }
        return x;
    }

    private void union(String a, String b) {
        String ra = find(a), rb = find(b);
        if (!ra.equals(rb)) parent.put(rb, ra);
    }
}
~~~

### Chạy tay với ví dụ
- Account 1: union(johnsmith, john_newyork). Account 2: union(johnsmith, john00) → cả ba cùng gốc.
- Mary và johnnybravo đứng riêng.
- Gom nhóm → 3 account, email trong mỗi nhóm đã sắp xếp nhờ {{TreeSet}}.

### Độ phức tạp
Gọi E = tổng số email. Union-Find O(E·α(E)) (coi như O(E)); sắp xếp trong {{TreeSet}} O(E log E). Bộ nhớ O(E).

### Lưu ý khi phỏng vấn
- Không được gộp theo **tên**: hai "John" khác email là hai người.
- Một email có thể lặp lại ở nhiều account, {{TreeSet}} lo phần bỏ trùng.
- Cách khác: dựng đồ thị email rồi DFS/BFS tìm thành phần liên thông, cùng độ phức tạp.

> Senior tip: Đây là bài "entity resolution" thu nhỏ, gặp thật khi gộp hồ sơ khách hàng từ nhiều hệ thống (CRM, đơn hàng, ticket hỗ trợ) bằng khoá chung như email/số điện thoại. Cần cẩn thận với email dùng chung (ví dụ email công ty) vì nó có thể "nối" nhầm hàng nghìn người.`,
  complexity: 'Time O(E log E), Space O(E) với E = tổng số email',
  starter: 'class Solution {\n    public List<List<String>> accountsMerge(List<List<String>> accounts) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // thu tu cac account tuy y; email trong moi account PHAI da sap xep (khong sap lai)
    static List<String> norm(List<List<String>> accs) {
        List<String> r = new ArrayList<>();
        for (List<String> a : accs) r.add(a.toString());
        Collections.sort(r);
        return r;
    }
    static List<List<String>> A(String[]... rows) { List<List<String>> r = new ArrayList<>(); for (String[] row : rows) r.add(Arrays.asList(row)); return r; }
    public static void main(String[] args) {
        run("example", norm(A(new String[]{"John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"}, new String[]{"Mary", "mary@mail.com"}, new String[]{"John", "johnnybravo@mail.com"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"John", "johnsmith@mail.com", "john_newyork@mail.com"}, new String[]{"John", "johnsmith@mail.com", "john00@mail.com"}, new String[]{"Mary", "mary@mail.com"}, new String[]{"John", "johnnybravo@mail.com"}))));
        run("single account sorted", norm(A(new String[]{"Gabe", "a@m.co", "b@m.co"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"Gabe", "b@m.co", "a@m.co"}))));
        run("same name different people", norm(A(new String[]{"A", "a@m.co"}, new String[]{"A", "b@m.co"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"A", "a@m.co"}, new String[]{"A", "b@m.co"}))));
        run("transitive merge", norm(A(new String[]{"K", "x@m.co", "y@m.co", "z@m.co"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"K", "x@m.co"}, new String[]{"K", "z@m.co", "y@m.co"}, new String[]{"K", "x@m.co", "y@m.co"}))));
        run("duplicate email inside account", norm(A(new String[]{"D", "d@m.co"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"D", "d@m.co", "d@m.co"}))));
        run("chain via later account", norm(A(new String[]{"E", "e1@m.co", "e2@m.co", "e3@m.co", "e4@m.co"})),
            () -> norm(new Solution().accountsMerge(A(new String[]{"E", "e1@m.co", "e2@m.co"}, new String[]{"E", "e3@m.co", "e4@m.co"}, new String[]{"E", "e4@m.co", "e1@m.co"}))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Giải bằng DFS trên đồ thị email thay vì Union-Find thế nào?', 'Nếu một email bị dùng chung bởi rất nhiều người (email công ty) thì nên xử lý ra sao trong hệ thống thật?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-119',
  title: 'Redundant Connection',
  difficulty: 'medium',
  pattern: 'Union Find',
  tags: ['union-find', 'graph', 'bytebytego'],
  prompt: `Một cây gồm {{n}} node đánh số {{1..n}} bị thêm **đúng một cạnh**, thành đồ thị vô hướng {{edges}} có {{n}} cạnh (vì vậy có đúng một chu trình). Tìm một cạnh mà khi bỏ đi thì đồ thị lại thành cây. Nếu có nhiều cạnh như vậy, trả về cạnh **xuất hiện sau cùng** trong {{edges}}.

### Ví dụ
~~~text
Input:  edges = [[1,2],[1,3],[2,3]]
Output: [2,3]

Input:  edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]
Giải thích: chu trình 1-2-3-4-1; bỏ cạnh nào trong chu trình cũng được, [1,4] xuất hiện sau cùng.
~~~

### Ràng buộc
- {{3 <= n <= 1000}}, {{edges.length == n}}
- {{1 <= a < b <= n}} với mỗi cạnh {{[a, b]}}; không có cạnh lặp.
- Đồ thị liên thông.`,
  hints: [
    'Thêm lần lượt từng cạnh vào một đồ thị rỗng. Cạnh nào nối hai node **đã liên thông** với nhau thì khép một chu trình.',
    'Union-Find trả lời "đã liên thông chưa?" gần như O(1): so sánh {{find(a)}} và {{find(b)}}.',
    'Vì chỉ có đúng một chu trình, cạnh **đầu tiên** làm {{find(a) == find(b)}} chính là cạnh cuối cùng (theo thứ tự input) của chu trình đó.'
  ],
  solution: `### Ý tưởng
Duyệt cạnh theo thứ tự trong {{edges}}, mỗi cạnh {{(a, b)}}:
- Nếu {{a}} và {{b}} **chưa** cùng nhóm → gộp nhóm (cạnh hợp lệ của cây).
- Nếu **đã** cùng nhóm → giữa a và b đã có đường đi, cạnh này tạo chu trình → trả về.

Vì sao đó là cạnh **xuất hiện sau cùng** trong chu trình? Chu trình chỉ "đóng lại" khi cạnh cuối cùng của nó (theo thứ tự input) được thêm vào; trước thời điểm đó các cạnh của chu trình chỉ tạo thành một đường đi, không bị phát hiện.

~~~java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        int[] parent = new int[n + 1];             // node danh so 1..n
        for (int i = 1; i <= n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(parent, e[0]), rb = find(parent, e[1]);
            if (ra == rb) return e;                // da lien thong -> canh thua
            parent[ra] = rb;                       // gop hai nhom
        }
        return new int[0];                         // khong xay ra voi input hop le
    }

    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];         // path compression (halving)
            x = parent[x];
        }
        return x;
    }
}
~~~

### Chạy tay với ví dụ 2
[1,2] gộp; [2,3] gộp; [3,4] gộp → {1,2,3,4} cùng nhóm. [1,4]: find(1) == find(4) → trả [1,4].

### Độ phức tạp
O(n·α(n)) thời gian (gần như tuyến tính), O(n) bộ nhớ.

### Lưu ý khi phỏng vấn
- Ở đây chỉ dùng path compression (đã đủ nhanh với n ≤ 1000); thêm union by rank để đảm bảo α(n) chặt chẽ.
- Cách khác: với mỗi cạnh, DFS kiểm tra a và b đã nối chưa → O(n²). Nên nêu để thấy vì sao Union-Find tốt hơn.
- Redundant Connection II (đồ thị **có hướng**) khó hơn nhiều: phải xét thêm node có hai cha.

> Senior tip: Phát hiện "cạnh tạo vòng" khi thêm dần kết nối giống kiểm tra vòng khi thêm dependency mới vào hệ thống module, hoặc phát hiện loop trong cấu hình mạng (vai trò của Spanning Tree Protocol).`,
  complexity: 'Time O(n * α(n)), Space O(n)',
  starter: 'class Solution {\n    public int[] findRedundantConnection(int[][] edges) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + Arrays.toString((int[]) expected) + " got " + (actual instanceof int[] ? Arrays.toString((int[]) actual) : actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("triangle", new int[]{2, 3}, () -> new Solution().findRedundantConnection(new int[][]{{1, 2}, {1, 3}, {2, 3}}));
        run("example", new int[]{1, 4}, () -> new Solution().findRedundantConnection(new int[][]{{1, 2}, {2, 3}, {3, 4}, {1, 4}, {1, 5}}));
        run("last edge of cycle", new int[]{1, 3}, () -> new Solution().findRedundantConnection(new int[][]{{1, 2}, {2, 3}, {1, 3}}));
        run("cycle closes early", new int[]{2, 4}, () -> new Solution().findRedundantConnection(new int[][]{{1, 2}, {2, 3}, {3, 4}, {2, 4}, {4, 5}}));
        run("cycle not containing node 1", new int[]{3, 5}, () -> new Solution().findRedundantConnection(new int[][]{{1, 2}, {2, 3}, {3, 4}, {4, 5}, {3, 5}}));
        run("large cycle 1000", new int[]{1, 1000}, () -> {
            int n = 1000; int[][] e = new int[n][];
            for (int i = 0; i + 1 < n; i++) e[i] = new int[]{i + 1, i + 2};
            e[n - 1] = new int[]{1, n};
            return new Solution().findRedundantConnection(e);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu đồ thị có hướng (Redundant Connection II) thì phải xét thêm những trường hợp nào?', 'Không dùng Union-Find thì giải thế nào và độ phức tạp bao nhiêu?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-120',
  title: 'Single Number II',
  difficulty: 'medium',
  pattern: 'Bit Manipulation',
  tags: ['bit-manipulation', 'array', 'bytebytego'],
  prompt: `Cho mảng số nguyên {{nums}}, mọi phần tử xuất hiện **đúng 3 lần**, trừ **một** phần tử xuất hiện **đúng 1 lần**. Tìm phần tử đó với thời gian O(n) và bộ nhớ phụ O(1) (không dùng HashMap đếm).

### Ví dụ
~~~text
Input:  nums = [2,2,3,2]
Output: 3

Input:  nums = [0,1,0,1,0,1,99]
Output: 99

Input:  nums = [-2,-2,1,1,-4,1,-2]
Output: -4
~~~

### Ràng buộc
- {{1 <= nums.length <= 3 * 10^4}}
- {{-2^31 <= nums[i] <= 2^31 - 1}}`,
  hints: [
    'Mẹo XOR của Single Number I (mọi số xuất hiện 2 lần) không dùng được: {{x ^ x ^ x = x}}, ba lần không triệt tiêu.',
    'Xét riêng **từng bit** (32 vị trí). Ở bit thứ b, đếm số phần tử có bit đó bằng 1. Các số xuất hiện 3 lần đóng góp bội số của 3; nếu {{count % 3 == 1}} thì số cần tìm có bit b bằng 1.',
    'Ghép các bit lại bằng {{res |= 1 << b}}. Bit 31 là bit dấu nên số âm tự động đúng (bù hai). Nâng cao: hai biến {{ones}}, {{twos}} làm cùng việc trong một lần duyệt.'
  ],
  solution: `### Ý tưởng
Nhìn mảng theo **từng cột bit**. Ví dụ [2,2,3,2]:
~~~text
     bit1 bit0
2  =  1    0
2  =  1    0
3  =  1    1
2  =  1    0
tổng  4    1
%3    1    1   → kết quả = 11b = 3
~~~
Với mỗi bit b: các số xuất hiện 3 lần góp vào cột đó 0 hoặc 3 (hoặc 6, 9...) đơn vị, tức bội số của 3. Phần dư khi chia 3 chỉ có thể đến từ số xuất hiện một lần. Vậy {{count % 3}} chính là bit b của đáp án.

~~~java
class Solution {
    public int singleNumber(int[] nums) {
        int res = 0;
        for (int b = 0; b < 32; b++) {           // xet tung bit, ke ca bit dau (31)
            int count = 0;
            for (int x : nums) {
                count += (x >>> b) & 1;          // >>> dich khong dau: lay dung bit b
            }
            if (count % 3 != 0) res |= 1 << b;   // bit b thuoc so xuat hien 1 lan
        }
        return res;                              // bit 31 = 1 -> res tu dong la so am
    }
}
~~~

### Cách nâng cao: ones / twos (một lần duyệt)
Giữ hai mặt nạ: {{ones}} = các bit đã thấy số lần ≡ 1 (mod 3), {{twos}} = các bit đã thấy ≡ 2 (mod 3).
~~~java
int ones = 0, twos = 0;
for (int x : nums) {
    ones = (ones ^ x) & ~twos;   // them x vao ones neu bit chua o twos
    twos = (twos ^ x) & ~ones;   // them x vao twos neu bit vua roi khoi ones
}
return ones;                     // bit xuat hien 3 lan da bi xoa khoi ca hai
~~~
Ngắn và nhanh hơn, nhưng khó giải thích; trong phỏng vấn nên trình bày cách đếm bit trước.

### Độ phức tạp
- Đếm bit: O(32·n) = O(n) thời gian, O(1) bộ nhớ.
- ones/twos: O(n), O(1).

### Lưu ý khi phỏng vấn
- Dùng {{>>>}} (dịch không dấu) hoặc {{>>}} rồi {{& 1}} đều lấy đúng bit; quan trọng là ghép lại bằng {{1 << b}} với đủ 32 bit để số âm đúng.
- Tổng quát: mọi số xuất hiện k lần trừ một số → {{count % k}}.

> Senior tip: "Tách theo từng bit rồi đếm" là kỹ thuật dùng lại được ở nhiều nơi (tìm XOR lớn nhất, đếm cặp có AND bằng 0...). Khi bị yêu cầu O(1) bộ nhớ với số nguyên, hãy nghĩ tới 32 cột bit như 32 bộ đếm nhỏ.`,
  complexity: 'Time O(32 * n) = O(n), Space O(1)',
  starter: 'class Solution {\n    public int singleNumber(int[] nums) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example 1", 3, () -> new Solution().singleNumber(new int[]{2, 2, 3, 2}));
        run("example 2", 99, () -> new Solution().singleNumber(new int[]{0, 1, 0, 1, 0, 1, 99}));
        run("negative answer", -4, () -> new Solution().singleNumber(new int[]{-2, -2, 1, 1, -4, 1, -2}));
        run("single element", 7, () -> new Solution().singleNumber(new int[]{7}));
        run("answer zero", 0, () -> new Solution().singleNumber(new int[]{5, 5, 0, 5}));
        run("int min value", Integer.MIN_VALUE, () -> new Solution().singleNumber(new int[]{5, Integer.MIN_VALUE, 5, 5}));
        run("max repeated, negative single", -7, () -> new Solution().singleNumber(new int[]{Integer.MAX_VALUE, -7, Integer.MAX_VALUE, Integer.MAX_VALUE}));
        run("large", 123457, () -> {
            int[] a = new int[30001];
            for (int i = 0; i < 10000; i++) { a[3 * i] = a[3 * i + 1] = a[3 * i + 2] = i * 37 - 50000; }
            a[30000] = 123457;
            return new Solution().singleNumber(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Giải thích từng bước công thức ones/twos với ví dụ [2,2,3,2].', 'Nếu mọi số xuất hiện 2 lần trừ **hai** số xuất hiện một lần (Single Number III) thì làm thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-121',
  title: 'Missing Number',
  difficulty: 'easy',
  pattern: 'Bit Manipulation',
  tags: ['array', 'bit-manipulation', 'math', 'bytebytego'],
  prompt: `Cho mảng {{nums}} gồm {{n}} số **khác nhau** lấy từ đoạn {{[0, n]}} (đoạn này có n + 1 số), nên thiếu đúng **một** số. Tìm số bị thiếu với thời gian O(n) và bộ nhớ phụ O(1).

### Ví dụ
~~~text
Input:  nums = [3,0,1]
Output: 2

Input:  nums = [0,1]
Output: 2   (n = 2, đoạn [0, 2], thiếu số 2)

Input:  nums = [9,6,4,2,3,5,7,0,1]
Output: 8
~~~

### Ràng buộc
- {{n == nums.length}}, {{1 <= n <= 10^4}}
- {{0 <= nums[i] <= n}}, các số khác nhau.`,
  hints: [
    'Cách 1 (toán): tổng {{0 + 1 + ... + n = n(n+1)/2}}. Trừ đi tổng của mảng là ra số thiếu.',
    'Cách 2 (XOR): {{x ^ x = 0}} và {{x ^ 0 = x}}. XOR tất cả các số {{0..n}} với tất cả phần tử mảng: số nào có mặt ở cả hai bên bị triệt tiêu, chỉ còn số thiếu.',
    'Gộp hai vòng XOR thành một: khởi tạo {{res = n}}, rồi với mỗi i: {{res ^= i ^ nums[i]}}.'
  ],
  solution: `### Ý tưởng
**XOR** có ba tính chất: {{a ^ a = 0}}, {{a ^ 0 = a}}, và có thể đổi thứ tự tuỳ ý. Nếu XOR **tất cả** các số trong {{0..n}} cùng với **tất cả** phần tử của mảng, mỗi số có mặt sẽ xuất hiện hai lần và tự triệt tiêu; số bị thiếu chỉ xuất hiện một lần nên còn lại.

Viết gọn trong một vòng: chỉ số {{i}} chạy 0..n-1 cung cấp các số 0..n-1, còn số {{n}} thì đặt sẵn vào {{res}}.

~~~java
class Solution {
    public int missingNumber(int[] nums) {
        int res = nums.length;          // so n (chi so i chi chay toi n-1)
        for (int i = 0; i < nums.length; i++) {
            res ^= i ^ nums[i];         // XOR chi so i va gia tri nums[i]
        }
        return res;                     // moi so co mat bi triet tieu, con lai so thieu
    }
}
~~~

### Chạy tay với [3,0,1]
res = 3. i=0: 3^0^3 = 0. i=1: 0^1^0 = 1. i=2: 1^2^1 = 2. Kết quả 2.

### So sánh các cách
| Cách | Thời gian | Bộ nhớ | Ghi chú |
|---|---|---|---|
| Sắp xếp rồi tìm chỗ hổng | O(n log n) | O(1)–O(n) | sửa mảng input |
| HashSet | O(n) | O(n) | dễ nghĩ nhất |
| Tổng n(n+1)/2 | O(n) | O(1) | có thể tràn số nếu n lớn (dùng {{long}}) |
| XOR | O(n) | O(1) | không bao giờ tràn |

### Lưu ý khi phỏng vấn
- Với n ≤ 10^4 thì tổng chỉ khoảng 5·10^7, chưa tràn {{int}}; nhưng nếu n tới 10^5 thì {{n(n+1)}} ≈ 10^10 đã vượt {{int}}. XOR tránh hẳn vấn đề này.
- Nếu thiếu **nhiều** số thì cần cách khác (đánh dấu âm tại chỗ, hoặc HashSet).

> Senior tip: Kiểm tra "thiếu mã nào trong dãy liên tục" là việc thật khi đối soát số thứ tự hoá đơn hay sequence number của message. Ở quy mô lớn người ta dùng bitmap thay vì XOR vì thường thiếu nhiều số cùng lúc.`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public int missingNumber(int[] nums) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example 1", 2, () -> new Solution().missingNumber(new int[]{3, 0, 1}));
        run("missing last", 2, () -> new Solution().missingNumber(new int[]{0, 1}));
        run("example 3", 8, () -> new Solution().missingNumber(new int[]{9, 6, 4, 2, 3, 5, 7, 0, 1}));
        run("missing zero", 0, () -> new Solution().missingNumber(new int[]{1}));
        run("single zero", 1, () -> new Solution().missingNumber(new int[]{0}));
        run("large shuffled", 4321, () -> {
            int n = 10000; int[] a = new int[n]; int k = 0;
            for (int v = n; v >= 0; v--) if (v != 4321) a[k++] = v;
            return new Solution().missingNumber(a);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu thiếu đúng hai số thì dùng XOR thế nào để tìm cả hai?', 'Nếu mảng rất lớn nằm trên đĩa và thiếu nhiều số thì xử lý ra sao?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-122',
  title: 'Counting Bits',
  difficulty: 'easy',
  pattern: 'Bit Manipulation',
  tags: ['dynamic-programming', 'bit-manipulation', 'bytebytego'],
  prompt: `Cho số nguyên {{n}}. Trả về mảng {{ans}} độ dài {{n + 1}}, trong đó {{ans[i]}} là **số bit 1** trong biểu diễn nhị phân của {{i}} (với {{0 <= i <= n}}). Hãy làm trong O(n), không đếm lại từng bit cho mỗi số.

### Ví dụ
~~~text
Input:  n = 2
Output: [0,1,1]
Giải thích: 0 = 0, 1 = 1, 2 = 10.

Input:  n = 5
Output: [0,1,1,2,1,2]
Giải thích: 3 = 11, 4 = 100, 5 = 101.
~~~

### Ràng buộc
- {{0 <= n <= 10^5}}`,
  hints: [
    'Cách đơn giản: với mỗi i đếm bit bằng vòng lặp → O(n log n). Có thể tận dụng kết quả của số nhỏ hơn đã tính.',
    'Dịch phải 1 bit ({{i >> 1}}) là bỏ đi bit cuối. Vậy số bit 1 của i = số bit 1 của {{i >> 1}} + bit cuối của i ({{i & 1}}).',
    '{{i >> 1 < i}} nên {{ans[i >> 1]}} đã có sẵn khi tính {{ans[i]}}: đây là DP một chiều.'
  ],
  solution: `### Ý tưởng
Quan sát: viết i dưới dạng nhị phân, bỏ bit cuối cùng ta được {{i >> 1}} (tức {{i / 2}}). Ví dụ:
~~~text
i = 13 = 1101
i >> 1 = 6 = 110      (bỏ bit cuối là 1)
ans[13] = ans[6] + 1 = 2 + 1 = 3
~~~
Công thức: {{ans[i] = ans[i >> 1] + (i & 1)}}. Vì {{i >> 1}} luôn nhỏ hơn i (khi i ≥ 1), duyệt i tăng dần thì giá trị cần dùng đã được tính trước.

~~~java
class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];             // ans[0] = 0
        for (int i = 1; i <= n; i++) {
            ans[i] = ans[i >> 1] + (i & 1);      // bit 1 cua i/2 + bit cuoi cua i
        }
        return ans;
    }
}
~~~

### Công thức thay thế
{{i & (i - 1)}} xoá bit 1 **thấp nhất** của i (ví dụ 12 = 1100 → 1000). Do đó {{ans[i] = ans[i & (i - 1)] + 1}}. Cũng O(n).

### Độ phức tạp
O(n) thời gian, O(n) bộ nhớ cho mảng kết quả (bắt buộc phải trả về).

### Lưu ý khi phỏng vấn
- Java có sẵn {{Integer.bitCount(i)}} (thường được JIT dịch thành một lệnh CPU {{POPCNT}}); nên nhắc tới nhưng interviewer thường muốn thấy công thức DP.
- Giải thích được "vì sao ans[i >> 1] đã có" là điểm mấu chốt của lời giải DP.

> Senior tip: Đếm bit 1 (popcount) dùng nhiều trong thực tế: tính độ tương đồng giữa hai bitmap (khoảng cách Hamming), đếm số quyền bật trong một bitmask phân quyền, hay trong cấu trúc như HyperLogLog và Roaring Bitmap.`,
  complexity: 'Time O(n), Space O(n)',
  starter: 'class Solution {\n    public int[] countBits(int n) {\n        // TODO\n        return new int[0];\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + show(expected) + " got " + show(actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static String show(Object o) { return o instanceof int[] ? Arrays.toString((int[]) o) : String.valueOf(o); }
    public static void main(String[] args) {
        run("example n=2", new int[]{0, 1, 1}, () -> new Solution().countBits(2));
        run("example n=5", new int[]{0, 1, 1, 2, 1, 2}, () -> new Solution().countBits(5));
        run("zero", new int[]{0}, () -> new Solution().countBits(0));
        run("one", new int[]{0, 1}, () -> new Solution().countBits(1));
        run("n=8", new int[]{0, 1, 1, 2, 1, 2, 2, 3, 1}, () -> new Solution().countBits(8));
        run("n=100000 matches bitCount", "ok", () -> {
            int[] a = new Solution().countBits(100000);
            if (a.length != 100001) return "length " + a.length;
            for (int i = 0; i <= 100000; i++) if (a[i] != Integer.bitCount(i)) return "wrong at " + i;
            return "ok";
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Chứng minh công thức {{ans[i & (i - 1)] + 1}} đúng.', 'Nếu chỉ cần tổng số bit 1 của mọi số từ 0 tới n (n tới 10^18) thì làm thế nào?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-123',
  title: 'Sum of Two Integers',
  difficulty: 'medium',
  pattern: 'Bit Manipulation',
  tags: ['bit-manipulation', 'math', 'bytebytego'],
  prompt: `Cho hai số nguyên {{a}} và {{b}}. Tính {{a + b}} mà **không dùng** toán tử {{+}} và {{-}} (kể cả {{+=}}, {{++}}).

### Ví dụ
~~~text
Input:  a = 1, b = 2
Output: 3

Input:  a = 2, b = 3
Output: 5

Input:  a = -1, b = 1
Output: 0
~~~

### Ràng buộc
- {{-1000 <= a, b <= 1000}}`,
  hints: [
    'Nhớ lại phép cộng tay ở hệ nhị phân: mỗi cột cho ra một **bit tổng** và có thể một **bit nhớ** sang cột bên trái.',
    'Bit tổng khi **không tính nhớ** chính là {{a ^ b}} (1+0 = 1, 1+1 = 0). Bit nhớ xuất hiện ở cột mà cả hai đều là 1: {{a & b}}, và nhớ được cộng vào cột bên trái nên là {{(a & b) << 1}}.',
    'Bài toán chuyển thành cộng "tổng không nhớ" với "phần nhớ". Lặp lại cho đến khi phần nhớ bằng 0. Số âm vẫn đúng nhờ biểu diễn bù hai 32 bit.'
  ],
  solution: `### Ý tưởng
Phép cộng nhị phân tách thành hai phần:
- {{a ^ b}}: cộng từng cột nhưng **bỏ qua nhớ**.
- {{(a & b) << 1}}: các bit nhớ, đã dịch sang cột bên trái.

Tổng thật = (tổng không nhớ) + (phần nhớ). Ta lại cộng hai số này theo đúng cách trên, cho tới khi không còn nhớ.

Ví dụ 5 + 3:
~~~text
a = 101, b = 011
vòng 1: xor = 110, carry = (001) << 1 = 010
vòng 2: a = 110, b = 010 → xor = 100, carry = (010) << 1 = 100
vòng 3: a = 100, b = 100 → xor = 000, carry = 1000
vòng 4: a = 000, b = 1000 → xor = 1000, carry = 0 → kết quả 1000 = 8
~~~

~~~java
class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;   // cac bit nho, day sang cot ben trai
            a = a ^ b;                  // tong tung cot khi bo qua nho
            b = carry;                  // con phai cong them phan nho
        }
        return a;
    }
}
~~~

### Vì sao số âm vẫn đúng và vòng lặp có dừng?
Java {{int}} dùng bù hai 32 bit, phép cộng thật cũng chính là cộng nhị phân bỏ phần tràn khỏi bit 31. Thuật toán mô phỏng đúng điều đó. Mỗi vòng, bit nhớ thấp nhất dịch trái ít nhất một vị trí; sau tối đa 32 vòng nó bị đẩy ra khỏi 32 bit và {{carry}} thành 0.

### Độ phức tạp
Tối đa 32 vòng → O(1) thời gian, O(1) bộ nhớ.

### Lưu ý khi phỏng vấn
- Ở Python (số nguyên không giới hạn) phải tự mask {{0xFFFFFFFF}}; ở Java không cần vì {{int}} tự cắt 32 bit. Nêu được khác biệt này là điểm cộng.
- Trừ {{a - b}} = {{getSum(a, getSum(~b, 1))}} vì {{-b = ~b + 1}} trong bù hai.

> Senior tip: Bài này kiểm tra bạn hiểu số nguyên trong máy (bù hai, tràn số). Kiến thức đó cần khi debug lỗi tràn {{int}} thật, ví dụ cộng hai timestamp mili-giây hoặc tính {{(low + high) / 2}} trong binary search.`,
  complexity: 'Time O(1) (tối đa 32 vòng), Space O(1)',
  starter: 'class Solution {\n    public int getSum(int a, int b) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("1 + 2", 3, () -> new Solution().getSum(1, 2));
        run("2 + 3", 5, () -> new Solution().getSum(2, 3));
        run("-1 + 1", 0, () -> new Solution().getSum(-1, 1));
        run("0 + 0", 0, () -> new Solution().getSum(0, 0));
        run("both negative", -20, () -> new Solution().getSum(-12, -8));
        run("positive + negative", 4, () -> new Solution().getSum(7, -3));
        run("max bound", 2000, () -> new Solution().getSum(1000, 1000));
        run("min bound", -2000, () -> new Solution().getSum(-1000, -1000));
        run("many carries", 1024, () -> new Solution().getSum(1023, 1));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Viết phép trừ a - b chỉ bằng toán tử bit.', 'Vì sao trong Python cần mask 0xFFFFFFFF còn Java thì không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-124',
  title: 'Rotate Image',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'matrix', 'math', 'bytebytego'],
  prompt: `Cho ma trận vuông {{matrix}} kích thước {{n x n}} biểu diễn một bức ảnh. Xoay ảnh **90 độ theo chiều kim đồng hồ** **tại chỗ** (in-place): sửa trực tiếp {{matrix}}, không được tạo ma trận thứ hai.

### Ví dụ
~~~text
Input:  [[1,2,3],
         [4,5,6],
         [7,8,9]]
Output: [[7,4,1],
         [8,5,2],
         [9,6,3]]
~~~

### Ràng buộc
- {{1 <= n <= 20}}
- {{-1000 <= matrix[i][j] <= 1000}}`,
  hints: [
    'Khi xoay 90° theo chiều kim đồng hồ, phần tử ở {{(i, j)}} đi tới {{(j, n - 1 - i)}}. Có cách nào đạt được điều đó bằng hai phép đơn giản, mỗi phép làm tại chỗ được?',
    'Phép 1: **chuyển vị** (transpose), đổi {{matrix[i][j]}} với {{matrix[j][i]}}, chỉ duyệt nửa trên đường chéo ({{j > i}}) để không đổi hai lần.',
    'Phép 2: **đảo ngược mỗi hàng** (đổi chỗ cột trái và cột phải). Chuyển vị rồi đảo hàng = xoay 90° theo chiều kim đồng hồ.'
  ],
  solution: `### Ý tưởng
Xoay 90° theo chiều kim đồng hồ đưa {{(i, j)}} → {{(j, n-1-i)}}. Ta đạt được bằng hai bước, mỗi bước chỉ là hoán đổi tại chỗ:
1. **Chuyển vị**: {{(i, j)}} → {{(j, i)}}.
2. **Đảo mỗi hàng**: {{(j, i)}} → {{(j, n-1-i)}}.

~~~text
1 2 3      chuyển vị    1 4 7     đảo hàng    7 4 1
4 5 6     ─────────►    2 5 8    ─────────►   8 5 2
7 8 9                   3 6 9                 9 6 3
~~~

~~~java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        // buoc 1: chuyen vi - chi doi nua tren duong cheo (j > i), neu khong se doi 2 lan = khong doi
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }
        // buoc 2: dao nguoc tung hang
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int tmp = row[l];
                row[l] = row[r];
                row[r] = tmp;
            }
        }
    }
}
~~~

### Cách khác: xoay 4 phần tử theo vòng
Với mỗi "lớp" từ ngoài vào trong, 4 ô ở bốn cạnh đổi vòng cho nhau: trên → phải → dưới → trái → trên. Chỉ cần một biến tạm, mỗi ô di chuyển đúng một lần, nhưng chỉ số dễ nhầm hơn.

### Độ phức tạp
Mỗi bước duyệt khoảng n²/2 ô → O(n²) thời gian, O(1) bộ nhớ phụ.

### Lưu ý khi phỏng vấn
- Xoay **ngược** chiều kim đồng hồ: chuyển vị rồi đảo mỗi **cột** (hoặc đảo hàng trước rồi chuyển vị).
- Xoay 180°: đảo hàng rồi đảo thứ tự các hàng.
- Lỗi phổ biến: vòng chuyển vị chạy {{j}} từ 0, đổi mỗi cặp hai lần nên ma trận không đổi.

> Senior tip: Phân rã một phép biến đổi khó thành các phép đơn giản đã biết (chuyển vị + đảo) là kỹ năng thiết kế quan trọng, giúp code dễ kiểm chứng hơn việc suy ra trực tiếp công thức chỉ số.`,
  complexity: 'Time O(n^2), Space O(1)',
  starter: 'class Solution {\n    public void rotate(int[][] matrix) {\n        // TODO: sua truc tiep matrix\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + Arrays.deepToString((Object[]) expected) + " got " + Arrays.deepToString((Object[]) actual));
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static int[][] rot(int[][] m) { new Solution().rotate(m); return m; }
    public static void main(String[] args) {
        run("3x3", new int[][]{{7, 4, 1}, {8, 5, 2}, {9, 6, 3}}, () -> rot(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}));
        run("1x1", new int[][]{{1}}, () -> rot(new int[][]{{1}}));
        run("2x2", new int[][]{{3, 1}, {4, 2}}, () -> rot(new int[][]{{1, 2}, {3, 4}}));
        run("4x4", new int[][]{{13, 9, 5, 1}, {14, 10, 6, 2}, {15, 11, 7, 3}, {16, 12, 8, 4}}, () -> rot(new int[][]{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}, {13, 14, 15, 16}}));
        run("negatives", new int[][]{{-3, -1}, {-4, -2}}, () -> rot(new int[][]{{-1, -2}, {-3, -4}}));
        run("four rotations = identity", new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}, () -> rot(rot(rot(rot(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}})))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Viết lại bằng cách xoay 4 phần tử theo từng lớp.', 'Nếu ma trận không vuông (m x n) thì có xoay tại chỗ được không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-125',
  title: 'Spiral Matrix',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'matrix', 'simulation', 'bytebytego'],
  prompt: `Cho ma trận {{matrix}} kích thước {{m x n}}. Trả về mọi phần tử theo thứ tự **xoắn ốc**: bắt đầu ở góc trên trái, đi sang phải, rồi xuống, sang trái, lên, và cứ thế đi vòng vào trong theo chiều kim đồng hồ.

### Ví dụ
~~~text
Input:  [[1,2,3],
         [4,5,6],
         [7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

Input:  [[1,2,3,4],
         [5,6,7,8],
         [9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]
~~~

### Ràng buộc
- {{1 <= m, n <= 10}}
- {{-100 <= matrix[i][j] <= 100}}`,
  hints: [
    'Giữ 4 biên của phần chưa duyệt: {{top}}, {{bottom}}, {{left}}, {{right}}.',
    'Mỗi vòng: đi hết hàng {{top}} (trái → phải) rồi {{top++}}; đi hết cột {{right}} (trên → dưới) rồi {{right--}}; đi hàng {{bottom}} (phải → trái) rồi {{bottom--}}; đi cột {{left}} (dưới → trên) rồi {{left++}}.',
    'Cẩn thận khi chỉ còn **một hàng** hoặc **một cột**: trước khi đi hàng dưới phải kiểm tra {{top <= bottom}}, trước khi đi cột trái phải kiểm tra {{left <= right}}, nếu không sẽ lấy trùng phần tử.'
  ],
  solution: `### Ý tưởng
Mô phỏng việc "bóc vỏ" ma trận từng lớp. Bốn biến biên mô tả hình chữ nhật còn lại chưa duyệt. Mỗi lần đi hết một cạnh thì cạnh đó đã dùng xong, ta thu biên tương ứng vào trong.

~~~text
→ → → ↓        top    = hàng trên cùng chưa duyệt
↑ → ↓ ↓        bottom = hàng dưới cùng chưa duyệt
↑ ← ← ↓        left / right = cột trái / phải chưa duyệt
~~~

~~~java
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.add(matrix[top][c]);   // hang tren: trai -> phai
            top++;
            for (int r = top; r <= bottom; r++) res.add(matrix[r][right]); // cot phai: tren -> duoi
            right--;
            if (top <= bottom) {                                            // con hang de di nguoc?
                for (int c = right; c >= left; c--) res.add(matrix[bottom][c]); // hang duoi: phai -> trai
                bottom--;
            }
            if (left <= right) {                                            // con cot de di len?
                for (int r = bottom; r >= top; r--) res.add(matrix[r][left]);   // cot trai: duoi -> tren
                left++;
            }
        }
        return res;
    }
}
~~~

### Vì sao cần hai câu if?
Với ma trận một hàng {{[[1,2,3]]}}: đi hàng trên lấy 1,2,3, rồi {{top = 1 > bottom = 0}}. Nếu không kiểm tra, bước "hàng dưới" sẽ lấy lại 3,2,1. Tương tự với ma trận một cột và bước "cột trái".

### Độ phức tạp
Mỗi phần tử được thêm đúng một lần → O(m·n) thời gian, O(1) bộ nhớ phụ (không tính kết quả).

### Lưu ý khi phỏng vấn
- Cách khác: mảng {{visited}} + đổi hướng khi chạm biên hoặc ô đã thăm; dễ nghĩ nhưng tốn O(m·n) bộ nhớ.
- Test tay với ma trận 1 hàng, 1 cột và hình chữ nhật không vuông trước khi nói "xong".

> Senior tip: Bài mô phỏng như thế này không khó về thuật toán mà khó về **điều kiện biên**. Thói quen tự test các ca 1×n, n×1, 1×1 trước khi nộp cũng chính là thói quen viết unit test tốt.`,
  complexity: 'Time O(m * n), Space O(1) phụ',
  starter: 'class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("3x3", Arrays.asList(1, 2, 3, 6, 9, 8, 7, 4, 5), () -> new Solution().spiralOrder(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}));
        run("3x4", Arrays.asList(1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7), () -> new Solution().spiralOrder(new int[][]{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}));
        run("1x1", Arrays.asList(1), () -> new Solution().spiralOrder(new int[][]{{1}}));
        run("single row", Arrays.asList(1, 2, 3), () -> new Solution().spiralOrder(new int[][]{{1, 2, 3}}));
        run("single column", Arrays.asList(1, 2, 3), () -> new Solution().spiralOrder(new int[][]{{1}, {2}, {3}}));
        run("2x2", Arrays.asList(1, 2, 4, 3), () -> new Solution().spiralOrder(new int[][]{{1, 2}, {3, 4}}));
        run("4x3 tall", Arrays.asList(1, 2, 3, 6, 9, 12, 11, 10, 7, 4, 5, 8), () -> new Solution().spiralOrder(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}, {10, 11, 12}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Sinh ma trận n x n chứa 1..n² theo thứ tự xoắn ốc (Spiral Matrix II) thế nào?', 'Nếu chỉ cần phần tử thứ k theo thứ tự xoắn ốc thì có cách nhanh hơn duyệt hết không?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-126',
  title: 'Valid Sudoku',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['array', 'hash-table', 'matrix', 'bytebytego'],
  prompt: `Cho bảng Sudoku {{9 x 9}} đang điền dở ({{'.'}} là ô trống). Kiểm tra các ô **đã điền** có vi phạm luật không: mỗi chữ số {{1-9}} xuất hiện tối đa một lần trong mỗi **hàng**, mỗi **cột** và mỗi **khối 3x3**. Không cần kiểm tra bảng có giải được hay không.

### Ví dụ
~~~text
Input:
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
Output: true

Nếu đổi ô (0,0) từ 5 thành 8: cột 0 có hai số 8 (hàng 0 và hàng 3) → false.
~~~

### Ràng buộc
- {{board.length == 9}}, {{board[i].length == 9}}
- {{board[i][j]}} là chữ số {{'1'..'9'}} hoặc {{'.'}}.`,
  hints: [
    'Duyệt mỗi ô **một lần**, với mỗi chữ số cần biết ngay nó đã xuất hiện ở hàng/cột/khối này chưa.',
    'Dùng ba bảng đánh dấu {{row[9][10]}}, {{col[9][10]}}, {{box[9][10]}}: ví dụ {{row[i][d] = true}} nghĩa là chữ số d đã có ở hàng i.',
    'Chỉ số khối của ô {{(i, j)}} là {{(i / 3) * 3 + j / 3}} (khối đánh số 0..8 từ trái sang phải, trên xuống dưới).'
  ],
  solution: `### Ý tưởng
Có 27 "nhóm" cần kiểm tra trùng: 9 hàng, 9 cột, 9 khối. Thay vì kiểm tra từng nhóm riêng, ta duyệt bảng một lần và cập nhật cả ba nhóm chứa ô hiện tại.

**Tính chỉ số khối:** {{i / 3}} cho biết khối nằm ở dải hàng thứ mấy (0, 1, 2), {{j / 3}} cho dải cột. Ghép lại {{(i / 3) * 3 + j / 3}}:
~~~text
khối:  0 | 1 | 2
       3 | 4 | 5
       6 | 7 | 8
ô (4, 7): 4/3 = 1, 7/3 = 2 → khối 1*3 + 2 = 5
~~~

~~~java
class Solution {
    public boolean isValidSudoku(char[][] board) {
        boolean[][] row = new boolean[9][10]; // row[i][d]: chu so d da co o hang i
        boolean[][] col = new boolean[9][10];
        boolean[][] box = new boolean[9][10];
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char ch = board[i][j];
                if (ch == '.') continue;              // o trong: bo qua
                int d = ch - '0';
                int b = (i / 3) * 3 + j / 3;          // chi so khoi 3x3
                if (row[i][d] || col[j][d] || box[b][d]) return false; // trung
                row[i][d] = col[j][d] = box[b][d] = true;
            }
        }
        return true;
    }
}
~~~

### Độ phức tạp
Bảng cố định 81 ô → O(1) (nếu tổng quát hoá cho bảng N×N thì O(N²)). Bộ nhớ 3 × 9 × 10 boolean → O(1).

### Lưu ý khi phỏng vấn
- Đề chỉ hỏi bảng **hiện tại** có hợp lệ không; bảng hợp lệ vẫn có thể không giải được.
- Có thể dùng một {{HashSet<String>}} chứa các chuỗi như "5 in row 0", "5 in col 0", "5 in box 0": code ngắn, nhưng chậm hơn mảng boolean.
- Tối ưu bộ nhớ: mỗi hàng/cột/khối dùng một {{int}} 9 bit làm bitmask.

> Senior tip: Kiểm tra ràng buộc "duy nhất trong nhiều chiều" giống việc validate dữ liệu nhập (ví dụ lịch xếp ca: một người không trùng ca trong cùng ngày, cùng phòng). Mảng đánh dấu hay bitmask là cách kiểm tra rẻ nhất.`,
  complexity: 'Time O(1) (81 ô), Space O(1)',
  starter: 'class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static char[][] valid() {
        String[] rows = {"53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"};
        char[][] b = new char[9][];
        for (int i = 0; i < 9; i++) b[i] = rows[i].toCharArray();
        return b;
    }
    static char[][] with(int r, int c, char v) { char[][] b = valid(); b[r][c] = v; return b; }
    public static void main(String[] args) {
        run("valid example", true, () -> new Solution().isValidSudoku(valid()));
        run("column duplicate", false, () -> new Solution().isValidSudoku(with(0, 0, '8')));
        run("row duplicate", false, () -> new Solution().isValidSudoku(with(0, 2, '5')));
        run("column only duplicate", false, () -> new Solution().isValidSudoku(with(4, 1, '6')));
        run("box only duplicate", false, () -> new Solution().isValidSudoku(with(1, 1, '8')));
        run("empty board", true, () -> { char[][] b = new char[9][9]; for (char[] r : b) Arrays.fill(r, '.'); return new Solution().isValidSudoku(b); });
        run("valid extra digit", true, () -> new Solution().isValidSudoku(with(0, 2, '4')));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Dùng bitmask (một int cho mỗi hàng/cột/khối) thay mảng boolean thế nào?', 'Từ bài này, làm sao viết bộ giải Sudoku bằng backtracking?']
}
);
(window.ALGOS = window.ALGOS || []).push(
{
  id: 'algo-127',
  title: 'Count Primes',
  difficulty: 'medium',
  pattern: 'Math + Geometry',
  tags: ['math', 'sieve', 'bytebytego'],
  prompt: `Cho số nguyên {{n}}. Đếm số **số nguyên tố nhỏ hơn hẳn** {{n}} (số nguyên tố là số > 1 chỉ chia hết cho 1 và chính nó).

### Ví dụ
~~~text
Input:  n = 10
Output: 4
Giải thích: 2, 3, 5, 7.

Input:  n = 0
Output: 0

Input:  n = 2
Output: 0   (2 không nhỏ hơn 2)
~~~

### Ràng buộc
- {{0 <= n <= 5 * 10^6}}`,
  hints: [
    'Kiểm tra từng số bằng cách thử chia tới căn bậc hai tốn khoảng O(n·√n) ≈ 10^10 phép với n = 5·10^6: quá chậm.',
    'Sàng Eratosthenes: thay vì hỏi "x có phải số nguyên tố không", hãy **gạch bỏ** mọi bội của từng số nguyên tố. Số nào không bị gạch là số nguyên tố.',
    'Với số nguyên tố p, bắt đầu gạch từ {{p * p}} (các bội nhỏ hơn như 2p, 3p đã bị gạch bởi số nguyên tố nhỏ hơn). Chỉ cần sàng với {{p * p < n}}; dùng {{long}} hoặc so sánh cẩn thận để tránh tràn số.'
  ],
  solution: `### Ý tưởng: sàng Eratosthenes
1. Mảng {{composite[0..n-1]}}, ban đầu tất cả false (chưa bị gạch).
2. Duyệt p từ 2: nếu {{composite[p] == false}} thì p là số nguyên tố → đếm, rồi gạch {{p*p, p*p + p, p*p + 2p, ...}}.
3. Vì sao bắt đầu từ {{p * p}}? Mọi bội {{k·p}} với {{k < p}} có ước nguyên tố nhỏ hơn p nên đã bị gạch trước đó.

Ví dụ n = 20:
~~~text
p = 2: gạch 4 6 8 10 12 14 16 18
p = 3: gạch 9 (12, 18 đã gạch) 15
p = 5: 25 >= 20, không gạch gì nữa
Còn lại: 2 3 5 7 11 13 17 19 → 8 số
~~~

~~~java
class Solution {
    public int countPrimes(int n) {
        if (n < 3) return 0;                       // khong co so nguyen to nao < 2
        boolean[] composite = new boolean[n];      // composite[x] = true: x la hop so
        int count = 0;
        for (int p = 2; p < n; p++) {
            if (composite[p]) continue;
            count++;                               // p khong bi bo so nao gach -> nguyen to
            if ((long) p * p >= n) continue;       // ep long: p*p co the tran int
            for (int m = p * p; m < n; m += p) {
                composite[m] = true;               // gach boi cua p
            }
        }
        return count;
    }
}
~~~

### Độ phức tạp
- Thời gian O(n log log n): tổng số lần gạch là n/2 + n/3 + n/5 + ... (theo các số nguyên tố) ≈ n·log log n, gần như tuyến tính.
- Bộ nhớ O(n): n = 5·10^6 → khoảng 5 MB với {{boolean[]}} (mỗi phần tử 1 byte); {{BitSet}} giảm còn ~625 KB.

### Lưu ý khi phỏng vấn
- {{p * p}} với p gần 46341 đã vượt {{Integer.MAX_VALUE}}; ở đây n ≤ 5·10^6 nên vòng gạch không chạy tới đó, nhưng ép {{long}} là thói quen tốt.
- Biên: n = 0, 1, 2 đều trả 0; n = 3 trả 1.
- Với n rất lớn (10^9+) dùng **sàng phân đoạn** (segmented sieve) để bộ nhớ chỉ O(√n).

> Senior tip: Sàng là ví dụ điển hình của việc đánh đổi bộ nhớ lấy tốc độ. Khi tính toán lặp lại nhiều lần trên cùng miền giá trị, tính trước một bảng (precompute) thường nhanh hơn rất nhiều so với tính lại từng lần.`,
  complexity: 'Time O(n log log n), Space O(n)',
  starter: 'class Solution {\n    public int countPrimes(int n) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("n=10", 4, () -> new Solution().countPrimes(10));
        run("n=0", 0, () -> new Solution().countPrimes(0));
        run("n=1", 0, () -> new Solution().countPrimes(1));
        run("n=2", 0, () -> new Solution().countPrimes(2));
        run("n=3", 1, () -> new Solution().countPrimes(3));
        run("n=20", 8, () -> new Solution().countPrimes(20));
        run("n=100", 25, () -> new Solution().countPrimes(100));
        run("n=5000000", 348513, () -> new Solution().countPrimes(5000000));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Dùng BitSet hoặc chỉ lưu số lẻ để giảm bộ nhớ thế nào?', 'Sàng phân đoạn (segmented sieve) hoạt động ra sao khi n = 10^10?']
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
  prompt: `Cho chuỗi {{s}}. Tìm **chuỗi con liên tiếp** dài nhất là palindrome (đọc xuôi và đọc ngược giống nhau). Nếu có nhiều chuỗi cùng độ dài lớn nhất, trả về chuỗi bất kỳ trong số đó.

### Ví dụ
~~~text
Input:  s = "babad"
Output: "bab"   ("aba" cũng đúng)

Input:  s = "cbbd"
Output: "bb"

Input:  s = "a"
Output: "a"
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái tiếng Anh và chữ số.`,
  hints: [
    'Mọi palindrome đều đối xứng quanh một **tâm**. Thay vì xét mọi chuỗi con (O(n²) chuỗi, mỗi chuỗi kiểm tra O(n)), hãy xét mọi tâm.',
    'Từ một tâm, dùng hai con trỏ {{left}}, {{right}} mở rộng ra hai phía chừng nào {{s[left] == s[right]}}.',
    'Có hai loại tâm: một ký tự ({{left = right = i}}, palindrome độ dài lẻ như "aba") và giữa hai ký tự ({{left = i, right = i + 1}}, độ dài chẵn như "abba"). Tổng cộng 2n - 1 tâm.'
  ],
  solution: `### Ý tưởng: mở rộng từ tâm (expand around center)
Palindrome "aba" có tâm là "b"; palindrome "abba" có tâm nằm giữa hai chữ "b". Với mỗi tâm, ta mở rộng ra hai phía cho tới khi hai đầu khác nhau hoặc chạm biên; độ dài đạt được là palindrome dài nhất có tâm đó. Lấy max qua mọi tâm.

~~~text
s = "babad", tâm i = 2 (chữ 'b'):
  left=2,right=2: 'b'=='b' → mở rộng
  left=1,right=3: 'a'=='a' → mở rộng
  left=0,right=4: 'b'!='d' → dừng → palindrome s[1..3] = "aba", dài 3
~~~

~~~java
class Solution {
    public String longestPalindrome(String s) {
        int bestStart = 0, bestLen = 1;               // it nhat 1 ky tu la palindrome
        for (int i = 0; i < s.length(); i++) {
            int odd = expand(s, i, i);                // tam la ky tu i (do dai le)
            int even = expand(s, i, i + 1);           // tam giua i va i+1 (do dai chan)
            int len = Math.max(odd, even);
            if (len > bestLen) {
                bestLen = len;
                bestStart = i - (len - 1) / 2;        // tinh lai diem bat dau tu tam
            }
        }
        return s.substring(bestStart, bestStart + bestLen);
    }

    // mo rong tu [left, right]; tra ve do dai palindrome dai nhat co tam nay
    private int expand(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;                      // vong lap dung khi da vuot 1 buoc moi ben
    }
}
~~~

### Vì sao {{bestStart = i - (len - 1) / 2}}?
- Độ dài lẻ, ví dụ len = 3 quanh i: bắt đầu ở {{i - 1}} = {{i - (3 - 1) / 2}}.
- Độ dài chẵn, ví dụ len = 4 với tâm giữa i và i + 1: bắt đầu ở {{i - 1}} = {{i - (4 - 1) / 2}} (chia nguyên 3 / 2 = 1). Một công thức dùng được cho cả hai.

### So sánh các cách
| Cách | Thời gian | Bộ nhớ |
|---|---|---|
| Thử mọi chuỗi con | O(n³) | O(1) |
| DP bảng {{isPal[i][j]}} | O(n²) | O(n²) |
| Mở rộng từ tâm | O(n²) | O(1) |
| Manacher | O(n) | O(n) |

### Lưu ý khi phỏng vấn
- Quên tâm chẵn là lỗi phổ biến nhất: "cbbd" sẽ trả "c" thay vì "bb".
- Mở rộng từ tâm là lời giải được mong đợi; Manacher chỉ cần nhắc tên và ý tưởng (tận dụng tính đối xứng của palindrome đã tìm được).

> Senior tip: Khi thấy lời giải O(n²) bộ nhớ dùng bảng DP, hãy hỏi "mỗi ô có thật sự cần lưu không?". Ở đây thứ tự duyệt theo tâm cho phép bỏ hẳn bảng, giữ O(1) bộ nhớ.`,
  complexity: 'Time O(n^2), Space O(1)',
  starter: 'class Solution {\n    public String longestPalindrome(String s) {\n        // TODO\n        return "";\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected '" + expected + "' got '" + actual + "'");
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static String repeat(char ch, int k) { char[] a = new char[k]; Arrays.fill(a, ch); return new String(a); }
    public static void main(String[] args) {
        run("babad (bab or aba)", true, () -> { String r = new Solution().longestPalindrome("babad"); return r.equals("bab") || r.equals("aba"); });
        run("even center", "bb", () -> new Solution().longestPalindrome("cbbd"));
        run("single", "a", () -> new Solution().longestPalindrome("a"));
        run("at end", "bb", () -> new Solution().longestPalindrome("abb"));
        run("all same", "bbbb", () -> new Solution().longestPalindrome("bbbb"));
        run("whole string", "racecar", () -> new Solution().longestPalindrome("racecar"));
        run("in the middle", "anana", () -> new Solution().longestPalindrome("bananas"));
        run("digits", "12321", () -> new Solution().longestPalindrome("9123214"));
        run("large 1000 same", repeat('a', 1000), () -> new Solution().longestPalindrome(repeat('a', 1000)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu chỉ cần độ dài thì code gọn hơn thế nào?', 'Thuật toán Manacher đạt O(n) bằng cách nào (ý tưởng chính)?']
},
{
  id: 'algo-129',
  title: 'Palindromic Substrings Count',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Đếm số **chuỗi con liên tiếp** là palindrome. Hai chuỗi con ở **vị trí khác nhau** được tính riêng, kể cả khi nội dung giống nhau.

### Ví dụ
~~~text
Input:  s = "abc"
Output: 3
Giải thích: "a", "b", "c".

Input:  s = "aaa"
Output: 6
Giải thích: "a" ×3 (ở 3 vị trí), "aa" ×2, "aaa" ×1.
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Mỗi palindrome có đúng một tâm (một ký tự hoặc khoảng giữa hai ký tự). Đếm palindrome theo từng tâm thì không sót, không trùng.',
    'Từ một tâm, mở rộng ra hai phía: **mỗi lần mở rộng thành công** là thêm đúng một palindrome mới (dài hơn cái trước 2 ký tự).',
    'Cộng kết quả của cả 2n - 1 tâm: n tâm lẻ {{(i, i)}} và n - 1 tâm chẵn {{(i, i + 1)}}.'
  ],
  solution: `### Ý tưởng
Cùng kỹ thuật "mở rộng từ tâm" như bài Longest Palindromic Substring (algo-128), nhưng thay vì giữ cái dài nhất ta **đếm**. Từ tâm {{(left, right)}}:
- Nếu {{s[left] == s[right]}} thì {{s[left..right]}} là palindrome → đếm 1, rồi mở rộng {{left--}}, {{right++}}.
- Dừng khi khác nhau hoặc chạm biên: palindrome lớn hơn với cùng tâm chắc chắn không tồn tại (vì nó phải chứa palindrome nhỏ hơn ở giữa).

~~~text
s = "aaa"
tâm lẻ i=0: "a"                → 1
tâm lẻ i=1: "a", "aaa"         → 2
tâm lẻ i=2: "a"                → 1
tâm chẵn (0,1): "aa"           → 1
tâm chẵn (1,2): "aa"           → 1
tổng = 6
~~~

~~~java
class Solution {
    public int countSubstrings(String s) {
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            count += countFrom(s, i, i);       // palindrome do dai le, tam o i
            count += countFrom(s, i, i + 1);   // palindrome do dai chan, tam giua i va i+1
        }
        return count;
    }

    // so palindrome co tam (left, right)
    private int countFrom(String s, int left, int right) {
        int c = 0;
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            c++;                               // s[left..right] la mot palindrome moi
            left--;
            right++;
        }
        return c;
    }
}
~~~

### Độ phức tạp
2n - 1 tâm, mỗi tâm mở rộng tối đa O(n) bước → O(n²) thời gian (n = 1000 → khoảng 10^6 bước). Bộ nhớ O(1).

### Lưu ý khi phỏng vấn
- Kết quả tối đa n(n+1)/2 ≈ 500.500 với n = 1000, vừa {{int}}.
- Cách DP: {{isPal[i][j] = s[i] == s[j] && (j - i < 2 || isPal[i+1][j-1])}}, đếm số ô true. Cùng O(n²) thời gian nhưng tốn O(n²) bộ nhớ.

> Senior tip: Hai bài 128 và 129 dùng chung một hàm "mở rộng từ tâm", chỉ khác cách gom kết quả (max hay đếm). Nhận ra lõi chung giữa các bài giúp bạn giải nhanh bài mới trong phỏng vấn.`,
  complexity: 'Time O(n^2), Space O(1)',
  starter: 'class Solution {\n    public int countSubstrings(String s) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static String repeat(char ch, int k) { char[] a = new char[k]; Arrays.fill(a, ch); return new String(a); }
    public static void main(String[] args) {
        run("abc", 3, () -> new Solution().countSubstrings("abc"));
        run("aaa", 6, () -> new Solution().countSubstrings("aaa"));
        run("abba", 6, () -> new Solution().countSubstrings("abba"));
        run("single", 1, () -> new Solution().countSubstrings("a"));
        run("two same", 3, () -> new Solution().countSubstrings("aa"));
        run("racecar", 10, () -> new Solution().countSubstrings("racecar"));
        run("large 1000 same", 500500, () -> new Solution().countSubstrings(repeat('a', 1000)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần đếm palindrome **khác nhau về nội dung** (không tính trùng) thì làm thế nào?', 'Viết lời giải DP bảng isPal và so sánh với cách mở rộng từ tâm.']
},
{
  id: 'algo-130',
  title: 'Minimum Cuts for Palindrome Partitioning',
  difficulty: 'hard',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Cắt {{s}} thành nhiều đoạn liên tiếp sao cho **mỗi đoạn đều là palindrome** (đọc xuôi hay ngược đều giống nhau). Trả về **số lần cắt ít nhất** (bằng số đoạn ít nhất trừ 1).

### Ví dụ
~~~text
Input:  s = "aab"
Output: 1
Giải thích: cắt thành "aa" | "b", chỉ 1 lần cắt.

Input:  s = "a"
Output: 0
Giải thích: bản thân "a" đã là palindrome, không cần cắt.

Input:  s = "leet"
Output: 2
Giải thích: "l" | "ee" | "t".
~~~

### Ràng buộc
- {{1 <= s.length <= 2000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Trước hết hãy trả lời nhanh câu hỏi "s[j..i] có phải palindrome không?" cho mọi cặp (j, i). Một bảng boolean {{isPal[j][i]}} làm được việc đó: s[j..i] là palindrome khi {{s[j] == s[i]}} và đoạn bên trong {{s[j+1..i-1]}} cũng là palindrome (hoặc đoạn dài ≤ 2).',
    'Gọi {{cut[i]}} = số lần cắt ít nhất cho tiền tố {{s[0..i]}}. Đoạn palindrome **cuối cùng** của tiền tố đó bắt đầu ở một vị trí j nào đó.',
    'Nếu {{s[0..i]}} đã là palindrome thì {{cut[i] = 0}}. Ngược lại {{cut[i] = min(cut[j-1] + 1)}} với mọi j ≥ 1 mà {{isPal[j][i]}} đúng.'
  ],
  solution: `### Ý tưởng
Bài này ghép hai bảng DP:
1. {{isPal[j][i]}}: đoạn {{s[j..i]}} có phải palindrome không. Tính một lần, sau đó tra cứu O(1).
2. {{cut[i]}}: số lần cắt ít nhất cho tiền tố {{s[0..i]}}.

Vì sao công thức của {{cut}} đúng? Xét cách cắt tối ưu của {{s[0..i]}}. Đoạn cuối cùng của nó là một palindrome {{s[j..i]}}. Phần phía trước {{s[0..j-1]}} cũng phải được cắt tối ưu (nếu không, ta thay bằng cách cắt tốt hơn và được kết quả tốt hơn, mâu thuẫn). Vậy chỉ cần thử mọi j làm "điểm bắt đầu đoạn cuối":
- j = 0: cả tiền tố là palindrome, không cần cắt → 0.
- j ≥ 1: cắt một nhát ngay trước j → {{cut[j-1] + 1}}.

~~~java
class Solution {
    public int minCut(String s) {
        int n = s.length();
        // isPal[j][i] = true neu s[j..i] la palindrome
        boolean[][] isPal = new boolean[n][n];
        // j di tu phai sang trai de khi can isPal[j+1][i-1] thi o do da duoc tinh
        for (int j = n - 1; j >= 0; j--) {
            for (int i = j; i < n; i++) {
                isPal[j][i] = s.charAt(j) == s.charAt(i)
                        && (i - j < 2 || isPal[j + 1][i - 1]); // doan dai 1-2 hoac phan trong la palindrome
            }
        }
        int[] cut = new int[n]; // cut[i] = so lan cat it nhat cho s[0..i]
        for (int i = 0; i < n; i++) {
            if (isPal[0][i]) {          // ca tien to la palindrome: khong can cat
                cut[i] = 0;
                continue;
            }
            cut[i] = i;                 // truong hop xau nhat: cat sau moi ky tu
            for (int j = 1; j <= i; j++) {
                if (isPal[j][i]) {      // doan cuoi s[j..i] la palindrome
                    cut[i] = Math.min(cut[i], cut[j - 1] + 1);
                }
            }
        }
        return cut[n - 1];
    }
}
~~~

### Chạy tay với s = "aab"
- Bảng palindrome: "a"(0..0), "a"(1..1), "b"(2..2), "aa"(0..1) đúng; "ab"(1..2), "aab"(0..2) sai.
- {{cut[0]}} = 0 ("a").
- {{cut[1]}} = 0 vì "aa" là palindrome.
- {{cut[2]}}: "aab" không phải palindrome. Thử j = 2: "b" là palindrome → {{cut[1] + 1 = 1}}. Thử j = 1: "ab" không phải. Kết quả 1.

### Độ phức tạp
- Bảng {{isPal}}: n² ô, mỗi ô O(1) → O(n²) thời gian và O(n²) bộ nhớ (n = 2000 → 4 triệu boolean ≈ 4 MB).
- Vòng {{cut}}: hai vòng lồng nhau → O(n²).
- Nếu kiểm tra palindrome bằng cách so từng ký tự mỗi lần (không có bảng) thì thành O(n³) = 8·10^9 phép với n = 2000, quá chậm.

### Lưu ý khi phỏng vấn
- Thứ tự tính bảng là điểm hay sai: {{isPal[j][i]}} cần {{isPal[j+1][i-1]}}, nên j phải đi **giảm dần**.
- Có cách O(n) bộ nhớ: với mỗi tâm, "mở rộng ra hai phía" (expand around center) và cập nhật {{cut}} ngay khi tìm thấy palindrome. Nêu được ý này là điểm cộng.
- Đừng nhầm với Palindrome Partitioning (liệt kê mọi cách cắt, cần backtracking): ở đây chỉ cần **con số nhỏ nhất** nên DP là đủ.

> Senior tip: Khi một bài DP cần hỏi đi hỏi lại cùng một câu "đoạn này có tính chất X không?", hãy tính trước bảng đó một lần. Đây là cùng tư duy với việc cache kết quả kiểm tra tốn kém trong hệ thống thật.`,
  complexity: 'Time O(n^2), Space O(n^2)',
  starter: 'class Solution {\n    public int minCut(String s) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static String repeat(String s, int k) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < k; i++) sb.append(s); return sb.toString(); }
    public static void main(String[] args) {
        run("example aab", 1, () -> new Solution().minCut("aab"));
        run("single char", 0, () -> new Solution().minCut("a"));
        run("whole palindrome", 0, () -> new Solution().minCut("noon"));
        run("leet", 2, () -> new Solution().minCut("leet"));
        run("all distinct", 4, () -> new Solution().minCut("abcde"));
        run("aa + bbcbb", 1, () -> new Solution().minCut("aabbcbb"));
        run("banana", 1, () -> new Solution().minCut("banana"));
        run("long 2000 chars", 1, () -> new Solution().minCut(repeat("ab", 1000)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần trả về chính các đoạn palindrome (không chỉ số lần cắt) thì lưu thêm gì để truy vết?', 'Làm sao giảm bộ nhớ xuống O(n) bằng expand-around-center?']
},
{
  id: 'algo-131',
  title: 'Longest Palindromic Subsequence',
  difficulty: 'medium',
  pattern: 'Dynamic Programming',
  tags: ['string', 'palindrome', 'dp', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Tìm độ dài **dãy con** (subsequence) dài nhất là palindrome. Dãy con được tạo bằng cách **xoá bớt** một số ký tự (có thể không xoá) và giữ nguyên thứ tự các ký tự còn lại, nên **không cần liên tiếp**.

### Ví dụ
~~~text
Input:  s = "bbbab"
Output: 4
Giải thích: xoá chữ "a" được "bbbb".

Input:  s = "cbbd"
Output: 2
Giải thích: "bb".
~~~

### Ràng buộc
- {{1 <= s.length <= 1000}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Gọi {{dp[i][j]}} = độ dài dãy con palindrome dài nhất trong đoạn {{s[i..j]}}. Đáp án là {{dp[0][n-1]}}; mỗi ký tự đơn có {{dp[i][i] = 1}}.',
    'Xét hai đầu {{s[i]}} và {{s[j]}}. Nếu bằng nhau: cả hai làm hai đầu của palindrome → {{dp[i][j] = dp[i+1][j-1] + 2}}. Nếu khác: ít nhất một đầu bị bỏ → {{max(dp[i+1][j], dp[i][j-1])}}.',
    '{{dp[i][j]}} cần các đoạn ngắn hơn bên trong, nên duyệt {{i}} từ n-1 **giảm dần** và {{j}} từ i+1 **tăng dần**.'
  ],
  solution: `### Ý tưởng
Phân biệt hai khái niệm: **chuỗi con** (substring) phải liên tiếp; **dãy con** (subsequence) được bỏ qua ký tự. Với dãy con, ta quyết định ở hai đầu đoạn:
- {{s[i] == s[j]}}: dùng cả hai làm cặp ngoài cùng, phần giữa lấy tốt nhất của {{s[i+1..j-1]}} → {{dp[i+1][j-1] + 2}}.
- {{s[i] != s[j]}}: hai ký tự này không thể cùng là cặp ngoài cùng, nên bỏ một trong hai → {{max(dp[i+1][j], dp[i][j-1])}}.

~~~java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];           // dp[i][j] = LPS cua s[i..j]
        for (int i = n - 1; i >= 0; i--) {    // i giam dan: dp[i+1][..] da co
            dp[i][i] = 1;                     // mot ky tu
            for (int j = i + 1; j < n; j++) { // j tang dan: dp[i][j-1] da co
                if (s.charAt(i) == s.charAt(j)) {
                    dp[i][j] = dp[i + 1][j - 1] + 2;   // hai dau ghep thanh cap
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]); // bo mot dau
                }
            }
        }
        return dp[0][n - 1];
    }
}
~~~
Khi {{j = i + 1}} và hai ký tự bằng nhau, {{dp[i+1][j-1]}} là {{dp[i+1][i]}}: ô "đoạn rỗng" có giá trị mặc định 0, nên kết quả 2 là đúng.

### Chạy tay với "cbbd"
| | c | b | b | d |
|---|---|---|---|---|
| c | 1 | 1 | 2 | 2 |
| b | | 1 | 2 | 2 |
| b | | | 1 | 1 |
| d | | | | 1 |
Ô (1,2) "bb": hai đầu bằng nhau → 0 + 2 = 2. Ô (0,3) "cbbd": c ≠ d → max(dp[1][3], dp[0][2]) = 2.

### Độ phức tạp
O(n²) thời gian (n = 1000 → 5·10^5 ô), O(n²) bộ nhớ (4 MB với int). Có thể giảm còn O(n) vì hàng i chỉ cần hàng i + 1.

### Lưu ý khi phỏng vấn
- Mẹo nhận diện: LPS của s = **LCS** (dãy con chung dài nhất) của s và chuỗi đảo ngược của s.
- Đừng nhầm với Longest Palindromic Substring (algo-128): substring yêu cầu liên tiếp nên dùng mở rộng từ tâm.
- Hệ quả hay được hỏi: số ký tự ít nhất cần xoá để s thành palindrome = {{n - LPS}}.

> Senior tip: DP trên đoạn {{[i..j]}} (interval DP) có khuôn chung: trạng thái là một đoạn, quyết định ở hai đầu, duyệt theo độ dài tăng dần. Nắm khuôn này thì các bài như Burst Balloons hay Matrix Chain Multiplication không còn xa lạ.`,
  complexity: 'Time O(n^2), Space O(n^2)',
  starter: 'class Solution {\n    public int longestPalindromeSubseq(String s) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("bbbab", 4, () -> new Solution().longestPalindromeSubseq("bbbab"));
        run("cbbd", 2, () -> new Solution().longestPalindromeSubseq("cbbd"));
        run("single", 1, () -> new Solution().longestPalindromeSubseq("a"));
        run("all same", 5, () -> new Solution().longestPalindromeSubseq("aaaaa"));
        run("two distinct", 1, () -> new Solution().longestPalindromeSubseq("ab"));
        run("non-contiguous", 5, () -> new Solution().longestPalindromeSubseq("agbdba"));
        run("character", 5, () -> new Solution().longestPalindromeSubseq("character"));
        run("large alternating 1000", 999, () -> {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 500; i++) sb.append("ab");
            return new Solution().longestPalindromeSubseq(sb.toString());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Truy vết bảng dp để in ra chính dãy con palindrome thế nào?', 'Giảm bộ nhớ xuống O(n) bằng cách nào?']
},
{
  id: 'algo-132',
  title: 'Gas Station',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['array', 'greedy', 'gas-station', 'bytebytego'],
  prompt: `Có {{n}} trạm xăng xếp trên một **vòng tròn**. Trạm {{i}} cho bạn {{gas[i]}} lít xăng; đi từ trạm {{i}} sang trạm {{(i + 1) % n}} tốn {{cost[i]}} lít. Xe xuất phát với bình **rỗng** tại một trạm bạn chọn, bình chứa không giới hạn. Trả về chỉ số trạm xuất phát để đi **hết một vòng** quay lại trạm đó, hoặc {{-1}} nếu không thể. Đề đảm bảo nếu có đáp án thì đáp án là **duy nhất**.

### Ví dụ
~~~text
Input:  gas = [1,2,3,4,5], cost = [3,4,5,1,2]
Output: 3
Giải thích: xuất phát ở trạm 3: đổ 4 lít, đi tốn 1 → còn 3; trạm 4: +5 = 8, đi tốn 2 → 6;
trạm 0: +1 = 7, tốn 3 → 4; trạm 1: +2 = 6, tốn 4 → 2; trạm 2: +3 = 5, tốn 5 → 0. Về lại trạm 3.

Input:  gas = [2,3,4], cost = [3,4,3]
Output: -1
Giải thích: tổng xăng 9 < tổng chi phí 10, không trạm nào đi hết vòng được.
~~~

### Ràng buộc
- {{n == gas.length == cost.length}}
- {{1 <= n <= 10^5}}
- {{0 <= gas[i], cost[i] <= 10^4}}`,
  hints: [
    'Nếu tổng {{gas}} nhỏ hơn tổng {{cost}} thì chắc chắn không đi hết vòng được, dù xuất phát ở đâu.',
    'Giả sử xuất phát ở trạm {{start}} và lần đầu bình bị âm khi rời trạm {{i}}. Hãy chứng minh: xuất phát ở bất kỳ trạm nào giữa {{start}} và {{i}} cũng sẽ bị âm, không muộn hơn {{i}}.',
    'Vậy chỉ cần duyệt một lần: giữ {{tank}}; khi {{tank < 0}} thì đặt {{start = i + 1}} và reset {{tank = 0}}. Nếu tổng xăng ≥ tổng chi phí thì {{start}} cuối cùng là đáp án.'
  ],
  solution: `### Ý tưởng
Gọi {{diff[i] = gas[i] - cost[i]}}: lượng xăng "lời" (dương) hoặc "lỗ" (âm) khi đi qua trạm i.

**Quan sát 1:** nếu tổng tất cả {{diff}} < 0 thì đi hết vòng là không thể, vì cả vòng tiêu nhiều hơn số xăng nhận được.

**Quan sát 2 (mấu chốt):** xuất phát ở {{start}}, đi tới trạm {{i}} thì lần đầu bình âm. Mọi trạm {{k}} nằm giữa {{start}} và {{i}} đều không thể là điểm xuất phát. Vì sao? Khi xe từ {{start}} đến {{k}}, bình luôn ≥ 0 (chưa âm lần nào). Xuất phát thẳng từ {{k}} nghĩa là bỏ đi phần xăng ≥ 0 đó, nên bình chỉ có thể ít hơn hoặc bằng, và chắc chắn cũng âm tại {{i}}. Do đó ta nhảy luôn {{start}} tới {{i + 1}}, không cần thử lại các trạm ở giữa.

**Quan sát 3:** nếu tổng ≥ 0 thì {{start}} cuối cùng chắc chắn đi hết vòng: phần từ {{start}} tới cuối mảng không âm, và phần đầu mảng (các đoạn đã bị "lỗ") được bù bằng tổng dương.

~~~java
class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0;  // tong (gas - cost) cua ca vong
        int tank = 0;   // xang trong binh tinh tu diem xuat phat hien tai
        int start = 0;  // ung vien diem xuat phat
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) {        // tu start khong toi duoc tram i + 1
                start = i + 1;     // moi tram trong [start, i] deu bi loai
                tank = 0;          // xuat phat lai voi binh rong
            }
        }
        return total < 0 ? -1 : start; // tong am: khong co dap an
    }
}
~~~

### Chạy tay với ví dụ 1
{{diff = [-2, -2, -2, 3, 3]}}, tổng = 0 ≥ 0.
- i = 0: tank = -2 < 0 → start = 1, tank = 0.
- i = 1: tank = -2 → start = 2, tank = 0.
- i = 2: tank = -2 → start = 3, tank = 0.
- i = 3: tank = 3. i = 4: tank = 6.
Kết quả: start = 3.

### Độ phức tạp
Một vòng lặp qua n trạm → O(n) thời gian, O(1) bộ nhớ. Cách ngây thơ "thử từng trạm rồi mô phỏng cả vòng" là O(n²).

### Lưu ý khi phỏng vấn
- {{start}} có thể bằng {{n}} sau vòng lặp (khi trạm cuối cũng bị âm), nhưng khi đó tổng chắc chắn âm nên ta đã trả {{-1}}.
- Tổng tối đa 10^5 × 10^4 = 10^9, vẫn vừa {{int}}; nếu giới hạn lớn hơn thì đổi sang {{long}}.
- Hãy nói rõ hai lập luận (tổng âm → -1; bỏ qua cả đoạn khi tank âm). Interviewer thường hỏi "vì sao được bỏ qua các trạm ở giữa?".

> Senior tip: Mẫu "cộng dồn, khi âm thì reset" xuất hiện ở nhiều bài (Kadane cho Maximum Subarray cũng vậy). Nhận ra cùng một khuôn giúp bạn giải nhanh và giải thích tự tin hơn.`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        // TODO\n        return -1;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", 3, () -> new Solution().canCompleteCircuit(new int[]{1, 2, 3, 4, 5}, new int[]{3, 4, 5, 1, 2}));
        run("impossible", -1, () -> new Solution().canCompleteCircuit(new int[]{2, 3, 4}, new int[]{3, 4, 3}));
        run("single ok", 0, () -> new Solution().canCompleteCircuit(new int[]{5}, new int[]{4}));
        run("single exact", 0, () -> new Solution().canCompleteCircuit(new int[]{2}, new int[]{2}));
        run("single fail", -1, () -> new Solution().canCompleteCircuit(new int[]{3}, new int[]{4}));
        run("start zero", 0, () -> new Solution().canCompleteCircuit(new int[]{3, 1, 1}, new int[]{1, 2, 2}));
        run("start near end", 4, () -> new Solution().canCompleteCircuit(new int[]{5, 1, 2, 3, 4}, new int[]{4, 4, 1, 5, 1}));
        run("large only last works", 9999, () -> {
            int n = 10000;
            int[] gas = new int[n], cost = new int[n];
            for (int i = 0; i < n - 1; i++) { gas[i] = 0; cost[i] = 1; }
            gas[n - 1] = n - 1; cost[n - 1] = 0;
            return new Solution().canCompleteCircuit(gas, cost);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu đề không đảm bảo đáp án duy nhất và cần liệt kê mọi trạm xuất phát hợp lệ thì làm thế nào trong O(n)?', 'Nếu bình xăng có dung tích tối đa C thì thuật toán thay đổi ra sao?']
},
{
  id: 'algo-133',
  title: 'Partition Labels',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['string', 'greedy', 'intervals', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Chia {{s}} thành **nhiều đoạn nhất có thể** sao cho mỗi chữ cái chỉ xuất hiện trong **đúng một** đoạn. Ghép các đoạn theo thứ tự phải được lại đúng {{s}}. Trả về danh sách độ dài các đoạn theo thứ tự.

### Ví dụ
~~~text
Input:  s = "ababcbacadefegdehijhklij"
Output: [9, 7, 8]
Giải thích: "ababcbaca" | "defegde" | "hijhklij".
Cách chia "ababcbacadefegde" | "hijhklij" cũng hợp lệ nhưng ít đoạn hơn.

Input:  s = "eccbbbbdec"
Output: [10]
~~~

### Ràng buộc
- {{1 <= s.length <= 500}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Nếu chữ {{c}} nằm trong một đoạn thì đoạn đó phải kéo dài tới **lần xuất hiện cuối cùng** của {{c}}. Hãy ghi lại vị trí cuối của từng chữ cái trước.',
    'Duyệt từ trái sang phải, giữ {{end}} = vị trí xa nhất mà đoạn hiện tại bắt buộc phải kéo tới. Mỗi ký tự mới có thể đẩy {{end}} ra xa hơn.',
    'Khi chỉ số {{i}} đúng bằng {{end}}, mọi chữ cái trong đoạn đã xuất hiện lần cuối: đóng đoạn tại đây (càng đóng sớm càng được nhiều đoạn).'
  ],
  solution: `### Ý tưởng
Mỗi chữ cái tạo ra một "khoảng" từ lần xuất hiện đầu tiên tới lần cuối. Hai chữ có khoảng chồng nhau bắt buộc nằm chung một đoạn. Vậy đáp án chính là: gộp các khoảng chồng nhau lại, mỗi khối sau khi gộp là một đoạn.

Cách làm không cần tạo khoảng tường minh:
1. Duyệt một lần, lưu {{last[c]}} = chỉ số cuối cùng của chữ {{c}}.
2. Duyệt lần hai với {{start}} (đầu đoạn hiện tại) và {{end}} (đoạn phải kéo tới đâu). Gặp ký tự {{s[i]}} thì {{end = max(end, last[s[i]])}}.
3. Khi {{i == end}}: không còn chữ nào trong đoạn xuất hiện ở phía sau → đóng đoạn, ghi độ dài {{end - start + 1}}, bắt đầu đoạn mới ở {{i + 1}}.

Vì sao tham lam (đóng đoạn sớm nhất) cho **nhiều đoạn nhất**? Vị trí {{end}} là điểm sớm nhất có thể đóng đoạn hợp lệ; đóng muộn hơn chỉ gộp thêm ký tự vào đoạn, không bao giờ làm tăng số đoạn.

~~~java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];                 // last[c] = vi tri cuoi cung cua chu c
        for (int i = 0; i < s.length(); i++) {
            last[s.charAt(i) - 'a'] = i;
        }
        List<Integer> sizes = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']); // doan phai keo toi it nhat day
            if (i == end) {                        // moi chu trong doan da het
                sizes.add(end - start + 1);
                start = i + 1;                     // doan moi bat dau ngay sau
            }
        }
        return sizes;
    }
}
~~~

### Chạy tay với s = "abaccbdeffed"
{{last}}: a=2, b=5, c=4, d=11, e=10, f=9.
- i=0 'a' → end=2; i=1 'b' → end=5; i=2..4 không đổi; i=5 'b', i == end → đoạn [0..5] dài 6.
- i=6 'd' → end=11; ... i=11 == end → đoạn [6..11] dài 6.
Kết quả [6, 6].

### Độ phức tạp
Hai lần duyệt → O(n) thời gian. Mảng {{last}} 26 phần tử → O(1) bộ nhớ phụ (không tính kết quả).

### Lưu ý khi phỏng vấn
- Nếu bảng chữ cái không cố định (Unicode) thì dùng {{HashMap<Character, Integer>}} thay cho mảng 26.
- Liên hệ được với bài Merge Intervals là điểm cộng: đây chính là gộp khoảng nhưng tận dụng được việc các khoảng đã "tự sắp xếp" theo vị trí đầu.

> Senior tip: Kỹ thuật "tính trước vị trí xuất hiện cuối" cũng dùng khi chia batch dữ liệu sao cho các bản ghi cùng key không bị tách sang hai batch (ví dụ khi chia file log theo session).`,
  complexity: 'Time O(n), Space O(1)',
  starter: 'class Solution {\n    public List<Integer> partitionLabels(String s) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", Arrays.asList(9, 7, 8), () -> new Solution().partitionLabels("ababcbacadefegdehijhklij"));
        run("one block", Arrays.asList(10), () -> new Solution().partitionLabels("eccbbbbdec"));
        run("single char", Arrays.asList(1), () -> new Solution().partitionLabels("z"));
        run("all same", Arrays.asList(3), () -> new Solution().partitionLabels("aaa"));
        run("all distinct", Arrays.asList(1, 1, 1), () -> new Solution().partitionLabels("abc"));
        run("interleaved", Arrays.asList(4), () -> new Solution().partitionLabels("abab"));
        run("two blocks", Arrays.asList(6, 6), () -> new Solution().partitionLabels("abaccbdeffed"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu thêm điều kiện mỗi đoạn dài tối đa K ký tự (có thể không có lời giải) thì xử lý thế nào?', 'Nếu chuỗi là một stream rất dài không đọc lại được thì có làm được trong một lần duyệt không?']
},
{
  id: 'algo-134',
  title: 'Minimum Number of Arrows to Burst Balloons',
  difficulty: 'medium',
  pattern: 'Greedy',
  tags: ['array', 'greedy', 'intervals', 'bytebytego'],
  prompt: `Có nhiều quả bóng bay dán trên một bức tường phẳng. Quả bóng thứ {{i}} được mô tả bằng đoạn ngang {{points[i] = [xStart, xEnd]}}. Một mũi tên bắn thẳng đứng tại hoành độ {{x}} sẽ làm nổ **mọi** quả bóng có {{xStart <= x <= xEnd}} (kể cả chạm đúng mép). Tìm **số mũi tên ít nhất** để làm nổ tất cả bóng.

### Ví dụ
~~~text
Input:  points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Giải thích: bắn tại x = 6 làm nổ [2,8] và [1,6]; bắn tại x = 11 làm nổ [10,16] và [7,12].

Input:  points = [[1,2],[3,4],[5,6],[7,8]]
Output: 4

Input:  points = [[1,2],[2,3],[3,4],[4,5]]
Output: 2
Giải thích: bắn tại x = 2 (nổ [1,2],[2,3]) và x = 4 (nổ [3,4],[4,5]).
~~~

### Ràng buộc
- {{1 <= points.length <= 10^5}}
- {{points[i].length == 2}}
- {{-2^31 <= xStart < xEnd <= 2^31 - 1}}`,
  hints: [
    'Xét quả bóng có **mép phải nhỏ nhất**. Chắc chắn phải có một mũi tên bắn tại vị trí ≤ mép phải đó. Bắn ở đâu thì có lợi nhất?',
    'Bắn đúng tại mép phải đó: mũi tên vẫn làm nổ quả bóng này, và nằm xa nhất về bên phải nên trúng được nhiều quả khác nhất.',
    'Sắp xếp theo {{xEnd}} tăng dần. Giữ vị trí mũi tên vừa bắn; quả bóng tiếp theo có {{xStart}} lớn hơn vị trí đó thì cần một mũi tên mới. Cẩn thận overflow khi so sánh.'
  ],
  solution: `### Ý tưởng
Tham lam theo mép phải:
1. Sắp xếp các quả bóng theo {{xEnd}} tăng dần.
2. Bắn mũi tên đầu tiên tại {{xEnd}} của quả bóng đầu tiên.
3. Duyệt các quả tiếp theo. Nếu {{xStart <= arrow}} thì quả này đã nổ (vì {{xEnd}} của nó ≥ {{arrow}} do đã sắp xếp, nên {{arrow}} nằm trong đoạn). Ngược lại cần mũi tên mới tại {{xEnd}} của quả này.

**Vì sao đúng?** Quả có mép phải nhỏ nhất bắt buộc phải bị bắn ở một điểm ≤ mép phải của nó. Đẩy điểm bắn sang phải hết mức (đúng mép phải) không làm mất quả nào mà mũi tên cũ trúng được, chỉ có thể trúng thêm. Lặp lại lập luận cho phần còn lại.

~~~java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        // Integer.compare: KHONG dung a[1] - b[1] vi co the tran so voi gia tri gan +-2^31
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowX = points[0][1];        // ban tai mep phai cua qua dau tien
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowX) {  // mui ten cu nam ben trai qua bong nay
                arrows++;
                arrowX = points[i][1];    // ban mui moi tai mep phai qua nay
            }
            // nguoc lai: xStart <= arrowX <= xEnd, qua bong da no
        }
        return arrows;
    }
}
~~~

### Chạy tay với ví dụ 1
Sau sắp xếp theo {{xEnd}}: [1,6], [2,8], [7,12], [10,16].
- Mũi tên 1 tại x = 6. [2,8]: 2 ≤ 6 → nổ. [7,12]: 7 > 6 → mũi tên 2 tại 12. [10,16]: 10 ≤ 12 → nổ.
Kết quả 2.

### Độ phức tạp
Sắp xếp O(n log n), duyệt O(n). Bộ nhớ O(log n) cho sắp xếp (TimSort trên mảng object có thể tới O(n)).

### Lưu ý khi phỏng vấn
- **Bẫy overflow:** comparator {{a[1] - b[1]}} sai khi một số gần {{2^31 - 1}} và số kia gần {{-2^31}} (hiệu vượt phạm vi int, đổi dấu). Luôn dùng {{Integer.compare}}.
- Bóng chạm nhau ở mép ({{[1,2]}} và {{[2,3]}}) bị một mũi tên làm nổ, nên điều kiện là {{>}} chứ không phải {{>=}}.
- Bài này tương đương "số điểm ít nhất đâm xuyên mọi đoạn", họ hàng với Non-overlapping Intervals: số mũi tên = số đoạn không giao nhau tối đa.

> Senior tip: Lỗi comparator dạng {{a - b}} đã gây bug thật trên production khi dữ liệu là timestamp hoặc ID lớn. Code review nên bắt lỗi này ngay.`,
  complexity: 'Time O(n log n), Space O(log n)',
  starter: 'class Solution {\n    public int findMinArrowShots(int[][] points) {\n        // TODO\n        return 0;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    public static void main(String[] args) {
        run("example", 2, () -> new Solution().findMinArrowShots(new int[][]{{10, 16}, {2, 8}, {1, 6}, {7, 12}}));
        run("disjoint", 4, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}, {3, 4}, {5, 6}, {7, 8}}));
        run("chain touching", 2, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}, {2, 3}, {3, 4}, {4, 5}}));
        run("single", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}}));
        run("big contains two disjoint", 2, () -> new Solution().findMinArrowShots(new int[][]{{1, 10}, {2, 3}, {4, 5}}));
        run("fully nested", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 10}, {2, 5}, {3, 4}}));
        run("touching edge", 1, () -> new Solution().findMinArrowShots(new int[][]{{1, 2}, {2, 3}}));
        run("int extremes", 2, () -> new Solution().findMinArrowShots(new int[][]{{2147483646, 2147483647}, {-2147483648, -2147483647}}));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Làm sao trả về danh sách toạ độ các mũi tên thay vì chỉ số lượng?', 'Liên hệ bài này với Non-overlapping Intervals thế nào?']
},
{
  id: 'algo-135',
  title: 'N-Queens',
  difficulty: 'hard',
  pattern: 'Backtracking',
  tags: ['backtracking', 'chess', 'search', 'bytebytego'],
  prompt: `Đặt {{n}} quân hậu lên bàn cờ {{n x n}} sao cho không có hai quân nào ăn được nhau (hậu ăn theo hàng ngang, hàng dọc và cả hai đường chéo). Trả về **tất cả** cách đặt; mỗi cách là danh sách {{n}} chuỗi, chuỗi thứ i mô tả hàng i với {{'Q'}} là hậu và {{'.'}} là ô trống. Thứ tự các cách đặt không quan trọng.

### Ví dụ
~~~text
Input:  n = 4
Output: [[".Q..",     [["..Q.",
          "...Q",       "Q...",
          "Q...",       "...Q",
          "..Q."],      ".Q.."]]
Giải thích: bàn 4x4 có đúng 2 cách.

Input:  n = 1
Output: [["Q"]]
~~~

### Ràng buộc
- {{1 <= n <= 9}}`,
  hints: [
    'Mỗi hàng có **đúng một** hậu (hai hậu cùng hàng sẽ ăn nhau). Vậy đặt lần lượt theo từng hàng, mỗi hàng chọn một cột.',
    'Để biết ô {{(row, col)}} có bị ăn không trong O(1): đánh dấu cột đã dùng; đường chéo "\\" có {{row - col}} không đổi; đường chéo "/" có {{row + col}} không đổi.',
    'Dùng ba mảng boolean {{cols[n]}}, {{diag[2n-1]}} (chỉ số {{row - col + n - 1}} để không âm), {{anti[2n-1]}} (chỉ số {{row + col}}). Đặt hậu → đánh dấu → đệ quy hàng sau → gỡ đánh dấu.'
  ],
  solution: `### Ý tưởng
Backtracking theo hàng: ở hàng {{row}}, thử từng cột {{col}}. Nếu ô an toàn thì đặt hậu, đánh dấu, rồi xử lý hàng {{row + 1}}. Đặt đủ n hàng → ghi nhận một lời giải. Quay lui thì gỡ đánh dấu để thử cột khác.

**Nhận diện đường chéo trong O(1):**
~~~text
row - col (chéo "\\")      row + col (chéo "/")
 0 -1 -2 -3                 0  1  2  3
 1  0 -1 -2                 1  2  3  4
 2  1  0 -1                 2  3  4  5
 3  2  1  0                 3  4  5  6
~~~
Các ô trên cùng một đường chéo "\\" có cùng {{row - col}}; cộng thêm {{n - 1}} để chỉ số không âm. Các ô trên cùng đường chéo "/" có cùng {{row + col}}.

~~~java
class Solution {
    private int n;
    private boolean[] cols, diag, anti;     // cot / cheo "\\" / cheo "/" da co hau
    private int[] queenCol;                 // queenCol[row] = cot dat hau o hang row
    private List<List<String>> result;

    public List<List<String>> solveNQueens(int n) {
        this.n = n;
        cols = new boolean[n];
        diag = new boolean[2 * n - 1];
        anti = new boolean[2 * n - 1];
        queenCol = new int[n];
        result = new ArrayList<>();
        place(0);
        return result;
    }

    private void place(int row) {
        if (row == n) {                     // da dat du n hau
            result.add(board());
            return;
        }
        for (int col = 0; col < n; col++) {
            int d = row - col + n - 1, a = row + col;
            if (cols[col] || diag[d] || anti[a]) continue; // o bi an: cat nhanh
            cols[col] = diag[d] = anti[a] = true;          // dat hau
            queenCol[row] = col;
            place(row + 1);
            cols[col] = diag[d] = anti[a] = false;         // go hau (backtrack)
        }
    }

    private List<String> board() {
        List<String> rows = new ArrayList<>();
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[queenCol[r]] = 'Q';
            rows.add(new String(line));
        }
        return rows;
    }
}
~~~

### Độ phức tạp
- Thời gian: hàng đầu n lựa chọn, hàng sau tối đa n - 1... → cận trên O(n!), thực tế nhỏ hơn nhiều nhờ cắt tỉa đường chéo. Mỗi lời giải tốn thêm O(n²) để dựng bàn cờ.
- Bộ nhớ: O(n) cho các mảng đánh dấu và đệ quy (không tính kết quả).

### Lưu ý khi phỏng vấn
- Số lời giải: n = 1 → 1, 2 và 3 → 0, 4 → 2, 5 → 10, 6 → 4, 8 → 92, 9 → 352.
- N-Queens II chỉ cần **đếm**: bỏ phần dựng bàn cờ; có thể dùng bitmask cho cả ba tập để nhanh hơn nữa.
- Đừng biểu diễn bàn cờ bằng mảng 2D rồi quét hàng/cột/chéo mỗi lần kiểm tra: tốn O(n) mỗi lần thay vì O(1).

> Senior tip: N-Queens là bài mẫu của "constraint satisfaction": chọn biến (hàng), miền giá trị (cột), ràng buộc kiểm tra O(1) và cắt tỉa sớm. Cùng khuôn này dùng cho xếp lịch, phân ca, hay giải Sudoku.`,
  complexity: 'Time O(n!) cận trên, Space O(n)',
  starter: 'class Solution {\n    public List<List<String>> solveNQueens(int n) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // tra ve so loi giai neu tat ca hop le va khong trung; nguoc lai mo ta loi
    static Object verify(int n, List<List<String>> sols) {
        Set<List<String>> seen = new HashSet<>();
        for (List<String> b : sols) {
            if (!seen.add(b)) return "duplicate solution " + b;
            if (b.size() != n) return "board has " + b.size() + " rows";
            int[] qc = new int[n];
            for (int r = 0; r < n; r++) {
                String row = b.get(r);
                if (row.length() != n || row.replace(".", "").length() != 1 || row.indexOf('Q') < 0) return "bad row " + row;
                qc[r] = row.indexOf('Q');
            }
            for (int r1 = 0; r1 < n; r1++)
                for (int r2 = r1 + 1; r2 < n; r2++)
                    if (qc[r1] == qc[r2] || Math.abs(qc[r1] - qc[r2]) == r2 - r1) return "queens attack in " + b;
        }
        return sols.size();
    }
    public static void main(String[] args) {
        run("n=4 exact boards", new HashSet<>(Arrays.asList(Arrays.asList(".Q..", "...Q", "Q...", "..Q."), Arrays.asList("..Q.", "Q...", "...Q", ".Q.."))),
            () -> new HashSet<>(new Solution().solveNQueens(4)));
        run("n=1", Arrays.asList(Arrays.asList("Q")), () -> new Solution().solveNQueens(1));
        run("n=2 none", 0, () -> verify(2, new Solution().solveNQueens(2)));
        run("n=3 none", 0, () -> verify(3, new Solution().solveNQueens(3)));
        run("n=5", 10, () -> verify(5, new Solution().solveNQueens(5)));
        run("n=6", 4, () -> verify(6, new Solution().solveNQueens(6)));
        run("n=8", 92, () -> verify(8, new Solution().solveNQueens(8)));
        run("n=9", 352, () -> verify(9, new Solution().solveNQueens(9)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu chỉ cần đếm số lời giải (N-Queens II) thì tối ưu bằng bitmask thế nào?', 'Tận dụng tính đối xứng của bàn cờ để giảm một nửa thời gian ra sao?']
},
{
  id: 'algo-136',
  title: 'Word Search',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'matrix', 'dfs', 'bytebytego'],
  prompt: `Cho bảng ký tự {{board}} kích thước {{m x n}} và chuỗi {{word}}. Kiểm tra có thể ghép được {{word}} từ các ô **kề cạnh** liên tiếp (trên/dưới/trái/phải) hay không, mỗi ô dùng **không quá một lần** trong cùng một lần ghép.

### Ví dụ
~~~text
board = [["A","B","C","E"],
         ["S","F","C","S"],
         ["A","D","E","E"]]

word = "ABCCED" → true   (A → B → C → C → E → D)
word = "SEE"    → true
word = "ABCB"   → false  (muốn quay lại "B" phải dùng ô đó hai lần)
~~~

### Ràng buộc
- {{1 <= m, n <= 6}}
- {{1 <= word.length <= 15}}
- {{board}} và {{word}} chỉ gồm chữ cái tiếng Anh (phân biệt hoa thường).`,
  hints: [
    'Thử bắt đầu từ mọi ô. Từ một ô, DFS sang 4 ô kề để khớp ký tự tiếp theo của {{word}}.',
    'Hàm {{dfs(r, c, k)}}: ô {{(r, c)}} phải khớp {{word[k]}}. Nếu {{k}} là ký tự cuối → tìm thấy. Ngược lại thử 4 hướng với {{k + 1}}.',
    'Để không dùng lại ô trên **đường đi hiện tại**, tạm ghi đè ô bằng ký tự đặc biệt (ví dụ {{\'#\'}}) trước khi đi tiếp, và **trả lại** ký tự cũ khi quay lui, để các đường đi khác vẫn dùng được ô đó.'
  ],
  solution: `### Ý tưởng
Backtracking (DFS có quay lui) trên lưới:
1. Với mỗi ô của bảng, thử xem {{word}} có bắt đầu ở đó không.
2. {{dfs(r, c, k)}}: kiểm tra ô nằm trong bảng và {{board[r][c] == word[k]}}. Sai → false.
3. Nếu {{k == word.length() - 1}} → đã khớp hết → true.
4. Đánh dấu ô bằng {{'#'}}, thử 4 hướng với {{k + 1}}, rồi **khôi phục** ký tự gốc.

Vì sao phải khôi phục? Ô bị đánh dấu chỉ "bận" đối với **đường đi hiện tại**. Khi quay lui để thử nhánh khác (hoặc điểm bắt đầu khác), ô đó lại hợp lệ.

~~~java
class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (dfs(board, word, r, c, 0)) return true;  // thu moi diem bat dau
        return false;
    }

    // o (r, c) co khop word[k] va tu do ghep tiep duoc phan con lai khong
    private boolean dfs(char[][] board, String word, int r, int c, int k) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(k)) return false;  // ky tu khong khop (hoac o dang ban '#')
        if (k == word.length() - 1) return true;          // da khop ky tu cuoi
        char saved = board[r][c];
        board[r][c] = '#';                                 // danh dau: o dang nam tren duong di
        boolean found = false;
        for (int[] d : DIRS) {
            if (dfs(board, word, r + d[0], c + d[1], k + 1)) { found = true; break; }
        }
        board[r][c] = saved;                               // khoi phuc cho cac nhanh khac
        return found;
    }
}
~~~

### Độ phức tạp
- Có m·n điểm bắt đầu; từ mỗi điểm, bước đầu có 4 hướng, các bước sau tối đa 3 hướng (không quay lại ô vừa đi) → O(m·n·3^L) với L = độ dài {{word}}.
- Bộ nhớ O(L) cho đệ quy (đánh dấu tại chỗ, không cần mảng {{visited}}).

### Lưu ý khi phỏng vấn
- Khôi phục ô **trước khi return**, kể cả khi đã tìm thấy, để không làm hỏng {{board}} của người gọi.
- Cắt tỉa hay được khen: nếu {{word}} dài hơn {{m·n}}, hoặc bảng không đủ số lượng một ký tự nào đó trong {{word}} → false ngay. Có thể đảo ngược {{word}} nếu ký tự cuối hiếm hơn ký tự đầu để giảm số điểm bắt đầu.
- Tìm **nhiều** từ cùng lúc thì chuyển sang Word Search II (algo-114) với Trie.

> Senior tip: Kỹ thuật "đánh dấu tạm, khôi phục khi quay lui" tiết kiệm bộ nhớ nhưng sửa dữ liệu dùng chung, nên không an toàn khi nhiều thread cùng đọc {{board}}. Trong code đa luồng, dùng mảng {{visited}} riêng cho mỗi lần tìm.`,
  complexity: 'Time O(m * n * 3^L), Space O(L) với L = word.length()',
  starter: 'class Solution {\n    public boolean exist(char[][] board, String word) {\n        // TODO\n        return false;\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    static char[][] example() { return new char[][]{{'A', 'B', 'C', 'E'}, {'S', 'F', 'C', 'S'}, {'A', 'D', 'E', 'E'}}; }
    public static void main(String[] args) {
        run("ABCCED", true, () -> new Solution().exist(example(), "ABCCED"));
        run("SEE", true, () -> new Solution().exist(example(), "SEE"));
        run("ABCB reuse", false, () -> new Solution().exist(example(), "ABCB"));
        run("single cell", true, () -> new Solution().exist(new char[][]{{'A'}}, "A"));
        run("single cell miss", false, () -> new Solution().exist(new char[][]{{'A'}}, "B"));
        run("cannot reuse cell", false, () -> new Solution().exist(new char[][]{{'A', 'A'}}, "AAA"));
        run("needs backtracking", true, () -> new Solution().exist(new char[][]{{'A', 'B', 'C', 'E'}, {'S', 'F', 'E', 'S'}, {'A', 'D', 'E', 'E'}}, "ABCESEEEFS"));
        run("case sensitive", false, () -> new Solution().exist(new char[][]{{'a', 'b'}}, "AB"));
        run("board restored", "[[A, B, C, E], [S, F, C, S], [A, D, E, E]]", () -> { char[][] b = example(); new Solution().exist(b, "ABCCED"); new Solution().exist(b, "XYZ"); return Arrays.deepToString(b); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu cần tìm nhiều từ cùng lúc thì vì sao nên dùng Trie (Word Search II)?', 'Những cách cắt tỉa nào giúp tránh trường hợp xấu như bảng toàn chữ A và word = "AAAAAAAAAAAAAB"?']
},
{
  id: 'algo-137',
  title: 'Palindrome Partitioning',
  difficulty: 'medium',
  pattern: 'Backtracking',
  tags: ['backtracking', 'string', 'partition', 'bytebytego'],
  prompt: `Cho chuỗi {{s}}. Liệt kê **tất cả** cách cắt {{s}} thành các đoạn liên tiếp sao cho mỗi đoạn đều là palindrome. Thứ tự các cách cắt trong kết quả không quan trọng.

### Ví dụ
~~~text
Input:  s = "aab"
Output: [["a","a","b"], ["aa","b"]]

Input:  s = "a"
Output: [["a"]]

Input:  s = "aba"
Output: [["a","b","a"], ["aba"]]
~~~

### Ràng buộc
- {{1 <= s.length <= 16}}
- {{s}} chỉ gồm chữ cái thường tiếng Anh.`,
  hints: [
    'Đứng ở vị trí {{start}}, đoạn tiếp theo là {{s[start..end]}} với {{end}} chạy từ {{start}} tới cuối. Chỉ đi tiếp khi đoạn đó là palindrome.',
    'Viết hàm đệ quy {{backtrack(start, path)}}: thêm đoạn vào {{path}}, gọi đệ quy từ {{end + 1}}, rồi **xoá đoạn vừa thêm** để thử {{end}} khác.',
    'Khi {{start == s.length()}} thì {{path}} là một cách cắt hoàn chỉnh: thêm một **bản sao** của {{path}} vào kết quả.'
  ],
  solution: `### Ý tưởng
Hãy tưởng tượng một cây quyết định: ở mỗi bước ta chọn "đoạn tiếp theo dài bao nhiêu". Mỗi đường đi từ gốc tới lá (đã dùng hết chuỗi) là một cách cắt. Backtracking chính là duyệt cây đó bằng đệ quy, và **cắt bỏ** nhánh ngay khi đoạn vừa chọn không phải palindrome.

Cây của {{"aab"}}:
~~~text
start=0: "a" ✔ → start=1: "a" ✔ → start=2: "b" ✔ → hết chuỗi: [a,a,b]
                           "ab" ✘ (bỏ nhánh)
         "aa" ✔ → start=2: "b" ✔ → hết chuỗi: [aa,b]
         "aab" ✘ (bỏ nhánh)
~~~

~~~java
class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    // path = cac doan da chon cho s[0..start-1]
    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {              // da cat het chuoi
            result.add(new ArrayList<>(path));  // PHAI copy: path con bi sua tiep
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (!isPalindrome(s, start, end)) continue; // cat tia nhanh khong hop le
            path.add(s.substring(start, end + 1));      // chon doan s[start..end]
            backtrack(s, end + 1, path, result);        // cat phan con lai
            path.remove(path.size() - 1);               // bo chon de thu end khac
        }
    }

    private boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) return false;
        }
        return true;
    }
}
~~~

### Vì sao phải copy path?
{{path}} là **một** đối tượng List dùng chung cho cả quá trình đệ quy. Nếu {{result.add(path)}} trực tiếp, mọi phần tử của {{result}} cùng trỏ tới một list, và cuối cùng list đó rỗng (vì đã bị {{remove}} hết). {{new ArrayList<>(path)}} chụp lại trạng thái ở thời điểm đó.

### Độ phức tạp
- Chuỗi dài n có n-1 chỗ có thể cắt → tối đa {{2^(n-1)}} cách cắt (ví dụ "aaaa...a"). Mỗi cách tốn O(n) để copy và kiểm tra palindrome → O(n · 2^n).
- Bộ nhớ đệ quy O(n) (không tính kết quả).

### Lưu ý khi phỏng vấn
- Tối ưu: tính trước bảng {{isPal[i][j]}} bằng DP (O(n²)) để mỗi lần kiểm tra chỉ O(1). Với n ≤ 16 thì cách đơn giản vẫn đủ nhanh, nhưng nên nhắc tới.
- Nếu chỉ cần **số lần cắt ít nhất** thì đây là bài khác (Palindrome Partitioning II), giải bằng DP O(n²), không cần liệt kê.

> Senior tip: Khi kết quả có thể tăng theo hàm mũ, hãy hỏi lại nhu cầu thật: cần liệt kê, cần đếm, hay chỉ cần một lời giải? Trả lời câu đó thường quyết định thuật toán.`,
  complexity: 'Time O(n * 2^n), Space O(n)',
  starter: 'class Solution {\n    public List<List<String>> partition(String s) {\n        // TODO\n        return new ArrayList<>();\n    }\n}',
  tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { Object get() throws Throwable; }
    static void run(String name, Object expected, Case c) {
        total++;
        try {
            Object actual = c.get();
            if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
        } catch (Throwable t) { System.out.println("FAIL " + name + ": threw " + t); }
    }
    // chuan hoa: thu tu cac cach cat khong quan trong
    static List<String> norm(List<List<String>> parts) {
        List<String> r = new ArrayList<>();
        for (List<String> p : parts) r.add(String.join("|", p));
        Collections.sort(r);
        return r;
    }
    static List<String> exp(String... rows) { List<String> r = new ArrayList<>(Arrays.asList(rows)); Collections.sort(r); return r; }
    public static void main(String[] args) {
        run("example aab", exp("a|a|b", "aa|b"), () -> norm(new Solution().partition("aab")));
        run("single", exp("a"), () -> norm(new Solution().partition("a")));
        run("two distinct", exp("a|b"), () -> norm(new Solution().partition("ab")));
        run("aaa", exp("a|a|a", "aa|a", "a|aa", "aaa"), () -> norm(new Solution().partition("aaa")));
        run("aba", exp("a|b|a", "aba"), () -> norm(new Solution().partition("aba")));
        run("abc", exp("a|b|c"), () -> norm(new Solution().partition("abc")));
        run("16 same chars count", 32768, () -> new Solution().partition("aaaaaaaaaaaaaaaa").size());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  follow: ['Nếu chỉ cần đếm số cách cắt thì có cách nào nhanh hơn liệt kê?', 'Tính trước bảng isPal bằng DP như thế nào và tiết kiệm được bao nhiêu?']
}
);
})();
