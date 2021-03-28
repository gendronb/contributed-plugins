
import { SwiperManager } from './swiper-manager';
export default class Swiper {

    private swiperManager: any;

    init(mapApi: any) {

        this.mapApi = mapApi;

        // Normalize configuration
        let config = this._RV.getConfig('plugins').swiper;

        config.language = this._RV.getCurrentLang();
        config.translations = Swiper.prototype.translations[this._RV.getCurrentLang()];

        this.swiperManager = new SwiperManager(mapApi, config);

    }

    destroy() {
        this.swiperManager.destroy()
    }

}

interface config {
    type: string,
    keyboardOffset: number,
    left: SwiperSideConfig,
    right: SwiperSideConfig
}

interface SwiperSideConfig {
    layers: string[]
    params: DimensionParams
}
interface DimensionParams {
    dimensionName: string,
    dateTimeFormat: string,
    extent: string,
    multipleValues: boolean,
    default: string
}

interface layer {
    id: string
}

export default interface Swiper {
    mapApi: any,
    _RV: any,
    config: any
    translations: any,
    // swipeWidget: any
}

Swiper.prototype.translations = {
    'en-CA': {
        settingsPanel: {
            title: 'Swiper Dimension Settings',
            applyBtn: {
                label: 'Reset to Default Value'
            }
        }
    },
    'fr-CA': {
        settingsPanel: {
            title: 'Paramètres de dimension',
            applyBtn: {
                label: 'Revenir à la valeur par défaut'
            }
        }
    }
};

(<any>window).swiper = Swiper;