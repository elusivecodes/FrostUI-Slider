/**
 * FrostUI-Slider v1.0
 * https://github.com/elusivecodes/FrostUI-Slider
 */
(function(global, factory) {
    'use strict';

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory;
    } else {
        factory(global);
    }

})(window, function(window) {
    'use strict';

    if (!window) {
        throw new Error('FrostUI-Slider requires a Window.');
    }

    if (!('UI' in window)) {
        throw new Error('FrostUI-Slider requires FrostUI.');
    }

    const Core = window.Core;
    const dom = window.dom;
    const QuerySet = window.QuerySet;
    const UI = window.UI;
    const document = window.document;

    /**
     * Slider Class
     * @class
     */
    class Slider extends UI.BaseComponent {

        /**
         * New Slider constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [settings] The options to create the Slider with.
         * @returns {Slider} A new Slider object.
         */
        constructor(node, settings) {
            super(node, settings);

            this._render();
            this._events();

            let value = dom.getValue(this._node);

            if (!value) {
                value = this._settings.defaultValue;
            }

            let start = null;
            let end = this._settings.min;

            if (this._settings.range) {
                const values = Core.isArray(value) ?
                    value :
                    `${value}`.split(this._settings.rangeSeparator);

                start = end;
                if (values.length === 2) {
                    start = values[0];
                    end = values[1];
                } else if (values[0] !== '') {
                    end = values[0];
                } else {
                    end = this._settings.min;
                }
            } else if (value) {
                end = value;
            }

            this._setValue(end, start);
            this._refreshDisabled();
        }

        /**
         * Disable the Slider.
         * @returns {Slider} The Slider.
         */
        disable() {
            dom.setAttribute(this._node, 'disabled', true);
            this._refreshDisabled();

            return this;
        }

        /**
         * Dispose the Slider.
         */
        dispose() {
            if (this._tooltip) {
                this._tooltip.dispose();
                this._tooltip = null;
            }

            dom.remove(this._container);
            dom.removeEvent(this._node, 'focus.ui.slider');
            dom.removeClass(this._node, this.constructor.classes.hide);
            dom.removeAttribute(this._node, 'tabindex');

            this._container = null;
            this._slider = null;
            this._barLow = null;
            this._barSelection = null;
            this._barHigh = null;
            this._handleEnd = null;
            this._handleStart = null;
            this._handleActive = null;
            this._ticks = null;

            super.dispose();
        }

        /**
         * Enable the Slider.
         * @returns {Slider} The Slider.
         */
        enable() {
            dom.removeAttribute(this._node, 'disabled');
            this._refreshDisabled();

            return this;
        }

        /**
         * Get the current value(s).
         * @returns {number|array} The current value(s).
         */
        getValue() {
            if (!this._settings.range) {
                return this._endValue;
            }

            return [this._startValue, this._endValue];
        }

        /**
         * Set the current value(s).
         * @param {number|array} value The value to set.
         * @returns {Slider} The Slider.
         */
        setValue(value) {
            if (this._settings.range && Core.isArray(value)) {
                this._setValue(...value.reverse())
            } else {
                this._setValue(value);
            }

            return this;
        }

    }


    /**
     * Slider Events
     */

    Object.assign(Slider.prototype, {

        /**
         * Attach events for the Slider.
         */
        _events() {
            dom.addEvent(this._node, 'focus.ui.slider', _ => {
                dom.focus(this._handleEnd);
            });

            dom.addEvent(this._slider, 'click.ui.slider', e => {
                if (e.button) {
                    return;
                }

                e.preventDefault();

                this._updatePercent(e.pageX, e.pageY);
            });

            dom.addEventDelegate(this._container, 'click', '[data-ui-value]', e => {
                if (e.button) {
                    return;
                }

                e.preventDefault();

                const value = dom.getDataset(e.currentTarget, 'uiValue');
                this._setValue(value);
            });

            const getPosition = e => {
                if ('touches' in e && e.touches.length) {
                    return {
                        x: e.touches[0].pageX,
                        y: e.touches[0].pageY
                    };
                }

                return {
                    x: e.pageX,
                    y: e.pageY
                };
            };

            let isDragging = false;
            let hasMouseover = false;
            const downEvent = dom.mouseDragFactory(
                e => {
                    if (e.button) {
                        return false;
                    }

                    e.preventDefault();

                    if (this._settings.range) {
                        const pos = getPosition(e);
                        this._handleActive = dom.nearestTo([this._handleStart, this._handleEnd], pos.x, pos.y, true);
                    } else {
                        this._handleActive = this._handleEnd;
                    }

                    if (this._settings.tooltip === 'show' && !hasMouseover) {
                        this._tooltip._stop();
                        this._tooltip.show();
                    }

                    dom.triggerEvent(this._node, 'slide.ui.slider');
                },
                e => {
                    const pos = getPosition(e);
                    this._updatePercent(pos.x, pos.y);
                    isDragging = true;

                    dom.triggerEvent(this._node, 'sliding.ui.slider');
                },
                e => {
                    if (dom.is(e.currentTarget, '[data-ui-value]')) {
                        const value = dom.getDataset(e.currentTarget, 'uiValue');
                        this._setValue(value);
                    }

                    if (this._settings.tooltip === 'show' && !hasMouseover) {
                        this._tooltip._stop();
                        this._tooltip.hide();
                    }

                    dom.focus(this._handleActive);

                    isDragging = false;

                    dom.triggerEvent(this._node, 'slid.ui.slider');
                }
            );

            const handles = [this._handleEnd];

            if (this._settings.range) {
                handles.push(this._handleStart);
            }

            dom.addEvent(handles, 'keydown.ui.slider', e => {
                const isStart = this._settings.range && dom.isSame(this._handleStart, e.currentTarget);

                let value = isStart ?
                    this._startValue :
                    this._endValue;

                const originalValue = value;

                switch (e.code) {
                    case 'ArrowLeft':
                        if (e.ctrlKey) {
                            for (const tick of this._settings.ticks) {
                                if (tick >= originalValue) {
                                    break;
                                }

                                value = tick;
                            }

                            if (value === originalValue) {
                                value = this._settings.min;
                            }
                        } else {
                            value -= this._settings.step;
                        }
                        break;
                    case 'ArrowRight':
                        if (e.ctrlKey) {
                            for (const tick of this._settings.ticks.slice().reverse()) {
                                if (tick <= originalValue) {
                                    break;
                                }

                                value = tick;
                            }

                            if (value === originalValue) {
                                value = this._settings.max;
                            }
                        } else {
                            value += this._settings.step;
                        }
                        break;
                    case 'Home':
                        value = this._settings.min;
                        break;
                    case 'End':
                        value = this._settings.max;
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

            dom.addEvent(handles, 'mousedown.ui.slider touchstart.ui.slider', downEvent);
            dom.addEvent(this._slider, 'mousedown.ui.slider touchstart.ui.slider', downEvent);
            dom.addEventDelegate(this._container, 'mousedown.ui.slider touchstart.ui.slider', '[data-ui-value]', downEvent);

            if (this._settings.tooltip === 'show') {
                dom.addEvent(this._container, 'mouseenter.ui.slider', _ => {
                    if (!isDragging) {
                        this._tooltip._stop();
                        this._tooltip.show();
                    }

                    hasMouseover = true;
                });

                dom.addEvent(this._container, 'mouseleave.ui.slider', _ => {
                    if (!isDragging) {
                        this._tooltip._stop();
                        this._tooltip.hide();
                    }

                    hasMouseover = false;
                });
            }
        }

    });


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

            dom.triggerEvent(this._node, 'change.ui.slider');
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


    /**
     * Slider Render
     */

    Object.assign(Slider.prototype, {

        /**
         * Render the slider.
         */
        _render() {
            this._container = dom.create('div', {
                class: this.constructor.classes.container
            });

            this._slider = dom.create('div', {
                class: this.constructor.classes.slider
            });
            dom.append(this._container, this._slider);

            if (this._settings.orientation === 'vertical') {
                dom.setStyle(this._slider, {
                    width: `${this._settings.sliderSize}px`,
                    height: `${this._settings.verticalHeight}px`
                });
            } else {
                dom.setStyle(this._slider, {
                    width: '100%',
                    height: `${this._settings.sliderSize}px`
                });
            }

            if (this._settings.range) {
                this._barLow = this._renderBar(this._settings.low);
                dom.append(this._slider, this._barLow);
            }

            this._barSelection = this._renderBar(this._settings.selection);
            dom.append(this._slider, this._barSelection);

            this._barHigh = this._renderBar(this._settings.high);
            dom.append(this._slider, this._barHigh);

            this._renderTicks();
            this._renderRangeHighlights();

            this._handleEnd = this._renderHandle();
            dom.append(this._container, this._handleEnd);

            if (this._settings.range) {
                this._handleStart = this._renderHandle();
                dom.append(this._container, this._handleStart);
            }

            if (this._settings.tooltip) {
                if (this._settings.range) {
                    this._tooltip = this._createTooltip(this._barSelection, (this._settings.handleSize - this._settings.sliderSize) / 2);
                } else {
                    this._tooltip = this._createTooltip(this._handleEnd);
                }
            }

            // hide the input node
            dom.addClass(this._node, this.constructor.classes.hide);
            dom.setAttribute(this._node, 'tabindex', '-1');

            dom.before(this._node, this._container);
        },

        /**
         * Render a progress bar.
         * @param {string} [color] The background color.
         * @returns {HTMLElement} The progress bar.
         */
        _renderBar(style) {
            const bar = dom.create('div', {
                class: this.constructor.classes.sliderBar,
                style: {
                    backgroundColor: 'transparent',
                    transition: 'none'
                }
            });

            if (style) {
                dom.addClass(bar, style);
            }

            if (this._settings.orientation === 'vertical') {
                dom.setStyle(bar, {
                    width: '100%',
                    bottom: 0
                });
            } else {
                dom.setStyle(bar, {
                    height: '100%'
                });
            }

            return bar;
        },

        /**
         * Render a handle.
         * @returns {HTMLElement} The handle.
         */
        _renderHandle() {
            const handle = dom.create('button', {
                class: this.constructor.classes.handle,
                attributes: {
                    type: 'button'
                }
            });

            if (this._settings.orientation === 'vertical') {
                dom.setStyle(handle, {
                    width: `${this._settings.handleSize}px`,
                    height: `${this._settings.handleSize * this._settings.handleSizeRatio}px`,
                    left: `${this._settings.sliderSize / 2}px`
                });
            } else {
                dom.setStyle(handle, {
                    width: `${this._settings.handleSize * this._settings.handleSizeRatio}px`,
                    height: `${this._settings.handleSize}px`,
                    top: `${this._settings.sliderSize / 2}px`
                });
            }

            return handle;
        },

        /**
         * Render highlight ranges.
         */
        _renderRangeHighlights() {
            for (const range of this._settings.rangeHighlights) {
                const highlightBar = this._renderBar(range.style);

                const startPercent = this._getPercent(range.start);
                const endPercent = this._getPercent(range.end);
                const percent = endPercent - startPercent;

                if (this._settings.orientation === 'vertical') {
                    dom.setStyle(highlightBar, {
                        height: `${percent}%`,
                        top: `${startPercent}`
                    });
                } else {
                    dom.setStyle(highlightBar, {
                        width: `${percent}%`,
                        left: `${startPercent}%`
                    });
                }

                dom.append(this._slider, highlightBar);
            }
        },

        /**
         * Render slider ticks.
         */
        _renderTicks() {
            this._tickContainer = dom.create('div');
            this._ticks = [];

            for (const [index, value] of this._settings.ticks.entries()) {
                const tickContainer = dom.create('div');

                const tick = dom.create('div', {
                    attributes: {
                        title: value
                    },
                    dataset: {
                        uiValue: value
                    }
                });

                let percent = this._getPercent(value);

                if (this._settings.reversed) {
                    percent = 100 - percent;
                }

                dom.setStyle(tick, {
                    width: `${this._settings.tickSize}px`,
                    height: `${this._settings.tickSize}px`,
                });

                if (this._settings.orientation === 'vertical') {
                    dom.setStyle(tick, {
                        bottom: `${percent}%`,
                        left: '50%'
                    });
                } else {
                    dom.setStyle(tick, {
                        top: '50%',
                        left: `${percent}%`
                    });
                }

                dom.append(tickContainer, tick);

                if (this._settings.tickLabels && this._settings.tickLabels[index]) {
                    const tickLabel = dom.create('div', {
                        text: value,
                        class: this.constructor.classes.tickLabel
                    });

                    if (this._settings.orientation === 'vertical') {
                        dom.setStyle(tickLabel, {
                            top: `${percent}%`,
                            left: '100%',
                            transform: 'translateY(-50%)'
                        });
                    } else {
                        dom.setStyle(tickLabel, {
                            top: '100%',
                            left: `${percent}%`,
                            transform: 'translateX(-50%)'
                        });
                    }

                    dom.append(tickContainer, tickLabel);
                }

                dom.append(this._tickContainer, tickContainer);

                this._ticks.push(tick);
            }

            dom.append(this._container, this._tickContainer);
        }

    });


    // Slider default options
    Slider.defaults = {
        min: 0,
        max: 10,
        defaultValue: 0,
        orientation: 'horizontal',
        scale: 'linear',
        formatter: value => value,
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
        disabledOpacity: .5
    };

    // Default classes
    Slider.classes = {
        container: 'position-relative my-2',
        handle: 'btn btn-light position-absolute translate-middle p-0',
        hide: 'visually-hidden',
        slider: 'progress shadow-sm position-relative',
        sliderBar: 'progress-bar position-absolute',
        tick: 'progress rounded-circle position-absolute translate-middle p-0',
        tickFilled: 'progress-bar',
        tickLabel: 'position-absolute'
    };

    UI.initComponent('slider', Slider);

    UI.Slider = Slider;

});