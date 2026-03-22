import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import Navigation from '~/navigation';
import './global.css';

export default function App() {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}

registerRootComponent(App);
