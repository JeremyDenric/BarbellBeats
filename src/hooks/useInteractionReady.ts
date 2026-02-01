import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

export default function useInteractionReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => {
      if (task && typeof task.cancel === 'function') {
        task.cancel();
      }
    };
  }, []);

  return ready;
}
