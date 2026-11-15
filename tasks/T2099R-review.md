# T2099R — Fact-check nội dung mới của T2099

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2099 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ 5 mục mới (testing-057…testing-061). Không có lỗi API bịa, không sai mặc định; các lỗi đã sửa:

- **testing-057**
  - Code mẫu adapter: JSON trong `withSuccess("{\"id\":…}")` bị escape thiếu (chỉ 1 dấu `\`), khi render ra Java sẽ vỡ chuỗi → sửa thành `{\\"id\\":…}`.
  - Pitfall "mock static (mockito-inline)": Mockito 5 đã mặc định inline mock maker, `mockito-inline` chỉ còn là artifact rỗng → ghi rõ `Mockito.mockStatic` + mặc định từ Mockito 5, và sửa cơ chế: rủi ro là stub rò sang test khác nếu không đóng mock bằng try-with-resources (không phải "static state không được reset").
  - Pitfall `@MockBean`: bỏ ý "phá context cache" (sai — `@MockitoBean` cũng là bean override nên cũng đổi context cache key); ghi đúng: deprecated từ Boot 3.4, `forRemoval`, sẽ bị xoá ở Spring Boot 4.0.
- **testing-059**
  - Bảng đồng bộ: "CyclicBarrier 1 người sẽ treo" sai (`new CyclicBarrier(1)` đi qua ngay) → "thiếu người tới barrier thì treo; phải có timeout".
  - Pitfall `@Version` + `save()` không flush: `OptimisticLockException` lúc commit vẫn bị `catch` quanh `txTemplate.execute` bắt được, nên "test không bắt được" là sai → sửa thành version chỉ tăng khi flush, assert ngay sau `save()` sẽ thấy version cũ và kết luận sai.
- **testing-061**
  - Số liệu không nhất quán: flake rate sau khi sửa ghi 1,4% trong khi bảng nêu mục tiêu "dưới 1%" → đổi 0,9%.
  - "5,5 giờ/tuần (82,5 giờ/tháng)" sai đơn vị (82,5 = 5,5 × 15 dev **mỗi tuần**) → "82,5 giờ/tuần cho cả team (khoảng 330 giờ/tháng)".
  - "chi phí đầu tư khoảng 140 giờ" không khớp kế hoạch đã nêu (2 dev × 2 tuần = 160 giờ + 10% × 15 dev × 4 tuần = 240 giờ) → 400 giờ; hoàn vốn 400/330 ≈ 1 tháng nên vẫn giữ "khoảng một tháng".
- **Đã kiểm tra và thấy ĐÚNG, không sửa:** H2 chỉ hỗ trợ `ON CONFLICT DO NOTHING` (chế độ PostgreSQL), không có `DO UPDATE` → bảng so sánh đúng; `@ServiceConnection` có từ Spring Boot 3.1; `max_connections` mặc định 100; JUnit 5 mặc định chạy tuần tự; `@MockitoBean` (Spring Framework 6.2) thay `@MockBean`; `MockRestServiceServer.bindTo(...).build()` + `header(...)` + `withSuccess(...)` đúng API; JSONAssert `NON_EXTENSIVE`; `@DataJpaTest` rollback còn `@SpringBootTest` thì không; `FilterRegistrationBean` không được MockMvc áp dụng.

**Nghiệm thu:** `node scripts/validate.js q-soft.js` → không có lỗi thuộc `js/data/q-soft.js`. Validate toàn repo còn 2 vấn đề **không thuộc task này**: `q-java.js` và `q-devops.js` đang lỗi cú pháp do task khác đang sửa dở, và `index-light.js: đã cũ` (build lại cũng fail vì `q-devops.js`; index chỉ lưu id/topic/level nên các sửa đổi chỉ-text ở đây không ảnh hưởng — index đã có sẵn testing-057…061). File này không có bài học nào nên không chạy `scripts/test-lessons.js`.
