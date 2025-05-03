import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';
import { formatCurrency } from '../utils/helpers';

const TransactionSuccessScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user, fetchTransactions } = useAuth();
  
  // Protect route - redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/auth/login" />;
  }
  
  const amount = typeof params.amount === 'string' ? parseFloat(params.amount) : 0;
  const transactionId = params.transactionId as string;
  const recipientId = params.recipientId as string;
  const recipientName = params.recipientName as string;
  const status = params.status as string;
  
  const isSuccess = status === 'success';
  const transactionDate = new Date().toLocaleString('en-IN');

  const navigateToHome = () => {
    // Refresh transactions before going back to home
    fetchTransactions();
    // Navigate to home screen
    router.replace('/(tabs)');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconContainer}>
        <Avatar.Icon 
          icon={isSuccess ? "check" : "close"} 
          size={100} 
          color={Colors.white}
          style={{ backgroundColor: isSuccess ? Colors.success : Colors.danger }}
        />
      </View>
      
      <Text style={[styles.statusText, { color: isSuccess ? Colors.success : Colors.danger }]}>
        {isSuccess ? 'SUCCESS' : 'FAILED'}
      </Text>
      
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text 
              style={[
                styles.detailValue, 
                { color: isSuccess ? Colors.success : Colors.danger }
              ]}
            >
              {isSuccess ? 'Successful' : 'Failed'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {transactionDate}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{transactionId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>
              {recipientName ? `${recipientName}` : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient ID</Text>
            <Text style={styles.detailValue}>{recipientId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <Text style={styles.detailValue}>
              {user ? `${user.name || 'Me'} (${user.vvitId})` : 'Me'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>Wallet Balance</Text>
          </View>
          
          {isSuccess && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Balance</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(user?.balance || 0)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      <Button
        mode="contained"
        onPress={navigateToHome}
        style={styles.homeButton}
        contentStyle={styles.buttonContent}
        buttonColor={Colors.primary}
      >
        Back to Home
      </Button>
      
      {isSuccess && (
        <Button
          mode="outlined"
          onPress={() => router.push('/screens/send-money')}
          style={styles.sendMoreButton}
          contentStyle={styles.buttonContent}
          textColor={Colors.primary}
        >
          Send More Money
        </Button>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: Colors.background.light,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  homeButton: {
    marginTop: 30,
    borderRadius: 8,
    width: '100%',
  },
  sendMoreButton: {
    marginTop: 16,
    borderRadius: 8,
    width: '100%',
    borderColor: Colors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default TransactionSuccessScreen;