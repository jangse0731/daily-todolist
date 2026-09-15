const STORAGE_KEY = 'kkuk-check-tasks-v1';
const weekdays = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
const today = new Date();
today.setHours(12,0,0,0);
let selectedDate = new Date(today);
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
let tasks = loadTasks();

const $ = id => document.getElementById(id);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const sameDate = (a,b) => dateKey(a) === dateKey(b);

function loadTasks(){
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value;
  } catch { return {}; }
}
function saveTasks(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch { /* Storage may be unavailable in private browsing. */ }
}
function dayTasks(key){ return Array.isArray(tasks[key]) ? tasks[key] : []; }

function renderCalendar(){
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  $('monthTitle').textContent = `${year}년 ${month+1}월`;
  const grid = $('calendarGrid');
  grid.replaceChildren();
  const offset = new Date(year, month, 1, 12).getDay();
  const total = new Date(year, month+1, 0, 12).getDate();
  for(let i=0;i<offset;i++){
    const blank = document.createElement('span');
    blank.className = 'calendar-empty';
    blank.setAttribute('role','presentation');
    grid.append(blank);
  }
  for(let day=1;day<=total;day++){
    const date = new Date(year, month, day, 12);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day';
    button.setAttribute('role','gridcell');
    button.textContent = day;
    button.setAttribute('aria-label',`${month+1}월 ${day}일 ${weekdays[date.getDay()]}`);
    if(date.getDay()===0) button.classList.add('sunday');
    if(date.getDay()===6) button.classList.add('saturday');
    if(sameDate(date,today)) { button.classList.add('today'); button.setAttribute('aria-label', button.getAttribute('aria-label')+' 오늘'); }
    if(sameDate(date,selectedDate)) { button.classList.add('selected'); button.setAttribute('aria-selected','true'); }
    if(dayTasks(dateKey(date)).length){
      const dot = document.createElement('span');
      dot.className = 'day-dot';
      dot.setAttribute('aria-hidden','true');
      button.append(dot);
    }
    button.addEventListener('click',()=>{ selectedDate=date; render(); });
    grid.append(button);
  }
}

function renderTasks(){
  const key = dateKey(selectedDate);
  const items = dayTasks(key);
  const completed = items.filter(item => item.done).length;
  const percent = items.length ? Math.round(completed/items.length*100) : 0;
  $('selectedDateTitle').textContent = `${selectedDate.getMonth()+1}월 ${selectedDate.getDate()}일 ${weekdays[selectedDate.getDay()]}`;
  $('dayMessage').textContent = sameDate(selectedDate,today) ? '오늘도 차근차근, 함께 시작해볼까요?' : '이날의 작은 목표를 기록해보세요.';
  $('progressLabel').textContent = `${completed} / ${items.length} 완료`;
  $('progressPercent').textContent = `${percent}%`;
  $('progressFill').style.width = `${percent}%`;
  $('progressBar').setAttribute('aria-valuenow',String(percent));
  $('taskCount').textContent = `${items.length}개`;
  const list = $('taskList');
  list.replaceChildren();
  if(!items.length){
    const empty = document.createElement('li');
    empty.className = 'empty-tasks';
    empty.innerHTML = '<span aria-hidden="true">✦</span>아직 적은 할 일이 없어요.<br>아래에 첫 번째 할 일을 추가해보세요!';
    list.append(empty);
    return;
  }
  for(const item of items){
    const li = document.createElement('li');
    li.className = `task-item${item.done?' done':''}`;
    const check = document.createElement('button');
    check.type='button'; check.className='check-task';
    check.textContent=item.done?'✓':'';
    check.setAttribute('aria-label',item.done?`${item.text} 완료 취소`:`${item.text} 완료`);
    check.setAttribute('aria-pressed',String(Boolean(item.done)));
    check.addEventListener('click',()=>{ item.done=!item.done; saveTasks(); render(); });
    const label = document.createElement('span');
    label.className='task-text'; label.textContent=item.text;
    const remove = document.createElement('button');
    remove.type='button'; remove.className='delete-task'; remove.textContent='×';
    remove.setAttribute('aria-label',`${item.text} 삭제`);
    remove.addEventListener('click',()=>{
      tasks[key]=dayTasks(key).filter(task=>task.id!==item.id);
      if(!tasks[key].length) delete tasks[key];
      saveTasks(); render();
    });
    li.append(check,label,remove); list.append(li);
  }
}
function render(){ renderCalendar(); renderTasks(); }

$('prevMonth').addEventListener('click',()=>{
  visibleMonth = new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1,12);
  selectedDate = new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1,12);
  render();
});
$('nextMonth').addEventListener('click',()=>{
  visibleMonth = new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1,12);
  selectedDate = new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1,12);
  render();
});
$('todayButton').addEventListener('click',()=>{
  visibleMonth = new Date(today.getFullYear(),today.getMonth(),1,12);
  selectedDate = new Date(today);
  render();
});
$('taskForm').addEventListener('submit',event=>{
  event.preventDefault();
  const input = $('taskInput');
  const value = input.value.trim();
  if(!value) return;
  const key = dateKey(selectedDate);
  if(!Array.isArray(tasks[key])) tasks[key]=[];
  tasks[key].push({id:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,text:value,done:false});
  saveTasks(); input.value=''; render(); input.focus();
});
render();
