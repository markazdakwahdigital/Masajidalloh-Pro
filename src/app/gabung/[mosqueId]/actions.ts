'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function requestReader(id:string){try{await dataRpc('mp_reader_request',{p_mosque:id});}catch{redirect('/gabung/'+id+'?status=failed');}redirect('/gabung/'+id+'?status=sent');}
