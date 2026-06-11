import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

interface Customization {
  id: string;
  name: string;
  options: string[];
  maxSelections: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isAvailable: boolean;
  customizations: Customization[];
}

interface FormData {
  name: string;
  price: string;
  category: string;
  description: string;
  isAvailable: boolean;
  customizations: Customization[];
}

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Drinks', label: 'Drinks' },
  { id: 'Food', label: 'Food' },
  { id: 'Desserts', label: 'Desserts' },
  { id: 'Snacks', label: 'Snacks' },
];

// Switch "off" track — neutral ink wash per the Daybreak admin mockup
const SWITCH_TRACK_OFF = 'rgba(35,43,58,0.16)';

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    price: 3.50,
    category: 'Coffee',
    description: 'Single shot of premium espresso',
    isAvailable: true,
    customizations: [
      {
        id: '1',
        name: 'Size',
        options: ['Single', 'Double', 'Triple'],
        maxSelections: 1
      },
      {
        id: '2',
        name: 'Milk',
        options: ['Whole', 'Skim', 'Almond', 'Soy'],
        maxSelections: 1
      }
    ]
  },
  {
    id: '2',
    name: 'Croissant',
    price: 4.50,
    category: 'Pastries',
    description: 'Buttery, flaky French-style croissant',
    isAvailable: true,
    customizations: [
      {
        id: '3',
        name: 'Filling',
        options: ['Plain', 'Chocolate', 'Almond'],
        maxSelections: 1
      }
    ]
  }
];

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    category: '',
    description: '',
    isAvailable: true,
    customizations: []
  });

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      isAvailable: true,
      customizations: []
    });
    setIsModalVisible(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description,
      isAvailable: item.isAvailable,
      customizations: [...item.customizations]
    });
    setIsModalVisible(true);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.price || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description,
      isAvailable: formData.isAvailable,
      customizations: formData.customizations
    };

    if (editingItem) {
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === editingItem.id ? newItem : item
        )
      );
    } else {
      setMenuItems(prevItems => [...prevItems, newItem]);
    }

    setIsModalVisible(false);
    Alert.alert('Success', `Item ${editingItem ? 'updated' : 'added'} successfully`);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
            Alert.alert('Success', 'Item deleted successfully');
          }
        }
      ]
    );
  };

  const handleAddCustomization = () => {
    const newCustomization: Customization = {
      id: Date.now().toString(),
      name: '',
      options: [],
      maxSelections: 1
    };
    setFormData(prev => ({
      ...prev,
      customizations: [...prev.customizations, newCustomization]
    }));
  };

  const handleUpdateCustomization = (index: number, field: keyof Customization, value: string | string[] | number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === index ? { ...custom, [field]: value } : custom
      )
    }));
  };

  const handleAddOption = (customizationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === customizationIndex
          ? { ...custom, options: [...custom.options, ''] }
          : custom
      )
    }));
  };

  const handleUpdateOption = (customizationIndex: number, optionIndex: number, value: string) => {
    if (!value.trim()) {
      Alert.alert('Error', 'Option cannot be empty');
      return;
    }
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === customizationIndex
          ? {
              ...custom,
              options: custom.options.map((opt, j) =>
                j === optionIndex ? value.trim() : opt
              )
            }
          : custom
      )
    }));
  };

  const handleRemoveCustomization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }));
  };

  const renderFilterCategory = ({ item }: { item: typeof FILTER_CATEGORIES[0] }) => {
    const count = item.id === 'all'
      ? menuItems.length
      : menuItems.filter(menuItem => menuItem.category === item.id).length;
    const isOn = selectedCategory === item.id;

    return (
      <TouchableOpacity
        style={[styles.filterChip, isOn && styles.filterChipOn]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Text style={[styles.filterChipText, isOn && styles.filterChipTextOn]}>
          {item.label}{' '}
          <Text style={[styles.filterChipCount, isOn && styles.filterChipCountOn]}>
            {count}
          </Text>
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={[styles.menuCard, !item.isAvailable && styles.menuCardOff]}>
      <View style={styles.menuCardHeader}>
        <View style={styles.menuCardTitleSection}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <View style={styles.menuMetaRow}>
            <Text style={styles.menuItemCategory}>{item.category}</Text>
            <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.menuCardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditItem(item)}
          >
            <Feather name="edit-3" size={14} color={colors.sage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Feather name="trash-2" size={14} color={colors.inkSoft} />
          </TouchableOpacity>
          <Switch
            value={item.isAvailable}
            onValueChange={(value) => {
              setMenuItems(prevItems =>
                prevItems.map(menuItem =>
                  menuItem.id === item.id
                    ? { ...menuItem, isAvailable: value }
                    : menuItem
                )
              );
            }}
            trackColor={{ false: SWITCH_TRACK_OFF, true: colors.sage }}
            thumbColor={colors.white}
            ios_backgroundColor={SWITCH_TRACK_OFF}
          />
        </View>
      </View>

      <Text style={styles.menuItemDescription}>{item.description}</Text>

      {item.customizations.length > 0 && (
        <View style={styles.customChips}>
          {item.customizations.map((custom) => (
            <View key={custom.id} style={styles.customChip}>
              <Text style={styles.customChipText}>
                <Text style={styles.customChipName}>{custom.name}</Text>
                {' · '}{custom.options.join(' / ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!item.isAvailable && (
        <View style={styles.hiddenTag}>
          <Text style={styles.hiddenTagText}>Hidden from menu</Text>
        </View>
      )}
    </View>
  );

  return (
    <GradientScreen>
      <View style={styles.container}>
        <View style={styles.searchField}>
          <Feather name="search" size={15} color={colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={colors.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          ListHeaderComponent={
            <FlatList
              data={FILTER_CATEGORIES}
              renderItem={renderFilterCategory}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterList}
              contentContainerStyle={styles.filterListContent}
            />
          }
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Feather name="plus" size={22} color={colors.white} />
        </TouchableOpacity>

        {/* Add/Edit Item Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Feather name="x" size={18} color={colors.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                    placeholder="Item name"
                    placeholderTextColor={colors.inkMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.price}
                    onChangeText={(value) => setFormData({ ...formData, price: value })}
                    placeholder="0.00"
                    placeholderTextColor={colors.inkMuted}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category *</Text>
                  <View style={styles.categoryButtons}>
                    {FILTER_CATEGORIES.filter(cat => cat.id !== 'all').map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          formData.category === category.id && styles.categoryButtonOn,
                        ]}
                        onPress={() => setFormData({ ...formData, category: category.id })}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          formData.category === category.id && styles.categoryButtonTextOn,
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Item description"
                    placeholderTextColor={colors.inkMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.availabilityRow}>
                    <Text style={[styles.formLabel, styles.formLabelInline]}>Available</Text>
                    <Switch
                      value={formData.isAvailable}
                      onValueChange={(value) => setFormData({ ...formData, isAvailable: value })}
                      trackColor={{ false: SWITCH_TRACK_OFF, true: colors.sage }}
                      thumbColor={colors.white}
                      ios_backgroundColor={SWITCH_TRACK_OFF}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.customizationHeader}>
                    <Text style={[styles.formLabel, styles.formLabelInline]}>Customizations</Text>
                    <TouchableOpacity
                      style={styles.addCustomizationButton}
                      onPress={handleAddCustomization}
                    >
                      <Feather name="plus" size={13} color={colors.sage} />
                      <Text style={styles.addCustomizationText}>Add Customization</Text>
                    </TouchableOpacity>
                  </View>

                  {formData.customizations.map((custom, index) => (
                    <View key={custom.id} style={styles.customizationForm}>
                      <TextInput
                        style={styles.formInput}
                        value={custom.name}
                        onChangeText={(value) => handleUpdateCustomization(index, 'name', value)}
                        placeholder="Customization name"
                        placeholderTextColor={colors.inkMuted}
                      />

                      <View style={styles.optionsHeader}>
                        <Text style={styles.optionsLabel}>Options</Text>
                        <TouchableOpacity
                          style={styles.addOptionButton}
                          onPress={() => handleAddOption(index)}
                        >
                          <Feather name="plus" size={12} color={colors.sage} />
                          <Text style={styles.addOptionText}>Add Option</Text>
                        </TouchableOpacity>
                      </View>

                      {custom.options.map((option, optionIndex) => (
                        <TextInput
                          key={optionIndex}
                          style={[styles.formInput, styles.optionInput]}
                          value={option}
                          onChangeText={(value) => handleUpdateOption(index, optionIndex, value)}
                          placeholder="Option name"
                          placeholderTextColor={colors.inkMuted}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { opacity: !formData.name || !formData.price || !formData.category ? 0.6 : 1 }
                  ]}
                  onPress={handleSaveItem}
                  disabled={!formData.name || !formData.price || !formData.category}
                >
                  <Text style={styles.saveButtonText}>
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginHorizontal: 22,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 13.5,
    color: colors.ink,
    paddingVertical: 12,
    marginLeft: 10,
  },
  filterList: {
    flexGrow: 0,
    marginBottom: 13,
  },
  filterListContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginRight: 8,
  },
  filterChipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  filterChipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  filterChipCount: {
    fontFamily: fonts.semibold,
    color: colors.inkMuted,
  },
  filterChipCountOn: {
    color: colors.white,
  },
  menuList: {
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  menuCard: {
    ...glassCard,
    borderRadius: 12,
    padding: 15,
    marginBottom: 11,
  },
  menuCardOff: {
    opacity: 0.78,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuCardTitleSection: {
    flex: 1,
    marginRight: 10,
  },
  menuItemName: {
    ...display(16.5),
  },
  menuMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  menuItemCategory: {
    ...overline(10.5),
    letterSpacing: 1.5,
  },
  menuItemPrice: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    letterSpacing: 0.5,
    color: colors.ink,
    marginLeft: 8,
  },
  menuCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.2)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemDescription: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.2,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 8,
  },
  customChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  customChip: {
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.28)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  customChipText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.inkSoft,
  },
  customChipName: {
    fontFamily: fonts.semibold,
    color: colors.sage,
  },
  hiddenTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 9,
  },
  hiddenTagText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  addButton: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.sage,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(35,43,58,0.45)',
  },
  modalContent: {
    backgroundColor: colors.gradient[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  modalTitle: {
    ...display(19),
    letterSpacing: 1.6,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    ...overline(10),
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  formLabelInline: {
    marginBottom: 0,
  },
  formInput: {
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.light,
    fontSize: 14,
    color: colors.ink,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  categoryButtonOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  categoryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  categoryButtonTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCustomizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addCustomizationText: {
    ...overline(9.5),
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  customizationForm: {
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  optionsLabel: {
    ...overline(9.5),
    letterSpacing: 1.4,
    color: colors.inkMuted,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  addOptionText: {
    ...overline(9),
    letterSpacing: 1.1,
    marginLeft: 5,
  },
  optionInput: {
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 22,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.2)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  saveButton: {
    ...primaryButton,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  saveButtonText: {
    ...primaryButtonText,
    fontSize: 12.5,
    letterSpacing: 1.8,
  },
});
