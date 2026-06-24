# BCA AI Backend — GLM-5.2 (Z.ai) Primary, OpenAI Fallback

"""
Drop this file into backend/ of every BCA app.
Usage:
    from ai_client import chat_complete

    response = await chat_complete(
        system="You are a restaurant cost analyst.",
        user="Calculate food cost for this recipe: ...",
    )
"""

import os
import httpx
from openai import AsyncOpenAI

# ── Provider config ──────────────────────────────────────────────────────────

GLM_API_KEY   = os.environ.get("GLM_API_KEY")          # Z.ai key
GLM_BASE_URL  = "https://open.bigmodel.cn/api/paas/v4"
GLM_MODEL     = os.environ.get("GLM_MODEL", "glm-5.2") # or glm-4-plus

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL   = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# ── Primary: GLM-5.2 via Z.ai (OpenAI-compatible endpoint) ──────────────────

async def _glm_complete(system: str, user: str, **kwargs) -> str:
    client = AsyncOpenAI(api_key=GLM_API_KEY, base_url=GLM_BASE_URL)
    completion = await client.chat.completions.create(
        model=GLM_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        **kwargs,
    )
    return completion.choices[0].message.content

# ── Fallback: OpenAI ─────────────────────────────────────────────────────────

async def _openai_complete(system: str, user: str, **kwargs) -> str:
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    completion = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        **kwargs,
    )
    return completion.choices[0].message.content

# ── Public interface ─────────────────────────────────────────────────────────

async def chat_complete(system: str, user: str, **kwargs) -> str:
    """
    Try GLM-5.2 first. If unavailable or unconfigured, fall back to OpenAI.
    Raises RuntimeError if neither provider is configured.
    """
    if GLM_API_KEY:
        try:
            return await _glm_complete(system, user, **kwargs)
        except Exception as glm_err:
            if not OPENAI_API_KEY:
                raise RuntimeError(f"GLM failed and no OpenAI fallback configured: {glm_err}")
            # fall through to OpenAI

    if OPENAI_API_KEY:
        return await _openai_complete(system, user, **kwargs)

    raise RuntimeError(
        "No AI provider configured. Set GLM_API_KEY (preferred) or OPENAI_API_KEY."
    )
