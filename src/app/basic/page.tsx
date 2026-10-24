import PackagePreview from '@/app/components/package-preview';
export const metadata={title:'Prototype Basic | MASAJIDALLOH PRO'};
export default async function Preview({searchParams}:{searchParams:Promise<{mode?:string}>}){const {mode}=await searchParams;return <PackagePreview plan="BASIC" name="Basic" reader={mode==='pembaca'}/>;}
