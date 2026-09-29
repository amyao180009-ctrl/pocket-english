let registration;
export async function registerOffline(onStatus){
 if(!('serviceWorker' in navigator)||!isSecureContext){onStatus('unsupported');return;}
 onStatus('preparing');
 try{
 registration=await navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{type:'module'});
 const report=()=>{const worker=registration.active;if(!worker)return;const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();onStatus('error');},8000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();onStatus(registration.waiting?'updateAvailable':event.data);};worker.postMessage('cache-status',[channel.port2]);};
 if(registration.waiting)onStatus('updateAvailable');
 registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&registration.active)onStatus('updateAvailable');if(worker.state==='redundant')onStatus('error');});});
 navigator.serviceWorker.addEventListener('controllerchange',report);
 await navigator.serviceWorker.ready;report();
 }catch{onStatus('error');}
}
export function activateUpdate(){if(registration?.waiting){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});registration.waiting.postMessage('activate-update');}else location.reload();}
