# Dashboard, mục tiêu và chat nổi

## Dashboard

Reference: [https://dautoeic.com/](https://dautoeic.com/)

Dashboard có hero cá nhân hóa theo tên người học và câu nhắc “luyện tiếp thôi”. Các thẻ tổng quan:

- Điểm thi thử hiện tại: giảm/tăng 5 điểm hoặc nhập trực tiếp; ghi chú điểm có thể tự cập nhật sau khi làm đề.
- Điểm mục tiêu: giảm/tăng 5 điểm, preset 500/650/750/850/900.
- Điểm còn thiếu: hiển thị sau khi có điểm hiện tại và mục tiêu.
- Số ngày đến ngày thi: đặt ngày thi.
- Động lực học: streak hiện tại, streak dài nhất và XP trọn đời.

Bộ lọc thời gian: Hôm nay, Tuần, Tháng, Tất cả, Tùy chỉnh. Các activity card theo dõi thời gian học, Luyện đề, Đọc, Nghe, Nói, Viết, Từ vựng và Video.

Trong trạng thái quan sát, Nói và Viết hiển thị “Sắp ra/Đang phát triển” trên dashboard, dù route Writing `/write` đã có nội dung luyện Part 1/2. Đây là khác biệt cần lưu ý khi dựng lại.

## Mục tiêu hôm nay

Dashboard mặc định hiển thị 0/5 mục tiêu hoàn thành, với năm nhóm: Đọc, Nghe, Từ vựng, Luyện đề, Video. Mỗi nhóm có mục tiêu định lượng quan sát được:

- Đọc 0/30 câu
- Nghe 0/30 câu
- Từ vựng 0/20 từ
- Luyện đề 0/40 câu
- Video 0/2 bài

Nút “Cài đặt mục tiêu hằng ngày” là entry point để thay đổi mục tiêu.

## Chat nổi

Nút Chat ở góc dưới bên phải mở panel “Chat cộng đồng”, hiển thị số người online, tab Cộng đồng và Bạn bè, cùng ô nhập tin nhắn.

- Tab Cộng đồng hiển thị feed chat realtime/lịch sử, tên người dùng, thời gian, nội dung, reply và menu người dùng.
- Tin nhắn có thể chứa quote/reply; có nút Trả lời.
- Tab Bạn bè hiển thị counter dạng `BẠN BÈ (0 / 30)` ở tài khoản quan sát.
- Nút chat có thể kéo để đổi vị trí; tooltip ghi “Mở chat — giữ và kéo để đổi vị trí”.

Đây là kênh cộng đồng nhanh, khác với trang `/hoi-dap` có bài đăng, bộ lọc và bình luận dài.
