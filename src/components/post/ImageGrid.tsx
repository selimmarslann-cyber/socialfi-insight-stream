interface ImageGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  editable?: boolean;
}

export const ImageGrid = ({ images, onRemove, editable }: ImageGridProps) => {
  if (!images.length) return null;

  const layoutClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2 gap-3',
      3: 'grid-cols-3 gap-3 [&>*:first-child]:col-span-2 [&>*:first-child]:row-span-2',
      4: 'grid-cols-2 gap-3',
    }[Math.min(images.length, 4)] ?? 'grid-cols-2 gap-3';

  return (
      <div className={`grid ${layoutClass}`}>
      {images.slice(0, 4).map((url, index) => (
        <div
          key={url + index}
            className="relative overflow-hidden rounded-2xl border border-[color:var(--ring)] bg-[color:var(--bg-base)]"
        >
          <img
            src={url}
            alt={`Attachment ${index + 1}`}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
            loading="lazy"
          />
          {editable && onRemove && (
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs text-white shadow-md transition hover:bg-slate-900"
              onClick={() => onRemove(index)}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
