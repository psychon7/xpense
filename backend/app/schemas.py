from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseSplitBase(BaseModel):
    user_id: int
    amount: float
    percentage: Optional[float] = None

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplit(ExpenseSplitBase):
    id: int
    expense_id: int
    is_paid: bool

    class Config:
        from_attributes = True

class ExpenseCommentBase(BaseModel):
    comment: str

class ExpenseCommentCreate(ExpenseCommentBase):
    pass

class ExpenseComment(ExpenseCommentBase):
    id: int
    expense_id: int
    user_id: int
    created_at: datetime
    user: User

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    title: str
    amount: float
    description: str
    category: Optional[str] = None
    split_type: str = "equal"

class ExpenseCreate(ExpenseBase):
    participant_ids: List[int]
    custom_splits: Optional[List[ExpenseSplitCreate]] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_settled: Optional[bool] = None

class Expense(ExpenseBase):
    id: int
    creator_id: int
    date: datetime
    bill_image_url: Optional[str] = None
    ocr_text: Optional[str] = None
    is_settled: bool
    creator: User
    participants: List[User]
    custom_splits: List[ExpenseSplit]
    comments: List[ExpenseComment]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
