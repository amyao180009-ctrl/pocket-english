import {lessons,getLesson,expressions} from './content.js';import {selectDue,localDate} from './learning.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const append=(node,...children)=>{children.flat().filter(Boolean).forEach(c=>node.append(c));return node;};
const labels={home:'今天',scenes:'场景',review:'复习',profile:'我的'};
export function render(root,state,ui,onAction){
 const action=(type,payload)=>onAction({type,payload});
 const btn=(text,type,payload,cls='button',disabled=false)=>{const b=el('button',cls,text);b.type='button';b.disabled=disabled;b.addEventListener('click',()=>action(type,payload));return b;};
 const title=(eyebrow,heading,sub)=>append(el('div','page-title'),el('p','eyebrow',eyebrow),el('h1','',heading),sub&&el('p','muted',sub));
 const card=(...children)=>append(el('section','card'),children);
 const active=state.sessions[state.activeSessionId];
 const due=selectDue(state,localDate(),42);
 const completed=new Set(Object.values(state.sessions).filter(s=>s.completed&&s.minutes!==2).map(s=>s.lessonId));
 const shell=el('div','shell');
 const brand=append(el('header','brand'),append(el('div','wordmark'),el('span','brand-icon','p.'),append(el('div'),el('strong','','碎片英语'),el('small','','POCKET ENGLISH'))),el('span','brand-note','给生活一点英语'));
 shell.append(brand);
 if(ui.error){shell.append(append(el('aside','notice error'),el('strong','','进度需要留意'),el('p','',ui.error),append(el('div','button-row'),btn('导出当前记录','export',null,'button small'),btn('刷新页面','reload',null,'button small secondary'),ui.pending&&btn('重试保存','retry',null,'button small'))));}
 if(ui.corruptRaw!==undefined){shell.append(card(el('h2','','原始记录无法读取'),el('p','muted','原始数据已保留。可以先下载原始记录，再确认重置。'),btn('下载原始记录','exportRaw',null,'button secondary'),btn('重置损坏记录','recover',null,'button danger')));root.replaceChildren(shell);return;}
 const main=el('main');main.id='main';
 const learnBtn=(minutes,cls='button')=>btn(`${minutes} 分钟${minutes===2?'复习':minutes===5?'短课':'完整练习'}`,'start',{minutes},cls);
 if(ui.page==='home'){
 main.append(title('A LITTLE, EVERY DAY','让英语，回到生活里。','不用等一段完整的时间。现在几分钟，就很好。'));
 const next=lessons.find(l=>!completed.has(l.id))||lessons[0];
 const hero=el('section','hero');
 append(hero,el('p','eyebrow','TODAY’S LITTLE CONVERSATION'),el('span','pill light','日常交流 · 原创短课'),el('h2','',active&&!active.completed?'接着上次，慢慢来。':next.title),el('p','hero-sub',active&&!active.completed?`${getLesson(active.lessonId).title} · 已完成 ${active.cursor}/${active.steps.length} 步`:next.subtitle));
 const bubble=append(el('div','conversation-art'),el('div','bubble first','How about you?'),el('div','bubble second','从一句话开始。'),el('span','spark','✦'));hero.append(bubble);
 hero.append(active&&!active.completed?btn('继续上次学习  ↗','resume',null,'button cream'):btn('开始 5 分钟短课  ↗','start',{minutes:5},'button cream'));main.append(hero);
 main.append(append(el('div','section-heading'),el('h2','','这会儿，有多少时间？'),el('span','muted small-text','随时可以暂停')));
 const times=el('div','time-grid');for(const [m,label,desc] of [[2,'唤醒记忆','复习几句就好'],[5,'学点新的','一段生活对话'],[10,'多聊一会','学习 + 表达']]){const b=btn('','start',{minutes:m},`time-card ${m===5?'featured':''}`);append(b,append(el('div','minutes'),el('strong','',String(m)),el('span','','分钟')),el('strong','',label),el('small','',desc));times.append(b);}main.append(times);
 main.append(append(el('section','review-strip'),append(el('div'),el('strong','',due.length?`${due.length} 个表达，等你再见一面`:'让学过的，慢慢变熟悉'),el('p','muted small-text',due.length?'先回忆，再看答案。': '到期复习会出现在这里，不用自己记日期。')),btn('去复习 →','nav','review','text-button')));
 main.append(append(el('div','section-heading'),el('h2','','把英语用在生活里'),btn('全部 14 课 →','nav','scenes','text-button')));
 const list=el('div','lesson-preview');for(const l of lessons.slice(0,3))list.append(lessonCard(l));main.append(list);
 main.append(el('p','footnote','一点点积累，不必连续打卡。漏一天，下次继续。'));
 }else if(ui.page==='scenes'){
 main.append(title('SMALL TALK, REAL LIFE','从你想聊的开始。',`14 节生活短课 · 已完成 ${completed.size} 节`));const list=el('div','lesson-grid');lessons.forEach(l=>list.append(lessonCard(l)));main.append(list);
 }else if(ui.page==='review'){
 main.append(title('HELLO AGAIN','再见一次，就更熟一点。','先试着回忆，再看答案。练习记录不等于口语评分。'));
 main.append(card(append(el('div','review-number'),el('strong','',String(due.length)),el('span','','个表达到期')),el('p','muted',due.length?'每次最多复习 3 个，轻松开始。':Object.keys(state.expressions).length?'今天没有到期内容，也可以温习已经学过的表达。':'先学一句，再把它慢慢记住。'),learnBtn(2)));
 const ids=due.length?due:Object.keys(state.expressions);for(const id of ids){const e=expressions[id],r=state.expressions[id];main.append(card(el('p','en small-en',e.en),el('p','',e.zh),el('small','muted',`下次复习 ${r.dueDate} · ${r.lastOutcome==='retry'?'需要再练':'已独立练习'}`)));}
 }else if(ui.page==='profile'){
 main.append(title('YOUR OWN PACE','按自己的节奏。','学习记录只保存在当前设备，请定期导出备份。'));
 main.append(append(el('div','stats'),card(el('strong','stat',String(completed.size)),el('span','','完成短课')),card(el('strong','stat',String(Object.keys(state.expressions).length)),el('span','','练过的表达'))));
 main.append(card(el('h2','','练习偏好'),btn(`${state.settings.quiet?'☑':'○'} 安静模式`,'setting','quiet','setting-button'),el('p','muted small-text','新任务使用阅读与句子排列，当前任务保持原模式。'),btn(`${state.settings.slow?'☑':'○'} 慢速朗读`,'setting','slow','setting-button'),el('p','muted small-text','设备需有可用的英语声音。没有声音时仍可做文字练习。')));
 const backup=card(el('h2','','把进度留好'),el('p','muted','清理浏览器数据或更换设备可能丢失记录。导出后请妥善保存 JSON 文件。'),btn('导出学习备份','export',null,'button secondary'));
 const label=el('label','file-label','导入备份');const input=el('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',()=>{if(input.files[0])action('import',input.files[0]);});label.append(input);backup.append(label);main.append(backup);
 const statuses={preparing:'正在准备离线文字课程…',ready:'文字课程已缓存，可离线练习',error:'离线准备失败，请联网后重试',unsupported:'当前环境不支持离线安装',updateAvailable:'有新版本，下次结束学习后可更新'};
 main.append(card(el('h2','','在 iPhone 上使用'),el('p','', '用 Safari 打开正式网址，点分享，再选“添加到主屏幕”。'),el('p','muted',statuses[ui.offline]||'离线状态尚未确认'),el('p','muted small-text','朗读依赖设备声音，离线发音需单独验证。'),ui.offline==='updateAvailable'&&btn('更新应用','update',null,'button secondary'),el('p','footnote','原创练习内容 · 无账号 · 无自动口语评分')));
 main.append(btn('重置全部学习进度','reset',null,'text-button danger'));
 }else if(ui.page==='learn'&&active){
 const lesson=getLesson(active.lessonId);
 if(active.completed){
 const ev=state.events.filter(e=>e.sessionId===active.id&&e.expressionId&&e.evidence!=='exposure');const retry=ev.filter(e=>!e.correct||e.hinted);
 main.append(append(el('section','completion'),el('div','completion-mark','✓'),el('p','eyebrow','A LITTLE PROGRESS'),el('h1','','今天，又多会一点。'),el('p','muted',`完成「${lesson.title}」${active.minutes===2?'的小练习':''}。现在可以安心结束。`)));
 main.append(card(el('h2','',`练过 ${ev.length} 个表达`),el('p','muted',retry.length?`${retry.length} 个表达需要再练，已保留提示或错误记录。`:'这次练习已记录，之后会安排复习。'),el('p','footnote',active.mode==='spoken'?'口语结果来自你的自评，不代表自动评分。':'完成文字练习不等于已掌握口语。'),btn('今天先到这里','nav','home'),btn('看看其他场景','nav','scenes','button secondary')));
 }else{
 const step=active.steps[active.cursor],e=expressions[step.expressionId],mark=active.marks[step.id]||{};
 main.append(append(el('div','lesson-top'),btn('← 暂停','nav','home','text-button'),el('span','muted small-text',`${active.mode==='quiet'?'安静练习':'开口练习'} · ${active.cursor+1}/${active.steps.length}`)));
 const bar=el('div','progress-track');const fill=el('div','progress-fill');fill.style.width=`${active.cursor/active.steps.length*100}%`;bar.append(fill);main.append(bar);
 main.append(title(`LESSON ${lessons.indexOf(lesson)+1} · ${lesson.title}`,{dialogue:'先听一段生活。',choice:'你听懂了吗？',learn:'这句话，很用得上。',recall:'不看英文，试着说。',order:'把这句话，拼出来。',personal:'换成你的生活。'}[step.kind]));
 const body=card();
 if(step.kind==='dialogue'){
 lesson.dialogue.forEach((d,i)=>{const row=append(el('div',`dialogue-row speaker-${d.speaker}`),el('span','avatar',d.speaker),append(el('div','dialogue-copy'),el('p','en',d.en),ui.translation&&el('p','translation',d.zh),btn('▷ 听这一句','speak',d.en,'audio-button')));body.append(row);});body.append(btn(ui.translation?'收起中文':'查看中文','translation',null,'text-button'));body.append(btn('听懂了，试一题 →','advance',{evidence:'exposure'}));
 }else if(step.kind==='choice'){
 body.append(el('h2','',lesson.question.prompt));lesson.question.options.forEach((o,i)=>body.append(btn(`${String.fromCharCode(65+i)}  ${o}`,'choice',i,'option',ui.answered===true)));
 if(ui.feedback)body.append(el('p',`feedback ${ui.answered?'correct':''}`,ui.feedback));if(ui.answered)body.append(btn('继续学表达 →','advance',{evidence:'objective'}));
 }else if(step.kind==='learn'){
 body.append(el('span','pill','实用表达'),el('p','en expression',e.en),el('p','translation',e.zh),btn('▷ 听示范','speak',e.en,'button secondary'),el('p','note',e.note),btn('准备好了，试着回忆 →','advance',{evidence:'exposure'}));
 }else if(step.kind==='recall'){
 body.append(el('p','recall-zh',e.zh),el('p','muted','先自己说一句。不用完美，能表达意思就好。'));
 if(mark.hinted||ui.reveal)body.append(el('p','en expression',e.en),btn('▷ 听示范','speak',e.en,'audio-button'));
 else body.append(btn('想不起来，看看提示','hint',null,'button secondary'));
 body.append(btn(mark.hinted?'跟着练过了，继续':'我能独立说出','advance',{correct:true,evidence:'self'}));
 body.append(btn('还需要再练','advance',{correct:false,evidence:'self'},'button secondary'));body.append(el('small','muted','这里记录你的自评，不录音、不自动打分。'));
 }else if(step.kind==='order'){
 body.append(el('p','recall-zh',e.zh));const picked=ui.picked||[];const tray=el('div','word-tray');if(!picked.length)tray.append(el('span','muted','点下面的词，组成英文句子'));picked.forEach((idx,j)=>tray.append(btn(e.tokens[idx],'unpick',j,'word selected')));body.append(tray);
 const bank=el('div','word-bank');const indexes=e.tokens.map((_,i)=>i);const shuffled=indexes.filter(i=>i%2).reverse().concat(indexes.filter(i=>i%2===0).reverse());shuffled.forEach(i=>bank.append(btn(e.tokens[i],'pick',i,'word',picked.includes(i)||ui.answered)));body.append(bank);
 if(mark.hinted)body.append(el('p','en small-en',e.en));else body.append(btn('看一下提示','hint',null,'text-button'));
 if(ui.feedback)body.append(el('p',`feedback ${ui.answered?'correct':''}`,ui.feedback));
 body.append(ui.answered?btn('继续 →','advance',{evidence:'objective'}):btn('检查句子','check',null,'button',picked.length!==e.tokens.length));
 }else if(step.kind==='personal'){
 body.append(el('h2','',lesson.personalPrompt),el('p','muted',active.mode==='quiet'?'在心里组织一句话，或写在自己的备忘录里。':'试着用一句简单的英语回答，可以用自己的真实信息。'));
 if(mark.hinted)body.append(el('p','en',lesson.expressions[0].en),el('p','muted','这是参考表达，不是唯一答案。'));else body.append(btn('看看参考表达','hint',null,'button secondary'));
 body.append(btn('我练习过了','advance',{evidence:'self'}));
 }
 const audio=el('p','audio-status');audio.id='audio-status';audio.setAttribute('role','status');body.append(audio);main.append(body);main.append(el('p','footnote','自动保存进度 · 随时暂停，下次继续'));
 }
 }else{main.append(title('TAKE YOUR TIME','从今天开始。'),btn('回到首页','nav','home'));}
 shell.append(main);
 const nav=el('nav','bottom-nav');nav.setAttribute('aria-label','主导航');for(const [key,label] of Object.entries(labels)){const b=btn('','nav',key,`nav-item ${ui.page===key?'active':''}`);append(b,el('span','nav-icon',{home:'◒',scenes:'▦',review:'↻',profile:'◯'}[key]),el('span','',label));if(ui.page===key)b.setAttribute('aria-current','page');nav.append(b);}shell.append(nav);root.replaceChildren(shell);
 function lessonCard(l){const b=btn('','start',{minutes:5,lessonId:l.id},'lesson-card');append(b,el('span','lesson-icon',l.icon),append(el('div','lesson-card-copy'),el('small','muted',`SCENE ${String(lessons.indexOf(l)+1).padStart(2,'0')}${completed.has(l.id)?' · 已完成':''}`),el('strong','',l.title),el('span','muted small-text',l.subtitle)),el('span','arrow','↗'));return b;}
}
