(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fr0st/ui'), require('@fr0st/query')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fr0st/ui', '@fr0st/query'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UI = global.UI || {}, global.UI, global.fQuery));
})(this, (function (exports, ui, $) { 'use strict';

    /**
     * Slider Class
     * @class
     */
    class Slider extends ui.BaseComponent {
        /**
         * New Slider constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [options] The options to create the Slider with.
         */
        constructor(node, options) {
            super(node, options);

            this._render();
            this._events();

            let value = $.getValue(this._node);

            if (!value) {
                value = this._options.defaultValue;
            }

            let start = null;
            let end = this._options.min;

            if (this._options.range) {
                const values = $._isArray(value) ?
                    value :
                    `${value}`.split(this._options.rangeSeparator);

                start = end;
                if (values.length === 2) {
                    start = values[0];
                    end = values[1];
                } else if (values[0] !== '') {
                    end = values[0];
                } else {
                    end = this._options.min;
                }
            } else if (value) {
                end = value;
            }

            this._setValue(end, start);
            this._refreshDisabled();
        }

        /**
         * Disable the Slider.
         */
        disable() {
            $.setAttribute(this._node, { disabled: true });
            this._refreshDisabled();
        }

        /**
         * Dispose the Slider.
         */
        dispose() {
            if (this._tooltip) {
                this._tooltip.dispose();
                this._tooltip = null;
            }

            $.remove(this._container);
            $.removeEvent(this._node, 'focus.ui.slider');
            $.removeClass(this._node, this.constructor.classes.hide);
            $.removeAttribute(this._node, 'tabindex');

            this._container = null;
            this._slider = null;
            this._barLow = null;
            this._barSelection = null;
            this._barHigh = null;
            this._handleEnd = null;
            this._handleStart = null;
            this._handleActive = null;
            this._tickContainer = null;
            this._ticks = null;

            super.dispose();
        }

        /**
         * Enable the Slider.
         */
        enable() {
            $.removeAttribute(this._node, 'disabled');
            this._refreshDisabled();
        }

        /**
         * Get the current value(s).
         * @return {number|array} The current value(s).
         */
        getValue() {
            if (!this._options.range) {
                return this._endValue;
            }

            return [this._startValue, this._endValue];
        }

        /**
         * Set the current value(s).
         * @param {number|array} value The value to set.
         */
        setValue(value) {
            if (this._options.range && $._isArray(value)) {
                this._setValue(...value.reverse());
            } else {
                this._setValue(value);
            }
        }
    }

    /**
     * Attach events for the Slider.
     */
    function _events() {
        $.addEvent(this._container, 'contextmenu.ui.colorpicker', (e) => {
            // prevent slider node from showing right click menu
            e.preventDefault();
        });

        $.addEvent(this._node, 'focus.ui.slider', (_) => {
            $.focus(this._handleEnd);
        });

        $.addEventDelegate(this._container, 'click', '[data-ui-value]', (e) => {
            if (
                e.button ||
                $.is(this._node, ':disabled')
            ) {
                return;
            }

            e.preventDefault();

            const value = $.getDataset(e.currentTarget, 'uiValue');
            this._setValue(value);
        });

        let hasMouseover = false;

        const downEvent = (e) => {
            if (
                e.button ||
                $.is(this._node, ':disabled')
            ) {
                return false;
            }

            if (this._options.range) {
                const pos = ui.getPosition(e);
                this._handleActive = $.nearestTo([this._handleStart, this._handleEnd], pos.x, pos.y, { offset: true });
            } else {
                this._handleActive = this._handleEnd;
            }

            $.setDataset(this._slider, { uiDragging: true });

            if (this._options.tooltip === 'show' && !hasMouseover) {
                this._tooltip._stop();
                this._tooltip.show();
            }

            $.triggerEvent(this._node, 'slide.ui.slider');
        };

        const moveEvent = (e) => {
            const originalStartValue = this._startValue;
            const originalEndValue = this._endValue;

            const pos = ui.getPosition(e);
            this._updatePercent(pos.x, pos.y, { updateValue: false });

            if (originalStartValue === this._startValue && originalEndValue === this._endValue) {
                return;
            }

            $.triggerEvent(this._node, 'sliding.ui.slider', {
                detail: {
                    start: this._startValue,
                    end: this._endValue,
                },
            });
        };

        const upEvent = (e) => {
            $.removeDataset(this._slider, 'uiDragging');

            if (this._options.tooltip === 'show' && !hasMouseover) {
                this._tooltip._stop();
                this._tooltip.hide();
            }

            $.focus(this._handleActive);
            $.triggerEvent(this._node, 'slid.ui.slider', {
                detail: {
                    start: this._startValue,
                    end: this._endValue,
                },
            });

            if ($.is(e.currentTarget, '[data-ui-value]')) {
                const value = $.getDataset(e.currentTarget, 'uiValue');
                this._setValue(value);
            } else {
                const pos = ui.getPosition(e);
                this._updatePercent(pos.x, pos.y);
            }
        };

        const dragEvent = $.mouseDragFactory(downEvent, moveEvent, upEvent);

        const handles = this._options.range ?
            [this._handleStart, this._handleEnd] :
            this._handleEnd;

        $.addEvent(handles, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEvent(this._slider, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEventDelegate(this._container, 'mousedown.ui.slider touchstart.ui.slider', '[data-ui-value]', dragEvent);

        $.addEvent(handles, 'keydown.ui.slider', (e) => {
            if ($.is(this._node, ':disabled')) {
                return;
            }

            const isStart = this._options.range && $.isSame(this._handleStart, e.currentTarget);

            let value = isStart ?
                this._startValue :
                this._endValue;

            const originalValue = value;

            switch (e.code) {
                case 'ArrowLeft':
                    if (e.ctrlKey) {
                        for (const tick of this._options.ticks) {
                            if (tick >= originalValue) {
                                break;
                            }

                            value = tick;
                        }

                        if (value === originalValue) {
                            value = this._options.min;
                        }
                    } else {
                        value -= this._options.step;
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        for (const tick of this._options.ticks.slice().reverse()) {
                            if (tick <= originalValue) {
                                break;
                            }

                            value = tick;
                        }

                        if (value === originalValue) {
                            value = this._options.max;
                        }
                    } else {
                        value += this._options.step;
                    }
                    break;
                case 'Home':
                    value = this._options.min;
                    break;
                case 'End':
                    value = this._options.max;
                    break;
                default:
                    return;
            }

            e.preventDefault();

            let start = null;
            let end = value;
            if (isStart) {
                start = value;
                end = this._endValue;
            }

            this._setValue(end, start);
        });

        if (this._options.tooltip === 'show') {
            $.addEvent(this._container, 'mouseenter.ui.slider', (e) => {
                if (!$.isSame(e.target, this._container)) {
                    return;
                }

                if (!$.getDataset(this._slider, 'uiDragging')) {
                    this._tooltip._stop();
                    this._tooltip.show();
                }

                hasMouseover = true;
            });

            $.addEvent(this._container, 'mouseleave.ui.slider', (e) => {
                if (!$.isSame(e.target, this._container)) {
                    return;
                }

                if (!$.getDataset(this._slider, 'uiDragging')) {
                    this._tooltip._stop();
                    this._tooltip.hide();
                }

                hasMouseover = false;
            });
        }
    }

    /**
     * Clamp value to nearest tick (if within bounds).
     * @param {number} value The value to check.
     * @return {number} The new value.
     */
    function _checkTicks(value) {
        let closest;
        let closestDiff = Number.MAX_VALUE;
        for (const tick of this._options.ticks) {
            const tickDiff = Math.abs(tick - value);
            if (tickDiff < closestDiff && (this._options.lockToTicks || tickDiff < this._options.tickSnapBounds)) {
                closestDiff = tickDiff;
                closest = tick;
            }
        }
        if (closest) {
            return closest;
        }

        return value;
    }
    /**
     * Create a tooltip on an element.
     * @param {HTMLElement} element The element to attach the tooltip to.
     * @param {number} [spacing=0] Amount of spacing for the tooltip.
     * @return {UI.Tooltip} The tooltip.
     */
    function _createTooltip(element, spacing = 0) {
        let placement;
        if (this._options.tooltipPlacement) {
            placement = this._options.tooltipPlacement;
        } else if (this._options.orientation === 'vertical') {
            placement = 'right';
        } else {
            placement = 'top';
        }

        const tooltip = ui.Tooltip.init(element, {
            appendTo: 'body',
            trigger: '',
            spacing,
            placement,
        });

        if (this._options.tooltip === 'always') {
            tooltip.show();
        }

        return tooltip;
    }
    /**
     * Convert a value to percent.
     * @param {number} value The value to convert.
     * @return {number} The percent.
     */
    function _getPercent(value) {
        if (this._options.scale !== 'logarithmic') {
            return $._inverseLerp(this._options.min, this._options.max, value) * 100;
        }

        if (this._options.min === this._options.max) {
            return 0;
        }

        const offset = 1 - this._options.min;
        const max = Math.log(this._options.max + offset);
        const min = Math.log(this._options.min + offset);
        const v = Math.log(value + offset);
        return 100 * (v - min) / (max - min);
    }
    /**
     * Convert a percent to value.
     * @param {number} percent The percent to convert.
     * @return {number} The value.
     */
    function _getValue(percent) {
        if (this._options.scale !== 'logarithmic') {
            return $._lerp(this._options.min, this._options.max, percent / 100);
        }

        const offset = 1 - this._options.min;
        const min = Math.log(this._options.min + offset);
        const max = Math.log(this._options.max + offset);

        const value = Math.exp(min + (max - min) * percent / 100) - offset;

        if (Math.round(value) === max) {
            return max;
        }

        return this._options.min + value;
    }
    /**
     * Move a handle by a percent.
     * @param {HTMLElement} handle The handle to move.
     * @param {number} percent The amount to move the handle.
     */
    function _moveHandle(handle, percent) {
        if (this._options.reversed) {
            percent = 100 - percent;
        }

        if (this._options.orientation === 'vertical') {
            $.setStyle(handle, { top: `${100 - percent}%` });
        } else {
            $.setStyle(handle, { left: `${percent}%` });
        }
    }
    /**
     * Refresh the disabled styling.
     */
    function _refreshDisabled() {
        if ($.is(this._node, ':disabled')) {
            $.setStyle(this._container, {
                opacity: this._options.disabledOpacity,
                pointerEvents: 'none',
            });
        } else {
            $.setStyle(this._container, {
                opacity: '',
                pointerEvents: '',
            });
        }
    }
    /**
     * Set the slider value.
     * @param {number} end The end value.
     * @param {number} [start] The start value.
     * @param {object} [options] Options for updating the value.
     * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
     */
    function _setValue(end, start = null, { updateValue = true } = {}) {
        end = $._clamp(end, this._options.min, this._options.max);
        end = $._toStep(end, this._options.step);
        const percentEnd = this._getPercent(end);

        let percent;
        let percentStart;
        let percentLow;
        if (!this._options.range) {
            percent = percentEnd;
            percentLow = 0;
        } else {
            start = $._clamp(start, this._options.min, this._options.max);
            start = $._toStep(start, this._options.step);
            percentStart = this._getPercent(start);
            percent = percentEnd - percentStart;
            percentLow = percentStart;
        }

        if (!updateValue && end === this._endValue && start === this._startValue) {
            return;
        }

        if (this._options.reversed) {
            percentLow = 100 - percentLow;
        }

        const offsetHigh = percent + percentLow;
        const percentHigh = 100 - offsetHigh;

        if (this._options.orientation === 'vertical') {
            $.setStyle(this._barLow, {
                height: `${percentLow}%`,
            });
            $.setStyle(this._barSelection, {
                height: `${percent}%`,
                bottom: `${percentLow}%`,
            });
            $.setStyle(this._barHigh, {
                height: `${percentHigh}%`,
                bottom: `${offsetHigh}%`,
            });
        } else {
            $.setStyle(this._barLow, {
                width: `${percentLow}%`,
            });
            $.setStyle(this._barSelection, {
                width: `${percent}%`,
                left: `${percentLow}%`,
            });
            $.setStyle(this._barHigh, {
                width: `${percentHigh}%`,
                left: `${offsetHigh}%`,
            });
        }

        $.setAttribute(this._barHigh, { 'aria-valuenow': percent });

        const endTitle = this._options.formatter(end);
        const startTitle = this._options.formatter(start);
        let barTitle = endTitle;
        barTitle = `${startTitle} - ${endTitle}`;

        if (end !== this._endValue) {
            $.setDataset(this._handleEnd, { uiTitle: endTitle });
            this._moveHandle(this._handleEnd, percentEnd);
            this._endValue = end;
        }

        if (start !== this._startValue) {
            if (this._options.range) {
                $.setDataset(this._handleStart, { uiTitle: startTitle });
                this._moveHandle(this._handleStart, percentStart);
            }

            this._startValue = start;
        }

        $.setDataset(this._barSelection, { uiTitle: barTitle });

        this._tooltip.refresh();
        this._tooltip.update();

        this._updateTicks();

        if (!updateValue) {
            return;
        }

        const newValue = this._options.range ?
            `${start}${this._options.rangeSeparator}${end}` :
            end;

        if (newValue === $.getValue(this._node)) {
            return;
        }

        $.setValue(this._node, newValue);

        $.triggerEvent(this._node, 'change.ui.slider');
    }
    /**
     * Update the value based on slider position.
     * @param {number} x The x position.
     * @param {number} y The y position.
     * @param {object} [options] Options for updating the value.
     * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
     */
    function _updatePercent(x, y, { updateValue = true } = {}) {
        let percent;
        if (this._options.orientation === 'vertical') {
            percent = 100 - $.percentY(this._slider, y, { offset: true });
        } else {
            percent = $.percentX(this._slider, x, { offset: true });
        }

        if (this._options.reversed) {
            percent = 100 - percent;
        }

        let value = this._getValue(percent);
        value = this._checkTicks(value);

        let start = null;
        let end = value;
        if (this._options.range) {
            const isEndHandle = $.isSame(this._handleActive, this._handleEnd);
            if (value < this._startValue && isEndHandle) {
                this._handleActive = this._handleStart;
                start = value;
                end = this._startValue;
            } else if (value > this._endValue && !isEndHandle) {
                this._handleActive = this._handleEnd;
                start = this._endValue;
            } else if (isEndHandle) {
                start = this._startValue;
            } else {
                start = value;
                end = this._endValue;
            }
        }

        this._setValue(end, start, { updateValue });
    }
    /**
     * Update tick styling.
     */
    function _updateTicks() {
        for (const tick of this._ticks) {
            const value = $.getDataset(tick, 'uiValue');
            const highlight = this._options.rangeHighlights.find((range) => value >= range.start && value <= range.end);

            let style = null;

            $.setAttribute(tick, { class: '' });
            $.addClass(tick, this.constructor.classes.tick);

            if (this._startValue !== null & value < this._startValue) {
                style = this._options.low;
            } else if (value > this._endValue) {
                style = this._options.high;
            } else {
                $.addClass(tick, this.constructor.classes.tickFilled);
                style = this._options.selection;
            }

            if (highlight) {
                style = highlight.style;
            }

            if (style) {
                $.addClass(tick, style);
            }
        }
    }

    /**
     * Render the slider.
     */
    function _render() {
        this._container = $.create('div', {
            class: this.constructor.classes.container,
        });

        this._slider = $.create('div', {
            class: this.constructor.classes.slider,
        });
        $.append(this._container, this._slider);

        if (this._options.orientation === 'vertical') {
            $.setStyle(this._slider, {
                width: `${this._options.sliderSize}px`,
                height: `${this._options.verticalHeight}px`,
            });
        } else {
            $.setStyle(this._slider, {
                width: '100%',
                height: `${this._options.sliderSize}px`,
            });
        }

        if (this._options.range) {
            this._barLow = this._renderBar(this._options.low);
            $.append(this._slider, this._barLow);
        }

        this._barSelection = this._renderBar(this._options.selection);
        $.append(this._slider, this._barSelection);

        this._barHigh = this._renderBar(this._options.high);
        $.append(this._slider, this._barHigh);

        this._renderTicks();
        this._renderRangeHighlights();

        this._handleEnd = this._renderHandle();
        $.append(this._container, this._handleEnd);

        if (this._options.range) {
            this._handleStart = this._renderHandle();
            $.append(this._container, this._handleStart);
        }

        if (this._options.tooltip) {
            if (this._options.range) {
                this._tooltip = this._createTooltip(this._barSelection, (this._options.handleSize - this._options.sliderSize) / 2);
            } else {
                this._tooltip = this._createTooltip(this._handleEnd);
            }
        }

        // hide the input node
        $.addClass(this._node, this.constructor.classes.hide);
        $.setAttribute(this._node, { tabindex: -1 });

        $.before(this._node, this._container);
    }
    /**
     * Render a progress bar.
     * @param {string} [style] The background style.
     * @return {HTMLElement} The progress bar.
     */
    function _renderBar(style) {
        const bar = $.create('div', {
            class: this.constructor.classes.sliderBar,
            style: {
                backgroundColor: 'transparent',
                transition: 'none',
            },
        });

        if (style) {
            $.addClass(bar, style);
        }

        if (this._options.orientation === 'vertical') {
            $.setStyle(bar, {
                width: '100%',
                bottom: 0,
            });
        } else {
            $.setStyle(bar, {
                height: '100%',
            });
        }

        return bar;
    }
    /**
     * Render a handle.
     * @return {HTMLElement} The handle.
     */
    function _renderHandle() {
        const handle = $.create('button', {
            class: this.constructor.classes.handle,
            attributes: {
                type: 'button',
            },
        });

        if (this._options.orientation === 'vertical') {
            $.setStyle(handle, {
                width: `${this._options.handleSize}px`,
                height: `${this._options.handleSize * this._options.handleSizeRatio}px`,
                left: `${this._options.sliderSize / 2}px`,
            });
        } else {
            $.setStyle(handle, {
                width: `${this._options.handleSize * this._options.handleSizeRatio}px`,
                height: `${this._options.handleSize}px`,
                top: `${this._options.sliderSize / 2}px`,
            });
        }

        return handle;
    }
    /**
     * Render highlight ranges.
     */
    function _renderRangeHighlights() {
        for (const range of this._options.rangeHighlights) {
            const highlightBar = this._renderBar(range.style);

            const startPercent = this._getPercent(range.start);
            const endPercent = this._getPercent(range.end);
            const percent = endPercent - startPercent;

            if (this._options.orientation === 'vertical') {
                $.setStyle(highlightBar, {
                    height: `${percent}%`,
                    top: `${startPercent}`,
                });
            } else {
                $.setStyle(highlightBar, {
                    width: `${percent}%`,
                    left: `${startPercent}%`,
                });
            }

            $.append(this._slider, highlightBar);
        }
    }
    /**
     * Render slider ticks.
     */
    function _renderTicks() {
        this._tickContainer = $.create('div');
        this._ticks = [];

        for (const [index, value] of this._options.ticks.entries()) {
            const tickContainer = $.create('div');

            const tick = $.create('div', {
                attributes: {
                    title: value,
                },
                dataset: {
                    uiValue: value,
                },
            });

            let percent = this._getPercent(value);

            if (this._options.reversed) {
                percent = 100 - percent;
            }

            $.setStyle(tick, {
                width: `${this._options.tickSize}px`,
                height: `${this._options.tickSize}px`,
            });

            if (this._options.orientation === 'vertical') {
                $.setStyle(tick, {
                    bottom: `${percent}%`,
                    left: '50%',
                });
            } else {
                $.setStyle(tick, {
                    top: '50%',
                    left: `${percent}%`,
                });
            }

            $.append(tickContainer, tick);

            if (this._options.tickLabels && this._options.tickLabels[index]) {
                const tickLabel = $.create('div', {
                    text: value,
                    class: this.constructor.classes.tickLabel,
                });

                if (this._options.orientation === 'vertical') {
                    $.setStyle(tickLabel, {
                        top: `${percent}%`,
                        left: '100%',
                        transform: 'translateY(-50%)',
                    });
                } else {
                    $.setStyle(tickLabel, {
                        top: '100%',
                        left: `${percent}%`,
                        transform: 'translateX(-50%)',
                    });
                }

                $.append(tickContainer, tickLabel);
            }

            $.append(this._tickContainer, tickContainer);

            this._ticks.push(tick);
        }

        $.append(this._container, this._tickContainer);
    }

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
    ui.initComponent('slider', Slider);

    exports.Slider = Slider;

}));
//# sourceMappingURL=frost-ui-slider.js.map
