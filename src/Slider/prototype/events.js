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


        let isDragging = false;
        let hasMouseover = false;
        const downEvent = dom.mouseDragFactory(
            e => {
                if (e.button) {
                    return false;
                }

                e.preventDefault();

                if (this._settings.range) {
                    this._handleActive = dom.nearestTo([this._handleStart, this._handleEnd], e.pageX, e.pageY, true);
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
                this._updatePercent(e.pageX, e.pageY);
                isDragging = true;

                dom.triggerEvent(this._node, 'sliding.ui.slider');
            },
            _ => {
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

        dom.addEvent(handles, 'mousedown', downEvent);

        dom.addEvent(this._slider, 'mousedown', downEvent);
        dom.addEventDelegate(this._container, 'mousedown', '[data-ui-value]', downEvent);

        if (this._settings.tooltip === 'show') {
            dom.addEvent(this._container, 'mouseenter', _ => {
                if (!isDragging) {
                    this._tooltip._stop();
                    this._tooltip.show();
                }

                hasMouseover = true;
            });

            dom.addEvent(this._container, 'mouseleave', _ => {
                if (!isDragging) {
                    this._tooltip._stop();
                    this._tooltip.hide();
                }

                hasMouseover = false;
            });
        }
    }

});
