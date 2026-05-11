document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lwya-newpdp-form');
  if (!form) return;

  const variantInput = form.querySelector('[data-variant-input]');
  const qtyInput = form.querySelector('input[name="quantity"]');
  const decBtn = form.querySelector('[data-qty-dec]');
  const incBtn = form.querySelector('[data-qty-inc]');
  // Get selects from form OR from variant selector container (if blocks are separated)
  const variantSelector = document.querySelector('[data-variant-selector]');
  const selects = variantSelector
    ? Array.from(variantSelector.querySelectorAll('select[name^="options["]'))
    : Array.from(form.querySelectorAll('select[name^="options["]'));
  const rechargeEl = document.getElementById('lwya-recharge-widget');

  let variantsData = null;
  let mobileSwiper = null;

  try {
    const jsonEl = document.getElementById('lwya-product-variants');
    if (jsonEl) variantsData = JSON.parse(jsonEl.textContent.trim());
  } catch (e) {
    // ignore
  }

  const clampQty = (n) => Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1);

  if (decBtn && qtyInput) {
    decBtn.addEventListener('click', () => {
      qtyInput.value = clampQty(parseInt(qtyInput.value, 10) - 1);
    });
  }

  if (incBtn && qtyInput) {
    incBtn.addEventListener('click', () => {
      qtyInput.value = clampQty(parseInt(qtyInput.value, 10) + 1);
    });
  }

  const updateVariantImage = (variant) => {
    console.log('🖼️ updateVariantImage called with variant:', variant);

    if (!variant || !variant.featured_image) {
      console.log('⚠️ Variant has no featured_image');
      return;
    }

    const featuredImage = variant.featured_image;
    console.log('📸 Variant featured_image:', featuredImage);

    // Update desktop gallery
    const mainImg = document.querySelector('[data-main-image-1]');
    const mainLink = document.querySelector('[data-main-image-link]');
    if (mainImg) {
      const currentImageId = mainImg.getAttribute('data-image-id');
      console.log('🖼️ Current desktop image ID:', currentImageId);
      console.log('🎯 Target image ID:', featuredImage.id);

      if (String(currentImageId) !== String(featuredImage.id)) {
        console.log('🔄 Switching desktop image...');

        // Smooth fade transition
        mainImg.style.opacity = '0';

        setTimeout(() => {
          // Update with variant's featured image
          const baseUrl = featuredImage.src.split('?')[0];
          mainImg.src = baseUrl + '?width=1400';
          mainImg.srcset = `${baseUrl}?width=900 900w, ${baseUrl}?width=1200 1200w, ${baseUrl}?width=1600 1600w`;
          mainImg.setAttribute('data-image-id', featuredImage.id);
          mainImg.alt = featuredImage.alt || '';

          // Update GLightbox link href
          if (mainLink) {
            mainLink.href = baseUrl + '?width=2000';
          }

          console.log('✅ Desktop image updated to:', featuredImage.id);

          setTimeout(() => {
            mainImg.style.opacity = '1';
          }, 50);
        }, 300);
      } else {
        console.log('ℹ️ Desktop image already showing correct variant');
      }
    } else {
      console.log('❌ Main image element not found');
    }

    // Update mobile gallery (Swiper)
    if (mobileSwiper) {
      console.log('📱 Updating mobile gallery...');
      const slides = Array.from(document.querySelectorAll('[data-slide-image-id]'));
      const targetIndex = slides.findIndex(slide => String(slide.getAttribute('data-slide-image-id')) === String(featuredImage.id));

      console.log('📱 Target slide index:', targetIndex, 'Current:', mobileSwiper.activeIndex);

      if (targetIndex !== -1 && mobileSwiper.activeIndex !== targetIndex) {
        mobileSwiper.slideTo(targetIndex, 400);
        console.log('✅ Mobile gallery slid to index:', targetIndex);
      } else if (targetIndex === -1) {
        console.log('⚠️ Image not found in mobile gallery slides');
      }
    }
  };

  const updateTitle = (variant) => {
    const titleEl = document.querySelector('[data-product-title]');
    if (!titleEl) return;
    titleEl.textContent = variant.variant_title || variantsData.title;
  };

  const updateIngredientImage = (variant) => {
    const imgEl = document.querySelector('[data-ingredient-image]');
    if (!imgEl) return;

    if (variant.variant_ingredient_image) {
      imgEl.src = variant.variant_ingredient_image;
    } else {
      // Fall back to product default ingredient image
      const defaultSrc = variantsData.default_ingredient_image;
      if (defaultSrc) imgEl.src = defaultSrc;
    }
  };

  const reinitAccordion = (container, btnSelector, targetAttr) => {
    container.querySelectorAll(btnSelector).forEach(btn => {
      btn.addEventListener('click', function () {
        const body = container.querySelector('#' + btn.getAttribute(targetAttr));
        if (!body) return;
        const icon = btn.querySelector('.plus-icon');
        const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
        if (isOpen) {
          body.style.maxHeight = '0px';
          icon.style.transform = 'rotate(-90deg)';
          setTimeout(() => { icon.textContent = '+'; icon.style.transform = 'rotate(0deg)'; }, 150);
        } else {
          body.style.maxHeight = body.scrollHeight + 'px';
          icon.style.transform = 'rotate(90deg)';
          setTimeout(() => { icon.textContent = '−'; icon.style.transform = 'rotate(0deg)'; }, 150);
        }
      });
    });
  };

  const updateIngredients = (doc) => {
    const newEl = doc.querySelector('.product-ingredients');
    const curEl = document.querySelector('.product-ingredients');
    if (!newEl || !curEl) return;
    curEl.innerHTML = newEl.innerHTML;
    reinitAccordion(curEl, '.faq-btn', 'data-target');
    console.log('✅ Ingredients updated');
  };

  const updateFAQ = (doc) => {
    const newEl = doc.querySelector('.holiday-faq');
    const curEl = document.querySelector('.holiday-faq');
    if (!newEl || !curEl) return;
    curEl.innerHTML = newEl.innerHTML;
    reinitAccordion(curEl, '.faq-trigger', 'data-faq-target');
    console.log('✅ FAQ updated');
  };

  const updateVideos = (doc) => {
    const newEl = doc.querySelector('.lwya-videos-block');
    const curEl = document.querySelector('.lwya-videos-block');
    if (!newEl || !curEl) return;

    curEl.innerHTML = newEl.innerHTML;

    // Re-init Swiper
    if (typeof Swiper !== 'undefined') {
      const swiperEl = curEl.querySelector('.lwya-videos-swiper');
      const prevBtn = curEl.querySelector('.lwya-videos-prev');
      const nextBtn = curEl.querySelector('.lwya-videos-next');

      if (swiperEl) {
        const swiper = new Swiper(swiperEl, {
          slidesPerView: 3,
          spaceBetween: 12,
          navigation: {
            nextEl: nextBtn,
            prevEl: prevBtn,
          },
          breakpoints: {
            0: { slidesPerView: 1.3, spaceBetween: 12 },
            480: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 2.5, spaceBetween: 12 },
            1024: { slidesPerView: 3, spaceBetween: 12 }
          },
          on: {
            init: function () { updateVideoArrows(this, prevBtn, nextBtn); },
            slideChange: function () { updateVideoArrows(this, prevBtn, nextBtn); }
          }
        });
      }
    }

    // Re-init hover controls
    curEl.querySelectorAll('.lwya-hover-video').forEach(video => {
      video.addEventListener('mouseenter', () => video.setAttribute('controls', 'controls'));
      video.addEventListener('mouseleave', () => video.removeAttribute('controls'));
    });

    console.log('✅ Videos updated');
  };

  const updateVideoArrows = (swiper, prevBtn, nextBtn) => {
    if (prevBtn) {
      prevBtn.classList.toggle('tw-opacity-0', swiper.isBeginning);
      prevBtn.classList.toggle('tw-pointer-events-none', swiper.isBeginning);
      prevBtn.classList.toggle('tw-opacity-100', !swiper.isBeginning);
    }
    if (nextBtn) {
      nextBtn.classList.toggle('tw-opacity-0', swiper.isEnd);
      nextBtn.classList.toggle('tw-pointer-events-none', swiper.isEnd);
      nextBtn.classList.toggle('tw-opacity-100', !swiper.isEnd);
    }
  };

  const updateHighlightImages = (doc) => {
    const newEl = doc.querySelector('.highlight-images-section');
    const curEl = document.querySelector('.highlight-images-section');
    if (!newEl || !curEl) return;
    curEl.innerHTML = newEl.innerHTML;
    console.log('✅ Highlight images updated');
  };
  // ─────────────────────────────────────────────────────────────────────────────
  // GALLERY UPDATE
  // Fetches the product page for the selected variant and replaces
  // the desktop + mobile gallery HTML, then re-initializes plugins.
  // ─────────────────────────────────────────────────────────────────────────────

  const showGallerySkeleton = () => {
    ['[data-main-gallery]', '[data-mobile-gallery]'].forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.add('lwya-skeleton');
      el.style.opacity = '0.4';
      el.style.pointerEvents = 'none';
    });
  };

  const hideGallerySkeleton = () => {
    ['[data-main-gallery]', '[data-mobile-gallery]'].forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.remove('lwya-skeleton');
      el.style.opacity = '1';
      el.style.pointerEvents = '';
    });
  };

  const replaceGalleryHTML = (doc) => {
    const slots = [
      { selector: '[data-main-gallery]', label: 'Desktop gallery' },
      { selector: '[data-mobile-gallery]', label: 'Mobile gallery' }
    ];

    slots.forEach(({ selector, label }) => {
      const newEl = doc.querySelector(selector);
      const curEl = document.querySelector(selector);
      if (newEl && curEl) {
        curEl.innerHTML = newEl.innerHTML;
        console.log(`✅ ${label} updated`);
      }
    });
  };

  const reinitGLightbox = () => {
    if (typeof GLightbox === 'undefined') return;
    GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      autoplayVideos: false,
      openEffect: 'fade',
      closeEffect: 'fade',
      skin: 'clean'
    });
  };

  const reinitMobileSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    const el = document.querySelector('.newpdp-mobile-gallery');
    if (!el) return;
    mobileSwiper = new Swiper(el, {
      loop: false,
      spaceBetween: 12,
      slidesPerView: 1.3,
      centeredSlides: false,
      speed: 400,
      breakpoints: {
        480: { slidesPerView: 2, spaceBetween: 12 },
        640: { slidesPerView: 2.5, spaceBetween: 12 }
      }
    });
  };

  const updateKeyFeatures = (doc) => {
    const newKeyFeatures = doc.querySelector('.key-features');
    const curKeyFeatures = document.querySelector('.key-features');
    if (newKeyFeatures && curKeyFeatures) {
      curKeyFeatures.innerHTML = newKeyFeatures.innerHTML;
      console.log('✅ Key features updated');
    }
  };

  const updateDropdown = (doc) => {
    const newEl = doc.querySelector('.newpdp-dropdown');
    const curEl = document.querySelector('.newpdp-dropdown');
    if (newEl && curEl) {
      curEl.innerHTML = newEl.innerHTML;
      console.log('✅ Dropdown updated');
    }
  };

  const updateGallery = async (variantId) => {
    showGallerySkeleton();

    try {
      // Fetch the product page rendered for this specific variant
      const response = await fetch(`${window.location.pathname}?variant=${variantId}`);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      // Parse the returned HTML
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

      // Swap gallery HTML
      replaceGalleryHTML(doc);

      updateKeyFeatures(doc);
      updateDropdown(doc);
      updateIngredients(doc);
      updateFAQ(doc);
      updateVideos(doc);
      updateHighlightImages(doc);

      // Re-initialize plugins after DOM change
      reinitGLightbox();
      reinitMobileSwiper();

    } catch (err) {
      console.error('❌ Gallery update failed:', err);
    } finally {
      // Always hide skeleton — even if fetch failed
      hideGallerySkeleton();
    }
  };
  // const updateGallery = async (variantId) => {
  //   try {
  //     // ── Show skeleton ─────────────────────────────────────────
  //     const desktopGallery = document.querySelector('[data-main-gallery]');
  //     const mobileGallery  = document.querySelector('[data-mobile-gallery]');

  //     if (desktopGallery) {
  //       desktopGallery.style.opacity   = '0.4';
  //       desktopGallery.style.pointerEvents = 'none';
  //       desktopGallery.classList.add('lwya-skeleton');
  //     }
  //     if (mobileGallery) {
  //       mobileGallery.style.opacity    = '0.4';
  //       mobileGallery.style.pointerEvents  = 'none';
  //       mobileGallery.classList.add('lwya-skeleton');
  //     }
  //     // ─────────────────────────────────────────────────────────

  //     const response = await fetch(`${window.location.pathname}?variant=${variantId}`);
  //     if (!response.ok) return;

  //     const html   = await response.text();
  //     const parser = new DOMParser();
  //     const doc    = parser.parseFromString(html, 'text/html');

  //     // Replace desktop gallery
  //     const newDesktop     = doc.querySelector('[data-main-gallery]');
  //     const currentDesktop = document.querySelector('[data-main-gallery]');
  //     if (newDesktop && currentDesktop) {
  //       currentDesktop.innerHTML = newDesktop.innerHTML;
  //       console.log('✅ Desktop gallery updated');
  //     }

  //     // Replace mobile gallery
  //     const newMobile     = doc.querySelector('[data-mobile-gallery]');
  //     const currentMobile = document.querySelector('[data-mobile-gallery]');
  //     if (newMobile && currentMobile) {
  //       currentMobile.innerHTML = newMobile.innerHTML;
  //       console.log('✅ Mobile gallery updated');
  //     }

  //     // ── Remove skeleton ───────────────────────────────────────
  //     const updatedDesktop = document.querySelector('[data-main-gallery]');
  //     const updatedMobile  = document.querySelector('[data-mobile-gallery]');

  //     if (updatedDesktop) {
  //       updatedDesktop.classList.remove('lwya-skeleton');
  //       updatedDesktop.style.opacity      = '1';
  //       updatedDesktop.style.pointerEvents = '';
  //     }
  //     if (updatedMobile) {
  //       updatedMobile.classList.remove('lwya-skeleton');
  //       updatedMobile.style.opacity       = '1';
  //       updatedMobile.style.pointerEvents  = '';
  //     }
  //     // ─────────────────────────────────────────────────────────

  //     // Re-init GLightbox
  //     if (typeof GLightbox !== 'undefined') {
  //       GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true, autoplayVideos: false, openEffect: 'fade', closeEffect: 'fade', skin: 'clean' });
  //     }

  //     // Re-init mobile Swiper
  //     if (typeof Swiper !== 'undefined') {
  //       const mobileGalleryEl = document.querySelector('.newpdp-mobile-gallery');
  //       if (mobileGalleryEl) {
  //         mobileSwiper = new Swiper(mobileGalleryEl, {
  //           loop: false, spaceBetween: 12, slidesPerView: 1.3, centeredSlides: false, speed: 400,
  //           breakpoints: {
  //             480: { slidesPerView: 2, spaceBetween: 12 },
  //             640: { slidesPerView: 2.5, spaceBetween: 12 }
  //           }
  //         });
  //       }
  //     }

  //   } catch (err) {
  //     // Remove skeleton on error too
  //     document.querySelector('[data-main-gallery]')?.classList.remove('lwya-skeleton');
  //     document.querySelector('[data-mobile-gallery]')?.classList.remove('lwya-skeleton');
  //     console.error('❌ Gallery update failed:', err);
  //   }
  // };

  const updateVariant = async () => {
    console.log('🔄 updateVariant called');
    if (!variantsData || !variantsData.variants) {
      console.log('❌ No variants data available');
      return;
    }

    // Collect values from both select dropdowns and radio inputs by position
    const selectedOptions = [];
    const optionCount = variantsData.options ? variantsData.options.length : 0;

    console.log('📊 Option count:', optionCount);

    // Search scope: variant selector container OR form (for backward compatibility)
    const searchScope = variantSelector || form;

    for (let i = 0; i < optionCount; i++) {
      // Check radio first
      const radio = searchScope.querySelector(`input[type="radio"][data-option-position="${i + 1}"]:checked`);
      if (radio) {
        selectedOptions[i] = radio.value;
        console.log(`🔘 Option ${i + 1} (radio):`, radio.value);
        // Update label
        const label = searchScope.querySelector(`[data-selected-option-${i}]`);
        if (label) label.textContent = radio.value;
        continue;
      }

      // Then check select
      const select = searchScope.querySelector(`select[data-option-position="${i + 1}"]`);
      if (select) {
        selectedOptions[i] = select.value;
        console.log(`📋 Option ${i + 1} (select):`, select.value);
        // Update label
        const label = searchScope.querySelector(`[data-selected-option-${i}]`);
        if (label) label.textContent = select.value;
      }
    }

    console.log('✨ Selected options array:', selectedOptions);

    const match = variantsData.variants.find(v => {
      if (!Array.isArray(v.options)) return false;
      if (v.options.length !== selectedOptions.length) return false;
      for (let i = 0; i < v.options.length; i++) {
        if (String(v.options[i]) !== String(selectedOptions[i])) return false;
      }
      return true;
    });

    if (match && variantInput) {
      console.log('✅ Found matching variant:', match);
      console.log('🆔 Variant ID:', match.id);
      console.log('💰 Price:', match.price);
      console.log('📦 Available:', match.available);

      variantInput.value = match.id;

      // Update submit button state

      const submitBtn = form.querySelector('button[type="submit"]');
      const atcWrapper = form.querySelector('[data-atc-wrapper]');
      const unavailableMsg = form.querySelector('[data-unavailable-msg]');

      if (match.disabled) {
        if (atcWrapper) atcWrapper.style.display = 'none';
        if (unavailableMsg) unavailableMsg.style.display = '';
      } else {
        if (atcWrapper) atcWrapper.style.display = '';
        if (unavailableMsg) unavailableMsg.style.display = 'none';

        if (submitBtn) {
          if (match.available) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ADD TO CART';
            submitBtn.classList.remove('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
            submitBtn.classList.add('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
          } else {
            submitBtn.disabled = true;
            submitBtn.textContent = 'SOLD OUT';
            submitBtn.classList.add('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
            submitBtn.classList.remove('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
          }
        }
      }

      // const submitBtn = form.querySelector('button[type="submit"]');
      // if (submitBtn) {
      //   if (match.available && !match.disabled) {
      //     submitBtn.disabled = false;
      //     submitBtn.textContent = 'ADD TO CART';
      //     submitBtn.classList.remove('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
      //     submitBtn.classList.add('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
      //   } else {
      //     submitBtn.disabled = true;
      //     submitBtn.textContent = 'SOLD OUT';
      //     submitBtn.classList.add('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
      //     submitBtn.classList.remove('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
      //   }
      // }

      // Update Recharge widget
      if (rechargeEl) {
        try { rechargeEl.setAttribute('default-variant-id', String(match.id)); } catch (_) { }
      }

      // Update price if available
      updatePrice(match);

      // Update URL with variant parameter
      updateURL(match.id);

      // Update SEO metadata
      updateSEOMetadata(match);

      // Update main gallery image
      console.log('🚀 Calling updateVariantImage with variant object');
      updateTitle(match);
      updateIngredientImage(match);

      // Only fetch gallery if variant has images
      // const hasVariantMedia = match.variant_media && match.variant_media.length > 0;
      // const hasFeaturedImage = match.featured_image;

      await updateGallery(match.id, true);
      // if (hasVariantMedia || hasFeaturedImage) {
      // }
    } else {
      console.log('❌ No matching variant found for options:', selectedOptions);
      console.log('📋 Available variants:', variantsData.variants);
    }
  };

  const updatePrice = (variant) => {
    if (!variant || !variant.price) return;

    const priceContainer = document.querySelector('[data-product-price]');
    if (priceContainer) {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      });

      let priceHTML = formatter.format(variant.price / 100);

      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        priceHTML += `<s class="tw-text-[18px] tw-text-[#9b9b9b] tw-ml-[8px]">${formatter.format(variant.compare_at_price / 100)}</s>`;
      }

      priceContainer.innerHTML = priceHTML;
    }

    // Also update sticky price
    const stickyPriceEl = document.querySelector('[data-sticky-price]');
    if (stickyPriceEl) {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      });

      let priceHTML = '';
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        priceHTML = `<span class="tw-line-through tw-text-[#999] tw-mr-[6px]">${formatter.format(variant.compare_at_price / 100)}</span>`;
        priceHTML += `<span class="tw-text-[#d41870] tw-font-metric-medium">${formatter.format(variant.price / 100)}</span>`;
      } else {
        priceHTML = `<span class="tw-text-black">${formatter.format(variant.price / 100)}</span>`;
      }

      stickyPriceEl.innerHTML = priceHTML;
    }

    // Update sticky button state
    const stickyAtcBtn = document.querySelector('[data-sticky-atc-btn]');
    if (stickyAtcBtn) {
      if (variant.available && !variant.disabled) {
        stickyAtcBtn.disabled = false;
        stickyAtcBtn.textContent = 'Add to Cart';
        stickyAtcBtn.classList.remove('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
        stickyAtcBtn.classList.add('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
      } else {
        stickyAtcBtn.disabled = true;
        stickyAtcBtn.textContent = 'Sold Out';
        stickyAtcBtn.classList.add('tw-bg-[#9b9b9b]', 'hover:tw-bg-[#9b9b9b]');
        stickyAtcBtn.classList.remove('tw-bg-[#d41870]', 'hover:tw-bg-[#b91460]');
      }
    }
  };

  const updateURL = (variantId) => {
    if (!variantsData || !variantsData.url) return;

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variantId);

    // Update browser URL without page reload
    window.history.replaceState({ variantId: variantId }, '', url.toString());
    console.log('✅ URL updated to include variant:', variantId);
  };

  const updateSEOMetadata = (variant) => {
    if (!variant) return;

    // Update meta description if variant has unique description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && variant.sku) {
      // You can customize this based on your needs
      console.log('📝 SEO metadata ready for variant:', variant.sku);
    }

    // Update Open Graph image if variant has featured image
    if (variant.featured_image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', variant.featured_image.src);
      }

      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        twitterImage.setAttribute('content', variant.featured_image.src);
      }

      console.log('🖼️ OG/Twitter images updated');
    }
  };

  selects.forEach(s => s.addEventListener('change', updateVariant));

  // Add listeners for radio buttons (color swatches) using data-option-position
  // Search from variant selector container OR form (for backward compatibility)
  const radioInputs = variantSelector
    ? Array.from(variantSelector.querySelectorAll('input[type="radio"][data-option-position]'))
    : Array.from(form.querySelectorAll('input[type="radio"][data-option-position]'));
  radioInputs.forEach(r => r.addEventListener('change', updateVariant));

  // Handle form submission - ensure variant options from separated block are included
  form.addEventListener('submit', function (e) {
    if (variantSelector) {
      // Get all option inputs from variant selector
      const optionInputs = variantSelector.querySelectorAll('input[type="radio"]:checked, select[name^="options["]');
      optionInputs.forEach(input => {
        // Check if this input is already in the form
        const existingInput = form.querySelector(`[name="${input.name}"][value="${input.value}"]`);
        if (!existingInput) {
          // Create hidden input in form with the selected value
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = input.name;
          hiddenInput.value = input.value;
          form.appendChild(hiddenInput);
        }
      });
    }
  });

  // Tabs: Pair it with / Save with sets
  const tabsRoot = document.getElementById('lwya-pair-tabs');
  const panelsRoot = document.getElementById('lwya-pair-content');
  if (tabsRoot && panelsRoot) {
    const tabButtons = Array.from(tabsRoot.querySelectorAll('[data-tab]'));
    const panels = Array.from(panelsRoot.querySelectorAll('[data-panel]'));
    const indicator = tabsRoot.querySelector('.lwya-tab-indicator');

    const activate = (name) => {
      tabButtons.forEach(b => {
        const active = b.getAttribute('data-tab') === name;
        // Update text color
        if (active) {
          b.classList.remove('tw-text-[#9b9b9b]');
          b.classList.add('tw-text-[#000000]');
        } else {
          b.classList.remove('tw-text-[#000000]');
          b.classList.add('tw-text-[#9b9b9b]');
        }
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      // Update indicator position and width to match active tab button
      if (indicator) {
        const activeButton = tabButtons.find(b => b.getAttribute('data-tab') === name);
        if (activeButton) {
          const tabsContainer = tabsRoot;
          const buttonRect = activeButton.getBoundingClientRect();
          const containerRect = tabsContainer.getBoundingClientRect();
          const leftOffset = buttonRect.left - containerRect.left;
          const buttonWidth = buttonRect.width;

          indicator.style.width = buttonWidth + 'px';
          indicator.style.left = leftOffset + 'px';
        } else {
          indicator.style.width = '0';
        }
      }

      panels.forEach(p => {
        const show = p.getAttribute('data-panel') === name;
        p.classList.toggle('tw-hidden', !show);
        p.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    };
    tabButtons.forEach(b => b.addEventListener('click', () => activate(b.getAttribute('data-tab'))));
    // ensure initial state reflects markup defaults
    const initialBtn = tabButtons.filter(b => b.getAttribute('aria-selected') === 'true')[0] || tabButtons[0];
    const initial = initialBtn?.getAttribute('data-tab');
    if (initial) activate(initial);
  }

  // Mobile gallery Swiper
  if (typeof Swiper !== 'undefined') {
    const mobileGallery = document.querySelector('.newpdp-mobile-gallery');
    if (mobileGallery) {
      mobileSwiper = new Swiper(mobileGallery, {
        loop: false,
        spaceBetween: 12,
        slidesPerView: 1.3,
        centeredSlides: false,
        speed: 400,
        breakpoints: {
          480: {
            slidesPerView: 2,
            spaceBetween: 12
          },
          640: {
            slidesPerView: 2.5,
            spaceBetween: 12
          }
        }
      });
    }
  }

  // GLightbox for image zoom with black background
  const initGLightbox = () => {
    if (typeof GLightbox !== 'undefined') {
      const lightbox = GLightbox({
        selector: '.glightbox',
        touchNavigation: true,
        loop: true,
        autoplayVideos: false,
        openEffect: 'fade',
        closeEffect: 'fade',
        skin: 'clean',
        cssEfects: {
          fade: { in: 'fadeIn', out: 'fadeOut' }
        }
      });

      console.log('✅ GLightbox initialized with black background');
    } else {
      console.warn('⚠️ GLightbox not loaded');
    }
  };

  // Initialize GLightbox after a short delay
  setTimeout(initGLightbox, 200);

  // ===== Sticky Add to Cart Bar =====
  const stickyBar = document.getElementById('sticky-atc');
  if (stickyBar) {
    const mainForm = document.getElementById('lwya-newpdp-form');
    const mainQtyInput = mainForm ? mainForm.querySelector('input[name="quantity"]') : null;
    const stickyQtyInput = stickyBar.querySelector('[data-sticky-qty-input]');
    const stickyDecBtn = stickyBar.querySelector('[data-sticky-qty-dec]');
    const stickyIncBtn = stickyBar.querySelector('[data-sticky-qty-inc]');
    const stickyAtcBtn = stickyBar.querySelector('[data-sticky-atc-btn]');
    const stickyPriceEl = stickyBar.querySelector('[data-sticky-price]');

    let lastScrollY = window.scrollY;
    let ticking = false;

    // Show/hide sticky bar based on scroll position
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const mainFormRect = mainForm ? mainForm.getBoundingClientRect() : null;

      // Show sticky bar when main form is scrolled out of view (above viewport)
      if (mainFormRect && mainFormRect.bottom < 0 && currentScrollY > 200) {
        stickyBar.style.transform = 'translateY(0)';
      } else {
        stickyBar.style.transform = 'translateY(100%)';
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestScrollTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestScrollTick, { passive: true });

    // Sync quantity between main form and sticky bar
    if (mainQtyInput && stickyQtyInput) {
      // Update sticky when main changes
      const syncToSticky = () => {
        stickyQtyInput.value = mainQtyInput.value;
      };

      mainQtyInput.addEventListener('input', syncToSticky);
      mainQtyInput.addEventListener('change', syncToSticky);

      // Sticky quantity controls
      if (stickyDecBtn) {
        stickyDecBtn.addEventListener('click', () => {
          const newVal = Math.max(1, parseInt(stickyQtyInput.value, 10) - 1);
          stickyQtyInput.value = newVal;
          mainQtyInput.value = newVal;
        });
      }

      if (stickyIncBtn) {
        stickyIncBtn.addEventListener('click', () => {
          const newVal = parseInt(stickyQtyInput.value, 10) + 1;
          stickyQtyInput.value = newVal;
          mainQtyInput.value = newVal;
        });
      }
    }

    // Sticky add to cart button - trigger main form submission
    if (stickyAtcBtn && mainForm) {
      stickyAtcBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Sync quantity one more time before submit
        if (mainQtyInput && stickyQtyInput) {
          mainQtyInput.value = stickyQtyInput.value;
        }

        // Trigger main form submit
        mainForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        // If not prevented, submit the form
        if (!e.defaultPrevented) {
          mainForm.submit();
        }
      });
    }
  }
});
