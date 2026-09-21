// Small validation helper — runs before hitting the database.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Permissive international phone: digits, spaces, +, -, (, )
const PHONE_RE = /^[+()\-.\s\d]{5,30}$/;

export function validateContactInput(data, { partial = false } = {}) {
  const errors = [];
  const value = {
    name: data?.name?.toString().trim() ?? '',
    phoneNumber: data?.phoneNumber?.toString().trim() ?? '',
    email: data?.email != null && String(data.email).trim() !== '' ? String(data.email).trim() : null,
    address: data?.address != null && String(data.address).trim() !== '' ? String(data.address).trim() : null,
  };

  if (!partial || data?.name !== undefined) {
    if (!value.name) errors.push('Name is required.');
    else if (value.name.length > 255) errors.push('Name must be at most 255 characters.');
  }
  if (!partial || data?.phoneNumber !== undefined) {
    if (!value.phoneNumber) errors.push('PhoneNumber is required.');
    else if (value.phoneNumber.length > 50) errors.push('PhoneNumber must be at most 50 characters.');
    else if (!PHONE_RE.test(value.phoneNumber)) errors.push('PhoneNumber format is invalid.');
  }
  if (value.email != null) {
    if (value.email.length > 255) errors.push('Email must be at most 255 characters.');
    else if (!EMAIL_RE.test(value.email)) errors.push('Email format is invalid.');
  }

  return { errors, value };
}

export function parsePaging(query) {
  let pageNumber = parseInt(query.pageNumber ?? query.page ?? '1', 10);
  let pageSize = parseInt(query.pageSize ?? query.limit ?? '10', 10);
  if (!Number.isFinite(pageNumber) || pageNumber < 1) pageNumber = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 10;
  if (pageSize > 100) pageSize = 100;
  const searchTerm = (query.searchTerm ?? query.search ?? '').toString().trim();
  return { pageNumber, pageSize, searchTerm };
}
