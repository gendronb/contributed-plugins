export const SETTINGS_PANEL_TEMPLATE = ` 
    <div id="rv-swiper-settings-panel" ng-controller="SettingsPanelCtrl" class="body">

        <div class="content">
            <h4 class="md-title">{{ layersDescription }}</h4>
            <h5 class="md-title">Dimension: {{dimension}}</h5>
            <div class="swiper-settings-slider-container"/>
        </div>

        <md-button class="md-primary apply-btn" ng-click="resetToDefault()">
            <md-icon style="position: relative; top: -2px;">
                <svg xmlns="http://www.w3.org/2000/svg" fit height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
                    <g><g><g><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/></g></g></g>
                </svg>
            </md-icon>
            {{ 'plugins.swiper.settingsPanel.applyBtn.label' | translate }}
        </md-button>

    </div>
`;

// settings control
export const LEFT_SETTINGS_CTRL_TEMPLATE = `
<div class="swiper-controls-container swiper-controls-container-left" ng-controller="SwiperControlsCtrl as ctrl">
    <div class="swiper-controls-label swiper-controls-label-left"><span>{{ ctrl.formatLeftDate(ctrl.currentValue.left) }}</span></div>
    <div class="swiper-controls" ng-class="{ 'disabled': ctrl.isSettingsPanelOpen === true }">
        <md-button
            aria-label="{{ 'plugins.swiper.settingsPanel' | translate }}"
            class="md-icon-button rv-button-24 slider-max-control-icon"
            ng-click="ctrl.openSwiperSettings('left')">
            <md-icon>${createSVG('settings')}</md-icon>
        </md-button>
    </div>
</div>`;

export const RIGHT_SETTINGS_CTRL_TEMPLATE = `
<div class="swiper-controls-container swiper-controls-container-right" ng-controller="SwiperControlsCtrl as ctrl">
    <div class="swiper-controls-label swiper-controls-label-right"><span>{{ ctrl.formatRightDate(ctrl.currentValue.right) }}</span></div>
    <div class="swiper-controls" ng-class="{ 'disabled': ctrl.isSettingsPanelOpen === true }">
        <md-button
            aria-label="{{ 'plugins.swiper.settingsPanel' | translate }}"
            class="md-icon-button rv-button-24 slider-max-control-icon"
            ng-click="ctrl.openSwiperSettings('right')">
            <md-icon>${createSVG('settings')}</md-icon>
        </md-button>
    </div>
</div>`;

function createSVG(icon): string {
    const svg = {
        'settings': '<path d="M0,0h24v24H0V0z" fill="none"/><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>',
    };

    return `<svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
          <g id="slider${icon}">${svg[icon]}</g></svg>`;
}