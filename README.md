# MVP Builder – 원클릭 MVP 생성 플랫폼

비개발자가 개발 지식 없이 1분 안에 DB 연결된 MVP 앱을 만들 수 있는 플랫폼.

## 기술 스택

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **DB/Auth**: Supabase (PostgreSQL + RLS + Auth)
- **Styling**: Tailwind CSS + shadcn/ui 컴포넌트
- **배포**: Vercel

## 빠른 시작

### 1. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase 프로젝트 정보 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
```

### 2. Supabase DB 설정

Supabase 대시보드 > SQL Editor에서 순서대로 실행:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/seed.sql
```

### 3. 관리자 계정 설정

시드 데이터 실행 후 관리자로 지정할 계정의 `role`을 `admin`으로 변경:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### 4. 개발 서버 실행

```bash
npm install
npm run dev
```

## 프로젝트 구조

```
app/
├── (public)/           # 랜딩, 템플릿 갤러리
├── login/, signup/     # 인증 페이지
├── dashboard/          # 프로젝트 목록 + 생성 플로우
├── app/[projectId]/    # 생성된 MVP 앱
├── admin/templates/    # 관리자 전용
└── api/                # REST API

components/
├── ui/                 # shadcn/ui 기반 기본 컴포넌트
├── shared/             # 공통 컴포넌트 (헤더, 폼 등)
└── templates/          # 템플릿별 UI (todo, blog, ...)

lib/
├── supabase/           # client/server/admin 클라이언트
└── templates/          # 템플릿 레지스트리

supabase/
├── migrations/         # DB 스키마 + RLS
└── seed.sql            # 초기 템플릿 데이터
```

## Phase 2 확장 계획

- Supabase Management API로 사용자별 독립 프로젝트 자동 생성
- Terraform으로 인프라 코드화
- 사용자 전용 서브도메인 자동 발급
