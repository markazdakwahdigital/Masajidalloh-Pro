import PackagePreview from '@/app/components/package-preview';
export const metadata={title:'Prototype Enterprise | MASAJIDALLOH PRO'};
export default async function Preview({searchParams}:{searchParams:Promise<{mode?:string}>}){const {mode}=await searchParams;return <PackagePreview plan="ENTERPRISE" name="Enterprise" reader={mode==='pembaca'}/>;}
