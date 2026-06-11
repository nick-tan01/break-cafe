import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  
  const orderIdParam = params.order_id;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;

  // Real order number from the database
  const formattedOrderId = orderId ?? '—';

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="check-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Order Confirmed!
        </Text>
        
        <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
          Your order has been received and is being prepared.
        </Text>

        <View style={styles.orderDetails}>
          <Text style={[styles.detailLabel, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
            Order Number
          </Text>
          <Text style={[styles.detailValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            #{formattedOrderId}
          </Text>

          <Text style={[styles.detailLabel, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
            Estimated Pickup Time
          </Text>
          <Text style={[styles.detailValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            15-20 min
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.buttonText}>View Order Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 