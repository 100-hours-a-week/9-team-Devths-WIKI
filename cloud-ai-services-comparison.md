# 클라우드 AI 서비스 비교 (2026)

> Devths 프로젝트 참고용: 각 클라우드 제공업체의 AI 기능 상세 비교

---

## 📋 목차
1. [프로젝트 기능별 클라우드 매칭](#프로젝트-기능별-클라우드-매칭)
2. [AWS AI 서비스](#aws-ai-서비스)
3. [GCP AI 서비스](#gcp-ai-서비스)
4. [Azure AI 서비스](#azure-ai-서비스)
5. [네이버 클라우드 AI 서비스](#네이버-클라우드-ai-서비스)
6. [종합 비교표](#종합-비교표)

---

## 📋 프로젝트 기능별 클라우드 AI 매칭

### Devths 프로젝트 주요 기능 매칭

현재 프로젝트: **이력서 분석, 모의 면접, 캘린더 에이전트** (FastAPI + Gemini 1.5 + LangGraph + ChromaDB)

| 프로젝트 기능 | GCP (현재) | AWS 추천 | Azure 추천 | 네이버 클라우드 추천 |
|------------|-----------|----------|------------|-------------------|
| **이력서 분석/매칭** | Gemini 1.5 | Bedrock (Claude) | Azure OpenAI (GPT-4o) | HyperCLOVA X |
| **OCR / PII 마스킹** | Gemini Vision | Textract | Form Recognizer | CLOVA OCR |
| **모의 면접 (LangGraph)** | Vertex AI | Bedrock + Step Functions | Azure OpenAI | CLOVA Studio |
| **캘린더 에이전트** | Gemini Tool Calling | Bedrock Agents | OpenAI Functions | HyperCLOVA X Skill |
| **VectorDB (RAG)** | ChromaDB (Self) | OpenSearch | AI Search | Search Engine |

---

## 📋 **1. AWS (Amazon Web Services)**

### 🧠 머신러닝 & AI 플랫폼
- **Amazon SageMaker**: ML 모델 구축/학습/배포 전체 워크플로우 (AutoML, MLOps 포함)
- **Amazon Bedrock**: 생성형 AI 애플리케이션 & 파운데이션 모델(FM) 서비스
  - Claude 3.5, Llama 3 등 다양한 LLM 선택 가능
  - Reinforcement Fine Tuning (RFT) 지원
- **Amazon Q**: 비즈니스용 AI 챗봇/비서

### 📊 AI 서비스 (API 형태)
- **Amazon Rekognition** – 이미지/비디오 분석 & 얼굴/객체/텍스트 인식
- **Amazon Comprehend** – NLP 기반 감정/의미 분석, 엔티티 추출
- **Amazon Lex** – 자연어 기반 챗봇 빌드 API
- **Amazon Polly** – 텍스트 → 자연 음성(TTS) 변환
- **Amazon Transcribe** – 음성 → 텍스트(STT) API
- **Amazon Translate** – 기계 번역 API
- **Amazon Textract** – OCR & 문서 데이터 추출

#### 📈 데이터 분석/추천/예측 특화
- **Amazon Personalize** – 추천 시스템 API
- **Amazon Forecast** – 시계열 기반 예측 API
- **Amazon Lookout 시리즈** – 이상 탐지/품질 분석

#### 핵심 특징
광범위한 AI API + MLOps 플랫폼을 제공하며, 생태계 통합이 매우 강력함. 생성형 AI부터 전통적 ML까지 폭넓게 커버됨.

---

## 🌐 2. GCP (Google Cloud Platform)

### 🧠 통합 AI/ML 플랫폼
- **Vertex AI**: 통합 AI/ML 플랫폼 (학습 → 튜닝 → 배포 → MLOps)

### 🤖 생성형 AI & 모델
- **Gemini API / Vertex AI Studio**: 생성형 AI (텍스트/이미지/멀티모달) 및 실험/프로토타이핑 도구
- **Vertex AI Agent Builder & Agent Garden**: AI 에이전트/멀티 에이전트 구축 툴
- **Vertex AI Model Garden**: 다양한 사전학습/서드파티/오픈 모델 카탈로그

### 🧪 AI API
- **Natural Language AI**: 텍스트 분석/감정/구조화 등의 NLP API
- **Speech-to-Text / Text-to-Speech**: 음성 인식/생성 API
- **Translation AI**: 자동 번역 API
- **BigQuery ML**: SQL 기반 ML/AI 모델 구축 & 실행
- **Vertex AI Search**: AI 기반 검색 경험 구축 툴

**핵심 특징**
Google의 데이터 분석 및 ML 워크플로우 통합에 초점. AutoML, BigQuery와 강한 연계를 통해 AI 분석 및 예측에 강함.

---

## 🌐 3. Azure (Microsoft Azure)

### 🧠 AI/ML 통합 플랫폼
- **Azure Machine Learning** – ML 파이프라인, 모델 학습/배포/모니터링, MLOps 지원

### 🤖 생성형 AI & API
- **Azure OpenAI Service** – GPT 계열 모델을 기업 환경에 안전하게 제공
- **Cognitive Services** – 머신러닝 기반 API 카테고리
  - Vision / Computer Vision – 이미지/비디오 분석
  - Speech Services – 음성 인식 및 TTS
  - Language Services – 텍스트 분석, 번역, Q&A
  - Form Recognizer – 문서 데이터 추출

### 🧠 분석/ML 보조
- **Power BI + AI** – 데이터 분석/시각화 + AI 통합 대시보드 지원

**핵심 특징**
엔터프라이즈 중심의 AI/ML 솔루션이 강점이며 MS 제품군과의 통합이 훌륭함. 특히 Azure OpenAI Service 통한 GPT 지원도 주요 기능.

---

## 🌐 4. 네이버 클라우드 (Naver Cloud Platform, NCP)

### 🤖 AI 서비스 (CLOVA 기반)
네이버의 AI 기술을 서비스형으로 제공하는 AI API/서비스 모음

- **AiTEMS** – 개인화 추천 시스템
- **CLOVA AiCall** – AI 기반 고객센터 콜봇 시스템
- **CLOVA Chatbot** – 챗봇 생성/서비스 API
- **CLOVA Dubbing** – 텍스트 음성/음성 합성 + 비디오 합성
- **CLOVA OCR** – 이미지/문서 OCR API
- **CLOVA Speech** – 음성 → 텍스트 변환
- **CLOVA Voice** – 고품질 음성 생성 API
- **CLOVA Studio** – AI 앱/서비스 개발 플랫폼 (비즈니스용 도구)

**핵심 특징**
한국에서 접근성과 로컬 언어지원이 강점, Papago/Clova 기술 기반 AI 서비스 API 제공.

---

## 🧠 비교 요약표

| 영역 | AWS | GCP | Azure | 네이버 클라우드 |
|------|-----|-----|-------|----------------|
| **생성형 AI** | Bedrock, Amazon Q | Gemini/Studio | Azure OpenAI | CLOVA 기반 챗봇/API |
| **ML 플랫폼** | SageMaker | Vertex AI | Azure ML | 제한적 (비즈니스용) |
| **Vision API** | Rekognition | Vision API | Computer Vision | CLOVA OCR |
| **Speech (STT/TTS)** | Transcribe/Polly | Speech APIs | Speech Services | CLOVA Speech/Voice |
| **NLP/Text** | Comprehend | Language API | Language Services | CLOVA Chatbot |
| **데이터 분석** | Forecast/Personalize | BigQuery ML | Power BI + AI | AiTEMS 추천 |

---

## 💡 Devths 프로젝트 적용 가이드

### 현재 구조 (AI Wiki 기반)
- **LLM**: Gemini 1.5 (GCP Vertex AI)
- **Framework**: FastAPI + LangChain + LangGraph
- **VectorDB**: ChromaDB (Self-hosted)
- **OCR**: PaddleOCR / Gemini Vision
- **캐시**: Redis
- **인프라**: EC2 → Docker → K8s (계획)

### 프로젝트 기능별 클라우드 매칭

| 기능 | GCP (현재) | AWS 추천 | Azure 추천 | 네이버 클라우드 추천 |
|------|-----------|---------|-----------|---------------------|
| **이력서 분석/매칭** | Gemini 1.5 | Bedrock (Claude) | Azure OpenAI (GPT) | HyperCLOVA X |
| **OCR / PII 마스킹** | Gemini Vision | Textract | Form Recognizer | CLOVA OCR |
| **모의 면접** | Vertex AI | Bedrock + Step Functions | Azure OpenAI | CLOVA Studio |
| **캘린더 에이전트** | Gemini Tool Calling | Bedrock Agents | OpenAI Functions | HyperCLOVA X Skill |
| **VectorDB (RAG)** | ChromaDB (Self) | OpenSearch | AI Search | Search Engine |
| **음성 면접 (향후)** | Speech-to-Text | Transcribe | Speech Services | CLOVA Speech ⭐ |

---

## 📌 전략적 제안

### ✅ 현재 상태 유지 (GCP 중심)
- Gemini API 이미 사용 중
- Vertex AI 생태계로 통합 가능
- GKE로 K8s 마이그레이션 용이

### 🔄 하이브리드 전략
**ADR 011 (V3 서버리스 전환) 고려 시:**
- **AWS Lambda + Bedrock**: 호출량 많은 기능 → 비용 효율
- **네이버 클라우드 부분 도입**: 한국어 특화 기능 (OCR, 면접 말투)
- **독립적 FastAPI 구조 유지**: 클라우드 종속 최소화

### 🇰🇷 한국어 특화 필요 시
- **네이버 클라우드 우선 고려**
- CLOVA OCR: 한국어 이력서/주민번호 처리
- HyperCLOVA X: 한국 기업 면접 맥락 이해

---

## 📚 참고 자료

### Gemini 제공 정보
- GCP Vertex AI 통합성 강조
- 프로젝트 ADR과 연계한 실용적 매칭

### ChatGPT 제공 정보
- 카테고리별 체계적 AI 서비스 분류
- 각 클라우드 핵심 특징 요약

### 추가 검증 자료
- [AWS AI/ML Landscape 2026](https://dev.to/aws-builders/the-aws-aiml-landscape-in-2026-simplified-17i3)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs/start/introduction-unified-platform?hl=ko)
- [Azure OpenAI Service](https://learn.microsoft.com/ko-kr/azure/ai-services/openai/overview)
- [CLOVA Studio](https://www.ncloud.com/v2/product/aiService/clovaStudio)

---

**작성일**: 2026-01-11
**기반 프로젝트**: [Devths AI Wiki](https://github.com/100-hours-a-week/9-team-Devths-WIKI/wiki/AI-Wiki)
```

로컬에 파일이 생성되었습니다. 이 문서는:

1. **Gemini 정보** - 프로젝트 ADR 기반 실용적 매칭
2. **ChatGPT 정보** - 체계적인 서비스 분류와 비교표
3. **제 검증 정보** - 2026년 최신 클라우드 AI 기능

이 세 가지를 모두 통합하여 Devths 프로젝트에 맞게 정리했습니다.

파일 내용을 확인하시고, 수정이 필요하거나 추가하고 싶은 내용이 있으면 말씀해주세요!