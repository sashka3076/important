// LICENSE_CODE ZON
;(function () {
    'use strict'; define(['exports', 'zon_config', '/bext/pub/backbone.js', '/bext/vpn/bg/info.js', '/bext/vpn/bg/tabs.js', '/svc/vpn/pub/util.js', '/util/storage.js', '/bext/pub/ext.js'], function (exports, _zon_config, _backbone, _info, _tabs, _util, _storage, _ext) {Object.defineProperty(exports, "__esModule", { value: true });var _zon_config2 = _interopRequireDefault(_zon_config);var _backbone2 = _interopRequireDefault(_backbone);var _info2 = _interopRequireDefault(_info);var _tabs2 = _interopRequireDefault(_tabs);var _util2 = _interopRequireDefault(_util);var _storage2 = _interopRequireDefault(_storage);var _ext2 = _interopRequireDefault(_ext);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}







        const chrome = window.chrome;
        const E = new (_backbone2.default.task_model.extend({ model_name: 'dev_mode' }))();

        const force_tpopup = type => {
            var tab_url = _tabs2.default.get('active.url');
            var tab_id = _tabs2.default.get('active.id');
            if (!tab_url || !tab_id)
            return;
            var domain = _util2.default.get_root_url(tab_url);
            _info2.default.set_force_tpopup(domain, type);
            if (type == 'suggestion')
            _tabs2.default.set_force_suggestion(tab_id, true);
            chrome.tabs.reload(tab_id);
        };

        const on_change_mode = () => {
            _ext2.default.set('dev_mode', E.get('dev_mode'));
            if (!chrome || !chrome.contextMenus)
            return;
            chrome.contextMenus.removeAll();
            if (!E.get('dev_mode'))
            return;
            chrome.contextMenus.create({
                id: 'hola-vpn-dev-tpopup',
                title: 'Show tpopup',
                contexts: ['browser_action'],
                onclick: () => {force_tpopup();} });

            chrome.contextMenus.create({
                id: 'hola-vpn-dev-mitm-popup',
                title: 'Show mitm popup',
                contexts: ['browser_action'],
                onclick: () => {force_tpopup('mitm_popup');} });

            chrome.contextMenus.create({
                id: 'hola-vpn-dev-watermark-popup',
                title: 'Show watermark popup',
                contexts: ['browser_action'],
                onclick: () => {force_tpopup('watermark');} });

            chrome.contextMenus.create({
                id: 'hola-vpn-dev-suggestion-popup',
                title: 'Force trial suggestion',
                contexts: ['browser_action'],
                onclick: () => {force_tpopup('suggestion');} });

        };

        E.enable = val => {
            _storage2.default.set('dev_mode', val ? 1 : 0);
            E.set('dev_mode', val);
        };

        E.init = () => {
            E.on('change:dev_mode', on_change_mode);
            if (!_zon_config2.default._RELEASE || _storage2.default.get_int('dev_mode'))
            E.set('dev_mode', true);
        };

        E.uninit = () => E.off('change:dev_mode', on_change_mode);exports.default =

        E;});})();
//# sourceMappingURL=dev_mode.js.map
