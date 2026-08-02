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
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/map"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">🗺️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Bản đồ &amp; Báo cáo sự cố</h2>
            <p className="text-gray-500 text-sm">
              Ghim vị trí trên bản đồ để chỉ đường, hoặc báo cáo tai nạn, ngập nước, kẹt xe bằng GPS — với gợi ý
              từ AI, tránh các điểm nóng giao thông.
            </p>
          </Link>

          <Link
            href="/admin"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">🏗️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Bảng quản trị</h2>
            <p className="text-gray-500 text-sm">
              Dành cho quản trị viên — xem các đề xuất nâng cấp hạ tầng do AI phân tích từ dữ liệu sự cố đã thu thập.
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
