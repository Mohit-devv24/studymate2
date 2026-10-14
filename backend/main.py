import os
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from database import SessionLocal, engine
from models import (
    Base,
    Note,
    Subject,
    Task,
    User,
    LearningChallenge,
    GamificationProfile,
    ChallengeCompletion,
    StudyActivity,
    UserBadge,
    StudyGoalProfile,
    StudyDay,
    FocusSession,
    TaskReward,
)
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
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",")
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
# SEED B.TECH FIRST-YEAR LEARNING CHALLENGES
# =========================================================
SYLLABUS_CHALLENGES = [
    # C Programming
    {
        "slug": "c-control-flow",
        "subject": "C Programming",
        "module": "Control Flow",
        "title": "Check Even or Odd",
        "description": "Write a C program using conditional statements.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "c-loops",
        "subject": "C Programming",
        "module": "Loops",
        "title": "Multiplication Table",
        "description": "Print a number's multiplication table using a loop.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "c-functions",
        "subject": "C Programming",
        "module": "Functions",
        "title": "Prime Number Checker",
        "description": "Create a function that checks whether a number is prime.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "c-recursion",
        "subject": "C Programming",
        "module": "Recursion",
        "title": "Recursive Factorial",
        "description": "Calculate factorial using a recursive function.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "c-arrays",
        "subject": "C Programming",
        "module": "Arrays",
        "title": "Binary Search",
        "description": "Implement binary search on a sorted array.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
    # Engineering Mathematics
    {
        "slug": "math-matrices",
        "subject": "Engineering Mathematics",
        "module": "Matrices",
        "title": "Matrix Operations",
        "description": "Practice matrix addition and multiplication.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "math-determinants",
        "subject": "Engineering Mathematics",
        "module": "Determinants",
        "title": "Calculate a Determinant",
        "description": "Calculate the determinant of a square matrix.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "math-eigenvalues",
        "subject": "Engineering Mathematics",
        "module": "Eigenvalues",
        "title": "Find Eigenvalues",
        "description": "Find eigenvalues of a suitable square matrix.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "math-gauss-seidel",
        "subject": "Engineering Mathematics",
        "module": "Numerical Methods",
        "title": "Gauss-Seidel Method",
        "description": "Solve a suitable linear system iteratively.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
    # Engineering Physics
    {
        "slug": "physics-wave-particle",
        "subject": "Engineering Physics",
        "module": "Quantum Mechanics",
        "title": "Wave-Particle Duality",
        "description": "Explain the wave-particle duality of matter.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "physics-wavefunction",
        "subject": "Engineering Physics",
        "module": "Wave Functions",
        "title": "Probability Density",
        "description": "Explain the physical interpretation of a wave function.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "physics-schrodinger",
        "subject": "Engineering Physics",
        "module": "Schrodinger Equation",
        "title": "Schrodinger Equations",
        "description": "Compare the time-dependent and time-independent equations.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "physics-particle-box",
        "subject": "Engineering Physics",
        "module": "Quantum Mechanics",
        "title": "Particle in a Box",
        "description": "Solve a basic one-dimensional particle-in-a-box problem.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
]
def seed_learning_challenges():
    """Insert missing challenges without overwriting existing records."""
    db = SessionLocal()
    try:
        for item in SYLLABUS_CHALLENGES:
            exists = (
                db.query(LearningChallenge)
                .filter(LearningChallenge.slug == item["slug"])
                .first()
            )
            if exists:
                continue
            db.add(
                LearningChallenge(
                    **item,
                    xp_reward=XP_REWARDS[item["difficulty"]],
                    is_active=True,
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
# =========================================================
# GAMIFICATION CONFIGURATION
# =========================================================
STUDY_TIMEZONE = ZoneInfo("Asia/Kolkata")
XP_REWARDS = {
    "easy": 10,
    "medium": 20,
    "hard": 30,
}
seed_learning_challenges()
LEVEL_TITLES = {
    1: "Rookie",
    2: "Scholar",
    3: "Apprentice",
    4: "Practitioner",
    5: "Specialist",
    6: "Expert",
    7: "Master",
}
BADGE_DEFINITIONS = {
    "code_ninja": {
        "name": "Code Ninja",
        "description": "Complete all C Programming challenges.",
    },
    "math_wizard": {
        "name": "Math Wizard",
        "description": "Complete all Engineering Mathematics challenges.",
    },
    "quantum_master": {
        "name": "Quantum Master",
        "description": "Complete all Engineering Physics challenges.",
    },
    "consistency_champion": {
        "name": "Consistency Champion",
        "description": "Reach a seven-day study streak.",
    },
    "rising_scholar": {
        "name": "Rising Scholar",
        "description": "Reach Level 5.",
    },
    "fourteen_day_streak": {
        "name": "Consistency Legend",
        "description": "Complete your progressive study goal for 14 consecutive days.",
    },
}

# Server-side quiz answers: the browser never decides whether a response is correct.
class QuizSubmission(BaseModel):
    selected_answer: str = Field(min_length=1, max_length=300)


QUIZ_CORRECT_ANSWERS = {
    "c-control-flow": "n % 2 == 0",
    "c-loops": "for loop",
    "c-functions": "It has exactly two positive divisors",
    "c-recursion": "To stop recursive calls",
    "c-arrays": "Sorted",
    "math-matrices": "Columns of A must equal rows of B",
    "math-determinants": "When its determinant is non-zero",
    "math-eigenvalues": "det(A − λI) = 0",
    "math-gauss-seidel": "Iteratively update unknowns using newest available values",
    "physics-wave-particle": "Matter and light can show both wave-like and particle-like behavior",
    "physics-wavefunction": "Probability density",
    "physics-schrodinger": "It describes how the quantum state evolves with time",
    "physics-particle-box": "They are quantized",
}

def calculate_level(total_xp: int) -> dict:
    """Calculate the user's level and progress toward the next level."""
    total_xp = max(0, total_xp)
    level = total_xp // 100 + 1
    xp_into_level = total_xp % 100
    return {
        "total_xp": total_xp,
        "level": level,
        "title": LEVEL_TITLES.get(level, "Grandmaster"),
        "xp_into_level": xp_into_level,
        "xp_for_next_level": 100,
        "xp_remaining": 100 - xp_into_level,
        "progress_percent": xp_into_level,
    }
def get_or_create_gamification_profile(db, user_id: int):
    """Return the user's profile, creating it when necessary."""
    profile = (
        db.query(GamificationProfile)
        .filter(GamificationProfile.user_id == user_id)
        .first()
    )
    if profile is None:
        profile = GamificationProfile(
            user_id=user_id,
            total_xp=0,
            current_streak=0,
            longest_streak=0,
            last_activity_date=None,
        )
        db.add(profile)
        db.flush()
    return profile
def unlock_badge(db, user_id: int, badge_key: str) -> bool:
    """Unlock a badge once. Return True only when newly unlocked."""
    existing = (
        db.query(UserBadge)
        .filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_key == badge_key,
        )
        .first()
    )
    if existing:
        return False
    db.add(UserBadge(user_id=user_id, badge_key=badge_key))
    db.flush()
    return True
def update_streak(db, profile, user_id: int):
    """Count a streak only when the progressive daily study goal is met."""
    today = datetime.now(STUDY_TIMEZONE).date()
    yesterday = today - timedelta(days=1)
    activity = db.query(StudyActivity).filter(
        StudyActivity.user_id == user_id,
        StudyActivity.activity_date == today,
    ).first()
    if activity is None:
        db.add(StudyActivity(user_id=user_id, activity_date=today))
    # Use the profile's last qualifying date, not the activity row alone; older
    # app versions may have created activity rows for challenge completions.
    if profile.last_activity_date != today:
        if profile.last_activity_date == yesterday:
            profile.current_streak += 1
        else:
            profile.current_streak = 1
        profile.last_activity_date = today
        profile.longest_streak = max(profile.longest_streak, profile.current_streak)
    return today

def evaluate_badges(db, user_id: int, profile):
    """Award badges when their requirements have been met."""
    newly_unlocked = []
    level_info = calculate_level(profile.total_xp)
    if level_info["level"] >= 5:
        if unlock_badge(db, user_id, "rising_scholar"):
            newly_unlocked.append("rising_scholar")
    if profile.current_streak >= 7:
        if unlock_badge(db, user_id, "consistency_champion"):
            newly_unlocked.append("consistency_champion")
    if profile.current_streak >= 14:
        if unlock_badge(db, user_id, "fourteen_day_streak"):
            newly_unlocked.append("fourteen_day_streak")
    subject_badges = {
        "C Programming": "code_ninja",
        "Engineering Mathematics": "math_wizard",
        "Engineering Physics": "quantum_master",
    }
    for subject_name, badge_key in subject_badges.items():
        challenges = (
            db.query(LearningChallenge)
            .filter(
                LearningChallenge.subject == subject_name,
                LearningChallenge.is_active.is_(True),
            )
            .all()
        )
        if not challenges:
            continue
        challenge_ids = [challenge.id for challenge in challenges]
        completed_count = (
            db.query(ChallengeCompletion)
            .filter(
                ChallengeCompletion.user_id == user_id,
                ChallengeCompletion.challenge_id.in_(challenge_ids),
            )
            .count()
        )
        if completed_count == len(challenge_ids):
            if unlock_badge(db, user_id, badge_key):
                newly_unlocked.append(badge_key)
    return newly_unlocked
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
# GAMIFICATION API ROUTES
# =========================================================

@app.get("/api/gamification/profile")
def get_gamification_profile(
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        profile = get_or_create_gamification_profile(db, current_user.id)
        db.commit()
        db.refresh(profile)
        badges = (
            db.query(UserBadge)
            .filter(UserBadge.user_id == current_user.id)
            .all()
        )
        return {
            **calculate_level(profile.total_xp),
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "last_activity_date": profile.last_activity_date.isoformat()
            if profile.last_activity_date else None,
            "badges": [
                {
                    "key": badge.badge_key,
                    **BADGE_DEFINITIONS.get(
                        badge.badge_key,
                        {"name": badge.badge_key, "description": ""},
                    ),
                }
                for badge in badges
            ],
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/api/gamification/challenges")
def get_learning_challenges(
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        challenges = (
            db.query(LearningChallenge)
            .filter(LearningChallenge.is_active.is_(True))
            .order_by(LearningChallenge.subject, LearningChallenge.id)
            .all()
        )
        completed_ids = {
            row.challenge_id
            for row in db.query(ChallengeCompletion)
            .filter(ChallengeCompletion.user_id == current_user.id)
            .all()
        }
        return {
            "challenges": [
                {
                    "id": challenge.id,
                    "slug": challenge.slug,
                    "subject": challenge.subject,
                    "module": challenge.module,
                    "title": challenge.title,
                    "description": challenge.description,
                    "difficulty": challenge.difficulty,
                    "xp_reward": challenge.xp_reward,
                    "estimated_minutes": challenge.estimated_minutes,
                    "completed": challenge.id in completed_ids,
                }
                for challenge in challenges
            ]
        }
    finally:
        db.close()


@app.post("/api/gamification/challenges/{challenge_id}/complete")
def complete_gamification_challenge(
    challenge_id: int,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        challenge = (
            db.query(LearningChallenge)
            .filter(
                LearningChallenge.id == challenge_id,
                LearningChallenge.is_active.is_(True),
            )
            .first()
        )
        if challenge is None:
            raise HTTPException(status_code=404, detail="Learning challenge not found")
        correct_answer = QUIZ_CORRECT_ANSWERS.get(challenge.slug)
        if correct_answer is None:
            raise HTTPException(status_code=422, detail="Quiz is not configured for this challenge yet.")
        if submission.selected_answer != correct_answer:
            raise HTTPException(status_code=400, detail="Wrong Answer, try again")

        existing = (
            db.query(ChallengeCompletion)
            .filter(
                ChallengeCompletion.user_id == current_user.id,
                ChallengeCompletion.challenge_id == challenge_id,
            )
            .first()
        )
        profile = get_or_create_gamification_profile(db, current_user.id)
        if existing:
            db.commit()
            return {
                "message": "Challenge already completed",
                "already_completed": True,
                "xp_awarded": 0,
                **calculate_level(profile.total_xp),
                "current_streak": profile.current_streak,
                "longest_streak": profile.longest_streak,
                "newly_unlocked_badges": [],
            }

        db.add(ChallengeCompletion(
            user_id=current_user.id,
            challenge_id=challenge_id,
            xp_awarded=challenge.xp_reward,
        ))
        db.flush()
        profile.total_xp += challenge.xp_reward
        newly_unlocked = evaluate_badges(db, current_user.id, profile)
        db.commit()
        db.refresh(profile)
        return {
            "message": "Challenge completed successfully",
            "already_completed": False,
            "challenge_id": challenge.id,
            "challenge_title": challenge.title,
            "xp_awarded": challenge.xp_reward,
            **calculate_level(profile.total_xp),
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "newly_unlocked_badges": [
                {"key": key, **BADGE_DEFINITIONS[key]}
                for key in newly_unlocked
            ],
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Challenge completion already exists. Refresh and try again.",
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/api/gamification/badges")
def get_gamification_badges(
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        unlocked = {
            badge.badge_key: badge
            for badge in db.query(UserBadge)
            .filter(UserBadge.user_id == current_user.id)
            .all()
        }
        return {
            "badges": [
                {
                    "key": key,
                    **definition,
                    "unlocked": key in unlocked,
                    "unlocked_at": (
                        unlocked[key].unlocked_at.isoformat()
                        if key in unlocked and unlocked[key].unlocked_at else None
                    ),
                }
                for key, definition in BADGE_DEFINITIONS.items()
            ]
        }
    finally:
        db.close()


# =========================================================
# PROGRESSIVE DAILY STUDY GOALS + SERVER-PERSISTED FOCUS TIME
# =========================================================
class FocusFinishData(BaseModel):
    duration_seconds: int = Field(ge=0, le=6 * 60 * 60)


def get_or_create_study_goal(db, user_id: int):
    goal = db.query(StudyGoalProfile).filter(StudyGoalProfile.user_id == user_id).first()
    if goal is None:
        goal = StudyGoalProfile(user_id=user_id, target_minutes=60)
        db.add(goal)
        db.flush()
    return goal


def get_or_create_study_day(db, user_id: int, today: date, target_minutes: int):
    day = db.query(StudyDay).filter(
        StudyDay.user_id == user_id,
        StudyDay.study_date == today,
    ).first()
    if day is None:
        day = StudyDay(
            user_id=user_id,
            study_date=today,
            target_minutes=target_minutes,
            completed_seconds=0,
            goal_met=False,
        )
        db.add(day)
        db.flush()
    return day


def maybe_complete_daily_goal(db, user_id: int, day, goal_profile):
    if day.goal_met or day.completed_seconds < day.target_minutes * 60:
        return {"goal_just_completed": False, "xp_awarded": 0, "newly_unlocked_badges": []}
    day.goal_met = True
    # The current day's target stays fixed in StudyDay; the increased target starts tomorrow.
    goal_profile.target_minutes = min(goal_profile.target_minutes + 10, 360)
    profile = get_or_create_gamification_profile(db, user_id)
    profile.total_xp += 10
    update_streak(db, profile, user_id)
    newly_unlocked = evaluate_badges(db, user_id, profile)
    return {"goal_just_completed": True, "xp_awarded": 10, "newly_unlocked_badges": newly_unlocked}


@app.get("/api/study/goal")
def get_daily_study_goal(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        today = datetime.now(STUDY_TIMEZONE).date()
        goal_profile = get_or_create_study_goal(db, current_user.id)
        day = get_or_create_study_day(db, current_user.id, today, goal_profile.target_minutes)
        profile = get_or_create_gamification_profile(db, current_user.id)
        db.commit()
        recent = db.query(StudyDay).filter(
            StudyDay.user_id == current_user.id,
            StudyDay.study_date >= today - timedelta(days=13),
        ).order_by(StudyDay.study_date.desc()).all()
        completed_minutes = day.completed_seconds // 60
        return {
            "date": today.isoformat(),
            "target_minutes": day.target_minutes,
            "next_target_minutes": goal_profile.target_minutes,
            "completed_seconds": day.completed_seconds,
            "completed_minutes": completed_minutes,
            "remaining_minutes": max(0, day.target_minutes - (day.completed_seconds // 60)),
            "goal_met": bool(day.goal_met),
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "recent_days": [
                {"date": item.study_date.isoformat(), "target_minutes": item.target_minutes,
                 "completed_minutes": item.completed_seconds // 60, "goal_met": bool(item.goal_met)}
                for item in recent
            ],
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/api/study/focus/start")
def start_focus_session(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        session = FocusSession(user_id=current_user.id, started_at=now, status="running")
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"session_id": session.id, "started_at": now.isoformat(), "status": session.status}
    finally:
        db.close()


@app.post("/api/study/focus/{session_id}/finish")
def finish_focus_session(
    session_id: int,
    submission: FocusFinishData,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        session = db.query(FocusSession).filter(
            FocusSession.id == session_id,
            FocusSession.user_id == current_user.id,
        ).first()
        if session is None:
            raise HTTPException(status_code=404, detail="Focus session not found")
        if session.status == "finished":
            return {"message": "Focus session already saved", "already_saved": True,
                    "duration_seconds": session.duration_seconds, "xp_awarded": session.xp_awarded}
        now = datetime.now(timezone.utc)
        started_at = session.started_at
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        wall_seconds = max(0, int((now - started_at).total_seconds()))
        # Never accept more time than has actually elapsed since the server created this session.
        duration = min(submission.duration_seconds, wall_seconds + 2)
        session.ended_at = now
        session.duration_seconds = duration
        session.status = "finished"
        goal_profile = get_or_create_study_goal(db, current_user.id)
        today = datetime.now(STUDY_TIMEZONE).date()
        day = get_or_create_study_day(db, current_user.id, today, goal_profile.target_minutes)
        day.completed_seconds += duration
        goal_result = maybe_complete_daily_goal(db, current_user.id, day, goal_profile)
        db.commit()
        profile = get_or_create_gamification_profile(db, current_user.id)
        level = calculate_level(profile.total_xp)
        return {
            "message": "Focus time saved",
            "duration_seconds": duration,
            "today_completed_seconds": day.completed_seconds,
            "target_minutes": day.target_minutes,
            "goal_met": bool(day.goal_met),
            "goal_just_completed": goal_result["goal_just_completed"],
            "xp_awarded": goal_result["xp_awarded"],
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "newly_unlocked_badges": [
                {"key": key, **BADGE_DEFINITIONS[key]} for key in goal_result["newly_unlocked_badges"]
            ],
            **level,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
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
        was_completed = bool(task.completed)
        task.completed = 0 if was_completed else 1
        xp_awarded = 0
        if not was_completed:
            reward = db.query(TaskReward).filter(
                TaskReward.user_id == current_user.id,
                TaskReward.task_id == task.id,
            ).first()
            if reward is None:
                xp_awarded = 10
                db.add(TaskReward(user_id=current_user.id, task_id=task.id, xp_awarded=xp_awarded))
                profile = get_or_create_gamification_profile(db, current_user.id)
                profile.total_xp += xp_awarded
                evaluate_badges(db, current_user.id, profile)
        db.commit()
        db.refresh(task)
        return {
            "message": "Task status updated!",
            "id": task.id,
            "title": task.title,
            "completed": task.completed,
            "xp_awarded": xp_awarded,
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Task reward already recorded; refresh your dashboard.")
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
