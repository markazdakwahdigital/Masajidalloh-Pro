import QRCode from 'qrcode';
// PNG generation stays on the server; browsers receive only the finished image.
export function renderMosqueQr(link:string){
 return QRCode.toBuffer(link,{type:'png',errorCorrectionLevel:'M',margin:4,scale:10,color:{dark:'#000000ff',light:'#ffffffff'}});
}
