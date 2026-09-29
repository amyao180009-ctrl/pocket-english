import {toggleWord,startWordReview,revealWord,answerWord} from './vocabulary.js';
import {registerOffline,activateUpdate} from './offline.js';
import {render} from './views.js';import {initialState,startSession,applyEvent,markAttempt,localDate} from './learning.js';import {createStore,STORAGE_KEY,withStorageLock} from './storage.js';import {getLesson,expressions} from './content.js';import {gradeOrder} from './activities.js';import {createSpeech} from './speech.js';
const root=document.querySelector('#app');let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('unavailable')}};}
const store=createStore(storage),loaded=store.load();let state=loaded.ok?loaded.state:initialState();
const ui={page:location.hash.slice(1)||'home',error:loaded.ok?'':loaded.error,corruptRaw:loaded.raw,offline:'preparing',picked:[],feedback:'',answered:false};let busy=false,audioStatus='';
const audioMessages={unavailable:'当前设备没有可用的英语声音，可以继续文字练习。',loading:'正在准备朗读…',speaking:'正在朗读…',idle:'',error:'朗读未能完成，请重试或继续文字练习。'};
const speech=createSpeech({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,onStatus:s=>{audioStatus=s;updateAudio();}});
function updateAudio(){const n=document.getElementById('audio-status');if(n)n.textContent=audioMessages[audioStatus]||'';}
function draw(){render(root,state,ui,onAction);updateAudio();}
function clearStep(){ui.picked=[];ui.feedback='';ui.answered=false;ui.reveal=false;ui.translation=false;}
function navigate(page){speech.stop();ui.page=page;clearStep();history.replaceState(null,'',`#${page}`);draw();window.scrollTo({top:0});}
function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function persist(next,afterSave=()=>draw()){
 const result=await withStorageLock(navigator.locks,()=>store.save(next,state.revision));
 if(result.ok){state=result.state;ui.error='';ui.pending=null;ui.afterSave=null;afterSave();return true;}
 ui.error=result.error;ui.pending=next;ui.afterSave=afterSave;draw();return false;
}
async function onAction({type,payload}){
 if(busy)return;busy=true;
 try{
 if(ui.error&&!['export','exportRaw','recover','reload','retry','nav'].includes(type)){draw();return;}
 const s=state.sessions[state.activeSessionId],step=s&&!s.completed?s.steps[s.cursor]:null;
 switch(type){
 case 'nav':ui.wordId=null;navigate(payload);break;
 case 'word-open':ui.wordReturn=ui.page;ui.wordId=payload;speech.stop();ui.page='words';draw();window.scrollTo({top:0});break;
 case 'word-close':ui.wordId=null;ui.page=ui.wordReturn==='learn'?'learn':'words';speech.stop();draw();break;
 case 'word-book':ui.wordId=null;navigate('words');break;
 case 'word-filter':ui.wordFilter=payload;draw();break;
 case 'word-toggle':await persist(toggleWord(state,payload,localDate()));break;
 case 'word-start':await persist(startWordReview(state,{id:crypto.randomUUID(),day:localDate(),mode:payload}),()=>navigate('wordReview'));break;
 case 'word-resume':navigate('wordReview');break;
 case 'word-reveal':await persist(revealWord(state));break;
 case 'word-mode':{const next=structuredClone(state);if(next.vocabulary?.review){next.vocabulary.review.mode='meaning';speech.stop();await persist(next);}break;}
 case 'word-answer':speech.stop();await persist(answerWord(state,{...payload,day:localDate()}));break;
 case 'reload':location.reload();break;
 case 'resume':navigate('learn');break;
 case 'start':{const next=startSession(state,{id:crypto.randomUUID(),day:localDate(),minutes:payload.minutes,mode:state.settings.quiet?'quiet':'spoken',lessonId:payload.lessonId});await persist(next,()=>navigate('learn'));break;}
 case 'advance':{if(!step)break;speech.stop();const evidence=payload.evidence||'exposure';const next=applyEvent(state,{id:`${s.id}:${step.id}`,sessionId:s.id,stepId:step.id,date:localDate(),correct:payload.correct!==false,hinted:false,evidence});await persist(next,()=>{clearStep();draw();window.scrollTo({top:0});});break;}
 case 'hint':if(step)await persist(markAttempt(state,s.id,{hinted:true}),()=>{ui.reveal=true;draw();});break;
 case 'choice':if(!step||ui.answered)break;if(payload===getLesson(s.lessonId).question.answerIndex){ui.answered=true;ui.feedback=`答对了。${getLesson(s.lessonId).question.explanation}`;draw();}else await persist(markAttempt(state,s.id,{wrong:true}),()=>{ui.feedback='再想想。这次需要再练的记录会保留。';draw();});break;
 case 'translation':ui.translation=!ui.translation;draw();break;
 case 'pick':if(step&&!ui.answered&&!ui.picked.includes(payload)){ui.picked.push(payload);ui.feedback='';draw();}break;
 case 'unpick':if(!ui.answered){ui.picked.splice(payload,1);draw();}break;
 case 'check':{if(!step)break;const e=expressions[step.expressionId];if(gradeOrder(ui.picked.map(i=>e.tokens[i]),e)){ui.answered=true;ui.feedback='顺序正确！';draw();}else await persist(markAttempt(state,s.id,{wrong:true}),()=>{ui.feedback='还差一点，点已选的词可以撤回，再排一次。';draw();});break;}
 case 'speak':speech.play(payload,{slow:state.settings.slow});break;
 case 'setting':{const next=structuredClone(state);next.settings[payload]=!next.settings[payload];await persist(next);break;}
 case 'export':download(store.exportBackup(ui.pending||state),`碎片英语-${localDate()}.json`);break;
 case 'exportRaw':download(ui.corruptRaw,'碎片英语-原始记录.txt','text/plain');break;
 case 'import':{if(payload.size>5*1024*1024){ui.error='文件超过 5 MB，未导入。';draw();break;}const result=store.parseBackup(await payload.text());if(!result.ok){window.alert(result.error);break;}if(window.confirm('导入将替换当前进度。建议先取消并导出当前备份。确认替换吗？')){await persist(result.state,()=>navigate('profile'));}break;}
 case 'reset':if(window.confirm('确定重置全部学习进度吗？请先导出备份。此操作无法撤销。')){await persist(initialState(),()=>navigate('home'));}break;
 case 'recover':if(window.confirm('确认已下载原始记录，并重置损坏的学习数据吗？')){const r=await withStorageLock(navigator.locks,()=>store.recover(ui.corruptRaw));if(r.ok){state=r.state;ui.error='';delete ui.corruptRaw;navigate('home');}else{ui.error=r.error;draw();}}break;
 case 'retry':if(ui.pending)await persist(ui.pending,ui.afterSave);break;
 case 'update':if(!s||s.completed)activateUpdate();else window.alert('请先完成当前学习，再更新应用。');break;
 }
 }catch(error){ui.error=`操作未完成：${error.message}`;draw();}finally{busy=false;}
}
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){ui.error='其他页面已更改进度，请刷新后继续。';speech.stop();draw();}});
window.addEventListener('hashchange',()=>{ui.page=location.hash.slice(1)||'home';speech.stop();clearStep();draw();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)speech.stop();else{const latest=store.load();if(!latest.ok||latest.state.revision!==state.revision)ui.error='存储或其他页面发生变化，请刷新后继续。';draw();}});
draw();

registerOffline(status=>{ui.offline=status;draw();});
