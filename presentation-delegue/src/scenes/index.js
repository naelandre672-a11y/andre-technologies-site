/** Assemble les scènes dans l'ordre du voyage. */
import { creerIntro } from './intro.js';
import { creerCouloir } from './couloir.js';
import { creerProgramme } from './programme.js';
import { creerParcoursup } from './parcoursup.js';
import { creerConseil } from './conseil.js';
import { creerQuiz } from './quiz.js';
import { creerFinal } from './final.js';

export function creerScenes(ctx) {
  return {
    intro: creerIntro(ctx),
    couloir: creerCouloir(ctx),
    programme: creerProgramme(ctx),
    parcoursup: creerParcoursup(ctx),
    conseil: creerConseil(ctx),
    quiz: creerQuiz(ctx),
    final: creerFinal(ctx),
  };
}
