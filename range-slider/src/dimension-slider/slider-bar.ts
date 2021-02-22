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

       //     // remove overlapping pips. This can happen often with static limits and date
    //     const items = $('.noUi-value');
    //     const markers = $('.noUi-marker');

    //     let curIndex = 0;
    //     let testIndex = 1;
    //     // loop until are pips are not tested
    //     while (testIndex !== items.length) {
    //         // get div rectangle and check for collision
    //         let d1 = (items[curIndex] as any).getBoundingClientRect();
    //         let d2 = (items[testIndex] as any).getBoundingClientRect();
    //         let ox = Math.abs(d1.x - d2.x) < (d1.x < d2.x ? d2.width : d1.width);
    //         let oy = Math.abs(d1.y - d2.y) < (d1.y < d2.y ? d2.height : d1.height);

    //         // if there is a collision, set display none and test with the next pips
    //         if (ox && oy) {
    //             items[testIndex].style.display = 'none';
    //             markers[testIndex].style.height = "12px";
    //             markers[testIndex].style.backgroundColor = "#ccc";
    //             testIndex++;
    //         } else {
    //             // if there is no  collision and reset the curIndex to be the one before the testIndex
    //             curIndex = (testIndex - curIndex !== 1) ? testIndex : curIndex + 1;
    //             testIndex++;
    //         }
    //     }

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
        let dateTimeFormat = this._config.dateTimeFormat || 'YYYY-MM-DD';

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

            const myLayer = this._mapApi.layers.getLayersById(layer.id)[0];
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