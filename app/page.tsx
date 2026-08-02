import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Smart Traffic AI</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Báo cáo sự cố giao thông theo thời gian thực, tìm tuyến đường được AI tối ưu, và theo dõi
            các đề xuất nâng cấp hạ tầng đô thị — miễn phí, chạy trên nền OpenStreetMap.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/report"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">📍</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Báo cáo sự cố</h2>
            <p className="text-gray-500 text-sm">
              Ghi nhận tai nạn, ngập nước hoặc kẹt xe bằng GPS, chỉnh vị trí trên bản đồ ghim nhỏ gọn.
            </p>
          </Link>

          <Link
            href="/directions"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">🗺️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Chỉ đường</h2>
            <p className="text-gray-500 text-sm">
              Tìm tuyến đường tối ưu trên bản đồ OpenStreetMap với gợi ý từ AI, tránh các điểm nóng giao thông.
            </p>
          </Link>

          <Link
            href="/admin"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">🏗️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Bảng quản trị</h2>
            <p className="text-gray-500 text-sm">
              Xem các đề xuất nâng cấp hạ tầng do AI phân tích từ dữ liệu sự cố đã thu thập.
            </p>
          </Link>
        </div>
      </main>

      <footer className="text-center text-sm text-gray-400 py-6">
        Bản đồ &copy; OpenStreetMap contributors
      </footer>
    </div>
  );
}
