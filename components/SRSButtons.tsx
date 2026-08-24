export type SRSRating = "again" | "hard" | "good" | "easy";

interface SRSButtonsProps {
  onRate: (rating: SRSRating) => void;
  disabled?: boolean;
}

const buttons: { rating: SRSRating; label: string; shortcut: string; color: string }[] = [
  { rating: "again", label: "نسيت", shortcut: "1", color: "from-red-500 to-red-600" },
  { rating: "hard", label: "صعب", shortcut: "2", color: "from-orange-500 to-orange-600" },
  { rating: "good", label: "جيد", shortcut: "3", color: "from-blue-500 to-blue-600" },
  { rating: "easy", label: "سهل", shortcut: "4", color: "from-green-500 to-green-600" },
];

export const SRSButtons = ({ onRate, disabled }: SRSButtonsProps) => {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md mx-auto">
      {buttons.map(({ rating, label, shortcut, color }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={`relative py-3 sm:py-4 px-2 sm:px-4 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-b ${color} text-white border-b-4 border-black/20 active:border-b-0`}
        >
          <span className="block">{label}</span>
          <span className="absolute bottom-1 right-1.5 text-[10px] opacity-70 hidden sm:block">
            {shortcut}
          </span>
        </button>
      ))}
    </div>
  );
};
