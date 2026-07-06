/** Returns the first array index from pageData, if present. */
export function firstArrayIndex(pageData) {
    if (!pageData?.arrayIndexes)
        return undefined;
    return pageData.arrayIndexes.at(0);
}
export function isValidArrayIndex(array, pageData) {
    const arrayIndex = firstArrayIndex(pageData);
    if (arrayIndex === undefined || arrayIndex < 0)
        return false;
    return (arrayIndex === 0 || (array !== undefined && arrayIndex <= array.length));
}
