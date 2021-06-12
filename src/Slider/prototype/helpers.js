/**
 * Slider Events
 */

Object.assign(Slider.prototype, {

    /**
     * Clamp value to nearest tick (if within bounds).
     * @param {number} value The value to check.
     * @returns {number} The new value.
     */
    _checkTicks(value) {
        let closest;
        let closestDiff = Number.MAX_VALUE;
        for (const tick of this._settings.ticks) {
            const tickDiff = Math.abs(tick - value);
            if (tickDiff < closestDiff && (this._settings.lockToTicks || tickDiff < this._settings.tickSnapBounds)) {
                closestDiff = tickDiff;
                closest = tick;
            }
        };

        if (closest) {
            return closest;
        }

        return value;
    },

    /**
     * Create a tooltip on an element.
     * @param {HTMLElement} element The element to attach the tooltip to.
     * @param {number} [spacing=0] Amount of spacing for the tooltip.
     * @returns {UI.Tooltip} The tooltip.
     */
    _createTooltip(element, spacing = 0) {
        let placement;
        if (this._settings.tooltipPlacement) {
            placement = this._settings.tooltipPlacement;
        } else if (this._settings.orientation === 'vertical') {
            placement = 'right';
        } else {
            placement = 'top';
        }

        const tooltip = UI.Tooltip.init(element, {
            appendTo: 'body',
            trigger: '',
            spacing,
            placement
        });

        if (this._settings.tooltip === 'always') {
            tooltip.show();
        }

        return tooltip;
    },

    /**
     * Convert a value to percent.
     * @param {number} value The value to convert.
     * @returns {number} The percent.
     */
    _getPercent(value) {
        if (this._settings.scale !== 'logarithmic') {
            return Core.inverseLerp(this._settings.min, this._settings.max, value) * 100;
        }

        if (this._settings.min === this._settings.max) {
            return 0;
        }

        const offset = 1 - this._settings.min;
        const max = Math.log(this._settings.max + offset);
        const min = Math.log(this._settings.min + offset);
        const v = Math.log(value + offset);
        return 100 * (v - min) / (max - min);
    },

    /**
     * Convert a percent to value.
     * @param {number} value The percent to convert.
     * @returns {number} The value.
     */
    _getValue(percent) {
        if (this._settings.scale !== 'logarithmic') {
            return Core.lerp(this._settings.min, this._settings.max, percent / 100);
        }

        const offset = 1 - this._settings.min;
        const min = Math.log(this._settings.min + offset);
        const max = Math.log(this._settings.max + offset);

        let value = Math.exp(min + (max - min) * percent / 100) - offset;

        if (Math.round(value) === max) {
            return max;
        }

        return this._settings.min + value;
    },

    /**
     * Move a handle by a percent.
     * @param {HTMLElement} handle The handle to move.
     * @param {number} percent The amount to move the handle.
     */
    _moveHandle(handle, percent) {
        if (this._settings.reversed) {
            percent = 100 - percent;
        }

        if (this._settings.orientation === 'vertical') {
            dom.setStyle(handle, 'top', `${100 - percent}%`);
        } else {
            dom.setStyle(handle, 'left', `${percent}%`);
        }
    },

    /**
     * Refresh the disabled styling.
     */
    _refreshDisabled() {
        if (dom.is(this._node, ':disabled')) {
            dom.setStyle(this._container, {
                opacity: this._settings.disabledOpacity,
                pointerEvents: 'none'
            });
        } else {
            dom.setStyle(this._container, {
                opacity: '',
                pointerEvents: ''
            });
        }
    },

    /**
     * Set the slider value.
     * @param {number} end The end value.
     * @param {number} [start] The start value.
     */
    _setValue(end, start = null) {
        if (dom.is(this._node, ':disabled')) {
            return;
        }

        end = Core.clamp(end, this._settings.min, this._settings.max);
        end = Core.toStep(end, this._settings.step);
        const percentEnd = this._getPercent(end);

        let percent;
        let percentStart;
        let percentLow;
        if (!this._settings.range) {
            percent = percentEnd;
            percentLow = 0;
        } else {
            start = Core.clamp(start, this._settings.min, this._settings.max);
            start = Core.toStep(start, this._settings.step);
            percentStart = this._getPercent(start);
            percent = percentEnd - percentStart;
            percentLow = percentStart;
        }

        if (end === this._endValue && start === this._startValue) {
            return;
        }

        if (this._settings.reversed) {
            percentLow = 100 - percentLow;
        }

        const offsetHigh = percent + percentLow;
        const percentHigh = 100 - offsetHigh;

        if (this._settings.orientation === 'vertical') {
            dom.setStyle(this._barLow, 'height', `${percentLow}%`);
            dom.setStyle(this._barSelection, {
                height: `${percent}%`,
                bottom: `${percentLow}%`
            });
            dom.setStyle(this._barHigh, {
                height: `${percentHigh}%`,
                bottom: `${offsetHigh}%`
            });
        } else {
            dom.setStyle(this._barLow, 'width', `${percentLow}%`);
            dom.setStyle(this._barSelection, {
                width: `${percent}%`,
                left: `${percentLow}%`
            });
            dom.setStyle(this._barHigh, {
                width: `${percentHigh}%`,
                left: `${offsetHigh}%`
            });
        }

        dom.setAttribute(this._barHigh, 'aria-valuenow', percent);

        const endTitle = this._settings.formatter(end);
        const startTitle = this._settings.formatter(start);
        let barTitle = endTitle;
        barTitle = `${startTitle} - ${endTitle}`;

        if (end !== this._endValue) {
            dom.setDataset(this._handleEnd, 'uiTitle', endTitle);
            this._moveHandle(this._handleEnd, percentEnd);
            this._endValue = end;
        }

        if (start !== this._startValue) {
            if (this._settings.range) {
                dom.setDataset(this._handleStart, 'uiTitle', startTitle);
                this._moveHandle(this._handleStart, percentStart);
            }

            this._startValue = start;
        }

        dom.setDataset(this._barSelection, 'uiTitle', barTitle);

        this._tooltip.refresh();
        this._tooltip.update();

        this._updateTicks();

        const newValue = this._settings.range ?
            `${start}${this._settings.rangeSeparator}${end}` :
            end;
        dom.setValue(this._node, newValue);
    },

    /**
     * Update the value based on slider position.
     * @param {number} x The x position.
     * @param {number} y The y position.
     */
    _updatePercent(x, y) {
        let percent;
        if (this._settings.orientation === 'vertical') {
            percent = 100 - dom.percentY(this._slider, y, true, true);
        } else {
            percent = dom.percentX(this._slider, x, true, true);
        }

        if (this._settings.reversed) {
            percent = 100 - percent;
        }

        let value = this._getValue(percent);
        value = this._checkTicks(value);

        let start = null;
        let end = value;
        if (this._settings.range) {
            const isEndHandle = dom.isSame(this._handleActive, this._handleEnd);
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

        this._setValue(end, start);
    },

    /**
     * Update tick styling.
     */
    _updateTicks() {
        for (const tick of this._ticks) {
            const value = dom.getDataset(tick, 'uiValue');
            const highlight = this._settings.rangeHighlights.find(range => value >= range.start && value <= range.end);

            let style = null;

            dom.setAttribute(tick, 'class', '');
            dom.addClass(tick, this.constructor.classes.tick);

            if (this._startValue !== null & value < this._startValue) {
                style = this._settings.low;
            } else if (value > this._endValue) {
                style = this._settings.high;
            } else {
                dom.addClass(tick, this.constructor.classes.tickFilled);
                style = this._settings.selection;
            }

            if (highlight) {
                style = highlight.style;
            }

            if (style) {
                dom.addClass(tick, style);
            }
        }
    }

});
