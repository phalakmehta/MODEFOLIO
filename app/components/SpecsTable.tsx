'use client';

import { useState } from 'react';
import InlineAnnotation from './InlineAnnotation';

interface SpecRow {
  label: string;
  value: string;
  conceptTerm?: string;
}

interface SpecsTableProps {
  specs: SpecRow[];
}

export default function SpecsTable({ specs }: SpecsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <table className="specs-table">
      <thead>
        <tr>
          <th>Specification</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {specs.map((spec, i) => (
          <tr
            key={i}
            className={spec.conceptTerm ? 'spec-row-expandable' : ''}
            onClick={() => {
              if (spec.conceptTerm) {
                setExpandedRow(expandedRow === i ? null : i);
              }
            }}
          >
            <td>
              <span className="spec-row-indicator">
                {spec.conceptTerm && (
                  <svg
                    className={`spec-expand-icon ${expandedRow === i ? 'expanded' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
                {spec.conceptTerm ? (
                  <InlineAnnotation term={spec.conceptTerm}>
                    {spec.label}
                  </InlineAnnotation>
                ) : (
                  spec.label
                )}
              </span>
            </td>
            <td>
              <span className="mono">{spec.value}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
