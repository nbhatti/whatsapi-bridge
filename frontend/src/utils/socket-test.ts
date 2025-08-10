/**
 * Socket connection test utility
 * Use this to test socket connections and debug issues
 */

export const testSocketConnection = async (url: string, path: string, apiKey: string, deviceId: string) => {
  console.log('🧪 Testing socket connection...')
  console.log('URL:', url)
  console.log('Path:', path)
  console.log('API Key:', apiKey ? '✅ Set' : '❌ Missing')
  console.log('Device ID:', deviceId ? '✅ Set' : '❌ Missing')

  try {
    // Test if the backend is reachable
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      console.log('✅ Backend is reachable')
    } else {
      console.log('❌ Backend responded with status:', response.status)
    }
  } catch (error) {
    console.log('❌ Backend is not reachable:', error)
  }

  // Test WebSocket connection
  try {
    const ws = new WebSocket(`ws://${url.replace('http://', '')}${path}`)
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection opened')
      ws.close()
    }
    
    ws.onerror = (error) => {
      console.log('❌ WebSocket connection error:', error)
    }
    
    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed')
    }
  } catch (error) {
    console.log('❌ WebSocket connection failed:', error)
  }
}

export const logEnvironmentVariables = () => {
  console.log('🔧 Environment Variables Check:')
  console.log('NEXT_PUBLIC_WEBSOCKET_URL:', process.env.NEXT_PUBLIC_WEBSOCKET_URL || '❌ Not set')
  console.log('NEXT_PUBLIC_WEBSOCKET_PATH:', process.env.NEXT_PUBLIC_WEBSOCKET_PATH || '❌ Not set')
  console.log('NEXT_PUBLIC_API_KEY:', process.env.NEXT_PUBLIC_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('NEXT_PUBLIC_DISABLE_SOCKET:', process.env.NEXT_PUBLIC_DISABLE_SOCKET || 'false')
  console.log('NEXT_PUBLIC_ENABLE_WEBSOCKET:', process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET || 'false')
}
