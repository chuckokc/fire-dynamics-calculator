/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Chakra from '@chakra-ui/react';
import { ArrowRight } from 'lucide-react';

// Lets one calculator hand its heat release rate to another, so students can
// work a whole scenario (fire size -> flame height -> radiant heat -> flashover)
// without retyping. Values travel in kW; each calculator converts to its own units.

// Tab order in App.jsx
export const TAB_INDEX = { hrr: 0, flameHeight: 1, pointSource: 2, flashover: 3, tSquared: 4 };

const TARGETS = [
  { key: 'flameHeight', label: 'Flame Height' },
  { key: 'pointSource', label: 'Point Source Radiation' },
  { key: 'flashover', label: 'Flashover (compare with this fire)' },
  { key: 'tSquared', label: 'T-Squared (time to reach this HRR)' }
];

const TransferContext = createContext(null);

export function HrrTransferProvider({ onNavigate, children }) {
  const [pending, setPending] = useState(null);
  const send = (target, kW, from) => {
    setPending({ target, kW, from, id: Date.now() });
    onNavigate(TAB_INDEX[target]);
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <TransferContext.Provider value={{ pending, setPending, send }}>
      {children}
    </TransferContext.Provider>
  );
}

/**
 * Use in a receiving calculator. `apply(kW, from)` runs once when an HRR is
 * sent to `target`.
 */
export function useIncomingHRR(target, apply) {
  const ctx = useContext(TransferContext);
  const toast = Chakra.useToast();
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const pending = ctx?.pending;

  useEffect(() => {
    if (!ctx || !pending || pending.target !== target) return;
    ctx.setPending(null);
    applyRef.current(pending.kW, pending.from);
    toast({
      title: `Heat release rate brought over from ${pending.from}`,
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  }, [ctx, pending, target, toast]);
}

/** "Use this HRR in…" menu for a calculator result. */
export function SendHRRMenu({ kW, from, exclude }) {
  const ctx = useContext(TransferContext);
  if (!ctx || !(kW > 0)) return null;
  return (
    <Chakra.Menu>
      <Chakra.MenuButton as={Chakra.Button} size="sm" colorScheme="teal" rightIcon={<ArrowRight size={14} />}>
        Use this HRR in…
      </Chakra.MenuButton>
      <Chakra.MenuList>
        {TARGETS.filter((t) => t.key !== exclude).map((t) => (
          <Chakra.MenuItem key={t.key} onClick={() => ctx.send(t.key, kW, from)}>
            {t.label}
          </Chakra.MenuItem>
        ))}
      </Chakra.MenuList>
    </Chakra.Menu>
  );
}
