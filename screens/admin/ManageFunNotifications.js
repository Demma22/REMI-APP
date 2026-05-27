import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../supabase';
import { useTheme } from '../../contexts/ThemeContext';
import SvgIcon from '../../components/SvgIcon';
import { getStyles } from './ManageFunNotifications.styles';
import ScreenHeader from '../../components/ScreenHeader';
import { ListSkeleton } from '../../components/SkeletonLoader';

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
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email || !ADMIN_EMAILS.includes(email)) {
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
      const { data, error } = await supabase
        .from('fun_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
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
      const { error } = await supabase.from('fun_notifications').insert({
        title: newTitle.trim(),
        body: newBody.trim(),
        category: selectedCategory,
        active: true,
        times_shown: 0,
        times_clicked: 0,
      });
      if (error) throw error;

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
      const { error } = await supabase
        .from('fun_notifications')
        .update({
          title: newTitle.trim(),
          body: newBody.trim(),
          category: selectedCategory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNotification.id);
      if (error) throw error;

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
      const { error } = await supabase
        .from('fun_notifications')
        .update({ active: !notification.active, updated_at: new Date().toISOString() })
        .eq('id', notification.id);
      if (error) throw error;
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
              const { error } = await supabase.from('fun_notifications').delete().eq('id', id);
              if (error) throw error;
              loadNotifications();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
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
      <ScreenHeader
        title="Fun Notifications"
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <SvgIcon name="edit" size={24} color='white' />
          </TouchableOpacity>
        }
      />

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
          <ListSkeleton />
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

                {item.times_sent > 0 && (
                  <Text style={[styles.sentInfo, { color: theme.colors.textTertiary }]}>
                    Sent {item.times_sent} time{item.times_sent !== 1 ? 's' : ''}
                    {item.last_sent_at && ` • Last: ${new Date(item.last_sent_at).toLocaleDateString()}`}
                  </Text>
                )}

                <View style={styles.notificationFooter}>
                  <Text style={[styles.notificationMeta, { color: theme.colors.textTertiary }]}>
                    Created: {new Date(item.created_at).toLocaleDateString()}
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
