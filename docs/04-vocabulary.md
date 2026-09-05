# Từ vựng

Reference chính: [https://dautoeic.com/vocabulary](https://dautoeic.com/vocabulary)

## Mục đích

Khu vực học từ vựng dùng Spaced Repetition System (SRS), với flashcard, trắc nghiệm, gõ từ, phát âm và game.

## Các tab chính

| Tab | Reference |
| --- | --- |
| Học | [https://dautoeic.com/vocabulary](https://dautoeic.com/vocabulary) |
| Tiến độ | [https://dautoeic.com/vocabulary?tab=progress](https://dautoeic.com/vocabulary?tab=progress) |
| Từ vựng của tôi | [https://dautoeic.com/vocabulary?tab=my](https://dautoeic.com/vocabulary?tab=my) |
| Thuật toán học từ | [https://dautoeic.com/vocabulary?tab=algorithm](https://dautoeic.com/vocabulary?tab=algorithm) |

## Học theo bộ từ

Các bộ lọc/bộ từ chính:

- 600 TỪ VỰNG TOEIC.
- Đề 2023.
- Đề 2024.
- Đề 2026.
- TOEIC MASTER.

Các chủ đề hiển thị dạng card, ví dụ Contracts, Marketing, Warranties, Conferences, Computers, Office Technology, Electronics, Correspondence, Shopping, Banking, Travel, Hotels, Media, Health Insurance…

Một card chủ đề có:

- Tên bộ và chủ đề.
- Số từ vựng.
- Nhãn PRO nếu bị giới hạn.
- Xem từ.
- Học.
- Chơi.

## Danh sách từ

Reference mẫu: [https://dautoeic.com/vocabulary/test/424fca03-358c-4775-92cc-65943156d430?tab=view](https://dautoeic.com/vocabulary/test/424fca03-358c-4775-92cc-65943156d430?tab=view)

Màn hình danh sách có:

- Chuyển giữa Xem từ, Học và Chơi.
- Hiển thị gợi ý.
- Yêu thích.
- Xáo trộn.
- Cài đặt.
- Flashcard hiện tại, ví dụ `1/12`.
- Lật thẻ để xem nghĩa.
- Phát âm.
- Xem chi tiết.
- Thứ tự gốc hoặc thứ tự đã chọn.
- Danh sách từ với nghĩa tiếng Việt và câu ví dụ song ngữ.
- Gắn sao.
- Đánh dấu thành thạo.
- Điều hướng bằng mũi tên và phím Space.

Một từ mẫu hiển thị từ loại, phiên âm, nghĩa, câu ví dụ tiếng Anh và bản dịch tiếng Việt.

## Phiên học SRS

Trong tab Học, các chế độ được hiển thị:

- Flashcard.
- Trắc nghiệm.
- Gõ từ.
- Phát âm.

Màn hình phiên học hiển thị số từ, số đã học và số ôn tập. Flashcard có nút phát âm, lật thẻ và điều hướng.

Theo thuật toán, người học chấm:

- Again — gặp lại sau 5 từ / reset về Mới.
- Hard — ôn lại sau 6 giờ.
- Good — ôn lại sau 1 ngày.
- Easy — ôn lại sau 3 ngày.

## Game

Nút “Chơi” mở màn hình chọn game:

- Word Blast — chọn từ đúng trước khi rơi hết.
- Word Match — ghép từ tiếng Anh với nghĩa tiếng Việt.

## Tiến độ

Reference: [https://dautoeic.com/vocabulary?tab=progress](https://dautoeic.com/vocabulary?tab=progress)

Card mục tiêu hôm nay hiển thị:

- Ôn tập: số từ đến hạn, không giới hạn.
- Từ mới: tiến độ trên mục tiêu 20 từ.

Card tổng quan hiển thị:

- Tổng thẻ: 7.736.
- Đã học.
- Thành thạo.
- Cần ôn.

## Từ vựng của tôi

Reference: [https://dautoeic.com/vocabulary?tab=my](https://dautoeic.com/vocabulary?tab=my)

Phiên “Học tất cả từ vựng của tôi” gom từ đã lưu từ đề thi, nghe/đọc, bộ tự tạo và từ lẻ. Hệ thống ưu tiên từ đến hạn ôn trước rồi đến từ mới.

Các thống kê:

- Đến hạn ôn.
- Từ mới.
- Đã thuộc.
- Tổng cộng.

Các nguồn từ có tab:

- Đề thi.
- Nghe.
- Đọc.
- Viết.
- Học phần.
- Bộ từ vựng.

Có menu “Tạo mới” với:

- Tạo học phần.
- Tạo bộ từ vựng.

## Thuật toán học từ

Reference: [https://dautoeic.com/vocabulary?tab=algorithm](https://dautoeic.com/vocabulary?tab=algorithm)

Trang giải thích:

- Tự động lên lịch ôn cho từng từ.
- Bốn chế độ học trên cùng một từ.
- Gom từ đến hạn vào hàng đợi hôm nay.
- Luồng 3 giai đoạn: từ mới, chu kỳ ôn tự động, đánh dấu Mastered.
- Nút Tick “Đánh dấu đã thuộc” để đưa từ ra khỏi hàng đợi ôn.
- Biểu đồ minh họa sức mạnh ôn tập.

## Mô hình dữ liệu cần dựng

- Vocabulary set, topic và word.
- Phiên âm, từ loại, nghĩa, ví dụ, audio.
- Sao/yêu thích, ghi chú, trạng thái thành thạo.
- SRS state: new, learning, review, mastered.
- Lịch ôn kế tiếp, rating Again/Hard/Good/Easy.
- Nguồn lưu từ: mock test, listening, reading, writing, course, custom set.
