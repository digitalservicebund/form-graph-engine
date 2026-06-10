import type { TransitionConfig } from "./types.ts";
export declare const evaluateRoute: <FlowKey, UserData>(route: TransitionConfig<FlowKey, UserData> | undefined, data: UserData, traverseArrays?: boolean) => FlowKey | null;
export declare const extractEdges: <FlowKey, UserData>(route?: TransitionConfig<FlowKey, UserData>) => FlowKey[];
export declare const evaluateAllBranches: <FlowKey, UserData>(route: TransitionConfig<FlowKey, UserData> | undefined, data: UserData, options?: {
    excludeArrayTransitions?: boolean;
}) => FlowKey[];
//# sourceMappingURL=routing.d.ts.map