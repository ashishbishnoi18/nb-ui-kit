/**
 * NB Toast Component
 * Notification toasts with auto-dismiss, progress bars, and position support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Containers keyed by position */
  var _containers = {};

  var POSITIONS = [
    'top-right', 'top-left', 'top-center',
    'bottom-right', 'bottom-left', 'bottom-center'
  ];

  /* ------------------------------------------------------------------ */
  /*  Container management                                               */
  /* ------------------------------------------------------------------ */

  function getContainer(position) {
    if (_containers[position]) return _containers[position];

    var container = document.createElement('div');
    container.className = 'nb-toast-container nb-toast-container--' + position;
    container.setAttribute('data-nb-toast-container', position);
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);

    _containers[position] = container;
    return container;
  }

  /* ------------------------------------------------------------------ */
  /*  Format file size (reused later, but handy here for consistency)    */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Toast creation                                                     */
  /* ------------------------------------------------------------------ */

  function toast(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }

    var message    = options.message || '';
    var type       = options.type || 'info';
    var title      = options.title || '';
    var duration   = options.duration !== undefined ? options.duration : 5000;
    var position   = options.position || 'top-right';
    var dismissible = options.dismissible !== undefined ? options.dismissible : true;

    if (POSITIONS.indexOf(position) === -1) {
      position = 'top-right';
    }

    var container = getContainer(position);

    // Build toast element
    var el = document.createElement('div');
    el.className = 'nb-toast nb-toast--' + type;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');

    var id = NB.uid('toast');
    el.id = id;

    // Inner HTML
    var html = '<div class="nb-toast__content">';
    if (title) {
      html += '<div class="nb-toast__title">' + escapeHtml(title) + '</div>';
    }
    html += '<div class="nb-toast__message">' + escapeHtml(message) + '</div>';
    html += '</div>';

    if (dismissible) {
      html += '<button class="nb-toast__close" data-nb-toast-close aria-label="Dismiss notification" type="button">&times;</button>';
    }

    if (duration > 0) {
      html += '<div class="nb-toast__progress"><div class="nb-toast__progress-bar" style="animation-duration:' + duration + 'ms"></div></div>';
    }

    el.innerHTML = html;

    // Append — bottom positions prepend so newest is at bottom
    if (position.indexOf('bottom') === 0) {
      container.appendChild(el);
    } else {
      container.appendChild(el);
    }

    // Force reflow then add active class for entrance animation
    void el.offsetHeight;
    el.classList.add('is-active');

    // Auto-remove timer
    var timer = null;

    function removeToast() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      el.classList.remove('is-active');
      el.classList.add('is-exiting');

      // Wait for exit animation
      var onEnd = function () {
        NB.off(el, 'animationend', onEnd);
        NB.off(el, 'transitionend', onEnd);
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        NB.emit(document, 'nb:toast-dismissed', { id: id, type: type });
      };

      NB.on(el, 'animationend', onEnd);
      NB.on(el, 'transitionend', onEnd);

      // Fallback removal if no animation fires
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 500);
    }

    if (duration > 0) {
      timer = setTimeout(removeToast, duration);
    }

    // Pause timer on hover
    NB.on(el, 'mouseenter', function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      var bar = NB.$('.nb-toast__progress-bar', el);
      if (bar) bar.style.animationPlayState = 'paused';
    });

    NB.on(el, 'mouseleave', function () {
      if (duration > 0 && !el.classList.contains('is-exiting')) {
        var bar = NB.$('.nb-toast__progress-bar', el);
        if (bar) bar.style.animationPlayState = 'running';
        timer = setTimeout(removeToast, duration / 2);
      }
    });

    // Close button
    if (dismissible) {
      var closeBtn = NB.$('[data-nb-toast-close]', el);
      if (closeBtn) {
        NB.on(closeBtn, 'click', function (e) {
          e.preventDefault();
          removeToast();
        });
      }
    }

    NB.emit(document, 'nb:toast-shown', { id: id, type: type, message: message });

    return el;
  }

  /* ------------------------------------------------------------------ */
  /*  Shortcut methods                                                   */
  /* ------------------------------------------------------------------ */

  toast.success = function (message, opts) {
    return toast(Object.assign({ type: 'success', message: message }, opts || {}));
  };

  toast.danger = function (message, opts) {
    return toast(Object.assign({ type: 'danger', message: message }, opts || {}));
  };

  toast.warning = function (message, opts) {
    return toast(Object.assign({ type: 'warning', message: message }, opts || {}));
  };

  toast.info = function (message, opts) {
    return toast(Object.assign({ type: 'info', message: message }, opts || {}));
  };

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  NB.register('toast', function () {
    // Toast is imperative — no per-element init needed
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.toast = toast;

})(window.NB);
