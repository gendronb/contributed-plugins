export declare class SwiperControls {
    private config;
    private esriBundle;
    private swiperSettingsPanel;
    private swiperWidget;
    constructor(mapApi: any, esriBundle: any, config: any, sides: any);
    destroy(): void;
    setSwiper(mapApi: any, leftLayers: any, rightLayers: any): void;
    closureFunc: (fn: any, ...params: number[]) => () => any;
    getWidth(): number;
}
