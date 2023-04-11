import { makeAutoObservable } from "mobx";

class UiPropertiesPanelStore {
    selectedPropertiesId: string | null = null
    selectedPropertiesPanelKey: string | null = null
    blocked: boolean = false

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
        this.unblockHiding()
    }

    isBlocked() {
        return this.blocked
    }

    blockHiding() {
        this.blocked = true
    }

    unblockHiding() {
        this.blocked = false
    }
}

const uiPropertiesPanelStore = new UiPropertiesPanelStore()
export default uiPropertiesPanelStore