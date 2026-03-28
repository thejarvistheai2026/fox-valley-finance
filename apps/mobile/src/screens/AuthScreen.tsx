import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Chrome } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { signInWithGoogle, supabase } from '~/lib/supabase';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      console.log('Received URL:', url);

      // Check for tokens in URL
      // OAuth can return tokens in either query params (?access_token=) or hash (#access_token=)
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Try hash fragment first (after #)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
      }

      // If not in hash, try query params (after ?)
      if (!accessToken) {
        const queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
          const queryParams = new URLSearchParams(url.substring(queryIndex + 1));
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
        }
      }

      if (accessToken) {
        console.log('Found access token, setting session...');
        setLoading(true);
        
        // Close the browser
        try {
          await WebBrowser.dismissBrowser();
        } catch (e) {
          // Browser might already be closed
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('Session error:', error);
          Alert.alert('Sign in failed', error.message);
        } else {
          console.log('Session set successfully');
        }
        setLoading(false);
      } else if (url.includes('error=')) {
        try { await WebBrowser.dismissBrowser(); } catch (e) {}
        const queryIndex = url.indexOf('?');
        const params = new URLSearchParams(queryIndex !== -1 ? url.substring(queryIndex + 1) : '');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        console.error('OAuth error:', error, errorDescription);
        Alert.alert('Sign in failed', errorDescription || error || 'Unknown error');
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        // Use openAuthSessionAsync which is designed for OAuth flows
        // It will automatically close when redirected to our scheme
        await WebBrowser.openAuthSessionAsync(data.url, Linking.createURL('auth/callback'));
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20 justify-center">
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Fox Valley Finance
        </Text>
        <Text className="text-gray-600 text-center">
          Capture receipts for your home build
        </Text>
      </View>

      <View className="space-y-4">
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="py-4 rounded-lg flex-row items-center justify-center bg-white border border-gray-300 shadow-sm"
        >
          {loading ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <>
              <Chrome size={24} color="#4285F4" />
              <Text className="text-gray-700 font-semibold text-lg ml-3">
                Sign in with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="py-4">
          <Text className="text-sm text-gray-500 text-center">
            Tap to sign in with your Google account
          </Text>
        </View>
      </View>

      <View className="mt-8">
        <Text className="text-xs text-gray-400 text-center">
          Open the app, take a photo, done.{'\n'}
          Process receipts on the web app.
        </Text>
      </View>
    </View>
  );
}
