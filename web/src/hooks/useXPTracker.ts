import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "studymate.xpTracker.v1";

export const INITIAL_TASKS = [
  {
    id: "math-matrices",
    subject: "Mathematics",
    badge: "MATH",
    title: "Matrix Transformations",
    description: "Practice elementary row and column operations.",
    maxXP: 100,
    subTasks: [
      { id: "read-theory", title: "Read matrix transformation theory", completed: false },
      { id: "view-examples", title: "Review worked examples", completed: false },
      { id: "row-operations", title: "Solve elementary row operations", completed: false },
      { id: "column-operations", title: "Solve column operations", completed: false },
      { id: "check-answers", title: "Check answers and correct mistakes", completed: false },
    ],
    reviewedResources: [],
    awardedMilestones: [],
    activeSeconds: 0,
    lastOpenedAt: null,
  },
  {
    id: "physics-debroglie",
    subject: "Engineering Physics",
    badge: "PHYS",
    title: "de Broglie Waves",
    description: "Understand matter waves and wavelength calculations.",
    maxXP: 80,
    subTasks: [
      { id: "matter-wave-concept", title: "Understand matter-wave duality", completed: false },
      { id: "derive-formula", title: "Derive the de Broglie relation", completed: false },
      { id: "solve-numericals", title: "Solve wavelength numericals", completed: false },
      { id: "review-units", title: "Verify units and final answers", completed: false },
    ],
    reviewedResources: [],
    awardedMilestones: [],
    activeSeconds: 0,
    lastOpenedAt: null,
  },
  {
    id: "c-control-flow",
    subject: "C Programming",
    badge: "C-PROG",
    title: "C Control Flow",
    description: "Practice conditions, loops, and program tracing.",
    maxXP: 120,
    subTasks: [
      { id: "if-else", title: "Write if/else conditions", completed: false },
      { id: "switch", title: "Practice switch statements", completed: false },
      { id: "for-loop", title: "Write for loops", completed: false },
      { id: "while-loop", title: "Compare while and do-while loops", completed: false },
      { id: "trace-code", title: "Trace a program and predict its output", completed: false },
      { id: "write-program", title: "Write a complete control-flow program", completed: false },
    ],
    reviewedResources: [],
    awardedMilestones: [],
    activeSeconds: 0,
    lastOpenedAt: null,
  },
  {
    id: "physics-schrodinger",
    subject: "Engineering Physics",
    badge: "PHYS",
    title: "Schrödinger Wave Equations",
    description: "Review the equation, assumptions, and applications.",
    maxXP: 150,
    subTasks: [
      { id: "wave-function", title: "Understand the wave function", completed: false },
      { id: "assumptions", title: "Review the equation's assumptions", completed: false },
      { id: "time-dependent", title: "Study the time-dependent equation", completed: false },
      { id: "time-independent", title: "Study the time-independent equation", completed: false },
      { id: "applications", title: "Work through an application", completed: false },
      { id: "summary", title: "Write a short summary in your notes", completed: false },
    ],
    reviewedResources: [],
    awardedMilestones: [],
    activeSeconds: 0,
    lastOpenedAt: null,
  },
];

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000];

function makeInitialState() {
  return {
    version: 1,
    tasks: INITIAL_TASKS,
    activityXP: 0,
    activityLedger: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function loadState() {
  if (typeof window === "undefined") return makeInitialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialState();

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) return makeInitialState();

    // Merge with the current task definitions so new subtasks can be added
    // without losing the user's existing completion state.
    const savedById = new Map((parsed.tasks || []).map((task: any) => [task.id, task]));

    const tasks = INITIAL_TASKS.map((template) => {
      const saved: any = savedById.get(template.id);
      if (!saved) return template;

      const savedSubtasks = new Map(
        (saved.subTasks || []).map((subTask: any) => [subTask.id, subTask])
      );

      return {
        ...template,
        ...saved,
        subTasks: template.subTasks.map((subTask) => ({
          ...subTask,
          ...((savedSubtasks.get(subTask.id) as any) || {}),
        })),
        reviewedResources: Array.isArray(saved.reviewedResources)
          ? saved.reviewedResources
          : [],
        awardedMilestones: Array.isArray(saved.awardedMilestones)
          ? saved.awardedMilestones
          : [],
        activeSeconds: Math.max(0, Number(saved.activeSeconds) || 0),
      };
    });

    return {
      ...makeInitialState(),
      ...parsed,
      tasks,
      activityXP: Math.max(0, Number(parsed.activityXP) || 0),
      activityLedger: parsed.activityLedger || {},
    };
  } catch (error) {
    console.error("Could not load XP state:", error);
    return makeInitialState();
  }
}

function getTaskEarnedXP(task) {
  const total = task.subTasks.length;
  const completed = task.subTasks.filter((item) => item.completed).length;

  if (total === 0) return 0;

  // Round down so earned XP is always a whole number.
  return Math.floor((completed / total) * task.maxXP);
}

export function calculateLevel(totalXP) {
  const xp = Math.max(0, Math.floor(Number(totalXP) || 0));

  let levelIndex = 0;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) levelIndex = i;
    else break;
  }

  const currentThreshold = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? currentThreshold + 1000;
  const xpIntoLevel = xp - currentThreshold;
  const xpForLevel = nextThreshold - currentThreshold;

  return {
    currentLevel: levelIndex + 1,
    totalXP: xp,
    currentThreshold,
    nextThreshold,
    xpIntoLevel,
    xpForLevel,
    xpRemaining: Math.max(0, nextThreshold - xp),
    progressToNextLevel: Math.min(
      100,
      Math.floor((xpIntoLevel / xpForLevel) * 100)
    ),
  };
}

export function useXPTracker() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Could not save XP state:", error);
    }
  }, [state]);

  const updateSubTaskProgress = useCallback((taskId, subTaskId, status) => {
    setState((previous) => {
      const task = previous.tasks.find((item) => item.id === taskId);
      if (!task) return previous;

      const target = task.subTasks.find((item) => item.id === subTaskId);
      if (!target || target.completed === Boolean(status)) return previous;

      const _oldTaskXP = getTaskEarnedXP(task);

      const updatedTask = {
        ...task,
        subTasks: task.subTasks.map((item) =>
          item.id === subTaskId
            ? { ...item, completed: Boolean(status), updatedAt: new Date().toISOString() }
            : item
        ),
      };

      const _newTaskXP = getTaskEarnedXP(updatedTask);
      const completedCount = updatedTask.subTasks.filter((item) => item.completed).length;
      const completionPercent = updatedTask.subTasks.length
        ? completedCount / updatedTask.subTasks.length
        : 0;

      // The milestone is permanently recorded once granted. Unchecking a
      // subtask can reduce proportional XP but cannot re-award the milestone.
      let activityXP = previous.activityXP;
      let activityLedger = previous.activityLedger;
      let awardedMilestones = [...(updatedTask.awardedMilestones || [])];

      if (
        completionPercent >= 0.5 &&
        !awardedMilestones.includes("halfway")
      ) {
        const ledgerKey = `milestone:${taskId}:halfway`;
        if (!activityLedger[ledgerKey]) {
          activityXP += 10;
          activityLedger = {
            ...activityLedger,
            [ledgerKey]: {
              amount: 10,
              createdAt: new Date().toISOString(),
              reason: "Halfway There",
            },
          };
        }
        awardedMilestones.push("halfway");
      }

      return {
        ...previous,
        tasks: previous.tasks.map((item) =>
          item.id === taskId
            ? { ...updatedTask, awardedMilestones }
            : item
        ),
        activityXP,
        activityLedger,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const addActivityXP = useCallback((amount, uniqueKey, reason = "Study activity") => {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount || !uniqueKey) return false;

    setState((previous) => {
      if (previous.activityLedger[uniqueKey]) return previous;

      return {
        ...previous,
        activityXP: previous.activityXP + safeAmount,
        activityLedger: {
          ...previous.activityLedger,
          [uniqueKey]: {
            amount: safeAmount,
            reason,
            createdAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });

    return true;
  }, []);

  const recordResourceReviewed = useCallback((taskId, resourceId) => {
    setState((previous) => {
      const task = previous.tasks.find((item) => item.id === taskId);
      if (!task || task.reviewedResources.includes(resourceId)) return previous;

      const ledgerKey = `resource:${taskId}:${resourceId}`;
      const alreadyAwarded = Boolean(previous.activityLedger[ledgerKey]);

      return {
        ...previous,
        tasks: previous.tasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                reviewedResources: [...item.reviewedResources, resourceId],
              }
            : item
        ),
        activityXP: previous.activityXP + (alreadyAwarded ? 0 : 5),
        activityLedger: alreadyAwarded
          ? previous.activityLedger
          : {
              ...previous.activityLedger,
              [ledgerKey]: {
                amount: 5,
                reason: "Material Reviewed",
                createdAt: new Date().toISOString(),
              },
            },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const recordActiveSeconds = useCallback((taskId, seconds) => {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!safeSeconds) return;

    setState((previous) => ({
      ...previous,
      tasks: previous.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              activeSeconds: (Number(task.activeSeconds) || 0) + safeSeconds,
            }
          : task
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const tasks = state.tasks.map((task) => {
    const completed = task.subTasks.filter((item) => item.completed).length;
    const total = task.subTasks.length;
    return {
      ...task,
      completedSubTasks: completed,
      totalSubTasks: total,
      progress: total ? Math.round((completed / total) * 100) : 0,
      earnedXP: getTaskEarnedXP(task),
    };
  });

  const taskXP = tasks.reduce((sum, task) => sum + task.earnedXP, 0);
  const totalXP = taskXP + state.activityXP;
  const level = useMemo(() => calculateLevel(totalXP), [totalXP]);

  return {
    tasks,
    taskXP,
    activityXP: state.activityXP,
    totalXP,
    ...level,
    updateSubTaskProgress,
    addActivityXP,
    recordResourceReviewed,
    recordActiveSeconds,
  };
}