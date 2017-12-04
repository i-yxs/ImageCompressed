/*
    图片压缩封装
    作者：yxs
    项目地址：https://github.com/qq597392321/ImageCompressed
*/
(function (window) {
    'use strict'
    //是否PC端设备
    var isPcDevices = (function () {
        var ua = navigator.userAgent;
        var agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
        for (var v = 0; v < agents.length; v++) {
            if (ua.indexOf(agents[v]) > 0) {
                return false;
            }
        }
        return true;
    })();
    /*
        解决安卓机上input file的accept!="image/*"时，不触发onchange事件
        但是在PC上input file设置accept="image/*"时，响应又非常慢
        所以需要判断是移动端还是PC端
        使用方法：在input file上使用自定义属性imagecompressed
    */
    [].forEach.call(document.querySelectorAll('input[type=file][imagecompressed]'), function (item) {
        if (isPcDevices) {
            item.setAttribute('accept', 'image/gif,image/jpeg,image/png');
        } else {
            item.setAttribute('accept', 'image/*');
        }
    });
    //常用功能
    var oftenFunc = {
        //判断指定对象的数据类型(指定对象，类型名称(可选，如果为空，则返回指定对象的类型字符串))
        isType: function (obj, name) {
            var toString = Object.prototype.toString.call(obj).toLowerCase();
            if (name === undefined) {
                return /^\[object (\w+)\]$/.exec(toString)[1];
            } else {
                return toString === '[object ' + name.toLowerCase() + ']';
            }
        },
        //indexOf增强版，可以指定多级属性(指定数组对象，指定需要匹配的值，链式调用路径)
        indexOf2: function (_this, value, tier) {
            var i, z;
            var tier = (tier && tier.split('.')) || [];
            var length = (tier && tier.length) || 0;
            var errorsign = [];
            var temporary = null;
            for (var i = 0; i < _this.length; i++) {
                temporary = _this[i];
                for (var z = 0; z < length; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary !== errorsign &&
                    temporary === value) {
                    return i;
                }
            }
            return -1;
        },
        //对象克隆(指定对象)
        clone: function (_this) {
            var obj = null;
            switch (oftenFunc.isType(_this)) {
                case 'array':
                    obj = [];
                    _this.forEach(function (item, i) {
                        obj[i] = oftenFunc.clone(item);
                    });
                    break;
                case 'object':
                    obj = {};
                    Object.keys(_this).forEach(function (name) {
                        obj[name] = oftenFunc.clone(_this[name]);
                    });
                    break;
                default: return _this;
            }
            return obj;
        },
        //数组去重(指定对象，链式调用路径(可选，如果不为空，则只判断该链式路径下的值))
        unique: function (_this, tier) {
            var i, z;
            var len1 = _this.length;
            var tier = (tier && tier.split('.')) || [];
            var len2 = (tier && tier.length) || 0;
            var newdata = [];
            var valuelist = [];
            var errorsign = [];
            var temporary = null;
            for (i = 0; i < len1; i++) {
                var temporary = _this[i];
                for (z = 0; z < len2; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary === errorsign) {
                    newdata.push(_this[i]);
                } else if (valuelist.indexOf(temporary) === -1) {
                    newdata.push(_this[i]);
                    valuelist.push(temporary);
                }
            }
            return newdata;
        },
        //绑定上下文(指定对象，指定上下文对象)
        bindContext: function (obj, context) {
            var type = oftenFunc.isType(obj);
            if (type === 'object' || type === 'function') {
                Object.keys(obj).forEach(function (name) {
                    switch (oftenFunc.isType(obj[name])) {
                        case 'function':
                            obj[name] = obj[name].bind(context);
                            break;
                        case 'object':
                            oftenFunc.bindContext(obj[name], context);
                            break;
                    }
                });
            }
        },
        //对象继承(指定继承对象，指定继承自对象，当继承对象已存在属性，是否用新的值覆盖旧的值(可选，默认false))
        extend: function (target, obj, isrep) {
            Object.keys(obj).forEach(function (name) {
                if (target[name] !== undefined && !isrep) return;
                target[name] = obj[name];
            });
        }
    };
    /*
        事件推送
    */
    var EventPush = {
        //自定义数据key名
        keyName: '__CustomData' + Date.now() + '__',
        //注册
        register: function (obj) {
            var s = this;
            if (obj[s.keyName] === undefined) {
                obj[s.keyName] = {};
                obj['dispatchEvent'] = s.dispatchEvent.bind(obj);
                obj['addEvent'] = obj['on'] = s.addEvent.bind(obj);
                obj['removeEvent'] = obj['off'] = s.removeEvent.bind(obj);
                obj['emptyEvent'] = s.emptyEvent.bind(obj);
            }
        },
        //取消注册
        destroy: function (obj) {
            var names = ['on', 'off', 'dispatchEvent', 'addEvent', 'removeEvent', 'emptyEvent'];
            names.forEach(function (name) {
                delete obj[name];
            });
        },
        //派送事件
        dispatchEvent: function (type, data) {
            var s = this;
            type = type.toLowerCase();
            if (s[EventPush.keyName] !== undefined) {
                var list = s[EventPush.keyName][type];
                list && list.forEach(function (item) {
                    item.call(s, data);
                });
                var humpName = 'on' + type[0].toUpperCase() + type.substring(1);
                if (Object.prototype.toString.call(s[humpName]).toLowerCase() === '[object function]') {
                    s[humpName].call(s, data);
                }
            }
        },
        //添加事件
        addEvent: function (type, callback) {
            var s = this;
            type = type.toLowerCase();
            (s[EventPush.keyName][type] = s[EventPush.keyName][type] || []).push(callback);
        },
        //删除事件
        removeEvent: function (type, callback) {
            var s = this;
            type = type.toLowerCase();
            var list = s[EventPush.keyName][type];
            if (list) {
                var index = list.indexOf(callback);
                if (i > -1) {
                    list.splice(i, 1);
                }
            }
        },
        //清空事件
        emptyEvent: function () {
            var s = this;
            s[EventPush.keyName] = {};
        }
    };
    /*
        FormData兼容类，兼容不支持formdata上传blob的android机
    */
    function FormDataShim() {
        console.warn('using formdata shim');
        var o = this,
            parts = [],
            boundary = Array(21).join('-') + (+new Date() * (1e16 * Math.random())).toString(36),
            oldSend = XMLHttpRequest.prototype.send;
        this.append = function (name, value, filename) {
            parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"');
            if (value instanceof Blob) {
                parts.push('; filename="' + (filename || 'blob') + '"\r\nContent-Type: ' + value.type + '\r\n\r\n');
                parts.push(value);
            }
            else {
                parts.push('\r\n\r\n' + value);
            }
            parts.push('\r\n');
        };
        // Override XHR send()
        XMLHttpRequest.prototype.send = function (val) {
            var fr,
                data,
                oXHR = this;
            if (val === o) {
                // Append the final boundary string
                parts.push('--' + boundary + '--\r\n');
                // Create the blob
                data = getBlob(parts);
                // Set up and read the blob into an array to be sent
                fr = new FileReader();
                fr.onload = function () {
                    oldSend.call(oXHR, fr.result);
                };
                fr.onerror = function (err) {
                    throw err;
                };
                fr.readAsArrayBuffer(data);
                // Set the multipart content type and boudary
                this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
                XMLHttpRequest.prototype.send = oldSend;
            }
            else {
                oldSend.call(this, val);
            }
        };
    }
    /*
        图片文件对象
    */
    function ImageFile(option) {
        var s = this;
        //注册监听器
        EventPush.register(s);
        //文件对象
        s.file = null;
        //文件名
        s.name = null;
        //文件类型
        s.type = null;
        //文件大小
        s.size = null;
        //处理前大小
        s.beforeSize = null;
        //处理后大小
        s.afterSize = null;
        //base64格式数据
        s.base64 = null;
        //二进制格式数据
        s.binary = null;
        //image对象
        s.imageData = null;
        //应用选项
        Object.keys(option).forEach(function (name) {
            if (name in s) {
                s[name] = option[name];
            }
        });
    };
    /*
        图片压缩封装
    */
    function ImageCompressed(option) {
        var s = ImageCompressed;
        option = option || s.defaultOption;
        //压缩开始时
        s.dispatchEvent('prepare');
        //应用选项
        Object.keys(s.defaultOption).forEach(function (name) {
            if (name in option) {
                s.currentOption[name] = option[name];
            } else {
                s.currentOption[name] = s.defaultOption[name];
            }
        });
        //筛选图片列表
        s.filtrateImage();
    };
    //注册监听器
    EventPush.register(ImageCompressed);
    //添加属性和方法
    oftenFunc.extend(ImageCompressed, {
        //当前事件目标
        currentTarget: null,
        //当前选项数据
        currentOption: {},
        //默认选项
        defaultOption: {
            //指定压缩后输出格式(默认原始格式)
            outputFormat: null,
            //指定图片大小大于该参数时才进行压缩操作
            floorSize: 0,
            //指定图片的压缩比例(0-1)
            compressedRatio: .5,
            //可选图片格式
            limitedFormat: 'jpeg|png|gif',
            //指定当png转jpg时，透明区域的颜色
            backgroundColor: '#fff'
        },
        //元素缓存
        elementCache: {
            //压缩画布
            compressedCanvas: document.createElement('canvas'),
            //瓦片画布
            tileCanvas: document.createElement('canvas')
        },
        //加载FileReader
        loadFile: function (file, callback) {
            var reader = new FileReader();
            reader.onload = function () {
                this.onload = null;
                callback && callback(this.result);
            };
            reader.readAsDataURL(file);
        },
        //加载Image
        loadImage: function (src, callback) {
            var img = new Image();
            img.onload = function () {
                this.onload = this.onerror = null;
                callback && callback(this, 1);
            };
            img.onerror = function () {
                this.onload = this.onerror = null;
                callback && callback(this, 0);
            };
            img.src = src;
        },
        //筛选图片列表
        filtrateImage: function () {
            var s = this;
            var tar = event && event.currentTarget;
            if (tar &&
                tar.nodeType === 1 &&
                tar.nodeName === 'INPUT' &&
                tar.getAttribute('type').toLowerCase() === 'file') {
                //获取选择控件选择的图片文件
                var files = [];
                Array.prototype.slice.call(tar.files).forEach(function (item) {
                    if (new RegExp('(' + s.currentOption.limitedFormat + ')', 'i').test(item.type)) {
                        files.push(item);
                    };
                });
                //图片文件对象列表
                var fileList = [];
                files.forEach(function (item) {
                    var imf = new ImageFile({
                        file: item,
                        name: item.name,
                        size: item.size,
                        type: item.type,
                        beforeSize: item.size
                    });
                    fileList.push(imf);
                });
                s.currentTarget = tar;
                s.currentTarget.value = '';
                s.disposeEntry(fileList);
            }
        },
        //压缩处理入口
        disposeEntry: function (list) {
            var s = this;
            var index = 0;
            var length = list.length;
            //开始压缩时
            s.dispatchEvent('start', list);
            //延后40ms处理，不至于造成浏览器渲染卡死
            setTimeout(function () {
                //遍历列表
                list.forEach(function (item) {
                    s.loadFile(item.file, function (data) {
                        item.base64 = data;
                        s.loadImage(item.base64, function (data) {
                            item.imageData = data;
                            //只有当文件大小大于floorSize时才执行压缩操作
                            if (item.size > s.currentOption.floorSize) {
                                item.base64 = s.compressed(item);
                                item.binary = s.base64toBinary(item.base64, item.type);
                                item.imageData.src = item.base64;
                            }
                            item.size = item.afterSize = item.base64.length;
                            //单个ImageFile处理完成时
                            item.dispatchEvent('end');
                            //判断是否处理完所有图片
                            if (++index === length) {
                                //列表全部压缩完成时
                                s.dispatchEvent('end', list);
                            }
                        });
                    });
                });
            }, 40);
        },
        //图片压缩
        compressed: function (imf) {
            var s = this;
            var width = imf.imageData.width;
            var height = imf.imageData.height;
            //如果图片大于四百万像素，计算压缩比并将大小压至400万以下
            var ratio = width * height / 4000000;
            if (ratio > 1) {
                ratio = Math.sqrt(ratio);
                width /= ratio;
                height /= ratio;
            } else {
                ratio = 1;
            }
            s.elementCache.compressedCanvas.width = width;
            s.elementCache.compressedCanvas.height = height;
            //如果原始格式与输出格式不同，绘制底色
            var outputFormat = s.currentOption.outputFormat || imf.type;
            if (outputFormat !== imf.type) {
                s.elementCache.compressedContext.fillStyle = s.currentOption.backgroundColor;
                s.elementCache.compressedContext.fillRect(0, 0, width, height);
            }
            //如果图片像素大于100万则使用瓦片绘制
            var count = width * height / 1000000;
            if (count > 1) {
                //计算要分成多少块瓦片
                count = ~~(Math.sqrt(count) + 1);
                //计算每块瓦片的宽和高
                var nw = ~~(width / count);
                var nh = ~~(height / count);
                s.elementCache.tileCanvas.width = nw;
                s.elementCache.tileCanvas.height = nh;
                for (var i = 0; i < count; i++) {
                    for (var j = 0; j < count; j++) {
                        s.elementCache.tileContext.drawImage(imf.imageData, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                        s.elementCache.compressedContext.drawImage(s.elementCache.tileCanvas, i * nw, j * nh, nw, nh);
                    }
                }
            } else {
                s.elementCache.compressedContext.drawImage(imf.imageData, 0, 0, width, height);
            }
            //压缩并输出base64数据
            var ndata = s.elementCache.compressedCanvas.toDataURL(outputFormat, s.currentOption.compressedRatio);
            s.elementCache.compressedCanvas.width = s.elementCache.compressedCanvas.height = s.elementCache.tileCanvas.width = s.elementCache.tileCanvas.height = 0;
            return ndata;
        },
        //base64转二进制
        base64toBinary: function (basestr, type) {
            var s = this;
            var text = window.atob(basestr.split(',')[1]);
            var buffer = new Uint8Array(text.length);
            var pecent = 0, loop = null;
            for (var i = 0; i < text.length; i++) {
                buffer[i] = text.charCodeAt(i);
            }
            return s.getBlob([buffer], type);
        },
        //获取blob对象的兼容性写法
        getBlob: function (buffer, format) {
            try {
                return new Blob(buffer, { type: format });
            } catch (e) {
                var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
                buffer.forEach(function (buf) {
                    bb.append(buf);
                });
                return bb.getBlob(format);
            }
        },
        //使用ajax上传封装
        uploading: {
            //XMLHttpRequest对象缓存
            _xhrCache: null,
            //默认选项
            defaultOption: {
                //请求地址
                url: '',
                //请求方式
                type: 'post',
                //请求超时时长，默认30s
                timeout: 30000,
                //请求数据，单个参数为一个数组(下标0为参数名，1为值，2为文件名称)
                data: [],
                //请求成功时
                onsuccess: null,
                //请求错误时
                onerror: function () {
                    console.log('网络异常！');
                },
                //请求失败时
                onfailed: function (code) {
                    console.log(code + '，请求失败！');
                },
                //请求超时时
                ontimeout: function () {
                    console.log('请求超时！');
                },
                //上传进度改变时
                onprogress: null
            },
            //请求数据
            request: function (option) {
                if (!option) return;
                var s = this;
                var currentOption = {};
                //过滤选项
                Object.keys(s.defaultOption).forEach(function (name) {
                    if (name in option) {
                        currentOption[name] = option[name];
                    } else {
                        currentOption[name] = s.defaultOption[name];
                    }
                });
                var formdata = s.getFormData();
                currentOption.data.forEach(function (item) {
                    formdata.append.apply(formdata, item);
                });
                //提交
                s._xhrCache = new XMLHttpRequest();
                s._xhrCache.timeout = currentOption.timeout;
                s._xhrCache.open(currentOption.type, currentOption.url);
                s._xhrCache.onerror = function (e) {
                    currentOption.onerror && currentOption.onerror(e);
                    s._xhrCache = null;
                };
                s._xhrCache.ontimeout = function (e) {
                    currentOption.ontimeout && currentOption.ontimeout(e);
                    s._xhrCache.abort();
                    s._xhrCache = null;
                };
                s._xhrCache.onreadystatechange = function (e) {
                    if (s._xhrCache.readyState == 4) {
                        if (s._xhrCache.status === 200) {
                            var data = s._xhrCache.responseText;
                            try { data = JSON.parse(data) } catch (e) { };
                            currentOption.onsuccess && currentOption.onsuccess(data);
                        } else {
                            currentOption.onfailed && currentOption.onfailed(s._xhrCache.status, s._xhrCache.responseText);
                        }
                        s._xhrCache = null;
                    }
                };
                s._xhrCache.upload.onprogress = currentOption.onprogress;
                s._xhrCache.send(formdata);
            },
            //终止请求
            abort: function () {
                var s = this;
                s._xhrCache && s._xhrCache.abort();
            },
            //获取formdata
            getFormData: function () {
                var isNeedShim = ~navigator.userAgent.indexOf('Android')
                    && ~navigator.vendor.indexOf('Google')
                    && !~navigator.userAgent.indexOf('Chrome')
                    && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;
                return isNeedShim ? new FormDataShim() : new FormData()
            }
        },
    }, true);
    ImageCompressed.elementCache.compressedContext = ImageCompressed.elementCache.compressedCanvas.getContext('2d');
    ImageCompressed.elementCache.tileContext = ImageCompressed.elementCache.tileCanvas.getContext('2d');
    //开放入口
    window.ImageCompressed = ImageCompressed;
})(window);