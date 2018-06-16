/**
 * @Valine
 * Author: xCss
 * Github: https://github.com/xCss/Valine
 * Website: https://valine.js.org
 */
import md5 from 'blueimp-md5';
import marked from 'marked';
import detect from './assets/detect.js';
import { HtmlUtil, dateFormat, timeAgo, getLink, Checker, padWithZeros, Event } from './assets/utils.js';

const gravatar = {
  cdn: 'https://gravatar.loli.net/avatar/',
  hide: false
};

const defaultComment = {
  comment: '',
  rid: '',
  nick: 'tourist',
  mail: '',
  link: '',
  ua: navigator.userAgent,
  url: ''
};

const shorten = (str) =>
  str.trim().replace(/>\s+</g, '><');

const guest_info = ['nick', 'mail', 'link'];

class Valine {
  /**
   * Valine constructor function
   * @param {Object} option
   * @constructor
   */
  constructor(option) {
    let _root = this;
    // version
    _root.version = '1.1.9';

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

    let el = Object.prototype.toString.call(option.el) === "[object HTMLDivElement]" ? option.el : document.querySelectorAll(option.el)[0];
    if (Object.prototype.toString.call(el) != '[object HTMLDivElement]') {
      throw `The target element was not found.`;
    }
    _root.el = el;
    _root.el.classList.add('valine');

    _root.placeholder = option.placeholder || '';
    let eleHTML = shorten(`
      <div class="vwrap">
        <div class="vheader item3">
          <input name="nick" placeholder="称呼 *" class="vnick vinput" type="text">
          <input name="mail" placeholder="邮箱 *" class="vmail vinput" type="email">
          <input name="link" placeholder="网址(http://)" class="vlink vinput" type="text">
        </div>
        <div class="vedit">
          <textarea class="veditor vinput" placeholder="${_root.placeholder}"></textarea>
        </div>
        <div class="vcontrol">
          <div class="col col-60" title="MarkDown is Support">
            <a href="https://segmentfault.com/markdown">MarkDown</a> is Support
          </div>
          <div class="col col-40 text-right">
            <button type="button" class="vsubmit vbtn">发布</button>
          </div>
        </div>
      </div>
      <div class="info">
        <div class="count col"></div>
      </div>
      <div class="vloading"></div>
      <div class="vempty" style="display:none;"></div>
      <ul class="vlist"></ul>
      <div class="vpage txt-center"></div>
      <div class="info">
        <div class="power txt-right">
          Powered By <a href="https://github.com/swwind/valine-ex" target="_blank">ValineEX</a>
          <br>v${_root.version}
        </div>
      </div>
    `);
    _root.el.innerHTML = eleHTML;

    // Empty Data
    let vempty = _root.el.querySelector('.vempty');
    _root.nodata = {
      show(txt) {
        vempty.innerHTML = txt || `还没有评论哦，快来抢沙发吧!`;
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
          _root.nodata.show();
        }
      }
    };

    _root.notify = option.notify || false;
    _root.verify = option.verify || false;

    gravatar['params'] = `?d=${option.avatar}&s=40`;
    gravatar['hide'] = option.avatar === 'hide';

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
    _root.user = AV.User.current();

    // preparation end =======================

    // Bind Event
    _root.bind(option);
  }

  /**
   * Bind Event
   */
  bind(option) {
    let _root = this;

    const expandEvt = (el) => {
      if (el.offsetHeight > 180) {
        el.classList.add('expand');
        Event.on('click', el, (e) => {
          el.setAttribute('class', 'vcontent');
        })
      }
    }

    const commonQuery = (cb) => {
      let query = new _root.v.Query('Comment');
      query.equalTo('url', defaultComment['url']);
      query.descending('createdAt');
      return query;
    }

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
      let _img = gravatar['hide'] ? '' : `<img class="vimg" src='${gravatar.cdn + md5(ret.get('mail') || ret.get('nick')) + gravatar.params}'>`;
      _vcard.innerHTML = (_img + `
        <section>
          <div class="vhead">
            <a rel="nofollow" href="${getLink({ link: ret.get('link'), mail: ret.get('mail') })}" target="_blank" >
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
            <span rid="${ret.id}" at="@${ret.get('nick')}" mail="${ret.get('mail')}" class="vat">回复</span>
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

    const query = () => {
      _root.loading.show();
      let cq = commonQuery();
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


    let mapping = { veditor: "comment" }
    guest_info.forEach((k) => {
      mapping['v' + k] = k;
    })

    let inputs = {
      comment: _root.el.querySelector('.veditor'),
      nick: _root.el.querySelector('.vnick'),
      mail: _root.el.querySelector('.vmail'),
      link: _root.el.querySelector('.vlink'),
      get() {
        return [this.nick.value, this.mail.value, this.link.value, this.comment.value];
      }
    };

    const setCache = (nick, mail, link) => {
      _root.store && _root.store.setItem('ValineCache', JSON.stringify({nick, mail, link}));
    }
    const getCache = () => {
      return _root.store && JSON.parse(_root.store.getItem('ValineCache'));
    }

    let cache = getCache();
    if (cache) {
      inputs.nick.value = cache.nick;
      inputs.mail.value = cache.mail;
      inputs.link.value = cache.link;
    }

    // user
    // const signupBtn = _root.el.querySelector('button[name="signup"]');
    // const signinBtn = _root.el.querySelector('button[name="signin"]');
    // const vinfo = _root.el.querySelector('div.vinfo');
    // const vctl = _root.el.querySelector('div.vctl');
    // 注册
    // const registerUser = (mail) => {
    //   let u = new _root.v.User();
    //   u.setUsername(mail);
    //   u.setPassword(mail);
    //   u.setEmail(mail);
    //   u.setACL(getAcl());
    //   return u.signUp();
    // }
    // const logInUser = async (mail) => {
    //   try {
    //     return await AV.User.logIn(mail, mail);
    //   } catch (e) {
    //     return await registerUser(mail);
    //   }
    // };

    // 提交评论
    const submitBtn = _root.el.querySelector('.vsubmit');
    const submitEvt = (e) => {
      // veirfy
      let [nick, mail, link, comment] = inputs.get();
      nick = nick || defaultComment.nick;
      defaultComment.nick = nick;
      let mailRet = Checker.mail(mail);
      let linkRet = Checker.link(link);
      defaultComment.mail = mailRet.k ? mailRet.v : '';
      defaultComment.link = linkRet.k ? linkRet.v : '';
      defaultComment.comment = marked(comment, { sanitize: true })
      if (!defaultComment.comment) {
        return;
      }
      setCache(nick, mail, link);
      commitEvt();
    }
    Event.on('click', submitBtn, submitEvt);

    // setting access
    const getAcl = () => {
      let acl = new _root.v.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(false);
      return acl;
    }

    const commitEvt = () => {
      submitBtn.setAttribute('disabled', true);
      _root.loading.show();
      let Ct = _root.v.Object.extend('Comment');
      let comment = new Ct(defaultComment);
      comment.setACL(getAcl());
      comment.save().then((ret) => {
        // TODO
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
        inputs.comment.value = "";
        inputs.comment.setAttribute('placeholder', _root.placeholder);
        defaultComment['rid'] = '';
      }).catch(ex => {
        _root.loading.hide();
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
