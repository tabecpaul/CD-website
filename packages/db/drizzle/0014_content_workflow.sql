-- Dashboard-Centric content workflow.
-- Access model: server-side PostgreSQL only through the application `postgres`
-- role. `anon`, `authenticated`, and `service_role` require no direct access.
-- RLS is enabled, FORCE RLS remains disabled, and no policies are required.

CREATE TABLE IF NOT EXISTS "content_workflow_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "source_key" varchar(240) NOT NULL,
  "title" varchar(240) NOT NULL,
  "content_axis" varchar(120) NOT NULL,
  "proposed_publish_date" date NOT NULL,
  "proposed_cta" varchar(160) NOT NULL,
  "drive_folder_url" varchar(500) NOT NULL,
  "status" varchar(32) DEFAULT 'proposed' NOT NULL,
  "duplicate_gate" varchar(16) DEFAULT 'unknown' NOT NULL,
  "site_first_status" varchar(24) DEFAULT 'not_applicable' NOT NULL,
  "canonical_url" varchar(500),
  "admin_note" text,
  "approved_at" timestamp with time zone,
  "production_ready_at" timestamp with time zone,
  "site_published_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_workflow_items_source_key_unique"
  ON "content_workflow_items" USING btree ("source_key");
CREATE INDEX IF NOT EXISTS "content_workflow_items_status_date_idx"
  ON "content_workflow_items" USING btree ("status", "proposed_publish_date");
CREATE INDEX IF NOT EXISTS "content_workflow_items_publish_date_idx"
  ON "content_workflow_items" USING btree ("proposed_publish_date");

ALTER TABLE "content_workflow_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_workflow_items" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "content_workflow_items" FROM anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE "content_workflow_items_id_seq" FROM anon, authenticated, service_role;

COMMENT ON TABLE "content_workflow_items" IS
  'Dashboard-Centric proposal and approval state. Server-side postgres access only; Drive stores assets.';

-- Restore the authoritative Drive packages without changing their approval or
-- publication truth. Weekly proposal folders remain `proposed`; the three
-- September 7/9/11 packages retain `production_ready` but are not treated as
-- Site-First or externally published without exact Production evidence.
INSERT INTO "content_workflow_items" (
  "source_key", "title", "content_axis", "proposed_publish_date", "proposed_cta",
  "drive_folder_url", "status", "duplicate_gate", "site_first_status", "admin_note",
  "production_ready_at"
) VALUES
  ('drive:1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM:2026-08-31', '진로 결정을 미루게 만드는 것은 정보 부족만이 아닙니다', '진로 의사결정 구조', '2026-08-31', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM:2026-09-02', '성격과 흥미가 맞는데도 일이 힘든 이유: 가치관 충돌', '4대 영역 통합', '2026-09-02', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM:2026-09-04', '바뀌는 직업보다 먼저 지켜야 할 진로 기준', 'AI 시대 진로 기준', '2026-09-04', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1cCziITUOlF_sQnDLkPdC4GOdiG8qICCM', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:13TH03HUDQNGOsC-Tq0T65ALOpGoAliwn:2026-09-07', '직업 이름보다 먼저 확인해야 할 ‘일하는 환경’', '자기이해·업무환경', '2026-09-07', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/13TH03HUDQNGOsC-Tq0T65ALOpGoAliwn', 'production_ready', 'pass', 'hold', 'Drive STATUS.md 기준 제작완료. Site-First PASS 주장과 별개로 exact Production canonical URL을 대시보드에서 재확인하기 전 HOLD.', '2026-09-05T23:41:54.730Z'),
  ('drive:1Fu4Y2jjAgHGKHEew8JUeHCWHdBo78_mm:2026-09-09', '소명을 기다리는 시간에도 할 수 있는 책임 있는 선택', '신앙과 소명', '2026-09-09', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1Fu4Y2jjAgHGKHEew8JUeHCWHdBo78_mm', 'production_ready', 'unknown', 'hold', 'Drive STATUS.md 기준 제작완료. Duplicate Gate와 Production canonical URL 재확인 전 HOLD.', '2026-09-05T23:44:57.551Z'),
  ('drive:1OaRTklZYzr1f7bNgoRLkgryul4RljKyc:2026-09-11', '진로는 한 번에 정하는 것이 아니라 작은 실험으로 검증합니다', '진로 실행', '2026-09-11', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1OaRTklZYzr1f7bNgoRLkgryul4RljKyc', 'production_ready', 'unknown', 'hold', 'Drive STATUS.md 기준 제작완료. Duplicate Gate와 Production canonical URL 재확인 전 HOLD.', '2026-09-05T23:48:24.318Z'),
  ('drive:1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg:2026-09-14', '‘잘할 수 있는 일’과 ‘오래 할 수 있는 일’은 다릅니다', '재능·가치관 통합', '2026-09-14', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg:2026-09-16', '부모의 기대와 나의 진로 사이에서 기준 세우기', '청소년·부모 진로대화', '2026-09-16', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg:2026-09-18', '경력 공백을 약점이 아닌 경험의 증거로 바꾸는 법', '경력 공백·재진입', '2026-09-18', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU:2026-09-21', '전공을 고를 때 ‘좋아하는 과목’만 보면 놓치는 세 가지', '청소년·대학생 전공 선택', '2026-09-21', '무료 진로 방향 자가진단', 'https://drive.google.com/drive/folders/1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU:2026-09-23', '사역의 역할이 바뀌어도 소명이 사라진 것은 아닙니다', '선교사·사역자 역할 전환', '2026-09-23', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL),
  ('drive:1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU:2026-09-25', '은퇴 후 두 번째 진로, ‘무엇을 할까’보다 ‘어떤 삶을 살까’부터', '중장년·은퇴 이후 진로', '2026-09-25', '20분 무료 콜백', 'https://drive.google.com/drive/folders/1LGCIrZ4-uZHFVY18XDOOsIkEANGbBBIU', 'proposed', 'unknown', 'not_applicable', 'Drive STATUS.md 기준 제안. 관리자 승인 전 제작 금지.', NULL)
ON CONFLICT ("source_key") DO NOTHING;
