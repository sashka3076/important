// LICENSE_CODE ZON
;(function () {
    'use strict'; define(['exports', '/bext/pub/backbone.js', '/util/etask.js', '/bext/pub/lib.js', '/bext/pub/ext.js', '/protocol/pub/pac_engine.js', '/bext/pub/util.js', '/bext/vpn/util/util.js', 'underscore', '/util/zerr.js', '/util/date.js', '/util/util.js', '/util/storage.js', 'conf'], function (exports, _backbone, _etask, _lib, _ext, _pac_engine, _util, _util3, _underscore, _zerr, _date, _util5, _storage, _conf) {Object.defineProperty(exports, "__esModule", { value: true });var _backbone2 = _interopRequireDefault(_backbone);var _etask2 = _interopRequireDefault(_etask);var _lib2 = _interopRequireDefault(_lib);var _ext2 = _interopRequireDefault(_ext);var _pac_engine2 = _interopRequireDefault(_pac_engine);var _util2 = _interopRequireDefault(_util);var _util4 = _interopRequireDefault(_util3);var _underscore2 = _interopRequireDefault(_underscore);var _zerr2 = _interopRequireDefault(_zerr);var _date2 = _interopRequireDefault(_date);var _util6 = _interopRequireDefault(_util5);var _storage2 = _interopRequireDefault(_storage);var _conf2 = _interopRequireDefault(_conf);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}













        const ff_webext = _conf2.default.firefox_web_ext2;
        let pac_file_set,pac_file_last,chrome,is_etask_perf_on,bext_config = {};
        const cb_wrapper = _zerr2.default.catch_unhandled_exception;
        const E = new (_backbone2.default.task_model.extend({
            model_name: 'pac',
            _defaults: function () {
                this.stats = { total: 0, slow: {} };
                this.on('destroy', () => E.uninit());
            } }))();


        const update_config = () => {
            bext_config = _ext2.default.get('bext_config') || {};
            is_etask_perf_on = _ext2.default.get('gen.is_etask_perf_on');
            if (is_etask_perf_on && !_etask2.default.perf())
            _etask2.default.perf(true);
            if (!is_etask_perf_on && _etask2.default.perf())
            _etask2.default.perf(false);
        };

        E.init = () => {
            if (E.inited)
            return;
            chrome = window.chrome;
            E.sp = _util4.default.new_etask('be_pac');
            E.listen_to(_ext2.default, 'change:bext_config', update_config);
            monitor_init();
            update_config();
            E.inited = true;
        };

        var monitor_init = period => {
            var first_reported,prev_slow,start = Date.now();
            if (E.timer)
            E.timer = _util4.default.clear_timeout(E.timer);
            var reset = (cb, keep_stats) => {
                if (!keep_stats)
                {
                    if (is_etask_perf_on)
                    _etask2.default.perf_stat = {};
                    E.stats = { total: 0, slow: {} };
                }
                first_reported = true;
                start = Date.now();
                if (cb)
                E.timer = _util4.default.set_timeout(cb, _date2.default.ms.HOUR, { sp: E.sp });
            };
            E.timer = _util4.default.set_timeout(function pac_slow() {
                var ts = _storage2.default.get_int('install_ts') || _storage2.default.get_int('update_ts');
                if (!first_reported && ts != window.hola.t.l_start)
                return reset(pac_slow, true);
                var send;
                for (var src in E.stats.slow)
                {
                    if (E.stats.slow[src]['100'] || E.stats.slow[src]['1000'])
                    {
                        send = true;
                        break;
                    }
                }
                if (!prev_slow && send)
                {
                    var info = Object.assign({ period: Date.now() - start }, E.stats);
                    if (is_etask_perf_on)
                    info.etask_perf_stat = _etask2.default.perf_stat;
                    _lib2.default.perr_err({ id: 'be_tab_unblocker_slow',
                        info: _zerr2.default.json(info) });
                }
                prev_slow = send;
                reset(pac_slow);
            }, period || 5 * _date2.default.ms.MIN, { sp: E.sp });
        };

        E.uninit = () => {
            E.inited = false;
            E.timer = _util4.default.clear_timeout(E.timer);
            E.sp.return();
            E.stopListening();
        };

        function get_pac_scope() {
            if (chrome && chrome.extension && chrome.extension.inIncognitoContext)
            return 'incognito_session_only';
            return 'regular_only';
        }

        E.set_pac = script => {
            pac_file_set = !!script;
            if (script && !ff_webext)
            pac_file_last = script;
            const scope = get_pac_scope();
            return (0, _etask2.default)(function* set_pac_() {
                this.alarm(5000, { throw: 'proxy.settings timeout' });
                if (script)
                {
                    yield _etask2.default.cb_apply(chrome.proxy.settings, '.set', [{ scope, value:
                        { mode: 'pac_script', pacScript: { data: script } } }]);
                } else
                    yield _etask2.default.cb_apply(chrome.proxy.settings, '.clear', [{ scope }]);
                _ext2.default.set('status.unblocker.effective_pac_url', script);
                E.has_pac = !!script;
            });
        };

        function check_need_ext_settings() {
            return _ext2.default.get('ajax_via_proxy_inited') || E.rules &&
            _underscore2.default.keys(E.rules.unblocker_rules).length && _ext2.default.get('ext.active');
        }

        E.load_pac_file = (last, force) => {
            var has_pac = E.has_pac;
            E.has_pac = false;
            if (!chrome)
            return;
            if (!check_need_ext_settings() && !force)
            return E.set_pac(null);
            if (!E.rules && !pac_file_set && pac_file_last)
            return E.set_pac(pac_file_last);
            if (has_pac)
            return E.has_pac = true;
            var arr = new Uint8Array(32),key = '';
            window.crypto.getRandomValues(arr);
            _underscore2.default.each(arr, a => {key += a.toString(16);});
            E.pac_key = key;
            var json = { unblocker_rules: {} };
            var options = { do_redir: false, ext: 1, key: E.pac_key,
                rule_dur_ms: bext_config.pac_rule_dur_ms,
                rule_cleanup_ms: bext_config.pac_rule_cleanup_ms };
            var et = E.set_pac(_pac_engine2.default.gen_pac(json, options));
            E.has_pac = true;
            return et;
        };

        E.load_pac_cb = cb_wrapper(() => {
            E.init_tab_listeners();
            E.load_pac_file();
        });

        function hex_encode(s) {
            s = unescape(encodeURIComponent(s));
            let h = '';
            for (let i = 0; i < s.length; i++)
            h += s.charCodeAt(i).toString(16);
            return h;
        }

        E.set_proxy_for_url = (url, proxy_str, opt) => (0, _etask2.default)({ cancel: true },
        function* set_proxy_for_url() {
            if (!E.pac_key && !_util6.default.is_mocha())
            return;
            this.finally(() => {
                if (!xhr)
                return;
                xhr.abort();
                xhr.onload = xhr.onabort = xhr.onerror = null;
            });
            opt = opt || {};
            let b = _util2.default.browser_guess,n;
            if (b.browser == 'chrome' && +b.version >= 52)
            {
                n = url.match(/^((https|wss):\/\/[^\/]+\/)/);
                if (n)
                url = n[1];
            }
            if (b.browser == 'firefox')
            {
                n = url.match(/^(https?:\/\/[^\/]+\/)/);
                if (n)
                url = ff_webext ? n[1].slice(0, -1) : n[1];
            }
            let t0,diff,xhr = new XMLHttpRequest();
            let prefix = hex_encode(JSON.stringify({
                proxy: proxy_str,
                set: url,
                key: E.pac_key || '1' }));

            xhr.open('POST', 'http://' + prefix + '.local.hola/', opt.async ||
            _util6.default.is_mocha());
            E.stats.total++;
            t0 = Date.now();
            if (opt.async)
            xhr.onload = xhr.onabort = xhr.onerror = () => this.continue();
            try {
                xhr.send(null);
                if (opt.async)
                yield this.wait(20 * _date2.default.ms.SEC);
            } catch (e) {}
            if ((diff = Date.now() - t0) > 10)
            {
                let s,src = (opt.async ? 'async_' : '') + (opt.src || 'idle');
                if (!(s = E.stats.slow[src]))
                s = E.stats.slow[src] = { 10: 0, 100: 0, 1000: 0, max: 0 };
                s[diff > 1000 ? '1000' : diff > 100 ? '100' : '10']++;
                s.max = Math.max(diff, s.max);
                if (diff > 100)
                (0, _zerr2.default)('tab_unblocker slow %dms stats %s', diff, _zerr2.default.json(E.stats));
            }
        });exports.default =

        E;});})();
//# sourceMappingURL=pac.js.map
