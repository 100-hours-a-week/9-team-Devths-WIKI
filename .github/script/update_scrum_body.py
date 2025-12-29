import os
import re
from github import Github

# 환경 변수 가져오기
token = os.environ['GITHUB_TOKEN']
repo_name = os.environ['REPO_NAME']
issue_number = int(os.environ['ISSUE_NUMBER'])
comment_body = os.environ['COMMENT_BODY']
comment_author = os.environ['COMMENT_AUTHOR']

# Github 클라이언트 설정
g = Github(token)
repo = g.get_repo(repo_name)
issue = repo.get_issue(issue_number)
body = issue.body

def get_next_no(table_text):
    """테이블의 현재 행 개수를 세어 다음 번호를 반환"""
    rows = [line for line in table_text.strip().split('\n') if line.strip().startswith('|')]
    # 헤더(2줄)를 제외한 데이터 행의 개수 + 1
    # 헤더가 | no |... 와 |---|... 두 줄이라고 가정
    data_rows = [r for r in rows if '---' not in r and '아젠다' not in r]
    return len(data_rows) + 1

def add_row_to_table_1(body, author, content):
    """1. 아젠다/결과/피드백 테이블에 행 추가"""
    pattern = r"(## 1\. 아젠다/결과/피드백\s+)([\s\S]*?)(?=\n\s*<br />|\n\s*## 2\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        next_no = get_next_no(table_content)
        # 템플릿: | no | 아젠다 | 제안자 | 답변자 | 답변 내용 | 피드백 | 결과 |
        # 댓글 내용은 '아젠다' 칸에 넣고, 나머지는 공란(-) 처리
        new_row = f"| {next_no} | {content} | {author} | - | - | - | - |"
        
        # 마지막 줄이 파이프(|)로 끝나는지 확인하여 개행 처리
        if table_content.strip().endswith('|'):
            new_section = header + table_content.rstrip() + "\n" + new_row + "\n"
        else:
            new_section = header + table_content + "\n" + new_row + "\n"
            
        return body.replace(match.group(0), new_section)
    return body

def add_row_to_table_2(body, author, content):
    """2. Will do 테이블에 행 추가"""
    # [Will do] 제거
    clean_content = content.replace("[Will do]", "").strip()
    
    pattern = r"(## 2\. Will do.*?\n)([\s\S]*?)(?=\n\s*<br />|\n\s*## 3\.)"
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        # 템플릿: | 무엇을 | 누가 | 목표/목적 | 언제까지 |
        # 편의상 내용은 '무엇을'에 넣고 나머지는 공란
        new_row = f"| {clean_content} | {author} | - | - |"
        
        if table_content.strip().endswith('|'):
            new_section = header + table_content.rstrip() + "\n" + new_row + "\n"
        else:
            new_section = header + table_content + "\n" + new_row + "\n"
            
        return body.replace(match.group(0), new_section)
    return body

def add_row_to_table_3(body, author, content):
    """3. TBD 테이블에 행 추가"""
    # [TBD] 제거
    clean_content = content.replace("[TBD]", "").strip()
    
    pattern = r"(## 3\. TBD.*?\n)([\s\S]*?)(?=$)" # 문서 끝까지 혹은 다음 섹션
    match = re.search(pattern, body)
    
    if match:
        header = match.group(1)
        table_content = match.group(2)
        
        # 템플릿: | 내용 | 비고 | 종류 | 의사 결정자 | 논의 대상자 |
        new_row = f"| {clean_content} | - | - | - | - |"
        
        if table_content.strip().endswith('|'):
            new_section = header + table_content.rstrip() + "\n" + new_row + "\n"
        else:
            new_section = header + table_content + "\n" + new_row + "\n"
            
        return body.replace(match.group(0), new_section)
    return body

# 메인 로직
new_body = body

if comment_body.startswith("[Will do]"):
    new_body = add_row_to_table_2(new_body, comment_author, comment_body)
elif comment_body.startswith("[TBD]"):
    new_body = add_row_to_table_3(new_body, comment_author, comment_body)
else:
    # 기본값: 아젠다 테이블에 추가
    new_body = add_row_to_table_1(new_body, comment_author, comment_body)

# 변경사항이 있으면 이슈 업데이트
if new_body != body:
    issue.edit(body=new_body)
    print("Issue body updated successfully.")
else:
    print("No matching table found or no update needed.")