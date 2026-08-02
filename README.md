# PMap

Ứng dụng bản đồ đô thị thông minh, mobile-first: Next.js (App Router) + TypeScript + Tailwind +
MongoDB + **OpenStreetMap** (bản đồ, định tuyến, tìm địa điểm — hoàn toàn miễn phí, không cần API key)
+ Gemini AI để đưa ra gợi ý tuyến đường / đề xuất nâng cấp hạ tầng.

> Bản demo: trang `/admin` không yêu cầu đăng nhập.

## Cấu trúc trang

| Trang | Đường dẫn | Mô tả |
|---|---|---|
| Ứng dụng chính | `/` | Bản đồ một trang duy nhất với 2 chế độ chuyển đổi bằng tab: **Chỉ đường** (tìm địa chỉ hoặc ghim điểm đến, AI gợi ý tuyến/tránh sự cố) và **Báo cáo sự cố** (dùng GPS hoặc ghim tay, xem sự cố lân cận) |
| Quản trị | `/admin` | Dashboard hiển thị đề xuất nâng cấp hạ tầng do AI phân tích (mở, không cần đăng nhập — bản demo) |

## Đã bỏ Google Maps — dùng gì thay thế?

| Trước đây (Google) | Bây giờ (miễn phí, không cần API key) |
|---|---|
| Google Maps JavaScript API (hiển thị bản đồ) | **Leaflet + OpenStreetMap tiles** |
| Google Directions API (vẽ tuyến đường) | **OSRM** (Open Source Routing Machine) — server demo công khai tại `router.project-osrm.org` |
| Google Places/Geocoding (tìm địa điểm từ chuỗi text) | **Nominatim** (dịch vụ geocoding của OpenStreetMap), được gọi qua route proxy `app/api/geocode/route.ts` để tuân thủ đúng chính sách sử dụng của họ |

Vì vậy bạn **không cần** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` hay bất kỳ key Google nào nữa.

⚠️ Lưu ý: server OSRM demo công khai và Nominatim công khai đều **có giới hạn tần suất gọi**, chỉ phù
hợp cho dev/test hoặc traffic thấp. Khi lên production thật với nhiều người dùng, bạn nên tự host OSRM
(có Docker image chính thức, khá dễ chạy) và cân nhắc dùng Photon hoặc Nominatim tự host cho geocoding.

## 1. Đưa code lên GitHub

```bash
cd smart-traffic-app
git init
git add .
git commit -m "Initial commit: Smart Traffic AI (OpenStreetMap)"
git branch -M main
git remote add origin https://github.com/<username-cua-ban>/smart-traffic-app.git
git push -u origin main
```

`.env.local` đã được `.gitignore`, không bao giờ commit key/connection string thật lên GitHub.
Dùng `.env.local.example` làm mẫu.

## 2. Thiết lập MongoDB Atlas

1. Tạo cluster miễn phí tại https://cloud.mongodb.com
2. **Database Access** → Add New Database User → đặt username/password mạnh, nhớ lại để dùng ở bước sau
3. **Network Access** → Add IP Address → chọn **Allow Access from Anywhere (0.0.0.0/0)**
   (bắt buộc vì Vercel serverless function chạy trên IP động, không cố định)
4. **Database** → Connect → Drivers → copy chuỗi kết nối, nó có dạng:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Nhớ thay `<user>` và `<password>` bằng thông tin thật, và thêm tên database vào cuối nếu muốn,
   ví dụ `.../smart_traffic?retryWrites=true&w=majority`
5. Dán chuỗi này vào biến `MONGODB_URI`

## 3. Chạy thử ở local

```bash
npm install
cp .env.local.example .env.local
# mở .env.local, điền MONGODB_URI (và PYTHON_BACKEND_URL nếu đã có backend Python)
npm run dev
```

Mở `http://localhost:3000` → xem trang chủ → thử `/report` (cho phép trình duyệt truy cập vị trí),
`/directions`, và `/admin`.

## 4. HƯỚNG DẪN CHI TIẾT: Deploy lên Vercel

### Bước 1 — Tạo tài khoản & kết nối GitHub

1. Vào https://vercel.com → **Sign Up** → chọn **Continue with GitHub** (khuyên dùng, để Vercel tự
   thấy repo của bạn)
2. Nếu lần đầu dùng, Vercel sẽ hỏi quyền truy cập GitHub — chọn **Only select repositories** rồi tick
   vào repo `smart-traffic-app` (hoặc **All repositories** nếu bạn muốn đơn giản hơn)

### Bước 2 — Import project

1. Ở Vercel Dashboard, bấm **Add New...** → **Project**
2. Tìm repo `smart-traffic-app` trong danh sách → bấm **Import**
3. Ở màn hình "Configure Project":
   - **Framework Preset**: Vercel tự nhận diện là **Next.js** — không cần đổi gì
   - **Root Directory**: để mặc định `./` (trừ khi bạn để code trong thư mục con)
   - **Build Command / Output Directory**: để mặc định, không cần sửa

### Bước 3 — Khai báo Environment Variables (bắt buộc, nếu bỏ qua build vẫn chạy nhưng app sẽ lỗi khi gọi DB/AI)

Vẫn ở màn hình Configure Project, mở phần **Environment Variables**, thêm lần lượt từng dòng
(Key ở ô trái, Value ở ô phải, rồi bấm **Add**):

| Key | Value | Bắt buộc? |
|---|---|---|
| `MONGODB_URI` | chuỗi kết nối Atlas ở bước 2 | Có |
| `PYTHON_BACKEND_URL` | URL public của service Python AI (không có dấu `/` ở cuối), ví dụ `https://my-ai-backend.onrender.com` | Có (nếu chưa deploy backend, tạm thời điền URL bất kỳ, sửa lại sau) |
| `NEXT_PUBLIC_OSRM_URL` | để trống nếu dùng server OSRM demo công khai; hoặc điền URL OSRM tự host của bạn | Không |

Mặc định Vercel sẽ áp dụng các biến này cho cả 3 môi trường **Production**, **Preview**, **Development**
— nên giữ nguyên tick chọn cả 3 (trừ khi bạn cố tình muốn khác nhau giữa các môi trường).

### Bước 4 — Deploy

1. Bấm **Deploy**
2. Vercel sẽ build project (~1-3 phút). Bạn có thể xem log build trực tiếp trên màn hình — nếu build
   lỗi, log sẽ chỉ rõ dòng nào/file nào bị lỗi
3. Build xong, Vercel cho bạn 1 link dạng `https://smart-traffic-app-xxxx.vercel.app` — đây là link
   chạy live, có thể chia sẻ ngay

### Bước 5 — Kiểm tra sau khi deploy

- Mở link vừa nhận, thử lần lượt cả 4 trang (`/`, `/report`, `/directions`, `/admin`)
- Nếu `/report` hoặc `/directions` báo lỗi liên quan tới sự cố/incidents → kiểm tra lại `MONGODB_URI`
  trong Vercel (Project → Settings → Environment Variables), và kiểm tra Network Access trên Atlas đã
  cho `0.0.0.0/0` chưa
- Nếu `/admin` hoặc gợi ý AI ở `/directions` không hiện gì → kiểm tra `PYTHON_BACKEND_URL` đã trỏ đúng
  service Python đang chạy chưa (mở thẳng `PYTHON_BACKEND_URL/analyze-route` bằng trình duyệt/Postman
  để test độc lập)

### Bước 6 — Mỗi lần sửa code sau này

Chỉ cần `git push` lên nhánh `main` (hoặc mở Pull Request để có preview link riêng) — Vercel tự động
build & deploy lại, không cần thao tác gì thêm trên dashboard.

### (Tuỳ chọn) Gắn domain riêng

Project → Settings → Domains → nhập domain bạn đã mua (ví dụ `smarttraffic.vn`) → Vercel sẽ hiện ra
bản ghi DNS (thường là 1 dòng `A` hoặc `CNAME`) cần thêm ở nơi bạn mua domain (Nhân Hòa, GoDaddy, Cloudflare...).
Thêm xong đợi vài phút tới vài giờ để DNS propagate là domain chạy được.

## Xử lý lỗi build thường gặp

**`Module not found: Can't resolve 'react-leaflet'`** khi build trên Vercel:
Nghĩa là file `package.json` trên GitHub của bạn chưa có `leaflet` và `react-leaflet` trong phần
`dependencies` (thường do bạn upload/copy code cũ, chưa ghi đè bằng bản mới nhất). Cách fix:
1. Mở `package.json` trong repo trên GitHub, kiểm tra phần `dependencies` có đủ 2 dòng
   `"leaflet": "^1.9.4"` và `"react-leaflet": "^4.2.1"` chưa — nếu thiếu, copy đè bằng bản trong
   thư mục này rồi commit + push lại
2. Sau khi push, Vercel sẽ tự build lại. Nếu muốn chắc chắn không dùng cache cũ: vào Vercel Dashboard
   → tab **Deployments** → bấm vào 3 chấm ở deployment mới nhất → **Redeploy** → bỏ tick
   **Use existing Build Cache** → **Redeploy**

## Về Python AI backend

`services/aiPythonService.ts` yêu cầu service Python của bạn có 2 endpoint:
- `POST {PYTHON_BACKEND_URL}/analyze-route` → trả về `{ recommendedWaypoints, estimatedTimeDelay, upgradeRecommendations }`
- `POST {PYTHON_BACKEND_URL}/propose-upgrades` → trả về `{ proposals: string[] }`

Backend này cần deploy ở nơi có HTTPS public (Render, Railway, Fly.io, VPS...) vì các hàm Next.js trên
Vercel không gọi được tới `localhost` của máy bạn.
