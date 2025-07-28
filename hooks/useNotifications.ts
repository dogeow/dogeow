'use client'

import { useEffect, useCallback, useRef } from 'react'
import useChatStore from '@/stores/chatStore'
import NotificationService from '@/lib/services/notificationService'

interface UseNotificationsOptions {
  enableSounds?: boolean
  enableBrowserNotifications?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    currentRoom,
    rooms,
    notificationSettings,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
  } = useChatStore()

  const notificationService = useRef(NotificationService.getInstance())
  const visibilityCleanupRef = useRef<(() => void) | null>(null)

  // Initialize notification service and request permissions
  useEffect(() => {
    const initializeNotifications = async () => {
      // Request browser notification permission if not already granted
      if (
        notificationSettings.browserNotifications &&
        browserNotificationPermission === 'default'
      ) {
        await requestBrowserNotificationPermission()
      }
    }

    initializeNotifications()
  }, [
    notificationSettings.browserNotifications,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
  ])

  // Handle visibility changes for notification management
  useEffect(() => {
    // Clean up previous listener
    if (visibilityCleanupRef.current) {
      visibilityCleanupRef.current()
    }

    // Set up new visibility change listener
    visibilityCleanupRef.current = notificationService.current.onVisibilityChange(isHidden => {
      // When tab becomes active, we could clear notifications for current room
      if (!isHidden && currentRoom) {
        // Clear room notifications when user returns to active tab
        useChatStore.getState().clearRoomNotifications(currentRoom.id)
      }
    })

    return () => {
      if (visibilityCleanupRef.current) {
        visibilityCleanupRef.current()
      }
    }
  }, [currentRoom])

  // Notification methods
  const notifyNewMessage = useCallback(
    (roomId: number, senderName: string, message: string) => {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const shouldPlaySound =
        notificationSettings.soundNotifications && options.enableSounds !== false

      const shouldShowBrowser =
        notificationSettings.browserNotifications &&
        notificationSettings.roomNotifications &&
        options.enableBrowserNotifications !== false &&
        browserNotificationPermission === 'granted'

      // Only notify if not in current room or tab is inactive
      const isCurrentRoom = currentRoom?.id === roomId
      const isTabInactive = notificationService.current.isTabInactive()

      if (!isCurrentRoom || isTabInactive) {
        if (shouldShowBrowser) {
          notificationService.current.notifyNewMessage(
            room.name,
            senderName,
            message,
            roomId,
            shouldPlaySound
          )
        } else if (shouldPlaySound) {
          notificationService.current.playSound('message')
        }
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options.enableSounds,
      options.enableBrowserNotifications,
    ]
  )

  const notifyMention = useCallback(
    (roomId: number, messageId: number, senderName: string, message: string) => {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const shouldPlaySound =
        notificationSettings.soundNotifications && options.enableSounds !== false

      const shouldShowBrowser =
        notificationSettings.browserNotifications &&
        notificationSettings.mentionNotifications &&
        options.enableBrowserNotifications !== false &&
        browserNotificationPermission === 'granted'

      if (shouldShowBrowser) {
        notificationService.current.notifyMention(
          room.name,
          senderName,
          message,
          roomId,
          messageId,
          shouldPlaySound
        )
      } else if (shouldPlaySound) {
        notificationService.current.playSound('mention')
      }
    },
    [
      rooms,
      notificationSettings,
      browserNotificationPermission,
      options.enableSounds,
      options.enableBrowserNotifications,
    ]
  )

  const notifyUserJoined = useCallback(
    (roomId: number, userName: string) => {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const shouldPlaySound =
        notificationSettings.soundNotifications && options.enableSounds !== false

      const shouldShowBrowser =
        notificationSettings.browserNotifications &&
        options.enableBrowserNotifications !== false &&
        browserNotificationPermission === 'granted'

      // Only notify for current room
      if (currentRoom?.id === roomId) {
        if (shouldShowBrowser) {
          notificationService.current.notifyUserJoined(room.name, userName, roomId, shouldPlaySound)
        } else if (shouldPlaySound) {
          notificationService.current.playSound('join', { volume: 0.3 })
        }
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options.enableSounds,
      options.enableBrowserNotifications,
    ]
  )

  const notifyUserLeft = useCallback(
    (roomId: number, userName: string) => {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const shouldPlaySound =
        notificationSettings.soundNotifications && options.enableSounds !== false

      const shouldShowBrowser =
        notificationSettings.browserNotifications &&
        options.enableBrowserNotifications !== false &&
        browserNotificationPermission === 'granted'

      // Only notify for current room
      if (currentRoom?.id === roomId) {
        if (shouldShowBrowser) {
          notificationService.current.notifyUserLeft(room.name, userName, roomId, shouldPlaySound)
        } else if (shouldPlaySound) {
          notificationService.current.playSound('leave', { volume: 0.3 })
        }
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options.enableSounds,
      options.enableBrowserNotifications,
    ]
  )

  const playSound = useCallback(
    (soundName: string, volume?: number) => {
      if (notificationSettings.soundNotifications && options.enableSounds !== false) {
        notificationService.current.playSound(soundName, { volume })
      }
    },
    [notificationSettings.soundNotifications, options.enableSounds]
  )

  const requestPermission = useCallback(async () => {
    return await requestBrowserNotificationPermission()
  }, [requestBrowserNotificationPermission])

  const isNotificationSupported = useCallback(() => {
    return notificationService.current.isNotificationSupported()
  }, [])

  const isTabInactive = useCallback(() => {
    return notificationService.current.isTabInactive()
  }, [])

  return {
    notifyNewMessage,
    notifyMention,
    notifyUserJoined,
    notifyUserLeft,
    playSound,
    requestPermission,
    isNotificationSupported,
    isTabInactive,
    notificationSettings,
    browserNotificationPermission,
  }
}

export default useNotifications
