import $ from '@fr0st/query';
import { Tooltip } from '@fr0st/ui';

/**
 * Clamp value to nearest tick (if within bounds).
 * @param {number} value The value to check.
 * @return {number} The new value.
 */
export function _checkTicks(value) {
    let closest;
    let closestDiff = Number.MAX_VALUE;
    for (const tick of this._options.ticks) {
        const tickDiff = Math.abs(tick - value);
        if (tickDiff < closestDiff && (this._options.lockToTicks || tickDiff < this._options.tickSnapBounds)) {
            closestDiff = tickDiff;
            closest = tick;
        }
    };

    if (closest) {
        return closest;
    }

    return value;
};

/**
 * Create a tooltip on an element.
 * @param {HTMLElement} element The element to attach the tooltip to.
 * @param {number} [spacing=0] Amount of spacing for the tooltip.
 * @return {UI.Tooltip} The tooltip.
 */
export function _createTooltip(element, spacing = 0) {
    let placement;
    if (this._options.tooltipPlacement) {
        placement = this._options.tooltipPlacement;
    } else if (this._options.orientation === 'vertical') {
        placement = 'right';
    } else {
        placement = 'top';
    }

    const tooltip = Tooltip.init(element, {
        appendTo: 'body',
        trigger: '',
        spacing,
        placement,
    });

    if (this._options.tooltip === 'always') {
        tooltip.show();
    }

    return tooltip;
};

/**
 * Convert a value to percent.
 * @param {number} value The value to convert.
 * @return {number} The percent.
 */
export function _getPercent(value) {
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
};

/**
 * Convert a percent to value.
 * @param {number} percent The percent to convert.
 * @return {number} The value.
 */
export function _getValue(percent) {
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
};

/**
 * Move a handle by a percent.
 * @param {HTMLElement} handle The handle to move.
 * @param {number} percent The amount to move the handle.
 */
export function _moveHandle(handle, percent) {
    if (this._options.reversed) {
        percent = 100 - percent;
    }

    if (this._options.orientation === 'vertical') {
        $.setStyle(handle, { top: `${100 - percent}%` });
    } else {
        $.setStyle(handle, { left: `${percent}%` });
    }
};

/**
 * Refresh the disabled styling.
 */
export function _refreshDisabled() {
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
};

/**
 * Set the slider value.
 * @param {number} end The end value.
 * @param {number} [start] The start value.
 * @param {object} [options] Options for updating the value.
 * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
 */
export function _setValue(end, start = null, { updateValue = true } = {}) {
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
};

/**
 * Update the value based on slider position.
 * @param {number} x The x position.
 * @param {number} y The y position.
 * @param {object} [options] Options for updating the value.
 * @param  {Boolean} [options.updateValue=true] Whether to update the input value.
 */
export function _updatePercent(x, y, { updateValue = true } = {}) {
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
};

/**
 * Update tick styling.
 */
export function _updateTicks() {
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
};
