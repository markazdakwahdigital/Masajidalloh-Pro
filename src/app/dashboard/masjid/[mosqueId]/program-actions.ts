'use server';
export async function createProgram(mosqueId:string,previous:{ok:boolean;message:string}|null,form:FormData){
 void mosqueId;void previous;void form;return {ok:false,message:'Gunakan formulir Program & Kegiatan terbaru.'};
}
export async function changeProgramStatus(mosqueId:string,id:string,target:'PUBLISHED'|'CANCELED'):Promise<void>{void mosqueId;void id;void target;throw new Error('Gunakan formulir Program & Kegiatan terbaru.');}
