from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager

from TikTokApi import TikTokApi
from typing import Optional
from secrets import MSTOKEN
import asyncio
import os
import io
import traceback

tiktok_api = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tiktok_api
    tiktok_api = TikTokApi()
    ms_token = MSTOKEN
    await tiktok_api.create_sessions(ms_tokens=[ms_token], num_sessions=1, sleep_after=3, headless=False)
    yield
    if tiktok_api:
        await tiktok_api.close_sessions()
        await tiktok_api.stop_playwright()

app = FastAPI(lifespan=lifespan)

@app.get('/user/info/{username}')
async def get_user_info(username: str):
    try:
        user = tiktok_api.user(username=username)
        user_data = await user.info()
        return JSONResponse(content=user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/search/{name}')
async def search_users(name: str, count: Optional[int] = 5):
    try:
        users = []
        async for user in tiktok_api.search.users(name, count=count):
            print(user.username)
            users.append(user.as_dict)
        return JSONResponse(content=users)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/user/videos')
async def user_videos(username: str):
    try:
        print("user videos for", username)
        videos = []
        async for video in tiktok_api.user(username=username).videos(count=5):
            print(video)
            videos.append(video.as_dict)
        return JSONResponse(content=videos)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/video/comments')
async def video_comments(video_id: str):
    try:
        video = tiktok_api.video(id=video_id)
        comments = []
        async for comment in video.comments(count=20):
            print(comment.as_dict)
            comments.append({
                "id": comment.id,
                "text": comment.text,
                "author": {
                    "username": comment.author.username,
                    "id": comment.author.user_id,
                    "thumbnail": comment.as_dict["user"]["avatar_thumb"]["url_list"][0]
                },
                "likes_count": comment.likes_count,
                "reply_total": comment.as_dict["reply_comment_total"],
                "create_time": comment.as_dict["create_time"]
            })
        return JSONResponse(content=comments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/video/stream')
async def stream_videos(url: str):
    try:
        video = tiktok_api.video(url=url)
        await video.info()
        video_bytes = await video.bytes()
        return StreamingResponse(io.BytesIO(video_bytes), media_type="video/mp4")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/video/info')
async def video_info(url: str):
    try:
        video = tiktok_api.video(url=url)
        info = await video.info()
        return JSONResponse(content=info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3002)
