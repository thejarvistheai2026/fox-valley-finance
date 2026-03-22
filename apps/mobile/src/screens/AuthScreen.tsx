import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react-native';
import { signInWithEmail } from '~/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="items-center">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <CheckCircle size={32} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Check your email
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            We've sent a magic link to{'\n'}
            <Text className="font-semibold text-gray-900">{email}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setEmailSent(false)}
            className="bg-gray-100 px-6 py-3 rounded-lg"
          >
            <Text className="text-gray-700 font-medium">Use a different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-white px-6 pt-20">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Fox Valley Finance
          </Text>
          <Text className="text-gray-600">
            Track receipts and expenses for your home build
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Email Address
          </Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
            <Mail size={20} color="#6b7280" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 ml-3 text-base text-gray-900"
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSendMagicLink}
          disabled={loading || !email}
          className={`py-4 rounded-lg flex-row items-center justify-center ${
            loading || !email ? 'bg-gray-300' : 'bg-primary-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-semibold text-lg mr-2">Send Magic Link</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View className="mt-8">
          <Text className="text-sm text-gray-500 text-center">
            We'll send you a magic link to sign in. No password required.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
