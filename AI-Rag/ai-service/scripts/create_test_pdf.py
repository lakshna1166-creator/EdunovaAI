"""
Create a test PDF containing clear information about Artificial Intelligence.
Run: python scripts/create_test_pdf.py
"""

from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    import fitz  # type: ignore

OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "uploads" / "ai_intro.pdf"
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

AI_CONTENT = """\
Introduction to Artificial Intelligence

Chapter 1: What is AI?

Artificial Intelligence (AI) is a field of computer science that focuses on
creating systems capable of performing tasks that normally require human
intelligence, such as learning, reasoning, and problem solving.

AI systems are designed to simulate human cognitive functions. They can
analyze data, recognize patterns, and make decisions with minimal human
intervention.

Chapter 2: Main Characteristics of AI

The main characteristics of AI include:

1. Learning: AI systems can learn from experience and improve over time
   through a process called machine learning.

2. Reasoning: AI can apply logical rules to reach conclusions and solve
   complex problems.

3. Problem Solving: AI is capable of finding solutions to difficult
   problems by searching through many possible options.

4. Perception: AI systems can interpret and understand sensory inputs
   such as images, sound, and text.

5. Language Understanding: Modern AI can comprehend and generate
   natural human language through Natural Language Processing (NLP).

Chapter 3: Types of AI

Narrow AI (Weak AI): Designed to perform a specific task, such as
facial recognition, chess playing, or language translation.

General AI (Strong AI): A theoretical form of AI that could perform
any intellectual task that a human can do.

Superintelligence: A hypothetical AI that surpasses human intelligence
in all aspects.

Chapter 4: Applications of AI

AI is used in many fields including:
- Healthcare: diagnosing diseases and analyzing medical images.
- Finance: detecting fraud and predicting market trends.
- Education: personalizing learning experiences for students.
- Transportation: powering self-driving vehicles.
- Customer service: chatbots and virtual assistants.
"""

doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), AI_CONTENT, fontsize=10)
doc.save(OUTPUT_PATH)
doc.close()

print(f"Test PDF created at: {OUTPUT_PATH}")
print(f"File size: {OUTPUT_PATH.stat().st_size} bytes")
