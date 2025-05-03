import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Colors } from '../utils/Colors';

interface FakeBarcodeScannerProps {
  onBarCodeScanned: (data: string) => void;
  onCancel?: () => void;
}

const FakeBarcodeScanner: React.FC<FakeBarcodeScannerProps> = ({ 
  onBarCodeScanned,
  onCancel 
}) => {
  const [scanning, setScanning] = useState(false);
  const scanLineAnimation = new Animated.Value(0);
  
  // Start scanning animation
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
      
      // Simulate scan completion after 3-5 seconds
      const timer = setTimeout(() => {
        const mockBarcodeData = generateMockBarcodeData();
        setScanning(false);
        onBarCodeScanned(mockBarcodeData);
      }, 3000 + Math.random() * 2000);
      
      return () => clearTimeout(timer);
    }
  }, [scanning]);
  
  // Generate fake barcode data
  const generateMockBarcodeData = (): string => {
    // Generate a random user ID (e.g., VVIT123456)
    const userId = `VVIT${Math.floor(100000 + Math.random() * 900000)}`;
    
    // In a real app, this would be structured data, but for simplicity we'll just return the userId
    return userId;
  };
  
  const handleStartScan = () => {
    setScanning(true);
  };
  
  const handleCancel = () => {
    setScanning(false);
    if (onCancel) onCancel();
  };
  
  // Calculate animation position
  const translateY = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220]
  });

  return (
    <View style={styles.container}>
      <View style={styles.viewfinder}>
        <View style={styles.barcodeFrame}>
          {/* Top-left corner */}
          <View style={[styles.corner, styles.topLeft]} />
          {/* Top-right corner */}
          <View style={[styles.corner, styles.topRight]} />
          {/* Bottom-left corner */}
          <View style={[styles.corner, styles.bottomLeft]} />
          {/* Bottom-right corner */}
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        {scanning && (
          <Animated.View 
            style={[
              styles.scanLine, 
              {transform: [{translateY}]}
            ]} 
          />
        )}
      </View>
      
      <Text style={styles.instruction}>
        {scanning 
          ? 'Scanning barcode...' 
          : 'Press the button to scan a QR or barcode'}
      </Text>
      
      <View style={styles.buttonContainer}>
        {!scanning ? (
          <Button
            mode="contained"
            onPress={handleStartScan}
            style={styles.button}
            buttonColor={Colors.primary}
          >
            Start Scanning
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleCancel}
            style={styles.button}
            buttonColor={Colors.danger}
          >
            Cancel Scan
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000aa',
    padding: 20,
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff22',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  barcodeFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 10,
    left: 10,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 10,
    right: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    height: 2,
    width: '80%',
    backgroundColor: Colors.primary,
    position: 'absolute',
    left: '10%',
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default FakeBarcodeScanner;