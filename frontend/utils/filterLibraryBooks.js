export const filterLibraryBooks = (books, { category = '', query = '' } = {}) => {
  const search = query.trim().toLowerCase();
  return books.filter(
    book =>
      (!category || book.category === category) &&
      (!search ||
        [book.title, book.author, book.isbn, book.category].some(value =>
          String(value || '')
            .toLowerCase()
            .includes(search)
        ))
  );
};

export const paginateLibraryBooks = (books, page = 1, limit = 10) => {
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(limit, 10) || 10);
  return books.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
};

export const sortLibraryBooks = (books, field = 'title', direction = 'asc') => {
  const multiplier = direction === 'desc' ? -1 : 1;
  return [...books].sort((left, right) => {
    if (field === 'available') {
      return (Number(left[field] || 0) - Number(right[field] || 0)) * multiplier;
    }
    return String(left[field] || '').localeCompare(String(right[field] || ''), undefined, {
      sensitivity: 'base'
    }) * multiplier;
  });
};

export const libraryBookColumnValue = (book, key) => {
  switch (key) {
    case 'title': return book.title || '—';
    case 'author': return book.author || '—';
    case 'isbn': return book.isbn || '—';
    case 'category': return book.category || 'Uncategorised';
    case 'publisher': return book.publisher || '—';
    case 'edition': return book.edition || '—';
    case 'quantity': return book.quantity ?? 0;
    case 'available': return book.available ?? 0;
    case 'purchase_date': return book.purchase_date || '—';
    case 'purchase_price': return book.purchase_price ?? 0;
    case 'sale_price': return book.sale_price ?? 0;
    default: return '—';
  }
};

export const escapeLibraryPrintValue = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
