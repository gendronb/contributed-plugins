import { Observable, BehaviorSubject } from 'rxjs';
import { Range } from './index';
export declare class SliderBar {
    private _slider;
    private _mapApi;
    private _config;
    private _myBundle;
    private _playInterval;
    private _range;
    private _limit;
    private _limits;
    private _step;
    private _precision;
    private _stepType;
    private _rangeType;
    private _interval;
    private _intervalUnit;
    static _playState: BehaviorSubject<boolean>;
    static getPlayState(): Observable<boolean>;
    private static setPlayState;
    private _gifImages;
    /**
     * Slider bar constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} config the slider configuration
     */
    constructor(mapApi: any, config: any, myBundle: any);
    /**
     * Start slider creation
     * @function
     * @param {String} type the type of slider (date, number or wmst)
     * @param {String} language the viewerlanguage (en-CA or fr-CA)
     */
    startSlider(type: string, language: string): void;
    /**
     * Set ranges
     * @function setNoUiBarRanges
     * @param {Number} width display width
     * @param {Range} limit min and max limit to set
     * @param {String} rangeType range type (dual or single)
     * @param {String} stepType step type (dynamic or static)
     * @param {Number} step step value to use for (single and dynamic)
     * @return {Range} range the updated limits
     */
    setNoUiBarRanges(width: number, limit: Range, rangeType: string, stepType: string, step: number): Range;
    /**
     * Set pips (slider labels) format
     * @function formatPips
     * @param {Any} value the value to display (number, string or date)
     * @param {String} field the type of field
     * @param {String} lang the language to use
     * @return {any} value the formated value
     */
    formatPips(value: any, field: string, lang: string): any;
    setTooltips(type: string, language: string): object[];
    /**
     * Set slider range
     * @property range
     */
    set range(value: Range);
    /**
     * Get slider range
     * @property range
     */
    get range(): Range;
    /**
     * Set slider limit (dynamic)
     * @property limit
     */
    set limit(value: Range);
    /**
     * Get slider limit (dynamic)
     * @property limit
     */
    get limit(): Range;
    /**
     * Set slider limit (static)
     * @property limit
     */
    set limits(value: number[]);
    /**
     * Get slider limit (static)
     * @property limit
     */
    get limits(): number[];
    /**
     * Set slider lock
     * @property lock
     */
    set lock(lock: boolean);
    /**
     * Get slider lock
     * @property lock
     */
    get lock(): boolean;
    /**
     * Get slider range type is dual
     * @property lock
     */
    get dual(): boolean;
    /**
     * Set slider loop
     * @property loop
     */
    set loop(loop: boolean);
    /**
     * Get slider loop
     * @property loop
     */
    get loop(): boolean;
    /**
     * Set slider reverse
     * @property reverse
     */
    set reverse(reverse: boolean);
    /**
     * Get slider loop
     * @property loop
     */
    get reverse(): boolean;
    /**
     * Set slider delay
     * @property delay
     */
    set delay(delay: number);
    /**
     * Get slider delay
     * @property delay
     */
    get delay(): number;
    /**
     * Set slider export
     * @property export
     */
    set export(exp: boolean);
    /**
     * Get slider export
     * @property export
     */
    get export(): boolean;
    /**
     * Set play or pause on the slider
     * @function play
     * @param {Boolean} play true if slider is playing, false otherwise
     */
    play(play: boolean): void;
    /**
     * Loop play until the max limit is reach
     * @function playInstant
     * @param {Number} limitmax the max limit
     */
    playInstant(limitmin: number, limitmax: number): void;
    /**
     * Check if we need to take snapshot to export GIF
     * @function setTakeSnapShot
     */
    setTakeSnapShot(): void;
    /**
     * Take a snapshot of the map for the export gif function
     * @function takeSnapShot
     * @param {Boolean} stop true if it is the last snapshot and it needs to export the gif, false otherwise
     */
    takeSnapShot(stop: boolean): void;
    exportToGIF(): void;
    /**
     * Set play on the slider
     * @function dataURItoBlob
     * @param {String} dataURI true if slider is playing, false otherwise
     * @return {Blob} blob the blob object (gif image) to save to file
     */
    dataURItoBlob(dataURI: string): Blob;
    /**
     * Set pause on the slider when play is call with false
     * @function pause
     */
    pause(): void;
    /**
     * Refresh the slider to default values
     * @function refresh
     */
    refresh(): void;
    /**
     * Step the silder
     * @function step
     * @param {String} direction up or down
     */
    step(direction: string): void;
    /**
     * Set left anchor
     * @function setLeftAnchor
     * @param {Number} values values to set anchors to
     * @param {String} direction up or down
     * @param {Number} step step value
     * @return {Number} Left anchor value
     */
    setLeftAnchorDynamic(values: number[], direction: string, step: number): number;
    /**
     * Set right anchor
     * @function setRightAnchor
     * @param {Number} values values to set anchors to
     * @param {String} direction up or down
     * @param {Number} step step value
     * @return {Number} Left anchor value
     */
    setRightAnchorDynamic(values: number[], direction: string, step: number): number;
    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     */
    setDefinitionQuery(range: Range): void;
    /**
     * Set definition query to filter the data
     * @function getDate
     * @param {Range} range range to use to filter
     * @param {String} type type of date
     * @return {String[]} Array of string date  from date object
     */
    getDate(range: Range, type?: string): string[];
    /**
     * Format the date for ESRI string date
     * @function getEsriDate
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getEsriDate(date: Date): string;
    /**
     * Format the date for WMS-T string date
     * @function getDateWMTS
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getDateWMTS(date: Date): string;
}
