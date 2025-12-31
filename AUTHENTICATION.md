# 인증 시스템 가이드

FortiGate Manager는 안전한 로그인 시스템으로 보호됩니다.

## 🔐 로그인 정보

**이메일:** `che9992@edusherpa.kr`
**비밀번호:** `!05240425aa`

## 📋 인증 기능

### 1. 로그인
- 애플리케이션 접속 시 자동으로 로그인 페이지 표시
- 이메일과 비밀번호 입력
- 로그인 성공 시 세션 유지 (localStorage 사용)
- 브라우저를 닫았다 열어도 로그인 상태 유지

### 2. 로그아웃
- 우측 상단 사용자 정보 영역에 로그아웃 버튼
- 클릭하면 즉시 로그아웃 및 로그인 페이지로 이동
- 모든 인증 정보 삭제

### 3. 세션 관리
- 로그인 상태는 localStorage에 안전하게 저장
- 페이지 새로고침 시에도 로그인 유지
- 로그아웃하면 모든 인증 정보 삭제

### 4. 감사 로그 추적
- 모든 작업에 사용자 이메일 자동 기록
- 감사 로그에서 누가 무엇을 했는지 추적 가능

## 🔒 보안 고려사항

### 현재 구현
- ✅ 로그인 인증 필수
- ✅ 세션 유지 (localStorage)
- ✅ 사용자별 작업 추적
- ✅ Brute force 방지 (0.5초 지연)

### 권장사항
- 공용 컴퓨터에서는 사용 후 반드시 로그아웃
- 비밀번호 주기적 변경 권장
- HTTPS 환경에서만 사용 (Vercel은 자동 제공)

## 🛠️ 비밀번호 변경 방법

비밀번호를 변경하려면 코드를 수정해야 합니다:

### 1. [lib/auth.ts](lib/auth.ts) 파일 열기

### 2. VALID_CREDENTIALS 수정

```typescript
const VALID_CREDENTIALS = {
  email: 'che9992@edusherpa.kr',  // 이메일 변경
  password: '새로운비밀번호',      // 비밀번호 변경
};
```

### 3. 변경사항 저장 및 재배포

```bash
# 로컬 테스트
npm run dev

# Vercel 재배포
git add .
git commit -m "Update credentials"
git push
```

## 🔧 추가 사용자 등록

현재는 단일 사용자만 지원합니다. 여러 사용자를 지원하려면:

### 방법 1: 간단한 배열 방식

```typescript
const VALID_USERS = [
  { email: 'user1@example.com', password: 'password1' },
  { email: 'user2@example.com', password: 'password2' },
];

login: (email: string, password: string) => {
  const user = VALID_USERS.find(
    u => u.email === email && u.password === password
  );
  if (user) {
    set({ isAuthenticated: true, user: email });
    saveAuthToStorage(true, email);
    return true;
  }
  return false;
},
```

### 방법 2: 백엔드 API 사용 (권장)

프로덕션 환경에서는 다음을 권장합니다:
- Next.js API Routes 사용
- 데이터베이스에 사용자 정보 저장
- bcrypt로 비밀번호 해싱
- JWT 토큰 사용
- 역할 기반 접근 제어 (RBAC)

## 📱 UI 컴포넌트

### LoginForm
- [components/LoginForm.tsx](components/LoginForm.tsx)
- 이메일/비밀번호 입력 폼
- 에러 메시지 표시
- 로딩 상태 처리

### AuthGuard
- [components/AuthGuard.tsx](components/AuthGuard.tsx)
- 모든 페이지를 감싸는 인증 검사
- 비인증 사용자는 자동으로 로그인 페이지로 리디렉션
- 로그인된 사용자 정보 및 로그아웃 버튼 표시

## 🧪 테스트

### 로그인 테스트
1. 브라우저 시크릿 모드로 접속
2. 잘못된 비밀번호 입력 → 에러 메시지 확인
3. 올바른 정보 입력 → 대시보드 접근 확인

### 세션 유지 테스트
1. 로그인 후 페이지 새로고침 → 로그인 유지 확인
2. 브라우저 닫았다 열기 → 로그인 유지 확인
3. 로그아웃 클릭 → 로그인 페이지로 이동 확인

### 감사 로그 테스트
1. 로그인 후 Address 생성
2. 감사 로그 페이지 확인
3. 사용자 이메일이 기록되었는지 확인

## 🚨 문제 해결

### 로그인이 안 됨
- 이메일과 비밀번호를 정확히 입력했는지 확인
- 대소문자 구분 확인
- 브라우저 콘솔에서 에러 확인

### 로그인 상태가 유지되지 않음
- 브라우저 localStorage가 활성화되어 있는지 확인
- 시크릿/프라이빗 모드에서는 localStorage가 제한될 수 있음
- 브라우저 개발자 도구 → Application → Local Storage 확인

### 로그아웃이 안 됨
- 페이지 새로고침
- 브라우저 캐시 삭제
- localStorage 수동 삭제:
  ```javascript
  localStorage.removeItem('fortigate_auth')
  ```

## 📚 관련 파일

- [lib/auth.ts](lib/auth.ts) - 인증 로직
- [components/LoginForm.tsx](components/LoginForm.tsx) - 로그인 폼
- [components/AuthGuard.tsx](components/AuthGuard.tsx) - 인증 가드
- [app/layout.tsx](app/layout.tsx) - AuthGuard 적용
- [lib/storage.ts](lib/storage.ts) - 사용자 추적 로직

## 🔮 향후 개선 계획

- [ ] 비밀번호 찾기 기능
- [ ] 이메일 인증
- [ ] 2단계 인증 (2FA)
- [ ] 역할 기반 접근 제어
- [ ] 세션 타임아웃
- [ ] 로그인 기록 추적
- [ ] IP 기반 접근 제어

---

**보안 알림:** 이 인증 시스템은 기본적인 접근 제어를 제공합니다. 프로덕션 환경에서는 더 강력한 보안 조치를 구현하는 것을 권장합니다.
