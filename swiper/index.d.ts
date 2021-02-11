export default class Swiper {
    /**
    * Plugin init
    * @function init
    * @param {Object} mapApi the viewer api
    */
    private layerNb;
    private layerNames;
    init(mapApi: any): void;
    /**
    * Set the swiper
    * @function setSwiper
    * @param {Object} myBundle the ESRI dependecy
    * @param {Config} swiper the swiper configuration
    */
    setSwiper(myBundle: any, swiper: config): void;
    /**
    * Closure function to manage variables scope
    * @function closureFunc
    * @param {Function} fn function to applyt the closure to
    * @param {Object[]} params array of variables to set
    */
    closureFunc: (fn: any, ...params: number[]) => () => any;
    /**
    * Get browser window width to setup the swiper in the middle of it
    * @function getWidth
    * @return {number} browser window width
    */
    getWidth(): number;
}
interface config {
    type: string;
    keyboardOffset: number;
    layers: layer[];
}
interface layer {
    id: string;
}
export default interface Swiper {
    mapApi: any;
    _RV: any;
    config: any;
}
export {};
