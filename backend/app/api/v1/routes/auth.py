from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_session
from backend.app.models.user import User
from backend.app.schemas.auth import (
    AuthTokensResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from backend.app.schemas.user import UserRead
from backend.app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_session)) -> UserRead:
    service = AuthService(session)
    try:
        user = service.register_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
        )
        return UserRead.model_validate(user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=AuthTokensResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> AuthTokensResponse:
    service = AuthService(session)
    user = service.authenticate_user(identifier=payload.identifier, password=payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = service.issue_access_token(user)
    refresh_token = service.issue_refresh_token(user)
    return AuthTokensResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    payload: RefreshTokenRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    service = AuthService(session)
    try:
        user = service.user_from_refresh_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    access_token = service.issue_access_token(user)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
