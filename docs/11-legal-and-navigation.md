# Pháp lý, footer và tương thích route

## Chính sách bảo mật

Reference: [https://dautoeic.com/chinh-sach-bao-mat](https://dautoeic.com/chinh-sach-bao-mat)

Cập nhật lần cuối 17/08/2026. Nội dung công bố các nhóm dữ liệu:

- tài khoản: email, tên, avatar;
- dữ liệu học: tiến độ, điểm, streak, XP, ghi chú, đánh dấu;
- nội dung người dùng: bài nói/viết chấm AI, bài đăng, bình luận, feedback, báo lỗi;
- thiết bị đăng nhập và mã định danh ẩn danh;
- mã đơn hàng/gói/số tiền/trạng thái thanh toán, không lưu số thẻ hay thông tin ngân hàng;
- log lỗi và thời điểm truy cập.

Mục đích gồm cá nhân hóa lộ trình, đồng bộ tiến độ, chấm AI, thanh toán/kích hoạt gói, chống gian lận và thống kê ẩn danh. Bên thứ ba có thể gồm hạ tầng lưu trữ, nhà cung cấp AI, cổng thanh toán và Google Login. Cookie/localStorage giữ phiên, theme và tiến độ tạm thời offline. Người dùng có quyền xem/sửa, yêu cầu xuất/xóa dữ liệu và khiếu nại; yêu cầu xóa xử lý trong 7 ngày làm việc sau khi xác minh. Dịch vụ dành cho người từ 13 tuổi; người dưới 16 tuổi nên có phụ huynh giám sát.

Liên hệ riêng tư: `dautoeicso1@gmail.com`.

## Điều khoản sử dụng

Reference: [https://dautoeic.com/dieu-khoan-su-dung](https://dautoeic.com/dieu-khoan-su-dung)

Cập nhật lần cuối 17/08/2026. Các nhóm quy định chính:

- một người/một tài khoản; không cho mượn, chia sẻ hoặc bán lại;
- giới hạn thiết bị và việc tự gỡ thiết bị có giới hạn;
- cấm sao chép/tải hàng loạt/phát tán nội dung, bot/crawler, dò lỗ hổng và nội dung cộng đồng vi phạm;
- vi phạm có thể bị khóa tính năng/tài khoản vĩnh viễn, không hoàn tiền;
- gói PRO/Premium và credits AI kích hoạt sau khi thanh toán xác nhận; credits có hạn, không đổi tiền mặt;
- hoàn tiền trong các trường hợp thanh toán trùng, đã trừ tiền nhưng chưa kích hoạt, hoặc lỗi kéo dài không khắc phục được; yêu cầu trong 7 ngày kèm mã đơn hàng;
- nội dung cộng đồng vẫn thuộc người dùng nhưng cấp quyền hiển thị/lưu trữ cho nền tảng; nội dung vi phạm có thể bị ẩn/xóa;
- điểm và nhận xét AI chỉ tham khảo, không phải kết quả thi chính thức;
- dịch vụ cung cấp “nguyên trạng”, chịu điều chỉnh theo pháp luật Việt Nam.

Liên hệ điều khoản: `dautoeicso1@gmail.com`.

## Footer contract

- Sản phẩm: `/grammar`, `/listening`, `/vocabulary`, `/mock-test`.
- Tài nguyên: `/blog`, `/video`, `/leaderboard`.
- Hỗ trợ: `/hub`, Facebook `facebook.com/dautoeic`.
- Pháp lý: `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`.
- Disclaimer: TOEIC/ETS là trademark của ETS; website không được ETS bảo trợ/phê duyệt.

## Route tương thích

- Mở [https://dautoeic.com/grammar](https://dautoeic.com/grammar) tự chuyển tới `/read?part=grammar`.
- Mở [https://dautoeic.com/listening](https://dautoeic.com/listening) tự chuyển tới `/listen?mode=type`.

Khi dựng lại nên giữ hai redirect này để các link footer/bookmark cũ không hỏng. Trong UI hiện có nav Nói và Viết; flow đích của hai nút chưa quan sát được trong phiên này.
