import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Target } from 'lucide-react-native';

export default function OutcomesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>12-Week Outcomes</Text>
          <Text style={styles.subtitle}>Define your identity-level goals</Text>
        </View>

        <View style={styles.placeholder}>
          <Target size={64} color="#D1D5DB" />
          <Text style={styles.placeholderTitle}>No outcomes yet</Text>
          <Text style={styles.placeholderText}>
            Start by defining what you want to achieve in the next 12 weeks
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF9F3',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
});