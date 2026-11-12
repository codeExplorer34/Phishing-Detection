/**
 * Scripts that run in <head> before the page paints. They live in a plain module, not a "use client" file:
 * a server component that imports a string from a client file gets a client reference instead of the string.
 */

export const INTRO_KEY = "fishy.intro.v1";

/** The intro shows once per browser session, never for visitors who prefer reduced motion. If storage is blocked it simply shows each time. */
export const INTRO_SCRIPT =
  `try{var d=document.documentElement;` +
  `if(sessionStorage.getItem("${INTRO_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="seen"}` +
  `else{sessionStorage.setItem("${INTRO_KEY}","1")}}catch(e){}`;
