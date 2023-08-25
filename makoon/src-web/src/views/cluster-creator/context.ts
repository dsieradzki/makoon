import React from "react";
import {ClusterCreatorStore} from "@/store/cluster-creator-store";

export type CreatorNavigationContextType = {
    goPrevious: () => void;
    goNext: () => void;
}
export const CreatorNavigationContext = React.createContext<CreatorNavigationContextType>({} as CreatorNavigationContextType)
export const ClusterCreatorStoreContext = React.createContext<ClusterCreatorStore>({} as ClusterCreatorStore)

export interface CreatorNavigation {
    next: () => Promise<void>
    previous: () => Promise<void>
}

export interface StepProps {
    nextDisabled: (valid: boolean) => void
    previousDisabled: (valid: boolean) => void
    onNext: () => Promise<void>
    onPrevious: () => Promise<void>
}
