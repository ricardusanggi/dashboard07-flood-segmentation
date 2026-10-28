//path : frontend/src/components/ui/FileInput.tsx
type FileInputProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
};

export default function FileInput({ onChange, accept }: FileInputProps) {
  return (
    <input
      type="file"
      accept={accept}
      onChange={onChange}
      className="
        w-full rounded-xl border p-3 text-sm
        bg-white text-gray-800
        border-gray-300
        file:mr-4 file:rounded-lg file:border-0
        file:bg-green-600 file:px-4 file:py-2
        file:text-sm file:font-semibold file:text-white
        hover:file:bg-green-700

        dark:bg-gray-900 dark:text-gray-100
        dark:border-gray-700
        dark:file:bg-green-700 dark:hover:file:bg-green-600

        transition
      "
    />
  );
}
