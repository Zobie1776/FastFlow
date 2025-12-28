package com.fastingtracker.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Handles widget start/stop intents and updates shared fasting state.
 */
class FastingActionReceiver : BroadcastReceiver() {
  /**
   * Respond to start/stop broadcasts.
   */
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_FAST_START -> {
        launchMainActivity(context, ACTION_FAST_START)
      }
      ACTION_FAST_STOP -> {
        launchMainActivity(context, ACTION_FAST_STOP)
      }
    }
  }

  private fun launchMainActivity(context: Context, action: String) {
    val intent = Intent(context, MainActivity::class.java).apply {
      this.action = action
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    context.startActivity(intent)
  }

  companion object {
    const val ACTION_FAST_START = "com.fastingtracker.app.ACTION_FAST_START"
    const val ACTION_FAST_STOP = "com.fastingtracker.app.ACTION_FAST_STOP"
    const val EXTRA_PROTOCOL_ID = "protocolId"
    const val EXTRA_FASTING_HOURS = "fastingHours"
    const val EXTRA_EATING_HOURS = "eatingHours"
  }
}
