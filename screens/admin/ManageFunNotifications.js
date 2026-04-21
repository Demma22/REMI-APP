import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { auth, db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useTheme } from '../../contexts/ThemeContext';
import SvgIcon from '../../components/SvgIcon';

// Admin email list - add your admin emails here
const ADMIN_EMAILS = ['denis@gmail.com', 'your-email@gmail.com'];

export default function ManageFunNotifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fun');
  const [saving, setSaving] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const { theme } = useTheme();

  const categories = [
    { id: 'fun', name: 'Fun 😄', color: '#F59E0B', emoji: '😄' },
    { id: 'motivation', name: 'Motivation 💪', color: '#10B981', emoji: '💪' },
    { id: 'wellness', name: 'Wellness 🧘', color: '#3B82F6', emoji: '🧘' },
    { id: 'productivity', name: 'Productivity 🎯', color: '#8B5CF6', emoji: '🎯' },
    { id: 'holiday', name: 'Holiday 🎉', color: '#EF4444', emoji: '🎉' },
    { id: 'exam', name: 'Exam 📝', color: '#EC489A', emoji: '📝' }
  ];

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    loadNotifications();
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'fun_notifications'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsList = [];
      querySnapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        });
      });
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleAddNotification = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert('Error', 'Please fill in both title and body');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'fun_notifications'), {
        title: newTitle.trim(),
        body: newBody.trim(),
        category: selectedCategory,
        active: true,
        createdAt: new Date(),
        timesShown: 0,
        timesClicked: 0
      });
      
      Alert.alert('Success', 'Notification added successfully!');
      setModalVisible(false);
      setNewTitle('');
      setNewBody('');
      setSelectedCategory('fun');
      loadNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
      Alert.alert('Error', 'Failed to add notification');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNotification = async () => {
    if (!editingNotification) return;
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert('Error', 'Please fill in both title and body');
      return;
    }

    setSaving(true);
    try {
      const notificationRef = doc(db, 'fun_notifications', editingNotification.id);
      await updateDoc(notificationRef, {
        title: newTitle.trim(),
        body: newBody.trim(),
        category: selectedCategory,
        updatedAt: new Date()
      });
      
      Alert.alert('Success', 'Notification updated successfully!');
      setEditModalVisible(false);
      setEditingNotification(null);
      setNewTitle('');
      setNewBody('');
      loadNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      Alert.alert('Error', 'Failed to update notification');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (notification) => {
    try {
      const notificationRef = doc(db, 'fun_notifications', notification.id);
      await updateDoc(notificationRef, {
        active: !notification.active,
        updatedAt: new Date()
      });
      loadNotifications();
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert('Error', 'Failed to update notification status');
    }
  };

  const handleDeleteNotification = async (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to permanently delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'fun_notifications', id));
              loadNotifications();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (notification) => {
    setEditingNotification(notification);
    setNewTitle(notification.title);
    setNewBody(notification.body);
    setSelectedCategory(notification.category || 'fun');
    setEditModalVisible(true);
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fun Notifications</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <SvgIcon name="edit" size={24} color='white' />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.statNumber}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.statNumber}>{notifications.filter(n => n.active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.statNumber}>{notifications.filter(n => !n.active).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.primaryLight }]}>
        <SvgIcon name="info" size={20} color={theme.colors.primary} />
        <Text style={[styles.infoText, { color: theme.colors.primary }]}>
          Notifications added here will be randomly sent to users every 2-4 days.
          No need to send manually!
        </Text>
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="smile" size={60} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first fun notification</Text>
          </View>
        ) : (
          notifications.map((item) => {
            const category = categories.find(c => c.id === item.category) || categories[0];
            return (
              <View key={item.id} style={[styles.notificationCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.notificationHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                    <Text style={[styles.categoryText, { color: category.color }]}>
                      {category.name}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: item.active ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: item.active ? '#10B981' : '#EF4444' }]}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.notificationTitle, { color: theme.colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.notificationBody, { color: theme.colors.textSecondary }]}>
                  {item.body}
                </Text>

                {item.timesSent > 0 && (
                  <Text style={[styles.sentInfo, { color: theme.colors.textTertiary }]}>
                    Sent {item.timesSent} time{item.timesSent !== 1 ? 's' : ''}
                    {item.lastSentAt && ` • Last: ${item.lastSentAt.toDate().toLocaleDateString()}`}
                  </Text>
                )}

                <View style={styles.notificationFooter}>
                  <Text style={[styles.notificationMeta, { color: theme.colors.textTertiary }]}>
                    Created: {item.createdAt.toLocaleDateString()}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                      <SvgIcon name="edit" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleToggleActive(item)} style={styles.actionButton}>
                      <SvgIcon name={item.active ? "eye-off" : "eye"} size={18} color={theme.colors.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNotification(item.id)} style={styles.actionButton}>
                      <SvgIcon name="trash" size={18} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Notification Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add Fun Notification</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <SvgIcon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { 
                borderColor: theme.colors.border, 
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.background
              }]}
              placeholder="Title"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: theme.colors.border, 
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.background
              }]}
              placeholder="Message body"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={newBody}
              onChangeText={setNewBody}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryButtonSelected,
                    { backgroundColor: cat.color + '20', borderColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.categoryButtonText, { color: cat.color }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, saving && styles.addButtonDisabled]}
                onPress={handleAddNotification}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Notification Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Edit Notification</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <SvgIcon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { 
                borderColor: theme.colors.border, 
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.background
              }]}
              placeholder="Title"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: theme.colors.border, 
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.background
              }]}
              placeholder="Message body"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={newBody}
              onChangeText={setNewBody}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryButtonSelected,
                    { backgroundColor: cat.color + '20', borderColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.categoryButtonText, { color: cat.color }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, saving && styles.addButtonDisabled]}
                onPress={handleEditNotification}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sentInfo: {
    fontSize: 11,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  notificationMeta: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryList: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryButtonSelected: {
    borderWidth: 2,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 0.3,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});