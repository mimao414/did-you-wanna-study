# -*- coding: utf-8 -*-
"""
Rich Knowledge Base and Database Generator
Generates:
1. site/data/questions.json - All 63 Quiz + 40 Exercise Choice + Non-Choice Exercises with full step-by-step solutions
2. site/data/summary.json - Chapter summaries & cheat-sheets
"""

import json
import os

os.makedirs('site/data', exist_ok=True)

with open('site/data/raw_quiz.json', 'r', encoding='utf-8') as f:
    quiz_list = json.load(f)

with open('site/data/raw_exercise_choice.json', 'r', encoding='utf-8') as f:
    ex_choice_list = json.load(f)

print(f"Loaded {len(quiz_list)} quiz items and {len(ex_choice_list)} exercise choice items.")
