export function createSpeech({synth,Utterance,onStatus=()=>{}}={}){
 let token=0,timer,active=false;const voices=()=>synth?.getVoices?.().filter(v=>/^en(?:-|_)/i.test(v.lang))||[];
 const ready=()=>{if(!active)onStatus(synth&&Utterance&&voices().length?'idle':'unavailable');};
 const cancel=()=>{token++;clearTimeout(timer);active=false;synth?.cancel();};
 const changed=()=>ready();synth?.addEventListener?.('voiceschanged',changed);
 return {play(text,{slow=false}={}){cancel();const voice=voices()[0];if(!voice||!Utterance){onStatus('unavailable');return;}const id=token;try{const u=new Utterance(text);u.voice=voice;u.lang=voice.lang;u.rate=slow?0.72:0.95;active=true;onStatus('loading');timer=setTimeout(()=>{if(id===token){cancel();onStatus('error');}},10000);u.onstart=()=>{if(id===token){clearTimeout(timer);onStatus('speaking');}};u.onend=()=>{if(id===token){clearTimeout(timer);active=false;onStatus('idle');}};u.onerror=()=>{if(id===token){clearTimeout(timer);active=false;onStatus('error');}};synth.speak(u);}catch{cancel();onStatus('error');}},stop(){cancel();ready();},dispose(){cancel();synth?.removeEventListener?.('voiceschanged',changed);}};
}
