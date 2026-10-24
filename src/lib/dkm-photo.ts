export const DKM_PHOTO_MAX_BYTES=2*1024*1024;
export function checkDkmPhoto(size:number,type:string,bytes?:Uint8Array){
 if(!size||size>DKM_PHOTO_MAX_BYTES)return 'Foto harus berukuran maksimum 2 MB.';
 if(!['image/jpeg','image/png','image/webp'].includes(type))return 'Gunakan foto JPG, PNG, atau WebP.';
 if(bytes){
 const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!(type==='image/png'&&png||type==='image/jpeg'&&jpg||type==='image/webp'&&webp))return 'Isi file tidak sesuai format foto.';
 }
 return null;
}
