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
const duration = require('dayjs/plugin/duration');

dayjs.extend(utc);
dayjs.extend(duration);

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
            explicitArray: true
        })

        // get array of id(s) and set layer(s)
        let ids: string[] = this._config.layers.map(layer => layer);

        const layers: Layer[] = [];
        let nbLayers: number = 0;

        // when a layer is added to the map, check if it is a WMS layer
        this._mapApi.layersObj.layerAdded.subscribe((layer: any) => {

            // If layer is in config AND is a wms layer, add to slider
            if (ids.indexOf(layer.id) !== -1 && layer.type.toLowerCase() === 'ogcwms') {

                nbLayers += 1;

                // find layer info, then add it and the layer to the array of layers
                const layerInfo = this._config.layers.find(i => i === layer.id);
                layers.push({ layer, layerInfo, layerId: layer.id });

                // if all layers are loaded, initialize slider
                if (nbLayers === this._config.layers.length) {

                    this.initializeSlider(layers);

                    const layersInfo = layers.map((item) => { return `${item.layer.name}` }).join(', ') + ` (dimension: "${this._config.dimensionName}")`
                    document.getElementsByClassName('slider-desc-layers')[0].textContent = layersInfo;

                    const sliderImage: string[] = [];
                    if (this._config.description !== '') { sliderImage.unshift(this._config.description); }

                    document.getElementsByClassName('slider-desc-info')[0].textContent =  `${sliderImage.join(', ')}`;

                }
            }

        });
    }

    discoverDimensions(layers: Layer[]) {

        let allDimensions = Promise.all(layers.map(layer => {

            let { esriLayer } = layer.layer
            let getCapabilitiesUrl = esriLayer._getCapabilitiesURL

            let subLayersIds = esriLayer.layerInfos.map(subLayer => {
                return subLayer.name
            });

            // TODO : implement caching of capabilities based on url (maybe move to own class)

            return window.fetch(`${getCapabilitiesUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`)
                .then(response => response.text())
                .then(str => this._xmlParser.parseStringPromise(str))
                .then(parsed => {
                    return this.discoverDimensionsFromJsonWmsCapabilities(subLayersIds, parsed.wms_capabilities)
                })

        }));

        return allDimensions;

    }

    discoverDimensionFromJsonWmsLayerDefinition (wmsLayer, dimensionName = "time") {
        let layerDimensions = wmsLayer.dimension || [];
        let dimensions = layerDimensions
          .filter((l) => {
            let properties = l["$"] || {};
            return properties.name
              ? properties.name.toLowerCase() === dimensionName
              : false;
          })
          .map((l) => {
            let properties = l["$"] || {};
            let content = l["_"];
            return {
              id: wmsLayer.name[0],
              default: properties.default,
              multipleValues: Boolean(properties.multipleValues) || false,
              extent: content
            };
          });
        return dimensions[0];
      };

    discoverDimensionsFromJsonWmsCapabilities(subLayersIds, wmsCapabilitities, dimensionName = "time") {

        let dimensions = [];

        // Process root layer
        let rootLayer = wmsCapabilitities.capability[0].layer[0];
        let rootLayerDimension = this.discoverDimensionFromJsonWmsLayerDefinition(
          rootLayer,
          dimensionName
        );

        // Then process sublayers, but only sublayers that are part of the config layers :
        // inherit defaults from root layer
        let layers = rootLayer.layer;

        layers.filter(l => {
            return subLayersIds.includes(l.name[0])
        }).forEach((l) => {
          let dimension = this.discoverDimensionFromJsonWmsLayerDefinition(
            l,
            dimensionName
          );
          dimensions.push({ ...rootLayerDimension, ...dimension })
        });

        return dimensions;

    };

    isDiscreteExtent(strExtent: string) {
        // let arrExtent = extent.split(',').map((v) => v.trim());
        let dayJsDate = dayjs.utc(strExtent);
        if (dayJsDate.isValid()) {
            return true;
        } else {
            return false;
        }
    };

    sortNumbersAsc (a, b) { return a - b; }

    addDuration (dateStart, arrDuration) {
        return arrDuration.reduce((date, durationComponent) => {
            return dayjs.utc(date).add(durationComponent[0], durationComponent[1]);
        }, dateStart);
    };

    buildTimeStampsArrayFromInterval (strDateStart, strDateEnd, strIsoInterval) {

        const dateStart = dayjs.utc(strDateStart);
        const dateEnd = dayjs.utc(strDateEnd);

        // Parse ISO string representation (ex. 'P1Y2M')
        const isoInterval = dayjs.duration(strIsoInterval);

        // Format duration to its components
        // (between [] is the string constant for each component)
        // then split to individual components (ex. '1|y')
        // and split again to array [1, 'y'], converting value to number
        // and filtering out NaN for non-existing duration components
        const arrInterval = isoInterval
            .format("Y[|y]-M[|M]-D[|d]-H[|h]-m[|m]-s[|s]")
            .split("-")
            .map((i) => {
            let splitted = i.split("|");
            return [Number(splitted[0]), splitted[1]];
            })
            .filter((i) => !isNaN(i[0]));

        let arrTimestamps = [];
        let dateCurrent = dateStart;
        while (dateCurrent < dateEnd) {
            arrTimestamps.push(dateCurrent.valueOf());
            dateCurrent = this.addDuration(dateCurrent, arrInterval);
        }
        arrTimestamps.push(dateEnd.valueOf());

        return arrTimestamps;

    };

    getTimestampsArrayFromExtent(arrExtent) {

        let arrTimestamps;

        // const arrExtent = strExtent.split(",").map((v) => v.trim());

        if (this.isDiscreteExtent(arrExtent[0])) {
            // if arrExtent[0] is a ISO string-formatted date such as '2010-01-01'
            arrTimestamps = arrExtent.map((d) => dayjs.utc(d.trim()).valueOf());
          } else {
            // otherwise, we have a date interval such as '2010-01-01/2020-01-01/P1Y'
            // or a list of date intervals such as '2010-01-01/2020-01-01/P1Y, 2012-01-01/2015-01-01/P1M'
            arrTimestamps = arrExtent.map(extent => {
                let [startDate, endDate, interval] = extent.split("/");
                return this.buildTimeStampsArrayFromInterval(startDate, endDate, interval);
            })
            // let [startDate, endDate, interval] = arrExtent[0].split("/");
            // arrTimestamps = this.buildTimeStampsArrayFromInterval(startDate, endDate, interval);
          }

        //   console.info(arrTimestamps)

        // Flatten and return
        return [].concat(...arrTimestamps);

    }

    getRangeAndLimitFromExtent(arrExtent) {

        let arrSortedTimeStamps = this.getTimestampsArrayFromExtent(arrExtent).sort(
            this.sortNumbersAsc
        );

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

        let config = { ...this._config };

        this.discoverDimensions(layers).then(result => {

            // Flatten result of dimensions discovery
            let discoveredDimensions = [].concat(...result);

            // console.info('Dimensions discovered => ', discoveredDimensions);

            let arrDefault = discoveredDimensions.map(d => d.default);
            let arrMultipleValues = discoveredDimensions.map(d => d.multipleValues);

            let allDefaultValuesAreEqual = arrDefault.every( v => v === arrDefault[0] )

            // Override default value if not set :
            // if all default values are the same, use that value, otherwise, set to null (as we're unable to choose a value)
            let defaultValue = config.default || allDefaultValuesAreEqual ? arrDefault[0] : null;
            let defaultValueAsTimestamp = dayjs.utc(defaultValue).valueOf();
            config.default = defaultValueAsTimestamp;

            // Override multipleValues flag :
            // if true, check is all layers support multiple values, then keep as is if true
            // otherwise, revert to false
            let multipleValuesFlag = config.multipleValues ? arrMultipleValues.every( v => v === true ) : false
            config.multipleValues = multipleValuesFlag;

            // Determine if slider is single or dual
            config.rangeType = multipleValuesFlag ? 'dual' : 'single';

            // // Check if all extents are the same type (discrete dates or dates + interval)
            // let arrTest = discoveredDimensions.map(d => {
            //     // console.info(d.extent)
            //     return this.isDiscreteExtent(d.extent.split(',')[0])
            // });

            // let allExtentsSameType = arrTest.every( v => v === arrTest[0] )
            // console.info(allExtentsSameType)

            // if (!allExtentsSameType) {
            //     console.error('Dimension Slider : unable to initalize plugin because discovered dimensions are not compatible (')
            // }

            let discoveredExtents = [].concat(...discoveredDimensions.map(d => d.extent.split(',').map((v) => v.trim())));

            // let extent = config.extent || "1932-01-01T00:00:00Z, 1947-01-01T00:00:00Z, 1950-01-01T00:00:00Z, 1959-01-01T00:00:00Z, 1960-01-01T00:00:00Z, 1967-01-01T00:00:00Z, 1972-01-01T00:00:00Z, 1974-01-01T00:00:00Z, 1977-01-01T00:00:00Z, 1978-01-01T00:00:00Z, 1982-01-01T00:00:00Z";
            let extent = (config.extent && config.extent.split(",").map((v) => v.trim())) || discoveredExtents

            // Calculate range and limit from extent
            let { range, limit } = this.getRangeAndLimitFromExtent(extent);

            config.limit = limit;
            config.range = range;

            // initialize slider bar
            this._slider = new SliderBar(this._mapApi, config, this._myBundle);

            this._slider.limit = config.limit;
            this._slider.range = config.range.min !== null ? config.range : config.limit;
            this.setSliderBar();

        })

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
    layerId: any;
}

interface LayerInfo {
    id: string;
    field: string;
}

interface AttributePipe {
    layer: any;
    attributes: object[];
}