# -*- coding: utf-8 -*-
import re
import json

def parse_quiz():
    with open('quiz_extracted.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    pages = text.split('=== PAGE ')
    # Page 1: 第3回 1-13
    # Page 2: 第3回 14-25 + 精解
    # Page 3: 第4回 1-11
    # Page 4: 第4回 12-25 + 精解
    # Page 5: 第5回 1-13

    # Let's verify by page
    page_data = {}
    for p in pages[1:]:
        p_num = int(p.split(' ===')[0].strip())
        page_data[p_num] = p.split(' ===\n')[1]

    # Let's inspect questions in each page
    # Pattern: (*)?\s*\(\s*([A-D])\s*\)\s*(\d+)\.\s*([^(]+?)\s*(\(A\).*?\s*\(B\).*?\s*\(C\).*?\s*\(D\).*?)(?=\*?\s*\([A-D]\)\s*\d+\.|\n\nI\s*精解說明|得\s*分|$)
    # We can use a more flexible regex
    questions = []
    
    # Process round 3: pages 1 and 2
    r3_text = page_data[1] + "\n" + page_data[2]
    # Process round 4: pages 3 and 4
    r4_text = page_data[3] + "\n" + page_data[4]
    # Process round 5: page 5
    r5_text = page_data[5]

    def extract_from_round(round_text, round_num, chap_num, title, page_offset):
        # find where 精解說明 starts
        expl_dict = {}
        if '精解說明' in round_text:
            main_part, expl_part = round_text.split('精解說明', 1)
            # parse explanations e.g. 1. SRAM... 3. 記憶單元...
            expl_items = re.findall(r'(\d+)\.\s*([\s\S]*?)(?=(?:\d+\.)|$)', expl_part)
            for num, exp in expl_items:
                expl_dict[int(num)] = exp.strip()
        else:
            main_part = round_text

        # find all questions
        # pattern matching (*)? (Ans) num. Question ...
        q_matches = re.finditer(r'(\*?)\s*\(\s*([A-D])\s*\)\s*(\d+)\.\s*([\s\S]*?)(?=(?:\*?\s*\(\s*[A-D]\s*\)\s*\d+\.)|得\s*分|I\s*精解說明|$)', main_part)
        
        round_qs = []
        for m in q_matches:
            is_star = bool(m.group(1))
            ans = m.group(2).strip()
            num = int(m.group(3).strip())
            body = m.group(4).strip()
            
            # Determine page number
            # For round 3: 1-13 on p1, 14-25 on p2
            # For round 4: 1-11 on p3, 12-25 on p4
            # For round 5: 1-13 on p5
            if round_num == 3:
                p_ref = 1 if num <= 13 else 2
            elif round_num == 4:
                p_ref = 3 if num <= 11 else 4
            else:
                p_ref = 5

            round_qs.append({
                'id': f'quiz_r{round_num}_q{num}',
                'category': 'quiz',
                'source': '隨堂測驗卷',
                'round': f'第{round_num}回',
                'chapter': f'第{chap_num}章',
                'chapter_title': title,
                'q_num': num,
                'is_advanced': is_star,
                'answer': ans,
                'raw_body': body,
                'official_explanation': expl_dict.get(num, ''),
                'page': p_ref,
                'page_img': f'assets/pages/quiz/page_{p_ref}.png'
            })
        return round_qs

    q3 = extract_from_round(r3_text, 3, 3, '系統平台的組成架構－硬體', 1)
    q4 = extract_from_round(r4_text, 4, 4, '系統平台的組成架構－軟體與網路', 3)
    q5 = extract_from_round(r5_text, 5, 5, '系統平台的運作與未來發展', 5)

    print(f'Quiz R3: {len(q3)} questions')
    print(f'Quiz R4: {len(q4)} questions')
    print(f'Quiz R5: {len(q5)} questions')
    
    return q3 + q4 + q5

all_quiz = parse_quiz()
with open('quiz_parsed_raw.json', 'w', encoding='utf-8') as f:
    json.dump(all_quiz, f, ensure_ascii=False, indent=2)
print('Saved quiz_parsed_raw.json with', len(all_quiz), 'questions.')
