(function () {
  'use strict';

  if (document.documentElement.dataset.panLiquidGlassInstalled === 'true') return;
  document.documentElement.dataset.panLiquidGlassInstalled = 'true';

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var surfaceSelector = [
    '#blog_name',
    '#menus > .menus_items',
    '#page-name',
    '#nav-right',
    '#rightMenu',
    '#rightside .rs_show',
    '#rightside .rs_hide',
    '#console .console-card',
    '#console .button-group span',
    '#sidebar-menus',
    '#local-search .search-dialog'
  ].join(',');

  var frame = 0;
  var pendingEvent = null;
  var homeThemeObserver = null;
  var homeThemeNode = null;
  var navCoverFrame = 0;

  function hideTooltip() {
    var tooltip = document.querySelector('.custom-tooltip');
    if (!tooltip) return;

    tooltip.style.opacity = '0';
    tooltip.style.backdropFilter = 'none';
  }

  function prepareTooltips() {
    document.querySelectorAll('[heotip]').forEach(function (control) {
      var label = control.getAttribute('heotip') || control.getAttribute('title');
      if (label && !control.hasAttribute('aria-label') && !control.textContent.trim()) {
        control.setAttribute('aria-label', label);
      }

      control.removeAttribute('title');
    });

    document.querySelectorAll('#menus .site-page, #rightMenu .rightMenu-item, #console .console-btn-item').forEach(function (control) {
      var label = control.getAttribute('heotip');
      if (label && !control.hasAttribute('aria-label')) control.setAttribute('aria-label', label);
      control.removeAttribute('heotip');
      control.removeAttribute('title');
    });
  }

  function installSnackbarDedupe() {
    var solitude = window.Solitude;
    if (!solitude || typeof solitude.snackbarShow !== 'function' || solitude.snackbarShow.__panDedupe) return;

    var original = solitude.snackbarShow;
    var lastMessage = '';
    var lastShownAt = 0;

    function dedupedSnackbar(message) {
      var now = window.performance.now();
      if (message === lastMessage && now - lastShownAt < 240) return;

      lastMessage = message;
      lastShownAt = now;
      return original.apply(this, arguments);
    }

    dedupedSnackbar.__panDedupe = true;
    solitude.snackbarShow = dedupedSnackbar;
    document.documentElement.dataset.panSnackbarDedupe = 'true';
  }

  function refreshRuntimeGuards() {
    prepareTooltips();
    installSnackbarDedupe();
    syncPostCoverMaterial();
    syncHomeTheme();
    requestNavCoverSync();
  }

  function findNavCoverTarget(header) {
    if (header.classList.contains('post-bg')) return header;
    return document.querySelector('#home_center .home-center-content');
  }

  function syncNavCoverState() {
    navCoverFrame = 0;

    var header = document.querySelector('#page-header');
    var nav = header && header.querySelector('#nav');
    if (!header || !nav) return;

    var cover = findNavCoverTarget(header);
    if (!cover) {
      header.classList.remove('pan-nav-over-cover');
      return;
    }

    var navRect = nav.getBoundingClientRect();
    var coverRect = cover.getBoundingClientRect();
    var navCenterY = navRect.top + navRect.height / 2;
    var overlapsCover = navCenterY >= coverRect.top &&
      navCenterY <= coverRect.bottom &&
      coverRect.right > 0 &&
      coverRect.left < window.innerWidth;

    header.classList.toggle('pan-nav-over-cover', overlapsCover);
  }

  function requestNavCoverSync() {
    if (navCoverFrame) return;
    navCoverFrame = window.requestAnimationFrame(syncNavCoverState);
  }

  function syncHomeTheme() {
    var root = document.documentElement;
    var home = document.querySelector('#home_center');

    if (!home) {
      root.style.removeProperty('--pan-home-theme');
      if (homeThemeObserver) homeThemeObserver.disconnect();
      homeThemeObserver = null;
      homeThemeNode = null;
      return;
    }

    var theme = getComputedStyle(home).getPropertyValue('--current-theme').trim();
    if (theme) root.style.setProperty('--pan-home-theme', theme);

    if (homeThemeNode === home) return;
    if (homeThemeObserver) homeThemeObserver.disconnect();
    homeThemeNode = home;
    homeThemeObserver = new MutationObserver(syncHomeTheme);
    homeThemeObserver.observe(home, { attributes: true, attributeFilter: ['style'] });
  }

  function syncPostCoverMaterial() {
    var header = document.querySelector('#page-header.post-bg');
    var cover = header && header.querySelector('.post-cover-aside-img');
    if (!header || !cover) return;

    var source = cover.currentSrc || cover.src;
    if (!source) return;

    var safeSource = source.replace(/(["\\])/g, '\\$1');
    header.style.setProperty('--pan-post-cover-image', 'url("' + safeSource + '")');
  }

  function onMenuOver(event) {
    if (!finePointer.matches) return;
    var origin = event.target;
    if (!(origin instanceof Element)) return;

    var item = origin.closest('#page-header #menus .menus_item');
    if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;

    document.documentElement.classList.add('pan-nav-menu-hover');
    hideTooltip();
  }

  function onMenuOut(event) {
    if (!finePointer.matches) return;
    var origin = event.target;
    if (!(origin instanceof Element)) return;

    var item = origin.closest('#page-header #menus .menus_item');
    if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;

    document.documentElement.classList.remove('pan-nav-menu-hover');
    hideTooltip();
  }

  function paint(event) {
    frame = 0;
    if (!event || !finePointer.matches || reduceMotion.matches) return;

    var origin = event.target;
    if (!(origin instanceof Element)) return;

    var surface = origin.closest(surfaceSelector);
    if (!surface) return;

    var rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    var y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    surface.style.setProperty('--pan-glass-x', x.toFixed(2) + '%');
    surface.style.setProperty('--pan-glass-y', y.toFixed(2) + '%');
  }

  function onPointerMove(event) {
    pendingEvent = event;
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      paint(pendingEvent);
    });
  }

  function onPointerOut(event) {
    var origin = event.target;
    if (!(origin instanceof Element)) return;

    var surface = origin.closest(surfaceSelector);
    if (!surface || (event.relatedTarget instanceof Node && surface.contains(event.relatedTarget))) return;

    surface.style.removeProperty('--pan-glass-x');
    surface.style.removeProperty('--pan-glass-y');
  }

  document.documentElement.classList.add('pan-liquid-glass');
  refreshRuntimeGuards();

  document.addEventListener('mouseover', onMenuOver, true);
  document.addEventListener('mouseout', onMenuOut, true);
  document.addEventListener('pointerdown', hideTooltip, true);
  document.addEventListener('click', hideTooltip, true);
  document.addEventListener('pjax:send', function () {
    hideTooltip();
    var header = document.querySelector('#page-header');
    if (header) header.classList.remove('pan-nav-over-cover');
  });
  document.addEventListener('pjax:complete', function () {
    document.documentElement.classList.remove('pan-nav-menu-hover');
    refreshRuntimeGuards();
    hideTooltip();
  });
  document.addEventListener('DOMContentLoaded', refreshRuntimeGuards, { once: true });
  window.addEventListener('load', refreshRuntimeGuards, { once: true });
  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('scroll', requestNavCoverSync, { passive: true });
  window.addEventListener('resize', requestNavCoverSync, { passive: true });
  window.addEventListener('blur', hideTooltip);

  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection && connection.saveData) {
    document.documentElement.classList.add('pan-reduced-effects');
    return;
  }

  if (finePointer.matches && !reduceMotion.matches) {
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
  }
})();
