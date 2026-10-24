'use server';
import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
export async function createAccount(form:FormData){
 const email=String(form.get('email')||'').trim().toLowerCase(),name=String(form.get('name')||'').trim(),password=String(form.get('password')||''),confirm=String(form.get('confirm')||'');
 if(name.length<3||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<12||password.length>128||password!==confirm)redirect('/buat-akun?status=invalid');
 const client=await createSupabaseServerClient();
 const {error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:'https://masajidalloh-pro.markazdakwahdigital-01.workers.dev/auth/finish?next=/dashboard'}});
 if(error)redirect('/buat-akun?status='+(error.status===429?'limited':error.code==='email_address_not_authorized'?'smtp':'unavailable'));
 redirect('/buat-akun?status=sent');
}
