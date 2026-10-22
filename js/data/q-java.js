/* Topics: core, collections, modern — owner: task T1. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'core-001',
  topic: 'core',
  level: 'mid',
  q: 'Contract giữa {{equals()}} và {{hashCode()}} là gì? Vi phạm thì chuyện gì xảy ra?',
  a: `**Tóm tắt:** hai object {{equals()}} bằng nhau thì **bắt buộc** có cùng {{hashCode()}}; ngược lại không bắt buộc (cho phép collision).

### Contract
- **Reflexive / symmetric / transitive / consistent**, và {{x.equals(null) == false}}.
- {{a.equals(b)}} ⇒ {{a.hashCode() == b.hashCode()}}.
- {{hashCode()}} phải ổn định khi các field tham gia {{equals}} không đổi.

### Vi phạm thì sao
- Override {{equals}} mà quên {{hashCode}}: {{HashMap}}/{{HashSet}} đặt hai object "bằng nhau" vào hai bucket khác nhau ⇒ {{contains()}} trả về {{false}}, set chứa phần tử trùng.
- Dùng **mutable field** làm key rồi sửa sau khi {{put}} ⇒ key "mất tích" trong map, gây memory leak.

~~~java
record Point(int x, int y) {}          // record tự sinh equals/hashCode đúng contract

@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User u)) return false;
    return id.equals(u.id);
}
@Override public int hashCode() { return Objects.hash(id); }
~~~

> Senior tip: với JPA entity, đừng dùng id tự sinh trong {{hashCode}} (null trước khi persist) — dùng business key hoặc trả về hằng số theo class.`,
  follow: [
    'Vì sao {{hashCode}} trả về hằng số vẫn đúng contract nhưng là ý tưởng tồi?',
    'Implement {{equals}} cho class có kế thừa thế nào để không phá tính đối xứng?'
  ],
  tags: ['equals', 'hashCode', 'HashMap']
}
);
