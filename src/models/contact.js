// Domain model / DTO — plain object representing a Contact row.
export function toContact(row) {
  if (!row) return null;
  return {
    id: row.Id,
    name: row.Name,
    phoneNumber: row.PhoneNumber,
    email: row.Email ?? null,
    address: row.Address ?? null,
    createdAt: row.CreatedAt ?? null,
  };
}

export function toContactList(rows = []) {
  return rows.map(toContact);
}
