import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Define the API base URL
const API_URL = 'https://vittam.vercel.app/api';

interface User {
  id: string;
  name?: string;
  phone?: string;
  email: string;
  vvitId?: string;
  balance: number;
  isAuthenticated: boolean;
  hasCompletedBiometric: boolean;
  voiceAuthEnabled?: boolean;
  faceAuthEnabled?: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'send' | 'receive' | 'add';
  date: Date;
  senderVvitId?: string;
  receiverVvitId?: string;
  status: 'success' | 'failed' | 'pending';
}

interface RecipientInfo {
  name: string;
  vvitId: string;
}

interface AuthContextType {
  user: User | null;
  transactions: Transaction[];
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<string>;
  logout: () => void;
  completeBiometricSetup: (voiceEnabled?: boolean, faceEnabled?: boolean, voiceData?: string, faceData?: string) => Promise<boolean>;
  addMoney: (amount: number) => Promise<boolean>;
  sendMoney: (amount: number, receiverVvitId: string) => Promise<string>;
  lookupRecipient: (vvitId: string) => Promise<RecipientInfo | null>;
  fetchTransactions: () => Promise<void>;
  deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch transactions whenever the user changes
  useEffect(() => {
    if (user?.vvitId) {
      fetchTransactions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.vvitId]);

  // Fetch user's transaction history
  const fetchTransactions = async (): Promise<void> => {
    if (!user?.vvitId) return;
    
    try {
      const response = await fetch(`${API_URL}/transaction?vvitId=${user.vvitId}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.transactions)) {
        // Convert API transaction format to our app's format
        const formattedTransactions: Transaction[] = data.transactions.map((tx: any) => {
          // Determine if this is a self-transfer (sending to yourself)
          const isSelfTransfer = tx.senderVvitId === tx.receiverVvitId;
          
          // For transactions where the user is the recipient and it's not a self-transfer,
          // we'll set the type to 'receive'. Otherwise, use the original type.
          let type = tx.type;
          if (tx.receiverVvitId === user.vvitId && tx.senderVvitId !== "SYSTEM" && tx.type === 'receive') {
            type = 'receive';
          } else if (tx.senderVvitId === user.vvitId && tx.type === 'send') {
            type = 'send';
          } else if (tx.type === 'add') {
            type = 'add';
          }
          
          return {
            id: tx._id,
            amount: tx.amount,
            type: type,
            date: new Date(tx.createdAt),
            senderVvitId: tx.senderVvitId,
            receiverVvitId: tx.receiverVvitId,
            status: tx.status
          };
        });
        
        // Filter transactions to avoid duplicate entries for the same financial transaction
        // We need to filter out "receive" transactions where the user is also the sender
        const filteredTransactions = formattedTransactions.filter(tx => {
          // Keep all transactions except "receive" type where the user is also the sender
          return !(
            tx.type === 'receive' && 
            tx.senderVvitId === user.vvitId && 
            tx.receiverVvitId === user.vvitId
          );
        });
        
        // Also filter out duplicate transactions (those with the same transaction ID)
        const uniqueTransactions = Array.from(
          new Map(filteredTransactions.map(tx => [tx.id, tx])).values()
        );
        
        // Sort by date, newest first
        const sortedTransactions = uniqueTransactions.sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );
        
        setTransactions(sortedTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // User successfully logged in
        const userData = data.user;
        
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          vvitId: userData.vvitId,
          balance: userData.balance,
          isAuthenticated: true,
          hasCompletedBiometric: true, // Assuming biometric is already set up
          voiceAuthEnabled: userData.voiceAuthEnabled,
          faceAuthEnabled: userData.faceAuthEnabled,
        });
        
        return true;
      } else if (data.needsBiometricAuth) {
        // Handle biometric authentication requirements here
        // For now, we'll just consider it a failed login since we don't have the biometric functionality
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // User successfully registered
        const userData = data.user;
        
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          vvitId: userData.vvitId,
          balance: userData.balance,
          isAuthenticated: true,
          hasCompletedBiometric: false, // User needs to set up biometrics
          voiceAuthEnabled: false,
          faceAuthEnabled: false,
        });
        
        return userData.id;
      }
      
      throw new Error(data.message || 'Failed to register user');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTransactions([]);
  };

  const completeBiometricSetup = async (
    voiceEnabled = false, 
    faceEnabled = false, 
    voiceData?: string, 
    faceData?: string
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.vvitId,
          voiceAuthEnabled: voiceEnabled,
          faceAuthEnabled: faceEnabled,
          voiceData,
          faceData,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser({
          ...user,
          hasCompletedBiometric: true,
          voiceAuthEnabled: data.voiceAuthEnabled,
          faceAuthEnabled: data.faceAuthEnabled,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric setup error:', error);
      return false;
    }
  };

  // Look up a recipient by VVIT ID
  const lookupRecipient = async (vvitId: string): Promise<RecipientInfo | null> => {
    try {
      const response = await fetch(`${API_URL}/transaction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vvitId }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        return {
          name: data.user.name,
          vvitId: data.user.vvitId
        };
      }
      
      return null;
    } catch (error) {
      console.error('Recipient lookup error:', error);
      return null;
    }
  };

  const addMoney = async (amount: number): Promise<boolean> => {
    if (!user?.vvitId) return false;
    
    try {
      const response = await fetch(`${API_URL}/transaction`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vvitId: user.vvitId,
          amount,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update user balance
        setUser({
          ...user,
          balance: data.newBalance,
        });
        
        // Add new transaction to the state
        const newTransaction: Transaction = {
          id: data.transaction.id,
          amount: data.transaction.amount,
          type: 'add',
          date: new Date(data.transaction.createdAt),
          receiverVvitId: data.transaction.receiverVvitId,
          status: data.transaction.status
        };
        
        setTransactions([newTransaction, ...transactions]);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Add money error:', error);
      return false;
    }
  };

  const sendMoney = async (amount: number, receiverVvitId: string): Promise<string> => {
    if (!user?.vvitId) throw new Error('User not authenticated');
    if (user.balance < amount) throw new Error('Insufficient balance');
    
    try {
      const response = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderVvitId: user.vvitId,
          receiverVvitId,
          amount,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update user balance
        setUser({
          ...user,
          balance: data.senderNewBalance,
        });
        
        // Add new transaction to the state
        const newTransaction: Transaction = {
          id: data.transaction.id,
          amount,
          type: 'send',
          date: new Date(data.transaction.createdAt),
          senderVvitId: user.vvitId,
          receiverVvitId,
          status: 'success'
        };
        
        setTransactions([newTransaction, ...transactions]);
        
        return data.transaction.id;
      } else {
        throw new Error(data.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Send money error:', error);
      throw error;
    }
  };

  const deleteAccount = () => {
    setUser(null);
    setTransactions([]);
  };

  const value = {
    user,
    transactions,
    login,
    signUp,
    logout,
    completeBiometricSetup,
    addMoney,
    sendMoney,
    lookupRecipient,
    fetchTransactions,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add default export for the context
export default AuthContext;