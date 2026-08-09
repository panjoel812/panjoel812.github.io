(function () {
  'use strict';

  function addAiTools(toolbar) {
    if (!toolbar || toolbar.querySelector('.pan-tk-ai-tool')) return;

    ['AI评论', 'AI润色'].forEach(function (text) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pan-tk-ai-tool';
      button.textContent = text;
      button.setAttribute('aria-disabled', 'true');
      button.title = '需要另行配置 AI 服务';
      button.addEventListener('click', function () {
        var oldNotice = toolbar.querySelector('.pan-tk-ai-notice');
        if (oldNotice) oldNotice.remove();

        var notice = document.createElement('span');
        notice.className = 'pan-tk-ai-notice';
        notice.textContent = '需要另行配置 AI 服务';
        toolbar.appendChild(notice);
        window.setTimeout(function () {
          if (notice.isConnected) notice.remove();
        }, 1800);
      });
      toolbar.appendChild(button);
    });
  }

  function addGuestMode(twikoo, submit) {
    if (!submit || submit.querySelector('.pan-tk-mode-row')) return;

    var row = document.createElement('div');
    row.className = 'pan-tk-mode-row';

    var label = document.createElement('span');
    label.className = 'pan-tk-mode-label';
    label.textContent = '访客评论';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'pan-tk-anon-button';
    button.textContent = '填写信息';
    button.title = '填写昵称和邮箱后发表评论；邮箱不会公开';
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var isOpen = twikoo.classList.toggle('pan-tk-anon-open');
      button.setAttribute('aria-expanded', String(isOpen));
      button.textContent = isOpen ? '收起信息' : '填写信息';
      if (isOpen) {
        var firstInput = submit.querySelector('.tk-meta-input input');
        if (firstInput) firstInput.focus();
      }
    });

    row.appendChild(label);
    row.appendChild(button);
    submit.appendChild(row);
    twikoo.classList.add('pan-tk-mode-ready');
  }

  function enhanceAdmin(twikoo) {
    var container = twikoo.querySelector('.tk-admin-container');
    var admin = container && container.querySelector(':scope > .tk-admin');
    if (!container || !admin) return;

    var close = admin.querySelector(':scope > .tk-admin-close');
    var isOpen = admin.classList.contains('__show');
    var previousState = admin.getAttribute('data-pan-open');

    twikoo.classList.toggle('pan-tk-admin-active', isOpen);
    container.classList.toggle('pan-tk-admin-active', isOpen);
    admin.setAttribute('role', 'dialog');
    admin.setAttribute('aria-modal', 'true');
    admin.setAttribute('aria-label', 'Twikoo 评论管理');
    admin.setAttribute('data-pan-open', String(isOpen));

    if (close) {
      close.type = 'button';
      close.setAttribute('aria-label', '关闭评论管理面板');
      close.title = '关闭评论管理面板（Esc）';
    }

    document.documentElement.classList.toggle(
      'pan-tk-admin-open',
      Boolean(document.querySelector('#twikoo .tk-admin.__show'))
    );

    if (isOpen && previousState !== 'true' && close) {
      requestAnimationFrame(function () {
        close.focus({ preventScroll: true });
      });
    }

    if (container.dataset.panCloseBound !== 'true') {
      container.dataset.panCloseBound = 'true';
      container.addEventListener('click', function (event) {
        if (event.target !== container) return;
        var activeClose = container.querySelector('.tk-admin.__show > .tk-admin-close');
        if (activeClose) activeClose.click();
      });
    }
  }

  function tune() {
    document.querySelectorAll('#twikoo.twikoo').forEach(function (twikoo) {
      enhanceAdmin(twikoo);
      var submit = twikoo.querySelector('.tk-comments > .tk-submit');
      if (!submit) return;
      addAiTools(submit.querySelector('.tk-row-actions-start'));
      addGuestMode(twikoo, submit);
    });
  }

  var queued = false;
  function scheduleTune() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      tune();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleTune, { once: true });
  } else {
    scheduleTune();
  }

  new MutationObserver(function (mutations) {
    var touchesTwikoo = mutations.some(function (mutation) {
      if (mutation.target instanceof Element && mutation.target.closest('#twikoo')) return true;

      return Array.prototype.some.call(mutation.addedNodes, function (node) {
        return node instanceof Element && (node.matches('#twikoo') || node.querySelector('#twikoo'));
      });
    });

    if (touchesTwikoo) scheduleTune();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;

    var admin = document.querySelector('#twikoo .tk-admin.__show');
    var close = admin && admin.querySelector(':scope > .tk-admin-close');
    if (!close) return;

    event.preventDefault();
    close.click();
  });
  document.addEventListener('pjax:complete', scheduleTune);
})();
