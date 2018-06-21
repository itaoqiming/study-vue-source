var slice = [].slice

function Emitter (ctx) {
    this._ctx = ctx || this
}

var EmitterProto = Emitter.prototype
// _cbs 对象+数组存了事件返回函数{"click":[]}
EmitterProto.on = function (event, fn) {
    this._cbs = this._cbs || {}
    ;(this._cbs[event] = this._cbs[event] || [])
        .push(fn)
    return this
}

EmitterProto.once = function (event, fn) {
    var self = this
    this._cbs = this._cbs || {}

    function on () {
        self.off(event, on)
        fn.apply(this, arguments) //这个this 有点问题啊
    }

    on.fn = fn
    this.on(event, on)
    return this
}

EmitterProto.off = function (event, fn) {
    this._cbs = this._cbs || {}

    // all 不传参 删除所有事件 有点绝哦
    if (!arguments.length) {
        this._cbs = {}
        return this
    }

    // specific event 库里没有对应事件 就什么也不执行
    var callbacks = this._cbs[event]
    if (!callbacks) return this

    // remove all handlers 1参数 删除对应事件组
    if (arguments.length === 1) {
        delete this._cbs[event]
        return this
    }

    // remove specific handler 2参数 删除对应事件组里对应返回函数
    var cb
    for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i]
        if (cb === fn || cb.fn === fn) {
            callbacks.splice(i, 1)
            break
        }
    }
    return this
}

/**
 *  The internal, faster emit with fixed amount of arguments
 *  using Function.call
 */
EmitterProto.emit = function (event, a, b, c) {
    this._cbs = this._cbs || {}
    var callbacks = this._cbs[event]

    if (callbacks) {

        callbacks = callbacks.slice(0)//这个有点精髓,是浅拷贝，为什么不直接用那个返回函数数组呢？-->
        // --< 我揣测主要原因是 
        // 假如遍历this._cbs[event]数组时，如果其中带有解绑事件的代码，会使原始的this._cbs[event]数组改变，
        // 影响直观的是数组长度，会引起后续遍历代码报错，所以浅拷贝下会避免错误。
        // e.g. 
        // var a = [function(){console.log(1)},function(){console.log(2)}];
        // var b = a.slice(0);
        // a.splice(0,1); 
        //此时各自的值 a:[function(){console.log(2)}] b:[function(){console.log(1)},function(){console.log(2)}]
        // 可见浅拷贝 有这样的好处，删除原始a里的引用，不影响拷贝b的引用值，那么下面的遍历不会报错了
        // 当然改变原始引用的局部属性，会影响拷贝的引用，不过这里emitter.js没有那方面操作，可以忽略
        // 
        // 
        // 
        // 综上所述 但逻辑上会产生一个矛盾的情况
        // 假如注册了 一堆事件 emiterInstance.on("click",...);
        // 第一个事件 是function(){emiterInstance.off("click")}
        // 按代码逻辑 
        // 触发click事件时，既便第一个执行函数是清除所有事件，但这一轮是无效的，后续的click事件依然会执行
        // 有点不合理
        for (var i = 0, len = callbacks.length; i < len; i++) {
            callbacks[i].call(this._ctx, a, b, c)
        }
    }

    return this
}

/**
 *  The external emit using Function.apply
 */
EmitterProto.applyEmit = function (event) {
    this._cbs = this._cbs || {}
    var callbacks = this._cbs[event], args

    if (callbacks) {
        callbacks = callbacks.slice(0)
        args = slice.call(arguments, 1) //arguments 类数组 [].slice.call({0:1,1:2,2:3,'length':3},0)
        for (var i = 0, len = callbacks.length; i < len; i++) {
            callbacks[i].apply(this._ctx, args)
        }
    }

    return this
}

module.exports = Emitter