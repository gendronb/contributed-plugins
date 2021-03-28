
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const duration = require('dayjs/plugin/duration')

dayjs.extend(utc)
dayjs.extend(duration)

import SwiperSettingsPanel from './swiper-settings-panel';
import { LEFT_SETTINGS_CTRL_TEMPLATE, RIGHT_SETTINGS_CTRL_TEMPLATE } from './templates';

import { applyDimensionToLayers, mergeLayerDimensionInfosWithConfigParams, getTimestampsArrayFromStringExtentArray, formatDate } from './dimension-utils'
import { SIGUNUSED } from 'constants'

export class SwiperControls {

  private config: any;
  private esriBundle: any;

  private swiperSettingsPanel: any;
  private swiperWidget: any;

  constructor (mapApi, esriBundle, config, sides) {

    this.config = config;
    this.esriBundle = esriBundle;

    this.swiperSettingsPanel = new SwiperSettingsPanel(mapApi, config);

    // Transform each side input to a more workable format for slider

    let transformedSides = Object.keys(sides).reduce((acc, key) => {

      let side = sides[key]
      let layers = side.layers
      let params = side.params

      // Merge dimensionInfo for each side with params from config

      let mergedDimensionInfo = mergeLayerDimensionInfosWithConfigParams(layers.map(l => l.dimensionInfo), params)

      // Build a list of sorted timestamps (for slider) from extent(s) :
      // getTimestampsArrayFromStringExtentArray return a single timestamp if extent is a single date
      // or list of timestamps if extent is a range (ex. YYYY-MM-DD/YYYY-MM-DD/P1Y)

      let sortedValues = getTimestampsArrayFromStringExtentArray(mergedDimensionInfo.extent.split(',').map((v) => v.trim())).sort((a, b) => {
        return a - b;
      })

      // Default value can be single date (YYYY-MM-DD) or range (YYYY-MM-DD/YYYY-MM-DD)
      // so split and convert to array of timestamps

      let defaultValueAsTimestamps = (mergedDimensionInfo.defaultValue || '').split('/').map(v => dayjs.utc(v).valueOf())

      // Check if first default timestamp is in list of sorted timestamps :
      // we only use first default value because we don't currently support dual sliders

      let isDefaultValueInValues = sortedValues.indexOf(defaultValueAsTimestamps[0]) !== -1

      // Return transformed dimension info :
      // 1. list of layers
      // 2. dimension name
      // 3. format for dates
      // 4. list of timestamps
      // 5. default value timestamp as array : config default value if valid, or first timestamp if not

      acc[key] = {
        layers: layers,
        dimension: mergedDimensionInfo.dimension,
        dateTimeFormat: mergedDimensionInfo.dateTimeFormat,
        values: sortedValues,
        defaultValue: isDefaultValueInValues ? defaultValueAsTimestamps[0] : [sortedValues[0]]
      }

      return acc

    }, {})

    // Initialize swiper

    this.setSwiper(mapApi, transformedSides['left'].layers, transformedSides['right'].layers)

    // Apply config default dimension values to left and right layers

    for (const side in transformedSides) {
      if (transformedSides[side].dimension) {
        applyDimensionToLayers(transformedSides[side].layers, transformedSides[side].defaultValue)
      }
    }

    let that = this

    mapApi.agControllerRegister('SwiperControlsCtrl', ['$scope', function($scope) {

      // $scope.leftDateTimeFormat = transformedSides['left'].dateTimeFormat
      // $scope.rightDateTimeFormat = transformedSides['right'].dateTimeFormat

      this.isSettingsPanelOpen = false

      this.currentValue = {
        left: transformedSides['left'].defaultValue,
        right: transformedSides['right'].defaultValue
      }

      // Callback function to call when slider value changes

      this.setValue = side => value => {
        this.currentValue[side] = value
        applyDimensionToLayers(transformedSides[side].layers, value)
      }

      this.onCloseSwiperSettings = () =>  {
        this.isSettingsPanelOpen = false
      }

      this.openSwiperSettings = (side) =>  {
          this.isSettingsPanelOpen = true
          let sideData = transformedSides[side]
          that.swiperSettingsPanel.open(sideData, this.currentValue[side], this.setValue(side), this.onCloseSwiperSettings)
      }

      this.closeSwiperSettings = () =>  {
        this.isSettingsPanelOpen = false
      }

      this.formatLeftDate = (value) => formatDate(value, transformedSides['left'].dateTimeFormat)
      this.formatRightDate = (value) => formatDate(value, transformedSides['right'].dateTimeFormat)

    }]);

    // Insert left and right settings hotspots if side has dimension configured

    const controlsContainer = $(mapApi.mapDiv.find('#rv-swiper-div .handleContainer')[0]);

    if (transformedSides['left'].layers.length > 0 && transformedSides['left'].dimension) {
      let leftSettingsCtrlTemplate = $(LEFT_SETTINGS_CTRL_TEMPLATE);
      mapApi.$compile(leftSettingsCtrlTemplate);
      const left = controlsContainer.prepend(leftSettingsCtrlTemplate)
    }

    if (transformedSides['right'].layers.length > 0 && transformedSides['right'].dimension) {
      let rightSettingsCtrlTemplate = $(RIGHT_SETTINGS_CTRL_TEMPLATE);
      mapApi.$compile(rightSettingsCtrlTemplate);
      const right = controlsContainer.prepend(rightSettingsCtrlTemplate)
    }

  }

  destroy(): void {
    this.swiperWidget.destroy();
  }

  setSwiper(mapApi, leftLayers, rightLayers): void {

    let esriBundle = this.esriBundle
    let config = this.config

    let esriSwiperLayers = rightLayers.map(l => l.esriLayer);

     // Move swiper layers to the top

     esriSwiperLayers.forEach(l => {
        mapApi.esriMap.reorderLayer(l, 100)
     })

    // Add swiper div

    mapApi.mapDiv.find('rv-shell').find('.rv-esri-map').prepend('<div id="rv-swiper-div"></div>');

    // Create swiper

    let swiperWidget = new esriBundle.layerSwipe({
        type: config.type,
        invertPlacement: true,
        map: mapApi.esriMap,
        layers: esriSwiperLayers,
        left: this.getWidth() / 2
    }, 'rv-swiper-div');

    let that = this;

    this.swiperWidget = swiperWidget

    swiperWidget.on('load', function() {

      const item = mapApi.mapDiv.find('#rv-swiper-div .vertical')[0];

      // Set tabindex and WCAG keyboard offset

      item.tabIndex = -3;
      item.addEventListener('keydown', that.closureFunc(function(swipeWidget, item, off, evt) {
          let value = parseInt(item.style.left);
          const width = parseInt(mapApi.mapDiv.find('#rv-swiper-div').width()) - 10;

          if (evt.keyCode === 37 && value >= 0) {
              // left 37
              value = (value > off) ? value -= off : 0;
          } else if (evt.keyCode === 39 && value <= width) {
              // right 39
              value = (value <= width - off) ? value += off : width;
          }
          item.style.left = String(value + 'px');
          swipeWidget.swipe();
      }, swiperWidget, item, config.keyboardOffset));

    });

    swiperWidget.startup();

  }

  closureFunc = function(fn: any, ...params: number[]) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
          var newArgs = args.slice();
          newArgs.push.apply(newArgs, arguments);
          return fn.apply(this, newArgs);
      };
  }

  getWidth(): number {
      return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
      );
  }

}
