export const hasClassLookup = entity =>
  entity?.fields?.some(field => field.lookup === 'classes') ?? false;
