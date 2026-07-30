import { registerRootComponent } from 'expo';
import App from './App';

// Padanan `main.tsx` web. `registerRootComponent` sekaligus memanggil
// `AppRegistry.registerComponent`, jadi tak ada nama komponen yang perlu dicocokkan.
registerRootComponent(App);
