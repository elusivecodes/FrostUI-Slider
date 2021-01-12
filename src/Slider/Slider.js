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
