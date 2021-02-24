export default class DimensionSlider {
    protected _button: any;
    /**
    * Plugin init
    * @function init
    * @param {Any} mapApi the viewer api
    */
    init(mapApi: any): void;
    /**
    * Event to fire on side menu item click. Open/Close the panel
    * @function onMenuItemClick
    * @return {function} the function to run
    */
    onMenuItemClick(): () => void;
    parsePluginConfig(config?: any): any;
}
export default interface DimensionSlider {
    mapApi: any;
    _RV: any;
    translations: any;
    panel: any;
    panelOptions: any;
    layerOptions: any;
}
export interface Range {
    min: number;
    max: number;
    staticItems?: number[];
}
