import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';
import { isValidEmail } from '../utils/helpers';

const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    
    // Validate inputs
    let isValid = true;
    
    if (!name || name.trim().length < 2) {
      setNameError('Please enter a valid name');
      isValid = false;
    }
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      isValid = false;
    }
    
    if (!isValid) return;
    
    setLoading(true);
    
    try {
      const userId = await signUp(name, email, password);
      
      if (userId) {
        // Navigate to biometric setup
        router.push('/auth/biometric-setup');
      } else {
        Alert.alert('Signup Failed', 'Could not create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
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
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            error={!!nameError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
          />
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
          
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
            error={!!passwordError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off' : 'eye'}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />
          
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!confirmPasswordVisible}
            error={!!passwordError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
            right={
              <TextInput.Icon
                icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              />
            }
          />
          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          
          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
            buttonColor={Colors.primary}
          >
            Sign Up
          </Button>
          
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginText}>Login</Text>
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
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: Colors.background.light,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  logo: {
    width: '75%',
    height: 150,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
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
  signupButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen;