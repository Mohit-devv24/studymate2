"""
StudyMate — AI-Powered Daily Learning Challenges Generator
Generates syllabus-authentic, dynamic daily learning challenges using Groq AI.
Zero predefined questions, zero static banks, genuine real-time AI generation.
"""

import hashlib
import json
import os
import ssl
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from academic_data import resolve_subjects, resolve_chapters


def get_groq_config():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    primary_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    return api_key, primary_model


def _call_groq_completion(prompt: str, system_prompt: str) -> Optional[dict]:
    """
    Call Groq API with robust fallback model list and json_object response format.
    """
    api_key, primary_model = get_groq_config()
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured on the server.")

    valid_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
    models_to_try = [primary_model] if primary_model in valid_models else ["openai/gpt-oss-120b"]
    for fallback in valid_models:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    url = "https://api.groq.com/openai/v1/chat/completions"
    ctx = ssl._create_unverified_context() if hasattr(ssl, "_create_unverified_context") else None

    last_error = None
    for model_name in models_to_try:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 3600,
            "response_format": {"type": "json_object"}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "StudyMate-DailyChallengeEngine/2.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=25, context=ctx) as response:
                body = response.read().decode("utf-8")
                res_json = json.loads(body)
                raw_content = res_json["choices"][0]["message"]["content"].strip()

                # Clean markdown backticks if returned
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("\n", 1)[1]
                    if raw_content.endswith("```"):
                        raw_content = raw_content.rsplit("```", 1)[0]

                parsed = json.loads(raw_content.strip())
                if isinstance(parsed, dict):
                    return parsed
        except urllib.error.HTTPError as he:
            last_error = f"HTTP {he.code}: {he.reason}"
            print(f"[DailyChallenge Groq] Model {model_name} failed: {last_error}")
            continue
        except Exception as e:
            last_error = str(e)
            print(f"[DailyChallenge Groq] Error on model {model_name}: {last_error}")
            continue

    raise RuntimeError(f"Groq AI generation failed across all available models: {last_error}")


def compute_fingerprint(course: str, subject: str, question_text: str) -> str:
    norm = f"{course.strip().lower()}:{subject.strip().lower()}:{question_text.strip().lower()}"
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


def generate_daily_challenges_for_profile(
    course: str,
    class_or_semester: Optional[str] = "",
    branch: Optional[str] = "",
    category: Optional[str] = "competitive",
    target_count: int = 10,
    total_count: Optional[int] = None,
    existing_fingerprints: Optional[set] = None
) -> List[Dict[str, Any]]:
    """
    Generate syllabus-authentic daily questions using Groq AI.
    Never returns static predefined questions. Raises RuntimeError if Groq fails.
    """
    if total_count is not None:
        target_count = total_count
    if existing_fingerprints is None:
        existing_fingerprints = set()

    # 1. Resolve student's subjects from academic syllabus
    c_lower = (course or "").lower()
    if not category or category == "competitive":
        if "jee" in c_lower or "neet" in c_lower or "cuet" in c_lower:
            category = "competitive"
        elif "class" in c_lower or "12th" in c_lower or "11th" in c_lower or "10th" in c_lower or "9th" in c_lower:
            category = "school"
        elif "b.tech" in c_lower or "btech" in c_lower or "engineering" in c_lower:
            category = "undergraduate"

    subjects = resolve_subjects(category or "competitive", course, branch or "", class_or_semester or "")
    if not subjects:
        # Fallback default subjects based on standard naming
        if "jee" in course.lower():
            subjects = ["Physics", "Chemistry", "Mathematics"]
        elif "neet" in course.lower():
            subjects = ["Physics", "Chemistry", "Biology"]
        elif "class 12" in (class_or_semester or course).lower():
            subjects = ["Physics", "Chemistry", "Mathematics"]
        elif "c programming" in course.lower() or "b.tech" in course.lower():
            subjects = ["Programming & Logic", "Mathematics", "Engineering Concepts"]
        else:
            subjects = ["Core Concepts", "Problem Solving", "Analytical Reasoning"]

    # Sample chapters for context
    sample_chapters = {}
    for sub in subjects:
        chaps = resolve_chapters(
            subject=sub,
            course_name=course,
            branch_or_stream=branch or "",
            class_or_semester=class_or_semester or "",
        )
        sample_chapters[sub] = chaps[:5] if chaps else ["Fundamentals", "Core Principles", "Applications"]

    system_prompt = f"""You are the Chief Academic Examination Controller and Senior Curriculum Designer for '{course}' ({class_or_semester} {branch}).
Your mission is to generate a fresh, rigorous, syllabus-aligned daily challenge set of exactly {target_count} multiple-choice questions for a student today.

CRITICAL RULES:
1. ALL questions MUST be strictly relevant to {course} syllabus and the provided subjects: {', '.join(subjects)}.
2. Never ask out-of-syllabus questions.
3. Every question MUST have:
   - "subject": exact subject from {subjects}
   - "topic": specific chapter or topic
   - "difficulty": "easy", "medium", or "hard" (Provide approximately 4 easy, 4 medium, and 2 hard)
   - "title": concise academic concept title (3-6 words, e.g. "Work-Energy Theorem Application", "SN2 Inversion of Configuration")
   - "question": clear, self-contained academic question statement
   - "options": an array of EXACTLY 4 distinct, plausible answer strings
   - "correct_answer": the EXACT string matching one of the 4 options
   - "explanation": 2-3 sentences of rigorous mathematical, scientific or logical explanation of why this answer is correct
   - "xp_reward": 10 for easy, 20 for medium, 30 for hard
4. Output MUST be a valid JSON object matching this schema:
{{
  "questions": [
    {{
      "subject": "Physics",
      "topic": "Kinematics",
      "difficulty": "easy",
      "title": "Projectile Maximum Height",
      "question": "What is the maximum height reached by a projectile launched with speed u at angle theta with the horizontal?",
      "options": ["u^2 * sin^2(theta) / (2*g)", "u^2 * sin(2*theta) / g", "u * sin(theta) / g", "2 * u^2 * sin^2(theta) / g"],
      "correct_answer": "u^2 * sin^2(theta) / (2*g)",
      "explanation": "At maximum height, vertical velocity component vy = 0. Using v^2 = u^2 - 2gh gives h = (u*sin(theta))^2 / (2*g).",
      "xp_reward": 10
    }}
  ]
}}"""

    user_prompt = f"""Generate exactly {target_count} distinct daily learning challenge questions for:
Course: {course}
Class/Semester: {class_or_semester or 'N/A'}
Branch/Stream: {branch or 'N/A'}
Target Subjects: {json.dumps(subjects)}
Subject Key Chapters: {json.dumps(sample_chapters)}

Ensure healthy difficulty distribution: 4 Easy (+10 XP), 4 Medium (+20 XP), 2 Hard (+30 XP).
Do not repeat standard textbook cliches; formulate fresh, authentic conceptual challenges."""

    parsed_res = _call_groq_completion(user_prompt, system_prompt)
    if not parsed_res or not isinstance(parsed_res, dict):
        raise RuntimeError("Groq API returned an empty or unparseable response.")

    raw_questions = parsed_res.get("questions")
    if not raw_questions or not isinstance(raw_questions, list):
        # Check if wrapped in another key
        for k, v in parsed_res.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                raw_questions = v
                break

    if not raw_questions or not isinstance(raw_questions, list):
        raise RuntimeError("Groq API response did not contain a valid 'questions' array.")

    validated_questions: List[Dict[str, Any]] = []

    for q in raw_questions:
        if not isinstance(q, dict):
            continue

        subj = str(q.get("subject", "")).strip()
        topic = str(q.get("topic", "")).strip() or "General Concept"
        diff = str(q.get("difficulty", "medium")).lower().strip()
        if diff not in ["easy", "medium", "hard"]:
            diff = "medium"

        title = str(q.get("title", "")).strip()
        q_text = str(q.get("question", "")).strip()
        opts = q.get("options", [])
        correct = str(q.get("correct_answer", "")).strip()
        explanation = str(q.get("explanation", "")).strip()

        # Validation rules:
        if not q_text or len(q_text) < 10:
            continue
        if not isinstance(opts, list) or len(opts) != 4:
            continue

        opts_cleaned = [str(o).strip() for o in opts if str(o).strip()]
        if len(set(opts_cleaned)) != 4:
            continue  # Must have 4 unique options

        # Verify correct_answer matches one of the options
        matching_opt = None
        for opt in opts_cleaned:
            if opt.lower() == correct.lower():
                matching_opt = opt
                break

        if not matching_opt:
            continue

        if not explanation:
            explanation = f"The correct answer is '{matching_opt}' based on fundamental principles of {subj}."

        if not title:
            title = topic[:40] if topic else f"{subj} Challenge"

        # Determine XP reward based on difficulty
        xp = 10 if diff == "easy" else (20 if diff == "medium" else 30)

        # Check fingerprint
        fp = compute_fingerprint(course, subj, q_text)
        if fp in existing_fingerprints:
            continue

        existing_fingerprints.add(fp)

        validated_questions.append({
            "subject": subj,
            "topic": topic,
            "difficulty": diff,
            "title": title,
            "question": q_text,
            "options": opts_cleaned,
            "correct_answer": matching_opt,
            "explanation": explanation,
            "xp_reward": xp,
            "question_fingerprint": fp
        })

        if len(validated_questions) >= target_count:
            break

    if len(validated_questions) < 3:
        raise RuntimeError(f"Groq API returned only {len(validated_questions)} valid questions. Minimum 3 required for daily challenge set.")

    return validated_questions
