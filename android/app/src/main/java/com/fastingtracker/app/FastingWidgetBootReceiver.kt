package com.fastingtracker.app

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class FastingWidgetBootReceiver : BroadcastReceiver() {
  /**
   * Reschedule widget updates after device reboot.
   */
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      FastingWidgetScheduler.refreshAll(context)
      FastingWidgetScheduler.scheduleNext(context)
    }
  }
}
