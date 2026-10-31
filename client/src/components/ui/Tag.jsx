const HUES = ['teal', 'amber', 'blue', 'pink', 'violet'];

function hueFor(label) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
}

const HUE_CLASSES = {
  teal: 'bg-tag-teal-bg text-tag-teal-text dark:bg-tag-teal-bgDark dark:text-tag-teal-textDark',
  amber: 'bg-tag-amber-bg text-tag-amber-text dark:bg-tag-amber-bgDark dark:text-tag-amber-textDark',
  blue: 'bg-tag-blue-bg text-tag-blue-text dark:bg-tag-blue-bgDark dark:text-tag-blue-textDark',
  pink: 'bg-tag-pink-bg text-tag-pink-text dark:bg-tag-pink-bgDark dark:text-tag-pink-textDark',
  violet: 'bg-tag-violet-bg text-tag-violet-text dark:bg-tag-violet-bgDark dark:text-tag-violet-textDark',
};

/**
 * Categorical metadata chip (tax names, variant attributes, discount scope) — distinct from
 * StatusBadge, which is reserved for lifecycle state. Color is deterministic per label, not
 * meaningful on its own: it's "which kind of thing," not "what state."
 */
export function Tag({ label, hue }) {
  const resolved = hue ?? hueFor(String(label));
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${HUE_CLASSES[resolved]}`}>{label}</span>;
}
