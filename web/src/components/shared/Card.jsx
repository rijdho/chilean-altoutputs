// A house card (.card): surface, hairline border, radius, soft shadow; the title is the mono
// uppercase heading the house style gives every card.
export default function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}
