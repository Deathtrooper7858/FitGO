import {
  Star, Trophy, Flame, Crown, Hand, Moon, Medal, Apple, Sunrise, Dumbbell,
  Salad, ChartBar, Droplets, Waves, ClipboardList, BookOpen, Sandwich, Leaf, ChefHat,
  Beef, Cookie, Coffee, Timer, Target, TrendingDown, BicepsFlexed, Ruler,
  Footprints, Zap, Swords, BedDouble, CloudMoon, Megaphone, Users, FlaskConical,
  Bug, MoonStar, Egg, Ghost, Hourglass, TreePine, Mountain, MessageSquare,
  HeartHandshake, Eye, Database, Heart, HeartPulse, Shield, MessageCircle,
  Activity, BatteryCharging, Flower2, Scale, ThumbsUp, UtensilsCrossed, GlassWater,
  Calendar, Bike, TrendingUp, Globe, CalendarCheck, AlarmClock, UserPlus, Lock,
  CheckCircle2, ChevronDown, ChevronUp, ArrowLeft, Info, Sparkles, Plus,
  Check, X, MoreHorizontal, Share2, Copy, RefreshCw, Fingerprint,
  Palette, Languages, Settings, HelpCircle, Pen, Trash2, LogOut, Bell, SmilePlus,
  Camera,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const iconMap: Record<string, LucideIcon> = {
  Star, Trophy, Flame, Crown, Hand, Moon, Medal, Apple, Sunrise, Dumbbell,
  Salad, ChartBar, Droplets, Waves, ClipboardList, BookOpen, Sandwich, Leaf, ChefHat,
  Beef, Cookie, Coffee, Timer, Target, TrendingDown, BicepsFlexed, Ruler,
  Footprints, Zap, Swords, BedDouble, CloudMoon, Megaphone, Users, FlaskConical,
  Bug, MoonStar, Egg, Ghost, Hourglass, TreePine, Mountain, MessageSquare,
  HeartHandshake, Eye, Database, Heart, HeartPulse, Shield, MessageCircle,
  Activity, BatteryCharging, Flower2, Scale, ThumbsUp, UtensilsCrossed, GlassWater,
  Calendar, Bike, TrendingUp, Globe, CalendarCheck, AlarmClock, UserPlus, Lock,
  CheckCircle2, ChevronDown, ChevronUp, ArrowLeft, Info, Sparkles, Plus,
  Check, X, MoreHorizontal, Share2, Copy, RefreshCw, Fingerprint,
  Palette, Languages, Settings, HelpCircle, Pen, Trash2, LogOut, Bell, SmilePlus,
  Camera,
};

export function getLucideIcon(name: string): LucideIcon {
  if (name === 'HandWaving') return Hand;
  return iconMap[name] || Star;
}
