//path : frontend/src/components/ui/Card.tsx
type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`
        rounded-3xl p-6 transition
        bg-white text-gray-800
        dark:bg-gray-900 dark:text-gray-100
        border border-gray-200 dark:border-gray-800
        shadow
        ${className}
      `}
    >
      {title && (
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
