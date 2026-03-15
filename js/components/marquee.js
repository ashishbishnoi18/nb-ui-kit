/**
 * NB Marquee — Auto-clone track children for seamless looping
 * Users don't need to duplicate HTML; this script handles it.
 */
;(function () {
  'use strict';

  if (typeof NB !== 'undefined' && NB.register) {
    NB.register('marquee', initMarquee);
  }

  function initMarquee(el) {
    var track = el.querySelector('.nb-marquee__track');
    if (!track || track.dataset.nbCloned) return;

    // Clone all children for seamless loop
    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.dataset.nbCloned = 'true';
  }

  // Auto-init on DOM ready
  function initAll() {
    var marquees = document.querySelectorAll('[data-nb-marquee]');
    marquees.forEach(initMarquee);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
