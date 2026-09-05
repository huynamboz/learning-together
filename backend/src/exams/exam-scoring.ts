import { calculateExamScore, isAnswerCorrect } from '@/learning/answer-evaluator';

export interface ExamQuestionForScoring { id: string; answerKey: string | null }
export interface ExamAnswerForScoring { questionId: string; selectedAnswer: string | null }

export function scoreExam(questions: ExamQuestionForScoring[], answers: ExamAnswerForScoring[]) {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const correct = questions.filter((question) => isAnswerCorrect(question.answerKey, answerMap.get(question.id))).length;
  const unanswered = questions.filter((question) => !answerMap.get(question.id)).length;
  const total = questions.length;
  return { total, correct, wrong: total - correct - unanswered, unanswered, score: calculateExamScore(correct, total) };
}
