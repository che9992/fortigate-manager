# FortiGate Manager - 프로젝트 요약

## 📌 프로젝트 개요

3개의 FortiGate 서버를 한 번에 관리할 수 있는 웹 기반 통합 관리 도구입니다.

**위치**: `C:\Users\che99\fortigate-manager`

## ✅ 구현된 기능

### 1. 서버 관리
- ✅ 여러 FortiGate 서버 등록 및 관리
- ✅ 서버별 활성화/비활성화
- ✅ API Key 안전 저장 (localStorage)
- ✅ VDOM 지원

### 2. Address 관리
- ✅ Address 생성/수정/삭제
- ✅ Address Group 생성/수정/삭제
- ✅ 다양한 Address 타입 지원:
  - IP/Netmask
  - IP Range
  - FQDN
- ✅ 선택한 모든 서버에 동시 적용
- ✅ 탭 기반 UI (Addresses / Groups)

### 3. Policy 관리
- ✅ 방화벽 정책 생성/수정/삭제
- ✅ Source/Destination Interface 설정
- ✅ Source/Destination Address 설정
- ✅ Service 설정
- ✅ Action (Accept/Deny) 설정
- ✅ 로그 설정
- ✅ 정책 활성화/비활성화
- ✅ 선택한 모든 서버에 동시 적용

### 4. 감사 로그
- ✅ 모든 변경사항 자동 기록
- ✅ 타임스탬프 기록
- ✅ 서버별 성공/실패 상태
- ✅ 필터 기능:
  - 작업 유형 (생성/수정/삭제/동기화)
  - 리소스 타입 (Address/Group/Policy)
  - 상태 (성공/부분 성공/실패)
- ✅ 통계 대시보드 (성공/실패 건수)
- ✅ 최대 1000개 로그 보관

### 5. 대시보드
- ✅ 서버 상태 모니터링
- ✅ 온라인/오프라인 상태 표시
- ✅ FortiGate 버전 정보 표시
- ✅ 총 Address/Group/Policy 개수 표시
- ✅ 통계 카드 UI

### 6. 서버 선택 시스템
- ✅ 작업 전 서버 선택
- ✅ 전체 선택/선택 해제
- ✅ 선택된 서버 개수 표시
- ✅ 비활성 서버 자동 제외

### 7. UI/UX
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ Tailwind CSS 기반 현대적 UI
- ✅ 한글 인터페이스
- ✅ 로딩 상태 표시
- ✅ 에러 처리
- ✅ 성공/실패 피드백

## 🏗️ 기술 스택

### Frontend
- **Next.js 14**: React 프레임워크
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Zustand**: 상태 관리
- **Lucide React**: 아이콘

### Backend/API
- **Axios**: HTTP 클라이언트
- **FortiGate REST API**: 방화벽 관리

### Deployment
- **Vercel**: 호스팅 플랫폼
- **Git**: 버전 관리

## 📁 프로젝트 구조

```
fortigate-manager/
├── app/                          # Next.js 페이지
│   ├── page.tsx                 # 대시보드
│   ├── addresses/page.tsx       # Address 관리
│   ├── policies/page.tsx        # Policy 관리
│   ├── logs/page.tsx            # 감사 로그
│   ├── servers/page.tsx         # 서버 설정
│   ├── layout.tsx               # 레이아웃
│   └── globals.css              # 글로벌 스타일
├── components/                   # React 컴포넌트
│   ├── Navigation.tsx           # 네비게이션 바
│   └── ServerSelector.tsx       # 서버 선택 UI
├── lib/                         # 유틸리티 라이브러리
│   ├── fortigate-client.ts     # FortiGate API 클라이언트
│   ├── storage.ts              # localStorage 관리
│   └── store.ts                # Zustand 스토어
├── types/                       # TypeScript 타입 정의
│   └── index.ts                # 모든 타입 정의
├── README.md                    # 메인 문서
├── DEPLOYMENT.md                # 배포 가이드
├── QUICKSTART.md                # 빠른 시작 가이드
└── package.json                 # 프로젝트 설정
```

## 🔑 핵심 파일 설명

### FortiGate API 클라이언트 ([lib/fortigate-client.ts](lib/fortigate-client.ts))
- FortiGate REST API와 통신
- Address, Group, Policy CRUD 작업
- 시스템 상태 조회
- 에러 처리

### 스토리지 관리 ([lib/storage.ts](lib/storage.ts))
- localStorage를 통한 데이터 저장
- 서버 정보 관리
- 감사 로그 저장 (최대 1000개)

### 상태 관리 ([lib/store.ts](lib/store.ts))
- Zustand를 사용한 글로벌 상태
- 서버 목록 관리
- 선택된 서버 추적

## 🚀 실행 방법

### 로컬 실행
```bash
cd fortigate-manager
npm run dev
# http://localhost:3000
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

### Vercel 배포
```bash
# GitHub에 푸시
git push

# 또는 Vercel CLI 사용
vercel --prod
```

## 📊 데이터 흐름

1. **사용자 입력** → UI 폼
2. **서버 선택** → ServerSelector 컴포넌트
3. **API 호출** → FortigateClient
4. **병렬 처리** → 선택된 모든 서버에 동시 요청
5. **결과 수집** → 성공/실패 집계
6. **로그 기록** → 감사 로그에 저장
7. **사용자 피드백** → Alert 또는 UI 업데이트

## 🔐 보안 고려사항

### 구현됨
- ✅ API Key를 localStorage에 저장
- ✅ HTTPS 지원 (Vercel 자동 제공)
- ✅ 자체 서명 인증서 허용 (FortiGate용)
- ✅ API Key 마스킹 UI (보기/숨기기)

### 권장사항
- FortiGate에서 Trusted Hosts 설정
- API Admin에 최소 권한만 부여
- 공용 PC에서 사용 후 서버 정보 삭제
- 프로덕션에서는 환경 변수 사용 고려

## 📈 향후 개선 가능 사항

### 단기
- [ ] Service Object 관리 페이지
- [ ] Schedule 관리
- [ ] Interface 관리
- [ ] Diff 비교 (서버 간 설정 차이)

### 중기
- [ ] 백엔드 API (CORS 문제 해결)
- [ ] 사용자 인증/인가
- [ ] 역할 기반 접근 제어 (RBAC)
- [ ] 변경사항 승인 워크플로우

### 장기
- [ ] 설정 템플릿 시스템
- [ ] 대량 작업 스케줄링
- [ ] 실시간 알림
- [ ] 고급 리포팅
- [ ] 변경사항 롤백 기능

## 🎯 사용 시나리오

### 시나리오 1: 새 서버 네트워크 추가
1. Address 관리 → 3개 서버 선택
2. NEW-SERVER-NET (192.168.20.0/24) 추가
3. 모든 서버에 동시 생성 완료

### 시나리오 2: 정책 일괄 적용
1. Policy 관리 → 3개 서버 선택
2. Allow-Web-Traffic 정책 생성
3. 모든 서버에 동일한 ID로 생성

### 시나리오 3: 변경 이력 감사
1. 감사 로그 접속
2. 날짜/작업 필터링
3. 특정 변경사항의 성공/실패 확인

## 📝 라이선스

MIT License

## 🙏 감사의 글

- FortiGate REST API 문서
- Next.js 팀
- Vercel 플랫폼
- 오픈소스 커뮤니티

---

**프로젝트 생성일**: 2025-12-31
**개발 환경**: Windows 11, Node.js
**배포 준비**: ✅ 완료
