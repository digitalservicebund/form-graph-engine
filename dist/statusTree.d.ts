export type StatusNode = {
    isDone: boolean;
    isReachable: boolean;
    children?: Record<string, StatusNode>;
};
export type StatusSimulationResult = {
    path: string[];
    reachableSet: Set<string>;
    isComplete: boolean;
};
/**
 * Builds a hierarchical tree of node statuses (done, reachable) from flow simulation.
 * Used to track completion and availability of steps and sub-steps.
 */
export declare const buildStatusTree: (config: Record<string, {
    path: string;
}>, { path, reachableSet, isComplete }: StatusSimulationResult) => Record<string, StatusNode>;
