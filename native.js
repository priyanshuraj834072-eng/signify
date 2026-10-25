/* Singify native bridge: runs only inside the Android app (Capacitor). Web users are not affected. */
(function () {
  var C = window.Capacitor;
  if (!C || !(C.isNativePlatform ? C.isNativePlatform() : (C.getPlatform && C.getPlatform() !== 'web'))) return;
  window.SG_NATIVE = true;
  var P = C.Plugins || {};
  var safe = function (f) {
    try { var r = f(); if (r && typeof r.catch === 'function') r.catch(function () {}); } catch (e) {}
  };

  /* splash: hide it as soon as the page is ready */
  var SS = P.SplashScreen;
  if (SS && SS.hide) {
    var hideSplash = function () { safe(function () { return SS.hide({ fadeOutDuration: 250 }); }); };
    if (document.readyState === 'complete') setTimeout(hideSplash, 200);
    else window.addEventListener('load', function () { setTimeout(hideSplash, 200); });
  }

  /* hide the Install buttons inside the app */
  var st = document.createElement('style');
  st.textContent = '[data-inst]{display:none!important}';
  (document.head || document.documentElement).appendChild(st);

  /* media notification: forward normal Media Session calls to the native plugin */
  var MS = P.MediaSession;
  if (MS) {
    if (typeof window.MediaMetadata === 'undefined') {
      window.MediaMetadata = function (o) {
        o = o || {};
        this.title = o.title || '';
        this.artist = o.artist || '';
        this.album = o.album || '';
        this.artwork = o.artwork || [];
      };
    }

    /* The native plugin downloads artwork itself and crashes the app when the download fails
       (for example offline). So the notification is sent first WITHOUT artwork, and the artwork
       is added only after the browser has confirmed that the image really loads. */
    var metaToken = 0;
    var imgOk = function (src) {
      return new Promise(function (res) {
        var done = false, im = new Image();
        var fin = function (ok) { if (!done) { done = true; res(ok); } };
        im.onload = function () { fin(true); };
        im.onerror = function () { fin(false); };
        setTimeout(function () { fin(false); }, 5000);
        try { im.src = src; } catch (e) { fin(false); }
      });
    };
    var sendMeta = function (m, art) {
      safe(function () {
        return MS.setMetadata({ title: m.title || '', artist: m.artist || '', album: m.album || '', artwork: art });
      });
    };
    var pushMeta = function (m) {
      var tok = ++metaToken;
      sendMeta(m, []);
      var list = (m.artwork || []).filter(function (a) { return a && a.src && /^https?:|^data:/.test(a.src); });
      if (!list.length || navigator.onLine === false) return;
      Promise.all(list.map(function (a) { return imgOk(a.src).then(function (ok) { return ok ? a : null; }); }))
        .then(function (r) {
          if (tok !== metaToken || navigator.onLine === false) return;
          var good = r.filter(Boolean);
          if (good.length) sendMeta(m, good);
        })
        .catch(function () {});
    };

    var meta = null, state = 'none';
    var shim = {
      get metadata() { return meta; },
      set metadata(m) {
        meta = m;
        if (m) { try { pushMeta(m); } catch (e) {} }
      },
      get playbackState() { return state; },
      set playbackState(s) {
        state = s;
        safe(function () { return MS.setPlaybackState({ playbackState: s }); });
      },
      setActionHandler: function (a, h) {
        safe(function () { return MS.setActionHandler({ action: a }, h || null); });
      },
      setPositionState: function (p) {
        if (!p || !isFinite(p.duration) || !p.duration) return;
        safe(function () {
          return MS.setPositionState({ duration: p.duration, position: p.position || 0, playbackRate: p.playbackRate || 1 });
        });
      }
    };
    try { Object.defineProperty(navigator, 'mediaSession', { value: shim, configurable: true }); }
    catch (e) { try { navigator.mediaSession = shim; } catch (e2) {} }
  }

  /* back button: close layers/pages like the web, minimise the app on Home */
  var AP = P.App;
  if (AP && AP.addListener) {
    safe(function () {
      return AP.addListener('backButton', function () {
        var up = document.getElementById('updp');
        if (up) { if (!up.dataset.req) { var sk = up.querySelector('.lt'); if (sk) sk.click(); } return; }
        var h = location.hash || '#/home';
        var layers = (typeof LAY !== 'undefined' && LAY.length) ? LAY.length : 0;
        var atHome = (h === '#/home' || h === '#/' || h === '#') && !document.body.classList.contains('now') && !layers;
        if (atHome || history.length <= 1) safe(function () { return AP.minimizeApp(); });
        else history.back();
      });
    });
  }

  /* ask for notification permission (Android 13+) so the media notification can show */
  var LN = P.LocalNotifications;
  if (LN && LN.checkPermissions) {
    setTimeout(function () {
      safe(function () {
        return LN.checkPermissions().then(function (r) {
          if (r && r.display !== 'granted') return LN.requestPermissions();
        });
      });
    }, 4000);
  }

  /* Google sign-in: use the native Google dialog (Google blocks login inside a WebView) */
  var FA = P.FirebaseAuthentication;
  if (FA && FA.signInWithGoogle) {
    /* If the person backs out of the Google account list the plugin may never answer.
       So: when the app comes back to the front and still nothing arrived after 3 seconds,
       treat it as cancelled. */
    window.SG_GSIGN = function () {
      return new Promise(function (resolve, reject) {
        var done = false, left = false, tm = null;
        var cleanup = function () {
          clearTimeout(tm);
          document.removeEventListener('visibilitychange', vc);
          window.removeEventListener('blur', bl);
          window.removeEventListener('focus', fc);
        };
        var fin = function (f, v) { if (done) return; done = true; cleanup(); f(v); };
        var away = function () { left = true; clearTimeout(tm); };
        var back = function () {
          if (!left) return;
          clearTimeout(tm);
          tm = setTimeout(function () { fin(reject, new Error('cancelled')); }, 3000);
        };
        var vc = function () { if (document.visibilityState === 'hidden') away(); else back(); };
        var bl = function () { away(); };
        var fc = function () { back(); };
        document.addEventListener('visibilitychange', vc);
        window.addEventListener('blur', bl);
        window.addEventListener('focus', fc);
        FA.signInWithGoogle().then(
          function (r) { fin(resolve, (r && r.credential) || {}); },
          function (e) { fin(reject, e); }
        );
      });
    };
    /* sign out of the native Google session too, so the next login shows the account list again */
    window.SG_GSIGNOUT = function () {
      safe(function () { return FA.signOut(); });
    };
  }
})();

/* Edge-to-edge (UI behind the status bar) and "new app version" popup. Needs the Android app build 20 or newer; older builds just ignore it. */
(function () {
  var C = window.Capacitor;
  if (!C || !(C.isNativePlatform ? C.isNativePlatform() : (C.getPlatform && C.getPlatform() !== 'web'))) return;
  var de = document.documentElement;
  var isLight = function () {
    if (de.dataset && de.dataset.theme) return de.dataset.theme === 'light';
    try { return JSON.parse(localStorage.getItem('sg_theme')) === 'light'; } catch (e) { return false; }
  };
  /* dark theme: the app draws behind the status bar. light theme: normal bar, so the white icons stay readable. */
  window.sgEdgeSync = function () {
    try {
      if (!window.SGEdge) return;
      var light = isLight();
      de.style.setProperty('--sat', light ? '0px' : (SGEdge.top() + 'px'));
      SGEdge.enable(!light);
    } catch (e) {}
  };
  /* Android can reset the window after a fast cold start (splash screen, resume). So the command is repeated:
     right now, a few times shortly after, and every time the app comes back to the front. It is safe to repeat. */
  var edgeBurst = function () {
    window.sgEdgeSync();
    [300, 900, 2000, 4000].forEach(function (ms) { setTimeout(window.sgEdgeSync, ms); });
  };
  edgeBurst();
  document.addEventListener('DOMContentLoaded', edgeBurst);
  window.addEventListener('load', edgeBurst);
  window.addEventListener('pageshow', edgeBurst);
  window.addEventListener('focus', edgeBurst);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) edgeBurst(); });
  var AP0 = (C.Plugins || {}).App;
  if (AP0 && AP0.addListener) {
    try { AP0.addListener('resume', edgeBurst); } catch (e) {}
    try { AP0.addListener('appStateChange', function (st) { if (st && st.isActive) edgeBurst(); }); } catch (e) {}
  }

  /* version.json: { "apk": { "build": 21, "url": "...", "mandatory": false, "message": "..." } } */
  var AP = (C.Plugins || {}).App;
  if (AP && AP.getInfo) {
    setTimeout(function () {
      AP.getInfo().then(function (info) {
        var mine = parseInt(info && info.build, 10) || 0;
        return fetch('/version.json?' + Date.now(), { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (v) {
            var a = v && v.apk;
            if (!a || !a.url || (parseInt(a.build, 10) || 0) <= mine) return;
            showApk(a);
          });
      }).catch(function () {});
    }, 4000);
  }
  function showApk(a) {
    if (document.getElementById('sgApk')) return;
    var w = document.createElement('div');
    w.id = 'sgApk';
    w.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit';
    var c = document.createElement('div');
    c.style.cssText = 'width:100%;max-width:340px;background:#1a1812;color:#f4efe4;border-radius:24px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6)';
    var h = document.createElement('div');
    h.textContent = 'New Singify app available';
    h.style.cssText = 'font-size:20px;font-weight:800;margin-bottom:8px';
    var p = document.createElement('div');
    p.textContent = a.message || 'A new version of the app is ready. Download it and install it over the old one. Your login and data stay.';
    p.style.cssText = 'font-size:14px;opacity:.8;line-height:1.5;margin-bottom:20px';
    var d = document.createElement('button');
    d.textContent = 'Download';
    d.style.cssText = 'width:100%;border:0;border-radius:99px;padding:14px;font-size:16px;font-weight:800;background:#e8b93d;color:#1a1200';
    d.onclick = function () { location.href = a.url; };
    c.appendChild(h); c.appendChild(p); c.appendChild(d);
    if (!a.mandatory) {
      var l = document.createElement('button');
      l.textContent = 'Later';
      l.style.cssText = 'width:100%;border:0;background:none;color:#f4efe4;opacity:.7;margin-top:10px;padding:10px;font-size:14px';
      l.onclick = function () { w.remove(); };
      c.appendChild(l);
    }
    w.appendChild(c);
    document.body.appendChild(w);
  }
})();
