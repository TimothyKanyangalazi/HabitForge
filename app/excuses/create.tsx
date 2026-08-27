import { View, Text, StyleSheet } from 'react-native';

export default function CreateExcuse() {
  return (
    <View style={styles.container}>
      <Text>Log Excuse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});