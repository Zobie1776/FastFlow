package com.fastingtracker.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * 2x2 fasting widget provider.
 */
class FastingWidgetSmallProvider : AppWidgetProvider() {
  /**
   * Update the widget when the system requests it.
   */
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    updateWidgets(context, appWidgetManager, appWidgetIds)
    FastingWidgetScheduler.scheduleNext(context)
  }

  /**
   * Receive widget update broadcasts.
   */
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE ||
      intent.action == ACTION_UPDATE_WIDGET) {
      FastingWidgetScheduler.refreshAll(context)
      FastingWidgetScheduler.scheduleNext(context)
    }
  }

  companion object {
    private const val ACTION_UPDATE_WIDGET = "com.fastingtracker.app.ACTION_UPDATE_WIDGET"
    private const val ACTION_START_FAST = "ACTION_START_FAST"
    private const val ACTION_STOP_FAST = "ACTION_STOP_FAST"

    /**
     * Update all small widgets.
     */
    fun updateWidgets(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
      appWidgetIds.forEach { widgetId ->
        val views = buildRemoteViews(context)
        appWidgetManager.updateAppWidget(widgetId, views)
      }
    }

    private fun buildRemoteViews(context: Context): RemoteViews {
      val views = FastingWidgetRenderer.buildSmall(context)

      val launchIntent = Intent(context, MainActivity::class.java)
      val launchPending = PendingIntent.getActivity(
        context,
        0,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      views.setOnClickPendingIntent(R.id.widgetSmallRoot, launchPending)

      val startIntent = Intent(context, MainActivity::class.java).apply {
        action = ACTION_START_FAST
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
      val startPending = PendingIntent.getActivity(
        context,
        3,
        startIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      val stopIntent = Intent(context, MainActivity::class.java).apply {
        action = ACTION_STOP_FAST
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
      val stopPending = PendingIntent.getActivity(
        context,
        4,
        stopIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      views.setOnClickPendingIntent(R.id.widgetSmallStartButton, startPending)
      views.setOnClickPendingIntent(R.id.widgetSmallStopButton, stopPending)

      return views
    }
  }
}
