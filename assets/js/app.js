/* Shared site chrome: theme, nav highlighting, sidebar scrollspy, docs search. */
(function () {
  'use strict';

  /* ---- theme ---- */
  var KEY = 'ccarf-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  window.toggleTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem(KEY, cur); } catch (e) {}
    syncThemeBtn();
  };

  function syncThemeBtn() {
    var b = document.getElementById('themeBtn');
    if (b) b.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀' : '☾';
  }

  /* ---- storage helper ---- */
  window.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('ccarf-' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('ccarf-' + k, JSON.stringify(v)); } catch (e) {}
    },
    del: function (k) { try { localStorage.removeItem('ccarf-' + k); } catch (e) {} }
  };

  document.addEventListener('DOMContentLoaded', function () {
    syncThemeBtn();

    /* active top nav */
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === '') page = 'index.html';
    document.querySelectorAll('.nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href === page) a.classList.add('active');
    });

    /* sidebar scrollspy */
    var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar a[href^="#"]'));
    if (links.length) {
      var targets = links.map(function (a) {
        return document.getElementById(a.getAttribute('href').slice(1));
      });
      var spy = function () {
        var best = 0, y = window.scrollY + 120;
        targets.forEach(function (t, i) { if (t && t.offsetTop <= y) best = i; });
        links.forEach(function (a, i) { a.classList.toggle('active', i === best); });
      };
      window.addEventListener('scroll', spy, { passive: true });
      spy();
    }

    /* docs search: filter sidebar links + sections */
    var sb = document.getElementById('docSearch');
    if (sb) {
      sb.addEventListener('input', function () {
        var q = sb.value.trim().toLowerCase();
        document.querySelectorAll('[data-searchable]').forEach(function (sec) {
          var hit = !q || sec.textContent.toLowerCase().indexOf(q) !== -1;
          sec.classList.toggle('hide', !hit);
          if (q && hit) sec.querySelectorAll('details.qa').forEach(function (d) {
            if (d.textContent.toLowerCase().indexOf(q) !== -1) d.open = true;
          });
        });
      });
    }

    /* expand/collapse all Q&A */
    var xa = document.getElementById('expandAll');
    if (xa) xa.addEventListener('click', function () {
      var any = !!document.querySelector('details.qa:not([open])');
      document.querySelectorAll('details.qa').forEach(function (d) { d.open = any; });
      xa.textContent = any ? 'Collapse all Q&A' : 'Expand all Q&A';
    });
  });
})();
