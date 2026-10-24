import { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';

/** Long forms show their feedback message at the top, but the submit button is at the bottom. */
export function useScrollToTop() {
  const ref = useRef<ScrollView>(null);
  const scrollToTop = useCallback(() => ref.current?.scrollTo({ y: 0, animated: true }), []);
  return { ref, scrollToTop };
}
