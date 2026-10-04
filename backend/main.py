import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError

from database import SessionLocal, engine
from models import Base, Note, Subject, Task, User
from pwdlib import PasswordHash


# =========================================================
# CONFIGURATION
# =========================================================

password_hash = PasswordHash.recommended()
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-before-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

app = FastAPI(title="StudyMate API", version="1.0.0")
security = HTTPBearer(auto_error=False)

# =========================================================
# CORS
# =========================================================

configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=r"https://.*\.netlify\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# =========================================================
# AUTH HELPERS
# =========================================================

def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload.get("sub", ""))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists",
            )
        return user
    finally:
        db.close()


# =========================================================
# BASIC ROUTES
# =========================================================

@app.get("/")
def home():
    return {"message": "StudyMate backend is running!"}


@app.get("/api/test")
def test():
    return {"message": "Frontend and backend connected!"}


# =========================================================
# DATA MODELS
# =========================================================

class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginData(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class SubjectData(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    user_id: int | None = None


class TaskData(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    user_id: int | None = None


class NoteData(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=20000)
    user_id: int | None = None


# =========================================================
# SIGNUP
# =========================================================

@app.post("/api/signup", status_code=status.HTTP_201_CREATED)
def signup(user: SignupData):
    db = SessionLocal()
    try:
        normalized_email = user.email.strip().lower()
        existing = db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        new_user = User(
            name=user.name.strip(),
            email=normalized_email,
            password=password_hash.hash(user.password),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Account created successfully!",
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
        }
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    finally:
        db.close()


# =========================================================
# LOGIN
# =========================================================

@app.post("/api/login")
def login(user: LoginData):
    db = SessionLocal()
    try:
        normalized_email = user.email.strip().lower()
        existing_user = db.query(User).filter(User.email == normalized_email).first()

        if not existing_user or not password_hash.verify(user.password, existing_user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "message": "Login successful!",
            "token": create_access_token(existing_user.id),
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
        }
    finally:
        db.close()


# =========================================================
# SUBJECTS
# =========================================================

@app.post("/api/subjects")
def add_subject(subject: SubjectData, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        new_subject = Subject(name=subject.name.strip(), user_id=current_user.id)
        db.add(new_subject)
        db.commit()
        db.refresh(new_subject)
        return {
            "message": "Subject added successfully!",
            "id": new_subject.id,
            "name": new_subject.name,
            "user_id": current_user.id,
        }
    finally:
        db.close()


@app.get("/api/subjects")
def get_subjects(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
        return [{"id": item.id, "name": item.name} for item in subjects]
    finally:
        db.close()


@app.delete("/api/subjects/{subject_id}")
def delete_subject(subject_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        subject = db.query(Subject).filter(
            Subject.id == subject_id,
            Subject.user_id == current_user.id,
        ).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        db.delete(subject)
        db.commit()
        return {"message": "Subject deleted successfully!"}
    finally:
        db.close()


@app.put("/api/subjects/{subject_id}")
def update_subject(
    subject_id: int,
    subject_data: SubjectData,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        subject = db.query(Subject).filter(
            Subject.id == subject_id,
            Subject.user_id == current_user.id,
        ).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        subject.name = subject_data.name.strip()
        db.commit()
        db.refresh(subject)
        return {
            "message": "Subject updated successfully!",
            "id": subject.id,
            "name": subject.name,
        }
    finally:
        db.close()


# =========================================================
# TASKS
# =========================================================

@app.post("/api/tasks")
def add_task(task: TaskData, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        new_task = Task(title=task.title.strip(), completed=0, user_id=current_user.id)
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return {
            "message": "Task added successfully!",
            "id": new_task.id,
            "title": new_task.title,
            "completed": new_task.completed,
            "user_id": current_user.id,
        }
    finally:
        db.close()


@app.get("/api/tasks")
def get_tasks(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
        return [
            {"id": task.id, "title": task.title, "completed": task.completed}
            for task in tasks
        ]
    finally:
        db.close()


@app.put("/api/tasks/{task_id}/complete")
def complete_task(task_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == current_user.id,
        ).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task.completed = 1 if task.completed == 0 else 0
        db.commit()
        db.refresh(task)
        return {
            "message": "Task status updated!",
            "id": task.id,
            "title": task.title,
            "completed": task.completed,
        }
    finally:
        db.close()


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == current_user.id,
        ).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully!"}
    finally:
        db.close()


# =========================================================
# NOTES
# =========================================================

@app.post("/api/notes")
def add_note(note: NoteData, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        new_note = Note(
            title=note.title.strip(),
            content=note.content.strip(),
            user_id=current_user.id,
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        return {
            "message": "Note added successfully!",
            "id": new_note.id,
            "title": new_note.title,
            "content": new_note.content,
            "user_id": current_user.id,
        }
    finally:
        db.close()


@app.get("/api/notes")
def get_notes(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        notes = db.query(Note).filter(Note.user_id == current_user.id).all()
        return [
            {"id": note.id, "title": note.title, "content": note.content}
            for note in notes
        ]
    finally:
        db.close()


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
        ).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        db.delete(note)
        db.commit()
        return {"message": "Note deleted successfully!"}
    finally:
        db.close()
