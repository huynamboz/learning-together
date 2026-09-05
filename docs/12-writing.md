# Luyện Writing

Reference: [https://dautoeic.com/write](https://dautoeic.com/write)

Trang giới thiệu “Rèn luyện TOEIC Writing từ câu đến bài luận”, tập trung vào dịch Việt–Anh, tạo thẻ từ vựng nhanh và bài mẫu.

## Danh sách bài

### Part 1 · Picture

- 47 bài ở trạng thái quan sát.
- Bộ lọc: All (47), N + N (20), V + N (18), N + Prep (2), V + Prep (3).
- Card có hình ảnh, hai từ/cụm từ gợi ý và nút Luyện tập.
- Ví dụ đầu: `prepare food`, `man phone`, `worker desk`, `person monitor`.
- Route bài theo dạng `/write/part1/<uuid>`.

### Part 2 · Email

Reference: [https://dautoeic.com/write?part=2](https://dautoeic.com/write?part=2)

Danh sách gồm đề email Anh–Việt, ví dụ Printer paper jam complaint, Missing accessories in order, Discontinuing a delivery service, Wrong color sofa delivered và nhiều đề khác. Mỗi card có:

- tiêu đề tiếng Anh và mô tả tiếng Việt;
- Đánh dấu đề;
- Xoá lịch sử chấm (disabled nếu chưa có history);
- link LUYỆN TẬP;
- nút Xem thêm (34 bài) sau nhóm đầu.

Route bài theo dạng `/write/part2/<uuid>`.

### Part 3 · Essay

Reference: [https://dautoeic.com/write?part=3](https://dautoeic.com/write?part=3)

Đang phát triển. Mục tiêu mô tả: viết bài luận 300+ từ trình bày quan điểm trong 30 phút; luyện lập luận, ví dụ và mạch lạc. Tính năng dự kiến:

- khung essay 4 đoạn;
- AI chấm 4 tiêu chí TOEIC Writing;
- bank linking words và academic phrases;
- so sánh với bài mẫu điểm cao.

Có CTA “Nhận thông báo khi ra mắt”.

## Flow luyện Part 1

Reference mẫu: [https://dautoeic.com/write/part1/6190c604-2de0-4977-95d0-f11f306ba308](https://dautoeic.com/write/part1/6190c604-2de0-4977-95d0-f11f306ba308)

Màn hình bài có:

- Thoát, số câu `1 / 31`;
- checkbox Flashcard để bật panel tạo flashcard;
- checkbox Tập viết dịch HOT;
- bộ chọn thời gian, mặc định quan sát `02:00`;
- ảnh, hai từ khóa và hướng dẫn viết một câu, tối đa 40 từ;
- ô nhập, bộ đếm từ, Câu mẫu, Cộng đồng, Chấm điểm;
- BÁO LỖI, Giỏ từ, credits chấm AI, Câu trước, danh sách câu hỏi, Câu tiếp.

Ở trạng thái chưa nhập, Chấm điểm bị disabled. Tài khoản quan sát có 10 lượt chấm miễn phí và 0 credits mua; sau khi hết free, UI ghi 1 credit/lượt.

## Chế độ Tập viết dịch

Khi bật, bài chuyển sang Việt → Anh và hiển thị từng câu Việt để dịch. Mỗi câu có:

- ô nhập và bộ đếm từ;
- Chấm bài AI;
- Xem câu mẫu;
- câu mẫu tiếng Việt và câu tiếng Anh tham khảo.

Ví dụ câu Việt: “Người phụ nữ đang chuẩn bị một ít thức ăn.”; câu mẫu hiển thị sau đó là bản tiếng Anh đối chiếu. Không submit bài trong quá trình khám phá.

## Tín hiệu dữ liệu cần dựng lại

Mỗi bài cần lưu tối thiểu: part, prompt/image, keyword hoặc email prompt, bản dịch mẫu, lịch sử chấm, trạng thái đánh dấu, flashcard liên quan, số lượt AI/credits và tiến độ theo câu.
