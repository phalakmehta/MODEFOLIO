import Link from 'next/link';
import { getModelById, displayName } from '@/lib/data';
import { Change, describeChange, isImprovement } from '@/lib/changes';

/** Price and spec changes, newest first. The arrow and wording carry the meaning; colour only reinforces it. */
export default function ChangeList({ changes, showModel = true }: { changes: Change[]; showModel?: boolean }) {
  return (
    <ul className="change-list">
      {changes.map((c, i) => {
        const good = isImprovement(c);
        const tone = good === null ? '' : good ? 'change-icon--good' : 'change-icon--bad';
        const model = getModelById(c.modelId);
        // The arrow shows which way the number moved; colour says whether that is
        // good for you (a price going down is, a context window going down is not).
        const icon =
          c.type === 'model-retired' ? '×'
          : c.type === 'model-added' || c.type === 'model-restored' ? '+'
          : (c.new ?? 0) > (c.old ?? 0) ? '▲' : '▼';
        return (
          <li key={`${c.date}-${c.modelId}-${c.type}-${c.field ?? ''}-${i}`}>
            <span className="change-date">{c.date}</span>
            <span className={`change-icon ${tone}`} aria-label={good === null ? undefined : good ? 'better' : 'worse'}>
              {icon}
            </span>
            {showModel && model && (
              <Link href={`/models/${model.id}`} className="change-model">
                {displayName(model.name)}
              </Link>
            )}
            <span className="change-text">{describeChange(c)}</span>
          </li>
        );
      })}
    </ul>
  );
}
