import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';
import { formatCurrency, formatDate } from '../utils/helpers';

// Define a Transaction interface to fix the "any" type warning
interface Transaction {
  id: string;
  amount: number;
  type: 'send' | 'receive' | 'add';
  date: Date;
  userId?: string;
}

const HomeScreen = () => {
  const { user, transactions, addMoney } = useAuth();
  const router = useRouter();
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const handleAddMoney = () => {
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    addMoney(amountValue);
    setAddMoneyModalVisible(false);
    setAmount('');
    setAmountError('');
  };

  const navigateToSendMoney = () => {
    router.push('/screens/send-money');
  };

  // Render a transaction item with proper typing
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isReceiveOrAdd = item.type === 'receive' || item.type === 'add';
    
    return (
      <Card style={styles.transactionCard}>
        <Card.Content style={styles.transactionContent}>
          <Avatar.Icon 
            icon={isReceiveOrAdd ? "arrow-down" : "arrow-up"} 
            size={40}
            style={{ backgroundColor: isReceiveOrAdd ? Colors.accent : Colors.secondary }}
          />
          
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>
              {item.type === 'send' ? 'Sent Money' : 
               item.type === 'receive' ? 'Received Money' : 'Added Money'}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(new Date(item.date))}</Text>
            {item.userId && <Text style={styles.transactionUser}>ID: {item.userId}</Text>}
          </View>
          
          <Text 
            style={[
              styles.transactionAmount,
              { color: isReceiveOrAdd ? Colors.success : Colors.danger }
            ]}
          >
            {isReceiveOrAdd ? '+ ' : '- '}{formatCurrency(item.amount)}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Balance Section */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceTitle}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {user ? formatCurrency(user.balance) : '₹0.00'}
            </Text>
            <Text style={styles.userId}>User ID: {user?.vvitId || 'Not logged in'}</Text>
          </Card.Content>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setAddMoneyModalVisible(true)}
          >
            <Avatar.Icon icon="wallet-plus" size={50} style={styles.actionIcon} color={Colors.white} />
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToSendMoney}
          >
            <Avatar.Icon icon="send" size={50} style={[styles.actionIcon, { backgroundColor: Colors.secondary }]} color={Colors.white} />
            <Text style={styles.actionText}>Send Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert('Account freeze feature coming soon')}
          >
            <Avatar.Icon icon="lock" size={50} style={[styles.actionIcon, { backgroundColor: Colors.danger }]} color={Colors.white} />
            <Text style={styles.actionText}>Freeze</Text>
          </TouchableOpacity>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Transactions History */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.transactionsTitle}>Transaction History</Text>
          
          {transactions.length === 0 ? (
            <Text style={styles.noTransactionsText}>No transactions yet</Text>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.transactionsList}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Add Money Modal */}
      <Modal
        visible={addMoneyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddMoneyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setAddMoneyModalVisible(false)}
              />
            </View>
            
            <Divider style={styles.modalDivider} />
            
            <TextInput
              label="Amount (₹)"
              value={amount}
              onChangeText={(text) => {
                setAmount(text.replace(/[^0-9.]/g, ''));
                setAmountError('');
              }}
              mode="outlined"
              keyboardType="numeric"
              error={!!amountError}
              style={styles.modalInput}
              theme={{ colors: { primary: Colors.primary } }}
            />
            {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}
            
            <Text style={styles.modalInfo}>
              In a real app, this would connect to a payment gateway. For this demo, we&apos;ll simply add the amount to your balance.
            </Text>
            
            <Button
              mode="contained"
              onPress={handleAddMoney}
              style={styles.modalButton}
              buttonColor={Colors.primary}
            >
              Add Money
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    elevation: 4,
    marginTop: 50,
  },
  balanceTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  userId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 24,
    backgroundColor: Colors.lightGray,
  },
  transactionsContainer: {
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noTransactionsText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    elevation: 2,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 2,
  },
  transactionUser: {
    fontSize: 12,
    color: Colors.darkGray,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalDivider: {
    marginVertical: 16,
    backgroundColor: Colors.lightGray,
  },
  modalInput: {
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    marginTop: -12,
    marginBottom: 12,
    fontSize: 12,
  },
  modalInfo: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalButton: {
    borderRadius: 8,
  },
});

export default HomeScreen;
