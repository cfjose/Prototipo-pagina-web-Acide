import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initNav } from "./animations/nav.js";
import { initSmoothScroll } from "./animations/smooth-scroll.js";
import { initScrollReveal } from "./animations/scroll-reveal.js";
import { initLazyMedia } from "./utils/lazy-load.js";

document.documentElement.classList.remove("no-js");

gsap.registerPlugin(ScrollTrigger);

initSmoothScroll();
initScrollReveal();
initNav();
initLazyMedia();
