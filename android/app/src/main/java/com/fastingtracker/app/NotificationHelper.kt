package com.fastingtracker.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {
  private const val CHANNEL_ID = "fastflow_channel"
  private const val CHANNEL_NAME = "FastFlow Alerts"

  fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_DEFAULT
      )
      val manager = context.getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }

  fun showImmediate(context: Context, title: String, body: String) {
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .build()

    NotificationManagerCompat.from(context)
      .notify(System.currentTimeMillis().toInt(), notification)
  }
}
