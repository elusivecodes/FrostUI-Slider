import $ from '@fr0st/query';
import { getPosition } from '@fr0st/ui';

/**
 * Attach events for the Slider.
 */
export function _events() {
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

        if (e.type === 'mousedown') {
            e.preventDefault();
        }

        if (this._options.range) {
            const pos = getPosition(e);
            this._handleActive = $.nearestTo([this._handleStart, this._handleEnd], pos.x, pos.y, { offset: true });
        } else {
            this._handleActive = this._handleEnd;
        }

        if (this._options.tooltip === 'show' && !hasMouseover) {
            this._tooltip._stop();
            this._tooltip.show();
        }

        $.triggerEvent(this._node, 'slide.ui.slider');
    };

    const moveEvent = (e) => {
        if (!$.getDataset(this._slider, 'uiDragging')) {
            $.setDataset(this._slider, { uiDragging: true });
        }

        const originalStartValue = this._startValue;
        const originalEndValue = this._endValue;

        const pos = getPosition(e);
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
            const pos = getPosition(e);
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
};
