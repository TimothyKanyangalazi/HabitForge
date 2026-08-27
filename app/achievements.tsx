import { View, Text, StyleSheet } from 'react-native';

export default function Achievements() {
  return (
    <View style={styles.container}>
      <Text>Achievements</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});