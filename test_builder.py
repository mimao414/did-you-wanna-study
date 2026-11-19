# -*- coding: utf-8 -*-
"""
Full Database Builder with Complete Step-by-Step Problem Solving & Concept Explanations
Created for: 資處科一仁 鍾百越 同學
"""

import json
import re
import os

def clean_text(t):
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    return ' '.join(lines)

def build_database():
    os.makedirs('site/data', exist_ok=True)
    
    # Load quiz text
    with open('quiz_extracted.txt', 'r', encoding='utf-8') as f:
        q_txt = f.read()
    q_pages = q_txt.split('=== PAGE ')

    # Load exercise text
    with open('exercise_extracted.txt', 'r', encoding='utf-8') as f:
        e_txt = f.read()
    e_pages = e_txt.split('=== PAGE ')

    print("Building Quiz Database...")
    quiz_items = []

    def parse_quiz_round(p_list, r_num, chap_num, title, p_start):
        combined = '\n'.join([q_pages[p] for p in p_list])
        expl_map = {}
        if '精解說明' in combined:
            parts_expl = re.split(r'\n[I■\s]*精解說明', combined)
            main_body = parts_expl[0]
            if len(parts_expl) > 1:
                expl_body = parts_expl[1]
                expl_items = re.findall(r'(\d+)\.\s*([\s\S]*?)(?=(?:\d+\.)|$)', expl_body)
                for n, exp in expl_items:
                    expl_map[int(n)] = clean_text(exp)
        else:
            main_body = combined

        parts = re.split(r'(\*?\s*\(\s*[A-D]\s*\)\s*\d+\.)', main_body)
        round_items = []
        for i in range(1, len(parts), 2):
            header = parts[i]
            body = parts[i+1]
            is_star = '*' in header
            ans = re.search(r'\(\s*([A-D])\s*\)', header).group(1)
            num = int(re.search(r'(\d+)\.', header).group(1))

            idx_a = body.find('(A)')
            if idx_a != -1:
                q_text = clean_text(body[:idx_a])
                opts_text = body[idx_a:]
                opt_matches = re.findall(r'\(([A-D])\)\s*([^()]+?)(?=\([A-D]\)|$)', opts_text)
                options = {letter: clean_text(opt_txt) for letter, opt_txt in opt_matches}
            else:
                q_text = clean_text(body)
                options = {}

            if r_num == 3:
                p_no = p_start if num <= 13 else p_start + 1
            elif r_num == 4:
                p_no = p_start if num <= 11 else p_start + 1
            else:
                p_no = p_start

            round_items.append({
                'id': f'quiz_r{r_num}_q{num}',
                'category': 'quiz',
                'category_name': '隨堂測驗卷',
                'round_num': r_num,
                'round_name': f'第{r_num}回',
                'chapter_num': chap_num,
                'chapter_name': f'第{chap_num}章',
                'chapter_title': title,
                'type': 'choice',
                'type_name': '單選題',
                'q_num': num,
                'is_advanced': is_star,
                'answer': ans,
                'question': q_text,
                'options': options,
                'official_explanation': expl_map.get(num, ''),
                'page': p_no,
                'page_img': f'assets/pages/quiz/page_{p_no}.png'
            })
        return round_items

    quiz_items.extend(parse_quiz_round([1, 2], 3, 3, '系統平台的組成架構－硬體', 1))
    quiz_items.extend(parse_quiz_round([3, 4], 4, 4, '系統平台的組成架構－軟體與網路', 3))
    quiz_items.extend(parse_quiz_round([5], 5, 5, '系統平台的運作與未來發展', 5))
    print(f"Total quiz items: {len(quiz_items)}")

    # Now let's extract exercise choice questions
    print("Building Exercise Choice Database...")
    exercise_items = []

    def parse_exercise_round(p_list, r_num, chap_num, title, p_start, p_end):
        combined = '\n'.join([e_pages[p] for p in p_list])
        expl_map = {}
        if '精解說明' in combined:
            parts_expl = re.split(r'\n[I■\s]*精解說明', combined)
            main_body = parts_expl[0]
            if len(parts_expl) > 1:
                expl_body = parts_expl[1]
                expl_items = re.findall(r'(\d+)\.\s*([\s\S]*?)(?=(?:\d+\.)|$)', expl_body)
                for n, exp in expl_items:
                    expl_map[int(n)] = clean_text(exp)
        else:
            main_body = combined

        # Only search in 一、選擇題 section
        choice_part = main_body
        if '二、' in main_body:
            choice_part = main_body.split('二、')[0]

        parts = re.split(r'(\*?\s*\(\s*[A-D]\s*\)\s*\d+\.)', choice_part)
        round_items = []
        for i in range(1, len(parts), 2):
            header = parts[i]
            body = parts[i+1]
            is_star = '*' in header
            ans = re.search(r'\(\s*([A-D])\s*\)', header).group(1)
            num = int(re.search(r'(\d+)\.', header).group(1))

            idx_a = body.find('(A)')
            if idx_a != -1:
                q_text = clean_text(body[:idx_a])
                opts_text = body[idx_a:]
                opt_matches = re.findall(r'\(([A-D])\)\s*([^()]+?)(?=\([A-D]\)|$)', opts_text)
                options = {letter: clean_text(opt_txt) for letter, opt_txt in opt_matches}
            else:
                q_text = clean_text(body)
                options = {}

            # Page in exercise
            p_no = p_start if num <= 7 else p_start + 1

            round_items.append({
                'id': f'ex_r{r_num}_q{num}',
                'category': 'exercise',
                'category_name': '課堂習作本',
                'round_num': r_num,
                'round_name': f'第三回' if r_num==3 else (f'第四回' if r_num==4 else (f'第五回' if r_num==5 else '第六回')),
                'chapter_num': chap_num,
                'chapter_name': f'第{chap_num}章',
                'chapter_title': title,
                'type': 'choice',
                'type_name': '單選題',
                'q_num': num,
                'is_advanced': is_star,
                'answer': ans,
                'question': q_text,
                'options': options,
                'official_explanation': expl_map.get(num, ''),
                'page': p_no,
                'page_img': f'assets/pages/exercise/page_{p_no}.png'
            })
        return round_items

    exercise_items.extend(parse_exercise_round([1, 2, 3, 4, 5], 3, 3, '系統平台的組成架構－硬體', 1, 5))
    exercise_items.extend(parse_exercise_round([6, 7, 8, 9, 10], 4, 4, '系統平台的組成架構－軟體與網路', 6, 10))
    exercise_items.extend(parse_exercise_round([11, 12, 13, 14], 5, 5, '系統平台的運作與未來發展', 11, 14))
    exercise_items.extend(parse_exercise_round([15, 16, 17, 18], 6, 6, '辦公室軟體與影像／影音軟體', 15, 18))
    print(f"Total exercise choice items: {len(exercise_items)}")

    return quiz_items, exercise_items

quiz_items, exercise_items = build_database()
print("Quiz:", len(quiz_items), "Exercise:", len(exercise_items))
