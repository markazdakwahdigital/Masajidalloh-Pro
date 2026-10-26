export function tenantApplicationInput(form:FormData){
 const data=Object.fromEntries(['mosqueName','city','address','contactName','mosqueEmail','whatsapp','mosqueWhatsapp','plan'].map(key=>[key,String(form.get(key)??'').trim()]));
 const validPhone=(phone:string)=>/^\+?[0-9 ()-]{9,22}$/.test(phone)&&phone.replace(/\D/g,'').length>=9&&phone.replace(/\D/g,'').length<=15;
 if(!['BASIC','PRO','ENTERPRISE'].includes(data.plan)||data.mosqueName.length<3||data.mosqueName.length>160||data.city.length<3||data.city.length>100||data.address.length<10||data.address.length>500||data.contactName.length<3||data.contactName.length>120||data.mosqueEmail.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mosqueEmail)||!validPhone(data.whatsapp)||!validPhone(data.mosqueWhatsapp))return null;
 data.mosqueEmail=data.mosqueEmail.toLowerCase();return data;
}
