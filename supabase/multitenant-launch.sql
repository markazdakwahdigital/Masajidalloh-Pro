BEGIN;
CREATE SCHEMA IF NOT EXISTS mp_private;
REVOKE ALL ON SCHEMA mp_private FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS public."MosqueAdmin" (
 "mosqueId" uuid PRIMARY KEY REFERENCES public."Mosque"(id),
 "userId" uuid NOT NULL REFERENCES public."User"(id),
 "assignedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."MosqueReaderRequest" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "mosqueId" uuid NOT NULL REFERENCES public."Mosque"(id),
 "userId" uuid NOT NULL REFERENCES public."User"(id),
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 UNIQUE("mosqueId","userId")
);
ALTER TABLE public."TenantApplication" ADD COLUMN IF NOT EXISTS "mosqueId" uuid REFERENCES public."Mosque"(id);
ALTER TABLE public."MosqueRecord" ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz;
ALTER TABLE public."MosqueAdmin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MosqueReaderRequest" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."MosqueAdmin",public."MosqueReaderRequest" FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS "MosqueReaderRequest_pending" ON public."MosqueReaderRequest"("mosqueId",status);
-- Preserve a single existing explicitly granted manager; do not choose among multiple writers.
INSERT INTO public."MosqueAdmin"("mosqueId","userId")
 SELECT m."mosqueId",(array_agg(DISTINCT m."userId"))[1]
 FROM public."MosqueMembership" m JOIN public."MembershipRole" mr ON mr."membershipId"=m.id
 JOIN public."RolePermission" rp ON rp."roleId"=mr."roleId"
 JOIN public."Permission" p ON p.id=rp."permissionId" AND p.key='mosque.manage'
 WHERE m.status='ACTIVE' GROUP BY m."mosqueId" HAVING count(DISTINCT m."userId")=1
 ON CONFLICT("mosqueId") DO NOTHING;

CREATE OR REPLACE FUNCTION mp_private.actor() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE aid uuid:=auth.uid(); em text; nm text; uid uuid;
BEGIN
 SELECT lower(email),left(coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),120)
 INTO em,nm FROM auth.users WHERE id=aid AND email_confirmed_at IS NOT NULL;
 IF aid IS NULL OR em IS NULL THEN RAISE EXCEPTION 'verified_session_required' USING ERRCODE='42501'; END IF;
 SELECT id INTO uid FROM public."User" WHERE "authUserId"=aid;
 IF uid IS NULL THEN
  SELECT id INTO uid FROM public."User" WHERE lower(email)=em AND "authUserId" IS NULL FOR UPDATE;
  IF uid IS NOT NULL THEN UPDATE public."User" SET "authUserId"=aid,"updatedAt"=now() WHERE id=uid;
  ELSE INSERT INTO public."User"("authUserId",email,name) VALUES(aid,em,nm) ON CONFLICT("authUserId") DO UPDATE SET "updatedAt"=now() RETURNING id INTO uid; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public."User" WHERE id=uid AND lower(email)<>em) THEN UPDATE public."User" SET email=em,"updatedAt"=now() WHERE id=uid; END IF;
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION mp_private.operator() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL AND lower(email)='markazdakwahdigital.01@gmail.com');
$$;
CREATE OR REPLACE FUNCTION mp_private.has_module(p_plan text,p_kind text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT p_plan IN ('BASIC','PRO','ENTERPRISE') AND (
 p_kind IN ('dashboard','profil','dkm','donasi','infaq','zakat','wakaf','jamaah','setting') OR
 (p_plan IN ('PRO','ENTERPRISE') AND p_kind IN ('keuangan','kegiatan','penerima','shalat','laporan')) OR
 (p_plan='ENTERPRISE' AND p_kind IN ('inventaris','petugas','umkm','broadcast')));
$$;
CREATE OR REPLACE FUNCTION mp_private.admin(p_mosque uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor();
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" a JOIN public."MosqueMembership" m ON m."mosqueId"=a."mosqueId" AND m."userId"=a."userId" JOIN public."Mosque" q ON q.id=a."mosqueId" WHERE a."mosqueId"=p_mosque AND a."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE') THEN RAISE EXCEPTION 'admin_required' USING ERRCODE='42501'; END IF;
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION public.mp_identity() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); result jsonb;
BEGIN SELECT jsonb_build_object('id',id,'name',name,'email',email,'operator',mp_private.operator()) INTO result FROM public."User" WHERE id=uid; RETURN result; END $$;
CREATE OR REPLACE FUNCTION public.mp_home() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); result jsonb;
BEGIN
 SELECT jsonb_build_object('mosques',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'name',q.name,'plan',coalesce(s.plan,'BASIC'),'admin',a."userId"=uid) ORDER BY q.name) FROM public."MosqueMembership" m JOIN public."Mosque" q ON q.id=m."mosqueId" LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id WHERE m."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE'),'[]'::jsonb),
 'applications',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t."mosqueName",'plan',t.plan,'status',t.status)) FROM public."TenantApplication" t JOIN public."User" u ON lower(t.email)=lower(u.email) WHERE u.id=uid),'[]'::jsonb)) INTO result; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.mp_workspace(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); assigned text; writer boolean; result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."MosqueMembership" m JOIN public."Mosque" q ON q.id=m."mosqueId" WHERE m."mosqueId"=p_mosque AND m."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE') THEN RAISE EXCEPTION 'tenant_access_denied' USING ERRCODE='42501'; END IF;
 SELECT coalesce(s.plan,'BASIC'),EXISTS(SELECT 1 FROM public."MosqueAdmin" a WHERE a."mosqueId"=q.id AND a."userId"=uid),jsonb_build_object('name',q.name,'id',q.id,'settings',jsonb_build_object('name',q.name)||coalesce(s.data,'{}'::jsonb))
 INTO assigned,writer,result FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id WHERE q.id=p_mosque;
 RETURN result||jsonb_build_object('plan',assigned,'canWrite',writer,'records',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'kind',r.kind,'data',r.data,'createdAt',r."createdAt") ORDER BY r."createdAt" DESC) FROM public."MosqueRecord" r WHERE r."mosqueId"=p_mosque AND r."archivedAt" IS NULL AND mp_private.has_module(assigned,r.kind)),'[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION mp_private.validate_data(p_kind text,p_data jsonb) RETURNS void LANGUAGE plpgsql SET search_path='' AS $fn$
DECLARE defs jsonb:=$fields${"profil":[{"key":"name","label":"Nama Masjid","type":"text","optional":false},{"key":"city","label":"Kota / Kabupaten","type":"text","optional":false},{"key":"address","label":"Alamat Masjid","type":"textarea","optional":false},{"key":"email","label":"Email Masjid","type":"email","optional":true},{"key":"website","label":"Alamat Website","type":"url","optional":true},{"key":"servicePhone","label":"Nomor Layanan Masjid","type":"tel","optional":true}],"dkm":[{"key":"name","label":"Nama Lengkap","type":"text","optional":false},{"key":"position","label":"Jabatan / Peran DKM","type":"select","options":["Ketua DKM","Sekretaris DKM","Bendahara DKM","Pembina DKM","Penasihat DKM","Muadzin","Imam Tetap","Imam Badal","Guru Kajian","Guru Tahsin & Tahfizh","Khotib Jumat","Publikasi & Broadcasting","Tim Kreatif","Pemuda Masjid","Marbot","Anggota"],"optional":false},{"key":"birthPlace","label":"Tempat Lahir","type":"text","optional":true},{"key":"birthDate","label":"Tanggal Lahir","type":"date","optional":true},{"key":"gender","label":"Jenis Kelamin","type":"select","options":["Laki-laki","Perempuan"],"optional":false},{"key":"address","label":"Alamat Lengkap","type":"textarea","optional":false},{"key":"phone","label":"Nomor WhatsApp","type":"tel","optional":false},{"key":"email","label":"Email","type":"email","optional":true},{"key":"education","label":"Pendidikan Terakhir","type":"text","optional":true},{"key":"occupation","label":"Pekerjaan","type":"text","optional":true},{"key":"expertise","label":"Keahlian / Bidang Pengabdian","type":"textarea","optional":true},{"key":"startDate","label":"Mulai Menjabat","type":"date","optional":false},{"key":"endDate","label":"Akhir Masa Jabatan","type":"date","optional":true},{"key":"active","label":"Pengurus aktif","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"jamaah":[{"key":"name","label":"Nama Jamaah","type":"text","optional":false},{"key":"phone","label":"Nomor WhatsApp","type":"tel","optional":true},{"key":"email","label":"Email","type":"email","optional":true},{"key":"group","label":"Kelompok Jamaah","type":"select","options":["Umum","Remaja","Anak-anak","Lansia"],"optional":false},{"key":"active","label":"Jamaah aktif","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"donasi":[{"key":"name","label":"Nama Donatur","type":"text","optional":true},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"amount","label":"Nominal (Rp)","type":"number","optional":false},{"key":"method","label":"Metode Pembayaran","type":"select","options":["Transfer Bank","Tunai","QRIS"],"optional":false},{"key":"purpose","label":"Tujuan Donasi","type":"text","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"infaq":[{"key":"receipt","label":"Jenis Penerimaan","type":"select","options":["Infaq","Shodaqoh"],"optional":false},{"key":"form","label":"Jenis Infaq/Shodaqoh","type":"select","options":["Barang","Makanan","Minuman","Uang","Lainnya"],"optional":false},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"name","label":"Nama Pemberi","type":"text","optional":true},{"key":"amount","label":"Nominal Uang (Rp)","type":"number","optional":true},{"key":"item","label":"Nama Barang / Makanan / Minuman / Lainnya","type":"text","optional":true},{"key":"quantity","label":"Jumlah","type":"number","optional":true},{"key":"unit","label":"Satuan","type":"text","optional":true},{"key":"source","label":"Sumber Penerimaan","type":"select","options":["Kotak Masjid","Jumat","Transfer Bank","Tunai","QRIS","Lainnya"],"optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"zakat":[{"key":"name","label":"Nama Muzakki","type":"text","optional":false},{"key":"type","label":"Jenis Zakat","type":"select","options":["Zakat Fitrah","Zakat Maal"],"optional":false},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"amount","label":"Nominal (Rp)","type":"number","optional":false},{"key":"distributed","label":"Sudah disalurkan","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"wakaf":[{"key":"name","label":"Nama Wakif","type":"text","optional":false},{"key":"type","label":"Jenis Wakaf","type":"select","options":["Uang","Tanah","Bangunan","Peralatan","Lainnya"],"optional":false},{"key":"asset","label":"Nama Aset Wakaf","type":"text","optional":false},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"amount","label":"Nominal Wakaf Uang (Rp)","type":"number","optional":true},{"key":"active","label":"Wakaf aktif","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"keuangan":[{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"type","label":"Jenis Transaksi","type":"select","options":["Pemasukan","Pengeluaran"],"optional":false},{"key":"category","label":"Kategori Transaksi","type":"text","optional":false},{"key":"amount","label":"Nominal (Rp)","type":"number","optional":false},{"key":"account","label":"Akun Kas","type":"select","options":["Kas Tunai","Rekening Bank"],"optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"kegiatan":[{"key":"title","label":"Nama Kegiatan","type":"text","optional":false},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"time","label":"Jam Mulai","type":"time","optional":false},{"key":"location","label":"Lokasi","type":"text","optional":false},{"key":"responsible","label":"Penanggung Jawab","type":"text","optional":false},{"key":"published","label":"Kegiatan dipublikasikan","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"shalat":[{"key":"city","label":"Kota Jadwal Sholat","type":"select","options":["Jakarta","Bogor","Bandung","Semarang","Yogyakarta","Surabaya","Medan","Makassar","Denpasar","Balikpapan","Jayapura"],"optional":false},{"key":"confirmed","label":"Jadwal sudah diperiksa dengan jadwal resmi Masjid","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"inventaris":[{"key":"name","label":"Nama Barang","type":"text","optional":false},{"key":"category","label":"Kategori Barang","type":"select","options":["Elektronik","Perlengkapan Ibadah","Furnitur","Kendaraan","Lainnya"],"optional":false},{"key":"quantity","label":"Jumlah","type":"number","optional":false},{"key":"unit","label":"Satuan","type":"text","optional":false},{"key":"condition","label":"Kondisi","type":"select","options":["Baik","Perlu Perawatan","Rusak"],"optional":false},{"key":"location","label":"Lokasi Penyimpanan","type":"text","optional":false}],"petugas":[{"key":"name","label":"Nama Donatur / Relawan","type":"text","optional":false},{"key":"role","label":"Peran","type":"select","options":["Donatur","Relawan","Donatur & Relawan"],"optional":false},{"key":"phone","label":"WhatsApp","type":"tel","optional":true},{"key":"email","label":"Email","type":"email","optional":true},{"key":"active","label":"Aktif","type":"checkbox","optional":false},{"key":"availability","label":"Kesediaan / Bidang Kontribusi","type":"textarea","optional":true}],"penerima":[{"key":"name","label":"Nama Penerima Manfaat","type":"text","optional":false},{"key":"category","label":"Golongan Penerima","type":"select","options":["Fakir","Miskin","Yatim","Janda","Lansia","Disabilitas","Korban Bencana","Santri/Penuntut Ilmu","Musafir"],"optional":false},{"key":"address","label":"Alamat / Domisili","type":"textarea","optional":false},{"key":"phone","label":"Nomor WhatsApp","type":"tel","optional":true},{"key":"guardian","label":"Nama Wali / Pendamping","type":"text","optional":true},{"key":"assistance","label":"Jenis Bantuan","type":"select","options":["Infaq","Shodaqoh","Donasi"],"optional":false},{"key":"needs","label":"Kebutuhan Bantuan","type":"textarea","optional":false},{"key":"active","label":"Penerima manfaat aktif","type":"checkbox","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"umkm":[{"key":"name","label":"Nama Usaha","type":"text","optional":false},{"key":"owner","label":"Nama Pemilik","type":"text","optional":false},{"key":"category","label":"Kategori Usaha","type":"select","options":["Kuliner","Jasa","Perdagangan","Kerajinan","Lainnya"],"optional":false},{"key":"phone","label":"WhatsApp","type":"tel","optional":false},{"key":"address","label":"Alamat Usaha","type":"textarea","optional":false},{"key":"note","label":"Keterangan","type":"textarea","optional":true}],"broadcast":[{"key":"title","label":"Judul Pengumuman","type":"text","optional":false},{"key":"audience","label":"Penerima","type":"select","options":["Seluruh Jamaah","Pengurus","Donatur & Relawan"],"optional":false},{"key":"date","label":"Tanggal","type":"date","optional":false},{"key":"content","label":"Isi Pengumuman","type":"textarea","optional":false},{"key":"approved","label":"Isi pengumuman sudah diperiksa","type":"checkbox","optional":false}],"laporan":[{"key":"type","label":"Jenis Laporan","type":"select","options":["Keuangan","Donasi","Infaq & Shodaqoh","Zakat","Wakaf","Jamaah","Inventaris","Kegiatan","Penerima Manfaat"],"optional":false},{"key":"from","label":"Tanggal Awal","type":"date","optional":false},{"key":"to","label":"Tanggal Akhir","type":"date","optional":false}],"setting":[{"key":"name","label":"Nama Tampilan Masjid","type":"text","optional":false},{"key":"timezone","label":"Zona Waktu","type":"select","options":["Asia/Jakarta","Asia/Makassar","Asia/Jayapura"],"optional":false},{"key":"email","label":"Email Pemberitahuan","type":"email","optional":true},{"key":"website","label":"Alamat Website","type":"url","optional":true},{"key":"servicePhone","label":"Nomor Layanan Masjid","type":"tel","optional":true}]}$fields$::jsonb; f jsonb; v jsonb; txt text; k text;
BEGIN
 IF jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>16000 OR defs->p_kind IS NULL THEN RAISE EXCEPTION 'invalid_data'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_data) LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(defs->p_kind) x WHERE x->>'key'=k) AND NOT(p_kind='dkm' AND k IN ('photoId','photoStatus')) THEN RAISE EXCEPTION 'unknown_field'; END IF;
 END LOOP;
 FOR f IN SELECT * FROM jsonb_array_elements(defs->p_kind) LOOP
  v:=p_data->(f->>'key');txt:=coalesce(v#>>'{}','');
  IF f->>'type'='checkbox' THEN IF v IS NOT NULL AND jsonb_typeof(v)<>'boolean' THEN RAISE EXCEPTION 'invalid_checkbox'; END IF; CONTINUE; END IF;
  IF v IS NOT NULL AND jsonb_typeof(v)<>'string' THEN RAISE EXCEPTION 'invalid_field'; END IF;
  IF (NOT coalesce((f->>'optional')::boolean,false) AND length(trim(txt))=0) OR length(txt)>(CASE WHEN f->>'type'='textarea' THEN 2000 ELSE 300 END) THEN RAISE EXCEPTION 'invalid_field'; END IF;
  IF txt<>'' AND f->>'type'='select' AND NOT (f->'options' ? txt) THEN RAISE EXCEPTION 'invalid_choice'; END IF;
  IF txt<>'' AND f->>'type'='number' THEN
   IF txt!~'^[0-9]+([.][0-9]+)?$' THEN RAISE EXCEPTION 'invalid_number'; END IF;
   IF txt::numeric>1000000000000 THEN RAISE EXCEPTION 'invalid_number'; END IF;
  END IF;
  IF txt<>'' AND f->>'type'='date' THEN
   IF txt!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RAISE EXCEPTION 'invalid_date'; END IF; PERFORM txt::date;
  END IF;
 END LOOP;
 IF p_kind='infaq' AND p_data->>'form'<>'Uang' THEN
  IF coalesce(p_data->>'item','')='' OR coalesce(p_data->>'unit','')='' OR coalesce(nullif(p_data->>'quantity',''),'0')::numeric<=0 THEN RAISE EXCEPTION 'invalid_non_cash'; END IF;
 END IF;
 IF p_kind='dkm' AND ((nullif(p_data->>'birthDate',''))::date>CURRENT_DATE OR (nullif(p_data->>'endDate',''))::date<(p_data->>'startDate')::date) THEN RAISE EXCEPTION 'invalid_dates'; END IF;
END $fn$;

CREATE OR REPLACE FUNCTION public.mp_save_record(p_mosque uuid,p_kind text,p_data jsonb,p_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); assigned text; saved jsonb; rec public."MosqueRecord"; k text; v jsonb;
BEGIN
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque FOR UPDATE;
 SELECT coalesce(plan,'BASIC') INTO assigned FROM public."MosqueSettings" WHERE "mosqueId"=p_mosque; assigned:=coalesce(assigned,'BASIC');
 IF NOT mp_private.has_module(assigned,p_kind) OR p_kind IN ('dashboard','laporan') THEN RAISE EXCEPTION 'package_denied' USING ERRCODE='42501'; END IF;
 PERFORM mp_private.validate_data(p_kind,p_data);
 FOR k,v IN SELECT * FROM jsonb_each(p_data) LOOP
  IF length(k)>80 OR jsonb_typeof(v) NOT IN ('string','boolean') OR length(v#>>'{}')>2000 THEN RAISE EXCEPTION 'invalid_field'; END IF;
 END LOOP;
 IF p_kind IN ('donasi','zakat','keuangan') OR (p_kind='infaq' AND p_data->>'form'='Uang') THEN
  IF coalesce(p_data->>'amount','')!~'^[0-9]+([.][0-9]{1,2})?$' THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF (p_data->>'amount')::numeric<=0 OR (p_data->>'amount')::numeric>1000000000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
 END IF;
 IF p_kind='infaq' AND p_data->>'form'<>'Uang' THEN p_data:=p_data||'{"amount":""}'::jsonb; END IF;
 IF p_kind IN ('profil','setting') THEN
  p_data:=p_data-'plan'-'admin'-'userId'-'photoId';
  SELECT coalesce(data,'{}'::jsonb)||p_data INTO saved FROM public."MosqueSettings" WHERE "mosqueId"=p_mosque; saved:=coalesce(saved,p_data);
  INSERT INTO public."MosqueSettings"("mosqueId",data) VALUES(p_mosque,saved) ON CONFLICT("mosqueId") DO UPDATE SET data=excluded.data,"updatedAt"=now();
  IF nullif(saved->>'name','') IS NOT NULL THEN UPDATE public."Mosque" SET name=left(saved->>'name',160),"updatedAt"=now() WHERE id=p_mosque; END IF;
  INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'workspace.settings.update','MosqueSettings');
  RETURN jsonb_build_object('settings',saved);
 END IF;
 IF p_id IS NULL THEN INSERT INTO public."MosqueRecord"("mosqueId","actorId",kind,data) VALUES(p_mosque,uid,p_kind,p_data) RETURNING * INTO rec;
 ELSE UPDATE public."MosqueRecord" SET data=p_data WHERE id=p_id AND "mosqueId"=p_mosque AND kind=p_kind AND "archivedAt" IS NULL RETURNING * INTO rec;
  IF rec.id IS NULL THEN RAISE EXCEPTION 'record_not_found' USING ERRCODE='42501'; END IF;
 END IF;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,CASE WHEN p_id IS NULL THEN 'workspace.record.create' ELSE 'workspace.record.update' END,rec.id::text);
 RETURN jsonb_build_object('record',jsonb_build_object('id',rec.id,'kind',rec.kind,'data',rec.data,'createdAt',rec."createdAt"));
END $$;
CREATE OR REPLACE FUNCTION public.mp_archive_record(p_mosque uuid,p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque);
BEGIN UPDATE public."MosqueRecord" SET "archivedAt"=now() WHERE id=p_id AND "mosqueId"=p_mosque AND "archivedAt" IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'record_not_found' USING ERRCODE='42501'; END IF;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'workspace.record.archive',p_id::text);
END $$;
CREATE OR REPLACE FUNCTION public.mp_apply_tenant(p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); em text; request_id uuid;
BEGIN
 SELECT email INTO em FROM public."User" WHERE id=uid;
 IF p_data->>'plan' NOT IN ('BASIC','PRO','ENTERPRISE') OR coalesce(length(trim(p_data->>'mosqueName')),0) NOT BETWEEN 3 AND 160 OR coalesce(length(trim(p_data->>'city')),0) NOT BETWEEN 3 AND 100 OR coalesce(length(trim(p_data->>'address')),0) NOT BETWEEN 10 AND 500 OR coalesce(length(trim(p_data->>'contactName')),0) NOT BETWEEN 3 AND 120 OR coalesce(p_data->>'whatsapp','')!~'^\+?[0-9 ()-]{9,22}$' THEN RAISE EXCEPTION 'invalid_application'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(em));
 IF (SELECT count(*) FROM public."TenantApplication" WHERE lower(email)=em AND "submittedAt">now()-interval '24 hours')>=2 THEN RAISE EXCEPTION 'application_rate_limit'; END IF;
 INSERT INTO public."TenantApplication"("mosqueName",city,address,"contactName",email,whatsapp,plan,status) VALUES(trim(p_data->>'mosqueName'),trim(p_data->>'city'),trim(p_data->>'address'),trim(p_data->>'contactName'),em,p_data->>'whatsapp',p_data->>'plan','PENDING') RETURNING id INTO request_id;
 RETURN request_id;
END $$;
CREATE OR REPLACE FUNCTION public.mp_operator() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('applications',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t."submittedAt" DESC) FROM public."TenantApplication" t),'[]'::jsonb),'tenants',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'name',q.name,'status',q.status,'plan',coalesce(s.plan,'BASIC'),'admin',u.email)) FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id LEFT JOIN public."User" u ON u.id=a."userId"),'[]'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.mp_review_tenant(p_request uuid,p_approve boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; applicant uuid; req public."TenantApplication"; mosque uuid;
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 actor:=mp_private.actor();
 SELECT * INTO req FROM public."TenantApplication" WHERE id=p_request FOR UPDATE;
 IF req.id IS NULL OR req.status<>'PENDING' THEN RAISE EXCEPTION 'application_not_pending'; END IF;
 IF NOT p_approve THEN UPDATE public."TenantApplication" SET status='REJECTED',"reviewedAt"=now() WHERE id=p_request; RETURN NULL; END IF;
 SELECT u.id INTO applicant FROM public."User" u JOIN auth.users au ON au.id=u."authUserId" WHERE lower(u.email)=lower(req.email) AND au.email_confirmed_at IS NOT NULL;
 IF applicant IS NULL THEN RAISE EXCEPTION 'applicant_not_verified'; END IF;
 INSERT INTO public."Mosque"(name,slug,status) VALUES(req."mosqueName",'masjid-'||gen_random_uuid()::text,'ACTIVE') RETURNING id INTO mosque;
 INSERT INTO public."MosqueSettings"("mosqueId",plan,data) VALUES(mosque,req.plan,jsonb_build_object('name',req."mosqueName",'city',req.city,'address',req.address,'email',req.email,'servicePhone',req.whatsapp,'timezone','Asia/Jakarta'));
 INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(mosque,applicant,'ACTIVE');
 INSERT INTO public."MosqueAdmin"("mosqueId","userId") VALUES(mosque,applicant);
 UPDATE public."TenantApplication" SET status='APPROVED',"mosqueId"=mosque,"reviewedAt"=now() WHERE id=p_request;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(mosque,actor,'tenant.activate',p_request::text);
 RETURN mosque;
END $$;
CREATE OR REPLACE FUNCTION public.mp_reader_request(p_mosque uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor();
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."Mosque" WHERE id=p_mosque AND status='ACTIVE') THEN RAISE EXCEPTION 'mosque_not_active'; END IF;
 INSERT INTO public."MosqueReaderRequest"("mosqueId","userId") VALUES(p_mosque,uid) ON CONFLICT("mosqueId","userId") DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.mp_readers(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque);
BEGIN RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'name',u.name,'email',u.email,'status',r.status)) FROM public."MosqueReaderRequest" r JOIN public."User" u ON u.id=r."userId" WHERE r."mosqueId"=p_mosque),'[]'::jsonb); END $$;
CREATE OR REPLACE FUNCTION public.mp_reader_review(p_mosque uuid,p_request uuid,p_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); req public."MosqueReaderRequest";
BEGIN
 SELECT * INTO req FROM public."MosqueReaderRequest" WHERE id=p_request AND "mosqueId"=p_mosque AND status='PENDING' FOR UPDATE;
 IF req.id IS NULL THEN RAISE EXCEPTION 'request_not_pending'; END IF;
 IF p_approve THEN INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(p_mosque,req."userId",'ACTIVE') ON CONFLICT("mosqueId","userId") DO UPDATE SET status='ACTIVE'; END IF;
 UPDATE public."MosqueReaderRequest" SET status=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END WHERE id=p_request;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,CASE WHEN p_approve THEN 'reader.approve' ELSE 'reader.reject' END,p_request::text);
END $$;
CREATE OR REPLACE FUNCTION public.mp_reader_revoke(p_mosque uuid,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); target uuid;
BEGIN
 SELECT "userId" INTO target FROM public."MosqueReaderRequest" WHERE id=p_request AND "mosqueId"=p_mosque FOR UPDATE;
 IF target IS NULL OR EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=target) THEN RAISE EXCEPTION 'reader_not_found' USING ERRCODE='42501'; END IF;
 UPDATE public."MosqueMembership" SET status='SUSPENDED' WHERE "mosqueId"=p_mosque AND "userId"=target;
 UPDATE public."MosqueReaderRequest" SET status='REJECTED' WHERE id=p_request;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'reader.revoke',p_request::text);
END $$;
-- No direct table access: every public RPC verifies the signed-in actor and tenant.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mp_private FROM PUBLIC,anon,authenticated;
DO $$ DECLARE f record; BEGIN FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('mp_identity','mp_home','mp_workspace','mp_save_record','mp_archive_record','mp_apply_tenant','mp_operator','mp_review_tenant','mp_reader_request','mp_readers','mp_reader_review','mp_reader_revoke') LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature); EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END LOOP; END $$;
-- Preserve activities created with the previous program form.
INSERT INTO public."MosqueRecord"(id,"mosqueId","actorId",kind,data,"createdAt")
 SELECT id,"mosqueId","createdById",'kegiatan',jsonb_build_object('title',title,'date',to_char("startsAt" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD'),'time',to_char("startsAt" AT TIME ZONE 'Asia/Jakarta','HH24:MI'),'location','Belum diisi','responsible','Belum diisi','published',status='PUBLISHED','note',coalesce(description,'')),"createdAt"
 FROM public."MosqueProgram" ON CONFLICT(id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.mp_ping() RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT 'single-admin-v1'::text; $$;
REVOKE ALL ON FUNCTION public.mp_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_ping() TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
