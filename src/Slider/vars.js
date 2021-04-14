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
