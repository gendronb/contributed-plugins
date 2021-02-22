import {
    DESC_BAR_TEMPLATE,
    LOCK_BAR_TEMPLATE,
    LOOP_BAR_TEMPLATE,
    REVERSE_BAR_TEMPLATE,
    PLAY_BAR_TEMPLATE,
    REFRESH_BAR_TEMPLATE,
    DELAY_BAR_TEMPLATE,
    EXPORT_BAR_TEMPLATE
} from './template';

import { SliderManager as ParentSliderManager } from '../slider-manager';
import { SliderControls } from '../slider-controls';
import { SliderBar } from './slider-bar';
import { Range } from './index';

import { take } from 'rxjs/internal/operators/take';

import { Parser } from 'xml2js';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

/**
 * Manage slider panel and bar creation.
 */
export class SliderManager extends ParentSliderManager {

    private _xmlParser: any;

     /**
     * Slider manager constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panel the slider panel
     * @param {Any} config the slider configuration
     * @param {Any} myBundle the esri dependencies bundle
     */
    constructor(mapApi: any, panel: any, config: any, myBundle: any) {

        super(mapApi, panel, config, myBundle)

        this._xmlParser = new Parser({
            normalizeTags: true,
            explicitArray: false
        })

        // get array of id(s) and set layer(s)
        let ids: string[] = this._config.layers.map(layer => layer.id);
        const layers: Layer[] = [];
        let nbLayers: number = 0;

        // when a layer is added to the map, check if it is a needed one
        this._mapApi.layersObj.layerAdded.subscribe((layer: any) => {

            // If layer is in config AND is a wms layer, add to slider
            if (ids.indexOf(layer.id) !== -1 && layer.type.toLowerCase() === 'ogcwms') {

                nbLayers += 1;

                // find layer info, then add it and the layer to the array of layers
                const layerInfo = this._config.layers.find(i => i.id === layer.id);
                layers.push({ layer, layerInfo });

                // if all layers are loaded,
                // asynchronously getcapabilities + extract dimensions for each layer,
                // then initialize slider
                if (nbLayers === this._config.layers.length) {

                    this.discoverDimensions(layers).then(result => {
                        // console.info(result)
                        this.initializeSlider(layers);
                    })

                    const layersInfo = layers.map((item) => { return `${item.layer.name} ("${this._config.dimensionName}" dimension)` }).join(', ');
                    document.getElementsByClassName('slider-desc-layers')[0].textContent = layersInfo;

                    // // add the description from config file and check if it is a esri image layer and add the note
                    // const imageIndex = layers.findIndex(item => { return item.layer._layerType === 'esriImage'; });
                    const sliderImage: string[] = [];
                    // if (imageIndex >= 0) { sliderImage.push(this._config.translations.bar.esriImageNote)}
                    if (this._config.description !== '') { sliderImage.unshift(this._config.description); }

                    document.getElementsByClassName('slider-desc-info')[0].textContent =  `${sliderImage.join(', ')}`;

                }
            } else if (ids.length === 0) {

                // // if there is no configured layer, check if the new added layer has a time info
                // // if so, create the time slider from it
                // new Promise(resolve => {
                //     $.ajax({
                //         url: (layer.type === 'esriFeature') ? `${layer.esriLayer.url}?f=json`: `${layer.esriLayer.url}/${layer._layerIndex}?f=json`,
                //         cache: false,
                //         dataType: 'jsonp',
                //         success: data => resolve(data)
                //     });
                // }).then(data => {
                //     if (typeof (<any>data).timeInfo !== 'undefined') {
                //         const layerInfo = { id: layer.id, field: (<any>data).timeInfo.startTimeField }
                //         layers.push({ layer, layerInfo });
                //         this._config.layers = [layerInfo];
                //         this.initializeSlider(layers);
                //         document.getElementsByClassName('slider-desc-layers')[0].textContent = `${layer.name} (${layerInfo.field})`;

                //         // add one item to ids so a new layer will not initialize a new slider
                //         ids = ['done'];
                //     }
                // })

            }
        });
    }

    discoverDimensions(layers: Layer[]) {

        let allCapabilities = Promise.all(layers.map(layer => {

            let url = layer.layer.esriLayer.url

            // TODO : implement caching of capabilities based on url (maybe move to own class)

            return window.fetch(`${url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`)
                .then(response => response.text())
                .then(str => this._xmlParser.parseStringPromise(str))
                .then(parsed => {
                    return this.discoverDimensionsFromJsonWmsCapabilities(parsed.wms_capabilities)
                })

        }));

        return allCapabilities

    }

    discoverDimensionsFromJsonWmsCapabilities(capabilities) {
        return capabilities;
    }

    isDiscreteExtent(extent) {
        let arrExtent = extent.split(',').map((v) => v.trim());
        let dayJsDate = dayjs.utc(arrExtent[0]);
        if (dayJsDate.isValid()) {
            return true;
        } else {
            return false;
        }
    };

    sortNumbersAsc (a, b) { return a - b; }

    getRangeAndLimitFromExtent(extent) {

        let arrSortedTimeStamps;

        if (this.isDiscreteExtent(extent)) {
            arrSortedTimeStamps = extent.split(',').map((d) => dayjs.utc(d.trim()).valueOf()).sort(this.sortNumbersAsc);
        } else {
            // TODO : build array of timestamps from range extent(s)
            arrSortedTimeStamps = [-631134000000, 378709200000];
        }

        // Dedupe array values
        let arrDedupedSortedTimeStamps = [ ...new Set(arrSortedTimeStamps) ];

        let min = arrDedupedSortedTimeStamps[0];
        let max = arrDedupedSortedTimeStamps[arrDedupedSortedTimeStamps.length - 1];

        let range = {
            min: min,
            max: max
        };

        let limit: any = {
            min: min,
            max: max
        }

        limit.staticItems = arrDedupedSortedTimeStamps.slice(1, arrDedupedSortedTimeStamps.length - 1);;

        return {
            limit,
            range
        };

    }

    /**
     * Initialize slider creation when all layers are loaded
     * @function initializeSlider
     * @param {Layer[]} layers the array of layer and layerInfo
     */
    initializeSlider(layers: Layer[]): void {

        console.info('initializeSlider')

        let config = { ...this._config };

        // TODO : calculate extent from layer capabilities or config
        // ...hardcoded for now

        let extent = config.extent || "1932-01-01T00:00:00Z, 1947-01-01T00:00:00Z, 1950-01-01T00:00:00Z, 1959-01-01T00:00:00Z, 1960-01-01T00:00:00Z, 1967-01-01T00:00:00Z, 1972-01-01T00:00:00Z, 1974-01-01T00:00:00Z, 1977-01-01T00:00:00Z, 1978-01-01T00:00:00Z, 1982-01-01T00:00:00Z";

        // Calculate range and limit from extent
        let { range, limit } = this.getRangeAndLimitFromExtent(extent);

        config.limit = limit;
        config.range = range;

        // TODO : determine if slider is single or dual
        // from layer capabilities or config

        // initialize slider bar
        this._slider = new SliderBar(this._mapApi, config, this._myBundle);

        this._slider.limit = config.limit;
        this._slider.range = config.range.min !== null ? config.range : config.limit;
        this.setSliderBar();

    }

    /**
     * Set slider bar controls
     * @function setBarControls
     * @param {String[]} the array of controls to initialize
     */
    setBarControls(controls: string[]): void {
        // set templates to initialize
        const templates = [
            PLAY_BAR_TEMPLATE
        ];

        // add controls from configuration
        for (let ctrl of controls) {
            if (ctrl === 'lock') { templates.unshift(LOCK_BAR_TEMPLATE); }
            else if (ctrl === 'loop') { templates.push(LOOP_BAR_TEMPLATE); }
            else if (ctrl === 'reverse') { templates.push(REVERSE_BAR_TEMPLATE); }
            else if (ctrl === 'refresh') { templates.push(REFRESH_BAR_TEMPLATE); }
            else if (ctrl === 'delay') { templates.push(DELAY_BAR_TEMPLATE); }
            else if (ctrl === 'export') { templates.push(EXPORT_BAR_TEMPLATE); }
        }

        // add the description control to show/hide info
        templates.unshift(DESC_BAR_TEMPLATE);

        // create slider bar controls
        this._panel.controls = new SliderControls(this._mapApi, this._panel, templates, this._slider);
    }
}

interface Layer {
    layer: any;
    layerInfo: LayerInfo;
}

interface LayerInfo {
    id: string;
    field: string;
}

interface AttributePipe {
    layer: any;
    attributes: object[];
}