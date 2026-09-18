# Project Rules

- 새로운 기능보다 기존 구조를 우선 유지한다.
- 디자인보다 사용자 경험을 우선한다.
- 성경적 세계관을 유지하되 특정 교단 색채는 드러내지 않는다.
- 직업을 단정적으로 추천하지 않는다.
- 하나님의 뜻을 대신 결정하지 않는다.
- 모든 페이지는 상담 신청이라는 하나의 목적을 향해 연결한다.
- 모든 코드 작성 시 SEO, 접근성, 모바일 반응형을 기본으로 한다.

## Public Table RLS Prevention Guardrail

### Scope and default security rule

This guardrail applies to every new or materially recreated table in the `public`
schema of the Supabase/PostgreSQL Production database.

A new `public` table MUST NOT reach Production with Row Level Security (RLS)
disabled unless an explicit, documented, administrator-approved exception exists
before deployment.

Every migration or schema change that creates or materially recreates a `public`
table must explicitly document:

1. whether RLS is enabled;
2. which database roles require direct table access;
3. whether `anon` requires direct access;
4. whether `authenticated` requires direct access;
5. whether `service_role` requires direct access;
6. whether application access is server-side through `postgres` or another
   privileged server role; and
7. whether any RLS policies are actually required.

### Current server-side default

The verified WWW architecture currently uses server-side PostgreSQL access through
`postgres`. Where there is no verified requirement for direct Supabase Data API
access by `anon` or `authenticated`, a new `public` table must default to:

- enable RLS;
- keep FORCE RLS disabled unless it is separately documented and approved;
- create no `anon` policy;
- create no `authenticated` policy;
- revoke direct table privileges from `anon`;
- revoke direct table privileges from `authenticated`; and
- preserve only the explicitly required access for `postgres` or the actual
  privileged server role.

Do not create permissive `anon` or `authenticated` policies merely to silence a
Security Advisor finding.

### Direct client access exception

A future architecture may use direct browser or Supabase Data API access through
`anon` or `authenticated`, but that access must be explicitly designed rather than
enabled implicitly. Before Production deployment, the change must document:

- the exact role requiring access;
- the exact required operations (`SELECT`, `INSERT`, `UPDATE`, and/or `DELETE`);
- the exact row visibility or write rule;
- the minimum RLS policy that implements that rule;
- why server-side access is insufficient; and
- administrator approval.

Broad permissive policies such as unrestricted `USING (true)` or
`WITH CHECK (true)` must not be introduced as a shortcut unless their necessity is
explicitly justified and administrator-approved.

### Privilege minimization

Do not rely on default grants. For every new `public` table, explicitly verify the
effective direct table privileges for at least:

- `anon`;
- `authenticated`;
- `service_role`; and
- `postgres` or the actual application server role.

Grant only the privileges required by the documented access model.

### Security Advisor gate

After a Production schema change creates or materially recreates a `public` table,
refresh and check Supabase Security Advisor. Any new **RLS Disabled in Public**
finding attributable to the change blocks acceptance unless a documented,
administrator-approved exception covers it. Do not silence the finding with an
unnecessary permissive policy.

### Production acceptance gate

A new `public` table is not Production-accepted until fail-closed verification
confirms:

- the table exists in the intended schema;
- the owner is the expected role;
- RLS matches the approved access model;
- FORCE RLS matches the approved access model;
- policies match the approved access model;
- `anon` privileges match the approved access model;
- `authenticated` privileges match the approved access model;
- `service_role` privileges match the approved access model;
- the actual server role retains its required access; and
- Security Advisor has no newly introduced RLS error attributable to the change,
  or an explicit approved exception is recorded.

### Fail closed

If the intended access model is unknown or ambiguous, stop. Do not guess, create
broad policies, preserve broad grants "just in case," or deploy until the access
model is explicitly resolved.

Security remediation must not modify, infer, repair, or rewrite business rows
unless that data mutation is independently required, documented, and approved.
