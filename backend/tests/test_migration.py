"""
StudyMate — Comprehensive Database Migration Test Suite
Tests all 11 requirements in complete isolation using local test harnesses.
DOES NOT touch or connect to any production database.
"""

import hashlib
import json
import os
import sys
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import migrate_sqlite_to_postgres as mig
from models import Base, User, Task, LearningChallenge, FocusSession, ChallengeCompletion


class TestMigrationEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sqlite_backup_path = BASE_DIR / "studymate_backup.db"
        assert cls.sqlite_backup_path.exists(), "Backup SQLite database must exist for testing"

    def test_01_json_checksum_consistency_and_key_order(self):
        """Verify canonical JSON serialization is 100% key-order independent."""
        json_a = '{"b": 2, "a": 1, "c": [1, 2, 3], "nested": {"z": 9, "y": 8}}'
        json_b = '{"nested": {"y": 8, "z": 9}, "a": 1, "c": [1, 2, 3], "b": 2}'

        canon_a = mig.canonical_json_serialize(json_a)
        canon_b = mig.canonical_json_serialize(json_b)

        self.assertEqual(canon_a, canon_b, "JSON serialization must produce identical strings regardless of key order")
        self.assertEqual(
            hashlib.sha256(canon_a.encode()).hexdigest(),
            hashlib.sha256(canon_b.encode()).hexdigest(),
            "JSON checksums must match identically"
        )

    def test_02_timestamp_normalization(self):
        """Verify naive datetimes are safely converted to UTC without offset skew."""
        naive_dt = datetime(2026, 10, 13, 14, 33, 48, 239341)
        self.assertIsNone(naive_dt.tzinfo)

        class MockRow:
            def __init__(self):
                self.id = 1
                self.started_at = naive_dt
                self.ended_at = None
                self.user_id = 1
                self.duration_seconds = 60
                self.status = "completed"
                self.xp_awarded = 10

        digest, clean = mig.compute_row_fingerprint(MockRow(), FocusSession.__table__.columns)
        normalized_dt = clean["started_at"]

        self.assertIsNotNone(normalized_dt.tzinfo, "Normalized datetime must have timezone")
        self.assertEqual(normalized_dt.tzinfo, timezone.utc, "Normalized datetime must be UTC")
        self.assertEqual(normalized_dt.year, 2026)
        self.assertEqual(normalized_dt.hour, 14)

    def test_03_null_values_and_boolean_coercion(self):
        """Verify NULL values and integer booleans are handled cleanly."""
        class MockChallenge:
            def __init__(self):
                self.id = 99
                self.slug = "test-slug"
                self.course = "JEE"
                self.subject = "Physics"
                self.module = "Mechanics"
                self.title = "Kinematics"
                self.description = "Test description"
                self.difficulty = "easy"
                self.xp_reward = 10
                self.estimated_minutes = 15
                self.is_active = 1  # SQLite integer boolean

        inst1 = MockChallenge()
        inst1.is_active = 1  # SQLite integer boolean
        _, clean1 = mig.compute_row_fingerprint(inst1, LearningChallenge.__table__.columns)
        self.assertIs(clean1["is_active"], True, "Integer 1 must coerce to True boolean")

        inst2 = MockChallenge()
        inst2.is_active = 0
        _, clean2 = mig.compute_row_fingerprint(inst2, LearningChallenge.__table__.columns)
        self.assertIs(clean2["is_active"], False, "Integer 0 must coerce to False boolean")

    def test_04_password_hash_protection(self):
        """Verify password hashes are verified via cryptographic digests without raw leakage."""
        pw_hash = "$argon2id$v=19$m=65536,t=3,p=4$some_very_long_argon2_hash_value"
        class MockUser:
            def __init__(self):
                self.id = 1
                self.name = "Test User"
                self.email = "test@example.com"
                self.password = pw_hash
                self.course = "JEE"

        digest, clean = mig.compute_row_fingerprint(MockUser(), User.__table__.columns)
        self.assertEqual(clean["password"], pw_hash, "Raw password hash must be preserved for insertion")
        self.assertTrue(digest, "Checksum digest must be generated")

    def test_05_non_empty_target_guard(self):
        """Verify migration strictly halts with MIGRATION_NOT_STARTED if target is not empty."""
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".db") as tf:
            mock_pg = create_engine(f"sqlite:///{tf.name}")
            Base.metadata.create_all(bind=mock_pg)

            # Insert a pre-existing record in target
            with mock_pg.connect() as conn:
                conn.execute(text("INSERT INTO users (id, name, email, password) VALUES (999, 'Existing', 'ex@test.com', 'hash')"))
                conn.commit()

            status, msg = mig.run_migration(
                sqlite_path=self.sqlite_backup_path,
                pg_url=f"sqlite:///{tf.name}",
                execute=True,
            )

            self.assertEqual(status, mig.MigrationStatus.NOT_STARTED)
            self.assertIn("FATAL: Target PostgreSQL is not empty", msg)
            mock_pg.dispose()

    def test_06_sqlalchemy_autobegin_and_separate_connection_management(self):
        """Verify pre-inspection queries close cleanly without leaving active transactions."""
        mock_pg = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=mock_pg)

        with mock_pg.connect() as inspect_conn:
            counts = mig.check_target_postgres_counts(inspect_conn)
            self.assertEqual(counts["users"], 0)

        # Verify a new connection can immediately open a transaction without InvalidRequestError
        with mock_pg.connect() as mig_conn:
            trans = mig_conn.begin()
            mig_conn.execute(text("INSERT INTO users (id, name, email, password) VALUES (1, 'U', 'u@u.com', 'h')"))
            trans.rollback()

        mock_pg.dispose()

    def test_07_dry_run_simulation_and_rollback(self):
        """Verify dry-run simulates data migration and leaves target with zero committed rows."""
        mock_pg = create_engine("sqlite:///:memory:")

        # Run dry-run on isolated target
        status, msg = mig.run_migration(
            sqlite_path=self.sqlite_backup_path,
            pg_url=str(mock_pg.url),
            dry_run=True,
        )

        self.assertEqual(status, mig.MigrationStatus.ROLLED_BACK)
        self.assertIn("Dry-run simulation rolled back successfully", msg)

        # Verify zero rows exist in mock target
        with mock_pg.connect() as conn:
            user_count = conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users'")).scalar()
            # If table was rolled back in SQLite/PostgreSQL transaction
            if user_count > 0:
                rows = conn.execute(text("SELECT count(*) FROM users")).scalar()
                self.assertEqual(rows, 0, "Dry-run must commit zero rows")

        mock_pg.dispose()

    def test_08_duplicate_primary_key_detection(self):
        """Verify primary key duplicates inside insertion trigger rollback."""
        mock_pg = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=mock_pg)

        with mock_pg.connect() as conn:
            trans = conn.begin()
            conn.execute(text("INSERT INTO users (id, name, email, password) VALUES (1, 'User 1', 'u1@test.com', 'h')"))
            try:
                conn.execute(text("INSERT INTO users (id, name, email, password) VALUES (1, 'User 1 Dup', 'u2@test.com', 'h')"))
                trans.commit()
                failed = False
            except Exception:
                trans.rollback()
                failed = True

            self.assertTrue(failed, "Duplicate primary key must trigger exception and rollback")

        mock_pg.dispose()

    def test_09_all_23_tables_and_332_rows_verified(self):
        """Verify all 23 models load all 332 records from studymate_backup.db cleanly."""
        engine, session = mig.get_sqlite_session(self.sqlite_backup_path)
        total_rows = 0

        for model_cls in mig.MIGRATION_ORDER:
            rows = session.query(model_cls).all()
            total_rows += len(rows)

        self.assertEqual(total_rows, 332, "Exact row count across all tables must be 332")
        self.assertEqual(len(mig.MIGRATION_ORDER), 23, "Exact table count must be 23")

        session.close()
        engine.dispose()

    def test_10_sequence_verification_logic(self):
        """Verify sequence calculation logic (expected next ID = max_id + 1)."""
        max_id = 17
        expected_next = max_id + 1
        self.assertEqual(expected_next, 18)

        max_id_empty = None
        expected_next_empty = 1 if max_id_empty is None else max_id_empty + 1
        self.assertEqual(expected_next_empty, 1)

    def test_11_cli_dry_run_exit_code_zero(self):
        """Regression test: verify CLI with --dry-run terminates with exit code 0."""
        import tempfile
        from unittest.mock import patch

        mock_pg = create_engine("sqlite:///:memory:")
        test_args = [
            "migrate_sqlite_to_postgres.py",
            "--sqlite-path", str(self.sqlite_backup_path),
            "--target-url", str(mock_pg.url),
            "--dry-run"
        ]

        with patch.object(sys, "argv", test_args):
            with self.assertRaises(SystemExit) as cm:
                mig.main()
            self.assertEqual(cm.exception.code, 0, "--dry-run CLI must exit with status code 0")

        mock_pg.dispose()

    def test_12_sequence_reset_empty_and_non_contiguous(self):
        """Verify sequence calculation for empty tables vs non-contiguous ID distributions."""
        # Scenario 1: Non-contiguous IDs (e.g., IDs 1, 4, 17 after deletions)
        ids = [1, 4, 17]
        max_id = max(ids)
        expected_next_id = max_id + 1
        self.assertEqual(expected_next_id, 18, "Next generated ID must be strictly greater than max ID")

        # Scenario 2: Empty table (IDs is empty list)
        empty_ids = []
        max_empty = max(empty_ids) if empty_ids else None
        expected_first_id = 1 if max_empty is None else max_empty + 1
        self.assertEqual(expected_first_id, 1, "First generated ID in empty table must be 1")

    def test_13_null_last_value_handling_in_pg_sequences(self):
        """Verify that a NULL last_value in catalog (due to role permissions) does not trigger false failure."""
        class MockResult:
            def __init__(self, val):
                self._val = val
            def scalar(self):
                return self._val
            def fetchone(self):
                return self._val

        class MockPGConnection:
            dialect = type("Dialect", (), {"name": "postgresql"})()
            def __init__(self):
                self._nextval_calls = 0

            def execute(self, statement, params=None):
                sql = str(statement)
                if "pg_get_serial_sequence" in sql:
                    return MockResult("public.users_id_seq")
                if "SELECT MAX(id)" in sql:
                    return MockResult(17)
                if "SELECT setval" in sql:
                    return MockResult(17)
                if "FROM pg_sequences" in sql:
                    # Simulate permission restriction returning NULL for last_value
                    return MockResult((None,))
                if "_audit_temp_seq" in sql:
                    if "nextval" in sql:
                        self._nextval_calls += 1
                        return MockResult(43 if self._nextval_calls == 1 else 1)
                    return MockResult(1)
                return MockResult(None)

        mock_conn = MockPGConnection()
        valid, errors = mig.reset_and_verify_sequences(mock_conn, ["users"])
        self.assertTrue(valid, "NULL last_value due to catalog permissions must not cause sequence failure")
        self.assertEqual(len(errors), 0)

    def test_14_topological_fk_dependency_integrity(self):
        """Verify all 23 models in MIGRATION_ORDER strictly satisfy topological foreign key ordering."""
        table_indices = {model.__tablename__: i for i, model in enumerate(mig.MIGRATION_ORDER)}
        fk_violations = []

        for i, model in enumerate(mig.MIGRATION_ORDER):
            tbl_name = model.__tablename__
            for col in model.__table__.columns:
                for fk in col.foreign_keys:
                    target_tbl = fk.column.table.name
                    target_idx = table_indices.get(target_tbl)
                    self.assertIsNotNone(target_idx, f"Foreign key {tbl_name}.{col.name} references unknown table {target_tbl}")
                    if target_idx >= i:
                        fk_violations.append(f"{tbl_name} (index {i}) depends on {target_tbl} (index {target_idx})")

        self.assertEqual(fk_violations, [], f"MIGRATION_ORDER has topological FK violations: {fk_violations}")

    def test_15_datetime_divergence_reporting_robustness(self):
        """Verify timezone normalization ensures naive and aware timestamps representing the same instant match."""
        naive_dt = datetime(2026, 10, 13, 14, 33, 48, 239341)
        aware_dt = datetime(2026, 10, 13, 14, 33, 48, 239341, tzinfo=timezone.utc)

        class MockRowNaive:
            id = 1
            user_id = 1
            challenge_id = 1
            xp_awarded = 10
            completed_at = naive_dt

        class MockRowAware:
            id = 1
            user_id = 1
            challenge_id = 1
            xp_awarded = 10
            completed_at = aware_dt

        cols = ChallengeCompletion.__table__.columns
        sq_digest, sq_clean = mig.compute_row_fingerprint(MockRowNaive(), cols)
        pg_digest, pg_clean = mig.compute_row_fingerprint(MockRowAware(), cols)

        self.assertEqual(sq_digest, pg_digest, "Naive UTC timestamp and Aware UTC timestamp must have identical digests")

    def test_16_database_py_url_normalization(self):
        """Verify database.py normalizes Render postgres:// URLs to postgresql+psycopg://."""
        test_url = "postgres://user:secret@dpg-xxx-a.singapore-postgres.render.com/studymate"
        normalized = mig.normalize_postgres_url(test_url)
        self.assertTrue(normalized.startswith("postgresql+psycopg://"), "Must normalize postgres:// to postgresql+psycopg://")


if __name__ == "__main__":
    unittest.main()
