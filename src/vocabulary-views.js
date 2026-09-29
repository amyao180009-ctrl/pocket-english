import {words,wordsForLesson} from './vocabulary-content.js';import {selectedWords,wordDue} from './vocabulary.js';import {lessons,getLesson} from './content.js';import {localDate} from './learning.js';
export function vocabularyView({state,ui,el,append,btn,card,title}){
 const main=el('div'),selected=selectedWords(state),due=wordDue(state,localDate()),review=state.vocabulary?.review;
 if(ui.page==='wordReview'&&review){
 if(review.completed){main.append(title('A FEW WORDS, A LITTLE CLOSER','这轮词汇复习完成了。',`练过 ${review.ids.length} 个词或短语，今天可以到这里。`),card(el('p','muted','回忆结果来自你的自评。没有额外增加今日任务，下次按自己的时间继续。'),btn('回到生词本','word-book')));return main;}
 const id=review.ids[review.cursor],w=words[id];main.append(append(el('div','lesson-top'),btn('← 暂停词汇复习','word-book',null,'text-button'),el('span','muted small-text',`${review.cursor+1} / ${review.ids.length}`)),title('TWO MINUTES FOR WORDS',review.mode==='listen'?'听一听，想起它的意思。':'看中文，想一想英文。','先回忆，再揭晓。不用输入，也不用严格拼写。'));
 const body=card();if(review.mode==='listen'){body.append(btn('▷ 听单词','speak',w.word,'button secondary'));if(!review.revealed)body.append(btn('改用中文提示','word-mode',null,'text-button'));}else body.append(el('p','recall-zh',w.zh));
 if(!review.revealed)body.append(btn('揭晓答案','word-reveal'));
 else {body.append(el('p','en expression',w.word),el('p','',w.zh),el('p','note','回到你学过的句子'),el('p','en',w.example),el('p','translation',w.exampleZh),btn('▷ 听例句','speak',w.example,'audio-button'));for(const [text,correct] of [['回忆正确',true],['需要再练',false]])body.append(btn(text,'word-answer',{id:review.id,index:review.cursor,correct},correct?'button':'button secondary'));}
 main.append(body);return main;
 }
 const detail=words[ui.wordId];
 if(detail){const inBook=!!state.vocabulary?.saved[detail.id]?.selected;main.append(btn(ui.wordReturn==='learn'?'返回课程':'返回生词本','word-close',null,'text-button'),title('WORD IN CONTEXT',detail.word,detail.zh),card(btn('▷ 听单词','speak',detail.word,'button secondary'),el('p','en',detail.example),el('p','translation',detail.exampleZh),btn('▷ 听例句','speak',detail.example,'audio-button'),el('p','muted small-text',`来自「${getLesson(detail.lessonId).title}」· 此处释义对应课程语境`),btn(inBook?'已收藏 · 移出生词本':'加入生词本','word-toggle',detail.id,inBook?'button secondary':'button')));return main;}
 main.append(title('WORDS FROM YOUR LIFE','把不熟悉的词，留下来。',`已收藏 ${selected.length} 个 · 今天到期 ${due.length} 个`));
 if(selected.length){main.append(card(el('h2','','2 分钟词汇复习'),el('p','muted',due.length?'每次最多 3 个，优先复习到期词。':'今天没有到期词，可以温习生词本；提前复习不会推迟原定日期。'),review&&!review.completed?btn('继续词汇复习','word-resume'):append(el('div','button-row'),btn('看中文想英文','word-start','meaning','button'),btn('听音想词义','word-start','listen','button secondary'))));}
 else main.append(card(el('p','muted','先从课程中收藏不熟悉的词。每课精选 3 个，也包括常用短语。')));
 const all=ui.wordFilter==='all';main.append(append(el('div','word-tabs'),btn('我的生词','word-filter','saved',!all?'button':'button secondary'),btn('全部课程词汇','word-filter','all',all?'button':'button secondary')));
 for(const lesson of lessons){const list=wordsForLesson(lesson.id).filter(w=>all||selected.includes(w.id));if(!list.length)continue;main.append(append(el('div','section-heading'),el('h2','',lesson.title)));for(const w of list){const b=btn('','word-open',w.id,'lesson-card word-entry');append(b,append(el('div','lesson-card-copy'),el('strong','en',w.word),el('span','muted small-text',w.zh)),el('span','arrow',selected.includes(w.id)?'已收藏 ↗':'查看 ↗'));main.append(b);}}
 return main;
}
// Interactive terms are limited to the curated vocabulary of the current course.
export function vocabularySentence(text,lessonId,cls,{el,btn}){
 const node=el('p',cls),terms=wordsForLesson(lessonId).sort((a,b)=>b.word.length-a.word.length);if(!terms.length){node.textContent=text;return node;}
 const escaped=terms.map(w=>w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));const re=new RegExp('\\b('+escaped.join('|')+')\\b','gi');let start=0;
 for(const match of text.matchAll(re)){if(match.index>start)node.append(el('span','',text.slice(start,match.index)));const w=terms.find(w=>w.word.toLowerCase()===match[0].toLowerCase());const b=btn(match[0],'word-open',w.id,'inline-word');b.setAttribute('aria-label',`${match[0]}，查看词义`);node.append(b);start=match.index+match[0].length;}
 if(start<text.length)node.append(el('span','',text.slice(start)));return node;
}
