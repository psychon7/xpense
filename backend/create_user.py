from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == "test").first()
        if existing_user:
            print("Test user already exists")
            return

        # Create new user
        hashed_password = get_password_hash("test123")
        user = User(username="test", password_hash=hashed_password)
        db.add(user)
        db.commit()
        print("Test user created successfully")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
