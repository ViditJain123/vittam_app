import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, IconButton, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';
import { formatCurrency } from '../utils/helpers';

const TransactionHistoryScreen = () => {
  const { user, transactions, fetchTransactions } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to load transactions
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return 'arrow-up';
      case 'receive':
        return 'arrow-down';
      case 'add':
        return 'plus';
      default:
        return 'currency-inr';
    }
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send':
        return Colors.danger;
      case 'receive':
        return Colors.success;
      case 'add':
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  // Format transaction amount with sign
  const formatTransactionAmount = (amount: number, type: string) => {
    if (type === 'send') {
      return `- ${formatCurrency(amount)}`;
    } else if (type === 'receive' || type === 'add') {
      return `+ ${formatCurrency(amount)}`;
    }
    return formatCurrency(amount);
  };

  // Format transaction date
  const formatTransactionDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get transaction description
  const getTransactionDescription = (transaction: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currentUserVvitId = user?.vvitId || '';
    
    // Handle different transaction types
    if (transaction.type === 'send') {
      // When sending money, show recipient name or ID
      return `Sent to ${transaction.receiverVvitId}`;
    } else if (transaction.type === 'receive') {
      // When receiving money, show sender name or ID
      if (transaction.senderVvitId === "SYSTEM") {
        return 'Money added to wallet';
      }
      return `Received from ${transaction.senderVvitId}`;
    } else if (transaction.type === 'add') {
      // For adding money
      return 'Money added to wallet';
    }
    
    return 'Transaction';
  };

  // Protect route - redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Transaction History</Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="receipt"
            size={60}
            iconColor={Colors.lightGray}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card} mode="outlined">
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <IconButton
                    icon={getTransactionIcon(item.type)}
                    size={24}
                    iconColor={Colors.white}
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(item.type) },
                    ]}
                  />
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.transactionDescription}>
                    {getTransactionDescription(item)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(item.date)}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: getTransactionColor(item.type) },
                    ]}
                  >
                    {formatTransactionAmount(item.amount, item.type)}
                  </Text>
                  <Text
                    style={[
                      styles.transactionStatus,
                      {
                        color:
                          item.status === 'success'
                            ? Colors.success
                            : item.status === 'failed'
                            ? Colors.danger
                            : Colors.warning,
                      },
                    ]}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  transactionIcon: {
    margin: 0,
  },
  detailsContainer: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default TransactionHistoryScreen;