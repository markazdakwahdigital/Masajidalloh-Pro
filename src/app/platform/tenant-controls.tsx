'use client';
import {useState} from 'react';
import {manageTenant} from './actions';
export type Tenant={id:string;name:string;status:string;plan:string;adminId:string|null;admin:string|null;adminName?:string|null;whatsapp?:string|null;createdAt:string;readers:number;members:Array<{id:string;name:string;email:string}>};
export default function TenantControls({tenant:t}:{tenant:Tenant}){
 const [action,setAction]=useState('plan');const [value,setValue]=useState(t.plan);
 const [reason,setReason]=useState('');const [error,setError]=useState('');const [review,setReview]=useState(false);
 const options=action==='plan'?[['BASIC','Basic'],['PRO','Professional'],['ENTERPRISE','Enterprise']]:action==='status'?[['ACTIVE','Aktif'],['SUSPENDED','Ditangguhkan']]:t.members.filter(m=>m.id!==t.adminId).map(m=>[m.id,m.name+' · '+m.email]);
 return <form action={manageTenant} className="tenant-control-form"><input type="hidden" name="mosqueId" value={t.id}/><input type="hidden" name="expected" value={JSON.stringify({status:t.status,plan:t.plan,adminId:t.adminId})}/>
 <label>Pengaturan<select name="action" value={action} onChange={e=>{const a=e.target.value;setAction(a);setValue(a==='plan'?t.plan:a==='status'?t.status:'');setReview(false);setError('');}}><option value="plan">Ubah Paket</option><option value="status">Status Tenant</option><option value="admin">Ganti Admin Masjid</option></select></label>
 <label>Nilai baru<select name="value" required value={value} onChange={e=>{setValue(e.target.value);setReview(false);setError('');}}>{action==='admin'&&<option value="">Pilih anggota terverifikasi</option>}{options.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 {action==='admin'&&<p>Admin baru harus sudah menjadi anggota aktif dengan email terverifikasi. Setelah diganti, Admin lama menjadi pembaca. Tetap hanya satu Admin.</p>}
 {action==='status'&&<p>Penangguhan menutup akses Admin dan pembaca. Data tetap tersimpan. Aktivasi kembali membuka akses sesuai keanggotaan.</p>}
 {action==='plan'&&<p>Fitur mengikuti paket baru. Data fitur di luar paket tetap tersimpan dan muncul kembali saat paket mengizinkannya. Pembayaran tidak diproses di sini.</p>}
 <label>Alasan perubahan (minimal 5 karakter)<textarea name="reason" minLength={5} maxLength={500} required value={reason} onChange={e=>{setReason(e.target.value);setReview(false);setError('');}}/></label>
 {error&&<p role="alert" className="tenant-message warning">{error}</p>}
 {!review?<button type="button" onClick={()=>{if(!value){setError(action==='admin'?'Belum ada Admin pengganti yang dipilih. Pilih anggota aktif dengan email terverifikasi.':'Pilih nilai baru terlebih dahulu.');return;}if(value===(action==='plan'?t.plan:action==='status'?t.status:t.adminId)){setError('Nilai baru masih sama dengan pengaturan saat ini. Pilih paket, status, atau Admin yang berbeda.');return;}if(reason.trim().length<5){setError('Tuliskan alasan perubahan minimal 5 karakter.');return;}setError('');setReview(true);}}>Tinjau Perubahan</button>:<div role="status"><p><strong>{t.name}</strong>: {action==='plan'?'Paket':action==='status'?'Status':'Admin'} → <strong>{options.find(o=>o[0]===value)?.[1]}</strong>. Alasan: {reason}</p><button type="submit">Konfirmasi & Simpan</button><button type="button" onClick={()=>setReview(false)}>Batal</button></div>}
 </form>;
}
