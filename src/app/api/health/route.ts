import { NextResponse } from 'next/server';
export function GET(){ return NextResponse.json({status:'ok',service:'masajidalloh-pro',database:'not-checked',auth:'not-implemented'}); }
