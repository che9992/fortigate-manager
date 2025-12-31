# FortiGate Manager

FortiGate 여러 대를 한 번에 관리할 수 있는 웹 기반 통합 관리 도구입니다.

## 주요 기능

### 🔥 멀티 서버 관리
- 여러 FortiGate 서버를 하나의 대시보드에서 통합 관리
- 서버별 개별 설정 및 전체 서버 일괄 적용 지원
- 서버 상태 실시간 모니터링

### 📍 Address 관리
- FQDN, IPv4/IPv6 Address 생성 및 관리
- Address Group 관리
- MultiSelect UI로 간편한 선택

### 🛡️ Policy 관리
- 보안 정책 생성, 수정, 삭제
- Source/Destination Interface, Address, Service 선택
- 정책 검색 기능
- **MultiSelect 드롭다운으로 직관적인 UI** (타이핑 대신 클릭으로 선택)

### 🌐 도메인 분석기
- Puppeteer 기반 웹사이트 도메인 자동 분석
- 메인 도메인, CDN, API, Analytics 등 자동 분류
- **블랙리스트 필터링** (SNS, 광고 도메인 자동 제외)
- **분석 결과를 Address Group으로 자동 생성**

### 📊 감사 로그
- 모든 변경 사항 자동 기록
- 작업 이력 추적 및 관리
- 서버별, 리소스별 필터링

## 시작하기

### 로컬 개발

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### Vercel 배포

1. GitHub에 저장소 생성 및 푸시:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. [Vercel](https://vercel.com) 접속 및 로그인

3. "New Project" 클릭

4. GitHub 저장소 import

5. 배포 설정:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

6. "Deploy" 클릭

## 사용 방법

### 0. 로그인

애플리케이션에 접속하면 로그인 페이지가 표시됩니다.

**로그인 정보:**
- 이메일: `che9992@edusherpa.kr`
- 비밀번호: `!05240425aa`

로그인하면 세션이 유지되며, 우측 상단에서 언제든지 로그아웃할 수 있습니다.

### 1. 서버 설정

1. 좌측 메뉴에서 "서버 설정" 클릭
2. "서버 추가" 버튼 클릭
3. FortiGate 서버 정보 입력:
   - 서버 이름 (예: FortiGate-01)
   - 호스트 (IP 또는 도메인)
   - API Key (FortiGate에서 생성한 API 토큰)
   - VDOM (선택사항, 기본값: root)
4. "추가" 버튼 클릭

### 2. FortiGate API Key 생성

FortiGate 웹 인터페이스에서:

1. System > Administrators 메뉴 이동
2. "Create New" > "REST API Admin" 선택
3. Administrator 이름 입력
4. Administrator profile 선택 (예: super_admin)
5. Trusted Hosts 설정 (보안을 위해 특정 IP만 허용 권장)
6. "OK" 클릭하면 API Key가 생성됨
7. 생성된 API Key를 복사하여 FortiGate Manager에 입력

### 3. 도메인 분석 및 자동 그룹 생성 (NEW!)

1. "도메인 분석" 메뉴 클릭
2. 분석할 도메인 입력 (예: example.com)
3. 블랙리스트 키워드 설정 (불필요한 도메인 제외)
4. "분석 시작" 클릭
5. 결과에서 필요한 도메인 선택
6. 그룹 이름 입력 후 "그룹 생성" 클릭
7. 선택된 모든 서버에 Address 및 Group 자동 생성

### 4. Address 관리

1. "Address 관리" 메뉴 클릭
2. 적용할 서버 선택 (좌측 패널)
3. "Address 추가" 버튼으로 새 Address 생성
4. Address Group 탭에서 그룹 관리
5. **MultiSelect로 멤버 선택** - 타이핑 대신 클릭

### 5. Policy 관리

1. "Policy 관리" 메뉴 클릭
2. 적용할 서버 선택
3. "Policy 추가" 버튼으로 새 정책 생성
4. **MultiSelect 드롭다운**에서 Interface, Address, Service 선택
5. 정책 검색 기능으로 빠른 필터링

### 6. 감사 로그 확인

1. "감사 로그" 메뉴 클릭
2. 필터를 사용하여 특정 작업/리소스/상태별로 로그 확인
3. 각 작업의 성공/실패 여부 확인

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Web Scraping**: Puppeteer (도메인 분석)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Storage**: File-based JSON (data/)

## 데이터 저장

모든 데이터는 `data/` 디렉토리에 JSON 파일로 저장됩니다:
- `data/servers.json`: FortiGate 서버 설정 (API 키 포함)
- `data/audit-logs.json`: 감사 로그

**⚠️ 주의**: `data/` 디렉토리에는 API 키가 포함되어 있으므로 `.gitignore`에 포함되어 있습니다.

## 보안 고려사항

- FortiGate API 키는 로컬 `data/` 디렉토리에만 저장
- 모든 FortiGate API 요청은 Next.js API Routes를 통한 프록시 패턴 사용
- CORS 문제 해결 및 클라이언트 측 API 키 노출 방지
- 프로덕션 환경에서는 HTTPS 사용 권장
- FortiGate API Key는 최소 권한 원칙에 따라 필요한 권한만 부여
- Trusted Hosts 설정으로 API 접근을 특정 IP로 제한

## 문제 해결

### API 연결 오류

- FortiGate 서버의 IP/도메인이 올바른지 확인
- API Key가 유효한지 확인
- FortiGate 방화벽에서 API 접근이 허용되어 있는지 확인
- CORS 설정 확인 (FortiGate에서 허용 필요)

### 변경사항이 적용되지 않음

- 감사 로그에서 오류 메시지 확인
- 각 서버별 적용 결과 확인
- FortiGate 웹 인터페이스에서 직접 확인

## 라이선스

MIT

## 기여

이슈와 Pull Request를 환영합니다!
