# Videos Block Lazy Load Optimization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all eager resource loading in `snippets/newpdp-videos.liquid` so video assets and Swiper are never touched until the user scrolls the block into view.

**Architecture:** Replace `preload="metadata"` + `autoplay` + `DOMContentLoaded` Swiper init with a single `IntersectionObserver` that (a) populates `data-src → src` on all `<source>` tags, (b) calls `video.load()` + `video.play()`, and (c) initializes Swiper — all only when the `.lwya-videos-block` is 200 px from the viewport. Remove two large debug `<script>` blocks that execute unconditionally on every page load.

**Tech Stack:** Liquid (Shopify), vanilla JS (`IntersectionObserver`), Swiper (already loaded globally via `theme.liquid`)

---

## Files

- Modify: `snippets/newpdp-videos.liquid`

---

### Task 1: Remove debug console.log blocks

These two `<script>` blocks (lines 22–72) and the empty-state debug block (lines 225–229) execute on every PDP page load and have no production value. They add parse + execution cost to every visit.

**Files:**
- Modify: `snippets/newpdp-videos.liquid`

- [ ] **Step 1: Open the file and locate the three debug blocks**

  Block A — lines 22–38: variant video debug  
  Block B — lines 40–72: full video debug  
  Block C — lines 225–229: empty-state debug (inside the `{% else %}` branch)

- [ ] **Step 2: Delete Block A (lines 22–38)**

  Remove this entire block:
  ```html
  <script>
    console.log('🎬 Variant Videos Debug:');
    console.log('using_variant_videos:', {{ using_variant_videos | json }});
    {% if variant_videos != blank %}
      console.log('variant_videos size:', {{ variant_videos.size }});
      {% for v in variant_videos %}
        console.log('variant video {{ forloop.index }}:', {
          id: '{{ v.id }}',
          url: '{{ v | file_url }}',
          media_type: '{{ v.media_type }}',
          content_type: '{{ v.content_type }}'
        });
      {% endfor %}
    {% else %}
      console.log('variant_videos is blank');
    {% endif %}
  </script>
  ```

- [ ] **Step 3: Delete Block B (lines 40–72)**

  Remove this entire block:
  ```html
  <script>
    console.log('🎬 Videos Debug Info:');
    ...
  </script>
  ```

- [ ] **Step 4: Delete Block C (the empty-state else branch, lines 225–229)**

  Change:
  ```liquid
  {% else %}
    <script>
      console.log('❌ Videos block hidden - no videos found');
      console.log('videos_value:', {{ videos_value | json }});
    </script>
  {% endif %}
  ```

  To:
  ```liquid
  {% endif %}
  ```

- [ ] **Step 5: Verify — push to dev theme and open any PDP in DevTools console**

  Expected: no `🎬` or `❌` console output.  
  Command: `shopify theme dev --store=<store>.myshopify.com`

- [ ] **Step 6: Commit**

  ```bash
  git add snippets/newpdp-videos.liquid
  git commit -m "perf: remove debug console.log blocks from videos snippet"
  ```

---

### Task 2: Disable eager video resource loading

`preload="metadata"` causes the browser to send a network request for every video on page load — even for videos that are never scrolled into view. `autoplay` in HTML can also trigger early buffering. Both must go.

**Files:**
- Modify: `snippets/newpdp-videos.liquid`

- [ ] **Step 1: Change `preload` attribute and remove `autoplay` from HTML, change `src` to `data-src` on sources**

  Find the `<video>` element (currently around line 87 after Task 1 edits):
  ```html
  <video
    preload="metadata"
    class="tw-w-full tw-h-full tw-object-cover lwya-hover-video"
    playsinline
    autoplay
    loop
    muted
    controls
  >
    {% for source in v.sources %}
      <source src="{{ source.url }}" type="{{ source.mime_type }}">
    {% endfor %}
    Your browser does not support the video tag.
  </video>
  ```

  Replace with:
  ```html
  <video
    preload="none"
    class="tw-w-full tw-h-full tw-object-cover lwya-hover-video"
    playsinline
    loop
    muted
    controls
  >
    {% for source in v.sources %}
      <source data-src="{{ source.url }}" type="{{ source.mime_type }}">
    {% endfor %}
    Your browser does not support the video tag.
  </video>
  ```

  Changes made:
  - `preload="metadata"` → `preload="none"` (no network request until JS explicitly calls `video.load()`)
  - Removed `autoplay` attribute (JS will call `video.play()` after sources are set)
  - `src="{{ source.url }}"` → `data-src="{{ source.url }}"` (sources not parsed by browser until JS moves them)

- [ ] **Step 2: Verify no video requests on page load**

  Open a PDP in Chrome DevTools → Network tab → filter `Media`.  
  Expected: zero media requests on initial load before scrolling.

- [ ] **Step 3: Commit**

  ```bash
  git add snippets/newpdp-videos.liquid
  git commit -m "perf: defer video sources with data-src and preload=none"
  ```

---

### Task 3: Replace DOMContentLoaded init with IntersectionObserver

The Swiper init and all video activation happens on `DOMContentLoaded` — which fires before the user has scrolled at all. Replace with a single `IntersectionObserver` with `rootMargin: '200px'` so everything initializes just before the block scrolls into view.

**Files:**
- Modify: `snippets/newpdp-videos.liquid`

- [ ] **Step 1: Replace the entire `<script>` block (after `{% endif %}` of videos list, before `{% else %}`) with the following**

  Remove the existing:
  ```javascript
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof Swiper === 'undefined') return;
      // ... all of it ...
    });
  </script>
  ```

  Replace with:
  ```html
  <script>
    (function () {
      var block = document.querySelector('.lwya-videos-block');
      if (!block) return;

      var initialized = false;

      // Trigger 200px before the block enters the viewport
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

        // 2. Initialize Swiper
        if (typeof Swiper === 'undefined') return;

        var prevButton = block.querySelector('.lwya-videos-prev');
        var nextButton = block.querySelector('.lwya-videos-next');

        var videosSwiper = new Swiper(block.querySelector('.lwya-videos-swiper'), {
          slidesPerView: 3,
          spaceBetween: 12,
          navigation: {
            nextEl: nextButton,
            prevEl: prevButton,
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

      // Desktop: click video → fullscreen + unmute
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

- [ ] **Step 2: Verify lazy init fires correctly**

  Open a PDP with videos. In DevTools:
  - On initial load → Network/Media: zero video requests, Swiper NOT initialized
  - Scroll toward the videos block (stop ~300px above it) → video network requests fire, Swiper initializes
  - Videos play in their cards
  - Clicking a video on desktop opens fullscreen + unmutes; exiting fullscreen re-mutes

- [ ] **Step 3: Verify variant switching still works**

  Switch a variant (if the product has variant videos). The `newpdp.js` re-renders the variant section; the fullscreen click handler uses document-level delegation so it survives the re-render without re-attaching.

- [ ] **Step 4: Commit**

  ```bash
  git add snippets/newpdp-videos.liquid
  git commit -m "perf: lazy-init videos block and Swiper with IntersectionObserver"
  ```

---

## Summary of Wins

| Change | Impact |
|--------|--------|
| Remove debug `<script>` blocks | Eliminates ~50 lines of JS parse + execution per page load |
| `preload="none"` + `data-src` | Zero video network requests until near-scroll |
| `autoplay` removed from HTML | Browser can't start buffering early |
| `DOMContentLoaded` → `IntersectionObserver` | Swiper not constructed until needed (~30ms JS execution saved on load) |
| Single `initialized` flag | Observer fires exactly once even if user scrolls rapidly |

**IntersectionObserver browser support:** All modern browsers; 97%+ global coverage. No polyfill needed.
