from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import json

# ==========================================
# CẤU HÌNH API KEY (Thay bằng Key của bạn)
# ==========================================
GEMINI_API_KEY = "AQ.Ab8RN6Kqpf6IyqtSeEA0KCYPLlMIB9aoAe0yNu0EGErAg53EwA"
genai.configure(api_key=GEMINI_API_KEY)

# Khởi tạo model (Dùng bản 1.5 Flash cho tốc độ siêu nhanh)
model = genai.GenerativeModel('gemini-3.5-flash')

app = FastAPI(title="Civic Tech AI - Hackathon Backend")

# ==========================================
# KHAI BÁO CẤU TRÚC DỮ LIỆU (DATA MODELS)
# ==========================================
class Feedback(BaseModel):
    id: str
    type: int
    lat: float
    lng: float
    time: int
    content: str

class AreaData(BaseModel):
    area_name: str
    feedbacks: List[Feedback]

# ==========================================
# API ENDPOINT ĐỂ AI ĐỀ XUẤT Ý TƯỞNG
# ==========================================
@app.post("/api/generate-proposals")
async def generate_proposals(data: AreaData):
    if not data.feedbacks:
        raise HTTPException(status_code=400, detail="Khu vực này chưa có ý kiến nào.")

    # 1. Tổng hợp ý kiến thành một văn bản duy nhất để đưa cho AI
    feedback_text = "\n".join([f"- Ý kiến {i+1}: {fb.content}" for i, fb in enumerate(data.feedbacks)])

    # 2. Xây dựng Prompt
    prompt = f"""
    Bạn là một chuyên gia quy hoạch đô thị và quản lý thành phố. Dưới đây là các ý kiến và vấn đề người dân báo cáo tại khu vực '{data.area_name}':
    
    {feedback_text}
    
    Dựa trên các dữ liệu trên, hãy phân tích và trả về ĐÚNG định dạng JSON sau (không chứa markdown hay text thừa):
    {{
        "severity": "Cao/Trung bình/Thấp",
        "analysis_summary": "Tóm tắt ngắn gọn vấn đề chính",
        "short_term_solutions": [
            "Giải pháp 1",
            "Giải pháp 2"
        ],
        "long_term_planning": "Một đề xuất quy hoạch dài hạn"
    }}
    """

    try:
        # 3. Gọi Gemini API (Ép kiểu trả về là JSON để dễ parse)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # 4. Trả kết quả về cho Frontend
        return json.loads(response.text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUTE KIỂM TRA SERVER
# ==========================================
@app.get("/")
def read_root():
    return {"message": "Server đang chạy!"}