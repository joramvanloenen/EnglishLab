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

const STORAGE_KEY = 'englishlab-progress-v2';
const CATEGORY_LABELS = {words:'Word',phrases:'Phrase',time:'Time word'};
const $ = function(s){return document.querySelector(s);};
const pageMode = document.body.dataset.mode || 'home';

let progress = loadProgress();
let sessionCorrect = 0;
let sessionAttempts = 0;
let streak = 0;
let currentItem = null;
let currentDirection = 'en-nl';
let revealed = false;
let answered = false;

function loadProgress(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  }catch(e){return {};}
}

function saveProgress(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch(e){}
}

function shuffle(list){
  const copy=list.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const t=copy[i];copy[i]=copy[j];copy[j]=t;
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
function stateFor(item){return progress[item.id]||{correct:0,wrong:0};}
function isMastered(item){
  const p=stateFor(item);
  return p.correct>=3 && p.correct-p.wrong>=2;
}
function totalAttempts(){
  return Object.values(progress).reduce(function(sum,p){return sum+(p.correct||0)+(p.wrong||0);},0);
}
function totalCorrect(){
  return Object.values(progress).reduce(function(sum,p){return sum+(p.correct||0);},0);
}
function getMistakes(){
  return ITEMS.filter(function(item){const p=stateFor(item);return p.wrong>0&&!isMastered(item);});
}
function getPool(){
  const select=$('#categorySelect');
  const category=select?select.value:'all';
  if(category==='mistakes') return getMistakes();
  if(category==='all') return ITEMS.slice();
  return ITEMS.filter(function(item){return item.category===category;});
}
function chooseDirection(){
  const select=$('#directionSelect');
  const selected=select?select.value:'mix';
  return selected==='mix'?(Math.random()<.5?'en-nl':'nl-en'):selected;
}
function pickItem(forcedCategory){
  let pool=forcedCategory?ITEMS.filter(function(i){return i.category===forcedCategory;}):getPool();
  if(!pool.length){
    const categorySelect=$('#categorySelect');
    if(categorySelect) categorySelect.value='all';
    pool=ITEMS.slice();
    const msg=$('#progressMessage');
    if(msg) msg.textContent='No mistakes waiting for review. Nice work!';
  }
  if(pool.length===1) return pool[0];
  let next=pool[Math.floor(Math.random()*pool.length)];
  let tries=0;
  while(currentItem&&next.id===currentItem.id&&tries<8){
    next=pool[Math.floor(Math.random()*pool.length)];
    tries++;
  }
  return next;
}
function recordResult(item,correct){
  if(!progress[item.id]) progress[item.id]={correct:0,wrong:0};
  if(correct){
    progress[item.id].correct++;
    sessionCorrect++;
    streak++;
  }else{
    progress[item.id].wrong++;
    streak=0;
  }
  sessionAttempts++;
  saveProgress();
  updateStats();
}
function updateStats(){
  const mastered=ITEMS.filter(isMastered).length;
  const percent=Math.round(mastered/ITEMS.length*100);
  if($('#masteredCount')) $('#masteredCount').textContent=String(mastered);
  if($('#sessionScore')) $('#sessionScore').textContent=sessionCorrect+'/'+sessionAttempts;
  if($('#streakCount')) $('#streakCount').textContent=String(streak);
  if($('#progressPercent')) $('#progressPercent').textContent=percent+'%';
  if($('#progressBar')) $('#progressBar').style.width=percent+'%';
  if($('#attemptCount')) $('#attemptCount').textContent=String(totalAttempts());
  if($('#accuracyCount')){
    const attempts=totalAttempts();
    $('#accuracyCount').textContent=attempts?Math.round(totalCorrect()/attempts*100)+'%':'—';
  }
  if($('#progressMessage')){
    if(mastered===ITEMS.length) $('#progressMessage').textContent='Everything mastered. Very suspiciously excellent.';
    else if(mastered>=20) $('#progressMessage').textContent='Great momentum — most of the lesson is sticking.';
    else if(mastered>0) $('#progressMessage').textContent='Keep going: 3 solid correct answers can master an item.';
  }
}
function positiveMessage(){
  const list=['Correct!','Nice one!','Yes — nailed it.','Spot on!','That’s it!'];
  return list[Math.floor(Math.random()*list.length)];
}

function renderLearn(){
  currentItem=pickItem();
  currentDirection=chooseDirection();
  revealed=false;answered=false;
  const enPrompt=currentDirection==='en-nl';
  $('#learnCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#learnCounter').textContent=getPool().length+' in set';
  $('#flashPromptLabel').textContent=enPrompt?'English':'Dutch';
  $('#flashPrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#flashAnswer').textContent=enPrompt?displayNl(currentItem):displayEn(currentItem);
  $('#flashAnswer').hidden=true;
  $('#tapHint').hidden=false;
}
function revealLearn(){
  revealed=true;
  $('#flashAnswer').hidden=false;
  $('#tapHint').hidden=true;
}
function finishLearn(correct){
  if(!revealed){revealLearn();return;}
  if(answered) return;
  answered=true;
  recordResult(currentItem,correct);
  renderLearn();
}
function speakCurrent(){
  if(!currentItem||!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(displayEn(currentItem));
  u.lang='en-GB';u.rate=.88;
  window.speechSynthesis.speak(u);
}

function buildQuizOptions(item,direction){
  let candidates=ITEMS.filter(function(o){return o.id!==item.id&&o.category===item.category;});
  if(candidates.length<3) candidates=ITEMS.filter(function(o){return o.id!==item.id;});
  const options=shuffle(candidates).slice(0,3).map(function(o){return direction==='en-nl'?displayNl(o):displayEn(o);});
  options.push(direction==='en-nl'?displayNl(item):displayEn(item));
  return shuffle(options);
}
function renderQuiz(){
  currentItem=pickItem();
  currentDirection=chooseDirection();
  answered=false;
  const enPrompt=currentDirection==='en-nl';
  const correct=enPrompt?displayNl(currentItem):displayEn(currentItem);
  $('#quizCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#quizCounter').textContent=getPool().length+' in set';
  $('#quizPromptLabel').textContent=enPrompt?'What does this mean in Dutch?':'What is this in English?';
  $('#quizPrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#quizFeedback').textContent='';$('#quizFeedback').className='feedback';
  $('#quizNext').hidden=true;
  const holder=$('#quizAnswers');holder.innerHTML='';
  buildQuizOptions(currentItem,currentDirection).forEach(function(option){
    const b=document.createElement('button');
    b.type='button';b.className='answer-button';b.textContent=option;
    b.addEventListener('click',function(){
      if(answered) return;
      answered=true;
      const ok=normalize(option)===normalize(correct);
      recordResult(currentItem,ok);
      Array.from(holder.children).forEach(function(child){
        child.disabled=true;
        if(normalize(child.textContent)===normalize(correct)) child.classList.add('correct');
      });
      if(!ok) b.classList.add('wrong');
      $('#quizFeedback').textContent=ok?positiveMessage():'Almost — the answer is “'+correct+'”.';
      $('#quizFeedback').className='feedback '+(ok?'good':'bad');
      $('#quizNext').hidden=false;
    });
    holder.appendChild(b);
  });
}

function renderType(){
  currentItem=pickItem();
  currentDirection=chooseDirection();
  answered=false;
  const enPrompt=currentDirection==='en-nl';
  $('#typeCategory').textContent=CATEGORY_LABELS[currentItem.category];
  $('#typeCounter').textContent=getPool().length+' in set';
  $('#typePromptLabel').textContent=enPrompt?'Translate into Dutch':'Translate into English';
  $('#typePrompt').textContent=enPrompt?displayEn(currentItem):displayNl(currentItem);
  $('#typeAnswer').value='';$('#typeAnswer').disabled=false;$('#typeAnswer').className='';
  $('#typeFeedback').textContent='';$('#typeFeedback').className='feedback';
  $('#typeNext').hidden=true;
  setTimeout(function(){$('#typeAnswer').focus();},30);
}
function checkTyped(event){
  event.preventDefault();
  if(answered) return;
  const input=$('#typeAnswer');
  if(!normalize(input.value)){
    $('#typeFeedback').textContent='Type an answer first.';
    $('#typeFeedback').className='feedback bad';
    return;
  }
  const accepted=currentDirection==='en-nl'?currentItem.nl:currentItem.en;
  const ok=accepted.some(function(a){return normalize(a)===normalize(input.value);});
  const correct=currentDirection==='en-nl'?displayNl(currentItem):displayEn(currentItem);
  answered=true;input.disabled=true;input.classList.add(ok?'correct':'wrong');
  recordResult(currentItem,ok);
  $('#typeFeedback').textContent=ok?positiveMessage():'The answer is “'+correct+'”.';
  $('#typeFeedback').className='feedback '+(ok?'good':'bad');
  $('#typeNext').hidden=false;
}

function blankExample(item){
  return item.example.replace(new RegExp('\\b'+displayEn(item)+'\\b','i'),'___');
}
function renderTime(){
  currentItem=pickItem('time');
  answered=false;
  $('#timeSentence').textContent=blankExample(currentItem);
  $('#timeHint').textContent='Dutch hint: '+displayNl(currentItem);
  $('#timeFeedback').textContent='';$('#timeFeedback').className='feedback';
  $('#timeNext').hidden=true;
  const holder=$('#timeAnswers');holder.innerHTML='';
  shuffle(ITEMS.filter(function(i){return i.category==='time';})).forEach(function(item){
    const b=document.createElement('button');
    b.type='button';b.className='chip-button';b.textContent=displayEn(item);
    b.addEventListener('click',function(){
      if(answered) return;
      answered=true;
      const ok=item.id===currentItem.id;
      recordResult(currentItem,ok);
      Array.from(holder.children).forEach(function(child){
        child.disabled=true;
        if(normalize(child.textContent)===normalize(displayEn(currentItem))) child.classList.add('correct');
      });
      if(!ok) b.classList.add('wrong');
      $('#timeFeedback').textContent=ok?positiveMessage():'The missing word is “'+displayEn(currentItem)+'”.';
      $('#timeFeedback').className='feedback '+(ok?'good':'bad');
      $('#timeNext').hidden=false;
    });
    holder.appendChild(b);
  });
}

function wireSharedControls(render){
  if($('#categorySelect')) $('#categorySelect').addEventListener('change',function(){
    if(this.value==='mistakes'&&getMistakes().length===0){
      this.value='all';
      if($('#progressMessage')) $('#progressMessage').textContent='No mistakes waiting for review. Nice work!';
    }
    render();
  });
  if($('#directionSelect')) $('#directionSelect').addEventListener('change',render);
}

function initHome(){
  updateStats();
  if($('#resetProgress')) $('#resetProgress').addEventListener('click',function(){
    if(!window.confirm('Reset all saved EnglishLab progress on this device?')) return;
    progress={};saveProgress();updateStats();
  });
}
function initLearn(){
  wireSharedControls(renderLearn);
  $('#flashcard').addEventListener('click',revealLearn);
  $('#againButton').addEventListener('click',function(){finishLearn(false);});
  $('#gotItButton').addEventListener('click',function(){finishLearn(true);});
  $('#speakButton').addEventListener('click',speakCurrent);
  $('#modeTip').innerHTML='<strong>Tip:</strong> Say the English word out loud before revealing the answer.';
  updateStats();renderLearn();
}
function initQuiz(){
  wireSharedControls(renderQuiz);
  $('#quizNext').addEventListener('click',renderQuiz);
  $('#modeTip').innerHTML='<strong>Tip:</strong> Try to answer before reading all four choices.';
  updateStats();renderQuiz();
}
function initType(){
  wireSharedControls(renderType);
  $('#typeForm').addEventListener('submit',checkTyped);
  $('#typeNext').addEventListener('click',renderType);
  $('#modeTip').innerHTML='<strong>Tip:</strong> Spelling matters here — this is the strongest recall test.';
  updateStats();renderType();
}
function initTime(){
  $('#timeNext').addEventListener('click',renderTime);
  $('#modeTip').innerHTML='<strong>Tip:</strong> Read the whole sentence aloud. The rhythm often helps.';
  updateStats();renderTime();
}

if(pageMode==='home') initHome();
if(pageMode==='learn') initLearn();
if(pageMode==='quiz') initQuiz();
if(pageMode==='type') initType();
if(pageMode==='time') initTime();
