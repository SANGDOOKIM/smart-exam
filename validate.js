// questions.js 검증 스크립트 (node validate.js)
const fs = require('fs');
const window = {};
eval(fs.readFileSync(__dirname + '/questions.js', 'utf8'));
const Q = window.QUESTIONS;
const err = [];
const choice = Q.filter(q => q.type === 'choice'), short = Q.filter(q => q.type === 'short');
console.log(`1) 전체 ${Q.length} / 객관식 ${choice.length} / 단답형 ${short.length}`);
if (Q.length !== 220 || choice.length !== 200 || short.length !== 20) err.push('문제 수 불일치');
const ids = new Set(Q.map(q => q.id));
if (ids.size !== Q.length) err.push('id 중복');
const pad = n => String(n).padStart(3, '0');
for (const [p, n] of [['G', 100], ['C', 100], ['S', 20]])
  for (let i = 1; i <= n; i++) if (!ids.has(`${p}-${pad(i)}`)) err.push(`누락 ${p}-${pad(i)}`);
console.log('2) id 중복·누락 검사 완료');
choice.forEach(q => {
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => !o.trim())) err.push(`${q.id} 보기 오류`);
  if (![1, 2, 3, 4].includes(q.answer)) err.push(`${q.id} 정답 범위 오류`);
});
console.log('3~4) 객관식 보기 4개·정답 1~4 검사 완료');
short.forEach(q => { if (!q.answer || !q.accepted || !q.accepted.length) err.push(`${q.id} 단답 정답 누락`); });
console.log('5) 단답형 answer/accepted 검사 완료');
const junk = /Page|예상문제집|\[제\d영역\]|정답표|응원/;
Q.forEach(q => { if (junk.test(q.question + (q.options || []).join(''))) err.push(`${q.id} 잔여 문구`); });
console.log('7) 잔여 문구 검사 완료');
console.log(err.length ? '❌ 오류:\n' + err.join('\n') : '✅ 오류 없음');
