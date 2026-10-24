import PackagePreview from '@/app/components/package-preview';
export const metadata={title:'Prototype Professional | MASAJIDALLOH PRO'};
export default async function Preview({searchParams}:{searchParams:Promise<{mode?:string}>}){const {mode}=await searchParams;return <PackagePreview plan="PRO" name="Professional" reader={mode==='pembaca'}/>;}
