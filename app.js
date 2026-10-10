const $ = selector => document.querySelector(selector);
const firebaseConfig = {
  apiKey: 'AIzaSyCA0p7x5mO2Y5iqGNpTolyhg0TSk1hMxh4',
  authDomain: 'ttttttoooodo.firebaseapp.com',
  projectId: 'ttttttoooodo',
  storageBucket: 'ttttttoooodo.firebasestorage.app',
  messagingSenderId: '995481757172',
  appId: '1:995481757172:web:d5b1f95cc215b6e52b85a1',
  databaseURL: 'https://ttttttoooodo-default-rtdb.firebaseio.com/'
};
let todos = [], filter = 'all', editingId = null, ready = false, connected = false;
let db, api;
const pending = new Set();
$('#today').textContent = new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());

function notice(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').classList.toggle('error', error);
  $('#notice').hidden = false;
}
function failure(error) {
  console.error(error);
  const denied = /permission|denied/i.test(`${error.code} ${error.message}`);
  notice(denied ? '데이터베이스 접근 권한이 없어요. Firebase 콘솔의 Realtime Database 규칙을 확인해 주세요.' : '연결 또는 저장에 실패했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.', true);
}
function updateConnection() {
  $('#connection').className = `connection ${connected && ready ? 'online' : ''}`;
  $('#connection span').textContent = connected && ready ? 'Firebase 실시간 연결' : 'Firebase 연결 대기';
  $('#new-todo').disabled = $('#add-button').disabled = !(connected && ready) || pending.has('add');
}
function render() {
  const complete = todos.filter(t => t.completed).length;
  $('#total').textContent = $('#nav-count').textContent = $('#filter-count').textContent = todos.length;
  $('#done').textContent = complete;
  $('#active').textContent = todos.length - complete;
  const percent = todos.length ? Math.round(complete / todos.length * 100) : 0;
  $('#percent').replaceChildren(document.createTextNode(String(percent)), Object.assign(document.createElement('span'), {textContent:'%'}));
  $('#progress').style.width = `${percent}%`;
  const visible = todos.filter(t => filter === 'all' || (filter === 'done' ? t.completed : !t.completed));
  $('#todo-list').replaceChildren();
  for (const todo of visible) {
    const row = document.createElement('li'); row.className = `todo-row ${todo.completed ? 'completed' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'check'; checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `${todo.text} 완료 표시`);
    checkbox.disabled = !connected || pending.has(todo.id);
    checkbox.addEventListener('change', () => mutate(todo.id, () => api.update(api.ref(db, `todos/${todo.id}`), {completed:checkbox.checked, updatedAt:api.serverTimestamp()}), '완료 상태를 저장했어요.'));
    const body = document.createElement('div'); body.className = 'task-body';
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = todo.text;
    const meta = document.createElement('div'); meta.className = 'task-meta';
    meta.textContent = `${todo.completed ? '완료' : '진행 중'} · ${typeof todo.createdAt === 'number' ? new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric'}).format(new Date(todo.createdAt)) : '방금 추가'}`;
    body.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'task-actions';
    for (const [label, action] of [['수정', () => openEdit(todo)], ['삭제', () => {
      if (confirm(`“${todo.text}” 할 일을 삭제할까요?`)) mutate(todo.id, () => api.remove(api.ref(db, `todos/${todo.id}`)), '할 일을 삭제했어요.');
    }]]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.className = label === '삭제' ? 'delete' : 'edit'; button.setAttribute('aria-label', `${todo.text} ${label}`);
      button.disabled = !connected || pending.has(todo.id); button.addEventListener('click', action); actions.append(button);
    }
    row.append(checkbox, body, actions); $('#todo-list').append(row);
  }
  $('#empty').hidden = visible.length > 0;
  if (ready) {
    $('#empty h2').textContent = filter === 'done' ? '완료한 일을 기다리고 있어요' : filter === 'active' && todos.length ? '모든 할 일을 해냈어요!' : '새로운 시작을 적어보세요';
    $('#empty p').textContent = filter === 'all' ? '위 입력창에서 첫 번째 할 일을 추가해 보세요.' : '다른 필터를 선택해 할 일을 확인해 보세요.';
  }
}
async function mutate(id, operation, message) {
  if (!connected || pending.has(id)) return;
  pending.add(id); render();
  try { await operation(); notice(message); } catch(error) { failure(error); }
  finally { pending.delete(id); render(); }
}
function openEdit(todo) {
  editingId = todo.id; $('#edit-text').value = todo.text; $('#edit-dialog').showModal(); $('#edit-text').focus();
}
$('#edit-cancel').addEventListener('click', () => $('#edit-dialog').close());
$('#edit-form').addEventListener('submit', async event => {
  event.preventDefault(); const text = $('#edit-text').value.trim();
  if (!text) { $('#edit-text').setCustomValidity('할 일을 입력해 주세요.'); $('#edit-text').reportValidity(); return; }
  if (!connected) { notice('연결이 복구된 뒤 다시 저장해 주세요.', true); return; }
  const id = editingId;
  if (!todos.some(t => t.id === id)) { $('#edit-dialog').close(); notice('이미 삭제된 할 일이에요.', true); return; }
  $('#edit-save').disabled = true;
  try {
    // Transaction avoids recreating a task deleted on another device.
    const result = await api.runTransaction(api.ref(db, `todos/${id}`), current => current === null ? undefined : {...current,text,updatedAt:Date.now()});
    $('#edit-dialog').close(); notice(result.committed ? '할 일을 수정했어요.' : '이미 삭제된 할 일이에요.', !result.committed);
  } catch(error) { failure(error); }
  finally { $('#edit-save').disabled = false; }
});
$('#edit-text').addEventListener('input', () => $('#edit-text').setCustomValidity(''));
$('#new-todo').addEventListener('input', () => $('#new-todo').setCustomValidity(''));
$('#add-form').addEventListener('submit', async event => {
  event.preventDefault(); const input = $('#new-todo'), text = input.value.trim();
  if (!text) { input.setCustomValidity('할 일을 입력해 주세요.'); input.reportValidity(); return; }
  if (!ready || !connected || pending.has('add')) return;
  pending.add('add'); updateConnection();
  try {
    await api.set(api.push(api.ref(db, 'todos')), {text,completed:false,createdAt:api.serverTimestamp(),updatedAt:api.serverTimestamp()});
    if (input.value.trim() === text) input.value = '';
    notice('새로운 할 일을 추가했어요.'); input.focus();
  } catch(error) { failure(error); }
  finally { pending.delete('add'); updateConnection(); }
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); }); render();
}));
try {
  const [{initializeApp}, database] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js')
  ]);
  api = database; db = api.getDatabase(initializeApp(firebaseConfig));
  api.onValue(api.ref(db, '.info/connected'), snapshot => { connected = snapshot.val() === true; updateConnection(); render(); });
  api.onValue(api.ref(db, 'todos'), snapshot => {
    todos = Object.entries(snapshot.val() || {}).filter(([,value]) => value && typeof value.text === 'string').map(([id,value]) => ({...value,id,completed:value.completed === true})).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0) || b.id.localeCompare(a.id));
    ready = true; updateConnection(); render();
  }, error => { ready = false; updateConnection(); $('#connection').classList.add('error'); $('#connection span').textContent = '접근 권한 확인 필요'; $('#empty h2').textContent = '할 일을 불러올 수 없어요'; $('#empty p').textContent = 'Firebase 데이터베이스 규칙을 확인해 주세요.'; failure(error); });
} catch(error) {
  failure(error); $('#connection').classList.add('error'); $('#connection span').textContent = 'Firebase 연결 실패';
  $('#empty h2').textContent = '연결을 확인해 주세요'; $('#empty p').textContent = '인터넷 연결을 확인하고 페이지를 새로고침해 주세요.';
}
