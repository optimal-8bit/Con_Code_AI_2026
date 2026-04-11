"""
Authentication routes: register, login, refresh token, profile.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status, Depends

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
