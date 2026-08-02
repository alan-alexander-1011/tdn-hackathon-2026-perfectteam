# Hướng dẫn sử dụng PMap

PMap là ứng dụng bản đồ giúp bạn:
- Tìm đường đi giữa hai địa điểm, có cảnh báo nếu trên đường có sự cố.
- Báo cáo sự cố đô thị (đường hỏng, ngập nước, mất điện đường, mất an ninh...) để mọi người cùng biết và cơ quan quản lý xử lý.
- Vô cùng tiện lợi: Không cần cài đặt gì cả — chỉ cần mở trình duyệt (Chrome, Safari, Cốc Cốc...) và truy cập vào đường link của ứng dụng.

Ứng dụng bản đồ đô thị thông minh, mobile-first: Next.js (App Router) + TypeScript + Tailwind +
MongoDB + **OpenStreetMap** (bản đồ, định tuyến, tìm địa điểm — hoàn toàn miễn phí, không cần API key)
+ Gemini AI để đưa ra gợi ý tuyến đường / đề xuất nâng cấp hạ tầng.

## 1. Làm quen với màn hình chính

Khi mở ứng dụng, bạn sẽ thấy:
- **Phía trên cùng**: Thanh có 2 nút lớn — "Chỉ đường" và "Báo cáo sự cố". Đây là 2 chức năng chính, bạn chạm vào nút nào thì dùng chức năng đó.
- **Nút bên phải thanh trên**: Bấm vào để ứng dụng tự định vị vị trí hiện tại của bạn (cần cho phép truy cập GPS/vị trí).
- **Ở giữa màn hình**: Bản đồ. Bạn có thể kéo để di chuyển, và chụm/vuốt 2 ngón tay để phóng to — thu nhỏ.
- **Phía dưới cùng**: Một khung thông tin (kéo lên/xuống được) hiển thị chi tiết theo chức năng bạn đang chọn.

> **Mẹo**: Trên bản đồ, mỗi sự cố đã được người khác báo cáo sẽ hiện thành một chấm màu với icon riêng, để bạn biết khu vực nào cần chú ý.

---

## 2. Cách tìm đường đi (Chỉ đường)

- **Bước 1**: Chạm vào tab "Chỉ đường" ở trên cùng (nếu chưa được chọn sẵn).
- **Bước 2**: Bấm nút để lấy vị trí hiện tại của bạn làm điểm đi. *(Nếu điện thoại/máy tính không lấy được GPS, bạn vẫn có thể chạm vào bản đồ để chọn điểm đi thủ công).*
- **Bước 3**: Chọn điểm đến bằng 1 trong 2 cách:
  - Gõ tên địa chỉ vào ô tìm kiếm phía trên rồi bấm "Tìm".
  - Hoặc chạm trực tiếp vào vị trí trên bản đồ mà bạn muốn đến.
- **Bước 4**: Bấm nút "Tìm đường" ở khung phía dưới.

**Kết quả**: Ứng dụng sẽ vẽ tuyến đường trên bản đồ, kèm theo:
- Quãng đường và thời gian di chuyển ước tính.
- Cảnh báo trên tuyến đường — nếu có sự cố (đường hỏng, ngập nước...) nằm gần đường đi của bạn, ứng dụng sẽ liệt kê ra để bạn biết trước.
- Gợi ý AI (PMap AI) — một vài gợi ý thêm giúp bạn đi lại thuận tiện hơn *(mục này có thể tạm thời không hiển thị nếu hệ thống AI đang bận, không ảnh hưởng đến việc tìm đường của bạn)*.

> **Mẹo**: Muốn đổi điểm đến khác, bấm "Xoá điểm đến" rồi chọn lại từ đầu.

---

## 3. Cách báo cáo một sự cố

Khi bạn gặp một vấn đề ngoài đường (ổ gà, ngập nước, đèn đường hỏng, mất an ninh...), hãy giúp cộng đồng bằng cách báo cáo:
- Chạm vào tab "Báo cáo sự cố" ở trên cùng.
- **Bước 1 — Chọn nhóm sự cố** (chạm vào 1 trong 4 ô):
  - **Môi trường và vệ sinh**: Rác thải, cống rãnh tắc, ô nhiễm, cây xanh gãy đổ.
  - **Hạ tầng giao thông**: Đường hỏng, ngập nước, kẹt xe, công trình lấn đường.
  - **Tiện ích công cộng**: Đèn đường, biển báo, ghế đá, trạm xe buýt hư/thiếu.
  - **Trật tự và an toàn**: Tai nạn, trộm cắp, tụ tập gây rối, cháy nổ.
- **Bước 2 — Chọn đúng tình huống cụ thể**: Sau khi chọn nhóm, một dãy nút nhỏ hơn sẽ hiện ra *(ví dụ nhóm "Hạ tầng giao thông" sẽ có: Ngập đường, Đường hư hỏng, Công trình thi công lấn đường, Kẹt xe kéo dài, Khác)*. Bạn chỉ cần chạm chọn tình huống đúng nhất — không cần gõ chữ.
- **Bước 3 — Chọn vị trí sự cố**: Chạm vào bản đồ đúng nơi xảy ra sự cố. Một ghim (pin) sẽ xuất hiện tại đó.
- **Bước 4 — Ghi chú thêm (Không bắt buộc)**: Nếu muốn nói rõ hơn, gõ thêm vài dòng vào ô "Ghi chú thêm".
- **Hoàn tất**: Bấm nút "Gửi báo cáo". Xong! Bạn sẽ thấy dòng chữ xác nhận đã gửi thành công.

- **Theo dõi xung quanh**: Sau khi gửi, khung phía dưới còn cho bạn xem "Sự cố gần vị trí này (bán kính 3km)" — danh sách các sự cố khác mà mọi người đã báo cáo gần khu vực đó, để bạn biết tình hình chung quanh.

> **Lưu ý**: Bạn bắt buộc phải chọn vị trí trên bản đồ trước khi gửi được báo cáo — nút "Gửi báo cáo" sẽ mờ đi (không bấm được) cho tới khi bạn đã ghim vị trí.

---

## 4. Trang Quản trị (Dành cho cán bộ quản lý)

Ở cuối màn hình chính có một liên kết nhỏ "Quản trị" — dẫn tới trang dành riêng cho đơn vị quản lý đô thị, dùng để theo dõi và xử lý các báo cáo. Người dùng thông thường không cần vào mục này.

Trang Quản trị có 2 phần:

### a) Quản lý báo cáo
- Xem toàn bộ danh sách báo cáo mà mọi người đã gửi, kèm vị trí, thời gian, ghi chú.
- Mỗi báo cáo có sẵn dòng "Đề xuất xử lý" — gợi ý cụ thể cơ quan quản lý nên làm gì *(ví dụ: sự cố "Ngập đường" sẽ gợi ý "Triển khai bơm thoát nước khẩn cấp, cắm biển cảnh báo ngập...")*.
- Có thể thêm báo cáo thủ công (nếu nhận tin qua kênh khác) hoặc xoá báo cáo khi đã xử lý xong.

### b) Đề xuất nâng cấp
Hệ thống tự động gom các báo cáo ở gần nhau thành từng khu vực, và đưa ra:
- Mức độ nghiêm trọng (Cao / Trung bình / Thấp) dựa trên số lượng báo cáo.
- Giải pháp ngắn hạn cần làm ngay.
- Quy hoạch dài hạn nên cân nhắc.

*Mục này giúp cơ quan quản lý nhìn được bức tranh tổng thể, thay vì xử lý từng báo cáo lẻ tẻ.*

---

## 5. Câu hỏi thường gặp

- **Ứng dụng có mất phí không?**  
  Không, bạn chỉ cần trình duyệt và kết nối internet.
- **Tôi có cần đăng nhập tài khoản không?**  
  Không cần — ai cũng có thể tìm đường và gửi báo cáo ngay, không cần đăng ký.
- **Tôi không cho phép truy cập GPS thì có dùng được không?**  
  Được. Bạn vẫn có thể chạm trực tiếp vào bản đồ để chọn điểm đi/điểm đến hoặc vị trí sự cố.
- **Phần "Gợi ý AI" báo "hiện chưa khả dụng" thì sao?**  
  Không sao cả — đây chỉ là gợi ý thêm. Việc tìm đường và cảnh báo sự cố trên tuyến đường vẫn hoạt động bình thường dù không có gợi ý AI.
- **Tôi báo cáo nhầm loại sự cố thì làm sao?**  
  Bạn có thể gửi báo cáo mới với thông tin đúng; báo cáo cũ sẽ được cơ quan quản lý xử lý/xoá khi kiểm tra tại trang Quản trị.

---

Chúc bạn sử dụng PMap thuận tiện!
