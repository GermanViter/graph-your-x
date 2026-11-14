"""Remplit la base avec des sujets vérifiés à la main.

Peut être relancé autant de fois qu'on veut : les lignes existantes sont mises à jour.
"""

from db import get_conn, init_db

# Les sujets "objectifs" proposés dans le sélecteur de l'UI.
TOPICS = ["machine-learning", "web-development", "cybersecurity"]

# (id, label, description, category, difficulty)
CONCEPTS = [
    # Machine Learning
    ("machine-learning", "Machine Learning", "Study of algorithms that learn from data.", "domain", 4),
    ("linear-algebra", "Linear Algebra", "Study of vectors, matrices and linear transformations.", "math", 3),
    ("python", "Python Programming", "General-purpose programming language.", "programming", 1),
    ("statistics", "Statistics", "Collection, analysis, interpretation of data.", "math", 3),
    ("calculus", "Calculus", "Study of continuous change.", "math", 3),
    ("probability", "Probability", "Study of uncertainty.", "math", 2),
    ("data-manipulation", "Data Manipulation", "Cleaning and preparing data.", "tools", 2),
    ("machine-learning-basics", "ML Basics", "Introduction to supervised/unsupervised learning.", "theory", 3),
    ("scikit-learn", "Scikit-Learn", "ML library for Python.", "tools", 3),
    ("numpy", "NumPy", "Library for numerical computing.", "tools", 3),
    # Web Development
    ("web-development", "Web Development", "Building web applications.", "domain", 4),
    ("html", "HTML", "Markup language for the web.", "tools", 1),
    ("css", "CSS", "Styling for the web.", "tools", 2),
    ("javascript", "JavaScript", "Programming language for the web.", "programming", 2),
    ("http-basics", "HTTP Basics", "How the web communicates.", "theory", 2),
    ("dom-manipulation", "DOM Manipulation", "Interacting with web pages.", "tools", 3),
    ("react", "React", "Frontend library.", "tools", 3),
    ("api-consumption", "API Consumption", "Fetching data from APIs.", "tools", 3),
    # Cybersecurity
    ("cybersecurity", "Cybersecurity", "Protecting systems.", "domain", 4),
    ("networking-fundamentals", "Networking Fundamentals", "How computers talk.", "theory", 2),
    ("linux-basics", "Linux Basics", "Operating system essentials.", "tools", 2),
    ("security-principles", "Security Principles", "Core security concepts.", "theory", 3),
    ("cryptography-basics", "Cryptography Basics", "Encryption and security.", "theory", 3),
    ("web-security-basics", "Web Security Basics", "Common web vulnerabilities.", "theory", 3),
    ("malware-analysis", "Malware Analysis", "Analyzing malicious software.", "theory", 4),
    ("network-security", "Network Security", "Securing networks.", "theory", 4),
]

# (concept_id, requires_id, type) : requires_id doit être appris avant concept_id
PREREQUISITES = [
    # Machine Learning
    ("machine-learning", "machine-learning-basics", "required"),
    ("machine-learning", "scikit-learn", "required"),
    ("machine-learning-basics", "statistics", "required"),
    ("machine-learning-basics", "probability", "required"),
    ("machine-learning-basics", "calculus", "recommended"),
    ("machine-learning-basics", "data-manipulation", "required"),
    ("scikit-learn", "python", "required"),
    ("scikit-learn", "numpy", "required"),
    ("numpy", "linear-algebra", "required"),
    ("numpy", "python", "required"),
    ("data-manipulation", "python", "required"),
    # Web Development
    ("web-development", "react", "required"),
    ("web-development", "api-consumption", "required"),
    ("react", "dom-manipulation", "required"),
    ("react", "javascript", "required"),
    ("dom-manipulation", "javascript", "required"),
    ("javascript", "html", "required"),
    ("javascript", "css", "required"),
    ("api-consumption", "http-basics", "required"),
    ("http-basics", "networking-fundamentals", "required"),
    # Cybersecurity
    ("cybersecurity", "security-principles", "required"),
    ("cybersecurity", "network-security", "required"),
    ("cybersecurity", "malware-analysis", "recommended"),
    ("security-principles", "cryptography-basics", "required"),
    ("security-principles", "web-security-basics", "required"),
    ("web-security-basics", "http-basics", "required"),
    ("network-security", "networking-fundamentals", "required"),
    ("network-security", "linux-basics", "required"),
    ("malware-analysis", "linux-basics", "required"),
    ("linux-basics", "networking-fundamentals", "required"),
]


def seed() -> None:
    init_db()
    with get_conn() as conn:
        conn.executemany(
            """
            INSERT INTO concepts (id, label, description, category, difficulty)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                label = excluded.label,
                description = excluded.description,
                category = excluded.category,
                difficulty = excluded.difficulty
            """,
            CONCEPTS,
        )
        conn.executemany(
            """
            INSERT INTO prerequisites (concept_id, requires_id, type)
            VALUES (?, ?, ?)
            ON CONFLICT(concept_id, requires_id) DO UPDATE SET type = excluded.type
            """,
            PREREQUISITES,
        )
        conn.executemany(
            "INSERT INTO topics (id) VALUES (?) ON CONFLICT(id) DO NOTHING",
            [(t,) for t in TOPICS],
        )
    print("Database seeded.")


if __name__ == "__main__":
    seed()
