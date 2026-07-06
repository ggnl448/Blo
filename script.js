/* ================= CONNECTION WATCHDOG ================= */
(function() {
  var loaded = false;
  window.addEventListener('load', function() { loaded = true; });
  setTimeout(function() {
    if (!loaded || (navigator && navigator.onLine === false)) {
      var el = document.getElementById('connWarning');
      el.classList.add('show');
      setTimeout(function() { el.classList.remove('show'); }, 6000);
    }
  }, 5000);
  window.addEventListener('offline', function() {
    var el = document.getElementById('connWarning');
    el.classList.add('show');
  });
  window.addEventListener('online', function() {
    document.getElementById('connWarning').classList.remove('show');
  });
})();

/* ================= PAGE SWITCHING ================= */
const pageMeta = {
  tasks:  { logo: 'TASKS',  subtitle: 'Task Manager' },
  notes:  { logo: 'NOTES',  subtitle: 'Quick Notes' },
  design: { logo: 'DESIGN', subtitle: 'Design Editor' }
};

function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-' + name).classList.add('active');
  document.getElementById('pageLogo').textContent = pageMeta[name].logo;
  document.getElementById('pageSubtitle').textContent = pageMeta[name].subtitle;
}

/* ================= TASKS ================= */
let tasks = JSON.parse(localStorage.getItem('tasks_manager') || '[]');
let currentColor = 'green';
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks_manager', JSON.stringify(tasks));
  updateStats();
  renderTasks();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('countAll').textContent = total;
  document.getElementById('countActive').textContent = active;
  document.getElementById('countDone').textContent = completed;
  document.getElementById('percentageText').textContent = percentage + '%';
  document.getElementById('progressLabel').textContent = `${completed} из ${total} выполнено`;
  document.getElementById('completionPercent').textContent = percentage + '%';

  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (percentage / 100) * circumference;
  document.getElementById('progressCircle').style.strokeDashoffset = offset;
}

function setFilter(filter, e) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
  if (e && e.target) e.target.classList.add('active');
  renderTasks();
}

function setColor(color) {
  currentColor = color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector(`[data-color="${color}"]`).classList.add('active');
}

function addTask() {
  const input = document.getElementById('noteInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  tasks.unshift({ id: Date.now().toString(), text, color: currentColor, completed: false, createdAt: Date.now() });
  saveTasks();
  input.value = '';
  input.focus();
}

document.getElementById('noteInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(); }
});

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.completed = !task.completed; saveTasks(); }
}

function deleteTask(id) {
  const card = document.querySelector(`#tasksList [data-id="${id}"]`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.93)';
    card.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => { tasks = tasks.filter(t => t.id !== id); saveTasks(); }, 200);
  }
}

function renderTasks() {
  const list = document.getElementById('tasksList');
  list.innerHTML = '';
  let filtered = tasks;
  if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
  else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty"><div class="empty-star">✨</div><div class="empty-title">Список задач пуст</div></div>`;
    return;
  }

  filtered.forEach(task => {
    const card = document.createElement('div');
    card.className = 'card' + (task.completed ? ' completed' : '');
    card.dataset.id = task.id;

    const colorDiv = document.createElement('div');
    colorDiv.className = `card-color ${task.color || 'green'}`;

    const checkbox = document.createElement('div');
    checkbox.className = 'card-checkbox';
    checkbox.innerHTML = task.completed ? '✓' : '';
    checkbox.onclick = (e) => { e.stopPropagation(); toggleTask(task.id); };
    card.onclick = () => toggleTask(task.id);

    const textDiv = document.createElement('div');
    textDiv.className = 'card-text';
    textDiv.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon delete';
    delBtn.innerHTML = '🗑';
    delBtn.onclick = (e) => { e.stopPropagation(); deleteTask(task.id); };
    actions.appendChild(delBtn);

    card.appendChild(colorDiv);
    card.appendChild(checkbox);
    card.appendChild(textDiv);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

/* ================= NOTES ================= */
let notesData = JSON.parse(localStorage.getItem('notes_page') || '[]');

function saveNotes() {
  localStorage.setItem('notes_page', JSON.stringify(notesData));
  renderNotes();
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day:'2-digit', month:'short', year:'numeric' }) + ' · ' + d.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

function addNoteEntry() {
  const input = document.getElementById('noteTextInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  notesData.unshift({ id: Date.now().toString(), text, createdAt: Date.now() });
  saveNotes();
  input.value = '';
  input.focus();
}

document.getElementById('noteTextInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNoteEntry(); }
});

function deleteNoteEntry(id) {
  const card = document.querySelector(`#notesList [data-id="${id}"]`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.93)';
    card.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => { notesData = notesData.filter(n => n.id !== id); saveNotes(); }, 200);
  }
}

function editNoteEntry(id, card, textDiv) {
  const note = notesData.find(n => n.id === id);
  if (!note) return;
  const ta = document.createElement('textarea');
  ta.className = 'edit-area';
  ta.value = note.text;
  textDiv.replaceWith(ta);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  const finish = () => {
    const newText = ta.value.trim();
    if (newText) note.text = newText;
    saveNotes();
  };
  ta.onblur = finish;
}

function renderNotes() {
  const list = document.getElementById('notesList');
  list.innerHTML = '';

  if (notesData.length === 0) {
    list.innerHTML = `<div class="empty"><div class="empty-star">🗒️</div><div class="empty-title">Заметок пока нет</div></div>`;
    return;
  }

  notesData.forEach(note => {
    const card = document.createElement('div');
    card.className = 'card note-card';
    card.dataset.id = note.id;

    const header = document.createElement('div');
    header.className = 'note-header';

    const dateEl = document.createElement('span');
    dateEl.className = 'note-date';
    dateEl.textContent = formatDate(note.createdAt);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const textDiv = document.createElement('div');
    textDiv.className = 'note-text';
    textDiv.textContent = note.text;

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => editNoteEntry(note.id, card, textDiv);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon delete';
    delBtn.innerHTML = '🗑';
    delBtn.onclick = () => deleteNoteEntry(note.id);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    header.appendChild(dateEl);
    header.appendChild(actions);

    card.appendChild(header);
    card.appendChild(textDiv);
    list.appendChild(card);
  });
}

/* ================= DESIGN EDITOR ================= */
let selectedEl = null;
let elIdCounter = 1;
let drawMode = false;

const canvasWrap = document.getElementById('canvasWrap');
const drawLayer = document.getElementById('drawLayer');
const drawCtx = drawLayer.getContext('2d');
const lineWidthInput = document.getElementById('lineWidth');
const colorPicker = document.getElementById('colorPicker');

function sizeDrawLayer() {
  const rect = canvasWrap.getBoundingClientRect();
  // preserve existing drawing when resizing
  const prev = drawLayer.width ? drawLayer.toDataURL() : null;
  drawLayer.width = rect.width;
  drawLayer.height = rect.height;
  if (prev) {
    const img = new Image();
    img.onload = () => drawCtx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = prev;
  }
}
window.addEventListener('load', sizeDrawLayer);
window.addEventListener('resize', sizeDrawLayer);
setTimeout(sizeDrawLayer, 300);

function setDrawMode(on) {
  drawMode = on;
  document.getElementById('drawToolBtn').classList.toggle('active', on);
  document.getElementById('selectToolBtn').classList.toggle('active', !on);
  drawLayer.style.pointerEvents = on ? 'auto' : 'none';
  if (on) {
    canvasWrap.appendChild(drawLayer); // bring to front so strokes land on top
    if (selectedEl) { selectedEl.classList.remove('selected'); selectedEl = null; }
  } else {
    canvasWrap.insertBefore(drawLayer, canvasWrap.firstChild); // send to back
  }
}
setDrawMode(false);

// Freehand drawing (pointer events unify mouse + touch + pen)
let isDrawing = false, lastX = 0, lastY = 0;
drawLayer.addEventListener('pointerdown', (e) => {
  if (!drawMode) return;
  isDrawing = true;
  const rect = drawLayer.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
  drawLayer.setPointerCapture(e.pointerId);
});
drawLayer.addEventListener('pointermove', (e) => {
  if (!isDrawing || !drawMode) return;
  const rect = drawLayer.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  drawCtx.strokeStyle = colorPicker.value;
  drawCtx.lineWidth = lineWidthInput.value;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
  drawCtx.beginPath();
  drawCtx.moveTo(lastX, lastY);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();
  lastX = x; lastY = y;
});
drawLayer.addEventListener('pointerup', () => { isDrawing = false; });
drawLayer.addEventListener('pointerleave', () => { isDrawing = false; });

function addShape(type) {
  const id = 'el' + (elIdCounter++);
  const el = document.createElement('div');
  el.className = 'canvas-el';
  el.dataset.id = id;
  el.dataset.rotation = '0';
  el.style.left = '40px';
  el.style.top = '40px';

  if (type === 'rect') {
    el.style.width = '120px';
    el.style.height = '80px';
    el.style.background = '#6b8aff';
    el.dataset.type = 'rect';
  } else if (type === 'circle') {
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.background = '#9966ff';
    el.style.borderRadius = '50%';
    el.dataset.type = 'circle';
  } else if (type === 'text') {
    el.style.width = '160px';
    el.style.height = '40px';
    el.dataset.type = 'text';
    el.dataset.fontSize = '16';
    const txt = document.createElement('div');
    txt.className = 'text-content';
    txt.contentEditable = 'true';
    txt.style.fontSize = '16px';
    txt.textContent = 'Текст';
    el.appendChild(txt);
  }

  const handle = document.createElement('div');
  handle.className = 'resize-handle';
  const rotateHandle = document.createElement('div');
  rotateHandle.className = 'rotate-handle';
  rotateHandle.innerHTML = '↻';
  el.appendChild(handle);
  el.appendChild(rotateHandle);

  attachInteractions(el, handle, rotateHandle);
  canvasWrap.appendChild(el);
  setDrawMode(false);
  selectElement(el);
}

function triggerImageUpload() {
  document.getElementById('imageUploadInput').click();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const id = 'el' + (elIdCounter++);
    const el = document.createElement('div');
    el.className = 'canvas-el';
    el.dataset.id = id;
    el.dataset.type = 'image';
    el.dataset.rotation = '0';
    el.style.left = '40px';
    el.style.top = '40px';
    el.style.width = '160px';
    el.style.height = '120px';

    const img = document.createElement('img');
    img.src = ev.target.result;
    el.appendChild(img);

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.innerHTML = '↻';
    el.appendChild(handle);
    el.appendChild(rotateHandle);

    attachInteractions(el, handle, rotateHandle);
    canvasWrap.appendChild(el);
    setDrawMode(false);
    selectElement(el);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function selectElement(el) {
  if (selectedEl) selectedEl.classList.remove('selected');
  selectedEl = el;
  el.classList.add('selected');
}

canvasWrap.addEventListener('click', (e) => {
  if (e.target === canvasWrap) {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = null;
  }
});

function applyRotation(el, deg) {
  el.dataset.rotation = deg;
  el.style.transform = `rotate(${deg}deg)`;
}

function attachInteractions(el, handle, rotateHandle) {
  // ---- Desktop: drag to move ----
  el.addEventListener('mousedown', (e) => {
    if (e.target === handle || e.target === rotateHandle) return;
    if (e.target.classList.contains('text-content')) { selectElement(el); return; }
    e.preventDefault();
    selectElement(el);
    const startX = e.clientX, startY = e.clientY;
    const startLeft = el.offsetLeft, startTop = el.offsetTop;

    function onMove(ev) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let newLeft = startLeft + dx, newTop = startTop + dy;
      newLeft = Math.max(0, Math.min(newLeft, canvasWrap.clientWidth - el.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, canvasWrap.clientHeight - el.offsetHeight));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // ---- Desktop: resize handle ----
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
    const startX = e.clientX, startY = e.clientY;
    const startW = el.offsetWidth, startH = el.offsetHeight;

    function onMove(ev) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      el.style.width = Math.max(30, startW + dx) + 'px';
      el.style.height = Math.max(30, startH + dy) + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // ---- Desktop: rotate handle ----
  rotateHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startRotation = parseFloat(el.dataset.rotation || '0');
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;

    function onMove(ev) {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
      applyRotation(el, startRotation + (angle - startAngle));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // ---- Touch: 1 finger move only (tracked by its own touch ID) ----
  el.addEventListener('touchstart', (e) => {
    if (e.target === handle || e.target === rotateHandle) return;
    if (e.touches.length !== 1) return; // 2-finger gestures are handled at canvasWrap level
    selectElement(el);

    const touchId = e.changedTouches[0].identifier;
    const touch = e.changedTouches[0];
    const startX = touch.clientX, startY = touch.clientY;
    const startLeft = el.offsetLeft, startTop = el.offsetTop;

    function onMove(ev) {
      const t = getTouchById(ev.touches, touchId);
      if (!t) return;
      const dx = t.clientX - startX, dy = t.clientY - startY;
      let newLeft = startLeft + dx, newTop = startTop + dy;
      newLeft = Math.max(0, Math.min(newLeft, canvasWrap.clientWidth - el.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, canvasWrap.clientHeight - el.offsetHeight));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    }
    function onEnd(ev) {
      if (!getTouchById(ev.touches, touchId)) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, { passive: false });

  
      // ---- Touch: resize handle (tracked by its own touch ID) ----
  handle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
    const touchId = e.changedTouches[0].identifier;
    const touch = e.changedTouches[0];
    const startX = touch.clientX, startY = touch.clientY;
    const startW = el.offsetWidth, startH = el.offsetHeight;

    function onMove(ev) {
      const t = getTouchById(ev.touches, touchId);
      if (!t) return;
      const dx = t.clientX - startX, dy = t.clientY - startY;
      el.style.width = Math.max(30, startW + dx) + 'px';
      el.style.height = Math.max(30, startH + dy) + 'px';
    }
    function onEnd(ev) {
      if (!getTouchById(ev.touches, touchId)) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, { passive: false });

  // ---- Touch: rotate handle (tracked by its own touch ID) ----
  rotateHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startRotation = parseFloat(el.dataset.rotation || '0');
    const touchId = e.changedTouches[0].identifier;
    const touch = e.changedTouches[0];
    const startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180 / Math.PI;

    function onMove(ev) {
      const t = getTouchById(ev.touches, touchId);
      if (!t) return;
      const angle = Math.atan2(t.clientY - centerY, t.clientX - centerX) * 180 / Math.PI;
      applyRotation(el, startRotation + (angle - startAngle));
    }
    function onEnd(ev) {
      if (!getTouchById(ev.touches, touchId)) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, { passive: false });
}

// Helper: find a specific touch by its identifier within a TouchList
function getTouchById(touchList, id) {
  for (let i = 0; i < touchList.length; i++) {
    if (touchList[i].identifier === id) return touchList[i];
  }
  return null;
}

// ---- Touch: 2-finger pinch-zoom + rotate — acts ONLY on the selected element,
// and ONLY uses the two touch IDs that started this specific gesture ----
canvasWrap.addEventListener('touchstart', (e) => {
  if (drawMode) return;
  if (e.touches.length !== 2 || !selectedEl) return;
  e.preventDefault();
  const el = selectedEl;

  const id1 = e.touches[0].identifier;
  const id2 = e.touches[1].identifier;
  const t1 = e.touches[0], t2 = e.touches[1];
  const initDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const initAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
  const type = el.dataset.type;
  const startFontSize = parseFloat(el.dataset.fontSize || '16');
  const startW = el.offsetWidth, startH = el.offsetHeight;
  const startRotation = parseFloat(el.dataset.rotation || '0');

  function onMove(ev) {
    const a = getTouchById(ev.touches, id1);
    const b = getTouchById(ev.touches, id2);
    if (!a || !b) return; // one of the original two fingers lifted — ignore
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const angle = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
    const scale = dist / initDist;

    if (type === 'text') {
      const newSize = Math.min(200, Math.max(8, startFontSize * scale));
      el.dataset.fontSize = newSize;
      const txt = el.querySelector('.text-content');
      if (txt) txt.style.fontSize = newSize + 'px';
    } else {
      el.style.width = Math.max(20, startW * scale) + 'px';
      el.style.height = Math.max(20, startH * scale) + 'px';
    }
    applyRotation(el, startRotation + (angle - initAngle));
  }
  function onEnd(ev) {
    if (!getTouchById(ev.touches, id1) || !getTouchById(ev.touches, id2)) {
      canvasWrap.removeEventListener('touchmove', onMove);
      canvasWrap.removeEventListener('touchend', onEnd);
    }
  }
  canvasWrap.addEventListener('touchmove', onMove, { passive: false });
  canvasWrap.addEventListener('touchend', onEnd);
}, { passive: false });

function applyColor(color) {
  if (!selectedEl) return;
  const type = selectedEl.dataset.type;
  if (type === 'text') {
    const txt = selectedEl.querySelector('.text-content');
    if (txt) txt.style.color = color;
  } else if (type === 'rect' || type === 'circle') {
    selectedEl.style.background = color;
  }
}

function bringForward() {
  if (!selectedEl) return;
  canvasWrap.appendChild(selectedEl);
  if (drawMode) canvasWrap.appendChild(drawLayer);
}

function sendBackward() {
  if (!selectedEl) return;
  canvasWrap.insertBefore(selectedEl, canvasWrap.firstChild);
}

function deleteSelected() {
  if (!selectedEl) return;
  selectedEl.remove();
  selectedEl = null;
}

function clearCanvas() {
  if (confirm('Очистить всё полотно?')) {
    document.querySelectorAll('.canvas-el').forEach(el => el.remove());
    drawCtx.clearRect(0, 0, drawLayer.width, drawLayer.height);
    selectedEl = null;
  }
}

function exportCanvas() {
  if (selectedEl) selectedEl.classList.remove('selected');

  // Hide all resize/rotate handles so they don't get baked into the exported image
  const handles = canvasWrap.querySelectorAll('.resize-handle, .rotate-handle');
  handles.forEach(h => h.style.display = 'none');

  html2canvas(canvasWrap, { backgroundColor: '#ffffff' }).then(canvas => {
    handles.forEach(h => h.style.display = '');
    if (selectedEl) selectedEl.classList.add('selected');

    const link = document.createElement('a');
    link.download = 'design-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(() => {
    // Ensure handles are restored even if export fails
    handles.forEach(h => h.style.display = '');
    if (selectedEl) selectedEl.classList.add('selected');
  });
}

/* ================= EVENT WIRING (no inline handlers = strict CSP works) ================= */

// -- Bottom nav --
document.getElementById('nav-tasks').addEventListener('click', () => switchPage('tasks'));
document.getElementById('nav-notes').addEventListener('click', () => switchPage('notes'));
document.getElementById('nav-design').addEventListener('click', () => switchPage('design'));

// -- Tasks page --
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => setColor(dot.dataset.color));
});
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', (e) => setFilter(tab.dataset.filter, e));
});

// -- Notes page --
document.getElementById('addNoteBtn').addEventListener('click', addNoteEntry);

// -- Design toolbar --
document.getElementById('selectToolBtn').addEventListener('click', () => setDrawMode(false));
document.getElementById('drawToolBtn').addEventListener('click', () => setDrawMode(true));
document.getElementById('addRectBtn').addEventListener('click', () => addShape('rect'));
document.getElementById('addCircleBtn').addEventListener('click', () => addShape('circle'));
document.getElementById('addTextBtn').addEventListener('click', () => addShape('text'));
document.getElementById('addImageBtn').addEventListener('click', triggerImageUpload);
document.getElementById('colorPicker').addEventListener('change', (e) => applyColor(e.target.value));
document.getElementById('bringForwardBtn').addEventListener('click', bringForward);
document.getElementById('sendBackwardBtn').addEventListener('click', sendBackward);
document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
document.getElementById('clearCanvasBtn').addEventListener('click', clearCanvas);
document.getElementById('exportCanvasBtn').addEventListener('click', exportCanvas);
document.getElementById('imageUploadInput').addEventListener('change', handleImageUpload);

/* ================= STORAGE HARDENING =================
   Defense-in-depth: even though rendering always uses textContent (never
   innerHTML) for user data, we still validate the *shape and type* of
   anything read back from localStorage. This blocks a corrupted or
   tampered storage entry (e.g. from a malicious browser extension, or a
   shared/public computer) from injecting unexpected object shapes,
   oversized payloads, or non-string fields into the app's state. */
function sanitizePlainText(value, maxLen) {
  if (typeof value !== 'string') return '';
  // Strip any control characters and hard-cap length; textContent already
  // prevents HTML execution, this just guards against junk/oversized data.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, maxLen);
}

function sanitizeTasksArray(arr) {
  if (!Array.isArray(arr)) return [];
  const allowedColors = ['green', 'yellow', 'red'];
  return arr
    .filter(t => t && typeof t === 'object')
    .map(t => ({
      id: sanitizePlainText(String(t.id ?? Date.now()), 50) || Date.now().toString(),
      text: sanitizePlainText(t.text, 300),
      color: allowedColors.includes(t.color) ? t.color : 'green',
      completed: Boolean(t.completed),
      createdAt: Number.isFinite(t.createdAt) ? t.createdAt : Date.now()
    }))
    .filter(t => t.text.length > 0);
}

function sanitizeNotesArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(n => n && typeof n === 'object')
    .map(n => ({
      id: sanitizePlainText(String(n.id ?? Date.now()), 50) || Date.now().toString(),
      text: sanitizePlainText(n.text, 2000),
      createdAt: Number.isFinite(n.createdAt) ? n.createdAt : Date.now()
    }))
    .filter(n => n.text.length > 0);
}

function safeLoadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Ignoring corrupted storage entry for', key);
    return null;
  }
}

// Re-load and sanitize whatever was parsed earlier at script start
tasks = sanitizeTasksArray(safeLoadJSON('tasks_manager') || tasks);
notesData = sanitizeNotesArray(safeLoadJSON('notes_page') || notesData);

/* ================= CONTENTEDITABLE PASTE HARDENING =================
   The design editor's text tool uses contenteditable, which by default
   lets a paste bring in rich HTML (including attributes like onerror=
   that some browsers may still execute). We force every paste into
   plain text only, stripping all markup and event-handler payloads. */
canvasWrap.addEventListener('paste', (e) => {
  if (!e.target.classList || !e.target.classList.contains('text-content')) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});

/* ================= INIT ================= */
updateStats();
renderTasks();
renderNotes();