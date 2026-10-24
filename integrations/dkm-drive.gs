/** Run as markazdakwahdigital.01@gmail.com. Keep all created files private. */
function setupDkmDrive() {
 if(Session.getEffectiveUser().getEmail()!=='markazdakwahdigital.01@gmail.com')throw new Error('Gunakan akun markazdakwahdigital.01@gmail.com');
 const props=PropertiesService.getScriptProperties();
 if(!props.getProperty('DKM_DRIVE_FOLDER_ID')){
 const found=DriveApp.getFoldersByName('Foto DKM Masjidalloh');
 const folder=found.hasNext()?found.next():DriveApp.createFolder('Foto DKM Masjidalloh');
 if(folder.getOwner().getEmail()!=='markazdakwahdigital.01@gmail.com')throw new Error('Pemilik folder tidak sesuai.');
 props.setProperty('DKM_DRIVE_FOLDER_ID',folder.getId());
 }
 if(!props.getProperty('DKM_DRIVE_SIGNING_KEY'))props.setProperty('DKM_DRIVE_SIGNING_KEY',Utilities.getUuid()+Utilities.getUuid());
}
function doPost(e){
 const answer=value=>ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
 const lock=LockService.getScriptLock();
 try{
 if(Session.getEffectiveUser().getEmail()!=='markazdakwahdigital.01@gmail.com')return answer({ok:false});
 if(!e||!e.postData||e.postData.contents.length>2900000)return answer({ok:false});
 const envelope=JSON.parse(e.postData.contents),props=PropertiesService.getScriptProperties(),key=props.getProperty('DKM_DRIVE_SIGNING_KEY');
 if(!key||typeof envelope.payload!=='string'||typeof envelope.signature!=='string')return answer({ok:false});
 const expected=Utilities.computeHmacSha256Signature(envelope.payload,key).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
 if(expected.length!==envelope.signature.length)return answer({ok:false});
 let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^envelope.signature.charCodeAt(i);
 if(mismatch)return answer({ok:false});
 const data=JSON.parse(envelope.payload),uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(data.mosqueId)||!uuid.test(data.recordId)||!uuid.test(data.nonce)||!Number.isFinite(data.timestamp)||Math.abs(Date.now()-data.timestamp)>300000)return answer({ok:false});
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[data.mimeType];if(!ext)return answer({ok:false});
 const bytes=Utilities.base64Decode(data.base64);
 if(!bytes.length||bytes.length>2*1024*1024)return answer({ok:false});
 const b=i=>(bytes[i]+256)%256;
 const valid=data.mimeType==='image/jpeg'?b(0)===255&&b(1)===216&&b(2)===255:data.mimeType==='image/png'?b(0)===137&&b(1)===80&&b(2)===78&&b(3)===71&&b(4)===13&&b(5)===10&&b(6)===26&&b(7)===10:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!valid)return answer({ok:false});
 if(!lock.tryLock(10000))return answer({ok:false});
 const cache=CacheService.getScriptCache();if(cache.get(data.nonce))return answer({ok:false});cache.put(data.nonce,'1',600);
 const root=DriveApp.getFolderById(props.getProperty('DKM_DRIVE_FOLDER_ID'));
 if(root.getName()!=='Foto DKM Masjidalloh'||root.getOwner().getEmail()!=='markazdakwahdigital.01@gmail.com')return answer({ok:false});
 const folders=root.getFoldersByName(data.mosqueId),folder=folders.hasNext()?folders.next():root.createFolder(data.mosqueId);
 const name=data.recordId+'.'+ext,existing=folder.getFilesByName(name);
 const file=existing.hasNext()?existing.next():folder.createFile(Utilities.newBlob(bytes,data.mimeType,name));
 return answer({ok:true,fileId:file.getId()});
 }catch(_error){return answer({ok:false});}finally{if(lock.hasLock())lock.releaseLock();}
}
