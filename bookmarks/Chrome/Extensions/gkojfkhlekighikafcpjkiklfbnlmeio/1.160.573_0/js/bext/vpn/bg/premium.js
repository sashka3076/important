// LICENSE_CODE ZON
;(function () {
    'use strict'; define(['exports', '/bext/pub/lib.js', '/bext/pub/backbone.js', '/util/etask.js', '/bext/vpn/bg/tabs.js', '/util/zerr.js', '/util/date.js', '/svc/account/pub/membership.js', '/bext/pub/ext.js', '/bext/pub/util.js', '/bext/vpn/bg/bg_ajax.js', '/util/util.js', '/bext/vpn/util/util.js', '/util/version_util.js', '/bext/vpn/bg/force_lib.js', '/bext/vpn/bg/info.js'], function (exports, _lib, _backbone, _etask, _tabs, _zerr, _date, _membership2, _ext, _util, _bg_ajax, _util3, _util5, _version_util, _force_lib, _info) {Object.defineProperty(exports, "__esModule", { value: true });var _lib2 = _interopRequireDefault(_lib);var _backbone2 = _interopRequireDefault(_backbone);var _etask2 = _interopRequireDefault(_etask);var _tabs2 = _interopRequireDefault(_tabs);var _zerr2 = _interopRequireDefault(_zerr);var _date2 = _interopRequireDefault(_date);var _membership3 = _interopRequireDefault(_membership2);var _ext2 = _interopRequireDefault(_ext);var _util2 = _interopRequireDefault(_util);var _bg_ajax2 = _interopRequireDefault(_bg_ajax);var _util4 = _interopRequireDefault(_util3);var _util6 = _interopRequireDefault(_util5);var _version_util2 = _interopRequireDefault(_version_util);var _force_lib2 = _interopRequireDefault(_force_lib);var _info2 = _interopRequireDefault(_info);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}
















        _util6.default.assert_bg('be_premium');
        const assign = Object.assign;
        const chrome = window.chrome;
        const E = new (_backbone2.default.task_model.extend({
            model_name: 'premium',
            _defaults: function () {this.on('destroy', () => E.uninit());} }))();

        let membership_timeout, daily_refresh_timer, refresh_user_timeout;
        const test_users = ['deploy@hola.org', 'qa.hola@gmail.com',
        'qa.hola2@gmail.com', 'yulia@hola.org', 'holaplus.payment@gmail.com',
        'holavpntests@gmail.com', 'deploy.vpnext@gmail.com', 'nikita+2@hola.org',
        'nikita+vpn@hola.org'];

        E.is_active = () => _membership3.default.is_active(E.get('membership'));

        E.is_paid = () => _membership3.default.is_paid(E.get('membership'));

        E.logout_user = () => (0, _etask2.default)(function* logout_user() {
            E.be_rule.disable_premium();
            yield _bg_ajax2.default.hola_api_call('users/logout/inline', { method: 'POST',
                text: true });
            yield E.refresh_user();
        });

        var last_refreshed = 0;
        var last_refreshed_stack;
        E.refresh_user = opt => {
            opt = assign({}, opt);
            let user_id = _ext2.default.get('user_id'),new_user_id;
            var now,stack = new Error().stack;
            if ((now = Date.now()) - last_refreshed < 300)
            {
                _lib2.default.perr(_zerr2.default.L.NOTICE, { id: 'refresh_user_multiple', rate_limit:
                    { count: 2 }, info: { user_id, last_stack: last_refreshed_stack,
                        stack } });
            }
            last_refreshed = now;
            last_refreshed_stack = stack;
            return (0, _etask2.default)({ name: 'refresh_user', cancel: true }, function* () {
                try {
                    const _user = yield _info2.default.get_user_data({
                        data: { uuid: _ext2.default.get('uuid'), source: 'be_premium' } });
                    let email;
                    if (_user && _user.user)
                    email = _util4.default.get(_user.user.emails, '0.value');
                    E.set('is_test_user', +test_users.includes(email));
                    new_user_id = _util4.default.get(_user, 'user._id');
                    _ext2.default.set('user_id', new_user_id || '');
                    _ext2.default.set('hola_uid', _util4.default.get(_user, 'user.hola_uid'));
                    E.set('user', _user && _user.user);
                    let _membership;
                    if (user_id != new_user_id || opt.force_premium)
                    {
                        _membership = yield _bg_ajax2.default.hola_api_call(
                        'users/payment/get_membership');
                    } else

                    _membership = yield E.get('membership');
                    const old_is_active = E.is_active();
                    E.set('membership', _membership);
                    _ext2.default.set('is_premium', E.is_active());
                    if (old_is_active !== E.is_active())
                    {
                        if (opt.exp_synced)
                        {
                            _lib2.default.perr(_zerr2.default.L.ERR, { id: 'premium_out_of_sync',
                                info: { membership: _membership } });
                        }
                        if (old_is_active)
                        E.be_rule.disable_premium();
                    }
                    _lib2.default.perr(_zerr2.default.L.NOTICE, { id: 'membership',
                        info: { membership: _membership, user: E.get('user') } });
                    return _membership;
                } catch (err) {
                    _lib2.default.perr(_zerr2.default.L.ERR, { id: 'refresh_user_fail',
                        info: _zerr2.default.e2s(err) });
                    _util6.default.clear_timeout(membership_timeout);
                    membership_timeout = _util6.default.set_timeout(() =>
                    E.sp.spawn(E.refresh_user(opt)), Math.random() * _date2.default.ms.HOUR);
                } finally {
                    _util6.default.clear_timeout(refresh_user_timeout);
                    E.trigger('user_updated');
                }
            });
        };

        E.refresh_anonymous = opt => (0, _etask2.default)({ name: 'refresh_anonymous', cancel: true },
        function* refresh_anonymous_() {
            const res = yield _info2.default.autologin_capable();
            if (res)
            yield E.refresh_user(opt);
        });

        function is_blacklist(root_url, host) {
            if (!root_url)
            return false;
            host = host || root_url; 
            if (_ext2.default.get('is_premium'))
            return false;
            const blacklist = (E.be_rule.get('rules') || {}).blacklist || {};
            return blacklist[host] || blacklist[root_url];
        }

        function get_force_rule(conf_name, root_url, opt) {
            let rule;
            if (is_blacklist(root_url))
            {
                rule = { id: root_url, domain: new RegExp(root_url), blacklist: true };
                return rule;
            }
            opt = opt || {};
            rule = _force_lib2.default.find_rule(root_url, _ext2.default.get('bext_config'),
            conf_name, _info2.default.get('country'));
            if (!rule)
            return false;
            const install_ver = _ext2.default.get('install_version');
            if (!opt.ignore_install_version && rule.install_ver_min && install_ver &&
            _version_util2.default.cmp(install_ver, rule.install_ver_min) < 0)
            {
                return false;
            }
            const site_conf = _util2.default.get_site_conf(root_url);
            if (!site_conf)
            return rule;
            const suggestion_conf = _util2.default.get_suggestion_conf(site_conf,
            _info2.default.get('country'));
            if (suggestion_conf)
            return false;
            return rule;
        }

        E.get_force_premium_rule = get_force_rule.bind(undefined, 'force_premium');
        E.get_force_privacy_rule = get_force_rule.bind(undefined, 'get_privacy');

        E.get_force_premium_rules = (root_urls, opt) =>
        root_urls.map(root_url => E.get_force_premium_rule(root_url, opt));

        const info_inited_cb = () => {
            if (_util4.default.is_mocha() && last_refreshed)
            return;
            E.sp.spawn(E.refresh_user());
        };

        const updated_cb = obj => {
            if (!obj.info.url)
            return;
            if (obj.info.url.match(/^https:\/\/hola.org\/premium.html/))
            {
                E.set('membership', undefined);
                _util6.default.clear_timeout(membership_timeout);
                membership_timeout = _util6.default.set_timeout(() => {
                    E.sp.spawn(E.refresh_user({ force_premium: true }));
                }, _date2.default.ms.HOUR);
            }
        };

        E.init = be_rule => {
            E.be_rule = be_rule;
            E.sp = _util6.default.new_etask('be_premium');
            _info2.default.on('inited', info_inited_cb);
            daily_refresh_timer = _util6.default.set_interval(
            E.refresh_user.bind(E, { force_premium: true }), _date2.default.ms.DAY,
            { sp: E.sp, name: 'refresh_user' });
            E.listenTo(_tabs2.default, 'updated', updated_cb);
            if (chrome && chrome.cookies && chrome.cookies.onChanged)
            chrome.cookies.onChanged.addListener(on_cookie_change);
        };

        E.uninit = () => {
            _info2.default.off('inited', info_inited_cb);
            E.stopListening(_tabs2.default, 'updated', updated_cb);
            E.sp.return();
            _util6.default.clear_timeout(membership_timeout);
            _util6.default.clear_interval(daily_refresh_timer);
            if (_util4.default.get(chrome, 'cookies.onChanged'))
            chrome.cookies.onChanged.removeListener(on_cookie_change);
            last_refreshed = 0;
            E.clear();
        };

        function on_cookie_change(change) {
            const cookie = change.cookie;
            if (change.removed || cookie.name != 'connect.sid' ||
            cookie.domain != 'hola.org')
            {
                return;
            }
            var min_ver = (_ext2.default.get('bext_config') || {}).
            signin_redirect_back_to_site_min_ver;
            if (!_version_util2.default.valid(min_ver) ||
            _version_util2.default.cmp(_util2.default.version(), min_ver) < 0)
            {
                return;
            }
            refresh_user_timeout = _util6.default.set_timeout(E.refresh_user,
            3 * _date2.default.ms.SEC);
        }exports.default =

        E;});})();
//# sourceMappingURL=premium.js.map
