# Ms Chole TOEIC — bộ nhận diện

Mark là chữ **C** vẽ như một vòng tiến độ chưa khép, với chấm vàng ở chỗ nét dừng lại: vừa là chữ cái đầu, vừa là ý "đường học còn đang đi".

| Màu | Hex | Vai trò |
| --- | --- | --- |
| Ink | `#263238` | nền tile, chữ |
| Grass | `#58CC02` | nét chữ C |
| Gold | `#F4B942` | chấm mốc |

## Chọn biến thể nào

| Tệp | Dùng khi |
| --- | --- |
| `mark-dark` | mặc định — nền sáng, ví dụ header trắng |
| `mark-light` | nền tối hoặc ảnh tối |
| `mark-transparent` | nền đã đủ tương phản, không cần tile |
| `mark-mono-ink` · `mark-mono-white` | một màu: dấu mộc, in khắc, fax, nơi không có màu |
| `lockup-dark-text` · `lockup-light-text` | có chữ, cho web và tài liệu vector |

SVG là bản gốc. PNG xuất kèm ở 16 → 1024 px cho từng biến thể mark.

## Xuất lại

```bash
node scripts/build-brand-assets.mjs
```

Script vẽ thẳng từ hình học nên không cần rasteriser ngoài. Nó ghi PNG vào `public/brand/`, và `favicon.ico`, `apple-touch-icon.png`, `icon-32/192/512.png` vào `public/`.

Mọi số đo trong script trùng với các tệp SVG ở đây — sửa một bên thì sửa cả bên kia.

## Lưu ý

Lockup dùng font **Be Vietnam Pro**. SVG tham chiếu font theo tên, nên nơi nào không có font sẽ rơi về font hệ thống; muốn cố định hình chữ thì convert text thành path trước khi gửi ra ngoài.
