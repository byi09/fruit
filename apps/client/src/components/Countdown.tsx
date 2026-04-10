import { useState, useEffect } from 'react';

interface CountdownProps {
  startsAt: number;
}

export function Countdown({ startsAt }: CountdownProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const remaining = Math.ceil((startsAt - Date.now()) / 1000);
      setCount(remaining > 0 ? remaining : null);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [startsAt]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/80 fixed inset-0 z-50">
      <div className="text-center animate-fade-in">
        {count !== null ? (
          <>
            <div
              key={count}
              className="text-[120px] font-extrabold text-white drop-shadow-2xl animate-pop"
              style={{ animationDuration: '0.8s' }}
            >
              {count}
            </div>
            <p className="text-white/70 text-xl mt-4">Get ready!</p>
          </>
        ) : (
          <div className="text-6xl font-extrabold text-emerald-400 animate-pop">GO!</div>
        )}
      </div>
    </div>
  );
}
