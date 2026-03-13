/**
 * NB Tooltip Component
 * Dynamic tooltips with configurable positioning and keyboard support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var SHOW_DELAY = 200;
  var GAP = 8; // px gap between element and tooltip

  NB.register('tooltip', function (el) {
    var text = el.getAttribute('data-nb-tooltip');
    if (!text) return;

    var position = el.getAttribute('data-nb-tooltip-position') || 'top';
    var tooltipEl = null;
    var showTimer = null;

    // Ensure the trigger is focusable
    if (!el.getAttribute('tabindex') && el.tagName !== 'BUTTON' &&
        el.tagName !== 'A' && el.tagName !== 'INPUT') {
      el.setAttribute('tabindex', '0');
    }

    // ARIA
    var tooltipId = NB.uid('tooltip');
    el.setAttribute('aria-describedby', tooltipId);

    /* ---------------------------------------------------------------- */
    /*  Create / Destroy tooltip element                                 */
    /* ---------------------------------------------------------------- */

    function createTooltip() {
      tooltipEl = document.createElement('div');
      tooltipEl.id = tooltipId;
      tooltipEl.className = 'nb-tooltip nb-tooltip--' + position;
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.textContent = text;
      document.body.appendChild(tooltipEl);
    }

    function positionTooltip() {
      if (!tooltipEl) return;

      var rect = el.getBoundingClientRect();
      var tipRect = tooltipEl.getBoundingClientRect();
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      var top, left;

      switch (position) {
        case 'bottom':
          top = rect.bottom + GAP + scrollY;
          left = rect.left + (rect.width - tipRect.width) / 2 + scrollX;
          break;
        case 'left':
          top = rect.top + (rect.height - tipRect.height) / 2 + scrollY;
          left = rect.left - tipRect.width - GAP + scrollX;
          break;
        case 'right':
          top = rect.top + (rect.height - tipRect.height) / 2 + scrollY;
          left = rect.right + GAP + scrollX;
          break;
        case 'top':
        default:
          top = rect.top - tipRect.height - GAP + scrollY;
          left = rect.left + (rect.width - tipRect.width) / 2 + scrollX;
          break;
      }

      // Clamp to viewport
      var viewWidth = document.documentElement.clientWidth;
      if (left < scrollX + 4) left = scrollX + 4;
      if (left + tipRect.width > scrollX + viewWidth - 4) {
        left = scrollX + viewWidth - tipRect.width - 4;
      }
      if (top < scrollY + 4) {
        // Flip to bottom
        top = rect.bottom + GAP + scrollY;
      }

      tooltipEl.style.position = 'absolute';
      tooltipEl.style.top = top + 'px';
      tooltipEl.style.left = left + 'px';
    }

    function show() {
      if (tooltipEl) return;
      showTimer = setTimeout(function () {
        createTooltip();
        // Allow reflow before positioning and animating
        void tooltipEl.offsetHeight;
        positionTooltip();
        tooltipEl.classList.add('is-active');
      }, SHOW_DELAY);
    }

    function hide() {
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      if (!tooltipEl) return;
      tooltipEl.classList.remove('is-active');

      var tip = tooltipEl;
      tooltipEl = null;

      // Remove after transition
      var onEnd = function () {
        NB.off(tip, 'transitionend', onEnd);
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      };
      NB.on(tip, 'transitionend', onEnd);

      // Fallback removal
      setTimeout(function () {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 300);
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'mouseenter', show);
    NB.on(el, 'mouseleave', hide);
    NB.on(el, 'focus', show);
    NB.on(el, 'blur', hide);

    // Escape hides tooltip
    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Escape') {
        hide();
      }
    });

    // Update text if attribute changes (MutationObserver)
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'data-nb-tooltip') {
            text = el.getAttribute('data-nb-tooltip') || '';
            if (tooltipEl) tooltipEl.textContent = text;
          }
          if (mutations[i].attributeName === 'data-nb-tooltip-position') {
            position = el.getAttribute('data-nb-tooltip-position') || 'top';
          }
        }
      });
      observer.observe(el, { attributes: true });
    }
  });

})(window.NB);
