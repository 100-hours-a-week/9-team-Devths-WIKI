import os
import re
from github import Github

# 환경 변수 및 설정
token = os.environ['GITHUB_TOKEN']
repo_name = os.environ['REPO_NAME']
issue_number = int(os.environ['ISSUE_NUMBER'])
comment_body = os.environ['COMMENT_BODY']
comment_author = os.environ['COMMENT_AUTHOR']

g = Github(token)
repo = g.get_repo(repo_name)
issue = repo.get_issue(issue_number)
body = issue.body

def get_next_no(table_text):
    rows = [line for line in table_text.strip().split('\n') if line.strip().startswith('|')]
    data_rows = [r for r in rows if '---' not in r and '아젠다' not in r]
    return len(data_rows) + 1

def add_row_to_table_1(body, author, content):
    """1. 아젠다 테이블 추가 + 멘션(@) 감지"""
    pattern = r"(## 1\. 아젠다/결과/피드백\s+)([\s\S]*?)(?=\n\s*<br />|\n\s*## 2\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        # 1) 줄바꿈을 <br>로 변환 (표 깨짐 방지)
        safe_content = content.replace('\r\n', '<br>').replace('\n', '<br>')
        
        # 2) 멘션 추출 (@아이디)
        mentions = re.findall(r'@([a-zA-Z0-9-]+)', content)
        respondent = ', '.join(mentions) if mentions else '-'
        
        next_no = get_next_no(table_content)
        
        # 3) 행 생성
        new_row = f"| {next_no} | {safe_content} | {author} | {respondent} | - | - | - |"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_row}\n"
        return body.replace(match.group(0), new_section)
    return body

def add_row_to_table_2(body, author, content):
    """2. Will do 테이블 추가"""
    # 태그 제거 후 공백 정리
    clean_text = content.replace("[Will do]", "").strip()
    
    # 줄바꿈을 <br>로 변환
    safe_content = clean_text.replace('\r\n', '<br>').replace('\n', '<br>')
    
    pattern = r"(## 2\. Will do.*?\n)([\s\S]*?)(?=\n\s*<br />|\n\s*## 3\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        new_row = f"| {safe_content} | {author} | - | - |"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_row}\n"
        return body.replace(match.group(0), new_section)
    return body

def add_row_to_table_3(body, author, content):
    """3. TBD 테이블 추가"""
    clean_text = content.replace("[TBD]", "").strip()
    
    # 줄바꿈을 <br>로 변환
    safe_content = clean_text.replace('\r\n', '<br>').replace('\n', '<br>')
    
    pattern = r"(## 3\. TBD.*?\n)([\s\S]*?)(?=$)" 
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        new_row = f"| {safe_content} | - | - | - | - |"
        
        sep = "\n" if table_content.strip().endswith('|') else ""
        new_section = f"{header}{table_content.rstrip()}{sep}{new_row}\n"
        return body.replace(match.group(0), new_section)
    return body

# 실행 로직
new_body = body

# 순서 중요: [Will do], [TBD] 체크 먼저, 아니면 일반 아젠다
if comment_body.startswith("[Will do]"):
    new_body = add_row_to_table_2(new_body, comment_author, comment_body)
elif comment_body.startswith("[TBD]"):
    new_body = add_row_to_table_3(new_body, comment_author, comment_body)
else:
    new_body = add_row_to_table_1(new_body, comment_author, comment_body)

if new_body != body:
    issue.edit(body=new_body)
    print("✅ Issue body updated successfully.")
else:
    print("ℹ️ No matching table found or no update needed.")