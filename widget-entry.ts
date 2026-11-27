// Untuk build hasil ekspor, tetapkan package.json main menjadi widget-entry.ts.
// package.json workspace ini tidak diubah karena dikelola platform.
import { registerOnlyusWidgets } from './components/widgets/OnlyusWidget';
registerOnlyusWidgets();
import 'expo-router/entry';
