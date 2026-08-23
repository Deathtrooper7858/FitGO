import { useEffect, useState } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height));
      const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    } else {
      const showSub = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height));
      const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  return keyboardHeight;
}
