export default function Panel({ title, children }) {
  return (
    <section className="panel card" aria-labelledby={title ? `${title}-heading` : undefined}>
      {title && <h2 id={`${title}-heading`}>{title}</h2>}
      {children}
    </section>
  );
}
