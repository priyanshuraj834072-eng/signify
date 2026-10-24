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
    window.SG_GSIGN = function () {
      return FA.signInWithGoogle().then(function (r) { return (r && r.credential) || {}; });
    };
  }
})();
