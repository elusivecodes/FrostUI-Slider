import $ from '@fr0st/query';
import { BaseComponent } from '@fr0st/ui';

/**
 * Slider Class
 * @class
 */
export default class Slider extends BaseComponent {
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
