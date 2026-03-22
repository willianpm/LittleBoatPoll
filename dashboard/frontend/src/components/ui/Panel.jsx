export default function Panel({ title, children }) {
  const sanitizedHeadingId = title
    ? `${title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}-heading`
    : undefined;

  return (
    <section className="panel card" aria-labelledby={sanitizedHeadingId}>
      {title && <h2 id={sanitizedHeadingId}>{title}</h2>}
      {children}
    </section>
  );
}
