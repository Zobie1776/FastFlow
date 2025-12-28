package com.fastingtracker.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class FastingWidgetProvider : AppWidgetProvider() {
  /**
   * Update the widget when the system requests it.
   */
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    updateAllWidgets(context, appWidgetManager, appWidgetIds)
    FastingWidgetScheduler.scheduleNext(context)
  }

  /**
   * Receive widget broadcasts and route update actions.
   */
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)

    when (intent.action) {
      ACTION_UPDATE_WIDGET,
      AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
        FastingWidgetScheduler.refreshAll(context)
        FastingWidgetScheduler.scheduleNext(context)
      }
    }
  }

  /**
   * Start update scheduling when the first widget is added.
   */
  override fun onEnabled(context: Context) {
    FastingWidgetScheduler.scheduleNext(context)
  }

  /**
   * Cancel update scheduling when the last widget is removed.
   */
  override fun onDisabled(context: Context) {
    FastingWidgetScheduler.cancel(context)
  }

  private fun updateAllWidgets(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    appWidgetIds.forEach { widgetId ->
      val views = buildRemoteViews(context)
      val launchIntent = Intent(context, MainActivity::class.java)
      val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      views.setOnClickPendingIntent(R.id.widgetRoot, pendingIntent)
      views.setOnClickPendingIntent(
        R.id.widgetStartButton,
        buildCommandIntent(context, ACTION_START_FAST, 1)
      )
      views.setOnClickPendingIntent(
        R.id.widgetStopButton,
        buildCommandIntent(context, ACTION_STOP_FAST, 2)
      )
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }

  private fun buildRemoteViews(context: Context): RemoteViews {
    return FastingWidgetRenderer.buildLarge(context)
  }

  private fun buildCommandIntent(
    context: Context,
    action: String,
    requestCode: Int
  ): PendingIntent {
    val intent = Intent(context, MainActivity::class.java).apply {
      this.action = action
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    return PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  companion object {
    private const val ACTION_UPDATE_WIDGET = "com.fastingtracker.app.ACTION_UPDATE_WIDGET"
    private const val ACTION_START_FAST = "ACTION_START_FAST"
    private const val ACTION_STOP_FAST = "ACTION_STOP_FAST"

    /**
     * Update all widgets for this provider.
     */
    fun updateWidgets(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
      appWidgetIds.forEach { widgetId ->
        val views = FastingWidgetRenderer.buildLarge(context)

        val launchIntent = Intent(context, MainActivity::class.java)
        val launchPending = PendingIntent.getActivity(
          context,
          0,
          launchIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widgetRoot, launchPending)

        val startIntent = Intent(context, MainActivity::class.java).apply {
          action = ACTION_START_FAST
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val startPending = PendingIntent.getActivity(
          context,
          1,
          startIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = Intent(context, MainActivity::class.java).apply {
          action = ACTION_STOP_FAST
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val stopPending = PendingIntent.getActivity(
          context,
          2,
          stopIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        views.setOnClickPendingIntent(R.id.widgetStartButton, startPending)
        views.setOnClickPendingIntent(R.id.widgetStopButton, stopPending)
        appWidgetManager.updateAppWidget(widgetId, views)
      }
    }
  }
}
