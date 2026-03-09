import { generateResponse } from '../../lib/responseFormate.js';
import {
  createContact,
  getContactById,
  listContacts,
  deleteContact,
  updateContact
} from './contact.service.js';

export const createContactController = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id ? req.user._id : null; 
    const data = await createContact(userId, req.body);
    generateResponse(res, 201, true, 'Contact created', data);
  } catch (err) {
    next(err);
  }
};

export const getContactByIdController = async (req, res, next) => {
  try {
    const data = await getContactById(req.params.id);
    generateResponse(res, 200, true, 'Contact fetched', data);
  } catch (err) {
    next(err);
  }
};

export const listContactsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const data = await listContacts({ page, limit });
    generateResponse(res, 200, true, 'Contacts fetched', data);
  } catch (err) {
    next(err);
  }
};

export const deleteContactController = async (req, res, next) => {
  try {
    await deleteContact(req.params.id);
    generateResponse(res, 200, true, 'Contact deleted', { success: true });
  } catch (err) {
    next(err);
  }
};

export const updateContactController = async (req, res, next) => {
  try {
    const data = await updateContact(req.params.id, req.body);
    generateResponse(res, 200, true, 'Contact updated', data);
  } catch (err) {
    next(err);
  }
};
