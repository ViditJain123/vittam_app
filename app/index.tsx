import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';

export default function Index() {
  const { user } = useAuth();

  // If user is logged in, redirect to home screen
  // Otherwise, redirect to login screen
  if (user) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/auth/login" />;
}