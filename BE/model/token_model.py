from pydantic import BaseModel

class TokenEvent(BaseModel):
    token: str = "USDC"
    token_address: str = "0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7"
    pool_address: str = "0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0"
    time: dict
    events: list  | None = None

class TokenFee(BaseModel):
    token: str = "USDC"
    token_address: str ="0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7"
    pool_address: str = "0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0"
    total_fee: float = 0.0

