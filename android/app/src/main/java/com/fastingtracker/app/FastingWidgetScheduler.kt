package com.fastingtracker.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Schedules widget updates using AlarmManager and WorkManager.
 */
object FastingWidgetScheduler {
  /**
   * Trigger an immediate widget refresh for both widget sizes.
   */
  fun refreshAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val largeIds = manager.getAppWidgetIds(ComponentName(context, FastingWidgetProvider::class.java))
    val smallIds = manager.getAppWidgetIds(ComponentName(context, FastingWidgetSmallProvider::class.java))

    FastingWidgetProvider.updateWidgets(context, manager, largeIds)
    FastingWidgetSmallProvider.updateWidgets(context, manager, smallIds)
  }

  /**
   * Schedule the next update based on fasting state.
   */
  fun scheduleNext(context: Context) {
    val state = FastingWidgetRenderer.getWidgetState(context)
    val intervalMs = FastingWidgetRenderer.nextRefreshInterval(state)

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(ACTION_UPDATE_WIDGET).apply {
      setPackage(context.packageName)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val triggerAt = System.currentTimeMillis() + intervalMs
    try {
      alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC, triggerAt, pendingIntent)
    } catch (error: SecurityException) {
      alarmManager.setWindow(AlarmManager.RTC, triggerAt, intervalMs / 2, pendingIntent)
    }

    scheduleFallbackWorker(context)
  }

  /**
   * Cancel the alarm-based updates.
   */
  fun cancel(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(ACTION_UPDATE_WIDGET).apply {
      setPackage(context.packageName)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    alarmManager.cancel(pendingIntent)
  }

  private fun scheduleFallbackWorker(context: Context) {
    val request = PeriodicWorkRequestBuilder<FastingWidgetUpdateWorker>(15, TimeUnit.MINUTES)
      .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      WORK_NAME,
      ExistingPeriodicWorkPolicy.UPDATE,
      request
    )
  }

  private const val ACTION_UPDATE_WIDGET = "com.fastingtracker.app.ACTION_UPDATE_WIDGET"
  private const val WORK_NAME = "fasting_widget_periodic"
}
