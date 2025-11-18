import { Feather as Icon } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface FinanceToastProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function FinanceToast({
  message,
  type = 'info',
  isVisible,
  onDismiss,
  duration = 5000,
}: FinanceToastProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && message) {
      // Slide in from right
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else if (!isVisible) {
      dismiss();
    }
  }, [isVisible, message]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!isVisible && !message) {
    return null;
  }

  const getIconAndColor = () => {
    switch (type) {
      case 'warning':
        return { icon: 'alert-triangle', color: '#FF9500', bg: '#FFF3E0' };
      case 'error':
        return { icon: 'alert-circle', color: '#FF3B30', bg: '#FFEBEE' };
      case 'success':
        return { icon: 'check-circle', color: '#34C759', bg: '#E8F5E9' };
      default:
        return { icon: 'info', color: '#007AFF', bg: '#E3F2FD' };
    }
  };

  const { icon, color, bg } = getIconAndColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: bg, borderLeftColor: color }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
          <Icon name="x" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 0,
    left: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
    alignItems: 'flex-end',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'white',
    maxWidth: SCREEN_WIDTH - 32,
    minWidth: 280,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

