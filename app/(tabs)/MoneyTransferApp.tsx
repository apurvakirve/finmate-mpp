import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function MoneyTransferApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [loading, setLoading] = useState(false);

  // QR Code States
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [qrRecipient, setQrRecipient] = useState<any>(null);
  const [qrAmount, setQrAmount] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  // Use refs to prevent infinite loops
  const currentUserRef = useRef(currentUser);
  const usersRef = useRef(users);

  // Update refs when state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
    usersRef.current = users;
  }, [currentUser, users]);

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchTransactions();
      const cleanup = setupRealtime();
      return cleanup;
    }
  }, [currentUser]);

  const setupRealtime = () => {
    // Users changes
    const userSubscription = supabase
      .channel('users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        (payload: any) => {
          fetchUsers();
          
          if (currentUserRef.current && payload.new && payload.new.id === currentUserRef.current.id) {
            setCurrentUser(payload.new);
          }
        }
      )
      .subscribe();

    // Transactions changes
    const transactionSubscription = supabase
      .channel('transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const newUsers = data || [];
      setUsers(newUsers);
      
      if (currentUserRef.current) {
        const updatedCurrentUser = newUsers.find((user: any) => user.id === currentUserRef.current.id);
        if (updatedCurrentUser && updatedCurrentUser.balance !== currentUserRef.current.balance) {
          setCurrentUser(updatedCurrentUser);
        }
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.log('Error fetching transactions:', error);
    }
  };

  // Generate QR Code Data for current user
  const generateQRData = () => {
    if (!currentUser) return '';
    const qrData = {
      type: 'money_request',
      userId: currentUser.id,
      userName: currentUser.name,
      email: currentUser.email,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData);
  };

  // Handle QR Code Scan
  const handleQRScan = ({ data }: { data: string }) => {
    setShowQRScanner(false);
    
    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'money_request') {
        setQrRecipient(qrData);
        setShowAmountModal(true);
      } else {
        Alert.alert('Invalid QR', 'This is not a valid money transfer QR code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code format.');
    }
  };

  // Handle QR payment with custom modal
  const handleQRPayment = async () => {
    if (!qrRecipient) return;
    
    const amt = parseFloat(qrAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    setLoading(true);
    setShowAmountModal(false);

    try {
      const sender = usersRef.current.find(u => u.id === currentUser.id);
      const receiver = usersRef.current.find(u => u.id === qrRecipient.userId);

      if (!sender || !receiver) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const senderBalance = parseFloat(sender.balance);
      const receiverBalance = parseFloat(receiver.balance);

      if (senderBalance < amt) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }

      // Calculate new balances
      const senderNewBalance = senderBalance - amt;
      const receiverNewBalance = receiverBalance + amt;

      // Update sender in database
      const { error: senderError } = await supabase
        .from('users')
        .update({ balance: senderNewBalance })
        .eq('id', sender.id);

      if (senderError) throw senderError;

      // Update receiver in database
      const { error: receiverError } = await supabase
        .from('users')
        .update({ balance: receiverNewBalance })
        .eq('id', receiver.id);

      if (receiverError) throw receiverError;

      // Create transaction
      await supabase.from('transactions').insert({
        from_user_id: sender.id,
        to_user_id: receiver.id,
        from_name: sender.name,
        to_name: receiver.name,
        amount: amt,
        type: 'transfer',
        method: 'qr_code',
      });

      // Update current user immediately
      if (currentUser.id === sender.id) {
        setCurrentUser({ ...currentUser, balance: senderNewBalance });
      }

      Alert.alert('Success', `$${amt} sent to ${receiver.name} via QR code!`);
      setQrAmount('');
      setQrRecipient(null);

    } catch (error) {
      console.log('QR Transaction error:', error);
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password.trim())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Invalid email or password');
        return;
      }

      setCurrentUser(data);
      setEmail('');
      setPassword('');
      
      Alert.alert('Success', `Welcome ${data.name}!`);
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }

    setLoading(true);

    try {
      if (currentUser.role === 'bank') {
        if (!transactionType) {
          Alert.alert('Error', 'Please select Add or Deduct');
          return;
        }

        const targetUser = usersRef.current.find(u => u.id == selectedUser);
        if (!targetUser) {
          Alert.alert('Error', 'User not found');
          return;
        }

        let newBalance = parseFloat(targetUser.balance);
        if (transactionType === 'add') {
          newBalance += amt;
        } else {
          if (newBalance < amt) {
            Alert.alert('Error', 'Insufficient balance');
            return;
          }
          newBalance -= amt;
        }

        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', selectedUser);

        if (error) throw error;

        await supabase.from('transactions').insert({
          from_user_id: currentUser.id,
          to_user_id: parseInt(selectedUser),
          from_name: currentUser.name,
          to_name: targetUser.name,
          amount: amt,
          type: transactionType,
        });

        Alert.alert('Success', `$${amt} ${transactionType}ed to ${targetUser.name}`);

      } else {
        const sender = usersRef.current.find(u => u.id === currentUser.id);
        const receiver = usersRef.current.find(u => u.id == selectedUser);

        if (!sender || !receiver) {
          Alert.alert('Error', 'User not found');
          return;
        }

        const senderBalance = parseFloat(sender.balance);
        const receiverBalance = parseFloat(receiver.balance);

        if (senderBalance < amt) {
          Alert.alert('Error', 'Insufficient balance');
          return;
        }

        const senderNewBalance = senderBalance - amt;
        const receiverNewBalance = receiverBalance + amt;

        const { error: senderError } = await supabase
          .from('users')
          .update({ balance: senderNewBalance })
          .eq('id', sender.id);

        if (senderError) throw senderError;

        const { error: receiverError } = await supabase
          .from('users')
          .update({ balance: receiverNewBalance })
          .eq('id', receiver.id);

        if (receiverError) throw receiverError;

        await supabase.from('transactions').insert({
          from_user_id: sender.id,
          to_user_id: receiver.id,
          from_name: sender.name,
          to_name: receiver.name,
          amount: amt,
          type: 'transfer',
        });

        if (currentUser.id === sender.id) {
          setCurrentUser({ ...currentUser, balance: senderNewBalance });
        }

        Alert.alert('Success', `$${amt} sent to ${receiver.name}`);
      }

      setAmount('');
      setSelectedUser('');
      setTransactionType('');

    } catch (error) {
      console.log('Transaction error:', error);
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsers([]);
    setTransactions([]);
  };

  const refreshCurrentUser = async () => {
    if (currentUser) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (!error && data) {
        setCurrentUser(data);
      }
    }
  };

  // Request camera permission for QR scanning
  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  // Loading screen
  if (loading && !currentUser) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Login screen
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginBox}>
          <Icon name="dollar-sign" size={50} color="#007AFF" />
          <Text style={styles.title}>Money Transfer App</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo Accounts:</Text>
            <Text style={styles.demoText}>user1@example.com / user123</Text>
            <Text style={styles.demoText}>user2@example.com / user123</Text>
            <Text style={styles.demoText}>bank@example.com / bank123</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main app screen
  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userRole}>{currentUser.role.toUpperCase()}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={refreshCurrentUser} style={styles.refreshButton}>
            <Icon name="refresh-cw" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>${parseFloat(currentUser.balance).toFixed(2)}</Text>
      </View>

      {/* Quick Actions - QR Code Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => {
            requestCameraPermission();
            setShowQRScanner(true);
          }}
        >
          <Icon name="camera" size={24} color="#007AFF" />
          <Text style={styles.qrButtonText}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => setShowMyQR(true)}
        >
          <Icon name="maximize" size={24} color="#007AFF" />
          <Text style={styles.qrButtonText}>My QR</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Form */}
      <View style={styles.form}>
        {currentUser.role === 'bank' ? (
          <>
            <Text style={styles.sectionTitle}>Manage User Balance</Text>
            <FlatList
              data={users.filter(u => u.role === 'user')}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    selectedUser === item.id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedUser(item.id)}
                >
                  <Text style={styles.userItemText}>
                    {item.name} - ${parseFloat(item.balance).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.flatList}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  transactionType === 'add' && styles.activeAdd
                ]}
                onPress={() => setTransactionType('add')}
              >
                <Text style={styles.actionButtonText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  transactionType === 'deduct' && styles.activeDeduct
                ]}
                onPress={() => setTransactionType('deduct')}
              >
                <Text style={styles.actionButtonText}>Deduct Money</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Send Money To</Text>
            <FlatList
              data={users.filter(u => u.id !== currentUser.id && u.role === 'user')}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    selectedUser === item.id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedUser(item.id)}
                >
                  <Text style={styles.userItemText}>
                    {item.name} - ${parseFloat(item.balance).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.flatList}
            />
          </>
        )}

        <TextInput
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#666"
        />

        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={handleTransaction}
          disabled={loading || !amount || !selectedUser}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.sendButtonText}>
              {currentUser.role === 'bank' ? 'Execute' : 'Send Money'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionNames}>
                {item.from_name} → {item.to_name}
              </Text>
              <Text style={styles.transactionType}>
                {item.type} • {new Date(item.timestamp).toLocaleDateString()}
                {item.method === 'qr_code' && ' • QR Code'}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { 
                color: item.type === 'add' ? 'green' : 
                       item.type === 'deduct' ? 'red' : 'blue' 
              }
            ]}>
              ${parseFloat(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
        style={styles.transactionList}
      />

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan QR Code</Text>
            <TouchableOpacity onPress={() => setShowQRScanner(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {permission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={showQRScanner ? handleQRScan : undefined}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerText}>Align QR code within frame</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* My QR Code Modal */}
      <Modal
        visible={showMyQR}
        animationType="slide"
        onRequestClose={() => setShowMyQR(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My QR Code</Text>
            <TouchableOpacity onPress={() => setShowMyQR(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan to Pay Me</Text>
            <Text style={styles.qrSubtitle}>{currentUser.name}</Text>
            
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={generateQRData()}
                size={250}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <Text style={styles.qrInstruction}>
              Ask others to scan this QR code to send you money instantly
            </Text>
            
            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoText}>Name: {currentUser.name}</Text>
              <Text style={styles.qrInfoText}>Email: {currentUser.email}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Amount Input Modal for QR Payments */}
      <Modal
        visible={showAmountModal}
        animationType="slide"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Money</Text>
            <TouchableOpacity onPress={() => setShowAmountModal(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.amountModalContent}>
            <Text style={styles.amountModalRecipient}>
              Send to: {qrRecipient?.userName}
            </Text>
            <Text style={styles.amountModalEmail}>
              {qrRecipient?.email}
            </Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={qrAmount}
                  onChangeText={setQrAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  autoFocus
                />
              </View>
            </View>
            
            <View style={styles.quickAmounts}>
              <Text style={styles.quickAmountsTitle}>Quick Amounts</Text>
              <View style={styles.quickAmountButtons}>
                {[10, 20, 50, 100, 200, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setQrAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>${amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!qrAmount || isNaN(parseFloat(qrAmount)) || parseFloat(qrAmount) <= 0) && styles.disabledButton
              ]}
              onPress={handleQRPayment}
              disabled={!qrAmount || isNaN(parseFloat(qrAmount)) || parseFloat(qrAmount) <= 0}
            >
              <Text style={styles.sendButtonText}>
                Send ${qrAmount || '0.00'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loginBox: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: 'white',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  loginText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  demoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  demoText: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 10,
  },
  logoutButton: {
    padding: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    color: 'gray',
    fontSize: 14,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  balance: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  // Quick Actions Styles
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  qrButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  qrButtonText: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  form: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  flatList: {
    maxHeight: 150,
  },
  userItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#f9f9f9',
  },
  selectedItem: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  userItemText: {
    fontSize: 16,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
  },
  activeAdd: {
    borderColor: 'green',
    backgroundColor: '#e8f5e8',
  },
  activeDeduct: {
    borderColor: 'red',
    backgroundColor: '#ffeaea',
  },
  actionButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNames: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  transactionType: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionList: {
    flex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  qrContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  qrSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  qrInstruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  qrInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  qrInfoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  // Amount Modal Styles
  amountModalContent: {
    flex: 1,
    padding: 20,
  },
  amountModalRecipient: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  amountModalEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  amountInputContainer: {
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quickAmounts: {
    marginBottom: 30,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '30%',
    alignItems: 'center',
  },
  quickAmountText: {
    fontWeight: 'bold',
    color: '#333',
  },
});