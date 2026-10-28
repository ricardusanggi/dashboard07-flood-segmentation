//path  : frontend/src/components/ui/Button.tsx
export default function Button({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`btn btn-primary ${className}`}>
      {children}
    </button>
  );
}
