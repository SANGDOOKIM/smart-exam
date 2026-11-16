// 채점 검증: 17개 정답 → fail, 18개 정답 → pass (node test-grade.js)
const { grade, isCorrect } = require('./app.js');
const qs = Array.from({ length: 25 }, (_, i) => ({ type: 'choice', answer: 1 }));
const make = n => qs.map((_, i) => (i < n ? 1 : 2));
const r17 = grade(qs, make(17)), r18 = grade(qs, make(18));
console.log('17개 정답 →', r17.correct, r17.pass ? 'pass' : 'fail');
console.log('18개 정답 →', r18.correct, r18.pass ? 'pass' : 'fail');
const s = { type: 'short', answer: '디지털 트윈', accepted: ['디지털 트윈', '디지털트윈', 'Digital Twin'] };
console.log('단답 " digital  twin " →', isCorrect(s, ' digital  twin '));
console.log('단답 공백만 →', isCorrect(s, '   '));
if (r17.pass || !r18.pass || !isCorrect(s, ' digital  twin ') || isCorrect(s, '  ')) { console.log('❌ 실패'); process.exit(1); }
console.log('✅ 채점 검증 통과');
