"""
StudyMate — AI Daily Challenge Generator & Academic Profile Test Suite
Validates fix for: "'AcademicProfile' object has no attribute 'branch'"
Tests all 8 required architectural scenarios in complete isolation.
"""

import json
import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import (
    AcademicProfile,
    AIGeneratedChallengeQuestion,
    Base,
    DailyAIChallengeSet,
    User,
)
import main
from daily_challenge_generator import generate_daily_challenges_for_profile


def mock_valid_groq_response(count=10):
    """Generate a valid mock Groq API response with `count` questions with 4 distinct options."""
    questions = []
    for i in range(count):
        opt_a = f"Kinetic energy formula variant A_{i+1}"
        opt_b = f"Potential energy formula variant B_{i+1}"
        opt_c = f"Mechanical energy formula variant C_{i+1}"
        opt_d = f"Total energy formula variant D_{i+1}"
        questions.append({
            "subject": "Physics",
            "topic": f"Mechanics Topic {i+1}",
            "difficulty": "medium",
            "title": f"Challenge Question {i+1}",
            "question": f"What is the theoretical kinetic energy formulation at stage {i+1} given mass m and velocity v?",
            "options": [opt_a, opt_b, opt_c, opt_d],
            "correct_answer": opt_a,
            "explanation": f"Formulation A_{i+1} is derived from the work-energy theorem for stage {i+1}.",
            "xp_reward": 20,
        })
    return {"questions": questions}


class TestDailyChallengeGenerator(unittest.TestCase):
    def setUp(self):
        # Create an isolated in-memory SQLite database for each test
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Seed a test user
        self.user = User(
            id=1,
            name="Test Student",
            email="student@studymate.test",
            password="mock_argon2_hash",
            course="JEE (Main & Advanced)",
        )
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_01_academic_profile_all_expected_fields(self):
        """Scenario 1: AcademicProfile with all expected fields and property aliases."""
        profile = AcademicProfile(
            user_id=self.user.id,
            category="undergraduate",
            course_name="B.Tech / B.E.",
            branch_or_stream="Computer Science & Engineering",
            class_or_semester="Semester 1",
            board_or_exam="University Exam",
            preparation_level="Advanced",
            target_year="2027",
            selected_subject="Programming for Problem Solving in C",
            selected_chapter="Control Flow & Conditional Statements",
            selected_topic="Pointers & Dynamic Memory Allocation",
        )
        self.db.add(profile)
        self.db.commit()

        # Verify underlying column values
        self.assertEqual(profile.course_name, "B.Tech / B.E.")
        self.assertEqual(profile.branch_or_stream, "Computer Science & Engineering")

        # Verify property aliases work seamlessly
        self.assertEqual(profile.branch, "Computer Science & Engineering")
        self.assertEqual(profile.course, "B.Tech / B.E.")

        # Test setter aliases
        profile.branch = "Artificial Intelligence & Data Science"
        profile.course = "B.Tech AIML"
        self.db.commit()

        self.assertEqual(profile.branch_or_stream, "Artificial Intelligence & Data Science")
        self.assertEqual(profile.course_name, "B.Tech AIML")

    def test_02_academic_profile_optional_fields_missing(self):
        """Scenario 2: AcademicProfile with optional fields missing (None or empty)."""
        profile = AcademicProfile(
            user_id=self.user.id,
            category="competitive",
            course_name="JEE Main",
            branch_or_stream=None,
            class_or_semester="",
        )
        self.db.add(profile)
        self.db.commit()

        # Verify accessing .branch and .course NEVER raises AttributeError
        self.assertEqual(profile.branch, "")
        self.assertEqual(profile.course, "JEE Main")
        self.assertIn(profile.branch_or_stream, (None, ""))

    def test_03_academic_profile_no_associated_record(self):
        """Scenario 3: User with no associated AcademicProfile record."""
        # Ensure user has no profile
        self.assertIsNone(
            self.db.query(AcademicProfile).filter_by(user_id=self.user.id).first()
        )

        with patch("main.generate_daily_challenges_for_profile") as mock_gen:
            mock_gen.return_value = [
                {
                    "subject": "Physics",
                    "topic": "Kinematics",
                    "difficulty": "medium",
                    "title": "Projectile Velocity",
                    "question": "What is the projectile velocity at apex?",
                    "options": ["u*cos(theta)", "0", "u*sin(theta)", "u"],
                    "correct_answer": "u*cos(theta)",
                    "explanation": "At apex, vertical velocity is 0 and horizontal is u*cos(theta).",
                    "xp_reward": 20,
                    "question_fingerprint": "mock_fp_1",
                }
            ]

            # Call get_or_create_daily_challenges without profile
            challenge_set, questions = main.get_or_create_daily_challenges(
                db=self.db,
                user=self.user,
                force_refresh=True,
            )

            # Must succeed without AttributeError
            self.assertIsNotNone(challenge_set)
            self.assertEqual(len(questions), 1)
            self.assertEqual(challenge_set.course, "JEE (Main & Advanced)")
            self.assertEqual(challenge_set.branch, "")

    def test_04_ai_challenge_generation_with_valid_profile(self):
        """Scenario 4: AI challenge generation with a valid complete profile."""
        profile = AcademicProfile(
            user_id=self.user.id,
            category="undergraduate",
            course_name="B.Tech / B.E.",
            branch_or_stream="Computer Science & Engineering",
            class_or_semester="Semester 2",
        )
        self.db.add(profile)
        self.db.commit()

        mock_payload = mock_valid_groq_response(10)
        with patch("daily_challenge_generator._call_groq_completion", return_value=mock_payload):
            challenge_set, questions = main.get_or_create_daily_challenges(
                db=self.db,
                user=self.user,
                force_refresh=True,
            )

            self.assertEqual(len(questions), 10)
            self.assertEqual(challenge_set.total_questions, 10)
            self.assertEqual(challenge_set.course, "B.Tech / B.E.")
            self.assertEqual(challenge_set.branch, "Computer Science & Engineering")
            self.assertEqual(challenge_set.class_or_semester, "Semester 2")
            self.assertEqual(challenge_set.generation_status, "completed")

    def test_05_ai_challenge_generation_incomplete_profile(self):
        """Scenario 5: AI challenge generation with incomplete profile (regression test for bug)."""
        # User has an AcademicProfile, but branch_or_stream is empty (e.g. JEE student)
        profile = AcademicProfile(
            user_id=self.user.id,
            category="competitive",
            course_name="JEE Main",
            branch_or_stream="",
            class_or_semester="",
        )
        self.db.add(profile)
        self.db.commit()

        mock_payload = mock_valid_groq_response(5)
        with patch("daily_challenge_generator._call_groq_completion", return_value=mock_payload):
            # This previously crashed with "'AcademicProfile' object has no attribute 'branch'"
            challenge_set, questions = main.get_or_create_daily_challenges(
                db=self.db,
                user=self.user,
                force_refresh=True,
            )

            self.assertEqual(len(questions), 5)
            self.assertEqual(challenge_set.course, "JEE Main")
            self.assertEqual(challenge_set.branch, "")
            self.assertEqual(challenge_set.generation_status, "completed")

    def test_06_invalid_groq_response_handling(self):
        """Scenario 6: Handle malformed or unparseable Groq AI responses safely."""
        # Case A: Empty response
        with patch("daily_challenge_generator._call_groq_completion", return_value=None):
            with self.assertRaises(RuntimeError) as ctx:
                generate_daily_challenges_for_profile("JEE Main")
            self.assertIn("empty or unparseable", str(ctx.exception))

        # Case B: Response missing 'questions'
        with patch("daily_challenge_generator._call_groq_completion", return_value={"status": "error"}):
            with self.assertRaises(RuntimeError) as ctx:
                generate_daily_challenges_for_profile("JEE Main")
            self.assertIn("did not contain a valid 'questions' array", str(ctx.exception))

    def test_07_api_response_structure_and_security(self):
        """Scenario 7: Validate API response structure and ensure answers are never leaked before completion."""
        profile = AcademicProfile(
            user_id=self.user.id,
            category="competitive",
            course_name="JEE Main",
            branch_or_stream="",
        )
        self.db.add(profile)
        self.db.commit()

        mock_payload = mock_valid_groq_response(3)
        with patch("daily_challenge_generator._call_groq_completion", return_value=mock_payload):
            # Test GET endpoint response formatting
            response = main.get_daily_challenges(
                course="JEE Main",
                current_user=self.user,
                db=self.db,
            )

            self.assertIn("generation_date", response)
            self.assertIn("course", response)
            self.assertIn("total_challenges", response)
            self.assertIn("completed_count", response)
            self.assertIn("challenges", response)
            self.assertEqual(response["total_challenges"], 3)
            self.assertEqual(response["completed_count"], 0)

            # Security assertion: explanations and correct answers must be hidden before completion
            for ch in response["challenges"]:
                self.assertFalse(ch["completed"])
                self.assertIsNone(ch["explanation"])
                self.assertIsNone(ch["submitted_answer"])
                self.assertNotIn("correct_answer", ch)
                self.assertEqual(len(ch["options"]), 4)

    def test_08_existing_user_data_preservation(self):
        """Scenario 8: Verify that existing backup records remain valid and readable."""
        backup_path = BASE_DIR / "studymate_backup.db"
        self.assertTrue(backup_path.exists(), "Backup SQLite database must exist")

        backup_engine = create_engine(f"sqlite:///{backup_path}")
        BackupSession = sessionmaker(bind=backup_engine)
        b_session = BackupSession()

        try:
            users_count = b_session.query(User).count()
            self.assertEqual(users_count, 17, "All 17 existing users must be intact")

            acad_profiles = b_session.query(AcademicProfile).all()
            self.assertGreater(len(acad_profiles), 0, "Academic profiles must exist in backup")

            for prof in acad_profiles:
                # Verify that .branch and .course properties work on loaded backup records
                self.assertIsNotNone(prof.branch)
                self.assertIsNotNone(prof.course)
                self.assertEqual(prof.branch, prof.branch_or_stream or "")
                self.assertEqual(prof.course, prof.course_name or "")
        finally:
            b_session.close()
            backup_engine.dispose()


if __name__ == "__main__":
    unittest.main()
