// Paged result container: data + pagination metadata.
export function toPagedResult(items, totalCount, currentPage, pageSize) {
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  return {
    items,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
  };
}
