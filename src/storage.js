import {words} from './vocabulary-content.js';
import {expressions,getLesson} from './content.js';import {initialState,localDate} from './learning.js';
export const STORAGE_KEY='adult-english:v1';const MAX=5*1024*1024;
const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const integer=(x,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const identifier=x=>typeof x==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(x)&&!['__proto__','constructor','prototype'].includes(x);
const day=x=>{if(typeof x!=='string'||!/^20\d\d-\d\d-\d\d$/.test(x))return false;const [y,m,d]=x.split('-').map(Number);return localDate(new Date(y,m-1,d,12))===x;};
export function validateState(s){
 try{
 const ensure=(ok)=>{if(!ok)throw Error('备份格式或学习记录无效，未覆盖当前进度。');};
 ensure(obj(s)&&s.version===1&&integer(s.revision,0)&&obj(s.settings)&&typeof s.settings.quiet==='boolean'&&typeof s.settings.slow==='boolean');
 ensure(obj(s.expressions)&&obj(s.sessions)&&Array.isArray(s.events));
 for(const [id,e] of Object.entries(s.expressions))ensure(Object.hasOwn(expressions,id)&&obj(e)&&integer(e.stage,0,4)&&day(e.dueDate)&&day(e.lastCountedDate)&&e.dueDate>e.lastCountedDate&&['independent','retry'].includes(e.lastOutcome));
 for(const [id,t] of Object.entries(s.sessions)){
 ensure(identifier(id)&&obj(t)&&t.id===id&&!!getLesson(t.lessonId)&&[2,5,10].includes(t.minutes)&&['quiet','spoken'].includes(t.mode));
 ensure(Array.isArray(t.steps)&&t.steps.length>0&&t.steps.length<=20&&integer(t.cursor,0,t.steps.length)&&typeof t.completed==='boolean'&&t.completed===(t.cursor===t.steps.length)&&obj(t.marks));
 const seen=new Set();
 for(const step of t.steps){ensure(obj(step)&&identifier(step.id)&&!seen.has(step.id)&&['dialogue','choice','learn','recall','order','personal'].includes(step.kind));seen.add(step.id);if(['learn','recall','order'].includes(step.kind))ensure(Object.hasOwn(expressions,step.expressionId));else ensure(step.expressionId===undefined);}
 for(const [key,m] of Object.entries(t.marks))ensure(seen.has(key)&&obj(m)&&typeof m.hinted==='boolean'&&typeof m.wrong==='boolean');
 }
 ensure(s.activeSessionId===null||(identifier(s.activeSessionId)&&Object.hasOwn(s.sessions,s.activeSessionId)));
 const eventIds=new Set();for(const e of s.events){ensure(obj(e)&&identifier(e.id)&&!eventIds.has(e.id)&&day(e.date)&&typeof e.correct==='boolean'&&typeof e.hinted==='boolean'&&['objective','self','exposure'].includes(e.evidence));eventIds.add(e.id);const session=s.sessions[e.sessionId];ensure(!!session&&e.id===`${e.sessionId}:${e.stepId}`&&session.steps.slice(0,session.cursor).some(step=>step.id===e.stepId&&step.expressionId===e.expressionId));}
 for(const session of Object.values(s.sessions))for(const step of session.steps.slice(0,session.cursor))ensure(eventIds.has(`${session.id}:${step.id}`));
 if(s.vocabulary!==undefined){
 const v=s.vocabulary;ensure(obj(v)&&obj(v.saved));
 for(const [id,w] of Object.entries(v.saved))ensure(Object.hasOwn(words,id)&&obj(w)&&typeof w.selected==='boolean'&&integer(w.stage,0,4)&&day(w.dueDate)&&(w.lastCountedDate===null||day(w.lastCountedDate))&&(!w.lastCountedDate||w.dueDate>w.lastCountedDate)&&['new','independent','retry'].includes(w.lastOutcome));
 if(v.review!==null){const r=v.review;ensure(obj(r)&&identifier(r.id)&&Array.isArray(r.ids)&&r.ids.length>0&&r.ids.length<=3&&new Set(r.ids).size===r.ids.length&&r.ids.every(id=>Object.hasOwn(v.saved,id)&&v.saved[id].selected));ensure(integer(r.cursor,0,r.ids.length)&&typeof r.revealed==='boolean'&&typeof r.completed==='boolean'&&r.completed===(r.cursor===r.ids.length)&&['meaning','listen'].includes(r.mode));}
 }
 ensure(JSON.stringify(s).length<=MAX);return {ok:true};
 }catch(e){return {ok:false,error:e.message||'数据格式无效'};}
}
export function createStore(storage){
 const parseBackup=text=>{try{if(typeof text!=='string'||text.length>MAX)throw Error('备份文件过大或格式无效。');const state=JSON.parse(text),r=validateState(state);return r.ok?{ok:true,state}:r;}catch{return {ok:false,error:'无法读取备份，请选择本应用导出的 JSON 文件。'};}};
 const load=()=>{try{const raw=storage.getItem(STORAGE_KEY);if(raw===null)return {ok:true,state:initialState()};const r=parseBackup(raw);return r.ok?r:{...r,raw};}catch{return {ok:false,error:'无法访问设备存储。请检查浏览器设置。'};}};
 return {load,parseBackup,exportBackup:state=>JSON.stringify(state,null,2),
 save(state,expectedRevision){try{const current=load();if(!current.ok)return current;if(current.state.revision!==expectedRevision)return {ok:false,error:'其他页面已更新进度。请先导出未保存记录，再刷新此页面。',conflict:true};const next={...state,revision:expectedRevision+1},r=validateState(next);if(!r.ok)return r;storage.setItem(STORAGE_KEY,JSON.stringify(next));return {ok:true,state:next};}catch{return {ok:false,error:'未保存：设备存储不可用或空间不足。请导出备份后重试。'};}},
 recover(expectedRaw){try{if(storage.getItem(STORAGE_KEY)!==expectedRaw)return {ok:false,error:'原始记录已发生变化，请刷新。'};const state=initialState();storage.setItem(STORAGE_KEY,JSON.stringify(state));return {ok:true,state};}catch{return {ok:false,error:'无法重置设备存储。'};}}
 };
}

// localStorage read-check-write must be called inside an origin-wide lock.
export async function withStorageLock(locks,operation){
 if(!locks?.request)return {ok:false,error:'未保存：当前浏览器不支持安全保存。请使用新版 Safari 并通过 HTTPS 正式网址打开。'};
 try{return await locks.request('adult-english-save',operation);}catch{return {ok:false,error:'未保存：无法取得保存权限，请导出记录后重试。'};}
}
