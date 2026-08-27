import { View, Text, StyleSheet } from 'react-native';

export default function RoutineTemplates() {
  return (
    <View style={styles.container}>
      <Text>Routine Templates</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});