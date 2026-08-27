import { View, Text, StyleSheet } from 'react-native';

export default function ExcusesList() {
  return (
    <View style={styles.container}>
      <Text>Excuse Log</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});