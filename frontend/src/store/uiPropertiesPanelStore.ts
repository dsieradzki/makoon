import { makeAutoObservable } from "mobx";

class UiPropertiesPanelStore {
    selectedPropertiesId: string | null = null
    selectedPropertiesPanelKey: string | null = null

    constructor() {
        makeAutoObservable(this)
    }

    get isPanelVisible(): boolean {
        return (this.selectedPropertiesId != null && this.selectedPropertiesPanelKey != null);
    }

    selectPanel(panelKey: string, id: string = "") {
        this.selectedPropertiesPanelKey = panelKey;
        this.selectedPropertiesId = id;
    }

    hidePanel() {
        this.selectedPropertiesId = null;
        this.selectedPropertiesPanelKey = null;
    }
}

const uiPropertiesPanelStore = new UiPropertiesPanelStore()
export default uiPropertiesPanelStore