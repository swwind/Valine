/**
 * @Valine
 * Author: xCss
 * Github: https://github.com/xCss/Valine
 * Website: https://valine.js.org
 */
'use strict';

import md5 from 'blueimp-md5';
import marked from 'marked';
import detect from './assets/detect.js';
import { HtmlUtil, dateFormat, timeAgo, getLink, Checker, padWithZeros, Event } from './assets/utils.js';

const gravatar = {
  cdn: 'https://gravatar.loli.net/avatar/',
  hide: false
};

const touristName = 'tourist';

const defaultComment = {
  comment: '',
  rid: '',
  nick: touristName,
  mail: '',
  link: '',
  ua: navigator.userAgent,
  url: '',
  auth: false
};

const shorten = (str) =>
  str.trim().replace(/>\s+</g, '><');

class Valine {
  /**
   * Valine constructor function
   * @param {Object} option
   * @constructor
   */
  constructor(option) {
    let _root = this;
    // version
   _root.version = 'v1.2.0-beta2';

    _root.md5 = md5;
    _root.store = localStorage;
    // Valine init
    !!option && _root.init(option);
  }

  /**
   * Valine Init
   * @param {Object} option
   */
  init(option) {
    let _root = this;

    // preparation start =======================

    let el = Object.prototype.toString.call(option.el) === "[object HTMLDivElement]" ? option.el : document.querySelector(option.el);
    if (Object.prototype.toString.call(el) != '[object HTMLDivElement]') {
      throw `The target element was not found.`;
    }
    _root.el = el;
    _root.el.classList.add('valine');

    _root.placeholder = option.placeholder || '';
    let eleHTML = shorten(`
      <div class="vwrap">
        <div class="vheader item3">
          <div class="vsign vsno">
            <input name="nonick" placeholder="称呼" class="vnick vinput" type="text">
            <input name="nomail" placeholder="邮箱" class="vmail vinput" type="email">
            <input name="nolink" placeholder="网址(http://)" class="vlink vinput" type="vlink">
            <button class="vbtn vsinbtn">登录</button>
            <button class="vbtn vsupbtn">注册</button>
          </div>
          <div class="vsign vsin">
            <input name="innick" placeholder="邮箱或称呼" class="vnick vinput" type="text">
            <input name="inpass" placeholder="密码" class="vpass vinput" type="password">
            <button class="vbtn vsinbtn active">登录</button>
            <button class="vbtn vsupbtn">注册</button>
            <button class="vbtn vbckbtn">返回</button>
          </div>
          <div class="vsign vsup">
            <input name="upnick" placeholder="称呼" class="vnick vinput" type="text">
            <input name="uppass" placeholder="密码" class="vpass vinput" type="password">
            <input name="upmail" placeholder="邮箱" class="vmail vinput" type="email">
            <input name="uplink" placeholder="网址(http://)" class="vlink vinput" type="text">
            <button class="vbtn vsinbtn">登录</button>
            <button class="vbtn vsupbtn active">注册</button>
            <button class="vbtn vbckbtn">返回</button>
          </div>
          <div class="vsigned">
            <div class="vleftdiv"></div>
            <button class="vbtn vlogout">登出</button>
          </div>
        </div>
        <div class="vedit">
          <textarea class="veditor vinput" placeholder="${_root.placeholder}"></textarea>
        </div>
        <div class="vcontrol">
          <div class="col col-60" title="MarkDown is Support">
            <a href="https://segmentfault.com/markdown">Markdown</a> Powered
          </div>
          <div class="col col-40 text-right">
            <button type="button" class="vsubmit vbtn">回复</button>
          </div>
        </div>
      </div>
      <div class="info">
        <div class="count col"></div>
      </div>
      <div class="vloading"></div>
      <div class="vempty" style="display:none;"></div>
      <ul class="vlist"></ul>
      <div class="info">
        <div class="power txt-right">
          Powered By <a href="https://github.com/swwind/valine-ex" target="_blank">ValineEX</a><br>
          ${_root.version}
        </div>
      </div>
    `);
    _root.el.innerHTML = eleHTML;

    // Empty Data
    let vempty = _root.el.querySelector('.vempty');
    _root.nodata = {
      show(txt) {
        vempty.innerHTML = txt;
        vempty.style.display = 'block';
      },
      hide() {
        vempty.style.display = 'none';
      }
    }

    // loading
    let _spinner = shorten(`
      <div class="spinner">
        <div class="r1"></div>
        <div class="r2"></div>
        <div class="r3"></div>
        <div class="r4"></div>
        <div class="r5"></div>
      </div>
    `);
    let vloading = _root.el.querySelector('.vloading');
    vloading.innerHTML = _spinner;
    // loading control
    _root.loading = {
      show() {
        vloading.style.display = 'block';
        _root.nodata.hide();
      },
      hide() {
        vloading.style.display = 'none';
        if (_root.el.querySelectorAll('.vcard').length === 0) {
          _root.nodata.show(`还没有评论哦，快来抢沙发吧!`);
        }
      }
    };

    // _root.notify = option.notify || false; // not used
    // _root.verify = option.verify || false; // not used

    gravatar.params = `?d=${option.avatar}&s=40`;
    gravatar.hide = option.avatar === 'hide';
    gravatar.get = (mail, auth) => {
      let auths = auth ? '<span class="vicon auth"></span>' : '';
      return gravatar.hide ? '' : `<img class="vimg" src="${gravatar.cdn + md5(mail) + gravatar.params}">${auths}`;
    }

    let av = option.av || AV;
    let appId = option.app_id || option.appId;
    let appKey = option.app_key || option.appKey;
    if (!appId || !appKey) {
      _root.loading.hide();
      throw 'Appid and appkey is required.';
      return;
    }
    av.applicationId = null;
    av.init(appId, appKey);
    _root.v = av;
    // edge bug here ?
    defaultComment.url = (option.path || location.pathname).replace(/index\.html?$/, '');

    // preparation end =======================

    // Bind Event
    _root.bind(option);
  }

  /**
   * Bind Event
   */
  bind(option) {
    let _root = this;

    // 过长的评论做折叠处理
    const expandEvt = (el) => {
      if (el.offsetHeight > 180) {
        el.classList.add('expand');
        Event.on('click', el, (e) => {
          el.setAttribute('class', 'vcontent');
        })
      }
    }

    // 插入一个评论
    const insertDom = (ret) => {
      let mt = !!ret.get('rid'); // is reply
      let _vlist = _root.el.querySelector('.vlist');
      if (mt) {
        let rid = ret.get('rid');
        let rel = document.getElementById(rid).querySelector('section');
        if (rel.querySelector('ul')) {
          _vlist = rel.querySelector('ul');
          _vlist.classList.add('vlist')
        } else {
          let before = rel.querySelector('.vfooter');
          _vlist = document.createElement('ul');
          rel.appendChild(_vlist);
        }
      }
      let det = detect(ret.get('ua'))
      let _vcard = document.createElement('li');
      _vcard.setAttribute('class', 'vcard');
      _vcard.setAttribute('id', ret.id);
      _vcard.innerHTML = shorten(`
        ${gravatar.get(ret.get('mail'), ret.get('auth'))}
        <section>
          <div class="vhead">
            <a rel="nofollow" href="${getLink(ret.get('link'))}" target="_blank" >
              ${ret.get("nick")}
            </a>
            <span class="vtag">${det.browser} ${det.version}</span>
            <span class="vtag">${det.os} ${det.osVersion}</span>
          </div>
          <div class="vcontent">
            ${ret.get("comment")}
          </div>
          <div class="vfooter">
            <span class="vtime">
              ${timeAgo(ret.get("createdAt"))}
            </span>
            <span rid="${ret.id}" at="@${ret.get('nick')}" class="vat">回复</span>
          <div>
        </section>
      `);
      let _vlis = _vlist.querySelectorAll('li');
      let _vat = _vcard.querySelector('.vat');
      let _as = _vcard.querySelectorAll('a');
      for (let i = 0, len = _as.length; i < len; i++) {
        let item = _as[i];
        if (item && item.getAttribute('class') != 'at') {
          item.setAttribute('target', '_blank');
          item.setAttribute('rel', 'nofollow');
        }
      }
      if (mt) _vlist.appendChild(_vcard);
      else _vlist.insertBefore(_vcard, _vlis[0]);
      let _vcontent = _vcard.querySelector('.vcontent');
      expandEvt(_vcontent);
      bindAtEvt(_vat);
    }

    // 初始化所有评论
    const query = () => {
      _root.loading.show();

      let cq = new _root.v.Query('Comment');
      cq.equalTo('url', defaultComment['url']);
      cq.descending('createdAt');
      cq.limit('1000');

      cq.find().then((rets) => {
        rets.reverse();
        let len = rets.length;
        if (len) {
          _root.el.querySelector('.vlist').innerHTML = '';
          rets.forEach(insertDom);
          _root.el.querySelector('.count').innerHTML = `评论(<span class="num">${len}</span>)`;
        }
        _root.loading.hide();
      }).catch((ex) => {
        _root.loading.hide();
      })
    }
    query();

    // 加载输入框
    let inputs = {
      comment: _root.el.querySelector('.veditor'),
      nick: _root.el.querySelector('.vsno .vnick'),
      mail: _root.el.querySelector('.vsno .vmail'),
      link: _root.el.querySelector('.vsno .vlink')
    };

    // 保存和加载游客的信息
    const setCache = (nick, mail, link) => {
      _root.store && _root.store.setItem('ValineCache', JSON.stringify({nick, mail, link}));
    }
    const getCache = () => {
      return _root.store && JSON.parse(_root.store.getItem('ValineCache'));
    }

    // 用户注册登录环节
    // const signupBtn = _root.el.querySelector('button[name="signup"]');
    // const signinBtn = _root.el.querySelector('button[name="signin"]');
    // const vinfo = _root.el.querySelector('div.vinfo');
    // const vctl = _root.el.querySelector('div.vctl');
    const vheader = _root.el.querySelector('.vheader');
    const jumpTo = (page) => { // 0-3
      vheader.scrollTop = page * 40;
    }
    // 0
    Event.on('click', vheader.querySelector('.vsno .vsinbtn'), () => jumpTo(1));
    Event.on('click', vheader.querySelector('.vsno .vsupbtn'), () => jumpTo(2));
    // 1
    Event.on('change', vheader.querySelector('.vsin .vpass'), () => tryToLogin());
    Event.on('click', vheader.querySelector('.vsin .vsinbtn'), () => tryToLogin());
    Event.on('click', vheader.querySelector('.vsin .vsupbtn'), () => jumpTo(2));
    Event.on('click', vheader.querySelector('.vsin .vbckbtn'), () => jumpTo(0));
    // 2
    Event.on('change', vheader.querySelector('.vsup .vlink'), () => tryToRegister());
    Event.on('click', vheader.querySelector('.vsup .vsinbtn'), () => jumpTo(1));
    Event.on('click', vheader.querySelector('.vsup .vsupbtn'), () => tryToRegister());
    Event.on('click', vheader.querySelector('.vsup .vbckbtn'), () => jumpTo(0));
    // 3
    Event.on('click', vheader.querySelector('.vlogout'), () => tryToLogout());

    // 注册
    const signup = (nick, pass, mail, link) => {
      return _root.v.User.signUp(nick, pass, {
        email: mail,
        link: link,
        ACL: getAcl()
      });
    }
    const signin = (mail, pass) => {
      return _root.v.User.logIn(mail, pass);
    }
    const onLogin = (user) => {
      _root.user = user;
      defaultComment.auth = true;
      defaultComment.nick = user.get('username');
      defaultComment.mail = user.get('email');
      defaultComment.link = user.get('link');
      let vleftdiv = vheader.querySelector('.vleftdiv');
      vleftdiv.innerHTML = shorten(`
        ${gravatar.get(user.get('email'))}
        <span class="vintro">${user.get('username')}</span>
      `)
      vleftdiv.setAttribute('title', `User: ${user.get('username')}\n(${user.get('email')})`)
      jumpTo(3);
    }
    const onLogout = () => {
      _root.user = null;
      defaultComment.auth = false;
      jumpTo(0);
    }
    const tryToLogin = () => {
      let name = vheader.querySelector('.vsin .vnick').value;
      let pass = vheader.querySelector('.vsin .vpass').value;
      try {
        signin(name, pass).then(onLogin).catch((err) => {
          alert('登录失败\n' + err.message);
        });
      } catch (err) {
        alert('登录失败\n' + err.message);
      }
    }
    const tryToRegister = () => {
      let name = vheader.querySelector('.vsup .vnick').value;
      let pass = vheader.querySelector('.vsup .vpass').value;
      let mail = vheader.querySelector('.vsup .vmail').value;
      let link = vheader.querySelector('.vsup .vlink').value;
      try {
        signup(name, pass, mail, link).then(onLogin).catch((err) => {
          alert('注册失败\n' + err.message);
        });
      } catch (err) {
        alert('注册失败\n' + err.message);
      }
    }
    const tryToLogout = () => {
      _root.v.User.logOut().then(onLogout).catch((err) => {
        alert('登出失败\n' + err.message);
      })
    }

    // 检查是否已经登录
    _root.user = _root.v.User.current();
    if (_root.user) {
      onLogin(_root.user);
    } else {
      let cache = getCache();
      if (cache) {
        inputs.nick.value = cache.nick;
        inputs.mail.value = cache.mail;
        inputs.link.value = cache.link;
      }
    }

    // 提交评论
    const submitBtn = _root.el.querySelector('.vsubmit');
    const submitEvt = (e) => {
      // veirfy
      let comment = inputs.comment.value;
      if (!comment) {
        return;
      }
      if (!_root.user) {
        let nick = inputs.nick.value || touristName;
        let mail = inputs.mail.value;
        let link = inputs.link.value;
        defaultComment.nick = nick;
        let mailRet = Checker.mail(mail);
        let linkRet = Checker.link(link);
        defaultComment.mail = mailRet.k ? mailRet.v : '';
        defaultComment.link = linkRet.k ? linkRet.v : '';
        setCache(nick, mail, link);
      }
      defaultComment.comment = marked(comment, { sanitize: true })
      commitEvt();
    }
    Event.on('click', submitBtn, submitEvt);

    // leancloud ACL
    const getAcl = (readAccess = true, writeAccess = false) => {
      let acl = new _root.v.ACL();
      acl.setPublicReadAccess(readAccess);
      acl.setPublicWriteAccess(writeAccess);
      return acl;
    }

    // 提交评论
    // 这时 defaultComment 应该已经填写完毕了
    const commitEvt = () => {
      submitBtn.setAttribute('disabled', true);
      _root.loading.show();
      let Ct = _root.v.Object.extend('Comment');
      let comment = new Ct(defaultComment);
      comment.setACL(getAcl());
      comment.save().then((ret) => {
        let _count = _root.el.querySelector('.num');
        let num = 1;
        if (_count) {
          num = Number(_count.innerText) + 1;
          _count.innerText = num;
        } else {
          _root.el.querySelector('.count').innerHTML = '评论(<span class="num">1</span>)';
        }
        insertDom(ret);
        submitBtn.removeAttribute('disabled');
        _root.loading.hide();
        // 清理回复设置
        inputs.comment.value = "";
        inputs.comment.setAttribute('placeholder', _root.placeholder);
        defaultComment.rid = '';
      }).catch(ex => {
        _root.loading.hide();
        _root.nodata.show('提交失败\n' + ex.message);
        setTimeout(_root.nodata.hide, 2000);
      })
    }

    let bindAtEvt = (el) => {
      // 点下了 回复 按钮
      Event.on('click', el, (e) => {
        let at = el.getAttribute('at');
        let rid = el.getAttribute('rid');
        let rmail = el.getAttribute('mail');
        defaultComment.rid = rid;
        inputs.comment.setAttribute('placeholder', `回复 ${at} 的评论...`);
        inputs.comment.select();
      })
    }
  }
}

window.Valine = Valine;

export default Valine;
