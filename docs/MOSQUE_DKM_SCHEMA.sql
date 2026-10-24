BEGIN;
ALTER TABLE public."MosqueRecord" DROP CONSTRAINT "MosqueRecord_kind_check";
ALTER TABLE public."MosqueRecord" ADD CONSTRAINT "MosqueRecord_kind_check" CHECK (kind IN ('dkm','jamaah','donasi','infaq','zakat','wakaf','keuangan','kegiatan','shalat','inventaris','petugas','penerima','umkm','broadcast'));
COMMIT;
