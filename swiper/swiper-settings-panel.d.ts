export default class SwiperSettingsPanel {
    private mapApi;
    private config;
    private panel;
    private value;
    private defaultValue;
    private sliderEl;
    constructor(mapApi: any, config: any);
    private onClosePanel;
    isDefaultValue(): boolean;
    open(sideData: any, value: any, onChange: any, onClose: any): void;
}
