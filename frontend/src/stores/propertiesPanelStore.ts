import {defineStore} from 'pinia'

interface State {
    selectedPropertiesId: string | null;
    selectedPropertiesPanelKey: string | null;
}


export const usePropertiesPanelStore = defineStore({
    id: 'propertiesPanelStore',
    state: (): State => ({
        selectedPropertiesId: null,
        selectedPropertiesPanelKey: null
    }),
    getters: {
        propertiesId: (state: State): string | null => {
            return state.selectedPropertiesId
        },
        propertiesPanelKey: (state: State): string | null => {
            return state.selectedPropertiesPanelKey
        },
        anySelected: (state: State): boolean => {
            return (state.selectedPropertiesId != null && state.selectedPropertiesPanelKey != null);
        },
    },
    actions: {
        selectPanel(id: string, panelKey: string) {
            this.selectedPropertiesId = id;
            this.selectedPropertiesPanelKey = panelKey;
        },
        deselect() {
            this.selectedPropertiesId = null;
            this.selectedPropertiesPanelKey = null;
        }
    }
})