'use strict';

const ITEMS = [
  {id:'colour',category:'words',en:['colour','color'],enDisplay:'colour',nl:['kleur']},
  {id:'awkward',category:'words',en:['awkward'],enDisplay:'awkward',nl:['ongemakkelijk']},
  {id:'clumsy',category:'words',en:['clumsy'],enDisplay:'clumsy',nl:['onhandig']},
  {id:'messy',category:'words',en:['messy'],enDisplay:'messy',nl:['slordig, rommelig','slordig','rommelig']},
  {id:'impatient',category:'words',en:['impatient'],enDisplay:'impatient',nl:['ongeduldig']},
  {id:'shy',category:'words',en:['shy'],enDisplay:'shy',nl:['verlegen']},
  {id:'serious',category:'words',en:['serious'],enDisplay:'serious',nl:['serieus']},
  {id:'talkative',category:'words',en:['talkative'],enDisplay:'talkative',nl:['spraakzaam']},
  {id:'patient',category:'words',en:['patient'],enDisplay:'patient',nl:['geduldig']},
  {id:'surname',category:'words',en:['surname'],enDisplay:'surname',nl:['achternaam']},
  {id:'country',category:'words',en:['country'],enDisplay:'country',nl:['land']},
  {id:'first-name',category:'words',en:['first name'],enDisplay:'first name',nl:['voornaam']},
  {id:'kind-of-music',category:'words',en:['kind of music'],enDisplay:'kind of music',nl:['soort muziek']},
  {id:'easy',category:'words',en:['easy'],enDisplay:'easy',nl:['makkelijk']},
  {id:'usually',category:'words',en:['usually'],enDisplay:'usually',nl:['meestal']},
  {id:'keeping-secrets',category:'words',en:['keeping secrets'],enDisplay:'keeping secrets',nl:['geheimen bewaren']},
  {id:'singer',category:'words',en:['singer'],enDisplay:'singer',nl:['zanger']},
  {id:'musician',category:'words',en:['musician'],enDisplay:'musician',nl:['muzikant']},
  {id:'enthusiastic',category:'words',en:['enthusiastic'],enDisplay:'enthusiastic',nl:['enthousiast']},
  {id:'play-football',category:'phrases',en:['Do you play football?'],enDisplay:'Do you play football?',nl:['Speel jij voetbal?']},
  {id:'siblings',category:'phrases',en:['Do you have any siblings?'],enDisplay:'Do you have any siblings?',nl:['Heb je broers of zussen?']},
  {id:'good-at',category:'phrases',en:['What are you good at?'],enDisplay:'What are you good at?',nl:['Waar ben je goed in?']},
  {id:'free-time',category:'phrases',en:['What do you like doing in your free time?'],enDisplay:'What do you like doing in your free time?',nl:['Wat doe jij graag in je vrije tijd?']},
  {id:'grow-up',category:'phrases',en:['What do you want to be when you grow up?'],enDisplay:'What do you want to be when you grow up?',nl:['Wat wil je later worden?']},
  {id:'favourite-food',category:'phrases',en:['What is your favourite food?','What is your favorite food?'],enDisplay:'What is your favourite food?',nl:['Wat is jouw lievelingseten?']},
  {id:'birthday',category:'phrases',en:['When is your birthday?'],enDisplay:'When is your birthday?',nl:['Wanneer ben je jarig?']},
  {id:'come-from',category:'phrases',en:['Where do you come from?'],enDisplay:'Where do you come from?',nl:['Waar kom je vandaan?']},
  {id:'after',category:'time',en:['after'],enDisplay:'after',nl:['na'],example:'We can play together after lunch.'},
  {id:'at',category:'time',en:['at'],enDisplay:'at',nl:['om'],example:"Let's meet at 2 pm."},
  {id:'before',category:'time',en:['before'],enDisplay:'before',nl:['voor'],example:"Let's go swimming before dinner."},
  {id:'during',category:'time',en:['during'],enDisplay:'during',nl:['tijdens'],example:'We can talk during our walk home.'},
  {id:'on',category:'time',en:['on'],enDisplay:'on',nl:['op'],example:'I always play football on Saturdays.'},
  {id:'until',category:'time',en:['until'],enDisplay:'until',nl:['tot'],example:'They stayed until the end of the concert.'}
];

const STORAGE_KEY='englishlab-progress-v3';
const PREVIOUS_KEYS=['englishlab-progress-v2','englishlab-progress-v1'];
const CATEGORY_LABELS={words:'Woord',phrases:'Zin',time:'Tijdwoord'};
const $=s=>document.querySelector(s);
const pageMode=document.body.dataset.mode||'home';

const GOOD_QUOTES=[
  'Woef, goed gedaan!',
  'Poot-tastisch!',
  'Yes! Mijn staart kwispelt ervan.',
  'Heel knap! Daar zou ik voor blaffen.',
  'Brokkenwaardig goed!',
  'Jij bent sneller dan ik een bal kan halen.',
  'Woef woef! Die zat helemaal goed.',
  'Pootje erop. Perfect!'
];
const WRONG_QUOTES=[
  'Bijna! Nog één snuffelronde.',
  'Oepsie-woef. Deze pakken we later nog eens.',
  'Geeft niks, ik ruik het goede antwoord al.',
  'Hmm... mijn hondenneus zegt: nog een keer proberen.',
  'Niet erg. Zelfs ik vang niet élke bal.'
];
const ASK_QUOTES=[
  'Oké, deze dan!',
  'Snuffel eens aan deze vraag...',
  'Ik heb er eentje voor je!',
  'Woef! Weet jij deze?',
  'Pootjes klaar? Hier komt-ie.'
];

let progress=loadProgress();
let sessionCorrect=0;
let sessionAttempts=0;
let currentItem=null;
let currentDirection='en-nl';
let revealed=false;
let answered=false;
let learnTimer=null;
let dragGhost=null;

function defaultMeta(){return {streak:0,bones:0,boneProgress:0};}
function loadProgress(){
  let data={};
  try{
    data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};
    const hasItems=Object.keys(data).some(k=>k!=='_meta');
    if(!hasItems){
      for(const key of PREVIOUS_KEYS){
        const old=JSON.parse(localStorage.getItem(key)||'{}')||{};
        if(Object.keys(old).some(k=>k!=='_meta')){data=old;break;}
      }
    }
  }catch(e){data={};}
  data._meta=Object.assign(defaultMeta(),data._meta||{});
  ITEMS.forEach(item=>{
    const p=data[item.id];
    if(p&&typeof p.level!=='number') p.level=Math.max(0,Math.min(3,(p.correct||0)-(p.wrong||0)));
  });
  return data;
}
function saveProgress(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch(e){}
}
function ensureState(item){
  if(!progress[item.id]) progress[item.id]={correct:0,wrong:0,level:0};
  const p=progress[item.id];
  if(typeof p.correct!=='number')p.correct=0;
  if(typeof p.wrong!=='number')p.wrong=0;
  if(typeof p.level!=='number')p.level=Math.max(0,Math.min(3,p.correct-p.wrong));
  return p;
}
function randomFrom(list){return list[Math.floor(Math.random()*list.length)];}
function shuffle(list){
  const copy=list.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function normalize(value){
  return String(value||'').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
function displayEn(item){return item.enDisplay||item.en[0];}
function displayNl(item){return item.nl[0];}
function stateFor(item){return ensureState(item);}
function isMastered(item){return stateFor(item).level>=3;}
function totalAttempts(){return ITEMS.reduce((sum,item)=>sum+stateFor(item).correct+stateFor(item).wrong,0);}
function totalCorrect(){return ITEMS.reduce((sum,item)=>sum+stateFor(item).correct,0);}
function learningSteps(){return ITEMS.reduce((sum,item)=>sum+stateFor(item).level,0);}
function getMistakes(){return ITEMS.filter(item=>{const p=stateFor(item);return p.wrong>0&&p.level<3;});}
function getPool(){
  const category=$('#categorySelect')?$('#categorySelect').value:'all';
  if(category==='mistakes')return getMistakes();
  if(category==='all')return ITEMS.slice();
  return ITEMS.filter(item=>item.category===category);
}
function chooseDirection(){
  const selected=$('#directionSelect')?$('#directionSelect').value:'mix';
  return selected==='mix'?(Math.random()<.5?'en-nl':'nl-en'):selected;
}
function pickItem(forcedCategory){
  let pool=forcedCategory?ITEMS.filter(i=>i.category===forcedCategory):getPool();
  if(!pool.length){
    if($('#categorySelect'))$('#categorySelect').value='all';
    pool=ITEMS.slice();
    sayDog('Geen foutjes meer in deze lijst. Netjes hoor!');
  }
  if(pool.length===1)return pool[0];
  let next=pool[Math.floor(Math.random()*pool.length)],tries=0;
  while(currentItem&&next.id===currentItem.id&&tries<8){next=pool[Math.floor(Math.random()*pool.length)];tries++;}
  return next;
}
function sayDog(text){
  if($('#dogSpeech'))$('#dogSpeech').textContent=text;
}
function questionFor(item,direction){
  const enPrompt=direction==='en-nl';
  if(pageMode==='learn')return enPrompt?'Ken jij de Nederlandse betekenis van “'+displayEn(item)+'”?':'Hoe zeg je “'+displayNl(item)+'” in het Engels?';
  if(pageMode==='quiz')return enPrompt?'Wat betekent “'+displayEn(item)+'” in het Nederlands?':'Hoe zeg je “'+displayNl(item)+'” in het Engels?';
  if(pageMode==='type')return enPrompt?'Typ de Nederlandse vertaling van “'+displayEn(item)+'”.':'Typ de Engelse vertaling van “'+displayNl(item)+'”.';
  if(pageMode==='time')return 'Welk tijdwoord mist er in deze zin?';
  return 'Woef! Klaar om te oefenen?';
}
function recordResult(item,correct){
  const p=ensureState(item);
  let earnedBone=false;
  if(correct){
    p.correct++;
    p.level=Math.min(3,p.level+1);
    sessionCorrect++;
    progress._meta.streak=(progress._meta.streak||0)+1;
    progress._meta.boneProgress=(progress._meta.boneProgress||0)+1;
    if(progress._meta.boneProgress>=2){
      progress._meta.boneProgress=0;
      progress._meta.bones=(progress._meta.bones||0)+1;
      earnedBone=true;
    }
  }else{
    p.wrong++;
    p.level=Math.max(0,p.level-1);
    progress._meta.streak=0;
  }
  sessionAttempts++;
  saveProgress();
  updateStats();
  updateBoneUI();
  if(earnedBone){
    showBoneReward();
  }else{
    sayDog(correct?randomFrom(GOOD_QUOTES):randomFrom(WRONG_QUOTES));
  }
  return earnedBone;
}
function updateStats(){
  const mastered=ITEMS.filter(isMastered).length;
  const steps=learningSteps(),maxSteps=ITEMS.length*3;
  const percent=Math.round(steps/maxSteps*100);
  if($('#masteredCount'))$('#masteredCount').textContent=mastered;
  if($('#sessionScore'))$('#sessionScore').textContent=sessionCorrect+'/'+sessionAttempts;
  if($('#streakCount'))$('#streakCount').textContent=progress._meta.streak||0;
  if($('#progressPercent'))$('#progressPercent').textContent=percent+'%';
  if($('#progressBar'))$('#progressBar').style.width=percent+'%';
  if($('#attemptCount'))$('#attemptCount').textContent=totalAttempts();
  if($('#accuracyCount')){const n=totalAttempts();$('#accuracyCount').textContent=n?Math.round(totalCorrect()/n*100)+'%':'—';}
  if($('#progressMessage'))$('#progressMessage').textContent='Voortgang: '+steps+' van '+maxSteps+' leerstappen. Elk goed antwoord telt meteen mee.';
}
function updateBoneUI(){
  const bones=progress._meta.bones||0;
  const step=progress._meta.boneProgress||0;
  if($('#boneCount'))$('#boneCount').textContent=bones;
  if($('#boneHomeCount'))$('#boneHomeCount').textContent=bones;
  if($('#boneProgress'))$('#boneProgress').style.width=(step*50)+'%';
  if($('#answersToBone'))$('#answersToBone').textContent=2-step;
  const token=$('#boneToken');
  if(token){
    token.disabled=bones<1;
    token.classList.toggle('has-bone',bones>0);
    token.setAttribute('aria-label',bones>0?'Sleep een botje naar Pip. Je hebt '+bones+' botjes.':'Je hebt nog geen botjes.');
  }
  if($('#boneHint')){
    $('#boneHint').innerHTML=bones>0
      ?'Je hebt <b>'+bones+'</b> botje'+(bones===1?'':'s')+'. Sleep er eentje naar Pip!'
      :'Nog <b id="answersToBone">'+(2-step)+'</b> goede antwoord'+(2-step===1?'':'en')+' voor een botje.';
  }
}
function showBoneReward(){
  const toast=$('#rewardToast');
  if(toast){
    toast.hidden=false;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(()=>{toast.hidden=true;toast.classList.remove('show');},1450);
  }
  sayDog('WOOF! Je hebt een botje verdiend! Sleep ’m naar mij!');
}
function bark(){
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    const ctx=new AudioCtx();
    const now=ctx.currentTime;
    [0,.18].forEach((offset,index)=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(index?210:170,now+offset);
      osc.frequency.exponentialRampToValueAtTime(index?95:75,now+offset+.12);
      gain.gain.setValueAtTime(.0001,now+offset);
      gain.gain.exponentialRampToValueAtTime(.22,now+offset+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.15);
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start(now+offset);osc.stop(now+offset+.16);
    });
    setTimeout(()=>ctx.close(),700);
  }catch(e){}
}
function feedDog(){
  if((progress._meta.bones||0)<1)return false;
  progress._meta.bones--;
  saveProgress();updateBoneUI();
  const zone=$('#dogDropZone');
  if(zone){
    zone.classList.remove('fed');void zone.offsetWidth;zone.classList.add('fed');
    setTimeout(()=>zone.classList.remove('fed'),900);
  }
  sayDog(randomFrom([
    'WOOF! Dankjewel! ♥',
    'Jaaaa! Botje! Jij bent mijn favoriete mens. ♥',
    'Woef woef! Deze is heerlijk! ♥',
    'Botje ontvangen. Staart op standje turbo! ♥'
  ]));
  bark();
  return true;
}
function setupBoneDrag(){
  const token=$('#boneToken'),zone=$('#dogDropZone');
  if(!token||!zone)return;

  token.addEventListener('dragstart',e=>{
    if(token.disabled){e.preventDefault();return;}
    e.dataTransfer.setData('text/plain','bone');
    e.dataTransfer.effectAllowed='move';
  });
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drop-ready');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drop-ready'));
  zone.addEventListener('drop',e=>{
    e.preventDefault();zone.classList.remove('drop-ready');
    if(e.dataTransfer.getData('text/plain')==='bone')feedDog();
  });

  token.addEventListener('pointerdown',e=>{
    if(token.disabled||e.pointerType==='mouse')return;
    e.preventDefault();
    dragGhost=document.createElement('div');
    dragGhost.className='bone-drag-ghost';
    dragGhost.textContent='🦴';
    document.body.appendChild(dragGhost);
    moveGhost(e.clientX,e.clientY);
    token.setPointerCapture(e.pointerId);
    zone.classList.add('drop-ready');
  });
  token.addEventListener('pointermove',e=>{
    if(!dragGhost)return;
    moveGhost(e.clientX,e.clientY);
  });
  token.addEventListener('pointerup',e=>{
    if(!dragGhost)return;
    const ghost=dragGhost;ghost.style.display='none';
    const target=document.elementFromPoint(e.clientX,e.clientY);
    const hit=target&&target.closest&&target.closest('#dogDropZone');
    ghost.remove();dragGhost=null;zone.classList.remove('drop-ready');
    if(hit)feedDog();
  });
  token.addEventListener('pointercancel',()=>{
    if(dragGhost){dragGhost.remove();dragGhost=null;}
    zone.classList.remove('drop-ready');
  });
}
function moveGhost(x,y){if(dragGhost){dragGhost.style.left=x+'px';dragGhost.style.top=y+'px';}}

function renderLearn(){
  if(learnTimer){clearTimeout(learnTimer);learnTimer=null;}
  currentItem=pickItem();currentDirection=chooseDirection();revealed=false;answered=false;
  const enPrompt=currentDirection==='en-nl';
  $('#learnCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#learnCounter').textContent=getPool().length+' in deze set';
  $('#flashPromptLabel').textContent=enPrompt?'Engels':'Nederlands';
  $('#flashPrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#flashAnswer').textContent=enPrompt?displayNl(currentItem):displayEn(currentItem);
  $('#flashAnswer').hidden=true;$('#tapHint').hidden=false;
  sayDog(questionFor(currentItem,currentDirection));
}
function revealLearn(){
  revealed=true;$('#flashAnswer').hidden=false;$('#tapHint').hidden=true;
  sayDog('En? Wist je ’m?');
}
function finishLearn(correct){
  if(answered)return;
  answered=true;
  recordResult(currentItem,correct);
  $('#againButton').disabled=true;$('#gotItButton').disabled=true;
  learnTimer=setTimeout(()=>{
    $('#againButton').disabled=false;$('#gotItButton').disabled=false;
    renderLearn();
  },correct?850:700);
}
function speakCurrent(){
  if(!currentItem||!('speechSynthesis'in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(displayEn(currentItem));u.lang='en-GB';u.rate=.88;window.speechSynthesis.speak(u);
}
function buildQuizOptions(item,direction){
  let candidates=ITEMS.filter(o=>o.id!==item.id&&o.category===item.category);
  if(candidates.length<3)candidates=ITEMS.filter(o=>o.id!==item.id);
  const options=shuffle(candidates).slice(0,3).map(o=>direction==='en-nl'?displayNl(o):displayEn(o));
  options.push(direction==='en-nl'?displayNl(item):displayEn(item));
  return shuffle(options);
}
function renderQuiz(){
  currentItem=pickItem();currentDirection=chooseDirection();answered=false;
  const enPrompt=currentDirection==='en-nl',correct=enPrompt?displayNl(currentItem):displayEn(currentItem);
  $('#quizCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#quizCounter').textContent=getPool().length+' in deze set';
  $('#quizPromptLabel').textContent=enPrompt?'Wat betekent dit in het Nederlands?':'Wat is dit in het Engels?';
  $('#quizPrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#quizFeedback').textContent='';$('#quizFeedback').className='feedback';$('#quizNext').hidden=true;
  sayDog(questionFor(currentItem,currentDirection));
  const holder=$('#quizAnswers');holder.innerHTML='';
  buildQuizOptions(currentItem,currentDirection).forEach(option=>{
    const b=document.createElement('button');b.type='button';b.className='answer-button';b.textContent=option;
    b.addEventListener('click',()=>{
      if(answered)return;answered=true;
      const ok=normalize(option)===normalize(correct);recordResult(currentItem,ok);
      Array.from(holder.children).forEach(child=>{child.disabled=true;if(normalize(child.textContent)===normalize(correct))child.classList.add('correct');});
      if(!ok)b.classList.add('wrong');
      $('#quizFeedback').textContent=ok?'Goed!':'Bijna — het juiste antwoord is “'+correct+'”.';
      $('#quizFeedback').className='feedback '+(ok?'good':'bad');$('#quizNext').hidden=false;
    });
    holder.appendChild(b);
  });
}
function renderType(){
  currentItem=pickItem();currentDirection=chooseDirection();answered=false;
  const enPrompt=currentDirection==='en-nl';
  $('#typeCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#typeCounter').textContent=getPool().length+' in deze set';
  $('#typePromptLabel').textContent=enPrompt?'Vertaal naar het Nederlands':'Vertaal naar het Engels';
  $('#typePrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#typeAnswer').value='';$('#typeAnswer').disabled=false;$('#typeAnswer').className='';
  $('#typeFeedback').textContent='';$('#typeFeedback').className='feedback';$('#typeNext').hidden=true;
  sayDog(questionFor(currentItem,currentDirection));
  setTimeout(()=>$('#typeAnswer').focus(),30);
}
function checkTyped(e){
  e.preventDefault();if(answered)return;
  const input=$('#typeAnswer');
  if(!normalize(input.value)){sayDog('Je moet wel iets typen, slimmerik.');return;}
  const accepted=currentDirection==='en-nl'?currentItem.nl:currentItem.en;
  const ok=accepted.some(a=>normalize(a)===normalize(input.value));
  const correct=currentDirection==='en-nl'?displayNl(currentItem):displayEn(currentItem);
  answered=true;input.disabled=true;input.classList.add(ok?'correct':'wrong');recordResult(currentItem,ok);
  $('#typeFeedback').textContent=ok?'Goed!':'Het juiste antwoord is “'+correct+'”.';
  $('#typeFeedback').className='feedback '+(ok?'good':'bad');$('#typeNext').hidden=false;
}
function blankExample(item){return item.example.replace(new RegExp('\\b'+displayEn(item)+'\\b','i'),'___');}
function renderTime(){
  currentItem=pickItem('time');answered=false;
  $('#timeSentence').textContent=blankExample(currentItem);
  $('#timeHint').textContent='Nederlandse hint: '+displayNl(currentItem);
  $('#timeFeedback').textContent='';$('#timeFeedback').className='feedback';$('#timeNext').hidden=true;
  sayDog(randomFrom(ASK_QUOTES)+' Welk woord mist er?');
  const holder=$('#timeAnswers');holder.innerHTML='';
  shuffle(ITEMS.filter(i=>i.category==='time')).forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='chip-button';b.textContent=displayEn(item);
    b.addEventListener('click',()=>{
      if(answered)return;answered=true;
      const ok=item.id===currentItem.id;recordResult(currentItem,ok);
      Array.from(holder.children).forEach(child=>{child.disabled=true;if(normalize(child.textContent)===normalize(displayEn(currentItem)))child.classList.add('correct');});
      if(!ok)b.classList.add('wrong');
      $('#timeFeedback').textContent=ok?'Goed!':'Het ontbrekende woord is “'+displayEn(currentItem)+'”.';
      $('#timeFeedback').className='feedback '+(ok?'good':'bad');$('#timeNext').hidden=false;
    });
    holder.appendChild(b);
  });
}
function wireSharedControls(render){
  if($('#categorySelect'))$('#categorySelect').addEventListener('change',function(){
    if(this.value==='mistakes'&&getMistakes().length===0){this.value='all';sayDog('Geen openstaande foutjes. Lekker bezig!');}
    render();
  });
  if($('#directionSelect'))$('#directionSelect').addEventListener('change',render);
}
function initCommon(){
  updateStats();updateBoneUI();setupBoneDrag();
}
function initHome(){
  initCommon();
  sayDog((progress._meta.bones||0)>0?'Woef! Je hebt '+progress._meta.bones+' botje'+(progress._meta.bones===1?'':'s')+' bewaard.':'Woef! Kies een oefening. Voor elke twee goede antwoorden krijg je een botje!');
  if($('#resetProgress'))$('#resetProgress').addEventListener('click',()=>{
    if(!window.confirm('Weet je zeker dat je alle voortgang en botjes wilt wissen?'))return;
    progress={_meta:defaultMeta()};sessionCorrect=0;sessionAttempts=0;saveProgress();updateStats();updateBoneUI();sayDog('Alles schoon! Nieuwe ronde?');
  });
}
function initLearn(){
  initCommon();wireSharedControls(renderLearn);
  $('#flashcard').addEventListener('click',revealLearn);
  $('#againButton').addEventListener('click',()=>finishLearn(false));
  $('#gotItButton').addEventListener('click',()=>finishLearn(true));
  $('#speakButton').addEventListener('click',speakCurrent);
  renderLearn();
}
function initQuiz(){initCommon();wireSharedControls(renderQuiz);$('#quizNext').addEventListener('click',renderQuiz);renderQuiz();}
function initType(){initCommon();wireSharedControls(renderType);$('#typeForm').addEventListener('submit',checkTyped);$('#typeNext').addEventListener('click',renderType);renderType();}
function initTime(){initCommon();$('#timeNext').addEventListener('click',renderTime);renderTime();}

if(pageMode==='home')initHome();
if(pageMode==='learn')initLearn();
if(pageMode==='quiz')initQuiz();
if(pageMode==='type')initType();
if(pageMode==='time')initTime();
