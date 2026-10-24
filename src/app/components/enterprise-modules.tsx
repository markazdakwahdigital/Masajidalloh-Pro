'use client';
import { useEffect, useState } from 'react';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';
import { MenuIcon } from './enterprise-navigation';

const forms:Record<string,{fields:Array<[string,string,string?]>;columns:string[]}>={
 profil:{fields:[['Nama masjid','text'],['Kota / kabupaten','text'],['Alamat masjid','textarea'],['Nama ketua DKM','text'],['Email masjid','email'],['WhatsApp masjid','tel']],columns:['Nama Masjid','Kota','Ketua DKM','Status']},
 jamaah:{fields:[['Nama jamaah','text'],['Nomor WhatsApp','tel'],['Email','email'],['Kelompok jamaah','select','Umum|Remaja|Anak-anak|Lansia'],['Alamat','textarea']],columns:['Nama Jamaah','WhatsApp','Kelompok','Status']},
 donasi:{fields:[['Nama donatur','text'],['Tanggal donasi','date'],['Nominal donasi','number'],['Metode pembayaran','select','Transfer Bank|Tunai|QRIS'],['Tujuan donasi','text'],['Keterangan','textarea']],columns:['Tanggal','Donatur','Tujuan','Nominal','Metode']},
 infaq:{fields:[['Jenis penerimaan','select','Infaq|Shodaqoh'],['Tanggal','date'],['Nama pemberi (opsional)','text'],['Nominal','number'],['Sumber penerimaan','select','Kotak Masjid|Jumat|Transfer Bank|Tunai|QRIS'],['Keterangan','textarea']],columns:['Tanggal','Jenis','Sumber','Nominal','Keterangan']},
 zakat:{fields:[['Nama muzakki','text'],['Jenis zakat','select','Zakat Fitrah|Zakat Maal'],['Tanggal penerimaan','date'],['Nominal / nilai zakat','number'],['Status penyaluran','select','Belum Disalurkan|Disalurkan'],['Keterangan mustahik','textarea']],columns:['Tanggal','Muzakki','Jenis Zakat','Nilai','Penyaluran']},
 wakaf:{fields:[['Nama wakif','text'],['Jenis wakaf','select','Uang|Tanah|Bangunan|Peralatan|Lainnya'],['Nama aset wakaf','text'],['Tanggal ikrar','date'],['Nilai aset / nominal','number'],['Peruntukan','textarea']],columns:['Wakif','Aset','Jenis','Peruntukan','Status']},
 keuangan:{fields:[['Tanggal transaksi','date'],['Jenis transaksi','select','Pemasukan|Pengeluaran'],['Kategori transaksi','text'],['Nominal','number'],['Akun kas','select','Kas Tunai|Rekening Bank'],['Keterangan','textarea']],columns:['Tanggal','Kategori','Pemasukan','Pengeluaran','Saldo']},
 kegiatan:{fields:[['Nama kegiatan','text'],['Tanggal kegiatan','date'],['Jam mulai','time'],['Lokasi','text'],['Penanggung jawab','text'],['Deskripsi kegiatan','textarea']],columns:['Kegiatan','Tanggal','Lokasi','Penanggung Jawab','Status']},
 inventaris:{fields:[['Nama barang','text'],['Kategori barang','select','Elektronik|Perlengkapan Ibadah|Furnitur|Kendaraan|Lainnya'],['Jumlah','number'],['Satuan','text'],['Kondisi','select','Baik|Perlu Perawatan|Rusak'],['Lokasi penyimpanan','text']],columns:['Nama Barang','Kategori','Jumlah','Kondisi','Lokasi']},
 petugas:{fields:[['Nama petugas / relawan','text'],['Peran','select','Imam|Muadzin|Marbot|Relawan|Pengurus'],['WhatsApp','tel'],['Tanggal tugas','date'],['Jam tugas','time'],['Keterangan','textarea']],columns:['Nama','Peran','Jadwal','WhatsApp','Status']},
 umkm:{fields:[['Nama usaha','text'],['Nama pemilik','text'],['Kategori usaha','select','Kuliner|Jasa|Perdagangan|Kerajinan|Lainnya'],['WhatsApp','tel'],['Alamat usaha','textarea'],['Deskripsi usaha','textarea']],columns:['Usaha','Pemilik','Kategori','Kontak','Status']},
 broadcast:{fields:[['Judul pengumuman','text'],['Penerima','select','Seluruh Jamaah|Pengurus|Petugas & Relawan'],['Tanggal publikasi','date'],['Isi pengumuman','textarea']],columns:['Judul','Penerima','Tanggal','Status']},
 laporan:{fields:[['Jenis laporan','select','Keuangan|Donasi|Infaq & Shodaqoh|Zakat|Wakaf|Jamaah|Inventaris|Kegiatan'],['Tanggal awal','date'],['Tanggal akhir','date'],['Format laporan','select','PDF|Excel']],columns:['Nama Laporan','Periode','Dibuat','Status']},
 setting:{fields:[['Nama tampilan masjid','text'],['Zona waktu','select','WIB — Asia/Jakarta|WITA — Asia/Makassar|WIT — Asia/Jayapura'],['Email pemberitahuan','email'],['Nomor layanan masjid','tel']],columns:['Pengaturan','Nilai','Status']},
};

export default function EnterpriseModules({preview=false}:{preview?:boolean}){
 const [active,setActive]=useState('');
 useEffect(()=>{const update=()=>setActive(window.location.hash.slice(1));update();window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 const menu=ENTERPRISE_MENU.find(item=>item.id===active);
 const schema=forms[active];
 useEffect(()=>{
  if(!forms[active]||(!preview&&['profil','kegiatan'].includes(active)))return;
  const frame=window.requestAnimationFrame(()=>document.getElementById(active)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
  return()=>window.cancelAnimationFrame(frame);
 },[active,preview]);
 if(!menu||!schema||(!preview&&['profil','kegiatan'].includes(active)))return null;
 return <section className="brochure-panel enterprise-module" id={active} key={active}>
 <div className="brochure-panel-heading"><span className="gold-tile"><MenuIcon index={menu.icon}/></span><h2>{menu.label}</h2><span className="brochure-period">Enterprise</span></div>
 <p className="brochure-note">Pratinjau formulir {menu.label.toLowerCase()}. Data belum disimpan atau dikirim dari formulir ini.</p>
 <form className="brochure-form module-form" onSubmit={event=>event.preventDefault()}>{schema.fields.map(([label,type,options])=><label className={type==='textarea'?'span-two':''} key={label}>{label}{type==='select'?<select>{options?.split('|').map(option=><option key={option}>{option}</option>)}</select>:type==='textarea'?<textarea rows={3} placeholder={label}/>:<input type={type} min={type==='number'?0:undefined} placeholder={label}/>}</label>)}<div className="module-actions span-two"><button type="submit" disabled>{active==='laporan'?'Laporan belum tersedia':'Penyimpanan belum tersedia'}</button><button type="reset" className="reset-button">↶ Reset</button></div></form>
 <div className="brochure-table-wrap"><table className="brochure-table"><caption>Daftar {menu.label}</caption><thead><tr>{schema.columns.map(column=><th scope="col" key={column}>{column}</th>)}</tr></thead><tbody><tr><td colSpan={schema.columns.length}>Belum ada data {menu.label.toLowerCase()}.</td></tr></tbody></table></div>
 </section>;
}
