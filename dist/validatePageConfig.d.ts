import type { PageConfigMap } from "./types.ts";
/**
 * Validates that all page paths start with "/" as required.
 */
export declare const validatePagePaths: <C extends PageConfigMap>(pages: C) => void;
