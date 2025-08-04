from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

from services.icebreaker_service import IcebreakerService
from services.personality_service import PersonalityService
from services.matching_service import MatchingService
from services.moderation_service import ModerationService

load_dotenv()

app = FastAPI(
    title="MindMatch AI Services",
    description="AI microservices for personality matching and conversation enhancement",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
icebreaker_service = IcebreakerService()
personality_service = PersonalityService()
matching_service = MatchingService()
moderation_service = ModerationService()

# Pydantic models
class IcebreakerRequest(BaseModel):
    user1_id: str
    user2_id: str
    conversation_history: List[Dict[str, Any]] = []
    context: Optional[Dict[str, Any]] = None

class PersonalityAnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    context_type: str = "profile"  # profile, message, prompt_answer

class MatchingRequest(BaseModel):
    user_id: str
    candidate_ids: List[str]
    preferences: Optional[Dict[str, Any]] = None

class ModerationRequest(BaseModel):
    content: str
    content_type: str = "text"  # text, image, audio
    user_id: Optional[str] = None

class PersonalityQuizRequest(BaseModel):
    responses: List[Dict[str, Any]]
    user_id: str

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mindmatch-ai"}

# Icebreaker endpoints
@app.post("/icebreakers/generate")
async def generate_icebreakers(request: IcebreakerRequest):
    """Generate contextual icebreaker questions for a match"""
    try:
        icebreakers = await icebreaker_service.generate_icebreakers(
            user1_id=request.user1_id,
            user2_id=request.user2_id,
            conversation_history=request.conversation_history,
            context=request.context
        )
        return {"icebreakers": icebreakers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/icebreakers/suggest-response")
async def suggest_response(request: dict):
    """Suggest responses to help users continue conversations"""
    try:
        suggestions = await icebreaker_service.suggest_responses(
            message=request.get("message", ""),
            context=request.get("context", {})
        )
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Personality analysis endpoints
@app.post("/personality/analyze-text")
async def analyze_personality_from_text(request: PersonalityAnalysisRequest):
    """Analyze personality traits from text content"""
    try:
        analysis = await personality_service.analyze_text(
            text=request.text,
            user_id=request.user_id,
            context_type=request.context_type
        )
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/personality/process-quiz")
async def process_personality_quiz(request: PersonalityQuizRequest):
    """Process personality quiz responses and generate scores"""
    try:
        scores = await personality_service.process_quiz_responses(
            responses=request.responses,
            user_id=request.user_id
        )
        return {"scores": scores}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/personality/compatibility/{user1_id}/{user2_id}")
async def calculate_compatibility(user1_id: str, user2_id: str):
    """Calculate compatibility score between two users"""
    try:
        compatibility = await personality_service.calculate_compatibility(
            user1_id=user1_id,
            user2_id=user2_id
        )
        return {"compatibility": compatibility}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Matching endpoints
@app.post("/matching/rank-candidates")
async def rank_candidates(request: MatchingRequest):
    """Rank potential matches based on compatibility"""
    try:
        ranked_candidates = await matching_service.rank_candidates(
            user_id=request.user_id,
            candidate_ids=request.candidate_ids,
            preferences=request.preferences
        )
        return {"ranked_candidates": ranked_candidates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/matching/suggestions/{user_id}")
async def get_match_suggestions(user_id: str, limit: int = 20):
    """Get personalized match suggestions"""
    try:
        suggestions = await matching_service.get_suggestions(
            user_id=user_id,
            limit=limit
        )
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Moderation endpoints
@app.post("/moderation/check-content")
async def check_content(request: ModerationRequest):
    """Check content for inappropriate material"""
    try:
        moderation_result = await moderation_service.check_content(
            content=request.content,
            content_type=request.content_type,
            user_id=request.user_id
        )
        return {"moderation": moderation_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/moderation/flag-content")
async def flag_content(request: dict):
    """Flag content for manual review"""
    try:
        result = await moderation_service.flag_content(
            content_id=request.get("content_id"),
            reason=request.get("reason"),
            reporter_id=request.get("reporter_id")
        )
        return {"flagged": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)