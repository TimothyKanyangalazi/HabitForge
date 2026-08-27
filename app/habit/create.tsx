import { View, Text, StyleSheet } from 'react-native';

export default function CreateHabit() {
  return (
    <View style={styles.container}>
      <Text>Create Habit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});