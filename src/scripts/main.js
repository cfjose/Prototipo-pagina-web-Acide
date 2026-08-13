import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMobileNav } from "./animations/mobile-nav.js";
import { initSmoothScroll } from "./animations/smooth-scroll.js";
import { initScrollReveal } from "./animations/scroll-reveal.js";
import { initHeroIntro } from "./animations/hero-intro.js";
import { initHeroGallery } from "./animations/hero-gallery.js";
import { initTextReveal } from "./animations/text-reveal.js";
import { initServicesAccordion } from "./animations/services-accordion.js";
import { initServicesShowcase } from "./animations/services-showcase.js";
import { initServicesGallery } from "./animations/services-gallery.js";
import { initResultsCarousel } from "./animations/results-carousel.js";
import { initTestimonialCarousel } from "./animations/testimonial-carousel.js";
import { initClientStories } from "./animations/client-stories.js";
import { initContactForm } from "./animations/contact-form.js";
import { initLazyMedia } from "./utils/lazy-load.js";

document.documentElement.classList.remove("no-js");

gsap.registerPlugin(ScrollTrigger);

initSmoothScroll();
initScrollReveal();
initMobileNav();
initHeroIntro();
initHeroGallery();
initTextReveal();
initServicesAccordion();
initServicesShowcase();
initServicesGallery();
initResultsCarousel();
initTestimonialCarousel();
initClientStories();
initContactForm();
initLazyMedia();
