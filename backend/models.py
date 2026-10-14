from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

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
    subject = Column(String(120), nullable=False, index=True)
    module = Column(String(120), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
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
    completed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "challenge_id", name="uq_challenge_completion_user_challenge"),)

class StudyActivity(Base):
    __tablename__ = "study_activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(Date, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "activity_date", name="uq_study_activity_user_date"),)

class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_key = Column(String(80), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "badge_key", name="uq_user_badge_user_key"),)

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
    __table_args__ = (UniqueConstraint("user_id", "study_date", name="uq_study_day_user_date"),)

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
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
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "task_id", name="uq_task_reward_user_task"),)
