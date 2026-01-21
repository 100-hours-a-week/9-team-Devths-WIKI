---
name: Troubleshooting-Template
about: 트러블슈팅 템플릿
title: "[FE/BE/AI/Cloud] 260121(수)-트러블슈팅"
labels: ''
assignees: ''

---

> 작성 Tip: 에러 로그만 올리지 말고, "원인 분석"과 "해결 과정"을 논리적으로 적습니다.

# 🐞 [Trouble] 에러 메시지 또는 현상 요약

### 1. 문제 상황 (Problem Context)
* **발생 일시:** YYYY.MM.DD
* **환경:** (예: Local, Prod / Spring Boot 3.0)
* **현상:** (예: 회원가입 시 DB Duplicate Error 발생)
* **에러 로그:** `java.sql.SQLIntegrityConstraintViolationException...`

### 2. 원인 분석 (Root Cause Analysis)
* **가설:** 중복된 이메일로 가입 시도 시 예외 처리가 누락됨.
* **검증:** 로그 확인 결과 Unique Index 위반 확인.
* **최종 원인:** Controller에서 `DataIntegrityViolationException` 미처리.

### 3. 해결 방법 (Solution)
* **시도:** `@ExceptionHandler`를 사용하여 전역 예외 처리 적용.
* **결과:** 409 Conflict 상태 코드와 명확한 에러 메시지 반환 성공.

### 4. 배운 점 (Insights)
* 예외 처리는 개별 메서드보다 Global Handler로 관리하는 것이 효율적이다.
