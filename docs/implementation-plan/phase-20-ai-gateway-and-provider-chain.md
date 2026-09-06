# Phase 20 — Service AI dùng chung và chuỗi provider dự phòng

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Các tính năng sắp tới đều cần model: chấm Writing, sinh câu hỏi, giải thích đáp án. Nếu mỗi tính năng tự gọi thẳng một nhà cung cấp thì mỗi tính năng sẽ tự giữ một API key, tự viết retry, và một provider chết là tính năng đó chết. Đổi provider sẽ thành sửa code ở nhiều chỗ.

Phase này dựng **một cửa duy nhất**: tính năng mô tả việc cần làm, service lo chọn provider, xoay vòng khi lỗi, và giữ khoá.

## Scope delivered

### Service gọi model

`AiService.complete({ purpose, messages, maxTokens, temperature, json })` — người gọi **không** chọn provider, không cầm khoá, không tự retry.

Giao thức trên dây là `POST {baseUrl}/chat/completions` theo dạng OpenAI, vì gần như mọi gateway và runtime cục bộ đều nói được dạng này.

Trả về text, provider đã trả lời, và **toàn bộ danh sách lần thử** — kể cả những lần hỏng — để chỗ gọi có thể ghi log hoặc hiển thị mà không phải đoán.

### Ba loại hỏng, ba cách xử lý

Đây là phần quyết định chất lượng của chuỗi dự phòng. Gộp chung cả ba sẽ vừa tốn tiền vừa chậm:

| Tình huống | HTTP | Hành động |
| --- | --- | --- |
| Provider quá tải, rate limit, rớt kết nối | 408, 409, 425, 429, 5xx, lỗi mạng | `retry` — thử lại **chính provider đó** |
| Sai khoá, sai model, host chết | 401, 403, 404, 4xx khác | `failover` — bỏ qua, sang provider kế tiếp ngay, **không phí lượt retry** |
| Payload của chính chúng ta sai | 400, 422 | `fatal` — dừng hẳn, provider khác cũng sẽ từ chối y hệt |

Retry dùng exponential backoff có trần (250ms → 4s) nên một chuỗi lỗi không kéo request dài vô hạn.

### Cấu hình nhiều provider cùng lúc

Bảng `AiProvider`: tên, base URL, model, khoá đã mã hoá, bật/tắt, `priority` (unique), timeout, số lần retry, header phụ, cùng ba cột sức khoẻ (`health`, `lastLatencyMs`, `lastError`) ghi lại kết quả lần gọi gần nhất.

Chuỗi chạy theo `priority` tăng dần, bỏ qua provider đang tắt. Thêm provider mới luôn nằm **cuối** chuỗi — không tự chen lên trước một provider đang chạy tốt.

### Khoá không rời server

- Mã hoá AES-256-GCM bằng `AI_ENCRYPTION_KEY` (32 byte, hex hoặc base64) lấy từ môi trường. Khoá mã hoá nằm trong DB thì mã hoá vô nghĩa.
- **Không endpoint nào trả khoá về.** Console chỉ thấy 4 ký tự cuối (`••••3456`) — đủ để phân biệt hai khoá, không đủ để dùng.
- Audit log ghi việc *đã đổi khoá*, không ghi khoá.
- Thông báo lỗi của provider thường vọng lại request; mọi chuỗi lỗi được lọc qua `redactSecrets` trước khi lưu hay log, gồm cả khoá đã biết lẫn các chuỗi có dạng khoá.
- Giá trị `AI_ENCRYPTION_KEY` sai độ dài làm API **không khởi động được**, thay vì hỏng lúc admin bấm lưu.

### Console `/admin/ai`

Vai trò **ADMIN trở lên** — content editor không cần và không nên thấy thông tin thanh toán của bên thứ ba.

Danh sách hiện đúng thứ tự chuỗi: số thứ tự, model, base URL, 4 ký tự cuối của khoá, chip sức khoẻ, độ trễ và lỗi gần nhất. Hàng của provider đang lỗi **không** tô xanh như provider đang chạy — trạng thái đọc được bằng mắt, không chỉ bằng chữ.

Thao tác: lên/xuống thứ tự ưu tiên, bật/tắt, **Gọi thử** (một prompt rất ngắn, đủ phân biệt khoá đúng với khoá gõ nhầm), sửa, xoá. Sửa mà để trống ô khoá thì giữ nguyên khoá cũ.

Cảnh báo ở đầu trang nêu đúng một việc cần sửa tiếp theo: chưa có `AI_ENCRYPTION_KEY` → chưa có provider nào → tất cả đang tắt → chỉ có một provider nên không có dự phòng → cả chuỗi đang lỗi.

## Verification

Chạy thật, không phải mock:

**Chuỗi dự phòng qua socket thật.** Dựng hai HTTP server cục bộ — một luôn trả 503, một trả completion hợp lệ — đăng ký làm provider 1 và 2, rồi gọi `complete()`:

```
attempts: Fake down=503 → Fake down=503 → Fake standby=ok
```

Đúng như thiết kế: 503 là lỗi tạm thời nên provider 1 được thử lại một lần, sau đó mới sang provider 2.

**Provider thật.** Đăng ký cliproxy đang chạy trên máy (`http://localhost:8317/v1`, model `gpt-5.5`) và gọi một câu hỏi TOEIC thật — model trả lời đúng bằng tiếng Việt trong 2.8s. Sau đó đặt provider hỏng lên đầu chuỗi và gọi lại:

```
attempts: Fake down=503 → Fake down=503 → CLIProxy local=ok
```

**Khoá.** Truy vấn thẳng Postgres: `apiKeyCipher` bắt đầu bằng `v1.` và không dòng nào chứa chuỗi khoá gốc. Response tạo provider không có trường `apiKeyCipher`.

**Phân quyền.** Learner → 403, không đăng nhập → 401, admin → 200.

**Reorder.** Danh sách thiếu một provider → `PROVIDER_ORDER_MISMATCH`, không ghi gì.

**Giao diện.** 1440×900 và 390×844 (`visualViewport.width === documentElement.scrollWidth === body.scrollWidth`), không lỗi console.

## Test

- `secret-box.spec.ts` — round-trip, ciphertext khác nhau mỗi lần, payload bị sửa thì từ chối chứ không trả plaintext hỏng, khoá sai không đọc được, redaction.
- `failure-policy.spec.ts` — từng mã HTTP → hành động, thứ tự chọn provider, trần backoff.
- `ai.service.spec.ts` — 500 rồi sang provider 2; 429 thì retry cùng provider; 401 sang thẳng provider kế; 400 dừng hẳn không tiêu provider dự phòng; cả chuỗi hỏng → `AI_ALL_PROVIDERS_FAILED` kèm danh sách; khoá đi ở header chứ không ở body; khoá không lọt vào `lastError`.
- `ai-provider.service.spec.ts` — khoá lưu dạng mã hoá, audit không chứa khoá, sửa không kèm khoá thì giữ khoá cũ, reorder ghi hai lượt.
- `admin-authorization.spec.ts` — controller đứng sau `JwtAuthGuard` rồi `RolesGuard`, và **không** mở cho `CONTENT_EDITOR`.

## Kèm theo

Hai lỗi gặp trong lúc verify, sửa luôn:

- **Dropdown bị màn hình cắt.** `AppSelect` giờ tự lật lên trên khi không đủ chỗ bên dưới và giữ hướng xuống khi trường nằm gần đỉnh màn hình, đồng thời kẹp chiều cao theo khoảng trống thật nên menu không tràn ra ngoài ở cả hai phía. Vị trí tính lại khi cuộn hoặc đổi kích thước cửa sổ. Quy tắc nằm trong `utils/overlay.ts` để test được không cần trình duyệt.
- **Phiên hết hạn hiển thị sai.** Cookie token sống lâu hơn token bên trong nó, nên trang admin chào một phiên đã hết hạn bằng "bạn đang đăng nhập bằng ‹trống›". Trạng thái đăng nhập giờ tin cookie cho tới khi biết kết quả, sau đó tin hồ sơ; token bị server từ chối (401/403) thì xoá, còn lỗi mạng thì giữ.

## Còn lại

- Chưa có tính năng nào **dùng** service này — đó là việc của phase sau (chấm Writing là ứng viên rõ nhất).
- Chưa có hạn mức chi tiêu hay đếm token theo `purpose`; cột `usage` đã trả về sẵn nhưng chưa lưu.
- Provider không nói được dạng OpenAI (Anthropic messages, Gemini) cần thêm adapter ở `callProvider`.
