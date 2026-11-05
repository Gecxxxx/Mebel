import test from 'node:test';
import assert from 'node:assert/strict';
import { quizQuestions, validateQuizStep } from '../src/data/quiz.js';

test('five-question quiz requires an answer at every step and consent at contact step', () => {
  assert.equal(quizQuestions.length, 5);
  for (let i = 0; i < 5; i++) assert.ok(validateQuizStep(i, {}));
  const values = { kind: 'Кухня', city: 'Елец', project: 'Нужен замер', timing: 'В ближайший месяц', name: 'Анна', phone: '+7 (900) 123-45-67', consent: true };
  for (let i = 0; i < 5; i++) assert.equal(validateQuizStep(i, values), '');
  assert.ok(validateQuizStep(0, { ...values, kind: 'unknown' }));
  assert.ok(validateQuizStep(4, { ...values, consent: false }));
  assert.ok(validateQuizStep(4, { ...values, phone: '123' }));
});
