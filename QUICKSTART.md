# FortiGate Manager 빠른 시작 가이드

## 🚀 로컬에서 바로 실행하기

프로젝트가 이미 설치되어 있으므로 바로 실행할 수 있습니다:

```bash
cd fortigate-manager
npm run dev
```

브라우저에서 http://localhost:3000 접속

**로그인 정보:**
- 이메일: `che9992@edusherpa.kr`
- 비밀번호: `!05240425aa`

## 📦 Vercel에 바로 배포하기

### 단계 1: GitHub 저장소 생성 및 푸시

1. GitHub에서 새 저장소 생성 (예: fortigate-manager)

2. 터미널에서 실행:
```bash
cd fortigate-manager

# GitHub 저장소 연결 (YOUR-USERNAME과 YOUR-REPO를 본인 것으로 변경)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# 푸시
git push -u origin master
```

### 단계 2: Vercel 배포

1. https://vercel.com 접속 후 GitHub 계정으로 로그인

2. "Add New..." → "Project" 클릭

3. GitHub 저장소 선택 및 Import

4. "Deploy" 클릭

**완료!** 2-3분 후 자동으로 URL이 생성됩니다.

## 🔧 FortiGate 설정

### API Key 생성 (FortiGate에서)

1. FortiGate 웹 인터페이스 로그인
2. **System** → **Administrators** 이동
3. **Create New** → **REST API Admin** 선택
4. 설정:
   - Username: 원하는 이름 (예: api_admin)
   - Administrator profile: **super_admin** 선택
   - Trusted Hosts: Vercel 또는 로컬 IP 추가 (보안을 위해)
   - PKI Group: 그대로 두기
5. **OK** 클릭
6. 생성된 **API Key 복사** (다시 볼 수 없으니 안전한 곳에 저장)

### FortiGate Manager에 서버 추가

1. 웹 앱에서 **서버 설정** 메뉴 클릭
2. **서버 추가** 버튼 클릭
3. 정보 입력:
   - 서버 이름: FortiGate-01
   - 호스트: FortiGate IP 주소 (예: 192.168.1.1)
   - API Key: 위에서 복사한 키
   - VDOM: root (기본값)
   - 서버 활성화: 체크
4. **추가** 클릭

## 📋 주요 기능 사용법

### 1️⃣ Address 추가 (3개 서버에 동시 적용)

1. **Address 관리** 메뉴
2. 좌측에서 적용할 서버 선택 (3개 모두 선택)
3. **Address 추가** 클릭
4. 정보 입력:
   - 이름: SERVER-NET
   - 타입: IP/Netmask
   - Subnet: 192.168.10.0/24
5. **추가** 클릭 → 선택한 모든 서버에 동시 생성!

### 2️⃣ Address Group 생성

1. **Address Groups** 탭 클릭
2. **Address Group 추가** 클릭
3. 정보 입력:
   - 그룹 이름: INTERNAL-NETWORKS
   - 멤버: SERVER-NET, DMZ-NET (콤마로 구분)
4. **추가** 클릭

### 3️⃣ Policy 생성 (3개 서버에 동시 적용)

1. **Policy 관리** 메뉴
2. 서버 선택
3. **Policy 추가** 클릭
4. 정보 입력:
   - Policy 이름: Allow-Internal-to-Internet
   - Source Interface: internal
   - Destination Interface: wan1
   - Source Address: INTERNAL-NETWORKS
   - Destination Address: all
   - Service: ALL
   - Action: Accept
5. **추가** 클릭 → 모든 서버에 동일한 정책 생성!

### 4️⃣ 변경 이력 확인

1. **감사 로그** 메뉴
2. 모든 작업 기록 확인
3. 필터로 특정 작업만 보기:
   - 작업 유형 (생성/수정/삭제)
   - 리소스 타입 (Address/Policy 등)
   - 성공/실패 상태

## 💡 유용한 팁

### 서버 선택
- **전체 선택**: 모든 서버에 동시 적용
- **개별 선택**: 특정 서버에만 적용
- 비활성화된 서버는 자동으로 제외됨

### 에러 처리
- 일부 서버만 성공해도 OK
- 감사 로그에서 각 서버별 결과 확인
- 실패한 서버는 수동으로 재시도 가능

### 대시보드
- 서버 상태 실시간 확인
- 총 Address, Group, Policy 개수 표시
- 서버 버전 정보 표시

## 🔒 보안 주의사항

1. **API Key 보호**
   - API Key는 브라우저 localStorage에 저장됨
   - 공용 컴퓨터에서는 사용 후 서버 삭제 권장

2. **FortiGate 설정**
   - API Admin의 Trusted Hosts 반드시 설정
   - 최소 권한 원칙 적용 (필요한 권한만 부여)

3. **네트워크**
   - HTTPS 사용 권장 (Vercel은 자동 제공)
   - FortiGate 관리 인터페이스는 신뢰할 수 있는 네트워크에서만 접근

## 🐛 문제 해결

### "API 연결 오류"
- FortiGate IP가 맞는지 확인
- API Key가 올바른지 확인
- Trusted Hosts에 접속 IP가 포함되어 있는지 확인

### "CORS 오류"
- FortiGate에서 CORS 허용 필요
- 또는 프록시 서버 사용

### "변경사항이 일부 서버에만 적용됨"
- 감사 로그에서 실패 원인 확인
- 실패한 서버에 해당 리소스가 이미 있는지 확인

## 📞 지원

문제가 발생하면:
1. 감사 로그에서 에러 메시지 확인
2. README.md의 자세한 문서 참고
3. DEPLOYMENT.md의 배포 가이드 참고

## 🎉 완료!

이제 3개의 FortiGate 서버를 한 번에 관리할 수 있습니다!
