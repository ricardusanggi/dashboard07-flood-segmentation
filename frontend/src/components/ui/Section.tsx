//path : frontend/src/components/ui/Section.tsx
type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export default function Section({ title, children, className = "" }: SectionProps) {
  return (
    <section className={`py-6 ${className}`}>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {title}
      </h1>
      {children}
    </section>
  );
}
