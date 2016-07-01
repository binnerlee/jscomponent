(function(window){
    /**
     * 默认配置
     * contentId {string} - (必选)指定弹出层元素
     * closeId {string} - 指定关闭弹出层的元素
     * shadowId {string} - 指定遮盖层元素
     * contentShowCenter {boolean} - 指定弹出层是否居中显示
     * shadowUseCss {boolean} - 指定遮盖层是否使用外部样式控制
     * beforeShow {func} - 弹出层弹出前执行的函数
     * afterShow {func} - 弹出层弹出后执行的函数
     * beforeHide {func} - 弹出层隐藏前执行的函数
     * afterHide {func} - 弹出层隐藏后执行的函数
     * @private 
     */
    var _defaultConfigs = 
    {
        contentId:'',
        closeId:'',
        shadowId:'',
        contentShowCenter:true,
        shadowUseCss:false,
        beforeShow:function(){},
        afterShow:function(){},
        beforeHide:function(){},
        afterHide:function(){}
    };
    
    /**
     * 创建实例
     * @class
     * @constructor
     * @param {Object} cfg - 初始化Tab实例所需的配置参数
     */
    function Popup(cfg){
        var that = this;

        if(cfg){
            for(var p in cfg){
                _defaultConfigs[p] = cfg[p];
            }
        }
        for(var p in _defaultConfigs){
            that[p] = cfg[p];
        }
        
        that._init();
    };
    /**
     * 绑定事件兼容性处理
     * @staticclass
     */
    var EventCompatibility = function()
    {
        var _events = 
        {
            bind:function(sender, eventName, fn, useCapture)
            {
                if(sender.addEventListener)
                    sender.addEventListener(eventName, fn, useCapture);
                else
                    sender.attachEvent('on' + eventName, fn);
            },
            unbind:function(sender,eventName,fn,useCapture)
            {
                if(sender.removeEventListener)
                    sender.removeEventListener(eventName, fn, useCapture);
                else
                    sender.detachEvent('on' + eventName, fn);
            }
        }
        
        return _events;
    }();
    /**
     * 绑定隐藏事件
     * @function
     * @param {HTMLElement} sender - 指定要绑定隐藏事件的元素
     * @param {json} eventargs - 指定传入的参数，eventargs.target 表示当前的UXPopup对象 
     */
    var BindHideOperater = function(sender, eventargs)
    {
        EventCompatibility.bind(sender, 'click', function()
        {
            eventargs.target.hide();
        }, false);
    };
    /**
     * 判断是否为搜狗手机浏览器，做兼容处理
     * @function
     * @return [boolean]
     */
    var IsSogouMobile = function()
    {
        return navigator.userAgent.indexOf('SogouMobileBrowser') >= 0;
    }
    /**
     * 阻止页面滑动事件
     * @staticclass
     */
    var TouchOperater = function()
    {
        var startpos = {x:0,y:0}, endpos = {x:0,y:0};
        var touchStart = function(e)
        {
            //_$('#log').innerText = navigator.userAgent;
            if(IsSogouMobile() || e.touches.length > 1)
            {
                e.preventDefault();
                return;
            }
            
            startpos.x = e.touches[0].clientX;
            startpos.y = e.touches[0].clientY;
        };
        var touchMove = function(e)
        {
            endpos.x = e.touches[0].clientX;
            endpos.y = e.touches[0].clientY;
            
            if(Math.abs(startpos.x - endpos.x) > 5 || Math.abs(startpos.y - endpos.y) > 5)
            {
                e.preventDefault();
            }
        }
        var touchEnd = function(e)
        {
            
        }
        var touchCancel = function(e)
        {
            
        }
        var _Touch =
        {
            unallowScroll:function()
            {
                EventCompatibility.bind(document,'touchstart', touchStart, false);
                EventCompatibility.bind(document,'touchmove', touchMove, false);
                EventCompatibility.bind(document,'touchend', touchEnd, false);
                EventCompatibility.bind(document,'touchcancel', touchCancel, false);
                
                _$('html').style.overflow = 'hidden';
                _$('body').style.overflow = 'hidden';
            },
            allowScroll:function()
            {
                EventCompatibility.unbind(document,'touchstart', touchStart, false);
                EventCompatibility.unbind(document,'touchmove', touchMove, false);
                EventCompatibility.unbind(document,'touchend', touchEnd, false);
                EventCompatibility.unbind(document,'touchcancel', touchCancel, false);
                
                _$('html').style.overflow = '';
                _$('body').style.overflow = '';
            }
        };
        return _Touch;
    }();
    /**
     * 设置遮罩层透明度
     * @private 
     */
    function setOpacity(obj, opacity)
    {
        if(opacity >= 1)
            opacity = opacity / 100;
        try
        {
            obj.style.opacity = opacity;
        }
        catch(e){ }
        try
        {
            obj.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
        }catch(e){}
    }
    /**
     * 计算页面高度
     * @private 
     */
    function calcTotalHeight()
    {
        //var wh = window.screen.height,bh = document.body.clientHeight;
        //return ((bh - wh > 0 ? bh : wh) + 'px');
        return (document.body.scrollHeight + 'px');
    }
    /**
     * 计算居中高度
     * @private 
     */
    function calcCurrentHeight(obj)
    {
        var oh = obj.offsetHeight;
        var sh = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        var ch = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        
        return ((sh + (ch - oh) / 2) + 'px');
    }
    /**
     * 计算居中宽度
     * @private 
     */
    function calcCurrentWidth(obj)
    {
        var ow = obj.offsetWidth;
        var sh = document.body.scrollLeft;
        var ch = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        
        return ((sh + (ch - ow) / 2) + 'px');
    }
    /**
     * 内部多元素选择器
     * @private 
     */
    function _$arr(where)
    {
        var arr = document.querySelectorAll(where);
        
        var _op = 
        {
            addEventListener:function(eventName,fn,useCapture)
            {
                for(var i = 0;i < arr.length;i++)
                {
                    EventCompatibility.bind(arr[i], eventName, fn, useCapture);
                }
            },
            removeEventListener:function(eventName,fn,useCapture)
            {
                for(var i = 0;i < arr.length;i++)
                {
                    EventCompatibility.unbind(arr[i], eventName, fn, useCapture);
                }
            }
        };
        
        return _op;
    }
    /**
     * 内部选择器
     * @private 
     */
    function _$(where)
    {
        var arr = document.querySelectorAll(where);
        if(!arr || arr.length <= 0)
            return null;
        // if(arr.length === 1)
            // return arr[0];
        return arr[0];
    }
    Popup.prototype = {
        constructor: Popup,
        isInit:false,
        /**
         * 对组件进行初始化
         * @private 
         */
        _init: function()
        {
            var that = this;
            
            try
            {
                that.content = _$(that.contentId);
                BindHideOperater(_$arr(that.closeId),{target:that});
                that._getShadow();
                that.isInit = true;
            }
            catch(e){ }
        },
        /**
         * 获取遮罩层
         * @private 
         */
        _getShadow:function()
        {
            var that = this;
            var shadow = _$(that.shadowId);
            if(!shadow)
            {
                shadow = document.createElement('div');
                _$('body').appendChild(shadow);
            }
            BindHideOperater(shadow,{target:that});
            that.shadow = shadow;
        },
        /**
         * 显示遮罩层
         * @private 
         */
        _showShadow:function()
        {
            var that = this;
            that.shadow.style.display = 'block';
            that.shadow.style.visibility = 'visible';
            if(that.shadowUseCss) return;
            that.shadow.style.position = 'absolute';
            that.shadow.style.left = 0;
            that.shadow.style.top = 0;
            that.shadow.style.width = '100%';
            that.shadow.style.zIndex = '1';
            that.shadow.style.backgroundColor = '#000';
            that.shadow.style.height = calcTotalHeight();
            setOpacity(that.shadow, 50);
        },
        /**
         * 显示内容层
         * @private 
         */
        _showContent:function()
        {
            var that = this;
            that.content.style.display = 'block';
            that.content.style.visibility = 'visible';
            //that.content.style.zIndex = parseInt(that.shadow.style.zIndex) + 1;
            if(that.contentShowCenter)
            {
                that.content.style.position = 'absolute';
                that.content.style.top = calcCurrentHeight(that.content);
                that.content.style.left = calcCurrentWidth(that.content);
                // that.content.style.left = '50%';
                // that.content.style.margin = '0 0 0 ' + (that.content.offsetWidth / 2 * -1) + 'px';
            }
        },
        /**
         * 显示弹出层
         * @public 
         */
        show: function()
        {
            var that = this;
            if(!that.isInit) return;
            if(that.beforeShow)
                that.beforeShow();
            
            TouchOperater.unallowScroll();
            that._showShadow();
            that._showContent();
            
            if(that.afterShow)
                that.afterShow();
        },
        /**
         * 隐藏
         * @public
         */
        hide:function()
        {
            var that = this;
            if(!that.isInit) return;
            if(that.beforeHide)
                that.beforeHide();
            
            TouchOperater.allowScroll();
            that.shadow.style.display = 'none';
            that.content.style.display = 'none';
            
            if(that.afterHide)
                that.afterHide();
        }
    };

    window.UXPopup = Popup;
})(window);
// AMD exports
if(typeof(module) !== 'undefined'){
    module.exports = window.UXPopup;
}else if (typeof define === 'function' && define.amd){
    define([], function () {
        'use strict';
        return window.UXPopup;
    });
}
//# sourceMappingURL=maps/popup.js.map