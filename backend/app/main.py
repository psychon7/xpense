from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
from . import models, schemas, auth, utils
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xpense API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3006",
    "http://127.0.0.1:3006",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Auth endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post("/users/", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=auth.get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Expense endpoints
@app.post("/expenses/", response_model=schemas.Expense)
async def create_expense(
    title: str = Form(...),
    amount: float = Form(None),
    description: str = Form(...),
    category: str = Form(None),
    split_type: str = Form("equal"),
    participant_ids: List[int] = Form(...),
    bill_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Process bill image if provided
    bill_image_url = None
    ocr_text = None
    extracted_amount = None
    
    if bill_image:
        contents = await bill_image.read()
        bill_image_url, extracted_amount, ocr_text = utils.process_bill_image(contents)
        
        # Use extracted amount if no amount was provided
        if amount is None and extracted_amount is not None:
            amount = extracted_amount
    
    if amount is None:
        raise HTTPException(status_code=400, detail="Amount is required")

    # Create expense
    db_expense = models.Expense(
        title=title,
        amount=amount,
        description=description,
        category=category,
        split_type=split_type,
        creator_id=current_user.id,
        bill_image_url=bill_image_url,
        ocr_text=ocr_text
    )
    
    # Add participants
    participants = db.query(models.User).filter(models.User.id.in_(participant_ids)).all()
    if not participants:
        raise HTTPException(status_code=404, detail="No valid participants found")
    
    db_expense.participants = participants
    
    # Create equal splits
    split_amount = amount / len(participants)
    for participant in participants:
        split = models.ExpenseSplit(
            user_id=participant.id,
            amount=split_amount
        )
        db_expense.custom_splits.append(split)
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses/", response_model=List[schemas.Expense])
async def get_expenses(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    expenses = db.query(models.Expense).filter(
        models.Expense.participants.any(id=current_user.id)
    ).offset(skip).limit(limit).all()
    return expenses

@app.post("/expenses/{expense_id}/comments/", response_model=schemas.ExpenseComment)
async def add_comment(
    expense_id: int,
    comment: schemas.ExpenseCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db_comment = models.ExpenseComment(
        expense_id=expense_id,
        user_id=current_user.id,
        comment=comment.comment
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@app.put("/expenses/{expense_id}", response_model=schemas.Expense)
async def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if db_expense.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this expense")
    
    for field, value in expense_update.dict(exclude_unset=True).items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/expenses/{expense_id}/settle", response_model=schemas.Expense)
async def settle_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if db_expense.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to settle this expense")
    
    db_expense.is_settled = True
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/balance/")
async def get_balance(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Get all expenses
    expenses = db.query(models.Expense).all()
    
    # Calculate total expenses
    total_expenses = sum(expense.amount for expense in expenses)
    
    # Calculate amount paid by current user
    user_paid = sum(
        expense.amount for expense in expenses 
        if expense.payer_id == current_user.id
    )
    
    # Calculate share per user (assuming 3 users as per PRD)
    share_per_user = total_expenses / 3
    
    # Calculate balance
    balance = user_paid - share_per_user
    
    return {
        "total_expenses": total_expenses,
        "user_paid": user_paid,
        "share_per_user": share_per_user,
        "balance": balance
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Xpense API"}
