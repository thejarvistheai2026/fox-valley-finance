import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import Navigation from '~/navigation';
import '~/styles/global.css';

export default function App() {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}

registerRootComponent(App);
