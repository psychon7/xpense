from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Many-to-many relationship table for expense participants
expense_participants = Table(
    'expense_participants',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('expense_id', Integer, ForeignKey('expenses.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expenses_created = relationship("Expense", back_populates="creator")
    participated_expenses = relationship("Expense", secondary=expense_participants, back_populates="participants")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    amount = Column(Float)
    description = Column(String)
    bill_image_url = Column(String, nullable=True)
    ocr_text = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    creator_id = Column(Integer, ForeignKey("users.id"))
    split_type = Column(String, default="equal")  # equal, percentage, custom
    is_settled = Column(Boolean, default=False)
    category = Column(String, nullable=True)
    
    creator = relationship("User", back_populates="expenses_created")
    participants = relationship("User", secondary=expense_participants, back_populates="participated_expenses")
    custom_splits = relationship("ExpenseSplit", back_populates="expense")
    comments = relationship("ExpenseComment", back_populates="expense")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    percentage = Column(Float, nullable=True)
    is_paid = Column(Boolean, default=False)
    
    expense = relationship("Expense", back_populates="custom_splits")
    user = relationship("User")

class ExpenseComment(Base):
    __tablename__ = "expense_comments"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    expense = relationship("Expense", back_populates="comments")
    user = relationship("User")
