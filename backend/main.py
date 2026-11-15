# SPDX-License-Identifier: AGPL-3.0-or-later
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import asyncio
import os
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("juman")

app = FastAPI()

_allowed_origins = os.environ.get(
    "JUMAN_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


class ApprovalRequest(BaseModel):
    tool_call_id: str
    approved: bool


CANNED_ANSWER = (
    "يُقدَّم طلب تجديد الترخيص إلكترونيًا عبر بوابة الخدمات قبل 30 يومًا من "
    "تاريخ انتهائه، ويُرفق به السجل التجاري ساري المفعول. مدة المعالجة "
    "5 أيام عمل، ويصل الإشعار بالنتيجة عبر البريد الإلكتروني المسجَّل."
)
CANNED_SOURCE = "https://example.com/services/license-renewal"

NOT_COVERED_AR = "عذرًا، هذا الموضوع غير مشمول بمحتوى الموقع."

# In-memory store for pending tool calls (spike only)
pending_actions: dict[str, dict] = {}


async def stream_chunks(text: str):
    words = text.split(" ")
    for word in words:
        yield word + " "
        await asyncio.sleep(0.03)


@app.post("/chat")
async def chat(req: ChatRequest):
    last = req.messages[-1].content.lower() if req.messages else ""

    if "ترخيص" in last or "license" in last:
        body = CANNED_ANSWER + f"

[المصدر]({CANNED_SOURCE})"
        return StreamingResponse(stream_chunks(body), media_type="text/plain; charset=utf-8")

    if "مسودة" in last or "draft" in last:
        # Propose a draft that requires human approval
        tool_call_id = str(uuid.uuid4())
        title = "مسودة خطاب رسمي"
        draft_body = "نص المسودة التجريبي — يُعدَّل حسب الحاجة."
        pending_actions[tool_call_id] = {
            "status": "pending",
            "title": title,
            "body": draft_body,
        }
        logger.info(f"TOOL PENDING  id={tool_call_id} title=\"{title}\"")
        return JSONResponse({
            "type": "tool-call",
            "tool_call_id": tool_call_id,
            "tool_name": "create_draft",
            "args": {"title": title, "body": draft_body},
        })

    # Not covered — return structured JSON
    return JSONResponse({
        "type": "not-covered",
        "message": NOT_COVERED_AR,
    })


@app.post("/tool/approve")
async def tool_approve(req: ApprovalRequest):
    action = pending_actions.get(req.tool_call_id)
    if not action:
        logger.info(f"TOOL REFUSED   id={req.tool_call_id} reason=not_found")
        raise HTTPException(status_code=404, detail="No pending action with this id")

    if action["status"] != "pending":
        logger.info(f"TOOL REFUSED   id={req.tool_call_id} reason=already_{action['status']}")
        raise HTTPException(status_code=409, detail=f"Action already {action['status']}")

    if req.approved:
        action["status"] = "approved"
        logger.info(f"TOOL APPROVED  id={req.tool_call_id} title=\"{action['title']}\"")
        return {"status": "approved", "message": "تمت الموافقة على المسودة وحُفظت."}
    else:
        action["status"] = "rejected"
        logger.info(f"TOOL REJECTED  id={req.tool_call_id} title=\"{action['title']}\"")
        return {"status": "rejected", "message": "رُفضت المسودة ولم تُحفظ."}
