import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';
import { isValidEmail } from '../utils/helpers';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    
    // Validate email
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Validate password
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Please enter a valid password (minimum 6 characters)');
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Navigate to home
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/vittam/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
          />
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!passwordVisible}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off' : 'eye'}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            buttonColor={Colors.primary}
          >
            Login
          </Button>
          
          <View style={styles.signupContainer}>
            <Text variant="bodyMedium">Don not have an account? </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: Colors.background.light,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logo: {
    width: '75%',
    height: 150,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  errorText: {
    color: Colors.danger,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 8,
    fontSize: 12,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;