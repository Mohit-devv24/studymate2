"""
Groq AI Question Generation Engine for StudyMate Gaming Zone.
Dynamically generates syllabus-grounded educational challenges for all 8 game types
across School, Competitive Exams (JEE Main, JEE Advanced, NEET), and College (B.Tech, BCA, B.Sc.).
Includes question fingerprinting, duplicate detection, and strictly course-aware subject routing.
"""
import hashlib
import json
import os
import random
import re
import ssl
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# =========================================================
# SUBJECT-SPECIFIC CURATED FALLBACK KNOWLEDGE BASES
# (Activated ONLY if Groq API encounters network or quota errors,
#  flagged explicitly with is_ai_generated=False)
# =========================================================

SUBJECT_FALLBACKS = {
    "physics": {
        "quiz": [
            {
                "id": "phy_q_1",
                "question": "A particle moves in a circle of radius r with constant angular speed ω. What is its centripetal acceleration vector directed towards?",
                "options": ["Tangent to circle", "Center of circular path", "Opposite to velocity", "Perpendicular to plane"],
                "correct_answer": "Center of circular path",
                "explanation": "Centripetal acceleration is given by a_c = ω²r (or v²/r) and is always radially directed toward the instantaneous center of rotation.",
                "hint": "Centripetal literally means 'center-seeking'."
            },
            {
                "id": "phy_q_2",
                "question": "According to Gauss's Law in electrostatics, the net electric flux through any closed surface is proportional to:",
                "options": ["Total charge enclosed divided by ε0", "Area of the enclosing surface", "Electric field magnitude squared", "Potential difference across the surface"],
                "correct_answer": "Total charge enclosed divided by ε0",
                "explanation": "∮ E · dA = Q_enclosed / ε0. Flux depends strictly on the net enclosed charge, independent of the surface geometry.",
                "hint": "Recall the first of Maxwell's four equations."
            },
            {
                "id": "phy_q_3",
                "question": "In a Young's double slit experiment, if the distance between slits is halved and distance to screen is doubled, what happens to fringe width β?",
                "options": ["Remains unchanged", "Doubles", "Increases by 4 times", "Halves"],
                "correct_answer": "Increases by 4 times",
                "explanation": "Fringe width β = λD / d. If D' = 2D and d' = d/2, then β' = λ(2D)/(d/2) = 4(λD/d) = 4β.",
                "hint": "Look at the formula β = λD/d and substitute the scale factors."
            },
            {
                "id": "phy_q_4",
                "question": "What is the moment of inertia of a uniform solid sphere of mass M and radius R about any diameter?",
                "options": ["(1/2)MR²", "(2/5)MR²", "(2/3)MR²", "(1/4)MR²"],
                "correct_answer": "(2/5)MR²",
                "explanation": "For a uniform solid sphere about its diameter, integration yields I = (2/5)MR². A hollow spherical shell would be (2/3)MR².",
                "hint": "Solid sphere is less than hollow shell ((2/3)MR²)."
            },
            {
                "id": "phy_q_5",
                "question": "In an adiabatic expansion of an ideal gas, the relationship between temperature T and volume V is governed by:",
                "options": ["TV^(γ - 1) = constant", "T / V = constant", "PV = constant", "T^γ * V = constant"],
                "correct_answer": "TV^(γ - 1) = constant",
                "explanation": "For an adiabatic process, PV^γ = C. Using ideal gas law P = nRT/V gives T*V^(γ-1) = constant.",
                "hint": "Adiabatic constant γ = Cp/Cv."
            }
        ],
        "formula": [
            {
                "id": "phy_f_1",
                "title": "Rotational Newton's Second Law",
                "equation": "τ = [___] * α",
                "missing_symbol": "I",
                "options": ["I", "m", "L", "ω"],
                "correct_answer": "I",
                "variable_definitions": "τ = Torque (N·m), I = Moment of inertia (kg·m²), α = Angular acceleration (rad/s²)",
                "units": "Newton-meter (N·m)",
                "explanation": "Torque causes angular acceleration just as force causes linear acceleration (F = ma ➔ τ = Iα)."
            },
            {
                "id": "phy_f_2",
                "title": "Gauss's Law of Electrostatics",
                "equation": "∮ E · dA = Q_enc / [___]",
                "missing_symbol": "ε0",
                "options": ["ε0", "μ0", "4π", "c"],
                "correct_answer": "ε0",
                "variable_definitions": "E = Electric Field, dA = Area vector, Q_enc = Enclosed charge, ε0 = Permittivity of free space",
                "units": "Volt-meter (V·m) or N·m²/C",
                "explanation": "Total electric flux through a closed Gaussian surface equals enclosed charge divided by vacuum permittivity."
            },
            {
                "id": "phy_f_3",
                "title": "Thin Lens Formula",
                "equation": "1/f = 1/v - 1/[___]",
                "missing_symbol": "u",
                "options": ["u", "R", "d", "λ"],
                "correct_answer": "u",
                "variable_definitions": "f = Focal length, v = Image distance, u = Object distance from optical center",
                "units": "Meters (m)",
                "explanation": "1/f = 1/v - 1/u is the standard Cartesian coordinate lens equation."
            },
            {
                "id": "phy_f_4",
                "title": "de Broglie Wavelength",
                "equation": "λ = h / [___]",
                "missing_symbol": "p",
                "options": ["p", "c", "E", "m"],
                "correct_answer": "p",
                "variable_definitions": "λ = Wavelength, h = Planck's constant (6.626×10^-34 J·s), p = Momentum (mv)",
                "units": "Meters (m)",
                "explanation": "Every moving quantum particle exhibits wave properties with de Broglie wavelength λ = h/p."
            }
        ],
        "debug": {
            "title": "Inclined Plane Friction & Acceleration Analysis",
            "subject": "Physics",
            "problem": "A block of mass 5 kg slides down a 30° rough incline with coefficient of kinetic friction μ = 0.2. Calculate acceleration a. (Take g = 10 m/s²)",
            "solution_steps": [
                "Step 1: Normal force N = mg * cos(30°) = 5 * 10 * (√3/2) ≈ 43.3 N.",
                "Step 2: Friction force f_k = μ * N = 0.2 * 43.3 = 8.66 N (acting up the incline).",
                "Step 3 [BUG]: Downward gravitational component along incline = mg * cos(30°) = 43.3 N.",
                "Step 4: Net force F_net = 43.3 - 8.66 = 34.64 N ➔ a = F_net / m = 6.93 m/s²."
            ],
            "buggy_step": 3,
            "bug_description": "Step 3 used mg*cos(30°) instead of mg*sin(30°). The component of gravity parallel to the incline is mg*sin(θ), which is 5*10*(1/2) = 25 N, not 43.3 N!",
            "fixed_step": "Step 3 [CORRECT]: Downward gravitational component along incline = mg * sin(30°) = 5 * 10 * 0.5 = 25 N.",
            "corrected_solution": "F_net = 25 N - 8.66 N = 16.34 N ➔ a = 16.34 / 5 = 3.27 m/s².",
            "hint": "Check whether the parallel component of gravity is sine or cosine of incline angle."
        },
        "scramble": [
            {"id": "phy_sc_1", "word": "MOMENTUM", "scrambled": "UMOMMETN", "hint": "Mass times velocity; conserved in isolated collisions.", "category": "Classical Mechanics"},
            {"id": "phy_sc_2", "word": "REFRACTION", "scrambled": "TORCAEFIRN", "hint": "Bending of light when transitioning between different optical media.", "category": "Optics"},
            {"id": "phy_sc_3", "word": "ENTROPY", "scrambled": "PORTYNE", "hint": "Measure of disorder or randomness in a thermodynamic system.", "category": "Thermodynamics"},
            {"id": "phy_sc_4", "word": "CAPACITANCE", "scrambled": "PATECACINCA", "hint": "Ratio of electric charge on conductor to potential difference.", "category": "Electrostatics"},
            {"id": "phy_sc_5", "word": "DIFFRACTION", "scrambled": "FATIRFDNICO", "hint": "Bending of waves around the corners of an obstacle or slit.", "category": "Wave Optics"}
        ]
    },
    "chemistry": {
        "quiz": [
            {
                "id": "chem_q_1",
                "question": "Which of the following molecules has a zero dipole moment due to symmetric geometry?",
                "options": ["H2O", "NH3", "BF3", "SO2"],
                "correct_answer": "BF3",
                "explanation": "BF3 has trigonal planar geometry (120° bond angles). The three equal B-F dipole moments cancel out vectorially to give net μ = 0.",
                "hint": "Look for symmetrical sp² hybridized planar geometry."
            },
            {
                "id": "chem_q_2",
                "question": "For a first-order chemical reaction, the unit of rate constant k is:",
                "options": ["mol·L⁻¹·s⁻¹", "L·mol⁻¹·s⁻¹", "s⁻¹", "mol²·L⁻²·s⁻¹"],
                "correct_answer": "s⁻¹",
                "explanation": "Rate = k[A]^1. Therefore k = Rate / [A] = (mol·L⁻¹·s⁻¹) / (mol·L⁻¹) = s⁻¹.",
                "hint": "Half-life t1/2 = 0.693/k depends only on time."
            },
            {
                "id": "chem_q_3",
                "question": "What is the oxidation state of Chromium in the dichromate ion (Cr2O7²⁻)?",
                "options": ["+3", "+6", "+5", "+7"],
                "correct_answer": "+6",
                "explanation": "2(Cr) + 7(-2) = -2 ➔ 2(Cr) - 14 = -2 ➔ 2(Cr) = +12 ➔ Cr = +6.",
                "hint": "Oxygen is in -2 oxidation state; total charge is -2."
            }
        ],
        "formula": [
            {
                "id": "chem_f_1",
                "title": "Arrhenius Equation for Rate Constant",
                "equation": "k = A * e^(-[___] / RT)",
                "missing_symbol": "Ea",
                "options": ["Ea", "ΔH", "ΔG", "Kc"],
                "correct_answer": "Ea",
                "variable_definitions": "k = Rate constant, A = Frequency factor, Ea = Activation energy (J/mol), R = Gas constant, T = Temp in K",
                "units": "Joules per mole (J/mol)",
                "explanation": "Quantifies the temperature dependence of reaction rates on activation energy Ea."
            },
            {
                "id": "chem_f_2",
                "title": "Nernst Equation for Electrode Potential",
                "equation": "E_cell = E°_cell - (RT / [___]F) * ln(Q)",
                "missing_symbol": "n",
                "options": ["n", "z", "V", "k"],
                "correct_answer": "n",
                "variable_definitions": "E_cell = Cell potential, n = Number of moles of electrons transferred, F = Faraday constant (96485 C/mol)",
                "units": "Volts (V)",
                "explanation": "Relates reduction potential of electrochemical cell to standard potential, temperature, and reaction quotient Q."
            },
            {
                "id": "chem_f_3",
                "title": "Ideal Gas Equation",
                "equation": "PV = [___] * RT",
                "missing_symbol": "n",
                "options": ["n", "m", "M", "k"],
                "correct_answer": "n",
                "variable_definitions": "P = Pressure (atm/Pa), V = Volume, n = Number of moles, R = Universal gas constant, T = Temp (K)",
                "units": "Atmosphere-liters or Joules",
                "explanation": "Equation of state for a hypothetical ideal gas."
            }
        ],
        "debug": {
            "title": "Chemical Equilibrium & Reaction Stoichiometry",
            "subject": "Chemistry",
            "problem": "Calculate the volume of 0.1 M NaOH required to completely neutralize 25 mL of 0.2 M H2SO4.",
            "solution_steps": [
                "Step 1: Balanced equation: H2SO4 + 2 NaOH ➔ Na2SO4 + 2 H2O.",
                "Step 2: Moles of H2SO4 = Molarity * Volume = 0.2 M * 0.025 L = 0.005 moles.",
                "Step 3 [BUG]: Since 1 mole H2SO4 reacts with 1 mole NaOH, moles of NaOH needed = 0.005 moles.",
                "Step 4: Volume of NaOH = Moles / Molarity = 0.005 / 0.1 = 0.05 L = 50 mL."
            ],
            "buggy_step": 3,
            "bug_description": "Step 3 ignored the stoichiometric coefficient. Sulfuric acid (H2SO4) is diprotic; 1 mole of H2SO4 requires 2 moles of NaOH! Therefore moles of NaOH = 2 * 0.005 = 0.010 moles.",
            "fixed_step": "Step 3 [CORRECT]: From stoichiometry, moles of NaOH required = 2 * (moles of H2SO4) = 2 * 0.005 = 0.010 moles.",
            "corrected_solution": "Volume of NaOH = 0.010 / 0.1 M = 0.100 L = 100 mL.",
            "hint": "Check the n-factor / basicity of sulfuric acid in neutralization."
        },
        "scramble": [
            {"id": "chem_sc_1", "word": "CATALYST", "scrambled": "YLTSTAAC", "hint": "Substance that increases reaction rate without being consumed.", "category": "Chemical Kinetics"},
            {"id": "chem_sc_2", "word": "ELECTRONEGATIVITY", "scrambled": "VITINRTOGCETALEY", "hint": "Tendency of an atom to attract a shared pair of bonding electrons.", "category": "Periodic Properties"},
            {"id": "chem_sc_3", "word": "EQUILIBRIUM", "scrambled": "BRIUMLIQUEI", "hint": "State where forward and reverse reaction rates are equal.", "category": "Physical Chemistry"}
        ]
    },
    "mathematics": {
        "quiz": [
            {
                "id": "math_q_1",
                "question": "What is the value of the limit lim (x➔0) [sin(5x) / (3x)]?",
                "options": ["1", "5/3", "3/5", "0"],
                "correct_answer": "5/3",
                "explanation": "lim (x➔0) [sin(5x) / 3x] = (5/3) * lim (5x➔0) [sin(5x) / 5x] = (5/3) * 1 = 5/3.",
                "hint": "Standard limit: lim (u➔0) [sin(u)/u] = 1."
            },
            {
                "id": "math_q_2",
                "question": "If matrix A is an orthogonal matrix of order n, then the determinant of A must equal:",
                "options": ["0", "1 only", "+1 or -1", "n"],
                "correct_answer": "+1 or -1",
                "explanation": "For an orthogonal matrix, A * A^T = I. Taking determinants: det(A)*det(A^T) = (det(A))² = det(I) = 1 ➔ det(A) = ±1.",
                "hint": "A * A^T = I and det(A^T) = det(A)."
            },
            {
                "id": "math_q_3",
                "question": "What is the derivative of f(x) = ln(sec(x) + tan(x)) with respect to x?",
                "options": ["sec(x)", "tan(x)", "sec²(x)", "sec(x)*tan(x)"],
                "correct_answer": "sec(x)",
                "explanation": "f'(x) = [sec(x)tan(x) + sec²(x)] / [sec(x) + tan(x)] = sec(x)[tan(x) + sec(x)] / [sec(x) + tan(x)] = sec(x).",
                "hint": "Factor out sec(x) in the numerator after applying chain rule."
            }
        ],
        "formula": [
            {
                "id": "math_f_1",
                "title": "Integration by Parts Formula",
                "equation": "∫ u * v dx = u * ∫ v dx - ∫ ([___] * (∫ v dx)) dx",
                "missing_symbol": "du/dx",
                "options": ["du/dx", "u²", "v/u", "d²u/dx²"],
                "correct_answer": "du/dx",
                "variable_definitions": "u, v = differentiable functions of x",
                "units": "Integral representation",
                "explanation": "Derived directly from the product rule of differentiation: d(uv) = u dv + v du."
            },
            {
                "id": "math_f_2",
                "title": "Euler's Formula for Complex Numbers",
                "equation": "e^(i * θ) = cos(θ) + [___] * sin(θ)",
                "missing_symbol": "i",
                "options": ["i", "-i", "1", "e"],
                "correct_answer": "i",
                "variable_definitions": "e = natural base, i = imaginary unit (√-1), θ = angle in radians",
                "units": "Complex plane polar coordinates",
                "explanation": "Unifies trigonometric circular functions with imaginary exponential functions."
            },
            {
                "id": "math_f_3",
                "title": "Quadratic Formula Discriminant",
                "equation": "D = [___] - 4 * a * c",
                "missing_symbol": "b^2",
                "options": ["b^2", "2b", "4b", "a^2"],
                "correct_answer": "b^2",
                "variable_definitions": "For ax² + bx + c = 0, D determines real/complex roots",
                "units": "Scalar value",
                "explanation": "If D > 0, distinct real roots; if D = 0, equal roots; if D < 0, complex conjugate roots."
            }
        ],
        "debug": {
            "title": "Definite Integral Substitution Error",
            "subject": "Mathematics",
            "problem": "Evaluate ∫ from 0 to 1 of [ x / (x² + 1) ] dx.",
            "solution_steps": [
                "Step 1: Let substitution u = x² + 1. Then du = 2x dx ➔ x dx = du / 2.",
                "Step 2 [BUG]: Keep original limits 0 and 1 without transforming: ∫ (0 to 1) [ (1/2) * (1/u) ] du.",
                "Step 3: Integrate: (1/2) * [ ln(u) ] from 0 to 1 = (1/2) * [ ln(1) - ln(0) ] ➔ ln(0) is undefined!",
                "Step 4: Error: integral diverges."
            ],
            "buggy_step": 2,
            "bug_description": "Step 2 failed to update the integration limits for the substitute variable u. When x = 0, u = 0² + 1 = 1. When x = 1, u = 1² + 1 = 2.",
            "fixed_step": "Step 2 [CORRECT]: Transform integration limits: when x = 0, u = 1; when x = 1, u = 2. So integral becomes ∫ from 1 to 2 of (1/2u) du.",
            "corrected_solution": "Value = (1/2) * [ln(2) - ln(1)] = (1/2) * ln(2) = ln(√2) ≈ 0.346.",
            "hint": "Whenever substituting u = g(x) in a definite integral, limits MUST transform to g(a) and g(b)."
        },
        "scramble": [
            {"id": "math_sc_1", "word": "DERIVATIVE", "scrambled": "VETRIEDAIV", "hint": "Instantaneous rate of change of a function with respect to its variable.", "category": "Calculus"},
            {"id": "math_sc_2", "word": "EIGENVALUE", "scrambled": "EVALENIEUG", "hint": "Scalar multiplier λ satisfying Av = λv for linear transformation A.", "category": "Linear Algebra"},
            {"id": "math_sc_3", "word": "ASYMPTOTE", "scrambled": "PTOTYSAME", "hint": "A line that a curve approaches arbitrarily closely as it heads to infinity.", "category": "Geometry & Analysis"}
        ]
    },
    "computer_science": {
        "quiz": [
            {
                "id": "cs_q_1",
                "question": "What is the worst-case time complexity of QuickSort when a naive pivot (first element) is chosen on an already sorted array?",
                "options": ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
                "correct_answer": "O(n²)",
                "explanation": "On an already sorted array with first element as pivot, the partitioning yields subarrays of size 0 and n-1 at every step, creating an n-level recursion tree with O(n²) total operations.",
                "hint": "Unbalanced partitions lead to quadratic degradation."
            },
            {
                "id": "cs_q_2",
                "question": "In C, which header file contains functions for dynamic memory allocation such as malloc(), calloc(), and free()?",
                "options": ["<stdio.h>", "<stdlib.h>", "<string.h>", "<memory.h>"],
                "correct_answer": "<stdlib.h>",
                "explanation": "<stdlib.h> (Standard Library) defines memory allocation, process control, conversions, and pseudo-random numbers.",
                "hint": "Standard library header."
            }
        ],
        "formula": [
            {
                "id": "cs_f_1",
                "title": "Master Theorem for Divide & Conquer",
                "equation": "T(n) = a * T(n / b) + f([___])",
                "missing_symbol": "n",
                "options": ["n", "k", "c", "logn"],
                "correct_answer": "n",
                "variable_definitions": "a = number of subproblems (a >= 1), b = factor by which problem size shrinks (b > 1), f(n) = cost of divide & combine",
                "units": "Asymptotic complexity relation",
                "explanation": "Used to solve recurrence relations of divide-and-conquer algorithms like MergeSort and Strassen's algorithm."
            }
        ],
        "debug": {
            "title": "C Pointer Dereference & Memory Boundary Bug",
            "subject": "Programming in C",
            "problem": "Allocate memory for an integer array of size 5, initialize elements, and compute sum.",
            "solution_steps": [
                "int *arr = (int *)malloc(5 * sizeof(int));",
                "if (arr == NULL) return 1;",
                "// Step 3 [BUG]: Index out of bound write",
                "for (int i = 0; i <= 5; i++) { arr[i] = (i + 1) * 10; }",
                "int sum = 0;",
                "for (int i = 0; i < 5; i++) { sum += arr[i]; }",
                "free(arr);"
            ],
            "buggy_step": 4,
            "bug_description": "Loop condition `i <= 5` accesses `arr[5]`, which is beyond the allocated 5 elements (indices 0 to 4). This causes a heap buffer overflow / undefined behavior.",
            "fixed_step": "for (int i = 0; i < 5; i++) { arr[i] = (i + 1) * 10; }",
            "corrected_solution": "Loop strictly from `i = 0` to `i < 5` to stay within allocated bounds.",
            "hint": "Check the loop termination condition against array length."
        },
        "scramble": [
            {"id": "cs_sc_1", "word": "POLYMORPHISM", "scrambled": "POPMIHYSMLOR", "hint": "OOP feature allowing an entity to take on multiple forms through overriding/overloading.", "category": "Object-Oriented Programming"},
            {"id": "cs_sc_2", "word": "RECURSION", "scrambled": "CRUONISER", "hint": "A function that solves a problem by calling itself with smaller subproblems.", "category": "Data Structures & Algorithms"}
        ]
    }
}


def compute_question_hash(text: str) -> str:
    """Generate normalized SHA-256 fingerprint of question text."""
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def _call_groq_api(prompt: str, system_prompt: str) -> dict | list | None:
    """
    Directly call Groq API reusing GROQ_API_KEY and model configuration.
    Tries primary model from .env, falls back to alternative Groq models if needed.
    """
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    primary_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

    if not groq_key:
        return None

    # Models to attempt in sequence
    models_to_try = [primary_model]
    for alt in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        if alt not in models_to_try:
            models_to_try.append(alt)

    url = "https://api.groq.com/openai/v1/chat/completions"
    ctx = ssl._create_unverified_context() if hasattr(ssl, "_create_unverified_context") else None

    for model_name in models_to_try:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.65,  # Higher temperature for genuine question variety
            "max_tokens": 2500,
            "response_format": {"type": "json_object"}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {groq_key}",
                    "User-Agent": "StudyMate-GamingZone/2.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=14, context=ctx) as response:
                body = response.read().decode("utf-8")
                res_json = json.loads(body)
                raw_content = res_json["choices"][0]["message"]["content"].strip()

                # Clean markdown backticks if returned
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("\n", 1)[1]
                    if raw_content.endswith("```"):
                        raw_content = raw_content.rsplit("```", 1)[0]

                parsed = json.loads(raw_content.strip())
                return parsed
        except urllib.error.HTTPError as he:
            print(f"[Groq Engine] Model {model_name} HTTP {he.code}: {he.reason}")
            # If 403 or 404, try next alternative model
            continue
        except Exception as e:
            print(f"[Groq Engine] Error on {model_name}: {e}")
            continue

    return None


def get_subject_fallback_domain(subject_name: str) -> str:
    """Identify which subject knowledge domain to draw from."""
    sub = subject_name.lower().strip()
    if "physic" in sub:
        return "physics"
    if "chem" in sub:
        return "chemistry"
    if "math" in sub or "calculus" in sub or "algebra" in sub or "discrete" in sub:
        return "mathematics"
    if "program" in sub or "c" in sub or "data structure" in sub or "algorithm" in sub or "comput" in sub or "soft" in sub or "os" in sub or "dbms" in sub or "ai" in sub:
        return "computer_science"
    return "physics"  # Default generic


def generate_course_aware_game_content(
    game_type: str,
    course_category: str,
    course_name: str,
    branch_or_stream: str,
    class_or_semester: str,
    subject: str,
    chapter: str,
    topic: str,
    difficulty: str = "medium",
    question_count: int = 5,
    recent_hashes: list = None,
) -> dict:
    """
    Main entry point for generating course-grounded educational game content.
    Uses Groq API with comprehensive academic context.
    Falls back gracefully with explicit transparency if Groq API is offline.
    """
    game_type = game_type.lower().strip()
    subject = subject.strip() if subject else "General Science"
    topic = topic.strip() if topic else (chapter.strip() if chapter else subject)
    difficulty = difficulty.lower().strip()
    recent_hashes = recent_hashes or []

    # System prompt enforcing genuine academic depth matching course
    system_prompt = (
        f"You are a Senior EdTech Professor and Academic Exam Architect for StudyMate.\n"
        f"Generate authentic, curriculum-grounded, non-generic study game challenges.\n"
        f"Output ONLY a valid JSON object matching the requested schema.\n"
        f"Academic Level: {course_category} | Course: {course_name} | Class/Semester: {class_or_semester} | Stream/Branch: {branch_or_stream}."
    )

    domain = get_subject_fallback_domain(subject)

    # -------------------------------------------------------------
    # 1. AI QUIZ BATTLE
    # -------------------------------------------------------------
    if game_type == "quiz":
        prompt = (
            f"Generate exactly {question_count} MULTIPLE CHOICE QUESTIONS for:\n"
            f"- Course/Exam: {course_name} ({class_or_semester})\n"
            f"- Subject: {subject}\n"
            f"- Chapter/Topic: {topic}\n"
            f"- Difficulty: {difficulty} (If JEE Advanced, make it multi-concept analytical; if School Class 10, strictly Class 10 level)\n"
            f"- DO NOT repeat concepts with fingerprints: {recent_hashes[:5]}\n\n"
            f"Format strictly as JSON:\n"
            f'{{"questions": [{{"id": "q1", "question": "...", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "step-by-step", "hint": "short clue"}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "questions" in res and len(res["questions"]) >= 1:
            qs = res["questions"][:question_count]
            for q in qs:
                q["hash"] = compute_question_hash(q.get("question", ""))
            return {
                "game_type": "quiz",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ Freshly generated by Groq AI for {subject} ({course_name})",
                "data": qs
            }

        # Subject-accurate fallback
        fb_pool = SUBJECT_FALLBACKS.get(domain, SUBJECT_FALLBACKS["physics"])["quiz"]
        return {
            "game_type": "quiz",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} curriculum questions.",
            "data": fb_pool[:question_count]
        }

    # -------------------------------------------------------------
    # 2. CODE BATTLE (Coding challenge or Computational Logic)
    # -------------------------------------------------------------
    elif game_type == "code":
        lang = "c"
        if "python" in subject.lower():
            lang = "python"
        elif "java" in subject.lower():
            lang = "java"
        elif "cpp" in subject.lower() or "c++" in subject.lower():
            lang = "cpp"

        prompt = (
            f"Create an educational Coding / Computational Logic Challenge for:\n"
            f"- Course: {course_name} ({class_or_semester}, {branch_or_stream})\n"
            f"- Subject: {subject}\n"
            f"- Topic: {topic}\n"
            f"- Difficulty: {difficulty}\n"
            f"- Preferred Language: {lang}\n\n"
            f"Format strictly as JSON:\n"
            f'{{"challenge": {{"title": "...", "description": "...", "language": "{lang}", "starter_code": "...", "solution": "...", "sample_input": "...", "sample_output": "...", "test_cases": [{{"input": "...", "expected": "..."}}], "hints": ["hint1", "hint2"]}}}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "challenge" in res:
            ch = res["challenge"]
            ch["hash"] = compute_question_hash(ch.get("title", ""))
            return {
                "game_type": "code",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Code Challenge generated for {subject}",
                "data": ch
            }

        # Fallback
        return {
            "game_type": "code",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} code challenge.",
            "data": {
                "title": f"{subject}: Reverse or Transform Sequence",
                "description": f"Implement a core algorithm for {topic} with optimal time complexity.",
                "language": lang,
                "starter_code": f"// Solution for {topic}\n#include <stdio.h>\n\nvoid solve() {{\n    // Write code here\n}}\n",
                "sample_input": "5 \n 1 2 3 4 5",
                "sample_output": "5 4 3 2 1",
                "test_cases": [
                    {"input": "[10, 20, 30]", "expected": "[30, 20, 10]"},
                    {"input": "[4, 8, 12, 16]", "expected": "[16, 12, 8, 4]"}
                ],
                "hints": ["Use two pointers or temporary memory buffer.", "Check loop boundary conditions."]
            }
        }

    # -------------------------------------------------------------
    # 3. DEBUGGING ARENA (Subject-Aware: Physics, Math, Chem, CSE)
    # -------------------------------------------------------------
    elif game_type == "debug":
        is_coding = domain == "computer_science"

        prompt = (
            f"Create a Debugging Arena Challenge for:\n"
            f"- Course: {course_name} ({class_or_semester})\n"
            f"- Subject: {subject} ({'Programming code bug' if is_coding else 'Subject-specific numerical, calculation, or conceptual step error'})\n"
            f"- Topic: {topic}\n"
            f"- Difficulty: {difficulty}\n\n"
            f"IMPORTANT: If Subject is Physics or Math or Chem, DO NOT generate programming code! Generate a problem with a step-by-step solution where ONE STEP HAS A CONCEALED ERROR (e.g. wrong gravity component, wrong integration limit, stoichiometry error).\n"
            f"Format strictly as JSON:\n"
            f'{{"challenge": {{"title": "...", "subject": "{subject}", "problem": "...", "solution_steps": ["Step 1: ...", "Step 2 [BUG]: ...", "Step 3: ..."], "buggy_step": 2, "bug_description": "why it is wrong", "fixed_step": "corrected step text", "corrected_solution": "final answer", "hint": "..."}}}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "challenge" in res:
            ch = res["challenge"]
            ch["hash"] = compute_question_hash(ch.get("title", ""))
            return {
                "game_type": "debug",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Debugging Challenge generated for {subject}",
                "data": ch
            }

        # Subject-accurate fallback
        fb = SUBJECT_FALLBACKS.get(domain, SUBJECT_FALLBACKS["physics"])["debug"]
        return {
            "game_type": "debug",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} debugging challenge.",
            "data": fb
        }

    # -------------------------------------------------------------
    # 4. FORMULA RUSH (CRITICAL: Strictly follow selected subject!)
    # -------------------------------------------------------------
    elif game_type == "formula":
        prompt = (
            f"Generate exactly {min(5, question_count)} FORMULA RUSH CHALLENGES strictly for:\n"
            f"- Subject: {subject} (DO NOT default to Mathematics if Physics or Chemistry is selected!)\n"
            f"- Course: {course_name}\n"
            f"- Topic: {topic}\n\n"
            f"Each formula challenge must display an equation with one missing variable/symbol to identify.\n"
            f"Format strictly as JSON:\n"
            f'{{"formulas": [{{"id": "f1", "title": "...", "equation": "...", "missing_symbol": "...", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact symbol", "variable_definitions": "...", "units": "SI units", "explanation": "..."}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "formulas" in res and len(res["formulas"]) >= 1:
            forms = res["formulas"]
            for f in forms:
                f["hash"] = compute_question_hash(f.get("title", ""))
            return {
                "game_type": "formula",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Formula Rush generated for {subject}",
                "data": forms
            }

        # Strict subject-specific fallback (NEVER default to Math if Physics selected!)
        fb_formulas = SUBJECT_FALLBACKS.get(domain, SUBJECT_FALLBACKS["physics"])["formula"]
        return {
            "game_type": "formula",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} formulas.",
            "data": fb_formulas
        }

    # -------------------------------------------------------------
    # 5. CONCEPT HUNTER (Matching terms & definitions from subject)
    # -------------------------------------------------------------
    elif game_type == "concept":
        prompt = (
            f"Generate 6 Concept-to-Definition or Principle-to-Application pairs for:\n"
            f"- Subject: {subject}\n"
            f"- Course: {course_name}\n"
            f"- Topic: {topic}\n\n"
            f"Format strictly as JSON:\n"
            f'{{"pairs": [{{"id": 1, "term": "Key Concept/Law", "match": "Accurate concise definition/application"}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "pairs" in res and len(res["pairs"]) >= 4:
            return {
                "game_type": "concept",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Concept Hunter generated for {subject}",
                "data": res["pairs"][:6]
            }

        # Subject-specific fallback
        if domain == "physics":
            pairs = [
                {"id": 1, "term": "Centripetal Force", "match": "Radially inward force mv²/r keeping body in circle"},
                {"id": 2, "term": "Bernoulli's Principle", "match": "Conservation of energy in steady fluid flow P + ½ρv² + ρgh = C"},
                {"id": 3, "term": "Lenz's Law", "match": "Induced EMF opposes the magnetic flux change producing it"},
                {"id": 4, "term": "Doppler Effect", "match": "Apparent frequency shift due to relative motion of source/observer"},
                {"id": 5, "term": "Photoelectric Effect", "match": "Emission of electrons when light above threshold frequency strikes metal"},
                {"id": 6, "term": "Total Internal Reflection", "match": "Light traveling from denser to rarer medium exceeding critical angle"}
            ]
        elif domain == "chemistry":
            pairs = [
                {"id": 1, "term": "Le Chatelier's Principle", "match": "Equilibrium shifts to counteract applied stress (T, P, conc)"},
                {"id": 2, "term": "Hund's Rule", "match": "Electrons singly occupy degenerate orbitals before pairing up"},
                {"id": 3, "term": "Electronegativity", "match": "Tendency of an atom in a molecule to attract bonding electron pair"},
                {"id": 4, "term": "Chelate Effect", "match": "Enhanced stability of complexes formed by polydentate ligands"},
                {"id": 5, "term": "Markovnikov's Rule", "match": "Proton adds to alkene carbon with greater number of hydrogen atoms"},
                {"id": 6, "term": "Activation Energy", "match": "Minimum kinetic energy reactant particles must possess to react"}
            ]
        elif domain == "mathematics":
            pairs = [
                {"id": 1, "term": "Rolle's Theorem", "match": "If f(a)=f(b) on continuous/differentiable [a,b], then f'(c)=0 exists"},
                {"id": 2, "term": "Singular Matrix", "match": "Square matrix with determinant equal to zero (no inverse)"},
                {"id": 3, "term": "Cauchy-Schwarz Inequality", "match": "|u · v| <= ||u|| * ||v|| for vectors in inner product space"},
                {"id": 4, "term": "L'Hôpital's Rule", "match": "Evaluates 0/0 or ∞/∞ indeterminate limits via derivatives"},
                {"id": 5, "term": "Orthogonal Vectors", "match": "Two non-zero vectors whose dot product is zero (angle is 90°)"},
                {"id": 6, "term": "Fundamental Theorem of Calculus", "match": "Differentiation and integration are inverse operations"}
            ]
        else:
            pairs = [
                {"id": 1, "term": "LIFO Structure", "match": "Stack operations where last pushed element is first popped"},
                {"id": 2, "term": "FIFO Structure", "match": "Queue operations where first inserted element is first removed"},
                {"id": 3, "term": "Binary Search", "match": "Divide and conquer algorithm with O(log n) time on sorted array"},
                {"id": 4, "term": "Encapsulation", "match": "Binding data and functions into single unit and restricting direct access"},
                {"id": 5, "term": "Deadlock", "match": "Condition where set of processes are blocked waiting on each other's resources"},
                {"id": 6, "term": "Hash Collision", "match": "Two distinct keys producing identical hash table index bucket"}
            ]

        return {
            "game_type": "concept",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} concepts.",
            "data": pairs
        }

    # -------------------------------------------------------------
    # 6. MEMORY MATCH (6 card pairs = 12 cards)
    # -------------------------------------------------------------
    elif game_type == "memory":
        prompt = (
            f"Generate 6 matching pairs (12 cards) for a Memory Flip Game strictly from:\n"
            f"- Subject: {subject}\n"
            f"- Course: {course_name}\n"
            f"- Topic: {topic}\n\n"
            f"Format strictly as JSON:\n"
            f'{{"cards": [{{"id": 1, "pair_id": "p1", "text": "Term or Formula", "type": "term"}}, {{"id": 2, "pair_id": "p1", "text": "Matching Definition or Meaning", "type": "match"}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "cards" in res and len(res["cards"]) >= 8:
            return {
                "game_type": "memory",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Memory Match generated for {subject}",
                "data": res["cards"][:12]
            }

        # Subject-specific fallback
        if domain == "physics":
            cards = [
                {"id": 1, "pair_id": "p1", "text": "F = ma", "type": "term"},
                {"id": 2, "pair_id": "p1", "text": "Newton's 2nd Law", "type": "match"},
                {"id": 3, "pair_id": "p2", "text": "1/f = 1/v - 1/u", "type": "term"},
                {"id": 4, "pair_id": "p2", "text": "Lens Formula", "type": "match"},
                {"id": 5, "pair_id": "p3", "text": "E = hν", "type": "term"},
                {"id": 6, "pair_id": "p3", "text": "Planck's Photon Energy", "type": "match"},
                {"id": 7, "pair_id": "p4", "text": "PV^γ = C", "type": "term"},
                {"id": 8, "pair_id": "p4", "text": "Adiabatic Process", "type": "match"},
                {"id": 9, "pair_id": "p5", "text": "∮ B · dl = μ0 I", "type": "term"},
                {"id": 10, "pair_id": "p5", "text": "Ampere's Circuital Law", "type": "match"},
                {"id": 11, "pair_id": "p6", "text": "I = (2/5)MR²", "type": "term"},
                {"id": 12, "pair_id": "p6", "text": "Solid Sphere Inertia", "type": "match"}
            ]
        elif domain == "chemistry":
            cards = [
                {"id": 1, "pair_id": "p1", "text": "PV = nRT", "type": "term"},
                {"id": 2, "pair_id": "p1", "text": "Ideal Gas Law", "type": "match"},
                {"id": 3, "pair_id": "p2", "text": "pH = -log[H+]", "type": "term"},
                {"id": 4, "pair_id": "p2", "text": "Acidity Definition", "type": "match"},
                {"id": 5, "pair_id": "p3", "text": "k = A*e^(-Ea/RT)", "type": "term"},
                {"id": 6, "pair_id": "p3", "text": "Arrhenius Equation", "type": "match"},
                {"id": 7, "pair_id": "p4", "text": "sp³ Hybridization", "type": "term"},
                {"id": 8, "pair_id": "p4", "text": "Tetrahedral (109.5°)", "type": "match"},
                {"id": 9, "pair_id": "p5", "text": "ΔG = ΔH - TΔS", "type": "term"},
                {"id": 10, "pair_id": "p5", "text": "Gibbs Free Energy", "type": "match"},
                {"id": 11, "pair_id": "p6", "text": "SN2 Mechanism", "type": "term"},
                {"id": 12, "pair_id": "p6", "text": "Bimolecular Inversion", "type": "match"}
            ]
        else:
            cards = [
                {"id": 1, "pair_id": "p1", "text": "O(log n)", "type": "term"},
                {"id": 2, "pair_id": "p1", "text": "Binary Search", "type": "match"},
                {"id": 3, "pair_id": "p2", "text": "LIFO Structure", "type": "term"},
                {"id": 4, "pair_id": "p2", "text": "Stack Data Structure", "type": "match"},
                {"id": 5, "pair_id": "p3", "text": "malloc()", "type": "term"},
                {"id": 6, "pair_id": "p3", "text": "Heap Dynamic Allocation", "type": "match"},
                {"id": 7, "pair_id": "p4", "text": "O(n log n)", "type": "term"},
                {"id": 8, "pair_id": "p4", "text": "MergeSort / QuickSort", "type": "match"},
                {"id": 9, "pair_id": "p5", "text": "Paging", "type": "term"},
                {"id": 10, "pair_id": "p5", "text": "Virtual Memory Division", "type": "match"},
                {"id": 11, "pair_id": "p6", "text": "ACID Properties", "type": "term"},
                {"id": 12, "pair_id": "p6", "text": "DBMS Transaction Model", "type": "match"}
            ]

        return {
            "game_type": "memory",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} memory grid.",
            "data": cards
        }

    # -------------------------------------------------------------
    # 7. SPEED CHALLENGE (8-10 Rapid True/False questions)
    # -------------------------------------------------------------
    elif game_type == "speed":
        prompt = (
            f"Generate 8 rapid-fire TRUE or FALSE conceptual statements for:\n"
            f"- Subject: {subject}\n"
            f"- Course: {course_name} ({class_or_semester})\n"
            f"- Topic: {topic}\n\n"
            f"Format strictly as JSON:\n"
            f'{{"questions": [{{"id": 1, "statement": "...", "is_true": true, "explanation": "..."}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "questions" in res and len(res["questions"]) >= 5:
            return {
                "game_type": "speed",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Speed Challenge generated for {subject}",
                "data": res["questions"]
            }

        # Subject-specific fallback
        if domain == "physics":
            qs = [
                {"id": 1, "statement": "The acceleration of a projectile at its highest point is zero.", "is_true": False, "explanation": "Gravitational acceleration g remains 9.8 m/s² downwards throughout flight."},
                {"id": 2, "statement": "Static friction is always greater than or equal to kinetic friction between two surfaces.", "is_true": True, "explanation": "μ_s is higher than μ_k because interlocking surface asperities require more force to break from rest."},
                {"id": 3, "statement": "Electric field inside a hollow charged spherical conductor in electrostatic equilibrium is zero.", "is_true": True, "explanation": "By Gauss's law, enclosed charge is 0, so internal electric field is strictly 0."},
                {"id": 4, "statement": "Sound waves can travel through a perfect vacuum.", "is_true": False, "explanation": "Sound is a mechanical pressure wave requiring a material medium to propagate."},
                {"id": 5, "statement": "A convex lens always forms a real image regardless of object position.", "is_true": False, "explanation": "When object is placed between focal point and optical center, the image is virtual and magnified."}
            ]
        elif domain == "chemistry":
            qs = [
                {"id": 1, "statement": "Noble gases have zero electron affinity and exceptionally high ionization enthalpies.", "is_true": True, "explanation": "Their complete octet electronic configuration imparts immense thermodynamic stability."},
                {"id": 2, "statement": "Adding a catalyst to a reversible reaction increases the equilibrium constant Kc.", "is_true": False, "explanation": "Catalysts increase the rate of both forward and reverse reactions equally without altering Kc."},
                {"id": 3, "statement": "Water has a higher boiling point than hydrogen sulfide (H2S) due to intermolecular hydrogen bonding.", "is_true": True, "explanation": "Strong O-H...O hydrogen bonds require substantial energy to overcome compared to weak dipole-dipole forces in H2S."}
            ]
        else:
            qs = [
                {"id": 1, "statement": "In C, arrays are passed by reference / pointer by default in function arguments.", "is_true": True, "explanation": "The array name decays to a pointer to its first element."},
                {"id": 2, "statement": "Binary Search has a worst-case time complexity of O(n).", "is_true": False, "explanation": "Worst case of Binary Search is O(log n)."},
                {"id": 3, "statement": "A stack operates on the Last-In-First-Out (LIFO) principle.", "is_true": True, "explanation": "The most recently added element is always the first one to be removed."}
            ]

        return {
            "game_type": "speed",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} speed questions.",
            "data": qs
        }

    # -------------------------------------------------------------
    # 8. TECH WORD SCRAMBLE (Subject-specific keywords)
    # -------------------------------------------------------------
    elif game_type == "scramble":
        prompt = (
            f"Generate 5 essential academic keywords strictly from:\n"
            f"- Subject: {subject}\n"
            f"- Course: {course_name}\n"
            f"- Topic: {topic}\n\n"
            f"Provide the exact UPPERCASE word, scrambled letters (anagram), category, and hint.\n"
            f"Format strictly as JSON:\n"
            f'{{"words": [{{"id": 1, "word": "WORD", "scrambled": "SHUFFLED", "hint": "...", "category": "{subject}"}}]}}'
        )
        res = _call_groq_api(prompt, system_prompt)
        if res and isinstance(res, dict) and "words" in res and len(res["words"]) >= 3:
            return {
                "game_type": "scramble",
                "is_ai_generated": True,
                "subject": subject,
                "topic": topic,
                "notice": f"✨ AI Word Scramble generated for {subject}",
                "data": res["words"][:5]
            }

        # Subject-specific fallback
        fb_sc = SUBJECT_FALLBACKS.get(domain, SUBJECT_FALLBACKS["physics"])["scramble"]
        return {
            "game_type": "scramble",
            "is_ai_generated": False,
            "fallback_mode": True,
            "subject": subject,
            "topic": topic,
            "notice": f"⚠️ Groq API connection issue. Showing verified {subject} keywords.",
            "data": fb_sc
        }

    # Default fallback
    return {
        "game_type": "quiz",
        "is_ai_generated": False,
        "fallback_mode": True,
        "subject": subject,
        "topic": topic,
        "notice": "Showing verified curriculum questions.",
        "data": SUBJECT_FALLBACKS["physics"]["quiz"]
    }
