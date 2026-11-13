# T1579 — Kiến thức: 2 bài học (jpa) vào lessons-jpa.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`

Da them 2 bai hoc moi vao `js/data/lessons-jpa.js`:
- lesson-jpa-010 (order 10): Transaction va persistence context: flush, commit, detach. Bai tap mo phong Unit of Work (load, setName, flush, commit, detach, rollback), test 10 case, reference 10/10.
- lesson-jpa-011 (order 11): Optimistic locking voi @Version: chan lost update va retry. Bai tap mo phong Wallet.update/credit (version check, retry doc lai version, gioi han 3 lan), test 6 case, reference 6/6.

Da chay: node scripts/build-light-index.js, node scripts/validate.js -> OK, node scripts/test-lessons.js lesson-jpa-010 va lesson-jpa-011 -> reference pass 100%, starter co so va khong pass het. Khong commit.

## Notes
Them lesson-jpa-010 va lesson-jpa-011, related tuong tu gom jpa-002 va jpa-004 (id cau hỏi thuc trong q-spring-data.js).
Reviewed-by: kilo (T1579R)
