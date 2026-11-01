from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    course = Column(String, default="JEE (Main & Advanced)", nullable=True)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Integer, default=0, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)


class LearningChallenge(Base):
    __tablename__ = "learning_challenges"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    course = Column(String(100), default="JEE (Main & Advanced)", nullable=False, index=True)
    subject = Column(String(120), nullable=False, index=True)
    module = Column(String(120), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False)
    xp_reward = Column(Integer, nullable=False, default=10)
    estimated_minutes = Column(Integer, nullable=False, default=20)
    is_active = Column(Boolean, nullable=False, default=True)


class GamificationProfile(Base):
    __tablename__ = "gamification_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_xp = Column(Integer, nullable=False, default=0)
    current_streak = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
    last_activity_date = Column(Date, nullable=True)


class ChallengeCompletion(Base):
    __tablename__ = "challenge_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("learning_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    xp_awarded = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", name="uq_user_challenge_completion"),
    )


class StudyActivity(Base):
    __tablename__ = "study_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "activity_date", name="uq_user_study_activity_date"),
    )


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_key = Column(String(80), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "badge_key", name="uq_user_badge"),
    )


class StudyGoalProfile(Base):
    __tablename__ = "study_goal_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    target_minutes = Column(Integer, nullable=False, default=60)


class StudyDay(Base):
    __tablename__ = "study_days"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    study_date = Column(Date, nullable=False, index=True)
    target_minutes = Column(Integer, nullable=False, default=60)
    completed_seconds = Column(Integer, nullable=False, default=0)
    goal_met = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("user_id", "study_date", name="uq_study_day_user_date"),
    )


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="running")
    xp_awarded = Column(Integer, nullable=False, default=0)


class TaskReward(Base):
    __tablename__ = "task_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, nullable=False)
    xp_awarded = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "task_id", name="uq_task_reward_user_task"),
    )


class GeneratedTest(Base):
    __tablename__ = "generated_tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course = Column(String(150), nullable=False)
    subject = Column(String(150), nullable=False)
    chapter = Column(String(200), nullable=False)
    difficulty = Column(String(20), nullable=False, default="medium")
    total_questions = Column(Integer, nullable=False, default=5)
    time_limit_minutes = Column(Integer, nullable=False, default=15)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("generated_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=False)  # JSON-encoded array of options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False, default="")

    test = relationship("GeneratedTest", back_populates="questions")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("generated_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False, default=0)
    total_marks = Column(Integer, nullable=False, default=0)
    percentage = Column(Integer, nullable=False, default=0)
    time_taken_seconds = Column(Integer, nullable=False, default=0)
    user_answers = Column(Text, nullable=False, default="{}")  # JSON string
    completed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    test = relationship("GeneratedTest", back_populates="attempts")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_type = Column(String(50), nullable=False, index=True)  # quiz, code, debug, formula, concept, memory, speed, scramble
    course = Column(String(150), nullable=False)
    subject = Column(String(150), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    difficulty = Column(String(20), nullable=False, default="medium")
    score = Column(Integer, nullable=False, default=0)
    max_score = Column(Integer, nullable=False, default=100)
    xp_earned = Column(Integer, nullable=False, default=0)
    time_taken_seconds = Column(Integer, nullable=False, default=0)
    details = Column(Text, nullable=False, default="{}")  # JSON metadata: questions, correct count, accuracy
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class GamingProfile(Base):
    __tablename__ = "gaming_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    gaming_xp = Column(Integer, nullable=False, default=0)
    gaming_level = Column(Integer, nullable=False, default=1)
    games_played = Column(Integer, nullable=False, default=0)
    games_won = Column(Integer, nullable=False, default=0)
    current_game_streak = Column(Integer, nullable=False, default=0)
    highest_score = Column(Integer, nullable=False, default=0)
    badges = Column(Text, nullable=False, default="[]")  # JSON array
    last_played_at = Column(DateTime(timezone=True), nullable=True)


class AcademicProfile(Base):
    __tablename__ = "academic_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, default="competitive")  # school, competitive, undergraduate
    course_name = Column(String(100), nullable=False, default="JEE Main")  # e.g. Class 10, JEE Advanced, B.Tech
    branch_or_stream = Column(String(100), nullable=True, default="")      # e.g. CSE, Science (PCM)
    class_or_semester = Column(String(50), nullable=True, default="")      # e.g. Semester 1, Class 10
    board_or_exam = Column(String(100), nullable=True, default="")         # e.g. CBSE, JEE Advanced
    preparation_level = Column(String(50), nullable=True, default="Regular")
    target_year = Column(String(20), nullable=True, default="2026")
    selected_subject = Column(String(100), nullable=True, default="")
    selected_chapter = Column(String(150), nullable=True, default="")
    selected_topic = Column(String(150), nullable=True, default="")
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    @property
    def branch(self) -> str:
        """Alias for branch_or_stream to ensure uniform field access across modules."""
        return self.branch_or_stream or ""

    @branch.setter
    def branch(self, value: Optional[str]):
        self.branch_or_stream = value or ""

    @property
    def course(self) -> str:
        """Alias for course_name to ensure uniform field access across modules."""
        return self.course_name or ""

    @course.setter
    def course(self, value: Optional[str]):
        self.course_name = value or ""


class GeneratedGameQuestion(Base):
    __tablename__ = "generated_game_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_type = Column(String(50), nullable=False, index=True)
    question_hash = Column(String(64), nullable=False, index=True)  # SHA-256 fingerprint
    course = Column(String(150), nullable=False)
    subject = Column(String(150), nullable=False, index=True)
    chapter = Column(String(200), nullable=True, default="")
    topic = Column(String(200), nullable=True, default="")
    difficulty = Column(String(20), nullable=False, default="medium")
    question_text = Column(Text, nullable=False)
    question_payload = Column(Text, nullable=False)  # JSON payload
    is_ai_generated = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class DailyAIChallengeSet(Base):
    __tablename__ = "daily_ai_challenge_sets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course = Column(String(100), nullable=False, index=True)
    class_or_semester = Column(String(50), nullable=True, default="")
    branch = Column(String(100), nullable=True, default="")
    generation_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    generation_status = Column(String(20), nullable=False, default="ready")
    total_questions = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    questions = relationship("AIGeneratedChallengeQuestion", back_populates="challenge_set", cascade="all, delete-orphan")


class AIGeneratedChallengeQuestion(Base):
    __tablename__ = "ai_generated_challenge_questions"

    id = Column(Integer, primary_key=True, index=True)
    challenge_set_id = Column(Integer, ForeignKey("daily_ai_challenge_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(150), nullable=True, default="")
    difficulty = Column(String(20), nullable=False, default="medium")
    title = Column(String(255), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=False)  # JSON string array of 4 options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    xp_reward = Column(Integer, nullable=False, default=10)
    question_fingerprint = Column(String(64), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    challenge_set = relationship("DailyAIChallengeSet", back_populates="questions")


class AIDailyChallengeCompletion(Base):
    __tablename__ = "ai_daily_challenge_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("ai_generated_challenge_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_set_id = Column(Integer, ForeignKey("daily_ai_challenge_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=True)
    xp_awarded = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_user_ai_question_completion"),)


