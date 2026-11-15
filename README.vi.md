# Mesh Avatar Studio

[English](README.md) · [日本語](README.ja.md) · [简体中文](README.zh.md)

Biến một hình minh họa thành avatar 2D chuyển động bằng lưới (mesh): nhân vật có thể chớp mắt,
nói chuyện, quay đầu, thở và đung đưa mái tóc. Tác tử lập trình sẽ chuẩn bị avatar từ ảnh của bạn,
còn bạn tinh chỉnh trực tiếp trong trình chỉnh sửa cục bộ với khung xem trước thời gian thực.

Xem chuyển động trực tiếp tại [trang giới thiệu](https://khanhlegood12.github.io/mesh-avatar-studio/).
Để điều khiển nhân vật bằng khuôn mặt và giọng nói mà không cần cài đặt gì, hãy mở
[Player](https://khanhlegood12.github.io/mesh-avatar-studio/play/) trên Chrome hoặc Edge.

![Trình chỉnh sửa với nhân vật mẫu Miko](docs/images/en/01-overview.png)

## Dùng thử mẫu có sẵn

Yêu cầu Node.js 22.17+ và Git.

```sh
npx create-mesh-avatar-studio
cd mesh-avatar-studio
npm run dev
```

Lệnh đầu tiên tải kho mã, cài đặt các gói và kiểm tra công cụ mà Studio cần. Nếu bạn tự clone
kho mã, hãy chạy `npm install`, sau đó `npm run doctor` để kiểm tra tương tự. Trình chỉnh sửa và
trang Phát trực tiếp chỉ cần Node.js. `uv` và Python dùng để dựng lại lớp ảnh, còn Playwright
Chromium dùng để kết xuất ảnh kiểm tra tư thế khi tác tử tạo avatar; lệnh kiểm tra sẽ báo rõ công
cụ nào còn thiếu.

Mở địa chỉ hiển thị trong terminal (ví dụ `http://127.0.0.1:5173/`). Trình chỉnh sửa sẽ mở nhân
vật mẫu Miko mặc sườn xám. Chọn một bộ phận ở bên trái, kéo các điểm trên ảnh và xem chuyển động ở
bên phải. Dự án mẫu chỉ cho phép đọc; khi bạn chỉnh sửa, hãy chọn **Sao chép và tiếp tục chỉnh sửa**
để làm việc trên bản sao riêng.

### Lưu ý khi dùng Windows

Ưu tiên dùng `git clone` để tải kho mã. Nếu tải tệp ZIP, hãy mở **Properties** trong File Explorer
và chọn **Unblock** (nếu có) trước khi giải nén.

Hãy tự tạo thư mục `projects/` bằng tài khoản Windows của bạn trước khi nhờ tác tử làm việc trong đó
(`npx create-mesh-avatar-studio` sẽ tự tạo giúp bạn). Thư mục do tài khoản khác hoặc tác tử chạy
trong sandbox tạo ra có thể có quyền truy cập khiến trình chỉnh sửa không đọc được. Nếu không đọc
được dự án, hãy mở **Properties → Security** của thư mục và cấp quyền cho tài khoản của bạn kế thừa
tới toàn bộ tệp và thư mục con.

## Cách hoạt động

Tạo avatar từ hình minh họa của riêng bạn gồm 4 bước. Bước 1 và 4 do tác tử lập trình (Claude Code
hoặc Codex) thực hiện trong kho mã này; bước 2 và 3 thực hiện trong trình chỉnh sửa.

### 1. Nhờ tác tử tạo avatar

Mở Claude Code hoặc Codex trong thư mục kho mã này và đưa hình minh họa của bạn:

> Create an avatar from this image following docs/agent-guide.md: `/path/to/your-image.png`

Tác tử làm theo [hướng dẫn cho tác tử](docs/agent-guide.md): kiểm tra độ chính xác đọc tọa độ,
đặt bộ rig trên lưới phóng to, tách ảnh thành các lớp và kiểm tra trực quan các tư thế. Dự án được
lưu vào `projects/<name>/` (không bao giờ bị commit). Ảnh PNG chụp chính diện bán thân với nền
trong suốt cho kết quả đẹp nhất.

![Yêu cầu tạo avatar mới](docs/images/en/06-new-project.png)

#### Tạo nhanh bằng một lệnh với Codex

Khi đã cài và đăng nhập [Codex CLI](https://github.com/openai/codex), bạn có thể chạy một lệnh duy
nhất để tạo dự án và mở trình chỉnh sửa sau khi hoàn tất:

```sh
npm run create -- /path/to/your-image.png
```

Nếu chưa có hình minh họa, dùng `--random` để Codex vẽ nhân vật anime mới rồi dựng avatar từ đó:

```sh
npm run create -- --random
npm run create -- --random --prompt "silver short hair, school uniform"
```

### 2. Mở dự án và kiểm tra

Khởi chạy trình chỉnh sửa (`npm run dev`), chọn **Mở dự án** và chọn dự án của bạn. Dùng **Thử tư thế**
để xoay, nghiêng đầu và nhắm mắt. Trong **Khớp khẩu hình**, chọn kiểu chuyển động miệng và thử bằng
văn bản kana, hoặc mở **Tinh chỉnh** để điều chỉnh chi tiết và thử bằng tệp âm thanh trên máy.

![Kiểm tra khớp khẩu hình](docs/images/en/03-lip-sync.png)

### 3. Tinh chỉnh bằng cách kéo điểm

Chọn một bộ phận ở bên trái, kéo các điểm trên ảnh để căn chỉnh lại. Bản xem trước phản hồi ngay lập
tức. Khi bạn thay đổi các đường viền ảnh hưởng đến việc cắt lớp (đường viền mắt, tay, vùng đầu/tóc),
hãy bấm **Lưu và dựng lại lớp**.

![Chỉnh sửa đường viền mắt](docs/images/en/02-edit-handles.png)

![Dựng lại lớp sau khi đổi đường viền](docs/images/en/04-rebuild.png)

### 4. Bổ sung ảnh mắt và miệng vẽ riêng

Không có ảnh vẽ riêng, mắt và miệng chỉ biến dạng bằng lưới. Bổ sung ảnh mắt nhắm, khẩu hình nguyên
âm và biểu cảm trong mục **Ảnh biểu cảm vẽ riêng** giúp chớp mắt và nói chuyện tự nhiên hơn nhiều.

![Yêu cầu vẽ biến thể miệng](docs/images/en/05-variants.png)

## Chia sẻ avatar

Chọn **Xuất .mavatar** trong trình chỉnh sửa để tải xuống một tệp duy nhất chứa rig, các lớp ảnh và
ảnh biểu cảm vẽ riêng. Trong **Mở dự án**, chọn **Nhập .mavatar** hoặc kéo thả tệp vào để tạo dự án
mới trong `projects/`. Xem chi tiết tại [định dạng avatar](docs/format.md).

## Phát trực tiếp và stream (OBS)

![Trang Phát trực tiếp](docs/images/en/07-live.png)

Mở dự án trong trình chỉnh sửa và chọn **Phát trực tiếp**. Bật camera, nhìn thẳng vào camera và bấm
**Hiệu chuẩn**. Video camera và âm thanh micro chỉ xử lý trên máy bạn; chỉ thông số chuyển động được
gửi tới màn hình phát.

Chọn nền và bấm **Sao chép URL OBS**, sau đó thêm làm nguồn **Browser Source** trong OBS (ví dụ
**1080 × 1080**). Nền trong suốt dùng trực tiếp trong OBS; với phần mềm khác, chọn phông xanh và
dùng bộ lọc Chroma Key.

![Màn hình phát với nền xanh](docs/images/en/08-stream.png)

Dùng phím **1**–**8** để đổi biểu cảm và **Shift**+**1**–**8** để đổi thiết lập sẵn ánh sáng.

### Không cần cài đặt

[Player](https://khanhlegood12.github.io/mesh-avatar-studio/play/) chạy theo dõi khuôn mặt,
khớp khẩu hình bằng micro, biểu cảm và ánh sáng hoàn toàn trong trình duyệt. Mở mẫu có sẵn hoặc tệp
`.mavatar` của bạn; không có dữ liệu nào bị tải lên. Chọn **Mở cửa sổ avatar** (Chrome hoặc Edge),
đặt nền xanh lá rồi thêm vào OBS bằng **Window Capture** kèm bộ lọc Chroma Key.

## Runtime native thử nghiệm

Runtime viết bằng Rust, trình kết xuất PNG và avatar desktop trong suốt cho macOS có hướng dẫn tại
[hướng dẫn bản native](native/README.md).

## Tài liệu thêm

- [Agent guide](docs/agent-guide.md): quy trình từng bước cho tác tử lập trình
- [Reference](docs/reference.md): dự án, dựng lớp thủ công, toàn bộ điều khiển và kiểm thử
- [Rig fields](docs/rig-fields.md): ý nghĩa từng trường trong `rig.json`
- [Avatar format](docs/format.md): cấu trúc thư mục và tệp `.mavatar`

## Giấy phép

Mã nguồn phát hành theo [Giấy phép MIT](LICENSE).

Nhân vật mẫu Miko (`samples/miko-qipao/`) không thuộc giấy phép MIT. Miko là nhân vật của AITuber
OnAir, © Yuki Shindo (AITuber OnAir), được sử dụng theo
[Hướng dẫn sử dụng nhân vật Miko](https://miko.aituberonair.com/#terms); xem thêm
[samples/miko-qipao/MIKO_ASSET_TERMS.md](samples/miko-qipao/MIKO_ASSET_TERMS.md). Dự án này không
phải sản phẩm chính thức của AITuber OnAir.

Tính năng theo dõi khuôn mặt và cơ thể sử dụng [MediaPipe](https://github.com/google-ai-edge/mediapipe)
(`@mediapipe/tasks-vision` và các mô hình trong `vendor/mediapipe/`), © The MediaPipe Authors, theo
giấy phép Apache License 2.0; xem [vendor/mediapipe/LICENSE](vendor/mediapipe/LICENSE).
