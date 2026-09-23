interface EditorialCalloutProps {
  text: string;
  label?: string;
}

export default function EditorialCallout({ text, label = "What this doesn\u2019t tell you" }: EditorialCalloutProps) {
  return (
    <div className="editorial-callout">
      <div className="editorial-callout-label">{label}</div>
      <p className="editorial-callout-text">{text}</p>
    </div>
  );
}
