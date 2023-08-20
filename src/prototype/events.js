import $ from '@fr0st/query';
import { getPosition } from '@fr0st/ui';

/**
 * Attach events for the Slider.
 */
export function _events() {
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

        const pos = getPosition(e);

        $.focus(this._handle);

        this._updatePercent(pos.x, pos.y, { updateValue: false });

        if (this._options.tooltip === 'show') {
            this._triggerTooltip('drag');
        }

        $.triggerEvent(this._node, 'slide.ui.slider');
    };

    const moveEvent = (e) => {
        const originalValue = this._value;

        const pos = getPosition(e);
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
            const pos = getPosition(e);
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
};

/**
 * Attach events for the Slider.
 */
export function _eventsRange() {
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

        const pos = getPosition(e);
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

        const pos = getPosition(e);
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
            const pos = getPosition(e);
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
};

/**
 * Attach events for the Slider tooltip.
 */
export function _eventsTooltip() {
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
};
