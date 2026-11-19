# -*- coding: utf-8 -*-
"""
Assemble all questions and rich explanations into site/data/questions.json
"""

import json
import os
from explanations_quiz_r3 import QUIZ_R3_EXP
from explanations_quiz_r4 import QUIZ_R4_EXP
from explanations_quiz_r5 import QUIZ_R5_EXP
from explanations_exercise import EXERCISE_CHOICE_EXP
from explanations_nonchoice import NON_CHOICE_EXP

def assemble():
    os.makedirs('site/data', exist_ok=True)

    with open('site/data/raw_quiz.json', 'r', encoding='utf-8') as f:
        raw_quiz = json.load(f)

    with open('site/data/raw_exercise_choice.json', 'r', encoding='utf-8') as f:
        raw_exercise = json.load(f)

    final_questions = []

    # Process Quiz
    for item in raw_quiz:
        r_num = item['round_num']
        q_num = item['q_num']
        exp_dict = {}
        if r_num == 3 and q_num in QUIZ_R3_EXP:
            exp_dict = QUIZ_R3_EXP[q_num]
        elif r_num == 4 and q_num in QUIZ_R4_EXP:
            exp_dict = QUIZ_R4_EXP[q_num]
        elif r_num == 5 and q_num in QUIZ_R5_EXP:
            exp_dict = QUIZ_R5_EXP[q_num]

        item['key_concept'] = exp_dict.get('key_concept', '本題測驗核心資訊科技觀念')
        item['step_by_step'] = exp_dict.get('step_by_step', f"正確答案為 ({item['answer']})。")
        item['option_analysis'] = exp_dict.get('option_analysis', {})
        item['exam_tip'] = exp_dict.get('exam_tip', '高職資處科段考與統測重要考點。')
        item['tags'] = exp_dict.get('tags', [item['chapter_name'], '隨堂測驗'])
        final_questions.append(item)

    # Process Exercise Choice
    for item in raw_exercise:
        qid = item['id']
        exp_dict = EXERCISE_CHOICE_EXP.get(qid, {})
        item['key_concept'] = exp_dict.get('key_concept', '本題測驗習作本核心觀念')
        item['step_by_step'] = exp_dict.get('step_by_step', f"正確答案為 ({item['answer']})。")
        item['option_analysis'] = exp_dict.get('option_analysis', {})
        item['exam_tip'] = exp_dict.get('exam_tip', '高職資處科習作本重點題。')
        item['tags'] = exp_dict.get('tags', [item['chapter_name'], '課堂習作'])
        final_questions.append(item)

    # Append Non-choice
    for item in NON_CHOICE_EXP:
        final_questions.append(item)

    print(f"Total assembled questions: {len(final_questions)}")

    with open('site/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)

    # Generate meta
    meta = {
        "student_name": "鍾百越",
        "student_class": "資處科一仁",
        "subject": "數位科技概論（上）",
        "publisher": "旗立資訊",
        "total_questions": len(final_questions),
        "quiz_count": len(raw_quiz),
        "exercise_choice_count": len(raw_exercise),
        "exercise_nonchoice_count": len(NON_CHOICE_EXP),
        "chapters": [
            {"num": 3, "title": "系統平台的組成架構－硬體"},
            {"num": 4, "title": "系統平台的組成架構－軟體與網路"},
            {"num": 5, "title": "系統平台的運作與未來發展"},
            {"num": 6, "title": "辦公室軟體與影像／影音軟體"}
        ]
    }
    with open('site/data/meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # Generate Chapter summaries & cheat sheets
    summary_data = {
        "ch3": {
            "title": "第 3 章 系統平台的組成架構－硬體",
            "highlights": [
                {"title": "電腦五大單元", "desc": "IU（輸入）、CU（控制）、ALU（算術邏輯）、MU（記憶）、OU（輸出）。CPU = CU + ALU。"},
                {"title": "CPU 機器週期四步驟", "desc": "擷取（Fetch） -> 解碼（Decode） -> 執行（Execute） -> 儲存（Store）。"},
                {"title": "記憶體金字塔存取速度排行", "desc": "暫存器（Register） > 快取（Cache, SRAM） > 主記憶體（RAM, DRAM） > 唯讀記憶體（ROM） > 固態硬碟（SSD） > 機械硬碟（HDD） > 藍光/光碟。"},
                {"title": "SRAM vs DRAM 決勝表", "desc": "SRAM：雙極正反器、速度極快、免充電更新、成本高，作快取；DRAM：電容儲存、速度慢、需週期充電更新（Refresh）、成本低，作主記憶體。"},
                {"title": "固態硬碟（SSD）考點", "desc": "快閃記憶體（Flash）製成、抗震輕薄、速度快、壽命有寫入次數限制，【切勿進行磁碟重組】。"},
                {"title": "印表機雙指標", "desc": "列印速度看 ppm（頁/分）；列印品質看 dpi（點/吋）。撞擊式點陣式用色帶印複寫紙；非撞擊式雷射用碳粉、噴墨用CMYK墨水。"}
            ]
        },
        "ch4": {
            "title": "第 4 章 系統平台的組成架構－軟體與網路",
            "highlights": [
                {"title": "軟體兩大類體系", "desc": "系統軟體（作業系統、公用程式如磁碟重組/清理/防毒、語言翻譯程式如編譯器/直譯器）；應用軟體（套裝軟體如Office、專案開發軟體如藏壽司/大台北公車/銀行系統）。"},
                {"title": "作業系統三大人工作業分類", "desc": "單人單工（MS-DOS）；單人多工（Windows 11家用版、macOS、Android、iOS）；多人多工（Linux、UNIX、Windows Server）。"},
                {"title": "開源 vs 閉源生態", "desc": "開源作業系統：Linux、Android；閉源專有作業系統：Windows、macOS、iOS。"},
                {"title": "雲端三大服務架構（IaaS / PaaS / SaaS）", "desc": "IaaS（租硬體與雲端儲存空間，如AWS EC2/S3）；PaaS（租開發平台與資料庫環境，如Google App Engine）；SaaS（直接在線上使用應用軟體，如Gmail、YouTube、LINE、Office 365）。"},
                {"title": "網路規模範圍排行（大到小）", "desc": "網際網路（Internet） > 廣域網路（WAN，跨國/跨洲） > 都會網路（MAN，城市） > 區域網路（LAN，同一棟大樓/校園） > 個人網路（PAN，藍牙/10m內）。"}
            ]
        },
        "ch5": {
            "title": "第 5 章 系統平台的運作與未來發展",
            "highlights": [
                {"title": "系統平台運作三步驟", "desc": "輸入（Input） -> 處理（Process） -> 輸出（Output）。現代系統具分散式與雲端架構，可跨多平台協同完成。"},
                {"title": "行程五大狀態轉移模型", "desc": "建立（New） -> 就緒（Ready） <-> 執行（Running） -> 結束（Terminated）；執行遇 I/O 等待 -> 等待（Waiting） -> I/O 完成回到【就緒】重新排隊！"},
                {"title": "CPU 工作排程三大演算法", "desc": "先來先服務（FCFS，無搶佔）；最短工作優先（SJF，平均等待時間最短）；優先權排程（Priority Scheduling，低優先程序易產生【飢餓 Starvation】，解法為【老化 Aging】）。"},
                {"title": "平行處理（Parallel Processing）", "desc": "使用多核心 CPU 同時處理分割後的運算子任務，加速總體時間。"},
                {"title": "Windows 工具實用技巧", "desc": "工作管理員（Ctrl+Alt+Del 或 Ctrl+Shift+Esc，看CPU/RAM使用率，查不到瀏覽器造訪紀錄）；檔案總管檢視隱藏檔（檢視 -> 勾選隱藏的項目）；唯讀（不可修改刪除）。"},
                {"title": "AI 涵蓋關係與實作常理", "desc": "人工智慧（AI） > 機器學習（ML） > 深度學習（DL）。Teachable Machine 實作：樣本越充足越廣、訓練週期（Epochs）越大，模型辨識越精準。"}
            ]
        },
        "ch6": {
            "title": "第 6 章 辦公室軟體與影像／影音軟體",
            "highlights": [
                {"title": "五大辦公室套件對照", "desc": "文書：Word = Writer = Pages = Google文件；試算表：Excel = Calc = Numbers = Google試算表；簡報：PowerPoint = Impress = Keynote = Google簡報；資料庫：Access = Base。"},
                {"title": "影像處理工具", "desc": "點陣圖修圖合成：Photoshop、PhotoImpact、GIMP；向量繪圖：Illustrator、CorelDRAW。"},
                {"title": "3D 建模與動畫製作", "desc": "3D 動畫電影（玩具總動員/冰雪奇緣）：3ds Max、Maya、Blender；3D 列印空間設計：SketchUp。"},
                {"title": "影音與音訊後製", "desc": "影片剪輯：會聲會影、威力導演、Premiere；音訊剪輯/手機鈴聲/人聲特效後製：Audacity；影音播放（非編輯）：Windows Media Player、PotPlayer。"}
            ]
        }
    }
    with open('site/data/summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)

    print("Assemble finished successfully!")

if __name__ == '__main__':
    assemble()
