from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_session
from backend.app.models.user import User
from backend.app.schemas.analytics import IndicatorResponse
from backend.app.services.analytics_service import AnalyticsService
from backend.app.services.market_data_service import (
    MarketDataProviderError,
    MarketDataValidationError,
)

router = APIRouter()


@router.get("/{ticker}/sma", response_model=IndicatorResponse)
def get_sma(
    ticker: str,
    window: int = Query(default=20, ge=AnalyticsService.MIN_WINDOW, le=AnalyticsService.MAX_WINDOW),
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
    refresh: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> IndicatorResponse:
    del current_user
    service = AnalyticsService(session)
    try:
        return service.get_sma(ticker, window, period, interval, refresh)
    except MarketDataValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except MarketDataProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/{ticker}/ema", response_model=IndicatorResponse)
def get_ema(
    ticker: str,
    window: int = Query(default=20, ge=AnalyticsService.MIN_WINDOW, le=AnalyticsService.MAX_WINDOW),
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
    refresh: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> IndicatorResponse:
    del current_user
    service = AnalyticsService(session)
    try:
        return service.get_ema(ticker, window, period, interval, refresh)
    except MarketDataValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except MarketDataProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
