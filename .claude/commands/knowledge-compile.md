# /knowledge-compile

Locanara가 의존하는 핵심 기술들의 최신 업데이트를 수집하고 정리합니다.

## Usage

```text
/knowledge-compile
/knowledge-compile llama.cpp
/knowledge-compile apple-intelligence
/knowledge-compile gemini-nano
/knowledge-compile chrome-built-in-ai
/knowledge-compile all
```

## Instructions

이 커맨드가 실행되면 다음을 수행합니다:

### 1. 대상 기술 확인

인자가 없거나 `all`이면 4개 모두 조사합니다. 특정 기술명이 주어지면 해당 기술만 조사합니다.

| 키워드 | 기술 | Locanara 연관 |
|--------|------|---------------|
| `llama.cpp` | llama.cpp (GGUF inference) | iOS Engine Layer - LlamaCppEngine |
| `apple-intelligence` | Apple Intelligence / Foundation Models | iOS Platform Layer - FoundationLanguageModel |
| `gemini-nano` | Gemini Nano / ML Kit GenAI / Prompt API | Android Platform Layer - PromptApiModel |
| `chrome-built-in-ai` | Chrome Built-in AI (Prompt API) | Web SDK - @locanara/web |

### 2. 정보 수집

각 기술에 대해 **WebSearch**와 **WebFetch**를 사용하여 최신 정보를 수집합니다. 반드시 병렬로 수집하세요.

#### 2.1 llama.cpp

검색 및 확인할 소스:

- **GitHub Releases**: `https://github.com/ggml-org/llama.cpp/releases` - 최신 릴리스 버전, 변경사항
- **WebSearch**: `llama.cpp latest release GGUF changes {current_year}` - 최근 주요 변경사항
- **WebSearch**: `llama.cpp new features quantization {current_year}` - 새로운 양자화 방식, 모델 포맷 변경

수집할 정보:
- 최신 릴리스 버전 및 날짜
- 주요 변경사항 (breaking changes, 새 기능, 성능 개선)
- 새로운 GGUF 포맷 변경사항
- 새로운 양자화 방식 (Q4_K_M, IQ 등)
- 지원 모델 업데이트 (Gemma, Llama, Phi, Qwen 등)
- Metal/CoreML 관련 변경사항 (iOS 성능에 영향)
- API 변경사항 (LocalLLMClient에 영향)

#### 2.2 Apple Intelligence / Foundation Models

검색 및 확인할 소스:

- **WebSearch**: `Apple Intelligence Foundation Models framework updates {current_year}` - 프레임워크 업데이트
- **WebSearch**: `Apple WWDC Foundation Models API changes {current_year}` - WWDC 발표 내용
- **WebSearch**: `site:developer.apple.com Foundation Models` - 공식 문서 변경
- **WebFetch**: `https://developer.apple.com/documentation/foundationmodels` - API 변경사항 확인

수집할 정보:
- Foundation Models 프레임워크 최신 버전
- 새로운 API (SystemLanguageModel 변경, @Generable 업데이트 등)
- 지원 기기/OS 버전 변경
- 새로운 기능 (multimodal, tool use 등)
- 성능 개선 사항
- Deprecation 알림
- Xcode 버전 요구사항 변경

#### 2.3 Gemini Nano / ML Kit GenAI

검색 및 확인할 소스:

- **WebSearch**: `Gemini Nano ML Kit GenAI Prompt API Android updates {current_year}` - SDK 업데이트
- **WebSearch**: `Google AI Edge Gemini Nano on-device {current_year}` - Google AI Edge 업데이트
- **WebSearch**: `site:developer.android.com ML Kit GenAI` - 공식 문서
- **WebFetch**: `https://developer.android.com/ai/aicore` - AICore 문서 변경

수집할 정보:
- ML Kit GenAI SDK 최신 버전
- Prompt API 변경사항
- 지원 기기 확대 (Samsung, Pixel 등)
- 새로운 기능 (image understanding, function calling 등)
- Android 버전 요구사항 변경
- ExecuTorch 관련 업데이트
- Gemini Nano 모델 버전 업데이트

#### 2.4 Chrome Built-in AI

검색 및 확인할 소스:

- **WebSearch**: `Chrome Built-in AI Prompt API origin trial {current_year}` - API 상태
- **WebSearch**: `Chrome AI APIs window.ai Gemini Nano web {current_year}` - Web AI 업데이트
- **WebFetch**: `https://developer.chrome.com/docs/ai/built-in` - 공식 문서

수집할 정보:
- Prompt API 상태 (Origin Trial / Stable)
- API 변경사항 (window.ai → ai.languageModel 등)
- 지원 Chrome 버전
- 새로운 API (Summarizer, Writer, Rewriter 등)
- 모델 업데이트 (Gemini Nano 버전)
- Cross-browser 지원 현황

### 3. 영향도 분석

수집한 정보를 Locanara 코드베이스와 대조하여 영향도를 분석합니다.

확인할 파일:
- `packages/apple/Sources/Engine/` - llama.cpp 엔진 관련
- `packages/apple/Sources/Platform/` - Apple Intelligence 관련
- `packages/android/locanara/src/main/kotlin/com/locanara/platform/` - Gemini Nano 관련
- `packages/web/src/` - Chrome Built-in AI 관련 (존재하는 경우)
- `Package.swift` - iOS 의존성 버전
- `packages/android/locanara/build.gradle.kts` - Android 의존성 버전

영향도 레벨:
- **🔴 Breaking**: API 변경으로 코드 수정 필수
- **🟡 Action Needed**: 새 기능 추가 또는 deprecation 대응 필요
- **🟢 Info**: 참고 정보 (성능 개선, 새 모델 지원 등)

### 4. 리포트 작성

수집한 정보를 `.claude/knowledge/` 디렉토리에 저장합니다.

#### 4.1 개별 리포트 파일

```text
.claude/knowledge/
├── llama-cpp.md
├── apple-intelligence.md
├── gemini-nano.md
├── chrome-built-in-ai.md
└── DIGEST.md          # 종합 요약
```

#### 4.2 DIGEST.md 포맷

```markdown
# Knowledge Digest

> Last compiled: {date}

## Summary

| Technology | Latest Version | Impact | Action Items |
|------------|---------------|--------|--------------|
| llama.cpp | vBXXXX | 🟢/🟡/🔴 | ... |
| Apple Intelligence | iOS XX | 🟢/🟡/🔴 | ... |
| Gemini Nano | ML Kit X.X | 🟢/🟡/🔴 | ... |
| Chrome Built-in AI | Chrome XXX | 🟢/🟡/🔴 | ... |

## Action Items

### 🔴 Breaking Changes
- (해당 시 목록)

### 🟡 Recommended Actions
- (해당 시 목록)

### 🟢 Notable Updates
- (해당 시 목록)

## Details
(각 기술별 상세 내용 링크)
```

#### 4.3 개별 기술 파일 포맷

```markdown
# {Technology Name} - Knowledge Update

> Last updated: {date}

## Current Status
- Version: ...
- Locanara integration: ...

## Recent Changes
### {version/date}
- Change 1
- Change 2

## Impact on Locanara
- 영향받는 파일: ...
- 필요한 조치: ...

## Sources
- [Source 1](url)
- [Source 2](url)
```

### 5. 최종 출력

사용자에게 다음을 보고합니다:

1. **요약 테이블** - 각 기술의 최신 상태와 영향도
2. **액션 아이템** - Locanara에서 대응이 필요한 사항 (우선순위순)
3. **저장 위치** - `.claude/knowledge/DIGEST.md` 경로 안내
4. **추천 액션** - 필요한 경우 `/apple`, `/android` 등 후속 커맨드 추천

## Key Principles

1. **병렬 수집**: 4개 기술의 정보를 동시에 수집하여 시간 절약
2. **코드 대조**: 단순 뉴스가 아닌, Locanara 코드베이스 기준 영향도 분석
3. **실행 가능한 정보**: "이런 변경이 있다"가 아니라 "이 파일을 이렇게 수정해야 한다" 수준으로
4. **누적 기록**: 이전 DIGEST.md와 비교하여 변경사항만 하이라이트
5. **소스 명시**: 모든 정보에 출처 URL 포함
