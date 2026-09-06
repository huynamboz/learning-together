# Phase 21 — Lộ trình theo kỳ thi

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Header có bảy khu vực học ngang hàng nhau: Nghe, Đọc, Viết, Từ vựng, Đề thi, Video, Cộng đồng. Người mới vào không biết nên bắt đầu ở đâu và theo thứ tự nào — mỗi ô là một cửa, không ô nào là một tuyến đường.

Slot **Cộng đồng** trên nav được thay bằng **Lộ trình**. Diễn đàn vẫn còn ở `/hoi-dap` và giờ vào từ chat dock.

## Scope delivered

### Bốn lộ trình

`/lo-trinh` liệt kê TOEIC, IELTS, TOEFL và VSTEP dưới dạng card: đối tượng, thời lượng, mục tiêu điểm, số chặng và tiến độ.

Chỉ **TOEIC** được đánh dấu `Đang mở`, vì đó là kỳ thi duy nhất nền tảng có nội dung. Ba lộ trình còn lại ghi rõ `Sắp mở` và nói thẳng ở trang chi tiết rằng chặng chỉ cho thấy tuyến đường, chưa có bài học.

### Chặng được đánh dấu bằng số liệu thật

Mỗi chặng khai báo một yêu cầu đo được, ví dụ `vocabularyReviewed >= 40 thẻ`. Endpoint mới `GET /learning/surface-progress` trả về số liệu cả đời của người học theo từng mặt học:

| Counter | Nguồn |
| --- | --- |
| `listeningAnswered` · `readingAnswered` · `grammarAnswered` | attempt, đếm qua **content type của câu hỏi** |
| `vocabularyReviewed` | thẻ SRS đã ôn |
| `writingSubmitted` · `writingGraded` | bài viết đã nộp / đã chấm |
| `videoSeconds` | study session mặt `video` |
| `examsCompleted` · `bestExamScore` | kết quả đề thi |

Đếm qua content type là điểm quan trọng: attempt của Listening và Reading đều ghi context `PRACTICE`, nên chỉ riêng context không tách được hai mặt này.

**Chặng mở theo thứ tự.** Đạt mốc của một chặng phía sau không mở được chặng đó, vì tuyến đường mới là thứ có ý nghĩa: một người làm ba đề thi thử cũng thoả mốc của chặng cuối, nhưng nói với họ rằng đã sẵn sàng thi là sai.

**Lộ trình chưa mở thì không tính gì cả.** Người học có 9 đề TOEIC vẫn ở 0/6 chặng IELTS — số liệu của kỳ thi này không nói gì về kỳ thi kia.

**Chặng đang khoá nêu yêu cầu, không nêu phân số.** Hiển thị `2/2 bài đã nộp` dưới một ổ khoá vừa nói chặng đã xong vừa nói chặng đang khoá; giờ chặng khoá ghi `Cần 2 bài đã nộp`.

### Bản đồ chinh phục

Trang chi tiết vẽ tuyến đường uốn khúc thay vì một danh sách dọc: khúc cua cho thấy đây là một hành trình có điểm cuối, và mỗi chặng có chỗ đứng riêng thay vì thêm một dòng.

- Vị trí node tính bằng công thức (`roadmapLayout`) nên lộ trình dài bao nhiêu chặng cũng bố cục được, và test được mà không cần trình duyệt.
- Canvas được **đo rồi vẽ theo pixel thật**, tỉ lệ 1:1. Kéo giãn viewBox làm cong đường và — quan trọng hơn — làm chiều dài dash lệch khỏi chiều dài đo được của path, tức là phần đường đã đi hiển thị sai.
- Node là một mỏ neo **kích thước 0** đặt đúng trên đường, nhãn nằm cạnh; nếu để cả khối căn giữa theo node thì vòng tròn trôi khỏi mặt đường.
- Phần đường **đã đi** được tô bằng màu của lộ trình, gồm cả phần lẻ trong chặng đang làm.
- Nút **Vị trí của tôi** cuộn tới node hiện tại — trên tuyến 8 chặng thì node đó thường nằm ngoài màn hình.

## Verification

- Learner seed (5 đề, 2 bài viết, 1 thẻ từ vựng): TOEIC hiển thị 1/8, chặng 1 xong, chặng 2 `1/40 thẻ đã ôn`, sáu chặng sau khoá.
- IELTS với đúng người học đó: 0/6, không chặng nào mở, không có nút *Vị trí của tôi*.
- Node nằm trên đường: khoảng cách lớn nhất từ tâm node tới đường là **3px** (sai số lấy mẫu).
- *Vị trí của tôi* cuộn node hiện tại vào giữa màn hình (lệch 1px).
- 1440×900 và 390×844: `visualViewport.width === documentElement.scrollWidth === body.scrollWidth`, không nhãn nào tràn khỏi canvas, không lỗi console.

## Kèm theo

**Icon không hiển thị.** `AppIcon` import từng icon một; tên không có trong map sẽ rơi xuống API từ xa của Iconify — offline thì không vẽ gì, và mỗi icon tốn một request. Audit toàn bộ 52 tên đang dùng cho thấy **19 tên chưa được bundle**, trong đó `solar:map-point-route-bold` (icon Lộ trình) **không tồn tại** trong bộ Solar nên không cách nào hiện được. Đã đổi sang `solar:route-bold` và bundle cả 19 tên.

## Còn lại

- Ba lộ trình IELTS/TOEFL/VSTEP chưa có nội dung; chặng của chúng trỏ về chính trang lộ trình.
- Chưa có phần chọn mục tiêu điểm hay ngày thi để giãn/nén thời lượng chặng.
- Chưa lưu lộ trình người học đang theo, nên trang chủ chưa nhắc theo chặng.
