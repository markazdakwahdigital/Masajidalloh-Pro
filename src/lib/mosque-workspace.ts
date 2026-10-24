export type PackagePlan='BASIC'|'PRO'|'ENTERPRISE';
export type ModuleData=Record<string,string|boolean>;
export type ModuleRecord={id:string;kind:string;data:ModuleData;createdAt:string};
export type WorkspaceSettings={name?:string;website?:string;servicePhone?:string;city?:string;address?:string;chair?:string;email?:string;timezone?:string};
export type Field={key:string;label:string;type:string;options?:string[];optional?:boolean};
const field=(key:string,label:string,type='text',options?:string[],optional=false):Field=>({key,label,type,options,optional});
const date=()=>field('date','Tanggal','date');
const amount=()=>field('amount','Nominal (Rp)','number');
const note=()=>field('note','Keterangan','textarea',undefined,true);
const method=()=>field('method','Metode Pembayaran','select',['Transfer Bank','Tunai','QRIS']);
const website=()=>field('website','Alamat Website','url',undefined,true);
const phone=()=>field('servicePhone','Nomor Layanan Masjid','tel',undefined,true);
export const MODULE_FIELDS:Record<string,Field[]>={
 profil:[field('name','Nama Masjid'),field('city','Kota / Kabupaten'),field('address','Alamat Masjid','textarea'),field('chair','Nama Ketua DKM'),field('email','Email Masjid','email',undefined,true),website(),phone()],
 jamaah:[field('name','Nama Jamaah'),field('phone','Nomor WhatsApp','tel',undefined,true),field('email','Email','email',undefined,true),field('group','Kelompok Jamaah','select',['Umum','Remaja','Anak-anak','Lansia']),field('active','Jamaah aktif','checkbox'),note()],
 donasi:[field('name','Nama Donatur','text',undefined,true),date(),amount(),method(),field('purpose','Tujuan Donasi'),note()],
 infaq:[field('receipt','Jenis Penerimaan','select',['Infaq','Shodaqoh']),field('form','Jenis Infaq/Shodaqoh','select',['Barang','Makanan','Minuman','Uang','Lainnya']),date(),field('name','Nama Pemberi','text',undefined,true),field('amount','Nominal Uang (Rp)','number',undefined,true),field('item','Nama Barang / Makanan / Minuman / Lainnya','text',undefined,true),field('quantity','Jumlah','number',undefined,true),field('unit','Satuan','text',undefined,true),field('source','Sumber Penerimaan','select',['Kotak Masjid','Jumat','Transfer Bank','Tunai','QRIS','Lainnya']),note()],
 zakat:[field('name','Nama Muzakki'),field('type','Jenis Zakat','select',['Zakat Fitrah','Zakat Maal']),date(),amount(),field('distributed','Sudah disalurkan','checkbox'),note()],
 wakaf:[field('name','Nama Wakif'),field('type','Jenis Wakaf','select',['Uang','Tanah','Bangunan','Peralatan','Lainnya']),field('asset','Nama Aset Wakaf'),date(),field('amount','Nominal Wakaf Uang (Rp)','number',undefined,true),field('active','Wakaf aktif','checkbox'),note()],
 keuangan:[date(),field('type','Jenis Transaksi','select',['Pemasukan','Pengeluaran']),field('category','Kategori Transaksi'),amount(),field('account','Akun Kas','select',['Kas Tunai','Rekening Bank']),note()],
 kegiatan:[field('title','Nama Kegiatan'),date(),field('time','Jam Mulai','time'),field('location','Lokasi'),field('responsible','Penanggung Jawab'),field('published','Kegiatan dipublikasikan','checkbox'),note()],
 shalat:[field('city','Kota Jadwal Sholat','select',['Jakarta','Bogor','Bandung','Semarang','Yogyakarta','Surabaya','Medan','Makassar','Denpasar','Balikpapan','Jayapura']),field('confirmed','Jadwal sudah diperiksa dengan jadwal resmi Masjid','checkbox'),note()],
 inventaris:[field('name','Nama Barang'),field('category','Kategori Barang','select',['Elektronik','Perlengkapan Ibadah','Furnitur','Kendaraan','Lainnya']),field('quantity','Jumlah','number'),field('unit','Satuan'),field('condition','Kondisi','select',['Baik','Perlu Perawatan','Rusak']),field('location','Lokasi Penyimpanan')],
 petugas:[field('name','Nama Donatur / Relawan'),field('role','Peran','select',['Donatur','Relawan','Donatur & Relawan']),field('phone','WhatsApp','tel',undefined,true),field('email','Email','email',undefined,true),field('active','Aktif','checkbox'),field('availability','Kesediaan / Bidang Kontribusi','textarea',undefined,true)],
 penerima:[field('name','Nama Penerima Manfaat'),field('category','Golongan Penerima','select',['Fakir','Miskin','Yatim','Janda','Lansia','Disabilitas','Korban Bencana','Santri/Penuntut Ilmu','Musafir']),field('address','Alamat / Domisili','textarea'),field('phone','Nomor WhatsApp','tel',undefined,true),field('guardian','Nama Wali / Pendamping','text',undefined,true),field('assistance','Jenis Bantuan','select',['Infaq','Shodaqoh','Donasi']),field('needs','Kebutuhan Bantuan','textarea'),field('active','Penerima manfaat aktif','checkbox'),note()],
 umkm:[field('name','Nama Usaha'),field('owner','Nama Pemilik'),field('category','Kategori Usaha','select',['Kuliner','Jasa','Perdagangan','Kerajinan','Lainnya']),field('phone','WhatsApp','tel'),field('address','Alamat Usaha','textarea'),note()],
 broadcast:[field('title','Judul Pengumuman'),field('audience','Penerima','select',['Seluruh Jamaah','Pengurus','Donatur & Relawan']),date(),field('content','Isi Pengumuman','textarea'),field('approved','Isi pengumuman sudah diperiksa','checkbox')],
 laporan:[field('type','Jenis Laporan','select',['Keuangan','Donasi','Infaq & Shodaqoh','Zakat','Wakaf','Jamaah','Inventaris','Kegiatan','Penerima Manfaat']),field('from','Tanggal Awal','date'),field('to','Tanggal Akhir','date')],
 setting:[field('name','Nama Tampilan Masjid'),field('timezone','Zona Waktu','select',['Asia/Jakarta','Asia/Makassar','Asia/Jayapura']),field('email','Email Pemberitahuan','email',undefined,true),website(),phone()],
};
export function hasModule(plan:PackagePlan,kind:string){
 if(['dashboard','profil','kegiatan','shalat','setting'].includes(kind))return true;
 if(plan==='BASIC')return false;
 return kind!=='umkm'||plan==='ENTERPRISE';
}
export function safeWebsite(input:string){
 if(!input.trim())return '';
 try{const url=new URL(/^https?:\/\//i.test(input)?input:'https://'+input);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||!url.hostname.includes('.'))return null;return url.href;}catch{return null;}
}
export function validateModule(kind:string,input:unknown):{data?:ModuleData;error?:string}{
 const fields=MODULE_FIELDS[kind];if(!fields||!input||typeof input!=='object'||Array.isArray(input))return {error:'Formulir tidak valid.'};
 const source=input as Record<string,unknown>,data:ModuleData={};
 for(const f of fields){
  if(f.type==='checkbox'){data[f.key]=source[f.key]===true;continue;}
  const value=typeof source[f.key]==='string'?(source[f.key] as string).trim():'';
  if((!value&&!f.optional)||value.length>(f.type==='textarea'?2000:300))return {error:`Periksa kolom ${f.label}.`};
  if(value&&f.type==='select'&&!f.options?.includes(value))return {error:`Pilihan ${f.label} tidak valid.`};
  if(value&&f.type==='number'&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1e12))return {error:`Nilai ${f.label} tidak valid.`};
  if(value&&f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return {error:'Alamat email tidak valid.'};
  if(value&&f.type==='tel'&&!/^\+?[0-9\s()-]{7,24}$/.test(value))return {error:'Nomor layanan / WhatsApp tidak valid.'};
  if(value&&f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))))return {error:'Tanggal tidak valid.'};
  if(f.type==='url'){const url=safeWebsite(value);if(url===null)return {error:'Alamat Website harus berupa http:// atau https:// yang valid.'};data[f.key]=url;}else data[f.key]=value;
 }
 if(kind==='infaq'){
  if(data.form==='Uang'&&Number(data.amount)<=0)return {error:'Isi nominal uang lebih dari nol.'};
  if(data.form!=='Uang'&&(!data.item||Number(data.quantity)<=0||!data.unit))return {error:'Isi nama, jumlah, dan satuan untuk penerimaan non-uang.'};
  if(data.form!=='Uang')data.amount='';
 }
 if(['donasi','keuangan','zakat'].includes(kind)&&Number(data.amount)<=0)return {error:'Nominal harus lebih dari nol.'};
 if(kind==='laporan'&&String(data.from)>String(data.to))return {error:'Tanggal akhir harus sesudah tanggal awal.'};
 return {data};
}
export const dateKey=(date:Date,tz='Asia/Jakarta')=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function summarize(records:ModuleRecord[],plan:PackagePlan,day:string){
 const allowed=records.filter(r=>hasModule(plan,r.kind));
 const income=allowed.filter(r=>['donasi','zakat'].includes(r.kind)||(r.kind==='infaq'&&r.data.form==='Uang')||(r.kind==='wakaf'&&r.data.type==='Uang')||(r.kind==='keuangan'&&r.data.type==='Pemasukan'));
 const expenses=allowed.filter(r=>r.kind==='keuangan'&&r.data.type==='Pengeluaran');
 const sum=(rows:ModuleRecord[])=>rows.reduce((n,r)=>n+Number(r.data.amount||0),0);
 const infaqToday=allowed.filter(r=>r.kind==='infaq'&&r.data.date===day);
 return {infaqToday:sum(infaqToday.filter(r=>r.data.form==='Uang')),infaqNonCashToday:infaqToday.filter(r=>r.data.form!=='Uang').length,beneficiaries:allowed.filter(r=>r.kind==='penerima'&&r.data.active).length,balance:sum(income)-sum(expenses),expensesToday:sum(expenses.filter(r=>r.data.date===day)),donationsToday:sum(allowed.filter(r=>r.kind==='donasi'&&r.data.date===day)),jamaah:allowed.filter(r=>r.kind==='jamaah'&&r.data.active).length,programs:allowed.filter(r=>r.kind==='kegiatan'&&r.data.published).length,zakat:sum(allowed.filter(r=>r.kind==='zakat')),wakaf:allowed.filter(r=>r.kind==='wakaf'&&r.data.active).length,income,expenses};
}
