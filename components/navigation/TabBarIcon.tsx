// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import { LucideIcon } from 'lucide-react-native';


type Props = {
  Icon: LucideIcon;
  color: string;
};

export function TabBarIcon({ Icon, color}: Props) {
  return <Icon color={color} />;
}
