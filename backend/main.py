from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, File, UploadFile
from fastapi import FastAPI
from pydantic import BaseModel
import logging
import os
import platform
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import jwt
import time
from typing import List
import json
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

# Import pycaw only if running on Windows
if platform.system() == "Windows":
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from comtypes import CLSCTX_ALL

import subprocess


# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Initialize FastAPI app
app = FastAPI()

# Define allowed origins explicitly
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3000/dashboard",
    "http://127.0.0.1:3000/dashboard",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use explicit origins
    allow_credentials=True,  # Required for authentication
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Mock database and JWT secret
users_db = {
    "mereckmcg@gmail.com": {"password": "test"},
}

JWT_SECRET = "your_jwt_secret"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Spotify OAuth Credentials
CLIENT_ID = "24c09368d3394fec8a58788383ff9d60"
CLIENT_SECRET = "6d7b743de51b4e0498c0ce3943ba4ba3"
REDIRECT_URI = "http://127.0.0.1:8000/callback"
SCOPE = "user-library-read user-read-playback-state user-modify-playback-state"


#Volume for pi
def set_volume(level: int):
    # level is between 0 and 100
    subprocess.run(["amixer", "sset", "PCM", f"{level}%"])

# def set_volume(level: float):
#     devices = AudioUtilities.GetSpeakers()
#     interface = devices.Activate(
#         IAudioEndpointVolume._iid_, 
#         CLSCTX_ALL, 
#         None
#     )
#     volume = interface.QueryInterface(IAudioEndpointVolume)
#     volume.SetMasterVolumeLevelScalar(level, None)  # level is between 0.0 and 1.0
class VolumeRequest(BaseModel):
    level: float  # 0.0 to 1.0 for Windows, 0-100 for Raspberry Pi

@app.post("/set-volume")
async def change_volume(request: VolumeRequest):
    set_volume(request.level)
    return {"status": "success"}


@app.get("/")
async def root():
    return {"message": "Hello, World!"}
# Initialize Spotipy OAuth Manager
sp_oauth = SpotifyOAuth(client_id=CLIENT_ID, client_secret=CLIENT_SECRET, redirect_uri=REDIRECT_URI, scope=SCOPE)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Add logic to validate the token (e.g., check expiry)
    return token
# Global variable for storing the Spotify client and token info
sp = None
token_info = {}

# User model for login
class User(BaseModel):
    email: str
    password: str

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info("New WebSocket connection established.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logging.info("WebSocket disconnected.")

    async def send_message(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
            logging.info(f"Sent message: {message}")

manager = ConnectionManager()

# Directory to store uploaded files
UPLOAD_DIRECTORY = "uploaded_files"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)  # Create the folder if it doesn't exist

restricted_extensions = {".exe", ".bat", ".sh", ".cmd"}
def is_token_expired(token_info):
    if not token_info or "expires_at" not in token_info:
        return True
    return time.time() > token_info["expires_at"]
# Helper function to refresh the Spotify token
def refresh_spotify_token():
    global sp, token_info

    # Check if the refresh token is available
    if not token_info or "refresh_token" not in token_info:
        logging.error("Refresh token not available.")
        raise HTTPException(status_code=401, detail="Refresh token not available.")

    # Refresh the access token using the refresh token
    try:
        new_token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
        if "access_token" not in new_token_info:
            logging.error("Failed to refresh access token.")
            raise HTTPException(status_code=401, detail="Failed to refresh access token.")

        # Update the global token_info with the new token
        token_info.update(new_token_info)

        # Update the Spotify client with the new access token
        sp = spotipy.Spotify(auth=token_info["access_token"])
        logging.info(f"Access token refreshed: {token_info['access_token']}")

        return sp
    except Exception as e:
        logging.error(f"Error refreshing access token: {e}")
        raise HTTPException(status_code=500, detail="Error refreshing access token.")

# File upload endpoint
@app.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...)):
    # Check the file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension in restricted_extensions:
        raise HTTPException(status_code=400, detail="This file type is not allowed.")
    
    # Save the file to a directory with a unique filename
    file_path = os.path.join(UPLOAD_DIRECTORY, f"uploaded_{file.filename}")
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    response = JSONResponse(content={"message": "success"})
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    return {"filename": file.filename}

# Function to authenticate and get a new Spotify client
def authenticate_spotify():
    global sp, token_info
    sp_oauth = SpotifyOAuth(client_id=CLIENT_ID,
                             client_secret=CLIENT_SECRET,
                             redirect_uri=REDIRECT_URI,
                             scope=SCOPE)

    # Check if we have an access token
    token_info = sp_oauth.get_cached_token()

    if token_info:
        # If we have an access token, initialize Spotify client
        sp = spotipy.Spotify(auth=token_info['access_token'])
        logging.info(f"Spotify client initialized with access token: {token_info['access_token']}")
        return sp
    else:
        # If no token is found, trigger the OAuth flow
        raise HTTPException(status_code=401, detail="Spotify not authenticated.")
    
# @app.get("/current_song")
# async def get_current_song():
#     global sp

#     # If Spotify client is not authenticated, attempt to authenticate
#     if sp is None:
#         sp = authenticate_spotify()

#     if sp is None:
#         logging.error("Spotify client is not authenticated.")
#         raise HTTPException(status_code=401, detail="Spotify client not authenticated.")
    
#     try:
#         # Refresh token if necessary
#         sp = refresh_spotify_token()
        
#         # Fetch current song details
#         current_track = sp.current_playback()
#         if current_track is None or 'item' not in current_track:
#             raise HTTPException(status_code=404, detail="No song currently playing.")
        
#         song = current_track['item']
#         song_info = {
#             "name": song['name'],
#             "artist": song['artists'][0]['name'],
#             "album_cover": song['album']['images'][0]['url'] if song['album']['images'] else None,
#             "track_url": song['external_urls']['spotify']
#         }

#         return JSONResponse(content=song_info)
    
#     except Exception as e:
#         logging.error(f"Error fetching current song: {e}")
#         raise HTTPException(status_code=500, detail=f"Error fetching current song: {str(e)}")
@app.get("/current_song")
async def get_current_song(token: str = Depends(get_current_user)):
    global sp, token_info

    # Check if the token is expired and refresh it if necessary
    if is_token_expired(token_info):
        logging.info("Access token expired. Refreshing...")
        sp = refresh_spotify_token()

    if sp is None:
        logging.error("Spotify client is not authenticated.")
        raise HTTPException(status_code=401, detail="Spotify client not authenticated.")
    
    try:
        # Fetch current song details
        current_track = sp.current_playback()
        if current_track is None or 'item' not in current_track:
            raise HTTPException(status_code=404, detail="No song currently playing.")
        
        song = current_track['item']
        song_info = {
            "name": song['name'],
            "artist": song['artists'][0]['name'],
            "album_cover": song['album']['images'][0]['url'] if song['album']['images'] else None,
            "track_url": song['external_urls']['spotify']
        }

        return JSONResponse(content=song_info)
    
    except Exception as e:
        logging.error(f"Error fetching current song: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching current song: {str(e)}")
    

# /play route starts playback
@app.post("/play")
async def play_song():
    global sp, token_info

    # Check if the token is expired and refresh it if necessary
    if is_token_expired(token_info):
        logging.info("Access token expired. Refreshing...")
        sp = refresh_spotify_token()

    if sp is None:
        logging.error("Spotify client is not authenticated.")
        raise HTTPException(status_code=401, detail="Spotify client not authenticated.")
    
    try:
        sp.start_playback()
        return {"message": "Playback started"}
    except Exception as e:
        logging.error(f"Error starting playback: {e}")
        raise HTTPException(status_code=500, detail="Error starting playback.")

# /pause route pauses playback
@app.post("/pause")
async def pause_song():
    sp_client = refresh_spotify_token()
    if sp_client is None:
        logging.error("Spotify client is not authenticated.")
        raise HTTPException(status_code=401, detail="Spotify client not authenticated.")
    
    try:
        sp_client.pause_playback()
        return {"message": "Playback paused"}
    except Exception as e:
        logging.error(f"Error pausing playback: {e}")
        raise HTTPException(status_code=500, detail="Error pausing playback.")

# /skip route skips to the next track
@app.post("/skip")
async def skip_song():
    sp = refresh_spotify_token()
    
    try:
        sp.next_track()
        response = JSONResponse(content={"message": "success"})
        return {"message": "Skipped to next track"}
    except Exception as e:
        logging.error(f"Error skipping track: {e}")
        raise HTTPException(status_code=500, detail="Error skipping track.")

# /previous route goes to the previous track
@app.post("/previous")
async def previous_song():
    sp = refresh_spotify_token()
    
    try:
        sp.previous_track()
        response = JSONResponse(content={"message": "success"})
        return {"message": "Went back to previous track"}
    except Exception as e:
        logging.error(f"Error going to previous track: {e}")
        raise HTTPException(status_code=500, detail="Error going to previous track.")
    

# Start Spotify login
@app.get("/spotify_login")
async def spotify_login():
    auth_url = sp_oauth.get_authorize_url()
    return RedirectResponse(url=auth_url)

@app.get("/callback")
async def spotify_callback(request: Request):
    global token_info

    # Extract the authorization code from the URL
    code = request.query_params.get("code")
    if not code:
        return JSONResponse(status_code=400, content={"error": "Authorization code missing"})

    try:
        # Exchange the authorization code for tokens
        token_info = sp_oauth.get_access_token(code)
        if "access_token" not in token_info:
            return JSONResponse(status_code=400, content={"error": "Failed to get access token"})

        # Log the tokens for debugging
        logging.info(f"Access token retrieved: {token_info['access_token']}")
        logging.info(f"Refresh token retrieved: {token_info.get('refresh_token')}")

        # Redirect to the frontend with the access token
        frontend_url = f"http://localhost:3000/dashboard/?token={token_info['access_token']}"
        return RedirectResponse(url=frontend_url)

    except Exception as e:
        logging.error(f"Error during callback: {e}")
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
    
# JWT login route for login authentication
@app.post("/jwt_login")
async def jwt_login(user: User):
    if user.email in users_db and users_db[user.email]["password"] == user.password:
        token = jwt.encode({"sub": user.email}, JWT_SECRET, algorithm="HS256")
        return {"token": token}
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logging.info(f"WebSocket connection established from {websocket.client}")
    
    try:
        while True:
            # Receive data as a string from the WebSocket
            message = await websocket.receive_text()  
            logging.info(f"Received message: {message}")
            
            try:
                # Attempt to parse the received message as JSON
                color_data = json.loads(message)
                logging.info(f"Received color data: {color_data}")
                
                # You can add logic to handle the color data, for example:
                color = color_data.get("color", "unknown")  # Use a default if 'color' key is missing
                
                # Send a JSON message back to the client
                response_message = json.dumps({"message": f"Color changed to: {color}"})
                await manager.send_message(response_message)
                
            except json.JSONDecodeError:
                # Handle the case where the message is not valid JSON
                logging.error("Invalid JSON received.")
                await websocket.send_text("Error: Invalid JSON format received.")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logging.info(f"WebSocket client {websocket.client} disconnected.")