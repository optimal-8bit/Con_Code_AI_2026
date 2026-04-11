import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

// ─────────────────────────────────────────────
// Shaders
// ─────────────────────────────────────────────

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
  if (lineGradientCount <= 0) return baseColor;
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
  float amp  = sin(offset + time * 0.2) * 0.3;
  float y    = sin(uv.x + offset + time * 0.1) * amp;
  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }
  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax) baseUv += parallaxOffset;

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

// ─────────────────────────────────────────────
// FloatingLines — responsive WebGL background
// ─────────────────────────────────────────────

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
  const containerRef        = useRef(null);
  const targetMouseRef      = useRef(new Vector2(-1000, -1000));
  const currentMouseRef     = useRef(new Vector2(-1000, -1000));
  const targetInfluenceRef  = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef   = useRef(new Vector2(0, 0));
  const currentParallaxRef  = useRef(new Vector2(0, 0));

  const getLineCount = (waveType) => {
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    return lineCount[enabledWaves.indexOf(waveType)] ?? 6;
  };

  const getLineDistance = (waveType) => {
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    return lineDistance[enabledWaves.indexOf(waveType)] ?? 0.1;
  };

  const topLineCount       = enabledWaves.includes('top')    ? getLineCount('top')       : 0;
  const middleLineCount    = enabledWaves.includes('middle') ? getLineCount('middle')    : 0;
  const bottomLineCount    = enabledWaves.includes('bottom') ? getLineCount('bottom')    : 0;
  const topLineDistance    = enabledWaves.includes('top')    ? getLineDistance('top')    * 0.01 : 0.01;
  const middleLineDistance = enabledWaves.includes('middle') ? getLineDistance('middle') * 0.01 : 0.01;
  const bottomLineDistance = enabledWaves.includes('bottom') ? getLineDistance('bottom') * 0.01 : 0.01;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    const scene  = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    const canvas   = renderer.domElement;

    // Canvas covers the entire container via CSS
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    canvas.style.display  = 'block';
    container.appendChild(canvas);

    const uniforms = {
      iTime:          { value: 0 },
      iResolution:    { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },

      enableTop:    { value: enabledWaves.includes('top') },
      enableMiddle: { value: enabledWaves.includes('middle') },
      enableBottom: { value: enabledWaves.includes('bottom') },

      topLineCount:    { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },

      topLineDistance:    { value: topLineDistance },
      middleLineDistance: { value: middleLineDistance },
      bottomLineDistance: { value: bottomLineDistance },

      topWavePosition: {
        value: new Vector3(
          topWavePosition?.x      ?? 10.0,
          topWavePosition?.y      ?? 0.5,
          topWavePosition?.rotate ?? -0.4
        ),
      },
      middleWavePosition: {
        value: new Vector3(
          middleWavePosition?.x      ?? 5.0,
          middleWavePosition?.y      ?? 0.0,
          middleWavePosition?.rotate ?? 0.2
        ),
      },
      bottomWavePosition: {
        value: new Vector3(
          bottomWavePosition?.x      ?? 2.0,
          bottomWavePosition?.y      ?? -0.7,
          bottomWavePosition?.rotate ?? 0.4
        ),
      },

      iMouse:        { value: new Vector2(-1000, -1000) },
      interactive:   { value: interactive },
      bendRadius:    { value: bendRadius },
      bendStrength:  { value: bendStrength },
      bendInfluence: { value: 0 },

      parallax:         { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset:   { value: new Vector2(0, 0) },

      lineGradient:      { value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new Vector3(1, 1, 1)) },
      lineGradientCount: { value: 0 },
    };

    if (linesGradient && linesGradient.length > 0) {
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

    // ── Responsive resize: read container's actual pixel size ──
    const setSize = () => {
      if (!active) return;
      const w   = container.clientWidth  || window.innerWidth;
      const h   = container.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      renderer.setPixelRatio(dpr);
      // Pass false so Three.js does NOT set canvas CSS width/height
      // (we already control that via position:absolute + 100%/100%)
      renderer.setSize(w, h, false);

      uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
    };

    setSize();

    // ResizeObserver on the container keeps the canvas in sync on any resize
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => { if (active) setSize(); })
      : null;
    if (ro) ro.observe(container);

    // Window resize as additional fallback
    const onWinResize = () => { if (active) setSize(); };
    window.addEventListener('resize', onWinResize);

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr  = renderer.getPixelRatio();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      targetMouseRef.current.set(x * dpr, (rect.height - y) * dpr);
      targetInfluenceRef.current = 1.0;
      if (parallax) {
        targetParallaxRef.current.set(
          ((x - rect.width  / 2) / rect.width)  *  parallaxStrength,
          -((y - rect.height / 2) / rect.height) *  parallaxStrength
        );
      }
    };
    const onPointerLeave = () => { targetInfluenceRef.current = 0.0; };

    if (interactive) {
      canvas.addEventListener('pointermove',  onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    let raf = 0;
    const loop = () => {
      if (!active) return;
      uniforms.iTime.value = clock.getElapsedTime();

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);
        uniforms.iMouse.value.copy(currentMouseRef.current);
        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping;
        uniforms.bendInfluence.value  = currentInfluenceRef.current;
      }

      if (parallax) {
        currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallaxRef.current);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      if (interactive) {
        canvas.removeEventListener('pointermove',  onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.parentElement?.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    linesGradient, enabledWaves, lineCount, lineDistance,
    topWavePosition, middleWavePosition, bottomWavePosition,
    animationSpeed, interactive, bendRadius, bendStrength,
    mouseDamping, parallax, parallaxStrength,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        // Must be positioned so absolute canvas child fills it correctly
        position:   'absolute',
        inset:      0,
        width:      '100%',
        height:     '100%',
        overflow:   'hidden',
        mixBlendMode,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// SplitText — exactly as given
// ─────────────────────────────────────────────

function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to   = { opacity: 1, y: 0 },
  threshold  = 0.1,
  rootMargin = '-100px',
  textAlign  = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef         = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => { onCompleteRef.current = onLetterAnimationComplete; }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') setFontsLoaded(true);
    else document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    if (animationCompletedRef.current) return;
    const el = ref.current;

    if (el._rbsplitInstance) {
      try { el._rbsplitInstance.revert(); } catch (_) {}
      el._rbsplitInstance = null;
    }

    const startPct    = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit  = marginMatch ? (marginMatch[2] || 'px') : 'px';
    const sign =
      marginValue === 0 ? ''
      : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}`
      :                   `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    let targets;
    const assignTargets = (self) => {
      if (splitType.includes('chars') && self.chars?.length)  targets = self.chars;
      if (!targets && splitType.includes('words') && self.words?.length) targets = self.words;
      if (!targets && splitType.includes('lines') && self.lines?.length) targets = self.lines;
      if (!targets) targets = self.chars || self.words || self.lines;
    };

    const splitInstance = new GSAPSplitText(el, {
      type: splitType,
      smartWrap: true,
      autoSplit: splitType === 'lines',
      linesClass: 'split-line',
      wordsClass:  'split-word',
      charsClass:  'split-char',
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
      try { splitInstance.revert(); } catch (_) {}
      el._rbsplitInstance = null;
    };
  }, {
    dependencies: [
      text, delay, duration, ease, splitType,
      JSON.stringify(from), JSON.stringify(to),
      threshold, rootMargin, fontsLoaded,
    ],
    scope: ref,
  });

  const Tag = tag || 'p';
  return (
    <Tag
      ref={ref}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        overflow:   'hidden',
        display:    'inline-block',
        whiteSpace: 'normal',
        wordWrap:   'break-word',
        willChange: 'transform, opacity',
      }}
    >
      {text}
    </Tag>
  );
}

// ─────────────────────────────────────────────
// IntroPage — Main Landing Page
// ─────────────────────────────────────────────

export default function IntroPage() {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.35 }
      );
    }
  }, []);

  return (
    <>
      <style>{`
        /* Reset */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Root — full viewport, black base */
        .intro-root {
          position: relative;
          width: 100vw;
          height: 100dvh;    /* respects mobile browser chrome */
          min-height: 100vh; /* fallback */
          overflow: hidden;
          background: #000;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Background layer wraps FloatingLines */
        .intro-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        /* Readability gradient overlay */
        .intro-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: radial-gradient(
            ellipse at 50% 50%,
            rgba(0,0,0,0.30) 0%,
            rgba(0,0,0,0.76) 100%
          );
          pointer-events: none;
        }

        /* Foreground content */
        .intro-content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        /* ── Company name ── */
        .company-name {
          font-size: clamp(2.75rem, 10vw, 6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
          background: linear-gradient(135deg, #e879f9 0%, #818cf8 48%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          text-align: center;
          margin-bottom: 0.875rem;
        }

        /* Each split char must inherit the gradient */
        .company-name .split-char {
          display: inline-block;
          background: linear-gradient(135deg, #e879f9 0%, #818cf8 48%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Tagline ── */
        .tagline-text {
          font-size: clamp(0.9rem, 2.4vw, 1.2rem);
          font-weight: 400;
          color: #94a3b8;
          line-height: 1.7;
          text-align: center;
          max-width: 520px;
          margin-bottom: 2.75rem;
        }

        /* ── Get Started label ── */
        .get-started-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.875rem;
        }

        /* ── Button row ── */
        .btn-row {
          display: flex;
          flex-direction: row;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Shared button base */
        .btn {
          padding: 0.7rem 2.25rem;
          font-size: 0.9375rem;
          font-weight: 500;
          border-radius: 0.5rem;
          cursor: pointer;
          min-width: 130px;
          letter-spacing: 0.01em;
          font-family: inherit;
          outline: none;
          transition:
            transform   0.18s ease,
            box-shadow  0.18s ease,
            background  0.18s ease,
            border-color 0.18s ease,
            opacity     0.18s ease;
        }

        /* Ghost / outline button */
        .btn-ghost {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.18);
          color: #f1f5f9;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.38);
          transform: scale(1.04);
        }
        .btn-ghost:active { transform: scale(0.97); }

        /* Filled gradient button */
        .btn-primary {
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border: 1px solid transparent;
          color: #fff;
          box-shadow: 0 0 0 0 rgba(168,85,247,0);
        }
        .btn-primary:hover {
          opacity: 0.87;
          transform: scale(1.04);
          box-shadow: 0 6px 28px rgba(168,85,247,0.52);
        }
        .btn-primary:active { transform: scale(0.97); }

        /* Mobile: stack buttons */
        @media (max-width: 480px) {
          .btn-row { flex-direction: column; align-items: center; width: 100%; }
          .btn { width: 100%; max-width: 260px; }
        }
      `}</style>

      <div className="intro-root">

        {/* ── Animated background ── */}
        <div className="intro-bg">
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
        </div>

        {/* ── Overlay for text legibility ── */}
        <div className="intro-overlay" />

        {/* ── Main content ── */}
        <div
          ref={contentRef}
          className="intro-content"
          style={{ opacity: 0 }}
        >
          {/* Company name — animated char by char */}
          <SplitText
            text="Luminary"
            tag="h1"
            className="company-name"
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

          {/* Tagline — animated word by word */}
          <SplitText
            text="Design systems that move at the speed of thought."
            tag="p"
            className="tagline-text"
            splitType="words"
            delay={35}
            duration={1.0}
            ease="power2.out"
            from={{ opacity: 0, y: 22 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="center"
          />

          {/* Get started CTA label */}
          <p className="get-started-label">Get Started</p>

          {/* Action buttons */}
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => alert('Login')}>
              Login
            </button>
            <button className="btn btn-primary" onClick={() => alert('Register')}>
              Register
            </button>
          </div>
        </div>

      </div>
    </>
  );
}