export default function NotificationBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-cs-cyan text-cs-navy rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}
