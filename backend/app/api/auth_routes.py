"""
Authentication routes: register, login, refresh token, profile.
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.models.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileUpdate,
    UserResponse,
)
from app.services.data_service import user_service

auth_router = APIRouter()


def _user_to_response(user: dict) -> dict:
    safe = user_service.safe_user(user)
    return safe


@auth_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    user = user_service.create_user(payload.model_dump())
    if not user:
        raise HTTPException(status_code=409, detail="Email already registered.")

    safe = user_service.safe_user(user)
    token_data = {"sub": user["id"], "email": user["email"], "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=safe,
    )


@auth_router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = user_service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    safe = user_service.safe_user(user)
    token_data = {"sub": user["id"], "email": user["email"], "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=safe,
    )


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token.")
        
        user = user_service.get_by_id(decoded["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")

        safe = user_service.safe_user(user)
        token_data = {"sub": user["id"], "email": user["email"], "role": user["role"]}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=safe,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token refresh failed.")


@auth_router.get("/me", response_model=dict)
def get_me(current_user: dict = Depends(get_current_user)):
    user = user_service.get_by_id(current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_service.safe_user(user)


@auth_router.patch("/me", response_model=dict)
def update_profile(payload: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    user = user_service.update_user(current_user["sub"], updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_service.safe_user(user)


@auth_router.post("/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    ok = user_service.change_password(current_user["sub"], payload.old_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Old password is incorrect.")
    return MessageResponse(message="Password changed successfully.")


@auth_router.get("/google/login")
def google_login():
    """Redirect to Google OAuth consent screen"""
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={settings.google_redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    return {"auth_url": google_auth_url}


@auth_router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if user_info_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            user_info = user_info_response.json()
            
            # Check if user exists, if not create new user
            email = user_info.get("email")
            name = user_info.get("name", email.split("@")[0])
            
            user = user_service.get_by_email(email)
            
            if not user:
                # Create new user with Google OAuth
                user_data = {
                    "name": name,
                    "email": email,
                    "password": "",  # No password for OAuth users
                    "role": "patient",  # Default role
                    "phone": None,
                    "profile": {
                        "oauth_provider": "google",
                        "google_id": user_info.get("id"),
                        "picture": user_info.get("picture"),
                    }
                }
                user = user_service.create_user(user_data, skip_password_hash=True)
                if not user:
                    raise HTTPException(status_code=500, detail="Failed to create user")
            
            # Generate JWT tokens
            safe = user_service.safe_user(user)
            token_data = {"sub": user["id"], "email": user["email"], "role": user["role"]}
            
            # Redirect to frontend with tokens and user data
            jwt_access = create_access_token(token_data)
            jwt_refresh = create_refresh_token(token_data)
            
            # Encode user data as base64 to pass in URL
            import base64
            import json
            user_json = json.dumps(safe)
            user_b64 = base64.urlsafe_b64encode(user_json.encode()).decode()
            
            # Redirect to React frontend with tokens and user data in URL
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/callback?access_token={jwt_access}&refresh_token={jwt_refresh}&user={user_b64}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")
