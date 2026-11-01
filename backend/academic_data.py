"""
Academic Syllabus Data and Context Resolver for StudyMate.
Supports School Education (Class 9-12), Competitive Exams (JEE Main, JEE Advanced, NEET, CUET),
and Undergraduate Degrees (B.Tech CSE/ECE/Mech/Civil Sem 1-8, BCA, B.Sc., BBA).
"""

ACADEMIC_CATEGORIES = [
    {
        "id": "competitive",
        "name": "Competitive Examinations",
        "courses": [
            {
                "id": "jee_main",
                "name": "JEE Main",
                "preparation_levels": ["Target 2026", "Target 2027", "Revision & Dropper", "Foundation"],
                "subjects": [
                    {
                        "name": "Physics",
                        "chapters": [
                            "Kinematics & Motion in 1D/2D",
                            "Newton's Laws of Motion & Friction",
                            "Work, Energy and Power",
                            "System of Particles & Rotational Motion",
                            "Gravitation",
                            "Mechanical Properties of Solids & Fluids",
                            "Thermodynamics & Kinetic Theory",
                            "Oscillations and Waves",
                            "Electrostatics & Capacitance",
                            "Current Electricity",
                            "Magnetic Effects of Current & Magnetism",
                            "Electromagnetic Induction & AC",
                            "Ray Optics & Wave Optics",
                            "Dual Nature of Radiation & Matter",
                            "Atoms and Nuclei",
                            "Semiconductor Electronics",
                        ],
                    },
                    {
                        "name": "Chemistry",
                        "chapters": [
                            "Some Basic Concepts of Chemistry (Mole Concept)",
                            "Atomic Structure & Quantum Numbers",
                            "Chemical Bonding & Molecular Structure",
                            "Chemical Thermodynamics",
                            "Chemical & Ionic Equilibrium",
                            "Redox Reactions & Electrochemistry",
                            "Chemical Kinetics",
                            "Classification of Elements & Periodicity",
                            "p-Block, d-Block & f-Block Elements",
                            "Coordination Compounds",
                            "General Organic Chemistry (GOC & Isomerism)",
                            "Hydrocarbons (Alkanes, Alkenes, Alkynes, Arenes)",
                            "Haloalkanes and Haloarenes",
                            "Alcohols, Phenols and Ethers",
                            "Aldehydes, Ketones and Carboxylic Acids",
                            "Organic Compounds Containing Nitrogen (Amines)",
                            "Biomolecules",
                        ],
                    },
                    {
                        "name": "Mathematics",
                        "chapters": [
                            "Sets, Relations and Functions",
                            "Complex Numbers & Quadratic Equations",
                            "Matrices and Determinants",
                            "Permutations and Combinations",
                            "Binomial Theorem & Simple Applications",
                            "Sequence and Series (AP, GP, HP)",
                            "Limits, Continuity and Differentiability",
                            "Application of Derivatives (Tangents, Maxima/Minima)",
                            "Indefinite and Definite Integrals",
                            "Differential Equations",
                            "Coordinate Geometry (Straight Lines, Circles)",
                            "Conic Sections (Parabola, Ellipse, Hyperbola)",
                            "Vector Algebra",
                            "Three Dimensional Geometry (3D)",
                            "Probability",
                            "Trigonometry (Identities, Equations, Heights & Distances)",
                        ],
                    },
                ],
            },
            {
                "id": "jee_advanced",
                "name": "JEE Advanced",
                "preparation_levels": ["Target 2026", "Target 2027", "Rank Booster", "Advanced Problem Solving"],
                "subjects": [
                    {
                        "name": "Physics",
                        "chapters": [
                            "Rigid Body Dynamics & Angular Momentum Conservation",
                            "Fluids Dynamics & Viscosity, Surface Tension",
                            "Thermodynamic Cycles & Heat Engines",
                            "Wave Optics (Interference, Diffraction)",
                            "Electromagnetic Induction & Mutual Inductance",
                            "Capacitors with Dielectrics & RC Circuits",
                            "Magnetic Forces on Conductors & Charged Particles",
                            "Modern Physics (Photoelectric Effect, X-Rays)",
                            "Error Analysis & Vernier/Screw Gauge Experiments",
                        ],
                    },
                    {
                        "name": "Chemistry",
                        "chapters": [
                            "Thermodynamics & Thermochemistry (Entropy & Gibbs Free Energy)",
                            "Ionic Equilibrium (Buffer Solutions, Solubility Product)",
                            "Coordination Chemistry & Crystal Field Theory (CFT)",
                            "Qualitative Inorganic Analysis (Salt Analysis)",
                            "Reaction Mechanisms (SN1, SN2, E1, E2, Electrophilic Aromatic)",
                            "Stereochemistry & Optical Activity",
                            "Aldol, Cannizzaro & Named Organic Reactions",
                            "Polymers & Chemistry in Everyday Life",
                        ],
                    },
                    {
                        "name": "Mathematics",
                        "chapters": [
                            "Definite Integrals & Properties (Leibnitz Rule)",
                            "Differential Equations of First and Higher Order",
                            "Conics & Tangent/Normal Properties",
                            "Vectors & 3D Planes (Shortest Distance, Coplanarity)",
                            "Complex Numbers (Geometry of Argand Plane & Roots of Unity)",
                            "Probability & Bayes Theorem",
                            "Matrices, Inverse & System of Linear Equations",
                        ],
                    },
                ],
            },
            {
                "id": "neet",
                "name": "NEET (UG Medical)",
                "preparation_levels": ["Target 2026", "Target 2027", "Repeater / Intensive"],
                "subjects": [
                    {
                        "name": "Biology (Botany & Zoology)",
                        "chapters": [
                            "The Living World & Biological Classification",
                            "Plant Kingdom & Animal Kingdom",
                            "Cell: Structure and Function",
                            "Biomolecules & Cell Cycle",
                            "Plant Physiology (Photosynthesis, Respiration)",
                            "Human Physiology (Digestion, Circulation, Neural Control)",
                            "Reproduction in Organisms & Human Reproduction",
                            "Genetics and Evolution (Mendelian Principles, Molecular Basis)",
                            "Biotechnology: Principles and Applications",
                            "Ecology and Environment",
                        ],
                    },
                    {
                        "name": "Physics",
                        "chapters": [
                            "Units and Measurements",
                            "Motion in a Straight Line & Plane",
                            "Laws of Motion",
                            "Work, Energy and Power",
                            "Thermodynamics & Kinetic Theory",
                            "Current Electricity & Moving Charges",
                            "Ray Optics & Optical Instruments",
                            "Dual Nature & Modern Physics",
                        ],
                    },
                    {
                        "name": "Chemistry",
                        "chapters": [
                            "Structure of Atom & Chemical Bonding",
                            "Thermodynamics & Equilibrium",
                            "Electrochemistry & Kinetics",
                            "p-Block and Coordination Compounds",
                            "Organic Chemistry: Basic Principles & Reactions",
                            "Biomolecules",
                        ],
                    },
                ],
            },
            {
                "id": "cuet",
                "name": "CUET (UG)",
                "preparation_levels": ["General Domain Test", "Domain Specific Revision"],
                "subjects": [
                    {"name": "Physics", "chapters": ["Electrostatics", "Current Electricity", "Optics", "Modern Physics"]},
                    {"name": "Chemistry", "chapters": ["Solid State", "Solutions", "Electrochemistry", "Polymers"]},
                    {"name": "Mathematics", "chapters": ["Relations & Functions", "Algebra", "Calculus", "Vectors"]},
                    {"name": "Computer Science / IP", "chapters": ["Python Fundamentals", "SQL & Database Queries", "Networking"]},
                ],
            },
        ],
    },
    {
        "id": "undergraduate",
        "name": "Undergraduate Education",
        "courses": [
            {
                "id": "btech",
                "name": "B.Tech / B.E.",
                "branches": [
                    {
                        "id": "cse",
                        "name": "Computer Science & Engineering (CSE)",
                        "semesters": [
                            {
                                "semester": "Semester 1",
                                "subjects": [
                                    {"name": "Programming for Problem Solving in C", "chapters": ["Control Flow & Conditional Statements", "Loops & Iterations", "Functions & Recursion", "Arrays & String Manipulation", "Pointers & Dynamic Memory Allocation", "Structures & File I/O"]},
                                    {"name": "Engineering Mathematics I", "chapters": ["Matrices, Eigenvalues & Eigenvectors", "Differential Calculus & Taylor Series", "Partial Differentiation", "Multiple Integrals", "Vector Calculus"]},
                                    {"name": "Engineering Physics", "chapters": ["Wave Optics (Interference & Diffraction)", "Quantum Mechanics & Wave Functions", "Lasers and Fiber Optics", "Electromagnetism & Maxwell Equations", "Semiconductor Physics"]},
                                    {"name": "Basic Electrical Engineering", "chapters": ["DC Circuits & Network Theorems", "AC Circuits & Phasors", "Transformers", "Electrical Machines"]},
                                ],
                            },
                            {
                                "semester": "Semester 2",
                                "subjects": [
                                    {"name": "Data Structures & Algorithms", "chapters": ["Asymptotic Complexity & Arrays", "Stacks & Queues", "Linked Lists (Singly, Doubly, Circular)", "Trees & Binary Search Trees (BST)", "Graph Representations & Traversals (BFS, DFS)", "Sorting & Searching Algorithms"]},
                                    {"name": "Engineering Mathematics II", "chapters": ["Ordinary Differential Equations", "Laplace Transforms", "Fourier Series & Transforms", "Complex Variables & Residues"]},
                                    {"name": "Object-Oriented Programming (C++ / Java)", "chapters": ["Classes & Objects", "Encapsulation & Constructors", "Inheritance & Polymorphism", "Virtual Functions & Abstract Classes", "Exception Handling & Templates"]},
                                    {"name": "Engineering Chemistry", "chapters": ["Atomic and Molecular Structure", "Periodic Properties", "Spectroscopy", "Corrosion & Water Treatment"]},
                                ],
                            },
                            {
                                "semester": "Semester 3",
                                "subjects": [
                                    {"name": "Discrete Mathematics", "chapters": ["Set Theory & Relations", "Propositional & Predicate Logic", "Combinatorics & Recurrence Relations", "Graph Theory & Trees", "Algebraic Structures & Groups"]},
                                    {"name": "Digital Logic Design", "chapters": ["Boolean Algebra & Logic Gates", "Karnaugh Maps & Combinational Circuits", "Sequential Circuits (Flip-Flops, Counters)", "Memory & Programmable Logic"]},
                                    {"name": "Computer Organization & Architecture", "chapters": ["Instruction Set Architecture (ISA)", "CPU Datapath & Control Unit", "Pipelining & Hazards", "Memory Hierarchy & Cache Memory", "I/O Organization & Interrupts"]},
                                ],
                            },
                            {
                                "semester": "Semester 4",
                                "subjects": [
                                    {"name": "Operating Systems", "chapters": ["Processes & Threads", "CPU Scheduling Algorithms", "Process Synchronization & Semaphores", "Deadlocks (Prevention, Avoidance, Detection)", "Memory Management & Paging", "Virtual Memory & Page Replacement", "File Systems & Disk Scheduling"]},
                                    {"name": "Database Management Systems (DBMS)", "chapters": ["ER Modeling & Relational Model", "Relational Algebra & Calculus", "SQL Queries & Joins", "Normalization (1NF, 2NF, 3NF, BCNF)", "Transaction Processing & ACID Properties", "Concurrency Control & Indexing"]},
                                    {"name": "Design & Analysis of Algorithms", "chapters": ["Divide and Conquer Algorithms", "Greedy Method (MST, Dijkstra)", "Dynamic Programming (Knapsack, LCS)", "Backtracking & Branch and Bound", "NP-Completeness & Approximation"]},
                                    {"name": "Theory of Computation (Automata)", "chapters": ["Finite Automata (DFA, NFA)", "Regular Expressions & Pumping Lemma", "Context-Free Grammars & Pushdown Automata", "Turing Machines & Decidability"]},
                                ],
                            },
                            {
                                "semester": "Semester 5",
                                "subjects": [
                                    {"name": "Computer Networks", "chapters": ["OSI & TCP/IP Reference Models", "Data Link Layer & Error Detection", "Network Layer (Routing Algorithms, IPv4/IPv6)", "Transport Layer (TCP, UDP, Congestion Control)", "Application Layer (DNS, HTTP, SMTP)"]},
                                    {"name": "Software Engineering", "chapters": ["Software Development Life Cycle (SDLC)", "Agile & Scrum Methodologies", "Requirement Analysis & UML Diagrams", "Software Testing & Quality Assurance"]},
                                    {"name": "Machine Learning", "chapters": ["Linear & Logistic Regression", "Decision Trees & Random Forests", "Support Vector Machines (SVM)", "Unsupervised Learning & K-Means Clustering", "Neural Networks Fundamentals"]},
                                ],
                            },
                            {
                                "semester": "Semester 6",
                                "subjects": [
                                    {"name": "Artificial Intelligence", "chapters": ["Informed & Uninformed Search (A*, Minimax)", "Knowledge Representation & First-Order Logic", "Probabilistic Reasoning & Bayesian Networks", "Reinforcement Learning"]},
                                    {"name": "Compiler Design", "chapters": ["Lexical Analysis & Lex", "Syntax Analysis & Parsing (LL, LR)", "Syntax-Directed Translation", "Intermediate Code Generation & Optimization"]},
                                    {"name": "Cloud Computing & DevOps", "chapters": ["Cloud Service Models (IaaS, PaaS, SaaS)", "Virtualization & Containers (Docker)", "Kubernetes Orchestration", "CI/CD Pipelines"]},
                                ],
                            },
                            {
                                "semester": "Semester 7",
                                "subjects": [
                                    {"name": "Deep Learning & NLP", "chapters": ["Convolutional Neural Networks (CNN)", "Recurrent Neural Networks (RNN & LSTM)", "Transformers & Attention Mechanisms", "Large Language Models Fundamentals"]},
                                    {"name": "Cybersecurity & Cryptography", "chapters": ["Symmetric & Asymmetric Encryption (AES, RSA)", "Hash Functions & Digital Signatures", "Network Security & Firewalls", "Vulnerability Assessment & Penetration Testing"]},
                                ],
                            },
                            {
                                "semester": "Semester 8",
                                "subjects": [
                                    {"name": "Distributed Systems & System Design", "chapters": ["CAP Theorem & Consensus (Raft, Paxos)", "Microservices Architecture", "Scalable Database Design & Sharding", "Fault Tolerance & Load Balancing"]},
                                ],
                            },
                        ],
                    },
                    {
                        "id": "aiml",
                        "name": "Artificial Intelligence & Data Science",
                        "semesters": [
                            {
                                "semester": "Semester 1",
                                "subjects": [
                                    {"name": "Python for Data Science & AI", "chapters": ["Python Syntax & Data Structures", "NumPy & Vectorized Computing", "Pandas for Data Manipulation", "Matplotlib & Seaborn Visualization"]},
                                    {"name": "Linear Algebra & Calculus for AI", "chapters": ["Vector Spaces & Projections", "Matrix Decompositions (SVD, PCA)", "Multivariate Calculus & Gradients"]},
                                ],
                            },
                            {
                                "semester": "Semester 2",
                                "subjects": [
                                    {"name": "Data Structures & Object-Oriented AI", "chapters": ["Trees, Graphs & Priority Queues", "OOP in Python/C++", "Algorithm Complexity"]},
                                    {"name": "Probability & Statistics for Machine Learning", "chapters": ["Random Variables & Distributions", "Hypothesis Testing", "Maximum Likelihood Estimation"]},
                                ],
                            },
                        ],
                    },
                    {
                        "id": "ece",
                        "name": "Electronics & Communication (ECE)",
                        "semesters": [
                            {
                                "semester": "Semester 1",
                                "subjects": [
                                    {"name": "Electronic Devices & Circuits", "chapters": ["Semiconductor Diodes & Applications", "BJT & MOSFET Characteristics", "Biasing and Small-Signal Analysis"]},
                                    {"name": "Engineering Mathematics I", "chapters": ["Matrices & Linear Systems", "Calculus & Series"]},
                                ],
                            },
                            {
                                "semester": "Semester 2",
                                "subjects": [
                                    {"name": "Signals and Systems", "chapters": ["Continuous & Discrete Time Signals", "LTI Systems & Convolution", "Fourier & Laplace Transforms", "Z-Transform"]},
                                    {"name": "Network Theory", "chapters": ["Kirchhoff's Laws", "Thevenin & Norton Theorems", "Two-Port Networks"]},
                                ],
                            },
                        ],
                    },
                    {
                        "id": "me",
                        "name": "Mechanical Engineering (ME)",
                        "semesters": [
                            {
                                "semester": "Semester 1",
                                "subjects": [
                                    {"name": "Engineering Mechanics", "chapters": ["Statics of Particles & Rigid Bodies", "Friction & Centroids", "Kinematics & Kinetics"]},
                                    {"name": "Engineering Mathematics I", "chapters": ["Calculus & Differential Equations"]},
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                "id": "bca",
                "name": "BCA (Bachelor of Computer Applications)",
                "semesters": [
                    {
                        "semester": "Semester 1",
                        "subjects": [
                            {"name": "Fundamentals of Programming with C", "chapters": ["Data Types & Control Structures", "Functions & Pointers", "Arrays & Strings"]},
                            {"name": "Computer Fundamentals & Office Automation", "chapters": ["Computer Hardware & Architecture", "Operating System Basics", "Number Systems"]},
                            {"name": "Mathematical Foundation for Computer Science", "chapters": ["Sets & Functions", "Matrices & Determinants", "Basic Calculus"]},
                        ],
                    },
                    {
                        "semester": "Semester 2",
                        "subjects": [
                            {"name": "Data Structures using C/C++", "chapters": ["Stacks, Queues, Linked Lists", "Trees & Graphs", "Sorting & Searching"]},
                            {"name": "Database Management Systems", "chapters": ["Relational Model & SQL", "Normalization", "Transactions"]},
                        ],
                    },
                ],
            },
            {
                "id": "bsc",
                "name": "B.Sc. (Computer Science / IT)",
                "semesters": [
                    {
                        "semester": "Semester 1",
                        "subjects": [
                            {"name": "Programming in Python", "chapters": ["Control Structures", "Data Collections", "Functions & Modules"]},
                            {"name": "Digital Computer Fundamentals", "chapters": ["Logic Gates", "Flip-Flops", "Counters"]},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "id": "school",
        "name": "School Education",
        "courses": [
            {
                "id": "class_9",
                "name": "Class 9",
                "boards": ["CBSE", "ICSE", "State Board"],
                "subjects": [
                    {"name": "Mathematics", "chapters": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Lines and Angles", "Triangles", "Quadrilaterals", "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics"]},
                    {"name": "Science", "chapters": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life (Cell)", "Tissues", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound"]},
                    {"name": "Computer Science / IT", "chapters": ["Basics of Information Technology", "Python Basics", "Cyber Safety"]},
                ],
            },
            {
                "id": "class_10",
                "name": "Class 10",
                "boards": ["CBSE", "ICSE", "State Board"],
                "subjects": [
                    {"name": "Mathematics", "chapters": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions (AP)", "Triangles & Similarity", "Coordinate Geometry", "Introduction to Trigonometry & Applications", "Circles", "Surface Areas and Volumes", "Statistics & Probability"]},
                    {"name": "Science", "chapters": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes (Nutrition, Respiration, Transportation, Excretion)", "Control and Coordination", "How do Organisms Reproduce?", "Heredity and Evolution", "Light: Reflection and Refraction", "The Human Eye and Colourful World", "Electricity (Ohm's Law, Resistance, Power)", "Magnetic Effects of Electric Current", "Our Environment"]},
                    {"name": "Information Technology (Code 402)", "chapters": ["Communication Skills", "Self-Management Skills", "Digital Documentation", "Electronic Spreadsheet", "Database Management System"]},
                ],
            },
            {
                "id": "class_11",
                "name": "Class 11",
                "boards": ["CBSE", "ICSE"],
                "streams": [
                    {
                        "name": "Science (PCM)",
                        "subjects": [
                            {"name": "Physics", "chapters": ["Physical World & Measurement", "Motion in a Straight Line & Plane", "Laws of Motion", "Work, Energy & Power", "System of Particles & Rotational Motion", "Gravitation", "Thermodynamics", "Oscillations & Waves"]},
                            {"name": "Chemistry", "chapters": ["Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Organic Chemistry Basics"]},
                            {"name": "Mathematics", "chapters": ["Sets & Functions", "Trigonometric Functions", "Complex Numbers", "Permutations & Combinations", "Straight Lines & Conic Sections", "Limits and Derivatives"]},
                            {"name": "Computer Science", "chapters": ["Computer System Overview", "Python Programming Fundamentals", "String & List Manipulation", "Data Management & SQL"]},
                        ],
                    },
                    {
                        "name": "Science (PCB)",
                        "subjects": [
                            {"name": "Physics", "chapters": ["Kinematics", "Laws of Motion", "Work Energy", "Thermodynamics", "Waves"]},
                            {"name": "Chemistry", "chapters": ["Structure of Atom", "Chemical Bonding", "Equilibrium", "Organic Chemistry"]},
                            {"name": "Biology", "chapters": ["Diversity in Living World", "Structural Organisation in Animals and Plants", "Cell Structure & Function", "Plant Physiology", "Human Physiology"]},
                        ],
                    },
                ],
            },
            {
                "id": "class_12",
                "name": "Class 12",
                "boards": ["CBSE", "ICSE"],
                "streams": [
                    {
                        "name": "Science (PCM)",
                        "subjects": [
                            {"name": "Physics", "chapters": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms & Nuclei", "Semiconductor Devices"]},
                            {"name": "Chemistry", "chapters": ["Solutions", "Electrochemistry", "Chemical Kinetics", "d and f Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"]},
                            {"name": "Mathematics", "chapters": ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices & Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals (Indefinite & Definite)", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"]},
                            {"name": "Computer Science", "chapters": ["Python Functions & File Handling", "Data Structures (Stack)", "Computer Networks", "Database Management with MySQL"]},
                        ],
                    },
                ],
            },
        ],
    },
]


def get_academic_presets():
    """Return full hierarchy for frontend UI."""
    return ACADEMIC_CATEGORIES


def resolve_subjects(category: str, course_name: str, branch_or_stream: str = "", class_or_semester: str = "") -> list:
    """Return exact subjects list based on student's full academic context."""
    category = (category or "").lower().strip()
    course_lower = (course_name or "").lower().strip()

    # 1. School Education
    if category == "school" or "class" in course_lower:
        for cat in ACADEMIC_CATEGORIES:
            if cat["id"] == "school":
                for c in cat["courses"]:
                    if c["name"].lower() == course_lower or c["id"] == course_lower:
                        if "subjects" in c:
                            return [s["name"] for s in c["subjects"]]
                        if "streams" in c:
                            for stream in c["streams"]:
                                if stream["name"].lower() == branch_or_stream.lower():
                                    return [s["name"] for s in stream["subjects"]]
                            return [s["name"] for s in c["streams"][0]["subjects"]]

    # 2. Competitive Exams
    if category == "competitive" or "jee" in course_lower or "neet" in course_lower or "cuet" in course_lower:
        for cat in ACADEMIC_CATEGORIES:
            if cat["id"] == "competitive":
                for c in cat["courses"]:
                    if c["name"].lower() == course_lower or c["id"] == course_lower or c["name"] in course_name:
                        return [s["name"] for s in c["subjects"]]

    # 3. Undergraduate
    for cat in ACADEMIC_CATEGORIES:
        if cat["id"] == "undergraduate":
            for c in cat["courses"]:
                if c["id"] == "btech" or "b.tech" in course_lower or "engineering" in course_lower:
                    branches = c.get("branches", [])
                    target_branch = branches[0]
                    for b in branches:
                        if b["id"] == branch_or_stream.lower() or b["name"].lower() == branch_or_stream.lower():
                            target_branch = b
                            break
                    for sem in target_branch.get("semesters", []):
                        if sem["semester"].lower() == class_or_semester.lower():
                            return [s["name"] for s in sem["subjects"]]
                    if target_branch.get("semesters"):
                        return [s["name"] for s in target_branch["semesters"][0]["subjects"]]

    # Default fallback
    return ["Physics", "Chemistry", "Mathematics", "Computer Science"]


def resolve_chapters(subject: str, course_name: str = "", branch_or_stream: str = "", class_or_semester: str = "") -> list:
    """Return chapters for a specific subject under current context."""
    subject_clean = subject.strip().lower()

    # Search in all categories
    for cat in ACADEMIC_CATEGORIES:
        for course in cat.get("courses", []):
            if "subjects" in course:
                for sub in course["subjects"]:
                    if sub["name"].lower() == subject_clean or subject_clean in sub["name"].lower():
                        return sub.get("chapters", [])
            if "branches" in course:
                for branch in course["branches"]:
                    for sem in branch.get("semesters", []):
                        for sub in sem.get("subjects", []):
                            if sub["name"].lower() == subject_clean or subject_clean in sub["name"].lower():
                                return sub.get("chapters", [])
            if "streams" in course:
                for stream in course["streams"]:
                    for sub in stream.get("subjects", []):
                        if sub["name"].lower() == subject_clean or subject_clean in sub["name"].lower():
                            return sub.get("chapters", [])

    return [
        f"Fundamentals of {subject}",
        f"Core Principles & Theorems",
        f"Advanced Applications & Problem Solving",
        f"Revision & Mock Challenge"
    ]
