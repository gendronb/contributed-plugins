import { Range } from './index';
import { SliderBar as ParentSliderBar } from '../slider-bar';
export declare class SliderBar extends ParentSliderBar {
    constructor(mapApi: any, config: any, myBundle: any);
    /**
     * Set pips (slider labels) format
     * @function formatPips
     * @param {Any} value the value to display (number, string or date)
     * @param {String} field the type of field
     * @param {String} lang the language to use
     * @return {any} value the formated value
     */
    formatPips(value: any, field: string, lang: string): any;
    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     */
    setDefinitionQuery(range: Range): void;
    /**
     * Format the date for WMS-T string date
     * @function getDateWMTS
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getDateWMTS(date: Date): string;
}
