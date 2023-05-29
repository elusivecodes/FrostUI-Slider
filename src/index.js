import { initComponent } from '@fr0st/ui';
import Slider from './slider.js';
import { _events } from './prototype/events.js';
import { _checkTicks, _createTooltip, _getPercent, _getValue, _moveHandle, _refreshDisabled, _setValue, _updatePercent, _updateTicks } from './prototype/helpers.js';
import { _render, _renderBar, _renderHandle, _renderRangeHighlights, _renderTicks } from './prototype/render.js';

// Slider default options
Slider.defaults = {
    min: 0,
    max: 10,
    defaultValue: 0,
    orientation: 'horizontal',
    scale: 'linear',
    formatter: (value) => value,
    tickSize: 30,
    handleSize: 20,
    handleSizeRatio: .75,
    sliderSize: 10,
    verticalHeight: 200,
    step: .01,
    tooltip: 'show',
    tooltipPlacement: null,
    low: null,
    selection: 'bg-primary',
    high: null,
    ticks: [],
    tickLabels: [],
    tickSnapBounds: 0,
    lockToTicks: false,
    rangeHighlights: [],
    range: false,
    rangeSeparator: ',',
    reversed: false,
    disabledOpacity: .5,
};

// Slider classes
Slider.classes = {
    container: 'position-relative my-2',
    handle: 'bg-body-tertiary border rounded focus-ring position-absolute translate-middle',
    hide: 'visually-hidden',
    slider: 'progress position-relative',
    sliderBar: 'progress-bar position-absolute',
    tick: 'progress rounded-circle position-absolute translate-middle',
    tickFilled: 'progress-bar',
    tickLabel: 'position-absolute',
};

// Slider prototype
const proto = Slider.prototype;

proto._checkTicks = _checkTicks;
proto._createTooltip = _createTooltip;
proto._events = _events;
proto._getPercent = _getPercent;
proto._getValue = _getValue;
proto._moveHandle = _moveHandle;
proto._refreshDisabled = _refreshDisabled;
proto._render = _render;
proto._renderBar = _renderBar;
proto._renderHandle = _renderHandle;
proto._renderRangeHighlights = _renderRangeHighlights;
proto._renderTicks = _renderTicks;
proto._setValue = _setValue;
proto._updatePercent = _updatePercent;
proto._updateTicks = _updateTicks;

// Slider init
initComponent('slider', Slider);

export default Slider;
