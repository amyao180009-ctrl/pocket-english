import {lessons} from './content.js';
// Meanings below are specific to the original lesson examples, not a general dictionary.
const rows=[
 [['nice','愉快的；友好的'],['live','居住'],['about','关于；How about you? 表示“你呢？”']],
 [['usually','通常'],['walk','散步'],['sounds','听起来（sound 的第三人称单数）']],
 [['listening','听（listen 的 -ing 形式）'],['too','也'],['kind','种类']],
 [['tea','茶'],['hot','热的'],['to go','打包带走']],
 [['recommend','推荐'],['soup','汤'],['bill','账单']],
 [['shirt','衬衫'],['blue','蓝色的'],['medium','中等尺码；中码']],
 [['excuse','原谅；Excuse me 用于礼貌打扰'],['far','远的'],['left','左边；向左']],
 [['station','车站'],['long','长的；How long 询问时长'],['stop','停下；停车']],
 [['warm','暖和的'],['want','想要'],['park','公园']],
 [['yesterday','昨天'],['went','去（go 的过去式）'],['bought','买（buy 的过去式）']],
 [['plans','计划（复数）'],['visit','看望；拜访'],['fun','有趣的；乐趣']],
 [['coffee','咖啡'],['busy','忙的；有事的'],['Sunday','星期日']],
 [['help','帮助'],['find','找到'],['again','再一次']],
 [['day','一天；日子'],['really','真的吗；确实'],['talking','交谈（talk 的 -ing 形式）']]
];
export const words=Object.fromEntries(lessons.flatMap((l,i)=>rows[i].map(([word,zh],j)=>{const example=l.expressions[j];const id=`l${i+1}-w${j+1}`;return [id,{id,lessonId:l.id,word,zh,example:example.en,exampleZh:example.zh}];})));
export const wordsForLesson=id=>Object.values(words).filter(w=>w.lessonId===id);
