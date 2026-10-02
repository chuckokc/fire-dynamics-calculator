import { useEffect, useState } from 'react';
import { readStored, writeStored } from '../lib/storage';

// useState that is saved to localStorage, so values survive switching
// calculators and reopening the app.
export default function usePersistentState(key, initialValue, validate) {
  const [value, setValue] = useState(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue;
    const stored = readStored(key, fallback);
    return validate ? validate(stored, fallback) : stored;
  });

  useEffect(() => {
    writeStored(key, value);
  }, [key, value]);

  return [value, setValue];
}
