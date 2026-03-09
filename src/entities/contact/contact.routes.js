import express from 'express';
import { verifyToken } from '../../core/middlewares/authMiddleware.js';
import validateRequest from '../../core/middlewares/validateRequest.js';

import {
    createContactController,
    getContactByIdController,
    listContactsController,
    deleteContactController,
    updateContactController
} from './contact.controller.js';

import { createContactSchema } from './contact.validation.js';

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'ADMIN' || req.user?.isAdmin === true) return next();
  return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
};

const router = express.Router();

// public contact creation (no auth required)
router.post('/', validateRequest(createContactSchema), createContactController);

// admin-only contact management
router.get('/', verifyToken, requireAdmin, listContactsController);
router.get('/:id', verifyToken, requireAdmin, getContactByIdController);
router.put('/:id', verifyToken, requireAdmin, updateContactController);
router.delete('/:id', verifyToken, requireAdmin, deleteContactController);

export default router;
