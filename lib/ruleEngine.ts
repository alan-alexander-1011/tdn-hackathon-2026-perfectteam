// Thuật toán quy tắc (rule-based) đơn giản — KHÔNG dùng AI.
// Mọi kết quả ở đây đều được tính toán trực tiếp từ dữ liệu báo cáo bằng
// các công thức hình học + các "kịch bản có sẵn" (scenario templates) được
// viết tay theo loại sự cố, thay vì gọi ra một mô hình ngôn ngữ.

import { IncidentType, INCIDENT_TYPES } from '@/services/incidentTypes';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface IncidentLike {
  _id?: any;
  type: IncidentType;
  subType?: string;
  note?: string;
  coordinates: LatLng;
  timestamp?: string | Date;
}

// ---------------------------------------------------------------------------
// Hình học: khoảng cách từ một điểm tới một tuyến đường (chuỗi các điểm)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6371000;

function toLocalXY(origin: LatLng, p: LatLng): { x: number; y: number } {
  const dLat = ((p.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((p.lng - origin.lng) * Math.PI) / 180;
  const x = dLng * Math.cos((origin.lat * Math.PI) / 180) * EARTH_RADIUS_M;
  const y = dLat * EARTH_RADIUS_M;
  return { x, y };
}

// Khoảng cách (m) từ điểm p tới đoạn thẳng a-b, xấp xỉ bằng phép chiếu phẳng
// cục bộ -- đủ chính xác ở quy mô đô thị (vài chục km).
function distancePointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const P = toLocalXY(a, p);
  const B = toLocalXY(a, b);
  const ABx = B.x;
  const ABy = B.y;
  const lenSq = ABx * ABx + ABy * ABy;
  let t = lenSq === 0 ? 0 : (P.x * ABx + P.y * ABy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ABx * t;
  const projY = ABy * t;
  const dx = P.x - projX;
  const dy = P.y - projY;
  return Math.sqrt(dx * dx + dy * dy);
}

function distancePointToPathMeters(p: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) return distancePointToSegmentMeters(p, path[0], path[0]);
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distancePointToSegmentMeters(p, path[i], path[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// ---------------------------------------------------------------------------
// 1) Phát hiện sự cố trên tuyến đường vừa tìm được
// ---------------------------------------------------------------------------

export interface RouteIncidentMatch {
  incident: IncidentLike;
  distanceMeters: number;
}

const DEFAULT_ROUTE_THRESHOLD_M = 150;

// Trả về các sự cố đang được báo cáo nằm gần tuyến đường (mặc định trong
// bán kính 150m), sắp theo khoảng cách gần nhất trước.
export function findIncidentsOnRoute(
  route: LatLng[],
  incidents: IncidentLike[],
  thresholdMeters: number = DEFAULT_ROUTE_THRESHOLD_M
): RouteIncidentMatch[] {
  if (!route.length || !incidents.length) return [];
  return incidents
    .map((incident) => ({ incident, distanceMeters: distancePointToPathMeters(incident.coordinates, route) }))
    .filter((m) => m.distanceMeters <= thresholdMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// Kịch bản cảnh báo có sẵn theo từng loại sự cố (viết tay, không AI).
const ROUTE_WARNING_TEMPLATES: Record<IncidentType, (m: RouteIncidentMatch) => string> = {
  infrastructure: (m) =>
    `${INCIDENT_TYPES.infrastructure.icon} Phát hiện sự cố hạ tầng (đường hỏng/ngập nước/kẹt xe...) cách tuyến đường khoảng ${Math.round(
      m.distanceMeters
    )}m${m.incident.note ? ` — "${m.incident.note}"` : ''}. Cân nhắc đi chậm hoặc chọn tuyến khác.`,
  environment: (m) =>
    `${INCIDENT_TYPES.environment.icon} Có báo cáo về vệ sinh môi trường gần tuyến đường (khoảng ${Math.round(
      m.distanceMeters
    )}m)${m.incident.note ? ` — "${m.incident.note}"` : ''}.`,
  utilities: (m) =>
    `${INCIDENT_TYPES.utilities.icon} Tiện ích công cộng (đèn đường/biển báo...) trên tuyến đường có thể đang gặp vấn đề (cách ${Math.round(
      m.distanceMeters
    )}m)${m.incident.note ? ` — "${m.incident.note}"` : ''}.`,
  safety: (m) =>
    `${INCIDENT_TYPES.safety.icon} Khu vực cách tuyến đường ${Math.round(
      m.distanceMeters
    )}m từng có báo cáo về an ninh/trật tự${m.incident.note ? ` — "${m.incident.note}"` : ''}. Nên cẩn trọng, đặc biệt vào ban đêm.`,
};

const MAX_ROUTE_WARNINGS = 4;

// Sinh danh sách cảnh báo dạng văn bản để hiển thị cho người dùng, hoàn toàn
// dựa trên bảng kịch bản cố định ở trên (không gọi AI).
export function buildRouteWarnings(matches: RouteIncidentMatch[]): string[] {
  const warnings: string[] = [];
  for (const m of matches) {
    const tmpl = ROUTE_WARNING_TEMPLATES[m.incident.type];
    if (tmpl) warnings.push(tmpl(m));
    if (warnings.length >= MAX_ROUTE_WARNINGS) break;
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// 2) Đề xuất nâng cấp hạ tầng theo khu vực (rule-based, thay cho Gemini)
// ---------------------------------------------------------------------------

export interface AreaGroup {
  key: string;
  center: LatLng;
  items: IncidentLike[];
}

export interface AreaProposal {
  area: string;
  center: LatLng;
  reportCount: number;
  severity: 'Cao' | 'Trung bình' | 'Thấp';
  analysis_summary: string;
  short_term_solutions: string[];
  long_term_planning: string;
  dominant_type: IncidentType;
}

// Mức độ nghiêm trọng suy ra trực tiếp từ số lượng báo cáo trong khu vực --
// một kịch bản/quy tắc cố định, không cần suy luận AI.
function severityFromCount(n: number): AreaProposal['severity'] {
  if (n >= 6) return 'Cao';
  if (n >= 3) return 'Trung bình';
  return 'Thấp';
}

function dominantType(items: IncidentLike[]): IncidentType {
  const counts: Partial<Record<IncidentType, number>> = {};
  for (const it of items) counts[it.type] = (counts[it.type] || 0) + 1;
  let best: IncidentType = items[0].type;
  let bestCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if ((count as number) > bestCount) {
      bestCount = count as number;
      best = type as IncidentType;
    }
  }
  return best;
}

// Thư viện kịch bản có sẵn theo loại sự cố chiếm đa số trong khu vực.
// Đây chính là "chương trình thuật toán đơn giản phản ứng theo kịch bản có
// sẵn" mà yêu cầu đề cập -- toàn bộ nội dung được viết cố định trước, engine
// chỉ chọn kịch bản phù hợp và điền số liệu vào.
const AREA_SCENARIOS: Record<
  IncidentType,
  {
    summary: (n: number) => string;
    short_term: string[];
    long_term: string;
  }
> = {
  infrastructure: {
    summary: (n) =>
      `Khu vực này đã ghi nhận ${n} phản ánh liên quan tới hạ tầng giao thông (đường hỏng, ngập nước, kẹt xe, tai nạn...).`,
    short_term: [
      'Cử đội duy tu kiểm tra hiện trường và vá/sửa tạm mặt đường trong tuần',
      'Đặt biển cảnh báo, rào chắn hoặc đèn nháy tại điểm hư hỏng/ngập nước',
      'Điều tiết, phân luồng giao thông tạm thời vào giờ cao điểm nếu gây kẹt xe',
    ],
    long_term:
      'Lập kế hoạch nâng cấp mặt đường và hệ thống thoát nước tại khu vực, đưa vào danh sách ưu tiên đầu tư hạ tầng của quận/phường.',
  },
  environment: {
    summary: (n) =>
      `Khu vực này đã ghi nhận ${n} phản ánh về môi trường và vệ sinh (rác thải, ô nhiễm, cống rãnh, cây xanh...).`,
    short_term: [
      'Tăng tần suất thu gom rác và dọn dẹp vệ sinh tại khu vực',
      'Khơi thông cống rãnh, xử lý điểm ứ đọng nước thải',
      'Đặt thêm thùng rác công cộng và biển nhắc nhở giữ vệ sinh',
    ],
    long_term:
      'Quy hoạch lại hệ thống thu gom rác và cây xanh cho khu vực, xem xét lắp đặt hệ thống thoát nước bền vững lâu dài.',
  },
  utilities: {
    summary: (n) =>
      `Khu vực này đã ghi nhận ${n} phản ánh về tiện ích công cộng (đèn đường, biển báo, ghế đá, trạm xe buýt...).`,
    short_term: [
      'Kiểm tra và sửa chữa/thay thế đèn đường, biển báo bị hư hỏng',
      'Bổ sung tạm các tiện ích còn thiếu (ghế đá, mái che trạm chờ...)',
    ],
    long_term:
      'Đưa khu vực vào kế hoạch nâng cấp đồng bộ hệ thống chiếu sáng và tiện ích công cộng của địa phương.',
  },
  safety: {
    summary: (n) =>
      `Khu vực này đã ghi nhận ${n} phản ánh về an ninh, trật tự (trộm cắp, tụ tập gây rối...).`,
    short_term: [
      'Tăng cường tuần tra của lực lượng công an/dân phòng khu vực, đặc biệt vào buổi tối',
      'Lắp đặt hoặc kiểm tra lại camera an ninh tại các điểm nóng',
    ],
    long_term:
      'Phối hợp chính quyền địa phương xây dựng mô hình khu phố an toàn, cải thiện chiếu sáng công cộng để giảm điểm khuất tầm nhìn.',
  },
};

// Sinh đề xuất nâng cấp cho từng khu vực bằng thuật toán quy tắc thuần tuý:
// mức độ nghiêm trọng suy từ số lượng báo cáo, nội dung đề xuất lấy từ kịch
// bản có sẵn theo loại sự cố chiếm đa số. Không có bước gọi AI nào ở đây.
export function generateAreaProposals(groups: AreaGroup[]): AreaProposal[] {
  return groups
    .filter((g) => g.items.length > 0)
    .map((g) => {
      const n = g.items.length;
      const dom = dominantType(g.items);
      const scenario = AREA_SCENARIOS[dom];
      return {
        area: g.key,
        center: g.center,
        reportCount: n,
        severity: severityFromCount(n),
        analysis_summary: scenario.summary(n),
        short_term_solutions: scenario.short_term,
        long_term_planning: scenario.long_term,
        dominant_type: dom,
      };
    })
    .sort((a, b) => b.reportCount - a.reportCount);
}

// Gom các báo cáo gần nhau (lưới ~1.1km) thành từng "khu vực" để phân tích.
export function groupIncidentsByArea(incidents: IncidentLike[]): AreaGroup[] {
  const groups = new Map<string, IncidentLike[]>();
  for (const incident of incidents) {
    const key = `${incident.coordinates.lat.toFixed(2)},${incident.coordinates.lng.toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(incident);
  }
  return [...groups.entries()].map(([key, items]) => {
    const [lat, lng] = key.split(',').map(Number);
    return { key, center: { lat, lng }, items };
  });
}
