import { Router } from 'express';
import * as ctrl from '../controllers/contactsController.js';

const router = Router();

router.get('/check-phone', ctrl.checkPhone);
router.get('/', ctrl.listContacts);
router.get('/:id', ctrl.getContact);
router.post('/', ctrl.createContact);
router.put('/:id', ctrl.updateContact);
router.delete('/:id', ctrl.deleteContact);

export default router;
