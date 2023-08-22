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

            const id = $.getAttribute(this._node, 'id');
            this._label = $.findOne(`label[for="${id}"]`);

            if (this._label && !$.getAttribute(this._label, 'id')) {
                $.setAttribute(this._label, { id: ui.generateId('starrating-label') });
                this._labelId = true;
            }

            this._render();

            let value = $.getValue(this._node);

            if (this._options.range) {
                this._eventsRange();

                const values = $._isArray(value) ?
                    value :
                    `${value}`.split(this._options.rangeSeparator, 2);

                let start; let end;
                if (values.length === 2) {
                    start = values[0];
                    end = values[1];
                } else {
                    start = this._options.defaultValue;
                    end = this._options.defaultValue;
                }

                this._setValueRange(start, end);
            } else {
                this._events();

                if (value === '') {
                    value = this._options.defaultValue;
                }

                this._setValue(value);
            }

            if (this._options.tooltip === 'show') {
                this._eventsTooltip();
            }

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
            if (this._labelId) {
                $.removeAttribute(this._label, 'id');
            }

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
                return this._value;
            }

            return [this._startValue, this._endValue];
        }

        /**
         * Set the current value(s).
         * @param {number} start The start value to set.
         * @param {number} [end] The end value to set.
         */
        setValue(start, end) {
            if (this._options.range) {
                this._setValueRange(start, end);
            } else {
                this._setValue(start);
            }
        }
    }

    /**
     * Attach events for the Slider.
     */
    function _events() {
        $.addEvent(this._node, 'focus.ui.slider', (_) => {
            $.focus(this._handle);
        });

        const downEvent = (e) => {
            if (
                e.button ||
                $.is(this._node, ':disabled')
            ) {
                return false;
            }

            const pos = ui.getPosition(e);

            $.focus(this._handle);

            this._updatePercent(pos.x, pos.y, { updateValue: false });

            if (this._options.tooltip === 'show') {
                this._triggerTooltip('drag');
            }

            $.triggerEvent(this._node, 'slide.ui.slider');
        };

        const moveEvent = (e) => {
            const originalValue = this._value;

            const pos = ui.getPosition(e);
            this._updatePercent(pos.x, pos.y, { updateValue: false });

            if (originalValue === this._value) {
                return;
            }

            $.triggerEvent(this._node, 'sliding.ui.slider', {
                detail: this._value,
            });
        };

        const upEvent = (e) => {
            if (this._options.tooltip === 'show') {
                this._triggerTooltip('drag', false);
            }

            if ($.is(e.currentTarget, '[data-ui-value]')) {
                const value = $.getDataset(e.currentTarget, 'uiValue');
                this._setValue(value);
            } else {
                const pos = ui.getPosition(e);
                this._updatePercent(pos.x, pos.y);
            }

            $.focus(this._handle);
            $.triggerEvent(this._node, 'slid.ui.slider', {
                detail: this._value,
            });
        };

        const dragEvent = $.mouseDragFactory(downEvent, moveEvent, upEvent);

        $.addEvent(this._handle, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEvent(this._slider, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEventDelegate(this._container, 'mousedown.ui.slider touchstart.ui.slider', '[data-ui-value]', dragEvent);

        $.addEvent(this._handle, 'keydown.ui.slider', (e) => {
            if ($.is(this._node, ':disabled')) {
                return;
            }

            let value = this._value;

            const originalValue = value;

            switch (e.code) {
                case 'ArrowLeft':
                case 'ArrowDown':
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
                case 'ArrowUp':
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

            this._setValue(value);
        });
    }
    /**
     * Attach events for the Slider.
     */
    function _eventsRange() {
        $.addEvent(this._node, 'focus.ui.slider', (_) => {
            $.focus(this._handleStart);
        });

        const downEvent = (e) => {
            if (
                e.button ||
                $.is(this._node, ':disabled')
            ) {
                return false;
            }

            const pos = ui.getPosition(e);
            const handle = $.nearestTo([this._handleStart, this._handleEnd], pos.x, pos.y, { offset: true });

            $.focus(handle);

            this._updatePercentRange(pos.x, pos.y, { updateValue: false });

            if (this._options.tooltip === 'show') {
                this._triggerTooltip('drag');
            }

            $.triggerEvent(this._node, 'slide.ui.slider');
        };

        const moveEvent = (e) => {
            const originalStartValue = this._startValue;
            const originalEndValue = this._endValue;

            const pos = ui.getPosition(e);
            this._updatePercentRange(pos.x, pos.y, { updateValue: false });

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
            if (this._options.tooltip === 'show') {
                this._triggerTooltip('drag', false);
            }

            if ($.is(e.currentTarget, '[data-ui-value]')) {
                const value = $.getDataset(e.currentTarget, 'uiValue');
                this._setValue(value);
            } else {
                const pos = ui.getPosition(e);
                this._updatePercentRange(pos.x, pos.y);
            }

            $.focus(this._handle);
            $.triggerEvent(this._node, 'slid.ui.slider', {
                detail: {
                    start: this._startValue,
                    end: this._endValue,
                },
            });
        };

        const dragEvent = $.mouseDragFactory(downEvent, moveEvent, upEvent);

        const handles = [this._handleStart, this._handleEnd];

        $.addEvent(handles, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEvent(this._slider, 'mousedown.ui.slider touchstart.ui.slider', dragEvent);
        $.addEventDelegate(this._container, 'mousedown.ui.slider touchstart.ui.slider', '[data-ui-value]', dragEvent);

        $.addEvent(handles, 'focus.ui.slider', (e) => {
            this._handle = e.currentTarget;
        });

        $.addEvent(handles, 'keydown.ui.slider', (e) => {
            if ($.is(this._node, ':disabled')) {
                return;
            }

            const isStart = $.isSame(this._handleStart, e.currentTarget);

            let value = isStart ?
                this._startValue :
                this._endValue;

            const originalValue = value;

            switch (e.code) {
                case 'ArrowLeft':
                case 'ArrowDown':
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
                case 'ArrowUp':
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

            const { start, end } = this._checkRangeValue(value);

            this._setValueRange(start, end);
        });
    }
    /**
     * Attach events for the Slider tooltip.
     */
    function _eventsTooltip() {
        const tooltipTriggers = {};

        this._triggerTooltip = $._debounce((type, show = true) => {
            if (show) {
                if (!Object.keys(tooltipTriggers).length) {
                    this._tooltip._stop();
                    this._tooltip.show();
                }

                tooltipTriggers[type] = true;
            } else {
                delete tooltipTriggers[type];

                if (!Object.keys(tooltipTriggers).length) {
                    this._tooltip._stop();
                    this._tooltip.hide();
                }
            }
        });

        $.addEvent(this._container, 'mouseenter.ui.slider', (e) => {
            if (!$.isSame(e.target, this._container)) {
                return;
            }

            this._triggerTooltip('hover');
        });

        $.addEvent(this._container, 'mouseleave.ui.slider', (e) => {
            if (!$.isSame(e.target, this._container)) {
                return;
            }

            this._triggerTooltip('hover', false);
        });

        const handles = this._options.range ?
            [this._handleStart, this._handleEnd] :
            this._handle;

        $.addEvent(handles, 'focus.ui.slider', (_) => {
            this._triggerTooltip('focus');
        });

        $.addEvent(handles, 'blur.ui.slider', (_) => {
            this._triggerTooltip('focus', false);
        });
    }

    /**
     * Check a value against the current range, and update the active handle.
     * @param {number} value The value to check.
     * @return {object} The new start and end values.
     */
    function _checkRangeValue(value) {
        let start = this._startValue;
        let end = this._endValue;
        let handle = this._handle;

        if (value < start) {
            start = value;
            handle = this._handleStart;
        } else if (value > end) {
            end = value;
            handle = this._handleEnd;
        } else if ($.isSame(handle, this._handleStart)) {
            start = value;
        } else {
            end = value;
        }

        if (!$.isSame(handle, this._handle)) {
            $.focus(handle);
        }

        return { start, end };
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
     * Clamp a value to a step-size, and between a min and max value.
     * @param {number} value The value to clamp.
     * @return {number} The clamped value.
     */
    function _clampValue(value) {
        value = $._clamp(value, this._options.min, this._options.max);
        value = $._toStep(value, this._options.step);

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

        let offsetStyle;
        if (this._options.orientation === 'vertical') {
            offsetStyle = 'top';
        } else {
            offsetStyle = 'left';
        }

        $.setStyle(handle, {
            [offsetStyle]: `${percent}%`,
        });
    }
    /**
     * Refresh the disabled styling.
     */
    function _refreshDisabled() {
        const disabled = $.is(this._node, ':disabled');

        const handles = this._options.range ?
            [this._handleStart, this._handleEnd] :
            this._handle;

        if (disabled) {
            $.setStyle(this._container, {
                opacity: this._options.disabledOpacity,
            });
            $.setAttribute(handles, {
                tabindex: -1,
            });
        } else {
            $.setStyle(this._container, {
                opacity: '',
            });
            $.removeAttribute(handles, 'tabindex');
        }

        $.setAttribute(handles, { 'aria-disabled': disabled });
    }
    /**
     * Set the slider value.
     * @param {number} value The value.
     * @param {object} [options] Options for updating the value.
     * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
     */
    function _setValue(value, { updateValue = true } = {}) {
        value = this._clampValue(value);

        const percent = this._getPercent(value);
        const percentHigh = 100 - percent;

        let sizeStyle;
        let offsetStyle;
        if (this._options.orientation === 'vertical') {
            sizeStyle = 'height';
            offsetStyle = this._options.reversed ? 'bottom' : 'top';
        } else {
            sizeStyle = 'width';
            offsetStyle = this._options.reversed ? 'right' : 'left';
        }

        $.setStyle(this._barSelection, {
            [sizeStyle]: `${percent}%`,
        });
        $.setStyle(this._barHigh, {
            [sizeStyle]: `${percentHigh}%`,
            [offsetStyle]: `${percent}%`,
        });

        if (value !== this._value) {
            const title = this._options.valueText.bind(this)(value);

            $.setAttribute(this._handle, {
                'aria-valuenow': value,
                'aria-valuetext': title,
            });

            if (this._options.tooltip) {
                $.setDataset(this._handle, { uiTitle: title });
            }

            this._moveHandle(this._handle, percent);
            this._value = value;
        }

        if (this._options.tooltip) {
            this._tooltip.refresh();
            this._tooltip.update();
        }

        this._updateTicks();

        if (!updateValue) {
            return;
        }

        if (`${value}` === $.getValue(this._node)) {
            return;
        }

        $.setValue(this._node, value);

        $.triggerEvent(this._node, 'change.ui.slider');
    }
    /**
     * Set the slider range values.
     * @param {number} start The start value.
     * @param {number} end The end value.
     * @param {object} [options] Options for updating the value.
     * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
     */
    function _setValueRange(start, end, { updateValue = true } = {}) {
        start = this._clampValue(start);
        end = this._clampValue(end);

        const percentStart = this._getPercent(start);
        const percentEnd = this._getPercent(end);

        const percentMid = percentEnd - percentStart;
        const percentLow = percentStart;
        const offsetHigh = percentLow + percentMid;
        const percentHigh = 100 - offsetHigh;

        let sizeStyle;
        let offsetStyle;
        if (this._options.orientation === 'vertical') {
            sizeStyle = 'height';
            offsetStyle = this._options.reversed ? 'bottom' : 'top';
        } else {
            sizeStyle = 'width';
            offsetStyle = this._options.reversed ? 'right' : 'left';
        }

        $.setStyle(this._barLow, {
            [sizeStyle]: `${percentLow}%`,
        });
        $.setStyle(this._barSelection, {
            [sizeStyle]: `${percentMid}%`,
            [offsetStyle]: `${percentLow}%`,
        });
        $.setStyle(this._barHigh, {
            [sizeStyle]: `${percentHigh}%`,
            [offsetStyle]: `${offsetHigh}%`,
        });

        if (start !== this._startValue) {
            const startTitle = this._options.valueText.bind(this)(start);

            $.setAttribute(this._handleStart, {
                'aria-valuenow': start,
                'aria-valuetext': startTitle,
            });

            this._moveHandle(this._handleStart, percentStart);
            this._startValue = start;
        }

        if (end !== this._endValue) {
            const endTitle = this._options.valueText.bind(this)(end);

            $.setAttribute(this._handleEnd, {
                'aria-valuenow': end,
                'aria-valuetext': endTitle,
            });

            this._moveHandle(this._handleEnd, percentEnd);
            this._endValue = end;
        }

        if (this._options.tooltip) {
            const rangeTitle = this._options.rangeText.bind(this)(start, end);

            $.setDataset(this._barSelection, { uiTitle: rangeTitle });

            this._tooltip.refresh();
            this._tooltip.update();
        }

        this._updateTicks();

        if (!updateValue) {
            return;
        }

        const newValue = `${start}${this._options.rangeSeparator}${end}`;

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
            percent = $.percentY(this._slider, y, { offset: true });
        } else {
            percent = $.percentX(this._slider, x, { offset: true });
        }

        if (this._options.reversed) {
            percent = 100 - percent;
        }

        let value = this._getValue(percent);
        value = this._checkTicks(value);

        this._setValue(value, { updateValue });
    }
    /**
     * Update the range value based on slider position.
     * @param {number} x The x position.
     * @param {number} y The y position.
     * @param {object} [options] Options for updating the value.
     * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
     */
    function _updatePercentRange(x, y, { updateValue = true } = {}) {
        let percent;
        if (this._options.orientation === 'vertical') {
            percent = $.percentY(this._slider, y, { offset: true });
        } else {
            percent = $.percentX(this._slider, x, { offset: true });
        }

        if (this._options.reversed) {
            percent = 100 - percent;
        }

        let value = this._getValue(percent);
        value = this._checkTicks(value);

        const { start, end } = this._checkRangeValue(value);

        this._setValueRange(start, end, { updateValue });
    }
    /**
     * Update tick styling.
     */
    function _updateTicks() {
        let start;
        let end;
        if (this._options.range) {
            start = this._startValue;
            end = this._endValue;
        } else {
            start = this._options.min;
            end = this._value;
        }

        for (const tick of this._ticks) {
            const value = $.getDataset(tick, 'uiValue');
            const highlight = this._options.rangeHighlights.find((range) => value >= range.start && value <= range.end);

            let style = null;

            $.setAttribute(tick, { class: '' });
            $.addClass(tick, this.constructor.classes.tick);

            if (value < start) {
                style = this._options.low;
            } else if (value > end) {
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
            attributes: {
                role: 'none',
            },
        });

        this._renderTicks();

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

        this._renderRangeHighlights();

        if (this._options.range) {
            this._handleStart = this._renderHandle();
            $.append(this._container, this._handleStart);

            this._handleEnd = this._renderHandle();
            $.append(this._container, this._handleEnd);
        } else {
            this._handle = this._renderHandle();
            $.append(this._container, this._handle);
        }

        if (this._options.tooltip) {
            if (this._options.range) {
                this._tooltip = this._createTooltip(this._barSelection, (this._options.handleSize - this._options.sliderSize) / 2);
            } else {
                this._tooltip = this._createTooltip(this._handle);
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

        let sizeStyle;
        let offsetStyle;
        if (this._options.orientation === 'vertical') {
            sizeStyle = 'width';
            offsetStyle = this._options.reversed ? 'bottom' : 'top';
        } else {
            sizeStyle = 'height';
            offsetStyle = this._options.reversed ? 'right' : 'left';
        }

        $.setStyle(bar, {
            [sizeStyle]: '100%',
            [offsetStyle]: '0',
        });

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
                'type': 'button',
                'role': 'slider',
                'aria-valuemin': this._options.min,
                'aria-valuemax': this._options.max,
                'aria-valuenow': '',
                'aria-valuetext': '',
                'aria-required': $.getProperty(this._node, 'required'),
            },
        });

        if (this._label) {
            const labelId = $.getAttribute(this._label, 'id');
            $.setAttribute(handle, { 'aria-labelledby': labelId });
        }

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
                const tickLabel = $.create('small', {
                    text: this._options.tickLabels[index],
                    class: this.constructor.classes.tickLabel,
                });

                if (this._options.orientation === 'vertical') {
                    $.setStyle(tickLabel, {
                        top: `${percent}%`,
                        left: `${this._options.tickSize / 2}px`,
                        transform: 'translateY(-50%)',
                    });
                } else {
                    $.setStyle(tickLabel, {
                        top: `${this._options.tickSize / 2}px`,
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
        valueText: (value) => value,
        rangeText: (start, end) => `${start} - ${end}`,
        tickSize: 30,
        handleSize: 20,
        handleSizeRatio: .75,
        sliderSize: 10,
        verticalHeight: 200,
        step: 1,
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
        handle: 'bg-body-tertiary border rounded focus-ring position-absolute translate-middle z-2',
        hide: 'visually-hidden',
        slider: 'progress position-relative',
        sliderBar: 'progress-bar position-absolute',
        tick: 'progress rounded-circle position-absolute translate-middle',
        tickFilled: 'progress-bar z-1',
        tickLabel: 'position-absolute p-1',
    };

    // Slider prototype
    const proto = Slider.prototype;

    proto._checkRangeValue = _checkRangeValue;
    proto._checkTicks = _checkTicks;
    proto._clampValue = _clampValue;
    proto._createTooltip = _createTooltip;
    proto._events = _events;
    proto._eventsRange = _eventsRange;
    proto._eventsTooltip = _eventsTooltip;
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
    proto._setValueRange = _setValueRange;
    proto._updatePercent = _updatePercent;
    proto._updatePercentRange = _updatePercentRange;
    proto._updateTicks = _updateTicks;

    // Slider init
    ui.initComponent('slider', Slider);

    exports.Slider = Slider;

}));
//# sourceMappingURL=frost-ui-slider.js.map
