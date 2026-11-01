import os
from typing import Optional, List, Dict, Any, Union
from dotenv import load_dotenv

load_dotenv()
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import (
    Base,
    ChallengeCompletion,
    FocusSession,
    GamificationProfile,
    LearningChallenge,
    Note,
    StudyActivity,
    StudyDay,
    StudyGoalProfile,
    Subject,
    Task,
    TaskReward,
    User,
    UserBadge,
    GeneratedTest,
    TestQuestion,
    TestAttempt,
    GameSession,
    GamingProfile,
    AcademicProfile,
    GeneratedGameQuestion,
)
import json
from test_generator import COURSE_PRESETS, generate_questions_for_topic
from game_generator import generate_course_aware_game_content
from academic_data import get_academic_presets, resolve_subjects, resolve_chapters
from pwdlib import PasswordHash

# =========================================================
# CONFIGURATION
# =========================================================

password_hash = PasswordHash.recommended()
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-before-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

try:
    STUDY_TIMEZONE = ZoneInfo("Asia/Kolkata")
except Exception:
    STUDY_TIMEZONE = timezone.utc

app = FastAPI(title="StudyMate API", version="1.0.0")
security = HTTPBearer(auto_error=False)

# =========================================================
# DATABASE SESSION DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================================================
# CORS
# =========================================================

configured_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|https://.*\.netlify\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# =========================================================
# GAMIFICATION & CHALLENGES CONFIG
# =========================================================

XP_REWARDS = {
    "easy": 10,
    "medium": 20,
    "hard": 30,
}

SYLLABUS_CHALLENGES = [
    # JEE (Main & Advanced)
    {
        "slug": "jee-phys-kinematics",
        "course": "JEE (Main & Advanced)",
        "subject": "Physics",
        "module": "Kinematics & Dynamics",
        "title": "Horizontal Range Formula",
        "description": "Calculate projectile horizontal range given launch speed u and elevation angle theta.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "jee-phys-rotational",
        "course": "JEE (Main & Advanced)",
        "subject": "Physics",
        "module": "Rotational Dynamics",
        "title": "Moment of Inertia of Solid Cylinder",
        "description": "Determine the moment of inertia of a uniform solid cylinder about its central axis.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "jee-phys-thermo",
        "course": "JEE (Main & Advanced)",
        "subject": "Physics",
        "module": "Thermodynamics",
        "title": "Carnot Engine Efficiency",
        "description": "Compute the theoretical maximum efficiency of a reversible heat engine.",
        "difficulty": "hard",
        "estimated_minutes": 35,
    },
    {
        "slug": "jee-chem-hybridization",
        "course": "JEE (Main & Advanced)",
        "subject": "Chemistry",
        "module": "Chemical Bonding",
        "title": "SF6 Molecular Geometry",
        "description": "Determine the hybridization and VSEPR geometry of Sulfur Hexafluoride.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "jee-chem-thermo",
        "course": "JEE (Main & Advanced)",
        "subject": "Chemistry",
        "module": "Thermodynamics",
        "title": "Gibbs Free Energy Spontaneity",
        "description": "State the thermodynamic condition required for spontaneous reaction at constant T & P.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "jee-chem-organic",
        "course": "JEE (Main & Advanced)",
        "subject": "Chemistry",
        "module": "Organic Chemistry",
        "title": "SN1 Reaction Stereochemistry",
        "description": "Predict the optical activity and stereochemistry produced in carbocation-mediated SN1.",
        "difficulty": "hard",
        "estimated_minutes": 35,
    },
    {
        "slug": "jee-math-calculus",
        "course": "JEE (Main & Advanced)",
        "subject": "Mathematics",
        "module": "Integral Calculus",
        "title": "Definite Integral Symmetry",
        "description": "Evaluate symmetric definite integral of an odd polynomial function.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "jee-math-matrices",
        "course": "JEE (Main & Advanced)",
        "subject": "Mathematics",
        "module": "Matrices & Determinants",
        "title": "Cramer's Rule for Unique Solution",
        "description": "Identify non-singularity condition for unique solvability of system AX = B.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "jee-math-conics",
        "course": "JEE (Main & Advanced)",
        "subject": "Mathematics",
        "module": "Coordinate Geometry",
        "title": "Tangent to Parabola",
        "description": "Formulate standard tangent equation for y^2 = 4ax with slope m.",
        "difficulty": "hard",
        "estimated_minutes": 35,
    },

    # NEET (UG Medical)
    {
        "slug": "neet-bio-cell",
        "course": "NEET (UG Medical)",
        "subject": "Biology",
        "module": "Cell Biology",
        "title": "Cellular Energy Synthesis",
        "description": "Identify organelle responsible for aerobic cellular respiration and ATP generation.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "neet-bio-genetics",
        "course": "NEET (UG Medical)",
        "subject": "Biology",
        "module": "Genetics & Inheritance",
        "title": "Mendelian Dihybrid Ratio",
        "description": "Determine the phenotypic ratio in the F2 generation of a classic dihybrid cross.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "neet-bio-cardiac",
        "course": "NEET (UG Medical)",
        "subject": "Biology",
        "module": "Human Physiology",
        "title": "Intrinsic Cardiac Pacemaker",
        "description": "Identify nodal cardiac tissue establishing sinus rhythm of the human heart.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "neet-bio-photosynthesis",
        "course": "NEET (UG Medical)",
        "subject": "Biology",
        "module": "Plant Physiology",
        "title": "Primary CO2 Acceptor in C4",
        "description": "Identify the primary carbon dioxide acceptor substrate in C4 Hatch-Slack pathway.",
        "difficulty": "hard",
        "estimated_minutes": 35,
    },
    {
        "slug": "neet-chem-biomolecules",
        "course": "NEET (UG Medical)",
        "subject": "Chemistry",
        "module": "Biomolecules",
        "title": "Peptide Bond Linkage",
        "description": "Identify covalent amide linkage formed between carboxyl and amino groups.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "neet-chem-kinetics",
        "course": "NEET (UG Medical)",
        "subject": "Chemistry",
        "module": "Chemical Kinetics",
        "title": "First Order Reaction Half-Life",
        "description": "Calculate half-life of a first-order decomposition given rate constant k.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "neet-phys-optics",
        "course": "NEET (UG Medical)",
        "subject": "Physics",
        "module": "Ray Optics",
        "title": "Total Internal Reflection Critical Angle",
        "description": "Express critical angle condition for light traveling from dense medium to air.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "neet-phys-circuits",
        "course": "NEET (UG Medical)",
        "subject": "Physics",
        "module": "Current Electricity",
        "title": "Wheatstone Bridge Null Condition",
        "description": "State resistance ratio condition where galvanometer current is zero.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },

    # Class 12th Board Exam
    {
        "slug": "cbse-phys-gauss",
        "course": "Class 12th Board Exam",
        "subject": "Physics",
        "module": "Electrostatics",
        "title": "Gauss's Law of Electrostatics",
        "description": "Determine total electric flux leaving an arbitrary closed surface enclosing charge q.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "cbse-phys-drift",
        "course": "Class 12th Board Exam",
        "subject": "Physics",
        "module": "Current Electricity",
        "title": "Drift Velocity of Electrons",
        "description": "Formulate steady drift velocity in terms of electric field and collision time.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "cbse-chem-boiling",
        "course": "Class 12th Board Exam",
        "subject": "Chemistry",
        "module": "Solutions",
        "title": "Elevation in Boiling Point",
        "description": "Express colligative boiling elevation in terms of ebullioscopic constant and molality.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "cbse-chem-nernst",
        "course": "Class 12th Board Exam",
        "subject": "Chemistry",
        "module": "Electrochemistry",
        "title": "Nernst Equation at 298 K",
        "description": "Calculate cell potential against reaction quotient Q under non-standard conditions.",
        "difficulty": "medium",
        "estimated_minutes": 25,
    },
    {
        "slug": "cbse-math-relations",
        "course": "Class 12th Board Exam",
        "subject": "Mathematics",
        "module": "Relations & Functions",
        "title": "Equivalence Relations",
        "description": "Identify the trio of mathematical properties that constitute an equivalence relation.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "cbse-math-derivative",
        "course": "Class 12th Board Exam",
        "subject": "Mathematics",
        "module": "Calculus",
        "title": "Derivative of Composite Exponential",
        "description": "Calculate first derivative of e^(sin x) with respect to variable x using chain rule.",
        "difficulty": "medium",
        "estimated_minutes": 20,
    },

    # B.Tech (Computer Science & Engineering)
    {
        "slug": "c-control-flow",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "C Programming",
        "module": "Control Flow",
        "title": "Check Even or Odd",
        "description": "Write a C program using conditional statements.",
        "difficulty": "easy",
        "estimated_minutes": 15,
    },
    {
        "slug": "c-loops",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "C Programming",
        "module": "Loops",
        "title": "Multiplication Table",
        "description": "Print a number's multiplication table using a loop.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "c-functions",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "C Programming",
        "module": "Functions",
        "title": "Prime Number Checker",
        "description": "Create a function that checks whether a number is prime.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "c-recursion",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "C Programming",
        "module": "Recursion",
        "title": "Recursive Factorial",
        "description": "Calculate factorial using a recursive function.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "c-arrays",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "C Programming",
        "module": "Arrays",
        "title": "Binary Search",
        "description": "Implement binary search on a sorted array.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
    {
        "slug": "math-matrices",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Mathematics",
        "module": "Matrices",
        "title": "Matrix Operations",
        "description": "Practice matrix addition and multiplication.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "math-determinants",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Mathematics",
        "module": "Determinants",
        "title": "Calculate a Determinant",
        "description": "Calculate the determinant of a square matrix.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "math-eigenvalues",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Mathematics",
        "module": "Eigenvalues",
        "title": "Find Eigenvalues",
        "description": "Find eigenvalues of a suitable square matrix.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "math-gauss-seidel",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Mathematics",
        "module": "Numerical Methods",
        "title": "Gauss-Seidel Method",
        "description": "Solve a suitable linear system iteratively.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
    {
        "slug": "physics-wave-particle",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Physics",
        "module": "Quantum Mechanics",
        "title": "Wave-Particle Duality",
        "description": "Explain the wave-particle duality of matter.",
        "difficulty": "easy",
        "estimated_minutes": 20,
    },
    {
        "slug": "physics-wavefunction",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Physics",
        "module": "Wave Functions",
        "title": "Probability Density",
        "description": "Explain the physical interpretation of a wave function.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "physics-schrodinger",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Physics",
        "module": "Schrodinger Equation",
        "title": "Schrodinger Equations",
        "description": "Compare the time-dependent and time-independent equations.",
        "difficulty": "medium",
        "estimated_minutes": 30,
    },
    {
        "slug": "physics-particle-box",
        "course": "B.Tech (Computer Science & Engineering)",
        "subject": "Engineering Physics",
        "module": "Quantum Mechanics",
        "title": "Particle in a Box",
        "description": "Solve a basic one-dimensional particle-in-a-box problem.",
        "difficulty": "hard",
        "estimated_minutes": 45,
    },
]

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
    "first_step": {
        "name": "First Step",
        "description": "Complete your first task or challenge.",
    },
    "code_ninja": {
        "name": "Code Ninja",
        "description": "Complete all C Programming challenges.",
    },
    "math_wizard": {
        "name": "Math Wizard",
        "description": "Complete all Mathematics challenges.",
    },
    "quantum_master": {
        "name": "Quantum Master",
        "description": "Complete all Physics challenges.",
    },
    "chem_pro": {
        "name": "Molecular Wizard",
        "description": "Master chemistry concepts and reaction mechanisms.",
    },
    "neet_ace": {
        "name": "Medical Prodigy",
        "description": "Complete advanced biology & medical entrance challenges.",
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

QUIZ_CORRECT_ANSWERS = {
    # B.Tech / CSE
    "c-control-flow": "n % 2 == 0",
    "c-loops": "for loop",
    "c-functions": "It has exactly two positive divisors",
    "c-recursion": "To stop recursive calls",
    "c-arrays": "Sorted",
    "math-matrices": "Rows of A equal columns of B",
    "math-determinants": "ad - bc",
    "math-eigenvalues": "det(A - lambda*I) = 0",
    "math-gauss-seidel": "Strictly diagonally dominant",
    "physics-wave-particle": "lambda = h / p",
    "physics-wavefunction": "Probability density",
    "physics-schrodinger": "Energy conservation",
    "physics-particle-box": "En proportional to n^2",

    # JEE (Main & Advanced)
    "jee-phys-kinematics": "u^2 * sin(2*theta) / g",
    "jee-phys-rotational": "(1/2) * M * R^2",
    "jee-phys-thermo": "1 - (T2 / T1)",
    "jee-chem-hybridization": "sp3d2 (Octahedral)",
    "jee-chem-thermo": "Delta G < 0",
    "jee-chem-organic": "Racemization with partial inversion",
    "jee-math-calculus": "0 (Odd function property)",
    "jee-math-matrices": "det(A) != 0",
    "jee-math-conics": "y = m*x + a/m",

    # NEET (UG Medical)
    "neet-bio-cell": "Mitochondria",
    "neet-bio-genetics": "9:3:3:1",
    "neet-bio-cardiac": "Sinoatrial (SA) Node",
    "neet-bio-photosynthesis": "PEP (Phosphoenolpyruvate)",
    "neet-chem-biomolecules": "Peptide Linkage (-CONH-)",
    "neet-chem-kinetics": "t_1/2 = 0.693 / k",
    "neet-phys-optics": "sin(theta_c) = 1 / mu",
    "neet-phys-circuits": "P / Q = R / S",

    # Class 12th Board Exam
    "cbse-phys-gauss": "q / epsilon_0",
    "cbse-phys-drift": "v_d = (e * E * tau) / m",
    "cbse-chem-boiling": "Delta T_b = K_b * m",
    "cbse-chem-nernst": "E = E0 - (0.0591 / n) * log(Q)",
    "cbse-math-relations": "Reflexive, Symmetric, and Transitive",
    "cbse-math-derivative": "cos(x) * e^(sin x)",
}

def seed_learning_challenges():
    db = SessionLocal()
    try:
        for item in SYLLABUS_CHALLENGES:
            existing = (
                db.query(LearningChallenge)
                .filter(LearningChallenge.slug == item["slug"])
                .first()
            )
            if existing:
                existing.course = item.get("course", "B.Tech (Computer Science & Engineering)")
                existing.subject = item["subject"]
                existing.module = item["module"]
                existing.title = item["title"]
                existing.description = item["description"]
                existing.difficulty = item["difficulty"]
                existing.estimated_minutes = item["estimated_minutes"]
                existing.xp_reward = XP_REWARDS.get(item["difficulty"], 10)
                existing.is_active = True
            else:
                db.add(
                    LearningChallenge(
                        slug=item["slug"],
                        course=item.get("course", "B.Tech (Computer Science & Engineering)"),
                        subject=item["subject"],
                        module=item["module"],
                        title=item["title"],
                        description=item["description"],
                        difficulty=item["difficulty"],
                        estimated_minutes=item["estimated_minutes"],
                        xp_reward=XP_REWARDS.get(item["difficulty"], 10),
                        is_active=True,
                    )
                )
        db.commit()
    except Exception as e:
        print("Error seeding challenges:", e)
        db.rollback()
    finally:
        db.close()

seed_learning_challenges()

def calculate_level(total_xp: int) -> dict:
    thresholds = [0, 100, 250, 450, 700, 1000, 1400]
    level = 1
    for idx, requirement in enumerate(thresholds):
        if total_xp >= requirement:
            level = idx + 1
        else:
            break

    level = min(level, 7)
    current_tier_base = thresholds[level - 1]
    next_tier = thresholds[level] if level < len(thresholds) else current_tier_base + 500
    tier_requirement = next_tier - current_tier_base
    progress_in_tier = max(0, total_xp - current_tier_base)

    return {
        "level": level,
        "title": LEVEL_TITLES.get(level, "Master"),
        "total_xp": total_xp,
        "xp_into_level": progress_in_tier,
        "next_level_xp": tier_requirement,
        "xp_remaining": max(0, tier_requirement - progress_in_tier),
    }

def get_or_create_gamification_profile(db: Session, user_id: int) -> GamificationProfile:
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
        )
        db.add(profile)
        db.flush()
    return profile

def unlock_badge(db: Session, user_id: int, badge_key: str) -> bool:
    existing = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == user_id, UserBadge.badge_key == badge_key)
        .first()
    )
    if existing:
        return False
    db.add(
        UserBadge(
            user_id=user_id,
            badge_key=badge_key,
            unlocked_at=datetime.now(timezone.utc),
        )
    )
    db.flush()
    return True

def update_streak(db: Session, profile: GamificationProfile, user_id: int) -> date:
    today = datetime.now(STUDY_TIMEZONE).date()
    yesterday = today - timedelta(days=1)
    activity = (
        db.query(StudyActivity)
        .filter(
            StudyActivity.user_id == user_id,
            StudyActivity.activity_date == today,
        )
        .first()
    )
    if activity is None:
        db.add(StudyActivity(user_id=user_id, activity_date=today))

    if profile.last_activity_date != today:
        if profile.last_activity_date == yesterday:
            profile.current_streak += 1
        else:
            profile.current_streak = 1
        profile.last_activity_date = today
        profile.longest_streak = max(profile.longest_streak, profile.current_streak)

    return today

def evaluate_badges(db: Session, user_id: int, profile: GamificationProfile) -> list[str]:
    newly_unlocked = []
    level_info = calculate_level(profile.total_xp)

    if profile.total_xp >= 10:
        if unlock_badge(db, user_id, "first_step"):
            newly_unlocked.append("first_step")

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
        challenge_ids = [c.id for c in challenges]
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

def get_or_create_study_goal(db: Session, user_id: int) -> StudyGoalProfile:
    goal = db.query(StudyGoalProfile).filter(StudyGoalProfile.user_id == user_id).first()
    if goal is None:
        goal = StudyGoalProfile(user_id=user_id, target_minutes=60)
        db.add(goal)
        db.flush()
    return goal

def get_or_create_study_day(db: Session, user_id: int, today: date, target_minutes: int) -> StudyDay:
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

def maybe_complete_daily_goal(db: Session, user_id: int, day: StudyDay, goal_profile: StudyGoalProfile) -> dict:
    if day.goal_met or day.completed_seconds < day.target_minutes * 60:
        return {"goal_just_completed": False, "xp_awarded": 0, "newly_unlocked_badges": []}

    day.goal_met = True
    goal_profile.target_minutes = min(goal_profile.target_minutes + 10, 360)
    profile = get_or_create_gamification_profile(db, user_id)
    profile.total_xp += 10
    update_streak(db, profile, user_id)
    newly_unlocked = evaluate_badges(db, user_id, profile)
    return {"goal_just_completed": True, "xp_awarded": 10, "newly_unlocked_badges": newly_unlocked}

# =========================================================
# AUTH HELPERS
# =========================================================

def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
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

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user

# =========================================================
# DATA MODELS
# =========================================================

class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    course: Optional[str] = "JEE (Main & Advanced)"

class CourseUpdateData(BaseModel):
    course: str = Field(min_length=1, max_length=100)

class LoginData(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class SubjectData(BaseModel):
    name: str = Field(min_length=1, max_length=200)

class TaskData(BaseModel):
    title: str = Field(min_length=1, max_length=300)

class TaskUpdateData(BaseModel):
    title: str = Field(min_length=1, max_length=300)

class NoteData(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=20000)

class QuizSubmission(BaseModel):
    selected_answer: str = Field(min_length=1, max_length=300)

class FocusFinishData(BaseModel):
    duration_seconds: int = Field(ge=0, le=6 * 60 * 60)

# =========================================================
# BASIC ROUTES
# =========================================================

@app.get("/")
def home():
    return {"message": "StudyMate backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
def test():
    return {"message": "Frontend and backend connected!"}

@app.get("/api/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "course": current_user.course or "JEE (Main & Advanced)",
    }

@app.post("/api/user/course")
def update_user_course(
    data: CourseUpdateData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.course = data.course.strip()
    db.commit()
    db.refresh(current_user)
    return {"message": "Course updated", "course": current_user.course}

# =========================================================
# SIGNUP & LOGIN
# =========================================================

@app.post("/api/signup", status_code=status.HTTP_201_CREATED)
def signup(user: SignupData, db: Session = Depends(get_db)):
    try:
        normalized_email = user.email.strip().lower()
        existing = db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        new_user = User(
            name=user.name.strip(),
            email=normalized_email,
            password=password_hash.hash(user.password),
            course=user.course.strip() if user.course else "JEE (Main & Advanced)",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Initialize user's gamification profile and study goal
        get_or_create_gamification_profile(db, new_user.id)
        get_or_create_study_goal(db, new_user.id)
        db.commit()

        return {
            "message": "Account created successfully!",
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "course": new_user.course,
        }
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")

@app.post("/api/login")
def login(user: LoginData, db: Session = Depends(get_db)):
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
        "course": existing_user.course or "JEE (Main & Advanced)",
    }

# =========================================================
# SUBJECTS
# =========================================================

@app.post("/api/subjects")
def add_subject(
    subject: SubjectData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clean_name = subject.name.strip()
    new_subject = Subject(name=clean_name, user_id=current_user.id)
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return {
        "message": "Subject added successfully!",
        "id": new_subject.id,
        "name": new_subject.name,
        "user_id": current_user.id,
    }

@app.get("/api/subjects")
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subjects = (
        db.query(Subject)
        .filter(Subject.user_id == current_user.id)
        .order_by(Subject.id.desc())
        .all()
    )
    return [{"id": item.id, "name": item.name} for item in subjects]

@app.put("/api/subjects/{subject_id}")
def update_subject(
    subject_id: int,
    subject_data: SubjectData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id, Subject.user_id == current_user.id)
        .first()
    )
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

@app.delete("/api/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id, Subject.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully!"}

# =========================================================
# TASKS
# =========================================================

@app.post("/api/tasks")
def add_task(
    task: TaskData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

@app.get("/api/tasks")
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .order_by(Task.id.desc())
        .all()
    )
    return [
        {"id": task.id, "title": task.title, "completed": task.completed}
        for task in tasks
    ]

@app.put("/api/tasks/{task_id}")
def update_task_title(
    task_id: int,
    task_data: TaskUpdateData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = task_data.title.strip()
    db.commit()
    db.refresh(task)
    return {
        "message": "Task updated successfully!",
        "id": task.id,
        "title": task.title,
        "completed": task.completed,
    }

@app.put("/api/tasks/{task_id}/complete")
def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = 1 if task.completed == 0 else 0
    xp_gained = 0

    # Award 10 XP on completing a task if not previously rewarded
    if task.completed == 1:
        reward = (
            db.query(TaskReward)
            .filter(TaskReward.user_id == current_user.id, TaskReward.task_id == task_id)
            .first()
        )
        if not reward:
            db.add(TaskReward(user_id=current_user.id, task_id=task_id, xp_awarded=10))
            profile = get_or_create_gamification_profile(db, current_user.id)
            profile.total_xp += 10
            evaluate_badges(db, current_user.id, profile)
            xp_gained = 10

    db.commit()
    db.refresh(task)
    return {
        "message": "Task status updated!",
        "id": task.id,
        "title": task.title,
        "completed": task.completed,
        "xp_gained": xp_gained,
    }

@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully!"}

# =========================================================
# NOTES
# =========================================================

@app.post("/api/notes")
def add_note(
    note: NoteData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

@app.get("/api/notes")
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.id.desc())
        .all()
    )
    return [
        {"id": note.id, "title": note.title, "content": note.content}
        for note in notes
    ]

@app.put("/api/notes/{note_id}")
def update_note(
    note_id: int,
    note: NoteData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Note not found")
    existing.title = note.title.strip()
    existing.content = note.content.strip()
    db.commit()
    db.refresh(existing)
    return {
        "message": "Note updated successfully!",
        "id": existing.id,
        "title": existing.title,
        "content": existing.content,
    }

@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully!"}

# =========================================================
# GAMIFICATION API ROUTES
# =========================================================

@app.get("/api/gamification/profile")
def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        "last_activity_date": (
            profile.last_activity_date.isoformat()
            if profile.last_activity_date
            else None
        ),
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

@app.get("/api/gamification/challenges")
def get_learning_challenges(
    course: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    selected_course = (
        course.strip()
        if (course and course.strip().lower() != "all")
        else (current_user.course or "JEE (Main & Advanced)")
    )
    query = db.query(LearningChallenge).filter(LearningChallenge.is_active.is_(True))
    if not (course and course.strip().lower() == "all"):
        query = query.filter(LearningChallenge.course == selected_course)

    challenges = query.order_by(LearningChallenge.subject, LearningChallenge.id).all()
    completed_ids = {
        row.challenge_id
        for row in db.query(ChallengeCompletion)
        .filter(ChallengeCompletion.user_id == current_user.id)
        .all()
    }
    return [
        {
            "id": challenge.id,
            "slug": challenge.slug,
            "course": challenge.course,
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

@app.post("/api/gamification/challenges/{challenge_id}/complete")
def complete_gamification_challenge(
    challenge_id: int,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        raise HTTPException(
            status_code=422, detail="Quiz is not configured for this challenge yet."
        )

    if submission.selected_answer.strip().lower() != correct_answer.strip().lower():
        raise HTTPException(status_code=400, detail="Incorrect answer. Try again!")

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
        return {
            "message": "Challenge already completed",
            "already_completed": True,
            "xp_awarded": 0,
            **calculate_level(profile.total_xp),
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "newly_unlocked_badges": [],
        }

    db.add(
        ChallengeCompletion(
            user_id=current_user.id,
            challenge_id=challenge_id,
            xp_awarded=challenge.xp_reward,
        )
    )
    profile.total_xp += challenge.xp_reward
    newly_unlocked = evaluate_badges(db, current_user.id, profile)
    db.commit()
    db.refresh(profile)

    return {
        "message": "Challenge completed successfully!",
        "already_completed": False,
        "challenge_id": challenge.id,
        "challenge_title": challenge.title,
        "xp_awarded": challenge.xp_reward,
        **calculate_level(profile.total_xp),
        "current_streak": profile.current_streak,
        "longest_streak": profile.longest_streak,
        "newly_unlocked_badges": [
            {"key": key, **BADGE_DEFINITIONS[key]} for key in newly_unlocked
        ],
    }

@app.get("/api/gamification/badges")
def get_gamification_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unlocked = {
        badge.badge_key: badge
        for badge in db.query(UserBadge)
        .filter(UserBadge.user_id == current_user.id)
        .all()
    }
    return [
        {
            "key": key,
            **definition,
            "unlocked": key in unlocked,
            "unlocked_at": (
                unlocked[key].unlocked_at.isoformat()
                if key in unlocked and unlocked[key].unlocked_at
                else None
            ),
        }
        for key, definition in BADGE_DEFINITIONS.items()
    ]

# =========================================================
# STUDY GOALS & FOCUS SESSIONS
# =========================================================

@app.get("/api/study/goal")
def get_daily_study_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.now(STUDY_TIMEZONE).date()
    goal_profile = get_or_create_study_goal(db, current_user.id)
    day = get_or_create_study_day(
        db, current_user.id, today, goal_profile.target_minutes
    )
    profile = get_or_create_gamification_profile(db, current_user.id)
    db.commit()

    completed_minutes = day.completed_seconds // 60
    return {
        "date": today.isoformat(),
        "target_minutes": day.target_minutes,
        "next_target_minutes": goal_profile.target_minutes,
        "completed_seconds": day.completed_seconds,
        "completed_minutes": completed_minutes,
        "remaining_minutes": max(0, day.target_minutes - completed_minutes),
        "goal_met": bool(day.goal_met),
        "current_streak": profile.current_streak,
    }

@app.post("/api/study/focus/start")
def start_focus_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = FocusSession(
        user_id=current_user.id,
        status="running",
        duration_seconds=0,
        xp_awarded=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "message": "Focus session started",
        "session_id": session.id,
        "started_at": session.started_at.isoformat(),
    }

@app.post("/api/study/focus/{session_id}/finish")
def finish_focus_session(
    session_id: int,
    data: FocusFinishData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(FocusSession)
        .filter(
            FocusSession.id == session_id,
            FocusSession.user_id == current_user.id,
        )
        .first()
    )

    today = datetime.now(STUDY_TIMEZONE).date()
    goal_profile = get_or_create_study_goal(db, current_user.id)
    day = get_or_create_study_day(
        db, current_user.id, today, goal_profile.target_minutes
    )

    # Idempotency check: if session is already completed, do not re-add seconds!
    if session and session.status == "completed":
        return {
            "message": "Focus session already completed.",
            "session_id": session.id,
            "duration_seconds": session.duration_seconds,
            "xp_awarded": session.xp_awarded,
            "goal_met": bool(day.goal_met),
            "total_today_minutes": day.completed_seconds // 60,
        }

    duration = max(0, data.duration_seconds)

    if not session:
        # Fallback create session
        session = FocusSession(
            user_id=current_user.id,
            status="running",
            duration_seconds=duration,
            xp_awarded=0,
        )
        db.add(session)
        db.flush()

    # If duration is trivial (< 10 seconds), treat as accidental start/stop and discard
    if duration < 10:
        session.status = "aborted"
        session.duration_seconds = duration
        session.ended_at = datetime.now(timezone.utc)
        session.xp_awarded = 0
        db.commit()
        return {
            "message": "Session was under 10 seconds and was not counted.",
            "session_id": session.id,
            "duration_seconds": duration,
            "xp_awarded": 0,
            "goal_met": bool(day.goal_met),
            "total_today_minutes": day.completed_seconds // 60,
        }

    session.duration_seconds = duration
    session.ended_at = datetime.now(timezone.utc)
    session.status = "completed"

    # Only add actual active elapsed seconds to daily study record
    day.completed_seconds += duration

    # 1 XP per 5 full minutes (300 seconds) of focused study
    earned_xp = max(0, duration // 300)
    session.xp_awarded = earned_xp

    profile = get_or_create_gamification_profile(db, current_user.id)
    profile.total_xp += earned_xp

    goal_result = maybe_complete_daily_goal(db, current_user.id, day, goal_profile)
    evaluate_badges(db, current_user.id, profile)

    db.commit()

    return {
        "message": "Focus session saved successfully!",
        "session_id": session.id,
        "duration_seconds": duration,
        "xp_awarded": earned_xp + goal_result["xp_awarded"],
        "goal_met": bool(day.goal_met),
        "total_today_minutes": day.completed_seconds // 60,
    }


# =========================================================
# TEST GENERATOR API (Course, Subject & Chapter Test Builder)
# =========================================================

class TestGenerateRequest(BaseModel):
    course: str = Field(min_length=1, max_length=150)
    subject: str = Field(min_length=1, max_length=150)
    chapter: str = Field(min_length=1, max_length=200)
    num_questions: int = Field(default=5, ge=3, le=25)
    difficulty: str = Field(default="medium")
    time_limit_minutes: int = Field(default=15, ge=5, le=180)


class TestSubmitRequest(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)
    time_taken_seconds: int = Field(default=0, ge=0)


@app.get("/api/tests/presets")
def get_test_presets():
    """Return pre-configured courses, subjects, and chapters for quick selection."""
    return COURSE_PRESETS


@app.post("/api/tests/generate")
def create_generated_test(
    data: TestGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an authentic, curriculum-aligned test for the given course,
    subject, and chapter.
    """
    clean_course = data.course.strip()
    clean_subject = data.subject.strip()
    clean_chapter = data.chapter.strip()

    questions_data = generate_questions_for_topic(
        course=clean_course,
        subject=clean_subject,
        chapter=clean_chapter,
        num_questions=data.num_questions,
        difficulty=data.difficulty.lower(),
    )

    if not questions_data:
        raise HTTPException(
            status_code=400,
            detail="Unable to generate questions for the specified topic.",
        )

    test = GeneratedTest(
        user_id=current_user.id,
        course=clean_course,
        subject=clean_subject,
        chapter=clean_chapter,
        difficulty=data.difficulty.lower(),
        total_questions=len(questions_data),
        time_limit_minutes=data.time_limit_minutes,
    )
    db.add(test)
    db.flush()

    for item in questions_data:
        q = TestQuestion(
            test_id=test.id,
            question_text=item["question_text"],
            options=json.dumps(item["options"]),
            correct_answer=item["correct_answer"],
            explanation=item.get("explanation", ""),
        )
        db.add(q)

    db.commit()
    db.refresh(test)

    # Return test with question options (without revealing correct answers before submission)
    return {
        "id": test.id,
        "course": test.course,
        "subject": test.subject,
        "chapter": test.chapter,
        "difficulty": test.difficulty,
        "total_questions": test.total_questions,
        "time_limit_minutes": test.time_limit_minutes,
        "created_at": test.created_at.isoformat() if test.created_at else None,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": json.loads(q.options),
            }
            for q in test.questions
        ],
    }


@app.get("/api/tests/history")
def get_user_test_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve history of all tests taken by the authenticated student."""
    attempts = (
        db.query(TestAttempt)
        .filter(TestAttempt.user_id == current_user.id)
        .order_by(TestAttempt.id.desc())
        .limit(30)
        .all()
    )

    history = []
    for att in attempts:
        t = att.test
        history.append(
            {
                "id": att.id,
                "test_id": att.test_id,
                "course": t.course if t else "General",
                "subject": t.subject if t else "General",
                "chapter": t.chapter if t else "Practice",
                "difficulty": t.difficulty if t else "medium",
                "score": att.score,
                "total_marks": att.total_marks,
                "percentage": att.percentage,
                "time_taken_seconds": att.time_taken_seconds,
                "completed_at": att.completed_at.isoformat() if att.completed_at else None,
            }
        )

    return history


@app.get("/api/tests/{test_id}")
def get_test_details(
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve test by ID."""
    test = (
        db.query(GeneratedTest)
        .filter(
            GeneratedTest.id == test_id,
            GeneratedTest.user_id == current_user.id,
        )
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")

    return {
        "id": test.id,
        "course": test.course,
        "subject": test.subject,
        "chapter": test.chapter,
        "difficulty": test.difficulty,
        "total_questions": test.total_questions,
        "time_limit_minutes": test.time_limit_minutes,
        "created_at": test.created_at.isoformat() if test.created_at else None,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": json.loads(q.options),
            }
            for q in test.questions
        ],
    }


@app.post("/api/tests/{test_id}/submit")
def submit_test_attempt(
    test_id: int,
    data: TestSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Grade student's answers, award XP points, and return comprehensive scorecard
    with explanations.
    """
    test = (
        db.query(GeneratedTest)
        .filter(
            GeneratedTest.id == test_id,
            GeneratedTest.user_id == current_user.id,
        )
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")

    total_marks = len(test.questions)
    score = 0
    review = []

    for q in test.questions:
        q_id_str = str(q.id)
        user_choice = data.answers.get(q_id_str)
        is_correct = bool(
            user_choice and user_choice.strip() == q.correct_answer.strip()
        )
        if is_correct:
            score += 1

        review.append(
            {
                "question_id": q.id,
                "question_text": q.question_text,
                "options": json.loads(q.options),
                "user_answer": user_choice,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "explanation": q.explanation,
            }
        )

    percentage = round((score / total_marks) * 100) if total_marks > 0 else 0

    attempt = TestAttempt(
        test_id=test.id,
        user_id=current_user.id,
        score=score,
        total_marks=total_marks,
        percentage=percentage,
        time_taken_seconds=data.time_taken_seconds,
        user_answers=json.dumps(data.answers),
    )
    db.add(attempt)

    # Award XP: 15 XP per correct answer + 20 XP bonus if scored >= 80%
    xp_awarded = score * 15 + (20 if percentage >= 80 else 0)
    profile = get_or_create_gamification_profile(db, current_user.id)
    profile.total_xp += xp_awarded
    update_streak(db, profile, current_user.id)
    evaluate_badges(db, current_user.id, profile)

    db.commit()
    db.refresh(attempt)

    return {
        "message": "Test submitted and graded successfully!",
        "attempt_id": attempt.id,
        "test_id": test.id,
        "score": score,
        "total_marks": total_marks,
        "percentage": percentage,
        "time_taken_seconds": data.time_taken_seconds,
        "xp_awarded": xp_awarded,
        "answers_review": review,
    }


# =========================================================
# ACADEMIC PROFILE & GAMING ZONE API
# =========================================================

class AcademicProfileUpdate(BaseModel):
    category: str = Field(default="competitive", description="school, competitive, or undergraduate")
    course_name: str = Field(default="JEE Main")
    branch_or_stream: Optional[str] = ""
    class_or_semester: Optional[str] = ""
    board_or_exam: Optional[str] = ""
    preparation_level: Optional[str] = "Regular"
    target_year: Optional[str] = "2026"
    selected_subject: Optional[str] = ""
    selected_chapter: Optional[str] = ""
    selected_topic: Optional[str] = ""


class GameGenerateRequest(BaseModel):
    game_type: str = Field(..., description="One of: quiz, code, debug, formula, concept, memory, speed, scramble")
    category: Optional[str] = "competitive"
    course: Optional[str] = "JEE Main"
    branch_or_stream: Optional[str] = ""
    class_or_semester: Optional[str] = ""
    subject: str = Field(..., description="Target course subject (Physics, Chemistry, Math, C Programming, etc.)")
    chapter: Optional[str] = ""
    topic: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    question_count: Optional[int] = 5
    mode: Optional[str] = "practice"


class GameSubmitRequest(BaseModel):
    game_type: str
    course: Optional[str] = "JEE Main"
    subject: str
    topic: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    score: int = 0
    max_score: Optional[int] = 100
    time_taken_seconds: Optional[int] = 0
    details: Optional[Dict[str, Any]] = None


def get_or_create_academic_profile(db: Session, user_id: int) -> AcademicProfile:
    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == user_id).first()
    if not profile:
        profile = AcademicProfile(
            user_id=user_id,
            category="competitive",
            course_name="JEE Main",
            branch_or_stream="",
            class_or_semester="",
            board_or_exam="JEE Main",
            preparation_level="Target 2026",
            target_year="2026",
            selected_subject="Physics",
            selected_chapter="Kinematics",
            selected_topic="Motion in a Straight Line",
        )
        db.add(profile)
        db.flush()
    return profile


def get_or_create_gaming_profile(db: Session, user_id: int) -> GamingProfile:
    profile = db.query(GamingProfile).filter(GamingProfile.user_id == user_id).first()
    if not profile:
        profile = GamingProfile(
            user_id=user_id,
            gaming_xp=0,
            gaming_level=1,
            games_played=0,
            games_won=0,
            current_game_streak=0,
            highest_score=0,
            badges="[]",
        )
        db.add(profile)
        db.flush()
    return profile


# --- ACADEMIC PROFILE ENDPOINTS ---

@app.get("/api/academic/presets")
def api_get_academic_presets():
    """Returns complete dynamic academic hierarchy (School, Competitive, Undergraduate)."""
    return get_academic_presets()


@app.get("/api/academic/profile")
def api_get_academic_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the student's saved academic profile."""
    profile = get_or_create_academic_profile(db, current_user.id)
    db.commit()

    # Resolve dynamic subjects list for this profile
    subjects = resolve_subjects(
        category=profile.category,
        course_name=profile.course_name,
        branch_or_stream=profile.branch_or_stream or "",
        class_or_semester=profile.class_or_semester or "",
    )

    # Resolve chapters for currently selected subject
    active_subject = profile.selected_subject or (subjects[0] if subjects else "General Science")
    chapters = resolve_chapters(
        subject=active_subject,
        course_name=profile.course_name,
        branch_or_stream=profile.branch_or_stream or "",
        class_or_semester=profile.class_or_semester or "",
    )

    return {
        "id": profile.id,
        "category": profile.category,
        "course_name": profile.course_name,
        "branch_or_stream": profile.branch_or_stream,
        "class_or_semester": profile.class_or_semester,
        "board_or_exam": profile.board_or_exam,
        "preparation_level": profile.preparation_level,
        "target_year": profile.target_year,
        "selected_subject": active_subject,
        "selected_chapter": profile.selected_chapter or (chapters[0] if chapters else ""),
        "selected_topic": profile.selected_topic or "",
        "available_subjects": subjects,
        "available_chapters": chapters,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


@app.post("/api/academic/profile")
def api_update_academic_profile(
    data: AcademicProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update or customize the student's academic profile and sync default course."""
    profile = get_or_create_academic_profile(db, current_user.id)

    profile.category = data.category
    profile.course_name = data.course_name
    profile.branch_or_stream = data.branch_or_stream or ""
    profile.class_or_semester = data.class_or_semester or ""
    profile.board_or_exam = data.board_or_exam or ""
    profile.preparation_level = data.preparation_level or "Regular"
    profile.target_year = data.target_year or "2026"
    profile.selected_subject = data.selected_subject or ""
    profile.selected_chapter = data.selected_chapter or ""
    profile.selected_topic = data.selected_topic or ""
    profile.updated_at = datetime.now(timezone.utc)

    # Sync User table's course field for system-wide consistency
    current_user.course = data.course_name

    db.commit()

    subjects = resolve_subjects(
        category=profile.category,
        course_name=profile.course_name,
        branch_or_stream=profile.branch_or_stream or "",
        class_or_semester=profile.class_or_semester or "",
    )

    return {
        "success": True,
        "message": "Academic profile updated successfully!",
        "profile": {
            "category": profile.category,
            "course_name": profile.course_name,
            "branch_or_stream": profile.branch_or_stream,
            "class_or_semester": profile.class_or_semester,
            "selected_subject": profile.selected_subject,
            "selected_chapter": profile.selected_chapter,
            "selected_topic": profile.selected_topic,
            "available_subjects": subjects,
        },
    }


# --- GAMING ZONE ENGINE ENDPOINTS ---

@app.post("/api/games/generate")
def api_generate_game(
    data: GameGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate course-based game content via Groq AI with genuine academic grounding.
    Actively tracks question fingerprints to prevent recent duplicates.
    """
    # 1. Fetch academic profile context
    acad_profile = get_or_create_academic_profile(db, current_user.id)

    category = data.category or acad_profile.category or "competitive"
    course_name = data.course or acad_profile.course_name or current_user.course or "JEE Main"
    branch_or_stream = data.branch_or_stream or acad_profile.branch_or_stream or ""
    class_or_semester = data.class_or_semester or acad_profile.class_or_semester or ""
    subject = data.subject.strip()
    chapter = data.chapter.strip() if data.chapter else (acad_profile.selected_chapter or "")
    topic = data.topic.strip() if data.topic else (chapter or subject)
    difficulty = (data.difficulty or "medium").lower()
    q_count = max(3, min(15, data.question_count or 5))

    # 2. Retrieve recent question hashes to actively avoid duplicates
    recent_qs = (
        db.query(GeneratedGameQuestion.question_hash)
        .filter(
            GeneratedGameQuestion.user_id == current_user.id,
            GeneratedGameQuestion.game_type == data.game_type,
            GeneratedGameQuestion.subject == subject,
        )
        .order_by(GeneratedGameQuestion.created_at.desc())
        .limit(20)
        .all()
    )
    recent_hashes = [r[0] for r in recent_qs if r[0]]

    # 3. Generate challenges using Groq AI Engine
    content = generate_course_aware_game_content(
        game_type=data.game_type,
        course_category=category,
        course_name=course_name,
        branch_or_stream=branch_or_stream,
        class_or_semester=class_or_semester,
        subject=subject,
        chapter=chapter,
        topic=topic,
        difficulty=difficulty,
        question_count=q_count,
        recent_hashes=recent_hashes,
    )

    payload_data = content.get("data", [])

    # 4. Record generated questions in persistence store to guarantee uniqueness
    try:
        items_to_log = payload_data if isinstance(payload_data, list) else [payload_data]
        for item in items_to_log:
            q_text = str(item.get("question") or item.get("title") or item.get("statement") or item.get("word") or "")
            if q_text:
                q_hash = str(item.get("hash") or abs(hash(q_text)))[:16]
                record = GeneratedGameQuestion(
                    user_id=current_user.id,
                    game_type=data.game_type,
                    question_hash=q_hash,
                    course=course_name,
                    subject=subject,
                    chapter=chapter,
                    topic=topic,
                    difficulty=difficulty,
                    question_text=q_text[:400],
                    question_payload=json.dumps(item),
                    is_ai_generated=bool(content.get("is_ai_generated", True)),
                )
                db.add(record)
        db.commit()
    except Exception as e:
        print("[Game Logger] Question save notice:", e)

    return {
        "success": True,
        "game_type": data.game_type,
        "course": course_name,
        "subject": subject,
        "chapter": chapter,
        "topic": topic,
        "difficulty": difficulty,
        "is_ai_generated": content.get("is_ai_generated", True),
        "fallback_mode": content.get("fallback_mode", False),
        "notice": content.get("notice", ""),
        "payload": payload_data,
    }


@app.post("/api/games/submit")
def api_submit_game(
    data: GameSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit game score, award gaming XP, update streak and check badges.
    Strictly separate from academic study hours / daily goal.
    """
    score = max(0, data.score)
    max_score = max(1, data.max_score or 100)
    percentage = round((score / max_score) * 100)

    # Calculate gaming XP: 20 base XP for completion + bonus proportional to score
    xp_earned = max(10, int(score * 0.5) + (25 if percentage >= 80 else 0))

    session_record = GameSession(
        user_id=current_user.id,
        game_type=data.game_type,
        course=data.course or current_user.course or "General",
        subject=data.subject,
        topic=data.topic or data.subject,
        difficulty=data.difficulty or "medium",
        score=score,
        max_score=max_score,
        xp_earned=xp_earned,
        time_taken_seconds=max(0, data.time_taken_seconds or 0),
        details=json.dumps(data.details or {}),
    )
    db.add(session_record)

    profile = get_or_create_gaming_profile(db, current_user.id)
    profile.gaming_xp += xp_earned
    profile.games_played += 1
    if percentage >= 60:
        profile.games_won += 1
        profile.current_game_streak += 1
    else:
        profile.current_game_streak = max(0, profile.current_game_streak - 1)

    if score > profile.highest_score:
        profile.highest_score = score

    # Compute gaming level (100 XP per level)
    profile.gaming_level = 1 + (profile.gaming_xp // 100)
    profile.last_played_at = datetime.now(timezone.utc)

    # Badges evaluation
    current_badges = json.loads(profile.badges or "[]")
    earned_new_badge = None

    if profile.games_played >= 1 and "Novice Gamer" not in current_badges:
        current_badges.append("Novice Gamer")
        earned_new_badge = "Novice Gamer"

    if profile.games_won >= 5 and "Victory Ace" not in current_badges:
        current_badges.append("Victory Ace")
        earned_new_badge = "Victory Ace"

    if profile.current_game_streak >= 3 and "On Fire (3-Streak)" not in current_badges:
        current_badges.append("On Fire (3-Streak)")
        earned_new_badge = "On Fire (3-Streak)"

    if profile.gaming_level >= 5 and "Grandmaster" not in current_badges:
        current_badges.append("Grandmaster")
        earned_new_badge = "Grandmaster"

    profile.badges = json.dumps(current_badges)
    db.commit()

    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_gaming_xp": profile.gaming_xp,
        "gaming_level": profile.gaming_level,
        "games_played": profile.games_played,
        "games_won": profile.games_won,
        "streak": profile.current_game_streak,
        "percentage": percentage,
        "badges": current_badges,
        "new_badge": earned_new_badge,
    }


@app.get("/api/games/stats")
def api_get_game_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get student's gaming profile, XP, level, badges, and win rates."""
    profile = get_or_create_gaming_profile(db, current_user.id)
    db.commit()

    badges_list = json.loads(profile.badges or "[]")
    win_rate = round((profile.games_won / profile.games_played) * 100) if profile.games_played > 0 else 0

    return {
        "gaming_xp": profile.gaming_xp,
        "gaming_level": profile.gaming_level,
        "games_played": profile.games_played,
        "games_won": profile.games_won,
        "win_rate": win_rate,
        "streak": profile.current_game_streak,
        "highest_score": profile.highest_score,
        "badges": badges_list,
        "xp_for_next_level": 100 - (profile.gaming_xp % 100),
    }


@app.get("/api/games/history")
def api_get_game_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve recent game sessions."""
    sessions = (
        db.query(GameSession)
        .filter(GameSession.user_id == current_user.id)
        .order_by(GameSession.created_at.desc())
        .limit(15)
        .all()
    )

    return [
        {
            "id": s.id,
            "game_type": s.game_type,
            "subject": s.subject,
            "topic": s.topic,
            "difficulty": s.difficulty,
            "score": s.score,
            "max_score": s.max_score,
            "xp_earned": s.xp_earned,
            "time_taken_seconds": s.time_taken_seconds,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@app.get("/api/games/recommendations")
def api_get_game_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Recommends subjects & topics based on game history and mistakes.
    """
    user_subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    subject_names = [s.name for s in user_subjects]

    if not subject_names:
        course = current_user.course or "JEE"
        if "JEE" in course:
            subject_names = ["Physics", "Chemistry", "Mathematics"]
        elif "NEET" in course:
            subject_names = ["Biology", "Physics", "Chemistry"]
        else:
            subject_names = ["C Programming", "Data Structures", "Engineering Mathematics"]

    recommendations = [
        {
            "subject": subject_names[0],
            "topic": "Core Fundamentals & Quick Quiz",
            "game_type": "quiz",
            "reason": "Test your mastery on core syllabus concepts",
        },
        {
            "subject": subject_names[min(1, len(subject_names) - 1)],
            "topic": "Formula Mastery & Calculations",
            "game_type": "formula",
            "reason": "Reinforce essential formulas and constants",
        },
        {
            "subject": subject_names[min(2, len(subject_names) - 1)],
            "topic": "Speed Challenge & Intuition Sprint",
            "game_type": "speed",
            "reason": "Build rapid reaction speed under 60-second pressure",
        },
    ]

    return recommendations

