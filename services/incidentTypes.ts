// Single source of truth for the 4 report categories. Used by the report
// form, the map markers/legend, and the admin proposal grouping labels.
export type IncidentType = 'environment' | 'infrastructure' | 'utilities' | 'safety';

export interface IncidentTypeMeta {
  label: string;
  icon: string;
  color: string; // hex, used for map pins + UI accents
}

export const INCIDENT_TYPES: Record<IncidentType, IncidentTypeMeta> = {
  environment: {
    label: 'Môi trường và vệ sinh',
    icon: '🧹',
    color: '#16a34a',
  },
  infrastructure: {
    label: 'Hạ tầng giao thông',
    icon: '🚧',
    color: '#f97316',
  },
  utilities: {
    label: 'Tiện ích công cộng',
    icon: '💡',
    color: '#2563eb',
  },
  safety: {
    label: 'Trật tự và an toàn',
    icon: '🚨',
    color: '#dc2626',
  },
};

export const INCIDENT_TYPE_ORDER: IncidentType[] = [
  'environment',
  'infrastructure',
  'utilities',
  'safety',
];

// ---------------------------------------------------------------------------
// Lựa chọn chi tiết (sub-type) cho từng nhóm sự cố. Thay vì gõ mô tả tự do,
// người dùng chỉ cần chạm chọn đúng tình huống đang gặp phải.
// `managementAction` là gợi ý xử lý dành cho phía cơ quan quản lý hạ tầng đô
// thị, hiển thị trong trang /admin — đặt mình vào vị trí đơn vị tiếp nhận
// phản ánh để trả lời "sẽ làm gì với sự cố này".
// ---------------------------------------------------------------------------

export interface IncidentSubTypeMeta {
  label: string;
  managementAction: string;
}

export const INCIDENT_SUBTYPES: Record<IncidentType, Record<string, IncidentSubTypeMeta>> = {
  environment: {
    waste: {
      label: 'Rác thải chưa thu gom',
      managementAction:
        'Điều xe/đội vệ sinh môi trường đến thu gom trong vòng 24h và tăng tần suất thu gom định kỳ tại điểm này.',
    },
    drainage: {
      label: 'Cống rãnh tắc nghẽn / ứ nước',
      managementAction:
        'Cử đội thoát nước đô thị khơi thông cống rãnh, kiểm tra nguyên nhân ứ đọng để tránh tái diễn.',
    },
    pollution: {
      label: 'Ô nhiễm / mùi hôi',
      managementAction:
        'Cử cán bộ môi trường xuống kiểm tra nguồn gây ô nhiễm, lập biên bản và xử lý theo quy định nếu phát hiện xả thải sai quy định.',
    },
    trees: {
      label: 'Cây xanh gãy đổ / cần cắt tỉa',
      managementAction:
        'Điều đội cây xanh đô thị đến xử lý cành/cây gãy đổ, rào chắn khu vực nguy hiểm và lên lịch cắt tỉa định kỳ.',
    },
    other: {
      label: 'Khác',
      managementAction: 'Cử cán bộ phụ trách địa bàn khảo sát thực tế để xác định hướng xử lý phù hợp.',
    },
  },
  infrastructure: {
    flooding: {
      label: 'Ngập đường',
      managementAction:
        'Triển khai bơm thoát nước khẩn cấp, cắm biển cảnh báo ngập và điều tiết giao thông quanh khu vực.',
    },
    road_damage: {
      label: 'Đường hư hỏng / ổ gà',
      managementAction:
        'Cử đội duy tu vá tạm ổ gà trong tuần, đặt biển cảnh báo/rào chắn tại điểm hư hỏng chờ sửa chữa chính thức.',
    },
    construction: {
      label: 'Công trình thi công lấn đường',
      managementAction:
        'Kiểm tra giấy phép thi công, yêu cầu đơn vị thi công thu hẹp phạm vi rào chắn và bổ sung biển báo/đèn cảnh báo.',
    },
    traffic_jam: {
      label: 'Kẹt xe kéo dài',
      managementAction:
        'Điều động CSGT/dân phòng phân luồng giờ cao điểm, xem xét điều chỉnh chu kỳ đèn tín hiệu tại nút giao.',
    },
    other: {
      label: 'Khác',
      managementAction:
        'Cử đội duy tu hạ tầng khảo sát hiện trường, phân loại mức độ ưu tiên và lên phương án xử lý phù hợp.',
    },
  },
  utilities: {
    streetlight: {
      label: 'Thiếu / hỏng đèn đường',
      managementAction:
        'Cử điện lực/đơn vị chiếu sáng công cộng kiểm tra và thay thế bóng đèn hoặc thiết bị hỏng trong thời gian sớm nhất.',
    },
    signage: {
      label: 'Biển báo hư hỏng / thiếu',
      managementAction:
        'Kiểm tra hiện trạng biển báo, khôi phục hoặc lắp mới theo đúng quy chuẩn giao thông.',
    },
    furniture: {
      label: 'Ghế đá / thùng rác công cộng hư hỏng',
      managementAction:
        'Cử đội hạ tầng đô thị sửa chữa hoặc thay thế thiết bị công cộng bị hư hỏng.',
    },
    bus_stop: {
      label: 'Trạm chờ xe buýt xuống cấp',
      managementAction:
        'Phối hợp đơn vị quản lý vận tải công cộng kiểm tra, sửa chữa mái che/ghế ngồi tại trạm chờ.',
    },
    sidewalk_blocked: {
      label: 'Vỉa hè bị lấn chiếm',
      managementAction:
        'Cử lực lượng trật tự đô thị nhắc nhở, xử lý vi phạm lấn chiếm vỉa hè theo quy định.',
    },
    other: {
      label: 'Khác',
      managementAction: 'Cử cán bộ phụ trách địa bàn khảo sát và bổ sung/khắc phục tiện ích còn thiếu.',
    },
  },
  safety: {
    traffic_accident: {
      label: 'Tai nạn giao thông',
      managementAction:
        'Báo ngay CSGT và y tế đến hiện trường, phân luồng giao thông tạm thời quanh khu vực tai nạn.',
    },
    theft: {
      label: 'Trộm cắp / cướp giật',
      managementAction:
        'Chuyển thông tin tới công an khu vực để xác minh, tăng cường tuần tra và rà soát camera an ninh gần đó.',
    },
    disturbance: {
      label: 'Tụ tập gây rối / ẩu đả',
      managementAction:
        'Điều lực lượng công an/dân phòng đến giải tán, đảm bảo an ninh trật tự khu vực.',
    },
    fire: {
      label: 'Cháy nổ',
      managementAction:
        'Báo ngay lực lượng phòng cháy chữa cháy (114) và phong tỏa khu vực nguy hiểm để đảm bảo an toàn.',
    },
    other: {
      label: 'Khác',
      managementAction: 'Chuyển thông tin tới lực lượng công an/dân phòng khu vực để xác minh và xử lý.',
    },
  },
};

export const INCIDENT_SUBTYPE_ORDER: Record<IncidentType, string[]> = {
  environment: ['waste', 'drainage', 'pollution', 'trees', 'other'],
  infrastructure: ['flooding', 'road_damage', 'construction', 'traffic_jam', 'other'],
  utilities: ['streetlight', 'signage', 'furniture', 'bus_stop', 'sidewalk_blocked', 'other'],
  safety: ['traffic_accident', 'theft', 'disturbance', 'fire', 'other'],
};
