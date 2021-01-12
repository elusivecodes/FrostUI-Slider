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
