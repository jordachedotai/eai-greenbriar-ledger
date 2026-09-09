// A person's initials on a soft brand circle, or a headshot when there is
// one. 40 in the sidebar and the login card.

export type Person = { id?: string; name: string; avatar?: string };

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Face({ person, size = 24, className = "" }: { person: Person; size?: number; className?: string }) {
  const style: React.CSSProperties = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.35)) };
  if (person.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar} alt={person.name} title={person.name} style={style} className={"shrink-0 rounded-full object-cover object-top " + className} data-testid="face" />;
  }
  return (
    <span
      title={person.name}
      style={style}
      className={"face-initials inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold leading-none text-brand2 " + className}
      data-initials={initials(person.name)}
      data-testid="face"
      aria-label={person.name}
    />
  );
}
