(function () {
  var p = history.pushState.bind(history);
  var r = history.replaceState.bind(history);
  history.pushState = function () {
    p.apply(this, arguments);
    window.postMessage({ type: '__QWIK_DT_NAV' }, '*');
  };
  history.replaceState = function () {
    r.apply(this, arguments);
    window.postMessage({ type: '__QWIK_DT_NAV' }, '*');
  };
})();
