# -*- coding: utf-8 -*-
import json
import re

with open('quiz_extracted.txt', 'r', encoding='utf-8') as f:
    q_txt = f.read()

# Extract quiz questions
# Quiz pages:
# Page 1: R3 Q1-13
# Page 2: R3 Q14-25 + expl
# Page 3: R4 Q1-11
# Page 4: R4 Q12-25 + expl
# Page 5: R5 Q1-13

q_pages = q_txt.split('=== PAGE ')
q_dict = {}

def clean_text(t):
    # remove excessive spaces/newlines
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    return ' '.join(lines)

def parse_round_quiz(p_texts, r_num, chap_num, title, p_start):
    combined = '\n'.join(p_texts)
    # Extract official explanation if any
    expl_map = {}
    if '精解說明' in combined:
        main_body, expl_body = combined.split('精解說明', 1)
        # parse numbered explanation: 1. ... 3. ...
        expl_items = re.findall(r'(\d+)\.\s*([\s\S]*?)(?=(?:\d+\.)|$)', expl_body)
        for n, exp in expl_items:
            expl_map[int(n)] = clean_text(exp)
    else:
        main_body = combined

    # Split by (*)?\s*\(\s*([A-D])\s*\)\s*(\d+)\.
    parts = re.split(r'(\*?\s*\(\s*[A-D]\s*\)\s*\d+\.)', main_body)
    items = []
    for i in range(1, len(parts), 2):
        header = parts[i]
        body = parts[i+1]
        
        is_star = '*' in header
        ans = re.search(r'\(\s*([A-D])\s*\)', header).group(1)
        num = int(re.search(r'(\d+)\.', header).group(1))
        
        # separate question text from options (A) (B) (C) (D)
        # Find first (A)
        idx_a = body.find('(A)')
        if idx_a != -1:
            q_text = clean_text(body[:idx_a])
            opts_text = body[idx_a:]
            # find all (A)... (B)... (C)... (D)...
            # regex for options
            opt_matches = re.findall(r'\(([A-D])\)\s*([^()]+?)(?=\([A-D]\)|$)', opts_text)
            options = {f'({letter})': clean_text(opt_txt) for letter, opt_txt in opt_matches}
        else:
            q_text = clean_text(body)
            options = {}

        # page calculation
        if r_num == 3:
            page_no = p_start if num <= 13 else p_start + 1
        elif r_num == 4:
            page_no = p_start if num <= 11 else p_start + 1
        else:
            page_no = p_start

        items.append({
            'id': f'quiz_r{r_num}_q{num}',
            'category': 'quiz',
            'category_name': '隨堂測驗卷',
            'round_num': r_num,
            'round_name': f'第{r_num}回',
            'chapter_num': chap_num,
            'chapter_name': f'第{chap_num}章',
            'chapter_title': title,
            'q_num': num,
            'is_advanced': is_star,
            'answer': ans,
            'question': q_text,
            'options': options,
            'official_explanation': expl_map.get(num, ''),
            'page': page_no,
            'page_img': f'assets/pages/quiz/page_{page_no}.png'
        })
    return items

quiz_r3 = parse_round_quiz([q_pages[1], q_pages[2]], 3, 3, '系統平台的組成架構－硬體', 1)
quiz_r4 = parse_round_quiz([q_pages[3], q_pages[4]], 4, 4, '系統平台的組成架構－軟體與網路', 3)
quiz_r5 = parse_round_quiz([q_pages[5]], 5, 5, '系統平台的運作與未來發展', 5)

all_quiz = quiz_r3 + quiz_r4 + quiz_r5
print(f'Parsed total quiz: {len(all_quiz)} (R3:{len(quiz_r3)}, R4:{len(quiz_r4)}, R5:{len(quiz_r5)})')

with open('quiz_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(all_quiz, f, ensure_ascii=False, indent=2)
