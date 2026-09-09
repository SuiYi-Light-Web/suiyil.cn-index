
var api = "/"; //wordpress地址

$(document).ready(function () {
  $(".loading").hide();
  getAchives();
  getHitokoto();
});

$('.menu a').click(function () {
  target = $(this).attr('goto');
  switchTo(target);
  $('.menu li a').each(function () {
    $(this).removeClass('active');
  });
  $(this).addClass('active');
});

function switchTo(target) {
  $('.right section').each(function () {
    $(this).removeClass('active');
  });
  $(target).addClass('active');
}

function getAchives() {
  var t = '', title, link, time;
  $.ajax({
    type: "GET",
    url: api + "wp-json/wp/v2/posts?per_page=10&page=1&_fields=date,title,link",
    dataType: "json",
    success: function (json) {
      if (!json || !json.length) {
        $('.archive-list').html('<li>暂无文章</li>');
        return;
      }
      for (var i = 0; i < json.length; i++) {
        title = json[i].title.rendered;
        link = json[i].link;
        time = new Date(json[i].date).Format("yyyy-MM-dd");
        t += `<li><a href="${link}" target="_blank">${title} <span class="meta">/ ${time}</span></a></li>`;
      }
      $('.archive-list').html(t);
    }
  }).fail(function () {
    $('.archive-list').html('<li>文章加载失败，请稍后刷新</li>');
  });
}

function getHitokoto() {
  $.ajax({
    url: "https://v1.hitokoto.cn/",
    dataType: "json",
    success: function (result) {
      write(result.hitokoto + " —— " + result.from);
    },
    error: function () {
      write("Error...");
    }
  });
}

var hitokotoRetry = 0;
function write(text) {
  if (text.length < 30 || hitokotoRetry >= 3) {
    hitokotoRetry = 0;
    $('#hitokoto').html(text);
  } else {
    hitokotoRetry++;
    getHitokoto();
  }
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

//异步加载背景

function blobToDataURI(blob, callback) {
  var reader = new FileReader();
  reader.onload = function (e) {
    callback(e.target.result);
  }
  reader.readAsDataURL(blob);
}
var url = "assets/img/浦之星-屋顶.png";
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);
xhr.responseType = "blob";
xhr.onload = function () {
  if (this.status == 200) {
    var blob = this.response;
    blobToDataURI(blob, function (t) {
      $("body").css("background-image", "url('" + t + "')");
      $("#background-small").addClass("smallBg");
      $("#background-small").css("opacity", "0");
    });
  }
}
xhr.send();
//metingjs
// 按标签名查找第一个 <meting-js>，不再依赖「元素 id 恰好等于歌单 id」这一巧合
const metingElem = document.querySelector('meting-js');

function initMetingPlayer() {
  // 判空：页面里没有播放器元素时优雅退出，避免后续代码抛错
  if (!metingElem) {
    console.warn('[metingjs] 未找到 <meting-js> 元素，跳过播放器增强。');
    return;
  }

  // 若 APlayer 已同步初始化完成，直接绑定
  if (metingElem.aplayer) {
    bindAPlayerEvents(metingElem.aplayer);
    return;
  }

  // 否则用 MutationObserver 等待 APlayer 异步创建完成
  const observer = new MutationObserver(() => {
    if (metingElem.aplayer) {
      observer.disconnect();
      bindAPlayerEvents(metingElem.aplayer);
    }
  });
  observer.observe(metingElem, { childList: true, subtree: true });
}

// 绑定事件函数
function bindAPlayerEvents(aplayer) {
  const mediaSession = navigator.mediaSession;

  aplayer.lrc.hide(); // 默认隐藏歌词

  aplayer.on('play', () => {
    aplayer.lrc.show(); // 播放显示歌词
    const currentAudio = aplayer.list.audios[aplayer.list.index];
    console.log('🎵 播放开始:', currentAudio.name);
    console.log('🎤 歌手:', currentAudio.artist);
    console.log('🖼️ 封面:', currentAudio.cover);

    // Media Session：仅在浏览器支持时才写入，避免不支持时抛错
    if (mediaSession && 'MediaMetadata' in window) {
      mediaSession.metadata = new MediaMetadata({
        title: currentAudio.name,
        artist: currentAudio.artist,
        artwork: [{ src: currentAudio.cover || 'main-logo.png' }]
      });
      mediaSession.playbackState = "playing";
    }
  });

  aplayer.on('pause', () => {
    aplayer.lrc.hide(); // 暂停隐藏歌词
    console.log('⏸️ 已暂停');
    if (mediaSession) mediaSession.playbackState = "paused";
  });

  aplayer.on('ended', () => {
    aplayer.lrc.hide(); // 播放结束隐藏歌词
    console.log('🏁 播放结束');
    if (mediaSession) {
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
    }
  });

  // 注册系统媒体栏的上一曲/下一曲
  if (mediaSession) {
    mediaSession.setActionHandler('previoustrack', function () {
      console.log('上一曲');
      aplayer.skipBack();
    });
    mediaSession.setActionHandler("nexttrack", function () {
      console.log('下一曲');
      aplayer.skipForward();
    });
  }
}

initMetingPlayer();
