import { Router } from 'express';

import { list, get, create, start, end, addCandidate, candidates, results } from '../controllers/electionController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const r = Router();

r.get('/', list);
r.get('/:id', get);
r.get('/:id/candidates', candidates);
r.get('/:id/results', results);
r.post('/', auth, adminOnly, create);
r.post('/:id/candidates', auth, adminOnly, addCandidate);
r.patch('/:id/start', auth, adminOnly, start);
r.patch('/:id/end', auth, adminOnly, end);

export default r;
