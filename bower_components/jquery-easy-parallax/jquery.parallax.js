;(function($) {
    'use strict';

    var $window = $(window),
        $elements = null,
        elementsArr,
        animationsArr,
        scrollTop,
        len,
        windowHeight = $window.height(),
        windowWidth = $window.width(),
        scrollTicking = false,
        resizeTicking = false,
        isTouchDevice = window.Modernizr && typeof(Modernizr.touchevents) != 'undefined' ? Modernizr.touchevents : testTouchEvents();

    function testTouchEvents() {
        return 'ontouchstart' in window // works on most browsers
            || 'onmsgesturechange' in window; // works on ie10
    }

    $.fn.parallax = function(method) {
        switch (method) {
            case 'reset':
                this.css('transform', '');
                break;
            case 'destroy':
                $elements.not(this);
                break;
            default:
                if (!isTouchDevice) {
                    this.data("parallax-js", method);
                    animationsArr = [];
                    this.each(updateAnimationsArray);
                    if ($elements === null) {
                        $elements = this;
                        window.onresize = onResize;
                        window.onscroll = onScroll;
                        //setInterval(onScroll, 10);
                    }
                    else {
                        $elements.add(this);
                    }
                    elementsArr = $elements.toArray();
                }
        }
        return this;
    };

    function parseOptions() {
        var optionsArr = [],
            dataOptions = this.data("parallax") || {},
            jsOptions = this.data("parallax-js") || {};
        if (!Array.isArray(dataOptions)) {
            dataOptions = [dataOptions];
        }
        if (!Array.isArray(jsOptions)) {
            jsOptions = [jsOptions];
        }
        var length = Math.max(dataOptions.length, jsOptions.length);
        for (var i=0; i<length; i++) {
            var options = $.extend(dataOptions[i] || {}, jsOptions[i] || {});
            typeof options.start == "undefined" || (options.start = convertToElement(options.start));
            typeof options.start != "undefined" || (options.start = this);
            typeof options.trigger != "undefined" || (options.trigger = "100%");
            optionsArr.push(options);
        }
        return optionsArr;
    }

    function updateAnimationsArray(idx) {
        var $this = $(this),
            animations = [],
            optionsArr = parseOptions.call($this);
        for (var i=0; i<optionsArr.length; i++) {
            var options = optionsArr[i],
                globalOptions = {
                    axis: options.axis,
                    start: options.start,
                    trigger: options.trigger,
                    duration: options.duration
                },
                animation = {};
            if (typeof options.x != "undefined") {
                var xOptions = mergeOptions(options.x, globalOptions);
                animation.x = new Scene($this, xOptions, windowHeight);
            }
            if (typeof options.y != "undefined") {
                var yOptions = mergeOptions(options.y, globalOptions);
                animation.y = new Scene($this, yOptions, windowHeight);
            }
            if (typeof options.z != "undefined") {
                var zOptions = mergeOptions(options.z, globalOptions);
                animation.z = new Scene($this, zOptions, windowHeight);
            }
            if (typeof options.scale != "undefined") {
                var scaleOptions = mergeOptions(options.scale, globalOptions, 1);
                animation.scale = new Scene($this, scaleOptions, 1);
            }
            if (typeof options.rotate != "undefined") {
                var rotateOptions = mergeOptions(options.rotate, globalOptions);
                animation.rotate = new Scene($this, rotateOptions, 360);
            }
            if (animation.x || animation.y || animation.z || animation.scale || animation.rotate) {
                animation.transform = new Transform(new TransformMatrix());
            }

            if (typeof options.opacity != "undefined") {
                var opacityOptions = mergeOptions(options.opacity, globalOptions, 1);
                animation.opacity = new Scene($this, opacityOptions, 1);
            }
            animations.push(animation);
        }
        animationsArr[idx] = animations;
    }

    function onResize() {
        if (!resizeTicking) {
            window.requestAnimationFrame(function() {
                windowHeight = $window.height();
                windowWidth = $window.width();
                $elements.each(updateAnimationsArray);
            });
            resizeTicking = true;
        }
    }

    function onScroll() {
        if (!scrollTicking) {
            window.requestAnimationFrame(animateElements);
            scrollTicking = true;
        }
    }

    function animateElements() {
        scrollTop = window.scrollY;
        for (var i= 0, len=elementsArr.length; i<len; i++) {
            animateElement.call(elementsArr[i], i);
        }
        scrollTicking = false;
    }

    function animateElement(idx) {
        var animations = animationsArr[idx],
            animation;
        for (var i=0, len=animations.length; i<len; i++) {
            animation = animations[i];
            if (animation.transform) {
                TransformMatrix.fromEl(this, animation.transform.matrix);
                if (animation.x && animation.x.update()) {
                    animation.transform.setTranslateX(animation.x.value());
                }
                if (animation.y && animation.y.update()) {
                    animation.transform.setTranslateY(animation.y.value());
                }
                if (animation.z && animation.z.update()) {
                    animation.transform.setTranslateZ(animation.z.value());
                }
                if (animation.scale && animation.scale.update()) {
                    animation.transform.setScale(animation.scale.value());
                }
                if (animation.rotate && animation.rotate.update()) {
                    animation.transform.setRotation(animation.rotate.value());
                }
                var transform = animation.transform.toString();
                this.style['-webkit-transform'] = transform;
                this.style['-moz-transform'] = transform;
                this.style['-ms-transform'] = transform;
                this.style['-o-transform'] = transform;
                this.style.transform = transform;
            }
            if (animation.opacity && animation.opacity.update()) {
                this.style.opacity = animation.opacity.value();
            }
        }
    }

    function mergeOptions(options, globalOptions, defaultFrom) {
        if (typeof options != "object") {
            options = {to: options};
        }
        if (typeof options.from == "undefined") {
            options.from = defaultFrom || 0;
        }
        return $.extend({}, globalOptions, options);
    }

    function getOffset(value, axis) {
        if (isElement(value)) {
            var offset = 0;
            do {
                offset += value[axis === 'x' ? 'offsetLeft' : 'offsetTop'];
            } while (value = value.offsetParent);
            value = offset;
        }
        return value;
    }

    function isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch(e){
            //Browsers not supporting W3 DOM2 don't have HTMLElement and
            return (typeof obj==="object") &&
                (obj.nodeType===1) && (typeof obj.style === "object") &&
                (typeof obj.ownerDocument ==="object");
        }
    }

    function convertToElement(value) {
        if (typeof value === "string") {
            value = $(value);
            if (value.length) {
                return value[0];
            }
            console.error("Invalid parallax start selector: "+value);
        }
        else {
            return value;
        }
    }

    function convertToPx(value, axis) {
        if (axis === 'x') {
            return covertOption(value, windowWidth);
        }
        return covertOption(value, windowHeight);
    }

    function covertOption(value, maxValue) {
        if (typeof value === "string" && value.match(/%/g)) {
            value = (parseFloat(value) / 100) * maxValue;
        }
        else if (typeof value == "function") {
            value = value(maxValue);
        }
        return value;
    }

    function Scene($el, options, maxValue) {
        this.$el = $el;
        this.axis = options.axis;
        this.from = covertOption(options.from, maxValue);
        this.to = covertOption(options.to, maxValue);
        this.trigger = convertToPx(options.trigger, options.axis);
        this.start = convertToElement(options.start) || options.start;
        if (typeof options.ease == "function") {
            this.ease = options.ease;
        }
        else {
            typeof options.ease == "undefined" || (this.ease = $.easing[options.ease]);
            typeof this.ease == "function" || (this.ease = $.easing.linear);
        }

        if (typeof options.duration != "undefined") {
            var durationPx = convertToPx(options.duration, options.axis);
            this.duration = function() {
                return durationPx;
            };
        }
        else {
            var scene = this;
            this.duration = function() {
                return (getOffset(scene.$el[0], options.axis) + scene.$el.outerHeight()) - scene.startPx;
            };
        }
    }
    Scene.STATE_BEFORE = 'before';
    Scene.STATE_DURING = 'during';
    Scene.STATE_AFTER = 'after';
    Scene.prototype = {
        update: function() {
            // todo: limit the number of calls to these 2
            this.updateStart();
            this.updateDuration();
            return (this.state == Scene.STATE_DURING) || (this.updateState() == Scene.STATE_DURING);
        },
        updateStart: function() {
            this.startPx = Math.max(getOffset(this.start, this.axis) - this.trigger, 0);
            return this.startPx;
        },
        updateDuration: function() {
            this.durationPx = this.duration.call(this);
            if (this.durationPx < 0) {
                console.error("Invalid parallax duration: "+this.durationPx);
            }
            return this.durationPx;
        },
        updateState: function() {
            if (scrollTop < this.startPx) {
                this.state = Scene.STATE_BEFORE;
            }
            else if (scrollTop <= (this.startPx + this.durationPx)) {
                this.state = Scene.STATE_DURING;
            }
            else {
                this.state = Scene.STATE_AFTER;
            }
            return this.state;
        },
        value: function() {
            if (this.state == Scene.STATE_BEFORE) {
                return this.from;
            }
            else if (this.state == Scene.STATE_DURING) {
                var posPx = scrollTop - this.startPx,
                    percent = posPx / this.durationPx,
                    aniPos = this.ease.call(this, percent);
                return (this.to - this.from) * aniPos + this.from;
            }
            else {
                return this.to;
            }
        }
    };

    function Transform(matrix) {
        this.matrix = matrix || new TransformMatrix();
    }
    Transform.prototype = {
        setTranslateX: function(value) {
            this.translateX = value;
        },
        setTranslateY: function(value) {
            this.translateY = value;
        },
        setTranslateZ: function(value) {
            this.translateZ = value;
        },
        setScale: function(value) {
            this.scale = value;
        },
        setRotation: function(angle) {
            this.rotate = angle;
        },
        toString: function() {
            var x = (typeof this.translateX != "undefined" ? this.translateX : this.matrix.getTranslateX()).toFixed(2),
                y = (typeof this.translateY != "undefined" ? this.translateY : this.matrix.getTranslateY()).toFixed(2),
                z = (typeof this.translateZ != "undefined" ? this.translateZ : this.matrix.getTranslateZ()).toFixed(2),
                scale = (typeof this.scale != "undefined" ? this.scale : this.matrix.getScale()),
                rotate = (typeof this.rotate != "undefined" ? this.rotate : this.matrix.getRotation()),
                string = 'translate3d('+x+'px, '+y+'px, '+z+'px)';
            if (scale != 1) {
                string += ' scale('+scale+')';
            }
            if (rotate) {
                string += 'rotate('+rotate+'deg)';
            }
            return string;
        }
    };

    function TransformMatrix() {
        this.matrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    TransformMatrix.fromArray = function(array, result) {
        result || (result = new TransformMatrix());
        if (array.length < 6) {
            return result;
        }
        for (var i=0; i<array.length; i++) {
            array[i] = parseFloat(array[i]);
        }
        if (array.length < 16) {
            array = [
                array[0], array[1], 0, 0,
                array[2], array[3], 0, 0,
                0, 0, 1, 0,
                array[4], array[5], 0, 1
            ];
        }
        result.matrix = array;
        return result;
    };
    TransformMatrix.fromEl = function(el, result) {
        if (!window.getComputedStyle) {
            return result || new TransformMatrix();
        }
        var style = getComputedStyle(el),
            transform = style.transform || style.webkitTransform || style.mozTransform;
        return TransformMatrix.fromArray(transform.replace(/^matrix(3d)?\((.*)\)$/, '$2').split(/, /), result);
    };
    TransformMatrix.prototype = {
        getTranslateX: function() {
            return this.matrix[12];
        },
        setTranslateX: function(value) {
            this.matrix[12] = value;
        },
        getTranslateY: function() {
            return this.matrix[13];
        },
        setTranslateY: function(value) {
            this.matrix[13] = value;
        },
        getTranslateZ: function() {
            return this.matrix[14];
        },
        setTranslateZ: function(value) {
            this.matrix[14] = value;
        },
        getScale: function() {
            var a = this.matrix[0],
                b = this.matrix[1],
                d = 10;
            return Math.round( Math.sqrt( a*a + b*b ) * d ) / d;
        },
        getRotation: function() {
            var a = this.matrix[0],
                b = this.matrix[1];
            return Math.round(Math.atan2(b, a) * (180/Math.PI));
        }
    };

    if (!isTouchDevice) {
        $(function() {

            $("[data-parallax]").parallax();

        });
    }

})(jQuery);

// isArray shim
if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// console.error shim
if (!console["error"]) {
    console.error = function(message) {
        window.alert(message);
    };
}