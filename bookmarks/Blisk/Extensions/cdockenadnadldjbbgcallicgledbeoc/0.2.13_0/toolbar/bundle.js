const sugar = {
  on: function(names, fn) {
    names
      .split(' ')
      .forEach(name =>
        this.addEventListener(name, fn));
    return this
  },
  off: function(names, fn) {
    names
      .split(' ')
      .forEach(name =>
        this.removeEventListener(name, fn));
    return this
  },
  attr: function(attr, val) {
    if (val === undefined) return this.getAttribute(attr)

    val == null
      ? this.removeAttribute(attr)
      : this.setAttribute(attr, val || '');
      
    return this
  }
};

function $(query, $context = document) {
  let $nodes = query instanceof NodeList || Array.isArray(query)
    ? query
    : query instanceof HTMLElement || query instanceof SVGElement
      ? [query]
      : $context.querySelectorAll(query);

  if (!$nodes.length) $nodes = [];

  return Object.assign(
    [...$nodes].map($el => Object.assign($el, sugar)), 
    {
      on: function(names, fn) {
        this.forEach($el => $el.on(names, fn));
        return this
      },
      off: function(names, fn) {
        this.forEach($el => $el.off(names, fn));
        return this
      },
      attr: function(attrs, val) {
        if (typeof attrs === 'string' && val === undefined)
          return this[0].attr(attrs)

        else if (typeof attrs === 'object') 
          this.forEach($el =>
            Object.entries(attrs)
              .forEach(([key, val]) =>
                $el.attr(key, val)));

        else if (typeof attrs == 'string' && (val || val == null || val == ''))
          this.forEach($el => $el.attr(attrs, val));

        return this
      }
    }
  )
}

/*!
 * hotkeys-js v3.3.5
 * A simple micro-library for defining and dispatching keyboard shortcuts. It has no dependencies.
 * 
 * Copyright (c) 2018 kenny wong <wowohoo@qq.com>
 * http://jaywcjlove.github.io/hotkeys
 * 
 * Licensed under the MIT license.
 */

var isff = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().indexOf('firefox') > 0 : false;

// 绑定事件
function addEvent(object, event, method) {
  if (object.addEventListener) {
    object.addEventListener(event, method, false);
  } else if (object.attachEvent) {
    object.attachEvent('on' + event, function () {
      method(window.event);
    });
  }
}

// 修饰键转换成对应的键码
function getMods(modifier, key) {
  var mods = key.slice(0, key.length - 1);
  for (var i = 0; i < mods.length; i++) {
    mods[i] = modifier[mods[i].toLowerCase()];
  }return mods;
}

// 处理传的key字符串转换成数组
function getKeys(key) {
  if (!key) key = '';

  key = key.replace(/\s/g, ''); // 匹配任何空白字符,包括空格、制表符、换页符等等
  var keys = key.split(','); // 同时设置多个快捷键，以','分割
  var index = keys.lastIndexOf('');

  // 快捷键可能包含','，需特殊处理
  for (; index >= 0;) {
    keys[index - 1] += ',';
    keys.splice(index, 1);
    index = keys.lastIndexOf('');
  }

  return keys;
}

// 比较修饰键的数组
function compareArray(a1, a2) {
  var arr1 = a1.length >= a2.length ? a1 : a2;
  var arr2 = a1.length >= a2.length ? a2 : a1;
  var isIndex = true;

  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) isIndex = false;
  }
  return isIndex;
}

var _keyMap = { // 特殊键
  backspace: 8,
  tab: 9,
  clear: 12,
  enter: 13,
  return: 13,
  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
  '⇪': 20,
  ',': 188,
  '.': 190,
  '/': 191,
  '`': 192,
  '-': isff ? 173 : 189,
  '=': isff ? 61 : 187,
  ';': isff ? 59 : 186,
  '\'': 222,
  '[': 219,
  ']': 221,
  '\\': 220
};

var _modifier = { // 修饰键
  '⇧': 16,
  shift: 16,
  '⌥': 18,
  alt: 18,
  option: 18,
  '⌃': 17,
  ctrl: 17,
  control: 17,
  '⌘': isff ? 224 : 91,
  cmd: isff ? 224 : 91,
  command: isff ? 224 : 91
};
var _downKeys = []; // 记录摁下的绑定键
var modifierMap = {
  16: 'shiftKey',
  18: 'altKey',
  17: 'ctrlKey'
};
var _mods = { 16: false, 18: false, 17: false };
var _handlers = {};

// F1~F12 特殊键
for (var k = 1; k < 20; k++) {
  _keyMap['f' + k] = 111 + k;
}

// 兼容Firefox处理
modifierMap[isff ? 224 : 91] = 'metaKey';
_mods[isff ? 224 : 91] = false;

var _scope = 'all'; // 默认热键范围
var isBindElement = false; // 是否绑定节点

// 返回键码
var code = function code(x) {
  return _keyMap[x.toLowerCase()] || x.toUpperCase().charCodeAt(0);
};

// 设置获取当前范围（默认为'所有'）
function setScope(scope) {
  _scope = scope || 'all';
}
// 获取当前范围
function getScope() {
  return _scope || 'all';
}
// 获取摁下绑定键的键值
function getPressedKeyCodes() {
  return _downKeys.slice(0);
}

// 表单控件控件判断 返回 Boolean
function filter(event) {
  var tagName = event.target.tagName || event.srcElement.tagName;
  // 忽略这些标签情况下快捷键无效
  return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
}

// 判断摁下的键是否为某个键，返回true或者false
function isPressed(keyCode) {
  if (typeof keyCode === 'string') {
    keyCode = code(keyCode); // 转换成键码
  }
  return _downKeys.indexOf(keyCode) !== -1;
}

// 循环删除handlers中的所有 scope(范围)
function deleteScope(scope, newScope) {
  var handlers = void 0;
  var i = void 0;

  // 没有指定scope，获取scope
  if (!scope) scope = getScope();

  for (var key in _handlers) {
    if (Object.prototype.hasOwnProperty.call(_handlers, key)) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length;) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);else i++;
      }
    }
  }

  // 如果scope被删除，将scope重置为all
  if (getScope() === scope) setScope(newScope || 'all');
}

// 清除修饰键
function clearModifier(event) {
  var key = event.keyCode || event.which || event.charCode;
  var i = _downKeys.indexOf(key);

  // 从列表中清除按压过的键
  if (i >= 0) _downKeys.splice(i, 1);

  // 修饰键 shiftKey altKey ctrlKey (command||metaKey) 清除
  if (key === 93 || key === 224) key = 91;
  if (key in _mods) {
    _mods[key] = false;

    // 将修饰键重置为false
    for (var k in _modifier) {
      if (_modifier[k] === key) hotkeys[k] = false;
    }
  }
}

// 解除绑定某个范围的快捷键
function unbind(key, scope) {
  var multipleKeys = getKeys(key);
  var keys = void 0;
  var mods = [];
  var obj = void 0;

  for (var i = 0; i < multipleKeys.length; i++) {
    // 将组合快捷键拆分为数组
    keys = multipleKeys[i].split('+');

    // 记录每个组合键中的修饰键的键码 返回数组
    if (keys.length > 1) mods = getMods(_modifier, keys);

    // 获取除修饰键外的键值key
    key = keys[keys.length - 1];
    key = key === '*' ? '*' : code(key);

    // 判断是否传入范围，没有就获取范围
    if (!scope) scope = getScope();

    // 如何key不在 _handlers 中返回不做处理
    if (!_handlers[key]) return;

    // 清空 handlers 中数据，
    // 让触发快捷键键之后没有事件执行到达解除快捷键绑定的目的
    for (var r = 0; r < _handlers[key].length; r++) {
      obj = _handlers[key][r];
      // 判断是否在范围内并且键值相同
      if (obj.scope === scope && compareArray(obj.mods, mods)) {
        _handlers[key][r] = {};
      }
    }
  }
}

// 对监听对应快捷键的回调函数进行处理
function eventHandler(event, handler, scope) {
  var modifiersMatch = void 0;

  // 看它是否在当前范围
  if (handler.scope === scope || handler.scope === 'all') {
    // 检查是否匹配修饰符（如果有返回true）
    modifiersMatch = handler.mods.length > 0;

    for (var y in _mods) {
      if (Object.prototype.hasOwnProperty.call(_mods, y)) {
        if (!_mods[y] && handler.mods.indexOf(+y) > -1 || _mods[y] && handler.mods.indexOf(+y) === -1) modifiersMatch = false;
      }
    }

    // 调用处理程序，如果是修饰键不做处理
    if (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91] || modifiersMatch || handler.shortcut === '*') {
      if (handler.method(event, handler) === false) {
        if (event.preventDefault) event.preventDefault();else event.returnValue = false;
        if (event.stopPropagation) event.stopPropagation();
        if (event.cancelBubble) event.cancelBubble = true;
      }
    }
  }
}

// 处理keydown事件
function dispatch(event) {
  var asterisk = _handlers['*'];
  var key = event.keyCode || event.which || event.charCode;

  // 搜集绑定的键
  if (_downKeys.indexOf(key) === -1) _downKeys.push(key);

  // Gecko(Firefox)的command键值224，在Webkit(Chrome)中保持一致
  // Webkit左右command键值不一样
  if (key === 93 || key === 224) key = 91;

  if (key in _mods) {
    _mods[key] = true;

    // 将特殊字符的key注册到 hotkeys 上
    for (var k in _modifier) {
      if (_modifier[k] === key) hotkeys[k] = true;
    }

    if (!asterisk) return;
  }

  // 将modifierMap里面的修饰键绑定到event中
  for (var e in _mods) {
    if (Object.prototype.hasOwnProperty.call(_mods, e)) {
      _mods[e] = event[modifierMap[e]];
    }
  }

  // 表单控件过滤 默认表单控件不触发快捷键
  if (!hotkeys.filter.call(this, event)) return;

  // 获取范围 默认为all
  var scope = getScope();

  // 对任何快捷键都需要做的处理
  if (asterisk) {
    for (var i = 0; i < asterisk.length; i++) {
      if (asterisk[i].scope === scope) eventHandler(event, asterisk[i], scope);
    }
  }
  // key 不在_handlers中返回
  if (!(key in _handlers)) return;

  for (var _i = 0; _i < _handlers[key].length; _i++) {
    // 找到处理内容
    eventHandler(event, _handlers[key][_i], scope);
  }
}

function hotkeys(key, option, method) {
  var keys = getKeys(key); // 需要处理的快捷键列表
  var mods = [];
  var scope = 'all'; // scope默认为all，所有范围都有效
  var element = document; // 快捷键事件绑定节点
  var i = 0;

  // 对为设定范围的判断
  if (method === undefined && typeof option === 'function') {
    method = option;
  }

  if (Object.prototype.toString.call(option) === '[object Object]') {
    if (option.scope) scope = option.scope; // eslint-disable-line
    if (option.element) element = option.element; // eslint-disable-line
  }

  if (typeof option === 'string') scope = option;

  // 对于每个快捷键进行处理
  for (; i < keys.length; i++) {
    key = keys[i].split('+'); // 按键列表
    mods = [];

    // 如果是组合快捷键取得组合快捷键
    if (key.length > 1) mods = getMods(_modifier, key);

    // 将非修饰键转化为键码
    key = key[key.length - 1];
    key = key === '*' ? '*' : code(key); // *表示匹配所有快捷键

    // 判断key是否在_handlers中，不在就赋一个空数组
    if (!(key in _handlers)) _handlers[key] = [];

    _handlers[key].push({
      scope: scope,
      mods: mods,
      shortcut: keys[i],
      method: method,
      key: keys[i]
    });
  }
  // 在全局document上设置快捷键
  if (typeof element !== 'undefined' && !isBindElement) {
    isBindElement = true;
    addEvent(element, 'keydown', function (e) {
      dispatch(e);
    });
    addEvent(element, 'keyup', function (e) {
      clearModifier(e);
    });
  }
}

var _api = {
  setScope: setScope,
  getScope: getScope,
  deleteScope: deleteScope,
  getPressedKeyCodes: getPressedKeyCodes,
  isPressed: isPressed,
  filter: filter,
  unbind: unbind
};
for (var a in _api) {
  if (Object.prototype.hasOwnProperty.call(_api, a)) {
    hotkeys[a] = _api[a];
  }
}

if (typeof window !== 'undefined') {
  var _hotkeys = window.hotkeys;
  hotkeys.noConflict = function (deep) {
    if (deep && window.hotkeys === hotkeys) {
      window.hotkeys = _hotkeys;
    }
    return hotkeys;
  };
  window.hotkeys = hotkeys;
}

var css = ":host {\n  --theme-bg: hsl(0,0%,100%);\n  --theme-color: hotpink;\n  --theme-blue: hsl(188, 90%, 45%);\n  --theme-purple: hsl(267, 100%, 58%);\n  --theme-icon_color: hsl(0,0%,20%);\n  --theme-icon_hover-bg: hsl(0,0%,95%);\n}\n\n:host {\n  position: fixed;\n  top: 0;\n  left: 0;\n  z-index: 2147483646;\n  max-width: -webkit-min-content;\n  max-width: -moz-min-content;\n  max-width: min-content;\n  font-size: 16px;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;\n}\n\n:host > ol {\n  display: flex;\n  flex-direction: column;\n  margin: 1em 0 0.5em 1em;\n  padding: 0;\n  list-style-type: none;\n  border-radius: 2em\n}\n\n:host > ol:not([colors]) {\n    box-shadow: 0 0.25em 0.5em hsla(0,0%,0%,10%);\n    background: var(--theme-bg);\n  }\n\n:host li {\n  height: 2.25em;\n  width: 2.25em;\n  margin: 0.05em 0.25em;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n  border-radius: 50%\n}\n\n:host li:first-child { margin-top: 0.25em; }\n\n:host li:last-child { margin-bottom: 0.25em; }\n\n:host li[data-tool]:hover {\n      cursor: pointer;\n      background-color: var(--theme-icon_hover-bg);\n    }\n\n:host li[data-tool]:active {\n      background-color: hsl(0,0%,90%);\n    }\n\n:host li[data-active=true] > svg:not(.icon-cursor) {\n    fill: var(--theme-color);\n  }\n\n:host li[data-active=true] > .icon-cursor {\n    stroke: var(--theme-color);\n  }\n\n@media (max-height: 768px) {\n    :host li:nth-of-type(10) > aside, :host li:nth-of-type(11) > aside, :host li:nth-of-type(12) > aside, :host li:nth-of-type(13) > aside {\n      top: auto;\n    }\n  }\n\n:host li > aside {\n    overflow: hidden;\n    position: absolute;\n    direction: ltr;\n    text-align: left;\n    left: 3em;\n    top: 0;\n    z-index: -2;\n    pointer-events: none;\n    background: white;\n    color: hsl(0,0%,30%);\n    box-shadow: 0 0.1em 4.5em hsla(0,0%,0%,15%);\n    border-radius: 1em;\n\n    transition: opacity 0.3s ease, -webkit-transform 0.2s ease;\n\n    transition: opacity 0.3s ease, transform 0.2s ease;\n\n    transition: opacity 0.3s ease, transform 0.2s ease, -webkit-transform 0.2s ease;\n    opacity: 0;\n    -webkit-transform: translateX(-1em);\n            transform: translateX(-1em);\n    will-change: transform, opacity\n  }\n\n:host li > aside > figure {\n      margin: 0;\n      display: grid;\n    }\n\n:host li > aside figcaption {\n      padding: 1em;\n      display: grid;\n      grid-gap: 0.5em\n    }\n\n:host li > aside figcaption > h2, :host li > aside figcaption > p {\n        margin: 0;\n      }\n\n:host li > aside figcaption > h2 {\n        font-size: 1.5em;\n        line-height: 1.1;\n        margin-bottom: 0.5em;\n        display: grid;\n        grid-auto-flow: column;\n        justify-content: space-between;\n        align-items: center;\n      }\n\n:host li > aside figcaption > p {\n        font-size: 1em;\n        line-height: 1.5;\n        padding-right: 3em;\n      }\n\n:host li > aside figcaption [table] {\n        display: grid;\n        grid-gap: 0.5em\n      }\n\n:host li > aside figcaption [table] > div {\n          display: grid;\n          grid-auto-flow: column;\n          grid-template-columns: 1fr auto;\n          justify-content: space-between;\n        }\n\n:host li > aside [hotkey] {\n      border-radius: 5em;\n      height: 1.5em;\n      width: 1.5em;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      border: 1px solid var(--theme-color);\n      color: var(--theme-color);\n      font-weight: 300;\n      font-size: 0.5em;\n      text-transform: uppercase;\n    }\n\n:host li:hover:not([data-tool=\"search\"]) > aside,\n  :host li[data-tool=\"search\"] > svg:hover + aside {\n    opacity: 1;\n    -webkit-transform: translateX(0);\n            transform: translateX(0);\n    transition-delay: 0.75s;\n  }\n\n:host li input::-webkit-calendar-picker-indicator {\n    background: inherit;\n    color: var(--theme-color);\n  }\n\n:host [colors] {\n  margin-top: 0;\n}\n\n:host [colors] > li {\n  overflow: hidden;\n  border-radius: 50%;\n  box-shadow: 0 0.25em 0.5em hsla(0,0%,0%,10%);\n  background: var(--theme-bg);\n  margin-bottom: 0.5em\n}\n\n:host [colors] > li:first-child {\n    margin-top: 0;\n  }\n\n:host [colors] li:hover:after {\n  top: 0;\n}\n\n:host li > svg {\n  width: 50%;\n  fill: var(--theme-icon_color);\n}\n\n:host li > svg.icon-cursor {\n  width: 35%;\n  fill: white;\n  stroke: var(--theme-icon_color);\n  stroke-width: 2px;\n}\n\n:host li[data-tool=\"search\"][data-active=\"true\"]:before {\n    -webkit-transform: translateX(-1em);\n            transform: translateX(-1em);\n    opacity: 0;\n  }\n\n:host li[data-tool=\"search\"] > .search {\n  position: absolute;\n  left: calc(100% - 1.25em);\n  top: 0;\n  height: 100%;\n  z-index: -1;\n  box-shadow: 0 0.25em 0.5em hsla(0,0%,0%,10%);\n  border-radius: 0 2em 2em 0;\n  overflow: hidden;\n}\n\n:host li[data-tool=\"search\"] > .search > input {\n  direction: ltr;\n  border: none;\n  font-size: 1em;\n  padding: 0.4em 0.4em 0.4em 2em;\n  outline: none;\n  height: 100%;\n  width: 250px;\n  box-sizing: border-box;\n  caret-color: hotpink\n}\n\n:host li[data-tool=\"search\"] > .search > input::-webkit-input-placeholder {\n    font-weight: lighter;\n    font-size: 0.8em;\n  }\n\n:host li[data-tool=\"search\"] > .search > input::-ms-input-placeholder {\n    font-weight: lighter;\n    font-size: 0.8em;\n  }\n\n:host li[data-tool=\"search\"] > .search > input::placeholder {\n    font-weight: lighter;\n    font-size: 0.8em;\n  }\n\n:host [colors] > li > svg {\n  position: relative;\n  top: -2px;\n}\n\n:host [colors] > li > svg > rect:last-child {\n  stroke: hsla(0,0%,0%,20%);\n  stroke-width: 0.5px;\n}\n\n:host input[type='color'] {\n  opacity: 0.01;\n  position: absolute;\n  top: 0; left: 0;\n  width: 100%; height: 100%;\n  z-index: 1;\n  box-sizing: border-box;\n  border: white;\n  padding: 0;\n  cursor: pointer;\n}\n\n:host input[type='color']:focus {\n  outline: none;\n}\n\n:host input[type='color']::-webkit-color-swatch-wrapper {\n  padding: 0;\n}\n\n:host input[type='color']::-webkit-color-swatch {\n  border: none;\n}\n\n:host input[type='color'][value='']::-webkit-color-swatch {\n  background-color: transparent !important;\n  background-image: linear-gradient(155deg, #ffffff 0%,#ffffff 46%,#ff0000 46%,#ff0000 54%,#ffffff 55%,#ffffff 100%);\n}\n";

class Handles extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    window.addEventListener('resize', this.on_resize.bind(this));
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.on_resize);
  }

  on_resize() {
    window.requestAnimationFrame(() => {
      const node_label_id = this.$shadow.host.getAttribute('data-label-id');
      const [source_el] = $(`[data-label-id="${node_label_id}"]`);

      if (!source_el) return

      this.position = {
        node_label_id,
        el: source_el,
      };
    });
  }

  set position({el, node_label_id}) {
    this.$shadow.innerHTML = this.render(el.getBoundingClientRect(), node_label_id);

    if (this._backdrop) {
      this.backdrop = {
        element: this._backdrop.update(el),
        update:  this._backdrop.update,
      };
    }
  }

  set backdrop(bd) {
    this._backdrop = bd;

    const cur_child = this.$shadow.querySelector('visbug-boxmodel');

    cur_child
      ? this.$shadow.replaceChild(bd.element, cur_child)
      : this.$shadow.appendChild(bd.element);
  }

  render({ x, y, width, height, top, left }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id);
    
    return `
      ${this.styles({top,left})}
      <svg
        class="visbug-handles"
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect stroke="hotpink" fill="none" width="100%" height="100%"></rect>
        <circle stroke="hotpink" fill="white" cx="0" cy="0" r="2"></circle>
        <circle stroke="hotpink" fill="white" cx="100%" cy="0" r="2"></circle>
        <circle stroke="hotpink" fill="white" cx="100%" cy="100%" r="2"></circle>
        <circle stroke="hotpink" fill="white" cx="0" cy="100%" r="2"></circle>
        <circle fill="hotpink" cx="${width/2}" cy="0" r="2"></circle>
        <circle fill="hotpink" cx="0" cy="${height/2}" r="2"></circle>
        <circle fill="hotpink" cx="${width/2}" cy="${height}" r="2"></circle>
        <circle fill="hotpink" cx="${width}" cy="${height/2}" r="2"></circle>
      </svg>
    `
  }

  styles({top,left}) {
    return `
      <style>
        :host > svg {
          position: absolute;
          top: ${top + window.scrollY}px;
          left: ${left}px;
          overflow: visible;
          pointer-events: none;
          z-index: 2147483644;
        }
      </style>
    `
  }
}

customElements.define('visbug-handles', Handles);

class Hover extends Handles {

  constructor() {
    super();
  }

  render({ x, y, width, height, top, left }) {
    return `
      ${this.styles({top,left})}
      <style>
        :host rect {
          width: 100%;
          height: 100%;
          vector-effect: non-scaling-stroke;
          stroke: hsl(267, 100%, 58%);
          stroke-width: 1px;
          fill: none;
        }

        :host > svg {
          z-index: 2147483642;
        }
      </style>
      <svg width="${width}" height="${height}">
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('visbug-hover', Hover);

class Label extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this));
    window.addEventListener('resize', this.on_resize.bind(this));
  }

  disconnectedCallback() {
    $('a', this.$shadow).off('click', this.dispatchQuery);
    window.removeEventListener('resize', this.on_resize);
  }

  on_resize() {
    window.requestAnimationFrame(() => {
      const node_label_id = this.$shadow.host.getAttribute('data-label-id');
      const [source_el]   = $(`[data-label-id="${node_label_id}"]`);

      if (!source_el) return

      this.position = {
        node_label_id,
        boundingRect: source_el.getBoundingClientRect(),
      };
    });
  }

  dispatchQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('query', {
      bubbles: true,
      detail:   {
        text:       e.target.textContent,
        activator:  e.type,
      }
    }));
  }

  set text(content) {
    this._text = content;
  }

  set position({boundingRect, node_label_id}) {
    this.$shadow.innerHTML  = this.render(boundingRect, node_label_id);
  }

  set update({x,y}) {
    const label = this.$shadow.children[1];
    label.style.top  = y + window.scrollY + 'px';
    label.style.left = x - 1 + 'px';
  }

  render({ x, y, width, height, top, left }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id);

    return `
      ${this.styles({top,left,width})}
      <span>
        ${this._text}
      </span>
    `
  }

  styles({top,left,width}) {
    return `
      <style>
        :host {
          font-size: 16px;
        }

        :host > span {
          position: absolute;
          top: ${top + window.scrollY}px;
          left: ${left - 1}px;
          max-width: ${width + (window.innerWidth - left - width - 20)}px;
          z-index: 2147483643;
          transform: translateY(-100%);
          background: var(--label-bg, hotpink);
          border-radius: 0.2em 0.2em 0 0;
          text-shadow: 0 0.5px 0 hsla(0, 0%, 0%, 0.4);
          color: white;
          display: inline-flex;
          justify-content: center;
          font-size: 0.8em;
          font-weight: normal;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
          white-space: nowrap;
          padding: 0.25em 0.4em 0.15em;
          line-height: 1.1;
        }

        :host a {
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        :host a:hover {
          text-decoration: underline;
          color: white;
        }

        :host a[node]:before {
          content: "\\003c";
        }

        :host a[node]:after {
          content: "\\003e";
        }
      </style>
    `
  }
}

customElements.define('visbug-label', Label);

const desiredPropMap = {
  color:               'rgb(0, 0, 0)',
  backgroundColor:     'rgba(0, 0, 0, 0)',
  backgroundImage:     'none',
  backgroundSize:      'auto',
  backgroundPosition:  '0% 0%',
  // borderColor:      'rgb(0, 0, 0)',
  borderWidth:         '0px',
  borderRadius:        '0px',
  boxShadow:           'none',
  padding:             '0px',
  margin:              '0px',
  fontFamily:          '',
  fontSize:            '16px',
  fontWeight:          '400',
  textAlign:           'start',
  textShadow:          'none',
  textTransform:       'none',
  lineHeight:          'normal',
  letterSpacing:       'normal',
  display:             'block',
  alignItems:          'normal',
  justifyContent:      'normal',
  flexDirection:       'row',
  flexWrap:            'nowrap',
  flexBasis:           'auto',
  // flexFlow:         'none',
  fill:                'rgb(0, 0, 0)',
  stroke:              'none',
  gridTemplateColumns: 'none',
  gridAutoColumns:     'auto',
  gridTemplateRows:    'none',
  gridAutoRows:        'auto',
  gridTemplateAreas:   'none',
  gridArea:            'auto / auto / auto / auto',
  gap:                 'normal normal',
  gridAutoFlow:        'row',
};

const desiredAccessibilityMap = [
  'role',
  'tabindex',
  'aria-*',
  'for',
  'alt',
  'title',
  'type',
];

const largeWCAG2TextMap = [
  {
    fontSize: '24px',
    fontWeight: '0'
  },
  {
    fontSize: '18.5px',
    fontWeight: '700'
  }
];

const getStyle = (el, name) => {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1');
    name = name.toLowerCase();
    let s = document.defaultView.getComputedStyle(el, '');
    return s && s.getPropertyValue(name)
  } 
};

const getStyles = el => {
  const elStyleObject = el.style;
  const computedStyle = window.getComputedStyle(el, null);

  let desiredValues = [];

  for (prop in el.style)
    if (prop in desiredPropMap && desiredPropMap[prop] != computedStyle[prop])
      desiredValues.push({
        prop,
        value: computedStyle[prop].replace(/, rgba/g, '\rrgba')
      });

  return desiredValues
};

const getComputedBackgroundColor = el => {
  let background = getStyle(el, 'background-color');

  if (background === 'rgba(0, 0, 0, 0)') {
    let node  = findNearestParentElement(el)
      , found = false;

    while(!found) {
      let bg  = getStyle(node, 'background-color');

      if (bg !== 'rgba(0, 0, 0, 0)') {
        found = true;
        background = bg;
      }

      node = findNearestParentElement(node);

      if (node.nodeName === 'HTML') {
        found = true;
        background = 'white';
      }
    }
  }

  return background
};

const findNearestParentElement = el =>
  el.parentNode && el.parentNode.nodeType === 1
    ? el.parentNode
    : el.parentNode.nodeName === '#document-fragment'
      ? el.parentNode.host
      : el.parentNode.parentNode.host;

const findNearestChildElement = el => {
  if (el.shadowRoot && el.shadowRoot.children.length) {
    return [...el.shadowRoot.children]
      .filter(({nodeName}) => 
        !['LINK','STYLE','SCRIPT','HTML','HEAD'].includes(nodeName)
      )[0]
  }
  else if (el.children.length)
    return el.children[0]
};

const loadStyles = async stylesheets => {
  const fetches = await Promise.all(stylesheets.map(url => fetch(url)));
  const texts   = await Promise.all(fetches.map(url => url.text()));
  const style   = document.createElement('style');

  style.textContent = texts.reduce((styles, fileContents) => 
    styles + fileContents
  , '');

  document.head.appendChild(style);
};

const getA11ys = el => {
  const elAttributes = el.getAttributeNames();

  return desiredAccessibilityMap.reduce((acc, attribute) => {
    if (elAttributes.includes(attribute))
      acc.push({
        prop:   attribute,
        value:  el.getAttribute(attribute)
      });

    if (attribute === 'aria-*')
      elAttributes.forEach(attr => {
        if (attr.includes('aria'))
          acc.push({
            prop:   attr,
            value:  el.getAttribute(attr)
          });
      });

    return acc
  }, [])
};

const getWCAG2TextSize = el => {
  
  const styles = getStyles(el).reduce((styleMap, style) => {
      styleMap[style.prop] = style.value;
      return styleMap
  }, {});

  const { fontSize   = desiredPropMap.fontSize,
          fontWeight = desiredPropMap.fontWeight
      } = styles;
  
  const isLarge = largeWCAG2TextMap.some(
    (largeProperties) => parseFloat(fontSize) >= parseFloat(largeProperties.fontSize) 
       && parseFloat(fontWeight) >= parseFloat(largeProperties.fontWeight) 
  );

  return  isLarge ? 'Large' : 'Small'
};

const camelToDash = (camelString = "") =>
  camelString.replace(/([A-Z])/g, ($1) =>
    "-"+$1.toLowerCase());

const nodeKey = node => {
  let tree = [];
  let furthest_leaf = node;

  while (furthest_leaf) {
    tree.push(furthest_leaf);
    furthest_leaf = furthest_leaf.parentNode
      ? furthest_leaf.parentNode
      : false;
  }

  return tree.reduce((path, branch) => `
    ${path}${branch.tagName}_${branch.className}_${[...node.parentNode.children].indexOf(node)}_${node.children.length}
  `, '')
};

const createClassname = (el, ellipse = false) => {
  if (!el.className) return ''
  
  const combined = Array.from(el.classList).reduce((classnames, classname) =>
    classnames += '.' + classname
  , '');

  return ellipse && combined.length > 30
    ? combined.substring(0,30) + '...'
    : combined
};

const metaKey = window.navigator.platform.includes('Mac')
  ? 'cmd'
  : 'ctrl';

const altKey = window.navigator.platform.includes('Mac')
  ? 'opt'
  : 'alt';

const deepElementFromPoint = (x, y) => {
  const el = document.elementFromPoint(x, y);

  const crawlShadows = node => {
    if (node.shadowRoot) {
      const potential = node.shadowRoot.elementFromPoint(x, y);

      if (potential == node)          return node
      else if (potential.shadowRoot)  return crawlShadows(potential)
      else                            return potential
    }
    else return node
  };

  const nested_shadow = crawlShadows(el);

  return nested_shadow || el
};

const getSide = direction => {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase());
  if (start == 'Up') start = 'Top';
  if (start == 'Down') start = 'Bottom';
  return start
};

const getNodeIndex = el => {
  return [...el.parentElement.parentElement.children]
    .indexOf(el.parentElement)
};

function showEdge(el) {
  return el.animate([
    { outline: '1px solid transparent' },
    { outline: '1px solid hsla(330, 100%, 71%, 80%)' },
    { outline: '1px solid transparent' },
  ], 600)
}

let timeoutMap = {};
const showHideSelected = (el, duration = 750) => {
  el.setAttribute('data-selected-hide', true);
  showHideNodeLabel(el, true);

  if (timeoutMap[nodeKey(el)])
    clearTimeout(timeoutMap[nodeKey(el)]);

  timeoutMap[nodeKey(el)] = setTimeout(_ => {
    el.removeAttribute('data-selected-hide');
    showHideNodeLabel(el, false);
  }, duration);

  return el
};

const showHideNodeLabel = (el, show = false) => {
  if (!el.hasAttribute('data-label-id'))
    return

  const label_id = el.getAttribute('data-label-id');

  const nodes = $(`
    visbug-label[data-label-id="${label_id}"],
    visbug-handles[data-label-id="${label_id}"]
  `);

  nodes.length && show
    ? nodes.forEach(el =>
      el.style.display = 'none')
    : nodes.forEach(el =>
      el.style.display = null);
};

const htmlStringToDom = (htmlString = "") =>
  (new DOMParser().parseFromString(htmlString, 'text/html'))
    .body.firstChild;

const isOffBounds = node =>
  node.closest && (
       node.closest('vis-bug')
    || node.closest('hotkey-map')
    || node.closest('visbug-metatip')
    || node.closest('visbug-ally')
    || node.closest('visbug-label')
    || node.closest('visbug-handles')
    || node.closest('visbug-gridlines')
  );

const isSelectorValid = (qs => (
  selector => {
    try { qs(selector); } catch (e) { return false }
    return true
  }
))(s => document.createDocumentFragment().querySelector(s));

function windowBounds() {
  const height  = window.innerHeight;
  const width   = window.innerWidth;
  const body    = document.body.clientWidth;

  const calcWidth = body <= width
    ? body
    : width;

  return {
    winHeight: height,
    winWidth:  calcWidth,
  }
}

class Gridlines extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(boundingRect) {
    this.$shadow.innerHTML  = this.render(boundingRect);
  }

  set update({ width, height, top, left }) {
    const { winHeight, winWidth } = windowBounds();

    this.$shadow.host.style.display = 'block';
    const svg = this.$shadow.children[1];

    svg.setAttribute('viewBox', `0 0 ${winWidth} ${winHeight}`);
    svg.children[0].setAttribute('width', width + 'px');
    svg.children[0].setAttribute('height', height + 'px');
    svg.children[0].setAttribute('x', left);
    svg.children[0].setAttribute('y', top);
    svg.children[1].setAttribute('x1', left);
    svg.children[1].setAttribute('x2', left);
    svg.children[2].setAttribute('x1', left + width);
    svg.children[2].setAttribute('x2', left + width);
    svg.children[3].setAttribute('y1', top);
    svg.children[3].setAttribute('y2', top);
    svg.children[3].setAttribute('x2', winWidth);
    svg.children[4].setAttribute('y1', top + height);
    svg.children[4].setAttribute('y2', top + height);
    svg.children[4].setAttribute('x2', winWidth);
  }

  render({ x, y, width, height, top, left }) {
    const { winHeight, winWidth } = windowBounds();

    return `
      ${this.styles({top,left})}
      <svg
        width="100%" height="100%"
        viewBox="0 0 ${winWidth} ${winHeight}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          stroke="hotpink" fill="none"
          width="${width}" height="${height}"
          x="${x}" y="${y}"
          style="display:none;"
        ></rect>
        <line x1="${x}" y1="0" x2="${x}" y2="${winHeight}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="${x + width}" y1="0" x2="${x + width}" y2="${winHeight}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="0" y1="${y}" x2="${winWidth}" y2="${y}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="0" y1="${y + height}" x2="${winWidth}" y2="${y + height}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
      </svg>
    `
  }

  styles({top,left}) {
    return `
      <style>
        :host > svg {
          position:fixed;
          top:0;
          left:0;
          overflow:visible;
          pointer-events:none;
          z-index:2147483642;
        }
      </style>
    `
  }
}

customElements.define('visbug-gridlines', Gridlines);

class Distance extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'open'});
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(payload) {
    this.$shadow.innerHTML = this.render(payload);
  }

  render({line_model, node_label_id}) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id);
    return `
      ${this.styles(line_model)}
      <figure quadrant="measurements.q">
        <div></div>
        <figcaption><b>${line_model.d}</b>px</figcaption>
        <div></div>
      </figure>
    `
  }

  styles({y,x,d,q,v = false, color}) {
    const colors = {};
    if (color) {
      const single = color === 'pink'
        ? 'hotpink'
        : 'hsl(267, 100%, 58%)';

      colors.line = single;
      colors.base = single;
    }
    else {
      colors.line = 'hsl(267, 100%, 58%)';
      colors.base = 'hotpink';
    }

    return `
      <style>
        :host {
          --line-color: ${colors.line};
          --line-base: ${colors.base};
          --line-width: 1px;
          font-size: 16px;
        }

        :host > figure {
          margin: 0;
          position: absolute;
          ${v
            ? `height: ${d}px; width: 5px;`
            : `min-width: ${d}px; height: 5px;`}
          top: ${y + window.scrollY}px;
          ${q === 'left' ? 'right' : 'left'}: ${x}px;
          overflow: visible;
          pointer-events: none;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          flex-direction: ${v ? 'column' : 'row'};
        }

        :host > figure figcaption {
          color: white;
          text-shadow: 0 0.5px 0 hsla(0, 0%, 0%, 0.4);
          box-shadow: 0 0.5px 0 hsla(0, 0%, 0%, 0.4);
          background: var(--line-color);
          border-radius: 1em;
          text-align: center;
          line-height: 1.1;
          font-size: 0.7em;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
          padding: 0.25em 0.5em 0.275em;
          font-variant-numeric: proportional-num oldstyle-nums stacked-fractions slashed-zero;
        }

        :host > figure span {
          background: var(--line-color);
          ${v
            ? 'height: var(--line-width); width: 5px;'
            : 'width: var(--line-width); height: 5px;'}
        }

        :host > figure div {
          flex: 2;
          background: var(--line-color);
          ${v
            ? 'width: var(--line-width);'
            : 'height: var(--line-width);'}
        }

        :host figure > div${q === 'top' || q === 'left' ? ':last-of-type' : ':first-of-type'} {
          background: linear-gradient(to ${q}, var(--line-base) 0%, var(--line-color) 100%);
        }
      </style>
    `
  }
}

customElements.define('visbug-distance', Distance);

class Overlay extends HTMLElement {
  
  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(boundingRect) {
    this.$shadow.innerHTML  = this.render(boundingRect);
  }

  set update({ top, left, width, height }) {
    this.$shadow.host.style.display = 'block';

    const svg = this.$shadow.children[0];
    svg.style.display = 'block';
    svg.style.top = window.scrollY + top + 'px';
    svg.style.left = left + 'px';

    svg.setAttribute('width', width + 'px');
    svg.setAttribute('height', height + 'px');
  }

  render({id, top, left, height, width}) {
    return `
      <svg 
        class="visbug-overlay"
        overlay-id="${id}"
        style="
          display:none;
          position:absolute;
          top:0;
          left:0;
          overflow:visible;
          pointer-events:none;
          z-index: 999;
        " 
        width="${width}px" height="${height}px" 
        viewBox="0 0 ${width} ${height}" 
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect 
          fill="hsla(330, 100%, 71%, 0.5)"
          width="100%" height="100%"
        ></rect>
      </svg>
    `
  }
}

customElements.define('visbug-overlay', Overlay);

class BoxModel extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
    this.drawable = {};
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(payload) {
    this.$shadow.innerHTML = this.render(payload);
    if (!this.drawable.measurements) // && payload.color === 'pink'
      this.createMeasurements(payload);
  }

  render({mode, bounds, sides, color = 'pink'}) {
    const total_height  = bounds.height + sides.bottom + sides.top;
    const total_width   = bounds.width + sides.right + sides.left;

    if (mode === 'padding') {
      this.drawable = {
        height:   bounds.height,
        width:    bounds.width,
        top:      bounds.top + window.scrollY,
        left:     bounds.left,
        rotation: 'rotate(-45)',
      };
    }
    else if (mode === 'margin') {
      this.drawable = {
        height:   total_height,
        width:    total_width,
        top:      bounds.top + window.scrollY - sides.top,
        left:     bounds.left - sides.left,
        rotation: 'rotate(45)',
      };
    }

    if (color === 'pink') {
      this.drawable.bg = 'hsla(330, 100%, 71%, 15%)';
      this.drawable.stripe = 'hsla(330, 100%, 71%, 80%)';
    }
    else {
      this.drawable.bg = 'hsla(267, 100%, 58%, 15%)';
      this.drawable.stripe = 'hsla(267, 100%, 58%, 80%)';
    }

    return `
      ${this.styles({sides})}
      <div mask>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="${this.drawable.rotation}" class="pattern">
              <line x1="0" y="0" x2="0" y2="10" stroke="${this.drawable.stripe}" stroke-width="1"></line>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pinstripe)"></rect>
        </svg>
      </div>
    `
  }

  styles({sides}) {
    return `
      <style>
        :host [mask] {
          pointer-events: none;
          position: absolute;
          z-index: 2147483642;
          width: ${this.drawable.width}px;
          height: ${this.drawable.height}px;
          top: ${this.drawable.top}px;
          left: ${this.drawable.left}px;
          background-color: ${this.drawable.bg};
          clip-path: polygon(
            0% 0%, 0% 100%, ${sides.left}px 100%,
            ${sides.left}px ${sides.top}px,
            ${this.drawable.width - sides.right}px ${sides.top}px,
            ${this.drawable.width - sides.right}px ${this.drawable.height - sides.bottom}px,
            0 ${this.drawable.height - sides.bottom}px, 0 100%,
            100% 100%, 100% 0%
          );
        }
      </style>
    `
  }

  createMeasurements({mode, bounds, sides, color}) {
    const win_width   = window.innerWidth;
    const pill_height = 18;
    const offset      = 3;

    if (mode === 'margin') {
      if (sides.top) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.top - sides.top - (sides.top < pill_height ? pill_height - sides.top : 0),
          d: sides.top,
          q: 'top',
          v: true,
          color,
        });
      }
      if (sides.bottom) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.bottom,
          d: sides.bottom,
          q: 'bottom',
          v: true,
          color,
        });
      }
      if (sides.right) {
        this.createMeasurement({
          x: bounds.right,
          y: bounds.top + (bounds.height / 2) - offset,
          d: sides.right,
          q: 'right',
          v: false,
          color,
        });
      }
      if (sides.left) {
        this.createMeasurement({
          x: win_width - bounds.left,
          y: bounds.top + (bounds.height / 2) - offset,
          d: sides.left,
          q: 'left',
          v: false,
          color,
        });
      }
    }
    else if (mode === 'padding') {
      if (sides.top) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.top - (sides.top < pill_height ? pill_height - sides.top : 0),
          d: sides.top,
          q: 'top',
          v: true,
          color,
        });
      }
       if (sides.bottom) {
         this.createMeasurement({
           x: bounds.left + (bounds.width / 2) - offset,
           y: bounds.bottom - sides.bottom,
           d: sides.bottom,
           q: 'bottom',
           v: true,
           color,
         });
       }
       if (sides.right) {
         this.createMeasurement({
           x: bounds.right - sides.right,
           y: bounds.top + (bounds.height / 2) - offset,
           d: sides.right,
           q: 'right',
           v: false,
           color,
         });
       }
       if (sides.left) {
         this.createMeasurement({
           x: win_width - bounds.left - sides.left,
           y: bounds.top + (bounds.height / 2) - offset,
           d: sides.left,
           q: 'left',
           v: false,
           color,
         });
       }
    }
  }

  createMeasurement(line_model, node_label_id=0) {
    const measurement = document.createElement('visbug-distance');
    measurement.position = { line_model, node_label_id };
    this.$shadow.appendChild(measurement);
  }
}

customElements.define('visbug-boxmodel', BoxModel);

var css$1 = ":host {\n  --theme-bg: hsl(0,0%,100%);\n  --theme-color: hotpink;\n  --theme-blue: hsl(188, 90%, 45%);\n  --theme-purple: hsl(267, 100%, 58%);\n  --theme-icon_color: hsl(0,0%,20%);\n  --theme-icon_hover-bg: hsl(0,0%,95%);\n}\n\n:host {\n  position: absolute;\n  z-index: 2147483647;\n  direction: ltr;\n  font-size: 16px;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;\n\n  --arrow-width: 15px;\n  --arrow-height: 8px;\n\n  --shadow-up: 5px;\n  --shadow-down: -5px;\n  --shadow-direction: var(--shadow-up);\n\n  --arrow-up: polygon(0 0, 100% 0, 50% 100%);\n  --arrow-down: polygon(50% 0, 0 100%, 100% 100%);\n  --arrow: var(--arrow-up);\n}\n\n:host figure {\n  max-width: 50vw;\n  background: white;\n  color: var(--theme-icon_color);\n  line-height: normal;\n  line-height: initial;\n  padding: 0.5em;\n  margin: 0;\n  display: flex;\n  flex-direction: column;\n  flex-wrap: nowrap;\n  border-radius: 0.25em;\n  line-height: initial;\n  -webkit-filter: drop-shadow(0 var(--shadow-direction) 0.5em hsla(0,0%,0%,35%));\n          filter: drop-shadow(0 var(--shadow-direction) 0.5em hsla(0,0%,0%,35%))\n}\n\n:host figure:after {\n    content: \"\";\n    background: white;\n    width: var(--arrow-width);\n    height: var(--arrow-height);\n    -webkit-clip-path: var(--arrow);\n            clip-path: var(--arrow);\n    position: absolute;\n    top: var(--arrow-top);\n    left: var(--arrow-left);\n  }\n\n:host figure a {\n    text-decoration: none;\n    color: inherit;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    cursor: pointer\n  }\n\n:host figure a:hover {\n      color: var(--theme-color);\n      text-decoration: underline;\n    }\n\n:host figure a:empty {\n      display: none;\n    }\n\n:host figure a[node]:before {\n      content: \"\\003c\";\n    }\n\n:host figure a[node]:after {\n      content: \"\\003e\";\n    }\n\n:host h5 {\n  display: flex;\n  font-size: 1em;\n  font-weight: bolder;\n  margin: 0;\n  overflow: hidden;\n  white-space: nowrap;\n}\n\n:host h6 {\n  margin-top: 1em;\n  margin-bottom: 0;\n  font-weight: normal;\n}\n\n:host small {\n  font-size: 0.7em;\n  color: hsl(0,0%,60%)\n}\n\n:host small > span {\n    color: hsl(0,0%,20%);\n  }\n\n:host a:not(:hover) {\n  text-decoration: none;\n}\n\n:host [brand],\n:host [divider] {\n  color: var(--theme-color);\n}\n\n:host div {\n  display: grid;\n  grid-template-columns: auto auto;\n  grid-gap: 0.25em 0.5em;\n  margin: 0.5em 0 0;\n  padding: 0;\n  list-style-type: none;\n  color: hsl(0,0%,40%);\n  font-size: 0.8em;\n  font-family: 'Dank Mono', 'Operator Mono', 'Inconsolata', 'Fira Mono', 'SF Mono', 'Monaco', 'Droid Sans Mono', 'Source Code Pro', monospace;\n}\n\n:host [value] {\n  color: var(--theme-icon_color);\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-end;\n  text-align: right;\n  /* white-space: pre; */\n}\n\n:host [text] {\n  white-space: normal;\n}\n\n:host [longform] {\n  background: var(--theme-icon_hover-bg);\n  padding: 0.5em 0.75em;\n  border-radius: 0.25em;\n  font-family: sans-serif;\n  text-align: left;\n  line-height: 1.5;\n}\n\n:host [color] {\n  position: relative;\n  top: 1px;\n  display: inline-block;\n  width: 0.6em;\n  height: 0.6em;\n  border-radius: 50%;\n  margin-right: 0.25em;\n}\n\n:host [local-modifications] {\n  margin-top: 1rem;\n  color: var(--theme-color);\n  font-weight: bold;\n}\n\n:host [contrast] > span {\n  padding: 0 0.5em 0.1em;\n  border-radius: 1em;\n  box-shadow: 0 0 0 1px hsl(0,0%,90%);\n}\n";

class Metatip extends HTMLElement {

  constructor() {
    super();
    this.$shadow = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    $(this.$shadow.host).on('mouseenter', this.observe.bind(this));
  }

  disconnectedCallback() {
    this.unobserve();
  }

  dispatchQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('query', {
      bubbles: true,
      detail:   {
        text:       e.target.textContent,
        activator:  e.type,
      }
    }));
  }

  observe() {
    $('h5 > a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this));
    $('h5 > a', this.$shadow).on('mouseleave', this.dispatchUnQuery.bind(this));
  }

  unobserve() {
    $('h5 > a', this.$shadow).off('click mouseenter', this.dispatchQuery.bind(this));
    $('h5 > a', this.$shadow).off('mouseleave', this.dispatchUnQuery.bind(this));
  }

  dispatchUnQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('unquery', {
      bubbles: true
    }));
    this.unobserve();
  }

  set meta(data) {
    this.$shadow.innerHTML = this.render(data);
  }

  render({el, width, height, localModifications, notLocalModifications}) {
    return `
      ${this.styles()}
      <figure>
        <h5>
          <a node>${el.nodeName.toLowerCase()}</a>
          <a>${el.id && '#' + el.id}</a>
          ${createClassname(el).split('.')
            .filter(name => name != '')
            .reduce((links, name) => `
              ${links}
              <a>.${name}</a>
            `, '')
          }
        </h5>
        <small>
          <span">${Math.round(width)}</span>px
          <span divider>×</span>
          <span>${Math.round(height)}</span>px
        </small>
        <div>${notLocalModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span>
          <span value>${item.value}</span>
        `, '')}
        </div>
        ${localModifications.length ? `
          <h6 local-modifications>Local Modifications</h6>
          <div>${localModifications.reduce((items, item) => `
            ${items}
            <span prop>${item.prop}:</span>
            <span value>${item.value}</span>
          `, '')}
          </div>
        ` : ''}
      </figure>
    `
  }

  styles() {
    return `
      <style>
        ${css$1}
      </style>
    `
  }
}

customElements.define('visbug-metatip', Metatip);

class Ally extends Metatip {
  constructor() {
    super();
  }
  
  render({el, ally_attributes, contrast_results}) {
    return `
      ${this.styles()}
      <figure>
        <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}</h5>
        <div>
          ${ally_attributes.reduce((items, attr) => `
            ${items}
            <span prop>${attr.prop}:</span>
            <span value>${attr.value}</span>
          `, '')}
          ${contrast_results}
        </div>
      </figure>
    `
  }
}

customElements.define('visbug-ally', Ally);

var css$2 = ":host {\n  --theme-bg: hsl(0,0%,100%);\n  --theme-color: hotpink;\n  --theme-blue: hsl(188, 90%, 45%);\n  --theme-purple: hsl(267, 100%, 58%);\n  --theme-icon_color: hsl(0,0%,20%);\n  --theme-icon_hover-bg: hsl(0,0%,95%);\n}\n\n:host {\n  display: none;\n  position: fixed;\n  z-index: 99998;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  background: hsl(0,0%,95%);\n  font-size: 16px;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;\n\n  --light-grey: hsl(0,0%,90%);\n  --grey: hsl(0,0%,60%);\n  --dark-grey: hsl(0,0%,40%);\n}\n\n:host [command] {\n  padding: 1em;\n  text-align: center;\n  font-size: 3vw;\n  font-weight: lighter;\n  letter-spacing: 0.1em;\n  color: var(--dark-grey)\n}\n\n:host [command] > [light] {\n    color: var(--grey);\n  }\n\n:host [command] > [tool] {\n    text-decoration: underline;\n    -webkit-text-decoration-color: var(--theme-color);\n            text-decoration-color: var(--theme-color);\n  }\n\n:host [command] > [negative], :host [command] > [side], :host [command] > [amount] {\n    font-weight: normal;\n  }\n\n:host [card] {\n  padding: 1em;\n  background: white;\n  box-shadow: 0 0.5em 3em hsla(0,0%,0%,20%);\n  border-radius: 0.5em;\n  color: var(--dark-grey);\n  display: flex;\n  justify-content: space-evenly\n}\n\n:host [card] > div:not([keyboard]) {\n    display: flex;\n    align-items: flex-end;\n    margin-left: 1em;\n  }\n\n:host [tool-icon] {\n  position: absolute;\n  top: 1em;\n  left: 0;\n  width: 100%;\n  padding: 0 1rem;\n  display: flex;\n  justify-content: center\n}\n\n:host [tool-icon] > span {\n    color: var(--dark-grey);\n    display: grid;\n    grid-template-columns: 5vmax auto;\n    grid-gap: 0.5em;\n    align-items: center;\n    text-transform: capitalize;\n    font-size: 4vmax;\n    font-weight: lighter;\n  }\n\n:host [tool-icon] svg {\n    width: 100%;\n    fill: var(--theme-color);\n  }\n\n:host section {\n  display: flex;\n  justify-content: center;\n}\n\n:host section > span, \n:host [arrows] > span {\n  border: 1px solid transparent;\n  border-radius: 0.5em;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  margin: 2px;\n  padding: 1.5vw;\n  font-size: 0.75em;\n  white-space: nowrap;\n}\n\n:host section > span:not([pressed=\"true\"]), \n:host [arrows] > span:not([pressed=\"true\"]) {\n  border: 1px solid var(--light-grey)\n}\n\n:host section > span:not([pressed=\"true\"]):hover, :host [arrows] > span:not([pressed=\"true\"]):hover {\n    border-color: var(--grey);\n  }\n\n:host span[pressed=\"true\"] {\n  background: var(--theme-color);\n  color: white;\n}\n\n:host span:not([pressed=\"true\"])[used] {\n  background: var(--light-grey);\n}\n\n:host span[hotkey] {\n  color: var(--theme-color);\n  font-weight: bold;\n  cursor: pointer;\n}\n\n:host section > span[hotkey]:not([pressed=\"true\"]) {\n  border-color: var(--theme-color);\n}\n\n:host [arrows] {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  grid-template-rows: 1fr 1fr\n}\n\n:host [arrows] > span:nth-child(1) {\n    grid-row: 1;\n    grid-column: 2;\n  }\n\n:host [arrows] > span:nth-child(2) {\n    grid-row: 2;\n    grid-column: 2;\n  }\n\n:host [arrows] > span:nth-child(3) {\n    grid-row: 2;\n    grid-column: 1;\n  }\n\n:host [arrows] > span:nth-child(4) {\n    grid-row: 2;\n    grid-column: 3;\n  }\n\n:host [caps] > span:nth-child(1),\n:host [shift] > span:nth-child(1)  { justify-content: flex-start; }\n\n:host [shift] > span:nth-child(12) { justify-content: flex-end; }";

const cursor = `
  <svg class="icon-cursor" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M16.689 17.655l5.311 12.345-4 2-4.646-12.678-7.354 6.678v-26l20 16-9.311 1.655z"></path>
  </svg>
`;

const move = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/>
  </svg>
`;

const search = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
`;

const margin = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M9 7H7v2h2V7zm0 4H7v2h2v-2zm0-8c-1.11 0-2 .9-2 2h2V3zm4 12h-2v2h2v-2zm6-12v2h2c0-1.1-.9-2-2-2zm-6 0h-2v2h2V3zM9 17v-2H7c0 1.1.89 2 2 2zm10-4h2v-2h-2v2zm0-4h2V7h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zM5 7H3v12c0 1.1.89 2 2 2h12v-2H5V7zm10-2h2V3h-2v2zm0 12h2v-2h-2v2z"/>
  </svg>
`;

const padding = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.89 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z"/>
  </svg>
`;

const font = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
  </svg>
`;

const text = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
`;

const align = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="transform:rotateZ(90deg);">
    <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/>
  </svg>
`;

const resize = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"/>
  </svg>
`;

const transform = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12,7C6.48,7,2,9.24,2,12c0,2.24,2.94,4.13,7,4.77V20l4-4l-4-4v2.73c-3.15-0.56-5-1.9-5-2.73c0-1.06,3.04-3,8-3s8,1.94,8,3
    c0,0.73-1.46,1.89-4,2.53v2.05c3.53-0.77,6-2.53,6-4.58C22,9.24,17.52,7,12,7z"/>
  </svg>
`;

const border = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M13 7h-2v2h2V7zm0 4h-2v2h2v-2zm4 0h-2v2h2v-2zM3 3v18h18V3H3zm16 16H5V5h14v14zm-6-4h-2v2h2v-2zm-4-4H7v2h2v-2z"/>
  </svg>
`;

const hueshift = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
`;

const boxshadow = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-.89 0-1.74-.2-2.5-.55C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.45C10.26 6.2 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/>
  </svg>
`;

const inspector = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g>
      <rect x="11" y="7" width="2" height="2"/>
      <rect x="11" y="11" width="2" height="6"/>
      <path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8
        c0-4.41,3.59-8,8-8s8,3.59,8,8C20,16.41,16.41,20,12,20z"/>
    </g>
  </svg>
`;

const camera = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
`;

const guides = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M21,16H3V8h2v4h2V8h2v4h2V8h2v4h2V8
    h2v4h2V8h2V16z"/>
  </svg>
`;

const color_text = `
  <svg viewBox="0 0 25 27">
    <path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/>
    <rect fill="var(--contextual_color)" x="1" y="21" width="23" height="5"></rect>
  </svg>
`;

const color_background = `
  <svg viewBox="0 0 25 27">
    <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
    <rect fill="var(--contextual_color)" x="1" y="21" width="23" height="5"></rect>
  </svg>
`;

const color_border = `
  <svg viewBox="0 0 25 27">
    <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29c-.39-.39-1.02-.39-1.41 0L15 2.25 18.75 6l1.96-1.96z"/>
    <rect fill="var(--contextual_color)" x="1" y="21" width="23" height="5"></rect>
  </svg>
`;

const position = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15.54 5.54L13.77 7.3 12 5.54 10.23 7.3 8.46 5.54 12 2zm2.92 10l-1.76-1.77L18.46 12l-1.76-1.77 1.76-1.77L22 12zm-10 2.92l1.77-1.76L12 18.46l1.77-1.76 1.77 1.76L12 22zm-2.92-10l1.76 1.77L5.54 12l1.76 1.77-1.76 1.77L2 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;

const accessibility = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12,2c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S10.9,2,12,2z M21,9h-6v13h-2v-6h-2v6H9V9H3V7h18V9z"/>
  </svg>
`;

var Icons = /*#__PURE__*/Object.freeze({
  cursor: cursor,
  move: move,
  search: search,
  margin: margin,
  padding: padding,
  font: font,
  text: text,
  align: align,
  resize: resize,
  transform: transform,
  border: border,
  hueshift: hueshift,
  boxshadow: boxshadow,
  inspector: inspector,
  camera: camera,
  guides: guides,
  color_text: color_text,
  color_background: color_background,
  color_border: color_border,
  position: position,
  accessibility: accessibility
});

class HotkeyMap extends HTMLElement {

  constructor() {
    super();

    this.keyboard_model = {
      num:    ['`','1','2','3','4','5','6','7','8','9','0','-','=','delete'],
      tab:    ['tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
      caps:   ['caps','a','s','d','f','g','h','j','k','l','\'','return'],
      shift:  ['shift','z','x','c','v','b','n','m',',','.','/','shift'],
      space:  ['ctrl',altKey,'cmd','spacebar','cmd',altKey,'ctrl']
    };

    this.key_size_model = {
      num:    {12:2},
      tab:    {0:2},
      caps:   {0:3,11:3},
      shift:  {0:6,11:6},
      space:  {3:10},
    };

    this.$shadow    = this.attachShadow({mode: 'closed'});

    this._hotkey    = '';
    this._usedkeys  = [];

    this.tool       = 'hotkeymap';
  }

  connectedCallback() {
    this.$shift  = $('[keyboard] > section > [shift]', this.$shadow);
    this.$ctrl   = $('[keyboard] > section > [ctrl]', this.$shadow);
    this.$alt    = $(`[keyboard] > section > [${altKey}]`, this.$shadow);
    this.$cmd    = $(`[keyboard] > section > [${metaKey}]`, this.$shadow);
    this.$up     = $('[arrows] [up]', this.$shadow);
    this.$down   = $('[arrows] [down]', this.$shadow);
    this.$left   = $('[arrows] [left]', this.$shadow);
    this.$right  = $('[arrows] [right]', this.$shadow);
  }

  disconnectedCallback() {}

  set tool(tool) {
    this._tool = tool;
    this.$shadow.innerHTML = this.render();
  }

  show() {
    this.$shadow.host.style.display = 'flex';
    hotkeys('*', (e, handler) =>
      this.watchKeys(e, handler));
  }

  hide() {
    this.$shadow.host.style.display = 'none';
    hotkeys.unbind('*');
  }

  watchKeys(e, handler) {
    e.preventDefault();
    e.stopImmediatePropagation();

    this.$shift.attr('pressed', hotkeys.shift);
    this.$ctrl.attr('pressed', hotkeys.ctrl);
    this.$alt.attr('pressed', hotkeys.alt);
    this.$cmd.attr('pressed', hotkeys[metaKey]);
    this.$up.attr('pressed', e.code === 'ArrowUp');
    this.$down.attr('pressed', e.code === 'ArrowDown');
    this.$left.attr('pressed', e.code === 'ArrowLeft');
    this.$right.attr('pressed', e.code === 'ArrowRight');

    const { negative, negative_modifier, side, amount } = this.createCommand({e, hotkeys});

    $('[command]', this.$shadow)[0].innerHTML = this.displayCommand({
      negative, negative_modifier, side, amount,
    });
  }

  createCommand({e:{code}, hotkeys: hotkeys$$1}) {
    let amount              = hotkeys$$1.shift ? 10 : 1;
    let negative            = hotkeys$$1.alt ? 'Subtract' : 'Add';
    let negative_modifier   = hotkeys$$1.alt ? 'from' : 'to';

    let side = '[arrow key]';
    if (code === 'ArrowUp')     side = 'the top side';
    if (code === 'ArrowDown')   side = 'the bottom side';
    if (code === 'ArrowLeft')   side = 'the left side';
    if (code === 'ArrowRight')  side = 'the right side';
    if (hotkeys$$1[metaKey])            side = 'all sides';

    if (hotkeys$$1[metaKey] && code === 'ArrowDown') {
      negative            = 'Subtract';
      negative_modifier   = 'from';
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({negative, negative_modifier, side, amount}) {
    return `
      <span negative>${negative} </span>
      <span tool>${this._tool}</span>
      <span light> ${negative_modifier} </span>
      <span side>${side}</span>
      <span light> by </span>
      <span amount>${amount}</span>
    `
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${Icons[this._tool]}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          ${this.displayCommand({
            negative: `±[${altKey}] `,
            negative_modifier: ' to ',
            tool: this._tool,
            side: '[arrow key]',
            amount: 1
          })}
        </div>
        <div card>
          <div keyboard>
            ${Object.entries(this.keyboard_model).reduce((keyboard, [row_name, row]) => `
              ${keyboard}
              <section ${row_name}>${row.reduce((row, key, i) => `
                ${row}
                <span
                  ${key}
                  ${this._hotkey == key ? 'hotkey title="Tool Shortcut Hotkey"' : ''}
                  ${this._usedkeys.includes(key) ? 'used' : ''}
                  style="flex:${this.key_size_model[row_name][i] || 1};"
                >${key}</span>
              `, '')}
              </section>
            `, '')}
          </div>
          <div>
            <section arrows>
              <span up used>↑</span>
              <span down used>↓</span>
              <span left used>←</span>
              <span right used>→</span>
            </section>
          </div>
        </div>
      </article>
    `
  }

  styles() {
    return `
      <style>
        ${css$2}
      </style>
    `
  }
}

customElements.define('hotkey-map', HotkeyMap);

class GuidesHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'g';
    this._usedkeys  = [];
    this.tool       = 'guides';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${guides}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-guides', GuidesHotkeys);

class InspectorHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'i';
    this._usedkeys  = [altKey];
    this.tool       = 'inspector';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${inspector}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-inspector', InspectorHotkeys);

class AccessibilityHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'p';
    this._usedkeys  = [altKey];
    this.tool       = 'accessibility';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${accessibility}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-accessibility', AccessibilityHotkeys);

class MoveHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey  = 'v';
    this.tool     = 'move';
  }

  createCommand({e:{code}, hotkeys}) {
    let amount, negative, negative_modifier;

    let side = '[arrow key]';
    if (code === 'ArrowUp')     side = 'up & out of div';
    if (code === 'ArrowDown')   side = 'down & into next sibling / out & under div';
    if (code === 'ArrowLeft')   side = 'towards the front/top of the stack';
    if (code === 'ArrowRight')  side = 'towards the back/bottom of the stack';

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({side}) {
    return `
      <span tool>${this._tool}</span>
      <span side>${side}</span>
    `
  }
}

customElements.define('hotkeys-move', MoveHotkeys);

class MarginHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'm';
    this._usedkeys  = ['shift',metaKey,altKey];

    this.tool       = 'margin';
  }
}

customElements.define('hotkeys-margin', MarginHotkeys);

class PaddingHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'p';
    this._usedkeys  = ['shift',metaKey,altKey];

    this.tool       = 'padding';
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys);

const h_alignOptions  = ['left','center','right'];
const v_alignOptions  = ['top','center','bottom'];
const distOptions     = ['evenly','normal','between'];

class AlignHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey   = 'a';
    this._usedkeys = [metaKey,'shift'];

    this._htool   = 0;
    this._vtool   = 0;
    this._dtool   = 1;

    this._side         = 'top left';
    this._direction    = 'row';
    this._distribution = distOptions[this._dtool];

    this.tool     = 'align';
  }

  createCommand({e:{code}, hotkeys}) {
    let amount            = this._distribution
      , negative_modifier = this._direction
      , side              = this._side
      , negative;

    if (hotkeys.cmd && (code === 'ArrowRight' || code === 'ArrowDown')) {
      negative_modifier = code === 'ArrowDown'
        ? 'column'
        : 'row';
      this._direction = negative_modifier;
    }
    else {
      if (code === 'ArrowUp')           side = this.clamp(v_alignOptions, '_vtool');
      else if (code === 'ArrowDown')    side = this.clamp(v_alignOptions, '_vtool', true);
      else                              side = v_alignOptions[this._vtool];

      if (code === 'ArrowLeft')         side += ' ' + this.clamp(h_alignOptions, '_htool');
      else if (code === 'ArrowRight')   side += ' ' + this.clamp(h_alignOptions, '_htool', true);
      else                              side += ' ' + h_alignOptions[this._htool];

      this._side = side;

      if (hotkeys.shift && (code === 'ArrowRight' || code === 'ArrowLeft')) {
        amount = this.clamp(distOptions, '_dtool', code === 'ArrowRight');
        this._distribution = amount;
      }
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({side, amount, negative_modifier}) {
    if (amount == 1) amount = this._distribution;
    if (negative_modifier == ' to ') negative_modifier = this._direction;

    return `
      <span tool>${this._tool}</span>
      <span light> as </span>
      <span>${negative_modifier}:</span>
      <span side>${side}</span>
      <span light> distributed </span>
      <span amount>${amount}</span>
    `
  }

  clamp(range, tool, increment = false) {
    if (increment) {
      if (this[tool] < range.length - 1)
        this[tool] = this[tool] + 1;
    }
    else if (this[tool] > 0)
      this[tool] = this[tool] - 1;

    return range[this[tool]]
  }
}

customElements.define('hotkeys-align', AlignHotkeys);

class HueshiftHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'h';
    this._usedkeys  = ['shift',metaKey];
    this.tool       = 'hueshift';
  }

  createCommand({e:{code}, hotkeys}) {
    let amount              = hotkeys.shift ? 10 : 1;
    let negative            = '[increase/decrease]';
    let negative_modifier   = 'by';
    let side                = '[arrow key]';

    // saturation
    if (hotkeys.cmd) {
      side ='hue';

      if (code === 'ArrowDown')
        negative  = 'decrease';
      if (code === 'ArrowUp')
        negative  = 'increase';
    }
    else if (code === 'ArrowLeft' || code === 'ArrowRight') {
      side = 'saturation';

      if (code === 'ArrowLeft')
        negative  = 'decrease';
      if (code === 'ArrowRight')
        negative  = 'increase';
    }
    // lightness
    else if (code === 'ArrowUp' || code === 'ArrowDown') {
      side = 'lightness';

      if (code === 'ArrowDown')
        negative  = 'decrease';
      if (code === 'ArrowUp')
        negative  = 'increase';
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({negative, negative_modifier, side, amount}) {
    if (negative === `±[${altKey}] `)
      negative = '[increase/decrease]';
    if (negative_modifier === ' to ')
      negative_modifier = ' by ';

    return `
      <span negative>${negative}</span>
      <span side tool>${side}</span>
      <span light>${negative_modifier}</span>
      <span amount>${amount}</span>
    `
  }
}

customElements.define('hotkeys-hueshift', HueshiftHotkeys);

class BoxshadowHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'd';
    this._usedkeys  = ['shift',metaKey];
    this.tool       = 'boxshadow';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${boxshadow}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-boxshadow', BoxshadowHotkeys);

class PositionHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'l';
    this._usedkeys  = ['shift',altKey];
    this.tool       = 'position';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${position}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-position', PositionHotkeys);

class FontHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'f';
    this._usedkeys  = ['shift',metaKey];
    this.tool       = 'font';
  }

  createCommand({e:{code}, hotkeys}) {
    let amount              = hotkeys.shift ? 10 : 1;
    let negative            = '[increase/decrease]';
    let negative_modifier   = 'by';
    let side                = '[arrow key]';

    // kerning
    if (hotkeys.shift && (code === 'ArrowLeft' || code === 'ArrowRight')) {
      side    = 'kerning';
      amount  = '1px';

      if (code === 'ArrowLeft')
        negative  = 'decrease';
      if (code === 'ArrowRight')
        negative  = 'increase';
    }
    // leading
    else if (hotkeys.shift && (code === 'ArrowUp' || code === 'ArrowDown')) {
      side    = 'leading';
      amount  = '1px';

      if (code === 'ArrowUp')
        negative  = 'increase';
      if (code === 'ArrowDown')
        negative  = 'decrease';
    }
    // font weight
    else if (hotkeys.cmd && (code === 'ArrowUp' || code === 'ArrowDown')) {
      side                = 'font weight';
      amount              = '';
      negative_modifier   = '';

      if (code === 'ArrowUp')
        negative  = 'increase';
      if (code === 'ArrowDown')
        negative  = 'decrease';
    }
    // font size
    else if (code === 'ArrowUp' || code === 'ArrowDown') {
      side    = 'font size';
      amount  = '1px';

      if (code === 'ArrowUp')
        negative  = 'increase';
      if (code === 'ArrowDown')
        negative  = 'decrease';
    }
    // text alignment
    else if (code === 'ArrowRight' || code === 'ArrowLeft') {
      side                = 'text alignment';
      amount              = '';
      negative            = 'adjust';
      negative_modifier   = '';
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({negative, negative_modifier, side, amount}) {
    if (negative === `±[${altKey}] `)
      negative = '[increase/decrease]';
    if (negative_modifier === ' to ')
      negative_modifier = ' by ';

    return `
      <span negative>${negative}</span>
      <span side tool>${side}</span>
      <span light>${negative_modifier}</span>
      <span amount>${amount}</span>
    `
  }
}

customElements.define('hotkeys-font', FontHotkeys);

class TextHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 'e';
    this._usedkeys  = [];
    this.tool       = 'text';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${text}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-text', TextHotkeys);

class SearchHotkeys extends HotkeyMap {
  constructor() {
    super();

    this._hotkey    = 's';
    this._usedkeys  = [];
    this.tool       = 'search';
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex';
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${search}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-search', SearchHotkeys);

class Hotkeys extends HTMLElement {

  constructor() {
    super();

    this.tool_map = {
      guides:         document.createElement('hotkeys-guides'),
      inspector:      document.createElement('hotkeys-inspector'),
      accessibility:  document.createElement('hotkeys-accessibility'),
      move:           document.createElement('hotkeys-move'),
      margin:         document.createElement('hotkeys-margin'),
      padding:        document.createElement('hotkeys-padding'),
      align:          document.createElement('hotkeys-align'),
      hueshift:       document.createElement('hotkeys-hueshift'),
      boxshadow:      document.createElement('hotkeys-boxshadow'),
      position:       document.createElement('hotkeys-position'),
      font:           document.createElement('hotkeys-font'),
      text:           document.createElement('hotkeys-text'),
      search:         document.createElement('hotkeys-search'),
    };

    Object.values(this.tool_map).forEach(tool =>
      this.appendChild(tool));
  }

  connectedCallback() {
    hotkeys('shift+/', e =>
      this.cur_tool
        ? this.hideTool()
        : this.showTool());

    hotkeys('esc', e => this.hideTool());
  }

  disconnectedCallback() {}

  hideTool() {
    if (!this.cur_tool) return
    this.cur_tool.hide();
    this.cur_tool = null;
  }

  showTool() {
    this.cur_tool = this.tool_map[
      $('vis-bug')[0].activeTool];
    this.cur_tool.show();
  }
}

customElements.define('visbug-hotkeys', Hotkeys);

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1);

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`;

function Margin(visbug) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();
    pushElement(visbug.selection(), handler.key);
  });

  hotkeys(command_events, (e, handler) => {
    e.preventDefault();
    pushAllElementSides(visbug.selection(), handler.key);
  });

  visbug.onSelectedUpdate(paintBackgrounds);

  return () => {
    hotkeys.unbind(key_events);
    hotkeys.unbind(command_events);
    hotkeys.unbind('up,down,left,right'); // bug in lib?
    visbug.removeSelectedCallback(paintBackgrounds);
    removeBackgrounds(visbug.selection());
  }
}

function pushElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'margin' + getSide(direction),
      current:  parseInt(getStyle(el, 'margin' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        margin: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount
      }))
    .forEach(({el, style, margin}) =>
      el.style[style] = `${margin < 0 ? 0 : margin}px`);
}

function pushAllElementSides(els, keycommand) {
  const combo = keycommand.split('+');
  let spoof = '';

  if (combo.includes('shift'))  spoof = 'shift+' + spoof;
  if (combo.includes('down'))   spoof = 'alt+' + spoof;

  'up,down,left,right'.split(',')
    .forEach(side => pushElement(els, spoof + side));
}

function paintBackgrounds(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id');

    document
      .querySelector(`visbug-label[data-label-id="${label_id}"]`)
      .style.opacity = 0;

    document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .backdrop = {
        element:  createMarginVisual(el),
        update:   createMarginVisual,
      };
  });
}

function removeBackgrounds(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id');
    const label = document.querySelector(`visbug-label[data-label-id="${label_id}"]`);
    const boxmodel = document.querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .$shadow.querySelector('visbug-boxmodel');

    label.style.opacity = 1;
    if (boxmodel) boxmodel.remove();
  });
}

function createMarginVisual(el, hover = false) {
  const bounds            = el.getBoundingClientRect();
  const styleOM           = el.computedStyleMap();
  const calculatedStyle   = getStyle(el, 'margin');
  const boxdisplay        = document.createElement('visbug-boxmodel');

  if (calculatedStyle !== '0px') {
    const sides = {
      top:    styleOM.get('margin-top').value,
      right:  styleOM.get('margin-right').value,
      bottom: styleOM.get('margin-bottom').value,
      left:   styleOM.get('margin-left').value,
    };

    Object.entries(sides).forEach(([side, val]) => {
      if (typeof val !== 'number')
        val = parseInt(getStyle(el, 'padding'+'-'+side).slice(0, -2));

      sides[side] = Math.round(val.toFixed(1) * 100) / 100;
    });

    boxdisplay.position = { 
      mode: 'margin',
      color: hover ? 'purple' : 'pink',
      bounds, 
      sides,
    };
  }

  return boxdisplay
}

const key_events$1 = 'up,down,left,right';
// todo: indicator for when node can descend
// todo: indicator where left and right will go
// todo: have it work with shadowDOM
function Moveable({selection}) {
  hotkeys(key_events$1, (e, {key}) => {
    if (e.cancelBubble) return
      
    e.preventDefault();
    e.stopPropagation();
    
    selection().forEach(el => {
      moveElement(el, key);
      updateFeedback(el);
    });
  });

  return () => {
    hotkeys.unbind(key_events$1);
  }
}

function moveElement(el, direction) {
  if (!el) return

  switch(direction) {
    case 'left':
      if (canMoveLeft(el))
        el.parentNode.insertBefore(el, el.previousElementSibling);
      else
        showEdge(el.parentNode);
      break

    case 'right':
      if (canMoveRight(el) && el.nextElementSibling.nextSibling)
        el.parentNode.insertBefore(el, el.nextElementSibling.nextSibling);
      else if (canMoveRight(el))
        el.parentNode.appendChild(el);
      else
        showEdge(el.parentNode);
      break

    case 'up':
      if (canMoveUp(el))
        popOut({el});
      break

    case 'down':
      if (canMoveUnder(el))
        popOut({el, under: true});
      else if (canMoveDown(el))
        el.nextElementSibling.prepend(el);
      break
  }
}

const canMoveLeft    = el => el.previousElementSibling;
const canMoveRight   = el => el.nextElementSibling;
const canMoveDown    = el => el.nextElementSibling && el.nextElementSibling.children.length;
const canMoveUnder   = el => !el.nextElementSibling && el.parentNode && el.parentNode.parentNode;
const canMoveUp      = el => el.parentNode && el.parentNode.parentNode;

const popOut = ({el, under = false}) =>
  el.parentNode.parentNode.insertBefore(el, 
    el.parentNode.parentNode.children[
      under
        ? getNodeIndex(el) + 1
        : getNodeIndex(el)]); 

function updateFeedback(el) {
  let options = '';
  // get current elements offset/size
  if (canMoveLeft(el))  options += '⇠';
  if (canMoveRight(el)) options += '⇢';
  if (canMoveDown(el))  options += '⇣';
  if (canMoveUp(el))    options += '⇡';
  // create/move arrows in absolute/fixed to overlay element
  options && console.info('%c'+options, "font-size: 2rem;");
}

let imgs      = []
  , overlays  = []
  , dragItem;

function watchImagesForUpload() {
  imgs = $([
    ...document.images,
    ...$('picture'),
    ...findBackgroundImages(document),
  ]);

  clearWatchers(imgs);
  initWatchers(imgs);
}

const initWatchers = imgs => {
  imgs.on('dragover', onDragEnter);
  imgs.on('dragleave', onDragLeave);
  imgs.on('drop', onDrop);
  $(document.body).on('dragover', onDragEnter);
  $(document.body).on('dragleave', onDragLeave);
  $(document.body).on('drop', onDrop);
  $(document.body).on('dragstart', onDragStart);
  $(document.body).on('dragend', onDragEnd);
};

const clearWatchers = imgs => {
  imgs.off('dragenter', onDragEnter);
  imgs.off('dragleave', onDragLeave);
  imgs.off('drop', onDrop);
  $(document.body).off('dragenter', onDragEnter);
  $(document.body).off('dragleave', onDragLeave);
  $(document.body).off('drop', onDrop);
  $(document.body).on('dragstart', onDragStart);
  $(document.body).on('dragend', onDragEnd);
  imgs = [];
};

const previewFile = file => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result);
  })
};

// only fired for in-page drag events, track what the user picked up
const onDragStart = ({target}) =>
  dragItem = target;

const onDragEnd = e =>
  dragItem = undefined;

const onDragEnter = async e => {
  e.preventDefault();
  e.stopPropagation();

  const pre_selected = $('img[data-selected=true], [data-selected=true] > img');

  if (imgs.some(img => img === e.target)) {
    if (!pre_selected.length) {
      if (!isFileEvent(e))
        previewDrop(e.target);

      showOverlay(e.currentTarget, 0);
    }
    else {
      if (pre_selected.some(node => node == e.target) && !isFileEvent(e))
        pre_selected.forEach(node =>
          previewDrop(node));

      pre_selected.forEach((img, i) =>
        showOverlay(img, i));
    }
  }
};

const onDragLeave = e => {
  e.stopPropagation();
  const pre_selected = $('img[data-selected=true], [data-selected=true] > img');

  if (!pre_selected.some(node => node === e.target))
    resetPreviewed(e.target);
  else
    pre_selected.forEach(node => resetPreviewed(node));

  hideOverlays();
};

const onDrop = async e => {
  e.stopPropagation();
  e.preventDefault();

  const srcs = await getTransferData(dragItem, e);

  if (srcs.length) {
    const selectedImages = $('img[data-selected=true], [data-selected=true] > img');
    const targetImages   = getTargetContentImages(selectedImages, e);

    if (targetImages.length) {
      updateContentImages(targetImages, srcs);
    }
    else {
      const bgImages = getTargetBackgroundImages(imgs, e);
      updateBackgroundImages(bgImages, srcs[0]);
    }
  }

  hideOverlays();
};

const getTransferData = async (dragItem, e) => {
  if (dragItem)
    return [dragItem.currentSrc]

  return e.dataTransfer.files.length
  ? await Promise.all([...e.dataTransfer.files]
    .filter(file => file.type.includes('image'))
    .map(previewFile))
    : []
};

const getTargetContentImages = (selected, e) =>
  selected.length ? selected
    : e.target.nodeName === 'IMG' && !selected.length ? [e.target]
    : [];

const updateContentImages = (images, srcs) => {
  let i = 0;
  images.forEach(img => {
    clearDragHistory(img);
    updateContentImage(img, srcs[i]);
    i = ++i % srcs.length;
  });
};

const updateContentImage = (img, src) => {
  img.src = src;
  if (img.srcset !== '')
    img.srcset = src;

  const sources = getPictureSourcesToUpdate(img);

  if (sources.length)
    sources.forEach(source =>
      source.srcset = src);
};

const getTargetBackgroundImages = (images, e) =>
  images.filter(img =>
    img.contains(e.target));

const updateBackgroundImages = (images, src) =>
  images.forEach(img => {
    clearDragHistory(img);
    if (window.getComputedStyle(img).backgroundImage != 'none')
      img.style.backgroundImage = `url(${src})`;
  });

const getPictureSourcesToUpdate = img =>
  Array.from(img.parentElement.children)
    .filter(sibling =>
      sibling.nodeName === 'SOURCE')
    .filter(source =>
      !source.media || window.matchMedia(source.media).matches);

const showOverlay = (node, i) => {
  const rect    = node.getBoundingClientRect();
  const overlay = overlays[i];

  if (overlay) {
    overlay.update = rect;
  }
  else {
    overlays[i] = document.createElement('visbug-overlay');
    overlays[i].position = rect;
    document.body.appendChild(overlays[i]);
  }
};

const hideOverlays = () => {
  overlays.forEach(overlay =>
    overlay.remove());
  overlays = [];
};

const findBackgroundImages = el => {
  const src_regex = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;

  return $('*').reduce((collection, node) => {
    const prop = getStyle(node, 'background-image');
    const match = src_regex.exec(prop);

    // if (match) collection.push(match[1])
    if (match) collection.push(node);

    return collection
  }, [])
};

const previewDrop = async (node) => {
  if (!['lastSrc','lastSrcset','lastSiblings','lastBackgroundImage'].some(prop => node[prop])){
    const setSrc = dragItem.currentSrc;
    if (window.getComputedStyle(node).backgroundImage !== 'none'){
      node.lastBackgroundImage = window.getComputedStyle(node).backgroundImage;
      node.style.backgroundImage = `url(${setSrc})`;
    }else{
      cacheImageState(node);
      updateContentImage(node, setSrc);
    }
  }
};

const cacheImageState = image => {
  image.lastSrc    = image.src;
  image.lastSrcset = image.srcset;

  const sibSource  = getPictureSourcesToUpdate(image);

  if (sibSource.length) {
    sibSource.forEach(sib => {
      sib.lastSrcset = sib.srcset;
      sib.lastSrc = sib.src;
    });
  }
};

const resetPreviewed = node => {
  if (node.lastSrc)
    node.src = node.lastSrc;

  if (node.lastSrcset)
    node.srcset = node.lastSrcset;

  const sources = getPictureSourcesToUpdate(node);
  if (sources.length)
    sources.forEach(source => {
      if (source.lastSrcset)
        source.srcset = source.lastSrcset;
      if (source.lastSrc)
        source.src = source.lastSrc;
    });

  if (node.lastBackgroundImage)
    node.style.backgroundImage = node.lastBackgroundImage;

  clearDragHistory(node);
};

const clearDragHistory = node => {
  ['lastSrc','lastSrcset','lastBackgroundImage'].forEach(prop =>
    node[prop] = null);

  sources = getPictureSourcesToUpdate(node);

  if (sources){
    sources.forEach(source => {
      source.lastSrcset = null;
      source.lastSrc = null;
    });
  }
};

const isFileEvent = e =>
  e.dataTransfer.types.some(type => type === 'Files');

/**
 * @author Georgegriff@ (George Griffiths)
 * License Apache-2.0
 */

/**
* Finds first matching elements on the page that may be in a shadow root using a complex selector of n-depth
*
* Don't have to specify all shadow roots to button, tree is travered to find the correct element
*
* Example querySelectorAllDeep('downloads-item:nth-child(4) #remove');
*
* Example should work on chrome://downloads outputting the remove button inside of a download card component
*
* Example find first active download link element querySelectorDeep('#downloads-list .is-active a[href^="https://"]');
*
* Another example querySelectorAllDeep('#downloads-list div#title-area + a');
e.g.
*/
function querySelectorAllDeep(selector, root = document) {
    return _querySelectorDeep(selector, true, root);
}

function _querySelectorDeep(selector, findMany, root) {
    let lightElement = root.querySelector(selector);

    if (document.head.createShadowRoot || document.head.attachShadow) {
        // no need to do any special if selector matches something specific in light-dom
        if (!findMany && lightElement) {
            return lightElement;
        }

        // split on commas because those are a logical divide in the operation
        const selectionsToMake = splitByCharacterUnlessQuoted(selector, ',');

        return selectionsToMake.reduce((acc, minimalSelector) => {
            // if not finding many just reduce the first match
            if (!findMany && acc) {
                return acc;
            }
            // do best to support complex selectors and split the query
            const splitSelector = splitByCharacterUnlessQuoted(minimalSelector
                    //remove white space at start of selector
                    .replace(/^\s+/g, '')
                    .replace(/\s*([>+~]+)\s*/g, '$1'), ' ')
                // filter out entry white selectors
                .filter((entry) => !!entry);
            const possibleElementsIndex = splitSelector.length - 1;
            const possibleElements = collectAllElementsDeep(splitSelector[possibleElementsIndex], root);
            const findElements = findMatchingElement(splitSelector, possibleElementsIndex, root);
            if (findMany) {
                acc = acc.concat(possibleElements.filter(findElements));
                return acc;
            } else {
                acc = possibleElements.find(findElements);
                return acc || null;
            }
        }, findMany ? [] : null);


    } else {
        if (!findMany) {
            return lightElement;
        } else {
            return root.querySelectorAll(selector);
        }
    }

}

function findMatchingElement(splitSelector, possibleElementsIndex, root) {
    return (element) => {
        let position = possibleElementsIndex;
        let parent = element;
        let foundElement = false;
        while (parent) {
            const foundMatch = parent.matches(splitSelector[position]);
            if (foundMatch && position === 0) {
                foundElement = true;
                break;
            }
            if (foundMatch) {
                position--;
            }
            parent = findParentOrHost(parent, root);
        }
        return foundElement;
    };

}

function splitByCharacterUnlessQuoted(selector, character) {
    return selector.match(/\\?.|^$/g).reduce((p, c) => {
        if (c === '"' && !p.sQuote) {
            p.quote ^= 1;
            p.a[p.a.length - 1] += c;
        } else if (c === '\'' && !p.quote) {
            p.sQuote ^= 1;
            p.a[p.a.length - 1] += c;

        } else if (!p.quote && !p.sQuote && c === character) {
            p.a.push('');
        } else {
            p.a[p.a.length - 1] += c;
        }
        return p;
    }, { a: [''] }).a;
}


function findParentOrHost(element, root) {
    const parentNode = element.parentNode;
    return (parentNode && parentNode.host && parentNode.nodeType === 11) ? parentNode.host : parentNode === root ? null : parentNode;
}

/**
 * Finds all elements on the page, inclusive of those within shadow roots.
 * @param {string=} selector Simple selector to filter the elements by. e.g. 'a', 'div.main'
 * @return {!Array<string>} List of anchor hrefs.
 * @author ebidel@ (Eric Bidelman)
 * License Apache-2.0
 */
function collectAllElementsDeep(selector = null, root) {
    const allElements = [];

    const findAllElements = function(nodes) {
        for (let i = 0, el; el = nodes[i]; ++i) {
            allElements.push(el);
            // If the element has a shadow root, dig deeper.
            if (el.shadowRoot) {
                findAllElements(el.shadowRoot.querySelectorAll('*'));
            }
        }
    };
    if(root.shadowRoot) {
        findAllElements(root.shadowRoot.querySelectorAll('*'));
    }
    findAllElements(root.querySelectorAll('*'));

    return selector ? allElements.filter(el => el.matches(selector)) : allElements;
}

const commands = [
  'empty page',
  'blank page',
  'clear canvas',
];

function BlankPagePlugin() {
  document
    .querySelectorAll('body > *:not(vis-bug):not(script)')
    .forEach(node => node.remove());
}

const commands$1 = [
  'barrel roll',
  'do a barrel roll',
];

async function BarrelRollPlugin() {
  document.body.style.transformOrigin = 'center 50vh';
  
  await document.body.animate([
    { transform: 'rotateZ(0)' },
    { transform: 'rotateZ(1turn)' },
  ], { duration: 1500 }).finished;

  document.body.style.transformOrigin = '';
}

const commands$2 = [
  'pesticide',
];

async function PesticidePlugin() {
  await loadStyles(['https://unpkg.com/pesticide@1.3.1/css/pesticide.min.css']);
}

const commands$3 = [
  'trashy',
  'construct',
];

async function ConstructPlugin() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/t7/construct.css@master/css/construct.boxes.css']);
}

const commands$4 = [
  'debug trashy',
  'debug construct',
];

async function ConstructDebugPlugin() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/t7/construct.css@master/css/construct.debug.css']);
}

const commands$5 = [
  'wireframe',
  'blueprint',
];

async function WireframePlugin() {
  const styles = `
    *:not(path):not(g) {
      color: hsla(210, 100%, 100%, 0.9) !important;
      background: hsla(210, 100%, 50%, 0.5) !important;
      outline: solid 0.25rem hsla(210, 100%, 100%, 0.5) !important;
      box-shadow: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
}

const commands$6 = [
  'skeleton',
  'outline',
];

async function SkeletonPlugin() {
  const styles = `
    *:not(path):not(g) {
      color: hsl(0, 0%, 0%) !important;
      text-shadow: none !important;
      background: hsl(0, 0%, 100%) !important;
      outline: 1px solid hsla(0, 0%, 0%, 0.5) !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
}

// https://gist.github.com/addyosmani/fd3999ea7fce242756b1
const commands$7 = [
  'tag debugger',
  'osmani',
];

async function TagDebuggerPlugin() {
  for (i = 0; A = document.querySelectorAll('*')[i++];)
    A.style.outline = `solid hsl(${(A+A).length*9},99%,50%) 1px`;
}

// http://heydonworks.com/revenge_css_bookmarklet/

const commands$8 = [
  'revenge',
  'revenge.css',
  'heydon',
];

async function RevengePlugin() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/Heydon/REVENGE.CSS@master/revenge.css']);
}

const commands$9 = [
  'tota11y',
];

async function Tota11yPlugin() {
  await import('https://cdnjs.cloudflare.com/ajax/libs/tota11y/0.1.6/tota11y.min.js');
}

const commandsToHash = (plugin_commands, plugin_fn) =>
  plugin_commands.reduce((commands$$1, command) =>
    Object.assign(commands$$1, {[`/${command}`]:plugin_fn})
  , {});

const PluginRegistry = new Map(Object.entries({
  ...commandsToHash(commands, BlankPagePlugin),
  ...commandsToHash(commands$1, BarrelRollPlugin),
  ...commandsToHash(commands$2, PesticidePlugin),
  ...commandsToHash(commands$3, ConstructPlugin),
  ...commandsToHash(commands$4, ConstructDebugPlugin),
  ...commandsToHash(commands$5, WireframePlugin),
  ...commandsToHash(commands$6, SkeletonPlugin),
  ...commandsToHash(commands$7, TagDebuggerPlugin),
  ...commandsToHash(commands$8, RevengePlugin),
  ...commandsToHash(commands$9, Tota11yPlugin),
}));

const PluginHints = [
  commands[0],
  commands$1[0],
  commands$2[0],
  commands$3[0],
  commands$4[0],
  commands$5[0],
  commands$6[0],
  commands$7[0],
  commands$8[0],
  commands$9[0],
].map(command => `/${command}`);

let SelectorEngine;

// create input
const search_base = document.createElement('div');
search_base.classList.add('search');
search_base.innerHTML = `
  <input list="visbug-plugins" type="text" placeholder="ex: images, .btn, button, text, ..."/>
  <datalist id="visbug-plugins">
    ${PluginHints.reduce((options, command) =>
      options += `<option value="${command}">plugin</option>`
    , '')}
    <option value="h1, h2, h3, .get-multiple">example</option>
    <option value="nav > a:first-child">example</option>
    <option value="#get-by-id">example</option>
    <option value=".get-by.class-names">example</option>
    <option value="images">alias</option>
    <option value="text">alias</option>
  </datalist>
`;

const search$1        = $(search_base);
const searchInput   = $('input', search_base);

const showSearchBar = () => search$1.attr('style', 'display:block');
const hideSearchBar = () => search$1.attr('style', 'display:none');
const stopBubbling  = e => e.key != 'Escape' && e.stopPropagation();

function Search(node) {
  if (node) node[0].appendChild(search$1[0]);

  const onQuery = e => {
    e.preventDefault();
    e.stopPropagation();

    const query = e.target.value;

    window.requestIdleCallback(_ =>
      queryPage(query));
  };

  searchInput.on('input', onQuery);
  searchInput.on('keydown', stopBubbling);
  // searchInput.on('blur', hideSearchBar)

  showSearchBar();
  searchInput[0].focus();

  // hotkeys('escape,esc', (e, handler) => {
  //   hideSearchBar()
  //   hotkeys.unbind('escape,esc')
  // })

  return () => {
    hideSearchBar();
    searchInput.off('oninput', onQuery);
    searchInput.off('keydown', stopBubbling);
    searchInput.off('blur', hideSearchBar);
  }
}

function provideSelectorEngine(Engine) {
  SelectorEngine = Engine;
}

function queryPage(query, fn) {
  // todo: should stash a cleanup method to be called when query doesnt match
  if (PluginRegistry.has(query))
    return PluginRegistry.get(query)(query)

  if (query == 'links')     query = 'a';
  if (query == 'buttons')   query = 'button';
  if (query == 'images')    query = 'img';
  if (query == 'text')      query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd';

  if (!query) return SelectorEngine.unselect_all()
  if (query == '.' || query == '#' || query.trim().endsWith(',')) return

  try {
    let matches = querySelectorAllDeep(query + ':not(vis-bug):not(script):not(hotkey-map):not(.visbug-metatip):not(visbug-label):not(visbug-handles)');
    if (!matches.length) matches = querySelectorAllDeep(query);
    if (!fn) SelectorEngine.unselect_all();
    if (matches.length)
      matches.forEach(el =>
        fn
          ? fn(el)
          : SelectorEngine.select(el));
  }
  catch (err) {}
}

const state = {
  distances:  [],
  target:     null,
};

function createMeasurements({$anchor, $target}) {
  if (state.target == $target && state.distances.length) return
  else state.target = $target;

  if (state.distances.length) clearMeasurements();

  const anchorBounds = $anchor.getBoundingClientRect();
  const targetBounds = $target.getBoundingClientRect();

  const measurements = [];

  // right
  if (anchorBounds.right < targetBounds.left) {
    measurements.push({
      x: anchorBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: targetBounds.left - anchorBounds.right,
      q: 'right',
    });
  }
  if (anchorBounds.right < targetBounds.right && anchorBounds.right > targetBounds.left) {
    measurements.push({
      x: anchorBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: targetBounds.right - anchorBounds.right,
      q: 'right',
    });
  }

  // left
  if (anchorBounds.left > targetBounds.right) {
    measurements.push({
      x: window.innerWidth - anchorBounds.left,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: anchorBounds.left - targetBounds.right,
      q: 'left',
    });
  }
  if (anchorBounds.left > targetBounds.left && anchorBounds.left < targetBounds.right) {
    measurements.push({
      x: window.innerWidth - anchorBounds.left,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: anchorBounds.left - targetBounds.left,
      q: 'left',
    });
  }

  // top
  if (anchorBounds.top > targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: targetBounds.bottom,
      d: anchorBounds.top - targetBounds.bottom,
      q: 'top',
      v: true,
    });
  }
  if (anchorBounds.top > targetBounds.top && anchorBounds.top < targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: targetBounds.top,
      d: anchorBounds.top - targetBounds.top,
      q: 'top',
      v: true,
    });
  }

  // bottom
  if (anchorBounds.bottom < targetBounds.top) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: anchorBounds.bottom,
      d: targetBounds.top - anchorBounds.bottom,
      q: 'bottom',
      v: true,
    });
  }
  if (anchorBounds.bottom < targetBounds.bottom && anchorBounds.bottom > targetBounds.top) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: anchorBounds.bottom,
      d: targetBounds.bottom - anchorBounds.bottom,
      q: 'bottom',
      v: true,
    });
  }

  // inside left/right
  if (anchorBounds.right > targetBounds.right && anchorBounds.left < targetBounds.left) {
    measurements.push({
      x: window.innerWidth - anchorBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: anchorBounds.right - targetBounds.right,
      q: 'left',
    });
    measurements.push({
      x: anchorBounds.left,
      y: anchorBounds.top + (anchorBounds.height / 2) - 3,
      d: targetBounds.left - anchorBounds.left,
      q: 'right',
    });
  }

  // inside top/right
  if (anchorBounds.top < targetBounds.top && anchorBounds.bottom > targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: anchorBounds.top,
      d: targetBounds.top - anchorBounds.top,
      q: 'bottom',
      v: true,
    });
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - 3,
      y: targetBounds.bottom,
      d: anchorBounds.bottom - targetBounds.bottom,
      q: 'top',
      v: true,
    });
  }

  // create custom elements for all created measurements
  measurements
    .map(measurement => Object.assign(measurement, {
      d: Math.round(measurement.d.toFixed(1) * 100) / 100
    }))
    .forEach(measurement => {
      const $measurement = document.createElement('visbug-distance');

      $measurement.position = {
        line_model:     measurement,
        node_label_id:  state.distances.length,
      };

      document.body.appendChild($measurement);
      state.distances[state.distances.length] = $measurement;
    });
}

function clearMeasurements() {
  state.distances.forEach(node => node.remove());
  state.distances = [];
}

const key_events$2 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1);

const command_events$1 = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`;

function Padding(visbug) {
  hotkeys(key_events$2, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();
    padElement(visbug.selection(), handler.key);
  });

  hotkeys(command_events$1, (e, handler) => {
    e.preventDefault();
    padAllElementSides(visbug.selection(), handler.key);
  });

  visbug.onSelectedUpdate(paintBackgrounds$1);

  return () => {
    hotkeys.unbind(key_events$2);
    hotkeys.unbind(command_events$1);
    hotkeys.unbind('up,down,left,right'); // bug in lib?
    visbug.removeSelectedCallback(paintBackgrounds$1);
    removeBackgrounds$1(visbug.selection());
  }
}

function padElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'padding' + getSide(direction),
      current:  parseInt(getStyle(el, 'padding' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        padding: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount
      }))
    .forEach(({el, style, padding}) =>
      el.style[style] = `${padding < 0 ? 0 : padding}px`);
}

function padAllElementSides(els, keycommand) {
  const combo = keycommand.split('+');
  let spoof = '';

  if (combo.includes('shift'))  spoof = 'shift+' + spoof;
  if (combo.includes('down'))   spoof = 'alt+' + spoof;

  'up,down,left,right'.split(',')
    .forEach(side => padElement(els, spoof + side));
}

function paintBackgrounds$1(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id');

    document
      .querySelector(`visbug-label[data-label-id="${label_id}"]`)
      .style.opacity = 0;

    document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .backdrop = {
        element:  createPaddingVisual(el),
        update:   createPaddingVisual,
      };
  });
}

function removeBackgrounds$1(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id');
    const label = document.querySelector(`visbug-label[data-label-id="${label_id}"]`);
    const boxmodel = document.querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .$shadow.querySelector('visbug-boxmodel');

    label.style.opacity = 1;
    if (boxmodel) boxmodel.remove();
  });
}

function createPaddingVisual(el, hover = false) {
  const bounds            = el.getBoundingClientRect();
  const styleOM           = el.computedStyleMap();
  const calculatedStyle   = getStyle(el, 'padding');
  const boxdisplay        = document.createElement('visbug-boxmodel');

  if (calculatedStyle !== '0px') {
    const sides = {
      top:    styleOM.get('padding-top').value,
      right:  styleOM.get('padding-right').value,
      bottom: styleOM.get('padding-bottom').value,
      left:   styleOM.get('padding-left').value,
    };

    Object.entries(sides).forEach(([side, val]) => {
      if (typeof val !== 'number')
        val = parseInt(getStyle(el, 'padding'+'-'+side).slice(0, -2));

      sides[side] = Math.round(val.toFixed(1) * 100) / 100;
    });

    boxdisplay.position = { 
      mode: 'padding',
      color: hover ? 'purple' : 'pink',
      bounds, 
      sides,
    };
  }

  return boxdisplay
}

/**
 * Take input from [0, n] and return it as [0, 1]
 * @hidden
 */
function bound01(n, max) {
    if (isOnePointZero(n)) {
        n = '100%';
    }
    const processPercent = isPercentage(n);
    n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(String(n * max), 10) / 100;
    }
    // Handle floating point rounding errors
    if (Math.abs(n - max) < 0.000001) {
        return 1;
    }
    // Convert into [0, 1] range if it isn't already
    if (max === 360) {
        // If n is a hue given in degrees,
        // wrap around out-of-range values into [0, 360] range
        // then convert into [0, 1].
        n = (n < 0 ? n % max + max : n % max) / parseFloat(String(max));
    }
    else {
        // If n not a hue given in degrees
        // Convert into [0, 1] range if it isn't already.
        n = (n % max) / parseFloat(String(max));
    }
    return n;
}
/**
 * Force a number between 0 and 1
 * @hidden
 */
function clamp01(val) {
    return Math.min(1, Math.max(0, val));
}
/**
 * Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
 * <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
 * @hidden
 */
function isOnePointZero(n) {
    return typeof n === 'string' && n.indexOf('.') !== -1 && parseFloat(n) === 1;
}
/**
 * Check to see if string passed in is a percentage
 * @hidden
 */
function isPercentage(n) {
    return typeof n === 'string' && n.indexOf('%') !== -1;
}
/**
 * Return a valid alpha value [0,1] with all invalid values being set to 1
 * @hidden
 */
function boundAlpha(a) {
    a = parseFloat(a);
    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }
    return a;
}
/**
 * Replace a decimal with it's percentage value
 * @hidden
 */
function convertToPercentage(n) {
    if (n <= 1) {
        return +n * 100 + '%';
    }
    return n;
}
/**
 * Force a hex value to have 2 characters
 * @hidden
 */
function pad2(c) {
    return c.length === 1 ? '0' + c : '' + c;
}

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>
/**
 * Handle bounds / percentage checking to conform to CSS color spec
 * <http://www.w3.org/TR/css3-color/>
 * *Assumes:* r, g, b in [0, 255] or [0, 1]
 * *Returns:* { r, g, b } in [0, 255]
 */
function rgbToRgb(r, g, b) {
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255,
    };
}
/**
 * Converts an RGB color value to HSL.
 * *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
 * *Returns:* { h, s, l } in [0,1]
 */
function rgbToHsl(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h, s, l };
}
/**
 * Converts an HSL color value to RGB.
 *
 * *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
 * *Returns:* { r, g, b } in the set [0, 255]
 */
function hslToRgb(h, s, l) {
    let r;
    let g;
    let b;
    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);
    function hue2rgb(p, q, t) {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
}
/**
 * Converts an RGB color value to HSV
 *
 * *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
 * *Returns:* { h, s, v } in [0,1]
 */
function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // achromatic
    }
    else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}
/**
 * Converts an HSV color value to RGB.
 *
 * *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
 * *Returns:* { r, g, b } in the set [0, 255]
 */
function hsvToRgb(h, s, v) {
    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    const mod = i % 6;
    const r = [v, q, p, p, t, v][mod];
    const g = [t, v, v, q, p, p][mod];
    const b = [p, p, t, v, v, q][mod];
    return { r: r * 255, g: g * 255, b: b * 255 };
}
/**
 * Converts an RGB color to hex
 *
 * Assumes r, g, and b are contained in the set [0, 255]
 * Returns a 3 or 6 character hex
 */
function rgbToHex(r, g, b, allow3Char) {
    const hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
    ];
    // Return a 3 character hex if possible
    if (allow3Char &&
        hex[0].charAt(0) === hex[0].charAt(1) &&
        hex[1].charAt(0) === hex[1].charAt(1) &&
        hex[2].charAt(0) === hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }
    return hex.join('');
}
/**
 * Converts an RGBA color plus alpha transparency to hex
 *
 * Assumes r, g, b are contained in the set [0, 255] and
 * a in [0, 1]. Returns a 4 or 8 character rgba hex
 */
function rgbaToHex(r, g, b, a, allow4Char) {
    const hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
        pad2(convertDecimalToHex(a)),
    ];
    // Return a 4 character hex if possible
    if (allow4Char &&
        hex[0].charAt(0) === hex[0].charAt(1) &&
        hex[1].charAt(0) === hex[1].charAt(1) &&
        hex[2].charAt(0) === hex[2].charAt(1) &&
        hex[3].charAt(0) === hex[3].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    }
    return hex.join('');
}
/** Converts a decimal to a hex value */
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
/** Converts a hex value to a decimal */
function convertHexToDecimal(h) {
    return parseIntFromHex(h) / 255;
}
/** Parse a base-16 hex value into a base-10 integer */
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// https://github.com/bahamas10/css-color-names/blob/master/css-color-names.json
/**
 * @hidden
 */
const names = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
};

/**
 * Given a string or object, convert that input to RGB
 *
 * Possible string inputs:
 * ```
 * "red"
 * "#f00" or "f00"
 * "#ff0000" or "ff0000"
 * "#ff000000" or "ff000000"
 * "rgb 255 0 0" or "rgb (255, 0, 0)"
 * "rgb 1.0 0 0" or "rgb (1, 0, 0)"
 * "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
 * "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
 * "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
 * "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
 * "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
 * ```
 */
function inputToRGB(color) {
    let rgb = { r: 0, g: 0, b: 0 };
    let a = 1;
    let s = null;
    let v = null;
    let l = null;
    let ok = false;
    let format = false;
    if (typeof color === 'string') {
        color = stringInputToObject(color);
    }
    if (typeof color === 'object') {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === '%' ? 'prgb' : 'rgb';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
            s = convertToPercentage(color.s);
            v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, s, v);
            ok = true;
            format = 'hsv';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
            s = convertToPercentage(color.s);
            l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, s, l);
            ok = true;
            format = 'hsl';
        }
        if (color.hasOwnProperty('a')) {
            a = color.a;
        }
    }
    a = boundAlpha(a);
    return {
        ok,
        format: color.format || format,
        r: Math.min(255, Math.max(rgb.r, 0)),
        g: Math.min(255, Math.max(rgb.g, 0)),
        b: Math.min(255, Math.max(rgb.b, 0)),
        a,
    };
}
// <http://www.w3.org/TR/css3-values/#integers>
const CSS_INTEGER = '[-\\+]?\\d+%?';
// <http://www.w3.org/TR/css3-values/#number-value>
const CSS_NUMBER = '[-\\+]?\\d*\\.\\d+%?';
// Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
const CSS_UNIT = `(?:${CSS_NUMBER})|(?:${CSS_INTEGER})`;
// Actual matching.
// Parentheses and commas are optional, but not required.
// Whitespace can take the place of commas or opening paren
const PERMISSIVE_MATCH3 = `[\\s|\\(]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})\\s*\\)?`;
const PERMISSIVE_MATCH4 = `[\\s|\\(]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})\\s*\\)?`;
const matchers = {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp('rgb' + PERMISSIVE_MATCH3),
    rgba: new RegExp('rgba' + PERMISSIVE_MATCH4),
    hsl: new RegExp('hsl' + PERMISSIVE_MATCH3),
    hsla: new RegExp('hsla' + PERMISSIVE_MATCH4),
    hsv: new RegExp('hsv' + PERMISSIVE_MATCH3),
    hsva: new RegExp('hsva' + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
};
/**
 * Permissive string parsing.  Take in a number of formats, and output an object
 * based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
 */
function stringInputToObject(color) {
    color = color.trim().toLowerCase();
    if (color.length === 0) {
        return false;
    }
    let named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: 'name' };
    }
    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    let match = matchers.rgb.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    match = matchers.rgba.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    match = matchers.hsl.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    match = matchers.hsla.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    match = matchers.hsv.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    match = matchers.hsva.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    match = matchers.hex8.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            a: convertHexToDecimal(match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex6.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    match = matchers.hex4.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            a: convertHexToDecimal(match[4] + match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex3.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    return false;
}
/**
 * Check to see if it looks like a CSS unit
 * (see `matchers` above for definition).
 */
function isValidCSSUnit(color) {
    return !!matchers.CSS_UNIT.exec(String(color));
}

class TinyColor {
    constructor(color = '', opts = {}) {
        // If input is already a tinycolor, return itself
        if (color instanceof TinyColor) {
            return color;
        }
        this.originalInput = color;
        const rgb = inputToRGB(color);
        this.originalInput = color;
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
        this.a = rgb.a;
        this.roundA = Math.round(100 * this.a) / 100;
        this.format = opts.format || rgb.format;
        this.gradientType = opts.gradientType;
        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this.r < 1) {
            this.r = Math.round(this.r);
        }
        if (this.g < 1) {
            this.g = Math.round(this.g);
        }
        if (this.b < 1) {
            this.b = Math.round(this.b);
        }
        this.isValid = rgb.ok;
    }
    isDark() {
        return this.getBrightness() < 128;
    }
    isLight() {
        return !this.isDark();
    }
    /**
     * Returns the perceived brightness of the color, from 0-255.
     */
    getBrightness() {
        // http://www.w3.org/TR/AERT#color-contrast
        const rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }
    /**
     * Returns the perceived luminance of a color, from 0-1.
     */
    getLuminance() {
        // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        const rgb = this.toRgb();
        let R;
        let G;
        let B;
        const RsRGB = rgb.r / 255;
        const GsRGB = rgb.g / 255;
        const BsRGB = rgb.b / 255;
        if (RsRGB <= 0.03928) {
            R = RsRGB / 12.92;
        }
        else {
            R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
        }
        if (GsRGB <= 0.03928) {
            G = GsRGB / 12.92;
        }
        else {
            G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
        }
        if (BsRGB <= 0.03928) {
            B = BsRGB / 12.92;
        }
        else {
            B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }
    /**
     * Sets the alpha value on the current color.
     *
     * @param alpha - The new alpha value. The accepted range is 0-1.
     */
    setAlpha(alpha) {
        this.a = boundAlpha(alpha);
        this.roundA = Math.round(100 * this.a) / 100;
        return this;
    }
    /**
     * Returns the object as a HSVA object.
     */
    toHsv() {
        const hsv = rgbToHsv(this.r, this.g, this.b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this.a };
    }
    /**
     * Returns the hsva values interpolated into a string with the following format:
     * "hsva(xxx, xxx, xxx, xx)".
     */
    toHsvString() {
        const hsv = rgbToHsv(this.r, this.g, this.b);
        const h = Math.round(hsv.h * 360);
        const s = Math.round(hsv.s * 100);
        const v = Math.round(hsv.v * 100);
        return this.a === 1 ? `hsv(${h}, ${s}%, ${v}%)` : `hsva(${h}, ${s}%, ${v}%, ${this.roundA})`;
    }
    /**
     * Returns the object as a HSLA object.
     */
    toHsl() {
        const hsl = rgbToHsl(this.r, this.g, this.b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this.a };
    }
    /**
     * Returns the hsla values interpolated into a string with the following format:
     * "hsla(xxx, xxx, xxx, xx)".
     */
    toHslString() {
        const hsl = rgbToHsl(this.r, this.g, this.b);
        const h = Math.round(hsl.h * 360);
        const s = Math.round(hsl.s * 100);
        const l = Math.round(hsl.l * 100);
        return this.a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${this.roundA})`;
    }
    /**
     * Returns the hex value of the color.
     * @param allow3Char will shorten hex value to 3 char if possible
     */
    toHex(allow3Char = false) {
        return rgbToHex(this.r, this.g, this.b, allow3Char);
    }
    /**
     * Returns the hex value of the color -with a # appened.
     * @param allow3Char will shorten hex value to 3 char if possible
     */
    toHexString(allow3Char = false) {
        return '#' + this.toHex(allow3Char);
    }
    /**
     * Returns the hex 8 value of the color.
     * @param allow4Char will shorten hex value to 4 char if possible
     */
    toHex8(allow4Char = false) {
        return rgbaToHex(this.r, this.g, this.b, this.a, allow4Char);
    }
    /**
     * Returns the hex 8 value of the color -with a # appened.
     * @param allow4Char will shorten hex value to 4 char if possible
     */
    toHex8String(allow4Char = false) {
        return '#' + this.toHex8(allow4Char);
    }
    /**
     * Returns the object as a RGBA object.
     */
    toRgb() {
        return {
            r: Math.round(this.r),
            g: Math.round(this.g),
            b: Math.round(this.b),
            a: this.a,
        };
    }
    /**
     * Returns the RGBA values interpolated into a string with the following format:
     * "RGBA(xxx, xxx, xxx, xx)".
     */
    toRgbString() {
        const r = Math.round(this.r);
        const g = Math.round(this.g);
        const b = Math.round(this.b);
        return this.a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${this.roundA})`;
    }
    /**
     * Returns the object as a RGBA object.
     */
    toPercentageRgb() {
        const fmt = (x) => Math.round(bound01(x, 255) * 100) + '%';
        return {
            r: fmt(this.r),
            g: fmt(this.g),
            b: fmt(this.b),
            a: this.a,
        };
    }
    /**
     * Returns the RGBA relative values interpolated into a string
     */
    toPercentageRgbString() {
        const rnd = (x) => Math.round(bound01(x, 255) * 100);
        return this.a === 1
            ? `rgb(${rnd(this.r)}%, ${rnd(this.g)}%, ${rnd(this.b)}%)`
            : `rgba(${rnd(this.r)}%, ${rnd(this.g)}%, ${rnd(this.b)}%, ${this.roundA})`;
    }
    /**
     * The 'real' name of the color -if there is one.
     */
    toName() {
        if (this.a === 0) {
            return 'transparent';
        }
        if (this.a < 1) {
            return false;
        }
        const hex = '#' + rgbToHex(this.r, this.g, this.b, false);
        for (const key of Object.keys(names)) {
            if (names[key] === hex) {
                return key;
            }
        }
        return false;
    }
    /**
     * String representation of the color.
     *
     * @param format - The format to be used when displaying the string representation.
     */
    toString(format) {
        const formatSet = !!format;
        format = format || this.format;
        let formattedString = false;
        const hasAlpha = this.a < 1 && this.a >= 0;
        const needsAlphaFormat = !formatSet && hasAlpha && (format.startsWith('hex') || format === 'name');
        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === 'name' && this.a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === 'rgb') {
            formattedString = this.toRgbString();
        }
        if (format === 'prgb') {
            formattedString = this.toPercentageRgbString();
        }
        if (format === 'hex' || format === 'hex6') {
            formattedString = this.toHexString();
        }
        if (format === 'hex3') {
            formattedString = this.toHexString(true);
        }
        if (format === 'hex4') {
            formattedString = this.toHex8String(true);
        }
        if (format === 'hex8') {
            formattedString = this.toHex8String();
        }
        if (format === 'name') {
            formattedString = this.toName();
        }
        if (format === 'hsl') {
            formattedString = this.toHslString();
        }
        if (format === 'hsv') {
            formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
    }
    clone() {
        return new TinyColor(this.toString());
    }
    /**
     * Lighten the color a given amount. Providing 100 will always return white.
     * @param amount - valid between 1-100
     */
    lighten(amount = 10) {
        const hsl = this.toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    }
    /**
     * Brighten the color a given amount, from 0 to 100.
     * @param amount - valid between 1-100
     */
    brighten(amount = 10) {
        const rgb = this.toRgb();
        rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
        rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
        rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
        return new TinyColor(rgb);
    }
    /**
     * Darken the color a given amount, from 0 to 100.
     * Providing 100 will always return black.
     * @param amount - valid between 1-100
     */
    darken(amount = 10) {
        const hsl = this.toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    }
    /**
     * Mix the color with pure white, from 0 to 100.
     * Providing 0 will do nothing, providing 100 will always return white.
     * @param amount - valid between 1-100
     */
    tint(amount = 10) {
        return this.mix('white', amount);
    }
    /**
     * Mix the color with pure black, from 0 to 100.
     * Providing 0 will do nothing, providing 100 will always return black.
     * @param amount - valid between 1-100
     */
    shade(amount = 10) {
        return this.mix('black', amount);
    }
    /**
     * Desaturate the color a given amount, from 0 to 100.
     * Providing 100 will is the same as calling greyscale
     * @param amount - valid between 1-100
     */
    desaturate(amount = 10) {
        const hsl = this.toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    }
    /**
     * Saturate the color a given amount, from 0 to 100.
     * @param amount - valid between 1-100
     */
    saturate(amount = 10) {
        const hsl = this.toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    }
    /**
     * Completely desaturates a color into greyscale.
     * Same as calling `desaturate(100)`
     */
    greyscale() {
        return this.desaturate(100);
    }
    /**
     * Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
     * Values outside of this range will be wrapped into this range.
     */
    spin(amount) {
        const hsl = this.toHsl();
        const hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return new TinyColor(hsl);
    }
    mix(color, amount = 50) {
        const rgb1 = this.toRgb();
        const rgb2 = new TinyColor(color).toRgb();
        const p = amount / 100;
        const rgba = {
            r: (rgb2.r - rgb1.r) * p + rgb1.r,
            g: (rgb2.g - rgb1.g) * p + rgb1.g,
            b: (rgb2.b - rgb1.b) * p + rgb1.b,
            a: (rgb2.a - rgb1.a) * p + rgb1.a,
        };
        return new TinyColor(rgba);
    }
    analogous(results = 6, slices = 30) {
        const hsl = this.toHsl();
        const part = 360 / slices;
        const ret = [this];
        for (hsl.h = (hsl.h - ((part * results) >> 1) + 720) % 360; --results;) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(new TinyColor(hsl));
        }
        return ret;
    }
    /**
     * taken from https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js
     */
    complement() {
        const hsl = this.toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return new TinyColor(hsl);
    }
    monochromatic(results = 6) {
        const hsv = this.toHsv();
        const h = hsv.h;
        const s = hsv.s;
        let v = hsv.v;
        const res = [];
        const modification = 1 / results;
        while (results--) {
            res.push(new TinyColor({ h, s, v }));
            v = (v + modification) % 1;
        }
        return res;
    }
    splitcomplement() {
        const hsl = this.toHsl();
        const h = hsl.h;
        return [
            this,
            new TinyColor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l }),
            new TinyColor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l }),
        ];
    }
    triad() {
        return this.polyad(3);
    }
    tetrad() {
        return this.polyad(4);
    }
    /**
     * Get polyad colors, like (for 1, 2, 3, 4, 5, 6, 7, 8, etc...)
     * monad, dyad, triad, tetrad, pentad, hexad, heptad, octad, etc...
     */
    polyad(n) {
        const hsl = this.toHsl();
        const h = hsl.h;
        const result = [this];
        const increment = 360 / n;
        for (let i = 1; i < n; i++) {
            result.push(new TinyColor({ h: (h + i * increment) % 360, s: hsl.s, l: hsl.l }));
        }
        return result;
    }
    /**
     * compare color vs current color
     */
    equals(color) {
        return this.toRgbString() === new TinyColor(color).toRgbString();
    }
}

// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)
/**
 * AKA `contrast`
 *
 * Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
 */
function readability(color1, color2) {
    const c1 = new TinyColor(color1);
    const c2 = new TinyColor(color2);
    return ((Math.max(c1.getLuminance(), c2.getLuminance()) + 0.05) /
        (Math.min(c1.getLuminance(), c2.getLuminance()) + 0.05));
}
/**
 * Ensure that foreground and background color combinations meet WCAG2 guidelines.
 * The third argument is an object.
 *      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
 *      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
 * If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.
 *
 * Example
 * ```ts
 * new TinyColor().isReadable('#000', '#111') => false
 * new TinyColor().isReadable('#000', '#111', { level: 'AA', size: 'large' }) => false
 * ```
 */
function isReadable(color1, color2, wcag2 = { level: 'AA', size: 'small' }) {
    const readabilityLevel = readability(color1, color2);
    switch ((wcag2.level || 'AA') + (wcag2.size || 'small')) {
        case 'AAsmall':
        case 'AAAlarge':
            return readabilityLevel >= 4.5;
        case 'AAlarge':
            return readabilityLevel >= 3;
        case 'AAAsmall':
            return readabilityLevel >= 7;
    }
    return false;
}

const state$1 = {
  active: {
    tip:  null,
    target: null,
  },
  tips: new Map(),
};

const services = {};

function MetaTip({select}) {
  services.selectors = {select};

  $('body').on('mousemove', mouseMove);
  $('body').on('click', togglePinned);

  hotkeys('esc', _ => removeAll());

  restorePinnedTips();

  return () => {
    $('body').off('mousemove', mouseMove);
    $('body').off('click', togglePinned);
    hotkeys.unbind('esc');
    hideAll();
  }
}

const mouseMove = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY);

  if (isOffBounds(target) || target.nodeName === 'VISBUG-METATIP' || target.hasAttribute('data-metatip')) { // aka: mouse out
    if (state$1.active.tip) {
      wipe({
        tip: state$1.active.tip,
        e: {target: state$1.active.target},
      });
      clearActive();
    }
    return
  }

  toggleTargetCursor(e.altKey, target);

  showTip(target, e);
};

function showTip(target, e) {
  if (!state$1.active.tip) { // create
    const tip = render(target);
    document.body.appendChild(tip);

    positionTip(tip, e);
    observe({tip, target});

    state$1.active.tip    = tip;
    state$1.active.target = target;
  }
  else if (target == state$1.active.target) { // update position
    // update position
    positionTip(state$1.active.tip, e);
  }
  else { // update content
    render(target, state$1.active.tip);
    state$1.active.target = target;
    positionTip(state$1.active.tip, e);
  }
}

function positionTip(tip, e) {
  const { north, west } = mouse_quadrant(e);
  const { left, top }   = tip_position(tip, e, north, west);

  tip.style.left  = left;
  tip.style.top   = top;

  tip.style.setProperty('--arrow', north
    ? 'var(--arrow-up)'
    : 'var(--arrow-down)');

  tip.style.setProperty('--shadow-direction', north
    ? 'var(--shadow-up)'
    : 'var(--shadow-down)');

  tip.style.setProperty('--arrow-top', !north
    ? '-7px'
    : 'calc(100% - 1px)');

  tip.style.setProperty('--arrow-left', west
    ? 'calc(100% - 15px - 15px)'
    : '15px');
}

const restorePinnedTips = () => {
  state$1.tips.forEach(({tip}, target) => {
    tip.style.display = 'block';
    render(target, tip);
    observe({tip, target});
  });
};

function hideAll() {
  state$1.tips.forEach(({tip}, target) =>
    tip.style.display = 'none');

  if (state$1.active.tip) {
    state$1.active.tip.remove();
    clearActive();
  }
}

function removeAll() {
  state$1.tips.forEach(({tip}, target) => {
    tip.remove();
    unobserve({tip, target});
  });

  $('[data-metatip]').attr('data-metatip', null);

  state$1.tips.clear();
}

const render = (el, tip = document.createElement('visbug-metatip')) => {
  const { width, height } = el.getBoundingClientRect();
  const styles = getStyles(el)
    .map(style => Object.assign(style, {
      prop: camelToDash(style.prop)
    }))
    .filter(style =>
      style.prop.includes('font-family')
        ? el.matches('h1,h2,h3,h4,h5,h6,p,a,date,caption,button,figcaption,nav,header,footer')
        : true
    )
    .map(style => {
      if (style.prop.includes('color') || style.prop.includes('Color') || style.prop.includes('fill') || style.prop.includes('stroke'))
        style.value = `<span color style="background-color:${style.value};"></span>${new TinyColor(style.value).toHslString()}`;

      if (style.prop.includes('font-family') && style.value.length > 25)
        style.value = style.value.slice(0,25) + '...';

      if (style.prop.includes('grid-template-areas'))
        style.value = style.value.replace(/" "/g, '"<br>"');

      if (style.prop.includes('background-image'))
        style.value = `<a target="_blank" href="${style.value.slice(style.value.indexOf('(') + 2, style.value.length - 2)}">${style.value.slice(0,25) + '...'}</a>`;

      // check if style is inline style, show indicator
      if (el.getAttribute('style') && el.getAttribute('style').includes(style.prop))
        style.value = `<span local-change>${style.value}</span>`;

      return style
    });

  const localModifications = styles.filter(style =>
    el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
      ? 1
      : 0);

  const notLocalModifications = styles.filter(style =>
    el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
      ? 0
      : 1);

  tip.meta = {
    el,
    width,
    height,
    localModifications,
    notLocalModifications,
  };

  return tip
};

const mouse_quadrant = e => ({
  north: e.clientY > window.innerHeight / 2,
  west:  e.clientX > window.innerWidth / 2
});

const tip_position = (node, e, north, west) => ({
  top: `${north
    ? e.pageY - node.clientHeight - 20
    : e.pageY + 25}px`,
  left: `${west
    ? e.pageX - node.clientWidth + 23
    : e.pageX - 21}px`,
});

const handleBlur = ({target}) => {
  if (!target.hasAttribute('data-metatip') && state$1.tips.has(target))
    wipe(state$1.tips.get(target));
};

const wipe = ({tip, e:{target}}) => {
  tip.remove();
  unobserve({tip, target});
  state$1.tips.delete(target);
};

const togglePinned = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY);

  if (e.altKey && !target.hasAttribute('data-metatip')) {
    target.setAttribute('data-metatip', true);
    state$1.tips.set(target, {
      tip: state$1.active.tip,
      e,
    });
    clearActive();
  }
  else if (target.hasAttribute('data-metatip')) {
    target.removeAttribute('data-metatip');
    wipe(state$1.tips.get(target));
  }
};

const linkQueryClicked = ({detail:{ text, activator }}) => {
  if (!text) return

  queryPage('[data-pseudo-select]', el =>
    el.removeAttribute('data-pseudo-select'));

  queryPage(text + ':not([data-selected])', el =>
    activator === 'mouseenter'
      ? el.setAttribute('data-pseudo-select', true)
      : services.selectors.select(el));
};

const linkQueryHoverOut = e => {
  queryPage('[data-pseudo-select]', el =>
    el.removeAttribute('data-pseudo-select'));
};

const toggleTargetCursor = (key, target) =>
  key
    ? target.setAttribute('data-pinhover', true)
    : target.removeAttribute('data-pinhover');

const observe = ({tip, target}) => {
  $(tip).on('query', linkQueryClicked);
  $(tip).on('unquery', linkQueryHoverOut);
  $(target).on('DOMNodeRemoved', handleBlur);
};

const unobserve = ({tip, target}) => {
  $(tip).off('query', linkQueryClicked);
  $(tip).off('unquery', linkQueryHoverOut);
  $(target).off('DOMNodeRemoved', handleBlur);
};

const clearActive = () => {
  state$1.active.tip    = null;
  state$1.active.target = null;
};

const state$2 = {
  active: {
    tip:  null,
    target: null,
  },
  tips: new Map(),
};

function Accessibility() {
  $('body').on('mousemove', mouseMove$1);
  $('body').on('click', togglePinned$1);

  hotkeys('esc', _ => removeAll$1());

  restorePinnedTips$1();

  return () => {
    $('body').off('mousemove', mouseMove$1);
    $('body').off('click', togglePinned$1);
    hotkeys.unbind('esc');
    hideAll$1();
  }
}

const mouseMove$1 = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY);

  if (isOffBounds(target) || target.nodeName === 'VISBUG-ALLYTIP' || target.hasAttribute('data-allytip')) { // aka: mouse out
    if (state$2.active.tip) {
      wipe$1({
        tip: state$2.active.tip,
        e: {target: state$2.active.target},
      });
      clearActive$1();
    }
    return
  }

  toggleTargetCursor$1(e.altKey, target);

  showTip$1(target, e);
};

function showTip$1(target, e) {
  if (!state$2.active.tip) { // create
    const tip = render$1(target);
    document.body.appendChild(tip);

    positionTip$1(tip, e);
    observe$1({tip, target});

    state$2.active.tip    = tip;
    state$2.active.target = target;
  }
  else if (target == state$2.active.target) { // update position
    // update position
    positionTip$1(state$2.active.tip, e);
  }
  else { // update content
    render$1(target, state$2.active.tip);
    state$2.active.target = target;
    positionTip$1(state$2.active.tip, e);
  }
}

function positionTip$1(tip, e) {
  const { north, west } = mouse_quadrant$1(e);
  const {left, top}     = tip_position$1(tip, e, north, west);

  tip.style.left  = left;
  tip.style.top   = top;

  tip.style.setProperty('--arrow', north
    ? 'var(--arrow-up)'
    : 'var(--arrow-down)');

  tip.style.setProperty('--shadow-direction', north
    ? 'var(--shadow-up)'
    : 'var(--shadow-down)');

  tip.style.setProperty('--arrow-top', !north
    ? '-7px'
    : 'calc(100% - 1px)');

  tip.style.setProperty('--arrow-left', west
    ? 'calc(100% - 15px - 15px)'
    : '15px');
}

const restorePinnedTips$1 = () => {
  state$2.tips.forEach(({tip}, target) => {
    tip.style.display = 'block';
    render$1(target, tip);
    observe$1({tip, target});
  });
};

function hideAll$1() {
  state$2.tips.forEach(({tip}, target) =>
    tip.style.display = 'none');

  if (state$2.active.tip) {
    state$2.active.tip.remove();
    clearActive$1();
  }
}

function removeAll$1() {
  state$2.tips.forEach(({tip}, target) => {
    tip.remove();
    unobserve$1({tip, target});
  });

  $('[data-allytip]').attr('data-allytip', null);

  state$2.tips.clear();
}

const render$1 = (el, tip = document.createElement('visbug-ally')) => {
  const contrast_results = determineColorContrast(el);
  const ally_attributes = getA11ys(el);

  ally_attributes.map(ally =>
    ally.prop.includes('alt')
      ? ally.value = `<span text>${ally.value}</span>`
      : ally);

  ally_attributes.map(ally =>
    ally.prop.includes('title')
      ? ally.value = `<span text longform>${ally.value}</span>`
      : ally);

  tip.meta = {
    el,
    ally_attributes,
    contrast_results,
  };

  return tip
};

const determineColorContrast = el => {
  // question: how to know if the current node is actually a black background?
  // question: is there an api for composited values?
  const text      = getStyle(el, 'color');
  const textSize  = getWCAG2TextSize(el);

  let background  = getComputedBackgroundColor(el);

  const [ aa_contrast, aaa_contrast ] = [
    isReadable(background, text, { level: "AA", size: textSize.toLowerCase() }),
    isReadable(background, text, { level: "AAA", size: textSize.toLowerCase() })
  ];

  return `
    <span prop>Color contrast</span>
    <span value contrast>
      <span style="
        background-color:${background};
        color:${text};
      ">${Math.floor(readability(background, text)  * 100) / 100}</span>
    </span>
    <span prop>› AA ${textSize}</span>
    <span value style="${aa_contrast ? 'color:green;' : 'color:red'}">${aa_contrast ? '✓' : '×'}</span>
    <span prop>› AAA ${textSize}</span>
    <span value style="${aaa_contrast ? 'color:green;' : 'color:red'}">${aaa_contrast ? '✓' : '×'}</span>
  `
};

const mouse_quadrant$1 = e => ({
  north: e.clientY > window.innerHeight / 2,
  west:  e.clientX > window.innerWidth / 2
});

const tip_position$1 = (node, e, north, west) => ({
  top: `${north
    ? e.pageY - node.clientHeight - 20
    : e.pageY + 25}px`,
  left: `${west
    ? e.pageX - node.clientWidth + 23
    : e.pageX - 21}px`,
});

const handleBlur$1 = ({target}) => {
  if (!target.hasAttribute('data-allytip') && state$2.tips.has(target))
    wipe$1(state$2.tips.get(target));
};

const wipe$1 = ({tip, e:{target}}) => {
  tip.remove();
  unobserve$1({tip, target});
  state$2.tips.delete(target);
};

const togglePinned$1 = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY);

  if (e.altKey && !target.hasAttribute('data-allytip')) {
    target.setAttribute('data-allytip', true);
    state$2.tips.set(target, {
      tip: state$2.active.tip,
      e,
    });
    clearActive$1();
  }
  else if (target.hasAttribute('data-allytip')) {
    target.removeAttribute('data-allytip');
    wipe$1(state$2.tips.get(target));
  }
};

const toggleTargetCursor$1 = (key, target) =>
  key
    ? target.setAttribute('data-pinhover', true)
    : target.removeAttribute('data-pinhover');

const observe$1 = ({tip, target}) => {
  $(target).on('DOMNodeRemoved', handleBlur$1);
};

const unobserve$1 = ({tip, target}) => {
  $(target).off('DOMNodeRemoved', handleBlur$1);
};

const clearActive$1 = () => {
  state$2.active.tip    = null;
  state$2.active.target = null;
};

function Selectable() {
  const page              = document.body;
  let selected            = [];
  let selectedCallbacks   = [];
  let labels              = [];
  let handles             = [];

  const hover_state       = {
    target:   null,
    element:  null,
    label:    null,
  };

  const listen = () => {
    page.addEventListener('click', on_click, true);
    page.addEventListener('dblclick', on_dblclick, true);

    page.on('selectstart', on_selection);
    page.on('mousemove', on_hover);

    document.addEventListener('copy', on_copy);
    document.addEventListener('cut', on_cut);
    document.addEventListener('paste', on_paste);

    watchCommandKey();

    hotkeys(`${metaKey}+alt+c`, on_copy_styles);
    hotkeys(`${metaKey}+alt+v`, e => on_paste_styles());
    hotkeys('esc', on_esc);
    hotkeys(`${metaKey}+d`, on_duplicate);
    hotkeys('backspace,del,delete', on_delete);
    hotkeys('alt+del,alt+backspace', on_clearstyles);
    hotkeys(`${metaKey}+e,${metaKey}+shift+e`, on_expand_selection);
    hotkeys(`${metaKey}+g,${metaKey}+shift+g`, on_group);
    hotkeys('tab,shift+tab,enter,shift+enter', on_keyboard_traversal);
    hotkeys(`${metaKey}+shift+enter`, on_select_children);
  };

  const unlisten = () => {
    page.removeEventListener('click', on_click, true);
    page.removeEventListener('dblclick', on_dblclick, true);

    page.off('selectstart', on_selection);
    page.off('mousemove', on_hover);

    document.removeEventListener('copy', on_copy);
    document.removeEventListener('cut', on_cut);
    document.removeEventListener('paste', on_paste);

    hotkeys.unbind(`esc,${metaKey}+d,backspace,del,delete,alt+del,alt+backspace,${metaKey}+e,${metaKey}+shift+e,${metaKey}+g,${metaKey}+shift+g,tab,shift+tab,enter,shift+enter`);
  };

  const on_click = e => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);

    if (isOffBounds($target) && !selected.filter(el => el == $target).length)
      return

    e.preventDefault();
    if (!e.altKey) e.stopPropagation();
    if (!e.shiftKey) unselect_all();

    if(e.shiftKey && $target.hasAttribute('data-selected'))
      unselect($target.getAttribute('data-label-id'));
    else
      select($target);
  };

  const unselect = id => {
    [...labels, ...handles]
      .filter(node =>
          node.getAttribute('data-label-id') === id)
        .forEach(node =>
          node.remove());

    selected.filter(node =>
      node.getAttribute('data-label-id') === id)
      .forEach(node =>
        $(node).attr({
          'data-selected':      null,
          'data-selected-hide': null,
          'data-label-id':      null,
          'data-pseudo-select':         null,
          'data-measuring':     null,
      }));

    selected = selected.filter(node => node.getAttribute('data-label-id') !== id);

    tellWatchers();
  };

  const on_dblclick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return
    $('vis-bug')[0].toolSelected('text');
  };

  const watchCommandKey = e => {
    let did_hide = false;

    document.onkeydown = function(e) {
      if (hotkeys.ctrl && selected.length) {
        $('visbug-handles, visbug-label, visbug-hover').forEach(el =>
          el.style.display = 'none');

        did_hide = true;
      }
    };

    document.onkeyup = function(e) {
      if (did_hide) {
        $('visbug-handles, visbug-label, visbug-hover').forEach(el =>
          el.style.display = null);

        did_hide = false;
      }
    };
  };

  const on_esc = _ =>
    unselect_all();

  const on_duplicate = e => {
    const root_node = selected[0];
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true);
    deep_clone.removeAttribute('data-selected');
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling);
    e.preventDefault();
  };

  const on_delete = e =>
    selected.length && delete_all();

  const on_clearstyles = e =>
    selected.forEach(el =>
      el.attr('style', null));

  const on_copy = e => {
    // if user has selected text, dont try to copy an element
    if (window.getSelection().toString().length)
      return

    if (selected[0] && this.node_clipboard !== selected[0]) {
      e.preventDefault();
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
    }
  };

  const on_cut = e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
      selected[0].remove();
    }
  };

  const on_paste = e => {
    const clipData = e.clipboardData.getData('text/html');
    const potentialHTML = clipData || this.copy_backup;
    if (selected[0] && potentialHTML) {
      e.preventDefault();
      selected[0].appendChild(
        htmlStringToDom(potentialHTML));
    }
  };

  const on_copy_styles = e => {
    e.preventDefault();
    this.copied_styles = selected.map(el =>
      getStyles(el));
  };

  const on_paste_styles = (index = 0) =>
    selected.forEach(el => {
      this.copied_styles[index]
        .map(({prop, value}) =>
          el.style[prop] = value);

      index >= this.copied_styles.length - 1
        ? index = 0
        : index++;
    });

  const on_expand_selection = (e, {key}) => {
    e.preventDefault();

    const [root] = selected;
    if (!root) return

    const query = combineNodeNameAndClass(root);

    if (isSelectorValid(query))
      expandSelection({
        query,
        all: key.includes('shift'),
      });
  };

  const on_group = (e, {key}) => {
    e.preventDefault();

    if (key.split('+').includes('shift')) {
      let $selected = [...selected];
      unselect_all();
      $selected.reverse().forEach(el => {
        let l = el.children.length;
        while (el.children.length > 0) {
          var node = el.childNodes[el.children.length - 1];
          if (node.nodeName !== '#text')
            select(node);
          el.parentNode.prepend(node);
        }
        el.parentNode.removeChild(el);
      });
    }
    else {
      let div = document.createElement('div');
      selected[0].parentNode.prepend(
        selected.reverse().reduce((div, el) => {
          div.appendChild(el);
          return div
        }, div)
      );
      unselect_all();
      select(div);
    }
  };

  const on_selection = e =>
    !isOffBounds(e.target)
    && selected.length
    && selected[0].textContent != e.target.textContent
    && e.preventDefault();

  const on_keyboard_traversal = (e, {key}) => {
    if (!selected.length) return

    e.preventDefault();
    e.stopPropagation();

    const targets = selected.reduce((flat_n_unique, node) => {
      const element_to_left     = canMoveLeft(node);
      const element_to_right    = canMoveRight(node);
      const has_parent_element  = findNearestParentElement(node);
      const has_child_elements  = findNearestChildElement(node);

      if (key.includes('shift')) {
        if (key.includes('tab') && element_to_left)
          flat_n_unique.add(element_to_left);
        else if (key.includes('enter') && has_parent_element)
          flat_n_unique.add(has_parent_element);
        else
          flat_n_unique.add(node);
      }
      else {
        if (key.includes('tab') && element_to_right)
          flat_n_unique.add(element_to_right);
        else if (key.includes('enter') && has_child_elements)
          flat_n_unique.add(has_child_elements);
        else
          flat_n_unique.add(node);
      }

      return flat_n_unique
    }, new Set());

    if (targets.size) {
      unselect_all();
      targets.forEach(node => {
        select(node);
        show_tip(node);
      });
    }
  };

  const show_tip = el => {
    const active_tool = $('vis-bug')[0].activeTool;
    let tipFactory;

    if (active_tool === 'accessibility') {
      removeAll$1();
      tipFactory = showTip$1;
    }
    else if (active_tool === 'inspector') {
      removeAll();
      tipFactory = showTip;
    }

    if (!tipFactory) return

    const {top, left} = el.getBoundingClientRect();
    const { pageYOffset, pageXOffset } = window;

    tipFactory(el, {
      clientY:  top,
      clientX:  left,
      pageY:    pageYOffset + top - 10,
      pageX:    pageXOffset + left + 20,
    });
  };

  const on_hover = e => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);
    const tool = $('vis-bug')[0].activeTool;

    if (isOffBounds($target) || $target.hasAttribute('data-selected'))
      return clearHover()

    overlayHoverUI($target);

    if (e.altKey && tool === 'guides' && selected.length === 1 && selected[0] != $target) {
      $target.setAttribute('data-measuring', true);
      const [$anchor] = selected;
      createMeasurements({$anchor, $target});
    }
    else if (tool === 'margin' && !hover_state.element.$shadow.querySelector('visbug-boxmodel')) {
      hover_state.label.style.opacity = 0;
      hover_state.element.$shadow.appendChild(
        createMarginVisual(hover_state.target, true));
    }
    else if (tool === 'padding' && !hover_state.element.$shadow.querySelector('visbug-boxmodel')) {
      hover_state.label.style.opacity = 0;
      hover_state.element.$shadow.appendChild(
        createPaddingVisual(hover_state.target, true));
    }
    else if ($target.hasAttribute('data-measuring')) {
      $target.removeAttribute('data-measuring');
      clearMeasurements();
    }
  };

  const select = el => {
    el.setAttribute('data-selected', true);
    el.setAttribute('data-label-id', labels.length);

    clearHover();

    overlayMetaUI(el);
    selected.unshift(el);
    tellWatchers();
  };

  const selection = () =>
    selected;

  const unselect_all = () => {
    selected
      .forEach(el =>
        $(el).attr({
          'data-selected':      null,
          'data-selected-hide': null,
          'data-label-id':      null,
          'data-pseudo-select': null,
        }));

    $('[data-pseudo-select]').forEach(hover =>
      hover.removeAttribute('data-pseudo-select'));

    Array.from([
      ...$('visbug-handles'), 
      ...$('visbug-label'), 
      ...$('visbug-hover'),
    ]).forEach(el =>
      el.remove());

    labels    = [];
    handles   = [];
    selected  = [];
  };

  const delete_all = () => {
    const selected_after_delete = selected.map(el => {
      if (canMoveRight(el))     return canMoveRight(el)
      else if (canMoveLeft(el)) return canMoveLeft(el)
      else if (el.parentNode)   return el.parentNode
    });

    Array.from([...selected, ...labels, ...handles]).forEach(el =>
      el.remove());

    labels    = [];
    handles   = [];
    selected  = [];

    selected_after_delete.forEach(el =>
      select(el));
  };

  const expandSelection = ({query, all = false}) => {
    if (all) {
      const unselecteds = $(query + ':not([data-selected])');
      unselecteds.forEach(select);
    }
    else {
      const potentials = $(query);
      if (!potentials) return

      const [anchor] = selected;
      const root_node_index = potentials.reduce((index, node, i) =>
        node == anchor
          ? index = i
          : index
      , null);

      if (root_node_index !== null) {
        if (!potentials[root_node_index + 1]) {
          const potential = potentials.filter(el => !el.attr('data-selected'))[0];
          if (potential) select(potential);
        }
        else {
          select(potentials[root_node_index + 1]);
        }
      }
    }
  };

  const combineNodeNameAndClass = node =>
    `${node.nodeName.toLowerCase()}${createClassname(node)}`;

  const overlayHoverUI = el => {
    if (hover_state.target === el) return

    hover_state.target  = el;
    hover_state.element = createHover(el);
    hover_state.label = createHoverLabel(el, `
      <a node>${el.nodeName.toLowerCase()}</a>
      <a>${el.id && '#' + el.id}</a>
      ${createClassname(el).split('.')
        .filter(name => name != '')
        .reduce((links, name) => `
          ${links}
          <a>.${name}</a>
        `, '')
      }
    `);
  };

  const clearHover = () => {
    if (!hover_state.target) return

    hover_state.element && hover_state.element.remove();
    hover_state.label && hover_state.label.remove();

    hover_state.target  = null;
    hover_state.element = null;
    hover_state.label   = null;
  };

  const overlayMetaUI = el => {
    let handle = createHandle(el);
    let label  = createLabel(el, `
      <a node>${el.nodeName.toLowerCase()}</a>
      <a>${el.id && '#' + el.id}</a>
      ${createClassname(el).split('.')
        .filter(name => name != '')
        .reduce((links, name) => `
          ${links}
          <a>.${name}</a>
        `, '')
      }
    `);

    let observer        = createObserver(el, {handle,label});
    let parentObserver  = createObserver(el, {handle,label});

    observer.observe(el, { attributes: true });
    parentObserver.observe(el.parentNode, { childList:true, subtree:true });

    $(label).on('DOMNodeRemoved', _ => {
      observer.disconnect();
      parentObserver.disconnect();
    });
  };

  const setLabel = (el, label) =>
    label.update = el.getBoundingClientRect();

  const createLabel = (el, text) => {
    const id = parseInt(el.getAttribute('data-label-id'));

    if (!labels[id]) {
      const label = document.createElement('visbug-label');

      label.text = text;
      label.position = {
        boundingRect:   el.getBoundingClientRect(),
        node_label_id:  id,
      };

      document.body.appendChild(label);

      $(label).on('query', ({detail}) => {
        if (!detail.text) return
        this.query_text = detail.text;

        queryPage('[data-pseudo-select]', el =>
          el.removeAttribute('data-pseudo-select'));

        queryPage(this.query_text + ':not([data-selected])', el =>
          detail.activator === 'mouseenter'
            ? el.setAttribute('data-pseudo-select', true)
            : select(el));
      });

      $(label).on('mouseleave', e => {
        e.preventDefault();
        e.stopPropagation();
        queryPage('[data-pseudo-select]', el =>
          el.removeAttribute('data-pseudo-select'));
      });

      labels[labels.length] = label;

      return label
    }
  };

  const createHandle = el => {
    const id = parseInt(el.getAttribute('data-label-id'));

    if (!handles[id]) {
      const handle = document.createElement('visbug-handles');

      handle.position = { el, node_label_id: id };

      document.body.appendChild(handle);

      handles[handles.length] = handle;
      return handle
    }
  };

  const createHover = el => {
    if (!el.hasAttribute('data-pseudo-select') && !el.hasAttribute('data-label-id')) {
      if (hover_state.element)
        hover_state.element.remove();

      hover_state.element = document.createElement('visbug-hover');
      hover_state.element.position = {el};

      document.body.appendChild(hover_state.element);

      return hover_state.element
    }
  };

  const createHoverLabel = (el, text) => {
    if (!el.hasAttribute('data-pseudo-select') && !el.hasAttribute('data-label-id')) {
      if (hover_state.label)
        hover_state.label.remove();

      hover_state.label = document.createElement('visbug-label');

      hover_state.label.text = text;
      hover_state.label.position = {
        boundingRect:   el.getBoundingClientRect(),
        node_label_id:  'hover',
      };

      hover_state.label.style = `--label-bg: hsl(267, 100%, 58%)`;

      document.body.appendChild(hover_state.label);

      return hover_state.label
    }
  };

  const setHandle = (el, handle) => {
    handle.position = {
      el,
      node_label_id:  el.getAttribute('data-label-id'),
    };
  };

  const createObserver = (node, {label,handle}) =>
    new MutationObserver(list => {
      setLabel(node, label);
      setHandle(node, handle);
    });

  const onSelectedUpdate = (cb, immediateCallback = true) => {
    selectedCallbacks.push(cb);
    if (immediateCallback) cb(selected);
  };

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb);

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected));

  const disconnect = () => {
    unselect_all();
    unlisten();
  };

  const on_select_children = (e, {key}) => {
    const targets = selected
      .filter(node => node.children.length)
      .reduce((flat, {children}) =>
        [...flat, ...Array.from(children)], []);

    if (targets.length) {
      e.preventDefault();
      e.stopPropagation();

      unselect_all();
      targets.forEach(node => select(node));
    }
  };

  watchImagesForUpload();
  listen();

  return {
    select,
    selection,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
    disconnect,
  }
}

const removeEditability = ({target}) => {
  target.removeAttribute('contenteditable');
  target.removeAttribute('spellcheck');
  target.removeEventListener('blur', removeEditability);
  target.removeEventListener('keydown', stopBubbling$1);
  hotkeys.unbind('escape,esc');
};

const stopBubbling$1 = e => e.key != 'Escape' && e.stopPropagation();

const cleanup = (e, handler) => {
  $('[spellcheck="true"]').forEach(target => removeEditability({target}));
  window.getSelection().empty();
};

function EditText(elements) {
  if (!elements.length) return

  elements.map(el => {
    let $el = $(el);

    $el.attr({
      contenteditable: true,
      spellcheck: true,
    });
    el.focus();
    showHideNodeLabel(el, true);

    $el.on('keydown', stopBubbling$1);
    $el.on('blur', removeEditability);
  });

  hotkeys('escape,esc', cleanup);
}

const key_events$3 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$2 = `${metaKey}+up,${metaKey}+down`;

function Font({selection}) {
  hotkeys(key_events$3, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();

    let selectedNodes = selection()
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeKerning(selectedNodes, handler.key)
        : changeAlignment(selectedNodes, handler.key);
    else
      keys.includes('shift')
        ? changeLeading(selectedNodes, handler.key)
        : changeFontSize(selectedNodes, handler.key);
  });

  hotkeys(command_events$2, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    changeFontWeight(selection(), keys.includes('up') ? 'up' : 'down');
  });

  hotkeys('cmd+b', e => {
    selection().forEach(el =>
      el.style.fontWeight =
        el.style.fontWeight == 'bold'
          ? null
          : 'bold');
  });

  hotkeys('cmd+i', e => {
    selection().forEach(el =>
      el.style.fontStyle =
        el.style.fontStyle == 'italic'
          ? null
          : 'italic');
  });

  return () => {
    hotkeys.unbind(key_events$3);
    hotkeys.unbind(command_events$2);
    hotkeys.unbind('cmd+b,cmd+i');
    hotkeys.unbind('up,down,left,right');
  }
}

function changeLeading(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'lineHeight',
      current:  parseInt(getStyle(el, 'lineHeight')),
      amount:   1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        current: payload.current == 'normal' || isNaN(payload.current)
          ? 1.14 * parseInt(getStyle(payload.el, 'fontSize')) // document this choice
          : payload.current
      }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = `${value}px`);
}

function changeKerning(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'letterSpacing',
      current:  parseFloat(getStyle(el, 'letterSpacing')),
      amount:   .1,
      negative: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        current: payload.current == 'normal' || isNaN(payload.current)
          ? 0
          : payload.current
      }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.negative
          ? (payload.current - payload.amount).toFixed(2)
          : (payload.current + payload.amount).toFixed(2)
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = `${value <= -2 ? -2 : value}px`);
}

function changeFontSize(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'fontSize',
      current:  parseInt(getStyle(el, 'fontSize')),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        font_size: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount
      }))
    .forEach(({el, style, font_size}) =>
      el.style[style] = `${font_size <= 6 ? 6 : font_size}px`);
}

const weightMap = {
  normal: 2,
  bold:   5,
  light:  0,
  "": 2,
  "100":0,"200":1,"300":2,"400":3,"500":4,"600":5,"700":6,"800":7,"900":8
};
const weightOptions = [100,200,300,400,500,600,700,800,900];

function changeFontWeight(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'fontWeight',
      current:  getStyle(el, 'fontWeight'),
      direction: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? weightMap[payload.current] - 1
          : weightMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = weightOptions[value < 0 ? 0 : value >= weightOptions.length
        ? weightOptions.length
        : value
      ]);
}

const alignMap = {
  start: 0,
  left: 0,
  center: 1,
  right: 2,
};
const alignOptions = ['left','center','right'];

function changeAlignment(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'textAlign',
      current:  getStyle(el, 'textAlign'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? alignMap[payload.current] - 1
          : alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = alignOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const key_events$4 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$3 = `${metaKey}+up,${metaKey}+down,${metaKey}+left,${metaKey}+right`;

function Flex({selection}) {
  hotkeys(key_events$4, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();

    let selectedNodes = selection()
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeHDistribution(selectedNodes, handler.key)
        : changeHAlignment(selectedNodes, handler.key);
    else
      keys.includes('shift')
        ? changeVDistribution(selectedNodes, handler.key)
        : changeVAlignment(selectedNodes, handler.key);
  });

  hotkeys(command_events$3, (e, handler) => {
    e.preventDefault();

    let selectedNodes = selection()
      , keys = handler.key.split('+');

    changeDirection(selectedNodes, keys.includes('left') ? 'row' : 'column');
  });

  return () => {
    hotkeys.unbind(key_events$4);
    hotkeys.unbind(command_events$3);
    hotkeys.unbind('up,down,left,right');
  }
}

const ensureFlex = el => {
  el.style.display = 'flex';
  return el
};

const accountForOtherJustifyContent = (cur, want) => {
  if (want == 'align' && (cur != 'flex-start' && cur != 'center' && cur != 'flex-end'))
    cur = 'normal';
  else if (want == 'distribute' && (cur != 'space-around' && cur != 'space-between'))
    cur = 'normal';

  return cur
};

// todo: support reversing direction
function changeDirection(els, value) {
  els
    .map(ensureFlex)
    .map(el => {
      el.style.flexDirection = value;
    });
}

const h_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,};
const h_alignOptions$1  = ['flex-start','center','flex-end'];

function changeHAlignment(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style:    'justifyContent',
      current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'align'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1
          : h_alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = h_alignOptions$1[value < 0 ? 0 : value >= 2 ? 2: value]);
}
const v_alignOptions$1  = ['flex-start','center','flex-end'];

function changeVAlignment(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style:    'alignItems',
      current:  getStyle(el, 'alignItems'),
      direction: direction.split('+').includes('up'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1
          : h_alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = v_alignOptions$1[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const h_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,};
const h_distributionOptions  = ['space-around','','space-between'];

function changeHDistribution(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style:    'justifyContent',
      current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'distribute'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_distributionMap[payload.current] - 1
          : h_distributionMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = h_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const v_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,};
const v_distributionOptions  = ['space-around','','space-between'];

function changeVDistribution(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style:    'alignContent',
      current:  getStyle(el, 'alignContent'),
      direction: direction.split('+').includes('up'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? v_distributionMap[payload.current] - 1
          : v_distributionMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = v_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker  = $('#foreground', pallete);
  const backgroundPicker  = $('#background', pallete);
  const borderPicker      = $('#border', pallete);
  const fgInput           = $('input', foregroundPicker[0]);
  const bgInput           = $('input', backgroundPicker[0]);
  const boInput           = $('input', borderPicker[0]);

  const shadows = {
    active:   'rgba(0, 0, 0, 0.1) 0px 0.25em 0.5em, 0 0 0 2px hotpink',
    inactive: 'rgba(0, 0, 0, 0.1) 0px 0.25em 0.5em',
  };

  this.active_color       = 'background';
  this.elements           = [];

  // set colors
  fgInput.on('input', e =>
    this.elements.map(el =>
      el.style['color'] = e.target.value));

  bgInput.on('input', e =>
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'fill'
        : 'backgroundColor'
      ] = e.target.value));

  boInput.on('input', e =>
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'border-color'
      ] = e.target.value));

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return
    this.elements = elements;

    let isMeaningfulForeground  = false;
    let isMeaningfulBackground  = false;
    let isMeaningfulBorder      = false;
    let FG, BG, BO;

    if (this.elements.length == 1) {
      const el = this.elements[0];
      const meaningfulDontMatter = pallete.host.active_tool.dataset.tool === 'hueshift';

      if (el instanceof SVGElement) {
        FG = new TinyColor('rgb(0, 0, 0)');
        var bo_temp = getStyle(el, 'stroke');
        BO = new TinyColor(bo_temp === 'none'
          ? 'rgb(0, 0, 0)'
          : bo_temp);
        BG = new TinyColor(getStyle(el, 'fill'));
      }
      else {
        FG = new TinyColor(getStyle(el, 'color'));
        BG = new TinyColor(getStyle(el, 'backgroundColor'));
        BO = getStyle(el, 'borderWidth') === '0px'
          ? new TinyColor('rgb(0, 0, 0)')
          : new TinyColor(getStyle(el, 'borderColor'));
      }

      let fg = FG.toHexString();
      let bg = BG.toHexString();
      let bo = BO.toHexString();

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '');
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)';
      isMeaningfulBorder     = BO.originalInput !== 'rgb(0, 0, 0)';

      if (isMeaningfulForeground && !isMeaningfulBackground)
        setActive('foreground');
      else if (isMeaningfulBackground && !isMeaningfulForeground)
        setActive('background');

      const new_fg = isMeaningfulForeground ? fg : '';
      const new_bg = isMeaningfulBackground ? bg : '';
      const new_bo = isMeaningfulBorder ? bo : '';

      fgInput.attr('value', new_fg);
      bgInput.attr('value', new_bg);
      boInput.attr('value', new_bo);

      foregroundPicker.attr('style', `
        --contextual_color: ${new_fg};
        display: ${isMeaningfulForeground || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `);

      backgroundPicker.attr('style', `
        --contextual_color: ${new_bg};
        display: ${isMeaningfulBackground || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `);

      borderPicker.attr('style', `
        --contextual_color: ${new_bo};
        display: ${isMeaningfulBorder || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `);
    }
    else {
      // show all 3 if they've selected more than 1 node
      // todo: this is giving up, and can be solved
      foregroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'foreground' ? shadows.active : shadows.inactive};
        display: inline-flex;
      `);

      backgroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'background' ? shadows.active : shadows.inactive};
        display: inline-flex;
      `);

      borderPicker.attr('style', `
        box-shadow: ${this.active_color == 'border' ? shadows.active : shadows.inactive};
        display: inline-flex;
      `);
    }
  });

  const getActive = () =>
    this.active_color;

  const setActive = key => {
    removeActive();
    this.active_color = key;

    if (key === 'foreground')
      foregroundPicker[0].style.boxShadow = shadows.active;
    if (key === 'background')
      backgroundPicker[0].style.boxShadow = shadows.active;
    if (key === 'border')
      borderPicker[0].style.boxShadow = shadows.active;
  };

  const removeActive = () =>
    [foregroundPicker, backgroundPicker, borderPicker].forEach(([picker]) =>
      picker.style.boxShadow = shadows.inactive);

  return {
    getActive,
    setActive,
    foreground: { color: color =>
      foregroundPicker[0].style.setProperty('--contextual_color', color)},
    background: { color: color =>
      backgroundPicker[0].style.setProperty('--contextual_color', color)}
  }
}

const key_events$5 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$4 = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down,${metaKey}+left,${metaKey}+shift+left,${metaKey}+right,${metaKey}+shift+right`;

function BoxShadow({selection}) {
  hotkeys(key_events$5, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();

    let selectedNodes = selection()
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'size')
        : changeBoxShadow(selectedNodes, keys, 'x');
    else
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'blur')
        : changeBoxShadow(selectedNodes, keys, 'y');
  });

  hotkeys(command_events$4, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    keys.includes('left') || keys.includes('right')
      ? changeBoxShadow(selection(), keys, 'opacity')
      : changeBoxShadow(selection(), keys, 'inset');
  });

  return () => {
    hotkeys.unbind(key_events$5);
    hotkeys.unbind(command_events$4);
    hotkeys.unbind('up,down,left,right');
  }
}

const ensureHasShadow = el => {
  if (el.style.boxShadow == '' || el.style.boxShadow == 'none')
    el.style.boxShadow = 'hsla(0,0%,0%,30%) 0 0 0 0';
  return el
};

// todo: work around this propMap with a better split
const propMap = {
  'opacity':  3,
  'x':        4,
  'y':        5,
  'blur':     6,
  'size':     7,
  'inset':    8,
};

const parseCurrentShadow = el => getStyle(el, 'boxShadow').split(' ');

function changeBoxShadow(els, direction, prop) {
  els
    .map(ensureHasShadow)
    .map(el => showHideSelected(el, 1500))
    .map(el => ({
      el,
      style:     'boxShadow',
      current:   parseCurrentShadow(el), // ["rgb(255,", "0,", "0)", "0px", "0px", "1px", "0px"]
      propIndex: parseCurrentShadow(el)[0].includes('rgba') ? propMap[prop] : propMap[prop] - 1
    }))
    .map(payload => {
      let updated = [...payload.current];
      let cur     = prop === 'opacity'
        ? payload.current[payload.propIndex]
        : parseInt(payload.current[payload.propIndex]);

      switch(prop) {
        case 'blur':
          var amount = direction.includes('shift') ? 10 : 1;
          updated[payload.propIndex] = direction.includes('down')
            ? `${cur - amount}px`
            : `${cur + amount}px`;
          break
        case 'inset':
          updated[payload.propIndex] = direction.includes('down')
            ? 'inset'
            : '';
          break
        case 'opacity':
          let cur_opacity = parseFloat(cur.slice(0, cur.indexOf(')')));
          var amount = direction.includes('shift') ? 0.10 : 0.01;
          updated[payload.propIndex] = direction.includes('left')
            ? cur_opacity - amount + ')'
            : cur_opacity + amount + ')';
          break
        default:
          updated[payload.propIndex] = direction.includes('left') || direction.includes('up')
            ? `${cur - 1}px`
            : `${cur + 1}px`;
          break
      }

      payload.value = updated;
      return payload
    })
    .forEach(({el, style, value}) =>
      el.style[style] = value.join(' '));
}

const key_events$6 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$5 = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down,${metaKey}+left,${metaKey}+shift+left,${metaKey}+right,${metaKey}+shift+right`;

function HueShift(Color) {
  this.active_color   = Color.getActive();
  this.elements       = [];

  hotkeys(key_events$6, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();

    let selectedNodes = this.elements
      , keys = handler.key.split('+');

    keys.includes('left') || keys.includes('right')
      ? changeHue(selectedNodes, keys, 's', Color)
      : changeHue(selectedNodes, keys, 'l', Color);
  });

  hotkeys(command_events$5, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    keys.includes('left') || keys.includes('right')
      ? changeHue(this.elements, keys, 'a', Color)
      : changeHue(this.elements, keys, 'h', Color);
  });

  hotkeys(']', (e, handler) => {
    e.preventDefault();

    if (this.active_color == 'foreground')
      this.active_color = 'background';
    else if (this.active_color == 'background')
      this.active_color = 'border';

    Color.setActive(this.active_color);
  });

  hotkeys('[', (e, handler) => {
    e.preventDefault();

    if (this.active_color == 'background')
      this.active_color = 'foreground';
    else if (this.active_color == 'border')
      this.active_color = 'background';

    Color.setActive(this.active_color);
  });

  const onNodesSelected = els => {
    this.elements = els;
    Color.setActive(this.active_color);
  };

  const disconnect = () => {
    hotkeys.unbind(key_events$6);
    hotkeys.unbind(command_events$5);
    hotkeys.unbind('up,down,left,right');
  };

  return {
    onNodesSelected,
    disconnect,
  }
}

function changeHue(els, direction, prop, Color) {
  els
    .map(el => showHideSelected(el))
    .map(el => {
      const { foreground, background, border } = extractPalleteColors(el);

      // todo: teach hueshift to do handle color
      switch(Color.getActive()) {
        case 'background':
          return { el, current: background.color.toHsl(), style: background.style }
        case 'foreground':
          return { el, current: foreground.color.toHsl(), style: foreground.style }
        case 'border': {
          if (el.style.border === '') el.style.border = '1px solid black';
          return { el, current: border.color.toHsl(), style: border.style }
        }
      }
    })
    .map(payload =>
      Object.assign(payload, {
        amount:   direction.includes('shift') ? 10 : 1,
        negative: direction.includes('down') || direction.includes('left'),
      }))
    .map(payload => {
      if (prop === 's' || prop === 'l' || prop === 'a')
        payload.amount = payload.amount * 0.01;

      payload.current[prop] = payload.negative
        ? payload.current[prop] - payload.amount
        : payload.current[prop] + payload.amount;

      if (prop === 's' || prop === 'l' || prop === 'a') {
        if (payload.current[prop] > 1) payload.current[prop] = 1;
        if (payload.current[prop] < 0) payload.current[prop] = 0;
      }

      return payload
    })
    .forEach(({el, style, current}) => {
      let color = new TinyColor(current).setAlpha(current.a);
      el.style[style] = color.toHslString();

      if (style == 'color') Color.foreground.color(color.toHexString());
      if (style == 'backgroundColor') Color.background.color(color.toHexString());
    });
}

function extractPalleteColors(el) {
  if (el instanceof SVGElement) {
    const  fg_temp = getStyle(el, 'stroke');

    return {
      foreground: {
        style: 'stroke',
        color: new TinyColor(fg_temp === 'none'
          ? 'rgb(0, 0, 0)'
          : fg_temp),
      },
      background: {
        style: 'fill',
        color: new TinyColor(getStyle(el, 'fill')),
      },
      border: {
        style: 'outline',
        color: new TinyColor(getStyle(el, 'outline')),
      }
    }
  }
  else
    return {
      foreground: {
        style: 'color',
        color: new TinyColor(getStyle(el, 'color')),
      },
      background: {
        style: 'backgroundColor',
        color: new TinyColor(getStyle(el, 'backgroundColor')),
      },
      border: {
        style: 'borderColor',
        color: new TinyColor(getStyle(el, 'borderColor')),
      }
    }
}

let gridlines;

function Guides() {
  $('body').on('mousemove', on_hover);
  $('body').on('mouseout', on_hoverout);
  window.addEventListener('scroll', hideGridlines);

  return () => {
    $('body').off('mousemove', on_hover);
    $('body').off('mouseout', on_hoverout);
    window.removeEventListener('scroll', hideGridlines);
    hideGridlines();
  }
}

const on_hover = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY);
  if (isOffBounds(target)) return
  showGridlines(target);
};

const on_hoverout = ({target}) =>
  hideGridlines();

const showGridlines = node => {
  if (gridlines) {
    gridlines.style.display = null;
    gridlines.update = node.getBoundingClientRect();
  }
  else {
    gridlines = document.createElement('visbug-gridlines');
    gridlines.position = node.getBoundingClientRect();

    document.body.appendChild(gridlines);
  }
};

const hideGridlines = node => {
  if (!gridlines) return
  gridlines.style.display = 'none';
};

function Screenshot(node, page) {
  alert('Coming Soon!');

  return () => {}
}

const key_events$7 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1);

function Position() {
  const state = {
    elements: []
  };

  hotkeys(key_events$7, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault();
    positionElement(state.elements, handler.key);
  });

  const onNodesSelected = els => {
    state.elements.forEach(el =>
      el.teardown());

    state.elements = els.map(el =>
      draggable(el));
  };

  const disconnect = () => {
    state.elements.forEach(el => el.teardown());
    hotkeys.unbind(key_events$7);
    hotkeys.unbind('up,down,left,right');
  };

  return {
    onNodesSelected,
    disconnect,
  }
}

function draggable(el) {
  this.state = {
    mouse: {
      down: false,
      x: 0,
      y: 0,
    },
    element: {
      x: 0,
      y: 0,
    }
  };

  const setup = () => {
    el.style.transition   = 'none';
    el.style.cursor       = 'move';

    el.addEventListener('mousedown', onMouseDown, true);
    el.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('mousemove', onMouseMove, true);
  };

  const teardown = () => {
    el.style.transition   = null;
    el.style.cursor       = null;

    el.removeEventListener('mousedown', onMouseDown, true);
    el.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('mousemove', onMouseMove, true);
  };

  const onMouseDown = e => {
    e.preventDefault();

    const el = e.target;

    el.style.position = 'relative';
    el.style.willChange = 'top,left';

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform');

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0];

      this.state.element.x  = x;
      this.state.element.y  = y;
    }
    else {
      this.state.element.x  = parseInt(getStyle(el, 'left'));
      this.state.element.y  = parseInt(getStyle(el, 'top'));
    }

    this.state.mouse.x      = e.clientX;
    this.state.mouse.y      = e.clientY;
    this.state.mouse.down   = true;
  };

  const onMouseUp = e => {
    e.preventDefault();
    e.stopPropagation();

    this.state.mouse.down = false;
    el.style.willChange = null;

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform');

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0];

      this.state.element.x    = x;
      this.state.element.y    = y;
    }
    else {
      this.state.element.x    = parseInt(el.style.left) || 0;
      this.state.element.y    = parseInt(el.style.top) || 0;
    }
  };

  const onMouseMove = e => {
    e.preventDefault();
    e.stopPropagation();

    if (!this.state.mouse.down) return

    if (el instanceof SVGElement) {
      el.setAttribute('transform', `translate(
        ${this.state.element.x + e.clientX - this.state.mouse.x},
        ${this.state.element.y + e.clientY - this.state.mouse.y}
      )`);
    }
    else {
      el.style.left = this.state.element.x + e.clientX - this.state.mouse.x + 'px';
      el.style.top  = this.state.element.y + e.clientY - this.state.mouse.y + 'px';
    }
  };

  setup();
  el.teardown = teardown;

  return el
}

function positionElement(els, direction) {
  els
    .map(el => ensurePositionable(el))
    .map(el => showHideSelected(el))
    .map(el => ({
        el,
        ...extractCurrentValueAndSide(el, direction),
        amount:   direction.split('+').includes('shift') ? 10 : 1,
        negative: determineNegativity(el, direction),
    }))
    .map(payload =>
      Object.assign(payload, {
        position: payload.negative
          ? payload.current + payload.amount
          : payload.current - payload.amount
      }))
    .forEach(({el, style, position}) =>
      el instanceof SVGElement
        ? setTranslateOnSVG(el, direction, position)
        : el.style[style] = position + 'px');
}

const extractCurrentValueAndSide = (el, direction) => {
  let style, current;

  if (el instanceof SVGElement) {
    const translate = el.attr('transform');

    const [ x, y ] = translate
      ? extractSVGTranslate(translate)
      : [0,0];

    style   = 'transform';
    current = direction.includes('down') || direction.includes('up')
      ? y
      : x;
  }
  else {
    const side = getSide(direction).toLowerCase();
    style = (side === 'top' || side === 'bottom') ? 'top' : 'left';
    current = getStyle(el, style);

    current === 'auto'
      ? current = 0
      : current = parseInt(current, 10);
  }

  return { style, current }
};

const extractSVGTranslate = translate =>
  translate.substring(
    translate.indexOf('(') + 1,
    translate.indexOf(')')
  ).split(',')
  .map(val => parseFloat(val));

const setTranslateOnSVG = (el, direction, position) => {
  const transform = el.attr('transform');
  const [ x, y ] = transform
    ? extractSVGTranslate(transform)
    : [0,0];

  const pos = direction.includes('down') || direction.includes('up')
    ? `${x},${position}`
    : `${position},${y}`;

  el.attr('transform', `translate(${pos})`);
};

const determineNegativity = (el, direction) =>
  direction.includes('right') || direction.includes('down');

const ensurePositionable = el => {
  if (el instanceof HTMLElement)
    el.style.position = 'relative';
  return el
};

const VisBugModel = {
  g: {
    tool:        'guides',
    icon:        guides,
    label:       'Guides',
    description: 'Verify alignment & check your grid',
    instruction: `<div table>
                    <div>
                      <b>Measure:</b>
                      <span>${altKey} + hover</span>
                    </div>
                  </div>`,
  },
  i: {
    tool:        'inspector',
    icon:        inspector,
    label:       'Inspect',
    description: 'Peek into common & current styles of an element',
    instruction: `<div table>
                    <div>
                      <b>Pin it:</b>
                      <span>${altKey} + click</span>
                    </div>
                  </div>`,
  },
  x: {
    tool:        'accessibility',
    icon:        accessibility,
    label:       'Accessibility',
    description: 'Peek into A11y attributes & compliance status',
    instruction: `<div table>
                    <div>
                      <b>Pin it:</b>
                      <span>${altKey} + click</span>
                    </div>
                  </div>`,
  },
  v: {
    tool:        'move',
    icon:        move,
    label:       'Move',
    description: 'Push elements in & out of their container, or shuffle them within it',
    instruction: `<div table>
                    <div>
                      <b>Lateral:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Out and above:</b>
                      <span>▲</span>
                    </div>
                    <div>
                      <b>Down and in:</b>
                      <span>▼</span>
                    </div>
                  </div>`,
  },
  // r: {
  //   tool:        'resize',
  //   icon:        Icons.resize,
  //   label:       'Resize',
  //   description: ''
  // },
  m: {
    tool:        'margin',
    icon:        margin,
    label:       'Margin',
    description: 'Add or subtract outer space from any or all sides of the selected element(s)',
    instruction: `<div table>
                    <div>
                      <b>+ Margin:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Margin:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>All Sides:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                  </div>`,
  },
  p: {
    tool:        'padding',
    icon:        padding,
    label:       'Padding',
    description: `Add or subtract inner space from any or all sides of the selected element(s)`,
    instruction: `<div table>
                    <div>
                      <b>+ Padding:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Padding:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>All Sides:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                  </div>`
  },
  // b: {
  //   tool:        'border',
  //   icon:        Icons.border,
  //   label:       'Border',
  //   description: ''
  // },
  a: {
    tool:        'align',
    icon:        align,
    label:       'Flexbox Align',
    description: `Create or modify flexbox direction, distribution & alignment`,
    instruction: `<div table>
                    <div>
                      <b>Alignment:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Distribution:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Direction:</b>
                      <span>${metaKey} +  ◀ ▼</span>
                    </div>
                  </div>`,
  },
  h: {
    tool:        'hueshift',
    icon:        hueshift,
    label:       'Hue Shift',
    description: `Change foreground/background hue, brightness, saturation & opacity`,
    instruction: `<div table>
                    <div>
                      <b>Saturation:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Brightness:</b>
                      <span>▲ ▼</span>
                    </div>
                    <div>
                      <b>Hue:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                    <div>
                      <b>Opacity:</b>
                      <span>${metaKey} +  ◀ ▶</span>
                    </div>
                  </div>`,
  },
  d: {
    tool:        'boxshadow',
    icon:        boxshadow,
    label:       'Shadow',
    description: `Create & adjust position, blur & opacity of a box shadow`,
    instruction: `<div table>
                    <div>
                      <b>X/Y Position:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Blur:</b>
                      <span>Shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Spread:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Opacity:</b>
                      <span>${metaKey} + ◀ ▶</span>
                    </div>
                  </div>`,
  },
  // t: {
  //   tool:        'transform',
  //   icon:        Icons.transform,
  //   label:       '3D Transform',
  //   description: ''
  // },
  l: {
    tool:        'position',
    icon:        position,
    label:       'Position',
    description: 'Move svg (x,y) and elements (top,left,bottom,right)',
    instruction: `<div table>
                    <div>
                      <b>Nudge:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Move:</b>
                      <span>Click & drag</span>
                    </div>
                  </div>`,
  },
  f: {
    tool:        'font',
    icon:        font,
    label:       'Font Styles',
    description: 'Change size, alignment, leading, letter-spacing, & weight',
    instruction: `<div table>
                    <div>
                      <b>Size:</b>
                      <span>▲ ▼</span>
                    </div>
                    <div>
                      <b>Alignment:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Leading:</b>
                      <span>Shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Letter-spacing:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Weight:</b>
                      <span>${metaKey} + ▲ ▼</span>
                    </div>
                  </div>`,
  },
  e: {
    tool:        'text',
    icon:        text,
    label:       'Edit Text',
    description: 'Change any text on the page with a <b>double click</b>',
    instruction: '',
  },
  // c: {
  //   tool:        'screenshot',
  //   icon:        Icons.camera,
  //   label:       'Screenshot',
  //   description: 'Screenshot selected elements or the entire page'
  // },
  s: {
    tool:        'search',
    icon:        search,
    label:       'Search',
    description: 'Select elements programatically by searching for them or use built in plugins with special commands',
    instruction: '',
  },
};

class VisBug extends HTMLElement {
  constructor() {
    super();

    this.toolbar_model  = VisBugModel;
    this._tutsBaseURL   = 'tuts'; // can be set by content script
    this.$shadow        = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    if (!this.$shadow.innerHTML)
      this.setup();

    this.selectorEngine = Selectable();
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine);
    provideSelectorEngine(this.selectorEngine);
  }

  disconnectedCallback() {
    this.deactivate_feature();
    this.cleanup();
    this.selectorEngine.disconnect();
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''));
    hotkeys.unbind(`${metaKey}+/`);
  }

  setup() {
    this.$shadow.innerHTML = this.render();

    $('li[data-tool]', this.$shadow).on('click', e =>
      this.toolSelected(e.currentTarget) && e.stopPropagation());

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => {
        e.preventDefault();
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0]
        );
      })
    );

    hotkeys(`${metaKey}+/,${metaKey}+.`, e =>
      this.$shadow.host.style.display =
        this.$shadow.host.style.display === 'none'
          ? 'block'
          : 'none');

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0]);
  }

  cleanup() {
    const bye = [
      ...document.getElementsByTagName('visbug-hover'),
      ...document.getElementsByTagName('visbug-handles'),
      ...document.getElementsByTagName('visbug-label'),
      ...document.getElementsByTagName('visbug-gridlines'),
    ].forEach(el => el.remove());

    document.querySelectorAll('[data-pseudo-select=true]')
      .forEach(el =>
        el.removeAttribute('data-pseudo-select'));
  }

  toolSelected(el) {
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0];

    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

    if (this.active_tool) {
      this.active_tool.attr('data-active', null);
      this.deactivate_feature();
    }

    el.attr('data-active', true);
    this.active_tool = el;
    this[el.dataset.tool]();
  }

  render() {
    return `
      ${this.styles()}
      <visbug-hotkeys></visbug-hotkeys>
      <ol>
        ${Object.entries(this.toolbar_model).reduce((list, [key, tool]) => `
          ${list}
          <li aria-label="${tool.label} Tool" aria-description="${tool.description}" aria-hotkey="${key}" data-tool="${tool.tool}" data-active="${key == 'g'}">
            ${tool.icon}
            ${this.demoTip({key, ...tool})}
          </li>
        `,'')}
      </ol>
      <ol colors>
        <li style="display: none;" class="color" id="foreground" aria-label="Text" aria-description="Change the text color">
          <input type="color" value="">
          ${color_text}
        </li>
        <li style="display: none;" class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color" value="">
          ${color_background}
        </li>
        <li style="display: none;" class="color" id="border" aria-label="Border or Stroke" aria-description="Change the border color or stroke of svg">
          <input type="color" value="">
          ${color_border}
        </li>
      </ol>
    `
  }

  styles() {
    return `
      <style>
        ${css}
      </style>
    `
  }

  demoTip({key, tool, label, description, instruction}) {
    return `
      <aside ${tool}>
        <figure>
          <img src="${this._tutsBaseURL}/${tool}.gif" alt="${description}" />
          <figcaption>
            <h2>
              ${label}
              <span hotkey>${key}</span>
            </h2>
            <p>${description}</p>
            ${instruction}
          </figcaption>
        </figure>
      </aside>
    `
  }

  move() {
    this.deactivate_feature = Moveable(this.selectorEngine);
  }

  margin() {
    this.deactivate_feature = Margin(this.selectorEngine);
  }

  padding() {
    this.deactivate_feature = Padding(this.selectorEngine);
  }

  font() {
    this.deactivate_feature = Font(this.selectorEngine);
  }

  text() {
    this.selectorEngine.onSelectedUpdate(EditText);
    this.deactivate_feature = () =>
      this.selectorEngine.removeSelectedCallback(EditText);
  }

  align() {
    this.deactivate_feature = Flex(this.selectorEngine);
  }

  search() {
    this.deactivate_feature = Search($('[data-tool="search"]', this.$shadow));
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow(this.selectorEngine);
  }

  hueshift() {
    let feature = HueShift(this.colorPicker);
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected);
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected);
      feature.disconnect();
    };
  }

  inspector() {
    this.deactivate_feature = MetaTip(this.selectorEngine);
  }

  accessibility() {
    this.deactivate_feature = Accessibility();
  }

  guides() {
    this.deactivate_feature = Guides();
  }

  screenshot() {
    this.deactivate_feature = Screenshot();
  }

  position() {
    let feature = Position();
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected);
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected);
      feature.disconnect();
    };
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }

  set tutsBaseURL(url) {
    this._tutsBaseURL = url;
    this.setup();
  }
}

customElements.define('vis-bug', VisBug);

if ('ontouchstart' in document.documentElement)
  document.getElementById('mobile-info').style.display = '';

if (metaKey === 'ctrl')
  [...document.querySelectorAll('kbd')]
    .forEach(node => {
      node.textContent = node.textContent.replace('cmd','ctrl');
      node.textContent = node.textContent.replace('opt','alt');
    });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYmxpbmdibGluZ2pzL3NyYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ob3RrZXlzLWpzL2Rpc3QvaG90a2V5cy5lc20uanMiLCJjb21wb25lbnRzL3NlbGVjdGlvbi9oYW5kbGVzLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL3NlbGVjdGlvbi9ob3Zlci5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9zZWxlY3Rpb24vbGFiZWwuZWxlbWVudC5qcyIsInV0aWxpdGllcy9kZXNpZ24tcHJvcGVydGllcy5qcyIsInV0aWxpdGllcy9zdHlsZXMuanMiLCJ1dGlsaXRpZXMvYWNjZXNzaWJpbGl0eS5qcyIsInV0aWxpdGllcy9zdHJpbmdzLmpzIiwidXRpbGl0aWVzL2NvbW1vbi5qcyIsInV0aWxpdGllcy93aW5kb3cuanMiLCJjb21wb25lbnRzL3NlbGVjdGlvbi9ncmlkbGluZXMuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvc2VsZWN0aW9uL2Rpc3RhbmNlLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL3NlbGVjdGlvbi9vdmVybGF5LmVsZW1lbnQuanMiLCJjb21wb25lbnRzL3NlbGVjdGlvbi9ib3gtbW9kZWwuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvbWV0YXRpcC9tZXRhdGlwLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL21ldGF0aXAvYWxseS5lbGVtZW50LmpzIiwiY29tcG9uZW50cy92aXMtYnVnL3Zpcy1idWcuaWNvbnMuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvYmFzZS5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwL2d1aWRlcy5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwL2luc3BlY3Rvci5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwL2FjY2Vzc2liaWxpdHkuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvaG90a2V5LW1hcC9tb3ZlLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvbWFyZ2luLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvcGFkZGluZy5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwL2FsaWduLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvaHVlc2hpZnQuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvaG90a2V5LW1hcC9ib3hzaGFkb3cuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvaG90a2V5LW1hcC9wb3NpdGlvbi5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwL2ZvbnQuZWxlbWVudC5qcyIsImNvbXBvbmVudHMvaG90a2V5LW1hcC90ZXh0LmVsZW1lbnQuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvc2VhcmNoLmVsZW1lbnQuanMiLCJjb21wb25lbnRzL2hvdGtleS1tYXAvaG90a2V5cy5lbGVtZW50LmpzIiwiZmVhdHVyZXMvbWFyZ2luLmpzIiwiZmVhdHVyZXMvbW92ZS5qcyIsImZlYXR1cmVzL2ltYWdlc3dhcC5qcyIsIi4uL25vZGVfbW9kdWxlcy9xdWVyeS1zZWxlY3Rvci1zaGFkb3ctZG9tL3NyYy9xdWVyeVNlbGVjdG9yRGVlcC5qcyIsInBsdWdpbnMvYmxhbmstcGFnZS5qcyIsInBsdWdpbnMvYmFycmVsLXJvbGwuanMiLCJwbHVnaW5zL3Blc3RpY2lkZS5qcyIsInBsdWdpbnMvY29uc3RydWN0LmpzIiwicGx1Z2lucy9jb25zdHJ1Y3QuZGVidWcuanMiLCJwbHVnaW5zL3dpcmVmcmFtZS5qcyIsInBsdWdpbnMvc2tlbGV0b24uanMiLCJwbHVnaW5zL3RhZy1kZWJ1Z2dlci5qcyIsInBsdWdpbnMvcmV2ZW5nZS5qcyIsInBsdWdpbnMvdG90YTExeS5qcyIsInBsdWdpbnMvX3JlZ2lzdHJ5LmpzIiwiZmVhdHVyZXMvc2VhcmNoLmpzIiwiZmVhdHVyZXMvbWVhc3VyZW1lbnRzLmpzIiwiZmVhdHVyZXMvcGFkZGluZy5qcyIsIi4uL25vZGVfbW9kdWxlcy9AY3RybC90aW55Y29sb3IvYnVuZGxlcy90aW55Y29sb3IuZXMyMDE1LmpzIiwiZmVhdHVyZXMvbWV0YXRpcC5qcyIsImZlYXR1cmVzL2FjY2Vzc2liaWxpdHkuanMiLCJmZWF0dXJlcy9zZWxlY3RhYmxlLmpzIiwiZmVhdHVyZXMvdGV4dC5qcyIsImZlYXR1cmVzL2ZvbnQuanMiLCJmZWF0dXJlcy9mbGV4LmpzIiwiZmVhdHVyZXMvY29sb3IuanMiLCJmZWF0dXJlcy9ib3hzaGFkb3cuanMiLCJmZWF0dXJlcy9odWVzaGlmdC5qcyIsImZlYXR1cmVzL2d1aWRlcy5qcyIsImZlYXR1cmVzL3NjcmVlbnNob3QuanMiLCJmZWF0dXJlcy9wb3NpdGlvbi5qcyIsImNvbXBvbmVudHMvdmlzLWJ1Zy9tb2RlbC5qcyIsImNvbXBvbmVudHMvdmlzLWJ1Zy92aXMtYnVnLmVsZW1lbnQuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdWdhciA9IHtcbiAgb246IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgIG5hbWVzXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLmZvckVhY2gobmFtZSA9PlxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZm4pKVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIG9mZjogZnVuY3Rpb24obmFtZXMsIGZuKSB7XG4gICAgbmFtZXNcbiAgICAgIC5zcGxpdCgnICcpXG4gICAgICAuZm9yRWFjaChuYW1lID0+XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBmbikpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcbiAgYXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsKSB7XG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0cilcblxuICAgIHZhbCA9PSBudWxsXG4gICAgICA/IHRoaXMucmVtb3ZlQXR0cmlidXRlKGF0dHIpXG4gICAgICA6IHRoaXMuc2V0QXR0cmlidXRlKGF0dHIsIHZhbCB8fCAnJylcbiAgICAgIFxuICAgIHJldHVybiB0aGlzXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gJChxdWVyeSwgJGNvbnRleHQgPSBkb2N1bWVudCkge1xuICBsZXQgJG5vZGVzID0gcXVlcnkgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fCBBcnJheS5pc0FycmF5KHF1ZXJ5KVxuICAgID8gcXVlcnlcbiAgICA6IHF1ZXJ5IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgfHwgcXVlcnkgaW5zdGFuY2VvZiBTVkdFbGVtZW50XG4gICAgICA/IFtxdWVyeV1cbiAgICAgIDogJGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcblxuICBpZiAoISRub2Rlcy5sZW5ndGgpICRub2RlcyA9IFtdXG5cbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oXG4gICAgWy4uLiRub2Rlc10ubWFwKCRlbCA9PiBPYmplY3QuYXNzaWduKCRlbCwgc3VnYXIpKSwgXG4gICAge1xuICAgICAgb246IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+ICRlbC5vbihuYW1lcywgZm4pKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfSxcbiAgICAgIG9mZjogZnVuY3Rpb24obmFtZXMsIGZuKSB7XG4gICAgICAgIHRoaXMuZm9yRWFjaCgkZWwgPT4gJGVsLm9mZihuYW1lcywgZm4pKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfSxcbiAgICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHJzLCB2YWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRycyA9PT0gJ3N0cmluZycgJiYgdmFsID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgcmV0dXJuIHRoaXNbMF0uYXR0cihhdHRycylcblxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYXR0cnMgPT09ICdvYmplY3QnKSBcbiAgICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+XG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhhdHRycylcbiAgICAgICAgICAgICAgLmZvckVhY2goKFtrZXksIHZhbF0pID0+XG4gICAgICAgICAgICAgICAgJGVsLmF0dHIoa2V5LCB2YWwpKSlcblxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYXR0cnMgPT0gJ3N0cmluZycgJiYgKHZhbCB8fCB2YWwgPT0gbnVsbCB8fCB2YWwgPT0gJycpKVxuICAgICAgICAgIHRoaXMuZm9yRWFjaCgkZWwgPT4gJGVsLmF0dHIoYXR0cnMsIHZhbCkpXG5cbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH1cbiAgICB9XG4gIClcbn0iLCIvKiFcbiAqIGhvdGtleXMtanMgdjMuMy41XG4gKiBBIHNpbXBsZSBtaWNyby1saWJyYXJ5IGZvciBkZWZpbmluZyBhbmQgZGlzcGF0Y2hpbmcga2V5Ym9hcmQgc2hvcnRjdXRzLiBJdCBoYXMgbm8gZGVwZW5kZW5jaWVzLlxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgga2Vubnkgd29uZyA8d293b2hvb0BxcS5jb20+XG4gKiBodHRwOi8vamF5d2NqbG92ZS5naXRodWIuaW8vaG90a2V5c1xuICogXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIGlzZmYgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyA/IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAwIDogZmFsc2U7XG5cbi8vIOe7keWumuS6i+S7tlxuZnVuY3Rpb24gYWRkRXZlbnQob2JqZWN0LCBldmVudCwgbWV0aG9kKSB7XG4gIGlmIChvYmplY3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIG9iamVjdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBtZXRob2QsIGZhbHNlKTtcbiAgfSBlbHNlIGlmIChvYmplY3QuYXR0YWNoRXZlbnQpIHtcbiAgICBvYmplY3QuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICBtZXRob2Qod2luZG93LmV2ZW50KTtcbiAgICB9KTtcbiAgfVxufVxuXG4vLyDkv67ppbDplK7ovazmjaLmiJDlr7nlupTnmoTplK7noIFcbmZ1bmN0aW9uIGdldE1vZHMobW9kaWZpZXIsIGtleSkge1xuICB2YXIgbW9kcyA9IGtleS5zbGljZSgwLCBrZXkubGVuZ3RoIC0gMSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kcy5sZW5ndGg7IGkrKykge1xuICAgIG1vZHNbaV0gPSBtb2RpZmllclttb2RzW2ldLnRvTG93ZXJDYXNlKCldO1xuICB9cmV0dXJuIG1vZHM7XG59XG5cbi8vIOWkhOeQhuS8oOeahGtleeWtl+espuS4sui9rOaNouaIkOaVsOe7hFxuZnVuY3Rpb24gZ2V0S2V5cyhrZXkpIHtcbiAgaWYgKCFrZXkpIGtleSA9ICcnO1xuXG4gIGtleSA9IGtleS5yZXBsYWNlKC9cXHMvZywgJycpOyAvLyDljLnphY3ku7vkvZXnqbrnmb3lrZfnrKYs5YyF5ous56m65qC844CB5Yi26KGo56ym44CB5o2i6aG156ym562J562JXG4gIHZhciBrZXlzID0ga2V5LnNwbGl0KCcsJyk7IC8vIOWQjOaXtuiuvue9ruWkmuS4quW/q+aNt+mUru+8jOS7pScsJ+WIhuWJslxuICB2YXIgaW5kZXggPSBrZXlzLmxhc3RJbmRleE9mKCcnKTtcblxuICAvLyDlv6vmjbfplK7lj6/og73ljIXlkKsnLCfvvIzpnIDnibnmrorlpITnkIZcbiAgZm9yICg7IGluZGV4ID49IDA7KSB7XG4gICAga2V5c1tpbmRleCAtIDFdICs9ICcsJztcbiAgICBrZXlzLnNwbGljZShpbmRleCwgMSk7XG4gICAgaW5kZXggPSBrZXlzLmxhc3RJbmRleE9mKCcnKTtcbiAgfVxuXG4gIHJldHVybiBrZXlzO1xufVxuXG4vLyDmr5TovoPkv67ppbDplK7nmoTmlbDnu4RcbmZ1bmN0aW9uIGNvbXBhcmVBcnJheShhMSwgYTIpIHtcbiAgdmFyIGFycjEgPSBhMS5sZW5ndGggPj0gYTIubGVuZ3RoID8gYTEgOiBhMjtcbiAgdmFyIGFycjIgPSBhMS5sZW5ndGggPj0gYTIubGVuZ3RoID8gYTIgOiBhMTtcbiAgdmFyIGlzSW5kZXggPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyMS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhcnIyLmluZGV4T2YoYXJyMVtpXSkgPT09IC0xKSBpc0luZGV4ID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzSW5kZXg7XG59XG5cbnZhciBfa2V5TWFwID0geyAvLyDnibnmrorplK5cbiAgYmFja3NwYWNlOiA4LFxuICB0YWI6IDksXG4gIGNsZWFyOiAxMixcbiAgZW50ZXI6IDEzLFxuICByZXR1cm46IDEzLFxuICBlc2M6IDI3LFxuICBlc2NhcGU6IDI3LFxuICBzcGFjZTogMzIsXG4gIGxlZnQ6IDM3LFxuICB1cDogMzgsXG4gIHJpZ2h0OiAzOSxcbiAgZG93bjogNDAsXG4gIGRlbDogNDYsXG4gIGRlbGV0ZTogNDYsXG4gIGluczogNDUsXG4gIGluc2VydDogNDUsXG4gIGhvbWU6IDM2LFxuICBlbmQ6IDM1LFxuICBwYWdldXA6IDMzLFxuICBwYWdlZG93bjogMzQsXG4gIGNhcHNsb2NrOiAyMCxcbiAgJ+KHqic6IDIwLFxuICAnLCc6IDE4OCxcbiAgJy4nOiAxOTAsXG4gICcvJzogMTkxLFxuICAnYCc6IDE5MixcbiAgJy0nOiBpc2ZmID8gMTczIDogMTg5LFxuICAnPSc6IGlzZmYgPyA2MSA6IDE4NyxcbiAgJzsnOiBpc2ZmID8gNTkgOiAxODYsXG4gICdcXCcnOiAyMjIsXG4gICdbJzogMjE5LFxuICAnXSc6IDIyMSxcbiAgJ1xcXFwnOiAyMjBcbn07XG5cbnZhciBfbW9kaWZpZXIgPSB7IC8vIOS/rumlsOmUrlxuICAn4oenJzogMTYsXG4gIHNoaWZ0OiAxNixcbiAgJ+KMpSc6IDE4LFxuICBhbHQ6IDE4LFxuICBvcHRpb246IDE4LFxuICAn4oyDJzogMTcsXG4gIGN0cmw6IDE3LFxuICBjb250cm9sOiAxNyxcbiAgJ+KMmCc6IGlzZmYgPyAyMjQgOiA5MSxcbiAgY21kOiBpc2ZmID8gMjI0IDogOTEsXG4gIGNvbW1hbmQ6IGlzZmYgPyAyMjQgOiA5MVxufTtcbnZhciBfZG93bktleXMgPSBbXTsgLy8g6K6w5b2V5pGB5LiL55qE57uR5a6a6ZSuXG52YXIgbW9kaWZpZXJNYXAgPSB7XG4gIDE2OiAnc2hpZnRLZXknLFxuICAxODogJ2FsdEtleScsXG4gIDE3OiAnY3RybEtleSdcbn07XG52YXIgX21vZHMgPSB7IDE2OiBmYWxzZSwgMTg6IGZhbHNlLCAxNzogZmFsc2UgfTtcbnZhciBfaGFuZGxlcnMgPSB7fTtcblxuLy8gRjF+RjEyIOeJueauiumUrlxuZm9yICh2YXIgayA9IDE7IGsgPCAyMDsgaysrKSB7XG4gIF9rZXlNYXBbJ2YnICsga10gPSAxMTEgKyBrO1xufVxuXG4vLyDlhbzlrrlGaXJlZm945aSE55CGXG5tb2RpZmllck1hcFtpc2ZmID8gMjI0IDogOTFdID0gJ21ldGFLZXknO1xuX21vZHNbaXNmZiA/IDIyNCA6IDkxXSA9IGZhbHNlO1xuXG52YXIgX3Njb3BlID0gJ2FsbCc7IC8vIOm7mOiupOeDremUruiMg+WbtFxudmFyIGlzQmluZEVsZW1lbnQgPSBmYWxzZTsgLy8g5piv5ZCm57uR5a6a6IqC54K5XG5cbi8vIOi/lOWbnumUrueggVxudmFyIGNvZGUgPSBmdW5jdGlvbiBjb2RlKHgpIHtcbiAgcmV0dXJuIF9rZXlNYXBbeC50b0xvd2VyQ2FzZSgpXSB8fCB4LnRvVXBwZXJDYXNlKCkuY2hhckNvZGVBdCgwKTtcbn07XG5cbi8vIOiuvue9ruiOt+WPluW9k+WJjeiMg+WbtO+8iOm7mOiupOS4uifmiYDmnIkn77yJXG5mdW5jdGlvbiBzZXRTY29wZShzY29wZSkge1xuICBfc2NvcGUgPSBzY29wZSB8fCAnYWxsJztcbn1cbi8vIOiOt+WPluW9k+WJjeiMg+WbtFxuZnVuY3Rpb24gZ2V0U2NvcGUoKSB7XG4gIHJldHVybiBfc2NvcGUgfHwgJ2FsbCc7XG59XG4vLyDojrflj5bmkYHkuIvnu5HlrprplK7nmoTplK7lgLxcbmZ1bmN0aW9uIGdldFByZXNzZWRLZXlDb2RlcygpIHtcbiAgcmV0dXJuIF9kb3duS2V5cy5zbGljZSgwKTtcbn1cblxuLy8g6KGo5Y2V5o6n5Lu25o6n5Lu25Yik5patIOi/lOWbniBCb29sZWFuXG5mdW5jdGlvbiBmaWx0ZXIoZXZlbnQpIHtcbiAgdmFyIHRhZ05hbWUgPSBldmVudC50YXJnZXQudGFnTmFtZSB8fCBldmVudC5zcmNFbGVtZW50LnRhZ05hbWU7XG4gIC8vIOW/veeVpei/meS6m+agh+etvuaDheWGteS4i+W/q+aNt+mUruaXoOaViFxuICByZXR1cm4gISh0YWdOYW1lID09PSAnSU5QVVQnIHx8IHRhZ05hbWUgPT09ICdTRUxFQ1QnIHx8IHRhZ05hbWUgPT09ICdURVhUQVJFQScpO1xufVxuXG4vLyDliKTmlq3mkYHkuIvnmoTplK7mmK/lkKbkuLrmn5DkuKrplK7vvIzov5Tlm550cnVl5oiW6ICFZmFsc2VcbmZ1bmN0aW9uIGlzUHJlc3NlZChrZXlDb2RlKSB7XG4gIGlmICh0eXBlb2Yga2V5Q29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICBrZXlDb2RlID0gY29kZShrZXlDb2RlKTsgLy8g6L2s5o2i5oiQ6ZSu56CBXG4gIH1cbiAgcmV0dXJuIF9kb3duS2V5cy5pbmRleE9mKGtleUNvZGUpICE9PSAtMTtcbn1cblxuLy8g5b6q546v5Yig6ZmkaGFuZGxlcnPkuK3nmoTmiYDmnIkgc2NvcGUo6IyD5Zu0KVxuZnVuY3Rpb24gZGVsZXRlU2NvcGUoc2NvcGUsIG5ld1Njb3BlKSB7XG4gIHZhciBoYW5kbGVycyA9IHZvaWQgMDtcbiAgdmFyIGkgPSB2b2lkIDA7XG5cbiAgLy8g5rKh5pyJ5oyH5a6ac2NvcGXvvIzojrflj5ZzY29wZVxuICBpZiAoIXNjb3BlKSBzY29wZSA9IGdldFNjb3BlKCk7XG5cbiAgZm9yICh2YXIga2V5IGluIF9oYW5kbGVycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoX2hhbmRsZXJzLCBrZXkpKSB7XG4gICAgICBoYW5kbGVycyA9IF9oYW5kbGVyc1trZXldO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDspIHtcbiAgICAgICAgaWYgKGhhbmRsZXJzW2ldLnNjb3BlID09PSBzY29wZSkgaGFuZGxlcnMuc3BsaWNlKGksIDEpO2Vsc2UgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIOWmguaenHNjb3Bl6KKr5Yig6Zmk77yM5bCGc2NvcGXph43nva7kuLphbGxcbiAgaWYgKGdldFNjb3BlKCkgPT09IHNjb3BlKSBzZXRTY29wZShuZXdTY29wZSB8fCAnYWxsJyk7XG59XG5cbi8vIOa4hemZpOS/rumlsOmUrlxuZnVuY3Rpb24gY2xlYXJNb2RpZmllcihldmVudCkge1xuICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaCB8fCBldmVudC5jaGFyQ29kZTtcbiAgdmFyIGkgPSBfZG93bktleXMuaW5kZXhPZihrZXkpO1xuXG4gIC8vIOS7juWIl+ihqOS4rea4hemZpOaMieWOi+i/h+eahOmUrlxuICBpZiAoaSA+PSAwKSBfZG93bktleXMuc3BsaWNlKGksIDEpO1xuXG4gIC8vIOS/rumlsOmUriBzaGlmdEtleSBhbHRLZXkgY3RybEtleSAoY29tbWFuZHx8bWV0YUtleSkg5riF6ZmkXG4gIGlmIChrZXkgPT09IDkzIHx8IGtleSA9PT0gMjI0KSBrZXkgPSA5MTtcbiAgaWYgKGtleSBpbiBfbW9kcykge1xuICAgIF9tb2RzW2tleV0gPSBmYWxzZTtcblxuICAgIC8vIOWwhuS/rumlsOmUrumHjee9ruS4umZhbHNlXG4gICAgZm9yICh2YXIgayBpbiBfbW9kaWZpZXIpIHtcbiAgICAgIGlmIChfbW9kaWZpZXJba10gPT09IGtleSkgaG90a2V5c1trXSA9IGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vLyDop6PpmaTnu5Hlrprmn5DkuKrojIPlm7TnmoTlv6vmjbfplK5cbmZ1bmN0aW9uIHVuYmluZChrZXksIHNjb3BlKSB7XG4gIHZhciBtdWx0aXBsZUtleXMgPSBnZXRLZXlzKGtleSk7XG4gIHZhciBrZXlzID0gdm9pZCAwO1xuICB2YXIgbW9kcyA9IFtdO1xuICB2YXIgb2JqID0gdm9pZCAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbXVsdGlwbGVLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8g5bCG57uE5ZCI5b+r5o236ZSu5ouG5YiG5Li65pWw57uEXG4gICAga2V5cyA9IG11bHRpcGxlS2V5c1tpXS5zcGxpdCgnKycpO1xuXG4gICAgLy8g6K6w5b2V5q+P5Liq57uE5ZCI6ZSu5Lit55qE5L+u6aWw6ZSu55qE6ZSu56CBIOi/lOWbnuaVsOe7hFxuICAgIGlmIChrZXlzLmxlbmd0aCA+IDEpIG1vZHMgPSBnZXRNb2RzKF9tb2RpZmllciwga2V5cyk7XG5cbiAgICAvLyDojrflj5bpmaTkv67ppbDplK7lpJbnmoTplK7lgLxrZXlcbiAgICBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAga2V5ID0ga2V5ID09PSAnKicgPyAnKicgOiBjb2RlKGtleSk7XG5cbiAgICAvLyDliKTmlq3mmK/lkKbkvKDlhaXojIPlm7TvvIzmsqHmnInlsLHojrflj5bojIPlm7RcbiAgICBpZiAoIXNjb3BlKSBzY29wZSA9IGdldFNjb3BlKCk7XG5cbiAgICAvLyDlpoLkvZVrZXnkuI3lnKggX2hhbmRsZXJzIOS4rei/lOWbnuS4jeWBmuWkhOeQhlxuICAgIGlmICghX2hhbmRsZXJzW2tleV0pIHJldHVybjtcblxuICAgIC8vIOa4heepuiBoYW5kbGVycyDkuK3mlbDmja7vvIxcbiAgICAvLyDorqnop6blj5Hlv6vmjbfplK7plK7kuYvlkI7msqHmnInkuovku7bmiafooYzliLDovr7op6PpmaTlv6vmjbfplK7nu5HlrprnmoTnm67nmoRcbiAgICBmb3IgKHZhciByID0gMDsgciA8IF9oYW5kbGVyc1trZXldLmxlbmd0aDsgcisrKSB7XG4gICAgICBvYmogPSBfaGFuZGxlcnNba2V5XVtyXTtcbiAgICAgIC8vIOWIpOaWreaYr+WQpuWcqOiMg+WbtOWGheW5tuS4lOmUruWAvOebuOWQjFxuICAgICAgaWYgKG9iai5zY29wZSA9PT0gc2NvcGUgJiYgY29tcGFyZUFycmF5KG9iai5tb2RzLCBtb2RzKSkge1xuICAgICAgICBfaGFuZGxlcnNba2V5XVtyXSA9IHt9O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyDlr7nnm5HlkKzlr7nlupTlv6vmjbfplK7nmoTlm57osIPlh73mlbDov5vooYzlpITnkIZcbmZ1bmN0aW9uIGV2ZW50SGFuZGxlcihldmVudCwgaGFuZGxlciwgc2NvcGUpIHtcbiAgdmFyIG1vZGlmaWVyc01hdGNoID0gdm9pZCAwO1xuXG4gIC8vIOeci+Wug+aYr+WQpuWcqOW9k+WJjeiMg+WbtFxuICBpZiAoaGFuZGxlci5zY29wZSA9PT0gc2NvcGUgfHwgaGFuZGxlci5zY29wZSA9PT0gJ2FsbCcpIHtcbiAgICAvLyDmo4Dmn6XmmK/lkKbljLnphY3kv67ppbDnrKbvvIjlpoLmnpzmnInov5Tlm550cnVl77yJXG4gICAgbW9kaWZpZXJzTWF0Y2ggPSBoYW5kbGVyLm1vZHMubGVuZ3RoID4gMDtcblxuICAgIGZvciAodmFyIHkgaW4gX21vZHMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoX21vZHMsIHkpKSB7XG4gICAgICAgIGlmICghX21vZHNbeV0gJiYgaGFuZGxlci5tb2RzLmluZGV4T2YoK3kpID4gLTEgfHwgX21vZHNbeV0gJiYgaGFuZGxlci5tb2RzLmluZGV4T2YoK3kpID09PSAtMSkgbW9kaWZpZXJzTWF0Y2ggPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDosIPnlKjlpITnkIbnqIvluo/vvIzlpoLmnpzmmK/kv67ppbDplK7kuI3lgZrlpITnkIZcbiAgICBpZiAoaGFuZGxlci5tb2RzLmxlbmd0aCA9PT0gMCAmJiAhX21vZHNbMTZdICYmICFfbW9kc1sxOF0gJiYgIV9tb2RzWzE3XSAmJiAhX21vZHNbOTFdIHx8IG1vZGlmaWVyc01hdGNoIHx8IGhhbmRsZXIuc2hvcnRjdXQgPT09ICcqJykge1xuICAgICAgaWYgKGhhbmRsZXIubWV0aG9kKGV2ZW50LCBoYW5kbGVyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO2Vsc2UgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGV2ZW50LnN0b3BQcm9wYWdhdGlvbikgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChldmVudC5jYW5jZWxCdWJibGUpIGV2ZW50LmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIOWkhOeQhmtleWRvd27kuovku7ZcbmZ1bmN0aW9uIGRpc3BhdGNoKGV2ZW50KSB7XG4gIHZhciBhc3RlcmlzayA9IF9oYW5kbGVyc1snKiddO1xuICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaCB8fCBldmVudC5jaGFyQ29kZTtcblxuICAvLyDmkJzpm4bnu5HlrprnmoTplK5cbiAgaWYgKF9kb3duS2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSBfZG93bktleXMucHVzaChrZXkpO1xuXG4gIC8vIEdlY2tvKEZpcmVmb3gp55qEY29tbWFuZOmUruWAvDIyNO+8jOWcqFdlYmtpdChDaHJvbWUp5Lit5L+d5oyB5LiA6Ie0XG4gIC8vIFdlYmtpdOW3puWPs2NvbW1hbmTplK7lgLzkuI3kuIDmoLdcbiAgaWYgKGtleSA9PT0gOTMgfHwga2V5ID09PSAyMjQpIGtleSA9IDkxO1xuXG4gIGlmIChrZXkgaW4gX21vZHMpIHtcbiAgICBfbW9kc1trZXldID0gdHJ1ZTtcblxuICAgIC8vIOWwhueJueauiuWtl+espueahGtleeazqOWGjOWIsCBob3RrZXlzIOS4ilxuICAgIGZvciAodmFyIGsgaW4gX21vZGlmaWVyKSB7XG4gICAgICBpZiAoX21vZGlmaWVyW2tdID09PSBrZXkpIGhvdGtleXNba10gPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghYXN0ZXJpc2spIHJldHVybjtcbiAgfVxuXG4gIC8vIOWwhm1vZGlmaWVyTWFw6YeM6Z2i55qE5L+u6aWw6ZSu57uR5a6a5YiwZXZlbnTkuK1cbiAgZm9yICh2YXIgZSBpbiBfbW9kcykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoX21vZHMsIGUpKSB7XG4gICAgICBfbW9kc1tlXSA9IGV2ZW50W21vZGlmaWVyTWFwW2VdXTtcbiAgICB9XG4gIH1cblxuICAvLyDooajljZXmjqfku7bov4fmu6Qg6buY6K6k6KGo5Y2V5o6n5Lu25LiN6Kem5Y+R5b+r5o236ZSuXG4gIGlmICghaG90a2V5cy5maWx0ZXIuY2FsbCh0aGlzLCBldmVudCkpIHJldHVybjtcblxuICAvLyDojrflj5bojIPlm7Qg6buY6K6k5Li6YWxsXG4gIHZhciBzY29wZSA9IGdldFNjb3BlKCk7XG5cbiAgLy8g5a+55Lu75L2V5b+r5o236ZSu6YO96ZyA6KaB5YGa55qE5aSE55CGXG4gIGlmIChhc3Rlcmlzaykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXN0ZXJpc2subGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhc3Rlcmlza1tpXS5zY29wZSA9PT0gc2NvcGUpIGV2ZW50SGFuZGxlcihldmVudCwgYXN0ZXJpc2tbaV0sIHNjb3BlKTtcbiAgICB9XG4gIH1cbiAgLy8ga2V5IOS4jeWcqF9oYW5kbGVyc+S4rei/lOWbnlxuICBpZiAoIShrZXkgaW4gX2hhbmRsZXJzKSkgcmV0dXJuO1xuXG4gIGZvciAodmFyIF9pID0gMDsgX2kgPCBfaGFuZGxlcnNba2V5XS5sZW5ndGg7IF9pKyspIHtcbiAgICAvLyDmib7liLDlpITnkIblhoXlrrlcbiAgICBldmVudEhhbmRsZXIoZXZlbnQsIF9oYW5kbGVyc1trZXldW19pXSwgc2NvcGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhvdGtleXMoa2V5LCBvcHRpb24sIG1ldGhvZCkge1xuICB2YXIga2V5cyA9IGdldEtleXMoa2V5KTsgLy8g6ZyA6KaB5aSE55CG55qE5b+r5o236ZSu5YiX6KGoXG4gIHZhciBtb2RzID0gW107XG4gIHZhciBzY29wZSA9ICdhbGwnOyAvLyBzY29wZem7mOiupOS4umFsbO+8jOaJgOacieiMg+WbtOmDveacieaViFxuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50OyAvLyDlv6vmjbfplK7kuovku7bnu5HlrproioLngrlcbiAgdmFyIGkgPSAwO1xuXG4gIC8vIOWvueS4uuiuvuWumuiMg+WbtOeahOWIpOaWrVxuICBpZiAobWV0aG9kID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG1ldGhvZCA9IG9wdGlvbjtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob3B0aW9uKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICBpZiAob3B0aW9uLnNjb3BlKSBzY29wZSA9IG9wdGlvbi5zY29wZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGlmIChvcHRpb24uZWxlbWVudCkgZWxlbWVudCA9IG9wdGlvbi5lbGVtZW50OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gIH1cblxuICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHNjb3BlID0gb3B0aW9uO1xuXG4gIC8vIOWvueS6juavj+S4quW/q+aNt+mUrui/m+ihjOWkhOeQhlxuICBmb3IgKDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldLnNwbGl0KCcrJyk7IC8vIOaMiemUruWIl+ihqFxuICAgIG1vZHMgPSBbXTtcblxuICAgIC8vIOWmguaenOaYr+e7hOWQiOW/q+aNt+mUruWPluW+l+e7hOWQiOW/q+aNt+mUrlxuICAgIGlmIChrZXkubGVuZ3RoID4gMSkgbW9kcyA9IGdldE1vZHMoX21vZGlmaWVyLCBrZXkpO1xuXG4gICAgLy8g5bCG6Z2e5L+u6aWw6ZSu6L2s5YyW5Li66ZSu56CBXG4gICAga2V5ID0ga2V5W2tleS5sZW5ndGggLSAxXTtcbiAgICBrZXkgPSBrZXkgPT09ICcqJyA/ICcqJyA6IGNvZGUoa2V5KTsgLy8gKuihqOekuuWMuemFjeaJgOacieW/q+aNt+mUrlxuXG4gICAgLy8g5Yik5pata2V55piv5ZCm5ZyoX2hhbmRsZXJz5Lit77yM5LiN5Zyo5bCx6LWL5LiA5Liq56m65pWw57uEXG4gICAgaWYgKCEoa2V5IGluIF9oYW5kbGVycykpIF9oYW5kbGVyc1trZXldID0gW107XG5cbiAgICBfaGFuZGxlcnNba2V5XS5wdXNoKHtcbiAgICAgIHNjb3BlOiBzY29wZSxcbiAgICAgIG1vZHM6IG1vZHMsXG4gICAgICBzaG9ydGN1dDoga2V5c1tpXSxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAga2V5OiBrZXlzW2ldXG4gICAgfSk7XG4gIH1cbiAgLy8g5Zyo5YWo5bGAZG9jdW1lbnTkuIrorr7nva7lv6vmjbfplK5cbiAgaWYgKHR5cGVvZiBlbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAhaXNCaW5kRWxlbWVudCkge1xuICAgIGlzQmluZEVsZW1lbnQgPSB0cnVlO1xuICAgIGFkZEV2ZW50KGVsZW1lbnQsICdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGRpc3BhdGNoKGUpO1xuICAgIH0pO1xuICAgIGFkZEV2ZW50KGVsZW1lbnQsICdrZXl1cCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBjbGVhck1vZGlmaWVyKGUpO1xuICAgIH0pO1xuICB9XG59XG5cbnZhciBfYXBpID0ge1xuICBzZXRTY29wZTogc2V0U2NvcGUsXG4gIGdldFNjb3BlOiBnZXRTY29wZSxcbiAgZGVsZXRlU2NvcGU6IGRlbGV0ZVNjb3BlLFxuICBnZXRQcmVzc2VkS2V5Q29kZXM6IGdldFByZXNzZWRLZXlDb2RlcyxcbiAgaXNQcmVzc2VkOiBpc1ByZXNzZWQsXG4gIGZpbHRlcjogZmlsdGVyLFxuICB1bmJpbmQ6IHVuYmluZFxufTtcbmZvciAodmFyIGEgaW4gX2FwaSkge1xuICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9hcGksIGEpKSB7XG4gICAgaG90a2V5c1thXSA9IF9hcGlbYV07XG4gIH1cbn1cblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHZhciBfaG90a2V5cyA9IHdpbmRvdy5ob3RrZXlzO1xuICBob3RrZXlzLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoZGVlcCkge1xuICAgIGlmIChkZWVwICYmIHdpbmRvdy5ob3RrZXlzID09PSBob3RrZXlzKSB7XG4gICAgICB3aW5kb3cuaG90a2V5cyA9IF9ob3RrZXlzO1xuICAgIH1cbiAgICByZXR1cm4gaG90a2V5cztcbiAgfTtcbiAgd2luZG93LmhvdGtleXMgPSBob3RrZXlzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBob3RrZXlzO1xuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuXG5leHBvcnQgY2xhc3MgSGFuZGxlcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy4kc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6ICdjbG9zZWQnfSlcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uX3Jlc2l6ZS5iaW5kKHRoaXMpKVxuICB9XG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uX3Jlc2l6ZSlcbiAgfVxuXG4gIG9uX3Jlc2l6ZSgpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIGNvbnN0IG5vZGVfbGFiZWxfaWQgPSB0aGlzLiRzaGFkb3cuaG9zdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwtaWQnKVxuICAgICAgY29uc3QgW3NvdXJjZV9lbF0gPSAkKGBbZGF0YS1sYWJlbC1pZD1cIiR7bm9kZV9sYWJlbF9pZH1cIl1gKVxuXG4gICAgICBpZiAoIXNvdXJjZV9lbCkgcmV0dXJuXG5cbiAgICAgIHRoaXMucG9zaXRpb24gPSB7XG4gICAgICAgIG5vZGVfbGFiZWxfaWQsXG4gICAgICAgIGVsOiBzb3VyY2VfZWwsXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHNldCBwb3NpdGlvbih7ZWwsIG5vZGVfbGFiZWxfaWR9KSB7XG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCA9IHRoaXMucmVuZGVyKGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBub2RlX2xhYmVsX2lkKVxuXG4gICAgaWYgKHRoaXMuX2JhY2tkcm9wKSB7XG4gICAgICB0aGlzLmJhY2tkcm9wID0ge1xuICAgICAgICBlbGVtZW50OiB0aGlzLl9iYWNrZHJvcC51cGRhdGUoZWwpLFxuICAgICAgICB1cGRhdGU6ICB0aGlzLl9iYWNrZHJvcC51cGRhdGUsXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0IGJhY2tkcm9wKGJkKSB7XG4gICAgdGhpcy5fYmFja2Ryb3AgPSBiZFxuXG4gICAgY29uc3QgY3VyX2NoaWxkID0gdGhpcy4kc2hhZG93LnF1ZXJ5U2VsZWN0b3IoJ3Zpc2J1Zy1ib3htb2RlbCcpXG5cbiAgICBjdXJfY2hpbGRcbiAgICAgID8gdGhpcy4kc2hhZG93LnJlcGxhY2VDaGlsZChiZC5lbGVtZW50LCBjdXJfY2hpbGQpXG4gICAgICA6IHRoaXMuJHNoYWRvdy5hcHBlbmRDaGlsZChiZC5lbGVtZW50KVxuICB9XG5cbiAgcmVuZGVyKHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgdG9wLCBsZWZ0IH0sIG5vZGVfbGFiZWxfaWQpIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwtaWQnLCBub2RlX2xhYmVsX2lkKVxuICAgIFxuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKHt0b3AsbGVmdH0pfVxuICAgICAgPHN2Z1xuICAgICAgICBjbGFzcz1cInZpc2J1Zy1oYW5kbGVzXCJcbiAgICAgICAgd2lkdGg9XCIke3dpZHRofVwiIGhlaWdodD1cIiR7aGVpZ2h0fVwiXG4gICAgICAgIHZpZXdCb3g9XCIwIDAgJHt3aWR0aH0gJHtoZWlnaHR9XCJcbiAgICAgICAgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgICAgPlxuICAgICAgICA8cmVjdCBzdHJva2U9XCJob3RwaW5rXCIgZmlsbD1cIm5vbmVcIiB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCI+PC9yZWN0PlxuICAgICAgICA8Y2lyY2xlIHN0cm9rZT1cImhvdHBpbmtcIiBmaWxsPVwid2hpdGVcIiBjeD1cIjBcIiBjeT1cIjBcIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIHN0cm9rZT1cImhvdHBpbmtcIiBmaWxsPVwid2hpdGVcIiBjeD1cIjEwMCVcIiBjeT1cIjBcIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIHN0cm9rZT1cImhvdHBpbmtcIiBmaWxsPVwid2hpdGVcIiBjeD1cIjEwMCVcIiBjeT1cIjEwMCVcIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIHN0cm9rZT1cImhvdHBpbmtcIiBmaWxsPVwid2hpdGVcIiBjeD1cIjBcIiBjeT1cIjEwMCVcIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIGZpbGw9XCJob3RwaW5rXCIgY3g9XCIke3dpZHRoLzJ9XCIgY3k9XCIwXCIgcj1cIjJcIj48L2NpcmNsZT5cbiAgICAgICAgPGNpcmNsZSBmaWxsPVwiaG90cGlua1wiIGN4PVwiMFwiIGN5PVwiJHtoZWlnaHQvMn1cIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIGZpbGw9XCJob3RwaW5rXCIgY3g9XCIke3dpZHRoLzJ9XCIgY3k9XCIke2hlaWdodH1cIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgICA8Y2lyY2xlIGZpbGw9XCJob3RwaW5rXCIgY3g9XCIke3dpZHRofVwiIGN5PVwiJHtoZWlnaHQvMn1cIiByPVwiMlwiPjwvY2lyY2xlPlxuICAgICAgPC9zdmc+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKHt0b3AsbGVmdH0pIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCA+IHN2ZyB7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgIHRvcDogJHt0b3AgKyB3aW5kb3cuc2Nyb2xsWX1weDtcbiAgICAgICAgICBsZWZ0OiAke2xlZnR9cHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IHZpc2libGU7XG4gICAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NDtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd2aXNidWctaGFuZGxlcycsIEhhbmRsZXMpXG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgeyBIYW5kbGVzIH0gZnJvbSAnLi9oYW5kbGVzLmVsZW1lbnQnXG5cbmV4cG9ydCBjbGFzcyBIb3ZlciBleHRlbmRzIEhhbmRsZXMge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgfVxuXG4gIHJlbmRlcih7IHgsIHksIHdpZHRoLCBoZWlnaHQsIHRvcCwgbGVmdCB9KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoe3RvcCxsZWZ0fSl9XG4gICAgICA8c3R5bGU+XG4gICAgICAgIDpob3N0IHJlY3Qge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICB2ZWN0b3ItZWZmZWN0OiBub24tc2NhbGluZy1zdHJva2U7XG4gICAgICAgICAgc3Ryb2tlOiBoc2woMjY3LCAxMDAlLCA1OCUpO1xuICAgICAgICAgIHN0cm9rZS13aWR0aDogMXB4O1xuICAgICAgICAgIGZpbGw6IG5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCA+IHN2ZyB7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0MjtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICAgIDxzdmcgd2lkdGg9XCIke3dpZHRofVwiIGhlaWdodD1cIiR7aGVpZ2h0fVwiPlxuICAgICAgICA8cmVjdD48L3JlY3Q+XG4gICAgICA8L3N2Zz5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd2aXNidWctaG92ZXInLCBIb3ZlcilcbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcblxuZXhwb3J0IGNsYXNzIExhYmVsIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLiRzaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogJ2Nsb3NlZCd9KVxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgJCgnYScsIHRoaXMuJHNoYWRvdykub24oJ2NsaWNrIG1vdXNlZW50ZXInLCB0aGlzLmRpc3BhdGNoUXVlcnkuYmluZCh0aGlzKSlcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vbl9yZXNpemUuYmluZCh0aGlzKSlcbiAgfVxuXG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICQoJ2EnLCB0aGlzLiRzaGFkb3cpLm9mZignY2xpY2snLCB0aGlzLmRpc3BhdGNoUXVlcnkpXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25fcmVzaXplKVxuICB9XG5cbiAgb25fcmVzaXplKCkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgY29uc3Qgbm9kZV9sYWJlbF9pZCA9IHRoaXMuJHNoYWRvdy5ob3N0LmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpXG4gICAgICBjb25zdCBbc291cmNlX2VsXSAgID0gJChgW2RhdGEtbGFiZWwtaWQ9XCIke25vZGVfbGFiZWxfaWR9XCJdYClcblxuICAgICAgaWYgKCFzb3VyY2VfZWwpIHJldHVyblxuXG4gICAgICB0aGlzLnBvc2l0aW9uID0ge1xuICAgICAgICBub2RlX2xhYmVsX2lkLFxuICAgICAgICBib3VuZGluZ1JlY3Q6IHNvdXJjZV9lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZGlzcGF0Y2hRdWVyeShlKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3QuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3F1ZXJ5Jywge1xuICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgIGRldGFpbDogICB7XG4gICAgICAgIHRleHQ6ICAgICAgIGUudGFyZ2V0LnRleHRDb250ZW50LFxuICAgICAgICBhY3RpdmF0b3I6ICBlLnR5cGUsXG4gICAgICB9XG4gICAgfSkpXG4gIH1cblxuICBzZXQgdGV4dChjb250ZW50KSB7XG4gICAgdGhpcy5fdGV4dCA9IGNvbnRlbnRcbiAgfVxuXG4gIHNldCBwb3NpdGlvbih7Ym91bmRpbmdSZWN0LCBub2RlX2xhYmVsX2lkfSkge1xuICAgIHRoaXMuJHNoYWRvdy5pbm5lckhUTUwgID0gdGhpcy5yZW5kZXIoYm91bmRpbmdSZWN0LCBub2RlX2xhYmVsX2lkKVxuICB9XG5cbiAgc2V0IHVwZGF0ZSh7eCx5fSkge1xuICAgIGNvbnN0IGxhYmVsID0gdGhpcy4kc2hhZG93LmNoaWxkcmVuWzFdXG4gICAgbGFiZWwuc3R5bGUudG9wICA9IHkgKyB3aW5kb3cuc2Nyb2xsWSArICdweCdcbiAgICBsYWJlbC5zdHlsZS5sZWZ0ID0geCAtIDEgKyAncHgnXG4gIH1cblxuICByZW5kZXIoeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB0b3AsIGxlZnQgfSwgbm9kZV9sYWJlbF9pZCkge1xuICAgIHRoaXMuJHNoYWRvdy5ob3N0LnNldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcsIG5vZGVfbGFiZWxfaWQpXG5cbiAgICByZXR1cm4gYFxuICAgICAgJHt0aGlzLnN0eWxlcyh7dG9wLGxlZnQsd2lkdGh9KX1cbiAgICAgIDxzcGFuPlxuICAgICAgICAke3RoaXMuX3RleHR9XG4gICAgICA8L3NwYW4+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKHt0b3AsbGVmdCx3aWR0aH0pIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgPiBzcGFuIHtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgdG9wOiAke3RvcCArIHdpbmRvdy5zY3JvbGxZfXB4O1xuICAgICAgICAgIGxlZnQ6ICR7bGVmdCAtIDF9cHg7XG4gICAgICAgICAgbWF4LXdpZHRoOiAke3dpZHRoICsgKHdpbmRvdy5pbm5lcldpZHRoIC0gbGVmdCAtIHdpZHRoIC0gMjApfXB4O1xuICAgICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDM7XG4gICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMDAlKTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1sYWJlbC1iZywgaG90cGluayk7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMC4yZW0gMC4yZW0gMCAwO1xuICAgICAgICAgIHRleHQtc2hhZG93OiAwIDAuNXB4IDAgaHNsYSgwLCAwJSwgMCUsIDAuNCk7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMC44ZW07XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgICAgICAgICBmb250LWZhbWlseTogc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBTZWdvZSBVSSwgUm9ib3RvLCBVYnVudHUsIENhbnRhcmVsbCwgTm90byBTYW5zLCBzYW5zLXNlcmlmO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgcGFkZGluZzogMC4yNWVtIDAuNGVtIDAuMTVlbTtcbiAgICAgICAgICBsaW5lLWhlaWdodDogMS4xO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgYSB7XG4gICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgYTpob3ZlciB7XG4gICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgYVtub2RlXTpiZWZvcmUge1xuICAgICAgICAgIGNvbnRlbnQ6IFwiXFxcXDAwM2NcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGFbbm9kZV06YWZ0ZXIge1xuICAgICAgICAgIGNvbnRlbnQ6IFwiXFxcXDAwM2VcIjtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd2aXNidWctbGFiZWwnLCBMYWJlbClcbiIsImV4cG9ydCBjb25zdCBkZXNpcmVkUHJvcE1hcCA9IHtcbiAgY29sb3I6ICAgICAgICAgICAgICAgJ3JnYigwLCAwLCAwKScsXG4gIGJhY2tncm91bmRDb2xvcjogICAgICdyZ2JhKDAsIDAsIDAsIDApJyxcbiAgYmFja2dyb3VuZEltYWdlOiAgICAgJ25vbmUnLFxuICBiYWNrZ3JvdW5kU2l6ZTogICAgICAnYXV0bycsXG4gIGJhY2tncm91bmRQb3NpdGlvbjogICcwJSAwJScsXG4gIC8vIGJvcmRlckNvbG9yOiAgICAgICdyZ2IoMCwgMCwgMCknLFxuICBib3JkZXJXaWR0aDogICAgICAgICAnMHB4JyxcbiAgYm9yZGVyUmFkaXVzOiAgICAgICAgJzBweCcsXG4gIGJveFNoYWRvdzogICAgICAgICAgICdub25lJyxcbiAgcGFkZGluZzogICAgICAgICAgICAgJzBweCcsXG4gIG1hcmdpbjogICAgICAgICAgICAgICcwcHgnLFxuICBmb250RmFtaWx5OiAgICAgICAgICAnJyxcbiAgZm9udFNpemU6ICAgICAgICAgICAgJzE2cHgnLFxuICBmb250V2VpZ2h0OiAgICAgICAgICAnNDAwJyxcbiAgdGV4dEFsaWduOiAgICAgICAgICAgJ3N0YXJ0JyxcbiAgdGV4dFNoYWRvdzogICAgICAgICAgJ25vbmUnLFxuICB0ZXh0VHJhbnNmb3JtOiAgICAgICAnbm9uZScsXG4gIGxpbmVIZWlnaHQ6ICAgICAgICAgICdub3JtYWwnLFxuICBsZXR0ZXJTcGFjaW5nOiAgICAgICAnbm9ybWFsJyxcbiAgZGlzcGxheTogICAgICAgICAgICAgJ2Jsb2NrJyxcbiAgYWxpZ25JdGVtczogICAgICAgICAgJ25vcm1hbCcsXG4gIGp1c3RpZnlDb250ZW50OiAgICAgICdub3JtYWwnLFxuICBmbGV4RGlyZWN0aW9uOiAgICAgICAncm93JyxcbiAgZmxleFdyYXA6ICAgICAgICAgICAgJ25vd3JhcCcsXG4gIGZsZXhCYXNpczogICAgICAgICAgICdhdXRvJyxcbiAgLy8gZmxleEZsb3c6ICAgICAgICAgJ25vbmUnLFxuICBmaWxsOiAgICAgICAgICAgICAgICAncmdiKDAsIDAsIDApJyxcbiAgc3Ryb2tlOiAgICAgICAgICAgICAgJ25vbmUnLFxuICBncmlkVGVtcGxhdGVDb2x1bW5zOiAnbm9uZScsXG4gIGdyaWRBdXRvQ29sdW1uczogICAgICdhdXRvJyxcbiAgZ3JpZFRlbXBsYXRlUm93czogICAgJ25vbmUnLFxuICBncmlkQXV0b1Jvd3M6ICAgICAgICAnYXV0bycsXG4gIGdyaWRUZW1wbGF0ZUFyZWFzOiAgICdub25lJyxcbiAgZ3JpZEFyZWE6ICAgICAgICAgICAgJ2F1dG8gLyBhdXRvIC8gYXV0byAvIGF1dG8nLFxuICBnYXA6ICAgICAgICAgICAgICAgICAnbm9ybWFsIG5vcm1hbCcsXG4gIGdyaWRBdXRvRmxvdzogICAgICAgICdyb3cnLFxufVxuXG5leHBvcnQgY29uc3QgZGVzaXJlZEFjY2Vzc2liaWxpdHlNYXAgPSBbXG4gICdyb2xlJyxcbiAgJ3RhYmluZGV4JyxcbiAgJ2FyaWEtKicsXG4gICdmb3InLFxuICAnYWx0JyxcbiAgJ3RpdGxlJyxcbiAgJ3R5cGUnLFxuXVxuXG5leHBvcnQgY29uc3QgbGFyZ2VXQ0FHMlRleHRNYXAgPSBbXG4gIHtcbiAgICBmb250U2l6ZTogJzI0cHgnLFxuICAgIGZvbnRXZWlnaHQ6ICcwJ1xuICB9LFxuICB7XG4gICAgZm9udFNpemU6ICcxOC41cHgnLFxuICAgIGZvbnRXZWlnaHQ6ICc3MDAnXG4gIH1cbl1cbiIsImltcG9ydCB7IGRlc2lyZWRQcm9wTWFwIH0gZnJvbSAnLi9kZXNpZ24tcHJvcGVydGllcydcblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlID0gKGVsLCBuYW1lKSA9PiB7XG4gIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJylcbiAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgbGV0IHMgPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCAnJylcbiAgICByZXR1cm4gcyAmJiBzLmdldFByb3BlcnR5VmFsdWUobmFtZSlcbiAgfSBcbn1cblxuZXhwb3J0IGNvbnN0IGdldFN0eWxlcyA9IGVsID0+IHtcbiAgY29uc3QgZWxTdHlsZU9iamVjdCA9IGVsLnN0eWxlXG4gIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbClcblxuICBsZXQgZGVzaXJlZFZhbHVlcyA9IFtdXG5cbiAgZm9yIChwcm9wIGluIGVsLnN0eWxlKVxuICAgIGlmIChwcm9wIGluIGRlc2lyZWRQcm9wTWFwICYmIGRlc2lyZWRQcm9wTWFwW3Byb3BdICE9IGNvbXB1dGVkU3R5bGVbcHJvcF0pXG4gICAgICBkZXNpcmVkVmFsdWVzLnB1c2goe1xuICAgICAgICBwcm9wLFxuICAgICAgICB2YWx1ZTogY29tcHV0ZWRTdHlsZVtwcm9wXS5yZXBsYWNlKC8sIHJnYmEvZywgJ1xccnJnYmEnKVxuICAgICAgfSlcblxuICByZXR1cm4gZGVzaXJlZFZhbHVlc1xufVxuXG5leHBvcnQgY29uc3QgZ2V0Q29tcHV0ZWRCYWNrZ3JvdW5kQ29sb3IgPSBlbCA9PiB7XG4gIGxldCBiYWNrZ3JvdW5kID0gZ2V0U3R5bGUoZWwsICdiYWNrZ3JvdW5kLWNvbG9yJylcblxuICBpZiAoYmFja2dyb3VuZCA9PT0gJ3JnYmEoMCwgMCwgMCwgMCknKSB7XG4gICAgbGV0IG5vZGUgID0gZmluZE5lYXJlc3RQYXJlbnRFbGVtZW50KGVsKVxuICAgICAgLCBmb3VuZCA9IGZhbHNlXG5cbiAgICB3aGlsZSghZm91bmQpIHtcbiAgICAgIGxldCBiZyAgPSBnZXRTdHlsZShub2RlLCAnYmFja2dyb3VuZC1jb2xvcicpXG5cbiAgICAgIGlmIChiZyAhPT0gJ3JnYmEoMCwgMCwgMCwgMCknKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBiYWNrZ3JvdW5kID0gYmdcbiAgICAgIH1cblxuICAgICAgbm9kZSA9IGZpbmROZWFyZXN0UGFyZW50RWxlbWVudChub2RlKVxuXG4gICAgICBpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBiYWNrZ3JvdW5kID0gJ3doaXRlJ1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBiYWNrZ3JvdW5kXG59XG5cbmV4cG9ydCBjb25zdCBmaW5kTmVhcmVzdFBhcmVudEVsZW1lbnQgPSBlbCA9PlxuICBlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUubm9kZVR5cGUgPT09IDFcbiAgICA/IGVsLnBhcmVudE5vZGVcbiAgICA6IGVsLnBhcmVudE5vZGUubm9kZU5hbWUgPT09ICcjZG9jdW1lbnQtZnJhZ21lbnQnXG4gICAgICA/IGVsLnBhcmVudE5vZGUuaG9zdFxuICAgICAgOiBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUuaG9zdFxuXG5leHBvcnQgY29uc3QgZmluZE5lYXJlc3RDaGlsZEVsZW1lbnQgPSBlbCA9PiB7XG4gIGlmIChlbC5zaGFkb3dSb290ICYmIGVsLnNoYWRvd1Jvb3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgcmV0dXJuIFsuLi5lbC5zaGFkb3dSb290LmNoaWxkcmVuXVxuICAgICAgLmZpbHRlcigoe25vZGVOYW1lfSkgPT4gXG4gICAgICAgICFbJ0xJTksnLCdTVFlMRScsJ1NDUklQVCcsJ0hUTUwnLCdIRUFEJ10uaW5jbHVkZXMobm9kZU5hbWUpXG4gICAgICApWzBdXG4gIH1cbiAgZWxzZSBpZiAoZWwuY2hpbGRyZW4ubGVuZ3RoKVxuICAgIHJldHVybiBlbC5jaGlsZHJlblswXVxufVxuXG5leHBvcnQgY29uc3QgbG9hZFN0eWxlcyA9IGFzeW5jIHN0eWxlc2hlZXRzID0+IHtcbiAgY29uc3QgZmV0Y2hlcyA9IGF3YWl0IFByb21pc2UuYWxsKHN0eWxlc2hlZXRzLm1hcCh1cmwgPT4gZmV0Y2godXJsKSkpXG4gIGNvbnN0IHRleHRzICAgPSBhd2FpdCBQcm9taXNlLmFsbChmZXRjaGVzLm1hcCh1cmwgPT4gdXJsLnRleHQoKSkpXG4gIGNvbnN0IHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG5cbiAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0cy5yZWR1Y2UoKHN0eWxlcywgZmlsZUNvbnRlbnRzKSA9PiBcbiAgICBzdHlsZXMgKyBmaWxlQ29udGVudHNcbiAgLCAnJylcblxuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKVxufVxuIiwiaW1wb3J0IHsgZGVzaXJlZEFjY2Vzc2liaWxpdHlNYXAsIGRlc2lyZWRQcm9wTWFwLCBsYXJnZVdDQUcyVGV4dE1hcCB9IGZyb20gJy4vZGVzaWduLXByb3BlcnRpZXMnXG5pbXBvcnQgeyBnZXRTdHlsZXMgfSBmcm9tICcuL3N0eWxlcydcblxuZXhwb3J0IGNvbnN0IGdldEExMXlzID0gZWwgPT4ge1xuICBjb25zdCBlbEF0dHJpYnV0ZXMgPSBlbC5nZXRBdHRyaWJ1dGVOYW1lcygpXG5cbiAgcmV0dXJuIGRlc2lyZWRBY2Nlc3NpYmlsaXR5TWFwLnJlZHVjZSgoYWNjLCBhdHRyaWJ1dGUpID0+IHtcbiAgICBpZiAoZWxBdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHJpYnV0ZSkpXG4gICAgICBhY2MucHVzaCh7XG4gICAgICAgIHByb3A6ICAgYXR0cmlidXRlLFxuICAgICAgICB2YWx1ZTogIGVsLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpXG4gICAgICB9KVxuXG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gJ2FyaWEtKicpXG4gICAgICBlbEF0dHJpYnV0ZXMuZm9yRWFjaChhdHRyID0+IHtcbiAgICAgICAgaWYgKGF0dHIuaW5jbHVkZXMoJ2FyaWEnKSlcbiAgICAgICAgICBhY2MucHVzaCh7XG4gICAgICAgICAgICBwcm9wOiAgIGF0dHIsXG4gICAgICAgICAgICB2YWx1ZTogIGVsLmdldEF0dHJpYnV0ZShhdHRyKVxuICAgICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgcmV0dXJuIGFjY1xuICB9LCBbXSlcbn1cblxuZXhwb3J0IGNvbnN0IGdldFdDQUcyVGV4dFNpemUgPSBlbCA9PiB7XG4gIFxuICBjb25zdCBzdHlsZXMgPSBnZXRTdHlsZXMoZWwpLnJlZHVjZSgoc3R5bGVNYXAsIHN0eWxlKSA9PiB7XG4gICAgICBzdHlsZU1hcFtzdHlsZS5wcm9wXSA9IHN0eWxlLnZhbHVlXG4gICAgICByZXR1cm4gc3R5bGVNYXBcbiAgfSwge30pXG5cbiAgY29uc3QgeyBmb250U2l6ZSAgID0gZGVzaXJlZFByb3BNYXAuZm9udFNpemUsXG4gICAgICAgICAgZm9udFdlaWdodCA9IGRlc2lyZWRQcm9wTWFwLmZvbnRXZWlnaHRcbiAgICAgIH0gPSBzdHlsZXNcbiAgXG4gIGNvbnN0IGlzTGFyZ2UgPSBsYXJnZVdDQUcyVGV4dE1hcC5zb21lKFxuICAgIChsYXJnZVByb3BlcnRpZXMpID0+IHBhcnNlRmxvYXQoZm9udFNpemUpID49IHBhcnNlRmxvYXQobGFyZ2VQcm9wZXJ0aWVzLmZvbnRTaXplKSBcbiAgICAgICAmJiBwYXJzZUZsb2F0KGZvbnRXZWlnaHQpID49IHBhcnNlRmxvYXQobGFyZ2VQcm9wZXJ0aWVzLmZvbnRXZWlnaHQpIFxuICApXG5cbiAgcmV0dXJuICBpc0xhcmdlID8gJ0xhcmdlJyA6ICdTbWFsbCdcbn0iLCJleHBvcnQgY29uc3QgY2FtZWxUb0Rhc2ggPSAoY2FtZWxTdHJpbmcgPSBcIlwiKSA9PlxuICBjYW1lbFN0cmluZy5yZXBsYWNlKC8oW0EtWl0pL2csICgkMSkgPT5cbiAgICBcIi1cIiskMS50b0xvd2VyQ2FzZSgpKVxuXG5leHBvcnQgY29uc3Qgbm9kZUtleSA9IG5vZGUgPT4ge1xuICBsZXQgdHJlZSA9IFtdXG4gIGxldCBmdXJ0aGVzdF9sZWFmID0gbm9kZVxuXG4gIHdoaWxlIChmdXJ0aGVzdF9sZWFmKSB7XG4gICAgdHJlZS5wdXNoKGZ1cnRoZXN0X2xlYWYpXG4gICAgZnVydGhlc3RfbGVhZiA9IGZ1cnRoZXN0X2xlYWYucGFyZW50Tm9kZVxuICAgICAgPyBmdXJ0aGVzdF9sZWFmLnBhcmVudE5vZGVcbiAgICAgIDogZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cmVlLnJlZHVjZSgocGF0aCwgYnJhbmNoKSA9PiBgXG4gICAgJHtwYXRofSR7YnJhbmNoLnRhZ05hbWV9XyR7YnJhbmNoLmNsYXNzTmFtZX1fJHtbLi4ubm9kZS5wYXJlbnROb2RlLmNoaWxkcmVuXS5pbmRleE9mKG5vZGUpfV8ke25vZGUuY2hpbGRyZW4ubGVuZ3RofVxuICBgLCAnJylcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNsYXNzbmFtZSA9IChlbCwgZWxsaXBzZSA9IGZhbHNlKSA9PiB7XG4gIGlmICghZWwuY2xhc3NOYW1lKSByZXR1cm4gJydcbiAgXG4gIGNvbnN0IGNvbWJpbmVkID0gQXJyYXkuZnJvbShlbC5jbGFzc0xpc3QpLnJlZHVjZSgoY2xhc3NuYW1lcywgY2xhc3NuYW1lKSA9PlxuICAgIGNsYXNzbmFtZXMgKz0gJy4nICsgY2xhc3NuYW1lXG4gICwgJycpXG5cbiAgcmV0dXJuIGVsbGlwc2UgJiYgY29tYmluZWQubGVuZ3RoID4gMzBcbiAgICA/IGNvbWJpbmVkLnN1YnN0cmluZygwLDMwKSArICcuLi4nXG4gICAgOiBjb21iaW5lZFxufVxuXG5leHBvcnQgY29uc3QgbWV0YUtleSA9IHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0uaW5jbHVkZXMoJ01hYycpXG4gID8gJ2NtZCdcbiAgOiAnY3RybCdcblxuZXhwb3J0IGNvbnN0IGFsdEtleSA9IHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0uaW5jbHVkZXMoJ01hYycpXG4gID8gJ29wdCdcbiAgOiAnYWx0J1xuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IHsgbm9kZUtleSB9IGZyb20gJy4vc3RyaW5ncydcblxuZXhwb3J0IGNvbnN0IGRlZXBFbGVtZW50RnJvbVBvaW50ID0gKHgsIHkpID0+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpXG5cbiAgY29uc3QgY3Jhd2xTaGFkb3dzID0gbm9kZSA9PiB7XG4gICAgaWYgKG5vZGUuc2hhZG93Um9vdCkge1xuICAgICAgY29uc3QgcG90ZW50aWFsID0gbm9kZS5zaGFkb3dSb290LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSlcblxuICAgICAgaWYgKHBvdGVudGlhbCA9PSBub2RlKSAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICAgZWxzZSBpZiAocG90ZW50aWFsLnNoYWRvd1Jvb3QpICByZXR1cm4gY3Jhd2xTaGFkb3dzKHBvdGVudGlhbClcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvdGVudGlhbFxuICAgIH1cbiAgICBlbHNlIHJldHVybiBub2RlXG4gIH1cblxuICBjb25zdCBuZXN0ZWRfc2hhZG93ID0gY3Jhd2xTaGFkb3dzKGVsKVxuXG4gIHJldHVybiBuZXN0ZWRfc2hhZG93IHx8IGVsXG59XG5cbmV4cG9ydCBjb25zdCBnZXRTaWRlID0gZGlyZWN0aW9uID0+IHtcbiAgbGV0IHN0YXJ0ID0gZGlyZWN0aW9uLnNwbGl0KCcrJykucG9wKCkucmVwbGFjZSgvXlxcdy8sIGMgPT4gYy50b1VwcGVyQ2FzZSgpKVxuICBpZiAoc3RhcnQgPT0gJ1VwJykgc3RhcnQgPSAnVG9wJ1xuICBpZiAoc3RhcnQgPT0gJ0Rvd24nKSBzdGFydCA9ICdCb3R0b20nXG4gIHJldHVybiBzdGFydFxufVxuXG5leHBvcnQgY29uc3QgZ2V0Tm9kZUluZGV4ID0gZWwgPT4ge1xuICByZXR1cm4gWy4uLmVsLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5jaGlsZHJlbl1cbiAgICAuaW5kZXhPZihlbC5wYXJlbnRFbGVtZW50KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0VkZ2UoZWwpIHtcbiAgcmV0dXJuIGVsLmFuaW1hdGUoW1xuICAgIHsgb3V0bGluZTogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcgfSxcbiAgICB7IG91dGxpbmU6ICcxcHggc29saWQgaHNsYSgzMzAsIDEwMCUsIDcxJSwgODAlKScgfSxcbiAgICB7IG91dGxpbmU6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnIH0sXG4gIF0sIDYwMClcbn1cblxubGV0IHRpbWVvdXRNYXAgPSB7fVxuZXhwb3J0IGNvbnN0IHNob3dIaWRlU2VsZWN0ZWQgPSAoZWwsIGR1cmF0aW9uID0gNzUwKSA9PiB7XG4gIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZC1oaWRlJywgdHJ1ZSlcbiAgc2hvd0hpZGVOb2RlTGFiZWwoZWwsIHRydWUpXG5cbiAgaWYgKHRpbWVvdXRNYXBbbm9kZUtleShlbCldKVxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0TWFwW25vZGVLZXkoZWwpXSlcblxuICB0aW1lb3V0TWFwW25vZGVLZXkoZWwpXSA9IHNldFRpbWVvdXQoXyA9PiB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkLWhpZGUnKVxuICAgIHNob3dIaWRlTm9kZUxhYmVsKGVsLCBmYWxzZSlcbiAgfSwgZHVyYXRpb24pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBjb25zdCBzaG93SGlkZU5vZGVMYWJlbCA9IChlbCwgc2hvdyA9IGZhbHNlKSA9PiB7XG4gIGlmICghZWwuaGFzQXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJykpXG4gICAgcmV0dXJuXG5cbiAgY29uc3QgbGFiZWxfaWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwtaWQnKVxuXG4gIGNvbnN0IG5vZGVzID0gJChgXG4gICAgdmlzYnVnLWxhYmVsW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsX2lkfVwiXSxcbiAgICB2aXNidWctaGFuZGxlc1tkYXRhLWxhYmVsLWlkPVwiJHtsYWJlbF9pZH1cIl1cbiAgYClcblxuICBub2Rlcy5sZW5ndGggJiYgc2hvd1xuICAgID8gbm9kZXMuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJylcbiAgICA6IG5vZGVzLmZvckVhY2goZWwgPT5cbiAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSBudWxsKVxufVxuXG5leHBvcnQgY29uc3QgaHRtbFN0cmluZ1RvRG9tID0gKGh0bWxTdHJpbmcgPSBcIlwiKSA9PlxuICAobmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhodG1sU3RyaW5nLCAndGV4dC9odG1sJykpXG4gICAgLmJvZHkuZmlyc3RDaGlsZFxuXG5leHBvcnQgY29uc3QgaXNPZmZCb3VuZHMgPSBub2RlID0+XG4gIG5vZGUuY2xvc2VzdCAmJiAoXG4gICAgICAgbm9kZS5jbG9zZXN0KCd2aXMtYnVnJylcbiAgICB8fCBub2RlLmNsb3Nlc3QoJ2hvdGtleS1tYXAnKVxuICAgIHx8IG5vZGUuY2xvc2VzdCgndmlzYnVnLW1ldGF0aXAnKVxuICAgIHx8IG5vZGUuY2xvc2VzdCgndmlzYnVnLWFsbHknKVxuICAgIHx8IG5vZGUuY2xvc2VzdCgndmlzYnVnLWxhYmVsJylcbiAgICB8fCBub2RlLmNsb3Nlc3QoJ3Zpc2J1Zy1oYW5kbGVzJylcbiAgICB8fCBub2RlLmNsb3Nlc3QoJ3Zpc2J1Zy1ncmlkbGluZXMnKVxuICApXG5cbmV4cG9ydCBjb25zdCBpc1NlbGVjdG9yVmFsaWQgPSAocXMgPT4gKFxuICBzZWxlY3RvciA9PiB7XG4gICAgdHJ5IHsgcXMoc2VsZWN0b3IpIH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4pKShzID0+IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKS5xdWVyeVNlbGVjdG9yKHMpKVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHdpbmRvd0JvdW5kcygpIHtcbiAgY29uc3QgaGVpZ2h0ICA9IHdpbmRvdy5pbm5lckhlaWdodFxuICBjb25zdCB3aWR0aCAgID0gd2luZG93LmlubmVyV2lkdGhcbiAgY29uc3QgYm9keSAgICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcblxuICBjb25zdCBjYWxjV2lkdGggPSBib2R5IDw9IHdpZHRoXG4gICAgPyBib2R5XG4gICAgOiB3aWR0aFxuXG4gIHJldHVybiB7XG4gICAgd2luSGVpZ2h0OiBoZWlnaHQsXG4gICAgd2luV2lkdGg6ICBjYWxjV2lkdGgsXG4gIH1cbn1cbiIsImltcG9ydCB7IHdpbmRvd0JvdW5kcyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy8nXG5cbmV4cG9ydCBjbGFzcyBHcmlkbGluZXMgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuJHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnY2xvc2VkJ30pXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge31cblxuICBzZXQgcG9zaXRpb24oYm91bmRpbmdSZWN0KSB7XG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCAgPSB0aGlzLnJlbmRlcihib3VuZGluZ1JlY3QpXG4gIH1cblxuICBzZXQgdXBkYXRlKHsgd2lkdGgsIGhlaWdodCwgdG9wLCBsZWZ0IH0pIHtcbiAgICBjb25zdCB7IHdpbkhlaWdodCwgd2luV2lkdGggfSA9IHdpbmRvd0JvdW5kcygpXG5cbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIGNvbnN0IHN2ZyA9IHRoaXMuJHNoYWRvdy5jaGlsZHJlblsxXVxuXG4gICAgc3ZnLnNldEF0dHJpYnV0ZSgndmlld0JveCcsIGAwIDAgJHt3aW5XaWR0aH0gJHt3aW5IZWlnaHR9YClcbiAgICBzdmcuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKCd3aWR0aCcsIHdpZHRoICsgJ3B4JylcbiAgICBzdmcuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKVxuICAgIHN2Zy5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ3gnLCBsZWZ0KVxuICAgIHN2Zy5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ3knLCB0b3ApXG4gICAgc3ZnLmNoaWxkcmVuWzFdLnNldEF0dHJpYnV0ZSgneDEnLCBsZWZ0KVxuICAgIHN2Zy5jaGlsZHJlblsxXS5zZXRBdHRyaWJ1dGUoJ3gyJywgbGVmdClcbiAgICBzdmcuY2hpbGRyZW5bMl0uc2V0QXR0cmlidXRlKCd4MScsIGxlZnQgKyB3aWR0aClcbiAgICBzdmcuY2hpbGRyZW5bMl0uc2V0QXR0cmlidXRlKCd4MicsIGxlZnQgKyB3aWR0aClcbiAgICBzdmcuY2hpbGRyZW5bM10uc2V0QXR0cmlidXRlKCd5MScsIHRvcClcbiAgICBzdmcuY2hpbGRyZW5bM10uc2V0QXR0cmlidXRlKCd5MicsIHRvcClcbiAgICBzdmcuY2hpbGRyZW5bM10uc2V0QXR0cmlidXRlKCd4MicsIHdpbldpZHRoKVxuICAgIHN2Zy5jaGlsZHJlbls0XS5zZXRBdHRyaWJ1dGUoJ3kxJywgdG9wICsgaGVpZ2h0KVxuICAgIHN2Zy5jaGlsZHJlbls0XS5zZXRBdHRyaWJ1dGUoJ3kyJywgdG9wICsgaGVpZ2h0KVxuICAgIHN2Zy5jaGlsZHJlbls0XS5zZXRBdHRyaWJ1dGUoJ3gyJywgd2luV2lkdGgpXG4gIH1cblxuICByZW5kZXIoeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB0b3AsIGxlZnQgfSkge1xuICAgIGNvbnN0IHsgd2luSGVpZ2h0LCB3aW5XaWR0aCB9ID0gd2luZG93Qm91bmRzKClcblxuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKHt0b3AsbGVmdH0pfVxuICAgICAgPHN2Z1xuICAgICAgICB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCJcbiAgICAgICAgdmlld0JveD1cIjAgMCAke3dpbldpZHRofSAke3dpbkhlaWdodH1cIlxuICAgICAgICB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICA+XG4gICAgICAgIDxyZWN0XG4gICAgICAgICAgc3Ryb2tlPVwiaG90cGlua1wiIGZpbGw9XCJub25lXCJcbiAgICAgICAgICB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCJcbiAgICAgICAgICB4PVwiJHt4fVwiIHk9XCIke3l9XCJcbiAgICAgICAgICBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIlxuICAgICAgICA+PC9yZWN0PlxuICAgICAgICA8bGluZSB4MT1cIiR7eH1cIiB5MT1cIjBcIiB4Mj1cIiR7eH1cIiB5Mj1cIiR7d2luSGVpZ2h0fVwiIHN0cm9rZT1cImhvdHBpbmtcIiBzdHJva2UtZGFzaGFycmF5PVwiMlwiIHN0cm9rZS1kYXNob2Zmc2V0PVwiM1wiPjwvbGluZT5cbiAgICAgICAgPGxpbmUgeDE9XCIke3ggKyB3aWR0aH1cIiB5MT1cIjBcIiB4Mj1cIiR7eCArIHdpZHRofVwiIHkyPVwiJHt3aW5IZWlnaHR9XCIgc3Ryb2tlPVwiaG90cGlua1wiIHN0cm9rZS1kYXNoYXJyYXk9XCIyXCIgc3Ryb2tlLWRhc2hvZmZzZXQ9XCIzXCI+PC9saW5lPlxuICAgICAgICA8bGluZSB4MT1cIjBcIiB5MT1cIiR7eX1cIiB4Mj1cIiR7d2luV2lkdGh9XCIgeTI9XCIke3l9XCIgc3Ryb2tlPVwiaG90cGlua1wiIHN0cm9rZS1kYXNoYXJyYXk9XCIyXCIgc3Ryb2tlLWRhc2hvZmZzZXQ9XCIzXCI+PC9saW5lPlxuICAgICAgICA8bGluZSB4MT1cIjBcIiB5MT1cIiR7eSArIGhlaWdodH1cIiB4Mj1cIiR7d2luV2lkdGh9XCIgeTI9XCIke3kgKyBoZWlnaHR9XCIgc3Ryb2tlPVwiaG90cGlua1wiIHN0cm9rZS1kYXNoYXJyYXk9XCIyXCIgc3Ryb2tlLWRhc2hvZmZzZXQ9XCIzXCI+PC9saW5lPlxuICAgICAgPC9zdmc+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKHt0b3AsbGVmdH0pIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCA+IHN2ZyB7XG4gICAgICAgICAgcG9zaXRpb246Zml4ZWQ7XG4gICAgICAgICAgdG9wOjA7XG4gICAgICAgICAgbGVmdDowO1xuICAgICAgICAgIG92ZXJmbG93OnZpc2libGU7XG4gICAgICAgICAgcG9pbnRlci1ldmVudHM6bm9uZTtcbiAgICAgICAgICB6LWluZGV4OjIxNDc0ODM2NDI7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndmlzYnVnLWdyaWRsaW5lcycsIEdyaWRsaW5lcylcbiIsImV4cG9ydCBjbGFzcyBEaXN0YW5jZSBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy4kc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge31cblxuICBzZXQgcG9zaXRpb24ocGF5bG9hZCkge1xuICAgIHRoaXMuJHNoYWRvdy5pbm5lckhUTUwgPSB0aGlzLnJlbmRlcihwYXlsb2FkKVxuICB9XG5cbiAgcmVuZGVyKHtsaW5lX21vZGVsLCBub2RlX2xhYmVsX2lkfSkge1xuICAgIHRoaXMuJHNoYWRvdy5ob3N0LnNldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcsIG5vZGVfbGFiZWxfaWQpXG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMobGluZV9tb2RlbCl9XG4gICAgICA8ZmlndXJlIHF1YWRyYW50PVwibWVhc3VyZW1lbnRzLnFcIj5cbiAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgPGZpZ2NhcHRpb24+PGI+JHtsaW5lX21vZGVsLmR9PC9iPnB4PC9maWdjYXB0aW9uPlxuICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgPC9maWd1cmU+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKHt5LHgsZCxxLHYgPSBmYWxzZSwgY29sb3J9KSB7XG4gICAgY29uc3QgY29sb3JzID0ge31cbiAgICBpZiAoY29sb3IpIHtcbiAgICAgIGNvbnN0IHNpbmdsZSA9IGNvbG9yID09PSAncGluaydcbiAgICAgICAgPyAnaG90cGluaydcbiAgICAgICAgOiAnaHNsKDI2NywgMTAwJSwgNTglKSdcblxuICAgICAgY29sb3JzLmxpbmUgPSBzaW5nbGVcbiAgICAgIGNvbG9ycy5iYXNlID0gc2luZ2xlXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29sb3JzLmxpbmUgPSAnaHNsKDI2NywgMTAwJSwgNTglKSdcbiAgICAgIGNvbG9ycy5iYXNlID0gJ2hvdHBpbmsnXG4gICAgfVxuXG4gICAgcmV0dXJuIGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgIC0tbGluZS1jb2xvcjogJHtjb2xvcnMubGluZX07XG4gICAgICAgICAgLS1saW5lLWJhc2U6ICR7Y29sb3JzLmJhc2V9O1xuICAgICAgICAgIC0tbGluZS13aWR0aDogMXB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0ID4gZmlndXJlIHtcbiAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICR7dlxuICAgICAgICAgICAgPyBgaGVpZ2h0OiAke2R9cHg7IHdpZHRoOiA1cHg7YFxuICAgICAgICAgICAgOiBgbWluLXdpZHRoOiAke2R9cHg7IGhlaWdodDogNXB4O2B9XG4gICAgICAgICAgdG9wOiAke3kgKyB3aW5kb3cuc2Nyb2xsWX1weDtcbiAgICAgICAgICAke3EgPT09ICdsZWZ0JyA/ICdyaWdodCcgOiAnbGVmdCd9OiAke3h9cHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IHZpc2libGU7XG4gICAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246ICR7diA/ICdjb2x1bW4nIDogJ3Jvdyd9O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgPiBmaWd1cmUgZmlnY2FwdGlvbiB7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIHRleHQtc2hhZG93OiAwIDAuNXB4IDAgaHNsYSgwLCAwJSwgMCUsIDAuNCk7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAwLjVweCAwIGhzbGEoMCwgMCUsIDAlLCAwLjQpO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWxpbmUtY29sb3IpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDFlbTtcbiAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICBmb250LXNpemU6IDAuN2VtO1xuICAgICAgICAgIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIFNlZ29lIFVJLCBSb2JvdG8sIFVidW50dSwgQ2FudGFyZWxsLCBOb3RvIFNhbnMsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgcGFkZGluZzogMC4yNWVtIDAuNWVtIDAuMjc1ZW07XG4gICAgICAgICAgZm9udC12YXJpYW50LW51bWVyaWM6IHByb3BvcnRpb25hbC1udW0gb2xkc3R5bGUtbnVtcyBzdGFja2VkLWZyYWN0aW9ucyBzbGFzaGVkLXplcm87XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCA+IGZpZ3VyZSBzcGFuIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1saW5lLWNvbG9yKTtcbiAgICAgICAgICAke3ZcbiAgICAgICAgICAgID8gJ2hlaWdodDogdmFyKC0tbGluZS13aWR0aCk7IHdpZHRoOiA1cHg7J1xuICAgICAgICAgICAgOiAnd2lkdGg6IHZhcigtLWxpbmUtd2lkdGgpOyBoZWlnaHQ6IDVweDsnfVxuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgPiBmaWd1cmUgZGl2IHtcbiAgICAgICAgICBmbGV4OiAyO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWxpbmUtY29sb3IpO1xuICAgICAgICAgICR7dlxuICAgICAgICAgICAgPyAnd2lkdGg6IHZhcigtLWxpbmUtd2lkdGgpOydcbiAgICAgICAgICAgIDogJ2hlaWdodDogdmFyKC0tbGluZS13aWR0aCk7J31cbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGZpZ3VyZSA+IGRpdiR7cSA9PT0gJ3RvcCcgfHwgcSA9PT0gJ2xlZnQnID8gJzpsYXN0LW9mLXR5cGUnIDogJzpmaXJzdC1vZi10eXBlJ30ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byAke3F9LCB2YXIoLS1saW5lLWJhc2UpIDAlLCB2YXIoLS1saW5lLWNvbG9yKSAxMDAlKTtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd2aXNidWctZGlzdGFuY2UnLCBEaXN0YW5jZSlcbiIsImV4cG9ydCBjbGFzcyBPdmVybGF5IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuJHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnY2xvc2VkJ30pXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge31cblxuICBzZXQgcG9zaXRpb24oYm91bmRpbmdSZWN0KSB7XG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCAgPSB0aGlzLnJlbmRlcihib3VuZGluZ1JlY3QpXG4gIH1cblxuICBzZXQgdXBkYXRlKHsgdG9wLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0IH0pIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuXG4gICAgY29uc3Qgc3ZnID0gdGhpcy4kc2hhZG93LmNoaWxkcmVuWzBdXG4gICAgc3ZnLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgc3ZnLnN0eWxlLnRvcCA9IHdpbmRvdy5zY3JvbGxZICsgdG9wICsgJ3B4J1xuICAgIHN2Zy5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCdcblxuICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgd2lkdGggKyAncHgnKVxuICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIGhlaWdodCArICdweCcpXG4gIH1cblxuICByZW5kZXIoe2lkLCB0b3AsIGxlZnQsIGhlaWdodCwgd2lkdGh9KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzdmcgXG4gICAgICAgIGNsYXNzPVwidmlzYnVnLW92ZXJsYXlcIlxuICAgICAgICBvdmVybGF5LWlkPVwiJHtpZH1cIlxuICAgICAgICBzdHlsZT1cIlxuICAgICAgICAgIGRpc3BsYXk6bm9uZTtcbiAgICAgICAgICBwb3NpdGlvbjphYnNvbHV0ZTtcbiAgICAgICAgICB0b3A6MDtcbiAgICAgICAgICBsZWZ0OjA7XG4gICAgICAgICAgb3ZlcmZsb3c6dmlzaWJsZTtcbiAgICAgICAgICBwb2ludGVyLWV2ZW50czpub25lO1xuICAgICAgICAgIHotaW5kZXg6IDk5OTtcbiAgICAgICAgXCIgXG4gICAgICAgIHdpZHRoPVwiJHt3aWR0aH1weFwiIGhlaWdodD1cIiR7aGVpZ2h0fXB4XCIgXG4gICAgICAgIHZpZXdCb3g9XCIwIDAgJHt3aWR0aH0gJHtoZWlnaHR9XCIgXG4gICAgICAgIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICAgID5cbiAgICAgICAgPHJlY3QgXG4gICAgICAgICAgZmlsbD1cImhzbGEoMzMwLCAxMDAlLCA3MSUsIDAuNSlcIlxuICAgICAgICAgIHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIlxuICAgICAgICA+PC9yZWN0PlxuICAgICAgPC9zdmc+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndmlzYnVnLW92ZXJsYXknLCBPdmVybGF5KVxuIiwiZXhwb3J0IGNsYXNzIEJveE1vZGVsIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLiRzaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogJ2Nsb3NlZCd9KVxuICAgIHRoaXMuZHJhd2FibGUgPSB7fVxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG5cbiAgc2V0IHBvc2l0aW9uKHBheWxvYWQpIHtcbiAgICB0aGlzLiRzaGFkb3cuaW5uZXJIVE1MID0gdGhpcy5yZW5kZXIocGF5bG9hZClcbiAgICBpZiAoIXRoaXMuZHJhd2FibGUubWVhc3VyZW1lbnRzKSAvLyAmJiBwYXlsb2FkLmNvbG9yID09PSAncGluaydcbiAgICAgIHRoaXMuY3JlYXRlTWVhc3VyZW1lbnRzKHBheWxvYWQpXG4gIH1cblxuICByZW5kZXIoe21vZGUsIGJvdW5kcywgc2lkZXMsIGNvbG9yID0gJ3BpbmsnfSkge1xuICAgIGNvbnN0IHRvdGFsX2hlaWdodCAgPSBib3VuZHMuaGVpZ2h0ICsgc2lkZXMuYm90dG9tICsgc2lkZXMudG9wXG4gICAgY29uc3QgdG90YWxfd2lkdGggICA9IGJvdW5kcy53aWR0aCArIHNpZGVzLnJpZ2h0ICsgc2lkZXMubGVmdFxuXG4gICAgaWYgKG1vZGUgPT09ICdwYWRkaW5nJykge1xuICAgICAgdGhpcy5kcmF3YWJsZSA9IHtcbiAgICAgICAgaGVpZ2h0OiAgIGJvdW5kcy5oZWlnaHQsXG4gICAgICAgIHdpZHRoOiAgICBib3VuZHMud2lkdGgsXG4gICAgICAgIHRvcDogICAgICBib3VuZHMudG9wICsgd2luZG93LnNjcm9sbFksXG4gICAgICAgIGxlZnQ6ICAgICBib3VuZHMubGVmdCxcbiAgICAgICAgcm90YXRpb246ICdyb3RhdGUoLTQ1KScsXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG1vZGUgPT09ICdtYXJnaW4nKSB7XG4gICAgICB0aGlzLmRyYXdhYmxlID0ge1xuICAgICAgICBoZWlnaHQ6ICAgdG90YWxfaGVpZ2h0LFxuICAgICAgICB3aWR0aDogICAgdG90YWxfd2lkdGgsXG4gICAgICAgIHRvcDogICAgICBib3VuZHMudG9wICsgd2luZG93LnNjcm9sbFkgLSBzaWRlcy50b3AsXG4gICAgICAgIGxlZnQ6ICAgICBib3VuZHMubGVmdCAtIHNpZGVzLmxlZnQsXG4gICAgICAgIHJvdGF0aW9uOiAncm90YXRlKDQ1KScsXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbG9yID09PSAncGluaycpIHtcbiAgICAgIHRoaXMuZHJhd2FibGUuYmcgPSAnaHNsYSgzMzAsIDEwMCUsIDcxJSwgMTUlKSdcbiAgICAgIHRoaXMuZHJhd2FibGUuc3RyaXBlID0gJ2hzbGEoMzMwLCAxMDAlLCA3MSUsIDgwJSknXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kcmF3YWJsZS5iZyA9ICdoc2xhKDI2NywgMTAwJSwgNTglLCAxNSUpJ1xuICAgICAgdGhpcy5kcmF3YWJsZS5zdHJpcGUgPSAnaHNsYSgyNjcsIDEwMCUsIDU4JSwgODAlKSdcbiAgICB9XG5cbiAgICByZXR1cm4gYFxuICAgICAgJHt0aGlzLnN0eWxlcyh7c2lkZXN9KX1cbiAgICAgIDxkaXYgbWFzaz5cbiAgICAgICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiPlxuICAgICAgICAgIDxkZWZzPlxuICAgICAgICAgICAgPHBhdHRlcm4gaWQ9XCJwaW5zdHJpcGVcIiBwYXR0ZXJuVW5pdHM9XCJ1c2VyU3BhY2VPblVzZVwiIHdpZHRoPVwiMTBcIiBoZWlnaHQ9XCIxMFwiIHBhdHRlcm5UcmFuc2Zvcm09XCIke3RoaXMuZHJhd2FibGUucm90YXRpb259XCIgY2xhc3M9XCJwYXR0ZXJuXCI+XG4gICAgICAgICAgICAgIDxsaW5lIHgxPVwiMFwiIHk9XCIwXCIgeDI9XCIwXCIgeTI9XCIxMFwiIHN0cm9rZT1cIiR7dGhpcy5kcmF3YWJsZS5zdHJpcGV9XCIgc3Ryb2tlLXdpZHRoPVwiMVwiPjwvbGluZT5cbiAgICAgICAgICAgIDwvcGF0dGVybj5cbiAgICAgICAgICA8L2RlZnM+XG4gICAgICAgICAgPHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9XCJ1cmwoI3BpbnN0cmlwZSlcIj48L3JlY3Q+XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9kaXY+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKHtzaWRlc30pIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCBbbWFza10ge1xuICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQyO1xuICAgICAgICAgIHdpZHRoOiAke3RoaXMuZHJhd2FibGUud2lkdGh9cHg7XG4gICAgICAgICAgaGVpZ2h0OiAke3RoaXMuZHJhd2FibGUuaGVpZ2h0fXB4O1xuICAgICAgICAgIHRvcDogJHt0aGlzLmRyYXdhYmxlLnRvcH1weDtcbiAgICAgICAgICBsZWZ0OiAke3RoaXMuZHJhd2FibGUubGVmdH1weDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke3RoaXMuZHJhd2FibGUuYmd9O1xuICAgICAgICAgIGNsaXAtcGF0aDogcG9seWdvbihcbiAgICAgICAgICAgIDAlIDAlLCAwJSAxMDAlLCAke3NpZGVzLmxlZnR9cHggMTAwJSxcbiAgICAgICAgICAgICR7c2lkZXMubGVmdH1weCAke3NpZGVzLnRvcH1weCxcbiAgICAgICAgICAgICR7dGhpcy5kcmF3YWJsZS53aWR0aCAtIHNpZGVzLnJpZ2h0fXB4ICR7c2lkZXMudG9wfXB4LFxuICAgICAgICAgICAgJHt0aGlzLmRyYXdhYmxlLndpZHRoIC0gc2lkZXMucmlnaHR9cHggJHt0aGlzLmRyYXdhYmxlLmhlaWdodCAtIHNpZGVzLmJvdHRvbX1weCxcbiAgICAgICAgICAgIDAgJHt0aGlzLmRyYXdhYmxlLmhlaWdodCAtIHNpZGVzLmJvdHRvbX1weCwgMCAxMDAlLFxuICAgICAgICAgICAgMTAwJSAxMDAlLCAxMDAlIDAlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cblxuICBjcmVhdGVNZWFzdXJlbWVudHMoe21vZGUsIGJvdW5kcywgc2lkZXMsIGNvbG9yfSkge1xuICAgIGNvbnN0IHdpbl93aWR0aCAgID0gd2luZG93LmlubmVyV2lkdGhcbiAgICBjb25zdCBwaWxsX2hlaWdodCA9IDE4XG4gICAgY29uc3Qgb2Zmc2V0ICAgICAgPSAzXG5cbiAgICBpZiAobW9kZSA9PT0gJ21hcmdpbicpIHtcbiAgICAgIGlmIChzaWRlcy50b3ApIHtcbiAgICAgICAgdGhpcy5jcmVhdGVNZWFzdXJlbWVudCh7XG4gICAgICAgICAgeDogYm91bmRzLmxlZnQgKyAoYm91bmRzLndpZHRoIC8gMikgLSBvZmZzZXQsXG4gICAgICAgICAgeTogYm91bmRzLnRvcCAtIHNpZGVzLnRvcCAtIChzaWRlcy50b3AgPCBwaWxsX2hlaWdodCA/IHBpbGxfaGVpZ2h0IC0gc2lkZXMudG9wIDogMCksXG4gICAgICAgICAgZDogc2lkZXMudG9wLFxuICAgICAgICAgIHE6ICd0b3AnLFxuICAgICAgICAgIHY6IHRydWUsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoc2lkZXMuYm90dG9tKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlTWVhc3VyZW1lbnQoe1xuICAgICAgICAgIHg6IGJvdW5kcy5sZWZ0ICsgKGJvdW5kcy53aWR0aCAvIDIpIC0gb2Zmc2V0LFxuICAgICAgICAgIHk6IGJvdW5kcy5ib3R0b20sXG4gICAgICAgICAgZDogc2lkZXMuYm90dG9tLFxuICAgICAgICAgIHE6ICdib3R0b20nLFxuICAgICAgICAgIHY6IHRydWUsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoc2lkZXMucmlnaHQpIHtcbiAgICAgICAgdGhpcy5jcmVhdGVNZWFzdXJlbWVudCh7XG4gICAgICAgICAgeDogYm91bmRzLnJpZ2h0LFxuICAgICAgICAgIHk6IGJvdW5kcy50b3AgKyAoYm91bmRzLmhlaWdodCAvIDIpIC0gb2Zmc2V0LFxuICAgICAgICAgIGQ6IHNpZGVzLnJpZ2h0LFxuICAgICAgICAgIHE6ICdyaWdodCcsXG4gICAgICAgICAgdjogZmFsc2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoc2lkZXMubGVmdCkge1xuICAgICAgICB0aGlzLmNyZWF0ZU1lYXN1cmVtZW50KHtcbiAgICAgICAgICB4OiB3aW5fd2lkdGggLSBib3VuZHMubGVmdCxcbiAgICAgICAgICB5OiBib3VuZHMudG9wICsgKGJvdW5kcy5oZWlnaHQgLyAyKSAtIG9mZnNldCxcbiAgICAgICAgICBkOiBzaWRlcy5sZWZ0LFxuICAgICAgICAgIHE6ICdsZWZ0JyxcbiAgICAgICAgICB2OiBmYWxzZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobW9kZSA9PT0gJ3BhZGRpbmcnKSB7XG4gICAgICBpZiAoc2lkZXMudG9wKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlTWVhc3VyZW1lbnQoe1xuICAgICAgICAgIHg6IGJvdW5kcy5sZWZ0ICsgKGJvdW5kcy53aWR0aCAvIDIpIC0gb2Zmc2V0LFxuICAgICAgICAgIHk6IGJvdW5kcy50b3AgLSAoc2lkZXMudG9wIDwgcGlsbF9oZWlnaHQgPyBwaWxsX2hlaWdodCAtIHNpZGVzLnRvcCA6IDApLFxuICAgICAgICAgIGQ6IHNpZGVzLnRvcCxcbiAgICAgICAgICBxOiAndG9wJyxcbiAgICAgICAgICB2OiB0cnVlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgIGlmIChzaWRlcy5ib3R0b20pIHtcbiAgICAgICAgIHRoaXMuY3JlYXRlTWVhc3VyZW1lbnQoe1xuICAgICAgICAgICB4OiBib3VuZHMubGVmdCArIChib3VuZHMud2lkdGggLyAyKSAtIG9mZnNldCxcbiAgICAgICAgICAgeTogYm91bmRzLmJvdHRvbSAtIHNpZGVzLmJvdHRvbSxcbiAgICAgICAgICAgZDogc2lkZXMuYm90dG9tLFxuICAgICAgICAgICBxOiAnYm90dG9tJyxcbiAgICAgICAgICAgdjogdHJ1ZSxcbiAgICAgICAgICAgY29sb3IsXG4gICAgICAgICB9KVxuICAgICAgIH1cbiAgICAgICBpZiAoc2lkZXMucmlnaHQpIHtcbiAgICAgICAgIHRoaXMuY3JlYXRlTWVhc3VyZW1lbnQoe1xuICAgICAgICAgICB4OiBib3VuZHMucmlnaHQgLSBzaWRlcy5yaWdodCxcbiAgICAgICAgICAgeTogYm91bmRzLnRvcCArIChib3VuZHMuaGVpZ2h0IC8gMikgLSBvZmZzZXQsXG4gICAgICAgICAgIGQ6IHNpZGVzLnJpZ2h0LFxuICAgICAgICAgICBxOiAncmlnaHQnLFxuICAgICAgICAgICB2OiBmYWxzZSxcbiAgICAgICAgICAgY29sb3IsXG4gICAgICAgICB9KVxuICAgICAgIH1cbiAgICAgICBpZiAoc2lkZXMubGVmdCkge1xuICAgICAgICAgdGhpcy5jcmVhdGVNZWFzdXJlbWVudCh7XG4gICAgICAgICAgIHg6IHdpbl93aWR0aCAtIGJvdW5kcy5sZWZ0IC0gc2lkZXMubGVmdCxcbiAgICAgICAgICAgeTogYm91bmRzLnRvcCArIChib3VuZHMuaGVpZ2h0IC8gMikgLSBvZmZzZXQsXG4gICAgICAgICAgIGQ6IHNpZGVzLmxlZnQsXG4gICAgICAgICAgIHE6ICdsZWZ0JyxcbiAgICAgICAgICAgdjogZmFsc2UsXG4gICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgfSlcbiAgICAgICB9XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTWVhc3VyZW1lbnQobGluZV9tb2RlbCwgbm9kZV9sYWJlbF9pZD0wKSB7XG4gICAgY29uc3QgbWVhc3VyZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aXNidWctZGlzdGFuY2UnKVxuICAgIG1lYXN1cmVtZW50LnBvc2l0aW9uID0geyBsaW5lX21vZGVsLCBub2RlX2xhYmVsX2lkIH1cbiAgICB0aGlzLiRzaGFkb3cuYXBwZW5kQ2hpbGQobWVhc3VyZW1lbnQpXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd2aXNidWctYm94bW9kZWwnLCBCb3hNb2RlbClcbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCB7IGNyZWF0ZUNsYXNzbmFtZSB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy8nXG5pbXBvcnQgc3R5bGVzIGZyb20gJy4vbWV0YXRpcC5lbGVtZW50LmNzcydcblxuZXhwb3J0IGNsYXNzIE1ldGF0aXAgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuJHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnY2xvc2VkJ30pXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAkKHRoaXMuJHNoYWRvdy5ob3N0KS5vbignbW91c2VlbnRlcicsIHRoaXMub2JzZXJ2ZS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy51bm9ic2VydmUoKVxuICB9XG5cbiAgZGlzcGF0Y2hRdWVyeShlKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3QuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3F1ZXJ5Jywge1xuICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgIGRldGFpbDogICB7XG4gICAgICAgIHRleHQ6ICAgICAgIGUudGFyZ2V0LnRleHRDb250ZW50LFxuICAgICAgICBhY3RpdmF0b3I6ICBlLnR5cGUsXG4gICAgICB9XG4gICAgfSkpXG4gIH1cblxuICBvYnNlcnZlKCkge1xuICAgICQoJ2g1ID4gYScsIHRoaXMuJHNoYWRvdykub24oJ2NsaWNrIG1vdXNlZW50ZXInLCB0aGlzLmRpc3BhdGNoUXVlcnkuYmluZCh0aGlzKSlcbiAgICAkKCdoNSA+IGEnLCB0aGlzLiRzaGFkb3cpLm9uKCdtb3VzZWxlYXZlJywgdGhpcy5kaXNwYXRjaFVuUXVlcnkuYmluZCh0aGlzKSlcbiAgfVxuXG4gIHVub2JzZXJ2ZSgpIHtcbiAgICAkKCdoNSA+IGEnLCB0aGlzLiRzaGFkb3cpLm9mZignY2xpY2sgbW91c2VlbnRlcicsIHRoaXMuZGlzcGF0Y2hRdWVyeS5iaW5kKHRoaXMpKVxuICAgICQoJ2g1ID4gYScsIHRoaXMuJHNoYWRvdykub2ZmKCdtb3VzZWxlYXZlJywgdGhpcy5kaXNwYXRjaFVuUXVlcnkuYmluZCh0aGlzKSlcbiAgfVxuXG4gIGRpc3BhdGNoVW5RdWVyeShlKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3QuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3VucXVlcnknLCB7XG4gICAgICBidWJibGVzOiB0cnVlXG4gICAgfSkpXG4gICAgdGhpcy51bm9ic2VydmUoKVxuICB9XG5cbiAgc2V0IG1ldGEoZGF0YSkge1xuICAgIHRoaXMuJHNoYWRvdy5pbm5lckhUTUwgPSB0aGlzLnJlbmRlcihkYXRhKVxuICB9XG5cbiAgcmVuZGVyKHtlbCwgd2lkdGgsIGhlaWdodCwgbG9jYWxNb2RpZmljYXRpb25zLCBub3RMb2NhbE1vZGlmaWNhdGlvbnN9KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoKX1cbiAgICAgIDxmaWd1cmU+XG4gICAgICAgIDxoNT5cbiAgICAgICAgICA8YSBub2RlPiR7ZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKX08L2E+XG4gICAgICAgICAgPGE+JHtlbC5pZCAmJiAnIycgKyBlbC5pZH08L2E+XG4gICAgICAgICAgJHtjcmVhdGVDbGFzc25hbWUoZWwpLnNwbGl0KCcuJylcbiAgICAgICAgICAgIC5maWx0ZXIobmFtZSA9PiBuYW1lICE9ICcnKVxuICAgICAgICAgICAgLnJlZHVjZSgobGlua3MsIG5hbWUpID0+IGBcbiAgICAgICAgICAgICAgJHtsaW5rc31cbiAgICAgICAgICAgICAgPGE+LiR7bmFtZX08L2E+XG4gICAgICAgICAgICBgLCAnJylcbiAgICAgICAgICB9XG4gICAgICAgIDwvaDU+XG4gICAgICAgIDxzbWFsbD5cbiAgICAgICAgICA8c3BhblwiPiR7TWF0aC5yb3VuZCh3aWR0aCl9PC9zcGFuPnB4XG4gICAgICAgICAgPHNwYW4gZGl2aWRlcj7Dlzwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj4ke01hdGgucm91bmQoaGVpZ2h0KX08L3NwYW4+cHhcbiAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgPGRpdj4ke25vdExvY2FsTW9kaWZpY2F0aW9ucy5yZWR1Y2UoKGl0ZW1zLCBpdGVtKSA9PiBgXG4gICAgICAgICAgJHtpdGVtc31cbiAgICAgICAgICA8c3BhbiBwcm9wPiR7aXRlbS5wcm9wfTo8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gdmFsdWU+JHtpdGVtLnZhbHVlfTwvc3Bhbj5cbiAgICAgICAgYCwgJycpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgJHtsb2NhbE1vZGlmaWNhdGlvbnMubGVuZ3RoID8gYFxuICAgICAgICAgIDxoNiBsb2NhbC1tb2RpZmljYXRpb25zPkxvY2FsIE1vZGlmaWNhdGlvbnM8L2g2PlxuICAgICAgICAgIDxkaXY+JHtsb2NhbE1vZGlmaWNhdGlvbnMucmVkdWNlKChpdGVtcywgaXRlbSkgPT4gYFxuICAgICAgICAgICAgJHtpdGVtc31cbiAgICAgICAgICAgIDxzcGFuIHByb3A+JHtpdGVtLnByb3B9Ojwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIHZhbHVlPiR7aXRlbS52YWx1ZX08L3NwYW4+XG4gICAgICAgICAgYCwgJycpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgIDogJyd9XG4gICAgICA8L2ZpZ3VyZT5cbiAgICBgXG4gIH1cblxuICBzdHlsZXMoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgJHtzdHlsZXN9XG4gICAgICA8L3N0eWxlPlxuICAgIGBcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3Zpc2J1Zy1tZXRhdGlwJywgTWV0YXRpcClcbiIsImltcG9ydCB7IE1ldGF0aXAgfSBmcm9tICcuL21ldGF0aXAuZWxlbWVudC5qcydcblxuZXhwb3J0IGNsYXNzIEFsbHkgZXh0ZW5kcyBNZXRhdGlwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICB9XG4gIFxuICByZW5kZXIoe2VsLCBhbGx5X2F0dHJpYnV0ZXMsIGNvbnRyYXN0X3Jlc3VsdHN9KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoKX1cbiAgICAgIDxmaWd1cmU+XG4gICAgICAgIDxoNT4ke2VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCl9JHtlbC5pZCAmJiAnIycgKyBlbC5pZH08L2g1PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgICR7YWxseV9hdHRyaWJ1dGVzLnJlZHVjZSgoaXRlbXMsIGF0dHIpID0+IGBcbiAgICAgICAgICAgICR7aXRlbXN9XG4gICAgICAgICAgICA8c3BhbiBwcm9wPiR7YXR0ci5wcm9wfTo8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiB2YWx1ZT4ke2F0dHIudmFsdWV9PC9zcGFuPlxuICAgICAgICAgIGAsICcnKX1cbiAgICAgICAgICAke2NvbnRyYXN0X3Jlc3VsdHN9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9maWd1cmU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndmlzYnVnLWFsbHknLCBBbGx5KVxuIiwiZXhwb3J0IGNvbnN0IGN1cnNvciA9IGBcbiAgPHN2ZyBjbGFzcz1cImljb24tY3Vyc29yXCIgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDMyIDMyXCI+XG4gICAgPHBhdGggZD1cIk0xNi42ODkgMTcuNjU1bDUuMzExIDEyLjM0NS00IDItNC42NDYtMTIuNjc4LTcuMzU0IDYuNjc4di0yNmwyMCAxNi05LjMxMSAxLjY1NXpcIj48L3BhdGg+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgbW92ZSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTUgNy41VjJIOXY1LjVsMyAzIDMtM3pNNy41IDlIMnY2aDUuNWwzLTMtMy0zek05IDE2LjVWMjJoNnYtNS41bC0zLTMtMyAzek0xNi41IDlsLTMgMyAzIDNIMjJWOWgtNS41elwiLz5cbiAgPC9zdmc+XG5gXG5cbmV4cG9ydCBjb25zdCBzZWFyY2ggPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNOSA3SDd2MmgyVjd6bTAgNEg3djJoMnYtMnptMC04Yy0xLjExIDAtMiAuOS0yIDJoMlYzem00IDEyaC0ydjJoMnYtMnptNi0xMnYyaDJjMC0xLjEtLjktMi0yLTJ6bS02IDBoLTJ2MmgyVjN6TTkgMTd2LTJIN2MwIDEuMS44OSAyIDIgMnptMTAtNGgydi0yaC0ydjJ6bTAtNGgyVjdoLTJ2MnptMCA4YzEuMSAwIDItLjkgMi0yaC0ydjJ6TTUgN0gzdjEyYzAgMS4xLjg5IDIgMiAyaDEydi0ySDVWN3ptMTAtMmgyVjNoLTJ2MnptMCAxMmgydi0yaC0ydjJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTMgMTNoMnYtMkgzdjJ6bTAgNGgydi0ySDN2MnptMiA0di0ySDNjMCAxLjEuODkgMiAyIDJ6TTMgOWgyVjdIM3Yyem0xMiAxMmgydi0yaC0ydjJ6bTQtMThIOWMtMS4xMSAwLTIgLjktMiAydjEwYzAgMS4xLjg5IDIgMiAyaDEwYzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTJIOVY1aDEwdjEwem0tOCA2aDJ2LTJoLTJ2MnptLTQgMGgydi0ySDd2MnpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgZm9udCA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNOSA0djNoNXYxMmgzVjdoNVY0SDl6bS02IDhoM3Y3aDN2LTdoM1Y5SDN2M3pcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgdGV4dCA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMyAxNy4yNVYyMWgzLjc1TDE3LjgxIDkuOTRsLTMuNzUtMy43NUwzIDE3LjI1ek0yMC43MSA3LjA0Yy4zOS0uMzkuMzktMS4wMiAwLTEuNDFsLTIuMzQtMi4zNGMtLjM5LS4zOS0xLjAyLS4zOS0xLjQxIDBsLTEuODMgMS44MyAzLjc1IDMuNzUgMS44My0xLjgzelwiLz5cbiAgPC9zdmc+XG5gXG5cbmV4cG9ydCBjb25zdCBhbGlnbiA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIHN0eWxlPVwidHJhbnNmb3JtOnJvdGF0ZVooOTBkZWcpO1wiPlxuICAgIDxwYXRoIGQ9XCJNMTAgMjBoNFY0aC00djE2em0tNiAwaDR2LThINHY4ek0xNiA5djExaDRWOWgtNHpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgcmVzaXplID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xOSAxMmgtMnYzaC0zdjJoNXYtNXpNNyA5aDNWN0g1djVoMlY5em0xNC02SDNjLTEuMSAwLTIgLjktMiAydjE0YzAgMS4xLjkgMiAyIDJoMThjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptMCAxNi4wMUgzVjQuOTloMTh2MTQuMDJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IHRyYW5zZm9ybSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTIsN0M2LjQ4LDcsMiw5LjI0LDIsMTJjMCwyLjI0LDIuOTQsNC4xMyw3LDQuNzdWMjBsNC00bC00LTR2Mi43M2MtMy4xNS0wLjU2LTUtMS45LTUtMi43M2MwLTEuMDYsMy4wNC0zLDgtM3M4LDEuOTQsOCwzXG4gICAgYzAsMC43My0xLjQ2LDEuODktNCwyLjUzdjIuMDVjMy41My0wLjc3LDYtMi41Myw2LTQuNThDMjIsOS4yNCwxNy41Miw3LDEyLDd6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IGJvcmRlciA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTMgN2gtMnYyaDJWN3ptMCA0aC0ydjJoMnYtMnptNCAwaC0ydjJoMnYtMnpNMyAzdjE4aDE4VjNIM3ptMTYgMTZINVY1aDE0djE0em0tNi00aC0ydjJoMnYtMnptLTQtNEg3djJoMnYtMnpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgaHVlc2hpZnQgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTEyIDNjLTQuOTcgMC05IDQuMDMtOSA5czQuMDMgOSA5IDljLjgzIDAgMS41LS42NyAxLjUtMS41IDAtLjM5LS4xNS0uNzQtLjM5LTEuMDEtLjIzLS4yNi0uMzgtLjYxLS4zOC0uOTkgMC0uODMuNjctMS41IDEuNS0xLjVIMTZjMi43NiAwIDUtMi4yNCA1LTUgMC00LjQyLTQuMDMtOC05LTh6bS01LjUgOWMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzUuNjcgOSA2LjUgOSA4IDkuNjcgOCAxMC41IDcuMzMgMTIgNi41IDEyem0zLTRDOC42NyA4IDggNy4zMyA4IDYuNVM4LjY3IDUgOS41IDVzMS41LjY3IDEuNSAxLjVTMTAuMzMgOCA5LjUgOHptNSAwYy0uODMgMC0xLjUtLjY3LTEuNS0xLjVTMTMuNjcgNSAxNC41IDVzMS41LjY3IDEuNSAxLjVTMTUuMzMgOCAxNC41IDh6bTMgNGMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzE2LjY3IDkgMTcuNSA5czEuNS42NyAxLjUgMS41LS42NyAxLjUtMS41IDEuNXpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgYm94c2hhZG93ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0yMCA4LjY5VjRoLTQuNjlMMTIgLjY5IDguNjkgNEg0djQuNjlMLjY5IDEyIDQgMTUuMzFWMjBoNC42OUwxMiAyMy4zMSAxNS4zMSAyMEgyMHYtNC42OUwyMy4zMSAxMiAyMCA4LjY5ek0xMiAxOGMtLjg5IDAtMS43NC0uMi0yLjUtLjU1QzExLjU2IDE2LjUgMTMgMTQuNDIgMTMgMTJzLTEuNDQtNC41LTMuNS01LjQ1QzEwLjI2IDYuMiAxMS4xMSA2IDEyIDZjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDZ6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IGluc3BlY3RvciA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxnPlxuICAgICAgPHJlY3QgeD1cIjExXCIgeT1cIjdcIiB3aWR0aD1cIjJcIiBoZWlnaHQ9XCIyXCIvPlxuICAgICAgPHJlY3QgeD1cIjExXCIgeT1cIjExXCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiNlwiLz5cbiAgICAgIDxwYXRoIGQ9XCJNMTIsMkM2LjQ4LDIsMiw2LjQ4LDIsMTJjMCw1LjUyLDQuNDgsMTAsMTAsMTBzMTAtNC40OCwxMC0xMEMyMiw2LjQ4LDE3LjUyLDIsMTIsMnogTTEyLDIwYy00LjQxLDAtOC0zLjU5LTgtOFxuICAgICAgICBjMC00LjQxLDMuNTktOCw4LThzOCwzLjU5LDgsOEMyMCwxNi40MSwxNi40MSwyMCwxMiwyMHpcIi8+XG4gICAgPC9nPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IGNhbWVyYSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiMy4yXCIvPlxuICAgIDxwYXRoIGQ9XCJNOSAyTDcuMTcgNEg0Yy0xLjEgMC0yIC45LTIgMnYxMmMwIDEuMS45IDIgMiAyaDE2YzEuMSAwIDItLjkgMi0yVjZjMC0xLjEtLjktMi0yLTJoLTMuMTdMMTUgMkg5em0zIDE1Yy0yLjc2IDAtNS0yLjI0LTUtNXMyLjI0LTUgNS01IDUgMi4yNCA1IDUtMi4yNCA1LTUgNXpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgZ3VpZGVzID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0yMSw2SDNDMS45LDYsMSw2LjksMSw4djhjMCwxLjEsMC45LDIsMiwyaDE4YzEuMSwwLDItMC45LDItMlY4QzIzLDYuOSwyMi4xLDYsMjEsNnogTTIxLDE2SDNWOGgydjRoMlY4aDJ2NGgyVjhoMnY0aDJWOFxuICAgIGgydjRoMlY4aDJWMTZ6XCIvPlxuICA8L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IGNvbG9yX3RleHQgPSBgXG4gIDxzdmcgdmlld0JveD1cIjAgMCAyNSAyN1wiPlxuICAgIDxwYXRoIGQ9XCJNMTEgM0w1LjUgMTdoMi4yNWwxLjEyLTNoNi4yNWwxLjEyIDNoMi4yNUwxMyAzaC0yem0tMS4zOCA5TDEyIDUuNjcgMTQuMzggMTJIOS42MnpcIi8+XG4gICAgPHJlY3QgZmlsbD1cInZhcigtLWNvbnRleHR1YWxfY29sb3IpXCIgeD1cIjFcIiB5PVwiMjFcIiB3aWR0aD1cIjIzXCIgaGVpZ2h0PVwiNVwiPjwvcmVjdD5cbiAgPC9zdmc+XG5gXG5cbmV4cG9ydCBjb25zdCBjb2xvcl9iYWNrZ3JvdW5kID0gYFxuICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjUgMjdcIj5cbiAgICA8cGF0aCBkPVwiTTE2LjU2IDguOTRMNy42MiAwIDYuMjEgMS40MWwyLjM4IDIuMzgtNS4xNSA1LjE1Yy0uNTkuNTktLjU5IDEuNTQgMCAyLjEybDUuNSA1LjVjLjI5LjI5LjY4LjQ0IDEuMDYuNDRzLjc3LS4xNSAxLjA2LS40NGw1LjUtNS41Yy41OS0uNTguNTktMS41MyAwLTIuMTJ6TTUuMjEgMTBMMTAgNS4yMSAxNC43OSAxMEg1LjIxek0xOSAxMS41cy0yIDIuMTctMiAzLjVjMCAxLjEuOSAyIDIgMnMyLS45IDItMmMwLTEuMzMtMi0zLjUtMi0zLjV6XCIvPlxuICAgIDxyZWN0IGZpbGw9XCJ2YXIoLS1jb250ZXh0dWFsX2NvbG9yKVwiIHg9XCIxXCIgeT1cIjIxXCIgd2lkdGg9XCIyM1wiIGhlaWdodD1cIjVcIj48L3JlY3Q+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgY29sb3JfYm9yZGVyID0gYFxuICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjUgMjdcIj5cbiAgICA8cGF0aCBkPVwiTTE3Ljc1IDdMMTQgMy4yNWwtMTAgMTBWMTdoMy43NWwxMC0xMHptMi45Ni0yLjk2Yy4zOS0uMzkuMzktMS4wMiAwLTEuNDFMMTguMzcuMjljLS4zOS0uMzktMS4wMi0uMzktMS40MSAwTDE1IDIuMjUgMTguNzUgNmwxLjk2LTEuOTZ6XCIvPlxuICAgIDxyZWN0IGZpbGw9XCJ2YXIoLS1jb250ZXh0dWFsX2NvbG9yKVwiIHg9XCIxXCIgeT1cIjIxXCIgd2lkdGg9XCIyM1wiIGhlaWdodD1cIjVcIj48L3JlY3Q+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQgY29uc3QgcG9zaXRpb24gPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTE1LjU0IDUuNTRMMTMuNzcgNy4zIDEyIDUuNTQgMTAuMjMgNy4zIDguNDYgNS41NCAxMiAyem0yLjkyIDEwbC0xLjc2LTEuNzdMMTguNDYgMTJsLTEuNzYtMS43NyAxLjc2LTEuNzdMMjIgMTJ6bS0xMCAyLjkybDEuNzctMS43NkwxMiAxOC40NmwxLjc3LTEuNzYgMS43NyAxLjc2TDEyIDIyem0tMi45Mi0xMGwxLjc2IDEuNzdMNS41NCAxMmwxLjc2IDEuNzctMS43NiAxLjc3TDIgMTJ6XCIvPlxuICAgIDxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiM1wiLz5cbiAgPC9zdmc+XG5gXG5cbmV4cG9ydCBjb25zdCBhY2Nlc3NpYmlsaXR5ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMiwyYzEuMSwwLDIsMC45LDIsMnMtMC45LDItMiwycy0yLTAuOS0yLTJTMTAuOSwyLDEyLDJ6IE0yMSw5aC02djEzaC0ydi02aC0ydjZIOVY5SDNWN2gxOFY5elwiLz5cbiAgPC9zdmc+XG5gIiwiaW1wb3J0ICQgICAgICAgICAgICBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyAgICAgIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgc3R5bGVzICAgICAgIGZyb20gJy4vYmFzZS5lbGVtZW50LmNzcydcbmltcG9ydCAqIGFzIEljb25zICAgZnJvbSAnLi4vdmlzLWJ1Zy92aXMtYnVnLmljb25zJ1xuaW1wb3J0IHsgbWV0YUtleSwgYWx0S2V5IH0gIGZyb20gJy4uLy4uL3V0aWxpdGllcy8nXG5cbmV4cG9ydCBjbGFzcyBIb3RrZXlNYXAgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5rZXlib2FyZF9tb2RlbCA9IHtcbiAgICAgIG51bTogICAgWydgJywnMScsJzInLCczJywnNCcsJzUnLCc2JywnNycsJzgnLCc5JywnMCcsJy0nLCc9JywnZGVsZXRlJ10sXG4gICAgICB0YWI6ICAgIFsndGFiJywncScsJ3cnLCdlJywncicsJ3QnLCd5JywndScsJ2knLCdvJywncCcsJ1snLCddJywnXFxcXCddLFxuICAgICAgY2FwczogICBbJ2NhcHMnLCdhJywncycsJ2QnLCdmJywnZycsJ2gnLCdqJywnaycsJ2wnLCdcXCcnLCdyZXR1cm4nXSxcbiAgICAgIHNoaWZ0OiAgWydzaGlmdCcsJ3onLCd4JywnYycsJ3YnLCdiJywnbicsJ20nLCcsJywnLicsJy8nLCdzaGlmdCddLFxuICAgICAgc3BhY2U6ICBbJ2N0cmwnLGFsdEtleSwnY21kJywnc3BhY2ViYXInLCdjbWQnLGFsdEtleSwnY3RybCddXG4gICAgfVxuXG4gICAgdGhpcy5rZXlfc2l6ZV9tb2RlbCA9IHtcbiAgICAgIG51bTogICAgezEyOjJ9LFxuICAgICAgdGFiOiAgICB7MDoyfSxcbiAgICAgIGNhcHM6ICAgezA6MywxMTozfSxcbiAgICAgIHNoaWZ0OiAgezA6NiwxMTo2fSxcbiAgICAgIHNwYWNlOiAgezM6MTB9LFxuICAgIH1cblxuICAgIHRoaXMuJHNoYWRvdyAgICA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnY2xvc2VkJ30pXG5cbiAgICB0aGlzLl9ob3RrZXkgICAgPSAnJ1xuICAgIHRoaXMuX3VzZWRrZXlzICA9IFtdXG5cbiAgICB0aGlzLnRvb2wgICAgICAgPSAnaG90a2V5bWFwJ1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy4kc2hpZnQgID0gJCgnW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbc2hpZnRdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGN0cmwgICA9ICQoJ1trZXlib2FyZF0gPiBzZWN0aW9uID4gW2N0cmxdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGFsdCAgICA9ICQoYFtrZXlib2FyZF0gPiBzZWN0aW9uID4gWyR7YWx0S2V5fV1gLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kY21kICAgID0gJChgW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbJHttZXRhS2V5fV1gLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kdXAgICAgID0gJCgnW2Fycm93c10gW3VwXScsIHRoaXMuJHNoYWRvdylcbiAgICB0aGlzLiRkb3duICAgPSAkKCdbYXJyb3dzXSBbZG93bl0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kbGVmdCAgID0gJCgnW2Fycm93c10gW2xlZnRdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJHJpZ2h0ICA9ICQoJ1thcnJvd3NdIFtyaWdodF0nLCB0aGlzLiRzaGFkb3cpXG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG5cbiAgc2V0IHRvb2wodG9vbCkge1xuICAgIHRoaXMuX3Rvb2wgPSB0b29sXG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCA9IHRoaXMucmVuZGVyKClcbiAgfVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICAgIGhvdGtleXMoJyonLCAoZSwgaGFuZGxlcikgPT5cbiAgICAgIHRoaXMud2F0Y2hLZXlzKGUsIGhhbmRsZXIpKVxuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgaG90a2V5cy51bmJpbmQoJyonKVxuICB9XG5cbiAgd2F0Y2hLZXlzKGUsIGhhbmRsZXIpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG5cbiAgICB0aGlzLiRzaGlmdC5hdHRyKCdwcmVzc2VkJywgaG90a2V5cy5zaGlmdClcbiAgICB0aGlzLiRjdHJsLmF0dHIoJ3ByZXNzZWQnLCBob3RrZXlzLmN0cmwpXG4gICAgdGhpcy4kYWx0LmF0dHIoJ3ByZXNzZWQnLCBob3RrZXlzLmFsdClcbiAgICB0aGlzLiRjbWQuYXR0cigncHJlc3NlZCcsIGhvdGtleXNbbWV0YUtleV0pXG4gICAgdGhpcy4kdXAuYXR0cigncHJlc3NlZCcsIGUuY29kZSA9PT0gJ0Fycm93VXAnKVxuICAgIHRoaXMuJGRvd24uYXR0cigncHJlc3NlZCcsIGUuY29kZSA9PT0gJ0Fycm93RG93bicpXG4gICAgdGhpcy4kbGVmdC5hdHRyKCdwcmVzc2VkJywgZS5jb2RlID09PSAnQXJyb3dMZWZ0JylcbiAgICB0aGlzLiRyaWdodC5hdHRyKCdwcmVzc2VkJywgZS5jb2RlID09PSAnQXJyb3dSaWdodCcpXG5cbiAgICBjb25zdCB7IG5lZ2F0aXZlLCBuZWdhdGl2ZV9tb2RpZmllciwgc2lkZSwgYW1vdW50IH0gPSB0aGlzLmNyZWF0ZUNvbW1hbmQoe2UsIGhvdGtleXN9KVxuXG4gICAgJCgnW2NvbW1hbmRdJywgdGhpcy4kc2hhZG93KVswXS5pbm5lckhUTUwgPSB0aGlzLmRpc3BsYXlDb21tYW5kKHtcbiAgICAgIG5lZ2F0aXZlLCBuZWdhdGl2ZV9tb2RpZmllciwgc2lkZSwgYW1vdW50LFxuICAgIH0pXG4gIH1cblxuICBjcmVhdGVDb21tYW5kKHtlOntjb2RlfSwgaG90a2V5c30pIHtcbiAgICBsZXQgYW1vdW50ICAgICAgICAgICAgICA9IGhvdGtleXMuc2hpZnQgPyAxMCA6IDFcbiAgICBsZXQgbmVnYXRpdmUgICAgICAgICAgICA9IGhvdGtleXMuYWx0ID8gJ1N1YnRyYWN0JyA6ICdBZGQnXG4gICAgbGV0IG5lZ2F0aXZlX21vZGlmaWVyICAgPSBob3RrZXlzLmFsdCA/ICdmcm9tJyA6ICd0bydcblxuICAgIGxldCBzaWRlID0gJ1thcnJvdyBrZXldJ1xuICAgIGlmIChjb2RlID09PSAnQXJyb3dVcCcpICAgICBzaWRlID0gJ3RoZSB0b3Agc2lkZSdcbiAgICBpZiAoY29kZSA9PT0gJ0Fycm93RG93bicpICAgc2lkZSA9ICd0aGUgYm90dG9tIHNpZGUnXG4gICAgaWYgKGNvZGUgPT09ICdBcnJvd0xlZnQnKSAgIHNpZGUgPSAndGhlIGxlZnQgc2lkZSdcbiAgICBpZiAoY29kZSA9PT0gJ0Fycm93UmlnaHQnKSAgc2lkZSA9ICd0aGUgcmlnaHQgc2lkZSdcbiAgICBpZiAoaG90a2V5c1ttZXRhS2V5XSkgICAgICAgICAgICBzaWRlID0gJ2FsbCBzaWRlcydcblxuICAgIGlmIChob3RrZXlzW21ldGFLZXldICYmIGNvZGUgPT09ICdBcnJvd0Rvd24nKSB7XG4gICAgICBuZWdhdGl2ZSAgICAgICAgICAgID0gJ1N1YnRyYWN0J1xuICAgICAgbmVnYXRpdmVfbW9kaWZpZXIgICA9ICdmcm9tJ1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBuZWdhdGl2ZSwgbmVnYXRpdmVfbW9kaWZpZXIsIGFtb3VudCwgc2lkZSxcbiAgICB9XG4gIH1cblxuICBkaXNwbGF5Q29tbWFuZCh7bmVnYXRpdmUsIG5lZ2F0aXZlX21vZGlmaWVyLCBzaWRlLCBhbW91bnR9KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzcGFuIG5lZ2F0aXZlPiR7bmVnYXRpdmV9IDwvc3Bhbj5cbiAgICAgIDxzcGFuIHRvb2w+JHt0aGlzLl90b29sfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGxpZ2h0PiAke25lZ2F0aXZlX21vZGlmaWVyfSA8L3NwYW4+XG4gICAgICA8c3BhbiBzaWRlPiR7c2lkZX08L3NwYW4+XG4gICAgICA8c3BhbiBsaWdodD4gYnkgPC9zcGFuPlxuICAgICAgPHNwYW4gYW1vdW50PiR7YW1vdW50fTwvc3Bhbj5cbiAgICBgXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoKX1cbiAgICAgIDxhcnRpY2xlPlxuICAgICAgICA8ZGl2IHRvb2wtaWNvbj5cbiAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICR7SWNvbnNbdGhpcy5fdG9vbF19XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgJHt0aGlzLmRpc3BsYXlDb21tYW5kKHtcbiAgICAgICAgICAgIG5lZ2F0aXZlOiBgwrFbJHthbHRLZXl9XSBgLFxuICAgICAgICAgICAgbmVnYXRpdmVfbW9kaWZpZXI6ICcgdG8gJyxcbiAgICAgICAgICAgIHRvb2w6IHRoaXMuX3Rvb2wsXG4gICAgICAgICAgICBzaWRlOiAnW2Fycm93IGtleV0nLFxuICAgICAgICAgICAgYW1vdW50OiAxXG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNhcmQ+XG4gICAgICAgICAgPGRpdiBrZXlib2FyZD5cbiAgICAgICAgICAgICR7T2JqZWN0LmVudHJpZXModGhpcy5rZXlib2FyZF9tb2RlbCkucmVkdWNlKChrZXlib2FyZCwgW3Jvd19uYW1lLCByb3ddKSA9PiBgXG4gICAgICAgICAgICAgICR7a2V5Ym9hcmR9XG4gICAgICAgICAgICAgIDxzZWN0aW9uICR7cm93X25hbWV9PiR7cm93LnJlZHVjZSgocm93LCBrZXksIGkpID0+IGBcbiAgICAgICAgICAgICAgICAke3Jvd31cbiAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgJHtrZXl9XG4gICAgICAgICAgICAgICAgICAke3RoaXMuX2hvdGtleSA9PSBrZXkgPyAnaG90a2V5IHRpdGxlPVwiVG9vbCBTaG9ydGN1dCBIb3RrZXlcIicgOiAnJ31cbiAgICAgICAgICAgICAgICAgICR7dGhpcy5fdXNlZGtleXMuaW5jbHVkZXMoa2V5KSA/ICd1c2VkJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgc3R5bGU9XCJmbGV4OiR7dGhpcy5rZXlfc2l6ZV9tb2RlbFtyb3dfbmFtZV1baV0gfHwgMX07XCJcbiAgICAgICAgICAgICAgICA+JHtrZXl9PC9zcGFuPlxuICAgICAgICAgICAgICBgLCAnJyl9XG4gICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgIGAsICcnKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHNlY3Rpb24gYXJyb3dzPlxuICAgICAgICAgICAgICA8c3BhbiB1cCB1c2VkPuKGkTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gZG93biB1c2VkPuKGkzwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gbGVmdCB1c2VkPuKGkDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gcmlnaHQgdXNlZD7ihpI8L3NwYW4+XG4gICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9hcnRpY2xlPlxuICAgIGBcbiAgfVxuXG4gIHN0eWxlcygpIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICAke3N0eWxlc31cbiAgICAgIDwvc3R5bGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5LW1hcCcsIEhvdGtleU1hcClcbiIsImltcG9ydCB7IEhvdGtleU1hcCB9IGZyb20gJy4vYmFzZS5lbGVtZW50J1xuaW1wb3J0IHsgZ3VpZGVzIGFzIGljb24gfSBmcm9tICcuLi92aXMtYnVnL3Zpcy1idWcuaWNvbnMnXG5cbmV4cG9ydCBjbGFzcyBHdWlkZXNIb3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICAgID0gJ2cnXG4gICAgdGhpcy5fdXNlZGtleXMgID0gW11cbiAgICB0aGlzLnRvb2wgICAgICAgPSAnZ3VpZGVzJ1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiB0b29sLWljb24+XG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAke2ljb259XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgY29taW5nIHNvb25cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy1ndWlkZXMnLCBHdWlkZXNIb3RrZXlzKVxuIiwiaW1wb3J0IHsgSG90a2V5TWFwIH0gZnJvbSAnLi9iYXNlLmVsZW1lbnQnXG5pbXBvcnQgeyBpbnNwZWN0b3IgYXMgaWNvbiB9IGZyb20gJy4uL3Zpcy1idWcvdmlzLWJ1Zy5pY29ucydcbmltcG9ydCB7IGFsdEtleSB9IGZyb20gJy4uLy4uL3V0aWxpdGllcyc7XG5cbmV4cG9ydCBjbGFzcyBJbnNwZWN0b3JIb3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICAgID0gJ2knXG4gICAgdGhpcy5fdXNlZGtleXMgID0gW2FsdEtleV1cbiAgICB0aGlzLnRvb2wgICAgICAgPSAnaW5zcGVjdG9yJ1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiB0b29sLWljb24+XG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAke2ljb259XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgY29taW5nIHNvb25cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy1pbnNwZWN0b3InLCBJbnNwZWN0b3JIb3RrZXlzKVxuIiwiaW1wb3J0IHsgSG90a2V5TWFwIH0gZnJvbSAnLi9iYXNlLmVsZW1lbnQnXG5pbXBvcnQgeyBhY2Nlc3NpYmlsaXR5IGFzIGljb24gfSBmcm9tICcuLi92aXMtYnVnL3Zpcy1idWcuaWNvbnMnXG5pbXBvcnQgeyBhbHRLZXkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMnO1xuXG5leHBvcnQgY2xhc3MgQWNjZXNzaWJpbGl0eUhvdGtleXMgZXh0ZW5kcyBIb3RrZXlNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLl9ob3RrZXkgICAgPSAncCdcbiAgICB0aGlzLl91c2Vka2V5cyAgPSBbYWx0S2V5XVxuICAgIHRoaXMudG9vbCAgICAgICA9ICdhY2Nlc3NpYmlsaXR5J1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiB0b29sLWljb24+XG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAke2ljb259XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgY29taW5nIHNvb25cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy1hY2Nlc3NpYmlsaXR5JywgQWNjZXNzaWJpbGl0eUhvdGtleXMpXG4iLCJpbXBvcnQgeyBIb3RrZXlNYXAgfSBmcm9tICcuL2Jhc2UuZWxlbWVudCdcblxuZXhwb3J0IGNsYXNzIE1vdmVIb3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICA9ICd2J1xuICAgIHRoaXMudG9vbCAgICAgPSAnbW92ZSdcbiAgfVxuXG4gIGNyZWF0ZUNvbW1hbmQoe2U6e2NvZGV9LCBob3RrZXlzfSkge1xuICAgIGxldCBhbW91bnQsIG5lZ2F0aXZlLCBuZWdhdGl2ZV9tb2RpZmllclxuXG4gICAgbGV0IHNpZGUgPSAnW2Fycm93IGtleV0nXG4gICAgaWYgKGNvZGUgPT09ICdBcnJvd1VwJykgICAgIHNpZGUgPSAndXAgJiBvdXQgb2YgZGl2J1xuICAgIGlmIChjb2RlID09PSAnQXJyb3dEb3duJykgICBzaWRlID0gJ2Rvd24gJiBpbnRvIG5leHQgc2libGluZyAvIG91dCAmIHVuZGVyIGRpdidcbiAgICBpZiAoY29kZSA9PT0gJ0Fycm93TGVmdCcpICAgc2lkZSA9ICd0b3dhcmRzIHRoZSBmcm9udC90b3Agb2YgdGhlIHN0YWNrJ1xuICAgIGlmIChjb2RlID09PSAnQXJyb3dSaWdodCcpICBzaWRlID0gJ3Rvd2FyZHMgdGhlIGJhY2svYm90dG9tIG9mIHRoZSBzdGFjaydcblxuICAgIHJldHVybiB7XG4gICAgICBuZWdhdGl2ZSwgbmVnYXRpdmVfbW9kaWZpZXIsIGFtb3VudCwgc2lkZSxcbiAgICB9XG4gIH1cblxuICBkaXNwbGF5Q29tbWFuZCh7c2lkZX0pIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHNwYW4gdG9vbD4ke3RoaXMuX3Rvb2x9PC9zcGFuPlxuICAgICAgPHNwYW4gc2lkZT4ke3NpZGV9PC9zcGFuPlxuICAgIGBcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2hvdGtleXMtbW92ZScsIE1vdmVIb3RrZXlzKSIsImltcG9ydCB7IEhvdGtleU1hcCB9IGZyb20gJy4vYmFzZS5lbGVtZW50J1xuaW1wb3J0IHsgbWV0YUtleSwgYWx0S2V5IH0gICBmcm9tICcuLi8uLi91dGlsaXRpZXMvJ1xuXG5leHBvcnQgY2xhc3MgTWFyZ2luSG90a2V5cyBleHRlbmRzIEhvdGtleU1hcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMuX2hvdGtleSAgICA9ICdtJ1xuICAgIHRoaXMuX3VzZWRrZXlzICA9IFsnc2hpZnQnLG1ldGFLZXksYWx0S2V5XVxuXG4gICAgdGhpcy50b29sICAgICAgID0gJ21hcmdpbidcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2hvdGtleXMtbWFyZ2luJywgTWFyZ2luSG90a2V5cylcbiIsImltcG9ydCB7IEhvdGtleU1hcCB9IGZyb20gJy4vYmFzZS5lbGVtZW50J1xuaW1wb3J0IHsgbWV0YUtleSwgYWx0S2V5IH0gICBmcm9tICcuLi8uLi91dGlsaXRpZXMvJ1xuXG5leHBvcnQgY2xhc3MgUGFkZGluZ0hvdGtleXMgZXh0ZW5kcyBIb3RrZXlNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLl9ob3RrZXkgICAgPSAncCdcbiAgICB0aGlzLl91c2Vka2V5cyAgPSBbJ3NoaWZ0JyxtZXRhS2V5LGFsdEtleV1cblxuICAgIHRoaXMudG9vbCAgICAgICA9ICdwYWRkaW5nJ1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy1wYWRkaW5nJywgUGFkZGluZ0hvdGtleXMpXG4iLCJpbXBvcnQgeyBIb3RrZXlNYXAgfSBmcm9tICcuL2Jhc2UuZWxlbWVudCdcbmltcG9ydCB7IG1ldGFLZXkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMnO1xuXG5jb25zdCBoX2FsaWduT3B0aW9ucyAgPSBbJ2xlZnQnLCdjZW50ZXInLCdyaWdodCddXG5jb25zdCB2X2FsaWduT3B0aW9ucyAgPSBbJ3RvcCcsJ2NlbnRlcicsJ2JvdHRvbSddXG5jb25zdCBkaXN0T3B0aW9ucyAgICAgPSBbJ2V2ZW5seScsJ25vcm1hbCcsJ2JldHdlZW4nXVxuXG5leHBvcnQgY2xhc3MgQWxpZ25Ib3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICAgPSAnYSdcbiAgICB0aGlzLl91c2Vka2V5cyA9IFttZXRhS2V5LCdzaGlmdCddXG5cbiAgICB0aGlzLl9odG9vbCAgID0gMFxuICAgIHRoaXMuX3Z0b29sICAgPSAwXG4gICAgdGhpcy5fZHRvb2wgICA9IDFcblxuICAgIHRoaXMuX3NpZGUgICAgICAgICA9ICd0b3AgbGVmdCdcbiAgICB0aGlzLl9kaXJlY3Rpb24gICAgPSAncm93J1xuICAgIHRoaXMuX2Rpc3RyaWJ1dGlvbiA9IGRpc3RPcHRpb25zW3RoaXMuX2R0b29sXVxuXG4gICAgdGhpcy50b29sICAgICA9ICdhbGlnbidcbiAgfVxuXG4gIGNyZWF0ZUNvbW1hbmQoe2U6e2NvZGV9LCBob3RrZXlzfSkge1xuICAgIGxldCBhbW91bnQgICAgICAgICAgICA9IHRoaXMuX2Rpc3RyaWJ1dGlvblxuICAgICAgLCBuZWdhdGl2ZV9tb2RpZmllciA9IHRoaXMuX2RpcmVjdGlvblxuICAgICAgLCBzaWRlICAgICAgICAgICAgICA9IHRoaXMuX3NpZGVcbiAgICAgICwgbmVnYXRpdmVcblxuICAgIGlmIChob3RrZXlzLmNtZCAmJiAoY29kZSA9PT0gJ0Fycm93UmlnaHQnIHx8IGNvZGUgPT09ICdBcnJvd0Rvd24nKSkge1xuICAgICAgbmVnYXRpdmVfbW9kaWZpZXIgPSBjb2RlID09PSAnQXJyb3dEb3duJ1xuICAgICAgICA/ICdjb2x1bW4nXG4gICAgICAgIDogJ3JvdydcbiAgICAgIHRoaXMuX2RpcmVjdGlvbiA9IG5lZ2F0aXZlX21vZGlmaWVyXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd1VwJykgICAgICAgICAgIHNpZGUgPSB0aGlzLmNsYW1wKHZfYWxpZ25PcHRpb25zLCAnX3Z0b29sJylcbiAgICAgIGVsc2UgaWYgKGNvZGUgPT09ICdBcnJvd0Rvd24nKSAgICBzaWRlID0gdGhpcy5jbGFtcCh2X2FsaWduT3B0aW9ucywgJ192dG9vbCcsIHRydWUpXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkZSA9IHZfYWxpZ25PcHRpb25zW3RoaXMuX3Z0b29sXVxuXG4gICAgICBpZiAoY29kZSA9PT0gJ0Fycm93TGVmdCcpICAgICAgICAgc2lkZSArPSAnICcgKyB0aGlzLmNsYW1wKGhfYWxpZ25PcHRpb25zLCAnX2h0b29sJylcbiAgICAgIGVsc2UgaWYgKGNvZGUgPT09ICdBcnJvd1JpZ2h0JykgICBzaWRlICs9ICcgJyArIHRoaXMuY2xhbXAoaF9hbGlnbk9wdGlvbnMsICdfaHRvb2wnLCB0cnVlKVxuICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZGUgKz0gJyAnICsgaF9hbGlnbk9wdGlvbnNbdGhpcy5faHRvb2xdXG5cbiAgICAgIHRoaXMuX3NpZGUgPSBzaWRlXG5cbiAgICAgIGlmIChob3RrZXlzLnNoaWZ0ICYmIChjb2RlID09PSAnQXJyb3dSaWdodCcgfHwgY29kZSA9PT0gJ0Fycm93TGVmdCcpKSB7XG4gICAgICAgIGFtb3VudCA9IHRoaXMuY2xhbXAoZGlzdE9wdGlvbnMsICdfZHRvb2wnLCBjb2RlID09PSAnQXJyb3dSaWdodCcpXG4gICAgICAgIHRoaXMuX2Rpc3RyaWJ1dGlvbiA9IGFtb3VudFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBuZWdhdGl2ZSwgbmVnYXRpdmVfbW9kaWZpZXIsIGFtb3VudCwgc2lkZSxcbiAgICB9XG4gIH1cblxuICBkaXNwbGF5Q29tbWFuZCh7c2lkZSwgYW1vdW50LCBuZWdhdGl2ZV9tb2RpZmllcn0pIHtcbiAgICBpZiAoYW1vdW50ID09IDEpIGFtb3VudCA9IHRoaXMuX2Rpc3RyaWJ1dGlvblxuICAgIGlmIChuZWdhdGl2ZV9tb2RpZmllciA9PSAnIHRvICcpIG5lZ2F0aXZlX21vZGlmaWVyID0gdGhpcy5fZGlyZWN0aW9uXG5cbiAgICByZXR1cm4gYFxuICAgICAgPHNwYW4gdG9vbD4ke3RoaXMuX3Rvb2x9PC9zcGFuPlxuICAgICAgPHNwYW4gbGlnaHQ+IGFzIDwvc3Bhbj5cbiAgICAgIDxzcGFuPiR7bmVnYXRpdmVfbW9kaWZpZXJ9Ojwvc3Bhbj5cbiAgICAgIDxzcGFuIHNpZGU+JHtzaWRlfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGxpZ2h0PiBkaXN0cmlidXRlZCA8L3NwYW4+XG4gICAgICA8c3BhbiBhbW91bnQ+JHthbW91bnR9PC9zcGFuPlxuICAgIGBcbiAgfVxuXG4gIGNsYW1wKHJhbmdlLCB0b29sLCBpbmNyZW1lbnQgPSBmYWxzZSkge1xuICAgIGlmIChpbmNyZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzW3Rvb2xdIDwgcmFuZ2UubGVuZ3RoIC0gMSlcbiAgICAgICAgdGhpc1t0b29sXSA9IHRoaXNbdG9vbF0gKyAxXG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXNbdG9vbF0gPiAwKVxuICAgICAgdGhpc1t0b29sXSA9IHRoaXNbdG9vbF0gLSAxXG5cbiAgICByZXR1cm4gcmFuZ2VbdGhpc1t0b29sXV1cbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2hvdGtleXMtYWxpZ24nLCBBbGlnbkhvdGtleXMpXG4iLCJpbXBvcnQgeyBIb3RrZXlNYXAgfSBmcm9tICcuL2Jhc2UuZWxlbWVudCdcbmltcG9ydCB7IGh1ZXNoaWZ0IGFzIGljb24gfSBmcm9tICcuLi92aXMtYnVnL3Zpcy1idWcuaWNvbnMnXG5pbXBvcnQgeyBtZXRhS2V5LCBhbHRLZXkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMnO1xuXG5leHBvcnQgY2xhc3MgSHVlc2hpZnRIb3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICAgID0gJ2gnXG4gICAgdGhpcy5fdXNlZGtleXMgID0gWydzaGlmdCcsbWV0YUtleV1cbiAgICB0aGlzLnRvb2wgICAgICAgPSAnaHVlc2hpZnQnXG4gIH1cblxuICBjcmVhdGVDb21tYW5kKHtlOntjb2RlfSwgaG90a2V5c30pIHtcbiAgICBsZXQgYW1vdW50ICAgICAgICAgICAgICA9IGhvdGtleXMuc2hpZnQgPyAxMCA6IDFcbiAgICBsZXQgbmVnYXRpdmUgICAgICAgICAgICA9ICdbaW5jcmVhc2UvZGVjcmVhc2VdJ1xuICAgIGxldCBuZWdhdGl2ZV9tb2RpZmllciAgID0gJ2J5J1xuICAgIGxldCBzaWRlICAgICAgICAgICAgICAgID0gJ1thcnJvdyBrZXldJ1xuXG4gICAgLy8gc2F0dXJhdGlvblxuICAgIGlmIChob3RrZXlzLmNtZCkge1xuICAgICAgc2lkZSA9J2h1ZSdcblxuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd0Rvd24nKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnZGVjcmVhc2UnXG4gICAgICBpZiAoY29kZSA9PT0gJ0Fycm93VXAnKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnaW5jcmVhc2UnXG4gICAgfVxuICAgIGVsc2UgaWYgKGNvZGUgPT09ICdBcnJvd0xlZnQnIHx8IGNvZGUgPT09ICdBcnJvd1JpZ2h0Jykge1xuICAgICAgc2lkZSA9ICdzYXR1cmF0aW9uJ1xuXG4gICAgICBpZiAoY29kZSA9PT0gJ0Fycm93TGVmdCcpXG4gICAgICAgIG5lZ2F0aXZlICA9ICdkZWNyZWFzZSdcbiAgICAgIGlmIChjb2RlID09PSAnQXJyb3dSaWdodCcpXG4gICAgICAgIG5lZ2F0aXZlICA9ICdpbmNyZWFzZSdcbiAgICB9XG4gICAgLy8gbGlnaHRuZXNzXG4gICAgZWxzZSBpZiAoY29kZSA9PT0gJ0Fycm93VXAnIHx8IGNvZGUgPT09ICdBcnJvd0Rvd24nKSB7XG4gICAgICBzaWRlID0gJ2xpZ2h0bmVzcydcblxuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd0Rvd24nKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnZGVjcmVhc2UnXG4gICAgICBpZiAoY29kZSA9PT0gJ0Fycm93VXAnKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnaW5jcmVhc2UnXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5lZ2F0aXZlLCBuZWdhdGl2ZV9tb2RpZmllciwgYW1vdW50LCBzaWRlLFxuICAgIH1cbiAgfVxuXG4gIGRpc3BsYXlDb21tYW5kKHtuZWdhdGl2ZSwgbmVnYXRpdmVfbW9kaWZpZXIsIHNpZGUsIGFtb3VudH0pIHtcbiAgICBpZiAobmVnYXRpdmUgPT09IGDCsVske2FsdEtleX1dIGApXG4gICAgICBuZWdhdGl2ZSA9ICdbaW5jcmVhc2UvZGVjcmVhc2VdJ1xuICAgIGlmIChuZWdhdGl2ZV9tb2RpZmllciA9PT0gJyB0byAnKVxuICAgICAgbmVnYXRpdmVfbW9kaWZpZXIgPSAnIGJ5ICdcblxuICAgIHJldHVybiBgXG4gICAgICA8c3BhbiBuZWdhdGl2ZT4ke25lZ2F0aXZlfTwvc3Bhbj5cbiAgICAgIDxzcGFuIHNpZGUgdG9vbD4ke3NpZGV9PC9zcGFuPlxuICAgICAgPHNwYW4gbGlnaHQ+JHtuZWdhdGl2ZV9tb2RpZmllcn08L3NwYW4+XG4gICAgICA8c3BhbiBhbW91bnQ+JHthbW91bnR9PC9zcGFuPlxuICAgIGBcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2hvdGtleXMtaHVlc2hpZnQnLCBIdWVzaGlmdEhvdGtleXMpXG4iLCJpbXBvcnQgeyBIb3RrZXlNYXAgfSBmcm9tICcuL2Jhc2UuZWxlbWVudCdcbmltcG9ydCB7IGJveHNoYWRvdyBhcyBpY29uIH0gZnJvbSAnLi4vdmlzLWJ1Zy92aXMtYnVnLmljb25zJ1xuaW1wb3J0IHsgbWV0YUtleSB9IGZyb20gJy4uLy4uL3V0aWxpdGllcyc7XG5cbmV4cG9ydCBjbGFzcyBCb3hzaGFkb3dIb3RrZXlzIGV4dGVuZHMgSG90a2V5TWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5faG90a2V5ICAgID0gJ2QnXG4gICAgdGhpcy5fdXNlZGtleXMgID0gWydzaGlmdCcsbWV0YUtleV1cbiAgICB0aGlzLnRvb2wgICAgICAgPSAnYm94c2hhZG93J1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiB0b29sLWljb24+XG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAke2ljb259XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgY29taW5nIHNvb25cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy1ib3hzaGFkb3cnLCBCb3hzaGFkb3dIb3RrZXlzKVxuIiwiaW1wb3J0IHsgSG90a2V5TWFwIH0gZnJvbSAnLi9iYXNlLmVsZW1lbnQnXG5pbXBvcnQgeyBwb3NpdGlvbiBhcyBpY29uIH0gZnJvbSAnLi4vdmlzLWJ1Zy92aXMtYnVnLmljb25zJ1xuaW1wb3J0IHsgYWx0S2V5IH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzJztcblxuZXhwb3J0IGNsYXNzIFBvc2l0aW9uSG90a2V5cyBleHRlbmRzIEhvdGtleU1hcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMuX2hvdGtleSAgICA9ICdsJ1xuICAgIHRoaXMuX3VzZWRrZXlzICA9IFsnc2hpZnQnLGFsdEtleV1cbiAgICB0aGlzLnRvb2wgICAgICAgPSAncG9zaXRpb24nXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG5cbiAgc2hvdygpIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoKX1cbiAgICAgIDxhcnRpY2xlPlxuICAgICAgICA8ZGl2IHRvb2wtaWNvbj5cbiAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICR7aWNvbn1cbiAgICAgICAgICAgICR7dGhpcy5fdG9vbH0gVG9vbFxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY29tbWFuZD5cbiAgICAgICAgICBjb21pbmcgc29vblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYXJ0aWNsZT5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCdob3RrZXlzLXBvc2l0aW9uJywgUG9zaXRpb25Ib3RrZXlzKVxuIiwiaW1wb3J0IHsgSG90a2V5TWFwIH0gZnJvbSAnLi9iYXNlLmVsZW1lbnQnXG5pbXBvcnQgeyBtZXRhS2V5LCBhbHRLZXkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMnO1xuXG5leHBvcnQgY2xhc3MgRm9udEhvdGtleXMgZXh0ZW5kcyBIb3RrZXlNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLl9ob3RrZXkgICAgPSAnZidcbiAgICB0aGlzLl91c2Vka2V5cyAgPSBbJ3NoaWZ0JyxtZXRhS2V5XVxuICAgIHRoaXMudG9vbCAgICAgICA9ICdmb250J1xuICB9XG5cbiAgY3JlYXRlQ29tbWFuZCh7ZTp7Y29kZX0sIGhvdGtleXN9KSB7XG4gICAgbGV0IGFtb3VudCAgICAgICAgICAgICAgPSBob3RrZXlzLnNoaWZ0ID8gMTAgOiAxXG4gICAgbGV0IG5lZ2F0aXZlICAgICAgICAgICAgPSAnW2luY3JlYXNlL2RlY3JlYXNlXSdcbiAgICBsZXQgbmVnYXRpdmVfbW9kaWZpZXIgICA9ICdieSdcbiAgICBsZXQgc2lkZSAgICAgICAgICAgICAgICA9ICdbYXJyb3cga2V5XSdcblxuICAgIC8vIGtlcm5pbmdcbiAgICBpZiAoaG90a2V5cy5zaGlmdCAmJiAoY29kZSA9PT0gJ0Fycm93TGVmdCcgfHwgY29kZSA9PT0gJ0Fycm93UmlnaHQnKSkge1xuICAgICAgc2lkZSAgICA9ICdrZXJuaW5nJ1xuICAgICAgYW1vdW50ICA9ICcxcHgnXG5cbiAgICAgIGlmIChjb2RlID09PSAnQXJyb3dMZWZ0JylcbiAgICAgICAgbmVnYXRpdmUgID0gJ2RlY3JlYXNlJ1xuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd1JpZ2h0JylcbiAgICAgICAgbmVnYXRpdmUgID0gJ2luY3JlYXNlJ1xuICAgIH1cbiAgICAvLyBsZWFkaW5nXG4gICAgZWxzZSBpZiAoaG90a2V5cy5zaGlmdCAmJiAoY29kZSA9PT0gJ0Fycm93VXAnIHx8IGNvZGUgPT09ICdBcnJvd0Rvd24nKSkge1xuICAgICAgc2lkZSAgICA9ICdsZWFkaW5nJ1xuICAgICAgYW1vdW50ICA9ICcxcHgnXG5cbiAgICAgIGlmIChjb2RlID09PSAnQXJyb3dVcCcpXG4gICAgICAgIG5lZ2F0aXZlICA9ICdpbmNyZWFzZSdcbiAgICAgIGlmIChjb2RlID09PSAnQXJyb3dEb3duJylcbiAgICAgICAgbmVnYXRpdmUgID0gJ2RlY3JlYXNlJ1xuICAgIH1cbiAgICAvLyBmb250IHdlaWdodFxuICAgIGVsc2UgaWYgKGhvdGtleXMuY21kICYmIChjb2RlID09PSAnQXJyb3dVcCcgfHwgY29kZSA9PT0gJ0Fycm93RG93bicpKSB7XG4gICAgICBzaWRlICAgICAgICAgICAgICAgID0gJ2ZvbnQgd2VpZ2h0J1xuICAgICAgYW1vdW50ICAgICAgICAgICAgICA9ICcnXG4gICAgICBuZWdhdGl2ZV9tb2RpZmllciAgID0gJydcblxuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd1VwJylcbiAgICAgICAgbmVnYXRpdmUgID0gJ2luY3JlYXNlJ1xuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd0Rvd24nKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnZGVjcmVhc2UnXG4gICAgfVxuICAgIC8vIGZvbnQgc2l6ZVxuICAgIGVsc2UgaWYgKGNvZGUgPT09ICdBcnJvd1VwJyB8fCBjb2RlID09PSAnQXJyb3dEb3duJykge1xuICAgICAgc2lkZSAgICA9ICdmb250IHNpemUnXG4gICAgICBhbW91bnQgID0gJzFweCdcblxuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd1VwJylcbiAgICAgICAgbmVnYXRpdmUgID0gJ2luY3JlYXNlJ1xuICAgICAgaWYgKGNvZGUgPT09ICdBcnJvd0Rvd24nKVxuICAgICAgICBuZWdhdGl2ZSAgPSAnZGVjcmVhc2UnXG4gICAgfVxuICAgIC8vIHRleHQgYWxpZ25tZW50XG4gICAgZWxzZSBpZiAoY29kZSA9PT0gJ0Fycm93UmlnaHQnIHx8IGNvZGUgPT09ICdBcnJvd0xlZnQnKSB7XG4gICAgICBzaWRlICAgICAgICAgICAgICAgID0gJ3RleHQgYWxpZ25tZW50J1xuICAgICAgYW1vdW50ICAgICAgICAgICAgICA9ICcnXG4gICAgICBuZWdhdGl2ZSAgICAgICAgICAgID0gJ2FkanVzdCdcbiAgICAgIG5lZ2F0aXZlX21vZGlmaWVyICAgPSAnJ1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBuZWdhdGl2ZSwgbmVnYXRpdmVfbW9kaWZpZXIsIGFtb3VudCwgc2lkZSxcbiAgICB9XG4gIH1cblxuICBkaXNwbGF5Q29tbWFuZCh7bmVnYXRpdmUsIG5lZ2F0aXZlX21vZGlmaWVyLCBzaWRlLCBhbW91bnR9KSB7XG4gICAgaWYgKG5lZ2F0aXZlID09PSBgwrFbJHthbHRLZXl9XSBgKVxuICAgICAgbmVnYXRpdmUgPSAnW2luY3JlYXNlL2RlY3JlYXNlXSdcbiAgICBpZiAobmVnYXRpdmVfbW9kaWZpZXIgPT09ICcgdG8gJylcbiAgICAgIG5lZ2F0aXZlX21vZGlmaWVyID0gJyBieSAnXG5cbiAgICByZXR1cm4gYFxuICAgICAgPHNwYW4gbmVnYXRpdmU+JHtuZWdhdGl2ZX08L3NwYW4+XG4gICAgICA8c3BhbiBzaWRlIHRvb2w+JHtzaWRlfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGxpZ2h0PiR7bmVnYXRpdmVfbW9kaWZpZXJ9PC9zcGFuPlxuICAgICAgPHNwYW4gYW1vdW50PiR7YW1vdW50fTwvc3Bhbj5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCdob3RrZXlzLWZvbnQnLCBGb250SG90a2V5cylcbiIsImltcG9ydCB7IEhvdGtleU1hcCB9IGZyb20gJy4vYmFzZS5lbGVtZW50J1xuaW1wb3J0IHsgdGV4dCBhcyBpY29uIH0gZnJvbSAnLi4vdmlzLWJ1Zy92aXMtYnVnLmljb25zJ1xuXG5leHBvcnQgY2xhc3MgVGV4dEhvdGtleXMgZXh0ZW5kcyBIb3RrZXlNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLl9ob3RrZXkgICAgPSAnZSdcbiAgICB0aGlzLl91c2Vka2V5cyAgPSBbXVxuICAgIHRoaXMudG9vbCAgICAgICA9ICd0ZXh0J1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy4kc2hhZG93Lmhvc3Quc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiB0b29sLWljb24+XG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAke2ljb259XG4gICAgICAgICAgICAke3RoaXMuX3Rvb2x9IFRvb2xcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNvbW1hbmQ+XG4gICAgICAgICAgY29taW5nIHNvb25cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5cy10ZXh0JywgVGV4dEhvdGtleXMpXG4iLCJpbXBvcnQgeyBIb3RrZXlNYXAgfSBmcm9tICcuL2Jhc2UuZWxlbWVudCdcbmltcG9ydCB7IHNlYXJjaCBhcyBpY29uIH0gZnJvbSAnLi4vdmlzLWJ1Zy92aXMtYnVnLmljb25zJ1xuXG5leHBvcnQgY2xhc3MgU2VhcmNoSG90a2V5cyBleHRlbmRzIEhvdGtleU1hcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMuX2hvdGtleSAgICA9ICdzJ1xuICAgIHRoaXMuX3VzZWRrZXlzICA9IFtdXG4gICAgdGhpcy50b29sICAgICAgID0gJ3NlYXJjaCdcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge31cblxuICBzaG93KCkge1xuICAgIHRoaXMuJHNoYWRvdy5ob3N0LnN0eWxlLmRpc3BsYXkgPSAnZmxleCdcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gYFxuICAgICAgJHt0aGlzLnN0eWxlcygpfVxuICAgICAgPGFydGljbGU+XG4gICAgICAgIDxkaXYgdG9vbC1pY29uPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgJHtpY29ufVxuICAgICAgICAgICAgJHt0aGlzLl90b29sfSBUb29sXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjb21tYW5kPlxuICAgICAgICAgIGNvbWluZyBzb29uXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9hcnRpY2xlPlxuICAgIGBcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2hvdGtleXMtc2VhcmNoJywgU2VhcmNoSG90a2V5cylcbiIsImltcG9ydCAkICAgICAgICBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyAgZnJvbSAnaG90a2V5cy1qcydcblxuaW1wb3J0IHsgR3VpZGVzSG90a2V5cyB9ICAgICAgICBmcm9tICcuL2d1aWRlcy5lbGVtZW50J1xuaW1wb3J0IHsgSW5zcGVjdG9ySG90a2V5cyB9ICAgICBmcm9tICcuL2luc3BlY3Rvci5lbGVtZW50J1xuaW1wb3J0IHsgQWNjZXNzaWJpbGl0eUhvdGtleXMgfSBmcm9tICcuL2FjY2Vzc2liaWxpdHkuZWxlbWVudCdcbmltcG9ydCB7IE1vdmVIb3RrZXlzIH0gICAgICAgICAgZnJvbSAnLi9tb3ZlLmVsZW1lbnQnXG5pbXBvcnQgeyBNYXJnaW5Ib3RrZXlzIH0gICAgICAgIGZyb20gJy4vbWFyZ2luLmVsZW1lbnQnXG5pbXBvcnQgeyBQYWRkaW5nSG90a2V5cyB9ICAgICAgIGZyb20gJy4vcGFkZGluZy5lbGVtZW50J1xuaW1wb3J0IHsgQWxpZ25Ib3RrZXlzIH0gICAgICAgICBmcm9tICcuL2FsaWduLmVsZW1lbnQnXG5pbXBvcnQgeyBIdWVzaGlmdEhvdGtleXMgfSAgICAgIGZyb20gJy4vaHVlc2hpZnQuZWxlbWVudCdcbmltcG9ydCB7IEJveHNoYWRvd0hvdGtleXMgfSAgICAgZnJvbSAnLi9ib3hzaGFkb3cuZWxlbWVudCdcbmltcG9ydCB7IFBvc2l0aW9uSG90a2V5cyB9ICAgICAgZnJvbSAnLi9wb3NpdGlvbi5lbGVtZW50J1xuaW1wb3J0IHsgRm9udEhvdGtleXMgfSAgICAgICAgICBmcm9tICcuL2ZvbnQuZWxlbWVudCdcbmltcG9ydCB7IFRleHRIb3RrZXlzIH0gICAgICAgICAgZnJvbSAnLi90ZXh0LmVsZW1lbnQnXG5pbXBvcnQgeyBTZWFyY2hIb3RrZXlzIH0gICAgICAgIGZyb20gJy4vc2VhcmNoLmVsZW1lbnQnXG5cbmV4cG9ydCBjbGFzcyBIb3RrZXlzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMudG9vbF9tYXAgPSB7XG4gICAgICBndWlkZXM6ICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaG90a2V5cy1ndWlkZXMnKSxcbiAgICAgIGluc3BlY3RvcjogICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdob3RrZXlzLWluc3BlY3RvcicpLFxuICAgICAgYWNjZXNzaWJpbGl0eTogIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hvdGtleXMtYWNjZXNzaWJpbGl0eScpLFxuICAgICAgbW92ZTogICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hvdGtleXMtbW92ZScpLFxuICAgICAgbWFyZ2luOiAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hvdGtleXMtbWFyZ2luJyksXG4gICAgICBwYWRkaW5nOiAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaG90a2V5cy1wYWRkaW5nJyksXG4gICAgICBhbGlnbjogICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaG90a2V5cy1hbGlnbicpLFxuICAgICAgaHVlc2hpZnQ6ICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hvdGtleXMtaHVlc2hpZnQnKSxcbiAgICAgIGJveHNoYWRvdzogICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdob3RrZXlzLWJveHNoYWRvdycpLFxuICAgICAgcG9zaXRpb246ICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hvdGtleXMtcG9zaXRpb24nKSxcbiAgICAgIGZvbnQ6ICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdob3RrZXlzLWZvbnQnKSxcbiAgICAgIHRleHQ6ICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdob3RrZXlzLXRleHQnKSxcbiAgICAgIHNlYXJjaDogICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdob3RrZXlzLXNlYXJjaCcpLFxuICAgIH1cblxuICAgIE9iamVjdC52YWx1ZXModGhpcy50b29sX21hcCkuZm9yRWFjaCh0b29sID0+XG4gICAgICB0aGlzLmFwcGVuZENoaWxkKHRvb2wpKVxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgaG90a2V5cygnc2hpZnQrLycsIGUgPT5cbiAgICAgIHRoaXMuY3VyX3Rvb2xcbiAgICAgICAgPyB0aGlzLmhpZGVUb29sKClcbiAgICAgICAgOiB0aGlzLnNob3dUb29sKCkpXG5cbiAgICBob3RrZXlzKCdlc2MnLCBlID0+IHRoaXMuaGlkZVRvb2woKSlcbiAgfVxuXG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge31cblxuICBoaWRlVG9vbCgpIHtcbiAgICBpZiAoIXRoaXMuY3VyX3Rvb2wpIHJldHVyblxuICAgIHRoaXMuY3VyX3Rvb2wuaGlkZSgpXG4gICAgdGhpcy5jdXJfdG9vbCA9IG51bGxcbiAgfVxuXG4gIHNob3dUb29sKCkge1xuICAgIHRoaXMuY3VyX3Rvb2wgPSB0aGlzLnRvb2xfbWFwW1xuICAgICAgJCgndmlzLWJ1ZycpWzBdLmFjdGl2ZVRvb2xdXG4gICAgdGhpcy5jdXJfdG9vbC5zaG93KClcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3Zpc2J1Zy1ob3RrZXlzJywgSG90a2V5cylcbiIsImltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBtZXRhS2V5LCBnZXRTdHlsZSwgZ2V0U2lkZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PlxuICAgIGAke2V2ZW50c30sJHtldmVudH0sYWx0KyR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9LHNoaWZ0K2FsdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9IGAke21ldGFLZXl9K3VwLCR7bWV0YUtleX0rc2hpZnQrdXAsJHttZXRhS2V5fStkb3duLCR7bWV0YUtleX0rc2hpZnQrZG93bmBcblxuZXhwb3J0IGZ1bmN0aW9uIE1hcmdpbih2aXNidWcpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGlmIChlLmNhbmNlbEJ1YmJsZSkgcmV0dXJuXG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwdXNoRWxlbWVudCh2aXNidWcuc2VsZWN0aW9uKCksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIGhvdGtleXMoY29tbWFuZF9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcHVzaEFsbEVsZW1lbnRTaWRlcyh2aXNidWcuc2VsZWN0aW9uKCksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIHZpc2J1Zy5vblNlbGVjdGVkVXBkYXRlKHBhaW50QmFja2dyb3VuZHMpXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKSAvLyBidWcgaW4gbGliP1xuICAgIHZpc2J1Zy5yZW1vdmVTZWxlY3RlZENhbGxiYWNrKHBhaW50QmFja2dyb3VuZHMpXG4gICAgcmVtb3ZlQmFja2dyb3VuZHModmlzYnVnLnNlbGVjdGlvbigpKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdXNoRWxlbWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHtcbiAgICAgIGVsLFxuICAgICAgc3R5bGU6ICAgICdtYXJnaW4nICsgZ2V0U2lkZShkaXJlY3Rpb24pLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAnbWFyZ2luJyArIGdldFNpZGUoZGlyZWN0aW9uKSksIDEwKSxcbiAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnYWx0JyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgbWFyZ2luOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBtYXJnaW59KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7bWFyZ2luIDwgMCA/IDAgOiBtYXJnaW59cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVzaEFsbEVsZW1lbnRTaWRlcyhlbHMsIGtleWNvbW1hbmQpIHtcbiAgY29uc3QgY29tYm8gPSBrZXljb21tYW5kLnNwbGl0KCcrJylcbiAgbGV0IHNwb29mID0gJydcblxuICBpZiAoY29tYm8uaW5jbHVkZXMoJ3NoaWZ0JykpICBzcG9vZiA9ICdzaGlmdCsnICsgc3Bvb2ZcbiAgaWYgKGNvbWJvLmluY2x1ZGVzKCdkb3duJykpICAgc3Bvb2YgPSAnYWx0KycgKyBzcG9vZlxuXG4gICd1cCxkb3duLGxlZnQscmlnaHQnLnNwbGl0KCcsJylcbiAgICAuZm9yRWFjaChzaWRlID0+IHB1c2hFbGVtZW50KGVscywgc3Bvb2YgKyBzaWRlKSlcbn1cblxuZnVuY3Rpb24gcGFpbnRCYWNrZ3JvdW5kcyhlbHMpIHtcbiAgZWxzLmZvckVhY2goZWwgPT4ge1xuICAgIGNvbnN0IGxhYmVsX2lkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJylcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgdmlzYnVnLWxhYmVsW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsX2lkfVwiXWApXG4gICAgICAuc3R5bGUub3BhY2l0eSA9IDBcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgdmlzYnVnLWhhbmRsZXNbZGF0YS1sYWJlbC1pZD1cIiR7bGFiZWxfaWR9XCJdYClcbiAgICAgIC5iYWNrZHJvcCA9IHtcbiAgICAgICAgZWxlbWVudDogIGNyZWF0ZU1hcmdpblZpc3VhbChlbCksXG4gICAgICAgIHVwZGF0ZTogICBjcmVhdGVNYXJnaW5WaXN1YWwsXG4gICAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIHJlbW92ZUJhY2tncm91bmRzKGVscykge1xuICBlbHMuZm9yRWFjaChlbCA9PiB7XG4gICAgY29uc3QgbGFiZWxfaWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwtaWQnKVxuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgdmlzYnVnLWxhYmVsW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsX2lkfVwiXWApXG4gICAgY29uc3QgYm94bW9kZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGB2aXNidWctaGFuZGxlc1tkYXRhLWxhYmVsLWlkPVwiJHtsYWJlbF9pZH1cIl1gKVxuICAgICAgLiRzaGFkb3cucXVlcnlTZWxlY3RvcigndmlzYnVnLWJveG1vZGVsJylcblxuICAgIGxhYmVsLnN0eWxlLm9wYWNpdHkgPSAxXG4gICAgaWYgKGJveG1vZGVsKSBib3htb2RlbC5yZW1vdmUoKVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWFyZ2luVmlzdWFsKGVsLCBob3ZlciA9IGZhbHNlKSB7XG4gIGNvbnN0IGJvdW5kcyAgICAgICAgICAgID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qgc3R5bGVPTSAgICAgICAgICAgPSBlbC5jb21wdXRlZFN0eWxlTWFwKClcbiAgY29uc3QgY2FsY3VsYXRlZFN0eWxlICAgPSBnZXRTdHlsZShlbCwgJ21hcmdpbicpXG4gIGNvbnN0IGJveGRpc3BsYXkgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlzYnVnLWJveG1vZGVsJylcblxuICBpZiAoY2FsY3VsYXRlZFN0eWxlICE9PSAnMHB4Jykge1xuICAgIGNvbnN0IHNpZGVzID0ge1xuICAgICAgdG9wOiAgICBzdHlsZU9NLmdldCgnbWFyZ2luLXRvcCcpLnZhbHVlLFxuICAgICAgcmlnaHQ6ICBzdHlsZU9NLmdldCgnbWFyZ2luLXJpZ2h0JykudmFsdWUsXG4gICAgICBib3R0b206IHN0eWxlT00uZ2V0KCdtYXJnaW4tYm90dG9tJykudmFsdWUsXG4gICAgICBsZWZ0OiAgIHN0eWxlT00uZ2V0KCdtYXJnaW4tbGVmdCcpLnZhbHVlLFxuICAgIH1cblxuICAgIE9iamVjdC5lbnRyaWVzKHNpZGVzKS5mb3JFYWNoKChbc2lkZSwgdmFsXSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB2YWwgIT09ICdudW1iZXInKVxuICAgICAgICB2YWwgPSBwYXJzZUludChnZXRTdHlsZShlbCwgJ3BhZGRpbmcnKyctJytzaWRlKS5zbGljZSgwLCAtMikpXG5cbiAgICAgIHNpZGVzW3NpZGVdID0gTWF0aC5yb3VuZCh2YWwudG9GaXhlZCgxKSAqIDEwMCkgLyAxMDBcbiAgICB9KVxuXG4gICAgYm94ZGlzcGxheS5wb3NpdGlvbiA9IHsgXG4gICAgICBtb2RlOiAnbWFyZ2luJyxcbiAgICAgIGNvbG9yOiBob3ZlciA/ICdwdXJwbGUnIDogJ3BpbmsnLFxuICAgICAgYm91bmRzLCBcbiAgICAgIHNpZGVzLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBib3hkaXNwbGF5XG59XG4iLCJpbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0Tm9kZUluZGV4LCBzaG93RWRnZSB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuLy8gdG9kbzogaW5kaWNhdG9yIGZvciB3aGVuIG5vZGUgY2FuIGRlc2NlbmRcbi8vIHRvZG86IGluZGljYXRvciB3aGVyZSBsZWZ0IGFuZCByaWdodCB3aWxsIGdvXG4vLyB0b2RvOiBoYXZlIGl0IHdvcmsgd2l0aCBzaGFkb3dET01cbmV4cG9ydCBmdW5jdGlvbiBNb3ZlYWJsZSh7c2VsZWN0aW9ufSkge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCB7a2V5fSkgPT4ge1xuICAgIGlmIChlLmNhbmNlbEJ1YmJsZSkgcmV0dXJuXG4gICAgICBcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgXG4gICAgc2VsZWN0aW9uKCkuZm9yRWFjaChlbCA9PiB7XG4gICAgICBtb3ZlRWxlbWVudChlbCwga2V5KVxuICAgICAgdXBkYXRlRmVlZGJhY2soZWwpXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdmVFbGVtZW50KGVsLCBkaXJlY3Rpb24pIHtcbiAgaWYgKCFlbCkgcmV0dXJuXG5cbiAgc3dpdGNoKGRpcmVjdGlvbikge1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgaWYgKGNhbk1vdmVMZWZ0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpXG4gICAgICBlbHNlXG4gICAgICAgIHNob3dFZGdlKGVsLnBhcmVudE5vZGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAncmlnaHQnOlxuICAgICAgaWYgKGNhbk1vdmVSaWdodChlbCkgJiYgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgICBlbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgZWxzZSBpZiAoY2FuTW92ZVJpZ2h0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbClcbiAgICAgIGVsc2VcbiAgICAgICAgc2hvd0VkZ2UoZWwucGFyZW50Tm9kZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd1cCc6XG4gICAgICBpZiAoY2FuTW92ZVVwKGVsKSlcbiAgICAgICAgcG9wT3V0KHtlbH0pXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZG93bic6XG4gICAgICBpZiAoY2FuTW92ZVVuZGVyKGVsKSlcbiAgICAgICAgcG9wT3V0KHtlbCwgdW5kZXI6IHRydWV9KVxuICAgICAgZWxzZSBpZiAoY2FuTW92ZURvd24oZWwpKVxuICAgICAgICBlbC5uZXh0RWxlbWVudFNpYmxpbmcucHJlcGVuZChlbClcbiAgICAgIGJyZWFrXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNhbk1vdmVMZWZ0ICAgID0gZWwgPT4gZWwucHJldmlvdXNFbGVtZW50U2libGluZ1xuZXhwb3J0IGNvbnN0IGNhbk1vdmVSaWdodCAgID0gZWwgPT4gZWwubmV4dEVsZW1lbnRTaWJsaW5nXG5leHBvcnQgY29uc3QgY2FuTW92ZURvd24gICAgPSBlbCA9PiBlbC5uZXh0RWxlbWVudFNpYmxpbmcgJiYgZWwubmV4dEVsZW1lbnRTaWJsaW5nLmNoaWxkcmVuLmxlbmd0aFxuZXhwb3J0IGNvbnN0IGNhbk1vdmVVbmRlciAgID0gZWwgPT4gIWVsLm5leHRFbGVtZW50U2libGluZyAmJiBlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuZXhwb3J0IGNvbnN0IGNhbk1vdmVVcCAgICAgID0gZWwgPT4gZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGVcblxuZXhwb3J0IGNvbnN0IHBvcE91dCA9ICh7ZWwsIHVuZGVyID0gZmFsc2V9KSA9PlxuICBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLCBcbiAgICBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUuY2hpbGRyZW5bXG4gICAgICB1bmRlclxuICAgICAgICA/IGdldE5vZGVJbmRleChlbCkgKyAxXG4gICAgICAgIDogZ2V0Tm9kZUluZGV4KGVsKV0pIFxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlRmVlZGJhY2soZWwpIHtcbiAgbGV0IG9wdGlvbnMgPSAnJ1xuICAvLyBnZXQgY3VycmVudCBlbGVtZW50cyBvZmZzZXQvc2l6ZVxuICBpZiAoY2FuTW92ZUxlZnQoZWwpKSAgb3B0aW9ucyArPSAn4oegJ1xuICBpZiAoY2FuTW92ZVJpZ2h0KGVsKSkgb3B0aW9ucyArPSAn4oeiJ1xuICBpZiAoY2FuTW92ZURvd24oZWwpKSAgb3B0aW9ucyArPSAn4oejJ1xuICBpZiAoY2FuTW92ZVVwKGVsKSkgICAgb3B0aW9ucyArPSAn4oehJ1xuICAvLyBjcmVhdGUvbW92ZSBhcnJvd3MgaW4gYWJzb2x1dGUvZml4ZWQgdG8gb3ZlcmxheSBlbGVtZW50XG4gIG9wdGlvbnMgJiYgY29uc29sZS5pbmZvKCclYycrb3B0aW9ucywgXCJmb250LXNpemU6IDJyZW07XCIpXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUgfSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5sZXQgaW1ncyAgICAgID0gW11cbiAgLCBvdmVybGF5cyAgPSBbXVxuICAsIGRyYWdJdGVtXG5cbmV4cG9ydCBmdW5jdGlvbiB3YXRjaEltYWdlc0ZvclVwbG9hZCgpIHtcbiAgaW1ncyA9ICQoW1xuICAgIC4uLmRvY3VtZW50LmltYWdlcyxcbiAgICAuLi4kKCdwaWN0dXJlJyksXG4gICAgLi4uZmluZEJhY2tncm91bmRJbWFnZXMoZG9jdW1lbnQpLFxuICBdKVxuXG4gIGNsZWFyV2F0Y2hlcnMoaW1ncylcbiAgaW5pdFdhdGNoZXJzKGltZ3MpXG59XG5cbmNvbnN0IGluaXRXYXRjaGVycyA9IGltZ3MgPT4ge1xuICBpbWdzLm9uKCdkcmFnb3ZlcicsIG9uRHJhZ0VudGVyKVxuICBpbWdzLm9uKCdkcmFnbGVhdmUnLCBvbkRyYWdMZWF2ZSlcbiAgaW1ncy5vbignZHJvcCcsIG9uRHJvcClcbiAgJChkb2N1bWVudC5ib2R5KS5vbignZHJhZ292ZXInLCBvbkRyYWdFbnRlcilcbiAgJChkb2N1bWVudC5ib2R5KS5vbignZHJhZ2xlYXZlJywgb25EcmFnTGVhdmUpXG4gICQoZG9jdW1lbnQuYm9keSkub24oJ2Ryb3AnLCBvbkRyb3ApXG4gICQoZG9jdW1lbnQuYm9keSkub24oJ2RyYWdzdGFydCcsIG9uRHJhZ1N0YXJ0KVxuICAkKGRvY3VtZW50LmJvZHkpLm9uKCdkcmFnZW5kJywgb25EcmFnRW5kKVxufVxuXG5jb25zdCBjbGVhcldhdGNoZXJzID0gaW1ncyA9PiB7XG4gIGltZ3Mub2ZmKCdkcmFnZW50ZXInLCBvbkRyYWdFbnRlcilcbiAgaW1ncy5vZmYoJ2RyYWdsZWF2ZScsIG9uRHJhZ0xlYXZlKVxuICBpbWdzLm9mZignZHJvcCcsIG9uRHJvcClcbiAgJChkb2N1bWVudC5ib2R5KS5vZmYoJ2RyYWdlbnRlcicsIG9uRHJhZ0VudGVyKVxuICAkKGRvY3VtZW50LmJvZHkpLm9mZignZHJhZ2xlYXZlJywgb25EcmFnTGVhdmUpXG4gICQoZG9jdW1lbnQuYm9keSkub2ZmKCdkcm9wJywgb25Ecm9wKVxuICAkKGRvY3VtZW50LmJvZHkpLm9uKCdkcmFnc3RhcnQnLCBvbkRyYWdTdGFydClcbiAgJChkb2N1bWVudC5ib2R5KS5vbignZHJhZ2VuZCcsIG9uRHJhZ0VuZClcbiAgaW1ncyA9IFtdXG59XG5cbmNvbnN0IHByZXZpZXdGaWxlID0gZmlsZSA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gIH0pXG59XG5cbi8vIG9ubHkgZmlyZWQgZm9yIGluLXBhZ2UgZHJhZyBldmVudHMsIHRyYWNrIHdoYXQgdGhlIHVzZXIgcGlja2VkIHVwXG5jb25zdCBvbkRyYWdTdGFydCA9ICh7dGFyZ2V0fSkgPT5cbiAgZHJhZ0l0ZW0gPSB0YXJnZXRcblxuY29uc3Qgb25EcmFnRW5kID0gZSA9PlxuICBkcmFnSXRlbSA9IHVuZGVmaW5lZFxuXG5jb25zdCBvbkRyYWdFbnRlciA9IGFzeW5jIGUgPT4ge1xuICBlLnByZXZlbnREZWZhdWx0KClcbiAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gIGNvbnN0IHByZV9zZWxlY3RlZCA9ICQoJ2ltZ1tkYXRhLXNlbGVjdGVkPXRydWVdLCBbZGF0YS1zZWxlY3RlZD10cnVlXSA+IGltZycpXG5cbiAgaWYgKGltZ3Muc29tZShpbWcgPT4gaW1nID09PSBlLnRhcmdldCkpIHtcbiAgICBpZiAoIXByZV9zZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgIGlmICghaXNGaWxlRXZlbnQoZSkpXG4gICAgICAgIHByZXZpZXdEcm9wKGUudGFyZ2V0KVxuXG4gICAgICBzaG93T3ZlcmxheShlLmN1cnJlbnRUYXJnZXQsIDApXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHByZV9zZWxlY3RlZC5zb21lKG5vZGUgPT4gbm9kZSA9PSBlLnRhcmdldCkgJiYgIWlzRmlsZUV2ZW50KGUpKVxuICAgICAgICBwcmVfc2VsZWN0ZWQuZm9yRWFjaChub2RlID0+XG4gICAgICAgICAgcHJldmlld0Ryb3Aobm9kZSkpXG5cbiAgICAgIHByZV9zZWxlY3RlZC5mb3JFYWNoKChpbWcsIGkpID0+XG4gICAgICAgIHNob3dPdmVybGF5KGltZywgaSkpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IG9uRHJhZ0xlYXZlID0gZSA9PiB7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgY29uc3QgcHJlX3NlbGVjdGVkID0gJCgnaW1nW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0sIFtkYXRhLXNlbGVjdGVkPXRydWVdID4gaW1nJylcblxuICBpZiAoIXByZV9zZWxlY3RlZC5zb21lKG5vZGUgPT4gbm9kZSA9PT0gZS50YXJnZXQpKVxuICAgIHJlc2V0UHJldmlld2VkKGUudGFyZ2V0KVxuICBlbHNlXG4gICAgcHJlX3NlbGVjdGVkLmZvckVhY2gobm9kZSA9PiByZXNldFByZXZpZXdlZChub2RlKSlcblxuICBoaWRlT3ZlcmxheXMoKVxufVxuXG5jb25zdCBvbkRyb3AgPSBhc3luYyBlID0+IHtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICBlLnByZXZlbnREZWZhdWx0KClcblxuICBjb25zdCBzcmNzID0gYXdhaXQgZ2V0VHJhbnNmZXJEYXRhKGRyYWdJdGVtLCBlKVxuXG4gIGlmIChzcmNzLmxlbmd0aCkge1xuICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2VzID0gJCgnaW1nW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0sIFtkYXRhLXNlbGVjdGVkPXRydWVdID4gaW1nJylcbiAgICBjb25zdCB0YXJnZXRJbWFnZXMgICA9IGdldFRhcmdldENvbnRlbnRJbWFnZXMoc2VsZWN0ZWRJbWFnZXMsIGUpXG5cbiAgICBpZiAodGFyZ2V0SW1hZ2VzLmxlbmd0aCkge1xuICAgICAgdXBkYXRlQ29udGVudEltYWdlcyh0YXJnZXRJbWFnZXMsIHNyY3MpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgYmdJbWFnZXMgPSBnZXRUYXJnZXRCYWNrZ3JvdW5kSW1hZ2VzKGltZ3MsIGUpXG4gICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2VzKGJnSW1hZ2VzLCBzcmNzWzBdKVxuICAgIH1cbiAgfVxuXG4gIGhpZGVPdmVybGF5cygpXG59XG5cbmNvbnN0IGdldFRyYW5zZmVyRGF0YSA9IGFzeW5jIChkcmFnSXRlbSwgZSkgPT4ge1xuICBpZiAoZHJhZ0l0ZW0pXG4gICAgcmV0dXJuIFtkcmFnSXRlbS5jdXJyZW50U3JjXVxuXG4gIHJldHVybiBlLmRhdGFUcmFuc2Zlci5maWxlcy5sZW5ndGhcbiAgPyBhd2FpdCBQcm9taXNlLmFsbChbLi4uZS5kYXRhVHJhbnNmZXIuZmlsZXNdXG4gICAgLmZpbHRlcihmaWxlID0+IGZpbGUudHlwZS5pbmNsdWRlcygnaW1hZ2UnKSlcbiAgICAubWFwKHByZXZpZXdGaWxlKSlcbiAgICA6IFtdXG59XG5cbmNvbnN0IGdldFRhcmdldENvbnRlbnRJbWFnZXMgPSAoc2VsZWN0ZWQsIGUpID0+XG4gIHNlbGVjdGVkLmxlbmd0aCA/IHNlbGVjdGVkXG4gICAgOiBlLnRhcmdldC5ub2RlTmFtZSA9PT0gJ0lNRycgJiYgIXNlbGVjdGVkLmxlbmd0aCA/IFtlLnRhcmdldF1cbiAgICA6IFtdXG5cbmNvbnN0IHVwZGF0ZUNvbnRlbnRJbWFnZXMgPSAoaW1hZ2VzLCBzcmNzKSA9PiB7XG4gIGxldCBpID0gMFxuICBpbWFnZXMuZm9yRWFjaChpbWcgPT4ge1xuICAgIGNsZWFyRHJhZ0hpc3RvcnkoaW1nKVxuICAgIHVwZGF0ZUNvbnRlbnRJbWFnZShpbWcsIHNyY3NbaV0pXG4gICAgaSA9ICsraSAlIHNyY3MubGVuZ3RoXG4gIH0pXG59XG5cbmNvbnN0IHVwZGF0ZUNvbnRlbnRJbWFnZSA9IChpbWcsIHNyYykgPT4ge1xuICBpbWcuc3JjID0gc3JjXG4gIGlmIChpbWcuc3Jjc2V0ICE9PSAnJylcbiAgICBpbWcuc3Jjc2V0ID0gc3JjXG5cbiAgY29uc3Qgc291cmNlcyA9IGdldFBpY3R1cmVTb3VyY2VzVG9VcGRhdGUoaW1nKVxuXG4gIGlmIChzb3VyY2VzLmxlbmd0aClcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+XG4gICAgICBzb3VyY2Uuc3Jjc2V0ID0gc3JjKVxufVxuXG5jb25zdCBnZXRUYXJnZXRCYWNrZ3JvdW5kSW1hZ2VzID0gKGltYWdlcywgZSkgPT5cbiAgaW1hZ2VzLmZpbHRlcihpbWcgPT5cbiAgICBpbWcuY29udGFpbnMoZS50YXJnZXQpKVxuXG5jb25zdCB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2VzID0gKGltYWdlcywgc3JjKSA9PlxuICBpbWFnZXMuZm9yRWFjaChpbWcgPT4ge1xuICAgIGNsZWFyRHJhZ0hpc3RvcnkoaW1nKVxuICAgIGlmICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShpbWcpLmJhY2tncm91bmRJbWFnZSAhPSAnbm9uZScpXG4gICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke3NyY30pYFxuICB9KVxuXG5jb25zdCBnZXRQaWN0dXJlU291cmNlc1RvVXBkYXRlID0gaW1nID0+XG4gIEFycmF5LmZyb20oaW1nLnBhcmVudEVsZW1lbnQuY2hpbGRyZW4pXG4gICAgLmZpbHRlcihzaWJsaW5nID0+XG4gICAgICBzaWJsaW5nLm5vZGVOYW1lID09PSAnU09VUkNFJylcbiAgICAuZmlsdGVyKHNvdXJjZSA9PlxuICAgICAgIXNvdXJjZS5tZWRpYSB8fCB3aW5kb3cubWF0Y2hNZWRpYShzb3VyY2UubWVkaWEpLm1hdGNoZXMpXG5cbmNvbnN0IHNob3dPdmVybGF5ID0gKG5vZGUsIGkpID0+IHtcbiAgY29uc3QgcmVjdCAgICA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qgb3ZlcmxheSA9IG92ZXJsYXlzW2ldXG5cbiAgaWYgKG92ZXJsYXkpIHtcbiAgICBvdmVybGF5LnVwZGF0ZSA9IHJlY3RcbiAgfVxuICBlbHNlIHtcbiAgICBvdmVybGF5c1tpXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Zpc2J1Zy1vdmVybGF5JylcbiAgICBvdmVybGF5c1tpXS5wb3NpdGlvbiA9IHJlY3RcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXlzW2ldKVxuICB9XG59XG5cbmNvbnN0IGhpZGVPdmVybGF5cyA9ICgpID0+IHtcbiAgb3ZlcmxheXMuZm9yRWFjaChvdmVybGF5ID0+XG4gICAgb3ZlcmxheS5yZW1vdmUoKSlcbiAgb3ZlcmxheXMgPSBbXVxufVxuXG5jb25zdCBmaW5kQmFja2dyb3VuZEltYWdlcyA9IGVsID0+IHtcbiAgY29uc3Qgc3JjX3JlZ2V4ID0gL3VybFxcKFxccyo/WydcIl0/XFxzKj8oXFxTKz8pXFxzKj9bXCInXT9cXHMqP1xcKS9pXG5cbiAgcmV0dXJuICQoJyonKS5yZWR1Y2UoKGNvbGxlY3Rpb24sIG5vZGUpID0+IHtcbiAgICBjb25zdCBwcm9wID0gZ2V0U3R5bGUobm9kZSwgJ2JhY2tncm91bmQtaW1hZ2UnKVxuICAgIGNvbnN0IG1hdGNoID0gc3JjX3JlZ2V4LmV4ZWMocHJvcClcblxuICAgIC8vIGlmIChtYXRjaCkgY29sbGVjdGlvbi5wdXNoKG1hdGNoWzFdKVxuICAgIGlmIChtYXRjaCkgY29sbGVjdGlvbi5wdXNoKG5vZGUpXG5cbiAgICByZXR1cm4gY29sbGVjdGlvblxuICB9LCBbXSlcbn1cblxuY29uc3QgcHJldmlld0Ryb3AgPSBhc3luYyAobm9kZSkgPT4ge1xuICBpZiAoIVsnbGFzdFNyYycsJ2xhc3RTcmNzZXQnLCdsYXN0U2libGluZ3MnLCdsYXN0QmFja2dyb3VuZEltYWdlJ10uc29tZShwcm9wID0+IG5vZGVbcHJvcF0pKXtcbiAgICBjb25zdCBzZXRTcmMgPSBkcmFnSXRlbS5jdXJyZW50U3JjXG4gICAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpLmJhY2tncm91bmRJbWFnZSAhPT0gJ25vbmUnKXtcbiAgICAgIG5vZGUubGFzdEJhY2tncm91bmRJbWFnZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpLmJhY2tncm91bmRJbWFnZVxuICAgICAgbm9kZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7c2V0U3JjfSlgXG4gICAgfWVsc2V7XG4gICAgICBjYWNoZUltYWdlU3RhdGUobm9kZSlcbiAgICAgIHVwZGF0ZUNvbnRlbnRJbWFnZShub2RlLCBzZXRTcmMpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGNhY2hlSW1hZ2VTdGF0ZSA9IGltYWdlID0+IHtcbiAgaW1hZ2UubGFzdFNyYyAgICA9IGltYWdlLnNyY1xuICBpbWFnZS5sYXN0U3Jjc2V0ID0gaW1hZ2Uuc3Jjc2V0XG5cbiAgY29uc3Qgc2liU291cmNlICA9IGdldFBpY3R1cmVTb3VyY2VzVG9VcGRhdGUoaW1hZ2UpXG5cbiAgaWYgKHNpYlNvdXJjZS5sZW5ndGgpIHtcbiAgICBzaWJTb3VyY2UuZm9yRWFjaChzaWIgPT4ge1xuICAgICAgc2liLmxhc3RTcmNzZXQgPSBzaWIuc3Jjc2V0XG4gICAgICBzaWIubGFzdFNyYyA9IHNpYi5zcmNcbiAgICB9KVxuICB9XG59XG5cbmNvbnN0IHJlc2V0UHJldmlld2VkID0gbm9kZSA9PiB7XG4gIGlmIChub2RlLmxhc3RTcmMpXG4gICAgbm9kZS5zcmMgPSBub2RlLmxhc3RTcmNcblxuICBpZiAobm9kZS5sYXN0U3Jjc2V0KVxuICAgIG5vZGUuc3Jjc2V0ID0gbm9kZS5sYXN0U3Jjc2V0XG5cbiAgY29uc3Qgc291cmNlcyA9IGdldFBpY3R1cmVTb3VyY2VzVG9VcGRhdGUobm9kZSlcbiAgaWYgKHNvdXJjZXMubGVuZ3RoKVxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xuICAgICAgaWYgKHNvdXJjZS5sYXN0U3Jjc2V0KVxuICAgICAgICBzb3VyY2Uuc3Jjc2V0ID0gc291cmNlLmxhc3RTcmNzZXRcbiAgICAgIGlmIChzb3VyY2UubGFzdFNyYylcbiAgICAgICAgc291cmNlLnNyYyA9IHNvdXJjZS5sYXN0U3JjXG4gICAgfSlcblxuICBpZiAobm9kZS5sYXN0QmFja2dyb3VuZEltYWdlKVxuICAgIG5vZGUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gbm9kZS5sYXN0QmFja2dyb3VuZEltYWdlXG5cbiAgY2xlYXJEcmFnSGlzdG9yeShub2RlKVxufVxuXG5jb25zdCBjbGVhckRyYWdIaXN0b3J5ID0gbm9kZSA9PiB7XG4gIFsnbGFzdFNyYycsJ2xhc3RTcmNzZXQnLCdsYXN0QmFja2dyb3VuZEltYWdlJ10uZm9yRWFjaChwcm9wID0+XG4gICAgbm9kZVtwcm9wXSA9IG51bGwpXG5cbiAgc291cmNlcyA9IGdldFBpY3R1cmVTb3VyY2VzVG9VcGRhdGUobm9kZSlcblxuICBpZiAoc291cmNlcyl7XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICBzb3VyY2UubGFzdFNyY3NldCA9IG51bGxcbiAgICAgIHNvdXJjZS5sYXN0U3JjID0gbnVsbFxuICAgIH0pXG4gIH1cbn1cblxuY29uc3QgaXNGaWxlRXZlbnQgPSBlID0+XG4gIGUuZGF0YVRyYW5zZmVyLnR5cGVzLnNvbWUodHlwZSA9PiB0eXBlID09PSAnRmlsZXMnKVxuIiwiLyoqXHJcbiAqIEBhdXRob3IgR2VvcmdlZ3JpZmZAIChHZW9yZ2UgR3JpZmZpdGhzKVxyXG4gKiBMaWNlbnNlIEFwYWNoZS0yLjBcclxuICovXHJcblxyXG4vKipcclxuKiBGaW5kcyBmaXJzdCBtYXRjaGluZyBlbGVtZW50cyBvbiB0aGUgcGFnZSB0aGF0IG1heSBiZSBpbiBhIHNoYWRvdyByb290IHVzaW5nIGEgY29tcGxleCBzZWxlY3RvciBvZiBuLWRlcHRoXHJcbipcclxuKiBEb24ndCBoYXZlIHRvIHNwZWNpZnkgYWxsIHNoYWRvdyByb290cyB0byBidXR0b24sIHRyZWUgaXMgdHJhdmVyZWQgdG8gZmluZCB0aGUgY29ycmVjdCBlbGVtZW50XHJcbipcclxuKiBFeGFtcGxlIHF1ZXJ5U2VsZWN0b3JBbGxEZWVwKCdkb3dubG9hZHMtaXRlbTpudGgtY2hpbGQoNCkgI3JlbW92ZScpO1xyXG4qXHJcbiogRXhhbXBsZSBzaG91bGQgd29yayBvbiBjaHJvbWU6Ly9kb3dubG9hZHMgb3V0cHV0dGluZyB0aGUgcmVtb3ZlIGJ1dHRvbiBpbnNpZGUgb2YgYSBkb3dubG9hZCBjYXJkIGNvbXBvbmVudFxyXG4qXHJcbiogRXhhbXBsZSBmaW5kIGZpcnN0IGFjdGl2ZSBkb3dubG9hZCBsaW5rIGVsZW1lbnQgcXVlcnlTZWxlY3RvckRlZXAoJyNkb3dubG9hZHMtbGlzdCAuaXMtYWN0aXZlIGFbaHJlZl49XCJodHRwczovL1wiXScpO1xyXG4qXHJcbiogQW5vdGhlciBleGFtcGxlIHF1ZXJ5U2VsZWN0b3JBbGxEZWVwKCcjZG93bmxvYWRzLWxpc3QgZGl2I3RpdGxlLWFyZWEgKyBhJyk7XHJcbmUuZy5cclxuKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3JBbGxEZWVwKHNlbGVjdG9yLCByb290ID0gZG9jdW1lbnQpIHtcclxuICAgIHJldHVybiBfcXVlcnlTZWxlY3RvckRlZXAoc2VsZWN0b3IsIHRydWUsIHJvb3QpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlTZWxlY3RvckRlZXAoc2VsZWN0b3IsIHJvb3QgPSBkb2N1bWVudCkge1xyXG4gICAgcmV0dXJuIF9xdWVyeVNlbGVjdG9yRGVlcChzZWxlY3RvciwgZmFsc2UsIHJvb3QpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfcXVlcnlTZWxlY3RvckRlZXAoc2VsZWN0b3IsIGZpbmRNYW55LCByb290KSB7XHJcbiAgICBsZXQgbGlnaHRFbGVtZW50ID0gcm9vdC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHJcbiAgICBpZiAoZG9jdW1lbnQuaGVhZC5jcmVhdGVTaGFkb3dSb290IHx8IGRvY3VtZW50LmhlYWQuYXR0YWNoU2hhZG93KSB7XHJcbiAgICAgICAgLy8gbm8gbmVlZCB0byBkbyBhbnkgc3BlY2lhbCBpZiBzZWxlY3RvciBtYXRjaGVzIHNvbWV0aGluZyBzcGVjaWZpYyBpbiBsaWdodC1kb21cclxuICAgICAgICBpZiAoIWZpbmRNYW55ICYmIGxpZ2h0RWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbGlnaHRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc3BsaXQgb24gY29tbWFzIGJlY2F1c2UgdGhvc2UgYXJlIGEgbG9naWNhbCBkaXZpZGUgaW4gdGhlIG9wZXJhdGlvblxyXG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbnNUb01ha2UgPSBzcGxpdEJ5Q2hhcmFjdGVyVW5sZXNzUXVvdGVkKHNlbGVjdG9yLCAnLCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VsZWN0aW9uc1RvTWFrZS5yZWR1Y2UoKGFjYywgbWluaW1hbFNlbGVjdG9yKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGlmIG5vdCBmaW5kaW5nIG1hbnkganVzdCByZWR1Y2UgdGhlIGZpcnN0IG1hdGNoXHJcbiAgICAgICAgICAgIGlmICghZmluZE1hbnkgJiYgYWNjKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGRvIGJlc3QgdG8gc3VwcG9ydCBjb21wbGV4IHNlbGVjdG9ycyBhbmQgc3BsaXQgdGhlIHF1ZXJ5XHJcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0U2VsZWN0b3IgPSBzcGxpdEJ5Q2hhcmFjdGVyVW5sZXNzUXVvdGVkKG1pbmltYWxTZWxlY3RvclxyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVtb3ZlIHdoaXRlIHNwYWNlIGF0IHN0YXJ0IG9mIHNlbGVjdG9yXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL15cXHMrL2csICcnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMqKFs+K35dKylcXHMqL2csICckMScpLCAnICcpXHJcbiAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGVudHJ5IHdoaXRlIHNlbGVjdG9yc1xyXG4gICAgICAgICAgICAgICAgLmZpbHRlcigoZW50cnkpID0+ICEhZW50cnkpO1xyXG4gICAgICAgICAgICBjb25zdCBwb3NzaWJsZUVsZW1lbnRzSW5kZXggPSBzcGxpdFNlbGVjdG9yLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIGNvbnN0IHBvc3NpYmxlRWxlbWVudHMgPSBjb2xsZWN0QWxsRWxlbWVudHNEZWVwKHNwbGl0U2VsZWN0b3JbcG9zc2libGVFbGVtZW50c0luZGV4XSwgcm9vdCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmRFbGVtZW50cyA9IGZpbmRNYXRjaGluZ0VsZW1lbnQoc3BsaXRTZWxlY3RvciwgcG9zc2libGVFbGVtZW50c0luZGV4LCByb290KTtcclxuICAgICAgICAgICAgaWYgKGZpbmRNYW55KSB7XHJcbiAgICAgICAgICAgICAgICBhY2MgPSBhY2MuY29uY2F0KHBvc3NpYmxlRWxlbWVudHMuZmlsdGVyKGZpbmRFbGVtZW50cykpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFjYyA9IHBvc3NpYmxlRWxlbWVudHMuZmluZChmaW5kRWxlbWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYyB8fCBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZmluZE1hbnkgPyBbXSA6IG51bGwpO1xyXG5cclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghZmluZE1hbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpZ2h0RWxlbWVudDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdFbGVtZW50KHNwbGl0U2VsZWN0b3IsIHBvc3NpYmxlRWxlbWVudHNJbmRleCwgcm9vdCkge1xyXG4gICAgcmV0dXJuIChlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gcG9zc2libGVFbGVtZW50c0luZGV4O1xyXG4gICAgICAgIGxldCBwYXJlbnQgPSBlbGVtZW50O1xyXG4gICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBmYWxzZTtcclxuICAgICAgICB3aGlsZSAocGFyZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kTWF0Y2ggPSBwYXJlbnQubWF0Y2hlcyhzcGxpdFNlbGVjdG9yW3Bvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoICYmIHBvc2l0aW9uID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcGFyZW50ID0gZmluZFBhcmVudE9ySG9zdChwYXJlbnQsIHJvb3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZm91bmRFbGVtZW50O1xyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNwbGl0QnlDaGFyYWN0ZXJVbmxlc3NRdW90ZWQoc2VsZWN0b3IsIGNoYXJhY3Rlcikge1xyXG4gICAgcmV0dXJuIHNlbGVjdG9yLm1hdGNoKC9cXFxcPy58XiQvZykucmVkdWNlKChwLCBjKSA9PiB7XHJcbiAgICAgICAgaWYgKGMgPT09ICdcIicgJiYgIXAuc1F1b3RlKSB7XHJcbiAgICAgICAgICAgIHAucXVvdGUgXj0gMTtcclxuICAgICAgICAgICAgcC5hW3AuYS5sZW5ndGggLSAxXSArPSBjO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJ1xcJycgJiYgIXAucXVvdGUpIHtcclxuICAgICAgICAgICAgcC5zUXVvdGUgXj0gMTtcclxuICAgICAgICAgICAgcC5hW3AuYS5sZW5ndGggLSAxXSArPSBjO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKCFwLnF1b3RlICYmICFwLnNRdW90ZSAmJiBjID09PSBjaGFyYWN0ZXIpIHtcclxuICAgICAgICAgICAgcC5hLnB1c2goJycpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHAuYVtwLmEubGVuZ3RoIC0gMV0gKz0gYztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHA7XHJcbiAgICB9LCB7IGE6IFsnJ10gfSkuYTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGZpbmRQYXJlbnRPckhvc3QoZWxlbWVudCwgcm9vdCkge1xyXG4gICAgY29uc3QgcGFyZW50Tm9kZSA9IGVsZW1lbnQucGFyZW50Tm9kZTtcclxuICAgIHJldHVybiAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLmhvc3QgJiYgcGFyZW50Tm9kZS5ub2RlVHlwZSA9PT0gMTEpID8gcGFyZW50Tm9kZS5ob3N0IDogcGFyZW50Tm9kZSA9PT0gcm9vdCA/IG51bGwgOiBwYXJlbnROb2RlO1xyXG59XHJcblxyXG4vKipcclxuICogRmluZHMgYWxsIGVsZW1lbnRzIG9uIHRoZSBwYWdlLCBpbmNsdXNpdmUgb2YgdGhvc2Ugd2l0aGluIHNoYWRvdyByb290cy5cclxuICogQHBhcmFtIHtzdHJpbmc9fSBzZWxlY3RvciBTaW1wbGUgc2VsZWN0b3IgdG8gZmlsdGVyIHRoZSBlbGVtZW50cyBieS4gZS5nLiAnYScsICdkaXYubWFpbidcclxuICogQHJldHVybiB7IUFycmF5PHN0cmluZz59IExpc3Qgb2YgYW5jaG9yIGhyZWZzLlxyXG4gKiBAYXV0aG9yIGViaWRlbEAgKEVyaWMgQmlkZWxtYW4pXHJcbiAqIExpY2Vuc2UgQXBhY2hlLTIuMFxyXG4gKi9cclxuZnVuY3Rpb24gY29sbGVjdEFsbEVsZW1lbnRzRGVlcChzZWxlY3RvciA9IG51bGwsIHJvb3QpIHtcclxuICAgIGNvbnN0IGFsbEVsZW1lbnRzID0gW107XHJcblxyXG4gICAgY29uc3QgZmluZEFsbEVsZW1lbnRzID0gZnVuY3Rpb24obm9kZXMpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMCwgZWw7IGVsID0gbm9kZXNbaV07ICsraSkge1xyXG4gICAgICAgICAgICBhbGxFbGVtZW50cy5wdXNoKGVsKTtcclxuICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGEgc2hhZG93IHJvb3QsIGRpZyBkZWVwZXIuXHJcbiAgICAgICAgICAgIGlmIChlbC5zaGFkb3dSb290KSB7XHJcbiAgICAgICAgICAgICAgICBmaW5kQWxsRWxlbWVudHMoZWwuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKCcqJykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIGlmKHJvb3Quc2hhZG93Um9vdCkge1xyXG4gICAgICAgIGZpbmRBbGxFbGVtZW50cyhyb290LnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvckFsbCgnKicpKTtcclxuICAgIH1cclxuICAgIGZpbmRBbGxFbGVtZW50cyhyb290LnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSk7XHJcblxyXG4gICAgcmV0dXJuIHNlbGVjdG9yID8gYWxsRWxlbWVudHMuZmlsdGVyKGVsID0+IGVsLm1hdGNoZXMoc2VsZWN0b3IpKSA6IGFsbEVsZW1lbnRzO1xyXG59IiwiZXhwb3J0IGNvbnN0IGNvbW1hbmRzID0gW1xuICAnZW1wdHkgcGFnZScsXG4gICdibGFuayBwYWdlJyxcbiAgJ2NsZWFyIGNhbnZhcycsXG5dXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICBkb2N1bWVudFxuICAgIC5xdWVyeVNlbGVjdG9yQWxsKCdib2R5ID4gKjpub3QodmlzLWJ1Zyk6bm90KHNjcmlwdCknKVxuICAgIC5mb3JFYWNoKG5vZGUgPT4gbm9kZS5yZW1vdmUoKSlcbn1cbiIsImV4cG9ydCBjb25zdCBjb21tYW5kcyA9IFtcbiAgJ2JhcnJlbCByb2xsJyxcbiAgJ2RvIGEgYmFycmVsIHJvbGwnLFxuXVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbigpIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnY2VudGVyIDUwdmgnXG4gIFxuICBhd2FpdCBkb2N1bWVudC5ib2R5LmFuaW1hdGUoW1xuICAgIHsgdHJhbnNmb3JtOiAncm90YXRlWigwKScgfSxcbiAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVooMXR1cm4pJyB9LFxuICBdLCB7IGR1cmF0aW9uOiAxNTAwIH0pLmZpbmlzaGVkXG5cbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnJ1xufSIsImltcG9ydCB7IGxvYWRTdHlsZXMgfSBmcm9tICcuLi91dGlsaXRpZXMvc3R5bGVzLmpzJ1xuXG5leHBvcnQgY29uc3QgY29tbWFuZHMgPSBbXG4gICdwZXN0aWNpZGUnLFxuXVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbigpIHtcbiAgYXdhaXQgbG9hZFN0eWxlcyhbJ2h0dHBzOi8vdW5wa2cuY29tL3Blc3RpY2lkZUAxLjMuMS9jc3MvcGVzdGljaWRlLm1pbi5jc3MnXSlcbn0iLCJpbXBvcnQgeyBsb2FkU3R5bGVzIH0gZnJvbSAnLi4vdXRpbGl0aWVzL3N0eWxlcy5qcydcblxuZXhwb3J0IGNvbnN0IGNvbW1hbmRzID0gW1xuICAndHJhc2h5JyxcbiAgJ2NvbnN0cnVjdCcsXG5dXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBhd2FpdCBsb2FkU3R5bGVzKFsnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3Q3L2NvbnN0cnVjdC5jc3NAbWFzdGVyL2Nzcy9jb25zdHJ1Y3QuYm94ZXMuY3NzJ10pXG59IiwiaW1wb3J0IHsgbG9hZFN0eWxlcyB9IGZyb20gJy4uL3V0aWxpdGllcy9zdHlsZXMuanMnXG5cbmV4cG9ydCBjb25zdCBjb21tYW5kcyA9IFtcbiAgJ2RlYnVnIHRyYXNoeScsXG4gICdkZWJ1ZyBjb25zdHJ1Y3QnLFxuXVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbigpIHtcbiAgYXdhaXQgbG9hZFN0eWxlcyhbJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9naC90Ny9jb25zdHJ1Y3QuY3NzQG1hc3Rlci9jc3MvY29uc3RydWN0LmRlYnVnLmNzcyddKVxufSIsImV4cG9ydCBjb25zdCBjb21tYW5kcyA9IFtcbiAgJ3dpcmVmcmFtZScsXG4gICdibHVlcHJpbnQnLFxuXVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbigpIHtcbiAgY29uc3Qgc3R5bGVzID0gYFxuICAgICo6bm90KHBhdGgpOm5vdChnKSB7XG4gICAgICBjb2xvcjogaHNsYSgyMTAsIDEwMCUsIDEwMCUsIDAuOSkgIWltcG9ydGFudDtcbiAgICAgIGJhY2tncm91bmQ6IGhzbGEoMjEwLCAxMDAlLCA1MCUsIDAuNSkgIWltcG9ydGFudDtcbiAgICAgIG91dGxpbmU6IHNvbGlkIDAuMjVyZW0gaHNsYSgyMTAsIDEwMCUsIDEwMCUsIDAuNSkgIWltcG9ydGFudDtcbiAgICAgIGJveC1zaGFkb3c6IG5vbmUgIWltcG9ydGFudDtcbiAgICB9XG4gIGBcblxuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBzdHlsZXNcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbn0iLCJleHBvcnQgY29uc3QgY29tbWFuZHMgPSBbXG4gICdza2VsZXRvbicsXG4gICdvdXRsaW5lJyxcbl1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHN0eWxlcyA9IGBcbiAgICAqOm5vdChwYXRoKTpub3QoZykge1xuICAgICAgY29sb3I6IGhzbCgwLCAwJSwgMCUpICFpbXBvcnRhbnQ7XG4gICAgICB0ZXh0LXNoYWRvdzogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgYmFja2dyb3VuZDogaHNsKDAsIDAlLCAxMDAlKSAhaW1wb3J0YW50O1xuICAgICAgb3V0bGluZTogMXB4IHNvbGlkIGhzbGEoMCwgMCUsIDAlLCAwLjUpICFpbXBvcnRhbnQ7XG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7XG4gICAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG4gICAgfVxuICBgXG5cbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gIHN0eWxlLnRleHRDb250ZW50ID0gc3R5bGVzXG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpXG59IiwiLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vYWRkeW9zbWFuaS9mZDM5OTllYTdmY2UyNDI3NTZiMVxuZXhwb3J0IGNvbnN0IGNvbW1hbmRzID0gW1xuICAndGFnIGRlYnVnZ2VyJyxcbiAgJ29zbWFuaScsXG5dXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBmb3IgKGkgPSAwOyBBID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnKicpW2krK107KVxuICAgIEEuc3R5bGUub3V0bGluZSA9IGBzb2xpZCBoc2woJHsoQStBKS5sZW5ndGgqOX0sOTklLDUwJSkgMXB4YFxufSIsIi8vIGh0dHA6Ly9oZXlkb253b3Jrcy5jb20vcmV2ZW5nZV9jc3NfYm9va21hcmtsZXQvXG5cbmltcG9ydCB7IGxvYWRTdHlsZXMgfSBmcm9tICcuLi91dGlsaXRpZXMvc3R5bGVzLmpzJ1xuXG5leHBvcnQgY29uc3QgY29tbWFuZHMgPSBbXG4gICdyZXZlbmdlJyxcbiAgJ3JldmVuZ2UuY3NzJyxcbiAgJ2hleWRvbicsXG5dXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBhd2FpdCBsb2FkU3R5bGVzKFsnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL0hleWRvbi9SRVZFTkdFLkNTU0BtYXN0ZXIvcmV2ZW5nZS5jc3MnXSlcbn0iLCJleHBvcnQgY29uc3QgY29tbWFuZHMgPSBbXG4gICd0b3RhMTF5Jyxcbl1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24oKSB7XG4gIGF3YWl0IGltcG9ydCgnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvdG90YTExeS8wLjEuNi90b3RhMTF5Lm1pbi5qcycpXG59XG4iLCJpbXBvcnQgeyBjb21tYW5kcyBhcyBibGFua19wYWdlX2NvbW1hbmRzLCBkZWZhdWx0IGFzIEJsYW5rUGFnZVBsdWdpbiB9IGZyb20gJy4vYmxhbmstcGFnZSdcbmltcG9ydCB7IGNvbW1hbmRzIGFzIGJhcnJlbF9yb2xsX2NvbW1hbmRzLCBkZWZhdWx0IGFzIEJhcnJlbFJvbGxQbHVnaW4gfSBmcm9tICcuL2JhcnJlbC1yb2xsJ1xuaW1wb3J0IHsgY29tbWFuZHMgYXMgcGVzdGljaWRlX2NvbW1hbmRzLCBkZWZhdWx0IGFzIFBlc3RpY2lkZVBsdWdpbiB9IGZyb20gJy4vcGVzdGljaWRlJ1xuaW1wb3J0IHsgY29tbWFuZHMgYXMgY29uc3RydWN0X2NvbW1hbmRzLCBkZWZhdWx0IGFzIENvbnN0cnVjdFBsdWdpbiB9IGZyb20gJy4vY29uc3RydWN0J1xuaW1wb3J0IHsgY29tbWFuZHMgYXMgY29uc3RydWN0X2RlYnVnX2NvbW1hbmRzLCBkZWZhdWx0IGFzIENvbnN0cnVjdERlYnVnUGx1Z2luIH0gZnJvbSAnLi9jb25zdHJ1Y3QuZGVidWcnXG5pbXBvcnQgeyBjb21tYW5kcyBhcyB3aXJlZnJhbWVfY29tbWFuZHMsIGRlZmF1bHQgYXMgV2lyZWZyYW1lUGx1Z2luIH0gZnJvbSAnLi93aXJlZnJhbWUnXG5pbXBvcnQgeyBjb21tYW5kcyBhcyBza2VsZXRvbl9jb21tYW5kcywgZGVmYXVsdCBhcyBTa2VsZXRvblBsdWdpbiB9IGZyb20gJy4vc2tlbGV0b24nXG5pbXBvcnQgeyBjb21tYW5kcyBhcyB0YWdfZGVidWdnZXJfY29tbWFuZHMsIGRlZmF1bHQgYXMgVGFnRGVidWdnZXJQbHVnaW4gfSBmcm9tICcuL3RhZy1kZWJ1Z2dlcidcbmltcG9ydCB7IGNvbW1hbmRzIGFzIHJldmVuZ2VfY29tbWFuZHMsIGRlZmF1bHQgYXMgUmV2ZW5nZVBsdWdpbiB9IGZyb20gJy4vcmV2ZW5nZSdcbmltcG9ydCB7IGNvbW1hbmRzIGFzIHRvdGExMXlfY29tbWFuZHMsIGRlZmF1bHQgYXMgVG90YTExeVBsdWdpbiB9IGZyb20gJy4vdG90YTExeSdcblxuY29uc3QgY29tbWFuZHNUb0hhc2ggPSAocGx1Z2luX2NvbW1hbmRzLCBwbHVnaW5fZm4pID0+XG4gIHBsdWdpbl9jb21tYW5kcy5yZWR1Y2UoKGNvbW1hbmRzLCBjb21tYW5kKSA9PlxuICAgIE9iamVjdC5hc3NpZ24oY29tbWFuZHMsIHtbYC8ke2NvbW1hbmR9YF06cGx1Z2luX2ZufSlcbiAgLCB7fSlcblxuZXhwb3J0IGNvbnN0IFBsdWdpblJlZ2lzdHJ5ID0gbmV3IE1hcChPYmplY3QuZW50cmllcyh7XG4gIC4uLmNvbW1hbmRzVG9IYXNoKGJsYW5rX3BhZ2VfY29tbWFuZHMsIEJsYW5rUGFnZVBsdWdpbiksXG4gIC4uLmNvbW1hbmRzVG9IYXNoKGJhcnJlbF9yb2xsX2NvbW1hbmRzLCBCYXJyZWxSb2xsUGx1Z2luKSxcbiAgLi4uY29tbWFuZHNUb0hhc2gocGVzdGljaWRlX2NvbW1hbmRzLCBQZXN0aWNpZGVQbHVnaW4pLFxuICAuLi5jb21tYW5kc1RvSGFzaChjb25zdHJ1Y3RfY29tbWFuZHMsIENvbnN0cnVjdFBsdWdpbiksXG4gIC4uLmNvbW1hbmRzVG9IYXNoKGNvbnN0cnVjdF9kZWJ1Z19jb21tYW5kcywgQ29uc3RydWN0RGVidWdQbHVnaW4pLFxuICAuLi5jb21tYW5kc1RvSGFzaCh3aXJlZnJhbWVfY29tbWFuZHMsIFdpcmVmcmFtZVBsdWdpbiksXG4gIC4uLmNvbW1hbmRzVG9IYXNoKHNrZWxldG9uX2NvbW1hbmRzLCBTa2VsZXRvblBsdWdpbiksXG4gIC4uLmNvbW1hbmRzVG9IYXNoKHRhZ19kZWJ1Z2dlcl9jb21tYW5kcywgVGFnRGVidWdnZXJQbHVnaW4pLFxuICAuLi5jb21tYW5kc1RvSGFzaChyZXZlbmdlX2NvbW1hbmRzLCBSZXZlbmdlUGx1Z2luKSxcbiAgLi4uY29tbWFuZHNUb0hhc2godG90YTExeV9jb21tYW5kcywgVG90YTExeVBsdWdpbiksXG59KSlcblxuZXhwb3J0IGNvbnN0IFBsdWdpbkhpbnRzID0gW1xuICBibGFua19wYWdlX2NvbW1hbmRzWzBdLFxuICBiYXJyZWxfcm9sbF9jb21tYW5kc1swXSxcbiAgcGVzdGljaWRlX2NvbW1hbmRzWzBdLFxuICBjb25zdHJ1Y3RfY29tbWFuZHNbMF0sXG4gIGNvbnN0cnVjdF9kZWJ1Z19jb21tYW5kc1swXSxcbiAgd2lyZWZyYW1lX2NvbW1hbmRzWzBdLFxuICBza2VsZXRvbl9jb21tYW5kc1swXSxcbiAgdGFnX2RlYnVnZ2VyX2NvbW1hbmRzWzBdLFxuICByZXZlbmdlX2NvbW1hbmRzWzBdLFxuICB0b3RhMTF5X2NvbW1hbmRzWzBdLFxuXS5tYXAoY29tbWFuZCA9PiBgLyR7Y29tbWFuZH1gKVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IHF1ZXJ5U2VsZWN0b3JBbGxEZWVwIH0gZnJvbSAncXVlcnktc2VsZWN0b3Itc2hhZG93LWRvbSdcbmltcG9ydCB7IFBsdWdpblJlZ2lzdHJ5LCBQbHVnaW5IaW50cyB9IGZyb20gJy4uL3BsdWdpbnMvX3JlZ2lzdHJ5J1xuXG5sZXQgU2VsZWN0b3JFbmdpbmVcblxuLy8gY3JlYXRlIGlucHV0XG5jb25zdCBzZWFyY2hfYmFzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5zZWFyY2hfYmFzZS5jbGFzc0xpc3QuYWRkKCdzZWFyY2gnKVxuc2VhcmNoX2Jhc2UuaW5uZXJIVE1MID0gYFxuICA8aW5wdXQgbGlzdD1cInZpc2J1Zy1wbHVnaW5zXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cImV4OiBpbWFnZXMsIC5idG4sIGJ1dHRvbiwgdGV4dCwgLi4uXCIvPlxuICA8ZGF0YWxpc3QgaWQ9XCJ2aXNidWctcGx1Z2luc1wiPlxuICAgICR7UGx1Z2luSGludHMucmVkdWNlKChvcHRpb25zLCBjb21tYW5kKSA9PlxuICAgICAgb3B0aW9ucyArPSBgPG9wdGlvbiB2YWx1ZT1cIiR7Y29tbWFuZH1cIj5wbHVnaW48L29wdGlvbj5gXG4gICAgLCAnJyl9XG4gICAgPG9wdGlvbiB2YWx1ZT1cImgxLCBoMiwgaDMsIC5nZXQtbXVsdGlwbGVcIj5leGFtcGxlPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cIm5hdiA+IGE6Zmlyc3QtY2hpbGRcIj5leGFtcGxlPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cIiNnZXQtYnktaWRcIj5leGFtcGxlPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cIi5nZXQtYnkuY2xhc3MtbmFtZXNcIj5leGFtcGxlPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cImltYWdlc1wiPmFsaWFzPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cInRleHRcIj5hbGlhczwvb3B0aW9uPlxuICA8L2RhdGFsaXN0PlxuYFxuXG5jb25zdCBzZWFyY2ggICAgICAgID0gJChzZWFyY2hfYmFzZSlcbmNvbnN0IHNlYXJjaElucHV0ICAgPSAkKCdpbnB1dCcsIHNlYXJjaF9iYXNlKVxuXG5jb25zdCBzaG93U2VhcmNoQmFyID0gKCkgPT4gc2VhcmNoLmF0dHIoJ3N0eWxlJywgJ2Rpc3BsYXk6YmxvY2snKVxuY29uc3QgaGlkZVNlYXJjaEJhciA9ICgpID0+IHNlYXJjaC5hdHRyKCdzdHlsZScsICdkaXNwbGF5Om5vbmUnKVxuY29uc3Qgc3RvcEJ1YmJsaW5nICA9IGUgPT4gZS5rZXkgIT0gJ0VzY2FwZScgJiYgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG5leHBvcnQgZnVuY3Rpb24gU2VhcmNoKG5vZGUpIHtcbiAgaWYgKG5vZGUpIG5vZGVbMF0uYXBwZW5kQ2hpbGQoc2VhcmNoWzBdKVxuXG4gIGNvbnN0IG9uUXVlcnkgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBjb25zdCBxdWVyeSA9IGUudGFyZ2V0LnZhbHVlXG5cbiAgICB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhfID0+XG4gICAgICBxdWVyeVBhZ2UocXVlcnkpKVxuICB9XG5cbiAgc2VhcmNoSW5wdXQub24oJ2lucHV0Jywgb25RdWVyeSlcbiAgc2VhcmNoSW5wdXQub24oJ2tleWRvd24nLCBzdG9wQnViYmxpbmcpXG4gIC8vIHNlYXJjaElucHV0Lm9uKCdibHVyJywgaGlkZVNlYXJjaEJhcilcblxuICBzaG93U2VhcmNoQmFyKClcbiAgc2VhcmNoSW5wdXRbMF0uZm9jdXMoKVxuXG4gIC8vIGhvdGtleXMoJ2VzY2FwZSxlc2MnLCAoZSwgaGFuZGxlcikgPT4ge1xuICAvLyAgIGhpZGVTZWFyY2hCYXIoKVxuICAvLyAgIGhvdGtleXMudW5iaW5kKCdlc2NhcGUsZXNjJylcbiAgLy8gfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhpZGVTZWFyY2hCYXIoKVxuICAgIHNlYXJjaElucHV0Lm9mZignb25pbnB1dCcsIG9uUXVlcnkpXG4gICAgc2VhcmNoSW5wdXQub2ZmKCdrZXlkb3duJywgc3RvcEJ1YmJsaW5nKVxuICAgIHNlYXJjaElucHV0Lm9mZignYmx1cicsIGhpZGVTZWFyY2hCYXIpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVTZWxlY3RvckVuZ2luZShFbmdpbmUpIHtcbiAgU2VsZWN0b3JFbmdpbmUgPSBFbmdpbmVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5UGFnZShxdWVyeSwgZm4pIHtcbiAgLy8gdG9kbzogc2hvdWxkIHN0YXNoIGEgY2xlYW51cCBtZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gcXVlcnkgZG9lc250IG1hdGNoXG4gIGlmIChQbHVnaW5SZWdpc3RyeS5oYXMocXVlcnkpKVxuICAgIHJldHVybiBQbHVnaW5SZWdpc3RyeS5nZXQocXVlcnkpKHF1ZXJ5KVxuXG4gIGlmIChxdWVyeSA9PSAnbGlua3MnKSAgICAgcXVlcnkgPSAnYSdcbiAgaWYgKHF1ZXJ5ID09ICdidXR0b25zJykgICBxdWVyeSA9ICdidXR0b24nXG4gIGlmIChxdWVyeSA9PSAnaW1hZ2VzJykgICAgcXVlcnkgPSAnaW1nJ1xuICBpZiAocXVlcnkgPT0gJ3RleHQnKSAgICAgIHF1ZXJ5ID0gJ3AsY2FwdGlvbixhLGgxLGgyLGgzLGg0LGg1LGg2LHNtYWxsLGRhdGUsdGltZSxsaSxkdCxkZCdcblxuICBpZiAoIXF1ZXJ5KSByZXR1cm4gU2VsZWN0b3JFbmdpbmUudW5zZWxlY3RfYWxsKClcbiAgaWYgKHF1ZXJ5ID09ICcuJyB8fCBxdWVyeSA9PSAnIycgfHwgcXVlcnkudHJpbSgpLmVuZHNXaXRoKCcsJykpIHJldHVyblxuXG4gIHRyeSB7XG4gICAgbGV0IG1hdGNoZXMgPSBxdWVyeVNlbGVjdG9yQWxsRGVlcChxdWVyeSArICc6bm90KHZpcy1idWcpOm5vdChzY3JpcHQpOm5vdChob3RrZXktbWFwKTpub3QoLnZpc2J1Zy1tZXRhdGlwKTpub3QodmlzYnVnLWxhYmVsKTpub3QodmlzYnVnLWhhbmRsZXMpJylcbiAgICBpZiAoIW1hdGNoZXMubGVuZ3RoKSBtYXRjaGVzID0gcXVlcnlTZWxlY3RvckFsbERlZXAocXVlcnkpXG4gICAgaWYgKCFmbikgU2VsZWN0b3JFbmdpbmUudW5zZWxlY3RfYWxsKClcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGgpXG4gICAgICBtYXRjaGVzLmZvckVhY2goZWwgPT5cbiAgICAgICAgZm5cbiAgICAgICAgICA/IGZuKGVsKVxuICAgICAgICAgIDogU2VsZWN0b3JFbmdpbmUuc2VsZWN0KGVsKSlcbiAgfVxuICBjYXRjaCAoZXJyKSB7fVxufVxuIiwiY29uc3Qgc3RhdGUgPSB7XG4gIGRpc3RhbmNlczogIFtdLFxuICB0YXJnZXQ6ICAgICBudWxsLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVhc3VyZW1lbnRzKHskYW5jaG9yLCAkdGFyZ2V0fSkge1xuICBpZiAoc3RhdGUudGFyZ2V0ID09ICR0YXJnZXQgJiYgc3RhdGUuZGlzdGFuY2VzLmxlbmd0aCkgcmV0dXJuXG4gIGVsc2Ugc3RhdGUudGFyZ2V0ID0gJHRhcmdldFxuXG4gIGlmIChzdGF0ZS5kaXN0YW5jZXMubGVuZ3RoKSBjbGVhck1lYXN1cmVtZW50cygpXG5cbiAgY29uc3QgYW5jaG9yQm91bmRzID0gJGFuY2hvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBjb25zdCB0YXJnZXRCb3VuZHMgPSAkdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgY29uc3QgbWVhc3VyZW1lbnRzID0gW11cblxuICAvLyByaWdodFxuICBpZiAoYW5jaG9yQm91bmRzLnJpZ2h0IDwgdGFyZ2V0Qm91bmRzLmxlZnQpIHtcbiAgICBtZWFzdXJlbWVudHMucHVzaCh7XG4gICAgICB4OiBhbmNob3JCb3VuZHMucmlnaHQsXG4gICAgICB5OiBhbmNob3JCb3VuZHMudG9wICsgKGFuY2hvckJvdW5kcy5oZWlnaHQgLyAyKSAtIDMsXG4gICAgICBkOiB0YXJnZXRCb3VuZHMubGVmdCAtIGFuY2hvckJvdW5kcy5yaWdodCxcbiAgICAgIHE6ICdyaWdodCcsXG4gICAgfSlcbiAgfVxuICBpZiAoYW5jaG9yQm91bmRzLnJpZ2h0IDwgdGFyZ2V0Qm91bmRzLnJpZ2h0ICYmIGFuY2hvckJvdW5kcy5yaWdodCA+IHRhcmdldEJvdW5kcy5sZWZ0KSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLnJpZ2h0LFxuICAgICAgeTogYW5jaG9yQm91bmRzLnRvcCArIChhbmNob3JCb3VuZHMuaGVpZ2h0IC8gMikgLSAzLFxuICAgICAgZDogdGFyZ2V0Qm91bmRzLnJpZ2h0IC0gYW5jaG9yQm91bmRzLnJpZ2h0LFxuICAgICAgcTogJ3JpZ2h0JyxcbiAgICB9KVxuICB9XG5cbiAgLy8gbGVmdFxuICBpZiAoYW5jaG9yQm91bmRzLmxlZnQgPiB0YXJnZXRCb3VuZHMucmlnaHQpIHtcbiAgICBtZWFzdXJlbWVudHMucHVzaCh7XG4gICAgICB4OiB3aW5kb3cuaW5uZXJXaWR0aCAtIGFuY2hvckJvdW5kcy5sZWZ0LFxuICAgICAgeTogYW5jaG9yQm91bmRzLnRvcCArIChhbmNob3JCb3VuZHMuaGVpZ2h0IC8gMikgLSAzLFxuICAgICAgZDogYW5jaG9yQm91bmRzLmxlZnQgLSB0YXJnZXRCb3VuZHMucmlnaHQsXG4gICAgICBxOiAnbGVmdCcsXG4gICAgfSlcbiAgfVxuICBpZiAoYW5jaG9yQm91bmRzLmxlZnQgPiB0YXJnZXRCb3VuZHMubGVmdCAmJiBhbmNob3JCb3VuZHMubGVmdCA8IHRhcmdldEJvdW5kcy5yaWdodCkge1xuICAgIG1lYXN1cmVtZW50cy5wdXNoKHtcbiAgICAgIHg6IHdpbmRvdy5pbm5lcldpZHRoIC0gYW5jaG9yQm91bmRzLmxlZnQsXG4gICAgICB5OiBhbmNob3JCb3VuZHMudG9wICsgKGFuY2hvckJvdW5kcy5oZWlnaHQgLyAyKSAtIDMsXG4gICAgICBkOiBhbmNob3JCb3VuZHMubGVmdCAtIHRhcmdldEJvdW5kcy5sZWZ0LFxuICAgICAgcTogJ2xlZnQnLFxuICAgIH0pXG4gIH1cblxuICAvLyB0b3BcbiAgaWYgKGFuY2hvckJvdW5kcy50b3AgPiB0YXJnZXRCb3VuZHMuYm90dG9tKSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogdGFyZ2V0Qm91bmRzLmJvdHRvbSxcbiAgICAgIGQ6IGFuY2hvckJvdW5kcy50b3AgLSB0YXJnZXRCb3VuZHMuYm90dG9tLFxuICAgICAgcTogJ3RvcCcsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gIH1cbiAgaWYgKGFuY2hvckJvdW5kcy50b3AgPiB0YXJnZXRCb3VuZHMudG9wICYmIGFuY2hvckJvdW5kcy50b3AgPCB0YXJnZXRCb3VuZHMuYm90dG9tKSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogdGFyZ2V0Qm91bmRzLnRvcCxcbiAgICAgIGQ6IGFuY2hvckJvdW5kcy50b3AgLSB0YXJnZXRCb3VuZHMudG9wLFxuICAgICAgcTogJ3RvcCcsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICAvLyBib3R0b21cbiAgaWYgKGFuY2hvckJvdW5kcy5ib3R0b20gPCB0YXJnZXRCb3VuZHMudG9wKSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogYW5jaG9yQm91bmRzLmJvdHRvbSxcbiAgICAgIGQ6IHRhcmdldEJvdW5kcy50b3AgLSBhbmNob3JCb3VuZHMuYm90dG9tLFxuICAgICAgcTogJ2JvdHRvbScsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gIH1cbiAgaWYgKGFuY2hvckJvdW5kcy5ib3R0b20gPCB0YXJnZXRCb3VuZHMuYm90dG9tICYmIGFuY2hvckJvdW5kcy5ib3R0b20gPiB0YXJnZXRCb3VuZHMudG9wKSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogYW5jaG9yQm91bmRzLmJvdHRvbSxcbiAgICAgIGQ6IHRhcmdldEJvdW5kcy5ib3R0b20gLSBhbmNob3JCb3VuZHMuYm90dG9tLFxuICAgICAgcTogJ2JvdHRvbScsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICAvLyBpbnNpZGUgbGVmdC9yaWdodFxuICBpZiAoYW5jaG9yQm91bmRzLnJpZ2h0ID4gdGFyZ2V0Qm91bmRzLnJpZ2h0ICYmIGFuY2hvckJvdW5kcy5sZWZ0IDwgdGFyZ2V0Qm91bmRzLmxlZnQpIHtcbiAgICBtZWFzdXJlbWVudHMucHVzaCh7XG4gICAgICB4OiB3aW5kb3cuaW5uZXJXaWR0aCAtIGFuY2hvckJvdW5kcy5yaWdodCxcbiAgICAgIHk6IGFuY2hvckJvdW5kcy50b3AgKyAoYW5jaG9yQm91bmRzLmhlaWdodCAvIDIpIC0gMyxcbiAgICAgIGQ6IGFuY2hvckJvdW5kcy5yaWdodCAtIHRhcmdldEJvdW5kcy5yaWdodCxcbiAgICAgIHE6ICdsZWZ0JyxcbiAgICB9KVxuICAgIG1lYXN1cmVtZW50cy5wdXNoKHtcbiAgICAgIHg6IGFuY2hvckJvdW5kcy5sZWZ0LFxuICAgICAgeTogYW5jaG9yQm91bmRzLnRvcCArIChhbmNob3JCb3VuZHMuaGVpZ2h0IC8gMikgLSAzLFxuICAgICAgZDogdGFyZ2V0Qm91bmRzLmxlZnQgLSBhbmNob3JCb3VuZHMubGVmdCxcbiAgICAgIHE6ICdyaWdodCcsXG4gICAgfSlcbiAgfVxuXG4gIC8vIGluc2lkZSB0b3AvcmlnaHRcbiAgaWYgKGFuY2hvckJvdW5kcy50b3AgPCB0YXJnZXRCb3VuZHMudG9wICYmIGFuY2hvckJvdW5kcy5ib3R0b20gPiB0YXJnZXRCb3VuZHMuYm90dG9tKSB7XG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogYW5jaG9yQm91bmRzLnRvcCxcbiAgICAgIGQ6IHRhcmdldEJvdW5kcy50b3AgLSBhbmNob3JCb3VuZHMudG9wLFxuICAgICAgcTogJ2JvdHRvbScsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gICAgbWVhc3VyZW1lbnRzLnB1c2goe1xuICAgICAgeDogYW5jaG9yQm91bmRzLmxlZnQgKyAoYW5jaG9yQm91bmRzLndpZHRoIC8gMikgLSAzLFxuICAgICAgeTogdGFyZ2V0Qm91bmRzLmJvdHRvbSxcbiAgICAgIGQ6IGFuY2hvckJvdW5kcy5ib3R0b20gLSB0YXJnZXRCb3VuZHMuYm90dG9tLFxuICAgICAgcTogJ3RvcCcsXG4gICAgICB2OiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICAvLyBjcmVhdGUgY3VzdG9tIGVsZW1lbnRzIGZvciBhbGwgY3JlYXRlZCBtZWFzdXJlbWVudHNcbiAgbWVhc3VyZW1lbnRzXG4gICAgLm1hcChtZWFzdXJlbWVudCA9PiBPYmplY3QuYXNzaWduKG1lYXN1cmVtZW50LCB7XG4gICAgICBkOiBNYXRoLnJvdW5kKG1lYXN1cmVtZW50LmQudG9GaXhlZCgxKSAqIDEwMCkgLyAxMDBcbiAgICB9KSlcbiAgICAuZm9yRWFjaChtZWFzdXJlbWVudCA9PiB7XG4gICAgICBjb25zdCAkbWVhc3VyZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aXNidWctZGlzdGFuY2UnKVxuXG4gICAgICAkbWVhc3VyZW1lbnQucG9zaXRpb24gPSB7XG4gICAgICAgIGxpbmVfbW9kZWw6ICAgICBtZWFzdXJlbWVudCxcbiAgICAgICAgbm9kZV9sYWJlbF9pZDogIHN0YXRlLmRpc3RhbmNlcy5sZW5ndGgsXG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoJG1lYXN1cmVtZW50KVxuICAgICAgc3RhdGUuZGlzdGFuY2VzW3N0YXRlLmRpc3RhbmNlcy5sZW5ndGhdID0gJG1lYXN1cmVtZW50XG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyTWVhc3VyZW1lbnRzKCkge1xuICBzdGF0ZS5kaXN0YW5jZXMuZm9yRWFjaChub2RlID0+IG5vZGUucmVtb3ZlKCkpXG4gIHN0YXRlLmRpc3RhbmNlcyA9IFtdXG59XG4iLCJpbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgbWV0YUtleSwgZ2V0U3R5bGUsIGdldFNpZGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT5cbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LGFsdCske2V2ZW50fSxzaGlmdCske2V2ZW50fSxzaGlmdCthbHQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuY29uc3QgY29tbWFuZF9ldmVudHMgPSBgJHttZXRhS2V5fSt1cCwke21ldGFLZXl9K3NoaWZ0K3VwLCR7bWV0YUtleX0rZG93biwke21ldGFLZXl9K3NoaWZ0K2Rvd25gXG5cbmV4cG9ydCBmdW5jdGlvbiBQYWRkaW5nKHZpc2J1Zykge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGUuY2FuY2VsQnViYmxlKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHBhZEVsZW1lbnQodmlzYnVnLnNlbGVjdGlvbigpLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHBhZEFsbEVsZW1lbnRTaWRlcyh2aXNidWcuc2VsZWN0aW9uKCksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIHZpc2J1Zy5vblNlbGVjdGVkVXBkYXRlKHBhaW50QmFja2dyb3VuZHMpXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKSAvLyBidWcgaW4gbGliP1xuICAgIHZpc2J1Zy5yZW1vdmVTZWxlY3RlZENhbGxiYWNrKHBhaW50QmFja2dyb3VuZHMpXG4gICAgcmVtb3ZlQmFja2dyb3VuZHModmlzYnVnLnNlbGVjdGlvbigpKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWRFbGVtZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoe1xuICAgICAgZWwsXG4gICAgICBzdHlsZTogICAgJ3BhZGRpbmcnICsgZ2V0U2lkZShkaXJlY3Rpb24pLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAncGFkZGluZycgKyBnZXRTaWRlKGRpcmVjdGlvbikpLCAxMCksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2FsdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHBhZGRpbmc6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50XG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHBhZGRpbmd9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7cGFkZGluZyA8IDAgPyAwIDogcGFkZGluZ31weGApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWRBbGxFbGVtZW50U2lkZXMoZWxzLCBrZXljb21tYW5kKSB7XG4gIGNvbnN0IGNvbWJvID0ga2V5Y29tbWFuZC5zcGxpdCgnKycpXG4gIGxldCBzcG9vZiA9ICcnXG5cbiAgaWYgKGNvbWJvLmluY2x1ZGVzKCdzaGlmdCcpKSAgc3Bvb2YgPSAnc2hpZnQrJyArIHNwb29mXG4gIGlmIChjb21iby5pbmNsdWRlcygnZG93bicpKSAgIHNwb29mID0gJ2FsdCsnICsgc3Bvb2ZcblxuICAndXAsZG93bixsZWZ0LHJpZ2h0Jy5zcGxpdCgnLCcpXG4gICAgLmZvckVhY2goc2lkZSA9PiBwYWRFbGVtZW50KGVscywgc3Bvb2YgKyBzaWRlKSlcbn1cblxuZnVuY3Rpb24gcGFpbnRCYWNrZ3JvdW5kcyhlbHMpIHtcbiAgZWxzLmZvckVhY2goZWwgPT4ge1xuICAgIGNvbnN0IGxhYmVsX2lkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJylcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgdmlzYnVnLWxhYmVsW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsX2lkfVwiXWApXG4gICAgICAuc3R5bGUub3BhY2l0eSA9IDBcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgdmlzYnVnLWhhbmRsZXNbZGF0YS1sYWJlbC1pZD1cIiR7bGFiZWxfaWR9XCJdYClcbiAgICAgIC5iYWNrZHJvcCA9IHtcbiAgICAgICAgZWxlbWVudDogIGNyZWF0ZVBhZGRpbmdWaXN1YWwoZWwpLFxuICAgICAgICB1cGRhdGU6ICAgY3JlYXRlUGFkZGluZ1Zpc3VhbCxcbiAgICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQmFja2dyb3VuZHMoZWxzKSB7XG4gIGVscy5mb3JFYWNoKGVsID0+IHtcbiAgICBjb25zdCBsYWJlbF9pZCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpXG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGB2aXNidWctbGFiZWxbZGF0YS1sYWJlbC1pZD1cIiR7bGFiZWxfaWR9XCJdYClcbiAgICBjb25zdCBib3htb2RlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHZpc2J1Zy1oYW5kbGVzW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsX2lkfVwiXWApXG4gICAgICAuJHNoYWRvdy5xdWVyeVNlbGVjdG9yKCd2aXNidWctYm94bW9kZWwnKVxuXG4gICAgbGFiZWwuc3R5bGUub3BhY2l0eSA9IDFcbiAgICBpZiAoYm94bW9kZWwpIGJveG1vZGVsLnJlbW92ZSgpXG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYWRkaW5nVmlzdWFsKGVsLCBob3ZlciA9IGZhbHNlKSB7XG4gIGNvbnN0IGJvdW5kcyAgICAgICAgICAgID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qgc3R5bGVPTSAgICAgICAgICAgPSBlbC5jb21wdXRlZFN0eWxlTWFwKClcbiAgY29uc3QgY2FsY3VsYXRlZFN0eWxlICAgPSBnZXRTdHlsZShlbCwgJ3BhZGRpbmcnKVxuICBjb25zdCBib3hkaXNwbGF5ICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Zpc2J1Zy1ib3htb2RlbCcpXG5cbiAgaWYgKGNhbGN1bGF0ZWRTdHlsZSAhPT0gJzBweCcpIHtcbiAgICBjb25zdCBzaWRlcyA9IHtcbiAgICAgIHRvcDogICAgc3R5bGVPTS5nZXQoJ3BhZGRpbmctdG9wJykudmFsdWUsXG4gICAgICByaWdodDogIHN0eWxlT00uZ2V0KCdwYWRkaW5nLXJpZ2h0JykudmFsdWUsXG4gICAgICBib3R0b206IHN0eWxlT00uZ2V0KCdwYWRkaW5nLWJvdHRvbScpLnZhbHVlLFxuICAgICAgbGVmdDogICBzdHlsZU9NLmdldCgncGFkZGluZy1sZWZ0JykudmFsdWUsXG4gICAgfVxuXG4gICAgT2JqZWN0LmVudHJpZXMoc2lkZXMpLmZvckVhY2goKFtzaWRlLCB2YWxdKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ251bWJlcicpXG4gICAgICAgIHZhbCA9IHBhcnNlSW50KGdldFN0eWxlKGVsLCAncGFkZGluZycrJy0nK3NpZGUpLnNsaWNlKDAsIC0yKSlcblxuICAgICAgc2lkZXNbc2lkZV0gPSBNYXRoLnJvdW5kKHZhbC50b0ZpeGVkKDEpICogMTAwKSAvIDEwMFxuICAgIH0pXG5cbiAgICBib3hkaXNwbGF5LnBvc2l0aW9uID0geyBcbiAgICAgIG1vZGU6ICdwYWRkaW5nJyxcbiAgICAgIGNvbG9yOiBob3ZlciA/ICdwdXJwbGUnIDogJ3BpbmsnLFxuICAgICAgYm91bmRzLCBcbiAgICAgIHNpZGVzLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBib3hkaXNwbGF5XG59XG4iLCIvKipcbiAqIFRha2UgaW5wdXQgZnJvbSBbMCwgbl0gYW5kIHJldHVybiBpdCBhcyBbMCwgMV1cbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gYm91bmQwMShuLCBtYXgpIHtcbiAgICBpZiAoaXNPbmVQb2ludFplcm8obikpIHtcbiAgICAgICAgbiA9ICcxMDAlJztcbiAgICB9XG4gICAgY29uc3QgcHJvY2Vzc1BlcmNlbnQgPSBpc1BlcmNlbnRhZ2Uobik7XG4gICAgbiA9IG1heCA9PT0gMzYwID8gbiA6IE1hdGgubWluKG1heCwgTWF0aC5tYXgoMCwgcGFyc2VGbG9hdChuKSkpO1xuICAgIC8vIEF1dG9tYXRpY2FsbHkgY29udmVydCBwZXJjZW50YWdlIGludG8gbnVtYmVyXG4gICAgaWYgKHByb2Nlc3NQZXJjZW50KSB7XG4gICAgICAgIG4gPSBwYXJzZUludChTdHJpbmcobiAqIG1heCksIDEwKSAvIDEwMDtcbiAgICB9XG4gICAgLy8gSGFuZGxlIGZsb2F0aW5nIHBvaW50IHJvdW5kaW5nIGVycm9yc1xuICAgIGlmIChNYXRoLmFicyhuIC0gbWF4KSA8IDAuMDAwMDAxKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBDb252ZXJ0IGludG8gWzAsIDFdIHJhbmdlIGlmIGl0IGlzbid0IGFscmVhZHlcbiAgICBpZiAobWF4ID09PSAzNjApIHtcbiAgICAgICAgLy8gSWYgbiBpcyBhIGh1ZSBnaXZlbiBpbiBkZWdyZWVzLFxuICAgICAgICAvLyB3cmFwIGFyb3VuZCBvdXQtb2YtcmFuZ2UgdmFsdWVzIGludG8gWzAsIDM2MF0gcmFuZ2VcbiAgICAgICAgLy8gdGhlbiBjb252ZXJ0IGludG8gWzAsIDFdLlxuICAgICAgICBuID0gKG4gPCAwID8gbiAlIG1heCArIG1heCA6IG4gJSBtYXgpIC8gcGFyc2VGbG9hdChTdHJpbmcobWF4KSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBJZiBuIG5vdCBhIGh1ZSBnaXZlbiBpbiBkZWdyZWVzXG4gICAgICAgIC8vIENvbnZlcnQgaW50byBbMCwgMV0gcmFuZ2UgaWYgaXQgaXNuJ3QgYWxyZWFkeS5cbiAgICAgICAgbiA9IChuICUgbWF4KSAvIHBhcnNlRmxvYXQoU3RyaW5nKG1heCkpO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbn1cbi8qKlxuICogRm9yY2UgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGNsYW1wMDEodmFsKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKDEsIE1hdGgubWF4KDAsIHZhbCkpO1xufVxuLyoqXG4gKiBOZWVkIHRvIGhhbmRsZSAxLjAgYXMgMTAwJSwgc2luY2Ugb25jZSBpdCBpcyBhIG51bWJlciwgdGhlcmUgaXMgbm8gZGlmZmVyZW5jZSBiZXR3ZWVuIGl0IGFuZCAxXG4gKiA8aHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83NDIyMDcyL2phdmFzY3JpcHQtaG93LXRvLWRldGVjdC1udW1iZXItYXMtYS1kZWNpbWFsLWluY2x1ZGluZy0xLTA+XG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGlzT25lUG9pbnRaZXJvKG4pIHtcbiAgICByZXR1cm4gdHlwZW9mIG4gPT09ICdzdHJpbmcnICYmIG4uaW5kZXhPZignLicpICE9PSAtMSAmJiBwYXJzZUZsb2F0KG4pID09PSAxO1xufVxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgc3RyaW5nIHBhc3NlZCBpbiBpcyBhIHBlcmNlbnRhZ2VcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gaXNQZXJjZW50YWdlKG4pIHtcbiAgICByZXR1cm4gdHlwZW9mIG4gPT09ICdzdHJpbmcnICYmIG4uaW5kZXhPZignJScpICE9PSAtMTtcbn1cbi8qKlxuICogUmV0dXJuIGEgdmFsaWQgYWxwaGEgdmFsdWUgWzAsMV0gd2l0aCBhbGwgaW52YWxpZCB2YWx1ZXMgYmVpbmcgc2V0IHRvIDFcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gYm91bmRBbHBoYShhKSB7XG4gICAgYSA9IHBhcnNlRmxvYXQoYSk7XG4gICAgaWYgKGlzTmFOKGEpIHx8IGEgPCAwIHx8IGEgPiAxKSB7XG4gICAgICAgIGEgPSAxO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn1cbi8qKlxuICogUmVwbGFjZSBhIGRlY2ltYWwgd2l0aCBpdCdzIHBlcmNlbnRhZ2UgdmFsdWVcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gY29udmVydFRvUGVyY2VudGFnZShuKSB7XG4gICAgaWYgKG4gPD0gMSkge1xuICAgICAgICByZXR1cm4gK24gKiAxMDAgKyAnJSc7XG4gICAgfVxuICAgIHJldHVybiBuO1xufVxuLyoqXG4gKiBGb3JjZSBhIGhleCB2YWx1ZSB0byBoYXZlIDIgY2hhcmFjdGVyc1xuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBwYWQyKGMpIHtcbiAgICByZXR1cm4gYy5sZW5ndGggPT09IDEgPyAnMCcgKyBjIDogJycgKyBjO1xufVxuXG4vLyBgcmdiVG9Ic2xgLCBgcmdiVG9Ic3ZgLCBgaHNsVG9SZ2JgLCBgaHN2VG9SZ2JgIG1vZGlmaWVkIGZyb206XG4vLyA8aHR0cDovL21qaWphY2tzb24uY29tLzIwMDgvMDIvcmdiLXRvLWhzbC1hbmQtcmdiLXRvLWhzdi1jb2xvci1tb2RlbC1jb252ZXJzaW9uLWFsZ29yaXRobXMtaW4tamF2YXNjcmlwdD5cbi8qKlxuICogSGFuZGxlIGJvdW5kcyAvIHBlcmNlbnRhZ2UgY2hlY2tpbmcgdG8gY29uZm9ybSB0byBDU1MgY29sb3Igc3BlY1xuICogPGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtY29sb3IvPlxuICogKkFzc3VtZXM6KiByLCBnLCBiIGluIFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IHIsIGcsIGIgfSBpbiBbMCwgMjU1XVxuICovXG5mdW5jdGlvbiByZ2JUb1JnYihyLCBnLCBiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcjogYm91bmQwMShyLCAyNTUpICogMjU1LFxuICAgICAgICBnOiBib3VuZDAxKGcsIDI1NSkgKiAyNTUsXG4gICAgICAgIGI6IGJvdW5kMDEoYiwgMjU1KSAqIDI1NSxcbiAgICB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0IgY29sb3IgdmFsdWUgdG8gSFNMLlxuICogKkFzc3VtZXM6KiByLCBnLCBhbmQgYiBhcmUgY29udGFpbmVkIGluIFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IGgsIHMsIGwgfSBpbiBbMCwxXVxuICovXG5mdW5jdGlvbiByZ2JUb0hzbChyLCBnLCBiKSB7XG4gICAgciA9IGJvdW5kMDEociwgMjU1KTtcbiAgICBnID0gYm91bmQwMShnLCAyNTUpO1xuICAgIGIgPSBib3VuZDAxKGIsIDI1NSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgbGV0IGggPSAwO1xuICAgIGxldCBzID0gMDtcbiAgICBjb25zdCBsID0gKG1heCArIG1pbikgLyAyO1xuICAgIGlmIChtYXggPT09IG1pbikge1xuICAgICAgICBoID0gcyA9IDA7IC8vIGFjaHJvbWF0aWNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgICAgIHMgPSBsID4gMC41ID8gZCAvICgyIC0gbWF4IC0gbWluKSA6IGQgLyAobWF4ICsgbWluKTtcbiAgICAgICAgc3dpdGNoIChtYXgpIHtcbiAgICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgICAgICBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgICAgICAgaCA9IChiIC0gcikgLyBkICsgMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgYjpcbiAgICAgICAgICAgICAgICBoID0gKHIgLSBnKSAvIGQgKyA0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGggLz0gNjtcbiAgICB9XG4gICAgcmV0dXJuIHsgaCwgcywgbCB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBIU0wgY29sb3IgdmFsdWUgdG8gUkdCLlxuICpcbiAqICpBc3N1bWVzOiogaCBpcyBjb250YWluZWQgaW4gWzAsIDFdIG9yIFswLCAzNjBdIGFuZCBzIGFuZCBsIGFyZSBjb250YWluZWQgWzAsIDFdIG9yIFswLCAxMDBdXG4gKiAqUmV0dXJuczoqIHsgciwgZywgYiB9IGluIHRoZSBzZXQgWzAsIDI1NV1cbiAqL1xuZnVuY3Rpb24gaHNsVG9SZ2IoaCwgcywgbCkge1xuICAgIGxldCByO1xuICAgIGxldCBnO1xuICAgIGxldCBiO1xuICAgIGggPSBib3VuZDAxKGgsIDM2MCk7XG4gICAgcyA9IGJvdW5kMDEocywgMTAwKTtcbiAgICBsID0gYm91bmQwMShsLCAxMDApO1xuICAgIGZ1bmN0aW9uIGh1ZTJyZ2IocCwgcSwgdCkge1xuICAgICAgICBpZiAodCA8IDApXG4gICAgICAgICAgICB0ICs9IDE7XG4gICAgICAgIGlmICh0ID4gMSlcbiAgICAgICAgICAgIHQgLT0gMTtcbiAgICAgICAgaWYgKHQgPCAxIC8gNikge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQgPCAxIC8gMikge1xuICAgICAgICAgICAgcmV0dXJuIHE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQgPCAyIC8gMykge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogKDIgLyAzIC0gdCkgKiA2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cbiAgICBpZiAocyA9PT0gMCkge1xuICAgICAgICByID0gZyA9IGIgPSBsOyAvLyBhY2hyb21hdGljXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBxID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcztcbiAgICAgICAgY29uc3QgcCA9IDIgKiBsIC0gcTtcbiAgICAgICAgciA9IGh1ZTJyZ2IocCwgcSwgaCArIDEgLyAzKTtcbiAgICAgICAgZyA9IGh1ZTJyZ2IocCwgcSwgaCk7XG4gICAgICAgIGIgPSBodWUycmdiKHAsIHEsIGggLSAxIC8gMyk7XG4gICAgfVxuICAgIHJldHVybiB7IHI6IHIgKiAyNTUsIGc6IGcgKiAyNTUsIGI6IGIgKiAyNTUgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHZhbHVlIHRvIEhTVlxuICpcbiAqICpBc3N1bWVzOiogciwgZywgYW5kIGIgYXJlIGNvbnRhaW5lZCBpbiB0aGUgc2V0IFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IGgsIHMsIHYgfSBpbiBbMCwxXVxuICovXG5mdW5jdGlvbiByZ2JUb0hzdihyLCBnLCBiKSB7XG4gICAgciA9IGJvdW5kMDEociwgMjU1KTtcbiAgICBnID0gYm91bmQwMShnLCAyNTUpO1xuICAgIGIgPSBib3VuZDAxKGIsIDI1NSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgbGV0IGggPSAwO1xuICAgIGNvbnN0IHYgPSBtYXg7XG4gICAgY29uc3QgZCA9IG1heCAtIG1pbjtcbiAgICBjb25zdCBzID0gbWF4ID09PSAwID8gMCA6IGQgLyBtYXg7XG4gICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICAgIGggPSAwOyAvLyBhY2hyb21hdGljXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKG1heCkge1xuICAgICAgICAgICAgY2FzZSByOlxuICAgICAgICAgICAgICAgIGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgZzpcbiAgICAgICAgICAgICAgICBoID0gKGIgLSByKSAvIGQgKyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBiOlxuICAgICAgICAgICAgICAgIGggPSAociAtIGcpIC8gZCArIDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaCAvPSA2O1xuICAgIH1cbiAgICByZXR1cm4geyBoOiBoLCBzOiBzLCB2OiB2IH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIEhTViBjb2xvciB2YWx1ZSB0byBSR0IuXG4gKlxuICogKkFzc3VtZXM6KiBoIGlzIGNvbnRhaW5lZCBpbiBbMCwgMV0gb3IgWzAsIDM2MF0gYW5kIHMgYW5kIHYgYXJlIGNvbnRhaW5lZCBpbiBbMCwgMV0gb3IgWzAsIDEwMF1cbiAqICpSZXR1cm5zOiogeyByLCBnLCBiIH0gaW4gdGhlIHNldCBbMCwgMjU1XVxuICovXG5mdW5jdGlvbiBoc3ZUb1JnYihoLCBzLCB2KSB7XG4gICAgaCA9IGJvdW5kMDEoaCwgMzYwKSAqIDY7XG4gICAgcyA9IGJvdW5kMDEocywgMTAwKTtcbiAgICB2ID0gYm91bmQwMSh2LCAxMDApO1xuICAgIGNvbnN0IGkgPSBNYXRoLmZsb29yKGgpO1xuICAgIGNvbnN0IGYgPSBoIC0gaTtcbiAgICBjb25zdCBwID0gdiAqICgxIC0gcyk7XG4gICAgY29uc3QgcSA9IHYgKiAoMSAtIGYgKiBzKTtcbiAgICBjb25zdCB0ID0gdiAqICgxIC0gKDEgLSBmKSAqIHMpO1xuICAgIGNvbnN0IG1vZCA9IGkgJSA2O1xuICAgIGNvbnN0IHIgPSBbdiwgcSwgcCwgcCwgdCwgdl1bbW9kXTtcbiAgICBjb25zdCBnID0gW3QsIHYsIHYsIHEsIHAsIHBdW21vZF07XG4gICAgY29uc3QgYiA9IFtwLCBwLCB0LCB2LCB2LCBxXVttb2RdO1xuICAgIHJldHVybiB7IHI6IHIgKiAyNTUsIGc6IGcgKiAyNTUsIGI6IGIgKiAyNTUgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHRvIGhleFxuICpcbiAqIEFzc3VtZXMgciwgZywgYW5kIGIgYXJlIGNvbnRhaW5lZCBpbiB0aGUgc2V0IFswLCAyNTVdXG4gKiBSZXR1cm5zIGEgMyBvciA2IGNoYXJhY3RlciBoZXhcbiAqL1xuZnVuY3Rpb24gcmdiVG9IZXgociwgZywgYiwgYWxsb3czQ2hhcikge1xuICAgIGNvbnN0IGhleCA9IFtcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKHIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChnKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoYikudG9TdHJpbmcoMTYpKSxcbiAgICBdO1xuICAgIC8vIFJldHVybiBhIDMgY2hhcmFjdGVyIGhleCBpZiBwb3NzaWJsZVxuICAgIGlmIChhbGxvdzNDaGFyICYmXG4gICAgICAgIGhleFswXS5jaGFyQXQoMCkgPT09IGhleFswXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzFdLmNoYXJBdCgwKSA9PT0gaGV4WzFdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMl0uY2hhckF0KDApID09PSBoZXhbMl0uY2hhckF0KDEpKSB7XG4gICAgICAgIHJldHVybiBoZXhbMF0uY2hhckF0KDApICsgaGV4WzFdLmNoYXJBdCgwKSArIGhleFsyXS5jaGFyQXQoMCk7XG4gICAgfVxuICAgIHJldHVybiBoZXguam9pbignJyk7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQkEgY29sb3IgcGx1cyBhbHBoYSB0cmFuc3BhcmVuY3kgdG8gaGV4XG4gKlxuICogQXNzdW1lcyByLCBnLCBiIGFyZSBjb250YWluZWQgaW4gdGhlIHNldCBbMCwgMjU1XSBhbmRcbiAqIGEgaW4gWzAsIDFdLiBSZXR1cm5zIGEgNCBvciA4IGNoYXJhY3RlciByZ2JhIGhleFxuICovXG5mdW5jdGlvbiByZ2JhVG9IZXgociwgZywgYiwgYSwgYWxsb3c0Q2hhcikge1xuICAgIGNvbnN0IGhleCA9IFtcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKHIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChnKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoYikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihjb252ZXJ0RGVjaW1hbFRvSGV4KGEpKSxcbiAgICBdO1xuICAgIC8vIFJldHVybiBhIDQgY2hhcmFjdGVyIGhleCBpZiBwb3NzaWJsZVxuICAgIGlmIChhbGxvdzRDaGFyICYmXG4gICAgICAgIGhleFswXS5jaGFyQXQoMCkgPT09IGhleFswXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzFdLmNoYXJBdCgwKSA9PT0gaGV4WzFdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMl0uY2hhckF0KDApID09PSBoZXhbMl0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFszXS5jaGFyQXQoMCkgPT09IGhleFszXS5jaGFyQXQoMSkpIHtcbiAgICAgICAgcmV0dXJuIGhleFswXS5jaGFyQXQoMCkgKyBoZXhbMV0uY2hhckF0KDApICsgaGV4WzJdLmNoYXJBdCgwKSArIGhleFszXS5jaGFyQXQoMCk7XG4gICAgfVxuICAgIHJldHVybiBoZXguam9pbignJyk7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQkEgY29sb3IgdG8gYW4gQVJHQiBIZXg4IHN0cmluZ1xuICogUmFyZWx5IHVzZWQsIGJ1dCByZXF1aXJlZCBmb3IgXCJ0b0ZpbHRlcigpXCJcbiAqL1xuZnVuY3Rpb24gcmdiYVRvQXJnYkhleChyLCBnLCBiLCBhKSB7XG4gICAgY29uc3QgaGV4ID0gW1xuICAgICAgICBwYWQyKGNvbnZlcnREZWNpbWFsVG9IZXgoYSkpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQocikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGcpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChiKS50b1N0cmluZygxNikpLFxuICAgIF07XG4gICAgcmV0dXJuIGhleC5qb2luKCcnKTtcbn1cbi8qKiBDb252ZXJ0cyBhIGRlY2ltYWwgdG8gYSBoZXggdmFsdWUgKi9cbmZ1bmN0aW9uIGNvbnZlcnREZWNpbWFsVG9IZXgoZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKHBhcnNlRmxvYXQoZCkgKiAyNTUpLnRvU3RyaW5nKDE2KTtcbn1cbi8qKiBDb252ZXJ0cyBhIGhleCB2YWx1ZSB0byBhIGRlY2ltYWwgKi9cbmZ1bmN0aW9uIGNvbnZlcnRIZXhUb0RlY2ltYWwoaCkge1xuICAgIHJldHVybiBwYXJzZUludEZyb21IZXgoaCkgLyAyNTU7XG59XG4vKiogUGFyc2UgYSBiYXNlLTE2IGhleCB2YWx1ZSBpbnRvIGEgYmFzZS0xMCBpbnRlZ2VyICovXG5mdW5jdGlvbiBwYXJzZUludEZyb21IZXgodmFsKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KHZhbCwgMTYpO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYmFoYW1hczEwL2Nzcy1jb2xvci1uYW1lcy9ibG9iL21hc3Rlci9jc3MtY29sb3ItbmFtZXMuanNvblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmNvbnN0IG5hbWVzID0ge1xuICAgIGFsaWNlYmx1ZTogJyNmMGY4ZmYnLFxuICAgIGFudGlxdWV3aGl0ZTogJyNmYWViZDcnLFxuICAgIGFxdWE6ICcjMDBmZmZmJyxcbiAgICBhcXVhbWFyaW5lOiAnIzdmZmZkNCcsXG4gICAgYXp1cmU6ICcjZjBmZmZmJyxcbiAgICBiZWlnZTogJyNmNWY1ZGMnLFxuICAgIGJpc3F1ZTogJyNmZmU0YzQnLFxuICAgIGJsYWNrOiAnIzAwMDAwMCcsXG4gICAgYmxhbmNoZWRhbG1vbmQ6ICcjZmZlYmNkJyxcbiAgICBibHVlOiAnIzAwMDBmZicsXG4gICAgYmx1ZXZpb2xldDogJyM4YTJiZTInLFxuICAgIGJyb3duOiAnI2E1MmEyYScsXG4gICAgYnVybHl3b29kOiAnI2RlYjg4NycsXG4gICAgY2FkZXRibHVlOiAnIzVmOWVhMCcsXG4gICAgY2hhcnRyZXVzZTogJyM3ZmZmMDAnLFxuICAgIGNob2NvbGF0ZTogJyNkMjY5MWUnLFxuICAgIGNvcmFsOiAnI2ZmN2Y1MCcsXG4gICAgY29ybmZsb3dlcmJsdWU6ICcjNjQ5NWVkJyxcbiAgICBjb3Juc2lsazogJyNmZmY4ZGMnLFxuICAgIGNyaW1zb246ICcjZGMxNDNjJyxcbiAgICBjeWFuOiAnIzAwZmZmZicsXG4gICAgZGFya2JsdWU6ICcjMDAwMDhiJyxcbiAgICBkYXJrY3lhbjogJyMwMDhiOGInLFxuICAgIGRhcmtnb2xkZW5yb2Q6ICcjYjg4NjBiJyxcbiAgICBkYXJrZ3JheTogJyNhOWE5YTknLFxuICAgIGRhcmtncmVlbjogJyMwMDY0MDAnLFxuICAgIGRhcmtncmV5OiAnI2E5YTlhOScsXG4gICAgZGFya2toYWtpOiAnI2JkYjc2YicsXG4gICAgZGFya21hZ2VudGE6ICcjOGIwMDhiJyxcbiAgICBkYXJrb2xpdmVncmVlbjogJyM1NTZiMmYnLFxuICAgIGRhcmtvcmFuZ2U6ICcjZmY4YzAwJyxcbiAgICBkYXJrb3JjaGlkOiAnIzk5MzJjYycsXG4gICAgZGFya3JlZDogJyM4YjAwMDAnLFxuICAgIGRhcmtzYWxtb246ICcjZTk5NjdhJyxcbiAgICBkYXJrc2VhZ3JlZW46ICcjOGZiYzhmJyxcbiAgICBkYXJrc2xhdGVibHVlOiAnIzQ4M2Q4YicsXG4gICAgZGFya3NsYXRlZ3JheTogJyMyZjRmNGYnLFxuICAgIGRhcmtzbGF0ZWdyZXk6ICcjMmY0ZjRmJyxcbiAgICBkYXJrdHVycXVvaXNlOiAnIzAwY2VkMScsXG4gICAgZGFya3Zpb2xldDogJyM5NDAwZDMnLFxuICAgIGRlZXBwaW5rOiAnI2ZmMTQ5MycsXG4gICAgZGVlcHNreWJsdWU6ICcjMDBiZmZmJyxcbiAgICBkaW1ncmF5OiAnIzY5Njk2OScsXG4gICAgZGltZ3JleTogJyM2OTY5NjknLFxuICAgIGRvZGdlcmJsdWU6ICcjMWU5MGZmJyxcbiAgICBmaXJlYnJpY2s6ICcjYjIyMjIyJyxcbiAgICBmbG9yYWx3aGl0ZTogJyNmZmZhZjAnLFxuICAgIGZvcmVzdGdyZWVuOiAnIzIyOGIyMicsXG4gICAgZnVjaHNpYTogJyNmZjAwZmYnLFxuICAgIGdhaW5zYm9ybzogJyNkY2RjZGMnLFxuICAgIGdob3N0d2hpdGU6ICcjZjhmOGZmJyxcbiAgICBnb2xkOiAnI2ZmZDcwMCcsXG4gICAgZ29sZGVucm9kOiAnI2RhYTUyMCcsXG4gICAgZ3JheTogJyM4MDgwODAnLFxuICAgIGdyZWVuOiAnIzAwODAwMCcsXG4gICAgZ3JlZW55ZWxsb3c6ICcjYWRmZjJmJyxcbiAgICBncmV5OiAnIzgwODA4MCcsXG4gICAgaG9uZXlkZXc6ICcjZjBmZmYwJyxcbiAgICBob3RwaW5rOiAnI2ZmNjliNCcsXG4gICAgaW5kaWFucmVkOiAnI2NkNWM1YycsXG4gICAgaW5kaWdvOiAnIzRiMDA4MicsXG4gICAgaXZvcnk6ICcjZmZmZmYwJyxcbiAgICBraGFraTogJyNmMGU2OGMnLFxuICAgIGxhdmVuZGVyOiAnI2U2ZTZmYScsXG4gICAgbGF2ZW5kZXJibHVzaDogJyNmZmYwZjUnLFxuICAgIGxhd25ncmVlbjogJyM3Y2ZjMDAnLFxuICAgIGxlbW9uY2hpZmZvbjogJyNmZmZhY2QnLFxuICAgIGxpZ2h0Ymx1ZTogJyNhZGQ4ZTYnLFxuICAgIGxpZ2h0Y29yYWw6ICcjZjA4MDgwJyxcbiAgICBsaWdodGN5YW46ICcjZTBmZmZmJyxcbiAgICBsaWdodGdvbGRlbnJvZHllbGxvdzogJyNmYWZhZDInLFxuICAgIGxpZ2h0Z3JheTogJyNkM2QzZDMnLFxuICAgIGxpZ2h0Z3JlZW46ICcjOTBlZTkwJyxcbiAgICBsaWdodGdyZXk6ICcjZDNkM2QzJyxcbiAgICBsaWdodHBpbms6ICcjZmZiNmMxJyxcbiAgICBsaWdodHNhbG1vbjogJyNmZmEwN2EnLFxuICAgIGxpZ2h0c2VhZ3JlZW46ICcjMjBiMmFhJyxcbiAgICBsaWdodHNreWJsdWU6ICcjODdjZWZhJyxcbiAgICBsaWdodHNsYXRlZ3JheTogJyM3Nzg4OTknLFxuICAgIGxpZ2h0c2xhdGVncmV5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzdGVlbGJsdWU6ICcjYjBjNGRlJyxcbiAgICBsaWdodHllbGxvdzogJyNmZmZmZTAnLFxuICAgIGxpbWU6ICcjMDBmZjAwJyxcbiAgICBsaW1lZ3JlZW46ICcjMzJjZDMyJyxcbiAgICBsaW5lbjogJyNmYWYwZTYnLFxuICAgIG1hZ2VudGE6ICcjZmYwMGZmJyxcbiAgICBtYXJvb246ICcjODAwMDAwJyxcbiAgICBtZWRpdW1hcXVhbWFyaW5lOiAnIzY2Y2RhYScsXG4gICAgbWVkaXVtYmx1ZTogJyMwMDAwY2QnLFxuICAgIG1lZGl1bW9yY2hpZDogJyNiYTU1ZDMnLFxuICAgIG1lZGl1bXB1cnBsZTogJyM5MzcwZGInLFxuICAgIG1lZGl1bXNlYWdyZWVuOiAnIzNjYjM3MScsXG4gICAgbWVkaXVtc2xhdGVibHVlOiAnIzdiNjhlZScsXG4gICAgbWVkaXVtc3ByaW5nZ3JlZW46ICcjMDBmYTlhJyxcbiAgICBtZWRpdW10dXJxdW9pc2U6ICcjNDhkMWNjJyxcbiAgICBtZWRpdW12aW9sZXRyZWQ6ICcjYzcxNTg1JyxcbiAgICBtaWRuaWdodGJsdWU6ICcjMTkxOTcwJyxcbiAgICBtaW50Y3JlYW06ICcjZjVmZmZhJyxcbiAgICBtaXN0eXJvc2U6ICcjZmZlNGUxJyxcbiAgICBtb2NjYXNpbjogJyNmZmU0YjUnLFxuICAgIG5hdmFqb3doaXRlOiAnI2ZmZGVhZCcsXG4gICAgbmF2eTogJyMwMDAwODAnLFxuICAgIG9sZGxhY2U6ICcjZmRmNWU2JyxcbiAgICBvbGl2ZTogJyM4MDgwMDAnLFxuICAgIG9saXZlZHJhYjogJyM2YjhlMjMnLFxuICAgIG9yYW5nZTogJyNmZmE1MDAnLFxuICAgIG9yYW5nZXJlZDogJyNmZjQ1MDAnLFxuICAgIG9yY2hpZDogJyNkYTcwZDYnLFxuICAgIHBhbGVnb2xkZW5yb2Q6ICcjZWVlOGFhJyxcbiAgICBwYWxlZ3JlZW46ICcjOThmYjk4JyxcbiAgICBwYWxldHVycXVvaXNlOiAnI2FmZWVlZScsXG4gICAgcGFsZXZpb2xldHJlZDogJyNkYjcwOTMnLFxuICAgIHBhcGF5YXdoaXA6ICcjZmZlZmQ1JyxcbiAgICBwZWFjaHB1ZmY6ICcjZmZkYWI5JyxcbiAgICBwZXJ1OiAnI2NkODUzZicsXG4gICAgcGluazogJyNmZmMwY2InLFxuICAgIHBsdW06ICcjZGRhMGRkJyxcbiAgICBwb3dkZXJibHVlOiAnI2IwZTBlNicsXG4gICAgcHVycGxlOiAnIzgwMDA4MCcsXG4gICAgcmViZWNjYXB1cnBsZTogJyM2NjMzOTknLFxuICAgIHJlZDogJyNmZjAwMDAnLFxuICAgIHJvc3licm93bjogJyNiYzhmOGYnLFxuICAgIHJveWFsYmx1ZTogJyM0MTY5ZTEnLFxuICAgIHNhZGRsZWJyb3duOiAnIzhiNDUxMycsXG4gICAgc2FsbW9uOiAnI2ZhODA3MicsXG4gICAgc2FuZHlicm93bjogJyNmNGE0NjAnLFxuICAgIHNlYWdyZWVuOiAnIzJlOGI1NycsXG4gICAgc2Vhc2hlbGw6ICcjZmZmNWVlJyxcbiAgICBzaWVubmE6ICcjYTA1MjJkJyxcbiAgICBzaWx2ZXI6ICcjYzBjMGMwJyxcbiAgICBza3libHVlOiAnIzg3Y2VlYicsXG4gICAgc2xhdGVibHVlOiAnIzZhNWFjZCcsXG4gICAgc2xhdGVncmF5OiAnIzcwODA5MCcsXG4gICAgc2xhdGVncmV5OiAnIzcwODA5MCcsXG4gICAgc25vdzogJyNmZmZhZmEnLFxuICAgIHNwcmluZ2dyZWVuOiAnIzAwZmY3ZicsXG4gICAgc3RlZWxibHVlOiAnIzQ2ODJiNCcsXG4gICAgdGFuOiAnI2QyYjQ4YycsXG4gICAgdGVhbDogJyMwMDgwODAnLFxuICAgIHRoaXN0bGU6ICcjZDhiZmQ4JyxcbiAgICB0b21hdG86ICcjZmY2MzQ3JyxcbiAgICB0dXJxdW9pc2U6ICcjNDBlMGQwJyxcbiAgICB2aW9sZXQ6ICcjZWU4MmVlJyxcbiAgICB3aGVhdDogJyNmNWRlYjMnLFxuICAgIHdoaXRlOiAnI2ZmZmZmZicsXG4gICAgd2hpdGVzbW9rZTogJyNmNWY1ZjUnLFxuICAgIHllbGxvdzogJyNmZmZmMDAnLFxuICAgIHllbGxvd2dyZWVuOiAnIzlhY2QzMicsXG59O1xuXG4vKipcbiAqIEdpdmVuIGEgc3RyaW5nIG9yIG9iamVjdCwgY29udmVydCB0aGF0IGlucHV0IHRvIFJHQlxuICpcbiAqIFBvc3NpYmxlIHN0cmluZyBpbnB1dHM6XG4gKiBgYGBcbiAqIFwicmVkXCJcbiAqIFwiI2YwMFwiIG9yIFwiZjAwXCJcbiAqIFwiI2ZmMDAwMFwiIG9yIFwiZmYwMDAwXCJcbiAqIFwiI2ZmMDAwMDAwXCIgb3IgXCJmZjAwMDAwMFwiXG4gKiBcInJnYiAyNTUgMCAwXCIgb3IgXCJyZ2IgKDI1NSwgMCwgMClcIlxuICogXCJyZ2IgMS4wIDAgMFwiIG9yIFwicmdiICgxLCAwLCAwKVwiXG4gKiBcInJnYmEgKDI1NSwgMCwgMCwgMSlcIiBvciBcInJnYmEgMjU1LCAwLCAwLCAxXCJcbiAqIFwicmdiYSAoMS4wLCAwLCAwLCAxKVwiIG9yIFwicmdiYSAxLjAsIDAsIDAsIDFcIlxuICogXCJoc2woMCwgMTAwJSwgNTAlKVwiIG9yIFwiaHNsIDAgMTAwJSA1MCVcIlxuICogXCJoc2xhKDAsIDEwMCUsIDUwJSwgMSlcIiBvciBcImhzbGEgMCAxMDAlIDUwJSwgMVwiXG4gKiBcImhzdigwLCAxMDAlLCAxMDAlKVwiIG9yIFwiaHN2IDAgMTAwJSAxMDAlXCJcbiAqIGBgYFxuICovXG5mdW5jdGlvbiBpbnB1dFRvUkdCKGNvbG9yKSB7XG4gICAgbGV0IHJnYiA9IHsgcjogMCwgZzogMCwgYjogMCB9O1xuICAgIGxldCBhID0gMTtcbiAgICBsZXQgcyA9IG51bGw7XG4gICAgbGV0IHYgPSBudWxsO1xuICAgIGxldCBsID0gbnVsbDtcbiAgICBsZXQgb2sgPSBmYWxzZTtcbiAgICBsZXQgZm9ybWF0ID0gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29sb3IgPSBzdHJpbmdJbnB1dFRvT2JqZWN0KGNvbG9yKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKGlzVmFsaWRDU1NVbml0KGNvbG9yLnIpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLmcpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLmIpKSB7XG4gICAgICAgICAgICByZ2IgPSByZ2JUb1JnYihjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKTtcbiAgICAgICAgICAgIG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm1hdCA9IFN0cmluZyhjb2xvci5yKS5zdWJzdHIoLTEpID09PSAnJScgPyAncHJnYicgOiAncmdiJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1ZhbGlkQ1NTVW5pdChjb2xvci5oKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5zKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci52KSkge1xuICAgICAgICAgICAgcyA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3Iucyk7XG4gICAgICAgICAgICB2ID0gY29udmVydFRvUGVyY2VudGFnZShjb2xvci52KTtcbiAgICAgICAgICAgIHJnYiA9IGhzdlRvUmdiKGNvbG9yLmgsIHMsIHYpO1xuICAgICAgICAgICAgb2sgPSB0cnVlO1xuICAgICAgICAgICAgZm9ybWF0ID0gJ2hzdic7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNWYWxpZENTU1VuaXQoY29sb3IuaCkgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IucykgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IubCkpIHtcbiAgICAgICAgICAgIHMgPSBjb252ZXJ0VG9QZXJjZW50YWdlKGNvbG9yLnMpO1xuICAgICAgICAgICAgbCA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3IubCk7XG4gICAgICAgICAgICByZ2IgPSBoc2xUb1JnYihjb2xvci5oLCBzLCBsKTtcbiAgICAgICAgICAgIG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm1hdCA9ICdoc2wnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xvci5oYXNPd25Qcm9wZXJ0eSgnYScpKSB7XG4gICAgICAgICAgICBhID0gY29sb3IuYTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhID0gYm91bmRBbHBoYShhKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvayxcbiAgICAgICAgZm9ybWF0OiBjb2xvci5mb3JtYXQgfHwgZm9ybWF0LFxuICAgICAgICByOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KHJnYi5yLCAwKSksXG4gICAgICAgIGc6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgocmdiLmcsIDApKSxcbiAgICAgICAgYjogTWF0aC5taW4oMjU1LCBNYXRoLm1heChyZ2IuYiwgMCkpLFxuICAgICAgICBhLFxuICAgIH07XG59XG4vLyA8aHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy12YWx1ZXMvI2ludGVnZXJzPlxuY29uc3QgQ1NTX0lOVEVHRVIgPSAnWy1cXFxcK10/XFxcXGQrJT8nO1xuLy8gPGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtdmFsdWVzLyNudW1iZXItdmFsdWU+XG5jb25zdCBDU1NfTlVNQkVSID0gJ1stXFxcXCtdP1xcXFxkKlxcXFwuXFxcXGQrJT8nO1xuLy8gQWxsb3cgcG9zaXRpdmUvbmVnYXRpdmUgaW50ZWdlci9udW1iZXIuICBEb24ndCBjYXB0dXJlIHRoZSBlaXRoZXIvb3IsIGp1c3QgdGhlIGVudGlyZSBvdXRjb21lLlxuY29uc3QgQ1NTX1VOSVQgPSBgKD86JHtDU1NfTlVNQkVSfSl8KD86JHtDU1NfSU5URUdFUn0pYDtcbi8vIEFjdHVhbCBtYXRjaGluZy5cbi8vIFBhcmVudGhlc2VzIGFuZCBjb21tYXMgYXJlIG9wdGlvbmFsLCBidXQgbm90IHJlcXVpcmVkLlxuLy8gV2hpdGVzcGFjZSBjYW4gdGFrZSB0aGUgcGxhY2Ugb2YgY29tbWFzIG9yIG9wZW5pbmcgcGFyZW5cbmNvbnN0IFBFUk1JU1NJVkVfTUFUQ0gzID0gYFtcXFxcc3xcXFxcKF0rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlcXFxccypcXFxcKT9gO1xuY29uc3QgUEVSTUlTU0lWRV9NQVRDSDQgPSBgW1xcXFxzfFxcXFwoXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pXFxcXHMqXFxcXCk/YDtcbmNvbnN0IG1hdGNoZXJzID0ge1xuICAgIENTU19VTklUOiBuZXcgUmVnRXhwKENTU19VTklUKSxcbiAgICByZ2I6IG5ldyBSZWdFeHAoJ3JnYicgKyBQRVJNSVNTSVZFX01BVENIMyksXG4gICAgcmdiYTogbmV3IFJlZ0V4cCgncmdiYScgKyBQRVJNSVNTSVZFX01BVENINCksXG4gICAgaHNsOiBuZXcgUmVnRXhwKCdoc2wnICsgUEVSTUlTU0lWRV9NQVRDSDMpLFxuICAgIGhzbGE6IG5ldyBSZWdFeHAoJ2hzbGEnICsgUEVSTUlTU0lWRV9NQVRDSDQpLFxuICAgIGhzdjogbmV3IFJlZ0V4cCgnaHN2JyArIFBFUk1JU1NJVkVfTUFUQ0gzKSxcbiAgICBoc3ZhOiBuZXcgUmVnRXhwKCdoc3ZhJyArIFBFUk1JU1NJVkVfTUFUQ0g0KSxcbiAgICBoZXgzOiAvXiM/KFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pJC8sXG4gICAgaGV4NjogL14jPyhbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KSQvLFxuICAgIGhleDQ6IC9eIz8oWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pJC8sXG4gICAgaGV4ODogL14jPyhbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkkLyxcbn07XG4vKipcbiAqIFBlcm1pc3NpdmUgc3RyaW5nIHBhcnNpbmcuICBUYWtlIGluIGEgbnVtYmVyIG9mIGZvcm1hdHMsIGFuZCBvdXRwdXQgYW4gb2JqZWN0XG4gKiBiYXNlZCBvbiBkZXRlY3RlZCBmb3JtYXQuICBSZXR1cm5zIGB7IHIsIGcsIGIgfWAgb3IgYHsgaCwgcywgbCB9YCBvciBgeyBoLCBzLCB2fWBcbiAqL1xuZnVuY3Rpb24gc3RyaW5nSW5wdXRUb09iamVjdChjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNvbG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBuYW1lZCA9IGZhbHNlO1xuICAgIGlmIChuYW1lc1tjb2xvcl0pIHtcbiAgICAgICAgY29sb3IgPSBuYW1lc1tjb2xvcl07XG4gICAgICAgIG5hbWVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29sb3IgPT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICAgICAgcmV0dXJuIHsgcjogMCwgZzogMCwgYjogMCwgYTogMCwgZm9ybWF0OiAnbmFtZScgfTtcbiAgICB9XG4gICAgLy8gVHJ5IHRvIG1hdGNoIHN0cmluZyBpbnB1dCB1c2luZyByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgIC8vIEtlZXAgbW9zdCBvZiB0aGUgbnVtYmVyIGJvdW5kaW5nIG91dCBvZiB0aGlzIGZ1bmN0aW9uIC0gZG9uJ3Qgd29ycnkgYWJvdXQgWzAsMV0gb3IgWzAsMTAwXSBvciBbMCwzNjBdXG4gICAgLy8gSnVzdCByZXR1cm4gYW4gb2JqZWN0IGFuZCBsZXQgdGhlIGNvbnZlcnNpb24gZnVuY3Rpb25zIGhhbmRsZSB0aGF0LlxuICAgIC8vIFRoaXMgd2F5IHRoZSByZXN1bHQgd2lsbCBiZSB0aGUgc2FtZSB3aGV0aGVyIHRoZSB0aW55Y29sb3IgaXMgaW5pdGlhbGl6ZWQgd2l0aCBzdHJpbmcgb3Igb2JqZWN0LlxuICAgIGxldCBtYXRjaCA9IG1hdGNoZXJzLnJnYi5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgcjogbWF0Y2hbMV0sIGc6IG1hdGNoWzJdLCBiOiBtYXRjaFszXSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLnJnYmEuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IHI6IG1hdGNoWzFdLCBnOiBtYXRjaFsyXSwgYjogbWF0Y2hbM10sIGE6IG1hdGNoWzRdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHNsLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIGw6IG1hdGNoWzNdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHNsYS5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgaDogbWF0Y2hbMV0sIHM6IG1hdGNoWzJdLCBsOiBtYXRjaFszXSwgYTogbWF0Y2hbNF0gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc3YuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IGg6IG1hdGNoWzFdLCBzOiBtYXRjaFsyXSwgdjogbWF0Y2hbM10gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc3ZhLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIHY6IG1hdGNoWzNdLCBhOiBtYXRjaFs0XSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhleDguZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSksXG4gICAgICAgICAgICBhOiBjb252ZXJ0SGV4VG9EZWNpbWFsKG1hdGNoWzRdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4OCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4Ni5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSksXG4gICAgICAgICAgICBnOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oZXg0LmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzFdICsgbWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdICsgbWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdICsgbWF0Y2hbM10pLFxuICAgICAgICAgICAgYTogY29udmVydEhleFRvRGVjaW1hbChtYXRjaFs0XSArIG1hdGNoWzRdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4OCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4My5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSArIG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50RnJvbUhleChtYXRjaFsyXSArIG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSArIG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgaXQgbG9va3MgbGlrZSBhIENTUyB1bml0XG4gKiAoc2VlIGBtYXRjaGVyc2AgYWJvdmUgZm9yIGRlZmluaXRpb24pLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkQ1NTVW5pdChjb2xvcikge1xuICAgIHJldHVybiAhIW1hdGNoZXJzLkNTU19VTklULmV4ZWMoU3RyaW5nKGNvbG9yKSk7XG59XG5cbmNsYXNzIFRpbnlDb2xvciB7XG4gICAgY29uc3RydWN0b3IoY29sb3IgPSAnJywgb3B0cyA9IHt9KSB7XG4gICAgICAgIC8vIElmIGlucHV0IGlzIGFscmVhZHkgYSB0aW55Y29sb3IsIHJldHVybiBpdHNlbGZcbiAgICAgICAgaWYgKGNvbG9yIGluc3RhbmNlb2YgVGlueUNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcmlnaW5hbElucHV0ID0gY29sb3I7XG4gICAgICAgIGNvbnN0IHJnYiA9IGlucHV0VG9SR0IoY29sb3IpO1xuICAgICAgICB0aGlzLm9yaWdpbmFsSW5wdXQgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5yID0gcmdiLnI7XG4gICAgICAgIHRoaXMuZyA9IHJnYi5nO1xuICAgICAgICB0aGlzLmIgPSByZ2IuYjtcbiAgICAgICAgdGhpcy5hID0gcmdiLmE7XG4gICAgICAgIHRoaXMucm91bmRBID0gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLmEpIC8gMTAwO1xuICAgICAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0IHx8IHJnYi5mb3JtYXQ7XG4gICAgICAgIHRoaXMuZ3JhZGllbnRUeXBlID0gb3B0cy5ncmFkaWVudFR5cGU7XG4gICAgICAgIC8vIERvbid0IGxldCB0aGUgcmFuZ2Ugb2YgWzAsMjU1XSBjb21lIGJhY2sgaW4gWzAsMV0uXG4gICAgICAgIC8vIFBvdGVudGlhbGx5IGxvc2UgYSBsaXR0bGUgYml0IG9mIHByZWNpc2lvbiBoZXJlLCBidXQgd2lsbCBmaXggaXNzdWVzIHdoZXJlXG4gICAgICAgIC8vIC41IGdldHMgaW50ZXJwcmV0ZWQgYXMgaGFsZiBvZiB0aGUgdG90YWwsIGluc3RlYWQgb2YgaGFsZiBvZiAxXG4gICAgICAgIC8vIElmIGl0IHdhcyBzdXBwb3NlZCB0byBiZSAxMjgsIHRoaXMgd2FzIGFscmVhZHkgdGFrZW4gY2FyZSBvZiBieSBgaW5wdXRUb1JnYmBcbiAgICAgICAgaWYgKHRoaXMuciA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuciA9IE1hdGgucm91bmQodGhpcy5yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5nIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5nID0gTWF0aC5yb3VuZCh0aGlzLmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmIgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLmIgPSBNYXRoLnJvdW5kKHRoaXMuYik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1ZhbGlkID0gcmdiLm9rO1xuICAgIH1cbiAgICBpc0RhcmsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJyaWdodG5lc3MoKSA8IDEyODtcbiAgICB9XG4gICAgaXNMaWdodCgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzRGFyaygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwZXJjZWl2ZWQgYnJpZ2h0bmVzcyBvZiB0aGUgY29sb3IsIGZyb20gMC0yNTUuXG4gICAgICovXG4gICAgZ2V0QnJpZ2h0bmVzcygpIHtcbiAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQUVSVCNjb2xvci1jb250cmFzdFxuICAgICAgICBjb25zdCByZ2IgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIHJldHVybiAocmdiLnIgKiAyOTkgKyByZ2IuZyAqIDU4NyArIHJnYi5iICogMTE0KSAvIDEwMDA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBlcmNlaXZlZCBsdW1pbmFuY2Ugb2YgYSBjb2xvciwgZnJvbSAwLTEuXG4gICAgICovXG4gICAgZ2V0THVtaW5hbmNlKCkge1xuICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy1XQ0FHMjAtMjAwODEyMTEvI3JlbGF0aXZlbHVtaW5hbmNlZGVmXG4gICAgICAgIGNvbnN0IHJnYiA9IHRoaXMudG9SZ2IoKTtcbiAgICAgICAgbGV0IFI7XG4gICAgICAgIGxldCBHO1xuICAgICAgICBsZXQgQjtcbiAgICAgICAgY29uc3QgUnNSR0IgPSByZ2IuciAvIDI1NTtcbiAgICAgICAgY29uc3QgR3NSR0IgPSByZ2IuZyAvIDI1NTtcbiAgICAgICAgY29uc3QgQnNSR0IgPSByZ2IuYiAvIDI1NTtcbiAgICAgICAgaWYgKFJzUkdCIDw9IDAuMDM5MjgpIHtcbiAgICAgICAgICAgIFIgPSBSc1JHQiAvIDEyLjkyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgUiA9IE1hdGgucG93KChSc1JHQiArIDAuMDU1KSAvIDEuMDU1LCAyLjQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChHc1JHQiA8PSAwLjAzOTI4KSB7XG4gICAgICAgICAgICBHID0gR3NSR0IgLyAxMi45MjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIEcgPSBNYXRoLnBvdygoR3NSR0IgKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQnNSR0IgPD0gMC4wMzkyOCkge1xuICAgICAgICAgICAgQiA9IEJzUkdCIC8gMTIuOTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBCID0gTWF0aC5wb3coKEJzUkdCICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDAuMjEyNiAqIFIgKyAwLjcxNTIgKiBHICsgMC4wNzIyICogQjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYWxwaGEgdmFsdWUgb24gdGhlIGN1cnJlbnQgY29sb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWxwaGEgLSBUaGUgbmV3IGFscGhhIHZhbHVlLiBUaGUgYWNjZXB0ZWQgcmFuZ2UgaXMgMC0xLlxuICAgICAqL1xuICAgIHNldEFscGhhKGFscGhhKSB7XG4gICAgICAgIHRoaXMuYSA9IGJvdW5kQWxwaGEoYWxwaGEpO1xuICAgICAgICB0aGlzLnJvdW5kQSA9IE1hdGgucm91bmQoMTAwICogdGhpcy5hKSAvIDEwMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIEhTVkEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvSHN2KCkge1xuICAgICAgICBjb25zdCBoc3YgPSByZ2JUb0hzdih0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHsgaDogaHN2LmggKiAzNjAsIHM6IGhzdi5zLCB2OiBoc3YudiwgYTogdGhpcy5hIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhzdmEgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAgICogXCJoc3ZhKHh4eCwgeHh4LCB4eHgsIHh4KVwiLlxuICAgICAqL1xuICAgIHRvSHN2U3RyaW5nKCkge1xuICAgICAgICBjb25zdCBoc3YgPSByZ2JUb0hzdih0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgY29uc3QgaCA9IE1hdGgucm91bmQoaHN2LmggKiAzNjApO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5yb3VuZChoc3YucyAqIDEwMCk7XG4gICAgICAgIGNvbnN0IHYgPSBNYXRoLnJvdW5kKGhzdi52ICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGBoc3YoJHtofSwgJHtzfSUsICR7dn0lKWAgOiBgaHN2YSgke2h9LCAke3N9JSwgJHt2fSUsICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIEhTTEEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvSHNsKCkge1xuICAgICAgICBjb25zdCBoc2wgPSByZ2JUb0hzbCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHsgaDogaHNsLmggKiAzNjAsIHM6IGhzbC5zLCBsOiBoc2wubCwgYTogdGhpcy5hIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhzbGEgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAgICogXCJoc2xhKHh4eCwgeHh4LCB4eHgsIHh4KVwiLlxuICAgICAqL1xuICAgIHRvSHNsU3RyaW5nKCkge1xuICAgICAgICBjb25zdCBoc2wgPSByZ2JUb0hzbCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgY29uc3QgaCA9IE1hdGgucm91bmQoaHNsLmggKiAzNjApO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5yb3VuZChoc2wucyAqIDEwMCk7XG4gICAgICAgIGNvbnN0IGwgPSBNYXRoLnJvdW5kKGhzbC5sICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGBoc2woJHtofSwgJHtzfSUsICR7bH0lKWAgOiBgaHNsYSgke2h9LCAke3N9JSwgJHtsfSUsICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhleCB2YWx1ZSBvZiB0aGUgY29sb3IuXG4gICAgICogQHBhcmFtIGFsbG93M0NoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byAzIGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleChhbGxvdzNDaGFyID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHJnYlRvSGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIGFsbG93M0NoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggdmFsdWUgb2YgdGhlIGNvbG9yIC13aXRoIGEgIyBhcHBlbmVkLlxuICAgICAqIEBwYXJhbSBhbGxvdzNDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gMyBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXhTdHJpbmcoYWxsb3czQ2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiAnIycgKyB0aGlzLnRvSGV4KGFsbG93M0NoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggOCB2YWx1ZSBvZiB0aGUgY29sb3IuXG4gICAgICogQHBhcmFtIGFsbG93NENoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byA0IGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleDgoYWxsb3c0Q2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiByZ2JhVG9IZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdGhpcy5hLCBhbGxvdzRDaGFyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaGV4IDggdmFsdWUgb2YgdGhlIGNvbG9yIC13aXRoIGEgIyBhcHBlbmVkLlxuICAgICAqIEBwYXJhbSBhbGxvdzRDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gNCBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXg4U3RyaW5nKGFsbG93NENoYXIgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gJyMnICsgdGhpcy50b0hleDgoYWxsb3c0Q2hhcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIFJHQkEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvUmdiKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogTWF0aC5yb3VuZCh0aGlzLnIpLFxuICAgICAgICAgICAgZzogTWF0aC5yb3VuZCh0aGlzLmcpLFxuICAgICAgICAgICAgYjogTWF0aC5yb3VuZCh0aGlzLmIpLFxuICAgICAgICAgICAgYTogdGhpcy5hLFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBSR0JBIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZyB3aXRoIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICAgICAqIFwiUkdCQSh4eHgsIHh4eCwgeHh4LCB4eClcIi5cbiAgICAgKi9cbiAgICB0b1JnYlN0cmluZygpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucm91bmQodGhpcy5yKTtcbiAgICAgICAgY29uc3QgZyA9IE1hdGgucm91bmQodGhpcy5nKTtcbiAgICAgICAgY29uc3QgYiA9IE1hdGgucm91bmQodGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgIDogYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHt0aGlzLnJvdW5kQX0pYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb2JqZWN0IGFzIGEgUkdCQSBvYmplY3QuXG4gICAgICovXG4gICAgdG9QZXJjZW50YWdlUmdiKCkge1xuICAgICAgICBjb25zdCBmbXQgPSAoeCkgPT4gTWF0aC5yb3VuZChib3VuZDAxKHgsIDI1NSkgKiAxMDApICsgJyUnO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogZm10KHRoaXMuciksXG4gICAgICAgICAgICBnOiBmbXQodGhpcy5nKSxcbiAgICAgICAgICAgIGI6IGZtdCh0aGlzLmIpLFxuICAgICAgICAgICAgYTogdGhpcy5hLFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBSR0JBIHJlbGF0aXZlIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZ1xuICAgICAqL1xuICAgIHRvUGVyY2VudGFnZVJnYlN0cmluZygpIHtcbiAgICAgICAgY29uc3Qgcm5kID0gKHgpID0+IE1hdGgucm91bmQoYm91bmQwMSh4LCAyNTUpICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMVxuICAgICAgICAgICAgPyBgcmdiKCR7cm5kKHRoaXMucil9JSwgJHtybmQodGhpcy5nKX0lLCAke3JuZCh0aGlzLmIpfSUpYFxuICAgICAgICAgICAgOiBgcmdiYSgke3JuZCh0aGlzLnIpfSUsICR7cm5kKHRoaXMuZyl9JSwgJHtybmQodGhpcy5iKX0lLCAke3RoaXMucm91bmRBfSlgO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGUgJ3JlYWwnIG5hbWUgb2YgdGhlIGNvbG9yIC1pZiB0aGVyZSBpcyBvbmUuXG4gICAgICovXG4gICAgdG9OYW1lKCkge1xuICAgICAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5hIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhleCA9ICcjJyArIHJnYlRvSGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIGZhbHNlKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMobmFtZXMpKSB7XG4gICAgICAgICAgICBpZiAobmFtZXNba2V5XSA9PT0gaGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGZvcm1hdCB0byBiZSB1c2VkIHdoZW4gZGlzcGxheWluZyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKGZvcm1hdCkge1xuICAgICAgICBjb25zdCBmb3JtYXRTZXQgPSAhIWZvcm1hdDtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8IHRoaXMuZm9ybWF0O1xuICAgICAgICBsZXQgZm9ybWF0dGVkU3RyaW5nID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGhhc0FscGhhID0gdGhpcy5hIDwgMSAmJiB0aGlzLmEgPj0gMDtcbiAgICAgICAgY29uc3QgbmVlZHNBbHBoYUZvcm1hdCA9ICFmb3JtYXRTZXQgJiYgaGFzQWxwaGEgJiYgKGZvcm1hdC5zdGFydHNXaXRoKCdoZXgnKSB8fCBmb3JtYXQgPT09ICduYW1lJyk7XG4gICAgICAgIGlmIChuZWVkc0FscGhhRm9ybWF0KSB7XG4gICAgICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIFwidHJhbnNwYXJlbnRcIiwgYWxsIG90aGVyIG5vbi1hbHBoYSBmb3JtYXRzXG4gICAgICAgICAgICAvLyB3aWxsIHJldHVybiByZ2JhIHdoZW4gdGhlcmUgaXMgdHJhbnNwYXJlbmN5LlxuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ25hbWUnICYmIHRoaXMuYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvTmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAncmdiJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b1JnYlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdwcmdiJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b1BlcmNlbnRhZ2VSZ2JTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4JyB8fCBmb3JtYXQgPT09ICdoZXg2Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleFN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXgzJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleFN0cmluZyh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4NCcpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9IZXg4U3RyaW5nKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXg4Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleDhTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnbmFtZScpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9OYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hzbCcpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9Ic2xTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaHN2Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hzdlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWRTdHJpbmcgfHwgdGhpcy50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IodGhpcy50b1N0cmluZygpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlnaHRlbiB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQuIFByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIHdoaXRlLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgbGlnaHRlbihhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5sICs9IGFtb3VudCAvIDEwMDtcbiAgICAgICAgaHNsLmwgPSBjbGFtcDAxKGhzbC5sKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQnJpZ2h0ZW4gdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgYnJpZ2h0ZW4oYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgcmdiID0gdGhpcy50b1JnYigpO1xuICAgICAgICByZ2IuciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcmdiLnIgLSBNYXRoLnJvdW5kKDI1NSAqIC0oYW1vdW50IC8gMTAwKSkpKTtcbiAgICAgICAgcmdiLmcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHJnYi5nIC0gTWF0aC5yb3VuZCgyNTUgKiAtKGFtb3VudCAvIDEwMCkpKSk7XG4gICAgICAgIHJnYi5iID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByZ2IuYiAtIE1hdGgucm91bmQoMjU1ICogLShhbW91bnQgLyAxMDApKSkpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihyZ2IpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEYXJrZW4gdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIFByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIGJsYWNrLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgZGFya2VuKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLmwgLT0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wubCA9IGNsYW1wMDEoaHNsLmwpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNaXggdGhlIGNvbG9yIHdpdGggcHVyZSB3aGl0ZSwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMCB3aWxsIGRvIG5vdGhpbmcsIHByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIHdoaXRlLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgdGludChhbW91bnQgPSAxMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taXgoJ3doaXRlJywgYW1vdW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWl4IHRoZSBjb2xvciB3aXRoIHB1cmUgYmxhY2ssIGZyb20gMCB0byAxMDAuXG4gICAgICogUHJvdmlkaW5nIDAgd2lsbCBkbyBub3RoaW5nLCBwcm92aWRpbmcgMTAwIHdpbGwgYWx3YXlzIHJldHVybiBibGFjay5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIHNoYWRlKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1peCgnYmxhY2snLCBhbW91bnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZXNhdHVyYXRlIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMTAwIHdpbGwgaXMgdGhlIHNhbWUgYXMgY2FsbGluZyBncmV5c2NhbGVcbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIGRlc2F0dXJhdGUoYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wucyAtPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAwMShoc2wucyk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdHVyYXRlIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIHNhdHVyYXRlKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLnMgKz0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wucyA9IGNsYW1wMDEoaHNsLnMpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21wbGV0ZWx5IGRlc2F0dXJhdGVzIGEgY29sb3IgaW50byBncmV5c2NhbGUuXG4gICAgICogU2FtZSBhcyBjYWxsaW5nIGBkZXNhdHVyYXRlKDEwMClgXG4gICAgICovXG4gICAgZ3JleXNjYWxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNhdHVyYXRlKDEwMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNwaW4gdGFrZXMgYSBwb3NpdGl2ZSBvciBuZWdhdGl2ZSBhbW91bnQgd2l0aGluIFstMzYwLCAzNjBdIGluZGljYXRpbmcgdGhlIGNoYW5nZSBvZiBodWUuXG4gICAgICogVmFsdWVzIG91dHNpZGUgb2YgdGhpcyByYW5nZSB3aWxsIGJlIHdyYXBwZWQgaW50byB0aGlzIHJhbmdlLlxuICAgICAqL1xuICAgIHNwaW4oYW1vdW50KSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaHVlID0gKGhzbC5oICsgYW1vdW50KSAlIDM2MDtcbiAgICAgICAgaHNsLmggPSBodWUgPCAwID8gMzYwICsgaHVlIDogaHVlO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICBtaXgoY29sb3IsIGFtb3VudCA9IDUwKSB7XG4gICAgICAgIGNvbnN0IHJnYjEgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIGNvbnN0IHJnYjIgPSBuZXcgVGlueUNvbG9yKGNvbG9yKS50b1JnYigpO1xuICAgICAgICBjb25zdCBwID0gYW1vdW50IC8gMTAwO1xuICAgICAgICBjb25zdCByZ2JhID0ge1xuICAgICAgICAgICAgcjogKHJnYjIuciAtIHJnYjEucikgKiBwICsgcmdiMS5yLFxuICAgICAgICAgICAgZzogKHJnYjIuZyAtIHJnYjEuZykgKiBwICsgcmdiMS5nLFxuICAgICAgICAgICAgYjogKHJnYjIuYiAtIHJnYjEuYikgKiBwICsgcmdiMS5iLFxuICAgICAgICAgICAgYTogKHJnYjIuYSAtIHJnYjEuYSkgKiBwICsgcmdiMS5hLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihyZ2JhKTtcbiAgICB9XG4gICAgYW5hbG9nb3VzKHJlc3VsdHMgPSA2LCBzbGljZXMgPSAzMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGNvbnN0IHBhcnQgPSAzNjAgLyBzbGljZXM7XG4gICAgICAgIGNvbnN0IHJldCA9IFt0aGlzXTtcbiAgICAgICAgZm9yIChoc2wuaCA9IChoc2wuaCAtICgocGFydCAqIHJlc3VsdHMpID4+IDEpICsgNzIwKSAlIDM2MDsgLS1yZXN1bHRzOykge1xuICAgICAgICAgICAgaHNsLmggPSAoaHNsLmggKyBwYXJ0KSAlIDM2MDtcbiAgICAgICAgICAgIHJldC5wdXNoKG5ldyBUaW55Q29sb3IoaHNsKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vaW5mdXNpb24valF1ZXJ5LXhjb2xvci9ibG9iL21hc3Rlci9qcXVlcnkueGNvbG9yLmpzXG4gICAgICovXG4gICAgY29tcGxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wuaCA9IChoc2wuaCArIDE4MCkgJSAzNjA7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIG1vbm9jaHJvbWF0aWMocmVzdWx0cyA9IDYpIHtcbiAgICAgICAgY29uc3QgaHN2ID0gdGhpcy50b0hzdigpO1xuICAgICAgICBjb25zdCBoID0gaHN2Lmg7XG4gICAgICAgIGNvbnN0IHMgPSBoc3YucztcbiAgICAgICAgbGV0IHYgPSBoc3YudjtcbiAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgIGNvbnN0IG1vZGlmaWNhdGlvbiA9IDEgLyByZXN1bHRzO1xuICAgICAgICB3aGlsZSAocmVzdWx0cy0tKSB7XG4gICAgICAgICAgICByZXMucHVzaChuZXcgVGlueUNvbG9yKHsgaCwgcywgdiB9KSk7XG4gICAgICAgICAgICB2ID0gKHYgKyBtb2RpZmljYXRpb24pICUgMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBzcGxpdGNvbXBsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaCA9IGhzbC5oO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIG5ldyBUaW55Q29sb3IoeyBoOiAoaCArIDcyKSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pLFxuICAgICAgICAgICAgbmV3IFRpbnlDb2xvcih7IGg6IChoICsgMjE2KSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICB0cmlhZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9seWFkKDMpO1xuICAgIH1cbiAgICB0ZXRyYWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvbHlhZCg0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IHBvbHlhZCBjb2xvcnMsIGxpa2UgKGZvciAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCBldGMuLi4pXG4gICAgICogbW9uYWQsIGR5YWQsIHRyaWFkLCB0ZXRyYWQsIHBlbnRhZCwgaGV4YWQsIGhlcHRhZCwgb2N0YWQsIGV0Yy4uLlxuICAgICAqL1xuICAgIHBvbHlhZChuKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaCA9IGhzbC5oO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbdGhpc107XG4gICAgICAgIGNvbnN0IGluY3JlbWVudCA9IDM2MCAvIG47XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGlueUNvbG9yKHsgaDogKGggKyBpICogaW5jcmVtZW50KSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBjb21wYXJlIGNvbG9yIHZzIGN1cnJlbnQgY29sb3JcbiAgICAgKi9cbiAgICBlcXVhbHMoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9SZ2JTdHJpbmcoKSA9PT0gbmV3IFRpbnlDb2xvcihjb2xvcikudG9SZ2JTdHJpbmcoKTtcbiAgICB9XG59XG5cbi8vIFJlYWRhYmlsaXR5IEZ1bmN0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyA8aHR0cDovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMtV0NBRzIwLTIwMDgxMjExLyNjb250cmFzdC1yYXRpb2RlZiAoV0NBRyBWZXJzaW9uIDIpXG4vKipcbiAqIEFLQSBgY29udHJhc3RgXG4gKlxuICogQW5hbHl6ZSB0aGUgMiBjb2xvcnMgYW5kIHJldHVybnMgdGhlIGNvbG9yIGNvbnRyYXN0IGRlZmluZWQgYnkgKFdDQUcgVmVyc2lvbiAyKVxuICovXG5mdW5jdGlvbiByZWFkYWJpbGl0eShjb2xvcjEsIGNvbG9yMikge1xuICAgIGNvbnN0IGMxID0gbmV3IFRpbnlDb2xvcihjb2xvcjEpO1xuICAgIGNvbnN0IGMyID0gbmV3IFRpbnlDb2xvcihjb2xvcjIpO1xuICAgIHJldHVybiAoKE1hdGgubWF4KGMxLmdldEx1bWluYW5jZSgpLCBjMi5nZXRMdW1pbmFuY2UoKSkgKyAwLjA1KSAvXG4gICAgICAgIChNYXRoLm1pbihjMS5nZXRMdW1pbmFuY2UoKSwgYzIuZ2V0THVtaW5hbmNlKCkpICsgMC4wNSkpO1xufVxuLyoqXG4gKiBFbnN1cmUgdGhhdCBmb3JlZ3JvdW5kIGFuZCBiYWNrZ3JvdW5kIGNvbG9yIGNvbWJpbmF0aW9ucyBtZWV0IFdDQUcyIGd1aWRlbGluZXMuXG4gKiBUaGUgdGhpcmQgYXJndW1lbnQgaXMgYW4gb2JqZWN0LlxuICogICAgICB0aGUgJ2xldmVsJyBwcm9wZXJ0eSBzdGF0ZXMgJ0FBJyBvciAnQUFBJyAtIGlmIG1pc3Npbmcgb3IgaW52YWxpZCwgaXQgZGVmYXVsdHMgdG8gJ0FBJztcbiAqICAgICAgdGhlICdzaXplJyBwcm9wZXJ0eSBzdGF0ZXMgJ2xhcmdlJyBvciAnc21hbGwnIC0gaWYgbWlzc2luZyBvciBpbnZhbGlkLCBpdCBkZWZhdWx0cyB0byAnc21hbGwnLlxuICogSWYgdGhlIGVudGlyZSBvYmplY3QgaXMgYWJzZW50LCBpc1JlYWRhYmxlIGRlZmF1bHRzIHRvIHtsZXZlbDpcIkFBXCIsc2l6ZTpcInNtYWxsXCJ9LlxuICpcbiAqIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBuZXcgVGlueUNvbG9yKCkuaXNSZWFkYWJsZSgnIzAwMCcsICcjMTExJykgPT4gZmFsc2VcbiAqIG5ldyBUaW55Q29sb3IoKS5pc1JlYWRhYmxlKCcjMDAwJywgJyMxMTEnLCB7IGxldmVsOiAnQUEnLCBzaXplOiAnbGFyZ2UnIH0pID0+IGZhbHNlXG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gaXNSZWFkYWJsZShjb2xvcjEsIGNvbG9yMiwgd2NhZzIgPSB7IGxldmVsOiAnQUEnLCBzaXplOiAnc21hbGwnIH0pIHtcbiAgICBjb25zdCByZWFkYWJpbGl0eUxldmVsID0gcmVhZGFiaWxpdHkoY29sb3IxLCBjb2xvcjIpO1xuICAgIHN3aXRjaCAoKHdjYWcyLmxldmVsIHx8ICdBQScpICsgKHdjYWcyLnNpemUgfHwgJ3NtYWxsJykpIHtcbiAgICAgICAgY2FzZSAnQUFzbWFsbCc6XG4gICAgICAgIGNhc2UgJ0FBQWxhcmdlJzpcbiAgICAgICAgICAgIHJldHVybiByZWFkYWJpbGl0eUxldmVsID49IDQuNTtcbiAgICAgICAgY2FzZSAnQUFsYXJnZSc6XG4gICAgICAgICAgICByZXR1cm4gcmVhZGFiaWxpdHlMZXZlbCA+PSAzO1xuICAgICAgICBjYXNlICdBQUFzbWFsbCc6XG4gICAgICAgICAgICByZXR1cm4gcmVhZGFiaWxpdHlMZXZlbCA+PSA3O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4vKipcbiAqIEdpdmVuIGEgYmFzZSBjb2xvciBhbmQgYSBsaXN0IG9mIHBvc3NpYmxlIGZvcmVncm91bmQgb3IgYmFja2dyb3VuZFxuICogY29sb3JzIGZvciB0aGF0IGJhc2UsIHJldHVybnMgdGhlIG1vc3QgcmVhZGFibGUgY29sb3IuXG4gKiBPcHRpb25hbGx5IHJldHVybnMgQmxhY2sgb3IgV2hpdGUgaWYgdGhlIG1vc3QgcmVhZGFibGUgY29sb3IgaXMgdW5yZWFkYWJsZS5cbiAqXG4gKiBAcGFyYW0gYmFzZUNvbG9yIC0gdGhlIGJhc2UgY29sb3IuXG4gKiBAcGFyYW0gY29sb3JMaXN0IC0gYXJyYXkgb2YgY29sb3JzIHRvIHBpY2sgdGhlIG1vc3QgcmVhZGFibGUgb25lIGZyb20uXG4gKiBAcGFyYW0gYXJncyAtIGFuZCBvYmplY3Qgd2l0aCBleHRyYSBhcmd1bWVudHNcbiAqXG4gKiBFeGFtcGxlXG4gKiBgYGB0c1xuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnIzEyMycsIFsnIzEyNFwiLCBcIiMxMjUnXSwgeyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6IGZhbHNlIH0pLnRvSGV4U3RyaW5nKCk7IC8vIFwiIzExMjI1NVwiXG4gKiBuZXcgVGlueUNvbG9yKCkubW9zdFJlYWRhYmxlKCcjMTIzJywgWycjMTI0XCIsIFwiIzEyNSddLHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOiB0cnVlIH0pLnRvSGV4U3RyaW5nKCk7ICAvLyBcIiNmZmZmZmZcIlxuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnI2E4MDE1YScsIFtcIiNmYWYzZjNcIl0sIHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOnRydWUsIGxldmVsOiAnQUFBJywgc2l6ZTogJ2xhcmdlJyB9KS50b0hleFN0cmluZygpOyAvLyBcIiNmYWYzZjNcIlxuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnI2E4MDE1YScsIFtcIiNmYWYzZjNcIl0sIHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOnRydWUsIGxldmVsOiAnQUFBJywgc2l6ZTogJ3NtYWxsJyB9KS50b0hleFN0cmluZygpOyAvLyBcIiNmZmZmZmZcIlxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIG1vc3RSZWFkYWJsZShiYXNlQ29sb3IsIGNvbG9yTGlzdCwgYXJncyA9IHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOiBmYWxzZSwgbGV2ZWw6ICdBQScsIHNpemU6ICdzbWFsbCcgfSkge1xuICAgIGxldCBiZXN0Q29sb3IgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSAwO1xuICAgIGNvbnN0IGluY2x1ZGVGYWxsYmFja0NvbG9ycyA9IGFyZ3MuaW5jbHVkZUZhbGxiYWNrQ29sb3JzO1xuICAgIGNvbnN0IGxldmVsID0gYXJncy5sZXZlbDtcbiAgICBjb25zdCBzaXplID0gYXJncy5zaXplO1xuICAgIGZvciAoY29uc3QgY29sb3Igb2YgY29sb3JMaXN0KSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID0gcmVhZGFiaWxpdHkoYmFzZUNvbG9yLCBjb2xvcik7XG4gICAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgICBiZXN0Q29sb3IgPSBuZXcgVGlueUNvbG9yKGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNSZWFkYWJsZShiYXNlQ29sb3IsIGJlc3RDb2xvciwgeyBsZXZlbCwgc2l6ZSB9KSB8fCAhaW5jbHVkZUZhbGxiYWNrQ29sb3JzKSB7XG4gICAgICAgIHJldHVybiBiZXN0Q29sb3I7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhcmdzLmluY2x1ZGVGYWxsYmFja0NvbG9ycyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gbW9zdFJlYWRhYmxlKGJhc2VDb2xvciwgWycjZmZmJywgJyMwMDAnXSwgYXJncyk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbG9yIHJlcHJlc2VudGVkIGFzIGEgTWljcm9zb2Z0IGZpbHRlciBmb3IgdXNlIGluIG9sZCB2ZXJzaW9ucyBvZiBJRS5cbiAqL1xuZnVuY3Rpb24gdG9Nc0ZpbHRlcihmaXJzdENvbG9yLCBzZWNvbmRDb2xvcikge1xuICAgIGNvbnN0IGNvbG9yID0gbmV3IFRpbnlDb2xvcihmaXJzdENvbG9yKTtcbiAgICBjb25zdCBoZXg4U3RyaW5nID0gJyMnICsgcmdiYVRvQXJnYkhleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCBjb2xvci5hKTtcbiAgICBsZXQgc2Vjb25kSGV4OFN0cmluZyA9IGhleDhTdHJpbmc7XG4gICAgY29uc3QgZ3JhZGllbnRUeXBlID0gY29sb3IuZ3JhZGllbnRUeXBlID8gJ0dyYWRpZW50VHlwZSA9IDEsICcgOiAnJztcbiAgICBpZiAoc2Vjb25kQ29sb3IpIHtcbiAgICAgICAgY29uc3QgcyA9IG5ldyBUaW55Q29sb3Ioc2Vjb25kQ29sb3IpO1xuICAgICAgICBzZWNvbmRIZXg4U3RyaW5nID0gJyMnICsgcmdiYVRvQXJnYkhleChzLnIsIHMuZywgcy5iLCBzLmEpO1xuICAgIH1cbiAgICByZXR1cm4gYHByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCgke2dyYWRpZW50VHlwZX1zdGFydENvbG9yc3RyPSR7aGV4OFN0cmluZ30sZW5kQ29sb3JzdHI9JHtzZWNvbmRIZXg4U3RyaW5nfSlgO1xufVxuXG4vKipcbiAqIElmIGlucHV0IGlzIGFuIG9iamVjdCwgZm9yY2UgMSBpbnRvIFwiMS4wXCIgdG8gaGFuZGxlIHJhdGlvcyBwcm9wZXJseVxuICogU3RyaW5nIGlucHV0IHJlcXVpcmVzIFwiMS4wXCIgYXMgaW5wdXQsIHNvIDEgd2lsbCBiZSB0cmVhdGVkIGFzIDFcbiAqL1xuZnVuY3Rpb24gZnJvbVJhdGlvKHJhdGlvLCBvcHRzKSB7XG4gICAgY29uc3QgbmV3Q29sb3IgPSB7XG4gICAgICAgIHI6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uciksXG4gICAgICAgIGc6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uZyksXG4gICAgICAgIGI6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uYiksXG4gICAgfTtcbiAgICBpZiAocmF0aW8uYSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0NvbG9yLmEgPSArcmF0aW8uYTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUaW55Q29sb3IobmV3Q29sb3IsIG9wdHMpO1xufVxuLyoqIG9sZCByYW5kb20gZnVuY3Rpb24gKi9cbmZ1bmN0aW9uIGxlZ2FjeVJhbmRvbSgpIHtcbiAgICByZXR1cm4gbmV3IFRpbnlDb2xvcih7XG4gICAgICAgIHI6IE1hdGgucmFuZG9tKCksXG4gICAgICAgIGc6IE1hdGgucmFuZG9tKCksXG4gICAgICAgIGI6IE1hdGgucmFuZG9tKCksXG4gICAgfSk7XG59XG5cbi8vIHJhbmRvbUNvbG9yIGJ5IERhdmlkIE1lcmZpZWxkIHVuZGVyIHRoZSBDQzAgbGljZW5zZVxuZnVuY3Rpb24gcmFuZG9tKG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gZ2VuZXJhdGUgbXVsdGlwbGUgY29sb3JzXG4gICAgaWYgKG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmNvdW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsQ29sb3JzID0gb3B0aW9ucy5jb3VudDtcbiAgICAgICAgY29uc3QgY29sb3JzID0gW107XG4gICAgICAgIG9wdGlvbnMuY291bnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHdoaWxlICh0b3RhbENvbG9ycyA+IGNvbG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHdlJ3JlIGdlbmVyYXRpbmcgbXVsdGlwbGUgY29sb3JzLFxuICAgICAgICAgICAgLy8gaW5jcmVtZW1lbnQgdGhlIHNlZWQuIE90aGVyd2lzZSB3ZSdkIGp1c3RcbiAgICAgICAgICAgIC8vIGdlbmVyYXRlIHRoZSBzYW1lIGNvbG9yIGVhY2ggdGltZS4uLlxuICAgICAgICAgICAgb3B0aW9ucy5jb3VudCA9IG51bGw7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zZWVkKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zZWVkICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb2xvcnMucHVzaChyYW5kb20ob3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMuY291bnQgPSB0b3RhbENvbG9ycztcbiAgICAgICAgcmV0dXJuIGNvbG9ycztcbiAgICB9XG4gICAgLy8gRmlyc3Qgd2UgcGljayBhIGh1ZSAoSClcbiAgICBjb25zdCBoID0gcGlja0h1ZShvcHRpb25zLmh1ZSwgb3B0aW9ucy5zZWVkKTtcbiAgICAvLyBUaGVuIHVzZSBIIHRvIGRldGVybWluZSBzYXR1cmF0aW9uIChTKVxuICAgIGNvbnN0IHMgPSBwaWNrU2F0dXJhdGlvbihoLCBvcHRpb25zKTtcbiAgICAvLyBUaGVuIHVzZSBTIGFuZCBIIHRvIGRldGVybWluZSBicmlnaHRuZXNzIChCKS5cbiAgICBjb25zdCB2ID0gcGlja0JyaWdodG5lc3MoaCwgcywgb3B0aW9ucyk7XG4gICAgY29uc3QgcmVzID0geyBoLCBzLCB2IH07XG4gICAgaWYgKG9wdGlvbnMuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXMuYSA9IG9wdGlvbnMuYWxwaGE7XG4gICAgfVxuICAgIC8vIFRoZW4gd2UgcmV0dXJuIHRoZSBIU0IgY29sb3IgaW4gdGhlIGRlc2lyZWQgZm9ybWF0XG4gICAgcmV0dXJuIG5ldyBUaW55Q29sb3IocmVzKTtcbn1cbmZ1bmN0aW9uIHBpY2tIdWUoaHVlLCBzZWVkKSB7XG4gICAgY29uc3QgaHVlUmFuZ2UgPSBnZXRIdWVSYW5nZShodWUpO1xuICAgIGxldCByZXMgPSByYW5kb21XaXRoaW4oaHVlUmFuZ2UsIHNlZWQpO1xuICAgIC8vIEluc3RlYWQgb2Ygc3RvcmluZyByZWQgYXMgdHdvIHNlcGVyYXRlIHJhbmdlcyxcbiAgICAvLyB3ZSBncm91cCB0aGVtLCB1c2luZyBuZWdhdGl2ZSBudW1iZXJzXG4gICAgaWYgKHJlcyA8IDApIHtcbiAgICAgICAgcmVzID0gMzYwICsgcmVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gcGlja1NhdHVyYXRpb24oaHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaHVlID09PSAnbW9ub2Nocm9tZScpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmx1bWlub3NpdHkgPT09ICdyYW5kb20nKSB7XG4gICAgICAgIHJldHVybiByYW5kb21XaXRoaW4oWzAsIDEwMF0sIG9wdGlvbnMuc2VlZCk7XG4gICAgfVxuICAgIGNvbnN0IHNhdHVyYXRpb25SYW5nZSA9IGdldENvbG9ySW5mbyhodWUpLnNhdHVyYXRpb25SYW5nZTtcbiAgICBsZXQgc01pbiA9IHNhdHVyYXRpb25SYW5nZVswXTtcbiAgICBsZXQgc01heCA9IHNhdHVyYXRpb25SYW5nZVsxXTtcbiAgICBzd2l0Y2ggKG9wdGlvbnMubHVtaW5vc2l0eSkge1xuICAgICAgICBjYXNlICdicmlnaHQnOlxuICAgICAgICAgICAgc01pbiA9IDU1O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RhcmsnOlxuICAgICAgICAgICAgc01pbiA9IHNNYXggLSAxMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaWdodCc6XG4gICAgICAgICAgICBzTWF4ID0gNTU7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbVdpdGhpbihbc01pbiwgc01heF0sIG9wdGlvbnMuc2VlZCk7XG59XG5mdW5jdGlvbiBwaWNrQnJpZ2h0bmVzcyhILCBTLCBvcHRpb25zKSB7XG4gICAgbGV0IGJNaW4gPSBnZXRNaW5pbXVtQnJpZ2h0bmVzcyhILCBTKTtcbiAgICBsZXQgYk1heCA9IDEwMDtcbiAgICBzd2l0Y2ggKG9wdGlvbnMubHVtaW5vc2l0eSkge1xuICAgICAgICBjYXNlICdkYXJrJzpcbiAgICAgICAgICAgIGJNYXggPSBiTWluICsgMjA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGlnaHQnOlxuICAgICAgICAgICAgYk1pbiA9IChiTWF4ICsgYk1pbikgLyAyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JhbmRvbSc6XG4gICAgICAgICAgICBiTWluID0gMDtcbiAgICAgICAgICAgIGJNYXggPSAxMDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbVdpdGhpbihbYk1pbiwgYk1heF0sIG9wdGlvbnMuc2VlZCk7XG59XG5mdW5jdGlvbiBnZXRNaW5pbXVtQnJpZ2h0bmVzcyhILCBTKSB7XG4gICAgY29uc3QgbG93ZXJCb3VuZHMgPSBnZXRDb2xvckluZm8oSCkubG93ZXJCb3VuZHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb3dlckJvdW5kcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgY29uc3QgczEgPSBsb3dlckJvdW5kc1tpXVswXTtcbiAgICAgICAgY29uc3QgdjEgPSBsb3dlckJvdW5kc1tpXVsxXTtcbiAgICAgICAgY29uc3QgczIgPSBsb3dlckJvdW5kc1tpICsgMV1bMF07XG4gICAgICAgIGNvbnN0IHYyID0gbG93ZXJCb3VuZHNbaSArIDFdWzFdO1xuICAgICAgICBpZiAoUyA+PSBzMSAmJiBTIDw9IHMyKSB7XG4gICAgICAgICAgICBjb25zdCBtID0gKHYyIC0gdjEpIC8gKHMyIC0gczEpO1xuICAgICAgICAgICAgY29uc3QgYiA9IHYxIC0gbSAqIHMxO1xuICAgICAgICAgICAgcmV0dXJuIG0gKiBTICsgYjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGdldEh1ZVJhbmdlKGNvbG9ySW5wdXQpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChjb2xvcklucHV0LCAxMCk7XG4gICAgaWYgKCFOdW1iZXIuaXNOYU4obnVtKSAmJiBudW0gPCAzNjAgJiYgbnVtID4gMCkge1xuICAgICAgICByZXR1cm4gW251bSwgbnVtXTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb2xvcklucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBuYW1lZENvbG9yID0gYm91bmRzLmZpbmQobiA9PiBuLm5hbWUgPT09IGNvbG9ySW5wdXQpO1xuICAgICAgICBpZiAobmFtZWRDb2xvcikge1xuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBkZWZpbmVDb2xvcihuYW1lZENvbG9yKTtcbiAgICAgICAgICAgIGlmIChjb2xvci5odWVSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvci5odWVSYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVGlueUNvbG9yKGNvbG9ySW5wdXQpO1xuICAgICAgICBpZiAocGFyc2VkLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGh1ZSA9IHBhcnNlZC50b0hzdigpLmg7XG4gICAgICAgICAgICByZXR1cm4gW2h1ZSwgaHVlXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gWzAsIDM2MF07XG59XG5mdW5jdGlvbiBnZXRDb2xvckluZm8oaHVlKSB7XG4gICAgLy8gTWFwcyByZWQgY29sb3JzIHRvIG1ha2UgcGlja2luZyBodWUgZWFzaWVyXG4gICAgaWYgKGh1ZSA+PSAzMzQgJiYgaHVlIDw9IDM2MCkge1xuICAgICAgICBodWUgLT0gMzYwO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGJvdW5kIG9mIGJvdW5kcykge1xuICAgICAgICBjb25zdCBjb2xvciA9IGRlZmluZUNvbG9yKGJvdW5kKTtcbiAgICAgICAgaWYgKGNvbG9yLmh1ZVJhbmdlICYmIGh1ZSA+PSBjb2xvci5odWVSYW5nZVswXSAmJiBodWUgPD0gY29sb3IuaHVlUmFuZ2VbMV0pIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBFcnJvcignQ29sb3Igbm90IGZvdW5kJyk7XG59XG5mdW5jdGlvbiByYW5kb21XaXRoaW4ocmFuZ2UsIHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHJhbmdlWzBdICsgTWF0aC5yYW5kb20oKSAqIChyYW5nZVsxXSArIDEgLSByYW5nZVswXSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gU2VlZGVkIHJhbmRvbSBhbGdvcml0aG0gZnJvbSBodHRwOi8vaW5kaWVnYW1yLmNvbS9nZW5lcmF0ZS1yZXBlYXRhYmxlLXJhbmRvbS1udW1iZXJzLWluLWpzL1xuICAgICAgICBjb25zdCBtYXggPSByYW5nZVsxXSB8fCAxO1xuICAgICAgICBjb25zdCBtaW4gPSByYW5nZVswXSB8fCAwO1xuICAgICAgICBzZWVkID0gKHNlZWQgKiA5MzAxICsgNDkyOTcpICUgMjMzMjgwO1xuICAgICAgICBjb25zdCBybmQgPSBzZWVkIC8gMjMzMjgwLjA7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG1pbiArIHJuZCAqIChtYXggLSBtaW4pKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWZpbmVDb2xvcihib3VuZCkge1xuICAgIGNvbnN0IHNNaW4gPSBib3VuZC5sb3dlckJvdW5kc1swXVswXTtcbiAgICBjb25zdCBzTWF4ID0gYm91bmQubG93ZXJCb3VuZHNbYm91bmQubG93ZXJCb3VuZHMubGVuZ3RoIC0gMV1bMF07XG4gICAgY29uc3QgYk1pbiA9IGJvdW5kLmxvd2VyQm91bmRzW2JvdW5kLmxvd2VyQm91bmRzLmxlbmd0aCAtIDFdWzFdO1xuICAgIGNvbnN0IGJNYXggPSBib3VuZC5sb3dlckJvdW5kc1swXVsxXTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBib3VuZC5uYW1lLFxuICAgICAgICBodWVSYW5nZTogYm91bmQuaHVlUmFuZ2UsXG4gICAgICAgIGxvd2VyQm91bmRzOiBib3VuZC5sb3dlckJvdW5kcyxcbiAgICAgICAgc2F0dXJhdGlvblJhbmdlOiBbc01pbiwgc01heF0sXG4gICAgICAgIGJyaWdodG5lc3NSYW5nZTogW2JNaW4sIGJNYXhdLFxuICAgIH07XG59XG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuY29uc3QgYm91bmRzID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ21vbm9jaHJvbWUnLFxuICAgICAgICBodWVSYW5nZTogbnVsbCxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMCwgMF0sIFsxMDAsIDBdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3JlZCcsXG4gICAgICAgIGh1ZVJhbmdlOiBbLTI2LCAxOF0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbXG4gICAgICAgICAgICBbMjAsIDEwMF0sXG4gICAgICAgICAgICBbMzAsIDkyXSxcbiAgICAgICAgICAgIFs0MCwgODldLFxuICAgICAgICAgICAgWzUwLCA4NV0sXG4gICAgICAgICAgICBbNjAsIDc4XSxcbiAgICAgICAgICAgIFs3MCwgNzBdLFxuICAgICAgICAgICAgWzgwLCA2MF0sXG4gICAgICAgICAgICBbOTAsIDU1XSxcbiAgICAgICAgICAgIFsxMDAsIDUwXSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ29yYW5nZScsXG4gICAgICAgIGh1ZVJhbmdlOiBbMTksIDQ2XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMjAsIDEwMF0sIFszMCwgOTNdLCBbNDAsIDg4XSwgWzUwLCA4Nl0sIFs2MCwgODVdLCBbNzAsIDcwXSwgWzEwMCwgNzBdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3llbGxvdycsXG4gICAgICAgIGh1ZVJhbmdlOiBbNDcsIDYyXSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMjUsIDEwMF0sIFs0MCwgOTRdLCBbNTAsIDg5XSwgWzYwLCA4Nl0sIFs3MCwgODRdLCBbODAsIDgyXSwgWzkwLCA4MF0sIFsxMDAsIDc1XV0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdncmVlbicsXG4gICAgICAgIGh1ZVJhbmdlOiBbNjMsIDE3OF0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzMwLCAxMDBdLCBbNDAsIDkwXSwgWzUwLCA4NV0sIFs2MCwgODFdLCBbNzAsIDc0XSwgWzgwLCA2NF0sIFs5MCwgNTBdLCBbMTAwLCA0MF1dLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYmx1ZScsXG4gICAgICAgIGh1ZVJhbmdlOiBbMTc5LCAyNTddLFxuICAgICAgICBsb3dlckJvdW5kczogW1xuICAgICAgICAgICAgWzIwLCAxMDBdLFxuICAgICAgICAgICAgWzMwLCA4Nl0sXG4gICAgICAgICAgICBbNDAsIDgwXSxcbiAgICAgICAgICAgIFs1MCwgNzRdLFxuICAgICAgICAgICAgWzYwLCA2MF0sXG4gICAgICAgICAgICBbNzAsIDUyXSxcbiAgICAgICAgICAgIFs4MCwgNDRdLFxuICAgICAgICAgICAgWzkwLCAzOV0sXG4gICAgICAgICAgICBbMTAwLCAzNV0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdwdXJwbGUnLFxuICAgICAgICBodWVSYW5nZTogWzI1OCwgMjgyXSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtcbiAgICAgICAgICAgIFsyMCwgMTAwXSxcbiAgICAgICAgICAgIFszMCwgODddLFxuICAgICAgICAgICAgWzQwLCA3OV0sXG4gICAgICAgICAgICBbNTAsIDcwXSxcbiAgICAgICAgICAgIFs2MCwgNjVdLFxuICAgICAgICAgICAgWzcwLCA1OV0sXG4gICAgICAgICAgICBbODAsIDUyXSxcbiAgICAgICAgICAgIFs5MCwgNDVdLFxuICAgICAgICAgICAgWzEwMCwgNDJdLFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncGluaycsXG4gICAgICAgIGh1ZVJhbmdlOiBbMjgzLCAzMzRdLFxuICAgICAgICBsb3dlckJvdW5kczogW1syMCwgMTAwXSwgWzMwLCA5MF0sIFs0MCwgODZdLCBbNjAsIDg0XSwgWzgwLCA4MF0sIFs5MCwgNzVdLCBbMTAwLCA3M11dLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgeyBUaW55Q29sb3IsIG5hbWVzLCByZWFkYWJpbGl0eSwgaXNSZWFkYWJsZSwgbW9zdFJlYWRhYmxlLCB0b01zRmlsdGVyLCBmcm9tUmF0aW8sIGxlZ2FjeVJhbmRvbSwgaW5wdXRUb1JHQiwgc3RyaW5nSW5wdXRUb09iamVjdCwgaXNWYWxpZENTU1VuaXQsIHJhbmRvbSwgYm91bmRzIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aW55Y29sb3IuZXMyMDE1LmpzLm1hcFxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IFRpbnlDb2xvciB9IGZyb20gJ0BjdHJsL3Rpbnljb2xvcidcbmltcG9ydCB7IHF1ZXJ5UGFnZSB9IGZyb20gJy4vc2VhcmNoJ1xuaW1wb3J0IHsgZ2V0U3R5bGVzLCBjYW1lbFRvRGFzaCwgaXNPZmZCb3VuZHMsIGRlZXBFbGVtZW50RnJvbVBvaW50IH0gZnJvbSAnLi4vdXRpbGl0aWVzLydcblxuY29uc3Qgc3RhdGUgPSB7XG4gIGFjdGl2ZToge1xuICAgIHRpcDogIG51bGwsXG4gICAgdGFyZ2V0OiBudWxsLFxuICB9LFxuICB0aXBzOiBuZXcgTWFwKCksXG59XG5cbmNvbnN0IHNlcnZpY2VzID0ge31cblxuZXhwb3J0IGZ1bmN0aW9uIE1ldGFUaXAoe3NlbGVjdH0pIHtcbiAgc2VydmljZXMuc2VsZWN0b3JzID0ge3NlbGVjdH1cblxuICAkKCdib2R5Jykub24oJ21vdXNlbW92ZScsIG1vdXNlTW92ZSlcbiAgJCgnYm9keScpLm9uKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcblxuICBob3RrZXlzKCdlc2MnLCBfID0+IHJlbW92ZUFsbCgpKVxuXG4gIHJlc3RvcmVQaW5uZWRUaXBzKClcblxuICByZXR1cm4gKCkgPT4ge1xuICAgICQoJ2JvZHknKS5vZmYoJ21vdXNlbW92ZScsIG1vdXNlTW92ZSlcbiAgICAkKCdib2R5Jykub2ZmKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICBob3RrZXlzLnVuYmluZCgnZXNjJylcbiAgICBoaWRlQWxsKClcbiAgfVxufVxuXG5jb25zdCBtb3VzZU1vdmUgPSBlID0+IHtcbiAgY29uc3QgdGFyZ2V0ID0gZGVlcEVsZW1lbnRGcm9tUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpXG5cbiAgaWYgKGlzT2ZmQm91bmRzKHRhcmdldCkgfHwgdGFyZ2V0Lm5vZGVOYW1lID09PSAnVklTQlVHLU1FVEFUSVAnIHx8IHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcpKSB7IC8vIGFrYTogbW91c2Ugb3V0XG4gICAgaWYgKHN0YXRlLmFjdGl2ZS50aXApIHtcbiAgICAgIHdpcGUoe1xuICAgICAgICB0aXA6IHN0YXRlLmFjdGl2ZS50aXAsXG4gICAgICAgIGU6IHt0YXJnZXQ6IHN0YXRlLmFjdGl2ZS50YXJnZXR9LFxuICAgICAgfSlcbiAgICAgIGNsZWFyQWN0aXZlKClcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICB0b2dnbGVUYXJnZXRDdXJzb3IoZS5hbHRLZXksIHRhcmdldClcblxuICBzaG93VGlwKHRhcmdldCwgZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dUaXAodGFyZ2V0LCBlKSB7XG4gIGlmICghc3RhdGUuYWN0aXZlLnRpcCkgeyAvLyBjcmVhdGVcbiAgICBjb25zdCB0aXAgPSByZW5kZXIodGFyZ2V0KVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGlwKVxuXG4gICAgcG9zaXRpb25UaXAodGlwLCBlKVxuICAgIG9ic2VydmUoe3RpcCwgdGFyZ2V0fSlcblxuICAgIHN0YXRlLmFjdGl2ZS50aXAgICAgPSB0aXBcbiAgICBzdGF0ZS5hY3RpdmUudGFyZ2V0ID0gdGFyZ2V0XG4gIH1cbiAgZWxzZSBpZiAodGFyZ2V0ID09IHN0YXRlLmFjdGl2ZS50YXJnZXQpIHsgLy8gdXBkYXRlIHBvc2l0aW9uXG4gICAgLy8gdXBkYXRlIHBvc2l0aW9uXG4gICAgcG9zaXRpb25UaXAoc3RhdGUuYWN0aXZlLnRpcCwgZSlcbiAgfVxuICBlbHNlIHsgLy8gdXBkYXRlIGNvbnRlbnRcbiAgICByZW5kZXIodGFyZ2V0LCBzdGF0ZS5hY3RpdmUudGlwKVxuICAgIHN0YXRlLmFjdGl2ZS50YXJnZXQgPSB0YXJnZXRcbiAgICBwb3NpdGlvblRpcChzdGF0ZS5hY3RpdmUudGlwLCBlKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwb3NpdGlvblRpcCh0aXAsIGUpIHtcbiAgY29uc3QgeyBub3J0aCwgd2VzdCB9ID0gbW91c2VfcXVhZHJhbnQoZSlcbiAgY29uc3QgeyBsZWZ0LCB0b3AgfSAgID0gdGlwX3Bvc2l0aW9uKHRpcCwgZSwgbm9ydGgsIHdlc3QpXG5cbiAgdGlwLnN0eWxlLmxlZnQgID0gbGVmdFxuICB0aXAuc3R5bGUudG9wICAgPSB0b3BcblxuICB0aXAuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXJyb3cnLCBub3J0aFxuICAgID8gJ3ZhcigtLWFycm93LXVwKSdcbiAgICA6ICd2YXIoLS1hcnJvdy1kb3duKScpXG5cbiAgdGlwLnN0eWxlLnNldFByb3BlcnR5KCctLXNoYWRvdy1kaXJlY3Rpb24nLCBub3J0aFxuICAgID8gJ3ZhcigtLXNoYWRvdy11cCknXG4gICAgOiAndmFyKC0tc2hhZG93LWRvd24pJylcblxuICB0aXAuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXJyb3ctdG9wJywgIW5vcnRoXG4gICAgPyAnLTdweCdcbiAgICA6ICdjYWxjKDEwMCUgLSAxcHgpJylcblxuICB0aXAuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXJyb3ctbGVmdCcsIHdlc3RcbiAgICA/ICdjYWxjKDEwMCUgLSAxNXB4IC0gMTVweCknXG4gICAgOiAnMTVweCcpXG59XG5cbmNvbnN0IHJlc3RvcmVQaW5uZWRUaXBzID0gKCkgPT4ge1xuICBzdGF0ZS50aXBzLmZvckVhY2goKHt0aXB9LCB0YXJnZXQpID0+IHtcbiAgICB0aXAuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICByZW5kZXIodGFyZ2V0LCB0aXApXG4gICAgb2JzZXJ2ZSh7dGlwLCB0YXJnZXR9KVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGlkZUFsbCgpIHtcbiAgc3RhdGUudGlwcy5mb3JFYWNoKCh7dGlwfSwgdGFyZ2V0KSA9PlxuICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnKVxuXG4gIGlmIChzdGF0ZS5hY3RpdmUudGlwKSB7XG4gICAgc3RhdGUuYWN0aXZlLnRpcC5yZW1vdmUoKVxuICAgIGNsZWFyQWN0aXZlKClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQWxsKCkge1xuICBzdGF0ZS50aXBzLmZvckVhY2goKHt0aXB9LCB0YXJnZXQpID0+IHtcbiAgICB0aXAucmVtb3ZlKClcbiAgICB1bm9ic2VydmUoe3RpcCwgdGFyZ2V0fSlcbiAgfSlcblxuICAkKCdbZGF0YS1tZXRhdGlwXScpLmF0dHIoJ2RhdGEtbWV0YXRpcCcsIG51bGwpXG5cbiAgc3RhdGUudGlwcy5jbGVhcigpXG59XG5cbmNvbnN0IHJlbmRlciA9IChlbCwgdGlwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlzYnVnLW1ldGF0aXAnKSkgPT4ge1xuICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gIGNvbnN0IHN0eWxlcyA9IGdldFN0eWxlcyhlbClcbiAgICAubWFwKHN0eWxlID0+IE9iamVjdC5hc3NpZ24oc3R5bGUsIHtcbiAgICAgIHByb3A6IGNhbWVsVG9EYXNoKHN0eWxlLnByb3ApXG4gICAgfSkpXG4gICAgLmZpbHRlcihzdHlsZSA9PlxuICAgICAgc3R5bGUucHJvcC5pbmNsdWRlcygnZm9udC1mYW1pbHknKVxuICAgICAgICA/IGVsLm1hdGNoZXMoJ2gxLGgyLGgzLGg0LGg1LGg2LHAsYSxkYXRlLGNhcHRpb24sYnV0dG9uLGZpZ2NhcHRpb24sbmF2LGhlYWRlcixmb290ZXInKVxuICAgICAgICA6IHRydWVcbiAgICApXG4gICAgLm1hcChzdHlsZSA9PiB7XG4gICAgICBpZiAoc3R5bGUucHJvcC5pbmNsdWRlcygnY29sb3InKSB8fCBzdHlsZS5wcm9wLmluY2x1ZGVzKCdDb2xvcicpIHx8IHN0eWxlLnByb3AuaW5jbHVkZXMoJ2ZpbGwnKSB8fCBzdHlsZS5wcm9wLmluY2x1ZGVzKCdzdHJva2UnKSlcbiAgICAgICAgc3R5bGUudmFsdWUgPSBgPHNwYW4gY29sb3Igc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiR7c3R5bGUudmFsdWV9O1wiPjwvc3Bhbj4ke25ldyBUaW55Q29sb3Ioc3R5bGUudmFsdWUpLnRvSHNsU3RyaW5nKCl9YFxuXG4gICAgICBpZiAoc3R5bGUucHJvcC5pbmNsdWRlcygnZm9udC1mYW1pbHknKSAmJiBzdHlsZS52YWx1ZS5sZW5ndGggPiAyNSlcbiAgICAgICAgc3R5bGUudmFsdWUgPSBzdHlsZS52YWx1ZS5zbGljZSgwLDI1KSArICcuLi4nXG5cbiAgICAgIGlmIChzdHlsZS5wcm9wLmluY2x1ZGVzKCdncmlkLXRlbXBsYXRlLWFyZWFzJykpXG4gICAgICAgIHN0eWxlLnZhbHVlID0gc3R5bGUudmFsdWUucmVwbGFjZSgvXCIgXCIvZywgJ1wiPGJyPlwiJylcblxuICAgICAgaWYgKHN0eWxlLnByb3AuaW5jbHVkZXMoJ2JhY2tncm91bmQtaW1hZ2UnKSlcbiAgICAgICAgc3R5bGUudmFsdWUgPSBgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c3R5bGUudmFsdWUuc2xpY2Uoc3R5bGUudmFsdWUuaW5kZXhPZignKCcpICsgMiwgc3R5bGUudmFsdWUubGVuZ3RoIC0gMil9XCI+JHtzdHlsZS52YWx1ZS5zbGljZSgwLDI1KSArICcuLi4nfTwvYT5gXG5cbiAgICAgIC8vIGNoZWNrIGlmIHN0eWxlIGlzIGlubGluZSBzdHlsZSwgc2hvdyBpbmRpY2F0b3JcbiAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApKVxuICAgICAgICBzdHlsZS52YWx1ZSA9IGA8c3BhbiBsb2NhbC1jaGFuZ2U+JHtzdHlsZS52YWx1ZX08L3NwYW4+YFxuXG4gICAgICByZXR1cm4gc3R5bGVcbiAgICB9KVxuXG4gIGNvbnN0IGxvY2FsTW9kaWZpY2F0aW9ucyA9IHN0eWxlcy5maWx0ZXIoc3R5bGUgPT5cbiAgICBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApXG4gICAgICA/IDFcbiAgICAgIDogMClcblxuICBjb25zdCBub3RMb2NhbE1vZGlmaWNhdGlvbnMgPSBzdHlsZXMuZmlsdGVyKHN0eWxlID0+XG4gICAgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpICYmIGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKS5pbmNsdWRlcyhzdHlsZS5wcm9wKVxuICAgICAgPyAwXG4gICAgICA6IDEpXG5cbiAgdGlwLm1ldGEgPSB7XG4gICAgZWwsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGxvY2FsTW9kaWZpY2F0aW9ucyxcbiAgICBub3RMb2NhbE1vZGlmaWNhdGlvbnMsXG4gIH1cblxuICByZXR1cm4gdGlwXG59XG5cbmNvbnN0IG1vdXNlX3F1YWRyYW50ID0gZSA9PiAoe1xuICBub3J0aDogZS5jbGllbnRZID4gd2luZG93LmlubmVySGVpZ2h0IC8gMixcbiAgd2VzdDogIGUuY2xpZW50WCA+IHdpbmRvdy5pbm5lcldpZHRoIC8gMlxufSlcblxuY29uc3QgdGlwX3Bvc2l0aW9uID0gKG5vZGUsIGUsIG5vcnRoLCB3ZXN0KSA9PiAoe1xuICB0b3A6IGAke25vcnRoXG4gICAgPyBlLnBhZ2VZIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAyMFxuICAgIDogZS5wYWdlWSArIDI1fXB4YCxcbiAgbGVmdDogYCR7d2VzdFxuICAgID8gZS5wYWdlWCAtIG5vZGUuY2xpZW50V2lkdGggKyAyM1xuICAgIDogZS5wYWdlWCAtIDIxfXB4YCxcbn0pXG5cbmNvbnN0IGhhbmRsZUJsdXIgPSAoe3RhcmdldH0pID0+IHtcbiAgaWYgKCF0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKSAmJiBzdGF0ZS50aXBzLmhhcyh0YXJnZXQpKVxuICAgIHdpcGUoc3RhdGUudGlwcy5nZXQodGFyZ2V0KSlcbn1cblxuY29uc3Qgd2lwZSA9ICh7dGlwLCBlOnt0YXJnZXR9fSkgPT4ge1xuICB0aXAucmVtb3ZlKClcbiAgdW5vYnNlcnZlKHt0aXAsIHRhcmdldH0pXG4gIHN0YXRlLnRpcHMuZGVsZXRlKHRhcmdldClcbn1cblxuY29uc3QgdG9nZ2xlUGlubmVkID0gZSA9PiB7XG4gIGNvbnN0IHRhcmdldCA9IGRlZXBFbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKVxuXG4gIGlmIChlLmFsdEtleSAmJiAhdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJykpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnLCB0cnVlKVxuICAgIHN0YXRlLnRpcHMuc2V0KHRhcmdldCwge1xuICAgICAgdGlwOiBzdGF0ZS5hY3RpdmUudGlwLFxuICAgICAgZSxcbiAgICB9KVxuICAgIGNsZWFyQWN0aXZlKClcbiAgfVxuICBlbHNlIGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKSkge1xuICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcpXG4gICAgd2lwZShzdGF0ZS50aXBzLmdldCh0YXJnZXQpKVxuICB9XG59XG5cbmNvbnN0IGxpbmtRdWVyeUNsaWNrZWQgPSAoe2RldGFpbDp7IHRleHQsIGFjdGl2YXRvciB9fSkgPT4ge1xuICBpZiAoIXRleHQpIHJldHVyblxuXG4gIHF1ZXJ5UGFnZSgnW2RhdGEtcHNldWRvLXNlbGVjdF0nLCBlbCA9PlxuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wc2V1ZG8tc2VsZWN0JykpXG5cbiAgcXVlcnlQYWdlKHRleHQgKyAnOm5vdChbZGF0YS1zZWxlY3RlZF0pJywgZWwgPT5cbiAgICBhY3RpdmF0b3IgPT09ICdtb3VzZWVudGVyJ1xuICAgICAgPyBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHNldWRvLXNlbGVjdCcsIHRydWUpXG4gICAgICA6IHNlcnZpY2VzLnNlbGVjdG9ycy5zZWxlY3QoZWwpKVxufVxuXG5jb25zdCBsaW5rUXVlcnlIb3Zlck91dCA9IGUgPT4ge1xuICBxdWVyeVBhZ2UoJ1tkYXRhLXBzZXVkby1zZWxlY3RdJywgZWwgPT5cbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcHNldWRvLXNlbGVjdCcpKVxufVxuXG5jb25zdCB0b2dnbGVUYXJnZXRDdXJzb3IgPSAoa2V5LCB0YXJnZXQpID0+XG4gIGtleVxuICAgID8gdGFyZ2V0LnNldEF0dHJpYnV0ZSgnZGF0YS1waW5ob3ZlcicsIHRydWUpXG4gICAgOiB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJylcblxuY29uc3Qgb2JzZXJ2ZSA9ICh7dGlwLCB0YXJnZXR9KSA9PiB7XG4gICQodGlwKS5vbigncXVlcnknLCBsaW5rUXVlcnlDbGlja2VkKVxuICAkKHRpcCkub24oJ3VucXVlcnknLCBsaW5rUXVlcnlIb3Zlck91dClcbiAgJCh0YXJnZXQpLm9uKCdET01Ob2RlUmVtb3ZlZCcsIGhhbmRsZUJsdXIpXG59XG5cbmNvbnN0IHVub2JzZXJ2ZSA9ICh7dGlwLCB0YXJnZXR9KSA9PiB7XG4gICQodGlwKS5vZmYoJ3F1ZXJ5JywgbGlua1F1ZXJ5Q2xpY2tlZClcbiAgJCh0aXApLm9mZigndW5xdWVyeScsIGxpbmtRdWVyeUhvdmVyT3V0KVxuICAkKHRhcmdldCkub2ZmKCdET01Ob2RlUmVtb3ZlZCcsIGhhbmRsZUJsdXIpXG59XG5cbmNvbnN0IGNsZWFyQWN0aXZlID0gKCkgPT4ge1xuICBzdGF0ZS5hY3RpdmUudGlwICAgID0gbnVsbFxuICBzdGF0ZS5hY3RpdmUudGFyZ2V0ID0gbnVsbFxufVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IFRpbnlDb2xvciwgcmVhZGFiaWxpdHksIGlzUmVhZGFibGUgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5pbXBvcnQge1xuICBnZXRTdHlsZSwgZ2V0U3R5bGVzLCBpc09mZkJvdW5kcyxcbiAgZ2V0QTExeXMsIGdldFdDQUcyVGV4dFNpemUsIGdldENvbXB1dGVkQmFja2dyb3VuZENvbG9yLFxuICBkZWVwRWxlbWVudEZyb21Qb2ludFxufSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5jb25zdCBzdGF0ZSA9IHtcbiAgYWN0aXZlOiB7XG4gICAgdGlwOiAgbnVsbCxcbiAgICB0YXJnZXQ6IG51bGwsXG4gIH0sXG4gIHRpcHM6IG5ldyBNYXAoKSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFjY2Vzc2liaWxpdHkoKSB7XG4gICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuICAkKCdib2R5Jykub24oJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuXG4gIGhvdGtleXMoJ2VzYycsIF8gPT4gcmVtb3ZlQWxsKCkpXG5cbiAgcmVzdG9yZVBpbm5lZFRpcHMoKVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgJCgnYm9keScpLm9mZignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuICAgICQoJ2JvZHknKS5vZmYoJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgIGhvdGtleXMudW5iaW5kKCdlc2MnKVxuICAgIGhpZGVBbGwoKVxuICB9XG59XG5cbmNvbnN0IG1vdXNlTW92ZSA9IGUgPT4ge1xuICBjb25zdCB0YXJnZXQgPSBkZWVwRWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSlcblxuICBpZiAoaXNPZmZCb3VuZHModGFyZ2V0KSB8fCB0YXJnZXQubm9kZU5hbWUgPT09ICdWSVNCVUctQUxMWVRJUCcgfHwgdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1hbGx5dGlwJykpIHsgLy8gYWthOiBtb3VzZSBvdXRcbiAgICBpZiAoc3RhdGUuYWN0aXZlLnRpcCkge1xuICAgICAgd2lwZSh7XG4gICAgICAgIHRpcDogc3RhdGUuYWN0aXZlLnRpcCxcbiAgICAgICAgZToge3RhcmdldDogc3RhdGUuYWN0aXZlLnRhcmdldH0sXG4gICAgICB9KVxuICAgICAgY2xlYXJBY3RpdmUoKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIHRvZ2dsZVRhcmdldEN1cnNvcihlLmFsdEtleSwgdGFyZ2V0KVxuXG4gIHNob3dUaXAodGFyZ2V0LCBlKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd1RpcCh0YXJnZXQsIGUpIHtcbiAgaWYgKCFzdGF0ZS5hY3RpdmUudGlwKSB7IC8vIGNyZWF0ZVxuICAgIGNvbnN0IHRpcCA9IHJlbmRlcih0YXJnZXQpXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aXApXG5cbiAgICBwb3NpdGlvblRpcCh0aXAsIGUpXG4gICAgb2JzZXJ2ZSh7dGlwLCB0YXJnZXR9KVxuXG4gICAgc3RhdGUuYWN0aXZlLnRpcCAgICA9IHRpcFxuICAgIHN0YXRlLmFjdGl2ZS50YXJnZXQgPSB0YXJnZXRcbiAgfVxuICBlbHNlIGlmICh0YXJnZXQgPT0gc3RhdGUuYWN0aXZlLnRhcmdldCkgeyAvLyB1cGRhdGUgcG9zaXRpb25cbiAgICAvLyB1cGRhdGUgcG9zaXRpb25cbiAgICBwb3NpdGlvblRpcChzdGF0ZS5hY3RpdmUudGlwLCBlKVxuICB9XG4gIGVsc2UgeyAvLyB1cGRhdGUgY29udGVudFxuICAgIHJlbmRlcih0YXJnZXQsIHN0YXRlLmFjdGl2ZS50aXApXG4gICAgc3RhdGUuYWN0aXZlLnRhcmdldCA9IHRhcmdldFxuICAgIHBvc2l0aW9uVGlwKHN0YXRlLmFjdGl2ZS50aXAsIGUpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBvc2l0aW9uVGlwKHRpcCwgZSkge1xuICBjb25zdCB7IG5vcnRoLCB3ZXN0IH0gPSBtb3VzZV9xdWFkcmFudChlKVxuICBjb25zdCB7bGVmdCwgdG9wfSAgICAgPSB0aXBfcG9zaXRpb24odGlwLCBlLCBub3J0aCwgd2VzdClcblxuICB0aXAuc3R5bGUubGVmdCAgPSBsZWZ0XG4gIHRpcC5zdHlsZS50b3AgICA9IHRvcFxuXG4gIHRpcC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcnJvdycsIG5vcnRoXG4gICAgPyAndmFyKC0tYXJyb3ctdXApJ1xuICAgIDogJ3ZhcigtLWFycm93LWRvd24pJylcblxuICB0aXAuc3R5bGUuc2V0UHJvcGVydHkoJy0tc2hhZG93LWRpcmVjdGlvbicsIG5vcnRoXG4gICAgPyAndmFyKC0tc2hhZG93LXVwKSdcbiAgICA6ICd2YXIoLS1zaGFkb3ctZG93biknKVxuXG4gIHRpcC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcnJvdy10b3AnLCAhbm9ydGhcbiAgICA/ICctN3B4J1xuICAgIDogJ2NhbGMoMTAwJSAtIDFweCknKVxuXG4gIHRpcC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcnJvdy1sZWZ0Jywgd2VzdFxuICAgID8gJ2NhbGMoMTAwJSAtIDE1cHggLSAxNXB4KSdcbiAgICA6ICcxNXB4Jylcbn1cblxuY29uc3QgcmVzdG9yZVBpbm5lZFRpcHMgPSAoKSA9PiB7XG4gIHN0YXRlLnRpcHMuZm9yRWFjaCgoe3RpcH0sIHRhcmdldCkgPT4ge1xuICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIHJlbmRlcih0YXJnZXQsIHRpcClcbiAgICBvYnNlcnZlKHt0aXAsIHRhcmdldH0pXG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoaWRlQWxsKCkge1xuICBzdGF0ZS50aXBzLmZvckVhY2goKHt0aXB9LCB0YXJnZXQpID0+XG4gICAgdGlwLnN0eWxlLmRpc3BsYXkgPSAnbm9uZScpXG5cbiAgaWYgKHN0YXRlLmFjdGl2ZS50aXApIHtcbiAgICBzdGF0ZS5hY3RpdmUudGlwLnJlbW92ZSgpXG4gICAgY2xlYXJBY3RpdmUoKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gIHN0YXRlLnRpcHMuZm9yRWFjaCgoe3RpcH0sIHRhcmdldCkgPT4ge1xuICAgIHRpcC5yZW1vdmUoKVxuICAgIHVub2JzZXJ2ZSh7dGlwLCB0YXJnZXR9KVxuICB9KVxuXG4gICQoJ1tkYXRhLWFsbHl0aXBdJykuYXR0cignZGF0YS1hbGx5dGlwJywgbnVsbClcblxuICBzdGF0ZS50aXBzLmNsZWFyKClcbn1cblxuY29uc3QgcmVuZGVyID0gKGVsLCB0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aXNidWctYWxseScpKSA9PiB7XG4gIGNvbnN0IGNvbnRyYXN0X3Jlc3VsdHMgPSBkZXRlcm1pbmVDb2xvckNvbnRyYXN0KGVsKVxuICBjb25zdCBhbGx5X2F0dHJpYnV0ZXMgPSBnZXRBMTF5cyhlbClcblxuICBhbGx5X2F0dHJpYnV0ZXMubWFwKGFsbHkgPT5cbiAgICBhbGx5LnByb3AuaW5jbHVkZXMoJ2FsdCcpXG4gICAgICA/IGFsbHkudmFsdWUgPSBgPHNwYW4gdGV4dD4ke2FsbHkudmFsdWV9PC9zcGFuPmBcbiAgICAgIDogYWxseSlcblxuICBhbGx5X2F0dHJpYnV0ZXMubWFwKGFsbHkgPT5cbiAgICBhbGx5LnByb3AuaW5jbHVkZXMoJ3RpdGxlJylcbiAgICAgID8gYWxseS52YWx1ZSA9IGA8c3BhbiB0ZXh0IGxvbmdmb3JtPiR7YWxseS52YWx1ZX08L3NwYW4+YFxuICAgICAgOiBhbGx5KVxuXG4gIHRpcC5tZXRhID0ge1xuICAgIGVsLFxuICAgIGFsbHlfYXR0cmlidXRlcyxcbiAgICBjb250cmFzdF9yZXN1bHRzLFxuICB9XG5cbiAgcmV0dXJuIHRpcFxufVxuXG5jb25zdCBkZXRlcm1pbmVDb2xvckNvbnRyYXN0ID0gZWwgPT4ge1xuICAvLyBxdWVzdGlvbjogaG93IHRvIGtub3cgaWYgdGhlIGN1cnJlbnQgbm9kZSBpcyBhY3R1YWxseSBhIGJsYWNrIGJhY2tncm91bmQ/XG4gIC8vIHF1ZXN0aW9uOiBpcyB0aGVyZSBhbiBhcGkgZm9yIGNvbXBvc2l0ZWQgdmFsdWVzP1xuICBjb25zdCB0ZXh0ICAgICAgPSBnZXRTdHlsZShlbCwgJ2NvbG9yJylcbiAgY29uc3QgdGV4dFNpemUgID0gZ2V0V0NBRzJUZXh0U2l6ZShlbClcblxuICBsZXQgYmFja2dyb3VuZCAgPSBnZXRDb21wdXRlZEJhY2tncm91bmRDb2xvcihlbClcblxuICBjb25zdCBbIGFhX2NvbnRyYXN0LCBhYWFfY29udHJhc3QgXSA9IFtcbiAgICBpc1JlYWRhYmxlKGJhY2tncm91bmQsIHRleHQsIHsgbGV2ZWw6IFwiQUFcIiwgc2l6ZTogdGV4dFNpemUudG9Mb3dlckNhc2UoKSB9KSxcbiAgICBpc1JlYWRhYmxlKGJhY2tncm91bmQsIHRleHQsIHsgbGV2ZWw6IFwiQUFBXCIsIHNpemU6IHRleHRTaXplLnRvTG93ZXJDYXNlKCkgfSlcbiAgXVxuXG4gIHJldHVybiBgXG4gICAgPHNwYW4gcHJvcD5Db2xvciBjb250cmFzdDwvc3Bhbj5cbiAgICA8c3BhbiB2YWx1ZSBjb250cmFzdD5cbiAgICAgIDxzcGFuIHN0eWxlPVwiXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6JHtiYWNrZ3JvdW5kfTtcbiAgICAgICAgY29sb3I6JHt0ZXh0fTtcbiAgICAgIFwiPiR7TWF0aC5mbG9vcihyZWFkYWJpbGl0eShiYWNrZ3JvdW5kLCB0ZXh0KSAgKiAxMDApIC8gMTAwfTwvc3Bhbj5cbiAgICA8L3NwYW4+XG4gICAgPHNwYW4gcHJvcD7igLogQUEgJHt0ZXh0U2l6ZX08L3NwYW4+XG4gICAgPHNwYW4gdmFsdWUgc3R5bGU9XCIke2FhX2NvbnRyYXN0ID8gJ2NvbG9yOmdyZWVuOycgOiAnY29sb3I6cmVkJ31cIj4ke2FhX2NvbnRyYXN0ID8gJ+KckycgOiAnw5cnfTwvc3Bhbj5cbiAgICA8c3BhbiBwcm9wPuKAuiBBQUEgJHt0ZXh0U2l6ZX08L3NwYW4+XG4gICAgPHNwYW4gdmFsdWUgc3R5bGU9XCIke2FhYV9jb250cmFzdCA/ICdjb2xvcjpncmVlbjsnIDogJ2NvbG9yOnJlZCd9XCI+JHthYWFfY29udHJhc3QgPyAn4pyTJyA6ICfDlyd9PC9zcGFuPlxuICBgXG59XG5cbmNvbnN0IG1vdXNlX3F1YWRyYW50ID0gZSA9PiAoe1xuICBub3J0aDogZS5jbGllbnRZID4gd2luZG93LmlubmVySGVpZ2h0IC8gMixcbiAgd2VzdDogIGUuY2xpZW50WCA+IHdpbmRvdy5pbm5lcldpZHRoIC8gMlxufSlcblxuY29uc3QgdGlwX3Bvc2l0aW9uID0gKG5vZGUsIGUsIG5vcnRoLCB3ZXN0KSA9PiAoe1xuICB0b3A6IGAke25vcnRoXG4gICAgPyBlLnBhZ2VZIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAyMFxuICAgIDogZS5wYWdlWSArIDI1fXB4YCxcbiAgbGVmdDogYCR7d2VzdFxuICAgID8gZS5wYWdlWCAtIG5vZGUuY2xpZW50V2lkdGggKyAyM1xuICAgIDogZS5wYWdlWCAtIDIxfXB4YCxcbn0pXG5cbmNvbnN0IGhhbmRsZUJsdXIgPSAoe3RhcmdldH0pID0+IHtcbiAgaWYgKCF0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLWFsbHl0aXAnKSAmJiBzdGF0ZS50aXBzLmhhcyh0YXJnZXQpKVxuICAgIHdpcGUoc3RhdGUudGlwcy5nZXQodGFyZ2V0KSlcbn1cblxuY29uc3Qgd2lwZSA9ICh7dGlwLCBlOnt0YXJnZXR9fSkgPT4ge1xuICB0aXAucmVtb3ZlKClcbiAgdW5vYnNlcnZlKHt0aXAsIHRhcmdldH0pXG4gIHN0YXRlLnRpcHMuZGVsZXRlKHRhcmdldClcbn1cblxuY29uc3QgdG9nZ2xlUGlubmVkID0gZSA9PiB7XG4gIGNvbnN0IHRhcmdldCA9IGRlZXBFbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKVxuXG4gIGlmIChlLmFsdEtleSAmJiAhdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1hbGx5dGlwJykpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLWFsbHl0aXAnLCB0cnVlKVxuICAgIHN0YXRlLnRpcHMuc2V0KHRhcmdldCwge1xuICAgICAgdGlwOiBzdGF0ZS5hY3RpdmUudGlwLFxuICAgICAgZSxcbiAgICB9KVxuICAgIGNsZWFyQWN0aXZlKClcbiAgfVxuICBlbHNlIGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLWFsbHl0aXAnKSkge1xuICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtYWxseXRpcCcpXG4gICAgd2lwZShzdGF0ZS50aXBzLmdldCh0YXJnZXQpKVxuICB9XG59XG5cbmNvbnN0IHRvZ2dsZVRhcmdldEN1cnNvciA9IChrZXksIHRhcmdldCkgPT5cbiAga2V5XG4gICAgPyB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJywgdHJ1ZSlcbiAgICA6IHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGluaG92ZXInKVxuXG5jb25zdCBvYnNlcnZlID0gKHt0aXAsIHRhcmdldH0pID0+IHtcbiAgJCh0YXJnZXQpLm9uKCdET01Ob2RlUmVtb3ZlZCcsIGhhbmRsZUJsdXIpXG59XG5cbmNvbnN0IHVub2JzZXJ2ZSA9ICh7dGlwLCB0YXJnZXR9KSA9PiB7XG4gICQodGFyZ2V0KS5vZmYoJ0RPTU5vZGVSZW1vdmVkJywgaGFuZGxlQmx1cilcbn1cblxuY29uc3QgY2xlYXJBY3RpdmUgPSAoKSA9PiB7XG4gIHN0YXRlLmFjdGl2ZS50aXAgICAgPSBudWxsXG4gIHN0YXRlLmFjdGl2ZS50YXJnZXQgPSBudWxsXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuXG5pbXBvcnQgeyBjYW5Nb3ZlTGVmdCwgY2FuTW92ZVJpZ2h0LCBjYW5Nb3ZlVXAgfSBmcm9tICcuL21vdmUnXG5pbXBvcnQgeyB3YXRjaEltYWdlc0ZvclVwbG9hZCB9IGZyb20gJy4vaW1hZ2Vzd2FwJ1xuaW1wb3J0IHsgcXVlcnlQYWdlIH0gZnJvbSAnLi9zZWFyY2gnXG5pbXBvcnQgeyBjcmVhdGVNZWFzdXJlbWVudHMsIGNsZWFyTWVhc3VyZW1lbnRzIH0gZnJvbSAnLi9tZWFzdXJlbWVudHMnXG5pbXBvcnQgeyBjcmVhdGVNYXJnaW5WaXN1YWwgfSBmcm9tICcuL21hcmdpbidcbmltcG9ydCB7IGNyZWF0ZVBhZGRpbmdWaXN1YWwgfSBmcm9tICcuL3BhZGRpbmcnXG5cbmltcG9ydCB7IHNob3dUaXAgYXMgc2hvd01ldGFUaXAsIHJlbW92ZUFsbCBhcyByZW1vdmVBbGxNZXRhVGlwcyB9IGZyb20gJy4vbWV0YXRpcCdcbmltcG9ydCB7IHNob3dUaXAgYXMgc2hvd0FjY2Vzc2liaWxpdHlUaXAsIHJlbW92ZUFsbCBhcyByZW1vdmVBbGxBY2Nlc3NpYmlsaXR5VGlwcyB9IGZyb20gJy4vYWNjZXNzaWJpbGl0eSdcblxuaW1wb3J0IHtcbiAgbWV0YUtleSwgaHRtbFN0cmluZ1RvRG9tLCBjcmVhdGVDbGFzc25hbWUsXG4gIGlzT2ZmQm91bmRzLCBnZXRTdHlsZXMsIGRlZXBFbGVtZW50RnJvbVBvaW50LFxuICBpc1NlbGVjdG9yVmFsaWQsIGZpbmROZWFyZXN0Q2hpbGRFbGVtZW50LCBmaW5kTmVhcmVzdFBhcmVudEVsZW1lbnRcbn0gZnJvbSAnLi4vdXRpbGl0aWVzLydcblxuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdGFibGUoKSB7XG4gIGNvbnN0IHBhZ2UgICAgICAgICAgICAgID0gZG9jdW1lbnQuYm9keVxuICBsZXQgc2VsZWN0ZWQgICAgICAgICAgICA9IFtdXG4gIGxldCBzZWxlY3RlZENhbGxiYWNrcyAgID0gW11cbiAgbGV0IGxhYmVscyAgICAgICAgICAgICAgPSBbXVxuICBsZXQgaGFuZGxlcyAgICAgICAgICAgICA9IFtdXG5cbiAgY29uc3QgaG92ZXJfc3RhdGUgICAgICAgPSB7XG4gICAgdGFyZ2V0OiAgIG51bGwsXG4gICAgZWxlbWVudDogIG51bGwsXG4gICAgbGFiZWw6ICAgIG51bGwsXG4gIH1cblxuICBjb25zdCBsaXN0ZW4gPSAoKSA9PiB7XG4gICAgcGFnZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uX2NsaWNrLCB0cnVlKVxuICAgIHBhZ2UuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCBvbl9kYmxjbGljaywgdHJ1ZSlcblxuICAgIHBhZ2Uub24oJ3NlbGVjdHN0YXJ0Jywgb25fc2VsZWN0aW9uKVxuICAgIHBhZ2Uub24oJ21vdXNlbW92ZScsIG9uX2hvdmVyKVxuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29weScsIG9uX2NvcHkpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY3V0Jywgb25fY3V0KVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgb25fcGFzdGUpXG5cbiAgICB3YXRjaENvbW1hbmRLZXkoKVxuXG4gICAgaG90a2V5cyhgJHttZXRhS2V5fSthbHQrY2AsIG9uX2NvcHlfc3R5bGVzKVxuICAgIGhvdGtleXMoYCR7bWV0YUtleX0rYWx0K3ZgLCBlID0+IG9uX3Bhc3RlX3N0eWxlcygpKVxuICAgIGhvdGtleXMoJ2VzYycsIG9uX2VzYylcbiAgICBob3RrZXlzKGAke21ldGFLZXl9K2RgLCBvbl9kdXBsaWNhdGUpXG4gICAgaG90a2V5cygnYmFja3NwYWNlLGRlbCxkZWxldGUnLCBvbl9kZWxldGUpXG4gICAgaG90a2V5cygnYWx0K2RlbCxhbHQrYmFja3NwYWNlJywgb25fY2xlYXJzdHlsZXMpXG4gICAgaG90a2V5cyhgJHttZXRhS2V5fStlLCR7bWV0YUtleX0rc2hpZnQrZWAsIG9uX2V4cGFuZF9zZWxlY3Rpb24pXG4gICAgaG90a2V5cyhgJHttZXRhS2V5fStnLCR7bWV0YUtleX0rc2hpZnQrZ2AsIG9uX2dyb3VwKVxuICAgIGhvdGtleXMoJ3RhYixzaGlmdCt0YWIsZW50ZXIsc2hpZnQrZW50ZXInLCBvbl9rZXlib2FyZF90cmF2ZXJzYWwpXG4gICAgaG90a2V5cyhgJHttZXRhS2V5fStzaGlmdCtlbnRlcmAsIG9uX3NlbGVjdF9jaGlsZHJlbilcbiAgfVxuXG4gIGNvbnN0IHVubGlzdGVuID0gKCkgPT4ge1xuICAgIHBhZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbl9jbGljaywgdHJ1ZSlcbiAgICBwYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgb25fZGJsY2xpY2ssIHRydWUpXG5cbiAgICBwYWdlLm9mZignc2VsZWN0c3RhcnQnLCBvbl9zZWxlY3Rpb24pXG4gICAgcGFnZS5vZmYoJ21vdXNlbW92ZScsIG9uX2hvdmVyKVxuXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29weScsIG9uX2NvcHkpXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY3V0Jywgb25fY3V0KVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgb25fcGFzdGUpXG5cbiAgICBob3RrZXlzLnVuYmluZChgZXNjLCR7bWV0YUtleX0rZCxiYWNrc3BhY2UsZGVsLGRlbGV0ZSxhbHQrZGVsLGFsdCtiYWNrc3BhY2UsJHttZXRhS2V5fStlLCR7bWV0YUtleX0rc2hpZnQrZSwke21ldGFLZXl9K2csJHttZXRhS2V5fStzaGlmdCtnLHRhYixzaGlmdCt0YWIsZW50ZXIsc2hpZnQrZW50ZXJgKVxuICB9XG5cbiAgY29uc3Qgb25fY2xpY2sgPSBlID0+IHtcbiAgICBjb25zdCAkdGFyZ2V0ID0gZGVlcEVsZW1lbnRGcm9tUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpXG5cbiAgICBpZiAoaXNPZmZCb3VuZHMoJHRhcmdldCkgJiYgIXNlbGVjdGVkLmZpbHRlcihlbCA9PiBlbCA9PSAkdGFyZ2V0KS5sZW5ndGgpXG4gICAgICByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGlmICghZS5hbHRLZXkpIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoIWUuc2hpZnRLZXkpIHVuc2VsZWN0X2FsbCgpXG5cbiAgICBpZihlLnNoaWZ0S2V5ICYmICR0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJykpXG4gICAgICB1bnNlbGVjdCgkdGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpKVxuICAgIGVsc2VcbiAgICAgIHNlbGVjdCgkdGFyZ2V0KVxuICB9XG5cbiAgY29uc3QgdW5zZWxlY3QgPSBpZCA9PiB7XG4gICAgWy4uLmxhYmVscywgLi4uaGFuZGxlc11cbiAgICAgIC5maWx0ZXIobm9kZSA9PlxuICAgICAgICAgIG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJykgPT09IGlkKVxuICAgICAgICAuZm9yRWFjaChub2RlID0+XG4gICAgICAgICAgbm9kZS5yZW1vdmUoKSlcblxuICAgIHNlbGVjdGVkLmZpbHRlcihub2RlID0+XG4gICAgICBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpID09PSBpZClcbiAgICAgIC5mb3JFYWNoKG5vZGUgPT5cbiAgICAgICAgJChub2RlKS5hdHRyKHtcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZCc6ICAgICAgbnVsbCxcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZC1oaWRlJzogbnVsbCxcbiAgICAgICAgICAnZGF0YS1sYWJlbC1pZCc6ICAgICAgbnVsbCxcbiAgICAgICAgICAnZGF0YS1wc2V1ZG8tc2VsZWN0JzogICAgICAgICBudWxsLFxuICAgICAgICAgICdkYXRhLW1lYXN1cmluZyc6ICAgICBudWxsLFxuICAgICAgfSkpXG5cbiAgICBzZWxlY3RlZCA9IHNlbGVjdGVkLmZpbHRlcihub2RlID0+IG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJykgIT09IGlkKVxuXG4gICAgdGVsbFdhdGNoZXJzKClcbiAgfVxuXG4gIGNvbnN0IG9uX2RibGNsaWNrID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGlmIChpc09mZkJvdW5kcyhlLnRhcmdldCkpIHJldHVyblxuICAgICQoJ3Zpcy1idWcnKVswXS50b29sU2VsZWN0ZWQoJ3RleHQnKVxuICB9XG5cbiAgY29uc3Qgd2F0Y2hDb21tYW5kS2V5ID0gZSA9PiB7XG4gICAgbGV0IGRpZF9oaWRlID0gZmFsc2VcblxuICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChob3RrZXlzLmN0cmwgJiYgc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgICQoJ3Zpc2J1Zy1oYW5kbGVzLCB2aXNidWctbGFiZWwsIHZpc2J1Zy1ob3ZlcicpLmZvckVhY2goZWwgPT5cbiAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnKVxuXG4gICAgICAgIGRpZF9oaWRlID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIGRvY3VtZW50Lm9ua2V5dXAgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZGlkX2hpZGUpIHtcbiAgICAgICAgJCgndmlzYnVnLWhhbmRsZXMsIHZpc2J1Zy1sYWJlbCwgdmlzYnVnLWhvdmVyJykuZm9yRWFjaChlbCA9PlxuICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSBudWxsKVxuXG4gICAgICAgIGRpZF9oaWRlID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBvbl9lc2MgPSBfID0+XG4gICAgdW5zZWxlY3RfYWxsKClcblxuICBjb25zdCBvbl9kdXBsaWNhdGUgPSBlID0+IHtcbiAgICBjb25zdCByb290X25vZGUgPSBzZWxlY3RlZFswXVxuICAgIGlmICghcm9vdF9ub2RlKSByZXR1cm5cblxuICAgIGNvbnN0IGRlZXBfY2xvbmUgPSByb290X25vZGUuY2xvbmVOb2RlKHRydWUpXG4gICAgZGVlcF9jbG9uZS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc2VsZWN0ZWQnKVxuICAgIHJvb3Rfbm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkZWVwX2Nsb25lLCByb290X25vZGUubmV4dFNpYmxpbmcpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBjb25zdCBvbl9kZWxldGUgPSBlID0+XG4gICAgc2VsZWN0ZWQubGVuZ3RoICYmIGRlbGV0ZV9hbGwoKVxuXG4gIGNvbnN0IG9uX2NsZWFyc3R5bGVzID0gZSA9PlxuICAgIHNlbGVjdGVkLmZvckVhY2goZWwgPT5cbiAgICAgIGVsLmF0dHIoJ3N0eWxlJywgbnVsbCkpXG5cbiAgY29uc3Qgb25fY29weSA9IGUgPT4ge1xuICAgIC8vIGlmIHVzZXIgaGFzIHNlbGVjdGVkIHRleHQsIGRvbnQgdHJ5IHRvIGNvcHkgYW4gZWxlbWVudFxuICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKCkudG9TdHJpbmcoKS5sZW5ndGgpXG4gICAgICByZXR1cm5cblxuICAgIGlmIChzZWxlY3RlZFswXSAmJiB0aGlzLm5vZGVfY2xpcGJvYXJkICE9PSBzZWxlY3RlZFswXSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBsZXQgJG5vZGUgPSBzZWxlY3RlZFswXS5jbG9uZU5vZGUodHJ1ZSlcbiAgICAgICRub2RlLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcpXG4gICAgICB0aGlzLmNvcHlfYmFja3VwID0gJG5vZGUub3V0ZXJIVE1MXG4gICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9odG1sJywgdGhpcy5jb3B5X2JhY2t1cClcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbl9jdXQgPSBlID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRbMF0gJiYgdGhpcy5ub2RlX2NsaXBib2FyZCAhPT0gc2VsZWN0ZWRbMF0pIHtcbiAgICAgIGxldCAkbm9kZSA9IHNlbGVjdGVkWzBdLmNsb25lTm9kZSh0cnVlKVxuICAgICAgJG5vZGUucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJylcbiAgICAgIHRoaXMuY29weV9iYWNrdXAgPSAkbm9kZS5vdXRlckhUTUxcbiAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCd0ZXh0L2h0bWwnLCB0aGlzLmNvcHlfYmFja3VwKVxuICAgICAgc2VsZWN0ZWRbMF0ucmVtb3ZlKClcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbl9wYXN0ZSA9IGUgPT4ge1xuICAgIGNvbnN0IGNsaXBEYXRhID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQvaHRtbCcpXG4gICAgY29uc3QgcG90ZW50aWFsSFRNTCA9IGNsaXBEYXRhIHx8IHRoaXMuY29weV9iYWNrdXBcbiAgICBpZiAoc2VsZWN0ZWRbMF0gJiYgcG90ZW50aWFsSFRNTCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBzZWxlY3RlZFswXS5hcHBlbmRDaGlsZChcbiAgICAgICAgaHRtbFN0cmluZ1RvRG9tKHBvdGVudGlhbEhUTUwpKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9uX2NvcHlfc3R5bGVzID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5jb3BpZWRfc3R5bGVzID0gc2VsZWN0ZWQubWFwKGVsID0+XG4gICAgICBnZXRTdHlsZXMoZWwpKVxuICB9XG5cbiAgY29uc3Qgb25fcGFzdGVfc3R5bGVzID0gKGluZGV4ID0gMCkgPT5cbiAgICBzZWxlY3RlZC5mb3JFYWNoKGVsID0+IHtcbiAgICAgIHRoaXMuY29waWVkX3N0eWxlc1tpbmRleF1cbiAgICAgICAgLm1hcCgoe3Byb3AsIHZhbHVlfSkgPT5cbiAgICAgICAgICBlbC5zdHlsZVtwcm9wXSA9IHZhbHVlKVxuXG4gICAgICBpbmRleCA+PSB0aGlzLmNvcGllZF9zdHlsZXMubGVuZ3RoIC0gMVxuICAgICAgICA/IGluZGV4ID0gMFxuICAgICAgICA6IGluZGV4KytcbiAgICB9KVxuXG4gIGNvbnN0IG9uX2V4cGFuZF9zZWxlY3Rpb24gPSAoZSwge2tleX0pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGNvbnN0IFtyb290XSA9IHNlbGVjdGVkXG4gICAgaWYgKCFyb290KSByZXR1cm5cblxuICAgIGNvbnN0IHF1ZXJ5ID0gY29tYmluZU5vZGVOYW1lQW5kQ2xhc3Mocm9vdClcblxuICAgIGlmIChpc1NlbGVjdG9yVmFsaWQocXVlcnkpKVxuICAgICAgZXhwYW5kU2VsZWN0aW9uKHtcbiAgICAgICAgcXVlcnksXG4gICAgICAgIGFsbDoga2V5LmluY2x1ZGVzKCdzaGlmdCcpLFxuICAgICAgfSlcbiAgfVxuXG4gIGNvbnN0IG9uX2dyb3VwID0gKGUsIHtrZXl9KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoa2V5LnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykpIHtcbiAgICAgIGxldCAkc2VsZWN0ZWQgPSBbLi4uc2VsZWN0ZWRdXG4gICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgJHNlbGVjdGVkLnJldmVyc2UoKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgbGV0IGwgPSBlbC5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgd2hpbGUgKGVsLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgbm9kZSA9IGVsLmNoaWxkTm9kZXNbZWwuY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSAhPT0gJyN0ZXh0JylcbiAgICAgICAgICAgIHNlbGVjdChub2RlKVxuICAgICAgICAgIGVsLnBhcmVudE5vZGUucHJlcGVuZChub2RlKVxuICAgICAgICB9XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgc2VsZWN0ZWRbMF0ucGFyZW50Tm9kZS5wcmVwZW5kKFxuICAgICAgICBzZWxlY3RlZC5yZXZlcnNlKCkucmVkdWNlKChkaXYsIGVsKSA9PiB7XG4gICAgICAgICAgZGl2LmFwcGVuZENoaWxkKGVsKVxuICAgICAgICAgIHJldHVybiBkaXZcbiAgICAgICAgfSwgZGl2KVxuICAgICAgKVxuICAgICAgdW5zZWxlY3RfYWxsKClcbiAgICAgIHNlbGVjdChkaXYpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb25fc2VsZWN0aW9uID0gZSA9PlxuICAgICFpc09mZkJvdW5kcyhlLnRhcmdldClcbiAgICAmJiBzZWxlY3RlZC5sZW5ndGhcbiAgICAmJiBzZWxlY3RlZFswXS50ZXh0Q29udGVudCAhPSBlLnRhcmdldC50ZXh0Q29udGVudFxuICAgICYmIGUucHJldmVudERlZmF1bHQoKVxuXG4gIGNvbnN0IG9uX2tleWJvYXJkX3RyYXZlcnNhbCA9IChlLCB7a2V5fSkgPT4ge1xuICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGNvbnN0IHRhcmdldHMgPSBzZWxlY3RlZC5yZWR1Y2UoKGZsYXRfbl91bmlxdWUsIG5vZGUpID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnRfdG9fbGVmdCAgICAgPSBjYW5Nb3ZlTGVmdChub2RlKVxuICAgICAgY29uc3QgZWxlbWVudF90b19yaWdodCAgICA9IGNhbk1vdmVSaWdodChub2RlKVxuICAgICAgY29uc3QgaGFzX3BhcmVudF9lbGVtZW50ICA9IGZpbmROZWFyZXN0UGFyZW50RWxlbWVudChub2RlKVxuICAgICAgY29uc3QgaGFzX2NoaWxkX2VsZW1lbnRzICA9IGZpbmROZWFyZXN0Q2hpbGRFbGVtZW50KG5vZGUpXG5cbiAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ3NoaWZ0JykpIHtcbiAgICAgICAgaWYgKGtleS5pbmNsdWRlcygndGFiJykgJiYgZWxlbWVudF90b19sZWZ0KVxuICAgICAgICAgIGZsYXRfbl91bmlxdWUuYWRkKGVsZW1lbnRfdG9fbGVmdClcbiAgICAgICAgZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCdlbnRlcicpICYmIGhhc19wYXJlbnRfZWxlbWVudClcbiAgICAgICAgICBmbGF0X25fdW5pcXVlLmFkZChoYXNfcGFyZW50X2VsZW1lbnQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmbGF0X25fdW5pcXVlLmFkZChub2RlKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ3RhYicpICYmIGVsZW1lbnRfdG9fcmlnaHQpXG4gICAgICAgICAgZmxhdF9uX3VuaXF1ZS5hZGQoZWxlbWVudF90b19yaWdodClcbiAgICAgICAgZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCdlbnRlcicpICYmIGhhc19jaGlsZF9lbGVtZW50cylcbiAgICAgICAgICBmbGF0X25fdW5pcXVlLmFkZChoYXNfY2hpbGRfZWxlbWVudHMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmbGF0X25fdW5pcXVlLmFkZChub2RlKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmxhdF9uX3VuaXF1ZVxuICAgIH0sIG5ldyBTZXQoKSlcblxuICAgIGlmICh0YXJnZXRzLnNpemUpIHtcbiAgICAgIHVuc2VsZWN0X2FsbCgpXG4gICAgICB0YXJnZXRzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHNlbGVjdChub2RlKVxuICAgICAgICBzaG93X3RpcChub2RlKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBjb25zdCBzaG93X3RpcCA9IGVsID0+IHtcbiAgICBjb25zdCBhY3RpdmVfdG9vbCA9ICQoJ3Zpcy1idWcnKVswXS5hY3RpdmVUb29sXG4gICAgbGV0IHRpcEZhY3RvcnlcblxuICAgIGlmIChhY3RpdmVfdG9vbCA9PT0gJ2FjY2Vzc2liaWxpdHknKSB7XG4gICAgICByZW1vdmVBbGxBY2Nlc3NpYmlsaXR5VGlwcygpXG4gICAgICB0aXBGYWN0b3J5ID0gc2hvd0FjY2Vzc2liaWxpdHlUaXBcbiAgICB9XG4gICAgZWxzZSBpZiAoYWN0aXZlX3Rvb2wgPT09ICdpbnNwZWN0b3InKSB7XG4gICAgICByZW1vdmVBbGxNZXRhVGlwcygpXG4gICAgICB0aXBGYWN0b3J5ID0gc2hvd01ldGFUaXBcbiAgICB9XG5cbiAgICBpZiAoIXRpcEZhY3RvcnkpIHJldHVyblxuXG4gICAgY29uc3Qge3RvcCwgbGVmdH0gPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvbnN0IHsgcGFnZVlPZmZzZXQsIHBhZ2VYT2Zmc2V0IH0gPSB3aW5kb3dcblxuICAgIHRpcEZhY3RvcnkoZWwsIHtcbiAgICAgIGNsaWVudFk6ICB0b3AsXG4gICAgICBjbGllbnRYOiAgbGVmdCxcbiAgICAgIHBhZ2VZOiAgICBwYWdlWU9mZnNldCArIHRvcCAtIDEwLFxuICAgICAgcGFnZVg6ICAgIHBhZ2VYT2Zmc2V0ICsgbGVmdCArIDIwLFxuICAgIH0pXG4gIH1cblxuICBjb25zdCBvbl9ob3ZlciA9IGUgPT4ge1xuICAgIGNvbnN0ICR0YXJnZXQgPSBkZWVwRWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSlcbiAgICBjb25zdCB0b29sID0gJCgndmlzLWJ1ZycpWzBdLmFjdGl2ZVRvb2xcblxuICAgIGlmIChpc09mZkJvdW5kcygkdGFyZ2V0KSB8fCAkdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcpKVxuICAgICAgcmV0dXJuIGNsZWFySG92ZXIoKVxuXG4gICAgb3ZlcmxheUhvdmVyVUkoJHRhcmdldClcblxuICAgIGlmIChlLmFsdEtleSAmJiB0b29sID09PSAnZ3VpZGVzJyAmJiBzZWxlY3RlZC5sZW5ndGggPT09IDEgJiYgc2VsZWN0ZWRbMF0gIT0gJHRhcmdldCkge1xuICAgICAgJHRhcmdldC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbWVhc3VyaW5nJywgdHJ1ZSlcbiAgICAgIGNvbnN0IFskYW5jaG9yXSA9IHNlbGVjdGVkXG4gICAgICBjcmVhdGVNZWFzdXJlbWVudHMoeyRhbmNob3IsICR0YXJnZXR9KVxuICAgIH1cbiAgICBlbHNlIGlmICh0b29sID09PSAnbWFyZ2luJyAmJiAhaG92ZXJfc3RhdGUuZWxlbWVudC4kc2hhZG93LnF1ZXJ5U2VsZWN0b3IoJ3Zpc2J1Zy1ib3htb2RlbCcpKSB7XG4gICAgICBob3Zlcl9zdGF0ZS5sYWJlbC5zdHlsZS5vcGFjaXR5ID0gMFxuICAgICAgaG92ZXJfc3RhdGUuZWxlbWVudC4kc2hhZG93LmFwcGVuZENoaWxkKFxuICAgICAgICBjcmVhdGVNYXJnaW5WaXN1YWwoaG92ZXJfc3RhdGUudGFyZ2V0LCB0cnVlKSlcbiAgICB9XG4gICAgZWxzZSBpZiAodG9vbCA9PT0gJ3BhZGRpbmcnICYmICFob3Zlcl9zdGF0ZS5lbGVtZW50LiRzaGFkb3cucXVlcnlTZWxlY3RvcigndmlzYnVnLWJveG1vZGVsJykpIHtcbiAgICAgIGhvdmVyX3N0YXRlLmxhYmVsLnN0eWxlLm9wYWNpdHkgPSAwXG4gICAgICBob3Zlcl9zdGF0ZS5lbGVtZW50LiRzaGFkb3cuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGNyZWF0ZVBhZGRpbmdWaXN1YWwoaG92ZXJfc3RhdGUudGFyZ2V0LCB0cnVlKSlcbiAgICB9XG4gICAgZWxzZSBpZiAoJHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbWVhc3VyaW5nJykpIHtcbiAgICAgICR0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW1lYXN1cmluZycpXG4gICAgICBjbGVhck1lYXN1cmVtZW50cygpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2VsZWN0ID0gZWwgPT4ge1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcsIHRydWUpXG4gICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJywgbGFiZWxzLmxlbmd0aClcblxuICAgIGNsZWFySG92ZXIoKVxuXG4gICAgb3ZlcmxheU1ldGFVSShlbClcbiAgICBzZWxlY3RlZC51bnNoaWZ0KGVsKVxuICAgIHRlbGxXYXRjaGVycygpXG4gIH1cblxuICBjb25zdCBzZWxlY3Rpb24gPSAoKSA9PlxuICAgIHNlbGVjdGVkXG5cbiAgY29uc3QgdW5zZWxlY3RfYWxsID0gKCkgPT4ge1xuICAgIHNlbGVjdGVkXG4gICAgICAuZm9yRWFjaChlbCA9PlxuICAgICAgICAkKGVsKS5hdHRyKHtcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZCc6ICAgICAgbnVsbCxcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZC1oaWRlJzogbnVsbCxcbiAgICAgICAgICAnZGF0YS1sYWJlbC1pZCc6ICAgICAgbnVsbCxcbiAgICAgICAgICAnZGF0YS1wc2V1ZG8tc2VsZWN0JzogbnVsbCxcbiAgICAgICAgfSkpXG5cbiAgICAkKCdbZGF0YS1wc2V1ZG8tc2VsZWN0XScpLmZvckVhY2goaG92ZXIgPT5cbiAgICAgIGhvdmVyLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wc2V1ZG8tc2VsZWN0JykpXG5cbiAgICBBcnJheS5mcm9tKFtcbiAgICAgIC4uLiQoJ3Zpc2J1Zy1oYW5kbGVzJyksIFxuICAgICAgLi4uJCgndmlzYnVnLWxhYmVsJyksIFxuICAgICAgLi4uJCgndmlzYnVnLWhvdmVyJyksXG4gICAgXSkuZm9yRWFjaChlbCA9PlxuICAgICAgZWwucmVtb3ZlKCkpXG5cbiAgICBsYWJlbHMgICAgPSBbXVxuICAgIGhhbmRsZXMgICA9IFtdXG4gICAgc2VsZWN0ZWQgID0gW11cbiAgfVxuXG4gIGNvbnN0IGRlbGV0ZV9hbGwgPSAoKSA9PiB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfYWZ0ZXJfZGVsZXRlID0gc2VsZWN0ZWQubWFwKGVsID0+IHtcbiAgICAgIGlmIChjYW5Nb3ZlUmlnaHQoZWwpKSAgICAgcmV0dXJuIGNhbk1vdmVSaWdodChlbClcbiAgICAgIGVsc2UgaWYgKGNhbk1vdmVMZWZ0KGVsKSkgcmV0dXJuIGNhbk1vdmVMZWZ0KGVsKVxuICAgICAgZWxzZSBpZiAoZWwucGFyZW50Tm9kZSkgICByZXR1cm4gZWwucGFyZW50Tm9kZVxuICAgIH0pXG5cbiAgICBBcnJheS5mcm9tKFsuLi5zZWxlY3RlZCwgLi4ubGFiZWxzLCAuLi5oYW5kbGVzXSkuZm9yRWFjaChlbCA9PlxuICAgICAgZWwucmVtb3ZlKCkpXG5cbiAgICBsYWJlbHMgICAgPSBbXVxuICAgIGhhbmRsZXMgICA9IFtdXG4gICAgc2VsZWN0ZWQgID0gW11cblxuICAgIHNlbGVjdGVkX2FmdGVyX2RlbGV0ZS5mb3JFYWNoKGVsID0+XG4gICAgICBzZWxlY3QoZWwpKVxuICB9XG5cbiAgY29uc3QgZXhwYW5kU2VsZWN0aW9uID0gKHtxdWVyeSwgYWxsID0gZmFsc2V9KSA9PiB7XG4gICAgaWYgKGFsbCkge1xuICAgICAgY29uc3QgdW5zZWxlY3RlZHMgPSAkKHF1ZXJ5ICsgJzpub3QoW2RhdGEtc2VsZWN0ZWRdKScpXG4gICAgICB1bnNlbGVjdGVkcy5mb3JFYWNoKHNlbGVjdClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBwb3RlbnRpYWxzID0gJChxdWVyeSlcbiAgICAgIGlmICghcG90ZW50aWFscykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IFthbmNob3JdID0gc2VsZWN0ZWRcbiAgICAgIGNvbnN0IHJvb3Rfbm9kZV9pbmRleCA9IHBvdGVudGlhbHMucmVkdWNlKChpbmRleCwgbm9kZSwgaSkgPT5cbiAgICAgICAgbm9kZSA9PSBhbmNob3JcbiAgICAgICAgICA/IGluZGV4ID0gaVxuICAgICAgICAgIDogaW5kZXhcbiAgICAgICwgbnVsbClcblxuICAgICAgaWYgKHJvb3Rfbm9kZV9pbmRleCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoIXBvdGVudGlhbHNbcm9vdF9ub2RlX2luZGV4ICsgMV0pIHtcbiAgICAgICAgICBjb25zdCBwb3RlbnRpYWwgPSBwb3RlbnRpYWxzLmZpbHRlcihlbCA9PiAhZWwuYXR0cignZGF0YS1zZWxlY3RlZCcpKVswXVxuICAgICAgICAgIGlmIChwb3RlbnRpYWwpIHNlbGVjdChwb3RlbnRpYWwpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc2VsZWN0KHBvdGVudGlhbHNbcm9vdF9ub2RlX2luZGV4ICsgMV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBjb21iaW5lTm9kZU5hbWVBbmRDbGFzcyA9IG5vZGUgPT5cbiAgICBgJHtub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCl9JHtjcmVhdGVDbGFzc25hbWUobm9kZSl9YFxuXG4gIGNvbnN0IG92ZXJsYXlIb3ZlclVJID0gZWwgPT4ge1xuICAgIGlmIChob3Zlcl9zdGF0ZS50YXJnZXQgPT09IGVsKSByZXR1cm5cblxuICAgIGhvdmVyX3N0YXRlLnRhcmdldCAgPSBlbFxuICAgIGhvdmVyX3N0YXRlLmVsZW1lbnQgPSBjcmVhdGVIb3ZlcihlbClcbiAgICBob3Zlcl9zdGF0ZS5sYWJlbCA9IGNyZWF0ZUhvdmVyTGFiZWwoZWwsIGBcbiAgICAgIDxhIG5vZGU+JHtlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpfTwvYT5cbiAgICAgIDxhPiR7ZWwuaWQgJiYgJyMnICsgZWwuaWR9PC9hPlxuICAgICAgJHtjcmVhdGVDbGFzc25hbWUoZWwpLnNwbGl0KCcuJylcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IG5hbWUgIT0gJycpXG4gICAgICAgIC5yZWR1Y2UoKGxpbmtzLCBuYW1lKSA9PiBgXG4gICAgICAgICAgJHtsaW5rc31cbiAgICAgICAgICA8YT4uJHtuYW1lfTwvYT5cbiAgICAgICAgYCwgJycpXG4gICAgICB9XG4gICAgYClcbiAgfVxuXG4gIGNvbnN0IGNsZWFySG92ZXIgPSAoKSA9PiB7XG4gICAgaWYgKCFob3Zlcl9zdGF0ZS50YXJnZXQpIHJldHVyblxuXG4gICAgaG92ZXJfc3RhdGUuZWxlbWVudCAmJiBob3Zlcl9zdGF0ZS5lbGVtZW50LnJlbW92ZSgpXG4gICAgaG92ZXJfc3RhdGUubGFiZWwgJiYgaG92ZXJfc3RhdGUubGFiZWwucmVtb3ZlKClcblxuICAgIGhvdmVyX3N0YXRlLnRhcmdldCAgPSBudWxsXG4gICAgaG92ZXJfc3RhdGUuZWxlbWVudCA9IG51bGxcbiAgICBob3Zlcl9zdGF0ZS5sYWJlbCAgID0gbnVsbFxuICB9XG5cbiAgY29uc3Qgb3ZlcmxheU1ldGFVSSA9IGVsID0+IHtcbiAgICBsZXQgaGFuZGxlID0gY3JlYXRlSGFuZGxlKGVsKVxuICAgIGxldCBsYWJlbCAgPSBjcmVhdGVMYWJlbChlbCwgYFxuICAgICAgPGEgbm9kZT4ke2VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCl9PC9hPlxuICAgICAgPGE+JHtlbC5pZCAmJiAnIycgKyBlbC5pZH08L2E+XG4gICAgICAke2NyZWF0ZUNsYXNzbmFtZShlbCkuc3BsaXQoJy4nKVxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gbmFtZSAhPSAnJylcbiAgICAgICAgLnJlZHVjZSgobGlua3MsIG5hbWUpID0+IGBcbiAgICAgICAgICAke2xpbmtzfVxuICAgICAgICAgIDxhPi4ke25hbWV9PC9hPlxuICAgICAgICBgLCAnJylcbiAgICAgIH1cbiAgICBgKVxuXG4gICAgbGV0IG9ic2VydmVyICAgICAgICA9IGNyZWF0ZU9ic2VydmVyKGVsLCB7aGFuZGxlLGxhYmVsfSlcbiAgICBsZXQgcGFyZW50T2JzZXJ2ZXIgID0gY3JlYXRlT2JzZXJ2ZXIoZWwsIHtoYW5kbGUsbGFiZWx9KVxuXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbCwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pXG4gICAgcGFyZW50T2JzZXJ2ZXIub2JzZXJ2ZShlbC5wYXJlbnROb2RlLCB7IGNoaWxkTGlzdDp0cnVlLCBzdWJ0cmVlOnRydWUgfSlcblxuICAgICQobGFiZWwpLm9uKCdET01Ob2RlUmVtb3ZlZCcsIF8gPT4ge1xuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgICBwYXJlbnRPYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICB9KVxuICB9XG5cbiAgY29uc3Qgc2V0TGFiZWwgPSAoZWwsIGxhYmVsKSA9PlxuICAgIGxhYmVsLnVwZGF0ZSA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgY29uc3QgY3JlYXRlTGFiZWwgPSAoZWwsIHRleHQpID0+IHtcbiAgICBjb25zdCBpZCA9IHBhcnNlSW50KGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpKVxuXG4gICAgaWYgKCFsYWJlbHNbaWRdKSB7XG4gICAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Zpc2J1Zy1sYWJlbCcpXG5cbiAgICAgIGxhYmVsLnRleHQgPSB0ZXh0XG4gICAgICBsYWJlbC5wb3NpdGlvbiA9IHtcbiAgICAgICAgYm91bmRpbmdSZWN0OiAgIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICBub2RlX2xhYmVsX2lkOiAgaWQsXG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGFiZWwpXG5cbiAgICAgICQobGFiZWwpLm9uKCdxdWVyeScsICh7ZGV0YWlsfSkgPT4ge1xuICAgICAgICBpZiAoIWRldGFpbC50ZXh0KSByZXR1cm5cbiAgICAgICAgdGhpcy5xdWVyeV90ZXh0ID0gZGV0YWlsLnRleHRcblxuICAgICAgICBxdWVyeVBhZ2UoJ1tkYXRhLXBzZXVkby1zZWxlY3RdJywgZWwgPT5cbiAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcHNldWRvLXNlbGVjdCcpKVxuXG4gICAgICAgIHF1ZXJ5UGFnZSh0aGlzLnF1ZXJ5X3RleHQgKyAnOm5vdChbZGF0YS1zZWxlY3RlZF0pJywgZWwgPT5cbiAgICAgICAgICBkZXRhaWwuYWN0aXZhdG9yID09PSAnbW91c2VlbnRlcidcbiAgICAgICAgICAgID8gZWwuc2V0QXR0cmlidXRlKCdkYXRhLXBzZXVkby1zZWxlY3QnLCB0cnVlKVxuICAgICAgICAgICAgOiBzZWxlY3QoZWwpKVxuICAgICAgfSlcblxuICAgICAgJChsYWJlbCkub24oJ21vdXNlbGVhdmUnLCBlID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgcXVlcnlQYWdlKCdbZGF0YS1wc2V1ZG8tc2VsZWN0XScsIGVsID0+XG4gICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBzZXVkby1zZWxlY3QnKSlcbiAgICAgIH0pXG5cbiAgICAgIGxhYmVsc1tsYWJlbHMubGVuZ3RoXSA9IGxhYmVsXG5cbiAgICAgIHJldHVybiBsYWJlbFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZUhhbmRsZSA9IGVsID0+IHtcbiAgICBjb25zdCBpZCA9IHBhcnNlSW50KGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpKVxuXG4gICAgaWYgKCFoYW5kbGVzW2lkXSkge1xuICAgICAgY29uc3QgaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlzYnVnLWhhbmRsZXMnKVxuXG4gICAgICBoYW5kbGUucG9zaXRpb24gPSB7IGVsLCBub2RlX2xhYmVsX2lkOiBpZCB9XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaGFuZGxlKVxuXG4gICAgICBoYW5kbGVzW2hhbmRsZXMubGVuZ3RoXSA9IGhhbmRsZVxuICAgICAgcmV0dXJuIGhhbmRsZVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZUhvdmVyID0gZWwgPT4ge1xuICAgIGlmICghZWwuaGFzQXR0cmlidXRlKCdkYXRhLXBzZXVkby1zZWxlY3QnKSAmJiAhZWwuaGFzQXR0cmlidXRlKCdkYXRhLWxhYmVsLWlkJykpIHtcbiAgICAgIGlmIChob3Zlcl9zdGF0ZS5lbGVtZW50KVxuICAgICAgICBob3Zlcl9zdGF0ZS5lbGVtZW50LnJlbW92ZSgpXG5cbiAgICAgIGhvdmVyX3N0YXRlLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aXNidWctaG92ZXInKVxuICAgICAgaG92ZXJfc3RhdGUuZWxlbWVudC5wb3NpdGlvbiA9IHtlbH1cblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChob3Zlcl9zdGF0ZS5lbGVtZW50KVxuXG4gICAgICByZXR1cm4gaG92ZXJfc3RhdGUuZWxlbWVudFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZUhvdmVyTGFiZWwgPSAoZWwsIHRleHQpID0+IHtcbiAgICBpZiAoIWVsLmhhc0F0dHJpYnV0ZSgnZGF0YS1wc2V1ZG8tc2VsZWN0JykgJiYgIWVsLmhhc0F0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpKSB7XG4gICAgICBpZiAoaG92ZXJfc3RhdGUubGFiZWwpXG4gICAgICAgIGhvdmVyX3N0YXRlLmxhYmVsLnJlbW92ZSgpXG5cbiAgICAgIGhvdmVyX3N0YXRlLmxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlzYnVnLWxhYmVsJylcblxuICAgICAgaG92ZXJfc3RhdGUubGFiZWwudGV4dCA9IHRleHRcbiAgICAgIGhvdmVyX3N0YXRlLmxhYmVsLnBvc2l0aW9uID0ge1xuICAgICAgICBib3VuZGluZ1JlY3Q6ICAgZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIG5vZGVfbGFiZWxfaWQ6ICAnaG92ZXInLFxuICAgICAgfVxuXG4gICAgICBob3Zlcl9zdGF0ZS5sYWJlbC5zdHlsZSA9IGAtLWxhYmVsLWJnOiBoc2woMjY3LCAxMDAlLCA1OCUpYFxuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhvdmVyX3N0YXRlLmxhYmVsKVxuXG4gICAgICByZXR1cm4gaG92ZXJfc3RhdGUubGFiZWxcbiAgICB9XG4gIH1cblxuICBjb25zdCBzZXRIYW5kbGUgPSAoZWwsIGhhbmRsZSkgPT4ge1xuICAgIGhhbmRsZS5wb3NpdGlvbiA9IHtcbiAgICAgIGVsLFxuICAgICAgbm9kZV9sYWJlbF9pZDogIGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1sYWJlbC1pZCcpLFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZU9ic2VydmVyID0gKG5vZGUsIHtsYWJlbCxoYW5kbGV9KSA9PlxuICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3QgPT4ge1xuICAgICAgc2V0TGFiZWwobm9kZSwgbGFiZWwpXG4gICAgICBzZXRIYW5kbGUobm9kZSwgaGFuZGxlKVxuICAgIH0pXG5cbiAgY29uc3Qgb25TZWxlY3RlZFVwZGF0ZSA9IChjYiwgaW1tZWRpYXRlQ2FsbGJhY2sgPSB0cnVlKSA9PiB7XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MucHVzaChjYilcbiAgICBpZiAoaW1tZWRpYXRlQ2FsbGJhY2spIGNiKHNlbGVjdGVkKVxuICB9XG5cbiAgY29uc3QgcmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayA9IGNiID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MgPSBzZWxlY3RlZENhbGxiYWNrcy5maWx0ZXIoY2FsbGJhY2sgPT4gY2FsbGJhY2sgIT0gY2IpXG5cbiAgY29uc3QgdGVsbFdhdGNoZXJzID0gKCkgPT5cbiAgICBzZWxlY3RlZENhbGxiYWNrcy5mb3JFYWNoKGNiID0+IGNiKHNlbGVjdGVkKSlcblxuICBjb25zdCBkaXNjb25uZWN0ID0gKCkgPT4ge1xuICAgIHVuc2VsZWN0X2FsbCgpXG4gICAgdW5saXN0ZW4oKVxuICB9XG5cbiAgY29uc3Qgb25fc2VsZWN0X2NoaWxkcmVuID0gKGUsIHtrZXl9KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0cyA9IHNlbGVjdGVkXG4gICAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS5jaGlsZHJlbi5sZW5ndGgpXG4gICAgICAucmVkdWNlKChmbGF0LCB7Y2hpbGRyZW59KSA9PlxuICAgICAgICBbLi4uZmxhdCwgLi4uQXJyYXkuZnJvbShjaGlsZHJlbildLCBbXSlcblxuICAgIGlmICh0YXJnZXRzLmxlbmd0aCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAgIHVuc2VsZWN0X2FsbCgpXG4gICAgICB0YXJnZXRzLmZvckVhY2gobm9kZSA9PiBzZWxlY3Qobm9kZSkpXG4gICAgfVxuICB9XG5cbiAgd2F0Y2hJbWFnZXNGb3JVcGxvYWQoKVxuICBsaXN0ZW4oKVxuXG4gIHJldHVybiB7XG4gICAgc2VsZWN0LFxuICAgIHNlbGVjdGlvbixcbiAgICB1bnNlbGVjdF9hbGwsXG4gICAgb25TZWxlY3RlZFVwZGF0ZSxcbiAgICByZW1vdmVTZWxlY3RlZENhbGxiYWNrLFxuICAgIGRpc2Nvbm5lY3QsXG4gIH1cbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBzaG93SGlkZU5vZGVMYWJlbCB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmNvbnN0IHJlbW92ZUVkaXRhYmlsaXR5ID0gKHt0YXJnZXR9KSA9PiB7XG4gIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScpXG4gIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ3NwZWxsY2hlY2snKVxuICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgaG90a2V5cy51bmJpbmQoJ2VzY2FwZSxlc2MnKVxufVxuXG5jb25zdCBzdG9wQnViYmxpbmcgPSBlID0+IGUua2V5ICE9ICdFc2NhcGUnICYmIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuY29uc3QgY2xlYW51cCA9IChlLCBoYW5kbGVyKSA9PiB7XG4gICQoJ1tzcGVsbGNoZWNrPVwidHJ1ZVwiXScpLmZvckVhY2godGFyZ2V0ID0+IHJlbW92ZUVkaXRhYmlsaXR5KHt0YXJnZXR9KSlcbiAgd2luZG93LmdldFNlbGVjdGlvbigpLmVtcHR5KClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEVkaXRUZXh0KGVsZW1lbnRzKSB7XG4gIGlmICghZWxlbWVudHMubGVuZ3RoKSByZXR1cm5cblxuICBlbGVtZW50cy5tYXAoZWwgPT4ge1xuICAgIGxldCAkZWwgPSAkKGVsKVxuXG4gICAgJGVsLmF0dHIoe1xuICAgICAgY29udGVudGVkaXRhYmxlOiB0cnVlLFxuICAgICAgc3BlbGxjaGVjazogdHJ1ZSxcbiAgICB9KVxuICAgIGVsLmZvY3VzKClcbiAgICBzaG93SGlkZU5vZGVMYWJlbChlbCwgdHJ1ZSlcblxuICAgICRlbC5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgICAkZWwub24oJ2JsdXInLCByZW1vdmVFZGl0YWJpbGl0eSlcbiAgfSlcblxuICBob3RrZXlzKCdlc2NhcGUsZXNjJywgY2xlYW51cClcbn0iLCJpbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgbWV0YUtleSwgZ2V0U3R5bGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT5cbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gYCR7bWV0YUtleX0rdXAsJHttZXRhS2V5fStkb3duYFxuXG5leHBvcnQgZnVuY3Rpb24gRm9udCh7c2VsZWN0aW9ufSkge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGUuY2FuY2VsQnViYmxlKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSBzZWxlY3Rpb24oKVxuICAgICAgLCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuXG4gICAgaWYgKGtleXMuaW5jbHVkZXMoJ2xlZnQnKSB8fCBrZXlzLmluY2x1ZGVzKCdyaWdodCcpKVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUtlcm5pbmcoc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gICAgICAgIDogY2hhbmdlQWxpZ25tZW50KHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgIGVsc2VcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VMZWFkaW5nKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZUZvbnRTaXplKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIGhvdGtleXMoY29tbWFuZF9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgbGV0IGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG4gICAgY2hhbmdlRm9udFdlaWdodChzZWxlY3Rpb24oKSwga2V5cy5pbmNsdWRlcygndXAnKSA/ICd1cCcgOiAnZG93bicpXG4gIH0pXG5cbiAgaG90a2V5cygnY21kK2InLCBlID0+IHtcbiAgICBzZWxlY3Rpb24oKS5mb3JFYWNoKGVsID0+XG4gICAgICBlbC5zdHlsZS5mb250V2VpZ2h0ID1cbiAgICAgICAgZWwuc3R5bGUuZm9udFdlaWdodCA9PSAnYm9sZCdcbiAgICAgICAgICA/IG51bGxcbiAgICAgICAgICA6ICdib2xkJylcbiAgfSlcblxuICBob3RrZXlzKCdjbWQraScsIGUgPT4ge1xuICAgIHNlbGVjdGlvbigpLmZvckVhY2goZWwgPT5cbiAgICAgIGVsLnN0eWxlLmZvbnRTdHlsZSA9XG4gICAgICAgIGVsLnN0eWxlLmZvbnRTdHlsZSA9PSAnaXRhbGljJ1xuICAgICAgICAgID8gbnVsbFxuICAgICAgICAgIDogJ2l0YWxpYycpXG4gIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCdjbWQrYixjbWQraScpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUxlYWRpbmcoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7XG4gICAgICBlbCxcbiAgICAgIHN0eWxlOiAgICAnbGluZUhlaWdodCcsXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdsaW5lSGVpZ2h0JykpLFxuICAgICAgYW1vdW50OiAgIDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBjdXJyZW50OiBwYXlsb2FkLmN1cnJlbnQgPT0gJ25vcm1hbCcgfHwgaXNOYU4ocGF5bG9hZC5jdXJyZW50KVxuICAgICAgICAgID8gMS4xNCAqIHBhcnNlSW50KGdldFN0eWxlKHBheWxvYWQuZWwsICdmb250U2l6ZScpKSAvLyBkb2N1bWVudCB0aGlzIGNob2ljZVxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50XG4gICAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnRcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7dmFsdWV9cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlS2VybmluZyhlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHtcbiAgICAgIGVsLFxuICAgICAgc3R5bGU6ICAgICdsZXR0ZXJTcGFjaW5nJyxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnbGV0dGVyU3BhY2luZycpKSxcbiAgICAgIGFtb3VudDogICAuMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGN1cnJlbnQ6IHBheWxvYWQuY3VycmVudCA9PSAnbm9ybWFsJyB8fCBpc05hTihwYXlsb2FkLmN1cnJlbnQpXG4gICAgICAgICAgPyAwXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRcbiAgICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyAocGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQpLnRvRml4ZWQoMilcbiAgICAgICAgICA6IChwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudCkudG9GaXhlZCgyKVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke3ZhbHVlIDw9IC0yID8gLTIgOiB2YWx1ZX1weGApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VGb250U2l6ZShlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHtcbiAgICAgIGVsLFxuICAgICAgc3R5bGU6ICAgICdmb250U2l6ZScsXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdmb250U2l6ZScpKSxcbiAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnZG93bicpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGZvbnRfc2l6ZTogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnRcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgZm9udF9zaXplfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke2ZvbnRfc2l6ZSA8PSA2ID8gNiA6IGZvbnRfc2l6ZX1weGApXG59XG5cbmNvbnN0IHdlaWdodE1hcCA9IHtcbiAgbm9ybWFsOiAyLFxuICBib2xkOiAgIDUsXG4gIGxpZ2h0OiAgMCxcbiAgXCJcIjogMixcbiAgXCIxMDBcIjowLFwiMjAwXCI6MSxcIjMwMFwiOjIsXCI0MDBcIjozLFwiNTAwXCI6NCxcIjYwMFwiOjUsXCI3MDBcIjo2LFwiODAwXCI6NyxcIjkwMFwiOjhcbn1cbmNvbnN0IHdlaWdodE9wdGlvbnMgPSBbMTAwLDIwMCwzMDAsNDAwLDUwMCw2MDAsNzAwLDgwMCw5MDBdXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VGb250V2VpZ2h0KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoe1xuICAgICAgZWwsXG4gICAgICBzdHlsZTogICAgJ2ZvbnRXZWlnaHQnLFxuICAgICAgY3VycmVudDogIGdldFN0eWxlKGVsLCAnZm9udFdlaWdodCcpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnZG93bicpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gd2VpZ2h0TWFwW3BheWxvYWQuY3VycmVudF0gLSAxXG4gICAgICAgICAgOiB3ZWlnaHRNYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB3ZWlnaHRPcHRpb25zW3ZhbHVlIDwgMCA/IDAgOiB2YWx1ZSA+PSB3ZWlnaHRPcHRpb25zLmxlbmd0aFxuICAgICAgICA/IHdlaWdodE9wdGlvbnMubGVuZ3RoXG4gICAgICAgIDogdmFsdWVcbiAgICAgIF0pXG59XG5cbmNvbnN0IGFsaWduTWFwID0ge1xuICBzdGFydDogMCxcbiAgbGVmdDogMCxcbiAgY2VudGVyOiAxLFxuICByaWdodDogMixcbn1cbmNvbnN0IGFsaWduT3B0aW9ucyA9IFsnbGVmdCcsJ2NlbnRlcicsJ3JpZ2h0J11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUFsaWdubWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHtcbiAgICAgIGVsLFxuICAgICAgc3R5bGU6ICAgICd0ZXh0QWxpZ24nLFxuICAgICAgY3VycmVudDogIGdldFN0eWxlKGVsLCAndGV4dEFsaWduJyksXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi5zcGxpdCgnKycpLmluY2x1ZGVzKCdsZWZ0JyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQuZGlyZWN0aW9uXG4gICAgICAgICAgPyBhbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMVxuICAgICAgICAgIDogYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBhbGlnbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG4iLCJpbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgbWV0YUtleSwgZ2V0U3R5bGUgfSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT5cbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gYCR7bWV0YUtleX0rdXAsJHttZXRhS2V5fStkb3duLCR7bWV0YUtleX0rbGVmdCwke21ldGFLZXl9K3JpZ2h0YFxuXG5leHBvcnQgZnVuY3Rpb24gRmxleCh7c2VsZWN0aW9ufSkge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGUuY2FuY2VsQnViYmxlKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSBzZWxlY3Rpb24oKVxuICAgICAgLCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuXG4gICAgaWYgKGtleXMuaW5jbHVkZXMoJ2xlZnQnKSB8fCBrZXlzLmluY2x1ZGVzKCdyaWdodCcpKVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUhEaXN0cmlidXRpb24oc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gICAgICAgIDogY2hhbmdlSEFsaWdubWVudChzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICBlbHNlXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlVkRpc3RyaWJ1dGlvbihzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICAgICAgOiBjaGFuZ2VWQWxpZ25tZW50KHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIGhvdGtleXMoY29tbWFuZF9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsZXQgc2VsZWN0ZWROb2RlcyA9IHNlbGVjdGlvbigpXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBjaGFuZ2VEaXJlY3Rpb24oc2VsZWN0ZWROb2Rlcywga2V5cy5pbmNsdWRlcygnbGVmdCcpID8gJ3JvdycgOiAnY29sdW1uJylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuY29uc3QgZW5zdXJlRmxleCA9IGVsID0+IHtcbiAgZWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICByZXR1cm4gZWxcbn1cblxuY29uc3QgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQgPSAoY3VyLCB3YW50KSA9PiB7XG4gIGlmICh3YW50ID09ICdhbGlnbicgJiYgKGN1ciAhPSAnZmxleC1zdGFydCcgJiYgY3VyICE9ICdjZW50ZXInICYmIGN1ciAhPSAnZmxleC1lbmQnKSlcbiAgICBjdXIgPSAnbm9ybWFsJ1xuICBlbHNlIGlmICh3YW50ID09ICdkaXN0cmlidXRlJyAmJiAoY3VyICE9ICdzcGFjZS1hcm91bmQnICYmIGN1ciAhPSAnc3BhY2UtYmV0d2VlbicpKVxuICAgIGN1ciA9ICdub3JtYWwnXG5cbiAgcmV0dXJuIGN1clxufVxuXG4vLyB0b2RvOiBzdXBwb3J0IHJldmVyc2luZyBkaXJlY3Rpb25cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VEaXJlY3Rpb24oZWxzLCB2YWx1ZSkge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiB7XG4gICAgICBlbC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gdmFsdWVcbiAgICB9KVxufVxuXG5jb25zdCBoX2FsaWduTWFwICAgICAgPSB7bm9ybWFsOiAwLCdmbGV4LXN0YXJ0JzogMCwnY2VudGVyJzogMSwnZmxleC1lbmQnOiAyLH1cbmNvbnN0IGhfYWxpZ25PcHRpb25zICA9IFsnZmxleC1zdGFydCcsJ2NlbnRlcicsJ2ZsZXgtZW5kJ11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUhBbGlnbm1lbnQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4gKHtcbiAgICAgIGVsLFxuICAgICAgc3R5bGU6ICAgICdqdXN0aWZ5Q29udGVudCcsXG4gICAgICBjdXJyZW50OiAgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQoZ2V0U3R5bGUoZWwsICdqdXN0aWZ5Q29udGVudCcpLCAnYWxpZ24nKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSAtIDFcbiAgICAgICAgICA6IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBoX2FsaWduT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3Qgdl9hbGlnbk1hcCAgICAgID0ge25vcm1hbDogMCwnZmxleC1zdGFydCc6IDAsJ2NlbnRlcic6IDEsJ2ZsZXgtZW5kJzogMix9XG5jb25zdCB2X2FsaWduT3B0aW9ucyAgPSBbJ2ZsZXgtc3RhcnQnLCdjZW50ZXInLCdmbGV4LWVuZCddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VWQWxpZ25tZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7XG4gICAgICBlbCxcbiAgICAgIHN0eWxlOiAgICAnYWxpZ25JdGVtcycsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkl0ZW1zJyksXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi5zcGxpdCgnKycpLmluY2x1ZGVzKCd1cCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMVxuICAgICAgICAgIDogaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHZfYWxpZ25PcHRpb25zW3ZhbHVlIDwgMCA/IDAgOiB2YWx1ZSA+PSAyID8gMjogdmFsdWVdKVxufVxuXG5jb25zdCBoX2Rpc3RyaWJ1dGlvbk1hcCAgICAgID0ge25vcm1hbDogMSwnc3BhY2UtYXJvdW5kJzogMCwnJzogMSwnc3BhY2UtYmV0d2Vlbic6IDIsfVxuY29uc3QgaF9kaXN0cmlidXRpb25PcHRpb25zICA9IFsnc3BhY2UtYXJvdW5kJywnJywnc3BhY2UtYmV0d2VlbiddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VIRGlzdHJpYnV0aW9uKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7XG4gICAgICBlbCxcbiAgICAgIHN0eWxlOiAgICAnanVzdGlmeUNvbnRlbnQnLFxuICAgICAgY3VycmVudDogIGFjY291bnRGb3JPdGhlckp1c3RpZnlDb250ZW50KGdldFN0eWxlKGVsLCAnanVzdGlmeUNvbnRlbnQnKSwgJ2Rpc3RyaWJ1dGUnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gLSAxXG4gICAgICAgICAgOiBoX2Rpc3RyaWJ1dGlvbk1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGhfZGlzdHJpYnV0aW9uT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3Qgdl9kaXN0cmlidXRpb25NYXAgICAgICA9IHtub3JtYWw6IDEsJ3NwYWNlLWFyb3VuZCc6IDAsJyc6IDEsJ3NwYWNlLWJldHdlZW4nOiAyLH1cbmNvbnN0IHZfZGlzdHJpYnV0aW9uT3B0aW9ucyAgPSBbJ3NwYWNlLWFyb3VuZCcsJycsJ3NwYWNlLWJldHdlZW4nXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlVkRpc3RyaWJ1dGlvbihlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoe1xuICAgICAgZWwsXG4gICAgICBzdHlsZTogICAgJ2FsaWduQ29udGVudCcsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkNvbnRlbnQnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3VwJyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQuZGlyZWN0aW9uXG4gICAgICAgICAgPyB2X2Rpc3RyaWJ1dGlvbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMVxuICAgICAgICAgIDogdl9kaXN0cmlidXRpb25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2X2Rpc3RyaWJ1dGlvbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgeyBUaW55Q29sb3IgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5pbXBvcnQgeyBnZXRTdHlsZSB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmV4cG9ydCBmdW5jdGlvbiBDb2xvclBpY2tlcihwYWxsZXRlLCBzZWxlY3RvckVuZ2luZSkge1xuICBjb25zdCBmb3JlZ3JvdW5kUGlja2VyICA9ICQoJyNmb3JlZ3JvdW5kJywgcGFsbGV0ZSlcbiAgY29uc3QgYmFja2dyb3VuZFBpY2tlciAgPSAkKCcjYmFja2dyb3VuZCcsIHBhbGxldGUpXG4gIGNvbnN0IGJvcmRlclBpY2tlciAgICAgID0gJCgnI2JvcmRlcicsIHBhbGxldGUpXG4gIGNvbnN0IGZnSW5wdXQgICAgICAgICAgID0gJCgnaW5wdXQnLCBmb3JlZ3JvdW5kUGlja2VyWzBdKVxuICBjb25zdCBiZ0lucHV0ICAgICAgICAgICA9ICQoJ2lucHV0JywgYmFja2dyb3VuZFBpY2tlclswXSlcbiAgY29uc3QgYm9JbnB1dCAgICAgICAgICAgPSAkKCdpbnB1dCcsIGJvcmRlclBpY2tlclswXSlcblxuICBjb25zdCBzaGFkb3dzID0ge1xuICAgIGFjdGl2ZTogICAncmdiYSgwLCAwLCAwLCAwLjEpIDBweCAwLjI1ZW0gMC41ZW0sIDAgMCAwIDJweCBob3RwaW5rJyxcbiAgICBpbmFjdGl2ZTogJ3JnYmEoMCwgMCwgMCwgMC4xKSAwcHggMC4yNWVtIDAuNWVtJyxcbiAgfVxuXG4gIHRoaXMuYWN0aXZlX2NvbG9yICAgICAgID0gJ2JhY2tncm91bmQnXG4gIHRoaXMuZWxlbWVudHMgICAgICAgICAgID0gW11cblxuICAvLyBzZXQgY29sb3JzXG4gIGZnSW5wdXQub24oJ2lucHV0JywgZSA9PlxuICAgIHRoaXMuZWxlbWVudHMubWFwKGVsID0+XG4gICAgICBlbC5zdHlsZVsnY29sb3InXSA9IGUudGFyZ2V0LnZhbHVlKSlcblxuICBiZ0lucHV0Lm9uKCdpbnB1dCcsIGUgPT5cbiAgICB0aGlzLmVsZW1lbnRzLm1hcChlbCA9PlxuICAgICAgZWwuc3R5bGVbZWwgaW5zdGFuY2VvZiBTVkdFbGVtZW50XG4gICAgICAgID8gJ2ZpbGwnXG4gICAgICAgIDogJ2JhY2tncm91bmRDb2xvcidcbiAgICAgIF0gPSBlLnRhcmdldC52YWx1ZSkpXG5cbiAgYm9JbnB1dC5vbignaW5wdXQnLCBlID0+XG4gICAgdGhpcy5lbGVtZW50cy5tYXAoZWwgPT5cbiAgICAgIGVsLnN0eWxlW2VsIGluc3RhbmNlb2YgU1ZHRWxlbWVudFxuICAgICAgICA/ICdzdHJva2UnXG4gICAgICAgIDogJ2JvcmRlci1jb2xvcidcbiAgICAgIF0gPSBlLnRhcmdldC52YWx1ZSkpXG5cbiAgLy8gcmVhZCBjb2xvcnNcbiAgc2VsZWN0b3JFbmdpbmUub25TZWxlY3RlZFVwZGF0ZShlbGVtZW50cyA9PiB7XG4gICAgaWYgKCFlbGVtZW50cy5sZW5ndGgpIHJldHVyblxuICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50c1xuXG4gICAgbGV0IGlzTWVhbmluZ2Z1bEZvcmVncm91bmQgID0gZmFsc2VcbiAgICBsZXQgaXNNZWFuaW5nZnVsQmFja2dyb3VuZCAgPSBmYWxzZVxuICAgIGxldCBpc01lYW5pbmdmdWxCb3JkZXIgICAgICA9IGZhbHNlXG4gICAgbGV0IEZHLCBCRywgQk9cblxuICAgIGlmICh0aGlzLmVsZW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICBjb25zdCBlbCA9IHRoaXMuZWxlbWVudHNbMF1cbiAgICAgIGNvbnN0IG1lYW5pbmdmdWxEb250TWF0dGVyID0gcGFsbGV0ZS5ob3N0LmFjdGl2ZV90b29sLmRhdGFzZXQudG9vbCA9PT0gJ2h1ZXNoaWZ0J1xuXG4gICAgICBpZiAoZWwgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgICAgIEZHID0gbmV3IFRpbnlDb2xvcigncmdiKDAsIDAsIDApJylcbiAgICAgICAgdmFyIGJvX3RlbXAgPSBnZXRTdHlsZShlbCwgJ3N0cm9rZScpXG4gICAgICAgIEJPID0gbmV3IFRpbnlDb2xvcihib190ZW1wID09PSAnbm9uZSdcbiAgICAgICAgICA/ICdyZ2IoMCwgMCwgMCknXG4gICAgICAgICAgOiBib190ZW1wKVxuICAgICAgICBCRyA9IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdmaWxsJykpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgRkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnY29sb3InKSlcbiAgICAgICAgQkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnYmFja2dyb3VuZENvbG9yJykpXG4gICAgICAgIEJPID0gZ2V0U3R5bGUoZWwsICdib3JkZXJXaWR0aCcpID09PSAnMHB4J1xuICAgICAgICAgID8gbmV3IFRpbnlDb2xvcigncmdiKDAsIDAsIDApJylcbiAgICAgICAgICA6IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdib3JkZXJDb2xvcicpKVxuICAgICAgfVxuXG4gICAgICBsZXQgZmcgPSBGRy50b0hleFN0cmluZygpXG4gICAgICBsZXQgYmcgPSBCRy50b0hleFN0cmluZygpXG4gICAgICBsZXQgYm8gPSBCTy50b0hleFN0cmluZygpXG5cbiAgICAgIGlzTWVhbmluZ2Z1bEZvcmVncm91bmQgPSBGRy5vcmlnaW5hbElucHV0ICE9PSAncmdiKDAsIDAsIDApJyB8fCAoZWwuY2hpbGRyZW4ubGVuZ3RoID09PSAwICYmIGVsLnRleHRDb250ZW50ICE9PSAnJylcbiAgICAgIGlzTWVhbmluZ2Z1bEJhY2tncm91bmQgPSBCRy5vcmlnaW5hbElucHV0ICE9PSAncmdiYSgwLCAwLCAwLCAwKSdcbiAgICAgIGlzTWVhbmluZ2Z1bEJvcmRlciAgICAgPSBCTy5vcmlnaW5hbElucHV0ICE9PSAncmdiKDAsIDAsIDApJ1xuXG4gICAgICBpZiAoaXNNZWFuaW5nZnVsRm9yZWdyb3VuZCAmJiAhaXNNZWFuaW5nZnVsQmFja2dyb3VuZClcbiAgICAgICAgc2V0QWN0aXZlKCdmb3JlZ3JvdW5kJylcbiAgICAgIGVsc2UgaWYgKGlzTWVhbmluZ2Z1bEJhY2tncm91bmQgJiYgIWlzTWVhbmluZ2Z1bEZvcmVncm91bmQpXG4gICAgICAgIHNldEFjdGl2ZSgnYmFja2dyb3VuZCcpXG5cbiAgICAgIGNvbnN0IG5ld19mZyA9IGlzTWVhbmluZ2Z1bEZvcmVncm91bmQgPyBmZyA6ICcnXG4gICAgICBjb25zdCBuZXdfYmcgPSBpc01lYW5pbmdmdWxCYWNrZ3JvdW5kID8gYmcgOiAnJ1xuICAgICAgY29uc3QgbmV3X2JvID0gaXNNZWFuaW5nZnVsQm9yZGVyID8gYm8gOiAnJ1xuXG4gICAgICBmZ0lucHV0LmF0dHIoJ3ZhbHVlJywgbmV3X2ZnKVxuICAgICAgYmdJbnB1dC5hdHRyKCd2YWx1ZScsIG5ld19iZylcbiAgICAgIGJvSW5wdXQuYXR0cigndmFsdWUnLCBuZXdfYm8pXG5cbiAgICAgIGZvcmVncm91bmRQaWNrZXIuYXR0cignc3R5bGUnLCBgXG4gICAgICAgIC0tY29udGV4dHVhbF9jb2xvcjogJHtuZXdfZmd9O1xuICAgICAgICBkaXNwbGF5OiAke2lzTWVhbmluZ2Z1bEZvcmVncm91bmQgfHwgbWVhbmluZ2Z1bERvbnRNYXR0ZXIgPyAnaW5saW5lLWZsZXgnIDogJ25vbmUnfTtcbiAgICAgIGApXG5cbiAgICAgIGJhY2tncm91bmRQaWNrZXIuYXR0cignc3R5bGUnLCBgXG4gICAgICAgIC0tY29udGV4dHVhbF9jb2xvcjogJHtuZXdfYmd9O1xuICAgICAgICBkaXNwbGF5OiAke2lzTWVhbmluZ2Z1bEJhY2tncm91bmQgfHwgbWVhbmluZ2Z1bERvbnRNYXR0ZXIgPyAnaW5saW5lLWZsZXgnIDogJ25vbmUnfTtcbiAgICAgIGApXG5cbiAgICAgIGJvcmRlclBpY2tlci5hdHRyKCdzdHlsZScsIGBcbiAgICAgICAgLS1jb250ZXh0dWFsX2NvbG9yOiAke25ld19ib307XG4gICAgICAgIGRpc3BsYXk6ICR7aXNNZWFuaW5nZnVsQm9yZGVyIHx8IG1lYW5pbmdmdWxEb250TWF0dGVyID8gJ2lubGluZS1mbGV4JyA6ICdub25lJ307XG4gICAgICBgKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIHNob3cgYWxsIDMgaWYgdGhleSd2ZSBzZWxlY3RlZCBtb3JlIHRoYW4gMSBub2RlXG4gICAgICAvLyB0b2RvOiB0aGlzIGlzIGdpdmluZyB1cCwgYW5kIGNhbiBiZSBzb2x2ZWRcbiAgICAgIGZvcmVncm91bmRQaWNrZXIuYXR0cignc3R5bGUnLCBgXG4gICAgICAgIGJveC1zaGFkb3c6ICR7dGhpcy5hY3RpdmVfY29sb3IgPT0gJ2ZvcmVncm91bmQnID8gc2hhZG93cy5hY3RpdmUgOiBzaGFkb3dzLmluYWN0aXZlfTtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICBgKVxuXG4gICAgICBiYWNrZ3JvdW5kUGlja2VyLmF0dHIoJ3N0eWxlJywgYFxuICAgICAgICBib3gtc2hhZG93OiAke3RoaXMuYWN0aXZlX2NvbG9yID09ICdiYWNrZ3JvdW5kJyA/IHNoYWRvd3MuYWN0aXZlIDogc2hhZG93cy5pbmFjdGl2ZX07XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgYClcblxuICAgICAgYm9yZGVyUGlja2VyLmF0dHIoJ3N0eWxlJywgYFxuICAgICAgICBib3gtc2hhZG93OiAke3RoaXMuYWN0aXZlX2NvbG9yID09ICdib3JkZXInID8gc2hhZG93cy5hY3RpdmUgOiBzaGFkb3dzLmluYWN0aXZlfTtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICBgKVxuICAgIH1cbiAgfSlcblxuICBjb25zdCBnZXRBY3RpdmUgPSAoKSA9PlxuICAgIHRoaXMuYWN0aXZlX2NvbG9yXG5cbiAgY29uc3Qgc2V0QWN0aXZlID0ga2V5ID0+IHtcbiAgICByZW1vdmVBY3RpdmUoKVxuICAgIHRoaXMuYWN0aXZlX2NvbG9yID0ga2V5XG5cbiAgICBpZiAoa2V5ID09PSAnZm9yZWdyb3VuZCcpXG4gICAgICBmb3JlZ3JvdW5kUGlja2VyWzBdLnN0eWxlLmJveFNoYWRvdyA9IHNoYWRvd3MuYWN0aXZlXG4gICAgaWYgKGtleSA9PT0gJ2JhY2tncm91bmQnKVxuICAgICAgYmFja2dyb3VuZFBpY2tlclswXS5zdHlsZS5ib3hTaGFkb3cgPSBzaGFkb3dzLmFjdGl2ZVxuICAgIGlmIChrZXkgPT09ICdib3JkZXInKVxuICAgICAgYm9yZGVyUGlja2VyWzBdLnN0eWxlLmJveFNoYWRvdyA9IHNoYWRvd3MuYWN0aXZlXG4gIH1cblxuICBjb25zdCByZW1vdmVBY3RpdmUgPSAoKSA9PlxuICAgIFtmb3JlZ3JvdW5kUGlja2VyLCBiYWNrZ3JvdW5kUGlja2VyLCBib3JkZXJQaWNrZXJdLmZvckVhY2goKFtwaWNrZXJdKSA9PlxuICAgICAgcGlja2VyLnN0eWxlLmJveFNoYWRvdyA9IHNoYWRvd3MuaW5hY3RpdmUpXG5cbiAgcmV0dXJuIHtcbiAgICBnZXRBY3RpdmUsXG4gICAgc2V0QWN0aXZlLFxuICAgIGZvcmVncm91bmQ6IHsgY29sb3I6IGNvbG9yID0+XG4gICAgICBmb3JlZ3JvdW5kUGlja2VyWzBdLnN0eWxlLnNldFByb3BlcnR5KCctLWNvbnRleHR1YWxfY29sb3InLCBjb2xvcil9LFxuICAgIGJhY2tncm91bmQ6IHsgY29sb3I6IGNvbG9yID0+XG4gICAgICBiYWNrZ3JvdW5kUGlja2VyWzBdLnN0eWxlLnNldFByb3BlcnR5KCctLWNvbnRleHR1YWxfY29sb3InLCBjb2xvcil9XG4gIH1cbn1cbiIsImltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBtZXRhS2V5LCBnZXRTdHlsZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PlxuICAgIGAke2V2ZW50c30sJHtldmVudH0sc2hpZnQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuY29uc3QgY29tbWFuZF9ldmVudHMgPSBgJHttZXRhS2V5fSt1cCwke21ldGFLZXl9K3NoaWZ0K3VwLCR7bWV0YUtleX0rZG93biwke21ldGFLZXl9K3NoaWZ0K2Rvd24sJHttZXRhS2V5fStsZWZ0LCR7bWV0YUtleX0rc2hpZnQrbGVmdCwke21ldGFLZXl9K3JpZ2h0LCR7bWV0YUtleX0rc2hpZnQrcmlnaHRgXG5cbmV4cG9ydCBmdW5jdGlvbiBCb3hTaGFkb3coe3NlbGVjdGlvbn0pIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGlmIChlLmNhbmNlbEJ1YmJsZSkgcmV0dXJuXG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gc2VsZWN0aW9uKClcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VCb3hTaGFkb3coc2VsZWN0ZWROb2Rlcywga2V5cywgJ3NpemUnKVxuICAgICAgICA6IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAneCcpXG4gICAgZWxzZVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAnYmx1cicpXG4gICAgICAgIDogY2hhbmdlQm94U2hhZG93KHNlbGVjdGVkTm9kZXMsIGtleXMsICd5JylcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGtleXMuaW5jbHVkZXMoJ2xlZnQnKSB8fCBrZXlzLmluY2x1ZGVzKCdyaWdodCcpXG4gICAgICA/IGNoYW5nZUJveFNoYWRvdyhzZWxlY3Rpb24oKSwga2V5cywgJ29wYWNpdHknKVxuICAgICAgOiBjaGFuZ2VCb3hTaGFkb3coc2VsZWN0aW9uKCksIGtleXMsICdpbnNldCcpXG4gIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKVxuICB9XG59XG5cbmNvbnN0IGVuc3VyZUhhc1NoYWRvdyA9IGVsID0+IHtcbiAgaWYgKGVsLnN0eWxlLmJveFNoYWRvdyA9PSAnJyB8fCBlbC5zdHlsZS5ib3hTaGFkb3cgPT0gJ25vbmUnKVxuICAgIGVsLnN0eWxlLmJveFNoYWRvdyA9ICdoc2xhKDAsMCUsMCUsMzAlKSAwIDAgMCAwJ1xuICByZXR1cm4gZWxcbn1cblxuLy8gdG9kbzogd29yayBhcm91bmQgdGhpcyBwcm9wTWFwIHdpdGggYSBiZXR0ZXIgc3BsaXRcbmNvbnN0IHByb3BNYXAgPSB7XG4gICdvcGFjaXR5JzogIDMsXG4gICd4JzogICAgICAgIDQsXG4gICd5JzogICAgICAgIDUsXG4gICdibHVyJzogICAgIDYsXG4gICdzaXplJzogICAgIDcsXG4gICdpbnNldCc6ICAgIDgsXG59XG5cbmNvbnN0IHBhcnNlQ3VycmVudFNoYWRvdyA9IGVsID0+IGdldFN0eWxlKGVsLCAnYm94U2hhZG93Jykuc3BsaXQoJyAnKVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlQm94U2hhZG93KGVscywgZGlyZWN0aW9uLCBwcm9wKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlSGFzU2hhZG93KVxuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCwgMTUwMCkpXG4gICAgLm1hcChlbCA9PiAoe1xuICAgICAgZWwsXG4gICAgICBzdHlsZTogICAgICdib3hTaGFkb3cnLFxuICAgICAgY3VycmVudDogICBwYXJzZUN1cnJlbnRTaGFkb3coZWwpLCAvLyBbXCJyZ2IoMjU1LFwiLCBcIjAsXCIsIFwiMClcIiwgXCIwcHhcIiwgXCIwcHhcIiwgXCIxcHhcIiwgXCIwcHhcIl1cbiAgICAgIHByb3BJbmRleDogcGFyc2VDdXJyZW50U2hhZG93KGVsKVswXS5pbmNsdWRlcygncmdiYScpID8gcHJvcE1hcFtwcm9wXSA6IHByb3BNYXBbcHJvcF0gLSAxXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+IHtcbiAgICAgIGxldCB1cGRhdGVkID0gWy4uLnBheWxvYWQuY3VycmVudF1cbiAgICAgIGxldCBjdXIgICAgID0gcHJvcCA9PT0gJ29wYWNpdHknXG4gICAgICAgID8gcGF5bG9hZC5jdXJyZW50W3BheWxvYWQucHJvcEluZGV4XVxuICAgICAgICA6IHBhcnNlSW50KHBheWxvYWQuY3VycmVudFtwYXlsb2FkLnByb3BJbmRleF0pXG5cbiAgICAgIHN3aXRjaChwcm9wKSB7XG4gICAgICAgIGNhc2UgJ2JsdXInOlxuICAgICAgICAgIHZhciBhbW91bnQgPSBkaXJlY3Rpb24uaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDFcbiAgICAgICAgICB1cGRhdGVkW3BheWxvYWQucHJvcEluZGV4XSA9IGRpcmVjdGlvbi5pbmNsdWRlcygnZG93bicpXG4gICAgICAgICAgICA/IGAke2N1ciAtIGFtb3VudH1weGBcbiAgICAgICAgICAgIDogYCR7Y3VyICsgYW1vdW50fXB4YFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2luc2V0JzpcbiAgICAgICAgICB1cGRhdGVkW3BheWxvYWQucHJvcEluZGV4XSA9IGRpcmVjdGlvbi5pbmNsdWRlcygnZG93bicpXG4gICAgICAgICAgICA/ICdpbnNldCdcbiAgICAgICAgICAgIDogJydcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdvcGFjaXR5JzpcbiAgICAgICAgICBsZXQgY3VyX29wYWNpdHkgPSBwYXJzZUZsb2F0KGN1ci5zbGljZSgwLCBjdXIuaW5kZXhPZignKScpKSlcbiAgICAgICAgICB2YXIgYW1vdW50ID0gZGlyZWN0aW9uLmluY2x1ZGVzKCdzaGlmdCcpID8gMC4xMCA6IDAuMDFcbiAgICAgICAgICB1cGRhdGVkW3BheWxvYWQucHJvcEluZGV4XSA9IGRpcmVjdGlvbi5pbmNsdWRlcygnbGVmdCcpXG4gICAgICAgICAgICA/IGN1cl9vcGFjaXR5IC0gYW1vdW50ICsgJyknXG4gICAgICAgICAgICA6IGN1cl9vcGFjaXR5ICsgYW1vdW50ICsgJyknXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB1cGRhdGVkW3BheWxvYWQucHJvcEluZGV4XSA9IGRpcmVjdGlvbi5pbmNsdWRlcygnbGVmdCcpIHx8IGRpcmVjdGlvbi5pbmNsdWRlcygndXAnKVxuICAgICAgICAgICAgPyBgJHtjdXIgLSAxfXB4YFxuICAgICAgICAgICAgOiBgJHtjdXIgKyAxfXB4YFxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIHBheWxvYWQudmFsdWUgPSB1cGRhdGVkXG4gICAgICByZXR1cm4gcGF5bG9hZFxuICAgIH0pXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHZhbHVlLmpvaW4oJyAnKSlcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBUaW55Q29sb3IgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5cbmltcG9ydCB7IG1ldGFLZXksIGdldFN0eWxlLCBzaG93SGlkZVNlbGVjdGVkIH0gZnJvbSAnLi4vdXRpbGl0aWVzLydcblxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+XG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9IGAke21ldGFLZXl9K3VwLCR7bWV0YUtleX0rc2hpZnQrdXAsJHttZXRhS2V5fStkb3duLCR7bWV0YUtleX0rc2hpZnQrZG93biwke21ldGFLZXl9K2xlZnQsJHttZXRhS2V5fStzaGlmdCtsZWZ0LCR7bWV0YUtleX0rcmlnaHQsJHttZXRhS2V5fStzaGlmdCtyaWdodGBcblxuZXhwb3J0IGZ1bmN0aW9uIEh1ZVNoaWZ0KENvbG9yKSB7XG4gIHRoaXMuYWN0aXZlX2NvbG9yICAgPSBDb2xvci5nZXRBY3RpdmUoKVxuICB0aGlzLmVsZW1lbnRzICAgICAgID0gW11cblxuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGUuY2FuY2VsQnViYmxlKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSB0aGlzLmVsZW1lbnRzXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKVxuICAgICAgPyBjaGFuZ2VIdWUoc2VsZWN0ZWROb2Rlcywga2V5cywgJ3MnLCBDb2xvcilcbiAgICAgIDogY2hhbmdlSHVlKHNlbGVjdGVkTm9kZXMsIGtleXMsICdsJywgQ29sb3IpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBsZXQga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcbiAgICBrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKVxuICAgICAgPyBjaGFuZ2VIdWUodGhpcy5lbGVtZW50cywga2V5cywgJ2EnLCBDb2xvcilcbiAgICAgIDogY2hhbmdlSHVlKHRoaXMuZWxlbWVudHMsIGtleXMsICdoJywgQ29sb3IpXG4gIH0pXG5cbiAgaG90a2V5cygnXScsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAodGhpcy5hY3RpdmVfY29sb3IgPT0gJ2ZvcmVncm91bmQnKVxuICAgICAgdGhpcy5hY3RpdmVfY29sb3IgPSAnYmFja2dyb3VuZCdcbiAgICBlbHNlIGlmICh0aGlzLmFjdGl2ZV9jb2xvciA9PSAnYmFja2dyb3VuZCcpXG4gICAgICB0aGlzLmFjdGl2ZV9jb2xvciA9ICdib3JkZXInXG5cbiAgICBDb2xvci5zZXRBY3RpdmUodGhpcy5hY3RpdmVfY29sb3IpXG4gIH0pXG5cbiAgaG90a2V5cygnWycsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAodGhpcy5hY3RpdmVfY29sb3IgPT0gJ2JhY2tncm91bmQnKVxuICAgICAgdGhpcy5hY3RpdmVfY29sb3IgPSAnZm9yZWdyb3VuZCdcbiAgICBlbHNlIGlmICh0aGlzLmFjdGl2ZV9jb2xvciA9PSAnYm9yZGVyJylcbiAgICAgIHRoaXMuYWN0aXZlX2NvbG9yID0gJ2JhY2tncm91bmQnXG5cbiAgICBDb2xvci5zZXRBY3RpdmUodGhpcy5hY3RpdmVfY29sb3IpXG4gIH0pXG5cbiAgY29uc3Qgb25Ob2Rlc1NlbGVjdGVkID0gZWxzID0+IHtcbiAgICB0aGlzLmVsZW1lbnRzID0gZWxzXG4gICAgQ29sb3Iuc2V0QWN0aXZlKHRoaXMuYWN0aXZlX2NvbG9yKVxuICB9XG5cbiAgY29uc3QgZGlzY29ubmVjdCA9ICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbk5vZGVzU2VsZWN0ZWQsXG4gICAgZGlzY29ubmVjdCxcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlSHVlKGVscywgZGlyZWN0aW9uLCBwcm9wLCBDb2xvcikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4ge1xuICAgICAgY29uc3QgeyBmb3JlZ3JvdW5kLCBiYWNrZ3JvdW5kLCBib3JkZXIgfSA9IGV4dHJhY3RQYWxsZXRlQ29sb3JzKGVsKVxuXG4gICAgICAvLyB0b2RvOiB0ZWFjaCBodWVzaGlmdCB0byBkbyBoYW5kbGUgY29sb3JcbiAgICAgIHN3aXRjaChDb2xvci5nZXRBY3RpdmUoKSkge1xuICAgICAgICBjYXNlICdiYWNrZ3JvdW5kJzpcbiAgICAgICAgICByZXR1cm4geyBlbCwgY3VycmVudDogYmFja2dyb3VuZC5jb2xvci50b0hzbCgpLCBzdHlsZTogYmFja2dyb3VuZC5zdHlsZSB9XG4gICAgICAgIGNhc2UgJ2ZvcmVncm91bmQnOlxuICAgICAgICAgIHJldHVybiB7IGVsLCBjdXJyZW50OiBmb3JlZ3JvdW5kLmNvbG9yLnRvSHNsKCksIHN0eWxlOiBmb3JlZ3JvdW5kLnN0eWxlIH1cbiAgICAgICAgY2FzZSAnYm9yZGVyJzoge1xuICAgICAgICAgIGlmIChlbC5zdHlsZS5ib3JkZXIgPT09ICcnKSBlbC5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIGJsYWNrJ1xuICAgICAgICAgIHJldHVybiB7IGVsLCBjdXJyZW50OiBib3JkZXIuY29sb3IudG9Ic2woKSwgc3R5bGU6IGJvcmRlci5zdHlsZSB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uaW5jbHVkZXMoJ2Rvd24nKSB8fCBkaXJlY3Rpb24uaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PiB7XG4gICAgICBpZiAocHJvcCA9PT0gJ3MnIHx8IHByb3AgPT09ICdsJyB8fCBwcm9wID09PSAnYScpXG4gICAgICAgIHBheWxvYWQuYW1vdW50ID0gcGF5bG9hZC5hbW91bnQgKiAwLjAxXG5cbiAgICAgIHBheWxvYWQuY3VycmVudFtwcm9wXSA9IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gLSBwYXlsb2FkLmFtb3VudFxuICAgICAgICA6IHBheWxvYWQuY3VycmVudFtwcm9wXSArIHBheWxvYWQuYW1vdW50XG5cbiAgICAgIGlmIChwcm9wID09PSAncycgfHwgcHJvcCA9PT0gJ2wnIHx8IHByb3AgPT09ICdhJykge1xuICAgICAgICBpZiAocGF5bG9hZC5jdXJyZW50W3Byb3BdID4gMSkgcGF5bG9hZC5jdXJyZW50W3Byb3BdID0gMVxuICAgICAgICBpZiAocGF5bG9hZC5jdXJyZW50W3Byb3BdIDwgMCkgcGF5bG9hZC5jdXJyZW50W3Byb3BdID0gMFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGF5bG9hZFxuICAgIH0pXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIGN1cnJlbnR9KSA9PiB7XG4gICAgICBsZXQgY29sb3IgPSBuZXcgVGlueUNvbG9yKGN1cnJlbnQpLnNldEFscGhhKGN1cnJlbnQuYSlcbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGNvbG9yLnRvSHNsU3RyaW5nKClcblxuICAgICAgaWYgKHN0eWxlID09ICdjb2xvcicpIENvbG9yLmZvcmVncm91bmQuY29sb3IoY29sb3IudG9IZXhTdHJpbmcoKSlcbiAgICAgIGlmIChzdHlsZSA9PSAnYmFja2dyb3VuZENvbG9yJykgQ29sb3IuYmFja2dyb3VuZC5jb2xvcihjb2xvci50b0hleFN0cmluZygpKVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UGFsbGV0ZUNvbG9ycyhlbCkge1xuICBpZiAoZWwgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgY29uc3QgIGZnX3RlbXAgPSBnZXRTdHlsZShlbCwgJ3N0cm9rZScpXG5cbiAgICByZXR1cm4ge1xuICAgICAgZm9yZWdyb3VuZDoge1xuICAgICAgICBzdHlsZTogJ3N0cm9rZScsXG4gICAgICAgIGNvbG9yOiBuZXcgVGlueUNvbG9yKGZnX3RlbXAgPT09ICdub25lJ1xuICAgICAgICAgID8gJ3JnYigwLCAwLCAwKSdcbiAgICAgICAgICA6IGZnX3RlbXApLFxuICAgICAgfSxcbiAgICAgIGJhY2tncm91bmQ6IHtcbiAgICAgICAgc3R5bGU6ICdmaWxsJyxcbiAgICAgICAgY29sb3I6IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdmaWxsJykpLFxuICAgICAgfSxcbiAgICAgIGJvcmRlcjoge1xuICAgICAgICBzdHlsZTogJ291dGxpbmUnLFxuICAgICAgICBjb2xvcjogbmV3IFRpbnlDb2xvcihnZXRTdHlsZShlbCwgJ291dGxpbmUnKSksXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2VcbiAgICByZXR1cm4ge1xuICAgICAgZm9yZWdyb3VuZDoge1xuICAgICAgICBzdHlsZTogJ2NvbG9yJyxcbiAgICAgICAgY29sb3I6IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdjb2xvcicpKSxcbiAgICAgIH0sXG4gICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgIHN0eWxlOiAnYmFja2dyb3VuZENvbG9yJyxcbiAgICAgICAgY29sb3I6IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdiYWNrZ3JvdW5kQ29sb3InKSksXG4gICAgICB9LFxuICAgICAgYm9yZGVyOiB7XG4gICAgICAgIHN0eWxlOiAnYm9yZGVyQ29sb3InLFxuICAgICAgICBjb2xvcjogbmV3IFRpbnlDb2xvcihnZXRTdHlsZShlbCwgJ2JvcmRlckNvbG9yJykpLFxuICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCB7IGlzT2ZmQm91bmRzLCBkZWVwRWxlbWVudEZyb21Qb2ludCB9IGZyb20gJy4uL3V0aWxpdGllcy8nXG5cbmxldCBncmlkbGluZXNcblxuZXhwb3J0IGZ1bmN0aW9uIEd1aWRlcygpIHtcbiAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUnLCBvbl9ob3ZlcilcbiAgJCgnYm9keScpLm9uKCdtb3VzZW91dCcsIG9uX2hvdmVyb3V0KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaGlkZUdyaWRsaW5lcylcblxuICByZXR1cm4gKCkgPT4ge1xuICAgICQoJ2JvZHknKS5vZmYoJ21vdXNlbW92ZScsIG9uX2hvdmVyKVxuICAgICQoJ2JvZHknKS5vZmYoJ21vdXNlb3V0Jywgb25faG92ZXJvdXQpXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGhpZGVHcmlkbGluZXMpXG4gICAgaGlkZUdyaWRsaW5lcygpXG4gIH1cbn1cblxuY29uc3Qgb25faG92ZXIgPSBlID0+IHtcbiAgY29uc3QgdGFyZ2V0ID0gZGVlcEVsZW1lbnRGcm9tUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpXG4gIGlmIChpc09mZkJvdW5kcyh0YXJnZXQpKSByZXR1cm5cbiAgc2hvd0dyaWRsaW5lcyh0YXJnZXQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHdWlkZSh2ZXJ0ID0gdHJ1ZSkge1xuICBsZXQgZ3VpZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBsZXQgc3R5bGVzID0gYFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDA7XG4gICAgbGVmdDogMDtcbiAgICBiYWNrZ3JvdW5kOiBoc2xhKDMzMCwgMTAwJSwgNzElLCA3MCUpO1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIHotaW5kZXg6IDIxNDc0ODM2NDM7XG4gIGBcblxuICB2ZXJ0IFxuICAgID8gc3R5bGVzICs9IGBcbiAgICAgICAgd2lkdGg6IDFweDtcbiAgICAgICAgaGVpZ2h0OiAxMDB2aDtcbiAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMTgwZGVnKTtcbiAgICAgIGBcbiAgICA6IHN0eWxlcyArPSBgXG4gICAgICAgIGhlaWdodDogMXB4O1xuICAgICAgICB3aWR0aDogMTAwdnc7XG4gICAgICBgXG5cbiAgZ3VpZGUuc3R5bGUgPSBzdHlsZXNcblxuICByZXR1cm4gZ3VpZGVcbn1cblxuY29uc3Qgb25faG92ZXJvdXQgPSAoe3RhcmdldH0pID0+XG4gIGhpZGVHcmlkbGluZXMoKVxuXG5jb25zdCBzaG93R3JpZGxpbmVzID0gbm9kZSA9PiB7XG4gIGlmIChncmlkbGluZXMpIHtcbiAgICBncmlkbGluZXMuc3R5bGUuZGlzcGxheSA9IG51bGxcbiAgICBncmlkbGluZXMudXBkYXRlID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICB9XG4gIGVsc2Uge1xuICAgIGdyaWRsaW5lcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Zpc2J1Zy1ncmlkbGluZXMnKVxuICAgIGdyaWRsaW5lcy5wb3NpdGlvbiA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZ3JpZGxpbmVzKVxuICB9XG59XG5cbmNvbnN0IGhpZGVHcmlkbGluZXMgPSBub2RlID0+IHtcbiAgaWYgKCFncmlkbGluZXMpIHJldHVyblxuICBncmlkbGluZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIFNjcmVlbnNob3Qobm9kZSwgcGFnZSkge1xuICBhbGVydCgnQ29taW5nIFNvb24hJylcblxuICByZXR1cm4gKCkgPT4ge31cbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgbWV0YUtleSwgZ2V0U3R5bGUsIGdldFNpZGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT5cbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LGFsdCske2V2ZW50fSxzaGlmdCske2V2ZW50fSxzaGlmdCthbHQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuY29uc3QgY29tbWFuZF9ldmVudHMgPSBgJHttZXRhS2V5fSt1cCwke21ldGFLZXl9K3NoaWZ0K3VwLCR7bWV0YUtleX0rZG93biwke21ldGFLZXl9K3NoaWZ0K2Rvd25gXG5cbmV4cG9ydCBmdW5jdGlvbiBQb3NpdGlvbigpIHtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgZWxlbWVudHM6IFtdXG4gIH1cblxuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGUuY2FuY2VsQnViYmxlKSByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHBvc2l0aW9uRWxlbWVudChzdGF0ZS5lbGVtZW50cywgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgY29uc3Qgb25Ob2Rlc1NlbGVjdGVkID0gZWxzID0+IHtcbiAgICBzdGF0ZS5lbGVtZW50cy5mb3JFYWNoKGVsID0+XG4gICAgICBlbC50ZWFyZG93bigpKVxuXG4gICAgc3RhdGUuZWxlbWVudHMgPSBlbHMubWFwKGVsID0+XG4gICAgICBkcmFnZ2FibGUoZWwpKVxuICB9XG5cbiAgY29uc3QgZGlzY29ubmVjdCA9ICgpID0+IHtcbiAgICBzdGF0ZS5lbGVtZW50cy5mb3JFYWNoKGVsID0+IGVsLnRlYXJkb3duKCkpXG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb25Ob2Rlc1NlbGVjdGVkLFxuICAgIGRpc2Nvbm5lY3QsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRyYWdnYWJsZShlbCkge1xuICB0aGlzLnN0YXRlID0ge1xuICAgIG1vdXNlOiB7XG4gICAgICBkb3duOiBmYWxzZSxcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH0sXG4gICAgZWxlbWVudDoge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2V0dXAgPSAoKSA9PiB7XG4gICAgZWwuc3R5bGUudHJhbnNpdGlvbiAgID0gJ25vbmUnXG4gICAgZWwuc3R5bGUuY3Vyc29yICAgICAgID0gJ21vdmUnXG5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbk1vdXNlRG93biwgdHJ1ZSlcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwLCB0cnVlKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCB0cnVlKVxuICB9XG5cbiAgY29uc3QgdGVhcmRvd24gPSAoKSA9PiB7XG4gICAgZWwuc3R5bGUudHJhbnNpdGlvbiAgID0gbnVsbFxuICAgIGVsLnN0eWxlLmN1cnNvciAgICAgICA9IG51bGxcblxuICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duLCB0cnVlKVxuICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXAsIHRydWUpXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIHRydWUpXG4gIH1cblxuICBjb25zdCBvbk1vdXNlRG93biA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgY29uc3QgZWwgPSBlLnRhcmdldFxuXG4gICAgZWwuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnXG4gICAgZWwuc3R5bGUud2lsbENoYW5nZSA9ICd0b3AsbGVmdCdcblxuICAgIGlmIChlbCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHRyYW5zbGF0ZSA9IGVsLmdldEF0dHJpYnV0ZSgndHJhbnNmb3JtJylcblxuICAgICAgY29uc3QgWyB4LCB5IF0gPSB0cmFuc2xhdGVcbiAgICAgICAgPyBleHRyYWN0U1ZHVHJhbnNsYXRlKHRyYW5zbGF0ZSlcbiAgICAgICAgOiBbMCwwXVxuXG4gICAgICB0aGlzLnN0YXRlLmVsZW1lbnQueCAgPSB4XG4gICAgICB0aGlzLnN0YXRlLmVsZW1lbnQueSAgPSB5XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZS5lbGVtZW50LnggID0gcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdsZWZ0JykpXG4gICAgICB0aGlzLnN0YXRlLmVsZW1lbnQueSAgPSBwYXJzZUludChnZXRTdHlsZShlbCwgJ3RvcCcpKVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGUubW91c2UueCAgICAgID0gZS5jbGllbnRYXG4gICAgdGhpcy5zdGF0ZS5tb3VzZS55ICAgICAgPSBlLmNsaWVudFlcbiAgICB0aGlzLnN0YXRlLm1vdXNlLmRvd24gICA9IHRydWVcbiAgfVxuXG4gIGNvbnN0IG9uTW91c2VVcCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIHRoaXMuc3RhdGUubW91c2UuZG93biA9IGZhbHNlXG4gICAgZWwuc3R5bGUud2lsbENoYW5nZSA9IG51bGxcblxuICAgIGlmIChlbCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHRyYW5zbGF0ZSA9IGVsLmdldEF0dHJpYnV0ZSgndHJhbnNmb3JtJylcblxuICAgICAgY29uc3QgWyB4LCB5IF0gPSB0cmFuc2xhdGVcbiAgICAgICAgPyBleHRyYWN0U1ZHVHJhbnNsYXRlKHRyYW5zbGF0ZSlcbiAgICAgICAgOiBbMCwwXVxuXG4gICAgICB0aGlzLnN0YXRlLmVsZW1lbnQueCAgICA9IHhcbiAgICAgIHRoaXMuc3RhdGUuZWxlbWVudC55ICAgID0geVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUuZWxlbWVudC54ICAgID0gcGFyc2VJbnQoZWwuc3R5bGUubGVmdCkgfHwgMFxuICAgICAgdGhpcy5zdGF0ZS5lbGVtZW50LnkgICAgPSBwYXJzZUludChlbC5zdHlsZS50b3ApIHx8IDBcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGlmICghdGhpcy5zdGF0ZS5tb3VzZS5kb3duKSByZXR1cm5cblxuICAgIGlmIChlbCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJywgYHRyYW5zbGF0ZShcbiAgICAgICAgJHt0aGlzLnN0YXRlLmVsZW1lbnQueCArIGUuY2xpZW50WCAtIHRoaXMuc3RhdGUubW91c2UueH0sXG4gICAgICAgICR7dGhpcy5zdGF0ZS5lbGVtZW50LnkgKyBlLmNsaWVudFkgLSB0aGlzLnN0YXRlLm1vdXNlLnl9XG4gICAgICApYClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlbC5zdHlsZS5sZWZ0ID0gdGhpcy5zdGF0ZS5lbGVtZW50LnggKyBlLmNsaWVudFggLSB0aGlzLnN0YXRlLm1vdXNlLnggKyAncHgnXG4gICAgICBlbC5zdHlsZS50b3AgID0gdGhpcy5zdGF0ZS5lbGVtZW50LnkgKyBlLmNsaWVudFkgLSB0aGlzLnN0YXRlLm1vdXNlLnkgKyAncHgnXG4gICAgfVxuICB9XG5cbiAgc2V0dXAoKVxuICBlbC50ZWFyZG93biA9IHRlYXJkb3duXG5cbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwb3NpdGlvbkVsZW1lbnQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBlbnN1cmVQb3NpdGlvbmFibGUoZWwpKVxuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoe1xuICAgICAgICBlbCxcbiAgICAgICAgLi4uZXh0cmFjdEN1cnJlbnRWYWx1ZUFuZFNpZGUoZWwsIGRpcmVjdGlvbiksXG4gICAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgICAgbmVnYXRpdmU6IGRldGVybWluZU5lZ2F0aXZpdHkoZWwsIGRpcmVjdGlvbiksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgcG9zaXRpb246IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHBvc2l0aW9ufSkgPT5cbiAgICAgIGVsIGluc3RhbmNlb2YgU1ZHRWxlbWVudFxuICAgICAgICA/IHNldFRyYW5zbGF0ZU9uU1ZHKGVsLCBkaXJlY3Rpb24sIHBvc2l0aW9uKVxuICAgICAgICA6IGVsLnN0eWxlW3N0eWxlXSA9IHBvc2l0aW9uICsgJ3B4Jylcbn1cblxuY29uc3QgZXh0cmFjdEN1cnJlbnRWYWx1ZUFuZFNpZGUgPSAoZWwsIGRpcmVjdGlvbikgPT4ge1xuICBsZXQgc3R5bGUsIGN1cnJlbnRcblxuICBpZiAoZWwgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgY29uc3QgdHJhbnNsYXRlID0gZWwuYXR0cigndHJhbnNmb3JtJylcblxuICAgIGNvbnN0IFsgeCwgeSBdID0gdHJhbnNsYXRlXG4gICAgICA/IGV4dHJhY3RTVkdUcmFuc2xhdGUodHJhbnNsYXRlKVxuICAgICAgOiBbMCwwXVxuXG4gICAgc3R5bGUgICA9ICd0cmFuc2Zvcm0nXG4gICAgY3VycmVudCA9IGRpcmVjdGlvbi5pbmNsdWRlcygnZG93bicpIHx8IGRpcmVjdGlvbi5pbmNsdWRlcygndXAnKVxuICAgICAgPyB5XG4gICAgICA6IHhcbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBzaWRlID0gZ2V0U2lkZShkaXJlY3Rpb24pLnRvTG93ZXJDYXNlKClcbiAgICBzdHlsZSA9IChzaWRlID09PSAndG9wJyB8fCBzaWRlID09PSAnYm90dG9tJykgPyAndG9wJyA6ICdsZWZ0J1xuICAgIGN1cnJlbnQgPSBnZXRTdHlsZShlbCwgc3R5bGUpXG5cbiAgICBjdXJyZW50ID09PSAnYXV0bydcbiAgICAgID8gY3VycmVudCA9IDBcbiAgICAgIDogY3VycmVudCA9IHBhcnNlSW50KGN1cnJlbnQsIDEwKVxuICB9XG5cbiAgcmV0dXJuIHsgc3R5bGUsIGN1cnJlbnQgfVxufVxuXG5jb25zdCBleHRyYWN0U1ZHVHJhbnNsYXRlID0gdHJhbnNsYXRlID0+XG4gIHRyYW5zbGF0ZS5zdWJzdHJpbmcoXG4gICAgdHJhbnNsYXRlLmluZGV4T2YoJygnKSArIDEsXG4gICAgdHJhbnNsYXRlLmluZGV4T2YoJyknKVxuICApLnNwbGl0KCcsJylcbiAgLm1hcCh2YWwgPT4gcGFyc2VGbG9hdCh2YWwpKVxuXG5jb25zdCBzZXRUcmFuc2xhdGVPblNWRyA9IChlbCwgZGlyZWN0aW9uLCBwb3NpdGlvbikgPT4ge1xuICBjb25zdCB0cmFuc2Zvcm0gPSBlbC5hdHRyKCd0cmFuc2Zvcm0nKVxuICBjb25zdCBbIHgsIHkgXSA9IHRyYW5zZm9ybVxuICAgID8gZXh0cmFjdFNWR1RyYW5zbGF0ZSh0cmFuc2Zvcm0pXG4gICAgOiBbMCwwXVxuXG4gIGNvbnN0IHBvcyA9IGRpcmVjdGlvbi5pbmNsdWRlcygnZG93bicpIHx8IGRpcmVjdGlvbi5pbmNsdWRlcygndXAnKVxuICAgID8gYCR7eH0sJHtwb3NpdGlvbn1gXG4gICAgOiBgJHtwb3NpdGlvbn0sJHt5fWBcblxuICBlbC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7cG9zfSlgKVxufVxuXG5jb25zdCBkZXRlcm1pbmVOZWdhdGl2aXR5ID0gKGVsLCBkaXJlY3Rpb24pID0+XG4gIGRpcmVjdGlvbi5pbmNsdWRlcygncmlnaHQnKSB8fCBkaXJlY3Rpb24uaW5jbHVkZXMoJ2Rvd24nKVxuXG5jb25zdCBlbnN1cmVQb3NpdGlvbmFibGUgPSBlbCA9PiB7XG4gIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgIGVsLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJ1xuICByZXR1cm4gZWxcbn1cbiIsImltcG9ydCAqIGFzIEljb25zIGZyb20gJy4vdmlzLWJ1Zy5pY29ucydcbmltcG9ydCB7IG1ldGFLZXksIGFsdEtleSB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy8nXG5cbmV4cG9ydCBjb25zdCBWaXNCdWdNb2RlbCA9IHtcbiAgZzoge1xuICAgIHRvb2w6ICAgICAgICAnZ3VpZGVzJyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMuZ3VpZGVzLFxuICAgIGxhYmVsOiAgICAgICAnR3VpZGVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1ZlcmlmeSBhbGlnbm1lbnQgJiBjaGVjayB5b3VyIGdyaWQnLFxuICAgIGluc3RydWN0aW9uOiBgPGRpdiB0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5NZWFzdXJlOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke2FsdEtleX0gKyBob3Zlcjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICBpOiB7XG4gICAgdG9vbDogICAgICAgICdpbnNwZWN0b3InLFxuICAgIGljb246ICAgICAgICBJY29ucy5pbnNwZWN0b3IsXG4gICAgbGFiZWw6ICAgICAgICdJbnNwZWN0JyxcbiAgICBkZXNjcmlwdGlvbjogJ1BlZWsgaW50byBjb21tb24gJiBjdXJyZW50IHN0eWxlcyBvZiBhbiBlbGVtZW50JyxcbiAgICBpbnN0cnVjdGlvbjogYDxkaXYgdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+UGluIGl0OjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke2FsdEtleX0gKyBjbGljazwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICB4OiB7XG4gICAgdG9vbDogICAgICAgICdhY2Nlc3NpYmlsaXR5JyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMuYWNjZXNzaWJpbGl0eSxcbiAgICBsYWJlbDogICAgICAgJ0FjY2Vzc2liaWxpdHknLFxuICAgIGRlc2NyaXB0aW9uOiAnUGVlayBpbnRvIEExMXkgYXR0cmlidXRlcyAmIGNvbXBsaWFuY2Ugc3RhdHVzJyxcbiAgICBpbnN0cnVjdGlvbjogYDxkaXYgdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+UGluIGl0OjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke2FsdEtleX0gKyBjbGljazwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICB2OiB7XG4gICAgdG9vbDogICAgICAgICdtb3ZlJyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMubW92ZSxcbiAgICBsYWJlbDogICAgICAgJ01vdmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnUHVzaCBlbGVtZW50cyBpbiAmIG91dCBvZiB0aGVpciBjb250YWluZXIsIG9yIHNodWZmbGUgdGhlbSB3aXRoaW4gaXQnLFxuICAgIGluc3RydWN0aW9uOiBgPGRpdiB0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5MYXRlcmFsOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7il4Ag4pa2PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5PdXQgYW5kIGFib3ZlOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7ilrI8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPkRvd24gYW5kIGluOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7ilrw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+YCxcbiAgfSxcbiAgLy8gcjoge1xuICAvLyAgIHRvb2w6ICAgICAgICAncmVzaXplJyxcbiAgLy8gICBpY29uOiAgICAgICAgSWNvbnMucmVzaXplLFxuICAvLyAgIGxhYmVsOiAgICAgICAnUmVzaXplJyxcbiAgLy8gICBkZXNjcmlwdGlvbjogJydcbiAgLy8gfSxcbiAgbToge1xuICAgIHRvb2w6ICAgICAgICAnbWFyZ2luJyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMubWFyZ2luLFxuICAgIGxhYmVsOiAgICAgICAnTWFyZ2luJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FkZCBvciBzdWJ0cmFjdCBvdXRlciBzcGFjZSBmcm9tIGFueSBvciBhbGwgc2lkZXMgb2YgdGhlIHNlbGVjdGVkIGVsZW1lbnQocyknLFxuICAgIGluc3RydWN0aW9uOiBgPGRpdiB0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj4rIE1hcmdpbjo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+4peAIOKWtiDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj4tIE1hcmdpbjo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+JHthbHRLZXl9ICsg4peAIOKWtiDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5BbGwgU2lkZXM6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7bWV0YUtleX0gKyAg4payIOKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICBwOiB7XG4gICAgdG9vbDogICAgICAgICdwYWRkaW5nJyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMucGFkZGluZyxcbiAgICBsYWJlbDogICAgICAgJ1BhZGRpbmcnLFxuICAgIGRlc2NyaXB0aW9uOiBgQWRkIG9yIHN1YnRyYWN0IGlubmVyIHNwYWNlIGZyb20gYW55IG9yIGFsbCBzaWRlcyBvZiB0aGUgc2VsZWN0ZWQgZWxlbWVudChzKWAsXG4gICAgaW5zdHJ1Y3Rpb246IGA8ZGl2IHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPisgUGFkZGluZzo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+4peAIOKWtiDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj4tIFBhZGRpbmc6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7YWx0S2V5fSArIOKXgCDilrYg4payIOKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+QWxsIFNpZGVzOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke21ldGFLZXl9ICsgIOKWsiDilrw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+YFxuICB9LFxuICAvLyBiOiB7XG4gIC8vICAgdG9vbDogICAgICAgICdib3JkZXInLFxuICAvLyAgIGljb246ICAgICAgICBJY29ucy5ib3JkZXIsXG4gIC8vICAgbGFiZWw6ICAgICAgICdCb3JkZXInLFxuICAvLyAgIGRlc2NyaXB0aW9uOiAnJ1xuICAvLyB9LFxuICBhOiB7XG4gICAgdG9vbDogICAgICAgICdhbGlnbicsXG4gICAgaWNvbjogICAgICAgIEljb25zLmFsaWduLFxuICAgIGxhYmVsOiAgICAgICAnRmxleGJveCBBbGlnbicsXG4gICAgZGVzY3JpcHRpb246IGBDcmVhdGUgb3IgbW9kaWZ5IGZsZXhib3ggZGlyZWN0aW9uLCBkaXN0cmlidXRpb24gJiBhbGlnbm1lbnRgLFxuICAgIGluc3RydWN0aW9uOiBgPGRpdiB0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5BbGlnbm1lbnQ6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPuKXgCDilrYg4payIOKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+RGlzdHJpYnV0aW9uOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5TaGlmdCArIOKXgCDilrY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPkRpcmVjdGlvbjo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+JHttZXRhS2V5fSArICDil4Ag4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PmAsXG4gIH0sXG4gIGg6IHtcbiAgICB0b29sOiAgICAgICAgJ2h1ZXNoaWZ0JyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMuaHVlc2hpZnQsXG4gICAgbGFiZWw6ICAgICAgICdIdWUgU2hpZnQnLFxuICAgIGRlc2NyaXB0aW9uOiBgQ2hhbmdlIGZvcmVncm91bmQvYmFja2dyb3VuZCBodWUsIGJyaWdodG5lc3MsIHNhdHVyYXRpb24gJiBvcGFjaXR5YCxcbiAgICBpbnN0cnVjdGlvbjogYDxkaXYgdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+U2F0dXJhdGlvbjo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+4peAIOKWtjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+QnJpZ2h0bmVzczo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+4payIOKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+SHVlOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke21ldGFLZXl9ICsgIOKWsiDilrw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPk9wYWNpdHk6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7bWV0YUtleX0gKyAg4peAIOKWtjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICBkOiB7XG4gICAgdG9vbDogICAgICAgICdib3hzaGFkb3cnLFxuICAgIGljb246ICAgICAgICBJY29ucy5ib3hzaGFkb3csXG4gICAgbGFiZWw6ICAgICAgICdTaGFkb3cnLFxuICAgIGRlc2NyaXB0aW9uOiBgQ3JlYXRlICYgYWRqdXN0IHBvc2l0aW9uLCBibHVyICYgb3BhY2l0eSBvZiBhIGJveCBzaGFkb3dgLFxuICAgIGluc3RydWN0aW9uOiBgPGRpdiB0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5YL1kgUG9zaXRpb246PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPuKXgCDilrYg4payIOKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+Qmx1cjo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+U2hpZnQgKyDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5TcHJlYWQ6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlNoaWZ0ICsg4peAIOKWtjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+T3BhY2l0eTo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+JHttZXRhS2V5fSArIOKXgCDilrY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+YCxcbiAgfSxcbiAgLy8gdDoge1xuICAvLyAgIHRvb2w6ICAgICAgICAndHJhbnNmb3JtJyxcbiAgLy8gICBpY29uOiAgICAgICAgSWNvbnMudHJhbnNmb3JtLFxuICAvLyAgIGxhYmVsOiAgICAgICAnM0QgVHJhbnNmb3JtJyxcbiAgLy8gICBkZXNjcmlwdGlvbjogJydcbiAgLy8gfSxcbiAgbDoge1xuICAgIHRvb2w6ICAgICAgICAncG9zaXRpb24nLFxuICAgIGljb246ICAgICAgICBJY29ucy5wb3NpdGlvbixcbiAgICBsYWJlbDogICAgICAgJ1Bvc2l0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ01vdmUgc3ZnICh4LHkpIGFuZCBlbGVtZW50cyAodG9wLGxlZnQsYm90dG9tLHJpZ2h0KScsXG4gICAgaW5zdHJ1Y3Rpb246IGA8ZGl2IHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPk51ZGdlOjwvYj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7il4Ag4pa2IOKWsiDilrw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPk1vdmU6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkNsaWNrICYgZHJhZzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gLFxuICB9LFxuICBmOiB7XG4gICAgdG9vbDogICAgICAgICdmb250JyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMuZm9udCxcbiAgICBsYWJlbDogICAgICAgJ0ZvbnQgU3R5bGVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0NoYW5nZSBzaXplLCBhbGlnbm1lbnQsIGxlYWRpbmcsIGxldHRlci1zcGFjaW5nLCAmIHdlaWdodCcsXG4gICAgaW5zdHJ1Y3Rpb246IGA8ZGl2IHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPlNpemU6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPuKWsiDilrw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxiPkFsaWdubWVudDo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+4peAIOKWtjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+TGVhZGluZzo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+U2hpZnQgKyDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5MZXR0ZXItc3BhY2luZzo8L2I+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+U2hpZnQgKyDil4Ag4pa2PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj5XZWlnaHQ6PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7bWV0YUtleX0gKyDilrIg4pa8PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PmAsXG4gIH0sXG4gIGU6IHtcbiAgICB0b29sOiAgICAgICAgJ3RleHQnLFxuICAgIGljb246ICAgICAgICBJY29ucy50ZXh0LFxuICAgIGxhYmVsOiAgICAgICAnRWRpdCBUZXh0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0NoYW5nZSBhbnkgdGV4dCBvbiB0aGUgcGFnZSB3aXRoIGEgPGI+ZG91YmxlIGNsaWNrPC9iPicsXG4gICAgaW5zdHJ1Y3Rpb246ICcnLFxuICB9LFxuICAvLyBjOiB7XG4gIC8vICAgdG9vbDogICAgICAgICdzY3JlZW5zaG90JyxcbiAgLy8gICBpY29uOiAgICAgICAgSWNvbnMuY2FtZXJhLFxuICAvLyAgIGxhYmVsOiAgICAgICAnU2NyZWVuc2hvdCcsXG4gIC8vICAgZGVzY3JpcHRpb246ICdTY3JlZW5zaG90IHNlbGVjdGVkIGVsZW1lbnRzIG9yIHRoZSBlbnRpcmUgcGFnZSdcbiAgLy8gfSxcbiAgczoge1xuICAgIHRvb2w6ICAgICAgICAnc2VhcmNoJyxcbiAgICBpY29uOiAgICAgICAgSWNvbnMuc2VhcmNoLFxuICAgIGxhYmVsOiAgICAgICAnU2VhcmNoJyxcbiAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBlbGVtZW50cyBwcm9ncmFtYXRpY2FsbHkgYnkgc2VhcmNoaW5nIGZvciB0aGVtIG9yIHVzZSBidWlsdCBpbiBwbHVnaW5zIHdpdGggc3BlY2lhbCBjb21tYW5kcycsXG4gICAgaW5zdHJ1Y3Rpb246ICcnLFxuICB9LFxufVxuIiwiaW1wb3J0ICQgICAgICAgICAgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgICAgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCBzdHlsZXMgICAgIGZyb20gJy4vdmlzLWJ1Zy5lbGVtZW50LmNzcydcblxuaW1wb3J0IHtcbiAgSGFuZGxlcywgTGFiZWwsIE92ZXJsYXksIEdyaWRsaW5lcyxcbiAgSG90a2V5cywgTWV0YXRpcCwgQWxseSwgRGlzdGFuY2UsIEJveE1vZGVsLFxufSBmcm9tICcuLi8nXG5cbmltcG9ydCB7XG4gIFNlbGVjdGFibGUsIE1vdmVhYmxlLCBQYWRkaW5nLCBNYXJnaW4sIEVkaXRUZXh0LCBGb250LFxuICBGbGV4LCBTZWFyY2gsIENvbG9yUGlja2VyLCBCb3hTaGFkb3csIEh1ZVNoaWZ0LCBNZXRhVGlwLFxuICBHdWlkZXMsIFNjcmVlbnNob3QsIFBvc2l0aW9uLCBBY2Nlc3NpYmlsaXR5XG59IGZyb20gJy4uLy4uL2ZlYXR1cmVzLydcblxuaW1wb3J0IHsgVmlzQnVnTW9kZWwgfSAgICAgICAgICAgICAgZnJvbSAnLi9tb2RlbCdcbmltcG9ydCAqIGFzIEljb25zICAgICAgICAgICAgICAgICBmcm9tICcuL3Zpcy1idWcuaWNvbnMnXG5pbXBvcnQgeyBwcm92aWRlU2VsZWN0b3JFbmdpbmUgfSAgZnJvbSAnLi4vLi4vZmVhdHVyZXMvc2VhcmNoJ1xuaW1wb3J0IHsgbWV0YUtleSB9ICAgICAgICAgICAgICAgIGZyb20gJy4uLy4uL3V0aWxpdGllcy8nXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZpc0J1ZyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy50b29sYmFyX21vZGVsICA9IFZpc0J1Z01vZGVsXG4gICAgdGhpcy5fdHV0c0Jhc2VVUkwgICA9ICd0dXRzJyAvLyBjYW4gYmUgc2V0IGJ5IGNvbnRlbnQgc2NyaXB0XG4gICAgdGhpcy4kc2hhZG93ICAgICAgICA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnY2xvc2VkJ30pXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBpZiAoIXRoaXMuJHNoYWRvdy5pbm5lckhUTUwpXG4gICAgICB0aGlzLnNldHVwKClcblxuICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUgPSBTZWxlY3RhYmxlKClcbiAgICB0aGlzLmNvbG9yUGlja2VyICAgID0gQ29sb3JQaWNrZXIodGhpcy4kc2hhZG93LCB0aGlzLnNlbGVjdG9yRW5naW5lKVxuICAgIHByb3ZpZGVTZWxlY3RvckVuZ2luZSh0aGlzLnNlbGVjdG9yRW5naW5lKVxuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUoKVxuICAgIHRoaXMuY2xlYW51cCgpXG4gICAgdGhpcy5zZWxlY3RvckVuZ2luZS5kaXNjb25uZWN0KClcbiAgICBob3RrZXlzLnVuYmluZChcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMudG9vbGJhcl9tb2RlbCkucmVkdWNlKChldmVudHMsIGtleSkgPT5cbiAgICAgICAgZXZlbnRzICs9ICcsJyArIGtleSwgJycpKVxuICAgIGhvdGtleXMudW5iaW5kKGAke21ldGFLZXl9Ky9gKVxuICB9XG5cbiAgc2V0dXAoKSB7XG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCA9IHRoaXMucmVuZGVyKClcblxuICAgICQoJ2xpW2RhdGEtdG9vbF0nLCB0aGlzLiRzaGFkb3cpLm9uKCdjbGljaycsIGUgPT5cbiAgICAgIHRoaXMudG9vbFNlbGVjdGVkKGUuY3VycmVudFRhcmdldCkgJiYgZS5zdG9wUHJvcGFnYXRpb24oKSlcblxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMudG9vbGJhcl9tb2RlbCkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PlxuICAgICAgaG90a2V5cyhrZXksIGUgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgdGhpcy50b29sU2VsZWN0ZWQoXG4gICAgICAgICAgJChgW2RhdGEtdG9vbD1cIiR7dmFsdWUudG9vbH1cIl1gLCB0aGlzLiRzaGFkb3cpWzBdXG4gICAgICAgIClcbiAgICAgIH0pXG4gICAgKVxuXG4gICAgaG90a2V5cyhgJHttZXRhS2V5fSsvLCR7bWV0YUtleX0rLmAsIGUgPT5cbiAgICAgIHRoaXMuJHNoYWRvdy5ob3N0LnN0eWxlLmRpc3BsYXkgPVxuICAgICAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZSdcbiAgICAgICAgICA/ICdibG9jaydcbiAgICAgICAgICA6ICdub25lJylcblxuICAgIHRoaXMudG9vbFNlbGVjdGVkKCQoJ1tkYXRhLXRvb2w9XCJndWlkZXNcIl0nLCB0aGlzLiRzaGFkb3cpWzBdKVxuICB9XG5cbiAgY2xlYW51cCgpIHtcbiAgICBjb25zdCBieWUgPSBbXG4gICAgICAuLi5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndmlzYnVnLWhvdmVyJyksXG4gICAgICAuLi5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndmlzYnVnLWhhbmRsZXMnKSxcbiAgICAgIC4uLmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd2aXNidWctbGFiZWwnKSxcbiAgICAgIC4uLmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd2aXNidWctZ3JpZGxpbmVzJyksXG4gICAgXS5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKVxuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcHNldWRvLXNlbGVjdD10cnVlXScpXG4gICAgICAuZm9yRWFjaChlbCA9PlxuICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcHNldWRvLXNlbGVjdCcpKVxuICB9XG5cbiAgdG9vbFNlbGVjdGVkKGVsKSB7XG4gICAgaWYgKHR5cGVvZiBlbCA9PT0gJ3N0cmluZycpXG4gICAgICBlbCA9ICQoYFtkYXRhLXRvb2w9XCIke2VsfVwiXWAsIHRoaXMuJHNoYWRvdylbMF1cblxuICAgIGlmICh0aGlzLmFjdGl2ZV90b29sICYmIHRoaXMuYWN0aXZlX3Rvb2wuZGF0YXNldC50b29sID09PSBlbC5kYXRhc2V0LnRvb2wpIHJldHVyblxuXG4gICAgaWYgKHRoaXMuYWN0aXZlX3Rvb2wpIHtcbiAgICAgIHRoaXMuYWN0aXZlX3Rvb2wuYXR0cignZGF0YS1hY3RpdmUnLCBudWxsKVxuICAgICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUoKVxuICAgIH1cblxuICAgIGVsLmF0dHIoJ2RhdGEtYWN0aXZlJywgdHJ1ZSlcbiAgICB0aGlzLmFjdGl2ZV90b29sID0gZWxcbiAgICB0aGlzW2VsLmRhdGFzZXQudG9vbF0oKVxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8dmlzYnVnLWhvdGtleXM+PC92aXNidWctaG90a2V5cz5cbiAgICAgIDxvbD5cbiAgICAgICAgJHtPYmplY3QuZW50cmllcyh0aGlzLnRvb2xiYXJfbW9kZWwpLnJlZHVjZSgobGlzdCwgW2tleSwgdG9vbF0pID0+IGBcbiAgICAgICAgICAke2xpc3R9XG4gICAgICAgICAgPGxpIGFyaWEtbGFiZWw9XCIke3Rvb2wubGFiZWx9IFRvb2xcIiBhcmlhLWRlc2NyaXB0aW9uPVwiJHt0b29sLmRlc2NyaXB0aW9ufVwiIGFyaWEtaG90a2V5PVwiJHtrZXl9XCIgZGF0YS10b29sPVwiJHt0b29sLnRvb2x9XCIgZGF0YS1hY3RpdmU9XCIke2tleSA9PSAnZyd9XCI+XG4gICAgICAgICAgICAke3Rvb2wuaWNvbn1cbiAgICAgICAgICAgICR7dGhpcy5kZW1vVGlwKHtrZXksIC4uLnRvb2x9KX1cbiAgICAgICAgICA8L2xpPlxuICAgICAgICBgLCcnKX1cbiAgICAgIDwvb2w+XG4gICAgICA8b2wgY29sb3JzPlxuICAgICAgICA8bGkgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGNsYXNzPVwiY29sb3JcIiBpZD1cImZvcmVncm91bmRcIiBhcmlhLWxhYmVsPVwiVGV4dFwiIGFyaWEtZGVzY3JpcHRpb249XCJDaGFuZ2UgdGhlIHRleHQgY29sb3JcIj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImNvbG9yXCIgdmFsdWU9XCJcIj5cbiAgICAgICAgICAke0ljb25zLmNvbG9yX3RleHR9XG4gICAgICAgIDwvbGk+XG4gICAgICAgIDxsaSBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgY2xhc3M9XCJjb2xvclwiIGlkPVwiYmFja2dyb3VuZFwiIGFyaWEtbGFiZWw9XCJCYWNrZ3JvdW5kIG9yIEZpbGxcIiBhcmlhLWRlc2NyaXB0aW9uPVwiQ2hhbmdlIHRoZSBiYWNrZ3JvdW5kIGNvbG9yIG9yIGZpbGwgb2Ygc3ZnXCI+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJjb2xvclwiIHZhbHVlPVwiXCI+XG4gICAgICAgICAgJHtJY29ucy5jb2xvcl9iYWNrZ3JvdW5kfVxuICAgICAgICA8L2xpPlxuICAgICAgICA8bGkgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGNsYXNzPVwiY29sb3JcIiBpZD1cImJvcmRlclwiIGFyaWEtbGFiZWw9XCJCb3JkZXIgb3IgU3Ryb2tlXCIgYXJpYS1kZXNjcmlwdGlvbj1cIkNoYW5nZSB0aGUgYm9yZGVyIGNvbG9yIG9yIHN0cm9rZSBvZiBzdmdcIj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImNvbG9yXCIgdmFsdWU9XCJcIj5cbiAgICAgICAgICAke0ljb25zLmNvbG9yX2JvcmRlcn1cbiAgICAgICAgPC9saT5cbiAgICAgIDwvb2w+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKCkge1xuICAgIHJldHVybiBgXG4gICAgICA8c3R5bGU+XG4gICAgICAgICR7c3R5bGVzfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cblxuICBkZW1vVGlwKHtrZXksIHRvb2wsIGxhYmVsLCBkZXNjcmlwdGlvbiwgaW5zdHJ1Y3Rpb259KSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxhc2lkZSAke3Rvb2x9PlxuICAgICAgICA8ZmlndXJlPlxuICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aGlzLl90dXRzQmFzZVVSTH0vJHt0b29sfS5naWZcIiBhbHQ9XCIke2Rlc2NyaXB0aW9ufVwiIC8+XG4gICAgICAgICAgPGZpZ2NhcHRpb24+XG4gICAgICAgICAgICA8aDI+XG4gICAgICAgICAgICAgICR7bGFiZWx9XG4gICAgICAgICAgICAgIDxzcGFuIGhvdGtleT4ke2tleX08L3NwYW4+XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgPHA+JHtkZXNjcmlwdGlvbn08L3A+XG4gICAgICAgICAgICAke2luc3RydWN0aW9ufVxuICAgICAgICAgIDwvZmlnY2FwdGlvbj5cbiAgICAgICAgPC9maWd1cmU+XG4gICAgICA8L2FzaWRlPlxuICAgIGBcbiAgfVxuXG4gIG1vdmUoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBNb3ZlYWJsZSh0aGlzLnNlbGVjdG9yRW5naW5lKVxuICB9XG5cbiAgbWFyZ2luKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gTWFyZ2luKHRoaXMuc2VsZWN0b3JFbmdpbmUpXG4gIH1cblxuICBwYWRkaW5nKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gUGFkZGluZyh0aGlzLnNlbGVjdG9yRW5naW5lKVxuICB9XG5cbiAgZm9udCgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IEZvbnQodGhpcy5zZWxlY3RvckVuZ2luZSlcbiAgfVxuXG4gIHRleHQoKSB7XG4gICAgdGhpcy5zZWxlY3RvckVuZ2luZS5vblNlbGVjdGVkVXBkYXRlKEVkaXRUZXh0KVxuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gKCkgPT5cbiAgICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUucmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayhFZGl0VGV4dClcbiAgfVxuXG4gIGFsaWduKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gRmxleCh0aGlzLnNlbGVjdG9yRW5naW5lKVxuICB9XG5cbiAgc2VhcmNoKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gU2VhcmNoKCQoJ1tkYXRhLXRvb2w9XCJzZWFyY2hcIl0nLCB0aGlzLiRzaGFkb3cpKVxuICB9XG5cbiAgYm94c2hhZG93KCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gQm94U2hhZG93KHRoaXMuc2VsZWN0b3JFbmdpbmUpXG4gIH1cblxuICBodWVzaGlmdCgpIHtcbiAgICBsZXQgZmVhdHVyZSA9IEh1ZVNoaWZ0KHRoaXMuY29sb3JQaWNrZXIpXG4gICAgdGhpcy5zZWxlY3RvckVuZ2luZS5vblNlbGVjdGVkVXBkYXRlKGZlYXR1cmUub25Ob2Rlc1NlbGVjdGVkKVxuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gKCkgPT4ge1xuICAgICAgdGhpcy5zZWxlY3RvckVuZ2luZS5yZW1vdmVTZWxlY3RlZENhbGxiYWNrKGZlYXR1cmUub25Ob2Rlc1NlbGVjdGVkKVxuICAgICAgZmVhdHVyZS5kaXNjb25uZWN0KClcbiAgICB9XG4gIH1cblxuICBpbnNwZWN0b3IoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBNZXRhVGlwKHRoaXMuc2VsZWN0b3JFbmdpbmUpXG4gIH1cblxuICBhY2Nlc3NpYmlsaXR5KCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gQWNjZXNzaWJpbGl0eSgpXG4gIH1cblxuICBndWlkZXMoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBHdWlkZXMoKVxuICB9XG5cbiAgc2NyZWVuc2hvdCgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IFNjcmVlbnNob3QoKVxuICB9XG5cbiAgcG9zaXRpb24oKSB7XG4gICAgbGV0IGZlYXR1cmUgPSBQb3NpdGlvbigpXG4gICAgdGhpcy5zZWxlY3RvckVuZ2luZS5vblNlbGVjdGVkVXBkYXRlKGZlYXR1cmUub25Ob2Rlc1NlbGVjdGVkKVxuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gKCkgPT4ge1xuICAgICAgdGhpcy5zZWxlY3RvckVuZ2luZS5yZW1vdmVTZWxlY3RlZENhbGxiYWNrKGZlYXR1cmUub25Ob2Rlc1NlbGVjdGVkKVxuICAgICAgZmVhdHVyZS5kaXNjb25uZWN0KClcbiAgICB9XG4gIH1cblxuICBnZXQgYWN0aXZlVG9vbCgpIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVfdG9vbC5kYXRhc2V0LnRvb2xcbiAgfVxuXG4gIHNldCB0dXRzQmFzZVVSTCh1cmwpIHtcbiAgICB0aGlzLl90dXRzQmFzZVVSTCA9IHVybFxuICAgIHRoaXMuc2V0dXAoKVxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndmlzLWJ1ZycsIFZpc0J1ZylcbiIsImltcG9ydCBWaXNCdWcgZnJvbSAnLi9jb21wb25lbnRzL3Zpcy1idWcvdmlzLWJ1Zy5lbGVtZW50J1xuaW1wb3J0IHsgbWV0YUtleSB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG5pZiAoJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9iaWxlLWluZm8nKS5zdHlsZS5kaXNwbGF5ID0gJydcblxuaWYgKG1ldGFLZXkgPT09ICdjdHJsJylcbiAgWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2tiZCcpXVxuICAgIC5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgbm9kZS50ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQucmVwbGFjZSgnY21kJywnY3RybCcpXG4gICAgICBub2RlLnRleHRDb250ZW50ID0gbm9kZS50ZXh0Q29udGVudC5yZXBsYWNlKCdvcHQnLCdhbHQnKVxuICAgIH0pXG4iXSwibmFtZXMiOlsic3R5bGVzIiwiaG90a2V5cyIsImljb24iLCJrZXlfZXZlbnRzIiwiY29tbWFuZHMiLCJibGFua19wYWdlX2NvbW1hbmRzIiwiYmFycmVsX3JvbGxfY29tbWFuZHMiLCJwZXN0aWNpZGVfY29tbWFuZHMiLCJjb25zdHJ1Y3RfY29tbWFuZHMiLCJjb25zdHJ1Y3RfZGVidWdfY29tbWFuZHMiLCJ3aXJlZnJhbWVfY29tbWFuZHMiLCJza2VsZXRvbl9jb21tYW5kcyIsInRhZ19kZWJ1Z2dlcl9jb21tYW5kcyIsInJldmVuZ2VfY29tbWFuZHMiLCJ0b3RhMTF5X2NvbW1hbmRzIiwic2VhcmNoIiwiY29tbWFuZF9ldmVudHMiLCJwYWludEJhY2tncm91bmRzIiwicmVtb3ZlQmFja2dyb3VuZHMiLCJzdGF0ZSIsIm1vdXNlTW92ZSIsInRvZ2dsZVBpbm5lZCIsInJlbW92ZUFsbCIsInJlc3RvcmVQaW5uZWRUaXBzIiwiaGlkZUFsbCIsIndpcGUiLCJjbGVhckFjdGl2ZSIsInRvZ2dsZVRhcmdldEN1cnNvciIsInNob3dUaXAiLCJyZW5kZXIiLCJwb3NpdGlvblRpcCIsIm9ic2VydmUiLCJtb3VzZV9xdWFkcmFudCIsInRpcF9wb3NpdGlvbiIsInVub2JzZXJ2ZSIsImhhbmRsZUJsdXIiLCJyZW1vdmVBbGxBY2Nlc3NpYmlsaXR5VGlwcyIsInNob3dBY2Nlc3NpYmlsaXR5VGlwIiwicmVtb3ZlQWxsTWV0YVRpcHMiLCJzaG93TWV0YVRpcCIsInN0b3BCdWJibGluZyIsImhfYWxpZ25PcHRpb25zIiwidl9hbGlnbk9wdGlvbnMiLCJJY29ucy5ndWlkZXMiLCJJY29ucy5pbnNwZWN0b3IiLCJJY29ucy5hY2Nlc3NpYmlsaXR5IiwiSWNvbnMubW92ZSIsIkljb25zLm1hcmdpbiIsIkljb25zLnBhZGRpbmciLCJJY29ucy5hbGlnbiIsIkljb25zLmh1ZXNoaWZ0IiwiSWNvbnMuYm94c2hhZG93IiwiSWNvbnMucG9zaXRpb24iLCJJY29ucy5mb250IiwiSWNvbnMudGV4dCIsIkljb25zLnNlYXJjaCIsIkljb25zLmNvbG9yX3RleHQiLCJJY29ucy5jb2xvcl9iYWNrZ3JvdW5kIiwiSWNvbnMuY29sb3JfYm9yZGVyIl0sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEtBQUssR0FBRztFQUNaLEVBQUUsRUFBRSxTQUFTLEtBQUssRUFBRSxFQUFFLEVBQUU7SUFDdEIsS0FBSztPQUNGLEtBQUssQ0FBQyxHQUFHLENBQUM7T0FDVixPQUFPLENBQUMsSUFBSTtRQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFD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LENBQUMsT0FBTyxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUM7SUFDbkQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sR0FBRyxJQUFJLEVBQUM7SUFDckQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksRUFBQztJQUN2QyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFDO0lBQ3RDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7SUFDeEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksRUFBQztJQUN4QyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBQztJQUNoRCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBQztJQUNoRCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFDO0lBQ3ZDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7SUFDdkMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztJQUM1QyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBQztJQUNoRCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBQztJQUNoRCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0dBQzdDOztFQUVELE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxZQUFZLEdBQUU7O0lBRTlDLE9BQU8sQ0FBQztNQUNOLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7cUJBR1gsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQzs7Ozs7aUJBSzVCLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7YUFDL0IsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzs7O2tCQUdSLEVBQUUsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQztrQkFDdkMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUM7eUJBQ2hELEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzt5QkFDL0IsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUM7O0lBRXRFLENBQUM7R0FDRjs7RUFFRCxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDakIsT0FBTyxDQUFDOzs7Ozs7Ozs7OztJQVdSLENBQUM7R0FDRjtDQUNGOztBQUVELGNBQWMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDOztBQy9FN0MsTUFBTSxRQUFRLFNBQVMsV0FBVyxDQUFDOztFQUV4QyxXQUFXLEdBQUc7SUFDWixLQUFLLEdBQUU7SUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUM7R0FDakQ7O0VBRUQsaUJBQWlCLEdBQUcsRUFBRTtFQUN0QixvQkFBb0IsR0FBRyxFQUFFOztFQUV6QixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUU7SUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUM7R0FDOUM7O0VBRUQsTUFBTSxDQUFDLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFO0lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsYUFBYSxFQUFDO0lBQzlELE9BQU8sQ0FBQztNQUNOLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7O3VCQUdULEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQzs7O0lBR2xDLENBQUM7R0FDRjs7RUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRTtJQUNqQyxNQUFNLE1BQU0sR0FBRyxHQUFFO0lBQ2pCLElBQUksS0FBSyxFQUFFO01BQ1QsTUFBTSxNQUFNLEdBQUcsS0FBSyxLQUFLLE1BQU07VUFDM0IsU0FBUztVQUNULHNCQUFxQjs7TUFFekIsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFNO01BQ3BCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTTtLQUNyQjtTQUNJO01BQ0gsTUFBTSxDQUFDLElBQUksR0FBRyxzQkFBcUI7TUFDbkMsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFTO0tBQ3hCOztJQUVELE9BQU8sQ0FBQzs7O3dCQUdZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQzt1QkFDZixFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7O1VBUTNCLEVBQUUsQ0FBQztjQUNDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUM7Y0FDN0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7ZUFDakMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztVQUMxQixFQUFFLENBQUMsS0FBSyxNQUFNLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDOzs7Ozs7MEJBTXhCLEVBQUUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFtQnZDLEVBQUUsQ0FBQztjQUNDLHdDQUF3QztjQUN4Qyx3Q0FBd0MsQ0FBQzs7Ozs7O1VBTTdDLEVBQUUsQ0FBQztjQUNDLDJCQUEyQjtjQUMzQiw0QkFBNEIsQ0FBQzs7OzBCQUdqQixFQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLE1BQU0sR0FBRyxlQUFlLEdBQUcsZ0JBQWdCLENBQUM7eUNBQ3BELEVBQUUsQ0FBQyxDQUFDOzs7SUFHekMsQ0FBQztHQUNGO0NBQ0Y7O0FBRUQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUM7O0FDdkczQyxNQUFNLE9BQU8sU0FBUyxXQUFXLENBQUM7O0VBRXZDLFdBQVcsR0FBRztJQUNaLEtBQUssR0FBRTtJQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQztHQUNuRDs7RUFFRCxpQkFBaUIsR0FBRyxFQUFFO0VBQ3RCLG9CQUFvQixHQUFHLEVBQUU7O0VBRXpCLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRTtJQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBQztHQUNwRDs7RUFFRCxJQUFJLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBTzs7SUFFekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0lBQ3BDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQU87SUFDM0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsS0FBSTtJQUMzQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSTs7SUFFNUIsR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBQztJQUN2QyxHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFDO0dBQzFDOztFQUVELE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtJQUNyQyxPQUFPLENBQUM7OztvQkFHUSxFQUFFLEVBQUUsQ0FBQzs7Ozs7Ozs7OztlQVVWLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUM7cUJBQ3ZCLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUM7Ozs7Ozs7O0lBUW5DLENBQUM7R0FDRjtDQUNGOztBQUVELGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDOztBQ3JEekMsTUFBTSxRQUFRLFNBQVMsV0FBVyxDQUFDOztFQUV4QyxXQUFXLEdBQUc7SUFDWixLQUFLLEdBQUU7SUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUM7SUFDbEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFFO0dBQ25COztFQUVELGlCQUFpQixHQUFHLEVBQUU7RUFDdEIsb0JBQW9CLEdBQUcsRUFBRTs7RUFFekIsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFO0lBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFDO0lBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVk7TUFDN0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBQztHQUNuQzs7RUFFRCxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLEVBQUU7SUFDNUMsTUFBTSxZQUFZLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFHO0lBQzlELE1BQU0sV0FBVyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSTs7SUFFN0QsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO01BQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUc7UUFDZCxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU07UUFDdkIsS0FBSyxLQUFLLE1BQU0sQ0FBQyxLQUFLO1FBQ3RCLEdBQUcsT0FBTyxNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPO1FBQ3JDLElBQUksTUFBTSxNQUFNLENBQUMsSUFBSTtRQUNyQixRQUFRLEVBQUUsYUFBYTtRQUN4QjtLQUNGO1NBQ0ksSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO01BQzFCLElBQUksQ0FBQyxRQUFRLEdBQUc7UUFDZCxNQUFNLElBQUksWUFBWTtRQUN0QixLQUFLLEtBQUssV0FBVztRQUNyQixHQUFHLE9BQU8sTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxHQUFHO1FBQ2pELElBQUksTUFBTSxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJO1FBQ2xDLFFBQVEsRUFBRSxZQUFZO1FBQ3ZCO0tBQ0Y7O0lBRUQsSUFBSSxLQUFLLEtBQUssTUFBTSxFQUFFO01BQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLDRCQUEyQjtNQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyw0QkFBMkI7S0FDbkQ7U0FDSTtNQUNILElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLDRCQUEyQjtNQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyw0QkFBMkI7S0FDbkQ7O0lBRUQsT0FBTyxDQUFDO01BQ04sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7OzsyR0FJOEUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQzt3REFDNUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQzs7Ozs7O0lBTTNFLENBQUM7R0FDRjs7RUFFRCxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNkLE9BQU8sQ0FBQzs7Ozs7O2lCQU1LLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7a0JBQ3JCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7ZUFDMUIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztnQkFDbkIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzs0QkFDVCxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDOzs0QkFFbkIsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQzdCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQztZQUM1QixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUM7WUFDbkQsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO2NBQzNFLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7Ozs7SUFLaEQsQ0FBQztHQUNGOztFQUVELGtCQUFrQixDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUU7SUFDL0MsTUFBTSxTQUFTLEtBQUssTUFBTSxDQUFDLFdBQVU7SUFDckMsTUFBTSxXQUFXLEdBQUcsR0FBRTtJQUN0QixNQUFNLE1BQU0sUUFBUSxFQUFDOztJQUVyQixJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7TUFDckIsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1VBQ3JCLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTTtVQUM1QyxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsV0FBVyxHQUFHLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztVQUNuRixDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUc7VUFDWixDQUFDLEVBQUUsS0FBSztVQUNSLENBQUMsRUFBRSxJQUFJO1VBQ1AsS0FBSztTQUNOLEVBQUM7T0FDSDtNQUNELElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUNoQixJQUFJLENBQUMsaUJBQWlCLENBQUM7VUFDckIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNO1VBQzVDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTTtVQUNoQixDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU07VUFDZixDQUFDLEVBQUUsUUFBUTtVQUNYLENBQUMsRUFBRSxJQUFJO1VBQ1AsS0FBSztTQUNOLEVBQUM7T0FDSDtNQUNELElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNmLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztVQUNyQixDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUs7VUFDZixDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU07VUFDNUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLO1VBQ2QsQ0FBQyxFQUFFLE9BQU87VUFDVixDQUFDLEVBQUUsS0FBSztVQUNSLEtBQUs7U0FDTixFQUFDO09BQ0g7TUFDRCxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFDZCxJQUFJLENBQUMsaUJBQWlCLENBQUM7VUFDckIsQ0FBQyxFQUFFLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSTtVQUMxQixDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU07VUFDNUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJO1VBQ2IsQ0FBQyxFQUFFLE1BQU07VUFDVCxDQUFDLEVBQUUsS0FBSztVQUNSLEtBQUs7U0FDTixFQUFDO09BQ0g7S0FDRjtTQUNJLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtNQUMzQixJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDYixJQUFJLENBQUMsaUJBQWlCLENBQUM7VUFDckIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNO1VBQzVDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsV0FBVyxHQUFHLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztVQUN2RSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUc7VUFDWixDQUFDLEVBQUUsS0FBSztVQUNSLENBQUMsRUFBRSxJQUFJO1VBQ1AsS0FBSztTQUNOLEVBQUM7T0FDSDtPQUNBLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtTQUNoQixJQUFJLENBQUMsaUJBQWlCLENBQUM7V0FDckIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNO1dBQzVDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNO1dBQy9CLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTTtXQUNmLENBQUMsRUFBRSxRQUFRO1dBQ1gsQ0FBQyxFQUFFLElBQUk7V0FDUCxLQUFLO1VBQ04sRUFBQztRQUNIO09BQ0QsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO1NBQ2YsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1dBQ3JCLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLO1dBQzdCLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTTtXQUM1QyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUs7V0FDZCxDQUFDLEVBQUUsT0FBTztXQUNWLENBQUMsRUFBRSxLQUFLO1dBQ1IsS0FBSztVQUNOLEVBQUM7UUFDSDtPQUNELElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtTQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztXQUNyQixDQUFDLEVBQUUsU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUk7V0FDdkMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNO1dBQzVDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSTtXQUNiLENBQUMsRUFBRSxNQUFNO1dBQ1QsQ0FBQyxFQUFFLEtBQUs7V0FDUixLQUFLO1VBQ04sRUFBQztRQUNIO0tBQ0g7R0FDRjs7RUFFRCxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUMsRUFBRTtJQUM3QyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFDO0lBQzdELFdBQVcsQ0FBQyxRQUFRLEdBQUcsRUFBRSxVQUFVLEVBQUUsYUFBYSxHQUFFO0lBQ3BELElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBQztHQUN0QztDQUNGOztBQUVELGNBQWMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDOzs7O0FDdkwzQyxNQUFNLE9BQU8sU0FBUyxXQUFXLENBQUM7O0VBRXZDLFdBQVcsR0FBRztJQUNaLEtBQUssR0FBRTtJQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQztHQUNuRDs7RUFFRCxpQkFBaUIsR0FBRztJQUNsQixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDO0dBQy9EOztFQUVELG9CQUFvQixHQUFHO0lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUU7R0FDakI7O0VBRUQsYUFBYSxDQUFDLENBQUMsRUFBRTtJQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUU7TUFDdkQsT0FBTyxFQUFFLElBQUk7TUFDYixNQUFNLElBQUk7UUFDUixJQUFJLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXO1FBQ2hDLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSTtPQUNuQjtLQUNGLENBQUMsRUFBQztHQUNKOztFQUVELE9BQU8sR0FBRztJQUNSLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQztJQUMvRSxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDO0dBQzVFOztFQUVELFNBQVMsR0FBRztJQUNWLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQztJQUNoRixDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDO0dBQzdFOztFQUVELGVBQWUsQ0FBQyxDQUFDLEVBQUU7SUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRTtNQUN6RCxPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUMsRUFBQztJQUNILElBQUksQ0FBQyxTQUFTLEdBQUU7R0FDakI7O0VBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUM7R0FDM0M7O0VBRUQsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLENBQUMsRUFBRTtJQUNyRSxPQUFPLENBQUM7TUFDTixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7O2tCQUdKLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUNqQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7VUFDMUIsRUFBRSxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzthQUM3QixNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUM7YUFDMUIsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDO2NBQ3hCLEVBQUUsS0FBSyxDQUFDO2tCQUNKLEVBQUUsSUFBSSxDQUFDO1lBQ2IsQ0FBQyxFQUFFLEVBQUUsQ0FBQztXQUNQOzs7aUJBR00sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDOztnQkFFckIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzthQUV4QixFQUFFLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQztVQUNwRCxFQUFFLEtBQUssQ0FBQztxQkFDRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7c0JBQ1gsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzs7UUFFUCxFQUFFLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDOztlQUV4QixFQUFFLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQztZQUNqRCxFQUFFLEtBQUssQ0FBQzt1QkFDRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQ1gsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1VBQzNCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzs7UUFFVCxDQUFDLEdBQUcsRUFBRSxDQUFDOztJQUVYLENBQUM7R0FDRjs7RUFFRCxNQUFNLEdBQUc7SUFDUCxPQUFPLENBQUM7O1FBRUosRUFBRUEsS0FBTSxDQUFDOztJQUViLENBQUM7R0FDRjtDQUNGOztBQUVELGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDOztBQ2hHekMsTUFBTSxJQUFJLFNBQVMsT0FBTyxDQUFDO0VBQ2hDLFdBQVcsR0FBRztJQUNaLEtBQUssR0FBRTtHQUNSOztFQUVELE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtJQUM5QyxPQUFPLENBQUM7TUFDTixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7WUFFVixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDOztVQUVyRCxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUM7WUFDekMsRUFBRSxLQUFLLENBQUM7dUJBQ0csRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNYLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQztVQUMzQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7VUFDUCxFQUFFLGdCQUFnQixDQUFDOzs7SUFHekIsQ0FBQztHQUNGO0NBQ0Y7O0FBRUQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDOzs7O0FDekJuQyxNQUFNLE1BQU0sR0FBRyxDQUFDOzs7O0FBSXZCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLElBQUksR0FBRyxDQUFDOzs7O0FBSXJCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDOzs7O0FBSXZCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDOzs7O0FBSXZCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLE9BQU8sR0FBRyxDQUFDOzs7O0FBSXhCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLElBQUksR0FBRyxDQUFDOzs7O0FBSXJCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLElBQUksR0FBRyxDQUFDOzs7O0FBSXJCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLEtBQUssR0FBRyxDQUFDOzs7O0FBSXRCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDOzs7O0FBSXZCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLFNBQVMsR0FBRyxDQUFDOzs7OztBQUsxQixFQUFDOztBQUVELEFBQU8sTUFBTSxNQUFNLEdBQUcsQ0FBQzs7OztBQUl2QixFQUFDOztBQUVELEFBQU8sTUFBTSxRQUFRLEdBQUcsQ0FBQzs7OztBQUl6QixFQUFDOztBQUVELEFBQU8sTUFBTSxTQUFTLEdBQUcsQ0FBQzs7OztBQUkxQixFQUFDOztBQUVELEFBQU8sTUFBTSxTQUFTLEdBQUcsQ0FBQzs7Ozs7Ozs7O0FBUzFCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDOzs7OztBQUt2QixFQUFDOztBQUVELEFBQU8sTUFBTSxNQUFNLEdBQUcsQ0FBQzs7Ozs7QUFLdkIsRUFBQzs7QUFFRCxBQUFPLE1BQU0sVUFBVSxHQUFHLENBQUM7Ozs7O0FBSzNCLEVBQUM7O0FBRUQsQUFBTyxNQUFNLGdCQUFnQixHQUFHLENBQUM7Ozs7O0FBS2pDLEVBQUM7O0FBRUQsQUFBTyxNQUFNLFlBQVksR0FBRyxDQUFDOzs7OztBQUs3QixFQUFDOztBQUVELEFBQU8sTUFBTSxRQUFRLEdBQUcsQ0FBQzs7Ozs7QUFLekIsRUFBQzs7QUFFRCxBQUFPLE1BQU0sYUFBYSxHQUFHLENBQUM7Ozs7QUFJOUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBQUMsRENsSU0sTUFBTSxTQUFTLFNBQVMsV0FBVyxDQUFDOztFQUV6QyxXQUFXLEdBQUc7SUFDWixLQUFLLEdBQUU7O0lBRVAsSUFBSSxDQUFDLGNBQWMsR0FBRztNQUNwQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO01BQ3RFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7TUFDcEUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7TUFDbEUsS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7TUFDakUsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO01BQzdEOztJQUVELElBQUksQ0FBQyxjQUFjLEdBQUc7TUFDcEIsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNkLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDYixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFDbEIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ2xCLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7TUFD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LEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO1NBQ0k7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUNoQztJQUNELE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0NBQ2pEOzs7Ozs7O0FBT0QsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDdkIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJ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QUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ25DLENBQUM7O0lBRUYsSUFBSSxVQUFVO1FBQ1YsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN2QyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pFO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZCOzs7Ozs7O0FBT0QsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRTtJQUN2QyxNQUFNLEdBQUcsR0FBRztRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMs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QUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ2pFO0lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLElBQUksS0FBSyxFQUFFO1FBQ1AsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDcEQ7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ2pFO0lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLElBQUksS0FBSyxFQUFFO1FBQ1AsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDcEQ7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FB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LEtBQUssR0FBRyxLQUFLLElBQUksS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxLQUFLLElBQUksT0FBTyxFQUFFO1lBQ2xCLENBQUMsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3JCO2FBQ0k7WUFDRCxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsT0FBTyxNQUFNLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztLQUMvQzs7Ozs7O0lBTUQsUUFBUSxDQUFDLEtBQUssRUFBRTtRQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUM3QyxPQUFPLElBQUksQ0FBQztLQUNmOzs7O0lBSUQsS0FBSyxHQUFHO1FBQ0osTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQzVEOzs7OztJQUtELFdBQVcsR0FBRztRQUNWLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2hHOzs7O0lBSUQsS0FBSyxHQUFHO1FBQ0osTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQzVEOzs7OztJQUtELFdBQVcsR0FBRztRQUNWLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FB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
