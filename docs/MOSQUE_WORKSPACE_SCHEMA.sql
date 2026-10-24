BEGIN;
CREATE TABLE IF NOT EXISTS public."MosqueSettings" (
 "mosqueId" uuid PRIMARY KEY REFERENCES public."Mosque"(id) ON DELETE RESTRICT,
 plan text NOT NULL DEFAULT 'BASIC' CHECK (plan IN ('BASIC','PRO','ENTERPRISE')),
 data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data)='object'),
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."MosqueRecord" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "mosqueId" uuid NOT NULL REFERENCES public."Mosque"(id) ON DELETE RESTRICT,
 "actorId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK (kind IN ('jamaah','donasi','infaq','zakat','wakaf','keuangan','kegiatan','shalat','inventaris','petugas','umkm','broadcast')),
 data jsonb NOT NULL CHECK (jsonb_typeof(data)='object' AND octet_length(data::text)<=16000),
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "MosqueRecord_mosqueId_kind_createdAt_idx" ON public."MosqueRecord"("mosqueId",kind,"createdAt");
CREATE INDEX IF NOT EXISTS "MosqueRecord_actorId_idx" ON public."MosqueRecord"("actorId");
ALTER TABLE public."MosqueSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MosqueRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."MosqueSettings",public."MosqueRecord" FROM anon,authenticated;
COMMENT ON TABLE public."MosqueRecord" IS 'Server-only tenant records. Server actions verify session, active membership, mosque.manage permission and assigned plan.';
COMMIT;
