# Videos Block — IntersectionObserver Fix (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken IntersectionObserver script in `snippets/newpdp-videos.liquid` with a corrected version that preserves Swiper's original config exactly.

**Architecture:** The previous plan introduced two bugs — navigation DOM element refs instead of string selectors broke Swiper's nav module, causing single-slide layout. The fix restores string selectors for `nextEl`/`prevEl` and queries them fresh inside `updateArrows`, while keeping the `data-src` lazy source population and IntersectionObserver wrapper intact.

**Tech Stack:** Liquid (Shopify), vanilla JS (`IntersectionObserver`), Swiper (string selector navigation, required by Swiper's nav module)

**No commits** — leave all changes in the working tree.

---

## Files

- Modify: `snippets/newpdp-videos.liquid`

---

### Task 1: Replace the broken `<script>` block with the corrected IntersectionObserver script

The current script (lines 70–186 in the working tree) has two bugs:

- `nextEl: nextButton` and `prevEl: prevButton` — DOM element refs passed to Swiper navigation. Swiper's nav module requires string CSS selectors; DOM element refs cause the nav to fail and Swiper to miscompute slide layout (shows 1 slide instead of 3).
- `var prevButton = block.querySelector(...)` / `var nextButton = block.querySelector(...)` declared before Swiper init and passed in — these must be removed from the navigation config.

**Files:**
- Modify: `snippets/newpdp-videos.liquid`

- [ ] **Step 1: Locate the `<script>` block**

  Find lines starting at:
  ```html
  <script>
    (function () {
      var block = document.querySelector('.lwya-videos-block');
  ```

  This block runs from `<script>` (currently line 70) through `</script>` (currently line 186).

- [ ] **Step 2: Replace the entire `<script>…</script>` block with the corrected version below**

  Remove the entire existing `<script>` block and replace it with:

  ```html
  <script>
    (function () {
      var block = document.querySelector('.lwya-videos-block');
      if (!block) return;

      var initialized = false;

      var observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || initialized) return;
        initialized = true;
        observer.disconnect();

        // 1. Populate video sources and start playback
        block.querySelectorAll('video').forEach(function (video) {
          video.querySelectorAll('source[data-src]').forEach(function (src) {
            src.src = src.dataset.src;
          });
          video.load();
          video.play().catch(function () {});
        });

        // 2. Initialize Swiper — string selectors required by Swiper nav module
        if (typeof Swiper === 'undefined') return;

        var videosSwiper = new Swiper('.lwya-videos-swiper', {
          slidesPerView: 3,
          spaceBetween: 12,
          navigation: {
            nextEl: '.lwya-videos-next',
            prevEl: '.lwya-videos-prev',
          },
          breakpoints: {
            0: { slidesPerView: 1.3, spaceBetween: 12 },
            480: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 2.5, spaceBetween: 12 },
            1024: { slidesPerView: 3, spaceBetween: 12 },
          },
          on: {
            init: function () { updateArrows(this); },
            slideChange: function () { updateArrows(this); },
            reachBeginning: function () { updateArrows(this); },
            reachEnd: function () { updateArrows(this); },
          },
        });

        function updateArrows(swiper) {
          var prevButton = block.querySelector('.lwya-videos-prev');
          var nextButton = block.querySelector('.lwya-videos-next');
          if (prevButton) {
            prevButton.classList.toggle('tw-opacity-0', swiper.isBeginning);
            prevButton.classList.toggle('tw-pointer-events-none', swiper.isBeginning);
            prevButton.classList.toggle('tw-opacity-100', !swiper.isBeginning);
          }
          if (nextButton) {
            nextButton.classList.toggle('tw-opacity-0', swiper.isEnd);
            nextButton.classList.toggle('tw-pointer-events-none', swiper.isEnd);
            nextButton.classList.toggle('tw-opacity-100', !swiper.isEnd);
          }
        }
      }, { rootMargin: '200px' });

      observer.observe(block);

      // Desktop: click video → native fullscreen + unmute; exit fullscreen → mute again
      // Document-level delegation survives variant-switch DOM re-renders
      document.addEventListener('click', function (e) {
        if (window.innerWidth < 768) return;
        var item = e.target.closest('.lwya-video-item');
        if (!item) return;

        var video = item.querySelector('video');
        if (!video) return;

        var isFullscreen =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;
        if (isFullscreen) return;

        video.muted = false;
        video.volume = 1;

        var req =
          video.requestFullscreen ||
          video.webkitRequestFullscreen ||
          video.mozRequestFullScreen ||
          video.msRequestFullscreen;
        if (req) {
          var p = req.call(video);
          if (p && p.then) p.then(function () { video.play(); }).catch(function () {});
          else video.play();
        }

        function onExit() {
          var fs =
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;
          if (!fs) {
            video.muted = true;
            document.removeEventListener('fullscreenchange', onExit);
            document.removeEventListener('webkitfullscreenchange', onExit);
            document.removeEventListener('mozfullscreenchange', onExit);
            document.removeEventListener('MSFullscreenChange', onExit);
          }
        }
        document.addEventListener('fullscreenchange', onExit);
        document.addEventListener('webkitfullscreenchange', onExit);
        document.addEventListener('mozfullscreenchange', onExit);
        document.addEventListener('MSFullscreenChange', onExit);
      });
    })();
  </script>
  ```

  **What changed vs the broken version:**
  - `new Swiper('.lwya-videos-swiper', ...)` — string selector (was `block.querySelector(...)`)
  - `nextEl: '.lwya-videos-next'` — string selector (was `nextButton` DOM ref)
  - `prevEl: '.lwya-videos-prev'` — string selector (was `prevButton` DOM ref)
  - `var prevButton` / `var nextButton` moved inside `updateArrows()` — queried fresh per call, not hoisted before Swiper init
  - Everything else (breakpoints, `on` handlers, source population, fullscreen handler) is identical

- [ ] **Step 3: Verify the file looks correct**

  Confirm `snippets/newpdp-videos.liquid`:
  - `<video preload="none" ...>` with `<source data-src="...">` tags (from previous fix, untouched)
  - `new Swiper('.lwya-videos-swiper', ...)` uses a string selector
  - `nextEl: '.lwya-videos-next'` and `prevEl: '.lwya-videos-prev'` are strings
  - No `var prevButton = block.querySelector(...)` outside `updateArrows`

- [ ] **Step 4: Push to dev theme and verify in browser**

  ```bash
  shopify theme push --store=<store>.myshopify.com
  ```

  Open a PDP with videos in Chrome DevTools:

  **Network / Media tab (initial load):**
  - Zero media requests before scrolling — confirms `data-src` is working

  **Scroll toward videos block:**
  - Video network requests fire when block is ~200px from viewport
  - Swiper initializes: **3 videos visible** on desktop (≥1024px), 1.3 on mobile
  - Prev arrow hidden (opacity-0), Next arrow visible — matches original behavior

  **Click Next arrow:**
  - Carousel advances, prev arrow becomes visible — confirms nav working

  **Click a video (desktop):**
  - Opens native fullscreen, unmutes
  - Exit fullscreen → video returns to muted inline playback
