package com.fastingtracker.app

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

class NotificationBridge(private val context: Context, private val activity: MainActivity) {

  @JavascriptInterface
  fun showNow(payload: String) {
    try {
      val json = JSONObject(payload)
      val title = json.getString("title")
      val body = json.getString("body")

      NotificationHelper.showImmediate(context, title, body)
      Log.d("FastFlow", "Test notification shown")
    } catch (e: Exception) {
      Log.e("FastFlow", "Notification test failed", e)
    }
  }

  @JavascriptInterface
  fun isNotificationsEnabled(): Boolean {
    val enabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
    val permissionGranted = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
      ContextCompat.checkSelfPermission(
        context,
        android.Manifest.permission.POST_NOTIFICATIONS
      ) == android.content.pm.PackageManager.PERMISSION_GRANTED
    } else {
      true
    }

    val result = enabled && permissionGranted
    Log.d("FastFlow", "Notifications enabled: $result")
    return result
  }

  @JavascriptInterface
  fun openNotificationSettings() {
    try {
      val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      Log.d("FastFlow", "Opened notification settings")
    } catch (e: Exception) {
      Log.e("FastFlow", "Failed to open notification settings", e)
    }
  }

  @JavascriptInterface
  fun requestPermission() {
    activity.requestPostNotificationsPermission(true)
  }
}
