# Vercel 배포 가이드

이 문서는 FortiGate Manager를 Vercel에 배포하는 방법을 단계별로 설명합니다.

## 사전 준비

1. [GitHub](https://github.com) 계정
2. [Vercel](https://vercel.com) 계정 (GitHub로 가입 권장)
3. Git 설치

## 배포 단계

### 1. GitHub 저장소 생성

1. GitHub에 로그인
2. 우측 상단 "+" 클릭 → "New repository"
3. Repository 이름 입력 (예: fortigate-manager)
4. Public 또는 Private 선택
5. "Create repository" 클릭

### 2. 코드 푸시

프로젝트 폴더에서 다음 명령어 실행:

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋 생성
git commit -m "Initial commit: FortiGate Manager"

# GitHub 저장소 연결 (YOUR-USERNAME과 YOUR-REPO를 실제 값으로 변경)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 3. Vercel 배포

#### 방법 1: Vercel 웹사이트 사용 (추천)

1. [Vercel](https://vercel.com)에 접속하여 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 import:
   - "Import Git Repository" 섹션에서 저장소 검색
   - 해당 저장소 옆의 "Import" 클릭
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: ./
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)
5. "Deploy" 버튼 클릭
6. 배포 완료를 기다림 (1-3분 소요)

#### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 폴더에서 배포
cd fortigate-manager
vercel

# 프로덕션 배포
vercel --prod
```

### 4. 배포 후 설정

배포가 완료되면 Vercel에서 자동으로 URL을 생성합니다 (예: `https://fortigate-manager.vercel.app`)

#### 커스텀 도메인 설정 (선택사항)

1. Vercel 프로젝트 페이지에서 "Settings" 탭 클릭
2. "Domains" 섹션 클릭
3. 도메인 입력 및 추가
4. DNS 설정 안내에 따라 도메인 제공업체에서 설정

## 환경 변수 (필요시)

현재 이 프로젝트는 환경 변수가 필요하지 않습니다. 모든 설정은 웹 UI를 통해 관리됩니다.

향후 환경 변수가 필요한 경우:

1. Vercel 프로젝트 페이지에서 "Settings" 탭
2. "Environment Variables" 섹션
3. 변수 이름과 값 입력
4. "Save" 클릭
5. 재배포 필요

## 자동 배포 설정

Vercel은 기본적으로 GitHub 저장소의 main 브랜치에 푸시할 때마다 자동으로 재배포됩니다.

### 브랜치별 배포

- `main` 브랜치: 프로덕션 배포
- 다른 브랜치: 프리뷰 배포 (테스트용)

## 업데이트 방법

코드를 수정한 후:

```bash
git add .
git commit -m "Update: 설명"
git push
```

푸시하면 Vercel이 자동으로 새 버전을 배포합니다.

## 문제 해결

### 빌드 실패

1. Vercel 대시보드에서 "Deployments" 탭 확인
2. 실패한 배포 클릭하여 로그 확인
3. 로컬에서 `npm run build` 실행하여 오류 재현

### API 연결 문제

- FortiGate 서버가 Vercel의 IP에서 접근 가능한지 확인
- FortiGate API Key의 Trusted Hosts 설정 확인
- CORS 설정 확인

### CORS 오류

브라우저에서 FortiGate API를 직접 호출하므로 CORS 오류가 발생할 수 있습니다.

**해결 방법**:
1. FortiGate에서 CORS 허용 설정
2. 또는 프록시 서버 사용 (Next.js API Routes 활용)

## 성능 최적화

### 이미지 최적화

Next.js Image 컴포넌트 사용:
```tsx
import Image from 'next/image';
```

### 코드 스플리팅

Next.js가 자동으로 페이지별 코드 스플리팅을 수행합니다.

### 캐싱

Vercel은 자동으로 정적 파일과 API 응답을 캐싱합니다.

## 모니터링

### Vercel Analytics (선택사항)

1. Vercel 프로젝트 페이지에서 "Analytics" 탭
2. "Enable Analytics" 클릭
3. 웹사이트 트래픽 및 성능 모니터링

### 로그 확인

1. Vercel 대시보드에서 "Functions" 탭
2. 실시간 로그 확인

## 보안

### HTTPS

Vercel은 자동으로 모든 배포에 무료 SSL 인증서를 제공합니다.

### 환경 변수 보호

민감한 정보는 절대 코드에 하드코딩하지 말고 환경 변수로 관리하세요.

## 비용

- Vercel Free Tier: 개인 프로젝트에 충분
  - 무제한 배포
  - 100GB 대역폭/월
  - 서버리스 함수 실행 시간 제한

- Pro Tier: 팀 프로젝트용
  - 더 많은 대역폭
  - 더 긴 서버리스 함수 실행 시간

## 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [FortiGate API 문서](https://docs.fortinet.com/document/fortigate/latest/rest-api-reference)
