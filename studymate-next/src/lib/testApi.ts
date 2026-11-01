import { apiFetch } from "./api";

export interface TestQuestion {
  id: number;
  question_text: string;
  options: string[];
  explanation?: string;
}

export interface GeneratedTest {
  id: number;
  course: string;
  subject: string;
  chapter: string;
  difficulty: "easy" | "medium" | "hard";
  total_questions: number;
  time_limit_minutes: number;
  created_at?: string;
  questions: TestQuestion[];
}

export type GeneratedTestResponse = GeneratedTest;

export interface TestSubmissionResult {
  message: string;
  attempt_id: number;
  test_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number;
  xp_awarded: number;
  answers_review: {
    question_id: number;
    question_text: string;
    options: string[];
    user_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
}

export interface TestHistoryItem {
  id: number;
  test_id: number;
  course: string;
  subject: string;
  chapter: string;
  difficulty: string;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface CoursePreset {
  course: string;
  subjects: {
    name: string;
    chapters: string[];
  }[];
}

export type TestPreset = CoursePreset;

export async function generateTest(data: {
  course: string;
  subject: string;
  chapter: string;
  num_questions: number;
  difficulty: string;
  time_limit_minutes: number;
}): Promise<GeneratedTest> {
  const res = await apiFetch("/api/tests/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(res.data?.detail || "Failed to generate test");
  }
  return res.data;
}

export async function getTest(testId: number): Promise<GeneratedTest> {
  const res = await apiFetch(`/api/tests/${testId}`);
  if (!res.ok) {
    throw new Error(res.data?.detail || "Failed to fetch test details");
  }
  return res.data;
}

export async function submitTest(
  testId: number,
  answers: Record<string, string>,
  timeTakenSeconds: number
): Promise<TestSubmissionResult> {
  const res = await apiFetch(`/api/tests/${testId}/submit`, {
    method: "POST",
    body: JSON.stringify({
      answers,
      time_taken_seconds: timeTakenSeconds,
    }),
  });
  if (!res.ok) {
    throw new Error(res.data?.detail || "Failed to submit test");
  }
  return res.data;
}

export async function getTestHistory(): Promise<TestHistoryItem[]> {
  try {
    const res = await apiFetch("/api/tests/history");
    if (!res.ok) {
      return [];
    }
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function getTestPresets(): Promise<CoursePreset[]> {
  const res = await apiFetch("/api/tests/presets");
  if (!res.ok) {
    return [];
  }
  return Array.isArray(res.data) ? res.data : [];
}

export const fetchTestPresets = getTestPresets;
export const generateTestApi = generateTest;
export const fetchTestHistoryApi = getTestHistory;
export const submitTestAttemptApi = (
  testId: number,
  data: { answers: Record<string, string>; time_taken_seconds: number }
) => submitTest(testId, data.answers, data.time_taken_seconds);
