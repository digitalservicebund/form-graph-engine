import { ARRAY_WILDCARD } from "./arrays.js";
/**
 * Sets a value at a nested path in an object, creating array structures as needed.
 * e.g., arrayPath=["children","toys"], indexes=[0,1], fieldName="name" creates obj.children[0].toys[1].name = value
 */
const setNestedField = (obj, arrayPath, indexes, fieldName, value) => {
    if (value === undefined)
        return;
    let target = obj;
    for (let i = 0; i < arrayPath.length; i++) {
        const arrayName = arrayPath[i];
        const index = indexes[i];
        if (!Array.isArray(target[arrayName]))
            target[arrayName] = [];
        const arr = target[arrayName];
        if (arr[index] === undefined)
            arr[index] = {};
        target = arr[index];
    }
    target[fieldName] = value;
};
/**
 * Removes unreachable fields from user data based on reachability.
 * Keeps only data that is actually relevant to the current flow state.
 */
export const pruneUserData = (compiledFlow, visitedContexts, data) => {
    const result = {};
    for (const { key: nodeKey, pageData, scopeData, arrayPath, } of visitedContexts) {
        const page = compiledFlow.pages[nodeKey];
        if (!page || page.arraySummary)
            continue;
        if (page.path.includes(ARRAY_WILDCARD)) {
            // Array item page: copy only the fields declared in its schema.
            // scopeData is the item at this nesting level; arrayPath + arrayIndexes
            // give the reconstruction path in the output.
            const indexes = pageData.arrayIndexes ?? [];
            for (const fieldName of compiledFlow.getFieldNamesByNodeKey(nodeKey)) {
                setNestedField(result, arrayPath, indexes, fieldName, scopeData[fieldName]);
            }
        }
        else {
            // Regular (top-level) page: copy declared fields directly from userData.
            for (const field of compiledFlow.getFieldNamesByNodeKey(nodeKey)) {
                const val = data[field];
                if (val !== undefined)
                    result[field] = val;
            }
        }
    }
    return result;
};
