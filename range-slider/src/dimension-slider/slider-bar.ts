import * as nouislider from 'nouislider';

import { Observable, BehaviorSubject } from 'rxjs';

import { Range } from './index';

const domtoimage = require('dom-to-image');
const gifshot = require('gifshot');
const FileSaver = require('file-saver');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

import { SliderBar as ParentSliderBar } from '../slider-bar'

dayjs.extend(utc);

export class SliderBar extends ParentSliderBar {

    constructor(mapApi: any, config: any, myBundle: any) {
        super(mapApi, config, myBundle);
    }

    /**
     * Set pips (slider labels) format
     * @function formatPips
     * @param {Any} value the value to display (number, string or date)
     * @param {String} field the type of field
     * @param {String} lang the language to use
     * @return {any} value the formated value
     */
    formatPips(value: any, field: string, lang: string): any {

        let date = dayjs.utc(value);
        let dateTimeFormat = this._config.dateTimeFormat;

        value = date.format(dateTimeFormat);

        // if hours, add it to the label and change margin so label are inside
        if (this._precision === -2) {
            value += ` - ${date.getHours()}:${((date.getMinutes() + 1).toString() as any).padStart(2, '0')}:${((date.getSeconds() + 1).toString() as any).padStart(2, '0')}`;
            $('.slider-bar')[0].style.paddingLeft = '60px';
        }

        return value;
    }

    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     */
    setDefinitionQuery(range: Range): void {

        for (let layer of this._config.layers) {

            const myLayer = this._mapApi.layers.getLayersById(layer)[0];
            const layerType = myLayer.type;

            let dimensionName = (this._config.dimensionName || 'time');
            let customParameters = {}

            const dates = this.getDate(range, 'wmst');
            const query = (this._rangeType === 'single') ? `${dates[0]}` : `${dates[0]}/${dates[1]}`;

            let wmsDimensionName = ['time', 'elevation'].includes(dimensionName) ? dimensionName.toUpperCase() : `dim_${dimensionName}`.toUpperCase();
            customParameters[wmsDimensionName] = query;

            myLayer.esriLayer.setCustomParameters({}, customParameters);

        }
    }

    /**
     * Format the date for WMS-T string date
     * @function getDateWMTS
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getDateWMTS(date: Date): string {
        let wmsDate = dayjs.utc(date).format();
        return wmsDate;
    }
}