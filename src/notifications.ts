import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

let audioCtx: AudioContext | null = null

const makeBeep = (frequency = 880, durationMs = 250) => {
  const ctx = audioCtx ?? new AudioContext()
  audioCtx = ctx

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.value = frequency
  gain.gain.value = 0.08

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start()
  setTimeout(() => {
    oscillator.stop()
  }, durationMs)
}

export const playAlarmBell = () => {
  ;[1046, 1318, 1568].forEach((f, i) => {
    setTimeout(() => makeBeep(f, 220), i * 220)
  })
}

export const notifyPomodoroComplete = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  const title = 'Pomodoro complete'
  const body = 'Great work. Time for a short break.'

  if (Capacitor.isNativePlatform()) {
    const permissions = await LocalNotifications.requestPermissions()
    if (permissions.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            sound: 'bell.wav',
            schedule: { at: new Date(Date.now() + 300) }
          }
        ]
      })
      return
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
