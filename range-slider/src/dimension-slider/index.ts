import { SLIDER_TEMPLATE } from './template';
import { SliderManager } from './slider-manager';

export default class DimensionSlider {
    private _button: any;

    /**
    * Plugin init
    * @function init
    * @param {Any} mapApi the viewer api
    */
    init(mapApi: any) {
        this.mapApi = mapApi;

        // create panel
        this.panel = this.mapApi.panels.create('rangeSlider'); // Re-using range-slider panel name to keep css styling
        this.panel.element.css(DimensionSlider.prototype.panelOptions);
        this.panel.body = SLIDER_TEMPLATE;

        // get slider configuration then add/merge needed configuration
        const config = this._RV.getConfig('plugins').dimensionSlider;
        let extendConfig = this.parseConfig(config);

        // side menu button
        this._button = this.mapApi.mapI.addPluginButton(
            DimensionSlider.prototype.translations[this._RV.getCurrentLang()].title, this.onMenuItemClick()
        );
        if (extendConfig.open) { this._button.isActive = true; }

        // get ESRI TimeExtent dependency (for image server) and start slider creation
        let myBundlePromise = (<any>window).RAMP.GAPI.esriLoadApiClasses([['esri/TimeExtent', 'timeExtent']]);
        myBundlePromise.then(myBundle => {
            new SliderManager(mapApi, this.panel, extendConfig, myBundle);
        });
    }

    /**
    * Event to fire on side menu item click. Open/Close the panel
    * @function onMenuItemClick
    * @return {function} the function to run
    */
   onMenuItemClick() {
        return () => {
            this._button.isActive = !this._button.isActive;
            this._button.isActive ? this.panel.open() : this.panel.close();
        };
    }

    parseConfig(config) {

        let extendConfig: any = {}

        if (typeof config !== 'undefined') {

            extendConfig = { ...DimensionSlider.prototype.layerOptions, ...config.params };

            // TODO - Refactor... crashed if config does not include these...
            // let configKeys = ['controls', 'open', 'loop', 'autorun', 'reverse']
            extendConfig.controls = config.controls;
            extendConfig.open = config.open;
            extendConfig.loop = config.loop;
            extendConfig.autorun = config.autorun;

            extendConfig.layers = config.layers;

            // Override config
            extendConfig.dimensionName = 'time'; // only dimension supported for now

            // Override range-slider params to fit
            // more specific requirements of dimension-slider
            extendConfig.type = 'wmst';
            extendConfig.stepType = 'static';
            extendConfig.rangeType = 'single'; // default, will be set later when capabitilies are parsed
            extendConfig.precision = 'date';
            extendConfig.units = null;

        } else {
            extendConfig = DimensionSlider.prototype.layerOptions;
        }

        extendConfig.language = this._RV.getCurrentLang();
        extendConfig.translations = DimensionSlider.prototype.translations[this._RV.getCurrentLang()];

        return extendConfig

    }

}

export default interface DimensionSlider {
    mapApi: any,
    _RV: any,
    translations: any,
    panel: any,
    panelOptions: any,
    layerOptions: any
}

export interface Range {
    min: number,
    max: number,
    staticItems?: number[]
}

DimensionSlider.prototype.panelOptions = {
    top: 'calc(100% - 245px)',
    height: '185px',
    'margin-right': '60px',
    'margin-left': '420px'
};

DimensionSlider.prototype.layerOptions = {

    // UI and behavior-related options
    open: true,
    controls: ['lock', 'loop', 'delay', 'refresh'],
    autorun: false,
    loop: false,
    delay: 3000,
    lock: false,
    export: false,

    // layer and data-related options
    dimensionName: 'time', // only dimension currently supported, will be overriden when parsed anyway
    multipleValues: false, // will be overriden when parsed if capabitilies does not support multiple values
    default: null, // starting value, will use default value from capabitilies if defined, otherwise will default to minimum extent value
    dateTimeFormat: null,

    layers: [],

};

DimensionSlider.prototype.translations = {
    'en-CA': {
        title: 'Dimension Slider',
        minimize: 'Minimize the slider interface',
        maximize: 'Maximize the slider interface',
        bar: {
            show: 'Show slider information',
            hide: 'Hide slider information',
            lock: 'Lock left anchor',
            unlock: 'Unlock left anchor',
            loop: 'Animate in loop',
            unloop: 'Do not animate in loop',
            forward: 'Animate forward',
            reverse: 'Animate backward',
            previous: 'Previous',
            play: 'Play',
            pause: 'Pause',
            foward: 'Next',
            delay: 'Delay',
            refresh: 'Refresh',
            gif: 'GIF',
            tooltip: {
                gif: 'If enabled, click \"Play\" to start then \"Pause\" to finish then disable the control to export GIF'
            },
            esriImageNote: 'NOTE: Only the last handle will affect the layer visibility. The first handle is use to set the interval for controls.'
        }
    },

    'fr-CA': {
        title: 'Curseur de dimension',
        minimize: 'Minimiser l\'interface du curseur',
        maximize: 'Maximizer l\'interface du curseur',
        bar: {
            show: 'Afficher l\'information du curseur de dimension',
            hide: 'Cacher l\'information du curseur de dimension',
            lock: 'Verrouiller la molette gauche',
            unlock: 'Déverrouiller la molette gauche',
            loop: 'Animer en boucle',
            unloop: 'Ne pas animer en boucle',
            forward: 'Animer normalement',
            reverse: 'Animer à rebours',
            previous: 'Précédent',
            play: 'Jouer',
            pause: 'Pause',
            foward: 'Prochain',
            delay: 'Délai',
            refresh: 'Rafraîchir',
            gif: 'GIF',
            tooltip: {
                gif: 'Si activé, cliquez sur \"Jouer\" pour démarrer, puis sur \"Pause\" pour terminer et désactiver le contrôle pour exporter le GIF'
            },
            esriImageNote: 'REMARQUE: seule la dernière molette affectera la visibilité de la couche. La première molette est utilisée pour définir l\'intervalle pour les contrôles.'
        }
    }
};

(<any>window).dimensionSlider = DimensionSlider;
