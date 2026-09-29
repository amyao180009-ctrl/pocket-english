import {lessons,getLesson} from './content.js';import {buildSteps} from './activities.js';
export const initialState=()=>({version:1,revision:0,settings:{quiet:false,slow:false},expressions:{},sessions:{},activeSessionId:null,events:[]});
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function addDays(day,n){const [y,m,d]=day.split('-').map(Number);return localDate(new Date(y,m-1,d+n,12));}
export function selectDue(state,day,limit=3){return Object.keys(state.expressions).filter(id=>state.expressions[id].dueDate<=day).sort((a,b)=>state.expressions[a].dueDate.localeCompare(state.expressions[b].dueDate)||a.localeCompare(b)).slice(0,limit);}
export function startSession(state,{id,minutes,mode,lessonId,day}){
 if(state.activeSessionId&&!state.sessions[state.activeSessionId].completed)return state;
 const lesson=getLesson(lessonId)||lessons.find(l=>!Object.values(state.sessions).some(s=>s.completed&&s.minutes!==2&&s.lessonId===l.id))||lessons[0];
 let review=selectDue(state,day);if(minutes===2&&!review.length)review=Object.keys(state.expressions).slice(0,3);
 const next=structuredClone(state);next.sessions[id]={id,lessonId:lesson.id,minutes,mode,steps:buildSteps(lesson,minutes,mode,review),cursor:0,completed:false,marks:{}};next.activeSessionId=id;return next;
}
export function markAttempt(state,sessionId,{hinted=false,wrong=false}){const next=structuredClone(state),s=next.sessions[sessionId];if(!s||s.completed)return state;const step=s.steps[s.cursor];const old=s.marks[step.id]||{};s.marks[step.id]={hinted:!!(old.hinted||hinted),wrong:!!(old.wrong||wrong)};return next;}
export function applyEvent(state,event){
 if(state.events.some(e=>e.id===event.id))return state;
 const current=state.sessions[event.sessionId];if(!current||current.completed)return state;
 const step=current.steps[current.cursor];if(step.id!==event.stepId)return state;
 const next=structuredClone(state),s=next.sessions[event.sessionId],marks=s.marks[step.id]||{};
 const e={...event,expressionId:step.expressionId,correct:event.correct&&!marks.wrong,hinted:event.hinted||!!marks.hinted};
 if(!step.expressionId)delete e.expressionId;
 next.events.push(e);
 if(['recall','order'].includes(step.kind)){
 const old=next.expressions[step.expressionId];
 if(!old||event.date>old.lastCountedDate){
 const good=e.correct&&!e.hinted;
 if(!old||!good||old.dueDate<=event.date){const stage=good&&old?Math.min(4,old.stage+1):0;next.expressions[step.expressionId]={stage,dueDate:addDays(event.date,[1,3,7,14,30][stage]),lastCountedDate:event.date,lastOutcome:good?'independent':'retry'};}
 }
 }
 s.cursor++;s.completed=s.cursor===s.steps.length;return next;
}
