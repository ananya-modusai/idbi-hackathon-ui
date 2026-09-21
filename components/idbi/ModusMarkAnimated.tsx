"use client"

// The modus "m" drawing itself. Shown while a reply is being formed.
//
// The letter is three *stroked* paths, not a filled outline: a stem and two shoulders, drawn
// with a 62-unit pen in a 400-unit box. That is what makes a write-on possible at all — an
// outline can only be traced round its border, which is a different thing and reads as a
// selection marquee.
//
// Each path carries a stroke-dasharray equal to its own length. Drawing runs the dashoffset
// from that length to zero; erasing carries it on to minus that length, so the ink flows off
// the far end rather than retreating the way it came, and the cycle closes without a cut.
//
// Strokes overlap: the next one starts at 55% of the previous, so the pen never fully stops.

import { useEffect, useRef } from 'react';

/** Stem, first shoulder, second shoulder — in the order a hand writes them. */
const STROKES = [
  'M 85 120 L 85 330',
  'M 85 216 A 65 65 0 0 1 215 216 L 215 330',
  'M 215 216 A 65 65 0 0 1 345 216 L 345 330',
];

const SPEED = 0.5;        // half pace — the letter is meant to be watched, not glimpsed
const DRAW_PACE = 1.05;   // ms per unit while drawing
const ERASE_PACE = 0.7;   // ms per unit while retracting
const STAGGER = 0.55;     // the next stroke starts at 55% of the previous one
const HOLD_FULL = 100;    // ms the finished glyph rests — deliberately brief
const HOLD_EMPTY = 260;   // ms of clear paper before it starts again

const wait = (ms: number) => new Promise(resolve => { setTimeout(resolve, ms); });

export function ModusMarkAnimated({ size = 28 }: { size?: number }) {
  const refs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const paths = refs.current.filter((p): p is SVGPathElement => p !== null);
    if (paths.length !== STROKES.length) return;

    // Measured, not assumed: an arc's length is not obvious from its command, and the dash
    // pattern has to equal it exactly or the reveal will not finish flush with the stroke.
    const lengths = paths.map(p => p.getTotalLength());

    // Reduced motion still needs the mark — it simply sits there, whole.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paths.forEach((p, i) => {
        p.style.strokeDasharray = String(lengths[i]);
        p.style.strokeDashoffset = '0';
      });
      return;
    }

    // Cancelled on unmount: an animation loop that outlives its component keeps a detached
    // node alive and goes on scheduling work for a page that has gone.
    let live = true;

    const hideAll = () => {
      paths.forEach((p, i) => {
        p.getAnimations().forEach(a => a.cancel());
        p.style.strokeDasharray = String(lengths[i]);
        p.style.strokeDashoffset = String(lengths[i]);
      });
    };

    const move = (i: number, from: number, to: number, pace: number) => {
      const duration = (lengths[i] * pace) / SPEED;
      const anim = paths[i].animate(
        [{ strokeDashoffset: from }, { strokeDashoffset: to }],
        { duration, easing: 'cubic-bezier(.62,.03,.36,1)', fill: 'forwards' },
      );
      const done = anim.finished
        .then(() => {
          paths[i].style.strokeDashoffset = String(to);
          anim.cancel();
        })
        .catch(() => { });
      return { done, duration };
    };

    const sequence = (mode: 'draw' | 'erase') => {
      const jobs: Promise<unknown>[] = [];
      let delay = 0;
      for (let i = 0; i < paths.length; i += 1) {
        const len = lengths[i];
        const pace = mode === 'draw' ? DRAW_PACE : ERASE_PACE;
        const from = mode === 'draw' ? len : 0;
        const to = mode === 'draw' ? 0 : -len;
        jobs.push(wait(delay).then(() => (live ? move(i, from, to, pace).done : undefined)));
        delay += ((len * pace) / SPEED) * STAGGER;
      }
      return Promise.all(jobs);
    };

    const loop = async () => {
      hideAll();
      while (live) {
        await sequence('draw');
        if (!live) return;
        // Not divided by SPEED: the hold is a beat, not a distance, and scaling it with the
        // pace is what made the finished letter sit there.
        await wait(HOLD_FULL);
        if (!live) return;

        await sequence('erase');
        if (!live) return;
        hideAll();
        await wait(HOLD_EMPTY / SPEED);
      }
    };

    loop();
    return () => {
      live = false;
      paths.forEach(p => p.getAnimations().forEach(a => a.cancel()));
    };
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Working"
      className="shrink-0"
    >
      {STROKES.map((d, i) => (
        <path
          key={d}
          ref={el => { refs.current[i] = el; }}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={62}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          className="text-blue-900"
        />
      ))}
    </svg>
  );
}

export default ModusMarkAnimated;
