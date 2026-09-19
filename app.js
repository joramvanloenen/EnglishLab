'use strict';

const ITEMS = [
  { id:'colour', category:'words', en:['colour','color'], enDisplay:'colour', nl:['kleur'] },
  { id:'awkward', category:'words', en:['awkward'], enDisplay:'awkward', nl:['ongemakkelijk'] },
  { id:'clumsy', category:'words', en:['clumsy'], enDisplay:'clumsy', nl:['onhandig'] },
  { id:'messy', category:'words', en:['messy'], enDisplay:'messy', nl:['slordig, rommelig','slordig','rommelig'] },
  { id:'impatient', category:'words', en:['impatient'], enDisplay:'impatient', nl:['ongeduldig'] },
  { id:'shy', category:'words', en:['shy'], enDisplay:'shy', nl:['verlegen'] },
  { id:'serious', category:'words', en:['serious'], enDisplay:'serious', nl:['serieus'] },
  { id:'talkative', category:'words', en:['talkative'], enDisplay:'talkative', nl:['spraakzaam'] },
  { id:'patient', category:'words', en:['patient'], enDisplay:'patient', nl:['geduldig'] },
  { id:'surname', category:'words', en:['surname'], enDisplay:'surname', nl:['achternaam'] },
  { id:'country', category:'words', en:['country'], enDisplay:'country', nl:['land'] },
  { id:'first-name', category:'words', en:['first name'], enDisplay:'first name', nl:['voornaam'] },
  { id:'kind-of-music', category:'words', en:['kind of music'], enDisplay:'kind of music', nl:['soort muziek'] },
  { id:'easy', category:'words', en:['easy'], enDisplay:'easy', nl:['makkelijk'] },
  { id:'usually', category:'words', en:['usually'], enDisplay:'usually', nl:['meestal'] },
  { id:'keeping-secrets', category:'words', en:['keeping secrets'], enDisplay:'keeping secrets', nl:['geheimen bewaren'] },
  { id:'singer', category:'words', en:['singer'], enDisplay:'singer', nl:['zanger'] },
  { id:'musician', category:'words', en:['musician'], enDisplay:'musician', nl:['muzikant'] },
  { id:'enthusiastic', category:'words', en:['enthusiastic'], enDisplay:'enthusiastic', nl:['enthousiast'] },

  { id:'play-football', category:'phrases', en:['Do you play football?'], enDisplay:'Do you play football?', nl:['Speel jij voetbal?'] },
  { id:'siblings', category:'phrases', en:['Do you have any siblings?'], enDisplay:'Do you have any siblings?', nl:['Heb je broers of zussen?'] },
  { id:'good-at', category:'phrases', en:['What are you good at?'], enDisplay:'What are you good at?', nl:['Waar ben je goed in?'] },
  { id:'free-time', category:'phrases', en:['What do you like doing in your free time?'], enDisplay:'What do you like doing in your free time?', nl:['Wat doe jij graag in je vrije tijd?'] },
  { id:'grow-up', category:'phrases', en:['What do you want to be when you grow up?'], enDisplay:'What do you want to be when you grow up?', nl:['Wat wil je later worden?'] },
  { id:'favourite-food', category:'phrases', en:['What is your favourite food?','What is your favorite food?'], enDisplay:'What is your favourite food?', nl:['Wat is jouw lievelingseten?'] },
  { id:'birthday', category:'phrases', en:['When is your birthday?'], enDisplay:'When is your birthday?', nl:['Wanneer ben je jarig?'] },
  { id:'come-from', category:'phrases', en:['Where do you come from?'], enDisplay:'Where do you come from?', nl:['Waar kom je vandaan?'] },

  { id:'after', category:'time', en:['after'], enDisplay:'after', nl:['na'], example:'We can play together after lunch.' },
  { id:'at', category:'time', en:['at'], enDisplay:'at', nl:['om'], example:"Let's meet at 2 pm." },
  { id:'before', category:'time', en:['before'], enDisplay:'before', nl:['voor'], example:"Let's go swimming before dinner." },
  { id:'during', category:'time', en:['during'], enDisplay:'during', nl:['tijdens'], example:'We can talk during our walk home.' },
  { id:'on', category:'time', en:['on'], enDisplay:'on', nl:['op'], example:'I always play football on Saturdays.' },
  { id:'until', category:'time', en:['until'], enDisplay:'until', nl:['tot'], example:'They stayed until the end of the concert.' }
];

const CATEGORY_LABELS = {
  words:'Word',
  phrases:'Phrase',
  time:'Time word'
};

const STORAGE_KEY = 'englishlab-progress-v1';
let progress = loadProgress();
let sessionCorrect = 0;
let sessionAttempts = 0;
let streak = 0;
let mode = 'learn';
let currentItem = null;
let currentDirection = 'en-nl';
let revealed = false;
let answered = false;

const $ = function(selector){ return document.querySelector(selector); };
const $$ = function(selector){ return Array.from(document.querySelectorAll(selector)); };

function loadProgress(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  }catch(e){
    return {};
  }
}

function saveProgress(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }catch(e){}
}

function shuffle(list){
  const copy = list.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function normalize(value){
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function displayNl(item){
  return item.nl[0];
}

function displayEn(item){
  return item.enDisplay || item.en[0];
}

function isMastered(item){
  const p = progress[item.id] || {correct:0,wrong:0};
  return p.correct >= 3 && p.correct - p.wrong >= 2;
}

function getMistakes(){
  return ITEMS.filter(function(item){
    const p = progress[item.id];
    return p && p.wrong > 0 && !isMastered(item);
  });
}

function getPool(){
  const category = $('#categorySelect').value;
  if(category === 'all') return ITEMS.slice();
  if(category === 'mistakes') return getMistakes();
  return ITEMS.filter(function(item){ return item.category === category; });
}

function chooseDirection(){
  const selected = $('#directionSelect').value;
  if(selected === 'mix') return Math.random() < .5 ? 'en-nl' : 'nl-en';
  return selected;
}

function pickItem(forceCategory){
  let pool = forceCategory ? ITEMS.filter(function(item){ return item.category === forceCategory; }) : getPool();
  if(!pool.length){
    $('#categorySelect').value = 'all';
    pool = ITEMS.slice();
    $('#progressMessage').textContent = 'No mistakes waiting for review. Nice work!';
  }
  if(pool.length === 1) return pool[0];
  let next = pool[Math.floor(Math.random() * pool.length)];
  let tries = 0;
  while(currentItem && next.id === currentItem.id && tries < 8){
    next = pool[Math.floor(Math.random() * pool.length)];
    tries++;
  }
  return next;
}

function recordResult(item, correct){
  if(!item) return;
  if(!progress[item.id]) progress[item.id] = {correct:0,wrong:0};
  if(correct){
    progress[item.id].correct++;
    sessionCorrect++;
    streak++;
  }else{
    progress[item.id].wrong++;
    streak = 0;
  }
  sessionAttempts++;
  saveProgress();
  updateStats();
}

function updateStats(){
  const mastered = ITEMS.filter(isMastered).length;
  const percent = Math.round((mastered / ITEMS.length) * 100);
  $('#masteredCount').textContent = String(mastered);
  $('#sessionScore').textContent = sessionCorrect + '/' + sessionAttempts;
  $('#streakCount').textContent = String(streak);
  $('#progressPercent').textContent = percent + '%';
  $('#progressBar').style.width = percent + '%';

  if(mastered === ITEMS.length){
    $('#progressMessage').textContent = 'Everything mastered. Absolute language wizardry.';
  }else if(mastered >= 20){
    $('#progressMessage').textContent = 'Great momentum — most of the lesson is sticking.';
  }else if(mastered > 0){
    $('#progressMessage').textContent = 'Keep going: 3 solid correct answers can master an item.';
  }
}

function setMode(nextMode){
  mode = nextMode;
  $$('.mode-tab').forEach(function(button){
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  $$('.mode-panel').forEach(function(panel){ panel.hidden = true; });
  $('#' + mode + 'Mode').hidden = false;

  if(mode === 'time'){
    renderTime();
  }else if(mode === 'learn'){
    renderLearn();
  }else if(mode === 'quiz'){
    renderQuiz();
  }else if(mode === 'type'){
    renderType();
  }
}

function renderLearn(){
  currentItem = pickItem();
  currentDirection = chooseDirection();
  revealed = false;
  answered = false;

  const isEnPrompt = currentDirection === 'en-nl';
  $('#learnCategory').textContent = CATEGORY_LABELS[currentItem.category];
  $('#learnCounter').textContent = getPool().length + ' in set';
  $('#flashPromptLabel').textContent = isEnPrompt ? 'English' : 'Dutch';
  $('#flashPrompt').textContent = isEnPrompt ? displayEn(currentItem) : displayNl(currentItem);
  $('#flashAnswer').textContent = isEnPrompt ? displayNl(currentItem) : displayEn(currentItem);
  $('#flashAnswer').hidden = true;
  $('#tapHint').hidden = false;
  $('#speakButton').hidden = false;
  $('#againButton').disabled = false;
  $('#gotItButton').disabled = false;
}

function revealCard(){
  revealed = true;
  $('#flashAnswer').hidden = false;
  $('#tapHint').hidden = true;
}

function finishLearn(correct){
  if(answered) return;
  if(!revealed){
    revealCard();
    return;
  }
  answered = true;
  recordResult(currentItem, correct);
  renderLearn();
}

function buildQuizOptions(item, direction){
  let candidates = ITEMS.filter(function(other){ return other.id !== item.id && other.category === item.category; });
  if(candidates.length < 3) candidates = ITEMS.filter(function(other){ return other.id !== item.id; });
  const wrongItems = shuffle(candidates).slice(0,3);
  const values = wrongItems.map(function(other){
    return direction === 'en-nl' ? displayNl(other) : displayEn(other);
  });
  values.push(direction === 'en-nl' ? displayNl(item) : displayEn(item));
  return shuffle(values);
}

function renderQuiz(){
  currentItem = pickItem();
  currentDirection = chooseDirection();
  answered = false;

  const isEnPrompt = currentDirection === 'en-nl';
  const correct = isEnPrompt ? displayNl(currentItem) : displayEn(currentItem);
  $('#quizCategory').textContent = CATEGORY_LABELS[currentItem.category];
  $('#quizCounter').textContent = getPool().length + ' in set';
  $('#quizPromptLabel').textContent = isEnPrompt ? 'What does this mean in Dutch?' : 'What is this in English?';
  $('#quizPrompt').textContent = isEnPrompt ? displayEn(currentItem) : displayNl(currentItem);
  $('#quizFeedback').textContent = '';
  $('#quizFeedback').className = 'feedback';
  $('#quizNext').hidden = true;

  const holder = $('#quizAnswers');
  holder.innerHTML = '';
  buildQuizOptions(currentItem, currentDirection).forEach(function(option){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = option;
    button.addEventListener('click', function(){
      if(answered) return;
      answered = true;
      const ok = normalize(option) === normalize(correct);
      recordResult(currentItem, ok);
      Array.from(holder.children).forEach(function(child){
        child.disabled = true;
        if(normalize(child.textContent) === normalize(correct)) child.classList.add('correct');
      });
      if(!ok) button.classList.add('wrong');
      $('#quizFeedback').textContent = ok ? positiveMessage() : 'Almost — the answer is “' + correct + '”.';
      $('#quizFeedback').className = 'feedback ' + (ok ? 'good' : 'bad');
      $('#quizNext').hidden = false;
    });
    holder.appendChild(button);
  });
}

function positiveMessage(){
  const messages = ['Correct!','Nice one!','Yes — nailed it.','Spot on!','That’s it!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

function renderType(){
  currentItem = pickItem();
  currentDirection = chooseDirection();
  answered = false;

  const isEnPrompt = currentDirection === 'en-nl';
  $('#typeCategory').textContent = CATEGORY_LABELS[currentItem.category];
  $('#typeCounter').textContent = getPool().length + ' in set';
  $('#typePromptLabel').textContent = isEnPrompt ? 'Translate into Dutch' : 'Translate into English';
  $('#typePrompt').textContent = isEnPrompt ? displayEn(currentItem) : displayNl(currentItem);
  $('#typeAnswer').value = '';
  $('#typeAnswer').disabled = false;
  $('#typeAnswer').className = '';
  $('#typeFeedback').textContent = '';
  $('#typeFeedback').className = 'feedback';
  $('#typeNext').hidden = true;
  setTimeout(function(){ $('#typeAnswer').focus(); }, 30);
}

function checkTypedAnswer(event){
  event.preventDefault();
  if(answered) return;

  const input = $('#typeAnswer');
  const raw = input.value;
  if(!normalize(raw)){
    $('#typeFeedback').textContent = 'Type an answer first.';
    $('#typeFeedback').className = 'feedback bad';
    return;
  }

  const accepted = currentDirection === 'en-nl' ? currentItem.nl : currentItem.en;
  const ok = accepted.some(function(answer){ return normalize(answer) === normalize(raw); });
  const correct = currentDirection === 'en-nl' ? displayNl(currentItem) : displayEn(currentItem);

  answered = true;
  input.disabled = true;
  input.classList.add(ok ? 'correct' : 'wrong');
  recordResult(currentItem, ok);
  $('#typeFeedback').textContent = ok ? positiveMessage() : 'The answer is “' + correct + '”.';
  $('#typeFeedback').className = 'feedback ' + (ok ? 'good' : 'bad');
  $('#typeNext').hidden = false;
}

function blankExample(item){
  const word = displayEn(item);
  const regex = new RegExp('\\b' + word.replace(/[.*+?^{}$()|[\]\\]/g,'\\$&') + '\\b','i');
  return item.example.replace(regex,'___');
}

function renderTime(){
  currentItem = pickItem('time');
  currentDirection = 'en-nl';
  answered = false;

  $('#timeCounter').textContent = '6 words to know';
  $('#timeSentence').textContent = blankExample(currentItem);
  $('#timeHint').textContent = 'Dutch hint: ' + displayNl(currentItem);
  $('#timeFeedback').textContent = '';
  $('#timeFeedback').className = 'feedback';
  $('#timeNext').hidden = true;

  const holder = $('#timeAnswers');
  holder.innerHTML = '';
  shuffle(ITEMS.filter(function(item){ return item.category === 'time'; })).forEach(function(item){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip-button';
    button.textContent = displayEn(item);
    button.addEventListener('click', function(){
      if(answered) return;
      answered = true;
      const ok = item.id === currentItem.id;
      recordResult(currentItem, ok);
      Array.from(holder.children).forEach(function(child){
        child.disabled = true;
        if(normalize(child.textContent) === normalize(displayEn(currentItem))) child.classList.add('correct');
      });
      if(!ok) button.classList.add('wrong');
      $('#timeFeedback').textContent = ok ? positiveMessage() : 'The missing word is “' + displayEn(currentItem) + '”.';
      $('#timeFeedback').className = 'feedback ' + (ok ? 'good' : 'bad');
      $('#timeNext').hidden = false;
    });
    holder.appendChild(button);
  });
}

function speakCurrent(){
  if(!currentItem || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(displayEn(currentItem));
  utterance.lang = 'en-GB';
  utterance.rate = .88;
  window.speechSynthesis.speak(utterance);
}

function renderReference(){
  const holder = $('#referenceContent');
  holder.innerHTML = '';

  [
    {category:'words', title:'Words to know'},
    {category:'phrases', title:'Phrases'},
    {category:'time', title:'Time prepositions'}
  ].forEach(function(group){
    const card = document.createElement('section');
    card.className = 'reference-card';
    const heading = document.createElement('h3');
    heading.textContent = group.title;
    card.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'reference-list';

    ITEMS.filter(function(item){ return item.category === group.category; }).forEach(function(item){
      const row = document.createElement('div');
      row.className = 'reference-item';

      const en = document.createElement('span');
      en.textContent = displayEn(item);
      const nl = document.createElement('span');
      nl.textContent = displayNl(item);
      row.appendChild(en);
      row.appendChild(nl);

      if(item.example){
        const example = document.createElement('span');
        example.className = 'example';
        example.textContent = item.example;
        row.appendChild(example);
      }
      list.appendChild(row);
    });

    card.appendChild(list);
    holder.appendChild(card);
  });
}

function refreshCurrentMode(){
  if(mode === 'learn') renderLearn();
  if(mode === 'quiz') renderQuiz();
  if(mode === 'type') renderType();
  if(mode === 'time') renderTime();
}

$$('.mode-tab').forEach(function(button){
  button.addEventListener('click', function(){ setMode(button.dataset.mode); });
});

$('#categorySelect').addEventListener('change', function(){
  if(this.value === 'mistakes' && getMistakes().length === 0){
    this.value = 'all';
    $('#progressMessage').textContent = 'No mistakes waiting for review. Nice work!';
  }
  refreshCurrentMode();
});

$('#directionSelect').addEventListener('change', refreshCurrentMode);
$('#flashcard').addEventListener('click', revealCard);
$('#againButton').addEventListener('click', function(){ finishLearn(false); });
$('#gotItButton').addEventListener('click', function(){ finishLearn(true); });
$('#speakButton').addEventListener('click', speakCurrent);
$('#quizNext').addEventListener('click', renderQuiz);
$('#typeForm').addEventListener('submit', checkTypedAnswer);
$('#typeNext').addEventListener('click', renderType);
$('#timeNext').addEventListener('click', renderTime);

$('#toggleReference').addEventListener('click', function(){
  const content = $('#referenceContent');
  const opening = content.hidden;
  content.hidden = !opening;
  this.setAttribute('aria-expanded', opening ? 'true' : 'false');
  this.textContent = opening ? 'Hide reference' : 'Show reference';
});

$('#resetProgress').addEventListener('click', function(){
  const shouldReset = window.confirm('Reset all saved EnglishLab progress on this device?');
  if(!shouldReset) return;
  progress = {};
  sessionCorrect = 0;
  sessionAttempts = 0;
  streak = 0;
  saveProgress();
  updateStats();
  refreshCurrentMode();
});

renderReference();
updateStats();
setMode('learn');
