import { useState, useEffect } from 'react';

interface CountdownProps {
  startsAt: number;
}

export function Countdown({ startsAt }: CountdownProps) {
  const [display, setDisplay] = useState<string>('3');

  useEffect(() => {
    const totalMs = startsAt - Date.now();
    const totalSeconds = Math.max(1, Math.ceil(totalMs / 1000));

    // Immediately show the first number
    setDisplay(String(totalSeconds));

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i < totalSeconds; i++) {
      timers.push(
        setTimeout(() => {
          setDisplay(String(totalSeconds - i));
        }, i * 1000),
      );
    }

    // Show GO! at the end
    timers.push(
      setTimeout(() => {
        setDisplay('GO!');
      }, totalSeconds * 1000),
    );

    return () => timers.forEach(clearTimeout);
  }, [startsAt]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/80 fixed inset-0 z-50">
      <div className="text-center">
        <div
          key={display}
          className="font-extrabold drop-shadow-2xl animate-fade-in"
          style={{
            fontSize: display === 'GO!' ? '80px' : '140px',
            color: display === 'GO!' ? '#34d399' : 'white',
          }}
        >
          {display}
        </div>
        {display !== 'GO!' && (
          <p className="text-white/70 text-xl mt-4">Get ready!</p>
        )}
      </div>
    </div>
  );
}
