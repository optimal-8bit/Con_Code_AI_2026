/**
 * IntroPage.jsx
 * Single-file landing page.
 * Includes FloatingLines (WebGL) + SplitText (GSAP) inline.
 *
 * Dependencies:
 *   npm install three gsap @gsap/react
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

/* ─────────────────────────────────────────────────────────────
   GLSL shaders (verbatim from original FloatingLines source)
───────────────────────────────────────────────────────────── */

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }
  vec3 gradientColor;
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);
    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    gradientColor = mix(c1, c2, f);
  }
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;
  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }
  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi, baseUv, mouseUv, interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

const MAX_GRADIENT_STOPS = 8;

function hexToVec3(hex) {
  let v = hex.trim().replace('#', '');
  let r = 255, g = 255, b = 255;
  if (v.length === 3) {
    r = parseInt(v[0] + v[0], 16);
    g = parseInt(v[1] + v[1], 16);
    b = parseInt(v[2] + v[2], 16);
  } else if (v.length === 6) {
    r = parseInt(v.slice(0, 2), 16);
    g = parseInt(v.slice(2, 4), 16);
    b = parseInt(v.slice(4, 6), 16);
  }
  return new Vector3(r / 255, g / 255, b / 255);
}

/* ─────────────────────────────────────────────────────────────
   FloatingLines
   Key responsive fix: the canvas is appended to document.body
   and positioned fixed so it always covers the full viewport
   regardless of parent DOM structure. ResizeObserver +
   window resize both call setSize().
───────────────────────────────────────────────────────────── */

function FloatingLines({
  linesGradient,
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = 'screen',
}) {
  const mountRef = useRef(null); // invisible anchor div

  const targetMouseRef = useRef(new Vector2(-1000, -1000));
  const currentMouseRef = useRef(new Vector2(-1000, -1000));
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef(new Vector2(0, 0));
  const currentParallaxRef = useRef(new Vector2(0, 0));

  const getLineCount = (wt) => {
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(wt)) return 0;
    return lineCount[enabledWaves.indexOf(wt)] ?? 6;
  };
  const getLineDist = (wt) => {
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(wt)) return 0.1;
    return lineDistance[enabledWaves.indexOf(wt)] ?? 0.1;
  };

  const topLC = enabledWaves.includes('top') ? getLineCount('top') : 0;
  const midLC = enabledWaves.includes('middle') ? getLineCount('middle') : 0;
  const botLC = enabledWaves.includes('bottom') ? getLineCount('bottom') : 0;
  const topLD = enabledWaves.includes('top') ? getLineDist('top') * 0.01 : 0.01;
  const midLD = enabledWaves.includes('middle') ? getLineDist('middle') * 0.01 : 0.01;
  const botLD = enabledWaves.includes('bottom') ? getLineDist('bottom') * 0.01 : 0.01;

  useEffect(() => {
    let active = true;

    /* ── Three.js setup ── */
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    const canvas = renderer.domElement;

    /*
     * RESPONSIVE FIX:
     * Attach canvas directly to <body> with position:fixed so it truly
     * covers 100vw × 100vh at all times — no parent height issues.
     */
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      display: 'block',
      zIndex: '0',
      mixBlendMode,
      pointerEvents: interactive ? 'auto' : 'none',
    });
    document.body.appendChild(canvas);

    /* ── Uniforms ── */
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },

      enableTop: { value: enabledWaves.includes('top') },
      enableMiddle: { value: enabledWaves.includes('middle') },
      enableBottom: { value: enabledWaves.includes('bottom') },

      topLineCount: { value: topLC },
      middleLineCount: { value: midLC },
      bottomLineCount: { value: botLC },

      topLineDistance: { value: topLD },
      middleLineDistance: { value: midLD },
      bottomLineDistance: { value: botLD },

      topWavePosition: {
        value: new Vector3(
          topWavePosition?.x ?? 10.0,
          topWavePosition?.y ?? 0.5,
          topWavePosition?.rotate ?? -0.4,
        ),
      },
      middleWavePosition: {
        value: new Vector3(
          middleWavePosition?.x ?? 5.0,
          middleWavePosition?.y ?? 0.0,
          middleWavePosition?.rotate ?? 0.2,
        ),
      },
      bottomWavePosition: {
        value: new Vector3(
          bottomWavePosition?.x ?? 2.0,
          bottomWavePosition?.y ?? -0.7,
          bottomWavePosition?.rotate ?? 0.4,
        ),
      },

      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },

      parallax: { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new Vector2(0, 0) },

      lineGradient: {
        value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new Vector3(1, 1, 1)),
      },
      lineGradientCount: { value: 0 },
    };

    if (linesGradient?.length > 0) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, i) => {
        const c = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(c.x, c.y, c.z);
      });
    }

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const clock = new Clock();

    /* ── Resize: always use window dimensions ── */
    const setSize = () => {
      if (!active) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false); // false = don't touch CSS (we use 100vw/100vh)

      uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
    };

    setSize();
    window.addEventListener('resize', setSize);

    /* Also watch orientation change for mobile */
    window.addEventListener('orientationchange', () => {
      setTimeout(setSize, 100); // slight delay so browser finishes layout
    });

    /* ── Mouse / pointer interaction ── */
    const onPointerMove = (e) => {
      const dpr = renderer.getPixelRatio();
      const x = e.clientX;
      const y = e.clientY;
      targetMouseRef.current.set(x * dpr, (window.innerHeight - y) * dpr);
      targetInfluenceRef.current = 1.0;
      if (parallax) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        targetParallaxRef.current.set(
          ((x - cx) / window.innerWidth) * parallaxStrength,
          -((y - cy) / window.innerHeight) * parallaxStrength,
        );
      }
    };
    const onPointerLeave = () => { targetInfluenceRef.current = 0.0; };

    if (interactive) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerleave', onPointerLeave);
    }

    /* ── Render loop ── */
    let raf = 0;
    const loop = () => {
      if (!active) return;
      uniforms.iTime.value = clock.getElapsedTime();

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);
        uniforms.iMouse.value.copy(currentMouseRef.current);
        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping;
        uniforms.bendInfluence.value = currentInfluenceRef.current;
      }

      if (parallax) {
        currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallaxRef.current);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    /* ── Cleanup ── */
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('orientationchange', setSize);
      if (interactive) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    linesGradient, enabledWaves, lineCount, lineDistance,
    topWavePosition, middleWavePosition, bottomWavePosition,
    animationSpeed, interactive, bendRadius, bendStrength,
    mouseDamping, parallax, parallaxStrength, mixBlendMode,
  ]);

  /* Invisible anchor — the canvas lives on body, not here */
  return <div ref={mountRef} style={{ display: 'none' }} />;
}

/* ─────────────────────────────────────────────────────────────
   SplitText (verbatim from original source)
───────────────────────────────────────────────────────────── */

function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => { onCompleteRef.current = onLetterAnimationComplete; }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') setFontsLoaded(true);
    else document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;
      const el = ref.current;

      if (el._rbsplitInstance) {
        try { el._rbsplitInstance.revert(); } catch (_) { }
        el._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? (marginMatch[2] || 'px') : 'px';
      const sign =
        marginValue === 0 ? ''
          : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets;
      const assignTargets = (self) => {
        if (splitType.includes('chars') && self.chars?.length) targets = self.chars;
        if (!targets && splitType.includes('words') && self.words?.length) targets = self.words;
        if (!targets && splitType.includes('lines') && self.lines?.length) targets = self.lines;
        if (!targets) targets = self.chars || self.words || self.lines;
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self) => {
          assignTargets(self);
          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4,
            },
            onComplete: () => {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: 'transform, opacity',
            force3D: true,
          });
        },
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((st) => { if (st.trigger === el) st.kill(); });
        try { splitInstance.revert(); } catch (_) { }
        el._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text, delay, duration, ease, splitType,
        JSON.stringify(from), JSON.stringify(to),
        threshold, rootMargin, fontsLoaded,
      ],
      scope: ref,
    },
  );

  const Tag = tag || 'p';
  return (
    <Tag
      ref={ref}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        overflow: 'hidden',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity',
      }}
    >
      {text}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────
   IntroPage
───────────────────────────────────────────────────────────── */

export default function IntroPage() {
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.4 },
      );
    }
  }, []);

  return (
    <>
      {/* ── Global styles injected once ── */}
      <style>{`
        html, body, #root {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background: #000;
        }

        /* Root page shell */
        .intro-root {
          position: relative;
          width: 100vw;
          height: 100dvh;
          min-height: 100vh;
          overflow: hidden;
          background: transparent;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /*
         * The canvas lives on <body> with position:fixed (z-index 0).
         * This overlay sits on top of it but below the text content.
         */
        .intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: radial-gradient(
            ellipse at 50% 50%,
            rgba(0,0,0,0.28) 0%,
            rgba(0,0,0,0.75) 100%
          );
          pointer-events: none;
        }

        /* Foreground content */
        .intro-content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100dvh;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          gap: 0;
        }

        /* ── Title ── */
        .company-name {
          font-size: clamp(2.4rem, 6vw, 4rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.1;
          color: #ffffff;
          display: block;
          text-align: center;
          margin-bottom: 2rem;
          max-width: 800px;
        }

        .company-name .split-word,
        .company-name .split-char {
          display: inline-block;
          color: #ffffff;
        }

        /* ── Brand Name ── */
        .brand-name {
          font-size: clamp(2.6rem, 9vw, 6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
          background: linear-gradient(135deg, #e879f9 0%, #818cf8 48%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          text-align: center;
          margin-bottom: 0.9rem;
        }
        .brand-name .split-char {
          display: inline-block;
          background: linear-gradient(135deg, #e879f9 0%, #818cf8 48%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Tagline ── */
        .tagline-text {
          font-size: clamp(0.875rem, 2.2vw, 1.15rem);
          font-weight: 400;
          color: #94a3b8;
          line-height: 1.7;
          text-align: center;
          max-width: 500px;
          margin-bottom: 2.75rem;
        }

        /* ── Button row ── */
        .btn-row {
          display: flex;
          flex-direction: row;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Shared base */
        .btn {
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 9999px;
          cursor: pointer;
          min-width: 140px;
          letter-spacing: -0.01em;
          font-family: inherit;
          outline: none;
          transition:
            transform     0.18s ease,
            box-shadow    0.18s ease,
            background    0.18s ease,
            border-color  0.18s ease,
            opacity       0.18s ease;
        }

        /* White Button (Get Started) */
        .btn-white {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #ffffff;
          font-weight: 600;
        }
        .btn-white:hover {
          background: #f8fafc;
          transform: scale(1.02);
        }
        .btn-white:active { transform: scale(0.97); }

        /* Ghost / outline */
        .btn-ghost {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.2);
          color: #e2e8f0;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.3);
          color: #ffffff;
          transform: scale(1.02);
        }
        .btn-ghost:active { transform: scale(0.97); }

        /* Mobile: stack buttons full-width */
        @media (max-width: 480px) {
          .btn-row { flex-direction: column; align-items: center; width: 100%; }
          .btn { width: 100%; max-width: 260px; }
        }

        /* ── Footer ── */
        .intro-footer {
          position: absolute;
          bottom: 1.5rem;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.05em;
          z-index: 20;
          pointer-events: none;
        }
      `}</style>

      {/* The canvas is injected on <body> by FloatingLines itself */}
      <FloatingLines
        enabledWaves={['top', 'middle', 'bottom']}
        lineCount={5}
        lineDistance={5}
        bendRadius={5}
        bendStrength={-0.5}
        interactive={true}
        parallax={true}
        parallaxStrength={0.2}
        mouseDamping={0.05}
        animationSpeed={1}
        mixBlendMode="screen"
      />

      {/* Dark gradient overlay above the canvas */}
      <div className="intro-overlay" />

      {/* Page shell */}
      <div className="intro-root">
        {/* Animated foreground */}
        <div
          ref={contentRef}
          className="intro-content"
          style={{ opacity: 0 }}
        >
          {/* Company name */}
          <SplitText
            text="Company Name"
            tag="h2"
            className="brand-name"
            splitType="chars"
            delay={50}
            duration={1.25}
            ease="power3.out"
            from={{ opacity: 0, y: 45 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="center"
          />

          {/* Tagline */}
          <SplitText
            text="Design systems that move at the speed of thought."
            tag="p"
            className="tagline-text"
            splitType="lines"
            delay={35}
            duration={1.0}
            ease="power2.out"
            from={{ opacity: 0, y: 22 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="center"
          />

          {/* Title — word-by-word form */}
          <SplitText
            text="Get Started!"
            tag="h1"
            className="company-name"
            splitType="words"
            delay={50}
            duration={1.25}
            ease="power3.out"
            from={{ opacity: 0, y: 45 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="center"
          />

          {/* Action buttons */}
          <div className="btn-row">
            <button className="btn btn-white" onClick={() => navigate('/login')}>
              LOGIN
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/register')}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="intro-footer">
          Developed by team OPTIMALS
        </div>
      </div>
    </>
  );
}