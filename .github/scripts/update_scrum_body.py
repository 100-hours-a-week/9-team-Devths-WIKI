import os
import re
from github import Github

# ---------------------------------------------------------
# 1. 사용자 매핑 설정 (닉네임 -> 실명/영어이름)
# ---------------------------------------------------------
USER_MAP = {
    "Hyeseong-Myeong": "henry.myeong",
    "yoondonggyu": "estar.yoon",
    "doup2001": "david.lee",
    "mosy2266": "yun.jeon",
    "neonoclock": "neon.ahn"
}

# 환경 변수 가져오기
token = os.environ['GITHUB_TOKEN']
repo_name = os.environ['REPO_NAME']
issue_number = int(os.environ['ISSUE_NUMBER'])
comment_body = os.environ['COMMENT_BODY']
comment_author_id = os.environ['COMMENT_AUTHOR']

# 작성자 이름 변환 (매핑 없으면 아이디 그대로 사용)
author_name = USER_MAP.get(comment_author_id, comment_author_id)

# Github 클라이언트 설정
g = Github(token)
repo = g.get_repo(repo_name)
issue = repo.get_issue(issue_number)
body = issue.body

def clean_text(text):
    """줄바꿈을 <br>로 변환하고 양옆 공백 제거"""
    if not text:
        return "-"
    return text.strip().replace('\r\n', '<br>').replace('\n', '<br>')

def get_next_no(table_text):
    """테이블의 현재 행 개수를 세어 다음 번호를 반환"""
    rows = [line for line in table_text.strip().split('\n') if line.strip().startswith('|')]
    # 헤더와 구분선을 제외한 데이터 행만 계산
    data_rows = [r for r in rows if '---' not in r and '아젠다' not in r]
    return len(data_rows) + 1

def extract_mentions(text):
    """텍스트에서 @아이디 추출"""
    mentions = re.findall(r'@([a-zA-Z0-9-]+)', text)
    return ', '.join(mentions) if mentions else '-'

# ---------------------------------------------------------
# 2. 아젠다 처리 (3개 행 추가)
# ---------------------------------------------------------
def process_agenda(body, author, comment):
    """
    [오늘 할 일] ... [예상되는 이슈] ... [작일 회고] ... 
    형식을 파싱하여 3개의 행을 추가
    """
    pattern = r"(## 1\. 아젠다/결과/피드백\s+)([\s\S]*?)(?=\n\s*<br />|\n\s*## 2\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        next_no = get_next_no(table_content)
        
        # 섹션별 내용 추출 (Regex)
        # 1. 오늘 할 일
        todo_match = re.search(r'\[오늘 할 일\](.*?)(?=\[예상되는 이슈\]|\[작일 회고\]|$)', comment, re.DOTALL)
        todo_text = clean_text(todo_match.group(1)) if todo_match else "-"
        
        # 2. 예상되는 이슈
        issue_match = re.search(r'\[예상되는 이슈\](.*?)(?=\[작일 회고\]|$)', comment, re.DOTALL)
        issue_text = clean_text(issue_match.group(1)) if issue_match else "-"

        # 3. 작일 회고
        review_match = re.search(r'\[작일 회고\](.*?)$', comment, re.DOTALL)
        review_text = clean_text(review_match.group(1)) if review_match else "-"

        # 멘션 감지 (전체 내용에서)
        respondent = extract_mentions(comment)

        # 3개의 행 생성
        # 템플릿: | no | 아젠다 | 제안자 | 답변자 | 답변 내용 | 피드백 | 결과 |
        row1 = f"| {next_no} | · 오늘 할 일 | {author} | {respondent} | {todo_text} | - | - |"
        row2 = f"| {next_no + 1} | · 예상되는 이슈 | {author} | {respondent} | {issue_text} | - | - |"
        row3 = f"| {next_no + 2} | · 작일 회고 | {author} | {respondent} | {review_text} | - | - |"
        
        new_rows = f"{row1}\n{row2}\n{row3}"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_rows}\n"
        return body.replace(match.group(0), new_section)
    
    return body

# ---------------------------------------------------------
# 3. Will Do 처리 (목표/기한 분리)
# ---------------------------------------------------------
def process_will_do(body, author, comment):
    """
    [Will do] 무엇을 | 목표 | 기한
    """
    content_part = comment.replace("[Will do]", "").strip()
    parts = content_part.split('|')
    
    # 파이프(|)로 분리, 부족하면 '-' 채움
    what = clean_text(parts[0]) if len(parts) > 0 else "-"
    goal = clean_text(parts[1]) if len(parts) > 1 else "-"
    due_date = clean_text(parts[2]) if len(parts) > 2 else "-"
    
    pattern = r"(## 2\. Will do.*?\n)([\s\S]*?)(?=\n\s*<br />|\n\s*## 3\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        # 템플릿: | 무엇을 | 누가 | 목표/목적 | 언제까지 |
        new_row = f"| {what} | {author} | {goal} | {due_date} |"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_row}\n"
        return body.replace(match.group(0), new_section)
    return body

# ---------------------------------------------------------
# 4. TBD 처리 (모든 필드 수동 작성)
# ---------------------------------------------------------
def process_tbd(body, author, comment):
    """
    [TBD] 내용 | 비고 | 종류 | 의사결정자 | 논의대상자
    """
    content_part = comment.replace("[TBD]", "").strip()
    parts = content_part.split('|')
    
    # 5개 필드 파싱
    content = clean_text(parts[0]) if len(parts) > 0 else "-"
    note = clean_text(parts[1]) if len(parts) > 1 else "-"
    kind = clean_text(parts[2]) if len(parts) > 2 else "-"
    decision_maker = clean_text(parts[3]) if len(parts) > 3 else "-"
    discussant = clean_text(parts[4]) if len(parts) > 4 else "-"
    
    pattern = r"(## 3\. TBD.*?\n)([\s\S]*?)(?=$)" 
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        # 템플릿: | 내용 | 비고 | 종류 | 의사 결정자 | 논의 대상자 |
        new_row = f"| {content} | {note} | {kind} | {decision_maker} | {discussant} |"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_row}\n"
        return body.replace(match.group(0), new_section)
    return body

# ---------------------------------------------------------
# 메인 실행 로직
# ---------------------------------------------------------
new_body = body

if comment_body.startswith("[Will do]"):
    new_body = process_will_do(new_body, author_name, comment_body)
elif comment_body.startswith("[TBD]"):
    new_body = process_tbd(new_body, author_name, comment_body)
else:
    # 기본: 아젠다 (3단 분리)
    # 반드시 [오늘 할 일] 태그가 포함되어 있어야만 처리하도록 안전장치를 둘 수도 있지만,
    # 편의상 일반 댓글은 아젠다로 간주하고 파싱 시도
    new_body = process_agenda(new_body, author_name, comment_body)

if new_body != body:
    issue.edit(body=new_body)
    print(f"✅ Issue updated for user: {author_name}")
else:
    print("ℹ️ No update made.")