import { SliderManager as ParentSliderManager } from '../slider-manager';
/**
 * Manage slider panel and bar creation.
 */
export declare class SliderManager extends ParentSliderManager {
    private _xmlParser;
    /**
    * Slider manager constructor
    * @constructor
    * @param {Any} mapApi the viewer api
    * @param {Any} panel the slider panel
    * @param {Any} config the slider configuration
    * @param {Any} myBundle the esri dependencies bundle
    */
    constructor(mapApi: any, panel: any, config: any, myBundle: any);
    discoverDimensions(layers: Layer[]): Promise<any[][]>;
    discoverDimensionFromJsonWmsLayerDefinition(wmsLayer: any, dimensionName?: string): any;
    discoverDimensionsFromJsonWmsCapabilities(subLayersIds: any, wmsCapabilitities: any, dimensionName?: string): any[];
    isDiscreteExtent(strExtent: string): boolean;
    sortNumbersAsc(a: any, b: any): number;
    addDuration(dateStart: any, arrDuration: any): any;
    buildTimeStampsArrayFromInterval(strDateStart: any, strDateEnd: any, strIsoInterval: any): any[];
    getTimestampsArrayFromExtent(arrExtent: any): any[];
    getRangeAndLimitFromExtent(arrExtent: any): {
        limit: any;
        range: {
            min: any;
            max: any;
        };
    };
    /**
     * Initialize slider creation when all layers are loaded
     * @function initializeSlider
     * @param {Layer[]} layers the array of layer and layerInfo
     */
    initializeSlider(layers: Layer[]): void;
    /**
     * Set slider bar controls
     * @function setBarControls
     * @param {String[]} the array of controls to initialize
     */
    setBarControls(controls: string[]): void;
}
interface Layer {
    layer: any;
    layerInfo: LayerInfo;
    layerId: any;
}
interface LayerInfo {
    id: string;
    field: string;
}
export {};
