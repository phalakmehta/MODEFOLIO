import changelogData from '@/data/changelog.json';
import { models, Model, blendedPrice, formatPrice, formatTokens } from '@/lib/data';

/**
 * Price and spec changes, as logged by pipeline/build_models.py each week.
 * changelog.json also holds pipeline bookkeeping (new-model candidates awaiting
 * review, entries keyed by OpenRouter ids from the old pipeline); only applied
 * changes to models we actually list are shown.
 */
export type ChangeType =
  | 'price-change'
  | 'context-change'
  | 'max-output-change'
  | 'model-added'
  | 'model-retired'
  | 'model-restored';

export type Change = {
  date: string;
  modelId: string;
  type: ChangeType;
  field?: string;
  old?: number | null;
  new?: number | null;
};

const SHOWN = new Set<string>([
  'price-change',
  'context-change',
  'max-output-change',
  'model-added',
  'model-retired',
  'model-restored',
]);

const byId = new Map(models.map((m) => [m.id, m]));

type RawEntry = { date: string; modelId: string; type: string; status?: string } & Partial<Change>;

export const changes: Change[] = (changelogData as RawEntry[])
  .filter((c) => SHOWN.has(c.type) && c.status === 'applied' && byId.has(c.modelId))
  .map((c) => c as Change)
  .sort((a, b) => b.date.localeCompare(a.date));

export const changesFor = (modelId: string) => changes.filter((c) => c.modelId === modelId);

/**
 * "Recent" is measured from the latest data refresh, not from the viewer's
 * clock. Pages are prerendered at build time, so a clock-based window could
 * disagree between the server render and the browser and break hydration.
 */
const DATA_DATE = models.reduce((max, m) => ((m.lastUpdated ?? '') > max ? (m.lastUpdated as string) : max), '');

function daysBefore(date: string, days: number): string {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Percentage change in the model's blended price over the last `days`, or null
 * when nothing moved by at least 1%. Compares against the oldest logged value in
 * the window, so two small cuts in a month read as one bigger cut.
 */
export function recentPriceChange(model: Model, days = 30): number | null {
  const cutoff = daysBefore(DATA_DATE, days);
  const recent = changesFor(model.id).filter((c) => c.type === 'price-change' && c.date >= cutoff);
  if (!recent.length) return null;

  let oldIn = model.specs.pricing.input;
  let oldOut = model.specs.pricing.output;
  // Newest first, so the last assignment per field is the oldest value.
  for (const c of recent) {
    if (typeof c.old !== 'number') continue;
    if (c.field === 'specs.pricing.input') oldIn = c.old;
    if (c.field === 'specs.pricing.output') oldOut = c.old;
  }

  const before = oldIn * 0.8 + oldOut * 0.2;
  if (before <= 0) return null;
  const pct = ((blendedPrice(model) - before) / before) * 100;
  return Math.abs(pct) < 1 ? null : pct;
}

const FIELD_LABEL: Record<string, string> = {
  'specs.pricing.input': 'Input price',
  'specs.pricing.output': 'Output price',
  'specs.contextWindow': 'Context window',
  'specs.maxOutputTokens': 'Max output',
};

/** One plain-English line, e.g. "Input price cut from $3 to $2.50 per 1M tokens". */
export function describeChange(c: Change): string {
  switch (c.type) {
    case 'model-added':
      return 'Added to the directory';
    case 'model-retired':
      return 'No longer offered on OpenRouter — now listed as retired';
    case 'model-restored':
      return 'Back on OpenRouter — available again';
    default: {
      const label = FIELD_LABEL[c.field ?? ''] ?? c.field ?? 'Spec';
      const isPrice = c.type === 'price-change';
      const fmt = (n: number | null | undefined) =>
        n == null ? 'unpublished' : isPrice ? formatPrice(n) : `${formatTokens(n)} tokens`;
      const up = (c.new ?? 0) > (c.old ?? 0);
      const verb = isPrice ? (up ? 'raised' : 'cut') : up ? 'grew' : 'shrank';
      return `${label} ${verb} from ${fmt(c.old)} to ${fmt(c.new)}${isPrice ? ' per 1M tokens' : ''}`;
    }
  }
}

/** Whether a change is good news for the person paying. */
export function isImprovement(c: Change): boolean | null {
  if (c.type === 'model-added' || c.type === 'model-restored') return true;
  if (c.type === 'model-retired') return false;
  if (c.old == null || c.new == null) return null;
  return c.type === 'price-change' ? c.new < c.old : c.new > c.old;
}
