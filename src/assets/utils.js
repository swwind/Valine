'use strict';

const HtmlUtil = {
  __tool: document.createElement('div'),
  /**
   * HTML 转码
   * @param {String} str
   * @return {String} result
   */
  encode(str) {
    this.__tool.innerText = str;
    return this.__tool.innerHTML;
  },
  /**
   * HTML 解码
   * @param {String} str
   * @return {String} result
   */
  decode(str) {
    this.__tool.innerHTML = str;
    return this.__tool.innerText;
  }
};

const padWithZeros = (vNumber, width) => {
  var numAsString = vNumber.toString();
  while (numAsString.length < width) {
    numAsString = '0' + numAsString;
  }
  return numAsString;
}

const dateFormat = (date) => {
  var vDay = padWithZeros(date.getDate(), 2);
  var vMonth = padWithZeros(date.getMonth() + 1, 2);
  var vYear = padWithZeros(date.getFullYear(), 2);
  return `${vYear}-${vMonth}-${vDay}`;
}

const timeAgo = (date) => {
  var oldTime = date.getTime();
  var currTime = new Date().getTime();
  var diffValue = currTime - oldTime;

  var days = Math.floor(diffValue / (24 * 3600 * 1000));
  if (days === 0) {
    //计算相差小时数
    var leave1 = diffValue % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000));
    if (hours === 0) {
      //计算相差分钟数
      var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
      var minutes = Math.floor(leave2 / (60 * 1000));
      if (minutes === 0) {
        //计算相差秒数
        var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000);
        return seconds + ' 秒前';
      }
      return minutes + ' 分钟前';
    }
    return hours + ' 小时前';
  }
  if (days < 0) return '刚刚';

  if (days < 8) {
    return days + ' 天前';
  } else {
    return dateFormat(date)
  }
}

const getLink = (link) => {
  return link || 'javascript:void(0);';
}

const Checker = {
  mail(m) {
    return {
      k: /[\w-\.]+@([\w-]+\.)+[a-z]{2,3}/.test(m),
      v: m
    };
  },
  link(l) {
    l = l.length > 0 && (/^(http|https)/.test(l) ? l : `http://${l}`);
    return {
      k: /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/.test(l),
      v: l
    };
  }
}

const Event = {
  on(type, el, handler, capture = false) {
    if (el.addEventListener) el.addEventListener(type, handler, capture);
    else if (el.attachEvent) el.attachEvent(`on${type}`, handler);
    else el[`on${type}`] = handler;
  },
  off(type, el, handler, capture = false) {
    if (el.removeEventListener) el.removeEventListener(type, handler, capture);
    else if (el.detachEvent) el.detachEvent(`on${type}`, handler);
    else el[`on${type}`] = null;
  }
}

export { HtmlUtil, dateFormat, timeAgo, getLink, Checker, padWithZeros, Event };
