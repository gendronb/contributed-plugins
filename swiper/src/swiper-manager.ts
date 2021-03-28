
import { getAllDimensionInfoByLayerId, mergeLayerDimensionInfosWithConfigParams } from "./dimension-utils";

import { SwiperControls } from './swiper-controls'

export class SwiperManager {

    private mapApi: any;
    private config: any;

    private swiperControls: any;

    constructor(mapApi: any, config: any) {

        this.mapApi = mapApi;

        this.config = config;

        let leftLayersIds = config.left && config.left.layers || [];
        let rightLayersIds = config.right.layers;

        let params = {
            left: (config.left && config.left.params) || {},
            right: config.right.params || {}
        }

        let allLayersIds = []

        // Push all left/right layers ids in a single list

        leftLayersIds.forEach(i => {
            if (allLayersIds.indexOf(i) === -1) {
                allLayersIds.push(i)
            }
        })

        rightLayersIds.forEach(i => {
            if (allLayersIds.indexOf(i) === -1) {
                allLayersIds.push(i)
            }
        })

        let totalLayersCount = allLayersIds.length

        let layers = []
        let wmsLayers = []

        let loadedLayersCount: number = 0;
        let hasRightSideLayersLoaded = false
        let ready = false

        this.mapApi.layersObj.layerAdded.subscribe((layer: any) => {

            let isLayerWms = layer.type.toLowerCase() === 'ogcwms'

            if (allLayersIds.indexOf(layer.id) !== -1) {
                loadedLayersCount += 1;
            }

            if (rightLayersIds.indexOf(layer.id) !== -1) {
                hasRightSideLayersLoaded = true
                if (params['right'].dimension && isLayerWms) {
                    wmsLayers.push(layer)
                }
            }

            if (leftLayersIds.indexOf(layer.id) !== -1) {
                if (params['left'].dimension && isLayerWms) {
                    wmsLayers.push(layer)
                }
            }

            layers.push(layer)

            // When all plugin layers are loaded...

            if (loadedLayersCount === totalLayersCount && !ready) {

                ready = true

                // And at at least one swiper (right-side) layer was loaded successfully,
                // otherwise, log warning to the console

                if (hasRightSideLayersLoaded) {

                    let myBundlePromise = (<any>window).RAMP.GAPI.esriLoadApiClasses([['esri/layers/FeatureLayer', 'FeatureLayer'], ['esri/dijit/LayerSwipe', 'layerSwipe']]);
                    myBundlePromise.then(esriBundle => {

                        let that = this

                        // Call getCapabilites for each wms layer loaded

                        getAllDimensionInfoByLayerId(wmsLayers).then(allDimensionInfosByLayerId => {

                            // Combine dimensionInfo with each layer

                            let layersWithDimensionInfo = layers.map(layer => {

                                let allDimensionInfoForLayer = allDimensionInfosByLayerId[layer.id]

                                if (allDimensionInfoForLayer) {

                                    // Each configured wms layer may be composed of multiple "sub" layers :
                                    // since the getAllDimensionInfoByLayerId function returns dimension information for each "sub" layer in the ogc service
                                    // we need to filter the list of dimension infos based on the "sub" layers declared of each configured wms layer

                                    let wmsLayer = layer.esriLayer
                                    let internalLayers = wmsLayer.layerInfos
                                    let internalLayersIds = internalLayers.map(i => i.name)

                                    let filteredDimensionInfo = allDimensionInfoForLayer.filter(d => {
                                        return internalLayersIds.includes(d.id)
                                    })

                                    layer.dimensionInfo = filteredDimensionInfo
                                    return layer

                                } else {

                                    layer.dimensionInfo = null
                                    return layer
                                }

                            })

                            // The SwiperControls constructor accepts as fourth parameter
                            // a "sides" object with left and right properties:
                            // each "side" is an object with 2 properties: params and layers

                            let leftLayers = layersWithDimensionInfo.filter(l => leftLayersIds.indexOf(l.id) !== -1)
                            let rightLayers = layersWithDimensionInfo.filter(l => rightLayersIds.indexOf(l.id) !== -1)

                            let sides =  {
                                left: { layers: leftLayers, params: params.left },
                                right: { layers: rightLayers, params: params.right }
                            }

                            that.swiperControls = new SwiperControls(mapApi, esriBundle, config, sides)

                        });

                    });

                } else {
                    console.error('Swiper Plugin: no corresponding layer(s) for current swiper layers (right side) configuration.')
                }

            }

        });

    }

    destroy(): void {
        this.swiperControls.destroy();
    }

}
