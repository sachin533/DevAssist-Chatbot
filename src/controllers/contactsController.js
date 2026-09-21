import * as repo from '../repositories/contactRepository.js';
import { validateContactInput, parsePaging } from '../utils/validation.js';

function isUniqueViolation(err) {
  const num = err?.number;
  const msg = `${err?.message ?? ''} ${err?.originalError?.message ?? ''}`;
  return num === 2627 || num === 2601 || /UNIQUE|duplicate/i.test(msg);
}

export async function listContacts(req, res, next) {
  try {
    const { pageNumber, pageSize, searchTerm } = parsePaging(req.query);
    const result = await repo.getContactsPaged(pageNumber, pageSize, searchTerm);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getContact(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id.' });
    const contact = await repo.getContactById(id);
    if (!contact) return res.status(404).json({ message: 'Contact not found.' });
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function createContact(req, res, next) {
  try {
    const { errors, value } = validateContactInput(req.body);
    if (errors.length) return res.status(400).json({ message: 'Validation failed.', errors });
    const created = await repo.insertContact(value);
    res.status(201).json(created);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(400).json({ message: 'PhoneNumber must be unique.', errors: ['PhoneNumber already exists.'] });
    }
    next(err);
  }
}

export async function updateContact(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id.' });
    const { errors, value } = validateContactInput(req.body);
    if (errors.length) return res.status(400).json({ message: 'Validation failed.', errors });
    const existing = await repo.getContactById(id);
    if (!existing) return res.status(404).json({ message: 'Contact not found.' });
    const updated = await repo.updateContact(id, value);
    res.json(updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(400).json({ message: 'PhoneNumber must be unique.', errors: ['PhoneNumber already exists.'] });
    }
    next(err);
  }
}

export async function deleteContact(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id.' });
    const existing = await repo.getContactById(id);
    if (!existing) return res.status(404).json({ message: 'Contact not found.' });
    await repo.deleteContact(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function checkPhone(req, res, next) {
  try {
    const phoneNumber = (req.query.phoneNumber ?? '').toString().trim();
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;
    if (!phoneNumber) return res.status(400).json({ message: 'phoneNumber query param is required.' });
    const exists = await repo.phoneExists(phoneNumber, Number.isInteger(excludeId) ? excludeId : null);
    res.json({ phoneNumber, exists });
  } catch (err) {
    next(err);
  }
}
