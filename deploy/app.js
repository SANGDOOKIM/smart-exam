// 스마트공장 수준확인 심사원 모의고사
const EXAM_SIZE = 25;
const PASS_LINE = 18;
const STORAGE_KEY = 'smartExamHistory';

// ===== 채점 함수 (브라우저/노드 공용) =====
function normalize(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
}
function isCorrect(q, userAnswer) {
  if (userAnswer == null || normalize(userAnswer) === '') return false;
  if (q.type === 'choice') return Number(userAnswer) === q.answer;
  const list = [q.answer].concat(q.accepted || []).map(normalize);
  return list.includes(normalize(userAnswer));
}
function grade(questions, answers) {
  let correct = 0;
  questions.forEach((q, i) => { if (isCorrect(q, answers[i])) correct++; });
  return { correct, pass: correct >= PASS_LINE };
}
if (typeof module !== 'undefined') module.exports = { normalize, isCorrect, grade, PASS_LINE };

// ===== 화면 동작 (브라우저에서만) =====
if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  let exam = [];      // 이번 회차 25문제
  let answers = [];   // 사용자 답
  let idx = 0;        // 현재 문제 번호(0부터)
  let finished = false; // 채점·저장 완료 여부

  // --- 공통 ---
  function show(screen) {
    ['screen-start', 'screen-quiz', 'screen-history'].forEach(id => $(id).classList.add('hidden'));
    $(screen).classList.remove('hidden');
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 화면 가운데 알림창 (확인 / 확인+취소)
  function modal(html, { cancel = false } = {}) {
    return new Promise(resolve => {
      $('modal-msg').innerHTML = html;
      $('modal-cancel').classList.toggle('hidden', !cancel);
      $('modal').classList.remove('hidden');
      const close = (v) => {
        $('modal').classList.add('hidden');
        $('modal-ok').onclick = $('modal-cancel').onclick = null;
        resolve(v);
      };
      $('modal-ok').onclick = () => close(true);
      $('modal-cancel').onclick = () => close(false);
      $('modal-ok').focus();
    });
  }

  // --- 기록 ---
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function saveRecord(result) {
    const list = loadHistory();
    list.push({ date: today(), round: list.length + 1, correct: result.correct, total: EXAM_SIZE, pass: result.pass });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* 저장 불가 환경 */ }
  }
  function renderHistory() {
    const list = loadHistory().slice().reverse(); // 최신 기록이 위
    $('history-body').innerHTML = list.map(r =>
      `<tr><td>${r.date}</td><td>${r.round}회</td><td>${r.correct}/${r.total}</td>` +
      `<td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'pass' : 'fail'}</td></tr>`).join('');
    $('history-empty').classList.toggle('hidden', list.length > 0);
    show('screen-history');
  }

  // --- 기능01: 220문제 중 25문제 무작위(중복 없음) ---
  function pickRandom(all, n) {
    const arr = all.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
  }
  function startExam() {
    exam = pickRandom(window.QUESTIONS, EXAM_SIZE);
    answers = new Array(EXAM_SIZE).fill(null);
    idx = 0;
    finished = false;
    show('screen-quiz');
    renderQuestion();
  }

  // --- 기능02: 한 화면에 한 문제 ---
  function renderQuestion() {
    const q = exam[idx];
    $('q-no').textContent = idx + 1;
    let html = `<div class="q-meta">${q.type === 'choice' ? '객관식' : '단답형'} · ${q.id}</div>` +
               `<div class="q-text">${idx + 1}. ${escapeHtml(q.question)}</div>`;
    if (q.type === 'choice') {
      html += q.options.map((o, i) =>
        `<label class="option${answers[idx] === i + 1 ? ' selected' : ''}">` +
        `<input type="radio" name="opt" value="${i + 1}"${answers[idx] === i + 1 ? ' checked' : ''}>` +
        `<span>${'①②③④'[i]} ${escapeHtml(o)}</span></label>`).join('');
    } else {
      html += `<input id="short-input" class="short-input" type="text" autocomplete="off" placeholder="정답을 입력하세요" value="${escapeHtml(answers[idx] || '')}">`;
    }
    $('question-area').innerHTML = html;
    $('question-area').scrollTop = 0;
    $('answer-area').innerHTML = '<p class="placeholder">[답 확인]을 누르면 정답이 여기에 표시됩니다.</p>';

    if (q.type === 'choice') {
      document.querySelectorAll('input[name="opt"]').forEach(r => r.addEventListener('change', () => {
        answers[idx] = Number(r.value);
        document.querySelectorAll('.option').forEach(l => l.classList.toggle('selected', l.contains(document.querySelector('input[name="opt"]:checked'))));
      }));
    } else {
      const inp = $('short-input');
      inp.addEventListener('input', () => { answers[idx] = inp.value; });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') onNext(); });
    }
  }

  // --- 기능03: 답 확인 ---
  function onCheck() {
    if (!exam.length) return;
    const q = exam[idx];
    const ans = q.type === 'choice' ? `${'①②③④'[q.answer - 1]} ${escapeHtml(q.options[q.answer - 1])}` : escapeHtml(q.answer);
    let html = `<div class="ans-title">정답: ${ans}</div>`;
    if (q.explanation) html += `<div class="ans-exp">해설: ${escapeHtml(q.explanation)}</div>`;
    $('answer-area').innerHTML = html;
  }

  // --- 기능03~05: Next ---
  async function onNext() {
    if (finished) {
      await modal('이번 모의고사는 끝났어요.<br>[모의종료]를 누르면 기록을 볼 수 있어요.');
      return;
    }
    // 기능04: 미응답이면 진행 불가 (공백만 입력도 미응답)
    if (answers[idx] == null || normalize(answers[idx]) === '') {
      await modal('답을 하지 않으면 모의고사가 진행되지 않아요');
      return;
    }
    if (idx < EXAM_SIZE - 1) {
      idx++;
      renderQuestion();
      return;
    }
    // 기능05: 마지막 문제 → 채점, 기록 1회 저장
    const result = grade(exam, answers);
    finished = true;
    saveRecord(result);
    await modal(`${EXAM_SIZE}문제 중 ${result.correct}문제 정답` +
      `<span class="big ${result.pass ? 'pass' : 'fail'}">${result.pass ? 'pass' : 'fail'}</span>`);
  }

  // --- 기능06: 모의종료 ---
  async function onEnd() {
    if (finished) { renderHistory(); return; }
    const ok = await modal('지금 종료하면 안 푼 문제는 오답으로 기록됩니다', { cancel: true });
    if (!ok) return;
    const result = grade(exam, answers);
    finished = true;
    saveRecord(result);
    renderHistory();
  }

  $('btn-start').onclick = startExam;
  $('btn-history').onclick = renderHistory;
  $('btn-restart').onclick = startExam;
  $('btn-home').onclick = () => show('screen-start');
  $('btn-check').onclick = onCheck;
  $('btn-next').onclick = onNext;
  $('btn-end').onclick = onEnd;
}
