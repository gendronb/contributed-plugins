const Draggabilly = require('draggabilly');

import { SETTINGS_PANEL_TEMPLATE } from './templates';

import { applyDimensionToLayers } from './dimension-utils'
import buildDiscreteSlider from './slider'

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const duration = require('dayjs/plugin/duration')

export default class SwiperSettingsPanel {

  private mapApi: any;
  private config: any;
  private panel: any;

  private value: any;
  private defaultValue;

  private sliderEl: any;

  constructor (mapApi, config) {

    this.mapApi = mapApi;
    this.config = config;

  }

  private onClosePanel(e) {
    const { panel, code } = e;
    panel.destroy();
  }

  // isDefaultValue() {
  //   console.info(this.defaultValue[0], this.value[0])
  //   return this.defaultValue[0] === this.value[0]
  // }

  isDefaultValue() {
    console.info(this.defaultValue[0], this.value[0])
    return this.defaultValue[0] === this.value[0]
  }

  open (sideData, value, onChange, onClose) {

    this.defaultValue = sideData.defaultValue
    this.value = value

    let panel = this.mapApi.panels.create('swiperSettingsPanel');

    panel.header.title = this.config.translations.settingsPanel.title;
    panel.allowOffscreen = true;

    // Make panel draggable...

    panel.element.addClass('draggable');
    const draggable = new Draggabilly(panel.element.get(0), {
      handle: '.rv-header'
    });

    this.panel = panel;

    const close = panel.header.closeButton;
    close.removeClass('primary');
    close.addClass('black md-ink-ripple');

    let that = this;

    this.mapApi.agControllerRegister('SettingsPanelCtrl', ['$scope','$http', function($scope, $http) {

      // $scope.isDefaultValue = () => {
      //   return that.isDefaultValue()
      // }

      $scope.dimension = sideData.dimension
      $scope.layersDescription = sideData.layers.map(l => l.name).join(', ')

      $scope.resetToDefault = function() {
        that.sliderEl.noUiSlider.set(sideData.defaultValue)
        onChange(sideData.defaultValue)
      }

    }])

    let panelTemplate = $(SETTINGS_PANEL_TEMPLATE)
    this.mapApi.$compile(panelTemplate);
    this.panel.body.empty();
    this.panel.body.prepend(panelTemplate);

    // Draw slider
    this.sliderEl = document.getElementsByClassName('swiper-settings-slider-container')[0]

    buildDiscreteSlider({
      domEl: this.sliderEl,
      values: sideData.values,
      initialValues: value,
      isDual: false,
      labelFormat: sideData.dateTimeFormat,
      onChange: onChange
    })

    panel.open();
    panel.closing.subscribe((e) => {
      this.onClosePanel.bind(this)(e);
      onClose();
    });

  }

}
