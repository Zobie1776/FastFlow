package com.fastingtracker.app

import android.content.Context
import android.text.format.DateFormat
import android.widget.RemoteViews
import java.util.Date
import java.util.Locale
import kotlin.math.max

/**
 * Builds widget RemoteViews for fasting widgets.
 */
object FastingWidgetRenderer {
  /**
   * Build the 4x2 widget layout.
   */
  fun buildLarge(context: Context): RemoteViews {
    val state = getWidgetState(context)
    val views = RemoteViews(context.packageName, R.layout.widget_fasting_4x2)

    val protocolLabel = formatProtocolStatus(state)
    views.setTextViewText(R.id.widgetProtocolStatus, protocolLabel)
    views.setTextViewText(R.id.widgetElapsed, formatElapsed(state))
    views.setTextViewText(R.id.widgetPhase, formatPhase(state))
    views.setTextViewText(R.id.widgetWindow, formatWindow(context, state))

    return views
  }

  /**
   * Build the 2x2 widget layout.
   */
  fun buildSmall(context: Context): RemoteViews {
    val state = getWidgetState(context)
    val views = RemoteViews(context.packageName, R.layout.widget_fasting_2x2)

    views.setTextViewText(R.id.widgetSmallElapsed, formatElapsed(state))
    views.setTextViewText(R.id.widgetSmallStatus, formatProtocolStatus(state))

    return views
  }

  /**
   * Determine the next refresh interval in milliseconds.
   */
  fun nextRefreshInterval(state: WidgetFastingState): Long {
    if (!state.isFasting || state.startTimestamp == 0L) {
      return IDLE_REFRESH_MS
    }

    val now = System.currentTimeMillis()
    return if (state.plannedEndTimestamp > 0 && now > state.plannedEndTimestamp) {
      EXTENDED_REFRESH_MS
    } else {
      ACTIVE_REFRESH_MS
    }
  }

  private fun formatProtocolStatus(state: WidgetFastingState): String {
    val status = if (state.isFasting) "FASTING" else "EATING"
    return "${formatProtocolName(state.protocolId)} $status"
  }

  private fun formatProtocolName(protocolId: String): String {
    return when (protocolId) {
      "24_plus" -> "24+"
      "custom" -> "Custom"
      else -> protocolId.replace('_', ':')
    }
  }

  private fun formatElapsed(state: WidgetFastingState): String {
    if (!state.isFasting || state.startTimestamp == 0L) {
      return "00:00:00"
    }
    val elapsedMs = max(0, System.currentTimeMillis() - state.startTimestamp)
    val totalSeconds = elapsedMs / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
  }

  private fun formatWindow(context: Context, state: WidgetFastingState): String {
    if (state.startTimestamp == 0L || state.plannedEndTimestamp == 0L) {
      return "Start --:-- -> --:--"
    }
    val startText = formatTime(context, state.startTimestamp)
    val endText = formatTime(context, state.plannedEndTimestamp)
    return "Start $startText -> $endText"
  }

  private fun formatTime(context: Context, timestampMs: Long): String {
    val date = Date(timestampMs)
    val pattern = if (DateFormat.is24HourFormat(context)) "HH:mm" else "hh:mm a"
    val formatter = java.text.SimpleDateFormat(pattern, Locale.getDefault())
    return formatter.format(date)
  }

  private fun formatPhase(state: WidgetFastingState): String {
    if (!state.isFasting || state.startTimestamp == 0L) {
      return "Eating Window"
    }
    val elapsedHours = (System.currentTimeMillis() - state.startTimestamp) / (1000.0 * 60.0 * 60.0)
    return when {
      elapsedHours < 4 -> "Fed State"
      elapsedHours < 8 -> "Post-Absorptive"
      elapsedHours < 12 -> "Insulin Decline"
      elapsedHours < 16 -> "Glycogen Utilization"
      elapsedHours < 20 -> "Glycogen Waning"
      elapsedHours < 24 -> "Early Ketosis"
      elapsedHours < 48 -> "Established Ketosis"
      elapsedHours < 72 -> "Extended Fasting"
      else -> "Regenerative (72+ hours)"
    }
  }

  fun getWidgetState(context: Context): WidgetFastingState {
    val prefs = context.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE)
    val json = prefs.getString(WIDGET_STATE_KEY, null)

    if (json.isNullOrBlank()) {
      return WidgetFastingState(false, DEFAULT_PROTOCOL_ID, 0, 0, 0L, 0L)
    }

    return runCatching {
      val obj = org.json.JSONObject(json)
      WidgetFastingState(
        isFasting = obj.optBoolean(KEY_IS_FASTING, false),
        protocolId = obj.optString(KEY_PROTOCOL_ID, DEFAULT_PROTOCOL_ID),
        fastingHours = obj.optInt(KEY_FASTING_HOURS, 0),
        eatingHours = obj.optInt(KEY_EATING_HOURS, 0),
        startTimestamp = obj.optLong(KEY_START_TIMESTAMP, 0L),
        plannedEndTimestamp = obj.optLong(KEY_PLANNED_END_TIMESTAMP, 0L)
      )
    }.getOrElse {
      WidgetFastingState(false, DEFAULT_PROTOCOL_ID, 0, 0, 0L, 0L)
    }
  }

  data class WidgetFastingState(
    val isFasting: Boolean,
    val protocolId: String,
    val fastingHours: Int,
    val eatingHours: Int,
    val startTimestamp: Long,
    val plannedEndTimestamp: Long
  )

  private const val ACTIVE_REFRESH_MS = 60_000L
  private const val EXTENDED_REFRESH_MS = 5 * 60_000L
  private const val IDLE_REFRESH_MS = 15 * 60_000L
  private const val WIDGET_PREFS = "fasting_widget_state"
  private const val WIDGET_STATE_KEY = "widget_state_json"
  private const val KEY_IS_FASTING = "isFasting"
  private const val KEY_PROTOCOL_ID = "protocolId"
  private const val KEY_FASTING_HOURS = "fastingHours"
  private const val KEY_EATING_HOURS = "eatingHours"
  private const val KEY_START_TIMESTAMP = "startTimestamp"
  private const val KEY_PLANNED_END_TIMESTAMP = "plannedEndTimestamp"
  private const val DEFAULT_PROTOCOL_ID = "8_16"
}
