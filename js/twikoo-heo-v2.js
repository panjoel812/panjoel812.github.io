(function () {
  'use strict';

  function tuneTwikoo(root) {
    root.querySelectorAll('.twikoo').forEach(function (twikoo) {
      var toolbar = twikoo.querySelector('.tk-row-actions-start');
      if (toolbar && !toolbar.querySelector('.pan-tk-ai-tool')) {
        ['AI评论', 'AI润色'].forEach(function (text) {
          var aiButton = document.createElement('button');
          aiButton.type = 'button';
          aiButton.className = 'pan-tk-ai-tool';
          aiButton.textContent = text;
          aiButton.setAttribute('aria-disabled', 'true');
          aiButton.title = '需要另行配置 AI 服务';
          aiButton.addEventListener('click', function () {
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
          toolbar.appendChild(aiButton);
        });
      }

      var submit = twikoo.querySelector('.tk-submit');
      if (submit && !submit.querySelector('.pan-tk-mode-row')) {
        var modeRow = document.createElement('div');
        modeRow.className = 'pan-tk-mode-row';

        var modeLabel = document.createElement('span');
        modeLabel.className = 'pan-tk-mode-label';
        modeLabel.textContent = '其他方式';

        var anonButton = document.createElement('button');
        anonButton.type = 'button';
        anonButton.className = 'pan-tk-anon-button';
        anonButton.textContent = '匿名评论';
        anonButton.setAttribute('aria-expanded', 'false');
        anonButton.addEventListener('click', function () {
          var isOpen = twikoo.classList.toggle('pan-tk-anon-open');
          anonButton.setAttribute('aria-expanded', String(isOpen));
          if (isOpen) {
            var firstInput = twikoo.querySelector('.tk-meta-input input');
            if (firstInput) firstInput.focus();
          }
        });

        modeRow.appendChild(modeLabel);
        modeRow.appendChild(anonButton);
        submit.appendChild(modeRow);
        twikoo.classList.add('pan-tk-mode-ready');
      }

      var count = twikoo.querySelector('.tk-comments-count');
      if (count) {
        var match = count.textContent.match(/\d+/);
        if (match) {
          var countText = match[0] + ' 条评论';
          if (count.textContent.trim() !== countText) count.textContent = countText;
        }
      }

      var actions = twikoo.querySelector('.tk-comments-actions');
      if (!actions) return;
      var oldSortLabel = actions.querySelector('.pan-tk-sort-label');
      if (oldSortLabel) oldSortLabel.remove();
    });
  }

  var queued = false;
  function scheduleTune() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      tuneTwikoo(document);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleTune, { once: true });
  } else {
    scheduleTune();
  }

  new MutationObserver(scheduleTune).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
  document.addEventListener('pjax:complete', scheduleTune);
})();
