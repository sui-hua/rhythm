import { Text, View } from 'react-native'

export default function LoginPage() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Rhythm</Text>
      <Text style={{ marginTop: 8 }}>今日执行，从这里开始</Text>
    </View>
  )
}
