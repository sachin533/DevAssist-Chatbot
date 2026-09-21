// Thin JSON-API client for GET /api/contacts, GET /:id, POST, PUT, DELETE.
async function handle(res) {
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || 'Request failed');
    err.status = res.status;
    err.errors = body.errors;
    throw err;
  }
  return body;
}

export async function fetchContacts(pageNumber = 1, pageSize = 10, searchTerm = '') {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    searchTerm,
  });
  const res = await fetch(`/api/contacts?${params}`);
  return handle(res);
}

export async function createContact(payload) {
  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function updateContact(id, payload) {
  const res = await fetch(`/api/contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function deleteContact(id) {
  const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
  return handle(res);
}

export async function checkPhone(phoneNumber, excludeId = null) {
  const params = new URLSearchParams({ phoneNumber });
  if (excludeId) params.set('excludeId', String(excludeId));
  const res = await fetch(`/api/contacts/check-phone?${params}`);
  return handle(res);
}
