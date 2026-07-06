export type PageData = { arrayIndexes?: number[] | undefined };

/** Returns the first array index from pageData, if present. */
export function firstArrayIndex(pageData?: PageData) {
  if (!pageData?.arrayIndexes) return undefined;
  return pageData.arrayIndexes.at(0);
}

export function isValidArrayIndex(
  array: unknown[] | undefined,
  pageData?: PageData,
) {
  const arrayIndex = firstArrayIndex(pageData);
  if (arrayIndex === undefined || arrayIndex < 0) return false;
  return (
    arrayIndex === 0 || (array !== undefined && arrayIndex <= array.length)
  );
}
