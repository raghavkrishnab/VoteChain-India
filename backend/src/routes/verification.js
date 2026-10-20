import {Router} from 'express';
import multer from 'multer';
import {auth} from '../middleware/auth.js';
import {face} from '../controllers/verificationController.js';
const r=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024}});
r.post('/face',auth,upload.fields([{name:'image',maxCount:1},{name:'reference',maxCount:1}]),face);
r.get('/status',auth,(q,s)=>s.json({status:q.user.verificationStatus}));
export default r;
