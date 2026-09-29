export function buildSteps(lesson,minutes,mode,reviewIds=[]){
 const steps=[];const add=(kind,expressionId)=>steps.push({id:`step-${steps.length}`,kind,...(expressionId?{expressionId}:{})});
 const practice=mode==='quiet'?'order':'recall';
 if(minutes===2){if(reviewIds.length)reviewIds.forEach(id=>add(practice,id));else {add('learn',lesson.expressions[0].id);add(practice,lesson.expressions[0].id);}return steps;}
 add('dialogue');add('choice');for(const e of lesson.expressions){add('learn',e.id);add(practice,e.id);}
 if(minutes===10){add('personal');reviewIds.filter(id=>!lesson.expressions.some(e=>e.id===id)).forEach(id=>add(practice,id));}return steps;
}
const normalize=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,]/g,'').trim().replace(/\s+/g,' ');
export const gradeOrder=(tokens,expression)=>normalize(tokens.join(' '))===normalize(expression.en);
