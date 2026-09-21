import { getPool, sql } from '../config/db.js';
import { toContact, toContactList } from '../models/contact.js';
import { toPagedResult } from '../models/pagedResult.js';

// Repository layer — ALL data access goes through Stored Procedures.
// No ad-hoc SQL for CRUD, no ORM / query builder.
export async function getContactsPaged(pageNumber = 1, pageSize = 10, searchTerm = '') {
  const pool = await getPool();
  const req = pool.request();
  req.input('PageNumber', sql.Int, pageNumber);
  req.input('PageSize', sql.Int, pageSize);
  req.input('SearchTerm', sql.NVarChar(255), searchTerm || null);
  req.output('TotalCount', sql.Int);

  const result = await req.execute('sp_GetContactsPaged');
  const items = toContactList(result.recordset ?? []);
  const totalCount = result.output?.TotalCount ?? 0;
  return toPagedResult(items, totalCount, pageNumber, pageSize);
}

export async function getContactById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .execute('sp_GetContactById');
  return toContact(result.recordset?.[0] ?? null);
}

export async function insertContact({ name, phoneNumber, email, address }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Name', sql.NVarChar(255), name)
    .input('PhoneNumber', sql.NVarChar(50), phoneNumber)
    .input('Email', sql.NVarChar(255), email)
    .input('Address', sql.NVarChar(sql.MAX), address)
    .execute('sp_InsertContact');
  const newId = result.recordset?.[0]?.Id ?? result.recordset?.[0]?.NewId;
  return getContactById(newId);
}

export async function updateContact(id, { name, phoneNumber, email, address }) {
  const pool = await getPool();
  await pool
    .request()
    .input('Id', sql.Int, id)
    .input('Name', sql.NVarChar(255), name)
    .input('PhoneNumber', sql.NVarChar(50), phoneNumber)
    .input('Email', sql.NVarChar(255), email)
    .input('Address', sql.NVarChar(sql.MAX), address)
    .execute('sp_UpdateContact');
  return getContactById(id);
}

export async function deleteContact(id) {
  const pool = await getPool();
  await pool.request().input('Id', sql.Int, id).execute('sp_DeleteContact');
}

export async function phoneExists(phoneNumber, excludeId = null) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('PhoneNumber', sql.NVarChar(50), phoneNumber)
    .input('ExcludeId', sql.Int, excludeId)
    .execute('sp_CheckPhoneExists');
  return !!result.recordset?.[0]?.Exists;
}
