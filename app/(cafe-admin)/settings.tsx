import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors, fonts, glassCard, overline } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

// Mock cafe data
const INITIAL_CAFE_DATA = {
  name: "The Coffee House",
  address: "123 Coffee Street, City, State, 10001",
  phone: "(555) 123-4567",
  email: "info@thecoffeehouse.com",
  description: "A cozy cafe specializing in artisanal coffee and fresh pastries, serving the community since 2018.",
  image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2047&q=80",
  openingHours: {
    monday: { open: "07:00", close: "18:00", isOpen: true },
    tuesday: { open: "07:00", close: "18:00", isOpen: true },
    wednesday: { open: "07:00", close: "18:00", isOpen: true },
    thursday: { open: "07:00", close: "18:00", isOpen: true },
    friday: { open: "07:00", close: "19:00", isOpen: true },
    saturday: { open: "08:00", close: "19:00", isOpen: true },
    sunday: { open: "08:00", close: "16:00", isOpen: true },
  },
  notifications: {
    newOrders: true,
    orderStatus: true,
    reviews: true,
    promotions: false,
  }
};

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface OpeningHours {
  open: string;
  close: string;
  isOpen: boolean;
}

interface CafeData {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  image: string;
  openingHours: Record<DayOfWeek, OpeningHours>;
  notifications: {
    newOrders: boolean;
    orderStatus: boolean;
    reviews: boolean;
    promotions: boolean;
  };
}

export default function SettingsScreen() {
  const router = useRouter();
  const [cafeData, setCafeData] = useState<CafeData>(INITIAL_CAFE_DATA);
  const [activeSection, setActiveSection] = useState<'basic' | 'hours' | 'notifications'>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CafeData>(INITIAL_CAFE_DATA);

  const handleSave = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation (basic format: (XXX) XXX-XXXX)
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(editedData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number in format (XXX) XXX-XXXX');
      return;
    }

    setCafeData(editedData);
    setIsEditing(false);
    Alert.alert('Success', 'Settings saved successfully');
  };

  const handleSignOut = () => {
    // Sign out logic
    router.push('/(cafe-admin)/login');
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEditedData(prev => ({
        ...prev,
        image: result.assets[0].uri
      }));
    }
  };

  const updateOpeningHours = (day: DayOfWeek, field: keyof OpeningHours, value: string | boolean) => {
    setEditedData({
      ...cafeData,
      openingHours: {
        ...cafeData.openingHours,
        [day]: {
          ...cafeData.openingHours[day],
          [field]: value
        }
      }
    });
  };

  const updateNotification = (key: keyof CafeData['notifications'], value: boolean) => {
    setEditedData({
      ...cafeData,
      notifications: {
        ...cafeData.notifications,
        [key]: value
      }
    });
  };

  const renderBasicInfoSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.cardHeading}>Basic Info</Text>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: editedData.image }}
          style={styles.cafeImage}
        />
        {isEditing && (
          <TouchableOpacity style={styles.editImageButton} onPress={handleImagePick}>
            <FontAwesome name="camera" size={17} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.fieldCard, isEditing && styles.fieldCardEditing]}>
        <Text style={styles.fieldLabel}>Cafe Name</Text>
        <TextInput
          style={styles.fieldInput}
          value={editedData.name}
          onChangeText={(text) => setEditedData({...editedData, name: text})}
          editable={isEditing}
        />
      </View>

      <View style={[styles.fieldCard, isEditing && styles.fieldCardEditing]}>
        <Text style={styles.fieldLabel}>Address</Text>
        <TextInput
          style={styles.fieldInput}
          value={editedData.address}
          onChangeText={(text) => setEditedData({...editedData, address: text})}
          editable={isEditing}
          multiline
        />
      </View>

      <View style={[styles.fieldCard, isEditing && styles.fieldCardEditing]}>
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={styles.fieldInput}
          value={editedData.phone}
          onChangeText={(text) => setEditedData({...editedData, phone: text})}
          editable={isEditing}
          keyboardType="phone-pad"
        />
      </View>

      <View style={[styles.fieldCard, isEditing && styles.fieldCardEditing]}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.fieldInput}
          value={editedData.email}
          onChangeText={(text) => setEditedData({...editedData, email: text})}
          editable={isEditing}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.fieldCard, isEditing && styles.fieldCardEditing]}>
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputArea]}
          value={editedData.description}
          onChangeText={(text) => setEditedData({...editedData, description: text})}
          editable={isEditing}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderHoursSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.cardHeading}>Opening Hours</Text>
      {(Object.keys(cafeData.openingHours) as DayOfWeek[]).map((day, index) => (
        <View key={day} style={[styles.hourRow, index > 0 && styles.rowDivider]}>
          <Text style={styles.dayLabel}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </Text>

          <View style={styles.hoursContainer}>
            <Switch
              value={cafeData.openingHours[day].isOpen}
              onValueChange={(value) => updateOpeningHours(day, 'isOpen', value)}
              disabled={!isEditing}
              trackColor={{ true: colors.sage }}
              thumbColor={colors.white}
            />

            {cafeData.openingHours[day].isOpen && (
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.timeInput, isEditing && styles.timeInputEditing]}
                  value={cafeData.openingHours[day].open}
                  onChangeText={(text) => updateOpeningHours(day, 'open', text)}
                  editable={isEditing}
                />
                <Text style={styles.timeTo}>to</Text>
                <TextInput
                  style={[styles.timeInput, isEditing && styles.timeInputEditing]}
                  value={cafeData.openingHours[day].close}
                  onChangeText={(text) => updateOpeningHours(day, 'close', text)}
                  editable={isEditing}
                />
              </View>
            )}

            {!cafeData.openingHours[day].isOpen && (
              <Text style={styles.closedText}>Closed</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.cardHeading}>Notifications</Text>
      <View style={styles.notificationRow}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>New Orders</Text>
          <Text style={styles.notificationDescription}>
            Receive notifications when a new order is placed
          </Text>
        </View>
        <Switch
          value={cafeData.notifications.newOrders}
          onValueChange={(value) => updateNotification('newOrders', value)}
          trackColor={{ true: colors.sage }}
          thumbColor={colors.white}
        />
      </View>

      <View style={[styles.notificationRow, styles.rowDivider]}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>Order Status Updates</Text>
          <Text style={styles.notificationDescription}>
            Receive notifications when an order status changes
          </Text>
        </View>
        <Switch
          value={cafeData.notifications.orderStatus}
          onValueChange={(value) => updateNotification('orderStatus', value)}
          trackColor={{ true: colors.sage }}
          thumbColor={colors.white}
        />
      </View>

      <View style={[styles.notificationRow, styles.rowDivider]}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>New Reviews</Text>
          <Text style={styles.notificationDescription}>
            Receive notifications when a customer leaves a review
          </Text>
        </View>
        <Switch
          value={cafeData.notifications.reviews}
          onValueChange={(value) => updateNotification('reviews', value)}
          trackColor={{ true: colors.sage }}
          thumbColor={colors.white}
        />
      </View>

      <View style={[styles.notificationRow, styles.rowDivider]}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>Promotions</Text>
          <Text style={styles.notificationDescription}>
            Receive notifications about new platform features and promotions
          </Text>
        </View>
        <Switch
          value={cafeData.notifications.promotions}
          onValueChange={(value) => updateNotification('promotions', value)}
          trackColor={{ true: colors.sage }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );

  return (
    <GradientScreen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
            >
              <Text style={styles.headerButtonText}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'basic' && styles.tabChipOn]}
            onPress={() => setActiveSection('basic')}
          >
            <Text style={[styles.tabChipText, activeSection === 'basic' && styles.tabChipTextOn]}>
              Basic Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'hours' && styles.tabChipOn]}
            onPress={() => setActiveSection('hours')}
          >
            <Text style={[styles.tabChipText, activeSection === 'hours' && styles.tabChipTextOn]}>
              Hours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'notifications' && styles.tabChipOn]}
            onPress={() => setActiveSection('notifications')}
          >
            <Text style={[styles.tabChipText, activeSection === 'notifications' && styles.tabChipTextOn]}>
              Notifications
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            {activeSection === 'basic' && renderBasicInfoSection()}
            {activeSection === 'hours' && renderHoursSection()}
            {activeSection === 'notifications' && renderNotificationsSection()}
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Feather name="log-out" size={17} color={colors.inkSoft} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 13,
  },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginHorizontal: 4,
  },
  tabChipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tabChipText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  tabChipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  card: {
    ...glassCard,
    borderRadius: 12,
    marginBottom: 13,
  },
  sectionContent: {
    padding: 17,
  },
  cardHeading: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 14,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  cafeImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCard: {
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 11,
  },
  fieldCardEditing: {
    borderColor: colors.sageBorder,
  },
  fieldLabel: {
    ...overline(9.5),
    letterSpacing: 1.6,
  },
  fieldInput: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    letterSpacing: 0.3,
    color: colors.ink,
    padding: 0,
    marginTop: 5,
  },
  fieldInputArea: {
    minHeight: 84,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  dayLabel: {
    width: 86,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  hoursContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  timeInput: {
    width: 60,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassSoft,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  timeInputEditing: {
    borderColor: colors.sageBorder,
  },
  timeTo: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkSoft,
    marginHorizontal: 7,
  },
  closedText: {
    marginLeft: 12,
    fontFamily: fonts.light,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.inkMuted,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    letterSpacing: 0.4,
    color: colors.ink,
    marginBottom: 3,
  },
  notificationDescription: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    lineHeight: 17,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.2)',
    backgroundColor: colors.glassSoft,
    marginBottom: 30,
  },
  signOutButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginLeft: 9,
  },
  headerButton: {
    paddingHorizontal: 16,
  },
  headerButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.sage,
  },
});
