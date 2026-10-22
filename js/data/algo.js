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
}
);
