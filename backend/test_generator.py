"""
Test generator knowledge base & question builder.
Contains authentic syllabus questions for popular university and school courses,
plus a dynamic question synthesis engine for any custom course, subject, or chapter.
"""
import json
import os
import random
import ssl
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# Presets of courses, subjects, and chapters
COURSE_PRESETS = [
    {
        "course": "B.Tech Computer Science (CSE)",
        "subjects": [
            {
                "name": "C Programming & Problem Solving",
                "chapters": [
                    "Control Flow (if-else, switch)",
                    "Loops & Iteration (for, while, do-while)",
                    "Functions & Recursion",
                    "Arrays & Strings",
                    "Pointers & Memory Management",
                    "Structures & Unions",
                    "File Handling & I/O",
                ],
            },
            {
                "name": "Data Structures & Algorithms",
                "chapters": [
                    "Asymptotic Notations & Complexity",
                    "Arrays, Stacks & Queues",
                    "Linked Lists (Singly, Doubly, Circular)",
                    "Binary Trees & BST",
                    "AVL & Red-Black Trees",
                    "Graphs, BFS & DFS",
                    "Sorting & Searching Algorithms",
                ],
            },
            {
                "name": "Operating Systems",
                "chapters": [
                    "Process Management & States",
                    "CPU Scheduling Algorithms",
                    "Process Synchronization & Semaphores",
                    "Deadlock Detection & Prevention",
                    "Memory Management & Paging",
                    "Virtual Memory & Page Replacement",
                    "File Systems & Disk Scheduling",
                ],
            },
            {
                "name": "Database Management Systems (DBMS)",
                "chapters": [
                    "ER Modeling & Relational Schema",
                    "Relational Algebra & SQL Queries",
                    "Normalization (1NF, 2NF, 3NF, BCNF)",
                    "Transactions & ACID Properties",
                    "Concurrency Control & Locking",
                    "Indexing, B-Trees & Hashing",
                ],
            },
        ],
    },
    {
        "course": "B.Tech First Year (Engineering Foundation)",
        "subjects": [
            {
                "name": "Engineering Mathematics - I",
                "chapters": [
                    "Matrices & Rank of Matrix",
                    "Eigenvalues & Eigenvectors (Cayley-Hamilton)",
                    "Differential Calculus & Successive Differentiation",
                    "Taylor's and Maclaurin's Series",
                    "Partial Differentiation & Euler's Theorem",
                    "Maxima and Minima of Several Variables",
                    "Multiple Integrals (Double & Triple)",
                ],
            },
            {
                "name": "Engineering Physics",
                "chapters": [
                    "Wave-Particle Duality & de Broglie Waves",
                    "Schrodinger Wave Equations (Time Dependent & Independent)",
                    "Particle in a 1D Box",
                    "Interference & Diffraction of Light",
                    "Lasers & Fiber Optics",
                    "Semiconductors & Superconductivity",
                    "Electromagnetic Theory & Maxwell's Equations",
                ],
            },
            {
                "name": "Engineering Chemistry",
                "chapters": [
                    "Water Technology & Hardness",
                    "Polymers & Composite Materials",
                    "Electrochemistry & Batteries",
                    "Corrosion Science & Prevention",
                    "Spectroscopic Techniques (UV, IR, NMR)",
                    "Fuels & Combustion Analysis",
                ],
            },
            {
                "name": "Basic Electrical & Electronics",
                "chapters": [
                    "DC Circuits & Kirchhoff's Laws",
                    "Network Theorems (Thevenin, Norton, Superposition)",
                    "AC Fundamentals & Phasor Diagrams",
                    "Single Phase Transformers",
                    "PN Junction Diodes & Rectifiers",
                    "Bipolar Junction Transistors (BJT)",
                    "Operational Amplifiers (Op-Amps)",
                ],
            },
        ],
    },
    {
        "course": "Class 12th (Science / PCM)",
        "subjects": [
            {
                "name": "Physics",
                "chapters": [
                    "Electric Charges & Fields (Gauss Law)",
                    "Electrostatic Potential & Capacitance",
                    "Current Electricity & Kirchhoff's Rules",
                    "Moving Charges & Magnetism",
                    "Electromagnetic Induction & AC",
                    "Ray Optics & Wave Optics",
                    "Dual Nature of Radiation & Matter",
                    "Semiconductor Electronics",
                ],
            },
            {
                "name": "Mathematics",
                "chapters": [
                    "Relations and Functions",
                    "Inverse Trigonometric Functions",
                    "Matrices and Determinants",
                    "Continuity and Differentiability",
                    "Application of Derivatives",
                    "Integrals (Indefinite & Definite)",
                    "Differential Equations",
                    "Vector Algebra & 3D Geometry",
                    "Probability & Bayes Theorem",
                ],
            },
            {
                "name": "Chemistry",
                "chapters": [
                    "Solutions (Raoult's Law & Colligative Properties)",
                    "Electrochemistry (Nernst Equation)",
                    "Chemical Kinetics (Rate Law & Arrhenius)",
                    "d- and f-Block Elements",
                    "Coordination Compounds",
                    "Haloalkanes & Haloarenes",
                    "Alcohols, Phenols and Ethers",
                    "Aldehydes, Ketones and Carboxylic Acids",
                ],
            },
        ],
    },
]

# Curated question database by keywords
QUESTION_DATABASE = [
    # C Programming - Control flow
    {
        "tags": ["c programming", "control flow", "conditional", "switch", "if else"],
        "questions": [
            {
                "question": "Which of the following is an invalid condition inside a C 'if' statement?",
                "options": ["if (x = 5)", "if (x == 5)", "if (x)", "if (int x = 5)"],
                "correct": "if (int x = 5)",
                "explanation": "In standard C (prior to C23), declaring a variable inside an 'if' condition expression like 'if (int x = 5)' is invalid syntax.",
            },
            {
                "question": "What happens if a 'break' statement is omitted from a matched 'case' in a C switch statement?",
                "options": [
                    "Execution falls through to the next case statements until a break or end of switch is reached",
                    "A compiler error is raised immediately",
                    "The program terminates with a runtime exception",
                    "The default case is executed immediately and the switch exits",
                ],
                "correct": "Execution falls through to the next case statements until a break or end of switch is reached",
                "explanation": "This behavior is known as 'fall-through' in C switch statements.",
            },
            {
                "question": "Which operator has the highest precedence in C control-flow evaluation?",
                "options": ["Parentheses ()", "Logical AND (&&)", "Ternary operator (?:)", "Relational equality (==)"],
                "correct": "Parentheses ()",
                "explanation": "Parentheses () have the highest operator precedence (level 1) in C.",
            },
            {
                "question": "What does the expression 'n % 2 == 0' evaluate to in C when n is an even integer?",
                "options": ["1 (True)", "0 (False)", "NULL", "Undefined"],
                "correct": "1 (True)",
                "explanation": "In C, relational equality expressions evaluate to integer 1 for true and 0 for false.",
            },
            {
                "question": "Can floating-point numbers (float or double) be used as switch expression expressions in C?",
                "options": [
                    "No, switch expressions must evaluate to an integral or enumeration type",
                    "Yes, any primitive type is permitted in a switch",
                    "Yes, but only if typecast to double explicitly",
                    "No, only character literals are allowed",
                ],
                "correct": "No, switch expressions must evaluate to an integral or enumeration type",
                "explanation": "C language specifications require switch control expressions to be of integer or enum type.",
            },
        ],
    },
    # C Programming - Loops
    {
        "tags": ["loops", "iteration", "while", "for loop"],
        "questions": [
            {
                "question": "What is the key difference between a 'while' loop and a 'do-while' loop in C?",
                "options": [
                    "A do-while loop always executes its body at least once before checking the condition",
                    "A while loop executes faster than a do-while loop in all compilers",
                    "A do-while loop cannot use the 'continue' keyword",
                    "A while loop cannot run indefinitely",
                ],
                "correct": "A do-while loop always executes its body at least once before checking the condition",
                "explanation": "Because do-while is an exit-controlled loop, the condition is evaluated after the loop body executes.",
            },
            {
                "question": "In a C 'for' loop: 'for (expr1; expr2; expr3)', which expression controls termination?",
                "options": ["expr2", "expr1", "expr3", "Both expr1 and expr3"],
                "correct": "expr2",
                "explanation": "expr2 is the conditional expression tested before every iteration.",
            },
            {
                "question": "What does the 'continue' statement do inside a C loop?",
                "options": [
                    "Skips the rest of the current iteration and jumps to the loop update/condition test",
                    "Terminates the loop completely and transfers control to the enclosing function",
                    "Restarts the entire loop from the initial counter value",
                    "Pauses execution for one millisecond",
                ],
                "correct": "Skips the rest of the current iteration and jumps to the loop update/condition test",
                "explanation": "'continue' bypasses the remainder of the current loop iteration and moves to the loop increment/check.",
            },
        ],
    },
    # Matrices & Mathematics
    {
        "tags": ["matrices", "matrix", "determinant", "eigenvalues", "rank"],
        "questions": [
            {
                "question": "What is the condition for matrix multiplication A * B to be valid if A is of size m x n?",
                "options": [
                    "B must have n rows (size n x p)",
                    "B must have m columns (size p x m)",
                    "A and B must both be square matrices of equal size",
                    "B must have m rows and n columns",
                ],
                "correct": "B must have n rows (size n x p)",
                "explanation": "Matrix multiplication requires the number of columns in the first matrix to equal the number of rows in the second matrix.",
            },
            {
                "question": "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?",
                "options": ["ad - bc", "ac - bd", "ab - cd", "ad + bc"],
                "correct": "ad - bc",
                "explanation": "The determinant of a 2x2 matrix is computed by the formula det = (a * d) - (b * c).",
            },
            {
                "question": "What does the Cayley-Hamilton Theorem state in linear algebra?",
                "options": [
                    "Every square matrix satisfies its own characteristic equation",
                    "Every matrix has orthogonal eigenvectors",
                    "The determinant of an orthogonal matrix is always zero",
                    "All eigenvalues of a symmetric matrix are purely imaginary",
                ],
                "correct": "Every square matrix satisfies its own characteristic equation",
                "explanation": "Cayley-Hamilton Theorem establishes that substituting matrix A into its characteristic polynomial p(lambda) = det(A - lambda*I) yields the zero matrix p(A) = 0.",
            },
            {
                "question": "If matrix A is singular, what is the value of its determinant?",
                "options": ["0", "1", "-1", "Infinity"],
                "correct": "0",
                "explanation": "A singular matrix by definition has a determinant equal to zero and therefore has no multiplicative inverse.",
            },
            {
                "question": "What is the sum of the eigenvalues of a square matrix equal to?",
                "options": [
                    "The trace of the matrix (sum of main diagonal elements)",
                    "The determinant of the matrix",
                    "The rank of the matrix",
                    "Zero for all non-diagonal matrices",
                ],
                "correct": "The trace of the matrix (sum of main diagonal elements)",
                "explanation": "A fundamental algebraic property of matrices: Sum of eigenvalues = Trace(A), and Product of eigenvalues = Det(A).",
            },
        ],
    },
    # Physics - Quantum Mechanics & Waves
    {
        "tags": ["physics", "quantum", "wave", "schrodinger", "particle in a box", "de broglie"],
        "questions": [
            {
                "question": "What is the de Broglie wavelength formula for a particle with momentum p and Planck's constant h?",
                "options": ["lambda = h / p", "lambda = p / h", "lambda = h * p", "lambda = h / (2 * p)"],
                "correct": "lambda = h / p",
                "explanation": "de Broglie proposed the matter-wave relation lambda = h / p, where p = m * v.",
            },
            {
                "question": "According to Max Born's probabilistic interpretation, what does |psi(x)|^2 represent in quantum mechanics?",
                "options": [
                    "Probability density of finding the particle at position x",
                    "The total kinetic energy of the wave packet",
                    "The electric charge density of the particle",
                    "The physical displacement of the matter wave",
                ],
                "correct": "Probability density of finding the particle at position x",
                "explanation": "Born's statistical interpretation states that the square of the modulus of the wave function represents probability density.",
            },
            {
                "question": "For a particle of mass m confined in an infinite 1D potential well of width L, how do energy levels En scale with quantum number n?",
                "options": [
                    "En is directly proportional to n^2",
                    "En is directly proportional to n",
                    "En is inversely proportional to n",
                    "En is independent of n",
                ],
                "correct": "En is directly proportional to n^2",
                "explanation": "The quantized energy levels are given by En = (n^2 * pi^2 * hbar^2) / (2 * m * L^2), scaling quadratically with n.",
            },
            {
                "question": "What is the minimum zero-point energy (ground state energy, n=1) of a particle in an infinite 1D box?",
                "options": [
                    "Greater than zero (non-zero due to Heisenberg Uncertainty Principle)",
                    "Exactly zero",
                    "Negative infinity",
                    "Undefined",
                ],
                "correct": "Greater than zero (non-zero due to Heisenberg Uncertainty Principle)",
                "explanation": "Because Delta x is finite (L), Delta p must be non-zero, requiring the ground state energy E1 > 0.",
            },
        ],
    },
    # Data Structures
    {
        "tags": ["data structures", "stack", "queue", "linked list", "trees", "complexity", "algorithms"],
        "questions": [
            {
                "question": "What is the average time complexity for searching an element in a balanced Binary Search Tree (BST) with n nodes?",
                "options": ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
                "correct": "O(log n)",
                "explanation": "Each comparison in a balanced BST discards approximately half the remaining tree, yielding O(log n) time complexity.",
            },
            {
                "question": "Which data structure follows the LIFO (Last In First Out) principle?",
                "options": ["Stack", "Queue", "Priority Queue", "Circular Array"],
                "correct": "Stack",
                "explanation": "A stack pushes and pops elements from the same end, obeying Last-In-First-Out.",
            },
            {
                "question": "What is the worst-case time complexity of QuickSort on an already sorted array with the naive last-element pivot strategy?",
                "options": ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"],
                "correct": "O(n^2)",
                "explanation": "When unbalanced partitioning occurs at every step (e.g. subarray size n-1 and 0), QuickSort degrades to O(n^2).",
            },
            {
                "question": "In an AVL tree, what is the maximum allowed difference between heights of left and right subtrees for any node?",
                "options": ["1", "0", "2", "log(n)"],
                "correct": "1",
                "explanation": "The AVL balance factor must be in {-1, 0, +1}, meaning the height difference is at most 1.",
            },
        ],
    },
    # Operating Systems
    {
        "tags": ["operating systems", "cpu scheduling", "process", "deadlock", "paging", "memory"],
        "questions": [
            {
                "question": "Which of the following is NOT one of Coffman's four necessary conditions for deadlock?",
                "options": [
                    "Preemptive resource allocation",
                    "Mutual exclusion",
                    "Hold and wait",
                    "Circular wait",
                ],
                "correct": "Preemptive resource allocation",
                "explanation": "The four deadlock conditions are Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Preemption prevents deadlock.",
            },
            {
                "question": "What is 'Thrashing' in an Operating System virtual memory system?",
                "options": [
                    "A state where the CPU spends more time swapping pages in and out than executing instructions",
                    "When hard disk write heads experience mechanical failure",
                    "When two processes try to write to the same memory address simultaneously",
                    "When CPU clock frequency throttles due to high temperature",
                ],
                "correct": "A state where the CPU spends more time swapping pages in and out than executing instructions",
                "explanation": "Thrashing occurs when high page fault rates force the OS into continuous page swapping, degrading system throughput.",
            },
            {
                "question": "Which CPU scheduling algorithm is non-preemptive by default and may suffer from the Convoy Effect?",
                "options": [
                    "First-Come, First-Served (FCFS)",
                    "Round Robin (RR)",
                    "Shortest Remaining Time First (SRTF)",
                    "Multi-level Feedback Queue",
                ],
                "correct": "First-Come, First-Served (FCFS)",
                "explanation": "In FCFS, short processes queuing behind a long CPU-burst process experience prolonged waiting times (Convoy Effect).",
            },
        ],
    },
]


def _generate_via_groq_api(
    course: str,
    subject: str,
    chapter: str,
    num_questions: int,
    difficulty: str,
    api_key: str,
    model: str = "openai/gpt-oss-120b",
) -> list[dict]:
    """Call Groq API with ultra-fast LLM generation."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    prompt = (
        f"Generate exactly {num_questions} high-quality multiple choice exam questions for:\n"
        f"Course: {course}\n"
        f"Subject: {subject}\n"
        f"Chapter: {chapter}\n"
        f"Difficulty: {difficulty}\n\n"
        f"Return ONLY a valid JSON array of objects with keys:\n"
        f"- 'question': clear question prompt string\n"
        f"- 'options': list of exactly 4 distinct choices\n"
        f"- 'correct': exact string matching one of the options\n"
        f"- 'explanation': comprehensive step-by-step conceptual explanation\n"
        f"No introductory text, no markdown backticks, just the raw JSON array."
    )

    req_data = json.dumps({
        "model": model or "openai/gpt-oss-120b",
        "messages": [
            {"role": "system", "content": "You are a university exam creator. Output valid raw JSON array only."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "StudyMate-App/1.0"
        },
        method="POST"
    )

    ctx = ssl._create_unverified_context() if hasattr(ssl, "_create_unverified_context") else None
    with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        raw_text = data["choices"][0]["message"]["content"].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("```", 1)[0]
        parsed = json.loads(raw_text.strip())
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed[:num_questions]
    return []


def _generate_via_gemini_api(
    course: str,
    subject: str,
    chapter: str,
    num_questions: int,
    difficulty: str,
    api_key: str,
) -> list[dict]:
    """Call Google Gemini API if GEMINI_API_KEY is configured in .env."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    prompt = (
        f"You are an expert university professor creating an exam.\n"
        f"Generate exactly {num_questions} multiple choice questions (MCQs) for:\n"
        f"Course: {course}\n"
        f"Subject: {subject}\n"
        f"Chapter: {chapter}\n"
        f"Difficulty: {difficulty}\n\n"
        f"Return ONLY a raw JSON array of objects with NO markdown formatting, matching this schema:\n"
        f'[\n  {{"question": "...", "options": ["opt1", "opt2", "opt3", "opt4"], "correct": "opt1", "explanation": "..."}}\n]'
    )

    req_body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4}
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=req_body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("```", 1)[0]
        parsed = json.loads(raw_text.strip())
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed[:num_questions]
    return []


def generate_questions_for_topic(
    course: str,
    subject: str,
    chapter: str,
    num_questions: int = 5,
    difficulty: str = "medium",
) -> list[dict]:
    """
    Find matching questions from the knowledge base, or intelligently generate
    curriculum-tailored MCQs for the specified course, subject, and chapter.
    Uses GROQ API if GROQ_API_KEY is configured, or Gemini API if GEMINI_API_KEY is configured.
    Falls back gracefully to curriculum database if offline.
    """
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    if groq_key:
        try:
            groq_qs = _generate_via_groq_api(course, subject, chapter, num_questions, difficulty, groq_key, groq_model)
            if len(groq_qs) >= num_questions:
                return groq_qs
        except Exception as e:
            # Fallback to next provider or local database
            pass

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            gemini_qs = _generate_via_gemini_api(course, subject, chapter, num_questions, difficulty, gemini_key)
            if len(gemini_qs) >= num_questions:
                return gemini_qs
        except Exception as e:
            pass

    search_terms = f"{course} {subject} {chapter}".lower()
    matched_questions: list[dict] = []

    # 1. Match from curated database
    for entry in QUESTION_DATABASE:
        if any(tag in search_terms for tag in entry["tags"]):
            matched_questions.extend(entry["questions"])

    # Shuffle to provide variety
    random.shuffle(matched_questions)

    # 2. If matched questions are fewer than requested, synthetically generate
    # targeted, academic MCQs tailored to the exact chapter and subject!
    needed = num_questions - len(matched_questions)
    if needed > 0:
        synthetic = _synthesize_chapter_questions(
            course=course,
            subject=subject,
            chapter=chapter,
            count=needed,
            difficulty=difficulty,
        )
        matched_questions.extend(synthetic)

    # Limit to requested number of questions
    final_questions = matched_questions[:num_questions]

    # Clean up and guarantee proper options structure
    result = []
    for item in final_questions:
        opts = list(item["options"])
        # Ensure correct answer is in options
        if item["correct"] not in opts:
            opts[0] = item["correct"]
        random.shuffle(opts)
        result.append(
            {
                "question_text": item["question"],
                "options": opts,
                "correct_answer": item["correct"],
                "explanation": item.get(
                    "explanation",
                    f"Core conceptual principle in {chapter} ({subject}).",
                ),
            }
        )

    return result


def _synthesize_chapter_questions(
    course: str,
    subject: str,
    chapter: str,
    count: int,
    difficulty: str,
) -> list[dict]:
    """
    Synthesize high-quality domain-specific questions when exact matches are depleted.
    """
    templates = [
        {
            "q": f"What is the primary governing objective or principle of '{chapter}' in {subject}?",
            "correct": f"To optimize analysis, predictable execution, and verified correctness within {subject}",
            "distractors": [
                f"To bypass standard safety and memory validation in {course}",
                f"To force manual arithmetic computation without logical abstraction",
                f"To eliminate all mathematical and algorithmic constraints in {subject}",
            ],
            "exp": f"In {subject}, '{chapter}' is systematically studied to provide rigorous models, predictability, and practical problem-solving capability.",
        },
        {
            "q": f"When solving complex problems in '{chapter}', which analytical approach is considered best practice?",
            "correct": f"Formulating base assumptions, applying standard theorems, and checking edge boundary conditions",
            "distractors": [
                "Ignoring dimensional analysis and guessing arbitrary numerical constants",
                "Assuming inputs are uniformly non-negative without validation",
                "Omitting proofs and accepting empirical approximations only",
            ],
            "exp": f"Rigorous engineering and scientific methodology in '{chapter}' requires identifying governing relations, boundary conditions, and verifying final dimensions.",
        },
        {
            "q": f"Which fundamental trade-off is typically encountered while implementing solutions in '{chapter}'?",
            "correct": "Trade-off between time efficiency, resource consumption, and algorithmic complexity",
            "distractors": [
                "Trade-off between gravity and magnetic inductance",
                "Trade-off between source code file length and compiler brand",
                "There is never any trade-off; all criteria can be maximized simultaneously",
            ],
            "exp": f"In academic curricula ({course}), '{chapter}' emphasizes balancing computational overhead against resource allocation and accuracy.",
        },
        {
            "q": f"In competitive examinations and university assessments on '{chapter}', what is a frequent source of student error?",
            "correct": "Neglecting negative signs, improper unit conversions, or violating boundary conditions",
            "distractors": [
                "Using pen instead of pencil on numerical derivations",
                "Using standard internationally recognized nomenclature",
                "Writing solutions in clean step-by-step mathematical format",
            ],
            "exp": f"Careful attention to sign conventions, unit consistency, and boundary constraints is paramount in '{chapter}'.",
        },
        {
            "q": f"How is '{chapter}' directly applied in modern industry and advanced engineering practice?",
            "correct": f"As an foundational building block for automated systems, simulation models, and reliable design in {subject}",
            "distractors": [
                "It is strictly historical and has zero practical application in modern software or engineering",
                "Only for decorative user-interface illustrations",
                "Exclusively for manual paper archiving without computer usage",
            ],
            "exp": f"Mastery of '{chapter}' in {subject} enables students in {course} to analyze real-world engineering systems, optimize performance, and innovate.",
        },
        {
            "q": f"What is the significance of verification and proof in the theoretical framework of '{chapter}'?",
            "correct": "It guarantees that the solution holds universally across all valid inputs and operational ranges",
            "distractors": [
                "It only serves to increase the number of textbook pages",
                "It slows down hardware without contributing to correctness",
                "It restricts researchers from exploring new ideas",
            ],
            "exp": f"Theoretical proofs in '{chapter}' confirm that deduced theorems and properties remain mathematically sound under all stated constraints.",
        },
    ]

    generated = []
    for i in range(count):
        tmpl = templates[i % len(templates)]
        opts = [tmpl["correct"]] + tmpl["distractors"]
        generated.append(
            {
                "question": tmpl["q"],
                "options": opts,
                "correct": tmpl["correct"],
                "explanation": tmpl["exp"],
            }
        )

    return generated
