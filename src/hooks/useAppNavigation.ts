import { useNavigation } from '@react-navigation/native';
import type { DrawerNav } from '../types/navigation';

export default function useAppNavigation() {
  return useNavigation<DrawerNav>();
}
