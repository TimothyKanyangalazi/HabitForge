import { View, Text, StyleSheet } from 'react-native';

export default function EditHabit() {
  return (
    <View style={styles.container}>
      <Text>Edit Habit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});