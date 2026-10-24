'use server';
import {saveWorkspace} from './workspace-actions';
export async function updateMosqueProfile(mosqueId:string,form:FormData){
 // Legacy entry point stays closed; current Profile form uses the validated workspace action.
 void mosqueId;void form;return {ok:false,message:'Gunakan formulir Profile Masjid terbaru.'};
}
export async function saveLegacyProfile(mosqueId:string,input:Record<string,string>){return saveWorkspace(mosqueId,'profil',input);}
