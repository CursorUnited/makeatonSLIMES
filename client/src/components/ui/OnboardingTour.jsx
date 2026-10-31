import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Card } from './Card';

function measure(selector) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return null;
  el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  return el.getBoundingClientRect();
}

/**
 * Spotlight walkthrough: dims the page, cuts a hole around `steps[i].target` (a CSS selector),
 * shows a tooltip card with the step copy. Esc/Skip dismiss; Left/Right step; a missing target
 * is skipped automatically rather than breaking the tour.
 */
export function OnboardingTour({ steps, open, onFinish }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const step = steps[index];
    if (!step) {
      onFinish();
      return;
    }
    const r = measure(step.target);
    if (!r) {
      if (index < steps.length - 1) setIndex((i) => i + 1);
      else onFinish();
      return;
    }
    setRect(r);
    const onResize = () => setRect(measure(step.target));
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onFinish();
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !rect) return null;
  const step = steps[index];
  const pad = 6;
  const cardTop = rect.bottom + 12 + 180 > window.innerHeight ? Math.max(12, rect.top - 12 - 180) : rect.bottom + 12;
  const cardLeft = Math.min(Math.max(12, rect.left), window.innerWidth - 332);

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Guided tour">
      <div
        className="pointer-events-none fixed rounded-md transition-all duration-200 ease-out"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(10, 14, 20, 0.65)',
        }}
      />
      <Card
        ref={cardRef}
        tabIndex={-1}
        className="fixed z-[91] w-80 p-4 shadow-xl transition-all duration-200 ease-out dark:bg-darksurface"
        style={{ top: cardTop, left: cardLeft }}
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-primary-700' : 'bg-gray-300 dark:bg-darkborder'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={onFinish}>
              Skip tour
            </Button>
            {index > 0 && (
              <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button variant="primary" className="h-8 px-3 text-xs" onClick={() => (index < steps.length - 1 ? setIndex((i) => i + 1) : onFinish())}>
              {index < steps.length - 1 ? 'Next' : 'Done'}
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
